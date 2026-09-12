# MÖRK BORG Reference Desk — Identity Calibration

이번 변경은 정보 구조를 그대로 두고 **숫자열, 제목의 강약, 색인의 행 리듬, 출처 각주**를 조정한 작업이다. 앱 코드는 `reference-surface.css`, `ReferenceWorkbench.tsx`, `ReferenceTable.tsx` 세 파일에 한정했다. 새로운 기능·버튼·탐색 단계·폰트·색상은 추가하지 않았다.

**시각 보정과 검증을 마쳤다.** 변경 전 7개 캡처는 코드 편집 전에 남겼고, 같은 viewport·Reference·작업대 구성으로 After 7개를 비교했다. 자동 테스트 744개, lint와 최종 CSS의 production build는 통과했다. 추가 조사에서 발견한 재앙 7:7 본문 표시 불일치는 아래 K에 미해결로 구분했다.

[Before / After 비교](../outputs/identity-calibration/comparison.html) · [화면 측정 원본](../outputs/identity-calibration/measurements.json) · [실사용 기록](../outputs/identity-calibration/acceptance-journal.json) · [데이터 계약](../outputs/identity-calibration/integrity-contracts.md)

## A. 변경 전 generic하게 보였던 부분

| 위치 / 근거 화면 | 발견한 문제 | Reference 사용에 미친 영향 |
|---|---|---|
| Reaction 표, 360 / 1440 | 숫자와 내용 모두 같은 길이의 가로선에 묶여 일반 데이터 그리드처럼 보였다. | 주사위 숫자를 먼저 찾는 눈의 경로가 별도로 만들어지지 않았다. |
| Corpse d66, 360 | 범위 `11–16`과 단일 숫자가 왼쪽 기준으로 놓였다. | 숫자 끝과 결과 시작 사이 거리가 일정하지 않아 긴 표를 세로로 훑을 때 기준점이 약했다. |
| 선택 행, 1440 | 행 전체의 노랑 면과 왼쪽 세로선이 선택을 표현했다. | 실제로 필요한 정보는 맞은 숫자 범위인데, 결과 문단 전체가 웹 그리드의 선택 영역처럼 강조됐다. |
| Travel / Creature 제목, 768 / 1440 | 짧은 Oracle와 긴 설명형 제목이 모두 같은 condensed 900 제목 언어를 썼다. | 규칙을 읽는 페이지와 표를 찾는 페이지의 성격이 제목에서 구분되지 않았다. 긴 제목이 본문보다 과하게 주목받았다. |
| 검색 결과 / 색인, 1440 | 매 항목 밑에 가로선이 반복되고 설명이 공식보다 먼저 나왔다. | 제목 다음에 굴림 공식을 확인하려면 설명을 지나야 했다. 모든 행의 경계가 작은 목록 컨테이너처럼 보였다. |
| Related, 1440 Reaction | 길이가 다른 항목들이 아래쪽 정렬되고 매 행마다 선이 있었다. | 서로 연결된 참조보다 두 열짜리 버튼 목록처럼 보였고 제목의 시작 높이가 엇갈렸다. |
| Source, 모든 화면 | 작은 `MB-BB · 출처`가 다른 메타데이터 문구와 거의 같은 모양이었다. | 본문이 끝나고 출처가 시작된다는 편집적 신호가 약했다. 기능은 정상적이어서 표현만 조정할 대상이었다. |
| Workbench, 1440 / 3440 | 페이지 제목은 일반 UI 소제목처럼 보이고 각 페이지 끝에 전체 폭 구분선이 반복됐다. | 이미 카드 배경은 없었지만, 여러 페이지가 연속 패널처럼 읽히는 흔적이 남았다. |

이는 사용자의 반응을 측정한 연구 결과가 아니라 실제 화면을 읽으며 내린 디자인 판단이다. 현재 구조를 새로 고쳐야 할 정도의 기능적 문제로 확대하지 않았다.

## B. 의도적으로 유지한 부분

