# Reference Desk — Visual identity pass / 시나리오 전용 굴림 제거

2026-09-12 · 실제 로컬 브라우저 검증

현재 참조가 먼저 읽히도록 검색·색인·작업대의 시각적 무게를 낮췄다. 검색 → 참조 → 명시적 굴림이라는 기존 구조는 유지했다. 작업 도중 추가로 요청한 **개별 던전 시나리오 전용 표 28개와 묶음 굴림 1개**도 활성 자료에서 제거했다.

## A. 변경 전 화면에서 확인한 문제

코드를 수정하기 전에 7종류의 상태를 4개 viewport에서 촬영했다. 서로 다른 최종 Before 화면은 9개다. 당시 기록은 `outputs/visual-identity/before-critique.md`에 남겼다.

| 화면 | 관찰 | 실제 사용 영향 |
|---|---|---|
| 첫 진입·검색 | 긴 검정 검색창, 노랑 밑줄, 중첩된 focus 테두리가 가장 강했다 | 읽고 있는 Reaction보다 탐색 장치가 먼저 보였다 |
| 360 Reaction | 참조 시작 y=331, 표 시작 y=613 | 첫 화면 대부분을 navigation과 반복 label이 차지했다 |
| Reaction | 제목·공식·표 caption에서 같은 이름과 주사위를 반복했다 | 짧은 표를 보기 위해 세로로 여러 구획을 지나야 했다 |
| 표 | 문단이 셀의 line-height 대신 전역 1.85를 상속했다 | 5개 짧은 결과의 표가 404px, 행은 약 73px였다 |
| 검색 결과 | 800 weight 제목, 범용 설명, 번역과 metadata를 반복했다 | `corpse` 검색의 후보를 비교하기 어려웠다 |
| Creature | 실제 능력치 위에 앱 설명과 같은 생물 이름을 다시 표시했다 | HP·Morale·공격까지 시선이 늦게 도착했다 |
| 1440 Workbench | Related가 위를 차지하고 작업대 폭은 289px였다 | 옆에 펼친 페이지가 아니라 길고 좁은 보조 패널로 보였다 |
| 3440 Workbench | 현재 참조 폭이 1,698px까지 늘었다 | 짧은 결과의 행과 긴 문장이 불필요하게 넓어졌다 |
| 전체 | 노랑이 검색·Pin·Roll·선택·작업대에서 동시에 쓰였다 | 현재 결과와 단순 조작 버튼의 중요도가 비슷해졌다 |
| 전체 | 제목 밑줄, 색인 경계, 결과 막대, 작업대 경계가 반복됐다 | 한 문서보다 조립된 패널들을 읽는 느낌이 강했다 |

## B. 주요 디자인 결정 — Before → After → Why

| Before | After | 이유 |
|---|---|---|
| 넓은 검정 검색면 | 최대 600px의 밑줄형 검색 | 빠른 접근성을 유지하면서 현재 참조에 시각적 중심을 주기 위해 |
| 세 영역이 비슷한 중요도의 column | 작은 색인 / 현재 문서 / 펼친 페이지 | 읽기·찾기·잠시 보관하기의 공간적 관계를 분명히 하기 위해 |
| 상시 오른쪽 Related | 현재 문서 아래의 Related | 현재 내용과 연결하고 Workbench 공간을 확보하기 위해 |
| 289px 작업대 | 1440에서 440px, 3440에서 네 페이지 병렬 | 미니어처 카드 대신 실제 문장을 읽게 하기 위해 |
| 현재 문서가 초광폭으로 확장 | 문서 최대 960px, 문단 최대 72ch | 넓은 공간을 긴 줄 대신 다른 페이지에 쓰기 위해 |
| 굴림 공식·Roll·실물 입력이 떨어짐 | 오라클의 공식과 두 입력 수단을 한 줄에 배치 | 주사위를 직접 굴릴 때도 같은 위치를 사용하기 위해 |
| 분리된 결과 강조 막대·animation | 공식·값·결과 뒤 원본 표의 선택 행 | 결과를 표의 해석으로 읽게 하기 위해 |
| 작은 표 글자 + 큰 행 간격 | 본문 16px, 번역 14px, 짧은 행 약 61px | 글자를 줄이지 않고 불필요한 세로 공간을 줄이기 위해 |
| mobile의 고정/최근 heading과 목록이 각각 한 줄 | 각각 28px 안팎의 가로 목록 | 현재 참조가 아래로 밀리는 양을 줄이기 위해 |
| 작은 화면에도 모든 Workbench 본문을 반복 | 제목·공식·최근 결과·열기/굴림만 유지 | 현재 페이지의 원본 표를 지키면서 긴 중복 문서를 피하기 위해 |

