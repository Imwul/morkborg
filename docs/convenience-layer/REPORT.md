# Reference Desk — Convenience Layer

2026-09-09. Baseline: `b9815113324322d0d6a59cf9e2166fee4c1900e3`.

기존 Reference Desk 위에 작은 Play 도구 모음을 추가했다. 새 원문·규칙·표·캠페인 도메인은 추가하지 않았다. 별도 저장소를 사용하며 생성 확률, 원문 데이터, 캠페인 스키마와 내보내기를 변경하지 않았다.

## 1. 사용 동작

| 기능 | 동작 | 기본 화면의 무게 |
|---|---|---|
| Play Tray | 사용자가 참조를 추가. 표는 즉시 굴림, 규칙은 열기, 선택이 필요한 절차는 입력부터 열기. 최대 12개. 제거·비우기 제공. | 참조 이름만 표시하는 한 줄. 긴 목록은 가로 스크롤. 결과창 안에서도 같은 Tray로 바로 전환. |
| Physical Roll Input | 기존 ROLL과 별도로 ENTER ROLL을 열어 실물 주사위/카드를 입력. 원래 resolver로 결과·출처를 조회. | 닫힌 한 줄 disclosure. |
| Recipes | 사용자가 이름과 기존 참조의 순서를 지정. 최대 12단계, 20개 조합. RUN ALL은 각 결과를 독립적으로 실행. | Play 도구 안에 위치. 결과가 있으면 선택·관리 목록은 접힘. |
| Hold | Action/Theme 등 독립 결과를 고정하고 나머지 또는 한 항목만 재굴림. Recipe는 단계 단위 고정. | 복합 Oracle에서는 HOLD 안에 작은 버튼. Recipe 결과에는 작은 잠금 버튼. |
| Scratch | 일반 텍스트 하나. 자동 저장, 결과 추가, 직접 입력, COPY ALL, 비우기. 12,000자. | 별도 상시 패널 없음. PLAY → Scratch로 열기. |
| Packs | 기존 참조를 사용하는 내장 5개와 사용자 모음. Quick Tools만 집중시킴. | Desk의 작은 PACK 선택. 별도 사이드바 없음. |
| Last Roll | 참조/Recipe ID와 필요한 입력값을 기억. 다른 화면에서도 LAST 또는 R로 실행. | 마지막 실행이 있을 때만 짧은 LAST 버튼. |

Pins는 기존 장기 즐겨찾기로 그대로 남는다. Tray는 자동으로 채워지지 않는다. 문맥 도구를 자동 추가하는 동작이나 드래그 정렬은 도입하지 않았다.

## 2. 저장 경계와 분류

| 저장소 | 키 / 버전 | 내용 | 보존 범위 |
|---|---|---|---|
| localStorage | `morkborg-convenience:v1` / 1 | 사용자 Recipes, 사용자 Packs, 활성 Pack ID | 같은 브라우저·사이트에서 재접속 후 유지 |
| sessionStorage | `morkborg-play-session:v1` / 1 | Tray, Scratch, Last Roll 요청 | 현재 탭의 탐색과 새로고침까지 유지 |
| 기존 개인 설정 | `morkborg-reference-desk:v1` | Pins / Recent | 기존 동작 유지 |
| 메모리 | 새 영구 키 없음 | Hold 상태, Recipe 결과·직접 수정, 펼친 메뉴 | 탐색 중 유지; 새로고침하면 초기화 |

새 저장소이므로 캠페인/기존 Pins 데이터 이관이 필요 없다. 버전·형식을 검사하고 손상된 개인 설정 항목은 개별적으로 격리한다. 한도에 도달하면 기존 Recipe/Pack은 보존하고 새 항목 저장을 막은 뒤 사용자에게 정리를 요청한다. 임시 상태 비우기는 Recipes/Packs/Pins를 건드리지 않는다.

- Recipes/Packs와 그 순서: `APP_POLICY`, 사용자가 만든 편의 조합. 공식 절차라고 표시하지 않는다.
- 실물 입력: `USER_ROLL`; 앱 실행: `APP_ROLL`; 두 방식의 독립 결과를 함께 유지하면 `MIXED`.
- Hold: 일시적 상호작용 상태.
- Scratch/Tray: `USER_TEMPORARY`에 해당하는 별도 상태.
- Recipe의 직접 수정은 `manualText`로 원래 `reading`과 분리하고 자동 고정한다. SOURCE는 원래 출처임과 “Edited manually”를 명시한다.

캠페인 JSON에 개인 설정이나 전체 private source database를 넣지 않는다. 새로운 개인 설정 내보내기 기능도 만들지 않았다. 브라우저 저장을 사용할 수 없으면 저장 실패를 알린다.

