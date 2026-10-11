import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import confetti from 'canvas-confetti';
import { Keyboard, RotateCcw, Square as StopIcon, Send, X } from 'lucide-react';
import { KID_IDS, demoScript, topicById, type KidId, type Level, type Levels } from '@shared/data';
import { BACK_ROW_LABEL, DEFAULT_SETTING, DIALS, isLarge, kidName, normalizeSetting, type ClassSetting } from '@shared/setting';
import type { KidChange, LineEvent, StateEvent, TimingsEvent } from '@shared/schemas';
import { Board, type Mark } from '@/components/Board';
import { KidCard, type CardView } from '@/components/KidCard';
import { Ledge, type Caption } from '@/components/Ledge';
import { MicButton } from '@/components/MicButton';
import { DebugPanel } from '@/components/DebugPanel';
import { fmtNum, useT, tr, trf, type Key } from '@/i18n';
import { SettingProvider } from '@/lib/classSetting';
import { endLesson, getLesson, postBody, redoTurn, transcribe } from '@/lib/api';
import type { Plan } from '@shared/plan';
import { closeMic, fadeOutAll, getMic, micName, openMic, preloadLesson, unlockAudio } from '@/lib/audio';
import { Recorder } from '@/lib/recorder';
import { sfx, setMurmur } from '@/lib/sfx';
import { getSettings, setSettings, useSettings } from '@/lib/store';
import { playChorus, playLocalFailsafe, playQuestion, playTurn, type TurnUI } from '@/lib/turnPlayer';
import { SelfTile, type Nudge } from '@/components/SelfTile';
import { getCalib, getCamera, onFrame, setCalib, startCamera, stopCamera, useCamera } from '@/lib/body/detector';
import { TurnCollector } from '@/lib/body/features';
import { HANDS_FREE, VoiceGate } from '@/lib/body/handsfree';
import { loadCalib, saveCalib, setStandup, useStandup } from '@/lib/body/standup';
import type { BodyMetrics } from '@shared/bodyNotes';

type Phase = 'idle' | 'recording' | 'processing' | 'playing';
type Evidence = { turn: number; text: string };

