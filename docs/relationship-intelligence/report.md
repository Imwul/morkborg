# Relationship Intelligence Pass

기준: `641f635`. 실제 private fixture를 parser/store → OracleRegistry → ReferenceRegistry 경로로 읽어 감사했다. 원문·표·등록 참조를 추가하지 않았다. 이 문서의 관계 수는 **원문 metadata occurrence**, **정규화한 source→target pair**, **화면에 표시되는 링크**를 구분한다. 같은 관계가 여러 metadata에 표현되므로 각 표의 수치를 무조건 합산하면 안 된다.

## A. Registry Relationship Audit

현재 1,001 Reference / 546 table / 12,310 원본 row / 58 OracleProcedure / 69 procedure-kind reference / 9 book을 확인했다. 기존 Related는 생성 시점에 ID를 canonical target으로 정규화하며 누락·self target을 걸러낸다.

| 범위 | Raw | 중복 제거 / resolve | 비고 |
| --- | ---: | ---: | --- |
| registry `relatedIds` | 3,103 | 3,103 | Source provenance, book/region, 기존 편의 연결 포함; 전부 source dependency라고 인증하지 않음 |
| 화면 Related, 참조당 기존 상한 8 | 2,047 | 2,047 | 결과 행을 선택하지 않은 기본 화면 기준 |
| 정적 `SEMANTIC_RELATED` | 60 | 18개 reference에서 사용 | 기존 편의 연결; 새 source label을 붙이지 않음 |
| 지역별 semantic fallback | 45 | 9개 reference × 5 | 그대로 일반 Related |
| `OracleProcedure.oracleIds` | 126 | 71 source→target | 58개 절차; alias occurrence 7; dangling/self 0 |
| `OracleProcedure.generatorSteps[].tableId` | 128 | 대부분 위 의존성 반복 | Street의 선택적 exits 1개가 `oracleIds`에 없었음 |
| Dungeon Preparation `tableIds` | 11 | 8 target | Core 10회→7 target; RECLVSE entrance 1개는 앱 선택 |
| reference `parentId` | 5 | 5 | 기존 AITC city procedure 부모 연결 |
| table `parentTableId` | 1 | 1 | Feretory campsite → campDream의 canonical materialization |

새 read layer에서 인정한 procedure evidence는 137회이다: 기존 `oracleIds` 126회 + Street exits 1회 + Core preparation field 10회. 79개의 distinct forward edge로 합쳐진다. 전부 실제 target으로 resolve되며, alias를 거친 occurrence는 7회다.

기존 registry `relatedIds`만 보면 book-only reference는 509개지만, 기존 semantic Related를 포함한 **실제 기본 화면**에서는 499개다. 화면 Related가 빈 참조는 `rule:reclvse.ask-oracle`, `rule:heretic.blackpowder`, `group:reclvse` 3개다. 이들은 별도 기존 reference-group 표면을 가질 수 있으며, 빈 Related가 곧 콘텐츠 부재를 뜻하지 않는다.

### Row representation inventory

아래 `노출 전`은 **metadata occurrence가 원본 row의 contextual 기능 또는 기존 definition projection으로 접근 가능했는지**를 센다. 동일 canonical target 버튼 수가 아니다. `followup` 5개는 ID edge가 아닌 원본 inline table로 별도 집계한다. 상세 after 수치는 최종 row audit에 연결한다.

