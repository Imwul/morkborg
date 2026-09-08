import type { RegionId, SourceReference } from '../domain/types';
import type {
  GeneratedValueProvenance,
  RollTrace,
} from '../domain/generationProvenance';
import {
  getRules,
  sourceCitation,
  type RuleEntry,
} from '../storage/rulesStore';
import { getOraclePack } from '../storage/oracleStore';
import { getCanonicalRuleTable, buildOracleRegistry } from '../data/oracles';
import type { OracleDefinition } from '../domain/oracle';
import { random, rollDie, weightedPick, type RandomSource } from './random';
import { regionWeightFactor, REGION_WEIGHT_TABLES } from './regionWeights';
import { VERIFIED_DUNGEON_TABLES } from './dungeonProcedures';
export function scalarText(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : '';
}
export interface RuleRoll {
  value: string | number;
  source: string;
  provenance?: GeneratedValueProvenance;
}
export const coreRule = (page: number, detail: string) =>
  `MÖRK BORG BARE BONES EDITION · PDF ${page}쪽 · ${detail}`;
export function entries(tableId: string): RuleEntry[] {
  const table = getCanonicalRuleTable(tableId);
  if (!table) throw new Error(`SOURCE DATA UNAVAILABLE: ${tableId}`);
  return table.entries;
}
export function sourceEntryRange(
  entry: RuleEntry,
  index: number,
): [number, number] {
  const meta = entry.meta;
  if (typeof meta.d4 === 'number' && typeof meta.d6 === 'number')
    return [meta.d4 * 10 + meta.d6, meta.d4 * 10 + meta.d6];
  if (Array.isArray(meta.range))
    return [Number(meta.range[0]), Number(meta.range[1] ?? meta.range[0])];
  if (typeof meta.min === 'number')
    return [meta.min, Number(meta.max ?? meta.min)];
  if (typeof meta.roll === 'number')
    return [meta.roll, meta.roll + entry.weight - 1];
  return [index + 1, index + 1];
}
export function canonicalEntryId(
  tableId: string,
  entry: RuleEntry,
  index: number,
): string {
  const [min, max] = sourceEntryRange(entry, index);
  return `${tableId}:${min}-${max}`;
}
function select(
  tableId: string,
  region: RegionId | undefined,
  rng: RandomSource,
) {
  const table = getCanonicalRuleTable(tableId);
  if (!table?.entries.length)
    throw new Error(`SOURCE DATA UNAVAILABLE: ${tableId}`);
  const weighted =
    !!region &&
    REGION_WEIGHT_TABLES.has(tableId) &&
    table.entries.some(
      (entry) => regionWeightFactor(tableId, entry, region) !== 1,
    );
  let value: number;
  let diceValues: number[];
  let dice = Array.isArray(table.dice) ? table.dice.join(' × ') : table.dice;
  if (tableId === 'core.titleA' || tableId === 'core.titleB') dice = 'd12';
  let index: number;
  if (weighted) {
    index = weightedPick(
      table.entries.map((entry, index) => ({
        value: index,
        weight: entry.weight * regionWeightFactor(tableId, entry, region),
      })),
      rng,
    );
    const [min, max] = sourceEntryRange(table.entries[index], index);
    value = min + rollDie(max - min + 1, rng) - 1;
    diceValues = [value];
  } else if (
    tableId === 'core.rooms' ||
    dice === 'd66' ||
    /^d\d+ × d\d+$/.test(dice)
  ) {
    const sides =
      tableId === 'core.rooms'
        ? [4, 6]
        : dice === 'd66'
          ? [6, 6]
          : dice.split(' × ').map((part) => Number(part.slice(1)));
    if (tableId === 'core.rooms') dice = 'd4 × d6';
    diceValues = sides.map((sides) => rollDie(sides, rng));
    value = diceValues[0] * 10 + diceValues[1];
    index = table.entries.findIndex((entry, i) => {
      const [min, max] = sourceEntryRange(entry, i);
      return value >= min && value <= max;
    });
  } else {
    const explicitDice = /^d(\d+)/.exec(dice);
    const sides = explicitDice
      ? Number(explicitDice[1])
      : table.entries.reduce((sum, entry) => sum + entry.weight, 0);
    dice = explicitDice ? explicitDice[0] : `indexed d${sides}`;
    value = rollDie(sides, rng);
    diceValues = [value];
    let end = 0;
    index = table.entries.findIndex((entry) => {
      end += entry.weight;
      return value <= end;
    });
  }
  if (index < 0)
    throw new Error(`Unresolved source range: ${tableId} → ${value}`);
  const entry = table.entries[index];
  return {
    entry,
    index,
    trace: {
      tableId,
      dice,
      value,
      entryId: canonicalEntryId(tableId, entry, index),
      diceValues,
    } satisfies RollTrace,
    weighted,
  };
}
export function sampleEntry(
  tableId: string,
  region?: RegionId,
  rng: RandomSource = random,
): RuleEntry {
  return select(tableId, region, rng).entry;
}
let sourceRules: ReturnType<typeof getRules>;
let sourceOracles: ReturnType<typeof getOraclePack>;
let sourceTables = new Map<string, OracleDefinition>();
function auditedTable(tableId: string): OracleDefinition | undefined {
  const rules = getRules(),
    oracles = getOraclePack();
  if (rules !== sourceRules || oracles !== sourceOracles) {
    sourceRules = rules;
    sourceOracles = oracles;
    sourceTables = new Map(
      buildOracleRegistry(rules, oracles).tables.map((table) => [
        table.id,
        table,
      ]),
    );
  }
  return sourceTables.get(tableId);
}
export function sourceReferenceFor(
  tableId: string,
  entry?: RuleEntry,
  entryId?: string,
): SourceReference {
  const pack = getRules(),
    table = getCanonicalRuleTable(tableId);
  if (!table || !pack) throw new Error(`SOURCE DATA UNAVAILABLE: ${tableId}`);
  const verified = VERIFIED_DUNGEON_TABLES[tableId];
  const override = getOraclePack()?.overrides?.[tableId];
  const page =
    typeof entry?.meta.page === 'number' ? entry.meta.page : undefined;
  const canonical = auditedTable(tableId);
  const canonicalEntry = entryId
    ? canonical?.entries.find((entry) => entry.id === entryId)
    : undefined;
  const verifiedStatus =
    canonicalEntry?.metadata?.sourceStatus ??
    canonical?.sourceStatus ??
    'PARTIAL';
  return {
    bookId: table.book,
    bookTitle:
      pack.books.find((book) => book.id === table.book)?.title ?? table.book,
    tableId,
    tableTitle: verified?.title ?? override?.title ?? table.title,
    pdfPage: page ?? verified?.pdf ?? override?.sourcePage ?? table.pages,
    ...(verified || override?.printedPage != null
      ? {
          printedPage: verified
            ? table.book === 'core' && page
              ? page
              : verified.printed
            : override!.printedPage!,
        }
      : {}),
    role: 'primary',
    status: verifiedStatus === 'VERIFIED' ? 'VERIFIED' : 'PARTIAL',
    ...(entryId ? { entryId } : {}),
  };
}
export function rollTable(
  tableId: string,
  region?: RegionId,
  rng: RandomSource = random,
): RuleRoll {
  const selected = select(tableId, region, rng);
  const texts = [selected.entry.text];
  const rolls = [selected.trace];
  let parent = selected.entry;
  let path = selected.trace.entryId;
  while (parent.followup?.length) {
    const sides = parent.followup.reduce((sum, entry) => sum + entry.weight, 0);
    const value = rollDie(sides, rng);
    let end = 0;
    const index = parent.followup.findIndex((entry) => {
      end += entry.weight;
      return value <= end;
    });
    if (index < 0) throw new Error(`Unresolved source followup: ${tableId}`);
    parent = parent.followup[index];
    path += `/followup:${sourceEntryRange(parent, index).join('-')}`;
    texts.push(parent.text);
    rolls.push({
      tableId,
      dice: `d${sides}`,
      value,
      entryId: path,
      diceValues: [value],
    });
  }
  const sourceRef = sourceReferenceFor(
    tableId,
    selected.entry,
    selected.trace.entryId,
  );
  const pack = getRules()!;
  return {
    value: texts.join(' · '),
    source:
      sourceCitation(tableId) +
      (selected.weighted ? ` · Region weighting: ${region}` : ''),
    provenance: {
      classification: texts.length > 1 ? 'SOURCE_COMPOSED' : 'SOURCE_VERBATIM',
      origin: 'source',
      status: sourceRef.status ?? 'PARTIAL',
      sourceRefs: [sourceRef],
      sourceText: texts,
      rolls,
      ...(['core.status', 'core.danger', 'core.rooms'].includes(tableId)
        ? {
            procedureId:
              tableId === 'core.rooms'
                ? 'core.sample-room'
                : tableId === 'core.status'
                  ? 'core.dungeon-status'
                  : 'core.imminent-danger',
          }
        : {}),
      transformation:
        texts.length > 1
          ? 'Parent and its printed conditional result remain separate fragments, joined with ·.'
          : 'Source entry unchanged.',
      ...(selected.weighted ? { regionWeighting: region } : {}),
      datasetVersion:
        typeof pack.notes.sourceVersion === 'string'
          ? pack.notes.sourceVersion
          : typeof pack.notes.translationEdition === 'string'
            ? pack.notes.translationEdition
            : `rules-schema-${pack.schemaVersion}`,
    },
  };
}
export const abilityModifier = (total: number): number =>
  total <= 4
    ? -3
    : total <= 6
      ? -2
      : total <= 8
        ? -1
        : total <= 12
          ? 0
          : total <= 14
            ? 1
            : total <= 16
              ? 2
              : 3;
