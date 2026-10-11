---
runScope: 'system'
runKey: 'system'
targetType: 'story'
targetId: ''
targetLabel: ''
workflowStatus: 'completed'
stepsCompleted: ['step-01-load-context', 'step-02-discover-tests', 'step-03-map-criteria', 'step-04-analyze-gaps', 'step-05-gate-decision']
lastStep: 'step-05-gate-decision'
nextStep: ''
lastSaved: '2026-10-11'
workflowType: 'testarch-trace'
sourceSha: 'b2b1bc17ffe63ae57b45c6d258eedd2895364ea0'
collectionStatus: 'COLLECTED'
coverageBasis: 'acceptance_criteria'
oracleConfidence: 'high'
oracleResolutionMode: 'formal_requirements'
oracleSources: ['docs/full-site-qa-20261011/requirements.md', '_bmad-output/test-artifacts/test-design/test-design-qa.md', '_bmad-output/test-artifacts/test-design/test-design-architecture.md']
externalPointerStatus: 'not_used'
tempCoverageMatrixPath: '/tmp/tea-trace-coverage-matrix-system-2026-10-11T07-55-16-985Z.json'
---

# 전체 사이트 Traceability Report — 최종 판정 FAIL

최종 검증 소스는 `b2b1bc17ffe63ae57b45c6d258eedd2895364ea0`다. 자동 회귀1,259/1,259는 통과했지만 최신 소스의 전체 acceptance를 입증할 증거는 부족하다. BMAD 결정 엔진의 판정은 **FAIL**이며 검증 완전성에 대한 판정이다. 런타임 회귀 실패가 발견되었다는 뜻으로 해석하지 않는다.

**Engine rationale:** P0 coverage is 25% (required: 100%). 3 critical requirement(s) below FULL coverage.

판정 시간: 2026-10-11T07:57:24.100Z. collection_mode=contract_static, collection_status=COLLECTED, allow_gate=true, decision_mode=deterministic. 사용자 waiver register는 없고 인간 승인이나 예외를 창작하지 않았다. 기본 gate target story와 system run identity는 최초 Step1 그대로 유지했다.

## Oracle와 범위

사용자 요청을 전사한 `docs/full-site-qa-20261011/requirements.md`의 QA01–07 및 승인된 `_bmad-output/test-artifacts/test-design/test-design-qa.md`의 SYS01–26을 근거로 매핑했다. 요구사항 confidence high는 검사 기준의 신뢰도를 뜻한다. 구현에서 새 acceptance를 합성하지 않았다. 기존 README/아키텍처 결정은 context이며 원문을 대신하지 않는다. 알려지지 않은 설정 user_name은 machine evaluator=unknown으로 기록했다.

처음21개 수정의 실제 전체 browser 관찰 소스는 `c01e24363983cc6d594896a43cf0e883d0bef664`다.22번째 용량 초과 한국어 오류 안내를 `9a7c57f8f9f2d120210a8cd7f0507d78535637f8`에서 수정하고 실제 해당 오류/원본 보존/정상 저장 복구를 확인했다.23번째 DNGNGEN JSX key spread 경고는 `b2b1bc17ffe63ae57b45c6d258eedd2895364ea0`에서 두 rendering 경계만 수정하고 새 탭에서 이유/입구/경비/특별한 방1–4/미리보기/다시 굴리기/COPY와 console0을 실제 재확인했다. 그밖의 영역을 b2b에서 다시 방문했다고 기록하지 않았다. producer live 파일은 trace에서 읽기만 했으며 원본/키/개인 기록을 새로 공개하지 않았다.

## Coverage Summary

| 우선순위 | FULL/전체 | Workflow 반올림 비율 | 기준 충족 |
| --- | --- | --- | --- |
| P0 | 1/4 | 25% | 요구100%, NOT_MET |
| P1 | 4/21 | 19% | 최소80%/목표90%, NOT_MET |
| P2 | 1/1 | 100% | 해당 범위 FULL |
| P3 | 0/0 | N/A | 기준 없음 |
| 전체 | 6/26 | 23% | 최소80%, NOT_MET |

FULL6 / PARTIAL6 / UNIT-ONLY13 / NONE1. Machine P3 pct100은 skill safePct의 빈 분모 기본값이며 검증한 P3가100%라는 의미가 아니다. FULL 분류는 해당 criterion의 모든 시나리오가 증거로 입증되는지에 달려 있고 여러 test level의 존재 자체가 근거가 아니다.

채택한 unique evidence58(unit50/component3/API2/live3), 실제 소스 파일26, skipped/fixme/pending0. 정적 catalog109파일/1,072registrations(unit961/component103/API8) 및 runtime1,259 subtests는 다른 단위다. 직접 원문을 전사한 독립29,846개 입력·표 대조도 별도 수치다. 이 담당자는 실제 browser 실행을 주장하지 않으며 producer의 관찰을 계약에 따라 연결했다.

## Traceability Matrix

