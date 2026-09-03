# NPC·Encounter Library와 배치 — 2026-09-04

Campaign 안에서 NPC·Encounter를 생성·편집·저장하고, 같은 정의를 여러 Dungeon/Room에 배치합니다. 기존 생성표는 Oracle Registry를 통해 읽으며 새 결과 문구나 NPC 전투 수치를 만들지 않습니다.

## 사용한 원문 표

PDF 페이지와 인쇄 페이지는 다를 수 있습니다. 아래는 제공된 실제 PDF와 현재 Registry를 대조한 결과입니다.

| 용도 | Registry ID | 출처와 판정 |
|---|---|---|
| NPC 이름 | `core.names` | Bare Bones PDF 2 / p. 2, d6 × d8 좌표 |
| NPC 태도 | `sd.npc.disposition` | Sölitary Defilement PDF 14 / p. 12, d66 |
| 일반 직업 | `sd.npc.profession` | 같은 페이지, d66 |
| 지역 직업 | `depths.region.<region>.npc_professions` | Sölitary Depths PDF 26–33 / pp. 23–30, d10 범위 |
| 외모 | `reclvse.npcAppearance` | RECLVSE PDF 125, d100 |
| 성격 | `reclvse.npcPersonality` | RECLVSE PDF 126, d100 |
| 동기 | `reclvse.npcMotivation` | RECLVSE PDF 124, d20 |
| 반응 | `core.reaction` | Bare Bones PDF 32, 2d6 합계 범위 |
| Common | `depths.region.<region>.monsters` | Sölitary Depths PDF 24 / p. 21의 사용 절차 + 각 지역 Monsters d6 |
| Common 대체·Rare | `sd.stockCreatures` | 표: Sölitary Defilement PDF 11 / p. 9. 절차: PDF 19 / p. 17. Common d12, Rare d8 + Dungeon DR |
| 방 조우·위험·발견 | `reclvse.roomEncounter`, `reclvse.roomHazard`, `reclvse.roomDiscovery` | RECLVSE PDF 93, 각각 d20 |

Galgenbeck는 Tveland 표를 사용합니다. Sarkash·Graven-Tosk·Kergüs·Wästland·The Valley of the Unfortunate Undead는 해당 지역 표를 사용합니다. Grift는 원문 지역 표가 없어 NPC 직업은 일반 표, Common은 SD d12 stocking으로 돌아갑니다. 모든 표는 기존 `buildOracleRegistry`에서 가져오며 같은 항목의 새 array를 만들지 않았습니다.

Eight-book 조사에는 Full Edition의 Rotblack Sludge, FERETORY의 여행·여관·Eat Prey Kill, HERETIC의 Seeds of a Cvlt·Graves Left Wanting, Mythic의 Meaning Tables와 조건부 NPC 표도 포함했습니다. 장소·상황 의존 규칙은 범용 NPC/조우 기본 결과로 섞지 않았습니다. 이 표들은 기존 Oracle Library에서 계속 사용할 수 있습니다.

## 데이터와 관계

- **NPC:** stable `id`, `campaignId`, optional `region`, `name`, `archetype`(직업), `appearance`, `behaviour`, `personality`, `wants`, `reaction`, `affiliation`, `fears`, `description`, `notes`, `sourceRefs`, 생성·수정 시각. 구형 `hp`, `armor`, `attack` 등 문자열 필드도 보존합니다. 표에 없는 수치는 비워 두며 직접 입력만 제공합니다.
- **Encounter:** stable `id`, `campaignId`, optional `region`, `name`, `category`, `text`, `participants`, `notes`, `sourceRefs`, `dungeonDR`, 생성·수정 시각. 구형 `description`, `sign`, `complication`, `treasure`도 유지합니다. 직접 입력과 재굴림은 `text`/`description`의 오래된 출처를 함께 정리합니다.
- **SourceReference:** 해당 field, book/table ID와 제목, PDF/인쇄 페이지, 실제 roll, entry ID, 절차 note를 구조화합니다. 자유 Notes에 출처를 자동 삽입하지 않습니다.
- **Placement:** `id`, `entityId`, `dungeonId`, `roomId: string | null`, `quantity`, `notes`. Campaign의 `npcPlacements[]`와 `encounterPlacements[]`에 저장합니다. 한 정의에 여러 placement를 둘 수 있습니다.
- **Participant:** `id`, `kind: monster | npc`, `entityId`, `quantity`. 같은 Campaign에서 저장한 기존 정의만 연결합니다. 원문에 나온 몬스터 이름이나 수량은 결과 문장으로 보존하며 참가자 객체로 자동 해석하지 않습니다.
- NPC/Encounter 초안은 각각 저장하고 `contentDraftTargets`도 종류별로 분리합니다. Room에서 NPC 초안을 만들었다가 다른 방에서 Encounter를 만들어도 이전 초안의 목적지가 바뀌지 않습니다.

