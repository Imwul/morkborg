# Reading Continuity Pass

Baseline: `bcb1cce`. 코드를 수정하기 전에 실제 registry·reading lifecycle과 브라우저의 정보 소실을 감사했다. 변경은 기존 transient reading의 inline child 연속성과 현재 reading의 Copy에 한정했다.

## A. Reading Lifecycle Audit

문제는 Recent 저장 형식에 있었다기보다, 부모와 inline child가 서로 다른 수명의 React state에 있었기 때문에 발생했다.

- **부모 reading:** `ReferenceProvider`의 `ReferenceSession.readings[referenceId]`. 최근 얻은 참조별 결과 20개를 현재 document 안에서 유지한다. `ReferenceReading.oracle.rolls`에 실제 selector, 원본 entry ID, 본문, source metadata가 있다.
- **실물 주사위:** 디지털 결과와 같은 reading map을 사용한다. `rollMethod`와 각 roll의 `rollOrigin`에 입력 방식을 기록하며, 실제 입력값도 기존 reading에 존재한다.
- **선택된 원본 행:** `reading.oracle.rolls[].entryId`에서 파생된다. 별도의 행 저장소는 없다.
- **inline child:** `InlineSourceSubtableBody`의 local `OracleRoll`이었다. 다른 참조를 열어 table이 unmount되면 사라졌다. main page와 Workbench에 같은 표를 펼치면 각각 독립된 child state를 가졌다.
- **child 펼침/입력문자/error:** disclosure DOM 및 local component state다. 펼쳤다는 사실은 결과를 얻었다는 뜻이 아니다.
- **Recent:** localStorage에 최대 10개의 reference ID만 저장한다. selector/row/reading snapshot은 저장하지 않는다. Recent로 부모가 복원된 것은 provider의 별도 transient reading map 덕분이었다.
- **Pin:** localStorage에 최대 30개의 reference ID를 보관하는 책갈피다.
- **Workbench:** 기존 sessionStorage의 tray에 최대 12개 reference ID를 보관한다. 표와 결과를 표시할 때는 동일한 `desk.readings[id]`를 읽는다.
- **Search/Related/FOLLOW-UP/USES/USED BY:** reference identity와 위치를 변경한다. 기존 부모 reading을 지우거나 새 parent roll을 만들지 않는다.
- **LOOKUP:** 정확한 target selector를 기존 target reference의 reading으로 얻는다. 원래 parent의 child로 합성하지 않는다.
- **일반 Rule:** registry의 정의/본문/source에서 표시용 reading을 파생한다. random result가 아니다.
- **브라우저 Back/URL:** `history.state`에는 reference ID, view, query, panel, scroll 위치가 있다. reading 자체는 없다.
- **Dungeon Preparation:** 기존 12-field `ReferenceReading`을 유지한다. generated 10개 슬롯과 manual 2개 슬롯(reason/guard), field별 `OracleRoll`의 의미는 별개다. saved Dungeon/Campaign으로 자동 저장하지 않는다.

전체 코드 경로는 `outputs/reading-continuity/lifecycle-code-audit.md`에 기록했다. 실제 변경 전 브라우저 증거는 `outputs/reading-continuity/lifecycle-before-browser.json`과 `before-parent-child.png`다.

### Before lifecycle matrix

“유지”는 현재 document에서 원래 reference의 latest reading이 기존 20개 한도 안에 남는다는 뜻이다. 히스토리 복원이나 영구 저장을 뜻하지 않는다.

