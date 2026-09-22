import type { RandomSource } from '../generators/random.js';
import { pick } from '../generators/random.js';
import { formatOfficialMessage } from './officialMessage.js';
import { stableJson } from './privatePackJson.js';

export const MONSTER_SITE_URL = 'https://monster.makedatanotlore.dev/';
export interface MonsterSiteEntry {
  id: string;
  variants?: Record<string, (string | number)[]>;
  modifier?: number;
  noPrefix?: boolean;
  armor?: MonsterSitePart;
  weapon?: MonsterSitePart;
}
export interface MonsterSitePart {
  id: string;
  variantPath?: string;
  variants?: Record<string, (string | number)[]>;
}
export interface MonsterSitePack {
  format: 'reference-desk.monster-site';
  version: 1;
  profile: 'monster-site-1' | 'synthetic';
  source: {
    project: string;
    author: string;
    url: string;
    attribution: string;
  };
  snapshot: { id: string; version: string; auditedAt: string };
  messages: Record<string, string>;
  tables: {
    A: MonsterSiteEntry[][];
    B: MonsterSiteEntry[][];
    C: MonsterSiteEntry[][];
    weapons: Record<'d4' | 'd6' | 'd8' | 'd10' | 'natural', MonsterSiteEntry[]>;
    armor: Record<'d2' | 'd4' | 'd6', MonsterSiteEntry[]>;
    prefixes: { id: string }[];
    wants: MonsterSiteEntry[];
    lairs: MonsterSiteEntry[];
    abilities: MonsterSiteEntry[];
    loot: MonsterSiteEntry[];
  };
  integrity: {
    payloadSha256: string;
    messageCount: number;
    faces: number;
  };
}
export interface MonsterSitePrevious {
  tableA?: string;
  tableB?: string;
  tableC?: string;
  want?: string;
  lair?: string;
  ability?: string;
  loot?: string;
  armor?: string;
}
export interface MonsterSiteRoll {
  name: string;
  introduction: string;
  want: string;
  lair: string;
  ability: string;
  loot: string;
  hp: number;
  morale: number;
  armor: string;
  attack: string;
  damage: string;
  previous: Required<MonsterSitePrevious>;
  rolls: Record<string, number>;
}

function fail(code: string): never {
  throw new Error(code);
}
const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    fail('pack-shape');
  return value as Record<string, unknown>;
};
const scalarList = (value: unknown) => {
  if (
    !Array.isArray(value) ||
    value.some((item) => typeof item !== 'string' && typeof item !== 'number')
  )
    fail('variant-list');
  return value as (string | number)[];
};
function part(value: unknown): MonsterSitePart {
  const source = record(value);
  if (typeof source.id !== 'string') fail('entry-id');
  const variants = source.variants ? record(source.variants) : undefined;
  return {
    id: source.id,
    ...(typeof source.variantPath === 'string'
      ? { variantPath: source.variantPath }
      : {}),
    ...(variants
      ? {
          variants: Object.fromEntries(
            Object.entries(variants).map(([key, list]) => [key, scalarList(list)]),
          ),
        }
      : {}),
  };
}
function entry(value: unknown): MonsterSiteEntry {
  const source = record(value);
  if (typeof source.id !== 'string') fail('entry-id');
  const variants = source.variants ? record(source.variants) : undefined;
  return {
    id: source.id,
    ...(variants
      ? {
          variants: Object.fromEntries(
            Object.entries(variants).map(([key, list]) => [key, scalarList(list)]),
          ),
        }
      : {}),
    ...(typeof source.modifier === 'number' ? { modifier: source.modifier } : {}),
    ...(source.noPrefix === true ? { noPrefix: true } : {}),
    ...(source.armor ? { armor: part(source.armor) } : {}),
    ...(source.weapon ? { weapon: part(source.weapon) } : {}),
  };
}
const list = (value: unknown) => {
  if (!Array.isArray(value)) fail('table-shape');
  return value.map(entry);
};
const faces = (value: unknown) => {
  if (!Array.isArray(value)) fail('face-table');
  const rows = value.map((row) => {
    if (!Array.isArray(row)) fail('face-table');
    return row.map(entry);
  });
  if (rows.length !== 13 || rows[0].length !== 0 || rows.slice(1).some((row) => !row.length))
    fail('face-table');
  return rows;
};
const named = <T extends string>(value: unknown, keys: readonly T[]) => {
  const source = record(value);
  return Object.fromEntries(keys.map((key) => [key, list(source[key])])) as Record<T, MonsterSiteEntry[]>;
};

