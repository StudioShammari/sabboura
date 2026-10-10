import { pgTable, uuid, text, timestamp, integer, real, boolean, jsonb, serial, unique } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const lessons = pgTable('lessons', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  topicId: text('topic_id').notNull(),
  language: text('language').notNull(),
  teacherTitle: text('teacher_title').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
  scoreJson: jsonb('score_json'),
  deviceId: text('device_id'),
  attemptNo: integer('attempt_no').default(1).notNull(),
  previousLessonId: uuid('previous_lesson_id'),
  packId: text('pack_id'),
  topicJson: jsonb('topic_json'),
  planJson: jsonb('plan_json'),
  planCheckJson: jsonb('plan_check_json'),
});

export const turns = pgTable(
  'turns',
  {
    id: serial('id').primaryKey(),
    lessonId: uuid('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
    turnNo: integer('turn_no').notNull(),
    clientTurnId: text('client_turn_id'),
    source: text('source'),
    transcript: text('transcript').notNull(),
    teacherSeconds: real('teacher_seconds').default(0).notNull(),
    checkType: text('check_type').default('none').notNull(),
    askedKid: text('asked_kid'),
    chorus: boolean('chorus').default(false).notNull(),
    failsafe: text('failsafe'),
    judgeJson: jsonb('judge_json'),
    levelsAfter: jsonb('levels_after').notNull(),
    timingsJson: jsonb('timings_json'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique('turns_lesson_turn').on(t.lessonId, t.turnNo)],
);

export const kidLevels = pgTable('kid_levels', {
  id: serial('id').primaryKey(),
  lessonId: uuid('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  turnNo: integer('turn_no').notNull(),
  kidId: text('kid_id').notNull(),
  level: integer('level').notNull(),
  change: integer('change').default(0).notNull(),
  helped: text('helped'),
  hurt: boolean('hurt').default(false).notNull(),
  evidence: text('evidence'),
});

export const kidLines = pgTable('kid_lines', {
  id: serial('id').primaryKey(),
  lessonId: uuid('lesson_id').notNull().references(() => lessons.id, { onDelete: 'cascade' }),
  turnNo: integer('turn_no').notNull(),
  idx: integer('idx').notNull(),
  kidId: text('kid_id').notNull(),
  reason: text('reason').notNull(),
  text: text('text').notNull(),
  textEn: text('text_en'),
  say: text('say'),
  source: text('source'),
  seconds: real('seconds').default(0).notNull(),
});

export const ttsCache = pgTable('tts_cache', {
  key: text('key').primaryKey(),
  voice: text('voice'),
  say: text('say'),
  mime: text('mime').default('audio/mpeg'),
  audioB64: text('audio_b64'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/** Uploaded-material lessons. Only the generated pack JSON is kept; the uploaded file never is. */
export const packs = pgTable('packs', {
  id: text('id').primaryKey(),
  language: text('language').notNull(),
  status: text('status').notNull(),
  reason: text('reason'),
  packJson: jsonb('pack_json'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
