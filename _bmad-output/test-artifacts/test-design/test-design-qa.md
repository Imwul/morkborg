---
runScope: 'system'
runKey: 'system'
workflowStatus: 'completed'
totalSteps: 5
stepsCompleted: ['step-01-detect-mode', 'step-02-load-context', 'step-03-risk-and-testability', 'step-04-coverage-plan', 'step-05-generate-output']
lastStep: 'step-05-generate-output'
nextStep: ''
lastSaved: '2026-10-11'
workflowType: 'testarch-test-design'
inputDocuments: ['docs/full-site-qa-20261011/requirements.md', 'README.md', 'docs/freeform-reference-audit.md', 'docs/rule-sources.md', 'docs/personal-hosted-site.md', 'package.json', '_bmad/config.toml', 'test-design-progress-system.md']
---

# Test Design for QA: 전체 사이트 품질 감사

목적: 기존 기능의 실제 브라우저 검사와 원문/자동 회귀 증거를 합치는 실행 계획이다.
날짜: 2026-10-11 · 작성: Codex 룰북/TEA 감사 담당 · 프로젝트: codex.
상태: 계획 작성 완료; 사이트 검증 진행 중. 관련: `test-design-architecture.md`.

## Executive Summary

공식 acceptance QA-01–QA-07 모두를 검사 대상으로 둔다. 7개 위험 중 점수6은4개다. 계획26개는 P0 4개, P1 21개, P2 1개, P3 0개이며 **실행한 test case 수가 아니다**. 범위에 따른 남은 수동 검토는 약0.5–1.5주(1명 full-time)로 추정할 뿐 완료 약속이 아니다.

## Not in Scope

신규 기능/디자인 개편/새 규칙/새 framework는 사용자가 제외했다. 모든 기존 주요 기능은 범위에 남는다. 원본 부재, 지원되지 않는 실제 viewport나 IDB fault injection은 제외로 승인된 항목이 아니라 미확인 gap이다. Production Vercel auth/TLS/load/failover는 로컬 환경의 증거로 검증할 수 없다.

## Dependencies & Test Blockers

R-01 원문 미확보, R-05 geometry별 브라우저 결과, R-06 최종 regression은 전체 완료 판정을 막지만 이미 가능한 검사는 계속한다. 기존 app/server가 `127.0.0.1:5530`에서 실행되고 저장 담당은 독립 `localhost:5530`를 사용한다.

QA infrastructure: 현 `node:test`+`tsx`, fixed/manual dice, synthetic disposable record fixtures, source-private extraction/metadata, CUA in-app browser. 원문/자료 키/실사용 저장 내용을 출력하거나 새 framework를 설치하지 않는다. Pact 관련 패키지·artifacts·broker가 없고 utilities 설치 gate도 충족하지 않아 해당 예시/계약 branch는 N/A이다. 사전 상태 조작은 실제 사용자 기록에 하지 않는다.

## Risk Assessment

| Risk ID | Category | Score | QA Test Coverage |
| --- | --- | ---: | --- |
| R-01 | BUS | 6 | SYS-01–06 원문 독립 대조, SYS-09–12/17 실제 연결, SYS-26 한계 보고 |
| R-02 | DATA | 6 | SYS-18–20 정상 파일/invalid rejection/byte 보존 |
| R-03 | TECH | 6 | SYS-21 same-flow before/after |
| R-06 | SEC | 6 | SYS-25 existing test/lint/build/privacy |
| R-05 | TECH | 4 | SYS-07/08/13/14/23/24 actual flow/layout |
| R-07 | DATA | 4 | SYS-20/22 stale/corrupt/cache boundary, 미측정 환경 분리 |
| R-04 | BUS | 3 | SYS-16 manual natural20/1 결과와 안내 일치 |

