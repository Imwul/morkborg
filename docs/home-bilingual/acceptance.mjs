import { chromium } from '/Users/imwul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';

const url = process.argv[2] ?? 'http://127.0.0.1:5175';
const phase = process.argv[3] ?? 'local';
const root = 'outputs/home-bilingual';
fs.mkdirSync(root, { recursive: true });
const fixture = JSON.parse(
  fs.readFileSync('outputs/visual-quieting/after-accepted-storage.json'),
);
fixture.origins[0].origin = new URL(url).origin;
const key = 'morkborg-codex:v6';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const report = [];
const stored = (p) =>
  p.evaluate((k) => JSON.parse(localStorage.getItem(k)), key);
const content = (s) =>
  s.campaigns.map(({ workspace, ...campaign }) => campaign);
try {
  for (const width of [360, 768, 1440, 3440]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      storageState: fixture,
      reducedMotion: 'reduce',
      colorScheme: width === 768 ? 'dark' : 'light',
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.setDefaultTimeout(10000);
    let clicks = 0;
    const click = async (locator) => {
      await locator.click();
      clicks++;
    };
    const home = async () => {
      await click(page.getByRole('button', { name: '홈으로', exact: true }));
      await page.locator('.home-index').waitFor();
    };
    const snap = async (name, selector) => {
      if (selector)
        await page.locator(selector).first().scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${root}/${phase}-${name}-${width}.png` });
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        `${name} overflow ${width}`,
      );
    };
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    const initial = await stored(page);
    assert.equal(
      await page.locator('.home-records').getAttribute('open'),
      null,
    );
    assert.equal(
      await page.getByRole('textbox', { name: '작업대 검색' }).isVisible(),
      true,
    );
    await snap('home');

    // Home retains the same direct search action and reference return context.
    await page.getByRole('textbox', { name: '작업대 검색' }).fill('Reaction');
    await click(
      page.locator('.desk-search-results .reference-select-action').first(),
    );
    await page.locator('.reference-reading').waitFor();
    await click(page.getByRole('button', { name: 'COPY', exact: true }));
    await click(
      page.locator('.reference-inspector > .source-disclosure > summary'),
    );
    await click(page.getByRole('button', { name: '닫기', exact: true }));
    assert.equal(await page.locator('.home-index').isVisible(), true);
    assert.deepEqual(content(await stored(page)), content(initial));

    for (const [name, selector] of [
      ['레퍼런스 작업대', '.desk-play-tools'],
      ['Oracle 라이브러리', '.oracle-page'],
      ['자료 및 규칙', '.source-page'],
      ['City Crawl · 도시', '.city-crawl-workspace'],
    ]) {
      await click(
        page.locator('.home-index').getByRole('button', { name, exact: false }),
      );
      await page.locator(selector).waitFor();
      await home();
    }
    await click(
      page.locator('.home-index').getByRole('button', { name: 'Mythic Fate' }),
    );
    await page.locator('.fate-panel').waitFor();
    await page.keyboard.press('Escape');

    // Every existing campaign section remains reachable from Home.
    const sections = [
      ['던전 보관함', 'dungeons'],
      ['캐릭터', 'characters'],
      ['몬스터', 'monsters'],
      ['NPC', 'npcs'],
      ['조우', 'encounters'],
      ['보관한 자료', 'overview'],
      ['재앙 · 여행', 'procedures'],
      ['플레이 화면', 'play'],
      ['세션', 'sessions'],
      ['연대기', 'timeline'],
      ['실마리', 'threads'],
      ['소문', 'rumors'],
      ['유물', 'relics'],
      ['짧은 기록', 'journal'],
      ['캠페인 노트', 'notes'],
    ];
    for (const [name, section] of sections) {
      const optional = page.locator('.home-records');
      if (
        [
          'sessions',
          'timeline',
          'threads',
          'rumors',
          'relics',
          'journal',
          'notes',
        ].includes(section)
      )
        await click(optional.locator('summary'));
      await click(
        page
          .locator('.home-index')
          .getByRole('button', { name: name + ' ›', exact: true }),
      );
      await page.waitForFunction(
        ([k, section]) => {
          const s = JSON.parse(localStorage.getItem(k));
          return (
            s.campaigns.find((c) => c.id === s.activeCampaignId)?.workspace
              .section === section
          );
        },
        [key, section],
      );
      // Lazy route must finish loading rather than merely mutate the workspace.
      await page.waitForTimeout(150);
      assert.equal(await page.locator('.home-index').count(), 0);
      assert.equal(
        await page
          .locator('main')
          .innerText()
          .then((t) => t.trim().length > 30),
        true,
      );
      await home();
    }
    assert.deepEqual(content(await stored(page)), content(initial));

    await click(
      page.locator('.home-index').getByRole('button', { name: '던전 보관함' }),
    );
    await click(page.locator('.dungeon-grid .compact-card-main').first());
    await click(
      page
        .locator('.dungeon-tabs')
        .getByRole('button', { name: '개요', exact: true }),
    );
    const fields = page.locator(
      '.integrity-dossier .dossier-composition .field, .dossier-premise .field',
    );
    assert.equal(await fields.count(), 9);
    assert.equal(await fields.locator('.generated-translation').count(), 9);
    assert.equal(await fields.locator('textarea,input').count(), 0);
    assert.equal(
      await page
        .locator('[data-field=entranceCondition] .generated-translation')
        .innerText(),
      '반쯤 무너진',
    );
    const contrast = await page
      .locator('[data-field=entrance] .generated-translation')
      .evaluate((e) => ({
        text: getComputedStyle(e).color,
        paper: getComputedStyle(document.body).backgroundColor,
        size: getComputedStyle(e).fontSize,
      }));
    await snap('dungeon', '.integrity-dossier');
    const packet = page.locator('.room-packet').first();
    assert.ok(
      await packet
        .locator('.room-packet-preview .generated-translation')
        .count(),
    );
    await click(packet.locator('.room-packet-summary'));
    assert.equal(
      await packet.getByText('한국어 도움말', { exact: true }).count(),
      0,
    );
    assert.ok(
      await packet
        .locator('.room-component-reading p .generated-translation')
        .count(),
    );
    await snap('room', '.room-packet:first-child');
    await click(packet.locator('.generation-disclosure summary').first());
    assert.ok(await packet.locator('.source-disclosure-body').isVisible());

    // Returning Home must not itself reset the currently selected dungeon/room.
    const beforeHome = await stored(page);
    await home();
    assert.deepEqual(await stored(page), beforeHome);
    await page.reload();
    await page.locator('.home-index').waitFor();
    assert.deepEqual(await stored(page), beforeHome);
    assert.deepEqual(content(await stored(page)), content(initial));

    // Editing is explicit; the old translation must disappear, and the saved text must survive reload.
    await click(
      page.locator('.home-index').getByRole('button', { name: '던전 보관함' }),
    );
    await click(page.locator('.dungeon-grid .compact-card-main').first());
    const entrance = page.locator('.integrity-dossier [data-field=entrance]');
    await click(
      page
        .locator('.dungeon-tabs')
        .getByRole('button', { name: '개요', exact: true }),
    );
    await click(
      entrance.getByRole('button', { name: '입구 편집', exact: true }),
    );
    await entrance.getByRole('textbox').fill('수동으로 적은 QA 입구');
    await click(
      entrance.getByRole('button', { name: '입구 편집 완료', exact: true }),
    );
    assert.equal(await entrance.locator('.generated-translation').count(), 0);
    await page.reload();
    await page
      .locator('.home-index')
      .getByRole('button', { name: '던전 보관함' })
      .click();
    await page.locator('.dungeon-grid .compact-card-main').first().click();
    await page
      .locator('.dungeon-tabs')
      .getByRole('button', { name: '개요', exact: true })
      .click();
    assert.equal(
      await entrance
        .getByRole('button', { name: '입구 편집', exact: true })
        .innerText(),
      '수동으로 적은 QA 입구',
    );
    assert.equal(await entrance.locator('.generated-translation').count(), 0);
    assert.deepEqual(errors, []);
    report.push({
      width,
      clicks,
      translationsBeforeInteraction: 9,
      campaignContentPreservedBeforeIntentionalEdit: true,
      homePreservesWorkspace: true,
      manualEditSurvivesReload: true,
      contrast,
      errors,
    });
    await context.close();
  }

  // Fresh profile: no hidden campaign requirement for search and no dead Home destinations.
  const fresh = await browser.newContext({
    viewport: { width: 360, height: 900 },
    reducedMotion: 'reduce',
    colorScheme: 'dark',
  });
  const page = await fresh.newPage();
  page.setDefaultTimeout(10000);
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: `${root}/${phase}-fresh-360.png` });
  assert.equal(
    await page
      .getByRole('button', { name: '마지막 굴림 다시 실행', exact: true })
      .count(),
    0,
  );
  assert.equal(
    await page.locator('.reference-home [aria-label="고정한 표"]').isVisible(),
    false,
  );
  await page
    .locator('.home-index')
    .getByRole('button', { name: '캐릭터 ›', exact: true })
    .click();
  await page.locator('.home-destination-note').waitFor();
  assert.ok(
    (await page.locator('.home-destination-note').innerText()).includes(
      '캐릭터',
    ),
  );
  await page
    .getByRole('button', { name: '새 캠페인', exact: false })
    .first()
    .click();
  await page.locator('#create-title').fill('Home route QA');
  await page.getByRole('button', { name: '캠페인 만들기' }).click();
  await page.waitForFunction(
    (k) =>
      JSON.parse(localStorage.getItem(k)).campaigns[0]?.workspace.section ===
      'characters',
    key,
  );
  await page.getByRole('heading', { name: '남겨진 자들.' }).waitFor();
  report.push({ freshCampaignCreationResumesRequestedSection: true });
  await fresh.close();
  fs.writeFileSync(
    `${root}/${phase}-acceptance.json`,
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
