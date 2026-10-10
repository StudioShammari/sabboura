import { registerTopic, type Lang, type Levels, type Title, type TopicDef } from '@shared/data';
import type { PackStatus } from '@shared/pack';
import type { ScoreJson } from '@shared/schemas';
import type { Plan, PlanCheck } from '@shared/plan';
import type { ClassSetting } from '@shared/setting';

async function json<T>(res: Response): Promise<T> {
  const ct = res.headers.get('content-type') ?? '';
  if (!res.ok || !ct.includes('json')) throw new Error(`bad response ${res.status}`);
  return res.json();
}
const post = (url: string, body?: unknown, signal?: AbortSignal) =>
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body), signal });

export interface CreatedLesson { lessonId: string; turnNo: number; levels: Levels }
export const createLesson = (b: { topicId?: string; packId?: string; plan?: Plan; language: Lang; teacherTitle: Title; deviceId?: string; previousLessonId?: string; setting?: ClassSetting }) =>
  post('/api/lessons', b).then((r) => json<CreatedLesson>(r));

export interface LessonInfo {
  lesson: { id: string; topicId: string; language: Lang; teacherTitle: Title; attemptNo: number; ended: boolean; packId: string | null; plan: Plan | null; setting?: ClassSetting };
  turnNo: number;
  /** Large classes: the Back of the class level now (0-3). */
  backRow?: number | null;
  levels: Levels;
  topic: TopicDef | null;
  turns: { turnNo: number; transcript: string; checkType: string; chorus: boolean; levelsAfter: Levels; lines: { kid: string; text: string }[] }[];
}
/** An uploaded lesson's topic comes with the reply; register it so topicById() finds it on this device. */
const withTopic = <T extends { topic?: TopicDef | null }>(r: T): T => { if (r.topic) registerTopic(r.topic); return r; };
export const getLesson = (id: string) => fetch(`/api/lessons/${id}`).then((r) => json<LessonInfo>(r)).then(withTopic);

export interface TranscribeResult { transcript: string; empty: boolean; seconds: number; sttMs: number }
export async function transcribe(id: string, blob: Blob, mime: string, durationMs: number): Promise<TranscribeResult> {
  const fd = new FormData();
  const ext = /mp4/.test(mime) ? 'mp4' : 'webm';
  fd.append('audio', blob, `turn.${ext}`);
  fd.append('durationMs', String(Math.round(durationMs)));
  fd.append('mime', mime);
  return fetch(`/api/lessons/${id}/transcribe`, { method: 'POST', body: fd }).then((r) => json<TranscribeResult>(r));
}
export const redoTurn = (id: string) => post(`/api/lessons/${id}/redo`).then((r) => json<{ turnNo: number; levels: Levels; lastTranscript: string }>(r));
export const endLesson = (id: string) => post(`/api/lessons/${id}/end`).then((r) => json<{ scoreUrl: string; score: ScoreJson }>(r));
export const getScore = (id: string) => fetch(`/api/lessons/${id}/score`).then((r) => json<ScoreJson & { topic?: TopicDef | null }>(r)).then(withTopic);
export const warmup = (force = false) => fetch(`/api/warmup${force ? '?force=1' : ''}`).then((r) => json<any>(r));
export const getDebug = (id: string) => fetch(`/api/lessons/${id}/debug`).then((r) => json<any>(r));

export interface ReplayTurn {
  turnNo: number; transcript: string; chorus: boolean; checkType: string; askedKid: string | null;
  state: Record<string, { to: 0 | 1 | 2; change: number; evidence: string | null }>;
  lines: { idx: number; kid: string; text: string; text_en: string; audioUrl: string }[];
}
export interface Replay { setting?: ClassSetting; language: Lang; title: Title; topicId: string; topic?: TopicDef | null; turns: ReplayTurn[] }
export const getReplay = (id: string) => fetch(`/api/lessons/${id}/replay`).then((r) => json<Replay>(r)).then(withTopic);

export interface PlanCheckResp { setting?: ClassSetting; packId: string | null; plan: Plan | null; check: PlanCheck | null }
export const getPlanCheck = (id: string) => fetch(`/api/lessons/${id}/plan-check`).then((r) => json<PlanCheckResp>(r));

export const getPack = (id: string) => fetch(`/api/packs/${id}`).then((r) => json<PackStatus>(r));
