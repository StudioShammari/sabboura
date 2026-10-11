import type { ReactNode } from 'react';
import { Badge } from '@/components/Badge';
import { Eyebrow, SlideShell, asset } from '@/components/SlideShell';

function Chip({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        background: 'var(--floor)',
        border: '0.12cqw solid var(--line)',
        borderRadius: 999,
        padding: '0.4cqw 0.9cqw',
        fontSize: '1cqw',
        fontWeight: 600,
        color: 'var(--ink)',
      }}
    >
      {children}
    </span>
  );
}

const STEPS: Array<{ n: number; title: string; ar: string; text: string; foot: ReactNode }> = [
  {
    n: 1,
    title: 'Plan',
    ar: 'قبل الحصة',
    text: 'Upload tomorrow’s lesson as a PDF or a phone photo. Sabboura reads it, finds where kids will get stuck and drafts a 5-step plan.',
    foot: (
      <div className="flex" style={{ gap: '0.6cqw' }}>
        <Chip>PDF</Chip>
        <Chip>Phone photo</Chip>
        <Chip>5-step plan</Chip>
      </div>
    ),
  },
  {
    n: 2,
    title: 'Teach',
    ar: 'الحصة',
    text: 'Teach out loud, in Arabic or English, to five AI kids. They answer back, push back, and stay lost until your words actually reach them.',
    foot: (
      <div className="flex" style={{ gap: '0.5cqw' }}>
        {['omar', 'lina', 'sara', 'khaled', 'yazan'].map((k) => (
          <span key={k} className="avatar" style={{ width: '3.4cqw', height: '3.4cqw', borderRadius: '0.7cqw' }}>
            <img src={asset(`kids/${k}-neutral.webp`)} alt="" />
          </span>
        ))}
      </div>
    ),
  },
  {
    n: 3,
    title: 'Reflect',
    ar: 'بعد الحصة',
    text: 'A calm review: who you reached, your five teaching moves, one tip and the exact sentence to try in tomorrow’s real class.',
    foot: (
      <div className="flex items-center" style={{ gap: '0.6cqw' }}>
        <Badge kind="lost" />
        <span style={{ color: 'var(--ink-muted)' }}>→</span>
        <Badge kind="partly" />
        <span style={{ color: 'var(--ink-muted)' }}>→</span>
        <Badge kind="gotit" />
      </div>
    ),
  },
];

export default function Solution() {
  return (
    <SlideShell n={3}>
      <Eyebrow>The solution</Eyebrow>
      <div className="flex items-end justify-between" style={{ marginTop: '1.2cqw', gap: '4cqw' }}>
        <h2 className="h-display" style={{ fontSize: '4.6cqw' }}>
          A flight simulator
          <br />
          for teachers.
        </h2>
        <p className="lead" style={{ maxWidth: '40cqw', paddingBottom: '0.6cqw' }}>
          Practise a real lesson on a class of five AI kids. Each kid secretly holds one real, well-researched
          misconception. Ten minutes, any time, no audience.
        </p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '2cqw', marginTop: '3.2cqw', flex: 1, marginBottom: '0.6cqw' }}>
        {STEPS.map((s) => (
          <div key={s.n} className="card flex flex-col" style={{ padding: '2.2cqw 2.2cqw 2.2cqw' }}>
            <div className="flex items-center justify-between">
              <span className="step-num">{s.n}</span>
              <span lang="ar" dir="rtl" style={{ fontSize: '1.3cqw', fontWeight: 600, color: 'var(--ink-muted)' }}>
                {s.ar}
              </span>
            </div>
            <h3 className="h-section" style={{ fontSize: '2.8cqw', marginTop: '1.3cqw' }}>
              {s.title}
            </h3>
            <p className="body" style={{ marginTop: '0.8cqw', fontSize: '1.45cqw' }}>
              {s.text}
            </p>
            <div style={{ marginTop: 'auto', paddingTop: '1.4cqw', borderTop: '0.12cqw dashed var(--line)' }}>{s.foot}</div>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}
