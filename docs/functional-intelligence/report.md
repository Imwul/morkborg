# Functional Intelligence Pass — 2026-09-20

기준 커밋: `123833a`. 시각 구조, 폰트, 색, 기존 탐색 모델을 유지하고 검색·실물 주사위 조회·원문 연결을 보완했다. 추가 요청에 따라 던전의 SD / DNGNGEN 출처와 실제 사용 경로도 대조했다.

## A. 실제 registry 감사

| 항목 | 이전 | 이후 |
|---|---:|---:|
| Reference | 1,000 | 1,001 |
| Oracle reference | 536 | 536 |
| Procedure reference | 68 | 69 |
| Rule | 285 | 285 |
| Creature reference/preset | 95 | 95 |
| Region | 7 | 7 |
| Book | 9 | 9 |
| Canonical table | 546 | 546 |
| Rollable / reference-only table | 518 / 28 | 518 / 28 |
| Registry procedure records | 58 | 58 |

추가된 참조는 기존 표를 연결하는 `procedure:sd.dungeon-preparation` 하나다. 새 원문 표나 새 oracle은 추가하지 않았다. 예전 작업에서 언급한 1,029/574가 아니라 이번 시작 시점의 실제 활성 데이터인 1,000/546을 비교 기준으로 삼았다.

표의 출처별 수: Core 53, SD 25, Depths 60, Feretory 48, Heretic 27, RECLVSE 221, Mythic2 53, AITC 59. 기존 9개 Book 중 표를 갖지 않는 책도 유지했다.

원문 관계는 하나의 형식이 아니었다. `followUpOracleIds`, `followUpReferenceIds`, `fixedLookups`, `followUp.table(s)`, `subtableId`, 중첩 `subtable`, `scrollTable`, Core의 `followup` 행 배열이 공존한다. 167개 원문 행/40개 표에 이 중 하나 이상이 있었다. 기존 Related graph는 3,090개 저장 연결, 499개 참조가 책만 연결하고 있었으며 dangling/self reference는 없었다. 이 graph 전체는 재설계하지 않았다.

## B. 실제 마찰

- `search body`, `시체 수색`, `how do they react`, `rain`, `날씨 표` 등 실제 사용어가 누락되었다. 33개 검색 probe 중 첫 결과가 맞은 것은 18개, 결과 누락 12개, 낮은 순위 3개였다.
- 화면에 번역되어 보이는 이름과 검색되는 이름이 달랐다. 기존 명시 번역과 생물의 한국어 이름이 충분히 색인되지 않았다.
- 실물 주사위 입력 후 입력창이 닫혔다. 결과의 원본 행도 자동으로 보이지 않았다. 수정 전 Sample Rooms `3,5`의 선택 행은 화면 아래 y=2,135px에 있었다.
- 결과 연결이 `followUpReferenceIds`인 경우만 결과 옆에 나타났다. 다른 기존 metadata 형식은 표에 있어도 연결 버튼으로 드러나지 않았다.
- 원문상 추가 표가 있는 Core 방도 읽기 목록만 제공했다. 부모 굴림과 추가 굴림을 구분해 사용할 수 없었다.
- 홈의 던전 버튼은 캠페인/지역/후보 생성 경로로 연결되어 reference-only 사용에 맞지 않았다. SD 준비 양식의 이유·경비가 동일하게 노출되지 않았다.

## C–D. 검토와 선택

채택: 로컬 alias·명시 번역 색인, 검색 순위 조정, 수동 입력 유지와 원본 행 이동, metadata 기반 선택적 참조 링크, 원문 그대로인 Core 추가 표의 독립 굴림, SD 준비 양식의 직접 접근.

보류: AI/의미 검색 서비스, 자동 하위표 실행, 새로운 추천 시스템, 전체 Related taxonomy 개편, 새로운 세션·저장 schema, DNGNGEN의 별도 콘텐츠 세트 복제. 이번 감사에서 확인된 마찰을 기존 기능으로 해결하는 쪽을 선택했다.

