# Production browser acceptance — 2026-09-05

The local production build was served by `vite preview` with the same handler as `/api/rulebook-data`. Private data came through that endpoint. Development plaintext fallback was not used. The original development origin and its campaign data were left intact; imported campaign verification used a separate preview origin.

| Production smoke requirement | Observed result |
|---|---|
| Desk and private data | First visit progressed from the 55 source-independent entries to 757 references; nine books and 552 tables available. |
| Search | Cmd+K focused the input immediately; Reaction and Sarkash monster support direct actions; Broken quick rule ranked first. Ordinary title activation remains separate. |
| Reaction / Action + Theme | Direct rolls, rerolls and in-inspector pins worked. |
| Sarkash | Generated a verified Mongrel from Full Edition PDF 79 / printed III, routed by Depths PDF 27 / printed 24. Quantity and statblock displayed. |
| Source | Collapsed initially; PRIMARY and ROUTED BY, PDF and printed pages, and confidence were readable when expanded. |
| Copy | Actual clipboard checked for a quick rule: plain text contained title and useful rule only; COPY WITH SOURCE appended book, section and PDF page. Generated result copy and feedback also passed the play traces. Formatting is additionally covered by domain tests. |
| Pin / Recent | Persisted after a full-page reload; latest rolls are temporary, collapsed by default and separate from persistent recent references. |
| Campaign / export | Imported an existing QA export into the separate preview origin. Exports before and after reference-only play were byte-identical, schema v6. No Session or narrative record was created. |
| Dungeon | Existing two dungeons / eight rooms loaded; a placed group of three Flail-Horned Muskox and its notes remained present. |
| Character | Torvul and Harmug loaded; Torvul's existing HP, abilities and equipment rendered correctly. |
| Optional records | Secondary navigation remained collapsed. No expansion of record features. |
| City | Alöne City Crawl and the compound Street roller worked, with a relevant Tavern follow-on link. |
| Mythic lazy view | Loaded on first open; a manual d100 value survived close/reopen. A deliberately stale lazy chunk, created by rebuilding while the page remained open, showed a recoverable refresh action without taking down the Desk. Refresh recovered it. |
| Region Back | Opened Sarkash → Stock Room, changed parameter to Kergüs, returned to Sarkash, then used Common Encounter: the generated result was correctly routed through Sarkash. |
| SPA / API paths | Index and direct SPA path returned 200; unknown API, plaintext rules and working-file paths returned 404. Endpoint responses used no-store; same-revision response omitted the bundle. |
| API failure without cache | A separate fresh origin against a server without its key returned 503 and displayed a clear missing-data state. After restarting with the matching key, “지금 확인” loaded all 757 references without a page reload. |
| API failure with cache | Reloaded that origin against a server without its key: all 757 references loaded from valid cache and Reaction rolled. Source status said the server could not be checked and saved data remained usable. |
| Corrupt/stale/version/failed-write cases | Automated tests and a real prior encrypted-pack merge passed. These are not claimed as browser network-offline simulations. |
| Public assets | Build guard passed across 57 static files. No plaintext source pack, publisher key or personal filesystem path was found. |

The source outage notice with a valid cache lives in the collapsed source-update controls, keeping ordinary play compact. A first visit with no data has a visible Desk error. There is no service worker guaranteeing a fresh offline page load or an unfetched optional chunk.

## Measured interaction traces

The newly requested 18-step scenario used **13 pointer clicks, 10 keyboard input groups, one full-page reload, and 16 view transitions including that reload**. Each shortcut, whole query entry and Enter is one input group; individual characters are not counted. The trace starts with Reaction and Action + Theme pinned, as in the prior scenario. On an entirely new browser those pins cost two additional setup clicks. Source inspection and meaningful Stock Room parameters were retained. See [play-trace.json](play-trace.json).

Because the new task list differs from the previous list, a second replay matched the old scenario: **18 → 16 pointer clicks**, both plus one reload and with the same two pins. It removed the close before pinned Action + Theme and the close before Recent. It retained source inspection, NPC generation, Back, reroll, pinning and persistence checks. The final 16 clicks comprise 12 intentional choices, one source reveal and three remaining navigation actions; zero mandatory save/context dialogs. See [comparable-trace.json](comparable-trace.json).

At 360px, Search → Roll → Copy → Back → Recent → Reroll took **six pointer clicks and one query entry**; expanding Source cost one additional click. The source panel fit, Back restored the result, pins remained available inside the inspector, recent rolls remained collapsed, and visible play controls measured at least 44 × 44px. Dialog client and scroll widths were both 310px. See [mobile-play.json](mobile-play.json).

## Responsive evidence

All measurements below used the selected tab's actual viewport, rather than merely requesting dimensions on an inactive tab. Height was 1000px. The document includes a vertical scrollbar.

| Viewport | Document width | Desk width | Before | After |
|---:|---:|---:|---|---|
| 360 | 345 | 309 | [Before](screenshots/before-desk-360.png) | [After](screenshots/after-desk-360.png) |
| 768 | 753 | 515 | [Before](screenshots/before-desk-768.png) | [After](screenshots/after-desk-768.png) |
| 1440 | 1425 | 1130.625 | [Before](screenshots/before-desk-1440.png) | [After](screenshots/after-desk-1440.png) |
| 3440 | 3425 | 1400 | [Before](screenshots/before-desk-3440.png) | [After](screenshots/after-desk-3440.png) |

No horizontal overflow was observed at these widths. Ultrawide retains a bounded 1400px desk, strong headline and visibly separated paper surface; tables do not stretch across the monitor. Mobile grid sizing was corrected after a measured 14px result overflow. Inspector search, recents and pins remain in its sticky compact toolbar.

Additional evidence: [mobile source](screenshots/after-mobile-source.png), [regional source](screenshots/after-regional-source.png), [first-load API failure](screenshots/api-first-load-failure.png), [cached API failure](screenshots/api-cached-failure.png), [lazy-chunk recovery](screenshots/lazy-chunk-recovery.png), [final checks](final-browser-checks.json), [campaign preservation](campaign-preservation.json), [HTTP protocol](production-protocol.json).

These are local production-mode results, not a claim that the current public Vercel environment was updated or smoke-tested.
