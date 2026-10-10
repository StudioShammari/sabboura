import { PDFDocument } from 'pdf-lib';
import { Router, type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import { eq } from 'drizzle-orm';
import { db, packs } from '../db';
import { PACK_MAX_BYTES, PACK_MAX_PAGES, PACK_MAX_TEXT, type PackFailReason, type PackInfo, type PackStatus, type PageRange } from '../../shared/pack';
import { isRunning, packIdFor, sniff, startJob, type Material } from '../packs/build';

export const packsRouter = Router();
// the file lives in memory for the length of this request and the background job. It is never written anywhere.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: PACK_MAX_BYTES, files: 1, fields: 8 } });

const fail = (res: Response, status: number, reason: PackFailReason) => void res.status(status).json({ error: reason, reason });

packsRouter.post('/packs', (req: Request, res: Response, next: NextFunction) => {
  upload.single('file')(req, res, (err: any) => {
    if (err?.code === 'LIMIT_FILE_SIZE') return fail(res, 413, 'too_big');
    if (err) return fail(res, 400, 'unreadable');
    next();
  });
}, async (req: Request, res: Response) => {
  const language = req.body?.language === 'en' ? 'en' : 'ar';
  const wantFrom = Math.max(1, Math.floor(Number(req.body?.from)) || 1);
  const wantTo = Math.floor(Number(req.body?.to)) || wantFrom + PACK_MAX_PAGES - 1;
  let range: PageRange | null = null;
  const rawName = String(req.body?.fileName ?? '').replace(/[\r\n\t]/g, ' ').trim().slice(0, 80);
  let material: Material; let key: Buffer | string; let source: string | null = null;
  if (req.file) {
    if (req.file.size > PACK_MAX_BYTES) return fail(res, 413, 'too_big');
    const t = sniff(req.file.buffer);
    if (!t) return fail(res, 415, 'wrong_type');
    material = { kind: t.kind, buf: req.file.buffer, mime: t.mime };
    if (t.kind === 'pdf') {
      let n: number;
      try { n = (await PDFDocument.load(req.file.buffer, { updateMetadata: false })).getPageCount(); } catch { return fail(res, 400, 'unreadable'); }
      if (n < 1) return fail(res, 400, 'unreadable');
      if (wantFrom > n) return void res.status(400).json({ error: 'page_range', reason: 'page_range', pages: n });
      range = { from: wantFrom, to: Math.min(n, Math.max(wantFrom, wantTo), wantFrom + PACK_MAX_PAGES - 1) };
    }
    key = req.file.buffer;
    source = rawName || null;
  } else {
    const text = String(req.body?.text ?? '').trim();
    if (text.length > PACK_MAX_TEXT) return fail(res, 413, 'too_big');
    if (text.length < 20) return fail(res, 400, 'unreadable');
    material = { kind: 'text', text };
    key = text;
  }
  const id = packIdFor(key, language, range);
  const [row] = await db.select().from(packs).where(eq(packs.id, id)).limit(1);
  const fresh = req.body?.fresh === '1';
  if (row && !fresh && (row.status === 'ready' || (row.status === 'working' && isRunning(id)))) return void res.status(202).json({ packId: id });
  if (row) await db.update(packs).set({ status: 'working', reason: null, createdAt: new Date() }).where(eq(packs.id, id));
  else await db.insert(packs).values({ id, language, status: 'working' });
  startJob(id, language, material, range, source);
  res.status(202).json({ packId: id });
});

packsRouter.get('/packs/:id', async (req, res) => {
  const id = String(req.params.id);
  if (!/^up-[0-9a-f]{20}$/.test(id)) return void res.status(404).json({ error: 'not found' });
  const [row] = await db.select().from(packs).where(eq(packs.id, id)).limit(1);
  if (!row) return void res.status(404).json({ error: 'not found' });
  let out: PackStatus;
  if (row.status === 'ready') out = { status: 'ready', pack: row.packJson as PackInfo };
  else if (row.status === 'failed') out = { status: 'failed', reason: (row.reason as PackFailReason) ?? 'unreadable' };
  else if (!isRunning(id)) out = { status: 'failed', reason: 'timeout' }; // the server restarted mid-job
  else out = { status: 'working' };
  res.json(out);
});
