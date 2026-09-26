# Play guidance and follow-through

Baseline: `6ef5b7331d375f7b582206053ff2a11e893a5284`. No canonical data, stored campaign, or migration changes.

## What changed

- Journey now offers Move / Leave the road / Forage / Camp, in the same action area used by Dungeon and City. These open existing References without rolling. Source-specific instructions and next-reference links accompany the resulting readings, including in Workbench.
- The bottom-right **판정 안내** separates action success, unknown facts and descriptive detail. Core and SD are alternatives for a general action, not successive tests. Existing dedicated actions take precedence. Facts route to SD Yes/No or the existing Mythic Fate tool; descriptive prompts route to actual room/street/terrain references.
- **조건별 규칙** has 19 condition summaries across Powers, Rest, Infection, Hunger and Carrying. Relevant Core reference pages show this concise panel first, with full source text still available. Restrictions, source variants and exceptions remain explicit.
- 21 exact source rows expose 38 conditional follow-through items: additional tests, quantity dice, next-day effects or a fixed source excerpt. Both app and physical dice are supported. No HP, food, Omens, travel days, combat state or notes are changed by these controls.
- Input and the current helper result survive navigation in this document, using the existing ephemeral tool cache. There is no new campaign history or persistent journal.

## Exact Journey routes

| Action | Existing reference | Source-specific continuation |
|---|---|---|
| Move | `rule:sd.travel-day` | `rule:sd.daily-misery`, `oracle:core.weather`, `oracle:feretory.roadType`, `oracle:feretory.roadEvent`, then SD Camping |
| Leave the road | `rule:sd.leaving-road` | Only animal tracks and roads in disrepair use 1d20 + Presence/Omens DR10. On failure, `oracle:feretory.leaveRoad`. Intentional/already-completed departure goes directly to that table. |
| Forage | `rule:sd.resupply` | `oracle:feretory.forage`; 5–6 continues to `oracle:feretory.village`. No generic action test is added before Foraging. |
| Camp | `rule:sd.camping-move` | Existing breath/camp roller and failed-rest retry. Core rest restrictions remain accessible; FERETORY campsite events are an optional content reference, not a second recovery test. |

After camping, SD removes a travel day except a foraging day; FER road event 4 explicitly means no progress. After all days are crossed out, arrival happens during the following day. The user applies these facts in their notebook. No progression gates.

## Evidence and audited gaps

Original supplied PDFs were read on 2026-09-27; the SD flowchart and FER foraging page were also rendered and visually inspected. Source pages are one-based PDF pages, with printed folios shown separately. Private page renders and extraction stay outside Git.

| Source | Exact evidence used |
|---|---|
| Sölitary Defilement PDF 7 / print 5 | General Adventuring Move uses two independent d20s; Weak succeeds with a complication. |
| SD PDF 8 / print 6 | Resupply uses FER Foraging while travelling; camping DR9/12, recovery, food, Omens/Powers and the post-encounter 50:50 retry. Searching Strong 1 and 4 offer alternatives; Weak 2 and 3 explicitly name Corpse Plunder and Trinkets. |
| SD PDF 17 / print 15 | Dawn → weather → travel or resupply → encounter → camping. Animal-track/broken-road navigation uses **one** d20, DR10. Off-road encounter counts as travel. |
| FERETORY PDF 7 / print 5 | Road event 4 no progress; 7–8 reroll; 9 spoiled quantity; 14 slavers/captives; 15 guards; 18 zombies. |
| FERETORY PDF 8 / print 6 | Forage 2: d6+1 and Presence DR12 to notice spoilage, illness six hours after consumption. 3: d6+3. 4: d8+2 only after killing the beast, Eat Prey Kill alternative. Village 1: d6 scavenged; 2: each ration has a 2-in-6 taint chance. |
| FERETORY PDF 9 / print 7 | Campsite 6 highest Presence DR12 plus d4 stolen food; 8 Presence DR14 and d3 affected PCs; 9 next-day Omens −1; 10 each PC's d6−3 separately from the dream subtable; 12 d4+2 peddlers. Event 7 requires tomorrow's first random encounter now but names no specific table. Leaving Road 8 explicitly has an occult artifact hidden in the crypt. |
| Alöne in the Crowd PDF 13 / print 11 | Tavern 1–2 use **Toughness 2d20 DR10**, distinct outcomes. Tavern 3 gives d4 NPCs, conditional Reaction +2 and its own gambling rules. Inn 4 inherits Tavern 3, costs d8+3s and reduces the rest DR to **8**. |
| MÖRK BORG Full Edition PDF 28 / print 24, PDF 59 / print 55 | Scroll equipment restrictions; Heretical Priest medium-armor exception. |
| Core Full PDF 31 / print 27 | Strength+8 normal items, Strength/Agility DR+2 when over capacity, twice-capacity ceiling. No invented conversion for large items. |
| Core Full PDF 35 / print 31; PDF 38 / print 34 | Rest, lack of food/drink, starvation after two days, infection, Powers uses/checks/failure/dizziness and optional catastrophe table. Existing Bare Bones citations remain in the reader. |

