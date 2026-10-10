// Stand-up mode: the camera and the body detector. Runs ONLY in stand-up mode, ONLY on this device.
// Video frames never leave the browser and are never recorded or stored; only per-turn numbers are saved (see features.ts).
// MediaPipe Tasks Vision (Apache-2.0) is loaded on demand, with its wasm and models served from /mediapipe (no third-party CDN).
import { useSyncExternalStore } from 'react';
import type { FaceLandmarker, PoseLandmarker } from '@mediapipe/tasks-vision';
import { BODY_RULES, type BodyRules } from '@shared/bodyRules';
import { calibrate as calibFrom, FeatureTracker, frameFeatures, type Calib, type HeadPose, type LiveFeatures, type Pt, type RawFeatures, type Size } from './features';

export type CamStatus = 'off' | 'opening' | 'loading' | 'on' | 'error';
export type CamError = 'denied' | 'none' | 'busy' | 'other' | 'model';
export interface Light { ok: boolean; dark: boolean; backlit: boolean; mean: number }
export interface BodyFrame {
  t: number;
  pose: Pt[] | null;
  faceLm: { x: number; y: number }[] | null;
  head: HeadPose | null;
  raw: RawFeatures;
  live: LiveFeatures;
  light: Light;
  size: Size;
}
export interface CamSnap { status: CamStatus; error: CamError | null; stream: MediaStream | null; fps: number; delegate: 'GPU' | 'CPU' | null; face: boolean }

const BASE = '/mediapipe';
let snap: CamSnap = { status: 'off', error: null, stream: null, fps: 0, delegate: null, face: false };
const snapSubs = new Set<() => void>();
const setSnap = (p: Partial<CamSnap>) => { snap = { ...snap, ...p }; snapSubs.forEach((f) => f()); };
export const getCamera = () => snap;
export function useCamera(): CamSnap {
  return useSyncExternalStore((cb) => { snapSubs.add(cb); return () => snapSubs.delete(cb); }, () => snap);
}

let rules: BodyRules = BODY_RULES;
let calib: Calib | null = null;
const tracker = new FeatureTracker(rules);
const frameSubs = new Set<(f: BodyFrame) => void>();
export function onFrame(fn: (f: BodyFrame) => void) { frameSubs.add(fn); return () => { frameSubs.delete(fn); }; }
export const getCalib = () => calib;
export const setCalib = (c: Calib | null) => { calib = c; };
/** /dev/body only: tune thresholds live. */
export function setRules(r: BodyRules) { rules = r; tracker.setRules(r); }

let stream: MediaStream | null = null;
let video: HTMLVideoElement | null = null;
let pose: PoseLandmarker | null = null;
let face: FaceLandmarker | null = null;
let gen = 0;
let starting: Promise<boolean> | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let lastVideoTime = -1;
let avgMs = 0;
let fps = BODY_RULES.detector.fps;
let light: Light = { ok: true, dark: false, backlit: false, mean: 128 };
let lightAt = 0;
let lightCanvas: HTMLCanvasElement | null = null;

const camErr = (e: unknown): CamError => {
  const n = (e as DOMException)?.name;
  return n === 'NotAllowedError' || n === 'SecurityError' ? 'denied' : n === 'NotFoundError' || n === 'OverconstrainedError' ? 'none' : n === 'NotReadableError' ? 'busy' : 'other';
};

async function loadModels() {
  if (pose) return;
  const mp = await import('@mediapipe/tasks-vision');
  const files = await mp.FilesetResolver.forVisionTasks(`${BASE}/wasm`);
  const mkPose = (delegate: 'GPU' | 'CPU') => mp.PoseLandmarker.createFromOptions(files, {
    baseOptions: { modelAssetPath: `${BASE}/pose_landmarker_full.task`, delegate }, runningMode: 'VIDEO', numPoses: 1,
  });
  try { pose = await mkPose('GPU'); setSnap({ delegate: 'GPU' }); } catch { pose = await mkPose('CPU'); setSnap({ delegate: 'CPU' }); }
  // the face model refines head direction when the face is big enough; the pose works without it
  const mkFace = (delegate: 'GPU' | 'CPU') => mp.FaceLandmarker.createFromOptions(files, {
    baseOptions: { modelAssetPath: `${BASE}/face_landmarker.task`, delegate }, runningMode: 'VIDEO', numFaces: 1,
  });
  void (async () => {
    try { face = await mkFace('GPU'); } catch { try { face = await mkFace('CPU'); } catch { face = null; } }
    setSnap({ face: !!face });
  })();
}

/** Opens the camera (once) and starts the detector. Resolves false when the camera is blocked or missing. */
export function startCamera(): Promise<boolean> {
  if (snap.status === 'on') return Promise.resolve(true);
  if (starting) return starting;
  const my = ++gen;
  starting = (async () => {
    setSnap({ status: 'opening', error: null });
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw Object.assign(new Error('no camera api'), { name: 'NotFoundError' });
      const s = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' }, audio: false });
      if (my !== gen) { s.getTracks().forEach((t) => t.stop()); return false; }
      stream = s;
      // the camera was unplugged or taken away (stopCamera's own stop() does not fire this)
      s.getVideoTracks()[0]?.addEventListener('ended', () => {
        if (my !== gen) return;
        gen++; if (timer) clearTimeout(timer); timer = null; stopTracks();
        setSnap({ status: 'error', error: 'other', stream: null, fps: 0 });
      });
    } catch (e) {
      if (my === gen) setSnap({ status: 'error', error: camErr(e) });
      return false;
    }
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.srcObject = stream;
    video = v;
    await v.play().catch(() => {});
    setSnap({ status: 'loading', stream });
    try { await loadModels(); } catch (e) {
      console.warn('[body] models failed', e);
      if (my === gen) { stopTracks(); setSnap({ status: 'error', error: 'model', stream: null }); }
      return false;
    }
    if (my !== gen) return false;
    tracker.reset(); avgMs = 0; fps = rules.detector.fps; lastVideoTime = -1;
    setSnap({ status: 'on', fps });
    schedule(0);
    return true;
  })().finally(() => { if (my === gen) starting = null; });
  return starting;
}

