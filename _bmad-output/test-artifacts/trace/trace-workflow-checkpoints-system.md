---
runScope: 'system'
runKey: 'system'
targetType: 'story'
targetId: ''
targetLabel: ''
workflowStatus: 'in-progress'
stepsCompleted: ['step-01-load-context', 'step-02-discover-tests', 'step-03-map-criteria', 'step-04-analyze-gaps']
lastStep: 'step-04-analyze-gaps'
nextStep: '/Users/imwul/.agents/skills/bmad-testarch-trace/steps-c/step-05-gate-decision.md'
lastSaved: '2026-10-11'
workflowType: 'testarch-trace'
collectionStatus: 'COLLECTED'
sourceSha: '9a7c57f8f9f2d120210a8cd7f0507d78535637f8'
coverageBasis: 'acceptance_criteria'
oracleConfidence: 'high'
oracleResolutionMode: 'formal_requirements'
oracleSources: ['docs/full-site-qa-20261011/requirements.md', '_bmad-output/test-artifacts/test-design/test-design-qa.md', '_bmad-output/test-artifacts/test-design/test-design-architecture.md']
externalPointerStatus: 'not_used'
tempCoverageMatrixPath: '/tmp/tea-trace-coverage-matrix-system-2026-10-11T07-28-47-443Z.json'
---

# Traceability Matrix & Gate Decision — 전체 사이트 QA

## Step 1 — Coverage oracle와 범위

공식 사용자의 전체 사이트 acceptance를 QA-01–QA-07로 전사한 `docs/full-site-qa-20261011/requirements.md`가 최우선 oracle이다. 현 source에서 synthetic 요구를 만들지 않았다. Oracle confidence high는 무엇을 검사해야 하는지의 신뢰도이며 사이트가 모두 정확하다는 신뢰도가 아니다.

체크포인트가 없어서 새 Create run이다. story/epic/release/hotfix의 개별 target은 없으므로 `runScope/runKey=system`, targetId/targetLabel은 비운다. gate type은 workflow default `story`를 유지한다. “No story, epic, release, or hotfix target could be resolved; this run is scoped to system.”

Test-design의 두 system 문서와 handoff를 읽었다. 현재 NFR assessment 파일은 없다. README/freeform-reference-audit/rule-sources/personal-hosted-site의 결정은 context이며 원문 증거와 구분한다. 외부 tracker/pointer 및 API spec oracle은 선택하지 않았다.

Step 1의 closed knowledge set인 test-priorities-matrix, risk-governance, probability-impact, test-quality, selective-testing을 모두 읽었다. test-design에서 이미 읽은 fragment는 중복 로딩하지 않았다. 위험 score는 우선순위와 별도이며 실제 gate는 trace Step 5의 coverage 엔진을 따른다.

기존 Node test runner와 실제 CUA browser 증거는 존재한다. 현재 브라우저와 최종 회귀 수집은 진행 중이며 수집되지 않은 전체 조건을 PASS로 처리하지 않는다. 원문 full text와 비공개 key는 matrix나 public 보고에 넣지 않는다.


## Step 2 — 테스트 탐색 (수집 진행 중)

`rg --files tests -g '*.test.*'`로109파일을 발견하고 TypeScript AST로1,072개 정적 test 등록을 카탈로그했다. `test-inventory-system.json`에 안정된 file:line ID, 제목, 실제 assertion 방식의 level, skip/pending/fixme source flag, 직접 callback assertion 수, 등록 소스 해시를 기록했다. Unit961 / server-render component103 / 실제 HTTP API8이며 정적 파일을 실제 브라우저 E2E로 분류하지 않았다. 반복 등록의 source registration 수는 final runner의1,259개 runtime subtest와 다르다. 등록 ID/제목만으로 acceptance 충족을 인정하지 않고 Step3에서 관련 행동과 assertion을 연결한다.

현재 최신 `verified-tests.log`에서1,259 pass/0 fail/0 skip/0 todo, duration_ms195675.729791를 확인했다. `verified-lint.log`와 `verified-build.log`는 성공했고 build는55 static files의 public privacy와 private boundary를 통과했다. 기존500kB chunk 경고는 성공 검사와 구분한다. 최종 source code commit 및 실제 producer의 live manifest를 기다리고 있다. 이 문단은 Step2의 중간 저장이며 stepsCompleted와 nextStep은 이동하지 않는다. trace는 live manifest를 생산하지 않고 시스템을 실행해 live 결과를 만들지 않는다.

### coverage_heuristics — 탐색 결과

- API: existing private pack HTTP `/__private/dngngen` 및 hosted `/api/rulebook-data`의 GET 정상/오류·POST/HEAD/OPTIONS·host/origin/fetch-site·private namespace 차단 tests를 발견했다. Static assets/encrypted update 경로도 기존 server/loader tests에 있으나 fake fetch unit와 실제 HTTP를 구분한다. 실제 사용자의 UI 요청에 새 OpenAPI/API 요구를 창작하지 않았다.
- 인증/권한: 로그인·logout·역할 시스템은 현 개인 사이트 요구에 없다. 세션 auth E2E는 N/A이고 private data source/같은 origin/read-only/키 미노출의 오류 경로는 기존 보안 단위/API assertions로 별도 검토한다.
- Error paths: invalid dice/number, damaged import/oversize/kind, Quota/CAS/stale update/invalid cache, malformed original/private pack tests를 발견했다. Storage fault tests는 Node fake storage/IDB이며 실제 브라우저 거부 환경의 검사로 과장하지 않는다.
- UI journey: Home/search/filter/reader/linked reference, Core/native character·monster·dungeon, NPC/room/street/settlement, spatial, dice/combat/Mythic, Shelf, Tray/Scratch/Last, Sources/About, history/reload/keyboard, desktop/tablet/mobile가 acceptance와26개 SYS 시나리오에 있다. Component/static source tests는 실제 완주를 대체하지 않는다. Producer의 live 계약 기록이 들어올 때 countable 실제 방문과 미방문/부분 범위를 분리한다.
- UI state: loading/empty/validation/error 표시는 일부 server-render 및 store tests에서 발견했다. 실제 클릭·취소·뒤로·새로고침·레이아웃/console는 브라우저 담당자 기록을 읽어 연결한다. 색상 취향이나 새 성능 기준을 합성 acceptance로 추가하지 않는다.

### Step 2 최종 수집 — 마지막 수정 이후 다시 분류

최신 code HEAD는 `9a7c57f8f9f2d120210a8cd7f0507d78535637f8`다. 앞선 문단의 c01 검사는 역사적 증거이며 최신 통과 로그는 `release-tests.log`: 1,259 pass/0 fail/0 cancelled/0 skipped/0 todo, duration_ms193415.953541다. `release-lint.log`, `release-build.log` 및 diffcheck는 성공했고55 public/private 파일 경계도 통과했다.

Producer manifest header는 현재 HEAD와 일치하지만 개별 관찰은21 records 중17 stale historical pass(c01),3 fresh counted pass(SYS18의 제한된 quota 후 정상 저장 복구, SYS25 최종 검사, SYS26 정직한 보고),1 fresh blocked(SYS20 미완료 fault branches)다. 버전이 다른17개 기록은 최신 coverage에 포함하지 않는다. 전체4kind CRUD와 반응형 순회는 실제 c01에서 완료되었으며 새 버전의 재방문으로 간주하지 않는다. SYS20의 actual corruption/Quota 관찰은 보존하되 blocked aggregate를 counted로 승격하지 않는다.

정적 inventory를 최신 HEAD에서 재생성해109파일/1,072 registrations(unit961/component103/API8)를 확인했다. 독립 원문 계산과 모든 행 출처 분류도 같은 HEAD에서 다시 실행했다. trace는 live producer 파일이나 원문 팩을 수정하지 않았다. 계약 validator는 contract_static, COLLECTED이고 counted3/stale17/blocked1; invalid/fail/skipped/unverifiable0이다.

