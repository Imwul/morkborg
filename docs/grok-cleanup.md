# Grok publication cleanup — 2026-09-13

Baseline: `0c96e54`. Preserve the white reading surface, black/yellow masthead, blackletter typography, yellow result treatment, Home/Reference/Generators navigation, and NPC dice/result pairs.

## Reproduced defects and fixes

- **Sticky overlap:** at 1440px, the masthead was 212.59px tall but the index stuck at 92px and the Workbench at an older fixed offset. Measure the masthead with ResizeObserver and share its actual height with both margins. Both now start at 212.59px while scrolling; search focus no longer changes the border height.
- **Narrow tables:** d20/d66 became two columns whenever the viewport exceeded 1100px, even inside a 390px Workbench page. Result cells narrowed to about 75px. Columns now depend on the table's own width (768px threshold); narrow Workbench cells have about 289–300px. Wide pages retain the two-column presentation. The fixed footer remains outside the body grid's column sizing.
- **Missing monster result:** the multi-die Monster Approaches trace occupied an unbreakable 620px track inside a roughly 282px result section, leaving the answer at zero width. Compound traces now wrap above the full-width answer; the result surface clears the floating formula. Simple dice/result pairs retain the Grok arrangement with aligned columns. Sections without dice use their full width.
- **Narrow creature reading:** the viewport alone enabled a second creature column, reducing the body to 298px inside a 570px reading page. Creature columns now require 960px of actual reading space. At 1440px with Workbench open the body uses the available 570px.
- **Opening pages below the fold:** explicit reference navigation reveals the page title beneath the masthead. Search typing and rerolling keep their position. Selecting the already-open result on mobile now also closes the expanded index and reveals the reference.

## Verification

- Automated tests: **756 passed, 0 failed** before and after. New automated tests: **0**; these presentation changes were checked in the actual browser rather than with CSS-string assertions.
- Lint: passed. Production build: passed, including client/server TypeScript checks and public-build privacy checks (61 static files).
- Browser widths: **360, 768, 1440, 3440**. Checked Reaction, NPC, Monster Approaches, Core Miseries, Travel, creature reading, Home/Generators, and three open Workbench pages. No horizontal overflow in the final measured reference/result areas.
- Search sequence: Reaction → Morale → Weather → Corpse → Goblin → Travel → 10A. Discovery. No session start, progression, save, or mode transition was required. Rules and creatures were read directly; rollable references were rolled explicitly.
- Reaction reroll/copy works. Manual d66 input `3,5` displays result 35 and highlights row 35. Core Miseries retains all 36 random rows and the separate 7:7 text with PDF20 provenance after reload.
- Pins and three Workbench pages survive reload. Browser error log was empty after acceptance.
- Registry/data/roll engine/import/migration code is untouched: 1,000 references, 546 tables, 95 creature presets, 9 books remain the established dataset.

Screenshots, DOM measurements, sequence notes and command logs are under the local ignored `outputs/grok-cleanup/` directory. Initial failed measurements were used to iterate, not counted as acceptance.

## Scope retained

The large masthead and expressive result treatment remain Grok's design choices. Long canonical tables remain long; mobile Workbench keeps its existing compact shortcut presentation. No content, source mappings, persistent schema, new navigation system, or gameplay feature was introduced.
