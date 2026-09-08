"""All canonical table access, source metadata rendering, and alias audit.
Read-only documentation. Deliberate omissions are assessed, not fixed.
"""
import json,csv
from pathlib import Path
from collections import Counter
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'docs/pdf-escape-audit/data'
registry=json.loads((ROOT/'outputs/pdf-escape-audit/registry.json').read_text())
app=json.loads((OUT/'app-inventory.json').read_text())
index=json.loads((ROOT/'outputs/pdf-escape-audit/reference-index.json').read_text())
search={t['tableId']:t for t in json.loads((ROOT/'outputs/pdf-escape-audit/table-search.json').read_text())}
refs={r['id']:r for r in index};inventory={t['id']:t for t in app['tables']}
needs=[]
for f in ['core-rows.json','solo-city-rows.json','supplement-rows.json','mythic-rows.json','mythic-extra-rows.json']:
 for r in json.loads((OUT/f).read_text()):needs.append(r)
# These keys do not render by name. Their existence alone is NOT a missing mechanic.
mechanic_keys={'effect','damage','HP','Morale','Attack','Armor','conditional','condition','procedureNote','effectRule','truth','quantity','quantityDice','damageReduction','tier','valueSilver','agilityDRPenalty','defenseDRPenalty','capacity','playerChoice','scrollTable','healing','effects','companion','ammunition','duration','spotTest','test','failureDamage','breakEffect','bySpecialRoomsUncovered','rank','suits','symbols','printedIndex','printedRange','originalRange','openEnded','comparison','followup','followUp','followUpOracleIds','subtable','nestedRolls','procedure','subtableId','fixedLookups','fixedEntry','repeatDice','cityCrawlBonusDice','destinationStreetsDice'}
# Human reviewed semantic omissions: source mechanics/qualifiers genuinely absent from row text.
hidden={
 'core.weapons':{'damage','ammunition'},
 'core.armor':{'tier','damageReduction','agilityDRPenalty','defenseDRPenalty','valueSilver','examples'},
 'core.unclean':{'effect'},'core.sacred':{'effect'},
 'heretic.gravesKnowledge':{'truth'},
 'aitc.holy-places-small':{'conditional'},'aitc.holy-places-large':{'conditional'},
 'aitc.notable-artefact-type':{'effectRule'},
 'aitc.special-structures-small':{'condition'},'aitc.special-structures-large':{'condition'},
 'aitc.street-contents':{'conditional'},
}
assessments={
 'core.weapons':'TABLE and generic ROLL show weapon names without printed damage/ammunition. Character generation uses metadata, so generation is not proof of reference completeness.',
 'core.armor':'TABLE and generic ROLL show category names without reductions, prices and penalties. Zero values are mechanically meaningful; full armor rules have a separate quick-reference path.',
 'core.unclean':'TABLE shows ten Power names without effects. At HEAD 479cbd7, generic ROLL now appends the stored effect; exact-name lookup and TABLE remain incomplete.',
 'core.sacred':'TABLE shows ten Power names without effects. At HEAD 479cbd7, generic ROLL now appends the stored effect; exact-name lookup and TABLE remain incomplete.',
 'heretic.gravesKnowledge':'Six rumor texts display; source true/false/maybe labels are omitted from TABLE and generic ROLL.',
 'sd.room.exits':'All five values per row are printed, but TABLE does not label the five Special Rooms Uncovered columns. A source note explains the 0–4 basis before rolling; Dungeon procedure resolves the actual column.',
 'depths.enemyStats':'All 15 HP/Morale/Attack/Armor blocks are already in entry.text. These metadata keys are NOT hidden-stat gaps. The final 16+ selector loses its plus sign in TABLE.',
 'core.gearA':'Dice quantities, duration, poison/trap/bomb effects and healing are in entry.text; corresponding metadata is redundant. Scroll follow-through is a separate link/usability issue.',
 'core.gearB':'Companion stats, elixir, shield effect and other item mechanics are in entry.text; metadata omission does not erase these effects.',
 'core.containers':'Capacities and player choices are fully present in entry.text; no omission of these mechanics.',
 'aitc.directions-reaction':'Bonus and destination dice are in entry.text; no missing effect merely because metadata keys do not render.',
 'aitc.notable-artefact-type':'Picture/sculpture operational effectRule is absent from TABLE. ROLL uses the source-specific artifact branch and oracleReadingText, which include these rules.',
 'aitc.holy-places-small':'Row-only TABLE lacks the staffed-place conditional reminder; ROLL appends conditional. Full common guidance is table.description and is not displayed inside TABLE.',
 'aitc.holy-places-large':'Row-only TABLE lacks the staffed-place conditional reminder; ROLL appends conditional. Cathedral vault dice remain visible in entry.text.',
 'aitc.special-structures-small':'Holy Place branch context is omitted from TABLE; ROLL includes condition. Market repeat d4 is already in entry.text.',
 'aitc.special-structures-large':'Holy Place branch context is omitted from TABLE; ROLL includes condition. Market repeat d4 is already in entry.text.',
 'aitc.street-contents':'Settlement-size choice for Special Structure is only conditional metadata. TABLE omits it; ROLL includes it. The source d2 content count is a procedure, not the table die.',
 'aitc.civic-buildings':'Most conditional metadata repeats full row text (guards, rolls, tests and consequences). Not counted as four missing effects. Artifact branch inspection is a separate related procedure.',
 'aitc.gatherings':'Conditional metadata repeats win/festival/riot consequences already in full row text; not counted as missing effects.',
 'aitc.hazards':'Carriage looting repeats/Searching condition is already in full row text; not counted as a missing effect.',
 'aitc.unexpected-events':'Lucky-dip count, price and Searching modifier are already in row text; not counted as a missing effect.',
 'aitc.npc-encounters':'The hireling reaction and daily Morale condition are already in row text. Named child tables remain a separate related-link flow.',
 'heretic.gravesRandomEncounter':'Quantities are already in text. Sensory Strangeness is named but its legacy followupTable key does not create an automatic child roll.',
 'reclvse.quickContents':'Roll-twice instruction is visible; its recursion metadata is not an implemented automatic procedure. Child table names and IDs are a follow-through issue.',
 'mythic2.scene-adjustment-table':'Make 2 Adjustments text is visible; metadata does not make the generic roller execute the second-stage restricted source rule.',
 'feretory.campsite':'Dream branch is materialized as its own canonical campDream table; TABLE only shows parent text. It is not a lowercase followup disclosure, and generic ROLL does not run the dream table.',
 'heretic.gravesLootBodies':'The same source table is intentionally rolled twice. TABLE loops canonicalIds without deduplication and renders this identical six-row table twice; source data itself is not duplicated.',
}
rows=[]
for table in registry['tables']:
 tid=table['id'];a=inventory[tid];ref=refs[a['referenceId']];q=search[tid]
 viewids=ref['canonicalIds'];rowmeta=[];missing=[];selectors=[]
 for e in table['entries']:
  m=e.get('metadata',{});keys=sorted(set(m)&mechanic_keys)
  if keys:rowmeta.append({'entryId':e['id'],'keys':keys})
  h=sorted(set(m)&hidden.get(tid,set()))
  if h:missing.append({'entryId':e['id'],'keys':h})
  if tid in ['depths.rare.look','depths.rare.feature']:selectors.append({'entryId':e['id'],'keys':['rank'],'issue':'TABLE shows numeric rank index, not source A–K card rank.'})
  if tid in ['depths.rare.intention','depths.rare.special']:selectors.append({'entryId':e['id'],'keys':['suits','symbols'],'issue':'TABLE shows numeric index, not the ordered source card-suit pair.'})
  if tid=='depths.enemyStats' and str(m.get('printedIndex','')).endswith('+'):selectors.append({'entryId':e['id'],'keys':['printedIndex'],'issue':'TABLE shows16, omitting printed16+.'})
  if tid=='heretic.songbird.spinalHusk' and '+' in m.get('printedRange',''):selectors.append({'entryId':e['id'],'keys':['printedRange'],'issue':'TABLE shows6–12 instead of printed6+; source overlap remains intentionally unrolled.'})
  if tid=='sd.room.exits':selectors.append({'entryId':e['id'],'keys':['bySpecialRoomsUncovered'],'issue':'Five values lack labeled0–4 Special Rooms Uncovered column headers inside TABLE.'})
 rank=next((i+1 for i,v in enumerate(q['results'])if v['id']==a['referenceId']),None)
 related=[r['needId'] for r in needs if tid in r['evidence'].get('tableIds',[])]
 inline=[{'entryId':e['id'],'children':len(e['metadata']['followup']),'weightedSelectorNeedsInspection':any(c.get('meta',{}).get('min') is not None for c in e['metadata']['followup'])}for e in table['entries']if isinstance(e.get('metadata',{}).get('followup'),list)]
 notes=assessments.get(tid,'Entry fragments are readable. Any metadata listed as a candidate is not automatically a missing rule; source completeness remains in the linked book audit.')
 if tid.startswith('depths.region.') and tid.endswith('.monsters'):notes='Source identity and quantity are in row text; quantityDice metadata is redundant for reading. Regional monster workflow resolves definitions separately; generic TABLE identity is not a stat block.'
 if tid.startswith('depths.rare.') and not selectors:notes+=' Source card/choice follow-up instructions are in full entry.text.'
 if table.get('rollable') is False:notes+=' Automatic roll is deliberately blocked; see nonRollableReason. This alone is not a defective table.'
 rows.append(dict(tableId=tid,bookId=table['sourceBookId'],title=table['title'],pdfPage=table['sourcePage'],printedPage=table.get('printedPage'),dice=table['dice'],sourceStatus=table.get('sourceStatus'),entryCount=len(table['entries']),referenceId=a['referenceId'],canonicalIds=viewids,aliasToGroupedReference=a['referenceId']!='oracle:'+tid,referenceAvailable=ref['available'],roll=a['rollable'],reroll=a['rollable'],rollScope='all group steps' if len(viewids)>1 else 'single table',view=True,sourceDisclosure=True,manualReadingChoice=True,selectRowToResult=False,manualDieInput=False,tableTitleSearchRank=rank,tableTitleQuery=q['query'],tableTitleSearchTop=q['results'][0]['id'] if q['results'] else None,tableViewCopies=viewids.count(tid),nonRollableReason=table.get('sourceNote','') if table.get('rollable') is False else None,rawMechanicsMetadata=rowmeta,hiddenPlayableRowFields=missing,selectorOmissions=selectors,inlineFollowups=inline,topLevelDescriptionNotInsideTable=bool(table.get('description')),sourceNoteAvailableBeforeRoll=bool(table.get('sourceNote')),genericRollAppendsMetadata=['effect','effectRule','conditional','condition','procedureNote'],assessment=notes,relatedNeedIds=sorted(set(related)),evidence=['src/components/ReferenceWorkbench.tsx:577','src/domain/referenceReading.ts:86','src/data/oracles/library.ts:7','src/domain/references.ts:405','src/generators/oracleRoller.ts:95']))
