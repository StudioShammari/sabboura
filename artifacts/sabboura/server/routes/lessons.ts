import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import { and, asc, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { KID_IDS, startLevels, topics, type KidId, type Lang, type Levels, type Title } from '../../shared/data';
import type { ScoreJson } from '../../shared/schemas';
import { db, kidLevels, kidLines, lessons, turns } from '../db';
import { transcribe } from '../ai/stt';
import { scoreWithAI, fallbackFeedback } from '../ai/scorer';
import { computeScore, withClarity, type TurnRec } from '../rules/score';
import { runTurn } from '../turn/runTurn';
import { runQuestion } from '../turn/runQuestion';
import { openSSE } from '../turn/sse';
import { dropState, getState, putState } from '../turn/state';
import { since, withTimeout } from '../lib/timing';

export const lessonsRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024 } });

const CreateBody = z.object({
  topicId: z.string().default('fractions'),
  language: z.enum(['ar', 'en']),
  teacherTitle: z.enum(['miss', 'sir']),
  deviceId: z.string().max(80).optional(),
  previousLessonId: z.string().uuid().optional(),
});

lessonsRouter.post('/lessons', async (req, res) => {
  const p = CreateBody.safeParse(req.body);
  if (!p.success) return void res.status(400).json({ error: 'bad request' });
  const b = p.data;
  const topicId = topics.some((t) => t.id === b.topicId) ? b.topicId : topics[0].id;
  let attemptNo = 1;
  if (b.previousLessonId) {
    const [prev] = await db.select().from(lessons).where(eq(lessons.id, b.previousLessonId)).limit(1);
    if (prev) attemptNo = prev.attemptNo + 1;
  }
  const [l] = await db.insert(lessons).values({
    topicId, language: b.language, teacherTitle: b.teacherTitle, deviceId: b.deviceId ?? null,
    attemptNo, previousLessonId: b.previousLessonId ?? null,
  }).returning();
  const levels = startLevels(topicId);
  putState({
    id: l.id, topicId, language: b.language, title: b.teacherTitle, attemptNo, levels, turnNo: 0, last3: [],
    busy: false, startersUsed: new Set(), linaAsked: false, lastTranscript: '', pendingQuestion: null, askedQuestions: [], kidSaid: [], startedAt: Date.now(),
  });
  res.status(201).json({ lessonId: l.id, turnNo: 0, levels });
});

lessonsRouter.get('/lessons/:id', async (req, res) => {
  const s = await getState(String(req.params.id));
  if (!s) return void res.status(404).json({ error: 'not found' });
  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, s.id)).limit(1);
  const ts = await db.select().from(turns).where(eq(turns.lessonId, s.id)).orderBy(asc(turns.turnNo));
  const ls = await db.select().from(kidLines).where(eq(kidLines.lessonId, s.id)).orderBy(asc(kidLines.turnNo), asc(kidLines.idx));
  res.json({
    lesson: { id: lesson.id, topicId: lesson.topicId, language: lesson.language, teacherTitle: lesson.teacherTitle, attemptNo: lesson.attemptNo, ended: !!lesson.endedAt },
    turnNo: s.turnNo,
    levels: s.levels,
    turns: ts.map((t) => ({
      turnNo: t.turnNo, transcript: t.transcript, checkType: t.checkType, chorus: t.chorus, levelsAfter: t.levelsAfter,
      lines: ls.filter((l) => l.turnNo === t.turnNo).map((l) => ({ kid: l.kidId, text: l.text })),
    })),
  });
});

lessonsRouter.post('/lessons/:id/transcribe', upload.single('audio'), async (req, res) => {
  const t0 = performance.now();
  const s = await getState(String(req.params.id));
  if (!s) return void res.status(404).json({ error: 'not found' });
  const f = req.file;
  const durationMs = Number(req.body?.durationMs ?? 0);
  if (!f || f.size < 200) return void res.json({ transcript: '', empty: true, seconds: 0, sttMs: 0 });
  try {
    const r = await transcribe({ buf: f.buffer, mime: String(req.body?.mime || f.mimetype || 'audio/webm'), lang: s.language, topicId: s.topicId });
    res.json({ transcript: r.transcript, empty: r.empty, seconds: Math.round(durationMs / 100) / 10, sttMs: since(t0) });
  } catch (e: any) {
    console.warn('[stt] failed', e.message);
    res.json({ transcript: '', empty: true, seconds: 0, sttMs: since(t0), failed: true });
  }
});