### Live Verification Results

```json
{
  "collectionStatus": "COLLECTED",
  "sourceSha": "9a7c57f8f9f2d120210a8cd7f0507d78535637f8",
  "liveRecords": [
    {
      "id": "system-LIVE-07",
      "requirement_id": "SYS-07",
      "title": "Home quick references and return",
      "level": "live",
      "status": "pass",
      "disposition": "stale",
      "invalid_reason": "",
      "evidence": "Actual Home quick references, table/roll, COPY/PIN/HOLD, invalid manual dice and recovery. outputs/full-site-qa-20261011/browser-main.json; browser-root-summary.md.",
      "observed_at": "2026-10-11T07:22:43.662892+00:00",
      "recorded_source_sha": "c01e24363983cc6d594896a43cf0e883d0bef664"
    },
    {
      "id": "system-LIVE-08",
      "requirement_id": "SYS-08",
      "title": "Search, filters and reader kinds",
      "level": "live",
      "status": "pass",
      "disposition": "stale",
      "invalid_reason": "",
      "evidence": "Actual all 9 book, 8 context, 7 type filter choices; empty/no-match/Korean/accent search; book/region/creature/rule/table/procedure readers. browser-main.json; storage-follow-ups.md.",
      "observed_at": "2026-10-11T07:22:43.662892+00:00",
      "recorded_source_sha": "c01e24363983cc6d594896a43cf0e883d0bef664"
    },
    {
      "id": "system-LIVE-09",
      "requirement_id": "SYS-09",
      "title": "Nested follow-up, manual dice and reading retention",
      "level": "live",
      "status": "pass",
      "disposition": "stale",
      "invalid_reason": "",
      "evidence": "Actual Room Contents to Searching/corpse/trinkets, Names endpoints and invalid values, Orakle likelihood/TR boundaries, partial/HOLD and table/back state retention. browser-main.json; browser-root-summary.md.",
      "observed_at": "2026-10-11T07:22:43.662892+00:00",
      "recorded_source_sha": "c01e24363983cc6d594896a43cf0e883d0bef664"
    },
    {
      "id": "system-LIVE-10",
      "requirement_id": "SYS-10",
      "title": "Core and native character generation",
      "level": "live",
      "status": "pass",
      "disposition": "stale",
      "invalid_reason": "",
      "evidence": "Actual Classless/random/all12 classes, SCVMBIRTHER/homebrew, current vs next source, reroll/save/reopen; public/unavailable native fallback on5532/5533. Sacred scroll and trap terminology seen; tongs not selected. browser-main.json.",
      "observed_at": "2026-10-11T07:22:43.662892+00:00",
      "recorded_source_sha": "c01e24363983cc6d594896a43cf0e883d0bef664"
    },
    {
      "id": "system-LIVE-11",
      "requirement_id": "SYS-11",
      "title": "Current active Monster source and stat paths; legacy editor N/A",
      "level": "live",
      "status": "pass",
      "disposition": "stale",
      "invalid_reason": "",
      "evidence": "Actual FER A/B/C/native and EPK7 regions/hunting d8/d10/d12, source/result stat relationships. Legacy manual-stat screen is not an active reachable current function and is N/A to the current-site browser scope, not live verified. browser-main.json; browser-root-summary.md; source/component regressions separately.",
      "observed_at": "2026-10-11T07:22:43.662892+00:00",
      "recorded_source_sha": "c01e24363983cc6d594896a43cf0e883d0bef664"
    },
    {
      "id": "system-LIVE-12",
      "requirement_id": "SYS-12",
      "title": "Core and DNGNGEN dungeon fields and special rooms",
      "level": "live",
      "status": "pass",
      "disposition": "stale",
      "invalid_reason": "",
      "evidence": "Actual12 fields and individual controls, Core/DNGNGEN current/pending source, manual reason/entrance guard kept across special rooms1-4, native Korean details without repeated DNGNGEN result labels, nested table/manual errors/save/return. browser-main.json.",
      "observed_at": "2026-10-11T07:22:43.662892+00:00",
      "recorded_source_sha": "c01e24363983cc6d594896a43cf0e883d0bef664"
    },
    {
      "id": "system-LIVE-13",
      "requirement_id": "SYS-13",
      "title": "Remaining active generators",
      "level": "live",
      "status": "pass",
      "disposition": "stale",
      "invalid_reason": "",
      "evidence": "NPC7regions/7parts/HOLD, Room2parts, Street small/large1-2 contents/no-exit, Settlement, Weather1-3/4tables/Wind, Buildings, Names, ActionTheme, Cult9parts, Adventure4parts; actual generation/copy/source/repeat. browser-main.json.",
      "observed_at": "2026-10-11T07:22:43.662892+00:00",
      "recorded_source_sha": "c01e24363983cc6d594896a43cf0e883d0bef664"
    },
    {
      "id": "system-LIVE-14",
      "requirement_id": "SYS-14",
      "title": "All spatial links and action menus",
      "level": "live",
      "status": "pass",
      "disposition": "stale",
      "invalid_reason": "",
      "evidence": "Actual75 links,70 random rolls,12 place-action controls across Dungeon/City/Journey; static/source-only branches distinguished, pan/zoom/keyboard/return/reload. outputs/full-site-qa-20261011/browser-spatial.md; spatial-coverage.json88 observations.",
      "observed_at": "2026-10-11T07:22:43.662892+00:00",
      "recorded_source_sha": "c01e24363983cc6d594896a43cf0e883d0bef664"
    },
    {
      "id": "system-LIVE-15",
      "requirement_id": "SYS-15",
      "title": "Dice and play guidance",
      "level": "live",
      "status": "pass",
      "disposition": "stale",
      "invalid_reason": "",
      "evidence": "Actual8 die choices, count/modifier clamps/empty defaults, power/rest/infection/food/overload guidance, Core/SD physical dice natural1/20/invalid and recovery. browser-tools.md.",
      "observed_at": "2026-10-11T07:22:43.662892+00:00",
      "recorded_source_sha": "c01e24363983cc6d594896a43cf0e883d0bef664"
    },
    {
      "id": "system-LIVE-16",
      "requirement_id": "SYS-16",
      "title": "Combat main control families and changed messages",
      "level": "live",
      "status": "pass",
      "disposition": "stale",
      "invalid_reason": "",
      "evidence": "Actual attack/defense/natural20/1/Omen/morale/HP/UndoRedo/reload, ranged10+Presence2 threshold and damage3, armor quick tiers0-3, shield cancel/commit0/Undo, added/duplicated/removed/off-participation combatants and cleared attacker. Not every Cartesian combination. browser-tools.md; browser-root-summary.md.",
      "observed_at": "2026-10-11T07:22:43.662892+00:00",
      "recorded_source_sha": "c01e24363983cc6d594896a43cf0e883d0bef664"
    },
    {
      "id": "system-LIVE-17",
      "requirement_id": "SYS-17",
      "title": "Mythic Fate, Scene, Event and lists",
      "level": "live",
      "status": "pass",
      "disposition": "stale",
      "invalid_reason": "",
      "evidence": "Actual9Odds/CFbounds/Chart endpoints/doubles100exclusion, Check/Scene/Prepared/Event/Meaning/list3kinds/zone/duplicates/Thread edit/cleanup/history20/reload. All81x100 mathematical cases are independent automated evidence. browser-tools.md.",
      "observed_at": "2026-10-11T07:22:43.662892+00:00",
      "recorded_source_sha": "c01e24363983cc6d594896a43cf0e883d0bef664"
    },
    {
      "id": "system-LIVE-18",
      "requirement_id": "SYS-18",
      "title": "Shelf main CRUD and save kinds",
      "level": "live",
      "status": "pass",
      "disposition": "stale",
      "invalid_reason": "",
      "evidence": "Actual all4 kinds(character/NPC/dungeon/city) generated/saved/selected. Each kind edit-cancel-save/name-body/copy/clone/deleteUndo/reload, counts and original-source disclosures retained. Root supplemented character/dungeon/city on127.0.0.1; other producer NPC onlocalhost. Stale-error close-normal-save-reopen and Combat-to-Shelf retested. browser-main.json; browser-root-summary.md; storage-findings.md; storage-follow-ups.md.",
      "observed_at": "2026-10-11T07:22:43.662892+00:00",
      "recorded_source_sha": "c01e24363983cc6d594896a43cf0e883d0bef664"
    },
    {
      "id": "system-LIVE-19",
      "requirement_id": "SYS-19",
      "title": "Actual Shelf file export/import and rejected files",
      "level": "live",
      "status": "pass",
      "disposition": "stale",
      "invalid_reason": "",
      "evidence": "Actual downloaded JSON reimport appended; wrongkind, oversize10MB and combined200 rejection kept prior records. Normal export/import after guard fixed. browser corruption branch is not included in this pass. storage-findings.md.",
      "observed_at": "2026-10-11T07:22:43.662892+00:00",
      "recorded_source_sha": "c01e24363983cc6d594896a43cf0e883d0bef664"
    },
    {
      "id": "system-LIVE-20",
      "requirement_id": "SYS-20",
      "title": "Actual corruption and quota recovery; remaining storage fault branches blocked",
      "level": "live",
      "status": "blocked",
      "disposition": "blocked",
      "invalid_reason": "",
      "evidence": "Actual browser corrupted Shelf bytes→persistent error/disabledExport→exactrawrestore/allrecords recovered. Actual153QAquota keys→QuotaExceededError/save rejected/oldrawidentical; localizedKorean text after latefix/QAkeys removed/normal save recovered. Deniedstorage/IDB corruption/offline/CAS races not injected. browser-main.json; live-storage-fault-metadata.json; browser-root-summary.md. This aggregate remains blocked rather than claiming all fault branches passed.",
      "observed_at": "2026-10-11T07:22:43.662892+00:00",
      "recorded_source_sha": "9a7c57f8f9f2d120210a8cd7f0507d78535637f8"
    },
    {
      "id": "system-LIVE-21",
      "requirement_id": "SYS-21",
      "title": "Tray, Scratch and Last active workflows",
      "level": "live",
      "status": "pass",
      "disposition": "stale",
      "invalid_reason": "",
      "evidence": "Actual Tray search/duplicate/remove, Scratch multiline/SEND/open/copy/reopen/reload, Recent copy/source/replay/removed recipe blocked, Pack/Recipe create/edit-cancel/order/HOLD/run/activate/reload/delete. Temporary lifetime help now matches observation. storage-findings.md; browser-main.json.",
      "observed_at": "2026-10-11T07:22:43.662892+00:00",
      "recorded_source_sha": "c01e24363983cc6d594896a43cf0e883d0bef664"
    },
    {
      "id": "system-LIVE-22",
      "requirement_id": "SYS-22",
      "title": "Sources backup/restore, updates and About",
      "level": "live",
      "status": "pass",
      "disposition": "stale",
      "invalid_reason": "",
      "evidence": "Actual Sources auto-update on/off/check, downloaded full backup/restore/reload, malformed JSON/wrongkind/duplicate/filecount/20MiB rejection and exact pre/post invalid backup bytes; About/license/source links read, external sites not opened. storage-findings.md; storage-follow-ups.md.",
      "observed_at": "2026-10-11T07:22:43.662892+00:00",
      "recorded_source_sha": "c01e24363983cc6d594896a43cf0e883d0bef664"
    },
    {
      "id": "system-LIVE-23",
      "requirement_id": "SYS-23",
      "title": "Visited keyboard, return, reload and console flows",
      "level": "live",
      "status": "pass",
      "disposition": "stale",
      "invalid_reason": "",
      "evidence": "CtrlK/R/input isolation/Esc, linked/back/close/reload in visited journeys; final root console0error0warning and producer logs0errors. No all-engine assertion. browser-main.json; root-console.json; tools-console/spatial-console evidence.",
      "observed_at": "2026-10-11T07:22:43.662892+00:00",
      "recorded_source_sha": "c01e24363983cc6d594896a43cf0e883d0bef664"
    },
    {
      "id": "system-LIVE-24",
      "requirement_id": "SYS-24",
      "title": "Mobile, tablet and desktop active surfaces",
      "level": "live",
      "status": "pass",
      "disposition": "stale",
      "invalid_reason": "",
      "evidence": "Actual360x800/768x1024/1440x900 Home/generators/longreaders/tables/map/all4docks/Sources, mobileScratch. Three responsive fixes same-size checked;32 geometry observations; document no unintended horizontal overflow; viewport reset. responsive-layout.json; screenshots.",
      "observed_at": "2026-10-11T07:22:43.662892+00:00",
      "recorded_source_sha": "c01e24363983cc6d594896a43cf0e883d0bef664"
    },
    {
      "id": "system-LIVE-25",
      "requirement_id": "SYS-25",
      "title": "Final existing checks and private boundaries",
      "level": "live",
      "status": "pass",
      "disposition": "counted",
      "invalid_reason": "",
      "evidence": "Executed on9a7c57f final source: npmtest1259/1259pass fail/cancel/skip/todo0 duration193415.953541ms; lint exit0; client/servertypes+Vitebuild/public55/private55files exit0; gitdiffcheck0. Earlier stagedGitprivacy934paths8ignored86unchangedshared passed; final artifact-stage privacy will run before publication. outputs/full-site-qa-20261011/release-tests.log; release-lint.log; release-build.log.",
      "observed_at": "2026-10-11T07:22:43.662892+00:00",
      "recorded_source_sha": "9a7c57f8f9f2d120210a8cd7f0507d78535637f8"
    },
    {
      "id": "system-LIVE-26",
      "requirement_id": "SYS-26",
      "title": "Honest evidence report with unresolved scope",
      "level": "live",
      "status": "pass",
      "disposition": "counted",
      "invalid_reason": "",
      "evidence": "Producer report docs/full-site-qa-20261011/report.md records actual visited paths, source pages,22confirmed fixes, latest1259pass checks, local BeforeAfter, missing original/semantic/IDB/denied/CAS/device evidence and historicalc01 vs fresh late9a7 UI observations. Exact current Trace verdict will be appended after the workflow; no whole-source or full current live rerun claimed.",
      "observed_at": "2026-10-11T07:22:43.662892+00:00",
      "recorded_source_sha": "9a7c57f8f9f2d120210a8cd7f0507d78535637f8"
    },
    {
      "id": "system-LIVE-late-shelf-quota",
      "requirement_id": "SYS-18",
      "title": "Late quota UI correction and normal Shelf save recovery",
      "level": "live",
      "status": "pass",
      "disposition": "counted",
      "invalid_reason": "",
      "evidence": "Actual same quota condition after late Korean text change: save rejected, oldrawexact; cleaned153QAkeys+backup, existing record edited/saved successfully, editorclosed,alert0,all7counts retained. Historical all4kind CRUD remains at c01, not freshly repeated here. browser-main.json shelf-live-quota-korean-error-after and shelf-quota-cleanup-normal-save-recovery; live-storage-fault-metadata.json.",
      "observed_at": "2026-10-11T07:22:43.662892+00:00",
      "recorded_source_sha": "9a7c57f8f9f2d120210a8cd7f0507d78535637f8"
    }
  ],
  "liveManifestHeader": {
    "present": true,
    "results_file": "/Users/imwul/.codex/workspaces/morkborg-personal-site-20261010/_bmad-output/test-artifacts/live-verification-results.json",
    "source_sha": "9a7c57f8f9f2d120210a8cd7f0507d78535637f8",
    "observed_at": "2026-10-11T07:22:43.662892+00:00",
    "producer": "/root actual CUA walkthrough and final existing verification commands",
    "read_error": "",
    "current_source_sha": "9a7c57f8f9f2d120210a8cd7f0507d78535637f8"
  }
}
```

