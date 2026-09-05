import type { OracleRegistry } from '../../domain/oracle';
import {
  FERETORY_TABLE_IDS,
  FERETORY_MONSTER_TITLE,
} from '../../generators/feretory';

const tableGroups = [
  {
    title: 'NPC · Disposition + Profession',
    ids: ['sd.npc.disposition', 'sd.npc.profession'],
  },
  {
    title: 'Religious Denomination · Order / Adjective / Domain',
    ids: ['sd.religion.order', 'sd.religion.adjective', 'sd.religion.domain'],
  },
  {
    title: 'Material · Quality + Composition',
    ids: ['sd.material.quality', 'sd.material.composition'],
  },
  {
    title: 'Sound · Quality + Type',
    ids: ['sd.sound.quality', 'sd.sound.type'],
  },
  {
    title: 'Room · Adjective + Type',
    ids: ['sd.room.adjective', 'sd.room.type'],
  },
  { title: FERETORY_MONSTER_TITLE, ids: [...FERETORY_TABLE_IDS] },
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
  return tableGroups.find((group) => group.ids.includes(id))?.ids[0] ?? id;
}
export function oracleLibraryRollIds(id: string): string[] {
  return tableGroups.find((group) => group.ids.includes(id))?.ids ?? [id];
}
export function oracleLibraryTitle(id: string, title: string): string {
  return tableGroups.find((group) => group.ids.includes(id))?.title ?? title;
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