const TurnBody = z.object({
  text: z.string().min(1).max(3000),
  source: z.enum(['voice', 'typed', 'script']).default('typed'),
  teacherSeconds: z.number().min(0).max(600).default(0),
  clientTurnId: z.string().max(80).nullable().optional(),
});

lessonsRouter.post('/lessons/:id/turn', async (req: Request, res: Response) => {
  const p = TurnBody.safeParse(req.body);
  if (!p.success) return void res.status(400).json({ error: 'bad request' });
  const s = await getState(String(req.params.id));
  if (!s) return void res.status(404).json({ error: 'not found' });
  const wantsSSE = String(req.headers.accept ?? '').includes('text/event-stream') && process.env.USE_SSE !== '0';
  const ctx = { state: s, text: p.data.text, source: p.data.source, teacherSeconds: p.data.teacherSeconds, clientTurnId: p.data.clientTurnId ?? null };
  if (wantsSSE) {
    const sse = openSSE(req, res);
    try {
      for await (const ev of runTurn({ ...ctx, signal: sse.signal })) sse.send(ev);
    } catch (e: any) {
      console.error('[turn] crashed', e);
      sse.send({ event: 'failsafe', data: { stage: 'crash', reason: String(e?.message ?? e), turnNo: s.turnNo + 1 } });
      sse.send({ event: 'done', data: { turnNo: s.turnNo } });
    } finally {
      sse.end();
    }
    return;
  }
  const events: unknown[] = [];
  try {
    for await (const ev of runTurn(ctx)) events.push(ev);
  } catch (e: any) {
    console.error('[turn] crashed', e);
    events.push({ event: 'failsafe', data: { stage: 'crash', reason: String(e?.message ?? e), turnNo: s.turnNo + 1 } }, { event: 'done', data: { turnNo: s.turnNo } });
  }
  res.json({ events });
});

lessonsRouter.post('/lessons/:id/call-on', async (req: Request, res: Response) => {
  const p = z.object({ kid: z.enum(KID_IDS) }).safeParse(req.body);
  if (!p.success) return void res.status(400).json({ error: 'bad request' });
  const s = await getState(String(req.params.id));
  if (!s) return void res.status(404).json({ error: 'not found' });
  const sse = openSSE(req, res);
  try {
    for await (const ev of runQuestion(s, p.data.kid, sse.signal)) sse.send(ev);
  } catch (e: any) {
    console.error('[call-on] crashed', e);
    sse.send({ event: 'done', data: { turnNo: s.turnNo } });
  } finally {
    sse.end();
  }
});

lessonsRouter.post('/lessons/:id/redo', async (req, res) => {
  const s = await getState(String(req.params.id));
  if (!s) return void res.status(404).json({ error: 'not found' });
  if (s.busy) return void res.status(409).json({ error: 'busy' });
  if (s.turnNo > 0) {
    const n = s.turnNo;
    await db.transaction(async (tx) => {
      await tx.delete(kidLines).where(and(eq(kidLines.lessonId, s.id), eq(kidLines.turnNo, n)));
      await tx.delete(kidLevels).where(and(eq(kidLevels.lessonId, s.id), eq(kidLevels.turnNo, n)));
      await tx.delete(turns).where(and(eq(turns.lessonId, s.id), eq(turns.turnNo, n)));
    });
  }
  const last = s.lastTranscript;
  dropState(s.id);
  const ns = await getState(s.id);
  res.json({ turnNo: ns?.turnNo ?? 0, levels: ns?.levels ?? s.levels, lastTranscript: last });
});