## 3. 실물 입력과 출처

지원 형식:

- 단일 `d2 / d4 / d6 / d8 / d10 / d12 / d20 / d100` 및 현재 resolver가 지원하는 `d3`.
- `d66`: `35` 또는 `3,5`. `78`, `10`, `00` 등 불가능한 조합은 거부.
- 기존 canonical 표의 `2dN`, `3dN`: 각 주사위를 `3,4`처럼 입력. 합계만 입력하여 개별 주사위 정보를 잃지 않도록 했다.
- 기존 tuple 표 `d4 × d6`, `d6 × d8`, `d4 × d8`: 각 주사위 값을 별도로 검증.
- Depths 카드: `Q♠`, `10♥` 등 기존 rank/suit 모델. 무늬 입력 버튼 제공. 중복·불가능한 카드·이미 사용한 카드를 거부. 3·4번이 모두 ♠일 때 기존 절차가 요구하는 여섯 번째 카드를 받는다.

주사위 입력은 기존 `rollOracle`에 검증된 주사위 값을 공급한다. 카드 입력은 기존 `drawRareMonster`와 덱을 재사용한다. 원문 구간, entry ID, source refs, 카드 순서, 추가 카드 조건을 바꾸지 않는다. 출처를 열면 MANUAL ROLL / APP ROLL 및 실제 굴림을 구별할 수 있다.

실물 모드에서 LAST는 앱 주사위를 대신 굴리지 않는다. 기억한 입력을 보여주고 새 실물 값을 받는다. 카드 덱의 남은 카드도 재접속 후 복원한다.

## 4. 조합과 고정 안전성

내장 Recipe는 **0개**다. 새 원문 절차처럼 보일 수 있는 임의 조합을 미리 넣지 않았다. 사용자 Recipe는 `{id, name, referenceIds, createdAt}`의 작은 순서 목록이다. 같은 표를 두 단계로 넣으면 각각 독립된 결과이며, 합쳐서 서술하지 않는다.

| 대상 | 고정/재굴림 경계 |
|---|---|
| Action + Theme | 두 canonical 결과를 독립적으로 고정/재굴림 |
| 검증된 기존 복합 Oracle | library/procedure가 묶는 기존 독립 표를 재사용 |
| Reference NPC | 이름·직업·외모·행동·성격·원하는 것·반응의 기존 필드 재굴림 함수 재사용 |
| Recipe | 각 단계가 독립 호출. 단계 전체를 고정. 직접 수정한 단계는 다른 재굴림으로 바뀌지 않음 |
| FERETORY A/B/C와 파생 능력치 | 종속된 결과. 부분 고정을 허용하지 않음 |
| Depths 희귀 몬스터 카드 | 부모/자식으로 연결된 결과. 전체 절차를 다시 실행하며 개별 잠금 불허 |
| 알 수 없는 복합 절차 | 독립이라고 추측하지 않고 전체 단위로 취급 |

고정된 값을 제외한 재굴림은 원문 entry/roll/source를 함께 교체한다. 실물 값을 모두 앱 굴림으로 바꿨다면 오래된 USER_ROLL 정책 표시도 제거한다. 고정 정책 설명이 재굴림마다 누적되지 않는다. 수동 수정한 NPC 필드는 다른 필드 재굴림으로 덮어쓰지 않는다. 저장된 Dungeon/Room을 새로 생성하거나 재해석하지 않았다.

의미 있는 선택이 먼저 필요한 City/Stock/Encounter Level은 Recipe의 자동 실행 후보에서 제외한다. 직접 열어 기존 입력을 정한 뒤 실행할 수 있으며, 입력을 가진 마지막 실행은 LAST가 다시 사용할 수 있다.

## 5. 모음과 마지막 실행

내장 Pack은 기존 source/context/parent 관계의 projection이다:

1. Core Play · 기본 규칙
2. Dungeon · 던전
3. Travel · 여행
4. City · 도시
5. RECLVSE

City는 하위 실패표보다 기존 City Crawl / Directions / Pray / Stash 상위 절차를 먼저 보여준다. Dungeon/Travel도 기존 문맥 도구 순서를 활용한다. 이 순서는 앱 편의 정책이다. 사용자 Pack은 이름과 canonical 참조 ID 목록만 저장하며 최대 60개 참조를 담는다. 전역 검색의 범위·순위·별칭은 변경하지 않는다. City Pack을 활성화해도 Broken을 바로 찾는다.

