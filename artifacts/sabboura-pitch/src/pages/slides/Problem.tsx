import { Badge } from '@/components/Badge';
import { KIDS, type BadgeKind } from '@/components/kids';
import { Eyebrow, SlideShell, asset } from '@/components/SlideShell';

const STATE: Record<string, BadgeKind> = {
  omar: 'lost',
  lina: 'lost',
  sara: 'lost',
  khaled: 'lost',
  yazan: 'bored',
};

export default function Problem() {
  return (
    <SlideShell n={2}>
      <div className="grid h-full" style={{ gridTemplateColumns: '1fr 1.02fr', gap: '4.4cqw' }}>
        <div className="flex flex-col">
          <Eyebrow>The problem</Eyebrow>
          <h2 className="h-display" style={{ marginTop: '1.2cqw', fontSize: '3.9cqw' }}>
            Pilots train in simulators.
            <br />
            Teachers practise on real kids.
          </h2>
          <p className="lead" style={{ marginTop: '1.6cqw' }}>
            A new teacher's first mistakes happen in front of 30 students. The most important skill, finding out
            what each kid actually thinks, is almost never practised.
          </p>

          <div className="card" style={{ marginTop: 'auto', padding: '1.8cqw 2.2cqw' }}>
            <div
              style={{
                display: 'inline-block',
                fontFamily: 'var(--font-display-family)',
                fontWeight: 800,
                fontSize: '4.6cqw',
                lineHeight: 1.15,
                padding: '0.1em 0.3em 0',
                borderRadius: '0.2em',
                background: 'var(--chalk-yellow)',
              }}
            >
              73–79%
            </div>
            <p className="body" style={{ marginTop: '0.9cqw', fontSize: '1.35cqw', color: 'var(--ink)' }}>
              of Jordan's teachers get feedback mainly when someone comes to observe their class.
            </p>
            <p style={{ marginTop: '0.6cqw', fontSize: '0.95cqw', color: 'var(--ink-muted)' }}>
              Source: Queen Rania Foundation, National Teacher Survey
            </p>
          </div>
        </div>

        <div className="flex flex-col" style={{ paddingTop: '0.4cqw' }}>
          <div className="board" style={{ padding: '2cqw 2.4cqw 2.2cqw' }}>
            <div className="flex items-baseline justify-between">
              <span style={{ fontSize: '1cqw', color: 'var(--chalk-dim)', fontWeight: 600 }}>Teacher</span>
              <span lang="ar" dir="rtl" className="chalk-font" style={{ fontSize: '1.2cqw', color: 'var(--chalk-yellow)' }}>
                مقارنة الكسور
              </span>
            </div>
            <p lang="ar" dir="rtl" style={{ fontSize: '3.4cqw', fontWeight: 700, margin: '0.6cqw 0 0', textAlign: 'right' }}>
              «فاهمين؟»
            </p>
            <div className="flex items-baseline justify-between" style={{ marginTop: '1.2cqw' }}>
              <span style={{ fontSize: '1cqw', color: 'var(--chalk-dim)', fontWeight: 600 }}>The whole class</span>
            </div>
            <p
              lang="ar"
              dir="rtl"
              style={{
                fontFamily: 'var(--font-display-family)',
                fontWeight: 800,
                fontSize: '5cqw',
                lineHeight: 1.1,
                margin: '0.2cqw 0 0',
                textAlign: 'right',
                color: 'var(--chalk-yellow)',
              }}
            >
              «آه مس!»
            </p>
          </div>
          <div className="ledge" />

          <div className="grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.9cqw', marginTop: '1.8cqw' }}>
            {KIDS.map((k) => (
              <div key={k.id} className="card flex flex-col items-center" style={{ padding: '0.8cqw 0.6cqw 1cqw' }}>
                <span className="avatar" style={{ width: '6cqw', height: '6cqw' }}>
                  <img src={asset(`kids/${k.id}-neutral.webp`)} alt="" />
                </span>
                <span style={{ fontFamily: 'var(--font-display-family)', fontWeight: 700, fontSize: '1.3cqw', margin: '0.4cqw 0' }}>
                  {k.name}
                </span>
                <Badge kind={STATE[k.id]} />
              </div>
            ))}
          </div>

          <p style={{ marginTop: '1.5cqw', fontSize: '1.45cqw', fontWeight: 600, color: 'var(--ink)' }}>
            They all said yes. 4 of the 5 were still lost.
          </p>
        </div>
      </div>
    </SlideShell>
  );
}
