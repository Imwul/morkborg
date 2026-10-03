import type { OracleRegistry } from './oracle';
import {
  searchReferences,
  type ReferenceEntry,
  type ReferenceRegistry,
  type ReferenceContext,
} from './references';
import { referenceFormula } from './freeformReference';
import { trustedReferenceSearchTitle } from './referenceSearchTitles';
import { REFERENCE_SEARCH_ALIASES } from './referenceSearchAliases';

/** Keep search relevance order; themes are for browsing, not ranked results. */
export function partitionReferenceSearch(
  index: ReferenceRegistry,
  entries: ReferenceEntry[],
  query: string,
) {
  const normalize = (text: string) =>
    text
      .normalize('NFC')
      .toLocaleLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim();
  const needle = normalize(query);
  const exact: ReferenceEntry[] = [],
    named: ReferenceEntry[] = [],
    related: ReferenceEntry[] = [];
  for (const entry of entries) {
    const names = [
      entry.title,
      trustedReferenceSearchTitle(index, entry)?.text ??
        entry.titleTranslationKo ??
        '',
      ...(entry.searchAliases?.en ?? []),
      ...(entry.searchAliases?.ko ?? []),
      ...(REFERENCE_SEARCH_ALIASES[entry.id]?.ko ?? []),
      ...(REFERENCE_SEARCH_ALIASES[entry.id]?.en ?? []),
    ]
      .map(normalize)
      .filter(Boolean);
    if (needle && names.includes(needle)) exact.push(entry);
    else if (needle && names.some((name) => name.includes(needle)))
      named.push(entry);
    else related.push(entry);
  }
  return { exact, named, related };
}

/** These are the existing registry kinds, not modes or source procedures. */
export const REFERENCE_TYPES = [
  ['all', '전체'],
  ['rule', '규칙'],
  ['oracle', '표 · 오라클'],
  ['procedure', '절차 · 생성기'],
  ['creature', '생물'],
  ['region', '지역'],
  ['book', '책'],
] as const;
export const REFERENCE_CONTEXTS = [
  ['character', '캐릭터'],
  ['npc', 'NPC'],
  ['monster', '몬스터'],
  ['room', '방'],
  ['dungeon', '던전'],
  ['travel', '여행'],
  ['city', '도시'],
] as const;
export function referenceEntryFormula(
  entry: ReferenceEntry,
  registry: OracleRegistry,
) {
  if (entry.id === 'procedure:character.core-classless') return ''; // Each complete PC field retains its own dice; scrolls restrict arms after the kit roll.
  if (entry.id === 'procedure:sd.dungeon-preparation') return ''; // Each independent field displays its own source dice on the preparation sheet.
  if (entry.id === 'procedure:depths.encounter-level')
    return 'd20 ≤ Encounter Level';
  if (entry.id === 'rule:sd.leaving-road')
    return 'd20 + Presence / Omens · DR10';
  if (entry.id === 'rule:core.reaction-morale')
    return '2d6 > Morale · 실패 시 d6';
  if (entry.id === 'rule:sd.dungeonCrawling')
    return '2d20 + Special Rooms · Dungeon DR';
  if (entry.id === 'rule:sd.camping-move')
    return '2d20 + Presence · DR9 / DR12';
  const ids =
    entry.action?.kind === 'procedure'
      ? (registry.procedures.find(
          (p) =>
            p.id ===
            (entry.action?.kind === 'procedure'
              ? entry.action.procedureId
              : ''),
        )?.oracleIds ?? entry.canonicalIds)
      : entry.canonicalIds;
  return referenceFormula(
    [...new Set(ids)].filter((id) => {
      const table = registry.tables.find((t) => t.id === id);
      return (
        table &&
        !String(table.originalDice ?? table.dice).startsWith('Reference')
      );
    }),
    registry,
  );
}
export function referenceEntryDescription(entry: ReferenceEntry) {
  const descriptions: Record<string, string> = {
    'procedure:sd.dungeon-preparation':
      'SD의 던전 준비 양식. 필요한 항목만 독립적으로 굴립니다.',
    'oracle:core.reaction': '상대의 반응이 불분명할 때',
    'oracle:core.weather': '오늘의 날씨',
    'oracle:core.corpsePlundering': '시체에서 발견하는 물건',
    'oracle:feretory.roadType': '길의 상태와 종류',
    'rule:core.reaction-morale': '적이 도망치거나 항복하는지 확인',
    'oracle:core.names': '새로 만난 인물에게 이름이 필요할 때',
    'oracle:core.miseries': 'Calendar에서 재앙이 발생했을 때',
    'oracle:sd.room.contents': '새 방 안에 무엇이 있는지 정할 때',
    'oracle:sd.room.exits': '방에서 이어지는 출구를 정할 때',
    'oracle:sd.usefulItems': '쓸 만한 물건을 발견했을 때',
    'procedure:reclvse.action-theme': '사건이나 행동의 단서가 필요할 때',
    'procedure:aitc.street': '새로운 거리를 탐색할 때',
    'procedure:aitc.settlement': '정착지의 규모와 인상을 정할 때',
    'procedure:workbench.npc': '이름부터 반응까지 한 인물이 필요할 때',
  };
  return (
    descriptions[entry.id] ??
    (entry.summaryTranslationKo || entry.summary).split('\n')[0]
  );
}
/** Price lists and bounty indexes are source data, not desk oracles. */
export function isDeskClutter(entry: ReferenceEntry) {
  const kind = entry.definition?.kind;
  if (kind === 'Valuation' || kind === 'Purchase') return true;
  if (
    entry.id === 'oracle:core.creatureValuations' ||
    entry.id === 'oracle:core.beasts'
  )
    return true;
  const body = (entry.definition?.blocks ?? [])
    .map((block) => block.text)
    .join('\n')
    .trim();
  if (
    kind === 'Equipment' &&
    body &&
    /^(?:\d+(?:–\d+)?s(?:\n|$))+$/.test(body.replace(/ /g, ''))
  )
    return true;
  return false;
}

