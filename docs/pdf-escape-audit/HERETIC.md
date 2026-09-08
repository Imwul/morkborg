# HERETIC: PDF escape audit

Baseline: `a50d2425deb9a4e9c7e7abb0983dd4c34c68c116`. All **68 physical PDF pages** of supplied `MÖRK_BORG_CULT_HERETIC.pdf` were read from fresh extraction. Blackpowder, the clipped curse row and the last scenario fold were also inspected as rendered pages. The first and final folds are unnumbered; body pages normally use PDF−2.

There are **143 source-specific lookup rows**: 47 RESOLVED, 32 PRESENT_BUT_INDIRECT, 9 PARTIAL, 47 MISSING, 6 PDF_APPROPRIATE and 2 SOURCE_UNAVAILABLE. Full tables can be one lookup need; named mechanical items/creatures are separate when their retrieval/completeness differs. These are not table-import percentages.

| Priority | Source | Actual gap | Smallest useful correction |
|---|---|---|---|
| P1 · 4×5=20 | Blackpowder, PDF46 / printed44 | General attack/armor/reload/noise rules, all11 weapons/bomb and three ammunition price rows are absent. | Shared quick rule plus named item/price references; no tactical engine. |
| P2 · 3×5=15 | Rotten Nurse, PDF64 / printed62 | Complete no-HP mental-prison rules are stored, but the numeric-HP gate excludes it from both Reference and presets. | Allow verified nonnumeric-stat source definitions to be inspected. |
| P2 · 3×5=15 | Mikhael, PDF40 / printed38 | Complete outcast record is stored but never indexed. | Index existing outcasts, including possessions and special rules. |
| P2 · 3×4=12 | Graves, PDF22 / printed20 | Fifteen-minute travel, per-move encounter and all-four-locations progression are absent. | Static procedure card with current table/creature links. |
| P2 · 3×5=15 | Bone Bowyer, PDF60 / printed58 | The creature is available, its usable Bowyer’s Bow rule is not. | Separate item reference linked from creature result. |
| P2 · 2×5=10 | Swamp Witch, PDF51–59 | Seven stat blocks, venom/passage rules, distinct equipment/Power effects and the willing-sacrifice branch are absent. | Concise source-bound references; keep the map and prose in the PDF. |
| P2 · 3×3=9 each | Merchant, PDF42–45 | All24 purchase effects exist, but named item searches fail. | Named aliases into canonical rows and soul-price links. |

## What is usable

Seeds of a Cvlt’s source columns, all36 Unheroic Feat effects, the feat-acquisition reminder, Songbird/Vicar class feature tables, Graves’ random tables, curses/helper/price tables, Merchant stock effects, and several named creatures are retained. Actual effect text was compared with source; a table ID alone was not sufficient.

Sixteen of seventeen HER creature records appear as playable references. The Übertaker includes its per-round action table and loot Power. Borg Bitor includes PDF63 Devil’s Glue detection, escape, countdown and penalties. Its valuations remain indirect in generated Monster notes. The sole absent-from-index record is Rotten Nurse, whose intentionally absent HP is not missing source.

Five complete HER outcasts are stored separately and not exposed: **Mikhael, The Roach Herder, Stein, Benzen and Arga**. The registry loops over `rules.creatures` only, and preset loading also ignores these records. Browser searches confirmed no results for Stein/Benzen/Arga and Rotten Nurse. Source possession fields would also need to survive the presentation adapter.

## What still requires the PDF

- **Graves Left Wanting:** Skeleton Unkey, Roseate Baritona and Nostalgia Gruel, plus sarcophagus/acid/fountain/current tests, are missing. The knowledge table’s printed true/false/maybe statuses are stored in `metadata.truth` but omitted from reference reading/table view. Encounter results have actor names but no direct actor link.
- **Bloat / A Gluttonous Dungeon:** Ratbadger, Fleshy Automaton and Silas are present. Animated waste is absent, and intentionally has no numeric HP in the source. Gourmand’s Cutlery, the tongue-shaped knife and short location hazards are absent. Silas’s attack damage is not an adequate substitute for the Cutlery item rule.
- **Blackpowder:** the supplied page is complete and readable. There is no unavailable-source excuse. An incidental AITC reference to a blackpowder item does not expose HER’s weapon list and rules. The page contains no separate misfire subsystem; the audit does not request an invented one.
- **Swamp Witch:** Emerald Serpent, Drug Cultist, Ueth, Forked-Tongue Devotee, the Witch, Srolki and Yaoxl need their own definitions. Slithering Strangulation, Croaking Trident, Lunar Zweihänder and Ranseur effects are distinct missing needs. Environmental snakes with only a printed hazard/attack do not justify invented HP. Six wish aftermaths are present, but the fixed willing-sacrifice consequences and exact Doom-delay rule are not.
- **Bone Bowyer / Nurse the Rot:** the Bowyer commission list and resulting bow are distinct from monster statistics. Nurse alert routing, deadly corridor/coin hazards and the Bitor-nest improvement instruction are concise omitted mechanics. Whole maps and investigation prose remain PDF material.

## Genuine source limitations

1. **Curse Cure result12, PDF37 / printed35:** the physical supplied page is clipped after “do not”. The warning and visible fragment are correct; completing the result requires an authorized complete source, not inference. Classified SOURCE_UNAVAILABLE, not an implementation omission.
2. **Staff of Awful Light, PDF66 / last fold:** the adventure names and locates its objective but supplies no usable effect/stat definition. Preserve the objective if helpful; never invent a Power to make the name actionable. Classified SOURCE_UNAVAILABLE for its requested mechanics, not missing import.

Three repeated creature needs share IDs with FERETORY: Half-Billed Raven, Unbred Mutt and Twice-Grown Corpse Fly. Their book-specific source pages remain inspectable. Other scenario creatures with similar labels are not silently merged.

See [supplement-rows.json](data/supplement-rows.json) for exact needs, source pages, current routes, code evidence and minimal fixes; [supplement-page-ledger.json](data/supplement-page-ledger.json) covers all physical pages. Source payload and encryption keys were not written into these reports.
