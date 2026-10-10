import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import { KID_IDS, kidById, registerTopic, topics, type KidId } from '@shared/data';
import type { PackInfo } from '@shared/pack';
import { PLAN_KINDS, MAX_STEPS, defaultPlan, defaultsFor, planTips, type Plan, type PlanKind } from '@shared/plan';
import { KidAvatar } from '@/components/KidAvatar';
import { Stepper } from '@/components/Stepper';
import { StageReady, type StageResult } from '@/components/StageReady';
import { tr, trf, useT, type Key } from '@/i18n';
import { createLesson, getPack, getPlanCheck, warmup } from '@/lib/api';
import { lastPackInput, makePack } from '@/lib/packs';
import { loadManifest, openMic, getMic, preloadLesson, unlockAudio } from '@/lib/audio';
import { deviceId, getSettings, lsGet, lsSet, setSettings, useSettings } from '@/lib/store';
import { playChorus } from '@/lib/turnPlayer';

const storeKey = (packId: string, lang: string) => `sabboura.plan.v1.${packId}.${lang}`;
function loadPlan(packId: string, lang: string): Plan | null {
  try {
    const p = JSON.parse(lsGet(storeKey(packId, lang)) ?? 'null');
    if (p && typeof p.goal === 'string' && Array.isArray(p.steps) && p.steps.every((s: any) => PLAN_KINDS.includes(s?.kind) && typeof s.text === 'string')) return p;
  } catch { /* corrupt or blocked */ }
  return null;
}
const savePlan = (packId: string, lang: string, p: Plan) => lsSet(storeKey(packId, lang), JSON.stringify(p));
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

  const isLib = packId.startsWith('lib-');
  // an uploaded lesson: the pack (from the server) decides the topic, plan defaults and language
  const [pack, setPack] = useState<PackInfo | null>(null);
  const [packGone, setPackGone] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const topicId = isLib ? packId.slice(4) : pack?.topic?.id ?? pack?.libraryTopicId ?? '';
  const topic = isLib ? topics.find((t) => t.id === topicId) : undefined;
  const planLang = isLib ? s.lang : pack?.language ?? s.lang;
  const baseFor = useCallback((l: 'ar' | 'en'): Plan => {
    if (isLib) return defaultPlan(topicId, l);
    return pack ? { goal: pack.plan.objective, steps: pack.plan.steps.map((x) => ({ ...x })) } : { goal: '', steps: [] };
  }, [isLib, topicId, pack]);

  const [plan, setPlan] = useState<Plan>(() => (topic ? (demo ? null : loadPlan(packId, getSettings().lang)) ?? defaultPlan(topicId, getSettings().lang) : { goal: '', steps: [] }));
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
    getPlanCheck(from).then((r) => { if (r.plan) setPlan(r.plan); }).catch(() => {});
  }, [from]);
  // language switch (stage mode sets it after the first render)
  useEffect(() => {
    if ((isLib ? !topic : !pack) || from) return;
    setPlan((demo ? null : loadPlan(packId, planLang)) ?? baseFor(planLang));
  }, [planLang, packId, topic, pack, isLib, baseFor, from, demo]);

  const edit = (next: Plan) => { setPlan(next); savePlan(packId, planLang, next); };
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
      setPlan({ goal: np.plan.objective, steps: np.plan.steps.map((x) => ({ ...x })) });
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
      const r = await createLesson({ packId, language: isLib ? st.lang : pack?.language ?? st.lang, teacherTitle: st.title, deviceId: deviceId(), plan, previousLessonId: from ?? undefined });
      nav(`/lesson/${r.lessonId}${demo ? '?demo=1' : withMic ? '' : '?type=1'}`);
    } catch {
      setFailed(true); setBusy(false);
    }
  }, [packId, topicId, plan, from, demo, nav, isLib, pack]);

  const start = useCallback(async () => {
    if (busy) return;
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
        <div className="class-strip">
          <h2>{tr('classToday', lang)}</h2>
          <ul>
            {KID_IDS.map((k: KidId) => (
              <li key={k}>
                <div className="avatar-wrap"><KidAvatar kid={k} level={1} lang={lang} /></div>
                <div><b>{kidById(k).name[lang]}</b><span>{tr(`persona_${k}` as Key, lang)}</span></div>
              </li>
            ))}
          </ul>
        </div>
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
      {demo && showStage && <StageReady lang={lang} result={stageRes} onStart={() => void runStage()} onContinue={() => setShowStage(false)} />}
    </main>
  );
}
