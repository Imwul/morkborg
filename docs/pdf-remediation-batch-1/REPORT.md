# PDF Escape Remediation · Batch 1

완료 범위는 감사 HEAD `479cbd765b4168eeaeee27f921bf4b0a6615c51b`의 TOP 20 중 **1, 2, 3, 4, 8, 9, 13, 16, 19, 20**입니다. 구현 시작 HEAD는 감사 문서를 마무리한 `71c59c7bfd5d09f2c670dd3d9e650c2e8d8784e3`입니다. 원래 MASTER-MATRIX, COVERAGE, PLAY-WORKFLOWS, SEARCH-AUDIT, CURRENT-HEAD-RECHECK, master-rows는 수정하지 않았습니다. 새로운 전면 감사를 수행하거나 캠페인 관리 영역을 추가하지 않았습니다.

## 구현 결과

| 항목 | 이번 변경 |
|---|---|
| Omens | 공격의 최대 피해, 자신/타인의 주사위 재굴림, 자신이 받는 피해 d6 감소, **Crit/Fumble 무효화**, **한 판정의 DR −4**를 구분했습니다. DR 감소를 재시도로 쓰던 표현을 제거했습니다. 직업별 시작 주사위, 직업 없음 d2, 모두 소진한 뒤 6시간 이상 휴식 후 회복 조건을 명시했습니다. 원문이 정하지 않은 사전/사후 사용 제한은 추가하지 않았습니다. |
| Power | 기존 두 표의 **20개 원문 effect**를 그대로 재사용하는 독립 정의를 만들었습니다. 20개 이름 모두 첫 결과이며, 대상·지속시간·DR·제약은 원문 effect에 있는 범위만 노출합니다. 공통 시전 규칙은 기존 Casting 참조로 연결합니다. |
| Power TABLE | 이름과 짧은 효과 미리보기를 표시하고 전체 효과를 펼칠 수 있습니다. 표의 Power 이름도 정의로 연결됩니다. |
| 생성 Power | 생성된 스크롤/타고난 Power 이름, 캐릭터 장비, 오라클 결과에서 정식 정의를 엽니다. 실제 생성된 Unmet Fate로 확인했습니다. |
| SD Misery | **SÖLITARY DEFILEMENT VARIANT**라는 별도 참조를 추가했습니다. 매일 굴림, 선택한 시작 주사위의 d20 상한, Misery 이후 단계 하락을 설명합니다. d2 이후의 새 결과는 만들지 않았습니다. |
| Calendar / Journey | 달력과 여행에서 위 SD 참조를 재사용합니다. 기존 달력의 저장·주사위 로직은 Core 방식 그대로이며, SD 단계 변화를 자동 처리하는 기능은 추가하지 않았습니다. |
| FER 이동 시간 | 지도에서 검증한 **11개 도로 구간**을 읽기용 참조로 제공합니다. 세계 크기·악천후 조정과 알려진 도로 밖의 조건을 포함합니다. 같은 이름/시간인 두 바다 방향 선은 별개 원문 구간으로 유지했습니다. 경로 계획기는 없습니다. |
| 무기 | **17개** 구입/피해 정의를 노출했습니다. 기존 시작 무기 10종과 구입 목록의 추가 7종을 조회할 수 있습니다. 명시된 탄약·가격만 포함합니다. 관련 감사 항목인 급조 무기 d4와 맨손 d2도 짧은 규칙으로 연결했습니다. |
| 갑옷 / 방패 | No armor와 Light/Medium/Heavy의 **4개 갑옷 정의**, 별도 Shield 정의. 피해 감소·DR 불이익·중갑/중형 갑옷의 스크롤 제한·출처 가격을 표시합니다. Heretical Priest 예외는 해당 Class 참조에서 확인합니다. |
| 일반 장비 | 감사 목록 **45개 + Shield 1개**를 검색할 수 있습니다. Medicine box, Waterskin, Lantern oil, Poison, Bear trap 등은 원문 사용 조건을 포함하고, 가격만 있는 Tent 등의 용도를 창작하지 않았습니다. |
| 생성 장비 연결 | 캐릭터의 무기/갑옷/장비, 펼친 방 구성 요소, 오라클·보물 결과, NPC/Encounter의 읽기 화면, 몬스터의 읽기 화면에 있는 식별 가능한 원문 이름을 연결했습니다. 저장된 문구를 정의 본문으로 교체하지 않습니다. |
| 상황 검색 | **19개 기존/정식 참조에 한국어 59개, 영어 65개 별칭**을 분리 저장했습니다. 원문 제목은 그대로입니다. `피 0`, `갑옷`, `도망`, `휴식`, `마법`, `스크롤`, `짐`, `사기`, `반응`, `시체`, `보물`이 유효한 규칙/롤러로 갑니다. |
| 검색 순위 | 별칭을 검색 후보 포함 단계와 점수 계산에 함께 적용했습니다. 정확한 기계적 정의 이름은 보조 표보다 우선합니다. `Death`라는 Power와 소문자 `death`라는 상황 검색을 구분하고, 일반 문장의 death를 Power로 잘못 연결하지 않습니다. |
| Class | **Core 6개 클래스 + 38개 클래스 표 능력/아이템**을 독립 조회합니다. 생성 없이 기본 능력·제약을 읽고, 큰 표는 관련 참조 또는 SOURCE에서 엽니다. 캐릭터 머리말의 클래스와 생성된 클래스 아이템도 연결합니다. |
| Character | Class, 무기, 갑옷, Power, Omens, 장비를 현재 시트에서 클릭하면 정의를 엽니다. 편집은 EDIT에서 계속 가능합니다. 새 정의 본문이나 사전 전체를 캐릭터 저장 데이터에 복사하지 않습니다. |
| City 부모 절차 | City Crawl / Get Directions / Pray / Stash Item을 기존 CityRoller에 연결하는 부모 참조를 추가했습니다. DR·보정·선택·Strong/Weak/Fail을 먼저 확인하고 실행합니다. 하위 결과 표는 RELATED에 남고 명시적인 parentId를 갖습니다. |
| TABLE | 방 출구의 `Special Rooms Uncovered` 0–4 열, Holy Places의 적용 규모/공통 조건, Graves Knowledge의 진위, 기존 카드/기호·열린 범위·후속 범위를 보존해 표시합니다. 선택자가 이름인 카탈로그는 같은 이름을 두 번 표시하지 않습니다. |
| 수동 선택 | 현재 원문 선택 결과를 표시할 수 있는 Core 준비 표 6개에서 `USE THIS RESULT`를 제공합니다. 캠페인에 자동 저장하거나 가짜 주사위 값을 만들지 않습니다. SOURCE의 **APP POLICY**로 수동 선택임을 구분합니다. |

