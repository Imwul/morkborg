# Convenience Layer — Default Simplicity & Progressive Discovery

2026-09-09. Baseline: `544d7ff7eb998bb06e52398ad7527e1c75970197`.

기본 화면에서 기능을 늘리지 않고 PLAY의 노출 순서를 정리했다. 검색과 현재 결과가 중심이고, 편의 기능은 사용자가 열거나 추가한 경우에만 드러난다. 새 원문·규칙·생성기·참조·캠페인 도메인은 추가하지 않았다.

## 기본 화면과 발견 순서

| 영역 | 변경 전 | 변경 후 |
|---|---|---|
| Desk | Search, Pins/Recent, Quick Tools 옆 비활성 PACK, PLAY | Search/Pins/Recent 유지. 비활성 PACK 제거. PLAY 옆 작은 `임시 도구 모음` 힌트만 첫 열기 전 표시. |
| Last | 저장 요청이 있으면 표시 | 현재 참조/Recipe가 유효할 때만 표시. 첫 굴림 전에는 버튼 없음. 삭제된 요청의 R 입력은 안내로 안전하게 복귀. |
| PLAY | 네 개의 동급 탭, 중복 도구 탐색, 검색 입력란과 비우기 버튼 상시 노출 | 560px 이내의 좁은 도구 목록. Tray → Last(있을 때) → 실물 입력 → Scratch → Recipes. 관리·도움말은 닫힌 disclosure. |
| 빈 Tray | 검색 입력란과 비우기 버튼 | `TRAY · 0`, 접힌 `+ 참조 추가`. 현재 참조가 있으면 작은 추가 동작. 빈 슬롯 없음. |
| 채워진 Tray | 직접 실행 strip | 유지. 사용자가 추가한 도구만 보이며 Desk와 결과창에서 바로 실행. PLAY 안에서는 짧은 이름 목록. |
| Scratch | 열면 항상 다섯 줄 textarea | 빈 메모는 PLAY에서 접힘. 의도적으로 열면 작성. 저장된 메모는 최대 세 줄 미리보기, EDIT 한 번으로 전체 수정. 자동 저장/전체 복사 그대로. |
| Recipes | 실행 목록과 관리 동작 혼재, 잠금 버튼 항상 표시 | 기존 목록에서는 RUN. 생성 입력란 없음. 빈 상태는 `아직 없음`과 `+ 만들기`. 기존 항목의 편집·삭제·추가는 Manage 안쪽. 결과가 있으면 목록은 접힘. |
| Physical Roll | `ENTER ROLL` 한 줄 disclosure | 결과의 `실물 주사위 입력 ›`으로 조용히 표시. PLAY에서는 현재 지원 참조를 바로 입력하거나 기존 표를 검색하여 선택. 같은 resolver·같은 단일 Inspector 사용. |
| HOLD | 독립 복합 Oracle는 disclosure; Recipe는 잠금 항상 표시 | 복합 Oracle/여러 Recipe 결과에서 HOLD를 연 뒤에만 잠금 표시. 단일 결과 및 부분 재굴림이 불가능한 종속 절차에는 HOLD 없음. |
| Pack | 비활성 PACK도 Desk 노출 | 활성 이름과 ×만 노출. 그 외에는 PLAY → 관리·도움말 → Pack. 내장 칩은 이 관리 화면에서만 보임. |

PLAY의 `참조 추가`와 `관리·도움말`은 같은 disclosure 그룹이라 동시에 펼쳐지지 않는다. 관리 내부의 정리/단축키도 서로 배타적이다. Scratch/Recipes/Physical/Pack은 선택한 한 화면만 열며, `‹ PLAY`로 복귀한다. 튜토리얼·캐러셀·자동 채우기는 없다.

## 중복 조작과 결과 위계

