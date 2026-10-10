---
name: Tooling quirks
description: Environment gotchas hit while building Sabboura
---
- Dev server listens on `$PORT` (not 5000); screenshot with `port` param.
- Call drizzle-kit directly; `pnpm run db:push -- --force` is rejected.
- Scaffold has no pnpm workspace root script; use `pnpm --filter @workspace/sabboura run ...`.
- No "api" artifact type; the Express server lives inside the web artifact.
- Prod server serves index.html only for `/` or Accept: text/html (health check hits `/`).
