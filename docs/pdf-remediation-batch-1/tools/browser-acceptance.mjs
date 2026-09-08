/** Scoped Batch 1 UI acceptance. Private readings/screenshots stay in ignored outputs/. */
import { writeFileSync, mkdirSync } from 'node:fs';
const { chromium } = await import(
  process.env.AUDIT_PLAYWRIGHT_MODULE || 'playwright'
);
const out = 'outputs/pdf-remediation-batch-1';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: 'reduce',
  permissions: ['clipboard-read', 'clipboard-write'],
});
const page = await context.newPage();
page.setDefaultTimeout(8000);
const errors = [],
  records = [],
  privateReadings = [];
page.on('pageerror', (e) => errors.push(e.message));
try {
  await page.goto(process.env.AUDIT_URL || 'http://127.0.0.1:5174');
  await page.waitForLoadState('networkidle');
  const queries = [
    'Daemon of Capillaries',
    'Fanged Deserter',
    'Zweihänder',
    'medicine box',
    'Omens',
    '피 0',
    '갑옷',
    '도망',
    '휴식',
    '마법',
    '스크롤',
    '짐',
    '사기',
    '반응',
    '시체',
    '보물',
    'daily misery',
    'road travel times',
    'Pray',
    'Directions',
    'Stash',
    'City Crawl',
  ];
  for (const query of queries) {
    await page.getByRole('textbox', { name: '작업대 검색' }).fill(query);
    const found = page.locator('.desk-search-results .reference-select-action');
    const buttons = await found.evaluateAll((es) =>
      es.map((e) => e.getAttribute('aria-label')),
    );
    if (!buttons.length) throw Error('No results: ' + query);
    const began = Date.now();
    await found.first().click();
    const panel = page.locator('.reference-inspector');
    await panel.waitFor({ state: 'visible' });
    await page.waitForTimeout(150);
    const text = await panel.innerText();
    privateReadings.push({ query, text });
    const record = {
      query,
      topResult: buttons[0],
      top5: buttons.slice(0, 5),
      clicksAfterQuery: 1,
      elapsedAfterQueryMs: Date.now() - began,
      sourceClosed:
        (await panel.locator('.source-disclosure[open]').count()) === 0,
      hasReading:
        (await panel.locator('.reference-reading,.city-roller').count()) > 0,
    };
    if (!record.hasReading) throw Error('No readable answer: ' + query);
    if (query === 'Daemon of Capillaries') {
      if (!text.includes('d6 rounds') || !text.includes('d4 HP per round'))
        throw Error('Missing Power effect');
      await page.screenshot({
        animations: 'disabled',
        path: out + '/power-desktop.png',
      });
      await panel.getByRole('button', { name: 'COPY', exact: true }).click();
      record.copyClicks = 1;
      record.copyCorrect = await page.evaluate(() =>
        navigator.clipboard
          .readText()
          .then((t) => t.includes('d6 rounds') && !t.includes('definition:')),
      );
      for (const width of [360, 768, 3440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForTimeout(300);
        record['overflow' + width] = await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        );
        await page.screenshot({
          animations: 'disabled',
          path: `${out}/power-${width}.png`,
        });
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
    if (
      ['Fanged Deserter', 'Zweihänder', 'medicine box', 'Pray'].includes(query)
    )
      await page.screenshot({
        animations: 'disabled',
        path: out + '/' + query.replaceAll(' ', '-') + '.png',
      });
    if (query === 'Pray') {
      await panel
        .getByRole('button', { name: '주사위 굴리기 · 기도', exact: true })
        .click();
      record.executeClicks = 1;
      record.moveResultVisible =
        (await panel.locator('.reference-reading').count()) > 0;
    }
    records.push(record);
    await panel.getByRole('button', { name: '닫기', exact: true }).click();
  }
  await page.getByRole('textbox', { name: '작업대 검색' }).fill('');
  await page.getByRole('button', { name: '나의 캠페인', exact: true }).click();
  console.log(
    'CAMPAIGN SCREEN',
    (await page.locator('body').innerText()).slice(0, 2600),
  );
  await context.storageState({
    path: out + '/qa-storage.json',
    indexedDB: true,
  });
  writeFileSync(
    out + '/private-browser-readings.json',
    JSON.stringify(privateReadings, null, 2) + '\n',
  );
  writeFileSync(
    'docs/pdf-remediation-batch-1/browser-search.json',
    JSON.stringify(
      {
        testedAt: new Date().toISOString(),
        method:
          'Isolated actual Chrome UI; activations counted after query entry; source/copy separate. No campaign/session needed for lookup.',
        records,
        errors,
      },
      null,
      2,
    ) + '\n',
  );
  console.log('SEARCH', records.length, 'ERRORS', errors);
} finally {
  await browser.close();
}