- PLAY 안의 네 탭 및 반복 Search/Recent/Pin/PLAY/Last 행을 제거했다. 검색과 기존 결과로 복귀하는 동작은 유지한다.
- Reference Inspector에서는 기존 직접 Search/Pin/Recent/Last 경로를 유지한다. PLAY와 result를 동시에 두 overlay로 띄우지 않는다.
- 일반 결과의 REROLL / COPY가 우선이다. SOURCE와 MORE는 닫혀 있다. `ADD TO PLAY · PLAY에 추가`, `SEND TO SCRATCH · 스크랩에 추가`는 기존 overflow에 있다.
- Recipe 실행 명칭을 RUN으로 통일했다. 개별 재굴림은 바로 가능하고, 잠금만 HOLD 뒤에 있다. 직접 수정한 결과는 기존대로 자동 고정하고 SOURCE는 `Edited manually`를 표시한다.
- CLEAR는 PLAY → 관리·도움말 → 임시 도구 정리에 모았다. Recipes/Packs를 같이 지우지 않는다.
- 단축키는 관리 내부 도움말만 표시한다. ⌘/Ctrl K, R 동작 및 입력 중 R 억제를 유지했다.

## 다섯 Pack의 판단

기존 canonical context/source ID 투영만 읽어 확인했다. Pack 내용과 검색 알고리즘은 변경하지 않았다.

- **Core Play:** 일반 검색과 중복되는 넓은 묶음. 유지하되 기본 강조 없음.
- **Dungeon / Travel:** 기존 Room/Travel context를 Desk로 가져오는 용도. 해당 장소 화면과 중복되므로 선택한 경우에만 Quick Tools에 적용.
- **City:** Crawl/Directions/Pray/Stash 부모 절차를 우선하는 기존 구성 유지. 실제 City 활성 상태에서 Broken 검색이 계속 전체 참조에 도달함을 확인.
- **RECLVSE:** 해당 규칙 체계를 선택한 플레이에 유용한 기존 묶음. 다른 규칙을 숨기는 필터가 아님.

추가 Pack은 없다. 사용자 Pack 저장·수정·선택·해제·재접속을 유지했다.

## 전후 시각 증거

[편집 전 관찰](VISUAL-HIERARCHY-AUDIT.md). 동일한 여덟 상태를 360 / 1440 / 3440에서 각각 촬영했다. 전체 48장. `outputs/convenience-simplicity/{before,after}-상태-너비.png`에 보관한다. private 생성 결과가 담긴 사진은 공개 Git에 포함하지 않는다.

아래는 **1440×1000** 측정값. 조작 수는 활성 dialog, 없으면 main 내부에서 실제 보이는 button/input/summary 등을 센다. 닫힌 details, inert 배경, 화면 밖 요소는 제외한다. main 밖 고정 dock은 별도다. 결과는 무작위이므로 길이가 달라질 수 있으며, 수치만으로 개선을 주장하지 않는다.

| 상태 | 조작 수 전 → 후 | Dialog 높이(px) 전 → 후 | 판단 |
|---|---:|---:|---|
| Fresh Desk | 19 → 18 | — | 비활성 Pack 제거. 검색이 계속 주목점. |
| 첫 Reaction 결과 | 14 → 14 | 498 → 498 | 결과/재굴림/복사 경로 그대로. |
| Tray + 검색 결과 | 32 → 31 | — | 직접 실행을 숨기지 않음. |
| PLAY(Tray 1, Last 있음) | 17 → 9 | 528 → 478 | 탭/관리 입력란/중복 탐색을 제거. |
| Scratch 읽기 | 14 → 5 | 504 → 242 | 메모가 도구 설정 화면으로 보이지 않음. |
| Recipe 결과 3개 | 25 → 15 | 900 → 838 | 결과 위의 탭과 상시 잠금 제거. |
| City Pack 활성 | 20 → 21 | — | × 해제 한 번을 위해 의도적으로 조작 하나 유지. |
| 실물 d66 입력 | 18 → 18 | 683 → 683 | 입력 정확성과 출처 경로 유지. |