Nine missing exact row-to-reference links were added as read-time projections in `resultRelationships.ts`, never by editing canonical rows. A tenth policy annotates the already-existing Tavern Reaction link with its approach-only/+2 condition. Source choices stay AVAILABLE; explicitly required Weak Searching follow-ups stay REQUIRED. Existing SUBTABLE, LOOKUP, USES/USED BY, source attribution and completed-subtable handling remain intact.

The Inn's inherited Tavern row opens **inline through the existing fixed-reading and text primitives**. This is deliberate: the older same-reference navigation path would overwrite the held Inn result. The inline excerpt preserves that result and its helper inputs, uses no random dice and exposes Tavern's own follow-through controls.

## Deliberate boundaries

- FER campsite 7 does not gain a guessed “correct” encounter table. It reminds the player to use their current encounter source and retain that result for tomorrow.
- Forage 2 says sickness, but supplies no damage amount or automatic Core infection conversion. The helper preserves that gap.
- Recognizing a thief does not automatically prevent theft; discovering a village does not purchase supplies; killing a beast is a user-established condition.
- No Threat Rating, special-dungeon content, or campaign bookkeeping was reintroduced.
- Only the documented rows were mechanically audited in this pass. Other books' conditional outcomes retain their existing links; this report does not claim every row in every book is fully automated.
- The generic pre-existing fixed-lookup route was not changed; the newly added inherited-row helper keeps its parent safe by staying inline.

## Verification

Baseline: 1,122 tests passed. Final: **1,139 passed, 0 failed, 0 skipped**. Client/server TypeScript, Vite build, lint and public/private build boundaries passed. The pre-existing large-chunk warning remains. `tests/play-guidance.test.ts` adds 17 focused checks. The pre-existing “wilderness has no actions” assertion now verifies the four requested actions and absence of progression gates.

Registry invariants before/after:

| Dataset | Tables | Procedures | References | Rows |
|---|---:|---:|---:|---:|
| Supplied archive | 546 | 60 | 993 | 12,310 |
| Distributed data | 545 | 60 | 987 | 12,305 |

`check-play-guidance-browser.mjs` exercises 360 / 768 / 1440 / 3440 px, with touch at 360. It checks question selection via keyboard, Mythic-tool opening, manual/app rolls and invalid input, conditional rest restrictions, actual Journey travel/forage/camp navigation, Inn DR8 and inherited Tavern lookup, Back retention, Search equivalence, Recent, Pins, Workbench, focus restoration, zero horizontal overflow and zero page errors. The notebook-owned campaign storage sentinel remains byte-for-byte unchanged.

Representative captures: [guide desktop](question-1440.png), [guide mobile](question-360.png), [foraging desktop](foraging-1440.png), [foraging mobile](foraging-360.png). Machine-readable browser results are in [acceptance.json](acceptance.json).
