# Spatial Oracle registry audit

Audited baseline: `40201c331945b91f08e200c1227b6d8a67de860a`. This audit reads the actual registry constructors and locally installed source packs. Proposed spatial assignments are application navigation, not new source relationships. Source text, tables, odds and relationships must remain unchanged.

## Baseline data and architecture

| Loaded data | Reference entries | Oracle tables | Unique canonical table IDs | Source/shared procedures | Books |
| --- | ---: | ---: | ---: | ---: | ---: |
| Current `public/rules/library.json` + `public/rules/oracles.json` through their parsers | 987 | 545 | 545 | 60 | 9 |
| Archival `outputs/morkborg-private-data.json` through the same parsers | 993 | 546 | 546 | 60 | 9 |

The current runtime has 525 Oracle references, 71 procedure references, 280 rules, 95 creatures, 7 regions and 9 books; its tables contain 12,305 rows. Reference count is deliberately different from table count: paired tables share a Reference, and rules, creatures and procedures also have References. `byId` additionally contains aliases and must not be counted as independent references. The archive differs by `core.beasts` and its five purchase definitions (trained dog, wild dog, horse, mule, tame rat); this is a pre-existing pack difference, unrelated to spatial navigation.

Baseline SHA-256 values:

```text
public/rules/library.json fd5c1a6fb24aa95329c2121ab7bda9f45bb86fa353697ab0b297152ac4c3b131
public/rules/oracles.json c6d489ecfb341f0b9583bf041ca2d2091771bf3c949f078dcff4d0041c7713f6
outputs/morkborg-private-data.json edb000ad6a23ee13ccdb221732e770977cc6f375aca03621c8f0328441ba60c9
```

- `src/data/oracles/index.ts` builds the one Oracle registry from rule tables and the Oracle pack, applies source corrections/attestations, materializes nested source subtables once, and excludes scenario-only material. `src/domain/references.ts` projects that registry into the desk index, resolves paired/alias IDs, and attaches existing rule/procedure/creature/region definitions.
- Oracle execution is `rollOracle` / `rollProcedure` in `src/generators/oracleRoller.ts`, dispatched by the established Reference execution layer. Rolls retain the canonical table ID, row ID, dice, source references and provenance. `rollable: false` and unverified tables cannot roll. A scene should only request an existing reference to open; the reader continues to own execution.
- `ReferenceContext` is `room | monster | npc | dungeon | travel | city | character`. Some context labels are derived from table category/name heuristics, so they are useful browsing metadata rather than proof of semantic identity. For example, Corpse Plundering has room/dungeon contexts but its subject also makes a roadside corpse a valid discovery affordance. This does not justify changing its context metadata.
- `relatedIds`, source chains, canonical IDs, definition blocks and `nextReferenceIds` already exist. Do not add adjacency based on neighboring art. A road next to a camp does not establish a source-defined follow-up relationship.
- `src/domain/rowRelationships.ts` derives **FOLLOW-UP**, **SUBTABLE** and **LOOKUP** from explicit row metadata (`followUpReferenceIds`, `followUpOracleIds`, supported `followUp`, nested `subtable`, fixed selectors and audited creature IDs). These remain conditional row links. Current runtime metadata yields 204 FOLLOW-UP, 11 SUBTABLE, 9 LOOKUP and 54 unlabelled creature row edges; these are metadata occurrences, not globally deduplicated relationships.
- `src/domain/referenceRelationships.ts` creates **USES** / **USED BY** only from verified source procedure evidence plus the documented Core tables in Dungeon Preparation. Current runtime: 88 forward and 88 reverse pairs, from 149 evidence records. Related/canonical IDs are explicitly not dependency evidence.
- `ReferenceProvider` and `ReferenceDesk` in `ReferenceWorkbench.tsx` own selection, inspect/roll distinction, structured reader and result presentation. Use their `activate` route for map navigation. Pins and Recent persist existing reference IDs under `morkborg-reference-desk:v1` (30 pins, 10 recent references), including the existing old-Oracle-favorite migration. Session readings retain 20 inspected readings and six recent roll snapshots. `referenceLocation.ts` governs selection, search, trail and panel history; scene history should extend navigation without replacing those states or saved schemas.

## Journey references verified against the runtime

All Oracle targets below are source-verified and rollable. IDs beginning `oracle:` resolve to canonical table IDs with that prefix removed. Page numbers below are PDF / printed pages. These candidates were audited before illustration and all nine were selected for the scene model.

