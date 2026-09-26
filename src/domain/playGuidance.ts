/** App-authored Korean procedure summaries. The canonical source and dice engines stay authoritative. */
export interface PlayGuide {
  id: string;
  appliesTo: readonly string[];
  when: string;
  steps: readonly string[];
  outcomes: readonly [string, string][];
  source: string;
  sourceId: string;
}
export const PLAY_GUIDES: readonly PlayGuide[] = [
  {
    id: 'travel-day',
    appliesTo: ['rule:sd.travel-day'],
    when: '길을 따라 하루 이동할 때',
    steps: [
      '새벽에 Calendar와 날씨를 확인합니다. 이미 정한 날씨를 다시 굴리지 않습니다.',
      '이동하는 날은 길 d8 → 길의 사건 d20. 사건을 해결하고 야영합니다.',
    ],
    outcomes: [
      [
        '동물 길 · 망가진 길',
        '길을 잃는지 1d20 + Presence 또는 Omens, DR10. 실패할 때만 길 밖 표.',
      ],
      [
        '하루 마무리',
        '야영 뒤 이동일을 하나 지웁니다. 채집한 날이나 원문에서 전진하지 못한 날은 제외.',
      ],
      ['도착', '모든 이동일을 지운 다음 날 중에 목적지에 도착합니다.'],
    ],
    source: 'Sölitary Defilement · PDF 17 / 인쇄 15; FERETORY · PDF 7 / 인쇄 5',
    sourceId: 'rule:sd.travel-day',
  },
  {
    id: 'leaving-road',
    appliesTo: ['rule:sd.leaving-road'],
    when: '길을 벗어나거나 길을 잃었을 때',
    steps: [
      '동물 길·망가진 길에서 길을 유지하려면 아래 DR10 판정을 합니다.',
      '이미 길을 벗어났거나 일부러 나섰다면 회피 판정 없이 Leaving the Road d12를 엽니다.',
    ],
    outcomes: [
      ['성공', '길을 유지합니다. 새 이동 성공 판정은 추가하지 않습니다.'],
      [
        '실패',
        '길 밖 d12의 사건을 해결하고 도로로 돌아옵니다. SD에서는 이 날도 이동일입니다.',
      ],
      ['의도적 이탈', 'FERETORY는 길을 벗어나 반나절 뒤의 만남을 제시합니다.'],
    ],
    source: 'Sölitary Defilement · PDF 17 / 인쇄 15; FERETORY · PDF 9 / 인쇄 7',
    sourceId: 'rule:sd.leaving-road',
  },
  {
    id: 'resupply-travel',
    appliesTo: ['rule:sd.resupply'],
    when: '이동 대신 하루 채집할 때',
    steps: [
      '여행 중에는 Foraging d6를 한 번 굴립니다. 별도의 성공 판정을 먼저 하지 않습니다.',
      '결과의 수량·추가 판정·마을 표를 처리한 뒤 야영합니다.',
    ],
    outcomes: [
      [
        '채집 결과 2–3',
        '식량·물의 분량을 정합니다. 2라면 Presence DR12로 부패를 알아채는지 확인.',
      ],
      ['4 / 5–6', '4는 짐승을 죽인 뒤 식량. 5–6은 마을 d6.'],
      ['이동일', '하루를 채집에 썼으므로 남은 이동일을 줄이지 않습니다.'],
    ],
    source:
      'Sölitary Defilement · PDF 8, 17 / 인쇄 6, 15; FERETORY · PDF 8 / 인쇄 6',
    sourceId: 'rule:sd.resupply',
  },
  {
    id: 'dungeon-crawl',
    appliesTo: ['rule:sd.dungeonCrawling'],
    when: '다음 방으로 나아갈 때',
    steps: [
      '발견한 특별한 방 수와 Dungeon DR을 확인합니다.',
      '2d20 각각에 특별한 방 수를 더해 DR과 비교합니다.',
    ],
    outcomes: [
      [
        'Strong · 둘 성공',
        '준비한 다음 특별한 방. 네 번째가 절정. 이후 Strong은 Weak로 처리.',
      ],
      ['Weak · 하나 성공', '일반 방의 묘사·내용·출구를 정합니다.'],
      ['Miss · 둘 실패', '위험을 해결한 다음 방을 정합니다.'],
    ],
    source: 'Sölitary Defilement · PDF 9, 19',
    sourceId: 'rule:sd.dungeonCrawling',
  },
  {
    id: 'search',
    appliesTo: [
      'rule:sd.search-move',
      'oracle:sd.search.strong',
      'oracle:sd.search.weak',
    ],
    when: '방 안에서 쓸 만한 물건을 찾을 때',
    steps: [
      '2d20 각각에 현재 Omens를 더합니다. Omens를 소비하지 않습니다.',
      '각 결과를 DR12와 비교합니다.',
    ],
    outcomes: [
      ['Strong', 'Strong 발견표 d4.'],
      ['Weak', 'Weak 발견표 d4.'],
      ['Miss', '아무것도 찾지 못하고 위험이 드러납니다.'],
    ],
    source: 'Sölitary Defilement · PDF 8 / 인쇄 6',
    sourceId: 'rule:sd.search-move',
  },
  {
    id: 'rest',
    appliesTo: ['rule:sd.camping-move'],
    when: '숨을 돌리거나 하룻밤 쉴 때',
    steps: [
      '숨 돌리기 DR9 / 야영 DR12를 선택합니다.',
      '2d20 + Presence를 각각 비교합니다. 수면하면 식량 1개를 사용합니다.',
    ],
    outcomes: [
      [
        'Strong',
        '숨 돌리기 d4 / 야영 d6 HP. 수면 시 Omens 재굴림·Powers 회복.',
      ],
      [
        'Weak',
        '숨 돌리기 d2 / 야영 d4 HP. 방해받은 이유를 정하고, 수면 시 Omen·Power 각각 1 회복.',
      ],
      ['Miss', '휴식 대신 사건 발생. 해결한 뒤 다음 휴식은 Strong/Weak 50:50.'],
    ],
    source: 'Sölitary Defilement · PDF 8 / 인쇄 6',
    sourceId: 'rule:sd.camping-move',
  },
  {
    id: 'flee',
    appliesTo: ['rule:sd.flee-combat'],
    when: '전투에서 빠져나가려 할 때',
    steps: [
      '적 수를 세고 DR = 11 + 적 수로 정합니다.',
      '2d20 + Agility를 각각 비교합니다.',
    ],
    outcomes: [
      ['Strong', '탈출합니다.'],
      ['Weak', '기회 공격에 방어한 뒤 피해 여부와 무관하게 탈출.'],
      ['Miss', '기회 공격에 방어하고 전투를 계속합니다.'],
    ],
    source: 'Sölitary Defilement · PDF 8 / 인쇄 6',
    sourceId: 'rule:sd.flee-combat',
  },
  {
    id: 'city-crawl',
    appliesTo: ['procedure:city.crawl', 'oracle:aitc.city-crawl-failure'],
    when: '도시에서 목표를 찾아 이동할 때',
    steps: [
      'City DR을 정합니다. 달성한 목표 수는 보정으로 더하지 않습니다.',
      '2d20을 각각 비교합니다. Dérive는 DR10, 성공 두 등급 모두 새 거리입니다.',
    ],
    outcomes: [
      ['Strong', '다음 목표 도달. 모든 목표를 달성했다면 Weak로 처리.'],
      ['Weak', '새 거리의 모습과 내용을 정합니다.'],
      [
        'Miss',
        '이동을 막은 상황을 해결한 뒤 새 거리. d4 실패표는 상황을 정할 때 참고.',
      ],
    ],
    source: 'Alöne in the Crowd · PDF 6–7 / 인쇄 4–5',
    sourceId: 'procedure:city.crawl',
  },
  {
    id: 'directions',
    appliesTo: ['procedure:city.directions', 'oracle:aitc.directions-reaction'],
    when: '누군가에게 목적지로 가는 길을 물을 때',
    steps: [
      '2d20 + Presence를 각각 DR12와 비교합니다.',
      '도움을 받았다면 탐색 보정과 목적지 거리 중 하나를 선택합니다.',
    ],
    outcomes: [
      ['Strong', '다음 목표 탐색 +4 또는 다음 거리에 목적지.'],
      ['Weak', 'NPC 반응 2d6. 반응에 따라 도움 또는 적대 상황을 처리.'],
      ['Miss', '길을 모르거나 아무도 돕지 않습니다.'],
    ],
    source: 'Alöne in the Crowd · PDF 7 / 인쇄 5',
    sourceId: 'procedure:city.directions',
  },
  {
    id: 'pray',
    appliesTo: [
      'procedure:city.pray',
      'oracle:aitc.pray-strong',
      'oracle:aitc.pray-failure',
    ],
    when: '성소에서 기도할 때',
    steps: [
      '장소 보정: 석상 0 / 사당·무덤 +1 / 예배당·교회 +2 / 대성당 +3.',
      '2d20 + Presence + 장소 보정을 각각 DR14와 비교합니다.',
    ],
    outcomes: [
      ['Strong', '축복 d4.'],
      ['Weak', '아무 일도 일어나지 않습니다.'],
      ['Miss', '응답 d6. 모시는 존재에 맞춰 해석합니다.'],
    ],
    source: 'Alöne in the Crowd · PDF 7 / 인쇄 5',
    sourceId: 'procedure:city.pray',
  },
  {
    id: 'stash',
    appliesTo: ['procedure:city.stash', 'oracle:aitc.stash-weak'],
    when: '숨겨둔 물건을 찾으러 돌아왔을 때',
    steps: [
      '숨길 때가 아니라 회수할 때 판정합니다.',
      '2d20 + Omens를 각각 DR10과 비교합니다.',
    ],
    outcomes: [
      ['Strong', '물건이 그대로 있습니다.'],
      ['Weak', '손상·도난 상태 d6.'],
      ['Miss', '사라졌거나 흩어지고 부서졌습니다.'],
    ],
    source: 'Alöne in the Crowd · PDF 8 / 인쇄 6',
    sourceId: 'procedure:city.stash',
  },
];
export const playGuideFor = (id: string) =>
  PLAY_GUIDES.find((g) => g.appliesTo.includes(id));
