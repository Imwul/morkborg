# MÖRK BORG Campaign Codex

한국어 UI로 사용하는 로컬 캠페인 기록장입니다. 캐릭터 → 던전 → 방 → 몬스터·NPC·조우를 하나의 캠페인 안에서 작성합니다. 고유명사와 원문 생성표의 결과는 원래 표기를 유지합니다.

## 실행

Node.js 22.13 이상이 필요합니다.

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5173
```

브라우저에서 <http://127.0.0.1:5173>을 엽니다. 계정, 서버 데이터베이스, 외부 생성 API는 사용하지 않습니다. 로컬 서버를 실행한 상태에서 사용하며, 설치형 오프라인 PWA는 아닙니다.

```sh
npm test
npm run build
npm run preview
```

`npm run build`는 TypeScript 검사와 정적 빌드를 실행합니다. `npm run lint`로 소스를 검사할 수 있습니다.

## 룰북 자료

**이 저장소에는 원본 PDF와 책에서 추출한 표가 포함되지 않습니다.** 사용자가 제공한 책의 표를 개인용 JSON으로 변환하여 로컬에서 사용합니다. 직접 작성, 저장된 캠페인 편집 및 JSON 가져오기는 자료 없이도 가능합니다.

이 작업 환경에는 `public/rules/library.json`에 개인용 자료가 준비되어 있습니다. 새로 복제한 저장소에서는 자신의 자료 파일을 이 경로에 복사하거나, 캠페인을 연 다음 **자료 및 규칙 → 룰북 자료 JSON 가져오기**로 불러오세요. 이 가져오기는 PDF를 자동 해석하는 기능이 아닙니다.

자료 JSON은 `schemaVersion: 1`, `books`, `tables`, `creatures`, `outcasts`, `notes`를 갖습니다. 정확한 타입과 유효성 검사는 `src/storage/rulesStore.ts`에 있습니다. 원본 파일은 `.gitignore`로 제외됩니다. 로컬 빌드의 `dist`에는 개인 자료가 복사되므로 해당 빌드를 공개 호스팅에 올리지 마세요. 공개 코드에는 책 내용 재배포 권한이 포함되지 않습니다.

## 사용

- 캠페인을 만든 다음 캐릭터와 던전을 추가합니다. 일곱 지역 이름은 원문을 유지합니다.
- 생성 결과는 초안입니다. **캠페인에 저장** 또는 **던전에 추가 / 방 N에 추가**를 누르면 보관함에 들어갑니다.
- 상단에서 배치할 던전과 방을 고릅니다. 동일한 개체를 여러 방에 배치해도 원본은 하나입니다.
- 필드별 주사위 버튼은 해당 값만 바꿉니다. 이전 값은 편집 세션에서 세 번까지 되돌릴 수 있습니다. 전체 재굴림과 삭제는 확인 후 적용합니다.
- 직접 수정한 값에는 `직접 작성`이 표시됩니다. 원문에 해당 표가 없는 필드는 비워 둡니다.
- 방 순서를 바꿔도 UUID로 연결된 배치는 유지됩니다. 방 삭제 시 개체는 보관함과 던전에 남습니다.
- 검색으로 방·개체·노트로 이동할 수 있습니다. `⌘K` / `Ctrl+K`를 지원합니다.
- **캠페인 내보내기**에서 JSON을 파일로 저장하거나 복사하세요. 가져오기는 파일 선택과 붙여넣기를 지원하며, 같은 캠페인이 이미 있으면 새 ID의 복제본으로 추가합니다.

## 저장

캠페인은 현재 브라우저의 `localStorage`에 즉시 저장됩니다. 저장 키는 `morkborg-codex:v1`이며 생성 초안, 선택한 화면과 배치 위치도 복원합니다. 가져온 개인 자료는 별도의 `morkborg-rules:v1` 키를 사용합니다.

브라우저, 프로필, 호스트 또는 포트가 바뀌면 저장 공간도 다릅니다. 사이트 데이터 삭제 전에 JSON을 내보내세요. 저장 공간이 부족하면 경고와 전체 백업을 제공하며, 손상된 저장 데이터는 덮어쓰지 않고 복구 파일 다운로드를 안내합니다. 여러 탭의 동시 편집은 마지막 저장이 반영되므로 한 탭에서 편집하는 편이 좋습니다.

## 구현 범위

[룰북 적용 범위와 출처](docs/rule-sources.md), [검증 기록](docs/acceptance.md)을 참고하세요. 기본 캐릭터는 Classless입니다. 선택 직업, 모든 솔로 이동 절차, 전투 자동화 전체를 구현한 가상 테이블톱은 아닙니다.

구조는 `src/domain`의 모델·참조 작업, `src/generators`의 주사위와 생성 절차, `src/storage`의 검증·저장, `src/components`의 편집 화면으로 나뉩니다. React 19, Vite, TypeScript strict, Zod, shadcn/Base UI를 사용합니다. WebMCP를 지원하는 브라우저에서는 로컬 캠페인 목록과 새 캠페인 생성 도구를 제공합니다.

## Credits

Campaign Codex is an independent production by Imwul and is not affiliated with Ockult Örtmästare Games or Stockholm Kartell. It is published under the MÖRK BORG Third Party License.

MÖRK BORG is copyright Ockult Örtmästare Games and Stockholm Kartell.

[MÖRK BORG Third Party License](https://morkborg.com/license/)

워크플로 참고: [DNGNGEN](https://dngngen.makedatanotlore.dev), [The Monster Approaches](https://monster.makedatanotlore.dev), [DNGNSTOCK by 1d10+5](https://1d105.itch.io/dngnstock). 이 사이트의 코드·표를 복제하거나 실행 시 호출하지 않습니다. 미리보기 이미지 `public/og.png`는 AI로 제작했습니다.
