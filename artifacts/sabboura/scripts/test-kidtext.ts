import { KID_IDS, libraryTopics, topicById, type KidId } from '../shared/data';
import { DEFAULT_SETTING, PRESETS, classAddress, fixClassAddress, kidText, scorerConditions } from '../shared/setting';
import { fallbackFeedback } from '../server/ai/scorer';
import { PLAN_CHECK_SYSTEM, checkPlanCode, planCheckSystemFor } from '../server/plan/checkPlan';
import { PackOut } from '../server/packs/prompt';
import { buildInfo } from '../server/packs/build';

// Kid texts (reveal, next_check, feedback tips) follow the gender of the kid shown in the class. Offline, no server needed.
const results: [string, boolean][] = [];
const check = (name: string, ok: boolean, note?: string) => { results.push([name, ok]); console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${note ? `  (${note})` : ''}`); };
const boys = PRESETS.public_boys.setting, girls = PRESETS.public_girls.setting;

// 1. Default class: today's Arabic text, byte for byte.
let same = true;
for (const t of libraryTopics) for (const k of KID_IDS) for (const f of ['reveal', 'next_check'] as const) {
  if (kidText(k, t.kids[k][f], DEFAULT_SETTING, 'ar') !== t.kids[k][f].ar) same = false;
}
check('default class shows exactly the stored Arabic text', same);

// 2. Every kid line has both forms and one of them equals ar.
let both = true;
for (const t of libraryTopics) for (const k of KID_IDS) for (const f of ['reveal', 'next_check'] as const) {
  const x = t.kids[k][f];
  if (!x.ar_m || !x.ar_f || (x.ar_m !== x.ar && x.ar_f !== x.ar)) both = false;
}
check('library: ar_m and ar_f on every reveal and next_check, one equals ar', both);

// 3. English is neutral.
let neutral = true;
for (const t of libraryTopics) for (const k of KID_IDS) for (const f of ['reveal', 'next_check'] as const) {
  if (/\b(he|she|him|her|his|hers)\b|\b(he|she)'d\b/i.test(t.kids[k][f].en)) neutral = false;
}
check('library English reveal and next_check have no he/she/him/her', neutral);

// 4. Boys' class: Yousef (lina) and Saif (sara) are boys.
const fr = topicById('fractions');
check('boys: «يوسف، وين بتحط…»', kidText('lina', fr.kids.lina.next_check, boys, 'ar') === 'وين بتحط 1/3 على خط من 0 لـ 1؟');
check('boys: Yousef reveal is masculine', kidText('lina', fr.kids.lina.reveal, boys, 'ar').startsWith('كان شايف'));
// 5. Girls' class: Rahaf, Dana and Jana are girls.
for (const k of ['omar', 'khaled', 'yazan'] as KidId[]) {
  const r = kidText(k, fr.kids[k].reveal, girls, 'ar');
  check(`girls: ${k} reveal is feminine`, /^(كانت|ما كانت)/.test(r), r.slice(0, 24));
  check(`girls: ${k} English says they/them`, !/\b(he|him|his)\b/i.test(kidText(k, fr.kids[k].reveal, girls, 'en')));
}

// 6. Feedback tips (scorer fallback).
const score: any = { focus_move: 'lina', topic_id: 'fractions', final_levels: { omar: 0, lina: 0, sara: 0, khaled: 0, yazan: 0 }, moves: [{ key: 'reached', points: 0 }] };
const tipB = fallbackFeedback(score, 'ar', boys).one_tip;
check('boys: lina tip says «باسمه» and «يقدر يجاوبه»', tipB.includes('ليوسف') && tipB.includes('باسمه') && tipB.includes('يقدر يجاوبه'), tipB);
check('default: lina tip unchanged', fallbackFeedback(score, 'ar', DEFAULT_SETTING).one_tip === 'المرة القادمة: سؤال للينا باسمها من بداية الدرس، تقدر تجاوبه بكلمتين.');
check('boys: lina fallback try_saying masculine', fallbackFeedback(score, 'ar', boys).try_saying === 'وين بتحط 1/3 على خط من 0 لـ 1؟');
check('English lina tip is neutral', fallbackFeedback(score, 'en', DEFAULT_SETTING).one_tip.includes('they can answer'));
const yz = fallbackFeedback({ ...score, focus_move: 'yazan' }, 'ar', girls).one_tip;
check('girls: yazan tip feminine («جنى كانت فاهمة»)', yz.startsWith('جنى كانت فاهمة'), yz);
check('English yazan tip: «Give them a harder one»', fallbackFeedback({ ...score, focus_move: 'yazan' }, 'en', girls).one_tip.includes('Give them a harder one'));

// 7. Plan vs lesson "next time" lines.
const plan = { goal: 'g', steps: [{ kind: 'include' as const, text: 'سؤال للينا باسمها' }, { kind: 'check' as const, text: 'سؤال' }] };
const rows = checkPlanCode({ language: 'ar', topicId: 'fractions', plan, turns: [], setting: boys }).rows;
check('plan check, boys: include row «يوسف، وين بتحط…»', rows[0].next_time === 'يوسف، وين بتحط 1/3 على خط من 0 لـ 1؟', String(rows[0].next_time));
const rowsG = checkPlanCode({ language: 'ar', topicId: 'fractions', plan, turns: [], setting: girls }).rows;
check('plan check, girls: check row uses the feminine «عرفتي»', rowsG[1].next_time?.includes('عرفتي') === true, String(rowsG[1].next_time));

// 8. Packs: old shape still works; new shape keeps both forms.
const kid = { misconception: 'm', helped_if: 'h', hurt_if: 'x', reveal: 'كان فاهم', next_check: 'كيف عرفت؟' };
const out = (extra: object) => PackOut.parse({
  usable: true, library_topic_id: null, title: 'درس', title_en: 'Lesson', subject: 's', grade: '5', vocab: 'v', objective: 'o',
  steps: [1, 2, 3, 4, 5].map((i) => ({ kind: ['explain', 'example', 'check', 'include', 'challenge'][i - 1], text: `t${i}` })), trouble_spots: ['a', 'b', 'c'],
  kids: Object.fromEntries(KID_IDS.map((k) => [k, { ...kid, ...extra }])),
});
const old = buildInfo(out({}), 'p-old', 'ar', null).topic!;
check('old pack (no gendered forms) falls back to ar', kidText('lina', old.kids.lina.reveal, boys, 'ar') === 'كان فاهم');
const neu = buildInfo(out({ reveal_ar_m: 'كان فاهم', reveal_ar_f: 'كانت فاهمة', next_check_ar_m: 'كيف عرفت؟', next_check_ar_f: 'كيف عرفتي؟' }), 'p-new', 'ar', null).topic!;
check('new pack: girls get the feminine form', kidText('omar', neu.kids.omar.reveal, girls, 'ar') === 'كانت فاهمة' && kidText('omar', neu.kids.omar.next_check, girls, 'ar') === 'كيف عرفتي؟');
const en = buildInfo(out({ reveal_ar_m: '', reveal_ar_f: '' }), 'p-en', 'en', null).topic!;
check('English pack: blank forms ignored', !('ar_m' in en.kids.omar.reveal));

// 9. «يا شباب» in a girls' class.
const addr = 'لاحظوا يا شباب: كلما زاد عدد القطع صغرت كل قطعة.';
check('girls: «يا شباب» becomes «يا بنات»', fixClassAddress(addr, girls) === 'لاحظوا يا بنات: كلما زاد عدد القطع صغرت كل قطعة.');
check('boys and mixed: «يا شباب» stays', fixClassAddress(addr, boys) === addr && fixClassAddress(addr, DEFAULT_SETTING) === addr);
check('classAddress empty for default and boys, set for girls', classAddress(DEFAULT_SETTING) === '' && classAddress(boys) === '' && classAddress(girls).includes('يا بنات'));
check('plan check prompt: default and boys unchanged, girls add the note', planCheckSystemFor(DEFAULT_SETTING) === PLAN_CHECK_SYSTEM && planCheckSystemFor(boys) === PLAN_CHECK_SYSTEM && planCheckSystemFor(girls).includes('يا بنات'));
check('scorer conditions carry the note for girls only', scorerConditions(girls).includes('يا بنات') && !scorerConditions(boys).includes('يا بنات') && scorerConditions(DEFAULT_SETTING) === '');

// 10. photosynthesis, khaled, next_check.ar_f
check('photosynthesis khaled next_check.ar_f uses «أكلتيها»', topicById('photosynthesis').kids.khaled.next_check.ar_f?.includes('أكلتيها') === true);

const failed = results.filter((r) => !r[1]);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
