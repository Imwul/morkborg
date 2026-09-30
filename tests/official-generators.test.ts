import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { formatOfficialMessage } from '../src/domain/officialMessage.ts';
import {
  parseScvmPack,
  rollScvm,
  scvmPackPayload,
  type ScvmPack,
} from '../src/domain/scvmPack.ts';
import {
  monsterSitePackPayload,
  parseMonsterSitePack,
  rollMonsterSite,
  type MonsterSitePack,
} from '../src/domain/monsterSitePack.ts';
import { generateScvmCharacter, scvmReferenceReading } from '../src/generators/scvmCharacter.ts';
import { generateMonsterSite, monsterSiteReferenceReading } from '../src/generators/monsterSite.ts';
import { readPrivateGeneratorPack } from '../server/privateGeneratorPack.ts';
import { readPrivateScvmTranslation } from '../server/privateScvmTranslation.ts';
import { readPrivateMonsterTranslation } from '../server/privateMonsterTranslation.ts';
import { createPrivateDngngenServer } from '../server/privateDngngenServer.ts';
import type { RandomSource } from '../src/generators/random.ts';

const face = (sides: number, value: number) => (value - 0.5) / sides;
const seal = <T extends { integrity: { payloadSha256: string } }>(
  pack: T,
  payload: (pack: T) => string,
) => {
  pack.integrity.payloadSha256 = createHash('sha256').update(payload(pack)).digest('hex');
  return pack;
};

test('official messages keep apostrophes, plurals, selects and readable lists', () => {
  assert.equal(
    formatOfficialMessage("It's {tableC}.", { tableC: 'ash' }),
    "It's ash.",
  );
  assert.equal(
    formatOfficialMessage(
      '{amount, plural, one {1 arrow} other {{amount} arrows}}',
      { amount: 3 },
    ),
    '3 arrows',
  );
  assert.equal(
    formatOfficialMessage(
      '{first, select, other {Soft} hardened {Tough} } hide',
      { first: 'hardened' },
    ),
    'Tough hide',
  );
  assert.equal(
    formatOfficialMessage('<ol><li><strong>Red</strong> poison</li><li>Second</li></ol>').trim(),
    '• Red poison\n• Second',
  );
});

test('SCVMBIRTHER scroll handling follows the published string comparison', () => {
  const pack = scvmPack();
  const rolled = rollScvm(pack, () => 0, { className: 'scroll-class' });
  assert.equal(rolled.className, 'Scroll Class');
  assert.equal(rolled.weapons[0]?.startsWith('Small'), true);
  assert.equal(rolled.armor.startsWith('Light'), true);
  assert.equal(rolled.silver, 10);
  assert.equal(rolled.hp, 1);
  const character = generateScvmCharacter('11111111-1111-4111-8111-111111111111', pack, false, () => 0);
  assert.equal(character.generation?.system, 'scvmbirther');
  assert.equal(character.weapons[0]?.damage, 'd6');
  const reading = scvmReferenceReading(pack);
  assert.equal(reading.procedureInputs?.generator, 'scvmbirther');
  assert.equal(reading.blocks[0]?.text, 'Scroll Class');
  assert.ok(reading.blocks.some((block) => block.title === 'Weapon' && block.text.startsWith('Small')));
});

