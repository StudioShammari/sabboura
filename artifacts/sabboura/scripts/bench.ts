export {};
/** Latency bench: N typed turns on fresh lessons. Usage: BASE_URL=... pnpm run bench */
const base = process.env.BASE_URL ?? `http://127.0.0.1:${process.env.PORT ?? 5000}`;
const N = Number(process.env.N ?? 5);
const text = 'تخيّلوا بيتزا وحدة. إذا قسمناها على 3، كل قطعة أصغر من لما نقسمها على 2. عشان هيك التلت أصغر من النص.';
const rows: { first: number; total: number; judge: number }[] = [];
for (let i = 0; i < N; i++) {
  const { lessonId } = await (await fetch(`${base}/api/lessons`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topicId: 'fractions', language: 'ar', teacherTitle: 'miss' }) })).json();
  const t0 = performance.now();
  const res = await fetch(`${base}/api/lessons/${lessonId}/turn`, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' }, body: JSON.stringify({ text, source: 'typed', teacherSeconds: 8 }) });
  const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
  let first = 0, buf = '', judge = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    if (!first && /event: (line|chorus)/.test(buf)) first = performance.now() - t0;
    const m = buf.match(/"judgeMs":(\d+)/); if (m) judge = Number(m[1]);
  }
  rows.push({ first: Math.round(first), total: Math.round(performance.now() - t0), judge });
  console.log(rows[rows.length - 1]);
}
const med = (a: number[]) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
console.log('median first output (ms):', med(rows.map((r) => r.first)), ' total:', med(rows.map((r) => r.total)), ' judge:', med(rows.map((r) => r.judge)));
