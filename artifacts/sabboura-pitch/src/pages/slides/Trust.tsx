import type { ReactNode } from 'react';
import { Eyebrow, SlideShell } from '@/components/SlideShell';

function Icon({ children }: { children: ReactNode }) {
  return (
    <span
      className="flex items-center justify-center"
      style={{ width: '4.2cqw', height: '4.2cqw', flex: 'none', borderRadius: '0.9cqw', background: '#e3ebf7' }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--action)"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: '2.1cqw', height: '2.1cqw' }}
        aria-hidden
      >
        {children}
      </svg>
    </span>
  );
}

const STRIKE = <path d="M3 3l18 18" stroke="#b3361f" />;

const POINTS: Array<{ title: string; text: string; icon: ReactNode }> = [
  {
    title: 'No children’s data',
    text: 'The students are AI. No real child is ever recorded.',
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
      </>
    ),
  },
  {
    title: 'Voice never stored',
    text: 'Speech becomes text; we keep words, not recordings.',
    icon: (
      <>
        <rect x="9" y="2.5" width="6" height="12" rx="3" />
        <path d="M5 11a7 7 0 0 0 14 0M12 18v3.5" />
        {STRIKE}
      </>
    ),
  },
  {
    title: 'Video stays on the laptop',
    text: 'Body-language notes are computed on the device.',
    icon: (
      <>
        <rect x="2.5" y="6.5" width="13" height="11" rx="2" />
        <path d="M15.5 10.5l6-3.5v10l-6-3.5" />
        {STRIKE}
      </>
    ),
  },
  {
    title: 'Never for appraisal',
    text: 'Scores belong to the teacher. Schools see totals only.',
    icon: (
      <>
        <path d="M12 2.5l8 3v6c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10v-6l8-3z" />
        <path d="M8.5 12l2.5 2.5 4.5-5" />
      </>
    ),
  },
];

export default function Trust() {
  return (
    <SlideShell n={6}>
      <Eyebrow>Trust</Eyebrow>
      <h2 className="h-display" style={{ marginTop: '1.2cqw' }}>
        Built for training, not surveillance.
      </h2>

      <div
        className="grid"
        style={{ gridTemplateColumns: '1fr 1fr', gridAutoRows: '1fr', gap: '2cqw', marginTop: '3cqw', flex: 1 }}
      >
        {POINTS.map((p) => (
          <div key={p.title} className="card flex" style={{ padding: '2.2cqw 2.4cqw', gap: '1.8cqw', alignItems: 'center' }}>
            <Icon>{p.icon}</Icon>
            <div>
              <h3 className="h-section" style={{ fontSize: '2.1cqw' }}>
                {p.title}
              </h3>
              <p className="body" style={{ marginTop: '0.4cqw', fontSize: '1.45cqw' }}>
                {p.text}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: '2.4cqw',
          marginBottom: '0.6cqw',
          padding: '1.5cqw 2.2cqw',
          background: '#eaf0f9',
          border: '0.14cqw dashed #8fa7cf',
          borderRadius: '1cqw',
          fontSize: '1.35cqw',
          lineHeight: 1.5,
          color: 'var(--ink)',
        }}
      >
        Designed for Jordan’s Personal Data Protection Law (No. 24 of 2023): consent screen, one-click delete and
        retention limits ship before the first pilot.
      </div>
    </SlideShell>
  );
}
