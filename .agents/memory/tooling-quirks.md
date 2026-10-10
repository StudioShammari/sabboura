---
name: Tooling quirks
description: Environment gotchas hit while building Sabboura
---
- Dev server listens on `$PORT` (not 5000); screenshot with `port` param.
- Call drizzle-kit directly; `pnpm run db:push -- --force` is rejected.
- Scaffold has no pnpm workspace root script; use `pnpm --filter @workspace/sabboura run ...`.
- No "api" artifact type; the Express server lives inside the web artifact.
- Prod server serves index.html only for `/` or Accept: text/html (health check hits `/`).
- Anthropic structured-output schemas reject `type: [..]` combined with `enum` including null; use `anyOf`. A 400 mentioning output_config flips the global text-mode fallback, which silently breaks judging.
- gpt-audio-mini answers the script instead of reading it unless the user message itself says to read it aloud verbatim; keep the transcript-overlap check.
- OpenAI client timeout is 8 s; image generation needs a per-request timeout. Long scripts must run with `setsid` or in the foreground; plain background jobs get killed when the shell call ends.
