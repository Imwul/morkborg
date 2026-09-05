# Fresh source hardening audit

Scope: all nine supplied PDFs were searched again as complete documents; relevant routing rows, statblocks, rule summaries and page labels were visually checked. This was a play-reference audit, not a claim that every paragraph or existing transcription was revalidated. No external web source was used. No source artwork or full table payload is included here.

## Findings before implementation

The previous missing-appendix finding was incorrect. The supplied Full Edition has 96 PDF pages and includes Rotblack Sludge. All three required appendix creatures are on PDF 79 / printed III. The current oracle pack already indexes material on that page, but creature routing did not use it.

The three disputed FERETORY labels are citation typos with verifiable targets in HERETIC. The original citation must remain visible; resolving its target does not erase the conflict. HERETIC PDF 25 / printed 23 contains Fogbound Skeleton; HERETIC PDF 23 / printed 21 contains Rotted Skeleton. The corresponding FERETORY pages contain unrelated material. Depths PDF 31 / printed 28 also cites the Fogbound creature to HERETIC, corroborating the correction.

## Nine previously unresolved outcomes

| Region / d6 | Named result | Routing PDF / printed | Fresh disposition | Verified primary source |
|---|---|---|---|---|
| Tveland / 5 | Mongrel | Depths 26 / 23 | Source present, not routed | Full Edition 79 / III |
| Sarkash / 5 | Mongrel | Depths 27 / 24 | Source present, not routed | Full Edition 79 / III |
| Kergus / 2 | Mongrel | Depths 33 / 30 | Source present, not routed | Full Edition 79 / III |
| Kergus / 3 | Fogbound Skeletons | Depths 33 / 30 | Citation typo; retain conflict label | HERETIC 25 / 23 |
| Kergus / 4 | Dusk Gnoums | Depths 33 / 30 | Source present, not routed | Full Edition 79 / III |
| Wastland / 4 | Guards with Sharpened Teeth | Depths 32 / 29 | Source present, not routed | Full Edition 79 / III |
| Wastland / 5 | Mongrel | Depths 32 / 29 | Source present, not routed | Full Edition 79 / III |
| Valley of the Unfortunate Undead / 5 | Fogbound Skeletons | Depths 30 / 27 | Citation typo; retain conflict label | HERETIC 25 / 23 |
| Valley of the Unfortunate Undead / 6 | Rotted Skeletons | Depths 30 / 27 | Citation typo; retain conflict label | HERETIC 23 / 21 |

The source addon supplies three new Full Edition presets and adds aliases to the two existing HERETIC presets. It preserves their identity and the routing row's quantity. It creates no new dice table. Final integration check: all 36 regional outcomes resolve to a verified target, with three retaining a conflicting-citation status. The encrypted update and a merge from the prior published pack were both verified; see regional-routing.json and stale-integration.json.

## Grift

No Grift name or regional mapping occurs in any of the 36 supplied Depths pages. The regional section (PDF 26–33 / printed 23–30) covers eight named areas, including Lake Onda and Bergen Chrypt, but not Grift. The supplied FERETORY has a separate Grift hunting table on PDF 17 / printed 15. Core world descriptions and that hunting table do not establish a Depths mapping. Keep the Depths route unavailable; retain the real FERETORY entry separately.

## Coverage by book

| Supplied book | PDF pages | High-value finding / treatment |
|---|---:|---|
| Bare Bones | 76 | Add concise tests, carrying, attack/defence, crit/fumble, armour/shield and casting reminders. Visually checked PDF/printed 23, 28, 30, 31, 34. Existing Broken, rest, morale, Omens and Calendar remain. |
| Full Edition | 96 | Resolve appendix creature references at PDF 79 / printed III. Keep scenario tables and maps in their original context; no generic replacement encounters. |
| FERETORY | 68 | Add the actual hunting/quantity/meat reminder at PDF 12 / printed 10. Existing EPK preset selection is not the hunting procedure. Existing travel tables remain canonical. |
| HERETIC | 68 | Correct three routed book labels explicitly. Add feat eligibility reminder at PDF 6 / printed 4; do not silently apply feats to Core classes. |
| Sölitary Defilement | 40 | Add General Move, flee, search, camp, travel-day and leave-road reminders from PDF 7–8, 17 / printed 5–6, 15. Retain independent d20 comparisons and the travel page's explicit single-d20 exception. |
| Sölitary Depths | 36 | Add hex-entry, encounter sequencing and monster-reaction modifier reminder at PDF 25 / printed 22. Keep optional rolls and regional tables separate from other engines. |
| RECLVSE | 138 | Add chapter-specific Move, combat, road travel and dungeon-entry reminders at PDF/printed 11, 41, 49, 67, with room-generation pointer to 88. The combat chapter explicitly uses a single d20 attack, while general Moves use two; do not harmonize this away. |
| Mythic Second Edition | 230 | Add concise Fate Chart and expected-scene reminders at PDF 20/24 and 68 / printed 19/23 and 67. Existing Fate Chart/Check/Scene tools remain intact; do not blend their dice or Chaos procedures with other solo engines. |
| Alöne in the Crowd | 24 | Existing city procedures and 59-table addon cover the principal play material. Reconfirmed PDF 10 / printed 8: Holy Places does not specify a town die, and merchant values below zero are not defined. No invented fallback. |

The new rule module contains 21 short reminders, each with distinct PDF and printed-page metadata. All linked oracle identities were checked against the current private packs. These are reference additions, not a new domain or automatic campaign state.

## Alias requirements

An authoritative alias must bind the exact regional table, exact cited name and complete literal citation. Roman page III stays a string. A record in a different book may match only through such an explicit verified alias. Similar names alone are insufficient. Missing, undocumented or ambiguous aliases fail closed. Each new binding records correction category and source evidence; existing edition aliases remain supported.

## Remaining manual source consultation

- Adventure maps, spatial puzzles, room-key context and scenario-specific timing are not replaced by a table or creature inspector.
- Detailed optional engine Moves beyond these short reminders remain in their own books; examples include RECLVSE's follow-on navigation Moves and SD's failed-camp retry conditions.
- The SD dungeon-crawl reminder now includes the discovered-Special-Room modifier, fourth-room climax and later Strong-to-Weak conversion. It remains a concise pointer to the full Move.
- Choosing among alternative rule engines, interpreting uncertain fictional consequences, and adjudicating unusual carrying objects still require judgment. Source reminders must not imply these choices are automatic.
- Holy Places for a town and negative merchant totals have no stated source result. Opening more of the same PDF will not resolve that omission; the application should expose the gap.
- Grift has no Depths regional route. Its verified FERETORY hunting material remains available, but is a distinct procedure.

Validation performed in an isolated copy: five alias regression tests passed; all nine new private alias bindings matched exactly; rule IDs were unique and all linked tables existed; targeted TypeScript and lint passed. No checkout source file was edited by this audit agent.