R-01 QA mitigation: 확보8책 fresh hash/extraction와 직접 원문 페이지·독립 숫자 입력 대조, old-render RECLVSE의 제한 범위 명시, 모든 미대조 family를 gap으로 유지한다. 담당 룰 감사, 최종 trace 전. 새 수치 결함이 확정되지 않으면 계산식을 바꾸지 않는다.

## NFR Test Coverage Plan

| NFR | Requirement / Threshold | Planned validation | Tool / Level | Evidence Artifact | Priority |
| --- | --- | --- | --- | --- | --- |
| SEC | 평문/키 유입 금지 | current build/privacy/hosted pack boundary | existing build/Integration | 최종 build/privacy 로그 | P0 |
| Data/Reliability | rejected write/import 뒤 기존 기록 유지 | damaged fake store/CAS/정상 파일 append와 UI 실패 후 count | Node Integration + CUA | storage-findings 및 관련 test log | P0 |
| TECH/QoE | 클릭 결과·상태·좁은 화면 사용 가능 | 실제 경로·same-flow 수정 전후·console·geometry | CUA UI/E2E | browser-main/browser-tools/screenshots | P1 |
| Maintainability | existing checks 유지 | test/lint/type/build 결과 | existing runner/static | 최종 검사 로그 | P0 |
| Performance/SLA/RTO/RPO | UNKNOWN | 수치를 창작하지 않고 미측정 표시 | N/A | 명시된 report gap | N/A |

최종 NFR PASS/CONCERNS/FAIL은 이 계획에서 결정하지 않는다.

## Entry Criteria

- [x] 공식 사용자 acceptance와 기존 아키텍처 맥락 확인.
- [x] 신뢰 가능한 clone, 현 server, 기존 runner, 원본/private 자료 접근 가능.
- [x] origin/파일 소유 분리 및 실제 개인 기록을 손상시키지 않는 정책.
- [ ] 원본/geometry/오류 주입 공백의 증거 확보(해당 branch의 검사만 미완료).

## Exit Criteria

- P0 pass100%, P1 pass≥95%; 미해결 P0/P1 기능 결함 없이 각 수정 same-flow browser와 related regressions.
- 점수≥6 완화 증거 및 existing build/lint/privacy 결과.
- 기술 coverage 최소80%는 일반 gate 목표이나 사용자 전수 완료에는 요구된 모든 major surface의100% 실제 방문 증거가 필요하다.
- 없는 source/measurements는 명시 gap으로 남기며 test count만으로 UI/전수 원문 PASS를 주장하지 않는다.

## Project Team

조정자 `/root`: 주요 UI/통합/최종 회귀; `browser_play_tools`: dice/combat/Mythic UI; `storage_audit`: 저장·파일 왕복; `rulebook_audit`: source-independent 수치 대조 및 BMAD 산출물. 사람 PM/Dev 팀 이름이나 승인 기록은 만들어 넣지 않는다.

## Test Coverage Plan

P0/P1/P2/P3는 우선순위이며 실행 시기가 아니다. 원문/수학 검사와 실제 UI 입력·상태 검사는 서로 다른 관찰 대상이다.

### P0 (Critical)

Criteria: 데이터 무결성/비공개 경계 손상이며 사이트 결과를 대신할 안전한 우회가 없다.

| Test ID | Requirement | Test Level | Risk Link | Notes |
| --- | --- | --- | --- | --- |
| SYS-18 | QA-02/03 | UI/E2E | R-02 | Shelf 모든 kind 생성/save/select/edit cancel/save/duplicate/copy/delete/undo/reload |
| SYS-19 | QA-02/03 | UI/E2E | R-02 | Shelf export 실제 파일→import append·invalid/크기/count/kind 실패 뒤 기존기록 유지 |
| SYS-20 | QA-03 | Integration | R-02, R-07 | 손상 byte/Quota/IDB/CAS/stale update에서 덮어쓰기 금지 |
| SYS-25 | QA-05/06 | Integration + static/build | R-06 | 최소 수정/원문 불변·전체 Node/lint/type/build/privacy |

Total P0: 4 계획 항목.

