import { SCORER_JSON_SCHEMA, ScorerOut, type ScoreJson } from '../../shared/schemas';
import { feedback, KID_IDS, kidById, topicById, type Lang } from '../../shared/data';
import { AIError, claudeJSON } from './clients';
import { SCORER_SYSTEM } from './prompts';
import type { TurnRec } from '../rules/score';

export type AiPart = NonNullable<ScoreJson['ai']>;

export function fallbackFeedback(score: ScoreJson, lang: Lang): AiPart {
  const f = feedback[score.focus_move] ?? feedback.reached;
  const topic = topicById(score.topic_id);
  const tip = f.tip[lang] as string;
  let trySay: string;
  if (typeof f.try_saying === 'string' && f.try_saying.startsWith('next_check:')) {
    const kid = f.try_saying.split(':')[1] as keyof typeof topic.kids;
    trySay = topic.kids[kid].next_check[lang];
  } else trySay = f.try_saying[lang];
  const fin = score.final_levels;
  const anyFully = score.moves.find((m) => m.key === 'reached')!.points > 0 && KID_IDS.some((k) => fin[k] === 2);
  const anyPartly = KID_IDS.some((k) => fin[k] >= 1);
  const clarity = anyFully ? 3 : anyPartly ? 2 : 1;
  return { clarity, clarity_reason: '', why_it_worked: '', one_tip: tip, try_saying: trySay, fallback: true };
}

export async function scoreWithAI(args: { score: ScoreJson; turns: TurnRec[] }): Promise<AiPart> {
  const { score, turns } = args;
  const topic = topicById(score.topic_id);
  const user = JSON.stringify({
    topic: topic.title.en,
    language: score.language === 'ar' ? 'Arabic' : 'English',
    teacher_title: score.language === 'ar' ? (score.teacher_title === 'miss' ? 'مس' : 'أستاذ') : score.teacher_title === 'miss' ? 'Miss' : 'Sir',
    lesson_log: turns.map((t) => ({
      turn: t.turnNo,
      teacher: t.transcript,
      check: t.check,
      asked_kid: t.askedKid,
      kids_said: t.lines.map((l) => `${kidById(l.kid).name.en}: ${l.text}`),
      level_changes: KID_IDS.filter((k) => (t.changes[k]?.change ?? 0) !== 0).map((k) => ({ kid: k, change: t.changes[k]!.change, evidence: t.changes[k]!.evidence })),
    })),
    metrics: {
      total_without_clarity: score.total,
      yes_no_count: score.yes_no_count, question_count: score.question_count,
      reached_of_4: score.reached, partly: score.partly, voices_invited: score.voices_invited,
      final_levels: score.final_levels,
    },
    best_turn: score.best_turn,
    focus_move: score.focus_move,
  });
  let last: unknown;
  for (const timeoutMs of [10000, 8000]) {
    try {
      const r = await claudeJSON({
        purpose: 'scorer', system: SCORER_SYSTEM, user, jsonSchema: SCORER_JSON_SCHEMA, zod: ScorerOut,
        maxTokens: 2000, timeoutMs,
      });
      const v = r.value;
      const clarity = Math.max(0, Math.min(5, Math.round(v.clarity)));
      return { clarity, clarity_reason: v.clarity_reason, why_it_worked: v.why_it_worked, one_tip: v.one_tip, try_saying: v.try_saying, fallback: false };
    } catch (e) {
      last = e;
      if (!(e instanceof AIError) || !e.retryable) break;
    }
  }
  console.warn('[scorer] falling back to feedback.json:', String((last as any)?.message ?? last));
  return fallbackFeedback(score, score.language);
}
