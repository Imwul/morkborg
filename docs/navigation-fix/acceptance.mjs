import { chromium } from '/Users/imwul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const url = process.argv[2] ?? 'http://127.0.0.1:5175',
  phase = process.argv[3] ?? 'local';
const root = 'outputs/navigation-fix';
fs.mkdirSync(root, { recursive: true });
const fixture = JSON.parse(
  fs.readFileSync('outputs/visual-quieting/after-accepted-storage.json'),
);
fixture.origins[0].origin = new URL(url).origin;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const reports = [];
const key = 'morkborg-codex:v6';
const contents = (s) => s.campaigns.map(({ workspace, ...c }) => c);
try {
  for (const width of [360, 768, 1440, 3440]) {
    const context = await browser.newContext({
      storageState: fixture,
      viewport: { width, height: 900 },
      colorScheme: width === 360 ? 'dark' : 'light',
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const save = () =>
      page.evaluate((k) => JSON.parse(localStorage.getItem(k)), key);
    const index = () =>
      page.evaluate(() => history.state.morkborgNavigationV1.index);
    const back = async () => {
      await page.goBack();
    };
    const home = async () => {
      await page.getByRole('button', { name: '홈으로', exact: true }).click();
      await page.locator('.home-index').waitFor();
    };
    const search = () => page.getByRole('textbox', { name: '작업대 검색' });
    const top = () =>
      page.locator('.desk-search-results .reference-select-action').first();
    const state = () =>
      page.evaluate(() => history.state.morkborgNavigationV1.channels);
    const waitRef = async (id) => {
      await page.waitForFunction(
        (id) =>
          history.state.morkborgNavigationV1.channels.reference.value
            .selectedId === id,
        id,
      );
    };
    const shot = async (name) => {
      await page.screenshot({ path: `${root}/${phase}-${name}-${width}.png` });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
    };
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    const original = contents(await save());
    assert.equal(await index(), 0);
    // Typing, rolling again and copying do not create extra navigation entries.
    await search().pressSequentially('Reaction');
    assert.equal(await index(), 0);
    await top().click();
    await page.locator('.reference-reading').waitFor();
    const beforeReroll = await index();
    await page.getByRole('button', { name: 'REROLL', exact: true }).click();
    assert.equal(await index(), beforeReroll);
    const initialReading = await page.locator('.reference-reading').innerText();
    const resultIndex = await index();
    assert.equal(resultIndex, 1);
    await page.getByRole('button', { name: 'COPY', exact: true }).click();
    assert.equal(await index(), resultIndex);
    await page
      .locator('.reference-inspector > .source-disclosure > summary')
      .click();
    await page.getByRole('button', { name: '표 보기', exact: true }).click();
    await page.locator('.reference-static-table').waitFor();
    await back();
    await page.locator('.reference-static-table').waitFor({ state: 'hidden' });
    assert.equal(
      await page.locator('.reference-reading').innerText(),
      initialReading,
    );
    await page.goForward();
    await page.locator('.reference-static-table').waitFor();
    await page.getByRole('button', { name: '이전 참조', exact: true }).click();
    await page.locator('.reference-static-table').waitFor({ state: 'hidden' });
    await page.getByRole('button', { name: '닫기', exact: true }).click();
    await waitRef(null);
    assert.equal(await index(), 0);
    assert.equal(await search().inputValue(), 'Reaction');
    // Home page links and the explicit Back control are the same browser stack.
    await page.getByRole('button', { name: '검색 지우기' }).click();
    await page
      .locator('.home-index')
      .getByRole('button', { name: '자료 및 규칙' })
      .click();
    await page.locator('.source-page').waitFor();
    await shot('sources');
    await page.getByRole('button', { name: '뒤로가기', exact: true }).click();
    await page.locator('.home-index').waitFor();
    await page.goForward();
    await page.locator('.source-page').waitFor();
    await back();
    await page.locator('.home-index').waitFor();
    await page
      .locator('.home-index')
      .getByRole('button', { name: 'City Crawl' })
      .click();
    await page.locator('.city-crawl-workspace').waitFor();
    await back();
    await page.locator('.home-index').waitFor();
    await page
      .locator('.home-index')
      .getByRole('button', { name: 'Oracle 라이브러리' })
      .click();
    await page.locator('.oracle-page').waitFor();
    await back();
    await page.locator('.home-index').waitFor();
    await page
      .locator('.home-index')
      .getByRole('button', { name: 'Mythic Fate' })
      .click();
    await page.locator('.fate-panel').waitFor();
    await back();
    await page.locator('.fate-panel').waitFor({ state: 'hidden' });
    // Library → detail and Back for every saved primary object kind.
    for (const [name, library, detail] of [
      ['캐릭터', '.character-library', '.character-workbench'],
      ['몬스터', '.monster-library', '.monster-workbench'],
      ['NPC', '.compact-library-grid', '.content-detail'],
      ['조우', '.compact-library-grid', '.content-detail'],
    ]) {
      await page
        .locator('.home-index')
        .getByRole('button', { name: `${name} ›`, exact: true })
        .click();
      await page.locator(`${library} .compact-card-main`).first().click();
      await page.locator(detail).waitFor();
      await back();
      await page.locator(`${library} .compact-card-main`).first().waitFor();
      await page.goForward();
      await page.locator(detail).waitFor();
      await back();
      await home();
    }
    await page
      .locator('.home-index')
      .getByRole('button', { name: '던전 보관함' })
      .click();
    await page.locator('.dungeon-grid').waitFor();
    const listIndex = await index();
    await page.locator('.dungeon-grid .compact-card-main').first().click();
    await page.locator('.dungeon-tabs').waitFor();
    await page
      .locator('.dungeon-tabs')
      .getByRole('button', { name: '개요', exact: true })
      .click();
    await page.locator('.integrity-dossier').waitFor();
    const packet = page.locator('.room-packet').nth(1);
    await packet.locator('.room-packet-summary').click();
    await packet
      .locator('.generation-disclosure > .source-disclosure > summary')
      .click();
    await packet.locator('.source-roll-link').first().click();
    await page.locator('.reference-static-table').waitFor();
    await back();
    await page.locator('.reference-static-table').waitFor({ state: 'hidden' });
    assert.equal(
      await packet.locator('details').first().getAttribute('open'),
      '',
    );
    await shot('room-return');
    assert.deepEqual(contents(await save()), original);
    // A real manual edit survives Back, Forward and reload. It is not a saved-state undo.
    const entrance = page.locator('[data-field="entrance"]');
    await entrance
      .getByRole('button', { name: '입구 편집', exact: true })
      .click();
    await entrance.getByRole('textbox').fill('뒤로가기 QA 수동 입구');
    await entrance
      .getByRole('button', { name: '입구 편집 완료', exact: true })
      .click();
    const afterEdit = contents(await save());
    await back();
    await page.locator('.dungeon-crawl').waitFor();
    await back();
    await page.locator('.dungeon-grid').waitFor();
    assert.equal(await index(), listIndex);
    await page.goForward();
    await page.locator('.dungeon-tabs').waitFor();
    await page.goForward();
    await page.locator('.integrity-dossier').waitFor();
    assert.equal(
      await entrance
        .getByRole('button', { name: '입구 편집', exact: true })
        .innerText(),
      '뒤로가기 QA 수동 입구',
    );
    await page.reload();
    await page.locator('.integrity-dossier').waitFor();
    assert.deepEqual(contents(await save()), afterEdit);
    await back();
    await page.locator('.dungeon-crawl').waitFor();
    await back();
    await page.locator('.dungeon-grid').waitFor();
    await shot('list-back-after-reload');
    assert.deepEqual(contents(await save()), afterEdit);
    assert.deepEqual(errors, []);
    reports.push({
      width,
      lightOrDark: width === 360 ? 'dark' : 'light',
      browserBack: true,
      toolbarBack: true,
      forward: true,
      tableReturn: true,
      roomContext: true,
      searchPreserved: true,
      allLibraries: true,
      reloadBack: true,
      manualEditPreserved: true,
      campaignContentUnchangedBeforeIntentionalEdit: true,
      errors,
    });
    await context.close();
  }
  // Fresh tab: no fake history entries that trap leaving the site.
  const fresh = await browser.newContext({
    viewport: { width: 360, height: 800 },
  });
  const p = await fresh.newPage();
  await p.goto(url);
  await p.locator('.home-index').waitFor();
  assert.equal(
    await p.getByRole('button', { name: '뒤로가기', exact: true }).count(),
    0,
  );
  await p
    .locator('.home-index')
    .getByRole('button', { name: '캐릭터 ›', exact: true })
    .click();
  await p.locator('.home-destination-note').waitFor();
  await p.goBack();
  await p.locator('.home-index').waitFor();
  await fresh.close();
  fs.writeFileSync(
    `${root}/${phase}-acceptance.json`,
    JSON.stringify(reports, null, 2),
  );
  console.log(JSON.stringify(reports, null, 2));
} finally {
  await browser.close();
}
