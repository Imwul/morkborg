import type { OracleDefinition, OracleEntry, OracleRegistry } from './oracle';
import {
  ORACLE_SOURCE_ATTESTATIONS,
  oracleSourceFingerprint,
} from '../data/oracles/sourceEvidence';

/** Audited cross-pack targets owned by library.json, not the independent Oracle pack. */
export const PENDING_LIBRARY_ORACLE_IDS = [
  'core.sacred',
  'core.unclean',
  'sd.npc.disposition',
  'sd.npc.profession',
  'sd.odoursTastes',
  'sd.search.strong',
  'sd.search.weak',
  'sd.sound.quality',
  'sd.sound.type',
  'sd.stockCreatures',
  'sd.yesNo',
] as const;
const libraryTargets = new Set<string>(PENDING_LIBRARY_ORACLE_IDS);

/** An absent library may defer a previously audited link, never an arbitrary imported ID. */
export function isVerifiedPendingLibraryDependency(
  table: OracleDefinition,
  targetId: unknown,
): targetId is string {
  return (
    typeof targetId === 'string' &&
    libraryTargets.has(targetId) &&
    !!ORACLE_SOURCE_ATTESTATIONS[targetId] &&
    ORACLE_SOURCE_ATTESTATIONS[table.id]?.fingerprint ===
      oracleSourceFingerprint(table)
  );
}

/** Only the selected branch's explicit source dependencies matter; related navigation does not. */
export function oracleEntryDependencyWarning(
  entry: OracleEntry | undefined,
  registry: OracleRegistry,
): string | undefined {
  const followUps = entry?.metadata?.followUpOracleIds;
  const lookups = entry?.metadata?.fixedLookups;
  const missing = new Set<string>();
  if (Array.isArray(followUps))
    for (const id of followUps) {
      const target = registry.tables.find((table) => table.id === id);
      if (!target?.sourceVerified) missing.add(String(id));
    }
  if (Array.isArray(lookups))
    for (const lookup of lookups) {
      const target = registry.tables.find(
        (table) => table.id === lookup?.oracleId,
      );
      if (
        !target?.sourceVerified ||
        !Number.isInteger(lookup?.roll) ||
        !target.entries.some(
          (row) => row.min <= lookup.roll && row.max >= lookup.roll,
        )
      )
        missing.add(String(lookup?.oracleId));
    }
  return missing.size
    ? `SOURCE DATA UNAVAILABLE: ${[...missing].join(', ')} · 연결된 원문 자료를 먼저 가져오세요.`
    : undefined;
}

export function assertOracleEntryDependenciesAvailable(
  entry: OracleEntry | undefined,
  registry: OracleRegistry,
): void {
  const warning = oracleEntryDependencyWarning(entry, registry);
  if (warning) throw new Error(warning);
}
