import type { RandomSource } from '../generators/random.js';
import { pick } from '../generators/random.js';
import { formatOfficialMessage } from './officialMessage.js';
import { stableJson } from './privatePackJson.js';

export const SCVM_URL = 'https://scvmbirther.makedatanotlore.dev/';
type Table = unknown[][];
type Item = Record<string, unknown>;
export interface ScvmRange {
  min: number;
  max: number;
  mod?: number;
}
export interface ScvmClass {
  name: string;
  tags: string[];
  hp: { min: number; max: number };
  silver: { min: number; max: number };
  omens: { min: number; max: number; modifier?: number };
  origins: {
    min: number;
    max: number;
    secondMin?: number;
    secondMax?: number;
  };
  abilities: Record<
    'strength' | 'agility' | 'presence' | 'toughness',
    { mod: number }
  >;
  powers: { amount: number; table: Table };
  specials?: Item[];
  water_and_food?: Item;
  weapon?: string;
  armor?: string;
  equipment?: Table;
  forbidden?: string[];
}
export interface ScvmTables {
  weapons: Record<string, Table>;
  armor: Record<string, Table>;
  body: Table;
  classes: Table;
  equipment_i: Table;
  equipment_ii: Table;
  equipment_iii: Table;
  habits: Table;
  tales: Table;
  traits: Table;
  names: Table;
  prosaicNames?: Table;
  deadGods?: { names: string[]; titles: string[]; domains: string[] };
}
export interface ScvmPack {
  format: 'reference-desk.scvmbirther';
  version: 1;
  profile: 'scvmbirther-1' | 'synthetic';
  source: {
    project: string;
    author: string;
    url: string;
    attribution: string;
  };
  snapshot: { id: string; version: string; auditedAt: string };
  messages: Record<string, string>;
  tables: { vanilla: ScvmTables; homebrew: ScvmTables };
  integrity: {
    payloadSha256: string;
    messageCount: number;
    classCount: number;
    homebrewClassCount: number;
  };
}
export interface ScvmRoll {
  name: string;
  className: string;
  classId: string;
  homebrew: boolean;
  abilities: Record<
    'strength' | 'agility' | 'presence' | 'toughness',
    number
  >;
  hp: number;
  omens: number;
  silver: number;
  armor: string;
  weapons: string[];
  equipment: string[];
  traits: string[];
  origin: string;
  powers: { title: string; description: string }[];
  description: string;
}

