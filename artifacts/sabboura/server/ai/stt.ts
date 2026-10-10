import { toFile } from 'openai';
import { topicById, type Lang } from '../../shared/data';
import { AIError, models, withOpenAI } from './clients';
import { overlap, words } from '../lib/arabic';

const PHANTOMS = ['اشتركوا في القناة', 'شكرا للمشاهدة', 'شكرا لمشاهدتكم', 'ترجمة نانسي قنقر', 'thanks for watching', 'thank you for watching', 'subscribe to'];

export function sttPrompt(topicId: string, lang: Lang): string {
  const t = topicById(topicId);
  const vocabEn = t.vocab.split(',').map((s) => s.trim()).filter((s) => /^[a-z ]+$/i.test(s));
  if (lang === 'ar') {
    const arVocab = t.vocab.split(/[،,]/).map((s) => s.trim()).filter((s) => /[\u0600-\u06FF]/.test(s));
    return `درس عن ${t.title.ar} للصف ${t.grade} مع عمر ولينا وسارة وخالد ويزن: ${arVocab.join('، ')}.`;
  }
  return `A Grade ${t.grade} lesson on ${t.title.en.toLowerCase()} with Omar, Lina, Sara, Khaled and Yazan: ${vocabEn.join(', ')}.`;
}

export function isEmptyTranscript(text: string, prompt: string): boolean {
  const w = words(text);
  if (w.length < 2) return true;
  if (overlap(text, prompt) >= 0.7) return true;
  const low = text.toLowerCase();
  return PHANTOMS.some((p) => low.includes(p));
}

export async function transcribe(args: { buf: Buffer; mime: string; lang: Lang; topicId: string }): Promise<{ transcript: string; empty: boolean }> {
  const mp4 = /mp4|aac|m4a/i.test(args.mime);
  const ogg = /ogg/i.test(args.mime);
  const mp3 = /mpeg|mp3/i.test(args.mime);
  const name = mp4 ? 'turn.mp4' : ogg ? 'turn.ogg' : mp3 ? 'turn.mp3' : 'turn.webm';
  const type = mp4 ? 'audio/mp4' : ogg ? 'audio/ogg' : mp3 ? 'audio/mpeg' : 'audio/webm';
  const prompt = sttPrompt(args.topicId, args.lang);
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r: any = await withOpenAI(async (openai) =>
        openai.audio.transcriptions.create(
          { file: await toFile(args.buf, name, { type }), model: models.stt(), language: args.lang, prompt, response_format: 'json' },
          { timeout: 6000, maxRetries: 0 },
        ),
      );
      const text = String(r?.text ?? '').trim();
      return { transcript: text, empty: isEmptyTranscript(text, prompt) };
    } catch (e) {
      lastErr = e;
    }
  }
  throw new AIError(String((lastErr as any)?.message ?? lastErr), false);
}