| 기준 | 부모 요구 | 우선순위 | 현재 coverage | 입증 내용과 공백 |
| --- | --- | --- | --- | --- |
| SYS-01 | QA-01 | P1 | FULL | Core PDF21/23/27/29 및 Core6/FER4/HER2의 기본 시작값 직접 대조. 모든 attachment는 SYS06의 전수 조건 공백으로 별도 유지. |
| SYS-02 | QA-01 | P1 | FULL | FER PDF2–3과 독립1,728조합. HP 본문/괄호 충돌과 동률 미지정은 추측 변경 없이 보고. |
| SYS-03 | QA-01 | P1 | FULL | SD PDF5/7–9/15/17 및 Depths PDF6/9–13/15–19/25의 해당 절차를 직접 대조. 원문이 아닌 기존 TR3–30 앱 계약은 분리. 전체 표의 모든 조건은 SYS06 범위. |
| SYS-04 | QA-01 | P1 | PARTIAL | 기존 원본 렌더11/12/85와 현재 Sources 코드는 제한 대조. fresh PDF와 전체 현재 판본을 재확보하지 못해 현재 원문 충실도는 미완료. 테스트의 sourceVerified flag를 원문으로 인정하지 않는다. |
| SYS-05 | QA-01 | P1 | FULL | Mythic PDF20/26–27/38/68/163/165/187 직접 대조 및 Chart81셀/8,100·Check8,100·Scene180. 모든 Meaning/Variation 적용은 SYS06 공백. |
| SYS-06 | QA-01 | P1 | PARTIAL | 548표/12,328행 screening은 완료. fresh originals가 없는4,394행과 모든 range/condition/translation/attachment semantic 승인 공백이 남아 있다. normalized match를 전체 규칙 승인으로 승격하지 않는다. |
| SYS-07 | QA-02,QA-03 | P1 | PARTIAL | SSR Home destination assertions establish part of the controls; the actual c01 journey is historical/stale at current HEAD. |
| SYS-08 | QA-02,QA-03 | P1 | UNIT-ONLY | Search/filter domain assertions pass at current HEAD, but the actual rendered reader/filter journey remains c01 historical/stale. |
| SYS-09 | QA-02,QA-03 | P1 | UNIT-ONLY | Linked reading, selection and invalid-TR domain guards are current automated proof; the wired UI path has only stale c01 live records. |
| SYS-10 | QA-02,QA-03 | P1 | UNIT-ONLY | Native generator and immutable translation assertions pass, but current character UI source/save/reopen was not freshly repeated. |
| SYS-11 | QA-02,QA-03 | P1 | UNIT-ONLY | Active Monster and FER numeric proof passes; the reachable active UI was observed at c01 and is stale here. Inactive legacy manual editor remains N/A, not verified. |
| SYS-12 | QA-02,QA-03 | P1 | PARTIAL | Current domain and SSR assertions plus fresh b2b live DNGNGEN reason/entrance/guard/special rooms1-4/preview reroll/console0 establish the corrected JSX key boundaries. Whole Core/native twelve-part/manual/source/save journey is c01 historical/stale. |
| SYS-13 | QA-02,QA-03 | P1 | UNIT-ONLY | Current generator and Wind regression assertions are accepted partial proof; actual remaining-generator control families were visited at c01 and are stale here. |
| SYS-14 | QA-02,QA-03 | P1 | UNIT-ONLY | Spatial link/domain assertions pass; actual map/action/pan/return/reload journey is only historical c01 proof. |
| SYS-15 | QA-02,QA-03 | P1 | UNIT-ONLY | Dice/formula boundaries pass; current rendered eight-choice/guidance/input-recovery journey lacks fresh live proof. |
| SYS-16 | QA-02,QA-03 | P1 | UNIT-ONLY | Critical/fumble/manual-HP calculation assertions pass; the combat control-family/ranged/shield/roster journey has stale c01 live evidence. |
| SYS-17 | QA-02,QA-03 | P1 | UNIT-ONLY | Fate/scene/list boundaries pass; actual current Mythic UI edit/cleanup/reload has only historical c01 live proof. |
| SYS-18 | QA-02,QA-03 | P0 | UNIT-ONLY | Current immutable snapshot assertion proves part of data preservation. Four-kind full CRUD is c01 historical/stale and the late quota/normal save recovery is9a7 historical/stale; no fresh b2b full Shelf journey. |
| SYS-19 | QA-02,QA-03 | P0 | UNIT-ONLY | Current schema/kind/date/duplicate tests establish import guards; the actual file chooser/export/append journey is only historical c01 proof. |
| SYS-20 | QA-03 | P0 | PARTIAL | Current actual-store/component and fake Quota/CAS/offline assertions establish guards. Fresh blocked producer record retains real corruption/Quota observations but contributes no coverage; actual IDB/denied/offline/CAS branches remain incomplete. |
| SYS-21 | QA-02,QA-03 | P1 | UNIT-ONLY | Memory isolation assertions pass; current rendered Tray/Scratch/Last/Pack/Recipe control paths retain only stale c01 live evidence. |
| SYS-22 | QA-02,QA-03 | P1 | PARTIAL | Backup/update domain and actual HTTP success/denial/error tests establish part of Sources. Fresh current file chooser, settings and About UI journey is missing. |
| SYS-23 | QA-03 | P1 | UNIT-ONLY | Navigation state assertion preserves current domain behavior; actual keyboard/Esc/reload/console coverage is c01 historical/stale. |
| SYS-24 | QA-04 | P1 | NONE | Three viewport walkthroughs and 32 geometry observations were genuinely completed at c01; all live responsive proof is stale at the current code HEAD and no accepted current test establishes this criterion. |
| SYS-25 | QA-05,QA-06 | P0 | FULL | Current b2b late-final tests1259/1259, related DNGNGEN30, lint/build/diffcheck success and public/private55 boundary proof; source tests/assertions and two JSX-only boundaries remain reviewable. |
| SYS-26 | QA-07 | P2 | FULL | Current report records23 fixes, original pages, latest1259 checks, local Before/After and unresolved scope; c01/9a7 historical observations and b2b limited fresh observations remain separate. |

## 기준별 채택된 증거

### SYS-01 — Core 시작 자원·능력·HP·scroll 장비·12직업 기본 보정

- `tests/rule-fidelity.test.ts:43` — unit / P1 / active / stable ID `NODE:tests/rule-fidelity.test.ts:43`: complete classless PC has essentials and scroll-dependent starting arms
- `outputs/full-site-qa-20261011/rules-private/mechanical-audit.mjs:15` — unit / P1 / active / stable ID `SOURCE-CORE-ABILITY`: Core independent ability boundaries
- `outputs/full-site-qa-20261011/rules-private/mechanical-audit.mjs:56` — unit / P1 / active / stable ID `SOURCE-CLASS-BASELINES`: Twelve independent class starting baselines

Considered and rejected: 없음. 매핑에 채택한 관련 assertions만 연결했으며 전체 catalog1,072등록의 모든 품질 검토를 주장하지 않는다.

### SYS-02 — FER A/B/C·HP·사기·방어구·동률과 원문 모순

