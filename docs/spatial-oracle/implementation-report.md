# Spatial Oracle implementation report

This records the initial spatial implementation at `806371812a5488c90872f029cbbb2275f9996e14`. The later entrance/smell additions, changed exit mapping, generator and reader refinements, and current 41-hotspot acceptance are in [followup-report.md](followup-report.md).

Baseline commit: `40201c331945b91f08e200c1227b6d8a67de860a`.
Final commit: the implementation commit accompanying this report; its full hash is recorded in the completion message.

## Result and scope

The desk now has a first-class **공간 탐색 / Spatial Oracle** entry with **Dungeon, City crawl, Journey**. The initial two-slice request was extended to City crawl following the user's later instruction identifying those three contexts. There are 29 illustrated controls: 11 dungeon, 9 city, 9 journey. There are no gates, ordered steps or required rolls.

The user can open a locked-door rule by pointing at a door, identify a room's contents by inspecting its interior, or find the road and campsite tables without recalling their names. Every control enters the existing Reference state. Inspection does not roll. The existing reader owns rules, tables, explicit rolls, provenance, row links, Related, Pins, Recent and Workbench. Results never become map annotations.

The user's first three attached maps were the primary visual references. Their general principles informed irregular masonry, fitted floors, cave boundaries, embedded small objects and limited print palettes. All compositions and SVG drawings are original. Following visual feedback, the initial angular illustrations were redrawn with curved contours, uneven stone courses, organic silhouettes, dark recesses and varied local hatching. The three scenes have separate palettes: photo 1's moss/brick/ochre for Dungeon; photo 2's teal/purple/pink for City crawl; photo 3's blue-grey/sulphur/peach for Journey. The normal reader retains its typography and colours.

## Registry and execution integrity

The audit and candidate/source-page details are in [registry-audit.md](registry-audit.md). The runtime and archival source bundles already differ; they must not be conflated.

| Dataset | References before → after | Canonical tables before → after | Rows before → after | Source/shared procedures |
| --- | --- | --- | --- | --- |
| Current distributed runtime | 987 → 987 | 545 → 545 | 12,305 → 12,305 | 60 → 60 |
| Archived private fixture | 993 → 993 | 546 → 546 | 12,310 → 12,310 | 60 → 60 |

Both retain 9 books. The pre-existing difference is `core.beasts` and its purchase definitions. All 85 baseline hashes of canonical data, execution/domain code and schemas remain unchanged; see [registry-baseline.json](registry-baseline.json) and [registry-final.json](registry-final.json). No canonical table, semantic edge, migration or stored preference schema was added or altered.

FOLLOW-UP, SUBTABLE and LOOKUP remain products of explicit row metadata. USES and USED BY remain products of the existing audited dependency evidence. A road's proximity to a campsite is illustration, not a new relationship or procedure.

## Architecture

- `src/domain/spatialScenes.ts` declares semantic scene/hotspot records: scene ID/context, stable hotspot ID, existing Reference ID, visual target key and accessible feature label. It contains no source rows, dice or invented probability.
- `spatialVisuals.ts` and `cityVisuals.ts` own coordinates, hit paths and marker positions independently of Reference IDs. Closed regions cover objects; continuous, wide, invisible strokes cover the full roads and trails. Visible artwork and hit regions differ intentionally.
- `SpatialArtwork.tsx` and `CityArtwork.tsx` draw deterministic original SVG. They contain no Reference actions. Unknown artwork targets throw.
- `spatialIllustrations.tsx` registers visual grammars. A future scene supplies its semantic map, geometry and renderer without copying interaction logic.
- `SpatialOracle.tsx` supplies pointer/keyboard interaction, selection, discovery mode, map scrolling and the adjacent/below reader. `inspectSpatialHotspot` resolves the registry entry and invokes the same `activate(id, false)` operation used by Search.
- `ReferenceWorkbench.tsx` adds the page and reuses `desk.content`, Related rows and open Workbench pages. It does not copy the reader or introduce an alternate result store.
- The existing browser navigation driver tracks the new page and a separate `spatial-scene` channel. Reference selection stays in the original `reference` channel. Browser Back/Forward restores scenes and references together.
- Missing reference IDs produce an explicit availability message and disabled, named controls. Existing entries whose source is unavailable still open the desk's existing unavailable-source reading state. Supported full registries are validated in tests; invalid IDs, duplicate hotspots and missing/shadowed artwork fail validation.

