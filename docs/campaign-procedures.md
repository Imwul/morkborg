# Campaign procedure audit

Sources were inspected directly on 2026-09-05. PDF page numbers are one-based physical pages, not assumptions about printed page numbers. The private Oracle registry remains the single source for table entries; no complete source table or artwork is added to public application code.

| Source | PDF / printed pages | Verified procedure | Application treatment |
|---|---|---|---|
| MÖRK BORG Bare Bones | 17 / 17 | GM/group chooses d100, d20, d10, d6 or d2. Roll at dawn; 1 triggers a Misery. | Explicit die selection; NEXT DAWN advances one campaign day and records the roll. It creates a Misery only on 1. |
| MÖRK BORG Bare Bones | 18–20 / 18–20 | d66 selects Psalms I–VI; never repeat a Misery. Seventh occurrence is always Psalm VII 7:7 and ends the campaign. | Existing `core.miseries` results are selected uniformly from remaining d66 outcomes. Six prior records force 7:7. History and all campaign records remain available after the terminal result. |
| MÖRK BORG Bare Bones | 28 / 28 | Normal item capacity is Strength+8; overburden increases Strength/Agility DR by 2; twice capacity is the absolute limit. | Compact reference; sizes and inventory consequences remain explicit player/GM decisions. |
| MÖRK BORG Bare Bones | 29 / 29 | 0 HP invokes Broken d4; negative HP is death. Broken injuries/hemorrhage have conditional follow-up rolls. | Compact reference and existing `core.broken` / `core.brokenInjury` Oracles. No automatic deletion or resurrection of character records. |
| MÖRK BORG Bare Bones | 31 / 31 | Brief rest d4 HP; night's sleep d6 HP. Food/water, starvation and infection alter recovery. | Compact reference. No unconditional heal button. |
| MÖRK BORG Bare Bones | 32 / 32 | Uncertain reaction uses summed 2d6. Morale check when leader dies, half the group is eliminated, or lone foe has one-third HP. 2d6 greater than morale fails; d6 selects flee/surrender. | Compact reference; existing correctly weighted Reaction/Failed Morale Oracles remain available. Encounter state records the player's resolution. |
| MÖRK BORG Bare Bones | 33 / 33 | GM decides improvement timing. 6d10 compared to maximum HP; d6 increase if qualified. Ability-specific d6 changes, limits −3/+6; debris roll. | Compact reference and existing debris Oracle. No invented XP thresholds or automatic advancement. |
| MÖRK BORG Bare Bones | 34 / 34 | Daily Powers use count is Presence+d4 each morning. Casting success/failure has separate effects. | Compact reference; no automatic replenishment from campaign clock. |
| MÖRK BORG Bare Bones | 37 / 37 | Optional Omens; only when depleted, after at least six hours of rest, roll class's die (Classless d2). | Compact reference; does not grant new Omens every dawn or overwrite character data. |
| MÖRK BORG CULT: FERETORY, Roads to Damnation | 6 / 4 | A map gives travel dice for named endpoints, optional world-size changes, weather time modifier. | Only Galgenbeck↔Graven-Tosk d6+6 and Galgenbeck↔Valley of the Unfortunate Undead d6+5 directly match the application's regional choices. Other durations are user-entered. |
| FERETORY, Roads to Damnation | 7 / 5 | Road type d8, daily road events d20. 7–8 rerolls, 5–6 changes weather, 4 prevents progress; italicized outcomes are replaced after use. | Dynamic source-backed rolls, preserved reroll chain, weather follow-up. Repeated events 10–12,16,18–19 require a replacement note before saving. No resources or progress are silently altered. |
| FERETORY, Roads to Damnation | 8 / 6 | Foraging d6; 5–6 calls village d6. | Source rolls and conditional village follow-up. Food quantity, illness and other conditional choices remain in the result for manual resolution. |
| FERETORY, Roads to Damnation | 9 / 7 | Nightly campsite d12; leaving the road after half a day's journey uses d12. | Separate compact actions; save chosen results and resolution notes to the current Session's Timeline. |
| Sölitary Defilement | 17 / 15 | Daily travel flowchart: Calendar, weather, travel or resupply, encounters, Camping move. Tick travel after camping except foraging; arrive during following day after all days marked. Tracks/disrepair require a contextual check. | Used to structure compact calendar/travel controls. Camping move and contextual checks remain manual; table results are not presented as a complete automated travel day. |
| Sölitary Depths | 23–25 / 20–22 | Regional tables may replace or supplement Roads to Damnation; optional hexcrawl uses encounter levels and d20. | Existing regional generators retained. No invented hexcrawl map, region adjacency, encounter levels, or region-to-region distances. |

## Important source corrections

The existing Oracle inventory lists the Defilement travel flowchart as PDF16 / printed14. Direct rendering shows PDF16 is the travelling section cover; the actual flowchart and its conditions are **PDF17 / printed15**. Similarly, Depths PDF23 / printed20 is the overview; the actual Travel Rules and encounter-selection table are **PDF25 / printed22**. Those inventory rows describe sections rather than exact executable procedure locations and should not be used as automation specifications.

The FERETORY route map uses named settlements and landmarks, not abstract region centers. Sarkash is not an endpoint with a printed travel die, nor are the entire Kergüs/Wästland regions. Treating those as Alliáns/Schleswig would invent a mapping. The panel therefore retains manual duration for those routes.

## Scope and remaining manual decisions

The procedures panel records campaign time, all dawn rolls, unique Miseries, optional source-backed travel prompts, real-world dates, current Session links and notes. It does not automate consequences of apocalyptic prose, healing, starvation, infection, inventory loss, combat, travel completion, or optional solo moves. A saved travel result is a prompt and record; NEXT DAWN controls date advancement separately. This makes retries and during-day activities explicit and avoids consuming multiple days by rolling an event again.

Raw books inspected: the project-supplied Bare Bones PDF and the existing source-library copies of FERETORY, Sölitary Defilement and Sölitary Depths. Existing supplemental references from RECLVSE were audited as registry metadata; no new RECLVSE travel mechanics were introduced. No external artwork was extracted or used.

The numeric campaign clock can be set manually when resuming an existing campaign. Each adjustment records a ledger entry without rolling dice or rewriting previous events. Dawn and daily travel explicitly use that clock; a Session’s optional narrative date remains an independent label.
