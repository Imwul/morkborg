---
runScope: 'system'
runKey: 'system'
workflowStatus: 'completed'
totalSteps: 5
stepsCompleted: ['step-01-detect-mode', 'step-02-load-context', 'step-03-risk-and-testability', 'step-04-coverage-plan', 'step-05-generate-output']
lastStep: 'step-05-generate-output'
nextStep: ''
lastSaved: '2026-10-11'
inputDocuments: ['docs/full-site-qa-20261011/requirements.md', 'README.md', 'docs/freeform-reference-audit.md', 'docs/rule-sources.md', 'docs/personal-hosted-site.md', 'package.json', '_bmad/config.toml', '/Users/imwul/.agents/skills/bmod-tea/knowledge/tea-index.csv', '/Users/imwul/.agents/skills/bmod-tea/knowledge/adr-quality-readiness-checklist.md', '/Users/imwul/.agents/skills/bmod-tea/knowledge/nfr-criteria.md', '/Users/imwul/.agents/skills/bmod-tea/knowledge/test-levels-framework.md', '/Users/imwul/.agents/skills/bmod-tea/knowledge/risk-governance.md', '/Users/imwul/.agents/skills/bmod-tea/knowledge/test-quality.md', '/Users/imwul/.agents/skills/bmod-tea/knowledge/playwright-cli.md']
---

# 시스템 품질 감사 — Test Design 진행 기록

## Step 1 — 범위와 선행 자료

- 실행 모드: Create, system. 사용자의 전체 사이트 QA 요청과 조정자의 명시적 system 범위 지정을 따랐다.
- 요구사항: `docs/full-site-qa-20261011/requirements.md`의 QA-01–QA-07은 사용자의 현재 요청을 전사한 공식 acceptance criteria이다. 신규 제품 PRD를 만들지 않는다.
- 아키텍처와 결정 근거: `README.md`, `docs/freeform-reference-audit.md`, `docs/rule-sources.md`, `docs/personal-hosted-site.md`. 기존 구현의 설명이며 독립 룰북 증거로 사용하지 않는다.
- 기존 동일 범위/legacy 진행 기록은 존재하지 않았다. 이전 단계 배열을 가져오지 않은 새 실행이다.
- 프로젝트: `codex`; test_artifacts: `_bmad-output/test-artifacts`; TEA 설정과 지식 색인은 정상적으로 확인했다.
- 언어 설정 키는 없으므로 사용자의 대화 언어인 한국어를 따른다. Playwright/Pact flag만으로 패키지나 새 프레임워크를 도입하지 않는다.
- 실제 브라우저 검증과 룰북 감사는 아직 진행 중이다. 검사 계획 완료와 사이트의 전체 통과 판정을 구분한다.

## Step 2 — 문서와 지식 기반

- 스택 자동 탐지: React/TypeScript/Vite frontend. 별도의 Node 로컬 서버와 Vercel Function도 존재하므로 경계 검증에서는 서버 맥락을 함께 유지한다. 네이티브 모바일 스택은 없다.
- 기존 runner는 `node:test` + `tsx`; 테스트 대상은 순수 도메인/생성기, Zod 검증, 브라우저 저장 및 암호화 API 경계다. 이번 실제 UI 증거는 CUA in-app browser에서 다른 감사 담당자가 수집한다.
- API 경계: 룰북 data bundle, 사전 확보한 private generator snapshot, IndexedDB/localStorage, 선택적 개인 기록과 백업. 새 굴림은 플레이 단계/HP/기존 캠페인을 자동으로 바꾸지 않는 기존 결정이 있다.
- 무결성/보안 NFR: 평문 원본과 발행 키의 Git/정적 빌드 유입 금지, 개인 데이터 형식 보존, 손상된 기록의 무단 덮어쓰기 금지, 암호화 bundle 검증. production Vercel 인증은 로컬 브라우저로 증명할 수 없다.
- 성능/SLA/RTO/RPO 임계값은 공식 요구사항에 없다. 템플릿 예시 수치를 요구사항으로 추가하지 않으며 성능 측정 통과 판정을 하지 않는다.
- system 필수 지식 5개와 auto 모드 Playwright CLI 지식을 모두 읽었다. Pact와 관련 utility 패키지/계약/broker가 없어서 조건부 계약 테스트 분기는 열지 않았다. `tea_use_*` flag=true만으로 의존성을 추가하지 않는다.
- CUA 우선 및 조정자의 명시적 브라우저 소유 정책을 따른다. Playwright CLI 탐색은 실행하지 않았으며 실제 UI 검증을 정적 분석으로 대체하지 않는다.
- Epic/story는 기존 앱의 전체 감사에 필요하지 않다. 현재 공식 acceptance와 architecture decision 문서가 선행 자료 역할을 충족한다. 불확실한 원문과 측정 불가 NFR은 gap으로 남긴다.

