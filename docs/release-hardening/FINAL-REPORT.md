# Reference Desk final hardening — 2026-09-05

Implemented and verified locally against baseline `7820fea0bf6ee83b7412cee748dfeb23edf8601e`. The paper notebook remains the campaign narrative record. No new campaign domain, mandatory Session, automatic story log, push or deployment was introduced.

## Requested completion report

| # | Area | Concrete outcome |
|---:|---|---|
| 1 | Fresh repository audit | Read HEAD and mapped entry points, search, contexts, registry, persistence, source delivery and CSS before editing. [Fresh audit](AUDIT.md). |
| 2 | Play friction | Modal inspectors hid the outside pinned tray; search rows conflated reading and rolling; rule copy was missing; region context could survive incorrectly after Back. These were corrected. Meaningful dice/procedure choices and source inspection remain. |
| 3 | Previous count | Previous scenario: 18 pointer clicks plus reload, with Reaction and Action + Theme already pinned. Export checks were outside its play count. |
| 4 | New counts | The newly requested 18-step scenario: 13 pointer clicks + 10 keyboard input groups + one reload, 16 transitions including reload. A separate replay of the old task list: 16 pointer clicks + one reload. The latter is the like-for-like comparison. [Traces](BROWSER-ACCEPTANCE.md). |
| 5 | Removed interactions | Removed closing the inspector before pinned Action + Theme and before Recent. The matched trace's navigation overhead fell from five to three clicks. No meaningful parameter or source reveal was removed. Common/pinned/related rolls are one action once visible; Stock Room keeps its parameters. |
| 6 | Search | Separate title OPEN and typed ROLL / RUN / GENERATE; Cmd/Ctrl+K focuses the input; Enter invokes the first playable action. Broken quick rule and Sarkash monster route rank ahead of less useful metadata. Rules and fixed creatures open without randomization. |
| 7 | Pins / recents | Compact short-name pins work inside the inspector, including while scrolled. Ten unique reference recents persist separately from Campaign data. Six latest roll snapshots are transient and collapsed by default; reading history is bounded at 20. Back restores a prior reading without rerolling; replaced/removed references are guarded. |
| 8 | Result / copy | Stronger actual answers, fewer duplicate titles, compact actions. COPY and COPY WITH SOURCE now work for quick rules as well as generated content. Regional monster plain copy contains creature, quantity and usable stats; source chains are appended only by the source variant. Actual clipboard and formatting tests passed. |
| 9 | Source chain | Collapsed disclosure distinguishes PRIMARY from ROUTED BY, preserves original citations and identifies PDF versus printed page. Related references are canonical data links, with weak shared-context padding removed. Stock links include NPC, Reaction, Useful Item and Treasure. |
| 10 | Confidence | `verified`, `partial`, `unavailable-source`, `conflicting-citation`; kept in disclosure except actionable unresolved cases. A verified statblock can retain a conflicting routing citation. No approximate match is promoted to authority. |
| 11 | Regional routing | All 36 outcomes across the six existing d6 regional routes now resolve: 29 explicit aliases and seven exact names with case normalization. Quantity and selected preset identity are preserved. Common Stock Room uses the same documented regional route without a second creature roll. [Routing audit](regional-routing.json). |
| 12 | Nine previous gaps | All nine individually resolved from supplied PDFs: six appendix references already present in Full Edition, plus three citation typos targeting existing HERETIC creatures. Exact rows and pages appear below. |
| 13 | Grift | No Grift route appears anywhere in the supplied 36-page Depths PDF. Its regional monster action remains explicitly unavailable. FERETORY's actual Grift hunting table, PDF 17 / printed 15, remains a separate usable source; no substitution was invented. |
| 14 | FERETORY / HERETIC | Both books checked: the cited FERETORY pages contain unrelated material; HERETIC contains the named skeletons, and another Depths row corroborates HERETIC. The target is verified, while the original incorrect FERETORY citation and conflict status remain inspectable. |
| 15 | Added useful references | 21 concise rules: Core tests, carrying, combat/crit/fumble/armour/Powers; EPK hunting and meat; HERETIC feat eligibility; SD moves/flee/search/camp/travel; Depths hex/encounter/reaction procedure; RECLVSE chapter-specific moves/combat/travel/dungeon; Mythic Fate and expected scenes. Three appendix presets added; two existing skeleton preset identities preserved. The SD crawl reminder was corrected. |
| 16 | Intentionally unindexed | Full adventure prose, maps, spatial puzzles, complete optional-engine chapters and unusual nonstandard-HP creatures are not converted into generic automated rules. Existing Alöne coverage remains 59 tables / 436 entries / six procedures. Undefined source cases stay undefined. |
| 17 | CSS lines | Legacy pair 6,051 → 4,897 lines (−1,154). All CSS, including the new reference stylesheet: 8,770 → 8,361 (−409). Source bytes 179,548 → 162,330. `!important` 207 → 186; none added as cleanup. Per-file accounting below. |
| 18 | Removed selectors | 132 obsolete whole rules, 89 distinct selector strings in 39 absent-class families; 307 exactly shadowed declarations; 87 empty containers. Live mixed selector branches, inherited rules and cascade-sensitive repeated media queries retained. [Rule list](removed-selectors.json), [replacement proof](css-removal-proof.json). |
| 19 | Bundle | Main JS 635,721 → 299,734 bytes; gzip 191,279 → 94,083. Full initial static JS 757,913 → 624,377 bytes; aggregate gzip 230,570 → 200,665. Twelve optional screens leave the initial closure. Initial shared chunks rise 7 → 17; total initial JS still exceeds 500 kB. Exact method and remaining cost below. |
| 20 | Private boundary | Static build contains no plaintext private packs, raw PDFs, publisher key, extracted private payload or personal filesystem path. Stronger guard passes 57 files. New source additions are in a content-addressed encrypted update. The API intentionally serves decrypted data to app visitors; encryption is storage/key separation, not visitor access control. |
| 21 | Delivery failures | Complete validation precedes cache activation. Partial/corrupt cache fetches a full bundle; lower revisions are rejected; failed download/validation/storage leaves accepted data and revision intact. Failed lazy runtime initialization can retry. Fresh no-cache 503 and valid-cache 503 were browser-tested; recovery loaded 757 references without reload. Real prior-pack merge reached the same 36 resolved outcomes as a fresh pack. |
| 22 | Local paths | Runtime sources, API, build configuration and static output checked. No personal or temporary paths affect production. Loopback in Vite is the deliberate local server binding; `https://localhost` in server URL parsing is a non-network base for relative request URLs. Test paths are synthetic. Ignored publisher/preparation files remain local. |
| 23 | Release configuration | Explicit Vercel build command, `dist`, Node function ciphertext inclusion and SPA fallback excluding API/assets/private paths. Server-only matching `MORKBORG_DATA_KEY` required. Preview executes the actual function handler and fails closed without it. [RELEASE.md](../../RELEASE.md). No hosting migration or publishing. |
| 24 | Production smoke | Desk, private load, search, Reaction, Action + Theme, regional creature/source/copy, persistent pins/recents, Campaign/Dungeon/Character, import/export, collapsed records, direct refresh, API failure and public privacy passed locally. Campaign export was byte-identical before/after reference-only play. [Browser acceptance](BROWSER-ACCEPTANCE.md). |
| 25 | Responsive acceptance | Before/after 360, 768, 1440 and 3440 screenshots. No measured horizontal overflow. At 360px the six-action play trace passed and visible play buttons were at least 44 × 44px. At 3440px the desk stays a readable 1400px wide. Actual viewport measurements, screenshots and scope are linked in browser acceptance. |
| 26 | Tests | 380 passed, zero failed/skipped: prior 340 retained plus 40 tests. Covers direct actions, snapshots, copy, confidence, source roles, exact aliases, Grift, all regional outcomes/quantities, corrupt/stale cache, failure/retry, static privacy and release middleware routes. One synthetic fixture received explicit alias metadata; no existing assertion was removed or weakened. |
| 27 | Lint / build | `npm run lint` passed; `npm run build` passed both TypeScript projects, Vite compilation and privacy guard; `git diff --check` clean. Node 26 emitted environment deprecation/experimental warnings during tooling, without failures. |
| 28 | Limitations | Remaining manual PDF cases and delivery constraints are listed below. This pass does not promise a complete rulebook replacement, total offline availability, a universal Grift route or a sub-500 kB complete initial payload. |
| 29 | Exact commit | The exact full SHA of the local commit containing this report is supplied in the accompanying completion message. `git log -1 --format=%H -- docs/release-hardening/FINAL-REPORT.md` identifies it from the repository. A commit cannot contain its own computed SHA without changing that SHA. |

