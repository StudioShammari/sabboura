import { HeroBoard } from '@/components/HeroBoard';
import { LogoLockupOnDark } from '@/components/Logo';

export default function ThankYou() {
  return (
    <HeroBoard
      credits={
        <>
          Mustafa Al Shammari · Yousef Al Masri · Ahmad Shadeed
          <span style={{ margin: '0 0.9cqw' }}>|</span>
          PSUT · Built on Replit
        </>
      }
    >
      <div style={{ marginTop: '9.2cqw' }}>
        <LogoLockupOnDark width="38.5cqw" />
      </div>
      <p
        lang="ar"
        dir="rtl"
        style={{
          margin: '3.6cqw 0 0',
          fontFamily: 'var(--font-display-family)',
          fontWeight: 800,
          fontSize: '4.3cqw',
          lineHeight: 1.25,
          color: 'var(--chalk-yellow)',
        }}
      >
        درّب حالك قبل ما تدخل الصف
      </p>
      <p style={{ margin: '1.6cqw 0 0', fontWeight: 700, fontSize: '2.1cqw', color: 'var(--chalk)' }}>
        Practise on AI kids, so real kids get your best lesson.
      </p>
      <p style={{ margin: '3cqw 0 0', fontWeight: 700, fontSize: '1.8cqw', color: 'var(--chalk)' }}>
        Thank you · <span lang="ar" dir="rtl">شكراً</span>
      </p>
    </HeroBoard>
  );
}