export default function Classroom() {
  const { id = '' } = useParams<{ id: string }>();
  const [, nav] = useLocation();
  const { lang } = useT();
  const settings = useSettings();
  const qs = useMemo(() => new URLSearchParams(location.search), []);
  const demo = qs.get('demo') === '1';
  const typeMode = qs.get('type') === '1';

  const [ready, setReady] = useState(false);
  const [needTap, setNeedTap] = useState(false);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [planOpen, setPlanOpen] = useState(false);
  const [levels, setLevels] = useState<Levels>({ omar: 0, lina: 0, sara: 0, khaled: 0, yazan: 0 });
  const [turnNo, setTurnNo] = useState(0);
  // the class conditions of this lesson (stage mode always runs the default class)
  const [setting, setSetting] = useState<ClassSetting>(DEFAULT_SETTING);
  const settingRef = useRef(setting);
  const [backRow, setBackRow] = useState(0);
  const [phase, setPhase] = useState<Phase>('idle');
  const [views, setViews] = useState<Partial<Record<KidId, CardView>>>({});
  const [transcript, setTranscript] = useState('');
  const [marks, setMarks] = useState<Mark[]>([]);
  const [tally, setTally] = useState(0);
  const [heard, setHeard] = useState(false);
  const [caption, setCaption] = useState<Caption | null>(null);
  const [chorus, setChorus] = useState<{ text: string; phase: 'show' | 'stamp' | 'hide' } | null>(null);
  const [recElapsed, setRecElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  const [cancelling, setCancelling] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [micErr, setMicErr] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState('');
  const typeRef = useRef<HTMLTextAreaElement>(null);
  const [popKid, setPopKid] = useState<KidId | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [ending, setEnding] = useState(false);
  const [stage] = useState(demo);
  const [hud, setHud] = useState(false);
  const [hideCursor, setHideCursor] = useState(false);
  const [inLevel, setInLevel] = useState(0);
  const [subtitles, setSubtitles] = useState(false);
  const [debugOpen, setDebugOpen] = useState(qs.get('debug') === '1');
  const [lastTimings, setLastTimings] = useState<TimingsEvent | null>(null);
  const [eventLog, setEventLog] = useState<string[]>([]);
  // stand-up mode (only for lessons started with it; never in stage mode)
  const [standup, setStandupLesson] = useState(false);
  const standupRef = useRef(false);
  const sp = useStandup();
  const cam = useCamera();
  const collector = useRef(new TurnCollector());
  const [inFrame, setInFrame] = useState(false);
  const [nudge, setNudge] = useState<Nudge | null>(null);
  const nudged = useRef(false);
  const nudgeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const nudgesOn = sp.nudges && !settings.calm;
  const nudgesOnRef = useRef(nudgesOn);
  nudgesOnRef.current = nudgesOn;

  const genRef = useRef(0);
  const active = useRef(true);
  const mounted = useRef(true);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const valid = (gen: number) => active.current && genRef.current === gen;
  const later = useCallback((fn: () => void, ms: number) => {
    const gen = genRef.current;
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      if (active.current && genRef.current === gen) fn();
    }, ms);
    timers.current.add(timer);
    return timer;
  }, []);
  const clearTimers = () => {
    for (const t of timers.current) clearTimeout(t);
    timers.current.clear();
    for (const p of Object.values(pending.current)) if (p) clearTimeout(p.timer);
    pending.current = {};
    if (unlockTimer.current) clearTimeout(unlockTimer.current);
  };
  const abortRef = useRef<() => void>(() => {});
  const recRef = useRef<Recorder | null>(null);
  const recTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const levelsRef = useRef(levels);
  const evidRef = useRef<Partial<Record<KidId, Evidence>>>({});
  const pending = useRef<Partial<Record<KidId, { ch: KidChange; timer: ReturnType<typeof setTimeout> }>>>({});
  const tallyHist = useRef<number[]>([]);
  const phaseRef = useRef<Phase>('idle');
  const turnNoRef = useRef(0);
  const unlockTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spaceDown = useRef(false);
  const startingRec = useRef(false);
  const keepMic = useRef(false);
  const wake = useRef<WakeLockSentinel | null>(null);
  const lastRaisedTurn = useRef(-2);
  const lastRaised = useRef<KidId | null>(null);

  const setPhaseBoth = (p: Phase) => { phaseRef.current = p; setPhase(p); };
  const patchView = useCallback((k: KidId, p: Partial<CardView>) => setViews((v) => ({ ...v, [k]: { ...v[k], ...p } })), []);
  const patchAll = useCallback((p: Partial<CardView>) => setViews((v) => Object.fromEntries(KID_IDS.map((k) => [k, { ...v[k], ...p }])) as typeof v), []);
  const setLv = (next: Levels) => { levelsRef.current = next; setLevels(next); };

  // ---------- load ----------
  useEffect(() => {
    let alive = true;
    getLesson(id).then((l) => {
      if (!alive || !active.current) return;
      if (l.lesson.ended) { active.current = false; nav(`/lesson/${id}/score`, { replace: true }); return; }
      setSettings({ lang: l.lesson.language, title: l.lesson.teacherTitle, topicId: l.lesson.topicId });
      const ls = demo ? DEFAULT_SETTING : normalizeSetting(l.lesson.setting);
      settingRef.current = ls; setSetting(ls); setBackRow(l.backRow ?? 0);
      setLv(l.levels); setTurnNo(l.turnNo); turnNoRef.current = l.turnNo;
      const last = l.turns[l.turns.length - 1];
      if (last) setTranscript(last.transcript);
      setPlan(l.lesson.plan);
      const su = !!l.lesson.standup && !demo && !typeMode;
      standupRef.current = su; setStandupLesson(su);
      if (su) {
        // the calibration pose belongs to this lesson: keep the one from setup, or bring it back after a reload
        const stored = loadCalib(id);
        if (stored) setCalib(stored); else { const c = getCalib(); if (c) saveCalib(id, c); }
        void startCamera();
      }
      setNeedTap(l.turnNo === 0 && !getMic() && !typeMode);
      if (typeMode) setTyping(true);
      setReady(true);
    }).catch(() => { if (alive && active.current) nav('/'); });
    return () => { alive = false; };
  }, [id, nav]);

  const topic = topicById(settings.topicId);

  // ---------- moves ----------
  const burst = (kid: KidId) => {
    if (getSettings().calm || kid !== 'lina') return;
    const el = document.querySelector(`[data-kid="lina"] .avatar-wrap`);
    const r = el?.getBoundingClientRect();
    if (!r) return;
    confetti({ particleCount: 24, spread: 70, startVelocity: 14, gravity: 0.8, scalar: 0.7, ticks: 70, colors: ['#F4F0E6', '#D8C7AA'], disableForReducedMotion: true,
      origin: { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 3) / innerHeight } });
  };
  const applyMove = useCallback((kid: KidId, ch: KidChange, delay = 0) => {
    const run = () => {
      const cur = levelsRef.current;
      if (cur[kid] === ch.to && ch.change === 0) return;
      setLv({ ...cur, [kid]: ch.to });
      if (ch.change !== 0) {
        const key = `${Date.now()}-${kid}`;
        patchView(kid, { delta: { n: ch.change, key }, hop: ch.change > 0, shake: ch.change < 0 });
        later(() => patchView(kid, { delta: null, hop: false, shake: false }), 1100);
        if (ch.change > 0) { ch.to === 2 ? sfx.gotIt() : sfx.badgeUp(); if (ch.to === 2) burst(kid); }
      }
    };
    if (!active.current) return;
    delay ? later(run, delay) : run();
  }, [patchView, later]);

  const flushPending = useCallback((kid: KidId) => {
    const p = pending.current[kid];
    if (!p) return;
    clearTimeout(p.timer);
    delete pending.current[kid];
    applyMove(kid, p.ch);
  }, [applyMove]);

  // ---------- turn ui ----------
  const makeUI = useCallback((gen: number): TurnUI => ({
    stale: () => !valid(gen),
    onState: (ev: StateEvent) => {
      if (!valid(gen)) return;
      setTurnNo(ev.turnNo); turnNoRef.current = ev.turnNo;
      if (ev.backRow !== undefined) setBackRow(ev.backRow);
      const speakers = new Map(ev.speakers.map((s) => [s.kid, s.reason]));
      // evidence highlights
      const byText = new Map<string, KidId[]>();
      let i = 0;
      for (const k of KID_IDS) {
        const ch = ev.levels[k];
        if (ch.evidence && ch.change > 0) {
          byText.set(ch.evidence, [...(byText.get(ch.evidence) ?? []), k]);
          evidRef.current[k] = { turn: ev.turnNo, text: ch.evidence };
        }
      }
      setMarks([...byText].map(([text, kids]) => ({ text, kids })));
      if (ev.check === 'yes_no') { setTally((t) => { tallyHist.current[ev.turnNo] = t + 1; return t + 1; }); sfx.tally(); }
      else tallyHist.current[ev.turnNo] = tallyHist.current[ev.turnNo - 1] ?? 0;
      // apply moves (aha speakers wait for their line)
      for (const k of KID_IDS) {
        const ch = ev.levels[k];
        if (ch.change === 0 && ch.to === levelsRef.current[k]) continue;
        if (speakers.get(k) === 'aha' && ch.change > 0) {
          pending.current[k] = { ch, timer: later(() => flushPending(k), 2500) };
        } else applyMove(k, ch, i++ * 140);
      }
      // card chips
      setViews((v) => {
        const n = { ...v };
        for (const k of KID_IDS) {
          n[k] = { ...n[k], thinking: speakers.has(k), hand: speakers.has(k) && speakers.get(k) !== 'aha', asked: ev.askedKid === k,
            dim: false, unheard: k === 'lina' ? ev.linaPulse || n[k]?.unheard : n[k]?.unheard, unheardPulse: k === 'lina' && ev.linaPulse,
            q: k === 'lina' && ev.linaPulse ? 'blue' : n[k]?.q ?? null };
          if (ev.askedKid === 'lina' && k === 'lina') { n[k].unheard = false; n[k].unheardPulse = false; n[k].q = null; }
        }
        return n;
      });
      if (ev.chorus) patchAll({ thinking: false, hand: false });
    },
    onSpeakStart: (kid: KidId, line: LineEvent) => {
      if (!valid(gen)) return;
      flushPending(kid);
      setCaption({ kid, text: line.text, en: line.text_en });
      setViews((v) => {
        const n: typeof v = {};
        for (const k of KID_IDS) n[k] = { ...v[k], speaking: k === kid, dim: k !== kid, thinking: k === kid ? false : v[k]?.thinking && !!v[k]?.hand, hand: k === kid ? false : v[k]?.hand };
        if (kid === 'lina') n.lina = { ...n.lina, unheard: false, unheardPulse: false, q: null };
        return n;
      });
      sfx.chalk();
    },
    onSpeakEnd: (kid: KidId) => {
      if (!valid(gen)) return;
      patchAll({ speaking: false, dim: false });
      void kid;
    },
    onFirstOutput: () => {
      if (!valid(gen)) return;
      if (unlockTimer.current) clearTimeout(unlockTimer.current);
      if (phaseRef.current === 'processing') setPhaseBoth('playing');
    },
    onChorus: (text, ph) => {
      if (!valid(gen)) return;
      setChorus({ text, phase: ph });
      if (ph === 'show') { patchAll({ thinking: false, hand: false, spotlight: true }); setCaption(null); }
      if (ph === 'stamp') sfx.stamp();
      if (ph === 'hide') { patchAll({ spotlight: false }); later(() => setChorus(null), 300); }
    },
    onTimings: (t) => { if (valid(gen)) setLastTimings(t); },
    onEvent: (name, data) => { if (valid(gen)) setEventLog((l) => [...l.slice(-60), `${name} ${JSON.stringify(data).slice(0, 140)}`]); },
    onDone: () => {
      if (!valid(gen)) return;
      for (const k of KID_IDS) flushPending(k);
      patchAll({ thinking: false, hand: false, speaking: false, dim: false });
      setHeard(false);
      setPhaseBoth('idle');
    },
  }), [applyMove, flushPending, patchAll]);

  const submit = useCallback(async (text: string, source: 'voice' | 'typed', seconds: number) => {
    if (!active.current) return;
    const gen = ++genRef.current;
    setTranscript(text); setMarks([]); setCaption(null); setHeard(source === 'voice');
    setPhaseBoth('processing');
    patchAll({ thinking: true, hand: false, raised: false, speaking: false, dim: false, asked: false });
    if (unlockTimer.current) clearTimeout(unlockTimer.current);
    unlockTimer.current = setTimeout(() => { if (phaseRef.current === 'processing' && genRef.current === gen) setPhaseBoth('playing'); }, 12000);
    await playTurn({ lessonId: id, text, source, seconds, lang: getSettings().lang, title: getSettings().title, ui: makeUI(gen), setAbort: (f) => (abortRef.current = f), setting: settingRef.current });
    if (!valid(gen)) return;
  }, [id, makeUI, patchAll]);

  const localFailsafe = useCallback(async () => {
    if (!active.current) return;
    const gen = ++genRef.current;
    setPhaseBoth('processing');
    const ui = makeUI(gen);
    await playLocalFailsafe(getSettings().lang, ui, 'omar', settingRef.current);
    if (!valid(gen)) return;
  }, [makeUI]);

  // ---------- raised hands ----------
  const callOn = useCallback(async (kid: KidId) => {
    if (!active.current || phaseRef.current !== 'idle') return;
    const gen = ++genRef.current;
    setPhaseBoth('processing'); setCaption(null); setPopKid(null);
    patchAll({ raised: false, hand: false, speaking: false, dim: false });
    await unlockAudio();
    if (!valid(gen)) return;
    await playQuestion({ lessonId: id, kid, lang: getSettings().lang, ui: makeUI(gen), setAbort: (f) => (abortRef.current = f), setting: settingRef.current });
    if (!valid(gen)) return;
  }, [id, makeUI, patchAll]);

  const anyRaised = KID_IDS.some((k) => views[k]?.raised);
  useEffect(() => {
    if (!ready || needTap || demo || phase !== 'idle') return;
    if (anyRaised) {
      const t = later(() => patchAll({ raised: false }), 15000);
      return () => clearTimeout(t);
    }
    // Never before the teacher has spoken, and at most one hand every other turn (every third in a large class).
    if (turnNo < 1 || turnNo - lastRaisedTurn.current < DIALS.handEveryTurns[isLarge(setting) ? 'large' : 'normal']) return;
    const t = later(() => {
      const lv = levelsRef.current;
      const lost = KID_IDS.filter((k) => (k === 'yazan' ? lv.yazan === 0 : lv[k] === 0));
      const pool = lost.length ? lost : KID_IDS.filter((k) => k !== 'yazan' && lv[k] < 2);
      if (!pool.length) return;
      const fresh = pool.filter((k) => k !== lastRaised.current);
      const list = fresh.length ? fresh : pool;
      const kid = list[Math.floor(Math.random() * list.length)];
      lastRaised.current = kid;
      lastRaisedTurn.current = turnNoRef.current;
      patchView(kid, { raised: true });
      sfx.badgeUp();
    }, 12000 + Math.random() * 6000);
    return () => clearTimeout(t);
  }, [ready, needTap, demo, phase, anyRaised, turnNo, patchAll, patchView, setting]);

  // the back of a large class: a soft murmur once it starts drifting
  useEffect(() => { if (!demo && isLarge(setting)) setMurmur(backRow); else setMurmur(0); }, [backRow, setting, demo]);
  useEffect(() => () => setMurmur(0), []);

  // ---------- mic ----------
  const micError = (e: unknown) => {
    if (!active.current) return;
    const n = (e as DOMException)?.name;
    setMicErr(n === 'NotAllowedError' || n === 'SecurityError' ? 'micDenied' : n === 'NotFoundError' ? 'micNone' : n === 'NotReadableError' ? 'micBusy' : 'micOther');
    setTyping(true);
  };
  useEffect(() => { if (typing && !needTap) typeRef.current?.focus(); }, [typing, needTap, micErr]);
  const requestMic = useCallback(async () => {
    const gen = genRef.current;
    try {
      await openMic();
      if (!valid(gen)) { if (!keepMic.current) closeMic(); return false; }
      setMicErr(null); return true;
    } catch (e) { if (valid(gen)) micError(e); return false; }
  }, []);

  const barge = () => {
    genRef.current++;
    // a held "aha" badge move is applied now (not dropped), then every animation timer is cleared
    for (const k of KID_IDS) flushPending(k);
    clearTimers();
    abortRef.current();
    fadeOutAll(150);
    patchAll({ speaking: false, dim: false, thinking: false, hand: false, raised: false, delta: null, hop: false, shake: false, spotlight: false });
    setChorus(null); setCaption(null);
  };

  const startRec = useCallback(async () => {
    if (!active.current || startingRec.current || phaseRef.current === 'recording') return;
    if (phaseRef.current === 'processing') return;
    startingRec.current = true;
    const gen = genRef.current;
    try {
      let stream = getMic();
      if (!stream) { if (!(await requestMic()) || !valid(gen)) return; stream = getMic(); if (!stream) return; }
      await unlockAudio();
      if (!valid(gen)) return;
      barge();
      setNotice(null); setCancelling(false); setHeard(false);
      const rec = new Recorder(stream);
      rec.onLevel = (i) => { if (active.current) { setLevel(i.level); setInLevel(i.level); } };
      rec.start();
      recRef.current = rec;
      if (standupRef.current) { collector.current.start(performance.now()); nudged.current = false; }
      sfx.micOn();
      setPhaseBoth('recording');
      setRecElapsed(0);
      recTimer.current = setInterval(() => {
        const e = rec.elapsedMs;
        setRecElapsed(e);
        if (e >= 45000) void stopRec(false);
      }, 100);
    } catch (e) { if (active.current) micError(e); } finally { startingRec.current = false; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestMic]);

  const stopRec = useCallback(async (cancel: boolean) => {
    const gen = genRef.current;
    const rec = recRef.current;
    if (!active.current || !rec || phaseRef.current !== 'recording') return;
    if (recTimer.current) clearInterval(recTimer.current);
    setCancelling(false); setLevel(0); setRecElapsed(0);
    sfx.micOff();
    // stand-up mode: this turn's body numbers (only while the camera is running)
    let body: BodyMetrics | null = null;
    if (standupRef.current) { if (!cancel && getCamera().status === 'on') body = collector.current.finish(performance.now()); else collector.current.cancel(); }
    if (cancel) { rec.cancel(); recRef.current = null; setPhaseBoth('idle'); return; }
    setPhaseBoth('processing');
    const res = await rec.stop(250);
    rec.dispose();
    if (recRef.current === rec) recRef.current = null;
    if (!valid(gen)) return;
    if (!res || res.durationMs < 350) { setNotice(tr('holdShort', getSettings().lang)); setPhaseBoth('idle'); return; }
    if (res.voicedMs < 300) { setNotice(tr('cantHear', getSettings().lang)); await localFailsafe(); return; }
    setHeard(true);
    patchAll({ thinking: true });
    try {
      const t = await transcribe(id, res.blob, res.mime, res.durationMs);
      if (!valid(gen)) return;
      if (t.empty || !t.transcript.trim()) { setHeard(false); setNotice(tr('cantHear', getSettings().lang)); await localFailsafe(); return; }
      const before = turnNoRef.current;
      const submittedGen = genRef.current + 1;
      await submit(t.transcript, 'voice', res.durationMs / 1000);
      if (!valid(submittedGen)) return;
      if (body && turnNoRef.current > before) void postBody(id, turnNoRef.current, body).catch(() => {});
    } catch {
      if (!valid(gen)) return;
      setHeard(false);
      await localFailsafe();
    }
  }, [id, localFailsafe, patchAll, submit]);

  const submitTyped = async () => {
    const text = typed.trim();
    if (!active.current || !text || phaseRef.current === 'processing' || phaseRef.current === 'recording') return;
    setTyped('');
    typeRef.current?.focus();
    barge();
    const gen = genRef.current;
    setPhaseBoth('processing');
    await unlockAudio();
    if (!valid(gen)) return;
    await submit(text, 'typed', Math.max(2, text.split(/\s+/).length * 0.4));
  };

  // keyboard
  const act = useRef<{ redo: () => void; end: () => void; reveal: () => void; newLesson: () => void; chorusOnly: () => void; script: (n: number) => void }>({
    redo: () => {}, end: () => {}, reveal: () => {}, newLesson: () => {}, chorusOnly: () => {}, script: () => {},
  });
  useEffect(() => {
    const typingInField = (e: KeyboardEvent) => ['TEXTAREA', 'INPUT'].includes((e.target as HTMLElement)?.tagName);
    const toggleRec = () => (phaseRef.current === 'recording' ? void stopRec(false) : void startRec());
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Escape' || e.code === 'F5') return;
      if (needTap || typingInField(e)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (e.repeat || spaceDown.current) return;
        spaceDown.current = true;
        if (demo || getSettings().tap || standupRef.current) toggleRec(); else void startRec();
      } else if ((demo || standupRef.current) && e.code === 'PageDown') { e.preventDefault(); toggleRec(); }
      else if (demo && e.code === 'PageUp') { e.preventDefault(); act.current.redo(); }
      else if (demo && e.shiftKey && /^Digit[1-4]$/.test(e.code)) { e.preventDefault(); act.current.script(Number(e.code.slice(5))); }
      else if (e.code === 'KeyF') document.fullscreenElement ? void document.exitFullscreen() : void document.documentElement.requestFullscreen?.().catch(() => {});
      else if (demo && e.code === 'KeyN') act.current.newLesson();
      else if (!demo && e.code === 'KeyP') setPlanOpen((x) => !x);
      else if (demo && e.code === 'KeyR') act.current.redo();
      else if (demo && e.code === 'KeyE') act.current.end();
      else if (demo && e.code === 'KeyV') act.current.reveal();
      else if (demo && e.code === 'KeyC') act.current.chorusOnly();
      else if (demo && e.code === 'KeyS') setSubtitles((x) => !x);
      else if (demo && e.code === 'KeyH') setHud((x) => !x);
      else if (demo && e.code === 'KeyQ') { keepMic.current = true; nav('/pitch'); }
      else if (!demo && e.code === 'KeyT') { e.preventDefault(); setTyping((t) => !t); }
      else if (!demo && e.code === 'KeyE' && turnNoRef.current > 0) setConfirmEnd(true);
      else if (!demo && e.code === 'KeyD') setDebugOpen((d) => !d);
      else if (demo && e.code === 'KeyD' && qs.get('debug') === '1') setDebugOpen((d) => !d);
      else if (!demo && e.code === 'KeyS') setSubtitles((x) => !x);
    };
    const up = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      spaceDown.current = false;
      if (!demo && !getSettings().tap && !standupRef.current && phaseRef.current === 'recording') void stopRec(false);
    };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [needTap, demo, qs, nav, startRec, stopRec]);

  // "My plan": closes on Escape, on a click outside it, and as soon as the teacher starts recording or typing
  useEffect(() => {
    if (!planOpen) return;
    if (phase === 'recording' || typing) { setPlanOpen(false); return; }
    const key = (e: KeyboardEvent) => { if (e.code === 'Escape') setPlanOpen(false); };
    const away = (e: PointerEvent) => { if (!(e.target as HTMLElement)?.closest?.('.plan-pill-wrap')) setPlanOpen(false); };
    window.addEventListener('keydown', key); document.addEventListener('pointerdown', away);
    return () => { window.removeEventListener('keydown', key); document.removeEventListener('pointerdown', away); };
  }, [planOpen, phase, typing]);

  // Enter confirms, Escape closes the end-lesson dialog
  useEffect(() => {
    if (!confirmEnd) return;
    const f = (e: KeyboardEvent) => { if (e.code === 'Enter') void finish(); };
    window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmEnd]);

  // stage: hide the cursor after 2 s of no movement
  useEffect(() => {
    if (!stage) return;
    let t: ReturnType<typeof setTimeout>;
    const f = () => { setHideCursor(false); clearTimeout(t); t = setTimeout(() => setHideCursor(true), 2000); };
    f(); window.addEventListener('mousemove', f);
    return () => { clearTimeout(t); window.removeEventListener('mousemove', f); };
  }, [stage]);

  // ---------- stand-up mode ----------
  // body features feed the turn's numbers, the in-frame dot and at most one quiet nudge per turn
  useEffect(() => {
    if (!standup) return;
    let shown = false, streak = 0;
    return onFrame((f) => {
      if (!active.current) return;
      collector.current.add(f.t, f.live);
      if (f.raw.inFrame !== shown) { if (++streak >= 4) { shown = f.raw.inFrame; streak = 0; setInFrame(shown); } } else streak = 0;
      if (phaseRef.current !== 'recording' || nudged.current || !nudgesOnRef.current) return;
      const k: Nudge | null = f.live.backTurnedOn ? 'back' : f.live.readingOn ? 'notes' : f.live.handsHiddenOn ? 'pockets' : null;
      if (!k) return;
      nudged.current = true;
      setNudge(k); clearTimeout(nudgeTimer.current);
      nudgeTimer.current = later(() => setNudge(null), 3000);
    });
  }, [standup]);
  useEffect(() => { if (standup && cam.status === 'error') setNotice(tr('camStopped', getSettings().lang)); }, [standup, cam.status]);
  // hands-free: the mic level starts and stops turns; paused while the class talks, while waiting for it, and while typing or in a dialog
  const gateBlock = useRef(false);
  gateBlock.current = typing || confirmEnd || needTap || !!micErr || planOpen || ending;
  useEffect(() => {
    if (!standup || !sp.handsFree || !ready || needTap) return;
    const stream = getMic();
    if (!stream) return;
    const g = new VoiceGate(stream, {
      canListen: () => phaseRef.current === 'idle' && !gateBlock.current,
      recording: () => phaseRef.current === 'recording',
      onStart: () => void startRec(),
      onStop: () => { const r = recRef.current; if (r) void stopRec(r.elapsedMs - HANDS_FREE.stopMs < HANDS_FREE.minMs); },
    });
    return () => g.dispose();
  }, [standup, sp.handsFree, ready, needTap, micErr, startRec, stopRec]);

  useEffect(() => {
    mounted.current = true; active.current = true;
    return () => {
    mounted.current = false; active.current = false;
    clearTimers();
    clearTimeout(nudgeTimer.current); stopCamera();
    genRef.current++; abortRef.current(); fadeOutAll(50); recRef.current?.dispose(); if (!keepMic.current) closeMic(); wake.current?.release().catch(() => {});
    if (recTimer.current) clearInterval(recTimer.current);
    };
  }, []);

  // ---------- actions ----------
  const redo = async () => {
    if (!active.current || phaseRef.current !== 'idle' || turnNoRef.current === 0) return;
    barge();
    const gen = genRef.current;
    setPhaseBoth('processing');
    try {
      const r = await redoTurn(id);
      if (!valid(gen)) return;
      setLv(r.levels); setTurnNo(r.turnNo); turnNoRef.current = r.turnNo;
      if (isLarge(settingRef.current)) {
        const l = await getLesson(id).catch(() => null);
        if (!valid(gen)) return;
        if (l) setBackRow(l.backRow ?? 0);
      }
      tallyHist.current.length = r.turnNo + 1; lastRaisedTurn.current = -2;
      setTally(tallyHist.current[r.turnNo] ?? 0);
      setTranscript(''); setMarks([]); setViews({});
      setNotice(tr('redoDone', getSettings().lang));
      later(() => setNotice(null), 1500);
    } catch { /* keep state */ } finally { if (valid(gen)) setPhaseBoth('idle'); }
  };
  const finish = async () => {
    if (!active.current) return;
    active.current = false;
    setEnding(true); barge();
    recRef.current?.cancel(); recRef.current = null;
    if (recTimer.current) clearInterval(recTimer.current);
    const gen = genRef.current;
    try { await endLesson(id); } catch { /* score route builds it */ }
    if (!mounted.current || genRef.current !== gen) return;
    nav(`/lesson/${id}/score`);
  };
  const tapStart = async () => {
    if (!active.current) return;
    const gen = genRef.current;
    await unlockAudio();
    if (!valid(gen)) return;
    void preloadLesson(settings.topicId, settings.lang, settings.title);
    await requestMic();
    if (!valid(gen)) return;
    setNeedTap(false);
    sfx.bell();
  };
  const typeInstead = () => { setNeedTap(false); setTyping(true); void unlockAudio(); };

  // stage: N goes back to the plan page with the mic and audio kept open
  const newLesson = () => { keepMic.current = true; nav('/plan/lib-fractions?demo=1'); };
  const chorusOnly = async () => {
    if (!active.current || phaseRef.current !== 'idle') return;
    const gen = ++genRef.current;
    setPhaseBoth('processing');
    const ui = makeUI(gen);
    await unlockAudio();
    if (!valid(gen)) return;
    await playChorus(getSettings().lang, getSettings().title, ui, settingRef.current);
    if (!valid(gen)) return;
  };
  const sendScript = async (n: number) => {
    const line = demoScript.find((l) => l.n === n);
    if (!active.current || !line || phaseRef.current === 'processing' || phaseRef.current === 'recording') return;
    barge();
    const gen = genRef.current;
    setPhaseBoth('processing');
    await unlockAudio();
    if (!valid(gen)) return;
    const text = line[getSettings().lang];
    await submit(text, 'typed', Math.max(2, text.split(/\s+/).length * 0.4));
  };
  const revealNow = async () => {
    if (!active.current || turnNoRef.current === 0) return;
    active.current = false;
    setEnding(true); barge();
    recRef.current?.cancel(); recRef.current = null;
    if (recTimer.current) clearInterval(recTimer.current);
    const gen = genRef.current;
    try { await endLesson(id); } catch { /* score route builds it */ }
    if (!mounted.current || genRef.current !== gen) return;
    nav(`/lesson/${id}/score?reveal=1`);
  };
  act.current = { redo: () => void redo(), end: () => { if (turnNoRef.current > 0) setConfirmEnd(true); }, reveal: () => void revealNow(), newLesson: () => void newLesson(), chorusOnly: () => void chorusOnly(), script: (n) => void sendScript(n) };

  // outside click closes popover
  useEffect(() => {
    if (!popKid) return;
    const f = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest('.kid')) setPopKid(null); };
    window.addEventListener('click', f);
    return () => window.removeEventListener('click', f);
  }, [popKid]);

  if (!ready) return <div className="classroom" />;

  const counted = KID_IDS.filter((k) => k !== 'yazan');
  const reached = counted.filter((k) => levels[k] === 2).length;
  const micLabel =
    phase === 'recording' ? (cancelling ? tr('releaseCancel', lang) : recElapsed > 35000 ? tr('tenLeft', lang) : tr('listening', lang))
    : phase === 'processing' ? tr('thinking', lang)
    : standup ? tr(sp.handsFree ? 'standupIdleFree' : 'standupIdleToggle', lang)
    : settings.tap ? tr('holdTap', lang) : tr('hold', lang);
  const stamp = lang === 'ar' ? 'الصف فهم!' : 'Class got it!';

  return (
    <SettingProvider value={setting}>
    <main className={`classroom ${stage ? 'stage' : ''} ${standup ? 'standup' : ''} ${hideCursor ? 'stage-hide-cursor' : ''} ${typing ? 'typing' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <header className="topbar">
        <a className="logo" href="/" onClick={(e) => { e.preventDefault(); if (turnNo > 0) setConfirmEnd(true); else nav('/'); }}>{lang === 'ar' ? 'سبّورة' : 'Sabboura'}</a>
        <div className="center">
          <span>{tr('turn', lang)} <bdi dir="ltr" className="num">{fmtNum(turnNo, lang)}</bdi></span>
          <span className="meter-dots" aria-label={`${reached}/4`} title={tr('meterHint', lang)}>{counted.map((k) => <i key={k} className={levels[k] === 2 ? 'on' : ''} />)}</span>
          <span className="meter-txt" title={tr('meterHint', lang)}>{tr('reachedMeter', lang)} <bdi dir="ltr" className="num">{reached}</bdi> {tr('ofN', lang)} <bdi dir="ltr" className="num">4</bdi></span>
          {!stage && (
            <span className="plan-pill-wrap">
              <button className="chip plan-pill" aria-expanded={planOpen} onClick={() => setPlanOpen((x) => !x)}>{tr('myPlan', lang)}</button>
              {planOpen && (
                <div className="plan-pop" role="dialog" aria-label={tr('myPlan', lang)}>
                  {plan && (plan.goal || plan.steps.length) ? (
                    <>
                      {plan.goal && <p className="goal">{plan.goal}</p>}
                      <ol>{plan.steps.map((st, i) => <li key={i}><span className="tagpill">{tr(`kind_${st.kind}` as Key, lang)}</span> {st.text}</li>)}</ol>
                    </>
                  ) : <p>{tr('noPlan', lang)}</p>}
                </div>
              )}
            </span>
          )}
        </div>
        <button className="btn btn-outline" onClick={() => setConfirmEnd(true)} disabled={turnNo === 0 || ending}><StopIcon size={18} /> <span className="txt">{tr('endLesson', lang)}</span></button>
      </header>

      <section className="wall">
        <Board lang={lang} topic={topic.title[lang]} transcript={transcript} marks={marks} tally={tally} hint={turnNo === 0 && phase === 'idle'} heard={heard}
          levelBars={phase === 'recording' ? level : null}>
          {chorus && (
            <>
              <div className={`chorus-bubble ${chorus.phase === 'hide' ? 'out' : ''}`}>{chorus.text}</div>
              {chorus.phase === 'stamp' && <div className="stamp-class">{stamp}</div>}
            </>
          )}
        </Board>
        <Ledge lang={lang} cap={caption} subtitles={subtitles} />
        {!stage && isLarge(setting) && (
          <div className={`back-row lv${backRow}`} role="status" aria-live="polite">
            <span className="br-label">{trf('backRowLabel', lang, { size: setting.size })}</span>
            <span className="br-pips" aria-hidden="true">{[0, 1, 2, 3].map((i) => <i key={i} className={i <= backRow ? 'on' : ''} />)}</span>
            <b className="br-state">{BACK_ROW_LABEL[Math.min(3, Math.max(0, backRow))][lang]}</b>
          </div>
        )}
      </section>

      <section className="class-row">
        {KID_IDS.map((k) => (
          <KidCard key={k} kid={k} level={levels[k] as Level} lang={lang} view={views[k] ?? {}} onBadge={() => setPopKid(popKid === k ? null : k)} onCallOn={() => void callOn(k)}
            popover={popKid === k && (
              <div className="popover" role="dialog">
                <b>{tr('whatMoved', lang)} {kidName(k, lang, setting)}</b>
                <div className="q">{evidRef.current[k] ? <>«{evidRef.current[k]!.text}»</> : tr('nothingYet', lang)}</div>
              </div>
            )} />
        ))}
      </section>

      <footer className={`dock ${typing ? 'typing' : ''}`}>
        <div className="side">
          <button className="btn btn-redo" onClick={redo} disabled={phase !== 'idle' || turnNo === 0}><RotateCcw size={18} /> <span className="txt">{tr('redo', lang)}</span></button>
        </div>
        <div className="mic-wrap">
          <MicButton mode={settings.tap || demo || standup ? 'tap' : 'hold'} recording={phase === 'recording'} cancelling={cancelling} elapsedMs={recElapsed} level={level}
            disabled={phase === 'processing'} label={micLabel} onStart={() => void startRec()} onStop={(c) => void stopRec(c)} onCancelHover={setCancelling} />
          <div className={`mic-label ${phase === 'recording' ? 'rec' : ''}`}>{micLabel}</div>
          {standup
            ? <label className="tap-switch" title={tr('handsFreeHint', lang)}><input type="checkbox" role="switch" checked={sp.handsFree} onChange={(e) => setStandup({ handsFree: e.target.checked })} /> <span>{tr('handsFree', lang)}</span></label>
            : <label className="tap-switch" title={tr('tapModeHint', lang)}><input type="checkbox" checked={settings.tap} onChange={(e) => setSettings({ tap: e.target.checked })} /> <span>{tr('tapMode', lang)}</span></label>}
        </div>
        {typing ? (
          <div className="typebox">
            <textarea ref={typeRef} autoFocus rows={2} value={typed} placeholder={tr('typePlaceholder', lang)} onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void submitTyped(); }
                else if (e.key === 'Escape') { e.preventDefault(); setTyping(false); }
              }} />
            <button className="btn" onClick={() => void submitTyped()} disabled={!typed.trim()}><Send size={18} /> {tr('send', lang)}</button>
            <button className="btn btn-outline" onClick={() => setTyping(false)} aria-label={tr('close', lang)}><X size={18} /></button>
          </div>
        ) : (
          <div className="side end">
            {standup
              ? <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <SelfTile lang={lang} inFrame={inFrame} nudge={nudge} nudgesOn={nudgesOn} calm={settings.calm} onNudges={(on) => setStandup({ nudges: on })} />
                  <button className="btn" style={{ padding: '6px 8px', fontSize: '.8rem' }} onClick={() => setTyping(true)}><Keyboard size={16} />{tr('typeInsteadShort', lang)}</button>
                </div>
              : <button className="btn btn-type" onClick={() => setTyping(true)}><Keyboard size={18} /> <span className="txt">{tr('typeBtn', lang)}</span></button>}
          </div>
        )}
      </footer>
      {notice && <div className="notice" role="status">{notice}</div>}
      {micErr && !needTap && (
        <div className="mic-card" role="status">
          <b>{tr(micErr as 'micDenied', lang)}</b>
          <div className="actions" style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button className="btn" onClick={() => void requestMic()}>{tr('tryAgain', lang)}</button>
            <button className="btn btn-outline" onClick={() => setMicErr(null)}>{tr('typeInsteadShort', lang)}</button>
          </div>
        </div>
      )}

      {needTap && (
        <div className="mic-card tap-start" role="dialog" aria-modal="true">
          <b>{tr('tapStartTitle', lang)}</b>
          <p>{tr('tapStartBody', lang)}</p>
          {micErr && <p role="alert">{tr(micErr as 'micDenied', lang)}</p>}
          <div className="actions" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" style={{ fontSize: '1.1rem' }} onClick={() => void tapStart()}>{tr('micAllow', lang)}</button>
            <button className="btn btn-outline" onClick={typeInstead}>{tr('typeInstead', lang)}</button>
          </div>
        </div>
      )}

      {confirmEnd && (
        <div className="modal-back" onClick={() => setConfirmEnd(false)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>{tr('endConfirm', lang)}</h2>
            <div className="actions">
              <button className="btn btn-primary" style={{ fontSize: '1.1rem' }} onClick={() => void finish()} disabled={ending}>{tr('endYes', lang)}</button>
              <button className="btn" onClick={() => setConfirmEnd(false)}>{tr('cancel', lang)}</button>
            </div>
          </div>
        </div>
      )}
      {hud && (
        <div className="hud" dir="ltr">
          <div>mic: {micName()} · in {Math.round(inLevel * 100)}%</div>
          <div>models: {lastTimings ? ['judge', 'lines', 'tts'].map((k) => `${k} ${(lastTimings.models as Record<string, string | null>)[k] ? 'OK' : '✗'}`).join(' · ') : '-'}</div>
          <div>{lastTimings ? `judge ${Math.round(lastTimings.judgeMs)} · lines ${Math.round(lastTimings.linesMs)} · total ${Math.round(lastTimings.totalMs)} ms` : 'no turn yet'}</div>
        </div>
      )}
      {debugOpen && <DebugPanel lessonId={id} timings={lastTimings} log={eventLog} onClose={() => setDebugOpen(false)} />}
      <span className="sr-only" aria-live="polite">{caption?.text}</span>
    </main>
    </SettingProvider>
  );
}
