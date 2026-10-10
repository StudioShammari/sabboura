import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { z, type ZodType } from 'zod';
import { since } from '../lib/timing';

export type Purpose = 'judge' | 'lines' | 'scorer' | 'pack';

export class AIError extends Error {
  constructor(message: string, public retryable: boolean, public status?: number) {
    super(message);
  }
}

const env = (k: string) => (process.env[k] ?? '').trim();
export const csv = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);

export const models = {
  list: (p: Purpose) => {
    const own = csv(env(`CLAUDE_${p.toUpperCase()}_MODELS`));
    return own.length || p !== 'pack' ? own : csv(env('CLAUDE_SCORER_MODELS'));
  },
  stt: () => env('STT_MODEL') || 'gpt-4o-mini-transcribe',
  tts: () => env('TTS_MODEL') || 'gpt-audio-mini',
  image: () => env('IMAGE_MODEL') || 'gpt-image-2',
};

// ---------------- clients ----------------
interface AClient { label: string; client: Anthropic }
interface OClient { label: string; client: OpenAI }
let _a: AClient[] | null = null;
let _o: OClient[] | null = null;

export function anthropicClients(): AClient[] {
  if (_a) return _a;
  _a = [];
  const pk = env('AI_INTEGRATIONS_ANTHROPIC_API_KEY');
  if (pk) _a.push({ label: 'replit', client: new Anthropic({ baseURL: env('AI_INTEGRATIONS_ANTHROPIC_BASE_URL') || undefined, apiKey: pk, maxRetries: 0, timeout: 10000 }) });
  const own = env('ANTHROPIC_API_KEY');
  if (own) _a.push({ label: 'own', client: new Anthropic({ apiKey: own, maxRetries: 0, timeout: 10000 }) });
  return _a;
}
export function openaiClients(): OClient[] {
  if (_o) return _o;
  _o = [];
  const pk = env('AI_INTEGRATIONS_OPENAI_API_KEY');
  if (pk) _o.push({ label: 'replit', client: new OpenAI({ baseURL: env('AI_INTEGRATIONS_OPENAI_BASE_URL') || undefined, apiKey: pk, maxRetries: 0, timeout: 8000 }) });
  const own = env('OPENAI_API_KEY');
  if (own) _o.push({ label: 'own', client: new OpenAI({ apiKey: own, maxRetries: 0, timeout: 8000 }) });
  return _o;
}
export const hasAnthropic = () => anthropicClients().length > 0 && models.list('judge').length > 0;
export const hasOpenAI = () => openaiClients().length > 0;

/** Run fn against each OpenAI client until one does not 404 / reject the model. */
export async function withOpenAI<T>(fn: (c: OpenAI) => Promise<T>): Promise<T> {
  const cs = openaiClients();
  if (!cs.length) throw new AIError('no openai credentials', false);
  let last: unknown;
  for (const c of cs) {
    try {
      return await fn(c.client);
    } catch (e: any) {
      last = e;
      const st = e?.status;
      const msg = String(e?.message ?? '');
      if (st === 404 || (st === 400 && /model/i.test(msg)) || st === 401 || st === 403) continue;
      throw e;
    }
  }
  throw last;
}

// ---------------- state ----------------
export const aiState = {
  structured: true,
  dead: new Set<string>(),
  winners: {} as Partial<Record<Purpose, { model: string; via: string }>>,
};
const deadKey = (via: string, model: string) => `${via}|${model}`;

export function modelOpts(model: string, schema: object): Record<string, any> {
  const format = { type: 'json_schema', schema };
  const haiku = /haiku-4-5/.test(model);
  if (!aiState.structured) return haiku ? {} : { output_config: { effort: 'low' } };
  return { output_config: haiku ? { format } : { effort: 'low', format } };
}

function firstJson(text: string): unknown {
  const start = text.indexOf('{');
  if (start < 0) throw new AIError('no json in reply', true);
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) {
      try { return JSON.parse(text.slice(start, i + 1)); } catch { throw new AIError('invalid json', true); }
    }
  }
  throw new AIError('unterminated json', true);
}

export interface ClaudeCall<T> {
  purpose: Purpose;
  system: string;
  user: string;
  /** Content blocks sent BEFORE `user` (documents, images, material). */
  material?: any[];
  jsonSchema: object;
  zod: ZodType<T>;
  maxTokens: number;
  timeoutMs: number;
  signal?: AbortSignal;
}
export interface ClaudeResult<T> { value: T; model: string; via: string; ms: number }

