import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Bot, GraduationCap, Landmark, MicOff, School as SchoolIcon, VideoOff } from 'lucide-react';
import type { KidId, Lang } from '@shared/data';
import { MiniAvatar } from '@/components/KidAvatar';
import { fmtNum, tr, useT } from '@/i18n';
import { setSettings } from '@/lib/store';

// "For schools": a sample-data page for the pitch video. Nothing here is real, nothing reads or writes a lesson.
type L = Record<Lang, string>;
const X = {
  back: { ar: 'سبّورة', en: 'Sabboura' },
  badge: { ar: 'بيانات تجريبية للعرض', en: 'Sample data' },
  title: { ar: 'مدرسة النموذج · 40 معلّم/ة', en: 'Demo School · 40 teachers' },
  sub: { ar: 'لوحة المدرسة · آخر 4 أسابيع', en: 'School overview · last 4 weeks' },
  s1: { ar: 'معلّمون يتدرّبون هذا الشهر', en: 'Teachers practising this month' },
  s1of: { ar: 'من 40', en: 'of 40' },
  s2: { ar: 'جلسات هذا الأسبوع', en: 'Sessions this week' },
  s2note: { ar: 'جلسة تدريب', en: 'practice sessions' },
  s3: { ar: 'أسئلة حقيقية في الحصة', en: 'Real questions per lesson' },
  s3note: { ar: 'خلال 4 أسابيع', en: 'in 4 weeks' },
  s4: { ar: 'الحركة الأكثر إهمالاً', en: 'Most-missed move' },
  s4body: { ar: 'سأل «فاهمين؟» بدل سؤال حقيقي', en: 'Asked “Understand?” instead of a real question' },
  s4note: { ar: 'من الدروس الأولى', en: 'of first lessons' },
  chart: { ar: 'أسئلة حقيقية في الحصة', en: 'Real questions per lesson' },
  chartSub: { ar: 'متوسط المدرسة، أسبوعياً', en: 'School average, by week' },
  week: { ar: 'أسبوع', en: 'Week' },
  moves: { ar: 'حركات التدريس الخمس', en: 'The 5 teaching moves' },
  movesSub: { ar: 'نسبة الدروس التي تمّت فيها الحركة', en: '% of lessons where it was done' },
  trust: { ar: 'الخصوصية والثقة', en: 'Privacy and trust' },
  t1: { ar: 'ما في بيانات أطفال - الطلاب افتراضيين', en: "No children's data: the students are AI" },
  t2: { ar: 'صوتك ما بنخزنه', en: 'Your voice is never stored' },
  t3: { ar: 'الفيديو ما بطلع من جهازك', en: 'Video never leaves your laptop' },
  tLine: { ar: 'المدرسة بتشوف أرقام مجمّعة بس، والنتائج ما بتستخدم لتقييم المعلم.', en: 'Schools see totals only, and results are never used to appraise teachers.' },
  plans: { ar: 'الأسعار', en: 'Pricing' },
  p1: { ar: 'مدرسة', en: 'School' },
  p1price: { ar: '8 دنانير', en: '8 JOD' },
  p1unit: { ar: 'لكل معلّم شهرياً', en: 'per teacher per month' },
  p1note: { ar: 'تُدفع سنوياً', en: 'Billed yearly' },
  p2: { ar: 'رعاية مديرية', en: 'Sponsor a directorate' },
  p2price: { ar: 'مجاناً للمعلّم', en: 'Free for teachers' },
  p2unit: { ar: 'معلّمو المدارس الحكومية يتدرّبون مجاناً', en: 'Public-school teachers practise free' },
  p2note: { ar: 'يدفعها راعٍ', en: 'Paid by a sponsor' },
  p3: { ar: 'أكاديميات وكلّيات', en: 'Academies & faculties' },
  p3price: { ar: 'لكل متدرّب', en: 'Per trainee' },
  p3unit: { ar: 'لأكاديميات التدريب وكلّيات التربية', en: 'For training academies and education faculties' },
  cta: { ar: 'ابدأ تجربة', en: 'Start a pilot' },
} satisfies Record<string, L>;

const WEEKLY = [1.2, 1.8, 2.3, 2.8]; // real questions per lesson, weeks 1-4
const MOVES: { key: 'm_clarity' | 'm_reached' | 'm_checks' | 'm_lina' | 'm_yazan'; pct: number; kid?: KidId }[] = [
  { key: 'm_clarity', pct: 57 },
  { key: 'm_reached', pct: 44 },
  { key: 'm_checks', pct: 38 },
  { key: 'm_lina', pct: 29, kid: 'lina' },
  { key: 'm_yazan', pct: 23, kid: 'yazan' },
];

function LineChart({ lang }: { lang: Lang }) {
  const W = 560, H = 220, padL = 36, padR = 20, padT = 20, padB = 34, max = 3, min = 0;
  const x = (i: number) => padL + (i * (W - padL - padR)) / (WEEKLY.length - 1);
  const y = (v: number) => padT + (1 - (v - min) / (max - min)) * (H - padT - padB);
  const pts = WEEKLY.map((v, i) => `${x(i)},${y(v)}`).join(' ');
  const area = `${x(0)},${y(0)} ${pts} ${x(WEEKLY.length - 1)},${y(0)}`;
  return (
    <div dir="ltr"><svg className="sc-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${X.chart[lang]}: ${WEEKLY.map((v) => fmtNum(v, 'en')).join(' → ')}`}>
      {[0, 1, 2, 3].map((g) => (
        <g key={g}>
          <line x1={padL} x2={W - padR} y1={y(g)} y2={y(g)} className="sc-grid" />
          <text x={padL - 8} y={y(g) + 4} textAnchor="end" className="sc-axis">{g}</text>
        </g>
      ))}
      <polygon points={area} className="sc-area" />
      <polyline points={pts} className="sc-line" />
      {WEEKLY.map((v, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(v)} r={5} className="sc-dot" />
          <text x={x(i)} y={y(v) - 12} textAnchor="middle" className="sc-val">{v.toFixed(1)}</text>
          <text x={x(i)} y={H - 10} textAnchor="middle" className="sc-axis">{`${X.week[lang]} ${i + 1}`}</text>
        </g>
      ))}
    </svg></div>
  );
}

