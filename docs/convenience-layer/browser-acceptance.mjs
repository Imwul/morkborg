import { chromium } from '/Users/imwul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const root = 'outputs/convenience-layer';
fs.mkdirSync(root, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  storageState: 'outputs/visual-quieting/after-accepted-storage.json',
  permissions: ['clipboard-read', 'clipboard-write'],
  reducedMotion: 'reduce',
});
const page = await context.newPage();
const errors = [],
  steps = [];
page.on('pageerror', (e) => errors.push(e.message));
page.setDefaultTimeout(8000);
let clicks = 0;
const click = async (locator) => {
  await locator.click();
  clicks++;
  await page.waitForTimeout(120);
};
const record = (step, from, extra = {}) => {
  steps.push({ step, clicks: clicks - from, ...extra });
  console.log(step, clicks - from);
};
const close = async () => {
  if (await page.getByRole('button', { name: '닫기', exact: true }).count())
    await click(page.getByRole('button', { name: '닫기', exact: true }));
};
const search = async (q, execute = true) => {
  await close();
  await click(
    page.getByRole('button', { name: 'REFERENCE DESK', exact: true }),
  );
  await page.getByRole('textbox', { name: '작업대 검색' }).fill(q);
  await click(
    page
      .locator(
        execute
          ? '.desk-search-results .reference-select-action'
          : '.desk-search-results .reference-select-info',
      )
      .first(),
  );
};
const tools = async (tab) => {
  if (await page.locator('[role=dialog]').count())
    await click(
      page.getByRole('button', { name: '창 안에서 Play 도구', exact: true }),
    );
  else
    await click(
      page.getByRole('button', { name: 'Play 도구 열기', exact: true }),
    );
  if (tab) await click(page.getByRole('button', { name: tab, exact: true }));
};
const snap = async (name) => {
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${root}/${name}.png` });
};
const stored = () =>
  page.evaluate(() => ({
    campaign: localStorage.getItem('morkborg-codex:v6'),
    prefs: JSON.parse(localStorage.getItem('morkborg-convenience:v1') ?? '{}'),
    temp: JSON.parse(
      sessionStorage.getItem('morkborg-play-session:v1') ?? '{}',
    ),
  }));
try {
  await page.goto('http://127.0.0.1:5175');
  await page.waitForLoadState('networkidle');
  const before = await stored();
  await snap('desk-start');
  let n = clicks;
  await search('Reaction');
  await click(
    page
      .getByRole('group', { name: '참조 편의 동작' })
      .or(page.locator('summary[aria-label="참조 편의 동작"]')),
  );
  await click(page.getByRole('button', { name: '+ Play Tray', exact: true }));
  await close();
  record('Add Reaction to Tray', n);
  n = clicks;
  await tools();
  await page
    .getByRole('textbox', { name: 'Tray 참조 검색' })
    .fill('Action + Theme');
  await click(page.locator('.convenience-add-row').first());
  await close();
  record('Add Action + Theme', n);
  await snap('tray');
  n = clicks;
  await click(
    page
      .locator('.reference-play-tray')
      .getByRole('button', { name: 'Reaction', exact: true }),
  );
  record('Tray → Reaction roll', n);
  assert.ok((await stored()).temp.lastRoll.id.includes('reaction'));
  await close();
  n = clicks;
  await click(
    page
      .locator('.reference-play-tray')
      .getByRole('button', { name: 'Action + Theme', exact: true }),
  );
  record('Tray → Action + Theme run', n);
  await click(page.locator('.partial-roll-controls > summary'));
  const action = await page.locator('.held-component b').first().innerText();
  await click(
    page
      .locator('.held-component')
      .first()
      .getByRole('button', { name: /고정/ }),
  );
  n = clicks;
  await click(
    page
      .locator('.held-component')
      .nth(1)
      .getByRole('button', { name: /다시 굴리기/ }),
  );
  assert.equal(
    await page.locator('.held-component b').first().innerText(),
    action,
  );
  record('Theme-only reroll, Action held', n);
  await snap('held');
  n = clicks;
  await search('Geographical Features');
  await click(page.locator('.physical-roll-input > summary'));
  await page.locator('.physical-roll-input input').fill('12');
  await click(page.getByRole('button', { name: '결과 확인', exact: true }));
  assert.equal((await stored()).temp.lastRoll.mode, 'USER_ROLL');
  record('Physical d20 resolve', n);
  await snap('manual-d20');
  n = clicks;
  await search('Building Type');
  await click(page.locator('.physical-roll-input > summary'));
  await page.locator('.physical-roll-input input').fill('78');
  await click(page.getByRole('button', { name: '결과 확인', exact: true }));
  assert.match(
    await page.locator('.physical-roll-input [role=alert]').innerText(),
    /입력/,
  );
  await page.locator('.physical-roll-input input').fill('35');
  await click(page.getByRole('button', { name: '결과 확인', exact: true }));
  assert.equal((await stored()).temp.lastRoll.inputs['0'], '35');
  record('d66 rejects 78; accepts 35', n);
  await click(
    page
      .getByRole('button', { name: '마지막 굴림 다시 실행', exact: true })
      .last(),
  );
  assert.equal(
    await page.locator('.physical-roll-input input').inputValue(),
    '35',
  );
  n = clicks;
  await tools('Recipes · 조합');
  await click(page.getByRole('button', { name: '+ 새 Recipe', exact: true }));
  await page
    .getByRole('textbox', { name: '모음 이름' })
    .fill('QA FIRST CONTACT');
  for (const term of ['Reaction', 'Action Oracle', 'Theme Oracle']) {
    await page.getByRole('textbox', { name: '조합 참조 검색' }).fill(term);
    await click(page.locator('.convenience-add-row:not([disabled])').first());
  }
  await click(page.getByRole('button', { name: '저장', exact: true }));
  await click(
    page.getByRole('button', { name: 'QA FIRST CONTACT RUN ALL', exact: true }),
  );
  assert.equal(await page.locator('.recipe-result').count(), 3);
  record('Create/run 3-step Recipe', n);
  console.log(
    'Recipe canonical IDs',
    (await stored()).prefs.recipes[0].referenceIds,
  );
  await snap('recipe');
  n = clicks;
  await click(
    page.getByRole('button', { name: 'Recipe 결과 1 고정', exact: true }),
  );
  const first = await page
    .locator('.recipe-result')
    .first()
    .locator('section')
    .first()
    .innerText();
  await click(
    page.getByRole('button', { name: 'RUN ALL · 고정 제외', exact: true }),
  );
  assert.equal(
    await page
      .locator('.recipe-result')
      .first()
      .locator('section')
      .first()
      .innerText(),
    first,
  );
  record('Recipe hold / reroll unlocked', n);
  n = clicks;
  await click(page.locator('summary[aria-label="Recipe 결과 1 추가 동작"]'));
  await click(
    page
      .locator('.recipe-result')
      .first()
      .getByRole('button', { name: '스크랩에 추가', exact: true }),
  );
  await click(
    page.getByRole('button', { name: 'Scratch · 스크랩', exact: true }),
  );
  const scratch = page.getByRole('textbox', { name: '임시 스크랩' });
  assert.ok((await scratch.inputValue()).length);
  await scratch.fill((await scratch.inputValue()) + '\nQA black door unopened');
  await click(page.getByRole('button', { name: 'COPY ALL', exact: true }));
  assert.match(
    await page.evaluate(() => navigator.clipboard.readText()),
    /QA black door/,
  );
  record('Send, type and copy Scratch', n);
  await snap('scratch');
  n = clicks;
  await click(page.getByRole('button', { name: 'Packs · 모음', exact: true }));
  await click(page.getByRole('button', { name: 'City · 도시', exact: true }));
  await close();
  await search('Broken');
  assert.match(
    await page.locator('.reference-inspector').innerText(),
    /0 HP|negative|음수|죽음/,
  );
  record('City Pack → global Broken lookup', n);
  n = clicks;
  await search('Reaction');
  await close();
  const last = JSON.stringify((await stored()).temp.lastRoll.parameters);
  if (
    await page.getByRole('button', { name: '나의 캠페인', exact: true }).count()
  ) {
    await click(page.getByRole('button', { name: '나의 캠페인', exact: true }));
    await click(page.locator('.campaign-card .card-title').first());
  }
  await click(page.getByRole('button', { name: /던전 보관함/ }));
  const campaignBeforeLast = (await stored()).campaign;
  await page.keyboard.press('r');
  clicks++;
  assert.ok(
    (await stored()).campaign === campaignBeforeLast,
    'Last Roll mutated saved data',
  );
  assert.equal(JSON.stringify((await stored()).temp.lastRoll.parameters), last);
  assert.ok(await page.locator('.reference-inspector').isVisible());
  record('Dungeon → R Last; parameters retained', n);
  await close();
  await tools('Scratch · 스크랩');
  const request = JSON.stringify((await stored()).temp.lastRoll);
  await scratch.focus();
  await page.keyboard.type('r');
  assert.equal(JSON.stringify((await stored()).temp.lastRoll), request);
  await close();
  n = clicks;
  await click(
    page.getByRole('button', { name: 'REFERENCE DESK', exact: true }),
  );
  await click(page.getByRole('button', { name: '최근 참조', exact: true }));
  await close();
  record('Return → Recent', n);
  const saved = await stored();
  await page.reload();
  await page.waitForLoadState('networkidle');
  const after = await stored();
  assert.deepEqual(after.prefs, saved.prefs);
  assert.deepEqual(after.temp, saved.temp);
  {
    const a = JSON.parse(after.campaign).campaigns,
      b = JSON.parse(before.campaign).campaigns;
    const changes = [];
    function diff(a, b, path = 'campaigns') {
      if (JSON.stringify(a) === JSON.stringify(b)) return;
      if (a && b && typeof a === 'object' && typeof b === 'object') {
        for (const k of new Set([...Object.keys(a), ...Object.keys(b)]))
          diff(a[k], b[k], path + '.' + k);
      } else changes.push({ path, from: typeof b, to: typeof a });
    }
    diff(a, b);
    console.log(
      'Existing navigation-only paths',
      changes.map((c) => c.path),
    );
    assert.ok(
      changes.every((c) =>
        /^campaigns\.\d+\.workspace\.(section|dungeonTab|dungeonId|roomId)$/.test(
          c.path,
        ),
      ),
      'Campaign content changed',
    );
  }
  assert.ok(!JSON.stringify(after.temp).includes('registry'));
  assert.ok(!JSON.stringify(after.temp).includes('rules'));
  record('Reload: preferences/session preserved; Campaign identical', clicks);
  await context.storageState({ path: `${root}/accepted-storage.json` });
  fs.writeFileSync(`${root}/accepted-session.json`, JSON.stringify(after.temp));
  fs.writeFileSync(
    `${root}/browser-acceptance.json`,
    JSON.stringify(
      {
        start: before.prefs,
        steps,
        errors,
        campaignUnchanged: true,
        totalClicks: clicks,
      },
      null,
      2,
    ),
  );
  assert.deepEqual(errors, []);
  console.log('ACCEPTED', clicks);
} catch (e) {
  await snap('acceptance-failure');
  fs.writeFileSync(
    `${root}/failure.txt`,
    await page.locator('body').innerText(),
  );
  console.error(e.stack);
  process.exitCode = 1;
} finally {
  await browser.close();
}
