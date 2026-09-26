# Combat Contextual Intelligence 검증 보고

기준 커밋: `366a31579b2a8570afc3db887e45e56ec32f79db`. 기존 Combat Tool을 보완했습니다. 새 전투 시스템, 자동 진행, 캠페인 기록은 추가하지 않았습니다. Preview → Apply, 수동 피해 수정, CRITICAL/FUMBLE 수동 처리, 선택적 Morale, Undo/Redo와 CombatFrame 이력은 유지됩니다.

## 1. Before audit

코드 수정 전에 실제 브라우저에서 PC 1명·적 2명을 만들고 동일 PC의 공격 3회, 적의 연속 공격 2회를 진행했습니다. 입력은 실제 UI를 통해 수행했으며 상태 검증에만 sessionStorage를 읽었습니다. 원본 측정은 [before-audit.json](before-audit.json)에 있습니다.

| 항목 | 수정 전 측정 / 발견 |
|---|---|
| 같은 공격 3회 | 회당 판정·Apply **2번 명령 클릭** + 새 실물 눈 **3칸 입력**. 입력 칸 선택·Tab은 명령 클릭 수에 포함하지 않음. |
| 공격자 / 대상 / 무기 / DR | 동일 조합의 반복에서는 모두 유지. 이 부분을 새 Quick Attack으로 바꿀 이유가 없음. |
| 적 → PC 2회 | 동일하게 2번 클릭 + 방어·피해·갑옷 눈 3칸. AGI 방어 후 피해 감소를 계산하고 Apply 전에는 HP 그대로. |
| 공격자 변경 | DR 하나를 폼 전체에서 공유. PC에게 사용한 DR10이 적의 공격에도 그대로 남음. |
| 결과 → Apply | 데스크톱 오른쪽 결과 열에서 확인·적용. 적용 버튼이 사라진 뒤 초점이 판정 입력으로 돌아오지 않고 전투창 컨테이너로 이동. |
| 대상 항복 / 도주 | 사기 실패한 적이 비활성화되자 나머지 적으로 대상이 자동 변경됨. |
| Reference 왕복 | 참가자·선공 단계·미리보기 유지, 브라우저 Back으로 전투 복귀 가능. 다만 **스크롤 0, 제목 초점**으로 초기화. 열린 세부 UI도 다시 찾아야 함. |
| 배포 빌드 | 전투창의 기본 중앙 정렬 애니메이션과 위쪽 고정 배치가 충돌해 창 일부가 화면 위로 밀리는 사례를 재현. |

예외 시나리오도 각각 실행했습니다.

- 공격/방어 자연 20·1: CRITICAL/FUMBLE 알림, 장비와 피해 배수 자동 적용 없음.
- PC HP 0: 기존 Broken 안내. 적 HP 0: 상태 안내만, 참여 여부 자동 변경 없음.
- Morale: 사용자가 실행하면 2d6 및 실패 d6를 처리하고, 도주/항복 메모와 참여 해제를 적용. Undo 가능.
- Omen 최대 피해·결과 후 무효화·재굴림: Preview에서는 소비하지 않고 Apply에서 소비.
- 방패 희생: Preview에서는 방패 유지, Apply에서 제거하고 피해 0. 수동 피해 수정도 Apply 시만 반영.
- 기존 브라우저 시나리오로 라운드 복원, Undo/Redo, 새로고침, 앱/실물 굴림을 재검증했습니다.

## 2. Changes

- 결과 아래에 작은 **지금 관련된 참조** 영역을 추가했습니다. 관련 항목이 없으면 숨기고, 중복 없이 최대 3개만 표시합니다. 판정하거나 다음 행동을 지시하지 않습니다.
- 기존 생물 Reference에 **전투에 적으로 추가**를 추가했습니다. 원문 보기 버튼도 참가자에 표시합니다.
- 공격자별로 대상·공격 방식·DR·추가 보정을 기억합니다. 다른 공격자를 처음 선택하면 기본 DR12부터 사용하며, 다시 돌아오면 해당 공격자의 입력을 복원합니다. 무기는 참가자의 현재 수정 값을 사용합니다.
- 비활성·제거·같은 진영 대상은 선택에서 비워 두고 판정 버튼을 비활성화합니다. 다른 적을 자동 선택하지 않습니다. 처음 공격할 때도 공격자·대상을 명시적으로 선택합니다.
- 적용 후 실물 모드에서는 다음 d20 입력, 앱 모드에서는 기존 판정 버튼으로 초점을 돌려줍니다. 새 공격의 실물 눈은 지웁니다. 이전 눈을 재사용하지 않습니다.
- 규칙 왕복 시 미리보기뿐 아니라 열린 details, 스크롤, 누른 참조의 초점을 복원합니다. 기존 전투 버튼에 복귀 표시가 나타납니다. 새 모달을 겹쳐 띄우지 않습니다.
- 결과를 열 때 치명타·펌블 알림이 있는 결과 상단을 보여줍니다. 배포 빌드의 팝업 애니메이션/배치 충돌도 전투창 범위에서 제거했습니다.
- 새 판정 문맥은 선택적 `CombatFrame.event`에 명시적 공격/사기 결과만 담습니다. 메모나 결과 문장을 파싱하지 않습니다. 새 라운드/차례 표시는 이전 공격 문맥을 지웁니다. 기존 v1 저장 자료도 그대로 읽습니다.

