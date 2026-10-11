import { LogoMark } from '@/components/Logo';
import { Eyebrow, SlideShell } from '@/components/SlideShell';

type Mark = 'yes' | 'partly' | 'no';

const COLUMNS = ['Arabic & our classrooms', 'Rehearse by voice with a class', 'Kids resist until truly fixed', 'Priced for MENA schools'];

const ROWS: Array<{ name: string; note?: string; marks: Mark[]; us?: boolean }> = [
  { name: 'Sabboura', marks: ['yes', 'yes', 'yes', 'yes'], us: true },
  { name: 'Mursion', note: '(70+ universities, English)', marks: ['no', 'yes', 'partly', 'no'] },
  { name: 'ChatGPT role-play', marks: ['partly', 'partly', 'no', 'yes'] },
  { name: 'Siraj', note: '(MoE AI assistant)', marks: ['yes', 'no', 'no', 'yes'] },
  { name: 'MagicSchool & lesson-plan tools', marks: ['partly', 'no', 'no', 'yes'] },
];

const GRID = '2.1fr repeat(4, 1fr)';

function MarkIcon({ mark, size = '1.9cqw' }: { mark: Mark; size?: string }) {
  if (mark === 'partly') {
    return (
      <span aria-label="partly" style={{ fontSize: size, fontWeight: 800, color: '#9a6200', lineHeight: 1 }}>
        ~
      </span>
    );
  }
  const yes = mark === 'yes';
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke={yes ? '#0f7b6c' : '#b3361f'}
      strokeWidth={yes ? 3 : 2.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ width: size, height: size }}
      aria-label={yes ? 'yes' : 'no'}
    >
      {yes ? <path d="M4.5 12.5l5 5L19.5 7" /> : <path d="M7 7l10 10M17 7L7 17" />}
    </svg>
  );
}

export default function Competition() {
  return (
    <SlideShell n={8}>
      <Eyebrow>Competition</Eyebrow>
      <h2 className="h-display" style={{ marginTop: '1.2cqw' }}>
        Why we win
      </h2>

      <div
        style={{
          marginTop: '2.8cqw',
          border: '0.15cqw solid var(--ink)',
          borderRadius: '1.25cqw',
          overflow: 'hidden',
          background: 'var(--paper)',
          boxShadow: '0 0.3cqw 0 var(--line)',
        }}
      >
        <div className="grid" style={{ gridTemplateColumns: GRID, background: 'var(--ink)', color: 'var(--paper)' }}>
          <span />
          {COLUMNS.map((c, i) => (
            <span
              key={c}
              className="flex items-center justify-center text-center"
              style={{
                padding: '1.2cqw 1.2cqw',
                fontSize: '1.2cqw',
                fontWeight: 600,
                lineHeight: 1.3,
                borderLeft: i === 0 ? 'none' : '0.1cqw solid rgba(255, 251, 244, 0.18)',
              }}
            >
              {c}
            </span>
          ))}
        </div>
        {ROWS.map((r) => (
          <div
            key={r.name}
            className="grid"
            style={{
              gridTemplateColumns: GRID,
              alignItems: 'center',
              background: r.us ? '#fbf0cf' : undefined,
              borderTop: '0.1cqw solid var(--line)',
            }}
          >
            <span className="flex items-center" style={{ gap: '0.9cqw', padding: r.us ? '1.15cqw 1.6cqw' : '0.95cqw 1.6cqw' }}>
              {r.us && <LogoMark size="2.3cqw" />}
              <span style={{ fontSize: r.us ? '1.6cqw' : '1.45cqw', fontWeight: r.us ? 700 : 500, color: 'var(--ink)' }}>
                {r.name}
              </span>
              {r.note && <span style={{ fontSize: '1.1cqw', color: 'var(--ink-muted)' }}>{r.note}</span>}
            </span>
            {r.marks.map((m, i) => (
              <span key={i} className="flex items-center justify-center">
                <MarkIcon mark={m} />
              </span>
            ))}
          </div>
        ))}
      </div>

      <div
        className="flex items-center"
        style={{
          marginTop: 'auto',
          marginBottom: '0.6cqw',
          background: 'var(--board)',
          color: 'var(--chalk)',
          borderRadius: '1.25cqw',
          padding: '1.6cqw 2.2cqw',
          gap: '2cqw',
        }}
      >
        <span style={{ fontSize: '1.95cqw', fontWeight: 700 }}>
          Siraj helps teachers <span style={{ color: 'var(--chalk-yellow)' }}>prepare</span>. Sabboura lets them{' '}
          <span style={{ color: 'var(--chalk-yellow)' }}>rehearse</span>.
        </span>
        <span className="flex items-center" style={{ marginLeft: 'auto', gap: '0.5cqw', fontSize: '1.1cqw', color: 'var(--chalk-dim)' }}>
          <MarkIcon mark="yes" size="1.1cqw" /> yes · <MarkIcon mark="partly" size="1.2cqw" /> partly ·{' '}
          <MarkIcon mark="no" size="1.1cqw" /> no
        </span>
      </div>
    </SlideShell>
  );
}
