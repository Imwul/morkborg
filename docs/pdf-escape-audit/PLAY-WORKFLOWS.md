# Play workflows and the notebook test

> Completion recheck: current application HEAD `479cbd765b4168eeaeee27f921bf4b0a6615c51b`. The original page/browser observations below retain their audit baseline. [CURRENT-HEAD-RECHECK.md](CURRENT-HEAD-RECHECK.md) records the newer rolled Power effects, English casting ranking and remaining Omens/search gaps. Final matrix/coverage use that recheck; historical browser results are not claimed to be current failures.

Baseline: `a50d2425deb9a4e9c7e7abb0983dd4c34c68c116`. Actual application at an isolated local `127.0.0.1:5174` instance with the supplied private data loaded. No Session was created or required. A fresh isolated browser context protected the user's normal Campaign, preferences and browser storage. Only a disposable QA Campaign, Character and Dungeon were saved in that context; production code and normal user data were untouched.

The test asked whether **visible application output** was sufficient to continue. Repository/PDF knowledge was used afterwards to diagnose the cause; it was never credited as an answer available to the player. This is a representative scripted play review, not a usability study with a recruited human participant or a claim that a physical notebook was actually written in.

## Evidence and interaction counting

There are 66 browser observations from 06:08:00 to 06:40:50 UTC on 2026-09-08: approximately 33 minutes elapsed. That window includes reading, source comparison and automation pauses, so it is **not 33 uninterrupted minutes of measured human play**. The scenario covers roughly a half-hour's representative needs beside a paper journal. Interaction counts are more meaningful than elapsed times here.

- A click is one meaningful button/disclosure activation, including opening a result. Typing the query, clearing it, scrolling, harness retries and inspection reads are excluded. Choice changes are named separately.
- Search results are measured from an already available search field. A failed zero-result query is **not** a zero-click successful answer.
- Context-specific actions are measured from the stated context, not from an unspecified application root. Optional SOURCE/MORE inspection is counted separately.
- Browser search observations are preserved without private result bodies in [search-probes.json](data/search-probes.json); the full search comparison is [SEARCH-AUDIT.md](SEARCH-AUDIT.md). The concise browser log and original evidence hash are in [browser-observations.json](data/browser-observations.json). Private raw results/screenshots remain in ignored `outputs/pdf-escape-audit/`.

## Actual browser lookup sample