test('SCVMBIRTHER Korean companion replays the original roll and labels its cards', async () => {
  const pack = scvmPack();
  const root = await mkdtemp(join(tmpdir(), 'scvm-ko-'));
  try {
    const path = join(root, 'ko.json');
    await writeFile(path, JSON.stringify({
      format: 'reference-desk.scvmbirther-ko',
      version: 1,
      sourceSha256: pack.integrity.payloadSha256,
      messages: {
        'character.classes.scroll-class': '두루마리 계급',
        'character.classes.scroll-class.origin.1.description': '문에서 나왔다.',
        'tables.weapons.small': '작은 칼 d6',
      },
    }));
    pack.translations = await readPrivateScvmTranslation(path, pack);
    assert.ok(pack.translations);
    let draws = 0;
    const rolled = rollScvm(pack, () => { draws += 1; return 0; }, { className: 'scroll-class' });
    let plainDraws = 0;
    const plain = rollScvm({ ...pack, translations: undefined }, () => { plainDraws += 1; return 0; }, { className: 'scroll-class' });
    assert.equal(draws, plainDraws);
    const { translation: _translation, ...original } = rolled;
    assert.deepEqual(original, plain);
    assert.equal(rolled.translation?.className, '두루마리 계급');
    assert.ok(rolled.translation?.weapons.some((item) => item.startsWith('작은 칼')));
    const reading = scvmReferenceReading(pack);
    assert.equal(reading.blocks[0]?.translation?.titleKo, '직업');
    assert.equal(reading.blocks[0]?.translation?.ko, '두루마리 계급');
    assert.ok(reading.blocks.some((block) => block.title === 'Origin' && block.translation?.ko?.includes('문에서 나왔다.')));
    const brokenHelper = { ...pack, translations: { 'character.classes.scroll-class': '{broken' } };
    assert.deepEqual(rollScvm(brokenHelper, () => 0, { className: 'scroll-class' }), plain);
    await writeFile(path, JSON.stringify({
      format: 'reference-desk.scvmbirther-ko', version: 1,
      sourceSha256: '0'.repeat(64), messages: { 'character.classes.scroll-class': '잘못된 번역' },
    }));
    assert.equal(await readPrivateScvmTranslation(path, pack), undefined);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('monster site armor follows its published C-before-B parity', () => {
  const pack = monsterPack();
  const even = rollMonsterSite(pack, scripted([face(12, 1), face(12, 1), face(12, 8)]));
  const odd = rollMonsterSite(pack, scripted([face(12, 1), face(12, 1), face(12, 7)]));
  const tableA = rollMonsterSite(pack, scripted([face(12, 12), face(12, 1), face(12, 1)]));
  assert.match(even.armor, /-d4$/);
  assert.match(odd.armor, /-d6$/);
  assert.equal(tableA.armor, 'No armor');
  assert.equal(tableA.hp, 2);
  assert.equal(tableA.morale, 12);
  assert.equal(tableA.damage, 'd4');
  const monster = generateMonsterSite('11111111-1111-4111-8111-111111111111', pack, undefined, () => 0);
  assert.equal(monster.generation?.system, 'monster-site');
  assert.equal(monster.sources?.['site.tableA'], 'a1');
});

test('Monster Korean companion preserves selected variants, stats and source checksum', async () => {
  const pack = monsterPack();
  pack.messages['theMonsterApproaches.a1'] =
    'A {first, select, other {red} blue {blue}} creature';
  pack.tables.A[1][0].variants = { first: ['blue'] };
  seal(pack, monsterSitePackPayload);
  const root = await mkdtemp(join(tmpdir(), 'monster-ko-'));
  try {
    const path = join(root, 'ko.json');
    const companion = {
      format: 'reference-desk.monster-site-ko',
      version: 1,
      sourceSha256: pack.integrity.payloadSha256,
      messages: {
        'theMonsterApproaches.a1':
          '{first, select, other {빨간} blue {파란}} 생물',
        'theMonsterApproaches.introduction':
          '{tableA}. 특징: {tableB}. 상태: {tableC}. 욕망: {want}',
        'theMonsterApproaches.want': '머무는 것',
        'description.lair': '작은 소굴',
        'description.ability': '특별한 능력',
        'description.loot': '숨긴 보물',
        'weapon.claws': '발톱',
      },
    };
    await writeFile(path, JSON.stringify(companion));
    pack.translations = await readPrivateMonsterTranslation(path, pack);
    assert.ok(pack.translations);
    assert.equal(
      createHash('sha256').update(monsterSitePackPayload(pack)).digest('hex'),
      pack.integrity.payloadSha256,
    );
    assert.deepEqual(
      parseMonsterSitePack(pack, { allowSynthetic: true }).translations,
      pack.translations,
    );
    let draws = 0;
    const rolled = rollMonsterSite(pack, () => {
      draws += 1;
      return 0;
    });
    let plainDraws = 0;
    const plain = rollMonsterSite({ ...pack, translations: undefined }, () => {
      plainDraws += 1;
      return 0;
    });
    const { translation, ...original } = rolled;
    assert.equal(draws, plainDraws);
    assert.deepEqual(original, plain);
    assert.equal(translation?.name, '파란 생물');
    assert.match(translation!.introduction, /^파란 생물/);
    assert.equal(translation?.attack, '발톱');
    for (const field of [
      'hp',
      'morale',
      'damage',
      'rolls',
      'previous',
    ] as const)
      assert.deepEqual(translation?.[field], rolled[field]);
    const reading = monsterSiteReferenceReading(pack);
    assert.equal(
      reading.blocks.find((block) => block.title === 'Wants')?.translation?.ko,
      '머무는 것',
    );
    assert.equal(
      reading.blocks.find((block) => block.title === 'Lair')?.translation?.ko,
      '작은 소굴',
    );
    assert.equal(
      reading.blocks.find((block) => block.title === 'Wants')?.translation
        ?.titleKo,
      '욕망',
    );
    assert.deepEqual(
      rollMonsterSite(
        { ...pack, translations: { 'theMonsterApproaches.a1': '{broken' } },
        () => 0,
      ),
      plain,
    );
    const packPath = join(root, 'pack.json');
    await writeFile(
      packPath,
      JSON.stringify({ ...pack, translations: undefined }),
    );
    const server = createPrivateDngngenServer({
      root,
      packPath,
      monsterPath: packPath,
      monsterTranslationPath: path,
      allowSynthetic: true,
    });
    await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
    try {
      const address = server.address();
      assert.ok(address && typeof address === 'object');
      const response = await fetch(
        `http://127.0.0.1:${address.port}/__private/monster`,
      );
      assert.equal(response.headers.get('cache-control'), 'private, no-store');
      const body = await response.json();
      assert.equal(body.status, 'ready');
      assert.deepEqual(body.pack.translations, companion.messages);
    } finally {
      await new Promise<void>((done, reject) =>
        server.close((error) => (error ? reject(error) : done())),
      );
    }
    await writeFile(
      path,
      JSON.stringify({ ...companion, sourceSha256: '0'.repeat(64) }),
    );
    assert.equal(await readPrivateMonsterTranslation(path, pack), undefined);
    await writeFile(
      path,
      JSON.stringify({ ...companion, messages: { unknown: '잘못된 키' } }),
    );
    assert.equal(await readPrivateMonsterTranslation(path, pack), undefined);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('private generator loader rejects a broken checksum and serves a sealed pack', async () => {
  const root = await mkdtemp(join(tmpdir(), 'generator-pack-'));
  try {
    const path = join(root, 'pack.json');
    const pack = scvmPack();
    await writeFile(path, JSON.stringify(pack));
    const ready = await readPrivateGeneratorPack(path, parseScvmPack, scvmPackPayload, true);
    assert.equal(ready.status, 'ready');
    pack.integrity.payloadSha256 = 'ab'.repeat(32);
    await writeFile(path, JSON.stringify(pack));
    assert.deepEqual(await readPrivateGeneratorPack(path, parseScvmPack, scvmPackPayload, true), {
      status: 'unavailable',
      reason: 'invalid',
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

function scripted(values: number[]): RandomSource {
  const pending = [...values];
  return () => pending.shift() ?? 0;
}
function gear(name: string, tags: string[]) {
  return [[{ name, tags }]];
}
function scvmPack(): ScvmPack {
  const messages: Record<string, string> = {
    'character.classes.scroll-class': 'Scroll Class',
    'character.classes.scroll-class.origin.1.description': 'From a gate.',
    'character.classes.scroll-class.origin.appendix': 'Appendix.',
    'character.classes.scroll-class.power.bite.title': 'Bite',
    'character.classes.scroll-class.power.bite.description': 'Teeth.',
    'tables.weapons.small': 'Small blade d6',
    'tables.weapons.big': 'Big blade d8',
    'tables.armor.light': 'Light hide',
    'tables.armor.heavy': 'Heavy plate',
    'tables.equipment.scroll': 'Scroll',
    'tables.traits.1': 'Bitter',
    'tables.traits.2': 'Loud',
    'tables.traits.link': 'and',
    'tables.body.1': 'Scarred hands.',
    'tables.habits.quiet': 'Speaks rarely.',
    'character.details.silver': '{amount} silver',
  };
  const character = {
    name: 'scroll-class',
    tags: ['vanilla'],
    hp: { min: 1, max: 1 },
    silver: { min: 10, max: 10 },
    omens: { min: 1, max: 1 },
    origins: { min: 1, max: 1 },
    abilities: {
      strength: { mod: 0 },
      agility: { mod: 0 },
      presence: { mod: 0 },
      toughness: { mod: 0 },
    },
    powers: { amount: 1, table: [[{ id: 'bite' }]] },
    weapon: 'd8',
    armor: 'd4',
  };
  const tables = {
    weapons: {
      d4: gear('tables.weapons.small', ['weapon']),
      d6: gear('tables.weapons.small', ['weapon']),
      d8: gear('tables.weapons.big', ['weapon']),
      d10: gear('tables.weapons.big', ['weapon']),
    },
    armor: {
      d2: gear('tables.armor.light', ['armor']),
      d3: gear('tables.armor.light', ['armor']),
      d4: gear('tables.armor.heavy', ['armor']),
    },
    body: [[{ id: 'tables.body.1' }]],
    classes: [[character]],
    equipment_i: gear('tables.equipment.scroll', ['scroll']),
    equipment_ii: [[]],
    equipment_iii: [[]],
    habits: [[{ id: 'tables.habits.quiet' }]],
    tales: [[{ name: 'tables.tales.none' }]],
    traits: [[{ id: 'tables.traits.1' }], [{ id: 'tables.traits.2' }]],
    names: [['Ada']],
  };
  const pack = {
    format: 'reference-desk.scvmbirther' as const,
    version: 1 as const,
    profile: 'synthetic' as const,
    source: {
      project: 'SCVMBIRTHER',
      author: 'Test',
      url: 'https://scvmbirther.makedatanotlore.dev/',
      attribution: 'Synthetic',
    },
    snapshot: { id: 'synthetic-scvm', version: 'test', auditedAt: '2026-09-22' },
    messages,
    tables: { vanilla: tables, homebrew: tables },
    integrity: {
      payloadSha256: '',
      messageCount: Object.keys(messages).length,
      classCount: 1,
      homebrewClassCount: 1,
    },
  };
  return parseScvmPack(seal(pack, scvmPackPayload), { allowSynthetic: true });
}
function monsterPack(): MonsterSitePack {
  const entry = (id: string): { id: string } => ({ id });
  const faces = (prefix: string) => [
    [],
    ...Array.from({ length: 12 }, (_, index) => [entry(`${prefix}${index + 1}`)]),
  ];
  const messages: Record<string, string> = {
    'theMonsterApproaches.introduction': '{tableA} / {tableB} / {tableC} / {want}',
    'armor.noArmor': 'No armor',
    'armor.armor': 'Armor',
    'armor.light': 'Light',
    'armor.heavy': 'Heavy',
  };
  for (const die of ['d2', 'd4', 'd6', 'd8', 'd10', 'd12']) messages[`monster.${die}`] = die;
  for (const prefix of ['a', 'b', 'c', 'w'])
    for (let index = 1; index <= 12; index += 1)
      messages[`theMonsterApproaches.${prefix}${index}`] = `${prefix}${index}`;
  messages['theMonsterApproaches.want'] = 'want';
  messages['description.lair'] = 'A lair';
  messages['description.ability'] = 'An ability';
  messages['description.loot'] = 'A loot';
  messages['weapon.claws'] = 'Claws';
  messages['weapon.knife'] = 'Knife';
  messages['weapon.prefix.grim'] = 'Grim';
  const pack = {
    format: 'reference-desk.monster-site' as const,
    version: 1 as const,
    profile: 'synthetic' as const,
    source: {
      project: 'The Monster Approaches',
      author: 'Test',
      url: 'https://monster.makedatanotlore.dev/',
      attribution: 'Synthetic',
    },
    snapshot: { id: 'synthetic-monster', version: 'test', auditedAt: '2026-09-22' },
    messages,
    tables: {
      A: faces('a'),
      B: faces('b'),
      C: faces('c'),
      weapons: {
        d4: [entry('knife')],
        d6: [entry('knife')],
        d8: [entry('knife')],
        d10: [entry('knife')],
        natural: [{ id: 'claws', noPrefix: true }],
      },
      armor: {
        d2: [entry('light')],
        d4: [entry('light')],
        d6: [entry('heavy')],
      },
      prefixes: [entry('grim')],
      wants: [entry('want')],
      lairs: [entry('lair')],
      abilities: [entry('ability')],
      loot: [entry('loot')],
    },
    integrity: { payloadSha256: '', messageCount: Object.keys(messages).length, faces: 12 },
  };
  return parseMonsterSitePack(seal(pack, monsterSitePackPayload), { allowSynthetic: true });
}
