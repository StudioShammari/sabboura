import type { KidId, Lang } from '@shared/data';
import { kidById } from '@shared/data';
import { MiniAvatar } from './KidAvatar';
import { tr } from '@/i18n';

export interface Caption { kid: KidId; text: string; en?: string; tag?: string }
export function Ledge({ lang, cap, subtitles }: { lang: Lang; cap: Caption | null; subtitles: boolean }) {
  return (
    <div className="ledge" aria-live="polite">
      {!cap && <span className="idle">{tr('ledgeIdle', lang)}</span>}
      {cap && (
        <>
          <span className="mini"><MiniAvatar kid={cap.kid} size={36} lang={lang} /></span>
          <div className="cap" key={cap.text}>
            <b style={{ fontFamily: 'var(--f-ui)', fontSize: '.5em', color: 'var(--chalk-dim)', display: 'block', lineHeight: 1.2 }}>{kidById(cap.kid).name[lang]} {cap.tag && <span className="tag">{cap.tag}</span>}</b>
            {cap.text}
            {subtitles && cap.en && cap.en !== cap.text && <small>{cap.en}</small>}
          </div>
        </>
      )}
    </div>
  );
}