| Need/query | Actual first response / route | Interactions to tested output | Enough to continue without PDF? |
| --- | --- | --- | --- |
| `reaction` | Core Reaction; usable result | 1 | Yes. COPY adds 1; plain clipboard contained only title/result. |
| `morale` | Core Morale quick rule | 1 | Yes: test, triggers and break outcome are supplied. |
| `broken` | Broken/Death reminder | 1 reminder; 3 including RELATED → Broken roll | Yes via related roll. Selecting the already visible Broken Oracle search result would be 1. Reminder alone does not explain all four outcomes. |
| `armor` / `shield` | Armor/Shield quick rule | 1 | Yes for normal absorption, penalties, shield sacrifice and scroll restrictions. |
| `healing` | No result | Failed lookup | PDF escape risk; `rest` provides the answer. Alias gap, not missing healing content. |
| `rest` | Rest quick rule | 1 | Yes for recovery, food/water, starvation and infection consequences. |
| `Omens` | Omens/Powers quick rule | 1 | **No** for how to spend an Omen. Refresh/use-count information does not list the five Core options. |
| `Daemon of Capillaries` | No result | Failed lookup | **No** standalone Power lookup. |
| `sacred scroll` | Sacred Scrolls → Hermetic Step | 1; 3 including SOURCE → TABLE | **No** in Desk: name only, including the complete table view. The effect exists in private metadata and generated Character equipment. |
| `Fanged Deserter` | Earliest Memories table | 1 | **No** for the class ability; this is a background roll, not the class definition. |
| `Ancient gore-hound` | No result | Failed lookup | Class feature exists on a generated class sheet, but exact lookup fails. |
| Character → Fanged Deserter | New class Character → class-feature disclosure | 5 from Campaign context, including class selection/generation; 1 on an existing relevant sheet | Yes on the sheet: class restrictions, bite and generated hound mechanics are available. Creating a Character solely to answer a class question is an indirect workaround. |
| `weapons` | Flail, then Knife on reroll | 1; 3 including SOURCE → TABLE | **No** damage values in Desk. The table displays ten names. A generated Character's Zweihänder does show its damage. |
| `Heavy Armor` / `light armor` | No result | Failed lookup | Named lookup fails. Generic armor rule supplies protection/penalties, but not the complete purchase-price catalog. |
| Armor rule → RELATED → Armor | Medium armor name | 3 | Generic rule explains the category; the generated name has no dedicated definition link. |
| `Lantern` / `medicine chest` | No result | Failed lookup | Effects/catalog data are either missing or buried in starting-equipment tables. |
| `Starting Equipment Second` | Source starting-equipment table | 1; 3 including SOURCE → TABLE | The table supplies useful mechanical text for several items, including shield/life elixir/food. **Not all mundane items lack effects**; discoverability is the issue for these rows. |
| `Equipment` | RECLVSE Gear & Equipment List; random Pan | 1 | **No** answer to Core shopping prices or a named mechanical item. |
| `useful item` | SD Useful Item → a quantity of Core Armour | 1 | Result identifies a source category but does not open its mechanical definition; follow-through is indirect. |
| `Prowler` | Core outcast statblock | 1 | Yes: HP, Morale, armor, attack/damage and optional detail. |
| `Carcasswan` | Creature text plus SOURCE UNAVAILABLE warning | 1 | **No** for paired/lone combat variants; supplied FERETORY contains them. This is an app extraction/render boundary, not a missing PDF. |
| `Lentil Lice` | Encounter prose about starved peasants; unavailable-stat warning | 1 | **No** for the supplied peasants' combat stats. |
| `Überwolf` | Main creature statblock | 1 | Main creature yes; regular-wolf companions need an unexposed definition. |
| `Stein`, `Benzen`, `Arga`, `Rotten Nurse` | No results | Failed lookup | Supplied HERETIC creature/outcast material is not reachable by those names. |
| `Sarkash monster` | Nodh ×2; later Carrion Owls ×2 | 1 generation; +1 MORE; +1 SOURCE | Yes for these sampled creatures. Primary FERETORY and routing Depths are separate; app policy is explicitly separated. Do not generalize these successes to every routed creature. |
| `NPC` | Name/profession/appearance/traits/motivation/Reaction packet | 1 | Yes as playable prompts. A profession alone is not a promise of a source statblock. |
| `encounter` | RECLVSE 10C Encounter fragment | 1 | Enough for that table, but not necessarily the expected Dungeon encounter procedure. Generic search ambiguity remains. |
| Special Room 02 | Compact Mirror room result | 1 expand; +1 SOURCE | Yes. The room's applicable source components and policy are inspectable without editing. |
| Room SOURCE → canonical table → Close | Core Sample Rooms, then original Room 02 | 1 open table; 1 close | Context retained. No PDF escape. |
| `city crawl` | City Crawl — Failure | 1 | Not the parent procedure. Search exposes a conditional branch before the action. |
| `get directions`, `pray`, `stash` | Weak/Failure branch tables | 1 each | The branch alone does not answer when/how to make the full move. |
| CITY CRAWL → directions | Directions/pray/stash disclosure → roll | 3 from Desk navigation to result; +1 optional usage disclosure | Yes. Correct DR and separate two-die outcome, help choice and follow-up are visible. The complete tool exists; search routing is weaker. |
| `travel` | SD daily-travel quick rule | 1 | Yes for the day sequence. |
| `camp` | FERETORY dream table first | 1 wrong-purpose output | Camping move is available lower down/in Journey. Ranking gap. |
| JOURNEY | Calendar → weather → road/event → encounter resolution → camping | 5 stage actions after region/calendar choices | Yes for the tested straight path, including the road event's weather follow-up and camp healing. Resources remain player-applied. |
| `Action + Theme` | Paired source prompts | 1 | Yes; no narrative interpretation is invented. |
| `Mythic Actions` | Animal Actions | 1 wrong-purpose output | Generic modifier query ranks a different Meaning table. Exact Meaning table heading works. |
| `Fate Chart` | Mythic quick reminder | 1 | Reminder alone is incomplete, but global MYTHIC FATE supplies the actual tool. No direct search-to-panel action. |
| MYTHIC FATE | Odds/Chaos → roll, or physical-dice input | 2 ordinary actions from closed panel; tested manual-input/event drill 5 activations plus value entry | Fate result is sufficient. Event Focus follow-through is incomplete when a character/thread list is empty or ambiguous. |
| `initiative` | Core initiative roll | 1 | Yes. |
| `combat` | Mythic Character Actions, Combat first | 1 wrong-purpose output | Core combat exists near first; generic ranking is misleading. |
| `crit` | Core crit/fumble rule | 1 | Yes, including armor damage. |
| `Powers` | Mythic Powers Meaning table | 1 wrong-purpose output | Core casting is not in the tested top five; wrong authority for a rules query. |
| `carrying` | Carrying Capacity quick rule | 1 | Yes. |
| `Miseries` | Calendar/Miseries result | 1 | Yes for normal Core use. SD's optional escalating variant is separately partial. |
| `unarmed` | No result | Failed lookup | Small Core quick-rule gap. |
| `Occult Treasures` | Ring result with its destructive effect | 1 | Yes for the sampled treasure; generated magic content is not uniformly incomplete. |
| Reload → Pin Reaction | Saved pin executes directly | 1 | Yes; pin and QA Campaign survived reload. |
| Open Recent → Reaction | Recent primary action executes | 1 from already open Recent; 2 including opening tray | Yes; no inspector-first step. |

