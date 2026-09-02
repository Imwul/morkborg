# Oracle Library 구현·검증

이 단계는 기존 Campaign / Dungeon / Room / Character / Monster를 유지하면서 룰북의 전역 참조 라이브러리를 추가합니다. 캠페인 저장 형식은 v4 그대로이며, 생성 결과를 Notes에 추가할 때만 캠페인 내용이 바뀝니다.

## 자료와 inventory

[전체 inventory](INVENTORY.md)와 [기계 판독용 inventory](inventory.json)에 표별 ID, 원문 제목, 책, PDF/인쇄 페이지, 주사위, 항목 수, 목적, 기존 사용처, 구현 상태와 보류 사유를 기록했습니다. 조사 대상은 다음 8개 PDF입니다.

| 파일 / 책 | 실제 PDF 페이지 수 |
|---|---:|
| MÖRK BORG BARE BONES EDITION | 76 |
| Mörk_Borg_English / Full Edition | 96 |
| MÖRK BORG CULT: FERETORY | 68 |
| MÖRK BORG CULT: HERETIC | 68 |
| Sölitary Defilement Rules | 40 |
| Sölitary Depths Compressed | 36 |
| RECLVSE — A Solo Engine for Mörk Borg | 138 |
| Mythic Game Master Emulator Second Edition | 230 |

총 752쪽의 텍스트를 검색하고, 열 순서·숫자 범위·이미지 표를 페이지 렌더링으로 대조했습니다. 기존 193개 canonical 표는 배열을 유지했습니다. Core/Feretory 32개는 영어 구간 485개 중 482개가 정규화 일치하고 3개는 원문의 시각적 배치로 검증했습니다. 나머지 기존 161개도 실제 인용 페이지와 대조했습니다.

Mythic Meaning Tables는 **49개 / 4,900항목 전체**를 포함합니다. Actions 2개(PDF48 / p47), Descriptions 2개(PDF49 / p48), Elements45개(Locations/Characters/Objects 최초 PDF50 / p49, 나머지 PDF88–102 / p87–101)입니다. 부록의 재수록 4,900행과 전부 일치하며 재수록 페이지는 `duplicatePages`에 기록했습니다. Random Event Focus(PDF38), Scene Adjustment(PDF71), Prepared Adventure Event Focus(PDF165)도 포함합니다.

최종 Registry는 **493표 / 11,780항목**입니다. 자동 굴림 476표, 참고 전용 17표이며, 독립 표를 조합하는 절차는 52개입니다. 전체 inventory 568기록은 이 493표에 보류54·기존 항목 안의 하위표19·조합 참조2를 더한 수입니다.

보류54개는 Core4, FERETORY14, RECLVSE6, SD7, Depths3, Mythic20입니다. 주요 이유는 Fate/Chaos·능력 수정치 같은 사용자 입력, 비복원 카드/달력 상태, 기존 하위표와 중복, 다단 지역 생물 stat block의 미검증 열 배치입니다. 행별 제목과 페이지·구체적인 이유는 전체 inventory에 남겼습니다. Meaning Tables49개에는 보류가 없습니다.

## 구조와 공유 데이터

- `domain/oracle.ts`: SourceBook, OracleDefinition, OracleEntry, OracleProcedure, OracleResult, OraclePreferences.
- `data/oracles/index.ts`: 기존 RuleTable의 live adapter, 중앙 Registry 구성과 검색·필터. 원문 결과는 getter로 기존 RuleEntry를 참조하고, 해당 테이블과 generator의 `entries()`는 같은 canonical 배열을 사용합니다.
- `generators/oracleRoller.ts`: 원문 주사위와 범위 선택, 독립적인 복합 결과.
- `validation/oracleValidation.ts`: ID, source, dice, 범위 겹침·빈틈·불가능한 값·빈 텍스트 검사. 화면에서는 잘못된 표의 굴림을 막고 오류를 표시합니다.
- `storage/oracleStore.ts`: 별도 개인 Oracle pack 로딩·형식 검사·재시도. 기존 룰 pack 실패와 추가 pack 실패를 각각 재시도합니다.
- `domain/oracleNotes.ts`: 문맥별 Notes 대상 식별과 기존 문자열 뒤에 append.
- `components/Oracles.tsx`: 검색·책/분류/주사위 필터, 즐겨찾기, 원문 목록, Roller, 최대5개 임시 결과, Notes 추가.

기존 생성기의 주사위 선택 알고리즘은 교체하지 않았습니다. 기존 weightedPick·지역 가중치·후속표 처리를 유지하며, Oracle Roller만 보정 없이 원문 dice를 사용합니다. 기존 결과 배열을 복제하지 않았고, 동일한 Mythic 표의 부록 재수록도 별도 배열로 만들지 않았습니다. 같은 제목이라도 실제 결과가 다른 책의 표는 독립 표로 보존합니다. Full Core의 기본 규칙은 Bare Bones와 중복되고, Full Core 전용 Rotblack Sludge 표5개는 별도로 추가했습니다.

