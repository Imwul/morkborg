# Product integrity pass — 2026-09-08

이번 작업은 **로컬 구현·검증·커밋**이다. 공개 서비스 배포, Git push, 비공개 데이터 게시를 수행하지 않았다. 정확한 커밋 해시는 전달 응답에 별도로 기재한다. 아래의 production 검증은 localhost의 실제 production build에 대한 검사이며 공개 Vercel 서비스 검사나 배포를 뜻하지 않는다.

후속 점검에서 실제 AitC 비공개 표의 한국어 누락과 Crawl 화면 통합 누락을 추가로 발견했다. 이 보고서의 한국어 스캔 수는 AitC 전체 번역 완료를 뜻하지 않는다. 보완 내역과 최신 검증은 [중단 작업 후속 감사](../interrupted-work-audit.md)에 기록한다.

## 최종 출처 집계

전체 생성 코드에서 **155개 고유 feature.field 경로**를 문서화했다. 클래스·프리셋·지역별 출처를 구별하면 **1,367개 필드/출처 경로 행**이다.

| 분류 | 문서화한 필드/출처 경로 | 실행 표본의 필드 묶음 |
| --- | ---: | ---: |
| SOURCE_VERBATIM | 786 | 5,937 |
| SOURCE_COMPOSED | 390 | 1,285 |
| APP_DERIVED | 153 | 2,499 |
| USER_AUTHORED | 38 | 200 |
| UNSOURCED | **0** | **0** |
| 합계 | **1,367** | **9,921** |

실행 표본은 분기와 호환 필드의 반복을 포함한다. 9,921개를 서로 다른 생성 기능 수로 부풀리지 않았다. **85개 절차 정의를 검증했고 출처 무결성 오류는 0개**다. 원문 자체의 PARTIAL / CONFLICT / UNAVAILABLE 상태는 아래에 별도로 남겼다.

별도 원문 데이터 감사: **562개 정규 표, 12,276개 영어 항목**. VERBATIM 12,197 / COMPOSED 78 / DERIVED 1 / UNSOURCED 0. 11,980개는 지정 PDF 페이지의 정규화된 추출문과 대조했고, 295개는 렌더링·독립된 표 셀 대조가 필요했다. 1개는 실제 원문 잘림이다. 생성 필드 집계와 원문 항목 집계는 다른 단위다.

기계 판독 결과: [generation-integrity-report.json](generation-integrity-report.json), [reference-source-coverage.json](reference-source-coverage.json).

## Special Room: 무엇을 바꿨는가

이전 경로는 방마다 서로 독립적인 Core 결과를 두 개 뽑고, 네 방 전체에서 여덟 결과의 중복을 방지했다. 여기에 앱이 만든 역할 이름, 던전 제목·내용의 단어 기반 가중치, 지역 특성, 한국어 연결 문장을 더했다. 실제 자료가 지시하지 않은 관계를 문장으로 확정하는 문제가 있었다.

새 경로는 다음과 같다.

1. **Sölitary Defilement PDF 19 / 인쇄 17**의 준비 목록은 Special Room **4칸**이다.
2. 각 칸에 **Core Bare Bones PDF·인쇄 73–74, Sample Rooms (`core.rooms`)**를 한 번 굴린다. d4로 블록을, d6로 블록 안의 행을 선택한다.
3. 원문이 지시한 세 행에서만 추가 굴림을 한다: 11번 모티프 d6, 33번 선반 내용 d4, 43번 제단 상태 d4.
4. 기본 결과와 조건부 결과를 독립된 구성 요소로 표시한다. 다른 방 유형·지역 특성·위험·보물을 자동으로 덧붙이지 않는다. 중복 결과를 임의 재굴림하지 않는다.

**중요한 경계:** SD가 네 칸을 Core 표로 채우라고 규정하는 것은 아니다. SD는 DNGNGEN 또는 직접 준비를 제안한다. 네 칸을 Core Sample Rooms로 채우는 것은 **공개된 앱의 준비 선택**이며, 이 사실을 SOURCE 안에 명시했다. DNGNGEN 사이트의 문구나 추정 알고리즘을 복제하지 않았다. 준비된 방이 던전 이름에 맞는 서사를 갖도록 만들지도 않는다.

