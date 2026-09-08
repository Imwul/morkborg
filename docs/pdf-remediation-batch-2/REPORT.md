# PDF Escape Remediation — Batch 2

후속 수정: 누락된 규칙 본문과 결과의 한국어 병기는 [KOREAN.md](KOREAN.md)에 기록했다. 아래 수치는 최초 Batch 2 완료 시점의 검사 결과다.

이번 범위의 **59개 감사 항목**을 사용자 화면에서 재점검했다. 기존 47개 MISSING과 12개 PARTIAL을 해당 감사 항목의 조회·절차 범위에서 RESOLVED로 변경했다. 원문 자체의 모순까지 해소했다는 의미는 아니다. 아래에 그 모순과 범위 밖의 남은 항목을 구분해 기록했다.

기준은 감사 커밋 `479cbd765b4168eeaeee27f921bf4b0a6615c51b`, Batch 1 커밋 `285f85157f1b3df4d59b60953a0714561e15d35d`다. 전체 제품 감사를 반복하지 않았다. 원 감사 문서는 수정하지 않았다.

## 1–15. 구현 및 검증한 참조

| 범위 | 검증 위치: PDF / 인쇄 쪽 | 사용자가 할 수 있는 일 |
|---|---|---|
| RECLVSE 핵심 규칙 12개 | 9, 12, 18, 42, 43, 85 / 같은 번호 | Advantage/Disadvantage, Critical Die, Ask the Oracle, Omens, Invoke a Power, Guarding, Combat Criticals/Fumbles, Morale, Death/Recovery, Infection, Medicine Kit, Calendar를 독립적으로 검색하고 읽는다. Core로 대체하지 않는다. |
| RECLVSE 기본 판정 의존 항목 | 11 / 11 | Move의 공통 판정과 일반 판정, 전투 판정의 경계를 읽는다. |
| RECLVSE 여행·야영·던전 18개 항목 | 49, 51–53, 68 / 같은 번호 | 16개 Move의 Trigger/ROLL/Strong/Weak/Miss와 Daily Loop, Starvation을 읽는다. Travel → Camp → Night Encounter, Passage → Search/Trap/Encounter 링크를 제공한다. |
| RECLVSE Calendar의 직접 의존 표 | 10 / 인쇄 번호 표시 없음 | 36개 Truth를 d66으로 굴리고 표를 본다. 중복과 일곱 번째 Truth 처리는 규칙에 표시하고, 이전 Truth 기록은 노트에 맡긴다. |
| SD Omens 변형 | 5 / 3, luck stat 보충 7 / 5 | 한쪽 또는 양쪽 Move 주사위 재굴림, 최대 4개, 보유 Omens를 능력치로 쓰는 구분을 읽는다. Core Omens와 별도 참조다. |
| SD Powers 변형 | 5 / 3 | 단일 d20 사용, 실패와 Fumble의 Weak/Fail 해석을 읽는다. 임의의 중간 성공 구간은 만들지 않는다. |
| Depths Encounter Level | 25–33 / 22–30 | 8개 원문 지역 중 선택 → d20 대조 → 조우 시 원문 d20 분류 → 해당 지역/NPC/희귀 몬스터 참조로 이동한다. 미표기 지역 선택 지침과 선택적 후속 굴림은 접힌 ‘절차 읽기’에 있다. |
| Depths 희귀 몬스터 | 16–19 / 13–16 | 실제 52장 카드의 rank/suit를 보존한 5장 묶음을 뽑는다. Look/Feature/Intention/HP/Armor/Morale/Attack/Special과 조건부 여섯 번째 카드를 처리한다. |
| HERETIC Blackpowder | 46 / 44 | 공통 규칙, 무기 11개와 Ammunition 1개를 이름으로 조회한다. damage/price, Presence DR14, armor, reload, noise 및 개별 예외를 읽는다. |
| Alöne Gunsmith 연결 | Alöne PDF 14 / 12 → HERETIC 46 / 44 | Gunsmith 결과에서 HERETIC Blackpowder를 한 번 클릭해 연다. 무기 규칙은 HERETIC의 정규 정의만 사용한다. |
| Carcasswan | FERETORY 20 / 18 | 부모 설명과 Lone/Pair 능력치를 별개로 연다. Pair의 개체별 HP/attack을 Lone에 섞지 않는다. |
| Lentil Lice 참가자 | FERETORY 17 / 15 | d6 Starved peasants를 별도 정의로 연다. HP 4 등의 농민 수치를 Lice에게 붙이지 않는다. |
| Überwolf 동행 개체 | FERETORY 23 / 21 | Regular wolf를 별도로 연다. 우두머리와 늑대의 능력치를 분리한다. |
| Mythic Event/Lists/Scene/NPC | Event 37–43, 45, 47 / 36–42, 44, 46; Lists 45–47, 112 / 44–46, 111; Scene 68–73 / 67–72; NPC 107–112 / 106–111 | 결과에 맞는 Lists 또는 Event 해석 절차, Altered Scene의 재굴림/충돌 처리, NPC Fate 답변 및 Current Context 규칙을 읽는다. 이야기 해석이나 목록 관리는 자동화하지 않는다. |
| SD 야외 Micro-crawl | **20 / 18** | d4 waypoint와 방 묘사 오라클의 야외 적용, Room Exits 제외, 조우 처리 지침을 읽는다. Alöne 도시 Micro-crawl과 별개다. |
| SD Begin / Conclude Adventure | 7 / 5 | 난이도별 milestone, Get Better 시점, 종료 판정과 Strong/Weak/Fail 결과를 조회한다. 퀘스트 추적 기능은 추가하지 않았다. |
| HERETIC Rotten Nurse / Mikhael | 64 / 62; 40 / 38 | Nurse의 특수 규칙만 표시하고 없는 HP/일반 공격을 만들지 않는다. Mikhael은 기존 outcast의 실제 능력치와 Eternal unlife를 조회한다. |

