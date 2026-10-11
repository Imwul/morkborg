---
workflowType: 'testarch-test-review'
runScope: 'target'
runKey: 'target-tests'
workflowStatus: 'completed'
stepsCompleted: ['step-01-load-context', 'step-02-discover-tests', 'step-03-quality-evaluation', 'step-03a-subagent-determinism', 'step-03b-subagent-isolation', 'step-03c-subagent-maintainability', 'step-03e-subagent-performance', 'step-03f-aggregate-scores', 'step-04-generate-report']
lastStep: 'step-04-generate-report'
lastSaved: '2026-10-11'
inputDocuments:
  - _bmad/config.toml
  - package.json
  - docs/full-site-qa-20261011/requirements.md
  - outputs/full-site-qa-20261011/rulebook-findings.md
  - outputs/full-site-qa-20261011/storage-findings.md
  - src/components/SavedObjectsPanel.tsx
  - src/storage/notebookTools.ts
  - src/domain/combatTool.ts
  - src/domain/mythicLists.ts
  - src/components/CharacterGenerationControl.tsx
  - src/components/GeneratorSourceControl.tsx
  - src/domain/generatorSourceDisplay.ts
knowledgeDocuments:
  - /Users/imwul/.agents/skills/bmod-tea/knowledge/test-quality.md
  - /Users/imwul/.agents/skills/bmod-tea/knowledge/data-factories.md
  - /Users/imwul/.agents/skills/bmod-tea/knowledge/test-levels-framework.md
  - /Users/imwul/.agents/skills/bmod-tea/knowledge/selective-testing.md
  - /Users/imwul/.agents/skills/bmod-tea/knowledge/test-healing-patterns.md
  - /Users/imwul/.agents/skills/bmod-tea/knowledge/selector-resilience.md
  - /Users/imwul/.agents/skills/bmod-tea/knowledge/timing-debugging.md
---

# Test Quality Review: Full-site QA 2026-10-11

**Quality Score**: 63/100 (D - Needs Improvement)
**Raw Deduction Score**: 63/100
**Score Cap**: 79/100
**Score Override Rule**: Highest severity HIGH caps effective score at 79: min(raw deduction score 63, 79) = 63.
**Review Date**: 2026-10-11
**Review Scope**: directory (authoritative seven-file set)
**Reviewer**: BMAD TEA / storage_audit

기존 검사의 품질 리뷰이며 새 검사를 생성하거나 기대값을 변경하지 않았다. Coverage mapping과 release coverage gate는 이 workflow의 범위 밖이며 `trace`에 맡긴다.

## Executive Summary

**Overall Assessment**: Needs Improvement
**Recommendation**: Request Changes
**Verdict Rule**: Critical = 0 and High > 0 => Request Changes (6 High).
**Context Basis**: pr_diff
**Context Waivers Applied**: 0
**Execution Mode**: sequential

### Key Strengths

- 수동 주사위와 제어된 RNG로 계산 경계 및 RNG 미소비를 직접 검사한다.
- 손상 보관함의 실제 store를 호출하여 원본 바이트·기존 키·0회 쓰기를 확인한다.
- 번역 결과와 원문 결과의 동일성, checksum, 실제 HTTP 응답, 독립 snapshot과 취소 복원을 확인한다.

### Key Weaknesses
- [H3] `tests/combat-context.test.ts:125` — Expected label is selected with a defence ternary.
- [H3] `tests/mythic.test.ts:151` — Expected exceptional-No count is selected conditionally from chart metadata.
- [H3] `tests/mythic.test.ts:269` — Expected Scene answer is selected through nested ternaries.
- [H3] `tests/notebook-tools.test.ts:90` — Expected section die size is selected through a ternary.
- [H3] `tests/notebook-tools.test.ts:97` — Expected draw count is selected through a ternary.
- [H3] `tests/notebook-tools.test.ts:125` — Expected Focus route is selected through nested ternaries.
- [M4] `tests/combat-tool.test.ts:28` — Three or more tests have no describe/context subject grouping.
- [M4] `tests/combat-context.test.ts:93` — Three or more tests have no describe/context subject grouping.
- [M4] `tests/mythic.test.ts:62` — Three or more tests have no describe/context subject grouping.
- [M4] `tests/notebook-tools.test.ts:58` — Three or more tests have no describe/context subject grouping.
- [M4] `tests/official-generators.test.ts:38` — Three or more tests have no describe/context subject grouping.
- [M7] `tests/mythic.test.ts:238` — Fate Check cases contain four nested for loops in one test body.