| Transition | Parent | Explicit child | Selected row | 근거/주의 |
|---|---|---|---|---|
| 같은 참조 rerender / Copy | 유지 | 같은 component instance면 유지 | 유지 | 실제 browser Copy에서도 child는 화면에 있었으나 clipboard에는 없었다. |
| contextual link 열기 | 원래 slot에 유지 | source table unmount 시 소실 | 원래 slot에 유지 | source와 target은 독립 reading. |
| Related / USES / USED BY 열기 | 유지 | 소실 | 유지 | 실제 USED BY → Recent에서 재현. |
| Recent 복귀 | latest parent 복원 | 복원되지 않음 | parent에서 복원 | Recent 자체는 ID만 저장. |
| Workbench에서 열기 | latest parent 복원 | 다른 instance의 child는 복원되지 않음 | 복원 | 실제 Search → Workbench 복귀에서 재현. |
| Pin에서 열기 | cache에 있으면 parent 복원 | 복원되지 않음 | parent가 있으면 복원 | 실제 Related → Pin 복귀에서 재현. |
| Search 입력만 변경 | 유지 | 같은 page면 유지 | 유지 | 실제 입력만 했을 때 child 유지. |
| Search로 다른 참조 선택 | 원래 slot에 유지 | table unmount 시 소실 | 원래 slot에 유지 | Search는 자동 Roll이 아니다. |
| 원래 reference 복귀 | latest parent 복원 | 복원되지 않음 | 복원 | 모든 일반 열기는 같은 activate 경로. |
| 다른 parent 결과 | 새 결과로 교체 | clear | 새 행 | 기존 parentContext invalidation. |
| 디지털 parent reroll | 새 결과 | clear | 새 행 | 실제 13 Flooded 결과 확인. 같은 숫자가 나와도 새 obtain. |
| 새 physical parent lookup | 새 결과 | clear | 새 행 및 scroll | 실제 3,5 → 35 Mirrors everywhere 확인. |
| source row 직접 선택 | 해당 선택 reading으로 교체 | 이전 child 없음 | 선택 종류에 따라 파생 | inline parent 자체는 임의 행선택 버튼 대상이 아님. |
| browser reload | 소실 | 소실 | 결과 강조 없음 | 실제 reload에서 parent도 복원되지 않음 확인. |
| 앱/document 종료 후 재실행 | document와 함께 소실 | 소실 | 소실 | Pin/Recent IDs는 남는다. 앱 process 종료는 browser acceptance와 구분한다. |

## B. Reading Identity Decision

기존 **parent `OracleRoll` 객체**를 identity로 사용한다. 새 UUID entity, collection, persistent schema, migration을 만들지 않았다.

Provider에 `WeakMap<OracleRoll, OracleRoll>` 하나를 transient state로 둔다. key는 사용자가 이미 얻은 정확한 parent roll, value는 사용자가 명시적으로 얻은 현재 inline child roll 하나다. main page와 Workbench는 같은 map을 읽는다. child를 바꾸면 기존 value를 교체하고 provider를 갱신한다.

reference ID나 숫자 selector만으로 key를 만들지 않는다. `11 → child 3 → 새 parent 35 → 새 parent 11`은 서로 다른 explicit parent roll이므로 예전 Hypnotic이 되살아나지 않는다. 같은 숫자를 다시 얻어도 새 parent 객체면 새로운 reading이다.

이 접근은 multi-part reading에서 같은 원본 roll 객체가 그대로 유지되는 경우까지 정확히 구분한다. 현재 roll 하나를 조회하므로 registry 전체 scan이나 새로운 adjacency cache는 필요하지 않다.

## C. Continuity Scope

| Boundary | 구현된 의미 |
|---|---|
| Ordinary navigation / Related / Search / contextual target | 같은 parent roll이 provider latest-reading map에 남으면 explicit inline child 유지. |
| Recent | 같은 document의 latest parent에 붙은 child 복원. Recent 저장 payload는 여전히 reference IDs만 포함. |
| Workbench | 같은 provider reading/child를 공유. reference ID tray를 saved-reading collection으로 바꾸지 않음. |
| Pin | bookmark로 reference를 연다. 같은 document에 current cached reading이 있으면 그 reading/child를 볼 수 있지만 Pin에 결과를 저장하지 않음. |
| Reload | 부모와 child 모두 기존 document transient state와 함께 clear. 영구 child persistence를 추가하지 않음. |
| Parent 없는 inline table 탐색 | 기존 local scratch 결과로 동작할 수 있으나 current parent에 자동 부착하거나 Copy에 합성하지 않음. |
| Dungeon Preparation | 기존 per-field behavior와 local child 수명을 유지. 별도 Dungeon 저장 모델과 합치지 않음. |
| 별도 canonical SUBTABLE / scroll / fixed LOOKUP / FOLLOW-UP | 별도 reference reading. parent의 compound child로 자동 합성하지 않음. |

