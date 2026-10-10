import topicsJson from '../../../data/topics.json';
import cannedJson from '../../../data/canned.json';
import feedbackJson from '../../../data/feedback.json';
import demoJson from '../../../data/demo-script.json';

export const KID_IDS = ['omar', 'lina', 'sara', 'khaled', 'yazan'] as const;
export type KidId = (typeof KID_IDS)[number];
export type Lang = 'ar' | 'en';
export type Title = 'miss' | 'sir';
export type Level = 0 | 1 | 2;
export type Levels = Record<KidId, Level>;

export interface L10n { en: string; ar: string }
/** Text about one kid. `ar` is the default kid's gender; `ar_m` / `ar_f` are optional gendered forms (see kidText). English stays neutral. */
export interface L10nKid extends L10n { ar_m?: string; ar_f?: string }
export interface KidDef {
  id: KidId;
  name: L10n;
  gender: 'm' | 'f';
  vocal: boolean;
  labels: 'understanding' | 'engagement';
  personality: string;
  failsafe: L10n;
}
export interface TopicKid {
  start_level: Level;
  misconception: string;
  helped_if: string;
  hurt_if: string;
  reveal: L10nKid;
  next_check: L10nKid;
}
export interface TopicDef {
  id: string;
  title: L10n;
  grade: string;
  vocab: string;
  kids: Record<KidId, TopicKid>;
}
export interface Line { ar: string; en: string; say_ar?: string; say_en?: string }

export const kids = (topicsJson as any).kids as KidDef[];
export const kidById = (id: KidId) => kids.find((k) => k.id === id)!;
export const labels = (topicsJson as any).labels as {
  understanding: { en: string[]; ar_m: string[]; ar_f: string[] };
  engagement: { en: string[]; ar_m: string[]; ar_f: string[] };
};
export const chorusText = (topicsJson as any).chorus as Record<string, string>;
/** Ready (library) lessons. Never changes. */
export const libraryTopics = [...((topicsJson as any).topics as TopicDef[])];
/** Library lessons plus uploaded ones registered at runtime (server: boot + lesson load; client: from API replies). */
export const topics: TopicDef[] = [...libraryTopics];
export const isLibraryTopic = (id: string) => libraryTopics.some((t) => t.id === id);
export const registerTopic = (t: TopicDef) => {
  if (isLibraryTopic(t.id)) return;
  const i = topics.findIndex((x) => x.id === t.id);
  if (i >= 0) topics[i] = t; else topics.push(t);
};
/** The topic JSON of an uploaded lesson (null for library lessons), to send to the client. */
export const uploadedTopic = (id: string): TopicDef | null => (isLibraryTopic(id) ? null : topics.find((t) => t.id === id) ?? null);
export const topicById = (id: string) => topics.find((t) => t.id === id) ?? topics[0];
export const canned = cannedJson as unknown as {
  starters: Record<string, Partial<Record<KidId, Line>>>;
  reasons: Record<string, Line>;
  answer_lost: Record<string, Partial<Record<KidId, Line>>>;
};
export const feedback = feedbackJson as any;
export const demoScript = (demoJson as any).lines as { n: number; act: number; who: string; ar: string; en: string }[];

export const startLevels = (topicId: string): Levels => {
  const t = topicById(topicId);
  return Object.fromEntries(KID_IDS.map((k) => [k, t.kids[k].start_level])) as Levels;
};

export const addressTerm = (lang: Lang, title: Title) =>
  lang === 'ar' ? (title === 'miss' ? 'مس' : 'أستاذ') : title === 'miss' ? 'Miss' : 'Sir';
export const chorusFor = (lang: Lang, title: Title) => chorusText[`${lang}_${title === 'miss' ? 'miss' : 'sir'}`];
export const expandT = (s: string, lang: Lang, title: Title) => s.replaceAll('{t}', addressTerm(lang, title));

/** `gender` is the displayed kid's gender (a class setting can change it); the role's own gender is the default. */
export function badgeLabel(kid: KidId, level: Level, lang: Lang, gender?: 'm' | 'f'): string {
  const def = kidById(kid);
  const set = labels[def.labels];
  if (lang === 'en') return set.en[level];
  return ((gender ?? def.gender) === 'f' ? set.ar_f : set.ar_m)[level];
}
