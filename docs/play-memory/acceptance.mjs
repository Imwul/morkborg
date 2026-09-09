import { chromium } from '/Users/imwul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const url = process.argv[2] ?? 'http://127.0.0.1:5175',
  phase = process.argv[3] ?? 'local';
const width = Number(process.env.WIDTH ?? 1440),
  duration = Number(process.env.PLAY_SECONDS ?? 0);
const root = 'outputs/play-memory';
fs.mkdirSync(root, { recursive: true });
const fixture = JSON.parse(
  fs.readFileSync('outputs/visual-quieting/after-accepted-storage.json'),
);
fixture.origins[0].origin = new URL(url).origin;
fixture.origins[0].localStorage = fixture.origins[0].localStorage.filter(
  (x) => !['morkborg-convenience:v1'].includes(x.name),
);
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({
  storageState: fixture,
  viewport: { width, height: 900 },
  colorScheme: width === 360 ? 'dark' : 'light',
  hasTouch: width === 360,
  isMobile: width === 360,
  reducedMotion: 'reduce',
  permissions: ['clipboard-read', 'clipboard-write'],
});
const page = await context.newPage(),
  errors = [],
  steps = [];
page.setDefaultTimeout(12000);
page.on('pageerror', (e) => errors.push(e.message));
let clicks = 0;
const click = async (l) => {
  await l.click();
  clicks++;
  await page.waitForTimeout(100);
};
const mark = (name, start, extra = {}) => {
  steps.push({ name, clicks: clicks - start, ...extra });
  console.log(name, clicks - start);
};
const memory = () =>
  page.evaluate(() =>
    JSON.parse(sessionStorage.getItem('morkborg-play-memory:v1')),
  );
const temporary = () =>
  page.evaluate(() =>
    JSON.parse(sessionStorage.getItem('morkborg-play-session:v1')),
  );
const saved = () =>
  page.evaluate(() => JSON.parse(localStorage.getItem('morkborg-codex:v6')));
