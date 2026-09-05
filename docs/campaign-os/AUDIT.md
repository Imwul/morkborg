# Campaign OS audit — 2026-09-05

Inspected the actual v5 repository, ran its tests, and opened the deployed app at https://morkborg-4e3y.vercel.app/. Baseline: **222 tests pass**. The working tree was clean. The production browser contains an existing acceptance campaign, `THE ASHEN PSALM — copy verified — imported`, with two independent dungeons. Inspected its dungeon dossier, room sequence, placement controls and navigation before changing code. No supplied reference screenshot files accompanied the request; the attachment contains only the brief. References named by the project include DNGNGEN, SCVMBIRTHER and DNGNSTOCK. Any subsequent reference comparison must distinguish these live pages from missing supplied screenshots.

## Existing product map

| Area | Implemented | Gap / implication |
|---|---|---|
| Campaigns | Create, rename, duplicate, delete, browser-local save, import/export, separate notes | No first-class session or durable activity ledger |
| Characters | Classless and sourced classes, drafts, rerolls, manual edits, inventory, HP, Omens, silver, life state | Death is a field change without campaign history; no session participants |
| Dungeons | Regional generation, editable provenance, drafts, rooms, placement summary, separate notes | `status` is generated prose; cannot reuse it for exploration flags |
| Rooms | Stable UUIDs, reorder, regenerate, edit, notes, definition placements | No hidden/discovered/visited/cleared history |
| Monsters | Definition library, stats, source-backed generator, quantity placements | No placement outcome or session encounter state |
| NPCs | Name/profession/appearance/motive/reaction, manual stats, secret, placements | No visibility flag, durable encounter history or death event |
| Encounters | Common/rare/hazard/discovery/room categories, Monster/NPC participants, placements | No state at the table; definitions must remain separate from instances |
| Oracles | Search/filter/favorites, source validation, rolls, prose notes destinations | Temporary result history is not durable; cannot save to a session |
| Mythic | Fate/scene checks, Chaos, recent 20 readings, persistent panel | Bounded roll history is not a campaign chronicle |
| Notes | Campaign, dungeon, room and entity strings | No independently linkable quick-capture notes |
| Relations | Typed placements + encounter participants; deletion/reorder/clone integrity | No session/object references, significant-item custody or chronicle backlinks |
| Sources | Field provenance, reference chains, collapsed source disclosure | Must survive migration and remain collapsed |
| Persistence | Zod on every transaction, v1–v5 migration, raw backup, damaged-save recovery, quota feedback | New fields would be silently stripped unless added to schema |
| Import/export | JSON validation and all-owned-ID remapping on collisions | New owned IDs and every relation must participate |
| Navigation/search | Stable workspace state; campaign search; Cmd/Ctrl+K focuses search | No command actions; no new chronicle entities indexed |
| Play assistance | Dice in generators, Mythic panel, HP/Omens edit | No compact current-session control surface |
| Responsive | Existing desktop and mobile breakpoints | Ultrawide stretches to 2880px; equal grids and 26px controls undermine hierarchy/touch use |

## Priority inventory (before implementation)

**P0 — persistent campaign memory:** Sessions and participants; durable timeline with manual and automatic events; non-destructive discovery and placement state; quick capture; stable typed object references; v5-to-v6 backup/migration; clone/import/delete integrity tests.

**P1 — campaign continuity and actual play:** Threads, rumors, significant relics and custody; compact backlinks; GM-only annotations; current-session Play mode, session-scoped encounter instances, quick dice and notes; search commands; source-verified Miseries/day procedure and travel record.

**P2 — defer unless workflow supports it:** First-class factions (existing NPC affiliation remains useful); player-only view (visibility groundwork first); arbitrary clocks, route simulation, advancement/combat automation, multiplayer and VTT tools. Do not invent source mechanics.

## Visual diagnosis and direction

The production dungeon consists of four equal field columns with identical yellow labels and continuous boxed room cards. Its header is separated from its premise by region/chrome controls. Navigation occupies 244–280px. Yellow serves every selected control. The character sheet gives the generic sheet heading more emphasis than the character's name. Approximately 6051 lines of layered CSS contain competing media overrides; `--font-label` is referenced without a definition.

Direction: a legible annotated ledger. Quiet compact navigation; a bounded reading workspace; a strong dungeon/character identity; a leading premise and asymmetric dossier; rooms as numbered entries; restrained rules and marks. Reading text, labels, numbers and display type have distinct roles. Workspace, generator and rare event intensity are deliberately different. Sources, relationships, secrets and editing controls remain intentional disclosures. No copied artwork, rotated body text, giant animations or decorative interference with controls.

See the final implementation/validation report for measured outcomes and deferred limitations.
