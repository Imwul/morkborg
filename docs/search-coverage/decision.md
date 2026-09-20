# Search Coverage — pre-implementation decision

Baseline commit: `7957bce`. Production was unchanged when this audit and decision were recorded.

- Full suite: 862/862, failure/skip 0. Gameplay probes: unchanged 33/33.
- References 1001, tables 546, rollable 518, rows 12310, creatures 95, books 9.
- Actual Korean secondary titles: 347. Tier A 257, approved B 7, C 83 (82 composed fallbacks and one unrelated global dictionary hit).
- Trusted secondary names: 264; target present 196, first 179, target missing 68 (58 queries have no results at all), present but not first 17.
- One trusted normalized collision group: 권능, two distinct Powers references. Excluding those two references, 262 unambiguous trusted names have 179 first results.
- Separately, 36 primary display titles contain Korean and all 36 are first-result correct. Do not mix this denominator with the 347 secondary titles.
- Creature record Korean names: 57/57 first (58 nonempty ko.name fields include one Latin identity mapping). Two additional full-title dictionary mappings yield 59 creatures with explicit Hangul names. Procedure-kind references 69, OracleProcedures 58; trusted displayed Korean procedure names 4/4 first (two secondary, two primary).
- Nine book abbreviations and type/source/relationship/formula labels remain presentation/source vocabulary, not translated-title aliases.

## Approved change

Create a derived, non-persistent search-title read layer, preserving registry entries and display fields. Read existing `titleTranslationKo`; normalized whole-title notes translations; the exact `definition.tableEntry` row's translated text only when its original text equals the reference title; existing static whole-title UI vocabulary; existing explicit creature Korean name aliases. No generated translation function, reading result, child result, relationship text, body fragment or inferred composition enters this layer.

The 99 trusted secondary titles not currently carried by `titleTranslationKo` comprise 78 exact own-row translations, 8 normalized dictionary matches, 9 existing UI names and 4 already-searchable creature names. Their metadata is read, not copied into aliases or canonical fields. Existing explicit names are polished by the same pure display formatter. Conflicting normalized dictionary values are not silently certified. Preserve the UI vocabulary's existing exact override where applicable.

Rank a normalized exact trusted title above incidental descriptions, source mentions and broad alias fragments. Preserve existing English canonical/intention ranking, including Death, Shield and the 33 fixed probes. True identical names remain multiple source identities; no arbitrary winner or name-based merge. Search already iterates unique registry entries; paired aliases resolve via byId rather than producing separate entries, so no new dedup system is needed.

Expected coverage: all 264 trusted secondary targets present, all 262 unambiguous targets first; both Powers identities searchable in the exact collision group. This is a hypothesis to verify, not a completed result. Fallback coverage is not a success metric and remains intentionally uncertified.

No source mutation, translation rewrite, bulk alias list, search UI change, morphology/fuzzy/semantic service, relationship graph change, persistence change or dice change.

Private per-reference inventory and origin evidence: `outputs/search-coverage/display-search-audit.json`, `display-pipeline-provenance.json`, `identity-audit.json`. These remain outside the public build.

## Full-regression addendum

The first implementation made every trusted title match outrank every existing intent alias. Its full-suite run exposed **three failures in unchanged existing tests**: two checks for `죽음 → Core Broken / Death` and one for `회복 → Core Rest / Food / Infection`. The 33 narrower play-intent probes alone did not expose these conflicts. The failing assertions in `tests/batch3-core.test.ts` and `tests/pdf-remediation-batch-1.test.ts` remain unchanged.

The title-only collision audit was therefore insufficient to decide ranking. Existing exact curated Korean intent aliases also collide with six displayed-name queries: 방어구, 권능, 죽음, 두루마리, 방패 and 회복. These involve seven trusted title records because 권능 names two separate Powers tables. The records remain valid title identities; their short Korean query is simply not globally unambiguous.

The final ranking preserves the existing explicit curated intent route for an exact Korean alias while keeping the title target immediately available. It does not protect partial aliases, generated translations, incidental body words or inferred meanings. This is the conservative implementation of the requirement to preserve existing aliases. The two Powers tables now follow Core casting at ranks 2 and 3; the other five title records follow their established Core intent at rank 2.

The original frozen cohort and original before/after ranks remain in the report. Do not claim 262/262 first results: that original denominator excluded only title-versus-title ambiguity. The corrected distinction is **264/264 trusted targets retrieved**, **257/262 first in the original title-only-unambiguous cohort**, and **257/257 first after explicitly accounting for the seven true title/intent-ambiguous records**. This lower first-result total is intentional regression protection, not a missing-title failure or a changed query/expected target.

Actual browser testing also caught the browse surface recreating the `{ entries, byId }` wrapper. The derived WeakMap is now keyed by the shared immutable `entries` array, and a dedicated regression exercises this actual wrapper behavior. New imported packs build a new array and do not reuse the old vocabulary.