export function browseReferences(
  index: ReferenceRegistry,
  query: string,
  options: {
    kind?: string;
    context?: string;
    book?: string;
    ids?: string[];
  } = {},
) {
  const pool = query.trim()
    ? searchReferences(index, query, { limit: index.entries.length })
    : options.ids
      ? options.ids.map((id) => index.byId[id]).filter(Boolean)
      : [...index.entries].sort((a, b) => a.title.localeCompare(b.title));
  return pool.filter(
    (e) =>
      !isDeskClutter(e) &&
      (!options.kind || options.kind === 'all' || e.kind === options.kind) &&
      (!options.context ||
        e.contexts.includes(options.context as ReferenceContext)) &&
      (!options.book || e.sourceRefs.some((s) => s.bookId === options.book)) &&
      (!options.ids || options.ids.includes(e.id)),
  );
}

/** One place per reference, with stable play priorities before the full index. */
const REFERENCE_RESULT_THEMES: readonly {
  id: string;
  title: string;
  description: string;
  contexts: readonly ReferenceContext[];
  first: readonly string[];
}[] = [
  {
    id: 'dungeon',
    title: '던전 · 방',
    description: '방을 열고, 출구와 발견물을 정할 때',
    contexts: ['dungeon', 'room'],
    first: [
      'oracle:sd.room.contents',
      'oracle:sd.room.exits',
      'procedure:sd.room-description',
      'oracle:sd.usefulItems',
      'oracle:core.corpsePlundering',
      'rule:sd.dungeonCrawling',
    ],
  },
  {
    id: 'travel',
    title: '여정',
    description: '날씨, 길의 상태, 오늘의 사건',
    contexts: ['travel'],
    first: [
      'oracle:core.weather',
      'oracle:feretory.roadType',
      'oracle:feretory.roadEvent',
      'rule:sd.travel-day',
      'rule:sd.camping-move',
    ],
  },
  {
    id: 'character',
    title: '인물 · 조우',
    description: '누구를 만났고, 어떻게 반응하는지',
    contexts: ['character', 'npc'],
    first: [
      'oracle:core.reaction',
      'oracle:core.names',
      'procedure:workbench.npc',
      'rule:core.reaction-morale',
      'procedure:character.core-classless',
    ],
  },
  {
    id: 'city',
    title: '도시',
    description: '거리와 정착지, 그 안에서 일어나는 일',
    contexts: ['city'],
    first: [
      'procedure:aitc.street',
      'procedure:aitc.settlement',
      'procedure:city.crawl',
    ],
  },
  {
    id: 'monster',
    title: '생물',
    description: '다가오는 위협의 모습과 목적',
    contexts: ['monster'],
    first: [
      'oracle:feretory.A',
      'procedure:workbench.epk',
      'procedure:feretory.monster-approaches',
    ],
  },
  {
    id: 'omens',
    title: '징조 · 이야기',
    description: '재앙, 질문, 다음 사건의 단서',
    contexts: [],
    first: [
      'procedure:reclvse.action-theme',
      'oracle:core.miseries',
      'rule:mythic2.fate-question',
      'oracle:sd.yesNo',
      'rule:mythic.lists',
    ],
  },
];

