"""Priority triage of inherited IDs, not a new source/coverage audit."""
import json, collections
from pathlib import Path
base=Path('docs/pdf-remediation-batch-3')
remaining=json.loads(Path('docs/pdf-remediation-batch-2/remaining-audit-ids.json').read_text())['entries']
master=json.loads(Path('docs/pdf-escape-audit/data/master-rows.json').read_text())
probe=json.loads((base/'tools/triage-probe.json').read_text())
masters={}
for r in master: masters.setdefault(r['needId'],r)
probes={r['needId']:r for r in probe['entries']}
# Scores describe frequency across ordinary MÖRK BORG play, not frequency
# conditional on choosing an optional module/variant. Identical source families
# share a rubric; each row retains its individual inherited need and rationale.
def group(i,r):
 if r['classification']=='SOURCE_UNAVAILABLE': return 'source-limit',1,1,'SOURCE_UNAVAILABLE','Missing supplied source is a dependency, not a candidate for implementation.'
 if i=='core-difficulty-scale': return 'core-tests',5,4,'CORE_GENERAL','Choosing a DR recurs across combat and exploration; normal DR12 alone is insufficient.'
 if i=='core-round-duration': return 'core-timing',4,4,'CORE_GENERAL','Round duration and movement define common combat/exploration timing.'
 if i=='core-starvation': return 'core-rest-food',4,4,'CORE_GENERAL','Food/water govern daily recovery; variant search results can give the wrong system.'
 if i=='core-infection': return 'core-rest-food',3,4,'CORE_GENERAL','Infection changes recovery; generic search currently favors RECLVSE.'
 if i=='core-scroll-restrictions': return 'core-scroll-restrictions',4,3,'CORE_GENERAL','Armor/weapon restrictions recur for casters; the Priest exception must be reachable without generation.'
 if i=='core-ability-creation': return 'core-creation',2,3,'CORE_CLASS','Character preparation rule, important at creation/replacement but not each active-play scene.'
 if i=='core-character-creation': return 'core-creation',2,2,'CORE_CLASS','Generator already serves creation; optional manual procedure is preparation support.'
 if i=='core-catastrophe-repeat': return 'core-catastrophe-repeat',1,4,'RARE_EDGE_CASE','A repeated optional catastrophe is infrequent even though its consequence is important when triggered.'
 if i.startswith('core-purchase-'):
  if i in ['core-purchase-20-arrows','core-purchase-10-bolts']: return 'core-prices',3,4,'CORE_EQUIPMENT','Ammunition replenishment is ordinary play; weapon starting ammunition is not its purchase price.'
  return 'core-prices-animals',2,3,'CORE_EQUIPMENT','Purchase price matters when acquiring a companion/mount, not most scenes.'
 if i.startswith('core-service-'):
  if 'armor-repair' in i: return 'core-prices',3,4,'CORE_EQUIPMENT','Armor repair follows ordinary damage/degradation; repair ceiling is mechanically relevant.'
  return 'core-prices',3,3,'CORE_GENERAL','A small common service purchase can otherwise require opening the Core price list.'
 if i.startswith('core-starting-item-'): return 'core-starting-equipment',3,4,'CORE_EQUIPMENT','This item can appear in an ordinary newly generated Character; exact-name lookup currently fails or routes to another item.'
 if i.startswith('core-treasure-'): return 'core-treasure-lookup',2,3,'CORE_EQUIPMENT','Existing source effect is inspectable by table, but a generated named treasure has no direct lookup.'
 if i.startswith('core-valuation-'): return 'core-creature-valuations',2,2,'CORE_GENERAL','Captured/dead/body-part sale values are useful after a kill or capture, but lower interruption than the already available combat stat block.'
 if i=='core-outcast-loyalty': return 'core-followers',3,3,'CORE_GENERAL','Ordinary follower play needs the loyalty rule; no follower-management subsystem is needed.'
 if i=='core-outcast-wild-wickhead': return 'core-followers',2,4,'CORE_GENERAL','One supplied Core follower lacks a visible stat block; narrower than general combat rules.'
 if i.startswith('core-rotblack-'): return 'core-adventure',1,4 if r['classification'] in ['MISSING','PARTIAL'] else 2,'RARE_EDGE_CASE','This is keyed Rotblack Sludge material, relevant when choosing that adventure; it is not general Core play.'
 if i=='feretory:epk-hunting-rules': return 'feretory-hunting',3,3,'SUPPLEMENT_GENERAL','The existing common hunting rule omits only an optional wider-die clause.'
 if i=='feretory:epk-regional-access': return 'feretory-regional-links',3,3,'SUPPLEMENT_GENERAL','Regional identity-to-creature follow-through is useful in ordinary supported travel; seven-region generator already covers its main route.'
 if i=='feretory:epk-farmers': return 'feretory-participants',2,2,'SUPPLEMENT_SPECIFIC','Stats are already embedded in Bogfeeder; separate participant access helps only this encounter.'
 if i.startswith('feretory:relic-'): return 'feretory-relic-lookup',2,3,'SUPPLEMENT_SPECIFIC','Named relic effect is already readable in its canonical table; direct lookup would save re-search.'
 if i.startswith(('feretory:class-','heretic:class-')): return 'supplement-classes',2,3,'SUPPLEMENT_SPECIFIC','Relevant to a player who selected this supplemental class; Core classes already have canonical references.'
 if i.startswith('feretory:ochre-'): return 'feretory-ochre-scrolls',1,3,'SUPPLEMENT_SPECIFIC','Special scroll family tied to a supplemental class; not the common Core Power set.'
 if i in ['feretory:three-dead-skulls','feretory:gambling-dreg','feretory:hardy-tame-rat']: return 'feretory-tavern',2,3,'SUPPLEMENT_SPECIFIC','Only this tavern result/participant introduces the missing mechanic.'
 if i=='feretory:black-salt-chain': return 'feretory-special-scroll',1,3,'SUPPLEMENT_SPECIFIC','Specific optional source item rather than general casting.'
 if i.startswith('feretory:'): return 'feretory-adventures',1,4 if r['classification'] in ['MISSING','PARTIAL'] else 2,'RARE_EDGE_CASE','Keyed Death Ziggurat/Goblin Grinder actor, artifact or hazard; choosing that scenario makes its PDF relevant.'
 if i.startswith('heretic:merchant-'): return 'heretic-merchants',2,3,'SUPPLEMENT_SPECIFIC','Merchant table exists; named object/trade follow-through matters only on the corresponding result.'
 if i=='heretic:feat-named-lookup': return 'heretic-feats',2,3,'SUPPLEMENT_SPECIFIC','Selected feat effects matter in play, but this is optional character customization.'
 if i=='heretic:cult-column-procedure': return 'heretic-cult-preparation',1,2,'SUPPLEMENT_SPECIFIC','Preparation procedure, not an ordinary turn-by-turn rule.'
 if i in ['heretic:wish-procedure','heretic:bowyers-bow','heretic:bowyer-services','heretic:bitor-valuation']: return 'heretic-special-content',1,3,'SUPPLEMENT_SPECIFIC','Specific optional encounter/creature/item; infrequent outside that source context.'
 if i.startswith('heretic:'): return 'heretic-adventures',1,4 if r['classification'] in ['MISSING','PARTIAL'] else 2,'RARE_EDGE_CASE','Graves/Bloat/Swamp/Nurse keyed scenario content, not a general MÖRK BORG rule.'
 if i.startswith('sd-creature-'): return 'sd-adventure',1,4,'RARE_EDGE_CASE','Specific included adventure actor, rather than the solo crawl framework.'
 if i=='sd-complete-milestone': return 'sd-milestone',2,3,'SOLO_GENERAL','Adventure milestone points into existing Getting Better; a small source-specific follow-through.'
 if i.startswith('sd-'): return 'sd-table-access',3,2,'SOLO_GENERAL','Core solo table is available, but usage/selection context may still be indirect.'
 if i in ['depths-depths-rare-look','depths-depths-rare-feature','depths-depths-rare-intention','depths-depths-rare-special','depths-depths-rare-easier']: return 'depths-rare-table-access',2,2,'SUPPLEMENT_SPECIFIC','Card selector/usage findings overlap the prior table-metadata and rare-monster work; verify overlap before implementation.'
 if i.startswith('depths-'):
  if 'orakle' in i: return 'depths-orakle',3,3,'SOLO_GENERAL','Optional Depths oracle/DR alternative is useful for users choosing that solo method; other ordinary oracles already work.'
  return 'depths-regional-alternatives',2,3,'SUPPLEMENT_SPECIFIC','Existing regional/component tables need optional procedure or source-only-region follow-through; general route already exists.'
 if i.startswith(('aitc-scenario-','aitc-chalice')): return 'aitc-adventures',1,4,'RARE_EDGE_CASE','A keyed Alöne adventure is required before this actor/table/artifact is encountered.'
 if i.startswith('aitc-item-'): return 'aitc-named-items',2,3,'SUPPLEMENT_SPECIFIC','Named city item effect is already present in the merchant table; direct lookup would reduce table scanning.'
 if i.startswith('aitc-lookup-'): return 'aitc-participants',2,3,'SUPPLEMENT_SPECIFIC','A city outcome names this particular participant; identity link is useful only then.'
 if i in ['aitc-derive','aitc-merchant']: return 'aitc-procedure-routing',3,2,'SUPPLEMENT_GENERAL','Current City workspace implements the procedure; direct search routing is a convenience gap.'
 if i.startswith('aitc-'): return 'aitc-table-access',3,2,'SUPPLEMENT_GENERAL','Existing city table requires preserved selector or relevant use context; no new city system.'
 if i.startswith('reclvse-rule-'):
  if any(k in i for k in ['connection','shelter','upkeep','build-or','abandonment','quest','setback']): return 'reclvse-optional-management-moves',1,3,'SUPPLEMENT_SPECIFIC','Optional quest/connection/shelter rules can remain paper-led; low general-Core priority and no management expansion.'
  if any(k in i for k in ['adventure-reveal','room-entry','module','clarify-the-text','choose-a-direction','determine-npc-intent']): return 'reclvse-prepared-adventures',2,3,'SUPPLEMENT_SPECIFIC','RECLVSE module-conversion procedure, only relevant to that optional play mode.'
  if i=='reclvse-rule-armor-degradation': return 'reclvse-armor',3,3,'SUPPLEMENT_SPECIFIC','RECLVSE-specific combat restriction; general Core cannot stand in for it, but ordinary Core is higher priority.'
  return 'reclvse-additional-moves',2,3,'SUPPLEMENT_SPECIFIC','Source-specific RECLVSE move outside the core/travel/camp/dungeon set delivered in Batch 2.'
 if i.startswith('reclvse-class-'): return 'reclvse-classes',2,4,'SUPPLEMENT_SPECIFIC','Source-specific archetype basics remain partial despite option tables; important to its chosen character, not every Core campaign.'
 if i.startswith('reclvse-relic-'): return 'reclvse-relics',1,3,'SUPPLEMENT_SPECIFIC','Specific RECLVSE relic absent from Core play and not a common reference requirement.'
 if i.startswith('reclvse-blessing-'): return 'reclvse-blessings',1,3,'SUPPLEMENT_SPECIFIC','Optional RECLVSE starting blessing; only needed if that option was selected.'
 if i in ['reclvse-power-name-lookup','reclvse-reclvse-powers']: return 'reclvse-powers',2,3,'SUPPLEMENT_SPECIFIC','Source-specific replacement Powers already have full canonical table effects; named access is the gap.'
 if i in ['reclvse-unspokens-truths','reclvse-krav']: return 'reclvse-special-content',1,3,'SUPPLEMENT_SPECIFIC','Specific variant calendar/hireling not encountered by ordinary Core users.'
 if i.startswith('reclvse-'): return 'reclvse-optional-generators',2,2,'SUPPLEMENT_SPECIFIC','Alternative detailed room/street/beast/weather procedure; common app generators already serve immediate play.'
 if i in ['mythic-choose-focus','mythic-first-scene','mythic-automatic-interrupt','mythic-list-bookkeeping']: return 'mythic-general-followthrough',2,3,'SOLO_GENERAL','Mythic optional setup/choice/list housekeeping supplements the already implemented basic Focus/Scene loop.'
 if i.startswith('mythic-'): return 'mythic-advanced-variants',1,3,'SUPPLEMENT_SPECIFIC','Optional alternate-chart/progress/prepared-adventure/Crafter technique; no ordinary MÖRK BORG dependency.'
 raise ValueError(i)
