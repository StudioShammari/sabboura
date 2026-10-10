// Stand-up mode: ONE pure function that turns each spoken turn's body numbers (+ its transcript and check type) into
// "Body language notes". Notes are optional tips and NEVER part of the score, the judge, the badges, the kids or the plan checklist.
// The words for each note live in src/i18n.ts (keys body_<kind>); this file only decides which notes fire.
import { BODY_RULES, type BodyRules } from './bodyRules';

/** Percent of the time the teacher was in frame (0-100). facing = not turned away; handsVisible = at least one wrist seen. */
export interface BodyFlags {
  headDown: number; lookingAway: number; backTurned: number; handsTogetherInFront: number;
  handsHidden: number; armsCrossed: number; gesturing: number; facing: number; handsVisible: number;
}
export const FLAG_KEYS: (keyof BodyFlags)[] = ['headDown', 'lookingAway', 'backTurned', 'handsTogetherInFront', 'handsHidden', 'armsCrossed', 'gesturing', 'facing', 'handsVisible'];
export const emptyFlags = (): BodyFlags => ({ headDown: 0, lookingAway: 0, backTurned: 0, handsTogetherInFront: 0, handsHidden: 0, armsCrossed: 0, gesturing: 0, facing: 0, handsVisible: 0 });

/** What is saved per spoken turn (numbers only; no video, no images). */
export interface BodyMetrics {
  v: 1;
  talkMs: number;
  /** Share of talking time with the teacher in frame. */
  seenPct: number;
  pct: BodyFlags;
  /** The same flags for the last 3 s of the turn. */
  last3: BodyFlags;
  faceTouches: number;
}

const num = (x: unknown, lo: number, hi: number) => (typeof x === 'number' && Number.isFinite(x) ? Math.min(hi, Math.max(lo, Math.round(x))) : null);
function cleanFlags(x: unknown): BodyFlags | null {
  if (!x || typeof x !== 'object') return null;
  const out = emptyFlags();
  for (const k of FLAG_KEYS) {
    const v = num((x as Record<string, unknown>)[k], 0, 100);
    if (v === null) return null;
    out[k] = v;
  }
  return out;
}
/** Server-side check of what the browser sends. Returns null for anything malformed. */
export function cleanMetrics(x: unknown): BodyMetrics | null {
  if (!x || typeof x !== 'object') return null;
  const o = x as Record<string, unknown>;
  const talkMs = num(o.talkMs, 0, 120000), seenPct = num(o.seenPct, 0, 100), faceTouches = num(o.faceTouches, 0, 500);
  const pct = cleanFlags(o.pct), last3 = cleanFlags(o.last3);
  if (talkMs === null || seenPct === null || faceTouches === null || !pct || !last3) return null;
  return { v: 1, talkMs, seenPct, pct, last3, faceTouches };
}

export const NOTE_ORDER = ['asking', 'back', 'reading', 'lookingDown', 'pockets', 'crossed', 'still', 'nonstop', 'face'] as const;
export type NoteKind = (typeof NOTE_ORDER)[number];
export interface BodyNote {
  kind: NoteKind;
  /** The turn it happened in (null for whole-lesson notes). */
  turn: number | null;
  /** asking: the first 8 words of the question. */
  words?: string;
  /** The teacher's words in that turn (shown when the turn chip is tapped). */
  quote?: string;
  /** face: how many touches. */
  k?: number;
  /** still: the fractions example (cutting the air into pieces) or the neutral one. */
  frac?: boolean;
}
export type StrengthKind = 'askFacing' | 'facing';
export interface BodyStrength { kind: StrengthKind; turn?: number; quote?: string; x?: number }
export interface BodyStats { facing: number; lookingDown: number; handsInView: number; handMovement: number }
export interface BodyResult {
  /** The teacher was out of frame for most turns: no notes, just the "we couldn't see you" line. */
  unseen: boolean;
  stats: BodyStats | null;
  strength: BodyStrength | null;
  notes: BodyNote[];
  /** Spoken turns with numbers, and how many of them counted (in frame ≥ 60%). */
  spoken: number;
  counted: number;
}
export interface BodyTurnIn { turnNo: number; transcript: string; checkType: string; metrics: BodyMetrics | null }

const ASKING = new Set(['question', 'yes_no']);
const firstWords = (s: string, n = 8) => s.trim().split(/\s+/).filter(Boolean).slice(0, n).join(' ');

