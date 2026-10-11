import { Badge } from '@/components/Badge';
import { Eyebrow, SlideShell, asset } from '@/components/SlideShell';

const POINTS = [
  {
    title: 'Real mistakes, fixed in advance',
    text: 'Each kid’s misconception comes from a fixed library based on education research, not from the AI’s imagination.',
  },
  {
    title: 'The AI must quote you',
    text: 'The AI judge checks the teacher’s words against each kid’s fixed checklist and has to quote the exact words that moved a kid.',
  },
  {
    title: 'Code counts everything',
    text: 'Code, not the AI, moves the badges, adds up the points and picks the best moment. A judge test sheet runs before every demo.',
  },
  {
    title: 'Respectful and private',
    text: 'A practice score, never an appraisal. We keep the teacher’s words as text, never their voice.',
  },
];

export default function Trust() {
  return (
    <SlideShell n={6}>
      <div className="grid h-full" style={{ gridTemplateColumns: '1fr 1fr', gap: '4.4cqw' }}>
        <div className="flex flex-col">
          <Eyebrow>Why it isn’t “just ChatGPT”</Eyebrow>
          <h2 className="h-display" style={{ marginTop: '1.2cqw', fontSize: '4cqw' }}>
            The AI never grades by vibe.
          </h2>
          <div className="flex flex-col" style={{ gap: '1.5cqw', marginTop: '2.2cqw' }}>
            {POINTS.map((p, i) => (
              <div key={p.title} className="flex" style={{ gap: '1.1cqw' }}>
                <span className="step-num" style={{ width: '2.1cqw', height: '2.1cqw', fontSize: '1.15cqw', flex: 'none' }}>
                  {i + 1}
                </span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1.45cqw', lineHeight: 1.3 }}>{p.title}</div>
                  <p className="body" style={{ fontSize: '1.2cqw', marginTop: '0.2cqw' }}>
                    {p.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <div className="board" style={{ padding: '2.2cqw 2.4cqw 2.4cqw' }}>
            <div className="flex items-center justify-between">
              <span style={{ fontSize: '1cqw', color: 'var(--chalk-dim)', fontWeight: 600 }}>The teacher said</span>
              <span lang="ar" dir="rtl" className="chalk-font" style={{ fontSize: '1.2cqw', color: 'var(--chalk-yellow)' }}>
                مقارنة الكسور
              </span>
            </div>
            <p lang="ar" dir="rtl" style={{ fontSize: '2.3cqw', fontWeight: 600, lineHeight: 1.7, margin: '0.8cqw 0 0', textAlign: 'right' }}>
              لينا،{' '}
              <span className="mark" style={{ color: 'var(--board)' }}>
                لو قسمنا الرغيف على ثلاثة بدل اتنين
              </span>
              ، القطعة بتكبر ولا بتصغر؟
            </p>
            <p style={{ fontSize: '1.1cqw', color: 'var(--chalk-dim)', margin: '0.6cqw 0 0', lineHeight: 1.45 }}>
              “Lina, if we split the loaf into three instead of two, does each piece get bigger or smaller?”
            </p>
          </div>
          <div className="ledge" />

          <div className="card flex items-center" style={{ marginTop: '1.8cqw', padding: '1.3cqw 1.6cqw', gap: '1.3cqw' }}>
            <span className="avatar" style={{ width: '5.4cqw', height: '5.4cqw', flex: 'none' }}>
              <img src={asset('kids/lina-happy.webp')} alt="Lina" />
            </span>
            <div className="flex flex-col" style={{ gap: '0.6cqw', flex: 1 }}>
              <div className="flex items-center" style={{ gap: '0.8cqw' }}>
                <span style={{ fontFamily: 'var(--font-display-family)', fontWeight: 800, fontSize: '1.7cqw' }}>Lina</span>
                <Badge kind="lost" />
                <span style={{ color: 'var(--ink-muted)', fontSize: '1.2cqw' }}>→</span>
                <Badge kind="gotit" />
              </div>
              <span style={{ fontSize: '1.1cqw', color: 'var(--ink-muted)', lineHeight: 1.4 }}>
                Moved because the quoted words match her checklist: she sees a fraction as two separate numbers.
              </span>
            </div>
          </div>
          <p style={{ fontSize: '0.95cqw', color: 'var(--ink-muted)', marginTop: '1.4cqw', lineHeight: 1.5 }}>
            Informed by Rosenshine’s Principles of Instruction, Wiliam’s formative assessment and TeachingWorks’
            high-leverage practices.
          </p>
        </div>
      </div>
    </SlideShell>
  );
}
