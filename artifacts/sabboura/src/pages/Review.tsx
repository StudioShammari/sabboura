import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { CircleHelp, Lightbulb, Rocket, UserRound, Users } from 'lucide-react';
import { KID_IDS, topicById, type KidId, type Lang, type Level } from '@shared/data';
import { DEFAULT_SETTING, kidIdentity, kidName, normalizeSetting, settingLabel, type ClassSetting } from '@shared/setting';
import type { ScoreJson, ScoreMove } from '@shared/schemas';
import { KidAvatar, MiniAvatar } from '@/components/KidAvatar';
import { StateBall } from '@/components/StateBall';
import { badgeLabel } from '@shared/data';
import { fmtNum, mmss, moveLabel, tr, trf, useT } from '@/i18n';
import { SettingProvider, setClassSetting } from '@/lib/classSetting';
import { createLesson, getBody, getPlanCheck, getReplay, getScore, type PlanCheckResp, type Replay } from '@/lib/api';
import type { BodyResult } from '@shared/bodyNotes';
import { BodyNotes } from '@/components/BodyNotes';
import { PlanVsLesson } from '@/components/PlanVsLesson';
import { Stepper } from '@/components/Stepper';
import { openMic, unlockAudio } from '@/lib/audio';
import { sfx } from '@/lib/sfx';
import { deviceId, setSettings } from '@/lib/store';

const BANDS = {
  ar: { warmup: 'جولة إحماء', getting: 'على الطريق الصحيح', strong: 'درس قوي', excellent: 'درس ممتاز' },
  en: { warmup: 'Warm-up round', getting: 'Getting there', strong: 'Strong lesson', excellent: 'Excellent lesson' },
};
const ICONS = { reached: Users, checks: CircleHelp, lina: UserRound, yazan: Rocket, clarity: Lightbulb };
const REVEAL_ORDER: KidId[] = ['omar', 'sara', 'khaled', 'yazan', 'lina'];
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function nAr(n: number) { return n === 1 ? 'مرة وحدة' : n === 2 ? 'مرتين' : n <= 10 ? `${n} مرات` : `${n} مرة`; }
function qAr(n: number) { return n === 1 ? 'سؤال حقيقي واحد' : n === 2 ? 'سؤالين حقيقيين' : `${n} أسئلة حقيقية`; }
function nEn(n: number) { return n === 1 ? 'once' : n === 2 ? 'twice' : `${n} times`; }

export function reachedSentence(lang: Lang, R: number, P: number, yazan: Level, setting: ClassSetting = DEFAULT_SETTING) {
  let s: string;
  const y = kidIdentity('yazan', setting);
  const f = y.gender === 'f';
  if (lang === 'en') {
    s = `You reached ${R} of 4 kids.${P > 0 ? ` ${P} got partway.` : ''}`;
    s += ' ' + (yazan === 2 ? `${y.name.en} was challenged.` : yazan === 1 ? `${y.name.en} was still waiting for a challenge.` : `${y.name.en} got bored.`);
  } else {
    s = R === 0 ? 'لم يصل الشرح بعد إلى أي من الطلاب الأربعة.' : R === 1 ? 'وصل شرحك إلى طالب واحد من 4.' : R === 2 ? 'وصل شرحك إلى طالبين من 4.' : `وصل شرحك إلى ${R} من 4 طلاب.`;
    if (P > 0) s = s.replace(/\.$/, '') + ` و${P} في منتصف الطريق.`;
    s += ' ' + (yazan === 2 ? `${y.name.ar} ${f ? 'كانت متحمّسة' : 'كان متحمّساً'} للتحدّي.` : yazan === 1 ? `${y.name.ar} ${f ? 'كانت لا تزال تنتظر' : 'كان لا يزال ينتظر'} تحدّياً.` : `${y.name.ar} ${f ? 'شعرت' : 'شعر'} بالملل.`);
  }
  return s;
}

