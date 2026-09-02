# Mythic Fate / Chaos

## 사용과 화면

모든 화면의 **FATE · CF** 고정 버튼, **MYTHIC FATE** 메뉴 또는 `⌘⇧F` / `Ctrl+Shift+F`로 엽니다. 현재 캠페인 이름과 자동 저장 상태를 패널 상단에 표시합니다. 질문은 선택 입력이며 바로 굴릴 수도 있습니다. 질문 입력 중 `⌘Enter` / `Ctrl+Enter`도 판정합니다.

- Chaos Factor: 기본 5, 범위 1–9. 직접 입력 또는 ± 버튼. 장면 종료 시 통제했으면 −1, 통제하지 못했으면 +1로 사용자가 조정합니다. 질문을 굴릴 때 자동 변경하지 않습니다.
- Yes / No: 9개 Odds, Fate Chart(d100) 또는 Fate Check(2d10). Random Event는 답변과 별도 표시됩니다.
- 장면 판정: 예상 장면을 적고 d10으로 Expected / Altered / Interrupt를 확인합니다.
- 실물 주사위: 직접 입력 모드로 각 주사위를 입력합니다. d100의 00은 100, d10의 0은 10으로 입력하도록 안내하고 범위를 검사합니다.
- Random Event: 기존 Oracle Registry의 Focus + Action 1 + Action 2를 각각 굴립니다. 결과의 단어와 출처를 보존합니다. NPC·Threads를 임의로 만들거나 사건 문장을 자동 창작하지 않습니다.
- 최근 판정: Fate와 Scene을 합쳐 최대 20개 자동 저장. 현재 탭의 기록을 선택하면 당시 질문·Chaos·Odds·주사위·결과·사건 단서가 표시됩니다. 계속 남길 판정은 Notes에 추가할 수 있습니다.
- Notes: 현재 Campaign / Dungeon / Room / Character / Monster를 기본 대상으로 삼고 다른 대상도 선택할 수 있습니다. 본문을 덮어쓰지 않고 결과와 출처를 덧붙입니다.

1600px 이상에서는 490px 패널을 옆에 둔 채 작업 화면을 사용할 수 있습니다. 더 작은 화면에서는 모달 서랍으로 열며, 휴대전화에서는 화면 폭에 맞춥니다. 3440px의 던전 4열 배치는 유지합니다. 영문 제목 Grenze Gotisch, 본문 Alegreya, 한글·UI Pretendard를 재사용합니다.

## 원문 근거

사용자가 제공한 **Mythic Game Master Emulator Second Edition** PDF를 확인했습니다. 페이지 번호는 PDF 뷰어의 1-based 페이지이며 인쇄 페이지와 구분합니다.

| 절차 | PDF / 인쇄 페이지 | 적용 |
|---|---|---|
| Standard Fate Chart | 20 / 19; 재수록 195 / 194 | 9 Odds × 9 Chaos, 총 81개 셀의 세 경계를 대조. 원문 X는 null |
| Chaos | 22 / 21; 115 / 114 | 기본 5, 1–9, 장면 종료 시 통제 여부에 따른 조정 |
| Fate Check | 26–27 / 25–26; 재수록 196 / 195 | 두 d10 + Odds 수정치 + Chaos 수정치 |
| Random Event | 26 / 25; 187 / 186 | 원래 주사위 doubles의 한 자리 값 ≤ Chaos. 100은 제외 |
| Scene Check | 68 / 67; 재수록 217 / 216 | d10 > Chaos는 Expected, 이하는 홀수 Altered / 짝수 Interrupt |
| Event Focus / Actions | 38 / 37; 48 / 47 | 기존 검증된 Oracle 3개를 재사용 |

Fate Chart의 인쇄된 Exceptional 경계를 그대로 사용합니다. 50/50·CF5에서는 1–10 Exceptional Yes, 11–50 Yes, 51–90 No, 91–100 Exceptional No입니다. Certain·CF7의 100은 일반 No이고, Impossible·CF1의 1은 일반 Yes입니다. Random Event는 답변을 대체하지 않습니다.