- `tests/feretory-procedure.test.ts:62` — unit / P1 / active / stable ID `NODE:tests/feretory-procedure.test.ts:62`: The Monster Approaches rolls A/B/C once and adds only the source-defined HP die
- `tests/feretory-procedure.test.ts:94` — unit / P1 / active / stable ID `NODE:tests/feretory-procedure.test.ts:94`: Feretory damage boundaries and HP doubling follow the printed rule
- `outputs/full-site-qa-20261011/rules-private/mechanical-audit.mjs:16` — unit / P1 / active / stable ID `SOURCE-FER-ABC`: Independent 1728 A/B/C combinations

Considered and rejected: 없음. 매핑에 채택한 관련 assertions만 연결했으며 전체 catalog1,072등록의 모든 품질 검토를 주장하지 않는다.

### SYS-03 — SD/Depths 두 d20·여행·던전·TR/DR·잠금·위험 후속

- `tests/dungeon-action-moves.test.ts:89` — unit / P1 / active / stable ID `NODE:tests/dungeon-action-moves.test.ts:89`: SD searching accepts remaining Omens 0–4 and rejects invalid counts before rolling
- `tests/journey-procedure.test.ts:103` — unit / P1 / active / stable ID `NODE:tests/journey-procedure.test.ts:103`: daily road action does not repeat morning weather; fork and changed weather remain source-directed
- `tests/journey-procedure.test.ts:140` — unit / P1 / active / stable ID `NODE:tests/journey-procedure.test.ts:140`: camping compares independent d20s to DR12; failure recovery requires a distinct 50:50 retry
- `outputs/full-site-qa-20261011/rules-private/mechanical-audit.mjs:23` — unit / P1 / active / stable ID `SOURCE-SD-CRAWL`: Independent crawl outcome combinations
- `outputs/full-site-qa-20261011/rules-private/mechanical-audit.mjs:75` — unit / P1 / active / stable ID `SOURCE-SD-SEARCH`: Independent Omen searching and invalid inputs
- `outputs/full-site-qa-20261011/rules-private/mechanical-audit.mjs:95` — unit / P1 / active / stable ID `SOURCE-DEPTHS-ENEMY`: Independent fifteen enemy stat rows

Considered and rejected: 없음. 매핑에 채택한 관련 assertions만 연결했으며 전체 catalog1,072등록의 모든 품질 검토를 주장하지 않는다.

### SYS-04 — RECLVSE 두 d20·치명·질문 경계와 현재 원본

현재 채택 실행 테스트 없음. 제한된 수동 source 확인 또는 이전 버전의 관찰은 참고 범위로만 보존했다.


Considered and rejected: 없음. 매핑에 채택한 관련 assertions만 연결했으며 전체 catalog1,072등록의 모든 품질 검토를 주장하지 않는다.

### SYS-05 — Mythic Fate Chart/Check/Scene/Prepared/Event·CF

- `tests/mythic.test.ts:201` — unit / P1 / active / stable ID `NODE:tests/mythic.test.ts:201`: Fate Check uses source modifiers and exact exceptional bands without clamping
- `tests/mythic.test.ts:262` — unit / P1 / active / stable ID `NODE:tests/mythic.test.ts:262`: scene checks cover all90 combinations and do not change Chaos
- `outputs/full-site-qa-20261011/rules-private/mechanical-audit.mjs:102` — unit / P1 / active / stable ID `SOURCE-MYTHIC-CELLS`: Independent Mythic chart and outcome boundaries
- `outputs/full-site-qa-20261011/rules-private/mechanical-audit.mjs:118` — unit / P1 / active / stable ID `SOURCE-MYTHIC-SCENES`: Independent normal and prepared scenes

Considered and rejected: 없음. 매핑에 채택한 관련 assertions만 연결했으며 전체 catalog1,072등록의 모든 품질 검토를 주장하지 않는다.

### SYS-06 — 전체 표 행 범위·후속·원문 authority·번역의 전수 대조

- `tests/oracles.test.ts:81` — unit / P1 / active / stable ID `NODE:tests/oracles.test.ts:81`: Oracle validation accepts exact ranges and source
- `tests/row-relationships.test.ts:254` — unit / P1 / active / stable ID `NODE:tests/row-relationships.test.ts:254`: Self references and missing targets never become visible links
- `outputs/full-site-qa-20261011/rules-private/full-entry-audit.mjs:26` — unit / P1 / active / stable ID `SOURCE-ENTRY-PROVENANCE`: Fresh original hashes and every runtime row status

Considered and rejected: 없음. 매핑에 채택한 관련 assertions만 연결했으며 전체 catalog1,072등록의 모든 품질 검토를 주장하지 않는다.

### SYS-07 — Home 빠른 참조·굴림·copy/pin·return

- `tests/home-bilingual.test.ts:143` — component / P1 / active / stable ID `NODE:tests/home-bilingual.test.ts:143`: Home exposes real generator destinations without running a generator or requiring a session

Considered and rejected: 없음. 매핑에 채택한 관련 assertions만 연결했으며 전체 catalog1,072등록의 모든 품질 검토를 주장하지 않는다.

### SYS-08 — 검색·책/상황/유형 필터·모든 reader 종류

- `tests/reference-search-coverage.test.ts:596` — unit / P1 / active / stable ID `NODE:tests/reference-search-coverage.test.ts:596`: The actual browse surface retains trusted titles through its entries/byId registry wrapper
- `tests/full-site-qa-regression.test.ts:30` — unit / P1 / active / stable ID `NODE:tests/full-site-qa-regression.test.ts:30`: includes late supplied source references in the book summary and related list

Considered and rejected: 없음. 매핑에 채택한 관련 assertions만 연결했으며 전체 catalog1,072등록의 모든 품질 검토를 주장하지 않는다.

### SYS-09 — 하위 참조·manual dice·partial/HOLD·복귀

- `tests/reference-reading.test.ts:66` — unit / P1 / active / stable ID `NODE:tests/reference-reading.test.ts:66`: Move and fixed-lookup readings expose the selected result’s follow-up table, not an automatic reroll
- `tests/row-relationships.test.ts:238` — unit / P1 / active / stable ID `NODE:tests/row-relationships.test.ts:238`: Ambiguous fixedEntry selectors do not guess a target and malformed metadata is ignored
- `tests/full-site-qa-regression.test.ts:63` — unit / P1 / active / stable ID `NODE:tests/full-site-qa-regression.test.ts:63`: rejects invalid active Orakle threat ratings before consuming dice and permits the app input boundaries

