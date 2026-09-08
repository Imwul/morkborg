# TOP 20 PDF ESCAPES

현재 감사 대상 HEAD: `479cbd765b4168eeaeee27f921bf4b0a6615c51b`. 구현 제안만 기록했으며 이 감사에서는 수정하지 않았다.

같은 원인으로 생기는 20개 Power 또는 여러 무기를 각각 상위 순위로 나열하지 않고 플레이 상황으로 묶었다. 순서는 그룹 내 최고 Frequency × Friction을 기준으로 하고 동점은 기본 플레이 관련성을 판단해 정했다. 선택 규칙의 빈도는 그 규칙을 실제 사용하는 세션에 한정한다. 각 그룹의 모든 원본 점수·분류는 master-rows.json에 남는다.

그룹은 새로운 커버리지 단위가 아니다. 한국어 검색처럼 여러 기존 필요에 걸치는 경로 문제도 포함되므로 이 20개를 합산하거나 전체 누락 수로 취급하지 않는다. P0 발견은 0건이다.

| 순위 | PDF를 여는 상황 | 심각도 | 빈도 × 마찰 | 적용 범위 |
| --- | --- | --- | --- | --- |
| 1 | Omens의 정확한 사용 범위 | P1 | 5 × 5 = 25 | 일반 플레이 |
| 2 | 정확한 Power 이름 → 효과 | P1 | 4 × 5 = 20 | 일반 플레이 |
| 3 | SD의 매일 Misery 주사위 변화 | P1 | 5 × 4 = 20 | SD 사용 시 |
| 4 | FERETORY의 도로 이동 소요 시간 | P1 | 4 × 5 = 20 | 일반 플레이 |
| 5 | RECLVSE의 기본 판정·전투·회복 규칙 | P1 | 4 × 5 = 20 | RECLVSE 사용 시에만 높은 빈도 |
| 6 | RECLVSE 여행·야영·던전 Move 해석 | P1 | 4 × 5 = 20 | RECLVSE 사용 시에만 높은 빈도 |
| 7 | 도시 Gunsmith → HERETIC 화약 무기 | P1 | 4 × 5 = 20 | 화약 무기 사용 시 |
| 8 | 무기 이름 → 피해·탄약·가격 | P2 | 4 × 4 = 16 | 일반 플레이 |
| 9 | 소모품·일반 장비의 실제 사용/구입 정보 | P2 | 4 × 4 = 16 | 일반 플레이 |
| 10 | SD Omens·Power 예외 | P1 | 4 × 4 = 16 | SD 사용 시 |
| 11 | Depths 희귀 몬스터의 다섯 장 카드 절차 | P1 | 4 × 4 = 16 | Depths 카드 생성 사용 시 |
| 12 | Depths 헥스 이동의 Encounter Level | P1 | 4 × 4 = 16 | Depths 헥스 이동 사용 시 |
| 13 | 규칙명을 모르는 한국어·상황 검색 | P2 | 5 × 3 = 15 | 일반 플레이 |
| 14 | SD 야외 Micro-crawl과 모험 시작/완료 | P2 | 3 × 5 = 15 | SD 사용 시 |
| 15 | 알고 있는 HERETIC 조우 대상의 정의 | P2 | 3 × 5 = 15 | 일반 플레이 |
| 16 | 클래스 이름 → 기본 능력/제약 | P2 | 3 × 4 = 12 | 일반 플레이 |
| 17 | FERETORY의 변형·동행자·조우 참가자 스탯 | P2 | 3 × 4 = 12 | 일반 플레이 |
| 18 | Mythic Event/Scene/NPC 결과 다음 단계 | P2 | 3 × 3 = 9 | Mythic 사용 시 |
| 19 | City Crawl / 길 묻기 / 기도 / 물건 숨기기의 부모 절차 | P2 | 4 × 2 = 8 | 일반 플레이 |
| 20 | 직접 고르는 표의 조건·열·진실 여부 | P2 | 3 × 2 = 6 | 일반 플레이 |

## 1. Omens의 정확한 사용 범위

