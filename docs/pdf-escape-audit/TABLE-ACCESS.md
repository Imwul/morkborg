# Canonical table access audit

Baseline `479cbd765b4168eeaeee27f921bf4b0a6615c51b`; documentation only. This is an inventory of **all 562 installed canonical tables / 12,276 root entries**, not a new set of play-need rows. It refines the preliminary metadata detector in `app-inventory.json`: a hidden metadata key is not automatically missing playable information.

The complete inventory is in [JSON](data/table-access.json) and [CSV](data/table-access.csv). Each table records its actual reference destination, grouped canonical IDs, source pages, search rank, roll/reroll/view/manual-reading capabilities, non-roll reason, inspected omissions and related existing audit need IDs. No private full table text is embedded in these tracked inventory files.

| Capability | Count / finding |
|---|---|
| Canonical tables with a working reference destination | 562 / 562 |
| Distinct Oracle reference views | 552 |
| Additional canonical tables aliased into grouped views | 10 |
| Automatic ROLL and REROLL | 544 canonical tables, through 534 distinct views |
| Deliberately view-only tables | 18 |
| TABLE and SOURCE reachable with installed data | 562 / 562 |
| Exact table-title query: expected destination first | 550 / 562 |
| Exact table-title query: expected destination within five | 562 / 562; 11 second and 1 third |
| Reading a table and choosing an entry on paper | All tables; see selector/field exceptions below |
| Generic clickable row → chosen result / free manual die input | Neither exists in Table Inspector |
| Tables with a lowercase inline followup disclosure | 3 tables / 5 parent entries |
| TABLE-specific hidden playable fields | 11 tables / 55 parent entries |
| TABLE-specific missing source selectors/context headings | 7 tables / 64 parent entries, counted separately |
| Repeated identical TABLE caused by a repeated procedural step | 1: `heretic.gravesLootBodies` |

The 12 non-first results are mostly reasonable: armor/broken quick rules and regional monster workflows rank before the raw table. Other collisions are Trait, Names, Powers and the two Sound components. A title being searchable does not mean an individual named item or spell is searchable; those row-level gaps are in the book audits.

## ROLL is not VIEW

**ROLL** executes the selected reference’s canonical table or table group. **REROLL** executes the same whole group again. These are one-click actions on an available reference; they are not a guarantee that every secondary source procedure is automated. The generic result includes `entry.text` and only the textual metadata keys `effect`, `effectRule`, `conditional`, `condition`, and `procedureNote`. Other specialized workbenches may supply more complete procedure results.

**TABLE** deliberately shows all rows without rolling. The current path from an opened reference is `SOURCE → TABLE`; from another object’s opened Source, `이 표 열기` calls `openTable` directly and preserves the underlying object context. TABLE renders the dice/range column, the English entry text, and an optional nested child-text disclosure. It does not call the generic result formatter or render arbitrary mechanical metadata. A table can consequently be readable and incomplete at the same time.

A person can read a reference-only table and choose on paper. There is no general “click row to choose this result,” “enter my physical die result,” or copy-a-selected-row control. Existing fixed follow-up links can select a documented row; those narrow links are not a universal manual selector. This is a capability distinction, not a recommendation to force saved campaign state for every choice.

## Grouping and duplicate data

All ten aliases correctly retain the source components in their grouped reference:

| Group | Canonical components |
|---|---|
| The Monster Approaches | `feretory.A`, `.B`, `.C` |
| NPC | `sd.npc.disposition`, `.profession` |
| Room | `sd.room.adjective`, `.type` |
| Material | `sd.material.quality`, `.composition` |
| Sound | `sd.sound.quality`, `.type` |
| Religious Denomination | `sd.religion.order`, `.adjective`, `.domain` |
| Mythic Action | `mythic2.meaning.action-1`, `.action-2` |
| Mythic Descriptor | `mythic2.meaning.descriptor-1`, `.descriptor-2` |

The repeated `heretic.gravesLootBodies` ID is different: two independent d6 rolls are an intentional source procedure. However, TABLE currently loops over that repeated ID and prints the identical six-row source table twice. The smallest correction is to deduplicate table display IDs while keeping both roll steps. This is not duplicate source data or permission to remove the second roll.

## Confirmed omitted fields, with false positives removed

These 55 rows are **table-view omissions**, not 55 new missing source needs:

| Canonical table(s) | Rows | Omitted playable fields | What ROLL does |
|---|---:|---|---|
| Core Weapons | 10 | Damage; ammunition on ranged weapons | Generic result also shows only name. |
| Core Armor | 4 | Tier, reduction, test penalties, prices/examples | Generic result also shows only category. |
| Core Sacred and Unclean Powers | 20 | Actual Power effect | Generic result now appends the stored effect; TABLE still omits it. |
| HER Graves Knowledge | 6 | True/false/maybe qualifier | Generic result also omits truth. |
| AITC Holy Places, small/large | 10 | Staffed-place conditional guidance | Generic result appends conditional. Common full guidance is also in the table description. |
| AITC Notable Artefact Type | 2 | Picture/sculpture usage and loss conditions | Source-specific artifact result includes `effectRule`. |
| AITC Special Structures, small/large | 2 | Holy Place settlement-size branch qualification | Generic result appends condition. |
| AITC Street Contents | 1 | Settlement-size selection for Special Structure | Generic result appends conditional. |

Important non-omissions:

