# Display Translation Integrity Pass

## A. Baseline

감사 기준 커밋: `cdbefec002c047d3f702860bd3b89d04e70bec56`.
코드 변경 전에 전체 suite를 실행했다: **880/880 PASS**, 실패·skip 0.
최초 sandbox 실행은 tsx IPC 권한 오류로 suite 시작 전에 종료됐으며, 권한을 갖춘 재실행 결과가 이 baseline이다.

| Registry | Before | After |
|---|---:|---:|
| References | 1,001 | 1,001 |
| Tables | 546 | 546 |
| Rollable tables | 518 | 518 |
| Original rows | 12,310 | 12,310 |
| Creature references | 95 | 95 |
| Books | 9 | 9 |
| Procedure-kind references | 69 | 69 |
| OracleProcedures | 58 | 58 |

기존 미추적 `docs/translation-display/`, `tests/browser/`는 이번 변경에 포함하지 않았다.

## B. Display Pipeline Audit

Primary는 `referenceShortName(entry)`이다. 기존의 명시적 short-name override와 책 약어 처리를 그대로 사용한다. Secondary는 short name이 아니라 **full `entry.title`**에서 출발했다. 이번 변경은 primary 이름·접근성 이름·activation ID를 바꾸지 않는다.

기존 title 경로는 `Translation` → explicit `titleTranslationKo`가 있으면 사용, 없으면 `translateGeneratedText` → `polishKoreanTranslation`이었다. NFC 기준 원문과 같거나 빈 문자열이면 span을 만들지 않았다.

범용 번역기의 exact map은 UI vocabulary, rules rows와 inline followup, creature/outcast의 번역 필드, oracle rows/blocks/guidance, notes dictionary를 수집하고 UI vocabulary가 최종 우선한다. Exact hit가 없으면 가장 긴 phrase 조각을 연결한다. 이 map은 본문 번역에도 사용되므로 **문자열 일치와 현재 제목에 대한 소유권은 다르다**.

변경 후 reference 제목은 `ReferenceTitleTranslation` → `referenceDisplayTitle`을 사용한다. 적용한 기존 위치는 8곳이다: main heading, reference group, reading participant, compact Related, reading Related, Search/Related `ReferenceRow`, contextual `ReferenceNextSteps`, `CreatureParticipants`. 본문·굴림 결과·생성된 reading 이름의 범용 `Translation`은 유지한다. Recent/Pin/Workbench header에 새로운 secondary를 추가하지 않았다.

9개 book/source label, type suffix, dice notation, relationship label은 presentation이다. 이를 번역 제목이나 검색 alias로 재분류하지 않았다.

## C. Provenance Inventory

Fresh registry 1,001개를 실제 기존 helper로 다시 계산했다.

| Before secondary provenance | 수 |
|---|---:|
| Explicit `titleTranslationKo` | 165 |
| Owned exact source-row title translation | 78 |
| Normalized whole-title notes mapping | 8 |
| Explicit whole UI/application name | 9 |
| Own creature Korean name (다른 경로 이후 남는 분류) | 4 |
| Broad-global exact hit, wrong owner | 1 |
| Generated/composed helper | 82 |
| **Rendered Korean secondary 합계** | **347** |
| 원문과 같은 helper, 기존 suppression | 22 |
| Empty helper / secondary 없음 | 632 |

Trusted 264개는 Search의 A 257 + B 7과 일치한다. 이 일치는 감사 결과이며 display 여부를 search boolean으로 결정하지 않는다. 예를 들어 useful helper 65개는 표시하지만 검색 이름으로 인증하지 않는다.

## D. Tier C Audit

83개 전체를 source fragment와 실제 dictionary owner까지 추적했다.

| Display class | 수 | 결정 |
|---|---:|---|
| Class 1 Trusted | 264 | 기존 표시 유지 |
| Class 2 Uncertified but useful | 65 | 기존 출력 유지, search 인증 없음 |
| Class 3 Misowned | 1 | secondary 숨김 |
| Class 4 Malformed / misleading composition | 17 | secondary 숨김 |
| Class 5 Unchanged | 22 | 기존 suppression 유지 |