새 navigation, mode, session runner, recommendation, dashboard widget은 만들지 않았다. 정보 구조는 다음과 같다.

```text
기능 관계: Search / Browse / Pins / Recent → Reference → Roll 또는 Related
                                      ↘ 필요할 때 Workbench에 펼치기

공간 Before: 강한 Search + Index | 현재 참조 | Related + 좁은 Workbench
공간 After:  조용한 Search + Index | 현재 문서·Related | 펼친 페이지(있을 때만)
```

## C. 제거하거나 축소한 시각 요소

- 검색의 검정 배경, 노랑 밑줄, 노랑 focus 강조.
- Pin·일반 Roll·작업대 버튼의 반복되는 노랑 면.
- 현재 참조 제목 아래 경계, 결과 왼쪽 강조 막대, 색인·history의 불필요한 구획선.
- 빈 Workbench column, 작업대의 굵은 상단 경계와 결과 내부 배경.
- 범용 Creature 안내 문장, 중복 생물 heading, 검색 결과의 `d20 · 20개 결과` 같은 반복 설명.
- 단일 표의 눈에 보이는 중복 caption과 `굴림 공식` label. 접근성 이름과 실제 공식은 유지했다.
- 별도 book label + Source label을 하나의 `책 약칭 · 출처` disclosure로 통합.
- 결과 도착 opacity animation, Workbench 결과의 반복 제목.

별도 card 기능을 새로 만들거나 기존 데이터를 카드 단위로 재작성하지 않았다. 이 단계의 삭제는 주로 문서 주변의 표시와 경계에 집중했다.

동일 Reaction 화면의 DOM element 관측치는 582 → 561, 네 페이지 Workbench는 960 → 944다. 최근 목록 내용 등 동적 차이가 있으므로 이를 모든 화면의 고정 절감량으로 해석하지 않는다. CSS는 **846 → 1,077줄**로 늘었다. 반응형·접근성·기존 CSS 상속 보정 때문에 증가했으며 코드 줄 수가 줄었다고 주장하지 않는다.

## D. Typography와 색

기존 로컬 Barlow Condensed / Pretendard Variable을 유지하되 쓰임을 다시 배분했다. 새 장식 서체는 추가하지 않았다.

| 계층 | 현재 표현 |
|---|---|
| 현재 참조 제목 | Barlow Condensed 900, desktop 42px / mobile 36px |
| 결과 | Pretendard 650, 22px; 공식·굴린 값과 가까이 배치 |
| 본문 section heading | Pretendard 700, 19px; 작은 구조 label은 12–13px |
| 규칙·본문 | Pretendard 450, 16px / line-height 1.55, 최대 72ch |
| 표 결과 | Pretendard 450, 16px / 1.45; 한글 14px / 1.45 |
| 공식·숫자 | 시스템 monospace, 공식 16px / 600; 숫자 열 tabular, nowrap |
| 색인 제목 | Pretendard 650, 14px; 설명은 한 줄로 제한 |
| Source / metadata | 11–12px, 낮은 대비; 필요할 때 원문 provenance 펼침 |
| Workbench | 제목 19px / 700, 본문·표 15px, 번역 13px |

굵은 condensed 서체는 현재 제목과 작은 wordmark에 집중했다. 한글 본문은 영어의 condensed 형태를 흉내 내지 않는다. 문단 폭·정렬·숫자 열·divider로 계층을 유지하므로 굵기만으로 구분하지 않는다.

종이색 배경과 잉크색이 기본이다. 노랑은 현재 선택된 굴림 행(`#ffe90040`, 왼쪽 3px 표시)과 텍스트 선택에 사용한다. 현재 색인은 검정 선으로 표시한다. 검정 채움은 hover 피드백이다. 기존 오류·원문 불완전 표시의 의미는 바꾸지 않았으며, 이를 장식으로 추가하지 않았다.

