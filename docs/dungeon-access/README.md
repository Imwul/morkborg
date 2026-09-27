# Dungeon Procedure Access Calibration

기준 커밋: `fe2498253ee6c494d2c4e43ac449a5647fe509a2`.

이번 변경은 **Common/Rare 준비 규칙 → 기존 Encounter Prep**의 접근만 보완한다. 방 내용에서 플레이어의 다음 행동을 추론하지 않는다. 새 action 패널, 저장 필드, 진행 상태는 없다.

## 1. Before audit

빌드한 Vite production preview에서 실제 DOM을 조작했다. 로컬 소유의 룰북 bundle을 기존 `/api/rulebook-data` 응답으로 제공했다. 화면·registry·굴림 엔진은 실제 앱이다. RNG에 고정값을 주어 동일한 원문 행을 재현했으며 결과나 내부 앱 상태를 주입하지 않았다. 새 기능 코드는 감사와 전체 baseline test 완료 후 수정했다.

[변경 전 기록](before-audit.json)의 세 경로:

- **A — 빈방:** 다음 방으로 → 탐색 Weak → 기존 일반 방 묘사 → Back → 탐색 규칙의 Related Room Contents → #12 Looks empty → 플레이어가 출구 선택 → 지도. 수색하지 않았다.
- **B — 조우:** 탐색 규칙 → Room Contents #6 Common → 기존 결과 링크로 Common 준비 규칙. 플레이어가 **지역별 후보 하나를 준비하기로 명시적으로 결정**했다. 규칙에는 Stock Creatures 직접 접근은 있지만 Encounter Prep 진입점은 없어 `조우 후보` 검색 → Common/Sarkash 후보 Roll → Nodh → 기존 Reaction → 생물 원문 → Back → 지도. 전투를 시작하지 않았다.
- **C — 물건이 있는 방:** Room Contents #2 remains. 결과가 아무 행동도 추가하지 않는 것을 확인한 뒤, 플레이어가 독립적으로 기존 **물건 찾기**를 선택했다. Searching 판정 → 기존 시체 약탈 링크 → Back → 기존 Strong 표의 보물 링크 → Back. 이후 플레이어가 지도의 함정을 직접 선택해 굴리고 지도로 돌아왔다.

경로는 검증 fixture이지 필수 플레이 순서가 아니다. 키보드 입력·스크롤은 클릭 수에 넣지 않고, 클릭/탭과 browser Back을 별도로 센다. 참조 선택 수는 명시적 링크 선택만 세며 Back은 제외한다. 준비 규칙을 다시 여는 횟수는 검색의 반복과 분리했다.

## 2. Search reason classification

| 이유 | Before | After | 설명 |
|---|---:|---:|---|
| A Knowledge | 0 | 0 | 이미 사용할 도구를 아는 플레이어 선택으로 고정한 fixture |
| B Location | 0 | 0 | 이름만 알고 탐색하는 별도 상황은 이번 측정에 없음 |
| C Access | 1 | 0 | Common 준비 규칙에서 지역별 Encounter Prep 열기 |
| D Interpretation | 0 | 0 | 수색을 독립적으로 선택했으나 기존 버튼으로 접근하여 검색하지 않음 |

이전 pass의 5회 검색을 개선 대상으로 그대로 사용하지 않았다. Searching Strong은 기존 ‘물건 찾기’와 Related로, Room Contents는 기존 탐색 규칙으로 접근할 수 있다. A/D를 자동화하는 기능은 만들지 않았다.

## 3. Existing action surface

[전체 ID·action·canonicalIds·relatedIds·출처·현재 진입점 inventory](inventory.json).

