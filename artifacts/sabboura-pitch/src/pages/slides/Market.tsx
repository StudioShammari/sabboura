import { Eyebrow, SlideShell } from '@/components/SlideShell';

const ROWS: Array<[string, string, string]> = [
  ['Who plays the kids', 'A trained human actor', 'AI kids with fixed rules'],
  ['Cost per session', 'An actor’s paid hour', 'Cents'],
  ['Language', 'English', 'Arabic and English'],
  ['When', 'Booked in advance', 'Any time, 10 minutes'],
];

const PATH = [
  { step: 'Now', title: 'Jordan', text: 'Private school groups first; public schools through the Ministry and sponsors.' },
  { step: 'Next', title: 'The Gulf', text: 'Large teacher training and licensing budgets. Jordanian, Gulf and IB curricula.' },
  { step: 'Later', title: 'New audiences', text: 'Parent meetings and classroom management, then customer service and sales training.' },
];

export default function Market() {
  return (
    <SlideShell n={9}>
      <Eyebrow>Market and why we win</Eyebrow>
      <h2 className="h-display" style={{ marginTop: '1.2cqw', fontSize: '3.6cqw' }}>
        Classroom simulators already sell.
        <br />
        We remove the actor.
      </h2>

      <div className="grid" style={{ gridTemplateColumns: '1.15fr 1fr', gap: '3.4cqw', marginTop: '2cqw', flex: 1 }}>
        <div className="flex flex-col">
          <div className="card" style={{ overflow: 'hidden' }}>
            <div
              className="grid"
              style={{ gridTemplateColumns: '0.9fr 1fr 1fr', background: 'var(--floor)', fontWeight: 700, fontSize: '1.15cqw', padding: '0.8cqw 1.6cqw' }}
            >
              <span />
              <span>Mursion (US)</span>
              <span className="ink-blue">Sabboura</span>
            </div>
            {ROWS.map(([label, them, us], i) => (
              <div
                key={label}
                className="grid"
                style={{
                  gridTemplateColumns: '0.9fr 1fr 1fr',
                  padding: '0.75cqw 1.6cqw',
                  fontSize: '1.2cqw',
                  borderTop: i === 0 ? 'none' : '0.1cqw solid var(--line)',
                  alignItems: 'center',
                }}
              >
                <span style={{ color: 'var(--ink-muted)', fontWeight: 500 }}>{label}</span>
                <span>{them}</span>
                <span style={{ fontWeight: 700 }}>{us}</span>
              </div>
            ))}
          </div>
          <p className="body" style={{ marginTop: '1cqw', fontSize: '1.1cqw' }}>
            Mursion raised a $20M Series B (2020). A human actor plays every avatar.
          </p>
          <div className="board" style={{ marginTop: 'auto', padding: '1.1cqw 1.8cqw 1.2cqw' }}>
            <span className="chalk-font" style={{ fontSize: '1.3cqw', color: 'var(--chalk-yellow)' }}>
              What protects us
            </span>
            <p style={{ fontSize: '1.25cqw', lineHeight: 1.45, margin: '0.4cqw 0 0' }}>
              A misconception library per curriculum, in Arabic, plus data on which explanations actually work.
            </p>
          </div>
        </div>

        <div className="flex flex-col" style={{ gap: '1.3cqw' }}>
          {PATH.map((p, i) => (
            <div key={p.step} className="card flex" style={{ padding: '1.5cqw 1.8cqw', gap: '1.4cqw', flex: 1, alignItems: 'flex-start' }}>
              <span className="step-num" style={{ flex: 'none' }}>
                {i + 1}
              </span>
              <div>
                <div className="flex items-baseline" style={{ gap: '0.8cqw' }}>
                  <span className="h-section" style={{ fontSize: '1.8cqw' }}>
                    {p.title}
                  </span>
                  <span className="eyebrow" style={{ fontSize: '0.9cqw' }}>
                    {p.step}
                  </span>
                </div>
                <p className="body" style={{ marginTop: '0.4cqw', fontSize: '1.2cqw' }}>
                  {p.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SlideShell>
  );
}
