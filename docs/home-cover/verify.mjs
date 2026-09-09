import { chromium } from '/Users/imwul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const url = process.argv[2] ?? 'http://127.0.0.1:5175';
const phase = process.argv[3] ?? 'local';
const dir = 'outputs/home-cover';
fs.mkdirSync(dir, { recursive: true });
const fixture = JSON.parse(
  fs.readFileSync('outputs/visual-quieting/after-accepted-storage.json'),
);
fixture.origins[0].origin = new URL(url).origin;
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
try {
  for (const width of [360, 768, 1440, 3440]) {
    for (const colorScheme of ['light', 'dark']) {
      const context = await browser.newContext({
        viewport: { width, height: 1000 },
        storageState: fixture,
        colorScheme,
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(url);
      await page.locator('.home-index').waitFor();
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => document.fonts.ready);
      const key = 'morkborg-codex:v6';
      const before = await page.evaluate((k) => localStorage.getItem(k), key);
      const measurement = await page.evaluate(() => {
        const home = document.querySelector('.reference-home');
        const title = home.querySelector('h1');
        const buttons = [...home.querySelectorAll('button')].filter(
          (b) => b.getBoundingClientRect().height,
        );
        const sample = (selector) => {
          const s = getComputedStyle(home.querySelector(selector));
          return {
            color: s.color,
            background: s.backgroundColor,
            fontSize: s.fontSize,
          };
        };
        return {
          width: innerWidth,
          height: document.documentElement.scrollHeight,
          homeWidth: home.getBoundingClientRect().width,
          title: sample('h1'),
          cover: sample('.desk-heading'),
          referenceSection: sample('.home-reference-section'),
          referenceLink: sample('.home-reference-section button'),
          playMarker: sample('.home-play-section h2 > span'),
          controls: buttons.length,
          shortTargets: buttons
            .filter((b) => b.getBoundingClientRect().height < 43.9)
            .map((b) => b.textContent),
          overflow: document.documentElement.scrollWidth > innerWidth,
          titleFits: title.scrollWidth <= title.clientWidth,
        };
      });
      assert.equal(measurement.overflow, false);
      assert.equal(measurement.titleFits, true);
      assert.deepEqual(measurement.shortTargets, []);
      assert.equal(
        await page.locator('.home-records').getAttribute('open'),
        null,
      );
      await page.screenshot({
        path: `${dir}/${phase}-${width}-${colorScheme}.png`,
        fullPage: true,
      });

      const search = page.getByRole('textbox', { name: '작업대 검색' });
      await search.fill('Reaction');
      const first = page
        .locator('.desk-search-results .reference-select-action')
        .first();
      await first.waitFor();
      if (colorScheme === 'light')
        await page.screenshot({ path: `${dir}/${phase}-search-${width}.png` });
      await first.click();
      await page.locator('.reference-reading').waitFor();
      await page.getByRole('button', { name: 'COPY', exact: true }).click();
      await page
        .locator('.reference-inspector > .source-disclosure > summary')
        .click();
      await page.getByRole('button', { name: '닫기', exact: true }).click();
      assert.equal(await page.locator('.home-index').isVisible(), true);
      await page.getByRole('button', { name: '검색 지우기' }).click();
      // Links must retain a visible keyboard focus on both dark and paper sections.
      const focusTarget = page
        .locator('.home-reference-section button')
        .first();
      await search.focus();
      await page.keyboard.press('Tab');
      await focusTarget.focus();
      const outline = await focusTarget.evaluate((b) => ({
        style: getComputedStyle(b).outlineStyle,
        width: getComputedStyle(b).outlineWidth,
      }));
      assert.equal(outline.style, 'solid');
      assert.equal(outline.width, '2px');
      await page.reload();
      await page.locator('.home-index').waitFor();
      assert.equal(
        await page.evaluate((k) => localStorage.getItem(k), key),
        before,
      );
      assert.deepEqual(errors, []);
      results.push({
        colorScheme,
        ...measurement,
        directRollClicks: 1,
        copyClicks: 1,
        sourceClicks: 1,
        campaignUnchanged: true,
        errors,
      });
      await context.close();
    }
  }
  fs.writeFileSync(`${dir}/${phase}.json`, JSON.stringify(results, null, 2));
  console.log(
    JSON.stringify(
      results.map(
        ({
          width,
          colorScheme,
          height,
          title,
          controls,
          campaignUnchanged,
        }) => ({
          width,
          colorScheme,
          height,
          titleSize: title.fontSize,
          controls,
          campaignUnchanged,
        }),
      ),
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