Step3 매핑 전에 Step2 계약을 같은 HEAD에서 다시 수집했다. Producer가 SYS18 네 종류의 각각 CRUD를 실제 보완하고 SYS11 활성 기능을 pass로 기록했으며, legacy 미방문은 N/A로 유지했다. sourceSHA와 statuses를 임의 수정하지 않았다. SYS20의 보완 시도는 아직 진행 중이므로 최종 gate를 닫지 않는다.


## Step 3 — 공식 acceptance와 증거 연결

QA01–07의 공식 요구와 승인된 system Test Design의 SYS01–26 분해를 연결했다. 구현으로 새 acceptance를 합성하지 않았다. 최신 code SHA coverage는 FULL6/PARTIAL7/UNIT-ONLY12/NONE1이다. FULL은 해당 시나리오를 전부 입증한 범위에만 적용한다. 원문에 없는 임의 조건을 추가하지 않았다.

`traceability-mapping-system.json`에 stable id/title/file/line/level/skip/pending/fixme/status와 heuristic signals를 보존했다. 같은 테스트가 여러 기준을 입증하면 각각 관련 assertion만 적용하고 unique test는 id로 deduplicate한다. 원문 독립 스크립트는 전체 Node runner count에 합산하지 않는다.

| 기준 | 부모 요구 | 우선순위 | coverage | 근거와 제한 |
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
| SYS-12 | QA-02,QA-03 | P1 | PARTIAL | Current domain and SSR dungeon assertions cover fields/duplicate label suppression. Actual 12-part/manual/source/save journey is c01 historical/stale. |
| SYS-13 | QA-02,QA-03 | P1 | UNIT-ONLY | Current generator and Wind regression assertions are accepted partial proof; actual remaining-generator control families were visited at c01 and are stale here. |
| SYS-14 | QA-02,QA-03 | P1 | UNIT-ONLY | Spatial link/domain assertions pass; actual map/action/pan/return/reload journey is only historical c01 proof. |
| SYS-15 | QA-02,QA-03 | P1 | UNIT-ONLY | Dice/formula boundaries pass; current rendered eight-choice/guidance/input-recovery journey lacks fresh live proof. |
| SYS-16 | QA-02,QA-03 | P1 | UNIT-ONLY | Critical/fumble/manual-HP calculation assertions pass; the combat control-family/ranged/shield/roster journey has stale c01 live evidence. |
| SYS-17 | QA-02,QA-03 | P1 | UNIT-ONLY | Fate/scene/list boundaries pass; actual current Mythic UI edit/cleanup/reload has only historical c01 live proof. |
| SYS-18 | QA-02,QA-03 | P0 | PARTIAL | Fresh limited live proof establishes late quota message, rejected save preserving bytes and normal edit/save recovery with seven counts. The four-kind complete CRUD was not freshly repeated at current HEAD. |
| SYS-19 | QA-02,QA-03 | P0 | UNIT-ONLY | Current schema/kind/date/duplicate tests establish import guards; the actual file chooser/export/append journey is only historical c01 proof. |
| SYS-20 | QA-03 | P0 | PARTIAL | Current actual-store/component and fake Quota/CAS/offline assertions establish guards. Fresh blocked producer record retains real corruption/Quota observations but contributes no coverage; actual IDB/denied/offline/CAS branches remain incomplete. |
| SYS-21 | QA-02,QA-03 | P1 | UNIT-ONLY | Memory isolation assertions pass; current rendered Tray/Scratch/Last/Pack/Recipe control paths retain only stale c01 live evidence. |
| SYS-22 | QA-02,QA-03 | P1 | PARTIAL | Backup/update domain and actual HTTP success/denial/error tests establish part of Sources. Fresh current file chooser, settings and About UI journey is missing. |
| SYS-23 | QA-03 | P1 | UNIT-ONLY | Navigation state assertion preserves current domain behavior; actual keyboard/Esc/reload/console coverage is c01 historical/stale. |
| SYS-24 | QA-04 | P1 | NONE | Three viewport walkthroughs and 32 geometry observations were genuinely completed at c01; all live responsive proof is stale at the current code HEAD and no accepted current test establishes this criterion. |
| SYS-25 | QA-05,QA-06 | P0 | FULL | Current9a7 release tests1259/1259, lint/build/diffcheck success and public/private55 boundary proof; source tests/assertions and minimal diff remain independently reviewable. |
| SYS-26 | QA-07 | P2 | FULL | Current report accurately records22 fixes, original pages, final1259 checks, local Before/After and unresolved scope; historical and fresh code revisions remain explicit. |

