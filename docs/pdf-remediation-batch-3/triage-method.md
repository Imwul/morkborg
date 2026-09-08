# Batch 3 inherited-ID triage method

Baseline: `11e86737cce0dac67c269537e07fedb84d189e97`. The input contains **401 distinct inherited need IDs**, with classifications retained verbatim: PARTIAL 35, PRESENT_BUT_INDIRECT 171, MISSING 192, SOURCE_UNAVAILABLE 3. This triage does not replace the historical audit or constitute a new page-by-page source audit.

The inputs are Batch 2 `remaining-audit-ids.json`, original `data/master-rows.json`, current `references.ts`, `referenceDefinitions.ts`, `referenceSearchAliases.ts`, `referenceTable.ts`, `ReferenceTable.tsx`, and `creatureReferences.ts`. A read-only registry probe records destination resolution and top-three search results for each inherited ID against the installed **572 tables / 991 reference entries**. Probe output contains reference identities and rankings, not the private source corpus. Where an original audit query is a descriptive heading rather than natural search, its failure is only a triage hint; it does not prove absence.

## Scoring

Every ID receives one frequency score, one interruption score, one relevance category, one access-quality category, a family, and an individual inherited problem/minimal fix. Similar rows share a reviewed family rubric; their identities are never merged or dropped.

- Frequency 5: repeatedly needed across most sessions; 4: common in ordinary combat/exploration; 3: recurring at a common trigger; 2: occasional preparation or selected content; 1: a particular optional scenario, variant, or rare trigger.
- Interruption 5: play cannot reasonably continue; 4: consequential missing mechanic/identity; 3: meaningful lookup detour or partial optional rule; 2: table scanning/context detour with material already present; 1: little direct play interruption. No item is assigned 5 merely because the old matrix said MISSING.
- Frequency describes ordinary MÖRK BORG/solo play **before choosing a particular adventure or subsystem**. A module-specific trap may matter greatly inside that module without being frequent in general Core play.

Practical priority = frequency × interruption × relevance weight.

| Relevance | Weight |
| --- | ---: |
| CORE_GENERAL | 1.30 |
| CORE_EQUIPMENT | 1.15 |
| CORE_CLASS | 1.10 |
| SOLO_GENERAL | 1.00 |
| SUPPLEMENT_GENERAL | 0.90 |
| SUPPLEMENT_SPECIFIC | 0.65 |
| RARE_EDGE_CASE | 0.35 |
| SOURCE_UNAVAILABLE | 0.00 |

This is an app prioritization policy, not a source rule. The number supports judgment; implementation selection remains explicit in `BATCH3-TRIAGE.md`. Families are implementation-planning aids, **not a claim that 51 families equal 51 unique mechanical needs**. Ten independent item definitions still represent ten distinct mechanical items even if one shared projection exposes them.

## Access-quality limits

Current access quality is a triage estimate combining the inherited content assessment and current registry/code evidence, not a renewed completeness certification. `MISSING` also represents the three unavailable-source entries because the requested access enum has no unavailable value; their relevance remains SOURCE_UNAVAILABLE and priority is zero.

Four inherited card-selector findings are statically ACCEPTABLE: `depths-depths-rare-look`, `depths-depths-rare-feature`, `depths-depths-rare-intention`, `depths-depths-rare-special`. The current `tableSelector` prefers `metadata.rank`/`metadata.symbols`, and `ReferenceTable` renders it. Batch 1 tests explicitly check A and ordered suits; Batch 2 tests retain card identities and suit routing. These are **overlap candidates, not Batch 3 resolutions**. Their inherited PARTIAL/INDIRECT classifications and remaining-ID membership are unchanged because this triage does not claim a new browser recheck.

All other access-quality values remain conservative inherited estimates. Their exact source content has not been reverified here. The parent task's `browser-before.json` supplies separate fresh browser evidence for the selected Core needs; it must take precedence where it conflicts with these inherited estimates.

## Distribution

| Relevance | IDs |
| --- | ---: |
| CORE_GENERAL | 25 |
| CORE_EQUIPMENT | 23 |
| CORE_CLASS | 2 |
| SOLO_GENERAL | 12 |
| SUPPLEMENT_GENERAL | 8 |
| SUPPLEMENT_SPECIFIC | 230 |
| RARE_EDGE_CASE | 98 |
| SOURCE_UNAVAILABLE | 3 |

The 98 rare entries include keyed scenario actors/hazards/items and the repeated optional catastrophe. They are not all “unimportant,” nor automatically PDF-appropriate: their frequency is simply conditional on selecting that content. The 230 supplement-specific entries may matter to a dedicated RECLVSE or supplemental-class user. They do not justify delaying ordinary Core hardening.

## Recommendations for the parent selection

Prioritize the source-verified difficulty ladder, round/movement timing, Core food/infection routing, and armor/scroll/Priest boundary. The compact ammunition/service/repair catalog addresses several IDs through one small canonical price reference. Keep separate Core mechanics and variants when adding natural aliases.

The four starting-item findings deserve attention if the cap allows: current exact searches give HERETIC Blackpowder Bomb for Bomb, no Life elixir or Small vicious dog definition, and FERETORY Nephalix Monkeys for Monkeys. These are direct generated-Character follow-through failures. The original Core gear table already has the effect; a faithful reference projection is the minimal intervention.

Outcast loyalty and Wild Wickhead are the next ordinary Core candidates but apply to followers rather than every Character. Core treasure names are lower-frequency table-access work, and the ten effects already exist in the table. Do not enlarge Batch 3 into full named-relic indexing. Core creation options are mainly preparation; rare repeated catastrophes and keyed Rotblack Sludge actors can wait for deliberate use of those rules/adventures.

The parent may also harden already-resolved ordinary Core references exposed by the current combat loop (negative-HP aliases, carrying context, Core versus SD fleeing, critical/fumble system routing). These should be explicitly documented as direct dependencies, not invented inherited closures.

## Reproduction and validation

`npx tsx docs/pdf-remediation-batch-3/tools/triage-probe.ts` reads the installed registry and writes the read-only probe. `python3 docs/pdf-remediation-batch-3/tools/triage.py` joins the inherited IDs to their historical records and the probe, applies the disclosed rubric, and writes `triage-all.json`. Do not rerun the baseline probe after implementation and then describe it as a pre-change measurement.

The generated artifact asserts 401 unique IDs. No historical audit file, production generator, source table, campaign state, or deployment is changed by this triage. Final remaining counts may subtract only the parent task's individually verified selected resolutions; this triage alone subtracts zero.