weights={'CORE_GENERAL':1.3,'CORE_CLASS':1.1,'CORE_EQUIPMENT':1.15,'SOLO_GENERAL':1.0,'SUPPLEMENT_GENERAL':0.9,'SUPPLEMENT_SPECIFIC':0.65,'RARE_EDGE_CASE':0.35,'SOURCE_UNAVAILABLE':0.0}
selector_overlap={'depths-depths-rare-look','depths-depths-rare-feature','depths-depths-rare-intention','depths-depths-rare-special'}
rows=[]
for r in remaining:
 i=r['needId'];m=masters[i];p=probes[i]
 family,freq,friction,relevance,reason=group(i,r)
 access={'MISSING':'MISSING','PARTIAL':'PARTIAL','PRESENT_BUT_INDIRECT':'INDIRECT','SOURCE_UNAVAILABLE':'MISSING'}[r['classification']]
 evidence='Inherited content/access assessment plus current registry destination/query probe; no fresh browser or source completeness claim.'
 if i in selector_overlap:
  access='ACCEPTABLE';evidence='Static overlap: src/domain/referenceTable.ts tableSelector prefers metadata.rank/symbols; ReferenceTable renders it. Batch 1/2 selector tests cover the pathway. Browser closure not claimed and inherited classification is retained.'
 rows.append({
  'needId':i,'book':r['book'],'pdfPage':r['pdfPage'],'printedPage':r.get('printedPage'),
  'content':m['content'],'inheritedClassification':r['classification'],
  'playFrequency':freq,'interruptionSeverity':friction,'coreRelevance':relevance,
  'currentAccessQuality':access,'accessEvidence':evidence,'triageFamily':family,
  'priorityWeight':weights[relevance],'practicalPriority':round(freq*friction*weights[relevance],2),
  'whyItMatters':reason,'inheritedProblem':r['problem'],'minimalFix':m['minimalFix'],
  'currentAppPathFromAudit':m['appPath'],'currentRegistryProbe':p,
  'newSourceVerification':False,'browserVerified':False,
 })
rows.sort(key=lambda r:(-r['practicalPriority'],r['needId']))
for rank,r in enumerate(rows,1):r['rank']=rank
result={'head':probe['head'],'scope':'401 inherited IDs prioritized for ordinary Core/solo play. This is a triage, not renewed source verification or coverage closure. Four static selector overlaps are candidates for later recheck only.',
 'method':'playFrequency × interruptionSeverity × relevanceWeight. Scores support judgment; optional module frequency is measured across general play, not after choosing its module.',
 'weights':weights,'inheritedCounts':dict(collections.Counter(r['classification']for r in remaining)),
 'relevanceCounts':dict(collections.Counter(r['coreRelevance']for r in rows)),
 'accessCounts':dict(collections.Counter(r['currentAccessQuality']for r in rows)),
 'entries':rows}
assert len(rows)==401 and len({r['needId']for r in rows})==401
(base/'triage-all.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items()if k.endswith('Counts')},ensure_ascii=False))
for r in rows[:30]: print(r['rank'],r['needId'],r['practicalPriority'],r['triageFamily'])
