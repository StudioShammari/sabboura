import { asc, eq } from 'drizzle-orm';
import { startLevels, type KidId, type Lang, type Levels, type Title } from '../../shared/data';
import { db, kidLines, lessons, turns } from '../db';

export interface LessonState {
  id: string;
  topicId: string;
  language: Lang;
  title: Title;
  attemptNo: number;
  levels: Levels;
  turnNo: number;
  last3: { turnNo: number; transcript: string }[];
  busy: boolean;
  startersUsed: Set<KidId>;
  linaAsked: boolean;
  lastTranscript: string;
  startedAt: number;
}

const mem = new Map<string, LessonState>();

export function putState(s: LessonState) { mem.set(s.id, s); }
export function dropState(id: string) { mem.delete(id); }

export async function getState(id: string): Promise<LessonState | null> {
  const hit = mem.get(id);
  if (hit) return hit;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [l] = await db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
  if (!l) return null;
  const ts = await db.select().from(turns).where(eq(turns.lessonId, id)).orderBy(asc(turns.turnNo));
  const lines = await db.select().from(kidLines).where(eq(kidLines.lessonId, id));
  const last = ts[ts.length - 1];
  const s: LessonState = {
    id,
    topicId: l.topicId,
    language: l.language as Lang,
    title: l.teacherTitle as Title,
    attemptNo: l.attemptNo,
    levels: (last?.levelsAfter as Levels) ?? startLevels(l.topicId),
    turnNo: last?.turnNo ?? 0,
    last3: ts.slice(-3).map((t) => ({ turnNo: t.turnNo, transcript: t.transcript })),
    busy: false,
    startersUsed: new Set(lines.filter((x) => x.source === 'starter').map((x) => x.kidId as KidId)),
    linaAsked: ts.some((t) => t.askedKid === 'lina'),
    lastTranscript: last?.transcript ?? '',
    startedAt: l.createdAt.getTime(),
  };
  mem.set(id, s);
  return s;
}
