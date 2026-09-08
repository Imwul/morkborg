import {
  editedProvenance,
  type GeneratedValueProvenance,
} from './generationProvenance';

/** A structural copy suffix changes display text, never its original source snapshot. */
export function copiedValueProvenance(
  prior?: GeneratedValueProvenance,
): GeneratedValueProvenance {
  if (!prior) return editedProvenance();
  const copy = structuredClone(prior);
  return {
    ...copy,
    classification: copy.origin === 'source' ? 'APP_DERIVED' : 'USER_AUTHORED',
    transformation: [
      copy.transformation === 'none' ? '' : copy.transformation,
      'Append structural copy label to the saved identity; original source text and rolls are unchanged.',
    ]
      .filter(Boolean)
      .join(' '),
  };
}

export function markCopiedIdentity(
  value: { fieldProvenance?: Record<string, GeneratedValueProvenance> },
  field: string,
): void {
  value.fieldProvenance = {
    ...value.fieldProvenance,
    [field]: copiedValueProvenance(value.fieldProvenance?.[field]),
  };
}
