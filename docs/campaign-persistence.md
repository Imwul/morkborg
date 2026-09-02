# Campaign → Dungeon 저장 구조

## 현재 구조

- 앱의 새 진입은 Campaign 목록입니다. Campaign을 열면 그 Campaign의 Dungeon Library로 이동합니다. 작업 중 새로고침은 활성 Campaign과 마지막 화면을 복원합니다.
- Campaign은 `id`, `title`, 선택 설명 `description`, `createdAt`, `updatedAt`, `dungeons[]`, `notes`를 가집니다. 이전 `subtitle`은 호환성을 위해 유지하며 설명 편집 시 함께 갱신합니다.
- Dungeon은 `id`, `campaignId`, `title`, `region`, 기존 생성 필드, `rooms[]`, `notes`, 생성·수정 시각을 가집니다. 생성 필드는 기존 모델의 `premise`, `entrance` 등의 이름을 그대로 사용합니다.
- Room은 UUID를 가집니다. 방 번호는 배열 순서의 표시값입니다. 방 전체 재굴림도 UUID·메모·기존 연결을 유지하고 생성 필드만 바꿉니다.
- 선택 전 후보는 `Campaign.dungeonDraft`에 따로 저장됩니다. 후보 선택 전에는 `dungeons[]`에 추가되지 않습니다.
- 던전 개수에 앱의 제한은 없습니다. 브라우저 저장 공간의 실제 한도는 적용됩니다.
- Campaign은 구조화된 `characters[]`와 `drafts.characters`도 저장합니다. [Character 구조](characters.md)를 참고하세요. 이전 몬스터·NPC·조우 데이터와 테스트는 보존하며 새 생성 기능은 추가하지 않았습니다.

## localStorage와 버전

저장 키: `morkborg-codex:v3`

```ts
interface AppSave {
  schemaVersion: 3;
  activeCampaignId: string | null;
  view: 'campaigns' | 'campaign';
  campaigns: Campaign[];
}
```

활성 Campaign과 목록 화면 여부를 분리합니다. `Campaign.workspace`는 열린 던전·방·탭과 후보 화면 상태를 저장합니다. 화면 이동은 수정 시각을 바꾸지 않습니다. 던전 내용 또는 방이 바뀌면 해당 던전의 `updatedAt`이 갱신됩니다. Campaign Notes와 Dungeon Notes는 서로 다른 필드입니다.

개인 룰북 자료는 기존 `morkborg-rules:v1` 및 로컬 파일을 그대로 사용합니다. 자료의 버전과 캠페인 저장 버전은 별개입니다.

## 기존 자료 migration

저장소의 최초 커밋부터 실제 확인된 이전 형식은 `morkborg-codex:v1`의 다중 Campaign 형식입니다. 별도 단일 던전 형식의 과거 키는 발견되지 않았습니다.

1. v3 자료가 있으면 먼저 검증하고 복원합니다.
2. v3가 없으면 v2, 그 다음 v1 순서로 하나만 선택합니다. 생성 문구·직접 입력·시간·유효한 UUID를 유지해 v3로 옮깁니다. 구형 캐릭터 장비는 원문을 배열 항목 하나로 보존합니다.
3. 이전 원본 키를 삭제하거나 덮어쓰지 않습니다. 변환 전 JSON 문자열을 `morkborg-codex:pre-v3-backup`에도 보관한 뒤, 검증된 v3를 기록합니다. 기존 pre-v2 백업도 남습니다. 백업 저장에 실패하면 v3 기록을 진행하지 않습니다.
4. v2와 v1이 모두 없는 경우에만 해당 origin에 실제 존재하는 MÖRK BORG 이름의 키를 확인합니다. 룰북과 백업 키는 제외합니다. 지역·제목·방 배열·생성 필드가 확인되는 단일 던전 객체, `{dungeon: ...}`, `{currentDungeon: ...}`는 `Untitled Campaign`으로 감쌉니다. `generatedFields` 안의 문자열 및 `{value, source}`도 지원합니다.
5. 유효한 UUID는 유지하고, 없거나 숫자 인덱스인 ID는 최초 변환 시 UUID를 부여합니다. 이후에는 그 ID를 복원합니다. 원문의 공란에 새 생성 결과를 넣지 않습니다.
6. 알려지지 않은 버전·지역·끊어진 참조·지원하지 않는 내장 보관함은 부분적으로 추정 변환하지 않습니다. 원본은 유지됩니다. 실제 v2·v1 키의 손상은 복구 화면을 표시하고, 다른 키의 판별 불가 데이터는 그 키에 그대로 둡니다.

`소개 및 출처 → 변환 전 저장 원본 내보내기`에서 백업을 받을 수 있습니다. 원문에 추가로 존재하던 미지원 속성도 변환 전 원본 문자열에 보존됩니다.

## Export / Import

Campaign JSON은 `{schemaVersion: 3, campaign: ...}`이며 모든 Character·장비·특성·Dungeon·Room·노트·출처·미선택 후보를 포함합니다. 기존 v1·v2 JSON도 읽을 수 있습니다.

가져오기 시 기존 Campaign 또는 그 안의 소유 개체 UUID와 하나라도 충돌하면 Campaign·Character·개별 장비/특성·Dungeon·Room·기존 연결 전체를 새 UUID로 복제합니다. 충돌이 없다면 원래 ID를 유지합니다. 기존 Campaign을 덮어쓰지 않으며, 가져온 Campaign의 Dungeon Library를 엽니다.

## Region과 확률

`Region`은 안정적인 `id`, 원문 `name`, 한국어 `description`, `tags[]`로 구성합니다. 표시 이름은 Galgenbeck, Sarkash, Graven-Tosk, Grift, Kergüs, Wästland, The Valley of the Unfortunate Undead입니다.

새 던전은 지역 선택 → 던전 생성 → 후보 선택 순서입니다. 생성 후 지역 수정은 현재 텍스트를 덮어쓰지 않습니다. 이후 새로 굴리는 항목에 새 지역을 적용하고, 기존 결과의 출처는 유지합니다.

`src/generators/regionWeights.ts`의 별도 태그 사전으로 원문의 단어를 검사합니다. 허용된 던전·방 서술 표에서 지역 태그와 일치하면 원래 가중치에 **1.25**, 불일치하면 **1**을 곱합니다. 여러 태그가 일치해도 배율을 중첩하지 않습니다. 모든 선택지는 양수 가중치를 유지하므로 Sarkash에서도 crypt가 나올 수 있습니다.

- 원문 텍스트·표 항목·원래 weight는 변경하지 않습니다.
- 중첩 후속 표는 각 항목의 문구로 독립 판정합니다.
- 보물·능력치·장비·Feretory 수치·방 내용물 종류 판정·지명이 들어가는 발단 표에는 보정하지 않습니다.
- 기존 지역 전용 Depths 표 및 기존 표 조합은 그대로 재사용합니다.
- 이 보정은 앱의 선택 확률 조정이며 책에 실린 규칙으로 주장하지 않습니다. 해당 출처에 `지역 태그 확률 보정`을 표시합니다.
