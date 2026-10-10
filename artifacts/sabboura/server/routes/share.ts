import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db, lessons } from '../db';
import type { ScoreJson } from '../../shared/schemas';

export const shareRouter = Router();
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const BANDS = {
  ar: { warmup: 'جولة إحماء', getting: 'على الطريق الصحيح', strong: 'درس قوي', excellent: 'درس ممتاز' },
  en: { warmup: 'Warm-up round', getting: 'Getting there', strong: 'Strong lesson', excellent: 'Excellent lesson' },
};

shareRouter.get('/s/:id', async (req, res) => {
  const id = req.params.id;
  let title = 'Sabboura سبّورة';
  let desc = 'A flight simulator for teachers. Practise on five AI kids.';
  if (/^[0-9a-f-]{36}$/i.test(id)) {
    const [l] = await db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
    const s = l?.scoreJson as ScoreJson | null;
    if (s) {
      const lang = s.language;
      title = lang === 'ar' ? `سبّورة: ${s.total}/100 — ${BANDS.ar[s.band]}` : `Sabboura: ${s.total}/100 — ${BANDS.en[s.band]}`;
      desc = lang === 'ar' ? `وصل شرحي إلى ${s.reached} من 4 طلاب. جرّب درسك.` : `My explanation reached ${s.reached} of 4 kids. Try your lesson.`;
    }
  }
  const origin = `${req.protocol}://${req.get('host')}`;
  res.type('html').send(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${origin}/avatars/class.webp"><meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0;url=/lesson/${esc(id)}/score?shared=1"></head><body><a href="/lesson/${esc(id)}/score?shared=1">${esc(title)}</a></body></html>`);
});
