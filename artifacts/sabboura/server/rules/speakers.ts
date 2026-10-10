import type { KidId, Levels } from '../../shared/data';
import type { CheckType, KidChange, Speaker } from '../../shared/schemas';

const UNDERSTANDERS: KidId[] = ['omar', 'lina', 'sara', 'khaled'];
const AHA_ORDER: KidId[] = ['lina', 'omar', 'sara', 'khaled'];
const OBJECTORS: KidId[] = ['omar', 'sara', 'khaled'];

export interface ChooseInput {
  levels: Levels;
  changes: Record<KidId, KidChange>;
  check: CheckType;
  askedKid: KidId | null;
  /** False when the teacher is only chatting (greeting, hook, small talk). */
  onTopic?: boolean;
  rand?: () => number;
}

/** B4.2: pure function. Decide after new levels are set. At most 2 speakers. */
export function chooseSpeakers(i: ChooseInput): { chorus: boolean; speakers: Speaker[] } {
  const { levels, changes, check, askedKid } = i;
  if (i.onTopic === false) {
    // Chat: kids just react to what was said. No chorus, no misconceptions.
    const rand = i.rand ?? Math.random;
    const pool = (['omar', 'sara', 'khaled', 'lina', 'yazan'] as KidId[]).filter((k) => k !== askedKid);
    const pick = pool.sort(() => rand() - 0.5);
    const want = check === 'question' ? 2 : 1;
    const list: KidId[] = askedKid ? [askedKid, ...pick] : pick;
    return { chorus: false, speakers: list.slice(0, want).map((kid) => ({ kid, reason: 'chat' as const })) };
  }
  if (check === 'yes_no' && !askedKid) return { chorus: true, speakers: [] };

  const reached2 = (k: KidId) => changes[k].to === 2 && changes[k].from < 2;
  const ahaKids = AHA_ORDER.filter(reached2);

  if (askedKid) {
    const speakers: Speaker[] = [{ kid: askedKid, reason: check === 'yes_no' ? 'timid_yes' : 'answer' }];
    const other = ahaKids.find((k) => k !== askedKid);
    if (other) speakers.push({ kid: other, reason: 'aha' });
    return { chorus: false, speakers };
  }

  if (check === 'question') {
    const k = OBJECTORS.find((x) => levels[x] < 2);
    return { chorus: false, speakers: [{ kid: k ?? 'yazan', reason: 'answer' }] };
  }

  const list: Speaker[] = [];
  for (const k of ahaKids) list.push({ kid: k, reason: 'aha' });
  for (const k of OBJECTORS) {
    if (levels[k] < 2 && changes[k].helped === 'no') list.push({ kid: k, reason: 'objection' });
  }
  if (levels.yazan === 0) list.push({ kid: 'yazan', reason: 'bored' });
  return { chorus: false, speakers: list.slice(0, 2) };
}

/** Lina's unheard ring: still lost from turn 2, never asked by name. */
export function linaUnheard(turnNo: number, levels: Levels, linaEverAsked: boolean) {
  return turnNo >= 2 && levels.lina === 0 && !linaEverAsked;
}

export { UNDERSTANDERS };
