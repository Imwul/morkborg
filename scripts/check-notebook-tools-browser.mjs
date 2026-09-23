/** Notebook-first tools acceptance. Screenshots/results stay in ignored outputs. */
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
const bundled =
  '/Users/imwul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ??
    (existsSync(bundled) ? bundled : 'playwright')
);
const browser = await chromium.launch({ headless: true });
const root = 'outputs/notebook-tools';
await mkdir(root, { recursive: true });
const reports = [];
try {
  for (const width of (process.env.NOTEBOOK_WIDTHS ?? '360,768,1440,3440')
    .split(',')
    .map(Number)) {
    const context = await browser.newContext({
      viewport: { width, height: 1000 },
      isMobile: width === 360,
      hasTouch: width === 360,
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const report = { width, checks: [], screenshots: [], errors };
    reports.push(report);
    const click = async (loc) => {
      if (width === 360) await loc.tap();
      else await loc.click();
    };
    const check = (label) => report.checks.push(label);
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
    const ref = () => page.locator('.reference-page');
    const shot = async (name) => {
      const path = `${root}/${name}-${width}.png`;
      await page.screenshot({ path });
      report.screenshots.push(path);
    };
    const shelf = () => page.locator('.object-shelf-panel');
    const mythic = () => page.locator('#mythic-panel');
    const openShelf = async () => {
      await click(page.getByRole('button', { name: '보관함', exact: true }));
      await shelf().waitFor();
    };
    const closeShelf = async () => {
      await click(shelf().getByRole('button', { name: '닫기', exact: true }));
      await shelf().waitFor({ state: 'hidden' });
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
    const forceDice = async (values) => {
      await page.evaluate((values) => {
        window.toolDice = values;
        window.toolOriginalRng ??= crypto.getRandomValues.bind(crypto);
        crypto.getRandomValues = (array) => {
          if (window.toolDice.length) {
            array[0] = Math.floor(window.toolDice.shift() * 4294967296);
            return array;
          }
          return window.toolOriginalRng(array);
        };
      }, values);
    };
    const noOverflow = async () =>
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        `overflow at ${width}`,
      );
    try {
      await page.goto(process.env.REFERENCE_URL ?? 'http://127.0.0.1:5173/');
      await page.getByRole('button', { name: '보관함', exact: true }).waitFor();
      await page.evaluate(() =>
        localStorage.setItem(
          'morkborg-codex:v6',
          '{"schemaVersion":6,"campaigns":[],"activeCampaignId":null,"view":"campaigns"}',
        ),
      );
      const ids = [
        ['캐릭터', 'character', 'procedure:character.core-classless'],
        ['NPC', 'npc', 'procedure:workbench.npc'],
        ['던전', 'dungeon', 'procedure:sd.dungeon-preparation'],
        ['도시', 'city', 'procedure:aitc.settlement'],
      ];
      for (const [label, kind, id] of ids) {
        await openShelf();
        await click(
          shelf()
            .getByRole('navigation', { name: '보관 종류' })
            .getByRole('button', { name: new RegExp('^' + label + ' ') }),
        );
        await click(
          shelf().getByRole('button', { name: `새 ${label} 생성기 열기 ↗` }),
        );
        await waitRef(id);
        assert.equal(
          await ref()
            .getByRole('button', { name: `${label} 보관`, exact: true })
            .count(),
          0,
          'no ungenerated save',
        );
        await click(ref().getByRole('button', { name: 'ROLL', exact: true }));
        await click(
          ref().getByRole('button', { name: `${label} 보관`, exact: true }),
        );
        assert.equal(
          await page.evaluate(
            (kind) =>
              JSON.parse(
                localStorage.getItem('morkborg-object-shelf:v1'),
              ).objects.filter((o) => o.kind === kind).length,
            kind,
          ),
          1,
        );
      }
      await noOverflow();
      check('four canonical generators save only after a result exists');
      await openShelf();
      await click(shelf().locator('.saved-object-row'));
      const before = await shelf()
        .locator('.saved-object-text')
        .first()
        .innerText();
      assert.ok(before.length > 30);
      await click(
        shelf().getByRole('button', { name: '이름·내용 수정', exact: true }),
      );
      await shelf()
        .getByRole('textbox', { name: '보관 이름' })
        .fill('검증용 성곽 도시');
      await shelf()
        .getByRole('textbox', { name: '보관 내용' })
        .fill('노트 옆에서 다시 펼칠 도시 설명');
      await click(
        shelf().getByRole('button', { name: '수정 저장', exact: true }),
      );
      assert.equal(
        await shelf().locator('.saved-object-text').first().innerText(),
        '노트 옆에서 다시 펼칠 도시 설명',
      );
      await click(shelf().getByRole('button', { name: '삭제', exact: true }));
      await click(
        shelf().getByRole('button', { name: '삭제 취소', exact: true }),
      );
      await shot('shelf');
      await noOverflow();
      const dl = page.waitForEvent('download');
      await click(shelf().getByRole('button', { name: '보관함 내보내기' }));
      await (await dl).saveAs(`${root}/objects-${width}.json`);
      await closeShelf();
      await page.reload();
      await openShelf();
      await click(
        shelf()
          .getByRole('navigation', { name: '보관 종류' })
          .getByRole('button', { name: /^도시 / }),
      );
      await click(shelf().locator('.saved-object-row'));
      assert.equal(await shelf().locator('h3').innerText(), '검증용 성곽 도시');
      assert.equal(
        await page.evaluate(() =>
          JSON.parse(localStorage.getItem('morkborg-object-shelf:v1'))
            .objects.find((o) => o.kind === 'city')
            .originalText.includes('노트 옆에서'),
        ),
        false,
      );
      const savedRaw = await page.evaluate(() =>
        localStorage.getItem('morkborg-object-shelf:v1'),
      );
      await shelf()
        .getByLabel('보관함 파일')
        .setInputFiles({
          name: 'bad.json',
          mimeType: 'application/json',
          buffer: Buffer.from('{"version":1,"objects":[{}]}'),
        });
      await shelf().getByRole('alert').waitFor();
      assert.equal(
        await page.evaluate(() =>
          localStorage.getItem('morkborg-object-shelf:v1'),
        ),
        savedRaw,
      );
      await closeShelf();
      check(
        'reload/edit/original preservation/delete undo/export/invalid import',
      );
      // Spatial actions, source-backed summaries and back navigation.
      await click(page.getByRole('button', { name: '공간 탐색', exact: true }));
      await click(
        page
          .locator('.spatial-scenes')
          .getByRole('button', { name: /^Dungeon/ }),
      );
      await click(
        page
          .locator('.scene-play-actions')
          .getByRole('button', { name: /다음 방으로/ }),
      );
      await waitRef('rule:sd.dungeonCrawling');
      assert.equal(
        await ref().locator('.reference-rule-reading').getAttribute('open'),
        null,
      );
      await forceDice([0.99, 0]);
      await click(
        ref().getByRole('button', { name: '던전 탐색 굴리기', exact: true }),
      );
      const crawlText = await ref()
        .locator('.reference-recipe output')
        .innerText();
      assert.match(crawlText, /Weak/);
      await click(
        ref().getByRole('button', { name: '일반 방 묘사 열기 ↗', exact: true }),
      );
      await waitRef('procedure:sd.room-description');
      assert.equal(await ref().getAttribute('data-has-reading'), null);
      await page.goBack();
      await waitRef('rule:sd.dungeonCrawling');
      assert.equal(
        await ref().locator('.reference-recipe output').innerText(),
        crawlText,
      );
      await forceDice([0, 0]);
      await click(
        ref().getByRole('button', { name: '던전 탐색 굴리기', exact: true }),
      );
      assert.match(
        await ref().locator('.crawl-follow-through').innerText(),
        /위험부터 해결/,
      );
      await forceDice([0.99, 0.99]);
      await click(
        ref().getByRole('button', { name: '던전 탐색 굴리기', exact: true }),
      );
      await click(
        ref().getByRole('button', { name: '준비한 던전 보관함 열기 ↗' }),
      );
      assert.equal(
        await shelf()
          .getByRole('button', { name: /^던전 / })
          .getAttribute('aria-pressed'),
        'true',
      );
      await closeShelf();
      await click(
        page
          .locator('.scene-play-actions')
          .getByRole('button', { name: /물건 찾기/ }),
      );
      await waitRef('rule:sd.search-move');
      assert.deepEqual(
        await ref()
          .locator('.dungeon-action-moves select option')
          .allTextContents(),
        ['탐색'],
      );
      await forceDice([0.99, 0, 0.5]);
      await click(ref().getByRole('button', { name: /탐색 2d20/ }));
      await ref().locator('.dungeon-weak-hit-suggestion').waitFor();
      await click(
        ref().getByRole('button', { name: /Sölitary Depths · Weak Hit/ }),
      );
      await waitRef('oracle:depths.weakHitConsequences');
      await page.goBack();
      await waitRef('rule:sd.search-move');
      await ref().locator('.dungeon-weak-hit-suggestion').waitFor();
      await ref().locator('.procedure-quick-guide').scrollIntoViewIfNeeded();
      await shot('dungeon');
      await noOverflow();
      check(
        'dungeon Strong/Weak/Miss + search follow-up; TR actions absent; back retains result; inspect does not roll',
      );
      await click(
        page
          .locator('.spatial-scenes')
          .getByRole('button', { name: /^City crawl/ }),
      );
      await click(
        page
          .locator('.scene-play-actions')
          .getByRole('button', { name: /목표를 찾아 이동/ }),
      );
      await waitRef('procedure:city.crawl');
      await forceDice([0.99, 0]);
      await click(
        ref()
          .locator('.city-roller')
          .getByRole('button', { name: /주사위 굴리기/ }),
      );
      await click(
        ref().getByRole('button', { name: '새 거리 열기 ↗', exact: true }),
      );
      await waitRef('procedure:aitc.street');
      assert.equal(await ref().getAttribute('data-has-reading'), null);
      await page.goBack();
      await waitRef('procedure:city.crawl');
      await ref()
        .getByRole('button', { name: '새 거리 열기 ↗', exact: true })
        .waitFor();
      await forceDice([0, 0, 0.5]);
      await click(
        ref()
          .locator('.city-roller')
          .getByRole('button', { name: /주사위 굴리기/ }),
      );
      await ref()
        .getByRole('button', { name: '상황 해결 후 거리 열기 ↗', exact: true })
        .waitFor();
      await ref().locator('.procedure-quick-guide').scrollIntoViewIfNeeded();
      await shot('city');
      await noOverflow();
      check('city Weak/Fail → same Street reader; return retains result');
      // Open a source reference via the same Search path and enter the dock from it.
      await search('Mythic Lists', 'rule:mythic.lists');
      await click(
        ref().getByRole('button', { name: 'Mythic 인물 · 스레드 목록 열기 ↗' }),
      );
      await mythic().locator('.mythic-lists').waitFor();
      assert.equal(
        await mythic().locator('.mythic-list-lines input').count(),
        50,
      );
      await mythic()
        .getByRole('textbox', { name: '인물 1', exact: true })
        .fill('수도승');
      await mythic()
        .getByRole('textbox', { name: '인물 2', exact: true })
        .fill('수도승');
      await mythic()
        .getByRole('textbox', { name: '인물 6', exact: true })
        .fill('성문 경비');
      await mythic()
        .getByRole('textbox', { name: '스레드 1', exact: true })
        .fill('사라진 종 찾기');
      await forceDice([0.75, 0]);
      await click(
        mythic().getByRole('button', { name: '인물 뽑기', exact: true }),
      );
      assert.match(
        await mythic().locator('.list-draw-result').innerText(),
        /성문 경비/,
      );
      await forceDice([0.75, 0.99]);
      await click(
        mythic().getByRole('button', { name: '인물 뽑기', exact: true }),
      );
      assert.match(
        await mythic().locator('.list-draw-result').innerText(),
        /CHOOSE/,
      );
      await click(
        mythic().getByRole('button', { name: '성문 경비 선택', exact: true }),
      );
      assert.match(
        await mythic().locator('.list-draw-result').innerText(),
        /성문 경비/,
      );
      await mythic().evaluate((el) => (el.scrollTop = 0));
      await shot('mythic');
      await noOverflow();
      await click(
        mythic().getByRole('button', { name: '장면 판정', exact: true }),
      );
      await click(mythic().getByLabel('직접 굴린 주사위 입력'));
      await mythic()
        .getByRole('spinbutton', { name: '첫 번째 주사위', exact: true })
        .fill('2');
      await click(
        mythic().getByRole('button', {
          name: '입력한 값으로 판정',
          exact: true,
        }),
      );
      await forceDice([0.21, 0.1, 0.2]);
      await click(
        mythic().getByRole('button', { name: '사건 단서 굴리기', exact: true }),
      );
      await click(
        mythic().getByRole('button', {
          name: '인물 목록에서 대상 뽑기',
          exact: true,
        }),
      );
      await mythic().locator('.mythic-lists').waitFor();
      // Dismiss via keyboard, reopen via keyboard. List values survive reload.
      await page.keyboard.press('Escape');
      await mythic().waitFor({ state: 'hidden' });
      await page
        .getByRole('button', { name: 'Mythic Fate와 목록 열기' })
        .focus();
      await page.keyboard.press('Enter');
      await mythic().waitFor();
      await page.keyboard.press('Escape');
      await page.reload();
      await click(
        page.getByRole('button', { name: 'Mythic Fate와 목록 열기' }),
      );
      await click(
        mythic().getByRole('button', { name: '인물 · 스레드', exact: true }),
      );
      assert.equal(
        await mythic()
          .getByRole('textbox', { name: '인물 6', exact: true })
          .inputValue(),
        '성문 경비',
      );
      assert.equal(
        await mythic()
          .getByRole('textbox', { name: '스레드 1', exact: true })
          .inputValue(),
        '사라진 종 찾기',
      );
      check(
        '25×2 list editor, weighted sections, explicit CHOOSE, scene Focus→Characters, keyboard and persistence',
      );
      if (width >= 1100) {
        assert.equal(
          await page.locator('[data-slot="dialog-overlay"]').count(),
          0,
        );
        await click(
          page.getByRole('button', { name: 'Reference Desk 홈', exact: true }),
        );
        await mythic().waitFor();
        check(
          'desktop Mythic stays open while the underlying desk remains interactive',
        );
      }
      assert.equal(
        await page.evaluate(() => localStorage.getItem('morkborg-codex:v6')),
        '{"schemaVersion":6,"campaigns":[],"activeCampaignId":null,"view":"campaigns"}',
      );
      if (width === 1440) {
        await mythic()
          .getByRole('textbox', { name: '인물 3', exact: true })
          .fill('수도승');
        await mythic()
          .getByRole('textbox', { name: '인물 4', exact: true })
          .fill('수도승');
        await mythic().getByRole('alert').waitFor();
        assert.equal(
          await mythic()
            .getByRole('textbox', { name: '인물 4', exact: true })
            .inputValue(),
          '',
        );
        await mythic()
          .getByRole('textbox', { name: '인물 4', exact: true })
          .fill('노점 상인');
        await mythic().locator('.list-manual summary').click();
        await mythic()
          .getByRole('spinbutton', { name: '목록 구역 주사위' })
          .fill('3');
        await mythic()
          .getByRole('spinbutton', { name: '목록 행 주사위' })
          .fill('1');
        await mythic()
          .getByRole('button', { name: '입력값으로 선택', exact: true })
          .click();
        assert.match(
          await mythic().locator('.list-draw-result').innerText(),
          /성문 경비/,
        );
        assert.ok(
          await mythic()
            .locator('.list-draw-result')
            .evaluate(
              (el) =>
                el.getBoundingClientRect().top >=
                document.querySelector('#mythic-panel').getBoundingClientRect()
                  .top,
            ),
        );
        const listRaw = await page.evaluate(() =>
          localStorage.getItem('morkborg-mythic-lists:v1'),
        );
        await page.evaluate(() => {
          window.savedSetItem = Storage.prototype.setItem;
          Storage.prototype.setItem = function (k, v) {
            if (k === 'morkborg-mythic-lists:v1')
              throw new DOMException('검증용 용량 초과', 'QuotaExceededError');
            return window.savedSetItem.call(this, k, v);
          };
        });
        await mythic()
          .getByRole('textbox', { name: '인물 6', exact: true })
          .fill('저장되면 안 됨');
        await mythic().getByRole('alert').waitFor();
        assert.equal(
          await page.evaluate(() =>
            localStorage.getItem('morkborg-mythic-lists:v1'),
          ),
          listRaw,
        );
        await page.evaluate(
          () => (Storage.prototype.setItem = window.savedSetItem),
        );
        await page.keyboard.press('Escape');
        await openShelf();
        await shelf()
          .getByLabel('보관함 파일')
          .setInputFiles(`${root}/objects-${width}.json`);
        await page.waitForFunction(
          () =>
            JSON.parse(localStorage.getItem('morkborg-object-shelf:v1')).objects
              .length === 8,
        );
        assert.equal(
          await page.evaluate(
            () =>
              new Set(
                JSON.parse(
                  localStorage.getItem('morkborg-object-shelf:v1'),
                ).objects.map((o) => o.id),
              ).size,
          ),
          8,
        );
        await click(
          shelf()
            .getByRole('navigation', { name: '보관 종류' })
            .getByRole('button', { name: /^캐릭터 / }),
        );
        await click(shelf().locator('.saved-object-row').first());
        await click(
          shelf().getByRole('button', { name: '이름·내용 수정', exact: true }),
        );
        await shelf()
          .getByRole('textbox', { name: '보관 이름' })
          .fill('저장 불가 검증');
        const objectRaw = await page.evaluate(() =>
          localStorage.getItem('morkborg-object-shelf:v1'),
        );
        await page.evaluate(() => {
          window.savedSetItem = Storage.prototype.setItem;
          Storage.prototype.setItem = function (k, v) {
            if (k === 'morkborg-object-shelf:v1')
              throw new DOMException('검증용 용량 초과', 'QuotaExceededError');
            return window.savedSetItem.call(this, k, v);
          };
        });
        await click(
          shelf().getByRole('button', { name: '수정 저장', exact: true }),
        );
        await shelf().getByRole('alert').waitFor();
        assert.equal(
          await page.evaluate(() =>
            localStorage.getItem('morkborg-object-shelf:v1'),
          ),
          objectRaw,
        );
        await page.evaluate(
          () => (Storage.prototype.setItem = window.savedSetItem),
        );
        await closeShelf();
        await page.evaluate(() =>
          localStorage.setItem('morkborg-object-shelf:v1', 'invalid original'),
        );
        await page.reload();
        await openShelf();
        await shelf().getByRole('alert').waitFor();
        assert.equal(
          await page.evaluate(() =>
            localStorage.getItem('morkborg-object-shelf:v1'),
          ),
          'invalid original',
        );
        check(
          'manual list dice and visible result; duplicate limit; valid import merges safely; quota/corruption preserve originals',
        );
      }
      assert.deepEqual(errors, []);
      check('legacy records untouched; no page errors');
      report.passed = true;
    } catch (error) {
      report.error = String(error);
      await shot('failure');
      console.error(width, error);
      throw error;
    } finally {
      await writeFile(
        `${root}/acceptance.json`,
        JSON.stringify(reports, null, 2),
      );
      await context.close();
    }
    console.log(`${width}px: ${report.checks.length} groups passed`);
  }
} finally {
  await browser.close();
}