| 기존 표면 | 실제 대상 | Search 필요 여부 |
|---|---|---|
| 다음 방으로 | `rule:sd.dungeonCrawling` | 직접 열림 |
| Weak/Miss의 기존 방 묘사 링크 | `procedure:sd.room-description` → `sd.room.adjective`, `sd.room.type` | 직접 열림. 내용물까지 자동 생성하지 않음 |
| 탐색 규칙의 연결 표/Related | `oracle:sd.room.contents`, `oracle:sd.room.exits` | 직접 열림. 방 묘사에서 Back 또는 다시 ‘다음 방으로’ |
| 물건 찾기 | `rule:sd.search-move` → `sd.search.strong`, `sd.search.weak`, `sd.usefulItems` | 직접 판정 및 표 접근 |
| 숨 돌리기·야영 / 도망 | `rule:sd.camping-move`, `rule:sd.flee-combat` | 직접 열림 |
| 지도 16개 사물 | RECLVSE 입구·상태·흔적·냄새·건축·출구·내용·방 형태·발견·전리품·빛·유해·소리, Core 함정, RECLVSE 통로 | 직접 열림. SD Room Contents와 별개 |
| 지도 밖의 맥락 8개 | 기원·목적·주제·상태·거주자·동기·Mythic 묘사어·시체 약탈 | 직접 선택 가능. 결과에서 추론하여 나타나는 링크가 아님 |
| Room Contents의 기존 결과 관계 | Common → `rule:sd.stockCommon`; Rare → `rule:sd.stockRare`; NPC/보물 행의 명시적 대상 | 결과의 기존 exact metadata 사용 |
| Common/Rare 준비 규칙 | Stock Creatures 및 Rare의 외형/특징 표 | 원문 준비 방식은 이미 직접 가능. **지역별 후보 생성기**로 가는 역방향 접근만 누락 |
| 지역 Reference의 기존 Quick Tools | `procedure:workbench.stock-room`, 지역별 Monsters d6 등 | 지역 페이지를 먼저 찾으면 가능. 현재 Dungeon 화면의 직접 진입점은 아님 |
| Dungeon Preparation 생성기 | `procedure:sd.dungeon-preparation` | 생성기/Reference 경로. 현재 방에서 자동 실행되는 기능 아님 |
| Pins / Recent | 이전에 방문한 canonical Reference | 재방문 대안. 첫 방문 전에는 없고 공간 탐색에서 누르면 Reference Desk로 이동 |
| Workbench | 사용자가 펼쳐 놓은 참조 | 공간 탐색 안에서 다시 열 수 있음. 미리 추가해야 함 |

`REFERENCE_SHELVES.dungeon`, `DUNGEON_REFERENCE_TOPICS`, 옛 `ContextReferences`/저장 던전 화면의 ID는 코드에 남아 있다. 이를 현재 Spatial 화면에 실제 렌더되는 메뉴로 잘못 계산하지 않았다. `DungeonCrawlWorkspace`도 독립적인 방 진행 엔진이 아니라 현재 ReferenceDesk 호환 진입점이다.

Pins/Recent/Workbench는 최종 브라우저 검증에서 각각 같은 후보 참조를 실제로 다시 열었다. 이 보조 검증은 세 방의 클릭 비교에 포함하지 않는다. 기존 기능이므로 첫 방문의 C형 공백을 없애는 대안으로 계산하지 않았다.

## 4. Structured evidence

기존 `procedure:workbench.stock-room`은 이미 다음을 보존한다.

- action: `{ kind: 'procedure', procedureId: 'workbench.stock-room' }`
- relatedIds: `rule:sd.stockCommon`, `rule:sd.stockRare`
- canonicalIds: `sd.stockCreatures`, `reclvse.roomEncounter`
- 기존 실행기의 Common/지역, Rare, Room 분기와 각 source/provenance.

선택한 Reference가 사용 가능한 **rule**이며 위 도구의 기존 relatedIds에 정확히 들어 있을 때만 같은 도구를 역방향으로 열 수 있게 했다. 이름·tag·번역·결과 본문·책 일치로 찾지 않는다. 화면의 일반 ‘관련 참조’이며 새 USES/USED BY 혹은 source-authored 절차라는 라벨을 붙이지 않는다.

## 5. Implemented calibration

- `referenceRelationships.ts`: 기존 관련 참조의 파생 목록에 준비 도구의 역방향 접근 추가. 표시 대상은 Common/Rare 두 규칙뿐이다. canonical 관계 저장소는 수정하지 않는다.
- `ReferenceWorkbench.tsx`: Spatial의 행동/Related도 같은 임시 view의 초점 원점으로 포함. 참조 ID별 문서를 분리해 native details 상태가 다른 문서에 남지 않도록 수정. 결과 identity가 동일할 때만 저장한 view를 복원하는 기존 제한 유지.
- `reference-surface.css`: 펼친 편의 메뉴가 너비 안에서 줄바꿈하고, 닫힌 편의/결과 메뉴의 버튼이 가로 overflow를 만들지 않도록 수정.
- 테스트·감사 스크립트와 이 보고서 추가. 기존 combat 브라우저 테스트는 Apply 다음 프레임의 초점 복원을 기다린 뒤 다음 값을 입력하도록 안정화했다. 전투 코드는 변경하지 않았다.

새 패널/모달/행동 메뉴/영구 schema/마이그레이션/원문 수정: **0**. 참조 제목 클릭은 open, 옆의 기존 Roll은 별도 사용자 동작이다.

## 6. Rejected contexts

