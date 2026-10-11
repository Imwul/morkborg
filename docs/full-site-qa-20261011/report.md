# 전체 사이트 QA 및 수정 결과 — 2026-10-11

기존 디자인과 자료 구조를 유지하며 실제 브라우저로 주요 기능을 순회하고 확인된 결함을 수정했다. 최종 자동 회귀는 **1,259/1,259 통과, 실패·건너뜀 0**이다. 이는 전체 룰북·모든 환경의 승인과 다른 결과다. RECLVSE 원본 PDF와 일부 전문 의미·조건 검토가 남아 있어 **원문 전수 검증 완료를 선언하지 않는다**.

검증 기준은 [요구사항](requirements.md)과 사용자의 QA-01–07이다. 기준 소스는 `81bbb9419900ab0bf7476f756e9dc013b3add9fa`. 실제 개발 서버를 실행하고 CUA 브라우저로 조작했다. 기존 `node:test` 회귀와 원문 독립 계산은 브라우저 순회를 보완한다. 개인 기록과 원본 PDF·자료 키·평문 팩은 공개 보고서나 Git에 포함하지 않았다.

## 실제 방문하고 조작한 범위

| 영역 | 실제 확인한 기능·경계 |
| --- | --- |
| 홈 | Miseries, Weather, Names, Reaction, Action/Theme, Room 빠른 참조; 굴림·표·COPY·PIN·돌아오기. Miseries/Names 잘못된 실물 주사위와 정상 값 복구, HOLD 후 재굴림 |
| 탐색·리더 | 책9종·상황8종·유형7종 필터, 빈 결과·한글·분음부호 검색, 책/지역/생물/규칙/표/절차 리더, 원문 공개 접기, 관련 결과 이동과 돌아오기. Goblin 실제 수치를 전투에 추가 |
| 캐릭터 | Classless·무작위·12개 직업 지정, Core/SCVMBIRTHER/homebrew, 현재 결과와 다음 생성 원문 구분, 재굴림·저장·다시 열기. 공개 모드/스냅샷 불가 시 Core 복구도 별도 실행 |
| 몬스터 | FER A/B/C 동일 굴림의 수치 연계, The Monster Approaches 원문·한국어, EPK7지역 및 사냥 d8/d10/d12. 비활성 구형 수동 편집 화면은 방문한 화면에 포함하지 않음 |
| 던전 | Core/DNGNGEN, 이유·입구 경비·특별한 방1–4, 12개 개별 재굴림, 수동 값 보존, 저장·복귀, 결과별 하위표·실물 값 오류/복구. 특별한 방의 한국어와 중복 DNGNGEN 문구 없음 확인 |
| 기타 생성기 | NPC7지역·7부분·HOLD, Room2부분, Street 소/대·출구 설정·1/2개의 독립 내용, Settlement, Weather1–3·4하위표, Buildings, Names, Action/Theme, Cult9부분, Adventure4부분 |
| 공간 지도 | Dungeon/City/Journey의 **75개 참조 링크**, **70회 실제 굴림**, **12개 행동 메뉴**. 정적 Passage/Travel Distances와 출처 전용 Merchant를 무작위 굴림과 구분. 이동·확대·장면 선택·새로고침 |
| 일반 주사위·플레이 안내 | 8면 종류, 개수/보정 경계와 빈 값, 권능·휴식·감염·식량·과적 안내, Core/SD 실물 판정·자연1/20 및 오류 후 기존 결과 유지 |
| 전투 | PC/적 입력·장비·HP/회복, 공격/방어/치명/실수, 원거리 Presence, 방어구0–3 선택, 방패 파괴 취소/기록/Undo, Omens, 사기·참여해제, 복제·제거·Undo, 추가 참가자·선택 해제·라운드·새 전투·닫기/재열기 |
| Mythic | Odds9·CF1/9/오류, Chart/Check 경계, doubles·100, Expected/Altered/Interrupt·Prepared, 이벤트·Meaning, 리스트3종·구역·중복 제한·편집·cleanup·재열기/새로고침·기록20개 |
| 보관함 | 캐릭터/NPC/던전/도시4종 생성·저장·선택 및 각각 편집 취소/저장·복제·COPY·삭제/Undo·새로고침. 수정 내용과 생성 원본을 분리해 보존. 실제 JSON 다운로드→가져오기 추가; 잘못된 kind·10MB 초과·200개 초과 거부 후 기존 기록 보존 |
| 편의 도구 | Tray 검색·중복/제거, Scratch 수동 여러 줄·SEND·COPY ALL·재열기/새로고침, Recent 복사/출처 복사/재굴림, Pack/Recipe 생성·편집 취소·순서·실행/HOLD·활성/삭제, Reaction 실물 경계 |
| 자료·설정 | Sources 자동 갱신 켜기/끄기, 실제 전체 백업/복원·재열기·잘못된 JSON/kind/중복/파일수/20MiB 거부. RECLVSE 두 d20 및 질문5확률. About·라이선스·출처 링크 표시; 외부 원문 사이트로 이동하지 않음 |
| 상태·화면 | Ctrl+K·R·입력 중 단축키·Esc, 방문 흐름의 닫기/복귀/새로고침. **360×800 / 768×1024 / 1440×900**에서 홈·생성기·긴 리더·표·지도·보관함/전투/Mythic/안내·Sources, 모바일 Scratch |

