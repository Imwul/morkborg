import { chromium } from '/Users/imwul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const url=process.env.QA_URL||'http://127.0.0.1:5175', phase=process.env.QA_PHASE||'after', width=Number(process.env.QA_WIDTH||1440);
const out=`outputs/visual-quieting/acceptance-${phase}-${width}`;mkdirSync(out,{recursive:true});
const storage=JSON.parse(readFileSync('outputs/pdf-remediation-batch-3/generated-accepted-storage.json'));
const extra=JSON.parse(readFileSync('outputs/play-speed/library-qa-storage.json'));
const stored=s=>s.origins[0].localStorage.find(x=>x.name==='morkborg-codex:v6');
const state=JSON.parse(stored(storage).value),c=state.campaigns[0],extraCampaign=JSON.parse(stored(extra).value).campaigns[0];
for(const kind of ['monsters','npcs','encounters']) c[kind]=extraCampaign[kind].map(o=>({...o,campaignId:c.id}));
c.workspace.dungeonTab='overview';c.workspace.dungeonPreview=false;stored(storage).value=JSON.stringify(state);for(const o of storage.origins)o.origin=url;
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({storageState:storage,viewport:{width,height:1000},hasTouch:width===360,reducedMotion:'reduce',permissions:['clipboard-read','clipboard-write']});
const page=await context.newPage();page.setDefaultTimeout(12000);
const events=[],checks=[],errors=[],targets=[];let clicks=0,queries=0;
page.on('pageerror',e=>errors.push(e.message));
const inspector=()=>page.locator('.reference-inspector');
const stateNow=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('morkborg-codex:v6')));
const gameOnly=s=>s.campaigns.map(({workspace,updatedAt,...c})=>c);
async function click(locator,label){await locator.click();clicks++;events.push({click:clicks,label});}
async function check(label,fn){await fn();checks.push(label);console.log('PASS '+label);}
async function close(){if(await inspector().isVisible())await click(inspector().getByRole('button',{name:'닫기',exact:true}),'Close inspector');}
async function search(q){await close();await page.getByRole('textbox',{name:'작업대 검색'}).fill(q);queries++;events.push({query:q});await page.locator('.desk-search-results .reference-select-action').first().waitFor();await click(page.locator('.desk-search-results .reference-select-action').first(),`Search ${q} → execute`);await inspector().waitFor();}
async function nav(label){await close();const button=page.locator('.sidebar').getByRole('button',{name:new RegExp('^'+label)}).first();if(width<800)await click(page.getByRole('button',{name:'메뉴 열기',exact:true}),'Open mobile navigation');await click(button,`Navigate ${label}`);}
async function source(root){await click(root.locator('.source-disclosure > summary').first(),'Source');}
async function shot(name){await page.screenshot({path:`${out}/${name}.png`,animations:'disabled'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,`overflow ${name}`);}
async function target(locator,name){const box=await locator.boundingBox();assert.ok(box);targets.push({name,width:Math.round(box.width),height:Math.round(box.height)});if(phase!=='before'){assert.ok(box.width>=43.5,`${name} touch width`);assert.ok(box.height>=43.5,`${name} touch height`);}}
try {
 await page.goto(url);await page.waitForLoadState('networkidle');const initial=gameOnly(await stateNow());
 await search('Reaction');await check('Reaction executes directly with a visible result',async()=>assert.match(await inspector().locator('.reference-reading').innerText(),/Kill|Angered|Indifferent|friendly|Helpful/));
 await target(inspector().getByRole('button',{name:'COPY',exact:true}),'Copy');
 await click(inspector().getByRole('button',{name:'COPY',exact:true}),'Copy result');
 await check('Plain copy contains play content without source IDs',async()=>{const text=await page.evaluate(()=>navigator.clipboard.readText());assert.match(text,/Reaction/);assert.doesNotMatch(text,/oracle:|dataset|PDF|PRIMARY SOURCE/);});
 await target(inspector().locator('.source-disclosure > summary').first(),'Source');await source(inspector());
 await check('Source opens directly with exact book/page',async()=>assert.match(await inspector().locator('.source-disclosure-body').innerText(),/MÖRK BORG|BARE BONES/));
 await click(inspector().getByRole('button',{name:/^(TABLE|표 보기)/}),'View table');
 await check('Table keeps ranges readable and active result',async()=>{assert.equal(await inspector().locator('tbody tr').count(),5);assert.equal(await inspector().locator('.current-table-result').count(),1);});
 await click(inspector().getByRole('button',{name:'결과로 돌아가기'}),'Table → result');
 await click(inspector().locator('.result-more-actions > summary'),'More result actions');
 await click(inspector().getByRole('button',{name:'COPY WITH SOURCE',exact:true}),'Copy with source');
 await check('Copy with source retains concise provenance without debug IDs',async()=>{const text=await page.evaluate(()=>navigator.clipboard.readText());assert.match(text,/PDF|p\.|MB-BB|BARE BONES/);assert.doesNotMatch(text,/datasetVersion|procedureId|oracle:/);});
 await search('Broken');await check('Broken mechanic readable',async()=>assert.match(await inspector().locator('.reference-reading').innerText(),/0 HP|Exactly|정확히|Broken/));
 await search('Daemon of Capillaries');await check('Power effect and Korean remain visible',async()=>{const text=await inspector().locator('.reference-reading').innerText();assert.match(text,/d6/);assert.match(text,/[가-힣]/);});
 await nav('나의 캠페인');await click(page.locator('.campaign-card .card-title').first(),'Open isolated QA campaign');
 await nav('캐릭터');await click(page.locator('.compact-card-main').first(),'Open saved Character');await page.locator('.character-sheet').waitFor();
 if(phase!=='before')await check('Saved creation controls stay hidden until edit',async()=>assert.equal(await page.locator('.character-generation-bar').isVisible(),false));
 await click(page.getByRole('button',{name:'무기 1 reference',exact:true}),'Character weapon → definition');await check('Weapon definition opens in one click',async()=>assert.match(await inspector().innerText(),/Shortsword/));await close();
 const power=page.getByRole('button',{name:'장비 1 reference',exact:true});
 await click(power,'Character Power → definition');await check('Character Power opens its usable mechanic',async()=>assert.match(await inspector().innerText(),/False Dawn|Night.s Chariot/));await close();
 await click(page.locator('.character-workbench').getByRole('button',{name:/^(EDIT|편집)$/,exact:true}).first(),'Edit Character');await check('Character edit reveals generation settings',async()=>assert.equal(await page.locator('.character-generation-bar').isVisible(),true));await click(page.locator('.character-workbench').getByRole('button',{name:/^(DONE|완료)$/,exact:true}).first(),'Finish Character editing');await shot('character');
 await nav('던전 보관함');if(!await page.locator('.dungeon-tabs').count())await click(page.locator('.compact-card-main').first(),'Open Dungeon');
 await click(page.locator('.dungeon-tabs').getByRole('button',{name:'개요',exact:true}),'Dungeon overview');
 await check('Four Room packets remain compact by default',async()=>{assert.equal(await page.locator('.room-packet-grid .room-packet').count(),4);assert.equal(await page.locator('.room-packet-grid .room-packet > details[open]').count(),0);});
 await page.locator('.room-packet-grid').scrollIntoViewIfNeeded();await shot('four-rooms');
 await click(page.locator('.dungeon-tabs').getByRole('button',{name:/^방/}),'Open Room ledger');await click(page.locator('.room-select').nth(1),'Open Room 02');
 const room=page.locator('.room-detail .room-packet');await room.waitFor();const beforeReroll=(await stateNow()).campaigns[0].dungeons[0].rooms[1];
 await target(room.locator('.room-component-reroll').nth(1),'Room component reroll');await click(room.locator('.room-component-reroll').nth(1),'Reroll independent altar component');
 await check('Independent reroll preserves Room ID and unrelated components',async()=>{const after=(await stateNow()).campaigns[0].dungeons[0].rooms[1];assert.equal(after.id,beforeReroll.id);assert.deepEqual(after.components[0],beforeReroll.components[0]);assert.equal(after.components[1].provenance.status,'VERIFIED');});
 await target(room.locator('.source-disclosure > summary'),'Room Source');await source(room);
 await check('One Source retains component trace and APP POLICY distinction',async()=>{const text=await room.locator('.source-disclosure-body').innerText();assert.match(text,/APP POLICY/);assert.match(text,/PRIMARY SOURCE/);});
 const sourceLink=room.getByRole('button',{name:'이 표 열기 ↗'}).first();await sourceLink.scrollIntoViewIfNeeded();const roomScroll=await page.evaluate(()=>scrollY);await click(sourceLink,'Room Source → canonical table');
 await check('Single inspector with canonical table',async()=>{assert.equal(await page.getByRole('dialog').count(),1);assert.ok(await inspector().locator('table').count());});await close();
 await check('Closing table restores Room 02 and scroll context',async()=>{assert.equal(await room.getAttribute('data-room-id'),beforeReroll.id);assert.ok(Math.abs(await page.evaluate(()=>scrollY)-roomScroll)<8);});
 await click(room.locator('.source-disclosure > summary'),'Close Room Source');
 await click(room.getByRole('button',{name:/^(EDIT|편집)$/,exact:true}),'Edit Room');
 await check('Edit mode exposes controls only intentionally',async()=>assert.ok(await room.locator('.field-tools button').count()));await click(room.getByRole('button',{name:/^(DONE|완료)$/,exact:true}),'Finish Room editing');await shot('room');
 await nav('몬스터');await click(page.locator('.compact-card-main').first(),'Open saved Monster');await source(page.locator('.monster-workbench'));
 await check('Monster Source remains one direct action',async()=>assert.ok((await page.locator('.monster-workbench .source-disclosure[open] > .source-disclosure-body').first().innerText()).length>30));
 await click(page.locator('.monster-workbench .source-disclosure > summary').first(),'Close Monster Source');
 await click(page.getByRole('button',{name:'모든 몬스터',exact:true}),'Monster library');await click(page.getByRole('button',{name:'새 몬스터',exact:false}),'Generate Monster');
 await check('Generated Monster identity and combat result precede management',async()=>{assert.ok((await page.locator('.monster-workbench h1').innerText()).length);assert.ok((await page.locator('.monster-statblock-reading').innerText()).length);assert.equal(await page.locator('.monster-workbench .page-heading').getByRole('button',{name:'몬스터 전체 재굴림',exact:true}).isVisible(),true);});
 await click(page.locator('.monster-workbench .object-editor > summary'),'Monster detail / special');await check('Monster expanded details remain available',async()=>assert.ok(await page.locator('.monster-workbench .field').count()));await shot('monster-detail');
 await nav('REFERENCE DESK');await search('Action + Theme');await check('Combined Oracle still runs directly',async()=>assert.ok(await inspector().locator('.short-answer').count()>=2));
 if(await inspector().getByRole('button',{name:'참조 고정',exact:true}).count())await click(inspector().getByRole('button',{name:'참조 고정',exact:true}),'Pin Action + Theme');await close();
 await click(page.locator('.desk-pinned-actions').getByRole('button',{name:/Action.*Theme/}),'Pin → direct run');await close();
 await click(page.locator('.desk-recent-actions').getByRole('button',{name:/Action.*Theme/}),'Recent → direct run');await close();
 await search('Rare Monster Five Cards');
 if(phase!=='before'){
 await check('Creature appears before the closed card trace',async()=>{assert.equal(await inspector().locator('.rare-card-details').getAttribute('open'),null);const a=await inspector().locator('.rare-monster-reading').boundingBox(),b=await inspector().locator('.rare-card-details').boundingBox();assert.ok(a.y<b.y);});
 await click(inspector().locator('.rare-card-details > summary'),'Inspect cards used');
 }
 await check('All card identities remain available',async()=>{const cards=await inspector().locator('.rare-card-strip strong').allTextContents();assert.ok(cards.length>=5&&cards.length<=7);assert.equal(new Set(cards).size,cards.length);assert.ok(cards.every(c=>/[♠♥♦♣]/.test(c)));});
 await shot('card-trace');await close();
 const final=await stateNow();
 await check('Only isolated QA reroll/draft changed; saved Character and other saved objects intact',async()=>{const before=initial[0],after=gameOnly(final)[0];for(const key of ['characters','monsters','npcs','encounters'])assert.deepEqual(after[key],before[key]);for(const i of [0,2,3])assert.deepEqual(after.dungeons[0].rooms[i],before.dungeons[0].rooms[i]);});
 await page.reload();await page.waitForLoadState('networkidle');await check('Campaign content and pins survive reload',async()=>{assert.deepEqual(gameOnly(await stateNow()),gameOnly(final));assert.equal(await page.locator('.desk-pinned-actions').getByRole('button',{name:/Action.*Theme/}).count(),1);});
 // Keyboard path is deliberately separate from the click metric.
 await page.keyboard.press('Control+k');await page.getByRole('textbox',{name:'통합 참조 검색'}).fill('reaction');await page.keyboard.press('Enter');await check('Keyboard palette → result → Escape works',async()=>{assert.equal(await inspector().locator('.reference-reading').isVisible(),true);await page.keyboard.press('Escape');await inspector().waitFor({state:'hidden'});assert.equal(await inspector().isVisible(),false);});
 assert.deepEqual(errors,[]);
 const report={phase,url,width,clicks,queryEntries:queries,events,checks,targets,errors,notes:'Every write occurred only in this isolated QA browser context. Queries counted separately; scroll/reload/keyboard listed outside click count. Source PDFs stayed closed.'};
 const reportDir=process.env.QA_REPORT_DIR||'docs/visual-quieting';mkdirSync(reportDir,{recursive:true});
 writeFileSync(`${reportDir}/acceptance-${phase}-${width}.json`,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({phase,width,clicks,queries,checks:checks.length,errors}));
}catch(e){await shot('failure');writeFileSync(`${out}/failure.txt`,String(e.stack)+'\n'+await page.locator('body').innerText());throw e;}finally{await browser.close();}
