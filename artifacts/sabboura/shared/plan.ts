import plansJson from '../../../data/plans.json';
import type { Lang } from './data';

export const PLAN_KINDS = ['explain', 'example', 'check', 'include', 'challenge', 'other'] as const;
export type PlanKind = (typeof PLAN_KINDS)[number];
export interface PlanStep { kind: PlanKind; text: string }
export interface Plan { goal: string; steps: PlanStep[] }
export const MAX_STEPS = 6;

export interface PlanDefaults { objective: string; steps: PlanStep[]; trouble_spots: string[] }
const plans = plansJson as unknown as Record<string, Record<Lang, PlanDefaults>>;

export const hasDefaults = (topicId: string) => !!plans[topicId];
export function defaultsFor(topicId: string, lang: Lang): PlanDefaults {
  return (plans[topicId] ?? plans.fractions)[lang];
}
export const defaultPlan = (topicId: string, lang: Lang): Plan => {
  const d = defaultsFor(topicId, lang);
  return { goal: d.objective, steps: d.steps.map((s) => ({ ...s })) };
};

// ---------------- checklist result ----------------
export type PlanStatus = 'done' | 'partly' | 'not_yet' | 'unknown' | 'pending';
export interface PlanRow {
  step: number;
  kind: PlanKind;
  status: PlanStatus;
  turn: number | null;
  evidence: string | null;
  next_time: string | null;
  source: 'code' | 'ai';
}
export interface PlanCheck { status: 'pending' | 'done'; rows: PlanRow[] }

// ---------------- plan tips (code only) ----------------
const YESNO = /(فاهمين|مفهوم|واضح|تمام|ok|okay|clear|got it)\s*[?؟]|any questions|everyone understand|do you understand|هل فهمتم|أي أسئلة/i;

export type TipKey = 'yesno' | 'nocheck' | 'noinclude' | 'noexample' | 'nochallenge';
export interface PlanTip { key: TipKey; phrase?: string }

export function planTips(plan: Plan): PlanTip[] {
  const tips: PlanTip[] = [];
  for (const s of plan.steps) {
    const m = s.text.match(YESNO);
    if (m) { tips.push({ key: 'yesno', phrase: m[0].replace(/\s+/g, ' ').trim() }); break; }
  }
  const has = (k: PlanKind) => plan.steps.some((s) => s.kind === k);
  if (!has('check')) tips.push({ key: 'nocheck' });
  if (!has('include')) tips.push({ key: 'noinclude' });
  if (!has('example')) tips.push({ key: 'noexample' });
  if (!has('challenge')) tips.push({ key: 'nochallenge' });
  return tips.slice(0, 2);
}

/** Trim and bound a plan received from a client. */
export function cleanPlan(p: Plan): Plan {
  return {
    goal: p.goal.trim().slice(0, 300),
    steps: p.steps.filter((s) => s.text.trim()).slice(0, MAX_STEPS).map((s) => ({ kind: s.kind, text: s.text.trim().slice(0, 300) })),
  };
}