export default function School() {
  const { lang } = useT();
  const [, nav] = useLocation();
  // ?lang=en|ar picks the language on load (handy for recording); the toggle does the same.
  useEffect(() => {
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'ar' || q === 'en') setSettings({ lang: q });
  }, []);
  const n = (v: number) => fmtNum(v, 'en');

  return (
    <main className="school" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="sc-top">
        <a className="logo" href="/" onClick={(e) => { e.preventDefault(); nav('/'); }}>{X.back[lang]}</a>
        <div className="sc-lang" role="group" aria-label={tr('language', lang)}>
          <button type="button" aria-pressed={lang === 'ar'} onClick={() => setSettings({ lang: 'ar' })}>العربية</button>
          <button type="button" aria-pressed={lang === 'en'} onClick={() => setSettings({ lang: 'en' })}>English</button>
        </div>
      </div>

      <header className="sc-head">
        <span className="sc-badge">{X.badge[lang]}</span>
        <h1>{X.title[lang]}</h1>
        <p>{X.sub[lang]}</p>
      </header>

      <section className="sc-stats" aria-label={lang === 'ar' ? 'الأرقام' : 'Stats'}>
        <article className="sc-card">
          <h3>{X.s1[lang]}</h3>
          <div className="sc-big"><bdi dir="ltr">31</bdi> <small>{X.s1of[lang]}</small></div>
          <div className="sc-meter" aria-hidden="true"><i style={{ width: `${(31 / 40) * 100}%` }} /></div>
        </article>
        <article className="sc-card">
          <h3>{X.s2[lang]}</h3>
          <div className="sc-big"><bdi dir="ltr">54</bdi></div>
          <p className="sc-note">{X.s2note[lang]}</p>
        </article>
        <article className="sc-card">
          <h3>{X.s3[lang]}</h3>
          <div className="sc-big"><bdi dir="ltr">1.2 → 2.8</bdi></div>
          <p className="sc-note">{X.s3note[lang]}</p>
        </article>
        <article className="sc-card sc-warn">
          <h3>{X.s4[lang]}</h3>
          <div className="sc-big"><bdi dir="ltr">61%</bdi></div>
          <p className="sc-note">{X.s4body[lang]} · {X.s4note[lang]}</p>
        </article>
      </section>

      <div className="sc-two">
        <section className="sc-card">
          <h2>{X.chart[lang]}</h2>
          <p className="sc-sub">{X.chartSub[lang]}</p>
          <LineChart lang={lang} />
        </section>
        <section className="sc-card">
          <h2>{X.moves[lang]}</h2>
          <p className="sc-sub">{X.movesSub[lang]}</p>
          <ul className="sc-bars">
            {MOVES.map((m) => (
              <li key={m.key}>
                <div className="sc-bar-label">
                  {m.kid && <MiniAvatar kid={m.kid} size={20} lang={lang} />}
                  <span>{tr(m.key, lang)}</span>
                  <b><bdi dir="ltr">{n(m.pct)}%</bdi></b>
                </div>
                <div className="sc-meter" aria-hidden="true"><i style={{ width: `${m.pct}%` }} /></div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="sc-card sc-trust" aria-label={X.trust[lang]}>
        <h2>{X.trust[lang]}</h2>
        <ul>
          <li><Bot size={26} strokeWidth={1.6} aria-hidden="true" /><span>{X.t1[lang]}</span></li>
          <li><MicOff size={26} strokeWidth={1.6} aria-hidden="true" /><span>{X.t2[lang]}</span></li>
          <li><VideoOff size={26} strokeWidth={1.6} aria-hidden="true" /><span>{X.t3[lang]}</span></li>
        </ul>
        <p className="sc-trust-line">{X.tLine[lang]}</p>
      </section>

      <section aria-label={X.plans[lang]}>
        <h2 className="sc-h2">{X.plans[lang]}</h2>
        <div className="sc-plans">
          <article className="sc-card sc-plan">
            <SchoolIcon size={24} strokeWidth={1.6} aria-hidden="true" />
            <h3>{X.p1[lang]}</h3>
            <div className="sc-price">{X.p1price[lang]}</div>
            <p>{X.p1unit[lang]}</p>
            <small>{X.p1note[lang]}</small>
          </article>
          <article className="sc-card sc-plan">
            <Landmark size={24} strokeWidth={1.6} aria-hidden="true" />
            <h3>{X.p2[lang]}</h3>
            <div className="sc-price">{X.p2price[lang]}</div>
            <p>{X.p2unit[lang]}</p>
            <small>{X.p2note[lang]}</small>
          </article>
          <article className="sc-card sc-plan">
            <GraduationCap size={24} strokeWidth={1.6} aria-hidden="true" />
            <h3>{X.p3[lang]}</h3>
            <div className="sc-price">{X.p3price[lang]}</div>
            <p>{X.p3unit[lang]}</p>
          </article>
        </div>
      </section>

      <div className="sc-cta">
        <button type="button" className="sc-btn" onClick={() => nav('/')}>{X.cta[lang]}</button>
      </div>
    </main>
  );
}
