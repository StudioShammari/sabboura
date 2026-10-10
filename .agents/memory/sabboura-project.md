---
name: Sabboura project facts
description: Where the spec lives, architecture choices, AI-key state, shared test runner
---
- Spec: `docs/SPEC.md` (copy of the user's attached finalidea file). Build order: MUST, then SHOULD, then COULD; WON'T never. Part B is the how.
- Single artifact `artifacts/sabboura`: Express server + Vite in middleware mode (dev) or `dist/public` (prod). Data JSON in repo-root `data/`.
- No managed AI integration exists; the app needs the user's own `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` secrets. Without keys every AI step falls back to the failsafe path (app still runs).
- Model ids come only from env (`CLAUDE_*_MODELS` csv lists, `STT_MODEL`, `TTS_MODEL`, `IMAGE_MODEL`); never hardcode. Whether the ids/`output_config.format` work is unverified until keys exist.
- Judge test runner (`shared/judgeCheck.ts`) is shared by `/dev/test` and `scripts/test-judge.ts`.
- Server TTS manifest keys are sha1 including the TTS model, so pre-generated clips are only used when `TTS_MODEL` matches the one used by `gen:audio`.
**Why:** hackathon demo; must never show an error in the classroom.