Fresh main 문서 높이는 1000 → 1000px. 짧은 레퍼런스 화면 자체를 다시 디자인하지 않았다. 초기 고정 dock은 Search/Pin/Recent/PLAY **4개 → 4개**, 첫 실행 후 Last가 하나 추가된다. 힌트는 버튼이 아니다. 기존 사용자가 추가한 Tray/Pins는 별도의 명시적 선택으로 계속 노출한다.

이미지를 직접 확인했을 때, 360에서는 PLAY가 카드 여섯 장 대신 짧은 목록으로 읽혔다. Scratch/Recipe 화면에서는 textarea/탭보다 메모와 결과가 먼저 보인다. 3440에서도 도구 화면은 560px로 제한되어 가로로 퍼지지 않는다. 원래 Reference Inspector의 폭, 검색의 검정/노랑 대비, 결과의 display 서체는 바꾸지 않았다.

## 클릭 수와 브라우저 검증

클릭 수는 **텍스트를 입력한 뒤 실행/선택 버튼을 누르는 횟수**로 기록한다. 글자 입력은 클릭으로 세지 않는다. 닫기·돌아가기 등 전체 시나리오에 쓰인 클릭은 전체 합계에 포함한다.

| 동작의 시작 지점 | 전 → 후 | 비고 |
|---|---:|---|
| Desk 검색 결과 → ROLL | 1 → 1 | 새 사용자/기존 사용자 모두 확인 |
| 현재 결과 → COPY | 1 → 1 | 실제 clipboard 문자열 확인 |
| 채워진 Tray → ROLL | 1 → 1 | 결과창 안의 다른 Tray 항목 전환도 1회 |
| 유효한 Last → 실행 | 1 → 1 | 기억한 Encounter Level 지역까지 복원 |
| Recipe 목록 → RUN | 1 → 1 | Desk부터 PLAY → Recipes → RUN은 3회 유지 |
| 지원 표 → 실물 입력 펼치기 | 1 → 1 | PLAY의 현재 참조에서도 1회, 결과 확인 별도 1회 |
| 결과 → ADD TO PLAY | 2 → 2 | MORE → 추가 |
| 복합 Oracle → HOLD 제어 | 1 → 1 | 지원하는 독립 결과만 |
| Recipe 잠금 조작 표시 | 0 → 1 | 의도적 새 HOLD 진입; 연 뒤에는 기존 조작과 동일 |
| Desk → 비활성 Pack 관리 | 1 → 3 | PLAY → 관리·도움말 → Pack으로 의도적으로 후순위화 |
| 저장된 Scratch → 수정 | 바로 입력 → EDIT 1회 | 읽기 상태를 조용하게 만드는 의도적 선택 |

`acceptance.mjs`: 360/1440 각 **54회 클릭**, 각 **17개 기록된 체크포인트**. Fresh store에서 Reaction/Copy/Last/Tray, PLAY의 실물 입력, Scratch, 첫 Recipe 생성·RUN·HOLD·수동 수정, Pack 활성, 외부 참조 검색, reload와 기존 사용자 직접 실행을 수행했다. 튜토리얼 없이 진행했고 의도하지 않은 context loss나 JS 오류가 없었다.

`regression.mjs` / `extended.mjs`: 각각 6개 확인 묶음. 결과창 내 Tray 전환, d100, 카드 무늬 입력, 불가능/중복/이미 사용한 카드 거부, 조건부 여섯 번째 카드, USER_ROLL/Source, 재접속 후 남은 덱, Last의 매개변수 복원, 사용자 Recipe/Pack 관리, 삭제된 Last의 안전한 안내, 임시 도구 비우기를 재검증했다.

`discovery-checks.mjs`: 13개 확인 묶음. 배타적 disclosure, 저장된 Scratch 읽기/수정, 긴 메모의 세 줄 preview와 전체 30줄 보존, Recipe 이름 수정·재접속, 21번째 Recipe 거부와 기존 20개 보존 등을 확인했다.

