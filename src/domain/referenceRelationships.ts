import type { OracleRegistry } from './oracle';
import type { SourceReference } from './types';
import {
  relatedReferences,
  type ReferenceEntry,
  type ReferenceRegistry,
} from './references';
import {
  DUNGEON_PREPARATION_FIELDS,
  DUNGEON_PREPARATION_SOURCE_REFS,
} from './dungeonReferencePreparation';

export type ReferenceRelationshipKind = 'USES' | 'USED BY';

/** Read-time evidence only; never saved in a pack, reading, or campaign. */
export interface ReferenceRelationshipEvidence {
  sourceId: string;
  rawTargetId: string;
  targetId?: string;
  origin: string;
  sourceRefs: SourceReference[];
  status:
    | 'resolved'
    | 'missing-source'
    | 'missing-target'
    | 'unverified'
    | 'self';
}

export interface ReferenceRelationship {
  sourceId: string;
  targetId: string;
  kind: ReferenceRelationshipKind;
  origins: string[];
  sourceRefs: SourceReference[];
  aliasIds: string[];
}

export interface ReferenceRelationshipIndex {
  bySource: Record<string, ReferenceRelationship[]>;
  forward: ReferenceRelationship[];
  reverse: ReferenceRelationship[];
  evidence: ReferenceRelationshipEvidence[];
}

const unique = <T>(values: T[]) => [...new Set(values)];
const uniqueSources = (sources: SourceReference[]) => [
  ...new Map(
    sources.map((source) => [JSON.stringify(source), source]),
  ).values(),
];

/**
 * The only global edges added here are uses declared by verified procedures.
 * Related/canonicalIds are not evidence of a dependency. Row conditions remain
 * with their rows, and the existing semantic shortcuts receive no source label.
 */
export function buildReferenceRelationships(
  references: ReferenceRegistry,
  oracles: OracleRegistry,
): ReferenceRelationshipIndex {
  const evidence: ReferenceRelationshipEvidence[] = [];
  const tables = new Map(oracles.tables.map((table) => [table.id, table]));
  const record = (
    sourceId: string,
    tableId: string,
    origin: string,
    sourceRefs: SourceReference[],
  ) => {
    const source = references.byId[sourceId];
    const target = references.byId[`oracle:${tableId}`];
    const table = tables.get(tableId);
    evidence.push({
      sourceId: source?.id ?? sourceId,
      rawTargetId: `oracle:${tableId}`,
      targetId: target?.id,
      origin,
      sourceRefs,
      status: !source
        ? 'missing-source'
        : !target || !table
          ? 'missing-target'
          : !table.sourceVerified
            ? 'unverified'
            : source.id === target.id
              ? 'self'
              : 'resolved',
    });
  };

  for (const procedure of oracles.procedures) {
    if (procedure.authority !== 'SOURCE_PROCEDURE') continue;
    const sourceId = `procedure:${procedure.id}`;
    const sourceRefs = procedure.sourceRefs ?? [];
    procedure.oracleIds.forEach((tableId, index) => {
      record(
        sourceId,
        tableId,
        `procedures.${procedure.id}.oracleIds[${index}]`,
        sourceRefs,
      );
    });
    // The source's optional street-exits field is not a result-dependent branch.
    // Do not generalize conditional generator steps into table-wide links.
    if (procedure.id === 'aitc.street') {
      const index =
        procedure.generatorSteps?.findIndex(
          (step) => step.id === 'exits' && step.tableId === 'aitc.street-exits',
        ) ?? -1;
      if (index >= 0)
        record(
          sourceId,
          'aitc.street-exits',
          `procedures.${procedure.id}.generatorSteps[${index}].tableId`,
          sourceRefs,
        );
    }
  }

  // SD explicitly permits the Core dungeon tables. RECLVSE entrance is an app
  // choice and keeps its existing generic Related link, without a source label.
  if (references.byId['procedure:sd.dungeon-preparation']) {
    for (const field of DUNGEON_PREPARATION_FIELDS) {
      for (const tableId of field.tableIds) {
        if (!tableId.startsWith('core.')) continue;
        record(
          'procedure:sd.dungeon-preparation',
          tableId,
          `DUNGEON_PREPARATION_FIELDS.${field.key}.tableIds`,
          DUNGEON_PREPARATION_SOURCE_REFS,
        );
      }
    }
  }

  const forwardByPair = new Map<string, ReferenceRelationship>();
  for (const item of evidence) {
    if (item.status !== 'resolved' || !item.targetId) continue;
    const key = `${item.sourceId}\n${item.targetId}`;
    const existing = forwardByPair.get(key);
    const aliasIds =
      item.rawTargetId === item.targetId ? [] : [item.rawTargetId];
    if (existing) {
      existing.origins = unique([...existing.origins, item.origin]);
      existing.sourceRefs = uniqueSources([
        ...existing.sourceRefs,
        ...item.sourceRefs,
      ]);
      existing.aliasIds = unique([...existing.aliasIds, ...aliasIds]);
    } else {
      forwardByPair.set(key, {
        sourceId: item.sourceId,
        targetId: item.targetId,
        kind: 'USES',
        origins: [item.origin],
        sourceRefs: uniqueSources(item.sourceRefs),
        aliasIds,
      });
    }
  }
  const forward = [...forwardByPair.values()];
  const reverse: ReferenceRelationship[] = forward.map((relationship) => ({
    ...relationship,
    sourceId: relationship.targetId,
    targetId: relationship.sourceId,
    kind: 'USED BY',
  }));
  const bySource: ReferenceRelationshipIndex['bySource'] = {};
  for (const relationship of [...forward, ...reverse])
    (bySource[relationship.sourceId] ??= []).push(relationship);
  return { bySource, forward, reverse, evidence };
}

const indexes = new WeakMap<
  ReferenceRegistry,
  WeakMap<OracleRegistry, ReferenceRelationshipIndex>
>();

/** At most one registry scan per pair of immutable registry identities. */
export function getReferenceRelationships(
  references: ReferenceRegistry,
  oracles: OracleRegistry,
): ReferenceRelationshipIndex {
  const existing = indexes.get(references)?.get(oracles);
  if (existing) return existing;
  const result = buildReferenceRelationships(references, oracles);
  const byOracles = indexes.get(references) ?? new WeakMap();
  byOracles.set(oracles, result);
  indexes.set(references, byOracles);
  return result;
}

export interface RelatedReferenceRelationship {
  entry: ReferenceEntry;
  kind?: ReferenceRelationshipKind;
  origins: string[];
  sourceRefs: SourceReference[];
}

/** One local adjacency read plus the existing bounded Related list, not a graph scan. */
export function relatedReferenceRelationships(
  references: ReferenceRegistry,
  index: ReferenceRelationshipIndex,
  id: string,
  limit = 8,
): RelatedReferenceRelationship[] {
  const sourceId = references.byId[id]?.id;
  if (!sourceId) return [];
  const results: RelatedReferenceRelationship[] = [];
  const seen = new Set([sourceId]);
  for (const edge of index.bySource[sourceId] ?? []) {
    const entry = references.byId[edge.targetId];
    if (!entry || seen.has(entry.id)) continue;
    seen.add(entry.id);
    results.push({
      entry,
      kind: edge.kind,
      origins: edge.origins,
      sourceRefs: edge.sourceRefs,
    });
  }
  for (const entry of relatedReferences(references, sourceId, 8)) {
    if (seen.has(entry.id)) continue;
    seen.add(entry.id);
    results.push({ entry, origins: [], sourceRefs: [] });
  }
  return results.slice(0, Math.max(1, Math.min(8, limit)));
}