현재 metadata를 다시 탐색한 결과 inline scope는 **3개 표의 5개 parent, child 17행, 깊이 1**이다.

| Parent | Child dice | Child rows | PDF |
|---|---:|---:|---:|
| Status 3–6 | d4 | 4 | 71 |
| Danger 1 | d4 | 2 ranged rows | 72 |
| Sample Rooms 11 | d6 | 6 | 73 |
| Sample Rooms 33 | d4 | 2 ranged rows | 74 |
| Sample Rooms 43 | d4 | 2 ranged rows | 74 |

기존 `inlineSourceSubtable`의 검증된 source metadata adapter를 그대로 사용한다. 새로운 hard-coded table 목록이나 recursive child tree를 추가하지 않았다. 이 child들에는 grandchildren이나 child-level relationship metadata가 없다.

## D. Invalidation Rules

- 새 디지털 parent Roll, 새 physical parent lookup, 다른 parent 선택은 새 parent identity를 만든다. 이전 child는 현재 reading에서 접근되지 않는다.
- 같은 row/selector를 다시 얻어도 새 explicit parent이면 이전 child를 상속하지 않는다.
- child reroll/lookup은 현재 child 한 개를 교체한다. 과거 child를 누적하지 않는다.
- disclosure를 열기만 하면 map에 아무것도 쓰지 않는다.
- table ID와 원본 parent entry ID가 현재 roll과 모두 일치해야 child를 부착한다.
- static table의 **선택되지 않은 sibling row**에서 시험한 child는 current parent에 부착하지 않는다.
- ordinary navigation은 parent 객체를 교체하지 않으므로 child를 잃지 않는다.
- provider/document가 종료되면 WeakMap도 함께 사라진다. 오래된 결과를 위한 별도 history retention을 만들지 않는다.

## E. Digital / Physical Equivalence

디지털 child는 기존 `rollOracle`을 명시적 버튼 동작에서 호출한다. physical child는 기존 `physicalOracleRoll`로 사용자가 입력한 face를 해석한다. 두 경로 모두 얻은 `OracleRoll`을 같은 `retainInlineChild`에 전달한다.

따라서 디지털/physical 어느 방식으로 얻었는지에 따라 navigation continuity나 invalidation은 달라지지 않는다. child restore 시 표의 단일 주사위 selector를 physical field에 표시할 수 있지만, 이것이 새 lookup이나 RNG를 실행하지는 않는다.

실제 브라우저에서는 디지털 parent를 14 → 35 → 16 → 33까지 명시적으로 굴린 뒤, child d4=1 `obscure literature`를 얻었다. 다른 참조를 읽고 Recent로 돌아오면 parent 33과 child 1이 모두 유지됐다. physical 1,1 → parent 11 / child 3 `Hypnotic`도 동일하게 복원됐다. 생산 확률이나 원본 dice를 테스트용으로 바꾸지 않았다. 자동 테스트에서는 제어한 RNG로 parent 두 번·child 한 번의 draw를 확인하고 physical 입력과 동일한 child entry/Copy를 비교했다.

## F. Composed Copy

기존 clipboard grammar를 유지하고, 현재 reading에 실제로 붙은 inline child 본문만 `↳`로 덧붙인다. source IDs, relationship kind, UUID, timestamp, debug metadata, JSON, 과거 child는 포함하지 않는다.

- child 없음 / table만 펼침: 기존 Copy와 동일한 parent-only 문자열.
- child 있음: parent 본문 뒤에 현재 child만 추가.
- child reroll: 새 child만 추가.
- parent 교체: 과거 child가 포함되지 않음.
- Recent 복귀: 같은 current parent/child면 동일 composed Copy.
- COPY WITH SOURCE: 기존 human source citation 규칙 유지.
- 여러 parent block이 있는 reading에서는 해당 parent 제목/본문으로 child가 속한 맥락을 표시한다.

Serialization은 `copyReadingWithInlineChildren`이 실행 순간 파생한 `copyContent`를 기존 formatter에 전달하는 방식이다. 원래 `ReferenceReading`, replay schema, scratch 저장소를 변경하지 않는다. main Copy와 Workbench Copy가 같은 provider state를 사용한다. 별도 replay/recipe/스크랩은 기존 의미를 유지하며 compound history로 확장하지 않는다.

