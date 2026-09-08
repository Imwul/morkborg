# Alöne in the Crowd: PDF escape audit

Baseline: `a50d2425deb9a4e9c7e7abb0983dd4c34c68c116`. Audit only; no application changes. 24/24 physical pages accounted for.

Source: `Alone in the Crowd.pdf`; SHA-256 `d52b583f53151ce570ae1fa9eb0c06a1eae6ddf14eacc4a299ac73c53c51d54d`. Printed folios are recorded separately from PDF indexes. RECLVSE’s decorative doubled chapter numerals are not folios.

Method: read the complete supplied document using fresh page extraction; render low-text/artwork/diagram pages; compare current private source data, canonical registry, reference index, rendering and mounted workflows. Table coverage means usable rows/ranges, not merely a source citation. Mandatory moves, conditional instructions and named material with different completeness are separate needs. This is a lookup audit: manual table use can pass; absence of a one-click generator alone is not a missing rule. Source text oddities are preserved.

Priority is an audit estimate, not observed usage telemetry: frequency 5 daily/core loop, 4 frequent play, 3 situational, 2 preparation/optional, 1 rare scenario; friction 1 direct, 2 indirect lookup, 4 incomplete rule, 5 unavailable in-app. Priority is frequency × friction. Source-unavailable rows are not application failures.

Browser evidence is limited to root’s shared `outputs/pdf-escape-audit/browser-probes.json`; all other rows identify code/data inspection. Private page text and screenshots remain in ignored `outputs/`. Tracked reports contain findings and source metadata, not full rulebook payloads.

105 source-specific lookup rows; RESOLVED: 58, PRESENT_BUT_INDIRECT: 31, PARTIAL: 1, MISSING: 12, SOURCE_UNAVAILABLE: 0, PDF_APPROPRIATE: 3.

## Highest-impact findings

- **Gunpowder and blackpowder weapons** — MISSING, P2, priority 15. PDF 14 / print 12. The Gunsmith explicitly routes to MBC Blackpowder Weapons. That source IS supplied: HERETIC PDF46 / printed44, Ian McClung’s Blackpowder Weapons for the Rich and Foolhardy. The app lacks the usable firearm rules/prices reference, so this is a routing/reference gap rather than an unavailable source. Minimal fix: Link Gunsmith to the supplied HERETIC Blackpowder rule and fixed weapon/ammunition references; do not duplicate the source item set.
- **Notable Artefacts — Type** — PARTIAL, P2, priority 12. PDF 11 / print 9. Generated results display conditional/effect metadata, but TABLE displays only entry.text and simple child text. A known row can therefore omit its required condition or effect when looked up directly. Minimal fix: Reuse the structured effect/condition rendering in TABLE, without requiring a random roll to read the needed row.
- **City Micro-crawl** — PRESENT_BUT_INDIRECT, P2, priority 8. PDF 5 / print 3. The complete d4 street mode is present, but the exact microcrawl search has no result leading to the mode. Minimal fix: Add a searchable procedure alias opening the existing City action at its relevant section.
- **Dérive** — PRESENT_BUT_INDIRECT, P2, priority 8. PDF 5, 6 / print 3, 4. Fixed street-count travel and DR10 Strong/Weak progress are implemented, but this procedure is reached through the City workspace instead of a directly searchable use reference. Minimal fix: Add a searchable procedure alias opening the existing City action at its relevant section.
- **City Crawl** — PRESENT_BUT_INDIRECT, P2, priority 8. PDF 6, 7 / print 4, 5. Searching City Crawl prioritizes the Failure table; the actual complete DR10 three-outcome procedure is in the City workspace. Minimal fix: Add a searchable procedure alias opening the existing City action at its relevant section.
- **Get Directions** — PRESENT_BUT_INDIRECT, P2, priority 8. PDF 7 / print 5. Search returns the Weak reaction table rather than the full action. The City action contains DR12, modifiers and all three outcomes. Minimal fix: Add a searchable procedure alias opening the existing City action at its relevant section.
- **Pray** — PRESENT_BUT_INDIRECT, P2, priority 8. PDF 7 / print 5. Search prioritizes Failure; the City action contains DR14, site bonuses and Strong/Weak/Fail rules. Minimal fix: Add a searchable procedure alias opening the existing City action at its relevant section.
- **Stash Item** — PRESENT_BUT_INDIRECT, P2, priority 8. PDF 8 / print 6. Search returns the Weak table; the City action contains the retrieval DR10 and all outcome branches. Minimal fix: Add a searchable procedure alias opening the existing City action at its relevant section.
- **Merchant disposition and negotiation** — PRESENT_BUT_INDIRECT, P2, priority 8. PDF 10 / print 8. The modifier-aware 2d6 table and negotiation branches are implemented in City tools. Generic search primarily exposes the unmodified lookup. Minimal fix: Add a searchable procedure alias opening the existing City action at its relevant section.
- **Holy Places — Villages and Smaller** — PRESENT_BUT_INDIRECT, P2, priority 6. PDF 10 / print 8. The table result is readable, but settlement-size selection or optional staffed-site guidance sits in result metadata and linked tables rather than the standalone TABLE view. No missing mandatory effect is inferred from a duplicated helper note. Minimal fix: Expose a compact contextual use note and the appropriate canonical branch link.
- **Holy Places — Cities and Larger** — PRESENT_BUT_INDIRECT, P2, priority 6. PDF 10 / print 8. The table result is readable, but settlement-size selection or optional staffed-site guidance sits in result metadata and linked tables rather than the standalone TABLE view. No missing mandatory effect is inferred from a duplicated helper note. Minimal fix: Expose a compact contextual use note and the appropriate canonical branch link.
- **Special Structures — Villages and Smaller** — PRESENT_BUT_INDIRECT, P2, priority 6. PDF 12 / print 10. The table result is readable, but settlement-size selection or optional staffed-site guidance sits in result metadata and linked tables rather than the standalone TABLE view. No missing mandatory effect is inferred from a duplicated helper note. Minimal fix: Expose a compact contextual use note and the appropriate canonical branch link.