### P1 (High)

Criteria: 핵심 reader/generator/calculator 및 빈번한 흐름이며 수동 책 사용은 사이트 결과를 대신하지 못한다.

| Test ID | Requirement | Test Level | Risk Link | Notes |
| --- | --- | --- | --- | --- |
| SYS-01 | QA-01 | Unit + source audit | R-01 | Core 자원·능력치·HP·scroll 장비·직업 보정 원문 경계 |
| SYS-02 | QA-01 | Unit + source audit | R-01 | FER A/B/C·HP·사기·방어구와 동률/모순 설명 |
| SYS-03 | QA-01 | Unit + source audit | R-01 | SD/Depths 여행·던전·TR/DR·lockpick·위험 후속 |
| SYS-04 | QA-01 | Unit + source audit | R-01 | RECLVSE 두 d20 치명/질문 경계와 missing PDF 한계 |
| SYS-05 | QA-01 | Unit + source audit | R-01 | Mythic Chart/Check/Scene/Prepared/Event와 CF |
| SYS-06 | QA-01 | Integration + source audit | R-01 | 전체 표 행 범위·nested ref·책/지역/원문 authority 구분 |
| SYS-07 | QA-02/03 | UI/E2E | R-05 | Home 빠른 참조→표/굴림→copy/pin→돌아오기 |
| SYS-08 | QA-02/03 | UI/E2E | R-05 | 검색 빈/없는결과·책/유형/상황 필터→rule/table/book/region/creature reader |
| SYS-09 | QA-02/03 | UI/E2E | R-01 | procedure nested linked ref→독립 roll/manual/partial hold→return |
| SYS-10 | QA-02/03 | UI/E2E | R-01 | character classless/class/Core/native source 선택·다시굴림·한국어/원문 |
| SYS-11 | QA-02/03 | UI/E2E | R-01 | monster source·외형/자동값 연동·수동 수정 유지 |
| SYS-12 | QA-02/03 | UI/E2E | R-01 | dungeon Core/native reason/guard/special4·개별 reroll·표 연결 |
| SYS-13 | QA-02/03 | UI/E2E | R-05 | NPC/room/street/settlement와 supplementary generator 정상 입력/결과 |
| SYS-14 | QA-02/03 | UI/E2E | R-05 | dungeon/city/journey 공간 그림→hotspot reader→return |
| SYS-15 | QA-02/03 | UI/E2E | R-01 | 일반주사위 면/개수/보정·invalid physical dice·play guidance |
| SYS-16 | QA-02/03 | UI/E2E | R-04 | combat natural20/1/방어/Omens→계산→기록/undo; 안내 일치 |
| SYS-17 | QA-02/03 | UI/E2E | R-01 | Mythic Odds/CF/Chart/Check/Scene/Event/list edit/reload/invalid |
| SYS-21 | QA-02/03 | UI/E2E | R-03 | Tray/Scratch/Last 읽기·send·copy·clear·reload 수명 |
| SYS-22 | QA-02/03 | UI/E2E | R-07 | Sources 자동갱신 pause/check·자료 backup/restore 취소/invalid·About |
| SYS-23 | QA-03 | UI/E2E | R-05 | Esc/shortcut/back/reload와 visited flow console 오류 |
| SYS-24 | QA-04 | UI/E2E | R-05 | 주요 reader/generator/tools/Shelf mobile/tablet/desktop clipping·focus·long text |

Total P1: 21 계획 항목.

### P2 (Medium)

Criteria: 보완 보고의 품질과 좁은 영향 범위다.

| Test ID | Requirement | Test Level | Risk Link | Notes |
| --- | --- | --- | --- | --- |
| SYS-26 | QA-07 | Artifact review | R-01, R-05 | 실제 visited list·전후 증거·source pages·불확실/미측정 report |

Total P2: 1 계획 항목.

### P3 (Low)

