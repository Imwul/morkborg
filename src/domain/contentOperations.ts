import type {
  Campaign,
  ContentKind,
  ContentPlacement,
  Encounter,
  EncounterParticipant,
  MonsterTarget,
  NPC,
} from './types';
import { id, now } from '../generators/random';
import { createEncounter, createNPC } from '../generators/content';
import { validMonsterTarget } from './monsterOperations';
export const contentPlacementKey = (kind: ContentKind) =>
  kind === 'npcs' ? 'npcPlacements' : 'encounterPlacements';
export const contentRefKey = (kind: ContentKind) =>
  kind === 'npcs' ? 'npcIds' : 'encounterIds';
export function syncContentRefs(c: Campaign): void {
  for (const kind of ['npcs', 'encounters'] as const)
    for (const d of c.dungeons) {
      const ps = c[contentPlacementKey(kind)].filter(
        (p) => p.dungeonId === d.id,
      );
      const key = contentRefKey(kind);
      d[key] = [...new Set(ps.map((p) => p.entityId))];
      for (const r of d.rooms)
        r[key] = [
          ...new Set(
            ps.filter((p) => p.roomId === r.id).map((p) => p.entityId),
          ),
        ];
    }
}
export function contentRelationIssues(c: Campaign): string[] {
  const issues: string[] = [];
  for (const kind of ['npcs', 'encounters'] as const)
    for (const p of c[contentPlacementKey(kind)]) {
      const d = c.dungeons.find((d) => d.id === p.dungeonId);
      if (!c[kind].some((e) => e.id === p.entityId))
        issues.push('배치의 원본 정의가 없습니다.');
      if (!d || (p.roomId !== null && !d.rooms.some((r) => r.id === p.roomId)))
        issues.push('배치 위치가 없습니다.');
      if (
        !Number.isInteger(p.quantity) ||
        p.quantity < 1 ||
        p.quantity > 999999
      )
        issues.push('수량이 올바르지 않습니다.');
    }
  for (const e of [
    ...c.encounters,
    ...(c.drafts.encounters ? [c.drafts.encounters] : []),
  ])
    for (const p of e.participants) {
      const collection = p.kind === 'monster' ? c.monsters : c.npcs;
      if (!collection.some((x) => x.id === p.entityId))
        issues.push('조우 참가자의 원본 정의가 없습니다.');
    }
  return issues;
}
export function beginContentDraft(
  c: Campaign,
  kind: ContentKind,
  target?: MonsterTarget | null,
  blank = false,
): void {
  const validTarget = validMonsterTarget(
    c,
    target === undefined ? c.workspace.contentDraftTargets?.[kind] : target,
  );
  const d = c.dungeons.find((d) => d.id === validTarget?.dungeonId);
  const region = d?.region ?? c.workspace.contentRegion ?? 'sarkash';
  if (!c.drafts[kind]) {
    if (kind === 'npcs') c.drafts.npcs = createNPC(c.id, region, blank);
    else
      c.drafts.encounters = createEncounter(
        c.id,
        region,
        c.workspace.encounterCategory ?? 'common',
        c.workspace.encounterDR ?? 10,
        blank,
      );
  }
  c.workspace.contentTarget = validTarget ? { ...validTarget } : null;
  c.workspace.contentDraftTargets = {
    ...c.workspace.contentDraftTargets,
    [kind]: validTarget ? { ...validTarget } : null,
  };
  c.workspace.contentRegion = region;
  c.workspace.section = kind;
  c.workspace.selected[kind] = c.drafts[kind]!.id;
}
export function saveContentDraft(
  c: Campaign,
  kind: ContentKind,
): NPC | Encounter {
  const draft = c.drafts[kind];
  if (!draft) throw new Error('저장할 후보가 없습니다.');
  if (c[kind].some((e) => e.id === draft.id))
    throw new Error('이미 저장된 후보입니다.');
  const entity = structuredClone(draft);
  entity.campaignId = c.id;
  entity.updatedAt = now();
  (c[kind] as (NPC | Encounter)[]).push(entity);
  c.drafts[kind] = null;
  if (c.workspace.contentDraftTargets)
    delete c.workspace.contentDraftTargets[kind];
  c.workspace.selected[kind] = entity.id;
  return entity;
}
export function addContentPlacement(
  c: Campaign,
  kind: ContentKind,
  entityId: string,
  target: MonsterTarget,
  quantity = 1,
  notes = '',
): ContentPlacement {
  const d = c.dungeons.find((d) => d.id === target.dungeonId);
  if (
    !d ||
    (target.roomId !== null && !d.rooms.some((r) => r.id === target.roomId))
  )
    throw new Error('배치할 던전과 방을 확인하세요.');
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999999)
    throw new Error('수량은 1–999999 정수여야 합니다.');
  if (!c[kind].some((e) => e.id === entityId)) {
    if (c.drafts[kind]?.id !== entityId)
      throw new Error('보관함에 없는 항목입니다.');
    saveContentDraft(c, kind);
  }
  const p: ContentPlacement = {
    id: id(),
    entityId,
    ...target,
    quantity,
    notes,
  };
  c[contentPlacementKey(kind)].push(p);
  d.updatedAt = now();
  syncContentRefs(c);
  return p;
}
export function editContentPlacement(
  c: Campaign,
  kind: ContentKind,
  placementId: string,
  patch: Partial<Pick<ContentPlacement, 'roomId' | 'quantity' | 'notes'>>,
): void {
  const p = c[contentPlacementKey(kind)].find((p) => p.id === placementId);
  if (!p) return;
  const d = c.dungeons.find((d) => d.id === p.dungeonId)!;
  if (patch.roomId && !d.rooms.some((r) => r.id === patch.roomId))
    throw new Error('해당 던전의 방이 아닙니다.');
  if (
    patch.quantity !== undefined &&
    (!Number.isInteger(patch.quantity) ||
      patch.quantity < 1 ||
      patch.quantity > 999999)
  )
    throw new Error('수량을 확인하세요.');
  Object.assign(p, patch);
  d.updatedAt = now();
  syncContentRefs(c);
}
export function removeContentPlacement(
  c: Campaign,
  kind: ContentKind,
  placementId: string,
): void {
  const key = contentPlacementKey(kind),
    p = c[key].find((p) => p.id === placementId);
  c[key] = c[key].filter((p) => p.id !== placementId);
  const d = c.dungeons.find((d) => d.id === p?.dungeonId);
  if (d) d.updatedAt = now();
  syncContentRefs(c);
}
export function cloneContent<T extends NPC | Encounter>(
  entity: T,
  campaignId = entity.campaignId,
): T {
  const copy = structuredClone(entity);
  Object.assign(copy, {
    id: id(),
    campaignId,
    createdAt: now(),
    updatedAt: now(),
  });
  if ('participants' in copy) for (const p of copy.participants) p.id = id();
  return copy;
}
export function deleteContent(
  c: Campaign,
  kind: ContentKind,
  entityId: string,
): void {
  const key = contentPlacementKey(kind),
    affected = new Set(
      c[key].filter((p) => p.entityId === entityId).map((p) => p.dungeonId),
    );
  const index = c[kind].findIndex((e) => e.id === entityId);
  if (index >= 0) c[kind].splice(index, 1);
  if (c.drafts[kind]?.id === entityId) c.drafts[kind] = null;
  if (c.workspace.selected[kind] === entityId)
    c.workspace.selected[kind] = null;
  c[key] = c[key].filter((p) => p.entityId !== entityId);
  if (kind === 'npcs') removeParticipantReferences(c, 'npc', entityId);
  for (const d of c.dungeons) if (affected.has(d.id)) d.updatedAt = now();
  if (c.dungeonDraft)
    for (const a of [c.dungeonDraft, ...c.dungeonDraft.rooms])
      a[contentRefKey(kind)] = a[contentRefKey(kind)].filter(
        (id) => id !== entityId,
      );
  syncContentRefs(c);
}
export function removeParticipantReferences(
  c: Campaign,
  kind: 'monster' | 'npc',
  entityId: string,
): void {
  for (const e of [
    ...c.encounters,
    ...(c.drafts.encounters ? [c.drafts.encounters] : []),
  ]) {
    const kept = (e.participants ?? []).filter(
      (p) => !(p.kind === kind && p.entityId === entityId),
    );
    if (kept.length !== (e.participants ?? []).length) {
      e.participants = kept;
      e.updatedAt = now();
    }
  }
}
export function addEncounterParticipant(
  c: Campaign,
  encounter: Encounter,
  kind: 'monster' | 'npc',
  entityId: string,
  quantity = 1,
): EncounterParticipant {
  if (
    !(kind === 'monster' ? c.monsters : c.npcs).some((e) => e.id === entityId)
  )
    throw new Error('같은 캠페인에 저장된 참가자를 선택하세요.');
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999999)
    throw new Error('수량을 확인하세요.');
  const p = { id: id(), kind, entityId, quantity };
  encounter.participants.push(p);
  encounter.updatedAt = now();
  return p;
}
export function materializeDraftContentRefs(
  c: Campaign,
  dungeonId: string,
): void {
  const d = c.dungeons.find((d) => d.id === dungeonId);
  if (!d) return;
  const original = structuredClone(d);
  for (const kind of ['npcs', 'encounters'] as const) {
    const key = contentRefKey(kind),
      inRooms = new Set(original.rooms.flatMap((r) => r[key]));
    for (const r of original.rooms)
      for (const entityId of r[key])
        addContentPlacement(c, kind, entityId, { dungeonId, roomId: r.id });
    for (const entityId of original[key])
      if (!inRooms.has(entityId))
        addContentPlacement(c, kind, entityId, { dungeonId, roomId: null });
  }
}

