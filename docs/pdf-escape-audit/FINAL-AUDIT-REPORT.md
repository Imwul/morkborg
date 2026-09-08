# Complete PDF Escape Audit — 최종 보고서

**제품의 방향은 유지되고 있다. 그러나 “굴릴 수 있음”에 비해 “나온 결과의 정확한 효과를 바로 찾아봄”이 약하다.** 기본 전투, Reaction, 일반 오라클, 지역 몬스터, 도시·여행의 주된 화면은 종이 노트와 함께 사용할 수 있다. 남은 PDF 검색의 중심은 Power·장비·클래스의 이름별 정의, 일부 몬스터의 하위 스탯, 선택한 솔로 규칙의 후속 절차, 한국어/상황 검색이다.

감사한 최종 애플리케이션 HEAD: `479cbd765b4168eeaeee27f921bf4b0a6615c51b`. 원문 전수 검토와 넓은 브라우저 시나리오는 `a50d2425deb9a4e9c7e7abb0983dd4c34c68c116`에서 시작했다. 이후 실제 production diff, 설치된 데이터, 검색, 변경된 결과 표시를 재검사했다. [현재 HEAD 재검사](CURRENT-HEAD-RECHECK.md)가 이전 관찰 중 달라진 사항을 명시한다. 이번 완료 작업의 변경 범위는 감사 문서·데이터·감사용 도구다. 앱 수정과 배포는 수행하지 않았다.

## 1. 실제 자료와 검토 범위

프로젝트에 연결된 자료를 확인해 **주요 9권 776페이지와 추가 5개 PDF 17페이지**, 총 **14개 파일 793페이지**를 검토 범위로 확정했다. 파일 이름만으로 MB_Cheatsheet를 Core 보조 규칙으로 취급하지 않았다. 표지·도해·부록·재인쇄 표도 페이지 대장에 포함했고, 기계적 정보와 긴 독서용 본문을 분리했다. 완료 시 14개 원본 파일의 SHA-256이 기존 검토 파일과 모두 일치함을 확인했다.

주요 9권은 아래 책별 집계의 각 보고서에 연결되어 있다. 추가 자료의 처리는 다음과 같다.

| 추가 PDF | 페이지 | 처리 |
| --- | --- | --- |
| [DARK FORT](DARK-FORT.md) | 3 | 별도 선행 게임. 원문 독서 대상으로 분리; MÖRK BORG 구현 누락으로 세지 않음. |
| [DARK FORT SHEET](DARK-FORT-SHEET.md) | 1 | 인쇄용 시트. PDF_APPROPRIATE. |
| [FERETORY Svenska texter](FERETORY-SV.md) | 10 | 스웨덴어 대응 자료. 영어판과 중복된 기계적 필요를 다시 세지 않음. |
| [Death Ziggurat player map](DEATH-ZIGGURAT-MAP.md) | 1 | 지도/시각 자료. PDF_APPROPRIATE. |
| [MB_Cheatsheet](MB-CHEATSHEET.md) | 2 | 실제로는 Mythic Bastionland 자료. MÖRK BORG 범위 밖이며 누락으로 세지 않음. |

자료 위치·파일 해시·페이지 수는 [source-inventory.json](data/source-inventory.json)에 있다. 개인 Downloads의 다른 게임 파일은 이 프로젝트에 공급된 규칙으로 임의 편입하지 않았다. 발견된 추가 자료를 숨기거나 레지스트리의 9권 숫자로 전체 자료 범위를 추정하지 않았다.

현재 앱을 실제 어댑터로 재구성한 결과는 **Reference 770개, canonical table 562개, 표의 root entry 12,276개, Oracle procedure 정의 59개, 선택 가능한 클래스 12개와 classless, creature 데이터 89개/참조 88개**다. 전체 기능·별칭·관련 참조·실제로 장착된 contextual 도구는 [APP-INVENTORY.md](APP-INVENTORY.md)에 기록했다. 이 숫자들은 서로 다른 단위이므로 합쳐서 커버리지로 사용하지 않는다.

