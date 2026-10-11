# Late QA regression review — 2026-10-11

This is a separate targeted supplement for `tests/full-site-qa-regression.test.ts`, added after the completed seven-file BMAD TEA run. The original `target-tests` score/ledger and authoritative reviewed-file manifest remain unchanged. This supplement is a test-integrity review using the same pinned criteria, not a second completed BMAD workflow or a new coverage/release gate.

The complete 125-line test file was read. It contains one `describe`, three `it` cases, a reusable ReferenceEntry builder, controlled RNG, unconditional exact assertions and fixed nonempty case sets. Changed source sections were read at `references.ts:1130–1173`, `resultRelationships.ts:257–312`, and `ruleFaithfulReferences.ts:281–337`; this does not claim full-file source review or an independent new rulebook read.

| Case | Evidence integrity | Boundary |
| --- | --- | --- |
| Late supplied book reference | Calls actual buildReferenceRegistry with an invented source and supplied rule; asserts exact `RULE 1` and exact related ID. The expected value is independent of the production count helper. | Synthetic addition validates the ordering defect. Storage worker also actually opened DEP: RULE16 summary and 16 expanded entries match. |
| Street quantity follow-up | Calls actual rowResultRelationships; asserts no quantity-row follow-up and retains one real row follow-up with exact target ID. Positive control protects existing links against an overbroad fix. | This worker did not independently replay the pre-fix City street in the browser; the coordinator owns that evidence. |
| Active Orakle TR validation | Six explicit invalid values include out-of-range, fraction, NaN and Infinity; throws before RNG consumption. Fixed valid boundaries assert DR11/18; disabled optional DR accepts the otherwise invalid TR and consumes one draw. | TR3–30 is the existing app input range being enforced. It is not reported as a newly discovered universal rulebook limit. |

No failed assertion was suppressed or expectation changed. No hard waits, test-only flags, uncontrolled random outcome expectations, conditional expected-value assertions or skipped cases were found. Fixed arrays guarantee the assertion loops run. The one `describe` supplies subject grouping for all three tests.

Pinned **M2 (Medium)** remains a small structural recommendation: the `OracleRegistry` domain root shape is constructed inline three times (lines31,45,69). The payloads are small and distinct, and no production fault follows from this. A registry builder could be reused if this family grows; no new abstraction or test rewrite was made just to improve a rubric score. This observation is not added to the completed seven-file ledger.

Executed `node --import tsx --test tests/full-site-qa-regression.test.ts`: **3 tests passed, 0 failed, 0 skipped**, one suite, 251.97ms. These domain checks supplement actual browser evidence; they do not certify unvisited controls, all source tables or network/storage-denied environments.

Reviewed file: `tests/full-site-qa-regression.test.ts`. No supplied file was missing or unparseable. Further requirement-to-evidence coverage gating belongs in BMAD `trace` and the coordinator's full-site report.