정식 조회 정의는 총 **132개**입니다(20 Powers, 17 Weapons, 4 Armor, 46 Equipment, 6 Classes, 38 Class abilities, 1 Travel). 현재 전체 Reference Registry는 **912개 참조 / 565개 표**입니다. 새 읽기용 표는 무기·장비·도로 시간의 3개이며, 기존 Power/능력 표를 별도 배열로 복제하지 않았습니다. 정확한 ID·출처·조회 순위는 [catalog-inventory.json](catalog-inventory.json)에 있습니다.

## 출처와 경계

| 검증 대상 | 공급 원문 위치 |
|---|---|
| Omens | Bare Bones PDF/인쇄 37; Full Edition Second Printing PDF 42 / 인쇄 38 |
| Powers | Bare Bones PDF/인쇄 35–36; 공통 시전 규칙 34 |
| 시작 무기·갑옷·Shield | Bare Bones PDF/인쇄 23 |
| 무기 구입 | Bare Bones PDF/인쇄 26 |
| 장비 구입/사용 | Bare Bones PDF/인쇄 24–25 |
| Toolbox 시작 장비 | Bare Bones PDF/인쇄 22 |
| Core 클래스 | Full Edition PDF 50–61 / 인쇄 46–57 |
| 클래스 표 능력 | Bare Bones PDF/인쇄 47, 49, 51, 53, 55, 57 |
| SD Misery | Sölitary Defilement PDF 5 / 인쇄 3 |
| 도로 시간 | FERETORY PDF 6 / 인쇄 4 — 지도 선의 양 끝을 시각적으로 확인 |
| 도시 부모 Move | Alöne PDF 6–8 / 인쇄 4–6; 기존 2d20/DR 처리 재사용 |
| 방 출구 / 도시 성소 / 진위 표 | 기존 감사·원문 표의 위치와 메타데이터 유지. 개별 ID와 페이지는 recheck.json |

