/** Real UI follow-through from a generated disposable Character. No state injection. */
import { writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const { chromium } = await import(
  process.env.AUDIT_PLAYWRIGHT_MODULE || 'playwright'
);
const out = 'outputs/pdf-remediation-batch-1';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({
  storageState: out + '/generated-character-storage.json',
  viewport: { width: 1440, height: 1000 },
  reducedMotion: 'reduce',
});
const page = await context.newPage();
page.setDefaultTimeout(8000);
const errors = [],
  records = [];
page.on('pageerror', (e) => errors.push(e.message));
const campaignTitle = 'PDF Batch 1 · isolated QA';
async function openCharacter() {
  if (
    !(await page.getByRole('button', { name: '캐릭터', exact: true }).count())
  ) {
    await page
      .getByRole('button', { name: '나의 캠페인', exact: true })
      .click();
    await page
      .getByRole('button', { name: campaignTitle, exact: true })
      .click();
  }
  await page.getByRole('button', { name: '캐릭터', exact: true }).click();
  await page
    .locator('.character-library,.character-sheet')
    .first()
    .waitFor({ state: 'attached' });
  if (!(await page.locator('.character-sheet').count())) {
    if (await page.locator('.resume-candidate').count())
      await page.locator('.resume-candidate').click();
    else
      await page
        .locator('.character-library .compact-card-main')
        .first()
        .click();
  }
  await page.locator('.character-sheet').waitFor({ state: 'visible' });
}
const readCharacter = () =>
  page.evaluate((title) => {
    const c = JSON.parse(
      localStorage.getItem('morkborg-codex:v6'),
    ).campaigns.find((c) => c.title === title);
    return c.characters[0] || c.drafts.characters;
  }, campaignTitle);
try {
  await page.goto(process.env.AUDIT_URL || 'http://127.0.0.1:5174');
  await page.waitForLoadState('networkidle');
  await openCharacter();
  if (
    await page.getByRole('button', { name: '캐릭터 저장', exact: true }).count()
  )
    await page
      .getByRole('button', { name: '캐릭터 저장', exact: true })
      .click();
  const before = await readCharacter();
  const specs = [
    ['Class', 'Esoteric Hermit reference', 'Esoteric Hermit', 'Omens d4'],
    ['Weapon', '무기 1 reference', 'Knife', 'Damage d4'],
    ['Armor', 'Armor · 방어구 reference', 'Light armor', '−d2'],
    ['Power', '장비 1 reference', 'Unmet Fate', 'no more than a week'],
    ['Omens', 'Omens · 징조 reference', 'Omens', 'Crit or Fumble'],
    ['Equipment', '장비 3 reference', 'Waterskin', '4 days'],
    ['Generated class item', '장비 2 reference', 'Bard of the Undying', 'Harp'],
    [
      'Starting versus purchased kit',
      'toolbox reference',
      'Toolbox',
      'Starting equipment',
    ],
  ];
  for (const [kind, label, title, required] of specs) {
    await page.getByRole('button', { name: label, exact: true }).click();
    const panel = page.locator('.reference-inspector');
    await panel.waitFor({ state: 'visible' });
    await page.waitForTimeout(150);
    const text = await panel.innerText();
    if (
      !text.includes(title) ||
      !text.toLowerCase().includes(required.toLowerCase())
    )
      throw Error(kind + ' missing usable definition');
    const record = {
      kind,
      title,
      clicksFromCharacter: 1,
      returnClicks: 1,
      sourceClosed:
        (await panel.locator('.source-disclosure[open]').count()) === 0,
      usable: true,
    };
    await panel.locator('.source-disclosure > summary').first().click();
    record.sourceClicks = 1;
    record.hasPrimarySource = (
      await panel.locator('.source-disclosure[open]').innerText()
    ).includes('PRIMARY');
    if (kind === 'Power') {
      await page.screenshot({
        path: out + '/character-power-source.png',
        animations: 'disabled',
      });
      await panel
        .getByRole('button', { name: '이 표 열기 ↗', exact: true })
        .first()
        .click();
      await panel
        .locator('.reference-static-table')
        .waitFor({ state: 'visible' });
      record.sourceTableClicks = 1;
      record.sourceTableHasPower = (
        await panel.locator('.reference-static-table').innerText()
      ).includes('Unmet Fate');
      if (!record.sourceTableHasPower)
        throw Error('Power source table not inspectable');
    }
    await panel.getByRole('button', { name: '닫기', exact: true }).click();
    await page.locator('.character-sheet').waitFor({ state: 'visible' });
    records.push(record);
  }
  const responsive = [];
  for (const width of [360, 768, 1440, 3440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(250);
    responsive.push({
      width,
      documentOverflow: await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    });
    await page.screenshot({
      path: `${out}/character-${width}.png`,
      animations: 'disabled',
    });
  }
  const afterLinks = await readCharacter();
  if (JSON.stringify(before) !== JSON.stringify(afterLinks))
    throw Error('Lookup modified Character');
  await page.reload();
  await page.waitForLoadState('networkidle');
  const afterReload = await readCharacter();
  if (JSON.stringify(before) !== JSON.stringify(afterReload))
    throw Error('Reload modified Character');
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openCharacter();
  if (
    !(await page.locator('.character-sheet').innerText()).includes(before.name)
  )
    throw Error('Saved Character not readable on return');
  await context.storageState({
    path: out + '/accepted-character-storage.json',
    indexedDB: true,
  });
  writeFileSync(
    out + '/private-character-before.json',
    JSON.stringify(before, null, 2) + '\n',
  );
  writeFileSync(
    'docs/pdf-remediation-batch-1/browser-character.json',
    JSON.stringify(
      {
        testedAt: new Date().toISOString(),
        method:
          'Generated Esoteric Hermit in a disposable campaign, saved through UI. Each link opens and closes its inspector. Read-only localStorage comparison before/after links/reload.',
        records,
        responsive,
        unchangedAfterLinks: true,
        unchangedAfterReload: true,
        savedCharacterVisible: true,
        characterSha256: createHash('sha256')
          .update(JSON.stringify(before))
          .digest('hex'),
        errors,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(
    'Character follow-through:',
    records.length,
    'unchanged after reload; errors:',
    errors.length,
  );
} finally {
  await browser.close();
}