## 3. Contextual mappings — 전체 목록과 근거

| 상황 | 정확한 Reference ID | 근거 / 제한 |
|---|---|---|
| PC HP ≤ 0 | `rule:core.broken` | **도구 내부 shortcut.** 기존 규칙이 정확히 0 HP의 Broken과 음수 HP의 사망을 구분하므로 표를 자동 굴리지 않고 규칙을 엽니다. |
| 공격/방어 자연 20·1 | `rule:core.crit-fumble` | **도구 내부 shortcut.** 기존 단일 규칙이 공격·방어별 효과를 담고 있습니다. 현재 판정 종류를 라벨에 표시. Omen으로 무효화하면 해당 제안은 숨깁니다. 적용된 결과는 snapshot과 함께 보존. |
| 단독 적 HP ≤ ⅓ 또는 등록한 무리 절반 HP ≤ 0 | `rule:core.reaction-morale` | **도구 내부 shortcut.** 기존 규칙에 명시된 수치 조건만 사용. 현재 사기 수치가 있는 적이 있어야 표시. 등록 인원과 실제 무리가 같은지는 사용자가 확인. 지도자는 데이터로 식별할 수 없어 추정하지 않음. |
| 사용자가 실행한 Morale로 도주/항복, 해당 참가자가 비활성 | `rule:core.reaction-morale` | 위와 같은 **도구 내부 shortcut**. 이미 처리한 사기 판정의 원문 확인. PC의 도주 판정으로 연결하지 않음. |
| 원문에서 가져온 적 HP ≤ 0 | `oracle:core.corpsePlundering` | 해당 `sourceReferenceId`의 **기존 explicit relatedIds**, 또는 검증된 기존 Procedure USES가 실제 있을 때만. 현 데이터에서는 creature의 기존 relatedIds를 사용. |
| 같은 조건 | `oracle:core.treasures` | 위와 동일한 기존 관계 검증. 전리품 존재·획득을 판정하거나 적용하지 않음. |

규칙 shortcut은 `combatContext.ts` 안에만 있으며 registry에 저장하지 않습니다. 시체·보물 연결은 원래 Reference Desk에 있던 관계를 조회할 뿐 새 관계를 생성하지 않습니다. PC 위기 → 직전 치명타/실수 → 사기 → 기존 생물 관련 참조 순으로 최대 3개입니다.

의도적으로 제외한 연결: 수동 입력한 적의 HP 0 → 임의 전리품, 단순 inactive → 시체, 메모의 ‘도주/항복/지도자’ 단어 → 규칙, 적의 사기 실패 → PC 도주 판정, combat이라는 공통 주제만을 근거로 한 추천. 이탈 사유가 구조화되어 있지 않은 PC의 메모도 추론하지 않습니다.

## 4. Creature handoff

`findReferenceCreature`로 현재 registry의 정확한 canonical creature를 찾습니다. 랜덤 몬스터 생성기나 외부 생성 결과의 본문을 재해석하지 않습니다.

| Canonical field | Combatant field | 복사 정책 |
|---|---|---|
| `name` | `name` | 명시된 이름. |
| 수치 `hp` | `hp`, `maxHp` | 같은 수치로 시작. 없는 수치·HP 주사위 문자열은 빈 수치 칸과 원문 HP 표시로 보존하며 자동 굴림 없음. |
| 수치 `morale`; 없으면 숫자만인 `moraleDisplay` | `morale` | 숫자만 복사. `—`, 빈 값, 설명은 null. |
| `armor` | `armor` | 완전한 주사위/고정값, 정확한 `No armor`/`None`, 명시적 방어구 필드의 `… -d2` 같은 단일 감소 표기만 정규화. 확률·조건부 방어구는 빈 계산 칸. |
| `attack` | `weaponName` | 명시된 이름만. |
| `damage` | `weapon` | 완전한 주사위/고정값 및 `1 damage` 같은 고정 표기. `d4 + special`, `d6 or d8` 등 복합 표기는 계산하지 않음. |
| 구조화된 `attackOptions` / `attackTable.entries` | `weapons` 선택지 | 각 이름·피해를 복사. 선택지가 여럿이면 사용자가 직접 고름. 랜덤 선택 없음. |
| 명시적 `strength`, `agility`, `presence`, `omens`, `defencePenalty` | 대응 필드 | 정수로 존재할 때만. 현재 일반 생물에는 대부분 없어 빈 칸. |
| Reference ID | `sourceReferenceId` | 출처 다시 열기와 기존 관계 확인용. 원본과 값 동기화 없음. |
| 원문 HP·갑옷·피해 필드 | `sourceStats` | 단일 계산 값으로 옮기지 못한 내용을 확인할 수 있도록 보존. |

