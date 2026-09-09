import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { chromium } from '/Users/imwul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const url = process.env.QA_URL || 'http://127.0.0.1:5175';
const phase = process.env.QA_PHASE || 'local';
const out = `outputs/final-core-loose-ends/${phase}`;
mkdirSync(out, { recursive: true });
const storage = JSON.parse(
  readFileSync(
    'outputs/pdf-remediation-batch-1/accepted-character-storage.json',
    'utf8',
  ),
);
for (const o of storage.origins) o.origin = url;
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
  queries = [],
  errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const p = () => page.locator('.reference-inspector');
async function click(locator, description) {
  await locator.click();
  actions.push(description);
}
async function close() {
  if (await p().isVisible())
    await click(
      p().getByRole('button', { name: '닫기', exact: true }),
      'Close / return',
    );
}
async function search(query, expected) {
  await close();
  const desk = page.getByRole('textbox', { name: '작업대 검색' });
  if (!(await desk.isVisible())) {
    await page.keyboard.press('Meta+k');
    actions.push('Open command search');
  }
  const box = (await desk.isVisible())
    ? desk
    : page.getByRole('textbox', { name: '통합 참조 검색' });
  await box.fill(query);
  actions.push('Search: ' + query);
  const results = page.locator(
    (await desk.isVisible())
      ? '.desk-search-results .reference-select-action'
      : '.reference-search-dialog .reference-select-action',
  );
  const top = (await results.allTextContents())
    .slice(0, 3)
    .map((t) => t.trim().replace(/\s+/g, ' '));
  assert.ok(top.length, query);
  assert.match(top[0], expected, query);
  await click(results.first(), 'Open first result: ' + query);
  await p().waitFor();
  assert.equal(await p().locator('.source-disclosure[open]').count(), 0);
  queries.push({ query, top, interactions: 2, sourceClosed: true });
}
async function check(label, pattern) {
  const text = await p().innerText();
  assert.match(text, pattern, label);
  checks.push({ label, passed: true });
  writeFileSync(`${out}/reading-${checks.length}.txt`, text);
}
async function back() {
  await click(
    p().getByRole('button', { name: '이전 참조', exact: true }),
    'Back to previous reference',
  );
}
async function source() {
  await click(p().locator('.source-disclosure > summary'), 'Open SOURCE');
}
async function capture(name) {
  for (const width of [360, 768, 1440, 3440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.waitForTimeout(180);
    await p().evaluate((e) => (e.scrollTop = 0));
    const metrics = await page.evaluate(() => ({
      viewport: innerWidth,
      document: document.documentElement.scrollWidth,
      panel: document.querySelector('.reference-inspector').clientWidth,
      panelContent: document.querySelector('.reference-inspector').scrollWidth,
    }));
    assert.ok(metrics.document <= width + 1, JSON.stringify(metrics));
    assert.ok(
      metrics.panelContent <= metrics.panel + 1,
      JSON.stringify(metrics),
    );
    await page.screenshot({ path: `${out}/${name}-${width}.png` });
    screens.push({ name, width, ...metrics });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
}
try {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  const campaignBefore = await page.evaluate(() =>
    JSON.stringify(
      JSON.parse(localStorage.getItem('morkborg-codex:v6') || '{}').campaigns,
    ),
  );
  await search('Outcast', /Outcasts/);
  await check('Outcast hiring and loyalty usable', /no silver[\s\S]*2d6/);
  await check('Outcast Korean', /고용하는 데 은화는 들지/);
  await capture('outcast');
  await click(p().locator('.ref-related > summary'), 'Outcasts RELATED');
  await click(
    p().getByRole('button', { name: 'Wild Wickhead', exact: true }),
    'Named Outcast to definition (1 click)',
  );
  await check(
    'Named follower opens its own stat block',
    /HP 10[\s\S]*Morale 7/,
  );
  await back();
  for (const query of ['loyalty', 'hire', 'hireling', '고용', '충성'])
    await search(query, /Outcasts/);
  await search('Wild Wickhead', /Wild Wickhead/);
  await click(p().locator('.reading-more > summary'), 'Wild Wickhead MORE');
  await check(
    'Wild Wickhead specialty, carry and helper',
    /Walking lightsource[\s\S]*DR8[\s\S]*five items/,
  );
  await check('Wild Wickhead Korean helper', /광원[\s\S]*최대 다섯 개/);
  await capture('wild-wickhead');
  await search('trained dog', /Dog \(trained\)/);
  await check('Trained dog price', /25s/);
  assert.doesNotMatch(
    await p().locator('.reference-reading').innerText(),
    /\bHP\b|Morale|Armor|Attack/,
  );
  checks.push({ label: 'No fabricated dog stats', passed: true });
  await search('horse', /Horse/);
  await check('Horse price', /80s/);
  assert.doesNotMatch(
    await p().locator('.reference-reading').innerText(),
    /\bHP\b|Morale|Armor|Attack|speed/,
  );
  await search('services', /Services/);
  await click(p().locator('.ref-related > summary'), 'Services RELATED');
  await click(
    p().getByRole('button', { name: 'Beasts · Purchase', exact: true }),
    'Services to Core Beasts',
  );
  await check('Five-row purchase table', /Dog \(trained\)[\s\S]*Rat \(tame\)/);
  await capture('animal-purchase');
  await click(
    p().getByRole('button', { name: 'Horse reference', exact: true }),
    'Purchase row to Horse',
  );
  await check('Purchase definition', /80s/);
  await back();
  assert.equal(await p().locator('.reference-static-table').count(), 1);
  checks.push({ label: 'Purchase TABLE restored on Back', passed: true });
  await search('Occult treasures', /Occult treasures/i);
  const generated = p().locator('.reference-reading .reference-inline-link');
  assert.equal(await generated.count(), 1);
  const rolledTitle = (await generated.innerText()).replace(/\s*›$/, '').trim();
  await click(generated, 'Generated Treasure to definition (1 click)');
  await check(
    'Rolled Treasure has mechanical effect',
    /은|HP|DR|피|시체|반지|거울|굶|파괴|죽|눈가리개|회복|출구/,
  );
  assert.ok((await p().locator('.reference-reading').innerText()).length > 70);
  await back();
  assert.ok(
    (await p().locator('.reference-reading').innerText()).includes(rolledTitle),
  );
  await source();
  await click(
    p().getByRole('button', { name: 'TABLE · 원문 표 열기', exact: true }),
    'Open Treasure TABLE',
  );
  const manualTitle =
    rolledTitle === 'Vampiric Phurba'
      ? 'Black Crown of the Crippled King'
      : 'Vampiric Phurba';
  const manual = p()
    .locator('.reference-static-table .reference-inline-link')
    .filter({ hasText: manualTitle })
    .first();
  await click(manual, 'Manual Treasure row to ' + manualTitle);
  await check(
    'Second named Treasure effect and Korean',
    manualTitle === 'Vampiric Phurba'
      ? /dr 14[\s\S]*dr 12 daily[\s\S]*지각 DR14/
      : /100 yards[\s\S]*보름달/,
  );
  checks.push({
    label: 'Two distinct Treasure definitions reached directly',
    rolledTitle,
    manualTitle,
    passed: true,
  });
  await back();
  assert.equal(await p().locator('.reference-static-table').count(), 1);
  checks.push({ label: 'Treasure TABLE restored on Back', passed: true });
  await search('Vampiric Phurba', /Vampiric Phurba/);
  await check('Exact named Treasure opens effect', /next sunrise/);
  await search(
    'Black Crown of the Crippled King',
    /Black Crown of the Crippled King/,
  );
  await capture('treasure');
  await source();
  await check('Treasure exact source', /PDF[^\n]*3|PDF[\s\S]*3/);
  await capture('treasure-source');
  await search('Seth', /Seth/);
  assert.doesNotMatch(
    await p().locator('.reference-reading').innerText(),
    /150s/,
  );
  await click(
    p().getByRole('button', { name: 'Valuation · 매각가 ›', exact: true }),
    'Monster to valuation (1 click)',
  );
  await check(
    'Seth sale values and Korean',
    /Head: 7s[\s\S]*Captured: 150s[\s\S]*생포/,
  );
  await capture('valuation');
  await source();
  await check(
    'Valuation source and app-policy boundary',
    /APP POLICY[\s\S]*read-only index/,
  );
  await capture('valuation-source');
  await back();
  await check('Return to same Monster', /Seth[\s\S]*HP 6/);
  await search('Prowler', /Prowler/);
  await click(p().locator('.ref-related > summary'), 'Outcast RELATED');
  await click(
    p().getByRole('button', {
      name: 'Outcasts · Hiring / Loyalty',
      exact: true,
    }),
    'Follower to hiring rule',
  );
  await check('Follower next rule', /highest Presence/);
  await search('Vampiric Phurba', /Vampiric Phurba/);
  const pin = p().getByRole('button', { name: '참조 고정', exact: true });
  if (await pin.count()) await click(pin, 'Pin Treasure');
  const prefBefore = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('morkborg-reference-desk:v1') || '{}'),
  );
  await page.reload();
  actions.push('Reload');
  await page.waitForLoadState('networkidle');
  const after = await page.evaluate(() => ({
    campaign: JSON.stringify(
      JSON.parse(localStorage.getItem('morkborg-codex:v6') || '{}').campaigns,
    ),
    prefs: JSON.parse(
      localStorage.getItem('morkborg-reference-desk:v1') || '{}',
    ),
  }));
  assert.equal(after.campaign, campaignBefore);
  assert.deepEqual(after.prefs, prefBefore);
  checks.push({
    label: 'Campaign byte-equivalent and pins persist after reload',
    passed: true,
  });
  await search('Vampiric Phurba', /Vampiric Phurba/);
  assert.equal(
    await p().getByRole('button', { name: '고정 해제', exact: true }).count(),
    1,
  );
  assert.deepEqual(errors, []);
  writeFileSync(
    `docs/final-core-loose-ends/browser-${phase}.json`,
    JSON.stringify(
      {
        url,
        phase,
        queryConvention:
          'Typing a complete search = 1; opening a result = 1. Closes/back/source/table actions are separate in actions. Resize/screenshots are not play interactions.',
        actions,
        interactionCount: actions.length,
        queries,
        checks,
        screens,
        errors,
        campaignHash: createHash('sha256').update(campaignBefore).digest('hex'),
        campaignUnchanged: true,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(
    JSON.stringify({
      url,
      interactions: actions.length,
      queries: queries.length,
      checks: checks.length,
      screens: screens.length,
      errors,
      campaignUnchanged: true,
    }),
  );
} catch (e) {
  await page.screenshot({ path: `${out}/failure.png` });
  writeFileSync(
    `${out}/failure.txt`,
    String(e.stack || e) + '\n' + (await page.locator('body').innerText()),
  );
  console.error(String(e));
  process.exitCode = 1;
} finally {
  await browser.close();
}