**플레이 상황:** Omen으로 난이도를 낮추거나 실패를 무효화할 수 있는지 확인한다.

**현재 앱 / PDF가 필요한 이유:** 다섯 선택지는 추가됐지만 DR 감소가 재시도로, Fumble이 일반 실패처럼 요약되어 원문 확인이 필요하다.

**최소 수정:** 기존 Omens 요약의 DR·Fumble·재굴림 대상 표현만 정확히 고친다.

| 책 | PDF 페이지 | 인쇄 페이지 |
| --- | --- | --- |
| MÖRK BORG Bare Bones | 37 | 37 |
| MÖRK BORG Full Edition (Second Printing) | 42 | 38 |

**근거 needId:** `core-omens-spending`.

## 2. 정확한 Power 이름 → 효과

**플레이 상황:** 찾은 스크롤 또는 알고 있는 Power 이름으로 효과·대상·지속시간을 확인한다.

**현재 앱 / PDF가 필요한 이유:** 현재 무작위 결과에는 효과가 나온다. Daemon of Capillaries 검색은 실패하고 두 전체 표에는 이름만 나온다.

**최소 수정:** 기존 20개 effect를 TABLE에도 표시하고 각 기존 항목에 직접 OPEN 경로를 만든다. 굴림 효과 표시는 이미 작동한다.

| 책 | PDF 페이지 | 인쇄 페이지 |
| --- | --- | --- |
| MÖRK BORG Bare Bones | 34–35 | 34; 35 |
| MÖRK BORG Full Edition (Second Printing) | 39 | 35 |

**근거 needId:** `core-power-palms-open-the-southern-gate`, `core-power-tongue-of-eris`, `core-power-te-le-kin-esis`, `core-power-lucy-fires-levitation`, `core-power-daemon-of-capillaries`, `core-power-nine-violet-signs-unknot-the-storm`, `core-power-metzhuotl-blind-your-eye`, `core-power-foul-psychompomp`, `core-power-eyelid-blinds-the-mind`, `core-power-death`, `core-power-grace-of-a-dead-saint`, `core-power-grace-for-a-sinner`, `core-power-whispers-pass-the-gate`, `core-power-aegis-of-sorrow`, `core-power-unmet-fate`, `core-power-bestial-speech`, `core-power-false-dawn-nights-chariot`, `core-power-hermetic-step`, `core-power-roskoes-consuming-glare`, `core-power-enochian-syntax`.

## 3. SD의 매일 Misery 주사위 변화

**플레이 상황:** 하루가 지나거나 Misery가 발생한 뒤 다음 주사위를 정한다.

**현재 앱 / PDF가 필요한 이유:** 일반 Calendar와 여행 단계는 있지만 SD의 시작 주사위 상한과 재앙 후 단계 하락을 완전히 설명하지 않는다.

**최소 수정:** SD 고유 일일 규칙 한 단락을 기존 Calendar/여행 참조에 분리해 연결한다.

| 책 | PDF 페이지 | 인쇄 페이지 |
| --- | --- | --- |
| Sölitary Defilement | 5 | 3 |

**근거 needId:** `sd-misery-variant`.

## 4. FERETORY의 도로 이동 소요 시간

**플레이 상황:** 목적지까지 며칠 걸리는지, 세계 크기와 날씨를 어떻게 적용할지 묻는다.

**현재 앱 / PDF가 필요한 이유:** 도로 사건은 굴릴 수 있지만 이름 붙은 경로의 시간 참조가 없다.

**최소 수정:** 원문의 경로별 시간표와 조정 조건을 읽기용 표로 연결한다. 경로 계획기는 필요 없다.

| 책 | PDF 페이지 | 인쇄 페이지 |
| --- | --- | --- |
| MÖRK BORG CULT: FERETORY | 6 | 4 |

**근거 needId:** `feretory:travel-distances`.

## 5. RECLVSE의 기본 판정·전투·회복 규칙

**플레이 상황:** RECLVSE를 선택한 세션에서 판정과 전투 결과를 처리한다.

