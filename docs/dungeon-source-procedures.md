# Dungeon procedure source audit

Verified 2026-09-05 against the supplied **Solitary Defilement Rules.pdf** (SD), **Solitary Depths Compressed.pdf** (DEP), **Mörk_Borg_English.pdf** (MB-F), and the installed canonical rules registry. PDF page numbers below are one-based physical pages; printed pages are separately identified. These notes summarize the sources without replacing their complete rules.

## Preparation and exploration are separate

SD printed pp. 7, 17 / PDF pp. 9, 19 defines four prepared **Special Rooms**, plus generic rooms encountered during exploration. The four prepared rooms begin undiscovered. The fourth discovery marks the dungeon climax; preparation must not count as discovery.

For each new room, roll two d20, adding the number of Special Rooms already discovered to each die, against the dungeon's DR:

| Outcome | Resolution                                                                                                                                 |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Strong  | Enter the next prepared Special Room. After four discoveries, treat Strong as Weak.                                                        |
| Weak    | Enter a generic room using SD Room Descriptors.                                                                                            |
| Fail    | Resolve a danger while leaving the current location, then generate a generic room. Do not reroll Crawl to resolve this pending transition. |

SD printed p. 17 / PDF p. 19 also prepares two dungeon encounter tables: six Common and six Rare entries, selected by d6 during play. Their preparation and subsequent selection are different operations.

An entrance → crawl → outcome resolution → room resolution → next-room prompt is an application workflow implementing this order. The prompt itself is interface design, not quoted source text. An unresolved transition must survive reload without secretly rerolling or advancing.

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

The official [DNGNGEN](https://dngngen.makedatanotlore.dev/) implementation was inspected through its public JavaScript and [source map](https://dngngen.makedatanotlore.dev/static/js/main.76dfbfd0.chunk.js.map). Its room generator creates four rooms with two curated details each: A+B, A+C, B+D, then A/B+C/D. Results used in other rooms are excluded when selecting details.

The original independently generates dungeon name and other features. It does not weight room details by region or dungeon name. Four distinct anchors with meaningful canonical details are source-supported inspiration; interpreting those details through this application's saved name, region, inhabitants and imminent danger is application-authored connective material and must be identified accordingly. Do not attribute invented statistics or connective prose to the PDFs or DNGNGEN.
