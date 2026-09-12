# Reference Desk UX 재평가

## Phase 1 — 변경 전 실제 브라우저 감사

2026-09-12 09:15:58 UTC에 시작. 코드를 수정하기 전에 로컬 사이트에서 실시했습니다. 기존 사용자 고정 항목을 지우지 않은 상태로 시험했으며, 신규 사용자의 클릭 수를 추정해 측정값으로 섞지 않습니다.

| 분류 | 실제 관찰 |
| --- | --- |
| Critical friction | “시체에서 뭐가 나오는 표”, “NPC가 나를 어떻게 대하는지” 검색 실패. “날씨”는 Weather가 아닌 SD 여행 규칙만 반환. |
| Moderate friction | 결과를 선택하면 자동으로 굴리는 경우와 읽기만 하는 경우가 혼재. 읽으려면 별도 작은 DETAILS 아이콘을 골라야 함. |
| Visual noise | 기본 카드 grid, 거대한 일반 주사위, 홈 표지, sidebar, topbar, 하단 dock, inspector toolbar에 유사 기능 중복. |
| Information hierarchy | Reaction 결과는 크게 표시되지만 실제 표는 숨겨짐. Travel 규칙의 연결 표는 접힌 Related/Source 뒤에 있음. 생물 특수 능력은 “자세히” 뒤에 있음. |
| Navigation friction | 다른 참조로 전환할 때 inspector 검색 버튼 → 검색 입력 → 결과 선택을 반복. 홈으로 돌아갈 필요는 없었지만 검색과 내용이 서로를 대체함. |
| Unnecessary statefulness | 완료 gate는 없었음. 그러나 고정/최근 참조의 기본 클릭이 새 굴림을 실행하고, 단순 작업대에 Recent rolls/Context/Physical/Scratch/Recipes 기능 메뉴가 나옴. |

측정: 기본 Reaction 카드에서 Roll은 클릭 1회(스크롤 별도). 결과와 2d6=값은 함께 보이지만 표는 숨겨집니다. 검색 결과의 기본 클릭은 자동 굴림, 별도 DETAILS는 읽기 전용입니다. Morale 규칙의 출처는 참조를 연 뒤 1회 펼쳐 확인할 수 있습니다.

360px 여행 화면의 문서 높이는 8,946px였습니다. 첫 화면 대부분은 탐색·주사위 UI입니다. 3440px에서도 Weather inspector 폭은 780px로 전체 화면의 약 23%만 사용했습니다. 나머지 화면은 흐려져 이용할 수 없었습니다.

A–E 동작과 연속 탐색: Weather → Reaction → Corpse → Hungry Zombie → Morale → Travel, 추가로 NPC 구성 → FERETORY 검색 → Alchemy → Weather를 직접 사용했습니다. 강제 저장·진행은 발견되지 않았지만 reference surface의 목표에는 미달합니다.

## Registry 기준선

동일한 현재 private fixture로 생성한 registry: 참조 1,029개(Oracle 564, Procedure 69, Rule 285, Creature 95, Region 7, Book 9), 원본 표 574개, 원본 procedure 59개. 원본 자료 팩의 creatures 레코드 89개, books 레코드 6개. registry에는 내장 책 출처와 별도 참조 생물이 포함되므로 원본 레코드 수와 registry 수가 다릅니다.

기준선의 전체 ID 목록은 `outputs/ux-reassessment/registry-before.json`에 보존했습니다.

## Phase 2 — 구현 전 IA 설계

Before: Home → 기본 작업대 카드 / 별도 Quick Tools / 별도 색인 → 검색 또는 결과 모달 → 표·결과 전환. Pins/Recent/검색이 홈·하단 dock·모달 toolbar에 반복됩니다.

After: 하나의 Reference Desk. 왼쪽의 검색 / 실제 registry 종류·출처·문맥 필터 / Pins / Recent → 중앙의 열린 Reference(규칙·공식·표·굴림 결과) ↔ 오른쪽 Related / 사용자가 펼쳐둔 페이지.

