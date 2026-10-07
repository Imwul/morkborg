# BMAD UX Calibration — 2026-10-07

기존 디자인을 유지하면서 실제 검색과 반복 사용의 마찰만 개선했다. 제품 코드 변경은 `src/components/ReferenceWorkbench.tsx`, `src/publication.css` 두 파일이다.

## 1. Product Understanding

MÖRK BORG Reference Desk는 종이 노트와 룰북 옆에서 펼쳐 쓰는 규칙·표·생성 도구다. 핵심 행동은 참조 검색, 원문과 공식 확인, 명시적인 굴림, 결과 복사, 관련 규칙으로 이동이다. NPC 등의 생성 결과는 일부를 유지하면서 다시 굴릴 수 있다. Mythic은 읽는 참조 위에서 독립적으로 열고 닫는 도구다. 앱이 게임의 시간·장소·HP를 자동으로 진행하는 흐름은 이번 작업에 추가하지 않았다.

설치 확인과 방법 적용:

- 프로젝트의 `_bmad` 설정·해석 스크립트와 노출된 사용자 스킬 루트를 확인했다. 프로젝트 `.agents/skills` 폴더는 없었고, 사용자 루트에 설치된 CIS Design Thinking을 사용했다.
- `bmad/SKILL.md`와 `bmad-cis-design-thinking/SKILL.md`, 기본 customization, 전체 방법 CSV, 문서 템플릿을 실제로 읽었다. knowledge.py와 프로젝트 resolve_customization.py / resolve_config.py를 실행했다.
- Journey Mapping으로 작업의 입력·이동·결과·다음 행동을 기록하고, Point of View / How Might We로 문제를 정의했다. SCAMPER의 결합·제거·적응 관점에서 16개 후보를 비교해 세 가지 개입으로 좁혔다. 실제 코드 프로토타입을 같은 브라우저 작업으로 재검사했다.
- 별도 UX/UI·Product Design·Critique 스킬을 사용했다고 주장하지 않는다. 실제 사람 인터뷰나 사용자 5–7명의 사용성 연구는 수행하지 않았다. 관찰은 에이전트가 브라우저에서 직접 수행한 결과이며, 사용 빈도는 제품 목적에 근거한 추정이다.
- 단계별 원문 방법 적용과 후보 비교는 [Design Thinking 기록](../_bmad-output/design-thinking-ux-calibration-2026-10-07.md)에 남겼다.

## 2. Existing Design Language

| 영역 | 기존 언어와 보호 대상 |
| --- | --- |
| Typography | MÖRK BORG 장식 워드마크, Pirata One 영문 참조 제목, Bodoni Moda 편집형 제목, Song Myung 한글 장식 fallback, Hahmlet Hangul 읽기·UI와 SUIT 생성기 UI. 장식 제목과 읽기 본문의 구분 |
| Color / surface | 밝은 종이색과 검은 잉크, 노랑·하늘색·분홍·민트 색상 영역, 상단 색상 띠. 색상으로 페이지·결과·유지 상태를 구분 |
| Borders / spacing | 직선 경계와 사각 버튼, 강한 구분선, 목록의 일정한 행 간격, 출처 등의 작은 메타데이터 |
| Grid / density | 데스크톱의 색인 + 읽기 영역, 생성 결과의 병렬 항목, 모바일의 한 열 읽기. 정보 밀도와 주요 레이아웃 |
| Components | 기존 버튼·입력·native select·details disclosure·PIN·작업대·고정 목록·독립 도구 패널 |
| Interaction | 참조 제목은 읽기, ROLL은 실행, 결과 옆 REROLL / COPY, 일부 생성 항목 유지, 명시적인 필터·선택 상태. hover에만 의존하지 않는 실제 버튼 |
| Product character | 일반적인 대시보드보다 인쇄 참고집을 펼친 듯한 편집형 화면. 큰 장식 제목과 촘촘한 실용 제어의 공존 |

이미 잘 작동한 부분: 홈의 빠른 참조, 데스크톱의 Morale 등 바로가기, 굴리기와 읽기 구분, 결과의 영문·한글 병기, 개별 항목 유지, Mythic을 닫고 원래 결과로 복귀. 이 경로는 고치지 않았다.

## 3. Before Audit

코드를 수정하기 전에 개발 서버를 실제 브라우저에서 사용했다. 기본 감사 조건은 1440×900과 390×844이며 같은 `날씨` 검색어와 기존 데이터 팩을 사용했다.

클릭 수는 지정한 시작점부터 완료까지의 실제 버튼 동작이다. 검색창 포커스·텍스트 입력·Enter·스크롤은 버튼 클릭과 별도로 기록한다. 랜덤 결과값 자체가 같아야 하는 검사는 아니다. 생성 결과 유지와 Back의 결과 복원은 동일한 결과가 유지되는지 확인했다.