## Exact implemented mappings

### Journey

| Feature | Existing Reference ID |
| --- | --- |
| Continuous road | `oracle:feretory.roadType` |
| Footprints | `oracle:reclvse.signs_of_travelers` |
| Side trail | `oracle:feretory.leaveRoad` |
| Foraging patch | `oracle:feretory.forage` |
| Camp/fire | `oracle:feretory.campsite` |
| Sky/cloud | `oracle:core.weather` |
| Village | `oracle:feretory.village` |
| Roadside corpse/possessions | `oracle:core.corpsePlundering` |
| Milestone | `rule:feretory.travel-distances` — reference only |

### Dungeon

| Feature | Existing Reference ID |
| --- | --- |
| Entrance | `oracle:reclvse.dungeonEntrance` |
| Masonry | `oracle:reclvse.architecture` |
| Locked door | `rule:depths.locked-doors` — reference only |
| Interior contents | `oracle:reclvse.contentsCategory` |
| Furniture | `oracle:reclvse.dressing` |
| Chest/loot | `oracle:reclvse.roomLoot` |
| Trap mechanism | `oracle:core.traps` |
| Continuing passage | `rule:reclvse.passage` — reference only |
| Wall light | `oracle:reclvse.light` |
| Corpse/possessions | `oracle:core.corpsePlundering` |
| Peripheral hearing glyph | `oracle:reclvse.sounds` |

### City crawl

| Feature | Existing Reference ID |
| --- | --- |
| Gate and guards | `oracle:aitc.city-gate-reaction` |
| Continuous street | `procedure:aitc.street` |
| Gathering | `oracle:aitc.gatherings` |
| Tavern | `oracle:aitc.taverns` |
| Shop | `oracle:aitc.businesses` |
| Townhouse | `oracle:aitc.interior-townhouse` |
| Shrine | `procedure:city.pray` — existing configurable city move |
| Merchant stall | `oracle:aitc.merchant-disposition` — reference only |
| Crossroads/person | `procedure:city.directions` — existing configurable city move |

## Responsive interaction and accessibility

The drawing keeps a minimum 640px width, preventing microscopic touch targets. At 360px it opens centered in a horizontally scrollable viewport; touch panning, explicit left/right controls and keyboard focus can reach the entire plate. At 768px the reader remains below. At 1440px it sits beside the map. At 3440px the spread is capped at 1880px rather than stretching across the monitor. Optional zoom increases the rendered map by at least 35% even on the widest layout; a final four-width check is in [zoom-acceptance.json](zoom-acceptance.json).

Every SVG feature has a button role, descriptive accessible name, tab stop, pressed/disabled state and controlled-reader relationship. Tab, directional arrows, Enter and Space work. Focus moves to the reader on inspection and returns to the object on “지도로 돌아가기”. Keyboard focus pans hidden features into view; touch focus does not move a target under the finger. Hover/focus shows one concise label. Optional “살펴볼 곳 표시” reveals hit regions without turning the plate into a permanent labelled diagram.

Browser checks exercise actual pointer events, touch events and keyboard events, not dispatch-only click mocks. The smallest measured effective target is 63.16px at the 360px viewport, above the 44px acceptance target. No full screen-reader session or formal accessibility certification is claimed. The hearing glyph is necessarily less literal than the door/chest/road, so its focus label remains important. Decorative geography remains noninteractive unless supported by a real Reference.

Two issues found by browser testing were fixed: touch-triggered focus panning could move an object before touch-up; hover dashes could cut holes into an invisible stroke hit area. Route hit paths now remain solid while a separate visible path draws their hover treatment. The mobile header also no longer wraps the four primary navigation labels awkwardly.

## Verification and screenshots

Baseline: **1,022 tests passed; build and lint passed**. Final: **1,037 tests passed, 0 failed, 0 skipped** (15 added tests). Test totals and the final browser run are recorded alongside this report in `final-test.log`, `final-build.log`, `final-lint.log`, `browser-run.log` and [browser-acceptance.json](browser-acceptance.json). The additions cover registry/geometry validity, read-only behavior, canonical deterministic rolls, Search-equivalent selection, existing preference/session behavior, metadata relationships and unchanged data counts.

Final TypeScript checks, production build, lint, public-build privacy and private-pack boundary checks all pass. Vite transforms 2,219 modules (baseline 2,210); both builds contain 49 checked static files. The existing >500kB chunk-size warning remains: the main chunk grows from 641.89kB / 210.31kB gzip to 710.34kB / 237.31kB gzip, including the original vector drawings. No dependency or remote image service was added.

