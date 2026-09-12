import type { ReferenceRegistry } from './references';
import type { OracleRegistry } from './oracle';

/** Navigation metadata only. No ordering, prerequisites, completion or game state. */
export const REFERENCE_SHELVES = {
  quick: {
    title: '작업대',
    ids: [
      'oracle:core.reaction',
      'rule:core.reaction-morale',
      'oracle:core.weather',
      'procedure:workbench.npc',
      'procedure:workbench.stock-room',
      'oracle:core.corpsePlundering',
      'oracle:core.treasures',
      'rule:core.omens',
      'oracle:core.miseries',
      'rule:core.tests',
      'rule:core.violence',
      'rule:core.rest',
    ],
  },
  travel: {
    title: '여행 · 재앙',
    ids: [
      'oracle:core.weather',
      'oracle:feretory.roadType',
      'oracle:feretory.roadEvent',
      'rule:sd.leaving-road',
      'oracle:feretory.leaveRoad',
      'oracle:feretory.forage',
      'oracle:feretory.campsite',
      'rule:sd.camping-move',
      'rule:feretory.travel-distances',
      'oracle:depths.travel.encounter',
      'procedure:depths.encounter-level',
      'oracle:core.reaction',
      'rule:core.miseries',
      'oracle:core.miseries',
      'rule:sd.travel-day',
      'rule:feretory.roads',
      'rule:depths.hex-travel',
    ],
  },
  dungeon: {
    title: '던전 · 방',
    ids: [
      'rule:sd.dungeonCrawling',
      'procedure:sd.room-description',
      'oracle:sd.room.contents',
      'oracle:sd.room.exits',
      'oracle:depths.danger',
      'oracle:depths.weakHitConsequences',
      'rule:depths.traps',
      'oracle:depths.traps.regular',
      'oracle:depths.traps.special',
      'rule:sd.search-move',
      'oracle:sd.search.strong',
      'oracle:sd.search.weak',
      'oracle:core.corpsePlundering',
      'oracle:core.treasures',
      'oracle:core.reaction',
      'rule:depths.enemy-detection',
      'rule:sd.stockCommon',
      'rule:sd.stockRare',
      'procedure:workbench.stock-room',
      'rule:depths.locked-doors',
      'rule:depths.time-noise',
    ],
  },
  city: {
    title: '도시',
    ids: [
      'procedure:aitc.street',
      'oracle:aitc.street-adjective',
      'oracle:aitc.street-type',
      'oracle:aitc.street-contents',
      'oracle:aitc.street-exits',
      'oracle:aitc.backtracking',
      'oracle:aitc.hazards',
      'oracle:aitc.unexpected-events',
      'oracle:aitc.npc-encounters',
      'oracle:core.reaction',
      'procedure:aitc.settlement',
      'procedure:aitc.settlement-name',
      'oracle:aitc.settlement-size',
      'oracle:aitc.settlement-descriptor',
      'oracle:aitc.civic-buildings',
      'oracle:aitc.businesses',
      'oracle:aitc.taverns',
      'oracle:aitc.gatherings',
      'procedure:aitc.festival',
      'oracle:aitc.notable-artefact-type',
    ],
  },
  rules: {
    title: '판정 · 전투',
    ids: [
      'rule:core.tests',
      'rule:core.violence',
      'rule:core.round',
      'rule:core.crit-fumble',
      'rule:core.armor-shield',
      'rule:core.reaction-morale',
      'oracle:core.reaction',
      'rule:core.broken',
      'oracle:core.broken',
      'rule:core.flee',
      'rule:core.casting',
      'rule:core.omens',
      'rule:core.rest',
      'rule:core.carrying',
      'rule:core.improvement',
    ],
  },
} as const;
export type ReferenceShelf = keyof typeof REFERENCE_SHELVES;
export function shelfReferences(
  shelf: ReferenceShelf,
  index: ReferenceRegistry,
) {
  return [
    ...new Map(
      REFERENCE_SHELVES[shelf].ids.flatMap((id) =>
        index.byId[id] ? [[index.byId[id].id, index.byId[id]] as const] : [],
      ),
    ).values(),
  ].sort((a, b) => Number(a.kind === 'rule') - Number(b.kind === 'rule'));
}
export function referenceFormula(
  ids: readonly string[],
  registry: OracleRegistry,
) {
  return ids
    .flatMap((id) => {
      const table = registry.tables.find((t) => t.id === id);
      return table ? [`${table.originalDice ?? table.dice}`] : [];
    })
    .join(' / ');
}
export const SITUATIONAL_ROAD_ID = 'rule:sd.leaving-road';
