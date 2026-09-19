import type { OracleDefinition, OracleEntry } from './oracle';
import type { RuleEntry } from '../storage/rulesStore';
import { DUNGEON_PROCEDURES } from '../generators/dungeonProcedures';
import { diceDomain } from '../generators/oracleRoller';
import { isScenarioTable } from '../data/scenarioExclusions';

// Source selectors identify audited procedure metadata, never a second text pool.
const SOURCE_STEPS: Record<string, Record<number, [string, string]>> = {
  'core.status': { 3: ['core.dungeon-status', 'reason'] },
  'core.danger': { 1: ['core.imminent-danger', 'flood'] },
  'core.rooms': {
    11: ['core.sample-room', 'motif'],
    33: ['core.sample-room', 'shelves'],
    43: ['core.sample-room', 'altar'],
  },
};

/** A transient view of original inline entries; never installed in the registry. */
export function inlineSourceSubtable(
  parent: OracleDefinition,
  entry: OracleEntry,
): OracleDefinition | null {
  const stepIds = SOURCE_STEPS[parent.id]?.[entry.min];
  if (
    !stepIds ||
    isScenarioTable(parent.id) ||
    parent.sourceBookId !== 'core' ||
    !parent.sourceVerified ||
    parent.rollable === false ||
    entry.sourceUnclear ||
    !parent.entries.includes(entry) ||
    !Array.isArray(entry.metadata?.followup)
  )
    return null;
  const step = DUNGEON_PROCEDURES.find((p) => p.id === stepIds[0])?.steps.find(
    (s) => s.id === stepIds[1] && s.tableId === parent.id,
  );
  if (!step?.dice) return null;
  const rows = entry.metadata.followup as RuleEntry[];
  const entries: OracleEntry[] = [];
  for (const row of rows) {
    if (!row || typeof row.text !== 'string' || !row.meta) return null;
    const min = row.meta.roll ?? row.meta.min;
    const max = row.meta.roll ?? row.meta.max;
    if (
      typeof min !== 'number' ||
      typeof max !== 'number' ||
      !Number.isInteger(min) ||
      !Number.isInteger(max) ||
      min > max
    )
      return null;
    entries.push({
      id: `${entry.id}/followup:${min}-${max}`,
      min,
      max,
      text: row.text,
      metadata: {
        ...row.meta,
        parentEntryId: entry.id,
        pdfPage: entry.metadata.pdfPage ?? parent.sourcePage,
        printedPage: entry.metadata.printedPage ?? parent.printedPage,
        sourceStatus: entry.metadata.sourceStatus ?? parent.sourceStatus,
        generationClassification: entry.metadata.generationClassification,
        datasetVersion: entry.metadata.datasetVersion,
      },
    });
  }
  const domain = diceDomain(step.dice);
  if (
    domain.some(
      (value) =>
        entries.filter((row) => row.min <= value && row.max >= value).length !==
        1,
    ) ||
    entries.some(
      (row) => !domain.includes(row.min) || !domain.includes(row.max),
    )
  )
    return null;
  return {
    id: parent.id,
    canonicalTableId: parent.canonicalTableId ?? parent.id,
    sourceBookId: parent.sourceBookId,
    sourcePage:
      (entry.metadata.pdfPage as number | number[]) ?? parent.sourcePage,
    printedPage:
      (entry.metadata.printedPage as number | string) ?? parent.printedPage,
    sourceVerified: parent.sourceVerified,
    sourceStatus: parent.sourceStatus,
    title: `${parent.title} · ${entry.text}`,
    category: parent.category,
    tags: parent.tags,
    dice: step.dice,
    originalDice: step.dice,
    rollable: true,
    entries,
  };
}
