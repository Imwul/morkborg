# Spatial illustration revision — 2026-09-23

Baseline: `a7c52cf4ff56c24cb6b1a6292abd14bd97040c38`. The final pushed commit is identified in the completion message; this report travels with that commit.

## Durable design rule

**맥락(가리키는 사물의 의미) 먼저, 그림 생성 나중.** Audit the existing reference and its actual subject first. Write down what each depicted object means; only then generate its illustration. Never infer an Oracle meaning from an accidental shape in a sketch. User references 1–3 inform palette, pictographic composition and print vocabulary only; no source composition or artist was copied.

The built-in image_gen tool generated three original plates from semantic scene briefs, then edited particular defects. [The complete prompt set](illustration-prompts.json) records those briefs and the final dungeon/journey refinements. No remote image dependency or generation service was added to the app.

## What changed

- Dungeon: south entrance and paved threshold, north exit beyond stairs; bones are in the same connected room. Wall-mounted flame, small rough sound arcs beside the wall, flat engraved mist at floor level, a flush approach trap, properly supported table, smaller chest, exterior rubble and drag marks below the entrance.
- Journey: bridge spans the river bank to bank with road approaches meeting its ends; one consistent tent structure and light direction. Threat signs are a modest splintered trunk with damaged branches, distinct from travelers’ footprints. Roadside animal remains are smaller and ivory against the ground.
- City: coherent connected streets with a guarded gate, posted signs, cutaway shrine and townhouse, tavern tankard sign, goods in the shop and market, people in the plaza, damaged alley and smoke from an actual roof chimney.
- Palettes remain distinct: dungeon coral/sage/ivory; city plum/teal/rose; journey mustard/slate/salmon.

## Meaning corrected alongside the art

Animal bones do not imply pockets or possessions. Dungeon bones now open existing Room Dressing, whose source supports scattered bones; journey bones open existing Remains & Ruins, whose source supports animal remains. Human Corpse Plundering remains available as a clearly identified context-shelf reference in both scenes. The journal on the dungeon table opens existing Discovery, whose source supports journal clues. These are navigation mappings, not new rules or newly asserted source relationships.

Rejected mappings: animal skeleton → human corpse loot; a detached slab → room shape; generic footprints → threatening creature traces; free-floating smoke → a city chimney. Room shape is now reached through the actual room floor, and terrain/floor hit regions render below objects so they cannot intercept the objects.

No new registry gap was filled or hidden. No new canonical table, source row, semantic edge or migration was introduced. The prior special-dungeon exclusions, Mythic 2e/RECLVSE relationship audit, reader ordering and generator layout work remain at the baseline commit.

## Architecture and accessibility

SpatialScene keeps canonical Reference IDs and accessible meanings. The illustration registry owns bundled image URLs and geometry only. Each SpatialVisualTarget now has an actual featurePoint, an enlarged SVG hitPath, an independent labelPoint and optional layer. Browser acceptance clicks featurePoint and verifies the topmost DOM hit, so a misplaced polygon cannot pass merely by offering an unrelated clickable spot.

Original SVG drawing components were removed. The image is rendered once inside the existing SVG; transparent semantic paths follow its objects and continuous roads. There are no floating rectangular HTML buttons on the image. Focus, selection and optional reveal marks remain SVG UI; the underlying illustration never changes after a roll.

Inspect still invokes the same Reference state used by Search with rolling disabled. Explicit Roll uses canonical data and the existing result surface. Recent, Pins, Workbench, Related and source attribution use their established identities. A 640px minimum map and horizontal pan preserve touch access on narrow screens; the reader moves below the scene. Zoom remains available.

All 41 depicted features opened at each of 360/768/1440/3440px, including touch at 360px. Minimum measured target bounding dimension: 45.47px. Tab/Enter/Space/arrows, focus restoration and far-edge keyboard reveal passed. No page overflow or browser errors. Light selection/focus outlines with dark edging remain visible over every palette. Screen-reader labels are present; a full assistive-technology user study was not performed.

## Data and validation

| Check | Baseline | Final |
| --- | --- | --- |
| Tests | 1,046 passing | 1,050 passing |
| Distributed canonical tables / references / rows | 545 / 987 / 12,305 | unchanged |
| Archival canonical tables / references / rows | 546 / 993 / 12,310 | unchanged |
| Procedures | 60 | 60 |
| Interactive features | 41 | 41 |
| Context-shelf links | 32 | 34 |

