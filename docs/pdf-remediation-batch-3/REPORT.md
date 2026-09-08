# Batch 3 — Core play hardening

Baseline application HEAD: `11e86737cce0dac67c269537e07fedb84d189e97`. Original audit classifications remain historical. This report and its implementation are committed together; the exact resulting commit and verified production deployment are reported in the delivery message after Git/Vercel checks.

## What changed in actual play

The ordinary Core loop now reaches the right **Core** mechanic from DR, movement, starvation, infection, critical, flee and negative-HP searches. Previously these searches were absent, led to incidental table text, or preferred RECLVSE/SD variants. Core still has no invented metre allowance, fixed flee DR, chase engine, or action tracker.

The pass selected **10 unique play needs / 19 inherited audit IDs**, plus seven bounded dependencies (upper bound **17**, below the cap of 25). No generator behavior, source table contents, campaign schema, narrative system or campaign-management domain changed. New source data tables: **0**. The four starting-item definitions are projections of existing verified rows.

- [BATCH3-TRIAGE.md](BATCH3-TRIAGE.md): pre-implementation TOP 30, YES/NO decisions and the browser-discovered Scroll-link addendum.
- [triage-all.json](triage-all.json): all 401 IDs, frequency/interruption/relevance/access/priority and per-ID rationale.
- [SOURCE-VERIFICATION.md](SOURCE-VERIFICATION.md): targeted supplied pages; no new full-book audit.
- [RECHECK.md](RECHECK.md): every selected inherited Before → After, canonical IDs and browser evidence.
- [STOP-POINT.md](STOP-POINT.md): exact remaining Core and supplement IDs/categories.

## Rules and source boundaries

| Play need | Source verified | User-facing correction |
|---|---|---|
| Difficulty | Bare Bones PDF/printed 28; Full PDF30/printed26 | Existing Tests now contains all seven source descriptions, DR6/8/10/12/14/16/18. |
| Round and movement | BB31; Full PDF34 (visually unnumbered) | Attack **or** Power, plus crossing a normal-sized room; usually ten rounds/minute. No invented numeric movement speed. |
| Food, thirst, infection, recovery | BB31; Full PDF35/printed31 | Reuse Rest, now clearly found by situation. Breath/drink d4 HP; night d6 HP; no food/drink means no rest healing; starvation after two days loses d4/day; infection prevents rest healing and loses d6/day. No invented separate dehydration clock. |
| Carrying | BB28; Full PDF31/printed27 | Same Strength+8, excess DR+2, double-cap limit; now one click from Character equipment. Oversized objects have no invented slot conversion. |
| Combat, critical/fumble | BB30–31; Full PDF33/printed29 | English and separate Korean reminders; ordinary critical queries select Core. Initiative, PC attack/defence rolls, damage/protection and persistent damaged-armor penalties retained. |
| Armor and scroll restriction | BB23/54; Full PDF28/59, printed24/55 | The general restriction remains intact; Heretical Priest's medium-armor exception is stated and the canonical class is related. |
| Daily Powers | BB34; Full PDF38/printed34 | Restores Presence+d4 uses each morning in casting; success spends a use, failed casting loses d2 HP and causes one-hour dizziness. The historical `core-powers-daily` RESOLVED route pointed at Omens, where the line had disappeared. This dependency is not counted as an extra 401-ID closure. |
| Broken/death | BB29; Full PDF32–33/printed28–29 | Exactly zero calls for Broken; negative HP means death. Existing d4/d6 tables reused. Source hemorrhage ambiguity is preserved, not harmonized. |
| Getting Better | BB33; Full PDF37/printed33 | Already usable, now bilingual with existing debris table linked. No XP or advancement automation. |
| Core fleeing | BB27/28/31/32 | Agility and ordinary situation-dependent tests; no fixed Core flee DR or invented opportunity sequence. SD remains a separate related variant. Combining these source reminders is marked APP_POLICY. |
| Services/repair/ammunition | BB25/26, repair consequence31; Full PDF29/33 | Eight service/repair prices and two ammo quantities in one read-only lookup. Original-tier repair ceiling and ruined armor remain explicit. No route planner, shopping/inventory system or animal-stat fabrication. |
| Starting equipment | BB22 | `bomb`, `life elixir`, `small but vicious dog`, `monkeys` now have exact-name lookup, their complete existing effects, separate Korean and canonical entry-level source. HERETIC Blackpowder Bomb remains a different identity. |