- **Search → Reference → 명시적인 Roll.** 제목을 열어서 규칙이나 표를 읽는 동작에 굴림을 붙이지 않았다.
- 종이 바탕의 한 문서, 작은 색인, 옆에 펼친 Workbench라는 공간 구조. 넓은 화면의 본문 최대 폭과 읽기 폭 제한도 유지했다.
- 한글·영문 병기와 본문 16px. 표 전체와 긴 d66/d100 원문을 숨기거나 요약하지 않았다.
- Pins는 자주 쓰는 참조, Recent는 최근 접근한 참조, Workbench는 지금 펼친 참조라는 역할. Context는 기존 필터다.
- Related의 **문서 아래 위치**. Source의 native disclosure와 원문·페이지·provenance 구분.
- 굴림 엔진, 수동 lookup, copy, 기존 주사위 도형 선택, preference schema, migration/import, ReferenceKind와 ID.
- 재앙은 코어 룰북 목록만 사용하는 기존 범위, 시나리오 전용 표 제거 상태. 일반 던전 표나 고정 생물 자료를 이번 작업에서 추가로 삭제하지 않았다.

구조는 다음과 같이 그대로다.

```text
Search / Browse / Pins / Recent / Context filter
                    ↓ 참조 열기
             Current Reference
           규칙 · 공식 · 전체 표
              ↓ 명시적 Roll
           결과 + 원본 행 표시

Current Reference → Related Reference
Current Reference ↔ Workbench의 펼친 페이지
```

## C. 변경 내용 — Before → After → Why

| Before | After | 이유 |
|---|---|---|
| 숫자열 왼쪽 정렬, 숫자 밑까지 이어지는 행선 | tabular 숫자를 오른쪽 정렬, 숫자 영역은 선 없이 두고 결과 쪽에만 행선 | 숫자 끝을 세로 기준으로 삼아 결과의 시작 위치까지 일정하게 연결하기 위해 |
| 선택 행 전체 노랑 + 세로 stripe | 숫자 범위의 낮은 노랑 밑줄과 숫자 옆 작은 `›` 형태의 잉크 표식 | 표시 면적을 줄이면서 원본 표의 맞은 범위를 정확히 찾게 하기 위해 |
| 색인의 선택 항목에 긴 세로선 | 같은 작은 방향 표식 | 현재 위치 표현을 한 문법으로 통일하기 위해 |
| 색인마다 가로선, 8px 상하 여백, 제목 650 | 가로선 제거, 7px 여백, 제목 600 | 긴 후보 목록을 경계보다 제목·간격으로 읽게 하기 위해 |
| 제목 → 설명 → 공식 / source | 제목 → 공식 / source·type → 필요한 한 줄 설명 | 굴릴 주사위와 자료 출처를 설명보다 먼저 훑게 하기 위해 |
| 모든 현재 제목이 42px condensed 900 | Oracle / Creature 38px, Rule / Procedure는 기존 본문 계열 30px 750, Book / Region 36px | 기존 종류 정보를 최소한의 제목 강약으로 표현하기 위해 |
| 출처가 보통의 작은 문구, 펼친 본문에 긴 윗선 | 28px 짧은 각주선 + 기존 disclosure; 펼친 본문의 중복 윗선 제거 | 실제 내용을 끝까지 읽은 뒤 출처를 책의 각주처럼 인식하게 하기 위해 |
| Related 행선과 아래쪽 정렬 | 행선 제거, 위쪽 정렬 | 제목부터 읽는 짧은 책갈피 묶음으로 만들기 위해 |
| Workbench 페이지 끝마다 긴 구분선, 일반 UI 제목 | 반복 선 제거, 기존 display 계열의 24px 제목 | 본문은 그대로 읽고 페이지 시작만 식별하게 하기 위해 |

새로운 시각적 모티프는 **두 개**다. ① 현재 숫자·위치를 가리키는 작은 `›` 형태의 잉크 표식, ② Source 앞의 짧은 각주선. 별도의 아이콘 세트나 종류별 문양은 만들지 않았다. 처음 적용한 가로 눈금은 실제 모바일 Corpse의 `61–66` 앞에서 음수 부호처럼 읽힐 여지가 발견돼 같은 위치의 작은 방향 표식으로 바꿨다. 새 모티프를 추가하지 않고 관찰된 혼동을 수정했다.

삭제·축소한 것은 Travel 구성 표의 중복 하단 border·padding, 검색/Related 행의 반복 border, Workbench 페이지의 반복 하단 border, 펼친 Source의 중복 상단 border, 선택 행 전체의 노랑 배경과 세로 stripe, 색인 선택의 긴 세로선, 제목/검색 결과의 일부 무게와 여백이다. 버튼이나 기능은 삭제하지 않았다.

