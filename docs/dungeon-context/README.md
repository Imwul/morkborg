# Dungeon Contextual Intelligence Calibration

Baseline: `0f5d6c5fc68df9cbdd3211c3de2248b0349af206` (Combat pass 이후).
검증일: 2026-09-27. 이 문서가 포함된 커밋이 최종 구현입니다.

## 1. Before audit

수정 전에 전체 `npm test`: **1,166 통과 / 실패·건너뜀 0**. 이어 Chromium에서 실제 UI를 조작했습니다. 기존 소스 번들의 전송만 로컬 fixture로 제공하고, 비교 가능한 방을 재현하려고 주사위 난수만 고정했습니다. 결과를 직접 주입하거나 참조 실행을 우회하지 않았습니다. 제품의 RNG는 변경하지 않았습니다. baseline 측정은 1440×1000입니다.

실제 경로:

1. 공간 탐색 → Dungeon → 다음 방으로 → 탐색 Weak → 일반 방 묘사 생성.
2. Room Contents #6 Common → 기존 Common Encounters 규칙 링크.
3. `조우 후보` 검색 → Encounter Prep Common/Sarkash → Nodh ×1.
4. 기존 Reaction 링크 → 굴림 → Back. Reaction/Morale는 이미 결과 아래에 있었습니다.
5. `Nodh` 검색 → `creature:core:61:nodh` → Back. 조우 결과에 능력치는 있지만 정식 생물 참조로 가는 직접 링크가 없었습니다.
6. 두 번째 방: `Room Contents` 검색 → #2 Remains of something. 무엇의 잔해인지는 플레이어 해석입니다.
7. `Searching Strong` 검색 → #1의 기존 Corpse Plundering 링크 → 굴림 → Back → #4의 기존 Occult Treasures 링크 → 굴림 → Back.
8. Dungeon 지도 복귀 → 함정 사물 → Core Traps 굴림 → 출구 사물 → Exit Type 굴림.
9. 세 번째 방: `Room Contents` 검색 → #12 Looks empty…?
10. `조우 후보` 검색 → 두 번째 Nodh 조우 → `Nodh` 검색 → 정식 생물 참조 → Back.

검색 **7회**, 같은 검색어 반복 **3회**, 클릭 **39회**, browser Back **6회**, 공간 탐색 화면을 검색 때문에 벗어난 횟수 **2회**. 클릭에는 검색창 포커스와 검색 결과 선택을 각각 포함하며, 타이핑과 Back은 따로 셉니다. 일반 참조를 오른쪽 리더에 여는 행위와 공간 탐색 탭에서 벗어나는 행위는 구분했습니다. 모든 열린 참조와 순서는 [before-audit.json](before-audit.json)에 있습니다.

시체·보물은 이미 명시적인 결과 링크가 해결합니다. 지도에도 함정·출구 및 수색을 위한 진입점이 있습니다. 이곳에는 새 패널을 겹치지 않았습니다.

## 2. Existing structured evidence

- `ReferenceReading.oracle.rolls`: `oracleId`, `entryId`, 숫자 굴림, 원문 metadata. `sourceRefs`도 table/row identity를 보존합니다.
- 기존 `rowResultRelationships` / `readingResultRelationships`: followUp, SUBTABLE, LOOKUP, 출처 검증된 정확한 row 정책. 의미 분석 없이 이미 결과 아래에 나타납니다.
- `rollRegionalTableReference`: 기존 정식 지역 표 resolver가 canonical `preset`과 `sourceChain`을 반환합니다. `workbench.stock-room`의 Common도 이 경로를 사용합니다. 기존 resolver의 출처 라우팅은 변경하지 않았습니다.
- `ReferenceReading.blocks.kind === 'creature'`: **표현 종류**일 뿐 정식 생물 ID를 보증하지 않습니다. 이것이나 결과의 생물 이름만으로 새 참조를 만들지 않았습니다.
- `DungeonRoom.components` / `generation` / `fieldProvenance`: 저장·이전 생성 데이터에는 구조화된 provenance가 있습니다. 현재 `DungeonCrawlWorkspace`는 Reference Desk를 공유하는 진입점입니다. 현재 방의 완료·진행 상태를 도입하지 않았습니다.
- 현재 도구 입력/판정은 `usePlayToolState`, 최근 리더 결과는 기존 `ReferenceSession`에 있습니다. 새 던전 이벤트 모델·로그·캠페인 스키마는 필요하지 않았습니다.

## 3. Implemented calibration contexts

