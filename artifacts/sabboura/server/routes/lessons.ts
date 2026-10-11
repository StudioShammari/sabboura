import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import { and, asc, desc, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { KID_IDS, registerTopic, startLevels, topics, uploadedTopic, type TopicDef, type KidId, type Lang, type Levels, type Title } from '../../shared/data';
import type { ScoreJson } from '../../shared/schemas';
import { bodyTurns, db, kidLevels, kidLines, lessons, packs, turns } from '../db';
import { bodyNotes, cleanMetrics, type BodyMetrics } from '../../shared/bodyNotes';
import type { PackInfo } from '../../shared/pack';
import { transcribe } from '../ai/stt';
import { scoreWithAI, fallbackFeedback } from '../ai/scorer';
import { computeScore, withClarity, type TurnRec } from '../rules/score';
import { runTurn } from '../turn/runTurn';
import { runQuestion } from '../turn/runQuestion';
import { openSSE } from '../turn/sse';
import { beginWork, closeLesson, dropState, getState, isClosed, putState } from '../turn/state';
import { since, withTimeout } from '../lib/timing';
import { cleanPlan, defaultPlan, PLAN_KINDS, type Plan, type PlanCheck } from '../../shared/plan';
import { checkPlanAI, checkPlanCode } from '../plan/checkPlan';
import { backRowDriftTurns, backRowLevels, isLarge, normalizeSetting, swapFromDefault, type ClassSetting } from '../../shared/setting';

export const lessonsRouter = Router();
lessonsRouter.param('id', (req, res, next, id) => {
  if (!z.string().uuid().safeParse(id).success) return void res.status(400).json({ error: 'bad request' });
  req.params.id = id.toLowerCase();
  next();
});
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024 } });

const PlanBody = z.object({
  goal: z.string().max(600),
  steps: z.array(z.object({ kind: z.enum(PLAN_KINDS), text: z.string().max(600) })).max(12),
});

const CreateBody = z.object({
  topicId: z.string().default('fractions'),
  packId: z.string().max(80).optional(),
  plan: PlanBody.optional(),
  language: z.enum(['ar', 'en']),
  teacherTitle: z.enum(['miss', 'sir']),
  deviceId: z.string().max(80).optional(),
  previousLessonId: z.string().uuid().optional(),
  setting: z.unknown().optional(),
  /** Stand-up mode (camera on the teacher's device; only per-turn numbers are saved). */
  standup: z.boolean().optional(),
});

lessonsRouter.post('/lessons', async (req, res) => {
  const p = CreateBody.safeParse(req.body);
  if (!p.success) return void res.status(400).json({ error: 'bad request' });
  const b = p.data;
  let wanted = b.packId?.startsWith('lib-') ? b.packId.slice(4) : b.topicId;
  let topicJson: TopicDef | null = null;
  let packPlan: Plan | null = null;
  if (b.packId && !b.packId.startsWith('lib-')) {
    // an uploaded lesson: the pack decides the topic, and the lesson freezes it
    const [row] = await db.select().from(packs).where(eq(packs.id, b.packId)).limit(1);
    const info = row?.status === 'ready' ? (row.packJson as PackInfo) : null;
    if (!info) return void res.status(404).json({ error: 'pack not ready' });
    if (info.topic) { registerTopic(info.topic); topicJson = info.topic; wanted = info.topic.id; } else wanted = info.libraryTopicId ?? 'fractions';
    packPlan = { goal: info.plan.objective, steps: info.plan.steps.map((s) => ({ ...s })) };
  }
  const topicId = topics.some((t) => t.id === wanted) ? wanted : topics[0].id;
  const packId = b.packId ?? `lib-${topicId}`;
  const given = b.plan ? cleanPlan(b.plan) : null;
  const setting = normalizeSetting(b.setting);
  const base: Plan = given && given.steps.length ? given : packPlan ?? defaultPlan(topicId, b.language, setting);
  // plan text written for the default class names the default kids: show this class's names instead
  const plan: Plan = { goal: swapFromDefault(base.goal, setting), steps: base.steps.map((s) => ({ ...s, text: swapFromDefault(s.text, setting) })) };
  let attemptNo = 1;
  if (b.previousLessonId) {
    const [prev] = await db.select().from(lessons).where(eq(lessons.id, b.previousLessonId)).limit(1);
    if (prev) attemptNo = prev.attemptNo + 1;
  }
  const [l] = await db.insert(lessons).values({
    topicId, language: b.language, teacherTitle: b.teacherTitle, deviceId: b.deviceId ?? null,
    attemptNo, previousLessonId: b.previousLessonId ?? null, packId, planJson: plan, topicJson, settingJson: setting,
    ...(b.standup ? { standup: true } : {}),
  }).returning();
  const levels = startLevels(topicId);
  putState({
    id: l.id, topicId, language: b.language, title: b.teacherTitle, attemptNo, levels, turnNo: 0, last3: [],
    busy: false, startersUsed: new Set(), linaAsked: false, lastTranscript: '', pendingQuestion: null, askedQuestions: [], taught: false, kidSaid: [], startedAt: Date.now(), setting, hist: [],
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
    lesson: { id: lesson.id, topicId: lesson.topicId, language: lesson.language, teacherTitle: lesson.teacherTitle, attemptNo: lesson.attemptNo, ended: !!lesson.endedAt, packId: lesson.packId, plan: (lesson.planJson as Plan | null) ?? null, setting: s.setting, standup: !!lesson.standup },
    topic: uploadedTopic(lesson.topicId),
    turnNo: s.turnNo,
    levels: s.levels,
    backRow: isLarge(s.setting) ? backRowLevels(s.hist).at(-1) ?? 0 : null,
    turns: ts.map((t) => ({
      turnNo: t.turnNo, transcript: t.transcript, checkType: t.checkType, chorus: t.chorus, levelsAfter: t.levelsAfter,
      lines: ls.filter((l) => l.turnNo === t.turnNo).map((l) => ({ kid: l.kidId, text: l.text })),
    })),
  });
});