DOM 변경은 검색 메타데이터의 기존 순서를 바꾸고 표 숫자에 비상호작용 `span` 하나를 추가한 것이다. DOM 감소를 성과로 주장하지 않는다. CSS도 선택 표식과 종류별 제목 규칙 때문에 순감소하지 않았다.

## D. Table identity

숫자열은 데스크톱에서 4.75rem, 모바일에서 4rem이다. 숫자는 오른쪽 정렬하고 결과와의 간격을 데스크톱 16px / 모바일 12px로 일정하게 뒀다. Workbench 숫자열은 4rem, 간격은 12px다. 범위 문자열과 원본 결과 내용은 변경하지 않았다.

본문은 기존 16px / 1.45, 번역은 14px / 1.45다. 숫자는 16px 700에서 15px 600으로 낮추되 고정폭 계열과 tabular numbers를 유지했다. 숫자열 아래의 선만 없애 행을 박스로 읽는 경향을 줄였다. 결과 텍스트의 행선은 남아 긴 내용을 추적할 수 있다.

| 검사 자료 | 공식 / 규모 | 관찰할 항목 | 결과 |
|---|---|---|---|
| Failed Morale | d6, 2개 범위 행 | 범위 scan, 실물 값과 원본 행 연결 | `6 → 4–6 surrenders`, 재굴림 `4 → 4–6` 일치. 두 행 유지 |
| Events by the Road. Roll Daily | d20, 16개 범위 행 | 한 자리·두 자리 숫자 정렬, 긴 문장 | `20 → 길가 시체 둘` 일치. 16행을 읽고 끝까지 스크롤; 조건부 문구가 다음 행동을 강제하지 않음 |
| Corpse Plundering | d66, 26개 범위 행 | `11–16`과 단일 숫자의 정렬, 긴 양언어 문장, 전체 원문 유지 | 모바일에서 `6,6 → 66` 수동 입력 후 마지막 `61–66` 행 일치 확인. 전체 26행 유지, 가로 overflow 0 |
| Action Oracle | d100, 100행 | 처음·중간·끝 scan, 마지막 실물 값 | `100 → Reach` 일치. 100행 유지; 1·99·100 숫자 셀 오른쪽 좌표 368px로 동일, 선택 padding 0 |

Reaction의 양언어 5개 행은 변경 전후 모두 **행당 61px, 표 전체 307px**다. 이 작업은 행을 더 작게 만들어 정보를 억지로 밀어 넣지 않았다. 변화는 숫자/결과의 경로와 선택 범위의 표현이다.

선택 행은 숫자 밑줄만 보더라도 찾을 수 있고, 색을 보지 못해도 작은 방향 표식이 위치를 가리킨다. 숫자 위치는 선택 전후 이동하지 않는다. 결과 문단을 표와 분리한 모달이나 새 카드로 만들지 않았다.

## E. Typography

새 폰트를 추가하지 않았다. 기존 Barlow Condensed, Pretendard 계열, 고정폭 수식 계열을 각자의 역할에 한정했다. 여섯 역할을 유지하되 숫자·번역·모바일의 보조 크기는 가독성을 위해 다르게 둔다.

| 역할 | 현재 설정 | 변경 의도 |
|---|---|---|
| 현재 제목 | Oracle / Creature 38px 900, 모바일 34px; Rule / Procedure는 UI 계열 30px 750, 모바일 28px; Book / Region 36px | 강한 제목을 유지하면서 긴 규칙/절차 제목이 포스터처럼 보이는 정도 완화 |
| 중요한 결과 | UI 계열 22px 650 / 1.35, 굴림 값은 고정폭 15px 600 | 제목 아래에서 실제로 나온 답을 먼저 읽음; 기존 설정 유지 |
| 문서 소제목 / Workbench 제목 | 소제목 18px 650; Workbench 24px 900 display | 본문 구분은 조용하게, 펼친 페이지의 시작은 현재 제목보다 작은 활자로 식별 |
| 본문 / 표 | 본문 16px 450 / 1.55, 표 16px 450 / 1.45; 한국어 번역 14px | 긴 표와 양언어 원문을 오래 읽는 조건 유지 |
| 공식 / 숫자열 | 공식 고정폭 16px 600; 숫자열 15px 600, Workbench 14px | 숫자와 범위의 정렬을 폰트의 분위기보다 우선 |
| 색인 / Source | 색인 제목 14px 600, Source 12px / 1.5, 최소 summary 높이 32px | 작은 표식과 계층으로 구분하되 출처 조작 영역을 줄이지 않음 |

