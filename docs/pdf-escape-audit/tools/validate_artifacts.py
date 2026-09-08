"""Validate audit consistency and coverage; not application behavior tests."""
from pathlib import Path
from collections import Counter, defaultdict
import hashlib
import json
import re
import subprocess
from urllib.parse import unquote

ROOT=Path(__file__).resolve().parents[1]
REPO=ROOT.parents[1]
DATA=ROOT/'data'
def read(name):return json.loads((DATA/name).read_text())
rows=read('master-rows.json')
metrics=read('coverage.json')
source={r['id']:r for r in read('source-inventory.json')}
app=read('app-inventory.json')
tables={r['id'] for r in app['tables']}
needs={}
ids=set()
for row in rows:
    assert row['id'] not in ids, row['id']
    ids.add(row['id'])
    if row['needId'] in needs:
        assert row['classification']==needs[row['needId']]['classification'],row['needId']
    needs.setdefault(row['needId'],row)
    assert isinstance(row['classification'],str) and row['classification'] in metrics['classifications']
    assert row['printedPage'] is not None
    assert all(1<=p<=source[row['bookId']]['pages'] for p in row['pdfPage'])
    assert all(t in tables for t in row['evidence']['tableIds'])
    for field in ['section','content','problem','minimalFix','evidence']:
        assert row[field],(row['id'],field)
    if row['frequency'] is not None:assert row['priority']==row['frequency']*row['friction']
for name,digest in metrics['inputSha256'].items():
    assert hashlib.sha256((DATA/name).read_bytes()).hexdigest()==digest,name
main={b['bookId'] for b in metrics['byBook']}
unique=[r for r in needs.values() if r['bookId'] in main]
assert len(unique)==metrics['mainBookUniqueNeedsIncludingPdfAppropriate']
assert Counter(r['classification'] for r in unique)==metrics['classifications']
assert sum(r['classification']!='PDF_APPROPRIATE' for r in unique)==metrics['mainBookUniquePlayRelevant']
assert sum(metrics['implementationGapSeverity'].values())==sum(metrics['classifications'][s] for s in ['PRESENT_BUT_INDIRECT','PARTIAL','MISSING'])

# Every physical source page has an explicit reading-ledger location.
ledgers={}
for book,file in [('core','CORE-BARE-BONES.md'),('core-full','CORE-FULL.md')]:
    section=(ROOT/file).read_text().split('## Page ledger',1)[1].split('\n## ',1)[0]
    ledgers[book]=[int(n) for n in re.findall(r'^\| (\d+) \|',section,re.M)]
for book,ledger in read('solo-city-page-ledger.json').items():
    ledgers[book]=[r['pdfPage'] for r in ledger]
    for row in ledger:assert all(k in needs for k in row['needIds']),(book,row)
for row in read('supplement-page-ledger.json'):
    ledgers.setdefault(row['bookId'],[]).append(row['pdfPage'])
    assert all(k in needs for k in row['needIds']),row
ledgers['mythic']=[]
for file,key in [('mythic-main-page-ledger.json','relatedNeeds'),('mythic-extra-page-ledger.json','needIds')]:
    for row in read(file):
        ledgers['mythic'].append(row['pdfPage'])
        assert all(k in needs for k in row[key]),row
for book,record in source.items():
    if book=='mb-cheatsheet':
        assert 'Mythic Bastionland' in (ROOT/'MB-CHEATSHEET.md').read_text()
        # Both pages have individual observations in that report.
        ledgers[book]=[1,2]
    assert sorted(ledgers[book])==list(range(1,record['pages']+1)),(book,'missing/duplicate page')

access=read('table-access.json')
assert {r['tableId'] for r in access}==tables
assert all(r['view'] and r['sourceDisclosure'] for r in access)
assert sum(not r['roll'] for r in access)==18
assert all(r['tableTitleSearchRank'] in range(1,6) for r in access)
assert all(all(k in needs for k in r['relatedNeedIds']) for r in access)
top=read('top-20.json')
assert [r['rank'] for r in top]==list(range(1,21))
assert all(all(k in needs for k in r['needIds']) for r in top)
assert all(len(r['needIds'])==len(set(r['needIds'])) for r in top)
assert all(r['priority']==r['frequency']*r['friction'] for r in top)
recheck=read('head-recheck.json')
browser=read('head-browser-recheck.json')
assert app['head']==metrics['head']==recheck['head']==browser['head']
assert all(r['effectPresent'] and r['effectIncludedInRoll'] for r in recheck['powerRendering'])
assert len(recheck['powerRendering'])==20
assert len(browser['records'])==20
query={r['query']:r for r in recheck['results']}
assert query['Powers']['top5'][0]['id']=='rule:core.casting'
assert query['마법']['top5']==[]

broken=[]
for path in ROOT.glob('*.md'):
    for target in re.findall(r'\]\(([^)]+)\)',path.read_text()):
        if target.startswith(('http:','https:','#')):continue
        target=unquote(target.split('#',1)[0]).strip('<>')
        target=re.sub(r':\d+$','',target)
        if target=='data/artifact-validation.json':continue
        if not (path.parent/target).exists():broken.append((path.name,target))
assert not broken,broken
tracked_diff=subprocess.check_output(['git','diff',metrics['head'],'--name-only'],cwd=REPO,text=True).splitlines()
assert all(p.startswith('docs/pdf-escape-audit/') for p in tracked_diff),tracked_diff
report=dict(auditedApplicationHead=metrics['head'],result='PASS',
            sourceRows=len(rows),uniqueMainNeeds=len(unique),playRelevant=metrics['mainBookUniquePlayRelevant'],
            sourcesWithCompletePageAccounting=len(ledgers),physicalPagesAccounted=sum(len(v) for v in ledgers.values()),
            canonicalTables=len(tables),tableViews=len(access),
            missingSourceOrTableIds=0,duplicateRowIds=0,conflictingNeedClassifications=0,brokenReportLinks=0,
            currentQueries=recheck['queries'],currentBrowserQueries=len(browser['records']),
            productionFilesChangedFromAuditedHead=0,
            boundary='Artifact/schema/page-accounting checks. Not a claim of exhaustive browser testing or application test/lint/build results.')
(DATA/'artifact-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2))
