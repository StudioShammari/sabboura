/** Judge test runner shared by /dev/test and scripts/test-judge.ts. Each test is one typed turn on a fresh fractions lesson. */
import type { KidId } from './data';
import type { StateEvent, TurnEvent } from './schemas';

export interface JudgeTest {
  id: number; lang: 'ar' | 'en'; text: string;
  expect: {
    helped?: Partial<Record<KidId, string[]>>; check?: string[]; speakers?: string[]; hurt?: Partial<Record<KidId, boolean>>;
    chorus?: boolean; unchanged?: KidId[]; asked_kid?: string;
  };
}
export interface JudgeResult { id: number; pass: boolean; fails: string[]; ms: number; judge?: StateEvent['judge'] }

export function checkState(t: JudgeTest, s: StateEvent): string[] {
  const f: string[] = [];
  const e = t.expect;
  for (const [k, ok] of Object.entries(e.helped ?? {})) { const v = s.levels[k as KidId].helped; if (!ok!.includes(v)) f.push(`helped.${k}=${v}, want ${ok!.join('|')}`); }
  if (e.check && !e.check.includes(s.check)) f.push(`check=${s.check}, want ${e.check.join('|')}`);
  for (const sp of e.speakers ?? []) if (!s.speakers.some((x) => `${x.kid}:${x.reason}` === sp)) f.push(`missing speaker ${sp}`);
  for (const [k, h] of Object.entries(e.hurt ?? {})) if (s.levels[k as KidId].hurt !== h) f.push(`hurt.${k}=${s.levels[k as KidId].hurt}`);
  if (e.chorus !== undefined && s.chorus !== e.chorus) f.push(`chorus=${s.chorus}`);
  for (const k of e.unchanged ?? []) if (s.levels[k].change !== 0) f.push(`${k} changed ${s.levels[k].change}`);
  if (e.asked_kid !== undefined && s.askedKid !== e.asked_kid) f.push(`asked_kid=${s.askedKid}, want ${e.asked_kid}`);
  if (!s.judge.ok) f.push('judge failed (fallback used)');
  return f;
}

export async function runJudgeTest(base: string, t: JudgeTest): Promise<JudgeResult> {
  const t0 = Date.now();
  try {
    const c = await fetch(`${base}/api/lessons`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topicId: 'fractions', language: t.lang, teacherTitle: 'miss' }) });
    const { lessonId } = await c.json();
    const r = await fetch(`${base}/api/lessons/${lessonId}/turn`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ text: t.text, source: 'typed', teacherSeconds: 6 }) });
    const j = await r.json();
    const st = (j.events as TurnEvent[]).find((x) => x.event === 'state');
    if (!st || st.event !== 'state') return { id: t.id, pass: false, fails: ['no state event'], ms: Date.now() - t0 };
    const fails = checkState(t, st.data);
    return { id: t.id, pass: fails.length === 0, fails, ms: Date.now() - t0, judge: st.data.judge };
  } catch (e) {
    return { id: t.id, pass: false, fails: [String((e as Error).message)], ms: Date.now() - t0 };
  }
}