### 기준별 채택 테스트

#### SYS-01 — Core 시작 자원·능력·HP·scroll 장비·12직업 기본 보정

- `tests/rule-fidelity.test.ts:43` — unit / P1 / active / `NODE:tests/rule-fidelity.test.ts:43`: complete classless PC has essentials and scroll-dependent starting arms
- `outputs/full-site-qa-20261011/rules-private/mechanical-audit.mjs:15` — unit / P1 / active / `SOURCE-CORE-ABILITY`: Core independent ability boundaries
- `outputs/full-site-qa-20261011/rules-private/mechanical-audit.mjs:56` — unit / P1 / active / `SOURCE-CLASS-BASELINES`: Twelve independent class starting baselines

#### SYS-02 — FER A/B/C·HP·사기·방어구·동률과 원문 모순

- `tests/feretory-procedure.test.ts:62` — unit / P1 / active / `NODE:tests/feretory-procedure.test.ts:62`: The Monster Approaches rolls A/B/C once and adds only the source-defined HP die
- `tests/feretory-procedure.test.ts:94` — unit / P1 / active / `NODE:tests/feretory-procedure.test.ts:94`: Feretory damage boundaries and HP doubling follow the printed rule
- `outputs/full-site-qa-20261011/rules-private/mechanical-audit.mjs:16` — unit / P1 / active / `SOURCE-FER-ABC`: Independent 1728 A/B/C combinations

#### SYS-03 — SD/Depths 두 d20·여행·던전·TR/DR·잠금·위험 후속

- `tests/dungeon-action-moves.test.ts:89` — unit / P1 / active / `NODE:tests/dungeon-action-moves.test.ts:89`: SD searching accepts remaining Omens 0–4 and rejects invalid counts before rolling
- `tests/journey-procedure.test.ts:103` — unit / P1 / active / `NODE:tests/journey-procedure.test.ts:103`: daily road action does not repeat morning weather; fork and changed weather remain source-directed
- `tests/journey-procedure.test.ts:140` — unit / P1 / active / `NODE:tests/journey-procedure.test.ts:140`: camping compares independent d20s to DR12; failure recovery requires a distinct 50:50 retry
- `outputs/full-site-qa-20261011/rules-private/mechanical-audit.mjs:23` — unit / P1 / active / `SOURCE-SD-CRAWL`: Independent crawl outcome combinations
- `outputs/full-site-qa-20261011/rules-private/mechanical-audit.mjs:75` — unit / P1 / active / `SOURCE-SD-SEARCH`: Independent Omen searching and invalid inputs
- `outputs/full-site-qa-20261011/rules-private/mechanical-audit.mjs:95` — unit / P1 / active / `SOURCE-DEPTHS-ENEMY`: Independent fifteen enemy stat rows

