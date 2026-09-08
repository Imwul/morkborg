/** Actual isolated Chrome UI. Private readings/screenshots stay under ignored outputs/. */
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const { chromium } = await import(
  process.env.AUDIT_PLAYWRIGHT_MODULE || 'playwright'
);
const out = 'outputs/pdf-remediation-batch-2',
  doc = 'docs/pdf-remediation-batch-2';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: 'reduce',
  permissions: ['clipboard-read', 'clipboard-write'],
});
const page = await context.newPage();
page.setDefaultTimeout(10000);
const records = [],
  readings = [],
  visual = [],
  errors = [];
let failure;
page.on('pageerror', (e) => errors.push(e.message));
const panel = () => page.locator('.reference-inspector');
async function note(action, clicks, checks = {}) {
  records.push({ action, clicks, ...checks });
  readings.push({ action, text: await panel().innerText() });
  console.log(action, clicks);
}
async function close() {
  if (await panel().isVisible())
    await panel().getByRole('button', { name: '닫기', exact: true }).click();
}
async function search(query, expected) {
  await close();
  await page.getByRole('textbox', { name: '작업대 검색' }).fill(query);
  const results = page.locator('.desk-search-results .reference-select-action');
  await results.first().waitFor();
  const topResults = await results.evaluateAll((es) =>
    es.slice(0, 5).map((e) => e.getAttribute('aria-label')),
  );
  await results.first().click();
  await panel().waitFor();
  await page.waitForTimeout(150);
  const text = await panel().innerText();
  if (expected) assert.match(text, expected, query);
  assert.equal(
    await panel().locator('.source-disclosure[open]').count(),
    0,
    query + ' source should be closed',
  );
  await note('Search ' + query, 1, {
    topResults,
    sourceClosed: true,
    answerAvailable: true,
  });
}
async function related(title) {
  const links = panel().locator('.ref-related-disclosure');
  if (!(await links.getAttribute('open')))
    await links.locator('summary').click();
  await links.getByRole('button', { name: title, exact: true }).click();
  await page.waitForTimeout(100);
}
async function shots(name) {
  for (const width of [360, 768, 1440, 3440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(180);
    await panel().evaluate((e) => (e.scrollTop = 0));
    const metrics = await panel().evaluate((e) => ({
      pageOverflow: document.documentElement.scrollWidth > innerWidth,
      inspectorOverflow: e.scrollWidth > e.clientWidth + 1,
      inspectorWidth: Math.round(e.getBoundingClientRect().width),
      height: e.clientHeight,
      contentHeight: e.scrollHeight,
    }));
    assert.equal(metrics.pageOverflow, false, name + width);
    assert.equal(metrics.inspectorOverflow, false, name + width);
    const path = `${out}/${name}-${width}.png`;
    await page.screenshot({ path, animations: 'disabled' });
    visual.push({ surface: name, width, ...metrics, screenshot: path });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
}
try {
  await page.goto(process.env.AUDIT_URL || 'http://127.0.0.1:5174');
  await page.waitForLoadState('networkidle');
  await search('RECLVSE Morale', /bloodied, outnumbered or leaderless/);
  await search('RECLVSE Travel', /TRAVEL \/ CAMP/);
  await panel()
    .locator('.reference-rule-group')
    .getByRole('button', { name: 'Make Camp ›', exact: true })
    .click();
  assert.match(await panel().innerText(), /regain d6 HP/);
  await note('Travel → Make Camp', 1, { answerAvailable: true });
  await related('Night Encounter');
  assert.match(await panel().innerText(), /Uneventful night/);
  await note('Camp → Night Encounter', 2, { answerAvailable: true });
  await search('RECLVSE');
  await shots('reclvse-groups');
  await search('SD Omens', /Maximum four Omens/);
  await search('SD Powers', /single d20/);
  await search('Depths Encounter Level', /Depths region/);
  await shots('encounter-level');
  await panel().getByRole('button', { name: 'ROLL', exact: true }).click();
  await note('Encounter Level: d20 check', 1, { region: 'Sarkash' });
  let attempts = 1;
  while (
    !(await panel()
      .locator('.reference-next-steps')
      .getByRole('button', { name: /Sarkash.*Regional Monsters/ })
      .count()) &&
    attempts < 100
  ) {
    await panel().getByRole('button', { name: 'REROLL', exact: true }).click();
    attempts++;
  }
  assert.ok(attempts < 100);
  await panel()
    .locator('.reference-next-steps')
    .getByRole('button', { name: /Sarkash.*Regional Monsters/ })
    .click();
  assert.ok(await panel().locator('.reference-reading').count());
  await note('Encounter Level → regional monster', 1, {
    qaRollAttemptsToReachMonsterBranch: attempts,
    rolledDirectly: true,
  });
  await search('Rare Monster Five Cards', /CARD 1/);
  const cards = await panel()
    .locator('.rare-card-strip strong')
    .allTextContents();
  assert.ok(cards.length === 5 || cards.length === 6);
  assert.equal(new Set(cards).size, cards.length);
  await shots('five-cards');
  await panel().locator('.source-disclosure > summary').click();
  assert.match(await panel().innerText(), /Card 1:/);
  assert.match(await panel().innerText(), /APP POLICY/);
  await note('Rare monster → card/source trace', 1, {
    cards: cards.length,
    primaryAndPolicySeparated: true,
  });
  await panel()
    .getByRole('button', { name: '이 표 열기 ↗', exact: true })
    .first()
    .click();
  await page.waitForTimeout(100);
  assert.ok(await panel().locator('.reference-static-table').count());
  await panel().getByRole('button', { name: '이전 참조', exact: true }).click();
  assert.deepEqual(
    await panel().locator('.rare-card-strip strong').allTextContents(),
    cards,
  );
  await note('Source → canonical table → Back', 2, { cardsPreserved: true });
  await panel().getByRole('button', { name: 'COPY', exact: true }).click();
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  assert.match(clipboard, /HP /);
  assert.doesNotMatch(
    clipboard,
    /entryId|datasetVersion|remaining|depths\.rare/,
  );
  await note('Copy rare monster', 1, { playContentOnly: true });
  await panel().getByRole('button', { name: 'DRAW', exact: true }).click();
  const nextCards = await panel()
    .locator('.rare-card-strip strong')
    .allTextContents();
  assert.ok(nextCards.every((c) => !cards.includes(c)));
  await note('Draw next five-card pile', 1, { noCardReuse: true });
  await search('Arquebus', /d10 · 180s/);
  assert.match(await panel().innerText(), /Presence DR14/);
  await shots('blackpowder');
  await search('Gunsmith', /Gunsmith/);
  await panel()
    .locator('.reference-next-steps')
    .getByRole('button', { name: 'HERETIC Blackpowder ›', exact: true })
    .click();
  assert.match(await panel().innerText(), /GENERAL TRAITS/);
  await note('Alöne Gunsmith → HERETIC Blackpowder', 1, {
    answerAvailable: true,
  });
  await search('Carcasswan', /VARIANTS \/ PARTICIPANTS/);
  await panel().locator('.reading-participants > summary').click();
  const variantNames = await panel()
    .locator('.reading-participants button')
    .allTextContents();
  await panel().locator('.reading-participants button').first().click();
  assert.match(await panel().innerText(), /HP 15/);
  await note('Carcasswan → solo variant', 2, {
    identitiesSeparated: true,
    variants: variantNames,
  });
  await search('Lentil Lice', /VARIANTS \/ PARTICIPANTS/);
  await panel().locator('.reading-participants > summary').click();
  await panel().locator('.reading-participants button').first().click();
  assert.match(await panel().innerText(), /HP 4/);
  await note('Lentil Lice → starving peasants', 2, {
    identitiesSeparated: true,
  });
  await search('Überwolf', /VARIANTS \/ PARTICIPANTS/);
  await panel().locator('.reading-participants > summary').click();
  await panel().locator('.reading-participants button').first().click();
  assert.match(await panel().innerText(), /HP 6/);
  await note('Überwolf → regular wolf', 2, { identitiesSeparated: true });
  await search('Mythic Event Focus', /Event Focus/);
  await related('Random Event Focus Table');
  const next = panel().locator('.reference-next-steps button');
  await next.first().waitFor();
  await note('Mythic Event → roll Event Focus', 2, {
    sourceDefinedNextVisible: true,
  });
  await next.first().click();
  await note('Event Focus result → next procedure', 1, {
    answerAvailable: true,
  });
  await shots('mythic-follow-through');
  await search('SD outdoor Micro-crawl', /d4 waypoints/);
  await search('Begin Adventure', /Straightforward 1/);
  await search('Conclude Adventure', /add d2\+1 milestones/);
  await search('Rotten Nurse', /DR14/);
  assert.doesNotMatch(
    await panel().innerText(),
    /HP 0|Armor |SOURCE UNAVAILABLE/,
  );
  await note('Rotten Nurse special rule, no invented stats', 0, {
    specialRuleOnly: true,
  });
  await search('Mikhael', /HP 6/);
  await panel().locator('.reading-more > summary').click();
  assert.match(await panel().innerText(), /d4 days/);
  await note('Mikhael → full special rule', 1, { correctOutcast: true });
  // Every targeted new reference is opened through actual search, beyond the 25-step scenario.
  const bundle = JSON.parse(
    readFileSync('outputs/morkborg-private-data.json', 'utf8'),
  );
  const catalogs = [
    'reclvse.playReferences',
    'sd.playReferences',
    'heretic.blackpowder',
    'mythic2.playReferences',
  ];
  for (const t of bundle.oracles.tables.filter((t) => catalogs.includes(t.id)))
    for (const e of t.entries) {
      const m = e.metadata;
      await search(m.name);
      const visible = await panel().innerText();
      for (const block of m.blocks)
        assert.ok(
          visible.includes(block.text),
          m.name + ' must show complete compact mechanics',
        );
    }
  assert.deepEqual(errors, []);
} catch (e) {
  failure = String(e.stack || e);
  console.error(failure);
  await page.screenshot({ path: out + '/browser-failure.png' });
  process.exitCode = 1;
} finally {
  writeFileSync(
    out + '/private-browser-readings.json',
    JSON.stringify(readings, null, 2) + '\n',
    { mode: 0o600 },
  );
  writeFileSync(
    doc + '/browser-acceptance.json',
    JSON.stringify(
      {
        testedAt: new Date().toISOString(),
        method:
          'Actual isolated Chrome UI. Clicks counted after query input; typing and closing prior inspector excluded. Rerolls needed to sample a random branch are recorded separately.',
        records,
        visual,
        errors,
        failure,
      },
      null,
      2,
    ) + '\n',
  );
  await browser.close();
}
