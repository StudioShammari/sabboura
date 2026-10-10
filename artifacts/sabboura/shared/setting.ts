// Class settings: the CONDITIONS of the room (size, who is in the class, language mix, exam focus).
// Never the kids' abilities. The default setting must behave exactly like the app did before settings existed.
import { KID_IDS, type KidId, type L10n, type Lang } from './data';

export type Preset = 'private_mixed' | 'public_boys' | 'public_girls' | 'custom';
export type Group = 'mixed' | 'boys' | 'girls';
export type LangMix = 'arabic' | 'mixed_english';
export type ExamFocus = 'normal' | 'high';
export interface ClassSetting { preset: Preset; size: number; group: Group; langMix: LangMix; examFocus: ExamFocus }

export const SIZE_MIN = 15;
export const SIZE_MAX = 45;

export const PRESET_IDS = ['private_mixed', 'public_boys', 'public_girls'] as const;
export const PRESETS: Record<(typeof PRESET_IDS)[number], { setting: ClassSetting; label: L10n }> = {
  private_mixed: {
    setting: { preset: 'private_mixed', size: 24, group: 'mixed', langMix: 'arabic', examFocus: 'normal' },
    label: { ar: 'خاصة · مختلط · 24 طالب', en: 'Private · mixed · 24 students' },
  },
  public_boys: {
    setting: { preset: 'public_boys', size: 42, group: 'boys', langMix: 'arabic', examFocus: 'normal' },
    label: { ar: 'حكومية · ذكور · 42 طالب', en: 'Public · boys · 42 students' },
  },
  public_girls: {
    setting: { preset: 'public_girls', size: 38, group: 'girls', langMix: 'arabic', examFocus: 'normal' },
    label: { ar: 'حكومية · إناث · 38 طالب', en: 'Public · girls · 38 students' },
  },
};
export const DEFAULT_SETTING: ClassSetting = PRESETS.private_mixed.setting;

/** Every number the conditions change, as data. */
export const DIALS = {
  largeAt: 35,
  /** Large class: extra quieter copies in the chorus. */
  chorusExtra: { count: 3, gain: 0.3, delayMinMs: 60, delayMaxMs: 320 },
  /** Chorus clips reused in a boys' or girls' class vary a little so they do not sound duplicated. */
  chorusRate: { min: 0.94, max: 1.08 },
  /** A raised hand at most once every N turns. */
  handEveryTurns: { normal: 2, large: 3 },
  /** "Back of the class" (large classes only; shown, never scored). */
  backRow: { longSeconds: 30, noQuestionRun: 2, maxLevel: 3, murmurFrom: 2 },
} as const;

export const GROUP_LABEL: Record<Group, L10n> = {
  mixed: { ar: 'مختلط', en: 'Mixed' },
  boys: { ar: 'ذكور', en: 'Boys' },
  girls: { ar: 'إناث', en: 'Girls' },
};

const clampSize = (n: unknown) => Math.min(SIZE_MAX, Math.max(SIZE_MIN, Math.round(Number(n)) || DEFAULT_SETTING.size));

/** The preset whose four conditions match, or 'custom'. */
function presetFor(s: Omit<ClassSetting, 'preset'>): Preset {
  for (const id of PRESET_IDS) {
    const p = PRESETS[id].setting;
    if (p.size === s.size && p.group === s.group && p.langMix === s.langMix && p.examFocus === s.examFocus) return id;
  }
  return 'custom';
}

/** Anything in, a valid setting out (missing or broken input becomes the default). */
export function normalizeSetting(x: unknown): ClassSetting {
  const o = (x && typeof x === 'object' ? x : {}) as Record<string, unknown>;
  if (!x || typeof x !== 'object') return DEFAULT_SETTING;
  const s = {
    size: clampSize(o.size),
    group: (['mixed', 'boys', 'girls'] as const).includes(o.group as Group) ? (o.group as Group) : DEFAULT_SETTING.group,
    langMix: o.langMix === 'mixed_english' ? ('mixed_english' as const) : ('arabic' as const),
    examFocus: o.examFocus === 'high' ? ('high' as const) : ('normal' as const),
  };
  return { preset: presetFor(s), ...s };
}
export const withPatch = (s: ClassSetting, patch: Partial<Omit<ClassSetting, 'preset'>>): ClassSetting => normalizeSetting({ ...s, ...patch });

export const isDefaultSetting = (s: ClassSetting) =>
  s.size === DEFAULT_SETTING.size && s.group === DEFAULT_SETTING.group && s.langMix === DEFAULT_SETTING.langMix && s.examFocus === DEFAULT_SETTING.examFocus;
export const isLarge = (s: ClassSetting) => s.size >= DIALS.largeAt;
/** Mixed English words only exist in Arabic lessons. */
export const mixesEnglish = (s: ClassSetting, lang: Lang) => lang === 'ar' && s.langMix === 'mixed_english';

