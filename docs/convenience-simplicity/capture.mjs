import { chromium } from '/Users/imwul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const phase = process.argv[2] ?? 'before',
  after = phase === 'after',
  root = 'outputs/convenience-simplicity';
fs.mkdirSync(root, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true }),
  metrics = [];
const fixture = JSON.parse(
  fs.readFileSync('outputs/convenience-layer/accepted-storage.json'),
);
for (const width of [360, 1440, 3440]) {
  const context = await browser.newContext({
    viewport: { width, height: width === 360 ? 800 : 1000 },
    reducedMotion: 'reduce',
    storageState: fixture,
    isMobile: width === 360,
    hasTouch: width === 360,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(7000);
  const click = async (l) => {
    await l.click();
    await page.waitForTimeout(100);
  };
  const close = async () => {
    const b = page.getByRole('button', { name: '닫기', exact: true });
    if (await b.count()) await click(b);
  };
  const play = async () => {
    await close();
    await click(
      page.getByRole('button', { name: 'Play 도구 열기', exact: true }),
    );
  };
  const snap = async (state) => {
    await page.waitForTimeout(180);
    await page.screenshot({ path: `${root}/${phase}-${state}-${width}.png` });
    const data = await page.evaluate(() => {
      const root =
        document.querySelector('[role=dialog]') ??
        document.querySelector('main') ??
        document.body;
      const visible = (e) => {
        const r = e.getBoundingClientRect();
        return (
          r.width > 0 &&
          r.height > 0 &&
          r.bottom > 0 &&
          r.top < innerHeight &&
          getComputedStyle(e).visibility !== 'hidden' &&
          !e.closest('[inert],[aria-hidden=true]') &&
          e.checkVisibility({ checkVisibilityCSS: true })
        );
      };
      const els = [...root.querySelectorAll('*')].filter(visible);
      return {
        controls: els.filter((e) =>
          e.matches('button,input,textarea,select,summary'),
        ).length,
        dialogHeight:
          document.querySelector('[role=dialog]')?.getBoundingClientRect()
            .height ?? 0,
        pageHeight: document.documentElement.scrollHeight,
        overflow: document.documentElement.scrollWidth > innerWidth,
        dialogOverflow: root.scrollWidth > root.clientWidth + 1,
        accentBlocks: els.filter((e) => {
          const s = getComputedStyle(e);
          return (
            /rgb\(2[45]\d, 2[345]\d, [0-9]+\)/.test(s.backgroundColor) &&
            e.getBoundingClientRect().height > 12
          );
        }).length,
      };
    });
    metrics.push({ phase, state, width, ...data });
    assert.equal(data.overflow, false);
    assert.equal(data.dialogOverflow, false);
  };
  try {
    await page.goto('http://127.0.0.1:5175');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      localStorage.removeItem('morkborg-convenience:v1');
      localStorage.removeItem('morkborg-reference-desk:v1');
      sessionStorage.removeItem('morkborg-play-session:v1');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    await snap('fresh');
    await page.getByRole('textbox', { name: '작업대 검색' }).fill('Reaction');
    await click(
      page.locator('.desk-search-results .reference-select-action').first(),
    );
    await snap('first-roll');
    await click(page.locator('.reference-convenience-actions > summary'));
    await click(
      page.getByRole('button', {
        name: after ? 'ADD TO PLAY · PLAY에 추가' : '+ Play Tray',
        exact: true,
      }),
    );
    await close();
    await snap('tray');
    await play();
    await snap('play');
    await click(
      page.getByRole('button', { name: 'Scratch · 스크랩', exact: true }),
    );
    await page
      .getByRole('textbox', { name: '임시 스크랩' })
      .fill('검은 문은 아직 열지 않음 · black door unopened');
    if (after)
      await click(page.getByRole('button', { name: '작성 완료', exact: true }));
    await snap('scratch');
    await close();
    // Load existing user preferences unchanged; all other states use the same reference fixtures.
    await page.evaluate(
      (p) => localStorage.setItem('morkborg-convenience:v1', p),
      fixture.origins[0].localStorage.find(
        (x) => x.name === 'morkborg-convenience:v1',
      ).value,
    );
    await page.reload();
    await page.waitForLoadState('networkidle');
    await play();
    await click(
      page.getByRole('button', { name: 'Recipes · 조합', exact: true }),
    );
    await click(
      page.getByRole('button', {
        name: after ? 'QA FIRST CONTACT RUN' : 'QA FIRST CONTACT RUN ALL',
        exact: true,
      }),
    );
    await snap('recipe');
    await play();
    if (after) await click(page.locator('.convenience-organization > summary'));
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
  } catch (e) {
    await page.screenshot({ path: `${root}/${phase}-failure-${width}.png` });
    throw e;
  } finally {
    await context.close();
  }
}
await browser.close();
fs.writeFileSync(
  `${root}/${phase}-metrics.json`,
  JSON.stringify(metrics, null, 2),
);
console.log(`${phase}: ${metrics.length} screenshots, no overflow`);