## E. Table 검증

| 실제 표 | 검증 내용 | 결과 |
|---|---|---|
| Failed Morale · d6 | 두 원본 범위 1–3 / 4–6, 실물 값 6 | `surrenders`와 4–6 행 강조가 일치. 두 행 약 61px |
| Events by the Road · d20 | 16개 원본 범위, 긴 문장·번호 열, 실물 값 20 | 길가 시체 결과와 20 행 일치. 1440에서 행 61–85px. Corpse 연결 유지 |
| Corpse Plundering · d66 | 26개 원본 행, 360에서 중간·끝부분 탐색, 실물 값 55 | Bloodstained knuckle-duster와 55 행 일치. 표 전체 높이 2,750 → 2,604px. 행 삭제 없음 |
| Action Oracle · d100 | 100행, 마지막 부분 스크롤, 실물 값 100 | `Reach`와 100 행 일치. 긴 표를 축약하거나 페이지별로 잠그지 않음 |
| Reaction · 2d6 | digital roll / reroll | 12→Helpful, 2→Kill!, 마지막 재검증 8→Indifferent. 대응 범위 강조 유지 |

줄무늬 장식 대신 얇은 행 divider와 일정한 숫자 열을 사용한다. `d66`의 11–16 같은 범위가 분리되지 않으며, 긴 본문만 자연스럽게 줄바꿈한다. 표 caption은 스크린리더에서 계속 이름으로 제공된다. 원문이 애매하거나 굴림이 허용되지 않은 표는 기존 제한을 유지한다.

## F. Workbench

같은 Reaction / Morale / Weather / Corpse 네 페이지를 비교했다.

- **1440:** 현재 참조 637px, 작업대 440px(여백 포함). Related가 작업대 위를 차지하지 않는다. 각 페이지는 원문을 표시하며 작업대 전체에 하나의 세로 스크롤을 사용한다. 현재 참조의 42px 제목과 작업대의 19px 제목으로 중심을 구분한다.
- **3440:** 현재 참조 960px, 색인 280px, 작업대 총 2,039px. 약 483px의 네 페이지를 나란히 읽는다. 같은 높이의 box로 강제하지 않는다. 긴 Corpse 페이지는 자신의 영역에서 스크롤한다.
- **360 / 768:** Workbench는 간단한 복귀 목록이 된다. 현재 참조의 원본 표와 공식은 숨기지 않는다. Workbench 제목을 누르면 그 원본을 현재 문서로 바로 연다.
- 네 페이지를 펼친 뒤 reload해 복원되는지, 옆의 Weather만 굴렸을 때 Reaction이 그대로인지, 긴 표 아래에서 작업대 Morale로 돌아갈 수 있는지 확인했다.

Pins = 오래 쓰는 바로가기, Recent = 방금 열었던 참조, Workbench = 잠깐 펼친 페이지다. 어느 것도 session 진행도나 저장 의무를 만들지 않는다.

## G. Responsive evidence

수치는 실제 DOM의 CSS pixel을 반올림했다. 세로 scrollbar가 있는 viewport는 보통 너비 15px를 사용한다. 아래 모든 최종 캡처에서 **수평 overflow 0px**였다.

| 동일 상태 / viewport | 참조 시작 y Before → After | 참조 폭 Before → After | 표 시작 y Before → After |
|---|---:|---:|---:|
| 360×900 Reaction | 331 → 199 | 313 → 313 | 613 → 406 |
| 360×900 Corpse d66 (`corpse`) | 339 → 211 | 313 → 313 | 596 → 390 |
| 768×1000 Travel (`travel`) | 322 → 199 | 721 → 721 | 연결된 표 바로가기 사용 |
| 1440×1000 Reaction | 109 → 98 | 760 → 960 | 345 → 269 |
| 1440×1000 Creature (`hungry zombie`) | 111 → 98 | 772 → 960 | 해당 없음 |
| 1440×1000 Workbench 4개 | 109 → 98 | 760 → 637 | 345 → 269 |
| 3440×1440 Workbench 4개 | 115 → 102 | 1698 → 960 | 353 → 273 |

