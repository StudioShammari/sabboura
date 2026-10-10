import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { KID_IDS, registerTopic, topics, type KidId } from '@shared/data';
import { DEFAULT_SETTING, GROUP_LABEL, PRESETS, PRESET_IDS, SIZE_MAX, SIZE_MIN, kidName, normalizeSetting, settingLabel, swapNames, type ClassSetting, type Group } from '@shared/setting';
import type { PackInfo } from '@shared/pack';
import { PLAN_KINDS, MAX_STEPS, defaultPlan, defaultsFor, planTips, type Plan, type PlanKind } from '@shared/plan';
import { KidAvatar } from '@/components/KidAvatar';
import { Stepper } from '@/components/Stepper';
import { StageReady, type StageResult } from '@/components/StageReady';
import { personaFor, tr, trf, useT, type Key } from '@/i18n';
import { SettingProvider, getClassSetting, setClassSetting, useStoredSetting } from '@/lib/classSetting';
import { createLesson, getPack, getPlanCheck, warmup } from '@/lib/api';
import { lastPackInput, makePack } from '@/lib/packs';
import { loadManifest, openMic, getMic, preloadLesson, unlockAudio } from '@/lib/audio';
import { deviceId, getSettings, lsGet, lsSet, setSettings, useSettings } from '@/lib/store';
import { playChorus } from '@/lib/turnPlayer';
import { CameraSetup } from '@/components/CameraSetup';
import { getCalib, getCamera, setCalib, stopCamera, useCamera } from '@/lib/body/detector';
import { getStandup, setStandup, useStandup } from '@/lib/body/standup';
import { Check } from 'lucide-react';

const getStandupOn = () => getStandup().on;

const storeKey = (packId: string, lang: string) => `sabboura.plan.v1.${packId}.${lang}`;
/** A plan with the kid names of one class swapped for another's. */
const swapPlan = (p: Plan, from: ClassSetting, to: ClassSetting): Plan => ({ goal: swapNames(p.goal, from, to), steps: p.steps.map((x) => ({ ...x, text: swapNames(x.text, from, to) })) });
// a saved plan is kept with the default class's names, so it follows the class setting
function loadPlan(packId: string, lang: string, setting: ClassSetting): Plan | null {
  try {
    const p = JSON.parse(lsGet(storeKey(packId, lang)) ?? 'null');
    if (p && typeof p.goal === 'string' && Array.isArray(p.steps) && p.steps.every((s: any) => PLAN_KINDS.includes(s?.kind) && typeof s.text === 'string')) return swapPlan(p, DEFAULT_SETTING, setting);
  } catch { /* corrupt or blocked */ }
  return null;
}
const savePlan = (packId: string, lang: string, p: Plan, setting: ClassSetting) => lsSet(storeKey(packId, lang), JSON.stringify(swapPlan(p, setting, DEFAULT_SETTING)));
const clearPlan = (packId: string, lang: string) => { try { localStorage.removeItem(storeKey(packId, lang)); } catch { /* ignore */ } };

type Card = null | 'prompt' | 'denied' | 'none' | 'busy' | 'other';