Criteria: 이번에 독립 계획 항목 없음; reachable legacy가 발견되면 같은 기준으로 검토한다.

| Test ID | Requirement | Test Level | Risk Link | Notes |
| --- | --- | --- | --- | --- |

Total P3: 0 계획 항목.

## Execution Strategy

PR/현재 감사: 기존 모든 functional tests가15분 미만이면 모두 실행한다. 수정된 critical 경로를 먼저 직접 확인하되 별도의 복잡한 CI tier를 만들지 않는다. 기존 Node runner·lint/build/privacy를 사용하며 실제 CUA는 독립 증거다.

Nightly: 장시간 performance suite 없음, 새 load/schedule 추가 N/A.
Weekly: chaos/failover suite 없음, 새 infrastructure 추가 N/A. 원문/기기 공백은 보고 후 남은 검사로 유지한다. 기존 Playwright browser scripts는 이 CUA 실행의 결과가 아니며 이번에 미실행한 파일은 통과로 세지 않는다.

## QA Effort Estimate

| Priority | 계획 항목 | 수동 QA 남은 추정 범위 | Notes |
| --- | ---: | --- | --- |
| P0 | 4 | 약2–5시간 | 기존 runner/normal browser와 환경 경계 |
| P1 | 21 | 약18–45시간 | 미대조 전체 원문 확인이 포함돼 넓은 범위 |
| P2 | 1 | 약2–5시간 | 실제 증거/미확인 보고 |
| P3 | 0 | 약0–2시간 | 새롭게 발견되는 legacy branch 여유 |
| Total | 26 | 약22–57시간 / 약0.5–1.5주 | 1명 full-time, 원본/geometry 확보 여부에 따라 달라짐 |

이미 사용한 시간·오늘의 완료 예정이 아니다. DevOps/새 구현/새 framework 비용은 포함하지 않는다.

## Implementation Planning Handoff

기존 최소수정 R-02/R-03/R-04는 소유 담당이 정해져 있다. 새 epic/story나 신규 feature 개발은 N/A; 상세 전달은 `codex-handoff.md`.

## Tooling & Access

CUA browser와 원본 PDF/기존 private cache는 준비돼 있다. RECLVSE 현재 PDF, 실제 production 인증, 미지원 geometry/fault injection은 pending evidence이다. 이 계획을 이유로 설치/권한 변경/배포를 수행하지 않는다.

## Interworking & Regression

| Component | 영향 | Regression scope | Validation |
| --- | --- | --- | --- |
| SavedObjectsPanel / notebookTools | export guard | object-shelf-corruption/notebook-tools/private-data | byte 보존과 정상 실제 file append |
| ReferenceWorkbench / convenience | existing panel 연결 | convenience-discovery/layer/play-memory/navigation | NPC send→Scratch 읽기/reload/cancel |
| CombatPanel | stale 안내 | combat-tool/context | natural20/1·armor/Omen·record HP 유지 |
| rule/pack boundary | immutable authority | rule-fidelity/generation-authority/hosted-generators/public-build | source 비교와 final privacy |

새 변경/실패가 없으면 검사를 불필요하게 반복하지 않는다. 각 담당자 보고와 최종 git diff를 같은 revision 기준으로 맞춘다.

## Appendix A: Code Examples & Tagging

새 테스트 scaffolding은 N/A. 기존 `npm test`, `npm run lint`, `npm run build`, `npm run privacy:private` 및 관련 test 파일 실행을 유지한다. 식별자 SYS는 보고용 매핑이며 기존 테스트 제목에 자동 태그가 있다고 주장하지 않는다. Playwright/Pact 예시 import는 설치 gate가 닫혀 있어 생성하지 않았다.

## Appendix B: Knowledge Base References

실제로 읽은 system 지식: ADR readiness, nfr-criteria, test-levels-framework, risk-governance, test-quality, playwright-cli, test-priorities-matrix. 완전한 활성화/input 기록과 각 checkpoint는 `test-design-progress-system.md`에 있다.