1440의 색인은 280 → 236px, 3440은 340 → 280px다. Workbench가 없을 때 초광폭의 남는 공간을 장식이나 새 widget으로 채우지는 않는다. 페이지를 펼쳤을 때 그 공간을 실제 읽기 자료에 사용한다.

9쌍의 전후 캡처와 원본 크기 링크: **`outputs/visual-identity/comparison.html`**. 측정 원본: `before-metrics.json`, `after-metrics.json`. 검색·규칙까지 추가하여 총 7종류의 상태를 확인했다. Recent 내용은 실제 검증 과정에서 바뀌므로 전후 이미지에서 동일하지 않다.

## H. 장시간 사용과 interaction acceptance

기록된 브라우저 검증 구간은 **19:54:52–20:31:29 KST, 36분 37초**다. 검색·읽기·굴림·복귀 등 46개 관찰을 기록했다. 단순 대기 호출로 시간을 채우지 않았다. 복사 메뉴 수정과 시나리오 삭제 구현에 사용한 두 긴 공백(7분 4초, 7분 46초)을 제외하면 반복 interaction 블록은 **21분 47초**다. 이는 사람의 시선 추적 측정이 아니라 브라우저 작업 기록 기준이다.

`outputs/visual-identity/interaction-journal.json`에 시간·행동·관찰을 남겼다.

실제 사용 중 발견해 수정한 문제:

1. 긴 d100 표를 내려가면 Workbench까지 같이 사라졌다 → desktop 작업대를 sticky로 유지.
2. 360에서 이전 검색 상태가 Recent 복귀 시 다시 펼쳐졌다 → 참조 이동 시 검색 펼침 상태를 닫고, 같은 참조의 Enter도 닫히게 수정.
3. COPY WITH SOURCE 메뉴의 세 버튼이 같은 위치에 겹쳤다 → 문서 흐름 안의 세로 메뉴로 변경. 실제 clipboard에 `Reaction / Almost friendly / MB-BB · PDF 32 · 인쇄 p. 32`가 들어오는 것을 재확인.
4. 복사 오류 재현 중 추가된 스크랩 두 건만 제거했다. 기존 Reaction / Indifferent 스크랩은 보존했다. 테스트용 Weather Pin과 네 Workbench 페이지도 정리했다.

삭제 반영 후 순서도 다시 수행했다:

| 다음 참조 | 사용한 접근 | reset / mode / 완료 / save 요구 |
|---|---|---|
| Reaction | Pin → Roll | 모두 없음 |
| Morale | Reaction의 Related | 모두 없음 |
| Weather | 검색 → Enter → Roll | 모두 없음 |
| Corpse | 검색 → Enter, 표 읽기 | 모두 없음 |
| Creature | `Seth Goblin` 검색 → Enter | 모두 없음 |
| Travel | 검색 → Enter, 관련 공식 확인 | 모두 없음 |
| 무관한 표 Failed Morale | Pin 한 번 → 실물 6 조회 | 모두 없음 |

**Required progression 0 / session start 0 / save 0 / mode transition 0.**

자주 사용한 것은 Search, Recent와 Pin이었다. Workbench는 Weather 결과를 옆에서 확인하고 긴 표에서 Morale로 돌아올 때 실제로 사용했다. 사용하지 않는 펼친 페이지는 접을 수 있고 빈 column은 남지 않는다.

검색어가 입력된 상태를 기준으로 Search→Reference는 제목 클릭 또는 Enter **1회**, Search→Roll은 열기+Roll **2회**(검색 결과의 보조 굴림은 **1회**)다. 검색창 focus·문자 입력은 별도다. Pin/Recent/Related→Reference는 각 **1회**, Reference→Roll→Reroll은 **2회**다. Browse는 기본 색인에서 **1회**, type/context filter를 쓰면 filter 선택이 한 번 더 필요하다. 360에서 닫힌 Browse를 쓰려면 `펼치기` **1회**가 추가된다. 필수 category/mode 선택은 없다.

직접 확인한 검색은 정확한 제목, 부분어, 등록된 한국어 alias, source+제목이다. `core weather`와 `날씨`는 Weather를 바로 보여준다. 임의의 모든 자연어를 이해하는 semantic search를 추가한 것은 아니다. Context의 Dungeon은 119개 관련 바로가기를 좁혀 보여주며, 선택해도 현재 Failed Morale를 바꾸지 않았다.

