import type {
  AppSave,
  Campaign,
  Dungeon,
  LibraryKind,
  Assignment,
  Workspace,
  Character,
  Monster,
  NPC,
  Encounter,
} from './types';
import {
  addMonsterPlacement,
  deleteMonster,
  materializeDraftMonsterRefs,
  syncMonsterRefs,
} from './monsterOperations';
import {
  addContentPlacement,
  contentPlacementKey,
  deleteContent,
  materializeDraftContentRefs,
  syncContentRefs,
} from './contentOperations';
import { id, now } from '../generators/random';
export const referenceKey = (
  kind: Exclude<LibraryKind, 'characters'>,
): keyof Assignment =>
  kind === 'monsters'
    ? 'monsterIds'
    : kind === 'npcs'
      ? 'npcIds'
      : 'encounterIds';
function replaceCharacterItemIds(
  ch: Character,
  replace: (old: string) => string,
) {
  const items = [
    ...ch.weapons,
    ...ch.equipment,
    ...ch.traits,
    ...(ch.background ?? []),
    ...(ch.classFeatures ?? []),
  ];
  for (const item of items) item.id = replace(item.id);
  for (const item of items)
    if (item.slot?.startsWith('feature:'))
      item.slot = 'feature:' + replace(item.slot.slice('feature:'.length));
}
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
  for (const reading of c.mythic?.history ?? []) {
    reading.id = replace(reading.id);
    if (reading.event) reading.event.id = replace(reading.event.id);
  }
  for (const kind of [
    'characters',
    'monsters',
    'npcs',
    'encounters',
  ] as const) {
    for (const e of c[kind]) e.id = replace(e.id);
    if (c.drafts[kind]) c.drafts[kind]!.id = replace(c.drafts[kind]!.id);
  }
  for (const ch of [
    ...c.characters,
    ...(c.drafts.characters ? [c.drafts.characters] : []),
  ]) {
    ch.campaignId = c.id;
    replaceCharacterItemIds(ch, replace);
  }
  for (const m of [
    ...c.monsters,
    ...(c.drafts.monsters ? [c.drafts.monsters] : []),
  ]) {
    m.campaignId = c.id;
    for (const item of [...m.attacks, ...m.special, ...m.weakness, ...m.loot])
      item.id = replace(item.id);
  }
  for (const e of [
    ...c.npcs,
    ...c.encounters,
    ...(c.drafts.npcs ? [c.drafts.npcs] : []),
    ...(c.drafts.encounters ? [c.drafts.encounters] : []),
  ]) {
    e.campaignId = c.id;
    if ('participants' in e)
      for (const p of e.participants ?? []) {
        p.id = replace(p.id);
        p.entityId = replace(p.entityId);
      }
  }
  for (const key of ['npcPlacements', 'encounterPlacements'] as const)
    for (const p of c[key]) {
      p.id = replace(p.id);
      p.entityId = replace(p.entityId);
      p.dungeonId = replace(p.dungeonId);
      if (p.roomId) p.roomId = replace(p.roomId);
    }
  for (const target of [
    c.workspace.contentTarget,
    ...Object.values(c.workspace.contentDraftTargets ?? {}),
  ])
    if (target) {
      target.dungeonId = replace(target.dungeonId);
      if (target.roomId) target.roomId = replace(target.roomId);
    }
  for (const p of c.monsterPlacements) {
    p.id = replace(p.id);
    p.monsterId = replace(p.monsterId);
    p.dungeonId = replace(p.dungeonId);
    if (p.roomId) p.roomId = replace(p.roomId);
  }
  if (c.workspace.monsterTarget) {
    c.workspace.monsterTarget.dungeonId = replace(
      c.workspace.monsterTarget.dungeonId,
    );
    if (c.workspace.monsterTarget.roomId)
      c.workspace.monsterTarget.roomId = replace(
        c.workspace.monsterTarget.roomId,
      );
  }
  const reassign = (a: Assignment) => {
    for (const key of ['monsterIds', 'npcIds', 'encounterIds'] as const)
      a[key] = a[key].map(replace);
  };
  for (const d of [
    ...c.dungeons,
    ...(c.dungeonDraft ? [c.dungeonDraft] : []),
  ]) {
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
  if (kind === 'monsters') {
    addMonsterPlacement(c, entityId, { dungeonId, roomId });
    return;
  }
  addContentPlacement(c, kind, entityId, { dungeonId, roomId });
}
export function deleteEntity(
  c: Campaign,
  kind: LibraryKind,
  entityId: string,
): void {
  if (kind === 'monsters') {
    deleteMonster(c, entityId);
    return;
  }
  if (kind === 'npcs' || kind === 'encounters') {
    deleteContent(c, kind, entityId);
    return;
  }
  const collection = c[kind];
  const index = collection.findIndex((e) => e.id === entityId);
  if (index >= 0) collection.splice(index, 1);
  if (c.drafts[kind]?.id === entityId) c.drafts[kind] = null;
  if (c.workspace.selected[kind] === entityId)
    c.workspace.selected[kind] = null;
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
  if (kind === 'monsters') {
    c.monsterPlacements = c.monsterPlacements.filter(
      (p) =>
        !(
          p.monsterId === entityId &&
          p.dungeonId === dungeonId &&
          (!roomId || p.roomId === roomId)
        ),
    );
    d.updatedAt = now();
    syncMonsterRefs(c);
    return;
  }
  const key = contentPlacementKey(kind);
  c[key] = c[key].filter(
    (p) =>
      !(
        p.entityId === entityId &&
        p.dungeonId === dungeonId &&
        (!roomId || p.roomId === roomId)
      ),
  );
  d.updatedAt = now();
  syncContentRefs(c);
}