### Advisory Observations

- 선택적 비공개 Fate/Oracle 파일의 가용성에 따라 `localTest`가 skip될 수 있다. 이번 실제 실행에서는 111개 모두 실행되어 skip 0이었다. 공개 환경의 skip 수를 룰북 검증 성공으로 보고해서는 안 된다.
- 보관함 손상 unit 검사는 store 방어를 검증한다. 브라우저 손상 주입은 금지되어 내보내기 버튼의 손상 상태는 코드 근거만 있으며, 정상 내보내기/가져오기는 실제 브라우저로 검증했다.
- 같은 Fate Chart에서 얻은 기대값은 원본 PDF의 독립 증명이 아니다. 별도 룰북 보고서는 PDF20의 81셀 독립 전사·검사를 기록한다; 이 reviewer가 원본을 다시 읽었다고 주장하지 않는다.
- `objectShelfStore`/saveStore의 module cache는 한 store 테스트 뒤 남는다. 현재 Node 파일 격리와 단일 store 테스트에서는 기존 sibling 순서 의존을 입증하지 못해 H4로 점수화하지 않았다. 같은 process의 추가 테스트는 store 수명을 고려해야 한다.

111개 검사 실행은 통과했다. 고정 rubric의 H3는 deterministic parameterized expected-value ternary에도 적용되고, M4는 describe 없는 Node 파일에 Absolute로 적용된다. 이 구조 문제 때문에 계산된 판정은 Request Changes다. 틀린 게임 규칙, 실패한 회귀 또는 전체 사이트 출시 차단을 발견했다고 해석하지 않는다. 기존 기대값을 수정해 점수를 올리거나 불필요한 framework를 설치하지 않았다.

## Quality Criteria Assessment

| Criterion | Status | Violations | Basis | Notes |
| --- | --- | ---: | --- | --- |
| BDD Format (Given-When-Then) | ✅ PASS | 0 | Convention: bddNaming (8 of 8 sampled) | 행동/결과 이름; literal GWT convention은 없음 |
| Test IDs | ✅ PASS (n/a) | 0 | Convention: testIds (0 of 8 sampled) | 저장소에 DOM test-ID convention 없음 |
| Priority Markers (P0/P1/P2/P3) | ✅ PASS (n/a) | 0 | Convention: priorityMarkers (0 of 8 sampled) | marker convention 없음 |
| Disabled or Focused Tests | ✅ PASS | 0 | Absolute | only 없음; 선택적 private-file 조건 명시, 실제 skip0 |
| Hard Waits (sleep, waitForTimeout) | ✅ PASS | 0 | Absolute | bare timer 없음 |
| Determinism (no conditionals) | ❌ FAIL | 6 | Absolute + Applicability: time-bounded fixture | H3 6곳; expiry/TTL 없어 H2 닫힘 |
| Isolation (cleanup, no shared state) | ✅ PASS | 0 | Absolute | fake-global descriptor/finally, temp resources cleanup; current sibling 의존 미발견 |
| Fixture Patterns | ✅ PASS | 0 | Applicability: domain payload construction | 실제 synthetic factories·fixture(); userEvent dependency 없어 M5 닫힘 |
| Data Factories | ✅ PASS | 0 | Applicability: domain payload construction | M2 반복 3회 또는 기존 factory 우회 미발견 |
| Network-First Pattern | ✅ PASS (n/a) | 0 | Applicability: navigation then data-dependent reads | reviewed tests에 browser navigation 없음 |
| Explicit Assertions | ✅ PASS | 0 | Absolute + Applicability: Maestro flow | 정확한 수치/독립성/바이트값 assertions; Maestro 없음 |
| Test Length (≤1000 lines) | ✅ PASS | 0 | Absolute | 최대561줄 |
| Test Duration (≤1.5 min) | ✅ PASS | 0 | Absolute | 전체 focused111개 실제556.53ms; 단발 측정 |
| Flakiness Patterns | ❌ FAIL | 6 | Absolute + Applicability: navigation/time boundary | H3 동일6곳, ledger 중복공제 없음 |
| Suite Grouping | ⚠️ WARN | 5 | Absolute | M4 5파일; 명명 convention으로 면제하지 않음 |
| Nesting | ⚠️ WARN | 1 | Absolute | M7 Mythic4중 loop |