83개 Tier C 중 31개는 생물 이름·유형 조합, 8개는 지역명·Discovery, 7개는 번호가 있는 NPC encounter·직업, 나머지 19개는 검토한 문자 그대로의 보조 표현으로 유지한다. 이름·종류·지역·번호와 분리 기호가 의미를 유지하는 경우다. 중복된 `NPC 인물 외모`는 다소 장황하지만 의미가 바뀌지는 않으므로 취향만으로 숨기지 않았다.

Private 전체 감사: `outputs/display-translation-integrity/tier-c-audit.json`. 각 항목에 reference ID, canonical title, 기존 Korean string, exact/composition 경로, 실제 fragment owner, search certification, display class, keep/suppress와 개별 근거가 있다. `baseline.json`에는 1,001개 전체 provenance와 변경 전 검색 결과 배열이 있다. 이 파일들은 public build에 들어가지 않는다.

숨긴 18개는 다음과 같다. 한국어를 새로 고쳐 쓰지 않았다.

| Source title | 구체적인 suppression 근거 |
|---|---|
| Adventure Spark | 모험의 발상/발단이라는 기능을 물리적인 불꽃으로 조합 |
| Room Shape | 형태를 뜻하는 명사 Shape를 동사 빚어내다로 변경 |
| Yes or No? | 접속사를 원문 identity `Or`로 남긴 불완전한 질문 조합 |
| Reveal a Danger | 동사 원형과 번역하지 않은 관사 `A`를 연결 |
| Character Appearance | 인물의 외모를 인격의 외모로 변경 |
| Mythic Curses | 번역 owner가 Mythic이 아닌 AITC festival-subject row 7 |
| Noble House | 귀족 가문을 물리적 집으로 변경 |
| Random Event Focus | 사건 대상/범주 명사를 집중하다라는 동사로 변경 |
| Special Traps | 형용사 Special을 특수 효과라는 별도 명사로 변경 |
| Street Shape | 도로 형태 명사를 빚어내다라는 동사로 변경 |
| Hidden Element | 숨은 요소를 화학적 원소로 변경 |
| Broken — Injury | 인물의 Broken 게임 상태를 물리적인 부서짐으로 표시 |
| Foul Psychompomp — Summon | 분리된 table label 끝에 소환하다라는 동사 원형을 연결 |
| The Black Salt Wind — Wind Strength | 바람을 바람 소리로, 강도를 캐릭터의 근력으로 변경 |
| Dead God’s Prophet — Two Gifts | 수량 표현이 문법적으로 성립하지 않는 둘 선물 |
| City Crawl — Failure | 도시 탐색을 땅에서 기어가는 동작으로 변경 |
| Hawk as Weapon | 관계어 as를 identity `As`로 남겨 관계를 번역하지 못함 |
| City Crawl | 도시 탐색을 땅에서 기어가는 동작으로 변경 |

## E. Policy Decision

1. Owned whole-title evidence가 있으면 기존 제목 번역을 유지한다.
2. Whole-title ownership은 없지만 현재 표현이 의미를 보존하는 것으로 검토된 65개는 **보조 helper로만** 유지한다.
3. 잘못된 ownership 1개, 의미·문법 변경 17개는 secondary만 숨긴다.
4. 원문과 같은 출력과 빈 출력은 기존처럼 표시하지 않는다.
5. 앞으로 들어오는 미검토 composition은 자동 승인하지 않는다. 이미 검토한 ID라도 source title이나 output이 바뀌면 재검토 대상이다.

Search vocabulary 확장, 새로운 번역, registry alias, dictionary 번역 추가, source fixture 변경은 없다. 검토된 useful helper도 검색 이름으로 승격하지 않는다.

## F. Implementation

`referenceTitleEvidence.ts`는 이전 Search Pass의 explicit/UI/dictionary/owned-row/creature evidence 계산을 그대로 추출했다. 기존 `referenceSearchTitles.ts`는 동일한 검색 API와 admission 결과를 유지한다. Display는 search certification 함수를 호출하지 않고 owned evidence를 독립적으로 읽는다.

