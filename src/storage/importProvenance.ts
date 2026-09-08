import { buildOracleRegistry } from '../data/oracles';
import type { GeneratedValueProvenance } from '../domain/generationProvenance';
import { REFERENCE_GENERATOR_PROCEDURES } from '../domain/referenceGeneratorProcedures';
import { DUNGEON_PROCEDURES } from '../generators/dungeonProcedures';
import { CREATURE_PROCEDURES } from '../generators/creatureProvenance';
import { buildCharacterProcedures } from '../generators/characterClasses';
import {
  createGenerationValidationContext,
  sourceEntry,
  type GenerationValidationContext,
} from '../validation/generationValidation';
import { getRules } from './rulesStore';
import { getOraclePack } from './oracleStore';

const builtInProcedureIds = new Set([
  'app.structural-identifier',
  'creature.source-record',
]);
function knownProcedure(
  id: string,
  context: GenerationValidationContext,
): boolean {
  return builtInProcedureIds.has(id) || context.procedures.has(id);
}

/** Import inspection never regenerates saved text. The context is constructed once per import. */
export function markUnresolvedImportedSources(
  value: unknown,
  sources?: Set<string> | GenerationValidationContext,
): void {
  if (!sources) {
    const rules = getRules(),
      pack = getOraclePack();
    // Data still loading is not evidence that historical source IDs were deleted.
    if (!rules || !pack) return;
    sources = createGenerationValidationContext(
      buildOracleRegistry(rules, pack),
      rules,
      [
        ...DUNGEON_PROCEDURES,
        ...CREATURE_PROCEDURES,
        ...REFERENCE_GENERATOR_PROCEDURES,
        ...buildCharacterProcedures(),
      ],
    );
  }
  const context = sources instanceof Set ? undefined : sources;
  const knownIds =
    sources instanceof Set
      ? sources
      : new Set([
          ...sources.tables.keys(),
          ...sources.creatures.keys(),
          ...sources.procedures.keys(),
        ]);
  const known = (id: string) =>
    knownIds.has(id) || (!!context && knownProcedure(id, context));
  const checkEntry = (
    tableId: string,
    entryId: string,
    missing: Set<string>,
  ) => {
    if (!context) return;
    if (context.tables.has(tableId)) {
      if (!sourceEntry(context, tableId, entryId)) missing.add(entryId);
    } else {
      const creature = context.creatures.get(tableId);
      if (creature && ![creature.id, tableId].includes(entryId))
        missing.add(entryId);
    }
  };
  function visit(value: unknown): void {
    if (!value || typeof value !== 'object') return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    const item = value as Record<string, unknown>;
    if (item.classification && Array.isArray(item.sourceRefs)) {
      const provenance = item as unknown as GeneratedValueProvenance;
      const missing = new Set<string>();
      for (const ref of [
        ...provenance.sourceRefs,
        ...(provenance.authority ?? []).flatMap(
          (authority) => authority.sourceRefs ?? [],
        ),
      ]) {
        if (ref.tableId && !known(ref.tableId)) missing.add(ref.tableId);
        else if (ref.tableId && ref.entryId)
          checkEntry(ref.tableId, ref.entryId, missing);
        if (context && ref.bookId && !context.books.has(ref.bookId))
          missing.add(`book:${ref.bookId}`);
      }
      if (
        provenance.procedureId &&
        !(context
          ? knownProcedure(provenance.procedureId, context)
          : known(provenance.procedureId))
      )
        missing.add(provenance.procedureId);
      for (const roll of provenance.rolls ?? []) {
        if (!known(roll.tableId)) missing.add(roll.tableId);
        else if (roll.entryId) checkEntry(roll.tableId, roll.entryId, missing);
      }
      if (missing.size) {
        provenance.status = 'UNAVAILABLE';
        provenance.unresolvedSourceIds = [
          ...new Set([...(provenance.unresolvedSourceIds ?? []), ...missing]),
        ];
      }
      return;
    }
    Object.values(item).forEach(visit);
  }
  visit(value);
}