lessonsRouter.post('/lessons/:id/transcribe', (req, res, next) => {
  upload.single('audio')(req, res, (err: any) => {
    if (err) return void res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: 'bad request' });
    next();
  });
}, async (req, res) => {
  const t0 = performance.now();
  const s = await getState(String(req.params.id));
  if (!s) return void res.status(404).json({ error: 'not found' });
  const f = req.file;
  if (req.body?.durationMs !== undefined && !['string', 'number'].includes(typeof req.body.durationMs)) return void res.status(400).json({ error: 'bad request' });
  if (req.body?.mime !== undefined && typeof req.body.mime !== 'string') return void res.status(400).json({ error: 'bad request' });
  const durationMs = Number(req.body?.durationMs ?? 0);
  if (!Number.isFinite(durationMs) || durationMs < 0) return void res.status(400).json({ error: 'bad request' });
  if (!f || f.size < 200) return void res.json({ transcript: '', empty: true, seconds: 0, sttMs: 0 });
  try {
    const r = await transcribe({ buf: f.buffer, mime: String(req.body?.mime || f.mimetype || 'audio/webm'), lang: s.language, topicId: s.topicId, setting: s.setting });
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
  const release = beginWork(s.id);
  if (!release) return void res.status(409).json({ error: isClosed(s.id) ? 'lesson ended' : 'busy' });
  try {
    if (s.turnNo > 0) {
      const n = s.turnNo;
      await db.transaction(async (tx) => {
        await tx.delete(kidLines).where(and(eq(kidLines.lessonId, s.id), eq(kidLines.turnNo, n)));
        await tx.delete(kidLevels).where(and(eq(kidLevels.lessonId, s.id), eq(kidLevels.turnNo, n)));
        await tx.delete(turns).where(and(eq(turns.lessonId, s.id), eq(turns.turnNo, n)));
        await tx.delete(bodyTurns).where(and(eq(bodyTurns.lessonId, s.id), eq(bodyTurns.turnNo, n)));
      });
    }
    const last = s.lastTranscript;
    dropState(s.id);
    const ns = await getState(s.id);
    res.json({ turnNo: ns?.turnNo ?? 0, levels: ns?.levels ?? s.levels, lastTranscript: last });
  } finally { release(); }
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

async function buildScore(lessonId: string): Promise<ScoreJson | null> {
  const [l] = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1);
  if (!l?.endedAt) return null;
  if (l.scoreJson) return l.scoreJson as ScoreJson;
  const { recs, start } = await turnRecs(lessonId);
  const setting = normalizeSetting(l.settingJson);
  let score = computeScore({
    turns: recs, startLevels: start, topicId: l.topicId, language: l.language as Lang, title: l.teacherTitle as Title,
    seconds: Math.round(recs.reduce((a, t) => a + t.teacherSeconds, 0)), attemptNo: l.attemptNo,
  });
  let ai;
  // nothing was said: there is nothing for the AI judge to read, so the fixed feedback is used
  if (recs.length === 0) ai = fallbackFeedback(score, score.language, setting);
  else try {
    ai = await withTimeout(scoreWithAI({ score, turns: recs, setting }), 25000, 'scorer timeout');
  } catch {
    ai = fallbackFeedback(score, score.language, setting);
  }
  const levels = backRowLevels(recs.map((t) => ({ seconds: t.teacherSeconds, check: t.check, askedKid: t.askedKid })));
  const backRow = isLarge(setting) ? { levels, drift: backRowDriftTurns(levels) } : null;
  score = withClarity({ ...score, ai, setting, back_row: backRow }, ai.clarity);
  await db.update(lessons).set({ scoreJson: score }).where(eq(lessons.id, lessonId));
  return score;
}

// ---------------- plan checklist (never part of the score) ----------------
const planJobs = new Map<string, Promise<void>>();

/** Saves the code rows at once; the AI rows finish in the background. Resolves after the code rows are saved. */
async function startPlanCheck(lessonId: string): Promise<void> {
  if (planJobs.has(lessonId)) return;
  let release: () => void = () => {};
  const gate = new Promise<void>((r) => { release = r; });
  const job = (async () => {
    try {
      const [l] = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1);
      if (!l?.planJson) return;
      if ((l.planCheckJson as PlanCheck | null)?.status === 'done') return;
      const { recs } = await turnRecs(lessonId);
      const inp = { language: l.language as Lang, topicId: l.topicId, plan: l.planJson as Plan, turns: recs, setting: normalizeSetting(l.settingJson) };
      const code = checkPlanCode(inp);
      await db.update(lessons).set({ planCheckJson: code }).where(eq(lessons.id, lessonId));
      release();
      if (code.status === 'done') return;
      const full = await checkPlanAI(inp, code, lessonId);
      await db.update(lessons).set({ planCheckJson: full }).where(eq(lessons.id, lessonId));
    } catch (e: any) {
      console.warn('[plan] check failed', String(e?.message ?? e));
    } finally {
      release();
      planJobs.delete(lessonId);
    }
  })();
  planJobs.set(lessonId, job);
  await gate;
}

