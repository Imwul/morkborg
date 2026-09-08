import { writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const { chromium } = await import(
  process.env.AUDIT_PLAYWRIGHT_MODULE || 'playwright'
);
const b = await chromium.launch({ channel: 'chrome', headless: true });
const p = await b.newPage({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: 'reduce',
});
p.setDefaultTimeout(10000);
const records = [],
  errors = [],
  out = 'outputs/pdf-remediation-batch-2';
let failure;
p.on('pageerror', (e) => errors.push(e.message));
try {
  await p.goto(process.env.AUDIT_URL || 'http://127.0.0.1:5174');
  await p.waitForLoadState('networkidle');
  await p
    .getByRole('button', { name: 'Mythic 패널 열기', exact: true })
    .click();
  const fate = p.locator('#mythic-panel');
  await fate.getByRole('button', { name: '장면 판정', exact: true }).click();
  await fate.getByRole('checkbox', { name: '직접 굴린 주사위 입력' }).check();
  await fate
    .getByRole('spinbutton', { name: '첫 번째 주사위', exact: true })
    .fill('2');
  await fate
    .getByRole('button', { name: '입력한 값으로 판정', exact: true })
    .click();
  await fate
    .getByRole('button', { name: '사건 단서 굴리기', exact: true })
    .click();
  assert.equal(await fate.locator('.fate-event > div').count(), 3);
  const next = fate.locator('.reference-next-steps button').first();
  await next.click();
  const inspector = p.locator('.reference-inspector');
  await inspector.waitFor();
  assert.ok((await inspector.innerText()).includes('Mythic'));
  records.push({
    test: 'Mythic panel: manual d10=2 → Interrupt → Focus + two Meaning words → next reference',
    setupClicks: 4,
    diceTextEntry: true,
    eventRollClicks: 1,
    nextReferenceClicks: 1,
    passed: true,
  });
  await inspector.getByRole('button', { name: '닫기', exact: true }).click();
  assert.equal(await fate.locator('.fate-event > div').count(), 3);
  await fate
    .getByRole('spinbutton', { name: '첫 번째 주사위', exact: true })
    .fill('3');
  await fate
    .getByRole('button', { name: '입력한 값으로 판정', exact: true })
    .click();
  await fate
    .locator('.reference-next-steps')
    .getByRole('button', { name: 'Mythic Altered Scene ›', exact: true })
    .click();
  assert.match(await inspector.innerText(), /Ignore and reroll further 7–10/);
  records.push({
    test: 'Mythic panel: manual d10=3 → Altered → source-defined scene follow-through',
    resolveClicks: 1,
    nextReferenceClicks: 1,
    passed: true,
  });
  await inspector.getByRole('button', { name: '닫기', exact: true }).click();
  for (const width of [360, 768, 1440, 3440]) {
    await p.setViewportSize({ width, height: 900 });
    await p.waitForTimeout(180);
    const overflow = await fate.evaluate(
      (e) =>
        e.scrollWidth > e.clientWidth + 1 ||
        document.documentElement.scrollWidth > innerWidth,
    );
    assert.equal(overflow, false);
    await p.screenshot({
      path: `${out}/mythic-panel-${width}.png`,
      animations: 'disabled',
    });
    records.push({
      test: 'Actual Mythic panel responsive follow-through',
      width,
      overflow,
      passed: true,
    });
  }
  await fate.getByRole('button', { name: '닫기', exact: true }).click();
  await p.setViewportSize({ width: 360, height: 900 });
  await p
    .getByRole('textbox', { name: '작업대 검색' })
    .fill('Rare Monster Five Cards');
  await p
    .locator('.desk-search-results .reference-select-action')
    .first()
    .click();
  const cards = await inspector
    .locator('.rare-card-strip strong')
    .allTextContents();
  await inspector.locator('.source-disclosure > summary').click();
  assert.match(
    await inspector.locator('.source-disclosure').innerText(),
    /Card 1:/,
  );
  assert.equal(
    await inspector.evaluate((e) => e.scrollWidth > e.clientWidth + 1),
    false,
  );
  await p.screenshot({
    path: out + '/card-source-360.png',
    animations: 'disabled',
  });
  await inspector
    .getByRole('button', { name: '이 표 열기 ↗', exact: true })
    .first()
    .click();
  await inspector
    .getByRole('button', { name: '이전 참조', exact: true })
    .click();
  assert.deepEqual(
    await inspector.locator('.rare-card-strip strong').allTextContents(),
    cards,
  );
  records.push({
    test: 'Mobile card source → table → Back',
    sourceClicks: 1,
    tableClicks: 1,
    backClicks: 1,
    cardsUnchanged: true,
    overflow: false,
    passed: true,
  });
  assert.deepEqual(errors, []);
} catch (e) {
  failure = String(e.stack || e);
  console.error(failure);
  process.exitCode = 1;
  await p.screenshot({ path: out + '/mythic-failure.png' });
} finally {
  writeFileSync(
    'docs/pdf-remediation-batch-2/browser-mythic.json',
    JSON.stringify(
      { testedAt: new Date().toISOString(), records, errors, failure },
      null,
      2,
    ) + '\n',
  );
  await b.close();
}
