import { useState } from 'react';
import { KID_IDS, type Lang, type Levels } from '@shared/data';
import type { Plan, PlanCheck, PlanRow } from '@shared/plan';
import { fmtNum, tr, trf, type Key } from '@/i18n';

function Mark({ status, lang }: { status: PlanRow['status']; lang: Lang }) {
  if (status === 'done') return (
    <svg className="pmark" width="26" height="26" viewBox="0 0 26 26" role="img" aria-label={tr('planDone', lang)}>
      <circle cx="13" cy="13" r="12" fill="var(--action)" /><path d="M7.5 13.5l4 4 7-8" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (status === 'partly') return (
    <svg className="pmark" width="26" height="26" viewBox="0 0 26 26" role="img" aria-label={tr('planPartly', lang)}>
      <defs><clipPath id="half"><rect x="0" y="13" width="26" height="13" /></clipPath></defs>
      <circle cx="13" cy="13" r="11" fill="var(--action)" clipPath="url(#half)" /><circle cx="13" cy="13" r="11" fill="none" stroke="var(--action)" strokeWidth="2.4" />
    </svg>
  );
  if (status === 'not_yet') return <span className="notyet">{lang === 'ar' ? 'ليس بعد' : 'Not yet'}</span>;
  if (status === 'pending') return <span className="pending">{tr('checking', lang)}</span>;
  return <span className="pending">—</span>;
}

/** "Your plan vs. your lesson": the checklist. Ink and ink-blue only; it never changes the score. */
export function PlanVsLesson({ lang, plan, check, levels }: { lang: Lang; plan: Plan; check: PlanCheck | null; levels: Levels }) {
  const [open, setOpen] = useState<number | null>(null);
  const rows = check?.rows ?? plan.steps.map((s, i): PlanRow => ({ step: i + 1, kind: s.kind, status: 'pending', turn: null, evidence: null, next_time: null, source: 'ai' }));
  const N = rows.length;
  const D = rows.filter((r) => r.status === 'done').length;
  const P = rows.filter((r) => r.status === 'partly').length;
  const R = KID_IDS.filter((k) => k !== 'yazan' && levels[k] === 2).length;
  const settled = check?.status === 'done';
  const insight = !settled || N === 0 ? null
    : D >= N - 1 && R <= 2 ? trf('insightPlanNotClass', lang, { n: 4 - R })
    : D <= N / 2 && R >= 3 ? tr('insightOffPlan', lang) : null;
  const n = (x: number) => <bdi dir="ltr" className="num">{fmtNum(x, lang)}</bdi>;

  return (
    <section className="panel plan-vs" aria-label={tr('planVsLesson', lang)}>
      <h2>{tr('planVsLesson', lang)}</h2>
      <div className="pv-pills">
        <span className="chip">{tr('stepsDone', lang)}: {n(D)} {tr('ofN', lang)} {n(N)}{P > 0 && <> · {n(P)} {tr('partlyWord', lang)}</>}</span>
        <span className="chip">{tr('kidsReached', lang)}: {n(R)} {tr('ofN', lang)} {n(4)}</span>
      </div>
      {insight && <p className="pv-insight fade-in">{insight}</p>}
      {plan.goal && <p className="pv-goal"><b>{tr('planGoal', lang)}:</b> {plan.goal}</p>}
      <ol className="pv-rows">
        {rows.map((r, i) => (
          <li key={i} className={r.source === 'ai' && r.status !== 'pending' ? 'fade-in' : undefined}>
            <div className="pv-main">
              <Mark status={r.status} lang={lang} />
              <span className="tagpill">{tr(`kind_${r.kind}` as Key, lang)}</span>
              <span className="pv-text">{plan.steps[i]?.text}</span>
              {r.turn != null && (
                <button type="button" className="chip turn-chip" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>{trf('turnChip', lang, { n: fmtNum(r.turn, lang) })}</button>
              )}
            </div>
            {open === i && r.evidence && <div className="evidence">«{r.evidence}»</div>}
            {(r.status === 'partly' || r.status === 'not_yet') && r.next_time && <div className="pv-next"><b>{tr('nextTimeLine', lang)}:</b> {lang === 'ar' ? '«' : '“'}{r.next_time}{lang === 'ar' ? '»' : '”'}</div>}
          </li>
        ))}
      </ol>
    </section>
  );
}
