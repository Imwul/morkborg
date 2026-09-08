# Universal search: fresh probe audit

Baseline: `a50d2425deb9a4e9c7e7abb0983dd4c34c68c116`. Read-only audit. No ranking, aliases, UI, source data or generators were changed. This report uses fresh domain search snapshots and actual browser observations against that code, rather than previous coverage reports.

## Probe scope and exact counts

**1,254 recorded search observations become 1,132 distinct exact queries after merging 122 repeats.** The key is Unicode NFC plus trimming; case and punctuation variants remain separate. There were **367 empty-result queries** in this deliberately mixed diagnostic set. This is not a production search failure rate: source-heading probes, missing material, exact table titles, natural play questions and named items have different purposes.

| Method | Raw observations | Distinct queries within method |
| --- | ---: | ---: |
| registry-baseline | 264 | 264 |
| supplement-source-probe | 337 | 337 |
| mythic-variation-probe | 36 | 36 |
| canonical-table-title | 562 | 559 |
| browser-search | 55 | 48 |

Methods overlap and their distinct counts must not be added. Actual browser search accounts for **55 observations / 48 exact queries**. The 11 other browser records are direct navigation/reload/workflow checks and are excluded from search counts. Duplicate observations from different methods had **zero top-five ID-order conflicts**. Browser display labels were resolved against the current production short-name/book/action format; no result identity was guessed.

The table-title control examines **562 source tables / 559 distinct title queries**: expected canonical/grouped parent ranks first for **551**, ranks 2–5 for **11**, and is absent from the top five for **0**. That measures known-title retrieval only. It does not establish that spell effects, equipment damage, class rules or the source procedure are readable. A perfect table-title match can still produce only a name.

There are **32 Korean queries**, of which **18** have no results. The complete matrix below includes successes and failures. The metadata-only [search-probes.json](data/search-probes.json) retains every query, top-five stable IDs/UI titles/actions, methods, expected reference/rank where known, and browser activation counts. [search-probe-summary.json](data/search-probe-summary.json) records counts, input filenames/hashes and dedup policy. Neither contains source passages, rule summaries, generated result text, private connection credentials or the private source database.

## Ordinary play queries

The requested common English routes largely work. `reaction`, `morale`, `broken`, `corpse`, `treasure`, `useful item`, `Sarkash monster`, `Kergüs monster`, `NPC`, `Omens` and `Miseries` put the likely reference first. Region routing offers GENERATE; Reaction and useful items offer ROLL. This proves retrieval/action placement, not complete mechanics: the named Omens quick rule still lacks its five expenditures.

`Graven-Tosk` first opens the region, with its monster workflow second. `room` surfaces individual content/exit/descriptor tables, while its combined description procedure is outside the first five. That remains useful for single-table play, but it does not guide a player asking for the complete source room-description sequence.

| Query | Actual top five |
| --- | --- |
| reaction | 1. Reaction **[MB-BB · ROLL]**; 2. City Gate — Guards Reaction **[AitC · ROLL]**; 3. Get Directions — Weak Hit Reaction **[AitC · ROLL]**; 4. NPC Encounter 23 — Soldier Reaction Modifier **[AitC · ROLL]**; 5. Morale **[MB-BB · OPEN]** |
| morale | 1. Morale **[MB-BB · OPEN]**; 2. Beasts — Morale **[RCL · ROLL]**; 3. Failed Morale **[MB-BB · ROLL]**; 4. Hirelings — Broken Morale **[RCL · ROLL]**; 5. NPC Encounter 23 — Soldier Reaction Modifier **[AitC · ROLL]** |
| broken | 1. Broken / Death · 무력화와 죽음 **[MB-BB · OPEN]**; 2. Broken **[MB-BB · ROLL]**; 3. Broken — Injury **[MB-BB · ROLL]**; 4. Broken Bodies **[MB-BB · ROLL]**; 5. Hirelings — Broken Morale **[RCL · ROLL]** |
| corpse | 1. Corpse **[MB-BB · ROLL]**; 2. Twice-Grown Corpse Flies **[FER · OPEN]**; 3. Twice-Grown Corpse Fly · Graves Left Wanting creature **[HER · OPEN]**; 4. Graven-Tosk **[DEP · OPEN]**; 5. The Valley of the Unfortunate Undead **[DEP · OPEN]** |
| treasure | 1. Occult Treasures **[MB-BB · ROLL]**; 2. 10D. Loot **[RCL · ROLL]**; 3. Armor **[MB-BB · ROLL]**; 4. Armor Table **[RCL · ROLL]**; 5. Corpse **[MB-BB · ROLL]** |
| useful item | 1. Useful Item **[SD · ROLL]** |
| Sarkash monster | 1. Sarkash · Regional Monsters **[DEP · GENERATE]**; 2. Sarkash — Monsters **[DEP · ROLL]**; 3. Eat Prey Kill · Sarkash **[FER · ROLL]**; 4. Sarkash **[DEP · OPEN]**; 5. Carrion Owls **[FER · OPEN]** |
| Kergüs monster | 1. Kergüs · Regional Monsters **[DEP · GENERATE]**; 2. Kergüs — Monsters **[DEP · ROLL]**; 3. Eat Prey Kill · Kergüs **[FER · ROLL]**; 4. Fogbound Skeleton · Graves Left Wanting creature **[HER · OPEN]**; 5. Kergüs **[DEP · OPEN]** |
| Graven-Tosk | 1. Graven-Tosk **[DEP · OPEN]**; 2. Graven-Tosk · Regional Monsters **[DEP · GENERATE]**; 3. Eat Prey Kill · Graven-Tosk **[FER · ROLL]**; 4. Graven-Tosk — Discovery **[DEP · ROLL]**; 5. Graven-Tosk — Feature **[DEP · ROLL]** |
| room | 1. Dungeon Room Descriptors — Room Contents **[SD · ROLL]**; 2. Dungeon Room Descriptors — Room Exits **[SD · ROLL]**; 3. Room · Adjective + Type **[SD · ROLL]**; 4. Room Contents **[RCL · ROLL]**; 5. Room Dressing **[RCL · ROLL]** |
| NPC | 1. NPC **[MB-BB · GENERATE]**; 2. Bergen Chrypt — NPC Professions **[DEP · ROLL]**; 3. Graven-Tosk — NPC Professions **[DEP · ROLL]**; 4. Kergüs — NPC Professions **[DEP · ROLL]**; 5. Lake Onda — NPC Professions **[DEP · ROLL]** |
| Omens | 1. Omens / Powers · 징조와 권능 **[MB-BB · OPEN]**; 2. Strange Omens **[RCL · ROLL]**; 3. Creature Difficulty Modification — Spend Omens **[DEP · OPEN]**; 4. SD Camping · 숨 돌리기와 야영 **[SD · OPEN]**; 5. SD General Move · 일반 모험 판정 **[SD · OPEN]** |
| Miseries | 1. The Calendar of Nechrubel — Miseries **[MB-BB · ROLL]**; 2. Calendar of Nechrubel · 재앙 **[MB-BB · OPEN]** |
| travel | 1. SD Travel Day · 하루 여행 순서 **[SD · OPEN]**; 2. Depths Travel · 헥스와 지역 조우 **[DEP · OPEN]**; 3. RCL Travel the Road · 길 이동 **[RCL · OPEN]**; 4. Roads to Damnation · 길과 여행 **[FER · OPEN]**; 5. Travel-Cost Hazards **[RCL · ROLL]** |

## Concrete weak lookup paths

- **Core rules:** `healing`, `infection`, `advancement`, `critical`, `power failure`, `armor broken` and `I reached 0 HP` return nothing, although the relevant Core rule exists. `rest`, `crit` and `0 HP` work. `Powers` puts Mythic word prompts, RECLVSE Powers and Fletcher's encounter-specific spell table ahead of Core casting; Core Using Powers is outside its first five.
- **Korean:** `갑옷` returns Crit/Fumble alone, while `방패` finds Armor/Shield. `반응` puts enemy detection, travel and NPC generation before the Core morale summary, without the actual Reaction roller in the first five. `시체` finds a region, while `보물` and `전리품` return nothing. `피 0`, `내 HP가 0`, `치료`, `마법`, `스크롤`, `짐`, `인벤토리`, `도망` and the longer natural phrases in the matrix fail. `휴식 회복`, `사기`, `죽음` and `방어` do reach useful existing rules.
- **Procedure before branch:** `city crawl` first rolls Failure; the City setup is second. `get directions` exposes only Weak-Hit Reaction; `pray` prioritizes Failure and Strong-Hit tables; `stash` only exposes Weak Hit. These are conditional result tables, not the complete initial move. The actual City workspace has the source moves, so this is a routing problem. Preserve meaningful city/crawl options; do not turn conditional tables into unconditional automatic procedures.
- **Other workflow ambiguity:** `camp` puts dream and campsite-event tables ahead of the camping move. `encounter` puts RECLVSE's 10C table and a category table ahead of Encounter Prep. Existing dungeon Common/Rare tables still require their actual dungeon setup; search should not fabricate a combined encounter procedure. `Mythic Actions` finds animal/combat action tables rather than the generic Action pair. `Expected Scene`, `scene alteration` and `likelihood` fail; `Altered Scene`, `Interrupt Scene` and `Chaos Factor` reach existing reminders.
- **Named source objects:** exact Daemon of Capillaries, Heavy Armor, Lantern, medicine chest, Ancient gore-hound, Rotten Nurse, Stein, Benzen and Arga were tested in the real browser and returned no results. These are not all alias problems: see the separate source audit for missing item references, hidden outcast records, hp-null creature filtering and class feature names.

## Retrieval and usable output are separate tests

**Powers:** `scrolls` and `sacred scroll` find canonical tables, but Desk ROLL and TABLE omit Core `metadata.effect`. All twenty printed effects exist in the private canonical data. The generated Character scroll includes its effect; that does not substitute for targeted play-time reference. Indexing spell names alone would still leave an incomplete result.

**Weapons and armor:** actual Flail and Knife rolls showed the name without `metadata.damage`. The armor quick rule is complete, but its RELATED Armor roller shows a tier name without the stored mechanical information. Catalog prices are a separate missing reference. These findings require exposing existing effects/stats or supplying the verified item reference, not merely search synonyms.

**Classes and rooms:** actual Fanged Deserter search rolls Earliest Memories. Creating the class and opening its abilities does reveal the complete class mechanics, in five recorded setup/navigation actions. There is no standalone class reference. The Special Room source flow did work: opening Room02/SOURCE and selecting Sample Rooms displayed the canonical structured table without losing the room context. Its table link is a valid inspection route, not proof that every metadata effect is rendered.

**Contexts:** `ObjectPlayTools` defines recommendations but is not mounted. Saved Character/Monster/NPC surfaces do not gain Quick Tools from those declarations. Mounted Journey/City/Dungeon inline tools remain real alternative routes. Global search remains independent of Campaign selection.

## Smallest corrective directions — not implemented

| Existing need | Minimal lookup correction |
| --- | --- |
| Rest / recovery / infection | Index healing, treatment, infection, starvation, thirst and concise Korean equivalents to the existing Rest rule. |
| HP / injury | Add common zero-HP phrases and injury aliases to Broken/its injury subtable; keep negative-HP death distinct. |
| Armor and damage | Rank Armor/Shield for 갑옷 and protection questions; route damaged-armor phrases to Crit/Fumble. |
| Casting | Prefer Core Using Powers for ordinary Powers, spell failure, 마법/권능 and failure phrases; expose named source spell effects through read-only entry references. |
| Carrying | Add 짐, 인벤토리 and load/capacity phrases to the current carrying rule. |
| Reaction / corpse / treasure | Add short Korean aliases to the canonical rollers; prevent region or NPC metadata from outranking a direct playable request. |
| City moves | Surface the existing complete City move/context before Strong/Weak/Failure result branches. Keep setup decisions explicit. |
| Camping / room / encounter | Prefer the relevant existing procedure or rule in its context; retain immediate access to independent tables and fixed dungeon encounter tables. |
| Mythic | Route generic Action, scene and odds phrases to the corresponding current panel/procedure. Distinguish ordinary versus prepared-adventure event focus. |
| Equipment / class / creature names | Add canonical named read-only references where mechanics already exist; source audit determines where actual verified data is missing. Do not paper over missing effects with aliases. |

A rollable row's main action remains ROLL/GENERATE/RUN; ⓘ opens it without rolling. OPEN on a rule reveals its summary; OPEN on City or Encounter Prep deliberately exposes setup. The `immediate` field in JSON means automatic execution is appropriate, not that every OPEN takes several clicks. Browser click counts begin after query entry and count the recorded activation, not opening search or typing. A first-result roll can still be semantically wrong for the question.

## Full deduplicated query matrix

Methods: **B** baseline rule/natural/named probes; **S** supplement source headings/names; **V** Mythic variations; **T** exact canonical table title; **U** actual browser search. Titles use current compact UI display names; book abbreviations disambiguate identical names. Stable IDs and individual expected ranks are in the JSON. Blank ranks mean fewer than five returned results.