## Step 3 — Testability와 위험

### 먼저 해결할 증거 공백

- Controllability: 순수 계산의 주사위 입력과 synthetic 저장 데이터는 제어 가능하다. 실제 브라우저의 손상 저장·IndexedDB 거부·오프라인 오류 주입은 현재 증거가 없다. 정상 저장 테스트로 이 환경 경계를 통과했다고 하지 않는다.
- Observability: CUA 상태/동일 흐름 전후 화면/console 관찰과 Node TAP은 확보 가능하다. 전체 페이지·모든 기기 폭 완료 목록은 진행 중이다. metrics/load trace나 실제 Vercel 인증 관찰은 없다.
- Reliability: 독립 localhost origin을 저장 담당자가 사용한다. private PDF와 개인 자료는 ignored 경로에서만 읽는다. 기존 캠페인, 기록, 원문 bundle을 검사 편의를 위해 변경하지 않는다.

### 확인한 강점

- 도메인 계산은 UI 없이 직접 호출 가능하며 단위 테스트와 독립 원문 입력 대조를 할 수 있다.
- Zod 기반 자료/기록 검증, 원본 유지, 원자적 저장, 교차 탭 CAS, 다운로드 stale-response 방어가 기존 저장 문서·테스트와 저장 담당 기록에 존재한다.
- existing build에 공개 빌드/비공개 경계 검사가 포함된다. 자료를 runtime 외부 사이트에서 다시 생성하지 않는 snapshot 경계도 명시되어 있다.

### ASR

| ID | 분류 | 기존 요구와 검증 행동 |
| --- | --- | --- |
| ASR-01 | ACTIONABLE | QA-01: 룰북과 snapshot authority를 분리하고 불확실한 규칙을 수정하지 않는다. 숫자·범위·후속 조건을 source page와 대조한다. |
| ASR-02 | ACTIONABLE | QA-03/README 저장: 결과의 임시 상태, 개인 기록의 영속 상태, 구형 기록 보존을 서로 검사한다. |
| ASR-03 | ACTIONABLE | QA-06/personal-hosted-site: 평문/키 유입 없이 private 자료의 검증·정적 빌드 검사를 실행한다. |
| ASR-04 | FYI | README의 자유 참고집 정책: 자동 진행·자동 HP와 전체 solo 절차 구현을 가정하지 않는다. |
| ASR-05 | FYI | 개인 배포의 Vercel 보호는 로컬 CUA가 확인할 수 없으며 이번 로컬 감사의 인증 PASS 범위에 넣지 않는다. |

### 근거가 있는 위험 등록부