| 형식 | Reference / Table / Row | Raw | Resolve | Alias | Self | 기존 contextual occurrence / projection |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `followup` | 3 / 3 / 5 | 5 | 0 | 0 | 0 | 5 / 0 |
| `scrollTable` | 2 / 2 / 2 | 2 | 2 | 0 | 0 | 2 / 0 |
| `subtable` | 1 / 1 / 1 | 1 | 1 | 0 | 0 | 1 / 0 |
| `subtableId` | 2 / 2 / 8 | 8 | 8 | 0 | 0 | 8 / 0 |
| `nestedRolls.table` | 1 / 1 / 1 | 1 | 1 | 0 | 1 | 0 / 0 |
| `followUp.choices.procedure` | 1 / 1 / 1 | 1 | 1 | 0 | 0 | 0 / 0 |
| `followUp.procedure` | 3 / 3 / 9 | 9 | 9 | 0 | 0 | 0 / 0 |
| `followUp.tables` | 1 / 1 / 1 | 2 | 2 | 0 | 0 | 2 / 0 |
| `followUp.table` | 5 / 5 / 5 | 5 | 5 | 0 | 1 | 5 / 0 |
| `followUpReferenceIds` | 3 / 3 / 20 | 20 | 20 | 0 | 0 | 20 / 0 |
| `followUpOracleIds` | 20 / 20 / 101 | 165 | 165 | 33 | 0 | 165 / 0 |
| `fixedLookups` | 2 / 2 / 5 | 5 | 5 | 0 | 0 | 5 / 0 |
| `fixedEntry` | 1 / 1 / 2 | 2 | 2 | 0 | 0 | 0 / 0 |
| `procedureId` | 2 / 2 / 4 | 4 | 4 | 0 | 0 | 0 / 0 |
| `fixedEntries` | 1 / 1 / 1 | 2 | 2 | 0 | 0 | 0 / 0 |
| `relatedIds` | 5 / 5 / 53 | 131 | 131 | 1 | 0 | 0 / 131 |
| `referenceId` | 5 / 5 / 55 | 55 | 55 | 0 | 0 | 55 / 0 |
| `creatureId` | 9 / 9 / 54 | 54 | 54 | 0 | 0 | 0 / 0 |

총 raw metadata occurrence **472**, registry-resolved **467**, 원본 row + canonical target + 고정 selector 기준 distinct **441**, 중복 표현 **26**, inline view **5**, alias occurrence **34**, dangling target **0**, self **2**다. ID가 아닌 prose/external 지시 **44건**은 별도로 기록하고 새 target을 추정하지 않는다. `referenceId` 55개와 `relatedIds` 131개는 이미 definition으로 projection되어 있으므로 신규 row link로 중복 추가하지 않는다. `procedureId` 4개 중 2개 역시 기존 referenceId projection과 동일하다.

별도 REFERENCE_GENERATOR_PROCEDURES에는 20개의 table-bearing step이 있다. `feretory.road`의 5개 step은 target 표가 모두 존재하지만 동일 ID의 registry procedure가 없다. 따라서 이것은 **dangling table이 아니라 parent binding이 없는 source procedure**다. 이름으로 Travel/Road 참조를 추정해 연결하지 않았다. Oracle parent를 가진 artefact/forage/campsite의 조건부 step 또한 global Related로 승격하지 않았다.

## B. Existing Relationship Problems

1. Sample Rooms는 기존 Related에서 Core 책만 보였다. SD가 허용한 Core preparation 방식의 실제 소비자 `procedure:sd.dungeon-preparation`는 역방향으로 노출되지 않았다.
2. 58개 source procedure의 정확한 table dependency는 존재했지만, 표에서 절차로 돌아가는 검증된 역방향 경로가 없었다. 79개 forward 관계의 deterministic inverse를 기존 Related에 표시했다.
3. AITC Street의 exits는 원문 generator step에 있지만 `oracleIds`에는 없었다. 해당 선택적 필드만 근거 경로를 보존해 추가 노출했다.
4. `followUp.procedure`, `followUp.choices.procedure`, AITC `procedureId`, 정확한 EPK `creatureId`는 기존 metadata에 있었으나 해당 결과의 직접 링크로 읽히지 않았다.
5. `fixedEntry` / `fixedEntries`가 가리키는 원본의 고정 selector가 사라지고 일반 table 링크만 남는 경우가 있었다. 단일 target이 명시된 경우에만 정확한 selector를 보존해 LOOKUP으로 표시한다.
6. 선택된 reading의 `relatedIds`가 별도 global Related에 합쳐져 row 관계가 table 전체의 연결처럼 보였다. 이를 제거하고, 원본 row와 현재 결과의 contextual 영역에 유지했다.
7. alias → canonical target 중복과 self relationship은 표시 단계에서 제거한다. 같은 paired reference 안의 서로 다른 **원본 표 + 고정 selector**는 서로 다른 lookup이므로 합치지 않는다.