## Nine outcomes: evidence and disposition

The earlier report's claim that the Rotblack Sludge appendix was absent was incorrect. The supplied Full Edition has 96 PDF pages and contains all three required creatures at PDF 79 / printed III. No outside statblock or invented replacement was used.

| Region / d6 | Named outcome | Depths PDF / printed | Disposition | Verified primary PDF / printed |
|---|---|---|---|---|
| Tveland (app: Galgenbeck) / 5 | Mongrel | 26 / 23 | Source present, previously not routed | Full Edition 79 / III |
| Sarkash / 5 | Mongrel | 27 / 24 | Source present, previously not routed | Full Edition 79 / III |
| Kergüs / 2 | Mongrel | 33 / 30 | Source present, previously not routed | Full Edition 79 / III |
| Kergüs / 3 | Fogbound Skeletons | 33 / 30 | Wrong FERETORY book label; conflict retained | HERETIC 25 / 23 |
| Kergüs / 4 | Dusk Gnoums | 33 / 30 | Source present; explicit plural-name alias | Full Edition 79 / III |
| Wästland / 4 | Guards with Sharpened Teeth | 32 / 29 | Source present, previously not routed | Full Edition 79 / III |
| Wästland / 5 | Mongrel | 32 / 29 | Source present, previously not routed | Full Edition 79 / III |
| Valley of the Unfortunate Undead / 5 | Fogbound Skeletons | 30 / 27 | Wrong FERETORY book label; conflict retained | HERETIC 25 / 23 |
| Valley of the Unfortunate Undead / 6 | Rotted Skeletons | 30 / 27 | Wrong FERETORY book label; conflict retained | HERETIC 23 / 21 |