TypeScript, production build, lint, public-build privacy and private-boundary checks passed. All baseline canonical data hash checks passed. The existing Vite >500kB JavaScript-chunk warning remains. Local PNG assets total approximately 9.6MiB and each is requested when its scene is shown; no additional image framework or runtime generation dependency exists.

The four new tests cover north/south exit separation, animal/journal meaning, background hit precedence, and local image validity/aspect ratio. The full 1,050-test run passed; after arranging human-corpse access in the existing context groups, all 22 spatial tests passed again. Browser acceptance covers 164 object openings, 44 detailed inspect/roll visits, and six integration groups at every width. [Acceptance details](browser-acceptance.json), [full tests](illustration-test.log), [targeted tests](illustration-targeted.log), [build](illustration-build.log), [lint](illustration-lint.log).

## Final assets and screenshots

- [Dungeon asset](../../src/assets/spatial/dungeon.png)
- [City asset](../../src/assets/spatial/city.png)
- [Journey asset](../../src/assets/spatial/journey.png)

Browser screenshots are local QA artifacts under ignored outputs, so they do not publish source table prose:

| Scene | Desktop 1440px | Mobile 360px |
| --- | --- | --- |
| dungeon | [scene](../../outputs/spatial-oracle/dungeon-scene-1440.png) · [reader](../../outputs/spatial-oracle/dungeon-reference-1440.png) | [scene](../../outputs/spatial-oracle/dungeon-scene-360.png) · [reader](../../outputs/spatial-oracle/dungeon-reference-360.png) |
| city | [scene](../../outputs/spatial-oracle/city-scene-1440.png) · [reader](../../outputs/spatial-oracle/city-reference-1440.png) | [scene](../../outputs/spatial-oracle/city-scene-360.png) · [reader](../../outputs/spatial-oracle/city-reference-360.png) |
| wilderness | [scene](../../outputs/spatial-oracle/wilderness-scene-1440.png) · [reader](../../outputs/spatial-oracle/wilderness-reference-1440.png) | [scene](../../outputs/spatial-oracle/wilderness-scene-360.png) · [reader](../../outputs/spatial-oracle/wilderness-reference-360.png) |

The same folder contains 768px and 3440px captures. Final screenshots were refreshed after context-shelf arrangement.

## Exact final mappings

### Dungeon

| Depicted feature | Existing reference | Canonical title |
| --- | --- | --- |
| 입구 · Entrance | `oracle:reclvse.dungeonEntrance` | Dungeon Entrance |
| 문턱의 상태 · Entrance state | `oracle:reclvse.entranceState` | Entrance State |
| 입구의 흔적 · Entrance signs | `oracle:reclvse.entranceSigns` | Entrance Signs |
| 입구의 냄새 · Entrance smells | `oracle:reclvse.entranceSmells` | Entrance Smells |
| 석조 벽 · Architecture | `oracle:reclvse.architecture` | Architecture & Structure |
| 출구의 형태 · Exit type | `oracle:reclvse.exitType` | Exit Type |
| 방 안 · Room contents | `oracle:reclvse.contentsCategory` | Room Contents |
| 방의 형태 · Room shape | `oracle:reclvse.roomShape` | Room Shape |
| 탁자 위의 단서 · Discovery | `oracle:reclvse.roomDiscovery` | 10A. Discovery |
| 전리품 · Room loot | `oracle:reclvse.roomLoot` | 10D. Loot |
| 함정 · Traps | `oracle:core.traps` | Traps and Devilry |
| 통로 · Passage | `rule:reclvse.passage` | Navigate the Passage |
| 등불 · Light | `oracle:reclvse.light` | Light & Visibility |
| 동물의 유해 · Room dressing | `oracle:reclvse.dressing` | Room Dressing |
| 귀 기울이기 · Sounds | `oracle:reclvse.sounds` | Room Sounds |
| 방 안의 냄새 · Room smells | `oracle:reclvse.smells` | Room Smells |

### City crawl

