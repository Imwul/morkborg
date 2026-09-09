import { chromium } from '/Users/imwul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const url = process.env.QA_URL ?? 'http://127.0.0.1:5175',
  root = 'outputs/convenience-recheck',
  b = await chromium.launch({ channel: 'chrome', headless: true });
fs.mkdirSync(root, { recursive: true });
const records = [];
for (const width of [360, 1440]) {
  const c = await b.newContext({
      viewport: { width, height: width === 360 ? 800 : 1000 },
      reducedMotion: 'reduce',
    }),
    p = await c.newPage(),
    errors = [];
  p.setDefaultTimeout(12000);
  p.on('pageerror', (e) => errors.push(e.message));
  const click = async (l) => {
    await l.click();
    await p.waitForTimeout(100);
  };
  const close = async () =>
    click(p.getByRole('button', { name: '닫기', exact: true }));
  try {
    await p.goto(url);
    await p.waitForLoadState('networkidle');
    const campaign = await p.evaluate(() =>
      localStorage.getItem('morkborg-codex:v6'),
    );
    await click(p.getByRole('button', { name: 'Play 도구 열기', exact: true }));
    await click(
      p.getByRole('button', { name: 'Physical Roll · 실물 주사위 입력' }),
    );
    const rows = p.locator('.convenience-physical-picker .convenience-add-row');
    await p.getByRole('textbox', { name: '실물 입력 표 검색' }).fill('scroll');
    assert.equal(await rows.count(), 2);
    assert.equal(
      await p.locator('.convenience-physical-picker .convenience-hint').count(),
      0,
    );
    const names = await rows.allTextContents();
    await p.screenshot({
      path: `${root}/physical-${width}-${url.includes('127.') ? 'local' : 'production'}.png`,
    });
    await click(rows.first());
    assert.equal(await p.locator('.physical-roll-input input').count(), 1);
    await p.locator('.physical-roll-input input').fill('1');
    await click(p.getByRole('button', { name: '결과 확인', exact: true }));
    assert.equal(
      await p.evaluate(
        () =>
          JSON.parse(sessionStorage.getItem('morkborg-play-session:v1'))
            .lastRoll.mode,
      ),
      'USER_ROLL',
    );
    await close();
    await click(p.getByRole('button', { name: 'Play 도구 열기', exact: true }));
    await click(p.getByRole('button', { name: 'Recipes · 조합' }));
    await click(p.getByRole('button', { name: '+ 만들기', exact: true }));
    await p.getByRole('textbox', { name: '모음 이름' }).fill('Scroll QA');
    await p.getByRole('textbox', { name: '조합 참조 검색' }).fill('scroll');
    const choices = p.locator('.convenience-editor .convenience-add-row');
    assert.equal(await choices.count(), 8);
    assert.equal(await choices.first().isEnabled(), true);
    assert.equal(await choices.nth(1).isEnabled(), true);
    await p.screenshot({
      path: `${root}/recipe-${width}-${url.includes('127.') ? 'local' : 'production'}.png`,
    });
    await click(choices.first());
    await click(p.getByRole('button', { name: '저장', exact: true }));
    await click(p.getByRole('button', { name: 'Scroll QA RUN', exact: true }));
    assert.equal(await p.locator('.recipe-result').count(), 1);
    assert.equal(await p.locator('.recipe-result [role=alert]').count(), 0);
    assert.equal(await p.locator('.recipe-hold-discovery').count(), 0);
    await close();
    await p.getByRole('textbox', { name: '작업대 검색' }).fill('scroll');
    const first = await p
      .locator('.desk-search-results .reference-select-action')
      .first()
      .innerText();
    assert.match(first, /Powers|Scroll|Casting/i);
    // Missing and whitespace queries do not expose the whole registry.
    await click(p.getByRole('button', { name: 'Play 도구 열기', exact: true }));
    await click(
      p.getByRole('button', { name: 'Physical Roll · 실물 주사위 입력' }),
    );
    await p
      .getByRole('textbox', { name: '실물 입력 표 검색' })
      .fill('no-such-table-qa');
    assert.equal(await rows.count(), 0);
    assert.equal(
      await p.locator('.convenience-physical-picker .convenience-hint').count(),
      1,
    );
    await p.getByRole('textbox', { name: '실물 입력 표 검색' }).fill(' ');
    assert.equal(await rows.count(), 0);
    assert.equal(
      await p.locator('.convenience-physical-picker .convenience-hint').count(),
      0,
    );
    assert.equal(
      await p.evaluate(() => localStorage.getItem('morkborg-codex:v6')),
      campaign,
    );
    assert.equal(
      await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false,
    );
    assert.deepEqual(errors, []);
    records.push({
      width,
      url,
      manualScrollMatches: names,
      recipeFirstTwoSelectable: true,
      manualResolution: true,
      recipeRun: true,
      globalSearchFirst: first,
      campaignUnchanged: true,
      errors,
    });
  } catch (e) {
    await p.screenshot({ path: `${root}/failure-${width}.png` });
    throw e;
  } finally {
    await c.close();
  }
}
await b.close();
fs.writeFileSync(
  `${root}/picker-${url.includes('127.') ? 'local' : 'production'}.json`,
  JSON.stringify(records, null, 2),
);
console.log(records);