## 2. 분류 총계와 읽는 방법

주요 9권의 **출처별 1,516행**에서 같은 필요를 공유하는 **248개 중복 출현**을 제거했다. 따라서 **고유 필요 1,268개 = 플레이 관련 1,220개 + PDF 독서가 적절한 48개**다. 별도 보조 자료 4개의 PDF_APPROPRIATE 행은 주 집계 밖에 있다. MASTER에는 이 보조 행까지 포함해 1,520행이 있다.

| 분류 | 고유 필요 | 전체 1,268개 대비 | 플레이 관련 1,220개 대비 |
| --- | --- | --- | --- |
| RESOLVED | 616 | 48.58% | 50.49% |
| PRESENT_BUT_INDIRECT | 219 | 17.27% | 17.95% |
| PARTIAL | 116 | 9.15% | 9.51% |
| MISSING | 266 | 20.98% | 21.80% |
| PDF_APPROPRIATE | 48 | 3.79% | 제외 |
| SOURCE_UNAVAILABLE | 3 | 0.24% | 0.25% |

참조를 검색했다는 이유만으로 RESOLVED로 세지 않았다. 효과·필요한 판정·제약이 실제로 읽혀야 한다. 한편 정확한 영어로 완전한 규칙을 여는 경로가 있어도 다른 상황 검색은 실패할 수 있으므로 검색 경로의 실패는 별도로 기록했다. 이런 교차 문제는 고유 필요를 추가로 늘리지 않는다. 모든 표 행을 각각 세지 않고 사용법이 같은 표는 한 필요로, 독립적인 이름별 기계적 정의는 별도 필요로 세었다. 따라서 전체 비율 하나를 제품 점수로 해석하면 안 된다.

## 3. 책별 커버리지

| 책 | PDF 페이지 | 플레이 필요 | Resolved | Indirect | Partial | Missing | PDF 적절 | Source unavailable |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| [Core Bare Bones](CORE-BARE-BONES.md) | 76 | 240 | 56 | 69 | 73 | 42 | 3 | 0 |
| [Core Full Edition](CORE-FULL.md) | 96 | 265 | 64 | 74 | 76 | 51 | 10 | 0 |
| [FERETORY](FERETORY.md) | 68 | 181 | 93 | 55 | 6 | 27 | 5 | 0 |
| [HERETIC](HERETIC.md) | 68 | 137 | 47 | 32 | 9 | 47 | 6 | 2 |
| [Sölitary Defilement](SD.md) | 40 | 49 | 33 | 5 | 4 | 7 | 3 | 0 |
| [Sölitary Depths](DEPTHS.md) | 36 | 71 | 57 | 9 | 4 | 1 | 3 | 0 |
| [RECLVSE](RECLVSE.md) | 138 | 336 | 214 | 13 | 11 | 98 | 2 | 0 |
| [Mythic GME 2e](MYTHIC.md) | 230 | 84 | 54 | 0 | 5 | 24 | 16 | 1 |
| [Alöne in the Crowd](ALONE-IN-THE-CROWD.md) | 24 | 102 | 58 | 31 | 1 | 12 | 3 | 0 |

두 Core 판본이나 여러 책에 재등장하는 대상은 각 책에 출처를 남기되 전역 집계에서는 한 번만 센다. 책별 열을 더하면 중복이 생긴다. 예를 들어 Alöne의 Gunsmith가 가리키는 화약 규칙은 HERETIC의 같은 필요와 연결되어 있다.

## 4. 워크플로별 커버리지

| 워크플로 | 플레이 필요 | Resolved | Indirect | Partial | Missing | PDF 적절 | Source unavailable |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Combat | 116 | 15 | 39 | 35 | 27 | 0 | 0 |
| Character | 227 | 66 | 64 | 65 | 31 | 4 | 1 |
| Dungeon | 194 | 79 | 16 | 14 | 84 | 21 | 1 |
| Monster | 184 | 98 | 30 | 14 | 42 | 0 | 0 |
| NPC | 79 | 35 | 7 | 6 | 31 | 0 | 0 |
| Solo | 338 | 261 | 13 | 8 | 54 | 27 | 2 |
| City | 169 | 64 | 57 | 8 | 40 | 0 | 0 |
| Travel | 204 | 116 | 8 | 33 | 47 | 0 | 0 |
| Equipment | 286 | 4 | 153 | 41 | 88 | 0 | 0 |
| Powers | 88 | 0 | 59 | 21 | 8 | 0 | 0 |

