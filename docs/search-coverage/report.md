# Search Coverage Pass

Baseline: `7957bce`. This report separates the actual UI display audit, certified title coverage and ordinary play-intent probes. A title appearing in Hangul does not by itself establish a trusted search name. Private per-reference inventories remain under ignored `outputs/search-coverage/`; this report contains counts, code paths and short identity examples only.

## A. Registry and baseline

The unmodified baseline suite passed **862/862**, with **0 failures and 0 skipped tests**. The existing 33 play-intent probes were run unchanged and achieved **33/33 first-result accuracy**.

| Registry item | Baseline | Final |
|---|---:|---:|
| Reference | 1,001 | 1,001 |
| Table | 546 | 546 |
| Rollable table | 518 | 518 |
| Original row | 12,310 | 12,310 |
| Creature reference | 95 | 95 |
| Book | 9 | 9 |
| Procedure-kind reference | 69 | 69 |
| OracleProcedure | 58 | 58 |

Existing search metadata included 165 references with `titleTranslationKo`, 100 with `summaryTranslationKo`, 105 with navigation aliases, and 336 alias strings. Of those references, 88 had Korean aliases. A Korean summary existed on 645 references and translated definition body blocks on 86; these body translations are not all reference names.

## B. Actual display-name pipeline

The main heading and search/Related rows render `referenceShortName(entry)` as the primary name and `<Translation text={entry.title} translation={entry.titleTranslationKo} />` as the secondary name. The secondary path uses the full registry title, even when the primary name is shortened. Recent/Pin shortcuts and Workbench headings display the shortened name without independently running the translation helper.

`buildReferenceRegistry.add()` supplies `titleTranslationKo` from an explicit seed value or a raw, case-sensitive whole-title lookup in `rules.notes.translations`. `Translation` prefers this explicit prop, otherwise calls `translateGeneratedText`, applies `polishKoreanTranslation`, and suppresses empty or unchanged NFC-identical output.

`translateGeneratedText` is broader than a title dictionary. Its exact map is populated from static UI vocabulary, all translated rule rows, translated creature fields, oracle row/block/guidance text and notes translations. It can also assemble known phrases. Case/whitespace normalization differs from the registry's exact-key lookup. An exact global hit may belong to a different source row; a generated composite may not be a reviewed name. Neither is automatically title provenance.

The pipeline audit found 182 actually rendered Korean secondary names without `titleTranslationKo`: 100 exact global-map hits and 82 generated/composed fallbacks. An additional 22 unchanged proper-name helper returns were correctly excluded because the UI suppresses them. Nine registry title keys had competing helper strings in the broad global translation map; explicit display precedence matters.

App shortcut text, nine source-book abbreviations, reference types, relationship labels, formulas and keyboard labels are separate presentation/navigation vocabulary. They were not harvested as translated reference titles.

The actual retrieval path is `ReferenceWorkbench → searchReferences` or `browseReferences → searchReferences`. Its complete field and normalization boundaries are:

| Step | Existing pipeline and change boundary |
|---|---|
| 1. Registry identity | Build unique `entries`; `byId` can contain aliases resolving to those same objects. Search iterates `entries`, not all alias keys. |
| 2. Canonical title | The original `entry.title` is tokenized unchanged. Full source names remain searchable; the shortened display title is not a new source identity. |
| 3. Explicit Korean title | Existing `titleTranslationKo` comes from explicit seeds or the raw whole-title notes lookup. Display formatting does not change this stored field. |
| 4. Derived trusted title | The new read layer adds only the certified full display-name form described in sections C–F, with provenance. It does not mutate the entry. |
| 5. Existing aliases | `searchAliases.ko/en` remain the same curated navigation/play-intent fields, including own creature names. The new layer is not a bulk alias list. |
| 6. Descriptions and summaries | Existing `summary`, `summaryTranslationKo` and `keywords` remain searchable metadata. A table description participates only through its existing registry projection, not a new scan of all table rows. |
| 7. Source and type metadata | Existing metadata includes entry ID, kind, contexts, source book title, recognized book abbreviation and source table title. Source text is lower-priority evidence, not a certified title. |
| 8. Query folding | NFD decomposition, accent-mark removal, NFC recomposition, lowercase, apostrophe removal and punctuation-to-space normalization are unchanged. Exact name/intent checks use this normalized form. |
| 9. Token vocabulary | Existing type/plural vocabulary still maps such forms as 표/table/tables to oracle, 생성기/절차 to procedure and 던전 to dungeon. Exact trusted-name comparison deliberately precedes this vocabulary substitution. |
| 10. Domain filters | Existing kind, context and region restrictions are applied to candidates before scoring. A strong name match does not bypass them. |
| 11. Preferred intent | Existing `COMMON_REFERENCE_QUERIES` and exact regional-monster intents remain. The new exact Korean curated-alias protection uses existing mappings only. |
| 12. Eligibility | Except for an exact alias or established preferred ID, every normalized query token must match the beginning of a token in existing title/metadata. There is no fuzzy or semantic expansion. |
| 13. Scoring | Exact certified names or exact curated Korean intents receive the same additional 500-point qualification. Existing exact-alias, title-prefix/phrase, definition-name, preferred-intent, availability and source/type scores remain. Partial aliases get no new exact-intent protection. |
| 14. Ordering and identity | Sort by descending score, then existing title ordering. No merge by translated spelling occurs; same-name references from different sources remain distinct. |
| 15. Limits and browse filters | The domain default remains 40 results; the main quick-search path requests 32. Browse searches the unique registry then applies its existing book/kind/context/Pin/Recent filters and current list limit (24 in the captured results). |
| 16. Display and exclusions | Results retain their existing primary/secondary title and source presentation. Reading values, explicit child results, relationship labels/adjacency, Dungeon fields, campaign state and private notes are not added to the search corpus. |

## C. Provenance classification and baseline coverage

The inventory covers all 1,001 actual registry entries. It classifies 347 Korean secondary titles:

- **Tier A: 257.** Existing explicit title translations, exact full-title dictionary mappings, exact translated source rows owned by a definition, exact curated UI names, or the matching creature's explicit Korean name.
- **Tier B: 7.** Existing deterministic RECLVSE application group names. These are documented app display identities rather than newly translated source content.
- **Tier C: 83.** 82 generated/composed display fallbacks and one exact global hit whose translation belongs to an unrelated source row.

| Baseline secondary-title population | References | Target present | First result | Target absent | Query with no results | Present but not first |
|---|---:|---:|---:|---:|---:|---:|
| All displayed Korean secondary names | 347 | 196 | 179 | 151 | 137 | 17 |
| Tier A | 257 | 195 | 179 | 62 | 56 | 16 |
| Approved Tier B | 7 | 1 | 0 | 6 | 2 | 1 |
| Excluded Tier C | 83 | 0 | 0 | 83 | 79 | 0 |
| Trusted A + B | 264 | 196 | 179 | 68 | 58 | 17 |
| Trusted names without another identical trusted title | 262 | 194 | 179 | 68 | 58 | 15 |

The initial title-versus-title audit found one normalized collision group: **권능**, naming two distinct Powers references (`oracle:mythic2.meaning.powers` and `oracle:reclvse.powers`). Both source identities must remain searchable. The original 262-reference cohort excludes only those two records; it does not account for existing gameplay-intent aliases. The additional intent collisions discovered by full regression are explained in section F, without replacing the frozen before/after cohort.

Separately, **36 primary display titles contain Korean and all 36 were first-result correct**. Raw registry titles containing Korean number 39, but three are shortened in the primary UI. These are different populations from the 347 secondary titles and must not be combined.

## D. Concrete missing-name and ownership findings

The 99 trusted secondary names absent from the existing `titleTranslationKo` field comprise 78 exact own-row translations, eight normalized whole-title dictionary matches, nine existing UI names and four already-searchable creature names. Missing `titleTranslationKo` does not necessarily mean missing retrieval: current aliases/body metadata already covered some of them.

