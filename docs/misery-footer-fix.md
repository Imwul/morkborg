# Core Miseries 7:7 누락 — 원인과 최소 수정

## 결론

**구형 parser가 `forcedFinal`을 제거한 저장본이 최신 revision으로 남아 있었고, 이후 병합과 버전 확인도 누락 필드를 복구하지 못했다.** 현재 parser와 표 렌더러는 이미 해당 필드를 지원한다. 이번 수정은 `privateUpdates.ts`와 `publishedDataClient.ts` 두 런타임 파일에 한정했다. UI·CSS·표 컴포넌트·원문·schema·ID·굴림 엔진은 변경하지 않았다.

조사 대상은 실제 localhost 브라우저와 그 IndexedDB다. 캐시 및 서버가 함께 보고한 revision은 `1789023148949`였다. 같은 revision의 서버 응답에는 7:7 본문이 있었으나 캐시에는 없었다.

## 단계별 추적

| 단계 | 실제 확인 결과 |
|---|---|
| 1. Source fixture / 서버 원본 | `core.miseries`, `sourceBookId=core`, `dice=d66`, 일반 `entries` 36개. 별도 `forcedFinal={label:'7:7', text, sourcePage:20}` 존재. 로컬 API의 원본도 fixture와 일치 |
| 2. Parser | 현재 `parseOraclePack`은 보존. 이전 배포 `8127a36`의 schema와 parser를 추출해 같은 fixture로 실행하면 **forcedFinal만 제거됨**, 일반 36행은 동일. 당시 Zod object에 이 필드가 선언되지 않았음 |
| 3. Imported data | 현재 `parsePrivateData → importPrivateData → setOraclePack`은 본문과 PDF20을 보존. 구형 parser로 생성한 데이터에는 이미 이 필드가 없음 |
| 4. Persisted data / migration | 실제 IndexedDB `morkborg-private-data`, `packs/oracles`의 해당 표에 `forcedFinal` 없음. `serverConnection.revision`은 최신 값. 캠페인 localStorage가 이 데이터를 덮는 경로가 아니며, 캠페인 v6 migration과도 별개 |
| 5. Registry | 캐시·활성 store·registry 모두 동일하게 필드 없음. 해당 ID는 정확히 1개. 중복 제거가 footer를 버린 것이 아님 |
| 6. Reference filtering | `oracle:core.miseries`가 정상적으로 해당 표를 가리킴. 시나리오 제거 및 canonical 필터에 의해 제외되지 않음 |
| 7. Rendering props | 실제 ReferenceTable props는 `sourceBookId=core`, d66, 36행이지만 `forcedFinal` 없음. 출처 약칭 MB-BB와 내부 ID core의 불일치가 원인은 아님 |
| 8. Browser DOM | 안내는 기존 문구로 표시되지만, `forcedFinal?.label === '7:7'` 조건이 거짓이므로 `tfoot` 자체가 생성되지 않음. CSS로 숨겨진 상태가 아님 |

7:7은 일반 entry가 아니다. 독립 row ID나 `min/max`를 갖지 않는 기존 `forcedFinal` 객체이며, 일반 주사위 범위는 11–16, 21–26, …, 61–66이다. 77을 entries에 추가하는 수정은 하지 않았다.

SSR과 브라우저에서 다른 결과가 나온 이유도 입력 데이터 차이다. SSR 검증은 최신 fixture를 사용했고, 실제 브라우저는 구형 저장본을 사용했다. 앱은 `createRoot`로 시작하며 별도의 서버 HTML을 hydrate하는 구조가 아니다.

구형 저장본이 최초 생성된 순간의 로그까지 존재하는 것은 아니다. 다만 실제 저장본의 누락, 당시 배포 parser의 필드 제거, 현재 서버와 캐시의 같은 revision, 이전 병합의 필드 미복구를 각각 확인해 재현 가능한 원인 경로를 특정했다.

## 수정

1. `mergeOracleTranslations`: 정확한 Core Miseries d66 표에서 **기존 forcedFinal이 없는 경우만** 검증된 incoming 표의 7:7 / PDF20 필드를 채운다. 원문은 서버 자료에서 가져온다. 기존 최종 결과, 36개 entry, 사용자 메모·수정·번역을 덮어쓰지 않는다. 일반 서버 업데이트와 기존 개인 업데이트 경로가 같은 보정을 사용한다.
2. `createPublishedDataClient`: 캐시가 완전하고 revision이 같아도 위 필드가 없는 코어 표는 원본을 다시 요청한다. 같은 revision 복구에서는 전체 번역·자료 병합 결과를 저장하지 않고, 검증된 `forcedFinal`만 현재 Oracle 팩에 반영한다. Library와 Fate Chart는 쓰지 않는다.
3. 복구 이후에는 정상적인 revision metadata 확인으로 돌아간다. 새 migration 번호나 별도 상태 키가 없다. 기존 generation 확인 및 IndexedDB compare-and-swap을 유지해 다른 탭의 import를 덮지 않는다.
4. 자동 업데이트를 일시 중지한 설정은 유지한다. 이때 이미 사용할 수 있는 캐시는 그대로 두고, 명시적인 확인에서 복구한다. 오프라인·출처 필드 부재·낮아진 서버 버전은 저장본을 유지한다.

