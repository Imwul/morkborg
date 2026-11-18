import assert from 'node:assert/strict';

const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ?? 'playwright'
);
const browser = await chromium.launch();
const sources = Promise.withResolvers();
try {
  const page = await browser.newPage({
    viewport: { width: 390, height: 1142 },
  });
  await page.route(
    /\/(?:api\/rulebook-data|rules\/(?:library|oracles)\.json)(?:\?.*)?$/,
    async (route) => {
      await sources.promise;
      await route.continue();
    },
  );
  await page.goto(process.env.REFERENCE_URL ?? 'http://127.0.0.1:5173/', {
    waitUntil: 'domcontentloaded',
  });

  const characterShortcut =
    '[data-shortcut="procedure:character.core-classless"]';
  const homeCharacter = page.locator(
    `.desk-home-generator-grid ${characterShortcut}`,
  );
  await homeCharacter.waitFor();
  assert.equal(await homeCharacter.isEnabled(), false);
  await page
    .getByRole('navigation', { name: '주요 페이지' })
    .getByRole('button', { name: '생성기', exact: true })
    .click();
  const character = page.locator(`.desk-generators ${characterShortcut}`);
  await character.waitFor();
  assert.equal(await character.isEnabled(), false);

  sources.resolve();
  await character.click();
  const navigation = page.getByRole('navigation', { name: '생성기 탐색' });
  const current = page.getByRole('region', { name: '현재 참조', exact: true });
  const related = page.getByRole('region', { name: '관련 참조', exact: true });
  await current.getByRole('heading', { name: '캐릭터', exact: true }).waitFor();

  for (const width of [390, 1899, 1900, 2613, 3440]) {
    await page.setViewportSize({ width, height: 1142 });
    const [back, main, references] = await Promise.all([
      navigation.boundingBox(),
      current.boundingBox(),
      related.boundingBox(),
    ]);
    assert.ok(back && main && references);
    assert.ok(Math.abs(main.x - back.x) < 1 && main.y >= back.y + back.height);
    if (width >= 1900) {
      assert.ok(references.x >= main.x + main.width);
      assert.ok(Math.abs(references.y - main.y) < 1);
    } else {
      assert.ok(Math.abs(references.x - main.x) < 1);
      assert.ok(references.y >= main.y + main.height);
    }
  }

  await navigation.getByRole('button', { name: /생성기 목록으로/ }).click();
  await character.waitFor();
} finally {
  sources.resolve();
  await browser.close();
}