루트 브라우저 기록은 272개 관찰 상태와 32개 레이아웃 측정을 남겼다. 공간 검사의 88개 관찰 기록 및 다른 담당자의 저장/전투 기록은 별도 증거이며 숫자를 더해 고유 기능 수로 주장하지 않는다. 최종 루트 및 담당자 콘솔 기록에서 오류는 0개였다.

## 원문 대조와 근거

Core BARE BONES/전체판, FERETORY, SOLITARY DEFILEMENT, The Depths of the Dungeon, HERETIC, Mythic GME2, Alone in the Crowd의 **8개 구현 관련 원본 PDF**를 새 해시·추출로 대조했다. 추가 참고 PDF5종도 확인했지만 활성 표 대조의 분모에 넣지 않았다. RECLVSE는 원본 PDF가 없어 기존 렌더11/12/85페이지만 제한적으로 확인했다.

| 규칙군 | 원문 PDF 페이지 / 인쇄 페이지 | 결과 |
| --- | --- | --- |
| Core 시작 자원·능력·HP·장비 | BARE BONES21/23/27/29 / 동일 | 은화·식량·능력 변환·Classless 선택·최소HP·scroll 장비 제한 및 Core6/FER4/HER2 직업 기본 시작 규칙 확인 |
| Core 전투·휴식·Omens | 23/30/31/32/34/37 / 동일 | d20·DR·치명/실수·방어구/방패·사기·회복 안내 대조. 이미 자동 적용되는 피해×2의 잘못된 수동 안내만 수정 |
| FER 몬스터 | 2–3 / i–ii | A/B/C, 최고 사기·최저 피해·최고 방어구, HP 본문 한 번 굴림×2 확인. 본문과 괄호의 분포 차이·동률 미지정은 기존 설명 유지 |
| SD 판정·탐색·던전·여행 | 5/7–9/15/17 / 3/5–7/13/15 | 두 d20·Strong/Weak/Fail, Omens0–4, 탐색DR12, 회복·출구·여행 순서 확인 |
| Depths | 6/9–13/15–19/25 / 3/6–10/12–16/22 | TR/DR 분리·경계/잠금/함정·위험·적 카드15행·Orakle 조건 확인. TR3–30은 원문 제한이 아니라 기존 앱 입력 계약 |
| AitC | 4/6–8 / 2/4–6 | City 목표 완료 시 Strong→Weak 수정 근거. Dérive는 동일 후속만 유지. Stash Omens0–4 제한, suggested DR override 구분 |
| Mythic | 20/26–27/38/68/163/165/187 / 19/25–26/37/67/162/164/186 | Chart81셀·Check·doubles/CF·Scene·Prepared를 Core/RECLVSE와 분리해 확인 |
| RECLVSE 제한 대조 | 기존 렌더11/12/85 | 기본/선택DR·첫 Critical Die·질문 경계 모순 안내 확인. 현재 판본 전체는 미확인 |

독립적으로 원문 숫자를 전사하여 **29,846개 입력·표 대조가 통과**했다: 능력 변환20, 직업 기본12, FER1,728, SD crawl6,000, Depths 적15, Searching2,000, City/Dérive1,600, Stash2,000, Mythic Chart81+8,100, Check8,100, Scene180 및 해당 입력 검증. 이 수는 자동 테스트 개수나 브라우저 클릭 수가 아니다.

