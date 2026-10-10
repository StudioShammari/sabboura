# Sabboura (سبّورة): Final Idea and Build Spec

> **A flight simulator for teachers.** Practise your lesson on a class of AI kids before you teach real ones.
>
> **Track:** EdTech · **Event:** The AI Hackathon Amman, Oct 10–11, 2026 · **Built 100% on Replit**
>
> Builds on Ahmad's [`Sabboura.md`](Sabboura.md). Research behind this version: 6 research tracks, 3 competing design directions scored by 3 judge lenses (investor, educator, builder).

## How to use this file (read first)

| Who | What to do |
|---|---|
| **Whole team** | Read **Part A** (idea, judges, business, Q&A) and **Part D** (demo runbook) |
| **Replit driver** (one person only) | Upload **this whole file** to the Replit project as `docs/SPEC.md`, then paste the prompts in **Part C** one at a time |
| **Replit Agent** | Builds from **Part B** (design system, screens, architecture, rules, AI prompts, data files) |

- **Agent settings:** Max mode → Primary model **Claude Opus 5.5** → Effort **High**. Details in C1.
- **Rules check:** this file holds a spec, content and prompts, not app code ("Come in with a prompt"). All code gets written on Replit during the event. Confirm at the 10:00 briefing.

**Contents:**
- **Part A, the idea and the pitch:** A1–A7
- **Part B, the build spec:**
  - B0 scope and hard rules
  - B1 design system
  - B2 screens and interactions
  - B3 architecture
  - B4 fixed rules and scoring
  - B5 AI prompts
  - B6 data files
  - B7 avatars
- **Part C, building it on Replit:** C1 settings, C2 handover, C3 prompts P0–P8, C4 schedule
- **Part D, the demo runbook:** roles, run-of-show, cue card, setup, backups, rehearsal, social

---

# PART A. The idea and the pitch

## A1. The idea in one line

**Sabboura** (Levantine Arabic for "blackboard") lets a teacher practise a lesson on a class of five AI kids. Each kid secretly holds one real, well-known mistake. The teacher teaches out loud, the kids react, and an after-lesson review shows which kids the teacher actually reached.

## A2. The problem

- Pilots train in simulators. Teachers practise on real kids, so their first mistakes happen in front of 30 students.
- A teacher's most important skill is finding out what each kid actually thinks. Almost nobody practises it, and most teachers get observed and coached only a few times a year.
- Every Jordanian knows the classic mistake: the teacher asks **"فاهمين؟"**, the class says **"آه مس!"**, and half of them are lost.
- Research backs this up. Rosenshine (2012) found that less effective teachers "simply asked, 'Are there any questions?' and, if there were no questions, they assumed the students had learned the material."
- Jordan has about 150,000 teachers, and the Gulf spends heavily on teacher training and licensing.

## A3. How it works (what the teacher sees)

1. **Pick a lesson** (e.g. "Comparing fractions, Grade 4"), a language (العربية / English) and how the class addresses you (مس / أستاذ / Miss / Sir).
2. **Meet the class.** Five kids, each with one secret mistake from research:

   | Kid | Personality | Secret mistake (fractions) |
   |---|---|---|
   | **Omar** | Confident, often wrong, hand always up | "3 is bigger than 2, so 1/3 is bigger than 1/2" (whole-number bias) |
   | **Lina** | Shy, never volunteers | Sees a fraction as two separate numbers |
   | **Sara** | Literal, always asks "but why?" | Memorised the rule with no reason |
   | **Khaled** | Practical, wants real life | "When will I ever use this?" |
   | **Yazan** | Fast learner, gets bored | Already understands; needs a challenge |

3. **Teach out loud.** Hold the mic button (or Space) and talk for up to 45 seconds. Your words appear on the chalkboard.
4. **The class reacts.**
   - Omar raises his hand with his wrong idea.
   - Sara asks why.
   - Khaled asks for real life.
   - Yazan gets bored.
   - Lina says nothing. Only her badge shows she's lost.
5. **Badges move only when you fix that kid's mistake:** Lost → Partly → Got it. Tap a badge to see the exact words that moved it.
6. **The "فاهمين؟" trap.** Ask "فاهمين؟" and the whole class answers "آه مس!", but no badge moves.
7. **End the lesson** to get a calm after-lesson review with:
   - who you reached;
   - your five teaching moves;
   - one tip, plus a sentence to say next time;
   - the **reveal**: each kid's secret mistake, and what would have reached them.

## A4. Why it isn't "just ChatGPT"

- **The AI never decides by vibe.** The misconceptions come from a fixed library of well-researched mistakes. The AI judge only checks the teacher's words against each kid's fixed checklist, and it must quote the words.
- **Code, not the AI, moves the badges, counts the points and picks the best moment.** The best-moment quote is the teacher's real transcript.
- **It's tested.** A 15-row test sheet (`npm run test:judge`) runs before every demo.
- **One-line version for Q&A:** "The AI judges against a fixed checklist and must quote you; code counts everything."

## A5. The judges and what each needs to hear

Confirmed on the organizers' Instagram.

| Judge | Background | What to show them |
|---|---|---|
| **Dr. Farah Sarraj** | Chief Corporate Officer, Al Futtaim School Management Co. (UAE). Trained teacher (PGCE), MSc Educational Leadership, lectured at a College of Education | The pedagogy is sound (Rosenshine, Wiliam, misconception research), the review is respectful to teachers, and school groups are the buyer |
| **Amer Nasereddin** | VP Investor Relations, Fikr Ventures (EdTech investor) | Business model, scale across MENA |
| **Faisal Kawar** | Venture Partner, FinTech Collective. Formerly at Abraaj (private equity), Harvard MBA | Price vs measured cost per session, who signs the contract, sales cycle |
| **Rana Al Dababneh** | Chief Corporate Comms & Sustainability Officer, Orange Jordan. MD, Orange Foundation Jordan | Impact and inclusion (Lina), public-school access, accessibility (typing mode, captions always on) |
| **Ahmad Malhas** | Background not found yet. Check his Instagram intro | — |

The founders of AILA, Alefredo and Jusoor, Fikr's partners, and Replit's MENA lead are **mentors in the room**. Get their feedback on Day 1; their quotes count as traction.

## A6. Business