Creature는 기존 첫 HP / Morale / Armor 문장을 650과 tabular numbers로 강조한다. 새로운 stat component나 자료 파싱은 추가하지 않았다. 한국어 번역 제목은 UI 계열 14px 500을 유지하며 영문 condensed 형태를 억지로 흉내 내지 않는다.

Book / Region에는 36px 제목만 적용했다. 종류별 테마·색·컨테이너는 없다. 이 두 종류의 차이를 크게 만들지 않은 것은 의도적인 절제다.

## F. Color

- **종이색**: 현재 문서·색인·Workbench가 놓인 공통 바탕. 페이지마다 새 배경을 만들지 않았다.
- **잉크색**: 본문, 주요 제목, 현재 위치 표식, 활성 hover/focus. 중요도는 크기·정렬·간격으로 구분한다.
- **제한된 노랑**: 현재 굴림이 맞은 숫자 범위의 밑줄. 기존 노랑을 좁은 영역에 쓴다. 독립 주사위 도구의 기존 선택색과 텍스트 선택색은 유지했다. 새 색상 hue는 없다.
- 기존 provenance 경고의 색과 의미는 보존했다. 예를 들어 Book의 `PARTIALLY VERIFIED`는 그대로 표시되며 장식색으로 재활용하지 않았다.

검정·노랑을 제거하더라도 숫자열 정렬, 결과 쪽에만 남은 행선, Source 각주선, 제목 크기, 문서/색인의 폭 차이는 남는다. 로고와 accent만으로 위계를 만든 구조는 아니다. 색 없이도 이 도구를 특정 브랜드라고 즉시 알아본다고 주장하지는 않는다.

## G. Workbench

1440px에서는 **440px 한 열**을 유지한다. 표와 규칙을 작은 요약 카드로 바꾸지 않고 연속된 페이지를 읽는다. 현재 문서 폭 637px, Workbench 440px라는 기존 관계도 그대로다. 반복 하단 border를 없애고 페이지 시작 제목에만 작은 활자 차이를 줬다. 24px 제목은 일반 Oracle 현재 Reference 38px보다 작으며 별도 배경·toolbar·탐색 요소는 없다.

3440px에서는 현재 문서 960px, Workbench 약 2039px를 유지한다. Reaction / Morale / Weather / Corpse 네 페이지를 옆으로 펼쳐 본다. 긴 본문 한 줄을 2000px로 늘리는 대신 독립된 문서 읽기 폭으로 나눈 기존 구조를 보존했다. 페이지별 하단 가로선이 사라져 큰 패널 grid의 인상을 줄인다. 실측 문서 폭은 네 페이지 모두 483px이며 현재 Reference와 Workbench 사이의 가로 overflow는 0이다.

제약은 남는다. 1440px에서 네 페이지 전체를 한 번에 읽을 수 없어 Workbench 안에서 세로 스크롤해야 한다. 3440px의 긴 Corpse 표 역시 해당 페이지 안에서 스크롤한다. 이번 작업은 새로운 tray 구조를 만들지 않았다.

## H. Before / After screenshots

비교 페이지는 원본 브라우저 캡처를 나란히 놓는다. 3440px에서는 일반 viewport 캡처 경로가 폭을 잘라내는 문제가 있어 **full-page 원본**을 사용한다. 비교를 위해 이미지를 편집하거나 원본 내용을 합성하지 않았다.

