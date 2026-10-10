import { tr } from '@/i18n';
import type { Lang } from '@shared/data';

export type StageResult = Record<'mic' | 'audio' | 'ai' | 'full' | 'wake', boolean | null>;
const ROWS: [keyof StageResult, 'stageMic' | 'stageAudio' | 'stageAI' | 'stageFull' | 'stageWake'][] = [['mic', 'stageMic'], ['audio', 'stageAudio'], ['ai', 'stageAI'], ['full', 'stageFull'], ['wake', 'stageWake']];

/** Stage mode pre-flight overlay: one tap runs the checks. */
export function StageReady({ lang, result, onStart, onContinue }: { lang: Lang; result: StageResult | null; onStart: () => void; onContinue: () => void }) {
  return (
    <div className="stage-ready" role="dialog" aria-modal="true">
      {!result && <button className="btn btn-primary" style={{ fontSize: '2rem', padding: '18px 48px' }} onClick={onStart}>{tr('stageReady', lang)}</button>}
      {result && (
        <div>
          <ul className="checklist">
            {ROWS.map(([k, label]) => <li key={k}>{result[k] === null ? '…' : result[k] ? '✓' : '✗'} {tr(label, lang)}</li>)}
          </ul>
          {ROWS.every(([k]) => result[k] !== null) && ROWS.some(([k]) => result[k] === false) && (
            <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={onContinue}>{tr('letsStart', lang)}</button>
          )}
        </div>
      )}
    </div>
  );
}
