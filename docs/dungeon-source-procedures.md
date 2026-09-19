# Dungeon procedure source audit

Verified 2026-09-05 against the supplied **Solitary Defilement Rules.pdf** (SD), **Solitary Depths Compressed.pdf** (DEP), **Mörk_Borg_English.pdf** (MB-F), and the installed canonical rules registry. PDF page numbers below are one-based physical pages; printed pages are separately identified. These notes summarize the sources without replacing their complete rules.

Rechecked 2026-09-20 for the functional pass. The supplied SD PDF was reopened directly (SHA-256 `c0ddd13cd79fa975e4a2e1bf0284924b28e033408feb55853d3b06f40126722e`). The active desk presents these procedures as independent references; descriptions of source play order below are not interface prerequisites or saved progression.

## Preparation and exploration are separate

SD printed pp. 7, 17 / PDF pp. 9, 19 defines four prepared **Special Rooms**, plus generic rooms encountered during exploration. The four prepared rooms begin undiscovered. The fourth discovery marks the dungeon climax; preparation must not count as discovery.

For each new room, roll two d20, adding the number of Special Rooms already discovered to each die, against the dungeon's DR:

| Outcome | Resolution                                                                                                                                 |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Strong  | Enter the next prepared Special Room. After four discoveries, treat Strong as Weak.                                                        |
| Weak    | Enter a generic room using SD Room Descriptors.                                                                                            |
| Fail    | Resolve a danger while leaving the current location, then generate a generic room. Do not reroll Crawl to resolve this pending transition. |

SD printed p. 17 / PDF p. 19 also prepares two dungeon encounter tables: six Common and six Rare entries, selected by d6 during play. Their preparation and subsequent selection are different operations.

The earlier application's entrance → crawl → outcome resolution → next-room prompt was interface policy, not quoted source text. That runner is no longer the Reference Desk model. A reader may inspect or roll any reference directly, supplying the discovered-room count when relevant. The desk does not create, resolve or advance an exploration state.

## Canonical references and page mapping

Oracle IDs below receive `oracle:` in the reference registry; rule IDs receive `rule:`.

| Block                     | Canonical IDs                                                            | Printed / PDF page                                                   |
| ------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Dungeon procedure         | `sd.dungeonCrawling` (rule)                                              | SD 7, 17 / 9, 19                                                     |
| Room descriptions         | `sd.room.adjective`, `sd.room.type`, `sd.room.contents`, `sd.room.exits` | SD 13 / 15                                                           |
| Flee                      | `sd.flee-combat` (rule)                                                  | SD 6 / 8                                                             |
| Search                    | `sd.search-move` (rule), `sd.search.strong`, `sd.search.weak`            | SD 6 / 8                                                             |
| Breath and camping        | `sd.camping-move` (rule)                                                 | SD 6 / 8                                                             |
| Resupply                  | `sd.resupply` (rule), `feretory.forage` (travel branch)                  | SD 6 / 8                                                             |
| Threat Rating             | `depths.threat-rating` (rule)                                            | DEP 6 / 9                                                            |
| Enemy detection           | `depths.enemy-detection` (rule)                                          | DEP 7 / 10                                                           |
| Locked doors              | `depths.locked-doors` (rule)                                             | DEP 7 / 10                                                           |
| Ambiguous Weak            | `depths.weakHitConsequences`                                             | DEP 8 / 11                                                           |
| Reveal danger             | `depths.danger`                                                          | DEP 8 / 11                                                           |
| Time and noise            | `depths.time-noise` (rule)                                               | DEP 8 / 11                                                           |
| Trap detection/disarming  | `depths.traps` (rule)                                                    | DEP 9 / 12                                                           |
| Regular and special traps | `depths.traps.regular`, `depths.traps.special`                           | DEP 10 / 13                                                          |
| Sample room details       | `core.rooms`                                                             | MB-BB 73–74 / 73–74; corresponding full-edition table at MB-F PDF 93 |

Do not relabel the canonical Bare Bones citation as a full-edition page. DEP p. 7 covers enemies and obstructions, not camping. Its trap procedure starts on p. 9; the actual trap result tables are on p. 10.

## Context-sensitive rules

- **Dungeon DR and Threat Rating are independent.** Dungeon DR affects how often Special Rooms appear. DEP TR describes enemy/trap difficulty: 9/12/15, with overland TR12.
- **Crawl Weak is already defined:** create a generic room. DEP Weak Hit Consequences is for an unclear Weak outcome; it is not an extra mandatory penalty every time Crawl produces Weak.
- **Time/noise:** ordinary activity checks a 1-in-6 danger chance, excessive activity 2-in-6. Roll Reveal a Danger only when triggered. Examples include backtracking, resting, prolonged combat and smashing doors.
- **Flee:** two d20 + Agility against DR11 + enemy count. Weak escapes after defending an opportunity attack; Fail defends but stays in combat.
- **Search:** two d20 + current Omens against DR12. Strong and Weak use their respective d4 table; Fail finds nothing and exposes danger. Where a result offers alternative treasure tables, preserve the player's choice.
- **Rest:** Presence DR9 for a breath, DR12 for camping. Strong heals d4/d6, Weak d2/d4. Sleeping spends one ration. Strong rerolls Omens/restores Powers; Weak restores one of each with disturbed rest. Fail creates trouble without sleep; after resolving it, the next rest is an equal Strong/Weak chance.
- **Resupply:** travelling uses FER Foraging. Otherwise, use the General Adventuring Move to seek prey, food or water. The source does not prescribe one universal ability or DR for that branch.
- **Enemy detection:** Agility TR, −3 if preoccupied and unalerted, +3 if alerted. Strong/Weak permit retreat. Sneaking requires a hit on Presence TR−3/TR; fighting gives initiative/rolls initiative. Failure calls for reaction, with combat if hostile and Chaos Portents to interpret other intentions.
- **Doors:** appropriate ability against TR; lockpicks reduce difficulty by 3 but break on Weak/Fail. Strong proceeds, Weak proceeds plus danger, Fail stays blocked plus danger. Reroll a door/obstruction result in this danger check.
- **Traps:** detect with Presence TR. Strong identifies the type and permits retreat when possible. Weak identifies hidden danger; a second Presence TR hit disarms/avoids it. Detection failure selects the trap and calls for its specified ability test: Strong avoids consequences; Weak/Fail applies the matching trap result.