/** Saved per-turn numbers → at most 3 notes (in priority order), one strength when true, and 4 small stats. Null when no spoken turn has numbers. */
export function bodyNotes(turns: BodyTurnIn[], opts: { topicId: string }, r: BodyRules = BODY_RULES): BodyResult | null {
  const N = r.notes;
  const spoken = turns.filter((t): t is BodyTurnIn & { metrics: BodyMetrics } => !!t.metrics && t.metrics.talkMs > 0);
  if (!spoken.length) return null;
  const counted = spoken.filter((t) => t.metrics.seenPct >= N.minSeenPct);
  const unseenTurns = spoken.length - counted.length;
  if (unseenTurns > spoken.length / 2 || !counted.length) {
    return { unseen: true, stats: null, strength: null, notes: [], spoken: spoken.length, counted: counted.length };
  }

  // whole-lesson numbers, weighted by the time the teacher was in frame
  const seenMs = (t: (typeof counted)[number]) => (t.metrics.talkMs * t.metrics.seenPct) / 100;
  const totalSeen = counted.reduce((s, t) => s + seenMs(t), 0);
  const lesson = (k: keyof BodyFlags) => (totalSeen > 0 ? Math.round(counted.reduce((s, t) => s + t.metrics.pct[k] * seenMs(t), 0) / totalSeen) : 0);
  const talkMs = counted.reduce((s, t) => s + t.metrics.talkMs, 0);
  const stats: BodyStats = { facing: lesson('facing'), lookingDown: lesson('headDown'), handsInView: lesson('handsVisible'), handMovement: lesson('gesturing') };

  const lastAway = (m: BodyMetrics) => Math.max(m.last3.headDown, m.last3.lookingAway, m.last3.backTurned) >= N.lastPct;
  const isReading = (m: BodyMetrics) => m.pct.headDown >= N.readingHeadDownPct && m.pct.handsTogetherInFront >= N.readingHandsPct;
  /** The turn where it was strongest (the earliest on a tie). */
  const worst = (fires: (m: BodyMetrics) => boolean, size: (m: BodyMetrics) => number) => {
    let best: (typeof counted)[number] | null = null;
    for (const t of counted) if (fires(t.metrics) && (!best || size(t.metrics) > size(best.metrics))) best = t;
    return best;
  };
  const found: Partial<Record<NoteKind, BodyNote>> = {};
  const atTurn = (kind: NoteKind, t: (typeof counted)[number] | null | undefined, extra: Partial<BodyNote> = {}) => {
    if (t) found[kind] = { kind, turn: t.turnNo, quote: t.transcript, ...extra };
  };

  const asked = counted.find((t) => ASKING.has(t.checkType) && lastAway(t.metrics));
  if (asked) atTurn('asking', asked, { words: firstWords(asked.transcript) });
  atTurn('back', worst((m) => m.pct.backTurned >= N.backPct, (m) => m.pct.backTurned));
  atTurn('reading', worst(isReading, (m) => m.pct.headDown));
  atTurn('lookingDown', worst((m) => m.pct.headDown >= N.lookingDownPct && !isReading(m), (m) => m.pct.headDown));
  if (lesson('handsHidden') >= N.pocketsPct) found.pockets = { kind: 'pockets', turn: null };
  atTurn('crossed', worst((m) => m.pct.armsCrossed >= N.crossedPct, (m) => m.pct.armsCrossed));
  const moving = lesson('gesturing');
  if (moving < N.stillPct && talkMs >= N.stillMinTalkMs) found.still = { kind: 'still', turn: null, frac: opts.topicId === 'fractions' };
  if (moving >= N.nonstopPct) found.nonstop = { kind: 'nonstop', turn: null };
  const touches = counted.reduce((s, t) => s + t.metrics.faceTouches, 0);
  if (touches >= N.faceTouches) found.face = { kind: 'face', turn: null, k: touches };

  const notes = NOTE_ORDER.map((k) => found[k]).filter((n): n is BodyNote => !!n).slice(0, N.maxNotes);

  // one strength, when true
  let strength: BodyStrength | null = null;
  const faced = counted.find((t) => ASKING.has(t.checkType) && !lastAway(t.metrics) && t.metrics.last3.facing >= 100 - N.lastPct);
  if (faced) strength = { kind: 'askFacing', turn: faced.turnNo, quote: faced.transcript };
  else if (stats.facing >= N.facingStrengthPct && stats.lookingDown < N.lookingDownPct / 2) strength = { kind: 'facing', x: stats.facing };

  return { unseen: false, stats, strength, notes, spoken: spoken.length, counted: counted.length };
}