export interface PlayAction {
  referenceId: string;
  label: string;
  hint: string;
  near?: readonly string[];
}
export const SCENE_PLAY_ACTIONS: Record<string, readonly PlayAction[]> = {
  wilderness: [
    {
      referenceId: 'rule:sd.travel-day',
      label: '이동하기',
      hint: '길 d8 · 사건 d20 · 다음 처리',
      near: ['road', 'roadside', 'tracks', 'distances'],
    },
    {
      referenceId: 'rule:sd.leaving-road',
      label: '길 벗어나기',
      hint: '길 이탈 판정 / 이미 벗어났다면 d12',
      near: ['offroad', 'remains', 'threat-signs'],
    },
    {
      referenceId: 'rule:sd.resupply',
      label: '채집하기',
      hint: '하루 채집 d6 · 이동일 유지',
      near: ['forage', 'river', 'village'],
    },
    {
      referenceId: 'rule:sd.camping-move',
      label: '야영하기',
      hint: '2d20 + Presence · DR12',
      near: ['camp'],
    },
  ],
  dungeon: [
    {
      referenceId: 'rule:sd.dungeonCrawling',
      label: '다음 방으로',
      hint: '2d20 · Dungeon DR',
      near: ['entrance', 'threshold', 'door', 'passage'],
    },
    {
      referenceId: 'rule:sd.search-move',
      label: '물건 찾기',
      hint: '2d20 + Omens · DR12',
      near: ['contents', 'furnishing', 'chest', 'remains'],
    },
    {
      referenceId: 'rule:sd.camping-move',
      label: '숨 돌리기 · 야영',
      hint: '2d20 + Presence · DR9/12',
    },
    {
      referenceId: 'rule:sd.flee-combat',
      label: '전투에서 도망',
      hint: '2d20 + Agility · 적 수',
    },
  ],
  city: [
    {
      referenceId: 'procedure:city.crawl',
      label: '목표를 찾아 이동',
      hint: '2d20 · City DR',
      near: ['street', 'cobbles', 'gate', 'alley-hazard'],
    },
    {
      referenceId: 'procedure:city.directions',
      label: '길 물어보기',
      hint: '2d20 + Presence · DR12',
      near: ['directions', 'crowd', 'tavern', 'merchant'],
    },
    {
      referenceId: 'procedure:city.pray',
      label: '기도하기',
      hint: '2d20 + Presence · DR14',
      near: ['shrine'],
    },
    {
      referenceId: 'procedure:city.stash',
      label: '숨긴 물건 회수',
      hint: '2d20 + Omens · DR10',
    },
  ],
};
/** Contextual suggestions are UI navigation, not new canonical semantic edges. */
export function scenePlayActions(
  scene: string,
  role?: string,
): readonly PlayAction[] {
  return [...(SCENE_PLAY_ACTIONS[scene] ?? [])].sort(
    (a, b) =>
      Number(b.near?.includes(role ?? '') ?? false) -
      Number(a.near?.includes(role ?? '') ?? false),
  );
}
export interface FollowThrough {
  note: string;
  links: { id: string; label: string }[];
}
export function crawlFollowThrough(
  outcome: 'strong' | 'weak' | 'miss',
): FollowThrough {
  if (outcome === 'strong')
    return {
      note: '준비한 다음 특별한 방을 펼치세요. 발견 수와 진행은 노트에 적습니다.',
      links: [],
    };
  if (outcome === 'weak')
    return {
      note: '일반 방을 묘사하고 내용을 정하세요. Weak 자체에 별도 대가를 자동으로 붙이지 않습니다.',
      links: [
        { id: 'procedure:sd.room-description', label: '일반 방 묘사 열기' },
      ],
    };
  return {
    note: '드러난 위험부터 해결한 뒤 방을 정하세요. 아래 표는 위험을 구체화할 때 참고합니다.',
    links: [
      { id: 'oracle:depths.danger', label: '위험의 단서 열기' },
      {
        id: 'procedure:sd.room-description',
        label: '위험 해결 후 방 묘사 열기',
      },
    ],
  };
}