Run preconditions: Playwright Utils/Pact Utils flag는 true지만 packages는 manifest에 없다. M9/L9/M10은 이 run에서 존재하지 않아 per-file 점수/통과로 세지 않는다. 표준 framework workflow 권고는 현재 Node+CUA QA 범위에서 선택 사항이며 설치하지 않는다.

**Total Violations**: 0 Critical, 6 High, 6 Medium, 0 Low
**Convention Baseline**: 8 test files sampled outside the review set

100 eligible outside-review test files 중 같은 tests directory의 closest40를 정렬하고 `floor(i×40/8)`로 eight를 읽었다. priorityMarkers/testIds/networkFirst/playwrightUtils0/8(absent), bddNaming/assertionStyle8/8(established), dataFactories5/8(established), fixtures1/8(emerging). Payload builders: legacy(), registry(), fixture()/seedGraph(), openCreature(), table()/prepared(). 정확한 샘플은 workflow evidence에 기록한다. Convention 부재/Applicability 닫힘은 감점 0이다.

## Quality Score Breakdown

```text
Starting Score:          100
Critical Violations:     -0 × 10 = -0
High Violations:         -6 × 5 = -30
Medium Violations:       -6 × 2 = -12
Low Violations:          -0 × 1 = -0

Bonus Points:
  Excellent BDD:         +5
  Comprehensive Fixtures: +0
  Data Factories:        +0
  Network-First:         +0
  Perfect Isolation:     +0
  All Test IDs:          +0
                         --------
Total Bonus:             +5

Raw Deduction Score:     63/100
Score Cap:               79/100 (HIGH)
Effective Score:         63/100
Grade:                   D
```

## Critical Issues (Must Fix)

No critical issues detected. ✅

## Recommendations (Should Fix)

### 1. [H3] conditional-assertion

**Severity**: P1 (High)
**Location**: `tests/combat-context.test.ts:125`
**Row**: H3
**Criterion**: conditional-assertion
**Knowledge Base**: [test-quality.md](/Users/imwul/.agents/skills/bmod-tea/knowledge/test-quality.md)

Expected label is selected with a defence ternary. Use fixed expected case tuples or separately named unconditional cases; preserve original outcome values.

```typescript
assert.match(r[0].label, defence ? /방어/ : /공격/);
```

제안 패턴:

```typescript
const cases = [
  ['pc', 'enemy', 1, /공격/],
  ['pc', 'enemy', 20, /공격/],
  ['enemy', 'pc', 1, /방어/],
  ['enemy', 'pc', 20, /방어/],
] as const;
for (const [attackerId, targetId, natural, label] of cases) {
  const { frame, request } = fixture();
  const preview = prepareAttack(frame, {
    ...request, attackerId, targetId,
    dice: { test: String(natural), damage: '4' },
  }, noRng);
  assert.match(relevant(frame, preview)[0].label, label);
}
```

예시는 같은 파일의 imports·helper를 사용하는 구조 예시이며 전체 기존 검사의 대체물이 아니다. 고정 기대값과 기존 모든 조합을 보존한다. 이번 작업에서 테스트 코드는 변경하지 않았다.

### 2. [H3] conditional-assertion

**Severity**: P1 (High)
**Location**: `tests/mythic.test.ts:151`
**Row**: H3
**Criterion**: conditional-assertion
**Knowledge Base**: [test-quality.md](/Users/imwul/.agents/skills/bmod-tea/knowledge/test-quality.md)

Expected exceptional-No count is selected conditionally from chart metadata. Use fixed expected case tuples or separately named unconditional cases; preserve original outcome values.

```typescript
cell.exceptionalNo === null ? 0 : 101 - cell.exceptionalNo,
```

제안 패턴:

```typescript
const answers = Array.from({ length: 100 }, (_, i) =>
  resolveFate(defaultMythicState(), chart, [i + 1]).answer,
);
assert.equal(answers.filter(answer => answer === 'exceptional-no').length, 10);
```

10은 기존 50/50 CF5의 91–100 고정 경계에 근거한다. 나머지 80셀도 원본 대조 결과를 별도 고정 데이터로 사용해야 하며 구현 chart에서 새 기대값을 산출하지 않는다.

예시는 같은 파일의 imports·helper를 사용하는 구조 예시이며 전체 기존 검사의 대체물이 아니다. 고정 기대값과 기존 모든 조합을 보존한다. 이번 작업에서 테스트 코드는 변경하지 않았다.

### 3. [H3] conditional-assertion

**Severity**: P1 (High)
**Location**: `tests/mythic.test.ts:269`
**Row**: H3
**Criterion**: conditional-assertion
**Knowledge Base**: [test-quality.md](/Users/imwul/.agents/skills/bmod-tea/knowledge/test-quality.md)

Expected Scene answer is selected through nested ternaries. Use fixed expected case tuples or separately named unconditional cases; preserve original outcome values.

```typescript
die > cf ? 'expected' : die % 2 ? 'altered' : 'interrupt',
```

제안 패턴:

```typescript
const sceneCases = [
  [5, 4, 'interrupt'],
  [5, 5, 'altered'],
  [5, 6, 'expected'],
] as const;
for (const [chaosFactor, die, expected] of sceneCases) {
  const state = { ...defaultMythicState(), chaosFactor };
  assert.equal(resolveScene(state, die).answer, expected);
}
```

예시는 같은 파일의 imports·helper를 사용하는 구조 예시이며 전체 기존 검사의 대체물이 아니다. 고정 기대값과 기존 모든 조합을 보존한다. 이번 작업에서 테스트 코드는 변경하지 않았다.

### 4. [H3] conditional-assertion

**Severity**: P1 (High)
**Location**: `tests/notebook-tools.test.ts:90`
**Row**: H3
**Criterion**: conditional-assertion
**Knowledge Base**: [test-quality.md](/Users/imwul/.agents/skills/bmod-tea/knowledge/test-quality.md)

Expected section die size is selected through a ternary. Use fixed expected case tuples or separately named unconditional cases; preserve original outcome values.

```typescript
assert.equal(r.sectionDice, sections === 1 ? undefined : sections * 2);
```

제안 패턴:

```typescript
const sectionCases = [[1, undefined], [2, 4], [3, 6], [4, 8], [5, 10]] as const;
for (const [sections, expectedSides] of sectionCases) {
  const list = slots();
  list.fill('항목', 0, sections * 5);
  assert.equal(resolveMythicList(list, 2, 1).sectionDice, expectedSides);
}
```

예시는 같은 파일의 imports·helper를 사용하는 구조 예시이며 전체 기존 검사의 대체물이 아니다. 고정 기대값과 기존 모든 조합을 보존한다. 이번 작업에서 테스트 코드는 변경하지 않았다.

### 5. [H3] conditional-assertion

**Severity**: P1 (High)
**Location**: `tests/notebook-tools.test.ts:97`
**Row**: H3
**Criterion**: conditional-assertion
**Knowledge Base**: [test-quality.md](/Users/imwul/.agents/skills/bmod-tea/knowledge/test-quality.md)

Expected draw count is selected through a ternary. Use fixed expected case tuples or separately named unconditional cases; preserve original outcome values.

```typescript
assert.equal(rolls, sections === 1 ? 1 : 2);
```

제안 패턴:

```typescript
const drawCases = [[1, 1], [2, 2], [3, 2], [4, 2], [5, 2]] as const;
for (const [sections, expectedDraws] of drawCases) {
  const list = slots();
  list.fill('항목', 0, sections * 5);
  let rolls = 0;
  rollMythicList(list, () => { rolls++; return 0.25; });
  assert.equal(rolls, expectedDraws);
}
```

예시는 같은 파일의 imports·helper를 사용하는 구조 예시이며 전체 기존 검사의 대체물이 아니다. 고정 기대값과 기존 모든 조합을 보존한다. 이번 작업에서 테스트 코드는 변경하지 않았다.