## Complete lookup inventory

Rows are source-specific. Canonical tables and their overall procedures are separate needs; a standalone table can work even while its overall procedure is incomplete. Machine-readable details, exact reference IDs, search probes, mounted context and minimal fixes: [solo-city-rows.json](data/solo-city-rows.json).

| Need | PDF / printed | Classification | App path |
| --- | --- | --- | --- |
| City Crawl — Failure | 7 / 5 | RESOLVED | Reference Desk → oracle:aitc.city-crawl-failure |
| Get Directions — Weak Hit Reaction | 7 / 5 | RESOLVED | Reference Desk → oracle:aitc.directions-reaction |
| Pray — Strong Hit | 7 / 5 | RESOLVED | Reference Desk → oracle:aitc.pray-strong |
| Pray — Failure | 7 / 5 | RESOLVED | Reference Desk → oracle:aitc.pray-failure |
| Stash Item — Weak Hit | 8 / 6 | RESOLVED | Reference Desk → oracle:aitc.stash-weak |
| Animals | 8 / 6 | RESOLVED | Reference Desk → oracle:aitc.animals |
| Civic Buildings | 8 / 6 | RESOLVED | Reference Desk → oracle:aitc.civic-buildings |
| City Gate — Guards Reaction | 8 / 6 | RESOLVED | Reference Desk → oracle:aitc.city-gate-reaction |
| Festivals — Adjective | 9 / 7 | RESOLVED | Reference Desk → oracle:aitc.festival-adjective |
| Festivals — Subject | 9 / 7 | RESOLVED | Reference Desk → oracle:aitc.festival-subject |
| Gatherings | 9 / 7 | RESOLVED | Reference Desk → oracle:aitc.gatherings |
| Gatherings — Funeral Mourners | 9 / 7 | RESOLVED | Reference Desk → oracle:aitc.funeral-mourners |
| Gatherings — Contest | 9 / 7 | RESOLVED | Reference Desk → oracle:aitc.contest |
| Gatherings — Spectacle | 9 / 7 | RESOLVED | Reference Desk → oracle:aitc.spectacle |
| Gatherings — Riot Complication | 9 / 7 | RESOLVED | Reference Desk → oracle:aitc.riot-complication |
| Hazards | 10 / 8 | RESOLVED | Reference Desk → oracle:aitc.hazards |
| Holy Places — Villages and Smaller | 10 / 8 | PRESENT_BUT_INDIRECT | Reference Desk → oracle:aitc.holy-places-small |
| Holy Places — Cities and Larger | 10 / 8 | PRESENT_BUT_INDIRECT | Reference Desk → oracle:aitc.holy-places-large |
| Interior Locations — Hovel | 10 / 8 | RESOLVED | Reference Desk → oracle:aitc.interior-hovel |
| Interior Locations — Townhouse | 10 / 8 | RESOLVED | Reference Desk → oracle:aitc.interior-townhouse |
| Interior Locations — Mansion | 10 / 8 | RESOLVED | Reference Desk → oracle:aitc.interior-mansion |
| Merchant Dispositions | 10 / 8 | RESOLVED | Reference Desk → oracle:aitc.merchant-disposition |
| Notable Artefacts — Type | 11 / 9 | PARTIAL | Reference Desk → oracle:aitc.notable-artefact-type |
| Notable Artefacts — Book/Manuscript Concerning | 11 / 9 | RESOLVED | Reference Desk → oracle:aitc.notable-artefact-concerning |
| Notable Artefacts — Depicting Composition | 11 / 9 | RESOLVED | Reference Desk → oracle:aitc.notable-artefact-composition |
| Notable Artefacts — Depicting Descriptor | 11 / 9 | RESOLVED | Reference Desk → oracle:aitc.notable-artefact-adjective |
| Notable Artefacts — Depicting Subject / Effect | 11 / 9 | RESOLVED | Reference Desk → oracle:aitc.notable-artefact-subject |
| Notable Artefacts — Sculpture Size | 11 / 9 | RESOLVED | Reference Desk → oracle:aitc.sculpture-size |
| Settlement Descriptor | 11 / 9 | RESOLVED | Reference Desk → oracle:aitc.settlement-descriptor |
| Settlement Name — Prefix | 12 / 10 | RESOLVED | Reference Desk → oracle:aitc.settlement-name-prefix |
| Settlement Name — Suffix | 12 / 10 | RESOLVED | Reference Desk → oracle:aitc.settlement-name-suffix |
| Settlement Size | 12 / 10 | RESOLVED | Reference Desk → oracle:aitc.settlement-size |
| Special Structures — Villages and Smaller | 12 / 10 | PRESENT_BUT_INDIRECT | Reference Desk → oracle:aitc.special-structures-small |
| Special Structures — Towns and Larger | 12 / 10 | PRESENT_BUT_INDIRECT | Reference Desk → oracle:aitc.special-structures-large |
| Taverns | 13 / 11 | RESOLVED | Reference Desk → oracle:aitc.taverns |
| Unexpected Events | 13 / 11 | RESOLVED | Reference Desk → oracle:aitc.unexpected-events |
| Unexpected Events — Falling Object | 13 / 11 | RESOLVED | Reference Desk → oracle:aitc.falling-object |
| Unexpected Events — Hunting Party | 13 / 11 | RESOLVED | Reference Desk → oracle:aitc.hunting-party |
| Businesses | 14 / 12 | RESOLVED | Reference Desk → oracle:aitc.businesses |
| NPC Encounters | 15,16 / 13, 14 | RESOLVED | Reference Desk → oracle:aitc.npc-encounters |
| NPC Encounter 13 — Musician | 15 / 13 | RESOLVED | Reference Desk → oracle:aitc.npc-musician |
| NPC Encounter 14 — Cursed Toy | 15 / 13 | RESOLVED | Reference Desk → oracle:aitc.npc-cursed-toy |
| NPC Encounter 15 — Prophet | 15 / 13 | RESOLVED | Reference Desk → oracle:aitc.npc-prophet |
| NPC Encounter 23 — Soldier Reaction Modifier | 15 / 13 | RESOLVED | Reference Desk → oracle:aitc.npc-soldier |
| NPC Encounter 24 — Beggar | 15 / 13 | RESOLVED | Reference Desk → oracle:aitc.npc-beggar |
| NPC Encounter 26 — Wounded Person | 15 / 13 | RESOLVED | Reference Desk → oracle:aitc.npc-wound |
| NPC Encounter 45 — Servant | 16 / 14 | RESOLVED | Reference Desk → oracle:aitc.npc-servant |
| NPC Encounter 46 — Mugger | 16 / 14 | RESOLVED | Reference Desk → oracle:aitc.npc-mugger |
| NPC Encounter 51 — Pilgrim | 16 / 14 | RESOLVED | Reference Desk → oracle:aitc.npc-pilgrim |
| NPC Encounter 53 — Demonologist’s Imp | 16 / 14 | RESOLVED | Reference Desk → oracle:aitc.npc-imp |
| NPC Encounter 55 — Fence Weapon | 16 / 14 | RESOLVED | Reference Desk → oracle:aitc.npc-fence-weapon |
| NPC Encounter 56 — Poet | 16 / 14 | RESOLVED | Reference Desk → oracle:aitc.npc-poet |
| NPC Encounters — Default Armour | 16 / 14 | RESOLVED | Reference Desk → oracle:aitc.npc-armour |
| NPC Encounters — Default Damage | 16 / 14 | RESOLVED | Reference Desk → oracle:aitc.npc-damage |
| Street Adjective | 17 / 15 | RESOLVED | Reference Desk → oracle:aitc.street-adjective |
| Street Type | 17 / 15 | RESOLVED | Reference Desk → oracle:aitc.street-type |
| Street Exits | 17 / 15 | RESOLVED | Reference Desk → oracle:aitc.street-exits |
| Street Contents | 17 / 15 | PRESENT_BUT_INDIRECT | Reference Desk → oracle:aitc.street-contents |
| Backtracking | 17 / 15 | RESOLVED | Reference Desk → oracle:aitc.backtracking |
| City Micro-crawl | 5 / 3 | PRESENT_BUT_INDIRECT | Reference Desk → CITY CRAWL → 탐험 방식 → 마이크로 크롤 |
| Dérive | 5,6 / 3, 4 | PRESENT_BUT_INDIRECT | Reference Desk → CITY CRAWL → 탐험 방식 → Dérive |
| City Crawl | 6,7 / 4, 5 | PRESENT_BUT_INDIRECT | Reference Desk → CITY CRAWL → 도시 크롤 |
| Get Directions | 7 / 5 | PRESENT_BUT_INDIRECT | Reference Desk → CITY CRAWL → 길 묻기 |
| Pray | 7 / 5 | PRESENT_BUT_INDIRECT | Reference Desk → CITY CRAWL → 기도 |
| Stash Item | 8 / 6 | PRESENT_BUT_INDIRECT | Reference Desk → CITY CRAWL → 물건 숨기기 |
| Merchant disposition and negotiation | 10 / 8 | PRESENT_BUT_INDIRECT | Reference Desk → CITY CRAWL → 거래 |
| Daily 1-in-8 settlement discovery | 5 / 3 | RESOLVED | Journey → settlement discovery → CITY CRAWL |
| Settlement size, name and descriptor | 5,11,12 / 3, 9, 10 | RESOLVED | Reference Desk → procedure:aitc.settlement |
| Street Descriptors with city/metropolis contents and optional exits | 17 / 15 | RESOLVED | CITY CRAWL / Reference Desk → procedure:aitc.street |
| Notable Artefacts branching and effects | 11 / 9 | RESOLVED | CITY CRAWL → artefact / procedure:aitc.notable-artefact-type |
| Default city NPC statistics and explicit overrides | 16 / 14 | RESOLVED | CITY CRAWL → NPC / Reference Desk → NPC Encounters |
| Spider-owl fixed stats lookup | 8 / 6 | PRESENT_BUT_INDIRECT | Reference Desk → oracle:aitc.animals |
| Assassin fixed stats lookup | 15 / 13 | PRESENT_BUT_INDIRECT | Reference Desk → oracle:aitc.npc-encounters |
| Soldier fixed stats lookup | 15 / 13 | PRESENT_BUT_INDIRECT | Reference Desk → oracle:aitc.npc-encounters |
| Hard Case fixed stats lookup | 16 / 14 | PRESENT_BUT_INDIRECT | Reference Desk → oracle:aitc.npc-encounters |
| Fugitive fixed stats lookup | 16 / 14 | PRESENT_BUT_INDIRECT | Reference Desk → oracle:aitc.npc-encounters |
| Guards fixed stats lookup | 16 / 14 | PRESENT_BUT_INDIRECT | Reference Desk → oracle:aitc.npc-encounters |
| Berserker’s Honey | 14 / 12 | PRESENT_BUT_INDIRECT | Reference Desk → oracle:aitc.businesses |
| Defixione | 14 / 12 | PRESENT_BUT_INDIRECT | Reference Desk → oracle:aitc.businesses |
| Poppet | 14 / 12 | PRESENT_BUT_INDIRECT | Reference Desk → oracle:aitc.businesses |
| Horse Powder | 14 / 12 | PRESENT_BUT_INDIRECT | Reference Desk → oracle:aitc.businesses |
| Accursed Rhubarb | 14 / 12 | PRESENT_BUT_INDIRECT | Reference Desk → oracle:aitc.businesses |
| Aqua Vitae | 14 / 12 | PRESENT_BUT_INDIRECT | Reference Desk → oracle:aitc.businesses |
| Uric Vigour | 14 / 12 | PRESENT_BUT_INDIRECT | Reference Desk → oracle:aitc.businesses |
| Pick-me-up | 14 / 12 | PRESENT_BUT_INDIRECT | Reference Desk → oracle:aitc.businesses |
| Embalming Fluid | 14 / 12 | PRESENT_BUT_INDIRECT | Reference Desk → oracle:aitc.businesses |
| Bone Saw | 14 / 12 | PRESENT_BUT_INDIRECT | Reference Desk → oracle:aitc.businesses |
| Algae flakes | 14 / 12 | PRESENT_BUT_INDIRECT | Reference Desk → oracle:aitc.businesses |
| Dried mushrooms | 14 / 12 | PRESENT_BUT_INDIRECT | Reference Desk → oracle:aitc.businesses |
| Cursed Toys | 15 / 13 | PRESENT_BUT_INDIRECT | Reference Desk → oracle:aitc.npc-cursed-toy |
| Gunpowder and blackpowder weapons | 14 / 12 | MISSING | Reference Desk → oracle:aitc.businesses |
| Haav, Custodian | 21 / 19 | MISSING | Reference Desk → no matching usable reference |
| Aversus, the Demi-Lich | 22 / 20 | MISSING | Reference Desk → no matching usable reference |
| Svampist Acolyte | 22 / 20 | MISSING | Reference Desk → no matching usable reference |
| Leech Swarm | 22 / 20 | MISSING | Reference Desk → no matching usable reference |
| Svampist Adept | 22 / 20 | MISSING | Reference Desk → no matching usable reference |
| Svamp, the Heretical Prophet | 22 / 20 | MISSING | Reference Desk → no matching usable reference |
| Chalice of Ruin | 21,22 / 19, 20 | MISSING | Reference Desk → no matching usable reference |
| Galgenbeck Catacombs — Common Encounters | 22 / 20 | MISSING | Reference Desk → no matching usable reference |
| Galgenbeck Catacombs — Rare Encounters | 22 / 20 | MISSING | Reference Desk → no matching usable reference |
| Svamp Townhouse — Common Encounters | 22 / 20 | MISSING | Reference Desk → no matching usable reference |
| Svamp Townhouse — Rare Encounters | 22 / 20 | MISSING | Reference Desk → no matching usable reference |
| Cover, contents, introduction, art credits and back cover | 1,2,3,4,23,24 / Mixed / see page ledger | PDF_APPROPRIATE | Supplied PDF |
| Belsum worked city example | 18,19,20,21 / Mixed / see page ledger | PDF_APPROPRIATE | Supplied PDF |
| Svamp adventure narrative and map context | 21,22 / Mixed / see page ledger | PDF_APPROPRIATE | Supplied PDF |