function stopTracks() {
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
  if (video) { video.pause(); video.srcObject = null; }
  video = null;
}

/** Stops the camera completely (the camera light goes off). The models stay loaded for a quick restart. */
export function stopCamera() {
  gen++;
  starting = null;
  if (timer) clearTimeout(timer);
  timer = null;
  stopTracks();
  tracker.reset();
  setSnap({ status: 'off', error: null, stream: null, fps: 0 });
}

function schedule(ms: number) { if (timer) clearTimeout(timer); timer = setTimeout(tick, ms); }

function tick() {
  timer = null;
  if (!video || !pose || snap.status !== 'on') return;
  if (document.hidden) { schedule(400); return; } // paused while the tab is hidden
  const t0 = performance.now();
  if (video.readyState >= 2 && video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    try { process(t0); } catch (e) { console.warn('[body] frame failed', e); }
  }
  const took = performance.now() - t0;
  avgMs = avgMs ? avgMs * 0.75 + took * 0.25 : took;
  const d = rules.detector;
  const want = avgMs > d.slowFrameMs ? d.slowFps : avgMs < d.slowFrameMs * 0.6 ? d.fps : fps;
  if (want !== fps) { fps = want; setSnap({ fps }); }
  schedule(Math.max(0, 1000 / fps - took));
}

/** Head direction from the face mesh: pitch from the forehead→chin line's depth, yaw from the cheek→cheek line's depth. */
function headPose(px: { x: number; y: number; z: number }[], widthPx: number): HeadPose {
  const fh = px[10], ch = px[152], rc = px[234], lc = px[454];
  const deg = (r: number) => (r * 180) / Math.PI;
  return { pitch: deg(Math.atan2(ch.z - fh.z, ch.y - fh.y)), yaw: deg(Math.atan2(lc.z - rc.z, lc.x - rc.x)), widthPx };
}

function measureLight(v: HTMLVideoElement) {
  lightCanvas ??= Object.assign(document.createElement('canvas'), { width: 32, height: 18 });
  const g = lightCanvas.getContext('2d', { willReadFrequently: true });
  if (!g) return;
  g.drawImage(v, 0, 0, 32, 18);
  const d = g.getImageData(0, 0, 32, 18).data;
  let all = 0, mid = 0, edge = 0, nm = 0, ne = 0;
  for (let y = 0; y < 18; y++) for (let x = 0; x < 32; x++) {
    const i = (y * 32 + x) * 4;
    const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    all += l;
    if (x >= 11 && x < 21 && y >= 4 && y < 14) { mid += l; nm++; } else if (x < 4 || x >= 28 || y < 3) { edge += l; ne++; }
  }
  const mean = all / (32 * 18), m = mid / nm, e = edge / ne;
  const dark = mean < rules.light.darkMean;
  const backlit = e - m > rules.light.backlitDiff && m < rules.light.backlitCenter;
  light = { ok: !dark && !backlit, dark, backlit, mean: Math.round(mean) };
}

function process(t: number) {
  const v = video!, W = v.videoWidth || 1280, H = v.videoHeight || 720;
  const res = pose!.detectForVideo(v, t);
  const lm = res.landmarks?.[0];
  const pts: Pt[] | null = lm ? lm.map((p) => ({ x: p.x * W, y: p.y * H, z: p.z * W, v: p.visibility ?? 0 })) : null;
  let head: HeadPose | null = null;
  let faceLm: { x: number; y: number }[] | null = null;
  if (face && pts) {
    const earW = Math.hypot(pts[7].x - pts[8].x, pts[7].y - pts[8].y);
    if (earW * 1.1 >= rules.detector.faceMinPx) {
      const f = face.detectForVideo(v, t).faceLandmarks?.[0];
      if (f && f.length > 454) {
        const px = f.map((p) => ({ x: p.x * W, y: p.y * H, z: p.z * W }));
        faceLm = px;
        const widthPx = Math.abs(px[454].x - px[234].x);
        if (widthPx >= rules.detector.faceMinPx) head = headPose(px, widthPx);
      }
    }
  }
  if (t - lightAt > 1000) { lightAt = t; try { measureLight(v); } catch { /* ignore */ } }
  const size = { w: W, h: H };
  const raw = frameFeatures(pts, head, calib, size, rules);
  const live = tracker.update(t, raw);
  const fr: BodyFrame = { t, pose: pts, faceLm, head, raw, live, light, size };
  frameSubs.forEach((fn) => fn(fr));
}

/** Calibration: the teacher stands naturally and looks at the screen; average the pose for `ms`. */
export function calibrateNow(ms = 3000): Promise<Calib | null> {
  return new Promise((resolve) => {
    const frames: RawFeatures[] = [];
    const off = onFrame((f) => frames.push(f.raw));
    setTimeout(() => { off(); const c = calibFrom(frames); if (c) calib = c; resolve(c); }, ms);
  });
}
