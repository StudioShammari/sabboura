import { type KidId } from '../../shared/data';
import type { LineEvent, TurnEvent } from '../../shared/schemas';
import { cannedLine, generateLines } from '../ai/kidLines';
import { speak } from '../ai/tts';
import { beginWork, isClosed, type LessonState } from './state';

/** A kid with a raised hand has been called on: ask one question. No judging, no level change, nothing saved. */
export async function* runQuestion(state: LessonState, kid: KidId, signal?: AbortSignal): AsyncGenerator<TurnEvent> {
  const release = beginWork(state.id);
  if (!release) {
    if (!isClosed(state.id)) yield { event: 'busy', data: {} };
    yield { event: 'done', data: { turnNo: state.turnNo } };
    return;
  }
  state.busy = true;
  try {
    const turnNo = state.turnNo;
    const said = state.last3.map((t) => t.transcript).join(' ... ') || '(the lesson has not started yet)';
    const g = await generateLines({
      topicId: state.topicId, lang: state.language, title: state.title, transcript: said, signal,
      speakers: [{ kid, reason: 'question' }], levels: state.levels, avoid: state.askedQuestions.slice(-6),
      context: { teacher: [], kids: state.kidSaid }, taught: state.taught, setting: state.setting,
    });
    const l = g.lines[0] ?? { kid, reason: 'question' as const, ...cannedLine(state.topicId, kid, 'question', state.language, state.title, state.taught, state.setting), source: 'canned' as const };
    if (!g.ok) yield { event: 'failsafe', data: { stage: 'lines', reason: g.error ?? 'lines failed', turnNo, kid } };
    state.pendingQuestion = { kid, text: l.text };
    state.askedQuestions.push(l.text);
    state.kidSaid = [...state.kidSaid, { kid, text: l.text }].slice(-8);
    const voice = speak(kid, state.language, l.say, signal, state.setting.group);
    const ev: LineEvent & { turnNo: number } = { idx: 0, kid, reason: 'question', text: l.text, text_en: l.text_en, source: l.source, turnNo };
    yield { event: 'line', data: ev };
    const r = await voice;
    if (!r.ok) {
      yield { event: 'audio_failed', data: { idx: 0, kid, turnNo } };
    } else {
      yield {
        event: 'audio',
        data: r.source === 'pre'
          ? { idx: 0, kid, mime: r.mime, url: r.url, source: 'pre', ms: r.ms, turnNo }
          : { idx: 0, kid, mime: r.mime, b64: r.b64, source: r.source, ms: r.ms, turnNo },
      };
    }
    yield { event: 'done', data: { turnNo } };
  } finally {
    state.busy = false;
    release();
  }
}
