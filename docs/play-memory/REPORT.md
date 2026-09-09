# Context Stack + Roll Replay

This pass adds temporary object-navigation memory and exact roll snapshots to PLAY. It does not add rules, source entries, generator algorithms, Campaign domains, narrative logging, export formats, or keyboard shortcuts.

## Context: where was I?

- A context is an existing Campaign, Dungeon, Room, Character, Monster, NPC, Encounter, or Reference Desk. IDs are stored; labels resolve from the current object. Source, tables, references, searches and convenience-management pages do not become individual context entries.
- Maximum **5** contexts. Consecutive repeats collapse. A later revisit can become recent again. Opening a Room ledger packet records that Room without changing Campaign content.
- A compact **← ROOM 03** / **← Character name** returns directly to the object. Search, multiple reference lookups, source inspection, Tray and Replay keep the same origin. The full list is inside **PLAY → Context**.
- Return uses existing application selectors. Dungeon tab, Room selection and the selected library object are restored. Native Room ledger expansion is restored when appropriate. This is not browser history, content undo or scroll-position recording.
- Returning to an earlier crawl Room opens its Room detail if the live crawl has since moved on; it never rewinds the crawl's current Room or progress.
- IDs are checked against the live save. Deleted or invalid objects are omitted from the selectable list. No guess across Campaigns, no recreated objects. A still-valid recorded parent can be selected separately.
- The return button sits above the horizontally scrolling inspector toolbar. Mobile review caught that putting it _inside_ that toolbar could hide it after scrolling to another action.

## Replay: what did I just get?

- Maximum **10** successful resolved Reference results, newest first. Identical rolls are separate events. Replay lives under **PLAY → Recent rolls**, separate from Recent References.
- Capture covers Reference Desk/Search/Tray/Last execution, physical inputs, independent partial rerolls, Recipes, Oracle Library, inline reference rollers and City reference procedures. Opening a definition, selecting a table row, reopening a result, and an all-held no-op do not add rolls.
- Each snapshot stores the visible original blocks and short translation helpers, clipboard content, source references, actual dice, physical inputs, input origin, execution parameters and published dataset revision when available. It does not store the registry, NPC save object or remaining card deck.
- **APP_ROLL:** exact dice and text. **USER_ROLL:** actual entered value and text. **MIXED:** physical/digital origin is retained per component. Replaying does not ask for another input.
- **Composite/Recipe:** independent results stay separate. Recipe holds and `manualText` remain separate from canonical rolled text. Editing or holding the current Recipe result annotates that roll's snapshot; it does not create another roll event. Older snapshots are unchanged.
- **Parameters:** Encounter Level retains its selected region; Stock retains its choices/DR; City retains Move inputs. Only relevant conditions are shown in the optional disclosure. Snapshot viewing does not restore live execution settings.
- **Cards:** exact order, fifth/sixth-card branching and derived components with card indexes/source entries survive. Replay has no deck setter or generator dependency. Card inspection cannot consume, shuffle, restore or rewind the active deck.
- **Source changes:** stored output is never looked up again to decide what it says. Source inspection resolves current table/citation metadata. A missing reference, table or entry produces `SOURCE UNAVAILABLE` while keeping the visible result. The recorded revision stays internal.
- **COPY** uses original useful play text; **COPY WITH SOURCE** adds concise citations. No replay ID, timestamp, dataset version or debug parameters enter clipboard text. Manual text is labelled as manually edited when copied with source or inspected.
- **LAST** remains re-execution. **Replay** is read-only recovery. APP replay REROLL creates a new event; USER replay REROLL opens the existing physical input flow. No new shortcut was added.

## Storage and boundaries

`morkborg-play-memory:v1` is a dedicated versioned **sessionStorage** record. Existing local preferences and `morkborg-play-session:v1` are unchanged. Existing installations start with empty Context/Replay; no Campaign migration is needed.

Memory survives navigation and reload in the current tab. Session lifecycle follows browser sessionStorage semantics (browser session restoration can retain sessionStorage). There is no cloud sync, Replay export, Timeline/Chronicle event or permanent archive. Explicit return updates only existing navigation selectors; content, IDs, placements and timestamps are not rolled back.

PLAY management provides separate **Context 비우기** and **최근 결과 비우기**. These do not clear Last, Tray, Scratch, Pins, Recipes, Packs or Campaigns. Malformed individual stored snapshots are rejected without deleting valid neighbors or touching Campaign data. If writing sessionStorage fails, the currently open page keeps volatile memory and reports the storage failure.

## Validation evidence

Reproducible tools:

