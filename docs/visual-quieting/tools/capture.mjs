import { chromium } from '/Users/imwul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const phase=process.env.QA_PHASE||'before', url=process.env.QA_URL||'http://127.0.0.1:5175',out=`outputs/visual-quieting/${phase}`;
mkdirSync(out,{recursive:true});
const storage=JSON.parse(readFileSync('outputs/pdf-remediation-batch-3/generated-accepted-storage.json'));
const extra=JSON.parse(readFileSync('outputs/play-speed/library-qa-storage.json'));
const stored=s=>s.origins[0].localStorage.find(x=>x.name==='morkborg-codex:v6');
const state=JSON.parse(stored(storage).value), extraCampaign=JSON.parse(stored(extra).value).campaigns[0], c=state.campaigns[0];
for(const kind of ['monsters','npcs','encounters']) { c[kind]=extraCampaign[kind].map(o=>({...o,campaignId:c.id})); c.workspace.selected[kind]=c[kind][0].id; }
c.workspace.dungeonTab='overview'; c.workspace.dungeonPreview=false;
stored(storage).value=JSON.stringify(state);
for(const o of storage.origins)o.origin=url;
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({storageState:storage,viewport:{width:1440,height:1000},reducedMotion:'reduce',permissions:['clipboard-read','clipboard-write']});
// QA-only seed; React/browser-library calls may also consume it. Compare identical saved objects and the same reference views, not identical random draws.
await context.addInitScript(()=>{let seed=730521;Math.random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};});
const page=await context.newPage();page.setDefaultTimeout(15000);const metrics=[],errors=[];page.on('pageerror',e=>errors.push(e.message));
const panel=()=>page.locator('.reference-inspector');
async function capture(name,anchor){
 for(const width of [360,1440,3440]){
  await page.setViewportSize({width,height:1000});await page.waitForTimeout(200);await page.evaluate(()=>scrollTo(0,0));
  if(anchor)await page.locator(anchor).first().evaluate(e=>window.scrollTo(0,e.getBoundingClientRect().top+scrollY-80));
  if(await panel().isVisible())await panel().evaluate(e=>e.scrollTop=0);
  const m=await page.evaluate(()=>{
   const root=document.querySelector('.reference-inspector')||document.body;
   const visible=e=>{for(let d=e.parentElement?.closest('details:not([open])');d;d=d.parentElement?.closest('details:not([open])')){if(!d.querySelector(':scope > summary')?.contains(e))return false;}const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth&&s.visibility!=='hidden'&&s.display!=='none';};
   const all=[root,...root.querySelectorAll('*')].filter(visible);
   const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number);
   const accent=(e,kind)=>{const s=getComputedStyle(e),r=e.getBoundingClientRect(),a=rgb(s.backgroundColor);return a.length>=3&&(a[3]===undefined||a[3]>.5)&&r.width*r.height>500&&(kind==='yellow'?a[0]>150&&a[1]>140&&a[2]<110:a[0]>150&&a[1]<130&&a[2]>80);};
   const strong=all.filter(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return r.width>30&&r.height>24&&['Top','Right','Bottom','Left'].filter(k=>parseFloat(s['border'+k+'Width'])>=2&&s['border'+k+'Style']!=='none').length>=3;});
   return {strongContainers:strong.length,yellowRegions:all.filter(e=>accent(e,'yellow')).length,magentaRegions:all.filter(e=>accent(e,'magenta')).length,visibleControls:all.filter(e=>e.matches('button,a[href],input,select,textarea,summary')).length,disclosures:all.filter(e=>e.matches('summary')).length,metadataLines:all.filter(e=>e.matches('.eyebrow,.field-label,.stamp,.source-display,.reference-source-hint')).length,pageHeight:document.documentElement.scrollHeight,inspectorHeight:root===document.body?null:root.scrollHeight,documentWidth:document.documentElement.scrollWidth,viewport:innerWidth};
  });
  await page.screenshot({path:`${out}/${name}-${width}.png`,animations:'disabled'});
  metrics.push({name,width,...m});
 }
 await page.setViewportSize({width:1440,height:1000});await page.waitForTimeout(150);
}
async function close(){if(await panel().isVisible())await panel().getByRole('button',{name:'닫기',exact:true}).click();}
async function search(q,open=true){await close();await page.getByRole('textbox',{name:'작업대 검색'}).fill(q);await page.waitForTimeout(100);if(open){await page.locator('.desk-search-results .reference-select-action').first().click();await panel().waitFor();}}
async function nav(label){await close();await page.getByRole('button',{name:new RegExp('^'+label)}).first().click();await page.waitForTimeout(200);}
try{
 await page.goto(url);await page.waitForLoadState('networkidle');
 await capture('reference-desk');
 await search('reaction',false);await capture('search-results');
 await page.locator('.desk-search-results .reference-select-action').first().click();await capture('oracle-result');
 await panel().locator('.source-disclosure > summary').click();await capture('source-disclosure');
 await panel().getByRole('button',{name:/^(TABLE|표 보기)/}).click();await capture('table-inspector');
 await search('RECLVSE Travel');await panel().getByRole('button',{name:/^Make Camp/}).click();await capture('reclvse-procedure');
 await search('Rare Monster Five Cards');await capture('depths-cards');
 await nav('나의 캠페인');await page.locator('.campaign-card .card-title').first().click();
 await nav('캐릭터');await page.locator('.compact-card-main').first().click();await page.locator('.character-sheet').waitFor();await capture('character');
 await nav('던전 보관함');
 if(!await page.locator('.dungeon-tabs').count())await page.locator('.compact-card-main').first().click();
 await page.locator('.dungeon-tabs').getByRole('button',{name:'개요',exact:true}).click();await capture('dungeon');
 await page.locator('.dungeon-tabs').getByRole('button',{name:/^방/}).click();await page.locator('.room-select').nth(1).click();await capture('expanded-room','.room-detail');
 await nav('몬스터');await page.locator('.compact-card-main').first().click();await capture('monster');
 await nav('NPC');await page.locator('.compact-card-main').first().click();await capture('npc');
 await nav('조우');await page.locator('.compact-card-main').first().click();await capture('encounter');
 assert.deepEqual(errors,[]);
 writeFileSync(`docs/visual-quieting/${phase}-metrics.json`,JSON.stringify({phase,url,fixture:'Existing isolated QA characters/dungeons plus existing library QA objects; QA-only Math.random seed 730521',metrics,errors},null,2)+'\n');
 await context.storageState({path:`outputs/visual-quieting/${phase}-accepted-storage.json`,indexedDB:true});
 console.log(JSON.stringify({phase,screenshots:metrics.length,errors,overflow:metrics.filter(m=>m.documentWidth>m.width+1)}));
}catch(e){await page.screenshot({path:`${out}/failure.png`});writeFileSync(`${out}/failure.txt`,String(e.stack)+'\n'+await page.locator('body').innerText());throw e;}finally{await browser.close();}