8. 회귀 검사에서 Zukuma 고정 creature reference를 열기만 해도 내부 attackTable이 무작위 무기 하나를 선택하는 경로를 발견했다. 고정 참조를 읽을 때만 원문의 네 선택지를 그대로 표시하게 했고, 기존 monster generator의 명시적 굴림 동작은 유지했다.

## C. Decisions

- 원문 ID를 가진 숨은 row 관계를 현재 결과와 원본 행에서 열도록 복원했다. 결과의 링크를 global Related에 올리지 않는다.
- 명시적 procedure forward edge 79개에서만 USED BY를 만든다. SOURCE_PROCEDURE나 검증된 Core preparation field가 아닌 관계에는 새 label을 부여하지 않는다.
- 원문 고정 selector, paired alias, self/duplicate suppression을 같은 read layer에서 처리한다. inline child는 부모 결과가 변경되면 초기화한다.
- Rare Monster / City의 기존 비오라클 reading shortcut은 결과 옆에 **label 없이** 유지한다. row metadata가 아닌 기존 앱 연결을 실수로 삭제하거나 원문 FOLLOW-UP으로 인증하지 않는다.
- 숨은 RNG 사용이 확인된 Zukuma 고정 참조만 읽기 경로를 분리했다. 명시적인 몬스터 생성에서는 기존 d4 선택을 유지한다.
- 원문 주석의 `nowrap`이 360px에서 표를 700px까지 확장하는 문제를 실제 브라우저에서 발견했다. 주석과 관계 제목의 줄바꿈만 수정했다. 색·폰트·내비게이션은 그대로다.
- composed Copy, Korean search corpus 확대, DNGNGEN native pool은 구현하지 않았다.

## D. Relationship Normalization

`rowRelationships.ts`는 현재 row metadata만 읽는다. `referenceRelationships.ts`는 registry가 바뀔 때 한 번 만드는 adjacency index다. 어느 쪽도 fixture, import, migration, reading 저장 형식을 바꾸지 않는다.

Global source proof로 인정하는 입력은 `SOURCE_PROCEDURE`의 정확한 `oracleIds`, 검증된 Street exits step, SD가 허용한 Core preparation field다. `canonicalIds`는 원문 소속이나 projection을 뜻할 수도 있으므로 blanket dependency로 취급하지 않는다. 기존 semantic shortcuts, 비슷한 제목, 같은 책, keyword overlap로 edge를 만들거나 source label을 붙이지 않는다.

Procedure read layer는 각 edge에 origin path, sourceRefs, alias IDs를 남긴다. 반복된 네 개 Special Room field는 하나의 Sample Rooms 링크로 보이지만 네 origin이 유지된다. Global UI는 exact USES/USED BY를 먼저 보여주고, 기존 generic Related를 canonical target별로 병합한다. 상한 8개는 유지한다.

성능: 전체 scan은 immutable registry identity가 바뀔 때만 수행하며 WeakMap cache도 제공한다. 참조를 읽을 때는 한 adjacency list와 기존 bounded Related 배열만 조회한다. 감사 실행에서 50회 index 생성 중앙값 **0.147ms**, 평균 **0.167ms**; 100,100회 adjacency query 총 **46.80ms**였다. 이 값은 로컬 Node domain 측정이며 브라우저 렌더링 시간이라고 주장하지 않는다. 전체 registry를 읽으면 실패하도록 한 테스트로 render-time 전역 scan도 방지한다.

