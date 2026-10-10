import { LINES_JSON_SCHEMA, LinesOut, type Speaker, type SpeakReason } from '../../shared/schemas';
import { addressTerm, canned, expandT, kidById, topicById, type KidId, type Lang, type Levels, type Title, type Line } from '../../shared/data';
import { AIError, claudeJSON } from './clients';
import { LINES_SYSTEM } from './prompts';
import { stripEmojiAndQuotes, truncateWords } from '../lib/arabic';
import { since } from '../lib/timing';

export interface OutLine { kid: KidId; reason: SpeakReason; text: string; say: string; text_en: string; source: 'starter' | 'ai' | 'canned' }

function fromCanned(l: Line, lang: Lang, title: Title) {
  const text = expandT(l[lang], lang, title);
  const say = expandT(l[lang === 'ar' ? 'say_ar' : 'say_en'] ?? l[lang], lang, title);
  const text_en = expandT(l.en, 'en', title);
  return { text, say, text_en };
}

export function starterLine(topicId: string, kid: KidId, lang: Lang, title: Title) {
  const l = canned.starters[topicId]?.[kid];
  return l ? fromCanned(l, lang, title) : null;
}

export function failsafeLine(kid: KidId, lang: Lang) {
  const f = kidById(kid).failsafe;
  return { text: f[lang], say: f[lang], text_en: f.en };
}

/** Canned line for a kid + reason (B3.7). Always returns something. */
export function cannedLine(topicId: string, kid: KidId, reason: SpeakReason, lang: Lang, title: Title) {
  let l: Line | undefined;
  if (reason === 'objection') l = canned.starters[topicId]?.[kid];
  else if (reason === 'answer') l = kid === 'lina' ? canned.answer_lost[topicId]?.lina : canned.starters[topicId]?.[kid];
  else if (reason === 'aha') l = kid === 'lina' ? canned.reasons.aha_lina : canned.reasons.aha;
  else if (reason === 'bored') l = canned.reasons.bored;
  else l = canned.reasons.timid_yes;
  return l ? fromCanned(l, lang, title) : failsafeLine(kid, lang);
}

export interface LinesResult { lines: OutLine[]; model: string | null; ms: number; ok: boolean; error?: string }

export async function generateLines(args: {
  topicId: string;
  lang: Lang;
  title: Title;
  transcript: string;
  speakers: Speaker[];
  levels: Levels;
  signal?: AbortSignal;
}): Promise<LinesResult> {
  const t0 = performance.now();
  const topic = topicById(args.topicId);
  const user = JSON.stringify({
    language: args.lang === 'ar' ? 'Arabic' : 'English',
    teacher_address: addressTerm(args.lang, args.title),
    teacher_said: args.transcript,
    speakers: args.speakers.map((s) => {
      const d = kidById(s.kid);
      return {
        id: s.kid, name: d.name.en, gender: d.gender === 'f' ? 'girl' : 'boy', personality: d.personality,
        misconception: topic.kids[s.kid].misconception, level: args.levels[s.kid], reason: s.reason,
      };
    }),
  });
  let lastErr = '';
  let attempts = 0;
  for (const timeoutMs of [6000, 4000]) {
    attempts++;
    try {
      const r = await claudeJSON({
        purpose: 'lines', system: LINES_SYSTEM, user, jsonSchema: LINES_JSON_SCHEMA, zod: LinesOut,
        maxTokens: 2000, timeoutMs, signal: args.signal,
      });
      const got = r.value.lines;
      const lines: OutLine[] = args.speakers.map((s, i) => {
        const g = got[i];
        const ok = g && g.kid === s.kid;
        const text = ok ? truncateWords(stripEmojiAndQuotes(g.text), 15) : '';
        if (!ok || !text) return { kid: s.kid, reason: s.reason, ...cannedLine(args.topicId, s.kid, s.reason, args.lang, args.title), source: 'canned' as const };
        const say = truncateWords(stripEmojiAndQuotes(g.say || g.text), 15) || text;
        const text_en = args.lang === 'en' ? text : stripEmojiAndQuotes(g.text_en || '') || text;
        return { kid: s.kid, reason: s.reason, text, say, text_en, source: 'ai' as const };
      });
      return { lines, model: r.model, ms: since(t0), ok: true };
    } catch (e: any) {
      lastErr = String(e?.message ?? e);
      if (!(e instanceof AIError) || !e.retryable) break;
    }
  }
  return {
    lines: args.speakers.map((s) => ({ kid: s.kid, reason: s.reason, ...cannedLine(args.topicId, s.kid, s.reason, args.lang, args.title), source: 'canned' as const })),
    model: null, ms: since(t0), ok: false, error: lastErr,
  };
}
