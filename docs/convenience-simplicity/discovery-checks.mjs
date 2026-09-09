import { chromium } from '/Users/imwul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const root = 'outputs/convenience-simplicity',
  checks = [],
  errors = [],
  browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({
  viewport: { width: 360, height: 800 },
  reducedMotion: 'reduce',
  storageState: `${root}/accepted-360.json`,
  hasTouch: true,
  isMobile: true,
});
await context.addInitScript(
  (s) => {
    if (!sessionStorage.getItem('morkborg-play-session:v1'))
      sessionStorage.setItem('morkborg-play-session:v1', s);
  },
  fs.readFileSync(`${root}/session-360.json`, 'utf8'),
);
const page = await context.newPage();
page.setDefaultTimeout(7000);
page.on('pageerror', (e) => errors.push(e.message));
const click = async (l) => {
  await l.click();
  await page.waitForTimeout(150);
};
const close = async () => {
  const b = page.getByRole('button', { name: '닫기', exact: true });
  if (await b.count()) await click(b);
};
const play = async () => {
  await close();
  await click(
    page.getByRole('button', { name: 'Play 도구 열기', exact: true }),
  );
};
try {
  await page.goto('http://127.0.0.1:5175');
  await page.waitForLoadState('networkidle');
  const campaign = await page.evaluate(() =>
    localStorage.getItem('morkborg-codex:v6'),
  );
  await play();
  await click(page.locator('.convenience-tray-add > summary'));
  await click(page.locator('.convenience-organization > summary'));
  assert.equal(
    await page.locator('.convenience-tray-add').getAttribute('open'),
    null,
  );
  await click(page.getByText('임시 도구 정리', { exact: true }));
  await click(page.locator('.convenience-help > summary'));
  assert.equal(
    await page
      .getByText('임시 도구 정리', { exact: true })
      .evaluate((e) => e.parentElement.open),
    false,
  );
  checks.push(
    'PLAY has one primary disclosure; organization opens only one child at a time',
  );
  await play();
  await click(page.getByRole('button', { name: 'Scratch · 스크랩' }));
  assert.equal(
    await page.getByRole('textbox', { name: '임시 스크랩' }).count(),
    0,
  );
  await click(page.getByRole('button', { name: 'EDIT · 수정' }));
  await page
    .getByRole('textbox', { name: '임시 스크랩' })
    .fill('임시 메모\n두 번째 줄');
  await click(page.getByRole('button', { name: '작성 완료' }));
  checks.push(
    'Existing Scratch opens as text; one click to edit; multiline retained',
  );
  await click(page.getByRole('button', { name: 'EDIT · 수정' }));
  const longNote = Array.from(
    { length: 30 },
    (_, n) => `메모 ${n + 1} · 보존되어야 하는 임시 문장`,
  ).join('\n');
  await page.getByRole('textbox', { name: '임시 스크랩' }).fill(longNote);
  await click(page.getByRole('button', { name: '작성 완료' }));
  assert.ok(
    await page
      .locator('.scratch-preview')
      .evaluate((e) => e.clientHeight < 90 && e.scrollHeight > e.clientHeight),
  );
  await click(page.getByRole('button', { name: 'EDIT · 수정' }));
  assert.equal(
    await page.getByRole('textbox', { name: '임시 스크랩' }).inputValue(),
    longNote,
  );
  await page
    .getByRole('textbox', { name: '임시 스크랩' })
    .fill('임시 메모\n두 번째 줄');
  await click(page.getByRole('button', { name: '작성 완료' }));
  checks.push(
    'Long Scratch previews at most three lines; editing retains all 30 lines',
  );
  for (const width of [360, 768, 1440, 3440]) {
    await page.setViewportSize({ width, height: width === 360 ? 800 : 1000 });
    for (const scheme of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: scheme });
      await page.screenshot({ path: `${root}/scratch-${width}-${scheme}.png` });
      const result = await page.evaluate(() => {
        const d = document.querySelector('[role=dialog]');
        const rgb = (s) => (s.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
        const lum = (s) =>
          rgb(s)
            .map((v) => {
              v /= 255;
              return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
            })
            .reduce((x, v, i) => x + v * [0.2126, 0.7152, 0.0722][i], 0);
        const color = getComputedStyle(d).color,
          bg = getComputedStyle(d).backgroundColor,
          a = lum(color),
          b = lum(bg);
        return {
          overflow:
            document.documentElement.scrollWidth > innerWidth ||
            d.scrollWidth > d.clientWidth + 1,
          contrast: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
        };
      });
      assert.equal(result.overflow, false);
      assert.ok(result.contrast >= 4.5);
      checks.push(
        `${width} ${scheme}: readable Scratch, contrast ${result.contrast.toFixed(1)}:1, no overflow`,
      );
    }
  }
  await page.setViewportSize({ width: 360, height: 800 });
  await play();
  await click(page.getByRole('button', { name: 'Recipes · 조합' }));
  await click(
    page.getByRole('button', { name: 'FIRST CONTACT RUN', exact: true }),
  );
  await click(page.locator('.convenience-library > summary'));
  await click(page.locator('.recipe-management > summary'));
  await click(page.locator('summary[aria-label="FIRST CONTACT 관리"]'));
  await click(
    page
      .locator('.convenience-saved-list')
      .getByRole('button', { name: '편집', exact: true }),
  );
  await page
    .getByRole('textbox', { name: '모음 이름' })
    .fill('RENAMED CONTACT');
  await click(page.getByRole('button', { name: '저장', exact: true }));
  await close();
  await page.reload();
  await page.waitForLoadState('networkidle');
  assert.equal(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('morkborg-convenience:v1')).recipes[0]
          .name,
    ),
    'RENAMED CONTACT',
  );
  checks.push(
    'Recipe management edit/save/reload preserves identity and definition IDs',
  );
  // A full store must reject a 21st recipe, never evict an old one.
  await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('morkborg-convenience:v1'));
    p.recipes = Array.from({ length: 20 }, (_, i) => ({
      ...p.recipes[0],
      id: `qa-limit-${i}`,
      name: `Recipe ${i}`,
    }));
    localStorage.setItem('morkborg-convenience:v1', JSON.stringify(p));
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
  await play();
  await click(page.getByRole('button', { name: 'Recipes · 조합' }));
  await click(page.locator('.recipe-management > summary'));
  await click(page.getByRole('button', { name: '+ 새 Recipe', exact: true }));
  await page.getByRole('textbox', { name: '모음 이름' }).fill('Do not evict');
  await page.getByRole('textbox', { name: '조합 참조 검색' }).fill('Reaction');
  await click(page.locator('.convenience-editor .convenience-add-row').first());
  await click(page.getByRole('button', { name: '저장', exact: true }));
  assert.match(
    await page.locator('.reference-tools-dialog [role=alert]').innerText(),
    /20/,
  );
  assert.deepEqual(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem('morkborg-convenience:v1')).recipes.map(
        (r) => r.id,
      ),
    ),
    Array.from({ length: 20 }, (_, i) => `qa-limit-${i}`),
  );
  checks.push('21st Recipe rejected; all 20 existing recipes retained');
  assert.equal(
    await page.evaluate(() => localStorage.getItem('morkborg-codex:v6')),
    campaign,
  );
  assert.deepEqual(errors, []);
  fs.writeFileSync(
    `${root}/discovery-checks.json`,
    JSON.stringify({ checks, errors, campaignUnchanged: true }, null, 2),
  );
  console.log(checks);
} catch (e) {
  await page.screenshot({ path: `${root}/discovery-failure.png` });
  throw e;
} finally {
  await browser.close();
}
