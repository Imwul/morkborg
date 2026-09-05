/** Canonical references grouped by the subject being resolved, not by navigation destination. */
export const DUNGEON_REFERENCE_TOPICS = [
  {
    title: '입구 · 건물 · 재질 · 소리',
    ids: [
      'oracle:sd.building.size',
      'oracle:sd.building.form',
      'oracle:sd.building.material',
      'procedure:sd.material',
      'procedure:sd.sound',
      'oracle:sd.odoursTastes',
    ],
    description:
      '입구의 기본 묘사는 던전 개요에 보관됩니다. 필요한 감각·건물 묘사만 덧붙이세요.',
  },
  {
    title: '방 · 내용물 · 보물',
    ids: [
      'procedure:sd.room-description',
      'oracle:sd.room.contents',
      'oracle:sd.usefulItems',
      'oracle:core.treasures',
      'oracle:core.corpsePlundering',
    ],
    description:
      '크롤의 일반 방은 묘사·내용물·현재 발견 수에 맞는 출구를 함께 굴립니다. 여기서는 필요한 부분만 참고하세요.',
  },
  {
    title: '위험 · 애매한 Weak · 시간 끌기',
    ids: [
      'oracle:depths.weakHitConsequences',
      'oracle:depths.danger',
      'rule:depths.time-noise',
      'rule:depths.locked-doors',
    ],
    description:
      'Weak 결과가 불명확할 때만 결과표를 사용합니다. 위험·시간 끌기는 별도 조건이 발생했을 때 처리하세요.',
  },
  {
    title: '함정 · 발견 · 해제',
    ids: [
      'rule:depths.traps',
      'oracle:depths.traps.regular',
      'oracle:depths.traps.special',
    ],
    description:
      '함정 발견/해제 절차와 실제 함정의 효과를 한곳에서 확인합니다.',
  },
  {
    title: '탐색 · 도망 · 휴식 · 재보급',
    ids: [
      'rule:sd.search-move',
      'oracle:sd.search.strong',
      'oracle:sd.search.weak',
      'rule:sd.flee-combat',
      'rule:sd.camping-move',
      'rule:sd.resupply',
    ],
  },
  {
    title: '조우 · NPC · 반응',
    ids: [
      'rule:depths.enemy-detection',
      'oracle:core.reaction',
      'rule:core.reaction-morale',
      'procedure:workbench.npc',
      'oracle:sd.npc.disposition',
      'oracle:sd.npc.profession',
    ],
  },
] as const;