| ID | Category | 근거·위험 | P | I | 점수 | 완화·담당·시점 |
| --- | --- | --- | ---: | ---: | ---: | --- |
| R-01 | BUS | QA-01의 모든 규칙 요구 대비 rulebook-findings의 미대조 표/RECLVSE 원본 부재. 불확실한 원문을 정확하다고 승인할 위험. | 2 | 3 | 6 | 룰 감사 담당: fresh-source/old-render를 구분하고 미확인 표를 gap으로 유지. 최종 trace 전. |
| R-02 | DATA | QA-03의 경계 검사와 storage-findings ST-02: 손상된 Shelf가 대체 빈 상태를 정상 백업으로 내보낼 수 있었다. | 3 | 2 | 6 | 저장 담당: export guard+원본 byte 보존 회귀, 정상 파일 왕복 CUA. 최종 regression 전; 손상 live browser는 미확인. |
| R-03 | TECH | QA-02/03 대비 storage-findings ST-04: SEND TO SCRATCH 성공 후 읽을 진입점이 없었다. | 3 | 2 | 6 | 조정자: 기존 패널 연결만 고치고 같은 NPC→Scratch 흐름 재검증. 최종 browser 전. |
| R-04 | BUS | QA-01/05 대비 CombatPanel의 수동 배수 안내와 실제 자동2배 계산 불일치. | 3 | 1 | 3 | 도구 담당: 문구만 최소 수정하고 natural20/1 결과·HP 직접처리 유지 확인. 최종 browser 전. |
| R-05 | TECH | QA-04 모바일/태블릿/데스크톱 요구 대비 현재 폭별 전수 실제 증거가 진행 중이다. | 2 | 2 | 4 | 조정자: 실제 지원 가능한 geometry별 확인, 미측정 폭은 gap. 최종 trace 전. |
| R-06 | SEC | QA-06 및 README의 평문/키 exclusion을 수정된 빌드가 계속 만족해야 한다. 확인하지 않은 build로 승인할 위험. | 2 | 3 | 6 | 조정자: 기존 build/privacy/git 검사 결과 확보. 최종 regression 전. |
| R-07 | DATA | QA-03 대비 storage-findings ST-03: IndexedDB 읽기/쓰기 거부 환경에서 전체 자료 activation이 실패하는 경계는 실제 브라우저 미재현. | 2 | 2 | 4 | 조정자/저장 담당: 원자성 정책을 임의 변경하지 않고 오류 주입 가능 여부와 한계 기록. 최종 보고 전. |

점수는 현재 증거로 판단한 위험 우선순위이며 최종 gate 결과가 아니다. 점수6은 문서화한 완화가 필요하다. 사용자 waiver는 받지 않았으며 원문 부재를 자동 waiver 처리하지 않는다.

### NFR 검증 계획

- 보안: source/public-build/private-boundary의 기존 검사를 증거로 요구한다. 실제 production auth/TLS는 별도 환경 증거가 필요하다.
- 신뢰성/데이터: 잘못된 백업 거부와 기존 자료 유지, 정상 import append/undo/reload를 실제 브라우저와 낮은 수준의 저장 테스트 양쪽에서 확인한다. 손상/Quota/IDB 경계는 가능한 측정과 미측정을 분리한다.
- 유지보수성: 현재 lint/typecheck/test/build 수행 결과를 확인한다. 코드 coverage%/중복률 임계값은 UNKNOWN; 예시80%/5%를 요구사항으로 쓰지 않는다.
- 성능/가용성/RTO/RPO는 UNKNOWN이다. 개인 사이트 QA가 요청한 반응/오류 상태만 검사하며 신규 load tool, SLA, 인프라를 추가하지 않는다.

## Step 4 — 범위 계획

각 항목은 검사 계획이며 통과 표시가 아니다. `UI/E2E`는 CUA 실제 브라우저, `Unit/Integration`은 기존 Node runner 또는 비공개 독립 원문 대조다. 같은 수학을 UI에서 전수 반복하지 않고 입력·표시·상태 연결을 검사한다.