assert len(rows)==562 and len({r['tableId']for r in rows})==562
assert all(r['view'] and r['sourceDisclosure'] and r['tableViewCopies']>=1 for r in rows)
assert sum(not r['roll']for r in rows)==18
(OUT/'table-access.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
fields=['tableId','bookId','title','pdfPage','printedPage','dice','entryCount','referenceId','canonicalIds','aliasToGroupedReference','referenceAvailable','roll','reroll','rollScope','view','sourceDisclosure','manualReadingChoice','selectRowToResult','manualDieInput','tableTitleSearchRank','tableTitleSearchTop','tableViewCopies','sourceStatus','nonRollableReason','hiddenPlayableRowCount','hiddenPlayableKeys','selectorOmissionCount','selectorKeys','inlineFollowupRows','topLevelDescriptionNotInsideTable','relatedNeedIds','assessment']
with (OUT/'table-access.csv').open('w',newline='')as f:
 w=csv.DictWriter(f,fieldnames=fields);w.writeheader()
 for r in rows:
  out={k:r.get(k)for k in fields};out.update(hiddenPlayableRowCount=len(r['hiddenPlayableRowFields']),hiddenPlayableKeys=sorted({k for e in r['hiddenPlayableRowFields']for k in e['keys']}),selectorOmissionCount=len(r['selectorOmissions']),selectorKeys=sorted({k for e in r['selectorOmissions']for k in e['keys']}),inlineFollowupRows=len(r['inlineFollowups']))
  w.writerow({k:json.dumps(v,ensure_ascii=False)if isinstance(v,(list,dict))else v for k,v in out.items()})
summary=dict(tables=len(rows),uniqueReferenceViews=len({r['referenceId']for r in rows}),aliasTables=sum(r['aliasToGroupedReference']for r in rows),rollable=sum(r['roll']for r in rows),viewOnly=sum(not r['roll']for r in rows),titleFirst=sum(r['tableTitleSearchRank']==1 for r in rows),titleTop5=sum(r['tableTitleSearchRank'] is not None for r in rows),rawMechanicsCandidateTables=sum(bool(r['rawMechanicsMetadata'])for r in rows),hiddenPlayableTables=sum(bool(r['hiddenPlayableRowFields'])for r in rows),hiddenPlayableRows=sum(len(r['hiddenPlayableRowFields'])for r in rows),selectorTables=sum(bool(r['selectorOmissions'])for r in rows),selectorRows=sum(len(r['selectorOmissions'])for r in rows),inlineFollowupTables=sum(bool(r['inlineFollowups'])for r in rows),inlineFollowupRows=sum(len(r['inlineFollowups'])for r in rows),duplicateTableViews=[r['tableId']for r in rows if r['tableViewCopies']>1],topLevelDescriptionTables=sum(r['topLevelDescriptionNotInsideTable']for r in rows))
(ROOT/'outputs/pdf-escape-audit/table-access-summary.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps(summary))
