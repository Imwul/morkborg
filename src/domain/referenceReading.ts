import type { ReferenceEvidence } from './referenceSources';
import type { SourceReference } from './types';
import type { OracleEntry, OracleResult, OracleRoll } from './oracle';
import { FERETORY_TABLE_IDS } from '../generators/feretory';
export interface ReferenceReading {
  title: string;
  blocks: { title: string; text: string; dice?: string; kind?: 'creature' }[];
  copyContent?: { title: string; blocks: { title: string; text: string }[] };
  sourceRefs: SourceReference[];
  evidence?: ReferenceEvidence[];
  oracle?: OracleResult;
  relatedIds?: string[];
  fixedLookups?: { oracleId: string; roll: number }[];
}
/** Keep one creature together while retaining every original die in OracleResult. */
export function feretoryResultBlock(
  result: OracleResult,
): ReferenceReading['blocks'][number] | undefined {
  const hp = result.rolls.find((roll) => roll.oracleId === 'feretory.hp');
  const appearance = FERETORY_TABLE_IDS.map((id) =>
    result.rolls.find((roll) => roll.oracleId === id),
  );
  if (!hp || appearance.some((roll) => !roll)) return;
  return {
    title: 'The Monster Approaches',
    kind: 'creature',
    text: [hp.text, appearance.map((roll) => roll!.text).join('; ')].join(
      '\n\n',
    ),
    dice:
      appearance
        .map((roll, index) => `${['A', 'B', 'C'][index]} d12 = ${roll!.roll}`)
        .join(' · ') + ` · HP ${hp.dice} = ${hp.roll} × 2`,
  };
}
export function copyReferenceReading(
  reading: ReferenceReading,
  withSource = false,
) {
  const content = reading.copyContent ?? reading;
  const body = [
    content.title,
    ...content.blocks.map((block) =>
      [block.title === content.title ? '' : block.title, block.text]
        .filter(Boolean)
        .join('\n'),
    ),
  ].join('\n\n');
  if (!withSource) return body;
  const sources = reading.sourceRefs.map((ref) =>
    [
      ref.bookTitle ?? ref.bookId,
      ref.tableTitle,
      ref.pdfPage == null ? '' : `PDF ${[ref.pdfPage].flat().join(', ')}`,
      ref.printedPage == null ? '' : `인쇄 p. ${ref.printedPage}`,
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
