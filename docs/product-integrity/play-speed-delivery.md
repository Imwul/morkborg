# Play-speed, visual noise and source-boundary delivery

Baseline: `eb956ffe272b3a80dab52b73473bdda8ec0be6b0` (the source-integrity/interrupted-work pass). This pass changes navigation, result presentation and authority metadata. It adds no campaign domain, source table, narrative generator or journaling system.

## Interaction measurements

Counts below start in the relevant context. A click means a deliberate button/disclosure activation. Typing, scrolling, browser reload and reading are not counted as button clicks. QA campaign creation is fixture setup, not part of the reference workflow. Search and Oracle use required no Campaign or Session; a separate QA Campaign was created only to exercise saved Dungeon/Room inspection.

| Action | Before | After | Change |
| --- | ---: | ---: | --- |
| Desk search after typing → Reaction result | 2 | 1 | Removed the separate 찾기 submission. Results appear inline. |
| Search result's explicit ROLL/RUN button | 1 | 1 | Already direct; preserved. The title/main row now executes too. |
| Action + Theme from its result row | 1 | 1 | RUN executes immediately. |
| Pinned Oracle | 1 | 1 | Preserved; home pins and the persistent tray execute. |
| Recent Oracle from its list | 1 | 1 | Preserved; home Recent now also has compact direct actions. |
| Expanded Room → individual component reroll | 2 | 1 | Removed the EDIT prerequisite. |
| Collapsed Room packet → component reroll | 3 | 2 | Open packet, then reroll. |
| Expanded Room → SOURCE | 1 | 1 | Direct disclosure; no More/Details nesting. |
| Room Source → actual canonical table | 2 | 1 | Source link opens the table itself. |
| COPY | 1 | 1 | Plain result only. |
| Regional Monster from region context | 1 | 1 | GENERATE stays direct. |
| Existing result → inspect table → same result | No dedicated non-rolling return | 1 return click | Added a result-return action that does not roll. |

The current browser acceptance recorded **20 button clicks** across the requested reference/Room flow. An isolated archived-baseline browser independently measured the three changed paths. This gives **23 before → 20 after**, removing 3 clicks (13%). The complete before total is derived from those measured paths, not claimed as a second uninterrupted end-to-end recording. Baseline evidence is in `outputs/play-speed/baseline-measurements.json`.

Current recording:

1. Reaction search result ROLL
2. COPY
3. Search from result
4. Action + Theme RUN
5. PIN
6. After reload, pinned RUN
7. RECENT
8. Recent Action + Theme RUN
9. Close to Desk
10. Sarkash
11. Regional Monster GENERATE
12. SOURCE
13. Close Monster
14. Open the prepared saved Dungeon from its library
15. Room ledger
16. Room 02
17. Component reroll
18. SOURCE
19. Canonical table
20. Close table → Room 02

The isolated Campaign/Dungeon fixture was prepared between the reference and saved-Dungeon segments. Source-table close restored Room 02, the same two saved components and keyboard focus to the launching source-table button. Reload retained the saved Dungeon/Rooms, their source metadata, Action + Theme pin and Recent references. Reload opens the Desk; it does not promise to reopen the last Room.

## Direct execution, search and context

The Desk starts with Search, Pins, Recent, then four common tools. Its explanatory hero was removed. At 1440px without a Campaign, heading height fell from 261px to 72px and the search top moved from 359px to 160px.

Search rows have one primary action and an optional direct details control. Rollable rows execute when their main row/title is selected; rules open; source procedures run; regional creatures generate. Encounter Prep is explicitly OPEN because it requires a meaningful Common/Rare/Room choice. Existing creature records open without rolling new stats.

All twelve requested queries already ranked the intended playable entry first; that rank was preserved and regression-tested. No artificial ranking change was introduced. See [query-by-query results](reference-play-speed.md).

Monster context now has four relevant canonical tools: Reaction, Morale, Corpse and Treasure. Room context is bounded to six primary tools, at most eight when expanded. The region's duplicate regional-generation button was removed. Pins are no longer arbitrarily truncated to the first two in the persistent tray; the compact tray scrolls when needed.

## Source boundary and Room experience

SOURCE remains closed by default. PRIMARY SOURCE, ROUTING SOURCE, SOURCE PROCEDURE, APP POLICY and MANUAL are separate within it. Exact book identity, PDF/printed page, table and roll remain inspectable. Verified result cards gain no always-visible authority badges.

Special Rooms distinguish the source's four prepared slots, the Core Sample Rooms procedure, and the app policy choosing that table for those slots. Region weighting, neutral structural names, cross-book field grouping and presentation grouping are marked APP_POLICY. Actual Sölitary Depths regional routing remains SOURCE_PROCEDURE and ROUTING SOURCE; it does not receive an invented weighting explanation.