| Drawn feature / meaning | Exact Reference ID | Registry title | Canonical behavior | Source page |
| --- | --- | --- | --- | --- |
| Winding road / road condition | `oracle:feretory.roadType` | What’s the Road Like? | d8, 6 rows | Feretory 7 / 5 |
| Foraging patch at woodland edge | `oracle:feretory.forage` | Spending a Day Foraging | d6, 5 rows | Feretory 8 / 6 |
| Trail leaving the road | `oracle:feretory.leaveRoad` | Leaving the Road, After Half a Day’s Journey, You Encounter… | d12, 12 rows | Feretory 9 / 7 |
| Footprints and signs | `oracle:reclvse.signs_of_travelers` | Signs Of Travelers | d20, 20 rows | RECLVSE 110 / 110 |
| Campsite and fire | `oracle:feretory.campsite` | Nightly Campsite Events | d12, 8 rows | Feretory 9 / 7 |
| Cloud / weather | `oracle:core.weather` | Weather | d12, 12 rows | Core 4 / 4 |
| Distant village | `oracle:feretory.village` | The Village Is… | d6, 6 rows | Feretory 8 / 6 |
| Roadside remains / possessions | `oracle:core.corpsePlundering` | Corpse Plundering | d66, 26 rows | Core 4–5 / 4 |
| Milestone / travel distances | `rule:feretory.travel-distances` | Traveling the Dying Lands · Road travel times | Read-only definition of `feretory.travelDistances`; 11 reference rows, no random odds | Feretory 6 / 4 |

The Campsite source includes a genuine row SUBTABLE to `oracle:feretory.campsite.campDream`; this should continue to appear only through the existing reader/result links. The travel-distances definition already relates to `rule:sd.travel-day`, `rule:feretory.roads`, `rule:sd.daily-misery` and `oracle:feretory.travelDistances`. The map must not silently combine Feretory, Core and RECLVSE into a claimed single source procedure.

Other real candidates exist, including RECLVSE Travel Daily Loop, Make Camp, Hold Your Bearing, Weather Move, Night Encounter, regional feature/discovery tables, Geographical Features and the Eat Prey Kill references. Their availability is not a reason to crowd this plate or assign them to arbitrary landmarks.

## Dungeon references verified against the runtime

| Drawn feature / meaning | Exact Reference ID | Registry title | Canonical behavior | Source page |
| --- | --- | --- | --- | --- |
| Entrance at the outer boundary | `oracle:reclvse.dungeonEntrance` | Dungeon Entrance | d20, 20 rows | RECLVSE 87 / 87 |
| Masonry / structural fabric | `oracle:reclvse.architecture` | Architecture & Structure | d20, 20 rows | RECLVSE 91 / 91 |
| Locked door in the wall | `rule:depths.locked-doors` | Depths Locked Doors · 잠긴 문과 장애물 | Read-only procedural reminder; linked danger is not an automatic door roll | Depths 10 / 7 |
| Room interior / contents | `oracle:reclvse.contentsCategory` | Room Contents | d4, 4 rows | RECLVSE 92 / 92 |
| Furniture / room dressing | `oracle:reclvse.dressing` | Room Dressing | d20, 20 rows | RECLVSE 92 / 92 |
| Chest / discovered loot | `oracle:reclvse.roomLoot` | 10D. Loot | d20, 20 rows | RECLVSE 93 / 93 |
| Trap mechanism / broken floor | `oracle:core.traps` | Traps and Devilry | d12, 12 rows | Core 4 / 4 |
| Passage continuing out of room | `rule:reclvse.passage` | Navigate the Passage | Read-only move definition in `reclvse.playReferences` | RECLVSE 68 / 68 |
| Wall light / visibility | `oracle:reclvse.light` | Light & Visibility | d12, 12 rows | RECLVSE 91 / 91 |
| Corpse / possessions | `oracle:core.corpsePlundering` | Corpse Plundering | d66, 26 rows | Core 4–5 / 4 |
| Peripheral hearing pictogram | `oracle:reclvse.sounds` | Room Sounds | d20, 20 rows | RECLVSE 92 / 92 |

Room Contents has four genuine SUBTABLE links: `oracle:reclvse.roomDiscovery`, `oracle:reclvse.roomHazard`, `oracle:reclvse.roomEncounter`, `oracle:reclvse.roomLoot`. Keep them in their original rows/results. The locked-door reference already relates to `oracle:depths.danger`, whose particular rows carry FOLLOW-UP links to `rule:sd.stockCommon` and `rule:sd.npc`; none is an automatic consequence of clicking the door. Passage already relates to RECLVSE Resolution, Search the Room, Face the Trap and Room Encounter. No scene-specific edges are needed.