Considered and rejected: 없음. 매핑에 채택한 관련 assertions만 연결했으며 전체 catalog1,072등록의 모든 품질 검토를 주장하지 않는다.

### SYS-10 — Core/native 캐릭터·12직업·source·reroll/save

- `tests/official-generators.test.ts:63` — unit / P1 / active / stable ID `NODE:tests/official-generators.test.ts:63`: SCVMBIRTHER scroll handling follows the published string comparison
- `tests/translation-ui-terms.test.ts:82` — unit / P1 / active / stable ID `NODE:tests/translation-ui-terms.test.ts:82`: SCVM reader normalizes companion gear while preserving English and the pack

Considered and rejected: 없음. 매핑에 채택한 관련 assertions만 연결했으며 전체 catalog1,072등록의 모든 품질 검토를 주장하지 않는다.

### SYS-11 — 현재 활성 Monster source·수치·FER/native/EPK

- `tests/official-generators.test.ts:122` — unit / P1 / active / stable ID `NODE:tests/official-generators.test.ts:122`: monster site armor follows its published C-before-B parity
- `tests/feretory-procedure.test.ts:62` — unit / P1 / active / stable ID `NODE:tests/feretory-procedure.test.ts:62`: The Monster Approaches rolls A/B/C once and adds only the source-defined HP die

Considered and rejected: 없음. 매핑에 채택한 관련 assertions만 연결했으며 전체 catalog1,072등록의 모든 품질 검토를 주장하지 않는다.

### SYS-12 — Core/native 던전·이유/경비/특별한 방1–4·개별 조작

- `tests/dngngen-translation-features.test.ts:194` — unit / P1 / active / stable ID `NODE:tests/dngngen-translation-features.test.ts:194`: full preparation connects reason, entrance, guards and every native room; individual rerolls preserve other fields
- `tests/dngngen-translation-features.test.ts:287` — component / P1 / active / stable ID `NODE:tests/dngngen-translation-features.test.ts:287`: main sheet and preview show explicit Korean helpers without repeating DNGNGEN per room
- `system-LIVE-late-dngngen-key` (producer live, file 없음) — live / P1 / active / stable ID `system-LIVE-late-dngngen-key`: Fresh DNGNGEN feature rendering and preview without key spread warning

Considered and rejected: 없음. 매핑에 채택한 관련 assertions만 연결했으며 전체 catalog1,072등록의 모든 품질 검토를 주장하지 않는다.

### SYS-13 — NPC/Room/Street/Settlement와 나머지 활성 생성기

- `tests/rule-fidelity.test.ts:137` — unit / P1 / active / stable ID `NODE:tests/rule-fidelity.test.ts:137`: Weather selects 1–3 tables and leaves unnatural follow-up optional
- `tests/rule-fidelity.test.ts:161` — unit / P1 / active / stable ID `NODE:tests/rule-fidelity.test.ts:161`: Buildings rolls d2 material count, each material and Other follow-up independently
- `tests/translation-ui-terms.test.ts:17` — unit / P1 / active / stable ID `NODE:tests/translation-ui-terms.test.ts:17`: Weather Wind keeps its UI meaning despite an unrelated table translation

Considered and rejected: 없음. 매핑에 채택한 관련 assertions만 연결했으며 전체 catalog1,072등록의 모든 품질 검토를 주장하지 않는다.

### SYS-14 — Dungeon/City/Journey map·hotspot·action·return

- `tests/spatial-oracle.test.ts:86` — unit / P1 / active / stable ID `NODE:tests/spatial-oracle.test.ts:86`: Every spatial feature resolves to an existing canonical reference with source attribution

Considered and rejected: 없음. 매핑에 채택한 관련 assertions만 연결했으며 전체 catalog1,072등록의 모든 품질 검토를 주장하지 않는다.

### SYS-15 — 일반 주사위·physical invalid·play guidance

- `tests/combat-tool.test.ts:159` — unit / P1 / active / stable ID `NODE:tests/combat-tool.test.ts:159`: Combat formula accepts bounded dice and fixed damage without evaluating expressions
- `tests/oracles.test.ts:160` — unit / P1 / active / stable ID `NODE:tests/oracles.test.ts:160`: d66 has exactly 36 legal pairs and uses tens/units d6

Considered and rejected: 없음. 매핑에 채택한 관련 assertions만 연결했으며 전체 catalog1,072등록의 모든 품질 검토를 주장하지 않는다.

### SYS-16 — 전투 계산·치명/실수/Omen·기록·Undo 및 주요 관리

- `tests/combat-tool.test.ts:266` — unit / P1 / active / stable ID `NODE:tests/combat-tool.test.ts:266`: Natural 20 doubles weapon damage before armor; record leaves HP and armor manual
- `tests/combat-tool.test.ts:292` — unit / P1 / active / stable ID `NODE:tests/combat-tool.test.ts:292`: Defence fumble previews doubled weapon damage while HP and armor stay manual
- `tests/combat-tool.test.ts:311` — unit / P1 / active / stable ID `NODE:tests/combat-tool.test.ts:311`: Defence critical only offers a free attack; it neither rolls nor applies another attack

Considered and rejected: 없음. 매핑에 채택한 관련 assertions만 연결했으며 전체 catalog1,072등록의 모든 품질 검토를 주장하지 않는다.

### SYS-17 — Mythic Odds/CF/Chart/Check/Scene/Event/list·repeat/reload

- `tests/mythic.test.ts:201` — unit / P1 / active / stable ID `NODE:tests/mythic.test.ts:201`: Fate Check uses source modifiers and exact exceptional bands without clamping
- `tests/mythic.test.ts:262` — unit / P1 / active / stable ID `NODE:tests/mythic.test.ts:262`: scene checks cover all90 combinations and do not change Chaos
- `tests/notebook-tools.test.ts:115` — unit / P1 / active / stable ID `NODE:tests/notebook-tools.test.ts:115`: Mythic allows three weighted occurrences but rejects a fourth

