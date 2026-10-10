// "Set up your camera" for stand-up mode: mirrored preview, live chips, checklist, 3-2-1 calibration.
// The video stays in this browser: nothing is recorded or sent.
import { useEffect, useRef, useState } from 'react';
import { Check, Minus, VideoOff } from 'lucide-react';
import type { Lang } from '@shared/data';
import { tr, type Key } from '@/i18n';
import { calibrateNow, getCalib, onFrame, startCamera, useCamera } from '@/lib/body/detector';
import { setStandup, useStandup } from '@/lib/body/standup';
import { Fill } from './Fill';

type Cal = 'idle' | 'count' | 'hold' | 'done' | 'fail';
const ERR: Record<string, Key> = { denied: 'camDenied', none: 'camNone', busy: 'camBusy', other: 'camOther', model: 'camModel' };

export function SelfVideo({ className }: { className?: string }) {
  const cam = useCamera();
  const v = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = v.current;
    if (!el) return;
    el.srcObject = cam.stream;
    if (cam.stream) el.play().catch(() => {});
  }, [cam.stream]);
  return <video ref={v} className={className} muted playsInline autoPlay aria-hidden="true" />;
}

export function CameraSetup({ lang, onDone, onOff }: { lang: Lang; onDone: () => void; onOff: () => void }) {
  const cam = useCamera();
  const prefs = useStandup();
  const [chips, setChips] = useState({ frame: false, face: false, waist: false, light: false });
  const [cal, setCal] = useState<Cal>(() => (getCalib() ? 'done' : 'idle'));
  const [count, setCount] = useState(3);
  const alive = useRef(true);

  useEffect(() => { alive.current = true; void startCamera(); return () => { alive.current = false; }; }, []);
  useEffect(() => {
    let last = 0;
    return onFrame((f) => {
      if (f.t - last < 250) return;
      last = f.t;
      const next = { frame: f.raw.inFrame, face: f.raw.faceVisible, waist: f.raw.waistVisible, light: f.light.ok };
      setChips((c) => (c.frame === next.frame && c.face === next.face && c.waist === next.waist && c.light === next.light ? c : next));
    });
  }, []);

  const calibrated = cal === 'done';
  const close = () => (calibrated ? onDone() : onOff());
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.code === 'Escape') { e.preventDefault(); close(); } };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  const calibrate = async () => {
    for (let n = 3; n >= 1; n--) {
      if (!alive.current) return;
      setCal('count'); setCount(n);
      await new Promise((r) => setTimeout(r, 1000));
    }
    if (!alive.current) return;
    setCal('hold');
    const c = await calibrateNow(3000);
    if (alive.current) setCal(c ? 'done' : 'fail');
  };

  const blocked = cam.status === 'error';
  const chip = (on: boolean, k: Key) => (
    <li className={`cam-chip${on ? ' on' : ''}`}>{on ? <Check size={16} strokeWidth={3} aria-hidden /> : <Minus size={16} aria-hidden />}{tr(k, lang)}</li>
  );

  return (
    <div className="modal-back" role="dialog" aria-modal="true" aria-labelledby="cam-title">
      <div className="modal cam-setup">
        <h2 id="cam-title">{tr(blocked ? 'camBlockedTitle' : 'camSetupTitle', lang)}</h2>
        {blocked ? (
          <div className="cam-blocked">
            <VideoOff size={40} aria-hidden />
            <p>{tr(ERR[cam.error ?? 'other'], lang)}</p>
            {(cam.error === 'denied' || cam.error === 'other') && <p className="muted">{tr('camPreviewHint', lang)}</p>}
            <div className="actions">
              {cam.error !== 'none' && <button type="button" className="btn btn-primary" onClick={() => void startCamera()}>{tr('tryAgain', lang)}</button>}
              <button type="button" className="btn" onClick={onOff}>{tr('camContinueWithout', lang)}</button>
            </div>
          </div>
        ) : (
          <>
            <div className="cam-grid">
              <div>
                <div className="cam-view">
                  <SelfVideo className="mirror" />
                  <svg className="cam-outline" viewBox="0 0 160 90" aria-hidden="true">
                    <ellipse cx="80" cy="22" rx="9" ry="11" />
                    <path d="M74 33 L74 38 L60 42 C52 45 49 52 48 62 L47 84 M86 33 L86 38 L100 42 C108 45 111 52 112 62 L113 84" />
                    <path className="waist" d="M58 82 L102 82" />
                  </svg>
                  {cam.status !== 'on' && <div className="cam-wait">{tr(cam.status === 'loading' ? 'camLoading' : 'camOpening', lang)}</div>}
                  {cal === 'count' && <div className="cam-count" aria-live="assertive"><bdi dir="ltr">{count}</bdi></div>}
                </div>
                <ul className="cam-chips" aria-live="polite">
                  {chip(chips.frame, 'camChipFrame')}{chip(chips.face, 'camChipFace')}{chip(chips.waist, 'camChipWaist')}{chip(chips.light, 'camChipLight')}
                </ul>
                <label className="tap-switch cam-free">
                  <input type="checkbox" role="switch" checked={prefs.handsFree} onChange={(e) => setStandup({ handsFree: e.target.checked })} />
                  <span>{tr('handsFree', lang)}<small className="sw-hint">{tr('handsFreeHint', lang)}</small></span>
                </label>
              </div>
              <div className="cam-side">
                <ul className="cam-check">
                  {(['camCheck1', 'camCheck2', 'camCheck3', 'camCheck4', 'camCheck5'] as Key[]).map((k) => <li key={k}><Fill text={tr(k, lang)} lang={lang} /></li>)}
                </ul>
                <div className="cam-cal">
                  <p><Fill text={tr(cal === 'hold' ? 'camCalibHold' : cal === 'done' ? 'camCalibDone' : cal === 'fail' ? 'camCalibFail' : 'camCalibLine', lang)} lang={lang} /></p>
                  {(cal === 'idle' || cal === 'fail' || cal === 'done') && (
                    <button type="button" className={`btn${calibrated ? ' btn-outline' : ''}`} disabled={cam.status !== 'on'} onClick={() => void calibrate()}>
                      {tr(calibrated ? 'camCalibAgain' : 'camCalibBtn', lang)}
                    </button>
                  )}
                </div>
              </div>
            </div>
            <p className="cam-note"><Fill text={tr('camPrivacy', lang)} lang={lang} /></p>
            <p className="cam-note">{tr('camNotScored', lang)}</p>
            <div className="actions">
              <button type="button" className="btn btn-primary" disabled={!calibrated} onClick={onDone}>{tr('camDone', lang)}</button>
              <button type="button" className="btn btn-outline" onClick={onOff}>{tr('camTurnOff', lang)}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
