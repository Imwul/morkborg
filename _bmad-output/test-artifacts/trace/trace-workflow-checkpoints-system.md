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
sourceSha: 'b2b1bc17ffe63ae57b45c6d258eedd2895364ea0'
collectionStatus: 'COLLECTED'
coverageBasis: 'acceptance_criteria'
oracleConfidence: 'high'
oracleResolutionMode: 'formal_requirements'
oracleSources: ['docs/full-site-qa-20261011/requirements.md', '_bmad-output/test-artifacts/test-design/test-design-qa.md', '_bmad-output/test-artifacts/test-design/test-design-architecture.md']
externalPointerStatus: 'not_used'
tempCoverageMatrixPath: '/tmp/tea-trace-coverage-matrix-system-2026-10-11T07-55-16-985Z.json'
---

# Traceability Matrix — 추가 확정 수정 후 새 system run

## Step1 — 새 실행의 oracle와 identity

루트가 추가 확정 JSX key 경고 수정의 최종 코드 b2b1bc17을 기준으로 Step1–5 전체 재실행을 요청했다. Create를 선택하고 이미 completed인 같은 system run의 이전 결과를 ignored `outputs/full-site-qa-20261011/trace-history-9a7c57f/`에 보존한 뒤 이 문서를 완전히 교체했다. 이전 stepsCompleted나 coverage를 새 실행에 합치지 않았다. sourceSha는 현재 git HEAD의 정확한 값이며 이후 현재 SHA의 fresh proof만 채택한다.

Skill full read/resolve workflow 결과 prepend/append/persistent facts 없음, on_complete 빈값을 확인했다. resolve_config에서 승인된 modules.tea 설정이 존재하고 user_name/language 추가값은 없어 evaluator unknown·세션 한국어를 사용한다. knowledge는 Step1 closed five fragments(test-priorities-matrix/risk-governance/probability-impact/test-quality/selective-testing)를 실제 읽었으며 다른 예시 framework 패키지는 설치하지 않는다.

사용자 공식 QA01–07을 전사한 requirements.md와 이미 completed인 system TestDesign architecture/qa를 모두 다시 읽었다. 요구를 current 구현에서 합성하지 않았고 oracle high는 기준에 대한 confidence이며 원문 전수 완료를 뜻하지 않는다. 기존 관련 아키텍처 결정은 context로만 유지한다. NFR assessment system/legacy 파일이 없고 미측정 기준은 UNKNOWN으로 유지한다. 외부 pointer/계약 oracle은 사용하지 않았다. 기존 테스트가 존재하며 source/live coverage 공백은 다음 단계에 기록한다.

별도 story/epic/release/hotfix target을 사용자나 artifacts가 식별하지 않아 configured gate type story를 유지하고 runScope/runKey=system, targetId/Label 빈값으로 정했다. No story, epic, release, or hotfix target could be resolved; this run is scoped to system.

원문 독립 숫자 및 모든 행 source-status 작업은 별도로 최종 code HEAD에서 다시 실행했다. 변경은 JSX 경계이며 domain/RNG/원문 숫자 변경은 없다. Producer manifest는 준비 통지를 기다린 뒤 Step2에서만 수집한다. 이전 모든 c01/9a7 UI record의 SHA를 현재 source로 일괄 변경하지 않는다.


## Step2 — 실제 새 source 탐색과 producer 수집

`rg --files`/TypeScript AST로109파일·1,072 정적 test registrations를 재생성했다. unit961/componentSSR103/실제HTTP API8이며 static E2E는0다. runtime runner의1,259 subtests와 등록/unique 매핑 수는 구분한다. inventory에 stableID/title/file/line/level/skip/pending/fixme/reason/등록hash를 보존했다.