## I. 시나리오 삭제와 data integrity

| 제거 범위 | 표 수 |
|---|---:|
| Graves Left Wanting — 조우·감각·길·지식·시체·유골함·상자·Übertaker 행동 | 8 |
| Rotblack Sludge — 조우 A/B·서적·방 수색·Fletcher 권능 | 5 |
| The Death Ziggurat — 꽃·폐허·보물·수색·hex 사건 | 6 |
| Goblin Grinder — 도입 동기·액체·Alchemy Tables | 3 |
| Sepulchre of the Swamp Witch — 소원·소문 | 2 |
| Nurse the Rot — Corridor North | 1 |
| Sölitary Defilement 예제 DR10 던전 조우 | 2 |
| Scumslaughter Farm — Cult Farmwife 특수 행동 | 1 |
| **합계** | **28** |

추가로 Graves의 `Loot the Bodies · two independent d6 rolls` 묶음 1개를 제거했다. Alchemy Tables는 범용 연금술 생성기가 아니라 Goblin Grinder의 상황 표이므로 포함했다.

단순 검색 숨김이 아니다. 자료 parser와 canonical registry에서 제외하며 기존 자료를 재수입해도 복원되지 않는다. 이전 table 객체로 digital roll / manual lookup을 호출해도 실행되지 않는다. Pin·Recent·기존 Oracle 즐겨찾기·Workbench·사용자 조합의 해당 바로가기도 걸러낸다. 일반 던전 생성·방·함정·조우·시체 표와 고정 Creature 통계는 유지한다.

원본 PDF와 개인 자료 JSON은 아카이브로 보존했다. Source 원문을 편집하거나 추측으로 보완하지 않았다. 삭제 ID와 출처별 목록은 `outputs/visual-identity/removed-scenario-tables.json`에 있다.

| 데이터 | Before | After | 이유 |
|---|---:|---:|---|
| Reference | 1,029 | 1,000 | 시나리오 표 28 + 묶음 1 제거 |
| canonical Table | 574 | 546 | 위 28개 |
| Oracle kind | 564 | 536 | 위 28개 |
| Procedure kind | 69 | 68 | 묶음 1개 |
| source procedure | 59 | 58 | 같은 묶음 1개 |
| Rule | 285 | 285 | 유지 |
| Creature reference | 95 | 95 | 유지 |
| 원본 Creature preset | 89 | 89 | 유지 |
| Book reference / 원본 library book | 9 / 6 | 9 / 6 | 유지 |

남은 모든 Reference/Table ID가 변경 전 목록과 정확히 일치하는 것을 검사했다. 아카이브 JSON hash도 동일하다. 기존 Source provenance 검증, 10,000회 seeded roll 검증, migration/import 테스트를 통과했다. 공식·주사위 엔진·ReferenceKind·source mapping은 재작성하지 않았다. 이전 요청의 Core d66 재앙 제한과 polyhedral 주사위 선택도 유지했다.

## J. 실행한 테스트

| 항목 | 실제 결과 |
|---|---|
| 전체 자동 테스트 | **744 / 744 PASS**, 실패 0, skip 0 |
| 이번에 새로 추가 | **5개**: compact table 보존 1 + 시나리오 삭제/재수입/낡은 굴림/바로가기 정리 4 |
| 기존 테스트 수정 | **6개 사례**: Source disclosure 1, import 기대값 2, registry count 1, 원문 metadata 1, 제거된 manual-only 시나리오 기대값 1 |
| 브라우저 acceptance | 46개 시각·행동 기록, 발견된 3개 interaction 문제 수정 후 재검증 |
| responsive acceptance | **4 viewport**, **9쌍**의 동일 상태 Before/After. 모두 수평 overflow 0 |
| lint | PASS, exit 0 |
| production build | PASS: client/server TypeScript, Vite, public-build privacy 검사(61 static files) |
| migration / import | 전체 suite 및 신규 삭제 회귀 사례 PASS. 사용자 브라우저에 시험 자료 import를 실행한 것은 아님 |
| source / roll integrity | 전체 suite PASS, 10,000 seeded roll 포함 |
| 브라우저 console | 마지막 error/warn 조회 0건 |

