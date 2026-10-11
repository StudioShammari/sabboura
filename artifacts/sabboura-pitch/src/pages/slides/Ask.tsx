import { LogoMark } from '@/components/Logo';
import { Eyebrow, SlideShell } from '@/components/SlideShell';

const FUNDS = [
  { title: 'Operating costs', text: 'AI usage, voices and hosting for pilot schools' },
  { title: 'Hiring', text: 'Engineers, plus teacher trainers to grow the misconception library' },
  { title: 'Licenses', text: 'Software, AI model access and curriculum content' },
  { title: 'Pilots and onboarding', text: 'Training sessions and support for the first schools' },
];

const PARTNERS = [
  {
    who: 'Ministry of Education',
    text: 'Bring Sabboura to public-school teachers: a pilot with one directorate, then national teacher-training programmes.',
  },
  {
    who: 'Schools and school groups',
    text: 'Pilots with private schools this term, so their teachers rehearse with Sabboura before real lessons.',
  },
];

function Tick() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="var(--chalk-yellow)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1.5cqw', height: '1.5cqw', flex: 'none', marginTop: '0.15cqw' }} aria-hidden>
      <path d="M4 12.5l5 5L20 6.5" />
    </svg>
  );
}

export default function Ask() {
  return (
    <SlideShell n={10}>
      <Eyebrow>The ask</Eyebrow>
      <h2 className="h-display" style={{ marginTop: '1.2cqw' }}>
        Our ask: partners and 50,000 JOD.
      </h2>

      <div className="grid" style={{ gridTemplateColumns: '1.08fr 1fr', gap: '2.6cqw', marginTop: '2.4cqw' }}>
        <div>
          <div className="board" style={{ padding: '2cqw 2.6cqw 2.3cqw' }}>
            <div className="flex items-baseline justify-between">
              <span className="chalk-font" style={{ fontSize: '1.4cqw', color: 'var(--chalk-dim)' }}>
                Funding
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-display-family)', fontWeight: 800, fontSize: '5.6cqw', lineHeight: 1.05, color: 'var(--chalk-yellow)' }}>
              50,000 JOD
            </div>
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.3cqw 2cqw', marginTop: '1.4cqw' }}>
              {FUNDS.map((f) => (
                <div key={f.title} className="flex" style={{ gap: '0.7cqw' }}>
                  <Tick />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.35cqw' }}>{f.title}</div>
                    <div style={{ fontSize: '1.08cqw', color: 'var(--chalk-dim)', lineHeight: 1.4, marginTop: '0.15cqw' }}>{f.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="ledge">
            <span className="ledge-chalk" style={{ right: '4cqw' }} />
          </div>
        </div>

        <div className="flex flex-col" style={{ gap: '1.4cqw' }}>
          <span className="eyebrow" style={{ color: 'var(--action)' }}>Partnerships</span>
          {PARTNERS.map((p) => (
            <div key={p.who} className="card" style={{ padding: '1.7cqw 2cqw 1.9cqw', flex: 1 }}>
              <h3 className="h-section" style={{ fontSize: '2cqw' }}>
                {p.who}
              </h3>
              <p className="body" style={{ marginTop: '0.6cqw', fontSize: '1.25cqw' }}>
                {p.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center" style={{ marginTop: 'auto', marginBottom: '0.4cqw', gap: '1.4cqw', paddingTop: '1.4cqw', borderTop: '0.12cqw solid var(--line)' }}>
        <LogoMark size="3.6cqw" />
        <span lang="ar" dir="rtl" className="chalk-font" style={{ fontSize: '1.9cqw', color: 'var(--ink)' }}>
          «درّب حالك قبل ما تدخل الصف»
        </span>
        <span style={{ fontSize: '1.4cqw', fontWeight: 500, color: 'var(--ink-muted)' }}>Practise your lesson before you teach it.</span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-display-family)', fontWeight: 800, fontSize: '2cqw' }}>Thank you</span>
      </div>
    </SlideShell>
  );
}
