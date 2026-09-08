import type { RulesPack } from '../storage/rulesStore';

type RecordData = Record<string, unknown>;
/** Display projections retain the parent and participant identities. No stat merging. */
export function referenceCreatureRecords(
  rules: RulesPack | null,
): RecordData[] {
  const result: RecordData[] = [];
  for (const record of rules?.creatures ?? []) {
    const children =
      record.book === 'feretory' &&
      record.section === 'Eat Prey Kill' &&
      [
        'feretory.epk.lentil-lice',
        'feretory.epk.carcasswan',
        'feretory.epk.uberwolf',
      ].includes(typeof record.id === 'string' ? record.id : '')
        ? (['variants', 'participants', 'companions'] as const).flatMap(
            (kind) =>
              (Array.isArray(record[kind])
                ? (record[kind] as RecordData[])
                : []
              ).map((child, index) => ({
                ...child,
                book: record.book,
                pdfPage: record.pdfPage,
                printedPage: record.printedPage,
                section: record.section,
                tableId: record.tableId,
                id:
                  typeof child.id === 'string'
                    ? child.id
                    : `${typeof record.id === 'string' ? record.id : ''}.${kind}.${index + 1}`,
                parentSourceId: record.id,
                relationKind: kind,
                sourceVerified: record.sourceVerified !== false,
              })),
          )
        : [];
    const specialRuleOnly =
      record.book === 'heretic' &&
      record.name === 'Rotten Nurse' &&
      record.pdfPage === 64;
    const variantOnly = children.some((c) => c.relationKind === 'variants');
    result.push(
      !specialRuleOnly && !children.length
        ? record
        : {
            ...record,
            ...(specialRuleOnly ? { specialRuleOnly: true } : {}),
            ...(variantOnly ? { variantOnly: true } : {}),
            ...(children.length
              ? { childSourceIds: children.map((c) => c.id) }
              : {}),
          },
    );
    result.push(...children);
  }
  for (const record of rules?.outcasts ?? [])
    if (
      record.book === 'heretic' &&
      record.name === 'Mikhael' &&
      record.pdfPage === 40
    )
      result.push({
        ...record,
        id: 'heretic.outcast.mikhael',
        section: 'Outcasts',
      });
  return result;
}
