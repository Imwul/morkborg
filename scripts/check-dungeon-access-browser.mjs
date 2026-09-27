import assert from 'node:assert/strict';
import fs from 'node:fs';
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ||
    '/Users/imwul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
);
const mode = process.env.AUDIT_MODE || 'before',
  output = 'outputs/dungeon-access';
fs.mkdirSync(output, { recursive: true });
const browser = await chromium.launch({ args: ['--no-proxy-server'] }),
  reports = [];
const data = JSON.parse(fs.readFileSync('outputs/morkborg-private-data.json'));
for (const width of (process.env.WIDTHS || '1440').split(',').map(Number)) {
  const ctx = await browser.newContext({
      viewport: { width, height: 1000 },
      isMobile: width === 360,
      hasTouch: width === 360,
      reducedMotion: 'reduce',
    }),
    page = await ctx.newPage();
  page.setDefaultTimeout(10000);
  const trace = [],
    searches = [],
    errors = [],
    checks = [];
  let clicks = 0,
    backs = 0,
    exits = 0,
    deskOpens = 0,
    selections = 0;
  page.on('pageerror', (e) => errors.push(e.message));
  const settle = () =>
    page.evaluate(
      () =>
        new Promise((r) =>
          requestAnimationFrame(() => requestAnimationFrame(r)),
        ),
    );
  const reader = () => page.locator('.reference-page');
  const click = async (l, label) => {
    await (width === 360 ? l.tap() : l.click());
    clicks++;
    trace.push(label);
    await settle();
  };
  const open = async (l, id, label = id) => {
    await click(l, label);
    await page.locator(`.reference-page[data-reference-id="${id}"]`).waitFor();
    selections++;
  };
  const action = (text) =>
    page
      .locator('.scene-play-actions')
      .getByRole('button', { name: new RegExp(text) });
  const related = async (id) =>
    open(
      page
        .locator(
          `[data-reference-row="${id}"] .reference-select-action:visible`,
        )
        .first(),
      id,
      'Related ' + id,
    );
  const roll = async (f) => {
    await page.evaluate((f) => {
      crypto.getRandomValues = (a) => {
        a.fill(Math.floor(f * 4294967296));
        return a;
      };
    }, f);
    await click(
      reader()
        .getByRole('button', { name: /^(ROLL|REROLL)$/, exact: true })
        .first(),
      'explicit Roll ' + f,
    );
  };
  const back = async (id) => {
    await page.goBack();
    backs++;
    trace.push('Back ' + id);
    await page.locator(`.reference-page[data-reference-id="${id}"]`).waitFor();
    await page.waitForTimeout(220);
  };
  const link = async (id) =>
    open(
      reader().locator(`[data-relationship-target="${id}"]`).first(),
      id,
      'result link ' + id,
    );
  const crawl = async () =>
    open(
      action('다음 방으로'),
      'rule:sd.dungeonCrawling',
      'player chooses next room',
    );
  const contents = () => related('oracle:sd.room.contents');
  const resetMap = async () => {
    await click(
      page.getByRole('button', { name: '← 지도로 돌아가기', exact: true }),
      'return map',
    );
  };
  const mark = (label) => ({
    label,
    clicks,
    backs,
    searches: searches.length,
    selections,
    exits,
    deskOpens,
  });
  try {
    await page.route('**/api/rulebook-data?*', (r) =>
      r.fulfill({ json: { schemaVersion: 1, revision: 1, bundle: data } }),
    );
    await page.goto(process.env.REFERENCE_URL || 'http://127.0.0.1:5178');
    await click(
      page.getByRole('button', { name: /공간 탐색/ }),
      'enter Dungeon',
    );
    await page.evaluate(() => {
      localStorage.setItem('dungeon-audit-sentinel', 'notebook');
      sessionStorage.setItem(
        'morkborg-combat-tool:v1',
        '{"audit":"unchanged"}',
      );
    });
    const boundaries = [mark('start')];
    // A: player chooses to describe an ordinary room, inspect contents, and leave. No Search decision.
    await crawl();
    await page.evaluate(() => {
      let n = 0;
      crypto.getRandomValues = (a) => {
        a.fill(Math.floor((n++ % 2 ? 0.1 : 0.8) * 4294967296));
        return a;
      };
    });
    await click(
      page.getByRole('button', { name: '던전 탐색 굴리기', exact: true }),
      'explicit weak crawl',
    );
    await open(
      reader().getByRole('button', { name: /일반 방 묘사 열기/ }),
      'procedure:sd.room-description',
    );
    await roll(0.2);
    await back('rule:sd.dungeonCrawling');
    await contents();
    await roll(0.99);
    assert.match(await reader().innerText(), /empty/i);
    assert.equal(await reader().locator('.dungeon-relevant').count(), 0);
    await open(
      page.locator('[data-hotspot-id="dungeon-door"]'),
      'oracle:reclvse.exitType',
      'player chooses exit',
    );
    await roll(0.3);
    await resetMap();
    boundaries.push(mark('A empty / ready to leave'));
    // B: Common encounter; player explicitly chooses to prepare ONE regional candidate (not start combat).
    await crawl();
    await contents();
    await roll(0.45);
    await link('rule:sd.stockCommon');
    if (mode === 'before') {
      assert.equal(await action('조우 후보 준비').count(), 0);
      const q = '조우 후보';
      searches.push({
        q,
        reason: 'C',
        intent:
          'Prepare one regional Common candidate using existing Encounter Candidate tool',
        origin: 'rule:sd.stockCommon',
      });
      await click(
        page.getByRole('textbox', { name: '참조 검색' }),
        'focus Search',
      );
      await page.getByRole('textbox', { name: '참조 검색' }).fill(q);
      exits++;
      deskOpens++;
      await open(
        page
          .locator(
            '[data-reference-row="procedure:workbench.stock-room"] .reference-select-action:visible',
          )
          .first(),
        'procedure:workbench.stock-room',
        'Search result',
      );
    } else await related('procedure:workbench.stock-room');
    await roll(0.2);
    assert.match(await reader().innerText(), /Nodh/);
    await link('oracle:core.reaction');
    await roll(0.5);
    await back('procedure:workbench.stock-room');
    await open(
      reader().locator(
        '[data-dungeon-context-reference="creature:core:61:nodh"]',
      ),
      'creature:core:61:nodh',
      'canonical source',
    );
    await reader()
      .getByRole('button', { name: '전투에 적으로 추가 ↗', exact: true })
      .waitFor();
    await back('procedure:workbench.stock-room');
    if (mode === 'before')
      await click(
        page.getByRole('button', { name: /공간 탐색/ }),
        'return Dungeon from Reference Desk',
      );
    else await resetMap();
    boundaries.push(mark('B encounter / ready to leave'));
    // C: remains does not propose anything. Player independently elects Searching and uses existing action.
    await crawl();
    await contents();
    await roll(0.1);
    assert.equal(await reader().locator('.dungeon-relevant').count(), 0);
    await open(
      action('물건 찾기'),
      'rule:sd.search-move',
      'player explicitly chooses Searching',
    );
    await page.evaluate(() => {
      let n = 0;
      crypto.getRandomValues = (a) => {
        a.fill(Math.floor((n++ < 2 ? 0.9 : 0) * 4294967296));
        return a;
      };
    });
    await click(
      reader().getByRole('button', { name: /^탐색 2d20/ }),
      'explicit Searching roll',
    );
    // Existing action rolls the result d4; its result links are reused.
    await link('oracle:core.corpsePlundering');
    await roll(0.2);
    await back('rule:sd.search-move');
    await related('oracle:sd.search.strong');
    await roll(0.9);
    await link('oracle:core.treasures');
    await roll(0.2);
    await back('oracle:sd.search.strong');
    await open(
      page.locator('[data-hotspot-id="dungeon-trap"]'),
      'oracle:core.traps',
      'player manually chooses trap',
    );
    await roll(0.4);
    await resetMap();
    boundaries.push(mark('C object-rich / ready to leave'));
    const metrics = {
      searches: searches.length,
      repeatedSearches:
        searches.length - new Set(searches.map((s) => s.q)).size,
      clicks,
      backs,
      referenceSelections: selections,
      workspaceExits: exits,
      referenceDeskOpens: deskOpens,
      repeatedProcedureLookups:
        trace.filter((x) => x === 'player chooses next room').length - 1,
    };
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    assert.equal(
      await page.evaluate(() =>
        sessionStorage.getItem('morkborg-combat-tool:v1'),
      ),
      '{"audit":"unchanged"}',
    );
    assert.deepEqual(errors, []);

    if (mode === 'after') {
      await crawl();
      await contents();
      await roll(0.45);
      await link('rule:sd.stockCommon');
      const origin = page
        .locator(
          '[data-reference-row="procedure:workbench.stock-room"] .reference-select-action:visible',
        )
        .first();
      const detail = reader().locator('details').first();
      if (await detail.count()) await detail.locator('summary').first().click();
      await origin.scrollIntoViewIfNeeded();
      await origin.focus();
      await settle();
      const saved = {
        text: await reader().innerText(),
        details: await reader()
          .locator('details')
          .evaluateAll((es) => es.map((e) => e.open)),
        scroll: await page.evaluate(() => scrollY),
      };
      await page.evaluate(() => {
        window.__accessDice = 0;
        crypto.getRandomValues = (a) => {
          window.__accessDice++;
          a.fill(858993459);
          return a;
        };
      });
      assert.ok((await origin.boundingBox()).height >= 44);
      if (width === 360) await origin.tap();
      else await origin.press('Enter');
      await page
        .locator(
          '.reference-page[data-reference-id="procedure:workbench.stock-room"]',
        )
        .waitFor();
      assert.equal(await page.evaluate(() => window.__accessDice), 0);
      await page.goBack();
      await page.waitForTimeout(250);
      assert.equal(
        await origin.evaluate((e) => document.activeElement === e),
        true,
        'direct access Back focus',
      );
      assert.equal(await reader().innerText(), saved.text);
      assert.deepEqual(
        await reader()
          .locator('details')
          .evaluateAll((es) => es.map((e) => e.open)),
        saved.details,
      );
      assert.ok(
        Math.abs((await page.evaluate(() => scrollY)) - saved.scroll) <= 2,
        'direct access Back scroll: ' +
          saved.scroll +
          ' → ' +
          (await page.evaluate(() => scrollY)),
      );
      const searchAction = action('물건 찾기');
      await searchAction.scrollIntoViewIfNeeded();
      await searchAction.focus();
      await settle();
      await searchAction.press('Enter');
      await page
        .locator('.reference-page[data-reference-id="rule:sd.search-move"]')
        .waitFor();
      assert.equal(await page.evaluate(() => window.__accessDice), 0);
      await page.goBack();
      await page.waitForTimeout(250);
      assert.equal(
        await searchAction.evaluate((e) => document.activeElement === e),
        true,
        'action Back focus',
      );
      checks.push(
        'Related → candidate → Back preserves text/details/scroll/focus; existing Searching action → Back restores action focus; inspection draws 0 dice',
      );
      await origin.scrollIntoViewIfNeeded();
      await origin.focus();
      await settle();
      checks.push({
        focus: await origin.evaluate((e) => ({
          outline: getComputedStyle(e).outlineStyle,
          outlineWidth: getComputedStyle(e).outlineWidth,
        })),
        target: await origin.boundingBox(),
      });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      await page.screenshot({ path: `${output}/${mode}-${width}.png` });
      // Actually exercise existing alternatives, outside the measured room scenarios.
      await origin.click();
      await reader()
        .getByRole('button', { name: '참조 고정', exact: true })
        .click();
      await reader()
        .getByRole('button', { name: '작업대에 펼치기', exact: true })
        .click();
      await page
        .getByRole('button', { name: '← 지도로 돌아가기', exact: true })
        .click();
      await page
        .locator(
          '[data-open-reference-id="procedure:workbench.stock-room"] > header button',
        )
        .first()
        .click();
      assert.equal(
        await reader().getAttribute('data-reference-id'),
        'procedure:workbench.stock-room',
      );
      await page
        .locator('.spatial-reader-tools')
        .getByRole('button', { name: '고정', exact: true })
        .click();
      await page
        .locator(
          '[data-reference-row="procedure:workbench.stock-room"] .reference-select-action:visible',
        )
        .first()
        .click();
      assert.equal(
        await reader().getAttribute('data-reference-id'),
        'procedure:workbench.stock-room',
      );
      await page.getByRole('button', { name: /공간 탐색/ }).click();
      await page
        .locator('.spatial-reader-tools')
        .getByRole('button', { name: '최근', exact: true })
        .click();
      await page
        .locator(
          '[data-reference-row="procedure:workbench.stock-room"] .reference-select-action:visible',
        )
        .first()
        .click();
      assert.equal(
        await reader().getAttribute('data-reference-id'),
        'procedure:workbench.stock-room',
      );
      checks.push(
        'Workbench reopened in Spatial; Pin and Recent reopened same candidate through Reference Desk (prior visit required)',
      );
      await page.getByRole('button', { name: /공간 탐색/ }).click();
      const tray = page.locator(
        '[data-open-reference-id="procedure:workbench.stock-room"]',
      );
      await tray.locator('header button').first().click();
      await reader().locator('.reference-options > summary').click();
      assert.equal(
        await reader()
          .locator('.reference-options')
          .evaluate((e) => e.open),
        true,
      );
      await reader()
        .locator('[data-dungeon-context-reference="creature:core:61:nodh"]')
        .click();
      await page.evaluate(() => {
        crypto.getRandomValues = (a) => {
          a.fill(42949672);
          return a;
        };
      });
      await tray.locator('.open-page-roll').click(); // Explicit reroll while inspecting the source.
      assert.equal(
        await reader().getAttribute('data-reference-id'),
        'creature:core:61:nodh',
      );
      await page.goBack();
      await page
        .locator(
          '.reference-page[data-reference-id="procedure:workbench.stock-room"]',
        )
        .waitFor();
      await settle();
      assert.equal(
        await reader()
          .locator('.reference-options')
          .evaluate((e) => e.open),
        false,
      );
      assert.equal(
        await reader()
          .locator('[data-dungeon-context-reference="creature:core:61:nodh"]')
          .count(),
        0,
      );
      assert.equal(
        await reader()
          .locator('.dungeon-relevant [data-dungeon-context-reference]')
          .count(),
        1,
      );
      checks.push(
        'Workbench reroll while away changes reading identity: Back shows new source, does not restore old details/focus',
      );
      assert.equal(
        await page.evaluate(() =>
          sessionStorage.getItem('morkborg-combat-tool:v1'),
        ),
        '{"audit":"unchanged"}',
      );
      assert.equal(
        await page.evaluate(() =>
          localStorage.getItem('dungeon-audit-sentinel'),
        ),
        'notebook',
      );
      assert.deepEqual(errors, []);
    } else {
      await page.screenshot({ path: `${output}/${mode}-${width}.png` });
    }

    reports.push({
      width,
      mode,
      metrics,
      searches,
      boundaries,
      trace,
      checks,
      errors,
    });
    console.log(width, mode, 'PASS', metrics);
  } catch (e) {
    reports.push({ width, mode, error: String(e), trace, searches });
    console.error(e);
    console.log(
      await page.locator('body *').evaluateAll((es) =>
        es
          .filter((e) => e.getBoundingClientRect().right > innerWidth + 1)
          .map((e) => ({
            tag: e.tagName,
            c: e.className,
            text: e.textContent?.slice(0, 80),
            width: e.getBoundingClientRect().width,
            details: e.closest('details')?.outerHTML.slice(0, 500),
            css: getComputedStyle(e).display,
          }))
          .slice(-15),
      ),
    );
    await page.screenshot({ path: `${output}/failure-${width}.png` });
    fs.writeFileSync(
      `${output}/failure-dom.txt`,
      await page.locator('body').innerText(),
    );
    process.exitCode = 1;
  }
  await ctx.close();
}
fs.writeFileSync(`${output}/${mode}.json`, JSON.stringify(reports, null, 2));
await browser.close();
