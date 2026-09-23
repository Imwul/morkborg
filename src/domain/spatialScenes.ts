import type { ReferenceContext, ReferenceEntry } from './references';

/** Navigation only. No dice, source rows, probabilities or relationship edges. */
export interface SpatialHotspot {
  id: string;
  referenceId: string;
  semanticRole: string;
  visualTarget: string;
  accessibleLabel: string;
}
/** Context for imagining a place, kept separate from things drawn on the map. */
export interface SpatialSupportReference {
  id: string;
  referenceId: string;
  label: string;
}
export interface SpatialSupportGroup {
  id: string;
  title: string;
  description: string;
  references: SpatialSupportReference[];
}
export interface SpatialScene {
  id: string;
  title: string;
  subtitle: string;
  context: ReferenceContext;
  description: string;
  hotspots: SpatialHotspot[];
  supportGroups: SpatialSupportGroup[];
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
const support = (
  scene: string,
  target: string,
  referenceId: string,
  label: string,
): SpatialSupportReference => ({
  id: `${scene}-support-${target}`,
  referenceId,
  label,
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
        'threshold',
        'oracle:reclvse.entranceState',
        '문턱의 상태 · Entrance state',
      ),
      spot(
        'dungeon',
        'entrance-marks',
        'oracle:reclvse.entranceSigns',
        '입구의 흔적 · Entrance signs',
      ),
      spot(
        'dungeon',
        'entrance-odour',
        'oracle:reclvse.entranceSmells',
        '입구의 냄새 · Entrance smells',
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
        'oracle:reclvse.exitType',
        '출구의 형태 · Exit type',
      ),
      spot(
        'dungeon',
        'contents',
        'oracle:reclvse.contentsCategory',
        '방 안 · Room contents',
      ),
      spot(
        'dungeon',
        'floor',
        'oracle:reclvse.roomShape',
        '방의 형태 · Room shape',
      ),
      spot(
        'dungeon',
        'furnishing',
        'oracle:reclvse.roomDiscovery',
        '탁자 위의 단서 · Discovery',
      ),
      spot('dungeon', 'chest', 'oracle:reclvse.roomLoot', '전리품 · Room loot'),
      spot('dungeon', 'trap', 'oracle:core.traps', '함정 · Traps'),
      spot('dungeon', 'passage', 'rule:reclvse.passage', '통로 · Passage'),
      spot('dungeon', 'light', 'oracle:reclvse.light', '등불 · Light'),
      spot(
        'dungeon',
        'remains',
        'oracle:reclvse.dressing',
        '동물의 유해 · Room dressing',
      ),
      spot(
        'dungeon',
        'sounds',
        'oracle:reclvse.sounds',
        '귀 기울이기 · Sounds',
      ),
      spot(
        'dungeon',
        'room-odour',
        'oracle:reclvse.smells',
        '방 안의 냄새 · Room smells',
      ),
    ],
    supportGroups: [
      {
        id: 'dungeon-story',
        title: '이 던전은 무엇이었나',
        description: '지도에 보이지 않는 기원과 현재의 사정을 정합니다.',
        references: [
          support(
            'dungeon',
            'origin',
            'oracle:reclvse.dungeonOrigin',
            '기원 · Origin',
          ),
          support(
            'dungeon',
            'purpose',
            'oracle:reclvse.dungeonPurposeThen',
            '이전 / 현재의 목적 · Purpose then / now',
          ),
          support(
            'dungeon',
            'theme',
            'oracle:reclvse.dungeonTheme',
            '주제 · Theme',
          ),
          support(
            'dungeon',
            'condition',
            'oracle:reclvse.dungeonCondition',
            '현재 상태 · Condition',
          ),
          support(
            'dungeon',
            'inhabitants',
            'oracle:reclvse.dungeonInhabitants',
            '현재 거주자 · Inhabitants',
          ),
          support(
            'dungeon',
            'motive',
            'oracle:reclvse.dungeonMotive',
            '안에서 추구하는 것 · Motive',
          ),
          support(
            'dungeon',
            'mythic-descriptor',
            'oracle:mythic2.meaning.dungeon-descriptors',
            '던전 묘사어 · Mythic 2e',
          ),
          support(
            'dungeon',
            'human-remains',
            'oracle:core.corpsePlundering',
            '사람의 시체를 발견했다면 · Corpse plundering',
          ),
        ],
      },
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
      spot(
        'city',
        'gate-signs',
        'oracle:reclvse.city_signs_before_entering',
        '성문 앞 징후 · City signs',
      ),
      spot('city', 'street', 'procedure:aitc.street', '거리 · Street'),
      spot(
        'city',
        'cobbles',
        'oracle:reclvse.street_surface',
        '거리의 바닥 · Street surface',
      ),
      spot(
        'city',
        'alley-hazard',
        'oracle:reclvse.hazard',
        '위험한 골목 · Street hazard',
      ),
      spot(
        'city',
        'chimney-smell',
        'oracle:reclvse.neighborhood_smell',
        '동네의 냄새 · Neighborhood smell',
      ),
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
    supportGroups: [
      {
        id: 'city-story',
        title: '도시의 과거와 지금',
        description: '거리로 들어가기 전에 도시의 성격을 잡습니다.',
        references: [
          support(
            'city',
            'origin',
            'oracle:reclvse.city_origin',
            '도시의 기원 · City origin',
          ),
          support(
            'city',
            'purpose-then',
            'oracle:reclvse.city_purpose_then',
            '이전의 목적 · Purpose then',
          ),
          support(
            'city',
            'purpose-now',
            'oracle:reclvse.city_purpose_now',
            '지금의 목적 · Purpose now',
          ),
          support(
            'city',
            'mood',
            'oracle:reclvse.city_mood',
            '도시의 분위기 · Mood',
          ),
          support(
            'city',
            'condition',
            'oracle:reclvse.city_condition',
            '도시의 상태 · Condition',
          ),
          support(
            'city',
            'architecture',
            'oracle:reclvse.city_architecture',
            '건축 양식 · Architecture',
          ),
          support(
            'city',
            'threats',
            'oracle:reclvse.city_threats',
            '도시를 위협하는 것 · Threats',
          ),
          support(
            'city',
            'mythic-descriptor',
            'oracle:mythic2.meaning.city-descriptors',
            '도시 묘사어 · Mythic 2e',
          ),
        ],
      },
      {
        id: 'city-neighborhood',
        title: '동네의 속사정',
        description: '건물 사이에 흐르는 분위기와 갈등을 더합니다.',
        references: [
          support(
            'city',
            'neighborhood-type',
            'oracle:reclvse.neighborhood_type',
            '동네의 종류 · Type',
          ),
          support(
            'city',
            'neighborhood-mood',
            'oracle:reclvse.neighborhood_mood',
            '동네의 분위기 · Mood',
          ),
          support(
            'city',
            'neighborhood-activity',
            'oracle:reclvse.neighborhood_activity',
            '동네의 활동 · Activity',
          ),
          support(
            'city',
            'neighborhood-outsiders',
            'oracle:reclvse.neighborhood_attitude_toward_outsiders',
            '외지인을 보는 태도 · Outsiders',
          ),
          support(
            'city',
            'neighborhood-problem',
            'oracle:reclvse.neighborhood_problem',
            '동네의 문제 · Problem',
          ),
          support(
            'city',
            'neighborhood-secret',
            'oracle:reclvse.neighborhood_secret',
            '동네의 비밀 · Secret',
          ),
        ],
      },
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
        'roadside',
        'oracle:feretory.roadEvent',
        '길가의 사건 · Road event',
      ),
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
        'river',
        'oracle:reclvse.water_landmarks',
        '물가의 지형 · Water landmarks',
      ),
      spot(
        'wilderness',
        'threat-signs',
        'oracle:reclvse.threat_signs',
        '위협의 흔적 · Threat signs',
      ),
      spot(
        'wilderness',
        'village',
        'oracle:feretory.village',
        '마을 · Village',
      ),
      spot(
        'wilderness',
        'remains',
        'oracle:reclvse.remains_ruins',
        '동물의 유해 · Remains & ruins',
      ),
      spot(
        'wilderness',
        'distances',
        'rule:feretory.travel-distances',
        '이정표 · Travel distances',
      ),
    ],
    supportGroups: [
      {
        id: 'journey-landscape',
        title: '지평선 너머',
        description: '여정을 둘러싼 지형과 지명의 맥락을 더합니다.',
        references: [
          support(
            'wilderness',
            'region-name',
            'oracle:reclvse.region_names',
            '지역의 이름 · Region name',
          ),
          support(
            'wilderness',
            'landmark-presence',
            'oracle:reclvse.landmark_presence',
            '랜드마크의 존재 · Landmark presence',
          ),
          support(
            'wilderness',
            'natural-landmark',
            'oracle:reclvse.major_natural_landmarks',
            '큰 자연 지형 · Natural landmark',
          ),
          support(
            'wilderness',
            'ruinous-landmark',
            'oracle:reclvse.ruinous_landmarks',
            '폐허가 된 지형 · Ruinous landmark',
          ),
          support(
            'wilderness',
            'landmark-purpose',
            'oracle:reclvse.landmark_purpose',
            '지형의 용도 · Landmark purpose',
          ),
          support(
            'wilderness',
            'landmark-condition',
            'oracle:reclvse.landmark_condition',
            '지형의 상태 · Landmark condition',
          ),
          support(
            'wilderness',
            'mythic-descriptor',
            'oracle:mythic2.meaning.terrain-descriptors',
            '지형 묘사어 · Mythic 2e',
          ),
        ],
      },
      {
        id: 'journey-omens',
        title: '길 위의 불길한 기운',
        description: '사건의 조짐과 길에서 발견한 단서를 살펴봅니다.',
        references: [
          support(
            'wilderness',
            'strange-omens',
            'oracle:reclvse.strange_omens',
            '기이한 징조 · Strange omens',
          ),
          support(
            'wilderness',
            'weather-omens',
            'oracle:reclvse.weather_omen_signs',
            '날씨의 징조 · Weather omens',
          ),
          support(
            'wilderness',
            'natural-oddities',
            'oracle:reclvse.natural_oddities',
            '자연의 이상함 · Natural oddities',
          ),
          support(
            'wilderness',
            'lost-people',
            'oracle:reclvse.signs_of_lost_people',
            '실종자의 흔적 · Lost people',
          ),
          support(
            'wilderness',
            'human-remains',
            'oracle:core.corpsePlundering',
            '사람의 시체를 발견했다면 · Corpse plundering',
          ),
        ],
      },
    ],
  },
];