export function monsterSitePackPayload(pack: MonsterSitePack): string {
  const { payloadSha256: _digest, ...integrity } = pack.integrity;
  return stableJson({ ...pack, integrity });
}
export function parseMonsterSitePack(
  input: unknown,
  options: { allowSynthetic?: boolean } = {},
): MonsterSitePack {
  const raw = record(input);
  if (raw.format !== 'reference-desk.monster-site' || raw.version !== 1)
    fail('format-version');
  if (
    raw.profile !== 'monster-site-1' &&
    !(raw.profile === 'synthetic' && options.allowSynthetic)
  )
    fail('snapshot-profile');
  const source = record(raw.source);
  const snapshot = record(raw.snapshot);
  const messages = record(raw.messages);
  const tables = record(raw.tables);
  const integrity = record(raw.integrity);
  if (
    Object.values(messages).some((value) => typeof value !== 'string') ||
    typeof source.project !== 'string' ||
    typeof source.author !== 'string' ||
    source.url !== MONSTER_SITE_URL ||
    typeof source.attribution !== 'string' ||
    typeof snapshot.id !== 'string' ||
    typeof snapshot.version !== 'string' ||
    typeof snapshot.auditedAt !== 'string' ||
    typeof integrity.payloadSha256 !== 'string' ||
    !/^[a-f0-9]{64}$/.test(integrity.payloadSha256) ||
    integrity.messageCount !== Object.keys(messages).length ||
    integrity.faces !== 12
  )
    fail('pack-identity');
  return {
    format: 'reference-desk.monster-site',
    version: 1,
    profile: raw.profile,
    source: {
      project: source.project,
      author: source.author,
      url: MONSTER_SITE_URL,
      attribution: source.attribution,
    },
    snapshot: {
      id: snapshot.id,
      version: snapshot.version,
      auditedAt: snapshot.auditedAt,
    },
    messages: messages as Record<string, string>,
    tables: {
      A: faces(tables.A),
      B: faces(tables.B),
      C: faces(tables.C),
      weapons: named(tables.weapons, ['d4', 'd6', 'd8', 'd10', 'natural']),
      armor: named(tables.armor, ['d2', 'd4', 'd6']),
      prefixes: list(tables.prefixes),
      wants: list(tables.wants),
      lairs: list(tables.lairs),
      abilities: list(tables.abilities),
      loot: list(tables.loot),
    },
    integrity: {
      payloadSha256: integrity.payloadSha256,
      messageCount: integrity.messageCount as number,
      faces: 12,
    },
  };
}

const die = (sides: number, rng: RandomSource) =>
  1 + Math.floor(rng() * sides);
const except = (
  rows: readonly MonsterSiteEntry[],
  previous: string | undefined,
  rng: RandomSource,
) => {
  const eligible = previous ? rows.filter((row) => row.id !== previous) : rows;
  const pool = eligible.length ? eligible : rows;
  if (!pool.length) fail('empty-table');
  return pick(pool, rng);
};
function variantsOf(
  source: { variants?: Record<string, (string | number)[]> } | undefined,
  rng: RandomSource,
) {
  return Object.fromEntries(
    Object.entries(source?.variants ?? {}).map(([key, values]) => [
      key,
      pick(values, rng),
    ]),
  );
}
function text(
  pack: MonsterSitePack,
  id: string,
  values: Record<string, string | number> = {},
) {
  const template = pack.messages[id];
  if (template === undefined) fail(`missing-message:${id}`);
  try {
    return formatOfficialMessage(template, values);
  } catch {
    fail(`message-syntax:${id}`);
  }
}
type DamageDie = 'd4' | 'd6' | 'd8' | 'd10' | 'd12';
const damageDie = (lowest: number): DamageDie =>
  lowest <= 3
    ? 'd4'
    : lowest <= 5
      ? 'd6'
      : lowest <= 7
        ? 'd8'
        : lowest <= 10
          ? 'd10'
          : 'd12';