## E. Visible Relationship Semantics

| 표시 | 근거 / 의미 |
| --- | --- |
| FOLLOW-UP | 선택된 원본 row가 직접 명시한 table/reference/procedure ID |
| SUBTABLE | 원본 row의 명시적 subtable/scroll table; Core inline table은 기존 “조건부 추가 표” 제목 유지 |
| LOOKUP | 원본이 target과 고정 selector를 함께 지정한 조회 |
| USES | 검증된 procedure가 명시적으로 사용하는 canonical reference |
| USED BY | 위 USES edge의 결정적인 역방향 |

기존 generic Related와 creature identity 링크는 관계 종류를 과장하는 label을 붙이지 않는다. RECLVSE entrance는 SD 원문 dependency가 아니라 앱 선택이므로 기존 일반 연결만 유지한다. 어떤 label도 다음 행동을 추천하거나 실행하지 않는다.

## F. Before / After Coverage

서로 다른 집계 범위를 명시해 비교한다. Raw 원문 metadata와 저장된 registry edge 수는 바뀌지 않았다.

| Metric | Before | After |
| --- | ---: | ---: |
| 저장된 registry Related edge | 3,103 | 3,103 |
| 기본 화면 visible Related edge (상한 8) | 2,047 | 2,127 |
| non-book/non-region Related가 있는 reference | 469 | 541 |
| book-only Related reference | 499 | 427 |
| 검증된 forward procedure pair | 79 존재 / label 0 | 79 USES |
| deterministic reverse procedure edge 표시 | 0 | 79 USED BY |
| exact global relationship label을 가진 reference | 0 | 131 |
| procedure evidence의 alias occurrence | 7 | 7 |
| procedure evidence dangling / self | 0 / 0 | 0 / 0 |
| 기본 Related visible duplicate target | 0 | 0 |

| Row-level metric | Before | After |
| --- | ---: | ---: |
| 원문 metadata raw / resolved / distinct | 472 / 467 / 441 | 472 / 467 / 441 |
| Contextual UI edge (fixed lookup 포함, inline 제외) | 185 | 247 |
| Contextual link가 있는 row | 137 | 200 |
| Contextual link가 있는 table / reference | 33 / 33 | 43 / 43 |
| 고정 selector LOOKUP | 5 | 9 |
| Core inline subtable view | 5 | 5 |
| 원문 alias occurrence (전체 metadata) | 34 | 34 |
| 원문 dangling / self | 0 / 2 | 0 / 2 |
| 표시되는 self link | 1 | 0 |

새 row reader는 201행 / 44표의 raw occurrence 278개를 읽는다. 이 범위의 alias 33개 중 paired 중복 23개를 canonical target으로 합치고, self 1개와 같은 목적지의 redundant generic-open 7개를 제거해 247개 contextual action을 표시한다. 두 fixed lookup이 같은 paired reference에 도착해도 원래 표나 selector가 다르면 의미가 다르므로 보존한다. 원문의 두 self 지시 중 Quick Contents nested reroll은 원래부터 링크로 표시하지 않았으며 계속 원문 instruction으로 남는다.

79개 forward pair 중 71개는 기존 canonical procedure dependency, 7개는 기존 Core preparation field, 1개는 Street의 기존 optional exits다. 새 gameplay 관계를 창작한 수가 아니다. Contextual self 링크 제거와 고정 lookup이 일반 링크를 대체한 경우에는 표시 수가 감소하는 것이 정상이다.

## G. Concrete Source-Grounded Examples / Related Quality Samples

