# MÖRK BORG Full Edition — Second Printing: PDF escape audit

Baseline: `a50d2425deb9a4e9c7e7abb0983dd4c34c68c116`. Audit only. No production data, UI, generator, schema, campaign, deployment or source content changed.

All **96 physical PDF pages** were read from fresh extraction. Ambiguous/low-text Full Edition pages, the complete Power layout, class layouts, equipment catalog and dungeon-table layout were checked in rendered PNGs. Source evidence comes from the supplied files, not an earlier coverage report. Bare Bones and Full Edition rows share `needId` for the same play need; do not add their counts to obtain unique coverage.

This source has **275 audited play needs**: RESOLVED: 64, PRESENT_BUT_INDIRECT: 74, PARTIAL: 76, MISSING: 51, PDF_APPROPRIATE: 10, SOURCE_UNAVAILABLE: 0. The machine-readable rows are in [`data/core-rows.json`](data/core-rows.json). The separate supplied `MB_Cheatsheet.pdf` is Mythic Bastionland and contributes no MÖRK BORG needs.

## What still makes the player open the PDF

- **20 named Powers: PARTIAL/P1.** Each original effect was checked individually, including dice, range, target count, duration and exceptions. All twenty effects exist in canonical `metadata.effect`, but Reference Desk ROLL and TABLE show only the name. A generated Character scroll has the effect; the old Oracle result metadata disclosure can expose it after rolling. Neither replaces deliberate named Power lookup. Most exact names return no reference result; Foul Psychompomp's separate summon subtable does not supply the whole spell-reference flow. Smallest fix: display the existing effect and index the existing named entry, without new generator logic.
- **All 17 purchase-list weapons examined.** The ten starting weapon records contain damage in metadata; Desk TABLE and ROLL hide it. Seven weapons outside the starting d10 table lack a Core static reference altogether. Prices are absent. Damage on a generated Character is useful but does not solve lookup at play time.
- **The shop catalog is not a usable reference.** Individually audited 45 general equipment rows, two ammunition rows, five beasts, eight services/repair rows and armor/shield. Starting gear sometimes supplies an effect, never a substitute for full shop stock/price. A poison bottle's random starting doses and its fixed shop doses are different source needs. Core-specific inn/food/bribe prices must not be replaced by a supplement's tavern prices.
- **All six classes are generated, but a class is not readable as a complete standalone reference.** Its base rules are available on an instantiated Character under Class features. Search finds the class's background/feature tables, without base modifiers, constraints and daily/advancement instructions. Each of the 30 named class effects and eight decoctions was examined separately: all full effect text is present in the parent table, but names are not indexed. The simple fix is a read-only class/entry surface using existing source data.
- **Omens spending is missing from the named Omens quick rule.** Refill and daily Power count are there; the five permitted expenditures are not. This is more consequential than a cosmetic/source badge issue.
- **Other short-rule gaps:** full DR ladder; action/movement round duration; classless optional two 4d6-drop-lowest abilities; general outcast loyalty/Presence rule; the complete repeated-catastrophe damage/water rule. Infection/starvation mechanics exist in Rest but common English queries do not find them.
- **Core creature combat blocks are substantially usable.** All twelve normal creature blocks were compared individually, including attack alternatives and every special trigger/probability. Their sale/body-part valuations are stored as notes but omitted by the Reference Desk reading; looking those up currently requires the saved Monster surface. Earthbound/Pale one/Prowler can be opened as complete outcast references; Wild Wickhead exists only in `library.outcasts`, with no current reference route.

## Code and live-search evidence

- `src/data/oracles/index.ts:138`: live adapter preserves `entry.text` separately from `metadata`; no effect/damage composition for Core Powers/weapons.
- `src/domain/referenceReading.ts:82`: visible/copy oracle text includes effectRule/conditional/condition/procedureNote, but not Core `effect` or weapon `damage`.
- `src/components/ReferenceWorkbench.tsx:593`: static table shows `entry.text` and nested follow-up text; mechanical metadata is not rendered.
- `src/domain/references.ts:437` and `:937`: reference search indexes table/title/summary/tags/source identity, not individual row names/effects.
- `src/generators/characterClasses.ts:226`: generated Character scroll does retain its effect. `:360` adds class playerRules to an instantiated sheet; `src/components/Characters.tsx:602` reveals these under Class features.
- `src/domain/referenceExecution.ts:64`: compact creature reading includes stats/attacks/special rules, but not notes. `src/generators/monster.ts:526` stores valuation in notes.
- Fresh actual index and query evidence: `outputs/pdf-escape-audit/reference-index.json`, `registry.json`, `classes.json`, `search-results.json` (private audit outputs). Root's fresh browser check corroborates missing exact Daemon/Heavy Armor/Lantern results, Flail/Knife name-only rolls, Omens refill-only text and class search routing to Earliest Memories.

## Context routing boundary

`ObjectPlayTools` declares recommendations but is not mounted in the current application; its only imported exports are state controls. The saved Character/Monster/NPC pages therefore do not gain Quick Tools from that definition. `contextLinked` counts only verified mounted Journey/City/Dungeon actions or an explicitly identified Reference Desk RELATED route. It does not treat generated fields, provenance metadata or declared context tags as a playable contextual link. In particular, the six base classes remain PARTIAL: their complete rules require creating a Character and opening Class features, while their named feature-table rows are independently readable and classified PRESENT_BUT_INDIRECT.

The full casting rule itself is complete. It is PRESENT_BUT_INDIRECT because the ordinary **Powers** query places Mythic, RECLVSE, Fletcher and Omens results ahead of Core Using Powers; the current rule title or a more specific query is needed. The existing armor quick rule is complete, but its RELATED Armor roller still displays a tier name without mechanical metadata; individual catalog-armor rows remain PARTIAL.

## Source differences and intentional PDF use

