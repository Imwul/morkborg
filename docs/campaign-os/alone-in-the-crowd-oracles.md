# Alöne in the Crowd — private Oracle extraction

Source: user-provided `Alone in the Crowd.pdf`, PDF 4–17 / printed 2–15. Book ID: `aitc`. The source PDF remains outside the public build. This document contains metadata and implementation notes only.

## Coverage

59 tables, 436 entries, 6 combined procedures. 58 tables are rollable; Merchant Dispositions is a reference requiring Presence. The entire NPC d66 spans PDF 15–16, including the shared 61–66 fallback. All table-bearing pages PDF 7–17 were rendered and visually checked. Pages 4–6 contain city-crawl guidance and direct procedure dice, rather than additional choice tables.

## Procedure boundaries

- Festivals use two independent d10 columns; results are never summed.
- Settlement names use independent d66 prefix and suffix columns. Slash/parenthesis variants remain choices.
- Settlement Size retains its printed d20 bands. Street counts are conditional dice-plus-modifier formulas, not evenly weighted size choices.
- Notable Artefacts roll type first. Types 1–2 use the concerning table. Types 3–4 use the three printed depiction columns; sculpture adds a size check. The pack never rolls both branches together.
- Street Contents rolls d2 times for city/metropolis. A plain combined Oracle procedure returns one contents result; the city desk applies conditional repetition.
- Merchant disposition requires 2d6+Presence. Its top 12+ band is represented by a boundary and open-ended metadata; source values below 0 are unspecified.
- Holy Places specifies small settlements and cities/larger but omits towns. Special Structures explicitly includes towns in its larger variant. Do not silently conflate these rules.
- Fixed guards/gambling references use fixedLookups metadata; they must not become random rolls of the referenced table.
- Street Type repeats Terrace at 6 and 11; both printed outcomes are retained.
- Direct damage, quantities, fees, probabilities, and move tests remain source text/procedure formulas rather than invented extra content distributions.

## Validation

Existing OraclePack Zod schema and validateOracleRegistry: pass. Exhaustive discrete-domain resolution: 483 outcomes, no gaps or overlaps. Stable IDs/source pages/procedure min-max paths/165 follow-up references: pass. Publisher connection material is absent from this addon.

## Combined procedures

| ID | Components |
|---|---|
| `aitc.festival` | `aitc.festival-adjective`, `aitc.festival-subject` |
| `aitc.artefact-depiction` | `aitc.notable-artefact-composition`, `aitc.notable-artefact-adjective`, `aitc.notable-artefact-subject` |
| `aitc.settlement-name` | `aitc.settlement-name-prefix`, `aitc.settlement-name-suffix` |
| `aitc.settlement` | `aitc.settlement-size`, `aitc.settlement-name-prefix`, `aitc.settlement-name-suffix`, `aitc.settlement-descriptor` |
| `aitc.street` | `aitc.street-adjective`, `aitc.street-type`, `aitc.street-contents` |
| `aitc.street-description` | `aitc.street-adjective`, `aitc.street-type` |

## Table inventory

