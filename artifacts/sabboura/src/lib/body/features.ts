// Stand-up mode: pure per-frame body features (no camera, no browser APIs, so scripts/test-body.ts can run them).
// Points are in pixels (x right, y down, z toward the camera is smaller), and every distance is divided by shoulder width.
// Thresholds live in shared/bodyRules.ts. Body language notes are tips only and never touch the score.
import { BODY_RULES, type BodyRules } from '../../../shared/bodyRules';
import { emptyFlags, type BodyFlags, type BodyMetrics } from '../../../shared/bodyNotes';

export interface Pt { x: number; y: number; z?: number; v: number }
/** Head direction from FaceLandmarker (degrees; pitch > 0 is down). */
export interface HeadPose { pitch: number; yaw: number; widthPx: number }
export interface Size { w: number; h: number }
/** The teacher's natural pose, measured for 3 s before the lesson. */
export interface Calib { noseDrop: number; yawProxy: number; pitch: number | null; yaw: number | null; swTorso: number | null; sw: number }
export const DEFAULT_CALIB: Calib = { noseDrop: 0.08, yawProxy: 0, pitch: null, yaw: null, swTorso: null, sw: 0 };

// BlazePose landmark indices
export const P = { nose: 0, eyeL: 2, eyeR: 5, earL: 7, earR: 8, shL: 11, shR: 12, elL: 13, elR: 14, wrL: 15, wrR: 16, hipL: 23, hipR: 24 } as const;

export interface Measures { sw: number; noseDrop: number; yawProxy: number; swTorso: number | null; pitch: number | null; yaw: number | null }
export interface RawFeatures {
  person: boolean;
  inFrame: boolean;
  waistVisible: boolean;
  faceVisible: boolean;
  handsVisible: boolean;
  headDown: boolean;
  lookingAway: boolean;
  /** Instant values; backTurned, handsHidden and armsCrossed only count after their minimum time. */
  backTurned: boolean;
  handsTogetherInFront: boolean;
  handsHidden: boolean;
  armsCrossed: boolean;
  /** A wrist near the nose, above the shoulders (faceTouch counts each new one). */
  nearFace: boolean;
  /** Visible wrists above the hips, in pixels, for wrist speed. */
  wrists: { l: { x: number; y: number } | null; r: { x: number; y: number } | null };
  m: Measures;
}

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
const mid = (a: Pt, b: Pt) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

const NONE: RawFeatures = {
  person: false, inFrame: false, waistVisible: false, faceVisible: false, handsVisible: false, headDown: false, lookingAway: false,
  backTurned: false, handsTogetherInFront: false, handsHidden: false, armsCrossed: false, nearFace: false, wrists: { l: null, r: null },
  m: { sw: 0, noseDrop: 0, yawProxy: 0, swTorso: null, pitch: null, yaw: null },
};