**현재 앱 / PDF가 필요한 이유:** 많은 RCL 오라클은 있지만 그 결과를 쓰는 기본 규칙은 빠져 있다. Core 규칙으로 대신하면 다른 절차가 된다.

**최소 수정:** RCL 판정·전투·회복·일일 체크를 짧은 출처별 규칙 묶음으로 참조시킨다.

| 책 | PDF 페이지 | 인쇄 페이지 |
| --- | --- | --- |
| RECLVSE | 9, 12, 18, 42–43, 85 | 12; 18; 42; 43; 85; 9 |

**근거 needId:** `reclvse-rule-advantage-and-disadvantage`, `reclvse-rule-critical-die`, `reclvse-rule-ask-the-oracle`, `reclvse-rule-reclvse-omens`, `reclvse-rule-invoke-a-power`, `reclvse-rule-guarding`, `reclvse-rule-criticals-and-fumbles-in-combat`, `reclvse-rule-reclvse-morale`, `reclvse-rule-below-zero-death-and-recovery`, `reclvse-rule-infection`, `reclvse-rule-medicine-kit`, `reclvse-unspokens-calendar`.

## 6. RECLVSE 여행·야영·던전 Move 해석

**플레이 상황:** 도로·야생·방 탐색 결과에서 진행, 비용, 실패 후속 조치를 정한다.

**현재 앱 / PDF가 필요한 이유:** 관련 표만으로는 각 Move의 조건과 결과를 모두 알 수 없다.

**최소 수정:** 사용 중인 Move 옆에 해당 출처의 결과 요약과 기존 후속 표 링크를 둔다. 새 크롤 시스템을 만들 필요는 없다.

| 책 | PDF 페이지 | 인쇄 페이지 |
| --- | --- | --- |
| RECLVSE | 49, 51–53, 68 | 49; 51; 52; 53; 68 |

**근거 needId:** `reclvse-travel-road`, `reclvse-rule-determine-journey-length`, `reclvse-rule-move-through-an-area`, `reclvse-rule-reclvse-daily-travel-loop`, `reclvse-rule-weather-move`, `reclvse-rule-hunt`, `reclvse-rule-butcher-a-kill`, `reclvse-rule-make-camp`, `reclvse-rule-night-encounter`, `reclvse-rule-hold-your-bearing`, `reclvse-rule-foraging-move`, `reclvse-rule-tend-wounds`, `reclvse-rule-short-rest-move`, `reclvse-rule-starvation`, `reclvse-rule-navigate-the-passage`, `reclvse-rule-search-the-room`, `reclvse-rule-face-the-trap`, `reclvse-rule-room-encounter`.

## 7. 도시 Gunsmith → HERETIC 화약 무기

**플레이 상황:** 도시의 총포상 또는 화약 무기를 만났을 때 공격·재장전·소음·가격을 확인한다.

**현재 앱 / PDF가 필요한 이유:** Alöne가 가리키는 자료는 실제 HERETIC에 있다. 앱의 사용 가능한 무기 규칙/목록 연결이 없다.

**최소 수정:** Gunsmith를 HERETIC의 기존 공급 원문에 근거한 짧은 규칙 및 무기·탄약 참조로 연결한다.

| 책 | PDF 페이지 | 인쇄 페이지 |
| --- | --- | --- |
| MÖRK BORG CULT: HERETIC | 46 | 44 |
| Alöne in the Crowd | 14 | 12 |

**근거 needId:** `heretic:blackpowder-rule`, `heretic:blackpowder-pistolet`, `heretic:blackpowder-culverin`, `heretic:blackpowder-arquebus`, `heretic:blackpowder-dragon`, `heretic:blackpowder-basilisk-gun`, `heretic:blackpowder-blunderbuss`, `heretic:blackpowder-heavy-arquebus`, `heretic:blackpowder-pepperbox-pistolet`, `heretic:blackpowder-blackpowder-bomb`, `heretic:blackpowder-ribauldequin`, `heretic:blackpowder-cannon`, `heretic:blackpowder-ammunition`.

## 8. 무기 이름 → 피해·탄약·가격

**플레이 상황:** 주운 무기나 구입할 무기의 피해와 가격을 확인한다.

