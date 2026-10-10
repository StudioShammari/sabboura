// pnpm test:body — stand-up mode without a camera: synthetic landmark sequences go through features.ts
// (per-frame features → timed features → per-turn numbers) and then shared/bodyNotes.ts. Prints PASS/FAIL per case; exit 1 on any failure.
import { BODY_RULES } from '../shared/bodyRules';
import { bodyNotes, type BodyMetrics, type BodyResult, type NoteKind } from '../shared/bodyNotes';
import { calibrate, FeatureTracker, frameFeatures, P, TurnCollector, type Calib, type Pt } from '../src/lib/body/features';

const SIZE = { w: 1280, h: 720 };
const FPS = 12;

// a deterministic jitter so frames are not perfectly still
let seed = 7;
const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 - 0.5; };

type Body = Partial<Record<keyof typeof P, { x: number; y: number; z?: number; v?: number }>>;
/** A teacher standing 1.5–2 m away: shoulders 200 px wide, waist in frame. */
const BASE: Required<Body> = {
  nose: { x: 640, y: 170, z: -60 }, eyeL: { x: 660, y: 155, z: -50 }, eyeR: { x: 620, y: 155, z: -50 }, earL: { x: 685, y: 165, z: 0 }, earR: { x: 595, y: 165, z: 0 },
  shL: { x: 740, y: 260, z: 0 }, shR: { x: 540, y: 260, z: 0 }, elL: { x: 770, y: 380, z: 0 }, elR: { x: 510, y: 380, z: 0 },
  wrL: { x: 790, y: 440, z: -20 }, wrR: { x: 490, y: 440, z: -20 }, hipL: { x: 700, y: 500, z: 0 }, hipR: { x: 580, y: 500, z: 0 },
};

function pose(over: Body = {}): Pt[] {
  const pts: Pt[] = Array.from({ length: 33 }, () => ({ x: 640, y: 300, z: 0, v: 0.2 }));
  const merged = { ...BASE, ...over } as Required<Body>;
  for (const k of Object.keys(P) as (keyof typeof P)[]) {
    const p = merged[k];
    pts[P[k]] = { x: p.x + rnd() * 3, y: p.y + rnd() * 3, z: p.z ?? 0, v: p.v ?? 0.95 + rnd() * 0.08 };
  }
  // the other eye points follow the eyes
  pts[1] = { ...pts[2] }; pts[3] = { ...pts[2] }; pts[4] = { ...pts[5] }; pts[6] = { ...pts[5] };
  return pts;
}

/** Hands making a circle (a gesture) around their resting place, at `speed` shoulder widths per second. */
const circle = (t: number, speed: number): Body => {
  const R = 50, w = (speed * 200) / R; // px/s = R·ω
  const dx = R * Math.cos(w * t), dy = R * Math.sin(w * t);
  return { wrL: { x: 790 + dx, y: 400 + dy, z: -20 }, wrR: { x: 490 - dx, y: 400 + dy, z: -20 } };
};

type Gen = (tSec: number) => Pt[] | null;
const normal: Gen = (t) => pose(t % 3.5 < 1.5 ? circle(t, 1) : {});

function calib(): Calib {
  const raws = Array.from({ length: 3 * FPS }, (_, i) => frameFeatures(normal(i / FPS), null, null, SIZE));
  const c = calibrate(raws);
  if (!c) throw new Error('calibration failed');
  return c;
}
const CAL = calib();

/** One spoken turn: frames at 12 fps, collected only while "recording". */
function turn(gen: Gen, seconds: number): BodyMetrics {
  const tr = new FeatureTracker(), col = new TurnCollector();
  // a second of frames before talking, like the real detector which runs all the time
  let t = 0;
  for (; t < 1000; t += 1000 / FPS) tr.update(t, frameFeatures(gen(t / 1000), null, CAL, SIZE));
  const start = t;
  col.start(start);
  for (; t < start + seconds * 1000; t += 1000 / FPS) col.add(t, tr.update(t, frameFeatures(gen((t - start) / 1000), null, CAL, SIZE)));
  return col.finish(t)!;
}

interface Case { name: string; turns: { gen: Gen; s: number; check?: string; text?: string }[]; expect: (r: BodyResult | null) => string | null }
const kinds = (r: BodyResult | null) => (r?.notes ?? []).map((n) => n.kind);
const has = (k: NoteKind, not: NoteKind[] = []) => (r: BodyResult | null) => {
  const ks = kinds(r);
  if (!r || r.unseen) return 'no notes at all (unseen)';
  if (!ks.includes(k)) return `expected "${k}", got [${ks.join(', ')}]`;
  const bad = not.filter((x) => ks.includes(x));
  return bad.length ? `did not expect [${bad.join(', ')}]` : null;
};

