import { chromium } from '/Users/imwul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';

const url = process.env.QA_URL || 'http://127.0.0.1:5175';
const out = 'outputs/visual-quieting/table-use';
mkdirSync(out, { recursive: true });
const storage = JSON.parse(readFileSync('outputs/pdf-remediation-batch-3/generated-accepted-storage.json'));
for (const origin of storage.origins) origin.origin = url;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
try {
  for (const width of [360, 1440]) {
    const context = await browser.newContext({ storageState: storage, viewport: { width, height: 1000 }, hasTouch: width === 360, reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    const snapshot = await page.evaluate(() => JSON.parse(localStorage.getItem('morkborg-codex:v6')).campaigns);
    await page.getByRole('textbox', { name: '작업대 검색' }).fill('Weapons');
    await page.locator('.desk-search-results .reference-select-action').first().click();
    const inspector = page.locator('.reference-inspector');
    await inspector.waitFor();
    await inspector.locator('.source-disclosure > summary').first().click();
    await inspector.getByRole('button', { name: '표 보기', exact: true }).click();
    const row = inspector.locator('tr').filter({ has: page.locator('.table-use-entry') }).first();
    const selector = await row.locator('th').innerText();
    await row.locator('.table-use-entry').scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${out}/table-${width}.png` });
    await row.locator('.table-use-entry').click();
    assert.equal(await inspector.locator('table').count(), 0);
    assert.ok((await inspector.locator('.reference-reading').innerText()).length);
    if (await inspector.locator('.source-disclosure').first().getAttribute('open') === null) {
      await inspector.locator('.source-disclosure > summary').first().click();
    }
    const source = await inspector.locator('.source-disclosure-body').innerText();
    assert.match(source, /APP POLICY/);
    assert.doesNotMatch(source, /굴림\s*\d/); // A manual choice must not become a fabricated roll.
    await page.screenshot({ path: `${out}/selected-${width}.png` });
    await inspector.getByRole('button', { name: '표 보기', exact: true }).click();
    assert.ok(await inspector.locator('table').count());
    await inspector.getByRole('button', { name: '닫기', exact: true }).click();
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem('morkborg-codex:v6')).campaigns), snapshot);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.deepEqual(errors, []);
    results.push({ width, table: 'Weapons', selectedSelector: selector, result: 'PASS', checks: ['Manual row choice produces transient reading', 'Source labels APP POLICY without fabricated roll', 'Return to table and close preserve context', 'Campaigns unchanged', 'No horizontal overflow or browser errors'] });
    await context.close();
  }
  writeFileSync('docs/visual-quieting/table-use-acceptance.json', JSON.stringify({ url, results }, null, 2) + '\n');
  console.log(JSON.stringify(results));
} finally {
  await browser.close();
}