변경 전 실제 parent-only clipboard:

```text
Sample Rooms

Inscriptions, the motifs are
```

변경 후 실제 parent+child clipboard:

```text
Sample Rooms

Inscriptions, the motifs are

↳ Hypnotic
```

실제 clipboard 18개 사례를 `outputs/reading-continuity/clipboard-browser.json`에 기록했다.

| Case | 실제 clipboard 결과 |
|---|---|
| Parent only / 열기만 한 child | `Sample Rooms` + `Inscriptions, the motifs are`; child 없음. |
| Parent + physical child | 위 예시처럼 `↳ Hypnotic`. |
| Recent return | 이전 `↳ Hypnotic`과 정확히 동일. |
| Child digital reroll | `Shelves with` + `↳ rotting food`; 이전 `obscure literature` 없음. |
| Parent 35로 교체 | `Sample Rooms` + `Mirrors everywhere`; Hypnotic 없음. |
| 새로 얻은 parent 11 | 기존 parent-only 문자열; 과거 child 재사용 없음. |
| Workbench Copy | main과 동일한 Hypnotic. |
| Workbench에서 child4 → main Copy | `↳ Childish`만 포함. |
| 선택되지 않은 row33의 local child | current parent11의 Childish만 포함; row33 child 제외. |
| 외부 FOLLOW-UP / LOOKUP | 원래 Stash/Civic parent 본문만; target의 별도 결과 제외. |
| 360 / 768 / 1440 / 3440 Copy | 네 크기 모두 같은 composed Hypnotic 문자열. |

## G. RNG Boundaries

새 continuity/read/copy 함수는 RNG를 호출하지 않는다. restore는 기존 parent 객체와 child value 조회만 한다. physical input은 기존 deterministic face 경로를 사용한다.

검증 근거를 구분한다.

- `tests/reading-continuity.test.ts`에서 `crypto.getRandomValues`를 호출하면 즉시 실패하는 trap을 설치하고, canonical inline lookup·association·Recent restore·Workbench/Pin identity 복원·Copy·fixed LOOKUP·FOLLOW-UP/USED BY resolution·실제 source table rendering의 dice RNG 호출 **0**을 assertion으로 확인했다.
- 기존 `tests/relationship-navigation.test.ts`는 전체 canonical 관계 읽기·navigation 위치 복원·inline 펼침·physical lookup·95개 fixed creature read의 RNG0을 다시 검증한다. Zukuma의 고정 참조도 무작위 공격 선택 없이 읽히며, 명시적인 monster generation의 공격 draw는 유지된다.
- 디지털 parent/child 테스트는 기존 engine에 제어한 RNG를 주입하여 parent **2회**, child **1회**의 실제 draw를 확인했다. physical lookup에는 그 random source가 필요하지 않다.
- **실제 브라우저에는 RNG counter를 주입하지 않았다.** 브라우저 증거는 링크/복귀/펼침 시 자동 결과가 생성되지 않고 reading이 유지되는지에 관한 것이다. 호출 수 0의 근거는 자동 RNG trap 테스트이며, 브라우저 호출 횟수를 직접 계측했다고 보고하지 않는다.

reference open, Related, FOLLOW-UP, SUBTABLE disclosure, LOOKUP, USES, USED BY, Recent, Workbench, Pin, Copy 및 parent/child restore에는 새 random draw 경로를 추가하지 않았다. 명시적 디지털 Roll과 generator 동작만 기존 규칙대로 결과를 얻는다.

## H. Browser Acceptance

자동 테스트와 실제 브라우저 검증을 구분한다. Baseline 브라우저에서 10개 transition/state를 관찰했으며, `11 Inscriptions / child 3 Hypnotic`이 USED BY → Recent, Related → Pin, Search → Workbench 경계에서 사라지는 현상을 확인했다.

수정 후 실제 브라우저 기록은 `outputs/reading-continuity/lifecycle-after-browser.json`이다. 최종 **18개 flow 기록과 clipboard 18개 실제 출력**이 있다. 반응형 24개 상태 캡처는 I에서 별도로 보고하며, 자동 테스트를 browser flow 수에 포함하지 않았다.