lessonsRouter.get('/lessons/:id/plan-check', async (req, res) => {
  const id = String(req.params.id);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return void res.status(404).json({ error: 'not found' });
  let [l] = await db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
  if (!l) return void res.status(404).json({ error: 'not found' });
  const check = l.planCheckJson as PlanCheck | null;
  if (l.planJson && l.endedAt && (!check || (check.status === 'pending' && !planJobs.has(id)))) {
    await startPlanCheck(id);
    [l] = await db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
  }
  res.json({ packId: l.packId, setting: normalizeSetting(l.settingJson), plan: l.planJson ?? null, check: (l.planCheckJson as PlanCheck | null) ?? null });
});

const scoreJobs = new Map<string, Promise<ScoreJson | null>>();
function finalScore(id: string) {
  let job = scoreJobs.get(id);
  if (!job) {
    job = buildScore(id).finally(() => scoreJobs.delete(id));
    scoreJobs.set(id, job);
  }
  return job;
}
const endJobs = new Map<string, Promise<ScoreJson | null>>();
function endLesson(id: string) {
  let job = endJobs.get(id);
  if (!job) {
    const completed = closeLesson(id);
    job = (async () => {
      // Never score a partial turn, even if the HTTP caller times out.
      await completed;
      await db.update(lessons).set({ endedAt: new Date() }).where(and(eq(lessons.id, id), isNull(lessons.endedAt)));
      const [score] = await Promise.all([finalScore(id), startPlanCheck(id)]);
      return score;
    })().finally(() => endJobs.delete(id));
    endJobs.set(id, job);
  }
  return job;
}

lessonsRouter.post('/lessons/:id/end', async (req, res) => {
  const id = String(req.params.id);
  if (!(await getState(id))) return void res.status(404).json({ error: 'not found' });
  try {
    const score = await withTimeout(endLesson(id), 60_000, 'end pending');
    res.json({ scoreUrl: `/lesson/${id}/score`, score });
  } catch {
    res.status(409).json({ error: 'end pending' });
  }
});

lessonsRouter.get('/lessons/:id/score', async (req, res) => {
  if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) return void res.status(404).json({ error: 'not found' });
  const id = String(req.params.id);
  if (!(await getState(id))) return void res.status(404).json({ error: 'not found' });
  const pending = endJobs.get(id);
  const [l] = await db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
  if (!pending && !l.endedAt) return void res.status(409).json({ error: 'lesson not ended' });
  let score: ScoreJson | null;
  try { score = await withTimeout(pending ?? finalScore(id), 60_000, 'score pending'); }
  catch { return void res.status(409).json({ error: 'score pending' }); }
  if (!score) return void res.status(404).json({ error: 'not found' });
  res.json({ ...score, topic: uploadedTopic(score.topic_id) });
});

