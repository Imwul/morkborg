# Independent artifact review

> Completion recheck: current application HEAD `479cbd765b4168eeaeee27f921bf4b0a6615c51b`. The original page/browser observations below retain their audit baseline. [CURRENT-HEAD-RECHECK.md](CURRENT-HEAD-RECHECK.md) records the newer rolled Power effects, English casting ranking and remaining Omens/search gaps. Final matrix/coverage use that recheck; historical browser results are not claimed to be current failures.

Baseline: `a50d2425deb9a4e9c7e7abb0983dd4c34c68c116`. This is a bounded review of audit artifacts, not another application change or a complete second reading of every supplement. Core sources were independently read in full; other agents' findings were checked for schema, identity, source-scope and aggregation consistency as they arrived.

## Checks completed

- Core's 518 source-location rows represent **275 unique needs**, not 518 independent coverage opportunities. The 243 Bare Bones needs share IDs with their Full Edition counterparts. The Full Edition contributes 32 additional needs. The two editions' iron-nail prices and Foul Psychompomp/Psychopomp spelling remain explicitly different source evidence for the same lookup need.
- Every reviewed row has one scalar primary classification from the six allowed values. No duplicate row ID or duplicate same-book need ID was found. No shared need has conflicting classifications in the currently delivered rows.
- Every cited `evidence.tableIds` identifier resolves to the freshly built canonical registry or documented procedure. Referenced code paths exist. This does not prove every cited line is the complete implementation; the individual source/reading-path inspections supply that evidence.
- Source page arrays fit the inventoried physical page counts for recognized source IDs. Core's Markdown ledgers account for every physical page exactly once: 76 Bare Bones and 96 Full Edition. Unnumbered continuation/art/adventure pages are labeled as such rather than assigned fictitious printed numbers.
- All twenty Core Powers and all six base classes were assessed separately. A Power name in a row is not considered usable effect coverage. Each class's thirty named features plus eight Herbmaster decoctions was examined independently of its base rules.
- Missing mechanics are distinguished from inaccessible mechanics. `metadata.effect` and `metadata.damage` exist but do not reach Reference Desk ROLL/TABLE; these are PARTIAL. Complete named class effects that can be read in a parent TABLE are PRESENT_BUT_INDIRECT. Base class rules are PARTIAL because they require creating a Character; there is no standalone class reference. Root's fresh Fanged Deserter browser inspection confirms the generated class rules themselves remain complete.

## Context claims corrected during review

`ObjectPlayTools` has no mounted call site; PlayMode imports only its state-control exports. Declared context recommendations therefore do not prove that saved Character, Monster or NPC pages contain Quick Tools. Core's `contextLinked` fields were conservatively rebuilt from mounted Journey/City/Dungeon controls and specifically identified Desk RELATED routes. A generated value or source tag alone is not counted as a context tool.

The Core casting rule was changed from RESOLVED to PRESENT_BUT_INDIRECT after the actual ordinary `Powers` query surfaced Mythic, RECLVSE, Fletcher and Omens ahead of Core Using Powers. Its mechanics remain complete. The search gap is attached to the same play need, not added as another missing-rule row.

Core totals after these corrections:

| Source | RESOLVED | INDIRECT | PARTIAL | MISSING | PDF APPROPRIATE | SOURCE UNAVAILABLE |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Bare Bones | 56 | 69 | 73 | 42 | 3 | 0 |
| Full Edition | 64 | 74 | 76 | 51 | 10 | 0 |

## Source-limit and scope checks

The inspected `MB_Cheatsheet.pdf` is for **Mythic Bastionland**, not MÖRK BORG. Both pages were rendered/read, including the empty-text-layer first page. Exclude its mechanics from MÖRK BORG needs and coverage metrics; preserve its two inspected pages in the source inventory with OUT_OF_SCOPE treatment.

HERETIC's clipped curse-cure result and Staff of Awful Light's unstated effect are correctly described as supplied-source limits. Neither should enter an implementation-failure count. Likewise, a Mythic reference to the separate Adventure Crafter does not make that external book's unprovided tables an app omission. SOURCE_UNAVAILABLE can retain play-impact severity, but must be reported separately from fixable implementation gaps.

Long-form material and appropriate paper worksheets must not inflate an implementation-failure denominator. Do not compute a percentage from total Oracle table rows: a table with a hundred playable prompt entries is still a different unit from a named Power whose entire effect is hidden.

## Review findings and dispositions

These findings were identified against intermediate files and corrected by their owners. The completed all-book aggregation now supersedes this intermediate snapshot; its correction history is retained below.

1. `mythic-extra-rows.json` arrived with audit `bookId: mythic2`, while `source-inventory.json` and `mythic-rows.json` use `mythic`. **Corrected:** the additional rows now use `mythic`. Canonical Oracle IDs retain `mythic2`.
2. The main Mythic rows changed 52 RESOLVED score triples to null, while the current schema permits null only for PDF_APPROPRIATE. **Corrected:** ROW-SCHEMA now explicitly permits null score triples for RESOLVED as well as PDF_APPROPRIATE. The cross-validator follows the clarified schema; implementation ranking excludes both.
3. `mythic-art-and-forms` already includes the Adventure Journal at PDF77; `mythic-paper-journal` counted the identical appendix reprint at PDF193 as another need. Both fresh page texts have the same fields/instructions. **Corrected:** PDF77 was removed from the general art/form need and added beside PDF193 to the one Journal need. Both page locations remain inspectable. Other appendix sheets reviewed already group their reprints under one need: Keyed Scenes 154/224 and Adventure Features 161/225.

Historical intermediate cross-validation snapshot: **951 source-location rows, 705 unique needs, zero schema/source-ID errors and zero duplicate-classification conflicts** across Core, FERETORY/HERETIC/small aids and both Mythic row files. This intermediate snapshot excluded the separately reviewed solo/city rows and is not the final coverage denominator.

Private audit utility: `outputs/pdf-escape-audit/core-review/cross_validate.py` checks the current row files and writes `cross-validation.json`. It intentionally fails on unresolved schema/source-ID discrepancies instead of silently accepting unknown audit books. Its intermediate counts are superseded by the committed all-book validator and final MASTER totals.

No production code, private source data, saved Campaigns, UI, generator, schema, Git history, remote or deployment was changed by this review.

## Completion review

The final validator covers all 1,520 source rows, 1,268 unique main-book needs, 1,220 play-relevant needs and 793 physical pages across 14 supplied documents. Two page-ledger links still used pre-dedup row IDs (Cursed Trout and Alöne Gunsmith); they now resolve to the shared FERETORY/HERETIC need IDs. No need was regenerated or silently removed.

Current-HEAD checks also caught that adding 마법 to the priority map did not make it a searchable candidate. The browser still returns no result. English Power ranking and rolled Power effects are credited as corrected by the existing HEAD; table/named lookup and Omens precision remain explicit findings. See [validation result](data/artifact-validation.json) and [current recheck](CURRENT-HEAD-RECHECK.md).
