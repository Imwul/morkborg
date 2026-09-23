/** Browser acceptance for the live spatial surfaces. Run after npm run dev.
 * PLAYWRIGHT_MODULE and REFERENCE_URL override local runtime/server defaults.
 * Reports contain IDs, counts and geometry only; source prose is not exported.
 */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
const bundled =
  '/Users/imwul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ??
    (existsSync(bundled) ? bundled : 'playwright')
);
const url = process.env.REFERENCE_URL ?? 'http://127.0.0.1:5173/';
const root = 'outputs/spatial-oracle';
await mkdir(root, { recursive: true });
await mkdir('docs/spatial-oracle', { recursive: true });
const widths = (process.env.SPATIAL_WIDTHS ?? '360,768,1440,3440')
  .split(',')
  .map(Number);
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHANNEL
    ? { channel: process.env.PLAYWRIGHT_CHANNEL }
    : {}),
});
const reports = [];
const screenshotsOnly = process.env.SPATIAL_SCREENSHOTS_ONLY === '1';
try {
  for (const width of widths) {
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
      hasTouch: width === 360,
      isMobile: width === 360,
      reducedMotion: 'reduce',
      colorScheme: 'light',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const report = {
      width,
      scenes: [],
      checks: [],
      screenshots: [],
      pageErrors: errors,
    };
    reports.push(report);
    const current = () => page.locator('.reference-page');
    const selected = () => current().getAttribute('data-reference-id');
    const waitReference = async (id) => {
      await page
        .locator(`.reference-page[data-reference-id="${id}"]`)
        .waitFor();
      await page.waitForFunction(
        (id) =>
          history.state?.morkborgNavigationV1?.channels?.reference?.value
            ?.selectedId === id,
        id,
      );
    };
    const settle = () =>
      page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
    const spatial = () => page.locator('.spatial-oracle');
    const enter = async (scene) => {
      if (!(await spatial().count()))
        await page
          .getByRole('button', { name: '공간 탐색', exact: true })
          .click();
      await spatial().waitFor();
      if ((await spatial().getAttribute('data-scene')) !== scene) {
        const title = {
          dungeon: 'Dungeon',
          wilderness: 'Journey',
          city: 'City crawl',
        }[scene];
        await page
          .locator('.spatial-scenes')
          .getByRole('button', { name: new RegExp(`^${title}`) })
          .click();
      }
      await page.locator(`.spatial-oracle[data-scene="${scene}"]`).waitFor();
    };
    const feature = (scene, target) =>
      page.locator(`[data-hotspot-id="${scene}-${target}"]`);
    const inspect = async (scene, target, touch = false) => {
      const hot = feature(scene, target);
      const id = await hot.getAttribute('data-reference-target');
      const hit = hot.locator('.spatial-hit');
      await settle();
      await hit.scrollIntoViewIfNeeded();
      await settle();
      const route = await hit.evaluate(
        (path) => getComputedStyle(path).pointerEvents === 'stroke',
      );
      if (route) {
        const point = await hit.evaluate((path) => {
          const viewport = path
            .closest('.spatial-map-viewport')
            .getBoundingClientRect();
          const candidates = Array.from({ length: 49 }, (_, i) => {
            const point = path.getPointAtLength(
              (path.getTotalLength() * (i + 1)) / 50,
            );
            return new DOMPoint(point.x, point.y).matrixTransform(
              path.getScreenCTM(),
            );
          });
          const found = candidates.find(
            (point) =>
              point.x > viewport.left + 4 &&
              point.x < viewport.right - 4 &&
              point.y > Math.max(0, viewport.top) + 4 &&
              point.y < Math.min(innerHeight, viewport.bottom) - 4 &&
              [
                [0, 0],
                [-4, 0],
                [4, 0],
                [0, -4],
                [0, 4],
              ].every(
                ([dx, dy]) =>
                  document
                    .elementFromPoint(
                      Math.round(point.x) + dx,
                      Math.round(point.y) + dy,
                    )
                    ?.closest('[data-hotspot-id]') === path.parentElement,
              ),
          );
          return found
            ? { x: Math.round(found.x), y: Math.round(found.y) }
            : null;
        });
        assert.ok(
          point,
          `${scene}/${target}: route has a visible hit position`,
        );
        if (touch) await page.touchscreen.tap(point.x, point.y);
        else await page.mouse.click(point.x, point.y);
      } else if (touch) await hit.tap();
      else await hit.click();
      try {
        await waitReference(id);
      } catch (error) {
        console.error(
          JSON.stringify(
            await page.evaluate(() => ({
              events: window.spatialAcceptanceEvents,
              selected:
                document.querySelector('.reference-page')?.dataset.referenceId,
            })),
            null,
            2,
          ),
        );
        throw error;
      }
      assert.equal(await hot.getAttribute('aria-pressed'), 'true');
      return id;
    };
    const backToMap = async () => {
      await page
        .getByRole('button', { name: '← 지도로 돌아가기', exact: true })
        .click();
      await current().waitFor({ state: 'hidden' });
      await settle();
    };
    const shot = async (name) => {
      await page.evaluate(() => window.scrollTo(0, 0));
      const path = `${root}/${name}-${width}.png`;
      await page.screenshot({ path, fullPage: true });
      report.screenshots.push(path);
    };
    const checkOverflow = async (label) => {
      assert.equal(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth,
        ),
        false,
        `${label}: body overflow at ${width}`,
      );
    };
    try {
      await page.goto(url);
      await page.evaluate(() => {
        window.spatialAcceptanceEvents = [];
        for (const type of [
          'pointerdown',
          'pointerup',
          'mousedown',
          'mouseup',
          'click',
          'focusin',
        ])
          document.addEventListener(
            type,
            (event) => {
              window.spatialAcceptanceEvents.push({
                type,
                x: event.clientX,
                y: event.clientY,
                target:
                  event.target.closest('[data-hotspot-id]')?.dataset.hotspotId,
                scroll: document.querySelector('.spatial-map-viewport')
                  ?.scrollLeft,
                pageY: scrollY,
              });
              window.spatialAcceptanceEvents =
                window.spatialAcceptanceEvents.slice(-14);
            },
            true,
          );
      });
      await page
        .getByRole('button', { name: '공간 탐색', exact: true })
        .waitFor();
      await page.locator('.rdesk').waitFor();
      if (screenshotsOnly) {
        for (const [scene, target] of [
          ['dungeon', 'chest'],
          ['wilderness', 'tracks'],
          ['city', 'street'],
        ]) {
          await enter(scene);
          await page.waitForFunction(
            () => !document.querySelector('.spatial-data-notice'),
          );
          await settle();
          await shot(`${scene}-scene`);
          await inspect(scene, target, width === 360);
          const roll = current().getByRole('button', {
            name: 'ROLL',
            exact: true,
          });
          if (await roll.count()) {
            await roll.click();
            await page
              .locator('.reference-page[data-has-reading="true"]')
              .waitFor();
          }
          await shot(`${scene}-reference`);
          await backToMap();
        }
        report.status = 'screenshots-refreshed';
        console.log(
          `${width}: refreshed ${report.screenshots.length} screenshots`,
        );
        continue;
      }
      for (const [scene, targets] of [
        ['dungeon', ['masonry', 'chest', 'door']],
        ['wilderness', ['road', 'tracks', 'weather', 'distances']],
        ['city', ['gate', 'street', 'tavern', 'directions']],
      ]) {
        await enter(scene);
        await page.waitForFunction(
          () => !document.querySelector('.spatial-data-notice'),
        );
        const geometry = await page
          .locator('.spatial-hit')
          .evaluateAll((paths) =>
            paths.map((path) => {
              const box = path.getBoundingClientRect();
              const style = getComputedStyle(path);
              const stroke =
                style.pointerEvents === 'stroke'
                  ? parseFloat(style.strokeWidth)
                  : 0;
              return {
                id: path.parentElement.dataset.hotspotId,
                width: box.width + stroke,
                height: box.height + stroke,
                strokeHitWidth: stroke || undefined,
              };
            }),
          );
        for (const box of geometry) {
          assert.ok(
            box.width >= 44 && box.height >= 44,
            `${width}/${box.id}: ${box.width} × ${box.height}`,
          );
        }
        assert.equal(
          new Set(geometry.map((box) => box.id)).size,
          geometry.length,
        );
        await checkOverflow(scene);
        await shot(`${scene}-scene`);
        const visits = [];
        for (const target of targets) {
          const id = await inspect(scene, target, width === 360);
          if (id.startsWith('oracle:') || id === 'procedure:aitc.street')
            assert.equal(
              await current().getAttribute('data-has-reading'),
              null,
              `${id}: inspection auto-rolled`,
            );
          const formula = await current().getAttribute('data-formula');
          const roll = current().getByRole('button', {
            name: 'ROLL',
            exact: true,
          });
          const rollable = (await roll.count()) > 0;
          if (rollable) {
            await roll.click();
            await page
              .locator('.reference-page[data-has-reading="true"]')
              .waitFor();
            assert.equal(await selected(), id);
            assert.ok(
              (await current()
                .locator('.current-table-result, .reference-generated-reading')
                .count()) > 0,
            );
          } else {
            assert.ok(
              ['door', 'distances', 'directions'].includes(target),
              `Unexpected non-rollable ${id}`,
            );
            assert.equal(
              await current()
                .getByRole('button', { name: 'REROLL', exact: true })
                .count(),
              0,
            );
          }
          const related = await page
            .locator('.spatial-reader .desk-related .reference-row')
            .count();
          visits.push({ target, id, formula, rollable, related });
          if (target === targets[1]) await shot(`${scene}-reference`);
          await checkOverflow(`${scene}/${target}`);
          await backToMap();
          assert.equal(
            await feature(scene, target).evaluate(
              (element) => element === document.activeElement,
            ),
            true,
            'Return restores feature focus',
          );
        }
        const remaining = await page
          .locator('.spatial-hotspot')
          .evaluateAll((elements) =>
            elements.map((element) => element.dataset.hotspotId),
          );
        for (const hotspotId of remaining) {
          const target = hotspotId.slice(scene.length + 1);
          if (targets.includes(target)) continue;
          await inspect(scene, target, width === 360);
          await backToMap();
        }
        report.scenes.push({
          scene,
          geometry,
          visits,
          everyHotspotOpened: remaining.length,
          touch: width === 360,
        });
      }
      // Browser Back/Forward restores inspected architecture, then an object.
      await enter('dungeon');
      const firstId = await inspect('dungeon', 'entrance', width === 360);
      const secondId = await inspect('dungeon', 'furnishing', width === 360);
      await page.goBack();
      await waitReference(firstId);
      assert.equal(
        await feature('dungeon', 'entrance').getAttribute('aria-pressed'),
        'true',
      );
      await page.goForward();
      await waitReference(secondId);
      await backToMap();
      report.checks.push('browser-back-forward-selection');
      // Tab enters a real SVG control. Enter, Space and arrow keys are real key events.
      await feature('dungeon', 'entrance').focus();
      await page.keyboard.press('Tab');
      assert.equal(
        await page.evaluate(() =>
          document.activeElement?.getAttribute('data-hotspot-id'),
        ),
        'dungeon-masonry',
      );
      await page.keyboard.press('Enter');
      await waitReference('oracle:reclvse.architecture');
      await backToMap();
      await page.keyboard.press('ArrowRight');
      const arrowId = await page.evaluate(() =>
        document.activeElement?.getAttribute('data-hotspot-id'),
      );
      assert.ok(arrowId && arrowId !== 'dungeon-masonry');
      const arrowTarget = await page
        .locator(`[data-hotspot-id="${arrowId}"]`)
        .getAttribute('data-reference-target');
      await page.keyboard.press('Space');
      await waitReference(arrowTarget);
      await backToMap();
      await feature('dungeon', 'entrance').focus();
      for (let tab = 0; tab < 10; tab++) await page.keyboard.press('Tab');
      await settle();
      assert.equal(
        await page.evaluate(() =>
          document.activeElement?.getAttribute('data-hotspot-id'),
        ),
        'dungeon-sounds',
      );
      const farFocus = await feature('dungeon', 'sounds')
        .locator('.spatial-hit')
        .evaluate((path) => {
          const hit = path.getBoundingClientRect();
          const viewport = path
            .closest('.spatial-map-viewport')
            .getBoundingClientRect();
          return {
            left: hit.left - viewport.left,
            right: viewport.right - hit.right,
          };
        });
      assert.ok(
        farFocus.left >= -2 && farFocus.right >= -2,
        'Keyboard reveals the far-side feature',
      );
      await page.keyboard.press('Enter');
      await waitReference('oracle:reclvse.sounds');
      await backToMap();
      report.keyboardFarEdge = farFocus;
      report.checks.push('tab-enter-space-arrows-return-focus');
      // One reference is reached spatially, through Recent, Pins, Workbench and Search.
      await enter('wilderness');
      const sharedId = await inspect('wilderness', 'weather', width === 360);
      const spatialFormula = await current().getAttribute('data-formula');
      await current()
        .getByRole('button', { name: '참조 고정', exact: true })
        .click();
      await current()
        .getByRole('button', { name: '작업대에 펼치기', exact: true })
        .click();
      assert.equal(
        await page
          .locator(`.desk-open-page[data-open-reference-id="${sharedId}"]`)
          .count(),
        1,
      );
      const rollText = await current()
        .locator('.current-table-result')
        .allTextContents();
      await page
        .locator('.spatial-reader-tools')
        .getByRole('button', { name: '최근', exact: true })
        .click();
      await page
        .locator(
          `.desk-index-results [data-reference-row="${sharedId}"] .reference-select-action`,
        )
        .click();
      await waitReference(sharedId);
      assert.equal(
        await current().getAttribute('data-formula'),
        spatialFormula,
      );
      assert.deepEqual(
        await current().locator('.current-table-result').allTextContents(),
        rollText,
      );
      assert.equal(
        await current()
          .getByRole('button', { name: '고정 해제', exact: true })
          .count(),
        1,
      );
      assert.equal(
        await current()
          .getByRole('button', { name: '작업대에서 접기', exact: true })
          .count(),
        1,
      );
      await page
        .getByRole('textbox', { name: '참조 검색', exact: true })
        .fill('Weather');
      await page
        .locator(
          `.desk-index-results [data-reference-row="${sharedId}"] .reference-select-action`,
        )
        .click();
      await waitReference(sharedId);
      assert.equal(
        await current().getAttribute('data-formula'),
        spatialFormula,
      );
      assert.deepEqual(
        await current().locator('.current-table-result').allTextContents(),
        rollText,
      );
      await current()
        .getByRole('button', { name: 'REROLL', exact: true })
        .click();
      assert.equal(await selected(), sharedId);
      const persisted = await page.evaluate(() => ({
        preferences: JSON.parse(
          localStorage.getItem('morkborg-reference-desk:v1'),
        ),
        session: JSON.parse(sessionStorage.getItem('morkborg-play-session:v1')),
      }));
      assert.ok(persisted.preferences.pinnedIds.includes(sharedId));
      assert.equal(persisted.preferences.recentIds[0], sharedId);
      assert.ok(persisted.session.tray.includes(sharedId));
      report.checks.push(
        'recent-pins-workbench-search-share-reference-and-results',
      );
      await page.reload();
      await waitReference(sharedId);
      assert.equal(
        await current()
          .getByRole('button', { name: '고정 해제', exact: true })
          .count(),
        1,
      );
      assert.equal(
        await current()
          .getByRole('button', { name: '작업대에서 접기', exact: true })
          .count(),
        1,
      );
      report.checks.push('pins-workbench-reload');
      await enter('city');
      await enter('wilderness');
      await page.goBack();
      await page.locator('.spatial-oracle[data-scene="city"]').waitFor();
      await page.goForward();
      await page.locator('.spatial-oracle[data-scene="wilderness"]').waitFor();
      report.checks.push('scene-back-forward');
      await page
        .getByRole('button', { name: '살펴볼 곳 표시', exact: true })
        .click();
      assert.equal(
        await page.locator('.spatial-map').getAttribute('data-reveal'),
        'true',
      );
      await page.getByRole('button', { name: '확대', exact: true }).click();
      assert.equal(
        await page.locator('.spatial-map-viewport').getAttribute('data-zoom'),
        'true',
      );
      await checkOverflow('zoom');
      const viewport = page.locator('.spatial-map-viewport');
      const beforePan = await viewport.evaluate(
        (element) => element.scrollLeft,
      );
      const canPan = await viewport.evaluate(
        (element) => element.scrollWidth > element.clientWidth,
      );
      await page
        .getByRole('button', { name: '지도 오른쪽으로', exact: true })
        .click();
      await settle();
      const afterRight = await viewport.evaluate(
        (element) => element.scrollLeft,
      );
      await page
        .getByRole('button', { name: '지도 왼쪽으로', exact: true })
        .click();
      await settle();
      const afterLeft = await viewport.evaluate(
        (element) => element.scrollLeft,
      );
      if (canPan) {
        assert.ok(afterRight > beforePan, 'Right pan control advances the map');
        assert.ok(afterLeft < afterRight, 'Left pan control returns the map');
      }
      report.mapPan = { canPan, beforePan, afterRight, afterLeft };
      if (width === 360) {
        await viewport.scrollIntoViewIfNeeded();
        await settle();
        const swipe = await viewport.evaluate((element) => {
          const box = element.getBoundingClientRect();
          return {
            startX: box.right - 45,
            endX: box.left + 45,
            y: Math.max(
              300,
              Math.min(innerHeight - 90, (box.top + box.bottom) / 2),
            ),
            before: element.scrollLeft,
          };
        });
        const client = await context.newCDPSession(page);
        await client.send('Input.dispatchTouchEvent', {
          type: 'touchStart',
          touchPoints: [{ x: swipe.startX, y: swipe.y }],
        });
        for (let step = 1; step <= 8; step++) {
          await client.send('Input.dispatchTouchEvent', {
            type: 'touchMove',
            touchPoints: [
              {
                x: swipe.startX + ((swipe.endX - swipe.startX) * step) / 8,
                y: swipe.y,
              },
            ],
          });
          await settle();
        }
        await client.send('Input.dispatchTouchEvent', {
          type: 'touchEnd',
          touchPoints: [],
        });
        await settle();
        const after = await viewport.evaluate((element) => element.scrollLeft);
        assert.ok(after > swipe.before + 40, 'A real touch swipe pans the map');
        report.touchSwipe = { before: swipe.before, after };
        await client.detach();
      }
      report.checks.push('discoverability-and-zoom');
      assert.ok(
        report.scenes
          .flatMap((scene) => scene.visits)
          .some((visit) => visit.related > 0),
      );
      assert.deepEqual(errors, []);
      report.status = 'passed';
      console.log(
        `${width}: passed ${report.scenes.reduce((sum, scene) => sum + scene.visits.length, 0)} feature visits and ${report.checks.length} integration groups`,
      );
    } catch (error) {
      report.status = 'failed';
      report.failure = error.message;
      await page.screenshot({
        path: `${root}/failure-${width}.png`,
        fullPage: true,
      });
      throw error;
    } finally {
      if (!screenshotsOnly)
        await writeFile(
          'docs/spatial-oracle/browser-acceptance.json',
          JSON.stringify({ url, reports }, null, 2) + '\n',
        );
      await context.close();
    }
  }
  if (screenshotsOnly) {
    const reportPath = 'docs/spatial-oracle/browser-acceptance.json';
    const acceptance = JSON.parse(await readFile(reportPath, 'utf8'));
    acceptance.screenshotRefresh = {
      capturedAt: new Date().toISOString(),
      widths,
      screenshots: reports.flatMap((report) => report.screenshots),
    };
    await writeFile(reportPath, JSON.stringify(acceptance, null, 2) + '\n');
  }
} finally {
  await browser.close();
}