- Home은 Desk 자체입니다. 첫 화면에는 결과 없이 기본 Reaction 표를 펼쳐 둡니다. Search는 항상 같은 자리에 있고 검색해도 읽던 표를 닫지 않습니다.
- 검색 결과와 Pins/Recent의 제목은 모두 읽기로 통일합니다. 디지털 굴림은 별도 명시적 버튼입니다.
- Browse는 실제 여섯 ReferenceKind(규칙, 표·오라클, 절차·생성, 생물, 지역, 책)와 현재 책 목록을 필터링합니다. 새 콘텐츠나 모드가 아닙니다.
- Context는 현재 registry의 character/npc/monster/room/dungeon/travel/city shortcut 필터입니다. 선택은 필수가 아닙니다.
- Workbench는 기존 tray를 재사용하여 추가한 페이지만 보여줍니다. Pins는 장기 바로가기, Recent는 탐색 이력, Workbench는 임시로 펼친 페이지입니다.
- Optional records와 자료 관리만 접힌 보조 메뉴에 둡니다. 원본 registry, source, roll engine, copy, 저장 스키마는 유지합니다.
- 1440px 이상은 탐색·본문·옆 페이지 영역에 폭을 배분하고, 작은 화면은 검색 위/본문 아래의 한 열로 전환합니다. 기본 카드 grid, 표지, 중복 toolbar 및 표/결과 전환을 제거합니다.

검증은 UI 사용의 전후 비교와 별도 데이터 무결성 검사로 나눕니다. 기존 731개 테스트 통과는 이번 UX의 통과 근거로 재사용하지 않습니다.

## 최종 보고 — 2026-09-12

### 1. 발견한 UX 문제

위 Phase 1의 A–F 검사는 코드 변경 전에 수행했습니다(18:15:58–18:26:26 KST). 단순히 progression gate가 없다는 것만으로 Reference Desk가 되지는 않았습니다.

- Reaction은 카드의 Roll 1회로 굴릴 수 있었지만 스크롤이 필요했고, 결과를 본 뒤 표를 다시 열어야 했습니다.
- inspector에서 다른 표를 찾으려면 검색 버튼 → 입력 → 결과 선택을 반복했습니다. 별도의 홈 복귀는 강제하지 않았습니다.
- Home·Quick Tools·하단 dock·inspector에 중복된 탐색과 도구 버튼이 있었습니다. 1440px에서 첫 reference 카드가 화면 상단으로부터 826px 아래에 있었습니다.
- 이름을 모르는 한국어 검색 네 가지 중 두 가지는 실패했고, 두 가지는 실제 표 대신 여행 규칙만 찾았습니다.
- 참조 제목과 작은 DETAILS 버튼의 동작이 달랐습니다. Pins/Recent로 읽으러 돌아가면서 새로 굴리는 경우가 생겼습니다.
- 초기 재배치 중에는 기존 가로 flex 스타일이 남아 좁은 색인의 제목을 한두 글자씩 찢었습니다. 사용자가 보낸 세 화면에 해당하는 문제를 수정하고 실제 브라우저로 확인했습니다.

### 2. IA 변경 전 / 후

```text
Before
Home / PLAY / Quick Tools / 책 색인
  └ 검색 또는 카드 → 결과 inspector → 표·결과 전환
       └ inspector 검색 → 다른 참조
  + sidebar / topbar / 하단 dock / 별도 Workbench 메뉴

After
Reference Desk (= Home)
  ├ Search ────────────────→ 열린 Reference
  ├ Browse: 종류·책·상황 ─→ 열린 Reference
  ├ Pins / Recent ────────→ 열린 Reference
  │                          ├ 공식 + 표 + 독립 Roll
  │                          ├ Related → 다른 Reference
  │                          └ 펼치기 → 선택한 페이지만 Workbench
  └ 자료·기록 메뉴 → Sources / 가져오기 / 선택적 보관함
```

Home과 PLAY의 기본 카드 화면을 하나의 Desk로 통합했습니다. 기존 여행·도시·던전 진입점도 같은 Desk를 사용하며 문맥 필터만 달라집니다. 기록 화면의 기존 데이터와 관리 기능은 보조 메뉴에 남겨두었습니다.

