# Monster Library · 정의와 배치

2026-09-03 구현 및 실제 브라우저 검증 기록. Campaign → Dungeon → Room과 Character Library를 유지하며, Monster 정의와 배치를 분리했다.

## 모델

```ts
interface Monster extends BaseEntity {
  campaignId: string;
  concept: string;
  appearance: string;
  behavior: string;
  wants: string;
  hp: number;
  morale: number | string;
  armor: string;
  attacks: MonsterAttack[];
  special: MonsterText[];
  weakness: MonsterText[];
  loot: MonsterText[];
  weirdTrait: string;
  description: string;
}
interface MonsterAttack extends Provenance {
  id: string;
  name: string;
  damage: string;
  description: string;
  tableId?: string;
}
interface MonsterText {
  id: string;
  text: string;
  source?: string;
  tableId?: string;
}
interface MonsterPlacement {
  id: string;
  monsterId: string;
  dungeonId: string;
  roomId: string | null;
  quantity: number;
  notes: string;
}
```

`BaseEntity`에는 UUID, name, notes, createdAt, updatedAt, sources, generation이 있다. Monster, 공격, 특수능력·약점·전리품 항목, 배치마다 독립 UUID를 사용한다. 배열 순서는 표시용이다. 원문의 `Morale —` 같은 비수치 규칙을 보존하므로 morale은 문자열도 허용한다. HP는 stat definition이며 현재/최대 HP, 전투 인스턴스, 생존 상태를 만들지 않았다.

`Campaign.monsters[]`가 저장된 정의, `Campaign.drafts.monsters`가 하나의 저장 전 후보다. `Campaign.monsterPlacements[]`가 관계의 원본이다. 과거 `Dungeon/Room.monsterIds`는 호환성용 파생 색인으로만 유지하고 모든 새 화면·변경은 placement ID를 사용한다. 단, 과거 형식의 미선택 Dungeon 후보 참조는 선택 시까지 원형을 보존한 뒤 placement로 변환한다.

## 실제 원문 생성 규칙

책의 페이지는 PDF 뷰어의 1부터 시작하는 쪽수다. `public/rules/library.json`은 기존 개인 자료 그대로이며 공개 Git에 포함하지 않는다. 외부 사이트의 데이터 모음은 가져오지 않았다.

| 결과 | 실제 표 또는 계산 |
| --- | --- |
| 이름 | Bare Bones PDF 2, `core.names` 48개. 기본 이름표를 몬스터 이름에 사용하는 기록장 방식임을 명시 |
| 외형 | FERETORY PDF 2, `feretory.A/B/C`, 각각 d12 |
| 사기 | 같은 A/B/C의 최댓값 |
| 피해 | 같은 A/B/C의 최솟값: 1–3 d4 / 4–5 d6 / 6–7 d8 / 8–10 d10 / 11–12 d12 |
| 방어구 | 최고 주사위가 A: None, B: −d2, C: 홀수 −d4·짝수 −d6 |
| HP | 피해 주사위 한 번을 굴린 값 ×2 |
| 욕망 | FERETORY PDF 3, `feretory.desire`, d20 |
| 특수능력 | FERETORY PDF 3, `feretory.trait`, d20 가중치 그대로 |
| 원문 개체 | Bare Bones 및 HERETIC 고정 statblock 프리셋 |

trait는 13개 행이지만 d20 표이며 2–4행은 weight 3, 15–20행은 weight 6이다. 조건부 특수능력의 피해·분열·사망 효과를 생성 시 기본 능력치에 미리 적용하지 않는다. FERETORY의 강한 몬스터용 중간/최고값 선택은 자동화하지 않았으며 수동으로 조정할 수 있다.

원문의 방어구 최고값 동률 처리법이 없어 선택지를 모두 남긴다. HP 본문은 `2 × roll(damageDie)`지만 괄호의 `2d8` 예시와 분포가 다르다. 기존 본문 해석을 유지하고 출처에 모호성을 표시한다.