export function yesNoSentence(lang: Lang, s: ScoreJson): { text: string; foot: string | null } | null {
  const N = s.yes_no_count, K = s.lost_at_last_yes_no, Q = s.question_count, ch = s.chorus_text ?? '';
  if (N >= 1) {
    const foot = lang === 'ar'
      ? 'روزنشاين (2012): المعلمون الأقل فاعلية كانوا يسألون «هل من أسئلة؟»، وإذا لم تكن هناك أسئلة افترضوا أن الطلاب تعلّموا.'
      : 'Rosenshine (2012): less effective teachers asked “Are there any questions?” and, if there were none, assumed the class had learned.';
    if (K >= 1) return { foot, text: lang === 'ar' ? `سألت «فاهمين؟» ${nAr(N)}. الصف قال «${ch}»، بس ${K} من 4 كانوا لسّا تايهين.` : `You asked “Everyone understand?” ${nEn(N)}. The class said “${ch}”. ${K} of 4 kids were still lost.` };
    return { foot, text: lang === 'ar' ? `سألت «فاهمين؟» ${nAr(N)}. هالمرة كانوا فعلاً فاهمين، بس الصف الحقيقي ما فيه شارات، والسؤال الحقيقي هو اللي بيكشف.` : `You asked “Everyone understand?” ${nEn(N)}. This time they really had understood. A real class has no badges, so only a real question tells you.` };
  }
  if (Q >= 1) return { foot: null, text: lang === 'ar' ? `ما سألت «فاهمين؟» ولا مرة. سألت بدالها ${qAr(Q)}.` : `You never asked “Everyone understand?”. You asked ${Q} real question${Q > 1 ? 's' : ''} instead.` };
  return null;
}

function useCountUp(target: number, ms = 1000) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0; const t0 = performance.now();
    const f = (t: number) => { const p = Math.min(1, (t - t0) / ms); setV(Math.round(target * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(f); };
    raf = requestAnimationFrame(f);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

function ScoreRing({ total, lang }: { total: number; lang: Lang }) {
  const n = useCountUp(total);
  const R = 70, C = 2 * Math.PI * R;
  return (
    <div className="ring-wrap" aria-label={`${total}/100`}>
      <svg width="160" height="160" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="80" cy="80" r={R} fill="none" stroke="var(--floor)" strokeWidth="14" />
        <circle cx="80" cy="80" r={R} fill="none" stroke="var(--action)" strokeWidth="14" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - n / 100)} />
      </svg>
      <div className="num-big"><bdi dir="ltr">{fmtNum(n, lang)}</bdi></div>
    </div>
  );
}