function fail(code: string): never {
  throw new Error(code);
}
const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    fail('pack-shape');
  return value as Record<string, unknown>;
};
const table = (value: unknown): Table => {
  if (!Array.isArray(value) || value.some((row) => !Array.isArray(row)))
    fail('table-shape');
  return value as Table;
};
const diceTables = (value: unknown, dice: readonly string[]) => {
  const source = record(value);
  return Object.fromEntries(
    dice.map((die) => [die, table(source[die])]),
  ) as Record<string, Table>;
};
const range = (value: unknown) => {
  const source = record(value);
  if (
    typeof source.min !== 'number' ||
    typeof source.max !== 'number' ||
    !Number.isInteger(source.min) ||
    !Number.isInteger(source.max)
  )
    fail('range');
  return source as { min: number; max: number; modifier?: number };
};
function classOf(value: unknown): ScvmClass {
  const source = record(value);
  if (typeof source.name !== 'string') fail('class-name');
  const abilities = record(source.abilities);
  const powers = record(source.powers);
  return {
    name: source.name,
    tags: stringList(source.tags),
    hp: range(source.hp),
    silver: range(source.silver),
    omens: range(source.omens),
    origins: range(source.origins),
    abilities: {
      strength: { mod: numberField(record(abilities.strength), 'mod') },
      agility: { mod: numberField(record(abilities.agility), 'mod') },
      presence: { mod: numberField(record(abilities.presence), 'mod') },
      toughness: { mod: numberField(record(abilities.toughness), 'mod') },
    },
    powers: {
      amount: numberField(powers, 'amount'),
      table: table(powers.table),
    },
    ...(Array.isArray(source.specials)
      ? { specials: source.specials.map(item) }
      : {}),
    ...(source.water_and_food
      ? { water_and_food: item(source.water_and_food) }
      : {}),
    ...(typeof source.weapon === 'string' ? { weapon: source.weapon } : {}),
    ...(typeof source.armor === 'string' ? { armor: source.armor } : {}),
    ...(source.equipment ? { equipment: table(source.equipment) } : {}),
    ...(Array.isArray(source.forbidden)
      ? { forbidden: stringList(source.forbidden) }
      : {}),
  };
}
function tablesOf(value: unknown): ScvmTables {
  const source = record(value);
  const gods = source.deadGods ? record(source.deadGods) : undefined;
  return {
    weapons: diceTables(source.weapons, ['d4', 'd6', 'd8', 'd10']),
    armor: diceTables(source.armor, ['d2', 'd3', 'd4']),
    body: table(source.body),
    classes: table(source.classes),
    equipment_i: table(source.equipment_i),
    equipment_ii: table(source.equipment_ii),
    equipment_iii: table(source.equipment_iii),
    habits: table(source.habits),
    tales: table(source.tales),
    traits: table(source.traits),
    names: table(source.names),
    ...(source.prosaicNames
      ? { prosaicNames: table(source.prosaicNames) }
      : {}),
    ...(gods
      ? {
          deadGods: {
            names: stringList(gods.names),
            titles: stringList(gods.titles),
            domains: stringList(gods.domains),
          },
        }
      : {}),
  };
}
const stringList = (value: unknown) => {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string'))
    fail('string-list');
  return value as string[];
};
const item = (value: unknown): Item => record(value);
function numberField(source: Record<string, unknown>, key: string): number {
  const value = source[key];
  if (typeof value !== 'number' || !Number.isInteger(value)) fail('number');
  return value;
}
const classesIn = (tables: ScvmTables) =>
  tables.classes.flat().filter((value) => value && typeof value === 'object');

export function scvmPackPayload(pack: ScvmPack): string {
  const { payloadSha256: _digest, ...integrity } = pack.integrity;
  return stableJson({ ...pack, integrity });
}
export function parseScvmPack(
  input: unknown,
  options: { allowSynthetic?: boolean } = {},
): ScvmPack {
  const raw = record(input);
  if (
    raw.format !== 'reference-desk.scvmbirther' ||
    raw.version !== 1
  )
    fail('format-version');
  if (
    raw.profile !== 'scvmbirther-1' &&
    !(raw.profile === 'synthetic' && options.allowSynthetic)
  )
    fail('snapshot-profile');
  const source = record(raw.source);
  const snapshot = record(raw.snapshot);
  const messages = record(raw.messages);
  if (
    Object.values(messages).some((value) => typeof value !== 'string') ||
    typeof source.project !== 'string' ||
    typeof source.author !== 'string' ||
    source.url !== SCVM_URL ||
    typeof source.attribution !== 'string' ||
    typeof snapshot.id !== 'string' ||
    typeof snapshot.version !== 'string' ||
    typeof snapshot.auditedAt !== 'string'
  )
    fail('pack-identity');
  const tables = record(raw.tables);
  const parsed: ScvmPack = {
    format: 'reference-desk.scvmbirther',
    version: 1,
    profile: raw.profile,
    source: {
      project: source.project,
      author: source.author,
      url: SCVM_URL,
      attribution: source.attribution,
    },
    snapshot: {
      id: snapshot.id,
      version: snapshot.version,
      auditedAt: snapshot.auditedAt,
    },
    messages: messages as Record<string, string>,
    tables: {
      vanilla: tablesOf(tables.vanilla),
      homebrew: tablesOf(tables.homebrew),
    },
    integrity: integrityOf(raw.integrity),
  };
  if (
    parsed.integrity.messageCount !== Object.keys(parsed.messages).length ||
    parsed.integrity.classCount !== classesIn(parsed.tables.vanilla).length ||
    parsed.integrity.homebrewClassCount !==
      classesIn(parsed.tables.homebrew).length
  )
    fail('integrity-counts');
  return parsed;
}
function integrityOf(value: unknown): ScvmPack['integrity'] {
  const source = record(value);
  if (
    typeof source.payloadSha256 !== 'string' ||
    !/^[a-f0-9]{64}$/.test(source.payloadSha256)
  )
    fail('checksum');
  return {
    payloadSha256: source.payloadSha256,
    messageCount: numberField(source, 'messageCount'),
    classCount: numberField(source, 'classCount'),
    homebrewClassCount: numberField(source, 'homebrewClassCount'),
  };
}