/** One frame → features. `pose` is null when no person was found; `face` is null when FaceLandmarker did not run or found no face. */
export function frameFeatures(pose: Pt[] | null, face: HeadPose | null, calib: Calib | null, size: Size, r: BodyRules = BODY_RULES): RawFeatures {
  if (!pose || pose.length < 25) return { ...NONE, wrists: { l: null, r: null }, m: { ...NONE.m } };
  const inside = (p: Pt) => p.x >= 0 && p.x <= size.w && p.y >= 0 && p.y <= size.h;
  const seen = (p: Pt | undefined, min = r.visibility.seen) => !!p && p.v >= min && inside(p);
  const c = calib ?? DEFAULT_CALIB;
  const g = (i: number) => pose[i];
  const shL = g(P.shL), shR = g(P.shR), hipL = g(P.hipL), hipR = g(P.hipR);
  const wrL = g(P.wrL), wrR = g(P.wrR), elL = g(P.elL), elR = g(P.elR);
  const nose = g(P.nose), eyeL = g(P.eyeL), eyeR = g(P.eyeR), earL = g(P.earL), earR = g(P.earR);

  const shouldersSeen = seen(shL) && seen(shR);
  const sw = Math.max(1e-6, dist(shL, shR));
  const shY = (shL.y + shR.y) / 2;
  const waistVisible = seen(hipL) && seen(hipR);
  const hipY = waistVisible ? (hipL.y + hipR.y) / 2 : shY + r.hipGuess * sw;
  const torsoH = waistVisible ? Math.max(1e-6, hipY - shY) : null;
  const faceByPose = seen(nose) && seen(eyeL) && seen(eyeR);
  const faceVisible = !!face || faceByPose;

  // measures (also used for calibration)
  const headLineY = (eyeL.y + eyeR.y + earL.y + earR.y) / 4;
  const noseDrop = (nose.y - headLineY) / sw;
  const earMid = mid(earL, earR);
  const earW = Math.max(sw * 0.15, dist(earL, earR));
  const yawProxy = Math.max(-2, Math.min(2, (nose.x - earMid.x) / earW));
  const swTorso = torsoH ? sw / torsoH : null;
  const m: Measures = { sw, noseDrop, yawProxy, swTorso, pitch: face?.pitch ?? null, yaw: face?.yaw ?? null };

  const backTurned = shouldersSeen && !face && nose.v < r.visibility.seen && eyeL.v < r.visibility.seen && eyeR.v < r.visibility.seen;
  const facingParts = shouldersSeen && !backTurned;

  const headDown = facingParts && (face && c.pitch !== null
    ? face.pitch - c.pitch >= r.headDown.pitchDeg
    : noseDrop - c.noseDrop >= r.headDown.noseDrop);

  let sideways = false;
  if (shouldersSeen) {
    const ratio = swTorso !== null && c.swTorso ? swTorso / c.swTorso : c.sw ? sw / c.sw : 1;
    sideways = ratio < r.lookingAway.shoulderRatio;
  }
  const yawOff = face && c.yaw !== null ? Math.abs(face.yaw - c.yaw) >= r.lookingAway.yawDeg : Math.abs(yawProxy - c.yawProxy) >= r.lookingAway.yawProxy;
  const lookingAway = facingParts && (sideways || yawOff);

  const between = (p: Pt) => p.y > shY && p.y < hipY;
  const wristsSeen = seen(wrL) && seen(wrR);
  let handsTogetherInFront = false;
  if (shouldersSeen && wristsSeen && dist(wrL, wrR) / sw < r.handsTogether.maxGap && between(wrL) && between(wrR)) {
    const lo = Math.min(shL.x, shR.x) - r.handsTogether.sideMargin * sw, hi = Math.max(shL.x, shR.x) + r.handsTogether.sideMargin * sw;
    const inX = [wrL, wrR].every((w) => w.x >= lo && w.x <= hi);
    const zs = [wrL.z, wrR.z, shL.z, shR.z];
    const inFront = zs.every((z) => typeof z === 'number') ? ((wrL.z! + wrR.z!) / 2 - (shL.z! + shR.z!) / 2) / sw <= r.handsTogether.frontZ : true;
    handsTogetherInFront = inX && inFront;
  }

  const hiddenOrAtHip = (w: Pt, hip: Pt) => w.v < r.visibility.wristHidden || !inside(w) || dist(w, hip) / sw <= r.handsHidden.nearHip;
  const handsHidden = shouldersSeen && waistVisible && hiddenOrAtHip(wrL, hipL) && hiddenOrAtHip(wrR, hipR);

  const wv = (w: Pt) => seen(w, r.visibility.wristHidden);
  const armsCrossed = shouldersSeen && wv(wrL) && wv(wrR) && seen(elL) && seen(elR)
    && dist(wrL, elR) / sw <= r.armsCrossed.nearElbow && dist(wrR, elL) / sw <= r.armsCrossed.nearElbow && between(wrL) && between(wrR);

  const nearFace = shouldersSeen && !backTurned && [wrL, wrR].some((w) => wv(w) && w.y < shY && dist(w, nose) / sw <= r.faceTouch.nearNose);

  const wristPos = (w: Pt) => (seen(w) && w.y < hipY ? { x: w.x, y: w.y } : null);
  return {
    person: true,
    inFrame: shouldersSeen,
    waistVisible,
    faceVisible,
    handsVisible: shouldersSeen && (seen(wrL) || seen(wrR)),
    headDown, lookingAway, backTurned, handsTogetherInFront, handsHidden, armsCrossed, nearFace,
    wrists: { l: wristPos(wrL), r: wristPos(wrR) },
    m,
  };
}

