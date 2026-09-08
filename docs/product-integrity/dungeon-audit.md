# Dungeon and Room source-integrity audit

Audit date: 2026-09-08. Scope: every Dungeon/Special Room/generic Room textual generation path in `generators/index.ts`, `specialRooms.ts`, `tables.ts`, `regionWeights.ts`, and `domain/dungeonCrawl.ts`. Character, creature, NPC, encounter and general registry work have separate inventories. This document reports implementation and local checks; it makes no deployment claim.

## Evidence and inventory

`dungeon-generation-inventory.json` inventories 31 output paths, including source/table IDs, book identity, PDF and printed pages, transformations, verbatim status, translation availability, fallback behavior and confidence. Per-path primary classifications are SOURCE_VERBATIM 17, SOURCE_COMPOSED 5, APP_DERIVED 3, USER_AUTHORED 6, UNSOURCED 0. Conditional single-entry branches can have a narrower runtime classification. Compatibility mirrors are explicitly identified and never execute another roll.

The supplied Core Bare Bones, Sölitary Defilement and RECLVSE PDFs were reopened; prior metadata was not accepted as evidence by itself. Across 26 relevant canonical tables, all 397 English entry/follow-up segments were checked. 395 matched PDF extraction after Unicode/case/punctuation/whitespace normalization. The two remaining SD contents clauses were visually confirmed: their line wraps occur after neighboring rows in extracted reading order. `dungeon-source-verification.json` records counts and source file hashes without publishing private table copies.

PDF pages are one-based physical pages. Core Bare Bones and this supplied RECLVSE edition use matching printed pages for the tables below; SD printed pages are two less than the PDF index. Core's full edition is a different PDF and its pagination is not substituted for Bare Bones.

## Previous Special Room pipeline

The previous implementation selected two `core.rooms` entries per Room, forced eight distinct entries across four Rooms, imposed an undocumented category restriction on the second detail, increased probability when English room words appeared inside a Dungeon title/purpose/inhabitant/danger string, and added general region weighting. It also preferred Korean translation text as generated output, rolled a regional trait, and substituted `regionById(...).description` if that regional source did not exist.

It then prefixed a source fragment with one of four app-written gothic roles and created additional Korean connective sentences tying the independent fragments to the Dungeon's existing inhabitants, danger or premise. Declaring those sentences “app interpretation” did not make them acceptable generated content under the new source-purity rule.

Three unexplained production text paths were removed:

| Previous path | Disposition |
| --- | --- |
| `SpecialRoom.name.rolePrefix` | Removed. New names are neutral structural identifiers, ROOM 01–04. |
| `SpecialRoom.feature.contextBinding` | Removed. No automatically authored linking sentences remain. |
| `SpecialRoom.feature.regionDescriptionFallback` | Removed. A missing source never substitutes an atmospheric region summary. |

The two-detail rule, all-room deduplication, title-word weighting and automatic regional trait were additional unsupported composition mechanisms, even where their individual source fragments were valid. They were removed separately from unsourced text. Saved legacy values are retained; the cleanup applies to newly generated material.

## Verified replacement procedure

Core Bare Bones PDF/printed pp. 73–74 supplies **Sample Rooms**, a single **d4 × d6** selector. Roll d4 for the block and d6 within that block. Select exactly one canonical entry. Three entries have printed inline branches:

| Root selector | Follow-up | Source page |
| --- | --- | --- |
| 11 | Motif d6 | Core 73 |
| 33 | Shelf contents d4, ranges 1–2 and 3–4 | Core 74 |
| 43 | Altar detail d4, ranges 1–2 and 3–4 | Core 74 |

Every other result has no automatic child. The root and child are separate components with exact English text, secondary Korean helper, source reference and rolled values. There is no rule to add a second independent Sample Room entry, a room type from another book, a regional trait, a danger or a treasure. No such automatic addition remains.

SD PDF p. 19 / printed p. 17 defines **four prepared Special Room slots**. It suggests DNGNGEN for populating the preparation stat block and also permits manual preparation. It does **not** prescribe the Core Sample Rooms table as the mandatory method. This application's transparent preparation choice is to fill each of those four slots with one verified Core Sample Rooms roll. The source disclosure distinguishes Core's actual roller from SD's four-slot routing context. This is not represented as a verbatim DNGNGEN algorithm.