Fate Check는 보정 합계 2–4와 18–20 안에서만 Exceptional입니다. 원문 예처럼 22는 일반 Yes이며 1은 일반 No입니다. 주사위나 합계를 경계로 clamp하지 않습니다. Scene의 Interrupt에는 사건 표시를 함께 붙입니다.

## 자료와 저장

원문 Fate Chart는 Git에서 제외된 `public/rules/mythic-fate.json`에 있습니다. 앱은 요청을 합쳐 한 번 읽고, 9개 고유 Odds·각 9셀·경계 범위·출처 메타데이터를 검증합니다. 누락/손상 시 명확한 안내와 재시도를 제공하며, 그 상태에서도 Chaos·Fate Check·Scene Check는 사용할 수 있습니다. `library.json`, `oracles.json`과 원문 생성 문구는 변경하지 않았습니다. 로컬 빌드의 `dist`에는 이 개인 자료가 복사되므로 공개 배포하지 않습니다.

저장 키 `morkborg-codex:v4`, schemaVersion 4를 유지하는 추가 필드입니다.

```ts
AppSave.mythic?: MythicState; // 캠페인 목록에서 사용하는 독립 기록
Campaign.mythic?: MythicState; // 캠페인마다 독립 기록

interface MythicState {
  chaosFactor: number;
  question: string;
  scene: string;
  odds: FateOdds;
  method: 'chart' | 'check';
  tab: 'fate' | 'scene';
  history: FateReading[];
}
```

구형 v4에는 읽을 때 기본값을 보여주고 첫 수정 때 해당 상태만 추가합니다. 기존 레코드를 초기화하거나 마이그레이션 백업을 지우지 않습니다. 각 reading은 stable UUID, 생성 시각, 방식, 질문, 당시 Chaos·Odds, 원래 주사위, 보정 합계, 답변, Random Event 및 선택적으로 사건 단서를 갖습니다.

패널 열기 여부는 화면 상태입니다. Chaos·질문·설정·판정은 캠페인 저장 데이터로 유지됩니다. 현재 설정을 바꾸거나 다른 캠페인에 갔다 와도 이전 판정을 다시 계산하지 않습니다. 캠페인 JSON 내보내기·가져오기·복제에 포함되며 복제 시 판정·사건 UUID를 새로 발급합니다. 전체 AppSave 백업의 캠페인 밖 Mythic 기록은 가져올 때 **Mythic — standalone backup** 새 캠페인으로 복원합니다. 기존 최상위 Mythic이나 캠페인을 덮어쓰지 않습니다. 캠페인이 0개인 전체 백업도 복원할 수 있습니다.

## 검증 기록 — 2026-09-03

자동 테스트 23개를 추가했습니다. 기존 117개를 유지하여 **총 140개 모두 통과, skip 0개**입니다. `npm run lint`와 `npm run build`도 통과했습니다. 개인 원문 자료가 없는 checkout에서는 자료 의존 테스트를 명시적으로 skip하며, 이번 작업 환경에는 자료가 모두 있습니다.

- 81개 Fate Chart 셀 × d100의 8,100개 결과와 경계·X·doubles 검사.
- 9 Odds × 9 Chaos × d10 두 개의 8,100개 Fate Check 결과 검사.
- 9 Chaos × d10의 90개 Scene 결과 검사.
- 잘못된 입력·손상된 저장 값 거부, 원문 예외 사례, 무작위/수동 경로 일치.
- 기존 v4 보존, 저장 복원, 캠페인/독립 상태 분리, export/import/clone, 기록 20개 제한과 당시 값 보존.
- 방 stable ID로 Notes 덧붙이기, 기존 생성 데이터·타임스탬프 보존, 사건 표 연결, 저장 공간 부족과 재시도.
- 캠페인 0개인 전체 백업의 standalone Mythic 복원 및 현재 세션 보존.

실제 인앱 브라우저에서 다음을 검증했습니다.