interface Carried {
  id?: string;
  variants: Record<string, string | number>;
  prefix?: string;
  modifier?: number;
}
export function rollMonsterSite(
  pack: MonsterSitePack,
  rng: RandomSource,
  previous: MonsterSitePrevious = {},
): MonsterSiteRoll {
  const faces = [die(12, rng), die(12, rng), die(12, rng)] as const;
  const morale = Math.max(...faces);
  const damage = damageDie(Math.min(...faces));
  // Published code checks C before B. An even winning C result is d4, not d6.
  const armorDie =
    faces[2] === morale ? (morale % 2 === 0 ? 'd4' : 'd6') : faces[1] === morale ? 'd2' : undefined;
  const hp = die(Number(damage.slice(1)), rng) * 2;
  let weapon: Carried | undefined;
  let armor: Carried | undefined;
  const taken = (['tableA', 'tableB', 'tableC'] as const).map((key, index) => {
    const result = except(
      pack.tables[key === 'tableA' ? 'A' : key === 'tableB' ? 'B' : 'C'][faces[index]],
      previous[key],
      rng,
    );
    const values = variantsOf(result, rng);
    if (result.weapon?.id) {
      weapon = {
        id: result.weapon.id,
        variants: result.weapon.variantPath
          ? { [result.weapon.variantPath]: values[result.weapon.variantPath] ?? '' }
          : variantsOf(result.weapon, rng),
      };
    }
    const nextArmor = armorDie
      ? {
          id: result.armor?.id,
          variants: result.armor?.variantPath
            ? { [result.armor.variantPath]: values[result.armor.variantPath] ?? '' }
            : variantsOf(result.armor, rng),
        }
      : { id: 'noArmor', variants: {} };
    if (nextArmor.id) armor = nextArmor;
    return { id: result.id, values };
  });
  if (!weapon?.id) {
    const namedWeapon = die(4, rng) === 4;
    const result = pick(
      pack.tables.weapons[namedWeapon && damage !== 'd12' ? damage : 'natural'],
      rng,
    );
    const prefixed = die(10, rng) === 10 && !result.noPrefix;
    const prefix = prefixed ? pick(pack.tables.prefixes, rng) : undefined;
    weapon = {
      id: result.id,
      prefix: prefix?.id,
      modifier: prefixed ? 1 : result.modifier,
      variants: variantsOf(result, rng),
    };
  }
  if (!armor?.id) {
    if (!armorDie) armor = { id: 'noArmor', variants: {} };
    else {
      const namedArmor = die(4, rng) === 4;
      const result = namedArmor
        ? except(pack.tables.armor[armorDie], previous.armor, rng)
        : { id: 'armor' };
      armor = { id: result.id, variants: variantsOf(result, rng) };
    }
  }
  const want = except(pack.tables.wants, previous.want, rng);
  const wantValues = variantsOf(want, rng);
  const lair = except(pack.tables.lairs, previous.lair, rng);
  const lairValues = variantsOf(lair, rng);
  const abilityRoll = die(2, rng);
  const ability =
    abilityRoll === 2
      ? { id: 'none', variants: {} as Record<string, string | number> }
      : (() => {
          const result = except(pack.tables.abilities, previous.ability, rng);
          return { id: result.id, variants: variantsOf(result, rng) };
        })();
  const lootRoll = die(3, rng);
  const loot =
    lootRoll === 3
      ? { id: 'none', variants: {} as Record<string, string | number> }
      : (() => {
          const result = except(pack.tables.loot, previous.loot, rng);
          return { id: result.id, variants: variantsOf(result, rng) };
        })();
  const phrase = (id: string, values: Record<string, string | number>) =>
    text(pack, `theMonsterApproaches.${id}`, values);
  const phraseA = phrase(taken[0].id, taken[0].values);
  const phraseB = phrase(taken[1].id, taken[1].values);
  const phraseC = phrase(taken[2].id, taken[2].values);
  const wantText = phrase(want.id, wantValues);
  if (!weapon?.id || !armor?.id) fail('incomplete-monster');
  const prefix = weapon.prefix ? `${text(pack, `weapon.prefix.${weapon.prefix}`)} ` : '';
  return {
    name: phraseA,
    introduction: text(pack, 'theMonsterApproaches.introduction', {
      tableA: phraseA,
      tableB: phraseB,
      tableC: phraseC,
      want: wantText,
    }),
    want: wantText,
    lair: text(pack, `description.${lair.id}`, lairValues),
    ability: ability.id === 'none' ? '' : text(pack, `description.${ability.id}`, ability.variants),
    loot: loot.id === 'none' ? '' : text(pack, `description.${loot.id}`, loot.variants),
    hp,
    morale,
    armor: `${text(pack, `armor.${armor.id}`, armor.variants)}${armorDie ? ` -${text(pack, `monster.${armorDie}`)}` : ''}`,
    attack: `${prefix}${text(pack, `weapon.${weapon.id}`, weapon.variants)}`.trim(),
    damage: `${text(pack, `monster.${damage}`)}${weapon.modifier ? `+${weapon.modifier}` : ''}`,
    previous: {
      tableA: taken[0].id,
      tableB: taken[1].id,
      tableC: taken[2].id,
      want: want.id,
      lair: lair.id,
      ability: ability.id,
      loot: loot.id,
      armor: armor.id ?? '',
    },
    rolls: { A: faces[0], B: faces[1], C: faces[2], hp, morale },
  };
}
