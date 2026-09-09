import { chromium } from '/Users/imwul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const url = process.argv[2] ?? 'http://127.0.0.1:5175';
const fixture = JSON.parse(
  fs.readFileSync('outputs/visual-quieting/after-accepted-storage.json'),
);
fixture.origins[0].origin = new URL(url).origin;
const browser = await chromium.launch({ channel: 'chrome', headless: true }),
  ctx = await browser.newContext({
    storageState: fixture,
    viewport: { width: 1440, height: 900 },
  }),
  page = await ctx.newPage();
page.setDefaultTimeout(10000);
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const key = 'morkborg-play-memory:v1';
const memory = () =>
  page.evaluate((k) => JSON.parse(sessionStorage.getItem(k)), key);
try {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await page
    .locator('.home-index')
    .getByRole('button', { name: '던전 보관함' })
    .click();
  await page.locator('.dungeon-grid .compact-card-main').first().click();
  await page
    .locator('.dungeon-tabs')
    .getByRole('button', { name: /^방/ })
    .click();
  await page.getByRole('button', { name: '방 생성', exact: true }).click();
  const disposable = (await memory()).contexts[0];
  assert.equal(disposable.kind, 'room');
  await page.getByRole('button', { name: '참조 검색', exact: true }).click();
  await page.getByRole('textbox', { name: '통합 참조 검색' }).fill('Reaction');
  await page
    .locator('.reference-results .reference-select-action')
    .first()
    .click();
  assert.match(
    await page.locator('[role=dialog] .play-context-return').innerText(),
    /ROOM 05/,
  );
  await page.locator('[role=dialog] .play-context-return').click();
  await page.locator('summary[aria-label="방 관리"]').click();
  await page.getByRole('button', { name: '방 삭제', exact: true }).click();
  await page.getByRole('button', { name: '확인', exact: true }).click();
  await page
    .getByRole('button', { name: 'Play 도구 열기', exact: true })
    .click();
  await page.getByRole('button', { name: /^Context/ }).click();
  assert.ok(
    !(await page.locator('.play-memory-list').innerText()).includes('ROOM 05'),
  );
  await page.getByRole('button', { name: '‹ PLAY', exact: true }).click();
  await page.getByRole('button', { name: /Recent rolls/ }).click();
  await page.locator('.replay-list >button').first().click();
  await page.locator('.roll-replay-view').waitFor();
  const original = (await memory()).replays[0];
  // Simulate a retired canonical ID without changing any actual registry/source data.
  await page.evaluate((k) => {
    const v = JSON.parse(sessionStorage.getItem(k));
    v.replays[0].referenceId = 'retired-reference';
    v.replays[0].results[0].referenceId = 'retired-reference';
    v.replays[0].results[0].reading.sourceRefs =
      v.replays[0].results[0].reading.sourceRefs.map((r) => ({
        ...r,
        tableId: 'retired-table',
      }));
    sessionStorage.setItem(k, JSON.stringify(v));
  }, key);
  await page.reload();
  await page.locator('.roll-replay-view').waitFor();
  assert.match(
    await page.locator('.roll-replay-view').innerText(),
    /SOURCE UNAVAILABLE/,
  );
  assert.ok(
    (await page.locator('.roll-replay-view').innerText()).includes(
      original.results[0].reading.blocks[0].text,
    ),
  );
  await page.getByRole('button', { name: '‹ PLAY', exact: true }).click();
  const before = await page.evaluate(() => ({
    campaign: localStorage.getItem('morkborg-codex:v6'),
    prefs: localStorage.getItem('morkborg-convenience:v1'),
    pin: localStorage.getItem('morkborg-reference-desk:v1'),
    temp: sessionStorage.getItem('morkborg-play-session:v1'),
  }));
  await page.locator('.convenience-organization >summary').click();
  await page.getByText('임시 도구 정리', { exact: true }).click();
  await page
    .getByRole('button', { name: 'Context 비우기', exact: true })
    .click();
  await page
    .getByRole('button', { name: '최근 결과 비우기', exact: true })
    .click();
  assert.equal((await memory()).contexts.length, 0);
  assert.equal((await memory()).replays.length, 0);
  const after = await page.evaluate(() => ({
    campaign: localStorage.getItem('morkborg-codex:v6'),
    prefs: localStorage.getItem('morkborg-convenience:v1'),
    pin: localStorage.getItem('morkborg-reference-desk:v1'),
    temp: sessionStorage.getItem('morkborg-play-session:v1'),
  }));
  assert.deepEqual(after, before);
  assert.deepEqual(errors, []);
  const report = {
    deletedDisposableRoom: true,
    noWrongRedirect: true,
    missingSourceSnapshotPreserved: true,
    clearOnlyContextAndReplay: true,
    otherStoresByteIdentical: true,
    errors,
  };
  fs.writeFileSync(
    'outputs/play-memory/edge-acceptance.json',
    JSON.stringify(report, null, 2),
  );
  console.log(report);
} catch (e) {
  console.log((await page.locator('body').innerText()).slice(-3500));
  await page.screenshot({ path: 'outputs/play-memory/edge-failure.png' });
  throw e;
} finally {
  await browser.close();
}