| Pair | 덜 generic해진 점 | 더 읽기 쉽거나 조용해진 점 | 단지 꾸미기 위한 변경 여부 |
|---|---|---|---|
| 360 Reaction | 표의 숫자 margin과 Source 각주 | 제목 무게·크기 완화, 결과 영역만 이어지는 행선 | 행 높이·본문은 유지. 장식적 공간이나 새 아이콘 없음 |
| 360 Corpse | 범위 숫자의 오른쪽 기준점 | 긴 문장 옆 숫자열이 분리됨; 원문을 숨기지 않음 | 숫자 정렬은 실물 주사위 scan에 직접 관련됨 |
| 768 Travel | Rule / Procedure용 기존 UI 활자 제목 | 긴 한영 제목이 본문과 연결됨 | 종류별 화면·색상 테마를 만들지 않음 |
| 1440 Reaction | 선으로 둘러싸이지 않은 색인과 Related, Source 각주 | 제목 → 공식/source → 설명으로 후보 비교 | 구분을 위해 필요 없는 반복 선을 제거함 |
| 1440 Creature | 제목 크기와 기존 stat line의 대비 | 긴 제목이 덜 압도하고 HP / Morale / Armor가 먼저 읽힘 | 추가 stat badge나 생물 카드 없음 |
| 1440 Workbench | 연속 패널 끝선 대신 페이지 시작 제목 | 작은 문서가 현재 문서와 같은 편집 문법을 사용 | 제목 활자 차이만으로 페이지 시작 식별 |
| 3440 Workbench | 테두리 패널 grid보다 병렬 문서의 인상 | 각자의 숫자열·각주·읽기 폭 유지 | 단순 확대·배경 장식 없이 기존 폭 활용 |

**필수 Before / After 7쌍 모두 캡처·비교했다.** 현재 Reference, 검색어, 작업대 네 페이지의 구성은 맞췄다. Recent 순서는 실제 탐색으로 바뀌었으며 비교를 위해 이력을 조작하지 않았다. 선택 결과는 별도 After 증거로 제공한다. 추가로 Book, Region, d6/d20/d100, 긴 표의 중간·끝, 모바일 작업대도 확인했다.

| 화면 | Current 시작 y (전 → 후) | Current 폭 (전 → 후) | Index / Workbench 폭 | 가로 overflow (전 → 후) |
|---|---:|---:|---:|---:|
| 360 Reaction | 199 → 199 | 313 → 313 | 접힌 색인 313 / 없음 | 0 → 0 |
| 360 Corpse | 211 → 211 | 313 → 313 | 접힌 색인 313 / 없음 | 0 → 0 |
| 768 Travel | 199 → 199 | 721 → 721 | 접힌 색인 721 / 없음 | 0 → 0 |
| 1440 Reaction | 98 → 98 | 960 → 960 | 236 / 없음 | 0 → 0 |
| 1440 Creature | 98 → 98 | 960 → 960 | 236 / 없음 | 0 → 0 |
| 1440 Workbench | 98 → 98 | 637 → 637 | 236 / 440 | 0 → 0 |
| 3440 Workbench | 102 → 102 | 960 → 960 | 280 / 2039; 펼친 문서 각각 483 | 0 → 0 |

픽셀 수는 CSS viewport를 기준으로 DOM bounding box를 측정한 값이다. 앱 내부 scrollbar 때문에 screenshot의 실제 이미지 폭과 viewport 설정 값은 다를 수 있다. 1440에서 폰트나 표의 크기를 줄여 current 폭을 늘렸다는 주장은 하지 않는다.

## I. Regression / 실제 사용

변경 전 데이터 계약은 다음과 같다. 전체 ID 목록·원본 hash를 변경 후와 비교한다.

| 항목 | Before | After |
|---|---:|---:|
| Reference | 1,000 | 1,000 |
| Oracle / Procedure / Rule | 536 / 68 / 285 | 536 / 68 / 285 |
| Creature / Region / Book Reference | 95 / 7 / 9 | 95 / 7 / 9 |
| Oracle registry table | 546 | 546 |
| Source procedure registry | 58 | 58 |
| Imported creature preset / raw source book | 89 / 6 | 89 / 6 |
| 제외된 시나리오 전용 table / procedure | 28 / 1 | 28 / 1, 제외 유지 |

Reference의 Creature / Book 개수와 raw import의 preset / book 개수는 서로 다른 단위다. 둘을 섞어 콘텐츠가 줄었다고 판단하지 않았다. 전체 Reference / Table ID 배열은 정확히 일치하고, 데이터·엔진·출처·저장 관련 **18개 파일 SHA-256**이 모두 같다. Oracle registry validation 오류는 0개이며, Related에 남은 제외 시나리오 ID도 0개다. [검증 원본](../outputs/identity-calibration/integrity-after.json)

