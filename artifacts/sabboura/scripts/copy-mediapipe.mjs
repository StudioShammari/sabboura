// Stand-up mode: copy MediaPipe's wasm files from node_modules into public/mediapipe/wasm, so the app serves them itself
// (no third-party CDN). The two model files live in public/mediapipe and are committed. Runs before dev and build.
import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const pkgDir = dirname(require.resolve('@mediapipe/tasks-vision'));
const from = join(pkgDir, 'wasm');
const to = join(root, 'public', 'mediapipe', 'wasm');
mkdirSync(to, { recursive: true });
let copied = 0;
for (const f of ['vision_wasm_internal.js', 'vision_wasm_internal.wasm', 'vision_wasm_nosimd_internal.js', 'vision_wasm_nosimd_internal.wasm']) {
  const a = join(from, f), b = join(to, f);
  if (existsSync(b) && statSync(b).size === statSync(a).size) continue;
  copyFileSync(a, b);
  copied++;
}
console.log(`[mediapipe] wasm ready in public/mediapipe/wasm (${copied} copied)`);