export function selectDungeonCandidate(c: Campaign, title: string): void {
  if (!c.dungeonDraft) throw new Error('선택할 던전 후보가 없습니다.');
  const candidate = structuredClone(c.dungeonDraft);
  candidate.title = title;
  candidate.updatedAt = now();
  c.dungeons.push(candidate);
  materializeDraftMonsterRefs(c, candidate.id);
  materializeDraftContentRefs(c, candidate.id);
  c.dungeonDraft = null;
  Object.assign(c.workspace, {
    section: 'dungeons',
    dungeonPreview: false,
    dungeonId: candidate.id,
    roomId: null,
    dungeonTab: 'overview',
  });
}

export function campaignIds(c: Campaign): string[] {
  return [
    c.id,
    ...c.monsterPlacements.map((p) => p.id),
    ...c.npcPlacements.map((p) => p.id),
    ...c.encounterPlacements.map((p) => p.id),
    ...[
      ...c.encounters,
      ...(c.drafts.encounters ? [c.drafts.encounters] : []),
    ].flatMap((e) => (e.participants ?? []).map((p) => p.id)),
    ...[
      ...c.monsters,
      ...(c.drafts.monsters ? [c.drafts.monsters] : []),
    ].flatMap((m) =>
      [...m.attacks, ...m.special, ...m.weakness, ...m.loot].map(
        (item) => item.id,
      ),
    ),
    ...[...c.dungeons, ...(c.dungeonDraft ? [c.dungeonDraft] : [])].flatMap(
      (d) => [d.id, ...d.rooms.map((r) => r.id)],
    ),
    ...(['characters', 'monsters', 'npcs', 'encounters'] as const).flatMap(
      (k) => [
        ...c[k].map((e) => e.id),
        ...(c.drafts[k] ? [c.drafts[k]!.id] : []),
      ],
    ),
    ...[
      ...c.characters,
      ...(c.drafts.characters ? [c.drafts.characters] : []),
    ].flatMap((ch) =>
      [
        ...ch.weapons,
        ...ch.equipment,
        ...ch.traits,
        ...(ch.background ?? []),
        ...(ch.classFeatures ?? []),
      ].map((item) => item.id),
    ),
  ];
}

export function importCampaigns(save: AppSave, campaigns: Campaign[]): void {
  const used = new Set(save.campaigns.flatMap(campaignIds));
  for (const campaign of campaigns) {
    const imported = campaignIds(campaign).some((id) => used.has(id))
      ? cloneCampaign(campaign, campaign.title + ' — imported')
      : structuredClone(campaign);
    save.campaigns.push(imported);
    campaignIds(imported).forEach((id) => used.add(id));
    openCampaignLibrary(save, imported.id);
  }
}

export function openCampaignLibrary(save: AppSave, campaignId: string): void {
  const c = save.campaigns.find((c) => c.id === campaignId);
  if (!c) throw new Error('캠페인을 찾지 못했습니다.');
  save.activeCampaignId = c.id;
  save.view = 'campaign';
  updateWorkspace(c, {
    section: 'dungeons',
    dungeonId: null,
    roomId: null,
    dungeonPreview: false,
    dungeonTab: 'overview',
  });
}

export function updateWorkspace(c: Campaign, patch: Partial<Workspace>): void {
  if (patch.dungeonId !== undefined && patch.dungeonPreview === undefined)
    c.workspace.dungeonPreview = false;
  Object.assign(c.workspace, patch);
}

export function applyCampaignEdit(
  c: Campaign,
  action: (campaign: Campaign) => void,
  timestamp = now(),
): void {
  const content = (d: Dungeon | Character | Monster | NPC | Encounter) =>
    JSON.stringify({ ...d, updatedAt: undefined });
  const before = new Map(
    [
      ...c.dungeons,
      ...(c.dungeonDraft ? [c.dungeonDraft] : []),
      ...c.monsters,
      ...(c.drafts.monsters ? [c.drafts.monsters] : []),
      ...c.npcs,
      ...c.encounters,
      ...(c.drafts.npcs ? [c.drafts.npcs] : []),
      ...(c.drafts.encounters ? [c.drafts.encounters] : []),
      ...c.characters,
      ...(c.drafts.characters ? [c.drafts.characters] : []),
    ].map((d) => [d.id, content(d)]),
  );
  action(c);
  for (const d of [
    ...c.dungeons,
    ...(c.dungeonDraft ? [c.dungeonDraft] : []),
    ...c.monsters,
    ...(c.drafts.monsters ? [c.drafts.monsters] : []),
    ...c.npcs,
    ...c.encounters,
    ...(c.drafts.npcs ? [c.drafts.npcs] : []),
    ...(c.drafts.encounters ? [c.drafts.encounters] : []),
    ...c.characters,
    ...(c.drafts.characters ? [c.drafts.characters] : []),
  ])
    if (before.has(d.id) && before.get(d.id) !== content(d))
      d.updatedAt = timestamp;
  c.updatedAt = timestamp;
}

export function cloneCharacter(
  source: Character,
  campaignId = source.campaignId,
): Character {
  const copy = structuredClone(source);
  copy.id = id();
  copy.campaignId = campaignId;
  copy.createdAt = now();
  copy.updatedAt = now();
  const ids = new Map<string, string>();
  replaceCharacterItemIds(copy, (old) => {
    if (!ids.has(old)) ids.set(old, id());
    return ids.get(old)!;
  });
  return copy;
}
export function saveCharacterDraft(c: Campaign): void {
  if (!c.drafts.characters) throw new Error('저장할 캐릭터 후보가 없습니다.');
  const ch = structuredClone(c.drafts.characters);
  ch.campaignId = c.id;
  ch.updatedAt = now();
  c.characters.push(ch);
  c.drafts.characters = null;
  c.workspace.selected.characters = ch.id;
}
