import { writeFileSync } from 'node:fs';
const { chromium } = await import(
  process.env.AUDIT_PLAYWRIGHT_MODULE || 'playwright'
);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({
  storageState:
    'outputs/pdf-remediation-batch-1/accepted-character-storage.json',
  viewport: { width: 1440, height: 1000 },
  reducedMotion: 'reduce',
});
const page = await context.newPage();
page.setDefaultTimeout(8000);
const errors = [],
  records = [];
page.on('pageerror', (e) => errors.push(e.message));
try {
  await page.goto(process.env.AUDIT_URL || 'http://127.0.0.1:5174');
  await page.waitForLoadState('networkidle');
  if (
    !(await page
      .getByRole('button', { name: '재앙 · 여행', exact: true })
      .count())
  ) {
    await page
      .getByRole('button', { name: '나의 캠페인', exact: true })
      .click();
    await page
      .getByRole('button', { name: 'PDF Batch 1 · isolated QA', exact: true })
      .click();
  }
  await page.getByRole('button', { name: '재앙 · 여행', exact: true }).click();
  await page
    .getByRole('button', {
      name: 'Sölitary Defilement daily variant ›',
      exact: true,
    })
    .first()
    .click();
  let panel = page.locator('.reference-inspector');
  if (!(await panel.innerText()).includes('no higher than d20'))
    throw Error('Journey daily link wrong');
  records.push({
    context: 'Journey daily block',
    title: 'SD Daily Misery',
    referenceClicks: 1,
  });
  await panel.getByRole('button', { name: '닫기', exact: true }).click();
  await page
    .locator('.journey-block > summary')
    .filter({ hasText: '여행 또는 채집' })
    .click();
  await page
    .getByRole('button', { name: 'Road travel times ›', exact: true })
    .click();
  if (!(await panel.innerText()).includes('Alliáns — Galgenbeck'))
    throw Error('Journey route link wrong');
  records.push({
    context: 'Journey travel block',
    title: 'Road travel times',
    expandBlockClicks: 1,
    referenceClicks: 1,
  });
  await panel.getByRole('button', { name: '닫기', exact: true }).click();
  await page
    .getByRole('button', { name: 'CALENDAR · 관리', exact: true })
    .click();
  await page
    .getByRole('button', {
      name: 'Sölitary Defilement daily variant ›',
      exact: true,
    })
    .click();
  if (!(await panel.innerText()).includes('after each Misery'))
    throw Error('Calendar variant link wrong');
  records.push({
    context: 'Calendar management',
    title: 'SD Daily Misery',
    referenceClicks: 1,
  });
  writeFileSync(
    'docs/pdf-remediation-batch-1/browser-journey.json',
    JSON.stringify(
      { testedAt: new Date().toISOString(), records, errors },
      null,
      2,
    ) + '\n',
  );
  console.log(
    'Journey/Calendar links',
    records.length,
    'errors',
    errors.length,
  );
} finally {
  await browser.close();
}