| Depicted feature | Existing reference | Canonical title |
| --- | --- | --- |
| 관문 경비 · Gate reaction | `oracle:aitc.city-gate-reaction` | City Gate — Guards Reaction |
| 성문 앞 징후 · City signs | `oracle:reclvse.city_signs_before_entering` | City Signs (Before Entering) |
| 거리 · Street | `procedure:aitc.street` | Street — Adjective, Type and Contents |
| 거리의 바닥 · Street surface | `oracle:reclvse.street_surface` | Street Surface |
| 위험한 골목 · Street hazard | `oracle:reclvse.hazard` | Street Generation — Hazard |
| 동네의 냄새 · Neighborhood smell | `oracle:reclvse.neighborhood_smell` | Neighborhood Smell |
| 군중 · Gatherings | `oracle:aitc.gatherings` | Gatherings |
| 선술집 · Taverns | `oracle:aitc.taverns` | Taverns |
| 상점 · Businesses | `oracle:aitc.businesses` | Businesses |
| 저택 내부 · Townhouse | `oracle:aitc.interior-townhouse` | Interior Locations — Townhouse |
| 사당 · Pray | `procedure:city.pray` | Pray |
| 노점 상인 · Merchant disposition | `oracle:aitc.merchant-disposition` | Merchant Dispositions |
| 갈림길 · Directions | `procedure:city.directions` | Get Directions |

### Journey

| Depicted feature | Existing reference | Canonical title |
| --- | --- | --- |
| 길 · Road | `oracle:feretory.roadType` | What’s the Road Like? |
| 길가의 사건 · Road event | `oracle:feretory.roadEvent` | Events by the Road. Roll Daily |
| 발자국 · Signs of travelers | `oracle:reclvse.signs_of_travelers` | Signs Of Travelers |
| 길 밖으로 · Leaving the road | `oracle:feretory.leaveRoad` | Leaving the Road, After Half a Day’s Journey, You Encounter… |
| 숲에서 채집 · Foraging | `oracle:feretory.forage` | Spending a Day Foraging |
| 야영지 · Campsite | `oracle:feretory.campsite` | Nightly Campsite Events |
| 하늘 · Weather | `oracle:core.weather` | Weather |
| 물가의 지형 · Water landmarks | `oracle:reclvse.water_landmarks` | Water Landmarks |
| 위협의 흔적 · Threat signs | `oracle:reclvse.threat_signs` | Threat Signs |
| 마을 · Village | `oracle:feretory.village` | The Village Is… |
| 동물의 유해 · Remains & ruins | `oracle:reclvse.remains_ruins` | Remains & Ruins |
| 이정표 · Travel distances | `rule:feretory.travel-distances` | Traveling the Dying Lands · Road travel times |

## Evaluation and future scope

This pass improves the existing spatial discovery model rather than claiming a new navigation system. It also corrects behavior: pointing at animal remains no longer opens a human-loot table; pointing at the floor now inspects the room’s form; the table’s journal opens a discovery. Users can select coherent physical situations without remembering table names, and the browser run reaches every target without Search.

The optional context shelf remains text because origins, historical purposes and unseen circumstances have no honest single physical object. Small bones and sound traces still benefit from hover/focus labels or “show interactables”; they are intentionally subtle and have enlarged hit areas. Mobile horizontal panning is still a tradeoff, explicitly explained beside the map.

Next candidates, after a semantic audit: (1) a city interior with source-backed room/object references; (2) a regional journey plate with established terrain references; (3) an NPC encounter tableau with explicit behavior/attitude references. Do not add anatomy controls or special-dungeon tables merely to fill illustration space.

## Files

- Assets: src/assets/spatial/{dungeon,city,journey}.png.
- Navigation/art integration: src/domain/spatialScenes.ts; src/components/spatial/{SpatialOracle.tsx,spatialIllustrations.tsx,spatialVisuals.ts,cityVisuals.ts,spatial-oracle.css}; src/main.tsx.
- Removed obsolete vector drawing code: SpatialArtwork.tsx, CityArtwork.tsx, spatial-artwork.css.
- Tests/acceptance: tests/spatial-artwork.test.ts, tests/spatial-oracle.test.ts, scripts/check-spatial-browser.mjs.
- Reports: docs/spatial-oracle/illustration-* and browser-acceptance.json.
