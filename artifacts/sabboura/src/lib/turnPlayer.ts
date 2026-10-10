import { chorusFor, kidById, type KidId, type Lang, type Title } from '@shared/data';
import type { KidChange, LineEvent, StateEvent, TimingsEvent, TurnEvent } from '@shared/schemas';
import { decodeB64, decodeTts, decodeUrl, findPre, loadManifest, playBuffer } from './audio';
import { streamCallOn, streamTurn } from './sse';

export interface TurnUI {
  stale: () => boolean;
  onState: (ev: StateEvent) => void;
  onSpeakStart: (kid: KidId, line: LineEvent) => void;
  onSpeakEnd: (kid: KidId) => void;
  onFirstOutput: () => void;
  onChorus: (text: string, phase: 'show' | 'stamp' | 'hide') => void;
  onTimings: (t: TimingsEvent) => void;
  onEvent?: (name: string, data: unknown) => void;
  onDone: () => void;
}
export interface TurnOpts {
  lessonId: string; text: string; source: 'voice' | 'typed' | 'script'; seconds: number;
  lang: Lang; title: Title; ui: TurnUI; setAbort: (fn: () => void) => void;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
function deferred<T>() {
  let resolve!: (v: T) => void;
  const p = new Promise<T>((r) => (resolve = r));
  return { p, resolve, settled: false };
}
const readMs = (t: string) => Math.max(1800, t.split(/\s+/).length * 380);

/** Clip for a kid + text: pre-generated clip first, then the server TTS route. */
export async function clipFor(kid: KidId, lang: Lang, text: string): Promise<AudioBuffer | null> {
  await loadManifest();
  const pre = findPre(kid, text);
  if (pre) { const b = await decodeUrl(pre); if (b) return b; }
  return decodeTts(kid, lang, text);
}

export async function playChorus(lang: Lang, title: Title, ui: TurnUI) {
  const text = chorusFor(lang, title);
  ui.onChorus(text, 'show');
  const order: [KidId, number, number][] = [['omar', 0, 1], ['sara', 40, 1], ['khaled', 90, 1], ['yazan', 130, 1], ['lina', 250, 0.5]];
  const bufs = await Promise.all(order.map(([k]) => clipFor(k, lang, text)));
  if (ui.stale()) return;
  const plays = order.map(([, d, g], i) => (bufs[i] ? playBuffer(bufs[i]!, { delayMs: d, gain: g }) : null));
  setTimeout(() => !ui.stale() && ui.onChorus(text, 'stamp'), 700);
  const anyAudio = plays.some(Boolean);
  await Promise.all(plays.map((p) => p?.done));
  await sleep(anyAudio ? 900 : 1800);
  ui.onChorus(text, 'hide');
}

export async function playLocalFailsafe(lang: Lang, ui: Pick<TurnUI, 'onSpeakStart' | 'onSpeakEnd' | 'stale'>, kid: KidId = 'omar') {
  const text = kidById(kid).failsafe[lang];
  const buf = await clipFor(kid, lang, text);
  if (ui.stale()) return;
  ui.onSpeakStart(kid, { idx: 0, kid, reason: 'objection', text, text_en: kidById(kid).failsafe.en, source: 'failsafe' });
  if (buf) await playBuffer(buf).done; else await sleep(1800);
  ui.onSpeakEnd(kid);
}

export async function playTurn(o: TurnOpts): Promise<void> {
  const { ui, lang, title } = o;
  const ac = new AbortController();
  o.setAbort(() => ac.abort());
  const clientTurnId = Math.random().toString(36).slice(2);
  const slots = new Map<number, { line: ReturnType<typeof deferred<LineEvent | null>>; audio: ReturnType<typeof deferred<AudioBuffer | null>> }>();
  const slot = (i: number) => {
    if (!slots.has(i)) slots.set(i, { line: deferred(), audio: deferred() });
    return slots.get(i)!;
  };
  const doneD = deferred<void>();
  let sawState = false, sawBusy = false, first = false, finished = false;
  let runner: Promise<void> | null = null;
  let chorusP: Promise<void> | null = null;

  const firstOutput = () => { if (!first) { first = true; ui.onFirstOutput(); } };
  const startRunner = () => {
    runner ??= (async () => {
      for (let i = 0; ; i++) {
        const s = slot(i);
        const line = await Promise.race([s.line.p, doneD.p.then(() => null)]);
        if (!line || ui.stale()) break;
        const buf = await Promise.race([s.audio.p, sleep(9000).then(() => null)]);
        if (ui.stale()) break;
        ui.onSpeakStart(line.kid, line);
        if (buf) await playBuffer(buf).done; else await sleep(readMs(line.text));
        ui.onSpeakEnd(line.kid);
        if (ui.stale()) break;
        await sleep(180);
      }
    })();
  };

  const handle = (ev: TurnEvent) => {
    ui.onEvent?.(ev.event, ev.data);
    switch (ev.event) {
      case 'busy': sawBusy = true; break;
      case 'state': sawState = true; ui.onState(ev.data); break;
      case 'chorus': firstOutput(); chorusP = playChorus(lang, title, ui); break;
      case 'line': { firstOutput(); slot(ev.data.idx).line.resolve(ev.data); startRunner(); break; }
      case 'audio': {
        const d = ev.data;
        const p = d.url ? decodeUrl(d.url) : d.b64 ? decodeB64(d.b64) : Promise.resolve(null);
        p.then((b) => slot(d.idx).audio.resolve(b));
        break;
      }
      case 'audio_failed': slot(ev.data.idx).audio.resolve(null); break;
      case 'timings': ui.onTimings(ev.data); break;
      case 'done': doneD.resolve(); break;
    }
  };

  const guard = setTimeout(() => { if (!finished) { ac.abort(); } }, 20000);
  try {
    for (let attempt = 0; attempt < 6; attempt++) {
      sawBusy = false;
      await streamTurn(o.lessonId, { text: o.text, source: o.source, teacherSeconds: o.seconds, clientTurnId }, handle, ac.signal);
      if (sawBusy && !sawState) { await sleep(900); continue; }
      break;
    }
    if (!sawState) throw new Error('no state');
  } catch {
    clearTimeout(guard);
    finished = true;
    doneD.resolve();
    if (!ac.signal.aborted || !ui.stale()) { firstOutput(); await playLocalFailsafe(lang, ui); }
    ui.onDone();
    return;
  }
  clearTimeout(guard);
  finished = true;
  doneD.resolve();
  firstOutput();
  await runner;
  await chorusP;
  ui.onDone();
}

export type { KidChange };

/** A called-on kid asks a question: one line, one voice. Never shows an error; falls back to the local "again?" clip. */
export async function playQuestion(o: { lessonId: string; kid: KidId; lang: Lang; ui: TurnUI; setAbort: (fn: () => void) => void }): Promise<void> {
  const { ui, kid, lang } = o;
  const ac = new AbortController();
  o.setAbort(() => ac.abort());
  const line = deferred<LineEvent | null>();
  const audio = deferred<AudioBuffer | null>();
  let first = false;
  const firstOutput = () => { if (!first) { first = true; ui.onFirstOutput(); } };
  const guard = setTimeout(() => ac.abort(), 14000);
  try {
    await streamCallOn(o.lessonId, kid, (ev) => {
      ui.onEvent?.(ev.event, ev.data);
      if (ev.event === 'line') { firstOutput(); line.resolve(ev.data); }
      else if (ev.event === 'audio') {
        const d = ev.data;
        (d.url ? decodeUrl(d.url) : d.b64 ? decodeB64(d.b64) : Promise.resolve(null)).then((b) => audio.resolve(b));
      } else if (ev.event === 'audio_failed') audio.resolve(null);
      else if (ev.event === 'done') { line.resolve(null); audio.resolve(null); }
    }, ac.signal);
    const l = await line.p;
    if (!l) throw new Error('no question');
    if (ui.stale()) return;
    const buf = await Promise.race([audio.p, sleep(9000).then(() => null)]);
    if (ui.stale()) return;
    ui.onSpeakStart(kid, l);
    if (buf) await playBuffer(buf).done; else await sleep(readMs(l.text));
    ui.onSpeakEnd(kid);
  } catch {
    if (!ui.stale()) { firstOutput(); await playLocalFailsafe(lang, ui, kid); }
  } finally {
    clearTimeout(guard);
  }
  ui.onDone();
}