### 3. Primary interaction path

아래 숫자는 **검색어가 입력된 뒤의 클릭 또는 Enter**를 셉니다. 검색어 입력 자체는 별도 1회이며, 모바일에서는 먼저 검색창을 탭합니다. 데스크톱 첫 진입에는 검색창이 포커스를 받습니다. 다른 곳을 읽는 중에는 검색창 클릭 또는 Cmd/Ctrl+K를 사용할 수 있습니다.

| 경로 | 동작 수 | 중간 판단 |
| --- | ---: | --- |
| Search → Reference | 결과 제목 1회 또는 Enter 1회 | category/mode 선택 없음 |
| Search → Roll | 결과 행의 굴리기 1회 | 디지털 굴림 가능한 표·생성기 기준 |
| Search → Reference → Roll | 2회 | Morale 같은 규칙은 열고 해당 2d6 버튼을 사용 |
| Recent → Reference | 1회 | 열기만 수행 |
| Pin → Reference | 1회 | 열기만 수행 |
| Reference → Related Reference | 1회 | 완료/저장 확인 없음 |
| Reference → Roll → Reroll | 2회 | 각 굴림이 독립적 |
| Browse → Reference | 이미 보이는 행은 1회; 종류 필터부터는 2회 | 출처·상황 필터는 선택 사항 |

모바일 Browse는 접힌 색인을 펼치는 1회가 추가됩니다. 검색하면 결과 목록은 자동으로 펼쳐지고, 다른 참조를 선택하면 접힙니다. 긴 결과 목록의 스크롤이나 더 보기까지 클릭 수에 포함했다고 주장하지 않습니다.

### 4. Reference 정보 우선순위

이름 → 짧은 설명 → 공식 → 본문·표·작은 결과 → Related → 작은 책 표기와 Source 순서로 읽습니다. Roll은 공식 근처에 작은 버튼으로 있고, 결과가 생기면 결과 옆의 Reroll로 바뀝니다. 결과 뒤에도 표가 그대로 남습니다.

- Reaction은 2d6와 다섯 구간을 처음부터 읽을 수 있습니다. 굴린 뒤에는 `2d6 = 7 / Indifferent`와 7–8 행 강조가 함께 표시됩니다.
- Travel은 원본 요약, 네 가지 연결 표의 이름·공식·직접 열기/굴리기를 함께 보여줍니다. Related에는 길·흔적·야영·거리·Core 재앙을 둡니다. 이것들은 단계 버튼이 아닙니다.
- 생물의 HP·Morale·Armor·공격·특수 규칙은 숨김 없이 표시됩니다. Hungry Zombie의 특수 규칙도 추가 펼치기가 필요하지 않았습니다.
- Book, PDF page, printed page, 원본 table, provenance는 기존 Source disclosure를 그대로 사용합니다.
- 결과 모달과 극적인 애니메이션을 기본 Desk에서 사용하지 않습니다.

### 5. Search 개선 및 검증 범위

| 입력 | 확인한 결과 |
| --- | --- |
| `reaction`, `morale`, `corpse`, `travel`, `alchemy` | 해당 참조를 직접 검색·열기 |
| `react` | Reaction이 첫 결과 |
| `날씨` | Weather가 첫 결과, d12 표시 |
| `시체에서 뭐가 나오는 표` | Corpse만 검색됨, d66 표시 |
| `NPC가 나를 어떻게 대하는지` | Reaction만 검색됨, 2d6 표시 |
| `길 상태` | What's the Road Like?가 첫 결과, d8 표시 |
| `core weather` | Core Weather |
| `oracle weather` | Weather가 첫 결과; 종류 용어도 메타데이터에서 검색 |
| `FERETORY` | FERETORY 책 색인이 첫 결과, 해당 출처의 참조들도 노출 |
| `creature` | 생물·생물 관련 표가 함께 나옴; Hungry Zombie를 열어 확인 |
| `재앙`, `동물 흔적` | Core Miseries / SD Leaving the Road |