각 정의는 canonical ID, book, PDF/인쇄 페이지, source status를 보유합니다. 영어 본문은 기존 원문 항목을 사용하며 한국어 도움말은 별도 메타데이터입니다. SOURCE는 기본적으로 닫혀 있습니다. 조회용 별칭·카탈로그 묶음·수동 선택은 앱의 탐색/표현 정책이며 새로운 공식 생성 절차가 아닙니다.

이번의 출처 데이터 변경은 [source-attestations.json](source-attestations.json)의 **10개 표**에 한정됩니다(읽기 카탈로그 3개, 갑옷 제한 메타데이터 1개, 클래스 이름 조회 메타데이터 6개). 공급된 전체 표의 해시를 무차별 승인하지 않았습니다. 개인 원문은 기존 암호화 업데이트 체계에만 담았으며 PDF, 복호화 키, 평문 데이터베이스를 공개 빌드/보고서에 넣지 않았습니다.

확인한 원문 차이도 유지했습니다. Toolbox는 시작 장비 목록에는 drill이 있고 구입 목록에는 없습니다. 정의에서 **Purchase list / Starting equipment**를 분리하고 각각의 출처를 제공합니다. 클래스 능력의 OCR 줄바꿈으로 깨진 이름은 조회용 `referenceName`에서만 보정했고 본문 원문은 덮어쓰지 않았습니다. FER 지도에서 같은 도착점·시간으로 보이는 두 바다 구간 역시 임의로 합치지 않았습니다.

## 실제 브라우저 수용 검사

로컬 현재 앱 `http://127.0.0.1:5174`의 별도 Chrome 프로필에서 검사했습니다. 사용자의 실제 캠페인/브라우저 저장소는 건드리지 않았습니다. 클릭 수는 **검색어를 입력한 뒤 또는 해당 객체/블록이 열린 뒤의 버튼 활성화**입니다. 검색 초점을 잡는 클릭·문자 입력·스크롤은 별도이며, 키 입력 시간을 제품 응답 시간처럼 보고하지 않습니다.

- [browser-search.json](browser-search.json): **22개 검색**, 첫 결과의 규칙/효과/롤러를 실제로 열어 확인. Daemon of Capillaries, Fanged Deserter, Zweihänder, medicine box, Omens와 요청된 한국어 11개, SD Misery, 도로 시간, 도시 Move 4개. 각각 **1클릭**으로 읽기/결과/절차에 도달했습니다. Pray 실행은 조건 선택 후 **추가 1클릭**입니다. Daemon의 COPY도 **1클릭**, 효과가 포함되고 내부 ID는 제외됩니다.
- [browser-character.json](browser-character.json): UI로 생성한 Esoteric Hermit의 **8개 연결**을 확인했습니다. Class → Knife → Light armor → Unmet Fate → Omens → Waterskin → 생성된 Bard 아이템 → Toolbox. 각 정의는 **1클릭**, SOURCE도 **1클릭**, 닫고 원래 시트로 돌아오기 **1클릭**입니다. Power SOURCE에서 정식 표도 **1클릭**으로 열고 같은 캐릭터로 돌아왔습니다.
- 같은 캐릭터를 UI에서 저장하고, 연결 조회 전후 및 새로고침 후 전체 객체를 비교했습니다. **내용·ID·주사위 결과·출처가 동일**했고 새로고침 후 다시 읽을 수 있었습니다. 무작위 재생성이나 저장 데이터 마이그레이션은 하지 않았습니다.
- [browser-tables.json](browser-tables.json): Powers, 방 출구, 두 성소 표, 진위, 카드 선택자를 실제 TABLE에서 확인했습니다. 표를 의도적으로 보려면 검색 결과 → SOURCE → TABLE의 **3클릭**입니다. 선택 가능한 Power 행의 `USE THIS RESULT`는 **추가 1클릭**이며 APP POLICY가 표시됩니다. City의 하위 Failure 표도 실제로 열립니다.
- 같은 기록에서 `microcrawl`은 기존 Alöne 도시 도구를 **1클릭**으로 열고, 탐험 방식 선택 **1회**로 기존 d4 거리 모드에 도달했습니다. SD 야외 Micro-crawl을 구현한 것이 아닙니다.
- [browser-journey.json](browser-journey.json): Journey 달력 블록, 여행 블록, Calendar 관리 화면에서 정식 SD/이동 시간 참조를 각각 **1클릭**으로 열었습니다. 접힌 여행 블록을 펼치는 선택은 별도로 1회입니다.

