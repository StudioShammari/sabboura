import { readFileSync } from 'node:fs';
import { runJudgeTest, type JudgeTest } from '../shared/judgeCheck';

const base = process.env.BASE_URL ?? `http://127.0.0.1:${process.env.PORT ?? 5000}`;
const tests = JSON.parse(readFileSync(new URL('../../../data/judge-tests.json', import.meta.url), 'utf8')) as JudgeTest[];
let pass = 0;
const queue = [...tests];
const results: Awaited<ReturnType<typeof runJudgeTest>>[] = [];
await Promise.all(Array.from({ length: 3 }, async () => {
  for (let t = queue.shift(); t; t = queue.shift()) {
    const r = await runJudgeTest(base, t);
    results.push(r);
    console.log(`${r.pass ? 'PASS' : 'FAIL'} #${r.id} (${r.ms} ms)${r.fails.length ? ' ' + r.fails.join('; ') : ''}`);
  }
}));
pass = results.filter((r) => r.pass).length;
console.log(`\n${pass}/${tests.length} passed (spec target: at least 13)`);
process.exit(pass >= 13 ? 0 : 1);
