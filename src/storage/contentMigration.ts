import { id } from '../generators/random';
const object = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === 'object' && !Array.isArray(x);
/** Add only absent v5 fields. Malformed existing fields remain visible to validation. */
export function upgradeCampaignContents(input: unknown): unknown {
  if (!object(input)) return input;
  const legacy =
    !('npcPlacements' in input) || !('encounterPlacements' in input);
  const c = structuredClone(input);
  for (const kind of ['npcs', 'encounters'] as const) {
    const candidates = [
      ...(Array.isArray(c[kind]) ? c[kind] : []),
      ...(object(c.drafts) && c.drafts[kind] ? [c.drafts[kind]] : []),
    ];
    for (const e of candidates)
      if (object(e)) {
        if (!('campaignId' in e)) e.campaignId = c.id;
        if (!('sourceRefs' in e))
          e.sourceRefs = object(e.sources)
            ? Object.entries(e.sources)
                .filter(([, value]) => typeof value === 'string')
                .map(([field, note]) => ({ field, note }))
            : [];
        if (kind === 'npcs')
          for (const field of [
            'personality',
            'reaction',
            'affiliation',
            'fears',
            'description',
          ]) {
            if (!(field in e)) e[field] = '';
          }
        else {
          if (!('text' in e))
            e.text = typeof e.description === 'string' ? e.description : '';
          if (!('participants' in e)) e.participants = [];
          if (!('dungeonDR' in e)) e.dungeonDR = 10;
        }
      }
    const placementKey =
      kind === 'npcs' ? 'npcPlacements' : 'encounterPlacements';
    const refKey = kind === 'npcs' ? 'npcIds' : 'encounterIds';
    if (!(placementKey in c)) {
      const placements: unknown[] = [];
      for (const d of Array.isArray(c.dungeons) ? c.dungeons : [])
        if (object(d)) {
          const rooms = (Array.isArray(d.rooms) ? d.rooms : []).filter(object);
          const memberIds = new Set(
            rooms.flatMap((r) => (Array.isArray(r[refKey]) ? r[refKey] : [])),
          );
          for (const r of rooms)
            for (const entityId of Array.isArray(r[refKey]) ? r[refKey] : [])
              placements.push({
                id: id(),
                entityId,
                dungeonId: d.id,
                roomId: r.id,
                quantity: 1,
                notes: '',
              });
          for (const entityId of Array.isArray(d[refKey]) ? d[refKey] : [])
            if (!memberIds.has(entityId))
              placements.push({
                id: id(),
                entityId,
                dungeonId: d.id,
                roomId: null,
                quantity: 1,
                notes: '',
              });
        }
      c[placementKey] = placements;
    }
  }
  if (
    legacy &&
    object(c.workspace) &&
    c.workspace.section === 'encounters' &&
    c.workspace.stockingKind === 'npcs'
  )
    c.workspace.section = 'npcs';
  if (legacy && object(c.workspace)) {
    const w = c.workspace;
    const kind =
      w.section === 'npcs'
        ? 'npcs'
        : w.section === 'encounters'
          ? 'encounters'
          : null;
    const d = (Array.isArray(c.dungeons) ? c.dungeons : [])
      .filter(object)
      .find((d) => d.id === w.dungeonId);
    const rooms = d && Array.isArray(d.rooms) ? d.rooms.filter(object) : [];
    const target = d
      ? {
          dungeonId: d.id,
          roomId: rooms.some((r) => r.id === w.roomId) ? w.roomId : null,
        }
      : null;
    if (kind && !('contentTarget' in w)) w.contentTarget = target;
    if (
      kind &&
      !('contentDraftTargets' in w) &&
      object(c.drafts) &&
      c.drafts[kind]
    )
      w.contentDraftTargets = { [kind]: target };
  }
  return c;
}