## Combat

Encounter → **initiative** → **attack/defense** → **damage/armor** → **crit/fumble** → **Broken/death** → **Morale/flee** can be completed from current Core quick rules, direct tables and related references. A combat tracker is unnecessary to resolve this workflow.

The actual PDF escapes are narrower:

- A weapon obtained outside a generated Character sheet has a searchable table name but no visible damage in Desk. Core BB PDF18 / Full PDF23 (printed19); additional purchase weapons BB25 / Full29 (printed25).
- Spending an Omen requires the five options absent from the quick rule. BB37 / Full42 (printed38).
- Unarmed/improvised damage and explicit round timing are missing small reference details. BB30 / Full33 (printed29).
- Exact or situational queries such as `healing`, armor-item names and several Korean phrases fail despite related generic rules existing. See individual queries before calling a rule absent.
- Some supplied creature variants/companions are omitted from indexed statblocks, so a successfully generated encounter can still send the player to FERETORY/HERETIC.

**P0: none observed.** Core's central resolution chain exists. P1 omissions still matter, especially Powers, Omens and weapon lookup. RECLVSE-specific combat differences are separate optional rules, not substitutes for Core and not assumed active in every session.

## Non-combat

Travel → encounter → Reaction → conversation → NPC prompts → room search → treasure → carrying → rest → next day mostly works with existing tools. Reaction, NPC motivation, room-search outcomes, carrying and normal rest all have actionable content.

**PDF ESCAPE:** interpreting a generated scroll; finding a named shop item's effect/price; locating a class-specific restriction by name; completing a source-specific creature companion; deciding Mythic NPC response without the missing Behavior procedure. A generic Action/Theme prompt is useful but does not replace an explicitly supplied procedure when the user chooses to use it.

Do not recommend more conversation logs, inventory management or automated social decisions. Link the result to the existing effect when available; add only missing concise mechanics.

## Solo Oracle

Yes/No, Action + Theme, description/details and ordinary Mythic Fate are well covered. All 49 Mythic Meaning tables are present (Action two, Description two, 45 Elements); paired meaning procedures are usable.

**PDF ESCAPE:** Mythic Event Focus says to select an NPC/thread without the notebook-list selection/empty-list instructions; NPC Behavior/action-versus-answer resolution is absent; Altered Scene adjustment has incomplete repeated/conditional handling. Exact locations and optional variants are in [MYTHIC.md](MYTHIC.md).

The Fate tool does not require a digital campaign list. A concise reminder for selecting a handwritten list would be sufficient. Thread Progress Tracks, Keyed Scenes and other optional rules are lower-frequency lookup candidates, not reasons to build trackers or narrative systems.

RECLVSE's extensive random tables are much better covered than its named Moves, base class rules and relic mechanics. Users playing RECLVSE as their chosen solo ruleset will encounter more PDF escapes than a Core + SD user. Shared Core mechanics are deduplicated when genuinely identical.

## Dungeon

