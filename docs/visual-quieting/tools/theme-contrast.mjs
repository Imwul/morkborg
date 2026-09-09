import { chromium } from '/Users/imwul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const phase=process.env.QA_PHASE||'theme-before', url=process.env.QA_URL||'http://127.0.0.1:5175',out=`outputs/visual-quieting/${phase}`;
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
  await page.setViewportSize({width,height:1000});await page.evaluate(()=>scrollTo(0,0));
  if(anchor)await page.locator(anchor).first().evaluate(e=>window.scrollTo(0,e.getBoundingClientRect().top+scrollY-80));
  if(await panel().isVisible())await panel().evaluate(e=>e.scrollTop=0);
  let previousImage;
  for(const colorScheme of ['light','dark']){
   await page.emulateMedia({colorScheme});await page.evaluate(()=>new Promise(requestAnimationFrame));
   const m=await page.evaluate(()=>{
    const root=document.querySelector('.reference-inspector')||document.body;
    const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d',{willReadFrequently:true});
    const colors=new Map();
    function rgba(value){if(colors.has(value))return colors.get(value);ctx.clearRect(0,0,1,1);ctx.fillStyle=value;ctx.fillRect(0,0,1,1);const a=Array.from(ctx.getImageData(0,0,1,1).data);a[3]/=255;colors.set(value,a);return a;}
    const blend=(a,b)=>a.slice(0,3).map((v,i)=>v*a[3]+b[i]*(1-a[3]));
    function bg(e){const chain=[];for(let p=e;p;p=p.parentElement)chain.unshift(p);let b=[255,255,255];for(const p of chain)b=blend(rgba(getComputedStyle(p).backgroundColor),b);return b;}
    const lum=c=>c.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
    const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
    const visible=e=>{for(let d=e.parentElement?.closest('details:not([open])');d;d=d.parentElement?.closest('details:not([open])'))if(!d.querySelector(':scope > summary')?.contains(e))return false;const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
    const items=[];
    for(const e of root.querySelectorAll('*')){
     if(!visible(e)||e.closest('svg'))continue;
     let content=Array.from(e.childNodes).filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();
     let style=getComputedStyle(e),kind='text';
     if(e.matches('input,textarea')){content=e.value||e.placeholder||'';if(!e.value&&e.placeholder){style=getComputedStyle(e,'::placeholder');kind='placeholder';}}
     if(e.matches('select'))content=e.selectedOptions[0]?.textContent||'';
     if(!content||content.length<2||/^\d+$/.test(content)&&e.matches('select'))continue;
     const b=bg(e),raw=[...rgba(style.color)];let opacity=Number(style.opacity);for(let p=e.parentElement;p;p=p.parentElement)opacity*=Number(getComputedStyle(p).opacity);
     if(opacity===0)continue;raw[3]*=opacity;const f=blend(raw,b),contrast=ratio(f,b),size=parseFloat(style.fontSize),weight=parseFloat(style.fontWeight)||400;
     const required=size>=24||(weight>=700&&size>=18.66)?3:4.5;
     const disabled=!!e.closest(':disabled,[aria-disabled=true]');
     items.push({tag:e.tagName,classes:String(e.className).slice(0,160),label:e.getAttribute('aria-label'),text:content.slice(0,80),kind,foreground:style.color,background:b.map(Math.round),opacity,contrast:Math.round(contrast*100)/100,required,disabled});
    }
    return {scheme:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light',nativeScheme:getComputedStyle(document.documentElement).colorScheme,bodyColor:getComputedStyle(document.body).color,bodyBackground:getComputedStyle(document.body).backgroundColor,documentWidth:document.documentElement.scrollWidth,scanned:items.length,failures:items.filter(i=>i.contrast+.02<i.required),minimum:Math.min(...items.filter(i=>!i.disabled).map(i=>i.contrast))};
   });
   const screenshot=await page.screenshot({path:`${out}/${name}-${width}-${colorScheme}.png`,animations:'disabled'});
   metrics.push({name,width,colorScheme,...m,samePixelsAsLight:previousImage?previousImage.equals(screenshot):null});previousImage=screenshot;
  }
 }
 await page.setViewportSize({width:1440,height:1000});await page.emulateMedia({colorScheme:'light'});
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
 await nav('캐릭터');await page.locator('.compact-card-main').first().click();await page.locator('.character-sheet').waitFor();await capture('character');await page.locator('.character-workbench').getByRole('button',{name:'편집',exact:true}).first().click();await capture('character-edit');await page.locator('.character-workbench').getByRole('button',{name:'완료',exact:true}).first().click();
 await nav('던전 보관함');
 if(!await page.locator('.dungeon-tabs').count())await page.locator('.compact-card-main').first().click();
 await page.locator('.dungeon-tabs').getByRole('button',{name:'개요',exact:true}).click();await capture('dungeon');
 await page.locator('.dungeon-tabs').getByRole('button',{name:/^방/}).click();await page.locator('.room-select').nth(1).click();await capture('expanded-room','.room-detail');await page.locator('.room-detail .packet-translation > summary').click();await capture('room-translation','.room-detail');await page.locator('.room-detail .room-packet').getByRole('button',{name:'편집',exact:true}).click();await capture('room-edit','.room-detail');
 await nav('몬스터');await page.locator('.compact-card-main').first().click();await capture('monster');await page.locator('.monster-workbench .object-editor > summary').click();await capture('monster-edit');await page.locator('.monster-sheet [data-field=name] .field-value').first().click();await capture('monster-name-input','.monster-identity-grid');
 await nav('NPC');await page.locator('.compact-card-main').first().click();await capture('npc');
 await nav('조우');await page.locator('.compact-card-main').first().click();await capture('encounter');
 await nav('REFERENCE DESK');await search('Encounter Level');await capture('encounter-level');await search('Pray');await capture('city-procedure');await search('Daemon of Capillaries');await capture('power');assert.deepEqual(errors,[]);
 writeFileSync(`${out}/contrast.json`,JSON.stringify({phase,url,fixture:'Existing isolated QA characters/dungeons plus existing library QA objects; QA-only Math.random seed 730521',metrics,errors},null,2)+'\n');
 if(!phase.includes('before')){assert.equal(metrics.reduce((n,m)=>n+m.failures.filter(f=>!f.disabled).length,0),0,'Enabled text contrast');assert.equal(metrics.filter(m=>m.documentWidth>m.width+1).length,0,'Horizontal overflow');}
 await context.storageState({path:`outputs/visual-quieting/${phase}-accepted-storage.json`,indexedDB:true});
 console.log(JSON.stringify({phase,screenshots:metrics.length,errors,overflow:metrics.filter(m=>m.documentWidth>m.width+1),differentThemeImages:metrics.filter(m=>m.samePixelsAsLight===false).map(m=>[m.name,m.width]),enabledLowContrast:metrics.reduce((n,m)=>n+m.failures.filter(f=>!f.disabled).length,0)}));
}catch(e){await page.screenshot({path:`${out}/failure.png`});writeFileSync(`${out}/failure.txt`,String(e.stack)+'\n'+await page.locator('body').innerText());throw e;}finally{await browser.close();}