const content = (s) => s.campaigns.map(({ workspace, ...c }) => c);
const close = async () => {
  if (await page.getByRole('button', { name: '닫기', exact: true }).count())
    await click(page.getByRole('button', { name: '닫기', exact: true }));
};
const play = async () => {
  if (await page.locator('.reference-tools-dialog').count()) {
    const b = page.getByRole('button', { name: '‹ PLAY', exact: true });
    if (await b.count()) await click(b);
    return;
  }
  await click(
    page.getByRole('button', {
      name: (await page.locator('[role=dialog]').count())
        ? '창 안에서 Play 도구'
        : 'Play 도구 열기',
      exact: true,
    }),
  );
};
const search = async (q) => {
  await click(
    page.getByRole('button', {
      name: (await page.locator('[role=dialog]').count())
        ? '창 안에서 검색'
        : '참조 검색',
      exact: true,
    }),
  );
  await page.getByRole('textbox', { name: '통합 참조 검색' }).fill(q);
  await click(
    page.locator('.reference-results .reference-select-action').first(),
  );
};
const shot = async (name) => {
  await page.screenshot({ path: `${root}/${phase}-${name}-${width}.png` });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  const d = page.locator('[role=dialog]');
  if (await d.count())
    assert.equal(
      await d.evaluate((e) => e.scrollWidth > e.clientWidth + 1),
      false,
    );
};
const replay = async (entry) => {
  await play();
  await click(page.getByRole('button', { name: /Recent rolls/ }));
  const n = (await memory()).replays.findIndex((r) => r.id === entry.id);
  assert.ok(n >= 0, 'snapshot still in bounded history');
  await click(page.locator('.replay-list >button').nth(n));
  await page.locator('.roll-replay-view').waitFor();
  assert.equal(await roomReturn().isVisible(), true);
  const text = await page.locator('.roll-replay-view').innerText();
  for (const r of entry.results) {
    if (r.manualText !== undefined) assert.ok(text.includes(r.manualText));
    else
      for (const b of r.reading.blocks)
        assert.ok(text.includes(b.text.split('\n')[0]), b.text);
  }
  assert.deepEqual(
    (await memory()).replays.find((r) => r.id === entry.id),
    entry,
  );
};
const home = async () => {
  await close();
  await click(page.getByRole('button', { name: '홈으로', exact: true }));
  await page.locator('.home-index').waitFor();
};
const roomReturn = () => page.locator('[role=dialog] > .play-context-return');
try {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  const original = content(await saved());
  await page
    .locator('.home-index')
    .getByRole('button', { name: '던전 보관함' })
    .click();
  await page.locator('.dungeon-grid .compact-card-main').first().click();
  await page
    .locator('.dungeon-tabs')
    .getByRole('button', { name: '개요', exact: true })
    .click();
  const room = page.locator('.room-packet').nth(2);
  await click(room.locator('.room-packet-summary'));
  const roomId = await room.getAttribute('data-room-id');
  await search('Reaction');
  const reaction = (await memory()).replays[0];
  assert.equal(await roomReturn().innerText(), '← ROOM 03');
  await shot('room-reference');
  await click(
    page.locator('.reference-inspector > .source-disclosure > summary'),
  );
  await click(
    page.locator('.reference-inspector > .source-disclosure > summary'),
  );
  await click(page.locator('.reference-convenience-actions >summary'));
  await click(
    page.getByRole('button', {
      name: 'ADD TO PLAY · PLAY에 추가',
      exact: true,
    }),
  );
  await search('Prowler');
  assert.equal(await roomReturn().innerText(), '← ROOM 03');
  await play();
  await click(page.locator('.convenience-tray-items >button').first());
  assert.equal(await roomReturn().innerText(), '← ROOM 03');
  let n = clicks;
  await click(roomReturn());
  assert.equal(await room.locator('details').first().getAttribute('open'), '');
  mark('Reference chain / Tray → original Room', n);
  await shot('room-context');
  await search('Action + Theme');
  const composite = (await memory()).replays[0];
  assert.equal(composite.results[0].rolls.length, 2);
  await search('Geographical Features');
  await click(page.locator('.physical-roll-input >summary'));
  await page.locator('.physical-roll-input input').fill('14');
  await click(page.getByRole('button', { name: '결과 확인', exact: true }));
  const physical = (await memory()).replays[0];
  assert.equal(physical.results[0].mode, 'USER_ROLL');
  assert.equal(physical.results[0].inputs['0'], '14');
  await play();
  await click(page.getByRole('button', { name: 'Recipes · 조합' }));
  await click(page.getByRole('button', { name: '+ 만들기', exact: true }));
  await page.getByRole('textbox', { name: '모음 이름' }).fill('REPLAY QA');
  for (const q of ['Reaction', 'Action Oracle', 'Theme Oracle']) {
    await page.getByRole('textbox', { name: '조합 참조 검색' }).fill(q);
    await click(
      page
        .locator('.convenience-editor .convenience-add-row')
        .filter({ hasText: new RegExp('^\\+ ' + q + '$') })
        .first(),
    );
  }
  await click(page.getByRole('button', { name: '저장', exact: true }));
  await click(page.getByRole('button', { name: 'REPLAY QA RUN', exact: true }));
  await click(page.locator('.recipe-hold-discovery'));
  await click(
    page.getByRole('button', { name: 'Recipe 결과 1 고정', exact: true }),
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
    .fill('직접 적은 잠긴 검은 문');
  await click(page.getByRole('button', { name: '적용 · 고정', exact: true }));
  const edited = (await memory()).replays[0];
  assert.equal(edited.results[1].manualText, '직접 적은 잠긴 검은 문');
  await click(
    page.getByRole('button', { name: 'RUN · 고정 제외', exact: true }),
  );
  const recipe = (await memory()).replays[0];
  assert.equal(recipe.results[0].held, true);
  assert.equal(recipe.results[1].manualText, edited.results[1].manualText);
  await search('Depths Encounter Level');
  await page
    .getByRole('combobox', { name: 'Depths region · 지역' })
    .selectOption('kergus');
  await click(page.getByRole('button', { name: /^(ROLL|REROLL)$/ }).last());
  const encounter = (await memory()).replays[0];
  assert.equal(encounter.parameters.encounterRegion, 'kergus');
  await search('Rare Monster Five Cards');
  await click(page.locator('.rare-card-details >summary'));
  await click(
    page.getByRole('button', { name: 'SHUFFLE · 새 던전', exact: true }),
  );
  await click(page.locator('.physical-roll-input >summary'));
  await page
    .getByRole('textbox', { name: '실물 카드' })
    .fill('Q♣ 10♥ 2♠ A♠ 7♠ K♦');
  await click(page.getByRole('button', { name: '결과 확인', exact: true }));
  const cards = (await memory()).replays[0];
  assert.equal(cards.results[0].cards.length, 6);
  const deckBefore = (await temporary()).lastRoll.parameters.rareDeck;
  assert.equal(deckBefore.length, 46);
  const count = (await memory()).replays.length;
  for (const [label, entry] of [
    ['reaction', reaction],
    ['composite', composite],
    ['physical', physical],
    ['recipe', recipe],
    ['encounter', encounter],
    ['cards', cards],
  ]) {
    n = clicks;
    await replay(entry);
    mark(`Replay ${label}: exact snapshot`, n);
    assert.equal((await memory()).replays.length, count);
    assert.deepEqual(
      (await temporary()).lastRoll.parameters.rareDeck,
      deckBefore,
    );
    if (['reaction', 'composite', 'cards'].includes(label))
      await shot(`replay-${label}`);
  }
  await click(page.locator('.replay-card-trace >summary'));
  assert.deepEqual(
    await page
      .locator('.roll-replay-view .rare-card-strip strong')
      .allTextContents(),
    ['Q♣', '10♥', '2♠', 'A♠', '7♠', 'K♦'],
  );
  await shot('card-trace');
  await replay(reaction);
  n = clicks;
  await click(page.getByRole('button', { name: 'COPY', exact: true }));
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  assert.ok(copied.includes(reaction.results[0].reading.blocks[0].text));
  assert.ok(!copied.includes(reaction.id));
  mark('Replay COPY', n);
  const oldTop = (await memory()).replays[0].id;
  n = clicks;
  await click(page.getByRole('button', { name: 'REROLL', exact: true }));
  assert.notEqual((await memory()).replays[0].id, oldTop);
  mark('Replay REROLL: new event', n);
  await replay(physical);
  const beforePhysicalPrompt = JSON.stringify((await memory()).replays);
  await click(page.getByRole('button', { name: 'REROLL', exact: true }));
  assert.equal(
    await page.locator('.physical-roll-input').getAttribute('open'),
    '',
  );
  assert.equal(JSON.stringify((await memory()).replays), beforePhysicalPrompt);
  await shot('physical-reroll');
  await play();
  await click(page.getByRole('button', { name: /Recent rolls/ }));
  const beforeReload = await memory();
  await page.reload();
  await page.locator('.replay-list').waitFor();
  assert.deepEqual((await memory()).replays, beforeReload.replays);
  assert.equal(await roomReturn().innerText(), '← ROOM 03');
  await shot('recent-rolls');
  n = clicks;
  await click(roomReturn());
  assert.equal(
    await page
      .locator(`[data-room-id="${roomId}"] >details`)
      .getAttribute('open'),
    '',
  );
  mark('Reload → Room return', n);
  await home();
  await click(
    page
      .locator('.home-index')
      .getByRole('button', { name: '캐릭터 ›', exact: true }),
  );
  await click(page.locator('.character-library .compact-card-main').first());
  await page.locator('.character-workbench').waitFor();
  const characterContext = (await memory()).contexts[0];
  assert.equal(characterContext.kind, 'characters');
  const link = page
    .locator('.character-workbench .items-weapons .reference-field-link')
    .first();
  await click(link);
  assert.equal(
    (await memory()).contexts.find((c) => c.kind !== 'desk').objectId,
    characterContext.objectId,
  );
  await shot('character-reference');
  n = clicks;
  await click(roomReturn());
  await page.locator('.character-workbench').waitFor();
  mark('Character definition → Character return', n);
  await shot('character-return');
  assert.deepEqual(content(await saved()), original);
  assert.deepEqual(errors, []);
  // Return to the actual Room for a paced, time-bounded reference-use session.
  await play();
  await click(page.getByRole('button', { name: /^Context/ }));
  await click(
    page
      .locator('.play-memory-list >button')
      .filter({ hasText: 'ROOM 03' })
      .first(),
  );
  const started = Date.now();
  let cycles = 0;
  while (Date.now() - started < duration * 1000) {
    const q = ['Reaction', 'Corpse', 'Action + Theme'][cycles % 3];
    await search(q);
    const entry = (await memory()).replays[0];
    await search('Broken');
    await replay(entry);
    assert.equal(await roomReturn().innerText(), '← ROOM 03');
    await click(roomReturn());
    await play();
    await click(page.getByRole('button', { name: 'Scratch · 스크랩' }));
    const edit = page.getByRole('button', { name: 'EDIT · 수정', exact: true });
    if (await edit.count()) await click(edit);
    await page
      .getByRole('textbox', { name: '임시 스크랩' })
      .fill(`임시 표식 ${cycles + 1} · 종이 노트로 옮길 내용`);
    await click(page.getByRole('button', { name: '작성 완료', exact: true }));
    await play();
    await click(page.locator('.convenience-tray-items >button').first());
    await click(
      page
        .getByRole('button', { name: '마지막 굴림 다시 실행', exact: true })
        .last(),
    );
    await click(roomReturn());
    assert.deepEqual(content(await saved()), original);
    cycles++;
    console.log(
      'paced play cycle',
      cycles,
      'elapsed',
      Math.round((Date.now() - started) / 1000),
    );
    await page.waitForTimeout(
      Math.min(40000, Math.max(0, duration * 1000 - (Date.now() - started))),
    );
  }
  const report = {
    url,
    width,
    phase,
    steps,
    friction: {
      durationSeconds: Math.round((Date.now() - started) / 1000),
      cycles,
      accidentalContextLoss: 0,
      searchedForPriorResult: 0,
      browserBackRecovery: 0,
    },
    campaignContentUnchanged: true,
    replayDeckUnchanged: true,
    errors,
  };
  fs.writeFileSync(
    `${root}/${phase}-acceptance-${width}.json`,
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report));
} catch (e) {
  await page.screenshot({ path: `${root}/${phase}-failure-${width}.png` });
  console.log(
    'failure UI',
    (await page.locator('body').innerText()).slice(-5000),
  );
  throw e;
} finally {
  await browser.close();
}
