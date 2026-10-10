// Hidden tuning page for stand-up mode (/dev/body): the camera with landmarks, live features, and a slider for every
// threshold in shared/bodyRules.ts. The camera runs only while this page is open; nothing is recorded or sent.
import { useEffect, useMemo, useRef, useState } from 'react';
import { BODY_RULES, cloneRules, type BodyRules } from '@shared/bodyRules';
import { bodyNotes, type BodyMetrics } from '@shared/bodyNotes';
import { calibrateNow, getCalib, onFrame, setCalib, setRules, startCamera, stopCamera, useCamera, type BodyFrame } from '@/lib/body/detector';
import { TurnCollector } from '@/lib/body/features';
import { SelfVideo } from '@/components/CameraSetup';

const BONES: [number, number][] = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [15, 17], [15, 19], [16, 18], [16, 20],
  [11, 23], [12, 24], [23, 24], [0, 2], [0, 5], [2, 7], [5, 8], [9, 10],
];
const FLAGS = ['person', 'inFrame', 'waistVisible', 'faceVisible', 'handsVisible', 'headDown', 'lookingAway', 'backTurned', 'handsTogetherInFront', 'handsHidden', 'armsCrossed', 'nearFace'] as const;
const LIVE = ['backTurnedOn', 'handsHiddenOn', 'armsCrossedOn', 'readingOn', 'gesturing', 'faceTouch'] as const;

type Leaf = { path: string[]; value: number };
function leaves(o: unknown, path: string[] = []): Leaf[] {
  if (typeof o === 'number') return [{ path, value: o }];
  if (!o || typeof o !== 'object') return [];
  return Object.entries(o as Record<string, unknown>).flatMap(([k, v]) => leaves(v, [...path, k]));
}
const getAt = (o: unknown, p: string[]) => p.reduce<any>((x, k) => x?.[k], o) as number;
function setAt(o: BodyRules, p: string[], v: number): BodyRules {
  const c = cloneRules(o);
  let x: any = c;
  for (const k of p.slice(0, -1)) x = x[k];
  x[p[p.length - 1]] = v;
  return c;
}
const stepFor = (v: number) => (Number.isInteger(v) ? (Math.abs(v) >= 100 ? 10 : 1) : 0.01);
const maxFor = (v: number) => (v === 0 ? 1 : Number.isInteger(v) ? Math.max(10, Math.ceil(v * 3)) : Math.max(1, Math.ceil(v * 3 * 100) / 100));

