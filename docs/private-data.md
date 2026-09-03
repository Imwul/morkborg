# 배포에서 개인 자료 복원

## 원인과 사용법

Vercel 배포 `https://morkborg-4e3y.vercel.app`의 `/rules/library.json`, `/rules/oracles.json`, `/rules/mythic-fate.json`이 모두 HTTP404였습니다. 로컬 서버의 같은 파일은 HTTP200이었습니다. Git에서 개인 원문 자료를 제외하는 구조에 비해 이전 UI는 `library.json`만 가져올 수 있었고, Oracle/Fate는 서버 파일에만 의존했습니다.

배포 주소에서 **개인 자료 JSON 가져오기**를 누르고 `morkborg-private-data.json` 묶음 또는 기존 세 파일을 선택하세요. Fate Chart/Oracle 오류 화면에서 바로 가져올 수 있고 **자료 및 규칙**에서도 가능합니다. 파일 이름 대신 내용의 구조로 종류를 판별합니다. PDF와 캠페인 JSON은 이 입력의 대상이 아닙니다.

로컬 앱의 **자료 및 규칙 → 개인 자료 전체 백업**으로 묶음을 만들 수 있습니다. 이번 작업의 사용자용 파일은 Git에서 제외된 `outputs/morkborg-private-data.json`에 준비했습니다. 파일을 서버에 업로드하지 않으며 공개 Git/배포 자산에도 추가하지 않습니다.

## 저장과 검증

- IndexedDB `morkborg-private-data` 버전1 / object store `packs` / 키 `library`, `oracles`, `fateChart`.
- 가져온 파일을 모두 파싱하고 기존 Rules/생성기, Oracle Registry, Fate Chart 검증을 통과한 뒤 하나의 readwrite transaction으로 저장합니다. 저장이 완료돼야 활성 자료를 교체합니다.
- 개별 파일 또는 묶음을 지원하며 최대3파일, 총20MB입니다. 동일 종류 중복, 빈 묶음, 손상 자료를 거부합니다. Oracle만 먼저 가져오기도 가능합니다.
- 시작 시 IndexedDB → Rules의 구형 localStorage → 기존 서버 파일 순서로 읽습니다. 손상 캐시는 서버 fallback을 차단하지 않습니다.
- 늦게 도착한 이전 요청의 성공/실패가 사용자가 가져온 자료를 덮어쓰지 않습니다.
- 자료 가져오기는 캠페인/Chaos를 변경하지 않습니다. 현재 캠페인 저장은 schemaVersion5이며, 자료는 캠페인 localStorage 저장 용량을 사용하지 않습니다.
- 주소와 브라우저 프로필별 저장입니다. localhost에서 저장한 자료가 Vercel로 자동 이동하지 않습니다. 브라우저 사이트 데이터를 지우면 자료도 다시 가져와야 합니다.

## 검증 — 2026-09-03

원문 자료를 뺀 실제 production build를 별도 로컬 origin에서 실행했습니다. 첫 진입의 Fate Chart404/비활성 Roll을 확인한 뒤 UI 파일 선택으로 묶음을 가져왔습니다. 이후 CF5·50/50·55는 No + Random Event였고 Focus + Actions도 정상 작동했습니다. CF7로 변경하고 페이지를 reload한 뒤 표의75% 확률, 이전 CF5 판정/질문/사건 단서가 복원됐습니다. 서버에 자료가 없는 상태 그대로 Oracle493표/8권을 확인하고 Action1의 실제 굴림도 검증했습니다.

새 테스트5개: Oracle 단독 가져오기와 진행 중404 보존, 나머지 로더의 늦은404 보존, 손상/중복/캠페인 JSON 거부, 저장 실패 시 모든 기존 자료 보존, 세 자료 묶음 백업/재검증. 기존140개를 포함해 총145개가 통과했습니다.

Fate 오류 안내도 block 영역으로 정리해 문장과 버튼이 끊겨 보이던 표시를 수정했습니다. 원문 표와 판정 확률은 변경하지 않았습니다.

Production 빌드에서만 생긴 패널 위치 문제도 수정했습니다. CSS 변환이 `translate: none`을 transform으로 바꾸는 반면 기본 Dialog의 독립 translate는 남아, 패널과 닫기 버튼이 화면 위로 이동했습니다. Mythic 패널에서 기본 translate 클래스를 0으로 교체했습니다. 실제 정적 빌드에서 패널 top=0, 닫기 버튼 top=8px와 마우스 닫기·초점 복원을 확인했습니다.

## 암호화한 자동 갱신 — 2026-09-03

