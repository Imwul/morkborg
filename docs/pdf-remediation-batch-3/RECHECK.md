# Batch 3 — selected recheck

Only the 19 selected IDs receive new classifications. Source verification and actual browser behavior are both required; inherited classifications elsewhere remain untouched.

| Audit ID | Inherited before | After | Canonical reference | UI query |
|---|---|---|---|---|
| core-difficulty-scale | PARTIAL | RESOLVED | rule:core.tests | DR |
| core-round-duration | PARTIAL | RESOLVED | rule:core.round | round duration |
| core-starvation | PRESENT_BUT_INDIRECT | RESOLVED | rule:core.rest | starvation |
| core-infection | PRESENT_BUT_INDIRECT | RESOLVED | rule:core.rest | infection |
| core-scroll-restrictions | PARTIAL | RESOLVED | rule:core.armor-shield | armor |
| core-purchase-20-arrows | MISSING | RESOLVED | rule:core.services | 20 arrows |
| core-purchase-10-bolts | MISSING | RESOLVED | rule:core.services | 10 bolts |
| core-service-night-in-hospice | MISSING | RESOLVED | rule:core.services | armor repair |
| core-service-drink | MISSING | RESOLVED | rule:core.services | armor repair |
| core-service-steady-meal | MISSING | RESOLVED | rule:core.services | armor repair |
| core-service-bribe-guard | MISSING | RESOLVED | rule:core.services | armor repair |
| core-service-bribe-clerk | MISSING | RESOLVED | rule:core.services | armor repair |
| core-service-bribe-rabble | MISSING | RESOLVED | rule:core.services | armor repair |
| core-service-armor-repair-tier-1-to-2 | MISSING | RESOLVED | rule:core.services | armor repair |
| core-service-armor-repair-tier-2-to-3 | MISSING | RESOLVED | rule:core.services | armor repair |
| core-starting-item-bomb | PRESENT_BUT_INDIRECT | RESOLVED | definition:core.gearA:10-10 | Bomb |
| core-starting-item-life-elixir | PRESENT_BUT_INDIRECT | RESOLVED | definition:core.gearB:1-1 | Life elixir |
| core-starting-item-small-vicious-dog | PRESENT_BUT_INDIRECT | RESOLVED | definition:core.gearB:3-3 | Small vicious dog |
| core-starting-item-monkeys | PRESENT_BUT_INDIRECT | RESOLVED | definition:core.gearB:4-4 | Monkeys |

Two ammunition rows were stale inherited MISSING findings: their prices already appeared in Batch 1 Bow/Crossbow definitions. They count as newly verified closures, not newly written rules.

Remaining inherited classifications: {"PARTIAL":32,"PRESENT_BUT_INDIRECT":165,"MISSING":182,"SOURCE_UNAVAILABLE":3}; total 382.

The daily Powers-use regression and generic Scroll continuation are documented dependencies, not extra audit closures.