Browser acceptance at **360 / 768 / 1440 / 3440** opens all 29 hotspots per width (116 total), exercises 11 detailed open/roll/reference cases per width (44 total: 32 explicit rolls and 12 no-roll cases), and checks six integration groups per width: Reference Back/Forward; keyboard and return focus; Recent/Pins/Workbench/Search equivalence; Pins/Workbench persistence after reload; scene Back/Forward; discovery/zoom/panning. There are no page errors or page-width overflow. The runner is `scripts/check-spatial-browser.mjs` and accepts `REFERENCE_URL`, `PLAYWRIGHT_MODULE`, `PLAYWRIGHT_CHANNEL` and `SPATIAL_WIDTHS` overrides.

Representative captures (local, ignored output assets; they may contain locally installed rulebook text):

| Scene | Desktop | Mobile |
| --- | --- | --- |
| Dungeon | [Map](../../outputs/spatial-oracle/dungeon-scene-1440.png) · [Reference](../../outputs/spatial-oracle/dungeon-reference-1440.png) | [Map](../../outputs/spatial-oracle/dungeon-scene-360.png) · [Reference](../../outputs/spatial-oracle/dungeon-reference-360.png) |
| City crawl | [Map](../../outputs/spatial-oracle/city-scene-1440.png) · [Reference](../../outputs/spatial-oracle/city-reference-1440.png) | [Map](../../outputs/spatial-oracle/city-scene-360.png) · [Reference](../../outputs/spatial-oracle/city-reference-360.png) |
| Journey | [Map](../../outputs/spatial-oracle/wilderness-scene-1440.png) · [Reference](../../outputs/spatial-oracle/wilderness-reference-1440.png) | [Map](../../outputs/spatial-oracle/wilderness-scene-360.png) · [Reference](../../outputs/spatial-oracle/wilderness-reference-360.png) |

Matching 768px and 3440px screenshots are in the same output directory.

## Gaps, rejected mappings and next contexts

No independent random Door, Ceiling, Floor or Staircase table was found. The door therefore opens the actual locked-door rule; drawn stairs belong to the passage control and are labelled Passage. Starting-equipment containers were rejected as chest-loot tables. The chest means room loot, and Corpse Plundering means possessions, not anatomy or cause of death. Water and decorative ruins were not assigned invented Oracles. Conditional city failure tables were not presented as unconditional building actions. These are honest limits of the present registry, not new data requirements hidden by illustration.

Recommended follow-on contexts: (1) a region-specific journey plate backed by the regional geography/discovery tables; (2) a more detailed city interior connected to already audited interior references; (3) a small NPC encounter plate only after an explicit posture/speech/possession mapping audit. Creature anatomy and corpse body-part controls need stronger source support before implementation.

## Did discovery change?

Yes, in the implemented interaction: the browser acceptance reaches architectural features, objects and landscape signs directly, without Search or a table-name list, and rolls through the same reader afterward. The objects are actual SVG controls embedded in connected spaces; the drawing is not a background behind a button grid. The same Weather Reference reached later through Recent and Search retains identity, results, pins and Workbench membership.

There is still a learning cost for a non-literal hearing glyph, and mobile requires panning to see the full space. Those are explicit prototype tradeoffs. This pass proves a different discovery route and preserves the desk's execution semantics; it does not claim a comparative usability study with new players.

## Files changed

- Integration: `src/App.tsx`, `src/main.tsx`, `src/components/ReferenceWorkbench.tsx`.
- Semantic navigation: `src/domain/spatialScenes.ts`.
- Shared surface/registration: `src/components/spatial/SpatialOracle.tsx`, `spatialIllustrations.tsx`, `spatial-oracle.css`.
- Original drawings/geometry: `SpatialArtwork.tsx`, `CityArtwork.tsx`, `spatialVisuals.ts`, `cityVisuals.ts`, `spatial-artwork.css` in that directory.
- Verification: `tests/spatial-oracle.test.ts`, `tests/spatial-artwork.test.ts`, `scripts/check-spatial-browser.mjs`.
- Audit, report, counts, hashes and logs: `docs/spatial-oracle/`.

Existing untracked DNGNGEN/translation documents and `tests/browser/` were left untouched. No deployment was performed.
