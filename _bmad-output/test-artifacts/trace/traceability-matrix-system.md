---
runScope: 'system'
runKey: 'system'
targetType: 'story'
targetId: ''
targetLabel: ''
workflowStatus: 'completed'
stepsCompleted: ['step-01-load-context', 'step-02-discover-tests', 'step-03-map-criteria', 'step-04-analyze-coverage', 'step-05-gate-decision']
lastStep: 'step-05-gate-decision'
lastSaved: '2026-10-12'
tempCoverageMatrixPath: '/tmp/tea-trace-coverage-matrix-system-2026-10-11T15-50-43-696Z.json'
coverageBasis: 'acceptance_criteria'
oracleConfidence: 'high'
oracleResolutionMode: 'formal_requirements'
oracleSources: ['docs/full-site-qa-20261011/requirements.md', '_bmad-output/test-artifacts/test-design/test-design-qa.md', '_bmad-output/test-artifacts/test-design/test-design-architecture.md']
externalPointerStatus: 'not_used'
collectionStatus: 'COLLECTED'
sourceSha: '44766de62b01cd4dfd6e0f8d31a033a376ca780b'
---

# Traceability Matrix & Gate Decision — RECLVSE 보완 / system

2026-10-12 KST. 검증 앱 코드 `44766de62b01cd4dfd6e0f8d31a033a376ca780b`. 설정 gate type은 story이며 지정된 story/epic/release 대상이 없어 runScope/runKey는 system이다. Formal QA01–07와 SYS01–26을 기준으로 하는 deterministic 실행이다. 기존 승인 기준을 낮추거나 면제하지 않았다. High oracle confidence는 요구사항 근거에 관한 값이며 전체 구현 통과를 뜻하지 않는다.

## Gate Decision: FAIL

P0 FULL이3/4(75%)로 필수100%에 못 미친다. SYS20의 실제 손상 보관함/용량초과 재현은 통과했지만 실제 IndexedDB/저장접근거부/오프라인/CAS 환경 전수가 남아 있다. SYS18/19는 최신 실제 브라우저에서 FULL로 해소했다. P1 FULL5/21(24%), 전체FULL9/26(35%)도 최소80%에 못 미친다. 이 비율은 전체 사이트 요구사항의 FULL 증거 비율이며 RECLVSE 표의 정확도나 자동 테스트 성공률이 아니다.

## Phase1: Coverage summary

| Priority | FULL / total | Coverage | Threshold/status |
|---|---:|---:|---|
| P0 | 3/4 | 75% | Required100%; NOT_MET |
| P1 | 5/21 | 24% | Minimum80%, PASS target90%; NOT_MET |
| P2 | 1/1 | 100% | Informational |
| P3 | 0/0 | 해당 없음 | Machine empty-denominator default100 is not evidence |
| Overall | 9/26 | 35% | Minimum80%; NOT_MET |

FULL9 / PARTIAL9 / UNIT-ONLY7 / NONE1. PARTIAL과 UNIT-ONLY는 FULL 분자에 세지 않는다.

## Detailed mapping

아래 파일·행은 현재 검사 등록 위치다. source 감사는 원본에서 독립 전사한 기대값을 사용하며 ignored 경로에 재실행 가능한 감사 코드가 있다. Live 항목은 현재SHA의 실제 관찰이며 재실행 가능한 E2E 파일로 꾸미지 않는다. 각 criterion의 범위·공백은 justification에 명시한다.

### SYS-01: Core 시작 자원·능력·HP·scroll 장비·12직업 기본 보정 (P1)

Coverage: **FULL**. Core PDF21/23/27/29 및 Core6/FER4/HER2의 기본 시작값 직접 대조. 모든 attachment는 SYS06의 전수 조건 공백으로 별도 유지.

Given 해당 원문·입력·기존 상태; When 아래 등록 검사 또는 기록된 실제 조작을 수행; Then 명시된 assertion/관찰 범위만 인정하며 전체 흐름 공백은 유지한다.

- `NODE:tests/rule-fidelity.test.ts:187` — `tests/rule-fidelity.test.ts:187` (unit): complete classless PC has essentials and scroll-dependent starting arms.
- `SOURCE-CORE-ABILITY` — `outputs/full-site-qa-20261011/rules-private/mechanical-audit.mjs:15` (unit): Core independent ability boundaries.
- `SOURCE-CLASS-BASELINES` — `outputs/full-site-qa-20261011/rules-private/mechanical-audit.mjs:56` (unit): Twelve independent class starting baselines.

Considered and rejected: none; inspected assertions support only the mapped scope.

### SYS-02: FER A/B/C·HP·사기·방어구·동률과 원문 모순 (P1)

Coverage: **FULL**. FER PDF2–3과 독립1,728조합. HP 본문/괄호 충돌과 동률 미지정은 추측 변경 없이 보고.

Given 해당 원문·입력·기존 상태; When 아래 등록 검사 또는 기록된 실제 조작을 수행; Then 명시된 assertion/관찰 범위만 인정하며 전체 흐름 공백은 유지한다.

