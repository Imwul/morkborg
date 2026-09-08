# Current application inventory

Audited HEAD: `a50d2425deb9a4e9c7e7abb0983dd4c34c68c116`. This inventory was rebuilt from the currently installed private bundle through the actual `parseRulesPack → buildOracleRegistry → buildReferenceRegistry` adapters. Earlier implementation reports were not treated as evidence. Full metadata inventory: [data/app-inventory.json](data/app-inventory.json); reproducible read-only audit tool: [tools/inspect_registry.ts](tools/inspect_registry.ts).

| Current surface/data | Actual extent | Important boundary |
| --- | --- | --- |
| Universal Reference Desk | 770 entries | 552 Oracle routes, 63 procedure routes, 51 rule routes, 88 creature routes, 7 regions, 9 book routes. A route is not a unique play need. |
| Canonical random/reference tables | 562 tables, 12,276 entries | Includes 18 intentionally non-random lookup tables. Grouped routes explain the difference from 552 Oracle routes. |
| Oracle procedure registry | 59 definitions | Meaning pairs, source-defined combined rolls, and other explicit procedures. Reference procedures also contain workbench/navigation actions; the two counts should not be added. |
| Character generator | 12 classes plus classless | Six Core, four FERETORY, two HERETIC. RECLVSE's own playable classes are not the same class system and are not included in this total. |
| Creature payload | 89 creature records | 88 reference entries, including Core outcast adapters. Some separate `outcasts` records and intentionally nonnumeric-HP creatures are not indexed. This is not a count of all supplied creatures. |
| Powers, weapons, equipment | Primarily rows inside Oracle tables or generated Character fields | No first-class `Power`, `Item` or `Class` reference kind. Twenty Core Power effects and ten weapon damage values are present as metadata but omitted from Desk result/table rendering. |
| Rules | Core combat/rest/carrying/casting/Calendar; SD moves; Depths travel/traps; selected FER/HER/RCL/AitC/Mythic reminders | A short rule may be sufficient without automation. Missing portions are individually assessed in the master matrix. |
| Source system | 9 book identities, PDF/printed pages, primary/routing/policy disclosure, generated roll metadata | Provenance and mechanical completeness are separate. Seeing a book/page does not resolve a missing effect. |

## Find and execute

The initial screen is Reference Desk (`App.tsx:206`, `oracleOpen = true`). It presents Search, Pins, Recent, four quick tools, region selection and the complete index. No Campaign or Session is required for standalone lookup, Oracle/NPC/regional Monster generation, city tools or Mythic Fate.

- Search uses table/reference titles, summaries, tags, aliases, book/source terminology and canonical relationships. It does **not** provide general exact-name lookup for all individual source rows. See the complete [search audit](SEARCH-AUDIT.md).
- A playable search row invokes ROLL, RUN or GENERATE directly; the separate information action opens it without rolling. Non-random references OPEN. Pins and Recent use the same action semantics. COPY copies the result; source is optional. Actual browser checks verified one-click Reaction, Action + Theme, NPC and Sarkash Monster execution.
- The command palette is Ctrl/⌘K. Result navigation retains an in-dialog reference stack. SOURCE → canonical table → Close restored the same expanded Special Room 02 in the actual browser.
- Table Inspector lists canonical entries and nested room sub-results; full-table completeness, manual-dice selectors and metadata omissions are enumerated in [TABLE-ACCESS.md](TABLE-ACCESS.md). Reading/selecting an entry by eye is a valid manual option; a missing pick-to-result button is not automatically a PDF escape.
- The older Oracle Library remains reachable through the full index/library route. Some metadata can be seen there after rolling, but that is not a reliable named-item lookup path.

## Current generator and procedure destinations

