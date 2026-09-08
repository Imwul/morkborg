# Mythic: variations and appendix audit

Baseline: `a50d2425deb9a4e9c7e7abb0983dd4c34c68c116`. Audit only; no application, generator, private data, deployment or saved campaign changes.

This report covers physical PDF **124–230: 107 pages** of the supplied *Mythic Game Master Emulator Second Edition*. Physical PDF and printed pages differ by one. The fresh page extraction was read against the current Oracle/reference snapshot, Fate schema, Fate generator and Mythic panel. Dense tables on PDF 138, 148, 149, 165 and 222 were rendered; the Thread Discovery and Chaos charts were visually checked. The first-half audit lives in `data/mythic-rows.json`.

## Result

| Classification | Unique additional needs |
|---|---:|
| RESOLVED | 1 |
| PRESENT_BUT_INDIRECT | 0 |
| PARTIAL | 2 |
| MISSING | 17 |
| PDF_APPROPRIATE | 13 |
| SOURCE_UNAVAILABLE | 1 |
| Total | 34 |

The one unavailable source is an **external Adventure Crafter dependency**, not missing ordinary MÖRK BORG content. The instructions for integrating that product are present in the supplied Mythic PDF and have their own missing-reference row. No absent source is being disguised as an application error.

`data/mythic-extra-rows.json` contains all rows, severity, frequency, friction, minimal fixes and exact PDF/printed pages. `data/mythic-extra-page-ledger.json` accounts for every page in this assignment. All appendix mechanics reuse their primary need IDs. All ledger links resolve; no physical page is unaccounted for. Canonical IDs still begin `mythic2`, while the audit book ID is `mythic`, matching the physical source inventory.

## Existing coverage versus actual optional procedures

| Source need | PDF / printed | Current usable state | Smallest useful correction |
|---|---|---|---|
| Determining NPC Statistics | 128–129 / 127–128; repeats 190, 218 | Generic Fate answers exist; expected-value interpretation and the special-condition branch do not | Optional compact rule. Never fabricate missing MÖRK BORG monster statistics with it. |
| Thread Progress / Flashpoints | 133–136 / 132–135 | No usable rules for the optional track | Rule packet beside a paper track; no campaign tracker required. |
| Discovery Fate Question | 136–137 / 135–136 | Four conditional consequences missing | Short outcome reference linked to Discovery Check. |
| Thread Discovery Check | 137–138 / 136–137; repeat 220 | Eight-range table absent | Exact table with the current Progress modifier. |
| Plot Armor / Conclusion | 138–141 / 137–140 | Conclusion timing and delayed-Scene exception missing | Optional rule inside the Thread Progress packet. |
| Player versus Character Knowledge | 142–145 / 141–144; repeat 221 | Four-strategy lookup absent | Compact strategy reference; preserve long examples in PDF. |
| Mid/Low/No-Chaos Fate Charts | 148–149 / 147–148; repeat 222 | Only standard Fate Chart installed | Exact optional charts, intentionally selected. |
| Mid/Low-Chaos Fate Check modifiers | 148–149 / 147–148; repeat 223 | Standard modifiers are hard-coded | Static optional modifier tables first. |
| No-Chaos scope | 150 / 149 | No explanation that Scene/Event Chaos still applies | Scope note with the alternate charts. |
| Keyed Scenes and five sample templates | 151–156 / 150–155 | Procedure and operational examples absent | Rules/examples disclosure; paper triggers remain sufficient. |
| Diminisher Value | 158–159 / 157–158 | Optional scaling guidance absent | Manual-estimation reference; original creature records remain unchanged. |
| Adventure Features | 159–165 / 158–164 | List is named in existing source note; use and interpretation incomplete | Rule/result link, without a new database. |
| Prepared-adventure Scene test | 160–165 / 159–164 | Focus table present, but the Scene panel only executes the standard parity rule | Explain the variant and link the replacement table. |
| Prepared Adventure Event Focus | 165 / 164; repeat 226 | **All seven d100 ranges usable** | None for the table itself. |
| Peril Points | 171–172 / 170–171 | Optional resource rule absent | Short optional rule with paper bookkeeping; distinct from Omens. |
| Adventure Crafter integration | 172–176 / 171–175; repeats 192, 227 | Supplied integration instructions not exposed | Compact optional reminder, separate from missing external generator data. |

The largest procedure distinction is the prepared-adventure Scene check. Its source keeps the Expected Scene and adds a Random Event when the roll falls within Chaos. The current `resolveScene` instead returns standard Altered/Interrupt outcomes, and the panel’s `eventClues` uses the ordinary Event Focus table. The separate prepared-adventure focus table is correct; that does not make the variant procedure complete.

The Discovery source distinguishes **Progress**, **Flashpoint**, **Track**, and **Strengthen Progress**. The latter two are not new fictional content generators. Source inspection also confirms that a delayed Conclusion bypasses the next normal Scene test, while an ordinary track-triggered Flashpoint does not use that same exception. These distinctions must survive any future quick-reference implementation.

The alternate Chaos charts change only the selected Fate answer procedure. Their scope note explicitly retains Chaos for Scene and Random Event checks. Setting the entire application Chaos to zero would be an incorrect substitute. Printed exceptional limits, grouped columns and `X` cells are present and readable; none needs an invented fallback.

## Search evidence

The audit tool used the current production search function against the fresh reference index for **36 queries**. **33 returned no result**. The three nonempty queries were:

| Query | First result | Assessment |
|---|---|---|
| No-Chaos Fate Chart | `rule:mythic2.fate-question` | Ordinary Fate Chart reference; does not answer the requested variant. |
| Mythic prepared adventure | `oracle:mythic2.prepared-adventure-event-focus-table` | Correct related table, incomplete requested procedure. |
| Prepared Adventure Event Focus Table | Same canonical table | Correct immediate table/roll. |

The raw result snapshot is local at `outputs/pdf-escape-audit/mythic-variation-search-results.json`. These are domain search tests, not claims of independent browser interaction. The coordinating audit separately verifies the real Mythic panel and interactions.

## Material deliberately left as PDF reading

Preparation, journaling methods, sourcebook inspiration, random-page sourcebook use, diversified Threads, conclusive narration, session-definition advice, campaign-list organization, scenario-reading advice, the nine-page Rapid Red example, print sheets, credits and artwork remain PDF-appropriate. Numeric rules and actionable procedure sidebars on those same pages have separate rows. This prevents an entire prose chapter from hiding a missing mechanical rule, while avoiding a demand to build novelization, narrative scheduling or extensive campaign bookkeeping.

The collected tables on PDF 187–227 are summaries or duplicates. They are linked to their original needs, including all 49 Meaning tables; no duplicate missing table is counted. External Adventure Crafter Plot Points, Turning Points and deck cards are not printed in this book and do not appear in the supplied source inventory. Their absence does not authorize an imitation generator.

## Reproduction and boundary

Run `python3 docs/pdf-escape-audit/tools/mythic_variations_audit.py`, then `npx tsx docs/pdf-escape-audit/tools/mythic_variation_queries.ts`, against the current fresh inventory snapshots. The artifact utility validates the seven Prepared Focus boundaries, canonical table references, unique row IDs, physical-page coverage and primary-need ledger resolution.

Suggested corrections are reference improvements, not authorization to implement every optional subsystem. None should silently modify MÖRK BORG source creature stats, remove character mortality, or turn the handwritten notebook into an application requirement.
