import { Eyebrow, SlideShell, asset } from '@/components/SlideShell';

const MARKETS: Array<{
  flag: string;
  country: string;
  figure: string;
  text: string;
  tag?: { label: string; bg: string; color: string };
}> = [
  {
    flag: 'flags/jo.svg',
    country: 'Jordan',
    figure: '147K',
    text: 'teachers · 43K in private schools',
    tag: { label: 'Prove it here first', bg: '#dcefe6', color: '#0f7b6c' },
  },
  {
    flag: 'flags/sa.svg',
    country: 'Saudi Arabia',
    figure: '525K',
    text: 'teachers',
    tag: { label: 'Scale market', bg: '#e3ebf7', color: 'var(--action)' },
  },
  {
    flag: 'flags/ae.svg',
    country: 'UAE',
    figure: '75 hrs',
    text: 'of PD required per teacher per year (Abu Dhabi) · GEMS alone: 10K+ educators',
  },
];

/** Dashed route from Jordan (start, ringed) to the Gulf. Coordinates line up with the card grid below. */
function Route() {
  const dots = [128, 750, 1372];
  return (
    <svg viewBox="0 0 1500 100" style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }} aria-hidden>
      <path
        d="M128 50 C330 22 500 95 750 50 C950 5 1150 -5 1372 50"
        fill="none"
        stroke="#9fb6df"
        strokeWidth="5"
        strokeDasharray="16 11"
        strokeLinecap="round"
      />
      <circle cx={dots[0]} cy="50" r="31" fill="var(--limestone)" stroke="#c4c2c3" strokeWidth="7" />
      {dots.map((x) => (
        <circle key={x} cx={x} cy="50" r="18" fill="var(--action)" />
      ))}
    </svg>
  );
}

export default function Market() {
  return (
    <SlideShell n={9}>
      <Eyebrow>Market</Eyebrow>
      <h2 className="h-display" style={{ marginTop: '1.2cqw' }}>
        Jordan first. MENA ready.
      </h2>

      <div style={{ marginTop: '3.2cqw' }}>
        <Route />
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '2cqw', marginTop: '2.4cqw' }}>
        {MARKETS.map((m) => (
          <div
            key={m.country}
            className="flex flex-col"
            style={{
              background: 'var(--paper)',
              border: '0.15cqw solid var(--ink)',
              borderRadius: '1.25cqw',
              boxShadow: '0 0.3cqw 0 var(--line)',
              padding: '2.2cqw 2.2cqw 2.4cqw',
              minHeight: '19cqw',
            }}
          >
            <span className="flex items-center" style={{ gap: '0.8cqw' }}>
              <img
                src={asset(m.flag)}
                alt=""
                style={{ width: '2.1cqw', height: '1.575cqw', borderRadius: '0.2cqw', boxShadow: '0 0 0 0.08cqw rgba(43, 33, 24, 0.25)' }}
              />
              <span style={{ fontSize: '1.75cqw', fontWeight: 700, color: 'var(--ink)' }}>{m.country}</span>
            </span>
            <span
              style={{
                fontFamily: 'var(--font-display-family)',
                fontWeight: 800,
                fontSize: '5.6cqw',
                lineHeight: 1.05,
                color: 'var(--action-dark)',
                marginTop: '1cqw',
              }}
            >
              {m.figure}
            </span>
            <span style={{ fontSize: '1.4cqw', lineHeight: 1.4, color: 'var(--ink-muted)', marginTop: '0.3cqw' }}>{m.text}</span>
            {m.tag && (
              <span
                style={{
                  alignSelf: 'flex-start',
                  marginTop: '1.3cqw',
                  padding: '0.45cqw 1.1cqw',
                  borderRadius: '99cqw',
                  background: m.tag.bg,
                  color: m.tag.color,
                  fontSize: '1.15cqw',
                  fontWeight: 700,
                }}
              >
                {m.tag.label}
              </span>
            )}
          </div>
        ))}
      </div>

      <p style={{ marginTop: 'auto', marginBottom: '0.6cqw', fontSize: '1.1cqw', color: 'var(--ink-muted)' }}>
        Sources: Jordan MoE 2025/26 · Saudi education statistics · ADEK · GEMS Education
      </p>
    </SlideShell>
  );
}
