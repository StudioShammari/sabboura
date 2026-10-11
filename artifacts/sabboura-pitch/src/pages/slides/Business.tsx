import { Eyebrow, SlideShell } from '@/components/SlideShell';

const PLANS = [
  {
    who: 'Private schools & school groups',
    price: '8 JOD',
    unit: 'per teacher / month, billed yearly',
    text: 'A 40-teacher school pays about 3,840 JOD a year. One group contract covers hundreds of teachers, using training budgets they already have.',
    lead: true,
  },
  {
    who: 'Public schools',
    price: 'Free',
    unit: 'for every public-school teacher',
    text: 'Paid for by companies’ social-impact (CSR) budgets and foundations. Impact for them, a distribution channel for us.',
  },
  {
    who: 'Teacher academies & faculties',
    price: 'Per cohort',
    unit: 'per trainee, per term',
    text: 'Pre-service diplomas and new-teacher onboarding: practice hours that trainees already have to complete.',
  },
];

export default function Business() {
  return (
    <SlideShell n={7}>
      <Eyebrow>Business model</Eyebrow>
      <h2 className="h-display" style={{ marginTop: '1.2cqw', fontSize: '3.6cqw' }}>
        Teachers practise free. Schools and sponsors pay.
      </h2>

      <div className="grid" style={{ gridTemplateColumns: '1.1fr 1fr 1fr', gap: '1.8cqw', marginTop: '2.6cqw', flex: 1 }}>
        {PLANS.map((p) => (
          <div
            key={p.who}
            className="card flex flex-col"
            style={{
              padding: '2cqw 2.2cqw 2.2cqw',
              ...(p.lead ? { borderColor: 'var(--action)', boxShadow: '0 0.3cqw 0 var(--action)' } : {}),
            }}
          >
            <span className="eyebrow" style={{ fontSize: '0.95cqw', color: p.lead ? 'var(--action)' : undefined }}>
              {p.who}
            </span>
            <span style={{ fontFamily: 'var(--font-display-family)', fontWeight: 800, fontSize: '4.4cqw', lineHeight: 1.1, marginTop: '0.8cqw' }}>
              {p.price}
            </span>
            <span style={{ fontSize: '1.15cqw', fontWeight: 600, color: 'var(--ink)' }}>{p.unit}</span>
            <p className="body" style={{ marginTop: '1cqw', fontSize: '1.35cqw' }}>
              {p.text}
            </p>
          </div>
        ))}
      </div>

      <div className="board flex items-center" style={{ marginTop: '2cqw', marginBottom: '0.4cqw', padding: '1.5cqw 2.4cqw', gap: '2.4cqw' }}>
        <span className="chalk-font" style={{ fontSize: '1.4cqw', color: 'var(--chalk-yellow)', flex: 'none' }}>
          Unit economics
        </span>
        <span style={{ fontSize: '1.35cqw', lineHeight: 1.45 }}>
          About <b>$0.25</b> of AI cost per 10-minute session, so about <b>$2</b> per teacher a month at 8 sessions,
          against about <b>$11</b> (8 JOD) of revenue.
        </span>
        <span style={{ fontSize: '1cqw', color: 'var(--chalk-dim)', flex: 'none', marginLeft: 'auto' }}>Estimate · measured in pilots</span>
      </div>
    </SlideShell>
  );
}