- `NODE:tests/feretory-procedure.test.ts:62` — `tests/feretory-procedure.test.ts:62` (unit): The Monster Approaches rolls A/B/C once and adds only the source-defined HP die.
- `NODE:tests/feretory-procedure.test.ts:94` — `tests/feretory-procedure.test.ts:94` (unit): Feretory damage boundaries and HP doubling follow the printed rule.
- `SOURCE-FER-ABC` — `outputs/full-site-qa-20261011/rules-private/mechanical-audit.mjs:16` (unit): Independent 1728 A/B/C combinations.

Considered and rejected: none; inspected assertions support only the mapped scope.

### SYS-03: SD/Depths 두 d20·여행·던전·TR/DR·잠금·위험 후속 (P1)

Coverage: **FULL**. SD PDF5/7–9/15/17 및 Depths PDF6/9–13/15–19/25의 해당 절차를 직접 대조. 원문이 아닌 기존 TR3–30 앱 계약은 분리. 전체 표의 모든 조건은 SYS06 범위.

Given 해당 원문·입력·기존 상태; When 아래 등록 검사 또는 기록된 실제 조작을 수행; Then 명시된 assertion/관찰 범위만 인정하며 전체 흐름 공백은 유지한다.

- `NODE:tests/dungeon-action-moves.test.ts:89` — `tests/dungeon-action-moves.test.ts:89` (unit): SD searching accepts remaining Omens 0–4 and rejects invalid counts before rolling.
- `NODE:tests/journey-procedure.test.ts:103` — `tests/journey-procedure.test.ts:103` (unit): daily road action does not repeat morning weather; fork and changed weather remain source-directed.
- `NODE:tests/journey-procedure.test.ts:140` — `tests/journey-procedure.test.ts:140` (unit): camping compares independent d20s to DR12; failure recovery requires a distinct 50:50 retry.
- `SOURCE-SD-CRAWL` — `outputs/full-site-qa-20261011/rules-private/mechanical-audit.mjs:23` (unit): Independent crawl outcome combinations.
- `SOURCE-SD-SEARCH` — `outputs/full-site-qa-20261011/rules-private/mechanical-audit.mjs:75` (unit): Independent Omen searching and invalid inputs.
- `SOURCE-DEPTHS-ENEMY` — `outputs/full-site-qa-20261011/rules-private/mechanical-audit.mjs:95` (unit): Independent fifteen enemy stat rows.

Considered and rejected: none; inspected assertions support only the mapped scope.

### SYS-04: RECLVSE 두 d20·치명·질문 경계와 현재 원본 (P1)

Coverage: **FULL**. Fresh original PDF11-12/85 and actual callbacks4506 plus browser117 establish all stated 2d20/critical/oracle boundaries; the source <=/below contradiction is retained and disclosed.

Given 해당 원문·입력·기존 상태; When 아래 등록 검사 또는 기록된 실제 조작을 수행; Then 명시된 assertion/관찰 범위만 인정하며 전체 흐름 공백은 유지한다.

- `SOURCE-RCL-CALLBACKS` — `outputs/reclvse-qa-20261011/private/calculator-audit.mjs:8` (unit): PDF11-12/85 independently expected actual4506 callback cases.
- `RCL-SOURCE-CALCULATOR-44766de` (live): Original PDF11-12/85: actual callback4506 and browser117 resolution/oracle outcomes. Evidence: `outputs/reclvse-qa-20261011/private/calculator-results.json; browser-calculators-final.json; report original ambiguities explicitly retained`. SHA `44766de62b01cd4dfd6e0f8d31a033a376ca780b`.

Considered and rejected: none; inspected assertions support only the mapped scope.

### SYS-05: Mythic Fate Chart/Check/Scene/Prepared/Event·CF (P1)

Coverage: **FULL**. Mythic PDF20/26–27/38/68/163/165/187 직접 대조 및 Chart81셀/8,100·Check8,100·Scene180. 모든 Meaning/Variation 적용은 SYS06 공백.

Given 해당 원문·입력·기존 상태; When 아래 등록 검사 또는 기록된 실제 조작을 수행; Then 명시된 assertion/관찰 범위만 인정하며 전체 흐름 공백은 유지한다.

- `NODE:tests/mythic.test.ts:201` — `tests/mythic.test.ts:201` (unit): Fate Check uses source modifiers and exact exceptional bands without clamping.
- `NODE:tests/mythic.test.ts:262` — `tests/mythic.test.ts:262` (unit): scene checks cover all90 combinations and do not change Chaos.
- `SOURCE-MYTHIC-CELLS` — `outputs/full-site-qa-20261011/rules-private/mechanical-audit.mjs:102` (unit): Independent Mythic chart and outcome boundaries.
- `SOURCE-MYTHIC-SCENES` — `outputs/full-site-qa-20261011/rules-private/mechanical-audit.mjs:118` (unit): Independent normal and prepared scenes.

Considered and rejected: none; inspected assertions support only the mapped scope.

### SYS-06: 전체 표 행 범위·후속·원문 authority·번역의 전수 대조 (P1)

Coverage: **PARTIAL**. RCL original recovered; all223/4394 English/range entries investigated (4330 automatic/layout matches plus64 manual groups), probability4416, restored mandatory downsides. All4394 Korean semantic readings and other-book full attachment/conditions still not established.

