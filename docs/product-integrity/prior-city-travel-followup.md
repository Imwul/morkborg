# Earlier City / Travel requests: follow-up closure

This targeted pass follows commit `ca26155`. It checks the earlier interrupted requests against the current source-faithful implementation; it does not reopen the completed application-wide integrity audit. Source English remains primary. All work here is local; no production deployment or push was performed.

## AITC helper translations: actual data gap fixed

The existing renderer could display separate Korean helper paragraphs, but the installed AITC source rows contained **zero row-level `metadata.ko` values**. The original private bundle had 59 AITC tables / 436 rows. Replaying the real translation loader against the backup gives helpers for 73 of the 364 non-name rows; a further 10 proper-name fragments happened to match generic dictionary words. Earlier shallow estimates counted partial dictionary matches and were not the final coverage measurement.

The corrected private bundle now contains:

- **364 / 364 non-name row helpers**, separately stored from English, including street fragments, directions, prayer, stash, all NPC encounters/defaults, businesses and taverns.
- **29 / 29 conditional/effect helpers**, separate from the English conditional fields.
- **42 / 42 table procedure-description helpers** in the private translation dictionary.
- **72 proper-name components** intentionally retained in English. Their metadata declares this choice, and source-aware rendering does not translate them through unrelated dictionary matches.
- English text, entry IDs, numeric ranges and dice selectors are unchanged. Source SHA256: `55c8e6bfbf503071cb49f52f2fcef25634fdf2da124f2b4d4ff14bd3cd931b7e`.
- All 59 AITC canonical tables retain VERIFIED source status; presentation metadata is excluded from the established English/mechanical source fingerprint.

The 291 previously missing non-name helpers are now present. All 364 rows receive explicit contextual helper data, including those that previously relied on dictionary guesses. `metadata.translation` records app origin, edition `aitc-ko-2026-09-08`, fill-missing update policy, separate guidance, or proper-name preservation. Original English is never replaced.

Translations retain every source dice expression. Reviewed long entries include the tavern's distinct Strong/Weak/Fail effects, NPC #54's conditional guard DR, daily hireling Morale, the civic building guard branches, and artifact effects. Proper nouns and book names remain English. Legitimately strange source mechanics (such as the soldier's leather armour −d4) remain intact.

The actual source row `NPC` also revealed a legacy dictionary entry mapping the word to itself. That identity mapping no longer masks an explicit Korean row helper. Genuine existing Korean dictionary edits retain priority.

## Earlier requests and their current disposition

| Request | Disposition / evidence |
| --- | --- |
| City Crawl prompts need Korean | Fixed in actual private data, beyond the prior synthetic renderer test. `tests/aitc-private-translations.test.ts` renders all rows from the specified real City tables. |
| Group City oracles inside City Crawl | Implemented. `CITY_REFERENCE_GROUPS` in `src/domain/cityCrawlWorkspace.ts`; City workspace renders groups in place. All IDs resolve through the canonical reference index, including aliases. |
| Microcrawl uses Street Descriptor | Implemented. `startCityCrawl` / `createStreet` use the canonical street procedure; Microcrawl rolls its street count without imposing an initial City Crawl Move. |
| Strong / Weak / Miss gate further movement | Implemented and tested in `tests/city-crawl-workspace.test.ts`, `tests/city-procedures.test.ts`. Obstacles must resolve before advancement. |
| City / metropolis street contents | Mechanics already correctly roll **d2 times, 1–2 results**. Corrected misleading UI label that said “2회”. Ordinary settlements still roll once. |
| Distinguish NPC from NPC encounter | Implemented as separate canonical tools and group explanation. AITC backtracking NPC remains an SD NPC; it is not silently routed to the urban encounter table. |
| Directions / prayer / stash AITC 5–6 | Implemented as contextual moves and conditional tables; their previously untranslated actual prompts now have literal helpers. |
| Daily Calendar then Core weather | Implemented by `src/components/JourneyWorkbench.tsx`; Calendar is the daily check, with Core weather next. |
| Travel roads / road events FER | Implemented in `src/domain/journeyProcedure.ts` and `campaignProcedures.ts`, with documented original reroll/conditional branches. |
| Presence or Omens DR10 for animal trails / dangerous path | Implemented once for relevant road outcomes, using one d20 with the chosen modifier. `tests/journey-procedure.test.ts`. |
| Foraging alternative | Implemented as the separate day activity in Journey, using the FER canonical forage table. |
| Wilderness / encounter then camping | Source-defined conditional wilderness and encountered events are resolved before camp. **The earlier request for an unconditional additional encounter after every activity is superseded by the later source-purity instruction**: the app does not invent an extra mandatory encounter roll absent from the source procedure. |
| Settlement discovery 1-in-8 | Implemented once per day, retaining the existing discovery roll instead of rerolling on repeated activity resolution. `JourneyWorkbench` activity handler and journey tests. |
| Camping grouped sources | Implemented with the documented FER event and SD action, including the separate failed-camp retry choice and campsite dream follow-up. Related references remain grouped. |
| Grey Galth Inn FER 54–55 | Menu, innkeeper, patron and name oracles are already canonical. Corrected misleading price-choice-only text: choose the 4s or 2s menu, then roll its **d6**. |
| Three Dead Skulls link | Fixed the dangling Oracle ID. It now opens a **source-only quick reference**, FER PDF56–57 / printed54–55, with the wager/3d6 reminder and explicit original-page referral for payouts, optional rerolls and fights. No automatic gambling procedure was invented. AITC's separate tavern gambling text remains its own source result. |

## Data safety and delivery boundary

Before editing, copied the current private bundle, publisher settings, latest encrypted manifest and ignored fixtures into `outputs/aitc-before-translation/`. The local enrichment script additionally creates a one-time pre-enrichment bundle backup. The script requires SHA256 evidence for every source string before applying a helper and aborts if source wording differs.

Private source English and complete Korean payloads are in ignored private files or encrypted assets, never public JavaScript. `scripts/enrich-aitc-translations.mjs` contains only the enrichment algorithm. Existing nonempty row translations, guidance, dictionaries, English edits, ranges, custom rows and creature definitions survive incremental updates. No campaign data is regenerated.

The existing local publisher prepared an AES-GCM update using the **same established key**. Authenticated decryption matches the entire intended private payload, and the revision increased. This is a prepared local update, **not publication**. Root handles final commit/deployment decisions.

## Verification

`tests/aitc-private-translations.test.ts` adds real-private-fixture coverage, 364-row dice and source-digest checks, original-English rendering, every relevant City prompt, 72-name preservation, conditional helpers, conservative merge behavior, stale-source rejection, and every grouped City reference link. Source-dependent tests explicitly skip when the private fixture is unavailable; they do not substitute synthetic content and claim source coverage.

Scoped run: **65 tests passed**, 0 failed, including existing private update crypto/merge, source integrity, City procedures, City workspace, City reference and translation renderer regressions. Source integrity also performs its existing 10,000 canonical rolls. TypeScript and lint passed. Root is performing actual browser acceptance against the enriched data.
