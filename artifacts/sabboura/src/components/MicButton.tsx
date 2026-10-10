import { Mic, Square } from 'lucide-react';
import { useRef } from 'react';

const MAX_MS = 45000;
export function MicButton({ mode, recording, cancelling, elapsedMs, level, disabled, label, onStart, onStop, onCancelHover }: {
  mode: 'hold' | 'tap'; recording: boolean; cancelling: boolean; elapsedMs: number; level: number; disabled: boolean; label: string;
  onStart: () => void; onStop: (cancel: boolean) => void; onCancelHover: (c: boolean) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const R = 52, C = 2 * Math.PI * R;
  const frac = Math.min(1, elapsedMs / MAX_MS);
  const down = (e: React.PointerEvent) => {
    if (disabled && !recording) return;
    e.preventDefault();
    if (mode === 'tap') { recording ? onStop(false) : onStart(); return; }
    try { ref.current?.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    if (!recording) onStart();
  };
  const move = (e: React.PointerEvent) => {
    if (mode !== 'hold' || !recording || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right), dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
    onCancelHover(Math.hypot(dx, dy) > 60);
  };
  const up = () => { if (mode === 'hold' && recording) onStop(cancelling); };
  return (
    <button
      ref={ref} type="button" aria-label={label} aria-pressed={recording} disabled={disabled && !recording}
      className={`mic ${recording ? 'rec' : ''} ${cancelling ? 'cancel' : ''}`}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => { if (e.code === 'Enter') { e.preventDefault(); recording ? onStop(false) : onStart(); } }}
    >
      <span className="halo" />
      <span className="level" style={{ transform: `scale(${1 + level * 0.3})` }} />
      {recording && (
        <svg className="ring" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="5" />
          <circle cx="60" cy="60" r={R} fill="none" stroke={elapsedMs > 35000 ? '#FFE08A' : '#fff'} strokeWidth="5" strokeDasharray={C} strokeDashoffset={C * (1 - frac)} strokeLinecap="round" />
        </svg>
      )}
      {mode === 'tap' && recording ? <Square size={38} fill="#fff" /> : <Mic size={48} strokeWidth={2.4} />}
    </button>
  );
}
