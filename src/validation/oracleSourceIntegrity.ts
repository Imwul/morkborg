import type { OracleRegistry, OracleRoll } from '../domain/oracle';
import {
  ORACLE_SOURCE_ATTESTATIONS,
  oracleSourceFingerprint,
} from '../data/oracles/sourceEvidence';

/** Development/test report: resolving a source ID is distinct from verifying its wording. */
export function unresolvedOracleSources(registry: OracleRegistry): string[] {
  const unresolved: string[] = [];
  for (const table of registry.tables) {
    if (
      !registry.books.some((book) => book.id === table.sourceBookId) ||
      !table.sourcePage
    )
      unresolved.push(`${table.id}: source book/page unavailable`);
    const attestation = ORACLE_SOURCE_ATTESTATIONS[table.id];
    if (!attestation)
      unresolved.push(`${table.id}: no independent source audit`);
    else if (attestation.fingerprint !== oracleSourceFingerprint(table))
      unresolved.push(
        `${table.id}: source content changed since independent audit`,
      );
  }
  return unresolved;
}

export function assertOracleRollHasSource(
  roll: OracleRoll,
  registry: OracleRegistry,
): void {
  const provenance = roll.metadata?.provenance;
  if (
    !provenance ||
    !provenance.sourceRefs.length ||
    provenance.classification === 'UNSOURCED'
  )
    throw new Error(
      `${roll.oracleId}: generated result has no declared source provenance`,
    );
  for (const ref of provenance.sourceRefs) {
    const table = registry.tables.find(
      (candidate) => candidate.id === ref.tableId,
    );
    if (!table || table.sourceBookId !== ref.bookId)
      throw new Error(
        `${roll.oracleId}: unresolved source table ${ref.tableId ?? '(missing)'}`,
      );
    if (ref.entryId && !table.entries.some((entry) => entry.id === ref.entryId))
      throw new Error(
        `${roll.oracleId}: unresolved source entry ${ref.entryId}`,
      );
  }
  if (
    provenance.classification === 'SOURCE_VERBATIM' &&
    provenance.origin === 'source' &&
    provenance.sourceText?.[0] !== roll.text
  )
    throw new Error(
      `${roll.oracleId}: displayed text differs from its canonical English`,
    );
  if (!provenance.rolls?.length)
    throw new Error(`${roll.oracleId}: missing roll trace`);
}
