import type { KidId, Level } from '@shared/data';

const COL = {
  u: ['#B3361F', '#9A6200', '#0F7B6C'],
  y: ['#7A7368', '#6B3FA0', '#4B2580'],
};

/** Empty ring / half fill from inline-start / full with ✓ (Yazan: Zap). The ✓ is never mirrored. */
export function StateBall({ level, kid, size = 26, onSolid = true }: { level: Level; kid: KidId; size?: number; onSolid?: boolean }) {
  const col = COL[kid === 'yazan' ? 'y' : 'u'][level];
  const ring = level === 2 && onSolid ? '#fff' : col;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flex: 'none' }}>
      <circle cx="12" cy="12" r="10" fill={level === 2 ? (onSolid ? '#fff' : col) : 'none'} stroke={ring} strokeWidth="2.5" />
      {level === 1 && (
        <g className="ball-half" style={{ transformOrigin: '12px 12px' }}>
          <path d="M12 2 A10 10 0 0 0 12 22 Z" fill={col} />
        </g>
      )}
      {level === 2 && kid !== 'yazan' && (
        <path d="M7 12.5 L10.5 16 L17 8.5" fill="none" stroke={onSolid ? col : '#fff'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      )}
      {level === 2 && kid === 'yazan' && (
        <path d="M13 3 L6 13.5 H11.5 L10.5 21 L18 10 H12.5 Z" fill={onSolid ? col : '#fff'} stroke={onSolid ? col : '#fff'} strokeWidth="1" strokeLinejoin="round" />
      )}
    </svg>
  );
}
