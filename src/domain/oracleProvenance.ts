import type {
  GeneratedValueProvenance,
  GenerationClassification,
  SourceStatus,
} from './generationProvenance';
import type {
  OracleDefinition,
  OracleEntry,
  OracleRegistry,
  OracleRoll,
} from './oracle';

/** Canonical English and its evidence travel together inside existing saved metadata. */
export function oracleValueProvenance(
  table: OracleDefinition,
  registry: OracleRegistry,
  entry: OracleEntry | undefined,
  rolled: { value: number; values: number[] },
): GeneratedValueProvenance {
  const classification = entry?.metadata?.generationClassification as
    | GenerationClassification
    | undefined;
  const status = entry?.metadata?.sourceStatus as SourceStatus | undefined;
  const rowPdf = entry?.metadata?.pdfPage ?? entry?.metadata?.sourcePage;
  const pdfPage =
    typeof rowPdf === 'number' ||
    (Array.isArray(rowPdf) && rowPdf.every((page) => typeof page === 'number'))
      ? (rowPdf as number | number[])
      : table.sourcePage;
  const rowPrinted = entry?.metadata?.printedPage;
  const printedPage =
    typeof rowPrinted === 'number' || typeof rowPrinted === 'string'
      ? rowPrinted
      : table.printedPage;
  const bookTitle = registry.books.find(
    (book) => book.id === table.sourceBookId,
  )?.title;
  return {
    classification: entry
      ? (classification ?? 'SOURCE_VERBATIM')
      : 'APP_DERIVED',
    origin: 'source',
    status: !entry ? 'PARTIAL' : (status ?? table.sourceStatus ?? 'PARTIAL'),
    sourceRefs: [
      {
        bookId: table.sourceBookId,
        ...(bookTitle ? { bookTitle } : {}),
        tableId: table.id,
        tableTitle: table.title,
        pdfPage,
        ...(printedPage !== undefined ? { printedPage } : {}),
        entryId: entry?.id ?? null,
        roll: rolled.value,
        role: 'primary',
        status: !entry
          ? 'PARTIAL'
          : (status ?? table.sourceStatus ?? 'PARTIAL'),
      },
    ],
    sourceText: entry ? [entry.text] : [],
    rolls: [
      {
        tableId: table.id,
        dice: table.dice,
        value: rolled.value,
        diceValues: rolled.values,
        entryId: entry?.id ?? null,
      },
    ],
    transformation: entry
      ? typeof entry.metadata?.textTransformation === 'string'
        ? entry.metadata.textTransformation
        : 'none'
      : 'The documented source range contains no entry; no fictional result generated.',
    ...(typeof entry?.metadata?.datasetVersion === 'string'
      ? { datasetVersion: entry.metadata.datasetVersion }
      : {}),
  };
}

export function oracleRollProvenance(roll: OracleRoll) {
  return roll.metadata?.provenance;
}
