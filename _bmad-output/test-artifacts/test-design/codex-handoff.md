---
title: 'TEA Test Design → BMAD Handoff Document'
version: '1.0'
workflowType: 'testarch-test-design-handoff'
inputDocuments: ['test-design-architecture.md', 'test-design-qa.md', 'docs/full-site-qa-20261011/requirements.md']
sourceWorkflow: 'testarch-test-design'
generatedBy: 'Codex TEA audit agent'
generatedAt: '2026-10-11'
projectName: 'codex'
---

# TEA → BMAD Integration Handoff

## Purpose

기존 사이트 QA의 위험/증거를 수정 담당과 trace에 전달한다. 신규 epic/story 생성은 사용자 요청에 없어서 실행하지 않는다. 이 문서는 감사 작업 영역을 story creation의 입력 대신 표시한다.

## TEA Artifacts Inventory

| Artifact | Path | Integration |
| --- | --- | --- |
| Architecture | `_bmad-output/test-artifacts/test-design/test-design-architecture.md` | existing constraints / R-01–07 |
| QA Plan | `_bmad-output/test-artifacts/test-design/test-design-qa.md` | SYS-01–26 / QA-01–07 |
| Checkpoint | `_bmad-output/test-artifacts/test-design/test-design-progress-system.md` | actual step history |
| Source audit | `outputs/full-site-qa-20261011/rulebook-findings.md` | book pages / explicit gaps |
| Browser/storage | `outputs/full-site-qa-20261011/` | independent actual UI evidence, ongoing |

## Epic-Level Integration Guidance

새 epic 분해는 N/A. P0 데이터/비공개 경계와 P1 핵심 사용 경로를 누락하지 않는다. R-01/R-05 측정 공백을 waiver로 처리하지 않으며 R-02/R-03/R-06 완화 증거를 trace가 확인한다.

## Story-Level Integration Guidance

Critical scenarios: SYS-18–20/25 기록/자료 보존; SYS-01–06 source fidelity; SYS-12 native special rooms; SYS-16 combat 표시; SYS-21 Scratch 연결. QA 문서의 전수 surface checklist를 공식 QA-02/03/04와 연결한다.

Data-TestId Requirements: CUA가 현재 role/accessible label을 사용한다. 신규 selectors/testid 전면 도입은 N/A.

## Risk-to-Story Mapping

| Risk ID | Category | P×I | Existing audit area (new story N/A) | Test Level |
| --- | --- | ---: | --- | --- |
| R-01 | BUS | 6 | 룰 감사 / SYS-01–06 | source + Unit/Integration |
| R-02 | DATA | 6 | 저장 / SYS-18–20 | CUA + Integration |
| R-03 | TECH | 6 | Scratch 연결 / SYS-21 | CUA |
| R-04 | BUS | 3 | Combat 안내 / SYS-16 | CUA + Unit |
| R-05 | TECH | 4 | UI/geometry / SYS-24 | CUA |
| R-06 | SEC | 6 | final checks / SYS-25 | static/build/Integration |
| R-07 | DATA | 4 | IDB failure / SYS-20/22 | Integration + CUA if possible |

## Recommended BMAD → TEA Workflow Sequence

이번 실행은 Test Design → 실제 감사/최소 수정/회귀 → Trace다. 이미 구현된 사이트이며 create-epics-and-stories/ATDD/framework/새CI는 N/A; 이를 자동 실행하지 않는다. 일반 신규 개발 sequence가 이 감사의 필요 작업이라고 주장하지 않는다.

## Phase Transition Quality Gates

| From | To | Criteria |
| --- | --- | --- |
| Design | Existing site audit | 공식 요구와 범위/위험/owner 확인 |
| Defect evidence | Minimal fix | source/browser 재현이 있고 원문 불확실성은 변경하지 않음 |
| Fix | Regression | same-flow browser + related Node + existing final checks |
| Evidence | Trace | 실제 실행/미측정 모두 분류; collection 진행 중은 provisional |
| Trace | Completion report | no unsupported PASS; remaining book/browser gaps 명시 |
