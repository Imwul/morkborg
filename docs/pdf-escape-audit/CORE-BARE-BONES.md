# MÖRK BORG Bare Bones Edition: PDF escape audit

> Completion recheck: current application HEAD `479cbd765b4168eeaeee27f921bf4b0a6615c51b`. The original page/browser observations below retain their audit baseline. [CURRENT-HEAD-RECHECK.md](CURRENT-HEAD-RECHECK.md) records the newer rolled Power effects, English casting ranking and remaining Omens/search gaps. Final matrix/coverage use that recheck; historical browser results are not claimed to be current failures.

Baseline: `a50d2425deb9a4e9c7e7abb0983dd4c34c68c116`. Audit only. No production data, UI, generator, schema, campaign, deployment or source content changed.

All **76 physical PDF pages** were read from fresh extraction. Ambiguous/low-text Full Edition pages, the complete Power layout, class layouts, equipment catalog and dungeon-table layout were checked in rendered PNGs. Source evidence comes from the supplied files, not an earlier coverage report. Bare Bones and Full Edition rows share `needId` for the same play need; do not add their counts to obtain unique coverage.

This source has **243 audited source needs (including the PDF-appropriate rows)**: RESOLVED: 56, PRESENT_BUT_INDIRECT: 69, PARTIAL: 73, MISSING: 42, PDF_APPROPRIATE: 3, SOURCE_UNAVAILABLE: 0. The machine-readable rows are in [`data/core-rows.json`](data/core-rows.json). The separate supplied `MB_Cheatsheet.pdf` is Mythic Bastionland and contributes no MÖRK BORG needs.

## What still makes the player open the PDF

