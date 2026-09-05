# Alöne in the Crowd: procedure verification

Inspected the supplied PDF directly on 2026-09-05; visually checked the move pages and Merchant Dispositions. The city tools are transient reference/roll helpers for use beside a paper notebook. They do not create a settlement model, track objectives automatically, spend Omens, change HP, alter equipment, or advance campaign time.

| Rule | PDF / printed page | Treatment |
|---|---|---|
| Street movement estimate | Alöne PDF4 / p2 | Five minutes per street is reference metadata, not automatic time advancement. |
| Daily discovery; Micro-crawl | Alöne PDF5 / p3 | One-in-eight daily settlement check; Micro-crawl directly rolls d4 streets. It does not use an invented City Crawl move. |
| Dérive; City Crawl | Alöne PDF6 / p4 | Dérive recommends DR10; both successful grades generate a street. City Crawl strong reaches an objective; all objectives met converts that effect to a new street. |
| City Crawl move | Alöne PDF7 / p5 | No objective-count modifier. Failed movement requires resolving the obstruction before generating a street. Its optional d4 inspiration branch is recorded, with private table text looked up by ID. |
| Get Directions | Alöne PDF7 / p5 | DR12 Presence. Strong offers one of two alternatives. Weak rolls summed 2d6 Reaction; eligible results offer either a bonus or destination distance. A benefit die is rolled only after an explicit choice. |
| Pray | Alöne PDF7 / p5 | DR14 Presence plus place bonus. Strong d4 and failure d6 use the existing private tables; no character resources are altered. |
| Stash Item | Alöne PDF8 / p6 | DR10 Omens when returning to retrieve items. Weak d6 and subsequent item conditions remain explicit reference results. |
| Merchant Dispositions | Alöne PDF10 / p8 | Two independent d6 plus Presence; exact weighted bands. Raw modified total is retained. Negative totals are unresolved because the first printed band is 0–3; the explicit 12+ band covers higher totals. Prices are multipliers, not automatic inventory edits. |
| Settlement Size | Alöne PDF12 / p10 | Printed d20 bands select the exact street formula; the actual street die remains independently rolled. Metropolis uses the source's abbreviated d20+20 option. |
| Two-die Move outcomes | Sölitary Defilement PDF4 / p2 | Compare each modified d20 separately; two passes strong, one weak, none fail. |
| Passing a DR | Bare Bones PDF28 / p28 | Equal to DR succeeds. No added natural-1/natural-20 exceptions for these solo Moves. |

Public code contains numeric procedures and short original explanations. Oracle entries remain in the private `aitc` source pack; no complete oracle text table is duplicated into the module. Follow-up IDs are `aitc.city-crawl-failure`, `aitc.directions-reaction`, `aitc.pray-strong`, `aitc.pray-failure`, and `aitc.stash-weak`. Merchant and Settlement Size references use `aitc.merchant-disposition` and `aitc.settlement-size`.

A supplied `modifier` is the caller's combined modifier. The helper provides source DR defaults and prayer-place bonuses, but does not infer a Character or silently add objectives, Presence, Omens, or a previously chosen Directions benefit. Dérive's DR10 recommendation should be displayed by the caller. Input DR remains explicit for table decisions.

Sölitary Defilement PDF5 / p3 has its own optional campaign variants (declining Misery dice, four-Omens limit). The city Move helper does not silently apply these to the existing Bare Bones Calendar or Character systems.