**Important stale-audit discrepancy:** `core-purchase-20-arrows` and `core-purchase-10-bolts` were inherited as MISSING, but their prices already appeared in Batch 1 Bow/Crossbow definitions. The new shared price lookup makes them easier to reach. Their closure is a fresh verification, not a claim that Batch 3 authored previously absent ammunition mechanics.

Thirteen targeted Core reminders now keep English and Korean in separate fields. Matching paragraph pairs appear together; mismatched translation structure is left intact rather than guessing sentence correspondence. Source stays closed by default. No generated input, canonical table matching, region weighting or stored English was changed by translations.

## Search, context and follow-through

Curated navigation aliases cover the selected needs only: DR/difficulty/난이도, round/movement/라운드/몇 미터, starvation/thirst/infection/식량 없음/갈증/감염, negative HP/음수 HP, critical, Core flee/도망, service/repair prices, and existing Character rules. No ranking engine rewrite was needed. Explicit `SD flee`, `RECLVSE Morale` and `RCL Infection` still resolve their separate variants.

A bare Korean `이동` intentionally retains road travel times; `movement`, `전투 이동` and `몇 미터` identify combat movement. This preserves the meaningful travel/combat distinction instead of forcing every movement query into combat.

Character equipment heading → Carrying, and daily Power-use value → Casting, each require **one click**. Edit mode and HP editing remain available. The six Character contextual references now contain Carrying and Casting in place of peripheral Reaction/Corpse entries; the shelf did not grow. Combat → round/critical/armor/flee; Morale → Core flee; Rest → carrying/prices; armor → Priest/repair/casting use canonical links.

A generated Room-context generic Scroll exposed a further small dependency: its price definition did not tell the player how to continue. It now offers Core casting and the existing Sacred/Unclean tables. **The user chooses the applicable table; no specific Power is invented or silently assigned.** This addendum closes no extra inherited audit ID.

Table access uses the current Inspector. No new editor or manual-selection subsystem was added. Broken's existing result table, source, roll, copy and Back were exercised. The starting equipment rows keep their existing source-table links. Generic creature names inside arbitrary Room/Encounter prose still are not automatic definition links; exact creature search and explicit creature actions remain available. This is documented rather than hidden behind a universal graph claim.

## Browser and responsive evidence

- **50 before/after queries** in actual Chrome UI: twelve had no result before; none has an empty result after. A found result is not counted as resolution by itself: selected mechanics were read and checked, not merely their source pages. Common search lookup is one text entry plus **one click**. [Before](browser-before.json), [after](browser-after.json).
- The saved-QA-Character Core scenario includes difficulty, round/movement, armor, carrying, Omens, Power, hypothetical HP0, negative HP, rest, hunger/thirst, morale, flee, growth, repair, Source, Broken roll/copy/Back, Reference Desk return and reload. **70 interactions** under the deliberately inclusive convention (all clicks, typing operations, Command-K and reload). Direct Character actions remain one click; source one click. No actual HP edit occurred. [core-scenario.json](core-scenario.json).
- Starting-item and Character link checks: one click to usable definition, one to source, one to return. All four starting items retain BB22 provenance. [batch3-links-browser.json](batch3-links-browser.json).
- Fresh generated Character and Room-context follow-through are recorded separately in [generated-browser.json](generated-browser.json). A transient Room-context result is not misrepresented as a Special Room component. Campaign and Character values are compared after lookups and reload. The fresh-generation exercise recorded 50 clicks, two choices and one text entry including setup; eight Character definition paths were one click each. Room 02 → Useful Item → the rolled Sacred category → Scroll → Sacred table → Roskoe’s Consuming Glare completed the tested branch and returned to Room 02. This does not claim all Useful Item outcomes or Special Room components were re-audited.
- **36 screenshots** were inspected across **360 / 768 / 1440 / 3440**. Core difficulty/services, carrying/casting, Character/Room packets and generated result views were checked. No horizontal document/inspector overflow; the wide inspector stays bounded at about 780px and Korean helpers remain readable at 14px. Sources and edit controls stay closed initially. The longer price list scrolls within its intentionally opened inspector; it does not occupy the default Desk.
- Keyboard search, copy, source disclosure, Back and reduced-motion rendering were exercised. Source panels are click/tap disclosures. No hover-only dependency was introduced.

