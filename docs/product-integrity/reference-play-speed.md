# Reference play-speed pass

The installed private dataset was inspected before changes. All twelve requested searches already returned the intended playable reference at rank 1. Ranking was preserved; no probability, source table, or generator procedure changed.

| Query | First result before / after | Primary action |
| --- | --- | --- |
| reaction | `oracle:core.reaction` | ROLL |
| morale | `rule:core.reaction-morale` | OPEN |
| broken | `rule:core.broken` | OPEN |
| corpse | `oracle:core.corpsePlundering` | ROLL |
| treasure | `oracle:core.treasures` | ROLL |
| useful item | `oracle:sd.usefulItems` | ROLL |
| Sarkash monster | `rule:regional-monsters:sarkash` | GENERATE |
| Kergüs monster | `rule:regional-monsters:kergus` | GENERATE |
| room | `oracle:sd.room.contents` | ROLL |
| NPC | `procedure:workbench.npc` | GENERATE |
| Omens | `rule:core.omens` | OPEN |
| Miseries | `oracle:core.miseries` | ROLL |

Search actions remain campaign-independent. A primary action can roll directly or open the short rule; inspector/source navigation is a separate UI choice. These are domain action contracts, not a claim of independently measured browser clicks.

Two action labels/behaviors needed correction. Encounter Prep requires selecting its existing parameters, so its label is now OPEN rather than RUN. Opening a verified creature now retrieves its existing stat block immediately; the regression test supplies a random function that throws if called, proving that lookup does not roll a replacement creature.

The Monster context previously showed six controls, including regional generation, The Monster Approaches, Trait, and Desire. It now shows four canonical references useful while handling the current monster: Reaction, Morale, Corpse Plundering, and Occult Treasures. Creating another monster remains available through search and region references. Room context remains six tools by default and at most eight; its first six now contain Encounter Prep, the paired room description, contents, Reaction, Occult Treasures, and Useful Items. Exits and Traps remain available in the expanded eight-item shelf. These are navigation recommendations, not a newly automated procedure.

COPY keeps the result and source-defined conditions. COPY WITH SOURCE adds only a concise book abbreviation, PDF page, and printed page; duplicate citations are collapsed. It no longer adds source notes or table/procedure labels that may contain audit metadata. Raw unknown book IDs are never used as a clipboard book title. Roll traces, entry IDs, table IDs, dataset versions, and related-navigation records remain in the inspector. The exact app-generated missing-dependency warning keeps its warning in copied City results while omitting internal target IDs; original source text remains unchanged.

Regional results now present one creature packet with its exact canonical name and already-derived quantity, including ×1. The original printed route remains unchanged in the retained Oracle result; its primary/routing citations and source authority remain inspectable. Missing creature sources show the verified name and quantity with SOURCE UNAVAILABLE and no fabricated stats. The source table view also has an explicit non-rolling return to the existing result.

`tests/reference-play-speed.test.ts` adds eight checks covering all twelve real queries, bounded contextual shelves, deterministic creature retrieval, clipboard provenance privacy, useful result copying, the City missing-source branch, and resolved/unresolved regional displays. Existing context/action/citation assertions were updated to the explicit new contract; no source-fidelity or generation tests were weakened. The final 57-test focus covering play-speed, reference hardening, and reference graph behavior passed, together with TypeScript and lint.