고정 프리셋은 다른 몬스터와 섞지 않는다. The Übertaker의 전체 d4 행동표와 전리품, Zukuma의 원문 무기 선택, Thinx의 공격 선택지와 조건, Borg Bitor의 PDF 63 추가 출처를 보존한다. 매각가 Valuation은 노트에 명시하며 자동 획득 전리품으로 취급하지 않는다. 일반 HP가 없는 Rotten Nurse는 자동 프리셋에서 제외한다.

## 없는 표와 재굴림

개념, 공격명, 독립 행동, 기이한 특성, 약점, 전리품, 자유 설명은 별도 Monster 생성표가 확인되지 않아 공란/빈 배열로 시작하고 직접 편집한다. 프리셋에 실제 값이 있으면 보존한다. 새 창작 표나 한글 음차 이름을 넣지 않는다.

- 이름·욕망: 대상 필드만 변경한다.
- 특수능력: 선택한 항목 하나만 변경하며 그 UUID를 유지한다.
- HP: 현재 첫 공격의 유효한 피해 주사위를 한 번 굴린 값 ×2. 다른 항목을 변경하지 않는다.
- 외형·사기·방어구·FERETORY 공격 피해: 확인 대화상자로 연동 범위를 알린다. 같은 A/B/C를 다시 굴려 선택한 항목과 연결된 자동값을 갱신한다. 이름과 다른 수동 수정값은 유지한다. 공격명과 별도로 추가한 수동 공격도 유지한다.
- 공격 피해를 수동 입력한 경우 자동 HP는 그 피해 주사위를 따른다. 복합 피해 표현처럼 일반 주사위가 아니면 자동 HP를 추측하지 않는다.
- 전체 재굴림: 확인 후 생성 항목을 새로 정한다. 정의 ID·생성 시각·몬스터 노트·기존 배치는 유지한다.

따라서 요구된 “Attack만 reroll”은 독립된 창작 공격표가 아니라 **원문 A/B/C의 연동 재굴림**으로 구현했다. 정확한 연동 규칙을 우선하면서 다른 직접 수정값은 보호한다.

## 배치와 삭제

- Monster 상세/후보에서 Dungeon 및 Room 선택, 양의 정수 quantity, 배치 메모를 지정한다. Save + Add는 후보 저장과 배치를 같은 트랜잭션에서 수행하고 대상 Dungeon/Room으로 돌아간다.
- Dungeon의 Monsters 탭과 모든 Room에 “몬스터 추가”가 있다. 기존 정의를 선택하거나 해당 위치를 유지한 채 새 후보를 만든다. 동일 Monster·동일 Room에 여러 배치도 가능하다.
- `workspace.monsterTarget`이 후보의 배치 대상을 따로 저장하므로 Dungeon Library 확인이나 Campaign 재진입 후에도 대상이 유지된다. 몬스터 정의 안에 단일 위치를 저장하지 않는다.
- 각 배치는 정의를 `monsterId`로 조회한다. HP 편집은 모든 배치에 반영되고 수량/메모는 독립적이다.
- 배치 제거는 해당 placement 하나만 삭제한다.
- Monster 복제는 새 정의·항목 UUID 및 시각을 만들고 배치는 복사하지 않는다.
- Monster 삭제는 배치 개수와 함께 확인을 거쳐 모든 참조를 제거한다.
- Room 삭제는 배치를 Dungeon-only로 이동한다. placement ID·수량·메모를 보존하고 기존 Dungeon-only 배치와 합치지 않는다.
- Dungeon 삭제는 그 던전의 배치만 제거하며 Monster 정의는 남긴다.
- Dungeon 복제는 새 Dungeon/Room/placement UUID로 연결하고 기존 Monster 정의는 공유한다.
- Campaign 삭제는 그 안의 모든 정의·배치와 함께 기존 정책대로 삭제한다.

## 저장·migration·JSON

