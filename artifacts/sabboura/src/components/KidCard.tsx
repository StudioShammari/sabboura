import { Hand, AudioLines } from 'lucide-react';
import type { ReactNode } from 'react';
import { badgeLabel, kidById, type KidId, type Lang, type Level } from '@shared/data';
import { KidAvatar } from './KidAvatar';
import { StateBall } from './StateBall';
import { tr } from '@/i18n';

export interface CardView {
  speaking?: boolean; thinking?: boolean; hand?: boolean; asked?: boolean; unheard?: boolean; unheardPulse?: boolean;
  q?: 'paper' | 'blue' | null; dim?: boolean; spotlight?: boolean; glow?: boolean; shake?: boolean; hop?: boolean; hopDelay?: number;
  delta?: { n: number; key: string } | null;
}

export const signed = (n: number) => (n > 0 ? `+${n}` : `\u2212${Math.abs(n)}`);

export function KidCard({ kid, level, lang, view, onBadge, popover, name }: {
  kid: KidId; level: Level; lang: Lang; view: CardView; onBadge?: () => void; popover?: ReactNode; name?: string;
}) {
  const def = kidById(kid);
  const v = view;
  const cls = ['kid', v.speaking && 'speaking', v.thinking && 'thinking', v.dim && 'dim', v.spotlight && 'spotlight', level === 2 && kid !== 'yazan' && 'gotit', v.glow && 'glow',
    v.unheard && 'unheard', v.unheardPulse && 'pulse', v.shake && 'shake', v.hop && 'hop'].filter(Boolean).join(' ');
  const pill = `${kid === 'yazan' ? 'b-y' : 'b-u'}${level}`;
  return (
    <div className={cls} data-kid={kid} data-level={level} style={v.hop ? ({ ['--hop' as string]: `${v.hopDelay ?? 0}ms` } as React.CSSProperties) : undefined}>
      {v.asked && <span className="asked-chip">{tr('yourTurn', lang)}</span>}
      <div className="avatar-wrap" style={v.hop && v.hopDelay ? { animationDelay: `${v.hopDelay}ms` } : undefined}>
        <KidAvatar kid={kid} level={level} lang={lang} />
        {v.hand && <span className="hand-chip" style={v.hopDelay ? { animationDelay: `${v.hopDelay}ms` } : undefined}><Hand size={26} strokeWidth={2.5} /></span>}
        {v.q && <span className={`q-chip ${v.q === 'blue' ? 'blue' : ''}`} title={v.q === 'blue' ? tr('linaUnheard', lang) : undefined}>{lang === 'ar' ? '؟' : '?'}</span>}
      </div>
      <div className="plank" />
      <div className="kid-name">
        {v.thinking && <span className="dots" aria-hidden="true"><i /><i /><i /></span>}
        {name ?? def.name[lang]}
        {v.speaking && <AudioLines size={22} strokeWidth={2.5} aria-hidden="true" />}
      </div>
      <button type="button" className={`badge-pill ${pill}`} onClick={onBadge} aria-label={`${def.name[lang]}: ${badgeLabel(kid, level, lang)}`}>
        <StateBall level={level} kid={kid} size={26} />
        <span className="word">{badgeLabel(kid, level, lang)}</span>
        {v.delta && <span className="delta" key={v.delta.key}><bdi dir="ltr">{signed(v.delta.n)}</bdi></span>}
      </button>
      {popover}
    </div>
  );
}