Producer가 manifest 준비를 통지한 뒤 contract_static/live enabled로 읽었다. git HEAD는 정확 b2b1bc17이며 header 일치, 총22records 중 counted3(SYS25/SYS26/new SYS12 partial), stale18(c01과9a7 이전 actual UI), blocked1(SYS20)의 계약 결과다. blocked는 먼저 status 판정하므로 이전9a7의 partial fault 관찰을 fresh fault라고 부르지 않는다. freshpass만 tests에 들어가며 나머지는 named blockers로 연결한다. invalid/fail/skipped/unverifiable0, duplicate ID0이다. 파일을 trace가 작성하거나 수정하지 않았다.

최종 `late-final-tests.log`는1259/1259 PASS, fail/cancelled/skipped/todo0, duration_ms204221.255875다. late-final-lint/build 성공, 타입/public55/private55 경계 성공, diffcheck 성공; related DNGNGEN30PASS는 producer가 별도 검사했다. 기존500kB chunk 경고는 실제 성능 검증 PASS/FAIL로 만들지 않는다.

### coverage_heuristics

- Endpoint: 기존 실제 private/hosted GET/POST/HEAD/host/origin/error와 private namespace 검사 발견. fake fetch unit와 실제 HTTP를 분리한다. 사용자 요구에 새 API를 만들지 않는다.
- Auth negative: 해당 source경계 deny/error assertions 존재. 생산 로그인·역할 시스템 요구는 없으며 검증 범위에 추가하지 않는다.
- Errors: number/manual-dice/import/schema/oversize 및 fake corrupt/Quota/IDB/CAS/stale tests 발견. fake environment를 actual browser로 바꾸어 보고하지 않는다.
- UI journeys: 모든 formal 주요 화면을 catalog와 producer에 연결할 수 있으나 최신 actual은 DNGNGEN 제한 경로뿐이다. 이전 전체 순회 기록의SHA는 그대로 유지한다.
- UI states: server-render/도메인 assertion이 있는 부분과 browser empty/invalid/error/return/reload가 필요한 부족한 부분을 다음 단계에서 구분한다. SYS20 미완료 fault는 blocked다.

### Live Verification Results