| Flow | 실제 입력/결과 | 확인 결과 |
|---|---|---|
| Physical continuity / USED BY → Recent | Sample Rooms 1,1 → 11; child3 → Hypnotic | 부모11·child3·원본행 강조 복원. |
| Digital continuity | 명시적 parent 14 → 35 → 16 → 33; child d4=1 obscure literature | 다른 참조 → Recent 복귀 후 parent33과 child1 동일. |
| Child digital reroll | parent33 child1 → child3 rotting food | parent33 유지; 출력/Copy에 현재 rotting food만 존재. |
| Open without obtaining | parent11의 child table을 펼치기만 한 뒤 navigation → Recent | child result 없음, disclosure 닫힘, Copy parent-only. |
| Parent invalidation | parent11/Hypnotic → physical3,5 → 35 Mirrors everywhere | child/disclosure clear; Copy에 Hypnotic 없음. |
| Same-selector replacement | 새 physical1,1 → 11 | 과거11의 child를 재사용하지 않음. |
| Workbench → main shared result | main child3 → Workbench에서 child4 Childish | main 출력과 Copy가 Childish로 즉시 갱신. |
| Workbench return | 다른 reference 후 Workbench에서 Sample Rooms 열기 | parent11/Childish 유지. |
| Pin open | 다른 reference 후 Pin의 Sample Rooms 열기 | 같은 cached parent11/Childish 표시; Pin 저장 내용은 ID만 유지. |
| Sibling context isolation | 선택 parent11/Childish에서 row33의 child d4=1을 별도로 시험 | row33 local output은 표시되지만 current Copy에는 Childish만 포함. |
| Dungeon Preparation generated fields | name d12=1 / d12=6 → The Slaughter grave; 다른 reference 후 복귀 | generated name 유지. |
| Contextual FOLLOW-UP → target Roll → Recent | Stash Item—Weak Hit5 → NPC pair; target d66=15 / d66=62 | target 열기 직후 결과 없음; 명시 Roll 후 Malign/Sociopathic / Executioner. Recent Stash5는 원래 결과 그대로, target 결과는 parent Copy에 합성되지 않음. |
| FOLLOW-UP context replacement | Stash Weak Hit5 → physical1 | NPC contextual link 제거; 새로운 parent1만 유지. |
| Fixed LOOKUP → Recent | Civic Buildings2 Library → NPC Encounters #54 | 정확한 Guards54 선택. Recent 복귀 시 Library2 그대로; NPC target 결과는 parent Copy에 합성되지 않음. |
| Reload boundary | parent11/Hypnotic을 얻고 reload | parent result·child·selected row 모두 clear. 테스트 Pin1개/Workbench1개는 reference ID로 남음. |
| Mixed flow | Search → physical1,1 → child3 → USED BY → USES → Recent → Copy → Workbench | parent11/Hypnotic 복원 및 composed Copy 일치. stale child/홈 복귀/session 시작/save/mode 요구 없음. |
| Dungeon Preparation manual field | textarea에 `연속성 확인` 입력 → 다른 reference → 복귀 | 실제 DOM `textarea.value`가 전후 정확히 동일. 확인 후 테스트 문구 제거. |
| Fixed Zukuma read | Zukuma · Berserker를 단순히 열기 | 원본 공격4개를 모두 표시; 무작위로 선택된 attack result 없음. 실제 dice RNG0 증명은 G의 자동 trap과 구분. |

이 표의 실제 브라우저 흐름에서는 자동 Roll, session 시작, progression gate, required save를 요구하지 않았다. 브라우저 RNG 호출 수를 계측한 것은 아니며, G의 자동 trap 근거와 구분한다. 테스트 Sample Rooms Pin과 Workbench 항목은 검증 후 제거했고 기존 Pin3개를 복원했다. 앱 process 자체를 종료·재실행하지는 않았다. 그 경계에서 transient state가 소실된다는 설명은 provider/document teardown 코드로부터의 판단이며 browser reload 실측과 구분한다.

## I. Responsive Acceptance

실제 네 viewport에서 각각 **6개 상태**, 총 **24개 screenshot/DOM 측정**을 남겼다: parent only, parent+child, child가 화면 안에 들어온 상태, Copy control, parent+child의 Related, 긴 번역·contextual link를 가진 Civic Buildings2. 최종 evidence는 `outputs/reading-continuity/responsive-browser.json`이다.