1. 기존 **THE ASHEN PSALM**(던전 2개·방 8개·캐릭터 2개·몬스터 2개)을 열고 기준 Campaign JSON을 읽었습니다.
2. 질문 입력, CF5 / 50/50 / d100=55 직접 입력 → **No + Random Event**. Focus와 Actions 2개를 굴렸습니다.
3. Chaos를 7, Odds를 Likely로 변경 → 표시 확률 85%. 기존 55 판정은 CF5·50/50·No를 유지했습니다.
4. 패널을 열어 둔 채 던전과 Room 3으로 이동했습니다. 기본 Notes 대상이 해당 Room으로 바뀌었으며 판정·사건 단서·출처를 기존 노트 뒤에 추가했습니다.
5. CF7 / 50/50 / Fate Check에서 10+10+2=22 → 일반 **Yes**, Random Event 없음.
6. CF7에서 Scene d10=4 → **Interrupt**와 사건 표시, d10=10 → **Expected**. Chaos는 자동 변경되지 않았습니다.
7. Chaos 0은 오류 표시 후 저장된 7로 되돌아왔습니다. d100=101은 판정을 막고 기록을 추가하지 않았습니다. 무작위 Roll도 동작했습니다.
8. 닫기/고정 버튼으로 다시 열기, 페이지 reload 후 질문·Chaos7·Likely·판정 5개와 사건 단서 3개가 복원됐습니다.
9. 다른 캠페인은 기본 CF5를 사용했고 원래 캠페인으로 돌아오면 CF7이 복원됐습니다.
10. 내보낸 JSON을 비교했습니다. 변경은 Mythic 상태, Room 3에 추가한 Notes, 해당 수정 시각, 이동한 workspace뿐입니다. 기존 생성 결과·ID·직접 편집한 방 설명·캐릭터·몬스터·배치는 유지됐습니다.
11. 최근 기록 선택과 모바일 닫기/다시 열기도 확인했습니다.
12. `⌘⇧F`와 `Ctrl+Shift+F`로 열면 질문 입력란에 초점이 이동합니다. `⌘Enter`로 추가 판정, `Escape`로 닫은 뒤 FATE 버튼으로 초점이 복원되는 것까지 확인했습니다. 모바일에서도 질문 초점과 패널 맨 위 위치를 유지했습니다. 마지막 확인에서 브라우저 콘솔 error는 없었습니다.

| 뷰포트 | document scrollWidth | 패널 폭 / scrollWidth | 결과 |
|---|---:|---:|---|
| 360 × 800 | 345 | 345 / 327 | 한 열, 입력과 결과/단서 읽기 가능 |
| 768 × 1024 | 753 | 490 / 472 | 우측 모달, 가로 넘침 없음 |
| 1440 × 1000 | 1425 | 490 / 472 | 우측 모달, 가로 넘침 없음 |
| 3440 × 1440 | 3425 | 490 / 472 | 다른 화면 동시 조작, 던전 항목 4열 유지 |

15px 차이는 세로 스크롤바입니다. 실제 스크린샷과 DOM 크기를 함께 확인했습니다.

## 참고 범위와 한계

[공식 앱 제품 페이지](https://jasonholtdigital.itch.io/mythic-gme-digital), [사용 안내](https://jasonholtdigital.com/resources/getting-started-with-the-mythic-apps/), [Journal 안내](https://jasonholtdigital.com/resources/guide-to-the-mythic-journals/)에서 Chaos→Odds→판정, 수동 질문 입력, 캠페인별 Chaos, 판정 기록과 넓은 화면 패널 구성을 참고했습니다. 공식 앱 유료 기능을 직접 실행해서 검증한 것은 아닙니다.

이번 범위는 Standard Fate/Chaos/Scene 및 기존 Meaning 연동입니다. 선택 Chaos 변형, Adventure Lists/Threads의 자동 선택, 전체 공식 앱의 다중 패널 편집기, 설치형 오프라인 앱은 포함하지 않습니다. 최근 20개를 넘어 장기 보관할 판정은 Notes에 추가하세요. localStorage의 기존 동일 출처·프로필 제한과 여러 탭의 마지막 저장 우선 동작은 그대로입니다.

확인된 기능 오류는 남아 있지 않습니다. 빌드에는 기존 500kB 이상 JavaScript chunk 안내가 남아 있습니다(약 582kB, gzip 175kB). 이번 변경에 새 패키지 의존성은 없습니다.
