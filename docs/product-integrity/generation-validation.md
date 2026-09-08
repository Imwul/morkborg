# Production generation validation

`src/validation/generationValidation.ts` supplies four complementary development/test operations:

- `enumerateGeneratedFields` finds generated fields and source-bearing component groups, plus unexplained scalar content in a newly generated object. Structural IDs, timestamps, source labels and Oracle roll metadata are classified as metadata rather than fictional results. This function is intentionally for **new generation**, never a demand to overwrite legacy saved text.
- `validateGeneratedValue` / `assertGeneratedValueHasSource` resolves source book, page, canonical table, entry, inline child and creature-record identities. It rejects missing provenance, invalid source ranges, unresolved procedures, invented composed source fragments and Korean/helper text replacing verbatim English. Manual edits cannot retain SOURCE_VERBATIM classification. A page-only mechanical reference must match the cited procedure's source pages.
- `validateGeneratorProcedures` resolves every step/table, checks positive counts, duplicate step identities and dependency order, and requires valid source books/pages. Character procedures declare their inherited Core mechanics and class-specific pages separately. EPK regional hunting IDs now resolve through live canonical adapters of existing source records.
- `generationIntegrityReport` produces classification/status counts and exact unresolved cases. It distinguishes an error (missing or inconsistent provenance) from an explicit warning about actual incomplete or conflicting source material.

The only source-free generated structural labels currently permitted by the validator are `ROOM NN` and `Monster`, with the explicit `app.structural-identifier` procedure. This is a narrow policy, not a general escape hatch for invented titles. Creature source-record references resolve to actual installed records via their stable `creatureReferenceId`; a string with a book name is insufficient.

One source validation context caches the registry and identity maps for a batch. Expensive PDF/text verification is not performed during rendering or each roll. Separate Oracle and creature source fingerprints detect changes after the independently recorded PDF audit; fingerprint identity is not misrepresented as a cryptographic signature or a replacement for reading the book.

## Different counts answer different questions

`generation-integrity-report.json` includes three concepts that must not be conflated:

1. **Generator inventory rows:** documented field/source-route paths from the three inventories, including class and creature-preset variants. These are not independent table entries and may share a field name.
2. **Canonical source-entry coverage:** the independently inspected source corpus is reported in `reference-source-coverage.json`. This covers all installed canonical table entries and their source classification, including non-rollable references.
3. **Runtime sample field groups:** generated results and their compatibility mirrors in an actual batch. These counts depend on selected source branches and are not a unique code-field count.

A zero UNSOURCED count answers whether production generation introduced unexplained content. It does **not** erase an honest PARTIAL, CONFLICT or UNAVAILABLE source result. Every remaining source exception is separately listed in `explicitRemainingSourceCases` and in the domain audit documents.

## Automated checks

`tests/generation-integrity.test.ts` contains 13 tests. Negative fixtures intentionally break provenance, source book/page/table/entry IDs, canonical English, composed fragments, manual origin, structural-label policy, dice results and procedure steps. Those cases must fail loudly. The installed-data preflight additionally runs canonical Oracle range validation and source-fingerprint resolution. Real travel and city wrapper results are checked with their explicit source definitions; a single table does not acquire an invented procedure ID. Registry `generatorSteps` and `sourceRefs` are validated as declared rather than flattened back to table lists.

The mixed stress test executes **10,000 production generator passes** across Dungeon/Special Rooms, Character, Monster, EPK regional Monster, NPC, Encounter and Oracle outputs using one cached validation context. It rejects every unexplained field, invalid source ID, malformed die, missing branch and false origin. A separate campaign roundtrip confirms provenance survives JSON serialization and schema validation without losing generated values or source references.

Other focused tests remain in their own suites: 10,000 Special Room preparation passes (40,000 Rooms), creature/NPC/encounter stress tests, component-specific rerolls, manual sibling preservation, deterministic exit context, additive migrations and import/export/duplication behavior.

## Regenerating the report

Run `npx tsx scripts/audit-generation-integrity.mts` with the private installed fixture available at `outputs/morkborg-private-data.json`, or set `MORKBORG_PRIVATE_AUDIT_FIXTURE` to its path. The report script creates an isolated in-memory sample set; it never writes to browser campaigns or the user database. It produces 100 Dungeons / 400 Special Rooms, 100 generic Rooms, 100 TMA Monsters, 100 regional Monsters, 100 NPCs, 100 Encounters, 100 random/classless Characters plus one of every installed class, every rollable Oracle, all 89 eligible creature presets, all nine outcast NPC presets, and 16 travel/city procedure runs.

The script stores full sample material only under ignored `outputs/product-integrity/`. The committed report contains counts, source identities, exceptions and validation outcomes, not a private table database. Failure to load private source data fails the script; no bundled mystery table is substituted.

The utility and stress tests cannot perform human semantic judgment. They complement the independently read 25-Room sample, source-page inspection, generated creature/NPC/encounter review and actual browser acceptance documented elsewhere in this pass.