워크플로는 서로 겹친다. 같은 Power가 Character·Combat·Powers에 포함될 수 있다. Powers의 완전 해결 수가 0이라는 것은 모든 주문 데이터가 없다는 뜻이 아니다. 현재 20개 Core Power 효과는 굴린 결과에 보이지만 이름별 조회와 TABLE의 기계적 완결성이 부족하다.

## 5. P0 / P1과 TOP 20

**P0: 0개.** 일반적인 Core 전투 흐름은 기존 규칙과 표로 계속 진행할 수 있었다. 모든 선택 규칙이나 특수 장비가 완성됐다는 뜻은 아니다.

수정 가능한 고유 격차는 **601개: P1 70개, P2 506개, P3 25개**다. 공급 자료 한계 3개는 이 구현 문제 수에 포함하지 않았다. P1 전체 70개는 [COVERAGE.md](COVERAGE.md)의 필요별 목록에서 출처와 점수까지 볼 수 있다. 여러 Power/무기, RECLVSE의 개별 Move가 포함되므로 “70개의 대형 기능”으로 읽으면 안 된다. 선택 규칙 P1의 빈도는 그 규칙을 사용하는 세션에 한정한다.

| 순위 | PDF 검색 상황 | 심각도 | 빈도 × 마찰 | 적용 범위 |
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

각 상황의 **정확한 책·PDF/인쇄 페이지·현재 경로·PDF가 필요한 이유·최소 수정·needId**는 [TOP-20-PDF-ESCAPES.md](TOP-20-PDF-ESCAPES.md)에 있다. 이 목록은 관련 문제를 묶은 우선순위이며 커버리지 집계에 다시 더하지 않는다.

## 6. 실제 플레이에서 끊기는 지점

| 흐름 | 앱에서 계속할 수 있는 부분 | PDF 검색/우회가 남는 부분 |
| --- | --- | --- |
| Combat | Initiative, attack/defense, armor/shield, Crit/Fumble, Broken 결과, Morale | 주운 무기 피해, Omen 선택지의 정확한 표현, 특수 몬스터 참가자/변형. `healing`, `critical`, `갑옷 깨짐` 같은 용어 검색도 약함. |
| Non-combat | Reaction, NPC prompt, 주요 방/보물 표, 기본 휴식·치유·운반 규칙 | 장비 가격/소모량, 특정 아이템/클래스 효과, 결과에서 정의로 가는 링크. |
| Solo | Yes/No, Action + Theme, Mythic 표준 Fate/Scene/Meaning | Mythic 빈 목록·Altered Scene·NPC 행동 후속 규칙, 선택한 RECLVSE의 기본 규칙/Move. |
| Dungeon | 준비된 Special Room, 원문 조건부 구성, Room Source→TABLE→복귀, 주요 crawl/조우 도구 | SD 야외 Micro-crawl, Useful Item의 다른 표/정의 연결, Room Exits의 열 제목, 선택한 Depths 카드 절차. Special Room 재설계는 필요 없음. |
| City | CITY CRAWL 내부 street/contents/exits, NPC encounter, directions/pray/stash의 전체 행동 | 검색이 Weak/Fail 하위 표부터 열고, 일부 상업/무기 정의 연결과 TABLE의 공통 조건이 부족함. |
| Travel | Calendar→weather→road/forage→encounter→camp의 정상 흐름 | FER 도로 소요 시간, SD Misery 주사위 변화, Depths EL, RCL 고유 이동 규칙. |
| Character / Class | 생성된 캐릭터의 장비 피해·효과와 클래스 설명 | 조회를 위해 캐릭터를 새로 생성해야 하는 우회. 이름별 기본 클래스/고유 능력·장비를 열기 어려움. |