Additional real candidates, intentionally left for composition choices: `oracle:reclvse.roomShape`, `oracle:reclvse.quickSizeShape`, `oracle:reclvse.exitType`, `oracle:reclvse.exitsNumber`, `oracle:reclvse.smells`, `oracle:sd.sound.quality` (the canonical sound pair), `oracle:sd.room.adjective` (the canonical adjective/type pair), `rule:sd.dungeonCrawling`, `procedure:sd.dungeon-preparation`.

## Citycrawl references after the user's later context suggestion

The registry already supports a separate city grammar: streets connect real buildings and gatherings; source-specific city moves stay in the existing reader. Following the user's later scope direction, these audited candidates also support the city plate in this pass.

| Drawn feature | Exact Reference ID | Registry title / behavior |
| --- | --- | --- |
| Street | `procedure:aitc.street` | Street — Adjective, Type and Contents; canonical `aitc.street-adjective`, `aitc.street-type`, `aitc.street-contents` |
| City gate and guards | `oracle:aitc.city-gate-reaction` | City Gate — Guards Reaction |
| Public gathering | `oracle:aitc.gatherings` | Gatherings |
| Tavern | `oracle:aitc.taverns` | Taverns |
| Shopfront | `oracle:aitc.businesses` | Businesses |
| Townhouse cutaway | `oracle:aitc.interior-townhouse` | Interior Locations — Townhouse |
| Shrine | `procedure:city.pray` | Pray; existing contextual city move, not an unconditional blessing roll |
| Person at crossroads | `procedure:city.directions` | Get Directions; existing contextual city move |
| Merchant stall | `oracle:aitc.merchant-disposition` | Merchant Dispositions; explicitly read-only, no Roll |

AITC already has city-crawl, directions, pray and stash move handlers. Their conditional failure/weak-hit tables must not be renamed into generic urban environmental features. `procedure:city.stash` rolls on return to retrieve the item, not when first placing it. The source street procedure has genuine USES edges; all other spatial proximity remains artwork, not new semantic relationships.

## Rejected mappings, gaps and future contexts

- No independent Door, Floor, Ceiling or Staircase Oracle was found. There is a real locked-door rule, broad Architecture/Structure, Exit Type and Number Of Exits. Do not relabel the latter as a Staircase Oracle or route a door to random architecture.
- `core.containers` is starting equipment, not dungeon chest contents. A chest may represent discovered loot with a precise label; it must not claim a container-construction or chest-lock table exists.
- Corpse Plundering concerns possessions; it does not describe cause of death or corpse anatomy. The scene label/result must retain this distinction.
- A pool or river drawn for composition is not automatically interactive. Geography tables describe general geography and do not establish a generic water-quality or pool Oracle. No invented water mapping is needed.
- A forest can spatially cue foraging, but “Forage” is the meaning, not an invented forest generator. Ruins are not automatically a dungeon generation command; explicit entrance or architecture references are stronger candidates.
- Abstract follow-up state, generic danger, NPC motifs and narrative consequences should not be arbitrarily assigned to evenly spaced map ornaments.
- Context metadata is not complete semantic ontology; some name/category heuristics produce overly broad contexts. This is an existing metadata limitation, not a reason to alter source data during the UI pass.
- Missing or unloaded source packs must produce an explicit availability state. They cannot justify placeholder random tables or dead interactive objects. Validation should require every configured ID to resolve against the supported full registry fixture, while the runtime preserves existing unavailable-source behavior.

Strong next contexts after the implemented city plate: **NPC encounter** (figure, posture, possession and speech cues backed by actual NPC tables, after a dedicated mapping audit); **regional journey variants** (existing region-specific features, discoveries and encounters can justify distinct terrain rather than new invented tables); **Corpse/loot inspection** (small object-focused composition, only if additional existing references provide enough distinct meaningful targets). Creature anatomy is weaker: creature stat/preset navigation exists, but a body-part diagram could imply unsupported per-body-part mechanics. Audit it before adopting that grammar.

The spatial scenes can change discovery because the user can select a boundary, object, sign or destination before knowing a table title. That claim still needs browser acceptance: selecting a picture must enter the same reader, retain Related/Pins/Recent/Workbench, and never auto-roll. A plate that merely decorates a list of references would not satisfy this criterion.