- **Searching shortcut:** 기존 ‘물건 찾기’가 정확한 도구를 이미 연다. 추가하지 않음.
- **Room Contents shortcut:** 탐색 규칙의 기존 연결 표로 접근 가능. RECLVSE 지도 내용을 SD로 바꾸거나 중복 링크를 더하지 않음.
- **remains/bones → corpse**, **empty → search**, **danger → trap**, **door → break/pick**: 추론 근거가 없으므로 추가하지 않음.
- **Common 결과 → 자동 후보/전투:** 결과는 기존 준비 규칙만 연결한다. 새 접근은 그 규칙을 사용자가 열었을 때 기존 Related 안에서 보이며, 후보 생성과 전투 추가는 별도 선택이다.
- **Special dungeon, 새로운 행, 새 표, Dungeon 단계/완료 상태:** 이번 접근 개선과 무관하여 추가하지 않음.

## 7. Before / After friction

네 viewport에서 동일한 수치다. [Before](before-audit.json) / [After](after-audit.json).

| 지표 | Before | After |
|---|---:|---:|
| explicit Search | 1 | 0 |
| repeated Search | 0 | 0 |
| 클릭/탭 | 35 | 34 |
| browser Back | 5 | 5 |
| 명시적 Reference 선택 | 17 | 17 |
| Dungeon workspace 이탈 | 1 | 0 |
| Reference Desk 열기 | 1 | 0 |
| 같은 탐색 규칙 재방문 | 2 | 2 |

절감은 **Common 규칙 → Encounter Prep** 한 곳이다. Rare는 동일한 기존 선언 관계를 사용하며 단위 테스트로 검증했지만, Rare의 플레이 클릭 감소를 별도 측정했다고 주장하지 않는다. 전체 Dungeon navigation이나 초보자의 규칙 발견이 크게 개선되었다고 일반화하지 않는다.

## 8. False-positive audit

[검사 결과](false-positive.json), `tests/dungeon-procedure-access.test.ts`.

- 993개 Reference 전수 검사: 역방향 접근은 Common/Rare **2개**, 나머지 **991개에는 추가되지 않음**.
- 기존 명시적 relatedIds를 제거하면 표시되지 않음.
- 제목·설명을 바꾸어도 ID가 같으면 동일하게 동작. 유사 제목의 다른 규칙에는 추가되지 않음.
- missing/unavailable/잘못된 action 및 procedure identity는 제외.
- 기존 동일 대상 관계가 있으면 1개만 남김. 기존 result relationship 제외 필터도 그대로 사용.
- 다른 참조로 이동하면 이전 접근이 남지 않음.
- 유해·뼈·예상 밖 사건·위험한 환경·빈방·문·통로·출구·수동 함정·보물·시체 fixture에서 새 조우 준비/다음 행동 추론 없음.
- 기존 시체/보물 follow-up, creature SOURCE/Reaction/Morale는 유지.

이 유한한 fixture 결과를 일반적인 “정확도 100%”로 표현하지 않는다.

## 9. Reference round-trip

실제 브라우저에서 확인:

- Common 규칙 → Related 후보 → Back: 원문/펼침/스크롤/원래 Related 버튼 초점 보존.
- 기존 ‘물건 찾기’ → Back: 원래 행동 버튼 초점 복원.
- canonical 생물 SOURCE → Back: 결과·선택한 설정·details·스크롤·링크 초점 보존.
- 다른 참조를 읽는 동안 Workbench에서 **명시적으로 다시 굴린** 결과는 Back 시 새 SOURCE를 사용. 이전 reading의 details/초점을 복원하지 않음.
- 직접 접근 중 RNG 호출 0, 자동 전투 0. 세 방 경로 동안 기존 combat session 및 notebook sentinel 불변.

## 10. Tests

| 검사 | Before | Final |
|---|---|---|
| 전체 단위/통합 suite | 1,180 pass / 0 fail / 0 skip | 1,192 pass / 0 fail / 0 skip |
| 전용 calibration tests | — | 12 |
| build | pass | pass |
| lint | — | pass |
| public/private build boundary | pass | pass |

기존 500 kB bundle 경고는 남아 있다. 오류는 아니다. 원래 iCloud 경로에서 파일 hydration이 멈춰 같은 baseline SHA의 로컬 clone에서 검증했다. 첫 clone 실행에서 누락된 ignored 룰북 fixture를 복구한 뒤, baseline 전체 suite가 0 skip으로 끝난 것을 확인하고 구현했다.