개체 삭제는 해당 배치와 참가자 참조를 정리합니다. Dungeon 삭제는 해당 배치만 지우며 정의는 보존합니다. Room 삭제는 세 종류 배치를 수량·메모와 함께 Dungeon-only로 옮깁니다. Dungeon 복제는 새 Room/placement ID를 만들고 정의는 공유합니다. Campaign 복제·충돌 import는 소유 ID와 참조를 모두 remap합니다.

## 생성과 작은 목록 UI

`새 NPC → 생성 → 항목별 재굴림/직접 수정 → 저장`, `새 조우 → 종류 → 생성 → 저장` 흐름입니다. Room에서 시작하면 `저장 + Room 배치`가 표시됩니다. `콘텐츠 추가` 한 대화상자에서 Monster/NPC/Encounter 및 새 생성/기존 선택을 고릅니다. Dungeon-only도 같은 방식입니다.

`CompactCard`는 이름, 짧은 secondary, 최소 metadata를 보여줍니다. 카드 본문은 상세 화면으로 연결하고 복제·삭제 등은 닫힌 `⋯` 메뉴에 모았습니다. Monster·Character·Dungeon 보관함에도 적용했습니다. Oracle 목록은 제목·주사위·즐겨찾기를 유지하되 상세 출처와 번역을 펼치지 않습니다. Oracle history도 번역의 반복 노출을 줄였습니다.

`SourceDisclosure`는 Monster/NPC/Encounter/Oracle/Mythic와 공통 Field에서 사용하는 native `details`입니다. 기본은 닫힘이며 클릭·키보드로 열고 닫습니다. 목록의 번역·긴 설명은 별도 상세 화면에서 확인합니다. 상세 NPC/조우는 sourceRefs의 table/entry에 대응하는 한국어를 우선 사용합니다. Room 목록은 이름과 짧은 요약, 연결 수만 표시하며 긴 stat block을 펼치지 않습니다.

## 저장과 migration

`AppSave.schemaVersion = 5`, localStorage key `morkborg-codex:v5`입니다. NPC·조우·참가자·배치·초안도 Campaign JSON 안에 포함됩니다. 이전 v4–v1은 없는 필드만 채우고 원문·수치·Notes·시간을 보존합니다. 변환 전 원본 문자열은 `morkborg-codex:pre-v5-backup`에 보관하며 이전 키도 지우지 않습니다. 이미 있는 잘못된 속성이나 끊긴 참조는 조용히 버리지 않고 거부합니다.

구형 Room의 npcIds/encounterIds를 먼저 placement로 바꿉니다. Room에 없는 Dungeon ID만 Dungeon-only로 옮겨 중복 배치를 피합니다. 명시적인 빈 placement 배열은 그대로 유지합니다. 가져온 ID가 하나라도 충돌하면 전체 Campaign 소유 그래프를 새 ID로 복제하고, 그렇지 않으면 기존 ID를 유지합니다.

## 자동 자료 갱신

`/api/rulebook-data`에서 서버 자료를 자동으로 내려받습니다. 최초 JSON import 없이 룰북·Oracle·Fate Chart가 채워지며, 기존 캐시는 먼저 사용합니다. 이후 시작·5분 간격·탭/네트워크 복귀 때 새 버전을 확인하고 5분 이내의 중복 확인은 생략합니다. 발행자가 `npm run data:publish` 후 배포해야 하며 로컬 파일 변경을 감시하지 않습니다.

기존 영어·주사위 규칙과 사용자 항목을 보존하고 한국어, 누락 표, 신규 검증 개체, Eat Prey Kill metadata를 보충합니다. 표의 선택 범위/override도 누락분을 보충하되 기존 사용자 값을 유지합니다. 키는 서버 환경변수에만 두고 응답에 포함하지 않습니다. Campaign 저장은 기존 localStorage를 유지합니다. [저장·갱신·경합 검증](private-data.md)을 참고하세요.

## 검증

기존 테스트를 유지하고 NPC/Encounter/관계 테스트 28개와 source/card 렌더링 테스트 3개를 추가했습니다. NPC/조우 단계에서 **202개 통과, 실패 0, 건너뜀 0**을 확인했습니다. 별도 읽기 전용 검토에서도 28개 관계 테스트를 다시 통과했고 추가 dangling reference 문제를 발견하지 못했습니다.

실제 로컬 UI에서 다음을 수행했습니다.

