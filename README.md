# MÖRK BORG Campaign Codex

한국어 UI로 사용하는 로컬 무작위 생성기와 캠페인 기록장입니다. 제목과 내용을 반복해서 굴리고 원하는 후보를 선택하여, Campaign 안에 여러 Character·Monster·NPC·Encounter·Dungeon을 모으고, Dungeon마다 독립적인 Room과 기록을 보관합니다. 정의와 배치를 분리하여 같은 개체를 여러 방에 연결할 수 있습니다. 고유명사와 원문 생성표의 결과는 원래 표기를 유지합니다.

## 실행

Node.js 22.13 이상이 필요합니다.

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5173
```

브라우저에서 <http://127.0.0.1:5173>을 엽니다. 플레이 기록은 브라우저에 저장하며 계정, 서버 데이터베이스, 외부 생성 API는 사용하지 않습니다. 공통 룰북 자료는 이 사이트의 서버에서 자동으로 불러옵니다. 로컬 서버를 실행한 상태에서 사용하며, 설치형 오프라인 PWA는 아닙니다.

```sh
npm test
npm run build
npm run preview
```

`npm run build`는 TypeScript 검사와 정적 빌드를 실행합니다. `npm run lint`로 소스를 검사할 수 있습니다.

## 룰북 자료

제공한 PDF의 실제 생성표와 한국어 번역을 서버에서 자동으로 내려받습니다. **최초 접속에도 JSON 가져오기가 필요하지 않습니다.** `/api/rulebook-data` 한 요청으로 룰북·Oracle·Fate Chart를 검증한 뒤 브라우저 IndexedDB에 함께 저장합니다. 이후 접속은 저장 자료를 먼저 사용하고, 앱 시작·5분 간격·탭/네트워크 복귀 때 새 버전을 확인합니다. `자료 및 규칙 → 서버 자료`에서 자동 확인을 끄거나 지금 확인할 수 있습니다.

기존 영문·주사위 범위·가중치·직접 추가한 내용은 보존하면서 일치하는 한국어 번역과 누락된 표·개체를 보충합니다. 캠페인, 생성 결과, 직접 편집한 문장, Chaos는 자료 갱신으로 바뀌지 않습니다. JSON은 `자료 백업 · 복원`에서 선택적으로 사용합니다. [서버 자료 구조와 검증](docs/private-data.md)을 참고하세요.

원본 PDF·평문 JSON·발행 키는 Git과 정적 빌드에서 제외합니다. Git에는 암호화된 발행 자산이 들어가며 Vercel Function이 서버 환경변수 `MORKBORG_DATA_KEY`로 해독합니다. 클라이언트에는 복호화 키를 보내지 않습니다. 서버의 자료 API는 별도 로그인 없이 이 사이트에서 사용합니다.

로컬 작업 환경은 `outputs/private-update-publisher.json`의 발행 키를 Vite 서버에서 읽거나 `MORKBORG_DATA_KEY`를 사용할 수 있습니다. 서버 자료가 없는 개발 환경은 Git에서 제외된 `public/rules/library.json`, `oracles.json`, `mythic-fate.json`을 fallback으로 읽습니다. 배포에서 이 정적 경로에 의존하지 않습니다. 새 자료를 발행할 때는 개인 원문·번역 자료를 수정하고 `npm run data:publish` 후 Git/Vercel 배포를 수행합니다. 컴퓨터의 파일 변경 자체를 감시하는 기능은 아닙니다.

자료 JSON은 `schemaVersion: 1`, `books`, `tables`, `creatures`, `outcasts`, `notes`를 갖습니다. 정확한 타입과 검증은 `src/storage/rulesStore.ts`에 있습니다. `npm run build`는 평문 자료와 발행 키가 정적 결과물에 들어가지 않았는지도 검사합니다.

## 사용

- 앱을 새로 열면 캠페인 목록이 나옵니다. 캠페인을 만들거나 열면 던전 보관함으로 이동합니다. **새 던전 → 지역 선택 → 던전 생성**을 누르면 제목 입력 없이 제목·개요·방 4개가 채워진 후보를 볼 수 있습니다. 일곱 지역 이름은 원문을 유지합니다.
- **모두 다시 굴리기**로 새 후보를 즉시 확인하고, **이 던전 선택**을 누르면 그 내용과 방이 그대로 보관함에 들어갑니다. 생성할 방 수는 0–12개로 조정할 수 있습니다. 선택 전 후보도 화면 이동과 새로고침 후 유지됩니다.
- **캐릭터 → 새 캐릭터**에서 Classless 후보를 만들고 **캐릭터 저장**으로 보관함에 추가합니다. 이름·능력치·HP·장비·특성을 개별 재굴림하거나 직접 편집할 수 있습니다. 현재/최대 HP와 생존/사망 상태, 캐릭터 노트는 별도로 저장합니다.
- 선택 전 캐릭터 후보도 다른 화면 이동과 새로고침 후 이어서 편집할 수 있습니다. [Character 생성·저장 설명과 검증](docs/characters.md)을 참고하세요.
- **몬스터 → 새 몬스터**에서 FERETORY 후보를 생성합니다. **저장 + 배치**로 Dungeon-only 또는 특정 Room에 수량·메모를 지정하며, 여러 배치가 같은 정의를 참조합니다. Dungeon/Room에서도 기존 몬스터 선택과 새 생성이 가능합니다. [Monster 구조·룰북·33단계 UI 검증](docs/monsters.md)을 참고하세요.
- **NPC → 새 NPC → 생성**에서 기존 Oracle Registry의 이름·지역 직업·외모·성격·태도·동기·반응 표를 함께 굴립니다. 각 항목만 재굴림하거나 직접 수정할 수 있습니다. 원문에 없는 HP·방어구 등의 수치는 만들지 않습니다.
- **조우 → 새 조우**에서 Common·Rare·Room Encounter·Hazard·Discovery를 선택합니다. 기존 Monster/NPC를 수량과 함께 참가자로 연결할 수 있습니다. **방 → 콘텐츠 추가**에서는 세 종류의 새 생성·기존 선택을 한 창에서 처리하고 **저장 + Room 배치**로 돌아갑니다. [NPC·조우 출처, 관계, 검증](docs/npc-encounter.md)을 참고하세요.
- 보관함 카드는 이름·짧은 설명·최소 상태만 보여줍니다. 클릭하면 별도 상세 화면이 열리고 한국어 번역을 볼 수 있습니다. 출처·긴 설명·노트는 필요한 위치에서 펼치며, 복제·삭제는 `⋯` 메뉴에 모았습니다.
- **ORACLES**에서 룰북 표를 검색·필터하고 개별 또는 조합으로 굴립니다. 현재 Campaign/Dungeon/Room/Character/Monster Notes에 결과를 덧붙일 수 있습니다. Mythic Meaning Tables 49개·4,900항목을 모두 포함합니다. [Oracle 구조·검증](docs/oracles/README.md), [전체 표 inventory](docs/oracles/INVENTORY.md)를 참고하세요.
- **FATE · CF** 고정 버튼이나 **MYTHIC FATE** 메뉴, `⌘⇧F` / `Ctrl+Shift+F`로 운명 판정 패널을 엽니다. Chaos 1–9, 질문, Odds를 입력하고 Fate Chart·Fate Check 또는 장면 판정을 굴릴 수 있습니다. 실물 주사위 값 직접 입력, Random Event의 Focus + Actions, 최근 판정 20개 및 Notes 추가를 지원합니다. 1600px 이상에서는 패널을 열어 둔 채 다른 기록을 편집할 수 있습니다. [Mythic 규칙·저장·UI 검증](docs/mythic-fate.md)을 참고하세요.
- 필드별 재굴림 버튼은 제목·입구·특징 등 해당 값만 바꿉니다. 던전 필드의 이전 값은 편집 세션에서 세 번까지 되돌릴 수 있습니다. 저장된 개체의 전체 재굴림과 삭제는 확인 후 적용합니다.
- 직접 수정한 값에는 `직접 작성`이 표시됩니다. 원문에 해당 표가 없는 필드는 비워 둡니다.
- 빈 던전에서 시작하려면 **직접 작성**을 누릅니다. 기존 던전에 비어 있는 개요가 있다면 **빈 항목만 생성**으로 채울 수 있습니다. 이미 쓴 값은 유지됩니다.
- 방 순서를 바꿔도 UUID로 연결된 배치는 유지됩니다. 방 삭제 시 Monster/NPC/Encounter 배치는 수량·메모를 유지한 채 Dungeon-only로 이동합니다. 던전 복제는 새 방 ID에 배치를 연결하고 정의는 공유합니다. 던전 삭제는 정의를 지우지 않으며, 개체 삭제는 배치와 참가자 참조를 함께 정리합니다.
- 검색으로 방·개체·노트로 이동할 수 있습니다. `⌘K` / `Ctrl+K`를 지원합니다.
- **캠페인 내보내기**에서 JSON을 파일로 저장하거나 복사하세요. 가져오기는 파일 선택과 붙여넣기를 지원하며, 같은 캠페인이 이미 있으면 새 ID의 복제본으로 추가합니다.

## 저장

캠페인은 현재 브라우저의 `localStorage`에 즉시 저장됩니다. 저장 키는 `morkborg-codex:v5`, `schemaVersion`은 `5`이며 생성 초안, 선택한 화면과 배치 위치도 복원합니다. 개인 자료는 별도 IndexedDB `morkborg-private-data`에 저장하고 구형 `morkborg-rules:v1`도 읽습니다. Oracle 즐겨찾기와 필터는 `morkborg-oracle-preferences:v1`에 별도로 저장하며, Oracle 정의와 임시 굴림 history는 Campaign save에 포함하지 않습니다.

Mythic Fate는 별도입니다. 각 Campaign의 `mythic`에 Chaos·질문·예상 장면·Odds·판정 방식·최근 판정을 자동 저장하고 JSON 내보내기/복제에도 포함합니다. 예전 v4 데이터에는 기본값 Chaos 5를 표시하며 처음 수정할 때 추가합니다. 캠페인 목록에서 사용한 Mythic 상태는 최상위 `AppSave.mythic`에 독립 저장합니다. 이전 판정의 Chaos·Odds·주사위는 현재 설정을 바꾸어도 유지됩니다.

이전 v4·v3·v2·v1 원본과 기존 백업은 유지하고, 변환 전 JSON을 `morkborg-codex:pre-v5-backup`에 남긴 뒤 v5를 기록합니다. 구형 NPC·조우의 원문·수치·Notes도 보존하고 기존 ID 관계를 명시적인 배치로 변환합니다. 판별 가능한 단일 던전은 `Untitled Campaign`으로 옮깁니다. [저장 구조·마이그레이션·지역 가중치](docs/campaign-persistence.md)에 형식과 한계를 설명했습니다.

브라우저, 프로필, 호스트 또는 포트가 바뀌면 저장 공간도 다릅니다. 사이트 데이터 삭제 전에 JSON을 내보내세요. 저장 공간이 부족하면 경고와 전체 백업을 제공하며, 손상된 저장 데이터는 덮어쓰지 않고 복구 파일 다운로드를 안내합니다. 여러 탭의 동시 편집은 마지막 저장이 반영되므로 한 탭에서 편집하는 편이 좋습니다.

## 구현 범위

[룰북 적용 범위와 출처](docs/rule-sources.md), [검증 기록](docs/acceptance.md)을 참고하세요. 캐릭터는 Classless 또는 자료에 등록된 직업을 선택해 생성합니다. 모든 솔로 이동 절차와 전투 자동화 전체를 구현한 가상 테이블톱은 아닙니다. 조우 생성은 원문 표의 한 결과를 저장하며, 여섯 칸 encounter list 준비나 Rare Monster의 다섯 장 카드 절차 전체를 자동화하지 않습니다.

구조는 `src/domain`의 모델·참조 작업, `src/generators`의 주사위와 생성 절차, `src/storage`의 검증·저장, `src/components`의 편집 화면으로 나뉩니다. React 19, Vite, TypeScript strict, Zod, shadcn/Base UI를 사용합니다. WebMCP를 지원하는 브라우저에서는 로컬 캠페인 목록과 새 캠페인 생성 도구를 제공합니다.

화면은 3440×1440 울트라와이드에서 작업 영역 전체를 사용하며 개요 필드를 네 열로 배치합니다. 작은 화면에서는 세 열·두 열·한 열로 줄어듭니다. 캐릭터는 큰 화면에서 2–3열, 모바일에서 한 열입니다. 영문 큰 제목은 Grenze Gotisch, 본문과 작은 목록 제목은 Alegreya를 사용합니다. 한글·UI·숫자는 Pretendard로 표시하고 본문 행간1.85를 유지합니다. 움라우트와 결합 악센트도 지원합니다.

## Credits

Campaign Codex is an independent production by Imwul and is not affiliated with Ockult Örtmästare Games or Stockholm Kartell. It is published under the MÖRK BORG Third Party License.

MÖRK BORG is copyright Ockult Örtmästare Games and Stockholm Kartell.

[MÖRK BORG Third Party License](https://morkborg.com/license/)

워크플로 참고: [DNGNGEN](https://dngngen.makedatanotlore.dev), [The Monster Approaches](https://monster.makedatanotlore.dev), [DNGNSTOCK by 1d10+5](https://1d105.itch.io/dngnstock). 공개된 생성 구조와 출처를 확인하여 참고했습니다. 생성 문구는 사용자가 제공한 룰북의 실제 표에서 가져오며, 위 사이트를 실행 시 호출하지 않습니다. 미리보기 이미지 `public/og.png`는 AI로 제작했습니다.

Mythic Fate의 작업 흐름은 [공식 Mythic GME Digital](https://jasonholtdigital.itch.io/mythic-gme-digital)의 공개 기능 설명을 참고했습니다. 판정 규칙과 표의 근거는 사용자가 제공한 Mythic Game Master Emulator Second Edition PDF입니다. 이 Codex는 공식 Mythic 앱이 아닙니다.

서체: [Grenze Gotisch](https://github.com/Omnibus-Type/Grenze-Gotisch), [Alegreya](https://github.com/google/fonts/tree/main/ofl/alegreya), [Pretendard](https://github.com/orioncactus/pretendard). 원본 서체 파일과 SIL Open Font License를 `public/fonts`에 함께 보관합니다.
