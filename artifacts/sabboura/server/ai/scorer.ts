import { SCORER_JSON_SCHEMA, ScorerOut, type ScoreJson } from '../../shared/schemas';
import { feedback, KID_IDS, kidById, topicById, type KidId, type Lang } from '../../shared/data';
import { AIError, claudeJSON } from './clients';
import { scorerSystemFor } from './prompts';
import { DEFAULT_SETTING, kidName, fixClassAddress, kidText, swapFromDefault, type ClassSetting } from '../../shared/setting';
import type { TurnRec } from '../rules/score';

export type AiPart = NonNullable<ScoreJson['ai']>;

export function fallbackFeedback(score: ScoreJson, lang: Lang, setting: ClassSetting = DEFAULT_SETTING): AiPart {
  const f = feedback[score.focus_move] ?? feedback.reached;
  const topic = topicById(score.topic_id);
  // The lina and yazan tips are about one kid; every other tip is class-wide.
  const tipKid: KidId | null = score.focus_move === 'lina' || score.focus_move === 'yazan' ? score.focus_move : null;
  const tip = tipKid ? kidText(tipKid, f.tip, setting, lang) : swapFromDefault(f.tip[lang] as string, setting);
  let trySay: string;
  if (typeof f.try_saying === 'string' && f.try_saying.startsWith('next_check:')) {
    const kid = f.try_saying.split(':')[1] as KidId;
    trySay = kidText(kid, topic.kids[kid].next_check, setting, lang);
  } else trySay = swapFromDefault(f.try_saying[lang], setting);
  const fin = score.final_levels;
  const anyFully = score.moves.find((m) => m.key === 'reached')!.points > 0 && KID_IDS.some((k) => fin[k] === 2);
  const anyPartly = KID_IDS.some((k) => fin[k] >= 1);
  const clarity = anyFully ? 3 : anyPartly ? 2 : 1;
  const why = score.turns === 0
    ? (lang === 'ar' ? 'الحصة كانت قصيرة وما فيها مداخلات محفوظة لنحكم على الشرح. جرّب مثال وبعدين اسأل طالب يشرح فكرته.' : 'There were no completed turns to judge yet. Try an example, then ask a student to explain their thinking.')
    : score.reached > 0
      ? (lang === 'ar' ? `بنهاية الحصة، ${score.reached} من 4 طلاب وصلوا للفهم. ابنِ على هالنتيجة بسؤال يطلب تفسير السبب.` : `By the end, ${score.reached} of 4 students reached understanding. Build on that with a question asking them to explain why.`)
      : (lang === 'ar' ? 'لسّا ما ظهر فهم كامل عند الطلاب الأربعة. ابنِ على المحاولة بمثال ملموس، واسأل طالب يشرح خطوة بكلماته.' : 'The four students have not yet shown full understanding. Build on this attempt with a concrete example and ask a student to explain one step in their own words.');
  const reason = lang === 'ar'
    ? 'تقدير احتياطي مبني على مستويات الفهم المسجّلة، وليس حكماً كاملاً على وضوح الشرح.'
    : 'A fallback estimate based on recorded understanding levels, not a full judgement of explanation clarity.';
  return { clarity, clarity_reason: reason, why_it_worked: why, one_tip: tip, try_saying: trySay, fallback: true };
}

export async function scoreWithAI(args: { score: ScoreJson; turns: TurnRec[]; setting?: ClassSetting }): Promise<AiPart> {
  const { score, turns } = args;
  const setting = args.setting ?? DEFAULT_SETTING;
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
      kids_said: t.lines.map((l) => `${kidName(l.kid, 'en', setting)}: ${l.text}`),
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
        purpose: 'scorer', system: scorerSystemFor(setting), user, jsonSchema: SCORER_JSON_SCHEMA, zod: ScorerOut,
        maxTokens: 2000, timeoutMs,
      });
      const v = r.value;
      const clarity = Math.max(0, Math.min(5, Math.round(v.clarity)));
      return { clarity, clarity_reason: v.clarity_reason, why_it_worked: v.why_it_worked, one_tip: fixClassAddress(v.one_tip, setting), try_saying: fixClassAddress(v.try_saying, setting), fallback: false };
    } catch (e) {
      last = e;
      if (!(e instanceof AIError) || !e.retryable) break;
    }
  }
  console.warn('[scorer] falling back to feedback.json:', String((last as any)?.message ?? last));
  return fallbackFeedback(score, score.language, setting);
}