### 6. [H3] conditional-assertion

**Severity**: P1 (High)
**Location**: `tests/notebook-tools.test.ts:125`
**Row**: H3
**Criterion**: conditional-assertion
**Knowledge Base**: [test-quality.md](/Users/imwul/.agents/skills/bmod-tea/knowledge/test-quality.md)

Expected Focus route is selected through nested ternaries. Use fixed expected case tuples or separately named unconditional cases; preserve original outcome values.

```typescript
face >= 21 && face <= 50
  ? 'characters'
  : face >= 51 && face <= 70
    ? 'threads'
    : null,
```

제안 패턴:

```typescript
const focusCases = [
  [1, null], [20, null], [21, 'characters'], [50, 'characters'],
  [51, 'threads'], [70, 'threads'], [71, null], [100, null],
] as const;
for (const [face, expected] of focusCases) {
  assert.equal(mythicFocusList(face), expected);
}
```

예시는 같은 파일의 imports·helper를 사용하는 구조 예시이며 전체 기존 검사의 대체물이 아니다. 고정 기대값과 기존 모든 조합을 보존한다. 이번 작업에서 테스트 코드는 변경하지 않았다.

### 7. [M4] ungrouped-suite

**Severity**: P2 (Medium)
**Location**: `tests/combat-tool.test.ts:28`
**Row**: M4
**Criterion**: ungrouped-suite
**Knowledge Base**: [test-quality.md](/Users/imwul/.agents/skills/bmod-tea/knowledge/test-quality.md)

Three or more tests have no describe/context subject grouping. Group existing cases by the domain subject without altering expected outcomes.

```typescript
test('the first editable PC is seeded only for an untouched empty encounter', () => {
```

제안 패턴:

```typescript
import { describe } from 'node:test';
describe('Combat encounter state', () => {
  // Move the existing test calls here without changing their bodies.
});
```

이름·기대값·개별 test body를 유지하며 subject별 group만 추가하는 제안이다.

### 8. [M4] ungrouped-suite

**Severity**: P2 (Medium)
**Location**: `tests/combat-context.test.ts:93`
**Row**: M4
**Criterion**: ungrouped-suite
**Knowledge Base**: [test-quality.md](/Users/imwul/.agents/skills/bmod-tea/knowledge/test-quality.md)

Three or more tests have no describe/context subject grouping. Group existing cases by the domain subject without altering expected outcomes.

```typescript
test('No relevant combat condition produces no suggestions; every local mapping resolves', () => {
```

제안 패턴:

```typescript
import { describe } from 'node:test';
describe('Combat context suggestions', () => {
  // Move the existing test calls here without changing their bodies.
});
```

이름·기대값·개별 test body를 유지하며 subject별 group만 추가하는 제안이다.

### 9. [M4] ungrouped-suite

**Severity**: P2 (Medium)
**Location**: `tests/mythic.test.ts:62`
**Row**: M4
**Criterion**: ungrouped-suite
**Knowledge Base**: [test-quality.md](/Users/imwul/.agents/skills/bmod-tea/knowledge/test-quality.md)

Three or more tests have no describe/context subject grouping. Group existing cases by the domain subject without altering expected outcomes.

```typescript
test('Mythic starts at Chaos5 and 50/50 with independent empty histories', () => {
```

제안 패턴:

```typescript
import { describe } from 'node:test';
describe('Mythic oracle resolution', () => {
  // Move the existing test calls here without changing their bodies.
});
```

이름·기대값·개별 test body를 유지하며 subject별 group만 추가하는 제안이다.

### 10. [M4] ungrouped-suite

**Severity**: P2 (Medium)
**Location**: `tests/notebook-tools.test.ts:58`
**Row**: M4
**Criterion**: ungrouped-suite
**Knowledge Base**: [test-quality.md](/Users/imwul/.agents/skills/bmod-tea/knowledge/test-quality.md)

Three or more tests have no describe/context subject grouping. Group existing cases by the domain subject without altering expected outcomes.

```typescript
test('Mythic lists have two independent 25-slot arrays', () => {
```

제안 패턴:

```typescript
import { describe } from 'node:test';
describe('Notebook list tools', () => {
  // Move the existing test calls here without changing their bodies.
});
```

이름·기대값·개별 test body를 유지하며 subject별 group만 추가하는 제안이다.

### 11. [M4] ungrouped-suite

**Severity**: P2 (Medium)
**Location**: `tests/official-generators.test.ts:38`
**Row**: M4
**Criterion**: ungrouped-suite
**Knowledge Base**: [test-quality.md](/Users/imwul/.agents/skills/bmod-tea/knowledge/test-quality.md)

Three or more tests have no describe/context subject grouping. Group existing cases by the domain subject without altering expected outcomes.

```typescript
test('official messages keep apostrophes, plurals, selects and readable lists', () => {
```

제안 패턴:

```typescript
import { describe } from 'node:test';
describe('Official generator source fidelity', () => {
  // Move the existing test calls here without changing their bodies.
});
```

이름·기대값·개별 test body를 유지하며 subject별 group만 추가하는 제안이다.

### 12. [M7] excessive-nesting

**Severity**: P2 (Medium)
**Location**: `tests/mythic.test.ts:238`
**Row**: M7
**Criterion**: excessive-nesting
**Knowledge Base**: [test-quality.md](/Users/imwul/.agents/skills/bmod-tea/knowledge/test-quality.md)

Fate Check cases contain four nested for loops in one test body. Build flat deterministic input/expected case rows outside the body and iterate once; preserve all combinations.

```typescript
for (const odds of FATE_ODDS)
```

제안 패턴:

```typescript
const factors = Array.from({ length: 9 }, (_, i) => i + 1);
const faces = Array.from({ length: 10 }, (_, i) => i + 1);
const cases = FATE_ODDS.flatMap(odds => factors.flatMap(cf =>
  faces.flatMap(a => faces.map(b => ({ odds: odds.id, cf, a, b }))),
));
assert.equal(cases.length, 8100);
for (const { odds, cf, a, b } of cases) {
  const result = resolveFate({
    ...defaultMythicState(), method: 'check', odds, chaosFactor: cf,
  }, null, [a, b]);
  assert.equal(mythicStateSchema.safeParse({
    ...defaultMythicState(), history: [result],
  }).success, true);
  assert.equal(result.randomEvent, a === b && a <= cf);
}
```

같은 파일의 imports를 사용하며 기존 8,100조합과 두 assertion을 그대로 유지하는 예시다. 실행 loop의 네 단계 중첩을 한 단계로 줄인다.

## Best Practices Found

`tests/object-shelf-corruption.test.ts:35`에서 실제 store.update를 호출하고 throws·callback false·write0·정확한 두 key의 bytes를 확인한다. fake storage 자체를 mock과 비교하는 C5가 아니다. finally에서 global descriptor를 원래대로 복원한다.

`tests/official-generators.test.ts:84`의 번역 검사는 원문과 번역의 RNG draw count 및 원문 필드 동일성을 비교하고, 실제 loader/server 결과의 cache header와 payload를 확인한다. 임시 파일/server는 finally로 닫고 지운다.

`tests/combat-tool.test.ts:307`의 critical/fumble 검사는 preview damage, 수동 HP/armor 보존, Omen 자원, Undo snapshot을 분리해 확인한다. 이 runtime 근거는 원문 감사와 별도로 기록한다.

## Test File Analysis

모든 reviewed file은 TypeScript, Node:test+node:assert/strict이다. Static registration count는 parameterization 때문에 executed case count와 다르다. 실제 전체111개와 declaration 수를 혼합하지 않았다.

| File | Lines | Bytes | Test-call declarations incl helper | Lexical assertion calls |
| --- | ---: | ---: | ---: | ---: |
| tests/combat-tool.test.ts | 561 | 18739 | 25 | 129 |
| tests/combat-context.test.ts | 463 | 16471 | 24 | 97 |
| tests/mythic.test.ts | 508 | 16556 | 23 | 89 |
| tests/notebook-tools.test.ts | 295 | 11118 | 20 | 60 |
| tests/object-shelf-corruption.test.ts | 55 | 1816 | 1 | 6 |
| tests/official-generators.test.ts | 284 | 11304 | 6 | 53 |
| tests/generator-source-display.test.ts | 97 | 2886 | 2 | 15 |

