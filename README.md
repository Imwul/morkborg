# MÖRK BORG Reference Desk

책과 종이 노트 옆에 펼쳐두는 MÖRK BORG 규칙·오라클 참고집입니다. 검색 → 표와 공식 확인 → 굴리기 → 복사 / 관련 참조가 중심입니다. 작업대, 여행, 도시, 던전의 도구는 각각 독립적으로 사용합니다. 앱은 플레이 단계, 시간, 장소, 조우나 HP를 자동으로 변경하지 않습니다.

## 실행

Node.js 22.13 이상이 필요합니다.

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5173
```

브라우저에서 <http://127.0.0.1:5173>을 엽니다. 참조 설정은 브라우저에 저장하며 계정, 서버 데이터베이스, 외부 생성 API는 사용하지 않습니다. 공통 룰북 자료는 이 사이트의 서버에서 자동으로 불러옵니다. 로컬 서버를 실행한 상태에서 사용하며, 설치형 오프라인 PWA는 아닙니다.

```sh
npm test
npm run build
npm run preview
```

`npm run build`는 TypeScript 검사와 정적 빌드를 실행합니다. `npm run lint`로 소스를 검사할 수 있습니다.

## 룰북 자료

제공한 PDF의 실제 생성표와 한국어 번역을 서버에서 자동으로 내려받습니다. **최초 접속에도 JSON 가져오기가 필요하지 않습니다.** `/api/rulebook-data` 한 요청으로 룰북·Oracle·Fate Chart를 검증한 뒤 브라우저 IndexedDB에 함께 저장합니다. 이후 접속은 저장 자료를 먼저 사용하고, 앱 시작·5분 간격·탭/네트워크 복귀 때 새 버전을 확인합니다. `자료 및 규칙 → 서버 자료`에서 자동 확인을 끄거나 지금 확인할 수 있습니다.

기존 영문·주사위 범위·가중치·직접 추가한 내용은 보존하면서 일치하는 한국어 번역과 누락된 표·개체를 보충합니다. 저장된 개인 기록과 직접 편집한 문장은 자료 갱신으로 바뀌지 않습니다. JSON은 `자료 백업 · 복원`에서 선택적으로 사용합니다. [서버 자료 구조와 검증](docs/private-data.md)을 참고하세요.

원본 PDF·평문 JSON·발행 키는 Git과 정적 빌드에서 제외합니다. Git에는 암호화된 발행 자산이 들어가며 Vercel Function이 서버 환경변수 `MORKBORG_DATA_KEY`로 해독합니다. 클라이언트에는 복호화 키를 보내지 않습니다. 서버의 자료 API는 별도 로그인 없이 이 사이트에서 사용합니다.

로컬 작업 환경은 `outputs/private-update-publisher.json`의 발행 키를 Vite 서버에서 읽거나 `MORKBORG_DATA_KEY`를 사용할 수 있습니다. 서버 자료가 없는 개발 환경은 Git에서 제외된 `public/rules/library.json`, `oracles.json`, `mythic-fate.json`을 fallback으로 읽습니다. 배포에서 이 정적 경로에 의존하지 않습니다. 새 자료를 발행할 때는 개인 원문·번역 자료를 수정하고 `npm run data:publish` 후 Git/Vercel 배포를 수행합니다. 컴퓨터의 파일 변경 자체를 감시하는 기능은 아닙니다.

자료 JSON은 `schemaVersion: 1`, `books`, `tables`, `creatures`, `outcasts`, `notes`를 갖습니다. 정확한 타입과 검증은 `src/storage/rulesStore.ts`에 있습니다. `npm run build`는 평문 자료와 발행 키가 정적 결과물에 들어가지 않았는지도 검사합니다.

## 사용

- 홈의 **빠른 참조**와 **생성기**에서 바로 열거나 상단 검색·분류로 필요한 표를 찾습니다.
- **표·공식 보기**는 굴리지 않고 원본 표를 엽니다. **굴리기**는 결과를 즉시 표시합니다. `⌘K` / `Ctrl+K`는 전체 검색, `⌘⇧F` / `Ctrl+Shift+F`는 Mythic Fate입니다.
- 각 Oracle은 독립적입니다. 여행 중 Reaction을 열었다가 닫으면 여행 참고 화면으로 돌아옵니다. 원본 Procedure의 구성 표도 처음부터 열 수 있습니다.
- **동물 흔적 / 망가진 길**은 SD의 상황 판정입니다. Presence / Omens 보정만 입력해서 직접 굴릴 수 있고, 도로·Leaving the Road 표를 별도로 봅니다. 별도 원문이 없는 Tracks 표를 만들어 넣지 않습니다.
- **재앙**은 Core Calendar of Nechrubel의 d66 36개 결과만 굴립니다. 중복 재굴림과 일곱 번째 고정 7:7은 원본 규칙으로 설명하며, 앱이 재앙 횟수나 날짜를 관리하지 않습니다.
- 도시 Move, 던전 Move, 방·거리·NPC 생성, 일반 주사위와 Mythic 결과는 임시 참조입니다. 출처, 관련 링크, COPY, 고정과 최근 참조를 사용할 수 있습니다.
- 캐릭터·몬스터·던전 생성기는 홈의 생성기 항목에서 열 수 있습니다. 프라이빗 서버에 유효한 스냅샷이 있으면 SCVMBIRTHER, The Monster Approaches, DNGNGEN 원문을 선택할 수 있습니다.

SCVMBIRTHER 원문의 한글 도움말을 로컬에서 갱신하려면 Mac의 영→한 번역 언어 팩과 [`trn` 명령줄 도구](https://github.com/hotchpotch/trn)를 준비한 뒤 `npm run private:scvm:translate`를 실행합니다. 생성되는 `private/scvmbirther/ko.json`은 Git에서 제외되며 현재 원문 스냅샷과 일치할 때만 프라이빗 서버가 사용합니다. 원문을 다시 받았다면 번역도 다시 생성해야 합니다.

[구조 감사·변경·검증 보고서](docs/freeform-reference-audit.md)를 참고하세요.

## 저장

개인 자료는 IndexedDB `morkborg-private-data`에 저장하고 구형 `morkborg-rules:v1`도 읽습니다. 작업대 고정·최근 항목은 `morkborg-reference-desk:v1`에 별도로 저장합니다. 기존 Oracle 즐겨찾기는 첫 사용 시 가져옵니다. 표 정의와 작업대의 임시 굴림은 이전 앱 저장 데이터에 포함하지 않습니다.

Mythic의 입력과 새 판정, 작업대의 새 결과·재생 이력은 현재 화면의 메모리에만 유지됩니다. 새로고침 후 결과를 복원하지 않습니다. 고정·최근 참조·직접 추가한 스크랩은 별도의 참고 편의 설정입니다. 과거 저장 데이터의 Mythic 이력과 `dungeon.crawl` 필드는 호환성을 위해 보존하지만 새 참고집에서는 진행 상태로 사용하지 않습니다. 과거 여행/도시 진행 저장 키는 읽거나 쓰지 않고 그대로 둡니다.

이전 기록은 `morkborg-codex:v6` 및 기존 백업 키에 그대로 둡니다. 저장 구조를 일괄 변환하거나 오래된 기록을 삭제하지 않습니다. 손상된 저장 데이터는 덮어쓰지 않고 복구 파일 다운로드를 안내합니다.

브라우저, 프로필, 호스트 또는 포트가 바뀌면 저장 공간도 다릅니다. 사이트 데이터를 지우기 전에는 `자료 및 규칙`의 개인 자료 백업을 내려받으세요.

## 구현 범위

[룰북 적용 범위와 출처](docs/rule-sources.md), [검증 기록](docs/acceptance.md)을 참고하세요. 캐릭터는 Classless 또는 자료에 등록된 직업을 선택해 생성합니다. 모든 솔로 이동 절차와 전투 자동화 전체를 구현한 가상 테이블톱은 아닙니다. 조우 생성은 원문 표의 한 결과를 보여주며, 여섯 칸 encounter list 준비나 Rare Monster의 다섯 장 카드 절차 전체를 자동화하지 않습니다.

구조는 `src/domain`의 모델·참조 작업, `src/generators`의 주사위와 생성 절차, `src/storage`의 검증·저장, `src/components`의 화면으로 나뉩니다. React 19, Vite, TypeScript strict, Zod, shadcn/Base UI를 사용합니다.

모바일 작업대는 검색·고정·최근·굴림·복사에 바로 접근할 수 있습니다. 현재 화면은 영문 장식 제목에 Pirata One과 Bodoni Moda, 한글·UI에 Hahmlet Hangul과 SUIT를 사용합니다. 긴 영어 생성 결과는 길이에 따라 더 작은 서체와 넓은 칸으로 표시합니다.

## Credits

MÖRK BORG Reference Desk is an independent production by Imwul and is not affiliated with Ockult Örtmästare Games or Stockholm Kartell. It is published under the MÖRK BORG Third Party License.

MÖRK BORG is copyright Ockult Örtmästare Games and Stockholm Kartell.

[MÖRK BORG Third Party License](https://morkborg.com/license/)

워크플로 참고: [DNGNGEN](https://dngngen.makedatanotlore.dev), [SCVMBIRTHER](https://scvmbirther.makedatanotlore.dev/), [The Monster Approaches](https://monster.makedatanotlore.dev), [DNGNSTOCK by 1d10+5](https://1d105.itch.io/dngnstock). 공개 배포본은 이 사이트를 실행 중에 호출하지 않고, 생성 문구는 사용자가 제공한 룰북의 표를 사용합니다. 프라이빗 서버에서는 `npm run private:dngngen:acquire`, `private:scvm:acquire`, `private:monster:acquire`로 받아 둔 로컬 스냅샷만 캐릭터·몬스터·특별한 방에 사용합니다. 그 스냅샷은 Git과 공개 빌드에 넣지 않습니다. 미리보기 이미지 `public/og.png`는 AI로 제작했습니다.

Mythic Fate의 작업 흐름은 [공식 Mythic GME Digital](https://jasonholtdigital.itch.io/mythic-gme-digital)의 공개 기능 설명을 참고했습니다. 판정 규칙과 표의 근거는 사용자가 제공한 Mythic Game Master Emulator Second Edition PDF입니다. Reference Desk는 공식 Mythic 앱이 아닙니다.

서체: [Pirata One](https://fonts.google.com/specimen/Pirata+One), [Bodoni Moda](https://fonts.google.com/specimen/Bodoni+Moda), [SUIT](https://sunn.us/suit/), [Hahmlet](https://fonts.google.com/specimen/Hahmlet). 서체 파일은 `public/fonts`에 함께 보관합니다.