Iron nails are **10s in Bare Bones PDF24**, **5s in Full Edition PDF29 / printed25**, confirmed by reading/rendering the source. Do not silently harmonize the editions. The Power spelling **Foul Psychompomp** in Bare Bones differs from **Foul Psychopomp** in the Full Edition. The effect agrees; alias both names without rewriting canonical source text. Bare Bones creature names accompany archetypes; the corresponding Full Edition creature spreads primarily use the archetype.

World lore, large map topology, art, and connected scenario room prose are appropriate PDF reads. Their classification does not excuse missing repeated mechanical lookups. Full Edition Rotblack Sludge is assessed separately below/inside the shared JSON: existing random tables are retained, but several named monsters/items still lack a reference block. Do not manufacture substitute rooms or stats.

## Page ledger

Every physical page is accounted for below. Bare Bones physical/printed numbering generally coincides through75, though extraction sometimes repeats adjacent footer numbers. Its final aid is unnumbered. Full Edition printed numbering is PDF−4 for the main book; covers, endpapers and appendices are unnumbered or use the explicitly listed adventure labels. A range means source material spans those pages, not an assumption of a uniform page offset.

| PDF | Printed / locator | Material inspected |
| --- | --- | --- |
| 1 | unnumbered | Cover/back-cover spread text |
| 2 | unnumbered | Names; Weather; Traps; ten occult treasures |
| 3 | unnumbered | Corpse Plundering d66 |
| 4 | unnumbered | Credits, acknowledgements and music |
| 5 | unnumbered | Colophon / second-printing identification |
| 6 | unnumbered | Dark Fort art |
| 7 | 3 | Introduction/play premise |
| 8 | 4 | What Was Written title art |
| 9 | 5 | Scriptures I–II / Basilisks |
| 10 | 6 | Basilisks origins |
| 11 | 7 | World boundaries |
| 12 | 8 | World map |
| 13 | 9 | Galgenbeck / Sarkash / Graven-Tosk lore |
| 14 | 10 | Shadow King / palace lore |
| 15 | 11 | Grift / Sigfúm lore |
| 16 | 12 | Kergüs / Anthelia lore |
| 17 | 13 | Anthelia art |
| 18 | 14 | Wästland / Fathmu lore |
| 19 | 15 | Valley lore |
| 20 | 16 | Calendar procedure / pace dice / seventh Misery |
| 21 | 17 | All 36 Miseries and final7:7 |
| 22 | 18 | Creation introduction / money, waterskin, food |
| 23 | 19 | Creation order / containers / two starting-gear tables |
| 24 | 20 | Starting weapons: Femur |
| 25 | 21 | Starting weapons: Staff, Shortsword, Knife, Warhammer, Sword, Bow; Unarmed |
| 26 | no visible number; weapon spread | Starting weapons: Flail and Zweihänder (continuing spread) |
| 27 | no visible number; weapon spread | Starting weapons: Crossbow (continuing spread) |
| 28 | 24 | Armor/shield and scroll restrictions |
| 29 | 25 | Complete equipment/weapon/beast/service price catalog |
| 30 | 26 | Abilities, conversion, tests and DR ladder |
| 31 | 27 | Carrying capacity |
| 32 | 28 | Initial HP / zero vs negative |
| 33 | 29 | Broken; initiative; attack/defence; crit/fumble; armor damage |
| 34 | 30 | Round-duration rule on art spread |
| 35 | 31 | Rest / starvation / infection / reaction / morale |
| 36 | 32 | Art only |
| 37 | 33 | Getting Better |
| 38 | 34 | Casting / daily Power count / failure |
| 39 | 35 | All twenty Powers; rendered layout read |
| 40 | 36 | Basilisk art |
| 41 | 37 | Basilisks Demand d20 |
| 42 | 38 | Omens with all five expenditures |
| 43 | 39 | Terrible Traits (twice) |
| 44 | 40 | Broken Bodies |
| 45 | 41 | Bad Habits |
| 46 | 42 | Troubling Tales setup |
| 47 | 43 | All twenty Troubling Tales |
| 48 | 44 | Arcane Catastrophes title and italic-awareness note |
| 49 | 45 | All twenty catastrophes, global repeat rule and Cube-Violet options |
| 50 | 46 | Fanged Deserter identity, initial stats, bite |
| 51 | 47 | Fanged Deserter base rules, six memories, all six effects |
| 52 | 48 | Gutterborn Scum complete rules, six birth choices, all six specialties |
| 53 | 49 | Gutterborn art only |
| 54 | 50 | Esoteric Hermit identity/initial stats |
| 55 | 51 | Hermit base rules, origins and all six effects |
| 56 | 52 | Royalty art only |
| 57 | 53 | Royalty complete class and all six effects; rotated origin column read |
| 58 | 54 | Priest art only |
| 59 | 55 | Priest complete class and all six effects; rotated origins read |
| 60 | 56 | Herbmaster class mechanics and all eight decoctions |
| 61 | 57 | Herbmaster origin d8; 1–3 Sarkash |
| 62 | 58 | Goblin statblock, curse and values |
| 63 | 59 | Scum statblock, surprise/infection and values |
| 64 | 60 | Berserker statblock, attack d4 and values |
| 65 | 61 | Wraith statblock, initiative/stat drain and values |
| 66 | 62 | Skeleton statblock, surprise/weapon restrictions and values |
| 67 | 63 | Lich statblock, anti-Power / stealing and values |
| 68 | 64 | Troll statblock and growth; values continue next page |
| 69 | 65 | Zombie stats/cure/values; Troll values continuation |
| 70 | 66 | Lady Porcelain statblock, fear and values |
| 71 | 67 | Grotesque stats/gaze/values |
| 72 | 68 | Wickhead stats/infection/light/values |
| 73 | 69 | Wyvern stats/bite-sting/paralysis/values |
| 74 | 70 | Outcasts: Earthbound and Wild Wickhead, all options |
| 75 | 71 | Outcasts: general loyalty, Pale one and Prowler, all options |
| 76 | unnumbered | Adventure divider art |
| 77 | I / title | Rotblack Sludge title / introductory crawl |
| 78 | II | Scenario premise and Seer d8 with truth markers |
| 79 | III | Encounter tables A/B, restrictions and embedded creature/item blocks |
| 80 | IV | Full fifteen-room map and key |
| 81 | room labels1–2 | Rooms1–2: entrance/healing butterflies; dining hall |
| 82 | room labels3–4–5 | Room3: books d4, skeletons and crystal demon |
| 83 | room labels3–4–5 | Rooms4–5: ransack twice; crooked guards/prisoner strangling |
| 84 | room labels6–7 | Rooms6–7: pit trap, pump healing, encounter and links |
| 85 | unnumbered art | Scenario art |
| 86 | unnumbered art | Scenario art |
| 87 | room labels8–9 | Rooms8–9: chains/gems/Gutworm/sludge |
| 88 | room labels10–11–12–13 | Rooms10–11: tunnel/greenhouse/Lesdy/hosts/brew |
| 89 | room labels10–11–12–13 | Rooms12–13: statue, sludge repeat, Aldon and bullwhip |
| 90 | unnumbered art | Scenario art |
| 91 | room labels14–15 | Rooms14–15: debris/forge, Fletcher and his Power table |
| 92 | unnumbered | Wander/Contacts/Adventure Spark appendix |
| 93 | unnumbered | Bedeviled Dungeon tables and conditional room layout |
| 94 | unnumbered | Core quick-reference aid: duplicates earlier rules |
| 95 | unnumbered | Index only |
| 96 | unnumbered | Back cover |