기존 토큰·별칭·출처 검색을 확장했습니다. 정확한 상황 별칭과 기존 지역 몬스터 도구의 우선순위를 유지하면서, 제목 앞부분 일치와 책 이름 검색의 순위를 보완했습니다. 일반적인 자연어 의미 이해, 오타 교정, 임의의 긴 문장 검색은 구현하지 않았습니다. 종류를 정확히 한정하려면 Browse 필터를 사용합니다.

### 6. Browse / discovery

새로운 mock category를 만들지 않았습니다. 실제 `ReferenceKind` 여섯 종류를 그대로 노출합니다: 규칙 285, 표·오라클 564, 절차·생성기 69, 생물 95, 지역 7, 책 9.

제목·설명·공식·출처가 목록에 함께 보입니다. 책 필터와 종류 필터를 조합하면 FERETORY의 표·오라클 55개처럼 실제 목록을 곧바로 읽을 수 있습니다. Search 없이 이 필터에서 Alchemy를 직접 열었고, Roll 없이 d4 표와 Source를 읽었습니다. 초기 24행 이후는 더 보기로 기존 registry 전체에 접근합니다.

### 7. Pins / Recent / Workbench

- **Pins:** 자주 사용하는 참조. 기존 저장 키·이전 즐겨찾기 migration을 유지했습니다. Weather를 추가한 뒤 새로고침하여 유지되는 것을 확인하고, 검증용 추가 항목은 해제했습니다. 기존 세 고정 항목은 유지했습니다.
- **Recent:** 최근 접근한 서로 다른 참조 최대 10개. 화면에는 최근 6개 바로가기를 보여주고 최근 제목을 누르면 전체 이력을 봅니다. 반복 접근하면 앞으로 이동합니다. 굴림 로그나 장면 기록이 아닙니다.
- **Workbench:** 기존 tray를 재사용한 펼친 페이지. Reaction·Weather·Morale·Corpse 네 페이지를 추가해 표/규칙을 읽었습니다. 각각 닫을 수 있고, 모두 닫아도 현재 Weather 참조는 유지됐습니다. 새로고침 시 열린 페이지 목록은 유지되며 게임 상태는 저장하지 않습니다.

Workbench의 굴림 결과는 기존 reading을 재사용하고, 원본 표/규칙을 옆에서 읽을 수 있습니다. 긴 페이지는 그 페이지 안에서 스크롤합니다. 검사에 추가한 네 페이지는 정리했습니다.

### 8. Contextual Tools

모든 Context에서 현재 Alchemy 참조가 바뀌지 않고 검색 목록만 달라지는 것을 직접 확인했습니다.

| Context | registry 참조 수 |
| --- | ---: |
| Character | 235 |
| NPC | 69 |
| Monster | 191 |
| Room | 71 |
| Dungeon | 136 |
| Travel | 219 |
| City | 74 |

Context 선택은 필수가 아니며, 선택 시 세션·도시·던전 진행을 시작하지 않습니다.

### 9. 제거·축소한 요소

- 기본 12개 Quick Tool 카드와 주제별 카드 grid 렌더러
- 홈 표지와 기능별 launcher 묶음
- 기본 화면에 상시 놓이던 대형 일반 주사위 영역 → 필요할 때 펼치는 주사위 버튼
- Desk의 중복 sidebar·topbar·하단 reference dock·Fate floating 버튼·출처 약칭 footer
- Desk의 Reference 모달, 표/결과 전환 버튼, 제목 클릭 시 자동 Roll, 별도 DETAILS 분기
- Workbench의 기본 기능 메뉴 → 사용자가 펼친 페이지만 표시
- 생물 특수 규칙을 감추던 자세히 disclosure
- Related의 자동 굴림과 ‘다음 참조’ 표현
- 좁은 목록 안의 제목·설명·출처 가로 병렬 배치
- 이전 serif/blackletter 기본 서체 조합

저장된 사용자 데이터를 삭제하거나 저장 스키마를 새로 만들지 않았습니다. 기존 기록용 관리 화면과 내부 호환 상태는 유지했습니다.

### 10. 의도적으로 유지한 요소