활성 **548표/12,328행 전부의 문구·출처 상태를 분류**했다. 원문 확보325표/7,934행 중 선언 페이지 기본 추출 일치7,590행(95.66%), 다른 페이지 후보97행, 정규화 미일치247행이다. RECLVSE223표/4,394행은 새 PDF 대조 미완료다. 투영/중복 행이 포함되므로 고유 원문 문장 수나 전체 승인율로 표현하지 않는다.

두 열 추출 문제인 AitC50행은 열별 재추출로 일치 확인했다. 이미지인 Depths200단어는 OCR199후보와 Flame 직접 확인으로 보충했다. 이 보충 수치를 기본 일치율에 합산해 전수 승인으로 바꾸지 않았다. 합성 안내·metadata·OCR·검색 일치는 모든 범위·조건·번역·연결의 의미 검토를 대신하지 않는다.

Core 치명 피해와 감소의 적용 순서는 원문에 별도 수식이 없으므로 기존 계산을 추측해서 바꾸지 않았다. 지역 가중치, 여러 책의 dossier 조합, 별도 웹 생성기, 저장/기록의 수동 처리 정책은 원문 규칙과 구분했다.

## 확인된 결함과 수정·회귀

P1은 판정/핵심 사용 흐름, P2는 상태/표시/데이터 보호, P3는 좁은 안내·정렬 문제다. 아래는 새로 확인해 고친 결함이며 이미 고쳐져 있던 DNGNGEN 번역/메타데이터 문제는 이번 신규 수정 수에 넣지 않았다.

