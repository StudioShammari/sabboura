---
name: Kid text gender
description: Any text about one kid goes through kidText so Arabic grammar follows the gender of the kid shown in the class
---
Text written about a specific kid (reveal, next_check, lina/yazan feedback tips, pack kid lines) is stored with `ar` = default kid's gender, plus `ar_m` / `ar_f`; English is gender-neutral (they/them). Render it with `kidText(kid, text, setting, lang)` in shared/setting.ts, never with `swapFromDefault` alone.

**Why:** boys'/girls' classes swap names (Lina becomes Yousef) but the grammar stayed feminine/masculine.
**How to apply:** new kid-specific copy needs both Arabic forms; `ar` must stay byte-identical so the default class is unchanged. Pack builder asks the model for the four extra fields (blank/missing falls back to `ar`). `pnpm test:kidtext` is offline.

Related: whole-class address in AI text is class-dependent too. In a girls' class `classAddress(setting)` is added to the plan-check and scorer prompts and `fixClassAddress` rewrites «يا شباب» to «يا بنات» in AI output; default and boys' prompts must stay byte-identical. The flipped review card stamp follows the shown kid's gender (stampWord). `?reveal=1` on the review URL is dev-only and flips every card with no animation (for screenshots).
