import { chromium } from '/Users/imwul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const root = 'outputs/convenience-layer',
  browser = await chromium.launch({ channel: 'chrome', headless: true }),
  metrics = [],
  errors = [];
for (const width of [360, 768, 1440, 3440]) {
  const context = await browser.newContext({
    viewport: { width, height: width === 360 ? 800 : 1000 },
    storageState: `${root}/accepted-storage.json`,
    reducedMotion: 'reduce',
    isMobile: width === 360,
    hasTouch: width === 360,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(6000);
  page.on('pageerror', (e) => errors.push(e.message));
  const click = async (l) => {
      await l.click();
      await page.waitForTimeout(120);
    },
    close = async () => {
      if (await page.getByRole('button', { name: '닫기', exact: true }).count())
        await click(page.getByRole('button', { name: '닫기', exact: true }));
    };
  const tools = async (tab) => {
    await close();
    await click(
      page.getByRole('button', { name: 'Play 도구 열기', exact: true }),
    );
    if (tab) await click(page.getByRole('button', { name: tab, exact: true }));
  };
  const snap = async (state, theme = 'light') => {
    await page.waitForTimeout(150);
    await page.screenshot({ path: `${root}/${state}-${width}-${theme}.png` });
    const m = await page.evaluate(() => {
      const d = document.querySelector('[role=dialog]');
      return {
        pageOverflow: document.documentElement.scrollWidth > innerWidth,
        dialogOverflow: d ? d.scrollWidth > d.clientWidth + 1 : false,
        dialogWidth: d?.getBoundingClientRect().width,
        dialogHeight: d?.getBoundingClientRect().height,
        railWidth: document
          .querySelector('.reference-rail')
          .getBoundingClientRect().width,
        buttons: [...document.querySelectorAll('button,summary')].filter(
          (e) => {
            const r = e.getBoundingClientRect();
            return (
              r.width &&
              r.height &&
              r.top >= 0 &&
              r.bottom <= innerHeight &&
              r.left >= 0 &&
              r.right <= innerWidth &&
              !e.closest('[inert]')
            );
          },
        ).length,
      };
    });
    metrics.push({ width, state, theme, ...m });
    assert.equal(m.pageOverflow, false, `${state} page overflow @${width}`);
    assert.equal(m.dialogOverflow, false, `${state} dialog overflow @${width}`);
  };
  try {
    await page.goto('http://127.0.0.1:5175');
    await page.waitForLoadState('networkidle');
    await snap('empty');
    await tools();
    await page
      .getByRole('textbox', { name: 'Tray 참조 검색' })
      .fill('Reaction');
    await click(page.locator('.convenience-add-row').first());
    await page
      .getByRole('textbox', { name: 'Tray 참조 검색' })
      .fill('Action + Theme');
    await click(page.locator('.convenience-add-row').first());
    await close();
    await snap('tray');
    await click(
      page
        .locator('.reference-play-tray')
        .getByRole('button', { name: 'Reaction', exact: true }),
    );
    await close();
    await snap('last');
    await tools('Recipes · 조합');
    await click(
      page.getByRole('button', {
        name: 'QA FIRST CONTACT RUN ALL',
        exact: true,
      }),
    );
    await snap('recipe');
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
    await page
      .getByRole('textbox', { name: '임시 스크랩' })
      .fill('검은 문은 아직 열지 않음 · black door unopened');
    await snap('scratch');
    await click(
      page.getByRole('button', { name: 'Packs · 모음', exact: true }),
    );
    await click(page.getByRole('button', { name: 'City · 도시', exact: true }));
    await close();
    await snap('pack');
    await page.keyboard.press('Control+k');
    await page
      .getByRole('textbox', { name: '통합 참조 검색' })
      .fill('Building Type');
    await click(
      page.locator('.reference-search-dialog .reference-select-action').first(),
    );
    await click(page.locator('.physical-roll-input > summary'));
    await page.locator('.physical-roll-input input').fill('35');
    await snap('manual');
    await click(page.getByRole('button', { name: '결과 확인', exact: true }));
    await click(
      page.locator('.reference-inspector > .source-disclosure > summary'),
    );
    await snap('manual-source');
    await page.emulateMedia({ colorScheme: 'dark' });
    await snap('manual-source', 'dark');
    await tools('Scratch · 스크랩');
    await snap('scratch', 'dark');
    await close();
    await snap('pack', 'dark');
  } catch (e) {
    await page.screenshot({ path: `${root}/visual-failure-${width}.png` });
    console.error(e.stack);
    throw e;
  } finally {
    await context.close();
  }
}
fs.writeFileSync(
  `${root}/visual-metrics.json`,
  JSON.stringify({ metrics, errors }, null, 2),
);
assert.deepEqual(errors, []);
await browser.close();
console.log('Visual checks', metrics.length);
