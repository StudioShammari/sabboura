import { registerTopic, type Lang } from '@shared/data';
import { PACK_MAX_BYTES, PACK_MAX_PAGES, PACK_MAX_TEXT, type PackFailReason, type PackInfo } from '@shared/pack';
import { getPack } from '@/lib/api';

export interface PackInput { file?: File; text?: string; language: Lang; from: number; to: number }
export class PackFail extends Error {
  constructor(public reason: PackFailReason, public pages?: number) { super(reason); }
}

// The chosen file stays in this tab's memory only, so "New draft" can ask again. It is never saved anywhere.
let last: PackInput | null = null;
export const lastPackInput = () => last;

const TYPES = /^(application\/pdf|image\/(jpeg|png|webp))$/;
const EXT = /\.(pdf|jpe?g|png|webp)$/i;

/** Phone photos can be 10+ MB. Shrink to a 2000 px long edge as JPEG 0.88 before sending. */
async function shrinkPhoto(f: File): Promise<File> {
  try {
    const bmp = await createImageBitmap(f, { imageOrientation: 'from-image' });
    const k = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(bmp.width * k)); c.height = Math.max(1, Math.round(bmp.height * k));
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
    bmp.close();
    const blob: Blob | null = await new Promise((ok) => c.toBlob(ok, 'image/jpeg', 0.88));
    if (!blob) throw new Error('encode');
    return new File([blob], f.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' });
  } catch {
    throw new PackFail('unreadable');
  }
}

export function checkFile(f: File): PackFailReason | null {
  const okType = TYPES.test(f.type) || (!f.type && EXT.test(f.name));
  if (!okType) return 'wrong_type';
  if (f.type === 'application/pdf' && f.size > PACK_MAX_BYTES) return 'too_big';
  if (f.type.startsWith('image/') && f.size > 40 * 1024 * 1024) return 'too_big';
  return null;
}

const sleep = (ms: number, signal?: AbortSignal) => new Promise<void>((ok, no) => {
  const t = setTimeout(ok, ms);
  signal?.addEventListener('abort', () => { clearTimeout(t); no(new DOMException('aborted', 'AbortError')); }, { once: true });
});

/** Send the material, wait for the pack. Steps for the chalk list: 1 reading, 2 (after 10 s) finding, 3 drafting. */
export async function makePack(inp: PackInput, o: { signal?: AbortSignal; onStep?: (n: 1 | 2 | 3) => void; fresh?: boolean }): Promise<PackInfo> {
  last = inp;
  const fd = new FormData();
  fd.append('language', inp.language);
  const from = Math.max(1, Math.floor(inp.from) || 1);
  fd.append('from', String(from));
  fd.append('to', String(Math.min(from + PACK_MAX_PAGES - 1, Math.max(from, Math.floor(inp.to) || from))));
  if (o.fresh) fd.append('fresh', '1');
  if (inp.file) {
    const bad = checkFile(inp.file);
    if (bad) throw new PackFail(bad);
    const f = inp.file.type.startsWith('image/') ? await shrinkPhoto(inp.file) : inp.file;
    if (f.size > PACK_MAX_BYTES) throw new PackFail('too_big');
    fd.append('file', f, f.name);
    fd.append('fileName', inp.file.name);
  } else {
    const t = (inp.text ?? '').trim();
    if (t.length > PACK_MAX_TEXT) throw new PackFail('too_big');
    if (t.length < 20) throw new PackFail('unreadable');
    fd.append('text', t);
  }
  o.onStep?.(1);
  const t0 = Date.now();
  const timers = [setTimeout(() => o.onStep?.(2), 10000), setTimeout(() => o.onStep?.(3), 24000)];
  try {
    let res: Response;
    try { res = await fetch('/api/packs', { method: 'POST', body: fd, signal: o.signal }); }
    catch (e) { if ((e as Error)?.name === 'AbortError') throw e; throw new PackFail('unreadable'); }
    if (res.status !== 202) {
      const j = await res.json().catch(() => ({}));
      if (j.reason === 'page_range') throw new PackFail('page_range', Number(j.pages) || 1);
      throw new PackFail(res.status === 413 ? 'too_big' : res.status === 415 ? 'wrong_type' : (j.reason as PackFailReason) ?? 'unreadable');
    }
    const { packId } = (await res.json()) as { packId: string };
    for (;;) {
      const r = await getPack(packId).catch(() => null);
      if (r?.status === 'ready' && r.pack) { if (r.pack.topic) registerTopic(r.pack.topic); return r.pack; }
      if (r?.status === 'failed') throw new PackFail(r.reason ?? 'unreadable');
      if (Date.now() - t0 > 100000) throw new PackFail('timeout');
      await sleep(Date.now() - t0 < 3000 ? 700 : 2000, o.signal);
    }
  } finally {
    timers.forEach(clearTimeout);
  }
}