| Case | Baseline evidence | Safe treatment |
|---|---|---|
| Battle-axe → 전투 도끼; Club → 곤봉 | The exact `definition.tableEntry` row owns the displayed `metadata.ko`; the displayed names did not retrieve these definitions. | Read the owned row only when its original text equals the full reference title. |
| Signs Of Ambush → 매복의 징후 | Whole-title notes mapping exists after display case/whitespace normalization, but raw registry lookup misses it. | Normalize only the lookup key; do not translate or rewrite source titles. |
| Zweihänder → 양손대검 | The existing final UI vocabulary overrides the own-row helper 양손검. | Preserve actual explicit display precedence. |
| Fanged Deserter and other class titles | Explicit registry title helpers differ from global vocabulary fallbacks. | Prefer the existing explicit title prop. |
| Mythic Curses → 저주 | The global display dictionary inherited the same English word from an AITC festival row; there is no title-bound mapping for this Mythic table. | Exclude the unrelated exact global hit. |
| Room Shape → 방 빚어내다 | Phrase composition produces the visible fallback, without a reviewed whole-title identity. | Exclude composed fallback; do not certify it merely because it is visible. |

Other normalized dictionary gaps were Resource-Loss Hazards, Travel-Cost Hazards, Grappling hook, Magnesium strip, Small wagon, Tent and Sharp needle. No new translations were authored.

## E. Creature, procedure and identity boundaries

The 95 creature references derive from 89 raw records plus existing source-backed projections. There are 58 nonempty `ko.name` fields, of which 57 contain Hangul; the remaining field is a Latin identity mapping. All **57/57 own Hangul names were already first-result correct**. Two additional exact full-title dictionary mappings give **59 creatures with an explicit Hangul name form**; all 59 were already retrievable first by those forms.

Creature titles can be constructed as `name · concept`. A dictionary translation of only a name or concept is not a reviewed translation of the complete title. The audit found possible component mappings for 69 names and 31 concepts, with 31 possible compositions, but these are not counted as approved displayed-title coverage and are not a mandate to synthesize names. `record.ko.concept` has no current populated records.

All 95 full creature titles and all 69 procedure titles retrieved their own target first at baseline. Searching only the English name Half-Billed Raven reaches two legitimate FER/HER source identities; one is necessarily second. They must not be merged by name. The four trusted Korean displayed procedure names—two secondary and two primary—were already **4/4 first-result correct**. Broader Korean intent aliases are a separate audit population.

Paired oracle aliases already resolve to one canonical registry entry through `byId`. Search iterates unique entries. Alias spellings must not create duplicate search rows or extra ranking votes. Exact identical Korean names across genuinely distinct sources retain distinct IDs.

## F. Implementation decision

The pre-implementation decision is recorded in [decision.md](./decision.md). The approved scope is a small, derived, non-persistent search-title read layer. It may consume existing explicit title translations, normalized whole-title notes mappings, owned exact-row translations, exact curated UI vocabulary and existing explicit creature names. It must not call the generated display translator, concatenate body fragments, index reading/child results, or harvest relationship labels.

The implemented layer mirrors the existing title display precedence and rejects unresolved normalized dictionary conflicts. Its WeakMap cache is keyed by the built registry's **shared immutable entries array**, not the outer `{ entries, byId }` wrapper. Actual browser testing exposed that the browse surface reconstructs this wrapper; a wrapper-keyed prototype therefore lost the derived names on that surface. Keying by the shared entries array fixes the integration boundary without modifying UI or registry entries, and a dedicated regression reproduces the wrapper. Imported/private pack changes build a new entries array, so the old vocabulary is not reused. No canonical or persistent fields are mutated.

Exact trusted names outrank incidental body/source matches and broad alias fragments. Existing exact curated Korean intent routes remain protected. Genuine identical names remain multiple results rather than an invented winner or name-based deduplication.

The initial global exact-title boost caused three failures in existing full-suite tests: two `죽음 → Core Broken / Death` checks and one `회복 → Core Rest / Food / Infection` check. The tests in `batch3-core.test.ts` and `pdf-remediation-batch-1.test.ts` were not changed or weakened. The implementation was corrected to preserve an existing exact curated Korean alias, without protecting partial matches. The unchanged 33 narrower gameplay probes had passed even in the flawed draft, which is why both the full suite and the broader alias audit matter.

The Korean-intent guard uses the normalized query, so NFC syllables and equivalent NFD text cannot select different ranking policies. No fuzzy or newly inferred synonym behavior was introduced.