| 대표 작업 | 클릭 | 입력 / 키 | 최대 탐색 깊이 | 화면 내용 전환 | Back | 관찰 |
| --- | ---: | --- | ---: | ---: | ---: | --- |
| 홈 → Reaction → 굴림 → COPY → Morale | 4 | 입력 0 | 1 | 2 | 0 | 결과 → 복사 1클릭, 결과 → 관련 규칙 1클릭. 이미 짧은 경로 |
| `날씨` 검색 → Enter → Weather → 굴림 → COPY | 2 | 검색어 1회 + Enter 1회; 검색창 진입은 별도 | 1 | 검색 결과 / 참조 2 | 0 | 한국어 검색과 표 찾기는 정상. Enter 이후 검색창 포커스가 남음 |
| 생성기 → NPC → ROLL → 이름 유지 → REROLL | 5 | 입력 0 | 2 | 2 | 0 | 지역 기본값 사용. Karva 이름 유지, 다른 항목 변경 |
| NPC → Mythic → ROLL FATE → 닫기 | 3 | 필수 입력 0 | 추가 깊이 0 | 주요 페이지 전환 0 | 0 | NPC 결과와 유지 상태가 남음 |

추가 재현:

- **모바일 검색:** 홈에서 `날씨` 입력. scrollY 0, 헤더 하단 220px, 탐색 패널 810.95px, 첫 Weather 검색 결과 상단 1191.22px. 첫 화면을 차지한 것은 출처·상황·고정 요약과 테마별 목록이며, 실제 검색 결과는 추가 스크롤 뒤에 있다.
- **실패 검색 제출:** 기존 Reaction이 열린 상태에서 `zzzz없는참조` → Enter. 0건 안내가 사라지고 Reaction으로 돌아가지만 실패한 검색어는 입력에 남는다.
- **키보드 다음 행동:** `날씨` → Enter → R. 굴림 대신 검색어 `날씨r`과 0건 결과가 생긴다.
- **검색 재진입:** Weather를 연 뒤 ⌘K. 검색창에 `날씨`가 있어도 검색 결과가 표시되지 않아 같은 결과를 다시 보려면 검색어 편집이 필요하다.
- **취소:** 검색창에서 Escape는 반응하지 않지만 기존 × 버튼으로 검색을 지우고 이전 참조로 돌아갈 수 있다.

스크린샷: `outputs/ux-calibration-20261007/before-mobile-search.jpg`.

## 4. Prioritized Problems

1–5 척도. 앞 네 항목은 클수록 사용 부담이 크고, 구현 위험은 클수록 변경 위험이 크다. 빈도는 실제 사용 통계가 아닌 핵심 작업과 입력 방식에 따른 판단이다.

| 문제 | 분류 | 빈도 | 심각도 | 인지 비용 | 상호작용 비용 | 구현 위험 | 우선순위 / 판단 |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| 모바일 검색 결과보다 큰 탐색 패널이 먼저 표시 | B / E | 5 | 4 | 4 | 4 | 2 | HIGH. 매 검색에서 일치 항목을 찾아 추가 이동해야 함 |
| Enter 후 입력 포커스가 남아 기존 R 동작 차단 | A / C | 3 | 4 | 4 | 3 | 1 | HIGH. 키보드로 검색하는 사용자의 반복 굴림이 검색어 편집으로 바뀜 |
| 0건 검색 Enter가 이전 참조로 이동 | C | 2 | 3 | 4 | 2 | 1 | MEDIUM. 실패 검색의 상태와 표시 내용이 불일치. 작은 guard로 해결 |
| 같은 검색어 재진입에서 결과를 다시 열기 위해 추가 편집 | A / C | 4 | 2 | 3 | 2 | 1 | MEDIUM. 기존 검색창의 focus 동작 연결로 해결 |
| Escape 취소 미지원 | C | 2 | 2 | 2 | 1 | 2 | MEDIUM, 보류. 기존 × 복귀가 정상이며 이번 범위는 제출·결과·재진입 |
| 장식 제목·굵은 경계·spacing 취향 | D로 단정하지 않음 | — | — | — | — | — | LOW. 실제 읽기 장애 근거가 없는 visual refresh는 수행하지 않음 |

## 5. Changes

### 검색 결과를 가리는 모바일 탐색

**Observed Problem → Intervention → Expected Benefit**

검색할 때 810.95px의 탐색 패널이 결과 앞에 자동으로 펼쳐짐 → 검색 결과 표시와 필터 확장 상태를 분리하고 기존 toggle을 `검색 필터`로 재사용. 모바일 검색 동안만 고정 요약·테마별 목록을 숨기고 기존 출처·상황 select는 펼쳐서 사용. 적용된 필터명은 접힌 toggle에도 표시 → 첫 일치 결과를 같은 화면에서 선택하며 숨겨진 필터를 기억할 필요가 줄어듦.