Considered and rejected: 없음. 매핑에 채택한 관련 assertions만 연결했으며 전체 catalog1,072등록의 모든 품질 검토를 주장하지 않는다.

### SYS-18 — Shelf4kind 생성/save/select/edit/cancel/clone/copy/deleteUndo/reload

- `tests/notebook-tools.test.ts:182` — unit / P0 / active / stable ID `NODE:tests/notebook-tools.test.ts:182`: Shelf snapshots stay independent, retaining the generated original on edit

Considered and rejected: 없음. 매핑에 채택한 관련 assertions만 연결했으며 전체 catalog1,072등록의 모든 품질 검토를 주장하지 않는다.

### SYS-19 — Shelf 실제 파일 export/import append·잘못된 입력 보존

- `tests/notebook-tools.test.ts:194` — unit / P0 / active / stable ID `NODE:tests/notebook-tools.test.ts:194`: Shelf validation rejects mismatched kinds, unknown null kinds and duplicate identities

Considered and rejected: 없음. 매핑에 채택한 관련 assertions만 연결했으며 전체 catalog1,072등록의 모든 품질 검토를 주장하지 않는다.

### SYS-20 — 손상 byte·Quota/IDB/CAS/stale update의 데이터 보호와 실제 오류 상태

- `tests/object-shelf-corruption.test.ts:7` — component / P0 / active / stable ID `NODE:tests/object-shelf-corruption.test.ts:7`: a damaged shelf blocks edits and retains the exact stored bytes and older records
- `tests/private-data.test.ts:159` — unit / P0 / active / stable ID `NODE:tests/private-data.test.ts:159`: storage failure preserves all active packs
- `tests/published-data.test.ts:497` — unit / P0 / active / stable ID `NODE:tests/published-data.test.ts:497`: cross-tab changes cause CAS rejection without advancing the server revision
- `tests/published-data.test.ts:511` — unit / P0 / active / stable ID `NODE:tests/published-data.test.ts:511`: offline errors preserve cached packs and force retry restores server checks

Considered and rejected: 없음. 매핑에 채택한 관련 assertions만 연결했으며 전체 catalog1,072등록의 모든 품질 검토를 주장하지 않는다.

### SYS-21 — Tray/Scratch/Last/Recent/Pack/Recipe·수명·clear isolation

- `tests/play-memory.test.ts:330` — unit / P1 / active / stable ID `NODE:tests/play-memory.test.ts:330`: Temporary clear is isolated from Campaign export, Pins, Recipes, Packs, Tray, Scratch and Last

Considered and rejected: 없음. 매핑에 채택한 관련 assertions만 연결했으며 전체 catalog1,072등록의 모든 품질 검토를 주장하지 않는다.

### SYS-22 — Sources backup/restore·update pause/check·About

- `tests/private-data.test.ts:176` — unit / P1 / active / stable ID `NODE:tests/private-data.test.ts:176`: private backup includes all three packs and round-trips through validation
- `tests/published-data.test.ts:544` — unit / P1 / active / stable ID `NODE:tests/published-data.test.ts:544`: paused updates skip downloads; manual check works without turning automatic checks on
- `tests/published-server.test.ts:123` — api / P1 / active / stable ID `NODE:tests/published-server.test.ts:123`: HTTP handler is read-only, sends no-store JSON and hides configuration failures

Considered and rejected: 없음. 매핑에 채택한 관련 assertions만 연결했으며 전체 catalog1,072등록의 모든 품질 검토를 주장하지 않는다.

### SYS-23 — keyboard/Esc/back/reload·visited flow console

- `tests/navigation-history.test.ts:109` — unit / P1 / active / stable ID `NODE:tests/navigation-history.test.ts:109`: Back and Forward restore selectors without adding entries or executing content

Considered and rejected: 없음. 매핑에 채택한 관련 assertions만 연결했으며 전체 catalog1,072등록의 모든 품질 검토를 주장하지 않는다.

### SYS-24 — mobile/tablet/desktop 주요 화면 layout·longtext·focus

현재 채택 실행 테스트 없음. 제한된 수동 source 확인 또는 이전 버전의 관찰은 참고 범위로만 보존했다.


Considered and rejected: 없음. 매핑에 채택한 관련 assertions만 연결했으며 전체 catalog1,072등록의 모든 품질 검토를 주장하지 않는다.

### SYS-25 — 최소 수정·원문/데이터 보존·최종 tests/lint/type/build/privacy

- `tests/public-build.test.ts:22` — unit / P0 / active / stable ID `NODE:tests/public-build.test.ts:22`: privacy boundary rejects renamed packs, secret bytes, excerpts and local paths
- `tests/public-build.test.ts:54` — unit / P0 / active / stable ID `NODE:tests/public-build.test.ts:54`: ciphertext and its matching manifest pass without embedding private plaintext or keys
- `tests/published-server.test.ts:164` — api / P0 / active / stable ID `NODE:tests/published-server.test.ts:164`: production preview shares the real API handler and never serves plaintext or SPA for API errors
- `tests/translation-ui-terms.test.ts:48` — unit / P0 / active / stable ID `NODE:tests/translation-ui-terms.test.ts:48`: companion terminology corrections require the matching English meaning and keep dice
- `system-LIVE-25` (producer live, file 없음) — live / P0 / active / stable ID `system-LIVE-25`: Final existing checks and private boundaries

Considered and rejected: 없음. 매핑에 채택한 관련 assertions만 연결했으며 전체 catalog1,072등록의 모든 품질 검토를 주장하지 않는다.

### SYS-26 — 실제 visited/source/bugs/fixes/test/gap/전후 증거의 정직한 보고

- `system-LIVE-26` (producer live, file 없음) — live / P2 / active / stable ID `system-LIVE-26`: Honest evidence report with unresolved scope

Considered and rejected: 없음. 매핑에 채택한 관련 assertions만 연결했으며 전체 catalog1,072등록의 모든 품질 검토를 주장하지 않는다.

## Gaps와 권고