export function settingLabel(s: ClassSetting, lang: Lang): string {
  if (s.preset !== 'custom') return PRESETS[s.preset].label[lang];
  const n = s.size;
  const parts = lang === 'ar'
    ? ['مخصّص', GROUP_LABEL[s.group].ar, `${n} طالب`, ...(s.langMix === 'mixed_english' ? ['عربي وإنجليزي'] : []), ...(s.examFocus === 'high' ? ['تركيز على الامتحان'] : [])]
    : ['Custom', GROUP_LABEL[s.group].en, `${n} students`, ...(s.langMix === 'mixed_english' ? ['Arabic + English'] : []), ...(s.examFocus === 'high' ? ['Exam focus'] : [])];
  return parts.join(' · ');
}

// ---------------- who is in the class ----------------
export interface KidIdentity { name: L10n; gender: 'm' | 'f'; voice: string; avatarBase: string }

const id = (en: string, ar: string, gender: 'm' | 'f', voice: string, avatarBase = en.toLowerCase()): KidIdentity => ({ name: { en, ar }, gender, voice, avatarBase });
/** The five ROLES never change; only the display identity does. Unchanged kids keep today's names, voices and portraits. */
export const IDENTITIES: Record<Group, Record<KidId, KidIdentity>> = {
  mixed: {
    omar: id('Omar', 'عمر', 'm', 'ash'), lina: id('Lina', 'لينا', 'f', 'shimmer'), sara: id('Sara', 'سارة', 'f', 'coral'),
    khaled: id('Khaled', 'خالد', 'm', 'echo'), yazan: id('Yazan', 'يزن', 'm', 'verse'),
  },
  boys: {
    omar: id('Omar', 'عمر', 'm', 'ash'), lina: id('Yousef', 'يوسف', 'm', 'fable'), sara: id('Saif', 'سيف', 'm', 'cedar'),
    khaled: id('Khaled', 'خالد', 'm', 'echo'), yazan: id('Yazan', 'يزن', 'm', 'verse'),
  },
  girls: {
    omar: id('Rahaf', 'رهف', 'f', 'nova'), lina: id('Lina', 'لينا', 'f', 'shimmer'), sara: id('Sara', 'سارة', 'f', 'coral'),
    khaled: id('Dana', 'دانا', 'f', 'sage'), yazan: id('Jana', 'جنى', 'f', 'marin'),
  },
};

export const kidIdentity = (role: KidId, s: ClassSetting = DEFAULT_SETTING): KidIdentity => IDENTITIES[s.group][role];
export const identityFor = (role: KidId, group: Group = 'mixed'): KidIdentity => IDENTITIES[group][role];
export const kidName = (role: KidId, lang: Lang, s: ClassSetting = DEFAULT_SETTING) => IDENTITIES[s.group][role].name[lang];
/** True when this role shows a different kid in this group (so its portrait and voice differ from today). */
export const identityChanged = (role: KidId, group: Group) => IDENTITIES[group][role].avatarBase !== IDENTITIES.mixed[role].avatarBase;

// ---------------- names inside plan text ----------------
/** Fills {omar} {lina} {sara} {khaled} {yazan}. In Arabic «لـ{lina}» is the preposition ل joined to the name. */
export function fillNames(text: string, lang: Lang, s: ClassSetting = DEFAULT_SETTING): string {
  return text
    .replace(/لـ\{(omar|lina|sara|khaled|yazan)\}/g, (_, k: KidId) => `ل${kidName(k, 'ar', s)}`)
    .replace(/\{(omar|lina|sara|khaled|yazan)\}/g, (_, k: KidId) => kidName(k, lang, s));
}
const esc = (x: string) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Swaps one setting's kid names for another's in free text (whole words; Arabic may carry the ل prefix). */
export function swapNames(text: string, from: ClassSetting, to: ClassSetting): string {
  if (from.group === to.group) return text;
  let out = text;
  const marks: [string, string][] = [];
  const mark = (v: string) => { const m = `\u0001${marks.length}\u0001`; marks.push([m, v]); return m; };
  for (const k of KID_IDS) {
    const a = IDENTITIES[from.group][k], b = IDENTITIES[to.group][k];
    if (a.avatarBase === b.avatarBase) continue;
    out = out.replace(new RegExp(`(?<![A-Za-z])${esc(a.name.en)}(?![A-Za-z])`, 'g'), () => mark(b.name.en));
    out = out.replace(new RegExp(`(?<![\\p{L}])(ل?)${esc(a.name.ar)}(?![\\p{L}])`, 'gu'), (_m, pre: string) => `${pre}${mark(b.name.ar)}`);
  }
  for (const [m, v] of marks) out = out.split(m).join(v);
  return out;
}
/** Plan text written for the default class, shown for another one. */
export const swapFromDefault = (text: string, to: ClassSetting) => swapNames(text, DEFAULT_SETTING, to);

