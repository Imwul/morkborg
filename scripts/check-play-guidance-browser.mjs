/** Run against a dev server with the supplied local source bundle. No source text is exported. */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
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
const root = 'outputs/play-guidance';
await mkdir(root, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ['--no-proxy-server'],
});
const reports = [];
try {
  for (const width of (process.env.GUIDANCE_WIDTHS ?? '360,768,1440,3440')
    .split(',')
    .map(Number)) {
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
      hasTouch: width === 360,
      isMobile: width === 360,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(18000);
    const errors = [],
      checks = [];
    const report = { width, checks, errors, screenshots: [] };
    reports.push(report);
    page.on('pageerror', (e) => errors.push(e.message));
    await page.route('**/api/rulebook-data?*', (route) =>
      route.fulfill({ json: { schemaVersion: 1, revision: 1, bundle: data } }),
    );
    const click = (loc) => (width === 360 ? loc.tap() : loc.click());
    const ref = () => page.locator('.reference-page');
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
    const panel = () => page.locator('.play-guidance-panel');
    const openGuide = async () => {
      await click(page.getByRole('button', { name: '판정 안내', exact: true }));
      await panel().waitFor();
    };
    const manual = async (container, label, values) => {
      await container
        .getByRole('textbox', { name: `${label} 직접 굴린 값`, exact: true })
        .fill(values);
      await click(
        container.getByRole('button', { name: '입력값 판정', exact: true }),
      );
    };
    const noOverflow = async () =>
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        ),
        false,
      );
    const shot = async (name) => {
      const path = `${root}/${name}-${width}.png`;
      await page.screenshot({ path });
      report.screenshots.push(path);
    };
    const seed = async (values) =>
      page.evaluate((values) => {
        window.guideDice = values;
        window.guideRngCount ??= 0;
        if (!window.originalGuideRng) {
          window.originalGuideRng = crypto.getRandomValues.bind(crypto);
          crypto.getRandomValues = (array) => {
            window.guideRngCount++;
            if (window.guideDice.length) {
              array[0] = Math.floor(window.guideDice.shift() * 4294967296);
              return array;
            }
            return window.originalGuideRng(array);
          };
        }
      }, values);
    const roll = async (values) => {
      await seed(values);
      const initial = ref().getByRole('button', { name: 'ROLL', exact: true });
      await click(
        (await initial.count())
          ? initial
          : ref().getByRole('button', { name: 'REROLL', exact: true }),
      );
      await ref().locator('.reference-roll-results').waitFor();
    };
    try {
      await page.goto(process.env.REFERENCE_URL ?? 'http://127.0.0.1:5177/');
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
      await openGuide();
      await shot('question');
      await noOverflow();
      assert.equal(
        await panel().evaluate((el) => el.scrollWidth > el.clientWidth + 1),
        false,
      );
      await panel()
        .getByRole('button', { name: '아직 모르는 사실 문이 잠겼는가?' })
        .focus();
      await page.keyboard.press('Enter');
      assert.match(await panel().innerText(), /이미 보거나 정한 사실/);
      await seed([]);
      await click(
        panel().getByRole('button', { name: 'Mythic Fate 굴림창 열기 ↗' }),
      );
      await page.getByRole('dialog', { name: 'Ask Fate.' }).waitFor();
      await panel().waitFor({ state: 'hidden' });
      await page.keyboard.press('Escape');
      await page
        .getByRole('dialog', { name: 'Ask Fate.' })
        .waitFor({ state: 'hidden' });
      if (!(await panel().isVisible())) await openGuide();
      checks.push('Fact guidance opens the existing Mythic Fate tool');
      const rngBefore = await page.evaluate(() => window.guideRngCount);
      await click(panel().getByRole('button', { name: 'SD · Yes or No d4 ↗' }));
      await waitRef('oracle:sd.yesNo');
      assert.equal(await page.evaluate(() => window.guideRngCount), rngBefore);
      checks.push(
        'Keyboard question intent → canonical reader without rolling',
      );
      await openGuide();
      await click(
        panel().getByRole('button', { name: '행동의 성공 문을 부순다' }),
      );
      await panel()
        .getByRole('combobox', { name: '일반 행동의 규칙' })
        .selectOption('sd');
      await click(
        panel().getByRole('button', { name: '이 규칙으로 일반 행동 판정 ↗' }),
      );
      await waitRef('rule:sd.general-move');
      const general = ref().getByRole('region', { name: '일반 행동 판정' });
      await manual(general, '일반 행동', '7,12');
      assert.match(await general.innerText(), /Weak Hit/);
      checks.push(
        'SD general move compares independent d20s, manually entered',
      );
      await openGuide();
      await click(
        panel().getByRole('button', { name: '조건별 규칙', exact: true }),
      );
      await panel()
        .getByRole('combobox', { name: '규칙', exact: true })
        .selectOption('rest');
      await panel()
        .getByRole('combobox', { name: '조건', exact: true })
        .selectOption('blocked');
      assert.match(await panel().innerText(), /HP 회복이 없습니다/);
      assert.equal(await panel().locator('.guided-roll').count(), 0);
      await panel()
        .getByRole('combobox', { name: '규칙', exact: true })
        .selectOption('infection');
      await manual(panel(), '감염된 상태로 하루가 지남', '6');
      assert.match(await panel().locator('output').innerText(), /= 6/);
      await shot('conditions');
      await page.keyboard.press('Escape');
      await panel().waitFor({ state: 'hidden' });
      assert.equal(
        await page
          .getByRole('button', { name: '판정 안내', exact: true })
          .evaluate((el) => el === document.activeElement),
        true,
      );
      await openGuide();
      await page.waitForFunction(
        () =>
          history.state?.morkborgNavigationV1?.channels?.['play-guidance']
            ?.value === true,
      );
      await page.goBack();
      await panel().waitFor({ state: 'hidden' });
      checks.push(
        'Conditional rules, no roll on blocked recovery, Escape focus and browser Back',
      );
      await click(page.getByRole('button', { name: '공간 탐색', exact: true }));
      await click(
        page
          .locator('.spatial-scenes')
          .getByRole('button', { name: /^Journey/ }),
      );
      const actions = page.getByRole('region', {
        name: '상황에서 할 수 있는 행동',
      });
      for (const name of ['이동하기', '길 벗어나기', '채집하기', '야영하기'])
        assert.equal(
          await actions
            .getByRole('button', { name: new RegExp(`^${name}`) })
            .count(),
          1,
        );
      await click(actions.getByRole('button', { name: /^이동하기/ }));
      await waitRef('rule:sd.travel-day');
      await click(ref().getByRole('button', { name: '이동 · 길의 상태 d8 ↗' }));
      await waitRef('oracle:feretory.roadType');
      await roll([0.26]);
      await click(
        ref().getByRole('button', { name: '동물 길 · 망가진 길 판정 ↗' }),
      );
      await waitRef('rule:sd.leaving-road');
      const road = ref().getByRole('region', {
        name: '동물 흔적 · 망가진 길 판정',
      });
      await manual(road, '길 유지', '9');
      await click(
        road.getByRole('button', { name: '길 밖의 사건 d12 열기 ↗' }),
      );
      await waitRef('oracle:feretory.leaveRoad');
      await roll([0]);
      await page.goBack();
      await waitRef('rule:sd.leaving-road');
      assert.match(await road.innerText(), /실패/);
      checks.push(
        'Journey road → conditional navigation failure → off-road, retained on Back',
      );
      await click(actions.getByRole('button', { name: /^채집하기/ }));
      await waitRef('rule:sd.resupply');
      await click(ref().getByRole('button', { name: '하루 채집 d6 열기 ↗' }));
      await waitRef('oracle:feretory.forage');
      await roll([0.2]);
      const food = ref().locator('[data-follow-task="rations"]');
      await click(food.locator('summary'));
      await manual(food, '발견한 식량·물', '6');
      assert.match(await food.locator('output').innerText(), /= 7/);
      const spoil = ref().locator('[data-follow-task="spoil-test"]');
      await click(spoil.locator('summary'));
      await manual(spoil, '상한 식량 알아채기', '12');
      assert.match(await spoil.locator('output').innerText(), /성공/);
      await manual(spoil, '상한 식량 알아채기', '21');
      assert.match(await spoil.locator('[role="alert"]').innerText(), /범위/);
      await spoil
        .getByRole('button', { name: 'd20 굴리기', exact: true })
        .click();
      assert.equal(await spoil.locator('[role="alert"]').count(), 0);
      await shot('foraging');
      await noOverflow();
      await click(
        ref().getByRole('button', { name: '참조 고정', exact: true }),
      );
      await click(
        ref().getByRole('button', { name: '작업대에 펼치기', exact: true }),
      );
      assert.ok(
        await page
          .locator('.inline-reading [data-follow-task="spoil-test"]')
          .count(),
      );
      await click(
        ref().getByRole('button', { name: '사건 해결 후 야영하기 ↗' }),
      );
      await waitRef('rule:sd.camping-move');
      assert.ok(
        await ref()
          .getByRole('button', { name: /야영 2d20|잠깐 휴식 2d20/ })
          .count(),
      );
      await page.goBack();
      await waitRef('oracle:feretory.forage');
      assert.equal(
        await ref()
          .getByRole('button', { name: '고정 해제', exact: true })
          .count(),
        1,
      );
      await click(ref().locator('[data-follow-task="rations"] summary'));
      assert.match(
        await ref().locator('[data-follow-task="rations"] output').innerText(),
        /= 7/,
      );
      checks.push(
        'Forage quantity + detection app/manual, invalid input, camp continuation, Pins/Workbench and retained dice',
      );
      await click(page.getByRole('button', { name: '참조', exact: true }));
      await search('Taverns', 'oracle:aitc.taverns');
      await roll([0.99]);
      const inn = ref().locator('[data-follow-task="rest"]');
      await click(inn.locator('summary'));
      await manual(inn, '여관의 휴식', '8,7');
      assert.match(await inn.locator('output').innerText(), /DR8.*Weak Hit/);
      await shot('inn');
      const inherited = ref().locator('[data-follow-task="as-tavern"]');
      await click(inherited.locator('summary').first());
      await seed([]);
      const beforeLookup = await page.evaluate(() => window.guideRngCount);
      await click(inherited.locator('.fixed-task-excerpt > summary'));
      await ref().locator('[data-follow-task="npcs"]').waitFor();
      assert.equal(
        await page.evaluate(() => window.guideRngCount),
        beforeLookup,
      );
      await click(inherited.locator('.fixed-task-excerpt > summary'));
      assert.match(await inn.locator('output').innerText(), /DR8.*Weak Hit/);
      checks.push(
        'Inn inherits Tavern inline via fixed row 3, no extra roll or overwritten parent',
      );

      await noOverflow();
      await search('Spending a Day Foraging', 'oracle:feretory.forage');
      assert.match(
        await ref().locator('.reference-roll-results').innerText(),
        /Locate d6/,
      );
      await page
        .getByRole('button', { name: '최근', exact: true })
        .first()
        .click();
      assert.ok(
        await page
          .locator('[data-reference-row="oracle:feretory.forage"]')
          .count(),
      );
      checks.push(
        'Inn uses DR8; Search and Recent preserve canonical forage result',
      );
      assert.equal(
        await page.evaluate(() => localStorage.getItem('morkborg-codex:v6')),
        '{"sentinel":"notebook-owned","campaigns":[]}',
      );
      assert.deepEqual(errors, []);
      report.passed = true;
      console.log('PASS', width, checks.join('; '));
    } catch (error) {
      report.failure = String(error);
      await page
        .screenshot({ path: `${root}/failure-${width}.png` })
        .catch(() => {});
      console.error(
        await page
          .locator('body')
          .innerText()
          .catch(() => ''),
      );
      throw error;
    } finally {
      await context.close();
    }
  }
} finally {
  await writeFile(`${root}/acceptance.json`, JSON.stringify(reports, null, 2));
  await browser.close();
}
