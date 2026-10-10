# 여러 기기에서 사용하는 개인 사이트

개인 Vercel 배포에서는 Mac의 Node 서버나 Tailscale을 켜 두지 않고 같은 사이트 주소로 모든 생성기와 한국어 자료를 사용할 수 있습니다. 캐릭터·던전·메모 등 직접 저장한 기록은 각 브라우저에 저장합니다. 기기 간 기록 자동 동기화는 이 구성에 포함하지 않습니다.

## 배포 구성

- Vercel의 **Security → Deployment Protection → Vercel Authentication → All Deployments**를 먼저 적용합니다. 본인 계정만 프로젝트에 접근할 수 있도록 유지하고, 공개 예외나 공유 우회 링크를 추가하지 않습니다. 인증 보호는 페이지·자료 API·정적 자산 전체에 적용됩니다.
- 기존 서버 전용 환경변수 `MORKBORG_DATA_KEY`를 유지합니다. 키를 Git, 프런트엔드 환경변수나 브라우저에 넣지 않습니다.
- Production 환경변수 `MORKBORG_HOSTED_GENERATORS=1`을 설정한 뒤 배포합니다. 이 값은 기능을 활성화하는 설정이며 인증 수단이 아닙니다. 일반 공개 배포에서는 설정하지 않습니다.
- `npm run data:publish:generators`가 검증된 DNGNGEN·SCVMBIRTHER·The Monster Approaches 스냅샷과 일치하는 한국어 도움말을 하나의 AES-256-GCM 암호화 자산으로 발행합니다. 기존 발행 키를 사용하며 개인 원문 파일은 계속 Git에서 제외합니다.
- `api/private-generator.ts`는 암호화 자산의 파일 SHA-256, 인증 태그·revision과 원문 스냅샷 체크섬을 검증한 뒤 요청한 생성기만 반환합니다. 클라이언트는 기존 `/__private/dngngen`, `/__private/scvmbirther`, `/__private/monster` 경로를 그대로 사용합니다. Vercel rewrite가 이를 보호된 Function으로 연결합니다.
- 원문 선택, 한국어 표시, 주사위 가중치와 재굴림은 기존 생성기 코드가 처리합니다. 생성할 때 외부 원본 사이트나 Mac 서버를 호출하지 않습니다.

Vercel Authentication의 All Deployments는 현재 무료 플랜에서도 지원합니다. [Vercel 공식 변경 안내](https://vercel.com/changelog/protect-production-deployments-for-free-on-every-plan).

## 새 자료를 반영할 때

검증된 로컬 스냅샷과 한국어 도움말을 갱신한 뒤 `npm run data:publish:generators`를 실행하고 암호화된 `public/hosted-generators/` 자산을 배포합니다. 일반 룰북·Oracle·Fate Chart는 기존 `npm run data:publish` 흐름을 사용합니다. 로그인 보호를 유지한 상태에서 사이트만 갱신하면 모든 기기가 같은 자료를 받습니다.

## 기존 기록 옮기기

Mac 서버 주소와 Vercel 주소는 서로 다른 브라우저 저장 공간입니다. 기존 보관함과 참고 설정을 옮기려면 이전 주소에서 백업을 내려받아 새 사이트에 복원합니다. 기존 브라우저 기록과 개인 서버의 파일을 배포 과정에서 삭제하거나 변경하지 않습니다.

## 확인

로그인하지 않은 접속은 Vercel 로그인으로 연결되어야 하고, 본인 계정으로 로그인한 접속에서는 룰북·Fate Chart와 세 생성기의 원문 및 한국어 결과가 모두 표시되어야 합니다. Mac 서버를 실행하지 않은 상태에서도 같은 동작을 확인합니다. 암호화 자산과 키의 경계는 기존 build/privacy 검사를 통과해야 합니다.
