import { and, eq } from 'drizzle-orm';
import { KID_IDS, kidById, type KidId } from '../../shared/data';
import type { AudioEvent, CheckType, LineEvent, SpeakReason, StateEvent, Speaker, TimingsEvent, TurnEvent } from '../../shared/schemas';
import { judgeTurn } from '../ai/judge';
import { failsafeLine, generateLines, starterLine, type OutLine } from '../ai/kidLines';
import { models } from '../ai/clients';
import { speak } from '../ai/tts';
import { db, kidLevels, kidLines, turns } from '../db';
import { westernDigits } from '../lib/arabic';
import { since } from '../lib/timing';
import { applyLevels } from '../rules/levels';
import { chooseSpeakers, linaUnheard } from '../rules/speakers';
import type { LessonState } from './state';

export const TURN_BUDGET_MS = 16000;
const STARTER_KIDS: KidId[] = ['omar', 'sara', 'khaled'];

export interface TurnCtx {
  state: LessonState;
  text: string;
  source: 'voice' | 'typed' | 'script';
  teacherSeconds: number;
  clientTurnId: string | null;
  signal?: AbortSignal;
}

export async function* runTurn(ctx: TurnCtx): AsyncGenerator<TurnEvent> {
  const { state } = ctx;
  const T0 = performance.now();
  if (state.busy) {
    yield { event: 'busy', data: {} };
    return;
  }
  state.busy = true;
  try {
    const turnNo = state.turnNo + 1;
    const transcript = westernDigits(ctx.text).trim().slice(0, 1500);
    const budgetLeft = () => TURN_BUDGET_MS - since(T0);

    // 1-2. judge
    const j = await judgeTurn({
      topicId: state.topicId, levels: state.levels, transcript,
      previous: state.pendingQuestion
        ? [...state.last3, { turnNo: state.turnNo, transcript: `[${kidById(state.pendingQuestion.kid).name.en} raised a hand and asked the teacher: "${state.pendingQuestion.text}"]` }]
        : state.last3,
      signal: ctx.signal, budgetLeftMs: budgetLeft,
    });

    // 3. rules
    const tr0 = performance.now();
    const { levels, changes } = applyLevels(state.levels, j.ok ? j.out : null);
    const check: CheckType = j.ok ? j.out!.check : 'none';
    const askedKid: KidId | null = j.ok ? j.out!.asked_kid : null;
    let chorus = false;
    let speakers: Speaker[] = [];
    let failsafeStage: string | null = null;
    if (j.ok) {
      ({ chorus, speakers } = chooseSpeakers({ levels, changes, check, askedKid }));
    } else {
      failsafeStage = 'judge';
      const kid = (['omar', 'sara', 'khaled', 'yazan'] as KidId[]).find((k) => levels[k] === 0);
      if (kid) speakers = [{ kid, reason: 'objection' }];
    }
    const linaAskedNow = state.linaAsked || askedKid === 'lina';
    const rulesMs = since(tr0);

    const stateEv: StateEvent = {
      turnNo, levels: changes, check, askedKid, chorus,
      linaPulse: linaUnheard(turnNo, levels, linaAskedNow),
      speakers,
      judge: { model: j.model, attempts: j.attempts, ok: j.ok, ms: j.ms },
    };
    yield { event: 'state', data: stateEv };
    if (failsafeStage) yield { event: 'failsafe', data: { stage: failsafeStage, reason: j.error ?? 'judge failed', turnNo } };
    if (j.evidenceMismatch.length) yield { event: 'failsafe', data: { stage: 'evidence_mismatch', reason: j.evidenceMismatch.join(','), turnNo } };

    // persistence helper
    const lineRows: { idx: number; kid: KidId; reason: SpeakReason; text: string; text_en: string; say: string; source: string }[] = [];
    const timings: TimingsEvent = {
      judgeMs: j.ms, judgeAttempts: j.attempts, rulesMs, linesMs: 0, ttsMs: [], dbMs: 0, totalMs: 0,
      models: { judge: j.model, lines: null, tts: models.tts() },
    };
    const save = async () => {
      const t = performance.now();
      try {
        await db.transaction(async (tx) => {
          await tx.insert(turns).values({
            lessonId: state.id, turnNo, clientTurnId: ctx.clientTurnId, source: ctx.source, transcript,
            teacherSeconds: ctx.teacherSeconds || 0, checkType: check, askedKid, chorus, failsafe: failsafeStage,
            judgeJson: j.out, levelsAfter: levels, timingsJson: timings,
          });
          await tx.insert(kidLevels).values(
            KID_IDS.map((k) => ({
              lessonId: state.id, turnNo, kidId: k, level: levels[k], change: changes[k].change,
              helped: changes[k].helped, hurt: changes[k].hurt, evidence: changes[k].evidence,
            })),
          );
          if (lineRows.length) {
            await tx.insert(kidLines).values(
              lineRows.map((l) => ({ lessonId: state.id, turnNo, idx: l.idx, kidId: l.kid, reason: l.reason, text: l.text, textEn: l.text_en, say: l.say, source: l.source })),
            );
          }
        });
        return { ok: true as const, ms: since(t) };
      } catch (e: any) {
        console.error('[turn] db write failed', e.message);
        return { ok: false as const, ms: since(t), error: String(e.message) };
      }
    };
    const commitMemory = () => {
      state.levels = levels;
      state.turnNo = turnNo;
      state.last3 = [...state.last3, { turnNo, transcript }].slice(-3);
      state.linaAsked = linaAskedNow;
      state.lastTranscript = transcript;
      state.pendingQuestion = null;
    };

    // 4. chorus
    if (chorus) {
      yield { event: 'chorus', data: { lang: state.language, title: state.title, turnNo } };
      const r = await save();
      commitMemory();
      timings.dbMs = r.ms;
      timings.totalMs = since(T0);
      if (!r.ok) yield { event: 'failsafe', data: { stage: 'db', reason: r.error, turnNo } };
      yield { event: 'timings', data: { ...timings, turnNo } };
      yield { event: 'done', data: { turnNo } };
      return;
    }

    // 5. lines
    const tl0 = performance.now();
    const outLines: OutLine[] = new Array(speakers.length);
    const needAI: { s: Speaker; i: number }[] = [];
    speakers.forEach((s, i) => {
      if (failsafeStage) {
        const f = failsafeLine(s.kid, state.language);
        outLines[i] = { kid: s.kid, reason: s.reason, ...f, source: 'canned' };
      } else if (s.reason === 'objection' && STARTER_KIDS.includes(s.kid) && !state.startersUsed.has(s.kid)) {
        const st = starterLine(state.topicId, s.kid, state.language, state.title);
        if (st) { outLines[i] = { kid: s.kid, reason: s.reason, ...st, source: 'starter' }; return; }
        needAI.push({ s, i });
      } else needAI.push({ s, i });
    });
    if (needAI.length) {
      const g = await generateLines({
        topicId: state.topicId, lang: state.language, title: state.title,
        transcript: state.pendingQuestion ? `(answering ${kidById(state.pendingQuestion.kid).name.en}'s question "${state.pendingQuestion.text}") ${transcript}` : transcript,
        signal: ctx.signal,
        speakers: needAI.map((x) => x.s), levels,
      });
      timings.models.lines = g.model;
      g.lines.forEach((l, k) => (outLines[needAI[k].i] = l));
      if (!g.ok) yield { event: 'failsafe', data: { stage: 'lines', reason: g.error ?? 'lines failed', turnNo } };
    }
    timings.linesMs = since(tl0);

    // 6. line events + parallel voices
    const dbPromise = (async () => {
      outLines.forEach((l, i) => lineRows.push({ idx: i, kid: l.kid, reason: l.reason, text: l.text, text_en: l.text_en, say: l.say, source: l.source }));
      return save();
    })();
    const voiceP = outLines.map((l) => speak(l.kid, state.language, l.say, ctx.signal));
    for (let i = 0; i < outLines.length; i++) {
      const l = outLines[i];
      const ev: LineEvent & { turnNo: number } = { idx: i, kid: l.kid, reason: l.reason, text: l.text, text_en: l.text_en, source: l.source === 'ai' ? 'ai' : l.source, turnNo };
      if (failsafeStage) ev.source = 'failsafe';
      yield { event: 'line', data: ev };
    }
    // 7. audio in idx order
    for (let i = 0; i < outLines.length; i++) {
      const r = await voiceP[i];
      timings.ttsMs.push(r.ms);
      const kid = outLines[i].kid;
      if (!r.ok) {
        yield { event: 'audio_failed', data: { idx: i, kid, turnNo } };
        yield { event: 'failsafe', data: { stage: 'tts', reason: r.reason, turnNo, kid } };
        continue;
      }
      const a: AudioEvent = r.source === 'pre'
        ? { idx: i, kid, mime: r.mime, url: r.url, source: 'pre', ms: r.ms }
        : { idx: i, kid, mime: r.mime, b64: r.b64, source: r.source, ms: r.ms };
      yield { event: 'audio', data: { ...a, turnNo } };
    }

    // 8. DB
    const dbr = await dbPromise;
    commitMemory();
    for (const l of outLines) if (l.source === 'starter') state.startersUsed.add(l.kid);
    timings.dbMs = dbr.ms;
    timings.totalMs = since(T0);
    if (!dbr.ok) yield { event: 'failsafe', data: { stage: 'db', reason: dbr.error, turnNo } };
    else db.update(turns).set({ timingsJson: timings }).where(and(eq(turns.lessonId, state.id), eq(turns.turnNo, turnNo))).catch(() => {});
    yield { event: 'timings', data: { ...timings, turnNo } };
    yield { event: 'done', data: { turnNo } };
  } finally {
    state.busy = false;
  }
}