RECLVSE는 RESOLUTION / COMBAT / RECOVERY / OMENS–POWERS / CALENDAR / TRAVEL–CAMP / DUNGEON으로 들어간다. 이 묶음과 표시 순서는 APP_POLICY다. 규칙의 주사위·순서·조건은 SOURCE_PROCEDURE로 구별한다. Blackpowder 묶음도 공통 규칙의 원문 권한과 UI 묶음 정책을 따로 보존한다.

정확한 이름 검색은 RECLVSE Move, 12개 blackpowder 정의, Rotten Nurse, Mikhael 모두 확인했다. 새로운 대규모 한국어 별칭 확장은 하지 않았다. 영어 원문/간결한 규칙 요약을 기본으로 두고, 한국어 표제 보조 정보는 별도 metadata에 둔다.

## 카드와 Encounter Level의 구체적인 경계

- 카드 1 rank → Look, 카드 2 rank → Feature, 카드 1+2의 **순서 있는 suit** → Intention.
- 카드 3 → HP/Armor, 카드 4 → Morale, 카드 5 → damage die. 숫자 산출은 APP_DERIVED이며 해당 규칙과 카드가 출처에 남는다.
- 카드 3+4의 suit → Special. ♠♠이면 여섯 번째 카드를 뽑아 5+6으로 다시 조회한다. 다시 ♠♠이면 HP 두 배, 공격 die 한 단계 증가를 적용한다.
- 덱 안에서 중복 없이 뽑으며 다음 DRAW는 남은 덱을 쓴다. 5장만 남아도 후속 카드가 필요 없는 경우 사용할 수 있다. 여섯 번째 카드가 필요한데 덱이 부족하면 명시적으로 멈춘다.
- 원문이 허용한 ‘다음 Look’ 선택은 다른 카드와 능력치를 바꾸지 않는다. 마지막 Look 이후 순환은 원문에 없어서 만들지 않았다.
- 카드 덱과 결과는 현재 탭의 임시 참조 상태다. SHUFFLE은 새 던전용 덱을 준비한다. 저장된 Dungeon/Campaign을 생성하거나 바꾸지 않는다. 이 흐름은 APP_POLICY로 공개한다.
- Encounter Level에는 페이지에 없는 숫자 수정치를 추가하지 않았다. 지역의 고정 EL과 `d20 ≤ EL`을 사용한다. 집단 수량이나 선택적 상세 굴림은 원문 표와 다음 참조로 제공하며 필요한 만큼만 사용한다.
- Lake Onda/Bergen Chrypt는 기존 정규 지역 표를 여는 읽기·굴림 참조만 연결했다. Campaign의 지역 모델을 확장하지 않았다. 기존 몬스터 라우팅 알고리즘을 재작성하지 않았다.

## 16. PDF Escape 재분류