Six queries have a real displayed-title versus established-intent ambiguity, covering seven title records: 방어구, 권능 (two Powers references), 죽음, 두루마리, 방패 and 회복. Their existing Core intent remains first; the title is second, or second and third for the two Powers references. These are valid searchable titles, but not unambiguous first-result obligations. The final strict unambiguous title population is 257, while the original frozen 262-title cohort is still reported below.

Independent review of the actual registry found exactly 264 indexed names: 165 explicit titles, eight normalized dictionary titles, nine exact UI names, 78 owned-row titles and four creature names. None differs from its actual displayed title; there are zero indexed names outside the approved displayed population and zero Tier C names in the index. There are no trusted-secondary-name versus canonical-Korean-title collisions in the current registry. The target rank of all 962 English-only canonical title queries remained unchanged. Final suite and actual browser verification are recorded below.

## G. Before / after coverage

| Metric | Before | After |
|---|---:|---:|
| All displayed Korean secondary names | 347 | 347 |
| Tier A / B / C population | 257 / 7 / 83 | 257 / 7 / 83 |
| Tier A targets present / first | 195 / 179 | 257 / 251 |
| Tier B targets present / first | 1 / 0 | 7 / 6 |
| Tier C targets present / first | 0 / 0 | 0 / 0 |
| Trusted displayed secondary names | 264 | 264 |
| Trusted targets present | 196/264 | 264/264 |
| All trusted first result | 179/264 | 257/264 |
| Original frozen cohort, excluding only identical-title collisions | 179/262 | 257/262 |
| Strict unambiguous first result, accounting for existing exact intent aliases | 179/257 | 257/257 |
| Trusted target absent | 68 | 0 |
| Trusted queries with zero results | 58 | 0 |
| Trusted targets present but not first | 17 | 7 (documented ambiguity) |
| Strict unambiguous targets present but not first | 11 | 0 |
| Trusted title-versus-title collision groups | 1 | 1 |
| Korean primary titles first result | 36/36 | 36/36 |
| Own Hangul creature names first result | 57/57 | 57/57 |
| Trusted Korean procedure display names first result | 4/4 | 4/4 |
| Existing fixed play-intent probes | 33/33 | 33/33 |
| Existing curated Korean aliases first result | 120/120 | 120/120 |
| Canonical table titles first result / target present within 32 | 531/546; 546/546 | 531/546; 546/546 |
| Full registry canonical title targets present | 1001/1001 | 1001/1001 |
| English-only canonical title target-rank changes | — | 0 of 962 |

Fallback coverage is deliberately excluded from the success metric. A still-unsearchable malformed display fallback is a translation/display limitation, not evidence that the search layer should index it.

All 68 previously absent trusted targets are now retrieved. Of these, 67 are first and the existing RECLVSE 회복 group is second behind the established Core recovery intent. The six ambiguous query strings retain their source identities and explicit existing intent routes. The first-result number is deliberately lower than the flawed draft's 262/262 claim for the original title-only cohort.

The independent before/after comparison retains all 85 original failure records (68 absent and 17 present-but-not-first). Eleven of the 17 previously misranked targets are now first; the other six preserve existing intent-first behavior. All 264 trusted targets fit within the normal 32-result search limit. The 120 existing curated Korean aliases have zero target-rank changes against the baseline search implementation. All 95 full creature titles and 69 full procedure titles remain first; the original table-title ambiguities and paired aliases remain unchanged.

## H. Browser acceptance

The following are actual browser interactions recorded in `outputs/search-coverage/browser-evidence.json`; the exhaustive counts in section G are separate domain audits.