## 7. 장비·Power·클래스와 생성 후속 조회

**장비:** Core의 구입 무기 17종, 일반 장비 45행, 탄약 2행, 짐승 5행, 서비스/수리 8행 및 갑옷/방패를 각각 확인했다. 시작 장비에 이미 있는 치료량·용량·함정/독 효과는 없다고 세지 않았다. 문제는 추가 무기/가격의 부재, 기존 damage의 표시 누락, 특정 이름으로 접근하기 어려운 효과다. FERETORY의 Ochre Tablets 사용 조건, HERETIC 화약 무기, 보충 자료의 개별 기계적 아이템도 같은 기준으로 기록했다.

**Power / scroll:** Core 20개 효과의 대상·주사위·범위·지속·예외를 확인했다. 현재 ROLL에 효과가 보이는 개선을 반영했다. 그러나 `Daemon of Capillaries`는 검색되지 않고 TABLE은 이름만 보인다. 새 스펠 생성기보다 기존 효과 데이터의 읽기/연결이 우선이다. 일반 casting 규칙은 `Powers`로 한 번에 열리며 `마법`은 여전히 후보 필터에서 탈락한다.

**Class:** 6개 Core 클래스의 기본 규칙, 이름 있는 능력 30개, Herbmaster decoction 8개를 독립 확인했다. FER/HER의 추가 클래스와 RCL의 별도 클래스 규칙도 각 출처에 기록했다. 생성 지원만으로 클래스 조회를 해결했다고 세지 않았다. 실제 Fanged Deserter의 완전한 능력은 생성된 시트에 있었지만, 검색은 배경 표를 먼저 열었다.

| 실제 생성/조회 표본 | 다음에 알아야 하는 것 | 현재 결론 |
| --- | --- | --- |
| Knife / Flail | 피해 | Desk result/TABLE에 없음. Character의 Zweihänder 피해 표시는 별도로 작동. |
| Medium armor | 방어량·제약·가격 | 일반 armor rule로 일부 답할 수 있으나 이름→정의/구입 정보는 약함. |
| 시작 장비·life elixir·shield | 사용 효과 | 해당 표/시트에는 기계적 정보가 있는 사례를 확인. 모든 장비 효과가 빠진 것은 아님. |
| Sacred/Unclean scroll | 해당 Power 효과 | 현재 굴림 결과는 효과 포함. 정확한 이름 조회와 전체 표에서는 여전히 불완전. |
| Nodh / Carrion Owls | 전투 스탯·능력·출처 | 샘플은 완전했고 PRIMARY와 ROUTING이 구분됨. |
| Carcasswan / starved peasants / regular wolf | 변형·참가자·동행자 스탯 | 공급 원문에는 있지만 현재 출력에서 일부 손실. |
| NPC packet | 해석할 prompt와 Reaction | 목적에 맞게 사용 가능. 모든 직업에 임의 스탯을 요구하지 않음. |
| Encounter | 실제 표 내용과 필요한 후속 대상 | 표에 따라 충분하지만 일반 `encounter` 검색은 RCL 단편을 먼저 제시. |
| Special Room | 구조화된 원문 구성·조건 | 검토한 방은 사용 가능. Source와 canonical table을 닫으면 Room 02로 복귀. |
| Occult treasure / Dungeon relic | 명시된 효과 | 검토한 효과는 보였음. 이 성공을 모든 보충 아이템의 완전성으로 일반화하지 않음. |

## 8. 검색·문맥·표 보기

현재 HEAD에서 **1,136개 진단 검색**을 실행했다. 빈 결과 367개는 의도적으로 섞은 미구현 원문 제목·이름·한국어·표 제목의 결과이며 사용자 실패율은 아니다. 원래 1,132개 검색 중 top-five 순서가 바뀐 것은 `Powers`와 `Power`였다. 정상 영어 lookup인 Reaction/Morale/Broken/지역 Monster는 빠르다. 한국어와 이름별 기계적 정의는 약하다.