| Viewport | Document client width | Reference/Related 측정 폭 | Child output 높이 | Child input과 결과 간 간격 | 최대 document horizontal overflow |
|---|---:|---:|---:|---:|---:|
| 360 × 800 | 345px | 305px | 24px | 130px | **0px** |
| 768 × 1024 | 753px | 713px | 24px | 18px | **0px** |
| 1440 × 1000 | 1,425px | 1,049px | 28px | 18px | **0px** |
| 3440 × 1440 | 3,425px | Related 694.55px; title 1,365.41px | 38px | 19px | **0px** |

Client width는 scrollbar를 제외한 값이다. input 간격은 child-visible screenshot의 `output.top − input.bottom`을 측정했다. 넓은 화면의 title 폭은 본문 전체 폭을 뜻하지 않는다.

- 실제 child-visible 화면 네 개를 시각적으로 확인했다. parent 원본행 아래 child dice/result가 구분되고 input과 겹치지 않았다.
- 기존 Related의 `USED BY · Dungeon Preparation`과 source 표시는 유지했다. 관련 목록을 추가하지 않았으며 Sample Rooms Related 높이는 360/768/1440/3440 순서로 약 210/185/117/269px다.
- 네 viewport에서 Civic Buildings2의 긴 번역, 긴 FOLLOW-UP 제목, fixed LOOKUP screenshot을 시각적으로 확인했다. label/title 충돌과 가로 overflow는 없다. 24개 측정 상태 모두 child/input rectangle overlap은 0이다.
- 360/768/1440에서는 긴 원본표와 Related가 한 화면에 동시에 들어오지 않아 각각 스크롤한 상태를 캡처했다. 이것을 동시 가시성으로 과장하지 않는다. 3440에서는 child와 Related를 함께 확인할 수 있다.
- child input/result/relationship을 모바일에서 숨기지 않았다. 현재 typography/color/layout/navigation은 그대로다.

대표 screenshots:

- `outputs/reading-continuity/parent-child-visible-360.png`
- `outputs/reading-continuity/parent-child-visible-768.png`
- `outputs/reading-continuity/parent-child-visible-1440.png`
- `outputs/reading-continuity/parent-child-visible-3440.png`
- `outputs/reading-continuity/long-translated-contextual-360.png`

canonical inline child 자체에는 contextual relationship이 **0개**다. 따라서 존재하지 않는 child link를 만들지 않았고, parent의 실제 Related USED BY와 별도 Civic2의 실제 FOLLOW-UP/LOOKUP으로 검증했다.

## J. Integrity

`integrity-baseline.json`과 `integrity-after.json`을 실제 fixture → parser/store → registry 경로에서 다시 생성한 후 **deep equality**를 확인했다.

| Metric | Before | After |
|---|---:|---:|
| References | 1,001 | 1,001 |
| Tables | 546 | 546 |
| Rollable tables | 518 | 518 |
| Original rows | 12,310 | 12,310 |
| Creature references | 95 | 95 |
| Books | 9 | 9 |

Private canonical bundle의 Before/After SHA-256은 동일하다.

```text
edb000ad6a23ee13ccdb221732e770977cc6f375aca03621c8f0328441ba60c9
```

Core Miseries 36행 / 36 selector, 랜덤 결과 7:7 미포함, 별도 7:7 footer 본문과 PDF20도 동일하다. canonical fixture, 원본 IDs/rows/ranges/weights, source provenance/PDF content, scenario exclusion, book IDs를 변경하지 않았다.

새 reading field를 JSON에 추가하지 않았다. saved Dungeon/Campaign 데이터, reference preferences, Workbench tray, import/migration schema는 변경하지 않았다. 신규 regression은 parent JSON이 child obtain/Copy 전후 byte-for-byte 동일하고, 기존 저장소에 reference IDs만 기록되는지 확인한다.

## K. Regression

