import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { eq } from 'drizzle-orm';
import type { KidId, Lang } from '../../shared/data';
import { db, ttsCache } from '../db';
import { AIError, models, withOpenAI } from './clients';
import { ttsSystem } from './prompts';
import { overlap } from '../lib/arabic';
import { since } from '../lib/timing';

export const STYLE_VERSION = 'v1';
export const VOICES: Record<KidId, string> = { omar: 'ash', lina: 'shimmer', sara: 'coral', khaled: 'echo', yazan: 'verse' };
export const PRE_DIR = path.resolve(import.meta.dirname, '../../public/audio/pre');

export const ttsKey = (kid: KidId, lang: Lang, say: string, model = models.tts()) =>
  crypto.createHash('sha1').update(`${model}|${VOICES[kid]}|${STYLE_VERSION}|${lang}|${say}`).digest('hex');

type Manifest = Record<string, { url: string; text: string; voice: string }>;
let manifestCache: { at: number; data: Manifest } | null = null;
export function preManifest(): Manifest {
  if (manifestCache && Date.now() - manifestCache.at < 30_000) return manifestCache.data;
  let data: Manifest = {};
  try { data = JSON.parse(fs.readFileSync(path.join(PRE_DIR, 'manifest.json'), 'utf8')); } catch {}
  manifestCache = { at: Date.now(), data };
  return data;
}

const lru = new Map<string, { b64: string; mime: string }>();
const LRU_MAX = 500;
function lruSet(k: string, v: { b64: string; mime: string }) {
  lru.delete(k);
  lru.set(k, v);
  if (lru.size > LRU_MAX) lru.delete(lru.keys().next().value as string);
}

export type SpeakResult =
  | { ok: true; source: 'pre'; url: string; mime: string; ms: number; key: string }
  | { ok: true; source: 'cache' | 'tts'; b64: string; mime: string; ms: number; key: string }
  | { ok: false; ms: number; reason: string; key: string };

/** Generate (no cache) one line. Returns base64 mp3 or throws. */
export async function synthesize(kid: KidId, lang: Lang, say: string, signal?: AbortSignal): Promise<string> {
  let lastReason = 'unknown';
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r: any = await withOpenAI((openai) =>
        (openai.chat.completions as any).create(
          {
            model: models.tts(),
            modalities: ['text', 'audio'],
            audio: { voice: VOICES[kid], format: 'mp3' },
            messages: [
              { role: 'system', content: ttsSystem(kid, lang) },
              { role: 'user', content: say },
            ],
          },
          { timeout: 7000, maxRetries: 0, signal },
        ),
      );
      const audio = r.choices?.[0]?.message?.audio;
      const b64: string | undefined = audio?.data;
      if (!b64) { lastReason = 'no audio'; continue; }
      const heard: string = audio?.transcript ?? '';
      if (heard && overlap(say, heard) < 0.8) { lastReason = `mismatch: "${heard}"`; continue; }
      return b64;
    } catch (e: any) {
      lastReason = String(e?.message ?? e).slice(0, 160);
      if (e?.name === 'AbortError' || signal?.aborted) break;
    }
  }
  throw new AIError(lastReason, false);
}

/** Cache order: pre-generated manifest, LRU, Postgres, then generate. */
export async function speak(kid: KidId, lang: Lang, say: string, signal?: AbortSignal): Promise<SpeakResult> {
  const t0 = performance.now();
  const key = ttsKey(kid, lang, say);
  const pre = preManifest()[key];
  if (pre) return { ok: true, source: 'pre', url: pre.url, mime: 'audio/mpeg', ms: since(t0), key };
  const hit = lru.get(key);
  if (hit) return { ok: true, source: 'cache', b64: hit.b64, mime: hit.mime, ms: since(t0), key };
  try {
    const rows = await db.select().from(ttsCache).where(eq(ttsCache.key, key)).limit(1);
    if (rows[0]?.audioB64) {
      lruSet(key, { b64: rows[0].audioB64, mime: rows[0].mime ?? 'audio/mpeg' });
      return { ok: true, source: 'cache', b64: rows[0].audioB64, mime: rows[0].mime ?? 'audio/mpeg', ms: since(t0), key };
    }
  } catch (e: any) {
    console.warn('[tts] cache read failed', e.message);
  }
  try {
    const b64 = await synthesize(kid, lang, say, signal);
    lruSet(key, { b64, mime: 'audio/mpeg' });
    db.insert(ttsCache).values({ key, voice: VOICES[kid], say, mime: 'audio/mpeg', audioB64: b64 }).onConflictDoNothing().catch((e) => console.warn('[tts] cache write failed', e.message));
    return { ok: true, source: 'tts', b64, mime: 'audio/mpeg', ms: since(t0), key };
  } catch (e: any) {
    return { ok: false, ms: since(t0), reason: String(e?.message ?? e), key };
  }
}
