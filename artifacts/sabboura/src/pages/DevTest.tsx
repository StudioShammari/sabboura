import { useState } from 'react';
import { runJudgeTest, type JudgeResult, type JudgeTest } from '@shared/judgeCheck';
import testsJson from '../../../../data/judge-tests.json';

const tests = testsJson as unknown as JudgeTest[];

export default function DevTest() {
  const [res, setRes] = useState<Record<number, JudgeResult>>({});
  const [running, setRunning] = useState(false);
  const run = async () => {
    setRunning(true); setRes({});
    const q = [...tests];
    await Promise.all(Array.from({ length: 3 }, async () => {
      for (let t = q.shift(); t; t = q.shift()) { const r = await runJudgeTest('', t); setRes((o) => ({ ...o, [r.id]: r })); }
    }));
    setRunning(false);
  };
  const done = Object.values(res);
  return (
    <main className="dev" dir="ltr">
      <h1>Judge tests (typed path, real AI)</h1>
      <button className="btn btn-primary" style={{ fontSize: '1rem' }} onClick={() => void run()} disabled={running}>{running ? 'Running…' : 'Run all 15'}</button>
      <p>{done.filter((r) => r.pass).length}/{tests.length} passed (target: 13)</p>
      <table className="replay"><tbody>
        {tests.map((t) => { const r = res[t.id]; return (
          <tr key={t.id}><td>#{t.id} {t.lang}</td><td dir={t.lang === 'ar' ? 'rtl' : 'ltr'}>{t.text}</td>
            <td>{r ? (r.pass ? 'PASS' : 'FAIL') : ''}</td><td>{r ? `${r.ms} ms` : ''}</td><td>{r?.fails.join('; ')}</td></tr>); })}
      </tbody></table>
    </main>
  );
}
