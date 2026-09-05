import type { ReferenceContext } from './references';

export interface PlayReferenceRuleSeed {
  id: string;
  title: string;
  summary: string;
  book: string;
  pages: number[];
  printedPage: number | string;
  contexts: ReferenceContext[];
  oracles?: string[];
  seeFullRule?: boolean;
}

/** Short, source-specific reminders. These do not change character or campaign rules. */
export const PLAY_REFERENCE_RULES: PlayReferenceRuleSeed[] = [
  {
    id: 'core.tests',
    title: 'Core Tests · 능력 판정',
    summary:
      'd20 + 능력 보정이 DR 이상이면 성공합니다. 보통 DR12. 생물은 능력 보정 없이 d20만 굴립니다.',
    book: 'core',
    pages: [28],
    printedPage: 28,
    contexts: ['character'],
  },
  {
    id: 'core.carrying',
    title: 'Carrying Capacity · 운반과 과적',
    summary:
      '보통 크기 물건은 Strength + 8개까지. 넘으면 Strength·Agility 판정 DR +2, 최대 수량은 기본 한도의 두 배입니다. 큰 물건의 처리는 원문과 상황을 확인하세요.',
    book: 'core',
    pages: [28],
    printedPage: 28,
    contexts: ['character', 'travel'],
    seeFullRule: true,
  },
  {
    id: 'core.violence',
    title: 'Core Combat · 선공과 공격·방어',
    summary:
      '선공 d6: 1–3 적, 4–6 PC. 개별 선공은 Agility + d6. PC가 공격과 방어를 굴립니다. 기본 DR12: 근접 Strength, 원거리 Presence, 방어 Agility. 적은 별도 지시가 없으면 라운드마다 한 번 공격합니다.',
    book: 'core',
    pages: [30],
    printedPage: 30,
    contexts: ['character', 'monster'],
    oracles: ['core.reaction', 'core.failedMorale'],
  },
  {
    id: 'core.crit-fumble',
    title: 'Crit / Fumble · 전투의 20과 1',
    summary:
      '자연 20: 공격 피해 두 배·대상 보호 1단계 감소, 방어는 무료 공격. 자연 1: 공격 무기 파손/분실, 방어 피해 두 배·갑옷 1단계 감소. 손상되어도 능력 판정 불이익은 그대로이며 1단계 미만은 수리 불가입니다.',
    book: 'core',
    pages: [31],
    printedPage: 31,
    contexts: ['character', 'monster'],
    seeFullRule: true,
  },
  {
    id: 'core.armor-shield',
    title: 'Armor / Shield · 방어구와 방패',
    summary:
      '경갑/중갑/중장갑 피해 감소 d2/d4/d6. 중갑은 Agility DR +2, 중장갑은 +4(방어는 +2). 방패는 피해 −1, 또는 부수며 한 공격의 피해 전부 무시. 양손 무기나 중갑·중장갑을 쓰면 두루마리는 작동하지 않습니다.',
    book: 'core',
    pages: [23],
    printedPage: 23,
    contexts: ['character'],
    oracles: ['core.armor'],
    seeFullRule: true,
  },
  {
    id: 'core.casting',
    title: 'Using Powers · 권능 사용 판정',
    summary:
      '두루마리는 Presence DR12. 성공하면 권능 발동·일일 사용 횟수 1 감소. 실패하면 d2 HP 손실과 1시간 현기증; 그동안 권능은 최악의 방식으로 실패합니다. Crit/Fumble의 효과는 GM이 정하며 재앙 표는 선택 사항입니다.',
    book: 'core',
    pages: [34],
    printedPage: 34,
    contexts: ['character'],
    oracles: ['core.arcaneCatastrophes', 'core.sacred', 'core.unclean'],
    seeFullRule: true,
  },
  {
    id: 'feretory.hunting-procedure',
    title: 'Eat Prey Kill · 사냥 판정과 식량',
    summary:
      'Presence 판정 성공 뒤 지역 사냥 표 d6. 실패하면 사냥 사고를 고려합니다. 괄호에 수량 주사위가 있으면 따로 굴리고, 없으면 보통 한 마리. 식량은 HP만큼 또는 먹을 수 있는 양에 따라 판단합니다.',
    book: 'feretory',
    pages: [12],
    printedPage: 10,
    contexts: ['travel', 'monster'],
    oracles: ['feretory.huntingMishaps', 'feretory.bellyOfBeast'],
    seeFullRule: true,
  },
  {
    id: 'sd.general-move',
    title: 'SD General Move · 일반 모험 판정',
    summary:
      '행동에 맞는 능력과 DR을 정하고 두 d20에 능력 보정을 더해 각각 비교합니다. 두 성공은 Strong, 하나는 대가가 있는 Weak, 둘 다 실패하면 Fail. 행운 판정에 현재 Omens를 쓸 수 있으며 이 판정 자체로 Omens를 소비하지 않습니다.',
    book: 'sd',
    pages: [7],
    printedPage: 5,
    contexts: ['character', 'dungeon'],
    seeFullRule: true,
  },
  {
    id: 'sd.flee-combat',
    title: 'SD Flee · 전투 이탈',
    summary:
      '두 d20 + Agility를 DR(11 + 적 수)와 각각 비교합니다. Strong은 탈출. Weak는 기회공격에 방어한 뒤 피해 여부와 관계없이 탈출. Fail은 기회공격에 방어하고 전투를 계속합니다.',
    book: 'sd',
    pages: [8],
    printedPage: 6,
    contexts: ['character', 'monster'],
  },
  {
    id: 'sd.search-move',
    title: 'SD Searching · 물건 찾기',
    summary:
      '두 d20 + 현재 Omens, DR12. Strong과 Weak는 각각 해당 d4 결과 표를 사용합니다. Fail은 발견물 없이 위험이 드러납니다.',
    book: 'sd',
    pages: [8],
    printedPage: 6,
    contexts: ['room', 'dungeon', 'city'],
    oracles: ['sd.search.strong', 'sd.search.weak', 'sd.usefulItems'],
  },
  {
    id: 'sd.camping-move',
    title: 'SD Camping · 숨 돌리기와 야영',
    summary:
      '두 d20 + Presence: 숨 돌리기 DR9, 야영 DR12. Strong 회복 d4/d6 HP, Weak d2/d4 HP. 수면 시 식량 1: Strong은 Omens 재굴림·Powers 회복, Weak는 각각 1 회복. Fail의 사건과 다음 휴식 시도는 원문을 확인하세요.',
    book: 'sd',
    pages: [8],
    printedPage: 6,
    contexts: ['character', 'travel'],
    seeFullRule: true,
  },
  {
    id: 'sd.travel-day',
    title: 'SD Travel Day · 하루 여행 순서',
    summary:
      '새벽 Calendar·날씨 뒤 이동 또는 보급을 고릅니다. 길/사건이나 Foraging → 사건 해결 → Camping. 보급한 날은 이동일을 줄이지 않습니다. 남은 이동일을 모두 지운 다음 날 도착합니다.',
    book: 'sd',
    pages: [17],
    printedPage: 15,
    contexts: ['travel'],
    oracles: [
      'core.weather',
      'feretory.roadType',
      'feretory.roadEvent',
      'feretory.forage',
    ],
    seeFullRule: true,
  },
  {
    id: 'sd.leaving-road',
    title: 'SD Leaving the Road · 길을 잃는 판정',
    summary:
      '동물 길이나 망가진 길에서는 1d20 + Presence 또는 Omens, DR10으로 이탈을 피합니다. 이탈하면 Leaving the Road 표의 상황을 해결하고 돌아옵니다. 이 날도 이동일로 셉니다.',
    book: 'sd',
    pages: [17],
    printedPage: 15,
    contexts: ['travel'],
    oracles: ['feretory.leaveRoad'],
  },
  {
    id: 'depths.hex-travel',
    title: 'Depths Travel · 헥스와 지역 조우',
    summary:
      '헥스 진입 시 d20이 지역 Encounter Level 이하이면 조우. Encounter 표 뒤 필요한 지역 Trait·Feature·Discovery와 생물/NPC를 정합니다. 그룹 반응은 함께 굴리고 몬스터 반응에는 −3. 각 추가 굴림은 선택 사항입니다.',
    book: 'depths',
    pages: [25],
    printedPage: 22,
    contexts: ['travel', 'monster'],
    oracles: [
      'depths.travel.encounter',
      'depths.travel.storyConnection',
      'core.reaction',
    ],
    seeFullRule: true,
  },
  {
    id: 'heretic.feat-eligibility',
    title: 'HERETIC Unheroic Feats · 재주 획득 조건',
    summary:
      '선택 클래스를 쓰지 않는 인물은 성장할 때 재주를 얻는 방식을 선택할 수 있습니다. 최대 3개. 무작위·선택·이야기 성취 중 획득 방식은 GM과 정합니다.',
    book: 'heretic',
    pages: [6],
    printedPage: 4,
    contexts: ['character'],
    oracles: ['heretic.unheroicFeats'],
    seeFullRule: true,
  },
  {
    id: 'reclvse.move-test',
    title: 'RECLVSE Moves · 기본 판정',
    summary:
      '이 책의 기본 Move는 두 d20 + 능력치를 각각 DR12와 비교합니다. 두 성공 Strong, 하나 Weak, 없음 Miss. DR10은 선택적 난이도입니다. 전투장의 개별 공격 지시는 따로 확인하세요.',
    book: 'reclvse',
    pages: [11],
    printedPage: 11,
    contexts: ['character', 'dungeon'],
    seeFullRule: true,
  },
  {
    id: 'reclvse.combat',
    title: 'RECLVSE Combat · 전투장 참조',
    summary:
      '전투장에 적힌 공격은 1d20 + Strength(근접) / Presence(원거리), 보통 DR12입니다. 명중 피해에서 대상 방어구를 뺍니다. 선공 d6는 1–3 적, 4–6 자신; 완전히 기습하면 자신이 선공합니다.',
    book: 'reclvse',
    pages: [41],
    printedPage: 41,
    contexts: ['character', 'monster'],
    seeFullRule: true,
  },
  {
    id: 'reclvse.road-travel',
    title: 'RECLVSE Travel the Road · 길 이동',
    summary:
      '길을 따라 이동할 때 이 책의 Agility Move를 사용합니다. Strong은 남은 여행일 −1, Weak는 −1과 문제 상황. Miss는 Hold Your Bearing을 따르며 그 판정의 Strong 결과는 제외합니다.',
    book: 'reclvse',
    pages: [49],
    printedPage: 49,
    contexts: ['travel'],
    seeFullRule: true,
  },
  {
    id: 'reclvse.delve',
    title: 'RECLVSE Delve the Depths · 새 공간 탐색',
    summary:
      '새 공간은 Agility Move 뒤 Room Generation을 참조합니다. Strong은 즉각적인 위험 없이 진입, Weak는 문제 상황을 추가, Miss는 위협·함정·생물·붕괴가 즉시 발생합니다.',
    book: 'reclvse',
    pages: [67, 88],
    printedPage: '67, 88',
    contexts: ['dungeon', 'room'],
    oracles: [
      'reclvse.roomEncounter',
      'reclvse.roomHazard',
      'reclvse.roomDiscovery',
    ],
    seeFullRule: true,
  },
  {
    id: 'mythic2.fate-question',
    title: 'Mythic Fate Chart · 예·아니오 질문',
    summary:
      '질문·Odds·현재 Chaos Factor를 정하고 Fate Chart의 값을 찾습니다. d100이 중심값 이하면 Yes, 초과하면 No. 양옆 수치는 Exceptional 경계입니다. 숫자 대신 X인 경계는 Exceptional이 불가능합니다.',
    book: 'mythic2',
    pages: [20, 24],
    printedPage: '19, 23',
    contexts: [],
    oracles: ['mythic2.random-event-focus-table'],
    seeFullRule: true,
  },
  {
    id: 'mythic2.scene-test',
    title: 'Mythic Scene Test · 예상 장면 확인',
    summary:
      '장면을 시작하기 전 d10: Chaos Factor 초과는 예상대로. 이하의 홀수는 Altered, 이하의 짝수는 Interrupt입니다. 장면의 구체적인 변화는 직접 해석합니다.',
    book: 'mythic2',
    pages: [68],
    printedPage: 67,
    contexts: [],
    oracles: [
      'mythic2.scene-adjustment-table',
      'mythic2.random-event-focus-table',
    ],
    seeFullRule: true,
  },
];