| Play need | Current destination | What it supplies |
| --- | --- | --- |
| Dungeon preparation | Campaign → Dungeon library → generator | Region, source-component dossier, four prepared Special Room slots, optional notes. Neutral identifiers and Core Sample Rooms selection are disclosed as APP POLICY. |
| Special Room | Dungeon candidate/overview → room packet → SOURCE | Actual Core Sample Rooms result and only its instructed conditional roll. Compact view; canonical table remains inspectable. No automatic prose interpretation is needed. |
| Dungeon crawl | Open dungeon → DUNGEON CRAWL | Entrance, Strong/Weak/Miss resolution, current room, next-room progression, inline dungeon reference topics. |
| Dungeon encounters | Dungeon → Common/Rare tables | Six fixed Common and six fixed Rare slots; encounter preparation and current-context lookup. Candidate preparation is not mislabeled as source-mandated automated stocking. |
| Monster | Desk → regional Monster or named creature; Campaign → Monster library | Source-defined stats/attacks/specials; Sölitary Depths routing to FERETORY/HERETIC/Core or explicit unavailable source. Nested variant/companion/possession losses remain. |
| NPC | Desk NPC; Campaign → NPC library | Source-fragment preparation with name, profession, appearance, traits, motivation and Reaction. This does not create a source statblock for every profession. City NPC encounter is a separate workflow. |
| Encounter | Desk encounter references; Campaign → Encounter library; Dungeon tables | Specific source tables or prepared encounter candidates. `encounter` search first returns a RCL encounter-context fragment; it does not select the current game's most relevant procedure automatically. |
| Travel | Campaign → 재앙·여행 → JOURNEY; Desk travel quick rules | Dawn Calendar → weather → road/forage → encounter resolution → camping. Actual browser followed a weather-change road event into its secondary weather roll and completed source-defined camping output. |
| City | CITY CRAWL, available standalone | City Crawl/Microcrawl/Dérive, streets, directions/pray/stash/merchant actions, businesses, buildings, NPCs versus NPC encounters, inns. Search often returns a branch table before the parent action. |
| Mythic | Global MYTHIC FATE; Desk Meaning procedures | Fate Chart and Fate Check, Odds/CF, physical-dice input, Scene Check, event clues; all 45 Elements and Action/Description pairs. Optional procedures and follow-through rules are much less complete. |
| Miseries | Desk table/quick rule; Journey Calendar | Daily procedure and existing unique-Misery handling; original lore/art remains in books. |

## Context and related-reference boundary

The inventory JSON's `contexts` lists **declared registry routing**, not proof of mounted object controls. `ObjectPlayTools` contains Character/Monster/NPC context calls but is not mounted by the current app. `PlayMode` imports its state helpers, not that component. The fresh saved Character screen did not show those declared quick references. Treating this code as live coverage would falsely increase coverage.

The **mounted** Dungeon/City/Journey `InlineReferenceTools` do provide useful next actions. Desk RELATED links are also live: Monster → Reaction/Morale/Corpse/Treasure; Broken → rest/combat/Omens/Broken roll; Armor rule → armor table. The two contexts must be distinguished in each finding.

Declared Character routing would offer Rest, Broken, Omens, improvement, Reaction and Corpse; it does not include a named Power/Class definition, and declaration alone does not make it accessible. Named item-to-effect links are the larger gap even where generic related tables exist.

## Navigation weight and feature classification

With a Campaign open, 13 main navigation actions are visible: Reference Desk, City Crawl, ten main Campaign/library destinations, and Mythic Fate. Six record systems—Sessions, Timeline, Threads, Rumors, Relics and short Journal—are grouped behind one closed “보조 기록” disclosure. Import/export are separate utility actions. With no Campaign, the app still opens Reference Desk and offers City/Fate. The Campaign menu is not a required gate to ordinary references.

| Major feature | Role | Evidence-based assessment |
| --- | --- | --- |
| Desk search, Pins, Recent, command palette | CORE | Directly eliminates repeated book/table location and reroll work. |
| Oracle tables, quick rules, Source and Table Inspector | CORE | Direct play lookup; completeness issues are concrete missing effects/rules, not an argument to add more management. |
| Regional Monster/NPC/Encounter generators | CORE | Immediate preparation; missing nested definitions still cause follow-up PDF searches. |
| Dungeon/Room organization and crawl | SUPPORTING / CORE in dungeon play | Stable context and prepared encounter/room packets help source lookup. |
| City and Journey workspaces | CORE | Keep linked procedures in one place; search routing to these tools is weaker than the tools themselves. |
| Character library | SUPPORTING | Existing sheet displays equipment and class effects, but creating a Character is an inappropriate prerequisite for standalone class lookup. |
| Monster/NPC/Encounter placements | SUPPORTING | Keeps prepared material findable in its place. |
| Campaign CRUD, import/export and local persistence | SUPPORTING | Preserves preparation and restores context. No Session needed. |
| Sessions, Timeline, Threads, Rumors, Relics, Journal | OPTIONAL | Hidden by default, no observed obstruction. Their mere existence is not product drift. Do not expand them to fix reference omissions. |
| Campaign Notes | OPTIONAL | Useful beside preparation; its permanent top-level slot has low PDF-search value, but did not obstruct the tested flow. |
| Duplicate legacy Oracle route needed to expose hidden metadata | DISTRACTING **as a workaround** | Adds a second lookup vocabulary and possible random-roll detour for an existing effect. Its random table library remains useful; the workaround is the problem. |
| Unmounted ObjectPlayTools/context wrapper | Dead code, not a distracting visible feature | Cannot be counted as live contextual help. No deletion proposed in this audit. |

**Has the product drifted? No, not in its current navigation or notebook relationship.** It starts at the reference desk, supports play without Session/Campaign and keeps record systems secondary. **It has an uneven reference boundary:** excellent random-prompt access, weaker exact mechanical definitions and follow-through. A trustworthy roll that yields a name without its effect still fails the original PDF-escape goal.
