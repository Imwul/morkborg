import { buildOracleRegistry } from '../data/oracles';
import type { OracleRegistry, OracleRoll } from '../domain/oracle';
import type {
  GeneratedValueProvenance,
  GeneratorProcedure,
} from '../domain/generationProvenance';
import type { SourceReference } from '../domain/types';
import { creatureReferenceId } from '../domain/references';
import { getRules, type RuleEntry } from '../storage/rulesStore';
import { getOraclePack } from '../storage/oracleStore';
import { rollOracle, sourceLabel } from './oracleRoller';
import { random, type RandomSource } from './random';
import { scalarText } from './tables';
import creatureEvidence from './creatureSourceEvidence.json';
import { oracleValueProvenance } from '../domain/oracleProvenance';

const compact = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

let cachedRules: ReturnType<typeof getRules>;
let cachedPack: ReturnType<typeof getOraclePack>;
let cachedRegistry: OracleRegistry | undefined;
/** Registry construction and verification happen once per loaded source pack, never per field. */
export function creatureRegistry(): OracleRegistry {
  const rules = getRules(),
    pack = getOraclePack();
  if (!cachedRegistry || cachedRules !== rules || cachedPack !== pack) {
    cachedRegistry = buildOracleRegistry(rules, pack);
    cachedRules = rules;
    cachedPack = pack;
  }
  return cachedRegistry;
}
export function sourceReferenceForRoll(
  registry: OracleRegistry,
  result: OracleRoll,
  field?: string,
): SourceReference {
  const primary = result.metadata?.provenance?.sourceRefs.find(
    (ref) => ref.role !== 'routing',
  );
  if (primary) return compact({ ...primary, ...(field ? { field } : {}) });
  const table = registry.tables.find((t) => t.id === result.oracleId);
  if (!table || !table.sourceVerified || !table.sourcePage)
    throw new Error(`SOURCE DATA UNAVAILABLE: ${result.oracleId}`);
  return compact({
    field,
    bookId: table.sourceBookId,
    bookTitle: registry.books.find((b) => b.id === table.sourceBookId)?.title,
    tableId: table.id,
    tableTitle: table.title,
    pdfPage: table.sourcePage,
    printedPage: table.printedPage,
    roll: result.roll,
    entryId: result.entryId,
    role: 'primary',
    status: result.entryId ? 'VERIFIED' : 'UNAVAILABLE',
  });
}
export function provenanceForRoll(
  registry: OracleRegistry,
  result: OracleRoll,
  procedureId?: string,
): GeneratedValueProvenance {
  if (result.metadata?.provenance)
    return compact({
      ...result.metadata.provenance,
      ...(procedureId ? { procedureId } : {}),
    });
  return compact({
    classification: 'SOURCE_VERBATIM',
    origin: 'source',
    status: result.entryId ? 'VERIFIED' : 'UNAVAILABLE',
    sourceRefs: [sourceReferenceForRoll(registry, result)],
    sourceText: [result.text],
    rolls: [
      {
        tableId: result.oracleId,
        dice: result.dice,
        value: result.roll,
        entryId: result.entryId,
        diceValues: result.diceValues,
      },
    ],
    transformation: 'none',
    procedureId,
  });
}
export function rollCreatureTable(
  tableId: string,
  rng: RandomSource = random,
  registry = creatureRegistry(),
) {
  const table = registry.tables.find((t) => t.id === tableId);
  if (!table || !table.sourceVerified || table.rollable === false)
    throw new Error(`SOURCE DATA UNAVAILABLE: ${tableId}`);
  const result = rollOracle(table, registry, rng);
  return {
    value: result.text,
    source: result.source,
    provenance: provenanceForRoll(registry, result),
    result,
  };
}
export function provenanceForRuleEntry(
  tableId: string,
  entry: RuleEntry,
  transformation = 'none',
): GeneratedValueProvenance {
  const registry = creatureRegistry(),
    table = registry.tables.find((t) => t.id === tableId);
  const matches = table?.entries.filter((e) => e.text === entry.text);
  const canonical =
    matches?.find(
      (e) =>
        e.metadata === entry.meta ||
        e.min === Number(entry.meta.roll ?? entry.meta.min),
    ) ?? (matches?.length === 1 ? matches[0] : undefined);
  if (!table || !table.sourceVerified || !canonical)
    throw new Error(`SOURCE DATA UNAVAILABLE: ${tableId}`);
  const result: OracleRoll = {
    oracleId: table.id,
    title: table.title,
    dice: table.dice,
    roll: canonical.min,
    diceValues: [],
    entryId: canonical.id,
    text: canonical.text,
    source: sourceLabel(table, registry),
    metadata: {
      ...canonical.metadata,
      provenance: oracleValueProvenance(table, registry, canonical, {
        value: canonical.min,
        values: [],
      }),
    },
  };
  return {
    ...provenanceForRoll(registry, result),
    classification:
      transformation === 'none' ? 'SOURCE_VERBATIM' : 'APP_DERIVED',
    transformation,
    // A sampled source entry identifies its selector, not a die roll which never occurred.
    rolls: [
      {
        tableId,
        dice: 'source-entry selection',
        value: canonical.min,
        entryId: canonical.id,
      },
    ],
  };
}
/** Audited content fingerprints reject metadata-only claims of verification after source data changes. */
export function creatureRecordStatus(
  record: Record<string, unknown>,
): 'VERIFIED' | 'PARTIAL' {
  const text = JSON.stringify(
    Object.fromEntries(
      creatureEvidence.sourceFields
        .filter((field) => field in record)
        .map((field) => [field, record[field]]),
    ),
  );
  let hash = 2166136261;
  for (let index = 0; index < text.length; index++)
    hash = Math.imul(hash ^ text.charCodeAt(index), 16777619) >>> 0;
  const key = `${scalarText(record.book)}:${scalarText(record.pdfPage)}:${scalarText(record.name)}`;
  const fingerprints = (creatureEvidence.records as Record<string, string[]>)[
    key
  ];
  return fingerprints?.includes(hash.toString(16).padStart(8, '0'))
    ? 'VERIFIED'
    : 'PARTIAL';
}
export function creatureRecordReference(
  record: Record<string, unknown>,
  field?: string,
): SourceReference {
  if (
    typeof record.book !== 'string' ||
    typeof record.pdfPage !== 'number' ||
    !record.name
  )
    throw new Error('SOURCE DATA UNAVAILABLE: creature source record');
  const nested = record.source as { printedPage?: number | string } | undefined;
  return compact({
    field,
    bookId: record.book,
    bookTitle: creatureRegistry().books.find((b) => b.id === record.book)
      ?.title,
    tableId: creatureReferenceId(record),
    tableTitle: scalarText(record.section ?? record.context ?? record.name),
    pdfPage: record.pdfPage,
    printedPage:
      typeof record.printedPage === 'number' ||
      typeof record.printedPage === 'string'
        ? record.printedPage
        : (nested?.printedPage ??
          (record.book === 'core' ? record.pdfPage : undefined)),
    entryId:
      typeof record.id === 'string' ? record.id : creatureReferenceId(record),
    role: 'primary',
    status: creatureRecordStatus(record),
  });
}
export function provenanceForCreatureRecord(
  record: Record<string, unknown>,
  field: string,
  value: unknown,
  composed = false,
): GeneratedValueProvenance {
  const source = creatureRecordReference(record, field);
  const additional = record.additionalSource as
    | { pdfPage?: number; printedPage?: number }
    | undefined;
  const sourceRefs = [
    source,
    ...(composed && additional?.pdfPage
      ? [
          {
            ...source,
            pdfPage: additional.pdfPage,
            ...(additional.printedPage
              ? { printedPage: additional.printedPage }
              : {}),
            note: 'Source continuation',
          },
        ]
      : []),
  ];
  return {
    classification: composed ? 'SOURCE_COMPOSED' : 'SOURCE_VERBATIM',
    origin: 'source',
    status: creatureRecordStatus(record),
    sourceRefs,
    sourceText: [String(value)],
    procedureId: 'creature.source-record',
    transformation: composed
      ? 'Source statblock fields kept together; typography and concise source summary normalized.'
      : 'none',
  };
}
export const CREATURE_PROCEDURES: GeneratorProcedure[] = [
  {
    id: 'feretory.monster-approaches',
    title: 'The Monster Approaches',
    sourceRefs: [
      {
        bookId: 'feretory',
        pdfPage: [2, 3],
        tableTitle: 'The Monster Approaches',
        role: 'primary',
      },
    ],
    steps: [
      ...['A', 'B', 'C'].map((part) => ({
        id: part,
        tableId: `feretory.${part}`,
        dice: 'd12',
        count: 1,
      })),
      {
        id: 'morale',
        count: 1,
        dependsOn: ['A', 'B', 'C'],
        derived: 'max(A,B,C)',
      },
      {
        id: 'damage',
        count: 1,
        dependsOn: ['A', 'B', 'C'],
        derived:
          'Source damage range of min(A,B,C); higher die is an optional referee choice.',
      },
      {
        id: 'armor',
        count: 1,
        dependsOn: ['A', 'B', 'C'],
        derived:
          'Highest table: A no armor, B -d2, C odd -d4/even -d6; ties are unresolved referee choice.',
      },
      {
        id: 'hp',
        count: 1,
        dependsOn: ['damage'],
        derived: 'One damage die ×2; printed 2dN example conflicts with prose.',
      },
      { id: 'wants', tableId: 'feretory.desire', dice: 'd20', count: 1 },
      { id: 'trait', tableId: 'feretory.trait', dice: 'd20', count: 1 },
    ],
  },
  {
    id: 'sd.common-stocking',
    title: 'Common encounter stocking',
    sourceRefs: [
      {
        bookId: 'sd',
        pdfPage: 19,
        printedPage: 17,
        tableTitle: 'Dungeon preparation',
      },
    ],
    steps: [
      { id: 'creature', tableId: 'sd.stockCreatures', dice: 'd12', count: 1 },
    ],
  },
  {
    id: 'sd.rare-stocking',
    title: 'Rare encounter stocking',
    sourceRefs: [
      {
        bookId: 'sd',
        pdfPage: 19,
        printedPage: 17,
        tableTitle: 'Dungeon preparation',
      },
    ],
    steps: [
      {
        id: 'creature',
        tableId: 'sd.stockCreatures',
        dice: 'd8 + Dungeon DR',
        count: 1,
        derived: 'Do not clamp totals outside the printed 1–20 table.',
      },
    ],
  },
];