No describe groups, test priorities or test IDs. Imports, source-file data loads, setup builders, local adapters, controlled RNGs, try/finally, conditional expectations and async calls were read. No score was assigned to source/context files.

## Context and Integration

Requirement QA-01–07 requires original-source fidelity, actual browser walkthrough, boundary flows, preservation, meaningful regressions and honest limitations. Storage report records shelf edits/cancel/duplicate/copy/delete/undo/reload and valid/invalid JSON imports; rulebook report distinguishes independently read PDF pages from string-search screening. Current context is not an independent full-site certification. Sources not supplied were not sought as unnamed context. No BMM story or epic applies, so the stable identity is target/tests → target-tests despite the human report name.

The source guard stops false empty export while store.error exists. The new test directly proves damaged-data protection but does not assert disabled UI. This discrepancy is explicitly recorded as a validation boundary, not claimed browser success. The generator provenance source and its tests distinguish current result from pending next selection. Expected numeric outcomes were not adjusted for green results. Formal coverage/fidelity release decisions remain with `trace`/the overall QA report. The later local Shelf error-lifecycle fix was separately verified through actual close/generation/reopen and Combat→Shelf flows; it did not change the reviewed tests or this structure-score ledger.

## Knowledge Base References
- [test-quality.md](/Users/imwul/.agents/skills/bmod-tea/knowledge/test-quality.md)
- [data-factories.md](/Users/imwul/.agents/skills/bmod-tea/knowledge/data-factories.md)
- [test-levels-framework.md](/Users/imwul/.agents/skills/bmod-tea/knowledge/test-levels-framework.md)
- [selective-testing.md](/Users/imwul/.agents/skills/bmod-tea/knowledge/selective-testing.md)
- [test-healing-patterns.md](/Users/imwul/.agents/skills/bmod-tea/knowledge/test-healing-patterns.md)
- [selector-resilience.md](/Users/imwul/.agents/skills/bmod-tea/knowledge/selector-resilience.md)
- [timing-debugging.md](/Users/imwul/.agents/skills/bmod-tea/knowledge/timing-debugging.md)

- [criteria-registry.md](/Users/imwul/.agents/skills/bmad-testarch-test-review/steps-c/criteria-registry.md) — pinned severity/gates, and the authoritative H3/M4/M7 predicates.

## Next Steps

H3 fixed-case expectations, M4 grouping and M7 flat case data are the review's concrete follow-ups. Do not change rule results, delete cases or add an unnecessary test library. No authorization to refactor all pre-existing tests is inferred from this report. Re-review after those structural changes. Use `trace` if a separate full-site requirement-to-evidence gate is wanted.

## Decision

**Recommendation**: Request Changes

계산 규칙상 High6개가 있기 때문에 이 판정을 유지한다. 이 reviewer가 UI/규칙을 잘못됐다고 판정했거나 전체 site gate를 결정한 것은 아니다. 단발111개 통과와 기존 테스트 품질 rubric 판정은 다른 근거다. Context Waivers Applied0.

## Appendix

### Violation Summary by Location

| File:line | Row | Severity | Fix |
| --- | --- | --- | --- |
| tests/combat-context.test.ts:93 | M4 | MEDIUM | Group existing cases by the domain subject without altering expected outcomes. |
| tests/combat-context.test.ts:125 | H3 | HIGH | Use fixed expected case tuples or separately named unconditional cases; preserve original outcome values. |
| tests/combat-tool.test.ts:28 | M4 | MEDIUM | Group existing cases by the domain subject without altering expected outcomes. |
| tests/mythic.test.ts:62 | M4 | MEDIUM | Group existing cases by the domain subject without altering expected outcomes. |
| tests/mythic.test.ts:151 | H3 | HIGH | Use fixed expected case tuples or separately named unconditional cases; preserve original outcome values. |
| tests/mythic.test.ts:238 | M7 | MEDIUM | Build flat deterministic input/expected case rows outside the body and iterate once; preserve all combinations. |
| tests/mythic.test.ts:269 | H3 | HIGH | Use fixed expected case tuples or separately named unconditional cases; preserve original outcome values. |
| tests/notebook-tools.test.ts:58 | M4 | MEDIUM | Group existing cases by the domain subject without altering expected outcomes. |
| tests/notebook-tools.test.ts:90 | H3 | HIGH | Use fixed expected case tuples or separately named unconditional cases; preserve original outcome values. |
| tests/notebook-tools.test.ts:97 | H3 | HIGH | Use fixed expected case tuples or separately named unconditional cases; preserve original outcome values. |
| tests/notebook-tools.test.ts:125 | H3 | HIGH | Use fixed expected case tuples or separately named unconditional cases; preserve original outcome values. |
| tests/official-generators.test.ts:38 | M4 | MEDIUM | Group existing cases by the domain subject without altering expected outcomes. |