기존에 이름 검색 결과가 없었던 Power·무기·장비는 유효한 클릭 수 자체가 없었습니다. 이를 임의로 “N클릭 단축”으로 계산하지 않았습니다. 이름 → OPEN이 불가능하거나 PDF가 필요했던 경로를 앱 안의 1클릭 정의로 바꾼 것입니다.

## 반응형·시각 확인

**360 / 768 / 1440 / 3440px**의 실제 스크린샷을 읽고 확인했습니다. 수치상 가로 넘침만 검사하지 않았습니다.

- 360: Power 제목·효과·COPY를 한 팝업 안에서 읽을 수 있습니다. 캐릭터 장비가 세로로 쌓이고 방 출구의 0–4 열이 유지됩니다. SOURCE는 눌러서 열며 hover에 의존하지 않습니다.
- 768: 캐릭터의 이름/클래스/능력과 장비 영역이 구분되고 정의 팝업도 폭 안에 들어옵니다.
- 1440: Power·클래스 정의가 정해진 폭에 표시되고 표의 조건은 의도적으로 펼쳐 읽습니다. 장비의 EDIT가 결과 문장에 붙어 보이던 간격을 보완했습니다.
- 3440: 참조 팝업과 캐릭터 본문이 화면 전체로 늘어나지 않고 중앙의 제한된 폭을 유지합니다.
- 포커스 표시를 유지했고 터치 포인터의 인라인 참조는 최소 높이를 확보했습니다. 큰 클래스/표는 스크롤이 필요하지만 기본 결과 화면에 전체 표·출처를 상시 펼치지는 않습니다.

스크린샷은 개인 원문과 QA 생성물을 포함하므로 공개 커밋 대신 ignored `outputs/pdf-remediation-batch-1/`에 보관했습니다. 이번 범위 밖인 캐릭터 페이지의 기존 생성 설정/여러 자원 컨트롤을 재설계하지는 않았습니다.

## 감사 항목 재분류

상세 전후 표는 [RECHECK.md](RECHECK.md), 항목별 기계 판독 자료는 [recheck.json](recheck.json)입니다.

**10개 승인 묶음, 중복 제거한 143개 필요 항목: PARTIAL 69 / MISSING 27 / PRESENT_BUT_INDIRECT 47 → RESOLVED 143.** 이는 해당 묶음에 대한 코드·데이터·대표 브라우저 흐름 검증 결과입니다. 모든 이름을 브라우저에서 하나씩 수동 검사했다는 뜻은 아니며, 전체 이름/효과/출처는 자동 검사하고 실제 사용 경로를 별도로 열어 검증했습니다.

19번의 제목과 needIds가 불일치했습니다. 제목의 City Crawl(`aitc-city-crawl`)을 직접 의존 항목으로 따로 기록하고, 배열에 실제 포함된 `aitc-microcrawl`도 기존 Alöne 모드로 연결했습니다. 따라서 추가 1개를 143개 집계에 중복 가산하지 않았습니다.

## 검증·데이터 안전

