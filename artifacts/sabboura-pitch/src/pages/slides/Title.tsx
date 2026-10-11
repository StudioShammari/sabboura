import { HeroBoard } from '@/components/HeroBoard';
import { LogoLockupOnDark } from '@/components/Logo';

export default function Title() {
  return (
    <HeroBoard
      credits={
        <>
          Mustafa Al Shammari · Yousef Al Masri · Ahmad Shadeed
          <span style={{ margin: '0 0.9cqw' }}>|</span>
          The AI Hackathon Amman 2026 · Built on Replit
        </>
      }
    >
      <div style={{ marginTop: '9.4cqw' }}>
        <LogoLockupOnDark width="44cqw" />
      </div>
      <h1 style={{ margin: '4.4cqw 0 0', fontWeight: 700, fontSize: '3.6cqw', lineHeight: 1.15, color: 'var(--chalk)' }}>
        A flight simulator for teachers.
      </h1>
      <p
        lang="ar"
        dir="rtl"
        style={{
          margin: '1.3cqw 0 0',
          fontFamily: 'var(--font-display-family)',
          fontWeight: 800,
          fontSize: '3cqw',
          lineHeight: 1.3,
          color: 'var(--chalk-yellow)',
        }}
      >
        درّب حالك قبل ما تدخل الصف
      </p>
      <p style={{ margin: '1.4cqw 0 0', fontWeight: 500, fontSize: '1.75cqw', color: 'var(--chalk)' }}>
        Practise on AI kids, so real kids get your best lesson.
      </p>
    </HeroBoard>
  );
}
