# Source authority / application policy boundary

This pass changes explanatory metadata and disclosure presentation. It does not change a table entry, generation probability, procedure step, monster statistic, Korean source helper, or previously saved campaign text.

## Findings and classifications

| Choice | Authority | Evidence / implementation |
| --- | --- | --- |
| Four Special Room preparation slots | SOURCE_PROCEDURE | Sölitary Defilement PDF19 / printed17 explicitly lists Special Rooms 1–4 and requires uncovering four. |
| Core Sample Rooms d4 × d6 plus the selected row's conditional child | SOURCE_PROCEDURE | Core PDF73–74 / printed73–74; the existing verified roll sequence is unchanged. |
| Filling those SD slots using Core Sample Rooms | APP_POLICY | SD permits DNGNGEN or manually filled worksheets; it does not direct the user to this Core table. Previously this distinction was only a note on an SD “routing” citation. Now it is a separate authority entry. |
| Region weighting | APP_POLICY | Existing explicit region tags change selection probability among valid source entries. The marker appears only when weighting actually applies. It is separate from official Sölitary Depths creature routing. |
| ROOM numbers and neutral “Monster” labels | APP_POLICY | Application identifiers, not purported rulebook names. |
| Dungeon dossier's mixed Core / RECLVSE field assignment | APP_POLICY | Selection of available reference fields, not a single mandatory book procedure. |
| NPC workbench's cross-book field selection | APP_POLICY | Each selected field keeps its own source; the combination is an application convenience. |
| Static verified creature-record lookup | APP_POLICY | Retrieving an existing statblock is not a new monster creation procedure. Its individual text and stats still have PRIMARY SOURCE. |
| Side-by-side result/stat/field grouping | APP_POLICY | Presentation grouping does not imply a required sequence of rolls. |
| Depths regional monster routing | SOURCE_PROCEDURE + ROUTING SOURCE | The exact source routing table still selects the verified creature reference. No arbitrary weighting policy is attached. |
| Manual edits | MANUAL | Original references remain historical evidence; the visible edited text is not labeled verbatim. |

## Model

`GeneratedValueProvenance.authority?: GenerationAuthority[]`, where each item has `kind: SOURCE_PROCEDURE | APP_POLICY`, a stable ID, optional concise description and optional exact source references. `GeneratorProcedure.authority` and `OracleProcedure.authority` record the distinction at procedure level. `ReferenceReading.authority` carries explanations for a reference result whose presentation combines a routed roll and retrieved stats.

All additions are optional for existing saved data. `generatedValueSchema` preserves new authority metadata through JSON validation. Edited values keep the historical authority along with their historical source text and roll. Import checks newly included authority source references without replacing saved text.

`generationAuthority.ts` contains application policy descriptions and resolvers. `sourceProcedureIds.json` contains identifiers of the already audited source procedures, not private table contents. Unknown legacy procedure IDs are not promoted to source-defined procedures. Explicit result authority takes precedence over an inferred generic table explanation.

## Disclosure

One closed SOURCE disclosure distinguishes PRIMARY SOURCE, ROUTING SOURCE, SOURCE PROCEDURE, APP POLICY and MANUAL. New authority labels never appear as always-visible card badges. Citation details already shown under PRIMARY / ROUTING are not repeated in the procedure proof area. App policies do not acquire fictional book/page citations.

The Core Special Room's former SD routing citation is shown as the separate SD preparation procedure. Old saved provenance is not rewritten; this is a deterministic presentation correction for the known legacy binding.

Source table links use the new `desk.openTable` operation when available, with the previous `activate` fallback retained for older context consumers. This opens the actual table inspector directly without adding another table-disclosure click. Root owns that inspector and browser acceptance.

Regional reference results now retain the original routed Oracle result and explicit authority metadata. Root/creature work on compact result text remains separate. The original roll, exact primary/routing sources and all stat values remain available.

## Validation and regression coverage

Added `tests/generation-authority.test.ts` (9 tests): closed disclosure hierarchy; manual origin; legacy citation interpretation without mutation; genuine routing vs UI grouping; schema round-trip; unknown-procedure handling; actual four Special Rooms before/after edit/reroll; actual weighted vs unweighted rolls; rejection of a policy falsely claiming source authority; actual Sarkash monster disclosure and explicit-authority precedence.

Development validation rejects unknown application policies, app policies presented as source procedures, unknown source-procedure authorities and unresolved authority book/table references. Existing generated-value source/range checks remain intact.

Verification: 70 existing/new focused source, generator, import and persistence tests passed, including all 9 new authority tests. These include existing 10,000 mixed generation passes, 10,000 canonical Oracle rolls and 40,000 Special Room generation coverage. TypeScript and lint passed. Root performs final full-suite and visual acceptance.

No commit, push, private dataset re-encryption or deployment was performed by this subtask.