## Individual named results and all other needs

Each line is one distinct source-specific play need. Names below identify source entries; descriptions/effect prose are not reproduced. `PRESENT_BUT_INDIRECT` means the usable content is reachable through a parent table or saved entity, with a demonstrated lookup detour. `PARTIAL` means the direct reference loses mechanics or a required part; metadata alone does not earn RESOLVED. Priority is frequency × friction (1–5 each), not a claim about rule correctness.

| Need | PDF | Classification | Priority | Existing path / smallest change |
| --- | --- | --- | --- | --- |
| Tests: d20 + ability versus DR; creatures unmodified | 30 | RESOLVED | 5 | Reference Desk > rule:core.tests |
| Difficulty scale DR6/8/10/12/14/16/18 | 30 | PARTIAL / P2 | 12 | Add the seven-row source DR ladder behind the Tests rule. |
| Ability conversion and classless two 4d6-drop-lowest options | 30 | PARTIAL / P2 | 6 | Expose conversion and optional creation rule; do not silently select the two abilities. |
| Carrying capacity and encumbrance | 31 | RESOLVED | 4 | Reference Desk > rule:core.carrying |
| Group and individual initiative | 33 | RESOLVED | 5 | Reference Desk > oracle:core.initiative / rule:core.violence |
| Melee, ranged, defence and enemy action count | 33 | RESOLVED | 5 | Reference Desk > rule:core.violence |
| Round: action plus room movement; ten rounds/minute | 34 | PARTIAL / P2 | 9 | Add one compact timing line to combat rule. |
| Crit/Fumble and persistent damaged-armor penalties | 33 | RESOLVED | 5 | Reference Desk > rule:core.crit-fumble |
| Armor tiers, DR penalties and shield break | 28 | RESOLVED | 5 | Reference Desk > rule:core.armor-shield |
| HP0 Broken versus negative HP death | 32,33 | RESOLVED | 4 | Reference Desk > rule:core.broken |
| Broken d4 outcomes and d6 injury follow-up | 33 | RESOLVED | 4 | Reference Desk > oracle:core.broken > core.brokenInjury |
| Rest and HP recovery | 35 | RESOLVED | 5 | Reference Desk > rule:core.rest |
| No food/water and starvation after two days | 35 | PRESENT_BUT_INDIRECT / P2 | 12 | Index starvation, thirst, food and water aliases to Rest. |
| Infection: no rest healing, daily d6 HP loss | 35 | PRESENT_BUT_INDIRECT / P2 | 12 | Index infection/감염 to the existing Rest rule. |
| Uncertain reaction: 2d6 table | 35 | RESOLVED | 5 | Reference Desk > oracle:core.reaction |
| Morale triggers, 2d6 comparison and flee/surrender | 35 | RESOLVED | 5 | Reference Desk > rule:core.reaction-morale / oracle:core.failedMorale |
| Getting Better: HP, abilities and debris | 37 | RESOLVED | 2 | Reference Desk > rule:core.improvement / oracle:core.gettingBetterDebris |
| Casting: Presence DR12, success cost and failure consequences | 38 | PRESENT_BUT_INDIRECT / P2 | 15 | Rank Core casting for Powers/권능/마법 and link the existing rule from scroll results. |
| Daily Power usage: Presence+d4 each morning | 38 | RESOLVED | 5 | Reference Desk > rule:core.omens |
| Scroll restrictions: two-handed weapon and armor; Priest exception | 28,59 | PARTIAL / P2 | 12 | Link the Priest exception from the armor/casting rule without changing class creation. |
| Omens starting die and depleted-only six-hour refill | 42 | RESOLVED | 4 | Reference Desk > rule:core.omens |
| The five permitted Omen expenditures | 42 | PARTIAL / P1 | 25 | Add the five source options to the existing Omens rule. |
| Dawn Calendar die, unique Miseries and fixed seventh 7:7 | 20 | RESOLVED | 5 | Reference Desk > rule:core.miseries / Travel > Calendar |
| The 36 random Miseries and final 7:7 | 21 | RESOLVED | 4 | Reference Desk > oracle:core.miseries / Travel > Calendar |
| Core character creation and starting possessions | 22,23,24,25,26,27,28,30,32 | PRESENT_BUT_INDIRECT / P2 | 6 | Expose concise source creation order as a reference linked to existing tables, preserving optional setup. |
| Names d6 × d8 | 2 | RESOLVED | 3 | Reference Desk > oracle:core.names > ROLL / TABLE |
| Weather d12 | 2 | RESOLVED | 3 | Reference Desk > oracle:core.weather > ROLL / TABLE |
| Traps and Devilry d12 | 2 | RESOLVED | 3 | Reference Desk > oracle:core.traps > ROLL / TABLE |
| Corpse Plundering d66 | 3 | RESOLVED | 3 | Reference Desk > oracle:core.corpsePlundering > ROLL / TABLE |
| The Basilisks Demand d20 | 41 | RESOLVED | 3 | Reference Desk > oracle:core.basilisksDemand > ROLL / TABLE |
| Terrible Traits: roll twice | 43 | RESOLVED | 3 | Reference Desk > oracle:core.traits > ROLL / TABLE |
| Broken Bodies d20 | 44 | RESOLVED | 3 | Reference Desk > oracle:core.bodies > ROLL / TABLE |
| Bad Habits d20, one roll | 45 | RESOLVED | 3 | Reference Desk > oracle:core.badHabits > ROLL / TABLE |
| Troubling Tales d20, one roll | 46,47 | RESOLVED | 3 | Reference Desk > oracle:core.troublingTales > ROLL / TABLE |
| Where Do You Wander d12 | 92 | RESOLVED | 3 | Reference Desk > oracle:core.whereDoYouWander > ROLL / TABLE |
| Who Contacts You d20 | 92 | RESOLVED | 3 | Reference Desk > oracle:core.contacts > ROLL / TABLE |
| Adventure Spark d100 | 92 | RESOLVED | 3 | Reference Desk > oracle:core.sparks > ROLL / TABLE |
| Dungeon title: two d12 columns | 93 | RESOLVED | 3 | Reference Desk > oracle:core.titleA > ROLL / TABLE |
| Dungeon status with conditional inactive reason | 93 | RESOLVED | 3 | Reference Desk > oracle:core.status > ROLL / TABLE |
| Imminent Danger and conditional liquid | 93 | RESOLVED | 3 | Reference Desk > oracle:core.danger > ROLL / TABLE |
| Current dungeon inhabitants d12 | 93 | RESOLVED | 3 | Reference Desk > oracle:core.inhabitants > ROLL / TABLE |
| Distinctive Feature d12 | 93 | RESOLVED | 3 | Reference Desk > oracle:core.feature > ROLL / TABLE |
| Sample Rooms d4 × d6 plus conditional subtables | 93 | RESOLVED | 3 | Reference Desk > oracle:core.rooms > ROLL / TABLE |
| Arcane Catastrophes d20 including Cube-Violet d4 | 48,49 | RESOLVED | 3 | Reference Desk > oracle:core.arcaneCatastrophes |
| Repeated catastrophe: black-fire damage and water interaction | 49 | PARTIAL / P2 | 8 | Add the complete short global repeat rule to the catastrophe reference. |
| Palms Open the Southern Gate | 39 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Tongue of Eris | 39 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Te-le-kin-esis | 39 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Lucy-Fires Levitation | 39 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Daemon of Capillaries | 39 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Nine Violet Signs Unknot the Storm | 39 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Metzhuotl Blind Your Eye | 39 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Foul Psychompomp | 39 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Eyelid Blinds the Mind | 39 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Death | 39 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Grace of a Dead Saint | 39 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Grace for a Sinner | 39 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Whispers Pass the Gate | 39 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Aegis of Sorrow | 39 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Unmet Fate | 39 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Bestial Speech | 39 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| False Dawn/Night’s Chariot | 39 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Hermetic Step | 39 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Roskoe’s Consuming Glare | 39 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Enochian Syntax | 39 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Fanged Deserter — full class reference | 50,51 | PARTIAL / P2 | 12 | Add a read-only Class reference using existing playerRules, creation dice and canonical feature tables; allow lookup without creating a character. |
| Fanged Deserter background options | 51 | RESOLVED | 3 | Reference Desk > oracle:core.fangedDeserterMemories |
| Crumpled Monster Mask | 51 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| The Brown Scimitar of Galgenbeck | 51 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Wizard Teeth | 51 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Old Sigûrd’s Sling | 51 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Ancient Gore-Hound | 51 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| The Shoe of Death’s Horse | 51 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Gutterborn Scum — full class reference | 52 | PARTIAL / P2 | 12 | Add a read-only Class reference using existing playerRules, creation dice and canonical feature tables; allow lookup without creating a character. |
| Gutterborn Scum background options | 52 | RESOLVED | 3 | Reference Desk > oracle:core.gutterbornScumBirth |
| Coward’s Jab | 52 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Filthy Fingersmith | 52 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Abominable Gob Lobber | 52 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Escaping Fate | 52 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Excretal Stealth | 52 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Dodging Death | 52 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Esoteric Hermit — full class reference | 54,55 | PARTIAL / P2 | 12 | Add a read-only Class reference using existing playerRules, creation dice and canonical feature tables; allow lookup without creating a character. |
| Esoteric Hermit background options | 55 | RESOLVED | 3 | Reference Desk > oracle:core.esotericHermitOrigins |
| Master of Fate | 55 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Book of Boiling Blood | 55 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Speaker of Truths | 55 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Initiate of the Invisible College | 55 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Bard of the Undying | 55 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Hawk as Weapon | 55 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Wretched Royalty — full class reference | 57 | PARTIAL / P2 | 12 | Add a read-only Class reference using existing playerRules, creation dice and canonical feature tables; allow lookup without creating a character. |
| Wretched Royalty background options | 57 | RESOLVED | 3 | Reference Desk > oracle:core.wretchedRoyaltyDownfall |
| The Blade of Your Ancestors | 57 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Poltroon the Court Jester | 57 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Barbarister the Incredible Horse | 57 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Hamfund the Squire | 57 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| The Snake-Skin Gift | 57 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Horn of the Schleswig Lords | 57 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Heretical Priest — full class reference | 59 | PARTIAL / P2 | 12 | Add a read-only Class reference using existing playerRules, creation dice and canonical feature tables; allow lookup without creating a character. |
| Heretical Priest background options | 59 | RESOLVED | 3 | Reference Desk > oracle:core.hereticalPriestOrigins |
| Sacred Shepherd’s Crook | 59 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Stolen Mitre | 59 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| List of Sins | 59 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| The Blasphemous Nechrubel Bible | 59 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Stones Taken from Thel-Emas’ Lost Temple | 59 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| (Wrong Jesus) Crucifix | 59 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Occult Herbmaster — full class reference | 60,61 | PARTIAL / P2 | 12 | Add a read-only Class reference using existing playerRules, creation dice and canonical feature tables; allow lookup without creating a character. |
| Occult Herbmaster background options | 61 | RESOLVED | 3 | Reference Desk > oracle:core.occultHerbmasterOrigins |
| Red Poison decoction | 60 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Ezumiels Vapor | 60 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Southern Frog Stew | 60 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Elixir Vitalis | 60 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Spider-Owl Soup | 60 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Fernor’s Philtre | 60 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Hyphos’ Enervating Snuff | 60 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Black Poison decoction | 60 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Ash-grey ring | 2 | PRESENT_BUT_INDIRECT / P2 | 6 | Index this existing row for direct named lookup; no new content or generator. |
| Vile flute / meat golem | 2 | PRESENT_BUT_INDIRECT / P2 | 6 | Index this existing row for direct named lookup; no new content or generator. |
| Famine Spoon | 2 | PRESENT_BUT_INDIRECT / P2 | 6 | Index this existing row for direct named lookup; no new content or generator. |
| Malevolently accurate mirror | 2 | PRESENT_BUT_INDIRECT / P2 | 6 | Index this existing row for direct named lookup; no new content or generator. |
| Vampiric phurba | 2 | PRESENT_BUT_INDIRECT / P2 | 6 | Index this existing row for direct named lookup; no new content or generator. |
| Black pearl | 2 | PRESENT_BUT_INDIRECT / P2 | 6 | Index this existing row for direct named lookup; no new content or generator. |
| Immortal-hour torch | 2 | PRESENT_BUT_INDIRECT / P2 | 6 | Index this existing row for direct named lookup; no new content or generator. |
| Silver bird cage | 2 | PRESENT_BUT_INDIRECT / P2 | 6 | Index this existing row for direct named lookup; no new content or generator. |
| Black Crown of the Crippled King | 2 | PRESENT_BUT_INDIRECT / P2 | 6 | Index this existing row for direct named lookup; no new content or generator. |
| Ancient blindfold | 2 | PRESENT_BUT_INDIRECT / P2 | 6 | Index this existing row for direct named lookup; no new content or generator. |
| Backpack — purchase/use reference | 29 | PARTIAL / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Bear trap — purchase/use reference | 29 | PARTIAL / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Blanket — purchase/use reference | 29 | MISSING / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Caltrops — purchase/use reference | 29 | MISSING / P2 | 16 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Chalk — purchase/use reference | 29 | MISSING / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Chewing tobacco — purchase/use reference | 29 | MISSING / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Crowbar — purchase/use reference | 29 | PARTIAL / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Crucifix, silver — purchase/use reference | 29 | PARTIAL / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Crucifix, wood — purchase/use reference | 29 | MISSING / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Dried food — purchase/use reference | 29 | PARTIAL / P2 | 16 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Exquisite perfume — purchase/use reference | 29 | PRESENT_BUT_INDIRECT / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Firesteel — purchase/use reference | 29 | MISSING / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Grappling hook — purchase/use reference | 29 | PARTIAL / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Hammer — purchase/use reference | 29 | MISSING / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Heavy chain — purchase/use reference | 29 | PARTIAL / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Iron nails — purchase/use reference | 29 | PARTIAL / P2 | 8 | Add a static source-backed equipment entry (price, quantity and effect); index name. Preserve edition-specific conflicting values. |
| Ladder — purchase/use reference | 29 | MISSING / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Lantern oil — purchase/use reference | 29 | PARTIAL / P2 | 16 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Lard — purchase/use reference | 29 | PARTIAL / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Large iron hook — purchase/use reference | 29 | MISSING / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Lockpicks — purchase/use reference | 29 | PARTIAL / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Magnesium strip — purchase/use reference | 29 | PARTIAL / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Manacles — purchase/use reference | 29 | MISSING / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Mattress — purchase/use reference | 29 | MISSING / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Meat cleaver — purchase/use reference | 29 | MISSING / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Medicine box — purchase/use reference | 29 | PARTIAL / P2 | 16 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Metal file — purchase/use reference | 29 | PARTIAL / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Mirror — purchase/use reference | 29 | MISSING / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Muzzle — purchase/use reference | 29 | MISSING / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Noose — purchase/use reference | 29 | MISSING / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Oil lamp — purchase/use reference | 29 | PARTIAL / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Poison (black) — purchase/use reference | 29 | PARTIAL / P2 | 16 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Poison (red) — purchase/use reference | 29 | PARTIAL / P2 | 16 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Preserved corpse — purchase/use reference | 29 | MISSING / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Rope — purchase/use reference | 29 | PARTIAL / P2 | 16 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Small wagon — purchase/use reference | 29 | PARTIAL / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Tent — purchase/use reference | 29 | PARTIAL / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Toolbox — purchase/use reference | 29 | PARTIAL / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Torch — purchase/use reference | 29 | PARTIAL / P2 | 16 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Sack — purchase/use reference | 29 | PARTIAL / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Salt — purchase/use reference | 29 | MISSING / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Scissors — purchase/use reference | 29 | MISSING / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Scroll resale value — purchase/use reference | 29 | MISSING / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Sharp needle — purchase/use reference | 29 | PARTIAL / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Waterskin — purchase/use reference | 29 | PARTIAL / P2 | 16 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Battle axe — damage and price | 29 | MISSING / P2 | 16 | Add the printed weapon catalog entry; expose existing damage metadata in the reference result and index the item. |
| Bow — damage and price | 25,29 | PARTIAL / P1 | 16 | Add the printed weapon catalog entry; expose existing damage metadata in the reference result and index the item. |
| Club — damage and price | 29 | MISSING / P2 | 16 | Add the printed weapon catalog entry; expose existing damage metadata in the reference result and index the item. |
| Crossbow — damage and price | 27,29 | PARTIAL / P1 | 16 | Add the printed weapon catalog entry; expose existing damage metadata in the reference result and index the item. |
| Flail — damage and price | 26,29 | PARTIAL / P1 | 16 | Add the printed weapon catalog entry; expose existing damage metadata in the reference result and index the item. |
| Femur — damage and price | 24,29 | PARTIAL / P1 | 16 | Add the printed weapon catalog entry; expose existing damage metadata in the reference result and index the item. |
| Handaxe — damage and price | 29 | MISSING / P2 | 16 | Add the printed weapon catalog entry; expose existing damage metadata in the reference result and index the item. |
| Knife — damage and price | 25,29 | PARTIAL / P1 | 16 | Add the printed weapon catalog entry; expose existing damage metadata in the reference result and index the item. |
| Mace — damage and price | 29 | MISSING / P2 | 16 | Add the printed weapon catalog entry; expose existing damage metadata in the reference result and index the item. |
| Shortbow — damage and price | 29 | MISSING / P2 | 16 | Add the printed weapon catalog entry; expose existing damage metadata in the reference result and index the item. |
| Shortsword — damage and price | 25,29 | PARTIAL / P1 | 16 | Add the printed weapon catalog entry; expose existing damage metadata in the reference result and index the item. |
| Sling — damage and price | 29 | MISSING / P2 | 16 | Add the printed weapon catalog entry; expose existing damage metadata in the reference result and index the item. |
| Staff — damage and price | 25,29 | PARTIAL / P1 | 16 | Add the printed weapon catalog entry; expose existing damage metadata in the reference result and index the item. |
| Sword — damage and price | 25,29 | PARTIAL / P1 | 16 | Add the printed weapon catalog entry; expose existing damage metadata in the reference result and index the item. |
| Warhammer — damage and price | 25,29 | PARTIAL / P1 | 16 | Add the printed weapon catalog entry; expose existing damage metadata in the reference result and index the item. |
| Whip — damage and price | 29 | MISSING / P2 | 16 | Add the printed weapon catalog entry; expose existing damage metadata in the reference result and index the item. |
| Zweihänder — damage and price | 26,29 | PARTIAL / P1 | 16 | Add the printed weapon catalog entry; expose existing damage metadata in the reference result and index the item. |
| 20 arrows — purchase price | 29 | MISSING / P2 | 8 | Add the printed stock/price row with searchable name. |
| 10 bolts — purchase price | 29 | MISSING / P2 | 8 | Add the printed stock/price row with searchable name. |
| Dog (trained) — purchase price | 29 | MISSING / P2 | 8 | Add the printed stock/price row with searchable name. |
| Dog (wild) — purchase price | 29 | MISSING / P2 | 8 | Add the printed stock/price row with searchable name. |
| Horse — purchase price | 29 | MISSING / P2 | 8 | Add the printed stock/price row with searchable name. |
| Mule — purchase price | 29 | MISSING / P2 | 8 | Add the printed stock/price row with searchable name. |
| Rat (tame) — purchase price | 29 | MISSING / P2 | 8 | Add the printed stock/price row with searchable name. |
| Night in hospice | 29 | MISSING / P2 | 12 | Add this row to a compact static Core services/repair lookup, with original maximum-repair restriction. |
| Drink | 29 | MISSING / P2 | 12 | Add this row to a compact static Core services/repair lookup, with original maximum-repair restriction. |
| Steady meal | 29 | MISSING / P2 | 12 | Add this row to a compact static Core services/repair lookup, with original maximum-repair restriction. |
| Bribe: guard | 29 | MISSING / P2 | 12 | Add this row to a compact static Core services/repair lookup, with original maximum-repair restriction. |
| Bribe: clerk | 29 | MISSING / P2 | 12 | Add this row to a compact static Core services/repair lookup, with original maximum-repair restriction. |
| Bribe: rabble | 29 | MISSING / P2 | 12 | Add this row to a compact static Core services/repair lookup, with original maximum-repair restriction. |
| Armor repair tier 1 to 2 | 29 | MISSING / P2 | 12 | Add this row to a compact static Core services/repair lookup, with original maximum-repair restriction. |
| Armor repair tier 2 to 3 | 29 | MISSING / P2 | 12 | Add this row to a compact static Core services/repair lookup, with original maximum-repair restriction. |
| Improvised weapons d4; unarmed d2 | 25,29 | PARTIAL / P2 | 16 | Add the two source damage lines to Combat/Weapons lookup. |
| Goblin — stat block and special rules | 62 | RESOLVED | 4 | Reference Desk > creature:core:58:seth > OPEN |
| Goblin — captured/dead/body-part value | 62 | PRESENT_BUT_INDIRECT / P2 | 8 | Expose quiet valuation disclosure on the existing Reference creature result without requiring a saved monster. |
| Scum — stat block and special rules | 63 | RESOLVED | 4 | Reference Desk > creature:core:58:bent > OPEN |
| Scum — captured/dead/body-part value | 63 | PRESENT_BUT_INDIRECT / P2 | 8 | Expose quiet valuation disclosure on the existing Reference creature result without requiring a saved monster. |
| Berserker — stat block and special rules | 64 | RESOLVED | 4 | Reference Desk > creature:core:59:zukuma > OPEN |
| Berserker — captured/dead/body-part value | 64 | PRESENT_BUT_INDIRECT / P2 | 8 | Expose quiet valuation disclosure on the existing Reference creature result without requiring a saved monster. |
| Wraith — stat block and special rules | 65 | RESOLVED | 4 | Reference Desk > creature:core:59:wrat > OPEN |
| Wraith — captured/dead/body-part value | 65 | PRESENT_BUT_INDIRECT / P2 | 8 | Expose quiet valuation disclosure on the existing Reference creature result without requiring a saved monster. |
| Blood-drenched skeleton — stat block and special rules | 66 | RESOLVED | 4 | Reference Desk > creature:core:60:belze > OPEN |
| Blood-drenched skeleton — captured/dead/body-part value | 66 | PRESENT_BUT_INDIRECT / P2 | 8 | Expose quiet valuation disclosure on the existing Reference creature result without requiring a saved monster. |
| Undead (weak) necromancer — stat block and special rules | 67 | RESOLVED | 4 | Reference Desk > creature:core:60:lich > OPEN |
| Undead (weak) necromancer — captured/dead/body-part value | 67 | PRESENT_BUT_INDIRECT / P2 | 8 | Expose quiet valuation disclosure on the existing Reference creature result without requiring a saved monster. |
| Troll — stat block and special rules | 68 | RESOLVED | 4 | Reference Desk > creature:core:60:arbint > OPEN |
| Troll — captured/dead/body-part value | 68,69 | PRESENT_BUT_INDIRECT / P2 | 8 | Expose quiet valuation disclosure on the existing Reference creature result without requiring a saved monster. |
| Zombie — stat block and special rules | 69 | RESOLVED | 4 | Reference Desk > creature:core:61:nodh > OPEN |
| Zombie — captured/dead/body-part value | 69 | PRESENT_BUT_INDIRECT / P2 | 8 | Expose quiet valuation disclosure on the existing Reference creature result without requiring a saved monster. |
| Undead doll — stat block and special rules | 70 | RESOLVED | 4 | Reference Desk > creature:core:61:lady-porcelain > OPEN |
| Undead doll — captured/dead/body-part value | 70 | PRESENT_BUT_INDIRECT / P2 | 8 | Expose quiet valuation disclosure on the existing Reference creature result without requiring a saved monster. |
| Grotesque — stat block and special rules | 71 | RESOLVED | 4 | Reference Desk > creature:core:62:thinx > OPEN |
| Grotesque — captured/dead/body-part value | 71 | PRESENT_BUT_INDIRECT / P2 | 8 | Expose quiet valuation disclosure on the existing Reference creature result without requiring a saved monster. |
| Wickhead knife-wielder — stat block and special rules | 72 | RESOLVED | 4 | Reference Desk > creature:core:62:aland > OPEN |
| Wickhead knife-wielder — captured/dead/body-part value | 72 | PRESENT_BUT_INDIRECT / P2 | 8 | Expose quiet valuation disclosure on the existing Reference creature result without requiring a saved monster. |
| Wyvern — stat block and special rules | 73 | RESOLVED | 4 | Reference Desk > creature:core:62:eulotha > OPEN |
| Wyvern — captured/dead/body-part value | 73 | PRESENT_BUT_INDIRECT / P2 | 8 | Expose quiet valuation disclosure on the existing Reference creature result without requiring a saved monster. |
| Outcast recruitment, loyalty and Presence modifier | 75 | MISSING / P2 | 12 | Add the short source follower rule and link it from Outcast results. |
| Earthbound — stat block, trait, specialty and values | 74 | RESOLVED | 3 | Reference Desk > creature:core:core.outcast.earthbound > OPEN |
| Wild Wickhead — stat block, trait, specialty and values | 74 | PARTIAL / P2 | 12 | Index existing Wild Wickhead Outcast record as a static creature/NPC reference. |
| Pale one — stat block, trait, specialty and values | 75 | RESOLVED | 3 | Reference Desk > creature:core:core.outcast.pale-one > OPEN |
| Prowler — stat block, trait, specialty and values | 75 | RESOLVED | 3 | Reference Desk > creature:core:core.outcast.prowler > OPEN |
| World history, basilisk theology and regional lore | 7,8,9,10,11,12,13,14,15,16,17,18,19 | PDF_APPROPRIATE | — | Keep PDF page route available; do not recreate full artwork/lore. |
| World map | 12 | PDF_APPROPRIATE | — | Keep PDF page route available; do not recreate full artwork/lore. |
| Drawing/finding a dungeon map | 93 | PDF_APPROPRIATE | — | Keep PDF page route available; do not recreate full artwork/lore. |
| Printed Core quick-reference sheet | 94 | PDF_APPROPRIATE | — | Keep PDF page route available; do not recreate full artwork/lore. |
| Rotblack Sludge map and connected fifteen-room key | 77,78,79,80,81,82,83,84,85,86,87,88,89,90,91 | PDF_APPROPRIATE | — | Retain page-level PDF access; do not generate substitute rooms. |
| Rotblack Sludge: Seer d8 rumors and truth markers | 78 | MISSING / P3 | 3 | Index this existing scenario table only if Rotblack preparation is supported; keep its truth markers. |
| Rotblack random encounters A | 79 | RESOLVED | 2 | Reference Desk > oracle:core-full.rotblack.encountersA > ROLL / TABLE |
| Rotblack random encounters B | 79 | RESOLVED | 2 | Reference Desk > oracle:core-full.rotblack.encountersB > ROLL / TABLE |
| Rotblack library book study | 82 | RESOLVED | 2 | Reference Desk > oracle:core-full.rotblack.books > ROLL / TABLE |
| Rotblack guard-room ransack | 83 | RESOLVED | 2 | Reference Desk > oracle:core-full.rotblack.ransack > ROLL / TABLE |
| Fletcher Power selection d4 | 91 | RESOLVED | 2 | Reference Desk > oracle:core-full.rotblack.fletcherPowers > ROLL / TABLE |
| Mongrel | 79 | RESOLVED | 3 | Reference Desk > creature:core-full:core-full.rotblack.mongrel > OPEN |
| Dusk Gnoum | 79 | RESOLVED | 3 | Reference Desk > creature:core-full:core-full.rotblack.dusk-gnoum > OPEN |
| Guards with Sharpened Teeth | 79 | RESOLVED | 3 | Reference Desk > creature:core-full:core-full.rotblack.guards-sharpened-teeth > OPEN |
| Nesting Death — complete scenario stat/effect block | 79 | PRESENT_BUT_INDIRECT / P2 | 6 | Add or expose the exact existing scenario block by name; preserve distinct identities and conditional effects. |
| Sagsobuth — complete scenario stat/effect block | 79 | PARTIAL / P2 | 6 | Add or expose the exact existing scenario block by name; preserve distinct identities and conditional effects. |
| Slumbering skeletons — complete scenario stat/effect block | 82 | MISSING / P2 | 6 | Add or expose the exact existing scenario block by name; preserve distinct identities and conditional effects. |
| Tired crystal demon — complete scenario stat/effect block | 82 | PARTIAL / P2 | 6 | Add or expose the exact existing scenario block by name; preserve distinct identities and conditional effects. |
| Crooked guards — complete scenario stat/effect block | 83 | MISSING / P2 | 6 | Add or expose the exact existing scenario block by name; preserve distinct identities and conditional effects. |
| Mad prisoners — complete scenario stat/effect block | 83 | MISSING / P2 | 6 | Add or expose the exact existing scenario block by name; preserve distinct identities and conditional effects. |
| Gutworm — complete scenario stat/effect block | 87 | MISSING / P2 | 6 | Add or expose the exact existing scenario block by name; preserve distinct identities and conditional effects. |
| Lesdy — complete scenario stat/effect block | 88 | MISSING / P2 | 6 | Add or expose the exact existing scenario block by name; preserve distinct identities and conditional effects. |
| Hosts — complete scenario stat/effect block | 88 | MISSING / P2 | 6 | Add or expose the exact existing scenario block by name; preserve distinct identities and conditional effects. |
| Aldon — complete scenario stat/effect block | 89 | MISSING / P2 | 6 | Add or expose the exact existing scenario block by name; preserve distinct identities and conditional effects. |
| Fletcher — complete scenario stat/effect block | 91 | PARTIAL / P2 | 6 | Add or expose the exact existing scenario block by name; preserve distinct identities and conditional effects. |
| Violet poison | 79 | PRESENT_BUT_INDIRECT / P3 | 3 | Expose named row/block lookup; retain source-specific duration, quantity and side-effects. |
| Beechwood Tube / foul protean scroll | 79 | PRESENT_BUT_INDIRECT / P3 | 3 | Expose named row/block lookup; retain source-specific duration, quantity and side-effects. |
| Small crossbow and bolts | 83 | PRESENT_BUT_INDIRECT / P3 | 3 | Expose named row/block lookup; retain source-specific duration, quantity and side-effects. |
| Runed bullwhip | 89 | MISSING / P3 | 3 | Expose named row/block lookup; retain source-specific duration, quantity and side-effects. |
| Entrance butterflies: healing | 81 | PDF_APPROPRIATE | — | Provide page-level context link if a Rotblack key is opened; no synthetic automation. |
| Pump muddy liquid: healing | 84 | PDF_APPROPRIATE | — | Provide page-level context link if a Rotblack key is opened; no synthetic automation. |
| Rotblack Sludge: heat, swim duration and Gutworm bite checks | 87,89 | PDF_APPROPRIATE | — | Provide page-level context link if a Rotblack key is opened; no synthetic automation. |
| Greenhouse brew/ambush penalty | 88 | PDF_APPROPRIATE | — | Provide page-level context link if a Rotblack key is opened; no synthetic automation. |
| Statue floor-tilt and eye socket | 89 | PDF_APPROPRIATE | — | Provide page-level context link if a Rotblack key is opened; no synthetic automation. |
| Ich-bin-luft — Fletcher-only Power | 91 | PRESENT_BUT_INDIRECT / P3 | 3 | Add a named view of this existing entry, explicitly scoped to Fletcher. |
| Bomb — starting effect | 23 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the canonical item entry; retain source dice and any chosen quantity separately. |
| Life elixir — starting effect | 23 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the canonical item entry; retain source dice and any chosen quantity separately. |
| Small vicious dog — starting effect | 23 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the canonical item entry; retain source dice and any chosen quantity separately. |
| Monkeys — starting effect | 23 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the canonical item entry; retain source dice and any chosen quantity separately. |
| Light armor — purchase price and effect | 28 | PARTIAL / P2 | 12 | Expose source armor/shield prices with the existing usable protection summary; index individual item names. |
| Medium armor — purchase price and effect | 28 | PARTIAL / P2 | 12 | Expose source armor/shield prices with the existing usable protection summary; index individual item names. |
| Heavy armor — purchase price and effect | 28 | PARTIAL / P2 | 12 | Expose source armor/shield prices with the existing usable protection summary; index individual item names. |
| Shield — purchase price and effect | 28 | PARTIAL / P2 | 12 | Expose source armor/shield prices with the existing usable protection summary; index individual item names. |

## Audit boundaries

No production corrections were performed. A RESOLVED row does not imply every English/Korean alias ranks well, that the app automates all player choices, or that a source table should become a generator. It means the identified source mechanics are usable through the cited existing route. Source text formatting oddities are not rewritten. Existing campaigns and manual edits were not touched. No deployment is claimed.
