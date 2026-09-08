# Batch 1 · PDF Escape Recheck

The baseline matrix remains unchanged. These are scoped implementation results against audit HEAD `479cbd765b4168eeaeee27f921bf4b0a6615c51b`. Browser evidence and per-name source tests are complementary: representative play paths were exercised in Chrome; every catalog name/effect was checked against the loaded private registry.

| Rank | Audit target | Unique needs | Before | After | Evidence |
|---|---|---:|---|---|---|
| 1 | Omens의 정확한 사용 범위 | 1 | PARTIAL 1 | RESOLVED 1 | browser-search.json: Omens; browser-character.json: Omens |
| 2 | 정확한 Power 이름 → 효과 | 20 | PARTIAL 20 | RESOLVED 20 | browser-search.json: Daemon of Capillaries; browser-character.json: Unmet Fate; browser-tables.json: Powers; all-20 exact-name/effect tests |
| 3 | SD의 매일 Misery 주사위 변화 | 1 | PARTIAL 1 | RESOLVED 1 | browser-search.json: daily misery; Calendar/Journey context check |
| 4 | FERETORY의 도로 이동 소요 시간 | 1 | MISSING 1 | RESOLVED 1 | browser-search.json: road travel times; Journey context check |
| 8 | 무기 이름 → 피해·탄약·가격 | 18 | MISSING 7, PARTIAL 11 | RESOLVED 18 | browser-search.json: Zweihänder; browser-character.json: Knife; all-17 damage/name tests |
| 9 | 소모품·일반 장비의 실제 사용/구입 정보 | 49 | PARTIAL 29, MISSING 19, PRESENT_BUT_INDIRECT 1 | RESOLVED 49 | browser-search.json: medicine box; browser-character.json: armor, Waterskin, Toolbox; all-45+Shield definition tests |
| 13 | 규칙명을 모르는 한국어·상황 검색 | 1 | PRESENT_BUT_INDIRECT 1 | RESOLVED 1 | browser-search.json: Korean situational queries; curated English/Korean ranking tests |
| 16 | 클래스 이름 → 기본 능력/제약 | 44 | PARTIAL 6, PRESENT_BUT_INDIRECT 38 | RESOLVED 44 | browser-search.json: Fanged Deserter; browser-character.json: Esoteric Hermit and Bard; all-6/all-38 tests |
| 19 | City Crawl / 길 묻기 / 기도 / 물건 숨기기의 부모 절차 | 4 | PRESENT_BUT_INDIRECT 4 | RESOLVED 4 | browser-search.json: City Crawl/Directions/Pray/Stash; browser-tables.json: child routing and Alöne microcrawl |
| 20 | 직접 고르는 표의 조건·열·진실 여부 | 4 | PRESENT_BUT_INDIRECT 3, PARTIAL 1 | RESOLVED 4 | browser-tables.json: exits/holy places/truth/card selector; selector and condition tests |

**143 unique audited needs in the ten groups: PARTIAL 69, MISSING 27, PRESENT_BUT_INDIRECT 47 → RESOLVED 143.** Read the individual IDs in [recheck.json](recheck.json). This is not a claim that every remaining PDF escape in the full audit is fixed.

Rank 19 has a baseline indexing discrepancy: its heading mentions City Crawl, but `needIds` contains `aitc-microcrawl`, Directions, Pray and Stash. City Crawl was corrected as requested; the existing **Alöne** micro-crawl mode also gained a search route (open + choose mode). `aitc-city-crawl` is recorded separately as one direct dependency, not counted twice. **SD** micro-crawl/start/end work remains deferred.

## Findings explicitly retained for later batches

Statuses below are the existing audit classifications. They have not been reassessed as a new broad audit.

