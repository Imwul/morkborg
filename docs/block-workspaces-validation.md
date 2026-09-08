# Play workspaces — verification

The paper notebook remains the campaign record. These workspaces retain the current procedure, prepared content and reference results needed to resume play.

- Dungeon preparation creates four Special Room slots. Each rolls Core Sample Rooms once, with only the source-defined conditional follow-up; repeated results are allowed. No regional connective prose or invented room roles are generated. Using this Core table for SD's four preparation slots is an explicit application choice, not a procedure mandated by SD. See [the integrity report](product-integrity/FINAL-REPORT.md).
- Traversal starts at the entrance with zero special rooms discovered. Strong finds the next special, Weak generates a generic room, and Miss waits for danger resolution before generating that room. A fifth Strong becomes Weak. Room resolution precedes the next Crawl roll.
- Common/Rare pools remain six fixed entries each per dungeon. Room content routes to those pools or related references without preparing another pool.
- City preserves one current scene across tab switches and fresh loads. NPC generation and NPC encounters are separate. Specified row references are exact lookups.
- Journey orders dawn, weather, road/forage, encounter resolution and camping. Completed blocks retain a compact result preview. Daily calendar and settlement-discovery checks cannot be accidentally repeated.

## Checks

The counts below record the original workspace release. The subsequent interrupted-work audit found missing private City translations and incomplete Crawl integration; see [the follow-up audit](interrupted-work-audit.md) for current coverage and verification. The earlier phone check did not cover every Crawl state.

- All 442 tests passed without skips, including private source fixtures.
- Client/server TypeScript, lint and production build passed; public build privacy checks passed for 67 static files.
- Browser: generated four Sarkash special rooms in a temporary campaign, entered a generic room through Weak, checked discovered count and room grouping, and exercised daily calendar/weather/road steps.
- Browser: City Strong and Miss, inline NPC encounter, copy, pin, fresh load, current-street restoration and pin restoration verified. The temporary pin and campaign were removed. Existing campaigns remained.
- Phone viewport: City results and controls had no document-level horizontal overflow.
- Common reference use takes topic expansion plus roll (two clicks), then one-click reroll/copy. Dungeon continuation takes room completion plus the next Crawl button.

Source decisions: dungeon-source-procedures.md, journey-blocks.md, city-crawl-blocks/README.md.