The Core table can legitimately yield a short prompt such as “Leaning.” It can also yield identical results in different Rooms. Both are valid source behavior; extra detail and uniqueness are not invented to disguise them. The four slot numbers distinguish the packets visually. No DNGNGEN website text or copied text pools are used by this procedure.

## Dungeon dossier and generated titles

Core's Dungeon title is valid: PDF/printed p. 71 explicitly prints “The” and instructs two d12 rolls, one per column. The title retains both source identities and both roll traces under `core.dungeon-title`. The app does not invent gothic title fragments. User-supplied Dungeon titles remain manual.

| Field | Current source / behavior |
| --- | --- |
| Premise | Core Adventure Sparks, PDF/printed 69–70; independent prompt, no connective prose. |
| Status | Core 71, d6; only inactive results follow the inline d4. |
| Former purpose | RECLVSE 86, Dungeon Purpose (Then), d6. |
| Inhabitants | Core 72, d12. |
| Entrance | RECLVSE 87, d20. |
| Entrance condition | RECLVSE 88, d12. |
| Distinctive feature | Core 73, d12. Removed automatic concatenation with a Depths regional trait. |
| Imminent danger | Core 72, d10; only the first result follows its inline d4. |
| Treasure/object | Core 3, Occult Treasures, d10; independent object prompt. |
| Motive | Manual, initially empty. The old RECLVSE quest-related **encounter** hook was applied outside its documented context. |
| Weird phenomenon | Manual, initially empty. The old mandatory RECLVSE arcane **encounter** was applied outside its documented context. |
| Guard | No automatic field/source procedure exists in the current schema; no guard is synthesized. |

Those RECLVSE encounter tables are real source material (PDF/printed 121), so they remain in the canonical Reference registry. Removing their automatic use as Dungeon dossier fields is a context correction, not censorship of source weirdness. Blank fields are available for user preparation and do not produce filler.

Core Status's fourth inactive reason instructs the reader to consult the Calendar of Nechrubel. That instruction remains source text. The preparation roller does not silently add a campaign Misery; calendar execution remains a deliberate play action. This is documented in the procedure definition rather than hidden in React.

## Generic rooms and optional rollers

Generic crawling uses the four SD Room Descriptor tables on PDF 15 / printed 13: adjective d20, type d12, contents d12, and exits d4. Printed slash alternatives remain intact; the app does not independently select slash fragments or stitch them into prose. Numeric exits are derived from the rolled row and the count of discovered Special Rooms. The original discovered count is saved with the result, so rerolling exits later uses that Room's recorded context.

The old normal Room preparation layered SD descriptors, a Core sample, a Depths trait and RECLVSE contents into one object without a documented combined recipe. Newly prepared generic Rooms now use the SD descriptors and contents only. A Room prepared outside an active crawl does not invent a discovered-room count or automatically roll contextual exits.

Existing deliberate single-field rollers still permit Room Dressing (RECLVSE 92), Trap (Core 4), Loot and Encounter (RECLVSE 93). Their source text remains separate. They are not silently executed as a mandatory cross-book recipe.

## Canonical data and probability

All new procedures read canonical table IDs through `getCanonicalRuleTable`; procedure definitions contain metadata, not duplicate source strings. No independent room content arrays or fictional fallback pools remain. `DUNGEON_PROCEDURES` documents the title pair, status and imminent-danger branches, Sample Room branches, and generic SD descriptors.

Region weighting now uses a small explicit metadata catalog keyed by canonical numeric entry identities. No English/translated strings are tokenized or matched. A matching region changes an eligible entry weight from 1 to 1.25; boosts do not stack, and every valid source entry remains possible. If no eligible entry receives a boost, ordinary unweighted selection is used. Source inspection records when region weighting was actually applied. Special Rooms deliberately use the printed unweighted Core selector.

## Provenance, edits and preservation

Each source result stores classification, origin, status, source references, original English fragments, dice values, canonical entry IDs, transformation and dataset identity when available. A root sample entry ID is canonical, e.g. `core.rooms:11-11`; an inline trace appends a `/followup:min-max` path without inventing a new table. Sources retain both PDF and printed pagination.