새 필드는 선택적 `ReferenceReading.creatureReferenceId` 하나입니다. **이미 확정된 canonical creature 객체**에서 ID를 보존합니다. UI는 이 필드만 읽고 registry에서 유효성/사용 가능 여부를 확인합니다. 과거 snapshot은 이 필드가 없어도 그대로 표시됩니다.

정확한 표시 규칙:

| 구조화된 trigger | 참조 | 증거 |
| --- | --- | --- |
| 기존 regional resolver가 확정한 `preset` → 보존한 `creatureReferenceId` | 그 ID와 동일한 생물 참조 | SOURCE · 기존 canonical resolver |
| 보존한 생물 참조의 `relatedIds`에 해당 ID가 실제 존재 | `oracle:core.reaction` | RELATED · 기존 relatedIds |
| 보존한 생물 참조의 `relatedIds`에 해당 ID가 실제 존재 | `rule:core.reaction-morale` | RELATED · 기존 relatedIds |

현재 참조 자신, 사용할 수 없는 참조, 이미 결과 아래 표시된 참조는 제외합니다. 중복 제거 후 최대 3개. 현재 조우에서는 Reaction/Morale가 기존 UI에 있어서 새 영역에는 **생물 원문 1개만** 나타납니다. 규칙 shortcut은 **0개**, 추가 canonical edge도 **0개**입니다. 살아 있는 생물에서 시체/전리품 상태를 유추하지 않습니다.

직접 생물 reader도 기존 `action.creatureId`로 확인한 동일 ID를 보존합니다. 자기 자신을 다시 열라는 링크는 숨깁니다. 가능한 직접 생물 identity 95개와 정확한 기존 RELATED 대상은 [creature-identities.json](creature-identities.json)에 전부 명시했습니다. 출력 문자열 비교나 정규식으로 생물 ID를 찾는 코드는 추가하지 않았습니다.

지역 표 8개의 d6 **48행**을 전수 실행했습니다. **42행 → 26개 정식 생물**, 미해결 **6행**은 새 링크가 없습니다. 기존 source resolver 결과를 기록한 전체 매핑은 다음과 같습니다. 각 연결된 SOURCE의 RELATED 대상은 위 두 ID만이며, 실제 `relatedIds`가 존재할 때만 후보입니다. 행별 증거·대상은 [mappings.json](mappings.json)에도 있습니다.

