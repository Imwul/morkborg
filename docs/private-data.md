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

기존 테스트 202개를 유지하고 서버·bootstrap·갱신 테스트 20개를 추가하여 **222개 통과, 실패 0, 건너뜀 0**을 확인했습니다. `npm run lint`, TypeScript·Vite build 및 정적 build의 평문/키 검사도 통과했습니다.

추가 테스트는 최초 요청 병합, 새로고침 캐시, 부분 자료 보충, NPC 이름 표의 selector/override, 번역 갱신과 수동 편집 보존, import 성공·실패 경합, 탭 간 CAS 충돌, 오프라인과 재시도, 잘못된 묶음 거부, 자동 확인 off/on, 5분 제한, commit 후 import, 서버 키 누락/불일치, GCM/버전/hash 검증, read-only HTTP 응답을 다룹니다. 캠페인 저장 문자열이 변하지 않는 것도 확인했습니다.
