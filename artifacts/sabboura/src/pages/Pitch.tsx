import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import QRCode from 'qrcode';
import { useT } from '@/i18n';

const PANELS = [
  { ar: 'معلّم بيتدرّب على صف ذكي', en: 'A flight simulator for teachers' },
  { ar: '5 طلاب · 5 مفاهيم خاطئة · قواعد ثابتة', en: '5 kids · 5 real misconceptions · fixed rules' },
  { ar: '8 دنانير للمعلّم شهرياً', en: '8 JOD per teacher per month' },
  { ar: '3 مجموعات مدارس للتجربة؟', en: 'Intros to 3 school groups?' },
];

export default function Pitch() {
  const { lang } = useT();
  const [, nav] = useLocation();
  const [i, setI] = useState(0);
  const [qr, setQr] = useState('');
  useEffect(() => { QRCode.toDataURL(location.origin, { margin: 1, width: 360 }).then(setQr).catch(() => {}); }, []);
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.code === 'ArrowRight' || e.code === 'PageDown' || e.code === 'Space') setI((x) => Math.min(PANELS.length - 1, x + 1));
      else if (e.code === 'ArrowLeft' || e.code === 'PageUp') setI((x) => Math.max(0, x - 1));
      else if (e.code === 'KeyB') history.length > 1 ? history.back() : nav('/');
    };
    window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f);
  }, [nav]);
  return (
    <main className="pitch" dir={lang === 'ar' ? 'rtl' : 'ltr'} onClick={() => setI((x) => Math.min(PANELS.length - 1, x + 1))}>
      <h1 key={i} className="fade-in">{PANELS[i][lang]}</h1>
      {i === PANELS.length - 1 && qr && <img src={qr} alt="QR" width={300} height={300} style={{ borderRadius: 12, background: '#fff', padding: 8 }} />}
    </main>
  );
}