| 구조화된 원문 행 | d6 | SOURCE 대상 |
| --- | --- | --- |
| `depths.region.tveland.monsters:1-1` | 1 | `creature:core:58:bent` |
| `depths.region.tveland.monsters:2-2` | 2 | `creature:core:58:seth` |
| `depths.region.tveland.monsters:3-3` | 3 | `creature:feretory:feretory.epk.flayed-vultures` |
| `depths.region.tveland.monsters:4-4` | 4 | `creature:feretory:feretory.epk.antideer` |
| `depths.region.tveland.monsters:5-5` | 5 | `creature:core-full:core-full.rotblack.mongrel` |
| `depths.region.tveland.monsters:6-6` | 6 | `creature:feretory:feretory.epk.feral-horses` |
| `depths.region.sarkash.monsters:1-1` | 1 | `creature:feretory:feretory.epk.skelelk` |
| `depths.region.sarkash.monsters:2-2` | 2 | `creature:core:61:nodh` |
| `depths.region.sarkash.monsters:3-3` | 3 | `creature:feretory:feretory.epk.mulch-squirrels` |
| `depths.region.sarkash.monsters:4-4` | 4 | `creature:feretory:feretory.epk.carrion-owls` |
| `depths.region.sarkash.monsters:5-5` | 5 | `creature:core-full:core-full.rotblack.mongrel` |
| `depths.region.sarkash.monsters:6-6` | 6 | `creature:core:core.outcast.prowler` |
| `depths.region.graven_tosk.monsters:1-1` | 1 | `creature:heretic:23:rotted-skeleton` |
| `depths.region.graven_tosk.monsters:2-2` | 2 | `creature:core:61:nodh` |
| `depths.region.graven_tosk.monsters:3-3` | 3 | `creature:core:core.outcast.pale-one` |
| `depths.region.graven_tosk.monsters:4-4` | 4 | `creature:feretory:feretory.epk.giant-skull-moth` |
| `depths.region.graven_tosk.monsters:5-5` | 5 | `creature:heretic:25:fogbound-skeleton` |
| `depths.region.graven_tosk.monsters:6-6` | 6 | `creature:core:60:belze` |
| `depths.region.kergus.monsters:1-1` | 1 | `creature:core:58:seth` |
| `depths.region.kergus.monsters:2-2` | 2 | `creature:core-full:core-full.rotblack.mongrel` |
| `depths.region.kergus.monsters:3-3` | 3 | `creature:heretic:25:fogbound-skeleton` |
| `depths.region.kergus.monsters:4-4` | 4 | `creature:core-full:core-full.rotblack.dusk-gnoum` |
| `depths.region.kergus.monsters:5-5` | 5 | `creature:feretory:feretory.epk.blubber-gulls` |
| `depths.region.kergus.monsters:6-6` | 6 | `creature:core:core.outcast.earthbound` |
| `depths.region.wastland.monsters:1-1` | 1 | `creature:core:58:bent` |
| `depths.region.wastland.monsters:2-2` | 2 | `creature:core:58:bent` |
| `depths.region.wastland.monsters:3-3` | 3 | `creature:core:62:aland` |
| `depths.region.wastland.monsters:4-4` | 4 | `creature:core-full:core-full.rotblack.guards-sharpened-teeth` |
| `depths.region.wastland.monsters:5-5` | 5 | `creature:core-full:core-full.rotblack.mongrel` |
| `depths.region.wastland.monsters:6-6` | 6 | `creature:core:58:seth` |
| `depths.region.valley_unfortunate_undead.monsters:1-1` | 1 | `creature:feretory:feretory.epk.grubstopper` |
| `depths.region.valley_unfortunate_undead.monsters:2-2` | 2 | `creature:feretory:feretory.epk.gravelings` |
| `depths.region.valley_unfortunate_undead.monsters:3-3` | 3 | `creature:core:core.outcast.prowler` |
| `depths.region.valley_unfortunate_undead.monsters:4-4` | 4 | `creature:feretory:feretory.epk.phantom-rats` |
| `depths.region.valley_unfortunate_undead.monsters:5-5` | 5 | `creature:heretic:25:fogbound-skeleton` |
| `depths.region.valley_unfortunate_undead.monsters:6-6` | 6 | `creature:heretic:23:rotted-skeleton` |
| `depths.region.lake_onda.monsters:1-1` | 1 | 연결 없음 · 기존 resolver도 미해결 |
| `depths.region.lake_onda.monsters:2-2` | 2 | 연결 없음 · 기존 resolver도 미해결 |
| `depths.region.lake_onda.monsters:3-3` | 3 | `creature:feretory:feretory.epk.rusty-bass` |
| `depths.region.lake_onda.monsters:4-4` | 4 | `creature:feretory:feretory.epk.sursturgeon` |
| `depths.region.lake_onda.monsters:5-5` | 5 | `creature:core:core.outcast.earthbound` |
| `depths.region.lake_onda.monsters:6-6` | 6 | 연결 없음 · 기존 resolver도 미해결 |
| `depths.region.bergen_chrypt.monsters:1-1` | 1 | `creature:core:62:aland` |
| `depths.region.bergen_chrypt.monsters:2-2` | 2 | 연결 없음 · 기존 resolver도 미해결 |
| `depths.region.bergen_chrypt.monsters:3-3` | 3 | `creature:core:60:belze` |
| `depths.region.bergen_chrypt.monsters:4-4` | 4 | 연결 없음 · 기존 resolver도 미해결 |
| `depths.region.bergen_chrypt.monsters:5-5` | 5 | 연결 없음 · 기존 resolver도 미해결 |
| `depths.region.bergen_chrypt.monsters:6-6` | 6 | `creature:core:core.outcast.earthbound` |

기존 기능으로 해결되는 정확한 수색 연결도 회귀 확인했습니다:

- `sd.search.strong:1-1` → `oracle:core.corpsePlundering`, `oracle:feretory.itemsTrinkets`: 기존 검증된 결과 정책, 플레이어 선택.
- `sd.search.weak:2-2` → `oracle:core.corpsePlundering`: 기존 검증된 결과 정책.
- `sd.search.strong:4-4` → `oracle:core.treasures`, `oracle:feretory.tenebrousReliquary`: 기존 검증된 결과 정책, 플레이어 선택.
- `sd.room.contents:6-7` → `rule:sd.stockCommon`: 기존 followUp.procedure.
- 이미 굴린 `core.treasures` 결과에는 같은 표를 미해결 후속 굴림처럼 다시 제안하지 않습니다.

## 4. Rejected candidate contexts