**현재 앱 / PDF가 필요한 이유:** 시작 무기 10종은 damage 데이터가 있지만 일반 굴림과 TABLE에 나오지 않는다. 추가 구입 무기 7종도 빠져 있다.

**최소 수정:** 기존 damage/탄약을 노출하고 빠진 구입 정보만 보완한다. 생성된 Character의 피해 표시를 별도 조회 경로와 연결한다.

| 책 | PDF 페이지 | 인쇄 페이지 |
| --- | --- | --- |
| MÖRK BORG Bare Bones | 23, 25–26 | 26; 23,26; 23,25 |
| MÖRK BORG Full Edition (Second Printing) | 24–27, 29 | 25; 21,25; 25; weapon continuation spread has no visible printed number; 20,25 |

**근거 needId:** `core-weapon-battle-axe`, `core-weapon-bow`, `core-weapon-club`, `core-weapon-crossbow`, `core-weapon-flail`, `core-weapon-femur`, `core-weapon-handaxe`, `core-weapon-knife`, `core-weapon-mace`, `core-weapon-shortbow`, `core-weapon-shortsword`, `core-weapon-sling`, `core-weapon-staff`, `core-weapon-sword`, `core-weapon-warhammer`, `core-weapon-whip`, `core-weapon-zweihander`, `core-improvised-weapons`.

## 9. 소모품·일반 장비의 실제 사용/구입 정보

**플레이 상황:** 약상자, 식량, 물통, 등불 기름, 독, 밧줄 등을 사용하거나 보충한다.

**현재 앱 / PDF가 필요한 이유:** 일부 시작 장비에는 이미 효과가 있다. 그러나 이름 검색과 전체 가격/용량/사용량 참조는 불완전하다.

**최소 수정:** 효과가 있는 기존 항목은 색인·연결하고, 빠진 구입/사용 정보만 해당 장비 정의에 추가한다.

| 책 | PDF 페이지 | 인쇄 페이지 |
| --- | --- | --- |
| MÖRK BORG Bare Bones | 23–25 | 24; 25; 23 |
| MÖRK BORG Full Edition (Second Printing) | 28–29 | 25; 24 |

**근거 needId:** `core-equipment-backpack`, `core-equipment-bear-trap`, `core-equipment-blanket`, `core-equipment-caltrops`, `core-equipment-chalk`, `core-equipment-chewing-tobacco`, `core-equipment-crowbar`, `core-equipment-crucifix-silver`, `core-equipment-crucifix-wood`, `core-equipment-dried-food`, `core-equipment-exquisite-perfume`, `core-equipment-firesteel`, `core-equipment-grappling-hook`, `core-equipment-hammer`, `core-equipment-heavy-chain`, `core-equipment-iron-nails`, `core-equipment-ladder`, `core-equipment-lantern-oil`, `core-equipment-lard`, `core-equipment-large-iron-hook`, `core-equipment-lockpicks`, `core-equipment-magnesium-strip`, `core-equipment-manacles`, `core-equipment-mattress`, `core-equipment-meat-cleaver`, `core-equipment-medicine-box`, `core-equipment-metal-file`, `core-equipment-mirror`, `core-equipment-muzzle`, `core-equipment-noose`, `core-equipment-oil-lamp`, `core-equipment-poison-black`, `core-equipment-poison-red`, `core-equipment-preserved-corpse`, `core-equipment-rope`, `core-equipment-small-wagon`, `core-equipment-tent`, `core-equipment-toolbox`, `core-equipment-torch`, `core-equipment-sack`, `core-equipment-salt`, `core-equipment-scissors`, `core-equipment-scroll-resale-value`, `core-equipment-sharp-needle`, `core-equipment-waterskin`, `core-equipment-light-armor`, `core-equipment-medium-armor`, `core-equipment-heavy-armor`, `core-equipment-shield`.

## 10. SD Omens·Power 예외

**플레이 상황:** Move에 Omens를 쓰거나 Power 실패를 Strong/Weak/Fail과 연결한다.