```json
{
  "collectionStatus": "COLLECTED",
  "sourceSha": "b2b1bc17ffe63ae57b45c6d258eedd2895364ea0",
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
      "observed_at": "2026-10-11T07:51:36.444744+00:00",
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
      "observed_at": "2026-10-11T07:51:36.444744+00:00",
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
      "observed_at": "2026-10-11T07:51:36.444744+00:00",
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
      "observed_at": "2026-10-11T07:51:36.444744+00:00",
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
      "observed_at": "2026-10-11T07:51:36.444744+00:00",
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
      "observed_at": "2026-10-11T07:51:36.444744+00:00",
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
      "observed_at": "2026-10-11T07:51:36.444744+00:00",
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
      "observed_at": "2026-10-11T07:51:36.444744+00:00",
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
      "observed_at": "2026-10-11T07:51:36.444744+00:00",
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
      "observed_at": "2026-10-11T07:51:36.444744+00:00",
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
      "observed_at": "2026-10-11T07:51:36.444744+00:00",
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
      "observed_at": "2026-10-11T07:51:36.444744+00:00",
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
      "observed_at": "2026-10-11T07:51:36.444744+00:00",
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
      "observed_at": "2026-10-11T07:51:36.444744+00:00",
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
      "observed_at": "2026-10-11T07:51:36.444744+00:00",
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
      "observed_at": "2026-10-11T07:51:36.444744+00:00",
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
      "observed_at": "2026-10-11T07:51:36.444744+00:00",
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
      "observed_at": "2026-10-11T07:51:36.444744+00:00",
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
      "evidence": "Executed on b2b1bc1 final source: tests1259/1259pass, fail/cancel/skip/todo0, duration204221.255875ms; lint exit0; client/servertypes+Vitebuild/public55/private55files exit0; gitdiffcheck0. DNGNGEN related30pass. Previous stagedGitprivacy950paths8ignored86unchangedshared passed; final updated artifact-stage privacy will run before publication. outputs/full-site-qa-20261011/late-final-tests.log; late-final-lint.log; late-final-build.log; late-dngngen-tests.log.",
      "observed_at": "2026-10-11T07:51:36.444744+00:00",
      "recorded_source_sha": "b2b1bc17ffe63ae57b45c6d258eedd2895364ea0"
    },
    {
      "id": "system-LIVE-26",
      "requirement_id": "SYS-26",
      "title": "Honest evidence report with unresolved scope",
      "level": "live",
      "status": "pass",
      "disposition": "counted",
      "invalid_reason": "",
      "evidence": "Producer report docs/full-site-qa-20261011/report.md records actual visited paths, source pages,23confirmed fixes, latest1259pass checks, local BeforeAfter, missing original/semantic/IDB/denied/CAS/device evidence, owner production login smoke missing, and historical c01/9a7 vs fresh b2b DNGNGEN observations. Final current Trace verdict will be updated after workflow; no whole-source or full current live rerun claimed.",
      "observed_at": "2026-10-11T07:51:36.444744+00:00",
      "recorded_source_sha": "b2b1bc17ffe63ae57b45c6d258eedd2895364ea0"
    },
    {
      "id": "system-LIVE-late-shelf-quota",
      "requirement_id": "SYS-18",
      "title": "Late quota UI correction and normal Shelf save recovery",
      "level": "live",
      "status": "pass",
      "disposition": "stale",
      "invalid_reason": "",
      "evidence": "Actual same quota condition after late Korean text change: save rejected, oldrawexact; cleaned153QAkeys+backup, existing record edited/saved successfully, editorclosed,alert0,all7counts retained. Historical all4kind CRUD remains at c01, not freshly repeated here. browser-main.json shelf-live-quota-korean-error-after and shelf-quota-cleanup-normal-save-recovery; live-storage-fault-metadata.json.",
      "observed_at": "2026-10-11T07:51:36.444744+00:00",
      "recorded_source_sha": "9a7c57f8f9f2d120210a8cd7f0507d78535637f8"
    },
    {
      "id": "system-LIVE-late-dngngen-key",
      "requirement_id": "SYS-12",
      "title": "Fresh DNGNGEN feature rendering and preview without key spread warning",
      "level": "live",
      "status": "pass",
      "disposition": "counted",
      "invalid_reason": "",
      "evidence": "Actual late error reproduced in existing e7 code, key/text/ko explicit boundary fix; rendered DOM unchanged through HMR. Fresh new tab after fix and committed b2b source generated reason/entrance/guard/all4rooms/main+preview, whole and three individual rerolls preserve other room, COPY contains fields, fresh console0. Only this subset of SYS12 is fresh; earlier full Dungeon/Core/source-switch/save/nested table coverage stays historical c01. outputs/full-site-qa-20261011/dngngen-late-proof.json; dngngen-late-before-console.json; dngngen-late-after-console.json.",
      "observed_at": "2026-10-11T07:51:36.444744+00:00",
      "recorded_source_sha": "b2b1bc17ffe63ae57b45c6d258eedd2895364ea0"
    }
  ],
  "liveManifestHeader": {
    "present": true,
    "results_file": "/Users/imwul/.codex/workspaces/morkborg-personal-site-20261010/_bmad-output/test-artifacts/live-verification-results.json",
    "source_sha": "b2b1bc17ffe63ae57b45c6d258eedd2895364ea0",
    "observed_at": "2026-10-11T07:51:36.444744+00:00",
    "producer": "/root actual CUA walkthrough and final existing verification commands",
    "read_error": "",
    "current_source_sha": "b2b1bc17ffe63ae57b45c6d258eedd2895364ea0"
  }
}
```


## Step3 — 새 source의 criteria mapping

공식 QA01–07과 승인된 SYS01–26를 모두 다시 매핑했다. 현재 source는 b2b이며 FULL6/PARTIAL6/UNIT-ONLY13/NONE1이다. 전체등록1,072의 stable metadata와 등록 source hash가 이전 run과 같아 이미 읽은 관련 assertions의 의미를 유지하고 현재1259 PASS 및 독립 source audits를 재실행 근거로 연결했다. 원문을 대신해 test expectations를 사용하지 않았다.