- `sd.room.contents:2-2` 잔해: 구조물/물건/생물이 모두 가능. 시체 확정 근거가 없어 시체 수색 제안 안 함.
- `reclvse.dressing:2-2` 뼈: 결과 문구만 존재. 사람의 시체·전리품·사망 사건으로 분류하지 않음.
- `sd.room.contents:3-3` 예상 밖 사건, `:10-10` 위험 환경: 감지·발동·해제·피해의 정식 처리 대상을 지정하는 metadata 없음. 새 함정 절차 없음.
- `core.traps`를 사용자가 직접 선택해서 굴린 결과: 표 자체를 이미 읽는 중. 함정 발동/피해 자동화나 중복 참조 추가 안 함.
- `reclvse.exitType`, 문/통로: 구체적 문 상태나 행동 판정 대상의 새로운 명시적 관계를 찾지 못함. 잠겼다거나 부숴야 한다고 판단하지 않음.
- `sd.room.contents:12-12` 빈 방: 추가 처리 없음.
- SD Stock Creatures의 이름/페이지 문구와 임의 Rare/RECLVSE encounter prose: 이번 SOURCE 경로의 정식 resolver 결과가 아니므로 이름·페이지를 새로 매칭하지 않음.
- 같은 책, dungeon 태그, 지도상 이웃이라는 이유로 관계를 추가하지 않음.

## 5. Before / After friction

동일한 입력과 동일한 선택 경로를 반복했습니다. 추가 왕복/접근성 검사는 이 비교 수치에서 제외했습니다.

| 측정 | Before | After |
| --- | ---: | ---: |
| 명시적 검색 | 7 | 5 |
| 반복 검색 | 3 | 2 |
| 클릭 (타이핑/Back 제외) | 39 | 37 |
| browser Back | 6 | 6 |
| 검색 때문에 공간 탐색 탭을 벗어남 | 2 | 2 |
| 두 Nodh 원문 접근의 클릭 | 4 | 2 |
| Nodh 이름 입력 | 2 | 0 |

효과는 **정식 생물 원문 검색 2회 감소**입니다. 전체 던전 참조 탐색이나 왕복 횟수가 크게 개선됐다고 주장하지 않습니다. `조우 후보`, `Room Contents`, `Searching Strong` 검색은 여전히 수행했습니다. Pins/Workbench로 미리 펼쳐두는 기존 대안도 있습니다.

새 추천의 false positive: 이 시나리오에서 **0**. 근거가 없어 자동으로 노출하지 않은 사례: 잔해·뼈·불명확한 사건·위험 환경 **4개**. 이들의 관련 규칙은 사용자가 상황을 해석한 뒤 Search/지도에서 직접 선택할 수 있습니다. 이 숫자는 보편적 정확도 측정이 아니라 제한된 fixture 경로의 관찰입니다.

## 6. Reference round-trip

Before: 결과와 window scroll은 유지되었으나 열린 **굴림 설정이 닫혔고 focus가 body로 이동**했습니다.

After: 기존 참조 navigation을 그대로 사용하며, 이 문서 안에서만 details 상태와 focus origin을 참조별 최대 20개까지 보관합니다. 기존 reading 객체와 일치할 때만 복원하므로 바뀐 결과에 오래된 펼침/포커스 상태를 적용하지 않습니다. 별도 이벤트 로그나 저장 스키마는 없습니다.

검증: 조우 결과 → 생물 원문 → browser Back에서 결과 텍스트, 선택한 source, 열린 설정, scroll, 원래 링크 focus 유지. 기존 Reaction 링크 왕복도 동일하게 복원됩니다([round-trip.json](round-trip.json)). 입력·판정은 기존 `usePlayToolState`, 결과는 기존 `ReferenceSession` 그대로입니다. 다른 결과를 굴리면 이전 생물 링크는 사라집니다.

원문 열기 시 주사위 호출 **0**, 전투 dialog **0**. 생물 원문의 기존 `전투에 적으로 추가` 버튼은 사용자가 직접 선택할 수 있게 유지됩니다. Dungeon 지도·Workbench에서도 같은 source reader로 연결됩니다.

## 7. Tests

**1,166 → 1,180 통과**, 실패 0, skip 0. 새 [dungeon-context.test.ts](../../tests/dungeon-context.test.ts) 14개:

- 무관한 상태/기존 snapshot에서 DOM 영역 없음.
- 실제 Nodh canonical ID, 기존 두 주사위 외 추가 RNG 없음.
- 모든 지역 d6 결과에서 정식 resolver identity 유지; 미해결은 비움.
- 생물 원문 열기에 주사위 사용 없음.
- 임의 생물 이름/시체/보물/함정/한국어 문장으로 추론 안 함.
- 잘못되거나 사용 불가한 ID, 비생물 참조 거부.
- 기존 Reaction/Morale 관계만 허용; 살아 있는 생물에서 시체/보물 유추 안 함.
- 중복/기존 표시 제외, 최대 3개.
- 다른 결과로 바뀔 때 stale 추천 제거.
- 원문 열기가 기존 encounter/session을 변경하지 않음.
- 기존 시체·보물 row 링크 유지.
- 이미 굴린 보물의 미해결 중복 제안 없음.
- 잔해/위험/빈 방/문/함정에 새 절차 없음.
- source packs/registry/reference index 무변경, 고정 counts/hash 검증.