새 방 이름은 `ROOM 01–04`라는 구조적 식별자다. 한 단어 결과도 유효하다. 전체 재굴림과 개별 재굴림의 범위를 구별하며, 부모 결과가 조건부 결과를 바꾸는 경우 안내한다. 다른 수동 수정값은 보존한다. 자세한 검증과 페이지 목록은 [dungeon-audit.md](dungeon-audit.md)에 있다.

## 제거·분리한 모든 무근거 생성 경로

| 경로 | 문제와 처리 |
| --- | --- |
| `SpecialRoom.name.rolePrefix` | 출처 없는 역할 접두어 삭제. 중립적인 방 번호로 대체. |
| `SpecialRoom.feature.contextBinding` | 거주자·위험·발단을 방에 연결하는 앱 문장 삭제. |
| `SpecialRoom.feature.regionDescriptionFallback` | 표 누락 시 지역 분위기 설명을 결과로 쓰던 대체 경로 삭제. |
| 구형 NPC HP 대체 | 출처가 없을 때 임의 d4 능력치를 만들던 경로 삭제. |
| 행동 표의 누락 주사위 대체 | 원문 주사위가 없을 때 d4로 표시하던 경로 삭제. |

다음은 문구 자체가 무근거인 경우와 구분했다. **실제 출처를 잘못 조합한 앱 문제**였으므로 자동 연결만 제거했다.

- Special Room의 두 독립 표 결과·강제 중복 방지·자동 지역 특성·번역문을 생성 입력으로 사용하던 처리.
- 일반 Room에 SD 묘사, Core 샘플, Depths 특성, RECLVSE 내용물을 한꺼번에 얹던 처리. 일반 크롤은 SD의 adjective/type/contents/exits 절차를 따른다.
- Dungeon motive와 weird phenomenon에 다른 문맥의 encounter 표를 자동 배정하던 처리. 처음에는 비워 두고 직접 작성할 수 있다. 원문 표는 Reference에 남아 있다.
- Monster에 관련 없는 Core 캐릭터 이름을 붙이던 처리. TMA의 기본 이름은 중립적인 `Monster`다.
- 누락된 EPK 자료를 다른 Monster 생성 방식으로 바꾸던 처리, 독립적인 구형 Rare encounter 조합 경로.

연결 문장이나 새 분위기 문구로 대체하지 않았다. 기존 저장 결과는 그대로 보존했다.

## 요청한 30개 완료 보고 항목

