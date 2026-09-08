import type { OracleDefinition, OracleEntry, OracleRegistry } from './oracle';
import type { RuleEntry } from '../storage/rulesStore';
import {
  oracleReadingText,
  oraclePrintedRange,
  type ReferenceReading,
} from './referenceReading';
import { appPolicy } from './generationAuthority';

/** Preserve printed selectors; array indexes are not card ranks or open-ended ranges. */
export function tableSelector(entry: OracleEntry): string {
  const meta = entry.metadata ?? {};
  for (const key of [
    'selectorLabel',
    'rank',
    'symbols',
    'printedRange',
    'printedIndex',
  ])
    if (typeof meta[key] === 'string') return meta[key];
  return oraclePrintedRange(entry);
}
export function tableEntryNotes(entry: OracleEntry): string[] {
  const m = entry.metadata ?? {};
  const notes = oracleReadingText(entry).slice(entry.text.length).trim();
  const details = [notes];
  for (const key of [
    'damage',
    'ammunition',
    'startingAmmunition',
    'price',
    'duration',
    'scrollRestriction',
  ])
    if (typeof m[key] === 'string')
      details.push(`${key === 'damage' ? 'Damage: ' : ''}${m[key]}`);
  if (typeof m.truth === 'string') details.push(`Truth: ${m.truth}`);
  if (typeof m.tier === 'number')
    details.push(
      `Tier ${m.tier}${typeof m.damageReduction === 'string' ? ` · −${m.damageReduction} damage` : ''}`,
    );
  if (typeof m.valueSilver === 'number') details.push(`${m.valueSilver}s`);
  if (typeof m.agilityDRPenalty === 'number' && m.agilityDRPenalty)
    details.push(`Agility DR +${m.agilityDRPenalty}`);
  if (typeof m.defenseDRPenalty === 'number' && m.defenseDRPenalty)
    details.push(`Defence DR +${m.defenseDRPenalty}`);
  if (Array.isArray(m.examples))
    details.push(m.examples.filter((v) => typeof v === 'string').join(' · '));
  return [
    ...new Set(details.filter((text) => text && !entry.text.includes(text))),
  ];
}
export function followUpSelector(entry: RuleEntry): string {
  const { meta } = entry;
  if (typeof meta.roll === 'number') return String(meta.roll);
  if (typeof meta.min === 'number' && typeof meta.max === 'number')
    return meta.max === meta.min ? String(meta.min) : `${meta.min}–${meta.max}`;
  if (Array.isArray(meta.range)) return meta.range.join('–');
  return ''; // No invented index/die for an unlabelled choice.
}
const PREPARATION_TABLES = new Set([
  'core.weapons',
  'core.armor',
  'core.gearA',
  'core.gearB',
  'core.sacred',
  'core.unclean',
]);
export function canSelectTableEntry(
  table: OracleDefinition,
  entry: OracleEntry,
) {
  return (
    PREPARATION_TABLES.has(table.id) &&
    table.sourceVerified &&
    table.rollable !== false &&
    !entry.sourceUnclear &&
    !entry.metadata?.scrollTable &&
    !entry.metadata?.followup &&
    !entry.metadata?.subtable
  );
}
/** Selection produces a transient reading, never a fake roll or an implicit campaign save. */
export function selectReferenceReading(
  table: OracleDefinition,
  entry: OracleEntry,
  registry: OracleRegistry,
): ReferenceReading {
  if (
    !canSelectTableEntry(table, entry) ||
    !table.entries.some((e) => e.id === entry.id)
  )
    throw new Error('This source entry is not a preparation choice.');
  return {
    title: table.title,
    blocks: [
      {
        title: entry.text,
        text: tableEntryNotes(entry).join('\n') || entry.text,
      },
    ],
    sourceRefs: [
      {
        bookId: table.sourceBookId,
        bookTitle: registry.books.find((b) => b.id === table.sourceBookId)
          ?.title,
        tableId: table.id,
        tableTitle: table.title,
        entryId: entry.id,
        pdfPage: table.sourcePage,
        printedPage: table.printedPage,
        status: table.sourceStatus ?? 'VERIFIED',
      },
    ],
    authority: [appPolicy('app.table-selection')],
    relatedIds: [`definition:${entry.id}`],
  };
}
