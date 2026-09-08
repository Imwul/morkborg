# Creature, NPC, encounter and character integrity audit

Audit date: 2026-09-08. Scope: production creation, individual rerolls, source creature loading, legacy public generator entry points, class creation and quantity/stat derivation. UI, Dungeon/Special Room procedures and the full Oracle evidence inventory are covered by the other reports in this directory.

## Evidence and inventory

`creature-generation-inventory.json` records feature, field, classification, source book/table/ID, PDF and printed pages, transformation, English-verbatim status, Korean helper availability, fallback policy and confidence. Its rows are **field × source route × classification/status**, not distinct form controls. The retained run contains 1,304 rows: 763 SOURCE_VERBATIM, 378 SOURCE_COMPOSED, 133 APP_DERIVED, 30 USER_AUTHORED, **0 UNSOURCED**. Random sample coverage changes the route-row total on subsequent runs; the global production validator is the stricter source-resolution guard.

All 89 installed creature records were inspected against their supplied source pages: 15 Core Bare Bones, 17 HERETIC, 54 FERETORY Eat Prey Kill and 3 full Core adventure records. Nine separate outcast NPC records were also checked (four Core, five HERETIC): 98 records across the two lists, 95 unique identities because three Core identities overlap. `creatureSourceEvidence.json` stores independently reviewed content fingerprints for these records, including the maintained older private-pack representation. A matching book/page/name alone does not confer VERIFIED status: changed creature content with unchanged identifiers becomes PARTIAL. Normalized statblock summaries are SOURCE_COMPOSED, not falsely declared verbatim PDF text. Fingerprints are change detectors, not cryptographic signatures.

Original PDFs were extracted with pypdf; the important multi-column The Monster Approaches and Dungeon Stocking layouts were also rendered and visually inspected. Evidence comes from the supplied PDFs, not a reference site's visual layout.

| Material | Supplied PDF pages | Printed pages / use |
| --- | --- | --- |
| FERETORY, The Monster Approaches | 2–3 | Appearance A/B/C, derived statistics, desire and terrible trait |
| FERETORY, Eat Prey Kill | 14–23 | 12–21; Tveland 14, Sarkash 15, Graven-Tosk 16, Grift 17, Kergüs 18, Wästland 19, Lake Onda 20, Valley 21, Bergen Chrypt 22–23 |
| Sölitary Defilement | 11, 14, 19 | 9 stock creatures; 12 NPC profession/disposition; 17 Dungeon stocking |
| Sölitary Depths | 24–31 | 21–28; common/special/rare procedure, NPC routing and regional tables |
| RECLVSE | 93, 124–126 | Encounter/hazard/discovery; NPC motivation/appearance/personality |
| Core Bare Bones | 2; 21–23, 27, 29, 34–35, 37–42 | Names; character creation, equipment, abilities, HP, Powers, Omens, optional traits/body/habits/tales |
| Core Bare Bones | 58–62, 64–67 | Named example creatures and all four outcasts, including Wild Wickhead |
| Core full edition | 79 | Printed III; Dusk Gnoum, Mongrel, Guards with Sharpened Teeth |
| HERETIC | 23, 25, 27, 29, 32–35, 40, 60, 62–64, 66–67 | Creature definitions and five outcast NPCs, including Borg Bitor continuation at PDF 63 |

Class procedures resolve the existing canonical class tables and source manifests (six Core, four FERETORY, two HERETIC classes). Each class procedure now explicitly includes its Core creation dependencies as well as class-specific pages, optional choices and conditional extra-creation steps. Korean helpers remain separately stored metadata; generation and routing use canonical IDs and English entries.

## Defects and disposition