`npm run build`: client/server TypeScript, Vite, public build privacy, private boundary 모두 통과. `npm run lint`: 통과. 기존 500kB 초과 JS chunk 경고는 남아 있습니다.

## 8. Browser acceptance

Production preview Chromium에서 검증했습니다. 실제 DOM 클릭/Enter/tap, source data transport fixture, 원문 값의 결정적 주사위. [재현 스크립트](../../scripts/check-dungeon-context-browser.mjs), [원시 결과](acceptance.json).

| viewport | 결과 |
| --- | --- |
| 360×1000 | touch/tap, 기존 전체 경로, source 왕복, 44px 이상 target, 가로 overflow 없음 |
| 768×1000 | 전체 경로, keyboard Enter, source/설정/scroll/focus 복원, overflow 없음 |
| 1440×1000 | Before와 같은 경로 비교, keyboard Enter, 공간 지도+Workbench 왕복, overflow 없음 |
| 3440×1000 | 넓은 화면에서도 같은 결과·참조·Back, overflow 없음 |

모든 크기에서 생물 원문의 optional Add to combat 확인, 자동 전투 없음, 원문 열기 때 RNG 호출 없음, 다른 조우로 바꾸면 source link 교체를 검증했습니다. 기존 시체 수색/보물 링크, 함정·출구·빈 방 생성도 사용했습니다. Runtime page error는 0입니다. 공유 reader 변경의 회귀 확인으로 기존 Combat contextual browser suite도 360·1440에서 통과했습니다([기록](combat-regression.json)). 키보드 Enter 활성화와 복원된 focus indicator, 대비 및 모바일 hit target을 확인했습니다. 실제 스크린리더 소프트웨어 검사는 별도로 수행하지 않았습니다. 사용자 private 서버 `127.0.0.1:4184`에서도 데이터 전송 fixture 없이 Nodh source 링크, 기존 전투 추가 버튼, Back 포커스를 확인했습니다. 서버를 재시작하지 않고 production build만 반영했습니다.

스크린샷: [360](context-360.png) · [768](context-768.png) · [1440](context-1440.png) · [3440](context-3440.png).

## 9. Integrity

| 자료 | 참조 전/후 | 표 전/후 | 절차 전/후 | 생물 전/후 | 생물 참조 전/후 | 원문 행 전/후 |
| --- | --- | --- | --- | --- | --- | --- |
| archive | 993/993 | 546/546 | 60/60 | 89/89 | 95/95 | 12,310/12,310 |
| distributed | 987/987 | 545/545 | 60/60 | 89/89 | 95/95 | 12,305/12,305 |

전후 JSON 내용 hash는 모두 동일합니다. [before](integrity-before.json) / [after](integrity-after.json):

- library: `fd5c1a6fb24aa95329c2121ab7bda9f45bb86fa353697ab0b297152ac4c3b131`
- archive oracle pack: `dfcafb2241b1bd8913a08e3ab69e7ba25d75ef52121907b3c92eb419051254bd`
- archive oracle registry: `dcea5c3c78721c2db2d194f885f16a97df62d0d7c3f5a60a0d369794e2c982d1`
- distributed oracle pack: `c6d489ecfb341f0b9583bf041ca2d2091771bf3c949f078dcff4d0041c7713f6`
- distributed oracle registry: `6d74fc00467fe1a1b036557cc6fd9458dab1675ee84a64f7a4541dbda51331bd`

Canonical source/metadata/relatedIds/procedures/dice는 변경하지 않았습니다. 원문 수정 0, migration 0, 자동 굴림 0, 별도 기록 기능 0.

## 10. Remaining limitations

이 pass는 모든 던전 결과를 해석하지 않습니다. 문장만 있는 잔해, 함정 가능성, 희귀 생물, 임의 생성 생물에는 새 추천이 없습니다. 정식 지역 source resolver가 해결하지 못한 6행도 그대로 미해결입니다. 조우 수량/능력치는 기존 표시를 사용하고, source link가 플레이어의 관찰·대화·회피·전투 선택을 결정하지 않습니다.

ReferenceSession의 기존 20개 reading 한도 및 새로고침 시 임시 상태가 사라지는 특성은 유지됩니다. 새 캠페인 저장/노트 기능은 없습니다. 결과의 임의 텍스트를 분석해 관계를 만들지 않는 것이 이 제한의 의도입니다.
