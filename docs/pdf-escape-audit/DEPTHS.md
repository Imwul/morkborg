# Sölitary Depths: PDF escape audit

Baseline: `a50d2425deb9a4e9c7e7abb0983dd4c34c68c116`. Audit only; no application changes. 36/36 physical pages accounted for.

Source: `Solitary Depths Compressed.pdf`; SHA-256 `2ad1c29372fc63394c7f810b44fe8a510444b3d002d4d3a38de19f3d1864e17c`. Printed folios are recorded separately from PDF indexes. RECLVSE’s decorative doubled chapter numerals are not folios.

Method: read the complete supplied document using fresh page extraction; render low-text/artwork/diagram pages; compare current private source data, canonical registry, reference index, rendering and mounted workflows. Table coverage means usable rows/ranges, not merely a source citation. Mandatory moves, conditional instructions and named material with different completeness are separate needs. This is a lookup audit: manual table use can pass; absence of a one-click generator alone is not a missing rule. Source text oddities are preserved.

Priority is an audit estimate, not observed usage telemetry: frequency 5 daily/core loop, 4 frequent play, 3 situational, 2 preparation/optional, 1 rare scenario; friction 1 direct, 2 indirect lookup, 4 incomplete rule, 5 unavailable in-app. Priority is frequency × friction. Source-unavailable rows are not application failures.

Browser evidence is limited to root’s shared `outputs/pdf-escape-audit/browser-probes.json`; all other rows identify code/data inspection. Private page text and screenshots remain in ignored `outputs/`. Tracked reports contain findings and source metadata, not full rulebook payloads.

74 source-specific lookup rows; RESOLVED: 57, PRESENT_BUT_INDIRECT: 9, PARTIAL: 4, MISSING: 1, SOURCE_UNAVAILABLE: 0, PDF_APPROPRIATE: 3.

## Highest-impact findings

