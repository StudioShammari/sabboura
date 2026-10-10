/** Chalk tally marks: groups of five with a diagonal. */
export function Tally({ count }: { count: number }) {
  const groups = Math.floor(count / 5), rest = count % 5;
  const mark = (n: number, k: string) => (
    <svg key={k} viewBox="0 0 30 26" aria-hidden="true">
      {Array.from({ length: Math.min(n, 4) }).map((_, i) => <line key={i} x1={4 + i * 6} y1="2" x2={4 + i * 6} y2="24" stroke="var(--chalk-yellow)" strokeWidth="2.6" strokeLinecap="round" />)}
      {n >= 5 && <line x1="1" y1="20" x2="29" y2="6" stroke="var(--chalk-yellow)" strokeWidth="2.6" strokeLinecap="round" />}
    </svg>
  );
  return <span style={{ display: 'inline-flex', gap: 6 }}>{Array.from({ length: groups }).map((_, i) => mark(5, `g${i}`))}{rest > 0 && mark(rest, 'r')}</span>;
}
