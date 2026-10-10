import { Hand, AudioLines } from 'lucide-react';
import type { ReactNode } from 'react';
import { badgeLabel, type KidId, type Lang, type Level } from '@shared/data';
import { kidIdentity } from '@shared/setting';
import { useSetting } from '@/lib/classSetting';
import { KidAvatar } from './KidAvatar';
import { StateBall } from './StateBall';
import { linaUnheardText, tr } from '@/i18n';

export interface CardView {
  speaking?: boolean; thinking?: boolean; hand?: boolean; raised?: boolean; asked?: boolean; unheard?: boolean; unheardPulse?: boolean;
  q?: 'paper' | 'blue' | null; dim?: boolean; spotlight?: boolean; glow?: boolean; shake?: boolean; hop?: boolean; hopDelay?: number;
  delta?: { n: number; key: string } | null;
}

export const signed = (n: number) => (n > 0 ? `+${n}` : `\u2212${Math.abs(n)}`);

export function KidCard({ kid, level, lang, view, onBadge, onCallOn, popover, name }: {
  kid: KidId; level: Level; lang: Lang; view: CardView; onBadge?: () => void; onCallOn?: () => void; popover?: ReactNode; name?: string;
}) {
  const setting = useSetting();
  const def = kidIdentity(kid, setting);
  const v = view;
  const cls = ['kid', v.speaking && 'speaking', v.thinking && 'thinking', v.dim && 'dim', v.spotlight && 'spotlight', level === 2 && kid !== 'yazan' && 'gotit', v.glow && 'glow',
    v.unheard && 'unheard', v.unheardPulse && 'pulse', v.shake && 'shake', v.hop && 'hop', v.raised && 'raised'].filter(Boolean).join(' ');
  const pill = `${kid === 'yazan' ? 'b-y' : 'b-u'}${level}`;
  return (
    <div className={cls} data-kid={kid} data-level={level} style={v.hop ? ({ ['--hop' as string]: `${v.hopDelay ?? 0}ms` } as React.CSSProperties) : undefined}>
      {v.asked && <span className="asked-chip">{tr('yourTurn', lang)}</span>}
      <div className="avatar-wrap" style={v.hop && v.hopDelay ? { animationDelay: `${v.hopDelay}ms` } : undefined}>
        <KidAvatar kid={kid} level={level} lang={lang} eager={!!(v.hand || v.raised)} />
        {v.raised && onCallOn && (
          <button type="button" className="call-on" onClick={onCallOn} aria-label={`${tr('callOn', lang)} ${name ?? def.name[lang]}`} title={`${tr('callOn', lang)} ${name ?? def.name[lang]}`} />
        )}
        {(v.hand || v.raised) && <span className={`hand-chip ${v.raised ? 'up' : ''}`} style={v.hopDelay ? { animationDelay: `${v.hopDelay}ms` } : undefined}><Hand size={26} strokeWidth={2.5} /></span>}
        {v.q && <span className={`q-chip ${v.q === 'blue' ? 'blue' : ''}`} title={v.q === 'blue' ? linaUnheardText(setting, lang) : undefined}>{lang === 'ar' ? '؟' : '?'}</span>}
      </div>
      <div className="plank" />
      <div className="kid-name">
        {v.thinking && <span className="dots" aria-hidden="true"><i /><i /><i /></span>}
        {name ?? def.name[lang]}
        {v.speaking && <AudioLines size={22} strokeWidth={2.5} aria-hidden="true" />}
      </div>
      <button type="button" className={`badge-pill ${pill}`} onClick={onBadge} aria-label={`${def.name[lang]}: ${badgeLabel(kid, level, lang, def.gender)}`}>
        <StateBall level={level} kid={kid} size={26} />
        <span className="word">{badgeLabel(kid, level, lang, def.gender)}</span>
        {v.delta && <span className="delta" key={v.delta.key}><bdi dir="ltr">{signed(v.delta.n)}</bdi></span>}
      </button>
      {popover}
    </div>
  );
}
