import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
const bundled =
  '/Users/imwul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ??
    (existsSync(bundled) ? bundled : 'playwright')
);
const data = JSON.parse(
  readFileSync('outputs/morkborg-private-data.json', 'utf8'),
);
const root = 'outputs/actionable-results';
await mkdir(root, { recursive: true });
const reports = [];
const browser = await chromium.launch({ headless: true });
try {
  for (const width of (process.env.ACTIONABLE_WIDTHS ?? '360,768,1440,3440')
    .split(',')
    .map(Number)) {
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
      hasTouch: width === 360,
      isMobile: width === 360,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    // Serve the supplied, unchanged source bundle through the production contract.
    // Only transport is stubbed; readers, registry, navigation and dice run normally.
    await page.route('**/api/rulebook-data?*', (route) =>
      route.fulfill({
        json: { schemaVersion: 1, revision: 1, bundle: data },
      }),
    );
    page.setDefaultTimeout(15000);
    const report = { width, checks: [], screenshots: [], errors: [] };
    reports.push(report);
    page.on('pageerror', (e) => report.errors.push(e.message));
    const check = (s) => report.checks.push(s);
    const click = (loc) => (width === 360 ? loc.tap() : loc.click());
    const ref = () => page.locator('.reference-page');
    const result = () => ref().locator('.reference-reading').first();
    const resultLinks = () =>
      ref().locator('.reference-follow-up .result-references');
    const follow = (id) =>
      resultLinks().locator(`[data-relationship-target="${id}"]`);
    const waitRef = async (id) => {
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
    const search = async (q, id) => {
      await page
        .getByRole('textbox', { name: '참조 검색', exact: true })
        .fill(q);
      await click(
        page
          .locator(`[data-reference-row="${id}"] .reference-select-action`)
          .first(),
      );
      await waitRef(id);
    };
    const rngCount = () => page.evaluate(() => window.actionableRngCount ?? 0);
    const dice = (values) =>
      page.evaluate((values) => {
        window.actionableDice = values;
        window.actionableRngCount ??= 0;
        if (!window.actionableRng) {
          window.actionableRng = crypto.getRandomValues.bind(crypto);
          crypto.getRandomValues = (array) => {
            window.actionableRngCount++;
            if (window.actionableDice.length) {
              array[0] = Math.floor(window.actionableDice.shift() * 4294967296);
              return array;
            }
            return window.actionableRng(array);
          };
        }
      }, values);
    const roll = async (values) => {
      await dice(values);
      await click(ref().getByRole('button', { name: /^(?:RE)?ROLL$/ }));
      await result().waitFor();
    };
    const openFollow = async (id) => {
      const before = await rngCount();
      await click(follow(id));
      await waitRef(id);
      assert.equal(await rngCount(), before, 'opening must not roll');
    };
    const shot = async (name) => {
      const file = `${root}/${name}-${width}.png`;
      await page.screenshot({ path: file });
      report.screenshots.push(file);
    };
    const noOverflow = async () =>
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        'document overflow',
      );
    try {
      await page.goto(process.env.REFERENCE_URL ?? 'http://127.0.0.1:5173/');
      await page.evaluate(async (data) => {
        await new Promise((resolve, reject) => {
          const req = indexedDB.open('morkborg-private-data', 1);
          req.onupgradeneeded = () => req.result.createObjectStore('packs');
          req.onsuccess = () => {
            const db = req.result,
              tx = db.transaction('packs', 'readwrite');
            for (const key of ['library', 'oracles'])
              tx.objectStore('packs').put(data[key], key);
            tx.oncomplete = () => {
              db.close();
              resolve();
            };
            tx.onerror = reject;
          };
          req.onerror = reject;
        });
        localStorage.setItem(
          'morkborg-codex:v6',
          '{"sentinel":"notebook-owned","campaigns":[]}',
        );
      }, data);
      await page.reload();
      await click(
        page
          .getByRole('navigation', { name: '주요 페이지' })
          .getByRole('button', { name: '생성기', exact: true }),
      );
      const characterId = 'procedure:character.core-classless';
      await click(
        page.locator(`.desk-generators [data-shortcut="${characterId}"]`),
      );
      await waitRef(characterId);
      await dice([]);
      await page.keyboard.press('r');
      await result().waitFor();
      const firstRollDice = await rngCount();
      assert.ok(firstRollDice > 0, 'R rolls the visible character generator');
      await click(ref().locator('summary[aria-label="참조 편의 동작"]'));
      await click(
        ref().getByRole('button', { name: '스크랩 열기', exact: true }),
      );
      const scratch = page.getByRole('dialog');
      await scratch.getByRole('button', { name: '닫기', exact: true }).focus();
      await page.keyboard.press('r');
      assert.equal(
        await rngCount(),
        firstRollDice,
        'R leaves the reader alone in Scratch',
      );
      await page.keyboard.press('Escape');
      await scratch.waitFor({ state: 'hidden' });
      await page.keyboard.press('r');
      const afterScratchDice = await rngCount();
      assert.ok(
        afterScratchDice > firstRollDice,
        'R rolls again after Scratch closes',
      );

      await click(page.getByRole('button', { name: '보관함', exact: true }));
      const shelf = page.getByRole('dialog', { name: '보관함', exact: true });
      const closeShelf = shelf.getByRole('button', {
        name: '보관함 닫기',
        exact: true,
      });
      await closeShelf.focus();
      await page.keyboard.press('r');
      assert.equal(
        await rngCount(),
        afterScratchDice,
        'R leaves the reader alone while the shelf has focus',
      );
      await ref().locator('#current-reference-title').focus();
      await page.keyboard.press('r');
      const characterDice = await rngCount();
      assert.ok(
        characterDice > afterScratchDice,
        'R rolls the focused reader while the shelf is open',
      );
      await click(closeShelf);
      await shelf.waitFor({ state: 'hidden' });
      check('R respects focus in Scratch and the docked object shelf');

      await click(page.locator('.generator-return button'));
      await page.getByRole('region', { name: '생성기 모음' }).waitFor();
      await page.keyboard.press('r');
      assert.equal(
        await rngCount(),
        characterDice,
        'R leaves the hidden generator alone',
      );
      const input = page.getByRole('textbox', {
        name: '참조 검색',
        exact: true,
      });
      await input.fill('Weather');
      await page
        .getByRole('region', { name: '검색 결과', exact: true })
        .waitFor();
      await input.blur();
      await page.keyboard.press('r');
      assert.equal(
        await rngCount(),
        characterDice,
        'R leaves the retained roll alone during search',
      );
      check(
        'R rolls the visible reader and preserves hidden results in the generator list and search',
      );

      await search('Events by the road', 'oracle:feretory.roadEvent');
      assert.equal(await result().count(), 0);
      check('unrolled reference has no result follow-ups');
      await roll([0.21]);
      assert.equal(
        await follow('oracle:core.weather').getAttribute('data-result-purpose'),
        'REQUIRED',
      );
      const origin = await result().innerText();
      await openFollow('oracle:core.weather');
      assert.equal(await result().count(), 0);
      await roll([0]);
      assert.equal(await resultLinks().count(), 0);
      await page.goBack();
      await waitRef('oracle:feretory.roadEvent');
      assert.equal(await result().innerText(), origin);
      check(
        'weather instruction opens in 1 click without roll; Back restores origin result',
      );
      await roll([0.999]);
      await shot('travel-result');
      await noOverflow();
      if (width === 360) {
        const b = await follow('oracle:core.corpsePlundering').boundingBox();
        assert.ok(
          b.y + b.height < 950,
          `mobile first action below viewport: ${JSON.stringify(b)}`,
        );
      }
      await click(
        ref().getByRole('button', { name: 'PIN · 참조 고정', exact: true }),
      );
      await click(
        ref().getByRole('button', { name: '작업대에 펼치기', exact: true }),
      );
      const held = page.locator(
        '[data-open-reference-id="oracle:feretory.roadEvent"]',
      );
      await held.waitFor();
      const heldText = await held.locator('.inline-reading').innerText();
      const heldAction = held
        .locator('[data-relationship-target="oracle:core.corpsePlundering"]')
        .first();
      assert.equal(
        await heldAction.getAttribute('data-result-purpose'),
        'REQUIRED',
      );
      const before = await rngCount();
      await click(heldAction);
      await waitRef('oracle:core.corpsePlundering');
      assert.equal(await rngCount(), before);
      await roll([0, 0]);
      assert.equal(
        await resultLinks().locator('[data-result-purpose="REQUIRED"]').count(),
        0,
      );
      assert.equal(await held.locator('.inline-reading').innerText(), heldText);
      check(
        'Workbench exposes same row link, preserves parent and opens in 1 click',
      );
      const prefs = await page.evaluate(() =>
        JSON.parse(localStorage.getItem('morkborg-reference-desk:v1')),
      );
      assert.ok(prefs.pinnedIds.includes('oracle:feretory.roadEvent'));
      assert.ok(prefs.recentIds.includes('oracle:core.corpsePlundering'));
      assert.ok(prefs.recentIds.includes('oracle:feretory.roadEvent'));
      await page.goBack();
      await waitRef('oracle:feretory.roadEvent');
      assert.match(await result().innerText(), /Two roadside corpses/);
      // Close the held page using its existing control; no new navigation UI.
      await click(held.getByRole('button', { name: /페이지 접기/ }));
      check(
        'Pins and Recent are compatible; original reading survives child roll and Back',
      );

      await search('Room Contents', 'oracle:sd.room.contents');
      await roll([0.45]);
      assert.equal(
        await follow('rule:sd.stockCommon').getAttribute('data-result-purpose'),
        'REQUIRED',
      );
      await openFollow('rule:sd.stockCommon');
      await page.goBack();
      await waitRef('oracle:sd.room.contents');
      assert.match(await result().innerText(), /Common encounter/);
      check('Dungeon common encounter opens its exact procedure in 1 click');
      await roll([0.99]);
      assert.equal(await resultLinks().count(), 0);
      check('reroll replaces row-specific actions; empty room has none');
      await search('Reveal a Danger', 'oracle:depths.danger');
      await roll([0.99]);
      assert.match(await follow('oracle:core.reaction').innerText(), /−2/);
      assert.equal(
        await follow('rule:sd.npc').getAttribute('data-result-purpose'),
        'AVAILABLE',
      );
      await shot('danger-result');
      await openFollow('oracle:core.reaction');
      check(
        'Danger NPC result distinguishes required Reaction −2 and optional NPC detail',
      );
      // Use the unmodified Core oracle here to test row-dependent reading access.
      await roll([0, 0]);
      assert.equal(
        await follow('rule:core.violence').getAttribute('data-result-purpose'),
        'AVAILABLE',
      );
      const reaction = await result().innerText();
      const combatLink = follow('rule:core.violence');
      await combatLink.focus();
      assert.equal(
        await combatLink.evaluate((el) => el === document.activeElement),
        true,
      );
      const noDice = await rngCount();
      await page.keyboard.press('Enter');
      await waitRef('rule:core.violence');
      assert.equal(await rngCount(), noDice);
      assert.match(await follow('rule:core.broken').innerText(), /0 HP/);
      assert.match(await follow('rule:core.reaction-morale').innerText(), /⅓/);
      await shot('combat-conditions');
      await openFollow('rule:core.reaction-morale');
      assert.match(
        await follow('oracle:core.failedMorale').innerText(),
        /클 때만/,
      );
      await page.goBack();
      await waitRef('rule:core.violence');
      await openFollow('rule:core.crit-fumble');
      await page.goBack();
      await waitRef('rule:core.violence');
      await openFollow('rule:core.broken');
      await openFollow('oracle:core.broken');
      await roll([0.3]);
      assert.equal(
        await follow('oracle:core.brokenInjury').getAttribute(
          'data-result-purpose',
        ),
        'REQUIRED',
      );
      await openFollow('oracle:core.brokenInjury');
      check(
        'Keyboard activation; combat Morale / crit-fumble / Broken and injury use source conditions without tracking HP',
      );
      // Use existing Recent to recover the exact Reaction reading after several references.
      await click(
        page
          .getByRole('navigation', { name: '주요 페이지' })
          .getByRole('button', { name: /공간 탐색/ }),
      );
      await click(
        page
          .getByRole('navigation', { name: '장면 참조 도구' })
          .getByRole('button', { name: '최근', exact: true }),
      );
      if (
        !(await page
          .locator('[data-reference-row="oracle:core.reaction"]')
          .count())
      ) {
        await click(
          page.getByRole('button', { name: '참조 더 보기', exact: true }),
        );
      }
      await click(
        page
          .locator(
            '[data-reference-row="oracle:core.reaction"] .reference-select-action',
          )
          .first(),
      );
      await waitRef('oracle:core.reaction');
      assert.equal(await result().innerText(), reaction);
      await roll([0.5, 0.5]);
      assert.equal(
        await resultLinks()
          .locator('[data-relationship-target="rule:core.violence"]')
          .count(),
        0,
      );
      check(
        'Reaction result survives multi-reference navigation; neutral reroll removes combat suggestion',
      );
      await search('Zukuma', 'creature:core:59:zukuma');
      assert.match(
        await follow('oracle:core.reaction').innerText(),
        /불분명할 때만/,
      );
      assert.equal(
        await follow('oracle:core.reaction').getAttribute(
          'data-result-purpose',
        ),
        'AVAILABLE',
      );
      await openFollow('oracle:core.reaction');
      check(
        'Creature → Reaction is optional and opens without rerolling the cached outcome',
      );

      await search('Stash', 'oracle:aitc.stash-weak');
      await roll([0.7]);
      const stashLinks = resultLinks().locator('[data-relationship-target]');
      assert.equal(await stashLinks.count(), 1);
      const npcId = await stashLinks.getAttribute('data-relationship-target');
      await openFollow(npcId);
      await page.goBack();
      await waitRef('oracle:aitc.stash-weak');
      check('Stash result uses its explicit paired NPC reference once');
      await search('Civic Buildings', 'oracle:aitc.civic-buildings');
      await roll([0.2]);
      const lookup = follow('oracle:aitc.npc-encounters');
      assert.match(await lookup.innerText(), /#54/);
      await openFollow('oracle:aitc.npc-encounters');
      assert.match(await result().innerText(), /#54/);
      await page.goBack();
      await waitRef('oracle:aitc.civic-buildings');
      check(
        'Fixed LOOKUP opens exact #54 with no random selection and returns to origin',
      );
      await noOverflow();
      assert.equal(
        await page.evaluate(() => localStorage.getItem('morkborg-codex:v6')),
        '{"sentinel":"notebook-owned","campaigns":[]}',
      );
      assert.deepEqual(report.errors, []);
      check('No browser errors, horizontal overflow or campaign writes');
    } catch (error) {
      report.failure = error.stack;
      report.recent = await page.evaluate(() =>
        localStorage.getItem('morkborg-reference-desk:v1'),
      );
      report.visibleRows = await page
        .locator('[data-reference-row]')
        .evaluateAll((elements) =>
          elements.map((el) => el.getAttribute('data-reference-row')),
        );
      await shot('failure');
      throw error;
    } finally {
      await context.close();
    }
  }
} finally {
  await writeFile(
    `${root}/browser-acceptance.json`,
    JSON.stringify(reports, null, 2),
  );
  await browser.close();
}
console.log(
  JSON.stringify(
    reports.map((r) => ({
      width: r.width,
      checks: r.checks.length,
      errors: r.errors,
    })),
    null,
    2,
  ),
);
