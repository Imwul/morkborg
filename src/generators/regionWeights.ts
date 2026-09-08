import type { RegionId } from '../domain/types';
import type { RuleEntry } from '../storage/rulesStore';
import { regionById } from '../data/regions';

// Editorial selection metadata, keyed by canonical numeric source entry identity.
// These tags change probability only; they are not text attributed to a book.
export const REGION_BOOST = 1.25;
export const REGION_ENTRY_TAGS: Record<string, readonly string[]> = {
  'core.danger:3': ['ruin'],
  'core.danger:6': ['cult'],
  'core.inhabitants:2': ['undead', 'corpse'],
  'core.inhabitants:3': ['cult'],
  'core.inhabitants:4': ['undead'],
  'core.inhabitants:5': ['urban', 'plague'],
  'core.inhabitants:8': ['forest', 'root'],
  'core.inhabitants:11': ['plague'],
  'core.inhabitants:12': ['nobility'],
  'core.feature:2': ['corpse', 'necromancy'],
  'core.feature:5': ['root'],
  'core.feature:6': ['corpse'],
  'core.feature:11': ['overgrowth'],
  'core.rooms:12': ['blood'],
  'core.rooms:22': ['blood'],
  'core.rooms:25': ['frost'],
  'core.rooms:32': ['tomb', 'funerary'],
  'core.rooms:44': ['nobility', 'ruin'],
  'sd.room.adjective:10': ['plague'],
  'sd.room.adjective:11': ['abandoned'],
  'sd.room.adjective:12': ['ruin'],
  'sd.room.type:1': ['grave', 'tomb'],
  'sd.room.type:9': ['cult'],
  'sd.room.type:12': ['tomb'],
  'reclvse.dungeonPurposeThen:1': ['cult'],
  'reclvse.dungeonEntrance:1': ['ruin'],
  'reclvse.dungeonEntrance:6': ['sewer', 'urban'],
  'reclvse.dungeonEntrance:7': ['cult'],
  'reclvse.dungeonEntrance:12': ['ruin'],
  'reclvse.dungeonEntrance:17': ['forest', 'overgrowth'],
  'reclvse.entranceState:3': ['ruin'],
  'reclvse.entranceState:11': ['root', 'overgrowth'],
};
export const REGION_WEIGHT_TABLES = new Set(
  Object.keys(REGION_ENTRY_TAGS).map((key) =>
    key.slice(0, key.lastIndexOf(':')),
  ),
);
export function sourceEntrySelector(entry: RuleEntry): number | undefined {
  const meta = entry.meta;
  if (typeof meta.d4 === 'number' && typeof meta.d6 === 'number')
    return meta.d4 * 10 + meta.d6;
  if (Array.isArray(meta.range)) return Number(meta.range[0]);
  if (typeof meta.min === 'number') return meta.min;
  if (typeof meta.roll === 'number') return meta.roll;
  return undefined;
}
export function entryTags(entry: RuleEntry): string[] {
  return Array.isArray(entry.meta.regionTags)
    ? entry.meta.regionTags.filter(
        (tag): tag is string => typeof tag === 'string',
      )
    : [];
}
export function regionWeightFactor(
  tableId: string,
  entry: RuleEntry,
  region?: RegionId,
): number {
  if (!region || !REGION_WEIGHT_TABLES.has(tableId)) return 1;
  const selector = sourceEntrySelector(entry);
  const tags = [
    ...entryTags(entry),
    ...(selector === undefined
      ? []
      : (REGION_ENTRY_TAGS[`${tableId}:${selector}`] ?? [])),
  ];
  return regionById(region).tags.some((tag) => tags.includes(tag))
    ? REGION_BOOST
    : 1;
}
