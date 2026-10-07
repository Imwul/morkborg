# Design Thinking Session: Reference Desk — keyboard return

**Date:** 2026-10-07 (Asia/Seoul)
**Facilitator:** Codex
**Design Challenge:** 기존 참고집의 정체성을 보존하면서 검색 취소와 키보드 선택의 흐름을 잇는다.

이 기록은 같은 날의 기존 `design-thinking-ux-calibration-2026-10-07.md`와 별개인 후속 검사다. 이전 문서와 작업 전 변경을 보존한다.

## Design Challenge

룰북·종이 노트 옆에서 검색 → 읽기 → 명시적 굴림 → 복사 → 관련 참조를 반복하는 사용자가 검색을 그만두거나 검색 목록에서 참조를 선택할 때 입력·읽기 위치를 다시 찾지 않도록 한다. 폰트, 색, 레이아웃, 정보 밀도, 저장과 판정 규칙을 유지한다.

## EMPATHIZE: Understanding Users

### User Insights

실제 사람 인터뷰나 이용 통계는 없다. CUA 실제 브라우저로 대표 작업을 수행한 전문가 관찰이다. 빈도·인지 비용은 제품 목적에 근거한 판단이며 측정된 사람 행동으로 제시하지 않는다.

설치 스킬 discovery에서 사용자 루트의 CIS Design Thinking을 확인했다. 프로젝트 `.agents/skills`는 없다. `bmad` knowledge.py, 프로젝트 resolve_customization.py 및 resolve_config.py를 실행하고 Design Thinking SKILL.md, 전체 design-methods.csv, template.md를 읽었다. 별도 UX/UI·Critique·Validation 스킬을 설치하거나 사용하지 않았다.

### Key Observations

방법 후보: Journey Mapping(수행), Empathy Mapping(관찰/추정 구분하여 수행), Shadowing(실제 사용자 부재로 미수행), User Interviews(미수행).

- 1440×900: 홈 → Reaction → ROLL → COPY → Morale는 4클릭이다. Weather의 COPY 문자열도 실제 clipboard에서 확인했다.
- 홈 → NPC → ROLL → 이름 유지 → REROLL은 4클릭이다. Therg가 유지되고 나머지 결과는 바뀐다. 기존 강점이다.
- `날씨` → Enter → R은 기존 개선 덕분에 제목 포커스 후 굴린다.
- 검색창에서 Esc를 눌러도 검색 결과와 입력 포커스가 그대로 남는다. ×를 누르거나 Tab → Enter로 검색을 지워야 한다.
- `날씨` → ArrowDown → Weather 열기에서 Enter를 누르면 새 제목은 보이지만 DOM focus는 BODY다. 다음 Tab은 제목 앞의 편의 동작으로 이동한다. 검색창에서 바로 Enter를 누르는 경로와 다르다.
- 390×844: 검색 결과를 먼저 보여주는 기존 검색 필터 접힘은 정상이다. FER로 좁힌 뒤 `전체 보기`를 누르면 `날씨`를 보존하며 결과가 1→8개로 복구된다. 필터 복구 문제라는 초기 가설은 기각했다.

### Empathy Map Summary

Say: 이번 요청의 “When in doubt, change less and validate more.”
Do: 검색·굴림·유지·복사·관련 규칙 이동.
Think/Feel: 검색 취소와 새 읽기 위치의 불명확함이 부담일 수 있다는 가설. 사용자 감정에 대한 직접 증거는 없다.

## DEFINE: Frame the Problem

### Point of View Statement

키보드로 참고집을 탐색하는 사용자는 검색을 취소하거나 목록을 선택한 뒤 읽기 위치를 이어갈 필요가 있다. 같은 참조를 여는 두 경로가 서로 다른 포커스 결과를 만들고 검색 취소 키가 작동하지 않기 때문이다.

### How Might We Questions

- 기존 × 동작을 키보드에도 연결할 수 있을까?
- 이미 있는 제목 포커스를 목록 선택에도 재사용할 수 있을까?
- 검색 취소가 기존 굴림을 다시 실행하거나 입력 중인 한글 조합을 방해하지 않게 할 수 있을까?

### Key Insights

새 HIGH 차단 문제는 관찰하지 않았다. 두 MEDIUM 문제를 작게 해결한다. 기존 검색 개선이 미리 들어 있는 상태를 이번 작업의 baseline으로 삼는다.

## IDEATE: Generate Solutions

### Selected Methods

후보: SCAMPER, Brainstorming, Analogous Inspiration. 실제 적용: SCAMPER의 Combine(×와 Esc), Adapt(기존 제목 포커스), Eliminate(복귀 시 추가 포커스 탐색).

