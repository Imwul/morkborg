# Batch 3: targeted Core source verification

Verified against supplied sources and the production reference seeds at baseline `11e86737cce0dac67c269537e07fedb84d189e97`. This is a targeted check of ordinary Core needs, not a new page-by-page audit. Historical classifications remain historical until the Batch 3 browser recheck establishes the current access quality.

Sources: the existing extracted `core.json` and `core-full.json`, matched to the original PDFs in `docs/pdf-escape-audit/data/source-inventory.json`. Bare Bones PDF pages 28 and 31, and Full Edition PDF pages 34 and 59 were also rendered and visually read. The render evidence remains private under `outputs/pdf-remediation-batch-3/source-pages/`.

The wording below is a concise implementation suggestion, except where the difficulty ladder preserves the exact source labels. Korean is secondary translation; the English source titles and canonical IDs remain unchanged.

| Need / related audit ID | Bare Bones PDF / printed | Full Edition PDF / printed | Current reference finding | Source constraint / minimal intervention |
| --- | --- | --- | --- | --- |
| Difficulty / `core-difficulty-scale` | 28 / 28 | 30 / 26 | `rule:core.tests` gives normal DR12 only. | Add the seven-entry source ladder to the existing rule. No difficulty recommender. |
| Round and movement / `core-round-duration` | 31 / 31 | 34 / unnumbered page between printed 29 and 31 | `rule:core.violence` omits the timing paragraph. | One attack **or** Power, **and** traverse a normal-sized room; usually ten rounds/minute. No numeric movement distance is supplied. |
| Starvation / `core-starvation` | 31 / 31 | 35 / 31 | Mechanic exists inside `rule:core.rest`; discoverability needs browser confirmation. | Food **or** drink absence prevents rest healing; after two days a starving PC loses d4 HP/day. No independent dehydration die or separate water clock is supplied here. |
| Infection / `core-infection` | 31 / 31 | 35 / 31 | Mechanic exists inside `rule:core.rest`; discoverability needs browser confirmation. | No benefit from resting; lose d6 HP daily. Link the existing Medicine box definition for treatment. |
| Rest / `core-rest` | 31 / 31 | 35 / 31 | Existing d4/d6 amounts are correct. | Short rest includes catching one's breath **and having a drink**. Do not invent a five-minute Core duration. |
| Carrying / `core-carrying` | 28 / 28 | 31 / 27 | Existing capacity and DR penalty are correct; saved-Character context access is separate. | Strength + 8 normal-sized items; beyond that, Strength/Agility tests DR +2; hard maximum twice the normal capacity. The source excludes anvils, chests, ladders, corpses from normal-sized examples; it gives no slot conversion for them. |
| Get Better / `core-improvement` | 33 / 33 | 37 / 33 | Existing rule's d6=1 special case is mechanically correct. | Keep GM timing, 6d10 maximum-HP comparison, d6 maximum-HP gain, per-ability checks and debris table. Improve lookup rather than automate advancement. |
| Broken / `core-hp-broken`, `core-broken-results` | 29 / 29 | 32–33 / 28–29 | Existing rule says exact zero Broken, negative HP death and links both outcome tables. | Keep exact-zero/negative distinction; do not substitute RECLVSE recovery. |
| Initiative, attack, defence / existing Core violence rule | 30 / 30 | 33 / 29 | Existing normal DRs and initiative are correct. | Group initiative d6; individual Agility+d6; PC rolls attack and defence; enemies ordinarily attack once/round. |
| Combat critical/fumble / `core-crit-fumble` | 31 / 31 | 33 / 29 | Existing results are correct; ordinary exact query may route to RECLVSE instead. | Preserve attack/defence distinction and persistent damaged-armor penalties. Link armor repair prices. |
| Reaction / `core-reaction` | 32 / 32 | 35 / 31 | Existing canonical table is appropriate. | Roll when reaction is uncertain; do not make it mandatory for every encounter. |
| Morale / `core-morale` | 32 / 32 | 35 / 31 | Existing Core trigger/comparison text is correct. | Failure requires 2d6 **greater than**, not equal to, Morale. Failure d6: 1–3 flee, 4–6 surrender. |
| Core fleeing / ability-use boundary | 27 / 27; 28 / 28; 31 / 31 | 30 / 26; 34 / unnumbered | The only dedicated flee procedure currently present is explicitly SD. | Core lists fleeing under Agility. General tests choose a DR; the checked Core text gives no separate fixed flee DR, opportunity-attack sequence or chase-distance rule. Do not copy SD's DR11+enemy count into Core. |
| Scroll restrictions / `core-scroll-restrictions` | 23, 54 / 23, 54 | 28, 59 / 24, 55 | General restriction is correct. The Priest exception is not beside it. | Two-handed weapons or medium/heavy armor prevent scrolls; Heretical Priest specifically permits Powers in **medium** armor. This is not permission for heavy armor or two-handed weapons. Link the canonical Class. |
| Daily Powers / `core-powers-daily` (historically resolved, direct regression dependency) | 34 / 34 | 38 / 34 | Historical matrix points to `rule:core.omens`; that line is now absent there and from `rule:core.casting`. Only Character calculation still exists. | Restore **each morning Presence+d4** daily uses in the existing casting rule. Do not count this as closure of one of the inherited 401. |
| Repeated catastrophe / `core-catastrophe-repeat` | 43 / 43 | 49 / 45 | Historical finding identifies incomplete global table guidance; preserve as its own audited candidate. | Same result twice makes the caster explode in black fire: d6 damage each round; water feeds it. Do not invent duration, saving throw, extinguishing rule or repeat-reset window. |
| Services / `core-service-*` | 25 / 25 | 29 / 25 | No concise Core service catalog in the inherited findings. | One compact catalog can cover meals, lodging, drinks, bribes and armor repairs. These are purchase figures, not random encounter generation. |
| Ammunition / `core-purchase-20-arrows`, `core-purchase-10-bolts` | 26 / 26 | 29 / 25 | Named purchase quantities/prices missing from the inherited reference catalog. | 20 arrows cost 10s; 10 bolts cost 10s. Do not infer ammunition recovery or reload rules. |
| Beasts / `core-purchase-dog-trained`, `core-purchase-dog-wild`, `core-purchase-horse`, `core-purchase-mule`, `core-purchase-rat-tame` | 26 / 26 | 29 / 25 | Purchase prices are separate from companion generation. | If included in the same price catalog, retain prices only; do not synthesize generic beast stats. |

