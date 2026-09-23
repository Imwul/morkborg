# Spatial Oracle missing-reference audit

Audited against the installed public and private source packs after baseline `806371812a5488c90872f029cbbb2275f9996e14`. These mappings change navigation only. They add no table, row, source claim, odds, generated result, or relationship edge. The public pack still has 987 Reference entries / 545 Oracle tables; the private pack has 993 / 546. Both registries resolve every mapped ID.

## Dungeon

| Illustrated affordance | Exact existing Reference | Canonical source | Use |
| --- | --- | --- | --- |
| Damaged threshold | `oracle:reclvse.entranceState` | RECLVSE PDF/printed 88, d12 | Condition of the entrance, separate from the existing Entrance table |
| Scratches and remnants at the entry | `oracle:reclvse.entranceSigns` | RECLVSE 89/89, d12 | Physical clues at the entrance |
| Air drifting from the entrance | `oracle:reclvse.entranceSmells` | RECLVSE 89/89, d20 | Smell outside the room |
| Room floor and outline | `oracle:reclvse.roomShape` | RECLVSE 91/91, d12 | Shape of the chamber |
| Scent inside the chamber | `oracle:reclvse.smells` | RECLVSE 92/92, d20 | Room smell, distinct from entrance smell |
| Doorway in the room boundary | `oracle:reclvse.exitType` | RECLVSE 93/93, d6 | What kind of exit the boundary represents; the possible results include a doorway, hallway, tunnel, breach, stairway, or concealed exit |

The room-boundary `door` hotspot previously opened `rule:depths.locked-doors`, which is a TR-based move. It now opens the `Exit Type` Oracle and is labelled accordingly. Clicking it inspects the possible exit form; it does not adjudicate a lock. There is no dedicated non-TR door/lock Oracle in the registry. `oracle:reclvse.exitsNumber`, `oracle:reclvse.quickExits`, and `oracle:sd.room.exits` are real, but represent exit count or broad room exit generation rather than a lock on the drawn doorway.

The requested `oracle:depths.weakHitConsequences` is already a verified, rollable d6 table from Sölitary Depths PDF 11 / printed 8. Its source note says to use it for an **unclear Weak Hit while in a dungeon**. It is a conditional suggestion in the readable dungeon-action result area when a move returns Weak Hit; it is not mapped to an arbitrary object in the chamber and never auto-rolls. The separate crawl outcome Weak Hit means an ordinary room and does not by itself call for this table. A result involving the table must still go through the established Reference reader and canonical roll engine. The source's embedded row 3 has its own d6 resolution and remains unchanged.

Other candidates audited but not forced into this plate: `oracle:reclvse.entranceHazard`, `oracle:reclvse.entranceSounds`, `oracle:reclvse.entranceImpression`, `oracle:reclvse.air`, `oracle:sd.odoursTastes`, `procedure:sd.sound`, `oracle:sd.building.size`, `oracle:sd.building.form`, and `oracle:sd.building.material`. Some overlap the selected entrance, room sound, scent or architecture affordances. A second cue for each would make the illustration a disguised table list. The SD Building/Structure tables could justify a separate exterior plate if that situation becomes a future context.

## City crawl

| Illustrated affordance | Exact existing Reference | Canonical source | Use |
| --- | --- | --- | --- |
| Signs before the gate | `oracle:reclvse.city_signs_before_entering` | RECLVSE 95/95, d20 | What is apparent on approaching the city |
| Exposed paving stones | `oracle:reclvse.street_surface` | RECLVSE 99/99, d12 | Material/character of the street surface |
| Troubled alley | `oracle:reclvse.hazard` | RECLVSE 100/100, d20 | Street-generation hazard |
| Smoke/scent in the quarter | `oracle:reclvse.neighborhood_smell` | RECLVSE 96/96, d12 | Neighborhood smell |

`oracle:reclvse.street_activity`, `oracle:reclvse.neighborhood_sound`, `oracle:aitc.hazards`, and the city move result tables were also checked. The current crowd and street affordances already convey activity and sound; move-specific results need their procedural trigger. None was added simply to increase hotspot count.

## Journey

| Illustrated affordance | Exact existing Reference | Canonical source | Use |
| --- | --- | --- | --- |
| Wayside feature beside the road | `oracle:feretory.roadEvent` | Feretory PDF 7 / printed 5, d20 | The daily event by the road |
| River bank and crossing | `oracle:reclvse.water_landmarks` | RECLVSE 113/113, d12 | A water landmark, not water quality or crossing success |
| Damage and tracks suggesting danger | `oracle:reclvse.threat_signs` | RECLVSE 110/110, d20 | Signs of a threat, distinct from existing signs of travelers |

`oracle:reclvse.weather_shift`, `oracle:reclvse.signs_of_ambush`, and other hazard/sign tables exist but would compete with the selected sky and track features. Region-specific discoveries require a known region; assigning one to a generic journey river would suggest an unsupported universal table.

## Integrity and scope

The three scene models grew from 29 to 41 hotspots (Dungeon 11→16, City 9→13, Journey 9→12). Each ID remains unique within and across scenes; all 41 resolve in both installed packs with source references. New Oracle hotspots remain inspect-first and roll only through their existing Reference actions. Existing row FOLLOW-UP/SUBTABLE/LOOKUP and Reference USES/USED BY links are not changed by scene proximity. The TR/threat-rating rules, `depths.procedure.threatMoves`, and other TR-based moves were not added to any scene; the former door mapping was removed as described above.