| Relationship metric | Before | After |
|---|---:|---:|
| Stored registry Related | 3,103 | 3,103 |
| Visible default Related | 2,127 | 2,127 |
| Verified forward procedure pairs | 79 | 79 |
| Deterministic reverse pairs | 79 | 79 |
| Contextual UI edges | 247 | 247 |
| Contextual rows | 200 | 200 |
| Contextual tables / references | 43 / 43 | 43 / 43 |
| Fixed selector LOOKUP | 9 | 9 |
| Visible self links | 0 | 0 |

FOLLOW-UP/SUBTABLE/LOOKUP/USES/USED BY normalization, row context, alias dedup, self suppression, source grounding은 그대로다. 값이 감소하거나 새 관계가 추가된 항목은 없다.

- 고정 search probe **33/33** 유지. query와 expected target을 바꾸지 않았고 search corpus/index에 child content를 추가하지 않았다.
- **518개 rollable table / 12,518 physical input combinations** 유지. d2/d4/d6/d8/d10/d12/d20/d100, d66, 2d6 개별 face, d4×d6/d4×d8/d6×d8 coordinate와 range semantics를 기존 전체 regression으로 확인했다.
- fixed creature **95개** read RNG0과 Zukuma explicit generation randomness 회귀 통과.
- 기존 Source import/migration, Pin/Recent/Workbench persistence, Dungeon Preparation의 generated/manual 12-field regression 모두 전체 suite에 포함하여 통과했다.

## L. Tests / Lint / Build

| Check | 실제 결과 |
|---|---|
| Before automated tests | **837 / 837 PASS** |
| After automated tests | **862 / 862 PASS** |
| Newly added tests | **25개**, 새 파일 1개 `tests/reading-continuity.test.ts` |
| Modified existing test files | **0개** |
| Failed | **0** |
| Skipped / cancelled | **0 / 0** |
| Lint | PASS, exit 0 |
| Production build | PASS, exit 0 |
| Privacy/static-file check | PASS, **74 files** |
| git diff --check | PASS, exit 0 |
| Canonical comparison | Before/After integrity JSON deep equality |

Baseline 실행 시간은 11,714.7ms, final은 13,088.7ms다. 로그는 `/tmp/mork-continuity-baseline.log`, `/tmp/mork-continuity-final-tests.log`, `/tmp/mork-continuity-lint.log`, `/tmp/mork-continuity-build.log`이며 재현 가능한 요약은 `outputs/reading-continuity/verification.json`에 있다.

새 25개 regression은 실제 canonical inline 부모 5개, digital/physical equivalence, parent replacement/same-selector replacement, child reroll, open-only, sibling/source isolation, navigation/Recent identity, Workbench/Pin persisted ID-only 의미, cache eviction/reload boundary, Copy variants/source/immutability, fixed lookup/FOLLOW-UP 및 실제 React table rendering을 포함한다. 기존 테스트 삭제나 assertion 약화는 없다.

## M. Remaining Limitations

1. **Reload 이후 reading은 복원하지 않는다.** 기존처럼 부모와 child 모두 document transient state다. Pin/Recent/tray의 ID 보존을 결과 영구 저장으로 오인하지 않는다.
2. **Latest reading only.** 같은 reference의 과거 11과 과거 33을 별도 saved reading으로 탐색하는 기능을 만들지 않는다. 현재 reading cache의 기존 20개 한도도 유지한다.
3. **Pin/Workbench는 reference identity.** 같은 document의 결과를 보여주지만 saved roll collection이 아니다.
4. **Inline 한 단계만 지원한다.** 실제 source에 grandchildren이 없으므로 recursive tree를 설계하지 않는다.
5. **외부 target은 자동 compound child가 아니다.** Feretory campsite 별도 subtable, RECLVSE subtableId, scroll table, fixed LOOKUP, FOLLOW-UP에서 얻은 결과는 각각 독립 reading이다.
6. **Dungeon Preparation은 분리한다.** 기존 generated/manual field behavior와 그 안의 local inline state를 generic continuity 저장 시스템으로 합치지 않는다.
7. **펼침 상태 자체는 결과가 아니다.** 단순히 열어본 disclosure는 돌아올 때 닫힐 수 있다. 실제 얻은 child가 있을 때만 복원한다.
8. **일반적인 Copy 확장만 수행한다.** 별도 replay/recipe/스크랩 기록 형식, timeline, history export, 자동 logging을 추가하지 않는다.
