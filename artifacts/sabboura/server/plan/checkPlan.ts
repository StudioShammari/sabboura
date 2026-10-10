import { z } from 'zod';
import { KID_IDS, kidById, topicById, type KidId, type Lang } from '../../shared/data';
import type { Plan, PlanCheck, PlanKind, PlanRow } from '../../shared/plan';
import { AIError, claudeJSON } from '../ai/clients';
import { normalise, overlap, words } from '../lib/arabic';
import type { TurnRec } from '../rules/score';
import { DEFAULT_SETTING, classAddress, fixClassAddress, kidIdentity, kidText, type ClassSetting } from '../../shared/setting';

/** The checklist compares the teacher's own plan with what was said. It never touches the score. */

export const PLAN_CHECK_SYSTEM = `You check a practice lesson against the teacher's own plan, for Sabboura, a teacher-training simulator with AI kids.
You receive JSON: the lesson language, some plan steps (each with a number, a kind and the teacher's planned text) and the lesson log (each turn's number and the teacher's exact words).
For EACH step, decide whether the teacher actually did it:
- evidence: first, copy the teacher's exact words from the ONE turn that best shows the step, or null.
- turn: that turn's number, or null.
- status: "done" if the words clearly do what the step says; "partly" if they touch it but are vague or incomplete; "not_yet" if no turn does it.
- next_time: for "partly" or "not_yet", one sentence (at most 15 words) the teacher could say to the class next time to do this step, in the lesson language; otherwise null.
Rules: use only the teacher's words; a step counts even if it came in a different order; quote only words that appear in the log; never judge the teacher as a person; in Arabic, write next_time in clear Modern Standard Arabic with light Jordanian warmth. Return only JSON that matches the schema.`;

/** The default and boys' prompts are the plain text; a girls' class adds how to address the class. */
export const planCheckSystemFor = (s: ClassSetting) => { const a = classAddress(s); return a ? `${PLAN_CHECK_SYSTEM}\n${a}` : PLAN_CHECK_SYSTEM; };

const nullable = (t: object) => ({ anyOf: [t, { type: 'null' }] });
export const PLAN_CHECK_JSON_SCHEMA = {
  type: 'object',
  properties: {
    steps: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          step: { type: 'number' },
          evidence: nullable({ type: 'string' }),
          turn: nullable({ type: 'number' }),
          status: { type: 'string', enum: ['done', 'partly', 'not_yet'] },
          next_time: nullable({ type: 'string' }),
        },
        required: ['step', 'evidence', 'turn', 'status', 'next_time'],
        additionalProperties: false,
      },
    },
  },
  required: ['steps'],
  additionalProperties: false,
};
const PlanCheckOut = z.object({
  steps: z.array(z.object({
    step: z.number(), evidence: z.string().nullable(), turn: z.number().nullable(),
    status: z.enum(['done', 'partly', 'not_yet']), next_time: z.string().nullable(),
  })),
});

export interface PlanInput { language: Lang; topicId: string; plan: Plan; turns: TurnRec[]; setting?: ClassSetting }

const AI_KINDS: PlanKind[] = ['explain', 'example', 'other'];

function namedKid(text: string, setting: ClassSetting = DEFAULT_SETTING): KidId | null {
  const n = normalise(text);
  const ws = new Set(words(text));
  for (const k of KID_IDS) {
    const d = kidIdentity(k, setting);
    // whole words only; Arabic may carry the «ل» prefix («للينا»), but «العمر» is not Omar
    const ar = normalise(d.name.ar);
    if (ws.has(ar) || ws.has('ل' + ar)) return k;
    if (new RegExp(`\\b${d.name.en.toLowerCase()}\\b`).test(n)) return k;
  }
  return null;
}

