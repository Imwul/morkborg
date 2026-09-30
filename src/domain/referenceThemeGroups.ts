import type {
  ReferenceContext,
  ReferenceEntry,
  ReferenceRegistry,
} from './references';
import type { RelatedReferenceRelationship } from './referenceRelationships';
import { isDeskClutter } from './referencePresentation';

/** Stable browsing themes; these are navigation choices, not source relationships. */
export const REFERENCE_BROWSE_THEMES: readonly {
  id: string;
  title: string;
  contexts: readonly ReferenceContext[];
  seeds: readonly string[];
}[] = [
  {
    id: 'people',
    title: '인물과 조우',
    contexts: ['npc', 'character', 'monster'],
    seeds: [
      'oracle:core.reaction',
      'oracle:core.names',
      'procedure:workbench.npc',
      'rule:core.reaction-morale',
    ],
  },
  {
    id: 'dungeon',
    title: '던전과 발견',
    contexts: ['dungeon', 'room'],
    seeds: [
      'oracle:sd.room.contents',
      'oracle:sd.room.exits',
      'oracle:sd.usefulItems',
      'oracle:core.corpsePlundering',
    ],
  },
  {
    id: 'journey',
    title: '거리와 여정',
    contexts: ['travel', 'city'],
    seeds: [
      'oracle:core.weather',
      'oracle:feretory.roadType',
      'oracle:feretory.roadEvent',
      'rule:sd.travel-day',
      'rule:sd.camping-move',
    ],
  },
  {
    id: 'omens',
    title: '징조와 이야기',
    contexts: [],
    seeds: [
      'oracle:core.miseries',
      'procedure:reclvse.action-theme',
      'rule:mythic2.fate-question',
      'rule:mythic.lists',
    ],
  },
];

// A setting is more specific than a character/stat tag shared by many moves.
const contextThemes = ['journey', 'dungeon', 'people'].map((id) =>
  REFERENCE_BROWSE_THEMES.find((theme) => theme.id === id)!,
);

export function referenceThemeGroups(
  registry: ReferenceRegistry,
  selectedId?: string,
  companions: readonly RelatedReferenceRelationship[] = [],
) {
  const seeds = new Map<string, string>();
  for (const theme of REFERENCE_BROWSE_THEMES)
    for (const id of theme.seeds) {
      const entry = registry.byId[id];
      if (entry) seeds.set(entry.id, theme.id);
    }
  const pools = new Map<string, ReferenceEntry[]>();
  const seen = new Set<string>();
  for (const entry of registry.entries) {
    if (
      seen.has(entry.id) ||
      !entry.available ||
      !entry.action ||
      isDeskClutter(entry) ||
      !['oracle', 'procedure', 'rule'].includes(entry.kind)
    )
      continue;
    seen.add(entry.id);
    const themeId =
      seeds.get(entry.id) ??
      (entry.id.includes(':mythic')
        ? 'omens'
        : contextThemes.find((theme) =>
            theme.contexts.some((context) => entry.contexts.includes(context)),
          )?.id);
    if (!themeId) continue;
    const pool = pools.get(themeId) ?? [];
    pool.push(entry);
    pools.set(themeId, pool);
  }
  return REFERENCE_BROWSE_THEMES.map((theme) => {
    const pool = pools.get(theme.id) ?? [];
    const priorities = [
      registry.byId[selectedId ?? '']?.id,
      ...companions.map(({ entry }) => entry.id),
      ...theme.seeds.map((id) => registry.byId[id]?.id),
    ];
    const rank = (id: string) => {
      const index = priorities.indexOf(id);
      return index < 0 ? Number.MAX_SAFE_INTEGER : index;
    };
    return {
      id: theme.id,
      title: theme.title,
      entries: pool.sort(
        (a, b) => rank(a.id) - rank(b.id) || a.title.localeCompare(b.title),
      ),
    };
  }).filter((group) => group.entries.length);
}