긴 문서 아래에서 새 검색을 시작하면 검색 영역으로 한 번 이동한다. 이후 같은 검색 중 매 글자마다 화면을 스크롤하지 않는다. 검색을 끝내면 고정·테마 탐색을 다시 표시한다. 데스크톱 색인은 그대로다.

### 검색 제출과 다음 키보드 행동

**Observed Problem → Intervention → Expected Benefit**

Enter로 참조를 연 뒤 포커스가 검색창에 남아 R을 텍스트로 입력 → Enter 제출로 참조를 연 경우에만 기존 제목으로 포커스 이동. 제목은 tabIndex -1로 일반 Tab 순서에 새 항목을 추가하지 않음 → 읽기 시작점이 현재 참조로 옮겨지고, 기존 R 단축키가 검색어 변경 없이 굴림을 실행.

읽기 동작이 자동 굴림으로 바뀌지 않는다. 입력 중 R을 텍스트로 처리하는 기존 보호도 유지한다.

### 실패한 제출과 검색 재진입

**Observed Problem → Intervention → Expected Benefit**

0건이어도 제출하면 결과 화면을 닫음 → 결과가 있을 때만 참조를 열고, 0건은 검색어·실패 안내를 유지 → 사용자가 검색어를 바로 수정할 수 있으며 이전 참조와 실패 검색을 혼동하지 않음.

같은 검색어가 남은 입력에 다시 들어와도 결과를 열지 않음 → 검색창 focus 시 기존 결과 재표시 → ⌘K 또는 입력 클릭 후 추가 편집 0회로 같은 결과를 선택.

새 화면·새 검색 메뉴·새 저장 상태·새 도메인 기능을 추가하지 않았다.

## 6. Preserved Elements

폰트 시스템, 팔레트, 종이와 잉크 표면, 직선 경계, 장식 워드마크, 홈 배치, 주요 네 페이지, 데스크톱 색인, 생성 결과의 정보 밀도, 기존 icon·button·select·details 언어를 유지했다. 큰 제목과 경계선을 단순 취향으로 줄이지 않았다.

원문 자료·표·공식·랜덤 생성·복사 serializer·저장 키·migration·도메인 모델·참조 연결 데이터는 수정하지 않았다. package.json과 package-lock.json도 작업 전 사본과 일치한다. 사용자 작업 전부터 존재하던 `_bmad`, 과거 감사 문서와 기타 untracked 파일을 덮어쓰거나 정리하지 않았다.

## 7. Validation

동일 앱·자료·검색어와 viewport에서 CUA로 실제 조작한 결과다. 측정값은 DOM 좌표이며 사람의 완료 시간 측정은 아니다.

| 비교 항목 | Before | After |
| --- | --- | --- |
| 390×844, 첫 Weather 결과의 화면 상단 기준 y | 1191.22px | 441.27px |
| 모바일 검색 탐색 패널 높이 | 810.95px | 61px |
| 첫 결과를 읽기 위한 추가 스크롤 | 필요 | 0회 |
| Reaction → 굴림 → COPY → Morale | 4클릭 / 입력 0 / Back 0 | 동일 |
| NPC → 굴림 → 이름 유지 → 재굴림 | 생성기 진입 포함 5클릭 | 동일; Harmug 유지, 나머지 변경 |
| Mythic → 판정 → 닫기 | 3클릭 / 필수 입력 0 | 동일; 같은 NPC 복귀 |
| 검색 → Enter → R | `날씨r`, 0건 | 제목 포커스 → d12 결과, 검색어 `날씨` 유지 |
| 같은 검색어 재진입 | 결과를 보려면 검색어 편집 필요 | ⌘K 1회, 추가 편집 0회 |
| 0건 검색 → Enter | 기존 Reaction으로 이동 | 0건 안내와 검색어 유지 |

첫 결과 위치는 **약 750px 감소**했다. 클릭 수가 유지된 검색·복사 작업에서도, 검색과 무관한 테마 목록을 먼저 훑지 않아도 일치 항목을 볼 수 있다는 점이 달라졌다.

| After viewport | 첫 검색 결과 y | 가로 overflow | Weather 열기·재굴림·복사 |
| --- | ---: | --- | --- |
| 360×844 | 439.42px | 없음 | 수행 |
| 390×844 | 441.27px | 없음 | 수행 |
| 768×844 | 457.92px | 없음 | 수행 |
| 1440×900 | 344.20px | 없음 | 수행 |

추가 확인: NPC 결과를 scrollY 1684에서 읽다가 `날씨`를 입력하면 scrollY 0, 첫 결과 y 441.27로 복귀한다. RCL 필터 적용 후 Weather Shift / Weather Move로 목록이 좁혀진다. 실제 COPY clipboard에는 화면의 Irritating drizzle 결과가 포함된다.