#### SYS-04 — RECLVSE 두 d20·치명·질문 경계와 현재 원본

현재 채택한 실행 테스트 없음. 제한된 source 근거와 stale 과거 관찰은 설명으로만 보존한다.

#### SYS-05 — Mythic Fate Chart/Check/Scene/Prepared/Event·CF

- `tests/mythic.test.ts:201` — unit / P1 / active / `NODE:tests/mythic.test.ts:201`: Fate Check uses source modifiers and exact exceptional bands without clamping
- `tests/mythic.test.ts:262` — unit / P1 / active / `NODE:tests/mythic.test.ts:262`: scene checks cover all90 combinations and do not change Chaos
- `outputs/full-site-qa-20261011/rules-private/mechanical-audit.mjs:102` — unit / P1 / active / `SOURCE-MYTHIC-CELLS`: Independent Mythic chart and outcome boundaries
- `outputs/full-site-qa-20261011/rules-private/mechanical-audit.mjs:118` — unit / P1 / active / `SOURCE-MYTHIC-SCENES`: Independent normal and prepared scenes

#### SYS-06 — 전체 표 행 범위·후속·원문 authority·번역의 전수 대조

- `tests/oracles.test.ts:81` — unit / P1 / active / `NODE:tests/oracles.test.ts:81`: Oracle validation accepts exact ranges and source
- `tests/row-relationships.test.ts:254` — unit / P1 / active / `NODE:tests/row-relationships.test.ts:254`: Self references and missing targets never become visible links
- `outputs/full-site-qa-20261011/rules-private/full-entry-audit.mjs:26` — unit / P1 / active / `SOURCE-ENTRY-PROVENANCE`: Fresh original hashes and every runtime row status

#### SYS-07 — Home 빠른 참조·굴림·copy/pin·return

- `tests/home-bilingual.test.ts:143` — component / P1 / active / `NODE:tests/home-bilingual.test.ts:143`: Home exposes real generator destinations without running a generator or requiring a session

#### SYS-08 — 검색·책/상황/유형 필터·모든 reader 종류

- `tests/reference-search-coverage.test.ts:596` — unit / P1 / active / `NODE:tests/reference-search-coverage.test.ts:596`: The actual browse surface retains trusted titles through its entries/byId registry wrapper
- `tests/full-site-qa-regression.test.ts:30` — unit / P1 / active / `NODE:tests/full-site-qa-regression.test.ts:30`: includes late supplied source references in the book summary and related list

#### SYS-09 — 하위 참조·manual dice·partial/HOLD·복귀

- `tests/reference-reading.test.ts:66` — unit / P1 / active / `NODE:tests/reference-reading.test.ts:66`: Move and fixed-lookup readings expose the selected result’s follow-up table, not an automatic reroll
- `tests/row-relationships.test.ts:238` — unit / P1 / active / `NODE:tests/row-relationships.test.ts:238`: Ambiguous fixedEntry selectors do not guess a target and malformed metadata is ignored
- `tests/full-site-qa-regression.test.ts:63` — unit / P1 / active / `NODE:tests/full-site-qa-regression.test.ts:63`: rejects invalid active Orakle threat ratings before consuming dice and permits the app input boundaries

#### SYS-10 — Core/native 캐릭터·12직업·source·reroll/save

- `tests/official-generators.test.ts:63` — unit / P1 / active / `NODE:tests/official-generators.test.ts:63`: SCVMBIRTHER scroll handling follows the published string comparison
- `tests/translation-ui-terms.test.ts:82` — unit / P1 / active / `NODE:tests/translation-ui-terms.test.ts:82`: SCVM reader normalizes companion gear while preserving English and the pack

#### SYS-11 — 현재 활성 Monster source·수치·FER/native/EPK

- `tests/official-generators.test.ts:122` — unit / P1 / active / `NODE:tests/official-generators.test.ts:122`: monster site armor follows its published C-before-B parity
- `tests/feretory-procedure.test.ts:62` — unit / P1 / active / `NODE:tests/feretory-procedure.test.ts:62`: The Monster Approaches rolls A/B/C once and adds only the source-defined HP die

#### SYS-12 — Core/native 던전·이유/경비/특별한 방1–4·개별 조작

- `tests/dngngen-translation-features.test.ts:194` — unit / P1 / active / `NODE:tests/dngngen-translation-features.test.ts:194`: full preparation connects reason, entrance, guards and every native room; individual rerolls preserve other fields
- `tests/dngngen-translation-features.test.ts:287` — component / P1 / active / `NODE:tests/dngngen-translation-features.test.ts:287`: main sheet and preview show explicit Korean helpers without repeating DNGNGEN per room

#### SYS-13 — NPC/Room/Street/Settlement와 나머지 활성 생성기

- `tests/rule-fidelity.test.ts:137` — unit / P1 / active / `NODE:tests/rule-fidelity.test.ts:137`: Weather selects 1–3 tables and leaves unnatural follow-up optional
- `tests/rule-fidelity.test.ts:161` — unit / P1 / active / `NODE:tests/rule-fidelity.test.ts:161`: Buildings rolls d2 material count, each material and Other follow-up independently
- `tests/translation-ui-terms.test.ts:17` — unit / P1 / active / `NODE:tests/translation-ui-terms.test.ts:17`: Weather Wind keeps its UI meaning despite an unrelated table translation

#### SYS-14 — Dungeon/City/Journey map·hotspot·action·return

- `tests/spatial-oracle.test.ts:86` — unit / P1 / active / `NODE:tests/spatial-oracle.test.ts:86`: Every spatial feature resolves to an existing canonical reference with source attribution

#### SYS-15 — 일반 주사위·physical invalid·play guidance

- `tests/combat-tool.test.ts:159` — unit / P1 / active / `NODE:tests/combat-tool.test.ts:159`: Combat formula accepts bounded dice and fixed damage without evaluating expressions
- `tests/oracles.test.ts:160` — unit / P1 / active / `NODE:tests/oracles.test.ts:160`: d66 has exactly 36 legal pairs and uses tens/units d6

#### SYS-16 — 전투 계산·치명/실수/Omen·기록·Undo 및 주요 관리

- `tests/combat-tool.test.ts:266` — unit / P1 / active / `NODE:tests/combat-tool.test.ts:266`: Natural 20 doubles weapon damage before armor; record leaves HP and armor manual
- `tests/combat-tool.test.ts:292` — unit / P1 / active / `NODE:tests/combat-tool.test.ts:292`: Defence fumble previews doubled weapon damage while HP and armor stay manual
- `tests/combat-tool.test.ts:311` — unit / P1 / active / `NODE:tests/combat-tool.test.ts:311`: Defence critical only offers a free attack; it neither rolls nor applies another attack

#### SYS-17 — Mythic Odds/CF/Chart/Check/Scene/Event/list·repeat/reload

- `tests/mythic.test.ts:201` — unit / P1 / active / `NODE:tests/mythic.test.ts:201`: Fate Check uses source modifiers and exact exceptional bands without clamping
- `tests/mythic.test.ts:262` — unit / P1 / active / `NODE:tests/mythic.test.ts:262`: scene checks cover all90 combinations and do not change Chaos
- `tests/notebook-tools.test.ts:115` — unit / P1 / active / `NODE:tests/notebook-tools.test.ts:115`: Mythic allows three weighted occurrences but rejects a fourth

#### SYS-18 — Shelf4kind 생성/save/select/edit/cancel/clone/copy/deleteUndo/reload

- `tests/notebook-tools.test.ts:182` — unit / P0 / active / `NODE:tests/notebook-tools.test.ts:182`: Shelf snapshots stay independent, retaining the generated original on edit
- producer `system-LIVE-late-shelf-quota` (file 없이 stable live ID) — live / P0 / active / `system-LIVE-late-shelf-quota`: Late quota UI correction and normal Shelf save recovery

