import { chromium } from '/Users/imwul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { writeFileSync } from 'node:fs';
const phase = process.env.QA_PHASE || 'before';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: 'reduce',
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(process.env.QA_URL || 'http://127.0.0.1:5174');
await page.waitForLoadState('networkidle');
const campaignBefore = await page.evaluate(() =>
  localStorage.getItem('morkborg-codex:v6'),
);
const queries = [
  'DR',
  'difficulty',
  '난이도',
  '어려움',
  'round',
  'round duration',
  '턴',
  '라운드',
  'movement',
  '이동',
  '몇 미터',
  'starvation',
  '굶주림',
  '식량 없음',
  'thirst',
  '갈증',
  'infection',
  '감염',
  'carrying',
  '짐',
  '얼마나 들 수',
  'healing',
  '회복',
  '치료',
  'flee',
  '도망',
  '도주',
  'Get Better',
  '성장',
  'Broken',
  'HP 0',
  'negative HP',
  'death',
  'initiative',
  'critical',
  'fumble',
  'armor',
  'Omens',
  'Power',
  'morale',
  'reaction',
  'Bomb',
  'Life elixir',
  'Small vicious dog',
  'Monkeys',
  '20 arrows',
  '10 bolts',
  'armor repair',
  'steady meal',
  'Heretical Priest',
];
const records = [];
for (const query of queries) {
  const p = page.locator('.reference-inspector');
  if (await p.isVisible())
    await p.getByRole('button', { name: '닫기', exact: true }).click();
  await page.getByRole('textbox', { name: '작업대 검색' }).fill(query);
  const hits = page.locator('.desk-search-results .reference-select-action');
  const top = await hits.allTextContents();
  if (!top.length) {
    records.push({ query, top: [], interactions: 1, answer: false });
    continue;
  }
  await hits.first().click();
  await p.waitFor();
  const reading = p.locator('.reference-reading');
  records.push({
    query,
    top: top.slice(0, 3).map((s) => s.trim().replace(/\s+/g, ' ')),
    interactions: 2,
    sourceClosed: (await p.locator('.source-disclosure[open]').count()) === 0,
    reading: (await reading.count())
      ? (await reading.innerText()).replace(/\s+/g, ' ').trim()
      : await p.innerText(),
  });
}
await page.reload();
await page.waitForLoadState('networkidle');
const campaignAfter = await page.evaluate(() =>
  localStorage.getItem('morkborg-codex:v6'),
);
writeFileSync(
  `outputs/pdf-remediation-batch-3/readings-${phase}.json`,
  JSON.stringify(records, null, 2) + '\n',
);
writeFileSync(
  `docs/pdf-remediation-batch-3/browser-${phase}.json`,
  JSON.stringify(
    {
      phase,
      url: page.url(),
      interactionConvention:
        'Search field fill = 1; opening first result = 1; closing previous result excluded from individual lookup. No campaign selected.',
      records: records.map(({ reading, ...record }) => ({
        ...record,
        hasReading: !!reading,
      })),
      errors,
      campaignUnchanged: campaignBefore === campaignAfter,
    },
    null,
    2,
  ) + '\n',
);
console.log(
  JSON.stringify(
    {
      phase,
      queries: records.length,
      errors,
      campaignUnchanged: campaignBefore === campaignAfter,
      top: records.map((r) => [r.query, r.top[0]]),
    },
    null,
    2,
  ),
);
await browser.close();