| Scenario | QA | Priority | Level | 원자적 확인 범위 | Risk Link |
| --- | --- | --- | --- | --- | --- |
| SYS-01 | QA-01 | P1 | Unit + source audit | Core 자원·능력치·HP·scroll 장비·직업 보정 원문 경계 | R-01 |
| SYS-02 | QA-01 | P1 | Unit + source audit | FER A/B/C·HP·사기·방어구와 동률/모순 설명 | R-01 |
| SYS-03 | QA-01 | P1 | Unit + source audit | SD/Depths 여행·던전·TR/DR·lockpick·위험 후속 | R-01 |
| SYS-04 | QA-01 | P1 | Unit + source audit | RECLVSE 두 d20 치명/질문 경계와 missing PDF 한계 | R-01 |
| SYS-05 | QA-01 | P1 | Unit + source audit | Mythic Chart/Check/Scene/Prepared/Event와 CF | R-01 |
| SYS-06 | QA-01 | P1 | Integration + source audit | 전체 표 행 범위·nested ref·책/지역/원문 authority 구분 | R-01 |
| SYS-07 | QA-02/03 | P1 | UI/E2E | Home 빠른 참조→표/굴림→copy/pin→돌아오기 | R-05 |
| SYS-08 | QA-02/03 | P1 | UI/E2E | 검색 빈/없는결과·책/유형/상황 필터→rule/table/book/region/creature reader | R-05 |
| SYS-09 | QA-02/03 | P1 | UI/E2E | procedure nested linked ref→독립 roll/manual/partial hold→return | R-01 |
| SYS-10 | QA-02/03 | P1 | UI/E2E | character classless/class/Core/native source 선택·다시굴림·한국어/원문 | R-01 |
| SYS-11 | QA-02/03 | P1 | UI/E2E | monster source·외형/자동값 연동·수동 수정 유지 | R-01 |
| SYS-12 | QA-02/03 | P1 | UI/E2E | dungeon Core/native reason/guard/special4·개별 reroll·표 연결 | R-01 |
| SYS-13 | QA-02/03 | P1 | UI/E2E | NPC/room/street/settlement와 supplementary generator 정상 입력/결과 | R-05 |
| SYS-14 | QA-02/03 | P1 | UI/E2E | dungeon/city/journey 공간 그림→hotspot reader→return | R-05 |
| SYS-15 | QA-02/03 | P1 | UI/E2E | 일반주사위 면/개수/보정·invalid physical dice·play guidance | R-01 |
| SYS-16 | QA-02/03 | P1 | UI/E2E | combat natural20/1/방어/Omens→계산→기록/undo; 안내 일치 | R-04 |
| SYS-17 | QA-02/03 | P1 | UI/E2E | Mythic Odds/CF/Chart/Check/Scene/Event/list edit/reload/invalid | R-01 |
| SYS-18 | QA-02/03 | P0 | UI/E2E | Shelf 모든 kind 생성/save/select/edit cancel/save/duplicate/copy/delete/undo/reload | R-02 |
| SYS-19 | QA-02/03 | P0 | UI/E2E | Shelf export 실제 파일→import append·invalid/크기/count/kind 실패 뒤 기존기록 유지 | R-02 |
| SYS-20 | QA-03 | P0 | Integration | 손상 byte/Quota/IDB/CAS/stale update에서 덮어쓰기 금지 | R-02, R-07 |
| SYS-21 | QA-02/03 | P1 | UI/E2E | Tray/Scratch/Last 읽기·send·copy·clear·reload 수명 | R-03 |
| SYS-22 | QA-02/03 | P1 | UI/E2E | Sources 자동갱신 pause/check·자료 backup/restore 취소/invalid·About | R-07 |
| SYS-23 | QA-03 | P1 | UI/E2E | Esc/shortcut/back/reload와 visited flow console 오류 | R-05 |
| SYS-24 | QA-04 | P1 | UI/E2E | 주요 reader/generator/tools/Shelf mobile/tablet/desktop clipping·focus·long text | R-05 |
| SYS-25 | QA-05/06 | P0 | Integration + static/build | 최소 수정/원문 불변·전체 Node/lint/type/build/privacy | R-06 |
| SYS-26 | QA-07 | P2 | Artifact review | 실제 visited list·전후 증거·source pages·불확실/미측정 report | R-01, R-05 |

P0는 기록 무결성/비공개 경계 손상이 핵심이고 안전한 사이트 결과를 대신할 우회가 없다. P1은 frequent core reader/generator/calculator 경로이며 원문 수동 사용은 가능하나 사이트 기능을 대체하지 못한다. 보완 보고 품질은 P2이다. 실측 사용률/수익 지표가 없으므로 비율을 만들어 우선순위를 정하지 않는다.

### NFR 증거 계획