## 2026-10-12 Final Playability — Edit-mode supplement

This section supplements the existing approved plan without changing historical SYS acceptance or TraceFAIL. Initial HEAD9373481 changes only reports after validated44766de. Workflow edit target selected from the user's autonomous request: this existing QA plan. Activation resolver/core+TEA config and both edit step files were read; no new Create/system run or agent delegation is claimed.

Current unresolved issues are classified as (1) reproducible functional/rule defects, (2) probable play UX friction, (3) low-probability high-impact data/wrong-rule risks, (4) evidence-only gaps. Category4 stays unverified but does not cause speculative code. Prior1265suite and223/4394source audit are reused; only final required regression and newly changed situations are rerun.

| Risk | Impact / likelihood rationale | Actual planned evidence |
|---|---|---|
| Wrong source/move/armor/casting or forced optional step | High impact; similar names and mixed reference navigation recur | Explicit Core+SD main play; separate Mythic/RCL scenarios; current source pages only for used rules |
| Scene/result lost during reference/tool transitions | Frequent lookup within play, high interruption cost | Action chronicle; actual Back/PIN/Recent/Tray/Scratch return and identical saved result comparison |
| Saved data lost during refresh, stale pack update or rejected write | Lower likelihood, high impact | Reuse SYS18/19 proven cases; isolated-origin QA only; narrow actual save/resume and code/established tests for SYS20 risk selection |
| Unusable narrow reader/combat/dock | Requested viewport tool was ineffective previously | Verify innerWidth/height, visualViewport and screenshot pixels before accepting any size; alternative measured rendering explicitly separated from real mobile |

Main scenario: create one Core character with a class; choose minimum adventure setting/goal; SD exploration result determines further table, encounter and response; Core combat/HP/Omen/rest; actual saved-object resume. All authored narrative is QA fiction, not an added official table. Natural RNG is separated from explicit critical/fumble/extra-system scenarios.

Cases FP-A character+source+constraints; FP-B chained exploration+mandatory/optional links; FP-C reaction/combat/Omen/HP/recovery; FP-D scene search/Back/PIN/Recent/Tray/Scratch/save/reload; FP-E explicit independent Mythic and RCL; FP-V measured360x800,768x1024,1440x900,3440x1440 requests/effective results; FP-R only useful reliability deltas. Count actual clicks, search submissions, content transitions and Back separately. Time is observed wall interval, never human task performance.

Fix only reproduced P0/P1, and narrow demonstrated P2 with same-situation replay. Record P3 and evidence-only gaps without code. No framework install or all-combinations browser repetition. Final current full suite/type/lint/production build/privacy required by user; focused meaningful regressions for changes. Cleanup independent QA state and tabs, never user's data.


Edit-mode completion evidence (2026-10-12): actual Core+SD continuous play and distinct combat/Mythic/RCL checks are recorded in `docs/final-playability-20261012/report.md`. Five narrow changes address observed continuity, Scratch completeness, hidden explicit access, six wrong species links, and spatial target width. Real360/768/1440/3440 dimensions and full-page capture pixels were recorded; this supplements selected SYS24 evidence without a fresh formal TracePASS. Actual Back/Forward was tested after the candidate-link change; historical export/import and SYS18/19 faults were reused, not reenacted. SYS20 remains PARTIAL. All saved QA objects, Pins, Tray, Scratch, Last and combat fiction were cleared through the isolated origin's UI; local evidence and source caches stay private. No human study or new Test Review/Trace execution is claimed.

The historical registry baseline was preserved. A separate current baseline records the six verified link changes, and a strict regression proves that reversing only those six targets restores the entire historical hash; existing count/file/nonmutation assertions remain strict. This is an evidence-backed source correction, not an arbitrary expected-value relaxation. Workflow on_complete is resolved separately; final commands/results appear in the report.

Completion: workflow.on_complete resolver was executed on2026-10-12 and returned an empty string; no further hook applies.