Critical P0는 SYS18/SYS19/SYS20이다. SYS18의 quota 거부 후 정상 편집/저장 복구는9a7에서 입증했고 현재b2b에서는 stale이다.4종 전체 CRUD의c01관찰도 stale이며 SYS18은 UNIT-ONLY다. Fresh SYS12의 제한된 DNGNGEN 경계 재검증은 PARTIAL을 입증하지만 전체 Dungeon/Core/source-switch/save/nested 결과 절차는 현재 SHA에서 반복하지 않았다. SYS19 파일 chooser/export/import는 domain guards만 최신이며 실제 조작은 이전 SHA다. SYS20 actual corruption와 quota 관찰은 있지만 denied storage/IndexedDB 읽기·쓰기·손상/offline/CAS·stale update를 브라우저에서 주입하지 않았다. blocked aggregate를 부분 pass로 바꾸지 않았다.

High P1 NONE는 SYS24다. 실제 세 viewport 순회는 c01에서 완료됐지만 현재 HEAD의 레이아웃 관찰로 계약상 인정할 수 없다. 그밖의 PARTIAL과 UNIT-ONLY도 FULL 계산에서 제외했다. SYS04 현재 RECLVSE 원본과 SYS06 모든 표의 전문 의미·조건·범위·번역 검토는 버전과 별개로 미완료다.

원문 확보8PDF의 새 해시와 entry 분류, 핵심 독립 계산을 최종 SHA에서 다시 실행했다. 활성548표/12,328행을 상태 분류했으며 원문 확보325표/7,934행의 선언 페이지 기본 normalized match7,590(95.66%), 다른 페이지 후보97, 미일치247, fresh 원본 없는 RECLVSE223표/4,394행이다. AitC열 재추출50행과 DepthsOCR199후보를 별도 보충했고 전체 semantic 승인율로 합산하지 않았다. 직접 확인한 PDF 페이지/인쇄 페이지·모순·선택 편의 구분은 `docs/full-site-qa-20261011/report.md` 및 ignored `outputs/full-site-qa-20261011/rulebook-findings.md`에 있다.

후속 조치는 다음과 같다.

- **URGENT** — Run /bmad-testarch-atdd for 3 P0 requirements; establish fresh four-kind CRUD/file import and unfinished storage faults. 대상: SYS-18, SYS-19, SYS-20.
- **HIGH** — Run /bmad-testarch-automate to expand coverage for 1 P1 requirements; current three-viewport UI proof is missing. 대상: SYS-24.
- **MEDIUM** — Complete coverage for 6 partially covered requirements; recover RECLVSE original and complete semantic/source review without guessing. 대상: SYS-04, SYS-06, SYS-07, SYS-12, SYS-20, SYS-22.
- **HIGH** — Add E2E/component coverage and fresh actual walkthrough proof for 18 current UI journeys using the existing stack. 대상: SYS-07, SYS-08, SYS-09, SYS-10, SYS-11, SYS-12, SYS-13, SYS-14, SYS-15, SYS-16, SYS-17, SYS-18, SYS-19, SYS-20, SYS-21, SYS-22, SYS-23, SYS-24.
- **MEDIUM** — Complete current loading/empty/error/permission state proof for 18 UI journeys. 대상: SYS-07, SYS-08, SYS-09, SYS-10, SYS-11, SYS-12, SYS-13, SYS-14, SYS-15, SYS-16, SYS-17, SYS-18, SYS-19, SYS-20, SYS-21, SYS-22, SYS-23, SYS-24.
- **HIGH** — Re-record 18 live results against the commit under trace; historical records no longer count as coverage. 대상: SYS-07, SYS-08, SYS-09, SYS-10, SYS-11, SYS-12, SYS-13, SYS-14, SYS-15, SYS-16, SYS-17, SYS-18, SYS-19, SYS-21, SYS-22, SYS-23, SYS-24, SYS-18.
- **MEDIUM** — Add a re-runnable test for 1 live-only criterion; gate is capped at CONCERNS. 대상: SYS-26.
- **LOW** — Run /bmad-testarch-test-review to assess test quality; existing completed review findings are tracked separately. 대상: 기존 Test Review findings.

이 권고로 새 라이브러리를 설치하거나 요청에 없는 테스트 체계를 만들지 않았다. 기존 test-review7파일111개 실행은 통과했고 구조 rubric63/100 D Request Changes(6High/6Medium)는 별도 후속이다. 이번 채택 NODE46개의 개별 실행 시간 최대336.47775ms는90초 권고 안이며, 전체 runner의 별도 Oracle render case는190134.272375ms로90초 권고를 넘었다. 해당 case는 통과했지만 품질 경고로 기록했으며 앱 응답시간 SLA/규칙 회귀 실패로 해석하지 않는다. 첫 ignored 품질 보조 script의 모든 case90초 assertion은 이 case에서 중단됐고 실제 원본 로그를 재확인해 경고를 보존했다. 선택 소스26파일 최대731줄, actual live duration은 미기록이다. 고정 원문 기대값을 임의 변경해 점수를 올리지 않았다.

## Live Evidence와 freshness

Producer22records의 disposition은 **fresh counted3 / historical stale18 / blocked1**이며 freshness=mixed다. Counted는 SYS25 최종 검사, SYS26 정직한 보고, SYS12 late DNGNGEN rendering 경계의 제한된 실제 재검증이다. 모든 counted SHA는 최종b2b와 일치한다. blocked SYS20은9a7 소스 기록이며 status를 먼저 분류하므로 fresh fault 통과로 해석하지 않는다. fail/unverifiable/skipped/unmatched/contradicted/invalid0이다. Fresh live failure가 없으며 stale은 관찰이 허위였다는 뜻이 아니라 현재 code revision과 다른 사실을 뜻한다.

