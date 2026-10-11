import type { ReactNode } from 'react';
import { LogoMark } from './Logo';

export { asset } from './asset';

export const TOTAL_SLIDES = 12;

interface SlideShellProps {
  n: number;
  children: ReactNode;
  tone?: 'wall' | 'dark';
  /** Hide the footer (title slide). */
  bare?: boolean;
}

export function SlideShell({ n, children, tone = 'wall', bare = false }: SlideShellProps) {
  const dark = tone === 'dark';
  return (
    <div
      className={`sb w-screen h-screen ${dark ? 'sb-dark' : 'sb-wall'}`}
      style={dark ? { backgroundColor: 'var(--board)', color: 'var(--chalk)' } : undefined}
    >
      <div className="sb-inner">{children}</div>
      {!bare && (
        <div className="sb-foot">
          <span className="sb-foot-brand">
            <LogoMark size="1.7cqw" />
            Sabboura <span lang="ar" dir="rtl">· سبّورة</span>
          </span>
          <span>
            {String(n).padStart(2, '0')} / {String(TOTAL_SLIDES).padStart(2, '0')}
          </span>
        </div>
      )}
    </div>
  );
}

export function Eyebrow({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <div className="eyebrow" style={dark ? { color: 'var(--chalk-dim)' } : undefined}>
      {children}
    </div>
  );
}
