import { Badge } from '@/components/Badge';
import { KIDS } from '@/components/kids';
import { Eyebrow, SlideShell, asset } from '@/components/SlideShell';

export default function Class() {
  return (
    <SlideShell n={4}>
      <Eyebrow>Meet the class</Eyebrow>
      <h2 className="h-display" style={{ marginTop: '1.2cqw' }}>
        Five kids. Five real misconceptions.
      </h2>
      <p className="lead" style={{ marginTop: '1cqw', maxWidth: '70cqw' }}>
        Each kid holds one mistake that teachers meet every year, taken from education research. Here is the
        fractions class.
      </p>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: '1.4cqw', marginTop: '2.4cqw' }}>
        {KIDS.map((k) => (
          <div key={k.id} className="card flex flex-col" style={{ overflow: 'hidden' }}>
            <div style={{ background: 'var(--avatar-bg)', height: '12.5cqw', position: 'relative' }}>
              <img
                src={asset(`kids/${k.id}-neutral.webp`)}
                alt={k.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }}
              />
            </div>
            <div style={{ height: '0.7cqw', background: 'var(--desk)' }} />
            <div className="flex flex-col" style={{ padding: '1.1cqw 1.3cqw 1.4cqw', flex: 1 }}>
              <div className="flex items-baseline justify-between">
                <span style={{ fontFamily: 'var(--font-display-family)', fontWeight: 800, fontSize: '1.9cqw', lineHeight: 1.1 }}>
                  {k.name}
                </span>
                <span lang="ar" dir="rtl" style={{ fontFamily: 'var(--font-display-family)', fontWeight: 700, fontSize: '1.5cqw', color: 'var(--ink-muted)' }}>
                  {k.nameAr}
                </span>
              </div>
              <span style={{ fontSize: '1cqw', fontWeight: 600, color: 'var(--ink-muted)', marginTop: '0.2cqw' }}>{k.trait}</span>
              <p style={{ fontSize: '1.2cqw', lineHeight: 1.4, margin: '0.8cqw 0 0', color: 'var(--ink)' }}>{k.misconception}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center" style={{ gap: '1.2cqw', marginTop: 'auto', fontSize: '1.3cqw', fontWeight: 500 }}>
        <span>A badge moves only when the teacher’s words fix that kid’s mistake:</span>
        <Badge kind="lost" />
        <span style={{ color: 'var(--ink-muted)' }}>→</span>
        <Badge kind="partly" />
        <span style={{ color: 'var(--ink-muted)' }}>→</span>
        <Badge kind="gotit" />
      </div>
    </SlideShell>
  );
}
