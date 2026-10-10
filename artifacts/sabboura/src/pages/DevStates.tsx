import { KID_IDS, kidById, type Level } from '@shared/data';
import { KidCard } from '@/components/KidCard';
import { StateBall } from '@/components/StateBall';
import { useT } from '@/i18n';

/** Visual check: every kid in every level, plus the card chips. */
export default function DevStates() {
  const { lang } = useT();
  return (
    <main className="dev" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <h1>States</h1>
      {([0, 1, 2] as Level[]).map((lv) => (
        <section key={lv}>
          <h2>Level {lv}</h2>
          <div className="class-row" style={{ position: 'static', height: 'auto' }}>
            {KID_IDS.map((k) => <KidCard key={k} kid={k} level={lv} lang={lang} view={{}} onBadge={() => {}} />)}
          </div>
        </section>
      ))}
      <h2>Chips</h2>
      <div className="class-row" style={{ position: 'static', height: 'auto' }}>
        <KidCard kid="omar" level={0} lang={lang} view={{ hand: true, asked: true }} onBadge={() => {}} />
        <KidCard kid="lina" level={0} lang={lang} view={{ unheard: true, unheardPulse: true, q: 'blue' }} onBadge={() => {}} />
        <KidCard kid="sara" level={1} lang={lang} view={{ speaking: true, delta: { n: 1, key: 'a' }, hop: true }} onBadge={() => {}} />
        <KidCard kid="khaled" level={2} lang={lang} view={{ dim: true }} onBadge={() => {}} />
        <KidCard kid="yazan" level={0} lang={lang} view={{ thinking: true }} onBadge={() => {}} />
      </div>
      <h2>Balls</h2>
      <div style={{ display: 'flex', gap: 12 }}>{KID_IDS.flatMap((k) => ([0, 1, 2] as Level[]).map((l) => <StateBall key={k + l} kid={k} level={l} size={32} onSolid={false} />))}</div>
      <p>{kidById('omar').name[lang]}</p>
    </main>
  );
}
