# Dungeon encounter tables — 2026-09-05

Each dungeon now has two fixed, ordered d6 tables: **Common 1–6** and **Rare 1–6**. Preparation creates the entries once. Encounter rolls consult those saved entries, without regenerating or consuming them and without automatically placing them in a room.

## Play flow

- Open a dungeon's **조우표** tab. Prepare empty Common and Rare slots, or assign existing encounters to individual faces.
- Common preparation uses the existing regional source route, with SD d12 as its supported fallback. Rare preparation uses SD d8 + Dungeon DR. Original result text, source references and unresolved results are retained.
- Use **Common · d6** or **Rare · d6** in the table or a room. An incomplete table cannot roll over a smaller pool.
- A room result can optionally be placed in that room. Repeated rolls select from the same dungeon table.
- Explicit slot replacement preserves the old encounter and its existing room placements. Changing region or DR does not regenerate prepared entries.

The standalone workbench generator is labeled **Encounter Prep / 조우 후보 준비**. Its source-table roll prepares a candidate; it is distinct from the dungeon's saved d6 lookup. Room quick tools lead to the current dungeon's table.

## Persistence

`Dungeon.encounterTables` stores Common/Rare arrays of exactly six nullable Encounter IDs plus preparation DR. This is separate from `encounterIds`, which remains a derived placement index. Older saves need no random migration: absent tables display six empty slots per category until explicitly prepared.

Campaign export/import and duplication remap table IDs. Dungeon duplication copies prepared encounter definitions and their corresponding copied placements; unrelated library definitions retain their existing shared behavior. Deleting an encounter empties its faces without shrinking the tables. Deleting a room leaves preparation intact.

## Validation

- 393 tests passed, including 13 new cases for exact slot counts, stable d6 selection, partial/atomic preparation, replacement, deletion, independent duplication, ID remapping, JSON import and out-of-range Rare results.
- Type checking, lint, production build and public-build privacy checks passed.
- In an isolated copy of the existing QA campaign, prepared Common 6 / Rare 6 for the Sarkash dungeon, rolled both categories, reloaded and returned to the dungeon, and compared all twelve displayed rows: text and order were identical. A room's Common 3 returned the saved third entry, and returning to the table preserved all twelve rows.
- Inspected 1440px and 360px layouts. Both mobile table frames measured 307px client/scroll width with six slots each; document width was 345px at a 360px viewport. Sources and per-slot edits remain collapsed.
- Copy action reported success in the app. The automation clipboard reader returned older clipboard contents, so OS clipboard contents were not independently confirmed in this pass.

[Desktop](tables-1440.jpg) · [Phone](tables-360.jpg)

## Decorative motifs removed

Removed the large reference-desk starburst and the dungeon dossier's abstract seal/colophon, including their unused CSS and reserved layout columns. The desk header now has no right padding reserved for a symbol. Dice controls, source/navigation icons and numbered room/encounter badges continue to convey their respective actions or positions.

[Reference desk](desk-without-ornament.jpg) · [Dungeon overview](dungeon-without-ornament.jpg)

The temporary campaign copy used for browser verification was removed afterwards; the existing campaigns were retained.
