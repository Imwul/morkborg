/** Isolated browser audit. Needs the local private-data server and prior QA storage. */
import {writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const {chromium}=await import(process.env.AUDIT_PLAYWRIGHT_MODULE||'playwright');
const out='outputs/pdf-escape-audit/head-recheck';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({storageState:'outputs/pdf-escape-audit/qa-storage.json',viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']});
const page=await context.newPage();page.setDefaultTimeout(5000);
const records=[],raw=[];const start=new Date().toISOString();
try {
  await page.goto(process.env.AUDIT_URL||'http://127.0.0.1:5174');await page.waitForLoadState('networkidle');
  for(const query of ['Powers','power','casting','권능','마법','Daemon of Capillaries','healing','피 0','Omens','solo variant','sacred scroll','unclean scroll','weapons','reaction','morale','broken','armor','rest','Prowler','Sarkash monster']) {
    await page.getByRole('textbox',{name:'작업대 검색'}).fill(query);
    const found=page.locator('.desk-search-results .reference-select-action');
    const buttons=await found.evaluateAll(els=>els.map(e=>e.getAttribute('aria-label')));
    const noResults=buttons.length===0;
    const record={query,buttons:buttons.slice(0,5),noResults,clicks:0};
    const openQueries=['Powers','Omens','solo variant','sacred scroll','unclean scroll','weapons','reaction','morale','broken','armor','rest','Prowler','Sarkash monster'];
    if(openQueries.includes(query)) {
      await found.first().click();record.clicks++;
      const panel=page.locator('.reference-inspector');await panel.waitFor({state:'visible'});
      raw.push({query,text:await panel.innerText()});
      if(['sacred scroll','unclean scroll','weapons'].includes(query)) {
        await panel.locator('summary').filter({hasText:/^SOURCE$/}).click();record.sourceClicks=1;
        await panel.getByRole('button',{name:'TABLE · 원문 표 열기',exact:true}).click();record.tableClicks=1;
        record.tableRows=await panel.locator('tbody tr').count();
        raw.push({query,tableText:await panel.locator('.reference-static-table').innerText()});
        await page.screenshot({path:`${out}/${query.replaceAll(' ','-')}.png`});
      }
      if(query==='reaction') {
        await panel.getByRole('button',{name:'COPY',exact:true}).click();record.copyClicks=1;
        record.clipboardNonempty=!!(await page.evaluate(()=>navigator.clipboard.readText()));
        await page.setViewportSize({width:360,height:800});
        await panel.locator('summary').filter({hasText:/^SOURCE$/}).click();
        record.mobileNoOverflow=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);
        await page.screenshot({path:`${out}/mobile-source.png`});
        await page.setViewportSize({width:1440,height:1000});
      }
      await panel.getByRole('button',{name:'닫기',exact:true}).click();
    }
    records.push(record);
  }
  writeFileSync(out+'/private-results.json',JSON.stringify(raw,null,2)+'\n');
  const report={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),startedAt:start,endedAt:new Date().toISOString(),
    method:'Fresh isolated browser at current HEAD using prior disposable QA storage. Clicks count activations after query entry; source/table/copy are separate. Private text/screenshots remain ignored.',records};
  writeFileSync('docs/pdf-escape-audit/data/head-browser-recheck.json',JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report,null,2));
} finally {await browser.close();}
