# Visual hierarchy audit — before implementation

Baseline: `7321e5f31d52dd7745d42884016cabe92501e643`. The actual production-preview app was captured at **360, 1440 and 3440** for all 13 requested surfaces. All 39 images were visually reviewed before editing production JSX/CSS. Source content, probabilities and saved data are outside this pass.

The user's additional direction is decisive: reduce the Notion/document-manager feeling, and shorten the repeated source/details labels. Quieting must use print composition and stronger hierarchy, not softer cards or a generic gray theme.

| Surface / target intensity | PRIMARY | SECONDARY | TERTIARY | Observed problem / chosen response |
|---|---|---|---|---|
| Reference Desk / LOW | Search | Pins, useful direct actions | Recent, index, region navigation | Empty pins and five tall Recent rows occupy a large equal-column section. Compress shortcuts to typographic strips; keep search as one emphatic horizontal line. |
| Search / LOW | Matching name / direct roll | Kind/book | Detail entry point | Some rows have three lines because helper titles repeat before opening. Keep two-line ledger rows and unchanged direct actions. Pink rounded input focus competes with the brutal page. |
| Oracle / HIGH | Rolled words | Reroll, copy, short Korean | Source, related, pin | Two blackletter headings compete; small results sit in 537px inspector with large empty gaps around disclosures. Make the result dominant and remove reserved secondary spacing. |
| Dungeon / MEDIUM | Dungeon name | Dossier groups, four room packets | State, placements, full reroll, notes | Reading begins after several toolbar bands. Existing groupings are sound, but too much repeated rule/chrome interrupts them. Pull content forward; keep asymmetry and a strong title. |
| Expanded Room / MEDIUM | Number + source components | Component reroll / copy | Full reroll, ordering, notes, provenance | Strongest nesting failure: white detail enclosure → half-width black packet → field rules. Number is repeated three times. Flatten to a dungeon-key entry; keep component reroll directly reachable. |
| Character / MEDIUM | Name + class | Resources, abilities, equipment | Creation settings, management, history | Saved character still shows Classless/Class controls and full regeneration before identity. At 360 identity begins near 570px. The entire equipment area repeats the black title background. Retain the black identity/magenta register, use paper for readable stats and kit. |
| Monster / MEDIUM | Identity/statblock | Attack, special | Source, full reroll, assignments | Relatively compact content, but context and management bands dominate the upper viewport. Preserve direct source while moving rare generation settings to edit interaction. |
| NPC / MEDIUM | Name / identity | Essential traits | Generation setup, source, management | Three long disclosure labels and top context consume more space than the NPC. Short labels and bounded reading composition. |
| Encounter / MEDIUM | Actual encounter result | Category / participants | Setup, source, management | Generation setup sits before the result; category and toolbars outweigh the useful line. Move setup below the reading, keep result strong. |
| Table / LOW | Table entries and die ranges | Active result / choose action | Source, catalog links | 9–10 and 11–12 wrap in a too-narrow die column; excessive bilingual row spacing. Preserve row selection and active highlight; use compact thin rules. |
| Source / LOW | Book/page and source role | Roll/table links | Policy/debug metadata | White nested source panel and full-width ruled buttons make an appendix into another dashboard. Flatten, technical typography, short `ⓘ 출처` trigger. |
| RECLVSE Move / LOW | Operative roll + outcomes | Trigger / short Korean | Source / related | Essential source rules should stay readable; large space between every block and doubled labels cause excess scrolling. Compact block rhythm rather than hide necessary mechanics. |
| Depths cards / MEDIUM | Generated creature + stats | Draw, mandatory choices | Used cards, shuffle, procedure | Six cards (valid conditional extra card) precede and outweigh creature output. Move trace to a compact disclosure after the output. Preserve ranks/suits and all conditional choices. |

## Signals and limits

The current problem is not 15 yellow cards: ordinary surfaces are already mostly paper. The fixed yellow FATE launcher, yellow dock shadow, yellow selected generation option and selected tabs repeat emphasis in the same viewport. Reduce persistent chrome; preserve selection, main roll/result and brand identity. Magenta currently appears in input focus and character accents: retain the character event, use high-contrast non-magenta focus elsewhere. Do not add ornament or fonts.

Blackletter belongs to identities/results. Repeated SOURCE / EDIT / MORE labels, long all-caps toolbars, nested white panels and tiny label text should not become competing headings. Source remains directly available; short labels do not remove accessible names.

## Reproducible baseline (1440 × 1000)

Counts cover the active inspector when open; otherwise the visible viewport including navigation/toolbars. Closed disclosure descendants are excluded. Strong containers have ≥2px borders on at least three sides (thin rules are not rectangles). Yellow regions are solid background areas >500px²; text, shadows and thin character magenta borders are assessed visually, not counted as filled blocks. Page height and inspector scroll height are separate. These counts support the screenshots, not an arbitrary reduction quota.

| View | Strong containers | Yellow regions | Visible controls | Page height | Inspector length |
|---|---:|---:|---:|---:|---:|
| reference-desk | 2 | 1 | 33 | 1211 | — |
| search-results | 2 | 1 | 30 | 1820 | — |
| oracle-result | 1 | 0 | 10 | 1820 | 537 |
| source-disclosure | 1 | 0 | 13 | 1820 | 1024 |
| table-inspector | 1 | 0 | 9 | 1820 | 1385 |
| reclvse-procedure | 1 | 0 | 6 | 1865 | 1275 |
| depths-cards | 1 | 0 | 9 | 1322 | 1185 |
| character | 1 | 1 | 46 | 2172 | — |
| dungeon | 1 | 2 | 45 | 2328 | — |
| expanded-room | 1 | 2 | 55 | 2030 | — |
| monster | 1 | 1 | 32 | 1000 | — |
| npc | 1 | 1 | 34 | 1000 | — |
| encounter | 1 | 1 | 34 | 1000 | — |

Screenshots: `outputs/visual-quieting/before/{surface}-{width}.png`. Metrics and the capture tool are committed; full screenshot/source-rich QA output stays local. The fixture contains only earlier isolated QA objects. A fixed QA-only random seed makes before/after outputs comparable; production generation is untouched.

Implementation boundary: presentation components and their existing CSS owners. No source-data, generator, registry, search-ranking, persistence/schema, relation or canonical-ID changes. Common actions must retain their click costs. Source and details label shortening is required by the user's latest steering.
