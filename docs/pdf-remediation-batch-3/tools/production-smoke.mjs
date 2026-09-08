import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { chromium } from '/Users/imwul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const url = process.env.QA_URL || 'https://morkborg-4e3y.vercel.app';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: 'reduce',
});
const page = await context.newPage();
const errors = [],
  checks = [];
page.on('pageerror', (e) => errors.push(e.message));
page.setDefaultTimeout(20000);
let failure;
try {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  for (const [query, required] of [
    ['DR', /DR18/],
    ['movement', /10 rounds/],
    ['starvation', /two days/],
    ['negative HP', /negative HP.*dead/s],
    ['Power', /Each morning.*Presence \+ d4/s],
    ['armor repair', /25s.*40s/s],
    ['life elixir', /heals d6 HP/],
    ['RECLVSE Morale', /Morale/],
    ['Rare Monster Five Cards', /CARD 1|Card 1/],
    ['Arquebus', /Arquebus/],
  ]) {
    const panel = page.locator('.reference-inspector');
    if (await panel.isVisible())
      await panel.getByRole('button', { name: '닫기', exact: true }).click();
    await page.getByRole('textbox', { name: '작업대 검색' }).fill(query);
    await page
      .locator('.desk-search-results .reference-select-action')
      .first()
      .click();
    await panel.waitFor();
    assert.match(await panel.innerText(), required, query);
    assert.equal(await panel.locator('.source-disclosure[open]').count(), 0);
    assert.ok(await panel.locator('[lang=ko]').count(), query + ' Korean');
    checks.push({
      query,
      usable: true,
      korean: true,
      sourceClosed: true,
      clicksAfterQuery: 1,
    });
  }
  const revision = await page.evaluate(async () => {
    const r = await fetch('/private-updates/latest.json', {
      cache: 'no-store',
    });
    const m = await r.json();
    return m.revision;
  });
  checks.push({ privateRevision: revision, privateDataLoaded: true });
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.getByRole('textbox', { name: '작업대 검색' }).fill('life elixir');
  await page
    .locator('.desk-search-results .reference-select-action')
    .first()
    .click();
  assert.match(
    await page.locator('.reference-inspector').innerText(),
    /heals d6 HP/,
  );
  await page.setViewportSize({ width: 360, height: 900 });
  await page.waitForTimeout(200);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await page.screenshot({
    path: 'outputs/pdf-remediation-batch-3/production-360.png',
    animations: 'disabled',
  });
  assert.deepEqual(errors, []);
} catch (e) {
  failure = e.message;
  console.error(failure);
}
writeFileSync(
  'outputs/pdf-remediation-batch-3/production-smoke.json',
  JSON.stringify(
    {
      url,
      testedAt: new Date().toISOString(),
      commit: process.env.QA_COMMIT,
      checks,
      errors,
      failure,
    },
    null,
    2,
  ) + '\n',
);
console.log({ url, checks: checks.length, errors, failure });
await browser.close();
if (failure) process.exitCode = 1;
