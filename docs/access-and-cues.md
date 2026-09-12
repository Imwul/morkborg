# Home, generator access and result cues — 2026-09-13

The previous quieting pass hid useful destinations and made labels, dice and answers too similar. This change restores access and adds a small set of visual cues without changing source data or generation rules.

- Persistent Home / Reference / Generators navigation. The wordmark also opens Home.
- Home contains compact rows for six common references and existing generator destinations. Generators exposes Character, Monster, Dungeon, NPC, Room, Street, Settlement, Names and Action + Theme.
- Character / Monster / Dungeon reuse their existing creation and storage screens. Their existing campaign storage requirements remain; the freeform reference shortcuts do not need a session or save.
- Opening a generator's reference does not roll. Generator navigation dismisses the old inspector so it cannot cover the destination screen.
- Existing navigation history tracks the selected surface. Going back from Character restores Generators. Switching Home / Generators / Reference retains the current reading.
- Result labels use muted text; short answers use dark red ink and a left rule; rolled formulas use a small tinted background. The matched table row uses a pale yellow background. Selected navigation uses a background and underline, so color is not the sole signal.
- Registry identifiers, source mapping, formulas, manual lookup, content and migrations are unchanged.

Browser checks: 360 / 768 / 1440 / 3440px, no document horizontal overflow in the inspected home/result/generator views. Mobile navigation buttons are all44px high. The 3440px answer remains28px. The user's Meaning pair case was reproduced with two independent d100 results, and those results survived a tab round trip. Reaction's2d6 result6 highlighted row4–6. Character and Monster generation controls were reachable; Dungeon's existing New Dungeon action opened its generation screen. NPC opened directly from the mobile Generators page without rolling. Home survived reload. Final browser console error query returned0.

Validation: 756 automated tests passed,0 failed,0 skipped (2 new regression checks for canonical shortcut targets and non-mutating Home rendering). Lint passed. Production build passed, including TypeScript client/server and public build privacy checks.

Screenshots and test logs are local artifacts in `outputs/access-and-cues/`. Existing saved entities were not generated, edited or deleted during this navigation check.