**현재 앱 / PDF가 필요한 이유:** 한/두 주사위 재굴림은 보이지만 최대 4개와 Move 능력치 용법은 불명확하다. Power는 한 d20이라는 구분과 실패 해석도 부족하다.

**최소 수정:** SD PDF5의 두 짧은 예외를 그대로 구분해 요약한다. Omens 단계 상승처럼 출처에 없는 문구는 제거한다.

| 책 | PDF 페이지 | 인쇄 페이지 |
| --- | --- | --- |
| Sölitary Defilement | 5 | 3 |

**근거 needId:** `sd-omens-variant`, `sd-powers-variant`.

## 11. Depths 희귀 몬스터의 다섯 장 카드 절차

**플레이 상황:** 카드로 희귀 몬스터를 만들며 어느 카드가 어떤 결과를 결정하는지 확인한다.

**현재 앱 / PDF가 필요한 이유:** 카드 표들은 있지만 전체 구성법과 카드 rank/suit 표시가 불완전하다.

**최소 수정:** 기존 표에 원래 카드 선택자를 표시하고 다섯 장의 역할·조건을 짧게 설명한다. 무작위 dN으로 대체하지 않는다.

| 책 | PDF 페이지 | 인쇄 페이지 |
| --- | --- | --- |
| Sölitary Depths | 16–19 | 13, 14, 15, 16 |

**근거 needId:** `depths-rare-five-card`.

## 12. Depths 헥스 이동의 Encounter Level

**플레이 상황:** 지역 이동에서 조우 수준을 정하고 해당 지역의 후속 표를 고른다.

**현재 앱 / PDF가 필요한 이유:** 지역 몬스터 직접 생성은 작동하지만 EL 계산/조정과 이동 절차의 연결은 일부만 있다.

**최소 수정:** EL 결정 규칙과 이미 있는 지역 참조를 연결한다. 지역 몬스터 생성 자체를 다시 만들지 않는다.

| 책 | PDF 페이지 | 인쇄 페이지 |
| --- | --- | --- |
| Sölitary Depths | 25–33 | 22, 23, 24, 25, 26, 27, 28, 29, 30 |

**근거 needId:** `depths-hex-encounters`.

## 13. 규칙명을 모르는 한국어·상황 검색

**플레이 상황:** 마법, 피 0, 갑옷, 도망, 짐, 시체, 보물처럼 상황으로 검색한다.

**현재 앱 / PDF가 필요한 이유:** 마법·피 0·보물 등은 비고, 갑옷·시체 등은 다른 결과를 앞세운다. 영어/공식 제목으로는 이미 있는 규칙도 많다.

**최소 수정:** 기존 규칙에 짧은 한·영 별칭을 추가한다. 마법은 우선순위 맵에 이미 있으므로 후보 토큰/별칭을 보완해야 한다.

| 책 | PDF 페이지 | 인쇄 페이지 |
| --- | --- | --- |
| MÖRK BORG Bare Bones | 34 | 34 |
| MÖRK BORG Full Edition (Second Printing) | 38 | 34 |

**근거 needId:** `core-casting`.

## 14. SD 야외 Micro-crawl과 모험 시작/완료

**플레이 상황:** 야외를 세밀하게 탐색하거나 모험 목표를 시작·마무리한다.

**현재 앱 / PDF가 필요한 이유:** 도시 Micro-crawl과 던전 화면이 일반 야외 절차 및 SD의 시작/완료 조건을 대신하지 않는다.

**최소 수정:** 세 가지 기존 출처 절차를 짧은 읽기용 참조로 연결한다. 목표/성과 관리 시스템은 불필요하다.

| 책 | PDF 페이지 | 인쇄 페이지 |
| --- | --- | --- |
| Sölitary Defilement | 7, 20 | 5; 18 |

**근거 needId:** `sd-microcrawl`, `sd-begin-adventure`, `sd-conclude-adventure`.

## 15. 알고 있는 HERETIC 조우 대상의 정의

**플레이 상황:** 시나리오에서 이름을 확인한 대상의 기계적 정보를 바로 찾는다.