## Verified difficulty ladder

| DR | Original source label | Korean helper |
| --- | --- | --- |
| 6 | so simple people laugh at you for failing | 실패하면 비웃음을 살 만큼 쉬움 |
| 8 | routine but some chance of failure | 일상적이지만 실패할 수도 있음 |
| 10 | pretty simple but not simple enough to not roll | 꽤 쉽지만 굴림은 필요함 |
| 12 | normal | 보통 |
| 14 | difficult | 어려움 |
| 16 | really hard | 매우 어려움 |
| 18 | should not be possible | 불가능해야 할 정도 |

Suggested test reminder: **Roll d20 + ability; meet or exceed the DR. Creatures use a plain d20 for tests.**

한국어: **d20에 능력 보정을 더해 DR 이상이면 성공합니다. 생물의 일반 판정은 능력 보정 없이 d20을 굴립니다.** The separate combat rule must remain clear: PCs roll both attack and defence; this general creature-test line does not make enemies roll attacks.

## Bilingual mechanic suggestions

**Round / movement.** A round allows an attack or a Power, and movement across a normal-sized room. Usually 10 rounds make one minute. Movement is described by room size here, not meters or feet.

**라운드 / 이동.** 한 라운드에 공격하거나 권능을 사용하고, 보통 크기의 방 하나를 가로질러 이동할 수 있습니다. 보통 10라운드가 1분입니다. 이 규칙은 이동을 방 크기로 설명하며, 미터나 피트 단위의 이동거리를 정하지 않습니다.

**Rest / food / infection.** Catch your breath and have a drink: recover d4 HP. A full night's sleep: d6 HP. Without food or drink, resting restores no HP; after two days a starving PC loses d4 HP each day. Infection prevents rest recovery and causes d6 HP loss daily.