/** Fast part: every row that code alone can decide. AI rows come back as "pending". */
export function checkPlanCode(inp: PlanInput): PlanCheck {
  const { plan, turns, language: lang } = inp;
  const setting = inp.setting ?? DEFAULT_SETTING;
  const topic = topicById(inp.topicId);
  const used: Record<string, Set<number>> = { check: new Set(), include: new Set(), challenge: new Set() };
  const nc = (k: KidId) => kidText(k, topic.kids[k].next_check, setting, lang);
  const rows: PlanRow[] = plan.steps.map((s, i): PlanRow => {
    const base = { step: i + 1, kind: s.kind, turn: null, evidence: null, next_time: null, source: 'code' as const };
    if (s.kind === 'check') {
      const t = turns.find((x) => x.check === 'question' && !used.check.has(x.turnNo));
      if (t) { used.check.add(t.turnNo); return { ...base, status: 'done', turn: t.turnNo, evidence: t.transcript }; }
      return { ...base, status: 'not_yet', next_time: nc('omar') };
    }
    if (s.kind === 'include') {
      const only = namedKid(s.text, setting);
      const free = turns.filter((x) => x.askedKid && (!only || x.askedKid === only) && !used.include.has(x.turnNo));
      const done = free.find((x) => x.check === 'question');
      const part = free[0];
      const hit = done ?? part;
      if (hit) { used.include.add(hit.turnNo); return { ...base, status: done ? 'done' : 'partly', turn: hit.turnNo, evidence: hit.transcript, next_time: done ? null : `${kidIdentity(hit.askedKid!, setting).name[lang]}${lang === 'ar' ? '،' : ','} ${nc(hit.askedKid!)}` }; }
      const k = only ?? 'lina';
      return { ...base, status: 'not_yet', next_time: `${kidIdentity(k, setting).name[lang]}${lang === 'ar' ? '،' : ','} ${nc(k)}` };
    }
    if (s.kind === 'challenge') {
      const t = turns.find((x) => x.levelsAfter.yazan === 2 && !used.challenge.has(x.turnNo));
      if (t) { used.challenge.add(t.turnNo); return { ...base, status: 'done', turn: t.turnNo, evidence: t.transcript }; }
      return { ...base, status: 'not_yet', next_time: nc('yazan') };
    }
    return { ...base, source: 'ai', status: 'pending' };
  });
  return { status: rows.some((r) => r.status === 'pending') ? 'pending' : 'done', rows };
}

/** Slow part: one Claude call for explain / example / other. Fills the pending rows in place. */
export async function checkPlanAI(inp: PlanInput, check: PlanCheck, lessonId = ''): Promise<PlanCheck> {
  const { plan, turns, language: lang } = inp;
  const pending = check.rows.filter((r) => r.status === 'pending' && AI_KINDS.includes(r.kind));
  if (!pending.length) return { ...check, status: 'done' };
  const topic = topicById(inp.topicId);
  const setting = inp.setting ?? DEFAULT_SETTING;
  const user = JSON.stringify({
    language: lang === 'ar' ? 'Arabic' : 'English',
    steps: pending.map((r) => ({ step: r.step, kind: r.kind, text: plan.steps[r.step - 1].text })),
    lesson_log: turns.map((t) => ({ turn: t.turnNo, teacher: t.transcript })),
  });
  let out: z.infer<typeof PlanCheckOut> | null = null;
  for (const timeoutMs of [20000, 15000]) {
    try {
      out = (await claudeJSON({ purpose: 'scorer', system: planCheckSystemFor(setting), user, jsonSchema: PLAN_CHECK_JSON_SCHEMA, zod: PlanCheckOut, maxTokens: 1500, timeoutMs })).value;
      break;
    } catch (e: any) {
      console.warn('[plan] AI check failed', String(e?.message ?? e));
      if (e instanceof AIError && !e.retryable) break;
    }
  }
  const rows = check.rows.map((r): PlanRow => {
    if (r.status !== 'pending') return r;
    if (!out) return { ...r, status: 'unknown' };
    const found = out.steps.find((x) => x.step === r.step);
    if (!found) return { ...r, status: 'unknown' };
    const v = { ...found, next_time: found.next_time == null ? null : fixClassAddress(found.next_time, setting) };
    const fallbackNext = r.kind === 'explain' ? kidText('sara', topic.kids.sara.next_check, setting, lang) : r.kind === 'example' ? kidText('khaled', topic.kids.khaled.next_check, setting, lang) : null;
    if (v.status === 'not_yet') return { ...r, status: 'not_yet', next_time: v.next_time?.trim() || fallbackNext };
    // the quote must really be in a turn: the stated one first, then the others
    const ev = v.evidence?.trim() ?? '';
    const order = [...turns.filter((t) => t.turnNo === v.turn), ...turns.filter((t) => t.turnNo !== v.turn)];
    const hit = ev ? order.find((t) => overlap(ev, t.transcript) >= 0.7) : undefined;
    if (!hit) {
      console.warn(`[plan] plan_evidence_mismatch lesson=${lessonId} step=${r.step}`);
      return { ...r, status: 'not_yet', next_time: v.next_time?.trim() || fallbackNext };
    }
    return { ...r, status: v.status, turn: hit.turnNo, evidence: ev, next_time: v.status === 'partly' ? v.next_time?.trim() || fallbackNext : null };
  });
  return { status: 'done', rows };
}

export async function checkPlan(inp: PlanInput, lessonId = ''): Promise<PlanCheck> {
  return checkPlanAI(inp, checkPlanCode(inp), lessonId);
}
