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
import { generateScvmCharacter } from '../src/generators/scvmCharacter.ts';
import { generateMonsterSite } from '../src/generators/monsterSite.ts';
import { readPrivateGeneratorPack } from '../server/privateGeneratorPack.ts';
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
      '{first, select, other {Rubbery} hardened {Hardened} } skin',
      { first: 'hardened' },
    ),
    'Hardened skin',
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