| ID | Dice | Entries | PDF / printed page |
|---|---|---:|---|
| `aitc.city-crawl-failure` | d4 | 3 | 7 / 5 |
| `aitc.directions-reaction` | 2d6 | 4 | 7 / 5 |
| `aitc.pray-strong` | d4 | 4 | 7 / 5 |
| `aitc.pray-failure` | d6 | 3 | 7 / 5 |
| `aitc.stash-weak` | d6 | 3 | 8 / 6 |
| `aitc.animals` | d8 | 8 | 8 / 6 |
| `aitc.civic-buildings` | d6 | 6 | 8 / 6 |
| `aitc.city-gate-reaction` | d6 | 3 | 8 / 6 |
| `aitc.festival-adjective` | d10 | 10 | 9 / 7 |
| `aitc.festival-subject` | d10 | 10 | 9 / 7 |
| `aitc.gatherings` | d6 | 6 | 9 / 7 |
| `aitc.funeral-mourners` | d2 | 2 | 9 / 7 |
| `aitc.contest` | d4 | 4 | 9 / 7 |
| `aitc.spectacle` | d4 | 4 | 9 / 7 |
| `aitc.riot-complication` | d2 | 2 | 9 / 7 |
| `aitc.hazards` | d6 | 6 | 10 / 8 |
| `aitc.holy-places-small` | d4 | 4 | 10 / 8 |
| `aitc.holy-places-large` | d6 | 6 | 10 / 8 |
| `aitc.interior-hovel` | d4 | 4 | 10 / 8 |
| `aitc.interior-townhouse` | d8 | 8 | 10 / 8 |
| `aitc.interior-mansion` | d12 | 12 | 10 / 8 |
| `aitc.merchant-disposition` | 2d6+Presence | 6 | 10 / 8 |
| `aitc.notable-artefact-type` | d4 | 4 | 11 / 9 |
| `aitc.notable-artefact-concerning` | d12 | 12 | 11 / 9 |
| `aitc.notable-artefact-composition` | d12 | 12 | 11 / 9 |
| `aitc.notable-artefact-adjective` | d12 | 12 | 11 / 9 |
| `aitc.notable-artefact-subject` | d12 | 12 | 11 / 9 |
| `aitc.sculpture-size` | d2 | 2 | 11 / 9 |
| `aitc.settlement-descriptor` | d20 | 20 | 11 / 9 |
| `aitc.settlement-name-prefix` | d66 | 36 | 12 / 10 |
| `aitc.settlement-name-suffix` | d66 | 36 | 12 / 10 |
| `aitc.settlement-size` | d20 | 6 | 12 / 10 |
| `aitc.special-structures-small` | d4 | 2 | 12 / 10 |
| `aitc.special-structures-large` | d6 | 3 | 12 / 10 |
| `aitc.taverns` | d4 | 4 | 13 / 11 |
| `aitc.unexpected-events` | d6 | 6 | 13 / 11 |
| `aitc.falling-object` | d4 | 4 | 13 / 11 |
| `aitc.hunting-party` | d2 | 2 | 13 / 11 |
| `aitc.businesses` | d20 | 20 | 14 / 12 |
| `aitc.npc-encounters` | d66 | 31 | [15, 16] / 13–14 |
| `aitc.npc-musician` | d4 | 4 | 15 / 13 |
| `aitc.npc-cursed-toy` | d4 | 4 | 15 / 13 |
| `aitc.npc-prophet` | d6 | 3 | 15 / 13 |
| `aitc.npc-soldier` | d4 | 4 | 15 / 13 |
| `aitc.npc-beggar` | d4 | 3 | 15 / 13 |
| `aitc.npc-wound` | d4 | 4 | 15 / 13 |
| `aitc.npc-servant` | d2 | 2 | 16 / 14 |
| `aitc.npc-mugger` | d2 | 2 | 16 / 14 |
| `aitc.npc-pilgrim` | d2 | 2 | 16 / 14 |
| `aitc.npc-imp` | d4 | 4 | 16 / 14 |
| `aitc.npc-fence-weapon` | d4 | 3 | 16 / 14 |
| `aitc.npc-poet` | d4 | 4 | 16 / 14 |
| `aitc.npc-armour` | d2 | 2 | 16 / 14 |
| `aitc.npc-damage` | d4 | 3 | 16 / 14 |
| `aitc.street-adjective` | d20 | 20 | 17 / 15 |
| `aitc.street-type` | d12 | 12 | 17 / 15 |
| `aitc.street-exits` | d4 | 4 | 17 / 15 |
| `aitc.street-contents` | d12 | 11 | 17 / 15 |
| `aitc.backtracking` | d8 | 3 | 17 / 15 |
