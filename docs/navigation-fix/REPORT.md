# Browser Back / Forward correction

Baseline: `7c9662bf4edc8561ae268ca175d6e09f7e686cda`.

## Cause

App navigation changed React flags and saved workspace selectors. There was no `pushState`, `replaceState` or `popstate` integration. The browser therefore had no entries for Home, libraries, objects or reference inspectors. The inspector's separate previous-reference trail did not cover page navigation.

## Behavior

- Page changes and selected objects now enter the same browser history. Top-bar **뒤로가기** uses that history and appears only when an earlier in-app entry exists.
- Home, Desk, sources, Oracle Library, City, campaigns, libraries, Dungeon tabs/selected Rooms and selected Character/Monster/NPC/Encounter views can return via browser Back and Forward.
- Reference search, result, related reference, TABLE and PLAY dialogs participate in history. Closing an inspector returns through its whole overlay visit to the underlying page; the next Back does not immediately reopen the closed dialog.
- Search typing, repeated renders, copying and rerolling do not each create navigation entries. Returning to a result does not reroll it or touch Recent.
- The current route survives reload. An existing history entry prevents the startup campaign-list reset from replacing that route.
- Deleted objects normalize to their remaining library; deleted campaigns normalize to the campaign list. They are not recreated.
- Page scroll is retained; scroll-driven history writes are throttled. Existing inline disclosures keep their normal behavior, without making every expanded label a history entry.

## Data boundary

Browser history stores view flags, canonical reference IDs, workspace selection IDs, search text and scroll. It contains no copied Campaign, Dungeon, Character, NPC, Monster or Encounter objects. Restoring campaign navigation changes only active view/selection fields. It does not reverse content edits, reroll values, change source metadata, restore deleted entities, or change timestamps. Import/export schema and convenience preferences remain unchanged.

Existing result memory remains tab-local. A fresh document reload may reopen the reference without the old generated result; it never silently generates a replacement. Temporary import/export dialogs without their in-memory payload safely close after reload.

## Verification

- **12 new targeted tests; 706 total passing.** Initial history, batched navigation, query replacement, Back/Forward, branch replacement, dialog close semantics, cross-page links, reload/scroll, content preservation, deleted-target handling, invalid state, reference identity.
- lint, TypeScript and production build pass. Public-build privacy check: 74 static files.
- Actual isolated Chromium browser acceptance at **360, 768, 1440, 3440 px**. Dark system preference at 360; light at the other widths. iPhone Safari hardware was not available in this workspace.
- Reaction → source → TABLE → browser Back/Forward → previous-reference arrow → close restores the same roll and search text.
- Sources/City/Oracle/Fate → browser Back; source page → top-bar Back → browser Forward.
- Every primary entity library → detail → Back → Forward → Back.
- Dungeon → overview → Room 02 → source table → Back retains the expanded Room.
- A real QA manual edit to the entrance survives Back, Forward, reload and further Back. Campaign content matches exactly before intentional editing and after the edit respectively.
- Additional mobile check restored a 713 px scroll position and retained typed, unsaved campaign-form text through Back/Forward.
- Fresh profile shows no fake Back entry; a campaign-required Home target → campaign selection → Back returns to Home.
- Source and returned-Room screenshots were visually inspected. No horizontal overflow or JavaScript errors were observed.

Reproduce with `node docs/navigation-fix/acceptance.mjs [URL] [phase]`. Local screenshots, JSON and logs live in ignored `outputs/navigation-fix/`. QA save fixtures and screenshots are not committed.
