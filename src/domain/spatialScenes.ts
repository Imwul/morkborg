import type { ReferenceContext, ReferenceEntry } from './references';

/** Navigation only. No dice, source rows, probabilities or relationship edges. */
export interface SpatialHotspot {
  id: string;
  referenceId: string;
  semanticRole: string;
  visualTarget: string;
  accessibleLabel: string;
}
export interface SpatialScene {
  id: string;
  title: string;
  subtitle: string;
  context: ReferenceContext;
  description: string;
  hotspots: SpatialHotspot[];
}
const spot = (
  scene: string,
  target: string,
  referenceId: string,
  label: string,
): SpatialHotspot => ({
  id: `${scene}-${target}`,
  referenceId,
  semanticRole: target,
  visualTarget: target,
  accessibleLabel: label,
});

export const SPATIAL_SCENES: SpatialScene[] = [
  {
    id: 'dungeon',
    title: 'Dungeon',
    subtitle: '문 너머의 방',
    context: 'dungeon',
    description:
      '문을 살피고, 어둠 속 물건을 들춰보세요. 어디부터 시작해도 좋습니다.',
    hotspots: [
      spot(
        'dungeon',
        'entrance',
        'oracle:reclvse.dungeonEntrance',
        '입구 · Entrance',
      ),
      spot(
        'dungeon',
        'masonry',
        'oracle:reclvse.architecture',
        '석조 벽 · Architecture',
      ),
      spot(
        'dungeon',
        'door',
        'rule:depths.locked-doors',
        '잠긴 문 · Locked doors',
      ),
      spot(
        'dungeon',
        'contents',
        'oracle:reclvse.contentsCategory',
        '방 안 · Room contents',
      ),
      spot(
        'dungeon',
        'furnishing',
        'oracle:reclvse.dressing',
        '집기 · Dungeon dressing',
      ),
      spot('dungeon', 'chest', 'oracle:reclvse.roomLoot', '전리품 · Room loot'),
      spot('dungeon', 'trap', 'oracle:core.traps', '함정 · Traps'),
      spot('dungeon', 'passage', 'rule:reclvse.passage', '통로 · Passage'),
      spot('dungeon', 'light', 'oracle:reclvse.light', '등불 · Light'),
      spot(
        'dungeon',
        'corpse',
        'oracle:core.corpsePlundering',
        '시체 수색 · Corpse plundering',
      ),
      spot(
        'dungeon',
        'sounds',
        'oracle:reclvse.sounds',
        '귀 기울이기 · Sounds',
      ),
    ],
  },
  {
    id: 'city',
    title: 'City crawl',
    subtitle: '성벽 안의 소란',
    context: 'city',
    description:
      '관문을 지나 거리로 들어서세요. 모인 사람들, 문 열린 가게와 골목을 살펴보세요.',
    hotspots: [
      spot(
        'city',
        'gate',
        'oracle:aitc.city-gate-reaction',
        '관문 경비 · Gate reaction',
      ),
      spot('city', 'street', 'procedure:aitc.street', '거리 · Street'),
      spot('city', 'crowd', 'oracle:aitc.gatherings', '군중 · Gatherings'),
      spot('city', 'tavern', 'oracle:aitc.taverns', '선술집 · Taverns'),
      spot('city', 'shop', 'oracle:aitc.businesses', '상점 · Businesses'),
      spot(
        'city',
        'townhouse',
        'oracle:aitc.interior-townhouse',
        '저택 내부 · Townhouse',
      ),
      spot('city', 'shrine', 'procedure:city.pray', '사당 · Pray'),
      spot(
        'city',
        'merchant',
        'oracle:aitc.merchant-disposition',
        '노점 상인 · Merchant disposition',
      ),
      spot(
        'city',
        'directions',
        'procedure:city.directions',
        '갈림길 · Directions',
      ),
    ],
  },
  {
    id: 'wilderness',
    title: 'Journey',
    subtitle: '길 위에서',
    context: 'travel',
    description:
      '길을 따라가거나 숲으로 벗어나세요. 발자국과 야영지에도 이야기가 있습니다.',
    hotspots: [
      spot('wilderness', 'road', 'oracle:feretory.roadType', '길 · Road'),
      spot(
        'wilderness',
        'tracks',
        'oracle:reclvse.signs_of_travelers',
        '발자국 · Signs of travelers',
      ),
      spot(
        'wilderness',
        'offroad',
        'oracle:feretory.leaveRoad',
        '길 밖으로 · Leaving the road',
      ),
      spot(
        'wilderness',
        'forage',
        'oracle:feretory.forage',
        '숲에서 채집 · Foraging',
      ),
      spot(
        'wilderness',
        'camp',
        'oracle:feretory.campsite',
        '야영지 · Campsite',
      ),
      spot('wilderness', 'weather', 'oracle:core.weather', '하늘 · Weather'),
      spot(
        'wilderness',
        'village',
        'oracle:feretory.village',
        '마을 · Village',
      ),
      spot(
        'wilderness',
        'corpse',
        'oracle:core.corpsePlundering',
        '시체 수색 · Corpse plundering',
      ),
      spot(
        'wilderness',
        'distances',
        'rule:feretory.travel-distances',
        '이정표 · Travel distances',
      ),
    ],
  },
];

export function validateSpatialScenes(
  scenes: SpatialScene[],
  byId: Record<string, ReferenceEntry>,
): string[] {
  const problems: string[] = [],
    sceneIds = new Set<string>(),
    hotspotIds = new Set<string>();
  for (const scene of scenes) {
    if (sceneIds.has(scene.id)) problems.push(`Duplicate scene: ${scene.id}`);
    sceneIds.add(scene.id);
    const targets = new Set<string>();
    for (const hotspot of scene.hotspots) {
      if (hotspotIds.has(hotspot.id))
        problems.push(`Duplicate hotspot: ${hotspot.id}`);
      hotspotIds.add(hotspot.id);
      if (targets.has(hotspot.visualTarget))
        problems.push(`Shadowed artwork: ${scene.id}/${hotspot.visualTarget}`);
      targets.add(hotspot.visualTarget);
      if (!byId[hotspot.referenceId])
        problems.push(
          `Missing reference: ${hotspot.id} → ${hotspot.referenceId}`,
        );
      if (!hotspot.accessibleLabel.trim())
        problems.push(`Missing accessible label: ${hotspot.id}`);
    }
  }
  return problems;
}

/** The same inspect operation used by Search; selecting artwork never rolls. */
export function inspectSpatialHotspot(
  hotspot: SpatialHotspot,
  desk: {
    byId: Record<string, ReferenceEntry>;
    activate: (id: string, roll?: boolean) => void;
  },
) {
  const entry = desk.byId[hotspot.referenceId];
  if (!entry)
    throw new Error(`Missing spatial reference: ${hotspot.referenceId}`);
  desk.activate(entry.id, false);
}

export const normalizeSpatialSceneId = (raw: unknown): string =>
  SPATIAL_SCENES.some((scene) => scene.id === raw) ? String(raw) : 'dungeon';
