# Browser acceptance — 2026-09-05

Tested the actual app at `http://127.0.0.1:5173/` through visible browser controls. No application state was injected. Private exports were read from the app's export textarea and compared separately; campaign JSON and source keys are not committed.

## Final reference-first scenario

Started on Reference Desk with no selected Campaign or Session. Reaction and Action + Theme had already been pinned and verified across a page load. No PDF was opened during this flow.

| Requested step | Actual operation and observation | Pointer clicks |
|---:|---|---:|
| 1 | Open Sarkash from the desk. | 1 |
| 2 | Click Regional Monsters. Its actual Depths d6 returned 1; quantity d2 returned 2; the supplied Skelelk statblock loaded. | 1 |
| 3 | Expand SOURCE: Depths PDF 27 / p. 24 → FERETORY Eat Prey Kill PDF 15 / p. 13, EPK p. 5. | 1 |
| 4 | Click related Failed Morale; it rolls immediately. | 1 |
| 5–6 | Click related Reaction; it opens and rolls 2d6 immediately. | 1 |
| 7 | Close the inspector, open Stock a Room. | 2 |
| 8 | Roll the selected Common / Sarkash encounter. | 1 |
| 9 | Click related NPC; the existing source composition generates an NPC immediately, with no artificial combat statistics. | 1 |
| 10 | Close, then click pinned Action + Theme. Both canonical tables roll. | 2 |
| 11 | COPY confirms the short result was copied. | 1 |
| 12 | Previous Reference restores the exact earlier NPC result (Qillnach / Soldier); no reroll occurs. This also works across closing and reopening an inspector. | 1 |
| 13 | REROLL produces a fresh NPC. | 1 |
| 14 | Close, open Recent, select Failed Morale. | 3 |
| 15 | PIN Failed Morale. | 1 |
| 16 | Perform a full-page navigation to the same app URL, reinitializing the app with saved browser data. | 0 + 1 navigation |
| 17 | Failed Morale remains pinned alongside the earlier two pins. | 0 |
| 18 | Open Campaigns and export the unchanged QA campaign. The JSON matches the pre-reference-workflow export exactly. | 2 verification clicks |

**Play operations: 18 clicks plus one full-page navigation.** The additional two clicks inspect the export to verify data integrity. Text entry, scrolling and developer inspection are not presented as clicks. Reopening the page is the verified reload method; a browser keyboard reload shortcut was not used as evidence.

Common tasks after reaching a context:

| Task | Clicks |
|---|---:|
| Desk → Sarkash → regional monster | 2 |
| Pinned roller / related roller | 1 |
| Desk → Stock a Room → selected encounter | 2 |
| NPC / Action + Theme | 1 |
| Copy / source disclosure / back / reroll | 1 each |
| Recent tray → chosen table | 2 |

## Additional reference and city checks

- Keyboard: Cmd/Ctrl+K opens search; ArrowDown focuses a result with a solid visible outline; Enter activates it; Escape returns focus to the visible search button.
- `Sarkash monster` ranks the regional workflow first. `morale` ranks the Core quick rule first after fixing an observed alphabetic-ranking problem. `Prowler` opens its fixed source statblock, with no misleading ROLL button; `COPY WITH SOURCE` succeeds and source PDF 67 is visible.
- Source disclosure is closed when moving to a different reference. Going back preserves the existing result rather than rerolling it. Copy confirmation clears when moving back.
- City Crawl was rolled in the browser. The City/Metropolis street option produced two contents from its independent d2 count, plus an exit roll; the synthetic quantity roll cites the canonical contents source.
- Stash used current Omens 4. Switching to Merchant reset Presence to 0; the previous Omens value did not silently alter the merchant roll. Merchant was then rolled through its own 2d6 procedure.
- Plain COPY and COPY WITH SOURCE have browser success feedback. Unit tests verify short output, optional provenance, and preservation of artefact effect conditions in both formats.
- Directions and Pray branches, fixed Guards #54 lookup, Festival columns, and artefact conditional branches were exhaustively or deterministically tested at the domain level. They were not all sampled manually in the browser. See the city test suites and the separate 483-outcome / 165-link extraction validation.