Given 해당 원문·입력·기존 상태; When 아래 등록 검사 또는 기록된 실제 조작을 수행; Then 명시된 assertion/관찰 범위만 인정하며 전체 흐름 공백은 유지한다.

- `NODE:tests/oracles.test.ts:81` — `tests/oracles.test.ts:81` (unit): Oracle validation accepts exact ranges and source.
- `NODE:tests/row-relationships.test.ts:254` — `tests/row-relationships.test.ts:254` (unit): Self references and missing targets never become visible links.
- `SOURCE-RCL-DICE` — `outputs/reclvse-qa-20261011/private/probability-audit.mjs:4` (unit): Independent physical4416 cases across all223 RCL tables.
- `NODE:tests/rule-fidelity.test.ts:46` — `tests/rule-fidelity.test.ts:46` (unit): Brute skill guidance acknowledges the explicit PDF24 d6 without changing the selection-only reader.
- `NODE:tests/rule-fidelity.test.ts:69` — `tests/rule-fidelity.test.ts:69` (unit): RECLVSE class references retain mandatory downsides from PDF20–30.

Considered and rejected: none; inspected assertions support only the mapped scope.

### SYS-07: Home 빠른 참조·굴림·copy/pin·return (P1)

Coverage: **PARTIAL**. Current Home component assertions establish only part of the control families; whole Home live journey is historical.

Given 해당 원문·입력·기존 상태; When 아래 등록 검사 또는 기록된 실제 조작을 수행; Then 명시된 assertion/관찰 범위만 인정하며 전체 흐름 공백은 유지한다.

- `NODE:tests/home-bilingual.test.ts:143` — `tests/home-bilingual.test.ts:143` (component): Home exposes real generator destinations without running a generator or requiring a session.

Considered and rejected: none; inspected assertions support only the mapped scope.

### SYS-08: 검색·책/상황/유형 필터·모든 reader 종류 (P1)

Coverage: **PARTIAL**. Current source-scoped RCL318 readers, duplicate-name selection, canonical76 and city3 filters supplement domain/SSR proof. Whole9book/8context/7type reader family journey is not freshly complete.

Given 해당 원문·입력·기존 상태; When 아래 등록 검사 또는 기록된 실제 조작을 수행; Then 명시된 assertion/관찰 범위만 인정하며 전체 흐름 공백은 유지한다.

- `NODE:tests/reference-search-coverage.test.ts:596` — `tests/reference-search-coverage.test.ts:596` (unit): The actual browse surface retains trusted titles through its entries/byId registry wrapper.
- `NODE:tests/full-site-qa-regression.test.ts:30` — `tests/full-site-qa-regression.test.ts:30` (unit): includes late supplied source references in the book summary and related list.
- `NODE:tests/rule-fidelity.test.ts:55` — `tests/rule-fidelity.test.ts:55` (unit): RECLVSE city discoveries on PDF106 remain in city, before wilderness PDF107.
- `RCL-READERS-44766de` (live): All318 active RCL related entries visited; city3 filters; canonical76 selected; limited to RCL. Evidence: `outputs/reclvse-qa-20261011/private/browser-references-final.json; browser-city-final.json; browser-sources-tables-final.json`. SHA `44766de62b01cd4dfd6e0f8d31a033a376ca780b`.

Considered and rejected: none; inspected assertions support only the mapped scope.

### SYS-09: 하위 참조·manual dice·partial/HOLD·복귀 (P1)

Coverage: **PARTIAL**. Current RCL manual invalid/valid d66 and actual RCL armor/Power links and weather follow-ups establish part. Other-book nested partial/HOLD/invalidTR end-to-end families remain historical.

Given 해당 원문·입력·기존 상태; When 아래 등록 검사 또는 기록된 실제 조작을 수행; Then 명시된 assertion/관찰 범위만 인정하며 전체 흐름 공백은 유지한다.

- `NODE:tests/reference-reading.test.ts:66` — `tests/reference-reading.test.ts:66` (unit): Move and fixed-lookup readings expose the selected result’s follow-up table, not an automatic reroll.
- `NODE:tests/row-relationships.test.ts:238` — `tests/row-relationships.test.ts:238` (unit): Ambiguous fixedEntry selectors do not guess a target and malformed metadata is ignored.
- `NODE:tests/full-site-qa-regression.test.ts:63` — `tests/full-site-qa-regression.test.ts:63` (unit): rejects invalid active Orakle threat ratings before consuming dice and permits the app input boundaries.
- `NODE:tests/pdf-remediation-batch-1.test.ts:55` — `tests/pdf-remediation-batch-1.test.ts:55` (unit): RECLVSE prose opens its own armor table without borrowing Core gear or Powers.
- `RCL-FOLLOWUPS-44766de` (live): RCL armor and Power links; weather20 andMist; classes6; manual d66 invalid and valid edges. Evidence: `outputs/reclvse-qa-20261011/private/browser-classes-final.json; browser-power-link-final.json; browser-weather-final.json; browser-manual-final.json`. SHA `44766de62b01cd4dfd6e0f8d31a033a376ca780b`.

Considered and rejected: none; inspected assertions support only the mapped scope.

### SYS-10: Core/native 캐릭터·12직업·source·reroll/save (P1)