| Finding | Classification of the problem | Correction |
| --- | --- | --- |
| Generic Monster name rolled the unrelated Core character-name table | Source-backed entry, unsupported procedure combination | Use neutral `Monster`, APP_DERIVED structural identifier; manual names remain intact |
| Grift EPK picker excluded Lentil Lice and uniformly sampled the remaining five creatures | APP probability and identity error | Roll actual d6 first and resolve exactly that face; face 5 remains source-only Lentil Lice |
| Missing EPK source data could switch a new Monster draft to The Monster Approaches | Undeclared fallback procedure | Remove fallback; retain explicit chosen procedure and fail with source unavailable |
| Legacy NPC/encounter entry points maintained a second generator pipeline | APP duplication and unsupported composition | Delegate to canonical NPC/encounter procedures |
| Legacy NPC stat generation could substitute an arbitrary d4 HP roll | UNSOURCED mechanical fallback | Remove; absent NPC stats remain blank until sourced or user-authored |
| Legacy Rare encounter assembled a generic creature-plus-trait result instead of the actual stocking procedure | APP composition | Remove duplicate synthetic pipeline; canonical SD stocking and independent encounter source tables remain |
| Action table display supplied d4 when its source record omitted dice | UNSOURCED procedural fallback | Omit the missing dice label; retain actual structured source entries |
| Scalar/item rerolls changed text without durable structured provenance | APP traceability defect | Update text, entry ID, source refs, roll and origin atomically |
| Character class scroll source could lack a page; class choice selectors looked like actual dice | APP citation/trace defect | Use canonical scroll entries and page metadata; label non-roll selectors `source-entry selection` |
| Quantity, companion HP and class stat arithmetic were implicit | APP_DERIVED with insufficient trace | Store actual dice and formula, base/Core source and class override |
| Source record identity alone could imply verification after record text changed | APP trust defect | Require independently audited content fingerprint; changed content is PARTIAL |
| Dead legacy Library component retained approximately 540 lines of duplicate creation/rendering code | Unreachable production code | Removed component after `rg` proved no component imports/renders; retain the only consumed exports, `Confirm` and `singular` |

No app-authored gothic adjective pool was found in these creature/character modules. The main fictional-composition defect here was combining legitimate entries under an unsupported procedure, not an undocumented atmospheric-text dataset. Blank notes, secrets, attacks or similar manual slots are not filled with invented content.

## Exact Monster procedure

The Monster Approaches rolls A, B and C once each, d12. The three source fragments are retained separately in provenance and joined only with `; ` for the existing appearance field. Those same three rolls determine Morale (highest), damage die (lowest mapped through the printed bands), and armor (table owning the highest die). The appearance dice are never independently rerolled to calculate each statistic. Desire and terrible trait are separate explicit source-table steps.

Two real source issues remain visible in disclosure:

* **HP CONFLICT:** the prose instructs rolling the damage die and doubling that result, while its parenthetical example says `2d8`. Those distributions differ. The implementation follows the prose, retains the actual HP die and marks the HP provenance CONFLICT; it does not quietly call the two methods equivalent.
* **Armor PARTIAL on a highest-die tie:** the source does not specify a tiebreak between A/B/C. The result exposes the possible armor values and leaves the choice to the referee. It does not invent another die roll.

EPK creature loading preserves exact identity and available stats. Regional route refs are separate from primary creature refs. The canonical registry now owns the live hunting-table adapters built directly from the same source records; it does not duplicate their private text. Sölitary Depths remains the routing layer where its regional table is selected. Direct EPK hunting is a separately identified procedure, not silently described as a Depths regional roll.

## NPCs, encounters and characters

NPC profession/disposition use the canonical Sölitary Defilement/Depths material; name, appearance, personality, motivation and reaction are independently inspectable source prompts. The UI does not need to turn these into connective prose. Source NPC loading reuses the same creature-record loader, including legitimate outcast trait/specialty/value tables. Those tables are preserved as reference material rather than preactivated at generation time.

The final outcast review caught missing presentation of a ranged `1–2` specialty entry, daily frequency/DR qualifiers, an occasional alternative attack and three NPC possessions. These are restored from the existing source record without making additional random choices. For example, Prowler's occasional shortsword remains optional because the source gives no numerical probability.

Encounters use canonical Sölitary Defilement common d12 or rare d8 + Dungeon DR stocking, or an explicitly selected encounter/hazard/discovery source table. Legitimate source range gaps remain empty and inspectable. There is no fictional stand-in when a rare total has no source entry. Participant quantities remain separate mechanical values; absent participants/stats are not fabricated.

Core character creation has **two terrible-trait results**, **one broken-body result**, **one bad-habit result**, and **one troubling-tale result** when those optional tables are used. Habits and tales were already one each; they were not silently doubled during this pass. The difference between two traits and one habit/tale is retained in explicit procedure definitions and regression tests. Equipment counts, companion HP, abilities, HP, Omens, silver, starting Powers and class overrides retain dice/formulas. Class source entries remain English; Korean helpers do not influence selection or routing.

## Source-only and unresolved cases

These are not UNSOURCED generated fiction; they are explicit missing or ambiguous source results:

* **Lentil Lice, FERETORY PDF 17 / printed 15:** printed HP 4, Morale 7, Knife/Femur d4 belong to the competing starved peasants, not to the lice. The lice identity/description is valid; its combat stats stay empty. Its d6 face remains selectable.
* **Cursed Trout, FERETORY PDF 20 / printed 18:** the source supplies the curse and identity without combat stats. Stats stay empty.
* **Carcasswan base record, FERETORY PDF 20 / printed 18:** source provides different lone/pair statblocks. The unspecified base identity stays statless; it is not assigned either variant arbitrarily. Both source variants remain in the canonical record.
* **Rotten Nurse, HERETIC PDF 64 / printed 62:** ordinary combat stats are absent and ordinary harm is explicitly inapplicable. Preserve the actual Mental Torture Prison rule and empty ordinary stats.
* **TMA HP and highest-die armor ties:** source conflict/omission described above.
* **Sölitary Defilement rare totals outside its printed result range:** preserve the unresolved range result; no invented encounter.
* **Printed cross-book routing citation conflicts:** preserve the source's citation and expose its verified corrected creature route through the registry; do not silently rewrite the quoted row. Fogbound Skeleton is an example of a source citation issue, distinct from a generator composition defect.

## Semantic review

The retained private QA artifacts contain **100 Monsters, 100 NPCs, 100 Encounters, and 100 Characters**. Monsters include 50 TMA results and 50 EPK results across seven application regions. Encounters cover common, rare, room, hazard and discovery. Characters cycle through classless and all 12 installed classes. Full generated source text is kept only under ignored `outputs/product-integrity/`, not committed into public audit documentation.

Representative outputs were read, including 20 Monsters, 20 NPCs, all 20 common encounters and examples of every other encounter category. Concrete semantic findings:

| Observed combination | SOURCE or APP? | Disposition |
| --- | --- | --- |
| TMA steaming/vibrating appearance with a sound-absorbing fragment | SOURCE | Retain independent A/B/C fragments; do not narratively reconcile the intentional juxtaposition |
| TMA all three appearance dice equal | SOURCE omission | Armor choices visible only in source/result detail; no invented tie-break |
| Desire instructs escaping something worse and rolling another creature | SOURCE | Preserve the prompt; do not trigger unbounded recursive creature generation |
| Terrible trait instructs another roll every three rounds | SOURCE | Preserve its in-play timing; do not apply a future event during generation |
| NPC torturer/inquisitor, belligerent disposition, soft-hearted personality | SOURCE | Distinct table prompts; no added motivation or sentence claiming they naturally agree |
| NPC generous disposition and cruel personality | SOURCE | Keep independent concepts, not grammatical filler |
| Fogbound Skeleton routing row cites an inconsistent source location | SOURCE citation conflict | Keep original row; provide verified primary creature route separately |
| Grift repeatedly omitted the Lentil Lice source face | APP | Fixed the probability/identity error rather than rewriting a weird creature |
| Missing source switched generator families or supplied generic HP | APP | Removed fallbacks; explicit source-unavailable state |

No Korean helper was used as generator input. The TMA tie label was moved to neutral English, with explanation kept as secondary reference text. Existing long Korean summaries were not rewritten into more literary text; source originals remain primary. This report does not claim a word-for-word retranslation of every private source row; the registry report identifies evidence coverage separately.

## Validation and preservation

Seven focused integrity tests add 10,000 TMA + 10,000 NPC + 10,000 encounter passes, assertions on every generated provenance entry and canonical ID, actual HP derivation, all 89 creature and nine outcast fingerprints, 100 classless/class characters, explicit procedure references, missing-source rejection, source mutation detection and reroll/save/import integrity. Four additional duplication-provenance regressions verify exact metadata copies and copy-label annotations. The final combined focused regression suite passed **119/119**, including expanded outcast and duplication checks. TypeScript and lint on the owned source modules passed. Root runs the complete suite, lint and build independently.

Individual rerolls preserve unrelated components and manually edited fields. The new source ID/roll/origin accompanies each regenerated value. JSON roundtrip tests preserve structured provenance exactly; undefined object properties are omitted to avoid differences after serialization. Existing Campaign data is not regenerated. The changes attach provenance to new results and conservatively preserve old text, IDs, manual edits, placements and notes. Manual editing is reconciled by the shared domain layer, and source disclosure distinguishes original generated content from current edited values.

The final duplication audit verifies exact nested metadata copies across Campaign, Dungeon, Monster, NPC, Encounter and Character clones. Existing ID-remapping policy is unchanged. A Dungeon/Character/Monster `— copy` suffix is explicitly APP_DERIVED for a generated identity, retaining original source snapshots and dice; manual/source-edited identities keep their manual origin. This prevents the copy label from claiming to be printed source text. Source-only Monster cards omit empty HP/Morale labels, and the Reference copy path was checked to omit empty HP rather than turn it into zero.

Generation uses the canonical registry cached by source-pack identity. Expensive evidence checks occur when packs are installed/registry built; no whole-registry scan runs per React render or per generated field. Missing source packs do not switch to mystery content.
