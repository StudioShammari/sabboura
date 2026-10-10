import { JUDGE_JSON_SCHEMA, JudgeOut, type JudgeOutT } from '../../shared/schemas';
import { KID_IDS, type KidId, type Levels } from '../../shared/data';
import { DEFAULT_SETTING, type ClassSetting } from '../../shared/setting';
import { AIError, claudeJSON } from './clients';
import { judgeSystemFor, judgeUser } from './prompts';
import { overlap, truncateWords } from '../lib/arabic';
import { since } from '../lib/timing';

export interface JudgeResult {
  out: JudgeOutT | null;
  model: string | null;
  attempts: number;
  ms: number;
  ok: boolean;
  error?: string;
  evidenceMismatch: KidId[];
}

/** B3.5: 9 s then (if >= 6 s of the turn budget is left) a 7 s retry. Never retry 400/401/403/404. */
export async function judgeTurn(args: {
  topicId: string;
  levels: Levels;
  transcript: string;
  previous: { turnNo: number; transcript: string }[];
  signal?: AbortSignal;
  budgetLeftMs?: () => number;
  model?: string;
  setting?: ClassSetting;
}): Promise<JudgeResult> {
  const t0 = performance.now();
  const system = judgeSystemFor(args.topicId, args.setting ?? DEFAULT_SETTING);
  const user = judgeUser({ levels: args.levels, latest: args.transcript, previous: args.previous });
  let attempts = 0;
  let lastErr = '';
  for (const timeoutMs of [9000, 7000]) {
    if (attempts === 1 && args.budgetLeftMs && args.budgetLeftMs() < 6000) break;
    attempts++;
    try {
      const r = await claudeJSON({
        purpose: 'judge', system, user, jsonSchema: JUDGE_JSON_SCHEMA, zod: JudgeOut,
        maxTokens: 4000, timeoutMs, signal: args.signal,
      });
      const out = r.value;
      if (!out.on_topic) {
        for (const k of KID_IDS) out.kids[k] = { evidence: null, helped: 'no', hurt: false };
      }
      const mism: KidId[] = [];
      for (const k of KID_IDS) {
        const v = out.kids[k];
        if (v.evidence) {
          v.evidence = truncateWords(v.evidence, 20);
          if (overlap(v.evidence, args.transcript) < 0.7) {
            mism.push(k);
            console.warn(`[judge] evidence_mismatch ${k}: "${v.evidence}"`);
            if (process.env.JUDGE_DOWNGRADE_MISMATCH === '1') { v.helped = 'no'; }
          }
        }
      }
      return { out, model: r.model, attempts, ms: since(t0), ok: true, evidenceMismatch: mism };
    } catch (e: any) {
      lastErr = String(e?.message ?? e);
      if (!(e instanceof AIError) || !e.retryable) break;
    }
  }
  return { out: null, model: null, attempts, ms: since(t0), ok: false, error: lastErr, evidenceMismatch: [] };
}