초기 복구 실험에서 전체 병합을 다시 실행하면 관련 없는 자료 메타데이터도 재처리되는 것이 관찰됐다. 최종 코드는 이를 피하도록 같은 revision의 복구를 한 필드로 한정했다. 최종 구현으로 실제 캐시에서 해당 필드만 제거한 뒤 재로드하여 복구했고, **세 자료 팩 전체가 실험 전 백업과 정확히 일치**했다. 구형 백업 import 후에도 같은 전체 내용 일치를 확인했다.

## Acceptance

| 항목 | 결과 |
|---|---|
| Core d66 일반 행 | 브라우저 tbody 36행 유지 |
| 일곱 번째 재앙 안내 | 유지 |
| 7:7 고정 본문 | 브라우저 tfoot 1행으로 표시 |
| 본문 출처 | 본문 바로 아래 `Core · PDF 20` 확인 |
| 일반 Roll / Reroll | 실제 UI에서 61, 42 확인. 일반 행 선택과 결과 일치 |
| 7:7 랜덤 제외 | 전체 d66 36개 조합을 실제 엔진으로 자동 검사. 77 없음, 수동 77 lookup 거부 |
| 같은 revision의 구형 저장본 | 실제 IndexedDB에서 누락을 재현하고 앱의 정상 로더로 복구. 다른 자료 팩 및 일반 행 불변 |
| Reload | 복구 및 import 후 재로드에서도 tbody 36 / tfoot 1 유지 |
| Import | localhost 진단 페이지에서 **기존 실제 importPrivateData 함수**로 footer 없는 백업을 가져온 뒤 서버 재확인·저장·일반 앱 재로드 검증 |
| 사용자 데이터 보존 | 최종 캐시 복구와 import 모두 실험 전 전체 Library / Oracle / Fate 팩과 일치. 최초 36행 해시도 변경 없음 |
| Registry / source | Reference 1,000, table 546, registry books 9, raw creature preset 89, source procedure 58 유지. Reference / Table ID 전체 일치 |
| 시나리오 전용 자료 | 기존 제외 상태 유지, 재앙 footer를 일반 굴림으로 재분류하지 않음 |

브라우저의 파일 선택 이벤트 자동화는 시간 초과되어 성공으로 계산하지 않았다. 해당 탭을 닫고 다시 열어 복구했으며, 파일 선택 UI와 구분하여 실제 브라우저 import 함수·IndexedDB·업데이트 경로를 검증했다. 테스트 진단 페이지와 브라우저 원본 백업은 Git에서 제외된 `outputs/misery-footer`에만 보관하고 배포 번들에 포함하지 않는다.

## 테스트와 변경 범위

- 전체 자동 테스트 **754 / 754 PASS**, 실패 0, skip 0. 이번 회귀 테스트 10개 추가.
- Lint PASS, TypeScript / Vite production build PASS, public build privacy 검사 **61개 파일 PASS**.
- 새 회귀 테스트: 같은 revision 복구·재로드, 새 revision 병합, 사용자 최종 결과 보존, 잘못된 source/page 차단, 업데이트 중지, 오프라인, 불완전 원본, import 경쟁 상태, 구형 백업 import, fixture→import→registry→SSR 및 36개 굴림 조합.
- 렌더러 `ReferenceTable.tsx`는 조사 직전 파일과 byte-identical. 디버그 계측을 제거했다. CSS 변경 0, schema 변경 0, 원문 변경 0.
- 처음 sandbox 안에서 실행한 `npm test`는 테스트 서버/tsx IPC 권한 때문에 실행되지 않았다. 권한을 허용한 최종 `npm test` 전체 실행 결과가 위 수치다.
- 이전에 완료한 Reference Desk 변경은 `6bb5997`로 별도 커밋했다. 이번 수정 커밋의 런타임 변경은 위 두 파일뿐이다.

## 증거

원문과 브라우저 백업은 공개 Git에 넣지 않았다. 로컬 `outputs/misery-footer/`에 다음 증거가 있다.

- `runtime-before.json`: 실제 캐시·parser·store·registry·reference·props·DOM의 누락
- `parser-trace.json`: 이전 배포 parser와 현재 parser 비교
- `server-before.json`: 같은 revision의 canonical Core 표
- `narrow-repair-integrity.json`: 최종 같은 revision 복구에서 전체 자료 일치
- `browser-after-import.json`: 브라우저 import 이후 저장본
- `dom-after-import-and-reload.json`, `footer-after.jpg`: 실제 최종 DOM 및 화면
- `counts.json`, `tests.txt`, `lint.txt`, `build.txt`: ID/count 및 실행 로그
