/** Curated play intents. These are app navigation metadata, never source wording. */
export const REFERENCE_SEARCH_ALIASES: Record<
  string,
  { ko: string[]; en: string[] }
> = {
  'rule:sd.leaving-road': {
    ko: ['동물 흔적', '흔적', '망가진 도로', '망가진 길'],
    en: ['Animal Tracks', 'Tracks', 'Broken Road'],
  },
  'oracle:core.weather': {
    ko: ['날씨', '오늘 날씨', '오늘의 날씨', '비가 오나'],
    en: ['weather', 'today weather'],
  },
  'oracle:feretory.roadType': {
    ko: ['길 상태', '도로 상태', '길의 상태', '망가진 도로 상태'],
    en: ['road condition', 'road conditions', 'road type'],
  },
  'oracle:core.miseries': {
    ko: ['재앙', '종말'],
    en: ['Disaster', 'Miseries', 'Misery'],
  },
  'rule:core.outcasts': {
    ko: ['고용', '충성', '추종자'],
    en: ['Outcast', 'Outcasts', 'loyalty', 'hire', 'hireling', 'followers'],
  },
  'rule:core.tests': {
    ko: ['난이도', '어려움', '판정 난이도'],
    en: ['DR', 'difficulty', 'difficulty scale', 'test difficulty'],
  },
  'rule:core.round': {
    ko: ['턴', '라운드', '몇 미터', '전투 이동', '라운드 시간'],
    en: [
      'round',
      'round duration',
      'movement',
      'combat movement',
      'turn duration',
    ],
  },
  'rule:core.crit-fumble': {
    ko: ['치명타', '펌블', '치명적 실패'],
    en: ['critical', 'crit', 'criticals', 'fumble', 'natural 20', 'natural 1'],
  },
  'rule:core.improvement': {
    ko: ['성장', '능력치 성장'],
    en: ['get better', 'getting better', 'advancement'],
  },
  'rule:core.services': {
    ko: [
      '갑옷 수리',
      '수리 가격',
      '식사 가격',
      '숙박 가격',
      '화살 가격',
      '볼트 가격',
      '은화',
      '물가',
    ],
    en: [
      'services',
      'armor repair',
      'armour repair',
      'repair price',
      'steady meal',
      'night in hospice',
      'bribe guard',
      'bribe clerk',
      'bribe rabble',
      'drink price',
      '20 arrows',
      '10 bolts',
      'ammunition price',
      'silver',
      'purchase prices',
    ],
  },
  'rule:core.broken': {
    ko: [
      '피 0',
      'HP 0',
      '내 HP가 0',
      '죽음',
      '부상',
      '체력 0',
      '음수 HP',
      '마이너스 HP',
    ],
    en: [
      '0 HP',
      'zero HP',
      'HP 0',
      'I reached 0 HP',
      'death',
      'injury',
      'negative HP',
      'below zero',
    ],
  },
  'rule:core.armor-shield': {
    ko: ['갑옷', '방어구', '방패', '갑옷이 얼마나 막아'],
    en: ['armor', 'armour', 'shield', 'damage reduction'],
  },
  'rule:core.violence': {
    ko: ['방어', '선공', '공격'],
    en: ['defense', 'defence', 'initiative', 'attack'],
  },
  'rule:sd.flee-combat': {
    ko: ['SD 도망', 'SD 도주'],
    en: ['SD flee', 'Solitary Defilement flee'],
  },
  'rule:core.flee': {
    ko: ['도망', '도주', '도망가고 싶어'],
    en: ['flee', 'fleeing', 'escape', 'run away'],
  },
  'rule:core.rest': {
    ko: [
      '휴식',
      '회복',
      '치료',
      '휴식하면 얼마나 회복',
      '굶주림',
      '식량 없음',
      '갈증',
      '물 없음',
      '감염',
    ],
    en: [
      'rest',
      'healing',
      'heal',
      'recover',
      'sleep',
      'starvation',
      'hunger',
      'no food',
      'thirst',
      'no water',
      'food',
      'water',
      'infection',
    ],
  },
  'rule:core.casting': {
    ko: ['마법', '파워', '권능', '스크롤', '두루마리', '마법 실패'],
    en: ['power', 'powers', 'scroll', 'scrolls', 'casting', 'spell failure'],
  },
  'rule:core.carrying': {
    ko: ['짐', '인벤토리', '과적', '짐 얼마나 들 수 있어', '얼마나 들 수'],
    en: ['carrying', 'inventory', 'encumbrance', 'carry limit'],
  },
  'rule:core.reaction-morale': {
    ko: ['사기', '몬스터가 도망가나'],
    en: ['morale', 'monster morale'],
  },
  'oracle:core.reaction': {
    ko: [
      '반응',
      'NPC가 나를 좋아하나',
      'NPC가 나를 어떻게 대하는지',
      '얘가 우리를 공격하려나',
      '상대의 태도',
      '적대적인가',
    ],
    en: ['reaction', 'NPC reaction'],
  },
  'oracle:core.corpsePlundering': {
    ko: [
      '시체',
      '시체 뒤지기',
      '시체에서 뭐가 나오는 표',
      '시체 뒤져본다',
      '시체를 뒤진다',
      '시체 전리품',
    ],
    en: ['corpse', 'corpse loot'],
  },
  'oracle:core.treasures': { ko: ['보물', '전리품'], en: ['treasure', 'loot'] },
  'rule:core.omens': {
    ko: ['징조', '오멘', '오멘 사용'],
    en: ['omens', 'omen', 'spend omen'],
  },
  'rule:sd.daily-misery': {
    ko: ['매일 저주', '저주 주사위', '불행 주사위'],
    en: ['SD misery', 'daily misery', 'misery die', 'misery progression'],
  },
  'rule:feretory.travel-distances': {
    ko: ['이동', '거리', '며칠', '여행 시간', '도로 여행'],
    en: ['road', 'journey', 'distance', 'travel time', 'road travel times'],
  },
  'procedure:city.crawl': {
    ko: ['도시 크롤', '도시 탐색'],
    en: ['city crawl', 'crawl city'],
  },
  'procedure:workbench.city': {
    ko: ['마이크로크롤', '마이크로 크롤'],
    en: ['microcrawl', 'micro-crawl'],
  },
  'procedure:city.directions': {
    ko: ['길 묻기', '방향 찾기'],
    en: ['directions', 'get directions', 'ask directions'],
  },
  'procedure:city.pray': { ko: ['기도'], en: ['pray', 'prayer'] },
  'procedure:city.stash': {
    ko: ['숨기기', '물건 숨기기', '숨긴 물건 회수'],
    en: ['stash', 'stash item', 'retrieve stash'],
  },
};
