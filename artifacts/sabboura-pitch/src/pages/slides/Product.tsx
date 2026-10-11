import { Eyebrow, SlideShell } from '@/components/SlideShell';

const FEATURES = [
  {
    title: 'Arabic and English, by voice',
    text: 'Teach out loud in Jordanian Arabic or English. The kids answer in their own voices, with captions always on.',
  },
  {
    title: 'Any lesson, from a photo',
    text: 'Upload a PDF or snap a page. We read it, delete the file and keep only the lesson plan.',
  },
  {
    title: 'Stand-up mode',
    text: 'Practise standing, like the real class. Body-language notes are computed on the laptop; no video leaves the device.',
  },
  {
    title: 'The after-lesson review',
    text: 'Who you reached, five teaching moves, each kid’s secret mistake revealed, and one tip for tomorrow.',
  },
  {
    title: 'A school view',
    text: 'Aggregates only, never individual teachers. Shows school leaders which teaching move their staff miss most.',
  },
  {
    title: 'Accessible by design',
    text: 'Typing mode, tap mode and Calm mode, for teachers who can’t or don’t want to hold a button.',
  },
];

export default function Product() {
  return (
    <SlideShell n={7}>
      <Eyebrow>Built and working today</Eyebrow>
      <div className="flex items-end justify-between" style={{ marginTop: '1.2cqw', gap: '4cqw' }}>
        <h2 className="h-display">Not a mock-up. A working product.</h2>
      </div>
      <p className="lead" style={{ marginTop: '1cqw', maxWidth: '72cqw' }}>
        Designed for a projector and a laptop, so a teacher can rehearse at home the night before, or a trainer can
        run it live in a workshop.
      </p>

      <div
        className="grid"
        style={{ gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(2, 1fr)', gap: '1.6cqw', marginTop: '3cqw', marginBottom: '0.6cqw', flex: 1 }}
      >
        {FEATURES.map((f) => (
          <div key={f.title} className="card flex flex-col justify-center" style={{ padding: '1.7cqw 2.2cqw 1.9cqw' }}>
            <div className="flex items-center" style={{ gap: '0.8cqw' }}>
              <span style={{ width: '0.9cqw', height: '0.9cqw', borderRadius: 999, background: 'var(--action)', flex: 'none' }} />
              <h3 className="h-section" style={{ fontSize: '1.85cqw' }}>
                {f.title}
              </h3>
            </div>
            <p className="body" style={{ marginTop: '0.8cqw', fontSize: '1.38cqw' }}>
              {f.text}
            </p>
          </div>
        ))}
      </div>
    </SlideShell>
  );
}
