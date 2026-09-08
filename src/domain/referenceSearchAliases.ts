/** Curated play intents. These are app navigation metadata, never source wording. */
export const REFERENCE_SEARCH_ALIASES: Record<
  string,
  { ko: string[]; en: string[] }
> = {
  'rule:core.broken': {
    ko: ['피 0', 'HP 0', '내 HP가 0', '죽음', '부상', '체력 0'],
    en: ['0 HP', 'zero HP', 'HP 0', 'I reached 0 HP', 'death', 'injury'],
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
    ko: ['도망', '도주', '도망가고 싶어'],
    en: ['flee', 'fleeing', 'escape', 'run away'],
  },
  'rule:core.rest': {
    ko: ['휴식', '회복', '치료', '휴식하면 얼마나 회복'],
    en: ['rest', 'healing', 'heal', 'recover', 'sleep'],
  },
  'rule:core.casting': {
    ko: ['마법', '파워', '권능', '스크롤', '두루마리', '마법 실패'],
    en: ['power', 'powers', 'scroll', 'scrolls', 'casting', 'spell failure'],
  },
  'rule:core.carrying': {
    ko: ['짐', '인벤토리', '과적', '짐 얼마나 들 수 있어'],
    en: ['carrying', 'inventory', 'encumbrance', 'carry limit'],
  },
  'rule:core.reaction-morale': {
    ko: ['사기', '몬스터가 도망가나'],
    en: ['morale', 'monster morale'],
  },
  'oracle:core.reaction': {
    ko: ['반응', 'NPC가 나를 좋아하나'],
    en: ['reaction', 'NPC reaction'],
  },
  'oracle:core.corpsePlundering': {
    ko: ['시체', '시체 뒤지기'],
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
