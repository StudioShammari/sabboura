import { KID_IDS, kidById, topicById, type Lang, type Levels, type Title } from '@shared/data';
import { KidAvatar } from './KidAvatar';
import { StateBall } from './StateBall';
import { badgeLabel } from '@shared/data';
import { tr } from '@/i18n';

export type StageResult = Record<'mic' | 'audio' | 'ai' | 'full' | 'wake', boolean | null>;

export function MeetClass({ lang, topicId, levels, micErr, onStart, onType, stageCheck, stageResult }: {
  lang: Lang; title: Title; topicId: string; levels: Levels; micErr: string | null; onStart: () => void; onType: () => void; stageCheck: boolean; stageResult: StageResult | null;
}) {
  const topic = topicById(topicId);
  if (stageCheck) {
    const rows: [keyof StageResult, 'stageMic' | 'stageAudio' | 'stageAI' | 'stageFull' | 'stageWake'][] = [['mic', 'stageMic'], ['audio', 'stageAudio'], ['ai', 'stageAI'], ['full', 'stageFull'], ['wake', 'stageWake']];
    return (
      <div className="stage-ready" role="dialog" aria-modal="true">
        {!stageResult && <button className="btn btn-primary" style={{ fontSize: '2rem', padding: '18px 48px' }} onClick={onStart}>{tr('stageReady', lang)}</button>}
        {stageResult && (
          <ul className="checklist">
            {rows.map(([k, label]) => <li key={k}>{stageResult[k] === null ? '…' : stageResult[k] ? '✓' : '✗'} {tr(label, lang)}</li>)}
          </ul>
        )}
      </div>
    );
  }
  return (
    <div className="modal-back" style={{ zIndex: 55 }}>
      <div className="modal" role="dialog" aria-modal="true" style={{ maxWidth: 900 }}>
        <h2>{tr('meetTitle', lang)} · {topic.title[lang]}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
          {KID_IDS.map((k) => (
            <div key={k} style={{ textAlign: 'center' }}>
              <div style={{ width: '100%', aspectRatio: '1', maxWidth: 120, margin: '0 auto' }} className="avatar-wrap"><KidAvatar kid={k} level={levels[k]} lang={lang} /></div>
              <div className="kid-name" style={{ justifyContent: 'center' }}>{kidById(k).name[lang]}</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '.8rem', fontWeight: 600 }}><StateBall level={levels[k]} kid={k} size={16} onSolid={false} />{badgeLabel(k, levels[k], lang)}</div>
            </div>
          ))}
        </div>
        <p>{lang === 'ar' ? 'كل طالب عنده فكرة غلط سرّية. اشرح، واسألهم أسئلة حقيقية، وشوف شارتهم كيف بتتغيّر.' : 'Every kid has a secret misconception. Teach, ask real questions, and watch their badges change.'}</p>
        {micErr && <p role="alert" style={{ fontWeight: 600 }}>{tr(micErr as 'micDenied', lang)}</p>}
        <div className="actions">
          <button className="btn btn-primary" onClick={onStart}>{tr('letsStart', lang)}</button>
          <button className="btn btn-outline" onClick={onType}>{tr('typeInstead', lang)}</button>
        </div>
        <p style={{ fontSize: '.85rem', color: 'var(--ink-muted)', marginBottom: 0 }}>{tr('micBody', lang)}</p>
      </div>
    </div>
  );
}