| Actual browser query or flow | Observed result |
|---|---|
| 매복의 징후 | Signs Of Ambush opens from the correct `oracle:reclvse.signs_of_ambush` result. |
| 전투 도끼 | Battle axe resolves to `definition:core.weaponCatalog:battle-axe`, rather than an unrelated body mention. |
| Battle axe | The same source definition remains the first English-name result. |
| MÖRK BORG BARE BONES EDITION / Sölitary Defilement | The respective source book remains first; book identity is not replaced by a translated-title alias. |
| 전투 도끼 with RCL source filter → clear filter | The unrelated source filter correctly yields zero rows; clearing it restores the one Core definition. |
| RECLVSE · 음수 HP / 죽음 / 회복 | The exact existing RECLVSE rule is retrieved, distinct from the broad Core recovery intent. |
| 권능 | Existing Core Using Powers is first; distinct Mythic and RECLVSE Powers are second and third, with their source labels intact. |
| 죽음 | Existing Broken / Death is first; the named Death source definition remains immediately available second. |
| 시체 수색 / NPC 반응 / 날씨 표 | Core Corpse Plundering / Reaction / Weather remain their respective first results. |
| 안티디어 → open | The matching FER Antideer identity opens its fixed source reading. |
| Zukuma → open | The fixed creature shows all four printed attack rows without choosing a random attack. |
| 던전 준비 → USES Status → USED BY | Existing Dungeon Preparation and its exact forward/reverse source relationships work; Status has no generated result on opening. |
| Room Shape → 방 빚어내다 | The English table opens with the existing generated subtitle; searching that uncertified subtitle returns no result. It was not silently promoted to an alias. |
| zzzxqv 없는이름 918273645 | No results; no invented match. |
| USES / USED BY → translated search → Recent → Copy | Sample Rooms' existing parent and explicit inline child survive; Copy includes the restored child. |
| Workbench reopen → Copy | The same existing Sample Rooms reading remains available and its composed Copy agrees. |
| Stash Item — Weak Hit physical `5` → FOLLOW-UP → 매복의 징후 → Related RCL → Recent → Workbench → Copy | The row-5 NPC follow-up opens NPC · Disposition + Profession with zero result cards. The original Stash reading returns; successful Copy contains the current Stash row, not the earlier Sample Rooms clipboard. |
| Civic Buildings physical `2` → LOOKUP NPC Encounters `#54` → Recent | The target opens the exact fixed selector 54; returning restores Civic row 2 with its own contextual links. The external target is not attached as a compound child. |

Observed clipboard text after both continuity flows:

```text
Sample Rooms

Inscriptions, the motifs are

↳ Hypnotic
```

The mixed Stash flow's final verified clipboard was:

```text
Stash Item — Weak Hit

You surprise an NPC trying to carry your loot away!
```

The mixed flow was counted successful only after checking the Copy success toast and this matching clipboard text; an earlier stale clipboard read was not treated as a pass. Related navigation was checked against the resulting DOM rather than assuming a tool click had completed. Pins were not changed during this pass; their persistence coverage comes from the unchanged automated regressions. Browser observations of no automatic result are not presented as counted RNG calls; RNG-zero assertions belong to the automated trap tests.

## I. Responsive acceptance

Actual browser DOM measurements cover **24 cases: four viewports × six search states**. The states are a short Korean name (`전투 도끼`), long Korean title (`RECLVSE · 음수 HP / 죽음 / 회복`), multiple results (`표`), unknown query, long result title (`RECLVSE Calendar`), and ambiguous name (`권능`). Search and results were not hidden on mobile.

| Viewport | Cases | Search-input width / height | Maximum document overflow | Overflowing result rows |
|---|---:|---:|---:|---:|
| 360 × 800 | 6 | 227 / 44 px | 0 px | 0 |
| 768 × 1024 | 6 | 635 / 44 px | 0 px | 0 |
| 1440 × 1000 | 6 | 728.47 / 44 px | 0 px | 0 |
| 3440 × 1440 | 6 | 2523.73 / 44 px | 0 px | 0 |

Evidence: `outputs/search-coverage/responsive-evidence.json`. Nine PNG captures accompany it: `{360,768,1440,3440}-long-ko.png`, the four matching `-collision.png` files and `360-unknown.png`. The source names and ordinary result presentation retain the existing fonts, colors, input and navigation model; this pass changes search metadata and ranking, not UI layout. On 360 px, a long query does not fit entirely into the 227 px single-line input at once: the input retains its full value and scrolls horizontally in its existing native behavior, without vertical clipping. The result title itself wraps without overflowing.

## J. Integrity and regression

Canonical bundle SHA-256 before and after the change:

`edb000ad6a23ee13ccdb221732e770977cc6f375aca03621c8f0328441ba60c9`

