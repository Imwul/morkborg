import { chromium } from '/Users/imwul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const root = 'outputs/convenience-layer',
  browser = await chromium.launch({ channel: 'chrome', headless: true }),
  context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    storageState: `${root}/accepted-storage.json`,
    reducedMotion: 'reduce',
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
  events = [];
page.on('pageerror', (e) => errors.push(e.message));
page.setDefaultTimeout(6000);
let searchCount = 0,
  clicks = 0;
const begin = Date.now(),
  end = begin + 20 * 60000;
const click = async (el) => {
  await el.click();
  clicks++;
  await page.waitForTimeout(60);
};
const close = async () => {
  if (await page.getByRole('button', { name: '닫기', exact: true }).count())
    await click(page.getByRole('button', { name: '닫기', exact: true }));
};
try {
  await page.goto('http://127.0.0.1:5175');
  await page.waitForLoadState('networkidle');
  const campaign = await page.evaluate(() =>
    localStorage.getItem('morkborg-codex:v6'),
  );
  let cycle = 0;
  while (Date.now() < end) {
    cycle++;
    await close();
    await click(
      page
        .locator('.reference-play-tray')
        .getByRole('button', { name: 'Reaction', exact: true }),
    );
    await close();
    await click(
      page.getByRole('button', { name: '마지막 굴림 다시 실행', exact: true }),
    );
    await close();
    await click(
      page
        .locator('.reference-play-tray')
        .getByRole('button', { name: 'Action + Theme', exact: true }),
    );
    const held = page.locator('.partial-roll-controls');
    if ((await held.getAttribute('open')) === null)
      await click(held.locator('summary'));
    const lock = page
      .locator('.held-component')
      .first()
      .getByRole('button', { name: /고정/ });
    if ((await lock.getAttribute('aria-pressed')) !== 'true') await click(lock);
    await click(
      page
        .locator('.held-component')
        .nth(1)
        .getByRole('button', { name: /다시 굴리기/ }),
    );
    await click(
      page.getByRole('button', { name: '창 안에서 Play 도구', exact: true }),
    );
    await click(
      page.getByRole('button', { name: 'Recipes · 조합', exact: true }),
    );
    await click(
      (await page
        .getByRole('button', { name: 'RUN ALL · 고정 제외', exact: true })
        .isVisible())
        ? page.getByRole('button', { name: 'RUN ALL · 고정 제외', exact: true })
        : page.getByRole('button', {
            name: 'QA FIRST CONTACT RUN ALL',
            exact: true,
          }),
    );
    await click(page.locator('summary[aria-label="Recipe 결과 1 추가 동작"]'));
    await click(
      page
        .locator('.recipe-result')
        .first()
        .getByRole('button', { name: '스크랩에 추가', exact: true }),
    );
    await click(
      page.getByRole('button', { name: 'Scratch · 스크랩', exact: true }),
    );
    const scratch = page.getByRole('textbox', { name: '임시 스크랩' });
    await scratch.fill(
      `QA scratch cycle ${cycle} · handwritten record stays separate`,
    );
    await close();
    if (cycle % 3 === 0) {
      await click(
        page
          .locator('.reference-play-tray')
          .getByRole('button', { name: 'Reaction', exact: true }),
      );
      if (
        (await page.locator('.physical-roll-input').getAttribute('open')) ===
        null
      )
        await click(page.locator('.physical-roll-input > summary'));
      await page.locator('.physical-roll-input input').fill('3,4');
      await click(page.getByRole('button', { name: '결과 확인', exact: true }));
      await click(
        page
          .getByRole('button', { name: '마지막 굴림 다시 실행', exact: true })
          .last(),
      );
      assert.equal(
        await page.locator('.physical-roll-input input').inputValue(),
        '3,4',
      );
      await close();
    }
    assert.ok(
      (await page.evaluate(() => localStorage.getItem('morkborg-codex:v6'))) ===
        campaign,
      'Convenience action mutated Campaign',
    );
    events.push({
      cycle,
      elapsedSeconds: Math.round((Date.now() - begin) / 1000),
      clicks,
    });
    fs.writeFileSync(
      `${root}/friction-progress.json`,
      JSON.stringify({ events, errors }, null, 2),
    );
    await page.waitForTimeout(Math.min(18000, Math.max(0, end - Date.now())));
  }
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    `${root}/friction.json`,
    JSON.stringify(
      {
        started: new Date(begin).toISOString(),
        elapsedSeconds: (Date.now() - begin) / 1000,
        cycles: cycle,
        clicks,
        searchCount,
        events,
        errors,
        campaignUnchanged: true,
      },
      null,
      2,
    ),
  );
  console.log('20-minute friction run complete', cycle, clicks);
} catch (e) {
  await page.screenshot({ path: `${root}/friction-failure.png` });
  console.error(e.stack);
  process.exitCode = 1;
} finally {
  await browser.close();
}
