import { useState } from 'react';
import type { KidId, Lang, Level } from '@shared/data';

const INITIAL: Record<KidId, { ar: string; en: string }> = {
  omar: { ar: 'ع', en: 'O' }, lina: { ar: 'ل', en: 'L' }, sara: { ar: 'س', en: 'S' }, khaled: { ar: 'خ', en: 'K' }, yazan: { ar: 'ي', en: 'Y' },
};
const missing = new Set<string>();

function Img({ src, alt, style }: { src: string; alt?: string; style?: React.CSSProperties }) {
  const [bad, setBad] = useState(missing.has(src));
  if (bad) return null;
  return <img src={src} alt={alt ?? ''} draggable={false} style={style} onError={() => { missing.add(src); setBad(true); }} />;
}

export function stateFor(kid: KidId, level: Level) {
  if (kid === 'yazan') return level === 0 ? 'bored' : level === 1 ? 'neutral' : 'happy';
  return level === 2 ? 'happy' : 'neutral';
}

/** Avatar image with 200 ms crossfade; falls back to the initial-letter tile. */
export function KidAvatar({ kid, level, lang }: { kid: KidId; level: Level; lang: Lang }) {
  const cur = stateFor(kid, level);
  const states = kid === 'yazan' ? ['bored', 'neutral', 'happy'] : ['neutral', 'happy'];
  return (
    <div className="avatar">
      <div className="initial-tile">{INITIAL[kid][lang]}</div>
      {states.map((s) => (
        <Img key={s} src={`/avatars/${kid}-${s}.webp`} style={{ opacity: s === cur ? 1 : 0 }} />
      ))}
    </div>
  );
}

export function MiniAvatar({ kid, size = 24, lang }: { kid: KidId; size?: number; lang: Lang }) {
  return (
    <span className="mini-tag" style={{ width: size, height: size, borderRadius: size / 3 }}>
      <span style={{ position: 'relative', width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontFamily: 'var(--f-kid)', fontWeight: 800, fontSize: size * 0.6 }}>
        {INITIAL[kid][lang]}
        <Img src={`/avatars/${kid}-neutral.webp`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      </span>
    </span>
  );
}