| 실제 reference / row | Before 및 source evidence | After / 범위 |
| --- | --- | --- |
| Reaction (`core.reaction`) | Morale, NPC, Failed Morale, Core 책의 기존 semantic Related | 그대로 일반 Related. source-proof가 없는 FOLLOW-UP label을 붙이지 않음 |
| Morale (`rule:core.reaction-morale`) | Flee / Reaction / Failed Morale / Violence / Core 책. Seed `oracles` 2개도 있음 | 기존 링크 유지. canonicalIds만 보고 역방향 procedure를 만들지 않음 |
| Corpse (`core.corpsePlundering`) | Useful Items / Treasures / Core 책의 편의 연결 | 그대로 유지; 시체 결과마다 같은 후속 표를 추론하지 않음 |
| Weather (`core.weather`) | Core 책만 표시 | 그대로 book-only. 이름이 비슷한 별도 `feretory.road` procedure를 임의로 매핑하지 않음 |
| Road (`feretory.roadType`) | Feretory 책만 표시 | source parent binding이 없어 새로운 USED BY를 추론하지 않음 |
| Travel (`rule:sd.travel-day`) | Weather, Road, Events, Leaving Road, Campsite 등 8개 기존 연결 | 기존 개방형 참조 목록 유지; 추천이나 진행 단계로 바꾸지 않음 |
| Creature Antideer | Reaction / Morale / Corpse / Treasures / 책·지역 연결 | 기존 일반 Related 유지. EPK hunting row의 정확한 creatureId에서 해당 creature로 직접 열 수 있음 |
| Dungeon Preparation | Core 표 7개, RECLVSE 입구 등 기존 필드. SD PDF9/19, printed7/17 | Core 7개 USES. RECLVSE 입구는 일반 참조이며 새로운 source reverse 없음 |
| Sample Rooms (`core.rooms`) | Core 책만 표시. 준비 field special1–4가 이 표를 명시적으로 사용 | USED BY · Dungeon Preparation 1개, 네 field origin 보존 |
| Core Status 3–6 / Sample Rooms 11 | 원본 `followup` array. Core PDF71 / PDF73 | 해당 row의 기존 조건부 추가 표. global table dependency로 승격하지 않음 |
| AITC Stash weak-hit 5–6 | disposition/profession 두 ID가 하나의 paired reference로 resolve | FOLLOW-UP 버튼 하나. 다른 row를 고르면 해당 row의 링크만 남음 |
| AITC Civic Buildings 2 | `fixedLookups`의 NPC Encounters selector54 | 기존 정확한 LOOKUP 유지; 일반 random table 열기로 치환하지 않음 |
| AITC Unexpected Events 6 | 하나의 target + `fixedEntries` 3,5 | 서로 다른 원문 행을 두 LOOKUP으로 유지; 같은 target이라는 이유로 지우지 않음 |
| Core Gear A 5 | `scrollTable: unclean` | 원문 row에 SUBTABLE · Unclean Scrolls; 장비 표 전체의 general relation으로 승격하지 않음 |
| Feretory Campsite 10 | nested `subtable.id: campDream`; canonical parentTableId 존재 | 해당 row에서 원본 child table 열기; 열기만으로 RNG 실행 없음 |
| AITC Street / Street Exits | AITC PDF5/17, printed3/15; optional exits generator step | USES ↔ USED BY. result-specific artefact/forage/campsite 조건부 step은 global에서 제외 |

Book/source는 기존 방식으로 보존하고 functional relation보다 뒤에 둔다. 위 표의 source page는 canonical metadata에서 가져왔으며 새 원문을 작성하지 않았다.

## H. Browser Acceptance

로컬의 실제 브라우저 UI에서 아래 **13건**을 수행했다. 자동 테스트를 이 수에 포함하지 않는다. 실제 기록은 `outputs/relationship-pass/browser-evidence.json`, 스크린샷은 같은 디렉터리에 있다.