| Stable live ID | Criterion | Disposition | 실제 기록 SHA | 내용 |
| --- | --- | --- | --- | --- |
| system-LIVE-07 | SYS-07 | stale | `c01e243` | Actual Home quick references, table/roll, COPY/PIN/HOLD, invalid manual dice and recovery. outputs/full-site-qa-20261011/browser-main.json; browser-root-summary.md. |
| system-LIVE-08 | SYS-08 | stale | `c01e243` | Actual all 9 book, 8 context, 7 type filter choices; empty/no-match/Korean/accent search; book/region/creature/rule/table/procedure readers. browser-main.json; storage-follow-ups.md. |
| system-LIVE-09 | SYS-09 | stale | `c01e243` | Actual Room Contents to Searching/corpse/trinkets, Names endpoints and invalid values, Orakle likelihood/TR boundaries, partial/HOLD and table/back state retention. browser-main.json; browser-root-summary.md. |
| system-LIVE-10 | SYS-10 | stale | `c01e243` | Actual Classless/random/all12 classes, SCVMBIRTHER/homebrew, current vs next source, reroll/save/reopen; public/unavailable native fallback on5532/5533. Sacred scroll and trap terminology seen; tongs not selected. browser-main.json. |
| system-LIVE-11 | SYS-11 | stale | `c01e243` | Actual FER A/B/C/native and EPK7 regions/hunting d8/d10/d12, source/result stat relationships. Legacy manual-stat screen is not an active reachable current function and is N/A to the current-site browser scope, not live verified. browser-main.json; browser-root-summary.md; source/component regressions separately. |
| system-LIVE-12 | SYS-12 | stale | `c01e243` | Actual12 fields and individual controls, Core/DNGNGEN current/pending source, manual reason/entrance guard kept across special rooms1-4, native Korean details without repeated DNGNGEN result labels, nested table/manual errors/save/return. browser-main.json. |
| system-LIVE-13 | SYS-13 | stale | `c01e243` | NPC7regions/7parts/HOLD, Room2parts, Street small/large1-2 contents/no-exit, Settlement, Weather1-3/4tables/Wind, Buildings, Names, ActionTheme, Cult9parts, Adventure4parts; actual generation/copy/source/repeat. browser-main.json. |
| system-LIVE-14 | SYS-14 | stale | `c01e243` | Actual75 links,70 random rolls,12 place-action controls across Dungeon/City/Journey; static/source-only branches distinguished, pan/zoom/keyboard/return/reload. outputs/full-site-qa-20261011/browser-spatial.md; spatial-coverage.json88 observations. |
| system-LIVE-15 | SYS-15 | stale | `c01e243` | Actual8 die choices, count/modifier clamps/empty defaults, power/rest/infection/food/overload guidance, Core/SD physical dice natural1/20/invalid and recovery. browser-tools.md. |
| system-LIVE-16 | SYS-16 | stale | `c01e243` | Actual attack/defense/natural20/1/Omen/morale/HP/UndoRedo/reload, ranged10+Presence2 threshold and damage3, armor quick tiers0-3, shield cancel/commit0/Undo, added/duplicated/removed/off-participation combatants and cleared attacker. Not every Cartesian combination. browser-tools.md; browser-root-summary.md. |
| system-LIVE-17 | SYS-17 | stale | `c01e243` | Actual9Odds/CFbounds/Chart endpoints/doubles100exclusion, Check/Scene/Prepared/Event/Meaning/list3kinds/zone/duplicates/Thread edit/cleanup/history20/reload. All81x100 mathematical cases are independent automated evidence. browser-tools.md. |
| system-LIVE-18 | SYS-18 | stale | `c01e243` | Actual all4 kinds(character/NPC/dungeon/city) generated/saved/selected. Each kind edit-cancel-save/name-body/copy/clone/deleteUndo/reload, counts and original-source disclosures retained. Root supplemented character/dungeon/city on127.0.0.1; other producer NPC onlocalhost. Stale-error close-normal-save-reopen and Combat-to-Shelf retested. browser-main.json; browser-root-summary.md; storage-findings.md; storage-follow-ups.md. |
| system-LIVE-19 | SYS-19 | stale | `c01e243` | Actual downloaded JSON reimport appended; wrongkind, oversize10MB and combined200 rejection kept prior records. Normal export/import after guard fixed. browser corruption branch is not included in this pass. storage-findings.md. |
| system-LIVE-20 | SYS-20 | blocked | `9a7c57f` | Actual browser corrupted Shelf bytes→persistent error/disabledExport→exactrawrestore/allrecords recovered. Actual153QAquota keys→QuotaExceededError/save rejected/oldrawidentical; localizedKorean text after latefix/QAkeys removed/normal save recovered. Deniedstorage/IDB corruption/offline/CAS races not injected. browser-main.json; live-storage-fault-metadata.json; browser-root-summary.md. This aggregate remains blocked rather than claiming all fault branches passed. |
| system-LIVE-21 | SYS-21 | stale | `c01e243` | Actual Tray search/duplicate/remove, Scratch multiline/SEND/open/copy/reopen/reload, Recent copy/source/replay/removed recipe blocked, Pack/Recipe create/edit-cancel/order/HOLD/run/activate/reload/delete. Temporary lifetime help now matches observation. storage-findings.md; browser-main.json. |
| system-LIVE-22 | SYS-22 | stale | `c01e243` | Actual Sources auto-update on/off/check, downloaded full backup/restore/reload, malformed JSON/wrongkind/duplicate/filecount/20MiB rejection and exact pre/post invalid backup bytes; About/license/source links read, external sites not opened. storage-findings.md; storage-follow-ups.md. |
| system-LIVE-23 | SYS-23 | stale | `c01e243` | CtrlK/R/input isolation/Esc, linked/back/close/reload in visited journeys; final root console0error0warning and producer logs0errors. No all-engine assertion. browser-main.json; root-console.json; tools-console/spatial-console evidence. |
| system-LIVE-24 | SYS-24 | stale | `c01e243` | Actual360x800/768x1024/1440x900 Home/generators/longreaders/tables/map/all4docks/Sources, mobileScratch. Three responsive fixes same-size checked;32 geometry observations; document no unintended horizontal overflow; viewport reset. responsive-layout.json; screenshots. |
| system-LIVE-25 | SYS-25 | counted | `b2b1bc1` | Executed on b2b1bc1 final source: tests1259/1259pass, fail/cancel/skip/todo0, duration204221.255875ms; lint exit0; client/servertypes+Vitebuild/public55/private55files exit0; gitdiffcheck0. DNGNGEN related30pass. Previous stagedGitprivacy950paths8ignored86unchangedshared passed; final updated artifact-stage privacy will run before publication. outputs/full-site-qa-20261011/late-final-tests.log; late-final-lint.log; late-final-build.log; late-dngngen-tests.log. |
| system-LIVE-26 | SYS-26 | counted | `b2b1bc1` | Producer report docs/full-site-qa-20261011/report.md records actual visited paths, source pages,23confirmed fixes, latest1259pass checks, local BeforeAfter, missing original/semantic/IDB/denied/CAS/device evidence, owner production login smoke missing, and historical c01/9a7 vs fresh b2b DNGNGEN observations. Final current Trace verdict will be updated after workflow; no whole-source or full current live rerun claimed. |
| system-LIVE-late-shelf-quota | SYS-18 | stale | `9a7c57f` | Actual same quota condition after late Korean text change: save rejected, oldrawexact; cleaned153QAkeys+backup, existing record edited/saved successfully, editorclosed,alert0,all7counts retained. Historical all4kind CRUD remains at c01, not freshly repeated here. browser-main.json shelf-live-quota-korean-error-after and shelf-quota-cleanup-normal-save-recovery; live-storage-fault-metadata.json. |
| system-LIVE-late-dngngen-key | SYS-12 | counted | `b2b1bc1` | Actual late error reproduced in existing e7 code, key/text/ko explicit boundary fix; rendered DOM unchanged through HMR. Fresh new tab after fix and committed b2b source generated reason/entrance/guard/all4rooms/main+preview, whole and three individual rerolls preserve other room, COPY contains fields, fresh console0. Only this subset of SYS12 is fresh; earlier full Dungeon/Core/source-switch/save/nested table coverage stays historical c01. outputs/full-site-qa-20261011/dngngen-late-proof.json; dngngen-late-before-console.json; dngngen-late-after-console.json. |

