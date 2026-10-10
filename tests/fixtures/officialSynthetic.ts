// Invented source vocabulary shared by generator and encrypted-hosting tests.
import { createHash } from 'node:crypto';
import {
  parseScvmPack,
  scvmPackPayload,
  type ScvmPack,
} from '../../src/domain/scvmPack.ts';
import {
  parseMonsterSitePack,
  monsterSitePackPayload,
  type MonsterSitePack,
} from '../../src/domain/monsterSitePack.ts';
const seal = <T extends { integrity: { payloadSha256: string } }>(
  pack: T,
  payload: (pack: T) => string,
) => {
  pack.integrity.payloadSha256 = createHash('sha256')
    .update(payload(pack))
    .digest('hex');
  return pack;
};
function gear(name: string, tags: string[]) {
  return [[{ name, tags }]];
}
export function scvmPack(): ScvmPack {
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
    snapshot: {
      id: 'synthetic-scvm',
      version: 'test',
      auditedAt: '2026-09-22',
    },
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
export function monsterPack(): MonsterSitePack {
  const entry = (id: string): { id: string } => ({ id });
  const faces = (prefix: string) => [
    [],
    ...Array.from({ length: 12 }, (_, index) => [
      entry(`${prefix}${index + 1}`),
    ]),
  ];
  const messages: Record<string, string> = {
    'theMonsterApproaches.introduction':
      '{tableA} / {tableB} / {tableC} / {want}',
    'armor.noArmor': 'No armor',
    'armor.armor': 'Armor',
    'armor.light': 'Light',
    'armor.heavy': 'Heavy',
  };
  for (const die of ['d2', 'd4', 'd6', 'd8', 'd10', 'd12'])
    messages[`monster.${die}`] = die;
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
    snapshot: {
      id: 'synthetic-monster',
      version: 'test',
      auditedAt: '2026-09-22',
    },
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
    integrity: {
      payloadSha256: '',
      messageCount: Object.keys(messages).length,
      faces: 12,
    },
  };
  return parseMonsterSitePack(seal(pack, monsterSitePackPayload), {
    allowSynthetic: true,
  });
}
