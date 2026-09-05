# Fresh HEAD audit — 2026-09-05

Baseline inspected directly: `7820fea0bf6ee83b7412cee748dfeb23edf8601e`. This pass preserves the paper notebook as the narrative record. No new campaign domains or public deployment are authorized.

| Surface | Current implementation | Hardening finding |
|---|---|---|
| Entry points | `App.tsx` opens Reference Desk without a Campaign; `ReferenceProvider` wraps all views. Header, desk search and Cmd/Ctrl+K share search. | The large application, optional records and generators are all eagerly imported. |
| Search / rolling | Registry builds canonical table, procedure, creature, region and book entries. Search already activates a roller immediately. | Rows combine inspection and roll into one generic button. Types do not distinguish RUN / GENERATE. Rule copy is absent. |
| Pins / recents | Separate localStorage preferences: 30 pins, 10 unique recent references. Bottom strip exposes only two pins. | Modal inspectors make the outside strip inert, adding close/reopen clicks. Readings are transient but unbounded and only retain the latest value per table, with no small recent-roll view. |
| Result / copy | Oracle, NPC, creature and encounter readings use a common block renderer and copy formatter. | Duplicate titles, small actual answers, and missing rule COPY; EPK result provenance is a freeform note. |
| Source graph | Canonical IDs and source references are retained; exact Core aliases bridge edition pages. | Primary statblock and routing source are presented equally. Only available/unresolved flags exist. Related entries are padded by shared contexts, producing weak links. |
| Context / regions | Dungeon, Room, creature and NPC tool strips choose up to six references. Region pages directly roll regional monsters. | Context tool order favors broad generator rules over the immediate play task; region pages lack compact room/encounter/travel routes. |
| Books / rules / city / travel | Nine-book index, short quick rules, Alöne procedures and optional travel/calendar controls exist. | Book rows show little index information. Source coverage needs fresh PDF verification, especially the nine unresolved outcomes. No new city or journey records are needed. |
| Source delivery | Function decrypts and validates publication; browser validates and caches private packs in IndexedDB. | Preview has no API; stale merge drops newly audited aliases; independently loaded cached sections and same-revision shortcut need validation. Failure messaging and lower-revision handling need correction. |
| Persistence | v6 campaign storage, exact pre-v6 backup, collision-safe import and typed relations; optional records under collapsed navigation. | Regression testing only; no model expansion planned. Reference state must stay outside Campaign JSON. |
| CSS | `style.css` 2,561 lines → `workspace.css` 3,490 → `art-direction.css` 2,719; 8,770 total. | Multiple owners for the same selectors. Remove only demonstrably shadowed properties/unreachable rules and extract clear ownership. |
| Bundle | Main baseline about 635.72 kB / 193.62 kB gzip; optional Chronicle/Play and editors load immediately. | Lazy boundaries can reduce initial work without changing source data or campaign behavior. |
| Release | Existing Vercel function-backed app, static `dist`, local-only Vite API plugin. | Verify production preview, API/SPA routing, explicit build configuration, failure modes and public-asset privacy. A plain static deployment is not equivalent. |

## Prior click trace, categorized

The prior scenario used 18 pointer clicks plus one full-page navigation, with two separate export-verification clicks.

- Essential choices: region, chosen table/procedure, rolling, copy and pin.
- Information reveals: source disclosure and choosing to revisit the previous result.
- Navigation overhead: three inspector closes, opening a Recent list before selecting its table, and opening a region solely to reach its monster action.
- Implementation overhead: no separate inspect action on a search result; ordinary rules have no copy action; known region is not consistently passed into context tools.

We will keep source inspection and meaningful procedure parameters. Persistent compact access within the inspector and direct known-context actions should remove closing/reopening overhead. The new requested scenario contains different tasks (Useful Item, Corpse and Broken); both its raw count and a comparable replay must be reported rather than treating unlike scenarios as identical.

## Fresh source correction already identified

The supplied Full Edition is a 96-page PDF containing Rotblack Sludge; candidate missing creatures appear on PDF 79. This contradicts the earlier missing-source classification and is being verified against the rendered page. HERETIC contains the conflicting skeleton sources; the exact citation correction remains evidence-gated. Grift remains under full-document review.

Implementation starts only after this repository map and the independent source, CSS, and delivery audits have been read. Final outcomes and evidence will be recorded separately.