| 기존 TOP 20 번호 | 대상 | Before | After |
|---|---|---|---|
| 5 | RECLVSE 핵심 규칙 | MISSING 12 | RESOLVED 12 |
| 6 | RECLVSE Moves / 여행 | MISSING 17 · PARTIAL 1 | RESOLVED 18 |
| 7 | Blackpowder | MISSING 13 | RESOLVED 13 |
| 10 | SD Omens / Powers | PARTIAL 2 | RESOLVED 2 |
| 11 | 희귀 몬스터 5장 절차 | PARTIAL 1 | RESOLVED 1 |
| 12 | Encounter Level | PARTIAL 1 | RESOLVED 1 |
| 14 | 야외 Micro-crawl / 시작·종료 | MISSING 3 | RESOLVED 3 |
| 15 | HERETIC 특수 대상 | PARTIAL 2 | RESOLVED 2 |
| 17 | FERETORY 변종·참가자 | PARTIAL 3 | RESOLVED 3 |
| 18 | Mythic 후속 절차 | MISSING 2 · PARTIAL 2 | RESOLVED 4 |

59개 원 감사 ID, 정규 참조 ID, 실제 PDF/인쇄 쪽, 검색 상위 결과는 [RECHECK.md](RECHECK.md)와 [recheck.json](recheck.json)에 있다. ‘책/쪽수만 뜸’을 해결로 세지 않았다. 브라우저에서 53개 새 읽기 정의의 실제 규칙 블록 전체를 확인했고, 별도로 Depths 생성과 생물별 하위 정의를 열었다.

## 원문 모순과 미지정 사항 — 임의 해결하지 않은 부분

| 감사 ID | 원문 위치 | 남아 있는 원문 문제 / 앱 처리 |
|---|---|---|
| `reclvse-rule-ask-the-oracle` | PDF/인쇄 85 | odds 목록의 ‘or less’와 뒤 문장의 ‘below’가 경계값에서 충돌한다. 둘 다 밝히고 자동 판정하지 않는다. |
| `reclvse-rule-critical-die` | 12 | Advantage/Disadvantage로 버리는 주사위가 지정된 Critical Die일 때의 추가 규칙이 없다. 출처 설명에 미지정 상태를 남긴다. |
| `reclvse-rule-criticals-and-fumbles-in-combat` | 12 / 42 | 일반 설명과 세부 전투 규칙이 완전히 같지 않다. 42쪽의 명시된 세부 규칙을 제공하고 차이를 출처에서 설명한다. |
| `reclvse-rule-below-zero-death-and-recovery` | 42 / 43 | 0 HP의 상세 규칙은 Ruined d12, 요약은 Scarred로 보낸다. 충돌을 표시하고 두 표를 연결한다. |
| `reclvse-rule-short-rest-move` | 43 / 53 | 자동 d4 휴식과 별도 Short Rest Move의 결과가 다르다. 별개 참조로 유지한다. |
| `reclvse-rule-determine-journey-length` | 49 | Weak Hit의 추가 d4 days가 어느 기준 일수에 더해지는지 명시하지 않는다. 계산기를 만들지 않았다. |
| `reclvse-travel-road` | 49 | Hold Your Bearing의 Strong Hit를 무시하라는 지시 뒤 변환/재굴림 방식이 없다. 그대로 설명한다. |
| `reclvse-rule-reclvse-daily-travel-loop`, `reclvse-rule-make-camp` | 49 / 51 | 모든 야외 야영의 Night Encounter와 Weak/Miss에서만 명시된 Night Encounter가 충돌한다. 양쪽 지침을 표시한다. |
| `reclvse-rule-invoke-a-power` | 18 → 36 | Corruption의 인쇄된 교차 참조 p68은 틀리다. 실제 Corruption 표 36쪽으로 연결한다. |
| `reclvse-rule-search-the-room` | 68 → 63 / 39 | Equipment p63은 실제 Connections 쪽이다. 원문이 함께 허용한 Loot p39는 연결했다. 미확인 Equipment로 대체하지 않았다. |
| `sd-microcrawl` | 20 / 18 | 이번 요청의 PDF 7 표기와 달리 실제 야외 Micro-crawl은 PDF 20이다. 기존 감사의 페이지가 맞다. PDF 7은 Begin/Conclude다. |

여기서 RESOLVED는 **제공된 원문의 규칙·충돌을 앱에서 확인할 수 있다**는 뜻이다. 모호한 규칙을 확정된 결과로 바꾸지 않았다. 그 선택은 플레이어에게 남는다.

