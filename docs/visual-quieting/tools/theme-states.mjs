import { chromium } from '/Users/imwul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const url=process.env.QA_URL||'http://127.0.0.1:5175',out='outputs/visual-quieting/theme-states';mkdirSync(out,{recursive:true});
const storage=JSON.parse(readFileSync('outputs/visual-quieting/after-accepted-storage.json'));for(const o of storage.origins)o.origin=url;
const browser=await chromium.launch({channel:'chrome',headless:true}),results=[],disabledChecks=[];
try{for(const scheme of ['light','dark']){
 const context=await browser.newContext({storageState:storage,colorScheme:scheme,viewport:{width:1440,height:1000},reducedMotion:'reduce'}),page=await context.newPage();page.setDefaultTimeout(12000);
 const inspector=()=>page.locator('.reference-inspector');
 async function measure(locator){return locator.evaluate((e)=>{
    const rgba=v=>v.match(/[\d.]+/g).map(Number),blend=(a,b)=>a.slice(0,3).map((v,i)=>v*(a[3]??1)+b[i]*(1-(a[3]??1)));
    const chain=[];for(let p=e;p;p=p.parentElement)chain.unshift(p);let bg=[255,255,255];for(const p of chain)bg=blend(rgba(getComputedStyle(p).backgroundColor),bg);
    const s=getComputedStyle(e),fg=blend(rgba(s.color),bg),l=c=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0),a=l(fg),b=l(bg);
    return {foreground:s.color,background:bg,contrast:Math.round((Math.max(a,b)+.05)/(Math.min(a,b)+.05)*100)/100,focusVisible:e.matches(':focus-visible'),outline:s.outlineColor,shadow:s.boxShadow};
   });}
 async function probe(locator,name){
  for(const state of ['hover','focus']){
   if(state==='hover')await locator.hover();else{await page.keyboard.press('Tab');await locator.focus();}
   const colors=await measure(locator);
   if(colors.contrast<4.5){await page.screenshot({path:`${out}/failure-${scheme}.png`});console.log(JSON.stringify({name,state,colors}));}
   assert.ok(colors.contrast>=4.5,`${scheme} ${name} ${state}: ${colors.contrast}`);
   if(state==='focus')assert.equal(colors.focusVisible,true);
   results.push({scheme,name,state,...colors});
  }
 }
 await page.goto(url);await page.waitForLoadState('networkidle');
 const campaignContent=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('morkborg-codex:v6')).campaigns.map(({workspace,updatedAt,...c})=>c));const before=await campaignContent();
 await page.getByRole('button',{name:'REFERENCE DESK',exact:true}).click();
 await page.getByRole('textbox',{name:'작업대 검색'}).fill('Reaction');await page.locator('.desk-search-results .reference-select-action').first().click();
 await probe(inspector().getByRole('button',{name:'REROLL',exact:true}),'Oracle reroll');
 await page.screenshot({path:`${out}/oracle-focus-${scheme}.png`});
 await probe(inspector().getByRole('button',{name:'COPY',exact:true}),'Copy');
 await probe(inspector().locator('.source-disclosure > summary').first(),'Source');
 await inspector().getByRole('button',{name:'닫기',exact:true}).click();
 await page.locator('.sidebar').getByRole('button',{name:/^나의 캠페인/}).click();await page.locator('.campaign-card .card-title').first().click();await page.locator('.sidebar').getByRole('button',{name:/^캐릭터/}).click();await page.locator('.compact-card-main').first().click();
 await probe(page.locator('.character-sheet-header .reference-inline-link'),'Class on black identity panel');
 await page.screenshot({path:`${out}/character-focus-${scheme}.png`});
 await page.locator('.character-workbench').getByRole('button',{name:'편집',exact:true}).first().click();
 const hp=page.locator('.character-sheet input[type=number]').first();if(await hp.count())await probe(hp,'Character HP input');
 await page.locator('.sidebar').getByRole('button',{name:/^몬스터/}).click();await page.locator('.compact-card-main').first().click();await page.locator('.monster-workbench .object-editor > summary').click();
 const name=page.locator('.monster-sheet [data-field=name] .field-value').first();await probe(name,'Monster name on black panel');await name.click();
 await probe(page.locator('.monster-sheet [data-field=name] textarea'),'Monster name input');
 await page.screenshot({path:`${out}/monster-input-${scheme}.png`});
 await page.locator('.sidebar').getByRole('button',{name:/^던전 보관함/}).click();if(!await page.locator('.dungeon-tabs').count())await page.locator('.compact-card-main').first().click();await page.locator('.dungeon-tabs').getByRole('button',{name:/^방/}).click();await page.locator('.room-order > summary').first().click();const disabled=page.getByRole('button',{name:'방 1 위로 이동',exact:true});assert.equal(await disabled.isDisabled(),true);assert.equal(await disabled.isVisible(),true);disabledChecks.push({scheme,control:'First Room move-up',disabled:true,visible:true});for(const width of [360,1440,3440]){await page.setViewportSize({width,height:1000});const empty=await measure(page.locator('.empty-artifact > p'));results.push({scheme,width,name:'Room empty-state guidance',state:'read',...empty});assert.ok(empty.contrast>=4.5,`Room guidance: ${empty.contrast}`);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.locator('.empty-artifact').scrollIntoViewIfNeeded();await page.screenshot({path:`${out}/disabled-control-${width}-${scheme}.png`});}assert.deepEqual(await campaignContent(),before);await context.close();
}writeFileSync(`${out}/results.json`,JSON.stringify({url,results,disabledChecks},null,2)+'\n');console.log(JSON.stringify({checks:results.length,minimumContrast:Math.min(...results.map(r=>r.contrast))}));}finally{await browser.close();}