- **20 named Powers: PARTIAL/P1.** Each original effect was checked individually, including dice, range, target count, duration and exceptions. All twenty effects exist in canonical `metadata.effect`. At current HEAD, Reference Desk ROLL displays the effect; TABLE still shows only the name. A generated Character scroll has the effect; the old Oracle result metadata disclosure can expose it after rolling. Neither replaces deliberate named Power lookup. Most exact names return no reference result; Foul Psychompomp's separate summon subtable does not supply the whole spell-reference flow. Smallest fix: display the existing effect in TABLE and index the existing named entry, without new generator logic.
- **All 17 purchase-list weapons examined.** The ten starting weapon records contain damage in metadata; Desk TABLE and ROLL hide it. Seven weapons outside the starting d10 table lack a Core static reference altogether. Prices are absent. Damage on a generated Character is useful but does not solve lookup at play time.
- **The shop catalog is not a usable reference.** Individually audited 45 general equipment rows, two ammunition rows, five beasts, eight services/repair rows and armor/shield. Starting gear sometimes supplies an effect, never a substitute for full shop stock/price. A poison bottle's random starting doses and its fixed shop doses are different source needs. Core-specific inn/food/bribe prices must not be replaced by a supplement's tavern prices.
- **All six classes are generated, but a class is not readable as a complete standalone reference.** Its base rules are available on an instantiated Character under Class features. Search finds the class's background/feature tables, without base modifiers, constraints and daily/advancement instructions. Each of the 30 named class effects and eight decoctions was examined separately: all full effect text is present in the parent table, but names are not indexed. The simple fix is a read-only class/entry surface using existing source data.
- **Omens spending remains imprecise in the named quick rule.** The five options are now summarized, but DR reduction is worded as a retry and Fumble as ordinary failure; reroll scope is incomplete. See CURRENT-HEAD-RECHECK.md for the source comparison.
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
| 1 | unnumbered art | Frontispiece art; no play rule |
| 2 | 2 | Names d6×d8 |
| 3 | 3 | Ten occult treasures: all effects read |
| 4 | 4 | Traps; Weather; Corpse Plundering first half |
| 5 | 5 | Corpse Plundering continuation |
| 6 | 6 | Colophon |
| 7 | 7 | Credits, acknowledgements, music |
| 8 | blank | Blank/divider |
| 9 | 9 | Introduction and play premise |
| 10 | 10 | Basilisks / Scriptures I–II |
| 11 | 11 | Basilisks III–IV / world boundaries |
| 12 | 12 | Galgenbeck, Sarkash, Graven-Tosk lore |
| 13 | 13 | Shadow King and palace lore |
| 14 | 14 | Grift, Sigfúm, Múr and Terion lore |
| 15 | 15 | Kergüs, Anthelia, Wästland lore |
| 16 | 16 | Wästland / Valley of Unfortunate Undead lore |
| 17 | 17 | Calendar procedure and apocalypse pace dice |
| 18 | 18 | Miseries Psalms I–II |
| 19 | 19 | Miseries Psalms III–IV |
| 20 | 20 | Miseries Psalms V–VII |
| 21 | 21 | Character creation, silver/food, containers |
| 22 | 22 | Two starting-gear d12 tables; every effect examined |
| 23 | 23 | Starting weapons, armor, shield, scroll restrictions |
| 24 | 24 | Equipment shop first half; every row examined |
| 25 | 25 | Equipment shop continuation; services and repair; every row examined |
| 26 | 26 | Seventeen weapons, ammunition and five beasts; every row examined |
| 27 | 27 | Abilities, conversion and classless option |
| 28 | 28 | Tests, DR ladder, carrying capacity |
| 29 | 29 | HP and Broken d4 including injury d6 |
| 30 | 30 | Initiative and attack/defence rules |
| 31 | 31 | Crit/Fumble; armor damage; round duration; rest/starvation/infection |
| 32 | 32 | Reaction and Morale |
| 33 | 33 | Getting Better: HP, abilities, debris |
| 34 | 34 | Casting and Unclean Powers 1–7 |
| 35 | 35 | Unclean Powers 8–10 and all ten Sacred Powers |
| 36 | 36 | Basilisks Demand d20 |
| 37 | 37 | Omens: starting/recovery and five uses |
| 38 | 38 | Terrible Traits: roll twice |
| 39 | 39 | Broken Bodies d20 |
| 40 | 40 | Bad Habits d20 |
| 41 | 41 | Troubling Tales 1–16 |
| 42 | 42 | Troubling Tales 17–20 |
| 43 | 43 | Arcane Catastrophes header/repeat rule and results1–6 |
| 44 | 44 | Arcane Catastrophes7–17 |
| 45 | 45 | Arcane Catastrophes18–20; Cube-Violet d4 |
| 46 | 46 | Fanged Deserter: base rules and memories |
| 47 | 47 | All six Fanged Deserter effects |
| 48 | 48 | Gutterborn Scum: base rules and birth |
| 49 | 49 | All six Gutterborn specialties and advancement |
| 50 | 50 | Esoteric Hermit: base rules and origins |
| 51 | 51 | All six Esoteric Hermit effects |
| 52 | 52 | Wretched Royalty: base rules and downfall |
| 53 | 53 | All six Royalty effects; choose/roll two |
| 54 | 54 | Heretical Priest: base rules and origins |
| 55 | 55 | All six Priest effects; sixth row decorated 666 |
| 56 | 56 | Occult Herbmaster: base rules, origins, daily dose rule |
| 57 | 57 | All eight decoctions |
| 58 | 58 | Goblin and Scum: statblocks, triggers, values |
| 59 | 59 | Berserker and Wraith: statblocks, triggers, values |
| 60 | 60 | Skeleton, Lich, Troll: statblocks, triggers, values |
| 61 | 61 | Zombie and Lady Porcelain: statblocks, triggers, values |
| 62 | 62 | Grotesque, Wickhead, Wyvern: statblocks, triggers, values |
| 63 | 63 | Outcast recruitment and loyalty |
| 64 | 64 | Earthbound: stats and all trait/specialty/value options |
| 65 | 65 | Wild Wickhead: stats and all trait/specialty/value options |
| 66 | 66 | Pale one: stats and all trait/specialty/value options |
| 67 | 67 | Prowler: stats and all trait/specialty/value options |
| 68 | 68 | Wander d12 / Contacts first half |
| 69 | 69 | Contacts continuation / Adventure Spark first half |
| 70 | 70 | Adventure Spark continuation |
| 71 | 71 | Bedeviled Dungeon title columns, status and map instruction |
| 72 | 72 | Dungeon danger / inhabitants |
| 73 | 73 | Dungeon feature / Sample Rooms first half |
| 74 | 74 | Sample Rooms continuation and conditional options |
| 75 | 75 | Index only; not a new play need |
| 76 | unnumbered aid | Core quick-reference aid: duplicates previously audited rules |

## Individual named results and all other needs

Each line is one distinct source-specific play need. Names below identify source entries; descriptions/effect prose are not reproduced. `PRESENT_BUT_INDIRECT` means the usable content is reachable through a parent table or saved entity, with a demonstrated lookup detour. `PARTIAL` means the direct reference loses mechanics or a required part; metadata alone does not earn RESOLVED. Priority is frequency × friction (1–5 each), not a claim about rule correctness.