- **Five-card Rare Monster construction** — PARTIAL, P1, priority 16. PDF 16, 17, 18, 19 / print 13, 14, 15, 16. Card look, feature, intention and special tables exist, but the card 3–5 HP/armor/morale/damage computation and repeated double-spade dependency are not fully specified in rule:depths.rareMonster. A player still needs PDF18–19 to construct the stat block. Minimal fix: Add the complete concise numbered card procedure, including clamping, face values, suits and conditional extra draw; do not invent stats or require a new generator.
- **Hex travel: encounter level and regional routing** — PARTIAL, P1, priority 16. PDF 25, 26, 27, 28, 29, 30, 31, 32, 33 / print 22, 23, 24, 25, 26, 27, 28, 29, 30. The quick rule explains d20 versus Encounter Level, grouping and monster reaction adjustment, but no current reference supplies all eight regional Encounter Level numbers or the unmarked-region selection guidance. Minimal fix: Add the eight source Encounter Levels and the small region-selection instruction to the existing travel reference.
- **Optional Orakle Difficulty Rating procedure** — MISSING, P2, priority 15. PDF 7, 9 / print 4, 6. The optional Yes-derived DR, limits/modifiers and TR adjustment are not in the current usable rule references or Orakle data. Minimal fix: Add a compact optional rule alongside Orakle; preserve the difference from the default yes/no procedure.
- **Rare Monster — 1st & 2nd Cards: Intention** — PARTIAL, P2, priority 12. PDF 17 / print 14. TABLE renders numerical 1–16 indexes but omits the ordered suit symbols held in metadata. A player holding two real cards cannot identify the intended row without reopening the PDF. Minimal fix: Render the actual ordered suit-pair labels in the table selector column; retain the existing option text.
- **Rare Monster — 3rd & 4th Cards: Special** — PARTIAL, P2, priority 12. PDF 19 / print 16. TABLE renders numerical 1–16 indexes but omits the ordered suit symbols held in metadata. A player holding two real cards cannot identify the intended row without reopening the PDF. Minimal fix: Render the actual ordered suit-pair labels in the table selector column; retain the existing option text.
- **Orakle likelihood selection and random events** — PRESENT_BUT_INDIRECT, P2, priority 10. PDF 6 / print 3. Likelihood dice and repeated-10 event instructions are retained in the Orakle SOURCE note; they are not lost, but the ordinary result is only Yes/No/Event. Event Focus and Chaos are separate searchable tables. Minimal fix: Promote the existing compact use instructions and link Event Focus / Chaos after an event result.
- **Rare Monster — Card 1: Overall Look** — PRESENT_BUT_INDIRECT, P2, priority 6. PDF 16 / print 13. The table retains all options but TABLE shows numeric 1–13 indexes instead of A–K rank labels. SOURCE identifies rank-based lookup, leaving the player to reconstruct the mapping. Minimal fix: Render metadata.rank as the source selector label.
- **Rare Monster — Card 2: Defining Feature** — PRESENT_BUT_INDIRECT, P2, priority 6. PDF 17 / print 14. The table retains all options but TABLE shows numeric 1–13 indexes instead of A–K rank labels. SOURCE identifies rank-based lookup, leaving the player to reconstruct the mapping. Minimal fix: Render metadata.rank as the source selector label.
- **Creature Difficulty Modification — Spend Omens** — PRESENT_BUT_INDIRECT, P2, priority 6. PDF 21 / print 18. This is a card-rank/suit or player-choice lookup, correctly not a uniform die roller. Full options and ordering/cost notes are available in TABLE / SOURCE; the overall creature-stat calculation is audited separately. Minimal fix: Expose the existing choice/card instruction beside the lookup and link the complete rare-monster procedure.
- **Enemy Stats Generator** — PRESENT_BUT_INDIRECT, P2, priority 6. PDF 15 / print 12. The stat cells, 2–16+ range and TR−d4 expression are readable, but the contextual-input instruction is in SOURCE and the table has no direct contextual entry point. Minimal fix: Show the existing lookup formula before the table and link it from an unspecified-stat monster result.
- **Orakle** — PRESENT_BUT_INDIRECT, P2, priority 6. PDF 6 / print 3. Full special-use instructions are in SOURCE rather than the main table/result: likelihood dice, keeping highest/lowest and stacking 10 events. Minimal fix: Expose a concise use instruction and existing related-table link without changing the printed procedure.
- **Using regional tables for dungeons and special rooms** — PRESENT_BUT_INDIRECT, P2, priority 6. PDF 23, 24 / print 20, 21. The component tables and regional Common encounter route are accessible. The book’s optional Trait/Discovery/Chaos recipe is not grouped beside the room-preparation reference. Current four-room policy is clearly an app choice and is not a rules error. Minimal fix: Add a compact optional procedure link using the existing canonical tables; no new prose generation.

## Complete lookup inventory

Rows are source-specific. Canonical tables and their overall procedures are separate needs; a standalone table can work even while its overall procedure is incomplete. Machine-readable details, exact reference IDs, search probes, mounted context and minimal fixes: [solo-city-rows.json](data/solo-city-rows.json).