| Flow | 실제 입력 / 결과 / 이동 | 확인 |
| --- | --- | --- |
| 1 Search → Related | Reaction 검색 → 실물 `3,4` → `7–8 Indifferent` → Morale | open-only 탐색. 기존 generic Related에 근거 없는 FOLLOW-UP label 없음 |
| 2 Row → follow-up | Stash Item — Weak Hit `5` → NPC가 전리품을 가져가는 행 → NPC · Disposition + Profession | 해당 결과의 FOLLOW-UP 1개. 표적을 열었을 때 선택 결과 없음. 선택 행 bounds 815–962px / viewport height1243 안에 들어옴 |
| 3 Context replacement | 같은 Stash 표에 `1` → 물품 누락 | 현재 reading의 NPC 링크 0개. global Related에도 잔류하지 않음. 원본 5번 행의 링크는 그 행에 유지 |
| 4 Parent / child | Sample Rooms `1,1` → `11`; child를 열고 실물 `3` → Hypnotic; 부모 `3,5` → `35` | child 열기만으로 결과 없음. 명시적 lookup 뒤 부모11 유지. 부모35로 바꾸면 이전 child output과 열린 disclosure 모두0 |
| 5 Reverse procedure | Sample Rooms → USED BY Dungeon Preparation | 올바른 준비 procedure의 12필드가 빈 상태로 열림. 캠페인/session/자동 굴림 없음 |
| 6 Alias dedup | Stash5의 disposition + profession 두 원문 ID | canonical NPC target 버튼1개, 중복0 |
| 7 Recent return | Search → Stash5 → NPC → Recent Stash | d6=5 그대로 복원 |
| Fixed lookup | Civic Buildings 실물 `2` Library → LOOKUP NPC Encounters `#54` | 정확히54 Guards 선택. LOOKUP 중복0, random reroll 없음 |
| Workbench return | Sample Rooms35 핀/작업대 펼치기 → USED BY 준비 → 작업대 Sample Rooms | 결과35 유지, 탐색에 자동 굴림 없음 |
| Reload persistence | Sample Rooms를 핀/작업대에 둔 뒤 reload | Pins4·작업대1·Recent 복원. reading은 기존대로 메모리 상태이므로 reload 후 비어 있음. 검증용 핀/작업대 항목은 정리하여 기존 상태 복원 |
| Hidden explicit procedure | SD Dungeon Room Descriptors — Room Contents 실물 `6` → Common Encounters | 해당 행에만 FOLLOW-UP. 표 전체 Related는 SD 책만 유지. 표적은 COPY만 있는 고정 규칙 본문이며 dice 결과 없음 |
| Fixed creature | Zukuma · Berserker 열기 | 원본 무기4종 표시, 무작위 무기 선택 없음 |
| Complete mixed flow | Search Stash → 실물5 → NPC → Related Sölitary Defilement → Recent Stash | 원래 d6=5 결과 유지. 불필요한 홈 복귀0 |

전체 흐름에서 required session start / progression gate / required save / required mode transition / automatic roll은 **모두0**이다. 브라우저에서는 결과와 UI 상태를 관찰했고, 정확한 dice RNG 호출 수는 별도 자동 테스트의 RNG trap으로 검증했다. browser UI 관찰을 RNG 계측이라고 부풀리지 않는다.

## I. Responsive Acceptance

Civic Buildings2의 긴 contextual target과 Dungeon Preparation의 USES 7개/일반 Related1개를 실제 네 viewport에서 검사했다. 새 relationship을 모바일에서 숨기지 않았다. 작은 화면의 긴 행은 세로로 읽으며 같은 선택 행 안에 link가 유지된다.

| 실제 viewport | Document width (Civic) | Table usable width | Civic Related 높이 | Preparation Related 높이 | 결과 |
| --- | ---: | ---: | ---: | ---: | --- |
| 360×800 | 345px | 305px | 117px | 713px | 가로 overflow0, 긴 label/제목 줄바꿈, source와 충돌0 |
| 768×1024 | 753px | 713px | 117px | 614px | 가로 overflow0, contextual link/입력 겹침0 |
| 1440×1000 | 1425px | 1049px | 117px | 332px | 가로 overflow0, Related 기존 두 열 배치 유지 |
| 3440×1440 | 3425px | 1167px | 139px | 1051px | 가로 overflow0, 본문/결과/Related 기존 공간 유지 |

