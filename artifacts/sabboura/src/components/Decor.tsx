/** Wall decorations: a clock and a window. Flat shapes, 2px outlines, no gradients. */
export function Decor() {
  return (
    <>
      <svg className="decor-clock" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="28" fill="#FFFBF4" stroke="#5C3A20" strokeWidth="3" />
        <path d="M32 14v18l11 7" fill="none" stroke="#2B2118" strokeWidth="3" strokeLinecap="round" />
        <circle cx="32" cy="32" r="2.5" fill="#2B2118" />
      </svg>
      <svg className="decor-window" viewBox="0 0 80 96" aria-hidden="true">
        <rect x="3" y="3" width="74" height="90" rx="4" fill="#BFD9E6" stroke="#5C3A20" strokeWidth="3" />
        <path d="M40 3v90M3 48h74" stroke="#5C3A20" strokeWidth="3" />
        <rect x="3" y="3" width="37" height="45" fill="#FFECBE" opacity=".6" />
      </svg>
    </>
  );
}
