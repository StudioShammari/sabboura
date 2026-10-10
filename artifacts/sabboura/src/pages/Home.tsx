import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import QRCode from 'qrcode';
import { KID_IDS, libraryTopics, isLibraryTopic, kidById, type Lang, type Title } from '@shared/data';
import { PACK_MAX_PAGES, PACK_MAX_TEXT, type PackFailReason } from '@shared/pack';
import { KidAvatar } from '@/components/KidAvatar';
import { Stepper } from '@/components/Stepper';
import { useT, tr, trf, type Key } from '@/i18n';
import { PackFail, checkFile, makePack } from '@/lib/packs';
import { loadManifest } from '@/lib/audio';
import { setSettings, useSettings } from '@/lib/store';

function Pills<T extends string>({ label, value, options, onChange, stack }: { stack?: boolean; label: string; value: T; options: { v: T; l: string }[]; onChange: (v: T) => void }) {
  return (
    <div className={`form-row${stack ? ' stack' : ''}`}>
      <span className="lbl" id={`l-${label}`}>{label}</span>
      <div className="pill-radio" role="radiogroup" aria-labelledby={`l-${label}`}>
        {options.map((o) => <button key={o.v} type="button" role="radio" aria-checked={value === o.v} onClick={() => onChange(o.v)}>{o.l}</button>)}
      </div>
    </div>
  );
}