AppSave는 `schemaVersion: 4`, 저장 키는 `morkborg-codex:v4`다. v4 → v3 → v2 → v1 우선순위를 사용한다. 변환 전 정확한 JSON 문자열을 `morkborg-codex:pre-v4-backup`에 기록한 뒤 v4를 저장한다. 이전 저장 키와 pre-v3/pre-v2 백업은 그대로 둔다. 백업/새 저장 쓰기가 실패하면 이전 원본을 덮어쓰지 않는다.

기존 Monster의 ID·시각·생성 결과·Notes·출처를 유지한다. `behaviour`는 `behavior`, `attack/damage`는 공격 항목, specialAbility/weakness/loot는 원문 전체를 하나의 배열 항목으로 변환한다. 구두점으로 임의 분리하지 않는다. wants/weirdTrait도 보존한다. 저장된 개체와 후보 모두 처리한다.

기존 Room의 monsterIds는 각 quantity 1 배치로 옮긴다. 어느 Room에도 없는 Dungeon monsterIds만 Dungeon-only로 옮긴다. 기존 Dungeon 배열은 방 참조의 상위 집합이었으므로 방에 있던 정의를 Dungeon-only에 다시 중복 생성하지 않는다.

Campaign JSON과 전체 저장 JSON 모두 버전 1–4를 읽는다. Export에는 정의·공격·모든 노트·배치·수량·목적지·초안이 포함된다. 소유 ID가 하나라도 기존 기록과 충돌하면 Campaign 전체를 복제하면서 Campaign/Monster/공격/항목/Dungeon/Room/placement 및 workspace target·선택 ID를 일관되게 다시 매핑한다. 기존 Campaign은 덮어쓰지 않는다.

`monsterRelationIssues()`와 Zod 검사는 모든 배치의 저장된 Monster, 같은 Campaign의 Dungeon, 그 Dungeon 소속 Room, 양의 정수 수량, 소유 ID 중복을 검증한다. 잘못된 JSON은 기존 데이터에 반영하기 전에 거절한다. 손상된 localStorage는 기존 복구 화면으로 처리하며 원문 다운로드를 제공한다. 표시 계층에도 없는 참조에 대한 방어를 둔다.

## 자동 테스트

기존 46개를 유지하고 `tests/monsters.test.ts`에 31개를 추가했다. **총 77개 통과, 실패 0, skip 0**. 이전 테스트의 저장 버전 및 변경된 구조화 필드 접근만 조정했으며 기존 보존 검증을 제거하지 않았다.

추가 범위: 120회 실제 표 생성, 후보 분리/정확한 저장, 개별 재굴림과 직접 입력 보존, 원문 프리셋, 정의 복제/삭제, Campaign 격리, Dungeon-only/Room/반복 배치, 독립 수량/메모, 공유 HP, Room 삭제, Dungeon 삭제/복제, Campaign 복제, reload, JSON 충돌, 잘못된 참조, v3 migration 원본 백업/실패, 구형 Dungeon 후보 참조 보존, 기존 전체 FERETORY 출처 인식, 수정 시각, **120개 정의와 600개 배치**의 복원과 복제.

## 실제 UI acceptance

기존 `THE ASHEN PSALM`(이전 단계에서 두 Dungeon과 두 Character가 있던 기록)을 사용했다. 변경 전 UI JSON을 읽어 비교 기준을 확보했고, v4 변환 직후 Character·Dungeon·Room·Campaign Notes가 그대로임을 전체 객체 비교로 확인했다.