| 기능 계약 | 최종 근거 |
|---|---|
| Search / Related / Pins / Recent / Workbench 제목은 읽기만 열기 | 실제 UI에서 각각 확인. Recent의 Action Oracle은 기존 수동 100 결과를 재굴림 없이 다시 표시 |
| 명시적 Roll / Reroll / 수동 lookup / 원본 행 표시 | Reaction `4,4 → 8`, Weather 디지털 굴림, d6/d20/d66/d100 수동 4종 일치. 선택 후 숫자 이동 0 |
| Source disclosure / provenance / copy | Source 펼치기·접기, RCL PDF134/인쇄134 표시, COPY 및 COPY WITH SOURCE 확인. 모바일 summary 37px·글자12px. 재앙 7:7 본문 불일치는 미해결 |
| Context filter / Workbench persistence | Dungeon 필터 119개로 바뀌어도 현재 Road 참조 유지. 4개 작업대 문서와 기존 Pins3개 새로고침 유지 |
| 원본 표 전체 / registry IDs / source mapping | ID 전체 일치, 18개 hash 일치, validation 오류 0 |
| migration/import / 시나리오 제외 | 전체 744개 테스트 성공, 기존 import/migration 및 시나리오 제외 계약 유지 |

**실제 반복 사용 20분 53초를 집계했다.** 22:01:32–22:24:25 KST의 22분 53초 구간에서 CSS 보정·도구 복구·기록 정리 여유 2분을 보수적으로 제외했다. 단순 대기용 sleep은 사용하지 않았다. 최초 예비 관찰은 제외했고, 이 구간에는 36개 시간순 기록이 있다. 기록 간 시간에는 화면 읽기와 관찰 판단이 포함되며 클릭 시간만을 뜻하지 않는다. [시간·수치 집계](../outputs/identity-calibration/browser-acceptance-summary.json)

요청한 11개 행동인 Reaction → Morale → Weather → Creature → Corpse → Travel → d100 → Related → Pin → Recent → Workbench 복귀를 모두 포함했다. 중간에 표를 직접 굴리지 않고 읽었고, 수동 값과 디지털 결과를 대조했으며, d66/d100의 중간과 끝을 스크롤했다. 3440의 Corpse 작업대만 629px 스크롤했을 때 나머지 세 작업대 문서는 scrollTop 0을 유지했다. 모바일 작업대 제목으로 복귀하면 현재 문서에는 전체 표가 표시됐다.

사용 중 발견한 마찰은 두 가지 시각 보정으로 반영했다. `61–66` 앞의 가로 표식은 음수처럼 보일 수 있어 chevron으로 바꿨고, Travel 구성 표에 남아 있던 중복 하단 테두리·padding을 제거했다. Travel 현재 문서 높이는 635 → 603px로 줄었지만 본문·공식·4개 관련 표는 그대로다. Reaction 표는 307px, Corpse 표는 2604px로 전후 같다.

필수 progression **0**, session start **0**, save **0**, mode transition **0**. 테스트용 Pin은 해제했고, 작업대 네 페이지도 접었다. 기존 Pins3개와 원래 빈 클립보드를 보존했으며 Scratch 기록은 추가하지 않았다. 테스트 viewport를 해제하고 Reaction의 수동8 결과가 열린 화면으로 마쳤다. 마지막 앱 콘솔 error는 **0건**이다.

이 검증은 한 번의 20분대 사용 관찰이다. 사용자 여러 명의 탐색 속도나 2시간의 눈 피로를 측정한 결과로 확대하지 않는다.

## J. Tests

| 검사 | 실행 결과 |
|---|---|
| 변경 전 핵심 계약 6개 파일 | 41 / 41 PASS, 실패 0, skip 0 |
| 변경 후 전체 automated tests | 744 / 744 PASS, 실패 0, skip 0, 실행 9.954초 |
| 새로 추가 / 수정한 테스트 | 0 / 0 — CSS 값을 그대로 복제하는 테스트는 추가하지 않음 |
| Browser acceptance | 필수 11개 행동 모두 수행, 실물 lookup 4/4 일치, 시간순 기록 36개. 추가 자료 표시 불일치 1건은 미해결 |
| Responsive acceptance | 4 viewport / 필수 7상태의 Before·After 총14캡처, 모든 사례 가로 overflow 0 |
| Lint | PASS, exit 0, 진단 0 |
| Production build / privacy check | PASS, 두 TypeScript 프로젝트 + Vite + 61개 static file privacy 검사; 최종 chevron·테두리 CSS 조정 뒤 lint/build 재실행 완료 |
| Migration / import regression | 기존 관련 테스트 포함 전체 744개 성공; 별도 신규 migration 없음 |
| Registry / raw source hash | 1,000 / 546 유지, 전체 ID 일치, 18개 hash 일치 |