- **Depths Enemy Statistics:** all 15 HP, Morale, Attack and Armor blocks already appear in `entry.text`. These are not 60 lost statistics merely because the separate metadata values are unrendered.
- **Core Gear A/B and containers:** quantities, healing, poison, bear-trap tests, bomb damage, shield effect, companion stats and capacities already appear in the full row text.
- **AITC directions, civic buildings, gatherings, hazards, unexpected events and hireling encounter:** most conditional metadata repeats consequences already written in the row. It is not counted again as missing effects.
- **Regional monster quantities and HER encounter quantities:** the dice/quantity appears in the printed text. Access to the creature definition is a separate follow-through question.
- **Depths rare-monster follow-up instructions** and **RECLVSE Roll Twice:** instructions may already be readable even where the generic roller does not automatically execute them. Automation completeness is a separate source-procedure audit.

The raw mechanical-key scan flags **64 tables**. Only the manually reviewed subsets above are included in the 55-row field omission total. No blanket “metadata means missing effect” conclusion is used.

## Selector and matrix fidelity

The additional 64 affected rows are lookup-label problems, separate from effect text:

- `depths.rare.look` and `.feature`: **26 rows** use source card ranks in metadata; TABLE displays numeric indices instead of A–K.
- `depths.rare.intention` and `.special`: **32 rows** store ordered suit pairs; TABLE shows indices instead of the source suits. This materially weakens manual card lookup.
- `depths.enemyStats`: **one final row** loses the printed `16+` qualifier. The statistics themselves are visible.
- `heretic.songbird.spinalHusk`: **one row** displays `6–12` instead of printed `6+`. Blocking a random roll remains correct because the source thresholds overlap.
- `sd.room.exits`: **four rows** retain five values each, but TABLE lacks the five labeled “Special Rooms Uncovered” columns. The pre-roll Source note explains their basis; the actual Dungeon workflow resolves the applicable column.

By contrast, `aitc.merchant-disposition` preserves `12+` using `originalRange`. FER More Lost Souls’ `1:1` and Core tuple coordinates become `11` beside a tuple-dice caption; this is a format difference, not counted as lost data. FER Items & Trinkets displays 100 rather than percentile 00; it remains the same result.

The minimal selector correction is to show the appropriate canonical printed selector and matrix headings. It does not require changing probabilities or adding a new generator.

## Nested and related tables

Core Status, Danger and Sample Rooms provide five intentional `조건부 추가 표` disclosures. **Their child fragments are available** after one deliberate interaction, so the extra disclosure is valid progressive disclosure, not itself a missing-content defect. Weighted two-option child tables currently show an ordered list of texts rather than their original d4 ranges/die label; source-faithful child selectors would improve physical-dice lookup. Core Room generation separately retains the proper conditional roll trace.

Other metadata shapes are not that disclosure. For example, FER Campsite’s dream table is materialized once as `feretory.campsite.campDream`, while legacy `followUp`, `subtableId` and `followupTable` keys do not automatically become clickable rows. `followUpOracleIds` and `fixedLookups` can create result-level links. A named child table in text is not equivalent to a complete connected procedure; the existing book rows record those gaps.

There are also **42 tables with top-level descriptions** that do not appear inside TABLE. This count is informational, not 42 asserted missing rules. Some descriptions are useful procedure guidance, others merely explain the table. Source notes appear in the initial reference disclosure; a generated result uses its result provenance and may omit the original table-level note. The smallest safe improvement is preserving relevant common guidance with the inspected table, without making default result cards longer.

## Why 18 tables deliberately do not roll

| Reason | Canonical tables |
|---|---|
| Printed selection die not explicit; avoid silently inventing one | `core.contacts`, `core.hereticalPriestOrigins`, `feretory.philosopherItem`, `feretory.ochreTablets`, `reclvse.class.brute.powers`, `reclvse.class.beast.powers`, `heretic.songbird.instruments`, `heretic.vicar.blessings` |
| Card rank / dependent ordered card suits | `depths.rare.look`, `.feature`, `.intention`, `.special` |
| Player chooses an Omen modification | `depths.rare.easier` |
| Requires player/context modifier and an open-ended lookup | `depths.enemyStats`, `aitc.merchant-disposition` |
| Without-replacement scenario state required | `heretic.nurse.corridorNorth` |
| Supplied final source sentence clipped | `heretic.curseCure` |
| Overlapping source thresholds / unresolved interpretation | `heretic.songbird.spinalHusk` |

These restrictions are intentional, not 18 missing randomizers. RECLVSE’s class charts say choose or roll but do not print a die token; their stricter current policy is stated explicitly. If a future implementation authorizes an inferred selection convention, it must be labeled as app policy. Card and conditional tables require their actual documented inputs. A source-trace badge alone cannot resolve missing source text or ambiguity.

## Verification and reproduction

Run `python3 docs/pdf-escape-audit/tools/table_access_audit.py`. It consumes fresh registry, reference, app-inventory and table-search snapshots, validates all 562 IDs/routes and the 18 deliberate non-roll states, and links flagged tables to existing book-audit need IDs. The audit uses the actual render code in `ReferenceWorkbench.tsx`, formatter in `referenceReading.ts`, grouping in `data/oracles/library.ts`, and execution in `oracleRoller.ts` / `referenceExecution.ts`.

These are loaded-data baseline capabilities. They do not claim that every possible private-data failure has been browser tested here. The coordinating report owns real browser acceptance and private-data loading tests. No application behavior was changed during this inventory.
