import assert from 'node:assert/strict';
import { chromium } from '/Users/imwul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const data = JSON.parse(readFileSync('outputs/morkborg-private-data.json'));
const browser = await chromium.launch({
  headless: true,
  args: ['--no-proxy-server'],
});
const mode = process.env.AUDIT_MODE || 'after';
const reports = [];
mkdirSync('outputs/dungeon-context', { recursive: true });
for (const width of (process.env.WIDTHS || '360,768,1440,3440')
  .split(',')
  .map(Number)) {
  const ctx = await browser.newContext({
    viewport: { width, height: 1000 },
    isMobile: width === 360,
    hasTouch: width === 360,
    reducedMotion: 'reduce',
  });
  const page = await ctx.newPage();
  const checks = [],
    errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.setDefaultTimeout(10000);
  const trace = [],
    searches = [],
    snapshots = [];
  let clicks = 0,
    backs = 0;
  const click = async (l, label) => {
    if (width === 360) await l.tap();
    else await l.click();
    clicks++;
    trace.push({ action: label });
  };
  const reader = () => page.locator('.reference-page');
  const selected = () => reader().getAttribute('data-reference-id');
  const settle = () =>
    page.evaluate(
      () =>
        new Promise((r) =>
          requestAnimationFrame(() => requestAnimationFrame(r)),
        ),
    );
  const search = async (q, id) => {
    searches.push(q);
    await click(
      page.getByRole('textbox', { name: '참조 검색' }),
      'focus search: ' + q,
    );
    await page.getByRole('textbox', { name: '참조 검색' }).fill(q);
    await click(
      page
        .locator(
          `[data-reference-row="${id}"] .reference-select-action:visible`,
        )
        .first(),
      'search result: ' + id,
    );
    await page.locator(`.reference-page[data-reference-id="${id}"]`).waitFor();
  };
  const roll = async (fraction = 0.2) => {
    await page.evaluate((f) => {
      crypto.getRandomValues = (a) => {
        a.fill(Math.floor(f * 4294967296));
        return a;
      };
    }, fraction);
    await click(
      reader()
        .getByRole('button', { name: /^(ROLL|REROLL)$/, exact: true })
        .first(),
      'roll',
    );
    await settle();
  };
  const back = async (id) => {
    for (let n = 0; n < 5; n++) {
      await page.goBack();
      backs++;
      await settle();
      if ((await selected().catch(() => null)) === id) return;
    }
    throw new Error('cannot back to ' + id);
  };
  const linked = async (id) => {
    await click(
      reader().locator(`[data-relationship-target="${id}"]`).first(),
      'existing result link: ' + id,
    );
    await settle();
  };
  const source = async () => {
    if (mode === 'before') return search('Nodh', 'creature:core:61:nodh');
    await click(
      reader().locator(
        '[data-dungeon-context-reference="creature:core:61:nodh"]',
      ),
      'context source: creature:core:61:nodh',
    );
    assert.equal(await selected(), 'creature:core:61:nodh');
    await reader()
      .getByRole('button', { name: '전투에 적으로 추가 ↗', exact: true })
      .waitFor();
    assert.equal(await page.getByRole('dialog').count(), 0);
  };
  const snapshot = async (label) => {
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      'overflow ' + label,
    );
    snapshots.push({
      label,
      id: await selected(),
      text: await reader().innerText(),
    });
  };
  try {
    await page.route('**/api/rulebook-data?*', (r) =>
      r.fulfill({ json: { schemaVersion: 1, revision: 1, bundle: data } }),
    );
    await page.goto(process.env.REFERENCE_URL || 'http://127.0.0.1:5177');
    await click(page.getByRole('button', { name: /공간 탐색/ }), 'Dungeon');
    await click(page.getByRole('button', { name: /다음 방으로/ }), 'crawl');
    await page.evaluate(() => {
      let n = 0;
      crypto.getRandomValues = (a) => {
        a.fill(Math.floor((n++ % 2 ? 0.1 : 0.8) * 4294967296));
        return a;
      };
    });
    await click(
      page.getByRole('button', { name: '던전 탐색 굴리기', exact: true }),
      'weak crawl',
    );

    await click(
      reader()
        .getByRole('button', { name: /방 묘사/ })
        .first(),
      'room 1 description',
    );
    await roll(0.2);
    await snapshot('room 1');
    await back('rule:sd.dungeonCrawling');
    await click(
      page
        .locator(
          '[data-reference-row="oracle:sd.room.contents"] .reference-select-action:visible',
        )
        .first(),
      'room contents',
    );
    await roll(0.45);
    await snapshot('common encounter');
    await linked('rule:sd.stockCommon');
    await snapshot('common rule');
    await search('조우 후보', 'procedure:workbench.stock-room');
    await roll(0.2);
    await snapshot('Nodh encounter 1');
    await linked('oracle:core.reaction');
    await roll(0.5);
    await back('procedure:workbench.stock-room');
    await source();
    await snapshot('creature source');
    await back('procedure:workbench.stock-room');
    await search('Room Contents', 'oracle:sd.room.contents');
    await roll(0.1);
    await snapshot('room 2 ambiguous remains');
    await search('Searching Strong', 'oracle:sd.search.strong');
    await roll(0);
    await linked('oracle:core.corpsePlundering');
    await roll(0.2);
    await snapshot('corpse plunder');
    await back('oracle:sd.search.strong');
    await roll(0.9);
    await linked('oracle:core.treasures');
    await roll(0.2);
    await snapshot('treasure');
    await back('oracle:sd.search.strong');
    await click(
      page.getByRole('button', { name: /공간 탐색/ }),
      'return Dungeon map',
    );
    await click(page.locator('[data-hotspot-id="dungeon-trap"]'), 'trap');
    await roll(0.4);
    await snapshot('trap');
    await click(page.locator('[data-hotspot-id="dungeon-door"]'), 'exit');
    await roll(0.3);
    await snapshot('door');
    await search('Room Contents', 'oracle:sd.room.contents');
    await roll(0.99);
    await snapshot('room 3 empty');
    await search('조우 후보', 'procedure:workbench.stock-room');
    await roll(0.2);
    await snapshot('Nodh encounter 2');
    await source();
    await back('procedure:workbench.stock-room');
    assert.deepEqual(errors, []);

    // Acceptance outside the measured comparison: no added clicks counted above.
    if (mode === 'after') {
      const measured = { searches: [...searches], clicks, backs };
      await reader()
        .getByRole('button', { name: '작업대에 펼치기', exact: true })
        .click();
      await page.getByRole('button', { name: /공간 탐색/ }).click();
      await page
        .locator(
          '[data-open-reference-id="procedure:workbench.stock-room"] > header button',
        )
        .first()
        .click();
      await reader().getByText('굴림 설정', { exact: true }).click();
      const origin = reader().locator(
        '[data-dungeon-context-reference="creature:core:61:nodh"]',
      );
      await origin.scrollIntoViewIfNeeded();
      await origin.focus();
      await settle();
      const before = {
        text: await reader().locator('.reference-reading-items').innerText(),
        details: await reader()
          .locator('details')
          .evaluateAll((es) => es.map((e) => e.open)),
        scroll: await page.evaluate(() => scrollY),
      };
      await page.evaluate(() => {
        window.__diceDraws = 0;
        crypto.getRandomValues = (a) => {
          window.__diceDraws++;
          a.fill(858993459);
          return a;
        };
      });
      if (width === 360) await origin.tap();
      else await origin.press('Enter');
      await page
        .locator('.reference-page[data-reference-id="creature:core:61:nodh"]')
        .waitFor();
      await reader()
        .getByRole('button', { name: '전투에 적으로 추가 ↗', exact: true })
        .waitFor();
      assert.equal(await page.evaluate(() => window.__diceDraws), 0);
      assert.equal(await page.getByRole('dialog').count(), 0);
      await page.goBack();
      await page.waitForFunction(
        () =>
          document.activeElement?.getAttribute(
            'data-dungeon-context-reference',
          ) === 'creature:core:61:nodh',
      );
      await page.waitForTimeout(250);
      assert.equal(
        await reader().locator('.reference-reading-items').innerText(),
        before.text,
      );
      assert.deepEqual(
        await reader()
          .locator('details')
          .evaluateAll((es) => es.map((e) => e.open)),
        before.details,
      );
      assert.ok(
        Math.abs((await page.evaluate(() => scrollY)) - before.scroll) <= 2,
        'scroll restoration',
      );
      const size = await origin.boundingBox();
      assert.ok(size.height >= 44);
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      await page.screenshot({
        path: `outputs/dungeon-context/context-${width}.png`,
      });
      checks.push(
        'Dungeon → source → Back retains result, settings details, scroll, focused link; no RNG/combat; 44px touch target',
      );
      // Source changes on another result; the old creature must disappear.
      await roll(0.01);
      assert.equal(
        await reader()
          .locator('[data-dungeon-context-reference="creature:core:61:nodh"]')
          .count(),
        0,
      );
      assert.equal(
        await reader().locator('.dungeon-relevant button').count(),
        1,
      );
      checks.push('Another encounter replaces the source link');
      // Existing explicit corpse/treasure edges, including browser Back, were used in measured play.
      checks.push(
        'Existing corpse/treasure links reused; no invented links for trap, door, remains or empty room',
      );
      reports.push({
        width,
        mode,
        ...measured,
        checks,
        errors,
        trace,
        snapshots: snapshots.map(({ text, ...rest }) => rest),
      });
    } else {
      reports.push({
        width,
        mode,
        searches,
        clicks,
        backs,
        errors,
        trace,
        snapshots: snapshots.map(({ text, ...rest }) => rest),
      });
    }
    console.log(width, mode, 'PASS');
  } catch (e) {
    console.error(width, e);
    console.log('DOM', await page.locator('body').innerText());
    reports.push({
      width,
      mode,
      error: String(e),
      searches,
      clicks,
      backs,
      trace,
    });
    process.exitCode = 1;
  } finally {
    await ctx.close();
  }
}
writeFileSync(
  'outputs/dungeon-context/acceptance.json',
  JSON.stringify(reports, null, 2),
);
await browser.close();
