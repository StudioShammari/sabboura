/** Pre-generate the clips every lesson needs. Usage: pnpm run gen:audio [-- --only=<key-prefix>] [--force] */
import fs from 'node:fs';
import path from 'node:path';
import { KID_IDS, canned, chorusFor, expandT, kidById, topics, type KidId, type Lang, type Title } from '../shared/data';
import { PRE_DIR, VOICES, synthesize, ttsKey } from '../server/ai/tts';

const only = process.argv.find((a) => a.startsWith('--only='))?.slice(7);
const force = process.argv.includes('--force');
const LANGS: Lang[] = ['ar', 'en'];
const TITLES: Title[] = ['miss', 'sir'];

const clips = new Map<string, { kid: KidId; lang: Lang; say: string }>();
const add = (kid: KidId, lang: Lang, say: string) => { clips.set(ttsKey(kid, lang, say), { kid, lang, say }); };
const lineSay = (l: { ar: string; en: string; say_ar?: string; say_en?: string }, lang: Lang, t: Title) => expandT(l[lang === 'ar' ? 'say_ar' : 'say_en'] ?? l[lang], lang, t);

for (const lang of LANGS) {
  for (const t of TITLES) for (const k of KID_IDS) add(k, lang, chorusFor(lang, t));
  for (const k of KID_IDS) add(k, lang, kidById(k).failsafe[lang]);
  for (const t of TITLES) {
    for (const topic of topics) for (const k of ['omar', 'sara', 'khaled'] as KidId[]) { const l = canned.starters[topic.id]?.[k]; if (l) add(k, lang, lineSay(l, lang, t)); }
    for (const k of ['omar', 'sara', 'khaled'] as KidId[]) add(k, lang, lineSay(canned.reasons.aha, lang, t));
    add('lina', lang, lineSay(canned.reasons.aha_lina, lang, t));
    add('lina', lang, lineSay(canned.reasons.timid_yes, lang, t));
    add('yazan', lang, lineSay(canned.reasons.bored, lang, t));
  }
  for (const topic of topics) { const l = canned.answer_lost[topic.id]?.lina; if (l) add('lina', lang, lineSay(l, lang, 'miss')); }
}

fs.mkdirSync(PRE_DIR, { recursive: true });
const mfPath = path.join(PRE_DIR, 'manifest.json');
const manifest: Record<string, { url: string; text: string; voice: string }> = fs.existsSync(mfPath) ? JSON.parse(fs.readFileSync(mfPath, 'utf8')) : {};
for (const [key, c] of clips) if (fs.existsSync(path.join(PRE_DIR, `${key}.mp3`))) manifest[key] = { url: `/audio/pre/${key}.mp3`, text: c.say, voice: VOICES[c.kid] };
const todo = [...clips].filter(([key]) => (!only || key.startsWith(only)) && (force || !fs.existsSync(path.join(PRE_DIR, `${key}.mp3`))));
console.log(`${clips.size} clips wanted, ${todo.length} to generate`);

const failed: string[] = [];
let n = 0;
await Promise.all(Array.from({ length: 3 }, async () => {
  for (let it = todo.shift(); it; it = todo.shift()) {
    const [key, c] = it;
    try {
      const b64 = await synthesize(c.kid, c.lang, c.say);
      fs.writeFileSync(path.join(PRE_DIR, `${key}.mp3`), Buffer.from(b64, 'base64'));
      manifest[key] = { url: `/audio/pre/${key}.mp3`, text: c.say, voice: VOICES[c.kid] };
      fs.writeFileSync(mfPath, JSON.stringify(manifest, null, 1));
      console.log(`ok ${++n} ${c.kid} ${c.lang} ${c.say.slice(0, 40)}`);
    } catch (e) {
      failed.push(`${key} ${c.kid} ${c.lang} "${c.say}" :: ${(e as Error).message}`);
    }
  }
}));
fs.writeFileSync(mfPath, JSON.stringify(manifest, null, 1));
if (failed.length) { console.log(`\n${failed.length} FAILED (re-run, or --only=<key>):`); failed.forEach((f) => console.log(' ', f)); process.exit(1); }
console.log('Done. Listen to the chorus and fail-safe clips before keeping them.');
process.exit(0);
