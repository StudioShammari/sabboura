import { KID_IDS, type KidId, type Level, type Levels } from '../../shared/data';
import type { JudgeOutT, KidChange } from '../../shared/schemas';

/** B4.1: fully +2, partly +1 (max 2); otherwise hurt -1 (min 0). */
export function applyLevels(before: Levels, judge: JudgeOutT | null): { levels: Levels; changes: Record<KidId, KidChange> } {
  const levels = { ...before };
  const changes = {} as Record<KidId, KidChange>;
  for (const k of KID_IDS) {
    const v = judge?.kids[k];
    const from = before[k];
    let to: number = from;
    if (v) {
      if (v.helped === 'fully') to = from + 2;
      else if (v.helped === 'partly') to = from + 1;
      else if (v.hurt) to = from - 1;
    }
    to = Math.max(0, Math.min(2, to));
    levels[k] = to as Level;
    changes[k] = {
      from,
      to: to as Level,
      change: to - from,
      helped: v?.helped ?? 'no',
      hurt: v?.hurt ?? false,
      evidence: v?.evidence ?? null,
    };
  }
  return { levels, changes };
}