Single-component rerolls replace text, English source snapshot, selected source entry and trace together. Rerolling a printed parent also rerolls its dependent child; that dependency is explicit. An already edited child is preserved as a separate manually edited component with a unique key. Detail-only rerolls leave the parent untouched. Repeated parent rerolls cannot create duplicate component keys.

Manual edits preserve the original source snapshot but change origin to `source-edited` and classification to USER_AUTHORED. Thus Source detail must explain where a prior value came from rather than claim the current edited text is verbatim. `syncRoomComponents` updates compatibility text from components without performing any rolls.

No load/import migration rerolls a saved object. Explicitly regenerating a legacy Special Room may retain its old description in `legacyDescription`; existing names, notes, placements, assigned entities and stable IDs survive. Additive component/provenance storage is covered by save/import/clone regression tests. Campaign duplication copies source references exactly while generating new entity IDs.

## Semantic and generation QA

The reproducible `scripts/audit-dungeon-generation.ts` run created **100 Dungeons and 400 Special Rooms** across all seven regions. Full samples are private at `outputs/product-integrity/dungeon-samples.json`; the public QA report contains counts, canonical IDs and a digest only. An additional test executed **10,000 preparation passes / 40,000 Special Rooms**, resolving every source component and trace.

The 25 selected human-review Rooms were read component by component, including single-fragment rooms, repeated source results, inscription motifs and both altar branches. The results contained no app-created atmospheric sentence and no unsupported second independent room result. Long source text remained long only where it was actually present in the book. English stayed primary. The existing Korean helpers in these samples were brief and did not add events, motives or scene descriptions.

Concrete findings:

| Example / pattern | Classification and action |
| --- | --- |
| Old role label followed by a full room fragment | APP: unsupported title construction; removed. |
| Old room feature asserting that a Dungeon inhabitant's “presence is prominent here” | APP: invented connective prose; removed. |
| Old source-field combination of regional trait and unrelated Core feature | APP: two tables were real but the automatic relationship was unsupported; separated. |
| A one-word room result without a generated room type | SOURCE: the Sample Rooms table permits fragments. Preserved. |
| Multiple identical room descriptions across the 400-room sample | SOURCE: independent repeated rolls. Preserved; not a duplicated procedure call. |
| An altar with “fresh blood” or “cracked” | SOURCE: the printed conditional branch. Kept as two components. |
| Inscriptions with a childish motif | SOURCE: intentionally odd juxtaposition. Kept; no explanatory prose added. |
| Short title-column combinations that sound unusual | SOURCE: the title procedure explicitly combines the two columns. Kept. |

The sample report records 369 repeated descriptions beyond the 31 distinct outcomes observed in that run. This is expected from a small source table, not a claim of 400 unique room concepts. Selecting new unrelated tables to disguise repetition would violate the requested source-purity rule.

## Tests and unresolved material

`dungeon-generation-integrity.test.ts` adds exhaustive root-selector and conditional-branch checks, atomic source/text reroll checks, manual sibling preservation, repeated-manual-child key checks, generic matrix-context checks, procedure resolution, large-sample validation and save/import/duplication provenance checks. Existing tests that demanded eight unique details, injected regional prose or mandatory encounter-context dossier filler were updated because those assertions encoded behavior explicitly rejected by this audit. Existing ID, assignment, import and migration checks were retained.

No unexplained UNSOURCED textual production field remains in this Dungeon/Room scope. Material not represented as a verified automated source remains explicit:

- There is no supplied-PDF instruction requiring two independent Core room details per Special Room. The old synthesis is not retained.
- SD recommends DNGNGEN but does not itself specify that site's full random algorithm. This rebuild does not pretend the Core one-sample preparation choice is the exact DNGNGEN procedure.
- Dungeon guard and mandatory linked motive/phenomenon have no verified generator procedure in the present model. No result is synthesized; the relevant existing fields remain manual/empty.
- Saved legacy prose may have incomplete historical provenance. It is preserved as saved content, never counted as newly verified source text or reverse-engineered into invented components.

Actual browser hierarchy, responsive screenshots, compact source disclosure and the product-wide completion report are verified by the coordinating implementation pass. The source audit does not substitute for that visual acceptance work.
