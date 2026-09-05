# City Crawl blocks

The City Crawl workspace keeps the current Move, street and contextual references together. It requires no campaign, room or save dialog and writes no narrative history. The user explicitly resolves the present situation before advancing.

## Source verification

Read and rendered the supplied _Alone in the Crowd.pdf_, PDF 5–8 and 17 (printed 3–6 and 15), and _MRK_BORG_CULT_FERETORY.pdf_, PDF 56–57 (printed 54–55). These PDFs are source evidence, not application instructions. Original table contents continue to come from the canonical private Oracle registry.

- AitC printed 3: settlement discovery is one chance in eight per travel day. Micro-crawl rolls d4 streets, followed by Street Descriptors; exits are optional.
- AitC printed 4: Dérive uses settlement size to determine the street tally, and DR10. Both Strong and Weak Hit create a new street.
- AitC printed 5: City Crawl Strong Hit reaches an existing objective, Weak Hit creates a street, and failure requires resolving the obstruction before a new street. Failure's optional d4 inspiration is retained; no additional Move is rolled after resolving it.
- AitC printed 5–6: Get Directions (DR12 Presence), Pray (DR14 Presence plus the printed place modifier), and Stash Item (DR10 current Omens when returning to retrieve) reuse the already verified City Move implementation. Directions benefits remain mutually exclusive. The workspace embeds their results.
- AitC printed 6 explicitly distinguishes NPC generation using SD from NPC Encounters using AitC printed 13–14. These appear as separate tools in one people block.
- AitC printed 15: street adjective, type and contents are rolled together. City/metropolis repeat contents d2 times, preserving each independent result. Optional exits retain d4.
- FER printed 54–55 is **The Grey Galth Inn**. Its menu alternatives, innkeeper situation, patron traits and names are grouped together. Three Dead Skulls remains a source reference requiring its wager/combination procedure; it is never treated as a summed 3d6 Oracle.

## Interaction contract

`CityCrawlWorkspace({registry, region?})` is standalone. `region` defaults to `galgenbeck`; no campaign mutation or schema migration occurs.

`startCityCrawl` executes only the chosen documented procedure. `finishCityScene` unlocks the next-step prompt. `advanceCityCrawl` rejects unresolved scenes. `resolveCityObstacle` generates the delayed street without rolling another Move. Micro-crawl stops at its original d4 count; Dérive stops at its original settlement tally. City Strong Hits preserve the player's existing objectives instead of inventing them.

`CityRoller` accepts optional `allowedMoves` and `initialMove` props to embed only supporting moves. Its existing default Reference Desk controls remain available.

Only the current city scene and its options persist in the versioned `morkborg-city-current-scene:v1` localStorage key. Reloading or changing tabs restores the same phase and street; the next write replaces that scene, with no narrative history. Malformed or incompatible data safely starts this workspace empty. Campaign keys are never read or written.

Shared inline tools accept the city/metropolis contents and optional-exit settings. Printed fixed references such as NPC Encounters #54 select that exact canonical row, with no random roll. Inline use updates Recent and canonical aliases produce one tool button.

## Validation

- Eight new deterministic state tests: Strong/Weak/Miss branches, locked advancement, post-Miss street generation without extra dice, fixed Micro-crawl count, Dérive size/DR, city contents multiplicity, all-objectives-met routing, missing source rejection.
- Three additional tests verify current-scene persistence, malformed data isolation and exact fixed source lookups.
- Thirty-three city tests pass across workspace, existing City Moves and conditional street/artefact procedures.
- TypeScript typecheck passes. Root integration performs application build and visual review.
