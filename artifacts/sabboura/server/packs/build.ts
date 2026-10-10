import { createHash } from 'node:crypto';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import { eq } from 'drizzle-orm';
import { KID_IDS, libraryTopics, registerTopic, type KidId, type Lang, type TopicDef, type TopicKid } from '../../shared/data';
import { defaultsFor, type PlanDefaults } from '../../shared/plan';
import { PACK_MAX_PAGES, type PackFailReason, type PackInfo } from '../../shared/pack';
import { db, packs } from '../db';
import { AIError, claudeJSON } from '../ai/clients';
import { PACK_JSON_SCHEMA, PACK_SYSTEM, PackOut } from './prompt';

export type Material = { kind: 'pdf' | 'image'; buf: Buffer; mime: string } | { kind: 'text'; text: string };

export class PackError extends Error {
  constructor(public reason: PackFailReason) { super(reason); }
}

export const packIdFor = (content: Buffer | string, language: Lang, pages: number) =>
  'up-' + createHash('sha1').update(content).update(`|${language}|${pages}`).digest('hex').slice(0, 20);

/** Type from the first bytes, never from the file name or the browser's claim. */
export function sniff(buf: Buffer): { kind: 'pdf' | 'image'; mime: string } | null {
  if (buf.length < 12) return null;
  if (buf.subarray(0, 5).toString('latin1') === '%PDF-') return { kind: 'pdf', mime: 'application/pdf' };
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { kind: 'image', mime: 'image/jpeg' };
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { kind: 'image', mime: 'image/png' };
  if (buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') return { kind: 'image', mime: 'image/webp' };
  return null;
}

/** Turn the upload into Claude content blocks. Held in memory only. */
async function toBlocks(m: Material, pages: number): Promise<any[]> {
  if (m.kind === 'text') return [{ type: 'text', text: `The teacher's material (pasted text):\n\n${m.text}` }];
  if (m.kind === 'pdf') {
    try {
      const src = await PDFDocument.load(m.buf, { ignoreEncryption: false, updateMetadata: false });
      const n = src.getPageCount();
      if (n < 1) throw new PackError('unreadable');
      const keep = Math.min(Math.max(1, pages), PACK_MAX_PAGES, n);
      const out = await PDFDocument.create();
      const copied = await out.copyPages(src, Array.from({ length: keep }, (_, i) => i));
      copied.forEach((p) => out.addPage(p));
      const bytes = await out.save();
      return [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: Buffer.from(bytes).toString('base64') } }];
    } catch (e) {
      if (e instanceof PackError) throw e;
      throw new PackError('unreadable');
    }
  }
  try {
    const jpg = await sharp(m.buf, { failOn: 'none' }).rotate().resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 88 }).toBuffer();
    return [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: jpg.toString('base64') } }];
  } catch {
    throw new PackError('unreadable');
  }
}

async function callPack(material: any[], language: Lang): Promise<PackOut> {
  let last: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await claudeJSON({
        purpose: 'pack', system: PACK_SYSTEM, material,
        user: `LESSON LANGUAGE: ${language === 'ar' ? 'Arabic (ar)' : 'English (en)'}\nPrepare the lesson pack from the material above.`,
        jsonSchema: PACK_JSON_SCHEMA, zod: PackOut, maxTokens: 8000, timeoutMs: 60000,
      });
      return r.value;
    } catch (e) {
      last = e;
      if (e instanceof AIError && !e.retryable) break;
    }
  }
  const msg = String((last as any)?.message ?? last);
  console.warn('[pack] AI failed:', msg.slice(0, 160));
  throw new PackError(/timeout|aborted/i.test(msg) ? 'timeout' : 'unreadable');
}

const other = (l: Lang): Lang => (l === 'ar' ? 'en' : 'ar');

export function buildInfo(out: PackOut, id: string, language: Lang, source: string | null): PackInfo {
  if (!out.usable) throw new PackError('not_lesson');
  const steps = out.steps.slice(0, 5);
  if (steps.length < 3 || !out.objective.trim()) throw new PackError('unreadable');
  const libId = out.library_topic_id && libraryTopics.some((t) => t.id === out.library_topic_id) ? out.library_topic_id : null;
  if (libId) {
    const lib = libraryTopics.find((t) => t.id === libId)!;
    const plan: PlanDefaults = { objective: out.objective, steps, trouble_spots: defaultsFor(libId, language).trouble_spots };
    return { id, language, title: lib.title[language], grade: lib.grade, source, libraryTopicId: libId, topic: null, plan };
  }
  const title = out.title.trim();
  if (!title || !out.kids || out.trouble_spots.length < 3) throw new PackError('unreadable');
  const kids = Object.fromEntries(KID_IDS.map((k: KidId) => {
    const d = out.kids![k];
    const tk: TopicKid = {
      start_level: k === 'yazan' ? 1 : 0,
      misconception: d.misconception, helped_if: d.helped_if, hurt_if: d.hurt_if,
      reveal: { [language]: d.reveal, [other(language)]: d.reveal } as any,
      next_check: { [language]: d.next_check, [other(language)]: d.next_check } as any,
    };
    return [k, tk];
  })) as Record<KidId, TopicKid>;
  const titleEn = out.title_en.trim() || title;
  const topic: TopicDef = {
    id,
    title: language === 'ar' ? { ar: title, en: titleEn } : { en: title, ar: titleEn },
    grade: out.grade.trim() || '—',
    vocab: out.vocab,
    kids,
  };
  const plan: PlanDefaults = { objective: out.objective, steps, trouble_spots: out.trouble_spots.slice(0, 3) };
  return { id, language, title, grade: topic.grade, source, libraryTopicId: null, topic, plan };
}

const jobs = new Map<string, Promise<void>>();
export const isRunning = (id: string) => jobs.has(id);

export function startJob(id: string, language: Lang, material: Material, pages: number, source: string | null) {
  const job = (async () => {
    try {
      const blocks = await toBlocks(material, pages);
      const out = await callPack(blocks, language);
      const info = buildInfo(out, id, language, source);
      if (info.topic) registerTopic(info.topic);
      await db.update(packs).set({ status: 'ready', reason: null, packJson: info }).where(eq(packs.id, id));
    } catch (e) {
      const reason: PackFailReason = e instanceof PackError ? e.reason : 'unreadable';
      if (!(e instanceof PackError)) console.warn('[pack] job crashed', (e as Error)?.message);
      await db.update(packs).set({ status: 'failed', reason }).where(eq(packs.id, id)).catch(() => {});
    } finally {
      jobs.delete(id);
    }
  })();
  jobs.set(id, job);
}

/** Boot: make every uploaded topic findable by topicById(). */
export async function loadUploadedTopics() {
  const rows = await db.select().from(packs).where(eq(packs.status, 'ready'));
  let n = 0;
  for (const r of rows) {
    const info = r.packJson as PackInfo | null;
    if (info?.topic) { registerTopic(info.topic); n++; }
  }
  if (n) console.log(`[packs] loaded ${n} uploaded topic(s)`);
}
