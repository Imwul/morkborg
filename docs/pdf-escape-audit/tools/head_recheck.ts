/** Read-only recheck of the existing audit queries at the current checkout. */
import {readFileSync, writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {buildOracleRegistry} from '../../../src/data/oracles/index.ts';
import {parseRulesPack, setRules} from '../../../src/storage/rulesStore.ts';
import {parseOraclePack} from '../../../src/storage/oracleStore.ts';
import {buildReferenceRegistry, searchReferences} from '../../../src/domain/references.ts';
import {oracleReadingText} from '../../../src/domain/referenceReading.ts';

const data='docs/pdf-escape-audit/data/';
const bundle=JSON.parse(readFileSync('outputs/morkborg-private-data.json','utf8'));
setRules(bundle.library);
const rules=parseRulesPack(bundle.library);
const registry=buildOracleRegistry(rules,parseOraclePack(bundle.oracles));
const index=buildReferenceRegistry(registry,rules);
const previous=JSON.parse(readFileSync(data+'search-probes.json','utf8'));
const queries=[...new Set<string>([...previous.map((r:any)=>r.query),'power','casting','권능','solo variant'])];
const results=queries.map(query=>({query,top5:searchReferences(index,query,{limit:5}).map(e=>({id:e.id,title:e.title,kind:e.kind}))}));
const powerRendering=registry.tables.filter(t=>['core.unclean','core.sacred'].includes(t.id)).flatMap(t=>t.entries.map(e=>({
  tableId:t.id,entryId:e.id,effectPresent:typeof e.metadata?.effect==='string',
  effectIncludedInRoll:typeof e.metadata?.effect==='string'&&oracleReadingText(e).includes(e.metadata.effect),
})));
const report={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  baselineHead:'a50d2425deb9a4e9c7e7abb0983dd4c34c68c116',method:'Actual current searchReferences and oracleReadingText; no production mutation. Browser evidence is separate.',
  queries:results.length,empty:results.filter(r=>!r.top5.length).length,powerRendering,results};
writeFileSync(data+'head-recheck.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({head:report.head,queries:report.queries,empty:report.empty,powerEffectsRendered:powerRendering.filter(r=>r.effectIncludedInRoll).length}));
