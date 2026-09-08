# FERETORY: PDF escape audit

Baseline: `a50d2425deb9a4e9c7e7abb0983dd4c34c68c116`. Audit only; application code, data and UI were not changed. All **68 physical PDF pages** of the supplied `MRK_BORG_CULT_FERETORY.pdf` were inspected through fresh extraction; dense route, creature, gambling and tablet layouts were also rendered. Printed pages generally equal PDF−2 after the opening fold. The inside-cover tablet sheet has no visible printed number; the extracted legacy “64” header is not visible and is not treated as pagination evidence.

There are **186 source-specific lookup rows**: 93 RESOLVED, 55 PRESENT_BUT_INDIRECT, 6 PARTIAL, 27 MISSING and 5 PDF_APPROPRIATE. These are distinct lookup needs, not percentages of pages or counts of imported tables. Three repeated EPK creature needs share IDs with HERETIC for global deduplication.

The app covers the daily road/forage/camp tables and most EPK creature definitions well. The largest omitted source material is in the two adventures and their local equipment. A prior result of zero unexplained generated strings would not establish this coverage.

| Priority | Source | Actual gap | Smallest useful correction |
|---|---|---|---|
| P1 · 4×5=20 | Roads, PDF6 / printed4 | Eleven named route durations and the world-size/bad-weather adjustments are absent despite a page citation. | Static endpoint/dice table linked to Travel; keep the illustrated map optional. |
| P2 · 4×4=16 | Ochre Tablets, PDF66 / inside back cover | Ten effects exist, but general price, size, breakage and casting-eligibility rules are not a complete usable reference. | One shared usage rule linked from the existing tablet entries. |
| P2 · 3×5=15 | Three Dead Skulls, PDF57 / printed55 | The current short rule explicitly sends the user back to the PDF for payout combinations, coward reroll and cheating consequences. | Complete static payout/side-condition reference; an automatic gambling roller is unnecessary. |
| P2 · 3×4=12 | EPK PDF17/20/23 | Peasant participants, Carcasswan variants and regular-wolf companions exist in private metadata but are omitted from normal reference output. | Display the existing labeled nested blocks without inventing generic HP or changing probability. |
| P2 · 2×5=10 | Death Ziggurat, PDF32–33 | Six distinct creature/NPC stat blocks are absent. | Exact local stat references linked to the event table. |
| P2 · 2×5=10 | Goblin Grinder, PDF39/45–48 | Seven named/variant encounter groups are absent, including Ooze and three different goblin stat variants. | Exact local definitions; the generic Core goblin cannot substitute. |
| P2 · 3×3=9 each | Reliquary PDF50–55 | All36 relic effects exist, but an exact name search does not retrieve the row. | Named aliases opening/highlighting canonical rows. |

## Direct-source findings

- The Monster Approaches has an actual HP wording conflict: doubled single-die prose versus a `2d8` example. Current implementation discloses its literal-prose interpretation and ties; no fabricated reconciliation is required. Desire and trait rules are present.
- EPK has **54 regional faces across nine regions**, not merely the seven UI regions. Fifty-two stored original blocks match newly extracted PDF text after whitespace/punctuation normalization. The two layout exceptions, Flail-Horned Muskox’s attack matrix and Carcasswan’s side-by-side variants, were visually checked. The matrix is correct. Both Carcasswan stat variants are supplied; an unavailable generic stat block does not satisfy the lookup.
- Cursed Trout genuinely has no combat stat block; its insomnia effect is sufficient source material. Lentil Lice likewise has no lice stats, but the adjoining **starved peasants** do. These are separate judgments.
- EPK’s optional larger hunting dice/mundane-prey branch is absent from the hunting quick rule. Quantity and rations guidance otherwise exists. Bergen and Lake Onda identity tables need direct result-to-creature links.
- Death Ziggurat’s six monster/NPC definitions, Spiral Crown, medallion and heart consequences are absent. Existing flower/ruin/treasure/event tables are useful, but do not cover those omitted rules. Restricted search-event dice are retained in source notes; links would remove the remaining table-hunting.
- Goblin Grinder’s four sold mechanical concoctions and basement remedy are absent. Calumny Pearl is present inside hook4, therefore indirect, not missing. Liquid/alchemy d4 effects are complete, and the alchemy trigger/ooze exception is present in Source. Countdown, fire-oil and Grinder escalation/activation reminders are absent.
- Grey Galth menus retain their prices and effects; keeper, patron and name tables are usable. The Dreg and Hardy Tame Rat stat blocks are absent independently of the incomplete gambling rule.
- Four supplement classes have real creation manifests and full selected feature text. The gap is retrieval: class-name search surfaces component tables, while full class rules require Character selection/generation. The **36 relics and 10 Ochre Tablet powers** have individual rows in the inventory to expose exact-name lookup gaps.
- Black Salt wind DRs, suffering effects and the social-madness follow-up exist. The needed improvement is a link from the wind to its failed-test consequence, not new atmospheric text or a replacement generator.

## Exclusions and evidence

Adventure premise, hidden geography, keyed-location prose, maps, illustrations and credits remain PDF_APPROPRIATE. This does **not** exempt concise monster stats, named effects, local tests or timed procedures on those same pages.

The complete row-level findings, source IDs, exact page references, queries, severities and minimal fixes are in [supplement-rows.json](data/supplement-rows.json). Every physical page is accounted for in [supplement-page-ledger.json](data/supplement-page-ledger.json). Fresh programmatic search probes are private local artifacts in `outputs/pdf-escape-audit/supplement-search-results.json`; browser observations are recorded separately by the coordinating audit.

Examples of verified exact-name misses: `Mercy’s Bane`, `Dream Theory`, `Blackpowder Bomb` (HER), `Chip the Rat` (HER). Carcasswan does have a result, but browser inspection confirmed its available variants are not shown. Names/citations and source-status badges were never counted as substitutes for mechanics.