Coverage: **UNIT-ONLY**. Automated native character preservation is current. Four-kind Shelf starter character is fresh but not all12classes/source/reroll control families; whole criterion remains unestablished.

Given 해당 원문·입력·기존 상태; When 아래 등록 검사 또는 기록된 실제 조작을 수행; Then 명시된 assertion/관찰 범위만 인정하며 전체 흐름 공백은 유지한다.

- `NODE:tests/official-generators.test.ts:63` — `tests/official-generators.test.ts:63` (unit): SCVMBIRTHER scroll handling follows the published string comparison.
- `NODE:tests/translation-ui-terms.test.ts:82` — `tests/translation-ui-terms.test.ts:82` (unit): SCVM reader normalizes companion gear while preserving English and the pack.

Considered and rejected: none; inspected assertions support only the mapped scope.

### SYS-11: 현재 활성 Monster source·수치·FER/native/EPK (P1)

Coverage: **UNIT-ONLY**. Current active Monster/FER numeric assertions pass; active whole UI control families remain historical. Inactive legacy manual editor remains separately N/A.

Given 해당 원문·입력·기존 상태; When 아래 등록 검사 또는 기록된 실제 조작을 수행; Then 명시된 assertion/관찰 범위만 인정하며 전체 흐름 공백은 유지한다.

- `NODE:tests/official-generators.test.ts:122` — `tests/official-generators.test.ts:122` (unit): monster site armor follows its published C-before-B parity.
- `NODE:tests/feretory-procedure.test.ts:62` — `tests/feretory-procedure.test.ts:62` (unit): The Monster Approaches rolls A/B/C once and adds only the source-defined HP die.

Considered and rejected: none; inspected assertions support only the mapped scope.

### SYS-12: Core/native 던전·이유/경비/특별한 방1–4·개별 조작 (P1)

Coverage: **PARTIAL**. Fresh SD preparation generator/save/restore and current DNGNGEN translation/context regressions establish part. Full native/Core twelve-part/manual/source journey is historical.

Given 해당 원문·입력·기존 상태; When 아래 등록 검사 또는 기록된 실제 조작을 수행; Then 명시된 assertion/관찰 범위만 인정하며 전체 흐름 공백은 유지한다.

- `NODE:tests/dngngen-translation-features.test.ts:194` — `tests/dngngen-translation-features.test.ts:194` (unit): full preparation connects reason, entrance, guards and every native room; individual rerolls preserve other fields.
- `NODE:tests/dngngen-translation-features.test.ts:287` — `tests/dngngen-translation-features.test.ts:287` (component): main sheet and preview show explicit Korean helpers without repeating DNGNGEN per room.

Considered and rejected: none; inspected assertions support only the mapped scope.

### SYS-13: NPC/Room/Street/Settlement와 나머지 활성 생성기 (P1)

Coverage: **PARTIAL**. Fresh three RCL and three mixed-source procedure reads/rolls plus NPC/Settlement Shelf starters establish part. Remaining generator control families have only historical live observations.

Given 해당 원문·입력·기존 상태; When 아래 등록 검사 또는 기록된 실제 조작을 수행; Then 명시된 assertion/관찰 범위만 인정하며 전체 흐름 공백은 유지한다.

- `NODE:tests/rule-fidelity.test.ts:281` — `tests/rule-fidelity.test.ts:281` (unit): Weather selects 1–3 tables and leaves unnatural follow-up optional.
- `NODE:tests/rule-fidelity.test.ts:331` — `tests/rule-fidelity.test.ts:331` (unit): Buildings rolls d2 material count, each material and Other follow-up independently.
- `NODE:tests/translation-ui-terms.test.ts:17` — `tests/translation-ui-terms.test.ts:17` (unit): Weather Wind keeps its UI meaning despite an unrelated table translation.
- `RCL-PROCEDURES-44766de` (live): Three RCL and three existing mixed-source procedure screens visited and rolled; remaining whole-site generators not rerun. Evidence: `outputs/reclvse-qa-20261011/private/browser-references-final.json and browser-storage-final.json; Source composition disclosure retained`. SHA `44766de62b01cd4dfd6e0f8d31a033a376ca780b`.

Considered and rejected: none; inspected assertions support only the mapped scope.

### SYS-14: Dungeon/City/Journey map·hotspot·action·return (P1)

Coverage: **UNIT-ONLY**. Current spatial/domain links pass; actual map/action/pan/return journey remains historical.

Given 해당 원문·입력·기존 상태; When 아래 등록 검사 또는 기록된 실제 조작을 수행; Then 명시된 assertion/관찰 범위만 인정하며 전체 흐름 공백은 유지한다.

- `NODE:tests/spatial-oracle.test.ts:86` — `tests/spatial-oracle.test.ts:86` (unit): Every spatial feature resolves to an existing canonical reference with source attribution.

Considered and rejected: none; inspected assertions support only the mapped scope.

### SYS-15: 일반 주사위·physical invalid·play guidance (P1)

Coverage: **UNIT-ONLY**. Current dice/formula boundaries pass; actual full general dice/guidance control families were not freshly rerun.