새 ID, 적 진영, 참여 여부는 전투 도구의 생성 상태입니다. 방패·방어구 tier는 본문에서 추정하지 않습니다. 특수 능력에 쓰인 DR, 독, 면역, 피해 배수도 복사·적용하지 않습니다. `생물 원문`에서 읽고 수동 반영합니다. 같은 생물을 여러 번 추가하면 모두 독립된 snapshot이며, 추가 자체도 Undo/Redo 대상입니다. 미기재 값은 null/빈 문자열로 보존하고 계산에 꼭 필요한 값이 없으면 주사위를 소비하기 전에 입력을 요청합니다.

## 5. Repetition improvement

| 조작 | Before | After |
|---|---|---|
| 같은 공격 1회 | 판정 + Apply 2번 | **동일 2번** — 안전한 명시적 적용 유지 |
| 실물 명중 시 새 눈 | 3칸 | **동일 3칸** — 이전 굴림 재사용 방지 |
| 같은 조합의 공격자/대상/장비/DR 재입력 | 0 | 0 |
| PC DR10 → 적 DR12 → PC DR10 | DR 2번 재수정 | 공격자별 설정이 준비되면 0번 |
| 결과 적용 후 다음 입력 | 초점이 컨테이너로 사라짐 | d20 또는 기존 앱 판정 버튼에 복원 |
| 치명타 원문 찾기 | 하단 규칙 details 열기 + 링크, 스크롤 이동 | 상황 참조 1번 클릭 |
| Reference에서 돌아오기 | 1번 복귀 후 제목부터 위치 재탐색 | 1번 복귀 후 원래 참조·스크롤·미리보기 유지 |
| 기존 생물 투입 | 빈 도구에서 이름·능력치 수동 전사 | 1번 추가, 애매한 필드만 직접 확인 |
| 대상 이탈 | 다른 적으로 자동 변경 | 미선택 상태, 명시적 선택 필요 |

DR을 대상별로 자동 추론하지 않습니다. 같은 공격자의 반복 입력을 보존하며, 다른 대상의 특별한 DR이나 일시 보정은 화면의 DR/보정 칸에서 직접 바꿉니다. 첫 공격의 두 선택은 추가 조작이지만 자동 표적 변경을 막기 위해 의도적으로 남겼습니다.

## 6. Integrity

| 데이터 | References | Tables | Procedures | Creature 원본 / 파생 Reference | Rows |
|---|---:|---:|---:|---:|---:|
| 제공 archive 전 → 후 | 993 → 993 | 546 → 546 | 60 → 60 | 89 / 95 → 89 / 95 | 12,310 → 12,310 |
| 배포 pack 전 → 후 | 987 → 987 | 545 → 545 | 60 → 60 | 89 / 95 → 89 / 95 | 12,305 → 12,305 |

원본 pack을 JSON 직렬화한 SHA-256과 구성된 oracle registry의 SHA-256을 비교했습니다. [before](integrity-before.json) / [after](integrity-after.json)는 바이트 단위로 동일합니다.

- Library: `fd5c1a6fb24aa95329c2121ab7bda9f45bb86fa353697ab0b297152ac4c3b131`
- Archive oracle pack: `dfcafb2241b1bd8913a08e3ab69e7ba25d75ef52121907b3c92eb419051254bd`
- Distributed oracle pack: `c6d489ecfb341f0b9583bf041ca2d2091771bf3c949f078dcff4d0041c7713f6`
- Archive registry: `dcea5c3c78721c2db2d194f885f16a97df62d0d7c3f5a60a0d369794e2c982d1`
- Distributed registry: `6d74fc00467fe1a1b036557cc6fd9458dab1675ee84a64f7a4541dbda51331bd`

원문 JSON, canonical registry 데이터, 표, procedure, 기존 semantic graph는 수정하지 않았습니다. 캠페인 localStorage 값도 브라우저 검증 중 그대로 유지됐습니다.

## 7. Tests

Baseline **1,139 passed** → Final **1,166 passed, 0 failed, 0 skipped**.

