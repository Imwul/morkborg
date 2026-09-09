# Final Core Loose Ends

Baseline: `aac54f870e6ce3bf04b27ee385a8482c86096359` (completed Batch 3).

**Decision: A. CORE REFERENCE DESK COMPLETE ENOUGH.** Stop broad remediation and use actual play interruptions to decide future maintenance.

This pass addresses four requested Core areas only. It does not reopen the inherited supplement audit. Classification changes below apply only to the 29 selected IDs in [RECHECK.json](RECHECK.json).

## What now works

| Area | Verified source | Before → After | User-facing answer |
|---|---|---|---|
| Outcast hiring / loyalty | Bare Bones PDF/printed 63; Morale 32. Full PDF 75 / printed 71 corroborates hiring and loyalty. | `core-outcast-loyalty`: MISSING → RESOLVED | No silver hiring fee; GM checks periodically, adds the group's highest Presence to the roll, and considers what the follower values. Success means the follower stays. The ordinary 2d6/Morale comparison is included with its own source. No wages, tracking or automatic loyalty roll. |
| Wild Wickhead | Bare Bones PDF/printed 65; Full PDF 74 / printed 70 checked for the carrying note. | `core-outcast-wild-wickhead`: PARTIAL → RESOLVED | HP 10, Morale 7, no armor, Knife d4; the original d4 Trait, d4 Specialty and d6 Values lists, including 1–2 Walking lightsource, knife d4+2, GM d20 DR8 backstab / weapon damage+3, and up to five carried items. Detailed components open under MORE. Korean is paired by section. |
| Animal purchases | Bare Bones PDF/printed 26, Beasts | Five `core-purchase-*`: MISSING → RESOLVED | Dog (trained) 25s; Dog (wild) 10s; Horse 80s; Mule 10s; Rat (tame) 8s. Exact definitions are searchable and linked from the existing services reference through the Beasts table. |
| Named Treasures | Bare Bones PDF/printed 3, Occult treasures | `core-treasure-1`–`10`: PRESENT_BUT_INDIRECT → RESOLVED | Ten definitions project the complete existing effects. The rolled result opens its definition in one click. The original d10 table, effects and roll probabilities are retained. |
| Creature valuations | Bare Bones PDF/printed 58–62, individual Creatures | Twelve `core-valuation-*`: PRESENT_BUT_INDIRECT → RESOLVED | Each relevant creature has a secondary Valuation link. Prices come from the existing creature record; conditional bounties, per-litre blood values and intact/pieces distinctions remain intact. |

Selected before: 6 MISSING, 1 PARTIAL, 22 PRESENT_BUT_INDIRECT. Selected after: 29 RESOLVED. These are reference needs, not 29 new subsystems or newly extracted source tables.

Animal entries deliberately contain **no HP, Morale, Armor, Attack, speed, carrying capacity or invented quantity**. They are purchase references, not creature definitions. Other supplements' animals are not merged into them.

The twelve valuation identities remain separate: Seth, Bent, Zukuma, Wrat, Belze, Lich, Arbint, Nodh, Lady Porcelain, Thinx, Aland and Eulotha. In particular, Aland's valuation does not become Wild Wickhead's valuation.

## Names, direct links and table return

Treasure identities: Ash-grey ring; Vile flute; Famine spoon; Malevolently-accurate mirror; Vampiric Phurba; Black pearl; Torch; Silver bird cage; Black Crown of the Crippled King; Ancient blindfold.

The source's generic **Torch** is displayed as **Torch · Occult treasures** to distinguish it from ordinary equipment. Its canonical source name remains `Torch`; the original row text is unchanged. This qualifier is explicitly app lookup policy, not a new official item name or mechanic. Ordinary Torch continues to open the mundane equipment definition.

The full text of each Treasure remains in one canonical source row. Reference definitions and generated-result links refer to that row. COPY retains useful effect text; the compact rolled view displays the name as the direct definition link. TABLE keeps the original full entries and opens their definitions. Back now restores table mode and its scroll position instead of reverting to an empty result view.

The four verified Core follower names (Earthbound, Wild Wickhead, Pale one and Prowler) have explicit, bounded name links. There is no standalone rollable Core Outcast selector in the current registry; no new random selection procedure was invented. Browser acceptance follows a named follower from the existing Outcasts reference; text-link resolution for all four names is tested.

Creature valuations use **one read-only registry projection of the existing twelve creature records**. There is no second price pool and no twelve-table duplication. The collected index is labelled APP_POLICY in SOURCE: the book supplies individual values, not a market or automatic-loot procedure. No price is added to compact monster cards.