export default function Home() {
  const [, nav] = useLocation();
  const s = useSettings();
  const { lang } = useT();
  const [qr, setQr] = useState('');
  const libId = isLibraryTopic(s.topicId) ? s.topicId : 'fractions';

  // ---- upload ----
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [from, setFrom] = useState('1');
  const [to, setTo] = useState(String(PACK_MAX_PAGES));
  const [over, setOver] = useState(false);
  const [up, setUp] = useState<{ phase: 'idle' } | { phase: 'working'; step: 1 | 2 | 3 } | { phase: 'error'; reason: PackFailReason; pages?: number }>({ phase: 'idle' });
  const abort = useRef<AbortController | null>(null);
  const pick = useRef<HTMLInputElement>(null);
  const isPdf = !!file && (file.type === 'application/pdf' || /\.pdf$/i.test(file.name));
  const canMake = !!file || text.trim().length >= 20;

  const choose = (f: File | null | undefined) => {
    if (!f) return;
    const bad = checkFile(f);
    if (bad) { setUp({ phase: 'error', reason: bad }); return; }
    setFile(f); setText(''); setUp({ phase: 'idle' });
  };
  // a range is 1-based and at most PACK_MAX_PAGES long; fixed when the field loses focus
  const int = (v: string, d: number) => Math.max(1, Math.floor(Number(v)) || d);
  const fixFrom = () => { const f = int(from, 1); const t = int(to, f); setFrom(String(f)); setTo(String(t < f || t > f + PACK_MAX_PAGES - 1 ? f + PACK_MAX_PAGES - 1 : t)); };
  const fixTo = () => { const f = int(from, 1); const t = int(to, f); setTo(String(Math.max(t, 1))); setFrom(String(t < f ? t : t - f > PACK_MAX_PAGES - 1 ? t - PACK_MAX_PAGES + 1 : f)); };
  const make = async () => {
    let f = int(from, 1); let t = int(to, f);
    if (t < f) t = f;
    if (t - f > PACK_MAX_PAGES - 1) t = f + PACK_MAX_PAGES - 1;
    abort.current?.abort();
    const ac = new AbortController(); abort.current = ac;
    setUp({ phase: 'working', step: 1 });
    try {
      const pack = await makePack({ file: file ?? undefined, text: file ? undefined : text, language: s.lang, from: f, to: t }, { signal: ac.signal, onStep: (step) => setUp((u) => (u.phase === 'working' ? { phase: 'working', step } : u)) });
      setSettings({ lang: pack.language, topicId: pack.topic?.id ?? pack.libraryTopicId ?? 'fractions' });
      nav(`/plan/${pack.id}`);
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return;
      setUp({ phase: 'error', reason: e instanceof PackFail ? e.reason : 'unreadable', pages: e instanceof PackFail ? e.pages : undefined });
    }
  };
  const cancelUp = () => { abort.current?.abort(); setUp({ phase: 'idle' }); };
  useEffect(() => () => abort.current?.abort(), []);
  const errKey = (r: PackFailReason): [Key, Key] =>
    r === 'page_range' ? ['errPages', 'errPagesHint'] : r === 'too_big' ? ['errTooBig', 'errTooBigHint'] : r === 'wrong_type' ? ['errType', 'errTypeHint'] : r === 'not_lesson' ? ['errNotLesson', 'errNotLessonHint'] : r === 'timeout' ? ['errTimeout', 'errTimeoutHint'] : ['errUnreadable', 'errUnreadableHint'];

  useEffect(() => { QRCode.toDataURL(location.origin, { margin: 1, width: 160 }).then(setQr).catch(() => {}); void loadManifest(); }, []);

  // stage mode: skip the home page and open the plan for the demo lesson
  useEffect(() => {
    if (new URLSearchParams(location.search).get('demo') !== '1') return;
    setSettings({ topicId: 'fractions', lang: 'ar', title: 'miss' });
    nav('/plan/lib-fractions?demo=1', { replace: true });
  }, [nav]);

  const titleOpts: { v: Title; l: string }[] = s.lang === 'ar' ? [{ v: 'miss', l: 'مس' }, { v: 'sir', l: 'أستاذ' }] : [{ v: 'miss', l: 'Miss' }, { v: 'sir', l: 'Sir' }];

  return (
    <main className="home">
      <span className="logo">{lang === 'ar' ? 'سبّورة' : 'Sabboura'}</span>
      <div className="board-frame"><h1>{tr('tagline', lang)}</h1></div>
      <div className="home-class" aria-hidden="true">
        {KID_IDS.map((k) => <figure key={k}><div className="avatar-wrap"><KidAvatar kid={k} level={1} lang={lang} /></div><figcaption>{kidById(k).name[lang]}</figcaption></figure>)}
      </div>
      <div className="form-card">
        {up.phase === 'working' ? (
          <div className="board-frame upload-progress" role="status" aria-live="polite">
            <ol className="chalk-list">
              {([1, 2, 3] as const).map((n) => (
                <li key={n} className={n === up.step ? 'now' : n < up.step ? 'past' : 'later'}>
                  <span className="tick" aria-hidden="true">{n < up.step ? '✓' : n === up.step ? '•' : ''}</span>{tr(`prog${n}` as Key, lang)}
                </li>
              ))}
            </ol>
            <p className="chalk-note">{tr('progTime', lang)}</p>
            <button type="button" className="btn btn-outline chalk-btn" onClick={cancelUp}>{tr('cancelUpload', lang)}</button>
          </div>
        ) : up.phase === 'error' ? (
          <div className="paper-card upload-error" role="alert">
            <h2>{up.reason === 'page_range' ? trf('errPages', lang, { n: up.pages ?? 1 }) : tr(errKey(up.reason)[0], lang)}</h2>
            <p>{tr(errKey(up.reason)[1], lang)}</p>
            <div className="actions">
              {up.reason === 'page_range' && <button type="button" className="btn btn-primary" onClick={() => setUp({ phase: 'idle' })}>{tr('changePages', lang)}</button>}
              <button type="button" className={`btn${up.reason === 'page_range' ? '' : ' btn-primary'}`} onClick={() => { setFile(null); setText(''); setUp({ phase: 'idle' }); setTimeout(() => pick.current?.click(), 0); }}>{tr('tryAnother', lang)}</button>
              <button type="button" className="btn" onClick={() => { setFile(null); setText(''); setUp({ phase: 'idle' }); }}>{tr('useReady', lang)}</button>
            </div>
          </div>
        ) : (
          <div className="home-cards">
            <section className="paper-card upload-card" aria-labelledby="up-h">
              <h2 id="up-h">{tr('uploadLesson', lang)}</h2>
              <div className={`dropzone${over ? ' over' : ''}${file ? ' has' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
                onDrop={(e) => { e.preventDefault(); setOver(false); choose(e.dataTransfer.files?.[0]); }}>
                {file ? (
                  <><b className="fname" dir="auto">{file.name}</b><button type="button" className="text-link" onClick={() => setFile(null)}>{tr('uploadRemove', lang)}</button></>
                ) : (
                  <><span>{tr('uploadDrop', lang)}</span><button type="button" className="btn btn-outline" onClick={() => pick.current?.click()}>{tr('uploadChoose', lang)}</button><small>{tr('uploadTypes', lang)}</small></>
                )}
                <input ref={pick} type="file" hidden accept="application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp" onChange={(e) => { choose(e.target.files?.[0]); e.target.value = ''; }} />
              </div>
              {!file && (
                <label className="paste">
                  <span className="lbl">{tr('orPaste', lang)}</span>
                  <textarea rows={2} value={text} maxLength={PACK_MAX_TEXT} placeholder={tr('pastePh', lang)} onChange={(e) => setText(e.target.value)} />
                </label>
              )}
              <div className="upload-foot">
                {isPdf && (
                  <div className="pages-field">
                    <label><span className="lbl">{tr('pagesFrom', lang)}</span>
                      <input type="number" inputMode="numeric" min={1} value={from} onChange={(e) => setFrom(e.target.value)} onBlur={fixFrom} /></label>
                    <label><span className="lbl">{tr('pagesTo', lang)}</span>
                      <input type="number" inputMode="numeric" min={1} value={to} onChange={(e) => setTo(e.target.value)} onBlur={fixTo} /></label>
                    <small className="pages-hint">{tr('pagesHint', lang)}</small>
                  </div>
                )}
                <button type="button" className={`btn ${canMake ? 'btn-primary' : 'btn-outline'}`} disabled={!canMake} onClick={() => void make()}>{tr('uploadGo', lang)}</button>
              </div>
              <p className="upload-note">{tr('uploadNote', lang)}</p>
            </section>
            <section className="paper-card ready-card">
              <Pills<Lang> label={tr('language', lang)} value={s.lang} options={[{ v: 'ar', l: 'العربية' }, { v: 'en', l: 'English' }]} onChange={(v) => setSettings({ lang: v })} />
              <Pills<Title> label={tr('callsYou', lang)} value={s.title} options={titleOpts} onChange={(v) => setSettings({ title: v })} />
              <Pills stack label={tr('readyLessons', lang)} value={libId} options={libraryTopics.map((t) => ({ v: t.id, l: t.title[lang] }))} onChange={(v) => setSettings({ topicId: v })} />
              <button className={`btn ${canMake ? 'btn-outline' : 'btn-primary'}`} onClick={() => nav(`/plan/lib-${libId}`)}>{tr('nextPlan', lang)}</button>
            </section>
          </div>
        )}
        <div className="home-actions">
          <div className="home-flow">
            <Stepper current={-1} lang={lang} />
            <label className="tap-switch">
              <input type="checkbox" checked={s.calm} onChange={(e) => setSettings({ calm: e.target.checked })} /> <span>{tr('calm', lang)}</span>
            </label>
          </div>
        </div>
      </div>
      <footer className="home-foot">
        {qr && <img src={qr} alt="QR" width={56} height={56} style={{ borderRadius: 8 }} />}
        <span>{tr('privacy', lang)}</span>
      </footer>
    </main>
  );
}