| # | 항목 | 구체적인 결과 |
| --- | --- | --- |
| 1 | 감사한 생성기 | Dungeon/title/dossier, Special·generic Rooms, Character와 12개 클래스, TMA/EPK/지역 Monster, 98개 creature·outcast 프리셋, NPC, Encounter, Oracle/복합 절차, 도시/여행/야영/새벽, 아이템·보물·전리품·번역·대체 경로. |
| 2 | 이전 Special Room 경로 | 두 독립 Core 결과 + 역할 이름 + 지역/제목 가중치 + 연결 문장 + 중복 방지. 위에서 명시했다. |
| 3 | 검증한 Special Room 절차 | 한 번의 d4×d6, 원문 세 행에서만 조건부 d6/d4/d4. 네 준비 슬롯과 표 선택의 앱 정책을 구별했다. |
| 4 | 책·표·페이지 | Core 73–74 / SD 19·17을 위에서 명시. 전체 필드별 목록은 세 도메인 감사 JSON과 원문 커버리지 파일에 있다. PDF와 인쇄 쪽수를 별도 보관한다. |
| 5 | 발견한 UNSOURCED 필드 | 위 표의 다섯 경로. 출처는 실제지만 조합이 잘못된 경로는 따로 열거했다. |
| 6 | UNSOURCED 처리 | 생산 경로에서 제거. 임의 문구·능력치로 대체하지 않음. 기존 저장 자료는 수정하지 않음. |
| 7 | SOURCE_COMPOSED | Core 제목의 두 열, 조건부 status/danger, SD 일반 방의 독립 구성 요소, NPC의 독립 프롬프트, 출처 statblock 요약, 복합 Oracle 결과. 절차가 없는 자동 관계는 제거했다. |
| 8 | APP_DERIVED | 주사위·수량·출구 수, 캐릭터 능력/HP/장비 수량, TMA 파생 능력치, 중립 식별자, 복제 접미사, 짧은 기계적 안내. 실제 입력과 공식을 추적한다. |
| 9 | 제목 | Dungeon은 Core 71의 실제 두 d12 열. Room은 번호. TMA Monster는 중립 이름. NPC/Character는 정규 Core 이름 표. 수동 제목은 수동 origin을 유지한다. |
| 10 | Dungeon | 발단·핵심 정보·접근·이상 현상·물건을 분리. 임의 guard는 만들지 않는다. 지역 가중치는 정규 항목 ID의 명시적 태그로만 1→1.25 조정하며 다른 결과도 가능하다. Special Rooms는 원문 주사위의 균등 선택이다. |
| 11 | Monster | Depths routing과 primary creature source를 분리. EPK의 실제 d6 분포 복원. TMA A/B/C 세 d12를 능력치 계산에 재사용. 미제공 능력치는 비워 두고 원문 모순을 표시한다. |
| 12 | NPC | 이름·직업·외형·성격·목적·반응이 정규 표 ID로 연결된다. 임의 기본 능력치 제거. 9개 outcast 프리셋도 검증했다. |
| 13 | Encounter | SD common/rare 절차와 별도 encounter/hazard/discovery 표를 구별. 희귀 굴림의 원문 범위 공백은 그대로 남기고 가짜 결과를 만들지 않는다. |
| 14 | Oracle 중복 | 같은 Core/SD 표는 Registry를 공유. 야영 꿈의 중첩 표와 EPK 9개 지역 d6 표를 기존 데이터의 정규 어댑터로 통합. 표 전체를 생성기마다 복사하지 않는다. |
| 15 | 한국어 | 영어 원문과 별도 저장. 생성·가중치·식별에 번역을 쓰지 않음. 11,780개 helper와 8,336개 사전 항목을 스캔하고 길이 이상 5건 및 최대 확장 15건을 읽었다. AitC 그림 효과에서 반감되는 것은 금전 가치임을 명확히 했다. 전체 문장의 재번역을 했다고 주장하지 않는다. |
| 16 | origin 모델 | source / source-edited / manual, 5개 classification, VERIFIED / PARTIAL / CONFLICT / UNAVAILABLE. 원문 snapshot·entry·roll·procedure·datasetVersion을 별도 보관한다. |
| 17 | 검증 시스템 | source book/page/table/entry/inline-child/procedure/roll 검증, 변조 탐지 fingerprint, 잘못된 범위·분기·원문 대체·무근거 fallback을 실패시키는 테스트. [generation-validation.md](generation-validation.md). |
| 18 | QA Dungeons | 보관한 의미 검토 표본 100개. 별도 전체 무결성 실행에도 100개. |
| 19 | QA Rooms | 의미 검토 표본 Special 400개. 전체 무결성 실행은 Special 400개 + 일반 Room 100개. 스트레스 검사에서는 Special 40,000개. |
| 20 | QA 생물/인물/조우 | 의미 검토 표본 Monster/NPC/Encounter/Character 각각 100개. 별도 전체 실행: TMA 100 + 지역 Monster 100, NPC 100, Encounter 100, Character 112, 프리셋 98, 도시·여행 wrapper 16회. |
| 21 | 어색한 조합 사례 | 앱의 역할 이름+방 문장, 던전 거주자의 존재감을 임의 확정한 문장, 지역 특성과 독립 방 표의 자동 연결, Grift의 특정 d6 결과 누락. 도메인 보고서에 수정 전 원인을 기록했다. |
| 22 | SOURCE weirdness | 반복된 방 결과, 제단의 원문 조건, 기묘한 묘사·소리 조합, 친절한 disposition과 잔혹한 personality처럼 독립 표가 만드는 긴장. 원문을 고치거나 강제로 재굴림하지 않았다. |
| 23 | APP 문제 | 무근거 연결문·잘못된 표 문맥·다른 생성기로의 fallback·잘못된 확률·동일 provenance로 값만 바꾸기·수동 이름 덮어쓰기. 모두 수정하고 해당 회귀를 추가했다. |
| 24 | compact UI | 네 방은 번호별 packet, Dungeon은 큰 제목과 구획, Monster는 statblock, NPC/Encounter는 핵심 결과, Character는 이름/HP/능력/장비. 편집·번역·출처·메모·배치·관리는 펼쳐서 사용한다. 전체 표는 Inspector에서 의도적으로 연다. |
| 25 | 반응형 시각 QA | 360/768/1440/3440에서 Dungeon, Monster, NPC, Encounter, Character, Desk, Search, Oracle 8개 표면의 스크린샷을 캡처. 실제 이미지를 읽어 제목 숨김·빈 캐릭터 열·좁은 유물 설명·과도한 상단 도구·대비를 수정했다. 모든 너비에서 가로 넘침 0. |
| 26 | 저장·마이그레이션 | 실제 기존 8개 캠페인 백업. 3,920개 원래 scalar 값을 비교해 변경 0. Dungeon 15/Room 60/Character 13/Monster 9/NPC 5/Encounter 4 보존. 출처 모델은 additive이고 기존 결과를 생성하지 않는다. |
| 27 | 테스트 | 신규 검증 파일의 63개 테스트 통과. 기존 회귀를 포함한 최종 전체 **509/509**, skip 0. 10,000 mixed passes, 40,000 Special Rooms, TMA/NPC/Encounter 각 10,000회, Oracle 10,000회 검사 포함. |
| 28 | lint/build | oxlint 오류·경고 0, TypeScript client/server 통과, Vite production build 통과, 공개 빌드 privacy 검사 통과. diff whitespace 검사 통과. |
| 29 | 미해결 자료 | 아래 8개 원문 누락/충돌과 교차 출처 인쇄 차이를 각각 명시했다. UNSOURCED 0을 원문의 모든 문제가 해결됐다는 뜻으로 사용하지 않는다. |
| 30 | 커밋 | 보고서와 구현을 함께 로컬 커밋. 정확한 SHA는 전달 응답에 기록한다. push/배포는 하지 않았다. |