SOURCE stays closed by default. Treasure/purchase lookup presentation is APP_POLICY; the source entry and its exact book/page remain PRIMARY SOURCE. Opening a Treasure definition performs no extra die roll. English source text remains primary; Korean helpers are stored and rendered separately and do not affect routing or generation.

## Optional Arcane Catastrophes: deferred

`core-catastrophe-repeat` remains **PARTIAL**. Existing individual catastrophe rows are retained, but the private data's shared repeat-result note lacks the complete continuing black-fire damage/water consequence. The remaining problem is therefore not merely lookup or linking. The optional criteria are not met; no extraction, new effects, individual catastrophe definitions or pretend-resolution tests were added.

Classless creation and supplement-specific loose ends were not included.

## Source verification and data safety

Only the relevant Core pages were checked: Bare Bones 3, 26, 32, 58–63 and 65, with targeted Full Edition corroboration for Outcasts. PDF extraction and page images were used; this is not another book audit. The original supplied Bare Bones SHA-256 is `7d633742dc2cfeabf98e4b544331bed4f921494aa279747bd9d4a5c878300219`.

[The source report](SOURCE-INTEGRITY.json) records 29 exposed references, all 27 table-backed definitions, resolved source identities and **UNSOURCED: 0**. Existing registry source validation remains enabled. Modified valuation data fails its independent attestation; a modified Wild Wickhead record is not exposed as verified. Missing private data produces no substitute definitions.

The private source bundle was backed up locally before adding five purchase rows and navigation/translation metadata. Existing Treasure English, rolls, weights, creature statistics and valuation values remain unchanged. Private data is distributed through the existing encrypted update path; the publisher key is unchanged. The public build contains no plaintext source bundle.

No campaign schema or saved object migration was needed. Browser acceptance starts with the older isolated QA campaign/cache, rather than testing only a fresh installation. That exposed one necessary compatibility fix: unchanged cached Treasure rows gain missing lookup identities, and an unchanged Wild Wickhead record gains its missing Korean helper. User-authored source text, dice and existing custom translations win. No campaign, character, note, placement, assignment or stable ID is regenerated.

## Verification and interactions

- **15 targeted tests added; 653 total passed, 0 failed, 0 skipped.** All 638 pre-existing tests are preserved. The canonical registry count now includes the purchase catalog and valuation projection. The old translation-only English checksum is still asserted over its original table set; the five new purchase rows have separate exact-content assertions. The legacy local import fixture remains tested separately.
- `npm run lint`: passed. `npm run build`: passed, including public-build privacy checks (74 static files).
- [Browser acceptance](browser-local.json): isolated production-preview context with an older QA campaign and private cache; all queried results checked through the UI. Search entry/open, named Treasure follow-through, manual table choice, Back, source disclosures, valuation, full preference reload and campaign preservation are exercised. Browser exceptions: 0.
- Common direct actions: generated Treasure → definition **1 click**; Monster → valuation **1 click**; a named Outcast choice → definition **1 click**; Beasts row → animal purchase **1 click**. Search from an already open desk takes one query entry and one result click. Services → RELATED → Beasts → animal takes three clicks from the services reference, with a meaningful list choice.
- The full extended script records **71 interactions**, including 17 query entries/opens, closes, Back, Source, Table, pinning and reload. These are explicitly enumerated, not presented as a 71-click normal play loop. Responsive resize/screenshot operations are excluded.
- **360 / 768 / 1440 / 3440:** 28 screenshots across Outcasts, Wild Wickhead, purchases, long Treasure effects, valuations and source disclosures. No document or inspector horizontal overflow. Actual images were reviewed: long names wrap; Korean remains readable below English; wide layouts stay bounded; source/valuation details require intentional interaction. No global card size or navigation section was added.
- All Reference preferences survive reload, and the serialized QA campaign data is identical before and after. Local browser logs include the comparison hash. No production campaign was touched.

Build and local acceptance belong to this release. The exact pushed/deployed commit and live smoke result are reported separately after deployment; local success is not used as proof of production deployment.

## Final Core decision

**During ordinary Core play, no remaining recurring mechanical PDF lookup is known from Batch 3 plus this focused acceptance.** Hiring/loyalty, the previously inaccessible follower, animal prices, named Treasure effects and creature sale values now have usable in-app answers.

The explicitly retained Core exception is the optional repeated Arcane Catastrophe consequence (`core-catastrophe-repeat`, PARTIAL). It is rare optional material, not a reason to reopen broad development. Full scenario prose, setting reading, artwork and deliberate source inspection remain appropriate reasons to open a book.

**A. CORE REFERENCE DESK COMPLETE ENOUGH.** Broad remediation should stop. Future changes should normally require an actual recurring play interruption or a verified high-frequency rule gap.
