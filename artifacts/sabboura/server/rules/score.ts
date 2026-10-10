import { KID_IDS, chorusFor, type KidId, type Levels } from '../../shared/data';
import type { ScoreJson, ScoreMove } from '../../shared/schemas';

export interface TurnRec {
  turnNo: number;
  transcript: string;
  check: 'none' | 'yes_no' | 'question';
  askedKid: KidId | null;
  chorus: boolean;
  levelsAfter: Levels;
  changes: Partial<Record<KidId, { change: number; evidence: string | null }>>;
  lines: { kid: KidId; reason: string; text: string }[];
  teacherSeconds: number;
}

const U4: KidId[] = ['omar', 'lina', 'sara', 'khaled'];
const MOVE_ORDER: ScoreMove['key'][] = ['lina', 'checks', 'reached', 'yazan', 'clarity'];

export const band = (n: number): ScoreJson['band'] => (n < 40 ? 'warmup' : n < 70 ? 'getting' : n < 90 ? 'strong' : 'excellent');

function truncWords(s: string, n: number) {
  const w = s.trim().split(/\s+/);
  return w.length <= n ? s.trim() : w.slice(0, n).join(' ') + '…';
}

/** B4.4: everything except clarity (clarity filled in later; 0 until then). */
export function computeScore(args: {
  turns: TurnRec[];
  startLevels: Levels;
  topicId: string;
  language: 'ar' | 'en';
  title: 'miss' | 'sir';
  seconds: number;
  attemptNo: number;
}): ScoreJson {
  const { turns } = args;
  const final: Levels = turns.length ? turns[turns.length - 1].levelsAfter : args.startLevels;
  const R = U4.filter((k) => final[k] === 2).length;
  const P = U4.filter((k) => final[k] === 1).length;
  const reachedPts = 5 * U4.reduce((a, k) => a + final[k], 0);

  const qTurns = turns.filter((t) => t.check === 'question');
  const ynTurns = turns.filter((t) => t.check === 'yes_no');
  const checksPts = Math.min(10 * qTurns.length, 20);

  const linaQ = qTurns.find((t) => t.askedKid === 'lina');
  const linaYN = ynTurns.find((t) => t.askedKid === 'lina');
  const linaPts = linaQ ? 15 : linaYN ? 5 : 0;

  const yazanTurn = turns.find((t) => (t.changes.yazan?.change ?? 0) > 0 && t.levelsAfter.yazan === 2);
  const yazanPts = final.yazan === 2 || yazanTurn ? 10 : 0;

  // best turn
  let best = 0, bestGain = 0;
  for (const t of turns) {
    const gain = KID_IDS.reduce((a, k) => a + Math.max(0, t.changes[k]?.change ?? 0), 0);
    if (gain > 0 && gain >= bestGain) { best = t.turnNo; bestGain = gain; }
  }
  if (!best) best = qTurns[0]?.turnNo ?? (turns[0]?.turnNo ?? 1);
  const bestRec = turns.find((t) => t.turnNo === best);

  const lastYN = ynTurns[ynTurns.length - 1];
  const lostLast = lastYN ? U4.filter((k) => lastYN.levelsAfter[k] === 0) : [];

  const voices = new Set<KidId>();
  for (const t of turns) for (const l of t.lines) if (l.reason === 'answer') voices.add(l.kid);

  // Lina lost turns
  const linaLostTurns = turns.filter((t) => t.levelsAfter.lina === 0).length;
  const linaAsked = turns.some((t) => t.askedKid === 'lina');

  const ev = (pred: (t: TurnRec) => boolean) =>
    turns.filter(pred).map((t) => ({ turn: t.turnNo, text: truncWords(t.transcript, 40) }));

  const moves: ScoreMove[] = [
    {
      key: 'reached', points: reachedPts, max: 40,
      evidence: turns.flatMap((t) =>
        U4.filter((k) => (t.changes[k]?.change ?? 0) > 0 && t.changes[k]?.evidence).map((k) => ({ turn: t.turnNo, text: t.changes[k]!.evidence! })),
      ),
    },
    { key: 'checks', points: checksPts, max: 20, evidence: ev((t) => t.check === 'question') },
    {
      key: 'lina', points: linaPts, max: 15,
      evidence: linaQ ? [{ turn: linaQ.turnNo, text: truncWords(linaQ.transcript, 40) }] : linaYN ? [{ turn: linaYN.turnNo, text: truncWords(linaYN.transcript, 40) }] : [],
      note: linaPts === 5 ? 'yes_no' : linaPts === 0 && linaLostTurns >= 2 ? 'lost' : undefined,
    },
    {
      key: 'yazan', points: yazanPts, max: 10,
      evidence: yazanTurn ? [{ turn: yazanTurn.turnNo, text: yazanTurn.changes.yazan?.evidence ?? truncWords(yazanTurn.transcript, 40) }] : [],
    },
    { key: 'clarity', points: 0, max: 15, evidence: [] },
  ];

  // focus_move is chosen before clarity is known (the scorer is told it), so clarity only wins if the four fixed-rule moves are all full.
  let focus: ScoreMove['key'] = 'clarity';
  let bestRatio = 1;
  for (const key of MOVE_ORDER.filter((k) => k !== 'clarity')) {
    const m = moves.find((x) => x.key === key)!;
    const r = m.points / m.max;
    if (r < bestRatio) { bestRatio = r; focus = key; }
  }

  const total = moves.reduce((a, m) => a + m.points, 0);
  return {
    total, band: band(total), moves,
    yes_no_count: ynTurns.length,
    lost_at_last_yes_no: lostLast.length,
    lost_kids_at_last_yes_no: lostLast,
    question_count: qTurns.length,
    voices_invited: voices.size,
    best_turn: best,
    best_turn_text: bestRec ? truncWords(bestRec.transcript, 40) : '',
    focus_move: focus,
    final_levels: final,
    reached: R, partly: P,
    turns: turns.length,
    seconds: args.seconds,
    lina_lost_turns: linaLostTurns,
    lina_named_yes_no: !!linaYN,
    chorus_text: ynTurns.length ? chorusFor(args.language, args.title) : null,
    topic_id: args.topicId,
    language: args.language,
    teacher_title: args.title,
    attempt_no: args.attemptNo,
    ai: null,
  };
}

/** Apply clarity (0-5) to a code-computed score. */
export function withClarity(score: ScoreJson, clarity: number): ScoreJson {
  const c = Math.max(0, Math.min(5, Math.round(clarity)));
  const moves = score.moves.map((m) => (m.key === 'clarity' ? { ...m, points: 3 * c } : m));
  const total = moves.reduce((a, m) => a + m.points, 0);
  return { ...score, moves, total, band: band(total) };
}