#### SYS-19 — Shelf 실제 파일 export/import append·잘못된 입력 보존

- `tests/notebook-tools.test.ts:194` — unit / P0 / active / `NODE:tests/notebook-tools.test.ts:194`: Shelf validation rejects mismatched kinds, unknown null kinds and duplicate identities

#### SYS-20 — 손상 byte·Quota/IDB/CAS/stale update의 데이터 보호와 실제 오류 상태

- `tests/object-shelf-corruption.test.ts:7` — component / P0 / active / `NODE:tests/object-shelf-corruption.test.ts:7`: a damaged shelf blocks edits and retains the exact stored bytes and older records
- `tests/private-data.test.ts:159` — unit / P0 / active / `NODE:tests/private-data.test.ts:159`: storage failure preserves all active packs
- `tests/published-data.test.ts:497` — unit / P0 / active / `NODE:tests/published-data.test.ts:497`: cross-tab changes cause CAS rejection without advancing the server revision
- `tests/published-data.test.ts:511` — unit / P0 / active / `NODE:tests/published-data.test.ts:511`: offline errors preserve cached packs and force retry restores server checks

#### SYS-21 — Tray/Scratch/Last/Recent/Pack/Recipe·수명·clear isolation

- `tests/play-memory.test.ts:330` — unit / P1 / active / `NODE:tests/play-memory.test.ts:330`: Temporary clear is isolated from Campaign export, Pins, Recipes, Packs, Tray, Scratch and Last

#### SYS-22 — Sources backup/restore·update pause/check·About

- `tests/private-data.test.ts:176` — unit / P1 / active / `NODE:tests/private-data.test.ts:176`: private backup includes all three packs and round-trips through validation
- `tests/published-data.test.ts:544` — unit / P1 / active / `NODE:tests/published-data.test.ts:544`: paused updates skip downloads; manual check works without turning automatic checks on
- `tests/published-server.test.ts:123` — api / P1 / active / `NODE:tests/published-server.test.ts:123`: HTTP handler is read-only, sends no-store JSON and hides configuration failures

#### SYS-23 — keyboard/Esc/back/reload·visited flow console

- `tests/navigation-history.test.ts:109` — unit / P1 / active / `NODE:tests/navigation-history.test.ts:109`: Back and Forward restore selectors without adding entries or executing content

#### SYS-24 — mobile/tablet/desktop 주요 화면 layout·longtext·focus

현재 채택한 실행 테스트 없음. 제한된 source 근거와 stale 과거 관찰은 설명으로만 보존한다.

#### SYS-25 — 최소 수정·원문/데이터 보존·최종 tests/lint/type/build/privacy

- `tests/public-build.test.ts:22` — unit / P0 / active / `NODE:tests/public-build.test.ts:22`: privacy boundary rejects renamed packs, secret bytes, excerpts and local paths
- `tests/public-build.test.ts:54` — unit / P0 / active / `NODE:tests/public-build.test.ts:54`: ciphertext and its matching manifest pass without embedding private plaintext or keys
- `tests/published-server.test.ts:164` — api / P0 / active / `NODE:tests/published-server.test.ts:164`: production preview shares the real API handler and never serves plaintext or SPA for API errors
- `tests/translation-ui-terms.test.ts:48` — unit / P0 / active / `NODE:tests/translation-ui-terms.test.ts:48`: companion terminology corrections require the matching English meaning and keep dice
- producer `system-LIVE-25` (file 없이 stable live ID) — live / P0 / active / `system-LIVE-25`: Final existing checks and private boundaries

#### SYS-26 — 실제 visited/source/bugs/fixes/test/gap/전후 증거의 정직한 보고

- producer `system-LIVE-26` (file 없이 stable live ID) — live / P2 / active / `system-LIVE-26`: Honest evidence report with unresolved scope

### 증거 거부와 검증 논리

SourceVerified라는 이름을 원문 증거로 삼지 않았다. 선택한 assertion은 관련 행동 일부 이상을 입증하고 각 file/line이 존재한다. 전체1,072 등록의 모든 본문을 품질 검토했다고 주장하지 않는다. SYS 이름을 주장하면서 관련 assertion이 전혀 없는 선택 테스트는 없어서 rejectedEvidence는 빈 배열이다. stale17/blocked1 live records는 tests 배열에 넣지 않았다. SYS20 blocked는 실제 두 fault 종류 관찰을 보존하지만 전체 criterion 통과가 아니다. Fresh SYS18은 제한된 정상 저장 복구이므로 전체 CRUD FULL이 아니다. 현재 P0/P1 부족은 그대로 남겼고 HTTP denied/error assertions를 필요한 범위에 확인했다. 계층 수는 FULL의 근거가 아니다. live fail/unmatched/contradicted는0이다.

저장 확인 중 provenance summary 위치를 잘못 지정해 최초 write script가 중단됐고 checkpoint는 이동하지 않았다. 이후 실제 summary 경로를 확인하고 같은 SHA 독립 결과 검증 후 Step3를 저장했다. 그때 이른 Step4 read 시도가 있었으나 분석/계산/완료 처리는 하지 않았으며 다음 단계 full read를 새로 수행한다.

### Resolved Live Records

