import type { Campaign, Dungeon, LibraryKind, Assignment } from './types';
import { id, now } from '../generators/random';
export const referenceKey = (
  kind: Exclude<LibraryKind, 'characters'>,
): keyof Assignment =>
  kind === 'monsters'
    ? 'monsterIds'
    : kind === 'npcs'
      ? 'npcIds'
      : 'encounterIds';
export function cloneCampaign(
  source: Campaign,
  title = source.title + ' — copy',
): Campaign {
  const c = structuredClone(source);
  const map = new Map<string, string>();
  const replace = (old: string) => {
    if (!map.has(old)) map.set(old, id());
    return map.get(old)!;
  };
  c.id = replace(c.id);
  c.title = title;
  c.createdAt = now();
  c.updatedAt = now();
  for (const kind of [
    'characters',
    'monsters',
    'npcs',
    'encounters',
  ] as const) {
    for (const e of c[kind]) e.id = replace(e.id);
    if (c.drafts[kind]) c.drafts[kind]!.id = replace(c.drafts[kind]!.id);
  }
  const reassign = (a: Assignment) => {
    for (const key of ['monsterIds', 'npcIds', 'encounterIds'] as const)
      a[key] = a[key].map(replace);
  };
  for (const d of c.dungeons) {
    d.id = replace(d.id);
    d.campaignId = c.id;
    reassign(d);
    for (const room of d.rooms) {
      room.id = replace(room.id);
      reassign(room);
    }
  }
  if (c.workspace.dungeonId)
    c.workspace.dungeonId = replace(c.workspace.dungeonId);
  if (c.workspace.roomId) c.workspace.roomId = replace(c.workspace.roomId);
  for (const kind of [
    'characters',
    'monsters',
    'npcs',
    'encounters',
  ] as const) {
    if (c.workspace.selected[kind])
      c.workspace.selected[kind] = replace(c.workspace.selected[kind]!);
  }
  return c;
}
export function cloneDungeon(source: Dungeon): Dungeon {
  const d = structuredClone(source);
  d.id = id();
  d.title += ' — copy';
  d.createdAt = now();
  d.updatedAt = now();
  d.rooms.forEach((r) => {
    r.id = id();
  });
  return d;
}
export function assignEntity(
  c: Campaign,
  kind: Exclude<LibraryKind, 'characters'>,
  entityId: string,
  dungeonId: string,
  roomId: string | null,
): void {
  const dungeon = c.dungeons.find((d) => d.id === dungeonId);
  if (!dungeon) throw new Error('Choose a dungeon first.');
  const room = roomId ? dungeon.rooms.find((r) => r.id === roomId) : undefined;
  if (roomId && !room) throw new Error('That room no longer exists.');
  if (!c[kind].some((e) => e.id === entityId)) {
    const draft = c.drafts[kind];
    if (!draft || draft.id !== entityId) throw new Error('Object not found.');
    (c[kind] as Array<typeof draft>).push(structuredClone(draft));
    c.drafts[kind] = null;
  }
  const key = referenceKey(kind);
  if (!dungeon[key].includes(entityId)) dungeon[key].push(entityId);
  if (room && !room[key].includes(entityId)) room[key].push(entityId);
  dungeon.updatedAt = now();
}
export function deleteEntity(
  c: Campaign,
  kind: LibraryKind,
  entityId: string,
): void {
  const collection = c[kind];
  const index = collection.findIndex((e) => e.id === entityId);
  if (index >= 0) collection.splice(index, 1);
  if (c.drafts[kind]?.id === entityId) c.drafts[kind] = null;
  if (c.workspace.selected[kind] === entityId)
    c.workspace.selected[kind] = null;
  if (kind !== 'characters') {
    const key = referenceKey(kind);
    for (const d of c.dungeons) {
      d[key] = d[key].filter((i) => i !== entityId);
      for (const room of d.rooms)
        room[key] = room[key].filter((i) => i !== entityId);
    }
  }
}
export function removeAssignment(
  c: Campaign,
  kind: Exclude<LibraryKind, 'characters'>,
  entityId: string,
  dungeonId: string,
  roomId: string | null,
): void {
  const d = c.dungeons.find((e) => e.id === dungeonId);
  if (!d) return;
  const key = referenceKey(kind);
  if (roomId) {
    const r = d.rooms.find((e) => e.id === roomId);
    if (r) r[key] = r[key].filter((i) => i !== entityId);
  } else {
    d[key] = d[key].filter((i) => i !== entityId);
    for (const r of d.rooms) r[key] = r[key].filter((i) => i !== entityId);
  }
}