LAST는 현재 참조 ID, region, stock kind/DR, city choices, Encounter Level region, 필요한 덱과 실물 입력만 저장한다. registry, rules pack, 캠페인 객체를 저장하지 않는다. 복원된 입력은 실제 실행뿐 아니라 화면의 선택값에도 반영한다. 삭제된 Recipe나 설치된 자료에서 사라진 참조는 명시적인 안내로 돌아오며 다른 표를 대신 굴리지 않는다. City처럼 안전하게 재실행할 입력을 확보할 수 없는 흐름은 절차를 다시 연다.

단축키는 기존 ⌘/Ctrl+K와 **R**만 사용한다. R은 input, textarea, select, contenteditable, textbox 및 modifier/repeat 상태에서 작동하지 않는다. Shift+R이나 별도의 이전 결과 시스템은 추가하지 않았다. 기존 Recent의 결과 복원은 유지한다.

## 6. 실제 브라우저 검증

격리된 Chrome 프로필과 기존 QA 저장본을 사용했다. 사용자 프로필이나 실제 캠페인은 수정하지 않았다.

| 실제 흐름 | 명시적 클릭 / 키 명령 |
|---|---:|
| Tray → Reaction 실행 | 1 |
| Tray → Action + Theme 실행 | 1 |
| 결과창 안의 Tray → 다른 참조 실행 | 1, 닫기 불필요 |
| HOLD를 이미 연 상태에서 Theme만 재굴림 | 1 |
| 활성 Recipe RUN ALL | 1 |
| Recipe 한 결과 고정 + 나머지 재굴림 | 2 |
| 결과 화면 → 실물 입력 → 확인 | 2 + 값 입력 |
| 다른 화면 → LAST | 1 클릭 또는 R |
| 실물 LAST → 입력창 | 1, 이후 새 값을 입력하고 확인 |
| 결과 추가 메뉴 → Scratch에 추가 | 2 |
| Desk의 PACK → 모음 선택 | 2 |

`browser-acceptance.mjs`는 요청된 25단계 흐름을 실행한다. **60개 명시적 클릭/키 명령**으로 검색·초기 설정·탐색을 포함했고, 단계별 수는 `outputs/convenience-layer/browser-acceptance.json`에 기록했다. 텍스트 입력은 클릭 수에서 제외하고 R은 한 명령으로 센다.

추가 검증:

- 정확한 Reaction + Action Oracle + Theme Oracle 3단계 Recipe를 생성·실행.
- 고정/직접 수정 보존 및 수정된 SOURCE 고지.
- Scratch 추가·직접 입력·실제 클립보드 복사·비우기.
- 사용자 Pack 생성·활성화·재접속, 모음 밖 Broken 검색.
- 실물 d20, d66 오류/정상 값, d100의 100, 카드 중복/잘못된 rank/조건부 여섯 번째 입력.
- 카드 Last의 재접속 후 남은 덱 복원, 사용된 카드 재입력 거부.
- Encounter Level의 다른 지역 선택 후 Last 실행: 원래 실행 지역과 표시 입력값이 모두 복원됨.
- 삭제된 마지막 Recipe / 존재하지 않는 참조의 안전한 안내.
- 개별 임시 상태 비우기와 Recipe 삭제 후 사용자 Pack 유지.
- 결과창에 실물 입력이 하나만 표시되고 부분 재굴림 후 HOLD가 열린 상태를 유지.
- 모바일에서 Tray → Roll → Copy → Source → Close.

캠페인 보존: 편의 기능만 실행한 검사에서는 `morkborg-codex:v6`가 **바이트 단위로 동일**했다. 전체 수용 시나리오의 명시적 캠페인/던전 탐색은 기존 코드가 `workspace.section/dungeonTab/dungeonId/roomId`를 저장한다. 이 기존 탐색 상태를 제외한 캐릭터·던전·방·NPC·몬스터·조우·노트·출처·ID는 그대로였다. 편의 기능은 캠페인 저장 함수나 내보내기 스키마를 호출하지 않는다.

## 7. 반복 사용과 시각 검증

**1201.2초(20분), 62회 반복, 889개 클릭, 브라우저 오류 0건**. Tray, Last, Recipe, Hold, 실물 Reaction, Scratch를 섞어 사용했고 캠페인 저장 문자열은 매 회 동일했다. 미리 준비한 도구를 사용하는 이 시나리오에서는 Search나 Recent를 다시 열거나 조합을 재구성하지 않았다. 결과는 `outputs/convenience-layer/friction.json`에 보관했다. 반복 시뮬레이션과 별도로 최종 빌드의 수용·모바일 검사를 재실행했다. 실제 캠페인 세션을 진행했다거나 모든 실제 플레이에서 검색이 불필요하다고 주장하지 않는다. 새 표를 추가할 때의 최초 검색, 의미 있는 절차 선택, 긴 Recipe에서의 스크롤은 남는다.

