import type { PlanDefaults } from './plan';
import type { Lang, TopicDef } from './data';

/** What the client gets for an uploaded lesson. */
export interface PackInfo {
  id: string;
  language: Lang;
  title: string;
  grade: string;
  source: string | null;
  libraryTopicId: string | null;
  topic: TopicDef | null;
  plan: PlanDefaults;
}
export type PackFailReason = 'too_big' | 'wrong_type' | 'unreadable' | 'not_lesson' | 'timeout';
export interface PackStatus { status: 'working' | 'ready' | 'failed'; reason?: PackFailReason; pack?: PackInfo }
export const PACK_MAX_BYTES = 10 * 1024 * 1024;
export const PACK_MAX_TEXT = 12000;
export const PACK_MAX_PAGES = 6;