Aliases bind the exact table, cited name, literal citation and verified target book/pages. Roman III remains a string. Missing, stale or ambiguous evidence fails closed. The stricter resolver alone resolves 22 outcomes against the *old* private pack; this is not the old implementation's 27/36 metric. The new encrypted pack and a merge from the previous pack both resolve 36/36. See [nine outcomes](nine-outcomes.json), [source audit](SOURCE-AUDIT.md) and [actual merge](stale-integration.json).

## Coverage after this pass

All nine supplied PDFs were searched as complete documents. Relevant pages were visually checked. This was a play-time reference audit, not a claim that every paragraph or every pre-existing transcription was independently revalidated.

| Book | Canonical tables | Associated references | Quick rules |
|---|---:|---:|---:|
| Bare Bones | 49 | 77 | 12 |
| Full Edition | 5 | 8 | 0 |
| FERETORY | 46 | 103 | 4 |
| HERETIC | 37 | 54 | 1 |
| Sölitary Defilement | 27 | 43 | 11 |
| Sölitary Depths | 58 | 74 | 3 |
| RECLVSE | 219 | 226 | 4 |
| Mythic Second Edition | 52 | 100 | 2 |
| Alöne in the Crowd | 59 | 67 | 0 |

The registry contains **757 unique references**, including 550 Oracle entries, 62 procedures, 44 rule-kind entries (including routing), 85 eligible creature entries, seven regions and nine books. There are **552 canonical tables**; paired canonical entries account for the Oracle-entry difference. Book-associated reference counts overlap and must not be summed as unique entries. All Oracle ranges and reference links validate: zero issues, zero broken links. Alöne's six documented procedures and rule guidance remain in its procedure surfaces rather than being duplicated as new quick rules. [Coverage data](reference-coverage.json).

## CSS ownership and bundle accounting

| Source file | Before lines | After lines | Owner |
|---|---:|---:|---|
| `style.css` | 2,561 | 1,848 | Base and surviving legacy surfaces |
| `workspace.css` | 3,490 | 3,049 | Existing campaign/editor workspace |
| `art-direction.css` | 2,719 | 2,631 | Established visual direction outside the desk |
| `reference.css` | 0 | 833 | Desk, command search, inspector, related/source/result/context controls |
| **Total** | **8,770** | **8,361** | Includes moved and newly formatted styles |

The legacy reduction is not claimed as the total reduction: moving and formatting desk styles is included in the new file. The 39 obsolete class families include old campaign glances, character/dungeon cards, context bars, room indexes, search wrappers and notebook rows. The exact rule/media/declaration evidence is retained, rather than assuming that every repeated breakpoint is dead. No global reset rewrite was attempted.

| Emitted asset metric | Before bytes | After bytes |
|---|---:|---:|
| Main JS | 635,721 | 299,734 |
| Main JS gzip | 191,279 | 94,083 |
| Complete initial static JS | 757,913 | 624,377 |
| Complete initial static JS, aggregate gzip | 230,570 | 200,665 |
| Compiled CSS | 167,925 | 154,394 |
| Compiled CSS gzip | 31,875 | 29,399 |