360 / 768 / 1440 / 3440px에서 Empty Desk, Tray, Last, Recipe 결과, Scratch, Pack, 실물 입력, 열린 Source를 촬영했다. OS dark 선호도에서도 Source/Scratch/Pack을 검사했다. 이 앱은 종이/잉크 색상을 명시적으로 쓰므로 OS 선호도를 바꿔도 새로 어두운 배경만 적용되는 일이 없다. 카드 입력도 네 폭에서 별도로 확인했다.

시각적으로 확인하고 수정한 문제:

- 중복 React key 때문에 실물 입력 표시가 여러 번 남던 문제 제거.
- 부분 재굴림 뒤 HOLD가 닫혀 다시 열어야 하던 문제 제거.
- 편의 모달을 기존 reference overlay와 같은 층에 두고 각진 종이/잉크 스타일로 제한.
- Recipe의 Source와 추가 메뉴를 한 줄로 모으고, 결과 후 선택·관리 목록을 접음.
- 768px에서 Quick Tools가 한 글자씩 세로로 꺾이던 4열 배치를 가용 폭에 맞게 조정.
- 새 버튼·잠금·제거·카드 무늬는 약 44px 터치 영역을 확보.
- 새 상시 노란색/마젠타 패널 없음. 새 탭의 선택 상태는 잉크/종이 반전만 사용.
- Tray는 모바일 최대 336px, 도구 창은 최대 700px. 3440px에서도 가로로 늘어나지 않음.
- 새 창/페이지에 가로 overflow 없음. 한국어 도움말, 출처, 실물 입력의 글자 대비 확인.

개별 이미지와 측정값은 private 결과가 포함될 수 있어 `outputs/convenience-layer/`에만 보관하고 공개 Git에는 포함하지 않는다. `visual-metrics.json`의 단순 DOM control 수는 배경/접힌 요소 판정의 한계가 있어 “활성 버튼 수 감소”로 주장하지 않는다. 실제 스크린샷과 터치 경로를 판단 근거로 사용했다.

## 8. 자동 검사와 범위 제한

- 기존 658개 유지, 새 28개: 총 **686개 통과**.
- 전체 `npm test`, `npm run lint`, `npm run build` 통과.
- 공개 빌드 private-data 누출 검사: 74개 static 파일 통과.
- canonical Oracle source 미해결 0, reference definition source 미해결 0. 새 UNSOURCED 생성 내용 0.
- 원문 표·출처 데이터·확률·캠페인 스키마 수정 없음.
- CSS는 새 편의 도구 전용 파일과 기존 Quick Tools grid의 한 규칙만 변경. CSS import는 entrypoint에 두어 기존 SSR 테스트가 그대로 실행되도록 했다.

의도적으로 남긴 경계:

- 사용자 Recipe 결과/직접 수정/Hold 상태는 새로고침 후 재구성되지 않는다. 저장되는 것은 조합 정의다.
- 의미 있는 선택이 필요한 절차를 임의 기본값으로 Recipe에 자동화하지 않는다.
- 실물 입력은 기존 canonical dice 형식, 독립 표/조합, Depths 카드 절차에 제공한다. FERETORY의 연결된 전체 생성과 City의 가변 조건 절차를 임의의 범용 입력 언어로 변환하지 않았다. 관련 독립 표는 원래 Reference/Table 경로로 접근한다.
- Last는 Reference Desk의 canonical 실행을 대상으로 한다. 캠페인 객체 생성/편집/저장 동작을 다시 실행하지 않는다.
- Recipe 단계는 원자적 호출이다. 연결된 절차의 내부 값을 개별 잠금하는 우회 기능은 없다.
- Play/Scratch는 탭을 닫은 뒤의 영구 기록이 아니다. 개인 설정과 Scratch는 클라우드 동기화/캠페인 export 대상이 아니다.
- 이전 결과 전용 단축키, 드래그 정렬, 자동 문맥 채우기, PWA, 범용 매크로, 새 source content는 추가하지 않았다.

## 9. 전달

정확한 구현 커밋과 push/production 검증 결과는 최종 전달 메시지에 별도로 기록한다. 로컬 검증 URL은 `http://127.0.0.1:5175`이며, 이것을 production 배포로 간주하지 않는다.

공개 배포 확인 대상은 `https://morkborg-4e3y.vercel.app`이다. 같은 저장소의 다른 Vercel 프로젝트 상태와 혼동하지 않고 `morkborg-4e3y`의 배포 커밋을 확인한다.