## Validation and data safety

**638 tests pass**, including **22 new tests** (13 Core/reference, 8 starting-item/link, 1 bilingual paragraph pairing). Existing tests remain: the equipment-count test still asserts all 46 original catalog records and the four new projections have separate tests; the Broken test now checks both English and its separate Korean; the bilingual test checks each paragraph appears exactly once after pairing.

Lint passes. TypeScript client/server build and production Vite build pass. Public build privacy check passes with **73 static files**. Source checks: **572 canonical tables, 998 references, zero unresolved source definitions/attestations; UNSOURCED: 0**. These figures describe the loaded production registry, not a fresh page audit of every book. [integrity-summary.json](integrity-summary.json).

No schema migration, private source mutation or regeneration of saved content occurred. All testing used isolated browser contexts and disposable QA material. Existing QA Campaign arrays were byte-equivalent after the read-only Core scenario; freshly generated QA objects were unchanged by follow-through and reload. IDs, assignments, manual edits, source provenance and imports/exports retain existing behavior, covered by the preserved regression suite.

## Selected classifications and remaining inherited set

| Classification | Inherited before | After selected verification |
|---|---:|---:|
| PARTIAL | 35 | 32 |
| PRESENT_BUT_INDIRECT | 171 | 165 |
| MISSING | 192 | 182 |
| SOURCE_UNAVAILABLE | 3 | 3 |
| Total non-resolved | 401 | **382** |

These are **inherited classifications minus the 19 verified selected resolutions**. Untouched IDs were triaged, not freshly source/browser audited. Four likely already-addressed card-selector overlaps remain inherited on purpose. Do not interpret 382 as 382 major missing features.

The three source limitations remain explicit and unchanged:

- `heretic:table-curseCure` — HERETIC PDF37/printed35: result12 physically clipped.
- `heretic:staff-awful-light` — HERETIC PDF66: no supplied effect/stat text.
- `mythic-crafter-source` — Mythic PDF172/173/175: external Crafter source not supplied.

## Stop point and product direction

**Stop broad remediation.** There is a small explicit ordinary-Core backlog, but the majority of the inherited remainder concerns specific supplements, optional rules, keyed adventures, rare cases or unavailable sources. Select future work from actual recurring play interruptions rather than audit closure counts.

The product has **not drifted into campaign journaling**. Reference Desk remains the initial/primary route, search and rolling need no Campaign or Session, and the saved Character adds only two direct mechanical links. Sessions and other record systems were not expanded. Campaign/Dungeon/Room context supports reference access; it does not replace the notebook.

## Direct answer: tomorrow, what still realistically needs the PDF?

**Ordinary Core exceptions:** hiring Outcasts and checking loyalty (`core-outcast-loyalty`, BB63); running Wild Wickhead (`core-outcast-wild-wickhead`, BB65); buying trained/wild dogs, horses, mules or tame rats (five `core-purchase-*` IDs, BB26). Named treasure effects (`core-treasure-1`…`10`, BB3) and monster sale values (twelve `core-valuation-*`, BB58–62) exist in the app but remain indirect through TABLE or preset Notes. These last two are retrieval detours, not universally missing mechanics. Manual classless creation options (BB27) and repeated optional Arcane Catastrophe effects (BB43) remain explicit less-frequent exceptions. Ordinary initiative, attack/defence, armor, Broken/death thresholds, rest, hunger/infection, carrying, Omens and casting now have usable Core reference paths.

**Supplement-specific/rare cases do not justify more broad development:** additional RECLVSE archetypes/Powers/optional Moves; named FERETORY relics and scenario participants; HERETIC feats/items/keyed encounters; optional Depths modes and adventure follow-through; Alöne merchant/participant specifics; advanced Mythic variants/Crafter integration; Rotblack Sludge keyed actors; the three unavailable sources. Full scenario prose, maps, art and nuanced long-form reading remain intentional PDF use. The exact categories and IDs are retained in [STOP-POINT.md](STOP-POINT.md) and [remaining-audit-ids.json](remaining-audit-ids.json).