- SEC R-06: 기존 public-build/private-boundary/hosted-generators 테스트 및 최종 build/privacy 로그. production auth는 미확인 상태를 기록한다.
- DATA/신뢰성 R-02/R-07: storage-focused tests, 정상 실제 download/import 결과, invalid import 후 기존 count·내용. live corrupt/IDB refusal는 구현검사와 별도 한계다.
- TECH R-03/R-05: 동일 UI 경로 전후 capture, actual browser labels/outcomes/console. geometry 측정이 없으면 여러 폭 PASS를 쓰지 않는다.
- 유지보수성: 기존 lint/TypeScript/Node 전체 suite/build 로그를 사용한다. code coverage%와 latency/RTO/SLA는 UNKNOWN이다.

### 실행/범위 추정

- PR/현재 감사: P0 저장·privacy 및 변경된 경로 먼저, P1 실제 브라우저 다음, 15분 미만인 기존 전체 functional suite를 최종 한 번 수행한다. 신규 실패/변경이 없으면 반복 실행하지 않는다.
- Nightly/Weekly: 기존 장시간 performance/chaos suite는 없다. 새 scheduling/tooling을 이 감사에서 만들지 않는다. 전체 원문/기기 추가 검토는 별도의 아직 남은 작업으로 기록한다.
- 남은 수동 검토의 계획 추정만 사용한다: P0 약2–5시간, P1(모든 미대조 원문 포함) 약18–45시간, P2 약2–5시간, P3 약0–2시간; 총 약22–57시간. 현재 이미 수행한 작업 시간이나 완료 예정 약속이 아니다. 원본 재확보·환경 제어 여부에 따라 달라진다.
- 계획 gate: P0 pass100%, P1 pass≥95%, 점수≥6 완화 증거, 일반 기술 coverage 최소80%. 사용자가 전수 QA를 요청했으므로 **완료 보고의 표면 커버리지 목표는100%**이며 80% 기준만 달성해 전체 완료라고 하지 않는다. source/actual UI/NFR 증거 없는 PASS 금지.
- 최종 coverage gate는 trace의 실제 엔진을 따른다. test-design은 NFR 최종 PASS/CONCERNS/FAIL을 평가하지 않는다.

## Step 5 — 산출물/검증 완료

- `test-design-architecture.md`, `test-design-qa.md`, `codex-handoff.md`를 제공된 system 템플릿의 구조로 작성하고 전체 내용을 검토했다. 신규 개발 phase가 아닌 기존 감사이므로 해당 template 예시는 N/A로 명시했다.
- Execution mode: explicit override 없음 → config auto/probe true → runtime의 실제 협업 agent team 사용 가능 확인. 4개 slot은 조정자/룰/브라우저/저장 담당으로 사용 중이므로 추가 worker는 만들지 않았다. 독립 증거를 팀에서 수집하며 문서 생성/일관성 검증은 이 담당자가 순차 수행했다.
- Checklist 검증: 공식 요구/decision 입력, owner/시점/점수7행, unique coverage26행, 위험 ID/priority 일치, all QA IDs, entry/exit, NFR unknown/evidence, range 추정, 영향/회귀, template 섹션, handoff map과 phase gates를 확인했다. 출력 전체 검토 및 구조 검사 완료.
- 조정자 지시에 따른 명시적 N/A: Playwright/Pact utilities 예시·새 프레임워크·신규 epic/story·새 CI/seed endpoint·load/chaos schedule. 패키지 설치 gate가 닫혔으므로 flag=true만으로 실행/설치하지 않았다. system 단계 closed selection에는 probability-impact가 없으며 trace가 해당 fragment를 필수로 읽는다.
- P0 비율은4/26으로 일반 권장10%보다 높지만, 데이터/비공개 경계와 거부된 저장의 critical 관찰 대상을 분리한 이 감사의 필요 범위다. 기존 suite 수로 부풀리지 않았다.
- CLI browser를 새로 열지 않아 정리할 orphan session이 없다. 신규 계획 artifact는 지정된 test-design 경로에만 썼다. 비공개 원문/독립 검증은 기존 ignored QA 경로를 유지한다.
- on_complete resolver는 empty였다. 별도 hook 없음.
- 이 completed는 **검사 설계 워크플로 완료**다. 전체 사이트/source/browser/NFR 통과를 뜻하지 않으며 trace 증거 수집은 별도로 진행한다.
