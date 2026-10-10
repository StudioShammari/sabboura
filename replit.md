# Sabboura (سبّورة)

A flight simulator for teachers: practise a lesson on a class of five AI kids. Full spec in docs/SPEC.md; data in data/*.json.

## Sabboura rules (keep)
1) Source of truth: docs/SPEC.md (Part B) and data/*.json. Build only what they say. No login, accounts or payments.
2) Keep the default template (React + Vite web app, Express API, Postgres + Drizzle). Relative /api URLs.
3) Model ids come ONLY from env: CLAUDE_JUDGE_MODELS, CLAUDE_LINES_MODELS, CLAUDE_SCORER_MODELS, STT_MODEL, TTS_MODEL, IMAGE_MODEL. Never hardcode or "fix" them. claude-opus-5-5 is real even if your list doesn't show it.
4) Claude calls: no thinking parameter, no assistant prefill, no forced tool_choice. output_config {effort:'low', format: json schema} (no effort for claude-haiku-4-5). maxRetries 0; we retry ourselves.
5) Voices = OpenAI chat completions with gpt-audio-mini and audio output. NOT audio.speech, NOT the ElevenLabs connector, NOT browser speechSynthesis. If a voice fails, show the caption only. This is intended.
6) Transcription: send webm/mp4 unchanged. Do NOT convert with ffmpeg.
7) Never store voice recordings. No Permissions-Policy header that blocks the microphone.
8) Never show an error message in the classroom; use the fail-safes in SPEC B3.7.
9) Never generate assets (images, avatars, pre-recorded audio) with the user's personal API keys. Use Replit built-in models, or ask the user to make them.
9) Arabic: letter-spacing 0, Western digits, signed numbers and maths in <bdi dir="ltr">.
10) Status colours only on kid badges (SPEC B1.1). No confetti on the review page.
11) The /turn route streams SSE and is read with fetch + a stream reader; don't replace it with a generated hook or EventSource.
12) Uploaded files (PDF, photo, pasted text) are never stored or written to disk. Keep only the generated pack JSON in the `packs` table.
13) The plan checklist never changes the score. It runs beside the scorer and only reports.
14) Never show which kid holds which mistake before the end reveal. The Plan page shows nameless quotes and personality lines only.
15) Class settings change conditions only (size, group, language mix, exam focus), never kids' abilities. The default setting stays byte-identical.
16) Stand-up mode: the camera stays on the device, nothing is recorded, body language notes are never scored, and normal mode stays unchanged.