| # | Query | Methods | 1 | 2 | 3 | 4 | 5 |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | reaction | B/U | Reaction **[MB-BB · ROLL]** | City Gate — Guards Reaction **[AitC · ROLL]** | Get Directions — Weak Hit Reaction **[AitC · ROLL]** | NPC Encounter 23 — Soldier Reaction Modifier **[AitC · ROLL]** | Morale **[MB-BB · OPEN]** |
| 2 | morale | B/U | Morale **[MB-BB · OPEN]** | Beasts — Morale **[RCL · ROLL]** | Failed Morale **[MB-BB · ROLL]** | Hirelings — Broken Morale **[RCL · ROLL]** | NPC Encounter 23 — Soldier Reaction Modifier **[AitC · ROLL]** |
| 3 | broken | B/U | Broken / Death · 무력화와 죽음 **[MB-BB · OPEN]** | Broken **[MB-BB · ROLL]** | Broken — Injury **[MB-BB · ROLL]** | Broken Bodies **[MB-BB · ROLL]** | Hirelings — Broken Morale **[RCL · ROLL]** |
| 4 | armor | B/U | Armor / Shield · 방어구와 방패 **[MB-BB · OPEN]** | Armor **[MB-BB · ROLL]** | Armor Table **[RCL · ROLL]** | Beasts — Armor Tier **[RCL · ROLL]** | — |
| 5 | healing | B/U | — | — | — | — | — |
| 6 | rest | B/U | Rest · 휴식 **[MB-BB · OPEN]** | — | — | — | — |
| 7 | Omens | B/U | Omens / Powers · 징조와 권능 **[MB-BB · OPEN]** | Strange Omens **[RCL · ROLL]** | Creature Difficulty Modification — Spend Omens **[DEP · OPEN]** | SD Camping · 숨 돌리기와 야영 **[SD · OPEN]** | SD General Move · 일반 모험 판정 **[SD · OPEN]** |
| 8 | Miseries | B/U | The Calendar of Nechrubel — Miseries **[MB-BB · ROLL]** | Calendar of Nechrubel · 재앙 **[MB-BB · OPEN]** | — | — | — |
| 9 | corpse | B | Corpse **[MB-BB · ROLL]** | Twice-Grown Corpse Flies **[FER · OPEN]** | Twice-Grown Corpse Fly · Graves Left Wanting creature **[HER · OPEN]** | Graven-Tosk **[DEP · OPEN]** | The Valley of the Unfortunate Undead **[DEP · OPEN]** |
| 10 | treasure | B | Occult Treasures **[MB-BB · ROLL]** | 10D. Loot **[RCL · ROLL]** | Armor **[MB-BB · ROLL]** | Armor Table **[RCL · ROLL]** | Corpse **[MB-BB · ROLL]** |
| 11 | loot | B | 10D. Loot **[RCL · ROLL]** | Loot — Table I **[RCL · ROLL]** | Loot — Table II **[RCL · ROLL]** | Loot the Bodies · two independent d6 rolls **[HER · ROLL]** | Loot the Bodies · two independent d6 rolls **[HER · RUN]** |
| 12 | useful item | B/U | Useful Item **[SD · ROLL]** | — | — | — | — |
| 13 | Sarkash monster | B/U | Sarkash · Regional Monsters **[DEP · GENERATE]** | Sarkash — Monsters **[DEP · ROLL]** | Eat Prey Kill · Sarkash **[FER · ROLL]** | Sarkash **[DEP · OPEN]** | Carrion Owls **[FER · OPEN]** |
| 14 | Kergüs monster | B | Kergüs · Regional Monsters **[DEP · GENERATE]** | Kergüs — Monsters **[DEP · ROLL]** | Eat Prey Kill · Kergüs **[FER · ROLL]** | Fogbound Skeleton · Graves Left Wanting creature **[HER · OPEN]** | Kergüs **[DEP · OPEN]** |
| 15 | Graven-Tosk | B | Graven-Tosk **[DEP · OPEN]** | Graven-Tosk · Regional Monsters **[DEP · GENERATE]** | Eat Prey Kill · Graven-Tosk **[FER · ROLL]** | Graven-Tosk — Discovery **[DEP · ROLL]** | Graven-Tosk — Feature **[DEP · ROLL]** |
| 16 | room | B | Dungeon Room Descriptors — Room Contents **[SD · ROLL]** | Dungeon Room Descriptors — Room Exits **[SD · ROLL]** | Room · Adjective + Type **[SD · ROLL]** | Room Contents **[RCL · ROLL]** | Room Dressing **[RCL · ROLL]** |
| 17 | NPC | B/U | NPC **[MB-BB · GENERATE]** | Bergen Chrypt — NPC Professions **[DEP · ROLL]** | Graven-Tosk — NPC Professions **[DEP · ROLL]** | Kergüs — NPC Professions **[DEP · ROLL]** | Lake Onda — NPC Professions **[DEP · ROLL]** |
| 18 | travel | B/U | SD Travel Day · 하루 여행 순서 **[SD · OPEN]** | Depths Travel · 헥스와 지역 조우 **[DEP · OPEN]** | RCL Travel the Road · 길 이동 **[RCL · OPEN]** | Roads to Damnation · 길과 여행 **[FER · OPEN]** | Travel-Cost Hazards **[RCL · ROLL]** |
| 19 | Powers | B/T/U | Powers **[MGE2 · ROLL]** | Powers **[RCL · ROLL]** | Fletcher — Powers **[MB-F · ROLL]** | Omens / Powers · 징조와 권능 **[MB-BB · OPEN]** | Powers · Meaning pair **[MGE2 · RUN]** |
| 20 | scrolls | B | Sacred Scrolls **[MB-BB · ROLL]** | Unclean Scrolls **[MB-BB · ROLL]** | — | — | — |
| 21 | equipment | B | Gear & Equipment List **[RCL · ROLL]** | Starting Equipment — Container **[MB-BB · ROLL]** | Starting Equipment — First d12 Table **[MB-BB · ROLL]** | Starting Equipment — Second d12 Table **[MB-BB · ROLL]** | — |
| 22 | weapons | B/U | Weapons **[MB-BB · ROLL]** | Weapons Table **[RCL · ROLL]** | NPC Encounter 55 — Fence Weapon **[AitC · ROLL]** | — | — |
| 23 | shield | B/U | Armor / Shield · 방어구와 방패 **[MB-BB · OPEN]** | — | — | — | — |
| 24 | initiative | B/U | Initiative **[MB-BB · ROLL]** | — | — | — | — |
| 25 | attack | B | Blood Eagle — Attack / Capture **[HER · ROLL]** | NPC Encounter 14 — Cursed Toy **[AitC · ROLL]** | NPC Encounter 56 — Poet **[AitC · ROLL]** | — | — |
| 26 | defense | B | — | — | — | — | — |
| 27 | damage | B | Beasts — Damage Table **[RCL · ROLL]** | NPC Encounters — Default Damage **[AitC · ROLL]** | NPC Encounters **[AitC · ROLL]** | — | — |
| 28 | critical | B | — | — | — | — | — |
| 29 | fumble | B | Crit / Fumble · 전투의 20과 1 **[MB-BB · OPEN]** | Using Powers · 권능 사용 판정 **[MB-BB · OPEN]** | — | — | — |
| 30 | flee | B | SD Flee · 전투 이탈 **[SD · OPEN]** | — | — | — | — |
| 31 | pursuit | B | — | — | — | — | — |
| 32 | surprise | B | — | — | — | — | — |
| 33 | infection | B | — | — | — | — | — |
| 34 | carrying | B/U | Carrying Capacity · 운반과 과적 **[MB-BB · OPEN]** | — | — | — | — |
| 35 | water | B | Water Landmarks **[RCL · ROLL]** | — | — | — | — |
| 36 | food | B | NPC Encounter 24 — Beggar **[AitC · ROLL]** | — | — | — | — |
| 37 | silver | B | — | — | — | — | — |
| 38 | advancement | B | — | — | — | — | — |
| 39 | daemon of capillaries | B | — | — | — | — | — |
| 40 | Fanged Deserter | B/U | Fanged Deserter — Earliest Memories **[MB-BB · ROLL]** | Fanged Deserter — You Also Begin With **[MB-BB · ROLL]** | — | — | — |
| 41 | Prowler | B/U | Prowler · Outcast **[MB-BB · OPEN]** | — | — | — | — |
| 42 | Heavy Armor | B/U | — | — | — | — | — |
| 43 | Lantern | B/U | — | — | — | — | — |
| 44 | Rope | B | — | — | — | — | — |
| 45 | Fireball | B | — | — | — | — | — |
| 46 | 죽음 | B | Broken / Death · 무력화와 죽음 **[MB-BB · OPEN]** | — | — | — | — |
| 47 | 0 HP | B | Broken / Death · 무력화와 죽음 **[MB-BB · OPEN]** | — | — | — | — |
| 48 | 피 0 | B | — | — | — | — | — |
| 49 | 부상 | B | — | — | — | — | — |
| 50 | 갑옷 | B | Crit / Fumble · 전투의 20과 1 **[MB-BB · OPEN]** | — | — | — | — |
| 51 | 방어 | B | Core Combat · 선공과 공격·방어 **[MB-BB · OPEN]** | Armor / Shield · 방어구와 방패 **[MB-BB · OPEN]** | Crit / Fumble · 전투의 20과 1 **[MB-BB · OPEN]** | RCL Combat · 전투장 참조 **[RCL · OPEN]** | SD Flee · 전투 이탈 **[SD · OPEN]** |
| 52 | 도망 | B | — | — | — | — | — |
| 53 | 도주 | B | Morale **[MB-BB · OPEN]** | — | — | — | — |
| 54 | 기습 | B | RCL Combat · 전투장 참조 **[RCL · OPEN]** | — | — | — | — |
| 55 | 휴식 | B | Rest · 휴식 **[MB-BB · OPEN]** | Depths Time / Noise · 시간 지체와 소음 **[DEP · OPEN]** | SD Camping · 숨 돌리기와 야영 **[SD · OPEN]** | — | — |
| 56 | 회복 | B | Omens / Powers · 징조와 권능 **[MB-BB · OPEN]** | Rest · 휴식 **[MB-BB · OPEN]** | SD Camping · 숨 돌리기와 야영 **[SD · OPEN]** | — | — |
| 57 | 치료 | B | — | — | — | — | — |
| 58 | 마법 | B | — | — | — | — | — |
| 59 | 스크롤 | B | — | — | — | — | — |
| 60 | 짐 | B | — | — | — | — | — |
| 61 | 인벤토리 | B | — | — | — | — | — |
| 62 | 식량 | B | Eat Prey Kill · 사냥 판정과 식량 **[FER · OPEN]** | SD Camping · 숨 돌리기와 야영 **[SD · OPEN]** | — | — | — |
| 63 | 사기 | B | Morale **[MB-BB · OPEN]** | The Monster Approaches **[FER · OPEN]** | The Monster Approaches · 몬스터 생성 **[FER · ROLL]** | — | — |
| 64 | 반응 | B | Depths Encountering Enemies · 적에게 들켰는가 **[DEP · OPEN]** | Depths Travel · 헥스와 지역 조우 **[DEP · OPEN]** | NPC **[MB-BB · GENERATE]** | Morale **[MB-BB · OPEN]** | — |
| 65 | 시체 | B | The Valley of the Unfortunate Undead **[DEP · OPEN]** | — | — | — | — |
| 66 | 보물 | B | — | — | — | — | — |
| 67 | 전리품 | B | — | — | — | — | — |
| 68 | 내 HP가 0 | B | — | — | — | — | — |
| 69 | 갑옷 얼마나 막아 | B | — | — | — | — | — |
| 70 | 마법 실패 | B | — | — | — | — | — |
| 71 | 휴식 회복 | B | Rest · 휴식 **[MB-BB · OPEN]** | SD Camping · 숨 돌리기와 야영 **[SD · OPEN]** | — | — | — |
| 72 | 짐 얼마나 | B | — | — | — | — | — |
| 73 | 몬스터 도망 | B | — | — | — | — | — |
| 74 | NPC 반응 | B | NPC **[MB-BB · GENERATE]** | Depths Travel · 헥스와 지역 조우 **[DEP · OPEN]** | Morale **[MB-BB · OPEN]** | — | — |
| 75 | I reached 0 HP | B | — | — | — | — | — |
| 76 | power failure | B | — | — | — | — | — |
| 77 | armor broken | B | — | — | — | — | — |
| 78 | 갑옷 깨짐 | B | — | — | — | — | — |
| 79 | unarmed | B/U | — | — | — | — | — |
| 80 | dual wield | B | — | — | — | — | — |
| 81 | 방패 | B | Armor / Shield · 방어구와 방패 **[MB-BB · OPEN]** | — | — | — | — |
| 82 | 질병 | B | — | — | — | — | — |
| 83 | 중독 | B | — | — | — | — | — |
| 84 | thirst | B | — | — | — | — | — |
| 85 | prayer | B | Fanatic — Prayer of the Day **[RCL · ROLL]** | — | — | — | — |
| 86 | directions | B | Get Directions — Weak Hit Reaction **[AitC · ROLL]** | — | — | — | — |
| 87 | stash | B/U | Stash Item — Weak Hit **[AitC · ROLL]** | — | — | — | — |
| 88 | city crawl | B/U | City Crawl — Failure **[AitC · ROLL]** | City **[AitC · OPEN]** | City Workbench · 도시를 걷기 **[AitC · OPEN]** | — | — |
| 89 | forage | B | Spending a Day Foraging **[FER · ROLL]** | — | — | — | — |
| 90 | camp | B/U | All dream of **[FER · ROLL]** | Nightly Campsite Events **[FER · ROLL]** | SD Camping · 숨 돌리기와 야영 **[SD · OPEN]** | SD Travel Day · 하루 여행 순서 **[SD · OPEN]** | — |
| 91 | weather | B | Weather **[MB-BB · ROLL]** | Unnatural Weather **[RCL · ROLL]** | Weather Omen Signs **[RCL · ROLL]** | Weather Shift **[RCL · ROLL]** | Weather-Driven Hazards **[RCL · ROLL]** |
| 92 | road | B | Events by the Road. Roll Daily **[FER · ROLL]** | Leaving the Road, After Half a Day’s Journey, You Encounter… **[FER · ROLL]** | RCL Travel the Road · 길 이동 **[RCL · OPEN]** | SD Leaving the Road · 길을 잃는 판정 **[SD · OPEN]** | What’s the Road Like? **[FER · ROLL]** |
| 93 | day | B | Fanatic — Prayer of the Day **[RCL · ROLL]** | SD Travel Day · 하루 여행 순서 **[SD · OPEN]** | Spending a Day Foraging **[FER · ROLL]** | Leaving the Road, After Half a Day’s Journey, You Encounter… **[FER · ROLL]** | NPC Encounter 56 — Poet **[AitC · ROLL]** |
| 94 | Calendar | B | Calendar of Nechrubel · 재앙 **[MB-BB · OPEN]** | The Calendar of Nechrubel — Miseries **[MB-BB · ROLL]** | SD Travel Day · 하루 여행 순서 **[SD · OPEN]** | SD · 선택적 솔로 변형 **[SD · OPEN]** | — |
| 95 | Fate Chart | B/U | Mythic Fate Chart · 예·아니오 질문 **[MGE2 · OPEN]** | — | — | — | — |
| 96 | random event | B | Random Event Focus **[DEP · ROLL]** | Random Event Focus Table **[MGE2 · ROLL]** | Random Events — Roll Once per Hex **[FER · ROLL]** | — | — |
| 97 | meaning | B | Adventure Tone · Meaning pair **[MGE2 · RUN]** | Alien Species Descriptors · Meaning pair **[MGE2 · RUN]** | Animal Actions · Meaning pair **[MGE2 · RUN]** | Army Descriptors · Meaning pair **[MGE2 · RUN]** | Cavern Descriptors · Meaning pair **[MGE2 · RUN]** |
| 98 | scene alteration | B | — | — | — | — | — |
| 99 | likelihood | B | — | — | — | — | — |
| 100 | Expected Scene | B | — | — | — | — | — |
| 101 | Altered Scene | B | Mythic Scene Test · 예상 장면 확인 **[MGE2 · OPEN]** | — | — | — | — |
| 102 | Interrupt Scene | B | Mythic Scene Test · 예상 장면 확인 **[MGE2 · OPEN]** | — | — | — | — |
| 103 | Chaos Factor | B | Mythic Fate Chart · 예·아니오 질문 **[MGE2 · OPEN]** | Mythic Scene Test · 예상 장면 확인 **[MGE2 · OPEN]** | — | — | — |
| 104 | Event Focus | B | Prepared Adventure Event Focus Table **[MGE2 · ROLL]** | Random Event Focus **[DEP · ROLL]** | Random Event Focus Table **[MGE2 · ROLL]** | — | — |
| 105 | Action + Theme | B/U | Action + Theme **[RCL · RUN]** | — | — | — | — |
| 106 | Description | B | NPC Description · 인물의 단서 **[SD · OPEN]** | Broken Bodies **[MB-BB · ROLL]** | Clothing Detail **[RCL · ROLL]** | Color **[RCL · ROLL]** | Descriptor **[MGE2 · ROLL]** |
| 107 | descriptor | B | Descriptor **[MGE2 · ROLL]** | Descriptor Oracle **[RCL · ROLL]** | Notable Artefacts — Depicting Descriptor **[AitC · ROLL]** | Settlement — Size, Name and Descriptor **[AitC · RUN]** | Settlement Descriptor **[AitC · ROLL]** |
| 108 | NPC motivation | B | NPC Motivation **[RCL · ROLL]** | NPC **[MB-BB · GENERATE]** | Character Motivations **[MGE2 · ROLL]** | Character Motivations · Meaning pair **[MGE2 · RUN]** | — |
| 109 | Gutterborn Scum | B | Gutterborn Scum — Bad Birth **[MB-BB · ROLL]** | Gutterborn Scum — Specialty **[MB-BB · ROLL]** | — | — | — |
| 110 | Esoteric Hermit | B | Esoteric Hermit — Eldritch Origins **[MB-BB · ROLL]** | Esoteric Hermit — You Also Begin With **[MB-BB · ROLL]** | — | — | — |
| 111 | Wretched Royalty | B | Wretched Royalty — Things Were Going So Well, Until... **[MB-BB · ROLL]** | Wretched Royalty — You Begin With Two **[MB-BB · ROLL]** | — | — | — |
| 112 | Heretical Priest | B | Heretical Priest — You Begin With One **[MB-BB · ROLL]** | Heretical Priest — Unholy Origins **[MB-BB · OPEN]** | — | — | — |
| 113 | Occult Herbmaster | B | Occult Herbmaster — Probably Raised In **[MB-BB · ROLL]** | Occult Herbmaster Decoctions **[MB-BB · ROLL]** | — | — | — |
| 114 | Cursed Skinwalker | B/S | Cursed Skinwalker — Creature Shapes **[FER · ROLL]** | Cursed Skinwalker — First Died **[FER · ROLL]** | — | — | — |
| 115 | Pale One | B/S | Pale one · Outcast **[MB-BB · OPEN]** | Pale One — Unspoken Origins **[FER · ROLL]** | Pale One — You Call Yourself — First Column **[FER · ROLL]** | Pale One — You Call Yourself — Second Column **[FER · ROLL]** | Pale One — You Call Yourself — Third Column **[FER · ROLL]** |
| 116 | Dead God’s Prophet | B/S | Dead God’s Prophet — Two Gifts **[FER · ROLL]** | — | — | — | — |
| 117 | Forlorn Philosopher | B/S | Forlorn Philosopher — The Roots of Your Dejection? **[FER · ROLL]** | Forlorn Philosopher — You Begin With One **[FER · OPEN]** | — | — | — |
| 118 | Sacrilegious Songbird | B/S | Sacrilegious Songbird — A Deal Was Struck **[HER · ROLL]** | Sacrilegious Songbird — Accursed Instruments **[HER · OPEN]** | — | — | — |
| 119 | Shedding Vicar | B/S | Shedding Vicar — Your First Peel: What and Why? **[HER · ROLL]** | Shedding Vicar — Your First Peel: Who? **[HER · ROLL]** | Shedding Vicar — Blessings **[HER · OPEN]** | — | — |
| 120 | Palms Open the Southern Gate | B | — | — | — | — | — |
| 121 | Tongue of Eris | B | — | — | — | — | — |
| 122 | Te-le-kin-esis | B | — | — | — | — | — |
| 123 | Lucy-Fires Levitation | B | — | — | — | — | — |
| 124 | Daemon of Capillaries | B/U | — | — | — | — | — |
| 125 | Nine Violet Signs Unknot the Storm | B | — | — | — | — | — |
| 126 | Metzhuotl Blind Your Eye | B | — | — | — | — | — |
| 127 | Foul Psychompomp | B | Foul Psychompomp — Summon **[MB-BB · ROLL]** | — | — | — | — |
| 128 | Eyelid Blinds the Mind | B | — | — | — | — | — |
| 129 | Death | B | Broken / Death · 무력화와 죽음 **[MB-BB · OPEN]** | Hirelings — Death and Desertion **[RCL · ROLL]** | — | — | — |
| 130 | Grace of a Dead Saint | B | — | — | — | — | — |
| 131 | Grace for a Sinner | B | — | — | — | — | — |
| 132 | Whispers Pass the Gate | B | — | — | — | — | — |
| 133 | Aegis of Sorrow | B | — | — | — | — | — |
| 134 | Unmet Fate | B | — | — | — | — | — |
| 135 | Bestial Speech | B | — | — | — | — | — |
| 136 | False Dawn/Night’s Chariot | B | — | — | — | — | — |
| 137 | Hermetic Step | B | — | — | — | — | — |
| 138 | Roskoe’s Consuming Glare | B | — | — | — | — | — |
| 139 | Enochian Syntax | B | — | — | — | — | — |
| 140 | Scattered individuals | B | — | — | — | — | — |
| 141 | Tiny cell | B | — | — | — | — | — |
| 142 | Street gang | B | — | — | — | — | — |
| 143 | Local cult | B | — | — | — | — | — |
| 144 | Hidden coven | B | — | — | — | — | — |
| 145 | Guard squad | B | — | — | — | — | — |
| 146 | Criminal circle | B | — | — | — | — | — |
| 147 | Caravan band | B | — | — | — | — | — |
| 148 | Town militia | B | — | — | — | — | — |
| 149 | Merchant guild | B | — | — | — | — | — |
| 150 | Witch conclave | B | — | — | — | — | — |
| 151 | Trained assassins | B | — | — | — | — | — |
| 152 | Established cult | B | — | — | — | — | — |
| 153 | Regional cabal | B | — | — | — | — | — |
| 154 | City-wide organization | B | — | — | — | — | — |
| 155 | Militant order | B | — | — | — | — | — |
| 156 | Elite warrior force | B | — | — | — | — | — |
| 157 | Rulers of a district | B | — | — | — | — | — |
| 158 | Nation-spanning influence | B | — | — | — | — | — |
| 159 | Apocalyptic organization | B | — | — | — | — | — |
| 160 | Absorb | B | — | — | — | — | — |
| 161 | Adversity | B | — | — | — | — | — |
| 162 | Alter | B | Common Encounters · 일반 조우 준비 **[SD · OPEN]** | Encounter Prep **[SD · OPEN]** | Mythic Scene Test · 예상 장면 확인 **[MGE2 · OPEN]** | Settlement Name **[AitC · RUN]** | — |
| 163 | Animate | B | — | — | — | — | — |
| 164 | Assist | B | — | — | — | — | — |
| 165 | Attach | B | Businesses **[AitC · ROLL]** | — | — | — | — |
| 166 | Attack | B | Blood Eagle — Attack / Capture **[HER · ROLL]** | NPC Encounter 14 — Cursed Toy **[AitC · ROLL]** | NPC Encounter 56 — Poet **[AitC · ROLL]** | — | — |
| 167 | Block | B | — | — | — | — | — |
| 168 | Body | B | Body Feature **[RCL · ROLL]** | — | — | — | — |
| 169 | Change | B | — | — | — | — | — |
| 170 | Chemical | B | — | — | — | — | — |
| 171 | Cold | B | — | — | — | — | — |
| 172 | Colorful | B | — | — | — | — | — |
| 173 | Combat | B | Character Actions, Combat **[MGE2 · ROLL]** | Character Actions, Combat · Meaning pair **[MGE2 · RUN]** | Core Combat · 선공과 공격·방어 **[MB-BB · OPEN]** | Enemy Combat Modifiers **[DEP · ROLL]** | RCL Combat · 전투장 참조 **[RCL · OPEN]** |
| 174 | Combine | B | — | — | — | — | — |
| 175 | Communicate | B | — | — | — | — | — |
| 176 | Control | B | — | — | — | — | — |
| 177 | Cosmetic | B | — | — | — | — | — |
| 178 | Create | B | — | — | — | — | — |
| 179 | Creature | B | Galgenbeck · Regional Monsters **[DEP · GENERATE]** | Graven-Tosk · Regional Monsters **[DEP · GENERATE]** | Kergüs · Regional Monsters **[DEP · GENERATE]** | Sarkash · Regional Monsters **[DEP · GENERATE]** | The Valley of the Unfortunate Undead · Regional Monsters **[DEP · GENERATE]** |
| 180 | Damage | B | Beasts — Damage Table **[RCL · ROLL]** | NPC Encounters — Default Damage **[AitC · ROLL]** | NPC Encounters **[AitC · ROLL]** | — | — |
| 181 | Dark | B | — | — | — | — | — |
| 182 | Deceive | B | — | — | — | — | — |
| 183 | Defense | B | — | — | — | — | — |
| 184 | Delay | B | — | — | — | — | — |
| 185 | Destroy | B | — | — | — | — | — |
| 186 | Detect | B | Depths Encountering Enemies · 적에게 들켰는가 **[DEP · OPEN]** | — | — | — | — |
| 187 | Dimensions | B | — | — | — | — | — |
| 188 | Diminish | B | — | — | — | — | — |
| 189 | Disrupt | B | — | — | — | — | — |
| 190 | Distance | B | — | — | — | — | — |
| 191 | Dominate | B | — | — | — | — | — |
| 192 | Duplicate | B | — | — | — | — | — |
| 193 | Electricity | B | — | — | — | — | — |
| 194 | Elements | B | Adventure Tone **[MGE2 · ROLL]** | Adventure Tone · Meaning pair **[MGE2 · RUN]** | Alien Species Descriptors **[MGE2 · ROLL]** | Alien Species Descriptors · Meaning pair **[MGE2 · RUN]** | Animal Actions **[MGE2 · ROLL]** |
| 195 | Emission | B | — | — | — | — | — |
| 196 | Emotion | B | — | — | — | — | — |
| 197 | Enemies | B | Depths Encountering Enemies · 적에게 들켰는가 **[DEP · OPEN]** | — | — | — | — |
| 198 | Energy | B | — | — | — | — | — |
| 199 | Enhance | B | — | — | — | — | — |
| 200 | Environment | B | — | — | — | — | — |
| 201 | Explosion | B | — | — | — | — | — |
| 202 | Extra | B | — | — | — | — | — |
| 203 | Fire | B | — | — | — | — | — |
| 204 | Flight | B | — | — | — | — | — |
| 205 | Free | B | — | — | — | — | — |
| 206 | Friend | B | NPC Encounter 53 — Demonologist’s Imp **[AitC · ROLL]** | NPC Encounters **[AitC · ROLL]** | — | — | — |
| 207 | Harm | B | — | — | — | — | — |
| 208 | Heal | B | — | — | — | — | — |
| 209 | Heat | B | — | — | — | — | — |
| 210 | Help | B | Possible Help **[RCL · ROLL]** | You Are Cursed — They Say One Can Help You. Who? **[HER · ROLL]** | — | — | — |
| 211 | Hide | B | — | — | — | — | — |
| 212 | Illusion | B | — | — | — | — | — |
| 213 | Imbue | B | — | — | — | — | — |
| 214 | Immunity | B | — | — | — | — | — |
| 215 | Increase | B | — | — | — | — | — |
| 216 | Information | B | — | — | — | — | — |
| 217 | Life | B | — | — | — | — | — |
| 218 | Light | B | Light & Visibility **[RCL · ROLL]** | Street Generation — Light Level **[RCL · ROLL]** | — | — | — |
| 219 | Limb | B | — | — | — | — | — |
| 220 | Limited | B | — | — | — | — | — |
| 221 | Location | B | Activity Inside **[RCL · ROLL]** | Ah, I See, You Lack Funds. (2s) **[FER · ROLL]** | Bergen Chrypt — Discovery **[DEP · ROLL]** | Bergen Chrypt — Feature **[DEP · ROLL]** | Bergen Chrypt — Trait **[DEP · ROLL]** |
| 222 | Magic | B | Magic Item Descriptors **[MGE2 · ROLL]** | Magic Item Descriptors · Meaning pair **[MGE2 · RUN]** | — | — | — |
| 223 | Major | B | Major Natural Landmarks **[RCL · ROLL]** | Major Treasures **[FER · ROLL]** | — | — | — |
| 224 | Manipulate | B | — | — | — | — | — |
| 225 | Matter | B | — | — | — | — | — |
| 226 | Mental | B | — | — | — | — | — |
| 227 | Minor | B | Minor Discoveries **[RCL · ROLL]** | Minor Natural Discoveries **[RCL · ROLL]** | Minor Treasures **[FER · ROLL]** | — | — |
| 228 | Natural | B | Major Natural Landmarks **[RCL · ROLL]** | Minor Natural Discoveries **[RCL · ROLL]** | Natural Hazards **[RCL · ROLL]** | Natural Oddities **[RCL · ROLL]** | — |
| 229 | Nature | B | — | — | — | — | — |
| 230 | Object | B | Notable Object **[RCL · ROLL]** | Searching for an Object — Strong Hit **[SD · ROLL]** | Searching for an Object — Weak Hit **[SD · ROLL]** | Unexpected Events — Falling Object **[AitC · ROLL]** | Objects **[MGE2 · ROLL]** |
| 231 | Others | B | — | — | — | — | — |
| 232 | Physical | B | Physical Signs Of Trouble **[RCL · ROLL]** | — | — | — | — |
| 233 | Plants | B | — | — | — | — | — |
| 234 | Poison | B | — | — | — | — | — |
| 235 | Power | B | Faction Power Level **[RCL · ROLL]** | Defiler — Archetype Skills **[RCL · ROLL]** | Fanatic — Archetype Skills **[RCL · ROLL]** | Fletcher — Powers **[MB-F · ROLL]** | NPC Encounter 56 — Poet **[AitC · ROLL]** |
| 236 | Protect | B | — | — | — | — | — |
| 237 | Radius | B | — | — | — | — | — |
| 238 | Ranged | B | — | — | — | — | — |
| 239 | Reflect | B | — | — | — | — | — |
| 240 | Repel | B | — | — | — | — | — |
| 241 | Resistance | B | — | — | — | — | — |
| 242 | Reveal | B | Reveal a Danger **[DEP · ROLL]** | Depths Time / Noise · 시간 지체와 소음 **[DEP · OPEN]** | — | — | — |
| 243 | Self | B | — | — | — | — | — |
| 244 | Sense | B | — | — | — | — | — |
| 245 | Skill | B | Character Skills **[MGE2 · ROLL]** | Character Skills · Meaning pair **[MGE2 · RUN]** | Defiler — Archetype Skills **[RCL · ROLL]** | Fanatic — Archetype Skills **[RCL · ROLL]** | Venom — Archetype Skills **[RCL · ROLL]** |
| 246 | Spirit | B | — | — | — | — | — |
| 247 | Stealth | B | — | — | — | — | — |
| 248 | Strange | B | Strange Landmarks **[RCL · ROLL]** | Strange Meetings **[RCL · ROLL]** | Strange Omens **[RCL · ROLL]** | Graves Left Wanting — Sensory Strangeness **[HER · ROLL]** | — |
| 249 | Summon | B | Foul Psychompomp — Summon **[MB-BB · ROLL]** | — | — | — | — |
| 250 | Switch | B | — | — | — | — | — |
| 251 | Take | B | Gatherings — Contest **[AitC · ROLL]** | — | — | — | — |
| 252 | Technology | B | — | — | — | — | — |
| 253 | Time | B | Depths Time / Noise · 시간 지체와 소음 **[DEP · OPEN]** | Street Contents **[AitC · ROLL]** | — | — | — |
| 254 | Transform | B | — | — | — | — | — |
| 255 | Trap | B | Depths Traps · 함정 발견과 회피 **[DEP · OPEN]** | Dungeon Traps **[MGE2 · ROLL]** | Dungeon Traps · Meaning pair **[MGE2 · RUN]** | Regular Traps **[DEP · ROLL]** | Special Traps **[DEP · ROLL]** |
| 256 | Travel | B | SD Travel Day · 하루 여행 순서 **[SD · OPEN]** | Depths Travel · 헥스와 지역 조우 **[DEP · OPEN]** | RCL Travel the Road · 길 이동 **[RCL · OPEN]** | Roads to Damnation · 길과 여행 **[FER · OPEN]** | Travel-Cost Hazards **[RCL · ROLL]** |
| 257 | Weapon | B | NPC Encounter 55 — Fence Weapon **[AitC · ROLL]** | Weapons **[MB-BB · ROLL]** | Weapons Table **[RCL · ROLL]** | — | — |
| 258 | Weather | B/T | Weather **[MB-BB · ROLL]** | Unnatural Weather **[RCL · ROLL]** | Weather Omen Signs **[RCL · ROLL]** | Weather Shift **[RCL · ROLL]** | Weather-Driven Hazards **[RCL · ROLL]** |
| 259 | The Unknotted Bond Severs one magical or sworn oath. | B | — | — | — | — | — |
| 260 | Ich-bin-luft (unique Power) | B | — | — | — | — | — |
| 261 | DEATH MARK Mark a target. Your next attack against them crits on 18–20. | B | — | — | — | — | — |
| 262 | NERVE STRIKE Hit a pressure point. Target is paralyzed for one round. | B | — | — | — | — | — |
| 263 | TOUCH OF THE FAITHFUL Touch a creature to heal D10 HP. Once per day. | B | — | — | — | — | — |
| 264 | WALL OF FAITH Cast a wall of light that negates one attack. Once per day. | B | — | — | — | — | — |
| 265 | Three-die monster procedure and derived statistics | S | — | — | — | — | — |
| 266 | More Than Anything, It Wants To… | S/T | More Than Anything, It Wants To… **[FER · ROLL]** | — | — | — | — |
| 267 | Terrible Traits | S/T | Terrible Traits **[MB-BB · ROLL]** | Terrible Traits **[FER · ROLL]** | — | — | — |
| 268 | travel distance | S | — | — | — | — | — |
| 269 | Galgenbeck Schleswig | S | — | — | — | — | — |
| 270 | travel time | S | Depths Time / Noise · 시간 지체와 소음 **[DEP · OPEN]** | — | — | — | — |
| 271 | Daily checklist, road events and one-off event replacement | S | — | — | — | — | — |
| 272 | What’s the Road Like? | S/T | What’s the Road Like? **[FER · ROLL]** | — | — | — | — |
| 273 | Events by the Road. Roll Daily | S/T | Events by the Road. Roll Daily **[FER · ROLL]** | — | — | — | — |
| 274 | The Village Is… | S/T | The Village Is… **[FER · ROLL]** | — | — | — | — |
| 275 | Spending a Day Foraging | S/T | Spending a Day Foraging **[FER · ROLL]** | — | — | — | — |
| 276 | Leaving the Road, After Half a Day’s Journey, You Encounter… | S/T | Leaving the Road, After Half a Day’s Journey, You Encounter… **[FER · ROLL]** | — | — | — | — |
| 277 | Nightly Campsite Events | S/T | Nightly Campsite Events **[FER · ROLL]** | — | — | — | — |
| 278 | hunting | S | Hunting Mishaps **[FER · ROLL]** | Unexpected Events — Hunting Party **[AitC · ROLL]** | Eat Prey Kill · Bergen Chrypt **[FER · ROLL]** | Eat Prey Kill · Graven-Tosk **[FER · ROLL]** | Eat Prey Kill · Grift **[FER · ROLL]** |
| 279 | Eat Prey Kill | S | Eat Prey Kill · Bergen Chrypt **[FER · ROLL]** | Eat Prey Kill · Graven-Tosk **[FER · ROLL]** | Eat Prey Kill · Grift **[FER · ROLL]** | Eat Prey Kill · Kergüs **[FER · ROLL]** | Eat Prey Kill · Lake Onda **[FER · ROLL]** |
| 280 | Hunting Mishaps | S/T | Hunting Mishaps **[FER · ROLL]** | — | — | — | — |
| 281 | In the Belly of the Beast, You Find... | S/T | In the Belly of the Beast, You Find... **[FER · ROLL]** | — | — | — | — |
| 282 | Antideer | S | Antideer **[FER · OPEN]** | — | — | — | — |
| 283 | Flayed Vultures | S | Flayed Vultures **[FER · OPEN]** | — | — | — | — |
| 284 | Ratbit | S | Ratbit **[FER · OPEN]** | — | — | — | — |
| 285 | Feral Horses | S | Feral Horses **[FER · OPEN]** | — | — | — | — |
| 286 | Steppe Wolfe | S | Steppe Wolfe **[FER · OPEN]** | — | — | — | — |
| 287 | Tusked Bison | S | Tusked Bison **[FER · OPEN]** | — | — | — | — |
| 288 | Skelelk | S | Skelelk **[FER · OPEN]** | — | — | — | — |
| 289 | Dredgehog | S | Dredgehog **[FER · OPEN]** | — | — | — | — |
| 290 | Carrion Owls | S | Carrion Owls **[FER · OPEN]** | — | — | — | — |
| 291 | Throat-Cutting Warbler | S | Throat-Cutting Warbler **[FER · OPEN]** | — | — | — | — |
| 292 | Mulch-Squirrels | S | Mulch-Squirrels **[FER · OPEN]** | — | — | — | — |
| 293 | Howler Bears | S | Howler Bears **[FER · OPEN]** | — | — | — | — |
| 294 | Giant Skull Moth | S | Giant Skull Moth **[FER · OPEN]** | — | — | — | — |
| 295 | Twice-Grown Corpse Flies | S | Twice-Grown Corpse Flies **[FER · OPEN]** | — | — | — | — |
| 296 | Unbred Mutts | S | Unbred Mutts **[FER · OPEN]** | — | — | — | — |
| 297 | Grim-Toothed Squirrel | S | Grim-Toothed Squirrel **[FER · OPEN]** | — | — | — | — |
| 298 | Meatroach | S | Meatroach **[FER · OPEN]** | — | — | — | — |
| 299 | Half-Billed Raven | S | Half-Billed Raven **[FER · OPEN]** | Half-Billed Raven · Graves Left Wanting creature **[HER · OPEN]** | — | — | — |
| 300 | Uncommon Rats | S | Uncommon Rats **[FER · OPEN]** | Grift **[FER · OPEN]** | — | — | — |
| 301 | Cellar Crabs | S | Cellar Crabs **[FER · OPEN]** | Grift **[FER · OPEN]** | — | — | — |
| 302 | Nameless & Tameless Strays | S | Nameless & Tameless Strays **[FER · OPEN]** | Grift **[FER · OPEN]** | — | — | — |
| 303 | Straw-Lion | S | Straw-Lion **[FER · OPEN]** | Grift **[FER · OPEN]** | — | — | — |
| 304 | Lentil Lice | S/U | Lentil Lice **[FER · OPEN]** | Grift **[FER · OPEN]** | — | — | — |
| 305 | Múrder Gulls | S | Múrder Gulls **[FER · OPEN]** | — | — | — | — |
| 306 | Flail-Horned Muskox | S | Flail-Horned Muskox **[FER · OPEN]** | — | — | — | — |
| 307 | Tar-Pelted Goats | S | Tar-Pelted Goats **[FER · OPEN]** | — | — | — | — |
| 308 | Molar Bear | S | Molar Bear **[FER · OPEN]** | — | — | — | — |
| 309 | Megasloths | S | Megasloths **[FER · OPEN]** | — | — | — | — |
| 310 | Blubber Gulls | S | Blubber Gulls **[FER · OPEN]** | — | — | — | — |
| 311 | False Seal | S | False Seal **[FER · OPEN]** | — | — | — | — |
| 312 | Liar-Bird | S | Liar-Bird **[FER · OPEN]** | — | — | — | — |
| 313 | Three-Thirds-Pheasant | S | Three-Thirds-Pheasant **[FER · OPEN]** | — | — | — | — |
| 314 | Feather Fox | S | Feather Fox **[FER · OPEN]** | — | — | — | — |
| 315 | Bautaboar | S | Bautaboar **[FER · OPEN]** | — | — | — | — |
| 316 | Schleswig Bogfeeder | S | Schleswig Bogfeeder **[FER · OPEN]** | — | — | — | — |
| 317 | Gold-Crested Filth-Crow | S | Gold-Crested Filth-Crow **[FER · OPEN]** | — | — | — | — |
| 318 | Cursed Trout | S | Cursed Trout **[FER · OPEN]** | — | — | — | — |
| 319 | Rusty Bass | S | Rusty Bass **[FER · OPEN]** | — | — | — | — |
| 320 | Groan | S | Groan **[FER · OPEN]** | — | — | — | — |
| 321 | Carcasswan | S/U | Carcasswan **[FER · OPEN]** | — | — | — | — |
| 322 | Unresting Duck | S | Unresting Duck **[FER · OPEN]** | — | — | — | — |
| 323 | Sursturgeon | S | Sursturgeon **[FER · OPEN]** | — | — | — | — |
| 324 | Phantom Rats | S | Phantom Rats **[FER · OPEN]** | — | — | — | — |
| 325 | Grubstopper | S | Grubstopper **[FER · OPEN]** | — | — | — | — |
| 326 | Tomb Ape | S | Tomb Ape **[FER · OPEN]** | — | — | — | — |
| 327 | Gravelings | S | Gravelings **[FER · OPEN]** | — | — | — | — |
| 328 | Marrow Sparrow | S | Marrow Sparrow **[FER · OPEN]** | — | — | — | — |
| 329 | Bonemare | S | Bonemare **[FER · OPEN]** | — | — | — | — |
| 330 | Tunnel Sneak | S | Tunnel Sneak **[FER · OPEN]** | — | — | — | — |
| 331 | Nephalix Monkeys | S | Nephalix Monkeys **[FER · OPEN]** | — | — | — | — |
| 332 | Weakwill’d Whisperbird | S | Weakwill’d Whisperbird **[FER · OPEN]** | — | — | — | — |
| 333 | Vierwinged Falchon | S | Vierwinged Falchon **[FER · OPEN]** | — | — | — | — |
| 334 | Überwolf | S/U | Überwolf **[FER · OPEN]** | — | — | — | — |
| 335 | Ragpie | S | Ragpie **[FER · OPEN]** | — | — | — | — |
| 336 | Starved peasants | S | — | — | — | — | — |
| 337 | farmers | S | — | — | — | — | — |
| 338 | Regular wolf | S | — | — | — | — | — |
| 339 | Lake Onda | S | Eat Prey Kill · Lake Onda **[FER · ROLL]** | Lake Onda — Discovery **[DEP · ROLL]** | Lake Onda — Feature **[DEP · ROLL]** | Lake Onda — Monsters **[DEP · ROLL]** | Lake Onda — NPC Professions **[DEP · ROLL]** |
| 340 | Bergen Chrypt | S | Bergen Chrypt — Discovery **[DEP · ROLL]** | Bergen Chrypt — Feature **[DEP · ROLL]** | Bergen Chrypt — Monsters **[DEP · ROLL]** | Bergen Chrypt — NPC Professions **[DEP · ROLL]** | Bergen Chrypt — Trait **[DEP · ROLL]** |
| 341 | The Flowers’ Effects | S/T | The Flowers’ Effects **[FER · ROLL]** | — | — | — | — |
| 342 | Ruin Types | S/T | Ruin Types **[FER · ROLL]** | — | — | — | — |
| 343 | Minor Treasures | S/T | Minor Treasures **[FER · ROLL]** | — | — | — | — |
| 344 | Major Treasures | S/T | Major Treasures **[FER · ROLL]** | — | — | — | — |
| 345 | Searching the Ruins (15 Minutes) | S/T | Searching the Ruins (15 Minutes) **[FER · ROLL]** | — | — | — | — |
| 346 | Random Events — Roll Once per Hex | S/T | Random Events — Roll Once per Hex **[FER · ROLL]** | — | — | — | — |
| 347 | Death Ziggurat | S | — | — | — | — | — |
| 348 | Navigating the Ruins | S | — | — | — | — | — |
| 349 | Rot Priests | S | — | — | — | — | — |
| 350 | Horn Beasts | S | — | — | — | — | — |
| 351 | Undead — Death Ziggurat | S | — | — | — | — | — |
| 352 | Sarku | S | — | — | — | — | — |
| 353 | Death-obsessed Cultist | S | — | — | — | — | — |
| 354 | Dread Akünh, Demon Spawn | S | — | — | — | — | — |
| 355 | Spiral Crown | S | — | — | — | — | — |
| 356 | Rot priest medallion | S | — | — | — | — | — |
| 357 | Akünh’s separated heart and end condition | S | — | — | — | — | — |
| 358 | Items and Trinkets | S/T | Items and Trinkets **[FER · ROLL]** | — | — | — | — |
| 359 | Why Do the PCs Care About Any of This? | S/T | Why Do the PCs Care About Any of This? **[FER · ROLL]** | — | — | — | — |
| 360 | Calumny Pearl | S | — | — | — | — | — |
| 361 | Qarg | S | — | — | — | — | — |
| 362 | Nagel Krat | S | — | — | — | — | — |
| 363 | The Bastard | S | — | — | — | — | — |
| 364 | Excited cannon goblins | S | — | — | — | — | — |
| 365 | Archer goblins and bucket goblin | S | — | — | — | — | — |
| 366 | Alchemical Ooze | S | — | — | — | — | — |
| 367 | Fresh Goblins | S | — | — | — | — | — |
| 368 | Goblin Cure | S | — | — | — | — | — |
| 369 | Flash Powder | S | — | — | — | — | — |
| 370 | Healing Tincture | S | — | — | — | — | — |
| 371 | Invigorating Elixir | S | — | — | — | — | — |
| 372 | Urvan’s alchemical pain remedy | S | — | — | — | — | — |
| 373 | Cannon fuse, warning test and firing consequences | S | — | — | — | — | — |
| 374 | Oil coating and fire damage | S | — | — | — | — | — |
| 375 | Goblin Grinder activation and escalation | S | — | — | — | — | — |
| 376 | Lick the Liquid | S/T | Lick the Liquid **[FER · ROLL]** | — | — | — | — |
| 377 | Alchemy Tables | S/T | Alchemy Tables **[FER · ROLL]** | — | — | — | — |
| 378 | Alchemy-table trigger and ooze exception | S | — | — | — | — | — |
| 379 | Mercy’s Bane | S | — | — | — | — | — |
| 380 | Tenebrous Reliquary | S | The Tenebrous Reliquary — Items of Doom **[FER · ROLL]** | — | — | — | — |
| 381 | Opium Hook | S | — | — | — | — | — |
| 382 | Plasmatic Idol | S | — | — | — | — | — |
| 383 | Ripper’s Blade | S | — | — | — | — | — |
| 384 | Roses of Winter | S | — | — | — | — | — |
| 385 | Spine of God | S | — | — | — | — | — |
| 386 | Snort Dagger | S | — | — | — | — | — |
| 387 | Stone Magnet | S | — | — | — | — | — |
| 388 | Tentacles of Zen | S | — | — | — | — | — |
| 389 | Tyrant's Tongue | S | — | — | — | — | — |
| 390 | Veil of Blood | S | — | — | — | — | — |
| 391 | Voodoo Fire | S | — | — | — | — | — |
| 392 | Volt Thrower | S | — | — | — | — | — |
| 393 | The War Starter | S | — | — | — | — | — |
| 394 | Zodiac Lung | S | — | — | — | — | — |
| 395 | Cup of Peace | S | — | — | — | — | — |
| 396 | Dust of Paradise | S | — | — | — | — | — |
| 397 | Ebony Tears | S | — | — | — | — | — |
| 398 | Eye of Horus | S | — | — | — | — | — |
| 399 | Finger Paintings of the Insane | S | — | — | — | — | — |
| 400 | Flower of Disease | S | — | — | — | — | — |
| 401 | Foehammer | S | — | — | — | — | — |
| 402 | Cauldron of Lies | S | — | — | — | — | — |
| 403 | Cursed Tongue of the Naga | S | — | — | — | — | — |
| 404 | Chaos Blade | S | — | — | — | — | — |
| 405 | Chains of Death | S | — | — | — | — | — |
| 406 | Claw of the Sloth | S | — | — | — | — | — |
| 407 | Blood of the Serpents | S | — | — | — | — | — |
| 408 | Crown of Burning Stars | S | — | — | — | — | — |
| 409 | Book of Oblivion | S | — | — | — | — | — |
| 410 | Antlers of Lightning | S | — | — | — | — | — |
| 411 | Eyes and Teeth | S | — | — | — | — | — |
| 412 | Black Candles | S | — | — | — | — | — |
| 413 | Robe of Bones | S | — | — | — | — | — |
| 414 | Ash of the Mind | S | — | — | — | — | — |
| 415 | Bowels of a Baby Killer | S | — | — | — | — | — |
| 416 | Would You Prefer the Select Menu? (4s) | S/T | Would You Prefer the Select Menu? (4s) **[FER · ROLL]** | — | — | — | — |
| 417 | Ah, I See, You Lack Funds. (2s) | S/T | Ah, I See, You Lack Funds. (2s) **[FER · ROLL]** | — | — | — | — |
| 418 | Why Is the Innkeeper Twitching? | S/T | Why Is the Innkeeper Twitching? **[FER · ROLL]** | — | — | — | — |
| 419 | Patron Traits | S/T | Patron Traits **[FER · ROLL]** | — | — | — | — |
| 420 | Even More Lost Souls | S/T | Even More Lost Souls **[FER · ROLL]** | — | — | — | — |
| 421 | Three Dead Skulls | S | Three Dead Skulls · Grey Galth Inn 도박 **[FER · OPEN]** | — | — | — | — |
| 422 | gambling | S | — | — | — | — | — |
| 423 | Gambling Dreg | S | — | — | — | — | — |
| 424 | Hardy Tame Rat | S | — | — | — | — | — |
| 425 | Cursed Skinwalker — First Died | S/T | Cursed Skinwalker — First Died **[FER · ROLL]** | — | — | — | — |
| 426 | Cursed Skinwalker — Creature Shapes | S/T | Cursed Skinwalker — Creature Shapes **[FER · ROLL]** | — | — | — | — |
| 427 | Pale One — Unspoken Origins | S/T | Pale One — Unspoken Origins **[FER · ROLL]** | — | — | — | — |
| 428 | Pale One Blessings | S/T | Pale One Blessings **[FER · ROLL]** | — | — | — | — |
| 429 | Dead God’s Prophet — Two Gifts | S/T | Dead God’s Prophet — Two Gifts **[FER · ROLL]** | — | — | — | — |
| 430 | Forlorn Philosopher — The Roots of Your Dejection? | S/T | Forlorn Philosopher — The Roots of Your Dejection? **[FER · ROLL]** | — | — | — | — |
| 431 | The Dejection of Your Roots | S/T | The Dejection of Your Roots **[FER · ROLL]** | Forlorn Philosopher — The Roots of Your Dejection? **[FER · ROLL]** | — | — | — |
| 432 | Forlorn Philosopher — You Begin With One | S/T | Forlorn Philosopher — You Begin With One **[FER · OPEN]** | — | — | — | — |
| 433 | Pale One name: three independent d20 columns | S | — | — | — | — | — |
| 434 | Dead god name: three independent d10 columns | S | — | — | — | — | — |
| 435 | Dream Theory | S | — | — | — | — | — |
| 436 | Ochre Tablets | S | The Tablets of Ochre Obscurity **[FER · OPEN]** | — | — | — | — |
| 437 | Total Matter Comprehension | S | — | — | — | — | — |
| 438 | Ping the Shared Subconscious | S | — | — | — | — | — |
| 439 | Logical Prognostication | S | — | — | — | — | — |
| 440 | Carno-Organic Speleophagy | S | — | — | — | — | — |
| 441 | Time-Locked Pneumotoxin | S | — | — | — | — | — |
| 442 | Induced Irrelevance | S | — | — | — | — | — |
| 443 | Structural Cryo-condensation (Freezing Moon) | S | — | — | — | — | — |
| 444 | Meta-Alchemy | S | — | — | — | — | — |
| 445 | Memetic Cognitive Palpitation | S | — | — | — | — | — |
| 446 | tablet casting | S | — | — | — | — | — |
| 447 | The Black Salt Wind — Wind Strength | S/T | The Black Salt Wind — Wind Strength **[FER · ROLL]** | — | — | — | — |
| 448 | The Salt-Suffering — Consequences of a Failed Test | S/T | The Salt-Suffering — Consequences of a Failed Test **[FER · ROLL]** | — | — | — | — |
| 449 | Black Salt | S | The Black Salt Wind — Wind Strength **[FER · ROLL]** | — | — | — | — |
| 450 | Salt-Suffering | S | The Salt-Suffering — Consequences of a Failed Test **[FER · ROLL]** | — | — | — | — |
| 451 | Seeds of a Cvlt — Its Name: First Column | S/T | Seeds of a Cvlt — Its Name: First Column **[HER · ROLL]** | — | — | — | — |
| 452 | Seeds of a Cvlt — Its Name: Second Column | S/T | Seeds of a Cvlt — Its Name: Second Column **[HER · ROLL]** | — | — | — | — |
| 453 | Seeds of a Cvlt — Key Member: First Column | S/T | Seeds of a Cvlt — Key Member: First Column **[HER · ROLL]** | — | — | — | — |
| 454 | Seeds of a Cvlt — Key Member: Second Column | S/T | Seeds of a Cvlt — Key Member: Second Column **[HER · ROLL]** | — | — | — | — |
| 455 | Seeds of a Cvlt — Key Member: Third Column | S/T | Seeds of a Cvlt — Key Member: Third Column **[HER · ROLL]** | — | — | — | — |
| 456 | Seeds of a Cvlt — The Cult Is… | S/T | Seeds of a Cvlt — The Cult Is… **[HER · ROLL]** | — | — | — | — |
| 457 | Seeds of a Cvlt — Headquarters | S/T | Seeds of a Cvlt — Headquarters **[HER · ROLL]** | — | — | — | — |
| 458 | Seeds of a Cvlt — In Order to Reach the Shimmering Fields, One Must… | S/T | Seeds of a Cvlt — In Order to Reach the Shimmering Fields, One Must… **[HER · ROLL]** | — | — | — | — |
| 459 | Seeds of a Cvlt — They Truly Hate… | S/T | Seeds of a Cvlt — They Truly Hate… **[HER · ROLL]** | — | — | — | — |
| 460 | Two-column name and three-column member procedure | S | — | — | — | — | — |
| 461 | Unheroic Feats | S/T | Unheroic Feats **[HER · ROLL]** | HER Unheroic Feats · 재주 획득 조건 **[HER · OPEN]** | — | — | — |
| 462 | Optional advancement and feat acquisition | S | — | — | — | — | — |
| 463 | Party Chef | S | — | — | — | — | — |
| 464 | Outback Survivalist | S | — | — | — | — | — |
| 465 | Bloodied Knuckles | S | — | — | — | — | — |
| 466 | Sacrilegious Songbird — A Deal Was Struck | S/T | Sacrilegious Songbird — A Deal Was Struck **[HER · ROLL]** | — | — | — | — |
| 467 | Sacrilegious Songbird — Accursed Instruments | S/T | Sacrilegious Songbird — Accursed Instruments **[HER · OPEN]** | — | — | — | — |
| 468 | Spinal Husk — Drum Effect | S/T | Spinal Husk — Drum Effect **[HER · OPEN]** | — | — | — | — |
| 469 | Shedding Vicar — Your First Peel: Who? | S/T | Shedding Vicar — Your First Peel: Who? **[HER · ROLL]** | — | — | — | — |
| 470 | Shedding Vicar — Your First Peel: What and Why? | S/T | Shedding Vicar — Your First Peel: What and Why? **[HER · ROLL]** | — | — | — | — |
| 471 | Shedding Vicar — Blessings | S/T | Shedding Vicar — Blessings **[HER · OPEN]** | — | — | — | — |
| 472 | Blood Eagle — Attack / Capture | S/T | Blood Eagle — Attack / Capture **[HER · ROLL]** | — | — | — | — |
| 473 | Graves Left Wanting — Random Encounter | S/T | Graves Left Wanting — Random Encounter **[HER · ROLL]** | — | — | — | — |
| 474 | Graves Left Wanting — Sensory Strangeness | S/T | Graves Left Wanting — Sensory Strangeness **[HER · ROLL]** | — | — | — | — |
| 475 | Graves Left Wanting — Walking the Trails… | S/T | Graves Left Wanting — Walking the Trails… **[HER · ROLL]** | — | — | — | — |
| 476 | Graves Left Wanting — Loot the Bodies | S/T | Loot the Bodies · two independent d6 rolls **[HER · ROLL]** | Loot the Bodies · two independent d6 rolls **[HER · RUN]** | — | — | — |
| 477 | Graves Left Wanting — Open an Urn | S/T | Graves Left Wanting — Open an Urn **[HER · ROLL]** | — | — | — | — |
| 478 | Graves Left Wanting — Strongbox, Unlocked by Unkey | S/T | Graves Left Wanting — Strongbox, Unlocked by Unkey **[HER · ROLL]** | — | — | — | — |
| 479 | Graves Left Wanting — What You Know About Graven-Tosk | S/T | Graves Left Wanting — What You Know About Graven-Tosk **[HER · ROLL]** | — | — | — | — |
| 480 | 15-minute travel, encounter and fourth-location exit rule | S | — | — | — | — | — |
| 481 | Encounter result → named creature stat block | S | — | — | — | — | — |
| 482 | The Bone Bowyer | S | The Bone Bowyer · Fey **[HER · OPEN]** | — | — | — | — |
| 483 | Borg Bitor | S | Borg Bitor · Centipedal arthropod **[HER · OPEN]** | — | — | — | — |
| 484 | Rotten Nurse | S/U | — | — | — | — | — |
| 485 | Rotted Skeleton | S | Rotted Skeleton · Graves Left Wanting creature **[HER · OPEN]** | — | — | — | — |
| 486 | Widow-Wraith | S | Widow-Wraith · Graves Left Wanting creature **[HER · OPEN]** | — | — | — | — |
| 487 | Unbred Mutt | S | Unbred Mutt · Graves Left Wanting creature **[HER · OPEN]** | Unbred Mutts **[FER · OPEN]** | — | — | — |
| 488 | Hungry Zombie | S | Hungry Zombie · Graves Left Wanting creature **[HER · OPEN]** | — | — | — | — |
| 489 | Fogbound Skeleton | S | Fogbound Skeleton · Graves Left Wanting creature **[HER · OPEN]** | — | — | — | — |
| 490 | Twice-Grown Corpse Fly | S | Twice-Grown Corpse Fly · Graves Left Wanting creature **[HER · OPEN]** | — | — | — | — |
| 491 | The Übertaker | S | The Übertaker · Graves Left Wanting creature **[HER · OPEN]** | Graves Left Wanting — The Übertaker: Random Action **[HER · ROLL]** | — | — | — |
| 492 | Ratbadger | S | Ratbadger · Bloat creature **[HER · OPEN]** | — | — | — | — |
| 493 | Fleshy Automaton | S | Fleshy Automaton · Ceramic bile-filled golem **[HER · OPEN]** | — | — | — | — |
| 494 | Silas | S | Silas · The Fattened King **[HER · OPEN]** | — | — | — | — |
| 495 | Toothless Hag | S | Toothless Hag · Nurse the Rot creature **[HER · OPEN]** | — | — | — | — |
| 496 | Old, Dormant Sludger | S | Old, Dormant Sludger · Nurse the Rot creature **[HER · OPEN]** | — | — | — | — |
| 497 | Weak Kôbôlth | S | Weak Kôbôlth · Nurse the Rot creature **[HER · OPEN]** | — | — | — | — |
| 498 | Mikhael | S | — | — | — | — | — |
| 499 | The Roach Herder | S | — | — | — | — | — |
| 500 | Stein | S/U | — | — | — | — | — |
| 501 | Benzen | S/U | — | — | — | — | — |
| 502 | Arga | S/U | — | — | — | — | — |
| 503 | Opening Erhard’s sarcophagus | S | — | — | — | — | — |
| 504 | Maus’ acid pools | S | — | — | — | — | — |
| 505 | Origin Fountain crossing and aging | S | — | — | — | — | — |
| 506 | Shadow King’s Sewer currents | S | — | — | — | — | — |
| 507 | The Skeleton Unkey | S | — | — | — | — | — |
| 508 | The Roseate Baritona / Corrupted Horn of Roses | S | — | — | — | — | — |
| 509 | Nostalgia Gruel | S | — | — | — | — | — |
| 510 | Behold the Power | S | — | — | — | — | — |
| 511 | Animated waste | S | — | — | — | — | — |
| 512 | The Gourmand’s Cutlery | S | — | — | — | — | — |
| 513 | Tongue-shaped knife | S | — | — | — | — | — |
| 514 | Moldy-curtain tripwire | S | — | — | — | — | — |
| 515 | Chapel of Filth statue compulsion | S | — | — | — | — | — |
| 516 | You Are Cursed — What Now? | S/T | You Are Cursed — What Now? **[HER · ROLL]** | — | — | — | — |
| 517 | You Are Cursed — They Say One Can Help You. Who? | S/T | You Are Cursed — They Say One Can Help You. Who? **[HER · ROLL]** | — | — | — | — |
| 518 | You Are Cursed — What Is the Price for This Knowledge? | S/T | You Are Cursed — What Is the Price for This Knowledge? **[HER · ROLL]** | — | — | — | — |
| 519 | So How Do I Get Rid of This? | S/T | So How Do I Get Rid of This? **[HER · OPEN]** | — | — | — | — |
| 520 | The Merchant — Cost of a Portion of Your Soul | S/T | The Merchant — Cost of a Portion of Your Soul **[HER · ROLL]** | — | — | — | — |
| 521 | Merchant | S | The Merchant — Cost of a Portion of Your Soul **[HER · ROLL]** | The Merchant — Grift Stock **[HER · ROLL]** | The Merchant — Kergüs Stock **[HER · ROLL]** | The Merchant — Tveland Stock **[HER · ROLL]** | The Merchant — Wästland Stock **[HER · ROLL]** |
| 522 | soul price | S | — | — | — | — | — |
| 523 | Stone Dagger | S | — | — | — | — | — |
| 524 | Merchant tveland | S | The Merchant — Tveland Stock **[HER · ROLL]** | — | — | — | — |
| 525 | Tongue of a False Prophet | S | — | — | — | — | — |
| 526 | Two-headed Silver Ring | S | — | — | — | — | — |
| 527 | Vial of Goblin Ichor | S | — | — | — | — | — |
| 528 | Wickhead Brain | S | — | — | — | — | — |
| 529 | Galgenbeck Deathmask | S | — | — | — | — | — |
| 530 | Pouch of Valley Vapors | S | — | — | — | — | — |
| 531 | Merchant wastland | S | The Merchant — Wästland Stock **[HER · ROLL]** | — | — | — | — |
| 532 | Jar of Troll Piss | S | — | — | — | — | — |
| 533 | Fine but Gaudy Clothing | S | — | — | — | — | — |
| 534 | Pilgrim’s Compass | S | — | — | — | — | — |
| 535 | Peasant’s Kuksa | S | — | — | — | — | — |
| 536 | Lucky Fishing Spear | S | — | — | — | — | — |
| 537 | Vibrant Red Ribbon | S | — | — | — | — | — |
| 538 | Merchant kergus | S | The Merchant — Kergüs Stock **[HER · ROLL]** | — | — | — | — |
| 539 | Vial of Glowing Blue Blood | S | — | — | — | — | — |
| 540 | Gleaming Golden Scalpel | S | — | — | — | — | — |
| 541 | Pleasing Green Cloak | S | — | — | — | — | — |
| 542 | One-eyed, One-legged, One-winged Gull | S | — | — | — | — | — |
| 543 | Bright Yellow Flower | S | — | — | — | — | — |
| 544 | Little Poppet | S | — | — | — | — | — |
| 545 | Merchant grift | S | The Merchant — Grift Stock **[HER · ROLL]** | — | — | — | — |
| 546 | Key Retrieved from the Múr | S | — | — | — | — | — |
| 547 | Chip the Rat | S | — | — | — | — | — |
| 548 | Sorrowful Music Box | S | — | — | — | — | — |
| 549 | Hangman’s Rope | S | — | — | — | — | — |
| 550 | Giant’s Chisel | S | — | — | — | — | — |
| 551 | blackpowder | S | — | — | — | — | — |
| 552 | firearms | S | — | — | — | — | — |
| 553 | reload | S | — | — | — | — | — |
| 554 | BWFTRAF | S | — | — | — | — | — |
| 555 | Pistolet | S | — | — | — | — | — |
| 556 | Culverin | S | — | — | — | — | — |
| 557 | Arquebus | S | — | — | — | — | — |
| 558 | Dragon | S | — | — | — | — | — |
| 559 | Basilisk Gun | S | — | — | — | — | — |
| 560 | Blunderbuss | S | — | — | — | — | — |
| 561 | Heavy Arquebus | S | — | — | — | — | — |
| 562 | Pepperbox Pistolet | S | — | — | — | — | — |
| 563 | Blackpowder Bomb | S | — | — | — | — | — |
| 564 | Ribauldequin | S | — | — | — | — | — |
| 565 | Cannon | S | — | — | — | — | — |
| 566 | Powdershot, basilisk-shot and cannon-shot prices | S | — | — | — | — | — |
| 567 | Sepulchre of the Swamp Witch — You Also Heard… | S/T | Sepulchre of the Swamp Witch — You Also Heard… **[HER · ROLL]** | — | — | — | — |
| 568 | Emerald Serpent | S | — | — | — | — | — |
| 569 | Strange Serpent Drug Cultist | S | — | — | — | — | — |
| 570 | Ueth the Scalehunter | S | — | — | — | — | — |
| 571 | Forked-Tongue Devotee | S | — | — | — | — | — |
| 572 | The Swamp Witch | S | Sepulchre of the Swamp Witch — Wishes **[HER · ROLL]** | Sepulchre of the Swamp Witch — You Also Heard… **[HER · ROLL]** | — | — | — |
| 573 | Srolki | S | — | — | — | — | — |
| 574 | Yaoxl | S | — | — | — | — | — |
| 575 | Emerald Venom and invisible passage rules | S | — | — | — | — | — |
| 576 | Slithering Strangulation | S | — | — | — | — | — |
| 577 | The Croaking Trident | S | — | — | — | — | — |
| 578 | Lunar Zweihänder | S | — | — | — | — | — |
| 579 | Ranseur of the Maelström | S | — | — | — | — | — |
| 580 | Venomous adders guarding the Hidden Ferns | S | — | — | — | — | — |
| 581 | Ethereal ceiling snakes | S | — | — | — | — | — |
| 582 | Klopstock ruby ring | S | — | — | — | — | — |
| 583 | Sepulchre of the Swamp Witch — Wishes | S/T | Sepulchre of the Swamp Witch — Wishes **[HER · ROLL]** | — | — | — | — |
| 584 | Dead Root Altar wishes, willing sacrifice and Doom exception | S | — | — | — | — | — |
| 585 | The Bowyer’s Bow | S | — | — | — | — | — |
| 586 | Unsavory Services | S | — | — | — | — | — |
| 587 | Devil’s Glue | S | — | — | — | — | — |
| 588 | Intact black egg | S | — | — | — | — | — |
| 589 | Nurse the Rot — Corridor North | S/T | Nurse the Rot — Corridor North **[HER · OPEN]** | — | — | — | — |
| 590 | Rotten Nurse alert and investigation procedure | S | — | — | — | — | — |
| 591 | Corridor East well-spider hazard | S | — | — | — | — | — |
| 592 | Poisoned corpse coins | S | — | — | — | — | — |
| 593 | Bitor Nest improvement and healing fungus | S | — | — | — | — | — |
| 594 | Bomb in Dim Room | S | — | — | — | — | — |
| 595 | Staff of Awful Light | S | — | — | — | — | — |
| 596 | NPC statistics | V | — | — | — | — | — |
| 597 | Does the NPC have a statistic value | V | — | — | — | — | — |
| 598 | Thread Progress Track | V | — | — | — | — | — |
| 599 | Flashpoint | V | — | — | — | — | — |
| 600 | Discovery Fate Question | V | — | — | — | — | — |
| 601 | Is something discovered | V | — | — | — | — | — |
| 602 | Thread Discovery Check | V | — | — | — | — | — |
| 603 | Strengthen Progress | V | — | — | — | — | — |
| 604 | Thread Plot Armor | V | — | — | — | — | — |
| 605 | Conclusion Thread Progress | V | — | — | — | — | — |
| 606 | Player vs Character Knowledge | V | — | — | — | — | — |
| 607 | Test It Ask It | V | — | — | — | — | — |
| 608 | Mid-Chaos Fate Chart | V | — | — | — | — | — |
| 609 | Low-Chaos Fate Chart | V | — | — | — | — | — |
| 610 | No-Chaos Fate Chart | V | Mythic Fate Chart · 예·아니오 질문 **[MGE2 · OPEN]** | — | — | — | — |
| 611 | Mid-Chaos Fate Check Modifiers | V | — | — | — | — | — |
| 612 | Low-Chaos Fate Check Modifiers | V | — | — | — | — | — |
| 613 | No-Chaos questions | V | — | — | — | — | — |
| 614 | Hold the Chaos | V | — | — | — | — | — |
| 615 | Keyed Scenes | V | — | — | — | — | — |
| 616 | Keyed Scene Trigger | V | — | — | — | — | — |
| 617 | Keyed Scene templates | V | — | — | — | — | — |
| 618 | Set Dungeon Tone | V | — | — | — | — | — |
| 619 | Boss Fight Mythic | V | — | — | — | — | — |
| 620 | Diminisher Value | V | — | — | — | — | — |
| 621 | Prepared Adventure Scaling | V | — | — | — | — | — |
| 622 | Adventure Features | V | — | — | — | — | — |
| 623 | Adventure Feature | V | — | — | — | — | — |
| 624 | Prepared Adventure Scene Test | V | — | — | — | — | — |
| 625 | Mythic prepared adventure | V | Prepared Adventure Event Focus Table **[MGE2 · ROLL]** | — | — | — | — |
| 626 | Prepared Adventure Event Focus Table | V/T | Prepared Adventure Event Focus Table **[MGE2 · ROLL]** | — | — | — | — |
| 627 | Peril Points | V | — | — | — | — | — |
| 628 | Adventure Crafter Mythic | V | — | — | — | — | — |
| 629 | Turning Point Mythic | V | — | — | — | — | — |
| 630 | Adventure Crafter source | V | — | — | — | — | — |
| 631 | Adventure Crafter Deck | V | — | — | — | — | — |
| 632 | Names | T | Names **[MB-BB · ROLL]** | Names **[MGE2 · ROLL]** | City Names **[RCL · ROLL]** | Landmark Names **[RCL · ROLL]** | Names · Meaning pair **[MGE2 · RUN]** |
| 633 | What Is It Called? — First Column | T | What Is It Called? — First Column **[MB-BB · ROLL]** | — | — | — | — |
| 634 | What Is It Called? — Second Column | T | What Is It Called? — Second Column **[MB-BB · ROLL]** | — | — | — | — |
| 635 | Status | T | Status **[MB-BB · ROLL]** | — | — | — | — |
| 636 | Imminent Danger | T | Imminent Danger **[MB-BB · ROLL]** | — | — | — | — |
| 637 | Who or What Dwells Here Now? | T | Who or What Dwells Here Now? **[MB-BB · ROLL]** | — | — | — | — |
| 638 | Distinctive Feature | T | Distinctive Feature **[MB-BB · ROLL]** | — | — | — | — |
| 639 | Sample Rooms | T | Sample Rooms **[MB-BB · ROLL]** | — | — | — | — |
| 640 | Broken Bodies | T | Broken Bodies **[MB-BB · ROLL]** | — | — | — | — |
| 641 | Starting Equipment — Container | T | Starting Equipment — Container **[MB-BB · ROLL]** | — | — | — | — |
| 642 | Starting Equipment — First d12 Table | T | Starting Equipment — First d12 Table **[MB-BB · ROLL]** | — | — | — | — |
| 643 | Starting Equipment — Second d12 Table | T | Starting Equipment — Second d12 Table **[MB-BB · ROLL]** | — | — | — | — |
| 644 | Weapons | T | Weapons **[MB-BB · ROLL]** | Weapons Table **[RCL · ROLL]** | NPC Encounter 55 — Fence Weapon **[AitC · ROLL]** | — | — |
| 645 | Armor | T | Armor / Shield · 방어구와 방패 **[MB-BB · OPEN]** | Armor **[MB-BB · ROLL]** | Armor Table **[RCL · ROLL]** | Beasts — Armor Tier **[RCL · ROLL]** | — |
| 646 | Unclean Scrolls | T | Unclean Scrolls **[MB-BB · ROLL]** | — | — | — | — |
| 647 | Sacred Scrolls | T | Sacred Scrolls **[MB-BB · ROLL]** | — | — | — | — |
| 648 | Traps and Devilry | T | Traps and Devilry **[MB-BB · ROLL]** | — | — | — | — |
| 649 | Adventure Spark | T | Adventure Spark **[MB-BB · ROLL]** | Adventure Calls — What Sets Everything in Motion? **[RCL · ROLL]** | — | — | — |
| 650 | Who (or What) Contacts You? | T | Who (or What) Contacts You? **[MB-BB · OPEN]** | — | — | — | — |
| 651 | The Monster Approaches — Table A | T | The Monster Approaches · 몬스터 생성 **[FER · ROLL]** | — | — | — | — |
| 652 | The Monster Approaches — Table B | T | The Monster Approaches · 몬스터 생성 **[FER · ROLL]** | — | — | — | — |
| 653 | The Monster Approaches — Table C | T | The Monster Approaches · 몬스터 생성 **[FER · ROLL]** | — | — | — | — |
| 654 | Occult Treasures | T/U | Occult Treasures **[MB-BB · ROLL]** | — | — | — | — |
| 655 | Dungeon Origin | T | Dungeon Origin **[RCL · ROLL]** | — | — | — | — |
| 656 | Dungeon Purpose (Then) | T | Dungeon Purpose (Then) **[RCL · ROLL]** | — | — | — | — |
| 657 | Dungeon Purpose (Now) | T | Dungeon Purpose (Now) **[RCL · ROLL]** | — | — | — | — |
| 658 | Dungeon Theme | T | Dungeon Theme **[RCL · ROLL]** | — | — | — | — |
| 659 | Dungeon Architecture | T | Dungeon Architecture **[RCL · ROLL]** | Architecture & Structure **[RCL · ROLL]** | — | — | — |
| 660 | Dungeon Condition | T | Dungeon Condition **[RCL · ROLL]** | — | — | — | — |
| 661 | Dungeon Entrance | T | Dungeon Entrance **[RCL · ROLL]** | Entrance Hazard **[RCL · ROLL]** | Entrance Signs **[RCL · ROLL]** | Entrance Smells **[RCL · ROLL]** | Entrance Sounds **[RCL · ROLL]** |
| 662 | Current Inhabitants | T | Current Inhabitants **[RCL · ROLL]** | — | — | — | — |
| 663 | Primary Motive Within | T | Primary Motive Within **[RCL · ROLL]** | — | — | — | — |
| 664 | Entrance State | T | Entrance State **[RCL · ROLL]** | — | — | — | — |
| 665 | First Impression | T | First Impression **[RCL · ROLL]** | — | — | — | — |
| 666 | Entrance Hazard | T | Entrance Hazard **[RCL · ROLL]** | — | — | — | — |
| 667 | Entrance Sounds | T | Entrance Sounds **[RCL · ROLL]** | — | — | — | — |
| 668 | Entrance Smells | T | Entrance Smells **[RCL · ROLL]** | — | — | — | — |
| 669 | Entrance Signs | T | Entrance Signs **[RCL · ROLL]** | — | — | — | — |
| 670 | Immediate Challenge | T | Immediate Challenge **[RCL · ROLL]** | — | — | — | — |
| 671 | Possible Help | T | Possible Help **[RCL · ROLL]** | — | — | — | — |
| 672 | Room Size & Shape | T | Room Size & Shape **[RCL · ROLL]** | — | — | — | — |
| 673 | Atmosphere | T | Atmosphere **[RCL · ROLL]** | Interior Atmosphere **[RCL · ROLL]** | Quick Street Generator — Atmosphere **[RCL · ROLL]** | — | — |
| 674 | Dressing | T | Dressing **[RCL · ROLL]** | Room Dressing **[RCL · ROLL]** | — | — | — |
| 675 | Contents | T | Contents **[RCL · ROLL]** | Dungeon Room Descriptors — Room Contents **[SD · ROLL]** | Room Contents **[RCL · ROLL]** | Street — Adjective, Type and Contents **[AitC · RUN]** | Street Contents **[AitC · ROLL]** |
| 676 | Exits | T | Exits **[RCL · ROLL]** | Dungeon Room Descriptors — Room Exits **[SD · ROLL]** | Number Of Exits **[RCL · ROLL]** | Quick Street Generator — Exits **[RCL · ROLL]** | Street Exits **[AitC · ROLL]** |
| 677 | Room Size | T | Room Size **[RCL · ROLL]** | Room Size & Shape **[RCL · ROLL]** | — | — | — |
| 678 | Architecture & Structure | T | Architecture & Structure **[RCL · ROLL]** | — | — | — | — |
| 679 | Room Shape | T | Room Shape **[RCL · ROLL]** | Room Size & Shape **[RCL · ROLL]** | — | — | — |
| 680 | Room Purpose | T | Room Purpose **[RCL · ROLL]** | — | — | — | — |
| 681 | Light & Visibility | T | Light & Visibility **[RCL · ROLL]** | — | — | — | — |
| 682 | Air / Temperature | T | Air / Temperature **[RCL · ROLL]** | — | — | — | — |
| 683 | Room Smells | T | Room Smells **[RCL · ROLL]** | Entrance Smells **[RCL · ROLL]** | — | — | — |
| 684 | Room Dressing | T | Room Dressing **[RCL · ROLL]** | Dressing **[RCL · ROLL]** | — | — | — |
| 685 | Room Contents | T | Room Contents **[RCL · ROLL]** | Dungeon Room Descriptors — Room Contents **[SD · ROLL]** | — | — | — |
| 686 | Room Sounds | T | Room Sounds **[RCL · ROLL]** | Entrance Sounds **[RCL · ROLL]** | SD · Sound Quality + Type **[SD · RUN]** | Sound · Quality + Type **[SD · ROLL]** | — |
| 687 | 10C. Encounter | T | 10C. Encounter **[RCL · ROLL]** | Encounter Prep **[SD · OPEN]** | — | — | — |
| 688 | 10A. Discovery | T | 10A. Discovery **[RCL · ROLL]** | — | — | — | — |
| 689 | 10B. Hazard | T | 10B. Hazard **[RCL · ROLL]** | — | — | — | — |
| 690 | 10D. Loot | T | 10D. Loot **[RCL · ROLL]** | — | — | — | — |
| 691 | Number Of Exits | T | Number Of Exits **[RCL · ROLL]** | Street Generation — Number Of Exits **[RCL · ROLL]** | — | — | — |
| 692 | Exit Type | T | Exit Type **[RCL · ROLL]** | Street Generation — Exit Type **[RCL · ROLL]** | Street — Adjective, Type and Contents **[AitC · RUN]** | — | — |
| 693 | Encounter Context | T | Encounter Context **[RCL · ROLL]** | — | — | — | — |
| 694 | Initial Disposition | T | Initial Disposition **[RCL · ROLL]** | — | — | — | — |
| 695 | Immediate Goal | T | Immediate Goal **[RCL · ROLL]** | — | — | — | — |
| 696 | Social & Narrative Complications | T | Social & Narrative Complications **[RCL · ROLL]** | — | — | — | — |
| 697 | Strange Meetings | T | Strange Meetings **[RCL · ROLL]** | — | — | — | — |
| 698 | Immediate Aftermath | T | Immediate Aftermath **[RCL · ROLL]** | — | — | — | — |
| 699 | Lasting Consequences | T | Lasting Consequences **[RCL · ROLL]** | — | — | — | — |
| 700 | Arcane Encounters | T | Arcane Encounters **[RCL · ROLL]** | — | — | — | — |
| 701 | Quest-Related Encounter Hook | T | Quest-Related Encounter Hook **[RCL · ROLL]** | — | — | — | — |
| 702 | Positional Complications | T | Positional Complications **[RCL · ROLL]** | — | — | — | — |
| 703 | Tactical Complications | T | Tactical Complications **[RCL · ROLL]** | — | — | — | — |
| 704 | Narrative Complications | T | Narrative Complications **[RCL · ROLL]** | Social & Narrative Complications **[RCL · ROLL]** | — | — | — |
| 705 | Multi-Entity Complications | T | Multi-Entity Complications **[RCL · ROLL]** | — | — | — | — |
| 706 | NPC Summary | T | NPC Summary **[RCL · ROLL]** | — | — | — | — |
| 707 | NPC Motivation | T | NPC Motivation **[RCL · ROLL]** | NPC **[MB-BB · GENERATE]** | Character Motivations **[MGE2 · ROLL]** | Character Motivations · Meaning pair **[MGE2 · RUN]** | — |
| 708 | NPC Gender | T | NPC Gender **[RCL · ROLL]** | — | — | — | — |
| 709 | NPC Appearance | T | NPC Appearance **[RCL · ROLL]** | Character Appearance **[MGE2 · ROLL]** | Character Appearance · Meaning pair **[MGE2 · RUN]** | NPC **[MB-BB · GENERATE]** | — |
| 710 | NPC Personality Traits | T | NPC Personality Traits **[RCL · ROLL]** | NPC **[MB-BB · GENERATE]** | — | — | — |
| 711 | Body Feature | T | Body Feature **[RCL · ROLL]** | — | — | — | — |
| 712 | Hair / Grooming | T | Hair / Grooming **[RCL · ROLL]** | — | — | — | — |
| 713 | Clothing Detail | T | Clothing Detail **[RCL · ROLL]** | — | — | — | — |
| 714 | Overall Presence | T | Overall Presence **[RCL · ROLL]** | — | — | — | — |
| 715 | Color | T | Color **[RCL · ROLL]** | — | — | — | — |
| 716 | Size | T | Size **[RCL · ROLL]** | Beasts — Size **[RCL · ROLL]** | Buildings & Structures — Size **[SD · ROLL]** | Notable Artefacts — Sculpture Size **[AitC · ROLL]** | Room Size **[RCL · ROLL]** |
| 717 | Weight | T | Weight **[RCL · ROLL]** | Interior Locations — Hovel **[AitC · ROLL]** | Interior Locations — Mansion **[AitC · ROLL]** | Interior Locations — Townhouse **[AitC · ROLL]** | Settlement Name **[AitC · RUN]** |
| 718 | Quality | T | Quality **[RCL · ROLL]** | Material · Quality + Composition **[SD · ROLL]** | SD · Material Quality + Composition **[SD · RUN]** | SD · Sound Quality + Type **[SD · RUN]** | Sound · Quality + Type **[SD · ROLL]** |
| 719 | Faction Origin | T | Faction Origin **[RCL · ROLL]** | — | — | — | — |
| 720 | Faction Attitude Toward You | T | Faction Attitude Toward You **[RCL · ROLL]** | — | — | — | — |
| 721 | Faction Purpose | T | Faction Purpose **[RCL · ROLL]** | — | — | — | — |
| 722 | Faction Power Level | T | Faction Power Level **[RCL · ROLL]** | — | — | — | — |
| 723 | Faction Resources | T | Faction Resources **[RCL · ROLL]** | — | — | — | — |
| 724 | Faction Plot Hooks | T | Faction Plot Hooks **[RCL · ROLL]** | — | — | — | — |
| 725 | Faction Weaknesses | T | Faction Weaknesses **[RCL · ROLL]** | — | — | — | — |
| 726 | Action Oracle | T | Action Oracle **[RCL · ROLL]** | Action **[MGE2 · ROLL]** | Chaos Portents — Action **[DEP · ROLL]** | Graves Left Wanting — The Übertaker: Random Action **[HER · ROLL]** | Action + Theme **[RCL · RUN]** |
| 727 | Theme Oracle | T | Theme Oracle **[RCL · ROLL]** | Dungeon Theme **[RCL · ROLL]** | Action + Theme **[RCL · RUN]** | Adventure Tone **[MGE2 · ROLL]** | Visions & Dreams **[MGE2 · ROLL]** |
| 728 | Focus Oracle | T | Focus Oracle **[RCL · ROLL]** | Prepared Adventure Event Focus Table **[MGE2 · ROLL]** | Random Event Focus **[DEP · ROLL]** | Random Event Focus Table **[MGE2 · ROLL]** | — |
| 729 | Descriptor Oracle | T | Descriptor Oracle **[RCL · ROLL]** | Descriptor **[MGE2 · ROLL]** | Notable Artefacts — Depicting Descriptor **[AitC · ROLL]** | Settlement Descriptor **[AitC · ROLL]** | Alien Species Descriptors **[MGE2 · ROLL]** |
| 730 | Detail Oracle | T | Detail Oracle **[RCL · ROLL]** | Clothing Detail **[RCL · ROLL]** | — | — | — |
| 731 | NPCs — Disposition | T | NPC · Disposition + Profession **[SD · ROLL]** | Initial Disposition **[RCL · ROLL]** | NPC **[MB-BB · GENERATE]** | NPC Description · 인물의 단서 **[SD · OPEN]** | — |
| 732 | NPCs — Profession | T | NPC · Disposition + Profession **[SD · ROLL]** | Bergen Chrypt — NPC Professions **[DEP · ROLL]** | Graven-Tosk — NPC Professions **[DEP · ROLL]** | Kergüs — NPC Professions **[DEP · ROLL]** | Lake Onda — NPC Professions **[DEP · ROLL]** |
| 733 | Dungeon Room Descriptors — Room Adjective | T | Room · Adjective + Type **[SD · ROLL]** | SD · Room Adjective + Type **[SD · RUN]** | — | — | — |
| 734 | Dungeon Room Descriptors — Room Type | T | Room · Adjective + Type **[SD · ROLL]** | SD · Room Adjective + Type **[SD · RUN]** | — | — | — |
| 735 | Dungeon Room Descriptors — Room Exits | T | Dungeon Room Descriptors — Room Exits **[SD · ROLL]** | — | — | — | — |
| 736 | Dungeon Room Descriptors — Room Contents | T | Dungeon Room Descriptors — Room Contents **[SD · ROLL]** | — | — | — | — |
| 737 | Yes or No? | T | Yes or No? **[SD · ROLL]** | Holy Places — Cities and Larger **[AitC · ROLL]** | Holy Places — Villages and Smaller **[AitC · ROLL]** | Orakle **[DEP · ROLL]** | — |
| 738 | Materials — Quality | T | Material · Quality + Composition **[SD · ROLL]** | SD · Material Quality + Composition **[SD · RUN]** | — | — | — |
| 739 | Materials — Compostion | T | Material · Quality + Composition **[SD · ROLL]** | SD · Material Quality + Composition **[SD · RUN]** | — | — | — |
| 740 | Sounds — Quality | T | SD · Sound Quality + Type **[SD · RUN]** | Sound · Quality + Type **[SD · ROLL]** | — | — | — |
| 741 | Sounds — Type | T | SD · Sound Quality + Type **[SD · RUN]** | Sound · Quality + Type **[SD · ROLL]** | — | — | — |
| 742 | Odours & Tastes | T | Odours & Tastes **[SD · ROLL]** | — | — | — | — |
| 743 | Stock Creatures | T | Stock Creatures **[SD · ROLL]** | Common Encounters · 일반 조우 준비 **[SD · OPEN]** | Encounter Prep **[SD · OPEN]** | Rare Encounters · 희귀 조우 준비 **[SD · OPEN]** | — |
| 744 | Useful Items | T | Useful Item **[SD · ROLL]** | — | — | — | — |
| 745 | Searching for an Object — Strong Hit | T | Searching for an Object — Strong Hit **[SD · ROLL]** | — | — | — | — |
| 746 | Searching for an Object — Weak Hit | T | Searching for an Object — Weak Hit **[SD · ROLL]** | — | — | — | — |
| 747 | Tveland — Trait | T | Tveland — Trait **[DEP · ROLL]** | Galgenbeck **[DEP · OPEN]** | — | — | — |
| 748 | Tveland — Feature | T | Tveland — Feature **[DEP · ROLL]** | Galgenbeck **[DEP · OPEN]** | — | — | — |
| 749 | Tveland — Discovery | T | Tveland — Discovery **[DEP · ROLL]** | Galgenbeck **[DEP · OPEN]** | — | — | — |
| 750 | Tveland — Monsters | T | Tveland — Monsters **[DEP · ROLL]** | Galgenbeck · Regional Monsters **[DEP · GENERATE]** | Eat Prey Kill · Tveland **[FER · ROLL]** | Galgenbeck **[DEP · OPEN]** | — |
| 751 | Tveland — NPC Professions | T | Tveland — NPC Professions **[DEP · ROLL]** | Galgenbeck **[DEP · OPEN]** | — | — | — |
| 752 | Sarkash — Trait | T | Sarkash — Trait **[DEP · ROLL]** | Sarkash **[DEP · OPEN]** | — | — | — |
| 753 | Sarkash — Feature | T | Sarkash — Feature **[DEP · ROLL]** | Sarkash **[DEP · OPEN]** | — | — | — |
| 754 | Sarkash — Discovery | T | Sarkash — Discovery **[DEP · ROLL]** | Sarkash **[DEP · OPEN]** | — | — | — |
| 755 | Sarkash — Monsters | T | Sarkash · Regional Monsters **[DEP · GENERATE]** | Sarkash — Monsters **[DEP · ROLL]** | Eat Prey Kill · Sarkash **[FER · ROLL]** | Sarkash **[DEP · OPEN]** | Carrion Owls **[FER · OPEN]** |
| 756 | Sarkash — NPC Professions | T | Sarkash — NPC Professions **[DEP · ROLL]** | Sarkash **[DEP · OPEN]** | — | — | — |
| 757 | Graven-Tosk — Trait | T | Graven-Tosk — Trait **[DEP · ROLL]** | Graven-Tosk **[DEP · OPEN]** | — | — | — |
| 758 | Graven-Tosk — Feature | T | Graven-Tosk — Feature **[DEP · ROLL]** | Graven-Tosk **[DEP · OPEN]** | — | — | — |
| 759 | Graven-Tosk — Discovery | T | Graven-Tosk — Discovery **[DEP · ROLL]** | Graven-Tosk **[DEP · OPEN]** | — | — | — |
| 760 | Graven-Tosk — Monsters | T | Graven-Tosk · Regional Monsters **[DEP · GENERATE]** | Graven-Tosk — Monsters **[DEP · ROLL]** | Eat Prey Kill · Graven-Tosk **[FER · ROLL]** | Graven-Tosk **[DEP · OPEN]** | Fogbound Skeleton · Graves Left Wanting creature **[HER · OPEN]** |
| 761 | Graven-Tosk — NPC Professions | T | Graven-Tosk — NPC Professions **[DEP · ROLL]** | Graven-Tosk **[DEP · OPEN]** | — | — | — |
| 762 | Lake Onda — Trait | T | Lake Onda — Trait **[DEP · ROLL]** | Wästland **[DEP · OPEN]** | — | — | — |
| 763 | Lake Onda — Feature | T | Lake Onda — Feature **[DEP · ROLL]** | Wästland **[DEP · OPEN]** | — | — | — |
| 764 | Lake Onda — Discovery | T | Lake Onda — Discovery **[DEP · ROLL]** | Wästland **[DEP · OPEN]** | — | — | — |
| 765 | Lake Onda — Monsters | T | Lake Onda — Monsters **[DEP · ROLL]** | Eat Prey Kill · Lake Onda **[FER · ROLL]** | Wästland **[DEP · OPEN]** | — | — |
| 766 | Lake Onda — NPC Professions | T | Lake Onda — NPC Professions **[DEP · ROLL]** | Wästland **[DEP · OPEN]** | — | — | — |
| 767 | Valley of the Unfortunate Undead — Trait | T | Valley of the Unfortunate Undead — Trait **[DEP · ROLL]** | The Valley of the Unfortunate Undead **[DEP · OPEN]** | — | — | — |
| 768 | Valley of the Unfortunate Undead — Feature | T | Valley of the Unfortunate Undead — Feature **[DEP · ROLL]** | The Valley of the Unfortunate Undead **[DEP · OPEN]** | — | — | — |
| 769 | Valley of the Unfortunate Undead — Discovery | T | Valley of the Unfortunate Undead — Discovery **[DEP · ROLL]** | The Valley of the Unfortunate Undead **[DEP · OPEN]** | — | — | — |
| 770 | Valley of the Unfortunate Undead — Monsters | T | Valley of the Unfortunate Undead — Monsters **[DEP · ROLL]** | The Valley of the Unfortunate Undead · Regional Monsters **[DEP · GENERATE]** | Eat Prey Kill · Valley of the Unfortunate Undead **[FER · ROLL]** | The Valley of the Unfortunate Undead **[DEP · OPEN]** | Fogbound Skeleton · Graves Left Wanting creature **[HER · OPEN]** |
| 771 | Valley of the Unfortunate Undead — NPC Professions | T | Valley of the Unfortunate Undead — NPC Professions **[DEP · ROLL]** | The Valley of the Unfortunate Undead **[DEP · OPEN]** | — | — | — |
| 772 | Bergen Chrypt — Trait | T | Bergen Chrypt — Trait **[DEP · ROLL]** | — | — | — | — |
| 773 | Bergen Chrypt — Feature | T | Bergen Chrypt — Feature **[DEP · ROLL]** | — | — | — | — |
| 774 | Bergen Chrypt — Discovery | T | Bergen Chrypt — Discovery **[DEP · ROLL]** | — | — | — | — |
| 775 | Bergen Chrypt — Monsters | T | Bergen Chrypt — Monsters **[DEP · ROLL]** | Eat Prey Kill · Bergen Chrypt **[FER · ROLL]** | — | — | — |
| 776 | Bergen Chrypt — NPC Professions | T | Bergen Chrypt — NPC Professions **[DEP · ROLL]** | — | — | — | — |
| 777 | Wästland — Trait | T | Wästland — Trait **[DEP · ROLL]** | Wästland **[DEP · OPEN]** | — | — | — |
| 778 | Wästland — Feature | T | Wästland — Feature **[DEP · ROLL]** | Wästland **[DEP · OPEN]** | — | — | — |
| 779 | Wästland — Discovery | T | Wästland — Discovery **[DEP · ROLL]** | Wästland **[DEP · OPEN]** | — | — | — |
| 780 | Wästland — Monsters | T | Wästland · Regional Monsters **[DEP · GENERATE]** | Wästland — Monsters **[DEP · ROLL]** | Eat Prey Kill · Wästland **[FER · ROLL]** | Wästland **[DEP · OPEN]** | Aland · Wickhead knife-wielder **[MB-BB · OPEN]** |
| 781 | Wästland — NPC Professions | T | Wästland — NPC Professions **[DEP · ROLL]** | Wästland **[DEP · OPEN]** | — | — | — |
| 782 | Kergüs — Trait | T | Kergüs — Trait **[DEP · ROLL]** | Kergüs **[DEP · OPEN]** | — | — | — |
| 783 | Kergüs — Feature | T | Kergüs — Feature **[DEP · ROLL]** | Kergüs **[DEP · OPEN]** | — | — | — |
| 784 | Kergüs — Discovery | T | Kergüs — Discovery **[DEP · ROLL]** | Kergüs **[DEP · OPEN]** | — | — | — |
| 785 | Kergüs — Monsters | T | Kergüs · Regional Monsters **[DEP · GENERATE]** | Kergüs — Monsters **[DEP · ROLL]** | Eat Prey Kill · Kergüs **[FER · ROLL]** | Fogbound Skeleton · Graves Left Wanting creature **[HER · OPEN]** | Kergüs **[DEP · OPEN]** |
| 786 | Kergüs — NPC Professions | T | Kergüs — NPC Professions **[DEP · ROLL]** | Kergüs **[DEP · OPEN]** | — | — | — |
| 787 | Rare Monster — Card 1: Overall Look | T | Rare Monster — Card 1: Overall Look **[DEP · OPEN]** | — | — | — | — |
| 788 | Rare Monster — Card 2: Defining Feature | T | Rare Monster — Card 2: Defining Feature **[DEP · OPEN]** | — | — | — | — |
| 789 | Rare Monster — 1st & 2nd Cards: Intention | T | Rare Monster — 1st & 2nd Cards: Intention **[DEP · OPEN]** | — | — | — | — |
| 790 | Rare Monster — 3rd & 4th Cards: Special | T | Rare Monster — 3rd & 4th Cards: Special **[DEP · OPEN]** | — | — | — | — |
| 791 | Creature Difficulty Modification — Tougher | T | Creature Difficulty Modification — Tougher **[DEP · ROLL]** | — | — | — | — |
| 792 | Creature Difficulty Modification — Spend Omens | T | Creature Difficulty Modification — Spend Omens **[DEP · OPEN]** | — | — | — | — |
| 793 | Enemy Stats Generator | T | Enemy Stats Generator **[DEP · OPEN]** | — | — | — | — |
| 794 | Reveal a Danger | T | Reveal a Danger **[DEP · ROLL]** | Depths Time / Noise · 시간 지체와 소음 **[DEP · OPEN]** | — | — | — |
| 795 | Determining the Encounter | T | Determining the Encounter **[DEP · ROLL]** | — | — | — | — |
| 796 | Story Connection | T | Story Connection **[DEP · ROLL]** | — | — | — | — |
| 797 | Action 1 | T | Action **[MGE2 · ROLL]** | Action Oracle **[RCL · ROLL]** | Chaos Portents — Action **[DEP · ROLL]** | Animal Actions **[MGE2 · ROLL]** | Character Actions, Combat **[MGE2 · ROLL]** |
| 798 | Action 2 | T | Action **[MGE2 · ROLL]** | Meaning Tables: Actions **[MGE2 · RUN]** | Scumslaughter Farm — Cult Farmwife Special **[SD · ROLL]** | The 4W **[MGE2 · RUN]** | — |
| 799 | Descriptor 1 | T | Descriptor **[MGE2 · ROLL]** | Descriptor Oracle **[RCL · ROLL]** | Alien Species Descriptors **[MGE2 · ROLL]** | Army Descriptors **[MGE2 · ROLL]** | Cavern Descriptors **[MGE2 · ROLL]** |
| 800 | Descriptor 2 | T | Descriptor **[MGE2 · ROLL]** | Settlement Descriptor **[AitC · ROLL]** | Meaning Tables: Descriptions **[MGE2 · RUN]** | — | — |
| 801 | Adventure Tone | T | Adventure Tone **[MGE2 · ROLL]** | Adventure Tone · Meaning pair **[MGE2 · RUN]** | — | — | — |
| 802 | Alien Species Descriptors | T | Alien Species Descriptors **[MGE2 · ROLL]** | Alien Species Descriptors · Meaning pair **[MGE2 · RUN]** | — | — | — |
| 803 | Animal Actions | T | Animal Actions **[MGE2 · ROLL]** | Animal Actions · Meaning pair **[MGE2 · RUN]** | — | — | — |
| 804 | Army Descriptors | T | Army Descriptors **[MGE2 · ROLL]** | Army Descriptors · Meaning pair **[MGE2 · RUN]** | — | — | — |
| 805 | Cavern Descriptors | T | Cavern Descriptors **[MGE2 · ROLL]** | Cavern Descriptors · Meaning pair **[MGE2 · RUN]** | — | — | — |
| 806 | Characters | T | Characters **[MGE2 · ROLL]** | Characters · Meaning pair **[MGE2 · RUN]** | NPC Encounter 14 — Cursed Toy **[AitC · ROLL]** | The 4W **[MGE2 · RUN]** | — |
| 807 | Character Actions, Combat | T | Character Actions, Combat **[MGE2 · ROLL]** | Character Actions, Combat · Meaning pair **[MGE2 · RUN]** | — | — | — |
| 808 | Character Actions, General | T | Character Actions, General **[MGE2 · ROLL]** | Character Actions, General · Meaning pair **[MGE2 · RUN]** | — | — | — |
| 809 | Character Appearance | T | Character Appearance **[MGE2 · ROLL]** | Character Appearance · Meaning pair **[MGE2 · RUN]** | — | — | — |
| 810 | Character Background | T | Character Background **[MGE2 · ROLL]** | Character Background · Meaning pair **[MGE2 · RUN]** | — | — | — |
| 811 | Character Conversations | T | Character Conversations **[MGE2 · ROLL]** | Character Conversations · Meaning pair **[MGE2 · RUN]** | — | — | — |
| 812 | Character Descriptors | T | Character Descriptors **[MGE2 · ROLL]** | Character Descriptors · Meaning pair **[MGE2 · RUN]** | — | — | — |
| 813 | Character Identity | T | Character Identity **[MGE2 · ROLL]** | Character Identity · Meaning pair **[MGE2 · RUN]** | — | — | — |
| 814 | Character Motivations | T | Character Motivations **[MGE2 · ROLL]** | Character Motivations · Meaning pair **[MGE2 · RUN]** | — | — | — |
| 815 | Character Personality | T | Character Personality **[MGE2 · ROLL]** | Character Personality · Meaning pair **[MGE2 · RUN]** | — | — | — |
| 816 | Character Skills | T | Character Skills **[MGE2 · ROLL]** | Character Skills · Meaning pair **[MGE2 · RUN]** | — | — | — |
| 817 | Character Traits & Flaws | T | Character Traits & Flaws **[MGE2 · ROLL]** | Character Traits & Flaws · Meaning pair **[MGE2 · RUN]** | — | — | — |
| 818 | City Descriptors | T | City Descriptors **[MGE2 · ROLL]** | City Descriptors · Meaning pair **[MGE2 · RUN]** | Street — Adjective and Type **[AitC · RUN]** | — | — |
| 819 | Civilization Descriptors | T | Civilization Descriptors **[MGE2 · ROLL]** | Civilization Descriptors · Meaning pair **[MGE2 · RUN]** | — | — | — |
| 820 | Creature Abilities | T | Creature Abilities **[MGE2 · ROLL]** | Creature Abilities · Meaning pair **[MGE2 · RUN]** | — | — | — |
| 821 | Creature Descriptors | T | Creature Descriptors **[MGE2 · ROLL]** | Creature Descriptors · Meaning pair **[MGE2 · RUN]** | Alien Species Descriptors **[MGE2 · ROLL]** | Alien Species Descriptors · Meaning pair **[MGE2 · RUN]** | Mutation Descriptors **[MGE2 · ROLL]** |
| 822 | Cryptic Message | T | Cryptic Message **[MGE2 · ROLL]** | Cryptic Message · Meaning pair **[MGE2 · RUN]** | — | — | — |
| 823 | Curses | T | Curses **[MGE2 · ROLL]** | Curses · Meaning pair **[MGE2 · RUN]** | You Are Cursed — What Now? **[HER · ROLL]** | — | — |
| 824 | Domicile Descriptors | T | Domicile Descriptors **[MGE2 · ROLL]** | Domicile Descriptors · Meaning pair **[MGE2 · RUN]** | — | — | — |
| 825 | Dungeon Descriptors | T | Dungeon Descriptors **[MGE2 · ROLL]** | Dungeon Descriptors · Meaning pair **[MGE2 · RUN]** | Dungeon Room Descriptors — Room Contents **[SD · ROLL]** | Dungeon Room Descriptors — Room Exits **[SD · ROLL]** | Cavern Descriptors **[MGE2 · ROLL]** |
| 826 | Dungeon Traps | T | Dungeon Traps **[MGE2 · ROLL]** | Dungeon Traps · Meaning pair **[MGE2 · RUN]** | Depths Traps · 함정 발견과 회피 **[DEP · OPEN]** | Regular Traps **[DEP · ROLL]** | Special Traps **[DEP · ROLL]** |
| 827 | Forest Descriptors | T | Forest Descriptors **[MGE2 · ROLL]** | Forest Descriptors · Meaning pair **[MGE2 · RUN]** | — | — | — |
| 828 | Gods | T | Gods **[MGE2 · ROLL]** | Dead God’s Prophet — Two Gifts **[FER · ROLL]** | Gods · Meaning pair **[MGE2 · RUN]** | — | — |
| 829 | Legends | T | Legends **[MGE2 · ROLL]** | Legends · Meaning pair **[MGE2 · RUN]** | — | — | — |
| 830 | Locations | T | Locations **[MGE2 · ROLL]** | Home Locations **[RCL · ROLL]** | Interior Locations — Hovel **[AitC · ROLL]** | Interior Locations — Mansion **[AitC · ROLL]** | Interior Locations — Townhouse **[AitC · ROLL]** |
| 831 | Magic Item Descriptors | T | Magic Item Descriptors **[MGE2 · ROLL]** | Magic Item Descriptors · Meaning pair **[MGE2 · RUN]** | — | — | — |
| 832 | Mutation Descriptors | T | Mutation Descriptors **[MGE2 · ROLL]** | Mutation Descriptors · Meaning pair **[MGE2 · RUN]** | — | — | — |
| 833 | Noble House | T | Noble House **[MGE2 · ROLL]** | Noble House · Meaning pair **[MGE2 · RUN]** | — | — | — |
| 834 | Objects | T | Objects **[MGE2 · ROLL]** | Objects · Meaning pair **[MGE2 · RUN]** | — | — | — |
| 835 | Plot Twists | T | Plot Twists **[MGE2 · ROLL]** | Plot Twists · Meaning pair **[MGE2 · RUN]** | — | — | — |
| 836 | Scavenging Results | T | Scavenging Results **[MGE2 · ROLL]** | Scavenging Results · Meaning pair **[MGE2 · RUN]** | — | — | — |
| 837 | Smells | T | Smells **[MGE2 · ROLL]** | Entrance Smells **[RCL · ROLL]** | Room Smells **[RCL · ROLL]** | Smells · Meaning pair **[MGE2 · RUN]** | — |
| 838 | Sounds | T | Sounds **[MGE2 · ROLL]** | Entrance Sounds **[RCL · ROLL]** | Room Sounds **[RCL · ROLL]** | Sounds · Meaning pair **[MGE2 · RUN]** | SD · Sound Quality + Type **[SD · RUN]** |
| 839 | Spell Effects | T | Spell Effects **[MGE2 · ROLL]** | Spell Effects · Meaning pair **[MGE2 · RUN]** | — | — | — |
| 840 | Starship Descriptors | T | Starship Descriptors **[MGE2 · ROLL]** | Starship Descriptors · Meaning pair **[MGE2 · RUN]** | — | — | — |
| 841 | Terrain Descriptors | T | Terrain Descriptors **[MGE2 · ROLL]** | Terrain Descriptors · Meaning pair **[MGE2 · RUN]** | — | — | — |
| 842 | Undead Descriptors | T | Undead Descriptors **[MGE2 · ROLL]** | Undead Descriptors · Meaning pair **[MGE2 · RUN]** | — | — | — |
| 843 | Visions & Dreams | T | Visions & Dreams **[MGE2 · ROLL]** | Visions & Dreams · Meaning pair **[MGE2 · RUN]** | — | — | — |
| 844 | Random Event Focus Table | T | Random Event Focus Table **[MGE2 · ROLL]** | — | — | — | — |
| 845 | Scene Adjustment Table | T | Scene Adjustment Table **[MGE2 · ROLL]** | — | — | — | — |
| 846 | Crowd Sizes | T | Crowd Sizes **[SD · ROLL]** | Settlement Size **[AitC · ROLL]** | — | — | — |
| 847 | Religious Denominations — Order | T | Religious Denomination · Order / Adjective / Domain **[SD · ROLL]** | — | — | — | — |
| 848 | Religious Denominations — Adjective | T | Religious Denomination · Order / Adjective / Domain **[SD · ROLL]** | — | — | — | — |
| 849 | Religious Denominations — Domain | T | Religious Denomination · Order / Adjective / Domain **[SD · ROLL]** | — | — | — | — |
| 850 | Buildings & Structures — Material | T | Buildings & Structures — Material **[SD · ROLL]** | — | — | — | — |
| 851 | Buildings & Structures — Size | T | Buildings & Structures — Size **[SD · ROLL]** | — | — | — | — |
| 852 | Buildings & Structures — Form | T | Buildings & Structures — Form **[SD · ROLL]** | — | — | — | — |
| 853 | Geographical Features | T | Geographical Features **[SD · ROLL]** | Settlement — Size, Name and Descriptor **[AitC · RUN]** | — | — | — |
| 854 | Example DR10 Dungeon — Common Encounters | T | Example DR10 Dungeon — Common Encounters **[SD · ROLL]** | — | — | — | — |
| 855 | Example DR10 Dungeon — Rare Encounters | T | Example DR10 Dungeon — Rare Encounters **[SD · ROLL]** | — | — | — | — |
| 856 | Scumslaughter Farm — Cult Farmwife Special | T | Scumslaughter Farm — Cult Farmwife Special **[SD · ROLL]** | — | — | — | — |
| 857 | Orakle | T | Orakle **[DEP · ROLL]** | — | — | — | — |
| 858 | Random Event Focus | T | Random Event Focus **[DEP · ROLL]** | Random Event Focus Table **[MGE2 · ROLL]** | — | — | — |
| 859 | Weak Hit Consequences | T | Weak Hit Consequences **[DEP · ROLL]** | — | — | — | — |
| 860 | Regular Traps | T | Regular Traps **[DEP · ROLL]** | Depths Traps · 함정 발견과 회피 **[DEP · OPEN]** | — | — | — |
| 861 | Special Traps | T | Special Traps **[DEP · ROLL]** | — | — | — | — |
| 862 | Enemy Combat Modifiers | T | Enemy Combat Modifiers **[DEP · ROLL]** | — | — | — | — |
| 863 | Chaos Portents — Action | T | Chaos Portents — Action **[DEP · ROLL]** | — | — | — | — |
| 864 | Chaos Portents — Subject | T | Chaos Portents — Subject **[DEP · ROLL]** | — | — | — | — |
| 865 | City Origin | T | City Origin **[RCL · ROLL]** | Businesses **[AitC · ROLL]** | — | — | — |
| 866 | City Purpose (Now) | T | City Purpose (Now) **[RCL · ROLL]** | — | — | — | — |
| 867 | City Mood | T | City Mood **[RCL · ROLL]** | Gatekeeper Mood **[RCL · ROLL]** | Neighborhood Mood **[RCL · ROLL]** | — | — |
| 868 | City Condition | T | City Condition **[RCL · ROLL]** | Street Quality / Condition **[RCL · ROLL]** | Settlement — Size, Name and Descriptor **[AitC · RUN]** | Street Contents **[AitC · ROLL]** | — |
| 869 | City Architecture | T | City Architecture **[RCL · ROLL]** | — | — | — | — |
| 870 | City Purpose (Then) | T | City Purpose (Then) **[RCL · ROLL]** | — | — | — | — |
| 871 | Gatekeeper Mood | T | Gatekeeper Mood **[RCL · ROLL]** | — | — | — | — |
| 872 | City Threats | T | City Threats **[RCL · ROLL]** | — | — | — | — |
| 873 | City Signs (Before Entering) | T | City Signs (Before Entering) **[RCL · ROLL]** | — | — | — | — |
| 874 | Neighborhood Type | T | Neighborhood Type **[RCL · ROLL]** | — | — | — | — |
| 875 | Neighborhood Mood | T | Neighborhood Mood **[RCL · ROLL]** | — | — | — | — |
| 876 | Neighborhood Sound | T | Neighborhood Sound **[RCL · ROLL]** | — | — | — | — |
| 877 | Neighborhood Smell | T | Neighborhood Smell **[RCL · ROLL]** | — | — | — | — |
| 878 | Neighborhood Activity | T | Neighborhood Activity **[RCL · ROLL]** | — | — | — | — |
| 879 | Neighborhood Attitude Toward Outsiders | T | Neighborhood Attitude Toward Outsiders **[RCL · ROLL]** | — | — | — | — |
| 880 | Neighborhood Problem | T | Neighborhood Problem **[RCL · ROLL]** | — | — | — | — |
| 881 | Neighborhood Secret | T | Neighborhood Secret **[RCL · ROLL]** | — | — | — | — |
| 882 | Street Size | T | Street Size **[RCL · ROLL]** | Settlement — Size, Name and Descriptor **[AitC · RUN]** | Settlement Size **[AitC · ROLL]** | — | — |
| 883 | Street Shape | T | Street Shape **[RCL · ROLL]** | — | — | — | — |
| 884 | Street Generation — Noise Level | T | Street Generation — Noise Level **[RCL · ROLL]** | — | — | — | — |
| 885 | Street Quality / Condition | T | Street Quality / Condition **[RCL · ROLL]** | — | — | — | — |
| 886 | Street Surface | T | Street Surface **[RCL · ROLL]** | — | — | — | — |
| 887 | Street Generation — Light Level | T | Street Generation — Light Level **[RCL · ROLL]** | — | — | — | — |
| 888 | Street Generation — Smell | T | Street Generation — Smell **[RCL · ROLL]** | — | — | — | — |
| 889 | Street Features | T | Street Features **[RCL · ROLL]** | Settlement — Size, Name and Descriptor **[AitC · RUN]** | — | — | — |
| 890 | Street Activity | T | Street Activity **[RCL · ROLL]** | — | — | — | — |
| 891 | Street Generation — Hazard | T | Street Generation — Hazard **[RCL · ROLL]** | — | — | — | — |
| 892 | Street Generation — Number Of Exits | T | Street Generation — Number Of Exits **[RCL · ROLL]** | — | — | — | — |
| 893 | Street Generation — Exit Type | T | Street Generation — Exit Type **[RCL · ROLL]** | — | — | — | — |
| 894 | Street Generation — Discovery | T | Street Generation — Discovery **[RCL · ROLL]** | — | — | — | — |
| 895 | Street Generation — Encounter | T | Street Generation — Encounter **[RCL · ROLL]** | — | — | — | — |
| 896 | Building Type | T | Building Type **[RCL · ROLL]** | Interior Locations — Hovel **[AitC · ROLL]** | Interior Locations — Mansion **[AitC · ROLL]** | Interior Locations — Townhouse **[AitC · ROLL]** | — |
| 897 | Exterior Impression | T | Exterior Impression **[RCL · ROLL]** | — | — | — | — |
| 898 | Notable Object | T | Notable Object **[RCL · ROLL]** | — | — | — | — |
| 899 | Interior Atmosphere | T | Interior Atmosphere **[RCL · ROLL]** | — | — | — | — |
| 900 | Activity Inside | T | Activity Inside **[RCL · ROLL]** | — | — | — | — |
| 901 | Hidden Element | T | Hidden Element **[RCL · ROLL]** | — | — | — | — |
| 902 | Minor Discoveries | T | Minor Discoveries **[RCL · ROLL]** | Minor Natural Discoveries **[RCL · ROLL]** | — | — | — |
| 903 | Significant Clues | T | Significant Clues **[RCL · ROLL]** | — | — | — | — |
| 904 | Rumors & Whispers | T | Rumors & Whispers **[RCL · ROLL]** | — | — | — | — |
| 905 | Urban Oddities | T | Urban Oddities **[RCL · ROLL]** | — | — | — | — |
| 906 | Social Discoveries | T | Social Discoveries **[RCL · ROLL]** | — | — | — | — |
| 907 | Physical Signs Of Trouble | T | Physical Signs Of Trouble **[RCL · ROLL]** | — | — | — | — |
| 908 | Signs Of The Undercity | T | Signs Of The Undercity **[RCL · ROLL]** | — | — | — | — |
| 909 | Temperature | T | Temperature **[RCL · ROLL]** | Air / Temperature **[RCL · ROLL]** | — | — | — |
| 910 | Precipitation | T | Precipitation **[RCL · ROLL]** | — | — | — | — |
| 911 | Wind | T | Wind **[RCL · ROLL]** | The Black Salt Wind — Wind Strength **[FER · ROLL]** | NPC Encounter 14 — Cursed Toy **[AitC · ROLL]** | — | — |
| 912 | Weather Shift | T | Weather Shift **[RCL · ROLL]** | — | — | — | — |
| 913 | Visibility | T | Visibility **[RCL · ROLL]** | Light & Visibility **[RCL · ROLL]** | — | — | — |
| 914 | Unnatural Weather | T | Unnatural Weather **[RCL · ROLL]** | — | — | — | — |
| 915 | Weather Omen Signs | T | Weather Omen Signs **[RCL · ROLL]** | — | — | — | — |
| 916 | Minor Natural Discoveries | T | Minor Natural Discoveries **[RCL · ROLL]** | — | — | — | — |
| 917 | Random Table | T | Random Table **[RCL · ROLL]** | Random Event Focus Table **[MGE2 · ROLL]** | Rotblack Sludge — Random Encounters — Table A **[MB-F · ROLL]** | Rotblack Sludge — Random Encounters — Table B **[MB-F · ROLL]** | — |
| 918 | Remains & Ruins | T | Remains & Ruins **[RCL · ROLL]** | — | — | — | — |
| 919 | Signs Of Travelers | T | Signs Of Travelers **[RCL · ROLL]** | — | — | — | — |
| 920 | Natural Oddities | T | Natural Oddities **[RCL · ROLL]** | — | — | — | — |
| 921 | Threat Signs | T | Threat Signs **[RCL · ROLL]** | Human Threat Signs **[RCL · ROLL]** | — | — | — |
| 922 | Strange Omens | T | Strange Omens **[RCL · ROLL]** | — | — | — | — |
| 923 | Signs Of Lost People | T | Signs Of Lost People **[RCL · ROLL]** | — | — | — | — |
| 924 | Wild Resource Discoveries | T | Wild Resource Discoveries **[RCL · ROLL]** | — | — | — | — |
| 925 | Ruinous Landmarks | T | Ruinous Landmarks **[RCL · ROLL]** | — | — | — | — |
| 926 | Major Natural Landmarks | T | Major Natural Landmarks **[RCL · ROLL]** | — | — | — | — |
| 927 | Strange Landmarks | T | Strange Landmarks **[RCL · ROLL]** | — | — | — | — |
| 928 | Landmark Presence | T | Landmark Presence **[RCL · ROLL]** | — | — | — | — |
| 929 | Water Landmarks | T | Water Landmarks **[RCL · ROLL]** | — | — | — | — |
| 930 | Elevation Features | T | Elevation Features **[RCL · ROLL]** | — | — | — | — |
| 931 | Landmark Purpose | T | Landmark Purpose **[RCL · ROLL]** | — | — | — | — |
| 932 | Landmark Condition | T | Landmark Condition **[RCL · ROLL]** | — | — | — | — |
| 933 | Monstrous Signs | T | Monstrous Signs **[RCL · ROLL]** | — | — | — | — |
| 934 | Large Creature Signs | T | Large Creature Signs **[RCL · ROLL]** | — | — | — | — |
| 935 | Signs Of Ambush | T | Signs Of Ambush **[RCL · ROLL]** | — | — | — | — |
| 936 | Human Threat Signs | T | Human Threat Signs **[RCL · ROLL]** | — | — | — | — |
| 937 | Signs Of Stalking | T | Signs Of Stalking **[RCL · ROLL]** | — | — | — | — |
| 938 | Signs Of Infestation | T | Signs Of Infestation **[RCL · ROLL]** | — | — | — | — |
| 939 | Natural Hazards | T | Natural Hazards **[RCL · ROLL]** | — | — | — | — |
| 940 | Weather-Driven Hazards | T | Weather-Driven Hazards **[RCL · ROLL]** | — | — | — | — |
| 941 | Terrain Dangers | T | Terrain Dangers **[RCL · ROLL]** | — | — | — | — |
| 942 | Wildlife Hazards (Non- Combat) | T | Wildlife Hazards (Non- Combat) **[RCL · ROLL]** | — | — | — | — |
| 943 | Resource-Loss Hazards | T | Resource-Loss Hazards **[RCL · ROLL]** | — | — | — | — |
| 944 | Unnatural Hazards | T | Unnatural Hazards **[RCL · ROLL]** | — | — | — | — |
| 945 | Travel-Cost Hazards | T | Travel-Cost Hazards **[RCL · ROLL]** | — | — | — | — |
| 946 | False Security / Misleading Hazards | T | False Security / Misleading Hazards **[RCL · ROLL]** | — | — | — | — |
| 947 | Village Names | T | Village Names **[RCL · ROLL]** | — | — | — | — |
| 948 | Landmark Names | T | Landmark Names **[RCL · ROLL]** | — | — | — | — |
| 949 | Tavern Names | T | Tavern Names **[RCL · ROLL]** | — | — | — | — |
| 950 | Npc Surnames | T | Npc Surnames **[RCL · ROLL]** | — | — | — | — |
| 951 | Npc First Names | T | Npc First Names **[RCL · ROLL]** | — | — | — | — |
| 952 | Street Generation — Buildings / Lots | T | Street Generation — Buildings / Lots **[RCL · ROLL]** | — | — | — | — |
| 953 | City Names | T | City Names **[RCL · ROLL]** | — | — | — | — |
| 954 | Region Names | T | Region Names **[RCL · ROLL]** | — | — | — | — |
| 955 | Quick Street Generator — Street Type | T | Quick Street Generator — Street Type **[RCL · ROLL]** | — | — | — | — |
| 956 | Quick Street Generator — Atmosphere | T | Quick Street Generator — Atmosphere **[RCL · ROLL]** | — | — | — | — |
| 957 | Quick Street Generator — Feature | T | Quick Street Generator — Feature **[RCL · ROLL]** | — | — | — | — |
| 958 | Quick Street Generator — Content | T | Quick Street Generator — Content **[RCL · ROLL]** | — | — | — | — |
| 959 | Quick Street Generator — Exits | T | Quick Street Generator — Exits **[RCL · ROLL]** | — | — | — | — |
| 960 | Graves Left Wanting — The Übertaker: Random Action | T | Graves Left Wanting — The Übertaker: Random Action **[HER · ROLL]** | — | — | — | — |
| 961 | The Merchant — Tveland Stock | T | The Merchant — Tveland Stock **[HER · ROLL]** | — | — | — | — |
| 962 | The Merchant — Wästland Stock | T | The Merchant — Wästland Stock **[HER · ROLL]** | — | — | — | — |
| 963 | The Merchant — Kergüs Stock | T | The Merchant — Kergüs Stock **[HER · ROLL]** | — | — | — | — |
| 964 | The Merchant — Grift Stock | T | The Merchant — Grift Stock **[HER · ROLL]** | — | — | — | — |
| 965 | Gear & Equipment List | T | Gear & Equipment List **[RCL · ROLL]** | — | — | — | — |
| 966 | Weapons Table | T | Weapons Table **[RCL · ROLL]** | — | — | — | — |
| 967 | Armor Table | T | Armor Table **[RCL · ROLL]** | — | — | — | — |
| 968 | Corruption | T | Corruption **[RCL · ROLL]** | — | — | — | — |
| 969 | Loot — Table I | T | Loot — Table I **[RCL · ROLL]** | Loot — Table II **[RCL · ROLL]** | — | — | — |
| 970 | Loot — Table II | T | Loot — Table II **[RCL · ROLL]** | — | — | — | — |
| 971 | The Ruined State | T | The Ruined State **[RCL · ROLL]** | — | — | — | — |
| 972 | Scarred | T | Scarred **[RCL · ROLL]** | — | — | — | — |
| 973 | Hireling Traits | T | Hireling Traits **[RCL · ROLL]** | — | — | — | — |
| 974 | Hirelings — Broken Morale | T | Hirelings — Broken Morale **[RCL · ROLL]** | — | — | — | — |
| 975 | Home Locations | T | Home Locations **[RCL · ROLL]** | — | — | — | — |
| 976 | Home Features | T | Home Features **[RCL · ROLL]** | — | — | — | — |
| 977 | Home Complications | T | Home Complications **[RCL · ROLL]** | — | — | — | — |
| 978 | While You’re Away | T | While You’re Away **[RCL · ROLL]** | — | — | — | — |
| 979 | Creature Type | T | Creature Type **[RCL · ROLL]** | Wildlife Type **[RCL · ROLL]** | — | — | — |
| 980 | Beasts — Armor Tier | T | Beasts — Armor Tier **[RCL · ROLL]** | — | — | — | — |
| 981 | Beasts — Appearance | T | Beasts — Appearance **[RCL · ROLL]** | — | — | — | — |
| 982 | Beasts — Morale | T | Beasts — Morale **[RCL · ROLL]** | — | — | — | — |
| 983 | Beasts — Damage Table | T | Beasts — Damage Table **[RCL · ROLL]** | — | — | — | — |
| 984 | Beasts — Behavior | T | Beasts — Behavior **[RCL · ROLL]** | — | — | — | — |
| 985 | Wildlife Type | T | Wildlife Type **[RCL · ROLL]** | — | — | — | — |
| 986 | Wildlife — Size | T | Wildlife — Size **[RCL · ROLL]** | — | — | — | — |
| 987 | Beasts — Size | T | Beasts — Size **[RCL · ROLL]** | — | — | — | — |
| 988 | Adventure Calls — What Sets Everything in Motion? | T | Adventure Calls — What Sets Everything in Motion? **[RCL · ROLL]** | — | — | — | — |
| 989 | Adventure Calls — Where Your Steps Must Lead | T | Adventure Calls — Where Your Steps Must Lead **[RCL · ROLL]** | — | — | — | — |
| 990 | Adventure Calls — The Heart of the Danger | T | Adventure Calls — The Heart of the Danger **[RCL · ROLL]** | — | — | — | — |
| 991 | Adventure Calls — Twist of the Blade | T | Adventure Calls — Twist of the Blade **[RCL · ROLL]** | — | — | — | — |
| 992 | Hirelings — Death and Desertion | T | Hirelings — Death and Desertion **[RCL · ROLL]** | — | — | — | — |
| 993 | Archetype | T | Archetype **[RCL · ROLL]** | Defiler — Archetype Skills **[RCL · ROLL]** | Fanatic — Archetype Skills **[RCL · ROLL]** | Venom — Archetype Skills **[RCL · ROLL]** | Vessel — Archetype Skills **[RCL · ROLL]** |
| 994 | Corpse Plundering | T | Corpse **[MB-BB · ROLL]** | — | — | — | — |
| 995 | The Calendar of Nechrubel — Miseries | T | The Calendar of Nechrubel — Miseries **[MB-BB · ROLL]** | — | — | — | — |
| 996 | Broken | T | Broken / Death · 무력화와 죽음 **[MB-BB · OPEN]** | Broken **[MB-BB · ROLL]** | Broken — Injury **[MB-BB · ROLL]** | Broken Bodies **[MB-BB · ROLL]** | Hirelings — Broken Morale **[RCL · ROLL]** |
| 997 | Initiative | T | Initiative **[MB-BB · ROLL]** | — | — | — | — |
| 998 | Reaction | T | Reaction **[MB-BB · ROLL]** | City Gate — Guards Reaction **[AitC · ROLL]** | Get Directions — Weak Hit Reaction **[AitC · ROLL]** | NPC Encounter 23 — Soldier Reaction Modifier **[AitC · ROLL]** | Morale **[MB-BB · OPEN]** |
| 999 | Failed Morale | T | Failed Morale **[MB-BB · ROLL]** | — | — | — | — |
| 1000 | Left in the Debris You Find | T | Left in the Debris You Find **[MB-BB · ROLL]** | — | — | — | — |
| 1001 | The Basilisks Demand | T | The Basilisks Demand **[MB-BB · ROLL]** | — | — | — | — |
| 1002 | Bad Habits | T | Bad Habits **[MB-BB · ROLL]** | — | — | — | — |
| 1003 | Troubling Tales | T | Troubling Tales **[MB-BB · ROLL]** | — | — | — | — |
| 1004 | Arcane Catastrophes | T | Arcane Catastrophes **[MB-BB · ROLL]** | — | — | — | — |
| 1005 | Where Do You Wander? | T | Where Do You Wander? **[MB-BB · ROLL]** | — | — | — | — |
| 1006 | Broken — Injury | T | Broken — Injury **[MB-BB · ROLL]** | — | — | — | — |
| 1007 | Foul Psychompomp — Summon | T | Foul Psychompomp — Summon **[MB-BB · ROLL]** | — | — | — | — |
| 1008 | Cube-Violet — To Leave | T | Cube-Violet — To Leave **[MB-BB · ROLL]** | — | — | — | — |
| 1009 | Fanged Deserter — Earliest Memories | T | Fanged Deserter — Earliest Memories **[MB-BB · ROLL]** | — | — | — | — |
| 1010 | Gutterborn Scum — Bad Birth | T | Gutterborn Scum — Bad Birth **[MB-BB · ROLL]** | — | — | — | — |
| 1011 | Esoteric Hermit — Eldritch Origins | T | Esoteric Hermit — Eldritch Origins **[MB-BB · ROLL]** | — | — | — | — |
| 1012 | Wretched Royalty — Things Were Going So Well, Until... | T | Wretched Royalty — Things Were Going So Well, Until... **[MB-BB · ROLL]** | — | — | — | — |
| 1013 | Heretical Priest — Unholy Origins | T | Heretical Priest — Unholy Origins **[MB-BB · OPEN]** | — | — | — | — |
| 1014 | Occult Herbmaster — Probably Raised In | T | Occult Herbmaster — Probably Raised In **[MB-BB · ROLL]** | — | — | — | — |
| 1015 | Occult Herbmaster Decoctions | T | Occult Herbmaster Decoctions **[MB-BB · ROLL]** | — | — | — | — |
| 1016 | Fanged Deserter — You Also Begin With | T | Fanged Deserter — You Also Begin With **[MB-BB · ROLL]** | — | — | — | — |
| 1017 | Gutterborn Scum — Specialty | T | Gutterborn Scum — Specialty **[MB-BB · ROLL]** | — | — | — | — |
| 1018 | Esoteric Hermit — You Also Begin With | T | Esoteric Hermit — You Also Begin With **[MB-BB · ROLL]** | — | — | — | — |
| 1019 | Wretched Royalty — You Begin With Two | T | Wretched Royalty — You Begin With Two **[MB-BB · ROLL]** | — | — | — | — |
| 1020 | Heretical Priest — You Begin With One | T | Heretical Priest — You Begin With One **[MB-BB · ROLL]** | — | — | — | — |
| 1021 | The Tenebrous Reliquary — Items of Doom | T | The Tenebrous Reliquary — Items of Doom **[FER · ROLL]** | — | — | — | — |
| 1022 | Pale One — You Call Yourself — First Column | T | Pale One — You Call Yourself — First Column **[FER · ROLL]** | — | — | — | — |
| 1023 | Pale One — You Call Yourself — Second Column | T | Pale One — You Call Yourself — Second Column **[FER · ROLL]** | — | — | — | — |
| 1024 | Pale One — You Call Yourself — Third Column | T | Pale One — You Call Yourself — Third Column **[FER · ROLL]** | — | — | — | — |
| 1025 | Name Your God — First Column | T | Name Your God — First Column **[FER · ROLL]** | — | — | — | — |
| 1026 | Name Your God — Second Column | T | Name Your God — Second Column **[FER · ROLL]** | — | — | — | — |
| 1027 | Name Your God — Third Column | T | Name Your God — Third Column **[FER · ROLL]** | — | — | — | — |
| 1028 | The Tablets of Ochre Obscurity | T | The Tablets of Ochre Obscurity **[FER · OPEN]** | — | — | — | — |
| 1029 | Rotblack Sludge — Random Encounters — Table A | T | Rotblack Sludge — Random Encounters — Table A **[MB-F · ROLL]** | — | — | — | — |
| 1030 | Rotblack Sludge — Random Encounters — Table B | T | Rotblack Sludge — Random Encounters — Table B **[MB-F · ROLL]** | Rotblack Sludge — Random Encounters — Table A **[MB-F · ROLL]** | — | — | — |
| 1031 | Rotblack Sludge — Study the Books More Closely | T | Rotblack Sludge — Study the Books More Closely **[MB-F · ROLL]** | — | — | — | — |
| 1032 | Rotblack Sludge — Ransack the Room | T | Rotblack Sludge — Ransack the Room **[MB-F · ROLL]** | — | — | — | — |
| 1033 | Fletcher — Powers | T | Fletcher — Powers **[MB-F · ROLL]** | — | — | — | — |
| 1034 | Defiler — School of Defilement | T | Defiler — School of Defilement **[RCL · ROLL]** | — | — | — | — |
| 1035 | Defiler — Starting Ritual | T | Defiler — Starting Ritual **[RCL · ROLL]** | — | — | — | — |
| 1036 | Defiler — Archetype Skills | T | Defiler — Archetype Skills **[RCL · ROLL]** | — | — | — | — |
| 1037 | Venom — Method of Murder | T | Venom — Method of Murder **[RCL · ROLL]** | — | — | — | — |
| 1038 | Venom — Starting Kill | T | Venom — Starting Kill **[RCL · ROLL]** | — | — | — | — |
| 1039 | Venom — Archetype Skills | T | Venom — Archetype Skills **[RCL · ROLL]** | — | — | — | — |
| 1040 | Brute — Path of Pain | T | Brute — Path of Pain **[RCL · ROLL]** | — | — | — | — |
| 1041 | Brute — Starting Rite | T | Brute — Starting Rite **[RCL · ROLL]** | — | — | — | — |
| 1042 | Brute — Archetype Skills | T | Brute — Archetype Skills **[RCL · OPEN]** | — | — | — | — |
| 1043 | Vessel — Source of Leakage | T | Vessel — Source of Leakage **[RCL · ROLL]** | — | — | — | — |
| 1044 | Vessel — Starting Ritual | T | Vessel — Starting Ritual **[RCL · ROLL]** | — | — | — | — |
| 1045 | Vessel — Archetype Skills | T | Vessel — Archetype Skills **[RCL · ROLL]** | — | — | — | — |
| 1046 | Beast — Aspect of the Land | T | Beast — Aspect of the Land **[RCL · ROLL]** | — | — | — | — |
| 1047 | Beast — Starting Lore | T | Beast — Starting Lore **[RCL · ROLL]** | — | — | — | — |
| 1048 | Beast — Archetype Skills | T | Beast — Archetype Skills **[RCL · OPEN]** | — | — | — | — |
| 1049 | Fanatic — Prayer of the Day | T | Fanatic — Prayer of the Day **[RCL · ROLL]** | — | — | — | — |
| 1050 | Fanatic — Starting Doctrine | T | Fanatic — Starting Doctrine **[RCL · ROLL]** | — | — | — | — |
| 1051 | Fanatic — Archetype Skills | T | Fanatic — Archetype Skills **[RCL · ROLL]** | — | — | — | — |
| 1052 | City Crawl — Failure | T | City Crawl — Failure **[AitC · ROLL]** | — | — | — | — |
| 1053 | Get Directions — Weak Hit Reaction | T | Get Directions — Weak Hit Reaction **[AitC · ROLL]** | — | — | — | — |
| 1054 | Pray — Strong Hit | T | Pray — Strong Hit **[AitC · ROLL]** | — | — | — | — |
| 1055 | Pray — Failure | T | Pray — Failure **[AitC · ROLL]** | — | — | — | — |
| 1056 | Stash Item — Weak Hit | T | Stash Item — Weak Hit **[AitC · ROLL]** | — | — | — | — |
| 1057 | Animals | T | Animals **[AitC · ROLL]** | Unexpected Events — Hunting Party **[AitC · ROLL]** | — | — | — |
| 1058 | Civic Buildings | T | Civic Buildings **[AitC · ROLL]** | — | — | — | — |
| 1059 | City Gate — Guards Reaction | T | City Gate — Guards Reaction **[AitC · ROLL]** | — | — | — | — |
| 1060 | Festivals — Adjective | T | Festivals — Adjective **[AitC · ROLL]** | Festival name **[AitC · RUN]** | — | — | — |
| 1061 | Festivals — Subject | T | Festivals — Subject **[AitC · ROLL]** | Festival name **[AitC · RUN]** | — | — | — |
| 1062 | Gatherings | T | Gatherings **[AitC · ROLL]** | Gatherings — Contest **[AitC · ROLL]** | Gatherings — Funeral Mourners **[AitC · ROLL]** | Gatherings — Riot Complication **[AitC · ROLL]** | Gatherings — Spectacle **[AitC · ROLL]** |
| 1063 | Gatherings — Funeral Mourners | T | Gatherings — Funeral Mourners **[AitC · ROLL]** | — | — | — | — |
| 1064 | Gatherings — Contest | T | Gatherings — Contest **[AitC · ROLL]** | — | — | — | — |
| 1065 | Gatherings — Spectacle | T | Gatherings — Spectacle **[AitC · ROLL]** | — | — | — | — |
| 1066 | Gatherings — Riot Complication | T | Gatherings — Riot Complication **[AitC · ROLL]** | — | — | — | — |
| 1067 | Hazards | T | Hazards **[AitC · ROLL]** | False Security / Misleading Hazards **[RCL · ROLL]** | Natural Hazards **[RCL · ROLL]** | Resource-Loss Hazards **[RCL · ROLL]** | Travel-Cost Hazards **[RCL · ROLL]** |
| 1068 | Holy Places — Villages and Smaller | T | Holy Places — Villages and Smaller **[AitC · ROLL]** | Holy Places — Cities and Larger **[AitC · ROLL]** | — | — | — |
| 1069 | Holy Places — Cities and Larger | T | Holy Places — Cities and Larger **[AitC · ROLL]** | Holy Places — Villages and Smaller **[AitC · ROLL]** | — | — | — |
| 1070 | Interior Locations — Hovel | T | Interior Locations — Hovel **[AitC · ROLL]** | — | — | — | — |
| 1071 | Interior Locations — Townhouse | T | Interior Locations — Townhouse **[AitC · ROLL]** | — | — | — | — |
| 1072 | Interior Locations — Mansion | T | Interior Locations — Mansion **[AitC · ROLL]** | — | — | — | — |
| 1073 | Merchant Dispositions | T | Merchant Dispositions **[AitC · OPEN]** | — | — | — | — |
| 1074 | Notable Artefacts — Type | T | Notable Artefacts — Type **[AitC · ROLL]** | Notable Artefacts — Book/Manuscript Concerning **[AitC · ROLL]** | Notable Artefacts — Depicting Composition **[AitC · ROLL]** | Notable Artefacts — Depicting Descriptor **[AitC · ROLL]** | Notable Artefacts — Depicting Subject / Effect **[AitC · ROLL]** |
| 1075 | Notable Artefacts — Book/Manuscript Concerning | T | Notable Artefacts — Book/Manuscript Concerning **[AitC · ROLL]** | — | — | — | — |
| 1076 | Notable Artefacts — Depicting Composition | T | Notable Artefacts — Depicting Composition **[AitC · ROLL]** | Notable Artefact — Picture/Sculpture Depiction **[AitC · RUN]** | — | — | — |
| 1077 | Notable Artefacts — Depicting Descriptor | T | Notable Artefacts — Depicting Descriptor **[AitC · ROLL]** | Notable Artefact — Picture/Sculpture Depiction **[AitC · RUN]** | — | — | — |
| 1078 | Notable Artefacts — Depicting Subject / Effect | T | Notable Artefacts — Depicting Subject / Effect **[AitC · ROLL]** | Notable Artefact — Picture/Sculpture Depiction **[AitC · RUN]** | — | — | — |
| 1079 | Notable Artefacts — Sculpture Size | T | Notable Artefacts — Sculpture Size **[AitC · ROLL]** | Notable Artefact — Picture/Sculpture Depiction **[AitC · RUN]** | — | — | — |
| 1080 | Settlement Descriptor | T | Settlement Descriptor **[AitC · ROLL]** | Settlement — Size, Name and Descriptor **[AitC · RUN]** | Notable Artefacts — Depicting Descriptor **[AitC · ROLL]** | — | — |
| 1081 | Settlement Name — Prefix | T | Settlement Name — Prefix **[AitC · ROLL]** | Settlement — Size, Name and Descriptor **[AitC · RUN]** | Settlement Name **[AitC · RUN]** | — | — |
| 1082 | Settlement Name — Suffix | T | Settlement Name — Suffix **[AitC · ROLL]** | Settlement — Size, Name and Descriptor **[AitC · RUN]** | Settlement Name **[AitC · RUN]** | — | — |
| 1083 | Settlement Size | T | Settlement Size **[AitC · ROLL]** | Settlement — Size, Name and Descriptor **[AitC · RUN]** | Notable Artefacts — Sculpture Size **[AitC · ROLL]** | — | — |
| 1084 | Special Structures — Villages and Smaller | T | Special Structures — Villages and Smaller **[AitC · ROLL]** | — | — | — | — |
| 1085 | Special Structures — Towns and Larger | T | Special Structures — Towns and Larger **[AitC · ROLL]** | — | — | — | — |
| 1086 | Taverns | T | Taverns **[AitC · ROLL]** | — | — | — | — |
| 1087 | Unexpected Events | T | Unexpected Events **[AitC · ROLL]** | Unexpected Events — Falling Object **[AitC · ROLL]** | Unexpected Events — Hunting Party **[AitC · ROLL]** | — | — |
| 1088 | Unexpected Events — Falling Object | T | Unexpected Events — Falling Object **[AitC · ROLL]** | — | — | — | — |
| 1089 | Unexpected Events — Hunting Party | T | Unexpected Events — Hunting Party **[AitC · ROLL]** | — | — | — | — |
| 1090 | Businesses | T | Businesses **[AitC · ROLL]** | NPC Encounter 45 — Servant **[AitC · ROLL]** | — | — | — |
| 1091 | NPC Encounters | T | NPC Encounters **[AitC · ROLL]** | NPC Encounters — Default Armour **[AitC · ROLL]** | NPC Encounters — Default Damage **[AitC · ROLL]** | Backtracking **[AitC · ROLL]** | — |
| 1092 | NPC Encounter 13 — Musician | T | NPC Encounter 13 — Musician **[AitC · ROLL]** | — | — | — | — |
| 1093 | NPC Encounter 14 — Cursed Toy | T | NPC Encounter 14 — Cursed Toy **[AitC · ROLL]** | — | — | — | — |
| 1094 | NPC Encounter 15 — Prophet | T | NPC Encounter 15 — Prophet **[AitC · ROLL]** | — | — | — | — |
| 1095 | NPC Encounter 23 — Soldier Reaction Modifier | T | NPC Encounter 23 — Soldier Reaction Modifier **[AitC · ROLL]** | — | — | — | — |
| 1096 | NPC Encounter 24 — Beggar | T | NPC Encounter 24 — Beggar **[AitC · ROLL]** | — | — | — | — |
| 1097 | NPC Encounter 26 — Wounded Person | T | NPC Encounter 26 — Wounded Person **[AitC · ROLL]** | — | — | — | — |
| 1098 | NPC Encounter 45 — Servant | T | NPC Encounter 45 — Servant **[AitC · ROLL]** | — | — | — | — |
| 1099 | NPC Encounter 46 — Mugger | T | NPC Encounter 46 — Mugger **[AitC · ROLL]** | — | — | — | — |
| 1100 | NPC Encounter 51 — Pilgrim | T | NPC Encounter 51 — Pilgrim **[AitC · ROLL]** | — | — | — | — |
| 1101 | NPC Encounter 53 — Demonologist’s Imp | T | NPC Encounter 53 — Demonologist’s Imp **[AitC · ROLL]** | — | — | — | — |
| 1102 | NPC Encounter 55 — Fence Weapon | T | NPC Encounter 55 — Fence Weapon **[AitC · ROLL]** | — | — | — | — |
| 1103 | NPC Encounter 56 — Poet | T | NPC Encounter 56 — Poet **[AitC · ROLL]** | — | — | — | — |
| 1104 | NPC Encounters — Default Armour | T | NPC Encounters — Default Armour **[AitC · ROLL]** | — | — | — | — |
| 1105 | NPC Encounters — Default Damage | T | NPC Encounters — Default Damage **[AitC · ROLL]** | — | — | — | — |
| 1106 | Street Adjective | T | Street Adjective **[AitC · ROLL]** | Street — Adjective and Type **[AitC · RUN]** | Street — Adjective, Type and Contents **[AitC · RUN]** | — | — |
| 1107 | Street Type | T | Street Type **[AitC · ROLL]** | Quick Street Generator — Street Type **[RCL · ROLL]** | Street — Adjective and Type **[AitC · RUN]** | Street — Adjective, Type and Contents **[AitC · RUN]** | Street Generation — Exit Type **[RCL · ROLL]** |
| 1108 | Street Exits | T | Street Exits **[AitC · ROLL]** | Quick Street Generator — Exits **[RCL · ROLL]** | Street Generation — Number Of Exits **[RCL · ROLL]** | Street — Adjective, Type and Contents **[AitC · RUN]** | — |
| 1109 | Street Contents | T | Street Contents **[AitC · ROLL]** | Street — Adjective, Type and Contents **[AitC · RUN]** | — | — | — |
| 1110 | Backtracking | T | Backtracking **[AitC · ROLL]** | — | — | — | — |
| 1111 | Eat Prey Kill · Tveland | T | Eat Prey Kill · Tveland **[FER · ROLL]** | — | — | — | — |
| 1112 | Eat Prey Kill · Sarkash | T | Eat Prey Kill · Sarkash **[FER · ROLL]** | Carrion Owls **[FER · OPEN]** | Dredgehog **[FER · OPEN]** | Howler Bears **[FER · OPEN]** | Mulch-Squirrels **[FER · OPEN]** |
| 1113 | Eat Prey Kill · Graven-Tosk | T | Eat Prey Kill · Graven-Tosk **[FER · ROLL]** | Giant Skull Moth **[FER · OPEN]** | Grim-Toothed Squirrel **[FER · OPEN]** | Half-Billed Raven **[FER · OPEN]** | Meatroach **[FER · OPEN]** |
| 1114 | Eat Prey Kill · Grift | T | Eat Prey Kill · Grift **[FER · ROLL]** | Grift **[FER · OPEN]** | Cellar Crabs **[FER · OPEN]** | Grift · Regional Monsters **[OPEN]** | Lentil Lice **[FER · OPEN]** |
| 1115 | Eat Prey Kill · Kergüs | T | Eat Prey Kill · Kergüs **[FER · ROLL]** | Blubber Gulls **[FER · OPEN]** | False Seal **[FER · OPEN]** | Flail-Horned Muskox **[FER · OPEN]** | Megasloths **[FER · OPEN]** |
| 1116 | Eat Prey Kill · Wästland | T | Eat Prey Kill · Wästland **[FER · ROLL]** | Bautaboar **[FER · OPEN]** | Feather Fox **[FER · OPEN]** | Gold-Crested Filth-Crow **[FER · OPEN]** | Liar-Bird **[FER · OPEN]** |
| 1117 | Eat Prey Kill · Lake Onda | T | Eat Prey Kill · Lake Onda **[FER · ROLL]** | — | — | — | — |
| 1118 | Eat Prey Kill · Valley of the Unfortunate Undead | T | Eat Prey Kill · Valley of the Unfortunate Undead **[FER · ROLL]** | Bonemare **[FER · OPEN]** | Gravelings **[FER · OPEN]** | Grubstopper **[FER · OPEN]** | Marrow Sparrow **[FER · OPEN]** |
| 1119 | Eat Prey Kill · Bergen Chrypt | T | Eat Prey Kill · Bergen Chrypt **[FER · ROLL]** | — | — | — | — |
| 1120 | All dream of | T | All dream of **[FER · ROLL]** | — | — | — | — |
| 1121 | sacred scroll | U | Sacred Scrolls **[MB-BB · ROLL]** | — | — | — | — |
| 1122 | encounter | U | 10C. Encounter **[RCL · ROLL]** | Determining the Encounter **[DEP · ROLL]** | Encounter Prep **[SD · OPEN]** | Encounter Context **[RCL · ROLL]** | Graves Left Wanting — Random Encounter **[HER · ROLL]** |
| 1123 | get directions | U | Get Directions — Weak Hit Reaction **[AitC · ROLL]** | — | — | — | — |
| 1124 | pray | U | Pray — Failure **[AitC · ROLL]** | Pray — Strong Hit **[AitC · ROLL]** | Fanatic — Prayer of the Day **[RCL · ROLL]** | — | — |
| 1125 | Mythic Actions | U | Animal Actions **[MGE2 · ROLL]** | Animal Actions · Meaning pair **[MGE2 · RUN]** | Character Actions, Combat **[MGE2 · ROLL]** | Character Actions, Combat · Meaning pair **[MGE2 · RUN]** | Character Actions, General **[MGE2 · ROLL]** |
| 1126 | combat | U | Character Actions, Combat **[MGE2 · ROLL]** | Character Actions, Combat · Meaning pair **[MGE2 · RUN]** | Core Combat · 선공과 공격·방어 **[MB-BB · OPEN]** | Enemy Combat Modifiers **[DEP · ROLL]** | RCL Combat · 전투장 참조 **[RCL · OPEN]** |
| 1127 | crit | U | Crit / Fumble · 전투의 20과 1 **[MB-BB · OPEN]** | Using Powers · 권능 사용 판정 **[MB-BB · OPEN]** | — | — | — |
| 1128 | medicine chest | U | — | — | — | — | — |
| 1129 | light armor | U | — | — | — | — | — |
| 1130 | Equipment | U | Gear & Equipment List **[RCL · ROLL]** | Starting Equipment — Container **[MB-BB · ROLL]** | Starting Equipment — First d12 Table **[MB-BB · ROLL]** | Starting Equipment — Second d12 Table **[MB-BB · ROLL]** | — |
| 1131 | Ancient gore-hound | U | — | — | — | — | — |
| 1132 | Starting Equipment Second | U | Starting Equipment — Second d12 Table **[MB-BB · ROLL]** | — | — | — | — |