Paired measurements use final Vite return values in fresh processes, identical React/Tailwind settings, raw UTF-8 bytes and Node `gzipSync` defaults. Static closure recursively follows all static imports and excludes optional dynamic views; gzip totals sum separately compressed chunks. These are JS/CSS metrics, not a total network-transfer claim including fonts, images or the later private data response. Vite's CLI uses a different compression setting and displays main 635.72 / 193.62 kB before and 299.73 / 95.44 kB after; do not mix those gzip values with the paired measurements above. [Exact metrics](build-metrics.json), [reproduction script](../../scripts/measure-reference-build.mjs).

The baseline diagnosis found React DOM, Base UI and tailwind-merge as the largest library families; icons were already tree-shaken and no duplicate dependency version was found in the rendered graph. Application screens were the useful split point. Chronicle, Play Mode, editors, Mythic and other optional screens now use lazy boundaries; shared Chronicle fields and capture context were extracted to avoid retaining entire screens. The navigation shell, reference provider, schema/storage and accessible UI primitives remain eager. No optional screen is in the final initial static closure, but shared chunk requests increase from seven to 17. [Module diagnosis](bundle-diagnosis.json).

## Delivery and release boundary

The production flow is browser → same-origin no-store endpoint → encrypted asset authentication/decryption on the server → complete payload/schema/Oracle validation → one IndexedDB compare-and-swap transaction → active reference stores. A complete valid cache can activate before a server check. Failed validation or write never marks a new revision as accepted. Cached sections do not independently masquerade as a complete current pack. Missing sections force a full response, even when revision metadata exists.

Updates preserve deliberate local edits and add missing records/metadata. Verified aliases are deduplicated by binding and can refresh audited evidence; unverified metadata cannot overwrite verified evidence. Campaign storage is independent. Existing manually edited source values are not silently overwritten by an update; deliberate replacement requires an explicit verified import.

The matching server key and encrypted assets are required in the target Vercel environment. A static-only deployment is incomplete. Local production preview now uses the real handler; it never reads the ignored publisher key as a production fallback. Endpoint failure is generic and no-store. API/working paths cannot fall through to an HTML success page. Vercel configuration follows its [Vite routing documentation](https://vercel.com/docs/frameworks/frontend/vite) and [project configuration](https://vercel.com/docs/project-configuration/vercel-json). No public deployment was performed or claimed.

## What still requires the PDF, or a ruling beside the notebook?

1. **Adventure maps, spatial puzzles and room-key context.** Rotblack Sludge, Graves Left Wanting and similar scenarios still need their map, prose connections and scenario-specific timing. A creature/table inspector does not reconstruct the adventure.
2. **Detailed optional-engine rules beyond a short reminder.** Examples are RECLVSE follow-on navigation Moves, Sölitary Defilement failed-camp retry conditions, and uncommon exceptions in the selected engine. Source links identify the section; the compact reference does not replace its full explanation.
3. **Long class, spell, equipment or optional-rule exceptions not represented by the selected entry.** Existing character and Oracle content covers many of these, but no claim of complete paragraph-level coverage is made. Check the indicated original section when an uncommon condition matters.
4. **Four creatures with nonstandard HP handling.** Rotten Nurse (HERETIC PDF 64), Lentil Lice (FERETORY PDF 17), Cursed Trout and Carcasswan (FERETORY PDF 20) are intentionally excluded from normal fixed-stat creature automation. Their original special handling needs consultation; invented numeric HP was not added.
5. **Grift's missing Depths regional mapping.** This source has no such route. The verified FERETORY hunting material can be selected as its own procedure, but further searching the supplied Depths PDF will not supply the absent mapping.
6. **Two Alöne source omissions.** Holy Places does not state a town die; merchant totals below zero do not have a defined result (PDF 10 / printed 8). The UI preserves the gaps. These need a player/GM ruling; searching more pages of the same PDF does not resolve them.
7. **Unusual carrying objects and uncertain fictional consequences.** Concise mechanical reminders help, while source nuance and adjudication may still be needed. Choosing a rules engine or interpreting an Action/Theme prompt is normal play, not itself a forced PDF lookup.
8. **Unavailable private data.** A first visit without a functioning endpoint or valid cache needs data restoration or the books. A prior pack can lack the new aliases/presets until updated. A valid cache survives an API outage, but there is no service worker guaranteeing that a completely offline fresh page or never-fetched lazy screen loads.

The 36 regional outcomes no longer require a manual statblock search after a successful source update. Three still display their corrected citation conflict for inspection. Other operational limits are the remaining 624 kB initial JS closure, deliberate preservation of manual private-source edits, and the occasional refresh needed when an old open tab requests a lazy chunk removed by a newer build; the recovery UI was tested. None was concealed by claiming full source coverage or a completed deployment.
