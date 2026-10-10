import { getCtx } from './audio';
import { getSettings } from './store';

let muted = false;
export const toggleSfxMute = () => (muted = !muted);
const on = () => !muted && getSettings().sfx && !getSettings().calm;

function tone(freq: number, at: number, dur: number, type: OscillatorType, gain: number, freqEnd?: number) {
  const c = getCtx(); const o = c.createOscillator(); const g = c.createGain(); const t = c.currentTime + at;
  o.type = type; o.frequency.setValueAtTime(freq, t); if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
  g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur: number, f0: number, f1: number, gain: number, at = 0) {
  const c = getCtx(); const n = Math.ceil(c.sampleRate * dur); const b = c.createBuffer(1, n, c.sampleRate);
  const d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource(); s.buffer = b;
  const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2; const t = c.currentTime + at;
  f.frequency.setValueAtTime(f0, t); f.frequency.linearRampToValueAtTime(f1, t + dur);
  const g = c.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(c.destination); s.start(t);
}
const safe = (fn: () => void) => { if (!on()) return; try { fn(); } catch { /* audio unavailable */ } };

export const sfx = {
  micOn: () => safe(() => tone(440, 0, 0.09, 'sine', 0.08, 880)),
  micOff: () => safe(() => tone(880, 0, 0.09, 'sine', 0.08, 520)),
  chalk: () => safe(() => noise(0.06, 3000, 3000, 0.12)),
  badgeUp: () => safe(() => { tone(880, 0, 0.1, 'sine', 0.1); tone(1175, 0.07, 0.1, 'sine', 0.1); }),
  gotIt: () => safe(() => [523, 659, 784].forEach((f, i) => tone(f, i * 0.09, 0.7, 'triangle', 0.12))),
  tally: () => safe(() => noise(0.12, 2500, 4000, 0.12)),
  stamp: () => safe(() => { tone(110, 0, 0.12, 'sine', 0.2, 60); noise(0.015, 2000, 2000, 0.1); }),
  flip: () => safe(() => noise(0.2, 3500, 800, 0.1)),
  bell: () => safe(() => { [1318, 1976].forEach((f) => { tone(f, 0, 0.9, 'triangle', 0.1); tone(f * 1.01, 0, 0.9, 'triangle', 0.05); }); }),
};
