# PDF Escape Audit

감사만 수행한 결과다. 시작점은 **[최종 보고서](FINAL-AUDIT-REPORT.md)**다. 앱 수정 제안과 완료된 구현을 혼동하지 않는다.

| 보고서 | 내용 |
| --- | --- |
| [TOP 20](TOP-20-PDF-ESCAPES.md) | 실제 플레이 상황, 출처 페이지, 원인, 최소 수정 |
| [MASTER MATRIX](MASTER-MATRIX.md) | 모든 출처별 필요와 단일 분류 |
| [COVERAGE](COVERAGE.md) | 중복 제거 집계, 책·워크플로별 수치, P1 전체 목록 |
| [APP INVENTORY](APP-INVENTORY.md) | 현재 코드/설치 데이터의 참조·도구·내비게이션 |
| [PLAY WORKFLOWS](PLAY-WORKFLOWS.md) | 격리 브라우저와 노트북 시나리오, 실제 클릭 수 |
| [SEARCH AUDIT](SEARCH-AUDIT.md) | 전체 원래 검색 증거와 실패 사례 |
| [현재 HEAD 재검사](CURRENT-HEAD-RECHECK.md) | 이후 커밋을 반영한 검색·스크롤·Omens 재검증 |
| [TABLE ACCESS](TABLE-ACCESS.md) | 562개 표의 보기·굴림·선택자·누락 필드 |

책별 보고서: [Core Bare Bones](CORE-BARE-BONES.md), [Core Full](CORE-FULL.md), [FERETORY](FERETORY.md), [HERETIC](HERETIC.md), [Sölitary Defilement](SD.md), [Sölitary Depths](DEPTHS.md), [RECLVSE](RECLVSE.md), [Mythic 전체](MYTHIC.md)와 [후반/부록](MYTHIC-VARIATIONS.md), [Alöne in the Crowd](ALONE-IN-THE-CROWD.md). 추가 자료는 [SUPPLEMENT-AUXILIARY](SUPPLEMENT-AUXILIARY.md)와 최종 보고서의 자료 범위에 있다.

기계 판독: [분류·근거 JSON](data/master-rows.json), [CSV](data/master-matrix.csv), [집계](data/coverage.json), [원본 파일 메타데이터](data/source-inventory.json), [검증 결과](data/artifact-validation.json).

## 재현

설치된 private 데이터와 원본 PDF는 배포용 감사 산출물에 포함하지 않는다. `inspect_registry.ts`와 실제 브라우저 재검사에는 로컬 private 데이터/QA 저장소가 필요하다. 일반 집계·문서 검증은 커밋된 감사 데이터로 실행할 수 있다.

저장소 루트에서:

```sh
python3 docs/pdf-escape-audit/tools/aggregate_audit.py
python3 docs/pdf-escape-audit/tools/completion_reports.py
python3 docs/pdf-escape-audit/tools/final_report.py
python3 docs/pdf-escape-audit/tools/validate_artifacts.py
```

출처 페이지를 다시 추출하는 도구와 기존 source-row 작성 도구는 검토된 행을 덮어쓸 수 있다. 단순 집계를 위해 재실행하지 않는다. 원문/코드가 바뀌면 새 원문 검토와 실제 UI 확인 뒤 분류를 갱신해야 한다. 현재 결론은 최종 감사 HEAD와 당시 공급 데이터에 한정한다.