자동 검사: 첫 전체 실행 **1233 passed / 0 failed / 0 skipped**, lint 통과. 기존 lockfile의 정확한 버전으로 의존성을 복원한 뒤 클라이언트·서버 TypeScript와 표준 production build를 다시 통과했다. 최종 Vite 버전은 8.2.2이며 공개 빌드 및 private boundary는 각각 static files 53개를 검사해 통과했다.

최종 테스트 기록은 실행별로 구분한다. 전체 재검사에서 **1205 passed, 2 test-file initialization failures**가 나왔다. `mythic.test.ts`와 `private-data.test.ts`의 JSON.parse가 자료를 빈 문자열로 읽어 초기화에 실패했으며 assertion 실패가 아니었다. iCloud placeholder 자료의 실제 내용을 검증한 다음 두 파일을 다시 실행해 **28 passed / 0 failed / 0 skipped**를 확인했다. 최종 lockfile 환경에서 검증된 개별 테스트는 합계 **1233개**다. 자료나 테스트 기대값은 수정하지 않았다.

최종 production preview에서도 390×844의 첫 Weather 결과 y 441.265625px, 탐색 패널 61px, 가로 넘침 없음, Enter 뒤 제목 포커스, R 명시 굴림, ⌘K 재진입, 0건 제출 유지가 동일하게 재현됐다. 이 최종 검증에서 브라우저 error 로그는 0개였다.

검사 기록: `outputs/ux-calibration-20261007/`의 before/after 스크린샷, responsive-after.json, tests.txt, lint.txt, build.txt, tests-locked.txt, tests-fixture-retry.txt, build-locked.txt, browser-validation-locked.json, after-mobile-search-locked.jpg. 브라우저 조작의 증거는 채팅의 CUA 실행 기록에도 남는다.

## 8. Regression Check

- 데스크톱 색인·필터·테마 목록을 유지했다. Reaction / Morale과 NPC / Mythic의 클릭 수가 늘지 않았다.
- 검색에서 참조를 열면 모바일 고정·테마 탐색이 다시 돌아온다. 검색 중에도 기존 필터를 펼칠 수 있고, 접힌 상태에도 적용된 책·상황명이 보인다.
- 검색 뒤 R은 명시적으로 누를 때만 굴린다. Enter로 여는 행동 자체는 결과를 자동 생성하지 않는다.
- 기존 이름 유지와 전체 재굴림이 정상이다. Mythic을 닫아도 NPC 결과와 유지 상태가 그대로다.
- Weather → Morale → 브라우저 Back에서 동일한 Weather 결과 문자열이 복원되며 재굴림하지 않는다.
- Weather PIN이 새로고침 후 유지됐다. 검증용 고정은 해제해 원래 고정 0개 상태로 되돌렸다.
- CSS는 max-width 800px의 검색 상황에만 적용했다. 서체·색상·경계·radius·shadow 수정을 하지 않았다.
- 원본 domain / generators / storage / data 코드의 변경은 없다. 기존 테스트 기대값을 수정하지 않았다.

## 9. Remaining Problems

- 검색창 Escape 취소는 이번에 추가하지 않았다. 기존 ×로 검색을 지우고 이전 참조로 복귀할 수 있다. 관찰한 HIGH 문제와 직접 연결된 제출·포커스·재진입을 먼저 해결했다.
- 긴 표와 생성 결과는 내용에 따라 스크롤이 필요하다. 실제 내용을 줄이거나 숨기기 위한 새 tab·card·dashboard를 도입하지 않았다.
- 실제 사용자 통계, 인터뷰, 가상 모바일 키보드가 열린 기기에서의 동작은 검증하지 않았다. viewport 검사는 실기기 터치 사용성 연구와 구분한다.
- production build의 기존 큰 JS chunk 경고는 남아 있다. 이번 사용 검사에서 패키지 크기 자체를 UX 변경의 근거로 삼지 않았으며 코드 분할을 작업 범위에 추가하지 않았다.

환경 기록: iCloud placeholder 때문에 초기 의존성과 소스 로딩이 지연됐다. 원래 node_modules는 git-ignored `outputs/dependencies-before-ux-20261007`에 보존하고, 기존 lockfile 버전으로 새 의존성 디렉터리를 구성했다. 패키지 정의·lockfile·Vite 설정은 수정하지 않았다. 초기 관찰용 개발 서버에서만 CSS 클래스 탐색 범위를 src로 제한했다. 표준 production build를 별도로 실행하고, 최종 브라우저 검증은 그 빌드의 preview 서버에서 수행했다. 기존 다른 앱 서버는 건드리지 않았다.

Restraint test: 각 코드 변경은 위의 재현된 검색 문제와 연결된다. 기존 디자인에 대한 미세한 시각 polish는 추가하지 않았다.