| 요구 단계 | 실제 결과 |
| --- | --- |
| 1–4 기존 Campaign·일행·던전·Room 2 | 기존 두 Character 및 두 Dungeon 보존, `The Slave waste` / Room 2 열기 |
| 5–6 Room context에서 생성·전체 재굴림 | 후보 생성 및 확인 후 전체 재굴림, 보관함에는 아직 0개 |
| 7 이름 재굴림 | Wemut → Therg, 이름·출처·수정 시각 외 변경 없음 |
| 8 공격 재굴림 | 연동 안내 확인 후 A9/B12/C8 적용, 이름 유지 |
| 9 특수능력 재굴림 | 선택한 special 항목 외 변경 없음, 항목 ID 유지 |
| 10–12 직접 입력·저장+배치 | HP 23, 수동 이름 `The Bone Orchard Widow`, 공격명 `Rusty hook`, 정의 Notes 입력 후 Room 2에 저장+배치 |
| 추가 후보 검증 | 저장 전에 Dungeon 확인 → Monsters → 후보 이어보기, 후보 전체와 Room 2 target 유지 |
| 13–15 두 방 배치 | Room 2 ×1, 같은 정의를 Room 4에도 배치한 뒤 ×3, 각 배치 메모 분리 |
| 16–18 공유 정의 편집 | Library에서 HP 31로 변경, Room 2와 Room 4 각각의 화면에서 HP 31 반영 |
| 19–21 두 번째 정의 | `The Ashen Watcher` 생성·수동 이름 부여, Dungeon-only 배치, Dungeon Monsters 탭에 두 정의 표시 |
| 22–23 배치만 제거 | Room 2 배치 제거 후 정의 2개 유지, Room 4 및 Dungeon-only 배치 2개 유지 |
| 24–25 Dungeon 복제 | `The Slave waste — copy` 생성, 새 Room 4 UUID·새 placement UUID에 기존 monsterId 연결; ×3 및 메모 유지 |
| 26–27 원본 Dungeon 삭제 | 원본 던전의 모든 배치 제거, 정의 2개 유지, 두 번째 던전은 그대로 |
| 28–29 브라우저 Reload | Campaign, Characters, Dungeon 전체, Monster 전체, placements 전체가 일치 |
| 30–33 JSON export/import | UI Export JSON → 붙여넣기 Import. 기존 Campaign이 있어 새 UUID로 가져옴. 원문 내용·수량·메모 일치, 새 Room 4 연결 확인, dangling reference 0 |

처음 주소 재진입(`goto`)은 기존 정책대로 Campaign 목록을 열었다. 그다음 Campaign을 열고 실제 브라우저 `reload()`로 활성 Campaign 복원을 별도로 검증했다. JSON 대화상자와 붙여넣기 가져오기 경로를 직접 검증했으며 OS 파일 저장 완료까지 검증한 것은 아니다.

## Responsive

| viewport | 문서 scrollWidth | stat 열 | 공격 항목 열 | 입력 요소 화면 밖 넘침 |
| --- | ---: | ---: | ---: | ---: |
| 360 | 345 | 1 | 1 | 0 |
| 768 | 753 | 1 | 1 | 0 |
| 1440 | 1425 | 3 | 2 | 0 |
| 3440 | 3425 | 3 | 3 | 0 |

실제 스크린샷으로 네 화면을 확인했다. 360px에서 HP 입력, 공격명/피해 편집, 배치 목록, Room selector, 수량 ± 버튼을 조작했다. Room 배치 대화상자는 313px 너비, select·textarea는 256px로 화면 안에 들어왔다. 새 배치를 추가하지 않고 대화상자 선택/수량 조작 후 닫았다. 배치 목적지 링크의 낮은 대비를 발견하여 본문 보조색으로 수정했다.

기존 Dungeon은 3440px에서 638.375px ×4열 유지, 문서 scrollWidth 3425px. 임시 viewport override는 검증 후 해제했다.

## 범위와 남은 제약

NPC/Encounter/전투·initiative·인스턴스 HP·지도·클라우드·인증을 추가하지 않았다. 고정 원문 프리셋은 전용 규칙을 그대로 보존하지만 전투에서 자동 실행하지 않는다. 공격명 등 없는 표, FERETORY 동률 및 HP 표기의 원문 모호성은 위와 같이 명시적으로 남긴다. 브라우저 localStorage 용량 한도 및 다중 탭의 마지막 저장 정책은 기존과 같다. 빌드는 성공하며 500KB JS 청크 크기 권고 경고가 남아 있다.
