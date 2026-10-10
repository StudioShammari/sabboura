/** Generate kid portraits once. Usage: pnpm run gen:avatars [-- --only=lina-happy]. Never run at runtime. */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { toFile } from 'openai';
import { models, withOpenAI } from '../server/ai/clients';

const OUT = path.resolve(import.meta.dirname, '../public/avatars');
const ANCHOR = path.resolve(import.meta.dirname, '../generated-artifacts/anchor.b64');
const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7);

const STYLE = 'Warm picture-book illustration for a learning app. Flat colours with one soft shadow tone each, a clean even dark-brown outline (#2B2118) around every shape. Simple rounded shapes, no sharp points. No gradients, texture, 3D or photo-realism. Big friendly eyes with one highlight, small nose and mouth, head about 45% of body height. Natural warm skin tones. Modern school. No traditional costume, keffiyeh or flags. No text, letters, numbers, logos or emblems. Background: one flat colour #EFE2CB.';
const UNIFORM = 'Uniform: navy V-neck sweater (boys) or navy pinafore (girls) over a light-blue collared shirt. No red, amber, teal or terracotta on any clothing.';
const CAST: Record<string, string> = {
  omar: 'Omar: boy, spiky black hair, medium olive skin, confident grin.',
  lina: 'Lina: girl, dark-brown low ponytail with a light-blue clip, light olive skin, shy.',
  sara: 'Sara: girl, white school hijab, warm medium-brown skin, one eyebrow raised.',
  khaled: 'Khaled: boy, curly dark hair, light-tan skin, sleeves pushed up, wristwatch.',
  yazan: 'Yazan: boy, side-parted brown hair, round glasses, medium olive skin.',
};
const STATES: Record<string, string[]> = { omar: ['neutral', 'happy'], lina: ['neutral', 'happy'], sara: ['neutral', 'happy'], khaled: ['neutral', 'happy'], yazan: ['neutral', 'happy', 'bored'] };
const model = process.env.IMAGE_MODEL?.trim() || 'gpt-image-2';

async function toWebp(b64: string, file: string, size?: number) {
  let img = sharp(Buffer.from(b64, 'base64'));
  if (size) img = img.resize(size, size, { fit: 'cover' });
  await img.webp({ quality: 82 }).toFile(path.join(OUT, file));
}
async function generate(prompt: string, size: '1024x1024' | '1536x1024') {
  for (const m of [model, 'gpt-image-1']) {
    try {
      const r = await withOpenAI((c) => c.images.generate({ model: m, prompt, size, n: 1 } as any));
      const b64 = r.data?.[0]?.b64_json;
      if (b64) return b64;
    } catch (e) { console.warn(`  ${m} failed: ${(e as Error).message}`); }
  }
  throw new Error('image generation failed');
}
async function edit(anchor: Buffer, prompt: string) {
  for (const m of [model, 'gpt-image-1']) {
    try {
      const r = await withOpenAI(async (c) => c.images.edit({ model: m, image: await toFile(anchor, 'anchor.png', { type: 'image/png' }), prompt, size: '1024x1024', n: 1 } as any));
      const b64 = r.data?.[0]?.b64_json;
      if (b64) return b64;
    } catch (e) { console.warn(`  edit ${m} failed: ${(e as Error).message}`); }
  }
  return null;
}

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.dirname(ANCHOR), { recursive: true });
const want = (name: string) => !only || name === only || name === 'class' && only === 'class';

if (want('class')) {
  console.log('class');
  const b64 = await generate(`${STYLE} ${UNIFORM} Five school children sitting at desks, waist up, facing the viewer, in a friendly row. ${Object.values(CAST).join(' ')}`, '1536x1024');
  await toWebp(b64, 'class.webp');
  fs.writeFileSync(ANCHOR, b64);
}
const anchorB64 = fs.existsSync(ANCHOR) ? fs.readFileSync(ANCHOR, 'utf8') : null;
for (const [kid, states] of Object.entries(STATES)) {
  for (const st of states) {
    const name = `${kid}-${st}`;
    if (!want(name) || (only && only === 'class')) continue;
    console.log(name);
    const expr = st === 'neutral' ? 'a calm neutral expression' : st === 'happy' ? 'a big happy smile, eyes bright' : 'a bored, half-lidded look, chin on hand';
    let b64: string | null = null;
    if (anchorB64) b64 = await edit(Buffer.from(anchorB64, 'base64'), `Keep exactly the same face, hair and uniform as ${CAST[kid]} from the class picture. Show only that child as a centred head-and-shoulders portrait, ${expr}. Change only the expression. ${STYLE}`);
    b64 ??= await generate(`${STYLE} ${UNIFORM} Head and shoulders portrait, centred, ${CAST[kid]} Expression: ${expr}.`, '1024x1024');
    await toWebp(b64, `${name}.webp`, 512);
  }
}
console.log('Done. Check the uniform and the mixed class with a Jordanian teacher.');
process.exit(0);