## Every-page ledger

Mechanics on example/lore pages are counted separately above. Page presence alone never earns RESOLVED. The ledger’s full linked IDs are in [solo-city-page-ledger.json](data/solo-city-page-ledger.json).

| PDF | Printed | Topic / disposition |
| --- | --- | --- |
| 1 | unprinted | Cover |
| 2 | unprinted | Credits |
| 3 | unprinted | Contents |
| 4 | 2 | Introduction and city advice |
| 5 | 3 | Settlement discovery; Micro-crawl; Dérive |
| 6 | 4 | Dérive and City Crawl |
| 7 | 5 | City Crawl; Get Directions; Pray |
| 8 | 6 | Stash Item; animals; civic buildings / gates |
| 9 | 7 | Festivals and gatherings |
| 10 | 8 | Hazards; holy places; interiors; merchant disposition |
| 11 | 9 | Notable artefacts and settlement descriptor |
| 12 | 10 | Settlement name / size; special structures |
| 13 | 11 | Taverns and unexpected events |
| 14 | 12 | Businesses and named goods |
| 15 | 13 | NPC Encounters first half; specific statblocks |
| 16 | 14 | NPC Encounters second half; default stats |
| 17 | 15 | Street descriptors, contents, backtracking |
| 18 | 16 | Belsum worked example |
| 19 | 17 | Belsum worked example |
| 20 | 18 | Belsum worked example |
| 21 | 19 | Worked example conclusion; Svamp scenario; Haav stats |
| 22 | 20 | Svamp scenario, encounter tables, named creatures and Chalice |
| 23 | 21 (text-layer folio; not visually legible in artwork) | Art credits / recommended city resources |
| 24 | 22 (text-layer folio; not visually legible in artwork) | Back cover |