function featuredPosition(entry: ReferenceEntry, ids: readonly string[]) {
  return ids.indexOf(entry.id);
}

export type ReferenceResultTheme = {
  id: string;
  title: string;
  description?: string;
  entries: ReferenceEntry[];
};

export function groupReferenceResults(
  entries: ReferenceEntry[],
  preferredContext?: string,
  registry?: Pick<ReferenceRegistry, 'byId'>,
): ReferenceResultTheme[] {
  const themes = REFERENCE_RESULT_THEMES.map((theme) => ({
    ...theme,
    // Resolve aliases to their actual row. A procedure using a featured table
    // must not accidentally inherit that table's place in the index.
    first: [...new Set(theme.first.map((id) => registry?.byId[id]?.id ?? id))],
  }));
  const groups = new Map<string, ReferenceResultTheme>();
  const seen = new Set<string>();
  const preferred = themes.find((theme) =>
    theme.contexts.some((context) => context === preferredContext),
  );
  for (const entry of entries) {
    if (seen.has(entry.id)) continue;
    seen.add(entry.id);
    const theme =
      preferred &&
      preferred.contexts.some((context) => entry.contexts.includes(context))
        ? preferred
        : (themes.find(
            (candidate) => featuredPosition(entry, candidate.first) >= 0,
          ) ??
          themes.find((candidate) =>
            candidate.contexts.some((context) =>
              entry.contexts.includes(context),
            ),
          ));
    const id = theme?.id ?? 'other';
    let group = groups.get(id);
    if (!group) {
      group = {
        id,
        title: theme?.title ?? '그 밖의 참조',
        description: theme?.description,
        entries: [],
      };
      groups.set(id, group);
    }
    group.entries.push(entry);
  }
  // Editorial priorities apply only to browsing. Search, Pins and Recent keep
  // their own ranking, and every remaining reference remains discoverable.
  for (const group of groups.values()) {
    const first = themes.find((theme) => theme.id === group.id)?.first ?? [];
    const rank = (entry: ReferenceEntry) => {
      const featured = featuredPosition(entry, first);
      if (entry.available === false) return 1000;
      if (featured >= 0) return featured;
      if (entry.action && entry.kind === 'oracle') return 100;
      if (entry.action) return 200;
      return 300;
    };
    group.entries.sort(
      (a, b) =>
        rank(a) - rank(b) || (a.title ?? a.id).localeCompare(b.title ?? b.id),
    );
  }
  return [
    ...themes
      .map((theme) => groups.get(theme.id))
      .filter((group): group is ReferenceResultTheme => !!group),
    ...(groups.has('other') ? [groups.get('other')!] : []),
  ];
}
