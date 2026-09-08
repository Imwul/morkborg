import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { chromium } from '/Users/imwul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const origin = process.env.QA_URL || 'http://127.0.0.1:5174';
const storage = JSON.parse(
  readFileSync(
    'outputs/pdf-remediation-batch-1/accepted-character-storage.json',
    'utf8',
  ),
);
for (const o of storage.origins) o.origin = origin;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({
  storageState: storage,
  viewport: { width: 1440, height: 1000 },
  reducedMotion: 'reduce',
  permissions: ['clipboard-read', 'clipboard-write'],
});
const page = await context.newPage();
page.setDefaultTimeout(12000);
const actions = [],
  checks = [],
  screens = [],
  errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const panel = () => page.locator('.reference-inspector');
async function click(locator, action) {
  await locator.click();
  actions.push(action);
}
async function close() {
  if (await panel().isVisible())
    await click(
      panel().getByRole('button', { name: '닫기', exact: true }),
      'Close reference / return',
    );
}
async function search(query, expect) {
  await close();
  const desk = page.getByRole('textbox', { name: '작업대 검색' });
  if (await desk.isVisible()) {
    await desk.fill(query);
    actions.push('Type search: ' + query);
    await click(
      page.locator('.desk-search-results .reference-select-action').first(),
      'Open first result: ' + query,
    );
  } else {
    await page.keyboard.press('Meta+k');
    actions.push('Command search');
    await page.getByRole('textbox', { name: '통합 참조 검색' }).fill(query);
    actions.push('Type search: ' + query);
    await click(
      page.locator('.reference-search-dialog .reference-select-action').first(),
      'Open first result: ' + query,
    );
  }
  await panel().waitFor();
  assert.match(await panel().innerText(), expect, query);
  assert.equal(await panel().locator('.source-disclosure[open]').count(), 0);
  checks.push({ query, usableMechanic: true, sourceClosed: true });
}
async function capture(name) {
  for (const width of [360, 768, 1440, 3440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(180);
    await panel().evaluate((e) => (e.scrollTop = 0));
    const metrics = await panel().evaluate((e) => ({
      docOverflow: document.documentElement.scrollWidth > innerWidth,
      panelOverflow: e.scrollWidth > e.clientWidth + 1,
      panelWidth: Math.round(e.getBoundingClientRect().width),
      koreanFont: getComputedStyle(e.querySelector('[lang=ko]')).fontSize,
    }));
    assert.equal(metrics.docOverflow, false);
    assert.equal(metrics.panelOverflow, false);
    const path = `outputs/pdf-remediation-batch-3/${name}-${width}.png`;
    await page.screenshot({ path, animations: 'disabled' });
    screens.push({ name, width, ...metrics, path });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
}
let failure;
try {
  await page.goto(origin);
  await page.waitForLoadState('networkidle');
  const before = await page.evaluate(() =>
    JSON.stringify(
      JSON.parse(localStorage.getItem('morkborg-codex:v6')).campaigns,
    ),
  );
  await search('difficulty', /DR6.*DR18/s);
  await capture('difficulty');
  await search('round duration', /10 rounds.*minute/s);
  await search('movement', /normal-sized room/);
  await close();
  await click(
    page.getByRole('button', { name: '나의 캠페인', exact: true }),
    'Open campaigns',
  );
  await click(
    page.getByRole('button', {
      name: 'PDF Batch 1 · isolated QA',
      exact: true,
    }),
    'Open isolated QA campaign',
  );
  await click(
    page.getByRole('button', { name: '캐릭터', exact: true }),
    'Open Character library',
  );
  if (!(await page.locator('.character-sheet').count()))
    await click(
      page.locator('.character-library .compact-card-main').first(),
      'Open existing Character',
    );
  const fields = [
    ['Armor · 방어구 reference', /d2/],
    ['장비 · 소지 한도 reference', /Strength \+ 8/],
    ['Omens · 징조 reference', /Crit or Fumble/],
    ['Powers · 하루 사용 횟수 reference', /Presence \+ d4/],
    ['장비 1 reference', /Unmet Fate/],
  ];
  for (const [label, expected] of fields) {
    await click(
      page.getByRole('button', { name: label, exact: true }),
      'Character direct reference: ' + label,
    );
    assert.match(await panel().innerText(), expected);
    checks.push({ characterLink: label, clicks: 1, usable: true });
    await close();
  }
  for (const [q, expected] of [
    ['Broken', /0 HP.*Broken/s],
    ['negative HP', /negative HP.*dead/],
    ['healing', /d4 HP.*d6 HP/s],
    ['starvation', /two days.*d4 HP/s],
    ['thirst', /Without food or drink/],
    ['morale', /greater than.*Morale/s],
    ['flee', /Agility/],
    ['Get Better', /6d10/],
  ])
    await search(q, expected);
  await search('armor repair', /25s.*40s/s);
  await capture('services');
  await click(panel().locator('.source-disclosure > summary'), 'Open Source');
  assert.match(await panel().innerText(), /PRIMARY SOURCE|PRIMARY/);
  assert.match(await panel().innerText(), /APP POLICY/);
  checks.push({ sourceAuthority: true, clicks: 1 });
  await close();
  await search('Broken', /0 HP/);
  await click(
    panel()
      .locator('details')
      .filter({ has: page.locator('summary', { hasText: 'RELATED' }) })
      .locator('summary')
      .first(),
    'Open related references',
  );
  await click(
    panel().getByRole('button', { name: 'Broken', exact: true }),
    'Roll existing Broken table',
  );
  await click(
    panel().getByRole('button', { name: 'COPY', exact: true }),
    'Copy Broken result',
  );
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  assert.ok(copied.length > 0);
  assert.doesNotMatch(copied, /datasetVersion|definition:/);
  await click(
    panel().getByRole('button', { name: '이전 참조', exact: true }),
    'Back to Broken rule',
  );
  assert.match(await panel().innerText(), /negative HP/);
  checks.push({ brokenRollCopyBack: true });
  await close();
  await click(
    page.getByRole('button', { name: 'REFERENCE DESK', exact: true }),
    'Return Reference Desk',
  );
  await page.reload();
  actions.push('Reload browser');
  await page.waitForLoadState('networkidle');
  const after = await page.evaluate(() =>
    JSON.stringify(
      JSON.parse(localStorage.getItem('morkborg-codex:v6')).campaigns,
    ),
  );
  assert.equal(after, before);
  checks.push({
    campaignUnchanged: true,
    sha256: createHash('sha256').update(after).digest('hex'),
    hypotheticalHPOnly: true,
  });
} catch (e) {
  failure = e.message;
  console.error(e);
  await page.screenshot({
    path: 'outputs/pdf-remediation-batch-3/core-scenario-failure.png',
  });
}
writeFileSync(
  'docs/pdf-remediation-batch-3/core-scenario.json',
  JSON.stringify(
    {
      origin,
      actions,
      totalInteractions: actions.length,
      convention:
        'Count every click, search fill, Command-K and reload; viewport changes are not play interactions. Existing isolated QA Character only; hypothetical HP 0, no edits.',
      checks,
      screens,
      errors,
      failure,
    },
    null,
    2,
  ) + '\n',
);
console.log({ checks: checks.length, interactions: actions.length, failure });
await browser.close();
if (failure) process.exitCode = 1;
