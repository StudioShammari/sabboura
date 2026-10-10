import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import confetti from 'canvas-confetti';
import { Keyboard, RotateCcw, Square as StopIcon, Send, X } from 'lucide-react';
import { KID_IDS, demoScript, kidById, topicById, type KidId, type Level, type Levels } from '@shared/data';
import type { KidChange, LineEvent, StateEvent, TimingsEvent } from '@shared/schemas';
import { Board, type Mark } from '@/components/Board';
import { KidCard, type CardView } from '@/components/KidCard';
import { Ledge, type Caption } from '@/components/Ledge';
import { MicButton } from '@/components/MicButton';
import { DebugPanel } from '@/components/DebugPanel';
import { fmtNum, useT, tr } from '@/i18n';
import { createLesson, endLesson, getLesson, redoTurn, transcribe, warmup } from '@/lib/api';
import { closeMic, fadeOutAll, getCtx, getMic, micName, openMic, preloadLesson, unlockAudio } from '@/lib/audio';
import { Recorder } from '@/lib/recorder';
import { sfx } from '@/lib/sfx';
import { deviceId, getSettings, setSettings, useSettings } from '@/lib/store';
import { playChorus, playLocalFailsafe, playQuestion, playTurn, type TurnUI } from '@/lib/turnPlayer';
import { MeetClass, type StageResult } from '@/components/MeetClass';
import { Decor } from '@/components/Decor';

type Phase = 'idle' | 'recording' | 'processing' | 'playing';
type Evidence = { turn: number; text: string };