## E. 검색

관찰된 alias 11개를 추가하고 정확히 존재하는 제목 번역·설명 번역·생물 한국어 이름을 색인했다. 정확한 제목, 번역 제목, alias 일치가 우연한 설명/출처 문자열보다 앞선다. 기존 제목 보호(Death/Shield), source 검색, filter는 유지한다. `표/table/tables`와 기존 reference type 어휘도 지원한다.

33개 고정 probe는 **18/33 → 33/33 첫 결과**로 개선됐다. 예: `search body`, `search a corpse`, `시체 수색` → Corpse; `NPC 반응`, `how do they react`, `attitude`, `우호적` → Reaction; `rain`, `폭풍`, `기상`, `날씨 표` → Weather; `길 상태 표` → Road Type.

일반적인 semantic understanding을 구현한 것은 아니다. 기존 조합형 번역 fallback에는 부정확한 제목이 있어 무조건 색인하지 않았다. 감사한 347개 한국어 표시 제목 중 여전히 151개는 해당 표시 형태로 찾지 못한다. 원문 제목 검색은 가능하다.

## F. 실제 굴림 문법

| 원문 문법 | Rollable 표 수 |
|---|---:|
| d2 | 8 |
| d4 | 36 |
| d6 | 122 |
| d8 | 11 |
| d10 | 59 |
| d12 | 80 |
| d20 | 110 |
| d100 | 70 |
| 2d6 합계 | 4 |
| d66 좌표 | 15 |
| d4 × d6 / d4 × d8 / d6 × d8 | 각 1 |

518개 표의 가능한 실물 주사위 조합 **12,518개**를 원본 selector와 대조했다. d66은 `55` 또는 `5,5`, 좌표형은 두 면 값을 입력한다. 2d6는 `3,4`처럼 실제 개별 면을 입력하며 합계만으로 면을 추정하지 않는다. Range와 확률을 수정하지 않았다.

## G–H. 실제 브라우저 acceptance

아래는 실행한 UI 수동 검사이며 자동 브라우저 테스트 수로 세지 않는다.

| 검사 | 입력 / 동작 | 확인한 결과 |
|---|---|---|
| A. 불명확한 이름 | `search body` 검색 → 첫 결과 열기 | Corpse, 열기만으로 굴리지 않음 |
| B. d66 | Corpse `55` + Enter | Bloodstained knuckle-duster, 55행 강조·화면 내 표시 |
| C. 긴 d100 | RECLVSE Action Oracle `97` + Enter | Delay, 100행 중 97행이 화면 내 표시 |
| D. 좌표형 | Core Sample Rooms `3,5` + Enter | 35 Mirrors everywhere, 3440px에서 y=670–771px |
| E. 원문 연결 | AITC Stash Weak Hit `5` → NPC 연결 | 5–6행의 NPC Disposition + Profession을 열며 굴림 결과 0개 |
| F. 혼합 흐름 | `NPC 반응` → Reaction `3,4` → Related Morale → Failed Morale → Roll → Recent Reaction | 7–8 Indifferent 보존, Failed Morale 디지털 4=항복, 홈 복귀 불필요 |
| Core 추가 표 | Sample Rooms `1,1` → 추가 표 열기 → `3` | 부모 11=Inscriptions, 추가 d6 3=Hypnotic; 열기만으로 굴리지 않음 |
| 던전 직접 접근 | 홈의 던전 버튼 | 캠페인 없이 12개 준비 항목, 처음에는 결과 비어 있음 |
| 던전 전체 굴림 | 이유·경비 작성 → Reroll | 두 작성 값 유지, 4개 특별방 포함 |
| 던전 개별 굴림 | 특별방 4만 재굴림 | 다른 11개 항목 그대로 |
| 탐색·작업대·복사 | 던전 작업대 추가 → Reaction → Recent 던전 → Copy | 결과·작성 내용 보존, 작업대 표시, 복사 성공 |
| Core Miseries | 원본 참조 열기 | d66 본문 36행, 별도 7:7 본문과 PDF20 유지 |
| 모바일 중첩 표 | 추가 d6 `3` 조회 후 부모 `3,5` 재입력 | 중첩 행 대신 부모 35행으로 이동, y=362–438px |