Registry 생성기, 원본 데이터, 출처 근거와 경고, roll engine, manual roll lookup, Related 연결 체계, copy serializer, Pins/Recent 저장 형식, migration/import 검증을 재작성하지 않았습니다. 기존 독립 주사위 계산기를 Morale의 고정 2d6 버튼에도 재사용했습니다.

주사위 그림은 사용자가 제공한 다면체 예시를 따른 기존 SVG를 유지했습니다. d12 선택 후 `2d12+3 = 10 · [3,4]`를 실제 UI에서 확인했고 개수·보정·굴리기의 위쪽 좌표와 높이(40px)가 동일했습니다.

폰트는 로컬 **Barlow Condensed Black 900**으로 영문 제목을 교체했습니다. 한글 제목은 Pretendard의 굵은 weight를 사용하고, 본문·표도 더 굵게 조정했습니다. 외부 폰트 요청을 추가하지 않았습니다.

### 11. Desktop / Mobile

실제 브라우저 viewport 검사와 screenshot/DOM 측정입니다. 15px 차이는 스크롤바이며 모든 크기에서 `scrollWidth = clientWidth`였습니다.

| viewport | 사용 가능한 폭 | 배치 / 본문 폭 | 현재 참조 시작 |
| --- | ---: | --- | ---: |
| 360 | 345px | 한 열 / 313px | 331px |
| 768 | 753px | 한 열 / 721px | 322px |
| 1440 | 1425px | 탐색 280 / 본문 760 / 옆 페이지 289px | 111px |
| 3440 | 3425px | 탐색 340 / 본문 1698 / 옆 페이지 1257px | 117px |

1440/3440에서는 네 개의 펼친 페이지도 함께 검사했습니다. 3440에서는 옆 페이지가 두 열로 배치되며, 예전 780px 모달 주변으로 빈 공간만 늘어나는 형태가 아닙니다. 360/768은 검색·빠른 복귀·본문의 한 열입니다. 표가 길면 세로 스크롤은 필요합니다.

### 12. 실제 UI 플레이 시뮬레이션

18:38:45–18:58:34 KST, **19분 49초의 반복 수용 검사 구간**을 기록했습니다. UI 사용 사이에는 노트·검사·발견한 문제의 교정이 포함됐으며, 실제 사람의 처리 시간을 재는 사용성 연구는 아닙니다. 아래 7단계 이후에도 다른 참조, 검색, 고정, Source, Workbench, 주사위를 계속 사용했습니다.

| 단계 | 다음 참조로 이동한 방법 | 실제 확인 |
| --- | --- | --- |
| Reaction | 처음 펼쳐진 표에서 Roll | 2d6 결과와 표, 선택 행 |
| Morale | Reaction의 Related 1회 | 규칙을 읽고 2d6 독립 굴림 |
| Weather | `날씨` 검색 → 제목 | d12 표와 결과 |
| Corpse | 긴 한국어 별칭 → 제목 | d66 표와 결과 |
| Creature | `creature` → Hungry Zombie | 고정 능력치·특수 능력 |
| Travel | `travel` → SD Travel Day | 규칙·구성 표·공식 |
| 무관한 표 | `alchemy` → Alchemy Tables | d4 표와 결과, 360px |

전 단계에서 **필수 홈 복귀 0 / 모드 전환 0 / progression 0 / session 시작 0 / save 0**이었습니다. 생물 고정 능력치와 여행 규칙은 굴림을 요구하지 않습니다. 마지막으로 데스크톱 새로고침 → 포커스된 검색창 → `react` → Enter → Roll → Reroll도 검증했습니다.

### 13. Regression / Data integrity

| 항목 | 전 | 후 |
| --- | ---: | ---: |
| Reference | 1029 | 1029 |
| Table | 574 | 574 |
| 원본 procedure | 59 | 59 |
| Registry procedure | 69 | 69 |
| 원본 creature preset 레코드 | 89 | 89 |
| Registry creature | 95 | 95 |
| 원본 Book | 6 | 6 |
| Registry Book | 9 | 9 |