export function validateSpatialScenes(
  scenes: SpatialScene[],
  byId: Record<string, ReferenceEntry>,
): string[] {
  const problems: string[] = [],
    sceneIds = new Set<string>(),
    hotspotIds = new Set<string>(),
    supportIds = new Set<string>();
  for (const scene of scenes) {
    if (sceneIds.has(scene.id)) problems.push(`Duplicate scene: ${scene.id}`);
    sceneIds.add(scene.id);
    const targets = new Set<string>();
    const sceneReferenceIds = new Set<string>();
    for (const hotspot of scene.hotspots) {
      if (hotspotIds.has(hotspot.id))
        problems.push(`Duplicate hotspot: ${hotspot.id}`);
      hotspotIds.add(hotspot.id);
      if (targets.has(hotspot.visualTarget))
        problems.push(`Shadowed artwork: ${scene.id}/${hotspot.visualTarget}`);
      targets.add(hotspot.visualTarget);
      sceneReferenceIds.add(hotspot.referenceId);
      if (!byId[hotspot.referenceId])
        problems.push(
          `Missing reference: ${hotspot.id} → ${hotspot.referenceId}`,
        );
      if (!hotspot.accessibleLabel.trim())
        problems.push(`Missing accessible label: ${hotspot.id}`);
    }
    const groupIds = new Set<string>();
    for (const group of scene.supportGroups) {
      if (groupIds.has(group.id))
        problems.push(`Duplicate support group: ${scene.id}/${group.id}`);
      groupIds.add(group.id);
      if (!group.title.trim())
        problems.push(`Missing support group title: ${scene.id}/${group.id}`);
      for (const item of group.references) {
        if (supportIds.has(item.id))
          problems.push(`Duplicate support reference: ${item.id}`);
        supportIds.add(item.id);
        if (sceneReferenceIds.has(item.referenceId))
          problems.push(
            `Repeated scene reference: ${scene.id}/${item.referenceId}`,
          );
        sceneReferenceIds.add(item.referenceId);
        if (!byId[item.referenceId])
          problems.push(
            `Missing support reference: ${item.id} → ${item.referenceId}`,
          );
        if (!item.label.trim())
          problems.push(`Missing support label: ${item.id}`);
      }
    }
  }
  return problems;
}

/** The same inspect operation used by Search; selecting artwork never rolls. */
export function inspectSpatialReference(
  referenceId: string,
  desk: {
    byId: Record<string, ReferenceEntry>;
    activate: (id: string, roll?: boolean) => void;
  },
) {
  const entry = desk.byId[referenceId];
  if (!entry) throw new Error(`Missing spatial reference: ${referenceId}`);
  desk.activate(entry.id, false);
}
export function inspectSpatialHotspot(
  hotspot: SpatialHotspot,
  desk: Parameters<typeof inspectSpatialReference>[1],
) {
  inspectSpatialReference(hotspot.referenceId, desk);
}

export const normalizeSpatialSceneId = (raw: unknown): string =>
  SPATIAL_SCENES.some((scene) => scene.id === raw) ? String(raw) : 'dungeon';
