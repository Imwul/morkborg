import type {
  OracleCategory,
  OracleDefinition,
  OraclePack,
  OracleRegistry,
  SourceBook,
} from '../../domain/oracle';
import {
  getRules,
  type RuleEntry,
  type RulesPack,
  type RuleTable,
} from '../../storage/rulesStore';
import {
  correctOracleSourcePages,
  correctOracleGuidance,
} from './sourceCorrections';
import { applyOracleSourceEvidence } from './sourceEvidence';
import { referenceGeneratorProcedure } from '../../domain/referenceGeneratorProcedures';
const noPack = {};
const registryCache = new WeakMap<object, WeakMap<object, OracleRegistry>>();

export function categoryFor(id: string, title: string): OracleCategory {
  const s = `${id} ${title}`.toLowerCase();
  if (/yesno|yes or no|fate|orakle|likelihood/.test(s)) return 'SOLO';
  if (/reaction|disposition/.test(s)) return 'REACTION';
  if (/weather/.test(s)) return 'WEATHER';
  if (/rumou?r|knowledge/.test(s)) return 'RUMOR';
  if (/action/.test(s) && !/faction/.test(s)) return 'ACTION';
  if (/theme/.test(s)) return 'THEME';
  if (/npc|profession|contact/.test(s)) return 'NPC';
  if (/name|title[ab]/.test(s)) return 'NAME';
  if (
    /feretory\.(?:a |b |c |desire|trait)|monster|creature|rare\.|enemystats/.test(
      s,
    )
  )
    return 'MONSTER';
  if (/treasure|loot|plunder|items|gear|sacred|unclean|weapon|armor/.test(s))
    return 'TREASURE';
  if (/encounter|meeting/.test(s)) return 'ENCOUNTER';
  if (/room|dressing|exit|architecture|light|smell|sound/.test(s))
    return 'ROOM';
  if (/region|location|wilderness|travel|road|village|foraging/.test(s))
    return 'LOCATION';
  if (/spark|event|complication|consequence/.test(s)) return 'EVENT';
  if (/dungeon|entrance|purpose|inhabitants|status|feature|danger|trap/.test(s))
    return 'DUNGEON';
  if (
    /trait|body|bodies|descriptor|description|material|odour|taste|detail|quality|size|color/.test(
      s,
    )
  )
    return 'DESCRIPTION';
  return 'OTHER';
}
function legacyRange(entry: RuleEntry, index: number) {
  const m = entry.meta;
  if (Array.isArray(m.range))
    return [Number(m.range[0]), Number(m.range[1] ?? m.range[0])];
  if (typeof m.min === 'number') return [m.min, Number(m.max ?? m.min)];
  if (typeof m.d4 === 'number' && typeof m.d6 === 'number')
    return [m.d4 * 10 + m.d6, m.d4 * 10 + m.d6];
  if (typeof m.roll === 'number') return [m.roll, m.roll + entry.weight - 1];
  return [index + 1, index + 1];
}
export function adaptRuleTable(
  id: string,
  table: RuleTable,
  selectors?: { min: number; max: number }[],
): OracleDefinition {
  const original = Array.isArray(table.dice)
    ? table.dice.join(' × ')
    : table.dice;
  const simple = /^d(?:2|3|4|6|8|10|12|20|66|100)$/.test(original);
  const verifiedNameGrid =
    id === 'core.names' &&
    table.book === 'core' &&
    table.pages.includes(2) &&
    table.entries.length === 48;
  const repeated = /^(d\d+) (?:twice|for each PC)$/.exec(original);
  const conditional = /^(d\d+);/.exec(original);
  const dice = verifiedNameGrid
    ? 'd6 × d8'
    : simple
      ? original
      : (repeated?.[1] ??
        conditional?.[1] ??
        (id === 'core.rooms' ? 'd4 × d6' : original));
  const rollable =
    verifiedNameGrid ||
    simple ||
    !!repeated ||
    !!conditional ||
    id === 'core.rooms';
  const instructions = [
    !rollable
      ? '주사위 또는 적용 조건을 확인해야 하는 참조 표입니다. 임의의 확률로 굴리지 않습니다.'
      : '',
    repeated
      ? 'ROLL은 한 번의 결과입니다. 원문에 적힌 반복 횟수와 대상에 맞게 다시 굴리세요.'
      : '',
    conditional ? `기본 ${dice} 표입니다. 조건부 사용: ${original}` : '',
    table.entries.some(
      (e) => e.followup || e.meta.followUp || e.meta.subtableId,
    )
      ? '후속 표·선택·조건은 결과 아래 원문 정보를 확인하세요. 자동으로 문장을 완성하거나 조건을 적용하지 않습니다.'
      : '',
  ]
    .filter(Boolean)
    .join(' ');
  return {
    id,
    canonicalTableId: id,
    sourceBookId: table.book,
    sourcePage: table.pages,
    title: table.title,
    category: categoryFor(id, table.title),
    dice,
    originalDice: original,
    tags: id.split('.'),
    sourceVerified: table.pages.length > 0,
    rollable,
    sourceNote: instructions || undefined,
    entries: table.entries.map((entry, index) => {
      const nameCoordinate = Math.floor(index / 8) * 10 + 11 + (index % 8);
      const [min, max] = selectors?.[index]
        ? [selectors[index].min, selectors[index].max]
        : verifiedNameGrid
          ? [nameCoordinate, nameCoordinate]
          : legacyRange(entry, index);
      return {
        id: `${id}:${min}-${max}`,
        min,
        max,
        // A live adapter, not a second collection of rulebook text.
        get text() {
          return id === 'depths.enemyStats' && !entry.text
            ? ['HP', 'Morale', 'Attack', 'Armor']
                .map((key) => {
                  const value = entry.meta[key];
                  return `${key}: ${typeof value === 'string' || typeof value === 'number' ? String(value) : '—'}`;
                })
                .join(' · ')
            : entry.text;
        },
        metadata: entry.followup
          ? { ...entry.meta, followup: entry.followup }
          : entry.meta,
      };
    }),
  };
}
export function buildOracleRegistry(
  rules: RulesPack | null,
  extra: OraclePack | null,
): OracleRegistry {
  // Installed packs are replaced atomically; provenance validation runs once per pack pair.
  const ruleKey = rules ?? noPack,
    extraKey = extra ?? noPack;
  const cached = registryCache.get(ruleKey)?.get(extraKey);
  if (cached) return cached;
  const books: SourceBook[] = (rules?.books ?? []).map(
    ({ id, title, fileName }) => ({
      id,
      title,
      fileName,
    }),
  );
  for (const book of extra?.books ?? [])
    if (!books.some((b) => b.id === book.id)) books.push(book);
  const tables = Object.entries(rules?.tables ?? {}).map(([id, table]) => {
    const base = adaptRuleTable(id, table, extra?.entrySelectors?.[id]),
      override = extra?.overrides?.[id];
    return override
      ? {
          ...base,
          ...override,
          id,
          entries: base.entries,
          canonicalTableId: id,
        }
      : base;
  });
  tables.push(...(extra?.tables ?? []));
  for (const table of creatureIdentityTables(rules))
    if (!tables.some((existing) => existing.id === table.id))
      tables.push(table);
  // Nested printed subtables remain views of their original entry metadata.
  const parents = tables.slice();
  for (const parent of parents)
    for (const nested of nestedOracleTables(parent))
      if (!tables.some((table) => table.id === nested.id)) tables.push(nested);
  const procedures = [...(extra?.procedures ?? [])];
  const shared = [
    {
      id: 'heretic.graves-loot-bodies',
      title: 'Loot the Bodies · two independent d6 rolls',
      oracleIds: ['heretic.gravesLootBodies', 'heretic.gravesLootBodies'],
    },
    {
      id: 'reclvse.action-theme',
      title: 'RECLVSE · Action + Theme',
      oracleIds: ['reclvse.action', 'reclvse.theme'],
    },
    {
      id: 'sd.room-description',
      title: 'Sölitary Defilement · Room Adjective + Type',
      oracleIds: ['sd.room.adjective', 'sd.room.type'],
    },
    {
      id: 'sd.material',
      title: 'Sölitary Defilement · Material Quality + Composition',
      oracleIds: ['sd.material.quality', 'sd.material.composition'],
    },
    {
      id: 'sd.sound',
      title: 'Sölitary Defilement · Sound Quality + Type',
      oracleIds: ['sd.sound.quality', 'sd.sound.type'],
    },
  ];
  for (const p of shared)
    if (
      p.oracleIds.every((id) => tables.some((t) => t.id === id)) &&
      !procedures.some((e) => e.id === p.id)
    )
      procedures.push(p);
  const registry: OracleRegistry = {
    books,
    tables: tables.map((table) =>
      applyOracleSourceEvidence(
        correctOracleGuidance(correctOracleSourcePages(table)),
      ),
    ),
    procedures: procedures.map((procedure) => ({
      ...procedure,
      sourceRefs:
        procedure.sourceRefs ??
        (procedure.sourceBookId
          ? [
              {
                bookId: procedure.sourceBookId,
                bookTitle: books.find(
                  (book) => book.id === procedure.sourceBookId,
                )?.title,
                pdfPage: procedure.sourcePage,
                printedPage: procedure.printedPage,
                tableTitle: procedure.title,
              },
            ]
          : procedure.oracleIds
              .map((id) => tables.find((table) => table.id === id))
              .filter((table): table is OracleDefinition => !!table)
              .map((table) => ({
                bookId: table.sourceBookId,
                pdfPage: table.sourcePage,
                printedPage: table.printedPage,
                tableId: table.id,
                tableTitle: table.title,
              }))),
      generatorSteps:
        procedure.generatorSteps ??
        referenceGeneratorProcedure(procedure.id)?.steps ??
        procedure.oracleIds.map((tableId, index) => ({
          id: `${procedure.id}:${index + 1}`,
          tableId,
          count: 1,
          dice: tables.find((table) => table.id === tableId)?.dice,
        })),
    })),
  };
  const byExtra =
    registryCache.get(ruleKey) ?? new WeakMap<object, OracleRegistry>();
  byExtra.set(extraKey, registry);
  registryCache.set(ruleKey, byExtra);
  return registry;
}
/** Regional identity tables point at the existing supplied creature records, never copies of them. */
export function creatureIdentityTables(
  rules: RulesPack | null,
): OracleDefinition[] {
  const groups = new Map<string, Record<string, unknown>[]>();
  for (const record of rules?.creatures ?? []) {
    if (
      record.book !== 'feretory' ||
      record.section !== 'Eat Prey Kill' ||
      typeof record.tableId !== 'string' ||
      !record.tableId.startsWith('feretory.hunting.') ||
      typeof record.id !== 'string' ||
      typeof record.name !== 'string' ||
      typeof record.roll !== 'number' ||
      typeof record.pdfPage !== 'number'
    )
      continue;
    groups.set(record.tableId, [...(groups.get(record.tableId) ?? []), record]);
  }
  return Array.from(groups, ([tableId, records]) => ({
    id: tableId,
    canonicalTableId: tableId,
    sourceBookId: 'feretory',
    sourcePage: Array.from(
      new Set(records.map((record) => Number(record.pdfPage))),
    ).sort((a, b) => a - b),
    printedPage: Array.from(
      new Set(records.map((record) => String(record.printedPage))),
    ).join('–'),
    title: `Eat Prey Kill · ${String(records[0].region ?? records[0].regionKey)}`,
    category: 'MONSTER',
    dice: 'd6',
    tags: ['feretory', 'monster', String(records[0].regionKey)],
    sourceVerified: true,
    rollable:
      records.length === 6 &&
      new Set(records.map((record) => record.roll)).size === 6 &&
      records.every(
        (record) =>
          Number.isInteger(record.roll) &&
          Number(record.roll) >= 1 &&
          Number(record.roll) <= 6,
      ),
    entries: records
      .slice()
      .sort((a, b) => Number(a.roll) - Number(b.roll))
      .map((record) => ({
        id: String(record.id),
        min: Number(record.roll),
        max: Number(record.roll),
        get text() {
          return String(record.name);
        },
        metadata: {
          creatureId: record.id,
          pdfPage: record.pdfPage,
          printedPage: record.printedPage,
        },
      })),
  }));
}
/** One canonical adapter for a source-defined nested d-table; no copied text pool. */
export function nestedOracleTables(
  parent: OracleDefinition,
): OracleDefinition[] {
  return parent.entries.flatMap((entry) => {
    const sub = entry.metadata?.subtable;
    if (!sub || typeof sub !== 'object') return [];
    const value = sub as Record<string, unknown>;
    if (
      typeof value.id !== 'string' ||
      typeof value.title !== 'string' ||
      typeof value.dice !== 'string' ||
      !Array.isArray(value.entries)
    )
      throw new Error(`${parent.id}: malformed source subtable`);
    const tableId = `${parent.id}.${value.id}`;
    return [
      {
        ...parent,
        id: tableId,
        canonicalTableId: tableId,
        parentTableId: parent.id,
        title: value.title,
        dice: value.dice,
        originalDice: value.dice,
        sourceNote: `Conditional source subtable: ${parent.id}, ${entry.min}–${entry.max}.`,
        entries: value.entries.map((row: Record<string, unknown>) => {
          if (
            typeof row.min !== 'number' ||
            typeof row.max !== 'number' ||
            typeof row.text !== 'string'
          )
            throw new Error(`${tableId}: malformed source entry`);
          return {
            id: `${tableId}:${row.min}-${row.max}`,
            min: row.min,
            max: row.max,
            text: row.text,
            ...(row.metadata && typeof row.metadata === 'object'
              ? { metadata: row.metadata as Record<string, unknown> }
              : {}),
          };
        }),
      },
    ];
  });
}
/** All existing generators use this same canonical pack; their weighted sampling stays unchanged. */
export function getCanonicalRuleTable(id: string): RuleTable | undefined {
  return getRules()?.tables[id];
}
export function filterOracles(
  registry: OracleRegistry,
  filter: {
    query?: string;
    source?: string;
    category?: string;
    dice?: string;
    favorites?: string[];
  },
): OracleDefinition[] {
  const query = filter.query?.trim().toLocaleLowerCase() ?? '';
  return registry.tables.filter(
    (t) =>
      (!filter.source || t.sourceBookId === filter.source) &&
      (!filter.category || t.category === filter.category) &&
      (!filter.dice || t.dice === filter.dice) &&
      (!filter.favorites || filter.favorites.includes(t.id)) &&
      (!query ||
        `${t.title} ${registry.books.find((b) => b.id === t.sourceBookId)?.title} ${t.category} ${t.tags.join(' ')}`
          .toLocaleLowerCase()
          .includes(query)),
  );
}