전체 Reference ID / Table ID 목록, 종류별·Context별 수가 일치합니다. `public/rules/oracles.json`과 기존 private fixture의 SHA-256도 전후 동일합니다. 차이가 있는 두 종류의 Book/Creature 수는 서로 다른 데이터 층의 집계이며 이번 작업으로 늘어난 것이 아닙니다.

Core Miseries는 d66, 36개 행, Core 출처를 그대로 사용합니다. 동물 흔적·망가진 길 판정은 어떤 여행 단계도 준비하지 않고 즉시 실행했습니다.

### 14. Test 결과

| 검사 | 결과 |
| --- | --- |
| 전체 automated tests | **739 passed / 0 failed / 0 skipped** |
| 이번에 추가한 테스트 | **8 passed**, 위 739에 포함 |
| 검색·출처·기존 별칭 집중 회귀 | **90 passed / 0 failed**, 전체와 중복되는 부분집합 |
| migration/import를 명시한 기존 테스트 | **50 passed**, 위 739에 포함 |
| Browser sequence | **7/7 단계 직접 수행** |
| Responsive browser acceptance | **4/4 viewport**, 가로 overflow 없음 |
| Context filters | **7/7**, 현재 참조 유지 |
| lint | **PASS, 오류 0** |
| Production build | **PASS**, client/server TypeScript 및 Vite |
| Public build privacy | **PASS, static files 60개 검사** |
| ID/원본 데이터 해시 | **일치** |

초기 전체 검사에서 새 검사식이 CSS의 `disabled:` 문자열을 HTML 비활성화 속성으로 오인했습니다. 이를 수정했습니다. 부분 검색 보완 후에는 기존 상황·지역 검색 순위의 회귀 4건도 발견하여 고쳤고, 위 숫자는 수정 후 재실행한 결과입니다. 테스트 기대값을 새 오류에 맞춰 바꾸지 않았습니다.

브라우저 오류 로그에는 수용 검사 시작 전 편집 중 HMR 오류 5개가 남아 있습니다. 검사 구간 이후의 새로운 브라우저 오류는 0개입니다. 별도 Playwright smoke 파일은 새 구조에 맞게 갱신했지만 이 환경에서는 실행하지 않았습니다. 이 보고서의 browser PASS는 CUA를 통한 실제 조작·화면·DOM 확인에 근거합니다.

검사 기록: `outputs/ux-reassessment/browser-acceptance.json`, `registry-before.json`, `registry-after.json`, `data-before.json`, `data-after.json`, `tests-final.txt`, `build-final.txt`.

### 15. 남은 문제와 한계

- 임의의 한국어 긴 문장, 오타·띄어쓰기 변형 모두를 이해하는 검색은 아닙니다. 검증한 별칭과 기존 토큰/출처 메타데이터 범위에서 동작합니다.
- 기존 OCR 표제·설명의 어색한 띄어쓰기와 자료 누락/부분 검증 상태는 그대로 남아 있습니다. 이번에는 원문을 추측해서 채우지 않았습니다.
- 일부 procedure는 registry에 요약과 연결 표만 있어 책의 모든 문단을 대체하지 않습니다. 긴 생성기의 구성 표 전체를 동시에 본문에 펼치는 방식은 사용하지 않고, 공식 목록과 직접 열기를 제공합니다.
- 긴 d66/d100 표와 많은 Workbench 페이지는 스크롤이 필요합니다. 1440px의 옆 페이지는 3440px보다 좁고 주로 한 열로 읽습니다.
- 선택적 기록/원본 자료 관리 화면에는 기존 inspector와 관리 UI가 남아 있습니다. 이번의 주요 경로는 Desk이며, 전체 캠페인 관리 화면까지 같은 정보 구조로 다시 작성하지 않았습니다.
- `ReferenceProvider`와 기존 호환 CSS에는 기록·옛 탐색을 지원하는 코드가 남아 있습니다. 세션/캠페인 스키마를 없애는 변경은 하지 않았습니다.

새 Guided Mode, Session Runner, Procedure Engine, Workflow Engine, Game State Machine, 자동 서사 진행이나 다음 행동 추천 시스템은 추가하지 않았습니다.