Given 해당 원문·입력·기존 상태; When 아래 등록 검사 또는 기록된 실제 조작을 수행; Then 명시된 assertion/관찰 범위만 인정하며 전체 흐름 공백은 유지한다.

- `NODE:tests/combat-tool.test.ts:159` — `tests/combat-tool.test.ts:159` (unit): Combat formula accepts bounded dice and fixed damage without evaluating expressions.
- `NODE:tests/oracles.test.ts:160` — `tests/oracles.test.ts:160` (unit): d66 has exactly 36 legal pairs and uses tens/units d6.

Considered and rejected: none; inspected assertions support only the mapped scope.

### SYS-16: 전투 계산·치명/실수/Omen·기록·Undo 및 주요 관리 (P1)

Coverage: **UNIT-ONLY**. Current combat numeric boundaries pass; whole combat/roster/shield/ranged/Undo UI families remain historical.

Given 해당 원문·입력·기존 상태; When 아래 등록 검사 또는 기록된 실제 조작을 수행; Then 명시된 assertion/관찰 범위만 인정하며 전체 흐름 공백은 유지한다.

- `NODE:tests/combat-tool.test.ts:266` — `tests/combat-tool.test.ts:266` (unit): Natural 20 doubles weapon damage before armor; record leaves HP and armor manual.
- `NODE:tests/combat-tool.test.ts:292` — `tests/combat-tool.test.ts:292` (unit): Defence fumble previews doubled weapon damage while HP and armor stay manual.
- `NODE:tests/combat-tool.test.ts:311` — `tests/combat-tool.test.ts:311` (unit): Defence critical only offers a free attack; it neither rolls nor applies another attack.

Considered and rejected: none; inspected assertions support only the mapped scope.

### SYS-17: Mythic Odds/CF/Chart/Check/Scene/Event/list·repeat/reload (P1)

Coverage: **UNIT-ONLY**. Current Mythic calculation/list guards pass; whole Mythic rendered list/edit/history journey remains historical.

Given 해당 원문·입력·기존 상태; When 아래 등록 검사 또는 기록된 실제 조작을 수행; Then 명시된 assertion/관찰 범위만 인정하며 전체 흐름 공백은 유지한다.

- `NODE:tests/mythic.test.ts:201` — `tests/mythic.test.ts:201` (unit): Fate Check uses source modifiers and exact exceptional bands without clamping.
- `NODE:tests/mythic.test.ts:262` — `tests/mythic.test.ts:262` (unit): scene checks cover all90 combinations and do not change Chaos.
- `NODE:tests/notebook-tools.test.ts:115` — `tests/notebook-tools.test.ts:115` (unit): Mythic allows three weighted occurrences but rejects a fourth.

Considered and rejected: none; inspected assertions support only the mapped scope.

### SYS-18: Shelf4kind 생성/save/select/edit/cancel/clone/copy/deleteUndo/reload (P0)

Coverage: **FULL**. Current actual four-kind generate/save/select/edit cancel/save/original source/clone/verified clipboard/deleteUndo/reload all complete; snapshot assertions add preservation proof.

Given 해당 원문·입력·기존 상태; When 아래 등록 검사 또는 기록된 실제 조작을 수행; Then 명시된 assertion/관찰 범위만 인정하며 전체 흐름 공백은 유지한다.

- `NODE:tests/notebook-tools.test.ts:182` — `tests/notebook-tools.test.ts:182` (unit): Shelf snapshots stay independent, retaining the generated original on edit.
- `RCL-SHELF-FOUR-KINDS-44766de` (live): Four kinds generate/save/select/edit/cancel/save/original/clone/copy/delete/Undo/reload complete. Evidence: `outputs/reclvse-qa-20261011/private/browser-storage-final.json; actual clipboard markers and sixteen records after file append`. SHA `44766de62b01cd4dfd6e0f8d31a033a376ca780b`.

Considered and rejected: none; inspected assertions support only the mapped scope.

### SYS-19: Shelf 실제 파일 export/import append·잘못된 입력 보존 (P0)

Coverage: **FULL**. Current actual downloaded8-record file selected via chooser and appended to16; wrongkind/date/duplicateID/201count/JSON/10MB rejection each preserves exact prior export bytes.

Given 해당 원문·입력·기존 상태; When 아래 등록 검사 또는 기록된 실제 조작을 수행; Then 명시된 assertion/관찰 범위만 인정하며 전체 흐름 공백은 유지한다.

- `NODE:tests/notebook-tools.test.ts:194` — `tests/notebook-tools.test.ts:194` (unit): Shelf validation rejects mismatched kinds, unknown null kinds and duplicate identities.
- `RCL-SHELF-FILES-44766de` (live): Actual downloaded file selected and appended; six invalid uploads preserve exact prior export bytes. Evidence: `outputs/reclvse-qa-20261011/private/browser-import-results.json; browser-storage-final.json; actual file chooser/export`. SHA `44766de62b01cd4dfd6e0f8d31a033a376ca780b`.

Considered and rejected: none; inspected assertions support only the mapped scope.

### SYS-20: 손상 byte·Quota/IDB/CAS/stale update의 데이터 보호와 실제 오류 상태 (P0)