SYS12 fresh live는 key 수정된 DNGNGEN 제한 경로이며 whole Core/native/twelve parts/수동보존/save 흐름은 현재입증되지 않아 PARTIAL. SYS18의 이전9a7 freshquota도 이 run에서는 stale이며 UNIT-ONLY다. 해당 부족을 계층 수나 파일 변화 없음으로 FULL 승격하지 않았다. Current SYS25/26와 source basics01/02/03/05만FULL이고 원문 currentRECLVSE 및 전체semantic공백04/06은PARTIAL을유지한다.

| Criterion | Priority | Coverage | 근거/제한 |
| --- | --- | --- | --- |
| SYS-01 | P1 | FULL | Core PDF21/23/27/29 및 Core6/FER4/HER2의 기본 시작값 직접 대조. 모든 attachment는 SYS06의 전수 조건 공백으로 별도 유지. |
| SYS-02 | P1 | FULL | FER PDF2–3과 독립1,728조합. HP 본문/괄호 충돌과 동률 미지정은 추측 변경 없이 보고. |
| SYS-03 | P1 | FULL | SD PDF5/7–9/15/17 및 Depths PDF6/9–13/15–19/25의 해당 절차를 직접 대조. 원문이 아닌 기존 TR3–30 앱 계약은 분리. 전체 표의 모든 조건은 SYS06 범위. |
| SYS-04 | P1 | PARTIAL | 기존 원본 렌더11/12/85와 현재 Sources 코드는 제한 대조. fresh PDF와 전체 현재 판본을 재확보하지 못해 현재 원문 충실도는 미완료. 테스트의 sourceVerified flag를 원문으로 인정하지 않는다. |
| SYS-05 | P1 | FULL | Mythic PDF20/26–27/38/68/163/165/187 직접 대조 및 Chart81셀/8,100·Check8,100·Scene180. 모든 Meaning/Variation 적용은 SYS06 공백. |
| SYS-06 | P1 | PARTIAL | 548표/12,328행 screening은 완료. fresh originals가 없는4,394행과 모든 range/condition/translation/attachment semantic 승인 공백이 남아 있다. normalized match를 전체 규칙 승인으로 승격하지 않는다. |
| SYS-07 | P1 | PARTIAL | SSR Home destination assertions establish part of the controls; the actual c01 journey is historical/stale at current HEAD. |
| SYS-08 | P1 | UNIT-ONLY | Search/filter domain assertions pass at current HEAD, but the actual rendered reader/filter journey remains c01 historical/stale. |
| SYS-09 | P1 | UNIT-ONLY | Linked reading, selection and invalid-TR domain guards are current automated proof; the wired UI path has only stale c01 live records. |
| SYS-10 | P1 | UNIT-ONLY | Native generator and immutable translation assertions pass, but current character UI source/save/reopen was not freshly repeated. |
| SYS-11 | P1 | UNIT-ONLY | Active Monster and FER numeric proof passes; the reachable active UI was observed at c01 and is stale here. Inactive legacy manual editor remains N/A, not verified. |
| SYS-12 | P1 | PARTIAL | Current domain and SSR assertions plus fresh b2b live DNGNGEN reason/entrance/guard/special rooms1-4/preview reroll/console0 establish the corrected JSX key boundaries. Whole Core/native twelve-part/manual/source/save journey is c01 historical/stale. |
| SYS-13 | P1 | UNIT-ONLY | Current generator and Wind regression assertions are accepted partial proof; actual remaining-generator control families were visited at c01 and are stale here. |
| SYS-14 | P1 | UNIT-ONLY | Spatial link/domain assertions pass; actual map/action/pan/return/reload journey is only historical c01 proof. |
| SYS-15 | P1 | UNIT-ONLY | Dice/formula boundaries pass; current rendered eight-choice/guidance/input-recovery journey lacks fresh live proof. |
| SYS-16 | P1 | UNIT-ONLY | Critical/fumble/manual-HP calculation assertions pass; the combat control-family/ranged/shield/roster journey has stale c01 live evidence. |
| SYS-17 | P1 | UNIT-ONLY | Fate/scene/list boundaries pass; actual current Mythic UI edit/cleanup/reload has only historical c01 live proof. |
| SYS-18 | P0 | UNIT-ONLY | Current immutable snapshot assertion proves part of data preservation. Four-kind full CRUD is c01 historical/stale and the late quota/normal save recovery is9a7 historical/stale; no fresh b2b full Shelf journey. |
| SYS-19 | P0 | UNIT-ONLY | Current schema/kind/date/duplicate tests establish import guards; the actual file chooser/export/append journey is only historical c01 proof. |
| SYS-20 | P0 | PARTIAL | Current actual-store/component and fake Quota/CAS/offline assertions establish guards. Fresh blocked producer record retains real corruption/Quota observations but contributes no coverage; actual IDB/denied/offline/CAS branches remain incomplete. |
| SYS-21 | P1 | UNIT-ONLY | Memory isolation assertions pass; current rendered Tray/Scratch/Last/Pack/Recipe control paths retain only stale c01 live evidence. |
| SYS-22 | P1 | PARTIAL | Backup/update domain and actual HTTP success/denial/error tests establish part of Sources. Fresh current file chooser, settings and About UI journey is missing. |
| SYS-23 | P1 | UNIT-ONLY | Navigation state assertion preserves current domain behavior; actual keyboard/Esc/reload/console coverage is c01 historical/stale. |
| SYS-24 | P1 | NONE | Three viewport walkthroughs and 32 geometry observations were genuinely completed at c01; all live responsive proof is stale at the current code HEAD and no accepted current test establishes this criterion. |
| SYS-25 | P0 | FULL | Current b2b late-final tests1259/1259, related DNGNGEN30, lint/build/diffcheck success and public/private55 boundary proof; source tests/assertions and two JSX-only boundaries remain reviewable. |
| SYS-26 | P2 | FULL | Current report records23 fixes, original pages, latest1259 checks, local Before/After and unresolved scope; c01/9a7 historical observations and b2b limited fresh observations remain separate. |

