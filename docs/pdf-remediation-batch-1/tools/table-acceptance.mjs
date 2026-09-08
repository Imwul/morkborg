/** Source-table inspection through the actual Reference Desk UI. */
import { writeFileSync } from 'node:fs';
const { chromium } = await import(
  process.env.AUDIT_PLAYWRIGHT_MODULE || 'playwright'
);
const out = 'outputs/pdf-remediation-batch-1';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: 'reduce',
});
const page = await context.newPage();
page.setDefaultTimeout(8000);
const records = [],
  errors = [];
page.on('pageerror', (e) => errors.push(e.message));
async function lookup(query, label) {
  await page.getByRole('textbox', { name: '작업대 검색' }).fill(query);
  await page
    .locator('.desk-search-results')
    .getByRole('button', { name: label, exact: true })
    .click();
  const panel = page.locator('.reference-inspector');
  await panel.waitFor({ state: 'visible' });
  return panel;
}
try {
  await page.goto(process.env.AUDIT_URL || 'http://127.0.0.1:5174');
  await page.waitForLoadState('networkidle');
  const cases = [
    ['unclean', 'Unclean Scrolls ROLL', 'Powers'],
    ['Room Exits', 'Dungeon Room Descriptors — Room Exits ROLL', 'Room exits'],
    [
      'Holy Places',
      'Holy Places — Villages and Smaller ROLL',
      'Small holy places',
    ],
    [
      'Holy Places',
      'Holy Places — Cities and Larger ROLL',
      'Large holy places',
    ],
    [
      'gravesKnowledge',
      'Graves Left Wanting — What You Know About Graven-Tosk ROLL',
      'Truth',
    ],
    [
      'Card 1: Overall Look',
      'Rare Monster — Card 1: Overall Look OPEN',
      'Card selector',
    ],
  ];
  for (const [query, label, kind] of cases) {
    const panel = await lookup(query, label);
    await panel.locator('.source-disclosure > summary').first().click();
    await panel
      .getByRole('button', { name: 'TABLE · 원문 표 열기', exact: true })
      .click();
    const table = panel.locator('.reference-static-table');
    await table.waitFor({ state: 'visible' });
    await page.waitForTimeout(150);
    const text = await table.innerText(),
      record = {
        kind,
        query,
        clicksFromSearch: 3,
        sourceClicks: 1,
        tableClicks: 1,
        rows: await table.locator('tbody tr').count(),
      };
    if (kind === 'Powers') {
      if (!text.includes('d6 rounds') || !text.includes('d4 HP per round'))
        throw Error('Power TABLE effect missing');
      const target = table
        .locator('tr')
        .filter({
          has: page.getByRole('button', {
            name: 'Daemon of Capillaries reference',
            exact: true,
          }),
        });
      await target
        .getByRole('button', { name: 'USE THIS RESULT', exact: true })
        .click();
      record.manualSelectionClicks = 1;
      if (
        !(await panel.locator('.reference-reading').innerText()).includes(
          'd6 rounds',
        )
      )
        throw Error('Chosen effect missing');
      const source = panel.locator('.source-disclosure');
      if ((await source.getAttribute('open')) === null)
        await source.locator('summary').first().click();
      const sourceText = await source.innerText();
      record.manualSelectionPolicy = sourceText.includes('APP POLICY');
      if (!record.manualSelectionPolicy)
        throw Error('Manual selection not distinguished');
    } else if (kind === 'Room exits') {
      record.columnLabels = await table.locator('thead th').allTextContents();
      if (record.columnLabels.join(',') !== 'Roll,0,1,2,3,4')
        throw Error('Room exit columns lost');
      record.usageLabel = text.includes('Special Rooms Uncovered');
      for (const width of [360, 768]) {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForTimeout(250);
        record['overflow' + width] = await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        );
        await page.screenshot({
          path: `${out}/exits-${width}.png`,
          animations: 'disabled',
        });
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
    } else if (kind === 'Truth') {
      record.truthLabels = text.includes('Truth:');
      if (!record.truthLabels) throw Error('Truth metadata absent');
    } else if (kind === 'Card selector') {
      record.firstSelector = await table
        .locator('tbody th')
        .first()
        .innerText();
      if (record.firstSelector !== 'A') throw Error('Card rank lost');
    } else {
      record.conditionNotes = await table
        .locator('.table-entry-detail')
        .count();
      if (!record.conditionNotes) throw Error('Holy place conditions absent');
    }
    await page.screenshot({
      path: `${out}/table-${kind.replaceAll(' ', '-')}.png`,
      animations: 'disabled',
    });
    records.push(record);
    await panel.getByRole('button', { name: '닫기', exact: true }).click();
  }
  const panel = await lookup('Pray', 'Pray OPEN');
  // Conditional tables stay intentionally below the parent procedure.
  await panel.locator('.ref-related-disclosure > summary').click();
  const childLabels = await panel
    .locator('.ref-related-disclosure button')
    .allTextContents();
  await panel
    .locator('.ref-related-disclosure')
    .getByRole('button', { name: 'Pray — Failure', exact: true })
    .click();
  const childOpened = (
    await panel.locator('.reference-inspector-top h2').innerText()
  ).includes('Failure');
  if (!childOpened) throw Error('Pray child not reachable');
  records.push({
    kind: 'City child routing',
    parent: 'Pray',
    childLabels,
    disclosureClicks: 1,
    childClicks: 1,
    childOpened,
  });
  await panel.getByRole('button', { name: '닫기', exact: true }).click();
  await page.getByRole('textbox', { name: '작업대 검색' }).fill('microcrawl');
  const primary = page
    .locator('.desk-search-results .reference-select-action')
    .first();
  const topResult = await primary.getAttribute('aria-label');
  await primary.click();
  await page.getByLabel('탐험 방식').selectOption('micro');
  const microText = await page.locator('.city-crawl-workspace').innerText();
  records.push({
    kind: 'Alöne Micro-crawl routing',
    topResult,
    openClicks: 1,
    modeSelection: 1,
    modeAvailable: microText.includes('d4'),
  });
  writeFileSync(
    'docs/pdf-remediation-batch-1/browser-tables.json',
    JSON.stringify(
      { testedAt: new Date().toISOString(), records, errors },
      null,
      2,
    ) + '\n',
  );
  console.log('Table cases', records.length, 'errors', errors.length);
} finally {
  await browser.close();
}