lessonsRouter.get('/lessons/:id/replay', async (req, res) => {
  const s = await getState(String(req.params.id));
  if (!s) return void res.status(404).json({ error: 'not found' });
  const ts = await db.select().from(turns).where(eq(turns.lessonId, s.id)).orderBy(asc(turns.turnNo));
  const lv = await db.select().from(kidLevels).where(eq(kidLevels.lessonId, s.id));
  const ln = await db.select().from(kidLines).where(eq(kidLines.lessonId, s.id)).orderBy(asc(kidLines.turnNo), asc(kidLines.idx));
  res.json({
    language: s.language, title: s.title, topicId: s.topicId, topic: uploadedTopic(s.topicId), setting: s.setting,
    turns: ts.map((t) => ({
      turnNo: t.turnNo, transcript: t.transcript, chorus: t.chorus, checkType: t.checkType, askedKid: t.askedKid,
      state: Object.fromEntries(KID_IDS.map((k) => {
        const r = lv.find((x) => x.turnNo === t.turnNo && x.kidId === k);
        return [k, { to: r?.level ?? 0, change: r?.change ?? 0, evidence: r?.evidence ?? null }];
      })),
      lines: ln.filter((l) => l.turnNo === t.turnNo).map((l) => ({
        idx: l.idx, kid: l.kidId, text: l.text, text_en: l.textEn ?? l.text,
        audioUrl: `/api/tts?kid=${l.kidId}&lang=${s.language}&group=${s.setting.group}&text=${encodeURIComponent(l.say ?? l.text)}`,
      })),
    })),
  });
});

// ---------- stand-up mode: per-turn body numbers (never video) → body language notes (tips, never scored) ----------
const BodyBody = z.object({ turnNo: z.number().int().min(1).max(500), metrics: z.unknown() });

lessonsRouter.post('/lessons/:id/body', async (req, res) => {
  const id = String(req.params.id);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return void res.status(404).json({ error: 'not found' });
  const p = BodyBody.safeParse(req.body);
  const metrics = p.success ? cleanMetrics(p.data.metrics) : null;
  if (!p.success || !metrics) return void res.status(400).json({ error: 'bad request' });
  const [l] = await db.select({ standup: lessons.standup }).from(lessons).where(eq(lessons.id, id)).limit(1);
  if (!l) return void res.status(404).json({ error: 'not found' });
  if (!l.standup) return void res.status(409).json({ error: 'not a stand-up lesson' });
  // only for a spoken turn that exists
  const [t] = await db.select({ turnNo: turns.turnNo }).from(turns).where(and(eq(turns.lessonId, id), eq(turns.turnNo, p.data.turnNo))).limit(1);
  if (!t) return void res.status(409).json({ error: 'no such turn' });
  await db.insert(bodyTurns).values({ lessonId: id, turnNo: p.data.turnNo, metrics })
    .onConflictDoUpdate({ target: [bodyTurns.lessonId, bodyTurns.turnNo], set: { metrics } });
  res.json({ ok: true });
});

lessonsRouter.get('/lessons/:id/body', async (req, res) => {
  const id = String(req.params.id);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return void res.status(404).json({ error: 'not found' });
  const [l] = await db.select({ standup: lessons.standup, topicId: lessons.topicId }).from(lessons).where(eq(lessons.id, id)).limit(1);
  if (!l) return void res.status(404).json({ error: 'not found' });
  if (!l.standup) return void res.json({ standup: false, result: null });
  const ts = await db.select({ turnNo: turns.turnNo, transcript: turns.transcript, checkType: turns.checkType }).from(turns).where(eq(turns.lessonId, id)).orderBy(asc(turns.turnNo));
  const bs = await db.select().from(bodyTurns).where(eq(bodyTurns.lessonId, id));
  const byTurn = new Map(bs.map((b) => [b.turnNo, b.metrics as BodyMetrics]));
  const result = bodyNotes(ts.map((t) => ({ ...t, metrics: byTurn.get(t.turnNo) ?? null })), { topicId: l.topicId });
  res.json({ standup: true, result });
});

lessonsRouter.get('/lessons/:id/debug', async (req, res) => {
  if (!(await getState(String(req.params.id)))) return void res.status(404).json({ error: 'not found' });
  if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) return void res.status(404).json({ error: 'not found' });
  const ts = await db.select().from(turns).where(eq(turns.lessonId, req.params.id)).orderBy(desc(turns.turnNo));
  res.json({ turns: ts.map((t) => ({ turnNo: t.turnNo, transcript: t.transcript, failsafe: t.failsafe, timings: t.timingsJson, judge: t.judgeJson })) });
});