| 검색 유형 | 확인한 사례 | 최소 개입 |
| --- | --- | --- |
| 공식 명칭을 앎 | Broken·Reaction·Prowler는 직접 사용 가능; Fanged Deserter는 배경 표, Heavy Armor·Daemon of Capillaries는 실패 | 기존 정의에 이름별 OPEN과 정확한 별칭 |
| 상황/일상 표현 | `0 HP`는 되지만 `피 0`, `내 HP가 0`은 실패; `rest`는 되지만 `healing`은 실패 | 같은 기존 참조에 한국어/영어 별칭 |
| 한국어 | `갑옷`은 Crit/Fumble, `반응`은 관련 없는 결과가 앞섬; `보물`, `전리품`, `마법`은 없음 | 실제 규칙/표를 후보로 만드는 별칭과 목적에 맞는 순위 |
| 절차 이름 | `city crawl`, `get directions`, `pray`, `stash`는 하위 결과 표부터 노출 | 이미 있는 부모 행동으로 라우팅 |
| 모호한 짧은 단어 | `camp`는 dream 표, `encounter`는 RCL 표, `Mythic Actions`는 Animal Actions | 필요한 부모 도구/기본 표 우선 연결 |

전체 원래 검색표는 [SEARCH-AUDIT.md](SEARCH-AUDIT.md), 현재 결과는 [head-recheck.json](data/head-recheck.json)이다. SOURCE의 책/쪽만 알려주는 것은 기계적 정보가 없을 때 해결로 인정하지 않았다.

**문맥:** 실제로 장착된 Dungeon/City/Journey 도구와 Desk RELATED는 도움이 된다. Monster→Reaction/Morale/Corpse/Loot가 가능하다. 반면 `ObjectPlayTools`의 선언된 Character/Monster/NPC 추천 목록은 실제 장착된 화면으로 세지 않았다. 생성한 장비/Power→정의, 클래스→고유 효과가 더 중요한 끊김이다.

**표 보기:** 562개 모두 참조 경로·SOURCE·TABLE을 갖고, 544개는 굴림/재굴림이 가능하다. 18개는 카드·선택·중첩 범위 등 정당한 이유로 자동 굴림을 막는다. 표를 읽어 종이에 선택하는 것은 허용 가능한 사용이다. 일반적인 행 클릭 선택/물리 주사위 입력 기능이 없다는 이유만으로 결함으로 세지 않았다.

그러나 **11개 표 55개 행의 기계적 필드**, **7개 표 64개 행의 선택자/열 맥락**은 실제로 덜 보인다. 원문 카드 rank/suit, SD의 Special Rooms Uncovered 열, HER 소문의 truth가 예다. 또한 Graves body loot TABLE은 한 표를 두 번 그리지만 원문의 두 번 굴림 자체는 맞다. 전체 표 검사: [TABLE-ACCESS.md](TABLE-ACCESS.md). 이 행 수들은 기존 필요의 부분집합이며 커버리지에 더하지 않는다.

## 9. 브라우저와 노트북 테스트

격리된 로컬 브라우저에서 Session 없이 진행했다. 기본 관찰은 **66건**, 약 **33분 경과**의 대표 플레이 흐름이다. 읽기·대기·대조 시간이 포함되어 33분 연속 사람 플레이나 사용자 연구라고 주장하지 않는다. 노트북을 실제로 작성했다고도 주장하지 않는다. 화면으로 얻지 못한 답을 저장소 지식으로 대신 채우지 않았다.

최종 HEAD에서 추가로 **20개 검색/13개 결과 열기**를 검증했다. 두 scroll TABLE, weapon TABLE, COPY, 360px SOURCE를 다시 열었다. 원래 넓은 검사와 최종 변경 부분 재검사를 구분해 보존했다.

