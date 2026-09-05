import type { OracleRegistry } from './oracle';
import type { ReferenceReading } from './referenceReading';
import { oracleFollowUpLinks, oracleReadingText } from './referenceReading';
import { selectOracleEntry } from '../generators/oracleRoller';

/** A printed cross-reference selects its exact row, without consuming random dice. */
export function fixedReferenceReading(
  registry: OracleRegistry,
  lookup: { oracleId: string; roll: number },
): ReferenceReading {
  const table = registry.tables.find(
    (candidate) => candidate.id === lookup.oracleId,
  );
  if (!table || !table.sourceVerified)
    throw new Error('지정된 원문 표를 불러오세요.');
  if (!Number.isSafeInteger(lookup.roll))
    throw new Error('지정된 원문 행 번호를 확인하세요.');
  const entry = selectOracleEntry(table, lookup.roll);
  if (!entry) throw new Error('지정된 번호에 대응하는 원문 행이 없습니다.');
  return {
    title: `${table.title} · #${lookup.roll}`,
    blocks: [
      { title: `지정된 결과 #${lookup.roll}`, text: oracleReadingText(entry) },
    ],
    sourceRefs: [
      {
        bookId: table.sourceBookId,
        bookTitle: registry.books.find((book) => book.id === table.sourceBookId)
          ?.title,
        tableId: table.id,
        tableTitle: table.title,
        pdfPage: table.sourcePage,
        printedPage: table.printedPage,
        roll: lookup.roll,
        entryId: entry.id,
        note: '원문의 지정 참조 · 재굴림하지 않음',
      },
    ],
    ...oracleFollowUpLinks(entry.metadata),
  };
}