분류는 SOLO, ACTION, THEME, NPC, MONSTER, DUNGEON, ROOM, LOCATION, ENCOUNTER, TREASURE, EVENT, REACTION, RUMOR, WEATHER, NAME, DESCRIPTION, OTHER입니다. 분류·태그는 검색용 목록 정보이며 원문 결과 문구가 아닙니다.

## 주사위와 조합

공통 random/rollDie를 재사용합니다. d4/d6/d8/d10/d12/d20/d100과 실제 보조 주사위 d2/d3, 합산2d6/3d6을 지원합니다. d66은 서로 구분되는 d6 두 개의 십·일 자리이며 합계가 아닙니다. 유효 영역36개만 범위 검사하므로17/20/67 같은 값이 나오지 않습니다. d4×d6, d6×d8, d4×d8은 별도의 두 좌표로 선택합니다. 내부 숫자 좌표와 실제 두 주사위를 결과에 함께 표시합니다.

범위는 min/max로 저장하며 각 숫자마다 텍스트를 복제하지 않습니다. 카드·조건부 조회·명시되지 않은 주사위는 참조로 남기고 임의 분포를 만들지 않습니다. 결과 문장 안의 추가 피해·수량 주사위는 결과 문구로 보존하며 자동 실행하지 않습니다. 원문의 slash 선택지를 별도 주사위로 추첨하지 않습니다.

복합 조합은 Oracle ID 목록을 순서대로 굴립니다. Mythic Actions·Descriptions, Elements각각의 두 번 굴림, The4W와 RECLVSE Action+Theme, SD Room/Material/Sound 조합을 제공합니다. The4W의 Who/What/Where/Why도 각각 독립 결과이며 자동으로 서사 문장을 만들지 않습니다. 모든 결과는 각 표의 출처를 유지합니다.

## 저장·문맥·개인 자료

캠페인은 `morkborg-codex:v4` / schemaVersion4 그대로입니다. Oracle 정의·굴림 history는 저장 데이터에 넣지 않습니다. Campaign·Dungeon·Room·Character·Monster Notes에 추가한 문자열만 원래 레코드의 Notes에 저장합니다. 기존 텍스트의 공백·개행을 trim하거나 덮어쓰지 않습니다. Stable ID로 최신 대상을 다시 찾고, 다른 캠페인이나 삭제된 대상에는 기록하지 않습니다.

Oracle 진입 직전의 실제 section을 기준으로 기본 대상을 정합니다. 오래된 Character/Monster 선택값을 현재 문맥으로 오인하지 않으며, 기존 화면의 workspace는 그대로 두므로 돌아갈 때 같은 기록을 엽니다. 전역 검색으로 다른 기록을 열면 Oracle 화면을 닫습니다. 캠페인 목록에서도 전역 Oracle을 사용할 수 있습니다.

즐겨찾기와 마지막 책/분류/주사위 필터는 `morkborg-oracle-preferences:v1`에 schemaVersion1로 저장합니다. 캠페인 복제·삭제·가져오기와 분리됩니다. 새로고침 후 history는 지워져도 Notes와 즐겨찾기는 유지됩니다.

개인 자료는 `public/rules/library.json`(기존 표)과 `public/rules/oracles.json`(추가 표·출처 메타데이터) 두 파일입니다. 둘 다 Git에서 제외합니다. 새 checkout에서는 두 개인 파일을 별도로 복사해야 합니다. Oracle pack은 schemaVersion1, books, tables, procedures, overrides, entrySelectors를 갖고, entries 본문은 UI 컴포넌트에 하드코딩하지 않습니다. 공개 저장소에 원본 PDF·추출 본문·사용자 Campaign을 추가하지 않았습니다. 로컬 빌드는 이 개인 자료를 dist에 복사하므로 이번 작업에서는 배포하지 않았습니다.

## 실제 UI acceptance

기존 THE ASHEN PSALM(던전2·방8·캐릭터2·몬스터2)을 기준으로 실제 브라우저에서 수행했습니다.