export function setContentTarget(
  c: Campaign,
  kind: ContentKind,
  target: MonsterTarget | null,
): void {
  c.workspace.contentTarget = validMonsterTarget(c, target);
  if (c.drafts[kind]?.id === c.workspace.selected[kind])
    c.workspace.contentDraftTargets = {
      ...c.workspace.contentDraftTargets,
      [kind]: c.workspace.contentTarget
        ? { ...c.workspace.contentTarget }
        : null,
    };
}
export function patchContentField(
  entity: NPC | Encounter,
  key: string,
  value: string | number,
  source = '직접 작성',
): void {
  if (
    [
      'id',
      'campaignId',
      'createdAt',
      'updatedAt',
      'participants',
      'sourceRefs',
      'sources',
      'generation',
    ].includes(key) ||
    !(key in entity)
  )
    return;
  Object.assign(entity, { [key]: value });
  const aliases =
    key === 'text' && 'text' in entity ? ['text', 'description'] : [key];
  if (aliases.length === 2 && 'text' in entity) {
    entity.description = String(value);
    entity.unresolved = false;
  }
  if (key !== 'notes') {
    entity.sources = {
      ...entity.sources,
      ...Object.fromEntries(aliases.map((field) => [field, source])),
    };
    entity.sourceRefs = entity.sourceRefs.filter(
      (ref) => !ref.field || !aliases.includes(ref.field),
    );
  }
  entity.updatedAt = now();
}
