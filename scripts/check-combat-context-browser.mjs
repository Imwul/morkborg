/** Real UI acceptance; only local private-data transport is substituted. */
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ||
    '/Users/imwul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
);
const data = JSON.parse(
  await readFile('outputs/morkborg-private-data.json', 'utf8'),
);
const output = 'outputs/combat-context';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ['--no-proxy-server'],
});
const reports = [];
try {
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
    page.setDefaultTimeout(16000);
    const errors = [],
      checks = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const panel = page.getByRole('dialog', { name: /전투 도구/ });
    const button = (n) => panel.getByRole('button', { name: n, exact: true });
    const textbox = (r, n) => r.getByRole('textbox', { name: n, exact: true });
    const num = (r, n) => r.getByRole('spinbutton', { name: n, exact: true });
    const choice = (n) => panel.getByRole('combobox', { name: n, exact: true });
    const click = (l) => (width === 360 ? l.tap() : l.click());
    const edit = async (r, n, v) => {
      await num(r, n).fill(String(v));
      await num(r, n).press('Tab');
    };
    const session = () =>
      page.evaluate(() =>
        JSON.parse(sessionStorage.getItem('morkborg-combat-tool:v1')),
      );
    const frame = async () => {
      const s = await session();
      return s.moments[s.cursor].frame;
    };
    const search = async (q, id) => {
      await textbox(page, '참조 검색').fill(q);
      await click(
        page
          .locator(`[data-reference-row="${id}"] .reference-select-action`)
          .first(),
      );
      await page
        .locator(`.reference-page[data-reference-id="${id}"]`)
        .waitFor();
    };
    const pair = async (a, t) => {
      await choice('공격자').selectOption(a);
      await choice('대상').selectOption(t);
    };
    const manual = async (test, damage = '4', armor = '1') => {
      await textbox(panel, '판정 d20').fill(test);
      await textbox(panel, '무기 피해 실물 값').fill(damage);
      await textbox(panel, '방어구 실물 값').fill(armor);
      await click(button('입력값으로 판정 →'));
      await panel.locator('.combat-verdict').waitFor();
    };
    try {
      await page.route('**/api/rulebook-data?*', (route) =>
        route.fulfill({
          json: { schemaVersion: 1, revision: 1, bundle: data },
        }),
      );
      await page.goto(process.env.REFERENCE_URL || 'http://127.0.0.1:5177');
      await page.evaluate(() =>
        localStorage.setItem('campaign-owned-sentinel', 'notebook-untouched'),
      );
      await search('Seth', 'creature:core:58:seth');
      await click(
        page.getByRole('button', { name: '전투에 적으로 추가 ↗', exact: true }),
      );
      await panel.waitFor();
      assert.equal((await frame()).fighters[0].hp, 6);
      assert.equal((await frame()).fighters[0].armor, 'd2');
      assert.equal((await frame()).fighters[0].weapon, 'd4');
      assert.equal((await frame()).fighters[0].strength, null);
      await click(button('↶ 한 작업 되돌리기'));
      assert.equal((await frame()).fighters.length, 0);
      await click(button('다시 적용 ↷'));
      assert.equal((await frame()).fighters.length, 1);
      await page.keyboard.press('Escape');
      await panel.waitFor({ state: 'hidden' });
      await click(
        page.getByRole('button', { name: '전투에 적으로 추가 ↗', exact: true }),
      );
      await panel.waitFor();
      const start = await frame();
      assert.notEqual(start.fighters[0].id, start.fighters[1].id);
      await click(button('+ 아군 추가'));
      const pc = panel.locator('[data-combatant-id][data-side="pc"]');
      const enemy = panel
        .locator('[data-combatant-id][data-side="enemy"]')
        .nth(0);
      const enemy2 = panel
        .locator('[data-combatant-id][data-side="enemy"]')
        .nth(1);
      const pcId = await pc.getAttribute('data-combatant-id'),
        enemyId = await enemy.getAttribute('data-combatant-id');
      for (const f of [pc, enemy, enemy2]) {
        await edit(f, '최대 HP', 30);
        await edit(f, 'HP', 30);
      }
      await edit(pc, 'Omen', 3);
      await edit(pc, 'Agility', 1);
      assert.equal(await choice('대상').inputValue(), '');
      assert.equal(await button('굴려서 판정 →').isDisabled(), true);
      await click(button('실물 값 입력'));
      await click(button('이 순서로 시작'));
      await pair(pcId, enemyId);
      await choice('공격 방식').selectOption('ranged');
      await num(panel, '기본 DR').fill('10');
      assert.equal(await panel.locator('.combat-relevant').count(), 0);
      const repetitions = [];
      for (let i = 0; i < 3; i++) {
        await manual('14');
        assert.equal(
          await panel.locator('.combat-damage strong').innerText(),
          '3',
        );
        await click(button('결과 적용 · HP 반영'));
        await page.waitForFunction(
          () =>
            document.activeElement?.getAttribute('aria-label') === '판정 d20',
        );
        assert.equal(await choice('공격자').inputValue(), pcId);
        assert.equal(await choice('대상').inputValue(), enemyId);
        assert.equal(await choice('공격 방식').inputValue(), 'ranged');
        assert.equal(await num(panel, '기본 DR').inputValue(), '10');
        repetitions.push({
          commandClicks: 2,
          newDiceInputs: 3,
          settingsReentered: 0,
          focus: '판정 d20',
        });
      }
      assert.equal(await num(enemy, 'HP').inputValue(), '21');
      assert.equal(await num(enemy2, 'HP').inputValue(), '30');
      checks.push(
        'Creature snapshot + duplicate + import Undo/Redo; 3 repeated attacks retain settings and focus',
      );
      await pair(enemyId, pcId);
      assert.equal(await num(panel, '기본 DR').inputValue(), '12');
      for (let i = 0; i < 2; i++) {
        await manual('5', '3', '');
        await click(button('결과 적용 · HP 반영'));
      }
      await manual('20', '', '');
      assert.match(
        await panel.locator('.combat-critical').innerText(),
        /CRITICAL/,
      );
      assert.equal(
        await panel.locator('.combat-damage strong').innerText(),
        '0',
      );
      assert.match(
        await panel.locator('.combat-relevant').innerText(),
        /방어 치명타/,
      );
      await manual('1', '3', '');
      assert.match(
        await panel.locator('.combat-critical').innerText(),
        /FUMBLE/,
      );
      assert.equal(
        await panel.locator('.combat-damage strong').innerText(),
        '3',
      );
      assert.match(
        await panel.locator('.combat-relevant').innerText(),
        /방어 실수/,
      );
      await choice('공격자').selectOption(pcId);
      assert.equal(await choice('대상').inputValue(), enemyId);
      assert.equal(await choice('공격 방식').inputValue(), 'ranged');
      assert.equal(await num(panel, '기본 DR').inputValue(), '10');
      checks.push(
        'Enemy repeated AGI defence; per-attacker DR/style/target restoration',
      );
      await manual('20');
      await page.waitForFunction(() => {
        const note = document
            .querySelector('.combat-critical')
            ?.getBoundingClientRect(),
          panel = document
            .querySelector('.combat-panel')
            ?.getBoundingClientRect();
        return (
          note && panel && note.top >= panel.top && note.bottom <= panel.bottom
        );
      });
      assert.match(
        await panel.locator('.combat-critical').innerText(),
        /CRITICAL/,
      );
      assert.equal(
        await panel.locator('.combat-damage strong').innerText(),
        '3',
      );
      await click(
        panel.getByText('피해 직접 수정 · 판정 값 수정', { exact: true }),
      );
      const context = panel.getByRole('complementary', {
        name: '지금 관련된 참조',
      });
      const relevant = context.getByRole('button', { name: /공격 치명타/ });
      await relevant.scrollIntoViewIfNeeded();
      const before = JSON.stringify(await session()),
        scroll = await panel.evaluate((el) => el.scrollTop),
        preview = await panel.locator('.combat-result').innerText();
      await click(relevant);
      await panel.waitFor({ state: 'hidden' });
      await page
        .locator('.reference-page[data-reference-id="rule:core.crit-fumble"]')
        .waitFor();
      assert.equal(JSON.stringify(await session()), before);
      assert.equal(await page.getByRole('dialog').count(), 0);
      await page.goBack();
      await panel.waitFor();
      await page.waitForFunction(
        () =>
          document.activeElement?.getAttribute('data-combat-return') ===
          'rule:core.crit-fumble',
      );
      assert.equal(await panel.locator('.combat-result').innerText(), preview);
      assert.equal(
        await panel
          .locator('.combat-result details')
          .first()
          .evaluate((el) => el.open),
        true,
      );
      assert.ok(
        Math.abs((await panel.evaluate((el) => el.scrollTop)) - scroll) < 5,
      );
      await click(
        panel
          .getByRole('complementary', { name: '지금 관련된 참조' })
          .getByRole('button', { name: /공격 치명타/ }),
      );
      await panel.waitFor({ state: 'hidden' });
      await click(page.getByRole('button', { name: '전투', exact: true }));
      await panel.waitFor();
      await page.waitForFunction(
        () =>
          document.activeElement?.getAttribute('data-combat-return') ===
          'rule:core.crit-fumble',
      );
      assert.equal(JSON.stringify(await session()), before);
      assert.equal(await page.getByRole('dialog').count(), 1);
      checks.push(
        'Critical ref through Back and launcher retains phase, preview, session, disclosure, focus and scroll',
      );
      await panel
        .locator('.combat-result')
        .evaluate((el) => el.scrollIntoView({ block: 'start' }));
      await page.screenshot({ path: `${output}/critical-${width}.png` });
      await click(button('결과 적용 · HP 반영'));
      await manual('1', '', '');
      assert.match(
        await panel.locator('.combat-critical').innerText(),
        /FUMBLE/,
      );
      assert.equal(
        (await frame()).fighters.find((f) => f.id === pcId).weapon,
        'd6',
      );
      await click(button('결과 적용 · HP 반영'));
      // A pending result cannot survive a change to the same fighter's equipment.
      await manual('14');
      await textbox(pc, '무기 피해').fill('d8');
      await textbox(pc, '무기 피해').press('Tab');
      assert.equal(await button('결과 적용 · HP 반영').isDisabled(), true);
      await manual('14');
      await click(button('결과 적용 · HP 반영'));
      await textbox(panel, '사기 2d6').fill('6,6');
      await num(panel, '실패한 사기 d6').fill('5');
      await choice('사기 대상').selectOption(enemyId);
      await click(button('사기 판정·적용'));
      assert.equal(await choice('대상').inputValue(), '');
      assert.equal(await button('입력값으로 판정 →').isDisabled(), true);
      assert.equal(
        await enemy
          .getByRole('checkbox', { name: '참여', exact: true })
          .isChecked(),
        false,
      );
      assert.match(await textbox(enemy, '상태 메모').inputValue(), /항복/);
      await click(button('↶ 한 작업 되돌리기'));
      assert.equal(await choice('대상').inputValue(), enemyId);
      await click(button('다시 적용 ↷'));
      assert.equal(await choice('대상').inputValue(), '');
      await click(button('↶ 한 작업 되돌리기'));
      checks.push(
        'Fumble remains advisory, gear invalidates preview, voluntary Morale + Undo/Redo never picks another target',
      );
      await edit(pc, 'HP', 0);
      await click(
        panel
          .getByRole('complementary', { name: '지금 관련된 참조' })
          .getByRole('button', { name: /Broken/ }),
      );
      await panel.waitFor({ state: 'hidden' });
      await page
        .locator('.reference-page[data-reference-id="rule:core.broken"]')
        .waitFor();
      await page.goBack();
      await panel.waitFor();
      await edit(pc, 'HP', 20);
      await edit(enemy, 'HP', 0);
      assert.ok(
        await panel
          .getByRole('complementary', { name: '지금 관련된 참조' })
          .getByRole('button', { name: /시체 수색/ })
          .count(),
      );
      checks.push(
        'HP zero opens canonical Broken; corpse suggestion requires the imported creature edge',
      );
      const bounds = await panel.evaluate((el) => {
        const r = el.getBoundingClientRect();
        return {
          top: r.top,
          bottom: r.bottom,
          viewport: innerHeight,
          overflow: el.scrollWidth > el.clientWidth + 1,
          pageOverflow: document.documentElement.scrollWidth > innerWidth + 1,
        };
      });
      assert.equal(bounds.overflow, false);
      assert.equal(bounds.pageOverflow, false);
      assert.ok(bounds.top >= 0 && bounds.bottom <= bounds.viewport + 1);
      const selectors = await panel
        .locator('.combat-action > .combat-pair select')
        .evaluateAll((es) =>
          es.map((e) => ({
            w: e.getBoundingClientRect().width,
            h: e.getBoundingClientRect().height,
          })),
        );
      assert.ok(selectors.every((t) => t.h >= 44 && t.w >= 44));
      const targets = await panel
        .locator('.combat-relevant button')
        .evaluateAll((es) =>
          es.map((e) => {
            const r = e.getBoundingClientRect();
            return { w: r.width, h: r.height };
          }),
        );
      assert.ok(targets.every((t) => t.h >= 44 && t.w >= 44));
      await panel.locator('.combat-relevant').scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${output}/context-${width}.png` });
      await page.keyboard.press('Escape');
      await panel.waitFor({ state: 'hidden' });
      assert.equal(
        await page
          .getByRole('button', { name: '전투', exact: true })
          .evaluate((el) => el === document.activeElement),
        true,
      );
      assert.equal(
        await page.evaluate(() =>
          localStorage.getItem('campaign-owned-sentinel'),
        ),
        'notebook-untouched',
      );
      await search('Belze', 'creature:core:60:belze');
      await click(
        page.getByRole('button', { name: '전투에 적으로 추가 ↗', exact: true }),
      );
      await panel.waitFor();
      const added = panel
        .locator('[data-combatant-id][data-side="enemy"]')
        .last();
      assert.equal(await textbox(added, '무기 피해').inputValue(), '');
      await click(added.getByText('원문 능력치 · 공격 선택', { exact: true }));
      await added
        .getByRole('combobox', { name: '원문 공격 선택' })
        .selectOption('2');
      assert.equal(await textbox(added, '무기 피해').inputValue(), 'd2');
      await page.keyboard.press('Escape');
      await panel.waitFor({ state: 'hidden' });
      checks.push(
        'Multiple source attacks require an explicit selection; no inferred combined damage',
      );
      assert.deepEqual(errors, []);
      reports.push({
        width,
        passed: true,
        checks,
        repetitions,
        bounds,
        targets,
        selectors,
        errors,
      });
      console.log('PASS', width, checks.join('; '));
    } catch (e) {
      await page
        .screenshot({ path: `${output}/failure-${width}.png` })
        .catch(() => {});
      throw e;
    } finally {
      await ctx.close();
    }
  }
} finally {
  await writeFile(
    `${output}/acceptance.json`,
    JSON.stringify(reports, null, 2),
  );
  await browser.close();
}
