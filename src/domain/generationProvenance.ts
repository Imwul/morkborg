import type { RegionId, SourceReference } from './types';

export type GenerationClassification =
  | 'SOURCE_VERBATIM'
  | 'SOURCE_COMPOSED'
  | 'APP_DERIVED'
  | 'USER_AUTHORED'
  | 'UNSOURCED';
export type ValueOrigin = 'source' | 'source-edited' | 'manual';
export type SourceStatus = 'VERIFIED' | 'PARTIAL' | 'CONFLICT' | 'UNAVAILABLE';
export interface RollTrace {
  tableId: string;
  dice: string;
  value: number;
  entryId?: string | null;
  diceValues?: number[];
}
export interface GeneratedValueProvenance {
  classification: GenerationClassification;
  origin: ValueOrigin;
  status: SourceStatus;
  sourceRefs: SourceReference[];
  sourceText?: string[];
  rolls?: RollTrace[];
  transformation?: string;
  procedureId?: string;
  datasetVersion?: string;
  regionWeighting?: RegionId;
  unresolvedSourceIds?: string[];
  /** Component keys used by an automatic display mirror; direct user edits detach it. */
  derivedFrom?: string[];
}
export interface GeneratorStep {
  id: string;
  tableId?: string;
  dice?: string;
  count: number;
  condition?: string;
  derived?: string;
  dependsOn?: string[];
}
export interface GeneratorProcedure {
  id: string;
  title: string;
  sourceRefs: SourceReference[];
  steps: GeneratorStep[];
}
export interface RoomComponent {
  key: string;
  label: string;
  sourceText: string;
  translationKo?: string;
  provenance: GeneratedValueProvenance;
}

/** Source text and original rolls survive edits; the edited display never claims verbatim origin. */
export function editedProvenance(
  prior?: GeneratedValueProvenance,
): GeneratedValueProvenance {
  if (prior) {
    const edited: GeneratedValueProvenance = {
      ...structuredClone(prior),
      origin: prior.origin === 'manual' ? 'manual' : 'source-edited',
      classification: 'USER_AUTHORED',
    };
    delete edited.derivedFrom;
    return edited;
  }
  return {
    origin: 'manual',
    classification: 'USER_AUTHORED',
    status: 'UNAVAILABLE',
    sourceRefs: [],
  };
}

export function hasManualEdits(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(hasManualEdits);
  const item = value as Record<string, unknown>;
  if (item.origin === 'source-edited') return true;
  const fieldMap = item.fieldProvenance as
    | Record<string, GeneratedValueProvenance>
    | undefined;
  if (
    fieldMap &&
    Object.entries(fieldMap).some(
      ([key, provenance]) =>
        key !== 'notes' &&
        (provenance.origin === 'source-edited' ||
          (provenance.origin === 'manual' &&
            item[key] !== '' &&
            item[key] != null)),
    )
  )
    return true;
  const provenance = item.provenance as GeneratedValueProvenance | undefined;
  if (
    provenance &&
    (provenance.origin === 'source-edited' ||
      (provenance.origin === 'manual' && !!(item.text || item.sourceText)))
  )
    return true;
  const sources = item.sources as Record<string, string> | undefined;
  if (
    sources &&
    Object.entries(sources).some(
      ([key, source]) =>
        key !== 'notes' &&
        (source === '직접 작성' || source === 'Manual') &&
        item[key] !== '' &&
        item[key] != null,
    )
  )
    return true;
  return Object.entries(item).some(
    ([key, child]) =>
      ![
        'notes',
        'fieldProvenance',
        'provenance',
        'sources',
        'sourceRefs',
      ].includes(key) && hasManualEdits(child),
  );
}

const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);
const record = (value: unknown): Record<string, unknown> | undefined =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;

/** Runs once at the edit boundary, never at render time. Rerolls carry fresh provenance. */
export function reconcileManualEdits(before: unknown, after: unknown): void {
  if (Array.isArray(before) && Array.isArray(after)) {
    for (let i = 0; i < after.length; i++) {
      const item = record(after[i]);
      const previous = item?.id
        ? before.find((candidate) => record(candidate)?.id === item.id)
        : item?.key
          ? before.find((candidate) => record(candidate)?.key === item.key)
          : before[i];
      reconcileManualEdits(previous, after[i]);
    }
    return;
  }
  const old = record(before),
    next = record(after);
  if (!old || !next) return;
  const previousFields = record(old.fieldProvenance) ?? {};
  const nextFields = record(next.fieldProvenance) ?? {};
  const sources = record(old.sources) ?? {};
  const keys = new Set([
    ...Object.keys(previousFields),
    ...Object.keys(nextFields),
    ...Object.keys(sources),
    ...Object.keys(record(next.sources) ?? {}),
  ]);
  for (const key of keys) {
    if (!(key in old) || !(key in next) || same(old[key], next[key])) continue;
    if (!same(previousFields[key], nextFields[key])) continue;
    // A legacy reroller changing its citation is still not enough evidence of a canonical source.
    nextFields[key] = editedProvenance(
      previousFields[key] as GeneratedValueProvenance | undefined,
    );
  }
  if (Object.keys(nextFields).length) next.fieldProvenance = nextFields;
  if (
    old.provenance &&
    same(old.provenance, next.provenance) &&
    (!same(old.text, next.text) || !same(old.sourceText, next.sourceText))
  ) {
    next.provenance = editedProvenance(
      old.provenance as GeneratedValueProvenance,
    );
    if ('translationKo' in next) delete next.translationKo;
  }
  for (const [key, child] of Object.entries(next)) {
    if (
      [
        'fieldProvenance',
        'provenance',
        'sources',
        'sourceRefs',
        'generation',
      ].includes(key)
    )
      continue;
    reconcileManualEdits(old[key], child);
  }
}
