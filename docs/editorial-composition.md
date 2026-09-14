# Editorial composition pass

## Diagnosis before implementation

The actual local application was inspected before edits at 360, 768, 1440 and 3440px. Before screenshots are in `outputs/editorial-pass/`.

1. The 200px black masthead has the strongest weight on almost every page. The same logo, search underline and rectangular active tab dominate simple lookups and complex generators alike.
2. Home repeats equal-width shortcut rows, then encloses the generators in another rectangle. Its hierarchy comes from repeated boxes rather than composition.
3. The index places filters, Pins and Recent ahead of live search results. Equal heading weights and generous gaps make the lookup surface feel like a sidebar application.
4. Reaction, a 100-row Action Oracle, a creature and Travel share almost identical title/spacing rhythms. The formula floats far away from its title on desktop.
5. At 3440px, short table entries span excessive horizontal distances while Workbench pages repeat similar rules and headings. The extra width does not create a strong reading composition.
6. Yellow appears on ordinary controls as well as results; pink appears on ordinary oracle summaries. Exceptional information has little exclusive visual vocabulary.
7. Small condensed labels compete with expressive result typography. Source summaries in particular are too tiny to read comfortably.
8. PLAY is currently a compatibility destination redirecting to Reference Desk; there is no distinct live gameplay mode to reskin. Preserve that behavior. Apply the field-sheet composition to existing generators/procedure results instead of inventing a new mode or navigation requirement.

## Local book study

The only local PDF is the 76-page MÖRK BORG BARE BONES EDITION. Pages 1, 6, 20, 28, 31 and 56 were rendered and inspected: a full-bleed image followed by restrained colophon; prose changing into numbered psalms; compressed difficulty rows against open rule text; grouped crit/fumble rules; class text interrupted by short ruled tables. This edition is a plain-text adaptation, not evidence of the full edition's original color spreads. The redesign takes its exceptional hierarchy and compression/space contrast from these actual pages, and the more aggressive composition from the user's explicit brief.

## Visual thesis

An open, monochrome archive with an off-axis title and a compact numbered index; existing generators become dark field sheets; dice values and Core Miseries are the rare rupture. Reading text, numeric lookup order, focus, touch targets and all existing actions stay disciplined. No textures, decorative imagery, new routes, modes, source text or data fields.


## Final decisions

- Repeated black masthead → compact white spine with Search, Home / Reference / Generators, and horizontal type navigation. The existing header-height measurement follows font loading and wrapping.
- Always-visible “색인 1000” → no default catalogue wall or registry-count badges. The full collection remains available through an explicit type selection, All, Search, source/context filters, Pins and Recent. This follows the user's final clarification; no records were deleted.
- Live results below history → candidates immediately before history, in both visual and DOM order. On mobile, selecting a type reveals and scrolls to its results.
- Identical page titles → blackletter oracle/creature titles, condensed rule/procedure titles, restrained reading text. Typography distinguishes information types without changing their semantics.
- Uniform result formatting → independent result sections, separate labels/formulas, emphasized actual dice values. Original result text retains Grenze Gotisch; instructions and Korean translations retain Pretendard. Compound formulas are never parsed into guessed values.
- Same white treatment everywhere → existing generators/procedure results use a dark field sheet. Reference rules and tables remain an open archive. PLAY still routes to the existing Desk; no new mode was introduced.
- Repeated boxes and symmetric Home → a title column, ruled shortcuts and an offset generator list. Home's title scales to its own column, so it cannot collide with a shortcut.
- One narrow Workbench strip → 1440px places readable pages below the main reference; 3440px places two pages alongside it, with a restrained alternating offset. No new tray controls/state.
- Broad decorative yellow → yellow marks formulas/rolled values/selected table rows; magenta is reserved for Core Misery emphasis. The fixed 7:7 footer is an exceptional dark block with exact provenance.
- Legacy 1480px maximum when the tray was empty → the entire 3440px surface is available. Body measures stay bounded; extra width is assigned to related references and adjacent pages.

Removed or reduced: the giant banner, Home helper subtitles, framed generator container, repeated accent backgrounds, result-card framing, duplicated caption emphasis, registry totals, unsolicited full catalogue, and shadowed controls. Existing font files are reused; no images, textures, animations, dependencies or gameplay systems were added. The presentation stylesheet was replaced rather than appending another theme file; its total length grew to cover the responsive layouts, so this is not a claim of net CSS reduction.

## Typography and primary 3440 × 1440 composition

The user's primary display is **3440 × 1440**. Body/table text is 22px with approximately 1.5 line-height; secondary text 18px; source labels around 14px. Titles and results use Barlow Condensed / Grenze Gotisch, while long-form reading and Korean use Pretendard. Formulas preserve their full notation in a monospace/number composition. Large single-result numerals are a deliberate exception, not the default size of every label.

With three pages open at 3440px, the index is 320px and the main/tray regions approximately 1872 / 1248px; each adjacent page is about 562–568px wide (scrollbar presence accounts for the small difference). At 1440px, the index is 260px and the lower tray pages approximately 543px. Long pages have their own scroll area. On mobile, the existing tray becomes compact return links rather than full duplicated documents.

### Browser measurements — no tray, reference opened from Home