Create Dungeon → four prepared Special Rooms → enter/crawl → room contents → encounter → Reaction → danger/treasure/corpse → next room is represented by current Dungeon/Crawl/Desk tools. The generated QA Dungeon had four visually distinct compact packets. Room 02 → SOURCE → Sample Rooms → Close retained its expanded state. No edit mode was needed to inspect source.

Special Room's actual source selection and the app's choice to use Core Sample Rooms for SD's four prepared slots are distinct. This audit found **no need to rebuild Special Rooms again**.

**PDF ESCAPE / indirect:** SD useful-item outputs route to another book/category without a clickable definition; SD's manual room-exit matrix loses its column labels; Depths card suit/rank selectors are obscured in the generic inspector; five-card creature-stat construction is incomplete as a procedure; some source-specific escape/search/encounter workflow headings are hard to find generically. SD's adventure start/completion milestone rules and outdoor Micro-crawl are absent, although ordinary dungeon movement and camping exist.

Rooms are prompts for the notebook user to interpret. The absence of a complete adventure narrative is PDF-appropriate, not a defect. Scenario-specific printed statblocks are still legitimate short reference needs and were assessed separately from their long prose.

## City

Street/contents/exits, Microcrawl/City Crawl, city NPC encounters, businesses, merchant and directions/pray/stash tools exist. NPC generation is distinct from an NPC encounter. Actual directions output included DR, Strong/Weak/Miss interpretation and the source's meaningful help choice.

**PDF ESCAPE / indirect:** searching the action name often executes only its Weak/Failure table; the user must recognize and enter CITY CRAWL for the full procedure. Notable Artefact type effects are hidden in table metadata. Named merchant goods and scenario NPCs have uneven search/definition coverage. The Gunsmith's reference is to **supplied HERETIC Blackpowder Weapons, PDF46 / printed44**, so this is an application lookup/link gap, not a missing source file.

Do not propose a new settlement system. The existing city workspace already contains the parent actions that search should reach.

## Travel

The tested Journey started in Sarkash: Calendar produced no new Misery; weather was resolved; a road event changed weather and its secondary weather roll was displayed; encounter resolution exposed relevant quick tools; camping showed the source outcome, healing, refresh and consumption reminders. Five stage actions after setup completed the day without a PDF or a narrative log.

**PDF ESCAPE / indirect:** `camp` first retrieves dream prompts; SD's optional daily-Misery escalation and Omens/casting variants are incompletely summarized; Depths Orakle likelihood guidance is buried in source notes and optional-DR/regional-EL/five-card instructions are incomplete. These optional systems must remain labeled by source, not blended into a single supposedly official travel rule.

Foraging/tracks/road departure, encounters and camps have actual linked source-backed paths. No automation is demanded for human route choice, narrative arrival or resource application.

## Character / Class / Powers / equipment

The generated Fanged Deserter sheet demonstrated a useful preparation surface: identity, HP/abilities, weapon damage, equipment mechanics and class-feature rules. Opening its class disclosure is one click once on that sheet.

But the notebook user who already knows the class or Power name should not have to generate another Character to retrieve it. `Fanged Deserter` rolled a background; `Ancient gore-hound` and `Daemon of Capillaries` returned nothing. `sacred scroll` and its TABLE disclosed names without effects. These are central **result → definition** and standalone lookup failures.

The current source data already contains all 20 Core Power effects and ten starting weapon damage values. A minimal intervention would expose those fields through the existing inspector and named lookup. Missing prices, additional weapons and supplement/class restrictions need compact source-specific entries. No new inventory subsystem or spell automation is recommended.

## Generated-result follow-through