The room-exit oracle requires the discovered Special Room count. Its canonical metadata already contains the visually verified matrix:

| d4  | 0 discovered |   1 |   2 |   3 |   4 |
| --- | -----------: | --: | --: | --: | --: |
| 1   |            1 |   1 |   1 |   1 |   1 |
| 2   |            2 |   2 |   2 |   2 |   0 |
| 3   |            2 |   2 |   0 |   0 |   0 |
| 4   |            3 |   0 |   0 |   0 |   0 |

Zero represents the printed dash: no further exit. Context-free execution must not collapse this matrix into four unconditional results.

## Oracle grouping

Keep related tables in one visible workbench while distinguishing a combined roll from a choice or conditional continuation:

- **Room:** adjective, type, contents, contextual exits. The existing `sd.room-description` pair covers only adjective/type.
- **Material:** quality + composition (`sd.material`). **Sound:** quality + type (`sd.sound`).
- **NPC description:** disposition + profession. An encounter roll and its reaction are separate operations.
- **Religious denomination:** order + adjective + domain, three d12.
- **Building:** material, size and form. Preserve the printed material-count instruction and the conditional Other → Materials reference.
- **Dungeon trouble:** unclear Weak, time/noise, danger, obstruction and trap tools belong together visually; they are branches, not an instruction to roll every table.

SD printed pp. 10–11 / PDF pp. 12–13 contains building, material, sound and odour oracles. These can enrich an entrance, but the source does not prescribe a single mandatory entrance recipe. Its prepared dungeon template separately includes entrance, guard and distinctive feature.

## DNGNGEN comparison

The official [DNGNGEN](https://dngngen.makedatanotlore.dev/) implementation was inspected through its public JavaScript and [source map](https://dngngen.makedatanotlore.dev/static/js/main.76dfbfd0.chunk.js.map). On 2026-09-20 the live HTML still served `main.76dfbfd0.chunk.js`; its source map was byte-identical to the previously inspected local copy (SHA-256 `b2805f31a42624d767c2fc5a7441b8bd271b1d7afbea05ea41e2f39f16f84d24`). Its room generator creates four rooms with two curated details each: A+B, A+C, B+D, then AB+CD, where AB and CD concatenate those two source pools. Results used in other rooms are excluded when selecting details.

Those pools contain A39/B39/C34/D34 entries, 146 total. They are **not** the Core book's 24 Sample Rooms cells. DNGNGEN additionally has separate pools for reasons (29), entrances (25), guards (25), dangers (22), inhabitants (29), distinctive features (20), and status (12 selectable positions, including repeated active-status entries). Variable values are generated within some selected entries. The original independently generates dungeon name and other features. It does not weight room details by region or dungeon name. Its feature reroll excludes the previous feature ID. These details describe DNGNGEN, not Core dice odds, and must not be imposed on the canonical Core tables.

SD printed p.7 / PDF9 explicitly allows DNGNGEN rooms **or Core Bedeviled Dungeons (full edition p.93)** as Special Rooms, and also allows the SD Room Descriptor alternative. Thus using one Core Sample Rooms result per slot is a valid choice among SD's alternatives; it is not a verbatim DNGNGEN reconstruction. Earlier notes that only mentioned SD's DNGNGEN suggestion omitted this explicit Core alternative. The specific decision to use Core by default remains an app choice, not a mandatory SD recipe.

## Reference-first preparation stat block

The new `domain/dungeonReferencePreparation.ts` helper reads existing canonical tables and produces the existing `ReferenceReading` structure. It has no campaign, region, migration, save, or exploration-state input. Opening the empty reading performs no roll. Its fields match SD printed p.17 / PDF19:

| SD field                     | Desk source or handling                                                                                              |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Dungeon name                 | Core's printed two d12 title columns, including its printed prefix; one atomic name action.                          |
| Status                       | Core d6 root table. Its conditional reason remains optional.                                                         |
| Imminent danger              | Core d10 root table. Its conditional flood result remains optional.                                                  |
| Who or what dwells here now? | Core inhabitants d12.                                                                                                |
| What brings you here?        | Always visible, handwritten. No installed source pool is falsely labelled as DNGNGEN's reasons.                      |
| Entrance                     | Existing RECLVSE d20, explicitly an app source choice rather than DNGNGEN's pool.                                    |
| Guarded by                   | Always visible, handwritten. No guard is inferred from inhabitants.                                                  |
| Distinctive feature          | Core d12.                                                                                                            |
| Special Room 1–4             | Four independent Core d4 × d6 selections. Repeats are valid. Each printed child table remains separately accessible. |

An explicit full-sheet roll prepares the ten rollable fields; it does not roll manual fields or follow conditional child tables. An explicit field reroll changes only that field and its provenance. A full reroll can preserve previously handwritten reason and guard text. Every generated roll keeps its canonical table ID, entry ID, original dice values, translation metadata, source pages, and optional child metadata. No DNGNGEN text pools or new canonical tables are copied into the application. The original DNGNGEN link remains available for readers who want that site's expanded generation.
