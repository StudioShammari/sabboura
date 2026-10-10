// Stand-up mode: the small mirrored self-view in the dock (in place of "Type instead"; T still opens typing).
// Shows whether the teacher is in frame and, if nudges are on, one quiet chip for 3 s at most once per turn.
import { Check, VideoOff } from 'lucide-react';
import type { Lang } from '@shared/data';
import { tr } from '@/i18n';
import { useCamera } from '@/lib/body/detector';
import { SelfVideo } from './CameraSetup';

export type Nudge = 'back' | 'notes' | 'pockets';

export function SelfTile({ lang, inFrame, nudge, nudgesOn, calm, onNudges }: {
  lang: Lang; inFrame: boolean; nudge: Nudge | null; nudgesOn: boolean; calm: boolean; onNudges: (on: boolean) => void;
}) {
  const cam = useCamera();
  const live = cam.status === 'on';
  const seen = live && inFrame;
  return (
    <div className="self-tile">
      <SelfVideo className="mirror" />
      {!live && <div className="self-off" aria-hidden="true"><VideoOff size={28} /></div>}
      <span className={`self-badge${seen ? ' on' : ''}`} role="status">
        {seen ? <><i className="dot" aria-hidden />{tr('selfIn', lang)}<Check size={14} strokeWidth={3} aria-hidden /></> : tr('selfOut', lang)}
      </span>
      <label className="self-nudges" title={tr('nudgesLabel', lang)}>
        <input type="checkbox" role="switch" checked={nudgesOn} disabled={calm} onChange={(e) => onNudges(e.target.checked)} />
        <span>{tr('nudgesLabel', lang)}</span>
      </label>
      {nudge && <span className="self-nudge" role="status">{tr(`nudge_${nudge}`, lang)}</span>}
    </div>
  );
}