Manual/source-edited fields keep their historical source and explicitly say they were edited manually. New authority fields are optional for old saves and survive schema/import validation. Existing campaign text is never regenerated or migrated to new text. The QA browser used isolated storage; user browser data was not edited.

Expanded Rooms show a directly reachable component reroll and SOURCE. Source-defined dependent rerolls remain documented; manual overwrite safeguards and Previous recovery remain. The four default packets retain numbers, primary fragments and relevant secondary fragments while translation/editing/roll traces stay closed.

Opening a canonical table retains the underlying Room. Closing it restores that Room and focus; inspecting an existing reference result's table has a separate non-rolling return. Regional monsters now show the verified name and actual quantity with essential stats in one packet. The original source row and source chain remain unchanged behind SOURCE.

See [authority model and evidence](source-authority-pass.md).

## Card and control cleanup

Monster cards keep name, HP/Morale/Armor and an attack line. Character cards keep identity, class and HP/Omens. NPC/Encounter cards keep their role/type and useful stats. Dungeon cards keep title, region and room count. Verified untouched Encounter titles use canonical identity and their unrolled quantity instruction without displaying source citations. Their complete stored source text remains intact; manual names/edits and unresolved legacy values retain their literal display. Timestamps and placement captions were removed from default cards; existing maintenance menus remain under ⋯. Expanded Room previews no longer repeat all components above the full fields.

REROLL and COPY remain visible on results; COPY WITH SOURCE is under ⋯. The latter appends concise book abbreviations and PDF/printed pages, without internal IDs, dataset versions, procedure IDs or debug notes. Plain COPY contains play content only.

Repeated dice traces and citations moved into SOURCE. Home and region quick tools also omit the search row’s book/type subtitle; the compact subtitle remains useful within intentional reference search. Dungeon entrance and City tool headings no longer carry permanent book/page prefixes; their actual instructions and canonical source links remain. Ordinary controls use paper/ink. Yellow remains for active navigation and selected/important actions. Result motion is a brief 180ms emphasis and is disabled with reduced motion.

## Browser and responsive QA

Actual screenshots were inspected at **360, 768, 1440 and 3440px**. No horizontal page overflow was found. Room widths were 324 / 253 / 561 / 688px respectively; the 3440px Desk remains bounded to 1400px. Four packets remain distinguishable and concise; the 360px stack is intentionally vertical.

At 360×800, the ordinary Reaction inspector is 344×473px; result, REROLL, COPY and SOURCE fit without scrolling. Primary actions, Back and Close have at least 44px touch height/width where appropriate. The inspector toolbar reserves room for Close and scrolls horizontally for additional pins. Open source details scroll inside the same bounded inspector.

The mobile Search → ROLL → COPY → RECENT → direct ROLL → REROLL → SOURCE → canonical table → return existing result → close sequence used **9 button clicks**. The result was unchanged by table inspection/return. Ctrl+K search and Enter opened Broken correctly, Escape closed the inspector, and reduced-motion disabled result animation.

Monster, NPC, Encounter and Character cards were also generated/saved through the real UI and visually checked at 1440 and 360px. Identity and essential stats remained visible and maintenance menus remained closed.

Local QA artifacts, containing private rolled examples and isolated browser storage, remain untracked under `outputs/play-speed/`. They are not bundled into the public app or campaign exports.

## Validation

Added **26 tests**: 9 authority/boundary tests, 8 reference action/search/copy/region tests, 3 Room view/reroll tests, 3 library-card tests and 3 encounter-display preservation tests. Full suite: **558 passed / 0 failed / 0 skipped**, up from 532. Existing generation, source, import/export and data-preservation coverage was retained. The prior 10,000-pass integrity checks continue to pass; no source-generation regression assertion was weakened.

`npm run lint`, `npm run build`, TypeScript and `git diff --check` passed. Public-build privacy checks passed across 70 static files. Source authority is resolved on load/generation and is not scanned expensively during every render.

## Remaining deliberate friction

- Entering a saved Room from the Dungeon library still requires Dungeon → Room ledger → Room selection. Once the Room is open, reroll and SOURCE are each one click. The dossier's four packets are another direct preparation view.
- Encounter Prep, city moves and other source procedures with meaningful parameters retain their choice controls. Manually edited values still require confirmation before destructive rerolls.
- Additional pins may require horizontal scrolling on a phone. Complete source tables and long source disclosures may require vertical scrolling after the user requests them.
- COPY WITH SOURCE takes two clicks via ⋯; ordinary COPY remains one.
- Browser reload returns to the Desk with saved Campaign data and reference preferences retained; it does not restore the open inspector/Room selection.

## Delivery record

Implementation is committed locally and pushed only after the checks above. The exact final commit hash and remote/deployment verification are reported in the delivery message. A successful push is distinct from production deployment: the production URL, deployed SHA and smoke result are reported only after the hosting service confirms and the public app is checked.