/** One attempt. Walks candidate (model x client) pairs, skipping dead ones (404 / bad model). */
export async function claudeJSON<T>(call: ClaudeCall<T>): Promise<ClaudeResult<T>> {
  const clients = anthropicClients();
  const list = models.list(call.purpose);
  if (!clients.length || !list.length) throw new AIError('no anthropic credentials or model list', false);
  const t0 = performance.now();
  let lastErr: unknown = new AIError('no live model', false);
  for (const model of list) {
    for (const { label, client } of clients) {
      if (aiState.dead.has(deadKey(label, model))) continue;
      let allowTextMode = true;
      for (;;) {
        try {
          const system = [{ type: 'text', text: aiState.structured ? call.system : call.system + '\n\nReturn only a JSON object, no prose, matching exactly this JSON Schema (use these exact key names):\n' + JSON.stringify(call.jsonSchema), cache_control: { type: 'ephemeral' } }];
          const res: any = await (client.messages as any).create(
            {
              model,
              max_tokens: call.maxTokens,
              system,
              messages: [{ role: 'user', content: call.material?.length ? [...call.material, { type: 'text', text: call.user }] : call.user }],
              ...modelOpts(model, call.jsonSchema),
            },
            { timeout: call.timeoutMs, signal: call.signal },
          );
          if (res.stop_reason === 'max_tokens') throw new AIError('max_tokens', true);
          if (res.stop_reason === 'refusal') throw new AIError('refusal', true);
          const text = (res.content ?? []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('');
          const raw = aiState.structured ? safeParse(text) : firstJson(text);
          const parsed = call.zod.safeParse(raw);
          if (!parsed.success) throw new AIError('schema mismatch: ' + parsed.error.message.slice(0, 200), true);
          aiState.winners[call.purpose] = { model, via: label };
          return { value: parsed.data, model, via: label, ms: since(t0) };
        } catch (e: any) {
          if (e instanceof AIError) throw e;
          const st: number | undefined = e?.status;
          const msg = String(e?.message ?? e);
          if (e?.name === 'AbortError' || call.signal?.aborted) throw new AIError('aborted', false);
          if (st === 400 && /output_config|format/i.test(msg) && aiState.structured && allowTextMode) {
            console.warn('[ai] proxy rejected structured outputs; switching to JSON-in-text mode:', msg.slice(0, 160));
            aiState.structured = false;
            allowTextMode = false;
            continue;
          }
          if (st === 404 || (st === 400 && /model/i.test(msg))) {
            console.warn(`[ai] ${label}:${model} unavailable (${st}): ${msg.slice(0, 120)}`);
            aiState.dead.add(deadKey(label, model));
            lastErr = new AIError(`model ${model} unavailable`, false, st);
            break;
          }
          if (st === 401 || st === 403) {
            aiState.dead.add(deadKey(label, model));
            lastErr = new AIError(`auth ${st}`, false, st);
            break;
          }
          if (st === 400) throw new AIError('bad request: ' + msg.slice(0, 200), false, 400);
          const timeout = /timed? ?out|timeout/i.test(msg) || e?.name === 'APIConnectionTimeoutError';
          throw new AIError(timeout ? 'timeout' : msg.slice(0, 200), true, st);
        }
      }
    }
  }
  throw lastErr;
}

function safeParse(text: string): unknown {
  try { return JSON.parse(text); } catch { return firstJson(text); }
}

/** Boot / warm-up probe: tiny call per purpose, first non-404 id wins. */
export async function probeModels(): Promise<Record<string, { ok: boolean; model: string | null; via?: string; ms: number; error?: string }>> {
  const out: Record<string, any> = {};
  for (const p of ['judge', 'lines', 'scorer'] as Purpose[]) {
    const t0 = performance.now();
    try {
      const r = await claudeJSON({
        purpose: p,
        system: 'Reply with the JSON {"ok":true}.',
        user: 'ping',
        jsonSchema: { type: 'object', properties: { ok: { type: 'boolean' } }, required: ['ok'], additionalProperties: false },
        zod: z.object({ ok: z.boolean() }),
        maxTokens: 64,
        timeoutMs: 8000,
      });
      out[p] = { ok: true, model: r.model, via: r.via, ms: since(t0) };
    } catch (e: any) {
      out[p] = { ok: false, model: null, ms: since(t0), error: String(e?.message ?? e) };
    }
  }
  return out;
}