**현재 앱 / PDF가 필요한 이유:** 공급 원문과 일부 데이터에 대상이 있지만 현재 참조 색인에서 제대로 도달할 수 없다.

**최소 수정:** 기존 outcast/특수 HP 데이터의 정의를 읽기용으로 색인한다. 수치가 없는 부분을 임의로 채우지 않는다.

| 책 | PDF 페이지 | 인쇄 페이지 |
| --- | --- | --- |
| MÖRK BORG CULT: HERETIC | 40, 64 | 62; 38 |

**근거 needId:** `heretic:creature-rotten-nurse`, `heretic:outcast-mikhael`.

## 16. 클래스 이름 → 기본 능력/제약

**플레이 상황:** 이미 종이에 만든 캐릭터의 능력, 고유 장비, 사용 횟수를 확인한다.

**현재 앱 / PDF가 필요한 이유:** Fanged Deserter는 배경 표로 가고 Ancient gore-hound는 검색되지 않는다. 생성된 캐릭터 안에서는 규칙을 읽을 수 있다.

**최소 수정:** 기존 클래스/능력 데이터를 읽기용으로 열고 이름으로 찾게 한다. 조회를 위해 새 캐릭터를 만들게 하지 않는다.

| 책 | PDF 페이지 | 인쇄 페이지 |
| --- | --- | --- |
| MÖRK BORG Bare Bones | 46–57 | 46,47; 47; 48,49; 49; 50,51; 51; 52,53; 53; 54,55; 55; 56,57; 57 |
| MÖRK BORG Full Edition (Second Printing) | 50–52, 54–55, 57, 59–61 | 46,47; 47; 48; 50,51; 51; 53; 55; 56,57; 56 |

**근거 needId:** `core-class-fanged-deserter`, `core-class-gutterborn-scum`, `core-class-esoteric-hermit`, `core-class-wretched-royalty`, `core-class-heretical-priest`, `core-class-occult-herbmaster`, `core-class-effect-fanged-deserter-1`, `core-class-effect-fanged-deserter-2`, `core-class-effect-fanged-deserter-3`, `core-class-effect-fanged-deserter-4`, `core-class-effect-fanged-deserter-5`, `core-class-effect-fanged-deserter-6`, `core-class-effect-gutterborn-scum-1`, `core-class-effect-gutterborn-scum-2`, `core-class-effect-gutterborn-scum-3`, `core-class-effect-gutterborn-scum-4`, `core-class-effect-gutterborn-scum-5`, `core-class-effect-gutterborn-scum-6`, `core-class-effect-esoteric-hermit-1`, `core-class-effect-esoteric-hermit-2`, `core-class-effect-esoteric-hermit-3`, `core-class-effect-esoteric-hermit-4`, `core-class-effect-esoteric-hermit-5`, `core-class-effect-esoteric-hermit-6`, `core-class-effect-wretched-royalty-1`, `core-class-effect-wretched-royalty-2`, `core-class-effect-wretched-royalty-3`, `core-class-effect-wretched-royalty-4`, `core-class-effect-wretched-royalty-5`, `core-class-effect-wretched-royalty-6`, `core-class-effect-heretical-priest-1`, `core-class-effect-heretical-priest-2`, `core-class-effect-heretical-priest-3`, `core-class-effect-heretical-priest-4`, `core-class-effect-heretical-priest-5`, `core-class-effect-heretical-priest-6`, `core-class-effect-occult-herbmaster-1`, `core-class-effect-occult-herbmaster-2`, `core-class-effect-occult-herbmaster-3`, `core-class-effect-occult-herbmaster-4`, `core-class-effect-occult-herbmaster-5`, `core-class-effect-occult-herbmaster-6`, `core-class-effect-occult-herbmaster-7`, `core-class-effect-occult-herbmaster-8`.

## 17. FERETORY의 변형·동행자·조우 참가자 스탯

**플레이 상황:** Carcasswan의 변형, Lentil Lice 장면의 농민, Überwolf 곁의 늑대를 전투에 쓴다.