### 매핑한 stable test locations

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

현재 채택한 실행 테스트 없음. 제한 source/historical live는 설명으로만 보존한다.

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
- `system-LIVE-late-dngngen-key` (live, no file) — live / P1 / active / `system-LIVE-late-dngngen-key`: Fresh DNGNGEN feature rendering and preview without key spread warning

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

현재 채택한 실행 테스트 없음. 제한 source/historical live는 설명으로만 보존한다.

#### SYS-25 — 최소 수정·원문/데이터 보존·최종 tests/lint/type/build/privacy

- `tests/public-build.test.ts:22` — unit / P0 / active / `NODE:tests/public-build.test.ts:22`: privacy boundary rejects renamed packs, secret bytes, excerpts and local paths
- `tests/public-build.test.ts:54` — unit / P0 / active / `NODE:tests/public-build.test.ts:54`: ciphertext and its matching manifest pass without embedding private plaintext or keys
- `tests/published-server.test.ts:164` — api / P0 / active / `NODE:tests/published-server.test.ts:164`: production preview shares the real API handler and never serves plaintext or SPA for API errors
- `tests/translation-ui-terms.test.ts:48` — unit / P0 / active / `NODE:tests/translation-ui-terms.test.ts:48`: companion terminology corrections require the matching English meaning and keep dice
- `system-LIVE-25` (live, no file) — live / P0 / active / `system-LIVE-25`: Final existing checks and private boundaries

#### SYS-26 — 실제 visited/source/bugs/fixes/test/gap/전후 증거의 정직한 보고

- `system-LIVE-26` (live, no file) — live / P2 / active / `system-LIVE-26`: Honest evidence report with unresolved scope

### Coverage 검증과 rejectedEvidence

