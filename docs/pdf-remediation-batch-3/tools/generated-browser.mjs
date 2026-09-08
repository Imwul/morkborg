/** Actual fresh UI generation in an isolated browser context; never inject generated values. */
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const { chromium } = await import(
  process.env.AUDIT_PLAYWRIGHT_MODULE ||
    '/Users/imwul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
);
const url = process.env.AUDIT_URL || 'http://127.0.0.1:5174';
const out = 'outputs/pdf-remediation-batch-3';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: 'reduce',
});
const page = await context.newPage();
page.setDefaultTimeout(15000);
const records = [],
  visual = [],
  actions = [],
  errors = [];
page.on('pageerror', (e) => errors.push(e.message));
const title = 'PDF Batch 3 · generated UI QA';
const panel = () => page.locator('.reference-inspector');
const digest = (v) =>
  createHash('sha256').update(JSON.stringify(v)).digest('hex');
const getCampaign = () =>
  page.evaluate(
    (title) =>
      JSON.parse(localStorage.getItem('morkborg-codex:v6')).campaigns.find(
        (c) => c.title === title,
      ),
    title,
  );
const getCharacter = async () => {
  const c = await getCampaign();
  return c.characters[0] || c.drafts.characters;
};
async function click(locator, action) {
  await locator.click();
  actions.push({ kind: 'click', action });
}
async function capture(name, inspector = false) {
  for (const width of [360, 768, 1440, 3440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(220);
    await page.evaluate(() => scrollTo(0, 0));
    if (name === 'generated-rooms')
      await page
        .locator('.room-packet-grid')
        .evaluate((e) =>
          scrollTo(0, e.getBoundingClientRect().top + scrollY - 72),
        );
    if (name === 'generated-character-kit')
      await page
        .locator('.character-sheet-kit')
        .evaluate((e) =>
          scrollTo(0, e.getBoundingClientRect().top + scrollY - 72),
        );
    if (inspector) await panel().evaluate((e) => (e.scrollTop = 0));
    const metrics = await page.evaluate(() => ({
      documentOverflow: document.documentElement.scrollWidth > innerWidth,
      bodyWidth: document.documentElement.scrollWidth,
    }));
    if (inspector)
      metrics.inspectorOverflow = await panel().evaluate(
        (e) => e.scrollWidth > e.clientWidth + 1,
      );
    assert.equal(metrics.documentOverflow, false, name + ' ' + width + ' page');
    if (inspector)
      assert.equal(
        metrics.inspectorOverflow,
        false,
        name + ' ' + width + ' inspector',
      );
    const path = `${out}/${name}-${width}.png`;
    await page.screenshot({ path, animations: 'disabled' });
    visual.push({ name, width, ...metrics, path });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.waitForTimeout(150);
}
async function openLink(
  locator,
  kind,
  { required, source = true, visualName } = {},
) {
  const before = await getCampaign();
  await click(locator, kind + ' → definition');
  await panel().waitFor();
  const text = await panel().innerText();
  const heading = await panel().locator('h2').first().innerText();
  const reading = panel().locator('.reference-reading');
  assert.ok(await reading.count(), kind + ' reading');
  assert.ok(
    (await reading.innerText()).trim().length > 0,
    kind + ' usable text',
  );
  if (required) assert.match(text, required, kind + ' required mechanic');
  assert.equal(
    await panel().locator('.source-disclosure[open]').count(),
    0,
    kind + ' source initially closed',
  );
  const record = {
    kind,
    title: heading,
    clicksToDefinition: 1,
    usableReading: true,
    sourceInitiallyClosed: true,
    koreanHelperVisible: (await reading.locator('[lang=ko]').count()) > 0,
  };
  if (visualName) await capture(visualName, true);
  if (source) {
    await click(
      panel().locator('.source-disclosure > summary').first(),
      kind + ' source',
    );
    record.sourceClicks = 1;
    assert.match(
      await panel().locator('.source-disclosure[open]').innerText(),
      /PRIMARY/,
    );
    record.primarySourceVisible = true;
  }
  await click(
    panel().getByRole('button', { name: '닫기', exact: true }),
    kind + ' → return',
  );
  record.returnClicks = 1;
  assert.equal(
    digest(await getCampaign()),
    digest(before),
    kind + ' lookup mutated Campaign',
  );
  records.push(record);
  return heading;
}
let failure;
let characterBefore;
let campaignBeforeReload;
let roomRerolls = 0;
let generatedRoomLink;
try {
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  const initial = await page.evaluate(() => {
    const t = localStorage.getItem('morkborg-codex:v6');
    return t ? JSON.parse(t).campaigns : [];
  });
  assert.equal(
    initial.length,
    0,
    'isolated context must have no user Campaigns',
  );
  await click(
    page.getByRole('button', { name: '나의 캠페인', exact: true }),
    'Campaign list',
  );
  await click(
    page.getByRole('button', { name: '새 캠페인', exact: true }).first(),
    'New QA Campaign',
  );
  await page.getByLabel('캠페인 제목', { exact: true }).fill(title);
  actions.push({ kind: 'text-entry', action: 'Name QA Campaign' });
  await click(
    page.getByRole('button', { name: '캠페인 만들기', exact: true }),
    'Create QA Campaign',
  );
  await click(
    page.getByRole('button', { name: '캐릭터', exact: true }),
    'Character Library',
  );
  await click(
    page.getByRole('button', { name: '직업 사용 · Class', exact: true }),
    'Use class',
  );
  await page
    .getByRole('combobox', { name: '생성 직업', exact: true })
    .selectOption('esoteric-hermit');
  actions.push({ kind: 'choice', action: 'Choose Esoteric Hermit' });
  await click(
    page.getByRole('button', { name: '새 캐릭터 생성', exact: true }),
    'Generate fresh Character',
  );
  await page.locator('.character-sheet').waitFor();
  let armorPreparationRerolls = 0;
  if ((await getCharacter()).armor === 'No armor') {
    await click(
      page.locator('.object-edit-toggle'),
      'Edit generated draft armor',
    );
    while (
      (await getCharacter()).armor === 'No armor' &&
      armorPreparationRerolls < 20
    ) {
      await click(
        page.getByRole('button', {
          name: 'Armor · 방어구 재굴림',
          exact: true,
        }),
        'Reroll armor to exercise damage-reduction definition',
      );
      armorPreparationRerolls++;
    }
    await click(
      page.locator('.object-edit-toggle'),
      'Return draft to view mode',
    );
  }
  assert.notEqual(
    (await getCharacter()).armor,
    'No armor',
    'QA sample with generated armor',
  );
  await click(
    page.getByRole('button', { name: '캐릭터 저장', exact: true }),
    'Save generated Character',
  );
  characterBefore = await getCharacter();
  writeFileSync(
    out + '/generated-character-private.json',
    JSON.stringify(characterBefore, null, 2),
  );
  await capture('generated-character');
  await capture('generated-character-kit');
  await openLink(
    page.getByRole('button', {
      name: 'Esoteric Hermit reference',
      exact: true,
    }),
    'Class',
    { required: /Omens/ },
  );
  await openLink(
    page.getByRole('button', { name: '무기 1 reference', exact: true }),
    'Weapon',
    { required: /Damage|피해/ },
  );
  await openLink(
    page.getByRole('button', { name: 'Armor · 방어구 reference', exact: true }),
    'Armor',
    { required: /Tier|단계/ },
  );
  const sourceText = (item) =>
    JSON.stringify({
      tableId: item.tableId,
      source: item.source,
      refs: item.provenance?.sourceRefs,
    });
  const powerIndex = characterBefore.equipment.findIndex((item) =>
    /core\.(sacred|unclean)/.test(sourceText(item)),
  );
  assert.ok(
    powerIndex >= 0,
    'Esoteric Hermit generated Power must retain source identity',
  );
  await openLink(
    page.getByRole('button', {
      name: `장비 ${powerIndex + 1} reference`,
      exact: true,
    }),
    'Generated Power',
    { visualName: 'generated-power' },
  );
  let equipmentOpened = false;
  for (let i = 0; i < characterBefore.equipment.length; i++) {
    if (i === powerIndex) continue;
    const link = page.getByRole('button', {
      name: `장비 ${i + 1} reference`,
      exact: true,
    });
    if (await link.count()) {
      await openLink(link, 'Generated Equipment');
      equipmentOpened = true;
      break;
    }
  }
  assert.ok(
    equipmentOpened,
    'a generated mechanical equipment link must be available',
  );
  await openLink(
    page.getByRole('button', { name: 'Omens · 징조 reference', exact: true }),
    'Omens',
    { required: /Crit|Fumble/ },
  );
  await openLink(
    page.getByRole('button', {
      name: 'Powers · 하루 사용 횟수 reference',
      exact: true,
    }),
    'Daily Powers rule',
    { required: /d4|d20/ },
  );
  await openLink(
    page.getByRole('button', {
      name: '장비 · 소지 한도 reference',
      exact: true,
    }),
    'Carrying rule',
    { required: /8/ },
  );
  assert.equal(
    digest(await getCharacter()),
    digest(characterBefore),
    'Character changed during lookups',
  );
  await click(
    page.getByRole('button', { name: '던전 보관함', exact: true }),
    'Dungeon Library',
  );
  await click(
    page.getByRole('button', { name: '새 던전', exact: true }).first(),
    'New Dungeon',
  );
  await page.locator('#candidate-region').selectOption('sarkash');
  actions.push({ kind: 'choice', action: 'Choose Sarkash' });
  await click(
    page.getByRole('button', { name: '던전 생성', exact: true }),
    'Generate fresh Dungeon',
  );
  await page.locator('.room-packet').first().waitFor();
  assert.equal(
    await page.locator('.room-packet').count(),
    4,
    'four prepared Special Rooms',
  );
  for (let i = 0; i < 4; i++)
    await click(
      page.locator('.room-packet').nth(i).locator('.room-packet-summary'),
      'Expand generated Room ' + (i + 1),
    );
  await capture('generated-rooms');
  await click(
    page.getByRole('button', { name: '이 던전 선택', exact: true }).first(),
    'Save generated Dungeon and four Rooms',
  );
  await click(
    page.locator('.dungeon-tabs').getByRole('button', { name: /^방/ }),
    'Room ledger',
  );
  await click(page.locator('.room-select').nth(1), 'Open generated Room 02');
  const roomBefore = await getCampaign();
  const roomId = roomBefore.workspace.roomId;
  await click(
    page.locator('.context-reference-disclosure > summary').first(),
    'Room Quick Tools',
  );
  await click(
    page
      .locator('.context-references')
      .getByRole('button', { name: /Useful Item/i }),
    'Roll Room-context Useful Item',
  );
  await panel().waitFor();
  let scrollLink = panel()
    .locator('.reference-reading .reference-inline-link')
    .filter({ hasText: /^scroll$/i });
  while (!(await scrollLink.count()) && roomRerolls < 12) {
    await click(
      panel().getByRole('button', { name: 'REROLL', exact: true }),
      'Reroll Room-context Useful Item',
    );
    roomRerolls++;
    await page.waitForTimeout(30);
  }
  assert.ok(
    await scrollLink.count(),
    'Room-context source procedure produces a scroll category within12 rolls',
  );
  const usefulResult = await panel().locator('.reference-reading').innerText();
  const scrollKind = /unclean/i.test(usefulResult) ? 'Unclean' : 'Sacred';
  await click(
    scrollLink.first(),
    'Generated Room-context scroll category → Scroll reference',
  );
  assert.match(
    await panel().locator('.reference-reading').innerText(),
    /50s/,
    'generic Scroll provides its own verified price only',
  );
  await click(
    panel().locator('.ref-related-disclosure > summary'),
    'Scroll related sources',
  );
  const followUp = panel()
    .locator('.ref-related-disclosure')
    .getByRole('button', { name: new RegExp(scrollKind, 'i') });
  assert.equal(
    await followUp.count(),
    1,
    'source category has a canonical follow-up',
  );
  await click(followUp, 'Choose ' + scrollKind + ' source table and roll');
  let links = panel().locator('.reference-reading .reference-inline-link');
  assert.ok(
    await links.count(),
    'actual source Power roll links its definition',
  );
  generatedRoomLink = await links.first().getAttribute('aria-label');
  records.push({
    kind: 'Room Useful Item → Scroll → appropriate Power table',
    sourceCategory: scrollKind,
    clicksFromGeneratedCategory: 3,
    meaningfulChoice: true,
    genericScrollIsNotSpecificPower: true,
    autoInferredPower: false,
    sourceInitiallyClosed: true,
    roomContextRetained: true,
  });
  await openLink(links.first(), 'Room-context generated Power definition', {
    visualName: 'generated-room-item',
  });
  assert.equal(
    (await getCampaign()).workspace.roomId,
    roomId,
    'same Room context restored',
  );
  assert.ok(
    await page.locator(`.room-packet[data-room-id="${roomId}"]`).count(),
    'same Room remains visible',
  );
  const afterCreation = await getCampaign();
  assert.equal(afterCreation.dungeons.length, 1);
  assert.equal(afterCreation.dungeons[0].rooms.length, 4);
  assert.equal(
    digest(afterCreation.characters[0]),
    digest(characterBefore),
    'Dungeon creation changed Character',
  );
  campaignBeforeReload = await getCampaign();
  await page.reload();
  await page.waitForLoadState('networkidle');
  assert.equal(
    digest(await getCampaign()),
    digest(campaignBeforeReload),
    'Reload mutated generated Campaign',
  );
  await context.storageState({
    path: out + '/generated-accepted-storage.json',
    indexedDB: true,
  });
  assert.deepEqual(errors, []);
} catch (e) {
  failure = e.message;
  await page
    .screenshot({ path: out + '/generated-failure.png', fullPage: true })
    .catch(() => {});
  writeFileSync(
    out + '/generated-failure-private.txt',
    await page
      .locator('body')
      .innerText()
      .catch(() => ''),
  );
} finally {
  const report = {
    testedAt: new Date().toISOString(),
    url,
    method:
      'Fresh Campaign, Character, and Dungeon generated entirely through actual UI in a new Chrome context. No generated-value injection, source substitution, production Campaign access, or seeding. Source IDs are read only to identify which visible equipment is the generated Power; mechanics are verified in the opened UI. Dungeon follow-through uses Useful Item from the freshly generated Room02 context, follows its actual Sacred/Unclean scroll category through the canonical Scroll related table, rolls a specific Power, then opens its definition. These are transient results and are not claimed as generated Special Room components.',
    records,
    actions,
    clickCount: actions.filter((a) => a.kind === 'click').length,
    choiceCount: actions.filter((a) => a.kind === 'choice').length,
    textEntryCount: actions.filter((a) => a.kind === 'text-entry').length,
    roomContextItemRerolls: roomRerolls,
    generatedRoomLink,
    visual,
    characterUnchangedAfterLookups: !failure && !!characterBefore,
    campaignUnchangedAfterReload: !failure && !!campaignBeforeReload,
    characterSha256: characterBefore && digest(characterBefore),
    campaignSha256: campaignBeforeReload && digest(campaignBeforeReload),
    errors,
    ...(failure ? { failure } : {}),
  };
  writeFileSync(
    'docs/pdf-remediation-batch-3/generated-browser.json',
    JSON.stringify(report, null, 2) + '\n',
  );
  await browser.close();
  console.log(
    JSON.stringify({
      checks: records.length,
      screenshots: visual.length,
      roomRerolls,
      failure,
      errors,
    }),
  );
}
if (failure) process.exitCode = 1;