| 우선 | 문제 | 수정 | 수정 전후 검증 |
| --- | --- | --- | --- |
| P1 | Searching에서 음수·소수·5/999 Omens 허용 | 원문에 따른 정수0–4를 RNG 전에 검증 | 실제 invalid 거부·기존 결과 보존·0/4 복구; 회귀와 원문 독립 조합 통과 |
| P1 | Stash Item에서 잘못된 현재 Omens 허용 | 해당 Omen 선택에만0–4 적용, 능력 음수 보정 유지 | 실제 −1/0.5/5/999 거부·0/4 복구 및 회귀 |
| P1 | City 목표 완료 후 Weak 절차지만 Strong 표시 | City Crawl outcome을 Weak로 맞춤 | 완료/미완료와 Dérive를 실제 재검증, 원문·회귀 일치 |
| P1 | 활성 캐릭터 화면에서 기존 SCVMBIRTHER 경로 누락 | 기존 팩·엔진·원문 선택 UI를 다시 연결 | native/homebrew·다음 원문·저장·공개/불가 시 Core 복구 실제 확인 |
| P2 | Orakle 잘못된 TR이 새 결과를 만든 뒤 저장 오류 | 활성 입력만 기존3–30 정수 계약을 RNG 전에 검증 | 2/소수/31/음수에서 이전 결과 유지,3/30·옵션off 복구; RNG0 회귀 |
| P2 | SEND TO SCRATCH 뒤 스크랩이 열리지 않고 닫으면 리더 유실 | 기존 Scratch 패널 연결·인라인 리더 선택 보존 | SEND→읽기/COPY→닫기→원래 리더로 실제 복귀 |
| P2 | Street 수량 결과가 자신의 절차로 다시 연결 | 파생 conditionalCount 링크 제외 | 실제 큰 길1/2결과에서 거짓 재귀 링크 없음, 진짜 후속 링크 보존 회귀 |
| P2 | Mythic Thread 첫 편집이 Character 탭으로 이동 | 결과를 지우기 전에 리스트 종류 유지 | 실제 Thread 편집/cleanup·돌아오기 후 올바른 탭 유지 |
| P2 | 치명/실수 피해×2 계산과 ‘직접 배수’ 안내 충돌 | 안내·수식 표시를 이미 적용된×2와 일치 | 실제 같은 입력 전후 및52개 전투 관련 회귀 |
| P2 | 손상 보관함이 빈 데이터 백업을 내려받을 수 있음 | 저장 오류 시 Export 비활성 및 핸들러 방어 | 손상 store의 byte/쓰기0 회귀와 실제 손상 브라우저의 Export 비활성·닫기 재열기·원문 정확 복원·정상 Export/Import 통과 |
| P3 | 실패한 import 경고가 닫기·정상 저장 후 다시 남음 | 새로 열 때 로컬 작업 오류만 초기화 | 실제 잘못된 import→닫기→생성/저장→재열기 및 Combat→Shelf에서 경고 해소,store 오류는 유지 |
| P2 | SCVM scroll/to spot/tongs 오역 | 영문 의미가 확인된 문맥에서만 두루마리/발견/집게로 표시 보정 | 765메시지 중24표시 변경·숫자 token0변경; 실제 Sacred scroll/Bear trap 확인. tongs 실제 추출은 미관찰 |
| P2 | 모바일 전투 결과가 가느다란 세로 열로 쪼개짐 | 기존 스타일의 결과 배치만 grid/stack 정리 | 모바일·태블릿·데스크톱 전투 실제 읽기·조작 재검증 |
| P2 | 모바일 도킹 패널 왼쪽이 화면 밖으로 잘림 | 스크롤바를 포함하는 vw 대신 부모 너비 사용 | 360화면에서 네 패널 left8/right337, 잘림 없이 실제 조작 |
| P3 | 정적 하위 참조에 작동하지 않는 ‘굴리기’ | 기존 roll 가능 여부로 액션 표시 | Passage/Travel/정적 규칙에서 표보기만, 무작위 참조는 굴리기 유지 |
| P3 | Depths 책 요약14개와 실제 규칙16개 불일치 | 늦게 추가된 참조 뒤에 요약/related 목록 계산 | 실제16/16 표시와 독립 registry 회귀 |
| P3 | Weather Wind가 ‘바람 소리’로 잘못 표시 | 정확한 Weather 용어 표시만 보정 | 실제 Wind 바람 헤더 및 원문/개인 번역 불변 회귀 |
| P3 | 임시 기록의 새로고침 안내가 실제 수명과 다름 | sessionStorage와 메모리 기록 안내 수정 | 실제 Tray/Scratch/Recent/Last 유지·소실 경로와 일치 |
| P3 | Room 빠른 카드가 제공하지 않는 내용/출구를 암시 | 실제 두 구성요소인 수식어/유형으로 라벨 수정 | 같은 화면에서 카드와 생성기 실제 확인 |
| P3 | 모바일 홈 Weather/Reaction 제목이 단어 조각으로 줄바꿈 | 기존 모바일 글자 크기만 반응형 보정 | 같은360×800 전후에서 온전한 단어 표시 |
| P3 | 모바일 지도 확대 툴바 라벨이 세로 두 글자로 눌림 | 좁은 화면에서 줄바꿈·컨트롤 축소 방지 | 같은360×800에서 확대 토글과 horizontal label 실제 확인 |
| P3 | 실제 저장 용량 초과 안내가 영어·내부 저장 키를 노출 | 기존 QuotaExceededError 안내만 한국어로 표시 | 실제153 QA키로 quota도달→저장 거부·원문 byte 동일·한국어 안내→QA키 정리→정상 저장 복구 |

일반 캐릭터/몬스터/던전 자료 구조, 원문 팩, RNG, 기존 전투 계산식은 보존했다. Wind의 오역을 기대하던 기존 테스트는 원문 의미에 근거해 보정했으며 Black Salt의 미검토 제목 검증은 그대로 유지했다.

## 테스트와 BMAD 실행

| 검사 | 결과 |
| --- | --- |
| 시작 기준 전체 회귀 | 1,249/1,249 통과 |
| 모든 수정 후 최종 전체 회귀 | **1,259/1,259 통과**, 실패·취소·skip·todo0,193,415.953541ms (최종9a7c57f 소스) |
| 관련 회귀 | 전투52, Mythic/Notebook50, Dungeon9, City17 등 수정 경로 재검증. 서로 겹치는 실행 수는 합산하지 않음 |
| 코드 검사 | lint 통과, diff 공백 검사 통과 |
| 타입·빌드 | 클라이언트/서버 타입 검사와 Vite 빌드 통과 |
| 자료 경계 | public55정적 파일·private55빌드 파일 통과. 수정 코드934경로 및 공개 산출물 추가 후950경로의 staged Git 검사 통과; ignored8경로·공유86조각 변경 없음 |
| 실제 브라우저 | 방문한 경로의 최종 콘솔 오류0. 오류 입력·취소·복귀·새로고침을 각 영역에서 실제 조작 |

