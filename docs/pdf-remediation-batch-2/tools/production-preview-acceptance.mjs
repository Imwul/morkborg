/** Local production build + real rulebook API. Restores only isolated earlier QA data. */
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const { chromium } = await import(
  process.env.AUDIT_PLAYWRIGHT_MODULE || 'playwright'
);
const url = process.env.AUDIT_URL || 'http://127.0.0.1:5175';
const state = JSON.parse(
  readFileSync(
    'outputs/pdf-remediation-batch-1/accepted-character-storage.json',
    'utf8',
  ),
);
for (const origin of state.origins) origin.origin = url;
const original = JSON.parse(
  state.origins[0].localStorage.find((v) => v.name === 'morkborg-codex:v6')
    .value,
).campaigns;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({
  storageState: state,
  viewport: { width: 1440, height: 1000 },
  reducedMotion: 'reduce',
});
const page = await context.newPage();
page.setDefaultTimeout(15000);
const errors = [],
  checks = [];
page.on('pageerror', (e) => errors.push(e.message));
const inspect = () => page.locator('.reference-inspector');
async function search(query, required) {
  if (await inspect().isVisible())
    await inspect().getByRole('button', { name: '닫기', exact: true }).click();
  await page.getByRole('textbox', { name: '작업대 검색' }).fill(query);
  await page
    .locator('.desk-search-results .reference-select-action')
    .first()
    .click();
  await inspect().waitFor();
  if (required) assert.match(await inspect().innerText(), required);
}
const campaigns = () =>
  page.evaluate(
    () => JSON.parse(localStorage.getItem('morkborg-codex:v6')).campaigns,
  );
let failure;
try {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await search('RECLVSE Morale', /outnumbered/);
  checks.push({
    check:
      'Older Batch 1 cache receives new Batch 2 catalog through real local API',
    passed: true,
  });
  await search('Rare Monster Five Cards', /CARD 1/);
  await inspect()
    .getByRole('button', { name: '참조 고정', exact: true })
    .click();
  const beforePin = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('morkborg-reference-desk:v1')).pinnedIds,
  );
  await inspect().getByRole('button', { name: '닫기', exact: true }).click();
  await page.reload();
  await page.waitForLoadState('networkidle');
  assert.deepEqual(await campaigns(), original);
  assert.deepEqual(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('morkborg-reference-desk:v1'))
          .pinnedIds,
    ),
    beforePin,
  );
  await page
    .locator('.desk-pinned-actions')
    .getByRole('button', { name: /Rare Monster/ })
    .first()
    .click();
  assert.ok(
    [5, 6].includes(await inspect().locator('.rare-card-strip strong').count()),
  );
  checks.push({
    check:
      'Pin persists and runs five-card procedure in one click after reload',
    passed: true,
  });
  await search('Gunsmith', /Gunsmith/);
  await inspect().locator('.reference-next-steps button').click();
  assert.match(await inspect().innerText(), /Presence DR14/);
  checks.push({
    check:
      'Updated canonical Gunsmith outcome retains its blackpowder next reference',
    passed: true,
  });
  await inspect().getByRole('button', { name: '닫기', exact: true }).click();
  await page.getByRole('button', { name: '나의 캠페인', exact: true }).click();
  await page
    .getByRole('button', { name: 'PDF Batch 1 · isolated QA', exact: true })
    .click();
  await page.getByRole('button', { name: '캐릭터', exact: true }).click();
  if (!(await page.locator('.character-sheet').count())) {
    if (await page.locator('.resume-candidate').count())
      await page.locator('.resume-candidate').click();
    else
      await page
        .locator('.character-library .compact-card-main')
        .first()
        .click();
  }
  await page
    .getByRole('button', { name: 'Omens · 징조 reference', exact: true })
    .click();
  assert.match(await inspect().innerText(), /Crit or Fumble/);
  await inspect().getByRole('button', { name: '닫기', exact: true }).click();
  assert.deepEqual(await campaigns(), original);
  checks.push({
    check:
      'Saved Character, Core Omens link and complete Campaign data remain unchanged',
    passed: true,
  });
  // With a complete cache, an unavailable source endpoint never destroys saved material.
  await page.route('**/api/rulebook-data?*', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'QA source outage' }),
    }),
  );
  await page.reload();
  await page.waitForLoadState('networkidle');
  assert.deepEqual(await campaigns(), original);
  await page
    .getByRole('button', { name: 'REFERENCE DESK', exact: true })
    .click();
  await search('Arquebus', /d10 · 180s/);
  checks.push({
    check: 'Cached definitions and Campaign survive rulebook API outage',
    passed: true,
  });
  const fresh = await browser.newContext();
  const blank = await fresh.newPage();
  await blank.route('**/api/rulebook-data?*', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'QA source outage' }),
    }),
  );
  await blank.goto(url);
  await blank.waitForLoadState('networkidle');
  await blank
    .getByRole('textbox', { name: '작업대 검색' })
    .fill('Rare Monster Five Cards');
  assert.equal(
    await blank
      .locator('.desk-search-results .reference-select-action')
      .count(),
    0,
  );
  checks.push({
    check:
      'Fresh browser without private source data cannot run the rare-monster procedure',
    passed: true,
  });
  await fresh.close();
  assert.deepEqual(errors, []);
} catch (e) {
  failure = String(e.stack || e);
  process.exitCode = 1;
  console.error(failure);
  await page.screenshot({
    path: 'outputs/pdf-remediation-batch-2/preview-failure.png',
  });
} finally {
  writeFileSync(
    'docs/pdf-remediation-batch-2/production-preview.json',
    JSON.stringify(
      {
        testedAt: new Date().toISOString(),
        url,
        productionDeployment: false,
        checks,
        campaignSha256: createHash('sha256')
          .update(JSON.stringify(original))
          .digest('hex'),
        errors,
        failure,
      },
      null,
      2,
    ) + '\n',
  );
  await browser.close();
}
