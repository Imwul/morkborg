# Oracle / reference integrity audit — 2026-09-08

The canonical registry contains **562 tables / 12,276 English entries**. Every canonical production entry resolves to its supplied source. There are **0 unexplained UNSOURCED entries**, and **1 explicitly PARTIAL source fragment**, detailed below. These are registry-entry counts, not the other generator audits' field counts.

| Classification | English entries |
| --- | ---: |
| SOURCE_VERBATIM | 12,197 |
| SOURCE_COMPOSED | 78 |
| APP_DERIVED | 1 |
| USER_AUTHORED | 0 |
| UNSOURCED | 0 |

11,980 entries match normalized text extracted from the declared supplied PDF pages. 295 required rendered-page or independently separated source-cell comparison; 1 remains incomplete. Normalization ignores Unicode presentation, case, whitespace and punctuation, not words. Classification also accounts for original multi-column headings and linked footnotes even when extraction happens to place those cells together.

[reference-source-coverage.json](reference-source-coverage.json) enumerates all 562 tables, original file SHA-256 hashes, pages, entry counts, translated-entry counts, every exceptional entry ID, transformation and reason. It distinguishes extraction trouble from missing source material. [reference-audit.json](reference-audit.json) inventories 32 generator/presentation field families, 29 separately classified mechanical guidance fields, all 59 registry procedures, six explicit conditional procedure specifications and all 16 requested search queries.

## Source verification and actual corrections

The audit used the supplied Core Bare Bones, full Core, FERETORY, HERETIC, RECLVSE, Sölitary Defilement, Sölitary Depths, Alöne in the Crowd and Mythic 2 PDFs. No reference website supplied replacement content.

- Four Core tables had incomplete page metadata: Sample Rooms PDF73–74, Adventure Sparks PDF69–70, Occultic Contacts PDF68–69, Unclean Scrolls PDF34–35. Row disclosures now identify the actual continued page. Source English, weights and existing saved content are unchanged.
- The Core names' 48 cells are the actual d6×d8 layout, including with only the Core library loaded. There is no uniform fallback over an unlabeled array.
- The campsite dream d6 is a single canonical nested table, `feretory.campsite.campDream`, drawn directly from the parent metadata. It no longer needs a separately reconstructed journey table.
- The nine Eat Prey Kill regional d6 identity tables are live adapters over the existing 54 creature records. `feretory.hunting.*` roll traces now resolve to canonical tables, with FER PDF14–23 / printed12–21. The Grift fifth face stays possible and identifies Lentil Lice without inventing a separate statblock.
- HERETIC Loot the Bodies PDF24 / printed22 says to roll d6 twice. The direct combined tool now preserves both independent results. Its fifth row expands a feet unit without changing the quantity; that row is APP_DERIVED rather than falsely called verbatim.
- Alöne's picture guidance ambiguously said to halve “its value” after mentioning a permanent effect. The supplied PDF11 / printed9 halves the **picture's monetary worth**. The app reminder now says this explicitly; a short Korean helper is separate. The source result and permanent modifier stay unchanged.
- Supplemental procedure parsing previously discarded source pages, groups and notes. Those fields survive parsing and feed explicit source/step definitions.
- A declared source-table gap produces empty text and an explained PARTIAL derivation. It no longer creates a fictional missing-result sentence.

Image-only Depths Chaos Portents PDF5 / printed2 was inspected visually, including all 200 action/subject words. HERETIC's remaining Unheroic Feats ligatures and curses were read from the rendered supplied pages. These are legitimate source wording and layout issues, not license to rewrite the text.

## Unresolved source material

**`heretic.curseCure:12` — HERETIC PDF37 / printed35.** The supplied page physically clips the final sentence after “do not”. The table remains reference-only and PARTIAL. No ending was invented. This is the one unresolved completeness issue in the canonical Oracle entry audit; its source identity is known.

Separate creature audits report missing or conflicting creature statistics and their own source chains. In particular, this registry audit does not turn the source-only Lentil Lice identity into verified stats.

## Exact city and journey procedures

- Street: Alöne PDF5 and17 / printed3 and15. Adjective d20, type d12, contents d12; only a city/metropolis rolls d2 for the number of independent contents. Exits d4 are optional. Duplicate independent source results are retained.
- Notable Artefacts: Alöne PDF11 / printed9. Type d4. Book/manuscript uses the concerning d12; picture/sculpture uses the three separate depiction d12 columns. Only a sculpture rolls its size d2. Conditions remain instructions and fragments, not invented prose.
- City movement: Alöne PDF5–8. Micro-crawl starts directly with d4 streets. Dérive and City Crawl use independent 2d20 versus the configured source DR and preserve distinct Strong/Weak/Fail branches. Directions, Prayer and Stashing retain their separate DR12/DR14/DR10 and documented follow-ups. Stashing checks occur when retrieving. Daily settlement discovery is exactly one face of d8.
- Daily journey: SD PDF17 / printed15 routes Calendar → weather → road or foraging → resolve the resulting encounters → camp. Weather is not rolled twice by the worksheet. FER road events7/8 follow their repeated-event instruction; final event5/6 changes weather. Road types3/4/5 prompt the separate Presence/Omens DR10 check. Forage5/6 alone adds the village table.
- Campsite: FER PDF9 / printed7, event10 alone follows the dream d6 in both the standalone tool and daily worksheet. Camp recovery is SD PDF8 / printed6: two separate d20+Presence versusDR12, then Strong d6 or Weak d4 HP. Following failed-rest encounter resolution, the retry is the source's50:50 Strong/Weak choice. The app does not automatically narrate or spend supplies.

