interface LogoMarkProps {
  size: string;
  className?: string;
}

/**
 * Sabboura mark: a framed chalkboard on its ledge with a chalk "؟".
 * The Arabic question mark stands for the product's core skill:
 * asking the question that shows what each kid really thinks.
 */
export function LogoMark({ size, className }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 128 128"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Sabboura logo"
      style={{ display: 'block', flex: 'none' }}
    >
      <rect x="8" y="10" width="112" height="92" rx="16" fill="#8A5A33" />
      <rect x="17" y="19" width="94" height="74" rx="7" fill="#2F3E2C" />
      <g transform="translate(47.2 31) scale(1.05)">
        <path
          d="M29 12C29 5 23 1 16 1C9 1 3 5.5 3 12C3 18 7.5 21 12 23.5C15 25 16 27 16 31V33"
          fill="none"
          stroke="#F4F0E6"
          strokeWidth="6.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="16" cy="42.5" r="4" fill="#F2D27A" />
      </g>
      <rect x="4" y="100" width="120" height="12" rx="5" fill="#5C3A20" />
      <rect x="80" y="93" width="26" height="8" rx="4" fill="#F4F0E6" />
    </svg>
  );
}

interface LockupProps {
  /** Height of the mark; the wordmark scales from it. Use cqw units. */
  size: number;
  tone?: 'ink' | 'chalk';
}

/** Mark + bilingual wordmark (سبّورة / Sabboura). */
export function LogoLockup({ size, tone = 'ink' }: LockupProps) {
  const main = tone === 'chalk' ? 'var(--chalk)' : 'var(--ink)';
  const sub = tone === 'chalk' ? 'var(--chalk-dim)' : 'var(--ink-muted)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: `${size * 0.28}cqw` }}>
      <LogoMark size={`${size}cqw`} />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span
          lang="ar"
          dir="rtl"
          style={{
            fontFamily: 'var(--font-display-family)',
            fontWeight: 800,
            fontSize: `${size * 0.62}cqw`,
            color: main,
            lineHeight: 1.05,
          }}
        >
          سبّورة
        </span>
        <span
          style={{
            fontFamily: 'var(--font-body-family)',
            fontWeight: 600,
            fontSize: `${size * 0.22}cqw`,
            letterSpacing: '0.12em',
            color: sub,
            marginTop: `${size * 0.04}cqw`,
          }}
        >
          SABBOURA
        </span>
      </div>
    </div>
  );
}