Coverage: **PARTIAL**. Current actual corrupt bytes and Quota error/rendered draft/disabled export and exact raw recovery established. Actual IDB denied/corrupt, denied storage, offline/CAS whole environments remain blocked; unit/fake tests do not establish all actual fault states.

Given 해당 원문·입력·기존 상태; When 아래 등록 검사 또는 기록된 실제 조작을 수행; Then 명시된 assertion/관찰 범위만 인정하며 전체 흐름 공백은 유지한다.

- `NODE:tests/object-shelf-corruption.test.ts:7` — `tests/object-shelf-corruption.test.ts:7` (component): a damaged shelf blocks edits and retains the exact stored bytes and older records.
- `NODE:tests/private-data.test.ts:159` — `tests/private-data.test.ts:159` (unit): storage failure preserves all active packs.
- `NODE:tests/published-data.test.ts:497` — `tests/published-data.test.ts:497` (unit): cross-tab changes cause CAS rejection without advancing the server revision.
- `NODE:tests/published-data.test.ts:511` — `tests/published-data.test.ts:511` (unit): offline errors preserve cached packs and force retry restores server checks.
- `NODE:tests/rule-fidelity.test.ts:91` — `tests/rule-fidelity.test.ts:91` (unit): audited RECLVSE corrections reach existing installations without replacing user edits.
- `NODE:tests/rule-fidelity.test.ts:127` — `tests/rule-fidelity.test.ts:127` (unit): an already acknowledged revision repairs superseded source tables and preserves other packs.
- `RCL-CORRUPTION-QUOTA-44766de` (live): Real corrupt bytes and QuotaExceededError error display, disabled corrupt export, byte preservation and recovery. Evidence: `outputs/reclvse-qa-20261011/private/fault-corrupt-*.txt; fault-quota-*.txt; browser-storage-final.json; final export hash unchanged`. SHA `44766de62b01cd4dfd6e0f8d31a033a376ca780b`.

Considered and rejected: none; inspected assertions support only the mapped scope.

### SYS-21: Tray/Scratch/Last/Recent/Pack/Recipe·수명·clear isolation (P1)

Coverage: **UNIT-ONLY**. Current memory isolation assertions pass; whole rendered Tray/Scratch/Last/Pack/Recipe paths remain historical.

Given 해당 원문·입력·기존 상태; When 아래 등록 검사 또는 기록된 실제 조작을 수행; Then 명시된 assertion/관찰 범위만 인정하며 전체 흐름 공백은 유지한다.

- `NODE:tests/play-memory.test.ts:330` — `tests/play-memory.test.ts:330` (unit): Temporary clear is isolated from Campaign export, Pins, Recipes, Packs, Tray, Scratch and Last.

Considered and rejected: none; inspected assertions support only the mapped scope.

### SYS-22: Sources backup/restore·update pause/check·About (P1)

Coverage: **PARTIAL**. Current canonical76 and source-correction arrival plus exact update/HTTP guards establish part. Whole fresh backup/restore/pause/check/About UI family not repeated.

Given 해당 원문·입력·기존 상태; When 아래 등록 검사 또는 기록된 실제 조작을 수행; Then 명시된 assertion/관찰 범위만 인정하며 전체 흐름 공백은 유지한다.

- `NODE:tests/private-data.test.ts:176` — `tests/private-data.test.ts:176` (unit): private backup includes all three packs and round-trips through validation.
- `NODE:tests/published-data.test.ts:544` — `tests/published-data.test.ts:544` (unit): paused updates skip downloads; manual check works without turning automatic checks on.
- `NODE:tests/published-server.test.ts:123` — `tests/published-server.test.ts:123` (api): HTTP handler is read-only, sends no-store JSON and hides configuration failures.
- `NODE:tests/rule-fidelity.test.ts:91` — `tests/rule-fidelity.test.ts:91` (unit): audited RECLVSE corrections reach existing installations without replacing user edits.
- `NODE:tests/rule-fidelity.test.ts:127` — `tests/rule-fidelity.test.ts:127` (unit): an already acknowledged revision repairs superseded source tables and preserves other packs.
- `RCL-SOURCES-44766de` (live): Canonical76 RCL selected and old exact-fingerprint corrections received; full backup/settings/About not rerun. Evidence: `outputs/reclvse-qa-20261011/private/browser-sources-tables-final.json; browser-modifier-after.json; browser-weather-mist-after.json historical intermediate SHA retained`. SHA `44766de62b01cd4dfd6e0f8d31a033a376ca780b`.

Considered and rejected: none; inspected assertions support only the mapped scope.

### SYS-23: keyboard/Esc/back/reload·visited flow console (P1)

Coverage: **PARTIAL**. Current RCL links and Shelf reloads/copy are actual; whole keyboard/Esc/back journeys remain historical. Two Vite connection errors observed; no zero-console-error claim.

Given 해당 원문·입력·기존 상태; When 아래 등록 검사 또는 기록된 실제 조작을 수행; Then 명시된 assertion/관찰 범위만 인정하며 전체 흐름 공백은 유지한다.

- `NODE:tests/navigation-history.test.ts:109` — `tests/navigation-history.test.ts:109` (unit): Back and Forward restore selectors without adding entries or executing content.

Considered and rejected: none; inspected assertions support only the mapped scope.

