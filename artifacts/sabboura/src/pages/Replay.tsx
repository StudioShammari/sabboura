import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'wouter';
import { KID_IDS, topicById, chorusFor, type KidId, type Level, type Levels, startLevels } from '@shared/data';
import { Board } from '@/components/Board';
import { KidCard, type CardView } from '@/components/KidCard';
import { Ledge, type Caption } from '@/components/Ledge';
import { tr, useT } from '@/i18n';
import { getReplay, type Replay as ReplayData } from '@/lib/api';
import { decodeUrl, fadeOutAll, playBuffer, unlockAudio } from '@/lib/audio';
import { setSettings } from '@/lib/store';
import { SettingProvider } from '@/lib/classSetting';
import { normalizeSetting } from '@shared/setting';

/** Demo backup: loads a recorded lesson, preloads every clip, then plays it turn by turn (arrow / PageDown). No network after loading. */
export default function Replay() {
  const { id = '' } = useParams<{ id: string }>();
  const { lang } = useT();
  const [data, setData] = useState<ReplayData | null>(null);
  const [bufs, setBufs] = useState<Map<string, AudioBuffer | null>>(new Map());
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const [idx, setIdx] = useState(-1);
  const [levels, setLevels] = useState<Levels | null>(null);
  const [views, setViews] = useState<Partial<Record<KidId, CardView>>>({});
  const [caption, setCaption] = useState<Caption | null>(null);
  const [tally, setTally] = useState(0);
  const gen = useRef(0);

  useEffect(() => {
    getReplay(id).then(async (d) => {
      setData(d); setSettings({ lang: d.language, title: d.title, topicId: d.topicId });
      setLevels(startLevels(d.topicId));
      const m = new Map<string, AudioBuffer | null>();
      await Promise.all(d.turns.flatMap((t) => t.lines).map(async (l) => { m.set(l.audioUrl, await decodeUrl(l.audioUrl)); }));
      setBufs(m); setLoaded(true);
    }).catch(() => { setFailed(true); setLoaded(true); });
  }, [id]);

  const next = useCallback(async () => {
    if (!data || !loaded) return;
    const n = idx + 1;
    if (n >= data.turns.length) return;
    await unlockAudio();
    const g = ++gen.current;
    fadeOutAll(100);
    setIdx(n);
    const t = data.turns[n];
    setLevels((cur) => {
      const nx = { ...(cur ?? startLevels(data.topicId)) } as Levels;
      for (const k of KID_IDS) nx[k] = t.state[k].to as Level;
      return nx;
    });
    if (t.checkType === 'yes_no') setTally((x) => x + 1);
    setViews(Object.fromEntries(KID_IDS.map((k) => [k, { asked: t.askedKid === k, delta: t.state[k].change ? { n: t.state[k].change, key: `${n}-${k}` } : null }])) as Partial<Record<KidId, CardView>>);
    setCaption(null);
    if (t.chorus) setCaption({ kid: 'omar', text: chorusFor(data.language, data.title) });
    for (const l of t.lines) {
      if (gen.current !== g) return;
      setCaption({ kid: l.kid as KidId, text: l.text, en: l.text_en });
      setViews((v) => Object.fromEntries(KID_IDS.map((k) => [k, { ...v[k], speaking: k === l.kid, dim: k !== l.kid }])) as typeof v);
      const b = bufs.get(l.audioUrl);
      if (b) await playBuffer(b).done; else await new Promise((r) => setTimeout(r, 2200));
      await new Promise((r) => setTimeout(r, 180));
    }
    if (gen.current === g) setViews((v) => Object.fromEntries(KID_IDS.map((k) => [k, { ...v[k], speaking: false, dim: false }])) as typeof v);
  }, [data, loaded, idx, bufs]);

  useEffect(() => {
    const f = (e: KeyboardEvent) => { if (e.code === 'ArrowRight' || e.code === 'PageDown' || e.code === 'Space') { e.preventDefault(); void next(); } };
    window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f);
  }, [next]);

  if (!data || !levels) return (
    <main className="classroom">
      {loaded ? (
        <div className="panel" role="alert" style={{ margin: 40, display: 'grid', gap: 12, justifyItems: 'start' }}>
          <p style={{ margin: 0 }}>{tr(failed ? 'replayLoadFail' : 'notFound', lang)}</p>
          <Link href={`/lesson/${id}/score`} className="btn btn-primary">{tr('backToReview', lang)}</Link>
        </div>
      ) : <p style={{ padding: 40 }} role="status">{tr('loading', lang)}</p>}
    </main>
  );
  const topic = topicById(data.topicId);
  const turn = data.turns[idx];
  return (
    <SettingProvider value={normalizeSetting(data.setting)}>
    <main className="classroom" dir={lang === 'ar' ? 'rtl' : 'ltr'} onClick={() => void next()}>
      <header className="topbar"><span className="logo">{lang === 'ar' ? 'سبّورة' : 'Sabboura'}</span><div className="center"><b>{tr('replayLabel', lang)}</b><span>{Math.max(idx + 1, 0)}/{data.turns.length}</span></div><span /></header>
      <section className="wall">
        <Board lang={lang} topic={topic.title[lang]} transcript={turn?.transcript ?? ''} marks={[]} tally={tally} hint={false} />
        <Ledge lang={lang} cap={caption} subtitles={false} />
      </section>
      <section className="class-row">
        {KID_IDS.map((k) => <KidCard key={k} kid={k} level={levels[k]} lang={lang} view={views[k] ?? {}} onBadge={() => {}} />)}
      </section>
      <footer className="dock"><div className="mic-wrap"><div className="mic-label">{loaded ? '→' : tr('loading', lang)}</div></div></footer>
    </main>
    </SettingProvider>
  );
}
