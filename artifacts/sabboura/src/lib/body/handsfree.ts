// Stand-up mode, "Hands-free": the mic level starts and stops a turn. Only used in stand-up lessons.
// Listening pauses while kids' audio plays (and 400 ms after), during sound effects, and whenever the caller says so
// (waiting for the class, typing, dialogs), so the kids' voices never start a turn.
import { audioBusy, getCtx } from '../audio';
import { sfxBusy } from '../sfx';

export const HANDS_FREE = {
  /** Start when the level stays above this for startMs. */
  startDb: -40, startMs: 150,
  /** Stop after stopMs below this. */
  stopDb: -48, stopMs: 1400,
  /** Talk shorter than this is ignored; turns are capped by the classroom at 45 s. */
  minMs: 1000,
  afterAudioMs: 400,
  tickMs: 50,
} as const;

export interface GateHooks {
  /** May a new turn start now? (phase idle, no typing or dialog open) */
  canListen: () => boolean;
  /** Is a turn being recorded now? */
  recording: () => boolean;
  onStart: () => void;
  onStop: () => void;
}

export class VoiceGate {
  private src: MediaStreamAudioSourceNode;
  private an: AnalyserNode;
  private buf: Float32Array<ArrayBuffer>;
  private timer: ReturnType<typeof setInterval> | null = null;
  private above = 0;
  private below = 0;
  private lastBusy = 0;

  constructor(stream: MediaStream, private h: GateHooks) {
    const c = getCtx();
    this.src = c.createMediaStreamSource(stream);
    this.an = c.createAnalyser();
    this.an.fftSize = 1024;
    this.buf = new Float32Array(this.an.fftSize);
    this.src.connect(this.an); // never connected to the speakers
    let last = performance.now();
    this.timer = setInterval(() => { const now = performance.now(); this.tick(now, now - last); last = now; }, HANDS_FREE.tickMs);
  }

  private db(): number {
    this.an.getFloatTimeDomainData(this.buf);
    let sum = 0;
    for (const v of this.buf) sum += v * v;
    return 20 * Math.log10(Math.sqrt(sum / this.buf.length) || 1e-6);
  }

  private tick(now: number, dt: number) {
    const H = HANDS_FREE;
    if (audioBusy() || sfxBusy()) this.lastBusy = now;
    const db = this.db();
    if (this.h.recording()) {
      this.above = 0;
      this.below = db < H.stopDb ? this.below + dt : 0;
      if (this.below >= H.stopMs) { this.below = 0; this.h.onStop(); }
      return;
    }
    this.below = 0;
    if (!this.h.canListen() || now - this.lastBusy < H.afterAudioMs || document.hidden) { this.above = 0; return; }
    this.above = db > H.startDb ? this.above + dt : 0;
    if (this.above >= H.startMs) { this.above = 0; this.h.onStart(); }
  }

  dispose() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    try { this.src.disconnect(); } catch { /* ignore */ }
  }
}