```json
[
  {
    "id": "system-LIVE-07",
    "requirement_id": "SYS-07",
    "title": "Home quick references and return",
    "level": "live",
    "status": "pass",
    "disposition": "stale",
    "invalid_reason": "",
    "evidence": "Actual Home quick references, table/roll, COPY/PIN/HOLD, invalid manual dice and recovery. outputs/full-site-qa-20261011/browser-main.json; browser-root-summary.md.",
    "observed_at": "2026-10-11T07:22:43.662892+00:00",
    "recorded_source_sha": "c01e24363983cc6d594896a43cf0e883d0bef664"
  },
  {
    "id": "system-LIVE-08",
    "requirement_id": "SYS-08",
    "title": "Search, filters and reader kinds",
    "level": "live",
    "status": "pass",
    "disposition": "stale",
    "invalid_reason": "",
    "evidence": "Actual all 9 book, 8 context, 7 type filter choices; empty/no-match/Korean/accent search; book/region/creature/rule/table/procedure readers. browser-main.json; storage-follow-ups.md.",
    "observed_at": "2026-10-11T07:22:43.662892+00:00",
    "recorded_source_sha": "c01e24363983cc6d594896a43cf0e883d0bef664"
  },
  {
    "id": "system-LIVE-09",
    "requirement_id": "SYS-09",
    "title": "Nested follow-up, manual dice and reading retention",
    "level": "live",
    "status": "pass",
    "disposition": "stale",
    "invalid_reason": "",
    "evidence": "Actual Room Contents to Searching/corpse/trinkets, Names endpoints and invalid values, Orakle likelihood/TR boundaries, partial/HOLD and table/back state retention. browser-main.json; browser-root-summary.md.",
    "observed_at": "2026-10-11T07:22:43.662892+00:00",
    "recorded_source_sha": "c01e24363983cc6d594896a43cf0e883d0bef664"
  },
  {
    "id": "system-LIVE-10",
    "requirement_id": "SYS-10",
    "title": "Core and native character generation",
    "level": "live",
    "status": "pass",
    "disposition": "stale",
    "invalid_reason": "",
    "evidence": "Actual Classless/random/all12 classes, SCVMBIRTHER/homebrew, current vs next source, reroll/save/reopen; public/unavailable native fallback on5532/5533. Sacred scroll and trap terminology seen; tongs not selected. browser-main.json.",
    "observed_at": "2026-10-11T07:22:43.662892+00:00",
    "recorded_source_sha": "c01e24363983cc6d594896a43cf0e883d0bef664"
  },
  {
    "id": "system-LIVE-11",
    "requirement_id": "SYS-11",
    "title": "Current active Monster source and stat paths; legacy editor N/A",
    "level": "live",
    "status": "pass",
    "disposition": "stale",
    "invalid_reason": "",
    "evidence": "Actual FER A/B/C/native and EPK7 regions/hunting d8/d10/d12, source/result stat relationships. Legacy manual-stat screen is not an active reachable current function and is N/A to the current-site browser scope, not live verified. browser-main.json; browser-root-summary.md; source/component regressions separately.",
    "observed_at": "2026-10-11T07:22:43.662892+00:00",
    "recorded_source_sha": "c01e24363983cc6d594896a43cf0e883d0bef664"
  },
  {
    "id": "system-LIVE-12",
    "requirement_id": "SYS-12",
    "title": "Core and DNGNGEN dungeon fields and special rooms",
    "level": "live",
    "status": "pass",
    "disposition": "stale",
    "invalid_reason": "",
    "evidence": "Actual12 fields and individual controls, Core/DNGNGEN current/pending source, manual reason/entrance guard kept across special rooms1-4, native Korean details without repeated DNGNGEN result labels, nested table/manual errors/save/return. browser-main.json.",
    "observed_at": "2026-10-11T07:22:43.662892+00:00",
    "recorded_source_sha": "c01e24363983cc6d594896a43cf0e883d0bef664"
  },
  {
    "id": "system-LIVE-13",
    "requirement_id": "SYS-13",
    "title": "Remaining active generators",
    "level": "live",
    "status": "pass",
    "disposition": "stale",
    "invalid_reason": "",
    "evidence": "NPC7regions/7parts/HOLD, Room2parts, Street small/large1-2 contents/no-exit, Settlement, Weather1-3/4tables/Wind, Buildings, Names, ActionTheme, Cult9parts, Adventure4parts; actual generation/copy/source/repeat. browser-main.json.",
    "observed_at": "2026-10-11T07:22:43.662892+00:00",
    "recorded_source_sha": "c01e24363983cc6d594896a43cf0e883d0bef664"
  },
  {
    "id": "system-LIVE-14",
    "requirement_id": "SYS-14",
    "title": "All spatial links and action menus",
    "level": "live",
    "status": "pass",
    "disposition": "stale",
    "invalid_reason": "",
    "evidence": "Actual75 links,70 random rolls,12 place-action controls across Dungeon/City/Journey; static/source-only branches distinguished, pan/zoom/keyboard/return/reload. outputs/full-site-qa-20261011/browser-spatial.md; spatial-coverage.json88 observations.",
    "observed_at": "2026-10-11T07:22:43.662892+00:00",
    "recorded_source_sha": "c01e24363983cc6d594896a43cf0e883d0bef664"
  },
  {
    "id": "system-LIVE-15",
    "requirement_id": "SYS-15",
    "title": "Dice and play guidance",
    "level": "live",
    "status": "pass",
    "disposition": "stale",
    "invalid_reason": "",
    "evidence": "Actual8 die choices, count/modifier clamps/empty defaults, power/rest/infection/food/overload guidance, Core/SD physical dice natural1/20/invalid and recovery. browser-tools.md.",
    "observed_at": "2026-10-11T07:22:43.662892+00:00",
    "recorded_source_sha": "c01e24363983cc6d594896a43cf0e883d0bef664"
  },
  {
    "id": "system-LIVE-16",
    "requirement_id": "SYS-16",
    "title": "Combat main control families and changed messages",
    "level": "live",
    "status": "pass",
    "disposition": "stale",
    "invalid_reason": "",
    "evidence": "Actual attack/defense/natural20/1/Omen/morale/HP/UndoRedo/reload, ranged10+Presence2 threshold and damage3, armor quick tiers0-3, shield cancel/commit0/Undo, added/duplicated/removed/off-participation combatants and cleared attacker. Not every Cartesian combination. browser-tools.md; browser-root-summary.md.",
    "observed_at": "2026-10-11T07:22:43.662892+00:00",
    "recorded_source_sha": "c01e24363983cc6d594896a43cf0e883d0bef664"
  },
  {
    "id": "system-LIVE-17",
    "requirement_id": "SYS-17",
    "title": "Mythic Fate, Scene, Event and lists",
    "level": "live",
    "status": "pass",
    "disposition": "stale",
    "invalid_reason": "",
    "evidence": "Actual9Odds/CFbounds/Chart endpoints/doubles100exclusion, Check/Scene/Prepared/Event/Meaning/list3kinds/zone/duplicates/Thread edit/cleanup/history20/reload. All81x100 mathematical cases are independent automated evidence. browser-tools.md.",
    "observed_at": "2026-10-11T07:22:43.662892+00:00",
    "recorded_source_sha": "c01e24363983cc6d594896a43cf0e883d0bef664"
  },
  {
    "id": "system-LIVE-18",
    "requirement_id": "SYS-18",
    "title": "Shelf main CRUD and save kinds",
    "level": "live",
    "status": "pass",
    "disposition": "stale",
    "invalid_reason": "",
    "evidence": "Actual all4 kinds(character/NPC/dungeon/city) generated/saved/selected. Each kind edit-cancel-save/name-body/copy/clone/deleteUndo/reload, counts and original-source disclosures retained. Root supplemented character/dungeon/city on127.0.0.1; other producer NPC onlocalhost. Stale-error close-normal-save-reopen and Combat-to-Shelf retested. browser-main.json; browser-root-summary.md; storage-findings.md; storage-follow-ups.md.",
    "observed_at": "2026-10-11T07:22:43.662892+00:00",
    "recorded_source_sha": "c01e24363983cc6d594896a43cf0e883d0bef664"
  },
  {
    "id": "system-LIVE-19",
    "requirement_id": "SYS-19",
    "title": "Actual Shelf file export/import and rejected files",
    "level": "live",
    "status": "pass",
    "disposition": "stale",
    "invalid_reason": "",
    "evidence": "Actual downloaded JSON reimport appended; wrongkind, oversize10MB and combined200 rejection kept prior records. Normal export/import after guard fixed. browser corruption branch is not included in this pass. storage-findings.md.",
    "observed_at": "2026-10-11T07:22:43.662892+00:00",
    "recorded_source_sha": "c01e24363983cc6d594896a43cf0e883d0bef664"
  },
  {
    "id": "system-LIVE-20",
    "requirement_id": "SYS-20",
    "title": "Actual corruption and quota recovery; remaining storage fault branches blocked",
    "level": "live",
    "status": "blocked",
    "disposition": "blocked",
    "invalid_reason": "",
    "evidence": "Actual browser corrupted Shelf bytes→persistent error/disabledExport→exactrawrestore/allrecords recovered. Actual153QAquota keys→QuotaExceededError/save rejected/oldrawidentical; localizedKorean text after latefix/QAkeys removed/normal save recovered. Deniedstorage/IDB corruption/offline/CAS races not injected. browser-main.json; live-storage-fault-metadata.json; browser-root-summary.md. This aggregate remains blocked rather than claiming all fault branches passed.",
    "observed_at": "2026-10-11T07:22:43.662892+00:00",
    "recorded_source_sha": "9a7c57f8f9f2d120210a8cd7f0507d78535637f8"
  },
  {
    "id": "system-LIVE-21",
    "requirement_id": "SYS-21",
    "title": "Tray, Scratch and Last active workflows",
    "level": "live",
    "status": "pass",
    "disposition": "stale",
    "invalid_reason": "",
    "evidence": "Actual Tray search/duplicate/remove, Scratch multiline/SEND/open/copy/reopen/reload, Recent copy/source/replay/removed recipe blocked, Pack/Recipe create/edit-cancel/order/HOLD/run/activate/reload/delete. Temporary lifetime help now matches observation. storage-findings.md; browser-main.json.",
    "observed_at": "2026-10-11T07:22:43.662892+00:00",
    "recorded_source_sha": "c01e24363983cc6d594896a43cf0e883d0bef664"
  },
  {
    "id": "system-LIVE-22",
    "requirement_id": "SYS-22",
    "title": "Sources backup/restore, updates and About",
    "level": "live",
    "status": "pass",
    "disposition": "stale",
    "invalid_reason": "",
    "evidence": "Actual Sources auto-update on/off/check, downloaded full backup/restore/reload, malformed JSON/wrongkind/duplicate/filecount/20MiB rejection and exact pre/post invalid backup bytes; About/license/source links read, external sites not opened. storage-findings.md; storage-follow-ups.md.",
    "observed_at": "2026-10-11T07:22:43.662892+00:00",
    "recorded_source_sha": "c01e24363983cc6d594896a43cf0e883d0bef664"
  },
  {
    "id": "system-LIVE-23",
    "requirement_id": "SYS-23",
    "title": "Visited keyboard, return, reload and console flows",
    "level": "live",
    "status": "pass",
    "disposition": "stale",
    "invalid_reason": "",
    "evidence": "CtrlK/R/input isolation/Esc, linked/back/close/reload in visited journeys; final root console0error0warning and producer logs0errors. No all-engine assertion. browser-main.json; root-console.json; tools-console/spatial-console evidence.",
    "observed_at": "2026-10-11T07:22:43.662892+00:00",
    "recorded_source_sha": "c01e24363983cc6d594896a43cf0e883d0bef664"
  },
  {
    "id": "system-LIVE-24",
    "requirement_id": "SYS-24",
    "title": "Mobile, tablet and desktop active surfaces",
    "level": "live",
    "status": "pass",
    "disposition": "stale",
    "invalid_reason": "",
    "evidence": "Actual360x800/768x1024/1440x900 Home/generators/longreaders/tables/map/all4docks/Sources, mobileScratch. Three responsive fixes same-size checked;32 geometry observations; document no unintended horizontal overflow; viewport reset. responsive-layout.json; screenshots.",
    "observed_at": "2026-10-11T07:22:43.662892+00:00",
    "recorded_source_sha": "c01e24363983cc6d594896a43cf0e883d0bef664"
  },
  {
    "id": "system-LIVE-25",
    "requirement_id": "SYS-25",
    "title": "Final existing checks and private boundaries",
    "level": "live",
    "status": "pass",
    "disposition": "counted",
    "invalid_reason": "",
    "evidence": "Executed on9a7c57f final source: npmtest1259/1259pass fail/cancel/skip/todo0 duration193415.953541ms; lint exit0; client/servertypes+Vitebuild/public55/private55files exit0; gitdiffcheck0. Earlier stagedGitprivacy934paths8ignored86unchangedshared passed; final artifact-stage privacy will run before publication. outputs/full-site-qa-20261011/release-tests.log; release-lint.log; release-build.log.",
    "observed_at": "2026-10-11T07:22:43.662892+00:00",
    "recorded_source_sha": "9a7c57f8f9f2d120210a8cd7f0507d78535637f8"
  },
  {
    "id": "system-LIVE-26",
    "requirement_id": "SYS-26",
    "title": "Honest evidence report with unresolved scope",
    "level": "live",
    "status": "pass",
    "disposition": "counted",
    "invalid_reason": "",
    "evidence": "Producer report docs/full-site-qa-20261011/report.md records actual visited paths, source pages,22confirmed fixes, latest1259pass checks, local BeforeAfter, missing original/semantic/IDB/denied/CAS/device evidence and historicalc01 vs fresh late9a7 UI observations. Exact current Trace verdict will be appended after the workflow; no whole-source or full current live rerun claimed.",
    "observed_at": "2026-10-11T07:22:43.662892+00:00",
    "recorded_source_sha": "9a7c57f8f9f2d120210a8cd7f0507d78535637f8"
  },
  {
    "id": "system-LIVE-late-shelf-quota",
    "requirement_id": "SYS-18",
    "title": "Late quota UI correction and normal Shelf save recovery",
    "level": "live",
    "status": "pass",
    "disposition": "counted",
    "invalid_reason": "",
    "evidence": "Actual same quota condition after late Korean text change: save rejected, oldrawexact; cleaned153QAkeys+backup, existing record edited/saved successfully, editorclosed,alert0,all7counts retained. Historical all4kind CRUD remains at c01, not freshly repeated here. browser-main.json shelf-live-quota-korean-error-after and shelf-quota-cleanup-normal-save-recovery; live-storage-fault-metadata.json.",
    "observed_at": "2026-10-11T07:22:43.662892+00:00",
    "recorded_source_sha": "9a7c57f8f9f2d120210a8cd7f0507d78535637f8"
  }
]
```