계층 수는 FULL근거가 아니다. 같은 case가 여러기준에 연결되면 관련assertion만 적용하며58 unique가61mapping assignments와 다르다. P0/P1의부족과current18UIjourney/state공백을유지한다. API경계의actualHTTP denial/error가있고 loginrole요구는N/A다. Fresh fail0, unknowncriterion0, contradicted0. 비채택stale18/blocked1는tests에안넣는다. Selected assertions가해당행동을전혀입증하지않으면서SYS이름만붙은case는없어 rejectedEvidence=[]이다. 전체catalog전수 품질심사를주장하지않는다.

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
    "observed_at": "2026-10-11T07:51:36.444744+00:00",
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
    "observed_at": "2026-10-11T07:51:36.444744+00:00",
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
    "observed_at": "2026-10-11T07:51:36.444744+00:00",
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
    "observed_at": "2026-10-11T07:51:36.444744+00:00",
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
    "observed_at": "2026-10-11T07:51:36.444744+00:00",
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
    "observed_at": "2026-10-11T07:51:36.444744+00:00",
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
    "observed_at": "2026-10-11T07:51:36.444744+00:00",
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
    "observed_at": "2026-10-11T07:51:36.444744+00:00",
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
    "observed_at": "2026-10-11T07:51:36.444744+00:00",
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
    "observed_at": "2026-10-11T07:51:36.444744+00:00",
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
    "observed_at": "2026-10-11T07:51:36.444744+00:00",
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
    "observed_at": "2026-10-11T07:51:36.444744+00:00",
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
    "observed_at": "2026-10-11T07:51:36.444744+00:00",
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
    "observed_at": "2026-10-11T07:51:36.444744+00:00",
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
    "observed_at": "2026-10-11T07:51:36.444744+00:00",
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
    "observed_at": "2026-10-11T07:51:36.444744+00:00",
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
    "observed_at": "2026-10-11T07:51:36.444744+00:00",
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
    "observed_at": "2026-10-11T07:51:36.444744+00:00",
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
    "evidence": "Executed on b2b1bc1 final source: tests1259/1259pass, fail/cancel/skip/todo0, duration204221.255875ms; lint exit0; client/servertypes+Vitebuild/public55/private55files exit0; gitdiffcheck0. DNGNGEN related30pass. Previous stagedGitprivacy950paths8ignored86unchangedshared passed; final updated artifact-stage privacy will run before publication. outputs/full-site-qa-20261011/late-final-tests.log; late-final-lint.log; late-final-build.log; late-dngngen-tests.log.",
    "observed_at": "2026-10-11T07:51:36.444744+00:00",
    "recorded_source_sha": "b2b1bc17ffe63ae57b45c6d258eedd2895364ea0"
  },
  {
    "id": "system-LIVE-26",
    "requirement_id": "SYS-26",
    "title": "Honest evidence report with unresolved scope",
    "level": "live",
    "status": "pass",
    "disposition": "counted",
    "invalid_reason": "",
    "evidence": "Producer report docs/full-site-qa-20261011/report.md records actual visited paths, source pages,23confirmed fixes, latest1259pass checks, local BeforeAfter, missing original/semantic/IDB/denied/CAS/device evidence, owner production login smoke missing, and historical c01/9a7 vs fresh b2b DNGNGEN observations. Final current Trace verdict will be updated after workflow; no whole-source or full current live rerun claimed.",
    "observed_at": "2026-10-11T07:51:36.444744+00:00",
    "recorded_source_sha": "b2b1bc17ffe63ae57b45c6d258eedd2895364ea0"
  },
  {
    "id": "system-LIVE-late-shelf-quota",
    "requirement_id": "SYS-18",
    "title": "Late quota UI correction and normal Shelf save recovery",
    "level": "live",
    "status": "pass",
    "disposition": "stale",
    "invalid_reason": "",
    "evidence": "Actual same quota condition after late Korean text change: save rejected, oldrawexact; cleaned153QAkeys+backup, existing record edited/saved successfully, editorclosed,alert0,all7counts retained. Historical all4kind CRUD remains at c01, not freshly repeated here. browser-main.json shelf-live-quota-korean-error-after and shelf-quota-cleanup-normal-save-recovery; live-storage-fault-metadata.json.",
    "observed_at": "2026-10-11T07:51:36.444744+00:00",
    "recorded_source_sha": "9a7c57f8f9f2d120210a8cd7f0507d78535637f8"
  },
  {
    "id": "system-LIVE-late-dngngen-key",
    "requirement_id": "SYS-12",
    "title": "Fresh DNGNGEN feature rendering and preview without key spread warning",
    "level": "live",
    "status": "pass",
    "disposition": "counted",
    "invalid_reason": "",
    "evidence": "Actual late error reproduced in existing e7 code, key/text/ko explicit boundary fix; rendered DOM unchanged through HMR. Fresh new tab after fix and committed b2b source generated reason/entrance/guard/all4rooms/main+preview, whole and three individual rerolls preserve other room, COPY contains fields, fresh console0. Only this subset of SYS12 is fresh; earlier full Dungeon/Core/source-switch/save/nested table coverage stays historical c01. outputs/full-site-qa-20261011/dngngen-late-proof.json; dngngen-late-before-console.json; dngngen-late-after-console.json.",
    "observed_at": "2026-10-11T07:51:36.444744+00:00",
    "recorded_source_sha": "b2b1bc17ffe63ae57b45c6d258eedd2895364ea0"
  }
]
```

### Rejected Evidence

```json
[]
```


## Step4 — 새 Phase1 merge와 공백 분석

Explicit execution mode 없음, config auto/probe=true, actual collaboration subagent 가능하므로 auto→subagent. 기존 storage 담당자에게 read-only count/dedup/live-only를 위임했고 gap/heuristic/live rollup을 독립 진행해 새 계산끼리 비교 후 merge했다. 응답26criteria/6FULL6PARTIAL13UNIT-ONLY1NONE·58unique·3counted18stale1blocked와완전히일치한다. 다른run수치를합치지않았다.

FULL6/26 Math.round23%;P0 1/4=25%;P1 4/21=19%;P2 1/1=100%;P3 0/0=N/A(machine safePct 기본100으로실검증승인아님). Critical P0 SYS18/19/20,High P1 NONE SYS24;Medium/Low NONE0. Partial/UnitOnly도우선순위FULL비율에서제외. source gaps04/06과현재18majorUIjourney/state공백은보존한다. 실제source경계HTTPdenied/error관련endpoint/authgap0이며로그인역할기준은만들지않았다.

채택unique58(unit50/component3/API2/live3),26source파일,skip/fixme/pending0. Current counted3 외18stale·1blocked를19namedblockers로기록했다. Freshnessmixed;현재활성tests만으로derive live-only SYS26 하나, 손으로flag를설정하지않았다. Fresh SYS12는부분시나리오이며전체Core/nativeCRUD승격없음;9a7quota복구는이전관찰로보존한다.

Quality: 선택source파일최대731줄,선택NODE46개모두현재log에서명확한durationline매칭,최대336.47775ms로90초미만. 전체runner log에는미선택단일Oraclepresentationcase190134.272375ms가있어90초quality권고초과WARNING으로보고한다. 최초전체90초assertion은실패해원인을찾았고test/expectations를바꾸지않았다. 실제live duration은UNKNOWN. 기존TestReview의구조6High/6Medium도별도warning이며앱성능SLA또는규칙오류로만들지않는다.

8권고는현재P0증거/반응형/currentUIstate/부분원문과semantic/18기록재관찰/live-onlyre-runnable/기존quality후속이다. Exact phase1tempfile는frontmatterpath,내용동일coverage-matrix-system.json보존본을저장했다. phase=PHASE_1_COMPLETE,collection_statusCOLLECTED,allow_gatetrue,targetidentity불변이며이단계는gate를결정하지않는다.