### SYS-24: mobile/tablet/desktop 주요 화면 layout·longtext·focus (P1)

Coverage: **NONE**. Viewport API requests360/768/1440 did not change actual1529x1233 dimensions. Current mobile/tablet evidence blocked; c01 three-viewport observations are stale.

Given 해당 원문·입력·기존 상태; When 아래 등록 검사 또는 기록된 실제 조작을 수행; Then 명시된 assertion/관찰 범위만 인정하며 전체 흐름 공백은 유지한다.

현재 인정 가능한 검사/관찰 없음.


Considered and rejected: none; inspected assertions support only the mapped scope.

### SYS-25: 최소 수정·원문/데이터 보존·최종 tests/lint/type/build/privacy (P0)

Coverage: **FULL**. Exact latest44766de tests1265/no fail/skip, build/type/lint/privacy57files pass; independent source deltas preserve IDs/ranges/library/Fate and actual correction regressions.

Given 해당 원문·입력·기존 상태; When 아래 등록 검사 또는 기록된 실제 조작을 수행; Then 명시된 assertion/관찰 범위만 인정하며 전체 흐름 공백은 유지한다.

- `NODE:tests/public-build.test.ts:22` — `tests/public-build.test.ts:22` (unit): privacy boundary rejects renamed packs, secret bytes, excerpts and local paths.
- `NODE:tests/public-build.test.ts:54` — `tests/public-build.test.ts:54` (unit): ciphertext and its matching manifest pass without embedding private plaintext or keys.
- `NODE:tests/published-server.test.ts:164` — `tests/published-server.test.ts:164` (api): production preview shares the real API handler and never serves plaintext or SPA for API errors.
- `NODE:tests/translation-ui-terms.test.ts:48` — `tests/translation-ui-terms.test.ts:48` (unit): companion terminology corrections require the matching English meaning and keep dice.
- `RCL-LATEST-CHECKS-44766de` (live): Final1265 tests/no skips, build/type/lint/privacy; source evidence minimal deltas and actual regressions. Evidence: `outputs/reclvse-qa-20261011/final-44766de-tests.log; final-44766de-build.log; final-44766de-lint.log; final-44766de-privacy.log; private/canonical-delta.json`. SHA `44766de62b01cd4dfd6e0f8d31a033a376ca780b`.

Considered and rejected: none; inspected assertions support only the mapped scope.

### SYS-26: 실제 visited/source/bugs/fixes/test/gap/전후 증거의 정직한 보고 (P2)

Coverage: **FULL**. Current followup report distinguishes actual source/English/layout/fix proofs from full Korean semantic gaps, original contradictions, stale evidence, failed viewport requests and unfinished storage faults; no unverified PASS.

Given 해당 원문·입력·기존 상태; When 아래 등록 검사 또는 기록된 실제 조작을 수행; Then 명시된 assertion/관찰 범위만 인정하며 전체 흐름 공백은 유지한다.

- `RCL-HONEST-REPORT-44766de` (live): Current source/defects/evidence/limits report with actual SHAs, semantic and viewport/fault gaps. Evidence: `docs/full-site-qa-20261011/reclvse-follow-up.md; updated historical report points to this followup; final gate not claimed before completion`. SHA `44766de62b01cd4dfd6e0f8d31a033a376ca780b`.

Considered and rejected: none; inspected assertions support only the mapped scope.

## Gaps and remediation

Critical P0 below FULL: **SYS20 PARTIAL**. High P1 with no current proof: **SYS24 NONE**. All remaining partial/unit-only criteria are listed above and remain gaps even where the machine critical/high buckets exclude them. No gap or denominator is removed.

| Case | Given → When → Then | Owner / completion condition |
|---|---|---|
| SYS20-IDB-FAIL | Existing valid data + real denied/corrupt IndexedDB → initialize/update/save → visible error, exact prior bytes and draft preserved; repeat actual denied-storage/offline/concurrent environments | QA/Codex; before whole-site PASS, no invented date |
| SYS24-VIEWPORT | Measured actual360/768/1440 width → use each major page/modal with long text and focus → controls readable, no accidental overflow; reject ineffective override | QA/Codex; current measured render required |
| SYS06-KO-SOURCE | Source-identified row/image → review Korean meaning/condition/exception → semantic evidence or actual discrepancy recorded separately from PDF extraction | QA/Codex; no inferred semantic PASS |
| SYS10/11/14–17/21-CURRENT | Current app code → complete generator/map/dice/combat/Mythic/temporary tools normal/error/boundary flow → current actual state evidence | QA/Codex; historical results remain stale |
| SYS23-CONSOLE-KEYBOARD | Stable browser connection → navigate remaining controls by keyboard/back/repeat → inspect focus and actual console | QA/Codex; two Vite errors remain disclosed |

## Coverage heuristics and duplicates

Inspected endpoint/auth negative-path/happy-path-only heuristic counts are0. This is scoped test discovery, not a full security assessment.18 UI journeys have no repeatable browser E2E;16 UI state families lack fresh complete evidence. The absence of repeatable E2E does not discard actual FULL SYS18/19 browser observations. Source/domain checks and scoped live observations are complementary, not duplicate suite executions. Unique evidence identities are deduplicated before totals.