| Need | PDF / printed | Classification | App path |
| --- | --- | --- | --- |
| Tveland — Trait | 26 / 23 | RESOLVED | Reference Desk → oracle:depths.region.tveland.trait |
| Tveland — Feature | 26 / 23 | RESOLVED | Reference Desk → oracle:depths.region.tveland.feature |
| Tveland — Discovery | 26 / 23 | RESOLVED | Reference Desk → oracle:depths.region.tveland.discovery |
| Tveland — Monsters | 26 / 23 | RESOLVED | Reference Desk → oracle:depths.region.tveland.monsters |
| Tveland — NPC Professions | 26 / 23 | RESOLVED | Reference Desk → oracle:depths.region.tveland.npc_professions |
| Sarkash — Trait | 27 / 24 | RESOLVED | Reference Desk → oracle:depths.region.sarkash.trait |
| Sarkash — Feature | 27 / 24 | RESOLVED | Reference Desk → oracle:depths.region.sarkash.feature |
| Sarkash — Discovery | 27 / 24 | RESOLVED | Reference Desk → oracle:depths.region.sarkash.discovery |
| Sarkash — Monsters | 27 / 24 | RESOLVED | Reference Desk → oracle:depths.region.sarkash.monsters |
| Sarkash — NPC Professions | 27 / 24 | RESOLVED | Reference Desk → oracle:depths.region.sarkash.npc_professions |
| Graven-Tosk — Trait | 28 / 25 | RESOLVED | Reference Desk → oracle:depths.region.graven_tosk.trait |
| Graven-Tosk — Feature | 28 / 25 | RESOLVED | Reference Desk → oracle:depths.region.graven_tosk.feature |
| Graven-Tosk — Discovery | 28 / 25 | RESOLVED | Reference Desk → oracle:depths.region.graven_tosk.discovery |
| Graven-Tosk — Monsters | 28 / 25 | RESOLVED | Reference Desk → oracle:depths.region.graven_tosk.monsters |
| Graven-Tosk — NPC Professions | 28 / 25 | RESOLVED | Reference Desk → oracle:depths.region.graven_tosk.npc_professions |
| Lake Onda — Trait | 29 / 26 | RESOLVED | Reference Desk → oracle:depths.region.lake_onda.trait |
| Lake Onda — Feature | 29 / 26 | RESOLVED | Reference Desk → oracle:depths.region.lake_onda.feature |
| Lake Onda — Discovery | 29 / 26 | RESOLVED | Reference Desk → oracle:depths.region.lake_onda.discovery |
| Lake Onda — Monsters | 29 / 26 | RESOLVED | Reference Desk → oracle:depths.region.lake_onda.monsters |
| Lake Onda — NPC Professions | 29 / 26 | RESOLVED | Reference Desk → oracle:depths.region.lake_onda.npc_professions |
| Valley of the Unfortunate Undead — Trait | 30 / 27 | RESOLVED | Reference Desk → oracle:depths.region.valley_unfortunate_undead.trait |
| Valley of the Unfortunate Undead — Feature | 30 / 27 | RESOLVED | Reference Desk → oracle:depths.region.valley_unfortunate_undead.feature |
| Valley of the Unfortunate Undead — Discovery | 30 / 27 | RESOLVED | Reference Desk → oracle:depths.region.valley_unfortunate_undead.discovery |
| Valley of the Unfortunate Undead — Monsters | 30 / 27 | RESOLVED | Reference Desk → oracle:depths.region.valley_unfortunate_undead.monsters |
| Valley of the Unfortunate Undead — NPC Professions | 30 / 27 | RESOLVED | Reference Desk → oracle:depths.region.valley_unfortunate_undead.npc_professions |
| Bergen Chrypt — Trait | 31 / 28 | RESOLVED | Reference Desk → oracle:depths.region.bergen_chrypt.trait |
| Bergen Chrypt — Feature | 31 / 28 | RESOLVED | Reference Desk → oracle:depths.region.bergen_chrypt.feature |
| Bergen Chrypt — Discovery | 31 / 28 | RESOLVED | Reference Desk → oracle:depths.region.bergen_chrypt.discovery |
| Bergen Chrypt — Monsters | 31 / 28 | RESOLVED | Reference Desk → oracle:depths.region.bergen_chrypt.monsters |
| Bergen Chrypt — NPC Professions | 31 / 28 | RESOLVED | Reference Desk → oracle:depths.region.bergen_chrypt.npc_professions |
| Wästland — Trait | 32 / 29 | RESOLVED | Reference Desk → oracle:depths.region.wastland.trait |
| Wästland — Feature | 32 / 29 | RESOLVED | Reference Desk → oracle:depths.region.wastland.feature |
| Wästland — Discovery | 32 / 29 | RESOLVED | Reference Desk → oracle:depths.region.wastland.discovery |
| Wästland — Monsters | 32 / 29 | RESOLVED | Reference Desk → oracle:depths.region.wastland.monsters |
| Wästland — NPC Professions | 32 / 29 | RESOLVED | Reference Desk → oracle:depths.region.wastland.npc_professions |
| Kergüs — Trait | 33 / 30 | RESOLVED | Reference Desk → oracle:depths.region.kergus.trait |
| Kergüs — Feature | 33 / 30 | RESOLVED | Reference Desk → oracle:depths.region.kergus.feature |
| Kergüs — Discovery | 33 / 30 | RESOLVED | Reference Desk → oracle:depths.region.kergus.discovery |
| Kergüs — Monsters | 33 / 30 | RESOLVED | Reference Desk → oracle:depths.region.kergus.monsters |
| Kergüs — NPC Professions | 33 / 30 | RESOLVED | Reference Desk → oracle:depths.region.kergus.npc_professions |
| Rare Monster — Card 1: Overall Look | 16 / 13 | PRESENT_BUT_INDIRECT | Reference Desk → oracle:depths.rare.look |
| Rare Monster — Card 2: Defining Feature | 17 / 14 | PRESENT_BUT_INDIRECT | Reference Desk → oracle:depths.rare.feature |
| Rare Monster — 1st & 2nd Cards: Intention | 17 / 14 | PARTIAL | Reference Desk → oracle:depths.rare.intention |
| Rare Monster — 3rd & 4th Cards: Special | 19 / 16 | PARTIAL | Reference Desk → oracle:depths.rare.special |
| Creature Difficulty Modification — Tougher | 20 / 17 | RESOLVED | Reference Desk → oracle:depths.rare.harder |
| Creature Difficulty Modification — Spend Omens | 21 / 18 | PRESENT_BUT_INDIRECT | Reference Desk → oracle:depths.rare.easier |
| Enemy Stats Generator | 15 / 12 | PRESENT_BUT_INDIRECT | Reference Desk → oracle:depths.enemyStats |
| Reveal a Danger | 11 / 8 | RESOLVED | Reference Desk → oracle:depths.danger |
| Determining the Encounter | 25 / 22 | RESOLVED | Reference Desk → oracle:depths.travel.encounter |
| Story Connection | 25 / 22 | RESOLVED | Reference Desk → oracle:depths.travel.storyConnection |
| Orakle | 6 / 3 | PRESENT_BUT_INDIRECT | Reference Desk → oracle:depths.orakle |
| Random Event Focus | 6 / 3 | RESOLVED | Reference Desk → oracle:depths.randomEventFocus |
| Weak Hit Consequences | 11 / 8 | RESOLVED | Reference Desk → oracle:depths.weakHitConsequences |
| Regular Traps | 13 / 10 | RESOLVED | Reference Desk → oracle:depths.traps.regular |
| Special Traps | 13 / 10 | RESOLVED | Reference Desk → oracle:depths.traps.special |
| Enemy Combat Modifiers | 14 / 11 | RESOLVED | Reference Desk → oracle:depths.enemyCombatModifiers |
| Chaos Portents — Action | 5 / 2 | RESOLVED | Reference Desk → oracle:depths.chaosPortents.action |
| Chaos Portents — Subject | 5 / 2 | RESOLVED | Reference Desk → oracle:depths.chaosPortents.subject |
| Threat Rating | 9 / 6 | RESOLVED | Reference Desk → rule:depths.threat-rating |
| Encountering Enemies | 10 / 7 | RESOLVED | Reference Desk → rule:depths.enemy-detection |
| Locked Doors and Obstacles | 10 / 7 | RESOLVED | Reference Desk → rule:depths.locked-doors |
| Defer / Make Noise | 11 / 8 | RESOLVED | Reference Desk → rule:depths.time-noise |
| Detect, Disarm and Survive a Trap | 12,13 / 9, 10 | RESOLVED | Reference Desk → rule:depths.traps |
| Orakle likelihood selection and random events | 6 / 3 | PRESENT_BUT_INDIRECT | Reference Desk → oracle:depths.orakle / oracle:depths.randomEventFocus / oracle:depths.chaosPortents.action / oracle:depths.chaosPortents.subject |
| Optional Orakle Difficulty Rating procedure | 7,9 / 4, 6 | MISSING | Reference Desk → oracle:depths.orakle |
| Five-card Rare Monster construction | 16,17,18,19 / 13, 14, 15, 16 | PARTIAL | Reference Desk → rule:depths.rareMonster → TABLE / SOURCE |
| Hex travel: encounter level and regional routing | 25,26,27,28,29,30,31,32,33 / 22, 23, 24, 25, 26, 27, 28, 29, 30 | PARTIAL | Reference Desk → rule:depths.hex-travel |
| Using regional tables for dungeons and special rooms | 23,24 / 20, 21 | PRESENT_BUT_INDIRECT | Region hub / Dungeon → Common regional route; Reference Desk → individual regional tables |
| Lake Onda regional monster follow-through | 29 / 26 | PRESENT_BUT_INDIRECT | Reference Desk → oracle:depths.region.lake_onda.monsters |
| Bergen Chrypt regional monster follow-through | 31 / 28 | PRESENT_BUT_INDIRECT | Reference Desk → oracle:depths.region.bergen_chrypt.monsters |
| Lake Onda — Cursed Trout encounter effect | 29 / 26 | RESOLVED | Reference Desk → creature:feretory:feretory.epk.cursed-trout |
| Front matter, illustration and blank pages | 1,2,3,4,8,22,36 / Mixed / see page ledger | PDF_APPROPRIATE | Supplied PDF |
| Worked Orakle / rare-creature examples | 6,7,16,17,18,19,20,21 / Mixed / see page ledger | PDF_APPROPRIATE | Supplied PDF |
| Custom-region advice and regional worksheet | 34,35 / Mixed / see page ledger | PDF_APPROPRIATE | Supplied PDF |

