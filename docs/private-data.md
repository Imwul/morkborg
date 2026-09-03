# 서버 룰북 자료와 자동 갱신 — 2026-09-04

최초 접속에서 개인 JSON을 가져오던 단계를 제거했습니다. 룰북·Oracle·Mythic Fate Chart는 서버에서 자동으로 받고 브라우저에 캐시합니다. 플레이 기록은 기존 localStorage를 유지합니다.

## 서버

- `GET /api/rulebook-data`는 같은 배포의 암호화 자산을 읽는 Vercel Node Function입니다. 읽기 전용이며 다른 메서드는 405로 거부합니다.
- 발행 manifest의 경로·버전과 파일 SHA-256, AES-256-GCM 인증·AAD, 복호화된 버전과 묶음 구조를 확인합니다. 응답에는 `schemaVersion`, `revision`, `bundle`만 포함하며 bundle은 `library`, `oracles`, `fateChart`로 제한합니다.
- 키는 Vercel production 환경변수 `MORKBORG_DATA_KEY`에 저장합니다. 브라우저 코드, 요청 URL, 응답 JSON, Git, 정적 build에는 넣지 않습니다. 원본 PDF와 평문 생성표도 Git에서 제외합니다.
- 최신 revision을 가진 요청은 묶음 대신 작은 버전 응답만 받습니다. `Cache-Control: private, no-store`를 사용하며, 키 누락이나 파일 손상은 내부 경로·stack을 노출하지 않는 503으로 처리합니다.
- 이 사이트의 자료 API에는 별도 로그인 기능이 없습니다. 서버에서 원문 자료를 제공하는 구조이며 URL을 비밀번호나 접근 통제로 취급하지 않습니다.
- Vercel `includeFiles`가 암호화 발행 자산을 Function에 포함합니다. Vite 개발 서버에도 같은 handler를 연결하고 개발용 키는 Git에서 제외한 발행 설정에서 읽습니다.

## 브라우저 저장과 자동 확인

IndexedDB `morkborg-private-data`, version 1, object store `packs`를 유지합니다.

| key | 내용 |
|---|---|
| `library` | 검증된 생성표·번역·기존 개체 |
| `oracles` | 추가 Oracle, procedures, overrides, entrySelectors |
| `fateChart` | 검증된 Standard Fate Chart |
| `serverConnection` | `{schemaVersion:1, revision, enabled}`; 키 없음 |
| `updateConnection` | 구형 개인 JSON의 연결 정보. 이전 백업 호환용으로 남기며 새 서버 자동 확인에는 사용하지 않음 |

세 loader는 캐시를 먼저 읽고 누락 자료를 하나의 서버 요청으로 채웁니다. 전체 묶음과 합쳐진 Registry를 검증한 뒤 한 IndexedDB readwrite transaction으로 저장합니다. 자료가 없는 브라우저도 파일 선택 없이 시작할 수 있습니다. 일치하는 한국어와 새 표·책·절차·검증 개체를 추가하고, 기존 영문·가중치·범위·사용자 항목과 Fate Chart는 보존합니다. Oracle selector/override도 기존 사용자 설정이 우선합니다.

시작, 5분 간격, 탭 또는 네트워크 복귀 시 자동 확인합니다. 최근 확인 후 5분 이내에는 생략하고 **지금 확인**은 즉시 실행합니다. 자동 확인을 꺼도 아직 없는 종류의 자료는 첫 사용에 가져올 수 있으며 기존 종류의 번역은 덮어쓰지 않습니다. JSON 복원은 자료 백업용 선택 기능입니다.

진행 중 수동 import가 성공하면 이전 다운로드를 취소합니다. 다른 탭이 먼저 자료를 바꾸면 저장 직전 transaction 안의 비교로 오래된 쓰기를 거부합니다. 검증·통신·저장 실패 시 기존 자료와 revision을 유지합니다. 네트워크 타임아웃은 AbortController와 15초 타이머를 사용합니다.

Campaign/Chaos/생성 결과는 이 경로에서 읽거나 쓰지 않습니다. 캠페인 schemaVersion5와 localStorage migration은 [NPC·조우 문서](npc-encounter.md)를 참고하세요. 브라우저를 바꿔도 공통 룰북 자료는 자동으로 받아지지만 플레이 기록을 옮기려면 기존 Campaign 백업 기능을 사용합니다.

## 새 자료 발행

1. Git에서 제외한 원문·번역 묶음을 갱신합니다.
2. `npm run data:publish`로 암호화 자산과 manifest를 만듭니다.
3. 검증 후 Git에 반영하여 기존 Vercel 배포를 갱신합니다.

`outputs/private-update-publisher.json`은 기존 발행 키를 보관하므로 별도로 백업합니다. 기존 키를 잃었을 때 새 키로 자동 교체하지 않습니다. 로컬 JSON 파일을 수정하는 것만으로 사이트 자료가 바뀌지는 않습니다.

## 검증

기존 테스트 202개를 유지하고 서버·bootstrap·갱신 테스트 20개를 추가하여 **222개 통과, 실패 0, 건너뜀 0**을 확인했습니다. `npm run lint`, 브라우저용 TypeScript 검사, 서버용 NodeNext 모듈 검사, Vite build 및 정적 build의 평문/키 검사도 통과했습니다. 실제 컴파일된 Node entry point import도 성공했습니다.

