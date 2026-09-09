import { chromium } from '/Users/imwul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const url = process.argv[2] ?? 'http://127.0.0.1:5175';
const phase = process.argv[3] ?? 'local';
const fixture = JSON.parse(
  fs.readFileSync('outputs/convenience-layer/accepted-storage.json'),
);
fixture.origins[0].origin = new URL(url).origin;
const saveKey = 'morkborg-codex:v6';
// A fixture with existing campaigns, but no active choice, exercises selection rather than implicit navigation.
const saved = fixture.origins[0].localStorage.find((x) => x.name === saveKey);
const value = JSON.parse(saved.value);
value.activeCampaignId = null;
value.view = 'campaigns';
saved.value = JSON.stringify(value);
const b = await chromium.launch({ channel: 'chrome', headless: true });
const report = [];
try {
  for (const [width, colorScheme] of [
    [360, 'dark'],
    [768, 'dark'],
    [1440, 'light'],
  ]) {
    const c = await b.newContext({
      viewport: { width, height: 900 },
      storageState: fixture,
      reducedMotion: 'reduce',
      colorScheme,
    });
    const p = await c.newPage();
    p.setDefaultTimeout(10000);
    await p.goto(url);
    await p.waitForLoadState('networkidle');
    const before = await p.evaluate((k) => localStorage.getItem(k), saveKey);
    assert.equal(
      await p.locator('.home-active-pack .desk-pack-choice').innerText(),
      'City · 도시',
    );
    await p.screenshot({
      path: `outputs/home-bilingual/${phase}-pack-${width}.png`,
    });
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    await p.getByRole('button', { name: 'Pack 해제', exact: true }).click();
    assert.equal(await p.locator('.home-active-pack').count(), 0);
    await p.reload();
    await p.locator('.home-index').waitFor();
    assert.equal(await p.locator('.home-active-pack').count(), 0);
    assert.equal(
      await p.evaluate((k) => localStorage.getItem(k), saveKey),
      before,
    );
    await p.getByRole('textbox', { name: '작업대 검색' }).fill('Reaction');
    await p
      .locator('.desk-search-results .reference-select-action')
      .first()
      .click();
    await p.locator('.reference-reading').waitFor();
    const pinAction = p.getByRole('button', { name: '참조 고정', exact: true });
    if (await pinAction.count()) await pinAction.click();
    else
      assert.equal(
        await p
          .getByRole('button', { name: '고정 해제', exact: true })
          .isVisible(),
        true,
      );
    await p.getByRole('button', { name: '닫기', exact: true }).click();
    await p.reload();
    await p.locator('.home-index').waitFor();
    const pin = p
      .locator('.desk-pinned-actions')
      .getByRole('button', { name: /Reaction/ });
    await pin.waitFor();
    assert.equal(await pin.isVisible(), true);
    await pin.click();
    await p.locator('.reference-reading').waitFor();
    await p.getByRole('button', { name: '닫기', exact: true }).click();
    assert.equal(
      await p.evaluate((k) => localStorage.getItem(k), saveKey),
      before,
    );
    await p
      .locator('.home-index')
      .getByRole('button', { name: '캐릭터 ›', exact: true })
      .click();
    await p.locator('.home-destination-note').waitFor();
    await p.locator('.campaign-card .card-title').first().click();
    await p.getByRole('heading', { name: '남겨진 자들.' }).waitFor();
    const after = await p.evaluate(
      (k) => JSON.parse(localStorage.getItem(k)),
      saveKey,
    );
    assert.equal(after.campaigns[0].workspace.section, 'characters');
    const content = (s) => s.campaigns.map(({ workspace, ...x }) => x);
    assert.deepEqual(content(after), content(JSON.parse(before)));
    await p.getByRole('button', { name: '홈으로', exact: true }).click();
    assert.equal(await p.locator('.home-index').isVisible(), true);
    report.push({
      width,
      colorScheme,
      activePackVisible: true,
      packClearPersists: true,
      pinPersistsAndRollsDirectly: true,
      campaignChoiceResumesTarget: true,
      campaignContentPreserved: true,
    });
    await c.close();
  }
  fs.writeFileSync(
    `outputs/home-bilingual/${phase}-state-checks.json`,
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await b.close();
}