## 17–20. 검증과 화면 결과

**테스트:** 기존 579개 유지, 신규 29개, 총 **608/608 통과**. 실패/skip 0. 새 표 7개 때문에 기존 정확한 표 개수 기대값만 갱신했고, Batch 1의 무기/장비 개수 검사는 원래 대상인 Core로 한정해 동일한 17/46개 검증을 유지했다.

추가 검증에는 모든 새 규칙과 검색, 출처 ID, 카드 13종 rank와 순서 있는 suit, ♠♠ 두 단계 분기, 덱 중복/고갈, Look 단독 변경, EL 8개와 경계값, 무기별 예외, 참가자 정체성 분리, 원문 metadata 불변성, 자료 부재 시 실패가 포함된다. **희귀 몬스터 10,000회** 생성에서 모든 구성요소의 카드와 정규 출처를 검사했다. 새 필드뿐 아니라 로드된 정규 registry/definition의 unresolved 검사도 **0**이다. 이는 존재하지 않는 외부 원문까지 확보했다는 뜻이 아니다.

**실제 브라우저:** 격리된 Chrome, Session/Campaign 없이 참조를 실행했다. 검색 71회를 포함한 **87개 조회·후속 동작 검사**, console page error 0. 원문 문자열은 사용자 화면의 실제 내용과 대조했다. 자료/캡처 전체는 private `outputs/`에 보관하고 공개 보고서에는 절차·검사 결과만 남겼다. [browser-acceptance.json](browser-acceptance.json)

추가로 실제 Mythic 패널에서 물리 주사위 입력 모드로 Interrupt/Altered를 판정했다. Focus + Meaning 두 단어 생성, 결과의 후속 참조 열기·닫기, 원래 패널로 돌아오기, 네 화면 폭, 모바일 카드 SOURCE→TABLE→Back의 7개 검사를 통과했다. 이 검사에서 Mythic 패널이 참조 창의 닫기 버튼을 덮던 문제를 발견해 참조 창과 overlay의 겹침 순서를 수정했다. 일반 Fate 결과를 자동으로 NPC 상황이라고 간주하는 링크는 두지 않았다. [browser-mythic.json](browser-mythic.json)

| 동작 | 실제 클릭 수 | 기준 |
|---|---:|---|
| RECLVSE Morale 및 정확한 Move/무기 이름 → 읽기 | 1 | 검색어 입력 이후 |
| RECLVSE Travel 묶음 → Make Camp | 1 | 묶음이 열린 상태 |
| Camp → Night Encounter | 2 | RELATED 열기 + 대상 |
| SD Omens / Powers → 읽기 | 각각 1 | 검색어 입력 이후 |
| Encounter Level → 첫 검사 | 2 | 검색 결과 OPEN + ROLL, 기본 Sarkash 유지 |
| Encounter Level의 지역 몬스터 결과 → 생성 | 1 | 해당 분기가 나온 상태 |
| 희귀 몬스터 검색 → 카드 생성 | 1 | 검색 결과 RUN |
| 카드 결과 → SOURCE | 1 | 추가 하위 메뉴 없음 |
| SOURCE → 정규 표 → Back | 2 | 기존 카드가 그대로 복원됨 |
| 다음 카드 묶음 DRAW / COPY | 각각 1 | 결과 화면 |
| Gunsmith → HERETIC Blackpowder | 1 | Gunsmith 결과의 직접 링크 |
| Carcasswan / Lentil Lice / Überwolf → 하위 정의 | 각각 2 | VARIANTS/PARTICIPANTS 열기 + 대상 |
| Mythic 안내 → Event Focus 굴림 | 2 | RELATED 열기 + 표 실행 |
| Event Focus 결과 → 지정된 후속 절차 | 1 | 결과 아래 직접 링크 |
| SD 야외 Micro-crawl / Begin / Conclude | 각각 1 | 검색어 입력 이후 |
| Rotten Nurse → 특수 규칙 | 1 | 검색어 입력 이후, 허구의 HP 없음 |
| Mikhael → 특수 능력 전문 | 2 | 검색 결과 + MORE |

입력/기존 inspector 닫기는 위 활성화 수에서 제외했다. 원하는 **무작위 분기**를 보기 위한 QA 재굴림 수는 browser-acceptance.json의 `qaRollAttemptsToReachMonsterBranch`에 별도 기록했다. 분기가 안 나온 정상적인 ‘No encounter’를 탐색 클릭 수나 기능 실패로 세지 않았다.

