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

# Test Design for Architecture: 전체 사이트 품질 감사

목적: 기존 설계와 비공개 자료를 보존하면서 QA와 수정 담당자가 필요한 증거를 합의하는 문서다. 신규 아키텍처를 제안하지 않는다.

날짜: 2026-10-11 · 작성: Codex 룰북/TEA 감사 담당 · 프로젝트: codex.
상태: 검사 계획 작성 완료. 실제 사이트 전체 검증 완료를 뜻하지 않는다.
공식 요구: `docs/full-site-qa-20261011/requirements.md`; architecture decisions: README, freeform-reference-audit, rule-sources, personal-hosted-site.

## Executive Summary

현재 참고집의 원문 계산, 주요 UI 경로, 기록/자료 경계와 표시 오류를 검증한다. 수익 지표·GA 일정·트래픽 목표는 N/A이며 개인용 다기기 사이트라는 기존 범위를 따른다.

기존 결정: React/TypeScript/Vite와 순수 도메인 계산; 원본/키는 비공개이며 암호화된 자료만 발행; 개인 기록은 브라우저별 저장; 새 참고 굴림은 플레이 진행/HP를 자동 변경하지 않는다. 책의 옵션과 앱 편의 조합은 별도 출처로 표시한다.

위험7개 중 점수6이4개, 점수4가2개, 점수3이1개다. 세부 검사26개는 QA 문서에 있고 원문 전수 확인의 남은 범위에 따라 추정이 넓다.

## Quick Guide

### BLOCKERS — 증거를 확보해야 전체 완료를 선언할 수 있는 항목

1. R-01 / ASR-01: RECLVSE 현재 PDF와 모든 미대조 표의 원문 증거가 없다. 소스 감사가 부분 완료임을 유지한다. 담당: 룰 감사/조정자, 최종 trace 전.
2. R-05: 실제 화면 크기별 전수 브라우저 증거가 진행 중이다. 지원하지 않는 geometry는 미확인으로 보고한다. 담당: 조정자, 최종 trace 전.
3. R-06 / ASR-03: 최종 코드의 build/privacy 검증 결과를 확보해야 한다. 담당: 조정자, 최종 regression 전.

위 항목은 남은 측정의 blocker이다. 새 seed API·framework·인프라가 필요하다고 해석하지 않는다. 이미 가능한 검사는 계속한다.

### HIGH PRIORITY — 현재 허가된 최소 수정과 검증

- R-02 / ASR-02: 손상 Shelf의 대체 빈 상태가 정상 백업으로 표시되지 않게 기존 export를 막고 원본 bytes를 보존한다.
- R-03: SEND TO SCRATCH 뒤 기존 편의 패널로 읽을 수 있게 연결을 고친다.
- R-04: 자동 치명 피해2배와 안내 문구를 맞춘다. 원문에 명시되지 않은 감소 순서는 추측해 바꾸지 않는다.

### INFO ONLY

ASR-04: 자유 참고집 정책과 부분 solo procedure 지원은 기존 범위다. ASR-05: Vercel production 인증/TLS는 로컬 browser 증거와 다르다. 수학 증거와 UI 흐름 증거는 별도로 기록한다.

## Risk Assessment

아래 위험은 QA 요구사항 또는 이름이 있는 실제 감사 기록에 연결된다. 보고서 파일은 `outputs/full-site-qa-20261011/`의 rulebook-findings/storage-findings를 뜻한다.

| Risk ID | Category | 근거·위험 | Probability | Impact | Score | Mitigation / Owner / Timeline |
| --- | --- | --- | ---: | ---: | ---: | --- |
| R-01 | BUS | QA-01의 모든 규칙 요구 대비 rulebook-findings의 미대조 표/RECLVSE 원본 부재. 불확실한 원문을 정확하다고 승인할 위험. | 2 | 3 | 6 | 룰 감사 담당: fresh-source/old-render를 구분하고 미확인 표를 gap으로 유지. 최종 trace 전. |
| R-02 | DATA | QA-03의 경계 검사와 storage-findings ST-02: 손상된 Shelf가 대체 빈 상태를 정상 백업으로 내보낼 수 있었다. | 3 | 2 | 6 | 저장 담당: export guard+원본 byte 보존 회귀, 정상 파일 왕복 CUA. 최종 regression 전; 손상 live browser는 미확인. |
| R-03 | TECH | QA-02/03 대비 storage-findings ST-04: SEND TO SCRATCH 성공 후 읽을 진입점이 없었다. | 3 | 2 | 6 | 조정자: 기존 패널 연결만 고치고 같은 NPC→Scratch 흐름 재검증. 최종 browser 전. |
| R-04 | BUS | QA-01/05 대비 CombatPanel의 수동 배수 안내와 실제 자동2배 계산 불일치. | 3 | 1 | 3 | 도구 담당: 문구만 최소 수정하고 natural20/1 결과·HP 직접처리 유지 확인. 최종 browser 전. |
| R-05 | TECH | QA-04 모바일/태블릿/데스크톱 요구 대비 현재 폭별 전수 실제 증거가 진행 중이다. | 2 | 2 | 4 | 조정자: 실제 지원 가능한 geometry별 확인, 미측정 폭은 gap. 최종 trace 전. |
| R-06 | SEC | QA-06 및 README의 평문/키 exclusion을 수정된 빌드가 계속 만족해야 한다. 확인하지 않은 build로 승인할 위험. | 2 | 3 | 6 | 조정자: 기존 build/privacy/git 검사 결과 확보. 최종 regression 전. |
| R-07 | DATA | QA-03 대비 storage-findings ST-03: IndexedDB 읽기/쓰기 거부 환경에서 전체 자료 activation이 실패하는 경계는 실제 브라우저 미재현. | 2 | 2 | 4 | 조정자/저장 담당: 원자성 정책을 임의 변경하지 않고 오류 주입 가능 여부와 한계 기록. 최종 보고 전. |

