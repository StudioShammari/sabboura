import { getCtx } from './audio';

export interface RecResult { blob: Blob; mime: string; durationMs: number; voicedMs: number }
export interface LevelInfo { level: number; quiet: boolean; hot: boolean }

const MIMES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
const pickMime = () => (typeof MediaRecorder === 'undefined' ? '' : MIMES.find((m) => MediaRecorder.isTypeSupported(m)) ?? '');

export class Recorder {
  private rec: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private analyser: AnalyserNode;
  private src: MediaStreamAudioSourceNode;
  private buf: Float32Array<ArrayBuffer>;
  private timer: ReturnType<typeof setInterval> | null = null;
  private smooth = 0;
  private lowMs = 0;
  startedAt = 0;
  voicedMs = 0;
  private mime = '';
  private settleStop: (() => void) | null = null;
  onLevel?: (i: LevelInfo) => void;

  constructor(stream: MediaStream) {
    const c = getCtx();
    this.src = c.createMediaStreamSource(stream);
    this.analyser = c.createAnalyser();
    this.analyser.fftSize = 1024;
    this.buf = new Float32Array(this.analyser.fftSize);
    this.src.connect(this.analyser); // never connected to the speakers
    this.stream = stream;
  }
  private stream: MediaStream;

  start() {
    this.chunks = []; this.voicedMs = 0; this.lowMs = 0; this.smooth = 0;
    this.mime = pickMime();
    this.rec = new MediaRecorder(this.stream, this.mime ? { mimeType: this.mime } : undefined);
    this.mime = this.rec.mimeType || this.mime || 'audio/webm';
    this.rec.ondataavailable = (e) => e.data.size && this.chunks.push(e.data);
    this.rec.start(250);
    this.startedAt = performance.now();
    let last = performance.now();
    this.timer = setInterval(() => {
      const now = performance.now(), dt = now - last; last = now;
      this.analyser.getFloatTimeDomainData(this.buf);
      let sum = 0, peak = 0;
      for (const v of this.buf) { sum += v * v; peak = Math.max(peak, Math.abs(v)); }
      const db = 20 * Math.log10(Math.sqrt(sum / this.buf.length) || 1e-6);
      const peakDb = 20 * Math.log10(peak || 1e-6);
      if (db > -45) this.voicedMs += dt;
      this.lowMs = db < -50 ? this.lowMs + dt : 0;
      const raw = Math.max(0, Math.min(1, (db + 60) / 50));
      this.smooth += (raw - this.smooth) * (raw > this.smooth ? 0.5 : 0.12);
      this.onLevel?.({ level: this.smooth, quiet: this.lowMs > 1500, hot: peakDb > -1 });
    }, 50);
  }
  get elapsedMs() { return performance.now() - this.startedAt; }

  private halt() { if (this.timer) clearInterval(this.timer); this.timer = null; this.onLevel?.({ level: 0, quiet: false, hot: false }); }

  async stop(extraMs = 0): Promise<RecResult | null> {
    try {
      if (extraMs) await new Promise((r) => setTimeout(r, extraMs));
      const rec = this.rec;
      if (!rec) return null;
      const durationMs = this.elapsedMs;
      const ok = await new Promise<boolean>((resolve) => {
        const finish = (success: boolean) => {
          clearTimeout(timer); rec.onstop = null; rec.onerror = null;
          this.settleStop = null; resolve(success);
        };
        const timer = setTimeout(() => finish(false), 3000);
        this.settleStop = () => finish(false);
        rec.onstop = () => finish(true);
        rec.onerror = () => finish(false);
        try { rec.stop(); } catch { finish(false); }
      });
      return ok ? { blob: new Blob(this.chunks, { type: this.mime }), mime: this.mime, durationMs, voicedMs: this.voicedMs } : null;
    } finally { this.dispose(); }
  }
  cancel() {
    this.settleStop?.();
    const rec = this.rec; this.rec = null;
    if (rec) { rec.onstop = null; try { rec.stop(); } catch { /* ignore */ } }
    this.halt();
    try { this.src.disconnect(); this.analyser.disconnect(); } catch { /* ignore */ }
  }
  dispose() { this.cancel(); try { this.src.disconnect(); } catch { /* ignore */ } }
}