export default function Plan() {
  const { packId = '' } = useParams<{ packId: string }>();
  const [, nav] = useLocation();
  const s = useSettings();
  const { lang } = useT();
  const qs = useMemo(() => new URLSearchParams(location.search), []);
  const demo = qs.get('demo') === '1';
  const from = qs.get('from');
  // the class conditions: remembered between visits; stage mode always shows the default, read-only
  const stored = useStoredSetting();
  const setting = demo ? DEFAULT_SETTING : stored;
  const [panel, setPanel] = useState(false);

  // stand-up mode (off by default; never in stage mode). The camera opens only with the setup window.
  const sp = useStandup();
  const standupOn = !demo && sp.on;
  const cam = useCamera();
  const [camOpen, setCamOpen] = useState(false);
  const handoff = useRef(false);
  useEffect(() => () => { if (!handoff.current) stopCamera(); }, []);
  const standupOff = () => { setStandup({ on: false }); stopCamera(); setCalib(null); setCamOpen(false); };
  const camReady = cam.status === 'on' && !!getCalib();

  const isLib = packId.startsWith('lib-');
  // an uploaded lesson: the pack (from the server) decides the topic, plan defaults and language
  const [pack, setPack] = useState<PackInfo | null>(null);
  const [packGone, setPackGone] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const topicId = isLib ? packId.slice(4) : pack?.topic?.id ?? pack?.libraryTopicId ?? '';
  const topic = isLib ? topics.find((t) => t.id === topicId) : undefined;
  const planLang = isLib ? s.lang : pack?.language ?? s.lang;
  const baseFor = useCallback((l: 'ar' | 'en'): Plan => {
    if (isLib) return defaultPlan(topicId, l, setting);
    return pack ? swapPlan({ goal: pack.plan.objective, steps: pack.plan.steps.map((x) => ({ ...x })) }, DEFAULT_SETTING, setting) : { goal: '', steps: [] };
  }, [isLib, topicId, pack, setting]);

  const [plan, setPlan] = useState<Plan>(() => (topic ? (demo ? null : loadPlan(packId, getSettings().lang, getClassSetting())) ?? defaultPlan(topicId, getSettings().lang, demo ? DEFAULT_SETTING : getClassSetting()) : { goal: '', steps: [] }));
  const [card, setCard] = useState<Card>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [showStage, setShowStage] = useState(demo && !getMic());
  const [stageRes, setStageRes] = useState<StageResult | null>(null);
  const wake = useRef<WakeLockSentinel | null>(null);

  // stage mode always runs the fractions lesson in Arabic
  useEffect(() => { if (demo) setSettings({ topicId: 'fractions', lang: 'ar', title: 'miss' }); }, [demo]);
  useEffect(() => { void loadManifest(); }, []);
  useEffect(() => { if (isLib && !topic) nav('/'); }, [isLib, topic, nav]);
  useEffect(() => {
    if (isLib) return;
    let live = true;
    getPack(packId).then((r) => {
      if (!live) return;
      if (r.status !== 'ready' || !r.pack) { setPackGone(true); return; }
      if (r.pack.topic) registerTopic(r.pack.topic);
      setSettings({ lang: r.pack.language, topicId: r.pack.topic?.id ?? r.pack.libraryTopicId ?? 'fractions' });
      setPack(r.pack);
    }).catch(() => live && setPackGone(true));
    return () => { live = false; };
  }, [isLib, packId]);

  // re-teach: open pre-filled with the plan of the lesson being reviewed
  useEffect(() => {
    if (!from) return;
    getPlanCheck(from).then((r) => { if (r.plan) setPlan(swapPlan(r.plan, normalizeSetting(r.setting), getClassSetting())); }).catch(() => {});
  }, [from]);
  // a re-taught plan is not rebuilt when the class changes: swap the kid names inside it
  const prevSetting = useRef(setting);
  useEffect(() => {
    const prev = prevSetting.current;
    prevSetting.current = setting;
    if (from && prev.group !== setting.group) setPlan((p) => swapPlan(p, prev, setting));
  }, [setting, from]);
  // language switch (stage mode sets it after the first render)
  useEffect(() => {
    if ((isLib ? !topic : !pack) || from) return;
    setPlan((demo ? null : loadPlan(packId, planLang, setting)) ?? baseFor(planLang));
  }, [planLang, packId, topic, pack, isLib, baseFor, from, demo, setting]);

  const edit = (next: Plan) => { setPlan(next); savePlan(packId, planLang, next, setting); };
  const setStep = (i: number, patch: Partial<{ kind: PlanKind; text: string }>) => edit({ ...plan, steps: plan.steps.map((st, j) => (j === i ? { ...st, ...patch } : st)) });
  const reset = () => { clearPlan(packId, planLang); setPlan(baseFor(planLang)); };
  const newDraft = async () => {
    const inp = lastPackInput();
    if (!inp) { nav('/'); return; }
    setDrafting(true); setFailed(false);
    try {
      const np = await makePack({ ...inp, language: pack?.language ?? inp.language }, { fresh: true });
      clearPlan(packId, np.language);
      setPack(np);
      setPlan(swapPlan({ goal: np.plan.objective, steps: np.plan.steps.map((x) => ({ ...x })) }, DEFAULT_SETTING, setting));
    } catch { setFailed(true); }
    setDrafting(false);
  };

  const tips = planTips(plan);
  const stuck = isLib ? (topic ? defaultsFor(topicId, s.lang).trouble_spots : []) : pack?.plan.trouble_spots ?? [];

  // ---------- start ----------
  const go = useCallback(async (withMic: boolean) => {
    setBusy(true); setFailed(false); setCard(null);
    try {
      await unlockAudio();
      if (withMic) {
        try { await openMic(); } catch (e) {
          const n = (e as DOMException)?.name;
          setCard(n === 'NotAllowedError' || n === 'SecurityError' ? 'denied' : n === 'NotFoundError' ? 'none' : n === 'NotReadableError' ? 'busy' : 'other');
          setBusy(false);
          return;
        }
      }
      const st = getSettings();
      void preloadLesson(topicId, st.lang, st.title);
      const standup = !demo && withMic && getStandupOn() && getCamera().status === 'on' && !!getCalib();
      if (!standup) stopCamera();
      const r = await createLesson({ packId, language: isLib ? st.lang : pack?.language ?? st.lang, teacherTitle: st.title, deviceId: deviceId(), plan, previousLessonId: from ?? undefined, ...(demo ? {} : { setting }), ...(standup ? { standup: true } : {}) });
      handoff.current = standup;
      nav(`/lesson/${r.lessonId}${demo ? '?demo=1' : withMic ? '' : '?type=1'}`);
    } catch {
      setFailed(true); setBusy(false);
    }
  }, [packId, topicId, plan, from, demo, nav, isLib, pack, setting]);

  const start = useCallback(async () => {
    if (busy) return;
    // stand-up mode on but not set up yet: set up the camera first
    if (!demo && getStandupOn() && !(getCamera().status === 'on' && getCalib())) { setCamOpen(true); return; }
    await unlockAudio();
    if (!getMic()) {
      try {
        const st = await (navigator.permissions as any)?.query({ name: 'microphone' });
        if (st?.state === 'prompt') { setCard('prompt'); return; }
      } catch { /* permissions API unavailable */ }
    }
    await go(true);
  }, [busy, go]);

  // ---------- stage ----------
  const runStage = useCallback(async () => {
    const r: StageResult = { mic: null, audio: null, ai: null, full: null, wake: null };
    const upd = (k: keyof StageResult, v: boolean) => { r[k] = v; setStageRes({ ...r }); };
    setStageRes({ ...r });
    try { await document.documentElement.requestFullscreen(); upd('full', true); } catch { upd('full', false); }
    try {
      wake.current = await navigator.wakeLock.request('screen'); upd('wake', true);
      document.addEventListener('visibilitychange', async () => { if (document.visibilityState === 'visible') try { wake.current = await navigator.wakeLock.request('screen'); } catch { /* ignore */ } });
    } catch { upd('wake', false); }
    upd('audio', await unlockAudio());
    void preloadLesson('fractions', 'ar', 'miss');
    try { await openMic(); upd('mic', true); } catch { upd('mic', false); }
    try { const w = await warmup(); upd('ai', !!w.ok); } catch { upd('ai', false); }
    if (Object.values(r).every((v) => v === true)) setTimeout(() => setShowStage(false), 4000);
  }, []);

  const hotkeys = useRef({ runStage, start, showStage, stageRes });
  hotkeys.current = { runStage, start, showStage, stageRes };
  useEffect(() => {
    if (!demo) return;
    const f = async (e: KeyboardEvent) => {
      const h = hotkeys.current;
      if (e.code === 'Enter' || e.code === 'PageDown') {
        e.preventDefault();
        if (h.showStage) { if (!h.stageRes) void h.runStage(); else setShowStage(false); }
        else void h.start();
      } else if (e.code === 'KeyC' && !h.showStage) {
        await unlockAudio();
        const st = getSettings();
        void playChorus(st.lang, st.title, { stale: () => false, onState() {}, onSpeakStart() {}, onSpeakEnd() {}, onFirstOutput() {}, onChorus() {}, onTimings() {}, onDone() {} });
      } else if (e.code === 'KeyF') document.fullscreenElement ? void document.exitFullscreen() : void document.documentElement.requestFullscreen?.().catch(() => {});
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, [demo]);

  if (!isLib && packGone) return (
    <main className="plan-page"><div className="paper-card" style={{ margin: 'auto', textAlign: 'center' }}>
      <p>{tr('packMissing', lang)}</p><Link href="/" className="btn btn-primary">{tr('changeMaterial', lang)}</Link>
    </div></main>
  );
  if (isLib ? !topic : !pack) return null;
  const readOnly = demo;
  const errKey = card === 'denied' ? 'micDenied' : card === 'none' ? 'micNone' : card === 'busy' ? 'micBusy' : 'micOther';

  return (
    <main className="plan-page">
      <header className="plan-head">
        <Stepper current={0} lang={lang} />
      </header>

      <section className="plan-start" aria-label={tr('stuckTitle', lang)}>
        <div className="paper-card material">
          <span className="lib-tag">{tr(isLib ? 'libTag' : 'draftTag', lang)}</span>
          <h1>{isLib ? topic!.title[lang] : pack!.title}</h1>
          <div className="grade">{tr('gradeWord', lang)} <bdi dir="ltr">{isLib ? topic!.grade : pack!.grade}</bdi></div>
          {!isLib && pack!.source && <div className="draft-line"><span className="fname" dir="auto">{pack!.source}</span></div>}
          <div className="draft-line">
            {!demo && <Link href="/" className="text-link">{tr('changeMaterial', lang)}</Link>}
            {!isLib && <button type="button" className="btn btn-outline" disabled={drafting} onClick={() => void newDraft()}>{drafting ? tr('loading', lang) : tr('newDraft', lang)}</button>}
          </div>
        </div>
        <div className="paper-card stuck">
          <h2>{tr('stuckTitle', lang)}</h2>
          <ul>{stuck.map((q) => <li key={q}>{q}</li>)}</ul>
          <p className="muted">{tr('stuckNote', lang)}</p>
        </div>
      </section>

      <section className="plan-notebook notebook" aria-label={tr('planTitle', lang)}>
        <label className="nb-goal">
          <span className="lbl">{tr('planGoal', lang)}</span>
          <textarea rows={1} value={plan.goal} readOnly={readOnly} maxLength={300} placeholder={tr('planGoalPh', lang)}
            onChange={(e) => edit({ ...plan, goal: e.target.value })} />
        </label>
        <ol className="nb-steps">
          {plan.steps.map((st, i) => (
            <li key={i}>
              <select value={st.kind} disabled={readOnly} aria-label={`${i + 1}`} onChange={(e) => setStep(i, { kind: e.target.value as PlanKind })}>
                {PLAN_KINDS.map((k) => <option key={k} value={k}>{tr(`kind_${k}` as Key, lang)}</option>)}
              </select>
              <textarea rows={1} value={st.text} readOnly={readOnly} maxLength={300} placeholder={tr('planStepPh', lang)} onChange={(e) => setStep(i, { text: e.target.value })} />
              {!readOnly && <button type="button" className="icon-btn" aria-label={tr('removeStep', lang)} onClick={() => edit({ ...plan, steps: plan.steps.filter((_, j) => j !== i) })}>×</button>}
            </li>
          ))}
        </ol>
        {tips.length > 0 && !readOnly && (
          <ul className="nb-tips" aria-live="polite">
            {tips.map((t) => <li key={t.key}>{t.key === 'yesno' ? trf('tip_yesno', lang, { phrase: t.phrase ?? '' }) : tr(`tip_${t.key}` as Key, lang)}</li>)}
          </ul>
        )}
        {!readOnly && (
          <div className="nb-actions">
            {plan.steps.length < MAX_STEPS && <button type="button" className="btn btn-outline" onClick={() => edit({ ...plan, steps: [...plan.steps, { kind: 'other', text: '' }] })}>{tr('addStep', lang)}</button>}
            <button type="button" className="text-link" onClick={reset}>{tr('resetPlan', lang)}</button>
          </div>
        )}
      </section>

      <section className="plan-bottom">
        <SettingProvider value={setting}>
          <div className="class-strip">
            <div className="class-strip-head">
            <h2>
              <span>{tr('classToday', lang)}: <bdi className="class-label">{settingLabel(setting, lang)}</bdi></span>
              {!demo && <button type="button" className="text-link" aria-expanded={panel} onClick={() => setPanel((o) => !o)}>{tr('classChange', lang)}</button>}
            </h2>
            {!demo && (
              <div className="standup-row">
                <label className="tap-switch">
                  <input type="checkbox" role="switch" checked={sp.on} onChange={(e) => { if (e.target.checked) { setStandup({ on: true }); setCamOpen(true); } else standupOff(); }} />
                  <b>{tr('standup', lang)}</b>
                </label>
                {standupOn ? (
                  <span className="standup-status">
                    {camReady && <span className="ready"><Check size={16} strokeWidth={3} aria-hidden />{tr('standupReady', lang)}</span>}
                    <button type="button" className="text-link" onClick={() => setCamOpen(true)}>{tr('camSetupTitle', lang)}</button>
                  </span>
                ) : <span className="sw-hint">{tr('standupLine', lang)}</span>}
              </div>
            )}
            </div>
            {panel && !demo && <ClassPanel setting={setting} lang={lang} onClose={() => setPanel(false)} isAr={isLib ? s.lang === 'ar' : pack?.language === 'ar'} />}
            <ul>
              {KID_IDS.map((k: KidId) => (
                <li key={k}>
                  <div className="avatar-wrap"><KidAvatar kid={k} level={1} lang={lang} /></div>
                  <div><b>{kidName(k, lang, setting)}</b><span>{personaFor(k, setting, lang)}</span></div>
                </li>
              ))}
            </ul>
          </div>
        </SettingProvider>
        <div className="plan-go">
          {failed && <div role="alert" className="muted">{tr('startFailed', lang)}</div>}
          <button className="btn btn-primary" onClick={() => void start()} disabled={busy || (!demo && plan.steps.length === 0)}>{busy ? tr('loading', lang) : tr('start', lang)}</button>
        </div>
      </section>

      {card && (
        <div className="modal-back" role="dialog" aria-modal="true">
          <div className="modal">
            {card === 'prompt' ? (<><h2>{tr('micTitle', lang)}</h2><p>{tr('micBody', lang)}</p>
              <div className="actions"><button className="btn btn-primary" style={{ fontSize: '1.1rem' }} onClick={() => void go(true)}>{tr('micAllow', lang)}</button><button className="btn" onClick={() => void go(false)}>{tr('typeInstead', lang)}</button></div></>)
              : (<><h2>{tr('micTitle', lang)}</h2><p>{tr(errKey, lang)}</p>
                <div className="actions"><button className="btn btn-primary" style={{ fontSize: '1.1rem' }} onClick={() => void go(true)}>{tr('tryAgain', lang)}</button><button className="btn" onClick={() => void go(false)}>{tr('typeInsteadShort', lang)}</button></div></>)}
          </div>
        </div>
      )}
      {camOpen && standupOn && <CameraSetup lang={lang} onDone={() => setCamOpen(false)} onOff={standupOff} />}
      {demo && showStage && <StageReady lang={lang} result={stageRes} onStart={() => void runStage()} onContinue={() => setShowStage(false)} />}
    </main>
  );
}

/** The "Change" panel: three presets, or any mix of the four conditions. */
function ClassPanel({ setting, lang, onClose, isAr }: { setting: ClassSetting; lang: 'ar' | 'en'; onClose: () => void; isAr: boolean }) {
  return (
    <div className="class-panel" role="group" aria-label={tr('classToday', lang)}>
      <div className="pill-radio" role="radiogroup">
        {PRESET_IDS.map((id) => (
          <button key={id} type="button" role="radio" aria-checked={setting.preset === id} onClick={() => setClassSetting(PRESETS[id].setting)}>{PRESETS[id].label[lang]}</button>
        ))}
      </div>
      <div className="class-fields">
        <label className="cf-size">
          <span>{tr('classSize', lang)}: <bdi dir="ltr" className="num">{setting.size}</bdi></span>
          <input type="range" min={SIZE_MIN} max={SIZE_MAX} step={1} value={setting.size} onChange={(e) => setClassSetting({ size: Number(e.target.value) })} />
        </label>
        <label className="cf-group">
          <span>{tr('classGroup', lang)}</span>
          <select value={setting.group} onChange={(e) => setClassSetting({ group: e.target.value as Group })}>
            {(['mixed', 'boys', 'girls'] as const).map((g) => <option key={g} value={g}>{GROUP_LABEL[g][lang]}</option>)}
          </select>
        </label>
        {isAr && (
          <label className="tap-switch"><input type="checkbox" checked={setting.langMix === 'mixed_english'} onChange={(e) => setClassSetting({ langMix: e.target.checked ? 'mixed_english' : 'arabic' })} /> <span>{tr('classEnglish', lang)}</span></label>
        )}
        <label className="tap-switch"><input type="checkbox" checked={setting.examFocus === 'high'} onChange={(e) => setClassSetting({ examFocus: e.target.checked ? 'high' : 'normal' })} /> <span>{tr('classExam', lang)}</span></label>
      </div>
      <p className="class-note">{tr('classNote', lang)}</p>
      <button type="button" className="btn btn-outline" onClick={onClose}>{tr('classDone', lang)}</button>
    </div>
  );
}