비채택19 records(stale18/blocked1)는 이름과 이유를 machine blockers에 남겼다. 활성 채택 tests만으로 live-only를 다시 계산하니 SYS26 하나다. 이러한 증거만으로 PASS를 줄 수 없어 최대 CONCERNS 제한이 있지만 이 판정은 P0 부족으로 이미 FAIL이며 cap가 FAIL을 올리지 않는다. 공식 요구 oracle의 optional machine ui_journey_status/ui_state_status는 contract상 not_applicable이고 이것이 UI 전체가 정상이라는 의미는 아니다. 실제 부족한18 UI journey/state 목록은 coverage-matrix의 advisory heuristics에 보존했다.

## 검증 및 실행 무결성

최종 `late-final-tests.log`: tests1259/pass1259/fail0/cancelled0/skipped0/todo0/duration_ms204221.255875. late-final-lint/build 성공, 클라이언트·서버 type 검사 성공, public/private55파일 경계 성공, diffcheck 성공. 기존 청크 크기 경고는 성능 합격이나 실패로 바꾸지 않았다. NFR/SLA/물리 기기·전 OS/browser engine·production 복구 증거는 없다.

Test Design은5steps를 완료했고 Trace도 full read→resolve→각 checkpoint 저장→collection 재분류→criterion 매핑→Phase1 exact tempfile→Step5 deterministic engine의 순서로 실행했다. 이전9a7 완료 run을 ignored trace-history-9a7c57f로 보존하고 이번b2b run의 Step1부터 새 working notes를 만들었다. 이전 stepsCompleted나 수치를 이어 붙이지 않았다. 새 catalog1,072등록의 stable metadata/hash는 이전과 같음을 검증했지만 source audit 및 producer live freshness는 최신 SHA에서 재실행했다. 누락을 완료로 표시하지 않았다.

Step4에서는 auto/probe=true를 실제 collaboration subagent 가능 여부로 해결하고 기존 storage 담당자에게 독립 count/dedup/live-only 확인을 위임했다. 그 결과가 합치한 뒤 merge했다. Phase2는 새 matrix를 계산하지 않고 frontmatter에 기록된 exact tempCoverageMatrixPath만 읽었다. 제공 Step5 JavaScript decision blocks0–7을 resolved 변수로 그대로 실행했고 gate를 사람이 고쳐 쓰지 않았다. Waiver register는 없으므로 예외 적용/승격은 없다.

## 산출물과 재현

- `traceability-mapping-system.json`:26criterion과 모든 stable mapping/flags/source references.
- `coverage-matrix-system.json`:Phase1과 temp matrix의 보존본.
- `e2e-trace-summary-system.json`:schema0.3.0, 최신SHA/freshness/counts/coverage/FAIL.
- `gate-decision-system.json`:schema0.1.0, 정확한 engine rationale와 gate 신호.
- `gate-report-system.json`:coverage와 gate report 전체.
- `test-inventory-system.json`:정적 발견1,072 registrations, 실제 runner와 분리.
- `trace-workflow-checkpoints-system.md`:Step1–4의 단계별 context/collection checkpoint 기록.
- `docs/full-site-qa-20261011/report.md`:실제 방문/23수정/원문/BeforeAfter/검사/한계 사용자 보고.

원문 private scripts/extraction/hash/row별 metadata, 실제 화면/console/fault 로그 및스크린샷은 ignored `outputs/full-site-qa-20261011/`에 유지한다. 머신 산출물에는 원문 전문·자료 키·개인 저장 내용을 넣지 않았다. Hooks resolver의 workflow.on_complete는 비어 있으며 완료 후 마지막 terminal resolver 확인으로 마친다.


## 최종 Gate Decision Summary

```text
GATE DECISION: FAIL
P0:25% required100% NOT_MET; P1:19% minimum80% NOT_MET; Overall:23% minimum80% NOT_MET.
Rationale: P0 coverage is 25% (required: 100%). 3 critical requirement(s) below FULL coverage.
Live freshness:mixed counted3/stale18/blocked1; live-only1; critical gaps3.
Full-site verification approval remains BLOCKED until coverage improves; executed regressions1259/1259 PASS.
```