const bands = [
  { mod: -3, max: 4 },
  { mod: -2, max: 6 },
  { mod: -1, max: 8 },
  { mod: 0, max: 12 },
  { mod: 1, max: 14 },
  { mod: 2, max: 16 },
  { mod: 3, max: Number.POSITIVE_INFINITY },
];
const abilityBand = (score: number) =>
  (score <= 4 ? bands[0] : bands.find((band) => score <= band.max))!.mod;
const inclusive = (min: number, max: number, rng: RandomSource) =>
  min + Math.floor(rng() * (max - min + 1));
function sampleSize<T>(count: number, rows: readonly T[], rng: RandomSource) {
  const copy = [...rows];
  const take = Math.min(count, copy.length);
  for (let index = 0; index < take; index += 1) {
    const swap = index + Math.floor(rng() * (copy.length - index));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy.slice(0, take);
}
/** Uniform row, then uniform item. An empty row is an official nothing result. */
export function fromScvmTable(
  rows: Table | undefined,
  count: number,
  rng: RandomSource,
): unknown {
  if (!rows?.length) return count > 1 ? [] : undefined;
  if (count > 1) return sampleSize(count, rows, rng).flat();
  const row = pick(rows, rng);
  return row.length ? pick(row, rng) : undefined;
}
function powerList(value: unknown, amount: number): Item[] {
  const rows = amount > 1 ? (Array.isArray(value) ? value : []) : value ? [value] : [];
  return rows.filter((entry): entry is Item => !!entry && typeof entry === 'object');
}
const textOf = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  const source = value as Item;
  if (typeof source.id === 'string') return source.id;
  if (typeof source.name === 'string') return source.name;
  return '';
};
function message(
  pack: ScvmPack,
  id: string,
  values: Record<string, string | number> = {},
) {
  const template = pack.messages[id];
  if (template === undefined) return id;
  try {
    return formatOfficialMessage(template, values);
  } catch {
    fail(`message-syntax:${id}`);
  }
}
const display = (pack: ScvmPack, id: string, values?: Record<string, string | number>) =>
  message(pack, id, values).replaceAll('*', '');

/** The published filter keeps every row: an array is always truthy. */
function withoutTags(rows: Table, forbidden: readonly string[]) {
  return rows.filter((row) =>
    row.filter(
      (entry) =>
        !item(entry).tags ||
        !(item(entry).tags as string[]).some((tag) => forbidden.includes(tag)),
    ),
  );
}
function equipmentLine(
  pack: ScvmPack,
  entry: Item,
  abilities: ScvmRoll['abilities'],
  rng: RandomSource,
) {
  const amount = entry.amount
    ? inclusive(
        numberField(record(entry.amount), 'min'),
        numberField(record(entry.amount), 'max'),
        rng,
      ) +
      (typeof entry.mod === 'string'
        ? abilities[entry.mod as keyof ScvmRoll['abilities']]
        : 0)
    : 1;
  const hpSource = entry.hp ? record(entry.hp) : undefined;
  const hp = hpSource
    ? inclusive(numberField(hpSource, 'min'), numberField(hpSource, 'max'), rng) +
      (typeof hpSource.mod === 'number' ? hpSource.mod : 0)
    : 0;
  const values = { amount, hp };
  const name = display(pack, typeof entry.name === 'string' ? entry.name : '', values);
  const description =
    typeof entry.description === 'string'
      ? display(pack, entry.description, values)
      : '';
  return {
    tags: Array.isArray(entry.tags) ? (entry.tags as string[]) : [],
    amount,
    text: `${name}${description}${hp ? ` · HP ${hp}` : ''}`.trim(),
  };
}

