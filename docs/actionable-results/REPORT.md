# Actionable Results Pass — 완료 보고

2026-09-24. 기준 커밋: `c089b2c7b1f7db5bec0677288a76b055b06d02a5`.
최종 구현은 이 보고서를 포함하는 커밋에 해당한다.

결과 아래에서 **필수 처리 / 선택 사항 / 내용 참조**를 구분하고, 연결된 참조를 한 번 눌러 읽도록 변경했다. 기록·진행 시스템은 추가하지 않았다. 결과를 이해하고 다음 규칙을 찾는 데 필요한 이동만 줄였다.

## 감사와 데이터 보존

수정 전 감사: [BEFORE.md](BEFORE.md). 추가·분류 근거와 원문 페이지: [EVIDENCE.md](EVIDENCE.md).

| 항목 | Before | After |
|---|---:|---:|
| Reference | 993 | 993 |
| Canonical table | 546 | 546 |
| Root row | 12,310 | 12,310 |
| OracleProcedure | 60 | 60 |
| 기존 정규화된 row 관계 | 247 | 247 |
| USES / USED BY | 88 / 88 | 88 / 88 |
| 표시 가능한 row 연결 | 247 | 255 |
| 자동 테스트 | 1,077 통과 | 1,096 통과 |

278개의 원시 row 관계가 201개 row에 있었고, 별칭·중복을 해소하면 247개였다. `relatedIds`, row metadata, FOLLOW-UP, SUBTABLE, LOOKUP, procedure dependencies를 모두 확인했다. 기존 데이터의 확률·주사위·텍스트·ID·저장 형식은 바꾸지 않았다.

- **이미 사용 중:** 본문과 표의 row follow-up, 고정 entry lookup, procedure USES/USED BY, Related.
- **표면 간 누락:** Workbench 결과에는 일반 row follow-up이 없었다. 같은 결과인데 본문으로 다시 이동해야 했다.
- **명백한 데이터 공백:** Road Event의 Weather/Corpse, Foraging의 Village, Broken의 injury d6, Danger의 Reaction −2 등. 원문 확인 후 아래의 8개 연결만 읽기 시점에 보완했다.
- **판단 불가:** 일반적인 흔적·유해·환경 묘사를 어떤 표로 해석할지는 명시적 근거가 없으면 연결하지 않았다.

## 구현 구조와 화면

`resultRelationships.ts`는 기존 resolver의 관계를 표시용으로 분류한다. 새로운 관계 저장소나 캠페인 상태가 아니다. 정확한 table/row/target ID, VERIFIED 원문 상태를 확인하고, 보관된 결과의 텍스트가 현재 원문과 달라졌으면 추가된 분류를 적용하지 않는다. 대상 참조가 없거나 사용 불가능하면 표시하지 않는다.

우선순위는 **실제로 나온 row → 명시된 reading/definition 관계 → 기존 Related**다. row에 있는 고정 selector와 별칭을 보존하고, 같은 참조의 중복 버튼을 제거한다. 이미 함께 굴려진 subtable은 다시 필수 판정으로 요구하지 않고 ‘이미 결과에 포함됨’으로 표시한다. USES/USED BY는 기존 Related에 남긴다.

본문·표·Workbench는 같은 분류와 렌더러를 사용한다. 결과가 먼저 보이고 그 아래 작은 세 영역 중 필요한 것만 나온다. 필수 처리는 글자와 선으로 구분해 색상에만 의존하지 않는다. 버튼은 44px 이상이며 키보드 포커스가 보인다. 참조를 누르면 `activate`, 고정 entry는 `openLookup`만 호출한다. Roll은 기존 명시적 버튼에 남겨뒀다.

360px에서는 후속 연결이 있는 단일 결과의 주사위 숫자를 본문 위로 옮겨 결과와 첫 연결을 함께 읽기 쉽게 했다. 기존 모바일 CSS가 Workbench 결과까지 숨기던 경우도 수정했다. 새 breadcrumb나 별도 이력 UI는 만들지 않았다.

## 원문으로 확인한 추가 연결

아래는 canonical metadata를 덮어쓴 것이 아니라, 해당 row를 읽을 때 적용하는 8개 navigation binding이다. 정확한 ID와 페이지는 [근거 문서](EVIDENCE.md)에 있다.

| 실제 결과 | 연결 | 분류 |
|---|---|---|
| FERETORY Road Event 5–6 | Core Weather | REQUIRED |
| FERETORY Road Event 20 | Core Corpse Plundering | REQUIRED |
| FERETORY Foraging 5–6 | FERETORY Village | REQUIRED |
| Core Broken 2 | Broken Injury d6 | REQUIRED |
| Core Reaction 2–3 | Core combat | AVAILABLE: 전투로 이어질 때 |
| Core Reaction 4–6 | Core combat | AVAILABLE: 분노가 자동 전투는 아님 |
| Depths Danger 6 | Core Reaction | REQUIRED: −2 보정 안내 |
| SD Room Contents 1 | FERETORY The Monster Approaches | AVAILABLE: 기존 Depths 생성기의 대안 |

