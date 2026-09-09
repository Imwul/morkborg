import { chromium } from '/Users/imwul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const root = 'outputs/convenience-layer',
  browser = await chromium.launch({ channel: 'chrome', headless: true }),
  context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    storageState: `${root}/accepted-storage.json`,
    reducedMotion: 'reduce',
  });
await context.addInitScript(
  (s) => {
    if (!sessionStorage.getItem('morkborg-play-session:v1'))
      sessionStorage.setItem('morkborg-play-session:v1', s);
  },
  fs.readFileSync(`${root}/accepted-session.json`, 'utf8'),
);
const page = await context.newPage(),
  checks = [],
  errors = [];
page.setDefaultTimeout(7000);
page.on('pageerror', (e) => errors.push(e.message));
const click = async (l) => {
    await l.click();
    await page.waitForTimeout(100);
  },
  close = async () => {
    if (await page.getByRole('button', { name: '닫기', exact: true }).count())
      await click(page.getByRole('button', { name: '닫기', exact: true }));
  },
  tools = async (tab) => {
    await close();
    await click(
      page.getByRole('button', { name: 'Play 도구 열기', exact: true }),
    );
    if (tab) await click(page.getByRole('button', { name: tab, exact: true }));
  },
  find = async (q, roll = true) => {
    await close();
    await page.keyboard.press('Control+k');
    await page.getByRole('textbox', { name: '통합 참조 검색' }).fill(q);
    await click(
      page
        .locator(
          roll
            ? '.reference-search-dialog .reference-select-action'
            : '.reference-search-dialog .reference-select-info',
        )
        .first(),
    );
  };