export default function DevBody() {
  const cam = useCamera();
  const [rules, setLocal] = useState<BodyRules>(() => cloneRules(BODY_RULES));
  const [frame, setFrame] = useState<BodyFrame | null>(null);
  const [calibInfo, setCalibInfo] = useState(() => getCalib());
  const [copied, setCopied] = useState(false);
  const [turn, setTurn] = useState<{ on: boolean; metrics: BodyMetrics | null; notes: string[] }>({ on: false, metrics: null, notes: [] });
  const canvas = useRef<HTMLCanvasElement>(null);
  const coll = useRef(new TurnCollector());
  const list = useMemo(() => leaves(BODY_RULES), []);

  useEffect(() => { void startCamera(); return () => { stopCamera(); setRules(BODY_RULES); }; }, []);
  useEffect(() => { setRules(rules); }, [rules]);
  useEffect(() => {
    let last = 0;
    return onFrame((f) => {
      coll.current.add(f.t, f.live);
      draw(canvas.current, f);
      if (f.t - last > 150) { last = f.t; setFrame(f); }
    });
  }, []);

  const startTurn = () => { coll.current.start(performance.now()); setTurn({ on: true, metrics: null, notes: [] }); };
  const stopTurn = () => {
    const m = coll.current.finish(performance.now(), rules);
    const res = m ? bodyNotes([{ turnNo: 1, transcript: 'test turn', checkType: 'question', metrics: m }], { topicId: 'fractions' }, rules) : null;
    setTurn({ on: false, metrics: m, notes: res ? (res.unseen ? ['unseen'] : res.notes.map((n) => n.kind)) : [] });
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(`export const BODY_RULES = ${JSON.stringify(rules, null, 2)};\n`); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* ignore */ }
  };

  const f = frame;
  const fmt = (n: number | null | undefined, d = 2) => (n == null ? '-' : n.toFixed(d));
  return (
    <main className="dev-body" dir="ltr">
      <header>
        <h1>Body tuning</h1>
        <span>camera: <b>{cam.status}</b>{cam.error ? ` (${cam.error})` : ''} · {cam.fps} fps · {cam.delegate ?? '-'} · face model {cam.face ? 'on' : 'off'}</span>
      </header>
      <div className="db-grid">
        <section>
          <div className="db-view">
            <SelfVideo className="mirror" />
            <canvas ref={canvas} className="mirror" />
          </div>
          <div className="db-row">
            <button className="btn" disabled={cam.status !== 'on'} onClick={() => void calibrateNow(3000).then(setCalibInfo)}>Calibrate (3 s)</button>
            <button className="btn btn-outline" onClick={() => { setCalib(null); setCalibInfo(null); }}>Clear calibration</button>
            {turn.on ? <button className="btn btn-primary" onClick={stopTurn}>Stop turn</button> : <button className="btn" disabled={cam.status !== 'on'} onClick={startTurn}>Start a test turn</button>}
          </div>
          <pre className="db-pre">{calibInfo ? `calib ${JSON.stringify(calibInfo)}` : 'no calibration'}</pre>
          {turn.metrics && <pre className="db-pre">{`notes: ${turn.notes.join(', ') || 'none'}\n${JSON.stringify(turn.metrics)}`}</pre>}
        </section>
        <section className="db-live">
          <h2>Live</h2>
          <ul className="db-flags">
            {FLAGS.map((k) => <li key={k} className={f?.raw[k] ? 'on' : ''}>{k}</li>)}
            {LIVE.map((k) => <li key={k} className={f?.live[k] ? 'on fire' : 'fire'}>{k}</li>)}
          </ul>
          <pre className="db-pre">{f ? [
            `shoulder width ${fmt(f.raw.m.sw, 0)} px · torso ratio ${fmt(f.raw.m.swTorso)}`,
            `noseDrop ${fmt(f.raw.m.noseDrop)} · yawProxy ${fmt(f.raw.m.yawProxy)}`,
            `face pitch ${fmt(f.raw.m.pitch, 1)}° · yaw ${fmt(f.raw.m.yaw, 1)}° · face ${f.head ? `${f.head.widthPx.toFixed(0)} px` : 'off'}`,
            `wrist speed ${fmt(f.live.wristSpeed)} sw/s`,
            `light mean ${f.light.mean}${f.light.dark ? ' DARK' : ''}${f.light.backlit ? ' BACKLIT' : ''}`,
          ].join('\n') : 'waiting for frames'}</pre>
        </section>
        <section className="db-rules">
          <div className="db-row">
            <h2>Thresholds</h2>
            <button className="btn" onClick={() => void copy()}>{copied ? 'Copied' : 'Copy thresholds'}</button>
            <button className="btn btn-outline" onClick={() => setLocal(cloneRules(BODY_RULES))}>Reset</button>
          </div>
          {list.map(({ path, value }) => {
            const v = getAt(rules, path);
            return (
              <label key={path.join('.')} className="db-slider">
                <span>{path.join('.')}</span>
                <input type="range" min={0} max={maxFor(value)} step={stepFor(value)} value={v} onChange={(e) => setLocal((r) => setAt(r, path, Number(e.target.value)))} />
                <b>{v}</b>
              </label>
            );
          })}
        </section>
      </div>
    </main>
  );
}

function draw(c: HTMLCanvasElement | null, f: BodyFrame) {
  if (!c) return;
  if (c.width !== f.size.w || c.height !== f.size.h) { c.width = f.size.w; c.height = f.size.h; }
  const g = c.getContext('2d');
  if (!g) return;
  g.clearRect(0, 0, c.width, c.height);
  if (f.faceLm) {
    g.fillStyle = 'rgba(255,255,255,.7)';
    for (let i = 0; i < f.faceLm.length; i += 3) g.fillRect(f.faceLm[i].x - 1, f.faceLm[i].y - 1, 2, 2);
  }
  const p = f.pose;
  if (!p) return;
  g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,.9)';
  for (const [a, b] of BONES) {
    if (p[a].v < 0.5 || p[b].v < 0.5) continue;
    g.beginPath(); g.moveTo(p[a].x, p[a].y); g.lineTo(p[b].x, p[b].y); g.stroke();
  }
  for (const q of p.slice(0, 25)) {
    if (q.v < 0.5) continue;
    g.beginPath(); g.arc(q.x, q.y, 4, 0, Math.PI * 2);
    g.fillStyle = '#2B2118'; g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke();
  }
}