| 시작 문맥 | 유용한 답/출력까지 활성화 횟수 | 결과 |
| --- | --- | --- |
| 검색어 입력 후 Reaction | 1 | 결과; COPY 추가 1 |
| Morale / Armor / Rest / Powers | 각각 1 | 정상 규칙 사용 가능 |
| Broken | reminder 1, RELATED를 거쳐 굴림까지 합계 3 | 별도 Broken Oracle 결과를 바로 선택하면 1 |
| 준비된 Fanged Deserter sheet | class disclosure 1 | 능력 사용 가능 |
| Campaign에서 클래스 조회용 새 시트 생성 | 5 | 조회 목적에는 불필요한 준비 우회 |
| Sarkash monster | GENERATE 1; MORE 1; SOURCE 1 | 샘플 생성과 출처 체인 확인 |
| 열린 Room 02 | SOURCE 1 → TABLE 1 → 닫기 1 | 원래 Room 02 문맥 유지 |
| 열린 참조에서 전체 표 | SOURCE 1 → TABLE 1 | 이름만 나오는 표는 여전히 효과 조회 실패 |
| Desk에서 City directions 결과 | 3; 사용법 공개 추가 1 | 이미 있는 완전한 행동에 도달 가능 |
| Journey의 설정 후 정상 경로 | 단계 행동 5 | Calendar→weather→road→encounter→camp |
| `Daemon of Capillaries`, `healing`, `피 0`, `마법` | 실패 | 0클릭 성공으로 세지 않음 |

타이핑·스크롤·도구 재시도는 클릭에 포함하지 않았다. 최초부터 모든 경로가 1클릭이라는 뜻이 아니며, 시작 문맥을 위 표에 명시했다. 1440px에서 클래스/도시/표/방을, 360px에서 Reaction→Copy→Recent→Reroll→Source→Back을 확인했다. 문서 가로 넘침은 없었지만 모바일 상단의 긴 Pin tray는 끝 항목의 가시성이 약했다. UI 수정은 하지 않았다.

노트북 흐름에서 실제 남은 escape는 무기 정의, Omen의 정확한 조건, 이름으로 찾는 Power/Class/장비, 일부 몬스터 참가자, Mythic 목록/장면 후속 규칙이었다. 나머지 `healing`/city 부모 행동처럼 존재하지만 다른 표현/경로를 요구하는 것은 조회 우회로 구분했다. [PLAY-WORKFLOWS.md](PLAY-WORKFLOWS.md)에 전체 시나리오와 관찰 근거가 있다.

## 10. 제품 방향·탐색 비중·주변 기능

**Has the product drifted? 현재 내비게이션과 기록 방식 기준으로는 아니다.** 첫 화면은 Reference Desk다. Campaign/Session 없이 검색·굴림·City·Mythic을 쓸 수 있고 Pin/Recent도 직접 실행된다. Campaign을 연 상태의 주 탐색 13개와 별도로 Sessions/Timeline/Threads/Rumors/Relics/Journal 6개는 닫힌 보조 기록 안에 있다. 이 기록들이 참조를 가로막는 증거는 없었다.

| 역할 | 주요 기능 | 판단 |
| --- | --- | --- |
| CORE | Reference/Search/Oracles/Rules/Pins/Recent/Source/Table, 지역 Monster/NPC/Encounter, City/Journey | 직접 PDF 검색을 줄임. 우선 유지해야 함. |
| SUPPORTING | Campaign/Dungeon/Room 정리, Character, 배치, import/export | 준비와 현재 위치를 보존해 참조에 도움이 됨. Dungeon crawl 중에는 핵심 역할. |
| OPTIONAL | Sessions, Timeline, Threads, Rumors, Relics, Journal, 일반 Notes | 노트북 사용자에게 주변 기능. 확장할 이유는 이 감사에서 발견되지 않음. |
| DISTRACTING 경로 | 숨은 효과를 보려고 기존 Oracle Library로 우회하는 경로 | 같은 효과를 다른 메뉴·메타데이터에서 다시 찾게 함. 라이브러리 전체를 불필요하다고 판단한 것은 아님. |
| 실행되지 않는 선언 | 미장착 ObjectPlayTools wrapper | 살아 있는 문맥 도움으로 셀 수 없음. 삭제는 수행하지 않음. |

