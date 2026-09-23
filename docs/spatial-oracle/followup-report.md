# Spatial Oracle and Reference presentation follow-up

Baseline commit: `806371812a5488c90872f029cbbb2275f9996e14`. The final commit hash is in the completion message. This report records the state after the user's 23 September follow-up. The earlier [implementation report](implementation-report.md) is historical; its 29-hotspot count and locked-door mapping were superseded here.

## What changed

The illustrated Dungeon, City crawl and Journey plates now expose 41 existing References, up from 29. The 12 additions point at verified source tables for entrance condition/signs/smell, room shape/smell, city approach/street/hazard/smell and journey road event/water/threat signs. The room doorway now opens RECLVSE Exit Type rather than a TR-based locked-door rule. No table, row, odds, source claim or inferred relationship was created. [The missing-reference audit](missing-audit.md) records source pages, considered alternatives and the genuine non-TR door/lock gap.

The canonical Sölitary Depths `oracle:depths.weakHitConsequences` (d6, PDF page 11/printed page 8) is suggested only after an actual dungeon action returns Weak Hit. Its source note limits it to an unclear Weak Hit while in a dungeon. The suggestion opens the existing Reference without rolling it. The separate dungeon-crawl Weak Hit means an ordinary room, so that event does not trigger this suggestion. TR/threat-rating references were not added to the spatial plates.

Home/Generator shortcuts now open the live Reference reader. Character and Monster results use a coloured print layout with stronger name/stat/field hierarchy, including locally installed SCVMBIRTHER and Monster Approaches source variants. They still use the same canonical roll data, source labels and Reference actions. The unusually large rule title came from a 9rem wide-screen rule; the reader and adjacent spatial reader now cap it. Across all 526 public Oracle entries, meaningful canonical descriptions appear once immediately after the title, followed by Korean translation, dice/roll controls and canonical rows. Synthetic dice/count summaries are not treated as source descriptions. Long rolled Oracle prose uses readable body type rather than display blackletter; short answers keep their emphasis.

## Exact scene mappings

The scene model (`src/domain/spatialScenes.ts`) holds identity, context and accessible labels separately from drawing and hit geometry (`src/components/spatial/*Visuals.ts`). SVG artwork has no roll logic. Each hotspot calls the existing `activate(id, false)` path. The original reader, canonical roll engine, Recent, Pins, Workbench, Related and browser navigation remain shared with Search. The scene validator rejects missing registry IDs, duplicate hotspot IDs and shadowed visual targets.

| Dungeon feature | Existing Reference ID |
| --- | --- |
| Entrance | `oracle:reclvse.dungeonEntrance` |
| Damaged threshold | `oracle:reclvse.entranceState` |
| Entry scratches/remnants | `oracle:reclvse.entranceSigns` |
| Air at the entry | `oracle:reclvse.entranceSmells` |
| Masonry | `oracle:reclvse.architecture` |
| Boundary/exit | `oracle:reclvse.exitType` |
| Interior | `oracle:reclvse.contentsCategory` |
| Floor/room outline | `oracle:reclvse.roomShape` |
| Furnishing | `oracle:reclvse.dressing` |
| Chest/loot | `oracle:reclvse.roomLoot` |
| Trap | `oracle:core.traps` |
| Passage | `rule:reclvse.passage` (reference only) |
| Light | `oracle:reclvse.light` |
| Remains/possessions | `oracle:core.corpsePlundering` |
| Sound glyph | `oracle:reclvse.sounds` |
| Room scent | `oracle:reclvse.smells` |

| City crawl feature | Existing Reference ID |
| --- | --- |
| Gate/guards | `oracle:aitc.city-gate-reaction` |
| Signs before entry | `oracle:reclvse.city_signs_before_entering` |
| Street | `procedure:aitc.street` |
| Paving stones | `oracle:reclvse.street_surface` |
| Troubled alley | `oracle:reclvse.hazard` |
| Quarter chimney/scent | `oracle:reclvse.neighborhood_smell` |
| Crowd | `oracle:aitc.gatherings` |
| Tavern | `oracle:aitc.taverns` |
| Shop | `oracle:aitc.businesses` |
| Townhouse | `oracle:aitc.interior-townhouse` |
| Shrine | `procedure:city.pray` |
| Merchant stall | `oracle:aitc.merchant-disposition` (reference only) |
| Crossroads | `procedure:city.directions` |

| Journey feature | Existing Reference ID |
| --- | --- |
| Road | `oracle:feretory.roadType` |
| Wayside event | `oracle:feretory.roadEvent` |
| Tracks of travellers | `oracle:reclvse.signs_of_travelers` |
| Side trail | `oracle:feretory.leaveRoad` |
| Foraging patch | `oracle:feretory.forage` |
| Camp | `oracle:feretory.campsite` |
| Sky | `oracle:core.weather` |
| River bank | `oracle:reclvse.water_landmarks` |
| Signs of threat | `oracle:reclvse.threat_signs` |
| Village | `oracle:feretory.village` |
| Roadside remains | `oracle:core.corpsePlundering` |
| Milestone | `rule:feretory.travel-distances` (reference only) |

## Integrity and verification

| Dataset | References before → after | Canonical tables before → after | Canonical rows before → after |
| --- | --- | --- | --- |
| Public runtime | 987 → 987 | 545 → 545 | 12,305 → 12,305 |
| Private fixture | 993 → 993 | 546 → 546 | 12,310 → 12,310 |

