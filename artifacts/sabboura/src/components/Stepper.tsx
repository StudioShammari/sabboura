import { tr } from '@/i18n';
import type { Lang } from '@shared/data';

const STEPS = ['stepPlan', 'stepTeach', 'stepReflect'] as const;

/** Three phases of a lesson. `current` is 0..2, or -1 to show the flow without marking a step. */
export function Stepper({ current, lang }: { current: number; lang: Lang }) {
  return (
    <ol className="stepper" aria-label={tr('stepperLabel', lang)}>
      {STEPS.map((k, i) => (
        <li key={k} aria-current={i === current ? 'step' : undefined} className={i === current ? 'on' : undefined}>
          <span className="num">{i + 1}</span> {tr(k, lang)}
        </li>
      ))}
    </ol>
  );
}