15px 차이는 세로 스크롤바다. Preparation3440의 document width는3440px이며 이 경우에도 overflow0이다. Related의 기존 최대8개와 기존 행 높이를 유지했다. 넓은 화면의 Preparation Related는 기존 큰 글자·여백 때문에 약1051px이며 이번 패스에서 디자인을 축소하지 않았다. label 자체가 제목/source를 덮거나 새로운 줄목록을 추가하지 않는다.

360px에서 가장 긴 Library 행은 본문·번역·주석·4개 관계를 포함하여937px 높이다. 한 화면에 모든 행 정보를 넣었다고 주장하지 않는다. 원문 결과와 관계를 숨기거나 input 위에 떠 있는 UI로 바꾸지 않았다. 주석의 강제 한 줄 표시를 제거해 horizontal scroll을 없앴다.

실제 screenshot:

- `outputs/relationship-pass/relationships-360.png` / `relationships-360-links.png`
- `outputs/relationship-pass/relationships-768.png`
- `outputs/relationship-pass/relationships-1440.png`
- `outputs/relationship-pass/relationships-3440.png`
- `outputs/relationship-pass/procedure-related-{360,768,1440,3440}.png`
- 실제 DOM 치수: `outputs/relationship-pass/responsive-evidence.json`

원문 전체가 포함된 screenshot/raw audit는 기존 private `outputs/` 아래에 두고 공개 Git에는 올리지 않는다.

## J. Integrity

| 항목 | Before | After |
| --- | ---: | ---: |
| Reference | 1001 | 1001 |
| Table | 546 | 546 |
| Rollable table | 518 | 518 |
| Original row | 12310 | 12310 |
| Creature reference | 95 | 95 |
| Book | 9 | 9 |

Canonical fixture / IDs / rows / ranges / weights / scenario exclusion / Core Miseries36행+7:7 footer 분리 / PDF provenance / book IDs는 변경하지 않았다. 기존 saved dungeon/campaign, Pins, Recent, Workbench, migration/import 파일·schema도 변경하지 않았다. private canonical bundle의 SHA-256은 전후 동일하다:

`edb000ad6a23ee13ccdb221732e770977cc6f375aca03621c8f0328441ba60c9`

Related 조회, target open, USED BY procedure open, subtable 단순 열기, 부모 복귀, Recent 복원, Workbench open은 **dice RNG0**이다. 자동 테스트는 dice entropy 함수를 호출하면 실패하도록 trap하여 확인한다. 모든95개 고정 creature 참조도0이다. 실제 생성에서의 Zukuma 무기 d4는 명시적 generation에서만 기존처럼 한 번 선택한다. 실물 lookup은 입력한 값만 사용하며 RNG를 소비하지 않는다. UUID 생성은 결과 주사위와 별개다.

## K. Tests / Lint / Build

| 항목 | 정확한 결과 |
| --- | --- |
| Baseline automated | 796 / 796 PASS |
| Final automated | 837 / 837 PASS |
| Newly added | 41 |
| Modified existing test files | 0 |
| Failed / skipped / cancelled | 0 / 0 / 0 |
| Search probes | 기존 문자열/expected 그대로33 / 33 first-result correct |
| Physical dice | 518개 rollable domain의12,518입력 조합, d66 `55` / `5,5`, d100 `97`, coordinate `3,5`, 2d6 individual faces 회귀 통과 |
| Migration/import | 기존 전체 suite와 source import round-trip 통과 |
| Pins/Recent/Workbench | 자동 preference round-trip 및 실제 browser reload/복귀 통과 |
| Browser acceptance | 위13건, 자동 테스트와 별도 |
| Responsive acceptance | 실제4 / 4 viewport, Civic + Preparation 각2상태 |
| Lint | `npm run lint` PASS, error0/warning0 |
| Production build | `npm run build` PASS; privacy check74 static files PASS |
| Diff whitespace | `git diff --check` PASS |

