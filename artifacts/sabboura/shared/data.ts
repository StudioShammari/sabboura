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
  reveal: L10n;
  next_check: L10n;
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
export const topics = (topicsJson as any).topics as TopicDef[];
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

export function badgeLabel(kid: KidId, level: Level, lang: Lang): string {
  const def = kidById(kid);
  const set = labels[def.labels];
  if (lang === 'en') return set.en[level];
  return (def.gender === 'f' ? set.ar_f : set.ar_m)[level];
}