**휴식 / 식량 / 감염.** 숨을 돌리며 마실 것을 섭취하면 HP d4를 회복합니다. 하룻밤 푹 자면 HP d6를 회복합니다. 음식이나 물이 없으면 쉬어도 HP를 회복하지 못하며, 이틀 굶은 뒤부터는 매일 HP d4를 잃습니다. 감염 중에는 휴식으로 회복하지 못하고 매일 HP d6를 잃습니다.

The source does not assign separate cumulative starvation and infection handling. Do not add a stacking formula. Core Dried food is one day's food; Waterskin contains four days of water (BB24–25 / Full29, printed25). Medicine box stops bleeding/infection and restores d6 HP; Presence+4 uses (BB24 / Full29, printed25). Reuse the installed definitions rather than repeat their data.

**Carrying.** Carry Strength+8 normal-sized items. Above that, Strength and Agility tests have DR+2. You cannot carry more than twice that normal capacity. Large objects are outside the normal-sized examples.

**운반.** 보통 크기의 물건을 근력+8개까지 들 수 있습니다. 이를 넘으면 근력·민첩 판정의 DR이 2 높아집니다. 기본 한도의 두 배를 초과해서는 들 수 없습니다. 큰 물건은 보통 크기 물건의 예시에 포함되지 않습니다.

**Get Better.** The GM decides when. Roll 6d10; if it meets or exceeds maximum HP, add d6 to maximum HP. Roll the debris d6 table. For each ability roll d6: at or above the ability, +1; below it, −1. Abilities −3 through +1 increase unless the die is 1, which lowers them. Keep abilities within −3 to +6.

**성장.** GM이 성장 시점을 정합니다. 6d10이 최대 HP 이상이면 최대 HP가 d6 늘어납니다. 잔해 발견물 d6 표도 굴립니다. 능력마다 d6를 굴려 능력치 이상이면 +1, 미만이면 −1입니다. 능력치 −3~+1은 주사위가 1일 때만 줄고, 그 외에는 늘어납니다. 능력치는 −3~+6 범위를 벗어나지 않습니다.

The existing condensed rule's universal `d6=1 → −1` formulation is equivalent: for abilities 2 or higher, 1 is already below the ability. No numerical correction is needed there.

**Broken / death.** At exactly 0 HP, roll Broken d4. At negative HP, dead. Broken: 1 unconscious d4 rounds, recover with d4 HP; 2 injury d6 (1–5 broken/severed limb, 6 lost eye), unable to act d4 rounds, resume with d4 HP; 3 hemorrhage, death in d2 hours unless treated, tests DR16 first hour / DR18 final hour; 4 dead.

**무력화 / 죽음.** HP가 정확히 0이면 Broken d4를 굴리고, 음수이면 사망합니다. 1은 d4라운드 기절 후 HP d4로 깨어남. 2는 부상 d6(1~5 팔다리 골절 또는 절단, 6 한쪽 눈 상실), d4라운드 동안 행동 불가 후 HP d4로 활동 재개. 3은 출혈로, 치료하지 않으면 d2시간 후 사망하며 첫 1시간은 모든 판정 DR16, 마지막 1시간은 DR18. 4는 사망입니다.

The one-hour hemorrhage result makes “first hour” and “last hour” overlap. That wording is shared by both editions. Do not silently invent a tie-break rule or alter d2 to guarantee two hours. The existing canonical Broken table should preserve the source wording.

**Core fleeing boundary.** Fleeing is an Agility use; resolve with the ordinary test rules and situation's DR. The source has no special fixed Core flee test on these pages. Enemy failed Morale separately determines flee or surrender. SD Flee is an explicitly different procedure.

**Core 도주 범위.** 도주는 민첩의 사용 예에 속합니다. 일반 판정 규칙과 상황에 맞는 DR로 판단합니다. 확인한 Core 페이지에는 별도의 고정 도주 판정이 없습니다. 적의 사기 실패 후 도주·항복 결과는 별도이며, SD Flee 절차와 혼동하지 않아야 합니다.

**Scroll restrictions.** Scrolls do not work while wielding two-handed weapons or medium/heavy armor. Heretical Priest may use Powers in medium armor.