### Rejected Evidence

```json
[]
```


## Step 4 — Phase1 완료, 공백 분석

별도 사용자 execution mode 지정은 없다. 승인 설정 auto/probe=true이고 collaboration subagent 실행을 실제로 사용할 수 있어 auto→subagent로 해석했다. 기존 storage QA 담당자에게 dependency-safe 통계·dedup·live-only만 read-only 교차 계산을 위임했고 gap/heuristic/live rollup은 본 담당자가 병렬 진행했다. 기존 peer를 재사용했으며 새 프레임워크나 dependency를 설치하지 않았다. 독립 응답이26 기준/58 unique/coverage/우선순위/3counted17stale1blocked 및 live-only SYS26과 일치한 뒤 merge했다.

전체 기준26: FULL6(23%), PARTIAL7, UNIT-ONLY12, NONE1. P0 FULL1/4(25%); P1 FULL4/21(19%); P2 FULL1/1(100%); P3 기준없음(N/A,0/0). Machine P3 percentage100은 skill safePct의 빈 분모 기본값이고 검사한 P3가100%라는 뜻이 아니다. 모든 비율은 workflow Math.round 규칙이다.

Critical P0 공백은 SYS18/SYS19/SYS20, High P1 NONE는 SYS24, Medium/Low NONE는0이다. P1의 PARTIAL/UNIT-ONLY도 해당 우선순위 FULL비율에서 제외했다. 의미 검토/원문 확보 공백 SYS04/SYS06은 계속 남는다. 현 사용 요구와 선택한 실제 HTTP tests의 endpoint/auth-negative gaps는0; 로그인 역할이나 새 endpoint 요구를 창작하지 않았다. 현재 UI journey/state 불완전18범위는 advisory 공백으로 남겨 stale 기록과 별개 권고에 반영했다.

채택 unique evidence58: unit50/component3/API2/live3,26개 실제 소스 파일. 정적 E2E0/other0, skip/fixme/pending0. 이58은 전체 runtime test1259, catalog1072와 다른 수이다. Fresh counted records3 외17stale·1blocked는18named blockers로 보존했다. Freshness=mixed. active test만으로 live_only를 계산했으며 SYS26 하나(정직한 보고)다. 이를 손으로 지정하지 않았다.

8개 권고는 P0 current UI·fault coverage, SYS24 responsive, 부분 원문/의미 대조, 현재 UI journey/state,17live재관찰, live-only 재실행 검사, 기존 test-review 후속이다. 전체 선정 테스트를 happy-path-only로 가정하지 않았으며 각 실제 오류 조건의 일부 proof와 부족한 UI 상태를 분리했다.

정확한 Phase1 JSON은 frontmatter tempCoverageMatrixPath의 파일에 저장했고 같은 내용의 `coverage-matrix-system.json`을 보존했다. phase=PHASE_1_COMPLETE, collection_status=COLLECTED, allow_gate=true, target은 Step1 story/system 그대로다. 여기서는 gate를 결정하지 않았다. 최종판정은 Step5에서 수행한다.
