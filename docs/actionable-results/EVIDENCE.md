# Result navigation evidence

All additions are exact-ID, read-time navigation projections in `resultRelationships.ts`. No source text, dice, weights, canonical metadata, saved pack or generation dependency was changed. Each row addition requires the canonical entry ID and `VERIFIED` source attestation; a retained roll whose text no longer matches the installed row gains no audited addition. Missing destinations are not shown.

## Newly exposed row links

Original local PDFs were checked with PyMuPDF on 2026-09-24. FERETORY PDF 7 was also visually inspected. Existing source attestations continue to validate the installed rows; no fingerprints were replaced to accommodate UI changes.

| Source row | Target | Play meaning | Source evidence |
|---|---|---|---|
| `feretory.roadEvent` 5–6 | `oracle:core.weather` | REQUIRED | FERETORY PDF 7 / printed 5 explicitly calls for a new weather roll. |
| `feretory.roadEvent` 20 | `oracle:core.corpsePlundering` | REQUIRED | Same page explicitly directs the reader to the Core plundering table. |
| `feretory.forage` 5–6 | `oracle:feretory.village` | REQUIRED | FERETORY PDF 8 / printed 6 explicitly requests the village table. |
| `core.broken` 2 | `oracle:core.brokenInjury` | REQUIRED | Bare Bones PDF/printed 29 specifies a d6 injury only for this result. |
| `core.reaction` 2–3 | `rule:core.violence` | AVAILABLE | Bare Bones 32 supplies the reaction, 30 supplies combat resolution. This is conditional reading access if combat follows; it neither starts combat nor prevents retreat. |
| `core.reaction` 4–6 | `rule:core.violence` | AVAILABLE | Same sources. Anger is explicitly not treated as automatic combat. |
| `depths.danger` 6 | `oracle:core.reaction` | REQUIRED, −2 reminder | Depths PDF 11 / printed 8 explicitly calls for Reaction with −2. The UI does not silently change another roller's input. |
| `sd.room.contents` 1 | `oracle:feretory.A` (existing paired reference) | AVAILABLE | SD PDF 15 / printed 13 names The Monster Approaches as an example. Its existing external-table text was not ID-resolved. Depths PDF 24 / printed 21 confirms the alternative card procedure. They remain alternatives. |

These eight projected row links do not alter the 247 existing normalized row edges or 88 USES / 88 USED BY edges.

## Classification of existing links

- Existing SD room-content common/rare/NPC branches and the two explicit object queries are REQUIRED after that row is selected. SD PDF 15/13 and the existing `followUp` metadata establish the targets.
- Existing Depths common-encounter branch is REQUIRED. Danger 6's NPC-description link is AVAILABLE; the explicit −2 Reaction has priority (Depths PDF 11/8).
- SD Searching Strong 2's Useful Items table is only an example: AVAILABLE, not a required extra roll.
- Audited RECLVSE content selectors, starting-scroll subtables and the campsite dream subtable are REQUIRED when not already included in the generated result. Their existing SUBTABLE identities are retained.
- AITC City Crawl failure rows 1–2/3/4 resolve NPC/hazard/event respectively. The failure d4 itself remains optional inspiration; once selected, these links resolve that result. AITC PDF 7/5. Pray failure 1 explicitly calls Arcane Catastrophes on the same page.
- Fixed LOOKUP selectors are CONTEXT and open the specified row without random dice. Distinct selectors in the same canonical table remain distinct.
- Unclassified FOLLOW-UPs are not automatically promoted to REQUIRED. Table/procedure destinations remain AVAILABLE; rule reading destinations are CONTEXT. Their original printed conditions remain beside the result.
- Already-generated subtables become CONTEXT with an explicit already-included note. USES / USED BY remain in Related and never become a requirement.

## Conditional Core rule access

The existing creature/current creature result gains AVAILABLE Reaction only when its response is uncertain. AVAILABLE Morale states the three printed triggers. Core combat exposes AVAILABLE Morale, Broken at exactly 0 HP, and natural-20/natural-1 special rules. Morale exposes its failed-Morale table only as a conditional reference, never as an automatic roll. Sources: Bare Bones 29–32, checked in full. The UI does not know or store whether those conditions occurred.

## Deliberately unresolved

- Room remains, empty rooms, generic environmental danger and ordinary weather are not assigned guessed next tables.
- No creature stat block is inferred from an incidental noun or monster name.
- No generic trap link is routed to the excluded TR-dependent rules; no special-dungeon material is reintroduced.
- Optional choices, repeated rolls, quantity dice and source conditions are not a machine-enforced queue.
- Remaining conditional AITC/other-book links stay AVAILABLE/CONTEXT unless audited individually. Existing relationship type alone is insufficient to decide necessity.