기존 Vite 대형 청크 경고는 남아 있다. 이 작업에서 성능 목표를 새로 만들거나 구조 개편을 하지 않았으며 성능 부하·SLA는 측정하지 않았다.

BMAD TEA 설정을 승인된 기본값으로 추가했고 **Test Design·Test Review·Trace** 워크플로를 단계별 산출물과 checkpoint로 실행했다. 현 Node runner를 유지했으며 적용 대상이 없는 Playwright/Pact 패키지를 설치하지 않았다.

Test Review의7파일111개 실행은 통과했다. 별도 구조 rubric은 **63/100, D, Request Changes**이며 조건부 기대값·중첩·그룹 구조의6High/6Medium 지적이다. 이것을 게임 규칙 오류나 전체 사이트 실패로 바꾸어 표현하지 않는다. 점수를 위해 기존 기대값/검사 수를 바꾸거나 관련 없는 전체 테스트 재구성을 하지 않았다. 루트 신규3개 회귀는 별도 supplement로 검토했다.

최신 코드 기준 **Trace 품질 게이트는 FAIL**이다. 26개 기준은 FULL6 / PARTIAL7 / UNIT-ONLY12 / NONE1이며 FULL 비율은 전체23%, P0 25%(1/4), P1 19%(4/21), P2 100%(1/1)다. P0의 SYS-18·19·20이 FULL에 못 미쳐 제공된 판정 엔진이 미통과로 결정했다. 채택 증거58개와 전체 회귀1,259개는 서로 다른 분모다. live21개 중 최신본 증거3개를 채택했고 이전 소스에서 관찰한17개는 stale, 저장 오류 주입 범위가 남은1개는 blocked로 분류했다. 방문한 이전 화면을 최신본에서 모두 다시 관찰했다고 바꾸지 않았다. SYS-24의 최신 반응형 증거 공백도 남겨 두었다. 이 결과는 자동 회귀가 실패했다는 뜻이 아니라 전체 검증 완료를 승인할 근거가 부족하다는 뜻이다.

전체 브라우저 순회와21개 수정의 검증 code commit은 `c01e24363983cc6d594896a43cf0e883d0bef664`다. 후속 실제 quota 검사에서 발견한22번째 오류 안내 수정은 `9a7c57f8f9f2d120210a8cd7f0507d78535637f8`이며 해당 오류·원문 보존·정상 저장 복구를 이 코드에서 재검증했다. 기존 bulk live 기록은 실제 관찰한 이전 SHA를 그대로 유지한다. Trace 최종 판정은 최신 code HEAD를 기준으로 기록하며, 이전 commit의 관찰을 새 commit의 재관찰로 위장하지 않는다. 보고서만 추가하는 commit이 바뀌어도 검증한 소스 SHA를 새 것으로 위장하지 않는다.

## Before / After 증거

전체 원문이나 개인 자료가 들어갈 수 있는 화면은 ignored 로컬 증거로 보관한다. 아래 링크는 해당 작업공간의 `outputs/full-site-qa-20261011/screenshots/` 파일이며 Git 원격에는 게시되지 않는다.

| 같은 화면 조건 | Before | After |
| --- | --- | --- |
| 캐릭터 원문 선택 | [이전](../../outputs/full-site-qa-20261011/screenshots/character-source-before.png) | [수정](../../outputs/full-site-qa-20261011/screenshots/character-source-after.png) |
| 같은 전투 치명 입력 | [이전](../../outputs/full-site-qa-20261011/screenshots/combat-critical-before.png) | [수정](../../outputs/full-site-qa-20261011/screenshots/combat-critical-after.png) |
| Mythic Thread 편집 | [이전](../../outputs/full-site-qa-20261011/screenshots/mythic-thread-edit-before.png) | [수정](../../outputs/full-site-qa-20261011/screenshots/mythic-thread-edit-after.png) |
| City 완료 조건 | [이전](../../outputs/full-site-qa-20261011/screenshots/spatial-city-completed-objectives-before.png) | [수정](../../outputs/full-site-qa-20261011/screenshots/spatial-city-completed-objectives-after.png) |
| Searching/Stash 잘못된 Omens | [Searching 이전](../../outputs/full-site-qa-20261011/screenshots/spatial-search-negative-before.png), [Stash 이전](../../outputs/full-site-qa-20261011/screenshots/spatial-stash-negative-before.png) | [Searching 수정](../../outputs/full-site-qa-20261011/screenshots/spatial-search-negative-after.png), [Stash 수정](../../outputs/full-site-qa-20261011/screenshots/spatial-stash-negative-after.png) |
| 홈360×800 | [안정된 이전 캡처](../../outputs/full-site-qa-20261011/screenshots/mobile-home-stable.png) | [수정](../../outputs/full-site-qa-20261011/screenshots/mobile-home-after.png) |
| 지도360×800 | [이전](../../outputs/full-site-qa-20261011/screenshots/mobile-spatial.png) | [수정](../../outputs/full-site-qa-20261011/screenshots/mobile-spatial-after.png) |
| 보관함360×800의 왼쪽 경계 | [이전](../../outputs/full-site-qa-20261011/screenshots/mobile-shelf.png) | [수정](../../outputs/full-site-qa-20261011/screenshots/mobile-shelf-after-matched.png) |

