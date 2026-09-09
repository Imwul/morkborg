import { chromium } from '/Users/imwul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const root = 'outputs/convenience-layer',
  browser = await chromium.launch({ channel: 'chrome', headless: true }),
  context = await browser.newContext({
    viewport: { width: 360, height: 800 },
    storageState: `${root}/accepted-storage.json`,
    reducedMotion: 'reduce',
    isMobile: true,
    hasTouch: true,
    permissions: ['clipboard-read', 'clipboard-write'],
  });
await context.addInitScript(
  (s) => {
    if (!sessionStorage.getItem('morkborg-play-session:v1'))
      sessionStorage.setItem('morkborg-play-session:v1', s);
  },
  fs.readFileSync(`${root}/accepted-session.json`, 'utf8'),
);
const page = await context.newPage(),
  errors = [],
  checks = [];
page.setDefaultTimeout(6000);
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => {
  if (m.type() === 'error' && !m.text().includes('favicon'))
    errors.push(m.text());
});
const click = async (l) => {
    await l.click();
    await page.waitForTimeout(120);
  },
  close = async () => {
    if (await page.getByRole('button', { name: '닫기', exact: true }).count())
      await click(page.getByRole('button', { name: '닫기', exact: true }));
  },
  find = async (q) => {
    await close();
    await page.keyboard.press('Control+k');
    await page.getByRole('textbox', { name: '통합 참조 검색' }).fill(q);
    await click(
      page.locator('.reference-search-dialog .reference-select-action').first(),
    );
  };
try {
  await page.goto('http://127.0.0.1:5175');
  await page.waitForLoadState('networkidle');
  const campaign = await page.evaluate(() =>
    localStorage.getItem('morkborg-codex:v6'),
  );
  await click(
    page
      .locator('.reference-rail .reference-play-tray')
      .getByRole('button', { name: 'Reaction', exact: true }),
  );
  await click(
    page
      .locator('.reference-inner-play')
      .getByRole('button', { name: 'Action + Theme', exact: true }),
  );
  assert.match(
    await page.locator('.reference-inspector-top').innerText(),
    /Action \+ Theme/,
  );
  assert.equal(await page.locator('.physical-roll-input').count(), 1);
  checks.push(
    'Inside result → Tray Action + Theme: one click, no close or context loss',
  );
  await click(
    page
      .locator('.reference-inner-play')
      .getByRole('button', { name: 'Reaction', exact: true }),
  );
  await click(
    page
      .locator('.ref-copy-actions')
      .getByRole('button', { name: 'COPY', exact: true }),
  );
  const plain = await page.evaluate(() => navigator.clipboard.readText());
  assert.ok(
    plain.length > 0 &&
      !plain.includes('oracle:') &&
      !plain.includes('datasetVersion'),
  );
  await click(
    page.locator('.reference-inspector > .source-disclosure > summary'),
  );
  assert.match(
    await page.locator('.reference-inspector > .source-disclosure').innerText(),
    /PRIMARY SOURCE|SOURCE PROCEDURE/,
  );
  await close();
  checks.push('Mobile Tray → roll → plain Copy → Source → Close');
  await find('Action Oracle');
  await click(page.locator('.physical-roll-input > summary'));
  await page.locator('.physical-roll-input input').fill('100');
  await click(page.getByRole('button', { name: '결과 확인', exact: true }));
  assert.equal(
    (
      await page.evaluate(() =>
        JSON.parse(sessionStorage.getItem('morkborg-play-session:v1')),
      )
    ).lastRoll.inputs['0'],
    '100',
  );
  checks.push('Physical d100 UI boundary = 100');
  await find('Rare Monster · Five Cards');
  await click(page.locator('.rare-card-details > summary'));
  await click(
    page.getByRole('button', { name: 'SHUFFLE · 새 던전', exact: true }),
  );
  await click(page.locator('.physical-roll-input > summary'));
  await page.getByRole('textbox', { name: '실물 카드' }).fill('Q');
  await click(page.getByRole('button', { name: '♠ 입력', exact: true }));
  await page
    .getByRole('textbox', { name: '실물 카드' })
    .fill(
      (await page.getByRole('textbox', { name: '실물 카드' }).inputValue()) +
        '10♥ 2♣ A♦ 7♠',
    );
  await page.screenshot({ path: `${root}/manual-cards-360.png` });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  for (const size of [768, 1440, 3440]) {
    await page.setViewportSize({ width: size, height: 1000 });
    await page.screenshot({ path: `${root}/manual-cards-${size}.png` });
    assert.equal(
      await page.evaluate(() => {
        const d = document.querySelector('[role=dialog]');
        return (
          document.documentElement.scrollWidth > innerWidth ||
          d.scrollWidth > d.clientWidth + 1
        );
      }),
      false,
    );
  }
  await click(page.getByRole('button', { name: '결과 확인', exact: true }));
  checks.push(
    'Physical card suit tap buttons and card form at all four widths',
  );
  await find('Depths Encounter Level');
  const regionSelect = page.getByRole('combobox', {
    name: 'Depths region · 지역',
  });
  const opts = await regionSelect
    .locator('option')
    .evaluateAll((es) => es.map((e) => e.value));
  await regionSelect.selectOption(opts[1]);
  await click(page.getByRole('button', { name: 'ROLL', exact: true }));
  await regionSelect.selectOption(opts[2]);
  await close();
  await click(
    page.getByRole('button', { name: '마지막 굴림 다시 실행', exact: true }),
  );
  assert.equal(await regionSelect.inputValue(), opts[1]);
  assert.equal(
    (
      await page.evaluate(() =>
        JSON.parse(sessionStorage.getItem('morkborg-play-session:v1')),
      )
    ).lastRoll.parameters.encounterRegion,
    opts[1],
  );
  checks.push(
    'Last restores meaningful Encounter Level region in both execution and visible controls',
  );
  await close();
  assert.ok(
    (await page.evaluate(() => localStorage.getItem('morkborg-codex:v6'))) ===
      campaign,
    'Convenience actions changed Campaign',
  );
  // A now-unavailable canonical ID preserves explicit input state and falls back to the tools disclosure.
  await page.evaluate(() => {
    const s = JSON.parse(sessionStorage.getItem('morkborg-play-session:v1'));
    s.lastRoll.id = 'oracle:removed-source-qa';
    sessionStorage.setItem('morkborg-play-session:v1', JSON.stringify(s));
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
  await click(
    page.getByRole('button', { name: '마지막 굴림 다시 실행', exact: true }),
  );
  assert.match(
    await page.locator('.reference-tools-dialog [role=alert]').innerText(),
    /현재 자료에 없습니다/,
  );
  checks.push(
    'Unavailable Last reference opens an explicit notice; no substituted roll',
  );
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    `${root}/final-ui.json`,
    JSON.stringify({ checks, errors }, null, 2),
  );
  console.log(checks);
} catch (e) {
  await page.screenshot({ path: `${root}/final-ui-failure.png` });
  console.error(e.stack);
  process.exitCode = 1;
} finally {
  await browser.close();
}