`referenceDisplayTitles.ts`는 별도 display policy이다. `reviewedDisplayHelpers.ts`에는 현재 83개 출력의 class와 **source title + 기존 output fingerprint**만 있다. 한국어 번역 dictionary가 아니며, fingerprint에서 텍스트를 생성하지 않는다. 실제 private helper가 이전 검토 결과와 같을 때만 class를 적용한다. FNV-64는 변경 감지용이며 보안 hash나 source integrity 증명으로 주장하지 않는다.

Owned evidence는 registry 구축 시 한 번 수집한다. Display fallback 결과는 entry 객체별 WeakMap에 보관하며 rules 또는 oracle pack 교체 시 폐기한다. 새 registry는 새 entry identity를 사용한다. 렌더마다 registry/table/row 전체를 훑지 않는다. Storage namespace·schema·migration은 추가하지 않았다.

`ReferenceTitleTranslation`은 기존 class/lang을 가진 span 또는 null만 반환한다. Null일 때 wrapper, dash, 괄호, aria label을 새로 만들지 않는다. CSS·폰트·간격·타이포그래피·카드·navigation 변경은 없다.

## G. Before / After Display Coverage

| Metric | Before | After |
|---|---:|---:|
| Korean secondary strings rendered | 347 | 329 |
| Trusted secondary A+B rendered | 264 | 264 |
| Approved deterministic app titles (위 264의 B 부분집합) | 7 | 7 |
| Tier C rendered | 83 | 65 |
| Tier C suppressed | 0 | 18 |
| Misowned exact-global rendered | 1 | 0 |
| Misowned exact-global suppressed | 0 | 1 |
| Generated/composed rendered | 82 | 65 |
| Generated/composed suppressed | 0 | 17 |
| Unchanged/nontranslation suppressed | 22 | 22 |
| Primary titles lost | 0 | 0 |
| Search-certified trusted secondary | 264 | 264 |
| Displayed but not search-certified | 83 | 65 |

Trusted preservation **264/264 (100%)**. Unsafe suppression **18/18**. Useful preservation **65/65**. False suppression **0**. 모든 primary short name과 canonical title이 비어 있지 않으며, 숨긴 18개 모두 canonical query로 target을 찾는다.

## H. Concrete Examples

| 종류 | 실제 source → 기존 helper | After |
|---|---|---|
| Explicit trusted | Weather의 명시적 제목 번역 | 기존 출력 그대로 |
| Owned row | Battle axe → 전투 도끼 | 유지 |
| Normalized whole-title | Signs Of Ambush → 매복의 징후 | 유지 |
| Own creature name | Starved peasants → 굶주린 농민 | 유지 |
| Application title | RECLVSE · RESOLUTION → 기본 판정 | 유지 |
| Misowned exact hit | Mythic Curses → 저주 | secondary 없음, Curses 유지 |
| Malformed composition | Room Shape → 방 빚어내다 | secondary 없음, Room Shape 유지 |
| Useful uncertified | Dungeon Entrance → 던전 입구 | 유지, search 인증 없음 |
| Useful creature composition | Zukuma · Berserker → Zukuma · 광전사 | 유지, search 인증 없음 |
| Unchanged proper name | Pistolet → Pistolet | 기존처럼 secondary 없음 |

## I. Search Regression

| Contract | After |
|---|---:|
| Trusted secondary target present | 264/264 |
| Strict unambiguous trusted first result | 257/257 |
| Gameplay fixed probes | 33/33 |
| Curated Korean aliases | 120/120 |
| Korean primary titles | 36/36 |
| Own Hangul creature names | 57/57 |
| Trusted Korean procedure names | 4/4 |
| Canonical targets present | 1,001/1,001 |
| English-only canonical target rank changes | 0/962 |

실제로 변경 전후 **1,001개 canonical query의 전체 result ID 배열**과 **347개 기존 secondary query의 전체 result ID 배열**을 비교했다. 변경 0이다. 모호한 trusted query의 기존 분모와 순위 처리도 유지한다. Tier C 83개는 useful/suppressed 구분과 관계없이 모두 미인증 그대로다. `방 빚어내다`를 alias로 넣지 않았으며 해당 query는 여전히 zero result다. Death/Shield, source/book/type, paired alias 회귀도 기존 테스트 그대로 통과했다.

