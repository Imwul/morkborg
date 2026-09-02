import type { RegionId } from '../domain/types';
import { sourceCitation, type RuleEntry } from '../storage/rulesStore';
import { getCanonicalRuleTable } from '../data/oracles';
import { weightedPick } from './random';
import { regionWeightFactor, REGION_WEIGHT_TABLES } from './regionWeights';
export function scalarText(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : '';
}
export interface RuleRoll {
  value: string | number;
  source: string;
}
export const coreRule = (page: number, detail: string) =>
  `MÖRK BORG BARE BONES EDITION · PDF ${page}쪽 · ${detail}`;
export function entries(tableId: string): RuleEntry[] {
  const table = getCanonicalRuleTable(tableId);
  if (!table) throw new Error(`원문 표를 불러와야 합니다: ${tableId}`);
  return table.entries;
}
export function sampleEntry(tableId: string, region?: RegionId): RuleEntry {
  return weightedPick(
    entries(tableId).map((entry) => ({
      value: entry,
      weight: entry.weight * regionWeightFactor(tableId, entry.text, region),
    })),
  );
}
function entryText(
  entry: RuleEntry,
  tableId: string,
  region?: RegionId,
): string {
  const sub = entry.followup
    ? weightedPick(
        entry.followup.map((value) => ({
          value,
          weight:
            value.weight * regionWeightFactor(tableId, value.text, region),
        })),
      )
    : undefined;
  return sub ? `${entry.text}: ${entryText(sub, tableId, region)}` : entry.text;
}
export function rollTable(tableId: string, region?: RegionId): RuleRoll {
  const entry = sampleEntry(tableId, region);
  return {
    value: entryText(entry, tableId, region),
    source:
      sourceCitation(tableId) +
      (region && REGION_WEIGHT_TABLES.has(tableId)
        ? ' · 지역 태그 확률 보정'
        : ''),
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
