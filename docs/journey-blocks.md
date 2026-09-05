# Journey procedure blocks

Verified the supplied PDFs directly on 2026-09-05. Sölitary Defilement's travel chart is an embedded image; it was inspected visually on PDF17 / printed15.

- SD PDF17/p15: Calendar → Weather → Road + Road Event OR Forage → resolve encounters → Camping. Track the travel day after camping, except a foraging day; arrival is during the following day after all travel days are marked.
- FER PDF7/p5: road d8; event d20. Event7–8 rerolls the event,5–6 changes weather,4 stops progress. A new daily weather block is not rolled again at the start of the road block.
- SD PDF17/p15: animal tracks and roads in disrepair (road3–5) require **one d20** + Presence or unspent Omens vs DR10. Failure enters the wilderness. Only then is FER Leaving the Road (PDF9/p7) required.
- FER PDF8/p6: forage5–6 resolves a village. FER PDF9/p7 is **Leaving the Road + Nightly Campsite Events**, not an additional unconditional daily encounter table.
- AitC PDF5/p3:1-in-8 settlement discovery for a travelling day, separately from a foraged village. The one daily result survives road rerolls and browser reloads.
- SD PDF8/p6: Camping uses two independent d20 Presence checks vs DR12. Strong=d6HP; Weak=d4HP; Miss=no recovery. After resolving the interruption, the next rest attempt is Strong/Weak50:50. FER campsite10 follows its embedded canonical dreamd6; per-character resource effects remain explicit.
- DEP PDF10/p7 is Encountering Enemies and Locked Doors; camping itself is SDp6. DEP PDF11/p8 covers time/noise dangers, grouped as contextual references with their own trigger.

The new Journey default consists of five bounded blocks with inline results, copy and sources. Calendar management/manual Misery controls remain secondary. A campaign's current-day dawn is checked once, including Day1 or a resumed clock. Existing NEXT DAWN records are recognized; stale completion handlers cannot advance another day. Calendar outcomes remain in campaign data. One current-day worksheet per campaign is retained separately on this device; no narrative is generated or required.

Validation:42 targeted calendar/journey/dungeon-action tests passed, including dawn idempotence after import, stale-day transitions, weather/fork branches, single-d20 navigation, encounter/camping gates, campsite dream provenance and worksheet reload. Scoped lint passed.


The dawn block explicitly labels its calendar as the Core variant. SD's distinct diminishing apocalypse die remains a linked optional rule, not silently combined with Core. The small set of consumed one-off road-event row numbers is retained across days so reuse is flagged without recording journey prose. The active region and Presence/Omens navigation choice survive reload; region carries to the next day while daily rolls reset.

DungeonActionMoves provides SD flee/search/breath/camp/resupply and DEP enemy detection, locked doors, traps and time/noise inside the dungeon. Search uses the canonical SD Strong/Weak d4 tables. A found trap's avoidance accepts Strong or Weak; a triggered trap's save accepts only Strong. Time/noise rolls Reveal a Danger only on the documented1-in6/2-in6 trigger. Each result contains copyable consequences and relevant inline next references. The component never changes character resources or campaign records.