자동 확인 연결이 포함된 개인 자료 JSON을 한 번 가져오면 `배포 자료 · 자동 확인`으로 연결됩니다. 앱 시작, 온라인 복귀, 탭으로 돌아올 때와 열린 동안 5분 간격으로 새 자료를 확인하며, 최근 확인 후 5분 이내의 중복 확인은 생략합니다. `자료 및 규칙 → 배포 자료`에서 끄거나 지금 확인할 수 있습니다. 첫 연결은 주소·브라우저별로 한 번 필요합니다. 실패·미연결·수동 상태는 별도로 표시합니다.

`updateConnection`은 기존 IndexedDB `packs`에 자료와 함께 원자적으로 저장됩니다. 공개 배포에는 AES-256-GCM 암호문과 버전 안내만 포함합니다. 키는 개인 JSON과 Git에서 제외된 로컬 발행 설정에만 들어가며 요청 URL이나 서버로 보내지 않습니다. 캠페인 저장소에는 접근하지 않습니다.

새 판본은 일치하는 원문 항목의 한국어, 새로 검증한 개체와 Eat Prey Kill 참조 메타데이터를 반영합니다. 기존 Oracle의 새로운 표/항목을 자동으로 추가하지 않으며, 이미 설치한 Fate Chart도 교체하지 않습니다. 기존 영문, 주사위 범위·가중치, 사용자 추가 항목과 캠페인 기록을 보존합니다. 내려받기·복호화·검증·저장 실패 시 기존 자료를 계속 씁니다. 다른 탭이 먼저 자료를 바꾸면 같은 IndexedDB transaction 안에서 비교해 오래된 갱신을 취소합니다. 백업과 이전 형식의 수동 가져오기는 버전을 다시 확인하도록 처리합니다.

발행 절차: 개인 원문·번역 자료를 갱신하고 `npm run data:publish`를 실행한 뒤 앱과 암호화 자산을 기존 Vercel Git 배포로 반영합니다. `outputs/private-update-publisher.json`은 원래 키를 보관하므로 개인적으로 백업해야 합니다. 설정이 없으면 연결된 개인 자료 JSON에서 키를 복구하며, 기존 피드에 새 키를 임의 발급하지 않습니다. 일반 앱 수정만으로 새 원문이 만들어지지는 않습니다.

Production build는 로컬에 개인 원문 파일이 있어도 `dist/rules`를 제외하고 비공개 파일명 유출 검사를 수행합니다. 기존 localhost 자료와 Vercel 자료는 브라우저의 서로 다른 저장 공간이며, 연결 파일만 각 공간에 한 번 가져오면 이후 갱신을 받습니다.

## 자동 자료 갱신 감사 — 2026-09-04

- 실제 읽는 위치는 해당 사이트 origin의 `/private-updates/latest.json`과 여기에 지정된 암호화 JSON입니다. `updateConnection.manifest`는 이 같은-origin 경로만 허용합니다. 다운로드 키는 IndexedDB에 저장한 개인 JSON에서 읽고 요청에 포함하지 않습니다.
- 개인 JSON의 로컬 경로를 감시하거나 다시 여는 기능이 아닙니다. File System Access API, 파일 handle, 개발자 개인 절대 경로를 앱 코드에서 사용하지 않습니다. OS의 일반 파일 선택 후 File API로 읽습니다.
- 이 흐름에는 localhost 조건 분기가 없습니다. Git/Vercel에 발행 자산이 포함되면 배포에서도 동일하게 실행됩니다. 미연결 브라우저는 새 파일을 자동으로 발견할 수 없으므로 최초 수동 가져오기가 필요합니다.
- 자동 확인은 IndexedDB·Web Crypto·AbortController가 있는 환경에서만 표시합니다. 요청 시간 제한은 Safari 호환성을 위해 `AbortSignal.timeout` 대신 AbortController와 15초 타이머를 사용합니다. 이는 기능 검출이며 브라우저 전체 동작을 검증했다는 뜻은 아닙니다.
- 기존 실제 Vercel 피드의 manifest·암호문 HTTP 200, 파일 hash 일치, Web Crypto 복호화를 검증했습니다. 최종 배포의 UI 검증 결과는 [NPC·조우 검증 기록](npc-encounter.md)에 기록합니다.
- Safari 26.6.2에서 실제 배포 페이지와 Oracle 메뉴가 열리는 것까지 확인했습니다. 네이티브 파일 선택 창에서 JSON 행 선택까지는 됐지만 업로드 버튼이 활성화되지 않았고, 마우스 제어도 창을 찾지 못했습니다. 9월 4일 재시도에서도 같았습니다. 따라서 **Safari 최초 import 및 자동 갱신의 종단 간 검증은 미완료**입니다. Safari가 지원하지 않는다고 단정하거나 자동 갱신 성공으로 표시하지 않습니다.