/** Wrist speed between two frames, in shoulder widths per second (the faster wrist). */
export function wristSpeed(prev: RawFeatures, cur: RawFeatures, dtMs: number): number {
  if (dtMs <= 0) return 0;
  const sw = (prev.m.sw + cur.m.sw) / 2;
  if (!(sw > 0)) return 0;
  let best = 0;
  for (const k of ['l', 'r'] as const) {
    const a = prev.wrists[k], b = cur.wrists[k];
    if (a && b) best = Math.max(best, dist(a, b) / sw / (dtMs / 1000));
  }
  return best;
}

/** The average of the measures over the calibration frames (only frames with the teacher in frame). */
export function calibrate(frames: RawFeatures[]): Calib | null {
  const ok = frames.filter((f) => f.inFrame && !f.backTurned);
  if (ok.length < 5) return null;
  const avg = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
  const nums = (pick: (f: RawFeatures) => number | null) => ok.map(pick).filter((x): x is number => x !== null);
  const pitch = nums((f) => f.m.pitch), yaw = nums((f) => f.m.yaw), swT = nums((f) => f.m.swTorso);
  return {
    noseDrop: avg(ok.map((f) => f.m.noseDrop)),
    yawProxy: avg(ok.map((f) => f.m.yawProxy)),
    pitch: pitch.length >= ok.length / 2 ? avg(pitch) : null,
    yaw: yaw.length >= ok.length / 2 ? avg(yaw) : null,
    swTorso: swT.length >= ok.length / 2 ? avg(swT) : null,
    sw: avg(ok.map((f) => f.m.sw)),
  };
}

// ---------- over time ----------

export interface LiveFeatures extends RawFeatures {
  /** After the minimum times in bodyRules. */
  backTurnedOn: boolean;
  handsHiddenOn: boolean;
  armsCrossedOn: boolean;
  /** Head down with hands together for a while (the live "eyes on your notes" nudge). */
  readingOn: boolean;
  wristSpeed: number;
  gesturing: boolean;
  /** A new face touch started on this frame. */
  faceTouch: boolean;
}

/** Turns per-frame features into timed ones: minimum durations, smoothed wrist speed, face-touch counting. */
export class FeatureTracker {
  private prev: RawFeatures | null = null;
  private prevT = 0;
  private speed = 0;
  private since: Record<'back' | 'hidden' | 'crossed' | 'reading', number | null> = { back: null, hidden: null, crossed: null, reading: null };
  private wasNear = false;
  private lastTouch = -Infinity;
  constructor(private r: BodyRules = BODY_RULES) {}
  reset() { this.prev = null; this.speed = 0; this.since = { back: null, hidden: null, crossed: null, reading: null }; this.wasNear = false; this.lastTouch = -Infinity; }
  setRules(r: BodyRules) { this.r = r; }
  update(t: number, f: RawFeatures): LiveFeatures {
    const r = this.r;
    const dt = this.prev ? Math.min(r.detector.maxGapMs, t - this.prevT) : 0;
    const inst = this.prev && dt > 0 ? wristSpeed(this.prev, f, t - this.prevT) : 0;
    const a = dt > 0 ? 1 - Math.exp(-dt / r.gesturing.smoothMs) : 1;
    this.speed += (inst - this.speed) * a;
    const hold = (k: keyof FeatureTracker['since'], on: boolean, ms: number) => {
      if (!on) { this.since[k] = null; return false; }
      if (this.since[k] === null) this.since[k] = t;
      return t - this.since[k]! >= ms;
    };
    let faceTouch = false;
    if (f.nearFace && !this.wasNear && t - this.lastTouch >= r.faceTouch.gapMs) { faceTouch = true; this.lastTouch = t; }
    this.wasNear = f.nearFace;
    this.prev = f; this.prevT = t;
    return {
      ...f,
      backTurnedOn: hold('back', f.backTurned, r.backTurned.minMs),
      handsHiddenOn: hold('hidden', f.handsHidden, r.handsHidden.minMs),
      armsCrossedOn: hold('crossed', f.armsCrossed, r.armsCrossed.minMs),
      readingOn: hold('reading', f.headDown && f.handsTogetherInFront, r.live.readingMs),
      wristSpeed: this.speed,
      gesturing: this.speed > r.gesturing.speed,
      faceTouch,
    };
  }
}

