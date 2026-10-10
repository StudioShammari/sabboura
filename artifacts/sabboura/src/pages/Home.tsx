import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import QRCode from 'qrcode';
import { KID_IDS, topics, kidById, type Lang, type Title } from '@shared/data';
import { useT, tr } from '@/i18n';
import { createLesson } from '@/lib/api';
import { loadManifest, openMic, preloadLesson, unlockAudio } from '@/lib/audio';
import { deviceId, getSettings, setSettings, useSettings } from '@/lib/store';

function Pills<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { v: T; l: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="form-row">
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
  const [photoOk, setPhotoOk] = useState(true);
  const [card, setCard] = useState<null | 'prompt' | 'denied' | 'none' | 'busy' | 'other'>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => { QRCode.toDataURL(location.origin, { margin: 1, width: 160 }).then(setQr).catch(() => {}); void loadManifest(); }, []);

  const go = async (withMic: boolean) => {
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
      void preloadLesson(getSettings().topicId, getSettings().lang, getSettings().title);
      const r = await createLesson({ topicId: s.topicId, language: s.lang, teacherTitle: s.title, deviceId: deviceId() });
      nav(`/lesson/${r.lessonId}`);
    } catch {
      setFailed(true); setBusy(false);
    }
  };

  const start = async () => {
    await unlockAudio();
    try {
      const st = await (navigator.permissions as any)?.query({ name: 'microphone' });
      if (st?.state === 'prompt') { setCard('prompt'); return; }
    } catch { /* permissions API unavailable */ }
    await go(true);
  };

  // stage mode: skip the home page
  useEffect(() => {
    if (new URLSearchParams(location.search).get('demo') !== '1') return;
    setSettings({ topicId: 'fractions', lang: 'ar', title: 'miss' });
    createLesson({ topicId: 'fractions', language: 'ar', teacherTitle: 'miss', deviceId: deviceId() }).then((r) => nav(`/lesson/${r.lessonId}?demo=1`)).catch(() => setFailed(true));
  }, [nav]);

  const titleOpts: { v: Title; l: string }[] = s.lang === 'ar' ? [{ v: 'miss', l: 'مس' }, { v: 'sir', l: 'أستاذ' }] : [{ v: 'miss', l: 'Miss' }, { v: 'sir', l: 'Sir' }];
  const errKey = card === 'denied' ? 'micDenied' : card === 'none' ? 'micNone' : card === 'busy' ? 'micBusy' : 'micOther';

  return (
    <main className="home">
      <span className="logo">{lang === 'ar' ? 'سبّورة' : 'Sabboura'}</span>
      <div className="board-frame"><h1>{tr('tagline', lang)}</h1></div>
      <div className="class-photo" aria-hidden="true">
        {KID_IDS.map((k) => <div key={k} className="initial-tile" style={{ borderInlineStart: '2px solid var(--frame)' }}>{kidById(k).name[lang]}</div>)}
        {photoOk && <img src="/avatars/class.webp" alt="" onError={() => setPhotoOk(false)} />}
      </div>
      <div className="form-card">
        <Pills label={tr('topic', lang)} value={s.topicId} options={topics.map((t) => ({ v: t.id, l: t.title[lang] }))} onChange={(v) => setSettings({ topicId: v })} />
        <Pills<Lang> label={tr('language', lang)} value={s.lang} options={[{ v: 'ar', l: 'العربية' }, { v: 'en', l: 'English' }]} onChange={(v) => setSettings({ lang: v })} />
        <Pills<Title> label={tr('callsYou', lang)} value={s.title} options={titleOpts} onChange={(v) => setSettings({ title: v })} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <button className="btn btn-primary" style={{ fontSize: '1.4rem' }} onClick={() => void start()} disabled={busy}>{busy ? tr('loading', lang) : tr('start', lang)}</button>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontWeight: 600 }}>
            <input type="checkbox" checked={s.calm} onChange={(e) => setSettings({ calm: e.target.checked })} style={{ width: 22, height: 22 }} /> {tr('calm', lang)}
          </label>
          {failed && <div role="alert" style={{ fontWeight: 600 }}>{tr('tryAgain', lang)}</div>}
        </div>
      </div>
      <footer style={{ display: 'flex', gap: 16, alignItems: 'center', color: 'var(--ink-muted)', fontWeight: 600, fontSize: '.9rem' }}>
        {qr && <img src={qr} alt="QR" width={72} height={72} style={{ borderRadius: 8 }} />}
        <span>{tr('privacy', lang)}</span>
      </footer>

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
    </main>
  );
}