High: R-01/R-02/R-03/R-06. Medium: R-05/R-07. Low-impact documented: R-04. 별도 score1–2 위험은 없다.
Category: TECH=상태/연결, SEC=비공개 경계, DATA=기록 무결성, BUS=규칙/사용 결과, PERF=측정 성능, OPS=배포 운영. 이번 기록에는 근거 없는 PERF/OPS 위험을 추가하지 않았다.

## NFR Testability Requirements

| Category | 기존 요구/Threshold | 현재 지원 | 남은 증거/결정 | Planned Evidence |
| --- | --- | --- | --- | --- |
| Security | 원본/키 Git·정적 빌드 유입 금지 | AES-GCM 발행/API·build 검사가 있다 | production 보호와 TLS는 로컬에서 증명 불가 | build/privacy, hosted generator tests |
| Reliability / Data | invalid import·failed write 뒤 기존 기록 보존 | Zod·atomic commit·CAS·byte 보존 | damaged live browser/IDB refusal 미측정 | store/integration, CUA 정상 왕복 |
| Maintainability | 기존 lint/type/test/build 유지 | Node runner와 source layer 분리 | coverage%/duplication threshold UNKNOWN | 최종 suite/lint/build 로그 |
| Performance / Availability / Recovery | latency·SLA·RTO·RPO UNKNOWN | 개인 사이트, 브라우저별 기록 | 요청 없는 수치를 만들지 않음 | 이번에 측정 PASS 없음 |

ADR checklist의8범주는 계획 입력으로 검토했다: testability와 test-data는 아래, scale/availability 및 disaster-recovery는 미정 threshold, security는 명시 경계, monitorability는 browser console/Node 결과, QoE는 실제 오류/로딩 UI, deployability는 format backward compatibility와 build이다. production failover/metrics/rollback을 미검증 상태에서 도입하거나 승인하지 않는다. 최종 NFR 판정은 이 계획의 산출물이 아니다.

## Testability Concerns and Architectural Gaps

### ACTIONABLE CONCERNS

| Concern | Impact | 필요한 증거/최소 변화 | Owner | Timeline |
| --- | --- | --- | --- | --- |
| 원본 부재/합성 행 | 원문 충실도 전수 승인 불가 | R-01; 원문 부재 명시, 추측 변경 금지 | 룰 감사/조정자 | 최종 trace |
| Scratch 읽기 진입점 | 사용자는 성공한 결과를 못 읽음 | R-03; 기존 패널 연결 | 조정자 | 최종 browser |
| 손상 Shelf export | 정상 빈 백업처럼 보임 | R-02; 기존 export guard | 저장 담당 | 최종 regression |
| 저장/네트워크 오류 제어 | 실제 환경 경계 확인 불가 | R-07; 가능한 독립 검사, 미측정 표시 | 조정자/저장 담당 | 최종 report |

Architectural Improvements Needed: 새 구조는 N/A. 위 두 실제 표시/연결 결함만 기존 경로에서 수정한다. SQL/신규 OAuth/seed endpoint/서버 동기화는 이 앱의 요청 근거가 없어 추가하지 않는다.

## Risk Mitigation Plans

Dev/production 조치만 여기에 기록하며 QA 검증은 QA 문서를 따른다.

- R-02: 1) `store.error` export guard; 2) 버튼 disabled; 3) 기존 저장 byte 유지. 담당: 저장 담당. 시점: 최종 regression. 상태: 코드 수정, 정상 browser 왕복 확인; 손상 browser는 미확인. 검증: 정상/실패 export 증거와 원본 byte 회귀.
- R-03: 1) 기존 panel에 inline 진입; 2) send 후 읽기 가능; 3) 기존 편의 저장 수명 보존. 담당: 조정자. 시점: 최종 browser. 상태: 진행 중. 검증: 같은 NPC→Scratch 흐름 전후.
- R-06: 1) source/키 경계 유지; 2) 기존 빌드 검사; 3) tracked 파일 검토. 담당: 조정자. 시점: 최종 regression. 상태: 최종 증거 대기. 검증: build/privacy/git 결과.
- R-01은 원문/커버리지 QA 조치이므로 QA 문서에 위임하며 규칙 생성 변경을 제안하지 않는다.

## Testability Assessment Summary

순수 계산은 정해진 주사위 입력으로 분리 검사 가능하다. 백업/schema/migration 경계는 가짜 저장 객체로 격리할 수 있다. 실제 browser는 origin 분리로 기록을 안전하게 구분한다. 기존 빌드가 비공개 경계를 검사한다.

Accepted Trade-offs: browser별 기록 및 선택적 백업 이동, 임시 굴림과 개인 기록의 수명 차이, 일부 solo 후속 처리를 사용자가 수행하는 기존 결정. 전수 미확인이나 source 부재에 waiver를 부여한 것은 아니다.

## Assumptions and Dependencies

1. 현 사이트는 README의 자유 참고집 정책을 유지한다.
2. 평문 PDF/pack는 ignored 경로에서만 다룬다.
3. multi-device 자동 기록 동기화와 PWA는 기존 요구가 아니다.

Dependencies: 제공 원본 및 현재 clone, 같은 revision의 browser 결과, 마지막 build/lint/test/privacy 증거(최종 trace 전). 원본/viewport/오류 주입 기능 부족 시 해당 검사를 정직하게 gap으로 남기는 것이 contingency이다.
