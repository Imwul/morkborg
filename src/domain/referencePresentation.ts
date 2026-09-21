import type { OracleRegistry } from './oracle';
import {
  searchReferences,
  type ReferenceEntry,
  type ReferenceRegistry,
  type ReferenceContext,
} from './references';
import { referenceFormula } from './freeformReference';

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
