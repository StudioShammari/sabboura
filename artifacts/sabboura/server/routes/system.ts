import { Router } from 'express';
import { z } from 'zod';
import { sql } from 'drizzle-orm';
import { db } from '../db';
import { aiState, hasAnthropic, hasOpenAI, models, probeModels } from '../ai/clients';
import { speak, synthesize } from '../ai/tts';
import { transcribe } from '../ai/stt';
import { generateLines } from '../ai/kidLines';
import { judgeTurn } from '../ai/judge';
import { startLevels, KID_IDS, type KidId, type Lang } from '../../shared/data';
import { since } from '../lib/timing';
import type { Group } from '../../shared/setting';

export const systemRouter = Router();

systemRouter.get('/health', (_req, res) => void res.json({ ok: true }));

let warmCache: { at: number; body: unknown } | null = null;
systemRouter.get('/warmup', async (req, res) => {
  if (warmCache && Date.now() - warmCache.at < 60_000 && req.query.force !== '1') return void res.json(warmCache.body);
  const ms: Record<string, number | null> = { db: null, judge: null, lines: null, tts: null, stt: null };
  const errors: Record<string, string> = {};
  const timed = async (k: string, fn: () => Promise<unknown>) => {
    const t = performance.now();
    try { await fn(); ms[k] = since(t); } catch (e: any) { errors[k] = String(e?.message ?? e); }
  };
  const levels = startLevels('fractions');
  let mp3: string | null = null;
  await timed('db', () => db.execute(sql`select 1`));
  const probe = hasAnthropic() ? await probeModels() : {};
  await Promise.all([
    timed('judge', async () => {
      const r = await judgeTurn({ topicId: 'fractions', levels, transcript: 'نص أكبر من تلت لأن القطع بتصير أكبر', previous: [] });
      if (!r.ok) throw new Error(r.error);
    }),
    timed('lines', async () => {
      const r = await generateLines({ topicId: 'fractions', lang: 'ar', title: 'miss', transcript: 'نص أكبر من تلت', speakers: [{ kid: 'omar', reason: 'objection' }], levels });
      if (!r.ok) throw new Error(r.error);
    }),
    timed('tts', async () => { mp3 = await synthesize('omar', 'ar', 'آه'); }),
  ]);
  if (mp3) await timed('stt', async () => { await transcribe({ buf: Buffer.from(mp3!, 'base64'), mime: 'audio/mpeg', lang: 'ar', topicId: 'fractions' }); });
  const body = {
    ok: Object.keys(errors).length === 0,
    models: { judge: aiState.winners.judge?.model ?? null, lines: aiState.winners.lines?.model ?? null, scorer: aiState.winners.scorer?.model ?? null, stt: models.stt(), tts: models.tts() },
    structured: aiState.structured, ms, errors, probe, credentials: { anthropic: hasAnthropic(), openai: hasOpenAI() },
  };
  warmCache = { at: Date.now(), body };
  res.json(body);
});

const TtsBody = z.object({ kid: z.enum(KID_IDS), text: z.string().min(1).max(300), lang: z.enum(['ar', 'en']).default('ar'), group: z.enum(['mixed', 'boys', 'girls']).default('mixed') });

async function serveTts(kid: KidId, lang: Lang, text: string, res: import('express').Response, group: Group = 'mixed') {
  const r = await speak(kid, lang, text, undefined, group);
  if (!r.ok) return void res.status(204).end();
  if (r.source === 'pre') return void res.redirect(302, r.url);
  res.setHeader('Content-Type', r.mime);
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.end(Buffer.from(r.b64, 'base64'));
}
systemRouter.post('/tts', async (req, res) => {
  const p = TtsBody.safeParse(req.body);
  if (!p.success) return void res.status(400).json({ error: 'bad request' });
  await serveTts(p.data.kid, p.data.lang, p.data.text, res, p.data.group);
});
systemRouter.get('/tts', async (req, res) => {
  const p = TtsBody.safeParse({ kid: req.query.kid, text: req.query.text, lang: req.query.lang ?? 'ar', group: req.query.group ?? 'mixed' });
  if (!p.success) return void res.status(400).json({ error: 'bad request' });
  await serveTts(p.data.kid, p.data.lang, p.data.text, res, p.data.group);
});