Relationship baseline: 3,103 stored Related edges, 2,127 visible default edges, 79 verified forward procedure pairs, 79 deterministic reverse pairs, 247 contextual edges on 200 rows across 43 tables/references, nine fixed selector lookups, and zero visible self links. Physical input regression covers 12,518 combinations. Core Miseries retains 36 rollable rows/selectors and the separated 7:7 footer with PDF20 provenance; 77 is not a random selector.

The complete before/after integrity JSON is deeply equal, including the canonical hash, all six registry counts, the relationship totals, inline-child depth and selectors, physical combination count and Miseries footer separation. Search titles live in a transient WeakMap and are absent from serialized registry/source data. A new pack rebuilds the derived map; no import/migration schema or local/session storage namespace was added.

No source fixtures, IDs, ranges, weights, exclusions, PDF/source provenance, saved Dungeon/Campaign data, reading-continuity storage, Pins, Recent or Workbench implementation were edited. Search and title reads have a dedicated dice-RNG trap; existing reading/relationship/dice/persistence checks are included in the final full suite below.

Production changes are limited to three domain/helper files: `src/domain/referenceSearchTitles.ts` (derived title evidence), `src/domain/references.ts` (initialization and ranking), and `src/generators/translation.ts` (read-only access to existing exact UI vocabulary). There are no component, stylesheet, font, visual layout or navigation changes.

## K. Automated tests and build

| Check | Baseline | Final |
|---|---:|---:|
| Automated tests | 862/862 | 880/880 |
| New tests | — | 18 |
| Modified existing test files | — | 0 |
| Failed | 0 | 0 |
| Skipped / cancelled | 0 / 0 | 0 / 0 |
| Fixed search probes | 33/33 | 33/33 |
| Lint | — | PASS, exit 0 |
| Production build | — | PASS, exit 0 |
| Privacy/static-file check | — | PASS, 74 static files |
| git diff --check | — | PASS, exit 0 |

The 18 new tests are in `tests/reference-search-coverage.test.ts`. They derive expected title provenance from actual canonical fields and existing UI names rather than trusting an exported audit JSON. They cover all 347 displayed helpers and 264 trusted names; correct recovery and strict unambiguous ranking; the six title/intent collisions; all 120 curated Korean aliases; NFC/NFD/case/spacing; source ownership and unverified/missing rows; generated fallback exclusion; normalized dictionary conflicts; paired aliases; existing creature/procedure names; source/type/context/region filters; pack replacement without stale names; the actual browse wrapper; no canonical mutation; and RNG-free search/title reads.

The existing suite retains its Reading Continuity, physical-input domain, fixed LOOKUP/inline child, relationship/alias/self-link, fixed-creature RNG-zero, explicit generation, import/migration and Pins/Recent/Workbench regressions. Existing assertions were not removed or weakened. The draft's three existing-test failures were resolved by correcting production ranking; the final suite has zero failures.

Final suite duration: **26,661.1 ms**, exit 0. Baseline log: `/tmp/mork-search-coverage-baseline.log`; final log: `/tmp/mork-search-coverage-final-tests.log`; production-build log: `/tmp/mork-search-coverage-build.log`. The build emitted an upstream Node module-registration deprecation notice but passed TypeScript, bundling and public-file privacy checks. Domain query counts and browser cases are not included in the 880 test count.

## L. Remaining boundaries

- The 82 composed display helpers and the unrelated Curses global-map hit remain uncertified; this pass does not rewrite or improve their translations.
- Absent or unknown Korean source names remain absent. No model-generated translation, transliteration, stemming, semantic service or broad word-combination system is introduced.
- Creature name/concept component composition and translated body/block headings remain outside this pass unless they already constitute an explicit, full displayed title. Shortening a translated effect into a name would require a separate reviewed display/source decision.
- Shared source names remain ambiguous source identities. Coverage does not claim every exact name has one uniquely correct target.
- Narrow-screen long queries still require horizontal movement within the existing single-line input; the complete stored query and wrapped result title remain available. No layout redesign was attempted to display a whole long query simultaneously.
- Generic Korean intent shortcuts and book/source abbreviations keep their existing scope. A title read layer is not a new global taxonomy or a relationship-search corpus.
- The pass does not expand search to current readings, explicit child results, saved Dungeon fields, campaign content or private notes, and does not change existing persistence.