/** What one frame contributes to a turn's numbers. */
export interface TurnFrame {
  t: number; inFrame: boolean; headDown: boolean; lookingAway: boolean; backTurned: boolean; handsTogetherInFront: boolean;
  handsHidden: boolean; armsCrossed: boolean; gesturing: boolean; handsVisible: boolean; faceTouch: boolean;
}
export const toTurnFrame = (t: number, f: LiveFeatures): TurnFrame => ({
  t, inFrame: f.inFrame, headDown: f.headDown, lookingAway: f.lookingAway, backTurned: f.backTurned, handsTogetherInFront: f.handsTogetherInFront,
  handsHidden: f.handsHidden, armsCrossed: f.armsCrossed, gesturing: f.gesturing, handsVisible: f.handsVisible, faceTouch: f.faceTouch,
});

/** A turn's numbers from its frames (recorded only while the teacher talks). Percentages are of the time the teacher was in frame. */
export function turnMetrics(frames: TurnFrame[], startT: number, endT: number, r: BodyRules = BODY_RULES): BodyMetrics {
  const talkMs = Math.max(0, Math.round(endT - startT));
  const n = frames.length;
  const dts = frames.map((f, i) => Math.max(0, Math.min(r.detector.maxGapMs, f.t - (i ? frames[i - 1].t : startT))));
  // features with a minimum time count for their whole run, once the run is long enough
  const runs = (key: 'backTurned' | 'handsHidden' | 'armsCrossed', minMs: number) => {
    const on = new Array<boolean>(n).fill(false);
    let i = 0;
    while (i < n) {
      if (!(frames[i].inFrame && frames[i][key])) { i++; continue; }
      let j = i, ms = 0;
      while (j < n && frames[j].inFrame && frames[j][key]) { ms += j === i ? 0 : dts[j]; j++; }
      if (ms >= minMs) for (let k = i; k < j; k++) on[k] = true;
      i = j;
    }
    return on;
  };
  const back = runs('backTurned', r.backTurned.minMs);
  const hidden = runs('handsHidden', r.handsHidden.minMs);
  const crossed = runs('armsCrossed', r.armsCrossed.minMs);
  const flagsOf = (i: number): Record<keyof BodyFlags, boolean> => {
    const f = frames[i];
    return {
      headDown: f.headDown && !back[i], lookingAway: f.lookingAway && !back[i], backTurned: back[i], handsTogetherInFront: f.handsTogetherInFront,
      handsHidden: hidden[i], armsCrossed: crossed[i], gesturing: f.gesturing, facing: !back[i] && !f.lookingAway, handsVisible: f.handsVisible,
    };
  };
  const sum = (from: number) => {
    const ms = { ...emptyFlags() };
    let seen = 0;
    for (let i = from; i < n; i++) {
      if (!frames[i].inFrame) continue;
      seen += dts[i];
      const fl = flagsOf(i);
      for (const k of Object.keys(ms) as (keyof BodyFlags)[]) if (fl[k]) ms[k] += dts[i];
    }
    const pct = { ...emptyFlags() };
    for (const k of Object.keys(pct) as (keyof BodyFlags)[]) pct[k] = seen > 0 ? Math.round((100 * ms[k]) / seen) : 0;
    return { pct, seen };
  };
  const all = sum(0);
  let lastFrom = n;
  while (lastFrom > 0 && frames[lastFrom - 1].t >= endT - r.turn.lastMs) lastFrom--;
  const last3 = sum(lastFrom);
  return {
    v: 1,
    talkMs,
    seenPct: talkMs > 0 ? Math.min(100, Math.round((100 * all.seen) / talkMs)) : 0,
    pct: all.pct,
    last3: last3.pct,
    faceTouches: frames.filter((f) => f.faceTouch && f.inFrame).length,
  };
}

/** Collects frames for one spoken turn. */
export class TurnCollector {
  private frames: TurnFrame[] = [];
  private t0 = 0;
  active = false;
  start(t: number) { this.frames = []; this.t0 = t; this.active = true; }
  add(t: number, f: LiveFeatures) { if (this.active) this.frames.push(toTurnFrame(t, f)); }
  cancel() { this.active = false; this.frames = []; }
  finish(t: number, r: BodyRules = BODY_RULES): BodyMetrics | null {
    if (!this.active) return null;
    this.active = false;
    const m = turnMetrics(this.frames, this.t0, t, r);
    this.frames = [];
    return m;
  }
}