// ---------------- Back of the class (large classes; shown, never scored) ----------------
export interface BackTurn { seconds: number; check: string; askedKid: string | null }
export const BACK_ROW_LABEL: L10n[] = [
  { ar: 'هادي', en: 'quiet' }, { ar: 'في همس', en: 'murmuring' }, { ar: 'بدأ يتلهّى', en: 'drifting' }, { ar: 'صاير في حكي', en: 'chatty' },
];
/** The level after each teacher turn. +1 for a long talk or the 2nd turn in a row without a real question; -1 for a real question to the whole class. */
export function backRowLevels(turns: BackTurn[]): number[] {
  const { longSeconds, noQuestionRun, maxLevel } = DIALS.backRow;
  let lvl = 0, run = 0;
  return turns.map((t) => {
    const real = t.check === 'question';
    run = real ? 0 : run + 1;
    let d = 0;
    if (t.seconds > longSeconds || run >= noQuestionRun) d += 1;
    if (real && !t.askedKid) d -= 1;
    lvl = Math.min(maxLevel, Math.max(0, lvl + d));
    return lvl;
  });
}
/** Turn numbers (1-based) where the back of the class was at level 2 or more, as ranges. */
export function backRowDriftTurns(levels: number[]): [number, number][] {
  const out: [number, number][] = [];
  levels.forEach((l, i) => {
    if (l < DIALS.backRow.murmurFrom) return;
    const last = out[out.length - 1];
    if (last && last[1] === i) last[1] = i + 1; else out.push([i + 1, i + 1]);
  });
  return out;
}

// ---------------- exam focus ----------------
export const EXAM_LINES: Partial<Record<KidId, L10n>> = {
  khaled: { ar: 'هاد بيجي بالامتحان؟', en: 'Is this in the exam?' },
  sara: { ar: 'طيب شو القاعدة اللي بنحفظها؟', en: "So what's the rule we memorise?" },
};
export const examLine = (kid: KidId, s: ClassSetting): L10n | null => (s.examFocus === 'high' ? EXAM_LINES[kid] ?? null : null);

// ---------------- prompt notes (empty for the default setting, so default prompts stay byte-identical) ----------------
export const ENGLISH_SCHOOL_WORDS = ['Miss', 'fraction', 'numerator', 'denominator', 'exam', 'homework', 'quiz'];

/** Short CLASS CONDITIONS note for the kid-lines prompt. */
export function linesConditions(s: ClassSetting, lang: Lang): string {
  const parts: string[] = [];
  if (s.group !== 'mixed') parts.push('Each speaker keeps its id and its personality; use the speaker\'s given name and gender (grammar included). The speaker with id "lina" is the shy one whatever its name.');
  if (mixesEnglish(s, lang)) parts.push('Kids in this class mix a few English school words into their Arabic, the way bilingual kids do (e.g. "Miss، بس ليش الـdenominator أكبر؟"). Every line includes one or two English school words in Latin letters (such as Miss, fraction, numerator, denominator, exam, homework, quiz), never more than two; the rest stays Jordanian Arabic.');
  if (s.examFocus === 'high') parts.push('The exam is close. The speaker with id "khaled" asks whether this is in the exam instead of asking about real life (e.g. "هاد بيجي بالامتحان؟"). The speaker with id "sara" asks what rule they should memorise instead of asking why (e.g. "طيب شو القاعدة اللي بنحفظها؟"). Their secret misconceptions do not change.');
  if (!parts.length) return '';
  return `\n\nCLASS CONDITIONS (conditions of the room, never about the kids' abilities):\n- ${parts.join('\n- ')}`;
}
/** Short CLASS CONDITIONS note for the judge: names only (the judge never changes behaviour with a setting). */
export function judgeKidTableName(role: KidId, s: ClassSetting): string {
  if (s.group === 'mixed') return '';
  const i = kidIdentity(role, s);
  return ` (called ${i.name.ar} / ${i.name.en}, a ${i.gender === 'f' ? 'girl' : 'boy'})`;
}
/** Short CLASS CONDITIONS note for the scorer: names and gender in a boys' or girls' class, plus the room size. */
export function scorerConditions(s: ClassSetting): string {
  const parts: string[] = [];
  if (s.group !== 'mixed') {
    const who = KID_IDS.map((k) => { const i = kidIdentity(k, s); return `${k} = ${i.name.en} / ${i.name.ar} (${i.gender === 'f' ? 'girl' : 'boy'})`; }).join('; ');
    parts.push(`The kids' ids keep their roles but have these names: ${who}. Always write the kid's name and use the right gender in Arabic (never the role id and never another name).`);
  }
  if (isLarge(s)) parts.push(`This class has ${s.size} students and one teacher. Make one_tip and try_saying fit a large room (for example everyone answers at once: fingers up, mini whiteboards, or "tell your neighbour, then I'll pick"). This is about the room, never about the kids.`);
  if (!parts.length) return '';
  return `\n\nCLASS CONDITIONS: ${parts.join(' ')} Do not change any score.`;
}
