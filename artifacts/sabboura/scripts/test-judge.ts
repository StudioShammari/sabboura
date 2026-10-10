import { readFileSync } from 'node:fs';
import { runJudgeTest, type JudgeTest } from '../shared/judgeCheck';

const base = process.env.BASE_URL ?? `http://127.0.0.1:${process.env.PORT ?? 5000}`;
const all = JSON.parse(readFileSync(new URL('../../../data/judge-tests.json', import.meta.url), 'utf8')) as JudgeTest[];
// --rows 1,2,3 runs only those test ids (all of them must pass)
const ri = process.argv.indexOf('--rows');
const rows = ri >= 0 ? new Set((process.argv[ri + 1] ?? '').split(',').map((x) => Number(x.trim())).filter(Boolean)) : null;
const tests = rows ? all.filter((t) => rows.has(t.id)) : all;
const queue = [...tests];
const results: Awaited<ReturnType<typeof runJudgeTest>>[] = [];
await Promise.all(Array.from({ length: 3 }, async () => {
  for (let t = queue.shift(); t; t = queue.shift()) {
    const r = await runJudgeTest(base, t);
    results.push(r);
    console.log(`${r.pass ? 'PASS' : 'FAIL'} #${r.id} (${r.ms} ms)${r.fails.length ? ' ' + r.fails.join('; ') : ''}`);
  }
}));
const pass = results.filter((r) => r.pass).length;
const need = rows ? tests.length : 13;
console.log(`\n${pass}/${tests.length} passed (${rows ? 'selected rows, all must pass' : 'spec target: at least 13'})`);
process.exit(pass >= need ? 0 : 1);