신규 테스트 파일만 추가했다:

- `tests/row-relationships.test.ts`: **14개**. 실제 canonical registry로 follow-up/reference/procedure/subtable/scroll/fixed/alias/creature identity와 self/duplicate 검사.
- `tests/reference-relationships.test.ts`: **10개**. Source-grounded forward/reverse, 정확한 source evidence, 잘못된 target/자기참조 제외, cache·전역 scan 방지·cap8.
- `tests/relationship-navigation.test.ts`: **17개**. Row replacement, parent/child 분리, exact fixed lookup, non-oracle reading 보존, RNG0, 고정 creature95개, 실제 digital roll, persistence/Recent/Workbench.

기존 테스트를 삭제하거나 assertion을 바꾸지 않았다. canonical integrity assertion을 약화하지 않았다. Baseline은 테스트 실행에 필요한 로컬 IPC 권한을 허용한 정상 실행의796개를 사용했다. 최종 로그는 `/tmp/mork-relationship-final-tests.log`, 빌드 로그는 `/tmp/mork-relationship-build.log`에 남겼다.

## L. Remaining Opportunities / Limitations

- `feretory.road` source procedure의 정확한 registry parent가 없어 Weather/Road로 USED BY를 추정하지 않는다.
- 같은 책, 제목 유사도, 본문 키워드, generic Related만으로 새 source label을 주지 않는다. 의도적으로 book-only인 참조 427개가 남는다.
- Rule seed oracle association, catalog의 untyped relatedIds, class feature association을 전부 procedural USES로 인증하지 않았다.
- ID 없는 narrative instruction, external source 이름, nested self reroll은 새 target을 추정하지 않는다. 원문 instruction으로 읽는다.
- 기존 Related 상한 8을 유지하므로 모든 관계가 동시에 보이는 graph browser가 아니다.
- Inline child 결과는 기존대로 component-local이다. 부모 결과는 Recent에 남지만 child 결과는 이동 후 유지되지 않는다. 새로운 저장 schema를 만들지 않았다.

### Composed Copy audit — 구현하지 않음

이번에는 **감사만** 수행했다. Sample Rooms 11을 선택하고 child d6=3을 명시적으로 얻은 경우 현재 `copyReferenceReading`은 부모만 직렬화하므로 child 값이 Copy에 포함되지 않는다. 기본 Copy는 selector 번호도 생략한다. 이는 기존 동작이며 이번 관계 layer가 만든 회귀가 아니다.

향후 현재 부모 reading identity와 연결된 **명시적으로 얻은 child 결과만** transient하게 전달해 Copy에 합칠 수 있다. 다만 Related/Recent/Workbench 이동 시 child 보존 범위를 먼저 정해야 하며 자동 굴림, 추정 결과, campaign log, nested persistent schema를 도입할 이유는 없다. 따라서 이 패스에서 구현하지 않았다. 브라우저에서 COPY를 눌러 clipboard도 확인했다. 실제 출력은 `Sample Rooms\n\nInscriptions, the motifs are`이며 child Hypnotic은 포함되지 않았다. 부모·child를 합치는 기능은 구현하지 않았다.

### 그 밖의 보류 항목

- 한국어 검색 가능한 표시 제목은 이번 변경의 범위가 아니다. 기존 고정33개 probe와 검색 corpus를 유지했고, source title 한국어 coverage의 남은 빈 곳을 관계 label로 채우지 않았다.
- DNGNGEN native pool integration은 추가하지 않았다. 기존 SD 준비 필드와 현재 canonical table 연결만 사용하며, 별도 풀146개를 새 콘텐츠로 가져오지 않았다.
- 360px의 긴 원문 행과 3440px의 큰 기존 결과 typography는 현재 시각 디자인의 제약이다. 이번 패스는 줄바꿈 외에는 디자인을 바꾸지 않았다.