새 `tests/combat-context.test.ts`의 **27개** 검증:

- 정상 상태 숨김, HP 0/음수 Broken, 공격·방어 자연 20/1 네 조합, Omen 무효화, snapshot 문맥 및 새 라운드 초기화.
- 원문 조건에 한정한 Morale, 기존 관계가 있는 시체·보물만, 명시적 도주·항복 원문, 중복 제거·3개 제한, unavailable 참조 제외.
- canonical creature 필드 복사, 누락/비정상 optional 값, 능력치 없는 원문, 조건부·복합 필드 보존, 여러 무기 선택지, 같은 생물 복수 인스턴스, 가져오기 Undo/Redo, 계산 필수 값 검증.
- 유효한 공격자/대상 유지, 제거·비활성·같은 진영 대상 안전 처리, 공격자별 DR/방식/대상 독립성, 무기/참가자 변경 후 stale preview 차단.
- 기존 v1 자료 호환과 비정상 새 문맥 거부, 모든 생물 투입 후 canonical counts/hashes 불변, 필수 값 검증 전에 RNG 소비 없음, 숫자 `moraleDisplay` 처리.

기존 전투 23개 테스트와 전체 테스트를 함께 실행했습니다. 기존 브라우저 스크립트에는 자동 선택 제거에 따른 명시적 참가자 선택만 추가했습니다. TypeScript(클라이언트/서버), Vite build, lint, public/private build 경계 모두 통과했습니다. 기존 500kB chunk 경고는 남아 있습니다.

## 8. Browser acceptance

`check-combat-context-browser.mjs`를 실제 배포 빌드 preview에서 실행합니다. 로컬 제공 데이터의 API 전송만 fixture로 공급하며, 클릭/입력/탭 이동/Back과 앱의 판정·저장·원문 열기는 실제 구현을 사용합니다.

360 / 768 / 1440 / 3440 **모두 통과**: Creature → 추가 → 공격 → Apply → 3회 반복 → 공격/방어 CRITICAL/FUMBLE → 상황 Reference → Back 및 launcher 복귀 → Morale → Undo → Redo. 추가로 Broken, 기존 시체 관계, 복수 생물 분리, 명시적 무기 선택, 열린 details, preview/phase/session 보존, 초점과 스크롤, 전체 캠페인 sentinel 불변을 확인합니다.

기존 전투 브라우저 검증도 네 폭에서 실행: 앱/실물, Omen 사용·결과 후 무효화·재굴림, 수동 피해, 라운드 checkpoint, Undo/Redo, 새로고침, 사기, Escape/Back. 360에서는 touch로 새 흐름을 실행하고 관련 버튼 및 공격자/대상 select의 실제 사각형이 44×44px 이상인지 측정합니다. 가로 넘침과 페이지 오류는 0입니다.

결과: [acceptance.json](acceptance.json), [기존 전투 회귀](regression-acceptance.json). 화면: [데스크톱 판정](critical-1440.png), [모바일 판정](critical-360.png), [데스크톱 관련 참조](context-1440.png), [모바일 관련 참조](context-360.png).

실제 실행 중인 로컬 사이트에서도 fixture 없이 생물 Reference → 전투 추가를 확인했습니다. 팝업은 1000px 높이에서 y=40~960px 범위에 정상 표시됐고 페이지 오류는 0입니다.

## 9. Remaining friction — 의도적으로 남긴 것

- 복잡한 피해, 확률부 방어구, 특수 능력, 특별한 DR은 원문을 읽고 직접 입력합니다. 부족한 데이터를 유사한 몬스터로 채우지 않습니다.
- 지도자·무리 소속·PC의 자유 메모 속 이탈 사유를 추론하지 않습니다. 등록한 참가자가 실제 전체 무리인지도 앱이 알 수 없습니다.
- Creature Reference만 가져옵니다. 외부 생성기의 자유 형식 몬스터 결과를 파싱하는 handoff는 추가하지 않았습니다.
- 공격 폼 설정과 참조 복귀 위치는 현재 문서에서 유지합니다. 새로고침 시 참가자/기존 전투 snapshot은 복원되지만 미적용 Preview나 입력 설정을 새로 영구 저장하지 않습니다.
- Omen·사기·Broken·전리품이 순서나 종료를 강제하지 않습니다. 모든 적이 HP 0이어도 End Combat 또는 후속 wizard를 띄우지 않습니다.

성공 기준은 공격을 자동으로 잇는 것이 아니라 **필요한 원문까지의 탐색과 돌아온 뒤의 재탐색을 줄이는 것**입니다. 동일 공격의 안전한 두 클릭은 보존했고, source handoff와 상황별 원문 접근, 입력/초점 유지에서 마찰을 줄였습니다.
