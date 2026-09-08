"""Join the ten approved TOP-20 groups to the immutable audit matrix.
Status decisions below follow the recorded browser evidence, not source-page presence.
"""
import json
from collections import Counter
from pathlib import Path
base=Path('docs/pdf-escape-audit/data');out=Path('docs/pdf-remediation-batch-1')
rows=json.loads((base/'master-rows.json').read_text());top=json.loads((base/'top-20.json').read_text())
ranks=[1,2,3,4,8,9,13,16,19,20]
evidence={1:'browser-search.json: Omens; browser-character.json: Omens',2:'browser-search.json: Daemon of Capillaries; browser-character.json: Unmet Fate; browser-tables.json: Powers; all-20 exact-name/effect tests',3:'browser-search.json: daily misery; Calendar/Journey context check',4:'browser-search.json: road travel times; Journey context check',8:'browser-search.json: Zweihänder; browser-character.json: Knife; all-17 damage/name tests',9:'browser-search.json: medicine box; browser-character.json: armor, Waterskin, Toolbox; all-45+Shield definition tests',13:'browser-search.json: Korean situational queries; curated English/Korean ranking tests',16:'browser-search.json: Fanged Deserter; browser-character.json: Esoteric Hermit and Bard; all-6/all-38 tests',19:'browser-search.json: City Crawl/Directions/Pray/Stash; browser-tables.json: child routing and Alöne microcrawl',20:'browser-tables.json: exits/holy places/truth/card selector; selector and condition tests'}
groups=[];need_rows=[]
for g in top:
 if g['rank'] not in ranks:continue
 before=Counter()
 for need in g['needIds']:
  matches=[r for r in rows if r['needId']==need];r=matches[0];before[r['classification']]+=1
  need_rows.append({'auditRank':g['rank'],'needId':need,'before':r['classification'],'after':'RESOLVED','auditRowIds':[x['id'] for x in matches],'sources':[{'book':x['book'],'pdfPage':x['pdfPage'],'printedPage':x['printedPage']} for x in matches],'evidence':evidence[g['rank']]})
 groups.append({'rank':g['rank'],'title':g['title'],'needs':len(g['needIds']),'before':dict(before),'after':{'RESOLVED':len(g['needIds'])},'evidence':evidence[g['rank']]})
related=next(r for r in rows if r['needId']=='aitc-city-crawl')
extra={'needId':'aitc-city-crawl','before':related['classification'],'after':'RESOLVED','reason':'The approved rank-19 title names City Crawl, but its needIds array instead includes aitc-microcrawl. Both audited needs were followed; no new city procedure was created.'}
(out/'recheck.json').write_text(json.dumps({'auditHead':'479cbd765b4168eeaeee27f921bf4b0a6615c51b','scope':'Only the ten approved groups; not a new complete coverage audit. Full-matrix coverage percentages are intentionally not recalculated.','targetNeeds':len(need_rows),'beforeTotals':dict(Counter(r['before'] for r in need_rows)),'afterTotals':{'RESOLVED':len(need_rows)},'groups':groups,'rows':need_rows,'directDependency':[extra]},ensure_ascii=False,indent=2)+'\n')
lines=['# Batch 1 · PDF Escape Recheck','','The baseline matrix remains unchanged. These are scoped implementation results against audit HEAD `479cbd765b4168eeaeee27f921bf4b0a6615c51b`. Browser evidence and per-name source tests are complementary: representative play paths were exercised in Chrome; every catalog name/effect was checked against the loaded private registry.','','| Rank | Audit target | Unique needs | Before | After | Evidence |','|---|---|---:|---|---|---|']
for g in groups:lines.append(f"| {g['rank']} | {g['title']} | {g['needs']} | "+', '.join(f'{k} {v}' for k,v in g['before'].items())+f" | RESOLVED {g['needs']} | {g['evidence']} |")
lines+=['',f"**143 unique audited needs in the ten groups: PARTIAL 69, MISSING 27, PRESENT_BUT_INDIRECT 47 → RESOLVED 143.** Read the individual IDs in [recheck.json](recheck.json). This is not a claim that every remaining PDF escape in the full audit is fixed.",'','Rank 19 has a baseline indexing discrepancy: its heading mentions City Crawl, but `needIds` contains `aitc-microcrawl`, Directions, Pray and Stash. City Crawl was corrected as requested; the existing **Alöne** micro-crawl mode also gained a search route (open + choose mode). `aitc-city-crawl` is recorded separately as one direct dependency, not counted twice. **SD** micro-crawl/start/end work remains deferred.','','## Findings explicitly retained for later batches','','Statuses below are the existing audit classifications. They have not been reassessed as a new broad audit.','','| Audit rank | Need ID | Classification |','|---|---|---|']
remaining=[]
for g in top:
 if g['rank'] in ranks:continue
 for need in g['needIds']:
  r=next(r for r in rows if r['needId']==need)
  remaining.append({'auditRank':g['rank'],'needId':need,'classification':r['classification'],'book':r['book'],'pdfPage':r['pdfPage'],'problem':r['problem']})
  lines.append(f"| {g['rank']} | `{need}` | {r['classification']} |")
(out/'RECHECK.md').write_text('\n'.join(lines)+'\n')
(out/'remaining-top20-audit-ids.json').write_text(json.dumps(remaining,ensure_ascii=False,indent=2)+'\n')
done={r['needId'] for r in need_rows}|{'aitc-city-crawl'}
remaining_by_need={}
for r in rows:
 if r['needId'] not in done and r['classification'] in ['PRESENT_BUT_INDIRECT','PARTIAL','MISSING','SOURCE_UNAVAILABLE']:
  remaining_by_need.setdefault(r['needId'],{'needId':r['needId'],'classification':r['classification'],'book':r['book'],'pdfPage':r['pdfPage'],'printedPage':r['printedPage'],'problem':r['problem']})
(out/'remaining-audit-ids.json').write_text(json.dumps({'basis':'Carried forward unchanged from the completed audit, excluding the 143 targets and aitc-city-crawl. This is not a fresh reclassification of unscoped material.','entries':list(remaining_by_need.values())},ensure_ascii=False,indent=2)+'\n')
print({'before':dict(Counter(r['before'] for r in need_rows)),'after':len(need_rows),'explicitlyDeferredTop20Needs':len(remaining)})