### Workflow and Validation Evidence

- SKILL/customize/workflow/instructions/config fully read; customization/config resolvers succeeded. Invocation `headless:true`, report-only, authoritative7 existing tests, explicit10 context artifacts.
- Step1 save preceded Step2 actions. Deviation: Step2 file was prefetched with template before Step1 checkpoint; no Step2 action was performed before the save. This is disclosed rather than pretending no deviation.
- Seven core knowledge fragments loaded by closed deterministic branch. Playwright runner/install and Pact relevance/install gates closed; no library install. The checklist's old unconditional fixture-architecture/network-first wording is superseded by Step1's explicit runner gates. No story/design supplied, so related checklist items are n/a rather than invented artifacts.
- Step2 baseline measured100 eligible outside-review/closest40/eight sampled; exact sample: tests/actionable-results.test.ts, tests/campaign-structure.test.ts, tests/city-crawl-workspace.test.ts, tests/content.test.ts, tests/creature-reading-fields.test.ts, tests/dungeon-crawl-blocks.test.ts, tests/dungeon-reference-preparation.test.ts, tests/freeform-reference.test.ts.
- Step3 probe saw all four runtime slots occupied; auto→sequential. All four dimension JSON outputs and aggregate summary share the actual clock timestamp and target-tests. Required output existence/validity confirmed; five M4 duplicates removed. No future step was scored before prior action checkpoint.
- Step4 all 12 recommended TypeScript examples parsed successfully with the installed TypeScript parser; all 12 actual file/line locations, required sections, counts, severity pins, score cap, bonus total and two verdict copies validated against checklist. Example snippets use their existing file imports/helpers; no expected-value tests were changed. No inline comments/badge/story modifications enabled. Legacy checklist severity examples conflict with registry; registry took precedence. No fabricated exhaustive no-false-negative guarantee.
- CUA actual IAB is the CLI fallback. No playwright-cli session or trace.zip exists, so cleanup is n/a for CLI; storage QA tab continues only for remaining authorized QA. Screenshot evidence copied with target-tests filenames to test-review output. No browser corruption injected. Network trace unverified.
- Full-site reports/screenshots are ignored to protect private rule material. Public-safe test report summarizes evidence only. Current reviewer did not independently certify every PDF row or every UI surface.

## Review Metadata

**Generated By**: BMad TEA Agent / storage_audit
**Workflow**: testarch-test-review
**Review ID**: test-review-target-tests-20261011
**Version**: 1.0
**Timestamp**: 2026-10-11T06-19-27-079787+00-00

## Reviewed Files

- tests/combat-tool.test.ts
- tests/combat-context.test.ts
- tests/mythic.test.ts
- tests/notebook-tools.test.ts
- tests/object-shelf-corruption.test.ts
- tests/official-generators.test.ts
- tests/generator-source-display.test.ts

## Review Context

- docs/full-site-qa-20261011/requirements.md
- outputs/full-site-qa-20261011/rulebook-findings.md
- outputs/full-site-qa-20261011/storage-findings.md
- src/components/SavedObjectsPanel.tsx
- src/storage/notebookTools.ts
- src/domain/combatTool.ts
- src/domain/mythicLists.ts
- src/components/CharacterGenerationControl.tsx
- src/components/GeneratorSourceControl.tsx
- src/domain/generatorSourceDisplay.ts

## Excluded From Review Set

- tests/mythic-lists.test.ts — path does not exist
