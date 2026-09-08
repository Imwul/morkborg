# Completion recheck against the current application

Final audited application: `479cbd765b4168eeaeee27f921bf4b0a6615c51b`.
The full source/browser audit began at `a50d2425deb9a4e9c7e7abb0983dd4c34c68c116`. Two documentation commits and one application commit followed. This completion pass compared the complete production diff and rebuilt the registry from the installed private data. It did not assume that the earlier findings still held.

Only `referenceReading.ts` and `references.ts` changed production behavior between those baselines. All 14 inventoried source files retain their recorded SHA-256 hashes (793 physical pages). All 562 canonical tables were re-inventoried. The original 1,132 exact queries plus four additional spell/variant queries were executed through the current search function. Twenty browser queries and 13 result openings were repeated in an isolated local browser; two scroll tables and the weapon table were opened, and Reaction copy/source was reviewed at 360px. The original broader browser session remains the evidence for unchanged Dungeon, City, Character and Journey paths.

## What changed, and what remains

| Need | Earlier observation | Current observed result | Final assessment |
| --- | --- | --- | --- |
| Rolled Core Power | Name without effect | All 20 stored effects pass through the result formatter; both scroll families display effects in the actual browser | This particular failure is corrected by the existing HEAD; do not recommend fixing it again. |
| Power TABLE / exact name | Names only; no named definition | Both table inspectors still list names only; `Daemon of Capillaries` still returns no result | The 20 named Power needs remain PARTIAL. Randomly rolling the desired spell is not a deliberate lookup. |
| `Powers` / `Power` | Core casting below other tables | Core casting first, one click to the complete rule | English ranking issue corrected. |
| `power`, `casting`, `권능` | Not all were original probes | Core casting first | Confirmed current successful routes. |
| `마법` | No result | Still no result in domain search and actual browser | Priority-map entry alone does not create a candidate: token filtering occurs first. Casting remains PRESENT_BUT_INDIRECT for this ordinary Korean lookup. Add an alias/keyword to the existing entry, not another priority-map line. |
| Core Omens | Spending options absent | Options now summarized, but DR reduction is described as a retry; Fumble is rendered as ordinary “실패” | PARTIAL remains. Core BB PDF37 / printed37 and Full PDF42 / printed38 distinguish these mechanics. Reroll scope also needs to retain one's own or another person's roll. |
| SD Omens | One/both-dice option and cap absent | One/two-dice reroll now present; numerical cap absent; unsupported stage-escalation wording added | PARTIAL remains. SD PDF5 / printed3 says maximum four Omens and their use as a Move stat. The separate Misery die progression must not be conflated with Omens. |
| Weapons | Generic result and TABLE lack damage | Same failure after current browser roll/table check | PARTIAL; Character damage display does not repair Desk lookup. |
| Known basic rules / monster | Fast direct paths | Reaction, Morale, Broken, Armor, Rest, Prowler and regional Monster still open/execute | No new failure observed in this focused recheck. |

The source pages for the two Omens reminders were newly rendered and read, not inferred from their citations. No production text was corrected during the audit.

## Search/count consequences

- The 1,136 current domain queries include 367 empty results. This mixed diagnostic set is not a production failure rate.
- Among the original exact queries, only `Powers` and `Power` change top-five ID order. The added lowercase/casting/Korean probes have their own records.
- Canonical/grouped table destinations rank first for 550/562 table-title probes; all 562 remain within the first five. The MGE2/RCL Powers-table destinations now sit behind the deliberately preferred casting rule.
- The underlying classification totals do not change: casting still has an observed Korean discovery gap; each named Power still lacks a usable table/named route; both Omens needs remain partial. The descriptions and smallest fixes do change. Progress is not hidden merely because six broad status counts remain the same.
- The table-view scan still finds 55 parent rows with hidden playable fields across 11 tables and 64 selector/context omissions across seven tables. These are subsets of existing needs, not additional missing references.

## Evidence and limits

[Current domain results](data/head-recheck.json), [current browser observations](data/head-browser-recheck.json), [updated app inventory](data/app-inventory.json), [table access](data/table-access.json). The audit tools are [head_recheck.ts](tools/head_recheck.ts) and [browser_recheck.mjs](tools/browser_recheck.mjs). Private results and screenshots remain under ignored `outputs/pdf-escape-audit/head-recheck/`.

The browser recheck used local HEAD with the installed private source data, not a verified production deployment. Source import/network failure was not fault-injected in this audit; successful private-data loading was observed. Earlier generation-integrity tests are not substituted for a new audit of every failure path. The original 33-minute observation window was a scripted representative play review, not uninterrupted human play or a timed user study.

The completion pass changes audit artifacts and audit tooling only. No application fix, generator change, source-table addition, user-data migration or deployment is part of this delivery.
