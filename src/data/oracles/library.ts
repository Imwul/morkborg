import type { OracleRegistry } from '../../domain/oracle';

const meaningPairs = [
  {
    title: 'Action',
    ids: ['mythic2.meaning.action-1', 'mythic2.meaning.action-2'],
  },
  {
    title: 'Descriptor',
    ids: ['mythic2.meaning.descriptor-1', 'mythic2.meaning.descriptor-2'],
  },
];
export function oracleLibraryId(id: string): string {
  return meaningPairs.find((pair) => pair.ids.includes(id))?.ids[0] ?? id;
}
export function oracleLibraryRollIds(id: string): string[] {
  return meaningPairs.find((pair) => pair.ids.includes(id))?.ids ?? [id];
}
export function oracleLibraryTitle(id: string, title: string): string {
  return meaningPairs.find((pair) => pair.ids.includes(id))?.title ?? title;
}
/** Presentation only: retain every source table for dice, provenance and Mythic events. */
export function oracleLibraryTables(registry: OracleRegistry) {
  return registry.tables
    .filter((table) => oracleLibraryId(table.id) === table.id)
    .map((table) => ({
      ...table,
      title: oracleLibraryTitle(table.id, table.title),
    }));
}
