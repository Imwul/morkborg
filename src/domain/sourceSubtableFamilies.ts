import type { OracleRegistry } from './oracle';
import type { ReferenceRegistry } from './references';
import { readRowRelationships } from './rowRelationships';

export interface SourceSubtableFamily {
  /** Selectors and children are existing References, in printed row order. */
  parentIds: string[];
  childIds: string[];
}

/**
 * Only an explicit SUBTABLE pointer in a canonical row may establish a family.
 * This is local navigation, not a USES/USED BY dependency or a copied table.
 */
export function sourceSubtableFamilies(
  oracles: OracleRegistry,
  references: ReferenceRegistry,
): SourceSubtableFamily[] {
  const families = new Map<string, SourceSubtableFamily>();
  const tables = new Map(oracles.tables.map((table) => [table.id, table]));
  for (const table of oracles.tables) {
    const parentId = `oracle:${table.id}`;
    if (!table.sourceVerified || !references.byId[parentId]) continue;
    const childIds = [
      ...new Set(
        table.entries.flatMap((row) =>
          readRowRelationships(row.metadata, table.id)
            .filter((edge) => edge.kind === 'SUBTABLE')
            .map((edge) => edge.targetId),
        ),
      ),
    ].filter((referenceId) => {
      const child = references.byId[referenceId];
      const source = tables.get(referenceId.slice('oracle:'.length));
      return (
        child?.kind === 'oracle' &&
        source?.sourceVerified &&
        source.sourceBookId === table.sourceBookId &&
        child.canonicalIds.includes(source.id)
      );
    });
    if (childIds.length < 2) continue;
    const key = `${table.sourceBookId}\n${childIds.join('\n')}`;
    const family = families.get(key);
    if (family) family.parentIds.push(parentId);
    else families.set(key, { parentIds: [parentId], childIds });
  }
  return [...families.values()];
}

export function sourceSubtableFamilyFor(
  families: SourceSubtableFamily[],
  referenceId: string,
): SourceSubtableFamily | undefined {
  return families.find(
    (family) =>
      family.parentIds.includes(referenceId) ||
      family.childIds.includes(referenceId),
  );
}