export default function Review() {
  const { id = '' } = useParams<{ id: string }>();
  const [, nav] = useLocation();
  const { lang, t } = useT();
  const shared = useMemo(() => new URLSearchParams(location.search).get('shared') === '1', []);
  const [score, setScore] = useState<ScoreJson | null>(null);
  const [missing, setMissing] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [flipped, setFlipped] = useState<Set<KidId>>(new Set());
  const [revealed, setRevealed] = useState(false);
  const [how, setHow] = useState(false);
  const [copied, setCopied] = useState(false);
  const [replay, setReplay] = useState<Replay | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [phone, setPhone] = useState(matchMedia('(max-width: 767px)').matches);
  const belled = useRef(false);
  const [pc, setPc] = useState<PlanCheckResp | null>(null);
  const [body, setBody] = useState<{ standup: boolean; result: BodyResult | null } | null>(null);

  useEffect(() => {
    getScore(id).then((s) => { setScore(s); setSettings({ lang: s.language, title: s.teacher_title, topicId: s.topic_id }); }).catch(() => setMissing(true));
    getReplay(id).then(setReplay).catch(() => {});
  }, [id]);
  // body language notes: personal, so never fetched for the shared view
  useEffect(() => { if (!shared) getBody(id).then(setBody).catch(() => {}); }, [id, shared]);
  // the plan checklist: code rows arrive at once, AI rows later
  useEffect(() => {
    if (shared) return;
    let alive = true; let tries = 0;
    const poll = async () => {
      try {
        const r = await getPlanCheck(id);
        if (!alive) return;
        setPc(r);
        if (r.check?.status === 'done' || !r.plan) return;
      } catch { if (!alive) return; }
      if (++tries < 40) setTimeout(poll, 1500);
    };
    void poll();
    return () => { alive = false; };
  }, [id, shared]);
  useEffect(() => {
    const m = matchMedia('(max-width: 767px)'); const f = () => setPhone(m.matches);
    m.addEventListener('change', f); return () => m.removeEventListener('change', f);
  }, []);
  useEffect(() => { if (score && !belled.current) { belled.current = true; sfx.bell(); } }, [score]);

  const autoReveal = useRef(new URLSearchParams(location.search).get('reveal') === '1');
  useEffect(() => {
    if (!score || !autoReveal.current) return;
    autoReveal.current = false;
    setRevealed(true);
    if (matchMedia('(max-width: 767px)').matches) { setFlipped(new Set(KID_IDS)); return; }
    void (async () => { await sleep(900); for (const k of REVEAL_ORDER) { setFlipped((x) => new Set(x).add(k)); sfx.flip(); await sleep(150); } })();
  }, [score]);
  if (missing) return <main className="review"><div className="panel"><p>{t('notFound')}</p><button className="btn btn-primary" onClick={() => nav('/')}>{t('home')}</button></div></main>;
  if (!score) return <main className="review"><div className="panel fade-in">{t('loading')}</div></main>;

  const L = score.language;
  const setting = normalizeSetting(score.setting);
  const lina = kidIdentity('lina', setting);
  const topic = topicById(score.topic_id);
  const fl = score.final_levels;
  const move = (k: ScoreMove['key']) => score.moves.find((m) => m.key === k)!;
  const yn = yesNoSentence(L, score);
  const lostKids = score.lost_kids_at_last_yes_no ?? [];
  const noGains = move('reached').points === 0;

  const reveal = async () => {
    if (revealed) { setFlipped(new Set()); setRevealed(false); return; }
    setRevealed(true);
    if (phone) { setFlipped(new Set(KID_IDS)); return; }
    for (const k of REVEAL_ORDER) { setFlipped((s) => new Set(s).add(k)); sfx.flip(); await sleep(150); }
  };
  const again = async (keepPlan: boolean) => {
    // a stand-up lesson goes back through the Plan page, where the camera is set up again
    if (keepPlan && body?.standup) { setClassSetting(setting); nav(`/plan/${pc?.packId ?? `lib-${score.topic_id}`}?from=${id}`); return; }
    await unlockAudio();
    try { await openMic(); } catch { /* typing is still possible */ }
    const withPlan = keepPlan && pc?.packId && pc.plan ? { packId: pc.packId, plan: pc.plan } : { topicId: score.topic_id };
    const r = await createLesson({ ...withPlan, language: score.language, teacherTitle: score.teacher_title, deviceId: deviceId(), previousLessonId: id, setting });
    nav(`/lesson/${r.lessonId}`);
  };
  const share = async () => {
    const url = `${location.origin}/s/${id}`;
    try { if (navigator.share) { await navigator.share({ url, title: 'Sabboura' }); return; } } catch { /* fall back to copy */ }
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignore */ }
  };
  const laNote = (m: ScoreMove): string | null => {
    if (m.note) return m.note;
    if (m.key !== 'lina') return null;
    if (m.points === 5) return L === 'ar' ? (lina.gender === 'f' ? `ناديت ${lina.name.ar} باسمها، بس السؤال كان آه أو لا. قالت «آه» وكانت لسّا تايهة.` : `ناديت ${lina.name.ar} باسمه، بس السؤال كان آه أو لا. قال «آه» وكان لسّا تايه.`) : `You named ${lina.name.en}, but asked yes/no. ${lina.gender === 'f' ? 'She' : 'He'} said yes and was still lost.`;
    if (m.points === 0 && score.lina_lost_turns >= 2) return L === 'ar' ? (lina.gender === 'f' ? `${lina.name.ar} كانت تايهة ${score.lina_lost_turns} مداخلات وما حكت ولا كلمة.` : `${lina.name.ar} كان تايه ${score.lina_lost_turns} مداخلات وما حكى ولا كلمة.`) : `${lina.name.en} was lost for ${score.lina_lost_turns} turns and never spoke.`;
    return null;
  };

  const bk = score.back_row;
  const backLine = bk ? (bk.drift.length ? trf('reviewBackDrift', L, { turns: bk.drift.map(([a, b]) => (a === b ? fmtNum(a, L) : `${fmtNum(a, L)}–${fmtNum(b, L)}`)).join(L === 'ar' ? '، ' : ', ') }) : tr('reviewBackStayed', L)) : null;
  const ai = score.ai;
  const sir = score.teacher_title === 'sir';
  const selTurn = replay?.turns.find((x) => x.turnNo === sel) ?? null;

  return (
    <SettingProvider value={setting}>
    <main className="review" dir={L === 'ar' ? 'rtl' : 'ltr'}>
      <div className="meta">
        <span>{t('reviewTitle')} · {topic.title[L]} · {settingLabel(setting, L)} · {t('practice')} · {t('attempt')} <bdi dir="ltr">{score.attempt_no}</bdi> · <bdi dir="ltr">{score.turns}</bdi> {t('turnsWord')} · <bdi dir="ltr">{mmss(score.seconds)}</bdi></span>
        <a className="logo" style={{ fontSize: '1.1rem' }} href="/" onClick={(e) => { e.preventDefault(); nav('/'); }}>{L === 'ar' ? 'سبّورة' : 'Sabboura'}</a>
      </div>
      <Stepper current={2} lang={L} />

      <section className="panel" aria-label="class">
        <div className={`review-class ${phone && revealed ? 'list' : ''}`}>
          {KID_IDS.map((k) => {
            const def = kidIdentity(k, setting), tk = topic.kids[k], lv = fl[k] as Level, ok = lv === 2;
            const back = (
              <div className="back" aria-hidden={!flipped.has(k)}>
                <h4>{def.name[L]}</h4>
                <div>{tk.reveal[L]}</div>
                <div className={`reveal-stamp ${ok ? 'ok' : 'no'} ${flipped.has(k) ? 'stamp-in' : ''}`}>{ok ? (L === 'ar' ? 'فهم' : 'Got it') : (L === 'ar' ? 'ما زال يفكّر' : 'Still thinking')}</div>
                {!ok && <div style={{ fontWeight: 600 }}>{L === 'ar' ? 'جرّب تسأل: ' : 'Try asking: '}{tk.next_check[L]}</div>}
              </div>
            );
            return (
              <div key={k} className={`flip ${flipped.has(k) && !phone ? 'flipped' : ''}`}>
                <div className="flip-inner">
                  <div className="front">
                    <div className={`kid ${lv === 2 && k !== 'yazan' ? 'gotit' : ''}`}>
                      <div className="avatar-wrap"><KidAvatar kid={k} level={lv} lang={L} /></div>
                      <div className="plank" />
                      <div className="kid-name">{def.name[L]}</div>
                      <div className={`badge-pill ${k === 'yazan' ? 'b-y' : 'b-u'}${lv}`}><StateBall level={lv} kid={k} size={22} /><span className="word">{badgeLabel(k, lv, L, def.gender)}</span></div>
                    </div>
                  </div>
                  {!phone && back}
                </div>
                {phone && flipped.has(k) && <div className="panel" style={{ marginTop: 8 }}>{back.props.children}</div>}
              </div>
            );
          })}
        </div>
        <p className="reached-line">{reachedSentence(L, score.reached, score.partly, fl.yazan as Level, setting)}</p>
        {backLine && <p className="reached-line back-line">{backLine} <span className="tagpill">{tr('reviewShownNotScored', L)}</span></p>}
        <button className="btn" onClick={() => void reveal()}>{revealed ? t('hideReveal') : t('reveal')}</button>
      </section>

      <div className={`review-pair ${yn && pc?.plan && !shared ? 'two' : ''}`}>
        {yn && (
          <section className="board-frame ynpanel" aria-label={tr('yesNoTally', L)}>
            <div className="sentence">{yn.text}</div>
            {lostKids.length > 0 && <div style={{ marginTop: 8 }}>{lostKids.map((k) => <MiniAvatar key={k} kid={k} size={32} lang={L} />)}</div>}
            {yn.foot && <div className="foot">{yn.foot}</div>}
          </section>
        )}
        {!shared && pc?.plan && <PlanVsLesson lang={L} plan={pc.plan} check={pc.check} levels={fl} />}
      </div>
      {!shared && body?.standup && body.result && <BodyNotes lang={L} result={body.result} />}

      <section className="panel score-grid">
        <div style={{ textAlign: 'center' }}>
          <ScoreRing total={score.total} lang={L} />
          <div style={{ fontFamily: 'var(--f-kid)', fontWeight: 800, fontSize: '1.4rem', margin: '8px 0' }}>{BANDS[L][score.band]}</div>
          <div style={{ fontSize: '.9rem', color: 'var(--ink-muted)' }}>{sir ? tr('disclaimerSir', L) : tr('disclaimerMiss', L)}</div>
        </div>
        <div>
          <h2>{tr('yourMoves', L)}</h2>
          <div className="moves">
            {score.moves.map((m) => {
              const Icon = ICONS[m.key]; const isOpen = open === m.key; const note = laNote(m);
              return (
                <Fragment key={m.key}>
                  <button className="move" onClick={() => setOpen(isOpen ? null : m.key)} aria-expanded={isOpen}>
                    <Icon size={22} aria-hidden="true" />
                    <span><span className="mv-name">{m.key === 'lina' || m.key === 'yazan' ? moveLabel(m.key, setting, L) : tr(`m_${m.key}` as 'm_reached', L)}</span><span className="tagpill">{m.key === 'clarity' ? tr('aiJudged', L) : tr('fixedRules', L)}</span></span>
                    <span className="bar"><i style={{ width: `${(m.points / m.max) * 100}%` }} /></span>
                    {m.points === 0 ? <span className="notyet">{tr('notYet', L)}</span> : <bdi dir="ltr" className="num">{m.points}/{m.max}</bdi>}
                  </button>
                  {isOpen && (
                    <div className="evidence fade-in">
                      {note && <div>{note}</div>}
                      {m.evidence.length === 0 && !note && <div>{tr('nothingYet', L)}</div>}
                      {m.evidence.map((e, i) => <div key={i}>{tr('turn', L)} <bdi dir="ltr">{e.turn}</bdi>: «{e.text}»</div>)}
                    </div>
                  )}
                </Fragment>
              );
            })}
          </div>
          <p style={{ fontWeight: 600 }}>{tr('voicesInvited', L)}: <bdi dir="ltr">{score.voices_invited}</bdi> {tr('ofN', L)} <bdi dir="ltr">5</bdi></p>
        </div>
      </section>

      <section className="fb-grid">
        <div className="panel fade-in">
          <h2>{noGains ? tr('buildOn', L) : tr('wentWell', L)}</h2>
          {score.best_turn_text && <p className="quote">«{score.best_turn_text}»</p>}
          {ai ? <p>{ai.why_it_worked}</p> : <><div className="skeleton" /><div className="skeleton" style={{ width: '70%' }} /></>}
        </div>
        <div className="panel fade-in">
          <h2>{tr('betterIf', L)}</h2>
          {ai ? <p>{ai.one_tip}</p> : <><div className="skeleton" /><div className="skeleton" style={{ width: '70%' }} /></>}
        </div>
        <div className="panel fb-next fade-in">
          <h2>{tr('nextTime', L)}</h2>
          {ai ? <p className="quote">«{ai.try_saying}»</p> : <><div className="skeleton" /><div className="skeleton" style={{ width: '70%' }} /></>}
        </div>
      </section>

      {replay && replay.turns.length > 0 && (
        <section className="panel">
          <h2>{tr('replayTitle', L)}</h2>
          <div className="scroll-x">
            <table className="replay">
              <thead>
                <tr><td />{replay.turns.map((x) => (
                  <th key={x.turnNo} scope="col" className={x.checkType === 'yes_no' ? 'frozen' : ''}>
                    <button className={sel === x.turnNo ? 'sel' : ''} onClick={() => setSel(sel === x.turnNo ? null : x.turnNo)} aria-label={`${tr('turn', L)} ${x.turnNo}`}>
                      <bdi dir="ltr">{x.turnNo}</bdi> {x.checkType === 'question' ? '●' : x.checkType === 'yes_no' ? '◇' : ''}
                    </button>
                  </th>
                ))}</tr>
              </thead>
              <tbody>
                {KID_IDS.map((k) => (
                  <tr key={k}>
                    <th scope="row"><MiniAvatar kid={k} size={32} lang={L} /> {kidName(k, L, setting)}</th>
                    {replay.turns.map((x) => {
                      const c = x.state[k];
                      return (
                        <td key={x.turnNo} className={x.checkType === 'yes_no' ? 'frozen' : ''}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, borderRadius: 999, outline: x.askedKid === k ? '2px solid var(--ink)' : undefined, outlineOffset: 2 }}>
                            <StateBall level={c.to as Level} kid={k} size={28} onSolid={false} />
                            {c.change > 0 && <b aria-label="up">↑</b>}{c.change < 0 && <b aria-label="down">↓</b>}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {selTurn && (
            <div className="fade-in" style={{ marginTop: 12 }}>
              <p className="quote"><b>{tr('turn', L)} <bdi dir="ltr">{selTurn.turnNo}</bdi>:</b> «{selTurn.transcript}»</p>
              {selTurn.chorus && <p><b>{L === 'ar' ? 'الصف: ' : 'Class: '}</b>{score.chorus_text}</p>}
              {selTurn.lines.map((l) => <p key={l.idx}><b>{kidName(l.kid as KidId, L, setting)}: </b>{l.text}</p>)}
            </div>
          )}
        </section>
      )}

      <section style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {shared
          ? <button className="btn btn-primary" onClick={() => nav('/')}>{tr('tryPractice', L)}</button>
          : <>
              <button className="btn btn-primary" onClick={() => void again(true)}>{tr('teachAgain', L)}</button>
              {pc?.packId && pc.plan && <button className="btn" onClick={() => { setClassSetting(setting); nav(`/plan/${pc.packId}?from=${id}`); }}>{tr('editPlanAgain', L)}</button>}
            </>}
        <button className="btn" onClick={() => void share()}>{copied ? tr('copied', L) : tr('share', L)}</button>
        <button className="btn" onClick={() => setHow(true)}>{tr('howScoring', L)}</button>
        <span style={{ color: 'var(--ink-muted)', fontWeight: 600, fontSize: '1rem' }}>{tr('privacyReview', L)}</span>
      </section>

      {how && (
        <div className="modal-back" onClick={() => setHow(false)}>
          <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>{tr('howScoring', L)}</h2>
            <ul>{(L === 'ar' ? HOW_AR(sir, setting) : HOW_EN(setting)).map((x) => <li key={x}>{x}</li>)}</ul>
            <div className="actions"><button className="btn btn-primary" style={{ fontSize: '1.1rem' }} onClick={() => setHow(false)}>{tr('close', L)}</button></div>
          </div>
        </div>
      )}
    </main>
    </SettingProvider>
  );
}

const HOW_EN = (s: ClassSetting) => [
  "Each kid holds one misconception known from research. A badge moves up only when the AI judge finds that your words meet that kid's fixed checklist, and it must quote you.",
  `Points are then counted by fixed rules: Reached every learner 40 (5 per step), Checked for understanding 20 (10 per real question), Included ${kidName('lina', 'en', s)} 15, Stretched ${kidName('yazan', 'en', s)} 10, Reasons and examples 15 (AI, fixed anchors 0–5).`,
  '“فاهمين؟” and other yes/no checks never move a badge and earn no points.',
  'A score for one practice lesson, not a rating of you as a teacher.',
  "Informed by: Rosenshine's Principles of Instruction; Wiliam's formative assessment; TeachingWorks high-leverage practices; Hattie & Timperley's model of feedback.",
];
const HOW_AR = (sir: boolean, s: ClassSetting) => [
  'كل طالب عنده مفهوم بديل واحد معروف في الأبحاث. لا تتقدّم الشارة إلا إذا وجد المقيّم الآلي أن كلماتك تحقق قائمة شروط ثابتة لهذا الطالب، ويجب أن يقتبس كلامك.',
  `ثم تُحسب النقاط بقواعد ثابتة: الوصول إلى كل طالب 40 (5 لكل خطوة)، التحقق من الفهم 20 (10 لكل سؤال حقيقي)، إشراك ${kidName('lina', 'ar', s)} 15، تحدّي ${kidName('yazan', 'ar', s)} 10، الشرح بالأسباب والأمثلة 15 (ذكاء اصطناعي بمعايير ثابتة 0-5).`,
  '«فاهمين؟» وأسئلة آه أو لا لا تحرّك أي شارة ولا تعطي نقاطاً.',
  `نتيجة لدرس تدريبي واحد، وليست تقييماً لك ${sir ? 'كمعلّم' : 'كمعلّمة'}.`,
];