## Every-page ledger

Mechanics on example/lore pages are counted separately above. Page presence alone never earns RESOLVED. The ledger’s full linked IDs are in [solo-city-page-ledger.json](data/solo-city-page-ledger.json).

| PDF | Printed | Topic / disposition |
| --- | --- | --- |
| 1 | unprinted | Cover |
| 2 | unprinted | Credits |
| 3 | 32 (text-layer folio; not visually legible in artwork) | Contents |
| 4 | 1 | Introduction |
| 5 | 2 | Chaos Portents raster tables |
| 6 | 3 | Orakle / likelihood / random event focus |
| 7 | 4 | Optional DR procedure and examples |
| 8 | 5 (text-layer folio; not visually legible in artwork) | Section artwork |
| 9 | 6 | Threat Rating and optional Orakle modifier |
| 10 | 7 | Enemy detection; doors |
| 11 | 8 | Weak consequences; danger; time/noise |
| 12 | 9 | Trap resolution procedure |
| 13 | 10 | Regular and special traps |
| 14 | 11 | Enemy combat modifiers |
| 15 | 12 | Enemy Stats Generator |
| 16 | 13 | Rare creature procedure; look |
| 17 | 14 | Feature; intention |
| 18 | 15 | Rare creature HP/armor/morale/damage |
| 19 | 16 | Rare special and additional draw |
| 20 | 17 | Increase difficulty options |
| 21 | 18 | Omen difficulty reduction options |
| 22 | 19 (text-layer folio; not visually legible in artwork) | Section artwork |
| 23 | 20 | Regional-table applications |
| 24 | 21 | Regional dungeon preparation alternatives |
| 25 | 22 | Hex encounter procedure and story connection |
| 26 | 23 | Tveland: EL and five regional tables |
| 27 | 24 | Sarkash: EL and five regional tables |
| 28 | 25 | Graven-Tosk: EL and five regional tables |
| 29 | 26 | Lake Onda: EL and five regional tables |
| 30 | 27 | Valley of the Unfortunate Undead: EL and five tables |
| 31 | 28 | Bergen Chrypt: EL and five regional tables |
| 32 | 29 | Wästland: EL and five regional tables |
| 33 | 30 | Kergüs: EL and five regional tables |
| 34 | 31 | Custom region guidance and external recommendations |
| 35 | 32 | Regional worksheet |
| 36 | unprinted | Blank / back cover |