## J. Browser Acceptance

실제 Codex browser에서 localhost 앱을 조작했다. 자동 테스트를 아래 flow로 세지 않았다. 기준 구현에서도 Room Shape / Curses의 잘못된 secondary를 먼저 재현했다.

| 실제 flow | 입력 / 관찰 |
|---|---|
| Trusted heading/search | `날씨` → `Weather / 날씨`; Reaction → `Reaction / 반응`; 첫 결과 유지 |
| Normalized title | `매복의 징후` → `Signs Of Ambush / 매복의 징후` |
| Owned row | Battle axe → `Battle axe / 전투 도끼`; `전투 도끼` query에서도 해당 결과 |
| Creature | `굶주린 농민` → Starved peasants / 굶주린 농민 |
| Application | `기본 판정` → RECLVSE RESOLUTION / 기본 판정 |
| Fixed creature + useful helper | Zukuma → 기존 `Zukuma · 광전사`; 네 공격 항목을 모두 읽으며 자동 선택 결과 없음 |
| Misowned | Curses → Mythic Curses; heading/search row에서 저주만 없어짐 |
| Generated | Room Shape → heading/search row에서 방 빚어내다만 없어짐 |
| Useful fallback | Dungeon Entrance → 던전 입구 유지 |
| Related | Curses · Meaning pair → **USES Curses** → Curses. 저주 secondary 없음; target open 후 roll result 수 0 |
| Continuity | Sample Rooms physical `1,1` → 11 Inscriptions; child physical `3` → Hypnotic; Room Shape 검색/open → Recent Sample Rooms → Hypnotic 복원 |
| Mixed | Stash Item — Weak Hit physical `5` → NPC가 전리품을 가져가려는 결과 → FOLLOW-UP NPC → Related SD → Related Yes or No? → Recent Stash 원래 결과 → Workbench Sample Rooms → Hypnotic 및 Copy 복원 |

실제 clipboard 출력:

```text
Sample Rooms

Inscriptions, the motifs are

↳ Hypnotic
```

Same output을 Recent 복귀 및 Workbench 복귀 뒤 clipboard에서 읽었다. 테스트로 추가한 Sample Rooms Workbench item은 검증 후 접었다. 기존 Pin 3개는 변경하지 않았다. Session/campaign/save/progression 요구, 자동 roll, 새 navigation mode가 나타나지 않았다. Browser error log 0.

증거: `outputs/display-translation-integrity/browser-evidence.json`. Browser에서 RNG 내부 counter를 주입하지 않았다. Open-only 결과 미생성과 원래 결과 보존을 관찰했으며, 호출 수준 RNG0 증명은 아래 automated traps와 기존 회귀에 구분해 기록한다.

## K. Responsive Acceptance

각 viewport에서 trusted, suppressed, long primary, trusted search result, suppressed search result, Related의 **6개 상태**를 검사했다. 총 24개 상태와 별도 360px Related 상세 screenshot을 저장했다.

| 실제 viewport | 검사 | Document overflow | Empty secondary |
|---|---:|---:|---:|
| 360 × 800 | 6 | 0 | 0 |
| 768 × 1024 | 6 | 0 | 0 |
| 1440 × 1000 | 6 | 0 | 0 |
| 3440 × 1440 | 6 | 0 | 0 |

`scrollWidth === clientWidth`를 모든 상태에서 확인했다. Scrollbar가 있는 화면은 content width가 15px 작다. 긴 `The Black Salt Wind — Wind Strength`는 기존 flow에서 줄바꿈되고 primary를 숨기지 않는다. 번역 span이 사라진 곳에 빈 줄/구분자가 생기지 않는다. Trusted secondary·source metadata·USES label도 겹치지 않는다. 모바일의 기존 가로 스크롤 필터/Recent strip semantics를 변경하지 않았다.