| Need | PDF | Classification | Priority | Existing path / smallest change |
| --- | --- | --- | --- | --- |
| Tests: d20 + ability versus DR; creatures unmodified | 28 | RESOLVED | 5 | Reference Desk > rule:core.tests |
| Difficulty scale DR6/8/10/12/14/16/18 | 28 | PARTIAL / P2 | 12 | Add the seven-row source DR ladder behind the Tests rule. |
| Ability conversion and classless two 4d6-drop-lowest options | 27 | PARTIAL / P2 | 6 | Expose conversion and optional creation rule; do not silently select the two abilities. |
| Carrying capacity and encumbrance | 28 | RESOLVED | 4 | Reference Desk > rule:core.carrying |
| Group and individual initiative | 30 | RESOLVED | 5 | Reference Desk > oracle:core.initiative / rule:core.violence |
| Melee, ranged, defence and enemy action count | 30 | RESOLVED | 5 | Reference Desk > rule:core.violence |
| Round: action plus room movement; ten rounds/minute | 31 | PARTIAL / P2 | 9 | Add one compact timing line to combat rule. |
| Crit/Fumble and persistent damaged-armor penalties | 31 | RESOLVED | 5 | Reference Desk > rule:core.crit-fumble |
| Armor tiers, DR penalties and shield break | 23 | RESOLVED | 5 | Reference Desk > rule:core.armor-shield |
| HP0 Broken versus negative HP death | 29 | RESOLVED | 4 | Reference Desk > rule:core.broken |
| Broken d4 outcomes and d6 injury follow-up | 29 | RESOLVED | 4 | Reference Desk > oracle:core.broken > core.brokenInjury |
| Rest and HP recovery | 31 | RESOLVED | 5 | Reference Desk > rule:core.rest |
| No food/water and starvation after two days | 31 | PRESENT_BUT_INDIRECT / P2 | 12 | Index starvation, thirst, food and water aliases to Rest. |
| Infection: no rest healing, daily d6 HP loss | 31 | PRESENT_BUT_INDIRECT / P2 | 12 | Index infection/감염 to the existing Rest rule. |
| Uncertain reaction: 2d6 table | 32 | RESOLVED | 5 | Reference Desk > oracle:core.reaction |
| Morale triggers, 2d6 comparison and flee/surrender | 32 | RESOLVED | 5 | Reference Desk > rule:core.reaction-morale / oracle:core.failedMorale |
| Getting Better: HP, abilities and debris | 33 | RESOLVED | 2 | Reference Desk > rule:core.improvement / oracle:core.gettingBetterDebris |
| Casting: Presence DR12, success cost and failure consequences | 34 | PRESENT_BUT_INDIRECT / P2 | 15 | Rank Core casting for Powers/권능/마법 and link the existing rule from scroll results. |
| Daily Power usage: Presence+d4 each morning | 34 | RESOLVED | 5 | Reference Desk > rule:core.omens |
| Scroll restrictions: two-handed weapon and armor; Priest exception | 23 | PARTIAL / P2 | 12 | Link the Priest exception from the armor/casting rule without changing class creation. |
| Omens starting die and depleted-only six-hour refill | 37 | RESOLVED | 4 | Reference Desk > rule:core.omens |
| The five permitted Omen expenditures | 37 | PARTIAL / P1 | 25 | Add the five source options to the existing Omens rule. |
| Dawn Calendar die, unique Miseries and fixed seventh 7:7 | 17 | RESOLVED | 5 | Reference Desk > rule:core.miseries / Travel > Calendar |
| The 36 random Miseries and final 7:7 | 18,19,20 | RESOLVED | 4 | Reference Desk > oracle:core.miseries / Travel > Calendar |
| Core character creation and starting possessions | 21,22,23,27,29 | PRESENT_BUT_INDIRECT / P2 | 6 | Expose concise source creation order as a reference linked to existing tables, preserving optional setup. |
| Names d6 × d8 | 2 | RESOLVED | 3 | Reference Desk > oracle:core.names > ROLL / TABLE |
| Weather d12 | 4 | RESOLVED | 3 | Reference Desk > oracle:core.weather > ROLL / TABLE |
| Traps and Devilry d12 | 4 | RESOLVED | 3 | Reference Desk > oracle:core.traps > ROLL / TABLE |
| Corpse Plundering d66 | 4,5 | RESOLVED | 3 | Reference Desk > oracle:core.corpsePlundering > ROLL / TABLE |
| The Basilisks Demand d20 | 36 | RESOLVED | 3 | Reference Desk > oracle:core.basilisksDemand > ROLL / TABLE |
| Terrible Traits: roll twice | 38 | RESOLVED | 3 | Reference Desk > oracle:core.traits > ROLL / TABLE |
| Broken Bodies d20 | 39 | RESOLVED | 3 | Reference Desk > oracle:core.bodies > ROLL / TABLE |
| Bad Habits d20, one roll | 40 | RESOLVED | 3 | Reference Desk > oracle:core.badHabits > ROLL / TABLE |
| Troubling Tales d20, one roll | 41,42 | RESOLVED | 3 | Reference Desk > oracle:core.troublingTales > ROLL / TABLE |
| Where Do You Wander d12 | 68 | RESOLVED | 3 | Reference Desk > oracle:core.whereDoYouWander > ROLL / TABLE |
| Who Contacts You d20 | 68,69 | RESOLVED | 3 | Reference Desk > oracle:core.contacts > ROLL / TABLE |
| Adventure Spark d100 | 69,70 | RESOLVED | 3 | Reference Desk > oracle:core.sparks > ROLL / TABLE |
| Dungeon title: two d12 columns | 71 | RESOLVED | 3 | Reference Desk > oracle:core.titleA > ROLL / TABLE |
| Dungeon status with conditional inactive reason | 71 | RESOLVED | 3 | Reference Desk > oracle:core.status > ROLL / TABLE |
| Imminent Danger and conditional liquid | 72 | RESOLVED | 3 | Reference Desk > oracle:core.danger > ROLL / TABLE |
| Current dungeon inhabitants d12 | 72 | RESOLVED | 3 | Reference Desk > oracle:core.inhabitants > ROLL / TABLE |
| Distinctive Feature d12 | 73 | RESOLVED | 3 | Reference Desk > oracle:core.feature > ROLL / TABLE |
| Sample Rooms d4 × d6 plus conditional subtables | 73,74 | RESOLVED | 3 | Reference Desk > oracle:core.rooms > ROLL / TABLE |
| Arcane Catastrophes d20 including Cube-Violet d4 | 43,44,45 | RESOLVED | 3 | Reference Desk > oracle:core.arcaneCatastrophes |
| Repeated catastrophe: black-fire damage and water interaction | 43 | PARTIAL / P2 | 8 | Add the complete short global repeat rule to the catastrophe reference. |
| Palms Open the Southern Gate | 34 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Tongue of Eris | 34 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Te-le-kin-esis | 34 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Lucy-Fires Levitation | 34 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Daemon of Capillaries | 34 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Nine Violet Signs Unknot the Storm | 34 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Metzhuotl Blind Your Eye | 34 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Foul Psychompomp | 35 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Eyelid Blinds the Mind | 35 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Death | 35 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Grace of a Dead Saint | 35 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Grace for a Sinner | 35 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Whispers Pass the Gate | 35 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Aegis of Sorrow | 35 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Unmet Fate | 35 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Bestial Speech | 35 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| False Dawn/Night’s Chariot | 35 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Hermetic Step | 35 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Roskoe’s Consuming Glare | 35 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Enochian Syntax | 35 | PARTIAL / P1 | 20 | Render existing effect in result/TABLE and index an OPEN action for this canonical Power entry; preserve all target, duration, range and dice terms. |
| Fanged Deserter — full class reference | 46,47 | PARTIAL / P2 | 12 | Add a read-only Class reference using existing playerRules, creation dice and canonical feature tables; allow lookup without creating a character. |
| Fanged Deserter background options | 46 | RESOLVED | 3 | Reference Desk > oracle:core.fangedDeserterMemories |
| Crumpled Monster Mask | 47 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| The Brown Scimitar of Galgenbeck | 47 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Wizard Teeth | 47 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Old Sigûrd’s Sling | 47 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Ancient Gore-Hound | 47 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| The Shoe of Death’s Horse | 47 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Gutterborn Scum — full class reference | 48,49 | PARTIAL / P2 | 12 | Add a read-only Class reference using existing playerRules, creation dice and canonical feature tables; allow lookup without creating a character. |
| Gutterborn Scum background options | 48 | RESOLVED | 3 | Reference Desk > oracle:core.gutterbornScumBirth |
| Coward’s Jab | 49 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Filthy Fingersmith | 49 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Abominable Gob Lobber | 49 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Escaping Fate | 49 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Excretal Stealth | 49 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Dodging Death | 49 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Esoteric Hermit — full class reference | 50,51 | PARTIAL / P2 | 12 | Add a read-only Class reference using existing playerRules, creation dice and canonical feature tables; allow lookup without creating a character. |
| Esoteric Hermit background options | 50 | RESOLVED | 3 | Reference Desk > oracle:core.esotericHermitOrigins |
| Master of Fate | 51 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Book of Boiling Blood | 51 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Speaker of Truths | 51 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Initiate of the Invisible College | 51 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Bard of the Undying | 51 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Hawk as Weapon | 51 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Wretched Royalty — full class reference | 52,53 | PARTIAL / P2 | 12 | Add a read-only Class reference using existing playerRules, creation dice and canonical feature tables; allow lookup without creating a character. |
| Wretched Royalty background options | 52 | RESOLVED | 3 | Reference Desk > oracle:core.wretchedRoyaltyDownfall |
| The Blade of Your Ancestors | 53 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Poltroon the Court Jester | 53 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Barbarister the Incredible Horse | 53 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Hamfund the Squire | 53 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| The Snake-Skin Gift | 53 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Horn of the Schleswig Lords | 53 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Heretical Priest — full class reference | 54,55 | PARTIAL / P2 | 12 | Add a read-only Class reference using existing playerRules, creation dice and canonical feature tables; allow lookup without creating a character. |
| Heretical Priest background options | 54 | RESOLVED | 3 | Reference Desk > oracle:core.hereticalPriestOrigins |
| Sacred Shepherd’s Crook | 55 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Stolen Mitre | 55 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| List of Sins | 55 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| The Blasphemous Nechrubel Bible | 55 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Stones Taken from Thel-Emas’ Lost Temple | 55 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| (Wrong Jesus) Crucifix | 55 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Occult Herbmaster — full class reference | 56,57 | PARTIAL / P2 | 12 | Add a read-only Class reference using existing playerRules, creation dice and canonical feature tables; allow lookup without creating a character. |
| Occult Herbmaster background options | 56 | RESOLVED | 3 | Reference Desk > oracle:core.occultHerbmasterOrigins |
| Red Poison decoction | 57 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Ezumiels Vapor | 57 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Southern Frog Stew | 57 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Elixir Vitalis | 57 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Spider-Owl Soup | 57 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Fernor’s Philtre | 57 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Hyphos’ Enervating Snuff | 57 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Black Poison decoction | 57 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the named entry and open it directly; retain the complete existing effect and link any cited canonical creature/Power table. |
| Ash-grey ring | 3 | PRESENT_BUT_INDIRECT / P2 | 6 | Index this existing row for direct named lookup; no new content or generator. |
| Vile flute / meat golem | 3 | PRESENT_BUT_INDIRECT / P2 | 6 | Index this existing row for direct named lookup; no new content or generator. |
| Famine Spoon | 3 | PRESENT_BUT_INDIRECT / P2 | 6 | Index this existing row for direct named lookup; no new content or generator. |
| Malevolently accurate mirror | 3 | PRESENT_BUT_INDIRECT / P2 | 6 | Index this existing row for direct named lookup; no new content or generator. |
| Vampiric phurba | 3 | PRESENT_BUT_INDIRECT / P2 | 6 | Index this existing row for direct named lookup; no new content or generator. |
| Black pearl | 3 | PRESENT_BUT_INDIRECT / P2 | 6 | Index this existing row for direct named lookup; no new content or generator. |
| Immortal-hour torch | 3 | PRESENT_BUT_INDIRECT / P2 | 6 | Index this existing row for direct named lookup; no new content or generator. |
| Silver bird cage | 3 | PRESENT_BUT_INDIRECT / P2 | 6 | Index this existing row for direct named lookup; no new content or generator. |
| Black Crown of the Crippled King | 3 | PRESENT_BUT_INDIRECT / P2 | 6 | Index this existing row for direct named lookup; no new content or generator. |
| Ancient blindfold | 3 | PRESENT_BUT_INDIRECT / P2 | 6 | Index this existing row for direct named lookup; no new content or generator. |
| Backpack — purchase/use reference | 24 | PARTIAL / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Bear trap — purchase/use reference | 24 | PARTIAL / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Blanket — purchase/use reference | 24 | MISSING / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Caltrops — purchase/use reference | 24 | MISSING / P2 | 16 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Chalk — purchase/use reference | 24 | MISSING / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Chewing tobacco — purchase/use reference | 24 | MISSING / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Crowbar — purchase/use reference | 24 | PARTIAL / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Crucifix, silver — purchase/use reference | 24 | PARTIAL / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Crucifix, wood — purchase/use reference | 24 | MISSING / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Dried food — purchase/use reference | 24 | PARTIAL / P2 | 16 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Exquisite perfume — purchase/use reference | 24 | PRESENT_BUT_INDIRECT / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Firesteel — purchase/use reference | 24 | MISSING / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Grappling hook — purchase/use reference | 24 | PARTIAL / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Hammer — purchase/use reference | 24 | MISSING / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Heavy chain — purchase/use reference | 24 | PARTIAL / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Iron nails — purchase/use reference | 24 | PARTIAL / P2 | 8 | Add a static source-backed equipment entry (price, quantity and effect); index name. Preserve edition-specific conflicting values. |
| Ladder — purchase/use reference | 24 | MISSING / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Lantern oil — purchase/use reference | 24 | PARTIAL / P2 | 16 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Lard — purchase/use reference | 24 | PARTIAL / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Large iron hook — purchase/use reference | 24 | MISSING / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Lockpicks — purchase/use reference | 24 | PARTIAL / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Magnesium strip — purchase/use reference | 24 | PARTIAL / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Manacles — purchase/use reference | 24 | MISSING / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Mattress — purchase/use reference | 24 | MISSING / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Meat cleaver — purchase/use reference | 24 | MISSING / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Medicine box — purchase/use reference | 24 | PARTIAL / P2 | 16 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Metal file — purchase/use reference | 24 | PARTIAL / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Mirror — purchase/use reference | 24 | MISSING / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Muzzle — purchase/use reference | 24 | MISSING / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Noose — purchase/use reference | 24 | MISSING / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Oil lamp — purchase/use reference | 25 | PARTIAL / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Poison (black) — purchase/use reference | 25 | PARTIAL / P2 | 16 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Poison (red) — purchase/use reference | 25 | PARTIAL / P2 | 16 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Preserved corpse — purchase/use reference | 25 | MISSING / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Rope — purchase/use reference | 25 | PARTIAL / P2 | 16 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Small wagon — purchase/use reference | 25 | PARTIAL / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Tent — purchase/use reference | 25 | PARTIAL / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Toolbox — purchase/use reference | 25 | PARTIAL / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Torch — purchase/use reference | 25 | PARTIAL / P2 | 16 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Sack — purchase/use reference | 25 | PARTIAL / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Salt — purchase/use reference | 25 | MISSING / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Scissors — purchase/use reference | 25 | MISSING / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Scroll resale value — purchase/use reference | 25 | MISSING / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Sharp needle — purchase/use reference | 25 | PARTIAL / P2 | 8 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Waterskin — purchase/use reference | 25 | PARTIAL / P2 | 16 | Expose the printed catalog entry as static item lookup; reuse matching starting-item data without treating starting roll quantities as shop stock. |
| Battle axe — damage and price | 26 | MISSING / P2 | 16 | Add the printed weapon catalog entry; expose existing damage metadata in the reference result and index the item. |
| Bow — damage and price | 23,26 | PARTIAL / P1 | 16 | Add the printed weapon catalog entry; expose existing damage metadata in the reference result and index the item. |
| Club — damage and price | 26 | MISSING / P2 | 16 | Add the printed weapon catalog entry; expose existing damage metadata in the reference result and index the item. |
| Crossbow — damage and price | 23,26 | PARTIAL / P1 | 16 | Add the printed weapon catalog entry; expose existing damage metadata in the reference result and index the item. |
| Flail — damage and price | 23,26 | PARTIAL / P1 | 16 | Add the printed weapon catalog entry; expose existing damage metadata in the reference result and index the item. |
| Femur — damage and price | 23,26 | PARTIAL / P1 | 16 | Add the printed weapon catalog entry; expose existing damage metadata in the reference result and index the item. |
| Handaxe — damage and price | 26 | MISSING / P2 | 16 | Add the printed weapon catalog entry; expose existing damage metadata in the reference result and index the item. |
| Knife — damage and price | 23,26 | PARTIAL / P1 | 16 | Add the printed weapon catalog entry; expose existing damage metadata in the reference result and index the item. |
| Mace — damage and price | 26 | MISSING / P2 | 16 | Add the printed weapon catalog entry; expose existing damage metadata in the reference result and index the item. |
| Shortbow — damage and price | 26 | MISSING / P2 | 16 | Add the printed weapon catalog entry; expose existing damage metadata in the reference result and index the item. |
| Shortsword — damage and price | 23,26 | PARTIAL / P1 | 16 | Add the printed weapon catalog entry; expose existing damage metadata in the reference result and index the item. |
| Sling — damage and price | 26 | MISSING / P2 | 16 | Add the printed weapon catalog entry; expose existing damage metadata in the reference result and index the item. |
| Staff — damage and price | 23,26 | PARTIAL / P1 | 16 | Add the printed weapon catalog entry; expose existing damage metadata in the reference result and index the item. |
| Sword — damage and price | 23,26 | PARTIAL / P1 | 16 | Add the printed weapon catalog entry; expose existing damage metadata in the reference result and index the item. |
| Warhammer — damage and price | 23,26 | PARTIAL / P1 | 16 | Add the printed weapon catalog entry; expose existing damage metadata in the reference result and index the item. |
| Whip — damage and price | 26 | MISSING / P2 | 16 | Add the printed weapon catalog entry; expose existing damage metadata in the reference result and index the item. |
| Zweihänder — damage and price | 23,26 | PARTIAL / P1 | 16 | Add the printed weapon catalog entry; expose existing damage metadata in the reference result and index the item. |
| 20 arrows — purchase price | 26 | MISSING / P2 | 8 | Add the printed stock/price row with searchable name. |
| 10 bolts — purchase price | 26 | MISSING / P2 | 8 | Add the printed stock/price row with searchable name. |
| Dog (trained) — purchase price | 26 | MISSING / P2 | 8 | Add the printed stock/price row with searchable name. |
| Dog (wild) — purchase price | 26 | MISSING / P2 | 8 | Add the printed stock/price row with searchable name. |
| Horse — purchase price | 26 | MISSING / P2 | 8 | Add the printed stock/price row with searchable name. |
| Mule — purchase price | 26 | MISSING / P2 | 8 | Add the printed stock/price row with searchable name. |
| Rat (tame) — purchase price | 26 | MISSING / P2 | 8 | Add the printed stock/price row with searchable name. |
| Night in hospice | 25 | MISSING / P2 | 12 | Add this row to a compact static Core services/repair lookup, with original maximum-repair restriction. |
| Drink | 25 | MISSING / P2 | 12 | Add this row to a compact static Core services/repair lookup, with original maximum-repair restriction. |
| Steady meal | 25 | MISSING / P2 | 12 | Add this row to a compact static Core services/repair lookup, with original maximum-repair restriction. |
| Bribe: guard | 25 | MISSING / P2 | 12 | Add this row to a compact static Core services/repair lookup, with original maximum-repair restriction. |
| Bribe: clerk | 25 | MISSING / P2 | 12 | Add this row to a compact static Core services/repair lookup, with original maximum-repair restriction. |
| Bribe: rabble | 25 | MISSING / P2 | 12 | Add this row to a compact static Core services/repair lookup, with original maximum-repair restriction. |
| Armor repair tier 1 to 2 | 25 | MISSING / P2 | 12 | Add this row to a compact static Core services/repair lookup, with original maximum-repair restriction. |
| Armor repair tier 2 to 3 | 25 | MISSING / P2 | 12 | Add this row to a compact static Core services/repair lookup, with original maximum-repair restriction. |
| Improvised weapons d4; unarmed d2 | 23,25 | PARTIAL / P2 | 16 | Add the two source damage lines to Combat/Weapons lookup. |
| Goblin — stat block and special rules | 58 | RESOLVED | 4 | Reference Desk > creature:core:58:seth > OPEN |
| Goblin — captured/dead/body-part value | 58 | PRESENT_BUT_INDIRECT / P2 | 8 | Expose quiet valuation disclosure on the existing Reference creature result without requiring a saved monster. |
| Scum — stat block and special rules | 58 | RESOLVED | 4 | Reference Desk > creature:core:58:bent > OPEN |
| Scum — captured/dead/body-part value | 58 | PRESENT_BUT_INDIRECT / P2 | 8 | Expose quiet valuation disclosure on the existing Reference creature result without requiring a saved monster. |
| Berserker — stat block and special rules | 59 | RESOLVED | 4 | Reference Desk > creature:core:59:zukuma > OPEN |
| Berserker — captured/dead/body-part value | 59 | PRESENT_BUT_INDIRECT / P2 | 8 | Expose quiet valuation disclosure on the existing Reference creature result without requiring a saved monster. |
| Wraith — stat block and special rules | 59 | RESOLVED | 4 | Reference Desk > creature:core:59:wrat > OPEN |
| Wraith — captured/dead/body-part value | 59 | PRESENT_BUT_INDIRECT / P2 | 8 | Expose quiet valuation disclosure on the existing Reference creature result without requiring a saved monster. |
| Blood-drenched skeleton — stat block and special rules | 60 | RESOLVED | 4 | Reference Desk > creature:core:60:belze > OPEN |
| Blood-drenched skeleton — captured/dead/body-part value | 60 | PRESENT_BUT_INDIRECT / P2 | 8 | Expose quiet valuation disclosure on the existing Reference creature result without requiring a saved monster. |
| Undead (weak) necromancer — stat block and special rules | 60 | RESOLVED | 4 | Reference Desk > creature:core:60:lich > OPEN |
| Undead (weak) necromancer — captured/dead/body-part value | 60 | PRESENT_BUT_INDIRECT / P2 | 8 | Expose quiet valuation disclosure on the existing Reference creature result without requiring a saved monster. |
| Troll — stat block and special rules | 60 | RESOLVED | 4 | Reference Desk > creature:core:60:arbint > OPEN |
| Troll — captured/dead/body-part value | 60 | PRESENT_BUT_INDIRECT / P2 | 8 | Expose quiet valuation disclosure on the existing Reference creature result without requiring a saved monster. |
| Zombie — stat block and special rules | 61 | RESOLVED | 4 | Reference Desk > creature:core:61:nodh > OPEN |
| Zombie — captured/dead/body-part value | 61 | PRESENT_BUT_INDIRECT / P2 | 8 | Expose quiet valuation disclosure on the existing Reference creature result without requiring a saved monster. |
| Undead doll — stat block and special rules | 61 | RESOLVED | 4 | Reference Desk > creature:core:61:lady-porcelain > OPEN |
| Undead doll — captured/dead/body-part value | 61 | PRESENT_BUT_INDIRECT / P2 | 8 | Expose quiet valuation disclosure on the existing Reference creature result without requiring a saved monster. |
| Grotesque — stat block and special rules | 62 | RESOLVED | 4 | Reference Desk > creature:core:62:thinx > OPEN |
| Grotesque — captured/dead/body-part value | 62 | PRESENT_BUT_INDIRECT / P2 | 8 | Expose quiet valuation disclosure on the existing Reference creature result without requiring a saved monster. |
| Wickhead knife-wielder — stat block and special rules | 62 | RESOLVED | 4 | Reference Desk > creature:core:62:aland > OPEN |
| Wickhead knife-wielder — captured/dead/body-part value | 62 | PRESENT_BUT_INDIRECT / P2 | 8 | Expose quiet valuation disclosure on the existing Reference creature result without requiring a saved monster. |
| Wyvern — stat block and special rules | 62 | RESOLVED | 4 | Reference Desk > creature:core:62:eulotha > OPEN |
| Wyvern — captured/dead/body-part value | 62 | PRESENT_BUT_INDIRECT / P2 | 8 | Expose quiet valuation disclosure on the existing Reference creature result without requiring a saved monster. |
| Outcast recruitment, loyalty and Presence modifier | 63 | MISSING / P2 | 12 | Add the short source follower rule and link it from Outcast results. |
| Earthbound — stat block, trait, specialty and values | 64 | RESOLVED | 3 | Reference Desk > creature:core:core.outcast.earthbound > OPEN |
| Wild Wickhead — stat block, trait, specialty and values | 65 | PARTIAL / P2 | 12 | Index existing Wild Wickhead Outcast record as a static creature/NPC reference. |
| Pale one — stat block, trait, specialty and values | 66 | RESOLVED | 3 | Reference Desk > creature:core:core.outcast.pale-one > OPEN |
| Prowler — stat block, trait, specialty and values | 67 | RESOLVED | 3 | Reference Desk > creature:core:core.outcast.prowler > OPEN |
| World history, basilisk theology and regional lore | 9,10,11,12,13,14,15,16 | PDF_APPROPRIATE | — | Keep PDF page route available; do not recreate full artwork/lore. |
| Drawing/finding a dungeon map | 71 | PDF_APPROPRIATE | — | Keep PDF page route available; do not recreate full artwork/lore. |
| Printed Core quick-reference sheet | 76 | PDF_APPROPRIATE | — | Keep PDF page route available; do not recreate full artwork/lore. |
| Bomb — starting effect | 22 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the canonical item entry; retain source dice and any chosen quantity separately. |
| Life elixir — starting effect | 22 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the canonical item entry; retain source dice and any chosen quantity separately. |
| Small vicious dog — starting effect | 22 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the canonical item entry; retain source dice and any chosen quantity separately. |
| Monkeys — starting effect | 22 | PRESENT_BUT_INDIRECT / P2 | 9 | Index the canonical item entry; retain source dice and any chosen quantity separately. |
| Light armor — purchase price and effect | 23 | PARTIAL / P2 | 12 | Expose source armor/shield prices with the existing usable protection summary; index individual item names. |
| Medium armor — purchase price and effect | 23 | PARTIAL / P2 | 12 | Expose source armor/shield prices with the existing usable protection summary; index individual item names. |
| Heavy armor — purchase price and effect | 23 | PARTIAL / P2 | 12 | Expose source armor/shield prices with the existing usable protection summary; index individual item names. |
| Shield — purchase price and effect | 23 | PARTIAL / P2 | 12 | Expose source armor/shield prices with the existing usable protection summary; index individual item names. |

## Audit boundaries

No production corrections were performed. A RESOLVED row does not imply every English/Korean alias ranks well, that the app automates all player choices, or that a source table should become a generator. It means the identified source mechanics are usable through the cited existing route. Source text formatting oddities are not rewritten. Existing campaigns and manual edits were not touched. No deployment is claimed.