재현: `npm test`, `npm run build`, `npm run lint`; production preview에 `scripts/check-dungeon-access-browser.mjs`, `scripts/check-dungeon-context-browser.mjs`, `scripts/check-combat-context-browser.mjs` 실행. 접근 스크립트의 `AUDIT_MODE=before`는 baseline checkout에서 사용한다. `WIDTHS`와 `REFERENCE_URL`로 viewport/서버를 지정할 수 있다.

## 11. Browser acceptance

| viewport | 입력 | 접근·왕복·overflow·자동 동작·runtime |
|---|---|---|
| 360×1000 | touch/tap + Enter + Back | pass |
| 768×1000 | mouse + Enter + Back | pass |
| 1440×1000 | mouse + Enter + Back | pass |
| 3440×1000 | mouse + Enter + Back | pass |

관련 참조의 실제 target 높이 44px 이상, 키보드 focus outline 확인. 새 패널 없이 기존 Related 행 하나만 추가된다. 닫힌 메뉴를 포함하여 문서의 가로 overflow 없음. 지도와 상단 분류의 의도적인 내부 가로 스크롤은 유지한다. 실제 screen reader 소프트웨어를 사용한 검사는 하지 않았다.

스크린샷: [360](after-360.png) · [768](after-768.png) · [1440](after-1440.png) · [3440](after-3440.png).

[생물/던전 회귀](creature-regression.json): 4개 크기. [전투 회귀](combat-regression.json): 360/1440. 전투의 Preview → Apply, 수동 피해, Omen/치명타·실수 안내, equipment 변경 시 preview 무효화, Undo/Redo, Reaction/Morale 및 Add to combat의 기존 선택 동작을 확인했다.

## 12. Integrity

이번 감사의 로컬 canonical bundle 기준. [Before](integrity-before.json) / [After](integrity-after.json).

| 항목 | Before | After |
|---|---:|---:|
| references | 993 | 993 |
| oracle/table | 546 | 546 |
| procedures | 60 | 60 |
| creatures | 89 | 89 |
| creature references | 95 | 95 |
| source rows | 12,310 | 12,310 |
| canonical USES | 88 | 88 |
| canonical USED BY | 88 | 88 |
| relationship evidence records | 149 | 149 |
| distinct declared relatedId pairs | 3,139 | 3,139 |

canonical graph의 reverse 포함 총 176개는 그대로다. 화면에만 역방향 접근 2개가 파생된다.

- registry SHA256: `dcea5c3c78721c2db2d194f885f16a97df62d0d7c3f5a60a0d369794e2c982d1`
- canonical relationship index SHA256: `2849767c63176be3f67f2792c47529824899d51dd64c6343846f6f7c284a409c`
- declared relatedIds SHA256: `4a4121033f9a9ad05a5a4d05b226f6d721cf94a3f2b3b9591e3fbe08f578d60a`

Before의 library/oracles hash는 store에 설치된 parsed 값이며 After의 `parsedLibrary`/`parsedOracles`와 동일하다. After에는 원본 bundle hash도 별도로 남겼다. 현재 체크아웃의 암호화 배포 snapshot을 읽기 전용으로 해독한 [별도 검사](published-snapshot-integrity.json)도 첨부한다. 배포 서비스의 다른 사용자 cache/개인 수정 자료까지 같은 수라고 주장하지 않는다.

`src/data`, `src/generators`, `src/storage`, canonical source asset, server 및 마이그레이션에는 변경이 없다. source/row/dice/procedure 의미 수정 0, migration 0, campaign schema 변경 0.

## 13. Remaining limitations

플레이어가 무슨 규칙이 필요한지 모르거나(A), 묘사를 해석한 뒤 새로운 행동을 정하는 상황(D)은 해결하지 않는다. 임의의 룰북/특수한 절차는 여전히 Search/Browse가 필요하다. Room Contents와 출구를 다시 열려면 기존 탐색 규칙으로 돌아가야 하고, Related 아래까지 스크롤할 수 있다. 이 비용을 없애려고 별도 도구 패널을 만들지 않았다.

Pins/Recent는 이전 방문이 필요하고 Workbench는 사용자가 펼쳐 놓아야 한다. 따라서 첫 후보 접근의 대체는 아니지만 재방문에는 유효하다. Common/Rare 여섯 칸 준비·선택의 기존 의미를 후보 한 번 생성과 동일하게 취급하지 않으며, 후보 열기는 방 채우기나 전투 시작이 아니다.

검증된 성과는 **이미 선택한 조우 후보 준비 도구를 찾기 위한 검색 1회 제거**다. fiction을 해석하여 새 행동을 결정하는 경우는 추가하지 않았다.