### Generated Ideas

1. Esc를 ×와 연결. **채택**
2. × 후 읽던 제목에 포커스. **채택**
3. 선택된 참조가 없으면 검색 입력 포커스 유지. **채택**
4. 키보드로 목록 참조를 열면 기존 제목 포커스 재사용. **채택**
5. 목록의 명시적 굴리기도 같은 포커스 처리. **채택**
6. 한글 조합 중 Escape/ArrowDown 가로채기 방지. **보호 조건**
7. × tooltip에 Esc 안내. **기존 제어에만 적용**
8. 새로운 취소 버튼. 중복으로 기각.
9. 검색 전용 모달. 정보 구조 변경으로 기각.
10. 새 검색 단축키 메뉴. 필요 이상으로 기각.
11. 모든 클릭마다 제목 포커스. 기존 포인터 상호작용 보존을 위해 기각.
12. 필터 해제 시 자동 검색어 삭제 방지. 이미 정상이라 기각.
13. 검색 취소 시 이전 참조 자동 재굴림. 결과 보존 위반으로 기각.
14. 검색 취소 후 홈 이동. 읽던 참조를 잃으므로 기각.
15. 새 검색 기록 저장. 관찰 근거와 필요가 없어 기각.
16. 크기·테두리·색 polish. 실제 마찰 근거가 없어 기각.

### Top Concepts

기존 취소 제어의 키보드 연결, 기존 읽기 제목으로의 포커스 연결 두 개념만 구현한다.

## PROTOTYPE: Make Ideas Tangible

### Prototype Approach

Role Playing의 검색/읽기 전환 시나리오를 실제 코드로 검증한다. Paper Prototyping과 Storyboarding도 후보였지만 시각 변경 없는 포커스 동작에는 실행 가능한 코드가 적합하다.

### Prototype Description

ReferenceWorkbench.tsx의 기존 검색 초기화와 포커스 플래그를 재사용한다. Esc는 입력에 검색어가 있고 IME 조합 중이 아닐 때만 적용한다. 결과 목록의 키보드/보조기술 click(detail=0)만 기존 제목 포커스 경로로 연결한다. 선택·굴림·저장 함수는 바꾸지 않는다.

### Key Features to Test

일치/0건 검색에서 Esc, ×, 참조 없이 검색 취소, 같은 검색어 재진입, 검색 목록 Enter·Space·직접 굴림, 명시적 R, NPC 유지 결과의 취소 전후 동일성, 모바일 필터, browser Back, 고정과 Mythic 복귀.

## TEST: Validate with Users

### Testing Plan

같은 1440×900 / 390×844 조건에서 전후 브라우저 작업을 수행한다. 추가 360px와 768px에서 overflow를 확인한다. 실제 사용자 5–7명 테스트와 실기기 한글 IME는 미수행 범위로 구분한다. 기존 테스트·lint·타입·빌드로 회귀를 검사한다.

### User Feedback

없음. 에이전트가 수행한 실제 브라우저 결과는 후속 보고서에 기록한다.

### Key Learnings

검증 결과는 `docs/ux-keyboard-return-2026-10-07.md` 및 `outputs/ux-keyboard-return-20261007/`에 기록했다. 기존 필터 복구가 정상이라는 관찰을 근거로 불필요한 변경을 제외했다. Esc/×의 동일 결과 복귀, 키보드 목록 Enter/Space/직접 굴림의 제목 포커스, 0건 Enter, 모바일 필터, Cmd+K, NPC 유지, Mythic과 Back을 확인했다. 360/390/768/1440px 가로 넘침 없음. 전체 테스트 1,233개·lint·타입·production build 통과, 브라우저 오류 0개다.

## Next Steps

### Refinements Needed

동일 시나리오의 전후 확인과 이번 변경만의 diff 검사를 완료했다. 실제 IME·스크린 리더·5–7명 사용자 테스트는 별도 과제로 남긴다.

### Action Items

두 개념 구현 → 브라우저 재검증 → 필요한 검사 → 9개 항목의 최종 보고서를 완료했다. 기존 문서·작업 변경을 덮어쓰지 않았다.

### Success Metrics

검색 취소 2키(Tab, Enter)→1키(Esc), 목록 선택 후 읽기 제목 포커스, 취소 전후 기존 결과 동일, 주요 작업 클릭 수 유지, CSS 변경 0개, 도메인·저장·자료 변경 0개.

Generated using the installed BMAD CIS Design Thinking workflow. User-requested autonomous execution overrides interactive phase confirmation pauses.