async function turnRecs(lessonId: string): Promise<{ recs: TurnRec[]; start: Levels }> {
  const [l] = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1);
  const ts = await db.select().from(turns).where(eq(turns.lessonId, lessonId)).orderBy(asc(turns.turnNo));
  const lv = await db.select().from(kidLevels).where(eq(kidLevels.lessonId, lessonId));
  const ln = await db.select().from(kidLines).where(eq(kidLines.lessonId, lessonId)).orderBy(asc(kidLines.turnNo), asc(kidLines.idx));
  const recs: TurnRec[] = ts.map((t) => {
    const changes: TurnRec['changes'] = {};
    for (const r of lv.filter((x) => x.turnNo === t.turnNo)) changes[r.kidId as KidId] = { change: r.change, evidence: r.evidence };
    return {
      turnNo: t.turnNo, transcript: t.transcript, check: t.checkType as TurnRec['check'], askedKid: (t.askedKid as KidId | null) ?? null,
      chorus: t.chorus, levelsAfter: t.levelsAfter as Levels, changes,
      lines: ln.filter((x) => x.turnNo === t.turnNo).map((x) => ({ kid: x.kidId as KidId, reason: x.reason, text: x.text })),
      teacherSeconds: t.teacherSeconds,
    };
  });
  return { recs, start: startLevels(l.topicId) };
}

async function buildScore(lessonId: string, force: boolean): Promise<ScoreJson | null> {
  const [l] = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1);
  if (!l) return null;
  if (l.scoreJson && !force) return l.scoreJson as ScoreJson;
  const { recs, start } = await turnRecs(lessonId);
  let score = computeScore({
    turns: recs, startLevels: start, topicId: l.topicId, language: l.language as Lang, title: l.teacherTitle as Title,
    seconds: Math.round(recs.reduce((a, t) => a + t.teacherSeconds, 0)), attemptNo: l.attemptNo,
  });
  let ai;
  try {
    ai = await withTimeout(scoreWithAI({ score, turns: recs }), 25000, 'scorer timeout');
  } catch {
    ai = fallbackFeedback(score, score.language);
  }
  score = withClarity({ ...score, ai }, ai.clarity);
  await db.update(lessons).set({ scoreJson: score, endedAt: new Date() }).where(eq(lessons.id, lessonId));
  return score;
}

lessonsRouter.post('/lessons/:id/end', async (req, res) => {
  if (!(await getState(String(req.params.id)))) return void res.status(404).json({ error: 'not found' });
  const score = await buildScore(req.params.id, true);
  res.json({ scoreUrl: `/lesson/${req.params.id}/score`, score });
});

lessonsRouter.get('/lessons/:id/score', async (req, res) => {
  if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) return void res.status(404).json({ error: 'not found' });
  const score = await buildScore(req.params.id, false);
  if (!score) return void res.status(404).json({ error: 'not found' });
  res.json(score);
});

lessonsRouter.get('/lessons/:id/replay', async (req, res) => {
  const s = await getState(String(req.params.id));
  if (!s) return void res.status(404).json({ error: 'not found' });
  const ts = await db.select().from(turns).where(eq(turns.lessonId, s.id)).orderBy(asc(turns.turnNo));
  const lv = await db.select().from(kidLevels).where(eq(kidLevels.lessonId, s.id));
  const ln = await db.select().from(kidLines).where(eq(kidLines.lessonId, s.id)).orderBy(asc(kidLines.turnNo), asc(kidLines.idx));
  res.json({
    language: s.language, title: s.title, topicId: s.topicId,
    turns: ts.map((t) => ({
      turnNo: t.turnNo, transcript: t.transcript, chorus: t.chorus, checkType: t.checkType, askedKid: t.askedKid,
      state: Object.fromEntries(KID_IDS.map((k) => {
        const r = lv.find((x) => x.turnNo === t.turnNo && x.kidId === k);
        return [k, { to: r?.level ?? 0, change: r?.change ?? 0, evidence: r?.evidence ?? null }];
      })),
      lines: ln.filter((l) => l.turnNo === t.turnNo).map((l) => ({
        idx: l.idx, kid: l.kidId, text: l.text, text_en: l.textEn ?? l.text,
        audioUrl: `/api/tts?kid=${l.kidId}&lang=${s.language}&text=${encodeURIComponent(l.say ?? l.text)}`,
      })),
    })),
  });
});

lessonsRouter.get('/lessons/:id/debug', async (req, res) => {
  if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) return void res.status(404).json({ error: 'not found' });
  const ts = await db.select().from(turns).where(eq(turns.lessonId, req.params.id)).orderBy(desc(turns.turnNo));
  res.json({ turns: ts.map((t) => ({ turnNo: t.turnNo, transcript: t.transcript, failsafe: t.failsafe, timings: t.timingsJson, judge: t.judgeJson })) });
});
