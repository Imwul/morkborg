import { chromium } from '/Users/imwul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const root = 'outputs/convenience-simplicity',
  report = [],
  browser = await chromium.launch({ channel: 'chrome', headless: true });
const fixture = JSON.parse(
  fs.readFileSync('outputs/convenience-layer/accepted-storage.json'),
);
for (const width of [360, 1440]) {
  const context = await browser.newContext({
    viewport: { width, height: width === 360 ? 800 : 1000 },
    storageState: fixture,
    reducedMotion: 'reduce',
    permissions: ['clipboard-read', 'clipboard-write'],
    isMobile: width === 360,
    hasTouch: width === 360,
  });
  const page = await context.newPage(),
    errors = [],
    steps = [];
  let clicks = 0;
  page.on('pageerror', (e) => errors.push(e.message));
  page.setDefaultTimeout(7000);
  const click = async (l) => {
    await l.click();
    clicks++;
    await page.waitForTimeout(100);
  };
  const record = (name, start, extra = {}) =>
    steps.push({ name, clicks: clicks - start, ...extra });
  const close = async () => {
    const b = page.getByRole('button', { name: '닫기', exact: true });
    if (await b.count()) await click(b);
  };
  const play = async () => {
    if (await page.locator('.reference-tools-dialog').count()) {
      const b = page.getByRole('button', { name: '‹ PLAY', exact: true });
      if (await b.count()) await click(b);
    } else
      await click(
        page.getByRole('button', {
          name: (await page.locator('[role=dialog]').count())
            ? '창 안에서 Play 도구'
            : 'Play 도구 열기',
          exact: true,
        }),
      );
  };
  const state = () =>
    page.evaluate(() => ({
      campaign: localStorage.getItem('morkborg-codex:v6'),
      prefs: JSON.parse(
        localStorage.getItem('morkborg-convenience:v1') ?? '{}',
      ),
      session: JSON.parse(
        sessionStorage.getItem('morkborg-play-session:v1') ?? '{}',
      ),
    }));
  const search = async (q) => {
    await close();
    await page.getByRole('textbox', { name: '작업대 검색' }).fill(q);
    await click(
      page.locator('.desk-search-results .reference-select-action').first(),
    );
  };
  const visible = async (l) => l.isVisible();
  try {
    await page.goto('http://127.0.0.1:5175');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      localStorage.removeItem('morkborg-convenience:v1');
      localStorage.removeItem('morkborg-reference-desk:v1');
      sessionStorage.removeItem('morkborg-play-session:v1');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
    const baseline = (await state()).campaign;
    assert.equal(
      await visible(page.getByRole('textbox', { name: '작업대 검색' })),
      true,
    );
    assert.equal(
      await page.getByRole('button', { name: '마지막 굴림 다시 실행' }).count(),
      0,
    );
    assert.equal(await page.locator('.desk-pack-choice').count(), 0);
    assert.equal(await visible(page.locator('.play-discovery-hint')), true);
    assert.equal(await page.locator('[role=dialog]').count(), 0);
    record('Fresh: search, no Last/Pack/forms/tutorial', clicks);
    let n = clicks;
    await search('Reaction');
    record('Search Reaction → ROLL', n);
    assert.equal(await page.locator('.partial-roll-controls').count(), 0);
    assert.equal(
      await visible(page.locator('.physical-roll-input input')),
      false,
    );
    assert.equal(
      await visible(
        page
          .locator('.reference-inner-tray')
          .getByRole('button', { name: '마지막 굴림 다시 실행' }),
      ),
      true,
    );
    n = clicks;
    await click(page.getByRole('button', { name: 'COPY', exact: true }));
    assert.ok(
      (await page.evaluate(() => navigator.clipboard.readText())).length,
    );
    record('COPY', n);
    n = clicks;
    await click(page.locator('.reference-convenience-actions > summary'));
    await click(
      page.getByRole('button', {
        name: 'ADD TO PLAY · PLAY에 추가',
        exact: true,
      }),
    );
    record('Result → ADD TO PLAY', n);
    n = clicks;
    await play();
    assert.equal(await page.locator('.play-discovery-hint').count(), 0);
    assert.equal((await state()).prefs.playOpened, true);
    assert.equal(await page.locator('.convenience-tabs').count(), 0);
    assert.equal(
      await visible(page.getByRole('textbox', { name: 'Tray 참조 검색' })),
      false,
    );
    assert.equal(
      await visible(page.getByRole('button', { name: 'Packs · 모음' })),
      false,
    );
    record('PLAY: compact overview, management closed', n);
    n = clicks;
    await click(
      page.getByRole('button', { name: 'Physical Roll · 실물 주사위 입력' }),
    );
    assert.equal(
      await visible(page.locator('.physical-roll-input input')),
      true,
    );
    await page.locator('.physical-roll-input input').fill('3,4');
    await click(page.getByRole('button', { name: '결과 확인', exact: true }));
    assert.equal((await state()).session.lastRoll.mode, 'USER_ROLL');
    record('PLAY → current physical roll → resolve', n);
    await click(
      page.locator('.reference-inspector > .source-disclosure > summary'),
    );
    assert.match(
      await page.locator('.source-disclosure[open]').innerText(),
      /USER_ROLL|MANUAL|실물/,
    );
    await close();
    await play();
    await click(page.getByRole('button', { name: 'Scratch · 스크랩' }));
    await page
      .getByRole('textbox', { name: '임시 스크랩' })
      .fill('검은 문은 아직 열지 않음');
    await click(page.getByRole('button', { name: '작성 완료' }));
    assert.equal(
      await page.getByRole('textbox', { name: '임시 스크랩' }).count(),
      0,
    );
    assert.equal(await visible(page.locator('.scratch-preview')), true);
    record('Scratch: write → compact read mode', clicks - 3);
    await play();
    await click(page.getByRole('button', { name: 'Recipes · 조합' }));
    assert.equal(
      await page.getByRole('textbox', { name: '모음 이름' }).count(),
      0,
    );
    await click(page.getByRole('button', { name: '+ 만들기', exact: true }));
    await page
      .getByRole('textbox', { name: '모음 이름' })
      .fill('FIRST CONTACT');
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
    assert.equal((await state()).prefs.recipes.length, 1);
    n = clicks;
    await click(
      page.getByRole('button', { name: 'FIRST CONTACT RUN', exact: true }),
    );
    record('Existing Recipe → RUN', n);
    assert.equal(await page.locator('.recipe-result').count(), 3);
    assert.equal(
      await page
        .getByRole('button', { name: 'Recipe 결과 1 고정', exact: true })
        .count(),
      0,
    );
    assert.equal(
      await visible(page.getByRole('textbox', { name: '모음 이름' })),
      false,
    );
    await click(page.locator('.recipe-hold-discovery'));
    await click(
      page.getByRole('button', { name: 'Recipe 결과 1 고정', exact: true }),
    );
    const firstText = await page.locator('.recipe-result').first().innerText();
    await click(
      page.getByRole('button', { name: 'RUN · 고정 제외', exact: true }),
    );
    assert.equal(
      await page.locator('.recipe-result').first().innerText(),
      firstText,
    );
    record(
      'Recipe HOLD opt-in → independent reroll preserves held result',
      clicks - 3,
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
      .fill('사용자 직접 메모');
    await click(page.getByRole('button', { name: '적용 · 고정' }));
    await click(
      page.getByRole('button', { name: 'RUN · 고정 제외', exact: true }),
    );
    assert.equal(
      await page.locator('.recipe-manual-text').innerText(),
      '사용자 직접 메모',
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
    await play();
    await click(page.locator('.convenience-organization > summary'));
    await click(page.getByRole('button', { name: 'Packs · 모음' }));
    await click(page.getByRole('button', { name: 'City · 도시', exact: true }));
    await close();
    assert.equal((await state()).prefs.activePackId, 'pack:city');
    n = clicks;
    await search('Broken');
    assert.match(
      await page.locator('.reference-inspector').innerText(),
      /0 HP|0HP|0 HP/,
    );
    record('Active City pack → global Broken lookup', n);
    await close();
    const prior = await state();
    assert.equal(prior.campaign, baseline);
    await page.reload();
    await page.waitForLoadState('networkidle');
    const reloaded = await state();
    assert.deepEqual(reloaded.prefs, prior.prefs);
    assert.deepEqual(reloaded.session, prior.session);
    assert.equal(await page.locator('.play-discovery-hint').count(), 0);
    record(
      'Reload: preferences, Tray, Scratch, Last preserved; Campaign byte-identical',
      clicks,
    );
    n = clicks;
    await search('Reaction');
    record('Experienced Search → ROLL', n);
    await close();
    n = clicks;
    await click(
      page
        .locator('.reference-rail .reference-play-tray')
        .getByRole('button', { name: 'Reaction', exact: true }),
    );
    record('Experienced populated Tray → ROLL', n);
    await close();
    n = clicks;
    await click(
      page
        .locator('.reference-rail')
        .getByRole('button', { name: '마지막 굴림 다시 실행', exact: true }),
    );
    record('Experienced Last → ROLL', n);
    await close();
    await page.getByRole('textbox', { name: '작업대 검색' }).focus();
    await page.keyboard.press('r');
    assert.equal(await page.locator('[role=dialog]').count(), 0);
    await page
      .getByRole('textbox', { name: '작업대 검색' })
      .evaluate((e) => e.blur());
    await page.keyboard.press('r');
    assert.equal(await page.locator('.reference-reading').count(), 1);
    await close();
    record('R works outside text; suppressed inside input', clicks);
    await search('Action + Theme');
    assert.equal(await page.locator('.partial-roll-controls').count(), 1);
    assert.equal(await visible(page.locator('.held-component').first()), false);
    await click(page.locator('.partial-roll-controls > summary'));
    await click(
      page.locator('.held-component').first().getByRole('button').first(),
    );
    const action = await page
      .locator('.held-component')
      .first()
      .locator('b')
      .innerText();
    await click(
      page.locator('.held-component').nth(1).getByRole('button').nth(1),
    );
    assert.equal(
      await page.locator('.held-component').first().locator('b').innerText(),
      action,
    );
    record(
      'Multi-result HOLD hidden until requested, held Action survives Theme reroll',
      clicks - 3,
    );
    await close();
    await play();
    await click(
      page.getByRole('button', { name: 'Physical Roll · 실물 주사위 입력' }),
    );
    await page
      .getByRole('textbox', { name: '실물 입력 표 검색' })
      .fill('Building Type');
    await click(
      page.locator('.convenience-physical-picker .convenience-add-row').first(),
    );
    await page.locator('.physical-roll-input input').fill('78');
    await click(page.getByRole('button', { name: '결과 확인', exact: true }));
    assert.equal(
      await visible(page.locator('.physical-roll-input [role=alert]')),
      true,
    );
    await page.locator('.physical-roll-input input').fill('35');
    await click(page.getByRole('button', { name: '결과 확인', exact: true }));
    assert.equal((await state()).session.lastRoll.inputs['0'], '35');
    await close();
    n = clicks;
    await click(
      page
        .locator('.reference-rail')
        .getByRole('button', { name: '마지막 굴림 다시 실행' }),
    );
    assert.equal(
      await page.locator('.physical-roll-input input').inputValue(),
      '35',
    );
    record('Manual Last reopens physical input without digital roll', n);
    assert.equal((await state()).campaign, baseline);
    assert.deepEqual(errors, []);
    await context.storageState({ path: `${root}/accepted-${width}.json` });
    fs.writeFileSync(
      `${root}/session-${width}.json`,
      JSON.stringify((await state()).session),
    );
    report.push({ width, steps, clicks, errors, campaignUnchanged: true });
  } catch (e) {
    await page.screenshot({ path: `${root}/acceptance-failure-${width}.png` });
    throw e;
  } finally {
    await context.close();
  }
}
await browser.close();
fs.writeFileSync(`${root}/acceptance.json`, JSON.stringify(report, null, 2));
console.log(
  report.map((r) => ({
    width: r.width,
    checks: r.steps.length,
    clicks: r.clicks,
    errors: r.errors,
  })),
);
