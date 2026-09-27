import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ||
    '/Users/imwul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
);
const mode = process.env.AUDIT_MODE || 'before',
  output = 'outputs/reference-proximity';
const corpus = JSON.parse(
  fs.readFileSync('scripts/reference-proximity-corpus.json'),
);
const inventory = JSON.parse(fs.readFileSync(`${output}/inventory.json`));
const bundle = JSON.parse(
  fs.readFileSync('outputs/morkborg-private-data.json'),
);
const hash = (v) =>
  createHash('sha256').update(JSON.stringify(v)).digest('hex');
const browser = await chromium.launch({ args: ['--no-proxy-server'] });
const results = [];
const widths = (process.env.WIDTHS || '360,768,1440,3440')
  .split(',')
  .map(Number);
const subset = process.env.FIXTURES?.split(',').map(Number);
for (const width of widths)
  for (const [index, f] of corpus.entries()) {
    if (subset && !subset.includes(index + 1)) continue;
    const meta = inventory.find((e) => e.id === f.id);
    assert(meta?.available, f.id);
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
      isMobile: width === 360,
      hasTouch: width === 360,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const row = {
      fixture: index + 1,
      viewport: { width, height: 1000 },
      id: f.id,
      kind: meta.kind,
      intent: f.intent,
      reason: f.reason,
      clicks: 0,
      taps: 0,
      keyboardActivations: 0,
      wheelInputs: 0,
      extraDisclosures: 0,
      browserBack: 0,
      navigates: false,
      errors,
    };
    const settle = async () => {
      await page.evaluate(
        () =>
          new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(r)),
          ),
      );
    };
    const reader = () => page.locator('.reference-page');
    const activate = async (l, count = false) => {
      await (width === 360 ? l.tap() : l.click());
      if (count) row[width === 360 ? 'taps' : 'clicks']++;
      await settle();
    };
    const open = async (id) => {
      const m = inventory.find((e) => e.id === id);
      assert(m, id);
      const input = page.getByRole('textbox', { name: '참조 검색' });
      await input.fill(m.title);
      await settle();
      const l = page
        .locator(
          `[data-reference-row="${id}"] .reference-select-action:visible`,
        )
        .first();
      for (let i = 0; !(await l.count()) && i < 12; i++) {
        const more = page.locator('.desk-index-results .desk-more:visible');
        if (!(await more.count())) break;
        await more.first().click();
      }
      await activate(l);
      await page
        .locator(`.reference-page[data-reference-id="${id}"]`)
        .waitFor();
      await page.waitForTimeout(140);
      await settle();
    };
    const rng = async (value) =>
      page.evaluate((value) => {
        window.__auditRng = value;
      }, value);
    const getRng = () => page.evaluate(() => window.__auditRngCalls);
    const roll = () =>
      reader()
        .getByRole('button', { name: /^(ROLL|REROLL)$/ })
        .first();
    const scrollMetrics = () => page.evaluate(() => window.__proximityScroll);
    const resetScrollMetrics = () =>
      page.evaluate(() => {
        window.__proximityScroll = { events: 0, distance: 0, last: scrollY };
      });
    const geometry = async (l) =>
      l.evaluate((el) => {
        const b = el.getBoundingClientRect();
        return {
          x: b.x,
          y: b.y,
          width: b.width,
          height: b.height,
          docY: b.y + scrollY,
          visible: !!el.getClientRects().length,
        };
      });
    // Actual wheel input; no scrollIntoView or app-state navigation shortcuts in measured actions.
    const approach = async (l) => {
      for (let n = 0; n < 150; n++) {
        const b = await geometry(l);
        const header = await page.locator('.rdesk-header').boundingBox();
        const top =
          Math.max(0, Math.min(330, header?.y + header?.height || 0)) + 12;
        if (b.y >= top && (b.y + b.height <= 970 || b.height > 850)) return;
        const dy =
          b.y < top
            ? Math.max(-650, b.y - top)
            : Math.min(650, b.y + b.height - 930);
        if (Math.abs(dy) < 2) return;
        const x = Math.min(width - 25, Math.max(25, b.x + b.width / 2));
        await page.mouse.move(x, 800);
        await page.mouse.wheel(0, dy);
        row.wheelInputs++;
        await page.waitForTimeout(35);
        await settle();
        const next = await geometry(l);
        if (Math.abs(next.y - b.y) < 1) return;
      }
    };
    try {
      await page.addInitScript(() => {
        window.__auditRng = 0.2;
        window.__auditRngCalls = 0;
        crypto.getRandomValues = (a) => {
          window.__auditRngCalls++;
          a.fill(Math.floor(window.__auditRng * 4294967296));
          return a;
        };
        window.__proximityScroll = { events: 0, distance: 0, last: 0 };
        addEventListener(
          'scroll',
          () => {
            const s = window.__proximityScroll;
            s.events++;
            s.distance += Math.abs(scrollY - s.last);
            s.last = scrollY;
          },
          { passive: true },
        );
      });
      await page.route('**/api/rulebook-data?*', (r) =>
        r.fulfill({ json: { schemaVersion: 1, revision: 1, bundle } }),
      );
      await page.goto(process.env.REFERENCE_URL || 'http://127.0.0.1:5178');
      await page.getByRole('textbox', { name: '참조 검색' }).waitFor();
      await page.evaluate(() => document.fonts.ready);
      const rngBefore = await getRng();
      await open(f.id);
      assert.equal(await getRng(), rngBefore, 'Reference open RNG');
      if (f.prepareRoll != null) {
        if (f.id === 'procedure:workbench.stock-room')
          await reader()
            .locator('.reference-options select')
            .first()
            .selectOption('sarkash');
        await rng(f.prepareRoll);
        const n = await getRng();
        await activate(roll());
        assert((await getRng()) > n, 'explicit setup roll');
        await open('oracle:core.names');
        await open(f.id); // Open the retained result via real Search.
      }
      let target;
      switch (f.type) {
        case 'roll':
        case 'reroll':
          target = roll();
          break;
        case 'result-link':
          target = reader()
            .locator(
              `.reference-reading [data-relationship-target="${f.target}"]`,
            )
            .first();
          break;
        case 'creature-source':
          target = reader()
            .locator(`[data-dungeon-context-reference="${f.target}"]`)
            .first();
          break;
        case 'related':
          target = page
            .locator(
              `.reference-page [data-relationship-target="${f.target}"], .desk-related [data-reference-row="${f.target}"] .reference-select-action`,
            )
            .first();
          break;
        case 'source-book':
          target = reader()
            .locator(':scope > .source-disclosure .source-reference-links')
            .first()
            .getByRole('button', {
              name: '이 책의 참조 ›',
              exact: true,
              includeHidden: true,
            });
          break;
        case 'row':
          target = reader()
            .locator(
              `[data-reference-row="${f.target}"] .reference-select-action`,
            )
            .first();
          break;
        case 'part':
          target = reader()
            .locator('.reference-procedure-parts > div')
            .nth(f.partIndex)
            .getByRole('button', { name: '표 보기', exact: true });
          break;
        case 'region-tool':
          target = reader()
            .locator('.region-quick-tools button')
            .nth(f.toolIndex);
          break;
        case 'combat':
          target = reader().getByRole('button', {
            name: '전투에 적으로 추가 ↗',
            exact: true,
          });
          break;
        case 'button':
          target = reader().getByRole('button', { name: f.name, exact: true });
          break;
        case 'read-table':
          target = reader()
            .locator('.reference-static-table tbody > tr')
            .first();
          break;
        case 'read-table-last':
          target = reader()
            .locator('.reference-static-table tbody > tr')
            .last();
          break;
        case 'read-full-rule':
          target = reader()
            .locator('.reference-rule-reading .reference-reading-items')
            .first();
          break;
        case 'read-result':
          target = reader().locator('.reference-reading-items').first();
          break;
        default:
          throw Error('Unknown fixture');
      }
      await target.waitFor({ state: 'attached' });
      row.initialScrollY = await page.evaluate(() => scrollY);
      row.initialGeometry = await geometry(target);
      const hidden = await target.evaluate((el) => {
        let p = el.parentElement;
        const result = [];
        while (p) {
          if (p instanceof HTMLDetailsElement && !p.open && !p.hidden)
            result.unshift([...p.parentElement.children].indexOf(p));
          p = p.parentElement;
        }
        return result.length;
      });
      row.initialHiddenDisclosures = hidden;
      await resetScrollMetrics();
      for (let n = 0; n < hidden; n++) {
        const summaries = target.locator(
          'xpath=ancestor::details[not(@open) and not(@hidden)]/summary',
        );
        const summary = summaries.first();
        await approach(summary);
        await activate(summary, true);
        row.extraDisclosures++;
      }
      const b = await geometry(target);
      row.firstActionDistancePx = Math.round(
        Math.max(0, b.docY - row.initialScrollY),
      );
      row.firstActionDistanceVH = row.firstActionDistancePx / 1000;
      row.visibility = hidden
        ? 'V3'
        : b.y >= 0 && b.y + b.height <= 1000
          ? 'V0'
          : Math.max(0, b.y + b.height - 1000) < 1000
            ? 'V1'
            : 'V2';
      row.targetSize = { width: b.width, height: b.height };
      if (f.type === 'part')
        row.labelGapPx = await target.evaluate((el) => {
          const label = el.parentElement.querySelector('span');
          const range = document.createRange();
          range.selectNodeContents(label);
          return Math.max(
            0,
            el.getBoundingClientRect().left -
              range.getBoundingClientRect().right,
          );
        });
      await approach(target);
      await settle();
      row.preActivationGeometry = await geometry(target);
      row.actionScroll = await scrollMetrics();
      row.actionScrollVH = row.actionScroll.distance / 1000;
      row.documentOverflow = await page.evaluate(() =>
        Math.max(0, document.documentElement.scrollWidth - innerWidth),
      );
      row.readingHash = hash(await reader().innerText());
      row.details = await reader()
        .locator('details')
        .evaluateAll((es) =>
          es.map((e) => ({ class: e.className, open: e.open })),
        );
      const beforeRng = await getRng();
      const reading = f.type.startsWith('read-');
      if (!reading) {
        // Focus through a native Tab stop before activation in four predetermined keyboard fixtures.
        const keyboard = width !== 360 && [1, 13, 19, 24].includes(index + 1);
        if (keyboard) {
          await target.focus();
          await page.keyboard.press('Shift+Tab');
          await page.keyboard.press('Tab');
          row.keyboardFocusReachable = await target.evaluate(
            (el) => el === document.activeElement,
          );
          assert(row.keyboardFocusReachable, 'native Tab stop');
          row.focusOutline = await target.evaluate((el) => ({
            style: getComputedStyle(el).outlineStyle,
            width: getComputedStyle(el).outlineWidth,
          }));
        }
        const beforeY = await page.evaluate(() => scrollY);
        if (keyboard) {
          await page.keyboard.press('Enter');
          row.keyboardActivations++;
          await settle();
        } else await activate(target, true);
        if (f.target) {
          await page
            .locator(`.reference-page[data-reference-id="${f.target}"]`)
            .waitFor();
          row.navigates = true;
          assert.equal(await getRng(), beforeRng, 'relationship open RNG');
          await page.goBack();
          row.browserBack++;
          await page
            .locator(`.reference-page[data-reference-id="${f.id}"]`)
            .waitFor();
          await page.waitForTimeout(250);
          await settle();
          row.returnScrollDelta = Math.round(
            Math.abs((await page.evaluate(() => scrollY)) - beforeY),
          );
          row.scrollRestored = row.returnScrollDelta <= 5;
          row.focusRestored = await target.evaluate(
            (el) => el === document.activeElement,
          );
          row.readingRestored =
            hash(await reader().innerText()) === row.readingHash;
          row.detailsRestored =
            JSON.stringify(
              await reader()
                .locator('details')
                .evaluateAll((es) =>
                  es.map((e) => ({ class: e.className, open: e.open })),
                ),
            ) === JSON.stringify(row.details);
        }
        if (f.type === 'roll' || f.type === 'reroll' || f.rolls)
          assert((await getRng()) > beforeRng, 'explicit Roll RNG');
        else assert.equal(await getRng(), beforeRng, 'non-roll RNG');
        if (f.type === 'combat')
          await page.getByRole('dialog', { name: /전투 도구/ }).waitFor();
      } else assert.equal(await getRng(), beforeRng, 'read RNG');
      row.actionRngCalls = (await getRng()) - beforeRng;
      row.totalScroll = await scrollMetrics();
      if ([3, 15, 19, 21, 24, 31].includes(index + 1))
        await page.screenshot({
          path: `${output}/${mode}-${width}-${index + 1}.png`,
        });
      if (mode === 'after') {
        assert.equal(row.documentOverflow, 0, 'document horizontal overflow');
        if (!reading) assert(row.targetSize.height >= 44, '44px action target');
        if (row.navigates) {
          assert(row.focusRestored, 'Back focus origin');
          assert(row.scrollRestored, 'Back reading scroll');
          assert(row.readingRestored, 'Back same reading');
          assert(row.detailsRestored, 'Back disclosure state');
        }
      }
      assert.deepEqual(errors, []);
      row.status = 'passed';
    } catch (e) {
      row.status = 'error';
      row.error = String(e);
      await page.screenshot({
        path: `${output}/error-${mode}-${width}-${index + 1}.png`,
      });
    }
    results.push(row);
    fs.writeFileSync(
      `${output}/${mode}-${width}.json`,
      JSON.stringify(
        results.filter((x) => x.viewport.width === width),
        null,
        2,
      ),
    );
    console.log(
      width,
      index + 1,
      f.id,
      row.status,
      row.visibility,
      row.firstActionDistancePx,
      row.actionScroll?.distance,
      row.focusRestored,
      row.error || '',
    );
    await context.close();
  }
await browser.close();
if (results.some((x) => x.status === 'error')) process.exitCode = 1;
