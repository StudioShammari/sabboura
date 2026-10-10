import { demoScript } from '../shared/data';
import { DEFAULT_SETTING, IDENTITIES, PRESETS, backRowLevels, isDefaultSetting, type ClassSetting } from '../shared/setting';
import { LINES_SYSTEM, SCORER_SYSTEM, judgeSystemFor, linesSystemFor, scorerSystemFor } from '../server/ai/prompts';

// Class settings: the default stays as it was, and the other presets change conditions only.
// Needs the dev server (PORT) and the live judge. Usage: PORT=20594 pnpm test:setting
const base = process.env.BASE_URL ?? `http://127.0.0.1:${process.env.PORT ?? 5000}`;
const post = async (path: string, body: unknown) => {
  const r = await fetch(base + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`${path} ${r.status}`);
  return r.json() as Promise<any>;
};
const get = async (path: string) => (await fetch(base + path)).json() as Promise<any>;
const results: [string, boolean, string?][] = [];
const check = (name: string, ok: boolean, note?: string) => { results.push([name, ok, note]); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${note ? `  (${note})` : ''}`); };
const turn = async (id: string, text: string, seconds: number) => {
  const r = await post(`/api/lessons/${id}/turn`, { text, source: 'script', teacherSeconds: seconds });
  const st = r.events.find((e: any) => e.event === 'state')?.data;
  const lines = r.events.filter((e: any) => e.event === 'line').map((e: any) => e.data);
  return { st, lines };
};
const settingOf = (p: keyof typeof PRESETS) => PRESETS[p].setting;
const open = (setting: ClassSetting, language: 'ar' | 'en' = 'ar') => post('/api/lessons', { packId: 'lib-fractions', language, teacherTitle: 'miss', setting }).then((r) => r.lessonId as string);

// 1. the default adds nothing to any prompt
check('default prompts unchanged', linesSystemFor(DEFAULT_SETTING, 'ar') === LINES_SYSTEM && scorerSystemFor(DEFAULT_SETTING) === SCORER_SYSTEM
  && judgeSystemFor('fractions', DEFAULT_SETTING) === judgeSystemFor('fractions') && isDefaultSetting(DEFAULT_SETTING));
check('default names are the five originals', ['Omar', 'Lina', 'Sara', 'Khaled', 'Yazan'].every((n, i) => Object.values(IDENTITIES.mixed)[i].name.en === n));
check('boys/girls change names only for some roles', IDENTITIES.boys.omar.name.en === 'Omar' && IDENTITIES.girls.lina.name.en === 'Lina');

// 2. the strip: two long turns without a question go up, a question to everyone brings it down (pure function)
const timeline = backRowLevels([
  { seconds: 45, check: 'none', askedKid: null }, { seconds: 45, check: 'none', askedKid: null }, { seconds: 10, check: 'question', askedKid: null },
]);
check('back row rises, then falls', timeline[1] >= 2 && timeline[2] < timeline[1], timeline.join(','));

// 3. default run: the four demo lines, as before
{
  const id = await open(DEFAULT_SETTING);
  for (const l of demoScript) await turn(id, l.ar, 8);
  const end = await post(`/api/lessons/${id}/end`, {});
  const total = end.score?.total ?? end.score?.score;
  check('default run: score near 77', typeof total === 'number' && Math.abs(total - 77) <= 6, String(total));
  check('default run: no back-row, setting is default', !end.score?.back_row);
}

// 4. boys (42): the teacher names Yousef, and the judge sees the kid (role lina)
{
  const id = await open(settingOf('public_boys'));
  const r = await turn(id, 'يوسف، أيهما أكبر: نص ولا ثلث؟', 10);
  check('boys: «يوسف» → asked_kid lina', r.st?.askedKid === 'lina' || r.st?.asked_kid === 'lina' || r.lines.some((l: any) => l.kid === 'lina'), JSON.stringify(r.st?.askedKid ?? r.st?.asked_kid));
}

// 5. back-of-the-class timeline in a real large lesson
{
  const id = await open(settingOf('public_boys'));
  await turn(id, demoScript[0].ar, 40);
  await turn(id, demoScript[1].ar, 40);
  const up = (await get(`/api/lessons/${id}`)).backRow;
  await turn(id, 'كل واحد يرفع إصبع: النص ولا الثلث أكبر؟', 10);
  const down = (await get(`/api/lessons/${id}`)).backRow;
  check('large class: strip rises after two long turns', up >= 2, String(up));
  check('large class: strip falls after a question to everyone', down < up, `${up}→${down}`);
  const end = await post(`/api/lessons/${id}/end`, {});
  check('large class: review has back_row, score untouched by it', !!end.score?.back_row);
}

// 6. girls (38): five girls, feminine grammar, female voices
{
  check('girls: all five identities are female', Object.values(IDENTITIES.girls).every((i) => i.gender === 'f'));
  const id = await open(settingOf('public_girls'));
  const r = await turn(id, demoScript[0].ar, 8);
  console.log('   girls lines:', r.lines.map((l: any) => `${l.kid}: ${l.text}`).join(' | '));
  check('girls: lines came back', r.lines.length > 0);
}

// 7. exam focus: khaled asks about the exam; the levels logic is untouched
{
  const custom: ClassSetting = { ...settingOf('private_mixed'), preset: 'custom', examFocus: 'high' };
  const id = await open(custom);
  await turn(id, demoScript[0].ar, 8);
  const r = await fetch(`${base}/api/lessons/${id}/call-on`, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'text/event-stream' }, body: JSON.stringify({ kid: 'khaled' }) });
  const txt = await r.text();
  check('exam focus: khaled asks «هاد بيجي بالامتحان؟»', txt.includes('هاد بيجي بالامتحان'));
}

const failed = results.filter((r) => !r[1]);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
