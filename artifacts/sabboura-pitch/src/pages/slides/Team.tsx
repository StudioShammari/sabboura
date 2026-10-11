import { Eyebrow, SlideShell } from '@/components/SlideShell';

const TEAM = [
  {
    initials: 'MS',
    name: 'Mustafa Al Shammari',
    major: 'Computer Science',
    win: 'Winner, Ahli Fintech Competition 2026',
    icon: 'trophy',
  },
  {
    initials: 'YM',
    name: 'Yousef Al Masri',
    major: 'Software Engineering',
    win: 'Winner, JOSA Hackathon',
    icon: 'trophy',
  },
  {
    initials: 'AS',
    name: 'Ahmad Shadeed',
    major: 'Software Engineering',
    win: 'App Developer',
    icon: 'code',
  },
];

export default function Team() {
  return (
    <SlideShell n={10}>
      <Eyebrow>The team</Eyebrow>
      <h2 className="h-display" style={{ marginTop: '1.2cqw' }}>
        Three builders from PSUT.
      </h2>
      <p className="lead" style={{ marginTop: '1cqw', maxWidth: '72cqw' }}>
        Students at Princess Sumaya University for Technology, with experience building and shipping apps.
      </p>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '2cqw', marginTop: 'auto', marginBottom: '0.8cqw' }}>
        {TEAM.map((m) => (
          <div key={m.name} className="card flex flex-col" style={{ padding: '2cqw 2.2cqw 2.3cqw' }}>
            <div>
              <div
                className="board flex items-center justify-center"
                style={{ width: '9cqw', height: '7cqw', borderWidth: '0.6cqw', borderRadius: '1cqw' }}
              >
                <span className="chalk-font" style={{ fontSize: '3cqw', color: 'var(--chalk)', lineHeight: 1 }}>
                  {m.initials}
                </span>
              </div>
              <div style={{ width: '10.2cqw', height: '0.7cqw', background: 'var(--ledge)', borderRadius: '0.35cqw', marginTop: '-0.2cqw', marginLeft: '-0.6cqw' }} />
            </div>
            <h3 className="h-section" style={{ fontSize: '2.3cqw', marginTop: '1.6cqw' }}>
              {m.name}
            </h3>
            <span style={{ fontSize: '1.35cqw', fontWeight: 600, marginTop: '0.4cqw' }}>{m.major}</span>
            <span style={{ fontSize: '1.15cqw', color: 'var(--ink-muted)', marginTop: '0.15cqw' }}>Princess Sumaya University for Technology</span>
            <div style={{ marginTop: '1.4cqw' }}>
              <span
                className="flex items-center"
                style={{
                  gap: '0.7cqw',
                  background: 'var(--floor)',
                  border: '0.12cqw solid var(--line)',
                  borderRadius: '0.9cqw',
                  padding: '0.8cqw 1.1cqw',
                  fontSize: '1.15cqw',
                  fontWeight: 600,
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--action)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1.2cqw', height: '1.2cqw', flex: 'none' }} aria-hidden>
                  {m.icon === 'trophy' ? (
                    <>
                      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" />
                      <path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
                    </>
                  ) : (
                    <path d="M9 7l-5 5 5 5M15 7l5 5-5 5" />
                  )}
                </svg>
                {m.win}
              </span>
            </div>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}
