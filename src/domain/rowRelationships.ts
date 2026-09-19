import type { ReferenceEntry } from './references';
import {
  isScenarioReference,
  isScenarioTable,
} from '../data/scenarioExclusions';

export type RowRelationshipKind = 'FOLLOW-UP' | 'SUBTABLE' | 'LOOKUP';
export interface RowRelationship {
  targetId: string;
  kind?: RowRelationshipKind;
  /** Existing metadata path, retained for audits rather than persisted. */
  origin: string;
  lookupRoll?: number;
}
export interface ResolvedRowRelationship extends RowRelationship {
  entry: ReferenceEntry;
  origins: string[];
}

const object = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
const explicitTableId = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[a-z][a-z0-9-]*(?:\.[a-zA-Z0-9-]+)+$/.test(value);

// These exact source procedure IDs are represented by existing procedural rules.
// This binds IDs, not titles; an unknown source procedure is never name-matched.
const PROCEDURAL_RULE_IDS = new Set([
  'sd.stockCommon',
  'sd.stockRare',
  'sd.npc',
  'depths.rareMonster',
]);

/** Read one row only. No registry scan, RNG, canonical mutation or saved schema. */
export function readRowRelationships(
  metadata?: Record<string, unknown>,
  tableId?: string,
): RowRelationship[] {
  if (!metadata || (tableId && isScenarioTable(tableId))) return [];
  const edges: RowRelationship[] = [];
  const add = (
    targetId: unknown,
    kind: RowRelationshipKind | undefined,
    origin: string,
    lookupRoll?: number,
  ) => {
    if (
      typeof targetId !== 'string' ||
      !targetId ||
      isScenarioReference(targetId)
    )
      return;
    edges.push({
      targetId,
      kind,
      origin,
      ...(lookupRoll == null ? {} : { lookupRoll }),
    });
  };
  const addTable = (
    value: unknown,
    kind: RowRelationshipKind,
    origin: string,
    legacy = false,
  ) => {
    if (
      typeof value === 'string' &&
      value &&
      (!legacy || explicitTableId(value)) &&
      !isScenarioTable(value)
    )
      add(`oracle:${value}`, kind, origin);
  };
  const addProcedure = (value: unknown, origin: string) => {
    if (explicitTableId(value))
      add(
        `${PROCEDURAL_RULE_IDS.has(value) ? 'rule' : 'procedure'}:${value}`,
        'FOLLOW-UP',
        origin,
      );
  };
  const addLookup = (value: unknown, roll: unknown, origin: string) => {
    if (
      typeof value === 'string' &&
      value &&
      !isScenarioTable(value) &&
      typeof roll === 'number' &&
      Number.isSafeInteger(roll)
    )
      add(`oracle:${value}`, 'LOOKUP', origin, roll);
  };
  if (Array.isArray(metadata.followUpReferenceIds))
    metadata.followUpReferenceIds.forEach((value) =>
      add(value, 'FOLLOW-UP', 'followUpReferenceIds'),
    );
  if (Array.isArray(metadata.followUpOracleIds))
    metadata.followUpOracleIds.forEach((value) =>
      addTable(value, 'FOLLOW-UP', 'followUpOracleIds'),
    );
  const follow = object(metadata.followUp);
  if (follow) {
    addTable(follow.table, 'FOLLOW-UP', 'followUp.table', true);
    if (Array.isArray(follow.tables))
      follow.tables.forEach((value) =>
        addTable(value, 'FOLLOW-UP', 'followUp.tables', true),
      );
    addProcedure(follow.procedure, 'followUp.procedure');
    if (Array.isArray(follow.choices))
      follow.choices.forEach((choice) =>
        addProcedure(object(choice)?.procedure, 'followUp.choices.procedure'),
      );
  }
  // A playReferences row already opens its own definition through referenceId.
  if (typeof metadata.referenceId !== 'string')
    addProcedure(metadata.procedureId, 'procedureId');
  if (
    tableId === 'reclvse.quickContents' ||
    tableId === 'reclvse.contentsCategory'
  ) {
    const value = metadata.subtableId;
    if (
      typeof value === 'string' &&
      ['roomDiscovery', 'roomHazard', 'roomEncounter', 'roomLoot'].includes(
        value,
      )
    )
      addTable(`reclvse.${value}`, 'SUBTABLE', 'subtableId');
  }
  const nested = object(metadata.subtable);
  if (
    tableId &&
    typeof nested?.id === 'string' &&
    /^[a-zA-Z0-9-]+$/.test(nested.id)
  )
    addTable(`${tableId}.${nested.id}`, 'SUBTABLE', 'subtable.id');
  if (
    (tableId === 'core.gearA' || tableId === 'core.gearB') &&
    (metadata.scrollTable === 'unclean' || metadata.scrollTable === 'sacred')
  )
    addTable(`core.${metadata.scrollTable}`, 'SUBTABLE', 'scrollTable');
  if (Array.isArray(metadata.fixedLookups))
    metadata.fixedLookups.forEach((value) => {
      const lookup = object(value);
      addLookup(lookup?.oracleId, lookup?.roll, 'fixedLookups');
    });
  // A selector without exactly one explicit target is ambiguous; never guess it.
  if (
    Array.isArray(metadata.followUpOracleIds) &&
    metadata.followUpOracleIds.length === 1
  ) {
    const target = metadata.followUpOracleIds[0];
    addLookup(target, metadata.fixedEntry, 'fixedEntry');
    if (Array.isArray(metadata.fixedEntries))
      metadata.fixedEntries.forEach((roll) =>
        addLookup(target, roll, 'fixedEntries'),
      );
  }
  // EPK hunt rows carry source IDs; creatureReferenceId uses book + source ID.
  // Restrict this namespace binding to the audited source identity tables.
  if (
    tableId?.startsWith('feretory.hunting.') &&
    typeof metadata.creatureId === 'string' &&
    metadata.creatureId.startsWith('feretory.epk.')
  )
    add(`creature:feretory:${metadata.creatureId}`, undefined, 'creatureId');
  return edges;
}

/** Resolve direct IDs and paired aliases, keeping fixed selectors distinct. */
export function resolveRowRelationships(
  byId: Record<string, ReferenceEntry>,
  metadata?: Record<string, unknown>,
  tableId?: string,
  excludeId?: string,
): ResolvedRowRelationship[] {
  const selfIds = new Set([
    byId[excludeId ?? '']?.id ?? excludeId,
    byId[`oracle:${tableId}`]?.id,
  ]);
  const results = new Map<string, ResolvedRowRelationship>();
  const fixedTargets = new Set<string>();
  for (const edge of readRowRelationships(metadata, tableId)) {
    const entry = byId[edge.targetId];
    if (!entry || selfIds.has(entry.id) || isScenarioReference(entry.id))
      continue;
    if (edge.lookupRoll != null) fixedTargets.add(entry.id);
    // Paired references can display several canonical tables; fixed selectors
    // must retain their original table even when the displayed reference is one.
    const key = `${edge.lookupRoll == null ? entry.id : edge.targetId}\u0000${edge.lookupRoll ?? ''}`;
    const existing = results.get(key);
    if (existing) {
      if (!existing.origins.includes(edge.origin))
        existing.origins.push(edge.origin);
      // Keep one visible destination; only use a label when both paths agree.
      if (existing.kind !== edge.kind) existing.kind = undefined;
    } else {
      results.set(key, { ...edge, entry, origins: [edge.origin] });
    }
  }
  return [...results.values()].filter(
    (edge) => edge.lookupRoll != null || !fixedTargets.has(edge.entry.id),
  );
}