Automated tests: **1,037/1,037 baseline → 1,038/1,038 final**. The added test walks every Oracle, confirms the source introduction behavior and retains every canonical row. The existing registry, spatial model, roll, preference/session and relationship tests still pass. Build, TypeScript, lint, public-build privacy and private-pack boundary checks pass. Vite transforms 2,221 modules; its existing large-chunk warning remains. Logs: [test](followup-test.log), [build](followup-build.log), [lint](followup-lint.log), [browser](followup-browser-run.log).

[Browser acceptance](browser-acceptance.json) passed at **360 / 768 / 1440 / 3440px**. All 41 hotspots opened at each size (164 openings), including direct pointer and touch targets; 11 detailed feature visits and six integration groups ran per size. Back/Forward, Tab/Enter/Space/arrows, return focus, Recent, Pins, Workbench, Search equivalence, discovery mode, zoom and map pan passed with zero page errors and no page-width overflow. The smallest measured interactive hit dimension at 360px was 51.37px. A separate spot audit opened 20 Oracle References across the three scenes at 360/1440 and checked introduction/translation/dice/rows order. Public and private Character and Monster rolls were inspected at 360/1440; an actual dungeon Weak Hit exposed the Sölitary Depths suggestion, Strong Hit did not, and inspecting the suggestion did not auto-roll. A long Tavern result measured 18.88px body text with no horizontal overflow after refinement.

Local screenshots are ignored outputs because some show installed source content:

| Surface | Desktop | Mobile |
| --- | --- | --- |
| Dungeon | [scene](../../outputs/spatial-oracle/dungeon-scene-1440.png) · [reader](../../outputs/spatial-oracle/dungeon-reference-1440.png) | [scene](../../outputs/spatial-oracle/dungeon-scene-360.png) · [reader](../../outputs/spatial-oracle/dungeon-reference-360.png) |
| City crawl | [scene](../../outputs/spatial-oracle/city-scene-1440.png) · [reader](../../outputs/spatial-oracle/city-reference-1440.png) | [scene](../../outputs/spatial-oracle/city-scene-360.png) · [reader](../../outputs/spatial-oracle/city-reference-360.png) |
| Journey | [scene](../../outputs/spatial-oracle/wilderness-scene-1440.png) · [reader](../../outputs/spatial-oracle/wilderness-reference-1440.png) | [scene](../../outputs/spatial-oracle/wilderness-scene-360.png) · [reader](../../outputs/spatial-oracle/wilderness-reference-360.png) |
| Character result | [public](../../outputs/generator-layout/character-after-1440.png) · [private](../../outputs/generator-layout/character-private-1440.png) | [public](../../outputs/generator-layout/character-after-360.png) · [private](../../outputs/generator-layout/character-private-360.png) |
| Monster result | [public](../../outputs/generator-layout/monster-after-1440.png) · [private](../../outputs/generator-layout/monster-private-1440.png) | [public](../../outputs/generator-layout/monster-after-360.png) · [private](../../outputs/generator-layout/monster-private-360.png) |
| Reader fixes | [long result](../../outputs/spatial-oracle/tavern-long-result-fixed-1440.png) · [Weak Hit suggestion](../../outputs/spatial-oracle/weak-hit-suggestion-1440.png) · [wide rule title](../../outputs/spatial-oracle/locked-doors-fixed-3440.png) | [Taverns reader](../../outputs/spatial-oracle/taverns-reader-new-360.png) · [rule title](../../outputs/spatial-oracle/locked-doors-fixed-360.png) |

## Limits and next work

The current registry has no dedicated non-TR random lock/door Oracle. Exit Type is an honest boundary mapping; it does not claim to describe a lock. Entrance sounds, impressions and hazards; SD odours/tastes and structure tables; city activity/sound; and region-specific journey discoveries were considered and left off these plates where they would duplicate affordances or imply an unsupported trigger. See the [audit](missing-audit.md) for the exact rejected IDs and reasons. Most single-table Oracles do not carry canonical prose descriptions; the reader does not invent one. No full screen-reader study was conducted. The small hearing/smell glyphs remain more symbolic than literal objects and rely on visible focus labels; mobile requires horizontal panning.

Future spatial detail should stay within the user's three chosen contexts: (1) a region-specific Journey plate only when a region is known, (2) a city interior plate backed by the existing interior references, and (3) a dungeon exterior/threshold plate if entrance-sound and structure references need more room. These are proposals, not newly invented categories or implementations.

This pass changes discovery as well as presentation: a player can inspect threshold damage, smell at an entrance, point to paving stones or a river bank, and reach the same Reference through Search afterward. The scene remains connected geography and objects, not a list under a decorative image. This demonstrates a different navigation route; it is not yet evidence from a new-player usability study.

Changed areas: `src/domain/spatialScenes.ts`; `src/components/spatial/` artwork, hit geometry and navigation; `src/components/DungeonActionMoves.tsx` and `inline-reference-tools.css`; `src/components/ReferenceWorkbench.tsx`, `ReferenceTable.tsx`, `ReferenceOracleIntroduction.tsx`, `DeskLanding.tsx`, `generator-result.css`, `src/main.tsx`, `src/publication.css`; `scripts/check-spatial-browser.mjs`; `tests/reference-presentation.test.ts`; and this `docs/spatial-oracle/` report, audit, acceptance JSON and logs. Existing untracked source-integration documents and browser tests were left untouched.
