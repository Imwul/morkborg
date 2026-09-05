import type { SourceReference } from './types';
import type { OracleEntry, OracleResult, OracleRoll } from './oracle';
export interface ReferenceReading {
  title: string;
  blocks: { title: string; text: string; dice?: string }[];
  sourceRefs: SourceReference[];
  oracle?: OracleResult;
  relatedIds?: string[];
  fixedLookups?: { oracleId: string; roll: number }[];
}
export function copyReferenceReading(
  reading: ReferenceReading,
  withSource = false,
) {
  const body = [
    reading.title,
    ...reading.blocks.map((block) =>
      [block.title, block.text].filter(Boolean).join('\n'),
    ),
  ].join('\n\n');
  if (!withSource) return body;
  const sources = reading.sourceRefs.map((ref) =>
    [
      ref.bookTitle ?? ref.bookId,
      ref.tableTitle,
      ref.pdfPage == null ? '' : `PDF ${[ref.pdfPage].flat().join(', ')}`,
      ref.printedPage == null ? '' : `p. ${ref.printedPage}`,
      ref.note,
    ]
      .filter(Boolean)
      .join(' · '),
  );
  return body + '\n\n' + [...new Set(sources)].join('\n');
}

/** Conditions belong beside the rolled effect, including when copied to a notebook. */
export function oracleReadingText(roll: Pick<OracleRoll, 'text' | 'metadata'>) {
  const notes = ['effectRule', 'conditional', 'condition', 'procedureNote']
    .map((key) => roll.metadata?.[key])
    .filter(
      (value): value is string => typeof value === 'string' && !!value.trim(),
    );
  return [
    roll.text,
    ...new Set(notes.filter((note) => !roll.text.includes(note))),
  ].join('\n\n');
}
export function oraclePrintedRange(entry: OracleEntry) {
  if (typeof entry.metadata?.originalRange === 'string')
    return entry.metadata.originalRange;
  if (entry.metadata?.openEnded === true && entry.metadata?.comparison === '>=')
    return `${entry.min}+`;
  return entry.min === entry.max
    ? String(entry.min)
    : `${entry.min}–${entry.max}`;
}
export function oracleFollowUpLinks(
  metadata?: Record<string, unknown>,
): Pick<ReferenceReading, 'relatedIds' | 'fixedLookups'> {
  return {
    relatedIds: Array.isArray(metadata?.followUpOracleIds)
      ? [
          ...new Set(
            metadata.followUpOracleIds.filter(
              (key): key is string => typeof key === 'string',
            ),
          ),
        ].map((key) => `oracle:${key}`)
      : [],
    fixedLookups: Array.isArray(metadata?.fixedLookups)
      ? metadata.fixedLookups.filter(
          (value): value is { oracleId: string; roll: number } =>
            !!value &&
            typeof value.oracleId === 'string' &&
            Number.isInteger(value.roll),
        )
      : [],
  };
}