검사 파일: `outputs/display-translation-integrity/responsive-evidence.json`, `{360,768,1440,3440}-{trusted,suppressed,long-primary,search-trusted,search-suppressed,related}.png`, `360-related-detail.png`.

전체 페이지 캡처가 모바일 화면을 왜곡한 사례가 있어 해당 캡처는 실제 viewport screenshot으로 교체하고 현재 DOM 폭/스크린샷을 다시 확인했다. 제품 CSS 수정으로 캡처 문제를 우회하지 않았다. 검증 후 viewport override를 reset했다.

## L. Integrity

Before/after private canonical bundle SHA-256:

`edb000ad6a23ee13ccdb221732e770977cc6f375aca03621c8f0328441ba60c9`

직접 계산한 양쪽 hash와 integrity JSON이 동일하다. Canonical fixture, ID, original row, range/weight, PDF/source provenance, scenario exclusion, 책, 저장된 Dungeon/Campaign, import/migration, Pin/Recent/Workbench storage, Reading Continuity state 코드는 변경하지 않았다.

| Relationship / dice | Before = After |
|---|---:|
| Stored Related | 3,103 |
| Visible default Related | 2,127 |
| Verified forward procedure pairs | 79 |
| Deterministic reverse pairs | 79 |
| Contextual UI edges | 247 |
| Contextual rows | 200 |
| Contextual tables / references | 43 / 43 |
| Fixed selector LOOKUP | 9 |
| Visible self links | 0 |
| Validated physical combinations | 12,518 |

Core Miseries 36 rows, 7:7 footer 분리/PDF page 20, inline child 5개 parent, 518 rollable table과 dice grammar가 그대로다. Parent/child transient identity, Recent/Workbench continuity, Pin bookmark, reload clear, stale-child invalidation, composed Copy, 외부 FOLLOW-UP/LOOKUP 비합성 정책을 기존 회귀 suite에서 유지했다.

새 RNG trap은 1,001개 title read와 title span render, useful/malformed/misowned classification, 실제 contextual Related 렌더를 검사한다. 기존 fixed creature/Zukuma, navigation/restore/Copy, physical lookup RNG0, explicit generation의 RNG 회귀도 통과한다.

## M. Tests / Lint / Build

| 검증 | 결과 |
|---|---:|
| Baseline automated tests | 880/880 |
| Final automated tests | **902/902** |
| New tests | **22**, 한 새 파일 |
| Modified existing test files | **0** |
| Failed / skipped / cancelled | **0 / 0 / 0** |
| lint | PASS |
| Production build | PASS |
| Public build privacy/static-file check | PASS, 75 static files |
| git diff --check | PASS |
| Canonical before/after comparison | identical |

새 파일: `tests/reference-display-integrity.test.ts`. 실제 canonical registry 전체 보존/분류, owned-row/normalized/creature/UI paths, concrete unsafe examples, useful helpers, no empty wrapper, primary identity, 모든 suppressed target의 canonical 검색, Search/Display 분리, RNG0, 데이터 무변경, source-title 변경 guard, registry/rules/oracle pack 교체 cache invalidation, 실제 Related render를 검사한다.

기존 assertion을 삭제·완화하거나 expected query/target을 수정하지 않았다. Browser flow와 screenshot은 902 automated test 수에 포함하지 않는다.

## N. Remaining Boundaries

65개는 의도적으로 **uncertified helper**로 남는다. 완전한 제목 번역으로 새 인증을 부여하지 않으며, registry alias로 저장하지 않는다. 같은 출력이어도 source/title ownership과 display usefulness는 별개다.

숨긴 18개에는 이번 작업에서 대체 번역을 만들지 않았다. 번역을 추가하려면 별도 source-bound 검토가 필요하다. 향후 private pack에서 source title/output이 달라지거나 새 composition이 들어오면 기존 fingerprint로 자동 승인되지 않는다.

본문, row translation, 생성된 reading 이름은 이번 title integrity 범위 밖이며 기존 범용 번역기를 유지한다. 따라서 이 작업은 모든 문장 번역의 품질 인증이 아니다. Search, reading, relationship, roll, persistence의 기능 확장도 없다.
