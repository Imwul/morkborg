import { remapDungeonCrawl } from './dungeonCrawl';
import { pruneChronicleReferences } from './chronicleOperations';
import type {
  Campaign,
  Monster,
  MonsterPlacement,
  MonsterTarget,
} from './types';
import {
  cloneContent,
  removeParticipantReferences,
  syncContentRefs,
} from './contentOperations';
import { id, now } from '../generators/random';
import {
  generateMonster,
  generateEatPreyKillMonster,
  eatPreyKillCreatures,
} from '../generators/monster';

/** Only a compatibility index for old readers; all new UI and mutations use placements. */
export function syncMonsterRefs(c: Campaign): void {
  for (const d of c.dungeons) {
    const placements = c.monsterPlacements.filter((p) => p.dungeonId === d.id);
    d.monsterIds = [...new Set(placements.map((p) => p.monsterId))];
    for (const r of d.rooms)
      r.monsterIds = [
        ...new Set(
          placements.filter((p) => p.roomId === r.id).map((p) => p.monsterId),
        ),
      ];
  }
}
export function monsterRelationIssues(c: Campaign): string[] {
  const monsters = new Set(c.monsters.map((m) => m.id));
  const dungeons = new Map(
    c.dungeons.map((d) => [d.id, new Set(d.rooms.map((r) => r.id))]),
  );
  const issues: string[] = [];
  for (const p of c.monsterPlacements) {
    if (!monsters.has(p.monsterId))
      issues.push(`배치 ${p.id}: 몬스터가 없습니다.`);
    const rooms = dungeons.get(p.dungeonId);
    if (!rooms) issues.push(`배치 ${p.id}: 던전이 없습니다.`);
    if (p.roomId !== null && !rooms?.has(p.roomId))
      issues.push(`배치 ${p.id}: 해당 던전의 방이 아닙니다.`);
    if (!Number.isInteger(p.quantity) || p.quantity < 1 || p.quantity > 999999)
      issues.push(`배치 ${p.id}: 수량은 1–999999 사이 정수여야 합니다.`);
  }
  return issues;
}
export function validMonsterTarget(
  c: Campaign,
  target?: MonsterTarget | null,
): MonsterTarget | null {
  if (!target) return null;
  const d = c.dungeons.find((d) => d.id === target.dungeonId);
  if (!d) return null;
  return {
    dungeonId: d.id,
    roomId:
      target.roomId && d.rooms.some((r) => r.id === target.roomId)
        ? target.roomId
        : null,
  };
}
export function beginMonsterDraft(
  c: Campaign,
  target?: MonsterTarget | null,
  blank = false,
): void {
  if (!c.drafts.monsters) {
    const dungeon = c.dungeons.find((d) => d.id === target?.dungeonId);
    const region = dungeon?.region ?? c.workspace.monsterRegion ?? 'sarkash';
    if (dungeon) c.workspace.monsterRegion = region;
    c.drafts.monsters =
      !blank &&
      c.workspace.monsterGenerationMode !== 'tma' &&
      eatPreyKillCreatures(region).length
        ? generateEatPreyKillMonster(c.id, region)
        : generateMonster(c.id, blank);
  }
  c.workspace.section = 'monsters';
  c.workspace.selected.monsters = c.drafts.monsters.id;
  if (target !== undefined)
    c.workspace.monsterTarget = validMonsterTarget(c, target);
}
export function saveMonsterDraft(c: Campaign): Monster {
  const draft = c.drafts.monsters;
  if (!draft) throw new Error('저장할 몬스터 후보가 없습니다.');
  if (c.monsters.some((m) => m.id === draft.id))
    throw new Error('이미 저장된 몬스터입니다.');
  const m = structuredClone(draft);
  m.campaignId = c.id;
  m.updatedAt = now();
  c.monsters.push(m);
  c.drafts.monsters = null;
  c.workspace.selected.monsters = m.id;
  return m;
}
export function addMonsterPlacement(
  c: Campaign,
  monsterId: string,
  target: MonsterTarget,
  quantity = 1,
  notes = '',
): MonsterPlacement {
  const d = c.dungeons.find((d) => d.id === target.dungeonId);
  if (
    !d ||
    (target.roomId !== null && !d.rooms.some((r) => r.id === target.roomId))
  )
    throw new Error('배치 대상 던전 또는 방이 없습니다.');
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999999)
    throw new Error('수량은 1–999999 사이 정수여야 합니다.');
  if (!c.monsters.some((m) => m.id === monsterId)) {
    if (c.drafts.monsters?.id !== monsterId)
      throw new Error('캠페인 보관함에 없는 몬스터입니다.');
    saveMonsterDraft(c);
  }
  const p: MonsterPlacement = {
    id: id(),
    monsterId,
    ...target,
    quantity,
    notes,
  };
  c.monsterPlacements.push(p);
  d.updatedAt = now();
  syncMonsterRefs(c);
  return p;
}
export function editMonsterPlacement(
  c: Campaign,
  placementId: string,
  patch: Partial<Pick<MonsterPlacement, 'roomId' | 'quantity' | 'notes'>>,
): void {
  const p = c.monsterPlacements.find((p) => p.id === placementId);
  if (!p) return;
  const d = c.dungeons.find((d) => d.id === p.dungeonId);
  if (!d) return;
  if (
    patch.roomId !== undefined &&
    patch.roomId !== null &&
    !d.rooms.some((r) => r.id === patch.roomId)
  )
    throw new Error('해당 던전에 없는 방입니다.');
  if (
    patch.quantity !== undefined &&
    (!Number.isInteger(patch.quantity) ||
      patch.quantity < 1 ||
      patch.quantity > 999999)
  )
    return;
  if (patch.roomId !== undefined) p.roomId = patch.roomId;
  if (patch.quantity !== undefined) p.quantity = patch.quantity;
  if (patch.notes !== undefined) p.notes = patch.notes;
  d.updatedAt = now();
  syncMonsterRefs(c);
}
export function removeMonsterPlacement(c: Campaign, placementId: string): void {
  const p = c.monsterPlacements.find((p) => p.id === placementId);
  c.monsterPlacements = c.monsterPlacements.filter((p) => p.id !== placementId);
  const d = c.dungeons.find((d) => d.id === p?.dungeonId);
  if (d) d.updatedAt = now();
  syncMonsterRefs(c);
  pruneChronicleReferences(c);
}
export function cloneMonster(
  source: Monster,
  campaignId = source.campaignId,
): Monster {
  const m = structuredClone(source);
  Object.assign(m, {
    id: id(),
    campaignId,
    createdAt: now(),
    updatedAt: now(),
  });
  for (const item of [...m.attacks, ...m.special, ...m.weakness, ...m.loot])
    item.id = id();
  return m;
}
export function deleteMonster(c: Campaign, monsterId: string): void {
  removeParticipantReferences(c, 'monster', monsterId);
  const affected = new Set(
    c.monsterPlacements
      .filter((p) => p.monsterId === monsterId)
      .map((p) => p.dungeonId),
  );
  c.monsters = c.monsters.filter((m) => m.id !== monsterId);
  if (c.drafts.monsters?.id === monsterId) c.drafts.monsters = null;
  if (c.workspace.selected.monsters === monsterId)
    c.workspace.selected.monsters = null;
  c.monsterPlacements = c.monsterPlacements.filter(
    (p) => p.monsterId !== monsterId,
  );
  for (const d of c.dungeons) if (affected.has(d.id)) d.updatedAt = now();
  if (c.dungeonDraft)
    for (const a of [c.dungeonDraft, ...c.dungeonDraft.rooms])
      a.monsterIds = a.monsterIds.filter((id) => id !== monsterId);
  syncMonsterRefs(c);
  pruneChronicleReferences(c);
}
export function materializeDraftMonsterRefs(
  c: Campaign,
  dungeonId: string,
): void {
  const d = c.dungeons.find((d) => d.id === dungeonId);
  if (!d) return;
  const refs = structuredClone(d);
  const roomMembers = new Set(refs.rooms.flatMap((r) => r.monsterIds));
  for (const r of refs.rooms)
    for (const monsterId of r.monsterIds)
      addMonsterPlacement(c, monsterId, { dungeonId, roomId: r.id });
  for (const monsterId of refs.monsterIds)
    if (!roomMembers.has(monsterId))
      addMonsterPlacement(c, monsterId, { dungeonId, roomId: null });
}
export function deleteRoom(
  c: Campaign,
  dungeonId: string,
  roomId: string,
): void {
  const d = c.dungeons.find((d) => d.id === dungeonId);
  if (!d) return;
  if (
    d.crawl?.specialRoomIds.includes(roomId) ||
    d.rooms.find((room) => room.id === roomId)?.kind === 'special'
  )
    throw new Error(
      '특별한 방 네 개는 유지해야 합니다. 방 내용을 편집하거나 재굴림하세요.',
    );
  for (const p of c.monsterPlacements)
    if (p.dungeonId === dungeonId && p.roomId === roomId) p.roomId = null;
  for (const key of ['npcPlacements', 'encounterPlacements'] as const)
    for (const p of c[key])
      if (p.dungeonId === dungeonId && p.roomId === roomId) p.roomId = null;
  for (const target of [
    c.workspace.contentTarget,
    ...Object.values(c.workspace.contentDraftTargets ?? {}),
  ])
    if (target?.roomId === roomId) target.roomId = null;
  if (d.crawl) {
    d.crawl.visitedRoomIds = d.crawl.visitedRoomIds.filter(
      (key) => key !== roomId,
    );
    if (d.crawl.currentRoomId === roomId) {
      d.crawl.currentRoomId = null;
      if (d.crawl.phase === 'room') d.crawl.phase = 'ready';
    }
  }
  d.rooms = d.rooms.filter((r) => r.id !== roomId);
  d.updatedAt = now();
  if (c.workspace.roomId === roomId) c.workspace.roomId = null;
  if (c.workspace.monsterTarget?.roomId === roomId)
    c.workspace.monsterTarget.roomId = null;
  syncMonsterRefs(c);
  syncContentRefs(c);
  pruneChronicleReferences(c);
}
export function deleteDungeon(c: Campaign, dungeonId: string): void {
  for (const key of ['npcPlacements', 'encounterPlacements'] as const)
    c[key] = c[key].filter((p) => p.dungeonId !== dungeonId);
  if (c.workspace.contentTarget?.dungeonId === dungeonId)
    c.workspace.contentTarget = null;
  for (const kind of ['npcs', 'encounters'] as const)
    if (c.workspace.contentDraftTargets?.[kind]?.dungeonId === dungeonId)
      c.workspace.contentDraftTargets[kind] = null;
  c.dungeons = c.dungeons.filter((d) => d.id !== dungeonId);
  c.monsterPlacements = c.monsterPlacements.filter(
    (p) => p.dungeonId !== dungeonId,
  );
  if (c.workspace.dungeonId === dungeonId) {
    c.workspace.dungeonId = null;
    c.workspace.roomId = null;
  }
  if (c.workspace.monsterTarget?.dungeonId === dungeonId)
    c.workspace.monsterTarget = null;
  pruneChronicleReferences(c);
}
export function duplicateDungeon(c: Campaign, dungeonId: string) {
  const source = c.dungeons.find((d) => d.id === dungeonId);
  if (!source) throw new Error('복제할 던전이 없습니다.');
  const d = structuredClone(source);
  Object.assign(d, {
    id: id(),
    title: d.title + ' — copy',
    createdAt: now(),
    updatedAt: now(),
  });
  const roomMap = new Map<string, string>();
  const encounterMap = new Map<string, string>();
  if (d.encounterTables)
    for (const kind of ['common', 'rare'] as const)
      d.encounterTables[kind] = d.encounterTables[kind].map((ref) => {
        if (!ref) return null;
        if (!encounterMap.has(ref)) {
          const original = c.encounters.find((e) => e.id === ref);
          if (!original) throw new Error('복제할 조우표의 항목이 없습니다.');
          const copy = cloneContent(original);
          c.encounters.push(copy);
          encounterMap.set(ref, copy.id);
        }
        return encounterMap.get(ref)!;
      });
  for (const r of d.rooms) {
    const next = id();
    roomMap.set(r.id, next);
    r.id = next;
  }
  remapDungeonCrawl(d, (key) => roomMap.get(key) ?? key);
  const copies = c.monsterPlacements
    .filter((p) => p.dungeonId === source.id)
    .map((p) => ({
      ...structuredClone(p),
      id: id(),
      dungeonId: d.id,
      roomId: p.roomId ? roomMap.get(p.roomId)! : null,
    }));
  for (const key of ['npcPlacements', 'encounterPlacements'] as const)
    c[key].push(
      ...c[key]
        .filter((p) => p.dungeonId === source.id)
        .map((p) => ({
          ...structuredClone(p),
          id: id(),
          dungeonId: d.id,
          entityId:
            key === 'encounterPlacements'
              ? (encounterMap.get(p.entityId) ?? p.entityId)
              : p.entityId,
          roomId: p.roomId ? roomMap.get(p.roomId)! : null,
        })),
    );
  c.dungeons.push(d);
  c.monsterPlacements.push(...copies);
  syncMonsterRefs(c);
  syncContentRefs(c);
  return d;
}