추가 테스트는 최초 요청 병합, 새로고침 캐시, 부분 자료 보충, NPC 이름 표의 selector/override, 번역 갱신과 수동 편집 보존, import 성공·실패 경합, 탭 간 CAS 충돌, 오프라인과 재시도, 잘못된 묶음 거부, 자동 확인 off/on, 5분 제한, commit 후 import, 서버 키 누락/불일치, GCM/버전/hash 검증, read-only HTTP 응답을 다룹니다. 캠페인 저장 문자열이 변하지 않는 것도 확인했습니다.


## 실제 배포·Safari 검증

검증 URL은 `https://morkborg-4e3y.vercel.app/`입니다. 기능 검증 커밋은 `f1a2530734c05915e28610a8f4cee4147ee18283`, 서버 자료 revision은 `1788446996126`입니다.

- 배포된 `/api/rulebook-data`의 HTTP 200, JSON content type, `private, no-store`, revision과 세 pack을 확인했습니다. 응답에 `updateConnection`과 발행 키가 없었습니다.
- 기존 실제 배포 탭을 reload했을 때 **지금 확인을 누르지 않고** `새 자료와 번역을 적용했습니다.`가 표시됐습니다. 기존 캠페인의 두 Dungeon, Room 배치와 참가자 정보는 유지됐습니다.
- Safari에서 새 **비공개 창**을 열어 저장 자료가 없는 상태로 실제 URL에 처음 접속했습니다. 파일 선택·JSON import 없이 Oracle 목록 **491개 / 8권**이 준비됐습니다. Registry의 493개 원본 정의 중 Mythic Action/Descriptor 각각 두 표가 하나의 카드로 합쳐져 목록은 491개입니다.
- 같은 새 Safari 창에서 Fate Chart가 즉시 활성화됐습니다. CF5·50/50의 50%를 확인하고 CF6으로 변경하자 65%가 됐습니다. 실제 d100=100 결과는 Exceptional No였고, reload 후 CF6·65%·d100=100 결과와 최근 판정이 그대로 복원됐습니다. 비공개 창 안에서의 새로고침 복원 검증이며 창 종료 후 영구 보존을 뜻하지 않습니다.
- JSON 없이 `SAFARI AUTOLOAD CHECK` 캠페인을 만들고 NPC를 생성·저장했습니다. Graft, Poacher/trapper, Bent posture with a stick, Slimy/Insincere, Superstitious, Worship, Angered가 채워졌고 원문 아래 한국어가 표시됐습니다. NPC 출처는 기본 닫힘이었습니다.
- 같은 Safari에서 자료 및 규칙 화면의 입력·선택창과 좌우 버튼 정렬을 screenshot으로 확인했습니다. 이전 OS 파일 선택 창 문제는 새 자동 로딩 흐름의 전제 조건이 아닙니다.
- `src`, `api`, `server`에서 `/Users/`, `file://`, `showOpenFilePicker`, `FileSystemHandle` 검색 결과는 0건입니다. 개인 파일 경로를 앱 코드에서 감시하지 않습니다.

첫 Vercel 실행에서 확장자가 없는 ESM import가 실패한 것을 실제 호출로 발견해 `.js` 경로로 수정했습니다. 이후 서버용 NodeNext 검사를 build gate에 추가했고 재배포의 HTTP 200 및 위 UI 흐름으로 해결을 확인했습니다.

## 폼 정렬 검증

공통 `--control-height: 52px`를 사용합니다. 솔로 판정의 숫자 입력·select, 배치 수량과 ± 버튼, 참가자 연결 버튼, Oracle 검색 상자의 외곽 높이를 일치시켰습니다. 인라인 능력치, Chaos, 체크상자의 고유 크기는 유지합니다. RECLVSE 양쪽 설정은 controls/actions/help 행을 공유하는 subgrid로 정렬하며 모바일에서는 세로로 배치합니다.

| 실제 viewport | 확인 결과 |
|---|---|
| 360 × 800 | document 345px, 가로 넘침 없음. 모든 솔로 입력 52px, 두 판정 영역은 세로 배치. |
| 768 × 1024 | document 753px, 가로 넘침 없음. 세 입력 52px, 양쪽 버튼 top 일치. |
| 1440 × 1000 | document 1425px, 가로 넘침 없음. 세 입력 top 813.734px / height 52px, 양쪽 판정 버튼 top 881.734px / height 44px. |
| 3440 × 1440 | Sources document 3440px, 가로 넘침 없음. 세 입력 top 825.375px / height 52px, 양쪽 버튼 top 893.375px / height 44px. |

추가로 3440px에서 Oracle 검색 상자와 출처 select의 top 483.672px / 외곽 height 52px를 확인했습니다. 참가자 수량·±·연결 버튼은 top 937.578px / height 52px, Room 배치 select·수량·±는 top 1173.5px / height 52px였습니다. 실제 배포된 1440px 탭에서도 세 입력 height 52px와 양쪽 판정 버튼 top 일치를 재확인했습니다.