| Level | Accepted cases | Criteria with evidence |
|---|---:|---:|
| Unit | 57 | 23 |
| Component | 3 | 3 |
| API | 2 | 2 |
| Live | 10 | 10 |
| E2E automation | 0 | 0 |

72 accepted mapped evidence cases from28 file paths;52 NODE registrations +10 independent source audits +10 live observations. Cases shared by criteria are counted once; criteria-by-level overlap and must not be summed. Static discovery separately found109 files/1097 registrations (unit986/component103/API8); runtime1265 reflects loop expansion. Known privateTest forwarding registrations were inspected; the generic wrapper template is not duplicated.

Live freshness:10 current counted,21 stale,5 blocked,0 invalid/unmatched/fail/contradicted. Historical observations retain original SHAs. Fourteen fresh producer entries include blocked records; blocked entries do not count. SYS26 alone rests on live evidence, which would cap an otherwise PASS result atCONCERNS; it never raises this FAIL.

## Quality assessment

Mapped52 NODE registrations contain direct assertions;25 source files have maximum731 lines, no hard-wait candidates in the mapped bodies. This narrow structural check is not an all-quality-criteria PASS. The broader Oracle presentation regression takes194,488ms, above TEA's90s recommendation; it passes but remains a WARNING. Previous completed Test Review63/100 D / Request Changes remains historical, not silently converted to a fresh review. No expected result was changed solely to raise the score.

## Phase2: evidence and decision integrity

Latest application suite1265/1265 passes, fail0/skip0/todo0, duration212,495ms. Source: ignored `outputs/reclvse-qa-20261011/final-44766de-tests.log`. Build/type/lint/privacy pass. Independent223-table/4416 physical cases and4506 actual calculator callback cases pass; neither is added to1265 runtime total. Current318 reference visits,117 UI calculator results, weather/classes/links, four-kind Shelf, file reject/recovery and real corruption/quota are independently recorded. All4394 KO sentences are not semantically certified.

Per-priority runtime test pass rates, code line/branch/function coverage and burn-in/flakiness are unavailable, not zero. NFR Security/Performance/Reliability/Maintainability are **NOT_ASSESSED**; no NFR assessment artifact was supplied. Known build size warning and test duration are not performance SLA evidence. No waiver register exists and no waiver is derived or applied.

Gate is eligible: collection_statusCOLLECTED, allow_gate true. The exact Step5 decision code reads the persisted Phase1 temporary matrix; it does not regenerate or mutate coverage. Rule1 derivesFAIL from P0<100%. Overall<80% and P1<80% independently also fail. Formal oracle is not synthetic.

## Machine artifacts and provenance

- `coverage-matrix-system.json`: full Phase1 matrix, statistics, heuristics and gaps.
- `traceability-mapping-system.json`: current mappings, dispositions and source evidence.
- `test-inventory-system.json`: actual current test registrations and scope.
- `e2e-trace-summary-system.json`: schema0.3.0; source44766de, deterministicFAIL, all inventory buckets, mixed freshness, exact report path.
- `gate-decision-system.json`: compact derived decision.
- `gate-report-system.json`: full decision with Phase1 snapshot.
- `../live-verification-results.json`: independent producer; Trace consumes without rewriting observations.

App code has not changed since44766de. Subsequent report-only commits do not relabel the SHA of observed app behavior. Prior completed Trace artifacts are archived privately; other run scopes are untouched. Execution mode auto/probe resolves sequentially because runtime delegation capability is unavailable.

## Next actions

Complete actual remaining storage fault environments, obtain effective measured viewport control, and review all remaining Korean semantics/current whole-site flows before rerunning the gate. Add repeatable failure-prone browser cases with the existing stack. Confirm all gaps with evidence rather than suppressing checks or manufacturing release dates. Under TEA's FAIL recommendation, release remains blocked; this run does not deploy or waive the gate.

```yaml
traceability_and_gate:
  run_scope: system
  source_sha: 44766de62b01cd4dfd6e0f8d31a033a376ca780b
  coverage: {overall: 35, p0: 75, p1: 24, p2: 100, p3: not_applicable}
  gate_decision: FAIL
  gate_type: story
  decision_mode: deterministic
  thresholds: {p0: 100, p1_minimum: 80, p1_pass: 90, overall_minimum: 80}
  execution: {tests: 1265, pass: 1265, fail: 0, skipped: 0}
  nfr: NOT_ASSESSED
  code_coverage: unknown
  burn_in: unknown
```

Workflow generated 2026-10-12 KST, testarch-trace. Whole-site approval is not granted.


## Final gate display / completed checkpoint

**FAIL** — P0 75% (required100%), P1 24% (minimum80%, PASS target90%), overall35% (minimum80%). Critical criterion belowFULL:1(SYS20). Live mixed freshness:10counted/21stale/5blocked;1live-only criterion can cap a prospective PASS atCONCERNS but cannot weakenFAIL. No waiver. Full report: `_bmad-output/test-artifacts/trace/traceability-matrix-system.md`. Release blocked until coverage improves. Priority actions: remaining actual storage faults, effective measured viewport renders, full Korean semantics/current remaining whole-site flows.