export default function Classroom() {
  const { id = '' } = useParams<{ id: string }>();
  const [, nav] = useLocation();
  const { lang } = useT();
  const settings = useSettings();
  const qs = useMemo(() => new URLSearchParams(location.search), []);
  const demo = qs.get('demo') === '1';

  const [ready, setReady] = useState(false);
  const [meet, setMeet] = useState(true);
  const [levels, setLevels] = useState<Levels>({ omar: 0, lina: 0, sara: 0, khaled: 0, yazan: 0 });
  const [turnNo, setTurnNo] = useState(0);
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
  const [popKid, setPopKid] = useState<KidId | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [ending, setEnding] = useState(false);
  const [stage] = useState(demo);
  const [hud, setHud] = useState(false);
  const [stageRes, setStageRes] = useState<StageResult | null>(null);
  const [hideCursor, setHideCursor] = useState(false);
  const [inLevel, setInLevel] = useState(0);
  const [subtitles, setSubtitles] = useState(false);
  const [debugOpen, setDebugOpen] = useState(qs.get('debug') === '1');
  const [lastTimings, setLastTimings] = useState<TimingsEvent | null>(null);
  const [eventLog, setEventLog] = useState<string[]>([]);
  const [questions, setQuestions] = useState(0);

  const genRef = useRef(0);
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
      if (!alive) return;
      setSettings({ lang: l.lesson.language, title: l.lesson.teacherTitle, topicId: l.lesson.topicId });
      setLv(l.levels); setTurnNo(l.turnNo); turnNoRef.current = l.turnNo;
      const last = l.turns[l.turns.length - 1];
      if (last) setTranscript(last.transcript);
      setMeet(l.turnNo === 0 && !(demo && getMic()));
      setReady(true);
    }).catch(() => nav('/'));
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
        setTimeout(() => patchView(kid, { delta: null, hop: false, shake: false }), 1100);
        if (ch.change > 0) { ch.to === 2 ? sfx.gotIt() : sfx.badgeUp(); if (ch.to === 2) burst(kid); }
      }
    };
    delay ? setTimeout(run, delay) : run();
  }, [patchView]);

  const flushPending = useCallback((kid: KidId) => {
    const p = pending.current[kid];
    if (!p) return;
    clearTimeout(p.timer);
    delete pending.current[kid];
    applyMove(kid, p.ch);
  }, [applyMove]);

  // ---------- turn ui ----------
  const makeUI = useCallback((gen: number): TurnUI => ({
    stale: () => genRef.current !== gen,
    onState: (ev: StateEvent) => {
      if (genRef.current !== gen) return;
      setTurnNo(ev.turnNo); turnNoRef.current = ev.turnNo;
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
      if (ev.check === 'question') setQuestions((q) => q + 1);
      // apply moves (aha speakers wait for their line)
      for (const k of KID_IDS) {
        const ch = ev.levels[k];
        if (ch.change === 0 && ch.to === levelsRef.current[k]) continue;
        if (speakers.get(k) === 'aha' && ch.change > 0) {
          pending.current[k] = { ch, timer: setTimeout(() => flushPending(k), 2500) };
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
      if (genRef.current !== gen) return;
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
      if (genRef.current !== gen) return;
      patchAll({ speaking: false, dim: false });
      void kid;
    },
    onFirstOutput: () => {
      if (genRef.current !== gen) return;
      if (unlockTimer.current) clearTimeout(unlockTimer.current);
      if (phaseRef.current === 'processing') setPhaseBoth('playing');
    },
    onChorus: (text, ph) => {
      if (genRef.current !== gen) return;
      setChorus({ text, phase: ph });
      if (ph === 'show') { patchAll({ thinking: false, hand: false, spotlight: true }); setCaption(null); }
      if (ph === 'stamp') sfx.stamp();
      if (ph === 'hide') { patchAll({ spotlight: false }); setTimeout(() => setChorus(null), 300); }
    },
    onTimings: (t) => setLastTimings(t),
    onEvent: (name, data) => setEventLog((l) => [...l.slice(-60), `${name} ${JSON.stringify(data).slice(0, 140)}`]),
    onDone: () => {
      if (genRef.current !== gen) return;
      for (const k of KID_IDS) flushPending(k);
      patchAll({ thinking: false, hand: false, speaking: false, dim: false });
      setHeard(false);
      setPhaseBoth('idle');
    },
  }), [applyMove, flushPending, patchAll]);

  const submit = useCallback(async (text: string, source: 'voice' | 'typed', seconds: number) => {
    const gen = ++genRef.current;
    setTranscript(text); setMarks([]); setCaption(null); setHeard(source === 'voice');
    setPhaseBoth('processing');
    patchAll({ thinking: true, hand: false, raised: false, speaking: false, dim: false, asked: false });
    if (unlockTimer.current) clearTimeout(unlockTimer.current);
    unlockTimer.current = setTimeout(() => { if (phaseRef.current === 'processing' && genRef.current === gen) setPhaseBoth('playing'); }, 12000);
    await playTurn({ lessonId: id, text, source, seconds, lang: getSettings().lang, title: getSettings().title, ui: makeUI(gen), setAbort: (f) => (abortRef.current = f) });
  }, [id, makeUI, patchAll]);

  const localFailsafe = useCallback(async () => {
    const gen = ++genRef.current;
    setPhaseBoth('processing');
    const ui = makeUI(gen);
    await playLocalFailsafe(getSettings().lang, ui);
    ui.onDone();
  }, [makeUI]);

  // ---------- raised hands ----------
  const callOn = useCallback(async (kid: KidId) => {
    if (phaseRef.current !== 'idle') return;
    const gen = ++genRef.current;
    setPhaseBoth('processing'); setCaption(null); setPopKid(null);
    patchAll({ raised: false, hand: false, speaking: false, dim: false });
    await unlockAudio();
    await playQuestion({ lessonId: id, kid, lang: getSettings().lang, ui: makeUI(gen), setAbort: (f) => (abortRef.current = f) });
  }, [id, makeUI, patchAll]);

  const anyRaised = KID_IDS.some((k) => views[k]?.raised);
  useEffect(() => {
    if (!ready || meet || demo || phase !== 'idle') return;
    if (anyRaised) {
      const t = setTimeout(() => patchAll({ raised: false }), 15000);
      return () => clearTimeout(t);
    }
    // Never before the teacher has spoken, and at most one hand every other turn.
    if (turnNo < 1 || turnNo - lastRaisedTurn.current < 2) return;
    const t = setTimeout(() => {
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
  }, [ready, meet, demo, phase, anyRaised, turnNo, patchAll, patchView]);

  // ---------- mic ----------
  const micError = (e: unknown) => {
    const n = (e as DOMException)?.name;
    setMicErr(n === 'NotAllowedError' || n === 'SecurityError' ? 'micDenied' : n === 'NotFoundError' ? 'micNone' : n === 'NotReadableError' ? 'micBusy' : 'micOther');
  };
  const requestMic = useCallback(async () => {
    try { await openMic(); setMicErr(null); return true; } catch (e) { micError(e); return false; }
  }, []);

  const barge = () => {
    genRef.current++;
    abortRef.current();
    fadeOutAll(150);
    patchAll({ speaking: false, dim: false, thinking: false, hand: false, raised: false });
    setChorus(null); setCaption(null);
    for (const k of KID_IDS) flushPending(k);
  };

  const startRec = useCallback(async () => {
    if (startingRec.current || phaseRef.current === 'recording') return;
    if (phaseRef.current === 'processing') return;
    startingRec.current = true;
    try {
      let stream = getMic();
      if (!stream) { if (!(await requestMic())) return; stream = getMic(); if (!stream) return; }
      await unlockAudio();
      barge();
      setNotice(null); setCancelling(false); setHeard(false);
      const rec = new Recorder(stream);
      rec.onLevel = (i) => { setLevel(i.level); setInLevel(i.level); };
      rec.start();
      recRef.current = rec;
      sfx.micOn();
      setPhaseBoth('recording');
      setRecElapsed(0);
      recTimer.current = setInterval(() => {
        const e = rec.elapsedMs;
        setRecElapsed(e);
        if (e >= 45000) void stopRec(false);
      }, 100);
    } catch (e) { micError(e); } finally { startingRec.current = false; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestMic]);

  const stopRec = useCallback(async (cancel: boolean) => {
    const rec = recRef.current;
    if (!rec || phaseRef.current !== 'recording') return;
    recRef.current = null;
    if (recTimer.current) clearInterval(recTimer.current);
    setCancelling(false); setLevel(0); setRecElapsed(0);
    sfx.micOff();
    if (cancel) { rec.cancel(); setPhaseBoth('idle'); return; }
    setPhaseBoth('processing');
    const res = await rec.stop(250);
    rec.dispose();
    if (!res || res.durationMs < 350) { setNotice(tr('holdShort', getSettings().lang)); setPhaseBoth('idle'); return; }
    if (res.voicedMs < 300) { setNotice(tr('cantHear', getSettings().lang)); await localFailsafe(); return; }
    setHeard(true);
    patchAll({ thinking: true });
    try {
      const t = await transcribe(id, res.blob, res.mime, res.durationMs);
      if (t.empty || !t.transcript.trim()) { setHeard(false); setNotice(tr('cantHear', getSettings().lang)); await localFailsafe(); return; }
      await submit(t.transcript, 'voice', res.durationMs / 1000);
    } catch {
      setHeard(false);
      await localFailsafe();
    }
  }, [id, localFailsafe, patchAll, submit]);

  const submitTyped = async () => {
    const text = typed.trim();
    if (!text || phaseRef.current === 'processing' || phaseRef.current === 'recording') return;
    setTyped(''); setTyping(false);
    barge();
    await unlockAudio();
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
      if (meet || typingInField(e)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (e.repeat || spaceDown.current) return;
        spaceDown.current = true;
        if (demo || getSettings().tap) toggleRec(); else void startRec();
      } else if (demo && e.code === 'PageDown') { e.preventDefault(); toggleRec(); }
      else if (demo && e.code === 'PageUp') { e.preventDefault(); act.current.redo(); }
      else if (demo && e.shiftKey && /^Digit[1-4]$/.test(e.code)) { e.preventDefault(); act.current.script(Number(e.code.slice(5))); }
      else if (e.code === 'KeyF') document.fullscreenElement ? void document.exitFullscreen() : void document.documentElement.requestFullscreen?.().catch(() => {});
      else if (demo && e.code === 'KeyN') act.current.newLesson();
      else if (demo && e.code === 'KeyR') act.current.redo();
      else if (demo && e.code === 'KeyE') act.current.end();
      else if (demo && e.code === 'KeyV') act.current.reveal();
      else if (demo && e.code === 'KeyC') act.current.chorusOnly();
      else if (demo && e.code === 'KeyS') setSubtitles((x) => !x);
      else if (demo && e.code === 'KeyH') setHud((x) => !x);
      else if (demo && e.code === 'KeyQ') { keepMic.current = true; nav('/pitch'); }
      else if (!demo && e.code === 'KeyT') setTyping((t) => !t);
      else if (!demo && e.code === 'KeyE' && turnNoRef.current > 0) setConfirmEnd(true);
      else if (!demo && e.code === 'KeyD') setDebugOpen((d) => !d);
      else if (demo && e.code === 'KeyD' && qs.get('debug') === '1') setDebugOpen((d) => !d);
      else if (!demo && e.code === 'KeyS') setSubtitles((x) => !x);
    };
    const up = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      spaceDown.current = false;
      if (!demo && !getSettings().tap && phaseRef.current === 'recording') void stopRec(false);
    };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, [meet, demo, qs, nav, startRec, stopRec]);

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

  // meet-the-class splash: about 3 s when audio is already unlocked from the home page
  useEffect(() => {
    if (!meet || demo || !ready) return;
    if (getCtx().state !== 'running') return;
    const t = setTimeout(() => setMeet(false), 3000);
    return () => clearTimeout(t);
  }, [meet, demo, ready]);

  useEffect(() => () => {
    genRef.current++; abortRef.current(); fadeOutAll(50); recRef.current?.dispose(); if (!keepMic.current) closeMic(); wake.current?.release().catch(() => {});
    if (recTimer.current) clearInterval(recTimer.current);
  }, []);

  // ---------- actions ----------
  const redo = async () => {
    if (phaseRef.current !== 'idle' || turnNoRef.current === 0) return;
    barge();
    try {
      const r = await redoTurn(id);
      setLv(r.levels); setTurnNo(r.turnNo); turnNoRef.current = r.turnNo;
      tallyHist.current.length = r.turnNo + 1; lastRaisedTurn.current = -2;
      setTally(tallyHist.current[r.turnNo] ?? 0);
      setTranscript(''); setMarks([]); setViews({});
      setNotice(tr('redo', getSettings().lang));
      setTimeout(() => setNotice(null), 1500);
    } catch { /* keep state */ }
  };
  const finish = async () => {
    setEnding(true); barge();
    try { await endLesson(id); } catch { /* score route builds it */ }
    nav(`/lesson/${id}/score`);
  };
  const begin = async () => {
    if (demo) {
      const r: StageResult = { mic: null, audio: null, ai: null, full: null, wake: null };
      const upd = (k: keyof StageResult, v: boolean) => { r[k] = v; setStageRes({ ...r }); };
      setStageRes({ ...r });
      try { await document.documentElement.requestFullscreen(); upd('full', true); } catch { upd('full', false); }
      try {
        wake.current = await navigator.wakeLock.request('screen'); upd('wake', true);
        document.addEventListener('visibilitychange', async () => { if (document.visibilityState === 'visible') try { wake.current = await navigator.wakeLock.request('screen'); } catch { /* ignore */ } });
      } catch { upd('wake', false); }
      upd('audio', await unlockAudio());
      void preloadLesson(settings.topicId, settings.lang, settings.title);
      upd('mic', await requestMic());
      try { const w = await warmup(); upd('ai', !!w.ok); } catch { upd('ai', false); }
      setTimeout(() => setMeet(false), 1800);
      return;
    }
    await unlockAudio();
    void preloadLesson(settings.topicId, settings.lang, settings.title);
    await requestMic();
    setMeet(false);
    sfx.bell();
  };

  const newLesson = async () => {
    const st = getSettings();
    keepMic.current = true;
    try {
      const r = await createLesson({ topicId: st.topicId, language: st.lang, teacherTitle: st.title, deviceId: deviceId() });
      nav(`/lesson/${r.lessonId}${demo ? '?demo=1' : ''}`);
    } catch { keepMic.current = false; }
  };
  const chorusOnly = async () => {
    if (phaseRef.current !== 'idle') return;
    const gen = ++genRef.current;
    const ui = makeUI(gen);
    await unlockAudio();
    await playChorus(getSettings().lang, getSettings().title, ui);
  };
  const sendScript = async (n: number) => {
    const line = demoScript.find((l) => l.n === n);
    if (!line || phaseRef.current === 'processing' || phaseRef.current === 'recording') return;
    barge();
    await unlockAudio();
    const text = line[getSettings().lang];
    await submit(text, 'typed', Math.max(2, text.split(/\s+/).length * 0.4));
  };
  const revealNow = async () => {
    if (turnNoRef.current === 0) return;
    setEnding(true); barge();
    try { await endLesson(id); } catch { /* score route builds it */ }
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

  const reached = KID_IDS.filter((k) => levels[k] === 2).length;
  const micLabel =
    phase === 'recording' ? (cancelling ? tr('releaseCancel', lang) : recElapsed > 35000 ? tr('tenLeft', lang) : tr('listening', lang))
    : phase === 'processing' ? tr('thinking', lang)
    : settings.tap ? tr('holdTap', lang) : tr('hold', lang);
  const goals = [
    { k: 'goalReach', met: reached === 5 },
    { k: 'goalQs', met: tally + questions >= 2 },
    { k: 'goalLina', met: levels.lina >= 1 },
    { k: 'goalYazan', met: levels.yazan === 2 },
  ] as const;
  const stamp = lang === 'ar' ? 'الصف فهم!' : 'Class got it!';

  return (
    <main className={`classroom ${stage ? 'stage' : ''} ${hideCursor ? 'stage-hide-cursor' : ''}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <Decor />
      <header className="topbar">
        <a className="logo" href="/" onClick={(e) => { e.preventDefault(); if (turnNo > 0) setConfirmEnd(true); else nav('/'); }}>{lang === 'ar' ? 'سبّورة' : 'Sabboura'}</a>
        <div className="center">
          <span>{tr('turn', lang)} <bdi dir="ltr" className="num">{fmtNum(turnNo, lang)}</bdi></span>
          <span className="meter-dots" aria-label={`${reached}/5`}>{KID_IDS.map((k) => <i key={k} className={levels[k] === 2 ? 'on' : ''} />)}</span>
          <span className="meter-txt">{tr('reachedMeter', lang)} <bdi dir="ltr" className="num">{reached}</bdi> {tr('ofN', lang)} <bdi dir="ltr" className="num">5</bdi></span>
          <span className="goals">{goals.map((g) => <span key={g.k} className={`chip ${g.met ? 'met' : ''}`}>{g.met ? '✓ ' : ''}{tr(g.k, lang)}</span>)}</span>
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
      </section>

      <section className="class-row">
        {KID_IDS.map((k) => (
          <KidCard key={k} kid={k} level={levels[k] as Level} lang={lang} view={views[k] ?? {}} onBadge={() => setPopKid(popKid === k ? null : k)} onCallOn={() => void callOn(k)}
            popover={popKid === k && (
              <div className="popover" role="dialog">
                <b>{tr('whatMoved', lang)} {kidById(k).name[lang]}</b>
                <div className="q">{evidRef.current[k] ? <>«{evidRef.current[k]!.text}»</> : tr('nothingYet', lang)}</div>
              </div>
            )} />
        ))}
      </section>

      <footer className="dock">
        <div className="side">
          <button className="btn btn-redo" onClick={redo} disabled={phase !== 'idle' || turnNo === 0}><RotateCcw size={18} /> <span className="txt">{tr('redo', lang)}</span></button>
        </div>
        <div className="mic-wrap">
          <MicButton mode={settings.tap || demo ? 'tap' : 'hold'} recording={phase === 'recording'} cancelling={cancelling} elapsedMs={recElapsed} level={level}
            disabled={phase === 'processing'} label={micLabel} onStart={() => void startRec()} onStop={(c) => void stopRec(c)} onCancelHover={setCancelling} />
          <div className={`mic-label ${phase === 'recording' ? 'rec' : ''}`}>{micLabel}</div>
        </div>
        <div className="side end">
          <button className="btn btn-type" onClick={() => setTyping((t) => !t)}><Keyboard size={18} /> <span className="txt">{tr('typeBtn', lang)}</span></button>
          <label className="tap-switch"><input type="checkbox" checked={settings.tap} onChange={(e) => setSettings({ tap: e.target.checked })} /> <span className="txt">{tr('tapMode', lang)}</span></label>
        </div>
      </footer>

      {typing && (
        <div className="typebox">
          <textarea autoFocus rows={2} value={typed} placeholder={tr('typePlaceholder', lang)} onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void submitTyped(); } }} />
          <button className="btn btn-primary" style={{ fontSize: '1rem', padding: '8px 20px' }} onClick={() => void submitTyped()} disabled={!typed.trim()}><Send size={18} /> {tr('send', lang)}</button>
          <button className="btn btn-outline" onClick={() => setTyping(false)} aria-label={tr('close', lang)}><X size={18} /></button>
        </div>
      )}
      {notice && !typing && <div className="notice" role="status">{notice}</div>}
      {micErr && !meet && (
        <div className="mic-card" role="alert">
          <b>{tr(micErr as 'micDenied', lang)}</b>
          <div className="actions" style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button className="btn" onClick={() => void requestMic()}>{tr('tryAgain', lang)}</button>
            <button className="btn btn-outline" onClick={() => { setMicErr(null); setTyping(true); }}>{tr('typeInsteadShort', lang)}</button>
          </div>
        </div>
      )}

      {meet && <MeetClass lang={lang} title={settings.title} topicId={settings.topicId} levels={levels} micErr={micErr} onStart={begin} onType={() => { setMeet(false); setTyping(true); void unlockAudio(); }} stageCheck={demo} stageResult={stageRes} />}

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
  );
}