## 남겨 둔 원문 문제

1. **HERETIC PDF 37 / 인쇄 35, `heretic.curseCure:12`**: 마지막 문장이 원문 페이지에서 잘려 있다. PARTIAL, 참조 전용. 결말을 보충하지 않았다.
2. **FERETORY The Monster Approaches PDF 2, HP**: 한 번 굴려 두 배로 만드는 본문과 `2d8` 예시의 분포가 다르다. 본문 방식을 사용하고 HP를 CONFLICT로 표시한다.
3. **같은 TMA 방어구**: A/B/C 최고 눈의 동률 처리 규칙이 없다. 가능한 원문 선택지를 PARTIAL로 보여주며 임의 타이브레이커를 만들지 않는다.
4. **Lentil Lice, FER PDF 17 / 인쇄 15**: 옆의 능력치는 경쟁하는 굶주린 농민의 것이다. 이의 능력치로 잘못 배정하지 않는다. d6의 해당 결과는 계속 나온다.
5. **Cursed Trout, FER PDF 20 / 인쇄 18**: 정체성과 저주는 있지만 전투 능력치가 없다. 비워 둔다.
6. **Carcasswan, FER PDF 20 / 인쇄 18**: 단독/한 쌍의 능력치가 서로 다르다. 조건 없는 기본 record에 하나를 임의 선택하지 않는다. 원문의 두 variant는 보존한다.
7. **Rotten Nurse, HER PDF 64 / 인쇄 62**: 일반 전투 능력치가 제공되지 않고 보통의 피해도 적용되지 않는다. 실제 특수 규칙과 빈 일반 능력치를 보존한다.
8. **SD Rare stocking PDF 19 / 인쇄 17**: d8+DR이 인쇄된 1–20 범위를 벗어나는 경우의 처리 규칙이 없다. 무작위 대체나 clamp로 숨기지 않는다.

추가로 Depths가 인용한 판본 쪽수와 공급된 Bare Bones/수록본의 쪽수가 다른 교차 참조는 원래 routing 인용과 확인한 primary 페이지를 함께 보여준다. Fogbound Skeleton 및 Core Zombie/Prowler 등의 alias 설명은 원문 인용을 몰래 고치는 것이 아니다. 전부 검증된 source record로 해소되는 경로인지 별도 회귀로 확인했다.

## 실제 브라우저 수용 검사

개인 데이터와 분리된 Chromium 저장소에 **INTEGRITY QA · isolated** 캠페인을 UI로 만들었다. 현재 공급된 private bundle을 로컬 개발 요청에 연결했으며 실제 사용자 캠페인에서 재굴림하지 않았다.