**현재 앱 / PDF가 필요한 이유:** 주요 대상 이름/본문이 나와도 variants/participants/동행자 블록이 표시되지 않는다.

**최소 수정:** 기존 하위 스탯 블록을 각 대상에서 연결한다. 이와 농민, Überwolf와 일반 늑대의 정체성을 합치지 않는다.

| 책 | PDF 페이지 | 인쇄 페이지 |
| --- | --- | --- |
| MÖRK BORG CULT: FERETORY | 17, 20, 23 | 18; 15; 21 |

**근거 needId:** `feretory:creature-carcasswan`, `feretory:epk-starved-peasants`, `feretory:epk-regular-wolf`.

## 18. Mythic Event/Scene/NPC 결과 다음 단계

**플레이 상황:** 빈 종이 목록에서 대상을 고르거나 Altered Scene, NPC 행동 결과를 해석한다.

**현재 앱 / PDF가 필요한 이유:** Fate/Meaning/Scene 결과는 나오지만 빈 목록 처리, 추가 Adjustment 조건, NPC 행동 해석은 부족하다.

**최소 수정:** 해당 결과 옆에 목록 선택과 후속 판정 요약을 둔다. 목록과 이야기 기록은 종이에 둘 수 있다.

| 책 | PDF 페이지 | 인쇄 페이지 |
| --- | --- | --- |
| Mythic Game Master Emulator Second Edition | 37–43, 45–47, 68–73, 107–112 | 36, 37, 38, 39, 40, 41, 42; 44, 45, 46; 67, 68, 69, 70, 71, 72; 106, 107, 108, 109, 110, 111 |

**근거 needId:** `mythic-event-focus`, `mythic-lists`, `mythic-altered-followthrough`, `mythic-npc-behavior`.

## 19. City Crawl / 길 묻기 / 기도 / 물건 숨기기의 부모 절차

**플레이 상황:** 도시 행동을 검색해서 시도하려는데 어떤 굴림을 먼저 할지 모른다.

**현재 앱 / PDF가 필요한 이유:** 검색은 Failure 또는 Weak Hit 표를 먼저 연다. CITY CRAWL 도구에는 완전한 DR·Strong/Weak/Miss 절차가 있다.

**최소 수정:** 행동 검색은 기존 부모 도구로 보내고 조건부 표는 관련 참조로 둔다. 도시 기능을 추가로 만들 필요 없다.

| 책 | PDF 페이지 | 인쇄 페이지 |
| --- | --- | --- |
| Alöne in the Crowd | 5, 7–8 | 3; 5; 6 |

**근거 needId:** `aitc-microcrawl`, `aitc-directions`, `aitc-pray`, `aitc-stash`.

## 20. 직접 고르는 표의 조건·열·진실 여부

**플레이 상황:** 주사위를 직접 굴리거나 원하는 표 항목을 눈으로 선택한다.

**현재 앱 / PDF가 필요한 이유:** 일부 표에 선택 열/공통 조건/진실 여부가 빠져 있다. 모든 표가 열리는 것과 모든 사용 정보가 보이는 것은 다르다.

**최소 수정:** 검증된 원래 열 이름·선택자·조건만 TABLE에 보존한다. 표 행을 저장하는 새 편집기는 필요 없다.

| 책 | PDF 페이지 | 인쇄 페이지 |
| --- | --- | --- |
| MÖRK BORG CULT: HERETIC | 22 | 20 |
| Sölitary Defilement | 15 | 13 |
| Alöne in the Crowd | 10 | 8 |

**근거 needId:** `sd-sd-room-exits`, `aitc-aitc-holy-places-small`, `aitc-aitc-holy-places-large`, `heretic:table-gravesKnowledge`.

정확한 현재 목적지·검색어·해결 유형: [MASTER-MATRIX.md](MASTER-MATRIX.md). 전체 P1 목록과 중복 제거 기준: [COVERAGE.md](COVERAGE.md). 실제 클릭·화면 결과: [PLAY-WORKFLOWS.md](PLAY-WORKFLOWS.md), [CURRENT-HEAD-RECHECK.md](CURRENT-HEAD-RECHECK.md).
