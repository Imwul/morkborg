export interface VerifiedReferenceAlias {
  name: string;
  /** Book named in the routing citation; the verified target may be in another book. */
  bookId: string;
  tableId: string;
  printedPage?: number | string;
  printedCrossReference: string;
  sourceVerified: true;
  note: string;
  category?:
    | 'exact-source'
    | 'edition-mismatch'
    | 'alternate-name'
    | 'spelling-variant'
    | 'citation-typo';
  evidence?: {
    bookId: string;
    pdfPage: number;
    printedPage?: number | string;
    note: string;
  }[];
}
export interface ReferenceAliasQuery {
  tableId: string;
  name: string;
  printedCrossReference: string;
  bookId?: string | null;
  printedPage?: number | string | null;
}
const exact = (value: string) => value.normalize('NFC').trim();
/** An explicit table/name/citation binding is authority; a similar name alone is not. */
export function findVerifiedReferenceAlias(
  candidate: Record<string, unknown>,
  query: ReferenceAliasQuery,
): VerifiedReferenceAlias | undefined {
  if (
    !Array.isArray(candidate.referenceAliases) ||
    !query.tableId ||
    !exact(query.name) ||
    !exact(query.printedCrossReference)
  )
    return undefined;
  const matches = candidate.referenceAliases.filter(
    (alias): alias is VerifiedReferenceAlias =>
      !!alias &&
      typeof alias === 'object' &&
      alias.sourceVerified === true &&
      alias.tableId === query.tableId &&
      typeof alias.name === 'string' &&
      exact(alias.name) === exact(query.name) &&
      typeof alias.printedCrossReference === 'string' &&
      exact(alias.printedCrossReference) ===
        exact(query.printedCrossReference) &&
      typeof alias.bookId === 'string' &&
      (!query.bookId || alias.bookId === query.bookId) &&
      (query.printedPage == null || alias.printedPage === query.printedPage) &&
      typeof alias.note === 'string' &&
      !!alias.note.trim(),
  );
  return matches.length === 1 ? matches[0] : undefined;
}
