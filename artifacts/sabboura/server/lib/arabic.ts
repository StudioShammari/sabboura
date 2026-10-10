const TASHKEEL = /[\u064B-\u065F\u0670\u0640]/g;
const DIGITS_AR = '٠١٢٣٤٥٦٧٨٩';
const DIGITS_FA = '۰۱۲۳۴۵۶۷۸۹';

export function westernDigits(s: string): string {
  return s.replace(/[٠-٩۰-۹]/g, (c) => {
    const i = DIGITS_AR.indexOf(c);
    return String(i >= 0 ? i : DIGITS_FA.indexOf(c));
  });
}

export function normalise(s: string): string {
  return westernDigits(s)
    .replace(TASHKEEL, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function words(s: string): string[] {
  const n = normalise(s);
  return n ? n.split(' ') : [];
}

/** Share of words in `a` that appear in `b`. */
export function overlap(a: string, b: string): number {
  const wa = words(a);
  if (!wa.length) return 0;
  const sb = new Set(words(b));
  return wa.filter((w) => sb.has(w)).length / wa.length;
}

/** Symmetric-ish similarity used to check TTS read the line (min of both directions). */
export function similarity(a: string, b: string): number {
  return Math.min(overlap(a, b), overlap(b, a));
}

export function truncateWords(s: string, n: number): string {
  const w = s.trim().split(/\s+/);
  return w.length <= n ? s.trim() : w.slice(0, n).join(' ');
}

export function stripEmojiAndQuotes(s: string): string {
  return s
    .replace(/\p{Extended_Pictographic}/gu, '')
    .replace(/["“”«»]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
