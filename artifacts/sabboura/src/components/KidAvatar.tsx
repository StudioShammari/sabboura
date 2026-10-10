import { useState } from 'react';
import type { KidId, Lang, Level } from '@shared/data';
import { kidIdentity } from '@shared/setting';
import { useSetting } from '@/lib/classSetting';

/** First letter of the shown name: the portrait is missing, so this tile stands in. */
const initialOf = (name: string) => Array.from(name)[0] ?? '';
const missing = new Set<string>();

function Img({ src, alt, style }: { src: string; alt?: string; style?: React.CSSProperties }) {
  const [bad, setBad] = useState(missing.has(src));
  if (bad) return null;
  return <img src={src} alt={alt ?? ''} draggable={false} style={style} onError={() => { missing.add(src); setBad(true); }} />;
}

export type Mood = 'neutral' | 'happy' | 'confused' | 'eager' | 'bored';

/** Face for a kid: eager while a hand is up, otherwise from the level (lost = confused, got it = happy). */
export function stateFor(kid: KidId, level: Level, eager = false): Mood {
  if (eager) return 'eager';
  if (kid === 'yazan') return level === 0 ? 'bored' : level === 1 ? 'neutral' : 'happy';
  return level === 2 ? 'happy' : level === 0 ? 'confused' : 'neutral';
}

/** Avatar image with 200 ms crossfade; falls back to the initial-letter tile. */
export function KidAvatar({ kid, level, lang, eager = false }: { kid: KidId; level: Level; lang: Lang; eager?: boolean }) {
  const who = kidIdentity(kid, useSetting());
  const cur = stateFor(kid, level, eager);
  const states: Mood[] = kid === 'yazan' ? ['bored', 'neutral', 'happy', 'eager'] : ['neutral', 'happy', 'confused', 'eager'];
  return (
    <div className="avatar" data-mood={cur}>
      <div className="initial-tile">{initialOf(who.name[lang])}</div>
      {states.map((s) => (
        <Img key={s} src={`/avatars/${who.avatarBase}-${s}.webp`} style={{ opacity: s === cur ? 1 : 0 }} />
      ))}
    </div>
  );
}

export function MiniAvatar({ kid, size = 24, lang }: { kid: KidId; size?: number; lang: Lang }) {
  const who = kidIdentity(kid, useSetting());
  return (
    <span className="mini-tag" style={{ width: size, height: size, borderRadius: size / 3 }}>
      <span style={{ position: 'relative', width: '100%', height: '100%', display: 'grid', placeItems: 'center', fontFamily: 'var(--f-kid)', fontWeight: 800, fontSize: size * 0.6 }}>
        {initialOf(who.name[lang])}
        <Img src={`/avatars/${who.avatarBase}-neutral.webp`} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      </span>
    </span>
  );
}