이번 수치는 직전 작업의 기록을 재사용한 것이 아니라 [이번 테스트 로그](../outputs/identity-calibration/tests.txt)와 [집계](../outputs/identity-calibration/test-summary.json)에 근거한다. 테스트 런타임의 localStorage ExperimentalWarning 9건, 빌드의 `module.register()` deprecated 경고 1건은 남아 있다. 실패를 일으키지는 않았으며 로그에 보존했다.

## K. 남은 generic한 부분과 타협

**자료 표시 불일치 1건:** 현재 브라우저에서 코어 재앙의 d66 36행과 7:7 안내는 보이지만, 고정 7:7의 본문 행은 나타나지 않았다. 저장소 fixture와 import → store → registry → SSR 경로에서는 해당 본문과 PDF20 출처가 정상 출력된다. 조건 코드는 이번 baseline과 같고 SourceDisclosure도 byte-identical이다. 따라서 원래 결함인지, 현재 로드 자료의 차이인지 원인은 확정하지 않았다. 이 부분을 브라우저 PASS로 처리하지 않았고 데이터를 덮어쓰거나 원문을 추정해 보완하지 않았다. [조사 기록](../outputs/identity-calibration/misery-footer-investigation.json)


- Search textbox, select, Roll 버튼과 Source disclosure는 여전히 일반 웹 제어다. 익숙한 입력 방식과 키보드 조작을 보존하는 편이 이 작업의 목적에 맞는다. 외형을 더 특이하게 만들기 위한 새 제어는 추가하지 않았다.
- Related는 긴 d66/d100 원문 끝에 있다. 이번 범위에서 위치를 유지했으므로 긴 표를 읽다가 Related로 가려면 스크롤이 필요하다.
- 1440px Workbench는 네 페이지를 펼쳐도 한 열이다. 긴 표들이 이어질 때 이동거리가 생기며, 현재 문서와 다른 스크롤 영역이라는 한계도 남는다.
- 한영 병기 때문에 일부 표의 행 높이는 길다. 번역이나 원문을 숨겨 밀도를 높이는 방식은 쓰지 않았다.
- 긴 원본 제목과 source 명칭은 그대로다. 제목 크기와 줄바꿈을 다듬었지만 콘텐츠 자체를 더 짧은 이름으로 재작성하지 않았다.
- Source는 읽기 가능한 12px와 32px summary 영역을 유지했지만 본문보다 작다. 원문의 source/page 불일치나 미확인 출처를 디자인 작업 중 추측해 채우지 않았다.
- 단어 위주의 Action d100도 한 열의 원본 표다. 넓은 화면에서 짧은 단어 오른쪽의 여백과 긴 세로 스크롤은 남는다. 새 다단 표 구조는 만들지 않았다.
- 한글 검색은 기존 등록 어휘 범위다. `시체`는 Corpse를 첫 결과로 찾았지만 영어 검색의 모든 동의어나 번역을 동일하게 확장한 것은 아니다.
- Book / Region에는 제한적인 제목 조정만 있다. 독립된 편집 테마를 만들지 않아 종류의 차이가 크게 눈에 띄지는 않는다.
- Barlow 900의 개성은 여전히 강하다. 현재 제목과 Workbench 제목에 한정했으며 긴 본문과 표까지 확대하지 않았다.

정보를 기억하게 만드는 요소는 오른쪽으로 정렬된 주사위 범위, 결과 쪽에서만 이어지는 행선, 맞은 범위에 돌아오는 표식, 짧은 source 각주, 현재 페이지 옆에 펼친 문서다. 브랜드 없이도 MÖRK BORG라고 단정할 수 있다는 주장은 하지 않는다. 목표는 장식보다 이 읽기 순서가 남는 것이다.
