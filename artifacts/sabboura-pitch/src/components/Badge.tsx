import { BADGE_LABEL, type BadgeKind } from './kids';

function StateBall({ kind }: { kind: BadgeKind }) {
  const size = '1.05cqw';
  if (kind === 'gotit') {
    return (
      <svg viewBox="0 0 20 20" width={size} height={size} aria-hidden>
        <circle cx="10" cy="10" r="9" fill="#fff" />
        <path d="M5.5 10.3l3 3 6-6.3" fill="none" stroke="#0F7B6C" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (kind === 'partly') {
    return (
      <svg viewBox="0 0 20 20" width={size} height={size} aria-hidden>
        <circle cx="10" cy="10" r="8" fill="none" stroke="#4D3200" strokeWidth="2.2" />
        <path d="M10 2a8 8 0 0 1 0 16z" fill="#4D3200" />
      </svg>
    );
  }
  const stroke = kind === 'lost' ? '#8C2716' : '#3F3A33';
  return (
    <svg viewBox="0 0 20 20" width={size} height={size} aria-hidden>
      <circle cx="10" cy="10" r="8" fill="none" stroke={stroke} strokeWidth="2.2" />
    </svg>
  );
}

export function Badge({ kind, label }: { kind: BadgeKind; label?: string }) {
  return (
    <span className={`badge badge-${kind}`}>
      {label ?? BADGE_LABEL[kind]}
      <StateBall kind={kind} />
    </span>
  );
}