문제의 성격은 과도한 일지 기능으로의 표류보다 **기계적 정의와 후속 조회의 불균형**이다. 새 관리 영역을 추가하는 것은 이 문제를 해결하지 않는다.

## 11. 제품 점수표

0–5의 감사 판단이며 통계적 평균이 아니다.

| 항목 | 점수 | 근거 |
| --- | --- | --- |
| RULE LOOKUP | 3/5 | 일반 Core 전투·회복은 충분. Omens 정밀도와 선택 규칙/절차가 부족. |
| RANDOM TABLE COVERAGE | 4/5 | 562개 표와 주요 source-backed roller. 일부 조건/카드 선택자/전체 절차는 불완전. |
| GENERATED CONTENT FOLLOW-THROUGH | 2/5 | Power 굴림 효과는 개선됨. 이름별 정의, weapon damage, 몬스터 하위 스탯/장비 연결이 약함. |
| SEARCH DISCOVERABILITY | 2/5 | 정확한 표 제목은 잘 찾음. 상황 한국어·고유 item/Power/Class 이름은 자주 실패. |
| SOURCE TRUST | 4/5 | Primary/Routing/App policy 구분과 Room source 추적이 작동. 일부 요약 표현과 표 선택 맥락은 다시 원문을 확인해야 함. |
| PLAY SPEED | 4/5 | 이미 찾은 일반 굴림은 1클릭, Copy도 1클릭. 이름 조회 실패와 클래스 준비 우회가 점수를 제한. |
| NOTEBOOK COMPATIBILITY | 5/5 | 기록 강제 없이 참조·굴림 사용 가능. 보조 기록은 접혀 있고 해석은 사용자에게 남음. |

## 12. 다음 구현 묶음 — 이번 감사에서는 구현하지 않음

| 묶음 | 구체적인 최소 수정 | PDF 검색 감소 가치 |
| --- | --- | --- |
| A — SEARCH | 기존 Broken/Armor/Rest/Casting/Reaction/Corpse/Treasure에 한국어·상황 별칭. City/캠핑의 부모 행동을 하위 표보다 먼저 연결. Powers 영어 우선순위는 이미 수정되어 제외. | HIGH |
| B — MECHANICAL REFERENCES | 기존 20개 Power effect를 TABLE/이름별 OPEN에 노출; 기존 10 weapon damage 표시; 필요한 가격/추가 무기·아이템 및 클래스 기본 규칙 참조; Core/SD Omens의 부정확한 요약 교정. | HIGH |
| C — LINKING | 생성한 Power/장비/클래스→기존 정의, FER variants/participants/동행자→기존 스탯, Gunsmith→공급된 HERETIC 화약 규칙. | HIGH |
| D — TABLE ACCESS | SD exits 열, Depths 카드 rank/suit, HER truth/원래 범위, AitC 조건을 TABLE에 보존. 중복 TABLE 렌더만 제거하며 두 번 굴림은 유지. | MEDIUM |
| E — SOURCE LIMITS | HER cure 잘린 행의 완전한 허가 자료 확보 전 경고 유지. Staff 효과와 Adventure Crafter는 없는 원문을 합성하지 않음. | LOW; 세 사례에 한정 |
| F — 선택한 절차의 짧은 참조 | SD 일일 Misery/Power 예외·야외 Microcrawl, FER 이동 시간, Depths EL/다섯 장, Mythic list/NPC/Scene, 사용하는 경우 RCL 고유 Move 요약. 자동화·새 기록 시스템은 요구하지 않음. | MEDIUM 전체 / 해당 규칙 사용자는 HIGH |

각 행의 해결 유형은 [MASTER](MASTER-MATRIX.md)와 [coverage.json](data/coverage.json)의 SEARCH_ALIAS, SEARCH_RANKING, QUICK_RULE, TABLE_INDEX, TABLE_VIEW, RESULT_LINK, CONTEXT_LINK, ITEM_REFERENCE, POWER_REFERENCE, CLASS_REFERENCE, MONSTER_REFERENCE, PROCEDURE, SOURCE_MISSING, PDF_APPROPRIATE로 확인할 수 있다. 여러 유형은 한 필요에 함께 적용되므로 합산하지 않는다.