const CASES: Case[] = [
  {
    name: 'Arms crossed',
    turns: [{ gen: () => pose({ wrL: { x: 530, y: 372, z: -40 }, wrR: { x: 750, y: 372, z: -40 } }), s: 10 }],
    expect: has('crossed'),
  },
  {
    name: 'Wrists at the hips, hips visible',
    turns: [{ gen: () => pose({ wrL: { x: 705, y: 505 }, wrR: { x: 575, y: 505 } }), s: 12 }],
    expect: has('pockets'),
  },
  {
    name: 'Shoulders visible but no face',
    turns: [{ gen: (t) => pose({ ...circle(t, 0.3), nose: { x: 640, y: 170, v: 0.1 }, eyeL: { x: 660, y: 155, v: 0.08 }, eyeR: { x: 620, y: 155, v: 0.08 } }), s: 10 }],
    expect: has('back', ['reading', 'lookingDown']),
  },
  {
    name: 'Head down with hands together in front',
    turns: [{ gen: () => pose({ nose: { x: 640, y: 192, z: -60 }, wrL: { x: 660, y: 380, z: -70 }, wrR: { x: 620, y: 380, z: -70 } }), s: 10 }],
    expect: has('reading', ['lookingDown']),
  },
  {
    name: 'A question turn whose last 3 s are head-down',
    turns: [{ gen: (t) => (t < 5 ? normal(t) : pose({ nose: { x: 640, y: 192, z: -60 } })), s: 8, check: 'question', text: 'How many pieces do you see on the board now, Omar? Tell me.' }],
    expect: (r) => {
      const e = has('asking', ['lookingDown'])(r);
      if (e) return e;
      const n = r!.notes[0];
      if (n.kind !== 'asking') return `"asking" should come first, got ${n.kind}`;
      return n.words === 'How many pieces do you see on the' ? null : `wrong first 8 words: "${n.words}"`;
    },
  },
  {
    name: 'Constant fast wrists',
    turns: [{ gen: (t) => pose(circle(t, 1.6)), s: 12 }, { gen: (t) => pose(circle(t + 1, 1.6)), s: 12 }],
    expect: has('nonstop', ['still']),
  },
  {
    name: 'Person out of frame',
    turns: [
      { gen: (t) => (t < 1 ? normal(t) : null), s: 10 },
      { gen: () => pose({ shL: { x: 1400, y: 260 }, shR: { x: 1200, y: 260 } }), s: 10 },
    ],
    expect: (r) => (r?.unseen ? (r.notes.length ? 'unseen, but notes were given' : null) : `expected the "couldn't see you" line, got [${kinds(r).join(', ')}]`),
  },
  {
    name: 'A normal teacher',
    turns: [
      { gen: normal, s: 12, check: 'question', text: 'What is one half?' },
      { gen: (t) => normal(t + 0.7), s: 10 },
      { gen: (t) => normal(t + 1.9), s: 14, check: 'yes_no', text: 'Is that clear?' },
    ],
    expect: (r) => (!r ? 'no result' : r.unseen ? 'unseen' : r.notes.length ? `expected no notes, got [${kinds(r).join(', ')}]` : null),
  },
];

let failed = 0;
for (const c of CASES) {
  const turns = c.turns.map((t, i) => ({ turnNo: i + 1, transcript: t.text ?? 'Look at this cake. We cut it into equal pieces.', checkType: t.check ?? 'none', metrics: turn(t.gen, t.s) }));
  const r = bodyNotes(turns, { topicId: 'fractions' }, BODY_RULES);
  const err = c.expect(r);
  if (err) failed++;
  const detail = r ? (r.unseen ? 'unseen' : `notes [${kinds(r).join(', ')}]${r.strength ? ` · strength ${r.strength.kind}` : ''} · facing ${r.stats?.facing}% · moving ${r.stats?.handMovement}%`) : 'no result';
  console.log(`${err ? 'FAIL' : 'PASS'}  ${c.name.padEnd(46)} ${detail}${err ? `\n      → ${err}` : ''}`);
}
console.log(failed ? `\n${failed} of ${CASES.length} cases FAILED` : `\nAll ${CASES.length} cases passed`);
process.exit(failed ? 1 : 0);