Six testable definitions in `referenceGeneratorProcedures.ts` expose order, count, condition, dependency and derivation independently of React. Ordinary procedure results retain the original grouped canonical IDs. City/journey roll provenance records which procedure produced it.

The 29 Alöne effect/condition reminders are **APP_DERIVED mechanical guidance**, separately enumerated in the JSON inventory. They are not included among the 12,276 source English entry counts or called verbatim. They were compared against the actual PDF8–13 and15–17 procedures. Short phase labels, dawn state and numeric recovery descriptions are also procedural UI, not fictional source material.

## Translation and search

11,780 entry-level Korean helpers and 8,336 auxiliary dictionary pairs were scanned. All five cases with English at most four whitespace-separated words and Korean longer than24characters were reviewed, plus the15largest length ratios and regional proper nouns. The flagged text faithfully expands source intensifiers or slash-separated alternatives; no invented motivation or narrative was found. This is **not** a claim of exhaustive bilingual proofreading of every helper. Canonical English remains primary. Changing Korean metadata does not change routing, table selection or source attestation.

All16 requested play queries have an executable useful first result. `treasure` now prioritizes Core treasure, `armor` the usable Core armor/shield rule, and `travel` the SD daily procedure. Reaction, Morale, Broken, Corpse, Useful Item, Sarkash Monster, Kergüs Monster, Graven-Tosk, Room, NPC, Rest, Omens and Miseries also have explicit regression expectations. After typing the query, the first result's direct ROLL/OPEN requires one click. Browser-level interaction counting is in the overall acceptance report.

## Persistence, failure and assertions

Oracle provenance travels inside existing `metadata`, so source English, source/table/entry IDs, roll traces, classification, status, procedure and dataset version survive existing JSON structures. Optional undefined source fields are omitted. The city's local storage schema now preserves the added source role and status instead of stripping them. Import resolves table and inline row IDs, creature entries, procedure IDs and every roll source; missing historical IDs are retained as UNRESOLVED LEGACY SOURCE without replacing any saved text or manual origin. Fixed lookups and city follow-ups use canonical row provenance rather than generic table metadata.

Production private loading uses the published private source pack or IndexedDB cache. Failure does not switch to mystery content. The explicit development `/rules` fixture is an older source edition (300 supplemental tables versus359 in the current local private bundle), not synthetic fallback prose. No private dataset was published during this audit. Existing saved campaign content was not regenerated.

Validation checks source/table identity, ranges, duplicate IDs, grouped procedure divergence, conditional links, fixed lookups and generated roll provenance. The source attestation fingerprint includes book/page/dice, original English, inline follow-ups and mechanical metadata; changing these removes VERIFIED. Secondary Korean and injected audit metadata are excluded. This fingerprint is a change detector, **not cryptographic authentication**; the report separately stores supplied-PDF SHA-256 hashes. Registry validation runs once for each installed immutable pack pair, not on every React render or roll.

10,000 seeded canonical rolls checked exact English, resolvable IDs, source metadata and persistence. Targeted regression runs also cover city branches, source-only creatures, first-result ranking, continued pages, translation independence and late network failures. Overall lint/build/browser evidence is reported by the integration pass.

## Reproduce without publishing private data

Use the supplied private bundle locally, with `MORKBORG_PRIVATE_AUDIT_FIXTURE` if necessary:

```sh
node --import tsx scripts/audit-reference-workbench.ts
node --import tsx --test tests/oracle-source-integrity.test.ts
```

`audit-reference-source.py` accepts an exported live registry JSON, locally extracted PDF text, and optional repeated `--source-root` paths. It emits metadata-only coverage and attestation files. Text extraction and rendered source pages remain ignored local QA artifacts; do not commit the private bundle or extracted books. Visual confirmations in that script document this audit's actual rendered-page reading and must not be used to bless a changed private dataset without repeating that review.

The six dedicated import-source-resolution regressions additionally exercise removed rows, removed inline children, stale procedure/roll IDs, valid page-only rules and stable neutral IDs, exact creature identities and conservative repeated import.
