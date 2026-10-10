import { Fragment, type ReactNode } from 'react';
import type { Lang } from '@shared/data';
import { fmtNum } from '@/i18n';

const NUM = /(\d+(?:[.,–-]\d+)*%?)/g;
/** Literal text with every number (like "1.5–2" or "70%") isolated left-to-right. */
function digits(s: string, key: string): ReactNode[] {
  return s.split(NUM).map((p, i) => (i % 2 ? <bdi key={`${key}.${i}`} dir="ltr">{p}</bdi> : <Fragment key={`${key}.${i}`}>{p}</Fragment>));
}

/** Fills {name} slots in a translated sentence: numbers go inside <bdi dir="ltr"> with Western digits; words are isolated with <bdi>. */
export function Fill({ text, vars = {}, lang }: { text: string; vars?: Record<string, string | number | undefined>; lang: Lang }) {
  const parts = text.split(/\{(\w+)\}/g);
  const out: ReactNode[] = parts.map((p, i) => {
    if (i % 2 === 0) {
      // a "%" right after a number slot is drawn inside that slot's <bdi>
      const t = i > 0 && typeof vars[parts[i - 1]] === 'number' && p.startsWith('%') ? p.slice(1) : p;
      return <Fragment key={i}>{digits(t, String(i))}</Fragment>;
    }
    const v = vars[p];
    if (v === undefined) return <Fragment key={i}>{`{${p}}`}</Fragment>;
    if (typeof v === 'string') return <bdi key={i}>{v}</bdi>;
    return <bdi key={i} dir="ltr" className="num">{fmtNum(v, lang)}{parts[i + 1]?.startsWith('%') ? '%' : ''}</bdi>;
  });
  return <>{out}</>;
}