1. 기존 `THE ASHEN PSALM — copy verified`의 두 Dungeon·8개 Room·수동 노트를 확인했습니다. 기존 Character 보관함은 비어 있어 Classless Torvul을 생성·저장하고, 남아 있던 FERETORY Monster 초안 Flail-Horned Muskox도 실제 수치와 함께 확인 후 저장했습니다.
2. The Slave waste의 Room 2에서 Add Content → New NPC → Generate. 이름을 Urm에서 Therg로 재굴림하고 동기를 Wealth에서 Power로 재굴림했습니다. 외모를 `검은 장례복 — NPC 수동 수정 유지 검증`으로 직접 수정 후 저장·Room 2 배치했습니다.
3. Room의 작은 행에서 Therg를 열고 상세를 확인했습니다. Source는 기본 닫힘이었고 클릭해서 책·표·페이지를 확인한 뒤 다시 닫았습니다.
4. Room 2에서 Common/Graven-Tosk 조우 `d2 Zombies (MB p. 65)`를 생성·저장·배치했습니다. 기존 Monster Flail-Horned Muskox ×3과 NPC Therg ×1을 참가자로 연결했습니다.
5. Dungeon overview로 복귀하고 Room 카드가 작은 요약으로 유지되는 것을 확인했습니다. reload 후 NPC·조우 배치, 참가자 두 참조, 수량, 수동 외모가 유지됐습니다.
6. UI로 Campaign JSON export → 텍스트 import → 재export했습니다. 새 Campaign/NPC/Monster/Encounter ID, Room 2의 두 콘텐츠 참조, 참가자 Monster/NPC 참조가 모두 새 소유 ID와 일치했습니다. 두 Dungeon·각 4개 Room과 수동 외모도 보존됐습니다.

반응형 실측:

| viewport | 확인한 결과 |
|---|---|
| 360 × 800 | document 345px, 가로 overflow 없음. NPC/Character 카드 약113px. Source 클릭 열기·닫기와 긴 원문 줄바꿈 확인. 모바일 사이드바 내부 스크롤을 고쳐 ORACLES 이동 성공. |
| 768 × 1024 | document 753px, 가로 overflow 없음. Dungeon·목록 확인. |
| 1440 × 1000 | document 1425px, 가로 overflow 없음. Room 카드 약186px. |
| 3440 × 1440 | document 3425px, 가로 overflow 없음. 네 Room 카드가 같은 행, 각각 약718 ×164px. Monster 카드 약113px. |

Safari의 새 비공개 창에서 실제 배포 URL에 첫 접속하여 JSON 없이 Oracle 491개·8권과 Fate Chart가 준비됐습니다. CF6·d100=100 판정은 reload 후 복원됐고 새 Campaign에서 Graft NPC 생성·한국어 표시·저장을 확인했습니다. 서버 HTTP 200과 기존 배포 탭의 자동 자료 적용도 확인했습니다. 서버·bootstrap 테스트 20개를 포함한 최종 전체 테스트는 **222개 통과, 실패 0, 건너뜀 0**입니다. [서버·Safari·폼 정렬 실측](private-data.md)을 참고하세요.

## 남아 있는 범위

- Common/Rare 한 번의 creature stocking 결과를 저장합니다. SD 여섯 칸 목록 준비, Depths 다섯 장 Rare Monster 카드 절차, 전체 여행 encounter check는 자동화하지 않습니다.
- 종류 무작위는 지원하는 다섯 종류를 같은 확률로 선택하는 앱 기능이며, 원문의 d4/d12 stocking category 절차로 표시하지 않습니다.
- Rare d8 + DR가 원문 표 범위 1–20 밖이면 미해결 상태를 표시하고 직접 선택·입력하도록 합니다. clamp·재굴림·새 몬스터 수치를 만들지 않습니다.
- `Regional Creature` 같은 후속 지시는 그대로 보존하며 완전한 재귀 encounter 절차로 실행하지 않습니다.
- Safari OS 파일 선택을 통한 선택적 JSON 복원은 이번 최종 검증에서 재실행하지 않았습니다. 기본 서버 자동 로딩·새로고침·생성은 실제 Safari에서 성공했습니다.


## 경로·배포 확인

`src`, `api`, `server`에 개인 절대 경로(`/Users/`, `file://`)와 File System Access API 사용이 없음을 확인했습니다. 실제 기능 검증 커밋은 `f1a2530734c05915e28610a8f4cee4147ee18283`이며, 사용자 배포 주소는 `https://morkborg-4e3y.vercel.app/`입니다. 이 커밋은 NPC·Encounter 구현 `e45f129e25b48a395489b1cccd63a11a3ed7ad7b`를 포함합니다.