보관함 마지막 비교는 같은 viewport·선택 종류의 패널 경계 비교이며 내용/스크롤 위치는 완전히 같지 않다. viewport 변경 직후 낡은 crop이 남은 캡처는 비교 근거에서 제외했다.

## 남은 공백·추가 검토

- RECLVSE 현재 판본의 원본 PDF 재확보·해시·전체 표/규칙 대조. 기존 렌더의 제한 확인을 전체 승인으로 확대할 수 없다.
- 548표의 상태 분류와 핵심 수치 독립 대조는 완료했지만 모든 전문 번역·행 범위·후속조건의 사람 전수 승인은 미완료다. HERETIC 모든 고유 능력/저주·AitC 모든 절차·Mythic Meaning/Variation 전체 적용 분기와12직업의 모든 attachment는 추가 대조 대상이다.
- 실제 보관함 JSON 손상과 localStorage 용량 초과는 브라우저에서 주입·거부·원문 보존·복구까지 확인했다. 저장 접근 거부/IndexedDB 손상·오프라인·동시 탭 CAS 오류 주입은 미실행이다. 해당 fake store/API 회귀를 실제 브라우저 PASS로 보고하지 않았다. 손상 cache 정책 후보는 확정 결함으로 판단할 근거가 없어 변경하지 않았다.
- 전투의 모든 능력/방어구/Omens 조합, Mythic81×100조합과 리스트25칸 각각을 모두 브라우저에서 반복하지 않았다. 수학 조합 검증과 주요 UI 경로 검증은 구분된다.
- 세 viewport는 실제 브라우저 크기 검사이며 물리 모바일/태블릿 기기, 모든 OS·브라우저 엔진 검증은 아니다. Production 로그인·TLS·부하·장애 복구는 로컬 검사로 인증할 수 없다.
- 비활성 legacy 화면, 외부 출처 사이트, 일회 관찰되지 않은 SCVM tongs 결과는 실제 방문 완료에 넣지 않았다.
- 테스트 구조 Review 지적은 별도 후속 개선 대상이며 기대 결과를 바꾸지 않고 고정 원문 기대 데이터로 개선해야 한다.

## 증거와 재현 위치

공개 산출물: `docs/full-site-qa-20261011/`, `_bmad-output/test-artifacts/test-design/`, `test-review/`, `trace/` 및 root live manifest.

ignored 로컬 증거: `outputs/full-site-qa-20261011/`의 `browser-main.json`, `browser-root-summary.md`, `responsive-layout.json`, `browser-tools.md`, `browser-spatial.md`, `spatial-coverage.json`, `storage-findings.md`, `storage-follow-ups.md`, `rulebook-findings.md`, 콘솔·스크린샷·`verified-tests/lint/build.log`, 최종 `release-tests/lint/build.log`, `live-storage-fault-metadata.json`. 원문 독립 추출·전사는 `rules-private/`에 유지한다.

기존 Vercel 프로젝트의 Production 환경변수 존재와 All Deployments 인증 보호·우회 없음 상태를 읽기 전용으로 확인했다. 연결·API·빌드·배포 설정은 이번 코드 수정에서 바꾸지 않았다. 배포 결과와 실제 전달 소스 확인은 로컬 `deployment-verification.json` 및 최종 안내에 기록한다.

개인용 사이트는 같은 기능과 자료를 여러 기기에서 사용할 수 있는 기존 구성을 유지한다. 직접 저장한 기록은 각 브라우저에 남으며 기기 간 자동 동기화는 추가하지 않았다.