## 저장·접근성·회귀 경계

- `morkborg-convenience:v1`에 boolean `playOpened`만 추가했다. 없는 필드는 false로 읽는다. 첫 PLAY 열기 후 true. 기존 Recipe/Pack/활성 Pack ID는 보존한다. 같은 v1의 보수적인 additive 확장이다.
- Tray/Scratch/Last의 기존 sessionStorage 수명, Recipe/Pack의 localStorage 수명은 그대로다. Campaign JSON/export/schema에는 아무 필드도 추가하지 않았다.
- 브라우저 검증에서 편의 동작 전후 및 reload 후 Campaign 저장 문자열이 **byte-identical**이었다. 사용자 실제 캠페인/프로필을 사용하지 않았다.
- source data, canonical IDs, source routing, probabilities, search ranking, relation data, dice/card resolver, lock dependency logic, Recipe limits는 변경하지 않았다. 기존 source integrity 테스트는 unresolved 0 상태를 유지한다.
- 360/768/1440/3440 실물 카드 입력을 재검증했고, 요청한 360/1440/3440 여덟 상태는 가로 overflow가 없었다.
- Scratch를 네 폭과 OS light/dark 선호 모두에서 확인했다. 앱은 기존의 고정 paper/ink 테마를 유지하며 새 dark theme를 만들지 않았다. 기본 글자/배경 명암비는 18.1:1. muted 정보는 대비를 없애는 대신 작은 서체/배치로 구분했다.
- semantic button/summary, 기존 focus 표시, reduced motion을 유지했다. 새 도구 버튼은 최소 44px 크기. 숨긴 UI는 hover 전용 기능이 아니다.
- CSS는 `convenience.css`의 기존 소유 영역만 수정했다. 폐기된 tabs/last-layout 규칙과 중복 tools 제목 규칙을 정리했다. 전역 CSS override 층을 추가하지 않았다.

## 테스트와 남은 마찰

기존 686개 테스트 전부 보존. first-PLAY preference의 이전 버전 읽기·잘못된 값 처리와 Campaign/임시 저장소 격리 테스트 2개 추가: **688/688 통과**. lint, TypeScript/build, 공개 빌드 privacy 검사(74 static files), diff/format 검사를 통과했다. 상세 실행 결과는 ignored `outputs/convenience-simplicity/`에 있다.

남은 마찰은 명시적 선택이다:

- Pack 관리·임시 도구 정리·Recipe 편집에는 한 단계 더 들어간다. 기본 Search/Roll/Copy의 비용은 늘지 않았다.
- PLAY 안에서는 중복 Pin/Recent 버튼을 숨겼다. 이 화면에서 Pin/Recent로 옮기려면 검색/복귀 한 단계가 필요하다. Desk/일반 결과에서는 기존 직접 경로를 유지한다.
- 긴 Recipe는 여전히 스크롤된다. 결과를 잘라 숨기거나 작은 글자로 줄이지 않았다.
- 사용자가 12개 Tray 도구나 많은 Pins를 넣으면 strip은 길어질 수 있다. 사용자의 명시적 선택을 자동으로 지우지 않는다.
- 실물 Last는 입력창을 열며 새 값을 받는다. 앱이 물리 주사위를 대신 다시 굴리지 않는다.
- Reference의 기존 Quick Tools/지역 목록은 이번 convenience 노출 조정 범위를 넘어 재설계하지 않았다.

커밋의 정확한 SHA와 실제 배포 상태는 전달 메시지에 별도로 기록한다. 로컬 구현/검증 완료와 공개 production 배포를 혼동하지 않는다.

새 사용자는 PLAY를 열지 않고 Search → Roll → Copy를 계속 사용할 수 있다. 기존 사용자는 직접 Tray/Last 실행을 유지하면서 필요한 도구만 열 수 있다.
