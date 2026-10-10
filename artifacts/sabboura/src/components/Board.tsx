import { Fragment, useMemo } from 'react';
import type { KidId, Lang } from '@shared/data';
import { Tally } from './Tally';
import { MiniAvatar } from './KidAvatar';
import { tr } from '@/i18n';

export interface Mark { text: string; kids: KidId[] }

const norm = (s: string) => s.normalize('NFKD').replace(/[\u064B-\u0652\u0670\u0640]/g, '').replace(/[إأآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[^\p{L}\p{N}]+/gu, '').toLowerCase();

function findSpan(text: string, ev: string): [number, number] | null {
  const direct = text.indexOf(ev);
  if (direct >= 0) return [direct, direct + ev.length];
  const toks = [...text.matchAll(/\S+/g)].map((m) => ({ s: m.index!, e: m.index! + m[0].length, n: norm(m[0]) }));
  const ew = ev.split(/\s+/).map(norm).filter(Boolean);
  if (!ew.length) return null;
  for (let i = 0; i + ew.length <= toks.length; i++) {
    if (ew.every((w, k) => toks[i + k].n === w)) return [toks[i].s, toks[i + ew.length - 1].e];
  }
  return null;
}

export function Board({ lang, topic, transcript, marks, tally, hint, heard, levelBars, children }: {
  lang: Lang; topic: string; transcript: string; marks: Mark[]; tally: number; hint?: boolean; heard?: boolean; levelBars?: number | null; children?: React.ReactNode;
}) {
  const words = transcript.split(/\s+/).filter(Boolean);
  const cut = words.length > 70;
  const shown = cut ? words.slice(-70).join(' ') : transcript;
  const parts = useMemo(() => {
    const spans: { s: number; e: number; kids: KidId[] }[] = [];
    for (const m of marks) {
      const sp = findSpan(shown, m.text);
      if (sp) spans.push({ s: sp[0], e: sp[1], kids: m.kids });
    }
    spans.sort((a, b) => a.s - b.s);
    const out: { t: string; kids?: KidId[] }[] = [];
    let at = 0;
    for (const sp of spans) {
      if (sp.s < at) continue;
      if (sp.s > at) out.push({ t: shown.slice(at, sp.s) });
      out.push({ t: shown.slice(sp.s, sp.e), kids: sp.kids });
      at = sp.e;
    }
    if (at < shown.length) out.push({ t: shown.slice(at) });
    return out;
  }, [shown, marks]);
  return (
    <div className="board-frame" data-testid="board">
      <div className="board-head">
        <div className="chalk-title board-topic">{topic}</div>
        <div className="tally">{tally > 0 && <><span>{tr('yesNoTally', lang)}</span><Tally count={tally} /></>}</div>
      </div>
      <div className="board-text" aria-live="polite">
        {transcript ? (
          <p className={words.length > 40 ? 'shrunk' : ''} key={transcript.length > 0 ? 'p' : 'e'}>
            {cut && '… '}
            {parts.map((p, i) => p.kids ? (
              <mark key={i} className="board-mark">
                {p.t}
                {p.kids.map((k) => <Fragment key={k}><MiniAvatar kid={k} lang={lang} /></Fragment>)}
              </mark>
            ) : <span key={i}>{p.t}</span>)}
          </p>
        ) : hint ? <p className="hint">{tr('boardHint', lang)}</p> : null}
      </div>
      {heard && <span className="heard-chip">{tr('heard', lang)}</span>}
      {levelBars != null && (
        <div className="level-bars" aria-hidden="true">
          {[0.15, 0.3, 0.45, 0.6, 0.8].map((th, i) => <i key={i} style={{ height: `${levelBars > th - 0.1 ? 30 + i * 16 : 14}%`, background: levelBars > th - 0.1 ? 'var(--chalk-yellow)' : undefined }} />)}
        </div>
      )}
      {children}
    </div>
  );
}