## Original 23-step campaign scenario

This was performed in an isolated copy of an existing campaign, `The Bell Beneath Sarkash · QA`. It remains available for review. The original seven local campaigns were retained; the extra collision-import test copy was deleted after validation.

| Steps | Observed result |
|---|---|
| 1–3 | Opened the existing campaign copy; created Session 08, real date 2026-09-05, world date DAY 17; selected Torvul and Harmug. |
| 4–7 | Opened The Slave waste; marked Room 01 visited; used the existing quantity-3 Flail-Horned Muskox placement; recorded the session encounter as defeated with zero remaining. The Monster definition still has HP 18 and Morale 9. |
| 8–10 | Added Vorga using Quick Capture; generated Reaction; saved it as a Session Oracle event. |
| 11–14 | Created Black Crown of the Crippled King with Room origin; assigned it to Torvul; created the unresolved missing-bell Thread and linked Rumor. |
| 15–18 | Ended Session 08, wrote its summary, opened Timeline, and verified 14 events. Additional Misery, manual travel and note records were also present. |
| 19–20 | Reopened the whole page and exported again. Before/after JSON matched exactly. |
| 21–23 | Exported, pasted that JSON into Import, and exported the new collision-safe copy. All 69 owned UUIDs were fresh and unique; 897 original scalar values and links matched after expected remapping; no dangling chronicle relations remained. |
| Play Mode | Displayed the same two participants, HP/Omens, current room, placements and session encounter outcome, plus sourced travel/calendar helpers. |

Evidence: [browser-persistence.json](browser-persistence.json). The separate actual production v5 migration preserved all 445 scalar leaves and 32 original owned UUIDs, created an exact backup, and aborted safely when backup storage was simulated to fail: [production-migration.json](production-migration.json).

The numeric campaign day is independent of a Session's freeform world date. Early QA records created before the date-default correction retain their original Day 1 text; later records use DAY 17. Their history was not rewritten for the screenshot.

## Visual and accessibility observations

| Viewport | Document width | Observed behavior |
|---:|---:|---|
| 360 | 345 | Single-column desk; persistent compact tray; pin controls at least 44px wide. City dialog 329px wide, with equal 310px client/scroll widths. |
| 768 | 753 | Readable single-column reference content beside the compact navigation. |
| 1440 | 1425 | Two-part reference desk; readable inspector; expressive dungeon/character sheets. |
| 3440 | 3440 | No horizontal overflow. Main content bounded to 1504px; reference desk to 1280px. |

The 15px difference at smaller widths is the browser scrollbar, not clipped content. Screenshots and measurements are in [browser-viewports.json](browser-viewports.json) and [the report gallery](FINAL-REPORT.md#evidence-gallery).

Loaded styles include `prefers-reduced-motion` rules that disable animation and transition. This was inspected in the page stylesheet; OS preference emulation and a full screen-reader audit were not performed. An old Vite hot-reload error from an intermediate multi-file edit remained in the browser log; the final full-page reload and all acceptance interactions completed, and the final production build passed.

## Source coverage limits

The index contains 733 references over 552 canonical tables, 82 eligible creature presets, and nine books. Alöne contributes 59 tables / 436 entries / six compound procedures.

Of 36 outcomes in the six verified Depths regional d6 tables, 27 resolve to supplied statblocks. Six outcomes require the missing Rotblack Sludge appendix; three contain a FERETORY/HERETIC citation conflict. All 14 Core outcomes now resolve using audited edition/name aliases. Grift has no verified Depths table. The app states these limits and does not generate substitute statistics. See [regional-routing.json](regional-routing.json).