| Viewport | Header | Reference starts at | Reference width | Body/table | Horizontal overflow |
|---|---:|---:|---:|---:|---:|
| 360 × 900 | 212px | 248px | 305px | 17px | 0 |
| 768 × 1000 | 197px | 233px | 713px | 17px | 0 |
| 1440 × 1000 | 103px | 139px | 1021px | 18px | 0 |
| 3440 × 1440 | 108px | 156px | 1344px | 22px | 0 |

Measurements include the browser's scrollbar reservation. Small screens use a horizontally scrollable type strip; at 1440px all seven types fit without horizontal scrolling. The default full-index region is absent at all four widths.

## Validation

**Automated:** 763 / 763 pass; 2 new formula-presentation tests, 1 updated default-index presentation test. The initial run after removing the default catalogue failed the old “검색 결과 is always present” assertion; that expectation was explicitly updated to assert its absence while preserving Search, header types, Pins and Recent. All remaining assertions stayed intact.

**Lint:** pass. **Production build:** pass, including TypeScript and static-output privacy checks (61 files). No data/parser/store/migration/source IDs changed. Counts remain **1000 references / 546 tables / 95 creature presets / 9 books**. The smaller oracle count formerly shown in the type strip is a reference-kind count, not the underlying table-store count.

**18 manual browser checks:**

1. Default full index/counts absent; explicit All reveals the catalogue.
2. Seven desktop type links fit at 1440px; 3440px uses the full surface.
3. Mobile type selection opens and positions its results below the measured header.
4. Searching Weather leaves the current rule readable until a result is opened.
5. A search result opens its reference directly, without a category or mode screen.
6. Cmd+K focuses Search; ArrowDown/Enter opens the first candidate.
7. An unmatched query renders the empty state without removing the current reference.
8. Reaction → Morale → Weather → Corpse → Goblin → Travel → unrelated table, with no required progression, session, save or mode transition.
9. Recent returns to Reaction directly.
10. Pin/unpin 10A. Discovery updates the bookmark list; the test pin was removed.
11. Three Workbench pages open, return, survive reload as page IDs, and close independently; temporary test pages were removed. Roll results remain transient as before.
12. 10A. Discovery retains 20 rows and highlights the correct rolled row.
13. Action Oracle retains 100 rows; physical input 100 produces Reach and highlights row 100. Its final rows were actually scrolled/read at 360px.
14. Core Miseries retains 36 d66 rows, the separate 7:7 text, guidance and PDF20 footer provenance. A normal d66 roll highlights only an ordinary row. Import/migration paths are covered by the unchanged integrity tests.
15. Street returns four independent results and preserves conditional instructions, full English/Korean text and explicit reroll.
16. The City context filter returns existing city references while the open Misery stays available.
17. Optional campaign notes and Reference Desk remain reachable; existing notes were not edited.
18. Reaction/result/long-table/Travel/Creature/Home/Workbench screens inspected across 360, 768, 1440 and 3440px, with no observed horizontal page overflow.

Copy controls and their underlying serialization are retained and covered by the existing tests. Browser clipboard byte readback was not independently verified in this pass. No claim is made of an uninterrupted, timed 20-minute human fatigue study; validation used repeated actual search/read/roll/return interactions while inspecting layouts.

## Screenshot evidence

Local evidence is in `outputs/editorial-pass/` (ignored QA artifacts, not published source content):

- `before-home-1440.png` / `after-home-1440.png`
- `before-reaction-360.png` / `after-reaction-360.png`
- `before-reaction-768.png` / `after-reaction-768.png`
- `before-reaction-1440.png` / `after-reaction-1440.png`
- `before-search-1440.png` / `after-search-1440.png`
- `before-long-table-1440.png` / `after-long-table-1440.png`
- `before-rule-1440.png` / `after-rule-1440.png`
- `before-creature-1440.png` / `after-creature-1440.png`
- `before-travel-1440.png` / `after-travel-1440.png`
- `before-workbench-3440.png` / `after-workbench-3440.png`
- `before-results-3440x1440.png` / `after-results-3440x1440.png`
- Additional mobile last-row/footer, generator, tray-detail and primary-screen captures; `responsive-measurements.json` records measured bounds.

Initial wide captures used 3440 × 1000 before the user specified the 1440px height. The result comparison includes a 3440 × 1440 production baseline captured before deployment; the primary final captures use 3440 × 1440. Random result values can differ between equivalent reference states. Intermediate captures may retain earlier labels; the final Home/Reaction/Search captures reflect the removal of registry totals.

## Remaining compromises

- Mobile pays for visible section access with a 197–212px sticky header and a horizontal type strip. Table content is still complete; long source tables remain long.
- Workbench keeps the existing bounded scrolling behavior. It is for several nearby references, not a fully expanded parallel book for every page.
- Optional saved-record screens retain their legacy shell. Opening them can expose the already-selected reference in the existing dialog; Escape closes it. That pre-existing interaction was not redesigned in this visual pass.
- PLAY is an existing alias, not a distinct gameplay screen. The archive/field visual contrast follows current reference kinds and generators, without introducing the prohibited new mode.
- Source gaps and missing translations were not guessed or edited. Only the local Bare Bones PDF was available for direct book study.