| Actual generated material | Mechanical follow-through | Finding |
| --- | --- | --- |
| Knife/Flail in Desk | Weapon TABLE still names only | PARTIAL: damage metadata omitted. |
| Zweihänder on Character | Damage displayed on sheet | Resolved in this context; does not fix general weapon lookup. |
| Medium armor from related table | Category name; generic armor quick rule is available | Indirect definition chain; catalog price remains absent. |
| Starting-equipment monkeys / shield / life elixir | Useful source mechanics displayed in table/sheet | Resolved content, weak exact-name lookup. |
| Sacred Scroll: Hermetic Step | No effect in Desk result or TABLE | PARTIAL, despite existing effect data. |
| Named Power query | No matching definition | PARTIAL: generated Character is a workaround. |
| Sarkash Nodh / Carrion Owls | Stats, special, primary/routing source | Resolved for tested samples. |
| Carcasswan / Lentil Lice / Überwolf | Variant or companion mechanics missing | PARTIAL, source is supplied. |
| NPC packet | Prompt components and Reaction | Resolved for that generator's intended material; no arbitrary stats demanded. |
| Encounter fragment | Useful text, sometimes a secondary-table reference | Table-specific; generic heading/routing is indirect. |
| Special Room component | Source result, relevant conditional entry, canonical table | Resolved in tested packet; context preserved. |
| Occult treasure / Dungeon relic | Sample effects and, when printed, summoned creature stats visible | Resolved samples; item name search and supplement catalog gaps remain. |

## “What next?” and actual mounted context

- Desk Monster RELATED → Reaction/Morale/Corpse/Loot works. It does not cure missing embedded companion definitions.
- Dungeon/Crawl, City and Journey have mounted inline reference tools and useful next steps.
- Character's declared `ObjectPlayTools` references are not mounted in the current app; no Character context coverage was credited merely because the registry declares it. Named Power/Class/item definition links remain the most valuable missing transitions.
- Source/table navigation within the Room retains its original context. No evidence of forced return to Desk root in the tested flow.
- Pins and Recents execute directly. Their existing behavior does not need another redesign to solve missing mechanics.

## The notebook test: recorded PDF escapes

The representative sequence combined road travel, an encounter, a fight, a room, loot, city assistance and rest. No source PDFs were used to supply answers during the application test.

1. **Need a reaction:** answered in one click; copied to clipboard if desired. No PDF.
2. **Run the creature:** ordinary Sarkash samples were complete; Carcasswan/peasants/companions exposed missing nested stats. **PDF ESCAPE: FERETORY creature variants.**
3. **Resolve initiative/armor/critical/Broken/Morale:** usable rules/results available. No PDF for the normal chain.
4. **Use a found weapon:** name appeared without damage. **PDF ESCAPE: Core weapon definition.**
5. **Spend an Omen:** quick rule did not explain the options. **PDF ESCAPE: Core Omens.**
6. **Cast/identify a scroll:** exact name failed; scroll table still omitted effect. **PDF ESCAPE: Core Power effect.**
7. **Enter a prepared room:** concise source result and complete disclosure; table closed back to Room 02. No PDF.
8. **Interpret treasure:** sampled occult ring/relic effect was present. No PDF for those samples.
9. **Look up a class ability:** search returned background or nothing; new Character sheet supplied the ability only after a preparation detour. **Likely PDF ESCAPE: existing content too hard to reach.**
10. **Buy/find equipment:** random gear prompt did not answer price/effect. **PDF ESCAPE: Core catalog or named item.**
11. **Ask directions:** search returned a partial branch, but the existing CITY CRAWL action provided the full move. **Lookup detour**, avoidable with parent routing.
12. **Resolve an unexpected Mythic event:** the focus/meaning result existed, but empty handwritten list selection was not explained. **PDF ESCAPE: Mythic follow-through instruction.**
13. **Camp/heal:** `healing` failed and `camp` ranked dreams first; `rest` and Journey answered fully. **Lookup detour**, not missing normal rest mechanics.
14. **Next day:** ordinary Journey stage sequence worked; optional SD escalating-calendar variant still needed its source-specific reminder.

## Desktop/mobile review

Desktop screenshots at 1440×1000 confirmed that source/table information can be intentionally opened and Room packets remain distinguishable. The visually clean Weapons table nevertheless contains no damage: absence of clutter is not reference completeness. City action conditions and the generated class sheet are readable; both are longer than a single named lookup ought to require.

At 360×800, Reaction → roll → copy → Recent → reroll → SOURCE → back remained readable, with no document-level horizontal overflow. SOURCE used vertical scrolling and retained close/back controls. The compact floating quick tray can require horizontal attention at the edge, but it did not force a PDF. This was a focused mobile play-reference check, not a new four-breakpoint redesign audit.

The principal failures were **missing/hidden mechanics and discovery**, not the speed of an already found Oracle. Reading original adventure prose, lore, art or nuanced examples remains an intentional book experience.
