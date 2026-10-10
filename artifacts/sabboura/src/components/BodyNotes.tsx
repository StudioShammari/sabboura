// Review card "Body language notes" (stand-up lessons only, never in the shared view).
// Tips only: nothing here touches the score, the judge, the badges, the kids or the plan checklist.
import { useState } from 'react';
import { Check } from 'lucide-react';
import type { Lang } from '@shared/data';
import type { BodyNote, BodyResult } from '@shared/bodyNotes';
import { fmtNum, tr, type Key } from '@/i18n';
import { Fill } from './Fill';

const noteKey = (n: BodyNote, lang: Lang): Key =>
  n.kind === 'still' ? (n.frac ? 'body_still_frac' : 'body_still')
  : n.kind === 'face' ? (lang === 'ar' && (n.k ?? 0) >= 11 ? 'body_face_many' : 'body_face')
  : (`body_${n.kind}` as Key);

export function BodyNotes({ lang, result }: { lang: Lang; result: BodyResult }) {
  const [open, setOpen] = useState<number | null>(null);
  const stats = result.stats;
  const stat = (k: Key, x: number) => (
    <div className="body-stat">
      <span className="lbl">{tr(k, lang)}</span>
      <b className="v"><bdi dir="ltr">{fmtNum(x, lang)}%</bdi></b>
    </div>
  );
  return (
    <section className="panel body-card" aria-labelledby="body-title">
      <h2 id="body-title">{tr('bodyTitle', lang)}</h2>
      {result.unseen || !stats ? (
        <p className="body-line">{tr('body_unseen', lang)}</p>
      ) : (
        <>
          <div className="body-stats">
            {stat('bodyStatFacing', stats.facing)}
            {stat('bodyStatDown', stats.lookingDown)}
            {stat('bodyStatHands', stats.handsInView)}
            {stat('bodyStatMove', stats.handMovement)}
          </div>
          {result.strength && (
            <p className="body-strength">
              <Check size={20} strokeWidth={3} aria-hidden />
              <span><Fill text={tr(`strength_${result.strength.kind}` as Key, lang)} vars={{ n: result.strength.turn, x: result.strength.x }} lang={lang} /></span>
            </p>
          )}
          {result.notes.length ? (
            <ul className="body-notes">
              {result.notes.map((n, i) => (
                <li key={`${n.kind}-${i}`}>
                  <div className="body-note">
                    <span><Fill text={tr(noteKey(n, lang), lang)} vars={{ n: n.turn ?? undefined, words: n.words, k: n.k }} lang={lang} /></span>
                    {n.turn != null && (
                      <button type="button" className="chip body-turn" aria-expanded={open === i} onClick={() => setOpen(open === i ? null : i)}>
                        {tr('turn', lang)} <bdi dir="ltr">{fmtNum(n.turn, lang)}</bdi>
                      </button>
                    )}
                  </div>
                  {open === i && n.quote && <p className="body-quote">{tr('bodyYouSaid', lang)}: «<bdi>{n.quote}</bdi>»</p>}
                </li>
              ))}
            </ul>
          ) : <p className="body-line">{tr('bodyNone', lang)}</p>}
        </>
      )}
      <p className="body-foot">{tr('bodyFoot', lang)}</p>
    </section>
  );
}
