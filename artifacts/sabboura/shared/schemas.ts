import { z } from 'zod';
import type { KidId, Level, Levels } from './data';

export const KidIdSchema = z.enum(['omar', 'lina', 'sara', 'khaled', 'yazan']);

const Verdict = z.object({
  evidence: z.string().nullable(),
  helped: z.enum(['no', 'partly', 'fully']),
  hurt: z.boolean(),
});
export const JudgeOut = z.object({
  kids: z.object({ omar: Verdict, lina: Verdict, sara: Verdict, khaled: Verdict, yazan: Verdict }),
  check: z.enum(['none', 'yes_no', 'question']),
  asked_kid: KidIdSchema.nullable(),
});
export type JudgeOutT = z.infer<typeof JudgeOut>;

export const LinesOut = z.object({
  lines: z.array(z.object({ kid: KidIdSchema, text: z.string(), say: z.string(), text_en: z.string() })),
});
export type LinesOutT = z.infer<typeof LinesOut>;

export const ScorerOut = z.object({
  clarity: z.number(),
  clarity_reason: z.string(),
  why_it_worked: z.string(),
  one_tip: z.string(),
  try_saying: z.string(),
});
export type ScorerOutT = z.infer<typeof ScorerOut>;

// JSON schemas (hand written, stable key order, used for output_config.format)
const verdictSchema = {
  type: 'object',
  properties: {
    evidence: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    helped: { type: 'string', enum: ['no', 'partly', 'fully'] },
    hurt: { type: 'boolean' },
  },
  required: ['evidence', 'helped', 'hurt'],
  additionalProperties: false,
} as const;
export const JUDGE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    kids: {
      type: 'object',
      properties: {
        omar: verdictSchema, lina: verdictSchema, sara: verdictSchema, khaled: verdictSchema, yazan: verdictSchema,
      },
      required: ['omar', 'lina', 'sara', 'khaled', 'yazan'],
      additionalProperties: false,
    },
    check: { type: 'string', enum: ['none', 'yes_no', 'question'] },
    asked_kid: { anyOf: [{ type: 'string', enum: ['omar', 'lina', 'sara', 'khaled', 'yazan'] }, { type: 'null' }] },
  },
  required: ['kids', 'check', 'asked_kid'],
  additionalProperties: false,
} as const;
export const LINES_JSON_SCHEMA = {
  type: 'object',
  properties: {
    lines: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          kid: { type: 'string', enum: ['omar', 'lina', 'sara', 'khaled', 'yazan'] },
          text: { type: 'string' },
          say: { type: 'string' },
          text_en: { type: 'string' },
        },
        required: ['kid', 'text', 'say', 'text_en'],
        additionalProperties: false,
      },
    },
  },
  required: ['lines'],
  additionalProperties: false,
} as const;
export const SCORER_JSON_SCHEMA = {
  type: 'object',
  properties: {
    clarity: { type: 'number' },
    clarity_reason: { type: 'string' },
    why_it_worked: { type: 'string' },
    one_tip: { type: 'string' },
    try_saying: { type: 'string' },
  },
  required: ['clarity', 'clarity_reason', 'why_it_worked', 'one_tip', 'try_saying'],
  additionalProperties: false,
} as const;

// ---- shared turn types ----
export type CheckType = 'none' | 'yes_no' | 'question';
export type Helped = 'no' | 'partly' | 'fully';
export type SpeakReason = 'objection' | 'answer' | 'timid_yes' | 'aha' | 'bored' | 'question';

export interface KidChange {
  from: Level;
  to: Level;
  change: number;
  helped: Helped;
  hurt: boolean;
  evidence: string | null;
}
export interface Speaker { kid: KidId; reason: SpeakReason }
export interface StateEvent {
  turnNo: number;
  levels: Record<KidId, KidChange>;
  check: CheckType;
  askedKid: KidId | null;
  chorus: boolean;
  linaPulse: boolean;
  speakers: Speaker[];
  judge: { model: string | null; attempts: number; ok: boolean; ms: number };
}
export interface LineEvent { idx: number; kid: KidId; reason: SpeakReason; text: string; text_en: string; source: 'starter' | 'ai' | 'canned' | 'failsafe' }
export interface AudioEvent { idx: number; kid: KidId; mime: string; url?: string; b64?: string; source: 'pre' | 'cache' | 'tts'; ms: number }
export interface TimingsEvent {
  judgeMs: number; judgeAttempts: number; rulesMs: number; linesMs: number; ttsMs: number[]; dbMs: number; totalMs: number;
  models: { judge: string | null; lines: string | null; tts: string | null };
}
export type TurnEvent =
  | { event: 'state'; data: StateEvent }
  | { event: 'chorus'; data: { lang: string; title: string; turnNo: number } }
  | { event: 'line'; data: LineEvent & { turnNo: number } }
  | { event: 'audio'; data: AudioEvent & { turnNo: number } }
  | { event: 'audio_failed'; data: { idx: number; kid: KidId; turnNo: number } }
  | { event: 'timings'; data: TimingsEvent & { turnNo: number } }
  | { event: 'failsafe'; data: { stage: string; reason: string; turnNo: number; kid?: KidId; text?: string; audioUrl?: string } }
  | { event: 'busy'; data: Record<string, never> }
  | { event: 'done'; data: { turnNo: number } };

export interface ScoreMove { key: 'reached' | 'checks' | 'lina' | 'yazan' | 'clarity'; points: number; max: number; evidence: { turn: number; text: string }[]; note?: string }
export interface ScoreJson {
  total: number;
  band: 'warmup' | 'getting' | 'strong' | 'excellent';
  moves: ScoreMove[];
  yes_no_count: number;
  lost_at_last_yes_no: number;
  question_count: number;
  voices_invited: number;
  best_turn: number;
  best_turn_text: string;
  focus_move: ScoreMove['key'];
  final_levels: Levels;
  reached: number;
  partly: number;
  turns: number;
  seconds: number;
  lina_lost_turns: number;
  lina_named_yes_no: boolean;
  chorus_text: string | null;
  topic_id: string;
  language: 'ar' | 'en';
  teacher_title: 'miss' | 'sir';
  attempt_no: number;
  ai: null | { clarity: number; clarity_reason: string; why_it_worked: string; one_tip: string; try_saying: string; fallback: boolean };
  lost_kids_at_last_yes_no: KidId[];
}
export type { KidId };
