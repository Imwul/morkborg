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
- 캠페인/Chaos의 localStorage schemaVersion4·저장 키·이전 데이터는 변경하지 않았습니다. 자료는 캠페인 저장 용량을 사용하지 않습니다.
- 주소와 브라우저 프로필별 저장입니다. localhost에서 저장한 자료가 Vercel로 자동 이동하지 않습니다. 브라우저 사이트 데이터를 지우면 자료도 다시 가져와야 합니다.

## 검증 — 2026-09-03

원문 자료를 뺀 실제 production build를 별도 로컬 origin에서 실행했습니다. 첫 진입의 Fate Chart404/비활성 Roll을 확인한 뒤 UI 파일 선택으로 묶음을 가져왔습니다. 이후 CF5·50/50·55는 No + Random Event였고 Focus + Actions도 정상 작동했습니다. CF7로 변경하고 페이지를 reload한 뒤 표의75% 확률, 이전 CF5 판정/질문/사건 단서가 복원됐습니다. 서버에 자료가 없는 상태 그대로 Oracle493표/8권을 확인하고 Action1의 실제 굴림도 검증했습니다.

새 테스트5개: Oracle 단독 가져오기와 진행 중404 보존, 나머지 로더의 늦은404 보존, 손상/중복/캠페인 JSON 거부, 저장 실패 시 모든 기존 자료 보존, 세 자료 묶음 백업/재검증. 기존140개를 포함해 총145개가 통과했습니다.

Fate 오류 안내도 block 영역으로 정리해 문장과 버튼이 끊겨 보이던 표시를 수정했습니다. 원문 표와 판정 확률은 변경하지 않았습니다.

Production 빌드에서만 생긴 패널 위치 문제도 수정했습니다. CSS 변환이 `translate: none`을 transform으로 바꾸는 반면 기본 Dialog의 독립 translate는 남아, 패널과 닫기 버튼이 화면 위로 이동했습니다. Mythic 패널에서 기본 translate 클래스를 0으로 교체했습니다. 실제 정적 빌드에서 패널 top=0, 닫기 버튼 top=8px와 마우스 닫기·초점 복원을 확인했습니다.