- Sarkash Dungeon과 네 Special Rooms 생성·저장. 기본 보기에서 구성 요소를 확인했다.
- Room 1 source → Core 표 전체 → 닫기를 사용해 Dungeon 문맥이 유지되는 것을 확인했다.
- Room 1 한 항목을 재굴림하고 나머지 세 방을 저장 JSON으로 비교: 동일.
- Room 2에 실제 조건부 항목이 나오는 표본을 선택한 뒤 기본 구성 요소를 수동 편집했다. 조건부 구성 요소만 재굴림: 수동 값과 provenance가 동일. SOURCE에는 원문 snapshot과 Edited manually가 표시됨.
- 지역 Monster 검색·생성 후 primary/routing 책·쪽수를 확인했다. 별도로 EPK Dredgehog, NPC, Encounter, Character를 UI에서 만들고 source를 열고 저장했다.
- Action+Theme, Reaction, Broken, Corpse 검색·실행, 이전 참조, 재굴림, Recent, Pin, Copy 실행. clipboard에서 짧은 결과가 실제로 읽혔다.
- reload 후 네 Room, 수동 origin, 저장한 네 종류의 객체, Reaction pin과 최근 참조 유지. 브라우저 pageerror 0.
- 실제 production build에서 source API를 503으로 차단했다. 저장한 Dungeon/Rooms/Monster의 텍스트·능력치는 읽혔고 생성은 disabled였다. 시작 시 만든 정확한 백업은 입력 save와 byte 단위로 같았다. 공급 bundle을 다시 연결하자 Oracle 굴림·생성 사용이 복구되고 기존 능력치는 동일했다.

상세 체크 목록과 로컬 증거 위치: [browser-acceptance.json](browser-acceptance.json).

| 자주 하는 동작 | 해당 문맥에 도착한 뒤 필요한 상호작용 |
| --- | --- |
| 검색한 Reaction/지역 Monster/Action+Theme 실행 | 검색어 입력 뒤 첫 결과의 ROLL/GENERATE/RUN 1회 |
| Pin에서 굴림 | 1회 |
| 재굴림 / Copy / 이전 참조 | 각각 1회 |
| Recent에서 다시 실행 | Recent 1회 + 결과 실행 1회 |
| 접힌 Room의 출처 | Room 펼치기 1회 + SOURCE 1회 |
| 편집 중인 Room의 독립 항목 재굴림 | 1회; 수동 수정한 바로 그 항목을 교체할 때만 확인 |
| Room에서 연결된 표 보기 | 출처 안에서 표 열기 1회, 닫기 1회로 즉시 복귀 |

참조 동작은 Campaign 없이 사용할 수 있다. 수용 검사를 위해 조건부 Room 표본을 찾은 반복 굴림은 일반 플레이 탐색 클릭 수에 포함하지 않았다. Campaign/Dungeon CRUD, stable IDs, placement, duplication, JSON import/export, migration, private-cache 실패·복구는 기존 회귀 테스트와 신규 출처 회귀를 함께 통과했다. 모든 CRUD 변형을 브라우저에서 수작업으로 반복했다고 주장하지 않는다.

## 최종 의미·시각 판단

400개 Special Rooms 중 별도 시드로 뽑은 25개를 추가로 읽었다. 24개는 독립된 기본 조각이고 한 개는 원문 선반 항목과 그 내용의 조건부 쌍이었다. 반복된 원문 결과가 있었지만 의미를 잇는 앱 문장, 자동 분위기 설명, 관계를 만들어내는 연결구는 없었다. 한 단어 결과도 출처의 정상적인 결과로 남겼다.

시각 검사에서는 원문 조각을 편집 폼 밖에 표시하고 네 번호를 분명하게 나눴다. 긴 원문은 MORE에서 읽을 수 있다. Source는 기본으로 닫혀 있고, 모바일에서도 hover 없이 탭으로 열 수 있다. 읽기 모드의 빈 캐릭터 열과 숨겨진 Monster heading을 없앴다. 3440에서는 본문 폭을 제한했고, 360에서는 방 구성 요소·편집 버튼·출처 표가 세로로 읽히는지 확인했다. 검색창 캡처는 viewport 변경 직후의 중간 프레임 대신 실제 대화상자 경계가 안정된 뒤 확인했다.

앱은 이제 방의 이야기를 대신 쓰는 대신, **실제 표에서 나온 조각과 판정 결과를 제공하며 그 출처를 필요할 때 펼쳐 볼 수 있는 도구**로 작동한다. 원문의 미제공 정보와 모순은 위에 적은 그대로 남아 있다.
