import { demoScript } from '../shared/data';

// Runs the 4 demo-script lines as typed turns on a fresh fractions lesson, ends it, and prints the plan checklist.
const base = process.env.BASE_URL ?? `http://127.0.0.1:${process.env.PORT ?? 5000}`;
const lang = (process.env.LANG_TEST === 'en' ? 'en' : 'ar') as 'ar' | 'en';
const post = async (path: string, body: unknown) => {
  const r = await fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${path} ${r.status}`);
  return r.json() as Promise<any>;
};

const { lessonId } = await post('/api/lessons', { packId: 'lib-fractions', language: lang, teacherTitle: 'miss' });
console.log('lesson', lessonId);
for (const line of demoScript) {
  await post(`/api/lessons/${lessonId}/turn`, { text: line[lang], source: 'script', teacherSeconds: 8 });
  console.log(`turn ${line.n} sent`);
}
const end = await post(`/api/lessons/${lessonId}/end`, {});
let pc: any;
for (let i = 0; i < 40; i++) {
  pc = await (await fetch(`${base}/api/lessons/${lessonId}/plan-check`)).json();
  if (pc.check?.status === 'done') break;
  await new Promise((r) => setTimeout(r, 1000));
}
const rows: any[] = pc.check?.rows ?? [];
for (const r of rows) console.log(`${r.step}. ${r.kind.padEnd(9)} ${String(r.status).padEnd(8)} turn=${r.turn ?? '-'} [${r.source}]  next: ${r.next_time ?? '-'}`);
const by = (k: string) => rows.find((r) => r.kind === k)?.status;
const checks: [string, boolean][] = [
  ['explain done|partly', ['done', 'partly'].includes(by('explain'))],
  ['example done', by('example') === 'done'],
  ['check done (turn 3)', by('check') === 'done' && rows.find((r) => r.kind === 'check').turn === 3],
  ['include done (turn 3)', by('include') === 'done' && rows.find((r) => r.kind === 'include').turn === 3],
  ['challenge not_yet', by('challenge') === 'not_yet'],
];
for (const [n, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${n}`);
console.log(`score ${end.score?.total ?? end.score?.score ?? JSON.stringify(Object.keys(end.score ?? {}))}`);
process.exit(checks.every(([, ok]) => ok) ? 0 : 1);
