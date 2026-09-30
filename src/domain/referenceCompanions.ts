import {
  contextReferences,
  type ReferenceContext,
  type ReferenceRegistry,
} from './references';
import {
  relatedReferenceRelationships,
  type ReferenceRelationshipIndex,
  type RelatedReferenceRelationship,
} from './referenceRelationships';

const themes: Record<ReferenceContext, string> = {
  room: '방 · 탐색',
  dungeon: '던전 · 탐색',
  travel: '여정 · 날씨',
  npc: '인물 · 조우',
  monster: '생물 · 조우',
  city: '도시 · 거리',
  character: '캐릭터',
};

/** Presentation defaults only: these are navigation suggestions, never source dependencies. */
const contextFallbacks: Record<string, ReferenceContext> = {
  'oracle:core.names': 'npc',
  'oracle:core.corpsePlundering': 'room',
};

/** Recomputed from the open reference, never from browsing history or saved play state. */
export function referenceCompanions(
  registry: ReferenceRegistry,
  relationships: ReferenceRelationshipIndex,
  id: string,
  excludedIds: readonly string[] = [],
) {
  const selected = registry.byId[id];
  if (!selected) return { theme: '연결된 참조', items: [] };
  const context = selected.contexts[0] ?? contextFallbacks[selected.id];
  const theme =
    selected.id === 'oracle:core.reaction'
      ? '조우 · 반응'
      : context
        ? themes[context]
        : '연결된 참조';
  const related = relatedReferenceRelationships(
    registry,
    relationships,
    selected.id,
    8,
  );
  const contextual: RelatedReferenceRelationship[] = context
    ? contextReferences(registry, context, selected.regionIds[0], 8).map(
        (entry) => ({ entry, origins: [], sourceRefs: [] }),
      )
    : [];
  const seen = new Set([
    selected.id,
    ...excludedIds.map((id) => registry.byId[id]?.id ?? id),
  ]);
  const items = [...related, ...contextual]
    .filter(({ entry }) => {
      if (
        seen.has(entry.id) ||
        !entry.available ||
        !entry.action ||
        entry.kind === 'book' ||
        entry.kind === 'region'
      )
        return false;
      seen.add(entry.id);
      return true;
    })
    .slice(0, 6);
  return { theme, items };
}