기존 관계도 필요성이 확인된 것만 REQUIRED로 분류했다. Useful Items 같은 예시 표는 AVAILABLE, 고정 LOOKUP은 CONTEXT로 표시한다. 전체 row 표시 연결 255개는 REQUIRED 26 / AVAILABLE 196 / CONTEXT 33이다. 모든 책의 모든 조건을 필수·선택으로 판정했다는 의미는 아니다.

Creature의 Reaction은 ‘상대의 반응이 불분명할 때만’이다. Combat의 Morale, Broken, critical/fumble에는 원문의 발동 조건을 붙였으며 앱이 HP나 전투 상황을 추적하거나 판정하지 않는다. Danger의 −2 역시 다른 roller에 몰래 적용하지 않고 직접 적용할 보정으로 명시한다.

## 대표 흐름과 interaction 수

아래 수는 **결과를 받은 뒤 목표 참조를 여는 데 필요한 조작**이다. 검색 경로의 ‘2’는 검색어 입력 한 번과 결과 선택 한 번을 센 값이며, 키 입력 수나 사용자가 표 이름을 알아내는 시간은 세지 않았다. Before 수는 기존 화면/코드의 경로 비교이고, After의 한 번 열기는 브라우저에서 직접 검증했다.

| 흐름 | Before | After |
|---|---|---|
| Road 5–6 → Weather | 결과 링크 없음, 검색 경로 2 | REQUIRED 1 |
| Road 20 → Corpse Plundering | 결과 링크 없음, 검색 경로 2 | REQUIRED 1 |
| Danger 6 → Reaction −2 | NPC 링크만 있음, Reaction 검색 경로 2 | REQUIRED 1, NPC는 선택 |
| hostile Reaction → combat | 결과별 링크 없음, 검색 경로 2 | 조건부 AVAILABLE 1 |
| SD common encounter → 명시된 encounter procedure | 기존 링크 1 | REQUIRED 1, 의미 구분 개선 |
| Stash 5 → 명시된 NPC 표 | 기존 링크 1 | AVAILABLE 1, paired alias 중복 없음 |
| 고정 Civic Buildings lookup → #54 | 기존 링크 1 | CONTEXT 1, 무작위 굴림 없음 |
| Workbench에서 기존 row follow-up | 본문 재열기 + 연결 2 | 작업대 결과에서 1 |

새 결과로 다시 굴리면 이전 row의 버튼이 남지 않는다. 빈 방·일반 Weather처럼 명시된 연결이 없는 결과에는 후속 영역이 생기지 않는다. 아직 굴리지 않은 표에도 결과 후속 영역은 없으며, 표를 펼쳤을 때의 개별 row 참조는 기존처럼 확인할 수 있다.

## 실제 브라우저 acceptance

최종 production build를 Chromium에서 **360 / 768 / 1440 / 3440 × 높이 1000**으로 사용했다. 각 크기 13개, 총 **52개 검증 통과**. 360에서는 touch tap, 나머지는 mouse click, 모든 크기에서 keyboard focus/Enter를 검증했다.

- Dungeon common encounter와 Danger −2 → 실제 procedure/Reaction을 한 번 열기.
- Creature → 선택적 Reaction → hostile combat → Morale 조건·실패 표·critical/fumble·Broken → 해당 injury row.
- Travel → Weather/Corpse, Stash → paired NPC, 고정 entry #54.
- 연결을 누를 때 RNG 호출이 증가하지 않음. 자식 참조를 굴린 뒤 Back/Recent로 돌아오면 원래 결과가 동일함.
- Pins/Recent/Workbench/Related 유지. Recent의 기존 ‘더 보기’와 모바일 진입 방식도 사용함. Recent 전체 경로가 항상 한 번이라는 주장은 하지 않음.
- page error와 문서 가로 넘침 없음. 캠페인 저장값 변화 없음.

정적 preview에는 private rulebook API가 없어 테스트 harness가 **기존 API 응답 경로에 공급된 private bundle 그대로** 전달했다. UI·registry·roll engine·navigation은 production 코드를 실행했다. 재현 가능한 결과를 얻기 위한 RNG 값만 테스트에서 지정했다. 공개 사이트의 로그인/네트워크 서비스 운영 상태를 검증한 것은 아니다.

스크린샷은 로컬 `outputs/actionable-results/`에 있다. 원문이 포함되어 Git에 올리지 않는다.

