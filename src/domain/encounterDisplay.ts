import type { Encounter } from './types';
import type { OracleRegistry } from './oracle';

/** A card projection only: retained source text, instructions and manual edits stay unchanged. */
export function encounterCardTitle(
  encounter: Encounter,
  registry: OracleRegistry,
): string {
  const original = encounter.name || encounter.text || 'Untitled';
  if (encounter.name) return original;
  const provenance = encounter.fieldProvenance?.text;
  if (
    provenance?.origin !== 'source' ||
    provenance.classification !== 'SOURCE_VERBATIM' ||
    provenance.sourceText?.[0] !== encounter.text
  )
    return original;
  const ref = provenance.sourceRefs.find(
    (source) => source.role !== 'routing' && source.entryId,
  );
  const table = registry.tables.find(
    (candidate) => candidate.id === ref?.tableId,
  );
  const entry = table?.entries.find(
    (candidate) => candidate.id === ref?.entryId,
  );
  if (
    !table?.sourceVerified ||
    table.sourceBookId !== ref?.bookId ||
    entry?.text !== encounter.text ||
    entry.metadata?.sourceStatus !== 'VERIFIED' ||
    typeof entry.metadata.name !== 'string' ||
    !entry.metadata.name.trim()
  )
    return original;
  const { name, quantityDice, fixedQuantity } = entry.metadata;
  // Quantity expressions remain unrolled: preparing a candidate does not decide how many appear.
  if (typeof quantityDice === 'string' && /^d\d+$/.test(quantityDice))
    return `${quantityDice} ${name}`;
  if (
    typeof fixedQuantity === 'number' &&
    Number.isSafeInteger(fixedQuantity) &&
    fixedQuantity > 0
  )
    return `${name} × ${fixedQuantity}`;
  return original;
}