필수 session start / progression / save / mode transition: **모두 0**.

Core inline 추가 표는 Status 3–6의 d4, Danger 1의 d4, Sample Rooms 11의 d6 / 33의 d4 / 43의 d4, 총 5개다. 원문 행과 기존 검증된 procedure의 주사위를 함께 사용한다. 별도 canonical table을 만들지 않는다. Oracle 결과의 링크는 원래 행의 단일 추가 표를 열므로 두 군데에서 서로 다른 추가 결과가 생기지 않는다.

연결 노출은 **120개 행/22개 표/185 raw link → 137개 행/33개 표/203 raw link**. paired reference alias를 실제 reference ID로 해석한 후 중복을 제거하면 행별 연결 대상은 총 180개다. 기존 fixed lookup 5개도 보존했다.

## 던전 원문 대조

- 확인한 사이트는 [DNGNGEN](https://dngngen.makedatanotlore.dev/)이다. 실제 사이트와 공개된 현재 JS/source map을 로컬 보관본과 대조했다.
- 사용자 로컬 SD PDF의 printed7/PDF9, printed13/PDF15, printed17/PDF19와 [저자 배포 페이지](https://1d105.itch.io/solitary-defilement)를 확인했다.
- SD는 특별방 준비에 DNGNGEN, Core Bedeviled Dungeons, SD Room Descriptors를 대안으로 제시한다. 따라서 Core Sample Rooms를 사용하는 것 자체는 오류가 아니다.
- DNGNGEN은 39/39/34/34개의 네 pool, 총 146개 방 세부사항을 조합한다. Core 24개 셀에서 네 번 뽑는 것과 같은 알고리즘이 아니다. 이 차이를 문서와 UI에 표시했다.
- 준비 양식은 이름 / 상태 / 임박한 위험 / 거주자 / 방문 이유 / 입구 / 경비 / 독특한 특징 / 특별방 1–4로 정리했다.
- 이름은 두 독립 d12 결과를 조합한다. Core의 상태 d6, 위험 d10, 거주자·특징 d12, 방 d4×d6를 사용한다. 입구는 RECLVSE d20이라는 앱 선택을 명시했다.
- 기존의 지역 가중치를 새 참조에 가져오지 않았다. Core 24개 방 셀을 원래 확률로 사용하며 중복 방을 임의 제거하지 않는다. 추가 표는 자동 굴리지 않는다.
- 설치된 canonical 데이터에 DNGNGEN의 방문 이유·경비 표가 없으므로 두 칸은 직접 작성한다. 원문 사이트를 열어 참고할 수 있다. DNGNGEN의 모든 콘텐츠/분포를 재현했다고 주장하지 않는다.
- 기존 저장된 던전 및 캠페인 관리 화면·데이터는 변경하지 않았다. 이번 수정은 홈에서 바로 읽고 굴리는 준비 참조를 제공한다.

상세 대조: [dungeon-source-procedures.md](../dungeon-source-procedures.md).

## I. UI 영향과 반응형

기존 검색창·입력창·Related를 그대로 사용했다. 변경된 가시 제어는 조건부 참조 링크, 5개 원문 추가 표의 입력/조회/Roll, 던전 준비의 항목별 굴림·표 보기와 이유/경비 입력이다. 새 탐색 모드나 전역 toolbar는 없다. 던전의 긴 반복 설명은 짧은 설명으로 줄였다. 기존 영문/한글 폰트와 크기 변수를 재사용한다.

| 실제 viewport | 던전 내용 폭 | 필드 열 | 문서 가로 넘침 |
|---|---:|---:|---|
| 360 × 800 | 305px | 1 | 없음 |
| 768 × 1024 | 713px | 1 | 없음 |
| 1440 × 1000 | 1,049px | 2 | 없음 |
| 3440 × 1440 | 2,170px | 4 | 없음 |

스크린샷은 로컬 `outputs/functional-pass/dungeon-{360,768,1440,3440}.png`, `physical-child-360.png`에 저장했다. 360px에서 긴 던전 sheet 자체는 세로로 길며, 기존 header/navigation 높이는 이번 기능 작업에서 재설계하지 않았다.

## J. 무결성

- Canonical source fixture, table IDs, rows, ranges, weights, scenario exclusion 목록: 변경 없음.
- 28개 제외 시나리오 표와 결합 굴림은 계속 제외된다.
- Core-only Miseries: d66 36행과 고정 7:7 footer 분리 유지, PDF20 provenance 유지.
- 이름/필드/방 준비를 제외한 기존 roll engine은 재작성하지 않았다.
- SourceDisclosure, 기존 Pins/Recent/Workbench 저장 형식, migration/import schema: 변경 없음.
- Source/status/원문 추가표 범위와 한국어 metadata 보존, snapshot 왕복, 수동 값 유지·copy를 새 테스트로 검사했다.
- 실물 입력은 randomness를 추가하지 않는다. 부모 방은 정확히 두 면만 소비하며 추가 표는 별도 명시 동작 전까지 RNG를 소비하지 않는다.

## K. 검사 결과

- 변경 전 전체 자동 테스트: **763/763 통과**.
- 변경 후 전체 자동 테스트: **796/796 통과**, 실패·생략 0.
- 새 테스트: **33개**(검색 8, 굴림/원문 링크 13, 던전 12).
- 기존 테스트 수정: **4개 파일**. 추가 참조 하나의 count, 정정된 SD provenance 설명, 중첩 표를 제외한 원본 행 ID/순서 검사로 정정했다. 원문 보존 단언을 삭제하지 않았다.
- 실제 브라우저: 위 **13개 수동 기능 검사**, **4개 반응형 크기 검사** 통과.
- Lint: `npm run lint` 통과.
- Production build: `npm run build` 통과. 공개 빌드 privacy 검사 **74개 static files** 통과.
- migration/import: 전체 suite에 포함된 기존 import, persisted-pack repair, scenario removal, Miseries footer regression 통과. 사용자 브라우저의 개인 데이터 재가져오기는 실행하지 않았다.
- `git diff --check` 통과.

## L. 남은 기능 기회와 한계

- 조합형 fallback 한국어 제목은 여전히 불완전하다. 잘못된 자동 번역을 검색 이름으로 고착시키지 않았다.
- 일부 Related가 책만 연결하는 문제와 역방향 procedure 연결은 별도 원문 관계 감사가 필요하다.
- DNGNGEN 전용 pool/방문 이유/경비를 앱 데이터로 정식 통합하는 작업은 이번 범위 밖이다. 현재 던전은 명시된 Core 대안이다.
- 추가 표의 임시 결과는 현재 컴포넌트 안에서만 유지되며 부모 결과의 Copy에 합쳐지지 않는다. 자동 합성/저장은 하지 않는다.
- 기존 참조 결과는 같은 탭의 최근 20개 reading에 유지된다. 새로고침 뒤 결과 영구 저장을 새로 만들지 않았다. Workbench/Pins/Recent의 기존 persistence만 유지한다.
- 카드·비굴림 reference 등 이미 별도 구현된 문법을 이번 작업에서 새 수동 입력 문법으로 통합하지 않았다.
- 모바일에서 긴 원문과 12항목 던전 sheet는 스크롤이 필요하다. 디자인/탐색을 바꾸어 감추지 않았다.
