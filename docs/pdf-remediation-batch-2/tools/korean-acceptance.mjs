import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const { chromium } = await import(
  process.env.AUDIT_PLAYWRIGHT_MODULE || 'playwright'
);
const url = process.env.AUDIT_URL || 'http://127.0.0.1:5175';
const out = 'outputs/batch-2-korean';
mkdirSync(out, { recursive: true });
const bundle = JSON.parse(
  readFileSync('outputs/morkborg-private-data.json', 'utf8'),
);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: 'reduce',
});
const page = await context.newPage();
page.setDefaultTimeout(12000);
const records = [],
  visual = [],
  errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const panel = () => page.locator('.reference-inspector');
const normal = (text) => text.replace(/\s+/g, ' ').trim();
async function search(query) {
  if (await panel().isVisible())
    await panel().getByRole('button', { name: '닫기', exact: true }).click();
  await page.getByRole('textbox', { name: '작업대 검색' }).fill(query);
  await page
    .locator('.desk-search-results .reference-select-action')
    .first()
    .click();
  await panel().waitFor();
}
async function capture(name) {
  for (const width of [360, 768, 1440, 3440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(180);
    await panel().evaluate((e) => (e.scrollTop = 0));
    const metrics = await panel().evaluate((e) => ({
      pageOverflow: document.documentElement.scrollWidth > innerWidth,
      inspectorOverflow: e.scrollWidth > e.clientWidth + 1,
      width: Math.round(e.getBoundingClientRect().width),
      koreanSize: getComputedStyle(e.querySelector('[lang="ko"]')).fontSize,
    }));
    assert.equal(metrics.pageOverflow, false, name + width);
    assert.equal(metrics.inspectorOverflow, false, name + width);
    const path = `${out}/${name}-${width}.png`;
    await page.screenshot({ path, animations: 'disabled' });
    visual.push({ name, width, ...metrics, path });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
}
let failure;
try {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  for (const t of bundle.oracles.tables.filter((t) =>
    t.tags.includes('batch-2'),
  ))
    for (const e of t.entries) {
      const m = e.metadata;
      if (!m?.blocks) continue;
      await search(m.name);
      const procedure = panel().locator('.reference-procedure-rule');
      if (await procedure.count()) await procedure.locator('summary').click();
      const visible = normal(await panel().innerText());
      for (const block of m.blocks) {
        assert.ok(visible.includes(normal(block.text)), e.id + ' English');
        assert.ok(
          visible.includes(normal(block.translation.ko)),
          e.id + ' Korean',
        );
      }
      assert.equal(
        await panel().locator('.source-disclosure[open]').count(),
        0,
      );
      records.push({
        referenceId: m.referenceId,
        blocks: m.blocks.length,
        english: true,
        korean: true,
        sourceClosed: true,
      });
    }
  await search('Make Camp');
  await capture('camp');
  await search('RECLVSE');
  assert.match(await panel().innerText(), /기본 판정/);
  await capture('groups');
  await search('Arquebus');
  assert.match(await panel().innerText(), /재장전/);
  await capture('blackpowder');
  await search('Mythic Event Focus Next Steps');
  assert.match(await panel().innerText(), /실마리/);
  await capture('mythic');
  await search('Depths Encounter Level');
  await panel().getByRole('button', { name: 'ROLL', exact: true }).click();
  assert.match(await panel().innerText(), /조우/);
  await capture('encounter');
  await search('Rare Monster Five Cards');
  assert.ok(
    [5, 6].includes(await panel().locator('.rare-card-strip strong').count()),
  );
  assert.match(await panel().locator('.reference-reading').innerText(), /사기/);
  await capture('cards');
  const cards = await panel().locator('.rare-card-strip').innerText();
  await panel().locator('.source-disclosure > summary').click();
  await panel().locator('.source-roll-link').first().click();
  const entries = panel().locator('.reference-table-section');
  await entries.waitFor();
  const detail = entries.locator('.table-entry-detail > summary').first();
  if (await detail.count()) await detail.click();
  assert.ok(await entries.locator('[lang="ko"]').count());
  await panel().getByRole('button', { name: '이전 참조', exact: true }).click();
  assert.equal(await panel().locator('.rare-card-strip').innerText(), cards);
  records.push({
    check: 'Card source → bilingual table → Back preserves cards',
    passed: true,
  });
  for (const query of [
    'Rotten Nurse',
    'Mikhael',
    'Carcasswan',
    'Lentil Lice',
  ]) {
    await search(query);
    const more = panel().locator('.reading-more > summary');
    if (await more.count()) await more.click();
    assert.ok(
      await panel().locator('.reference-reading [lang="ko"]').count(),
      query,
    );
    records.push({ check: query + ' bilingual definition', passed: true });
  }
  await search('RECLVSE Critical Die');
  await panel().locator('.source-disclosure > summary').click();
  assert.match(await panel().innerText(), /주사위 선택 규칙을 추가하지/);
  records.push({
    check: 'Source ambiguity has Korean explanation',
    passed: true,
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
  await search('RECLVSE Morale');
  assert.match(await panel().innerText(), /수적으로 밀리거나/);
  records.push({
    check: 'Bilingual private data survives reload',
    passed: true,
  });
  const older = JSON.parse(
    readFileSync(out + '/private-data-before.json', 'utf8'),
  );
  const oldRevision = older.updateConnection.revision;
  delete older.updateConnection;
  const oldContext = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const oldPage = await oldContext.newPage();
  // Deliver the actual previous source pack, then exercise a normal service update.
  await oldPage.route('**/api/rulebook-data?*', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        schemaVersion: 1,
        revision: oldRevision,
        bundle: older,
      }),
    }),
  );
  await oldPage.goto(url);
  await oldPage.waitForLoadState('networkidle');
  await oldPage
    .getByRole('textbox', { name: '작업대 검색' })
    .fill('RECLVSE Morale');
  await oldPage
    .locator('.desk-search-results .reference-select-action')
    .first()
    .click();
  assert.doesNotMatch(
    await oldPage.locator('.reference-reading').innerText(),
    /수적으로 밀리거나/,
  );
  await oldPage.unroute('**/api/rulebook-data?*');
  await oldPage.reload();
  await oldPage.waitForLoadState('networkidle');
  await oldPage
    .getByRole('textbox', { name: '작업대 검색' })
    .fill('RECLVSE Morale');
  await oldPage
    .locator('.desk-search-results .reference-select-action')
    .first()
    .click();
  assert.match(
    await oldPage.locator('.reference-reading').innerText(),
    /수적으로 밀리거나/,
  );
  records.push({
    check:
      'Existing Batch 2 cache receives bilingual blocks through the real API update',
    passed: true,
  });
  await oldContext.close();
  assert.deepEqual(errors, []);
} catch (e) {
  failure = String(e.stack || e);
  console.error(failure);
  await page.screenshot({ path: out + '/failure.png' });
  process.exitCode = 1;
} finally {
  writeFileSync(
    'docs/pdf-remediation-batch-2/korean-browser.json',
    JSON.stringify(
      { at: new Date().toISOString(), url, records, visual, errors, failure },
      null,
      2,
    ) + '\n',
  );
  await browser.close();
  console.log(
    JSON.stringify({
      references: records.length,
      viewports: visual.length,
      errors: errors.length,
      passed: !failure,
    }),
  );
}