| Audit rank | Need ID | Classification |
|---|---|---|
| 5 | `reclvse-rule-advantage-and-disadvantage` | MISSING |
| 5 | `reclvse-rule-critical-die` | MISSING |
| 5 | `reclvse-rule-ask-the-oracle` | MISSING |
| 5 | `reclvse-rule-reclvse-omens` | MISSING |
| 5 | `reclvse-rule-invoke-a-power` | MISSING |
| 5 | `reclvse-rule-guarding` | MISSING |
| 5 | `reclvse-rule-criticals-and-fumbles-in-combat` | MISSING |
| 5 | `reclvse-rule-reclvse-morale` | MISSING |
| 5 | `reclvse-rule-below-zero-death-and-recovery` | MISSING |
| 5 | `reclvse-rule-infection` | MISSING |
| 5 | `reclvse-rule-medicine-kit` | MISSING |
| 5 | `reclvse-unspokens-calendar` | MISSING |
| 6 | `reclvse-travel-road` | PARTIAL |
| 6 | `reclvse-rule-determine-journey-length` | MISSING |
| 6 | `reclvse-rule-move-through-an-area` | MISSING |
| 6 | `reclvse-rule-reclvse-daily-travel-loop` | MISSING |
| 6 | `reclvse-rule-weather-move` | MISSING |
| 6 | `reclvse-rule-hunt` | MISSING |
| 6 | `reclvse-rule-butcher-a-kill` | MISSING |
| 6 | `reclvse-rule-make-camp` | MISSING |
| 6 | `reclvse-rule-night-encounter` | MISSING |
| 6 | `reclvse-rule-hold-your-bearing` | MISSING |
| 6 | `reclvse-rule-foraging-move` | MISSING |
| 6 | `reclvse-rule-tend-wounds` | MISSING |
| 6 | `reclvse-rule-short-rest-move` | MISSING |
| 6 | `reclvse-rule-starvation` | MISSING |
| 6 | `reclvse-rule-navigate-the-passage` | MISSING |
| 6 | `reclvse-rule-search-the-room` | MISSING |
| 6 | `reclvse-rule-face-the-trap` | MISSING |
| 6 | `reclvse-rule-room-encounter` | MISSING |
| 7 | `heretic:blackpowder-rule` | MISSING |
| 7 | `heretic:blackpowder-pistolet` | MISSING |
| 7 | `heretic:blackpowder-culverin` | MISSING |
| 7 | `heretic:blackpowder-arquebus` | MISSING |
| 7 | `heretic:blackpowder-dragon` | MISSING |
| 7 | `heretic:blackpowder-basilisk-gun` | MISSING |
| 7 | `heretic:blackpowder-blunderbuss` | MISSING |
| 7 | `heretic:blackpowder-heavy-arquebus` | MISSING |
| 7 | `heretic:blackpowder-pepperbox-pistolet` | MISSING |
| 7 | `heretic:blackpowder-blackpowder-bomb` | MISSING |
| 7 | `heretic:blackpowder-ribauldequin` | MISSING |
| 7 | `heretic:blackpowder-cannon` | MISSING |
| 7 | `heretic:blackpowder-ammunition` | MISSING |
| 10 | `sd-omens-variant` | PARTIAL |
| 10 | `sd-powers-variant` | PARTIAL |
| 11 | `depths-rare-five-card` | PARTIAL |
| 12 | `depths-hex-encounters` | PARTIAL |
| 14 | `sd-microcrawl` | MISSING |
| 14 | `sd-begin-adventure` | MISSING |
| 14 | `sd-conclude-adventure` | MISSING |
| 15 | `heretic:creature-rotten-nurse` | PARTIAL |
| 15 | `heretic:outcast-mikhael` | PARTIAL |
| 17 | `feretory:creature-carcasswan` | PARTIAL |
| 17 | `feretory:epk-starved-peasants` | PARTIAL |
| 17 | `feretory:epk-regular-wolf` | PARTIAL |
| 18 | `mythic-event-focus` | PARTIAL |
| 18 | `mythic-lists` | MISSING |
| 18 | `mythic-altered-followthrough` | PARTIAL |
| 18 | `mythic-npc-behavior` | MISSING |