export function rollScvm(
  pack: ScvmPack,
  rng: RandomSource,
  options: { homebrew?: boolean; className?: string } = {},
): ScvmRoll {
  const tables = options.homebrew ? pack.tables.homebrew : pack.tables.vanilla;
  const rolled = options.className
    ? classesIn(tables)
        .map(classOf)
        .find((entry) => entry.name === options.className)
    : classOf(fromScvmTable(tables.classes, 1, rng));
  if (!rolled) fail('missing-class');
  let characterClass: ScvmClass = rolled;
  const powers = [
    ...(characterClass.specials ?? []).map((special) =>
      Array.isArray(special.variants)
        ? { ...special, id: pick(special.variants as string[], rng) }
        : special,
    ),
    ...powerList(
      fromScvmTable(
        characterClass.powers.table,
        characterClass.powers.amount,
        rng,
      ),
      characterClass.powers.amount,
    ),
  ];
  for (const power of powers)
    characterClass = { ...characterClass, ...power } as ScvmClass;
  const abilities = {
    strength: abilityBand(
      inclusive(1, 6, rng) +
        inclusive(1, 6, rng) +
        inclusive(1, 6, rng) +
        characterClass.abilities.strength.mod,
    ),
    agility: abilityBand(
      inclusive(1, 6, rng) +
        inclusive(1, 6, rng) +
        inclusive(1, 6, rng) +
        characterClass.abilities.agility.mod,
    ),
    presence: abilityBand(
      inclusive(1, 6, rng) +
        inclusive(1, 6, rng) +
        inclusive(1, 6, rng) +
        characterClass.abilities.presence.mod,
    ),
    toughness: abilityBand(
      inclusive(1, 6, rng) +
        inclusive(1, 6, rng) +
        inclusive(1, 6, rng) +
        characterClass.abilities.toughness.mod,
    ),
  };
  const name = characterClass.tags.includes('prosaic-name')
    ? (tables.prosaicNames ?? [])
        .map((row) => display(pack, String(pick(row, rng))))
        .join('')
        .replaceAll('*', '')
    : display(pack, textOf(fromScvmTable(tables.names, 1, rng)));
  const habit = item(fromScvmTable(tables.habits, 1, rng) ?? {});
  const tale =
    inclusive(1, 10, rng) > 8
      ? item(fromScvmTable(tables.tales, 1, rng) ?? {})
      : {};
  const originId = `character.classes.${characterClass.name}.origin.${inclusive(characterClass.origins.min, characterClass.origins.max, rng)}.description`;
  const secondId =
    characterClass.origins.secondMin !== undefined &&
    characterClass.origins.secondMax !== undefined
      ? `character.classes.${characterClass.name}.secondOrigin.${inclusive(characterClass.origins.secondMin, characterClass.origins.secondMax, rng)}.description`
      : undefined;
  const god = characterClass.tags.includes('dead-god')
    ? {
        name: String(pick(tables.deadGods?.names ?? [''], rng)),
        title: String(pick(tables.deadGods?.titles ?? [''], rng)),
        domain: String(pick(tables.deadGods?.domains ?? [''], rng)),
      }
    : undefined;
  const traitIds = (
    fromScvmTable(tables.traits, 2, rng) as unknown[]
  ).map(textOf);
  const body = textOf(fromScvmTable(tables.body, 1, rng));
  const rows = characterClass.forbidden?.length
    ? [
        withoutTags(tables.equipment_i, characterClass.forbidden),
        withoutTags(tables.equipment_ii, characterClass.forbidden),
        withoutTags(tables.equipment_iii, characterClass.forbidden),
      ]
    : [tables.equipment_i, tables.equipment_ii, tables.equipment_iii];
  let carried: Item[] = [
    fromScvmTable(rows[0], 1, rng),
    fromScvmTable(rows[1], 1, rng),
    fromScvmTable(rows[2], 1, rng),
    fromScvmTable(characterClass.equipment, 1, rng),
    habit.items ? fromScvmTable(table(habit.items), 1, rng) : undefined,
    tale.items ? fromScvmTable(table(tale.items), 1, rng) : undefined,
  ].filter((entry): entry is Item => !!entry && typeof entry === 'object');
  const scroll = carried.some(
    (entry) =>
      Array.isArray(entry.tags) && (entry.tags as string[]).includes('scroll'),
  );
  if (characterClass.armor) {
    const die = scroll ? 'd2' : characterClass.armor;
    const armor = fromScvmTable(tables.armor[die], 1, rng);
    if (armor && typeof armor === 'object') carried = [item(armor), ...carried];
  }
  if (characterClass.weapon) {
    const die =
      scroll && !(characterClass.weapon < 'd6') ? 'd6' : characterClass.weapon;
    const weapon = fromScvmTable(tables.weapons[die], 1, rng);
    if (weapon && typeof weapon === 'object')
      carried = [item(weapon), ...carried];
  }
  if (characterClass.water_and_food)
    carried = [characterClass.water_and_food, ...carried];
  carried = [
    ...carried,
    {
      name: 'character.details.silver',
      amount: characterClass.silver,
      tags: ['silver'],
    },
  ];
  const lines = carried.map((entry) =>
    equipmentLine(pack, entry, abilities, rng),
  );
  const silverLine = lines.find((line) => line.tags.includes('silver'));
  const armorLine = lines.find((line) => line.tags.includes('armor'));
  const weaponLines = lines.filter((line) => line.tags.includes('weapon'));
  const gear = lines.filter(
    (line) =>
      !line.tags.includes('silver') &&
      !line.tags.includes('armor') &&
      !line.tags.includes('weapon'),
  );
  const origin = god
    ? `${display(pack, originId)} ${display(pack, god.name)}, ${display(pack, god.title)} ${display(pack, god.domain)}. ${display(pack, 'character.classes.dead-gods-prophet.origin.appendix', { name: display(pack, god.name) })}`
    : `${display(pack, originId)}${secondId ? ` ${display(pack, secondId)}` : ''}\n\n${display(pack, `character.classes.${characterClass.name}.origin.appendix`)}`;
  const link = display(pack, 'tables.traits.link');
  const description = [
    traitIds[0] ? display(pack, traitIds[0]) : '',
    link,
    traitIds[1] ? display(pack, traitIds[1]).toLocaleLowerCase() : '',
    '.',
    display(pack, body),
    display(pack, textOf(habit)),
    tale.name ? display(pack, textOf(tale)) : '',
  ]
    .filter(Boolean)
    .join(' ')
    .replace(' .', '.');
  return {
    name: name || 'Unnamed',
    className: display(pack, `character.classes.${characterClass.name}`),
    classId: characterClass.name,
    homebrew: !!options.homebrew,
    abilities,
    hp: Math.max(
      1,
      Math.min(
        9999,
        inclusive(characterClass.hp.min, characterClass.hp.max, rng) +
          abilities.toughness,
      ),
    ),
    omens: Math.max(
      0,
      Math.min(
        999,
        inclusive(characterClass.omens.min, characterClass.omens.max, rng) +
          (characterClass.omens.modifier ?? 0),
      ),
    ),
    silver: Math.max(0, Math.min(9999999, silverLine?.amount ?? 0)),
    armor: armorLine?.text ?? '',
    weapons: weaponLines.map((line) => line.text),
    equipment: gear.map((line) => line.text),
    traits: [...traitIds, body, textOf(habit), textOf(tale)].filter(Boolean),
    origin,
    powers: powers.map((power) => ({
      title: display(
        pack,
        `character.classes.${characterClass.name}.power.${String(power.id)}.title`,
      ),
      description: display(
        pack,
        `character.classes.${characterClass.name}.power.${String(power.id)}.description`,
      ),
    })),
    description,
  };
}

