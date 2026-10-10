import { chorusFor, kidById, expandT, canned, KID_IDS, type KidId, type Lang, type Line, type Title } from '@shared/data';

export const VOICES: Record<KidId, string> = { omar: 'ash', lina: 'shimmer', sara: 'coral', khaled: 'echo', yazan: 'verse' };

let ctx: AudioContext | null = null;
let voiceGain: GainNode | null = null;
export function getCtx(): AudioContext {
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    ctx = new AC();
    voiceGain = ctx.createGain();
    voiceGain.connect(ctx.destination);
  }
  return ctx;
}
/** Must run inside a user gesture. */
export async function unlockAudio(): Promise<boolean> {
  try {
    const c = getCtx();
    if (c.state !== 'running') await c.resume();
    const b = c.createBuffer(1, Math.ceil(c.sampleRate * 0.05), c.sampleRate);
    const s = c.createBufferSource();
    s.buffer = b; s.connect(c.destination); s.start();
    return c.state === 'running';
  } catch { return false; }
}

// ---- mic ----
let micStream: MediaStream | null = null;
export const getMic = () => micStream;
export async function openMic(deviceId?: string): Promise<MediaStream> {
  if (micStream && micStream.getAudioTracks().some((t) => t.readyState === 'live')) return micStream;
  micStream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1, ...(deviceId ? { deviceId: { exact: deviceId } } : {}) },
  });
  return micStream;
}
export function closeMic() { micStream?.getTracks().forEach((t) => t.stop()); micStream = null; }
export function micName(): string { return micStream?.getAudioTracks()[0]?.label ?? '-'; }

// ---- pre-generated clips ----
type Manifest = Record<string, { url: string; text: string; voice: string }>;
let byText = new Map<string, string>();
let manifestLoaded = false;
export async function loadManifest() {
  if (manifestLoaded) return;
  try {
    const r = await fetch('/audio/pre/manifest.json');
    if (r.ok && (r.headers.get('content-type') ?? '').includes('json')) {
      const m: Manifest = await r.json();
      byText = new Map(Object.values(m).map((v) => [`${v.voice}|${v.text}`, v.url]));
    }
  } catch { /* no clips yet */ }
  manifestLoaded = true;
}
export const findPre = (kid: KidId, text: string): string | null => byText.get(`${VOICES[kid]}|${text}`) ?? null;

const bufCache = new Map<string, AudioBuffer>();
async function decode(data: ArrayBuffer): Promise<AudioBuffer> {
  const c = getCtx();
  return await new Promise<AudioBuffer>((res, rej) => c.decodeAudioData(data, res, rej));
}
export async function decodeUrl(url: string): Promise<AudioBuffer | null> {
  const hit = bufCache.get(url);
  if (hit) return hit;
  try {
    const r = await fetch(url);
    if (!r.ok || r.status === 204) return null;
    const b = await decode(await r.arrayBuffer());
    bufCache.set(url, b);
    return b;
  } catch { return null; }
}
export async function decodeB64(b64: string): Promise<AudioBuffer | null> {
  try {
    const bin = atob(b64);
    const u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return await decode(u.buffer);
  } catch { return null; }
}
/** Fetch server TTS for a line (cache-backed). Returns null when voices are unavailable. */
const ttsMem = new Map<string, AudioBuffer | null>();
export async function decodeTts(kid: KidId, lang: Lang, text: string): Promise<AudioBuffer | null> {
  const k = `${kid}|${lang}|${text}`;
  if (ttsMem.has(k)) return ttsMem.get(k)!;
  let buf: AudioBuffer | null = null;
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 5000);
    const r = await fetch('/api/tts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kid, lang, text }), signal: ac.signal });
    clearTimeout(t);
    if (r.ok && r.status !== 204) buf = await decode(await r.arrayBuffer());
  } catch { /* silent */ }
  ttsMem.set(k, buf);
  return buf;
}

export const lineSay = (l: Line, lang: Lang, title: Title) => expandT(l[lang === 'ar' ? 'say_ar' : 'say_en'] ?? l[lang], lang, title);

/** Decode the clips a lesson will almost certainly need. */
export async function preloadLesson(topicId: string, lang: Lang, title: Title) {
  await loadManifest();
  const urls = new Set<string>();
  const chorus = chorusFor(lang, title);
  for (const k of KID_IDS) {
    const c = findPre(k, chorus); if (c) urls.add(c);
    const f = findPre(k, kidById(k).failsafe[lang]); if (f) urls.add(f);
  }
  for (const k of ['omar', 'sara', 'khaled'] as KidId[]) {
    const l = canned.starters[topicId]?.[k];
    if (l) { const u = findPre(k, lineSay(l, lang, title)); if (u) urls.add(u); }
  }
  
  await Promise.all([...urls].map((u) => decodeUrl(u)));
}

// ---- playback ----
export interface Playing { done: Promise<void>; stop: () => void }
const active = new Set<{ src: AudioBufferSourceNode; stop: () => void }>();
export function playBuffer(buf: AudioBuffer, opts: { gain?: number; delayMs?: number; onStart?: () => void; rate?: number } = {}): Playing {
  const c = getCtx();
  const src = c.createBufferSource();
  src.buffer = buf;
  if (opts.rate) src.playbackRate.value = opts.rate;
  const g = c.createGain();
  g.gain.value = opts.gain ?? 1;
  src.connect(g); g.connect(voiceGain!);
  let timer: ReturnType<typeof setTimeout> | undefined;
  let resolveDone!: () => void;
  const done = new Promise<void>((r) => (resolveDone = r));
  const handle = { src, stop: () => { clearTimeout(timer); try { src.stop(); } catch { /* not started */ } resolveDone(); active.delete(handle); } };
  active.add(handle);
  src.onended = () => { active.delete(handle); resolveDone(); };
  const when = c.currentTime + (opts.delayMs ?? 0) / 1000;
  src.start(when);
  timer = setTimeout(() => opts.onStart?.(), opts.delayMs ?? 0);
  return { done, stop: handle.stop };
}
export function fadeOutAll(ms = 150) {
  if (!ctx || !voiceGain || !active.size) return;
  const g = voiceGain.gain, t = ctx.currentTime;
  g.cancelScheduledValues(t); g.setValueAtTime(g.value, t); g.linearRampToValueAtTime(0, t + ms / 1000);
  const items = [...active];
  setTimeout(() => { items.forEach((i) => i.stop()); const c = ctx!.currentTime; g.cancelScheduledValues(c); g.setValueAtTime(1, c); }, ms + 20);
}