- `tests/play-memory.test.ts`: 21 targeted behavior tests, including live crawl Room selection, mixed input origins, missing entries inside otherwise valid tables, source/dataset changes, six-card branching, bounded memory and storage isolation.
- `docs/play-memory/acceptance.mjs`: isolated browser Context and Replay scenario, screenshots, click counts, Campaign-content comparison, optional paced play session.
- `docs/play-memory/edge-acceptance.mjs`: actual disposable Room generation/deletion, stale-context handling, retired-source simulation using a session snapshot, and byte-for-byte clearing boundaries.
- Existing `docs/navigation-fix/acceptance.mjs`: browser Back/Forward regression and current manual-edit preservation.

### Measured interactions

Counts start at the relevant open context; text entry is separate from clicks.

| Action                                           | Clicks | Result                                |
| ------------------------------------------------ | -----: | ------------------------------------- |
| Reference / Tray / Replay → original Room        |      1 | Same Room, no content changes         |
| Equipment reference → Character                  |      1 | Same Character                        |
| Reloaded reference → Room                        |      1 | Valid session context restored        |
| Open PLAY → Recent rolls → a snapshot            |      3 | Exact prior output; no execution      |
| Select a snapshot with Recent rolls already open |      1 | Exact prior output                    |
| Replay COPY                                      |      1 | Original useful text                  |
| Replay APP REROLL                                |      1 | New event                             |
| Replay USER REROLL                               |      1 | Input opened; no roll until submitted |

Browser cases include Reaction, Action + Theme, physical d20 **14**, a three-step Recipe with a held first result and manually edited second result, **Kergüs** Encounter Level, and a six-card rare monster with **Q♣ / 10♥ / 2♠ / A♠ / 7♠ / K♦**. Reopening every snapshot preserves its data and leaves the live remaining deck unchanged.

The isolated destructive test creates a fifth disposable Room, returns to it, deletes it through the actual UI, then confirms it cannot be reopened from Context. A retired canonical-ID simulation preserves the actual prior Reaction output and shows the missing-source warning. Clearing Context/Replay leaves all other tested storage values byte-identical.

Browser reports and screenshots are under ignored `outputs/play-memory/`; no private source bundle or Campaign fixture is included in the commit.

### Browser, visual and regression results

- Full suite: **727 passed**, including **21 new** tests; no existing tests removed or weakened. Lint, TypeScript client/server checks and production build passed. The public-build privacy check passed (69 static files).
- Final Context/Replay browser scenarios passed at **360, 768, 1440 and 3440**. No page errors, document/dialog horizontal overflow, Campaign-content changes or replay-induced deck changes.
- The existing browser-navigation acceptance passed at all four widths: browser Back, toolbar Back, Forward, table return, search restoration, all primary libraries, reload and manual-edit preservation.
- A **920-second (15 min 20 sec), 22-cycle** paced browser session alternated Room, Search, Tray, Last, Replay and Scratch. Observed accidental origin loss: **0**; re-searching an already rolled result: **0**; browser Back needed to recover origin: **0**. Reading pauses were included; this is a bounded representative simulation, not every play style. A subsequent final-build pass verified the mobile toolbar fix.
- Screenshots were opened and visually reviewed at each width. The Room/Character return target remains one short line above tools; single/composite/card results stay in one bounded detail surface. Recent Rolls uses compact rows rather than ten full cards. At 3440 the inspector remains intentionally bounded. At 360 results and short Korean helpers remain readable; cards/source are collapsed and scroll within the dialog.
- The app intentionally uses a paper/light color scheme. The 360 run used the OS dark preference and the other widths used light; both retain the intended explicit paper/ink colors rather than relying on browser auto-inversion.
- Existing focus styling, semantic buttons/disclosures and reduced-motion behavior remain. Return and replay actions retain a minimum 44px control height. No new sidebar, permanent Replay panel, accent-color blocks or shortcuts were added.

## Practical boundaries

- This is bounded temporary memory: older than 5 contexts / 10 rolls falls off. It is not a universal archive of saved Campaign-generator edits, combat actions or the separate existing Mythic panel's persistent history.
- A Recipe deleted or structurally changed after rolling still replays exactly. Its REROLL is withheld when the current recipe no longer has the same references, rather than silently running a different combination. An unchanged recipe uses its current working holds/manual edits when rerun.
- City Moves requiring choices reopen their existing input procedure for REROLL; Replay itself retains the original parameters and result without executing it.
- A fresh browser session does not restore temporary memory. Exact scroll positions and Source/Related open states are outside Context's contract.
- Browser QA uses isolated Chromium with touch-sized viewports; it does not claim physical iPhone/Safari testing or coverage of every play style.

Deployment and exact delivery commit are reported separately after remote verification.