| 크기 | Travel | Dungeon Danger | Combat |
|---|---|---|---|
| 360 | [결과](../../outputs/actionable-results/travel-result-360.png) | [필수/선택](../../outputs/actionable-results/danger-result-360.png) | [조건](../../outputs/actionable-results/combat-conditions-360.png) |
| 768 | [결과](../../outputs/actionable-results/travel-result-768.png) | [필수/선택](../../outputs/actionable-results/danger-result-768.png) | [조건](../../outputs/actionable-results/combat-conditions-768.png) |
| 1440 | [결과](../../outputs/actionable-results/travel-result-1440.png) | [필수/선택](../../outputs/actionable-results/danger-result-1440.png) | [조건](../../outputs/actionable-results/combat-conditions-1440.png) |
| 3440 | [결과](../../outputs/actionable-results/travel-result-3440.png) | [필수/선택](../../outputs/actionable-results/danger-result-3440.png) | [조건](../../outputs/actionable-results/combat-conditions-3440.png) |

Before 캡처: [360](../../outputs/actionable-results/before-road-360.png), [1440](../../outputs/actionable-results/before-road-1440.png). 자동 검증 상세: [browser-acceptance.json](browser-acceptance.json).

360×1000에서 대표 Travel 결과와 첫 필수 버튼은 하단 dock 위에 함께 보인다. 긴 규칙 본문은 기존처럼 스크롤이 필요하며, 모든 결과가 모든 기기의 첫 화면에 다 들어온다는 보장은 하지 않는다. 스크린리더 실제 음성 사용과 별도 WCAG 전체 감사는 이번 검증에 포함하지 않았다.

## 자동 검증과 재현

- `npm test`: **1,096 통과, 실패/skip 0**. 기존 1,077 + 신규 19.
- 신규 테스트: 정확한 ID/중복, 원문 검증 실패 시 보수적 동작, row별 의미, 선택적 예시, 완료된 subtable, selector 보존, 실제 open-only 콜백, 결과 보존, registry 불변성/RNG 비사용.
- `npm run lint`: 통과.
- `npm run build`: TypeScript/Vite 및 public/private boundary 검증 통과(52 static files). 기존 bundle 크기와 plugin timing 경고는 남아 있음.
- `git diff --check`: 통과.
- 기준 시점에는 전체 테스트 수를 기록했다. 편집과 겹쳐 실행한 초기 build는 깨끗한 baseline build 증거로 사용하지 않았다.

브라우저 재현: production preview를 5174에 띄우고 `REFERENCE_URL=http://127.0.0.1:5174 node scripts/check-actionable-results-browser.mjs`. 기존 private fixture `outputs/morkborg-private-data.json`와 Playwright가 필요하다. 다른 환경에서는 `PLAYWRIGHT_MODULE`을 지정할 수 있다.

## 변경 파일

- `src/domain/resultRelationships.ts`: 표시 분류와 근거 있는 정확한 연결.
- `src/components/ResultReferenceLinks.tsx`: 공유 결과 참조 UI.
- `src/components/ReferenceNextSteps.tsx`, `ReferenceTable.tsx`: 표의 row 연결 통합.
- `src/components/ReferenceWorkbench.tsx`, `InlineReferenceTools.tsx`, `ReferenceContext.tsx`: 본문·작업대 통합 및 Related 중복 억제.
- `src/reference.css`: 작은 후속 영역, focus/touch, 모바일 결과 폭.
- `tests/actionable-results.test.ts`: 신규 19개 테스트.
- `scripts/check-actionable-results-browser.mjs`: 네 화면 크기의 실제 UI 검증.
- `docs/actionable-results/{BEFORE.md,EVIDENCE.md,REPORT.md,browser-acceptance.json}`: 감사·근거·검증 보고.

## 남은 공백과 의도적으로 제외한 것

모호한 환경 결과, 원문에서 ID로 특정하지 않는 creature/hazard, 아직 개별 감사하지 않은 조건부 관계는 필수 처리로 추정하지 않았다. 반복 굴림·수량 주사위·대체 절차도 완료 체크나 자동 queue로 바꾸지 않았다. TR 의존 규칙과 특수 던전 전용 콘텐츠는 다시 넣지 않았다.

캠페인 journal, HP/자원/날짜/inventory 추적, scene 진행, 자동 서사, generic AI 제안, 새 navigation 저장소는 모두 제외했다. 기존 Recent 10개/문서 내 retained reading 20개 한도도 그대로다. 지속적인 플레이 기록은 사용자의 노트에 남긴다.

결과: 단순히 링크를 예쁘게 나열한 변경은 아니다. 원문이 요구하는 다음 참조를 검색 없이 직접 열고, 선택적 예시를 필수 판정으로 오해하지 않으며, 작업대에서도 같은 결과 연결을 사용할 수 있게 했다.
