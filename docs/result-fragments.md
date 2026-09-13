# Independent result fragments — 2026-09-13

Request: replace the large shared yellow result box throughout the Reference Desk, preserving the rest of the publication design.

## Change

- Separate result items from the shared reroll/copy controls in the markup. Controls spanning the grid no longer keep unused columns open.
- Remove the shared yellow background, black offset shadow, and outer padding.
- Present each result with a thin divider, a small yellow dice highlight, its field title, and the answer directly below. Sections align to their own content instead of stretching to the longest answer.
- Let the answer use the full width of its item. Long text uses the body face and readable line height; concise answers retain the blackletter accent. Compound dice traces wrap across a full line.
- Keep the existing table-row highlight, formulas, translations, links, reroll behavior, source disclosure and copy actions. Increase the result action labels from tiny display text to the shared secondary text size.
- Remove 26 lines of superseded result styles. No registry, source, generation, storage or migration code changes.

## Browser evidence

The same four Street results were captured before and after at 3440px: the result area decreased from 462.86px to 281.08px high. Three short items decreased from 330px to 129px; the longer item uses 220px. Each result has 685px of width instead of 430px with a second narrow answer column.

Actual browser checks at 360 / 768 / 1440 / 3440px confirm transparent outer surfaces, intact results, and no item overflow. At 1440px the four Street items form two columns; at 3440px all four use the available row without empty result columns. Mobile retains all four items in one column.

Additional checks: seven NPC fields; compound Monster Approaches dice at 360px; Reaction reroll and matching table row; Workbench at 1440px; Core Miseries 36 rows plus the fixed 7:7/PDF20 footer. Browser error log was empty. Home, typography outside the result area and navigation remain in place.

Evidence is local under ignored `outputs/result-fragments/` (screenshots, measurements and command logs).

## Validation

- Existing automated tests: 756 passed, 0 failed. New tests: 0; visual layout was checked in the real browser.
- Lint: passed.
- Production build: passed, including client/server typechecks and privacy checks for 61 static files.
- Copy serialization is covered by the passing existing tests; the button returned its success status. Clipboard readback in the browser harness returned stale text, so browser clipboard contents are not marked as verified.