- 기존 **558개 테스트 유지 + Batch 1 테스트 21개 = 총 579개**, 모두 통과, skip 0.
- Omens 의미, 20 Powers의 효과·정확한 이름 순위, 17 무기 피해·탄약·가격, 갑옷, 45개 장비/Shield, 상황 별칭, 6 클래스/38 능력, 생성물 연결, 도시 부모/자식, TABLE 조건·선택, 출처 ID 검증, 수동 선택·복사, 저장/읽기 보존을 검사했습니다.
- 기존 검사에서 달라진 총 표 수만 **562→565**, 추가 private table pack 수 **359→362**로 갱신했습니다. 기존 검사를 삭제하거나 실패를 숨기지 않았습니다.
- `unresolvedReferenceDefinitions`: **0**. `unresolvedOracleSources`: **0**. 잘못된 source entry ID를 주면 검증이 실패합니다. 새 조회 정의의 효과와 참조를 검증했고 생성 원문 미해결 값을 도입하지 않았습니다.
- 소스가 없는 로드는 Power/Class/장비 정의의 대체 내용을 만들지 않습니다. 개인 자료 업데이트 병합은 저장 텍스트와 사용자 자료를 보존하며 원문과 일치하는 행에 필요한 조회 메타데이터만 더합니다.
- `npm run lint` 통과. `npm run build` 통과, 타입 검사와 공개 빌드의 PDF/평문/키 누출 방지 검사 포함.
- 변경 전 개인 자료 백업을 ignored `outputs/pdf-remediation-batch-1/private-data-before.json`에 보존했습니다. 캠페인 스키마·생성 규칙·원래 감사 문서는 바꾸지 않았습니다.

재현 도구는 [tools](tools/)에 있습니다. 카탈로그/자동 테스트에는 설치된 개인 자료가 필요합니다. 브라우저 도구는 `AUDIT_URL`, `AUDIT_PLAYWRIGHT_MODULE`로 실행 환경을 지정할 수 있으며, 캐릭터/여행 도구는 별도로 생성한 QA 프로필만 사용합니다. 원문/키/사용자 데이터가 든 프로필은 커밋하지 않습니다.

## 남은 PDF Escapes

나머지를 “작은 문제”로 합치지 않았습니다. [RECHECK.md](RECHECK.md)에 이번에 제외한 TOP 20의 **59개 정확한 ID와 기존 분류**를 표로 남겼습니다. [remaining-top20-audit-ids.json](remaining-top20-audit-ids.json)에도 있습니다.

전체 기존 감사에서 이번에 해결한 항목을 제외한 비해결/자료 부재 ID는 [remaining-audit-ids.json](remaining-audit-ids.json)에 보존했습니다. **460개**이며 기존 분류 기준 PARTIAL 47, PRESENT_BUT_INDIRECT 171, MISSING 239, SOURCE_UNAVAILABLE 3입니다. 이 수치는 나머지 460개를 이번에 다시 조사했다는 뜻이 아닙니다. 이행 범위 밖의 원래 판정을 그대로 인계한 목록입니다.

후속 대상은 RECLVSE 기본 규칙·Moves, HERETIC 화약 무기와 특수 조우, SD Power/Omens 전체 예외 경로, SD 야외 Micro-crawl/모험 시작·끝, Depths 다섯 카드 희귀 몬스터 및 Encounter Level, FERETORY 변형/동행자/참가자 스탯 연결, Mythic 고급 후속 절차입니다. SD 솔로 변형의 잘못된 주사위 “상승” 설명은 Misery 분리의 직접 의존 수정으로 바로잡았지만, 나머지 SD 예외 조회 전체를 완료했다고 주장하지 않습니다. 구체적인 항목/페이지/분류는 위 ID 목록을 따릅니다.

이번 결과는 **구현·검사·로컬 커밋**입니다. `data:publish`는 기존 개인 자료의 암호화 파일을 로컬에 준비하는 명령으로 실행했습니다. 공개 사이트를 배포하거나 운영 배포를 검증한 것이 아닙니다. 전달 커밋의 정확한 해시는 최종 응답과 Git 기록에서 확인할 수 있습니다.
