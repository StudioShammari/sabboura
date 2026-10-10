---
name: Sabboura project facts
description: Where the spec lives, architecture choices, AI-key state, shared test runner
---
- Spec: `docs/SPEC.md` (copy of the user's attached finalidea file). Build order: MUST, then SHOULD, then COULD; WON'T never. Part B is the how.
- Single artifact `artifacts/sabboura`: Express server + Vite in middleware mode (dev) or `dist/public` (prod). Data JSON in repo-root `data/`.
- No managed AI integration exists; the app needs the user's own `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` secrets. Without keys every AI step falls back to the failsafe path (app still runs).
- Model ids come only from env (`CLAUDE_*_MODELS` csv lists, `STT_MODEL`, `TTS_MODEL`, `IMAGE_MODEL`); never hardcode. Verified with the user's own keys: claude-opus-5-5, claude-sonnet-5, claude-haiku-5-5, gpt-audio-mini, gpt-4o-mini-transcribe, gpt-image-2, and `output_config.format` all work.
- Replit-managed Anthropic/OpenAI integrations are NOT offered in this workspace (searched catalog; user then supplied own keys).
- Lines model is claude-haiku-5-5 first (median first voice about 5.6 s vs 6.8 s with opus); judge stays opus (14/15 on the judge test).
- Judge test runner (`shared/judgeCheck.ts`) is shared by `/dev/test` and `scripts/test-judge.ts`.
- Server TTS manifest keys are sha1 including the TTS model, so pre-generated clips are only used when `TTS_MODEL` matches the one used by `gen:audio`.
**Why:** hackathon demo; must never show an error in the classroom.

## Standing rule: assets
- Never generate assets (images, avatars, pre-recorded audio, any file) with the user's personal ANTHROPIC_API_KEY or OPENAI_API_KEY. Use Replit's built-in models for assets, or ask the user to make them.
**Why:** user stated this directly after learning avatar and clip generation had used their OpenAI key (billed, with retries).
**How to apply:** do not run `gen:audio` or `gen:avatars` (or any new asset script) while only personal keys exist. Runtime AI calls (judge, kid lines, live voices, speech-to-text) still use the personal keys until the user says otherwise.

## Interactivity (expressions and raised hands)
- Kids show faces by state: confused (lost), neutral, happy (got it), eager (hand up); Yazan keeps bored/neutral/happy plus eager. Expression images were made with Replit's built-in image editing from the neutral portraits (allowed by the asset rule).
- Raised hands: client timer raises a hand when idle (Omar first); teacher clicks the kid to call on them; `POST /lessons/:id/call-on` streams one question line. The question is held in memory (`pendingQuestion`) and fed to the next judge and lines call. Not saved to the DB, so review and replay do not show it.
**Why:** keeps judge, scoring and replay tables unchanged. Spontaneous hands are off in stage mode (`?demo=1`) so the scripted demo timing is not disturbed.