## 13. 검증 범위와 재현

[검증 결과](data/artifact-validation.json)는 행의 단일 분류, 고유 ID, 필요 중복의 분류 일치, 실제 source/table ID, 물리 페이지 범위, 페이지 대장, 빈도×마찰, 집계 입력 해시, 표 인벤토리 및 보고서 링크를 검사한다. 전체 원문이나 private Oracle database는 감사 산출물에 새로 포함하지 않았다. 개인 캠페인/브라우저 저장소를 바꾸지 않고 격리된 QA 문맥을 사용했다.

앱 production 코드가 바뀌지 않아 이번 완료 작업을 새 앱 기능 테스트나 lint/build 통과 보고로 포장하지 않는다. 감사 도구 실행 및 실제 브라우저/시각 확인이 이 작업의 검증이다. 로컬 HEAD+공급 데이터가 대상이며 원격 배포의 smoke test를 수행했다고 주장하지 않는다. 원본 전체 독서 기록은 유지하고 최신 HEAD에서 영향받은 부분을 다시 확인했다.

## 마지막 답: 무엇 때문에 아직 PDF를 열게 되는가?

### A. SHOULD BE FIXED

주운 무기의 피해·가격, 이름으로 지정한 Power와 클래스 능력, 일부 기계적 장비, Carcasswan 변형/농민/동행 늑대의 스탯, 정확한 Core/SD Omens 조건, FER 도로 시간, 사용하는 솔로 체계의 후속 규칙이다. 짧은 규칙·기존 데이터 노출·정의 연결로 해결할 수 있는 참조 문제다.

### B. EXISTS BUT IS TOO HARD TO REACH

생성된 Character 안의 클래스/Power 효과, 시작 장비 표 안의 기계적 정보, 일반 rest·armor·casting, CITY CRAWL의 완전한 directions/pray/stash 행동이다. 영어 공식 명칭이나 내부 표 제목을 알아야 하거나 다른 화면에서 생성해야 한다. `healing`, `피 0`, `갑옷`, `마법`, `시체`, `보물` 같은 실제 표현과 결과→정의 연결이 가장 작은 개선 지점이다. 모든 표를 볼 수 있어도 효과나 선택 열이 빠진 경우에는 여전히 PDF가 필요하다.

### C. SOURCE IS UNAVAILABLE / INCOMPLETE

1. **HERETIC PDF37 / 인쇄35 — curse cure 12번:** 공급 PDF의 물리 페이지 끝에서 문장이 잘렸다. 현재 조각과 경고를 유지하고 완전한 행이 확보되기 전에는 끝을 추측하지 않는다.
2. **HERETIC PDF66 / 번호 없는 마지막 fold — Staff of Awful Light:** 목표물 이름·위치는 있지만 효과/스탯이 적혀 있지 않다. 구현 누락으로 임의 효과를 만들 수 없다.
3. **Mythic PDF172–173, 175 / 인쇄171–172, 174 — Adventure Crafter:** 별도 책/덱의 생성 자료가 공급되지 않았다. Mythic 안의 통합 설명 부족과 외부 원문 부재는 다른 문제다.

Alöne의 **화약 무기는 이 그룹이 아니다**. HERETIC PDF46 / 인쇄44가 실제로 공급되어 있다. **Cursed Trout도 원문 부재가 아니다**. FERETORY PDF20 / 인쇄18의 효과는 확인되며 의도적으로 없는 전투 스탯을 요구해서는 안 된다.

### D. PDF IS APPROPRIATE

긴 시나리오 본문, 설정/분위기 독서, 삽화·지도, 전체 예시, 문맥과 해석을 깊게 읽으려는 경우다. 종이 시트·지도와 다른 게임 자료도 앱 안에 복제할 필요가 없다. 이러한 의도적인 독서는 제품 결함이나 미구현 참조로 세지 않는다.
