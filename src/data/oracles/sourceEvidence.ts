import attestations from './sourceEvidence.json';
import type { OracleDefinition } from '../../domain/oracle';

interface Attestation {
  fingerprint: string;
  partialEntryIds: string[];
  composedEntryIds: string[];
  derivedEntryIds: string[];
}
export const ORACLE_SOURCE_ATTESTATIONS: Record<string, Attestation> =
  attestations;
export const ORACLE_SOURCE_AUDIT_VERSION = 'supplied-pdf-audit-2026-09-08';
const presentationKeys = new Set([
  'ko',
  'translation',
  'translationKo',
  'sourceStatus',
  'generationClassification',
  'datasetVersion',
  'textTransformation',
]);
function canonicalMetadata(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalMetadata);
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .filter(
          ([key, nested]) => !presentationKeys.has(key) && nested !== undefined,
        )
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([key, nested]) => [key, canonicalMetadata(nested)]),
    );
  return value;
}

/** Cheap once-per-load change detection; source-PDF evidence is documented separately. */
export function oracleSourceFingerprint(table: OracleDefinition): string {
  const text = JSON.stringify([
    table.sourceBookId,
    table.sourcePage,
    table.printedPage ?? null,
    table.dice,
    table.entries.map((entry) => [
      entry.id,
      entry.min,
      entry.max,
      entry.text,
      canonicalMetadata(entry.metadata ?? {}),
    ]),
  ]);
  let value = 2166136261;
  for (let index = 0; index < text.length; index++) {
    const unit = text.charCodeAt(index);
    value = Math.imul(value ^ (unit & 255), 16777619);
    value = Math.imul(value ^ (unit >>> 8), 16777619);
  }
  return (value >>> 0).toString(16).padStart(8, '0');
}

export function applyOracleSourceEvidence(
  table: OracleDefinition,
): OracleDefinition {
  const evidence = ORACLE_SOURCE_ATTESTATIONS[table.id];
  const same =
    !!evidence && evidence.fingerprint === oracleSourceFingerprint(table);
  return {
    ...table,
    sourceStatus:
      !same || evidence.partialEntryIds.length ? 'PARTIAL' : 'VERIFIED',
    entries: table.entries.map((entry) => ({
      ...entry,
      get text() {
        return entry.text;
      },
      metadata: {
        ...entry.metadata,
        sourceStatus:
          !same || evidence.partialEntryIds.includes(entry.id)
            ? 'PARTIAL'
            : 'VERIFIED',
        generationClassification:
          same && evidence.derivedEntryIds.includes(entry.id)
            ? 'APP_DERIVED'
            : same && evidence.composedEntryIds.includes(entry.id)
              ? 'SOURCE_COMPOSED'
              : 'SOURCE_VERBATIM',
        datasetVersion: ORACLE_SOURCE_AUDIT_VERSION,
        ...(same && evidence.composedEntryIds.includes(entry.id)
          ? {
              textTransformation:
                'Source heading, cells or explicitly linked footnote displayed together; no connective fiction.',
            }
          : {}),
        ...(same && evidence.derivedEntryIds.includes(entry.id)
          ? {
              textTransformation:
                'Printed feet notation expanded as a unit label; numeric value and source meaning unchanged.',
            }
          : {}),
        ...(!same
          ? {
              textTransformation:
                'This installed source entry differs from the independently inspected dataset; source wording needs verification.',
            }
          : {}),
      },
    })),
  };
}
