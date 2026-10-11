import { useEffect, useRef, useState } from 'react';
import { Eyebrow, SlideShell, asset } from '@/components/SlideShell';

const BEATS = [
  'Omar pushes back with his wrong idea.',
  'Sara wants the reason, not the rule.',
  'A real question, by name, brings Lina’s hidden mistake out.',
  'Badges move only when the teacher’s words fix the mistake.',
];

export default function Demo({ active }: { active?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(false);

  // Play from the start when the slide opens, pause when it closes.
  // Browsers may refuse sound without a click: fall back to muted playback
  // and show a button that turns the sound on.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (!active) {
      video.pause();
      return;
    }
    video.currentTime = 0;
    video.muted = false;
    video
      .play()
      .then(() => setMuted(false))
      .catch(() => {
        video.muted = true;
        setMuted(true);
        video.play().catch(() => undefined);
      });
  }, [active]);

  const turnSoundOn = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    setMuted(false);
    if (video.paused) video.play().catch(() => undefined);
  };

  return (
    <SlideShell n={5} tone="dark">
      <div className="grid h-full" style={{ gridTemplateColumns: '1fr 61cqw', gap: '3.4cqw', alignItems: 'center' }}>
        <div className="flex flex-col">
          <Eyebrow dark>Demo · 30 seconds</Eyebrow>
          <h2 className="h-display" style={{ color: 'var(--chalk)', marginTop: '1.2cqw', fontSize: '3.8cqw' }}>
            Watch a lesson.
          </h2>
          <p lang="ar" dir="rtl" className="chalk-font" style={{ fontSize: '1.6cqw', color: 'var(--chalk-yellow)', margin: '1cqw 0 0', textAlign: 'left' }}>
            مقارنة الكسور
          </p>
          <ol style={{ listStyle: 'none', padding: 0, margin: '2.2cqw 0 0', display: 'flex', flexDirection: 'column', gap: '1.3cqw' }}>
            {BEATS.map((b, i) => (
              <li key={b} className="flex" style={{ gap: '0.9cqw', fontSize: '1.35cqw', lineHeight: 1.4, color: 'var(--chalk)' }}>
                <span
                  style={{
                    flex: 'none',
                    width: '1.9cqw',
                    height: '1.9cqw',
                    borderRadius: 999,
                    border: '0.14cqw solid var(--chalk-dim)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1cqw',
                    fontWeight: 700,
                    color: 'var(--chalk-dim)',
                    marginTop: '0.05cqw',
                  }}
                >
                  {i + 1}
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="video-frame">
          <video
            ref={videoRef}
            src={asset('demo/sabboura-lesson-30s.mp4')}
            poster={asset('demo/sabboura-lesson-poster.jpg')}
            preload="auto"
            playsInline
            controls
          />
          {active && muted && (
            <button type="button" className="sound-btn" onClick={turnSoundOn}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '1.1cqw', height: '1.1cqw' }} aria-hidden>
                <path d="M11 5 6 9H2v6h4l5 4V5z" />
                <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                <path d="M19 5a10 10 0 0 1 0 14" />
              </svg>
              Sound on
            </button>
          )}
        </div>
      </div>
    </SlideShell>
  );
}
