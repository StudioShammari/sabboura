import { z } from 'zod';

export const PACK_SYSTEM = `You prepare a practice lesson for Sabboura, a simulator where a teacher practises on five AI kids. You receive the teacher's material for ONE lesson and the lesson language. Write everything the teacher or kids will read in the LESSON LANGUAGE, even if the material is in another language. Base everything on the material; never contradict it.
- usable: false if it is not a lesson (blank, unreadable, a photo of people, unrelated); then return empty strings, empty arrays and nulls everywhere else.
- library_topic_id: "fractions" (comparing fractions), "negatives" (negative numbers) or "photosynthesis" ONLY if the material's main idea is exactly that topic, else null. If not null, set kids to null.
- title (≤6 words), title_en (English, ≤6 words), subject, grade (e.g. "4" or "7-8"), vocab (8–14 key words, comma-separated; for Arabic lessons also the main English terms).
- objective: one sentence starting "By the end, students can" / "في نهاية الحصة، يستطيع الطلاب".
- steps: exactly 5, in this order, each ≤18 words and specific to THIS material (its own numbers and examples): explain (the main idea WITH its reason), example (one real-life example or model, Jordanian everyday life where natural), check (one real question that needs an answer, in quotes), include (ask Lina, a quiet student, a short real question by name), challenge (a harder question for Yazan). In Arabic write steps as noun phrases ("شرح السبب: …"، "سؤال تحقق: «…»"), never commands.
- trouble_spots: exactly 3 short quotes of what a confused kid might say, matching omar's, lina's and sara's misconceptions, in kid language, without names.
- kids, each one FIXED slot: omar = the most common misconception about the main idea (research-known where possible), held confidently; lina = a second, more basic misconception a shy kid would never say out loud, fixed by making the idea concrete (picture, model, diagram, number line, object, everyday meaning); sara = knows the rule or fact from the material but not WHY; khaled = can't see where it's used in real life; yazan = already understands and needs a harder challenge.
  For each kid: misconception, helped_if (what the teacher must SAY to fix it, specific enough to check against a transcript), hurt_if (what makes it worse) — these three in ENGLISH; reveal (lesson language, ≤25 words: what the kid thought, then what would have reached them); next_check (lesson language: one question for next lesson, addressed to the kid; in Arabic use Jordanian dialect and the kid's gender: omar, khaled, yazan are boys; lina, sara are girls).
  Fixed patterns: sara misconception "Memorised <the rule> with no idea why.", helped_if "Gives the REASON (<the reason>), not only the rule.", hurt_if "Says 'just memorise it' or only repeats the rule."; khaled misconception "Can't see why <the topic> matters in real life.", helped_if "Uses a concrete real-life example (<two examples>).", hurt_if "Says it only matters for the exam."; yazan misconception "Already understands. Gets bored when the basics are repeated.", helped_if "Gives a harder challenge (e.g. <one>) or asks him to explain to the class.", hurt_if "Repeats the basics with nothing new."
No emojis. Return only JSON that matches the schema.`;

const KID = z.object({ misconception: z.string(), helped_if: z.string(), hurt_if: z.string(), reveal: z.string(), next_check: z.string() });
export const PackOut = z.object({
  usable: z.boolean(),
  library_topic_id: z.enum(['fractions', 'negatives', 'photosynthesis']).nullable(),
  title: z.string(), title_en: z.string(), subject: z.string(), grade: z.string(), vocab: z.string(), objective: z.string(),
  steps: z.array(z.object({ kind: z.enum(['explain', 'example', 'check', 'include', 'challenge']), text: z.string() })),
  trouble_spots: z.array(z.string()),
  kids: z.object({ omar: KID, lina: KID, sara: KID, khaled: KID, yazan: KID }).nullable(),
});
export type PackOut = z.infer<typeof PackOut>;

const kidSchema = {
  type: 'object',
  properties: { misconception: { type: 'string' }, helped_if: { type: 'string' }, hurt_if: { type: 'string' }, reveal: { type: 'string' }, next_check: { type: 'string' } },
  required: ['misconception', 'helped_if', 'hurt_if', 'reveal', 'next_check'],
  additionalProperties: false,
};
export const PACK_JSON_SCHEMA = {
  type: 'object',
  properties: {
    usable: { type: 'boolean' },
    library_topic_id: { anyOf: [{ type: 'string', enum: ['fractions', 'negatives', 'photosynthesis'] }, { type: 'null' }] },
    title: { type: 'string' }, title_en: { type: 'string' }, subject: { type: 'string' }, grade: { type: 'string' }, vocab: { type: 'string' }, objective: { type: 'string' },
    steps: { type: 'array', items: { type: 'object', properties: { kind: { type: 'string', enum: ['explain', 'example', 'check', 'include', 'challenge'] }, text: { type: 'string' } }, required: ['kind', 'text'], additionalProperties: false } },
    trouble_spots: { type: 'array', items: { type: 'string' } },
    kids: {
      anyOf: [
        { type: 'object', properties: { omar: kidSchema, lina: kidSchema, sara: kidSchema, khaled: kidSchema, yazan: kidSchema }, required: ['omar', 'lina', 'sara', 'khaled', 'yazan'], additionalProperties: false },
        { type: 'null' },
      ],
    },
  },
  required: ['usable', 'library_topic_id', 'title', 'title_en', 'subject', 'grade', 'vocab', 'objective', 'steps', 'trouble_spots', 'kids'],
  additionalProperties: false,
};