처음 실행에서는 SourceDisclosure 기본 아이콘 변경 때문에 기존 테스트 3개가 실패했다. 기본 계약을 복원해 해결했다. 시나리오 삭제 뒤에는 삭제된 Nurse 표를 기대하던 테스트 1개가 실패했고 새 요청에 맞춰 부재를 검증하도록 바꿨다. 위 PASS는 수정 후 최종 실행 결과다. 최초 신규 아카이브 비교 테스트의 schema 외 필드 비교도 기존 parser 계약에 맞췄다.

원본 로그: `outputs/visual-identity/tests.txt`, `lint.txt`, `build.txt`, `scenario-tests.txt`, `data-regression.txt`.

## K. 남은 제약과 마지막 판단

- 1440에서 작업대 네 페이지를 한꺼번에 모두 읽을 수는 없다. 440px 폭의 한 column 안에서 스크롤한다. 3440에서는 네 개가 병렬이다.
- Related를 현재 문서 뒤로 옮긴 결과, 긴 d66/d100에서는 Related까지 내려가야 한다. 고정 검색과 Pin/Recent/Workbench가 복귀 수단이다. 새로운 sidebar로 덮지 않았다.
- 모바일 Workbench의 전체 표 미리보기는 생략한다. 해당 제목을 한 번 눌러 현재 문서에서 읽는다. 현재 문서의 원본 표는 생략하지 않는다.
- 긴 원문 표 자체는 여전히 길다. Corpse는 mobile에서 2,604px, d100은 그보다 길다. 무조건 접거나 행을 삭제하지 않았다.
- 긴 원제의 현재 제목과 236px 색인에서는 여러 줄이 필요하다. 한 글자씩 끊기던 wrapping은 해결했지만 모든 제목을 한 줄로 만들지는 않았다.
- 일부 Procedure는 연결된 표들의 공식을 모아 표시한다. 세부 조건·실제 판정은 본문에 있다. 이번 변경에서 원문 해석을 새로 만들지 않았다.
- 알 수 없는 임의의 표현, 등록되지 않은 동의어, 오타까지 모두 찾는 검색은 지원하지 않는다.
- 원문이 불완전하거나 겹치는 구간을 가진 기존 source gap은 남는다. 사용 불가 표를 임의로 완성하지 않았다.
- 별도의 자료·캠페인 관리 화면에는 이전 시각 스타일이 남아 있다. 이번 작업은 Reference Desk와 그 안의 문서·작업대에 집중했다.
- 2시간 사용이나 사람의 눈 피로를 검증했다고 주장하지 않는다. 20분 이상 반복 사용에서 관찰한 wrapping, 검색 복귀, 버튼 충돌, scrolling 문제를 해결했다.

최종 여섯 질문에 대한 판단:

1. **게임 정보 비율이 가장 크게 증가한 곳:** 360 Reaction. 표가 207px 위로 올라와 첫 화면에서 다섯 결과를 읽는다.
2. **가장 많이 줄인 UI:** 반복되는 label·설명·source 표기와 강한 면/경계. 새로운 큰 기능은 만들지 않았다.
3. **가장 강한 세 요소:** 현재 제목, 굴린 결과, 선택된 원본 행. 초기 상태에서는 결과가 없어 제목과 숫자 열·본문이 중심이다.
4. **평범한 색/서체로 바꿔도 계층이 남는가:** 문서·색인의 폭, 일관된 숫자 열, 제목/본문 배치, 간격이 구조를 지탱한다. 장식에만 의존하지 않는다.
5. **로고 없이도 성격이 남는가:** 양쪽 색인과 임시 페이지, 바로 읽는 표, 얕은 연결이 실제 reference desk를 만든다. MÖRK BORG 고유 분위기는 제한된 제목과 종이·잉크 대비에서 보탠다.
6. **2시간 켜둘 만한가:** 이전보다 적합하다고 판단한다. 반복 강조와 animation을 줄이고 본문을 키웠다. 다만 장시간 사용자 피로도는 별도의 실제 플레이에서 추가 확인할 부분이다.