try {
  await page.goto('http://127.0.0.1:5175');
  await page.waitForLoadState('networkidle');
  const campaign = await page.evaluate(() =>
    localStorage.getItem('morkborg-codex:v6'),
  );
  await tools('Recipes · 조합');
  await click(
    page.getByRole('button', { name: 'QA FIRST CONTACT RUN ALL', exact: true }),
  );
  await click(page.locator('summary[aria-label="Recipe 결과 2 추가 동작"]'));
  await click(
    page
      .locator('.recipe-result')
      .nth(1)
      .getByRole('button', { name: '직접 수정', exact: true }),
  );
  await page
    .getByRole('textbox', { name: 'Recipe 결과 수정' })
    .fill('Manual player interpretation');
  await click(page.getByRole('button', { name: '적용 · 고정', exact: true }));
  await click(
    (await page
      .getByRole('button', { name: 'RUN ALL · 고정 제외', exact: true })
      .isVisible())
      ? page.getByRole('button', { name: 'RUN ALL · 고정 제외', exact: true })
      : page.getByRole('button', {
          name: 'QA FIRST CONTACT RUN ALL',
          exact: true,
        }),
  );
  assert.equal(
    await page.locator('.recipe-manual-text').innerText(),
    'Manual player interpretation',
  );
  await click(
    page
      .locator('.recipe-result')
      .nth(1)
      .locator('.source-disclosure > summary'),
  );
  assert.match(
    await page.locator('.recipe-result').nth(1).innerText(),
    /Edited manually/,
  );
  checks.push(
    'Manual recipe edit held; unrelated rerolls retain it; Source labels edited',
  );
  await tools('Packs · 모음');
  await click(page.getByRole('button', { name: '+ 새 Pack', exact: true }));
  await page.getByRole('textbox', { name: '모음 이름' }).fill('QA Custom Pack');
  await page.getByRole('textbox', { name: '조합 참조 검색' }).fill('Omens');
  await click(page.locator('.convenience-add-row').first());
  await click(page.getByRole('button', { name: '저장', exact: true }));
  await click(
    page.getByRole('button', { name: 'QA Custom Pack 선택', exact: true }),
  );
  await close();
  await page.reload();
  await page.waitForLoadState('networkidle');
  assert.match(
    await page.locator('.desk-pack-choice').innerText(),
    /QA Custom Pack/,
  );
  await find('Broken');
  assert.match(await page.locator('.reference-inspector').innerText(), /HP/);
  checks.push(
    'Custom Pack saves/reloads; outside-Pack Broken stays globally searchable',
  );
  await find('Rare Monster · Five Cards');
  await click(page.locator('.rare-card-details > summary'));
  await click(
    page.getByRole('button', { name: 'SHUFFLE · 새 던전', exact: true }),
  );
  await click(page.locator('.physical-roll-input > summary'));
  const cards = page.getByRole('textbox', { name: '실물 카드' });
  await cards.fill('Q♠ Q♠ 2♣ A♦ 7♠');
  await click(page.getByRole('button', { name: '결과 확인', exact: true }));
  assert.match(
    await page.locator('.physical-roll-input [role=alert]').innerText(),
    /중복/,
  );
  await cards.fill('11♥ 10♥ 2♣ A♦ 7♠');
  await click(page.getByRole('button', { name: '결과 확인', exact: true }));
  assert.match(
    await page.locator('.physical-roll-input [role=alert]').innerText(),
    /카드/,
  );
  await cards.fill('Q♠ 10♥ 2♣ A♦ 7♠');
  await click(page.getByRole('button', { name: '결과 확인', exact: true }));
  await click(
    page.locator('.reference-inspector > .source-disclosure > summary'),
  );
  assert.match(
    await page.locator('.reference-inspector > .source-disclosure').innerText(),
    /MANUAL ROLL/,
  );
  await page.screenshot({ path: `${root}/cards-source.png` });
  await close();
  await page.reload();
  await page.waitForLoadState('networkidle');
  await click(
    page.getByRole('button', { name: '마지막 굴림 다시 실행', exact: true }),
  );
  assert.equal(await cards.inputValue(), 'Q♠ 10♥ 2♣ A♦ 7♠');
  await click(page.getByRole('button', { name: '결과 확인', exact: true }));
  assert.match(
    await page.locator('.physical-roll-input [role=alert]').innerText(),
    /이미 사용/,
  );
  checks.push(
    'Card rank/suit validation, duplicate rejection, source/manual trace, Last restores deck after reload',
  );
  await click(page.locator('.rare-card-details > summary'));
  await click(
    page.getByRole('button', { name: 'SHUFFLE · 새 던전', exact: true }),
  );
  await cards.fill('A♣ 2♦ 3♠ 4♠ 5♥');
  await click(page.getByRole('button', { name: '결과 확인', exact: true }));
  assert.match(
    await page.locator('.physical-roll-input [role=alert]').innerText(),
    /여섯/,
  );
  await cards.fill('A♣ 2♦ 3♠ 4♠ 5♥ 6♦');
  await click(page.getByRole('button', { name: '결과 확인', exact: true }));
  const temp = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem('morkborg-play-session:v1')),
  );
  assert.equal(temp.lastRoll.parameters.rareDeck.length, 46);
  checks.push('Source conditional sixth card required; deck retains 46 cards');
  await tools('Recipes · 조합');
  await click(
    (await page
      .getByRole('button', { name: 'RUN ALL · 고정 제외', exact: true })
      .isVisible())
      ? page.getByRole('button', { name: 'RUN ALL · 고정 제외', exact: true })
      : page.getByRole('button', {
          name: 'QA FIRST CONTACT RUN ALL',
          exact: true,
        }),
  );
  await click(page.locator('.convenience-library > summary'));
  await click(page.locator('summary[aria-label="QA FIRST CONTACT 관리"]'));
  await click(
    page
      .locator('.convenience-saved-list')
      .getByRole('button', { name: '삭제', exact: true }),
  );
  await close();
  await click(
    page.getByRole('button', { name: '마지막 굴림 다시 실행', exact: true }),
  );
  assert.match(
    await page.locator('.reference-tools-dialog [role=alert]').innerText(),
    /삭제/,
  );
  checks.push(
    'Deleted last Recipe opens explicit notice without running another source',
  );
  await tools('Play');
  await click(page.getByRole('button', { name: 'Tray 비우기', exact: true }));
  await click(page.getByRole('button', { name: '기억 지우기', exact: true }));
  await click(
    page.getByRole('button', { name: 'Scratch · 스크랩', exact: true }),
  );
  await click(page.getByRole('button', { name: '비우기', exact: true }));
  const state = await page.evaluate(() => ({
    prefs: JSON.parse(localStorage.getItem('morkborg-convenience:v1')),
    temp: JSON.parse(sessionStorage.getItem('morkborg-play-session:v1')),
    campaign: localStorage.getItem('morkborg-codex:v6'),
  }));
  assert.equal(state.prefs.recipes.length, 0);
  assert.equal(state.prefs.packs.length, 1);
  assert.equal(state.temp.tray.length, 0);
  assert.equal(state.temp.scratch, '');
  assert.equal(state.temp.lastRoll, null);
  assert.ok(state.campaign === campaign, 'Convenience tools changed Campaign');
  checks.push(
    'Recipe deletion and temporary clears preserve custom Packs; Campaign byte-identical',
  );
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    `${root}/extended.json`,
    JSON.stringify({ checks, errors }, null, 2),
  );
  console.log(checks);
} catch (e) {
  await page.screenshot({ path: `${root}/extended-failure.png` });
  fs.writeFileSync(
    `${root}/extended-failure.txt`,
    await page.locator('body').innerText(),
  );
  console.error(e.stack);
  process.exitCode = 1;
} finally {
  await browser.close();
}