**두루마리 제한.** 양손 무기를 들거나 중갑·중장갑을 착용하면 두루마리가 작동하지 않습니다. Heretical Priest는 예외적으로 중갑을 입고도 권능을 사용할 수 있습니다.

**Daily Powers.** Each morning, roll Presence+d4 for that day's Power uses; choose from available scrolls. A successful Presence DR12 casting spends one use. Failure does not work, costs d2 HP and causes one hour of dizziness; Powers then fail in the worst possible way.

**하루 권능 사용.** 매일 아침 지각+d4를 굴려 그날의 권능 사용 횟수를 정하고, 가진 두루마리 중에서 사용합니다. 지각 DR12에 성공하면 권능이 발동하고 사용 횟수가 1 줄어듭니다. 실패하면 발동하지 않고 HP d2를 잃으며 1시간 동안 어지럽습니다. 그동안 권능은 최악의 방식으로 실패합니다.

The source does not explicitly spend a daily use on failure; retain the current success-only decrement wording. Do not mix SD Move dice or RECLVSE Power effects into this Core rule.

## Verified purchase catalog values

All prices below are silver. They were checked in both supplied editions. The compact catalog is **APP_POLICY grouping**; individual prices and conditions are source content.

| Source item/service | Korean helper | Price / supplied quantity | Source |
| --- | --- | --- | --- |
| Night in hospice | 구호소에서 하룻밤 | 3s | BB25 / Full29, printed25 |
| Drink | 마실 것 | 1s | BB25 / Full29, printed25 |
| Steady meal | 든든한 식사 | 2s | BB25 / Full29, printed25 |
| Bribe, guard | 경비병에게 뇌물 | 20–40s | BB25 / Full29, printed25 |
| Bribe, clerk | 서기에게 뇌물 | 30–60s | BB25 / Full29, printed25 |
| Bribe, rabble | 무뢰한에게 뇌물 | 5–15s | BB25 / Full29, printed25 |
| Repair armor, tier 1 to 2 | 방어구 수리, 1단계→2단계 | 25s | BB25 / Full29, printed25 |
| Repair armor, tier 2 to 3 | 방어구 수리, 2단계→3단계 | 40s | BB25 / Full29, printed25 |
| 20 arrows | 화살 20발 | 10s | BB26 / Full29, printed25 |
| 10 bolts | 쇠뇌살 10발 | 10s | BB26 / Full29, printed25 |
| Dog (trained) | 훈련된 개 | 25s | BB26 / Full29, printed25 |
| Dog (wild) | 야생 개 | 10s | BB26 / Full29, printed25 |
| Horse | 말 | 80s | BB26 / Full29, printed25 |
| Mule | 노새 | 10s | BB26 / Full29, printed25 |
| Rat (tame) | 길들인 쥐 | 8s | BB26 / Full29, printed25 |

Armor cannot be repaired above its original tier. Core combat separately says armor reduced below tier 1 is ruined and cannot be repaired. These statements complement one another; do not turn the repair prices into armor upgrades. No lodging benefit beyond the separately applicable Rest rule, bribe guarantee, beast stat block, ammunition recovery rate or reload rule is supplied by this price catalog.

## Source boundary / conflict notes

- Both editions agree on the checked difficulty, carrying, round, rest, Broken, critical/fumble, morale, Get Better, Powers, Priest exception, prices and repeat-catastrophe mechanics.
- Full PDF34 has no printed page number visible; report it as unnumbered rather than claiming a visually verified printed “30.”
- Core round movement is abstract. Requests for an exact number of meters cannot be answered by adding an invented rule. A clear reference to the room-scale source resolves the lookup need without inventing precision.
- A general Core flee rule can explain Agility and link the normal test/round rules, but must not present the app's grouping or choice of links as an official separate “Flee Move.”
- No separate Core thirst die, exhaustive travel speed, chase clock, environmental-damage table, starvation/infection stacking rule or ammunition-recovery percentage was found in these targeted ordinary-rule sections. This targeted check is not a claim that every scenario or class lacks a specific exception.
- Historical `core-powers-daily` points at a rule whose content changed later. Restore its missing canonical reminder as a directly discovered consistency dependency, while reporting it separately from inherited non-resolved-ID closure.