| | |
|---|---|
| **First buyer** | Private school groups. One contract covers hundreds of teachers, and they already have training budgets and licensing requirements (strong in the Gulf) |
| **Next** | Education faculties and teacher academies (e.g. Queen Rania Teacher Academy's pre-service diploma), plus new-teacher onboarding at school chains |
| **Public schools** | Free for public-school teachers, paid for by companies' social-impact (CSR) budgets and foundations. That gives impact and a distribution channel |
| **Price (to test)** | About 8 JOD per teacher per month, billed yearly. A 40-teacher school pays about 3,800 JOD a year. Teacher academies pay per trainee per term |
| **Cost to run** | Estimate: about $0.25 per 10-minute session on Claude Opus 5.5 (speech-to-text + AI + voices). At 8 sessions a month, that's about $2 of cost vs about $11 (8 JOD) of revenue per teacher. **Quote only the number measured in the debug panel on Saturday** |
| **The comparison** | Mursion raised about $40M selling classroom simulations to 65+ universities, but a human actor plays every avatar. AI removes the actor: cents per session, in Arabic |
| **What protects us** | A misconception library per curriculum (Jordanian, Gulf, IB) in Arabic, plus data on which explanations actually work |
| **Expansion** | The same engine can simulate any audience: parent meetings and classroom management, then customer service and sales training. Mursion took the same path |
| **For school groups** | A school view (aggregates only, never individual teachers) shows which teaching move the staff miss most |
| **Traction by Sunday** | 10+ real teachers try the deployed link on Saturday night. Collect 3 quotes, a "would you use it?" percentage, and real numbers ("N teachers asked فاهمين؟ M times"), plus mentor feedback from Day 1 |
| **The ask** | "Introductions to 3 school groups for a pilot this term." |

## A7. Q&A prep

**The formula for every answer:** pause 1 second, answer in one sentence, give one proof (a number, a quote, or one tap in the app), then stop. Keep each answer under 20 seconds.

**Who answers what:**
- the presenter: business;
- the builder: AI, latency, cost, Replit;
- the content person: pedagogy.

| Question | Answer |
|---|---|
| "Isn't this just ChatGPT role-play?" | The AI judges against a fixed checklist per kid and must quote you; code moves the badges and counts the points. *(Tap Lina's badge: the quote, +2, turn 4.)* |
| "How do you know the judge is right?" | Each kid has a fixed checklist, like ETS's evidence lists for teaching simulations. Our 15-row test sheet passes. Next step: two teacher trainers rate 20 transcripts, and we publish their agreement with the AI |
| "Do AI kids behave like real kids?" | We don't simulate a whole child, only one well-documented misconception each, which is what teachers need to practise. Studies found AI students too articulate and too attentive, so ours speak in short lines, and one kid stays silent unless asked |
| "Is a 0–100 score fair?" | It scores one practice lesson, not the teacher. That's why England's Ofsted stopped grading single lessons in 2014. The number is the sum of five named moves, each one tappable to your exact words, and the tip always targets the weakest move |
| "Can one explanation fix a misconception?" | "Got it" means reached in this lesson. That's why every reveal card gives a question to check that it stuck in the next real lesson |
| "Isn't calling on a shy child stressful?" | Cold-calling research found that voluntary participation and comfort both rose over time. We reward a real question to Lina, not just saying her name |
| "Why not count teacher talk time?" | Rosenshine's most effective teachers spent over half the lesson presenting and questioning, and our kids' lines are short by design, so a ratio would mislead. We count voices invited instead |
| "What is pre-recorded?" | Only the chorus "آه مس!", the fail-safe lines and each kid's first objection, which are pre-voiced to save seconds. Everything after that reacts live to what you said |
| "Mursion moved to corporate. Doesn't that mean schools won't pay?" | Human actors made it expensive, so they chased big corporate deals. At cents per session, school pricing works, and corporate training is our expansion path too |
| "Will busy teachers use it?" | It sits inside training they already have to do: teacher diplomas, required training hours, new-teacher onboarding. A session takes 10 minutes |
| "Why won't AILA or Alefredo build this?" | They serve students; we serve teachers. We're complementary, and a natural partner |
| "Which framework?" | It's informed by Rosenshine's "check for understanding", Wiliam's formative assessment and TeachingWorks' "eliciting and interpreting student thinking". It also lines up with the IB approaches to teaching. Say "informed by", never "validated" |
| "Accessibility and privacy?" | Captions are always on, there's a typing mode, and a tap mode for people who can't hold a button. We keep your words as text, never your voice |
| "Is it really built on Replit?" | Yes. Offer to show the Replit checkpoint history |
| "What did real users say?" | *(Fill in on Saturday night with quotes and numbers.)* |

If you don't know an answer, say: "We haven't measured that yet. What we do know is X. We'll measure it in the pilot."

---

# PART B. Build spec (Replit Agent: build from this part)

## B0. Scope and hard rules

**Build in this priority order.** Never start a SHOULD before every MUST works.

| Priority | Features |
|---|---|
| **MUST** (Saturday, by 20:00) | Home, classroom (design system, 5 kid cards, badges), voice in, typed turns, the judge + fixed rules, kid lines + voices + chorus + fail-safes, end lesson + after-lesson review + reveal, stage mode (`?demo=1`), warm-up, debug panel, `npm run test:judge`, `npm run gen:audio`, deployed on a Reserved VM |
| **SHOULD** (Saturday night) | Offline replay of a recorded lesson (`/replay/:id`, demo backup), lesson replay table, Meet-the-class intro, lesson-goals strip, Calm mode, `/pitch` panels, share preview (`/s/:id`), avatars with expression variants, phone layout polish |
| **COULD** (only if all else is solid) | "Teach it again" attempt deltas, `/insights` school view, the reveal prediction, `/remote` phone control, print view |
| **WON'T** (this weekend) | Login/accounts, payments, custom topics, video avatars, realtime streaming voice, browser `speechSynthesis` |

**Hard rules.** These also go in `replit.md`; see C2.

1. Source of truth: `docs/SPEC.md` Part B and `data/*.json`. Build only what they say.
2. Keep Replit Agent's default template (React + Vite web app, Express API, Postgres + Drizzle). Use relative `/api` URLs.
3. Model ids come **only** from env vars (B3.2). Never hardcode them or "fix" them. `claude-opus-5-5` is a real model even if the Integrations list doesn't show it.
4. Claude calls: **no `thinking` parameter, no assistant prefill, no forced `tool_choice`**. Use `output_config: { effort: 'low', format: <json schema> }` and `maxRetries: 0` with our own retry.
5. Voices (TTS) = OpenAI **chat completions** with `gpt-audio-mini` and audio output. **Not** `audio.speech`, **not** the ElevenLabs connector, **not** browser `speechSynthesis`. If a voice fails, show the caption only.
6. Transcription: send the webm/mp4 file **unchanged**. **No ffmpeg conversion.**
7. Never store voice recordings; store transcripts only. **No `Permissions-Policy` header that blocks the microphone.**
8. **Never show an error message in the classroom.** Use the fail-safes in B3.7.
9. Arabic: `letter-spacing: 0`, Western digits, and signed numbers or maths inside `<bdi dir="ltr">`.
10. Status colours (red, amber, teal, violet) appear **only on kid badges** (plus red on the recording mic).

---

## B1. Design system: "Chalk & Limestone" (حجر وطبشورة)

**One sentence:** a warm Amman classroom with one dark chalkboard at its centre. The kids are playful, and the coach (everything the teacher reads) is calm and adult.

The screen is a classroom wall in the morning:
- warm limestone background;
- a real olive-green **chalkboard** in a wooden frame, where the teacher's words appear;
- a wooden **chalk ledge** under it, which is the only caption strip (like TV subtitles);
- five illustrated kids at wooden desks below.

The local feeling comes only from things every Arab teacher remembers: stone, chalk, wood, a ruled notebook, the teacher's stamp, the school bell, the mansaf in the lesson, the dialect. **Never** costume, flags, Petra, coffee pots or tiles.

**Three design rules:**
1. **Colour means a kid's state, and nothing else.** Only the badges use status colours. Ink-blue is the only "press me" colour.
2. **The badge is a glass that fills.** Lost = light, empty, dashed. Partly = mid-tone, half full. Got it = dark, solid, full. It works on a washed-out projector, in grayscale and for colour-blind viewers.
3. **Playful class, calm coach.** The kids, desks and board are illustrated. Controls and the review are plain and rubric-like, and **the teacher's score never gets confetti**.

No dark mode. The app is projector-first, with one light theme.

### B1.1 Colour tokens (CSS variables)

**Room and surfaces**

| Token | Hex | Role |
|---|---|---|
| `--limestone` | `#F3EADB` | Page background (the wall) |
| `--limestone-block` | `#EDE2CF` | Faint stone-block pattern (SVG, 120×40 blocks). Decoration only, never behind text |
| `--floor` | `#E6D7BE` | Dock background (the floor); tracks for the score ring and bars |
| `--paper` | `#FFFBF4` | Kid cards, popovers, review panels |
| `--notebook` | `#FDFDF8` | Back of the reveal cards. Rules `#BFD3E6` every 34px; margin line `#E4A0A0` at inline-start |
| `--avatar-bg` | `#EFE2CB` | Flat background inside every avatar, and the initial-letter fallback tile |
| `--ink` | `#2B2118` | All text on light surfaces, outlines, the speaking border |
| `--ink-muted` | `#5E5040` | Hints and secondary text |
| `--line` | `#D8C7AA` | Decorative borders and flat "lip" shadows |
| `--line-strong` | `#8C7A5E` | Input borders |

**Board, wood, chalk**

| Token | Hex | Role |
|---|---|---|
| `--board` | `#2F3E2C` | The chalkboard; the فاهمين؟ panel; `/pitch` panels. **Never put red, blue or teal on it** |
| `--frame` | `#8A5A33` | Board frame, desk lip |
| `--ledge` | `#5C3A20` | The wooden chalk ledge = the caption strip |
| `--desk` | `#B07A47` | Desk plank on each card (decoration only) |
| `--chalk` | `#F4F0E6` | Board text and ledge captions |
| `--chalk-dim` | `#A5A99C` | Small labels on the board (solid colour, never opacity) |
| `--chalk-yellow` | `#F2D27A` | Topic title, tally marks, evidence highlight, chorus stamp. **Never as text on paper** |
| `--sunlight` | `#FFECBE` | The Got-it glow ring (≤35% alpha) |

**Action and recording**

| Token | Hex | Role |
|---|---|---|
| `--action` | `#1F4FA0` | The ONLY "press me" colour: mic (idle), primary buttons, score ring, teacher-move bars, Lina's "unheard" ring, the "Your turn" chip |
| `--action-dark` | `#173B78` | Button lip and pressed state |
| `--record` | `#C8291D` | The whole mic while recording, and the last 10 s of the countdown ring. Always shown with a label |

Illustration-only tokens: `--olive #7D8B4E`, `--terracotta #C46A3F` (windowsill pot only), `--sky #BFD9E6`.

**Understanding badges (Omar, Lina, Sara, Khaled)**

| Level | Arabic (m / f) | Fill | Border | Text + glyph | StateBall |
|---|---|---|---|---|---|
| **0 Lost** | تايه / تايهة | `#FFF1EC` | 3px **dashed** `#B3361F` | `#8C2716` | empty ring ○ |
| **1 Partly** | نص نص | `#F4C55C` | 3px solid `#9A6200` | `#4D3200` | half-filled ◐ |
| **2 Got it** | فاهم / فاهمة | `#0F7B6C` solid | none | white | white disc with teal ✓ |

Use `--gotit-tint #DDF2EC` for the card flood at Got it, and `--gotit-text #0A5C51` for teal text on paper.

**Yazan's engagement badges** (violet, so engagement never looks like understanding)

| Level | Arabic | Fill | Border | Text + glyph |
|---|---|---|---|---|
| **0 Bored** | زهقان | `#F4F1EC` | 3px dashed `#7A7368` | `#3F3A33`, empty ball |
| **1 Waiting** | مستني | `#D8C6F0` | 3px solid `#6B3FA0` | `#3B1C66`, half ball |
| **2 Challenged** | متحمّس | `#4B2580` solid | none | white, full ball with a white Zap icon |

**Hard colour rules:**
- Every state has five cues: lightness, border style, StateBall shape, word and hue.
- Never "fix" Got it to pure green: the red/green pair collapses for colour-blind viewers.
- Teacher moves on the review are **always ink-blue bars**, or a grey "ليس بعد / Not yet" chip at 0.
- No gradients, glass, blurred shadows or dark mode.

### B1.2 Typography

All three families are Google Fonts that cover **both Arabic and Latin**.

| Role | Family | Weights | Used for |
|---|---|---|---|
| **UI and evidence** | Readex Pro | 400, 500, 600, 700 | **Board transcript (the teacher's words)**, buttons, badge words, popovers, all review text |
| **Kid voice** | Baloo Bhaijaan 2 | 600, 700, 800 | Logo, kid names, ledge caption, chorus, stamps, big numbers |
| **Chalk accent** | Playpen Sans Arabic | 700 only | Board topic title, the فاهمين؟ tally label, reveal-card headings, home tagline. **Never the transcript** |

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Readex+Pro:wght@400;500;600;700&family=Baloo+Bhaijaan+2:wght@600;700;800&family=Playpen+Sans+Arabic:wght@700&display=swap" rel="stylesheet">
```

Fallback stack: `'Noto Sans Arabic', Tahoma, system-ui, sans-serif`. Base font size: 18px.

**Projector sizes.** These use `clamp(min, min(Xvw, Yvh), max)`; values are approximate at 1920×1080 / 1280×720.

| Element | Font | Size |
|---|---|---|
| Chorus "آه مس!" and the stamp | Baloo 800 | `clamp(56px, min(7vw,12vh), 136px)` |
| Board transcript (current turn) | Readex 600, chalk | `clamp(24px, min(2vw,3.9vh), 42px)`, line-height 1.6 (Arabic) / 1.4 (English) |
| Ledge caption (speaking kid) | Baloo 700, chalk | `clamp(22px, min(1.9vw,4vh), 44px)`, **2 lines max**, line-height 1.3 |
| Board topic title | Playpen 700, chalk-yellow | `clamp(20px, 2.8vh, 32px)` |
| Kid name | Baloo 700 | `clamp(20px, 3vh, 30px)` |
| Badge word | Readex 700 | `clamp(16px, 2.2vh, 24px)` |
| Score number | Baloo 800 | `clamp(48px, 7vh, 88px)` |
| Buttons | Readex 600 | 18–20px (primary 24px) |
| Review body | Readex 400–500 | 18–20px, line-height 1.7 (Arabic) / 1.5 (English) |
| Minimum anywhere | Readex 500 | 16px; in stage mode, 2.4vh at weight 600 for anything the audience must read |

**Arabic and number rules:**
- `[dir=rtl] * { letter-spacing: 0 !important }`. This removes shadcn's `tracking-tight`, which breaks Arabic letter joins.
- No italics, no uppercase, no weights below 400. Load exactly the weights above.
- **Western digits 0–9 everywhere** (Jordan's Grade 4 maths books use them). Format with `Intl.NumberFormat('ar-JO-u-nu-latn')`, because plain `ar-JO` prints ١٢٣. Convert any ٠–٩ coming from the AI or transcripts to 0–9.
- Draw fractions stacked with a small `<Frac n d>` component.
- Put signed numbers and maths inside `<bdi dir="ltr">`, using U+2212 for minus. Otherwise "+23" shows as "23+".
- Use «» quotes and ؟ in Arabic mode.

### B1.3 Shape, spacing, icons

- **Radius:** cards 24px, avatars 20px, pills fully rounded, buttons 16px.
- **Borders:** 2px `--line` on cards. Lips are flat: `box-shadow: 0 5px 0 var(--line)`. **No blurred shadows.**
- **Spacing:** use vh/vw in the classroom (B2.3); 8px steps elsewhere.
- **Icons:** `lucide-react`, stroke 2.5. Names used: Mic, Hand, AudioLines, Undo2, Keyboard, Check, Zap, Volume2, Maximize, Share2, Info.
- **Never mirror in RTL:** avatars, the logo, clocks or rings, ✓, number lines, maths.
- **Mirror in RTL:** layout order, StateBall half-fill, the Undo2 icon, flip direction, bars.

### B1.4 Motion

**Principles:**
- Only the thing that changed moves.
- No idle loops. Loops run only while recording, waiting, or while that kid's audio plays.
- Animate only `transform` and `opacity`.
- Nothing flashes more than 3 times a second, and no pulse lasts longer than 5 s.

**Tokens:**
- `--ease-standard: cubic-bezier(0.2,0,0,1)`
- `--ease-enter: cubic-bezier(0.05,0.7,0.1,1)`
- `--ease-exit: cubic-bezier(0.3,0,0.8,0.15)`
- `--ease-pop: cubic-bezier(0.34,1.56,0.64,1)`
- Durations: 100 / 200 / 300 / 400 / 600 / 900 / 1200 ms.

**Libraries:**
- `motion` (from `motion/react`): use it only for AnimatePresence and `<MotionConfig reducedMotion="user">`.
- `canvas-confetti`: only for Lina's chalk dust.
- `lucide-react`.

**Key motions:**
- **Mic press:** scale 0.96 within 100 ms. While recording, the whole mic is `--record` with a 1.4 s halo and the label "الصف بسمعك… 0:12" / "The class is listening… 0:12". In the last 10 s it shows "باقي 10 ثواني" / "10 seconds left".
- **Within 100 ms of release:** a "سمعناك ✓" / "Got it ✓" chalk chip on the board, and the kids start "thinking" (avatar tilted 3°, 3 dots hopping above the name). Show the text "الصف عم بفكّر… / The class is thinking…" only if nothing new appeared for 2.5 s.
- **Transcript:** fades in over 300 ms. **No typewriter effect.**
- **Evidence highlight:** the quoted words get a `--chalk-yellow` background mark (`box-decoration-break: clone`) plus 24px mini-avatar tags of the kids they moved.
- **Badge up:**
  - the pill crossfades (300 ms) and the border goes from dashed to solid;
  - the ball fills (300 ms per step) and the ✓ draws in (200 ms);
  - an ink "+1" chip rises 24px and fades (900 ms);
  - several changes play 250 ms apart in reading order.
- **Badge down:** shake ±4px three times (300 ms) with a "−1" chip. No sound.
- **Hands up:** as soon as the judge result arrives, before any voice. 320 ms ease-pop, then a ±10° wave twice. Omar first.
- **Review:** the ring counts up over 1200 ms; the bars fill 600 ms each, 120 ms apart.
- **Reveal flip:** rotateY 180° (−180° in RTL), 600 ms each, 400 ms apart.

**Calm mode and reduced motion:**
- Turned on by `<MotionConfig reducedMotion="user">`, the `prefers-reduced-motion` media query, or the "وضع هادئ / Calm mode" switch.
- In Calm mode: no transforms, confetti or loops; only colour and opacity changes of 150 ms or less; final numbers shown at once; sound effects off.
- `?motion=full` overrides the OS setting on the stage laptop.

### B1.5 Sound effects

Everything is synthesised in one ~40-line `client/src/lib/sfx.ts` on the shared AudioContext. There are no asset files.

| Cue | Recipe | When |
|---|---|---|
| Mic on / off | sine 440→880 Hz / 880→520 Hz, 90 ms | Press / release |
| Chalk tap | 60 ms noise → 3 kHz bandpass, gain 0.12 | Transcript lands |
| Badge up "tok-tik" | sines 880 then 1175 Hz, 70 ms apart, 100 ms decay | Any +1 |
| Got-it chime | triangles C5 523, E5 659, G5 784 Hz, 90 ms apart, 700 ms decay, gain 0.12 | Ball becomes full |
| Tally stroke | 120 ms noise, bandpass sweeping 2.5→4 kHz | Each فاهمين؟ |
| Stamp thud | sine 110→60 Hz over 120 ms + 15 ms click | Chorus stamp, reveal stamps |
| Page flip | 200 ms noise sweeping down | Each reveal card |
| School bell | triangles 1318 + 1976 Hz, 6 Hz tremolo, 900 ms | End lesson |

**Mix:**
- Sound effects stay at least 12 dB under the voices.
- **The chorus is the loudest thing in the demo.**
- No sound for −1, no music.
- The M key mutes sound effects, never voices.

### B1.6 Things to avoid

- Status colours anywhere but the badges.
- Comic speech bubbles over the class. **The ledge is the only caption place**, and kid lines are capped so they fit in 2 lines.
- Handwriting fonts for the teacher's words.
- Chalk-yellow on paper.
- Red on the green board.
- Infinite loops, typewriter text, or a badge turning green before the kid's own voice starts.
- Confetti, XP, streaks, leaderboards or "you failed" about the teacher. **Never** use ضعيف، سيء، فاشل، خطأ about the teacher.
- shadcn defaults: Inter, slate, `tracking-tight` on Arabic, blurred shadows, gradients, glass, dark mode, emoji icons.
- `Intl` with plain `ar-JO`.
- Fixed heights on pills or buttons (Arabic lines are taller).
- Generating images or audio at runtime in production.
- Hand-drawing decor past a **30-minute time-box**. Fix copy, colours and spacing in Replit's Visual Editor instead.

---

## B2. Screens and interactions

All UI text lives in one translations file (`client/src/i18n.ts`). Arabic mode sets `dir="rtl"` on `<html>`, and English sets `ltr`.

### B2.1 Home `/`

- **Background:** the limestone wall, with a big chalkboard reading "درّب حالك قبل ما تدخل الصف" / "Practise your lesson before you teach it" in Playpen 700.
- **Under the board:** `class.webp` (all 5 kids) in a wooden frame; use 5 initial tiles until the avatars exist.
- **Three pill-radio groups:**
  - Topic: مقارنة الكسور / الأعداد السالبة / البناء الضوئي.
  - Language: العربية / English.
  - Class calls you: مس / أستاذ (Arabic), Miss / Sir (English).
- **Primary button (`--action`, 24px):** "ابدأ الحصة / Start lesson".
- **Below it:** a "وضع هادئ / Calm mode" switch (SHOULD).
- **Footer:** a small QR code of the deployed URL, and the line "نحتفظ بكلماتك مكتوبة، مش بصوتك / We keep your words as text, never your voice".

### B2.2 Start lesson: mic and audio unlock (one click does it all)

The "Start lesson" click is the user gesture that makes everything work. It must:

1. Create **one** AudioContext and `resume()` it, then play a 50 ms silent buffer. This unlocks autoplay in Chrome and Safari.
2. Call `getUserMedia({audio:{echoCancellation:true, noiseSuppression:true, autoGainControl:true, channelCount:1}})` **once**, and keep the stream open until End lesson.
3. Fetch and decode the pre-recorded clips for this lesson: chorus, fail-safe lines, starter lines (B3.6).
4. `POST /api/lessons`, then go to `/lesson/:id`.

**Before step 2,** check `navigator.permissions.query({name:'microphone'})` inside try/catch. If the state is `prompt`, show this card first:

| | English | العربية |
|---|---|---|
| Title | Your class needs to hear you | الصف بدّه يسمعك |
| Body | Your browser will ask for the microphone. We keep your words as text, never your voice. | رح يطلب المتصفح إذن المايك. منحفظ كلامك مكتوب بس، مش صوتك. |
| Buttons | Allow microphone · I'll type instead | اسمح للمايك · بكتب بدل ما أحكي |

**Mic errors.** Show friendly cards, never raw errors or red boxes. The typing box is always visible under them.

| Error | English | العربية |
|---|---|---|
| NotAllowedError | The microphone is blocked. Click the icon left of the address bar → Microphone → Allow → reload. [Try again] [Type instead] | المايك مسكّر. اضغط الأيقونة يسار الرابط ← المايكروفون ← سماح ← حدّث الصفحة. [جرّب مرة ثانية] [اكتب بدل] |
| NotFoundError | No microphone found. Plug in a headset, or type. | ما في مايك. وصّل سمّاعة أو اكتب. |
| NotReadableError | Another app (Zoom or Teams) is using the mic. Close it and try again. | المايك مشغول ببرنامج ثاني (زوم أو تيمز). سكّره وجرّب. |

**Replit tip:** the mic may not work inside Replit's Preview pane, which is an iframe. Test in a **new tab** or on the deployed URL.

### B2.3 Classroom `/lesson/:id`

No scrolling at 1920×1080 or 1280×720:

```css
.classroom { height:100dvh; display:grid; padding:1.6vh 2vw; row-gap:1.4vh;
  grid-template-rows: 6.5vh minmax(0,1fr) 37vh 15vh; background:var(--limestone) }
```

**Top bar (6.5vh):**
- inline-start: the logo (a small board mark plus "سبّورة", Baloo 800).
- centre:
  - turn counter "المداخلة 3 / Turn 3";
  - lesson clock "04:12" (tabular digits);
  - class meter "فهموا: 2 من 4 / Reached: 2 of 4", with 4 small circles that fill teal at each Got it.
- inline-end: "خلّص الحصة / End lesson" as an ink outline button, which opens a confirm (B2.8).

**Wall (the remaining height): the board and the ledge.**
- **The board:** full width (max 1200px), with a 10–14px `--frame` border. Inside it:
  - the topic title (Playpen, chalk-yellow);
  - the **فاهمين؟ tally** at the top inline-end, hidden until the first yes/no check;
  - the **current transcript** (Readex 600, chalk): 2 lines at 720p, 3 at 1080p. If it's longer, shrink the font once to 85%, then cut from the START with "…" and keep the end (the question is usually last). Use `justify-content:flex-end` with a top mask-fade.
- **The ledge:** a wooden strip under the board, and the **only caption place**. It shows a 36px mini-avatar, "عمر:", then the line (2 lines max), with `role="log" aria-live="polite"`. It is present from the first render.
- **The level meter:** 5 small chalk bars on the board that move while recording, so the room sees the class "hearing" the teacher.
- **Optional decor (cut first):** only at widths of 1100px or more and outside stage mode, a clock at inline-start and a window with a plant at inline-end.

**Class row (37vh):** 5 cards in `repeat(5,1fr)`, gap 1.6vw, aligned to the bottom. Order from reading-start: Omar, Lina, Sara, Khaled, Yazan (Omar is rightmost in Arabic).

**Dock (15vh, `--floor`):**
- centre: the mic button (B2.5);
- inline-start: "اكتب بدل ما تحكي / Type instead" (it opens the typing box);
- inline-end: "أعد آخر دور / Redo" (Undo2 icon, mirrored in RTL);
- under the mic: a small "Tap mode" switch (tap to start, tap to stop) for people who can't hold a button.

### B2.4 Kid card (each card is a desk)

**Anatomy:**
1. **Container:** `--paper`, radius 24px, 2px `--line` border, flat lip `0 5px 0 var(--line)`, padding 1.4vh.
2. **Avatar:** square, `min(72% of card, 20vh)`, radius 20px, on `--avatar-bg`. Its bottom 14px tucks behind the desk plank, so the kid looks seated. Faces: neutral for levels 0–1, happy at 2. Yazan: bored / neutral / happy. Crossfade 200 ms. **Fallback:** the initial (ع ل س خ ي / O L S K Y) in Baloo 800.
3. **Hand chip:** a 52px paper circle with a 3px ink border and a lucide Hand icon, on the avatar's top inline-end corner. Shown only for `objection` and `answer` speakers, and for everyone during the chorus.
4. **"؟" chip slot:** on the avatar's top inline-start corner, used by the chorus moment.
5. **Desk plank:** full card width, an 18px `--desk` strip over a 6px `--frame` lip.
6. **Name:** Baloo 700. A lucide AudioLines icon appears next to it only while that kid's audio plays.
7. **Badge pill:** min-height 44px, fully rounded, full width. It holds a 26px **StateBall** plus the word (Readex 700), coloured as in B1.1.

**StateBall:** one small SVG component, used at 26px in pills, 28px in the replay table and 22px on phones.
- Level 0: an empty ring.
- Level 1: a half fill from inline-start (mirror it in RTL).
- Level 2: a full fill with a white ✓ (Yazan: a white Zap). The ✓ is never mirrored.
- Inside a solid pill: invert it to a white disc with a coloured ✓.

**Card states:**

| State | Look |
|---|---|
| **Speaking** | 4px `--ink` border and a 6px lift; AudioLines next to the name |
| **Thinking** | Avatar tilted 3° and 3 dots hopping above the name (only while waiting) |
| **Asked by name** | A "سؤال إلك / Your turn" chip in `--action`, for that turn only |
| **Lina unheard** (still Lost from turn 2, never asked) | A 4px `--action` ring pulses 3 times (1.2 s each), then stays static. A blue ؟ chip has the tooltip "لينا ما حكت ولا كلمة / Lina hasn't said a word". **Blue, never yellow** |
| **Got it** | The card floods `--gotit-tint` from the bottom (500 ms), with an 8px `--sunlight` glow ring for 1.2 s |
| **Badge tapped** | A popover: "شو اللي حرّك لينا؟ / What moved Lina?", then "تايهة → فاهمة · +2 · المداخلة 4", then the teacher's exact words in «» (Readex 500, 20px) |

### B2.5 The mic button (push-to-talk)

**Size:** `min(13vh,112px)` (88px on phones), `--action` fill, white Mic icon. It has a thin countdown ring that fills clockwise over 45 s (never mirrored), and the level ring behind it scales 1.00→1.25 with the input level.

| Moment | What happens |
|---|---|
| Idle | Label: "اضغط مطوّلاً واحكي · أو Space" / "Hold to talk · or hold Space" |
| `pointerdown` or Space `keydown` (ignore repeats) | `setPointerCapture`; start recording within 50 ms (the stream is already open); scale 0.94; the whole button turns `--record`; label "الصف بسمعك… 0:07" / "The class is listening… 0:07" |
| 35 s | Label changes to "باقي 10 ثواني" / "10 seconds left"; the ring turns `--record` |
| 45 s | Auto-stop and **send** (don't discard) |
| Release | Keep recording 250 ms more so the last word isn't cut, then stop and send. Within 100 ms, show the "سمعناك ✓" chip and start "thinking" |
| Hold under 350 ms | Not sent. Show "اضغط مطوّلاً وإنت بتحكي" / "Hold the button while you talk" for 2 s |
| Pointer moves >60px outside the button | The button turns grey with "افلت هون للإلغاء" / "Release here to cancel"; releasing there cancels. Escape also cancels |
| Window blur / tab hidden | Stop. Send if longer than 1 s, otherwise discard |
| Waiting for the class | The button is disabled from release until `done` (or the 12 s fail-safe). Pressing it while kids talk (barge-in) fades their audio out in 150 ms and starts recording |

**Button CSS:** `touch-action:none; user-select:none; -webkit-user-select:none; -webkit-touch-callout:none`. Block `contextmenu`. Use a real `<button>` with `aria-pressed` and `aria-label="اضغط مطوّلاً للتحدث"` / `"Hold to talk"`.

**Level meter:**
- An AnalyserNode (fftSize 1024) on the same stream, **not** connected to the speakers.
- Map −60..−10 dBFS to 0..1. Smooth it: rising ×0.5, falling ×0.12.
- If the level stays below −50 dBFS for 1.5 s while holding: show "قرّب المايك / Move closer to the mic".
- If a peak goes above −1 dBFS: show "بعّد المايك شوي / Move the mic back a little".

**Silence gate:** count the milliseconds above −45 dBFS. If the total is under 300 ms, don't upload. Omar plays his pre-recorded fail-safe line, no turn is saved, and "ما سمعناك منيح، قرّب المايك / We couldn't hear you, move closer" shows for 2 s.

**Shortcuts:** use `event.code` (so they work with an Arabic keyboard), and ignore all of them while focus is in the typing box.
- Space: hold to talk.
- KeyR: redo.
- KeyE: end, with a confirm.
- KeyT: focus the typing box.
- KeyV: reveal (on the review page).
- KeyM: mute sound effects.
- KeyD: debug panel (only with `?debug=1`).

### B2.6 Typing box and redo

- **Typing box placeholder:** "اكتب اللي بدك تحكيه للصف… / Type what you'd say to the class…". Enter sends; Shift+Enter adds a new line. Typed turns go through **exactly the same** `/turn` pipeline and animations.
- **Redo:** deletes the last turn, restores the previous levels, and puts the last transcript in the typing box so a misheard word can be fixed and resent.

### B2.7 Signature moments (the choreography)

The client receives the turn in stages: transcript, then `state` (levels, speakers, chorus), then `line` events, then `audio` events (B3.4). **It must still play correctly if everything arrives at once.**

**Moment 1: فاهمين؟ ("the mouths say yes, the heads say ؟"), the laugh**

Trigger: `state.chorus === true`. No kid-lines call, no voice generation.

| Time | What happens |
|---|---|
| 0 ms | The transcript is on the board, with "فاهمين؟" highlighted chalk-yellow |
| 150 ms | All 5 hand chips pop up together; the avatars hop 10px, 60 ms apart |
| 200 ms | The chorus clips start (Omar 0, Sara 40, Khaled 90, Yazan 130 ms; Lina at +250 ms with gain 0.5: she joins late and quietly). One wide paper bubble with a 4px ink border covers the **board** (not the cards): "آه مس!" / "آه أستاذ!" / "Yes, Miss!" / "Yes, Sir!" (Baloo 800, chorus size) |
| 900 ms | A new chalk stroke draws into the board's tally (tally sound; every 5th stroke is the diagonal). A paper "؟" chip pops onto every kid still at level 0, 120 ms apart |
| 1400 ms | A rubber stamp slaps across the class row: "ولا طالب تقدّم / No one moved up" (Baloo 800, 5vh, ink on `--chalk-yellow`, 4px ink border, rotated −8°, scale 1.6→0.96→1 in 220 ms, stamp thud) |
| 2.4–3.0 s | The bubble and stamp fade (300 ms). The ؟ chips shrink onto the lost badges and stay until the next turn. The tally stays for the whole lesson |

**Not one badge moves** because of the check. If the explanation earlier in the **same** turn moved a kid up, skip the stamp (the chorus and ؟ chips still play). The presenter stays silent for 2 s.

**Moment 2: Lina gets it (the spotlight), the climax**

Trigger: Lina goes to level 2 and is an `aha` speaker (the mansaf turn).
- Kids who reach Got it but **don't** speak change at once, 250 ms apart, in a small version (no confetti).
- **Lina's change waits until her own line starts.** If her audio hasn't started within 2.5 s, fire it when her caption shows, so a slow network never stalls the climax.
- When her line starts:
  - the other 4 cards dim to 55% and scale to 0.97 (300 ms); her card lifts 8px; her blue ring dissolves;
  - her ball fills empty → half → full (300 + 300 ms), the ✓ draws in, and **the Got-it chime plays as it fills**;
  - the pill turns solid teal "فاهمة", the card floods `--gotit-tint` with the `--sunlight` glow, and her face changes to happy;
  - `canvas-confetti` "chalk dust" fires from her card: `{particleCount:36, spread:70, startVelocity:28, ticks:140, gravity:1.1, scalar:0.8, colors:['#F4F0E6','#0F7B6C','#F2D27A','#1F4FA0'], disableForReducedMotion:true}`;
  - the ledge reads "لينا: آه... فهمت!" with a small "همس / whispering" tag;
  - the class meter's Lina circle fills.
- After 1.5 s, the other cards return to full opacity.
- Omar's `aha` follows at half strength (no dim, no confetti).

**Moment 3: the notebook reveal (review page)**

Button: "اكشف ما كان في بالهم / Reveal what they were thinking" (key V).
- The 5 cards flip in place, 400 ms apart: Omar, Sara, Khaled, Yazan, **Lina last**. In Calm mode they crossfade instead.
- Each back is a school notebook page (`--notebook`, blue rules, margin line at inline-start), with, top to bottom:
  1. **Heading:** "شو كان في بال عمر؟ / What was Omar thinking?" (Playpen 700, 24px).
  2. **Status stamp:** a 96px double-ring stamp, rotated −8°, with a thud.
     - Reached: `--gotit-text` rings, "وصل الشرح ✓ · المداخلة 4 / Reached · turn 4".
     - Not reached: grey `#5E5040` rings, "الشرح لسّا ما وصل / Not reached yet". **Never red.**
  3. **The reveal text** from topics.json (Readex 500, 18–20px).
  4. If true: "سألت لينا مباشرة (المداخلة 3) / You asked Lina directly (turn 3)".
  5. "سؤال للتحقق في الدرس القادم: / A question to check next lesson:" followed by the kid's `next_check`.
- Tapping a card shows the exact teacher words that moved this kid.

**Moment 4: "the board quotes you" (the proof for Q&A)**

On every turn that moves a badge, the exact quoted words are highlighted on the board and tagged with the kids they moved. Tapping any badge opens the same quote. The replay table on the review page shows it over time.

### B2.8 End lesson confirm

E key or the button (enabled after at least 1 turn) opens "نخلّص الدرس؟ / End the lesson?". Enter confirms; Escape closes. Then the school bell plays and the app goes to the review page.

### B2.9 After-lesson review `/lesson/:id/score`

This page is calm and adult. **The class and the فاهمين؟ panel come first, and the number is never the biggest thing on the card.** Content max-width is 1200px, and rows A–D fit 1920×1080 without scrolling.

- **A. Header:** "مراجعة ما بعد الدرس · مقارنة الكسور · درس تدريبي · المحاولة 1 · 4 مداخلات · 6:40" / "After-lesson review · Comparing fractions · Practice lesson · Attempt 1 · 4 turns · 6:40" (Readex 600, ink-muted).
- **B. The class:** the same 5 kid cards at 80% size with their final badges, then one 24px sentence (B4.5: reached + Yazan clause), then the Reveal button (`--action`). The cards flip in place, so the reveal needs no scrolling.
- **C. The فاهمين؟ panel:** a small board in a wooden frame with the tally strokes, the sentence from B4.5 (Playpen 700 + Readex 600, 26–28px), mini-avatars of the kids who were lost, and the Rosenshine footnote at 14px. Hide it if there were no yes/no checks and no questions.
- **D. Score and moves (two columns, 1:2):**
  - **Left:** a 160px `--action` ring, the number (Baloo 800), the band word (B4.4), and the disclaimer at 14px: "نتيجة لدرس تدريبي واحد، وليست تقييماً لك كمعلّمة" ("كمعلّم" for أستاذ) / "A score for one practice lesson, not for you as a teacher."
  - **Right:** "ممارساتك التدريسية / Your teaching moves", 5 rows of 44px, each with an ink icon, the move name, an `--action` bar and `<bdi>points/max</bdi>`; a grey "ليس بعد / Not yet" chip at 0.
    - Tags: "بقواعد ثابتة / Fixed rules" on 4 rows; "بتقييم الذكاء الاصطناعي / AI-judged" on clarity only.
    - Tapping a row shows its evidence (turn numbers and the exact words).
    - Under the rows: "أصوات دعوتها للكلام: 2 من 5 / Voices you invited: 2 of 5".
- **E. Three feedback cards** (25 words or fewer each):
  - "ما الذي نجح / What went well": the best-turn quote in «», taken by code, plus `why_it_worked`;
  - "سيكون أفضل لو / Even better if": `one_tip`;
  - "جملة للمرة القادمة / A line for next time": `try_saying`, with a 6px `--action` inline-start border.
  - If there were no gains, the first heading becomes "لحظة نبني عليها / A moment to build on".
- **F. Lesson replay "إعادة عرض الدرس / Lesson replay" (SHOULD):** a real `<table>`.
  - Rows: kids (32px avatars). Columns: turns (turn 1 at inline-start). Cells: 28px StateBalls with ↑/↓ where the level changed.
  - Column headers: ● for a real question, ◇ for فاهمين؟; an ink ring marks a kid asked by name.
  - Every ◇ column looks **identical to the one before it** (the "frozen column").
  - Tapping a column shows the teacher's words and the kids' lines. On phones it scrolls sideways inside its own card.
- **G. Buttons and footer:**
  - Buttons: "أعد الدرس مع نفس الصف / Teach it again" (primary; new lesson, same settings), "شارك / Share", "كيف نحسب النتيجة / How scoring works" (a modal with B4.6).
  - Privacy line: "هذه المراجعة لك وحدك. المدرسة بتشوف أرقام مجمّعة بس. / This review is yours. A school only sees totals."
  - Shared view (opened from a link): hide "Teach it again" and show "ابدأ درساً تدريبياً / Try a practice lesson".
- **Motion:** the bell on arrival, the ring counting up, the bars filling. **No confetti on this page, ever.**
- **Fast first paint:** show the code-computed numbers immediately, and fade in the AI parts (clarity, why it worked, tip, line) when they arrive.

### B2.10 Stage mode `?demo=1` (MUST: makes the live demo seamless)

1. **Skip the home page.** Create a lesson (Comparing fractions, العربية, مس) and open the classroom.
2. **Show one big "Stage ready" button.** One click must:
   - enter fullscreen (`document.documentElement.requestFullscreen()`);
   - request a screen wake lock (`navigator.wakeLock.request('screen')`, and again on `visibilitychange`);
   - open the mic stream once (using the saved mic `deviceId`) and keep it;
   - resume the AudioContext and play a short silent clip;
   - preload the chorus, fail-safe and starter clips;
   - call `GET /api/warmup`.

   It then shows a checklist (Mic, Audio, AI, Fullscreen, Wake lock), each with a ✓ or ✗, and hides itself.
3. **Talk control is a toggle:** one press of Space or PageDown starts recording and the next press stops it. PageUp = redo. This lets the driver control recording while a judge talks into the mic.
4. **Hotkeys** (`event.code`; never act on Escape or F5):

   | Key | Action |
   |---|---|
   | N | New lesson with the same settings |
   | R | Redo |
   | E | End lesson (with confirm) |
   | V | Reveal |
   | C | Play the chorus only, with no turn (used for the pitch hook) |
   | S | Toggle English subtitles under the Arabic caption |
   | H | Toggle the presenter HUD |
   | Q | Open the `/pitch` panels (SHOULD) |
   | Shift+1..4 | Send line 1–4 from `data/demo-script.json` as a **typed** turn through the normal `/turn` pipeline (real AI; only transcription is skipped) |

5. **Presenter HUD** (hidden by default; H toggles it): a small corner box with the mic name, input level, model ids OK/✗, and the last turn's timings.
6. **Hide** hints, the typing box, Redo and the goals strip. Hide the cursor after 2 s without movement. Use stage font sizes (B1.2).
7. **Mic picker** in the debug panel: `enumerateDevices`, with the chosen `deviceId` saved in localStorage (inside try/catch).

### B2.11 Debug panel `?debug=1` (MUST, never on stage)

Opened with the D key. For each turn it shows a waterfall:
- upload, STT, judge (with attempt count), rules, lines, TTS #1/#2;
- `firstBubbleMs` and `firstVoiceMs`, measured from key release with `performance.now()`.

Bars are green when at or under target, then amber, then red. It also shows the model ids, structured outputs on/off, the fail-safe stage, `evidence_mismatch` flags, the raw judge JSON, a "Warm up" button, and the mic picker.

### B2.12 SHOULD screens

- **Meet the class** (about 3 s after Start, skipped in stage mode): the class photo in a wooden frame, with the 5 kids popping in 120 ms apart. Each shows one personality line, **never** the misconception:

  | Kid | العربية | English |
  |---|---|---|
  | عمر | إيده دايماً مرفوعة | His hand is always up |
  | لينا | هادية، ما بتحكي إلا إذا سألتها | Quiet; only talks if you ask her |
  | سارة | دايماً بتسأل: بس ليش؟ | Always asks: but why? |
  | خالد | بدّه أمثلة من الحياة | Wants real-life examples |
  | يزن | سريع، وبيزهق إذا الإشي سهل | Fast, and gets bored if it's easy |

  Button: "يلا نبدأ / Let's start".
- **Lesson-goals strip** (above the mic, hidden on stage): "أهداف الدرس / Lesson goals", 5 chips: "الوصول لكل طالب (0/4) · أسئلة حقيقية (0/2) · إشراك لينا · تحدّي يزن · أسباب وأمثلة" / "Reach every kid (0/4) · Real questions (0/2) · Include Lina · Challenge Yazan · Reasons and examples". The first 4 light up live (teal tick) when met. **Never show the score or the misconceptions during the lesson.**
- **Pitch panels `/pitch`:** full-screen `--board` with chalk headlines (Baloo 800, 7vh, at most 7 words each), navigated with arrows/PageUp/PageDown; B returns to the classroom. Panels:
  1. "معلّم بيتدرّب على صف ذكي" / "A flight simulator for teachers"
  2. "5 طلاب · 5 مفاهيم خاطئة · قواعد ثابتة" / "5 kids · 5 real misconceptions · fixed rules"
  3. "8 دنانير للمعلّم شهرياً" / "8 JOD per teacher per month"
  4. "3 مجموعات مدارس للتجربة؟" / "Intros to 3 school groups?" plus a big QR code of the deployed URL.
- **Replay `/replay/:id`:** the demo backup. It loads `GET /api/lessons/:id/replay` (all turns, levels, lines and audio URLs), preloads every audio file as a blob, then plays the lesson turn by turn with → or PageDown, with no network needed after loading. A small label always shows: "إعادة لدرس مسجّل / Replay of a recorded lesson".
- **Share preview `/s/:id`:** a server route that returns HTML with `og:title` "وصلت لـ 4 من 4 طلاب على سبّورة / I reached 4 of 4 kids on Sabboura" and `og:image` = class.webp, then redirects to the review page.
- **Phone (<768px):**
  - a compact board (topic + last 2 lines) and the ledge caption;
  - a strip of 5 desk tiles (64px avatar + StateBall pill);
  - an 88px mic fixed at the bottom centre with `env(safe-area-inset-bottom)`;
  - no clock or window.
  - On the review page, the reveal opens as a vertical list instead of flipping.

---

## B3. Architecture and technical spec

### B3.1 Stack and folders

Keep Replit Agent's default full-stack template. As of Oct 2026 that's usually:
- a pnpm workspace;
- a React + Vite web app;
- an Express 5 API server;
- Postgres + Drizzle;
- a reverse proxy that routes `/api` to the API server.

If Agent uses its monorepo layout (`artifacts/*` apps plus `lib/db`, `lib/integrations-*`), keep these **module names** inside it:

```
data/        topics.json  canned.json  judge-tests.json  feedback.json  demo-script.json   (B6, exact copies)
shared/      schemas.ts   (zod: JudgeOut, LinesOut, ScorerOut, TurnEvent types)
server/
  routes/    lessons.ts   system.ts (/api/warmup, /api/health, /api/tts)   share.ts (/s/:id)
  turn/      runTurn.ts (async generator of events)   sse.ts
  ai/        clients.ts (clients + model probe + modelOpts)   prompts.ts (B5, verbatim)
             stt.ts  judge.ts  kidLines.ts  tts.ts  scorer.ts
  rules/     levels.ts  speakers.ts  score.ts   (B4, pure functions)
  lib/       arabic.ts (normalise, similarity)   timing.ts
  db/        schema.ts  index.ts
client/src/
  lib/       sse.ts  recorder.ts  audio.ts (AudioContext, queue, chorus)  sfx.ts  i18n.ts
  pages/     Home.tsx  Classroom.tsx  Review.tsx  Pitch.tsx
  components/ KidCard.tsx  StateBall.tsx  MicButton.tsx  Board.tsx  Ledge.tsx  DebugPanel.tsx  Frac.tsx
client/public/
  avatars/   {kid}-{state}.webp  class.webp
  audio/pre/ *.mp3  manifest.json      (made by npm run gen:audio, committed)
scripts/     test-judge.ts  gen-audio.ts  gen-avatars.ts  bench.ts
```

The client calls the `/turn` route with `fetch` and a stream reader (B3.4), **not** a generated API hook.

### B3.2 Environment and models

**Replit AI Integrations** set these env vars automatically:
- `AI_INTEGRATIONS_ANTHROPIC_BASE_URL` and `AI_INTEGRATIONS_ANTHROPIC_API_KEY`;
- `AI_INTEGRATIONS_OPENAI_BASE_URL` and `AI_INTEGRATIONS_OPENAI_API_KEY`.

**Add these in Replit Secrets:**

| Secret | Value |
|---|---|
| `CLAUDE_JUDGE_MODELS` | `claude-opus-5-5,claude-opus-5,claude-sonnet-5` |
| `CLAUDE_LINES_MODELS` | `claude-opus-5-5,claude-opus-5,claude-sonnet-5` |
| `CLAUDE_SCORER_MODELS` | `claude-opus-5-5,claude-opus-5,claude-sonnet-5` |
| `STT_MODEL` | `gpt-4o-mini-transcribe` |
| `TTS_MODEL` | `gpt-audio-mini` |
| `IMAGE_MODEL` | `gpt-image-2` (the script falls back to `gpt-image-1`) |
| `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` | **Optional backup:** our own keys. If set and the Replit proxy lacks a model, use them (no baseURL) |

**Model probe.**
- At boot and in `/api/warmup`, try each id in a list, in order, with a tiny call (`max_tokens: 64`). Use the first one that doesn't return a 404, or a 400 about the model.
- Log which model won. The debug panel and HUD show it.
- **Why:** Replit's Oct 2 runtime list doesn't show `claude-opus-5-5` yet (it does show `claude-opus-5`).

**Clients:**
- Anthropic: `new Anthropic({ baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL, apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY, maxRetries: 0, timeout: 10000 })`.
- OpenAI: the same pattern, with the `AI_INTEGRATIONS_OPENAI_*` vars and `timeout: 8000`.

**Per-model options (`modelOpts`):**

| Model id | `output_config` | Notes |
|---|---|---|
| `claude-opus-5-5` | `{ effort: 'low', format }` | **No `thinking` field** (Opus 5.5 can't disable thinking; sending `disabled` returns 400). No prefill, no forced `tool_choice` (both 400) |
| `claude-opus-5` | `{ effort: 'low', format }` | No `thinking` field |
| `claude-sonnet-5` | `{ effort: 'low', format }` | — |
| `claude-haiku-4-5` | `{ format }` only | **No effort field** (it returns 400) |

**If the proxy rejects `output_config.format`** (a 400 mentioning output_config or format):
- set `structured = false` for the whole server;
- call without `format`, and add "Return only the JSON object, no prose." to the system prompt;
- parse the first `{...}` in the reply with zod `safeParse`.

### B3.3 API contract

Kid ids are `omar|lina|sara|khaled|yazan`.

| Route | Request | Response |
|---|---|---|
| `POST /api/lessons` | `{topicId:'fractions', language:'ar'\|'en', teacherTitle:'miss'\|'sir'}` | `201 {lessonId:'<uuid>', turnNo:0, levels:{omar:0,lina:0,sara:0,khaled:0,yazan:1}}` |
| `GET /api/lessons/:id` | — | `{lesson, turnNo, levels, turns:[{turnNo, transcript, checkType, chorus, levelsAfter, lines:[{kid,text}]}]}` |
| `POST /api/lessons/:id/transcribe` | multipart: `audio` (file), `durationMs`, `mime` | `{transcript, empty:boolean, seconds, sttMs}`. Never stores audio |
| `POST /api/lessons/:id/turn` | JSON `{text, source:'voice'\|'typed'\|'script', teacherSeconds, clientTurnId}` | SSE stream when `Accept: text/event-stream` (B3.4); otherwise `{events:[{event,data}]}` (fallback) |
| `POST /api/lessons/:id/redo` | — | `{turnNo, levels, lastTranscript}` |
| `POST /api/lessons/:id/end` | — | `{scoreUrl:'/lesson/<id>/score', score:{...B4.4 fields}}` (25 s timeout; code numbers first, AI parts may be null then filled) |
| `GET /api/lessons/:id/score` | — | The same score JSON (public, shareable) |
| `POST /api/tts` | `{kid, text, lang}` | `audio/mpeg` (manual replay; same cache) |
| `GET /api/lessons/:id/replay` | — | `{turns:[{turnNo, transcript, state, chorus, lines:[{idx,kid,text,text_en,audioUrl}]}]}` (audio from the cache via `/api/tts`; SHOULD) |
| `GET /api/warmup` | — | `{ok, models:{judge,lines,scorer,stt,tts}, structured:true\|false, ms:{db,judge,lines,tts,stt}}` |
| `GET /api/health` | — | `{ok:true}` (fast, no AI; publishing needs the home page in under 5 s) |
| `GET /api/lessons/:id/debug` | — | `{turns:[{turnNo, transcript, failsafe, timings, judge}]}` |

Use uuid lesson ids so shared review links can't be guessed.

### B3.4 The turn pipeline

**Voice turn:**
1. The client uploads the clip to `/transcribe`.
2. It shows the transcript on the board immediately.
3. It POSTs the text to `/turn`.

**Typed and scripted turns** skip steps 1 and 2.

`/turn` is one async generator, `runTurn(ctx)`, that **yields events**. The route writes them as Server-Sent Events. The test script and `/dev/test` call `runTurn()` directly.

```
POST /api/lessons/:id/transcribe   (voice only)            ~0.5–1.5 s
POST /api/lessons/:id/turn  → SSE:
  state     levels + changes + check + asked_kid + chorus + speakers   (after judge, ~2–5 s)
  chorus    {lang, title}            (only when chorus; nothing else follows but timings/done)
  line      {idx, kid, reason, text, source}      one per speaker (≤2)
  audio     {idx, kid, mime:'audio/mpeg', url? | b64?, source:'pre'|'cache'|'tts', ms}
  audio_failed {idx, kid}            (keep the caption, animate the card ~2 s, no voice)
  timings   {judgeMs, judgeAttempts, rulesMs, linesMs, ttsMs:[..], dbMs, totalMs, models}
  done      {turnNo}
  (debug only: failsafe {stage, reason}, busy {})
```

**`state` payload:**

```json
{"turnNo":2,"levels":{"omar":{"from":0,"to":0,"change":0,"helped":"no","hurt":false,"evidence":null},"lina":{},"sara":{},"khaled":{},"yazan":{}},
 "check":"yes_no","askedKid":null,"chorus":true,"linaPulse":true,
 "speakers":[],"judge":{"model":"claude-opus-5-5","attempts":1,"ok":true,"ms":2900}}
```

**SSE server helper rules:**
- Headers: `Content-Type: text/event-stream; charset=utf-8`, `Cache-Control: no-cache, no-transform` (stops `compression()` from buffering), `X-Accel-Buffering: no`.
- Call `res.flushHeaders()` and `res.socket?.setNoDelay(true)`.
- Write each event as `event: <name>\ndata: <json>\n\n`, and send `: ping\n\n` every 5 s.
- Detect a disconnect with **`res.on('close')`** plus `!res.writableEnded` (not `req.on('close')`), and abort the AI calls with an AbortController.

**Client:**
- Read the stream with `fetch(url, {method:'POST', headers:{Accept:'text/event-stream','Content-Type':'application/json'}, body})`, then `res.body.pipeThrough(new TextDecoderStream()).getReader()`, splitting on blank lines. **Do not use EventSource**: it can't POST, and its reconnect can replay a turn.
- Ignore unknown event names and events whose `turnNo` is old.
- If 20 s pass without `done`, run the local fail-safe.
- **Deployed test (after publishing):** `curl -N -H 'Accept: text/event-stream' -H 'Content-Type: application/json' -d '{"text":"فاهمين؟","source":"typed","teacherSeconds":2,"clientTurnId":"t1"}' https://<app>/api/lessons/<id>/turn` must show the events arriving one by one. If the proxy buffers them, set `USE_SSE=0` (the JSON fallback); the client must play correctly when all events arrive at once.

**Order of work inside `runTurn` (the latency plan):**
1. Load state from memory.
2. Run the judge (B5.1).
3. Apply the rules (B4) and emit `state`. **Hands go up now.**
4. If chorus: emit `chorus`, save, then emit `timings` and `done`.
5. Otherwise, pick each line:
   - the **first** objection of Omar, Sara or Khaled in a lesson uses their **starter line** from `canned.json`, with its pre-recorded clip (instant);
   - other lines come from **one** kid-lines call (B5.2).
6. Emit the `line` events, then start the voices for all lines **in parallel** on the server.
7. Emit `audio` events in `idx` order: pre-recorded clips as `url`, fresh voices as base64 `b64` (about 60 KB for 3 s).
8. Write the DB transaction in parallel with TTS; await it before `done`.

### B3.5 AI calls

**Transcription:**
- Call `openai.audio.transcriptions.create({file: await toFile(buf, 'turn.webm'|'turn.mp4', {type}), model: STT_MODEL, language: 'ar'|'en', prompt: <one sentence>, response_format: 'json'}, {timeout: 6000, maxRetries: 0})`.
- Name the file to match its real type: Chrome sends webm/opus, Safari sends mp4. **Don't convert.**
- The prompt is **one short natural sentence**, not a word list. Arabic: "درس رياضيات للصف الرابع عن مقارنة الكسور مع عمر ولينا وسارة وخالد ويزن: نص، ثلث، ربع، بسط، مقام، منسف." English: "A Grade 4 maths lesson on comparing fractions with Omar, Lina, Sara, Khaled and Yazan: half, third, quarter, numerator, denominator, mansaf." Build it from topics.json (title + vocab).
- Treat the transcript as **empty** (fail-safe, no turn) if any of these is true:
  - it has fewer than 2 words after removing punctuation;
  - at least 70% of its words appear in the prompt sentence (a "prompt echo");
  - it matches a known silence phantom ("اشتركوا في القناة", "شكرا للمشاهدة", "Thanks for watching").

**Judge:** `anthropic.messages.parse` (or `create` plus zod).
- Model: the first working id from `CLAUDE_JUDGE_MODELS`.
- `max_tokens: 4000`: thinking counts toward this, and a low value truncates the JSON.
- `output_config: modelOpts(model, format(JudgeOut))`.
- `system`: the judge prompt (B5.1) plus the topic's kid table, as one **cached** block (`cache_control: {type:'ephemeral'}`).
- `messages`: one user message with JSON `{levels, latest_turn, previous_turns: last 3}`.
- Timeout 9 s; retry once with 7 s (only if 6 s of the 16 s turn budget are left).
- Retry on: a timeout, 429, 5xx, a connection error, invalid JSON or zod failure, `stop_reason` `max_tokens`, or `refusal`. **Never retry 400/401/403/404**; on a 404, move to the next model id.
- **Keep the schema objects as module constants** (same key order every call), so the grammar cache hits.
- **No `.max()`/`.min()` on these zod fields.** Truncate the evidence to 20 words in code.
- **Evidence check:** after parsing, check that each evidence quote appears in the transcript after Arabic normalisation:
  - remove tashkeel and tatweel;
  - map أ/إ/آ→ا, ى→ي, ة→ه, and ٠–٩→0–9;
  - drop punctuation;
  - require ≥70% word overlap.

  Log `evidence_mismatch` if it doesn't. Downgrade the verdict to `no` only if `test:judge` still passes with that rule on.

**Kid lines:** one call for all speakers.
- `max_tokens: 2000`, effort low, timeout 6 s, retry once with 4 s.
- Check in code: the same kids in the same order; strip emojis and quote marks; cut each line to 15 words.
- Replace a missing or invalid line with the canned line for that kid and reason (`canned.json`).

**Voices (TTS):** OpenAI **chat completions** (Replit doesn't proxy `audio.speech`).

```ts
const r = await openai.chat.completions.create({
  model: process.env.TTS_MODEL,               // gpt-audio-mini
  modalities: ['text', 'audio'],
  audio: { voice: VOICES[kid], format: 'mp3' },
  messages: [{ role: 'system', content: TTS_SYSTEM(kid, lang) }, { role: 'user', content: say }],
}, { timeout: 7000, maxRetries: 0 });
const b64 = r.choices[0].message.audio?.data;
const heard = r.choices[0].message.audio?.transcript ?? '';
```

- Compare `normalise(heard)` with `normalise(say)`. If word overlap is under 0.8, the model answered instead of reading: retry once, then send `audio_failed`.
- **Voices** (audition 5 clearly different ones tonight): omar `ash`, lina `shimmer`, sara `coral`, khaled `echo`, yazan `verse`.
- **Optional:** play with `playbackRate` 1.08 so voices sound younger (judge it by ear).
- **Cache key:** `sha1(model|voice|STYLE_VERSION|lang|say)`. Look up in this order: the pre-generated manifest, an in-memory LRU (500), the Postgres `tts_cache` table; generate only if all miss.

### B3.6 Pre-generated audio: `npm run gen:audio`

`scripts/gen-audio.ts` runs **in the workspace** after P4. Its output gets committed, then published.
- It uses the same `speak()` function as `/api/tts`.
- It writes `client/public/audio/pre/<key>.mp3` plus `manifest.json` `{key:{url, text, voice}}`.
- It lists any clip whose transcript check failed, and supports `--only=<key>` to re-run one.

| Clips | Count |
|---|---|
| Chorus: `آه مس!`, `آه أستاذ!`, `Yes, Miss!`, `Yes, Sir!` × all 5 kid voices | 20 |
| Fail-safe lines (topics.json `failsafe`) × 5 kids × ar/en | 10 |
| Starter lines (canned.json `starters`) × 3 topics × 3 kids × ar/en × miss/sir | 36 |
| Reason lines (`aha`, `aha_lina`, `bored`, `timid_yes`) and Lina's `answer_lost` per topic, × voices × ar/en | about 30 |

`{t}` expands to مس/أستاذ (Arabic) or Miss/Sir (English). When a line has `say_ar`/`say_en`, voice that instead of the shown text, so numbers are read as words ("التلت").

**Listen to the chorus and the fail-safe clips before keeping them.**

### B3.7 Timeouts and fail-safes (never an error on screen)

| Failure | What the user sees |
|---|---|
| Mic permission denied | The typing box opens with focus, plus the friendly card (B2.2) |
| Clip under 350 ms, or silent (gate) | The mic shakes; Omar's pre-recorded "مرة كمان؟"; nothing sent |
| Upload or network error, captive portal (HTML instead of JSON) | Local fail-safe: Omar's clip; levels unchanged; mic unlocked |
| Transcription fails twice, empty, echo or phantom | The same local fail-safe |
| Judge fails twice | Levels unchanged; the first vocal kid still at level 0 says their pre-recorded fail-safe line |
| Proxy rejects structured outputs | Switch to JSON-in-text mode automatically (B3.2) |
| Kid lines fail | Canned line for that kid and reason, with its pre-recorded clip |
| TTS fails or mismatches twice | `audio_failed`: caption shown, card animates for 2 s, no voice |
| DB write fails | Continue from memory; log it in the debug panel |
| No `done` after 20 s (client) | Local fail-safe; ignore late events |
| Teacher talks while a turn runs | The mic stays disabled until `done` (the server also answers `busy`) |
| Scorer fails twice | Use `data/feedback.json` for `focus_move` and the fallback clarity rule. No error |

**Turn budget:** 16 s from when the server receives the turn.

**SDKs always use `maxRetries: 0`**; we do the retries ourselves. **Never** rely on the Anthropic default timeout (10 minutes with 2 retries).

### B3.8 Latency: targets and decision rule

These are **estimates until measured**:
- transcript at about 1–2 s;
- badges at about 3–6 s;
- first voice at about 6–9 s with Opus for both calls.

Turns that use a starter line, the chorus or a fail-safe play almost instantly after the badges.

**Targets:** first caption in under 6 s; first voice in under 7 s.

**Decision rule (Saturday after P4, about 17:00):**
1. Do 5 spoken turns on the **deployed** URL and read the medians in the debug panel.
2. If the median first voice is **over 7 s**, move **only the kid lines** to a faster model by putting it first in `CLAUDE_LINES_MODELS` (`claude-sonnet-5` on Replit, or `claude-haiku-5-5` with our own key).
3. If it's still too slow, test the judge on `claude-opus-5`, and keep that only if `npm run test:judge -- --runs 3` still passes.

**Keep the judge on the strongest model.** The "not just ChatGPT" answer rests on it. This is the team's call, made on measured numbers.

### B3.9 Database (Drizzle)

```ts
lessons   (id uuid pk default random, topic_id text, language text, teacher_title text,
           created_at timestamptz default now, ended_at timestamptz, score_json jsonb,
           device_id text, attempt_no int default 1, previous_lesson_id uuid)
turns     (id serial pk, lesson_id uuid fk cascade, turn_no int, client_turn_id text,
           source text, transcript text, teacher_seconds real default 0,
           check_type text default 'none', asked_kid text, chorus bool default false,
           failsafe text, judge_json jsonb, levels_after jsonb not null, timings_json jsonb,
           created_at timestamptz)          unique(lesson_id, turn_no)
kid_levels(id serial pk, lesson_id uuid fk cascade, turn_no int, kid_id text, level int,
           change int default 0, helped text, hurt bool default false, evidence text)
kid_lines (id serial pk, lesson_id uuid fk cascade, turn_no int, idx int, kid_id text,
           reason text, text text, source text, seconds real default 0)
tts_cache (key text pk, voice text, say text, mime text default 'audio/mpeg',
           audio_b64 text, created_at timestamptz)
```

**State:**
- Keep `Map<lessonId, {levels, turnNo, last3, busy}>` in memory (a Reserved VM is one always-on process).
- On a miss, load from Postgres: the last turn's `levels_after`, or the topic's start levels.
- Write each turn in **one transaction**.
- **Redo** deletes the last turn's rows and resets the Map entry.

Dev and production databases are separate: production data starts empty at publish.

### B3.10 Warm-up, health, tests

- **`GET /api/warmup`**
  - Runs in parallel:
    - `SELECT 1`;
    - the model probe;
    - one real judge call on the demo topic with a dummy transcript and the exact schema (this compiles the grammar and fills the prompt cache);
    - one kid-lines call;
    - one TTS call ("آه");
    - one STT call on that TTS mp3.
  - Returns the time each step took.
  - Called by stage mode on load, by the debug "Warm up" button, and every 4 minutes while the demo page sits idle.
- **`npm run test:judge`** (`tsx scripts/test-judge.ts`)
  - Imports the **same** `judgeTurn()`, `applyLevels()`, `chooseSpeakers()` and prompts as the server (no HTTP).
  - Runs each row of `data/judge-tests.json` from the topic's start levels and prints one line per row, e.g. `#4 PASS 2840ms check=none asked=- helped o:F l:F s:F k:F y:n speakers=lina:aha,omar:aha`.
  - Exits 1 if any row fails, and writes the raw judge JSON to `scripts/out/`.
  - Flags: `--rows 1,4,7`, `--runs 3` (a row passes only if every run passes), `--model <id>`, `--concurrency 3`.
  - **Expect semantics:** a list means any of those values passes; `unchanged` lists kids whose level must not change; `speakers` must match exactly, in order.
- **`/dev/test`** (hidden page): the same rows through the typed path, showing expected vs actual. Replit Agent's App Testing can use it, because its browser has no mic.
- **`npm run bench`** (SHOULD): runs each step 5× (STT on a 10 s clip, judge on row 4, lines for 2 speakers, TTS for a 10-word line) and prints the median and p90 per model.

### B3.11 Deployment

- **Type:** Reserved VM, dedicated 1 vCPU / 4 GiB, web server, public. **Not Autoscale** (it cold-starts after 15 minutes idle).
- **Publish first** right after P3 passes (about 14:30 Saturday), not at the end. Production-only problems (env vars, HTTPS mic, health check, SSE buffering) need time to fix.
- **The home page** must answer in under 5 s with no AI calls at boot, or publishing fails.
- **Never** write generated audio or images at runtime in production: the filesystem resets on every publish. Pre-generate in the workspace and commit.
- Use the **published `.replit.app` URL** for testers, the QR code and the demo. The `replit.dev` dev URL changes and goes offline.

---

## B4. Fixed rules and scoring (code, not AI)

### B4.1 Levels

Each kid has a level 0, 1 or 2.
- **Start levels:** Omar, Lina, Sara and Khaled start at 0. Yazan starts at 1.
- **Update, per kid, per turn:**
  - `helped = "fully"` → +2; `helped = "partly"` → +1 (max 2).
  - Otherwise, if `hurt = true` → −1 (min 0).
- **Labels:** Omar, Lina, Sara and Khaled show Lost / Partly / Got it. Yazan shows Bored / Waiting / Challenged. In Arabic, use the kid's gender (`labels.ar_m` / `labels.ar_f` in topics.json).

### B4.2 Who speaks

Decide this **after** the new levels are set. At most 2 kids speak.

1. `check = "yes_no"` and no kid named → **chorus**. Nobody else speaks, and no level changes **because of the check** (the explanation in the same turn can still move kids).
2. A kid is named (`asked_kid`) → that kid speaks: `timid_yes` if `check = "yes_no"`, otherwise `answer` (answered from the kid's **new** level). Add one `aha` if another kid reached level 2 this turn.
3. `check = "question"` with no kid named → the first of Omar, Sara, Khaled below level 2 speaks (`answer`). If all three are at 2, Yazan answers.
4. Otherwise, pick the first 2 from this list, in order:
   1. `aha`: kids who reached level 2 this turn (Lina first if she's one of them, then reading order);
   2. `objection`: Omar, then Sara, then Khaled, if they're below level 2 and weren't helped this turn;
   3. `bored`: Yazan, if he's at level 0.
5. **Lina never volunteers.** If she's still at level 0 after 2 or more turns and was never asked, show her unheard ring (B2.4). It makes no sound.
6. **Starter rule:** the **first** time Omar, Sara or Khaled speak with reason `objection` in a lesson, use their topic starter line from `canned.json` with its pre-recorded clip (`source: 'starter'`).
7. **Fail-safe:** if the judge fails twice, levels stay the same and the first vocal kid still at level 0 says their pre-recorded fail-safe line.

### B4.3 Per-turn records

For every turn, save:
- `check_type` and `asked_kid`;
- `chorus`;
- the levels after the turn, with each kid's change and evidence;
- the kids who spoke, with their reason and text;
- the teacher's seconds;
- the timings.

### B4.4 The score (all code, except clarity)

| Move (EN / AR) | Points | Rule |
|---|---|---|
| Reached every learner / الوصول إلى كل طالب | 40 | 5 × (final level of Omar + Lina + Sara + Khaled). Partly earns 5, Got it earns 10 |
| Checked for understanding / التحقق من الفهم بأسئلة حقيقية | 20 | min(10 × number of turns with `check = "question"`, 20) |
| Included the quiet learner (Lina) / إشراك الطالبة الهادئة (لينا) | 15 | 15 if some turn has `check = "question"` AND `asked_kid = "lina"`; 5 if Lina was only named in a `yes_no` turn; otherwise 0 |
| Stretched the fast learner (Yazan) / تحدّي الطالب المتقدّم (يزن) | 10 | 10 if Yazan ever reached level 2, otherwise 0 |
| Explained with reasons and examples / الشرح بالأسباب والأمثلة | 15 | 3 × the AI clarity score (0–5, fixed anchors in B5.3). Tagged "AI-judged" |

**Total** = the sum of the five, 0–100. It is **always shown with a band word:**

| Range | English | العربية |
|---|---|---|
| 0–39 | Warm-up round | جولة إحماء |
| 40–69 | Getting there | على الطريق الصحيح |
| 70–89 | Strong lesson | درس قوي |
| 90–100 | Excellent lesson | درس ممتاز |

**Also compute (shown, not scored):**
- `yes_no_count`;
- `lost_at_last_yes_no` = how many of Omar, Lina, Sara and Khaled were at 0 right after the last `yes_no` turn (**never count Yazan**);
- `question_count`;
- `voices_invited` = distinct kids who spoke with reason `answer`;
- `best_turn` = the turn with the biggest total level gain (ties go to the later turn). If there were no gains, the first `question` turn, else turn 1;
- `focus_move` = the move with the lowest points ÷ max. Ties in this order: lina, checks, reached, yazan, clarity.

**Code picks `best_turn` and `focus_move`; the AI only writes words about them.** The best-moment quote shown is the `best_turn` transcript itself (up to 40 words, then "…"), taken by code. So the AI can never invent a quote on stage.

**Expected numbers for the stage demo** (the 4 turns in `demo-script.json`):

| Move | Points |
|---|---|
| Reached | 40 |
| Checks | 10 |
| Lina | 15 |
| Yazan | 0 ("Not yet") |
| Clarity | about 12 |
| **Total** | **about 77** → **Strong lesson** |

The فاهمين؟ line reads "1 time, 4 of 4 still lost". `best_turn` = 4 (the mansaf), and `focus_move` = yazan, so the tip is about challenging Yazan.

### B4.5 Exact copy for the review sentences

**Reached sentence** (R = kids at level 2, P = kids at level 1):
- EN: "You reached {R} of 4 kids." If P > 0, add "{P} got partway."
- AR (the explanation is the subject, so no gender is needed):

  | R | Sentence |
  |---|---|
  | 0 | لم يصل الشرح بعد إلى أي من الطلاب الأربعة. |
  | 1 | وصل شرحك إلى طالب واحد من 4. |
  | 2 | وصل شرحك إلى طالبين من 4. |
  | 3–4 | وصل شرحك إلى {R} من 4 طلاب. |

  If P > 0, add "و{P} في منتصف الطريق."
- **Yazan clause:**
  - level 2: "Yazan was challenged." / "يزن كان متحمّساً للتحدّي."
  - level 1: "Yazan was still waiting for a challenge." / "يزن كان لا يزال ينتظر تحدّياً."
  - level 0: "Yazan got bored." / "يزن شعر بالملل."

**فاهمين؟ panel** (N = yes/no count, K = lost at the last yes/no, Q = questions):
- **N ≥ 1 and K ≥ 1:**
  - EN: "You asked “Everyone understand?” {once|twice|N times}. The class said “{chorus}”. {K} of 4 kids were still lost."
  - AR: "سألت «فاهمين؟» {N_ar}. الصف قال «{chorus}»، بس {K} من 4 كانوا لسّا تايهين."
  - N_ar: 1 = "مرة وحدة", 2 = "مرتين", 3–10 = "{n} مرات", 11+ = "{n} مرة".
- **N ≥ 1 and K = 0:**
  - EN: "You asked “Everyone understand?” {N}. This time they really had understood. A real class has no badges, so only a real question tells you."
  - AR: "سألت «فاهمين؟» {N_ar}. هالمرة كانوا فعلاً فاهمين، بس الصف الحقيقي ما فيه شارات، والسؤال الحقيقي هو اللي بيكشف."
- **N = 0 and Q ≥ 1:**
  - EN: "You never asked “Everyone understand?”. You asked {Q} real question(s) instead."
  - AR: "ما سألت «فاهمين؟» ولا مرة. سألت بدالها {Q_ar}."
  - Q_ar: 1 = "سؤال حقيقي واحد", 2 = "سؤالين حقيقيين", 3–10 = "{n} أسئلة حقيقية".
- **N = 0 and Q = 0:** hide the panel.
- **Footnote** (when N ≥ 1):
  - EN: "Rosenshine (2012): less effective teachers asked “Are there any questions?” and, if there were none, assumed the class had learned."
  - AR: "روزنشاين (2012): المعلمون الأقل فاعلية كانوا يسألون «هل من أسئلة؟»، وإذا لم تكن هناك أسئلة افترضوا أن الطلاب تعلّموا."

**Lina row notes:**
- At 5 points: "You named Lina, but asked yes/no. She said yes and was still lost." / "ناديت لينا باسمها، بس السؤال كان آه أو لا. قالت «آه» وكانت لسّا تايهة."
- At 0 points, if she was lost for 2+ turns: "Lina was lost for {n} turns and never spoke." / "لينا كانت تايهة {n} مداخلات وما حكت ولا كلمة."

**Gender rules:**
- Sentences about the teacher avoid gender: use the past tense (سألت، وصلت), the explanation as subject (وصل شرحك), or noun forms (المرة القادمة: …). Use مس → feminine and أستاذ → masculine only where unavoidable ("كمعلّمة/كمعلّم").
- Text addressed to a kid (`next_check`) uses the kid's gender.
- Use مداخلة for "turn" and محاولة for "attempt".

### B4.6 "How scoring works" modal

**EN:**
- "Each kid holds one misconception known from research. A badge moves up only when the AI judge finds that your words meet that kid's fixed checklist, and it must quote you."
- "Points are then counted by fixed rules: Reached every learner 40 (5 per step), Checked for understanding 20 (10 per real question), Included Lina 15, Stretched Yazan 10, Reasons and examples 15 (AI, fixed anchors 0–5)."
- "“فاهمين؟” and other yes/no checks never move a badge and earn no points."
- "A score for one practice lesson, not a rating of you as a teacher."
- "Informed by: Rosenshine's Principles of Instruction; Wiliam's formative assessment; TeachingWorks high-leverage practices; Hattie & Timperley's model of feedback."

**AR:**
- "كل طالب عنده مفهوم بديل واحد معروف في الأبحاث. لا تتقدّم الشارة إلا إذا وجد المقيّم الآلي أن كلماتك تحقق قائمة شروط ثابتة لهذا الطالب، ويجب أن يقتبس كلامك."
- "ثم تُحسب النقاط بقواعد ثابتة: الوصول إلى كل طالب 40 (5 لكل خطوة)، التحقق من الفهم 20 (10 لكل سؤال حقيقي)، إشراك لينا 15، تحدّي يزن 10، الشرح بالأسباب والأمثلة 15 (ذكاء اصطناعي بمعايير ثابتة 0-5)."
- "«فاهمين؟» وأسئلة آه أو لا لا تحرّك أي شارة ولا تعطي نقاطاً."
- "نتيجة لدرس تدريبي واحد، وليست تقييماً لك كمعلّم/كمعلّمة."

---

## B5. AI prompts (put in `server/ai/prompts.ts` verbatim)

### B5.1 Judge (system prompt)

```
You are the evaluation engine of Sabboura, a teacher-training simulator.

You receive JSON with: the topic, the kids (id, current level, misconception,
helped_if, hurt_if), the teacher's LATEST turn (a transcript in Arabic,
English or both) and the previous turns, for context only.

For EACH kid, judge only the LATEST turn:
- evidence: first, copy the exact words from the transcript that matter for
  this kid, or null if none.
- helped: "fully" if the teacher's words clearly and completely meet the
  kid's helped_if; "partly" if they touch it but are vague or incomplete;
  "no" otherwise. Be strict: a rule with no reason does not count, and
  saying the right answer does not count unless helped_if is met.
- hurt: true only if the teacher's words match the kid's hurt_if.

Then classify how the teacher checked understanding in the latest turn:
- "yes_no": a yes/no comprehension check such as "فاهمين؟", "مفهوم؟",
  "واضح؟", "Do you understand?", "OK?", "Got it?"
- "question": a question that needs a real answer
  (e.g. "Which is bigger, a half or a third? Why?")
- "none"
If both appear, choose "question".
Set asked_kid to the kid's id if the teacher addressed a kid by name
(Arabic or English, including close spellings such as لينة or Lena),
otherwise null.

Return only JSON that matches the schema.
```

**Schema (zod, an object keyed by kid so all 5 appear exactly once; evidence first):**

```ts
const Verdict = z.object({ evidence: z.string().nullable(), helped: z.enum(['no','partly','fully']), hurt: z.boolean() });
export const JudgeOut = z.object({
  kids: z.object({ omar: Verdict, lina: Verdict, sara: Verdict, khaled: Verdict, yazan: Verdict }),
  check: z.enum(['none','yes_no','question']),
  asked_kid: z.enum(['omar','lina','sara','khaled','yazan']).nullable(),
});
```

### B5.2 Kid lines (system prompt)

```
You write what kids say in a simulated Jordanian classroom.

You receive: the language, how the kids address the teacher (e.g. "مس",
"أستاذ", "Miss", "Sir"), what the teacher just said, and a list of
speakers. Each speaker has a name, gender, personality, secret
misconception, current level (0 = lost, 1 = partly, 2 = got it) and the
reason they speak:
- "objection": voice your misconception honestly, as a question or claim.
- "answer": answer the teacher's question using ONLY what you understand
  now (level 0: wrong, from your misconception; level 1: half right;
  level 2: right, in your own words).
- "timid_yes": a short, unsure "yes".
- "aha": you just got it. Say so briefly, in your own words.
- "bored": you already get it and want something harder.

Rules:
- One line per speaker, at most 12 words, the way a real 10-year-old talks.
- Arabic: natural Jordanian dialect (e.g. "مس"، "ليش"، "يعني"، "هاد"),
  not formal Arabic. English: simple kid English.
- Lina is shy: her lines are short and quiet.
- Never explain better than the teacher did. Never break character.
  No emojis.
- "text" is what the caption shows. "say" is the same line for the
  voice, with numbers and fractions written as spoken words
  (1/3 -> "تلت", 1/2 -> "نص"; in English "a third", "a half").
- "text_en" is a short English translation of "text" (used for subtitles
  when the lesson is in Arabic; same as "text" in English lessons).

Return only JSON that matches the schema.
```

**Schema:** `LinesOut = z.object({ lines: z.array(z.object({ kid: KidId, text: z.string(), say: z.string(), text_en: z.string() })) })`. For canned and starter lines, `text_en` comes from the `en` field in canned.json.

### B5.3 Scorer (system prompt)

```
You are a kind, expert teacher-educator writing a short after-lesson review
for a teacher who practised with simulated kids. You receive JSON: topic,
lesson language, the teacher's title (مس/أستاذ/Miss/Sir), the full lesson
log (turn numbers, the teacher's transcripts, the kids' lines, level
changes with evidence), the computed metrics, best_turn and focus_move
(both chosen by code).

Write:
- clarity (0-5) using ONLY these anchors: 0 = no explanation of the idea
  yet; 1 = states the rule or answer only; 2 = rule plus a vague or partly
  wrong reason; 3 = a correct reason in words; 4 = a correct reason plus one
  picture, model or real-life example; 5 = a correct reason plus a model or
  example, clearly linked back to the question.
- clarity_reason: one sentence quoting the teacher's exact words.
- why_it_worked: one sentence on what best_turn did for which kids.
- one_tip: one sentence about focus_move only.
- try_saying: one sentence the teacher could say next time, in the lesson
  language.

Rules: talk only about what the teacher said and what the kids did; never
praise or judge the teacher as a person; never use poor, weak, bad, failed
or wrong (ضعيف، سيء، فاشل، خطأ) about the teacher; each text at most 25
words; Arabic in clear Modern Standard Arabic with light Jordanian warmth,
addressing the teacher as female for مس and male for أستاذ; quote only
words that appear in the log. Return only JSON that matches the schema.
```

**Schema:** `ScorerOut = z.object({ clarity: z.number(), clarity_reason: z.string(), why_it_worked: z.string(), one_tip: z.string(), try_saying: z.string() })`. Clamp clarity to 0–5 in code.

**Fallback** if the scorer fails twice: use `data/feedback.json` for `focus_move`, with clarity = 3 if any kid was ever helped `fully`, 2 if only `partly`, else 1.

### B5.4 Voice (TTS system prompt)

```
You are a voice actor in a school play. The user message is a script line,
not a question for you. Read it aloud EXACTLY as written, word for word,
then stop. Never answer it, explain it, translate it or add words.
Voice: a lively 10-year-old {boy|girl} from Amman, Jordanian Arabic accent,
quick and natural.
```

The English version replaces the accent line with "simple kid English". For Lina, add "shy and quiet".

---

## B6. Data files (create these files with EXACTLY this content)

### B6.1 `data/topics.json`

The kids, labels, chorus text, and the 3 topics. Each kid has a misconception, `helped_if`, `hurt_if`, a `reveal` and a `next_check`.

```json
{
  "kids": [
    {
      "id": "omar",
      "name": {
        "en": "Omar",
        "ar": "عمر"
      },
      "gender": "m",
      "vocal": true,
      "labels": "understanding",
      "personality": "Confident, often wrong, hand always up.",
      "failsafe": {
        "en": "Can you say that again?",
        "ar": "مرة كمان؟"
      }
    },
    {
      "id": "lina",
      "name": {
        "en": "Lina",
        "ar": "لينا"
      },
      "gender": "f",
      "vocal": false,
      "labels": "understanding",
      "personality": "Shy. Never volunteers. Speaks only when asked by name, quietly and briefly.",
      "failsafe": {
        "en": "Um...",
        "ar": "امم..."
      }
    },
    {
      "id": "sara",
      "name": {
        "en": "Sara",
        "ar": "سارة"
      },
      "gender": "f",
      "vocal": true,
      "labels": "understanding",
      "personality": "Literal. Always asks 'but why?'",
      "failsafe": {
        "en": "But why?",
        "ar": "بس ليش؟"
      }
    },
    {
      "id": "khaled",
      "name": {
        "en": "Khaled",
        "ar": "خالد"
      },
      "gender": "m",
      "vocal": true,
      "labels": "understanding",
      "personality": "Practical. Wants real-life examples.",
      "failsafe": {
        "en": "When would I use this?",
        "ar": "وين رح أستخدم هاد؟"
      }
    },
    {
      "id": "yazan",
      "name": {
        "en": "Yazan",
        "ar": "يزن"
      },
      "gender": "m",
      "vocal": true,
      "labels": "engagement",
      "personality": "Fast learner. Gets bored without a challenge.",
      "failsafe": {
        "en": "Can we do something harder?",
        "ar": "في إشي أصعب؟"
      }
    }
  ],
  "labels": {
    "understanding": {
      "en": [
        "Lost",
        "Partly",
        "Got it"
      ],
      "ar_m": [
        "تايه",
        "نص نص",
        "فاهم"
      ],
      "ar_f": [
        "تايهة",
        "نص نص",
        "فاهمة"
      ]
    },
    "engagement": {
      "en": [
        "Bored",
        "Waiting",
        "Challenged"
      ],
      "ar_m": [
        "زهقان",
        "مستني",
        "متحمّس"
      ],
      "ar_f": [
        "زهقانة",
        "مستنية",
        "متحمّسة"
      ]
    }
  },
  "chorus": {
    "ar_miss": "آه مس!",
    "ar_sir": "آه أستاذ!",
    "en_miss": "Yes, Miss!",
    "en_sir": "Yes, Sir!"
  },
  "topics": [
    {
      "id": "fractions",
      "title": {
        "en": "Comparing fractions",
        "ar": "مقارنة الكسور"
      },
      "grade": "4-5",
      "vocab": "كسر، كسور، بسط، مقام، نص، ثلث، ربع، منسف، fraction, numerator, denominator, half, third, quarter",
      "kids": {
        "omar": {
          "start_level": 0,
          "misconception": "Thinks a bigger bottom number means a bigger fraction: 3 is bigger than 2, so 1/3 is bigger than 1/2.",
          "helped_if": "Explains that cutting one whole into MORE equal parts makes EACH part SMALLER (e.g. one mansaf shared by 3 people instead of 2).",
          "hurt_if": "Says or implies that the bigger number makes the bigger fraction.",
          "reveal": {
            "en": "Thought a bigger bottom number means a bigger fraction. Needed to see that more equal parts means each part is smaller.",
            "ar": "كان مفكّر إنه كل ما كبر الرقم تحت بيكبر الكسر. كان بدّه يشوف إنه كل ما زادت القطع، صغرت كل قطعة."
          },
          "next_check": {
            "en": "Which is bigger, 1/5 or 1/4? How do you know?",
            "ar": "أيهما أكبر: 1/5 ولا 1/4؟ كيف عرفت؟"
          }
        },
        "lina": {
          "start_level": 0,
          "misconception": "Sees a fraction as two separate whole numbers (1 and 3), not as one amount.",
          "helped_if": "Shows a fraction as ONE amount: a part of one whole (food, a drawing, a shape) or one point on a number line.",
          "hurt_if": "Treats the top and bottom numbers as two separate numbers to compare.",
          "reveal": {
            "en": "Saw a fraction as two separate numbers. A drawing of one whole cut into parts, or a number line, would have helped.",
            "ar": "كانت شايفة الكسر رقمين منفصلين. رسمة لشي كامل مقسوم لقطع، أو خط الأعداد، كان رح يساعدها."
          },
          "next_check": {
            "en": "Show me where 1/3 goes on a line from 0 to 1.",
            "ar": "وين بتحطي 1/3 على خط من 0 لـ 1؟"
          }
        },
        "sara": {
          "start_level": 0,
          "misconception": "Memorised 'bigger bottom number = smaller fraction' with no idea why.",
          "helped_if": "Gives the REASON (more equal parts means each part is smaller), not only the rule.",
          "hurt_if": "Says 'just memorise the rule' or only repeats the rule.",
          "reveal": {
            "en": "Had memorised the rule with no reason. Needed to hear why it works.",
            "ar": "كانت حافظة القاعدة بدون ما تعرف ليش. كانت بدها تسمع السبب."
          },
          "next_check": {
            "en": "Why is 1/8 smaller than 1/4? Tell me the reason, not the rule.",
            "ar": "ليش 1/8 أصغر من 1/4؟ احكيلي السبب، مش القاعدة."
          }
        },
        "khaled": {
          "start_level": 0,
          "misconception": "Can't see why fractions matter in real life.",
          "helped_if": "Uses a concrete real-life example (mansaf, pizza, ka'ak, a chocolate bar, money).",
          "hurt_if": "Says it only matters for the exam.",
          "reveal": {
            "en": "Couldn't see where he'd use it. A real-life example (mansaf, pizza, ka'ak) would have reached him.",
            "ar": "ما كان شايف وين رح يستخدمها. مثال من الحياة (منسف، بيتزا، كعك) كان رح يوصله."
          },
          "next_check": {
            "en": "You want the biggest slice of pizza: 1/6 or 1/3?",
            "ar": "بدك أكبر قطعة بيتزا: 1/6 ولا 1/3؟"
          }
        },
        "yazan": {
          "start_level": 1,
          "misconception": "Already understands. Gets bored when the basics are repeated.",
          "helped_if": "Gives him a harder challenge (e.g. which is bigger, 3/4 or 4/5?) or asks him to explain to the class.",
          "hurt_if": "Repeats the same basic point again with nothing new.",
          "reveal": {
            "en": "Already understood. A harder challenge (3/4 or 4/5?) would have kept him with you.",
            "ar": "كان فاهم من الأول. سؤال أصعب (3/4 ولا 4/5؟) كان رح يخلّيه معك."
          },
          "next_check": {
            "en": "Which is bigger, 3/4 or 4/5? Explain how you know.",
            "ar": "أيهما أكبر: 3/4 ولا 4/5؟ فسّر كيف عرفت."
          }
        }
      }
    },
    {
      "id": "negatives",
      "title": {
        "en": "Negative numbers",
        "ar": "الأعداد السالبة"
      },
      "grade": "6-7",
      "vocab": "سالب، موجب، صفر، خط الأعداد، حرارة، دين، negative, positive, zero, number line, temperature, debt",
      "kids": {
        "omar": {
          "start_level": 0,
          "misconception": "Thinks -5 is bigger than -2 because 5 is bigger than 2.",
          "helped_if": "Uses a number line, temperature or floors to show that numbers further below zero are smaller.",
          "hurt_if": "Compares negative numbers by their digits only.",
          "reveal": {
            "en": "Compared -5 and -2 by the digits. A number line or temperatures would have helped.",
            "ar": "كان بقارن −5 و −2 بالأرقام بس. خط الأعداد أو درجات الحرارة كانت رح تساعده."
          },
          "next_check": {
            "en": "Which is colder, -5° or -2°?",
            "ar": "أيهما أبرد: −5 ولا −2 درجة؟"
          }
        },
        "lina": {
          "start_level": 0,
          "misconception": "Thinks negative numbers aren't real numbers.",
          "helped_if": "Gives negative numbers a real meaning (debt, temperature below zero, floors below ground).",
          "hurt_if": "Presents negative numbers as rules with no meaning.",
          "reveal": {
            "en": "Didn't believe negative numbers are real. Debt or a temperature below zero would have made them real.",
            "ar": "ما كانت مصدقة إنه الأعداد السالبة حقيقية. الدَّين أو الحرارة تحت الصفر كانت رح تقنعها."
          },
          "next_check": {
            "en": "Tell me one place in real life where you see a negative number.",
            "ar": "احكيلي مكان بالحياة بتشوفي فيه عدد سالب."
          }
        },
        "sara": {
          "start_level": 0,
          "misconception": "Thinks 3 - (-2) = 1, because 'minus is always minus'.",
          "helped_if": "Explains WHY subtracting a negative makes the result bigger (e.g. removing a debt), not only 'two minuses make a plus'.",
          "hurt_if": "Says 'two minuses make a plus, just memorise it'.",
          "reveal": {
            "en": "Thought taking away a negative still makes it smaller. Removing a debt shows why it goes up.",
            "ar": "كانت مفكرة إنه الطرح دايماً بنقّص. شطب دَين بوضّح ليش النتيجة بتزيد."
          },
          "next_check": {
            "en": "You owe 2 dinars and someone cancels the debt. Are you richer or poorer?",
            "ar": "عليكي دينارين، وحدا شطب الدَّين. صرتي أغنى ولا أفقر؟"
          }
        },
        "khaled": {
          "start_level": 0,
          "misconception": "Can't see where negative numbers appear in real life.",
          "helped_if": "Uses temperature, money and debt, or lift floors.",
          "hurt_if": "Says it only matters for the exam.",
          "reveal": {
            "en": "Needed a real example: temperature, money or lift floors.",
            "ar": "كان بدّه مثال من الحياة: الحرارة، المصاري، أو طوابق المصعد."
          },
          "next_check": {
            "en": "The lift is at floor -1 and goes up 3 floors. Where is it now?",
            "ar": "المصعد على طابق −1 وطلع 3 طوابق. وين صار؟"
          }
        },
        "yazan": {
          "start_level": 1,
          "misconception": "Already understands. Gets bored when the basics are repeated.",
          "helped_if": "Gives a harder challenge (e.g. -3 - (-7)) or asks him to explain to the class.",
          "hurt_if": "Repeats the basics with nothing new.",
          "reveal": {
            "en": "Already understood. A harder problem like -3 - (-7) would have kept him with you.",
            "ar": "كان فاهم من الأول. مسألة أصعب مثل −3 − (−7) كانت رح تخلّيه معك."
          },
          "next_check": {
            "en": "What is -3 - (-7)? Show it on a number line.",
            "ar": "قديش −3 − (−7)؟ وضّحها على خط الأعداد."
          }
        }
      }
    },
    {
      "id": "photosynthesis",
      "title": {
        "en": "Photosynthesis",
        "ar": "البناء الضوئي"
      },
      "grade": "7-8",
      "vocab": "بناء ضوئي، تنفس، ثاني أكسيد الكربون، أكسجين، جلوكوز، ضوء، photosynthesis, respiration, carbon dioxide, oxygen, glucose, light",
      "kids": {
        "omar": {
          "start_level": 0,
          "misconception": "Thinks plants get their food from the soil.",
          "helped_if": "Explains that plants MAKE their own food (glucose) from carbon dioxide and water, using light.",
          "hurt_if": "Says plants eat or get their food from the soil.",
          "reveal": {
            "en": "Thought plants eat from the soil. Needed to hear that they make their own food from air, water and light.",
            "ar": "كان مفكر إنه النبتة بتوكل من التراب. كان لازم يسمع إنها بتصنع أكلها من الهوا والمي والضو."
          },
          "next_check": {
            "en": "A tree weighs 500 kg. Where did most of that mass come from?",
            "ar": "شجرة وزنها 500 كيلو. من وين إجا معظم وزنها؟"
          }
        },
        "lina": {
          "start_level": 0,
          "misconception": "Thinks plants don't breathe (respire).",
          "helped_if": "Says plants respire all the time, day and night, like animals.",
          "hurt_if": "Says plants only breathe at night, or don't breathe.",
          "reveal": {
            "en": "Thought plants don't breathe. Needed to hear that they respire day and night.",
            "ar": "كانت مفكرة إنه النباتات ما بتتنفس. كان لازم تسمع إنها بتتنفس ليل ونهار."
          },
          "next_check": {
            "en": "Does a plant breathe at night? And in the day?",
            "ar": "النبتة بتتنفس بالليل؟ وبالنهار؟"
          }
        },
        "sara": {
          "start_level": 0,
          "misconception": "Mixes up photosynthesis and breathing: 'plants breathe in CO2 instead of oxygen'.",
          "helped_if": "Clearly separates photosynthesis (takes in CO2, gives out O2, needs light) from respiration (takes in O2, all the time).",
          "hurt_if": "Says plants 'breathe CO2' or mixes the two processes up.",
          "reveal": {
            "en": "Mixed up photosynthesis and breathing. Needed the two processes side by side.",
            "ar": "كانت خالطة بين البناء الضوئي والتنفس. كانت بدها تشوفهم جنب بعض."
          },
          "next_check": {
            "en": "What does a leaf take in for photosynthesis, and what for respiration?",
            "ar": "شو بتاخد الورقة بالبناء الضوئي؟ وشو بتاخد بالتنفس؟"
          }
        },
        "khaled": {
          "start_level": 0,
          "misconception": "Can't see why photosynthesis matters.",
          "helped_if": "Uses a concrete example (e.g. most of a tree's mass comes from the air; all the food we eat starts with photosynthesis).",
          "hurt_if": "Sticks to textbook definitions only.",
          "reveal": {
            "en": "Needed something real: most of a tree's mass comes from the air.",
            "ar": "كان بدّه إشي حقيقي: معظم وزن الشجرة جاي من الهوا."
          },
          "next_check": {
            "en": "Name one food you ate today that started with photosynthesis.",
            "ar": "احكيلي أكلة أكلتها اليوم بلّشت من البناء الضوئي."
          }
        },
        "yazan": {
          "start_level": 1,
          "misconception": "Already understands. Gets bored when the basics are repeated.",
          "helped_if": "Gives a harder question (e.g. why does a plant in a dark room die even with water and soil?) or asks him to explain to the class.",
          "hurt_if": "Repeats the basics with nothing new.",
          "reveal": {
            "en": "Already understood. A harder question (why does a plant die in the dark?) would have kept him with you.",
            "ar": "كان فاهم من الأول. سؤال أصعب (ليش النبتة بتموت بالعتمة؟) كان رح يخلّيه معك."
          },
          "next_check": {
            "en": "Why does a plant in a dark room die even with water and soil?",
            "ar": "ليش النبتة بتموت بغرفة معتمة حتى لو في مي وتراب؟"
          }
        }
      }
    }
  ]
}
```

### B6.2 `data/canned.json`

Starter lines (each kid's first objection, pre-voiced), reason lines and Lina's lost answer.

```json
{
  "_note": "{t} = مس or أستاذ (Arabic), Miss or Sir (English). 'say' = the same line written the way it is spoken, used only for the voice.",
  "starters": {
    "fractions": {
      "omar": {
        "ar": "{t}، بس 3 أكبر من 2! ليش 1/3 أصغر؟",
        "say_ar": "{t}، بس تلاتة أكبر من اتنين! ليش التلت أصغر؟",
        "en": "{t}, but 3 is bigger than 2! Why is 1/3 smaller?",
        "say_en": "{t}, but three is bigger than two! Why is a third smaller?"
      },
      "sara": {
        "ar": "ليش؟ مش منطقي!",
        "en": "But why? That makes no sense!"
      },
      "khaled": {
        "ar": "{t}، وين رح أستخدم هاد بحياتي؟",
        "en": "{t}, when will I ever use this?"
      }
    },
    "negatives": {
      "omar": {
        "ar": "{t}، بس 5 أكبر من 2! يعني −5 أكبر، صح؟",
        "say_ar": "{t}، بس خمسة أكبر من اتنين! يعني سالب خمسة أكبر، صح؟",
        "en": "{t}, but 5 is bigger than 2! So -5 is bigger, right?",
        "say_en": "{t}, but five is bigger than two! So minus five is bigger, right?"
      },
      "sara": {
        "ar": "بس ليش؟ الناقص دايماً بنقّص!",
        "en": "But why? Minus always makes it smaller!"
      },
      "khaled": {
        "ar": "{t}، وين بشوف أعداد سالبة أصلاً؟",
        "en": "{t}, where would I even see negative numbers?"
      }
    },
    "photosynthesis": {
      "omar": {
        "ar": "{t}، النبتة بتوكل من التراب، صح؟",
        "en": "{t}, plants eat from the soil, right?"
      },
      "sara": {
        "ar": "بس ليش بتتنفس ثاني أكسيد الكربون؟",
        "en": "But why do plants breathe in carbon dioxide?"
      },
      "khaled": {
        "ar": "{t}، وشو دخلي أنا بالنباتات؟",
        "en": "{t}, why does this even matter to me?"
      }
    }
  },
  "reasons": {
    "aha": {
      "ar": "آآه... هلأ فهمت!",
      "en": "Ohh... I get it now!"
    },
    "aha_lina": {
      "ar": "آه... فهمت!",
      "en": "Oh... I get it!"
    },
    "bored": {
      "ar": "{t}، هاد سهل... في إشي أصعب؟",
      "en": "{t}, this is easy... can we do something harder?"
    },
    "timid_yes": {
      "ar": "امم... آه.",
      "en": "Um... yes?"
    }
  },
  "answer_lost": {
    "fractions": {
      "lina": {
        "ar": "امم... التلت؟ لأنه 3 أكبر من 2؟",
        "say_ar": "امم... التلت؟ لأنه تلاتة أكبر من اتنين؟",
        "en": "Um... a third? Because 3 is bigger than 2?"
      }
    },
    "negatives": {
      "lina": {
        "ar": "امم... بس الأعداد السالبة مش حقيقية، صح؟",
        "en": "Um... but negative numbers aren't real, right?"
      }
    },
    "photosynthesis": {
      "lina": {
        "ar": "امم... النباتات ما بتتنفس، صح؟",
        "en": "Um... plants don't breathe, right?"
      }
    }
  }
}
```

### B6.3 `data/judge-tests.json`

The test sheet. Rows 11–15 are the judge cue-card sentences in other wordings (Modern Standard Arabic, English, the name spelled لينة).

```json
[
  {
    "id": 1,
    "lang": "ar",
    "text": "القاعدة: كل ما كبر المقام، صغر الكسر. يعني 1/3 أصغر من 1/2.",
    "expect": {
      "helped": {
        "omar": [
          "no"
        ],
        "lina": [
          "no"
        ],
        "sara": [
          "no"
        ],
        "khaled": [
          "no"
        ]
      },
      "check": [
        "none"
      ],
      "speakers": [
        "omar:objection",
        "sara:objection"
      ]
    }
  },
  {
    "id": 2,
    "lang": "ar",
    "text": "احفظوا القاعدة وخلص. فاهمين؟",
    "expect": {
      "hurt": {
        "sara": true
      },
      "check": [
        "yes_no"
      ],
      "chorus": true,
      "unchanged": [
        "omar",
        "lina",
        "sara",
        "khaled"
      ]
    }
  },
  {
    "id": 3,
    "lang": "ar",
    "text": "لينا، أيهما أكبر: نص ولا ثلث؟",
    "expect": {
      "check": [
        "question"
      ],
      "asked_kid": "lina",
      "speakers": [
        "lina:answer"
      ]
    }
  },
  {
    "id": 4,
    "lang": "ar",
    "text": "تخيلي منسف واحد. إذا قسمناه على 2، كل واحد بوخذ نصه. إذا على 3، كل واحد بوخذ ثلث، يعني حصة أصغر. عشان هيك النص أكبر.",
    "expect": {
      "helped": {
        "omar": [
          "fully"
        ],
        "lina": [
          "fully"
        ],
        "sara": [
          "fully"
        ],
        "khaled": [
          "fully"
        ]
      },
      "speakers": [
        "lina:aha",
        "omar:aha"
      ]
    }
  },
  {
    "id": 5,
    "lang": "en",
    "text": "Think of a pizza cut into 3 slices instead of 2. More slices means each slice is smaller.",
    "expect": {
      "helped": {
        "omar": [
          "fully"
        ],
        "sara": [
          "fully"
        ],
        "khaled": [
          "fully"
        ],
        "lina": [
          "partly",
          "fully"
        ]
      }
    }
  },
  {
    "id": 6,
    "lang": "en",
    "text": "Yazan, which is bigger: 3/4 or 4/5? Explain to the class.",
    "expect": {
      "helped": {
        "yazan": [
          "fully"
        ]
      },
      "check": [
        "question"
      ],
      "asked_kid": "yazan",
      "speakers": [
        "yazan:answer"
      ]
    }
  },
  {
    "id": 7,
    "lang": "en",
    "text": "The bigger number always wins.",
    "expect": {
      "hurt": {
        "omar": true,
        "lina": true
      }
    }
  },
  {
    "id": 8,
    "lang": "en",
    "text": "Any questions? OK?",
    "expect": {
      "check": [
        "yes_no"
      ],
      "chorus": true
    }
  },
  {
    "id": 9,
    "lang": "en",
    "text": "Draw a number line from 0 to 1. 1/3 is closer to 0 than 1/2.",
    "expect": {
      "helped": {
        "lina": [
          "fully",
          "partly"
        ]
      }
    }
  },
  {
    "id": 10,
    "lang": "en",
    "text": "Sara, why does a bigger bottom number make a smaller fraction?",
    "expect": {
      "check": [
        "question"
      ],
      "asked_kid": "sara",
      "speakers": [
        "sara:answer"
      ]
    }
  },
  {
    "id": 11,
    "lang": "ar",
    "text": "لينا، أيُّهما أكبر: النصف أم الثلث؟",
    "expect": {
      "check": [
        "question"
      ],
      "asked_kid": "lina",
      "speakers": [
        "lina:answer"
      ]
    }
  },
  {
    "id": 12,
    "lang": "ar",
    "text": "تخيّلي منسفاً واحداً. إذا قسمناه على اثنين يأخذ كل واحد نصفه، وإذا قسمناه على ثلاثة يأخذ كل واحد ثلثه، أي حصة أصغر. لذلك النصف أكبر.",
    "expect": {
      "helped": {
        "lina": [
          "fully"
        ],
        "omar": [
          "fully"
        ]
      },
      "speakers": [
        "lina:aha",
        "omar:aha"
      ]
    }
  },
  {
    "id": 13,
    "lang": "en",
    "text": "Lina, which is bigger: a half or a third?",
    "expect": {
      "check": [
        "question"
      ],
      "asked_kid": "lina",
      "speakers": [
        "lina:answer"
      ]
    }
  },
  {
    "id": 14,
    "lang": "en",
    "text": "Imagine one mansaf. Share it between 2 people and each gets a half. Share it between 3 and each gets a third, a smaller share. So a half is bigger.",
    "expect": {
      "helped": {
        "lina": [
          "fully"
        ],
        "omar": [
          "fully"
        ]
      },
      "speakers": [
        "lina:aha",
        "omar:aha"
      ]
    }
  },
  {
    "id": 15,
    "lang": "ar",
    "text": "لينة، شو الأكبر: النص ولا التلت؟",
    "expect": {
      "check": [
        "question"
      ],
      "asked_kid": "lina",
      "speakers": [
        "lina:answer"
      ]
    }
  }
]
```

### B6.4 `data/feedback.json`

The scorer fallback.

```json
{
  "_note": "Used only when the scorer AI fails twice. Pick the entry for focus_move. try_saying 'next_check' means: use that kid's next_check from topics.json.",
  "reached": {
    "tip": {
      "en": "Pick one kid who is still lost and show the idea with one drawing or a real-life example.",
      "ar": "المرة القادمة: رسمة واحدة أو مثال من الحياة لطالب ما زال تائهاً."
    },
    "try_saying": {
      "en": "Imagine one pizza shared by 2 people, then by 3. Who gets more?",
      "ar": "تخيّلوا بيتزا وحدة بنقسمها على 2، وبعدين على 3. مين بياخد أكثر؟"
    }
  },
  "checks": {
    "tip": {
      "en": "Swap \"Everyone understand?\" for a question that needs a real answer.",
      "ar": "المرة القادمة: بدل «فاهمين؟» سؤال يحتاج جواباً حقيقياً."
    },
    "try_saying": {
      "en": "Which is bigger, a half or a third? Why?",
      "ar": "أيهما أكبر: نص ولا ثلث؟ ليش؟"
    }
  },
  "lina": {
    "tip": {
      "en": "Ask Lina by name, early, with a short question she can answer.",
      "ar": "المرة القادمة: سؤال للينا باسمها من بداية الدرس، تقدر تجاوبه بكلمتين."
    },
    "try_saying": "next_check:lina"
  },
  "yazan": {
    "tip": {
      "en": "Yazan already understood. Give him a harder one so he stays with you.",
      "ar": "يزن كان فاهم من الأول. سؤال أصعب بيخلّيه معك."
    },
    "try_saying": "next_check:yazan"
  },
  "clarity": {
    "tip": {
      "en": "Give the reason, not only the rule, and show it with a picture or example.",
      "ar": "المرة القادمة: السبب وليس القاعدة فقط، مع رسمة أو مثال."
    },
    "try_saying": {
      "en": "More equal parts means each part is smaller. That is why 1/3 is smaller than 1/2.",
      "ar": "كل ما زادت القطع المتساوية، صغرت كل قطعة. عشان هيك 1/3 أصغر من 1/2."
    }
  },
  "fallback_clarity_rule": "3 if any kid was ever helped 'fully', 2 if only 'partly', else 1"
}
```

### B6.5 `data/demo-script.json`

The 4 demo lines, used by Shift+1..4 in stage mode.

```json
{
  "_note": "Shift+1..4 in stage mode sends line N as a typed turn through the normal /turn pipeline (real AI; only transcription is skipped). Lesson: fractions, ar, miss.",
  "lines": [
    {
      "n": 1,
      "act": 1,
      "who": "teammate",
      "ar": "اليوم رح نقارن الكسور. القاعدة: كل ما كبر المقام، صغر الكسر. يعني 1/3 أصغر من 1/2.",
      "en": "Today we compare fractions. The rule: the bigger the bottom number, the smaller the fraction. So 1/3 is smaller than 1/2."
    },
    {
      "n": 2,
      "act": 1,
      "who": "teammate",
      "ar": "احفظوا القاعدة وخلص. فاهمين؟",
      "en": "Just memorise the rule. Everyone understand?"
    },
    {
      "n": 3,
      "act": 2,
      "who": "judge",
      "ar": "لينا، أيهما أكبر: نص ولا ثلث؟",
      "en": "Lina, which is bigger: a half or a third?"
    },
    {
      "n": 4,
      "act": 2,
      "who": "judge",
      "ar": "تخيلي منسف واحد. إذا قسمناه على 2، كل واحد بوخذ نصه. إذا قسمناه على 3، كل واحد بوخذ ثلث، يعني حصة أصغر. عشان هيك النص أكبر.",
      "en": "Imagine one mansaf. Share it between 2 people and each gets a half. Share it between 3 and each gets a third, a smaller share. So a half is bigger."
    }
  ]
}
```

---

## B7. Avatars (`npm run gen:avatars`, run once in the workspace)

**The room is code, not images.** The board, ledge, desks and stone pattern are small inline SVG or CSS shapes: flat, with 2px `--ledge` outlines and no gradients. **Time-box: 30 minutes.**

**The kids are images,** made once by `scripts/gen-avatars.ts` through Replit AI Integrations (`IMAGE_MODEL`, falling back to `gpt-image-1`). Agent's built-in Image Generation also works. Save them as 512×512 WebP files (about 50 KB each):
- `client/public/avatars/{kid}-{state}.webp`, with states `neutral`, `happy`, plus `bored` for Yazan;
- `class.webp` (all 5).

**Never generate images at runtime.**

**Style block** (paste into every prompt):

> Warm picture-book illustration for a learning app. Flat colours with one soft shadow tone each, a clean even dark-brown outline (#2B2118) around every shape. Simple rounded shapes, no sharp points. No gradients, texture, 3D or photo-realism. Big friendly eyes with one highlight, small nose and mouth, head about 45% of body height. Natural warm skin tones. Modern school. No traditional costume, keffiyeh or flags. No text, letters, numbers, logos or emblems. Background: one flat colour #EFE2CB.

**Uniform:** navy V-neck sweater (boys) or navy pinafore (girls) over a light-blue collared shirt. No red, amber, teal or terracotta on any clothing.

**Cast:**
- **Omar:** spiky black hair, medium olive skin, confident grin.
- **Lina:** dark-brown low ponytail with a light-blue clip, light olive skin, shy.
- **Sara:** white school hijab, warm medium-brown skin, one eyebrow raised.
- **Khaled:** curly dark hair, light-tan skin, sleeves pushed up, wristwatch.
- **Yazan:** side-parted brown hair, round glasses, medium olive skin.

**Flow:**
1. Make one anchor class picture (all 5, waist up, sitting at desks).
2. Make each portrait (head and shoulders, centred) as an **image edit** of the anchor: "keep exactly the same face… change only the expression to {neutral|happy|bored}".
3. If edits aren't supported through Replit, use a text-only prompt with the full style block and the cast line, and accept some drift.
4. Allow at most 2 tries per image. Support `--only=lina-happy`.

**Banned:** Petra, camels, coffee pots, flags, keffiyeh patterns, geometric tiles, desert scenes, decorative calligraphy, "Duolingo style" in prompts.

**Saturday check with a Jordanian teacher:** the uniform, and the mixed class. (Public schools separate boys and girls after Grade 3, so present this as a private-school class.)

---

# PART C. Building it on Replit

## C1. Which model and mode ("Opus 5.5 max", explained)

There are **two different models**, and they are set in two different places.

| | What it is | Where you set it | What to choose |
|---|---|---|---|
| **The builder** | Replit Agent, which writes our code | Agent prompt box → mode dropdown | **Max mode → Primary model: Claude Opus 5.5 → Effort: High** |
| **The app's brain** | What the app calls while it runs (judge, kid lines, review) | Replit **Secrets** (B3.2), read by our code | `claude-opus-5-5` first, with automatic fallback to `claude-opus-5` / `claude-sonnet-5` |

**Effort for the builder:**
- **High** for most prompts.
- **Extra High** for P3 and P4 (the turn pipeline and audio sync).
- **Max** only for one stuck bug, then back to High. Max is "the highest cost and slowest", and we only have about 10.5 hours.

**Builder settings to know:**
- If "Primary model" doesn't appear on our account, model selection hasn't reached us yet: use **Max + Auto**.
- New sessions and teammates start in **Free mode**. Check the mode label before every big prompt.

**At the 10:30 Replit session, check:**
1. Which plan and how many credits we got.
2. AI Integrations are enabled. The first AI prompt should show "Anthropic (Replit managed)" and "OpenAI (Replit managed)". On Pro/Enterprise workspaces, an admin has to switch them on.
3. The Max list shows Claude Opus 5.5.
4. Settings → Personalization → Agent → Project send behavior = **Queue**, so a message sent mid-turn doesn't change the running turn.
5. Agent dropdown → Advanced → **App Testing ON**. Its browser has no mic, so it tests the typed path and `/dev/test`.
6. Ask the Replit MENA partnerships lead: is `claude-opus-5-5` enabled for AI Integrations?
7. Set a usage alert. The usage page can lag by 30 minutes.

## C2. How to hand this spec to Replit

1. **Create the project:** Replit home → describe "Sabboura" → app type **Web app** (not General). Keep **one driver**: only one person types in the Agent chat. Everyone's Agent settings are personal, so another person's message could run in Free mode.
2. **Attach this file** with the **+** button. Prompt P0 tells Agent to save it as `docs/SPEC.md`.
3. **Paste prompts P0–P8 in order**, one at a time. Wait for each checkpoint (Queue mode). **Run the check under each prompt** before moving on.
4. **If a change made things worse:** Agent panel → History → **Rollback here**. Tick "Database" only if the schema broke.
5. **If Agent is stuck or looping:** Stop → Cmd/Ctrl+K "Restart compute" → new chat with a narrow prompt that starts with "Only …".
6. **Teammates who aren't driving:**
   - fix copy, colours and spacing in Replit's **Visual Editor** in Preview (simple edits are free);
   - test Arabic lines, voices and the cue card;
   - collect tester feedback;
   - film for social media.
7. **Test voice in a new tab** (Preview → New tab) or on the published URL, never inside the Preview pane.
8. **Publish early:** right after P3 passes, then again after P4, P6 and P7.

**`replit.md` rules block.** P0 adds this; keep it short.

```
## Sabboura rules (keep)
1) Source of truth: docs/SPEC.md (Part B) and data/*.json. Build only what they say. No login, accounts or payments.
2) Keep the default template (React + Vite web app, Express API, Postgres + Drizzle). Relative /api URLs.
3) Model ids come ONLY from env: CLAUDE_JUDGE_MODELS, CLAUDE_LINES_MODELS, CLAUDE_SCORER_MODELS, STT_MODEL, TTS_MODEL, IMAGE_MODEL. Never hardcode or "fix" them. claude-opus-5-5 is real even if your list doesn't show it.
4) Claude calls: no thinking parameter, no assistant prefill, no forced tool_choice. output_config {effort:'low', format: json schema} (no effort for claude-haiku-4-5). maxRetries 0; we retry ourselves.
5) Voices = OpenAI chat completions with gpt-audio-mini and audio output. NOT audio.speech, NOT the ElevenLabs connector, NOT browser speechSynthesis. If a voice fails, show the caption only. This is intended.
6) Transcription: send webm/mp4 unchanged. Do NOT convert with ffmpeg.
7) Never store voice recordings. No Permissions-Policy header that blocks the microphone.
8) Never show an error message in the classroom; use the fail-safes in SPEC B3.7.
9) Arabic: letter-spacing 0, Western digits, signed numbers and maths in <bdi dir="ltr">.
10) Status colours only on kid badges (SPEC B1.1). No confetti on the review page.
11) The /turn route streams SSE and is read with fetch + a stream reader; don't replace it with a generated hook or EventSource.
```

## C3. The prompts (paste in order)

Each prompt below says which effort to use. Paste the text in the code block exactly. After each one, run the **Check**. If it fails, use the **If wrong** line.

### P0. Files and rules (Effort High, Plan mode OFF, about 10 min)

```
Only do this, no app code yet:
1) Save the attached file as docs/SPEC.md. It is the source of truth for this app ("Sabboura"). Part B is the build spec; Parts A, C and D are for the team.
2) Create these files with EXACTLY the JSON in the spec, character for character: data/topics.json (B6.1), data/canned.json (B6.2), data/judge-tests.json (B6.3), data/feedback.json (B6.4), data/demo-script.json (B6.5). Validate that each one parses.
3) Add the "Sabboura rules (keep)" block from SPEC C2 to replit.md.
4) Read Part B fully and reply with a 10-line summary of what you will build and in what order (P1–P8 in Part C). Do not start building.
```

**Check:** the 5 JSON files exist and parse; replit.md has the rules; the summary mentions the judge, fixed rules, SSE `/turn`, chorus, starter lines, stage mode and the review page.
**If wrong:** "Only fix the data files: copy them from docs/SPEC.md B6 exactly, then validate."

### P1. Scaffold, design system, static screens (Effort High, Plan mode ON, about 45 min)

```
Build the app skeleton exactly as docs/SPEC.md describes:
- Stack and folders: SPEC B3.1 (keep your default template; use the module names).
- Design system: SPEC B1 (all CSS tokens, the three Google Fonts, the type scale, Arabic rules, motion tokens). Add the tokens to Tailwind. No dark mode, no Inter, no tracking-tight on Arabic.
- Home page: SPEC B2.1.
- Classroom page /lesson/:id with the grid, top bar, board, ledge, class row and dock: SPEC B2.3. Kid cards with StateBall and badge pills in every level and state: SPEC B2.4. Use initial-letter tiles until avatars exist.
- Translations file with all copy in SPEC B2 (Arabic RTL and English LTR).
- Database tables from SPEC B3.9 and POST /api/lessons, GET /api/lessons/:id, GET /api/health from SPEC B3.3. Start levels come from data/topics.json.
- A hidden /dev/states page that shows every kid card in every level and state (for visual checks).
Do not build voice, AI or scoring yet.
```

**Check:**
- Home → Start lesson opens the classroom with 5 cards: Yazan "مستني", the others "تايه/تايهة".
- Arabic is fully right-to-left, with Omar rightmost.
- It fits 1280×720 with no scrolling.
- `/dev/states` shows all badge states with the dashed/half/solid differences.

**If wrong:** "Only fix the layout: use the exact grid from SPEC B2.3 and the tokens from SPEC B1.1."

### P2. Voice in and typed turns (Effort High, about 45 min)

```
Implement voice input and typing exactly as docs/SPEC.md describes:
- The Start-lesson click does the 4 things in SPEC B2.2 (AudioContext unlock, getUserMedia once, preload, create lesson), with the permission card and the friendly error cards.
- The mic button: SPEC B2.5 (push-to-talk, Space key with event.code, 250 ms tail, 45 s cap, cancel, level meter, silence gate, tap mode, disabled while waiting).
- MediaRecorder: first supported of audio/webm;codecs=opus, audio/webm, audio/mp4;codecs=mp4a.40.2, audio/mp4; audioBitsPerSecond 32000; upload as turn.webm or turn.mp4 to match.
- POST /api/lessons/:id/transcribe exactly as SPEC B3.3 and B3.5 (multer memory 5 MB, gpt-4o-mini-transcribe from env STT_MODEL through Replit AI Integrations, the one-sentence prompt from topics.json, empty/echo/phantom detection, never store audio, no ffmpeg).
- Show the transcript on the board (fade in, 300 ms) and the "سمعناك ✓" chip within 100 ms of release.
- The typing box and Redo: SPEC B2.6 (redo can be a stub until P3).
For now, after the transcript, just log it; the class reaction comes in P3.
```

**Check:**
- Open the app in a **new tab**, hold Space and speak Arabic: the transcript appears on the board within about 2 s.
- Hold Space for 2 s without talking: nothing is sent.
- Tap the mic once: the "hold the button" hint shows.

**If wrong (mic):** "Only check for a Permissions-Policy header blocking the microphone and remove it; open the mic once on Start."

### P3. The judge, the rules and the streaming turn (Effort Extra High, about 90 min)

```
Implement the turn pipeline exactly as docs/SPEC.md describes:
- Clients, env vars and the model probe: SPEC B3.2 (CLAUDE_JUDGE_MODELS etc.; claude-opus-5-5 first; per-model output_config; no thinking parameter, no prefill, no forced tool_choice; maxRetries 0; JSON-in-text fallback if format is rejected).
- POST /api/lessons/:id/turn as an async generator runTurn() streamed as SSE: SPEC B3.4 (exact event names and payloads, headers, ping, res.on('close'), JSON fallback with Accept: application/json). The client reads it with fetch + a stream reader, not EventSource.
- The judge call: SPEC B3.5 and the prompt and zod schema in SPEC B5.1, verbatim. Evidence check with Arabic normalisation.
- The fixed rules: SPEC B4.1 (levels) and B4.2 (who speaks, chorus, Lina unheard, fail-safe). Pure functions in server/rules.
- In-memory state plus one DB transaction per turn, and real Redo: SPEC B3.9.
- On the client: on the state event, animate badges (+1/−1, 250 ms apart), raise hands for the chosen speakers, show the evidence highlight on the board and the badge popover: SPEC B1.4, B2.4, B2.7 moment 4. On a chorus, show the chorus bubble, tally, ؟ chips and the stamp from SPEC B2.7 moment 1 (play audio later in P4; for now show the text).
- GET /api/warmup and the debug panel ?debug=1: SPEC B3.10 and B2.11.
- npm run test:judge and the /dev/test page: SPEC B3.10, using data/judge-tests.json.
Then run: npm run test:judge -- --rows 1,2,3,4,7 and show me the output.
```

**Check:**
- `test:judge` rows 1, 2, 3, 4 and 7 pass.
- Type row 1's sentence: Omar's and Sara's hands go up.
- Type "فاهمين؟": the chorus text shows and no badge moves.
- The debug panel shows the model id and the timings.

**Then publish** (Reserved VM, dedicated 1 vCPU / 4 GiB) and on the **published URL**:
- run the `curl -N` test in B3.4 (events must arrive one by one);
- check `/api/warmup` returns the models.

**If wrong (judge):** "Only fix the judge call: model ids from env, output_config {effort:'low', format}, no thinking parameter, max_tokens 4000, then rerun test:judge."

### P4. The kids speak: lines, voices, chorus, fail-safes (Effort Extra High, about 75 min)

```
Make the class speak exactly as docs/SPEC.md describes:
- Kid lines: one call for all speakers with the prompt and schema in SPEC B5.2 (text + say), checks and canned fallbacks from data/canned.json (SPEC B3.5).
- Starter rule: the first objection of Omar, Sara or Khaled uses their starter line and pre-recorded clip (SPEC B4.2 rule 6).
- Voices: OpenAI chat completions with gpt-audio-mini (env TTS_MODEL), audio output mp3, the TTS system prompt in SPEC B5.4, the transcript check, the voice per kid, the cache: SPEC B3.5. Start all lines' voices in parallel on the server and send audio events in idx order (url for pre-recorded, b64 for fresh). Never use audio.speech or speechSynthesis.
- scripts/gen-audio.ts and npm run gen:audio: SPEC B3.6. Run it and list any clips that failed the check.
- Client audio engine: one AudioContext; play lines in idx order with a 300 ms gap; the speaking card state and the ledge caption (SPEC B2.3/B2.4); captions appear on the line event, before the audio; barge-in; drop audio more than 4 s late; audio_failed keeps the caption and animates the card.
- The chorus moment with all 5 clips (Lina late and quiet), exactly as SPEC B2.7 moment 1.
- Lina's spotlight moment, exactly as SPEC B2.7 moment 2 (her change waits for her line, 2.5 s cap).
- All fail-safes in SPEC B3.7, with the pre-recorded fail-safe clips. Never show an error.
```

**Check:**
- Row 1 typed: Omar's starter line plays almost instantly after the hands go up.
- Row 2 typed: the chorus starts within 1 s of the badges, and no TTS request is made (debug panel).
- Rows 3 + 4: Lina answers wrongly, then the mansaf turn plays Lina's "آه... فهمت!" with the spotlight.
- Play every chorus and fail-safe clip once and listen.

**If wrong (voices read the wrong words):** "Only fix TTS: system prompt from SPEC B5.4, compare message.audio.transcript with the line, retry once, else audio_failed."

**Then republish** and do 5 spoken turns on the published URL. Apply the latency rule in B3.8.

### P5. Avatars, sound effects, motion polish (Effort High, about 40 min)

```
Polish the classroom exactly as docs/SPEC.md describes:
- Run scripts/gen-avatars.ts as in SPEC B7 (style block, cast, anchor then edits, fallback to text-only). Save WebP files to client/public/avatars and use them on the cards, with face changes per level.
- client/src/lib/sfx.ts with every cue in SPEC B1.5, on the shared AudioContext, mixed under the voices; M mutes sound effects.
- All motions in SPEC B1.4 (badge up/down, hands, chalk dust only for Lina, reduced-motion and ?motion=full).
- The board and ledge drawn in SVG/CSS with the wooden frame (30-minute limit; skip the clock and window if short on time).
Only change visuals; do not touch the turn pipeline.
```

**Check:**
- The 5 kids look like one consistent set.
- The mic on/off, badge-up and chime sounds play.
- With reduced motion turned on, nothing moves except fades.

**If wrong (avatars):** "Only regenerate {kid}-{state} with the full style block from SPEC B7."

### P6. End lesson, the review page, the reveal (Effort High, about 60 min)

```
Build the end of the lesson exactly as docs/SPEC.md describes:
- End lesson (button or E, with confirm, enabled after 1 turn): SPEC B2.8. Then POST /api/lessons/:id/end.
- Compute the score in code, exactly as SPEC B4.4 (5 moves, bands, yes_no_count, lost_at_last_yes_no, question_count, voices_invited, best_turn, focus_move) and save it in lessons.score_json.
- One scorer call with the prompt and schema in SPEC B5.3 (clarity anchors); fallback data/feedback.json.
- The review page /lesson/:id/score exactly as SPEC B2.9, rows A–E and G (row F later), with all copy from SPEC B4.5 and B4.6, right-to-left in Arabic, numbers in <bdi>. Show code numbers immediately and fade in the AI parts.
- The notebook reveal (V key and button): SPEC B2.7 moment 3, with next_check from topics.json, Lina last.
- Teach it again (new lesson, same settings), Share (copies the URL), How scoring works (modal). Shared view hides Teach it again.
No confetti on this page.
```

**Check:**
- Run the 4 demo turns (Shift+1..4 come in P7, so type them for now).
- The review shows about **74–80, "درس قوي / Strong lesson"**, and the فاهمين؟ line "مرة وحدة … 4 من 4".
- The tip is about Yazan.
- The reveal flips with Lina last.
- The shared link works in a private window.

**If wrong (score):** "Only fix score.ts to match SPEC B4.4 exactly and show me the numbers for the 4 demo turns."

### P7. Stage mode (Effort High, about 40 min)

```
Add stage mode exactly as docs/SPEC.md describes in B2.10: ?demo=1 skips home (fractions, العربية, مس), the "Stage ready" button with its 6 actions and checklist, toggle talk with Space or PageDown, PageUp redo, the hotkeys table (N R E V C S H Q, Shift+1..4 from data/demo-script.json as typed turns through /turn), the presenter HUD, hiding hints and the cursor, stage font sizes, the mic picker in the debug panel, and warm-up every 4 minutes while idle. Ignore Escape and F5 for our own actions.
```

**Check:**
- Open `/?demo=1` on the published URL and press Stage ready: all ticks green.
- Press C: the chorus plays.
- Shift+1..4 runs the whole demo, then E → review → V.

**Then publish** and **freeze the AI models** (Saturday 19:00 at the latest).

### P8. SHOULD list (Saturday night, Effort High, one item per prompt)

Paste these one at a time, publishing after each, and only if P1–P7 all pass:
1. "Build the lesson replay table, row F of SPEC B2.9."
2. "Build Meet the class from SPEC B2.12 (skipped in stage mode)."
3. "Build the lesson-goals strip from SPEC B2.12 (hidden in stage mode)."
4. "Build Calm mode from SPEC B1.4 and B2.1."
5. "Build the /pitch panels and the /s/:id share preview from SPEC B2.12."
7. "Build the offline replay /replay/:id and GET /api/lessons/:id/replay from SPEC B2.12 and B3.3." (Do this first if the Saturday dress rehearsal went well: it is the demo backup.)
6. "Build the phone layout from SPEC B2.12."

**COULD** (only with time left): teach-it-again attempt deltas, the `/insights` school view (aggregates only, minimum 5 lessons, never individual teachers), and print view.

## C4. Saturday schedule (Amman time)

| When | What | Milestone |
|---|---|---|
| 10:30–11:00 | Replit session: C1 checks, Secrets (B3.2), create project, **P0** | Spec and data in the project |
| 11:00–11:45 | **P1** | Static classroom fits 720p, RTL correct |
| 11:45–12:30 | **P2** | Voice → transcript on the board (new tab) |
| 12:30–14:00 | **P3** + publish #1 | **Badges move from a spoken explanation; test:judge passes; SSE works deployed** |
| 14:00–15:00 | **P4** (first half) | Kid lines and voices |
| 15:00–16:30 | Lunch + mentors try it (typed path is fine) + cue-card test | Mentor quotes |
| 16:30–17:15 | **P4** (finish) + gen:audio + publish #2 + latency rule (B3.8) | **Full loop with voices deployed** |
| 17:15–18:00 | **P5** | Avatars and polish |
| 18:00–19:00 | **P6** | Review page and reveal |
| 19:00–19:45 | **P7** + publish #3 + **model freeze** | **Stage mode works on the published URL** |
| 20:00 → night (remote) | P8 items, 10+ teacher testers, dress rehearsal, backup video (Part D) | Real quotes and numbers for the pitch |

**Sunday:**
- **Code freeze at 11:00** (text-only changes after that).
- **12:00:** tech check on the published URL, `npm run test:judge -- --runs 3`, and the cue-card rows 11–15.
- **13:00:** qualifier.

**If behind schedule:** merge P5 into P7, skip P8, and keep P3, P4, P6 and P7 whole. They are the demo.

---

# PART D. Demo runbook

## D1. Roles (fix them on Saturday)

| Role | Who does it |
|---|---|
| **P, Presenter** | Narrates in English, holds the venue mic, routes Q&A. Speaks only while the kids are "thinking", never over kid audio or the laugh |
| **T, Teacher-actor** | Plays the "typical new teacher" in Act 1 with the magic mic (with 3 people, P can also be T) |
| **D, Driver** | At the laptop with the keyboard or clicker: talk toggle, hotkeys, Shift+1..4. **Never speaks** |
| **R, Runner** | Brings the cue card and mic to the judge, holds time cards ("1:00", "0:30", "STOP"), and films vertical video |

**Q&A owners:**
- the builder: tech, latency, cost, Replit;
- the content person: pedagogy;
- P: business.

## D2. Run-of-show: qualifier (at our table, Sunday 13:00, 3:00 + 3:00)

**Before:**
- **11:00:** code freeze.
- **12:00:** tech check on the published URL:
  - Stage ready, all ticks;
  - test-sheet rows 1–4 in Arabic;
  - one turn over the phone hotspot.
- **12:10–12:45:** three runs (clean and timed, then chaos, then clean), plus a 10-minute Q&A drill.
- **T-15:** find the table, check the power socket, place the small **wired** speaker, open `/?demo=1`, plug the laptop in.
- **T-5:** press Stage ready, run one warm-up turn ("مرحبا يا شباب"), press N for a fresh lesson, test the volume with C.
- **T-1:** HUD off (H). R holds the cue card with the mic clipped on. The backup video is ready on D's phone.

| Time | Who | What |
|---|---|---|
| 0:00–0:12 | P, D | **Hook.** P: "Every teacher in Jordan has asked this: فاهمين؟" D presses **C**: the class shouts "آه مس!" P: "Yes, Miss. Every time. Even when half the class is lost." |
| 0:12–0:30 | P | "Pilots train in simulators. Teachers practise on real kids. Sabboura is a flight simulator for teachers: five AI kids, each secretly holding one real misconception from research." |
| 0:30–0:52 | T, D | **Act 1, turn 1.** D toggles REC. T: "اليوم رح نقارن الكسور. القاعدة: كل ما كبر المقام، صغر الكسر. يعني 1/3 أصغر من 1/2." D stops. P (during the wait): "Watch Omar. His hand is always up." Omar: "مس، بس 3 أكبر من 2! ليش 1/3 أصغر؟" Sara: "ليش؟ مش منطقي!" |
| 0:52–1:12 | T | **Act 1, turn 2.** T: "احفظوا القاعدة وخلص. فاهمين؟" The chorus plays. **Wait 2 s for the laugh.** P: "Everyone said yes. Not one badge moved. And Lina's ring is pulsing: she's lost, and she'll never tell you." |
| 1:12–1:50 | Judge, R, D | **Act 2.** P: "Who would like to save Lina?" (If Dr. Farah is at the table: "Dr. Farah, you've trained teachers. Would you save Lina?") R hands over the card with the mic. D toggles REC as the judge starts. Judge turn 1: "لينا، أيهما أكبر: نص ولا ثلث؟" Lina answers shyly and wrongly. P: "That's how you find out what a kid really thinks: you ask her." Judge turn 2: the mansaf, and Lina turns green, "آه... فهمت!" P: "That's the moment every teacher lives for. Thank you." **If no judge volunteers within 3 s, T does Act 2** |
| 1:50–2:15 | D, P | D presses **E** then Enter. P: "Every number is computed by code, and every badge quotes the words that moved it. Look: the whole class said yes while all four were lost." D presses **V** for the reveal |
| 2:15–2:45 | P | **Business.** D presses **Q** (pitch panel 3). P: "Private school groups buy: one contract, hundreds of teachers, about 8 dinars per teacher a month. A session costs us [measured] cents. Mursion raised $40M doing this with human actors; we do it with AI, in Arabic." |
| 2:45–3:00 | P | **Traction + ask.** "Last night [N] teachers tried it. [one 8-word quote]. Our ask: introductions to three school groups for a pilot this term. Sabboura: practise on AI kids, so real kids get your best lesson." |

**Q&A (3:00–6:00):**
- Keep the review page on screen.
- On "is this a wrapper?", D taps Lina's badge to show the quote.
- Exit: thank the judges by name, R collects the card and mic, D presses N.

## D3. Run-of-show: final (stage + MC, Sunday 17:30)

**Before:**
- **16:00–16:15:** find the stage manager or AV person. Ask for:
  - our own laptop on stage, and HDMI (bring 2 USB-C-to-HDMI adapters);
  - laptop audio into the PA;
  - **two handheld mics** (one for P, one becomes the magic mic);
  - a mic at the judges' table;
  - wired Ethernet if possible;
  - how time is signalled.

  Do a 5-minute line check: the chorus at real volume, one live turn, and a check for echo.
- **16:15–16:50:** two timed runs in a quiet corner.
- **No deploys after 16:30.**
- **17:00:** laptop at 100% and plugged in, Stage ready ticked, notifications off. Give the MC a card: "Sabboura (سبّورة, sab-BOO-ra): a flight simulator for teachers. Team: [names]."

**Pitch differences from the qualifier:**
- **0:00:** P stands centre-left, out of the projector beam: "Raise your hand if a teacher ever asked you فاهمين؟ and you said yes without understanding." (Hands go up, laughter.) "Let's hear a class." D presses **C**.
- **Act 2:** don't bring the judge on stage (it costs 20–30 s). R walks the card and the clipped transmitter to the judge's seat; the big captions show their words to the room.
- **The last panel** shows a big QR code, "جرّب الآن / Try it now", and stays up during Q&A.
- **If a judge has no mic,** P repeats the question in 8 words or fewer.

**Time checkpoints and cut list:**
- Act 1 ends by 1:15.
- If the judge hasn't started by 1:25, P says "Let me show you" and T does Act 2.
- If the review isn't up by 2:20, skip the reveal (one line: "At the end, each kid's secret is revealed").
- At 2:45, jump to the ask.
- Never apologise, and never say what doesn't work.

## D4. The judge cue card (A5, 28pt+ bold, print 3, thick card)

**Front (Arabic):**
> **أنقذ/ي لينا!**
> ١) اسأل/ي لينا: «لينا، أيهما أكبر: نص ولا ثلث؟»
> ٢) اسمع/ي جوابها.
> ٣) اشرح/ي بطريقتك، أو اقرأ/ي: «تخيلي منسف واحد. إذا قسمناه على 2، كل واحد بوخذ نصه. إذا قسمناه على 3، كل واحد بوخذ ثلث، يعني حصة أصغر. عشان هيك النص أكبر.»
> احكِ لما الدائرة الحمرا تشتغل. خلّي الكرت تحت ذقنك بشبر.

**Back (English):**
> **Save Lina!**
> 1) Ask: "Lina, which is bigger: a half or a third?"
> 2) Listen to her answer.
> 3) Explain it your way, or read: "Imagine one mansaf. Share it between 2 people and each gets a half. Share it between 3 and each gets a third, a smaller share. So a half is bigger."
> Speak when the red ring is on. Hold this card a hand's width below your chin.

**R's 5-second briefing while handing it over:** "Two short lines. Read them or say it your way. I'll tell you when." Always give the judge an out ("or I can do it"), make them the hero, thank them by name, and lead the applause.

**Make success almost certain:**
- Before Sunday, run the cue-card sentences through the **published** app 10+ times: male and female voices, fast and slow, Jordanian dialect, Modern Standard Arabic, English. Test-sheet rows 11–15 cover the wordings.
- On Saturday afternoon, ask one mentor to read the card cold. If they hesitate, rewrite the card.

## D5. Screen and audio setup

**Screen:**
- **Mirror** the displays; don't extend them (macOS: Displays → Mirror; Windows: Win+P → Duplicate).
- Use the projector's native resolution, and browser zoom 100%. The layout must also work at 1280×720.
- Fullscreen comes from Stage ready (fallback: F11 / Ctrl+Cmd+F). Enter it **before** walking on, because Chrome shows a short "Press Esc" toast.
- **Before going live:**
  - notifications off, and Do Not Disturb on;
  - quit WhatsApp, Telegram and Slack;
  - close every other tab;
  - pause OS updates;
  - display sleep set to "never";
  - power in, brightness 100%.
- Use the **same Chrome profile** where the mic was allowed ("Allow on every visit") on the **published** URL. No incognito.

**Audio:**
- Route laptop audio to the PA (HDMI, or a cable to the mixer).
- At the qualifier table, bring a small **wired** speaker. Laptop speakers are too quiet, and Bluetooth drops.
- The chorus must be the loudest, clearest sound of the demo.

**The magic mic:**
- Clip a wireless lav transmitter (e.g. DJI Mic 2) to the handle of the venue's second handheld mic, so whoever holds it is heard by both the room and the app. At the qualifier, clip it to the top of the cue card.
- Select the receiver in the app's mic picker and in the OS.
- Charge everything fully, and bring a spare USB-C cable.
- **Test on Saturday night:** speak 20 cm from the capsule and check the transcript.
- Never put a headset on a judge, and never rely on the laptop's built-in mic in a noisy hall.

## D6. Backup ladder (rehearse each step once)

1. **Live,** with the wireless mic.
2. **Mic fails:** D presses Shift+1..4, which sends the scripted line as text through the same live pipeline (real AI; only transcription is skipped). P says: "I'll type it for speed."
3. **AI is slow or failing:** the fail-safe line ("مرة كمان؟") plays; the teacher repeats once; P keeps narrating.
4. **Network down:** switch to the pre-paired phone hotspot, already tested **in the venue** on Saturday. P narrates the 20 s it takes.
5. **Everything fails:** open the Replay of last night's real lesson (`/replay/:id`, SHOULD) and say honestly: "Here's the same lesson from last night's test."
6. **Laptop dies:** use the second laptop with `/?demo=1` open in the same profile, or the backup video on D's phone and a USB stick.

**Never present a replay or the scripted path as a live voice turn.** A Fikr technical due-diligence lead is in the room, and one caught exaggeration costs more than a failed turn.

## D7. Pre-flight checklist (print it and tape it to the laptop lid)

| When | Check |
|---|---|
| **T-30** | Published URL loads; HUD green; last turn under 6 s; test-sheet rows 1–4 pass; hotspot tested in this room |
| **T-10** | Power in; notifications off; other apps quit; other tabs closed; mirroring on; volume set with the AV tech; wireless mic charged and selected; cue card and clip ready; time cards ready; backup video on the phone; second laptop open |
| **T-2** | Stage ready, all ticks; one warm-up turn; press N; HUD off; F5/Esc keys on the clicker taped over; phone on silent |

## D8. Rehearsal plan

- **Saturday 15:00–16:30:** show mentors the half-built app. One mentor reads the cue card cold. Write down every question they ask (that becomes the Q&A bank).
- **Saturday 20:00–22:00 (remote):**
  - a full dress rehearsal on the published URL with the wireless mic and speaker;
  - time every turn;
  - save the best run's lesson id for Replay;
  - record the backup video **with system audio** (OBS on Mac, Win+Alt+R on Windows; Cmd+Shift+5 has no kid voices) and also film it with a phone.
- **Sunday morning:**
  - run 1: clean and timed;
  - run 2: chaos (R pulls the mic receiver, turns Wi-Fi off, and plays a judge who goes off-script in English);
  - run 3: clean;
  - then a 10-minute "murder board": the 20 hardest questions, under 20 s each, with an owner for each.
- **Sunday 16:00–16:50:** two stage-style runs.
- **Every run:** film it on a phone and watch it at 1.5× speed to spot dead air. Cut P's script to about 220 words in total.

## D9. Pitch panels (in the app at `/pitch`; at most 7 words each)

1. **"A flight simulator for teachers"** / «معلّم بيتدرّب على صف ذكي»
2. *(Live demo, no panel.)*
3. **"Five moves · fixed rules · every point quotes you"**: reach every learner · check for understanding (Rosenshine) · include the quiet learner · stretch the fast learner · reasons and examples.
4. **"8 JOD per teacher per month"**: school groups first; cents per session; Mursion raised $40M with human actors.
5. **"Intros to 3 school groups?"** plus "Last night: N teachers, M lessons" and a big QR code "Try it now".

## D10. Best Social Media award plan

**Rules for every post:**
- Tag @theaihackathon; use #TheAIHackathon #BuiltinJordan, plus #EdTech and @replit.
- Reels: 9:16, 12–30 s, a big text hook on frame 1, and burned-in Arabic + English captions.
- Post each reel **once** as an Instagram Collab with all teammates, then cross-post to TikTok and LinkedIn.
- Get consent before posting any tester's face or voice. **Never post real children.**

| When | Post |
|---|---|
| Sat 09:00 | Story: arrival, badges |
| Sat 10:45 | Story: Replit session, "Prompt 1 is in" |
| Sat 11:30 | LinkedIn photo post: team + plan |
| Sat 13:30 | Reel 1: "The first badge just moved" (screen capture, 15 s) |
| Sat 15:00 | Carousel: "Meet the class: 5 AI kids, 5 secret mistakes. Guess who's secretly lost? Answer tomorrow." |
| Sat 18:30 | Reel 2: "Omar is confident. Omar is wrong." (his voice: "مس، بس 3 أكبر من 2!") |
| Sat 20:15 | Post + Story: "It's live. Teachers: teach our AI class for 5 minutes and send us your score" (link in bio + QR) |
| Sat 21:00–23:00 | Stories: teacher testers and their review screens (with consent) |
| Sun 09:00 | Carousel + LinkedIn: "The فاهمين؟ trap" (the Rosenshine quote + "last night N teachers asked فاهمين؟ M times on average") |
| Sun 12:55 | Story: "Pitching at 13:00" |
| Sun 17:30 | R films the final |
| Sun by 18:45 | Reel 3: "We asked a judge to save Lina" (only if the judge agrees; otherwise screen only). The last big post before the awards |

---


## v2: Plan · Teach · Reflect

The app is three phases with a stepper (1 Plan, 2 Teach, 3 Reflect).

1. **Plan** (`/plan/:packId`). The teacher edits a short lesson plan: a goal and up to 6 steps (explain, example, check, include, challenge, other). A pack is either a ready lesson (`lib-<topic>`) or an upload (`up-<hash>`). The page shows "where kids may get stuck" as nameless quotes plus each kid's personality, never who holds which mistake. Code-only tips flag a yes/no check, or a missing check, example, include or challenge step.
2. **Teach** (`/lesson/:id`). The live lesson engine is unchanged. The lesson stores `pack_id` and `plan_json`. A "My plan" pill shows the plan during the lesson.
3. **Reflect** (`/lesson/:id/score`). The existing review, plus "Your plan vs your lesson": each plan step is marked done, partly, not yet or unknown, with the turn as evidence and a next-time line.

**Checklist rules.** It never changes the score. It runs in parallel with the scorer at End. Code decides what it can (a check step is done only if a real question was asked, include only if a kid was named). One AI call judges the explain step only. Anything unclear is "unknown", never a guess. Edit plan and teach again reopens the Plan page with the same plan.

**Upload.** Home takes a PDF, JPG, PNG, WebP (10 MB) or pasted text (12,000 characters). Photos are shrunk on the device to a 2000 px long edge. The server checks the type from the first bytes, trims PDFs to the chosen pages (max 6) with pdf-lib and makes one Claude call (`CLAUDE_PACK_MODELS`, falling back to the scorer list) that returns the plan, 3 trouble spots and per-kid misconceptions. If the material is exactly a ready lesson's topic the ready lesson's researched topic is used. Otherwise a topic is built in topics.json shape and registered at boot and on lesson load. Uploaded topics have no canned lines (kids fall back to their failsafe line). The pack id is a hash of the content, language and pages, so the same upload again is instant. The file itself is never stored.

## Sources

- Rosenshine, "Principles of Instruction," *American Educator*, 2012: <https://www.aft.org/sites/default/files/periodicals/Rosenshine.pdf>
- Replit Agent modes and model selector: <https://docs.replit.com/features/agent/agent-modes> · <https://docs.replit.com/features/agent/model-selector>
- Replit AI Integrations: <https://docs.replit.com/features/integrations/replit-ai-integrations>
- Replit Plan mode, App Testing, publishing and deployments: <https://docs.replit.com/features/agent/plan-mode> · <https://docs.replit.com/features/agent/app-testing> · <https://docs.replit.com/build/troubleshooting>
- Chrome autoplay policy: <https://developer.chrome.com/blog/autoplay>
- OpenAI speech-to-text (formats, prompt): <https://developers.openai.com/api/docs/guides/speech-to-text>
- Claude models overview: <https://platform.claude.com/docs/en/models/overview>
- Mursion funding and university use: <https://www.tryfundable.ai/company/mursion>
- GPTeach (AI students for novice teachers): <https://scale.stanford.edu/ai/repository/gpteach-interactive-ta-training-gpt-based-students>
- Problems with AI-simulated students (BEA 2025): <https://aclanthology.org/2025.bea-1.8>
- Queen Rania Teacher Academy pre-service diploma: <https://queenrania.jo/en/node/205825>
- Whole-number bias: Ni & Zhou, "Teaching and learning fraction and rational numbers," *Educational Psychologist*, 2005
- Judges: [Faisal Kawar](https://signal.nfx.com/investors/faisal-k), [Rana Al Dababneh](https://orange.jo/en/corporate/investors-relations), [Dr. Farah Sarraj](https://www.ithra.com/en/special-programs/learning-beyond/learning-beyond-2024/speakers/dr-farah-sarraj)