**반응형:** 360/768/1440/3440에서 RECLVSE 묶음, Encounter Level, 다섯 카드, Arquebus, Mythic 후속 참조의 **20개 화면**을 검사했다. 실제 Mythic 패널 4개와 모바일 카드 출처 1개를 더해 총 25개 캡처도 확인했다. 문서와 inspector의 수평 넘침 모두 0. 3440에서도 inspector 폭은 780px로 제한된다. 360의 카드는 3열/2열로 배치된다. 직접 확인한 초기 카드 화면에서는 Special 문구가 능력치보다 지나치게 커 보여, identity/stat이 먼저 읽히도록 바꿨다. EL의 긴 사전 설명은 ‘절차 읽기’로 접었다. 긴 Move, Mythic 안내, 긴 카드 Special에는 세로 스크롤이 남으며 내용은 자르지 않는다.

**빌드:** `npm run lint` 통과. `npm run build` 통과(typecheck 2종, Vite, public build privacy 검사). 정적 산출물 73개를 검사했다. 새 private 원문은 기존 키로 로컬 암호화했으며 키/평문 PDF 데이터는 커밋에 포함하지 않는다.

**프로덕션 형태의 로컬 검사:** `http://127.0.0.1:5175`에서 실제 build와 같은 rulebook API를 사용했다. 이전 Batch 1의 격리 QA 저장본을 불러와 새 데이터 수신, 고정 후 reload/한 번 실행, Gunsmith 연결, Character/Core Omens, 전체 Campaign 불변을 확인했다. API 503에서도 캐시와 Campaign이 읽힌다. private cache 없는 브라우저는 해당 생성기를 사용할 수 없다. [production-preview.json](production-preview.json)

## 21. 남은 PDF Escapes와 사용 경계

이번 59개 대상 안에서 미구현으로 남긴 조회 항목은 없다. 다만 위의 원문 충돌·누락은 계속 명시된다. RECLVSE의 Equipment p63 오기는 올바른 외부 보충 자료가 생기기 전까지 확정할 수 없다. Depths가 인용하는 별도 생물 원문이나 모든 HERETIC 상점 재고를 이번 작업으로 완성했다고 주장하지 않는다. 예컨대 Mikhael은 이번 감사의 outcast 능력치/특수 규칙 조회를 해결한 것이며 상점 재고 시스템을 추가한 것이 아니다.

Batch 1에서 남았던 460개 기록 중 이번 59개를 제외한 **401개는 기존 분류를 그대로 이월**했다. PARTIAL 35, PRESENT_BUT_INDIRECT 171, MISSING 192, SOURCE_UNAVAILABLE 3이다. 새 전체 감사 결과가 아니다. 전체 정확한 ID와 문제는 [remaining-audit-ids.json](remaining-audit-ids.json)에 있다. 예:

| 감사 ID | 이월 분류 | 남은 문제 |
|---|---|---|
| `core-difficulty-scale` | PARTIAL | Core PDF 28의 전체 DR 사다리 조회 |
| `core-round-duration` | PARTIAL | Core PDF 31의 round/이동량 참조 |
| `core-starvation` | PRESENT_BUT_INDIRECT | Rest에 있는 식량/갈증 규칙의 검색 경로 |
| `heretic:table-curseCure` | SOURCE_UNAVAILABLE | HERETIC PDF 37의 결과 12가 공급 PDF 하단에서 잘림 |
| `heretic:staff-awful-light` | SOURCE_UNAVAILABLE | HERETIC PDF 66이 해당 물건의 효과/수치를 제공하지 않음 |
| `mythic-crafter-source` | SOURCE_UNAVAILABLE | Mythic PDF 172/173/175가 인용하는 별도 Adventure Crafter 자료가 공급되지 않음 |

## 22. 저장·배달

스키마 마이그레이션과 기존 결과 재생성을 하지 않았다. private 자료 변경 전 원본을 `outputs/pdf-remediation-batch-2/private-data-before.json`에 보관했다. 사용자의 실제 브라우저 저장소는 열거나 수정하지 않았다. 저장 보존 검사는 별도 Chrome context의 이전 QA Campaign으로 했다.

완료 코드는 이 보고서와 함께 로컬 커밋한다. 정확한 완료 커밋 해시는 최종 응답에 기록한다. **공개 배포나 push는 수행하지 않았다.** 로컬 preview 검사를 공개 배포 검증으로 부르지 않는다.
