import type { ReactNode } from 'react';

/** Full-bleed chalkboard with a wooden frame, used for the opening and closing slides. */
export function HeroBoard({ children, credits }: { children: ReactNode; credits: ReactNode }) {
  return (
    <div
      className="sb w-screen h-screen"
      style={{
        background: 'radial-gradient(ellipse 70% 65% at 50% 42%, #3a4a37 0%, #314030 55%, #283526 100%)',
        color: 'var(--chalk)',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          border: '1.35cqw solid var(--frame)',
          boxShadow: 'inset 0 0 0 0.2cqw rgba(0, 0, 0, 0.22)',
          pointerEvents: 'none',
        }}
      />
      <div className="flex flex-col items-center text-center" style={{ position: 'absolute', inset: 0, padding: '0 6cqw' }}>
        {children}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: '3.4cqw',
          textAlign: 'center',
          fontSize: '1.08cqw',
          fontWeight: 500,
          color: 'var(--chalk-dim)',
        }}
      >
        {credits}
      </div>
    </div>
  );
}