| 단계 | 실제 확인 |
|---|---|
| 1 기존 데이터 | 캠페인 JSON을 기준값으로 보관. 추가 Notes·수정시각·화면 상태를 제외한 모든 기존 레코드가 작업 후에도 동일. |
| 2–3 ORACLES·총수 | 전역/캠페인 메뉴에서 진입, 전체 수와 책별 수 표시. |
| 4–6 필터·검색 | Mythic+ACTION+Action1로 정확히1표. SD+d66은 Disposition/Profession2표. |
| 7 즐겨찾기 | Action1에 별표 지정. |
| 8–10 열기·10회 roll | Action1에서69,94,3,41,95,25,77,44,50,39를 실제로 굴림. 전부1–100 내이며 대응 원문 결과 표시. |
| 11 Roll All | Mythic Actions는 Expose / Benefits, Dungeon Descriptors는 Odd / Bleak을 각각 독립 결과로 표시. |
| 12–13 Dungeon | The Slave waste — copy에서 진입하고 해당 Dungeon Notes에 append. |
| 14–15 Room | Room3 문맥을 유지하고 Deathly / Chamber/Clearing을 해당 Room Notes에 append. |
| 16 Character | Hervör — Kergüs를 열고 Innocent / Pain을 캐릭터 Notes에 append. |
| 17 Monster | The Bone Orchard Widow를 열고 Strong / Animal을 몬스터 Notes에 append. |
| 18–20 reload | 실제 reload 후 JSON이 reload 전과 deep-equal. 모든 추가 Notes·Action1 즐겨찾기·필터 복원. |
| 21 기존 생성기 | Graven-Tosk 선택→제목 없이 생성→방4개 확인→제목·발단 각각 재굴림→후보 선택. 테스트용 던전을 UI 확인 후 삭제하여 원래 던전2개로 복구. 기존 자료는 동일. |

추가로 d66은 실제16(1,6)→Merchant,63(6,3)→Fanatical을 확인했습니다. Oracle이 열린 동안 전역 검색으로 기존 던전에 정상 복귀합니다. 모바일에서 목록의 표를 누르면 Roller 위치로 스크롤됩니다.

| 화면 폭 | document scrollWidth | Oracle 배치 | 화면 밖 입력/버튼 |
|---:|---:|---|---:|
| 360 | 345 | 목록1열, Roller1열 | 0 |
| 768 | 753 | 목록2열, Roller1열 | 0 |
| 1440 | 1425 | 목록2열 + Roller | 0 |
| 3440 | 3425 | 목록4열(각488.25px) + Roller994.5px | 0 |

네 폭의 실제 화면을 캡처해 확인했습니다. document가 viewport보다15px 작은 것은 세로 스크롤바이며 가로 overflow가 아닙니다. 기존 던전 후보의 항목과 방도3440에서 각각4열을 유지했습니다.

## 영문 타이포그래피

추가 요청에 맞춰 영문 큰 제목과 브랜드를 **Grenze Gotisch**, 본문·작은 목록 제목을 **Alegreya**로 변경했습니다. 한글·버튼·주사위 숫자·HP는 Pretendard를 유지합니다. 타이틀 대문자 강제 변환을 제거하고 기존 메모36px 행간은 유지했습니다. 서체와 라이선스는 `public/fonts`에 포함되어 오프라인에서도 같은 서체를 사용합니다.

세 Latin font 파일(normal/italic 포함)의 cmap에서 Ö/ö/ä/ü/ú와 결합 악센트 U+0308/U+0301을 확인했습니다. 실제 화면에서 **MÖRK BORG**, **Hervör — Kergüs**가 새 타이틀/본문 서체로 깨짐 없이 표시됩니다. 서체 변경 후에도360/768/1440/3440px에서 가로 넘침·화면 밖 컨트롤0개와3440px목록4열을 다시 확인했습니다. 출처와 라이선스는 [서체 설명](../../public/fonts/README.md)에 기록했습니다.

## 테스트·제약

기존77개 테스트를 유지하고 Oracle40개를 추가했습니다. 전체117개 통과,0실패,0skip. `npm run build`, `npm run lint`, `git diff --check`도 통과했습니다. 추가 테스트는 전체 ID/범위/출처 검증, d66/d100 전 값,2d6 분포, 좌표 주사위, 조합, 필터·검색·즐겨찾기, 다섯 Notes 대상 append/reload, 교차 캠페인/삭제된 대상 거부, canonical 공유 및 기존 생성 확률 보존을 검사합니다.

원문 ambiguity와 미구현 절차는 inventory 각 행에 구체적으로 남겼습니다. 특히 HERETIC Curse Cure12번은 원문이“do not”에서 잘려 있어 전체 표를 참조용으로 두었습니다. Mythic의 Names24 `Ell`/설명 `El`, Curses59 `Jealously`, Magic Item/Magical Item 제목 차이를 임의로 수정하지 않았습니다. RECLVSE Brute/Beast Archetype Skills는“굴리기”지시와1–6행이 있지만 D6가 생략되어 참고 전용입니다. HERETIC Spinal Husk의6+/11/12 겹침도 수정하지 않고 참고용으로 남겼습니다. RECLVSE/SD 조건부 판정, Mythic Fate/Chaos 행렬과 사용자 목록, 카드의 비복원 추출을 평범한 균등 표로 만들지 않았습니다.

고정적인 본문 중 보류된 표는 목록과 이유를 제공하며 실제 구현 수에 넣지 않습니다. 웹사이트 스크래핑이나 새 NPC/Encounter/battle/map/cloud/auth 기능은 추가하지 않았습니다. 빌드는 성공하지만 기존 단일 JS chunk가500kB를 초과한다는 크기 경고는 남아 있습니다.
