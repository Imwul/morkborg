import type { GuidedRoll } from './guidedRoll';
export interface RuleCondition {
  id: string;
  label: string;
  condition: string;
  test: string;
  effect: string;
  references: readonly string[];
  roll?: GuidedRoll;
}
export interface RuleTopic {
  id: string;
  label: string;
  conditions: readonly RuleCondition[];
}
/** App-authored short summaries, grounded in Core and SD; canonical English remains in the reader. */
export const CONDITIONAL_RULES: readonly RuleTopic[] = [
  {
    id: 'powers',
    label: '권능',
    conditions: [
      {
        id: 'morning',
        label: '아침의 사용 횟수',
        condition: '새 아침',
        test: 'Presence + d4',
        effect:
          '그날 권능 사용 횟수를 정합니다. 가진 두루마리 중에서 사용합니다.',
        references: ['rule:core.casting'],
        roll: { kind: 'quantity', dice: 'd4', modifierLabel: 'Presence' },
      },
      {
        id: 'equipment',
        label: '장비 제한',
        condition: '두루마리를 쓰기 전',
        test: '장비 확인 · 굴림 없음',
        effect:
          '양손 무기, 중갑·중장갑 상태에서는 두루마리가 작동하지 않습니다. Heretical Priest는 중갑에서 권능 사용 가능. 이 예외가 양손 무기·중장갑 제한을 없애지는 않습니다.',
        references: ['rule:core.armor-shield', 'rule:core.casting'],
      },
      {
        id: 'casting',
        label: '두루마리 읽기',
        condition: '사용 횟수가 있고 장비 제한에 걸리지 않을 때',
        test: '1d20 + Presence ≥ DR12',
        effect:
          '성공: 발동, 사용 횟수 −1. 실패: 발동하지 않고 HP d2 손실, 1시간 어지러움. SD에서도 권능은 d20 하나입니다.',
        references: ['rule:core.casting', 'rule:sd.powers'],
        roll: { kind: 'test', dice: 'd20', ability: 'Presence', dr: 12 },
      },
      {
        id: 'failure',
        label: '시전 실패',
        condition: '권능 시전에 실패했을 때',
        test: 'd2 · 실패 피해',
        effect:
          'HP를 이만큼 잃습니다. 이후 1시간 어지러우며, 그동안 권능은 최악의 방식으로 실패합니다.',
        references: ['rule:core.casting'],
        roll: { kind: 'quantity', dice: 'd2' },
      },
      {
        id: 'dizzy',
        label: '아직 어지러운 상태',
        condition: '실패 후 1시간 이내',
        test: '성공 여부를 다시 판정하지 않음',
        effect:
          '권능은 최악의 방식으로 실패합니다. 무엇이 일어나는지는 상황에 맞춰 정합니다.',
        references: ['rule:core.casting'],
      },
      {
        id: 'critical',
        label: '시전의 치명타·실수',
        condition: '권능 판정의 자연 20 또는 1',
        test: '효과는 GM 판단',
        effect:
          'Core의 Arcane Catastrophes는 선택 표입니다. 전투의 피해 2배·방어구 손상을 시전에 자동 적용하지 않습니다. SD의 해석은 별도 원문을 확인하세요.',
        references: [
          'rule:core.casting',
          'oracle:core.arcaneCatastrophes',
          'rule:sd.powers',
        ],
      },
    ],
  },
  {
    id: 'rest',
    label: '휴식',
    conditions: [
      {
        id: 'breath',
        label: 'Core · 잠깐 숨 돌리기',
        condition:
          '음식·물이 있고 감염되지 않은 상태에서 숨을 돌리며 마실 것을 섭취',
        test: '회복량 d4 · 성공 판정 없음',
        effect:
          'HP d4 회복. SD 휴식 Move를 선택했다면 아래 Core 회복을 중복 적용하지 않습니다.',
        references: ['rule:core.rest', 'rule:sd.camping-move'],
        roll: { kind: 'quantity', dice: 'd4' },
      },
      {
        id: 'sleep',
        label: 'Core · 하룻밤 수면',
        condition: '음식·물이 있고 감염되지 않은 상태에서 하룻밤 푹 잠',
        test: '회복량 d6 · 성공 판정 없음',
        effect:
          'HP d6 회복. SD 야영을 사용 중이면 해당 Move의 회복량만 적용합니다.',
        references: ['rule:core.rest', 'rule:sd.camping-move'],
        roll: { kind: 'quantity', dice: 'd6' },
      },
      {
        id: 'sd-breath',
        label: 'SD · 숨 돌리기',
        condition: 'SD 휴식 Move를 사용할 때',
        test: '2d20 + Presence · DR9',
        effect:
          'Strong: HP d4. Weak: HP d2. Miss: 사건이 발생하며, 해결 뒤 다음 휴식은 Strong/Weak 50:50. 수면하지 않으므로 수면의 Omens·Powers 회복은 없습니다.',
        references: ['rule:sd.camping-move', 'rule:core.rest'],
      },
      {
        id: 'sd-sleep',
        label: 'SD · 야영',
        condition:
          'SD로 하룻밤 쉬며 음식·물 부족이나 감염의 휴식 제한이 없을 때',
        test: '2d20 + Presence · DR12',
        effect:
          'Strong: HP d6, Omens 재굴림·Powers 회복. Weak: HP d4, Omen·Power 각각 1, 방해받은 이유. 수면 시 식량 1. Miss: 사건을 해결한 뒤 다음 휴식 Strong/Weak 50:50.',
        references: ['rule:sd.camping-move', 'rule:core.rest'],
      },
      {
        id: 'retry',
        label: 'SD · 실패 사건 해결 후 다시 휴식',
        condition: '이전 휴식 Miss로 생긴 사건을 해결한 뒤의 다음 휴식',
        test: 'Strong / Weak 각각 50% · 2d20 재판정 없음',
        effect:
          '야영 참조의 실패 결과 아래 후속 판정을 사용합니다. 사건 해결 전의 무조건 재시도가 아닙니다.',
        references: ['rule:sd.camping-move'],
      },
      {
        id: 'blocked',
        label: '음식·물 부족 또는 감염 중',
        condition: '음식이나 물이 없거나 감염된 상태',
        test: '휴식 회복 제한 확인',
        effect:
          '음식·물이 없으면 휴식 HP 회복이 없습니다. 감염된 캐릭터는 휴식의 혜택을 받지 못하며 매일 HP d6를 잃습니다. 굶주림의 일일 손실은 식량 부족 항목에서 확인하세요.',
        references: ['rule:core.rest'],
      },
    ],
  },
  {
    id: 'infection',
    label: '감염',
    conditions: [
      {
        id: 'infected',
        label: '감염된 상태로 하루가 지남',
        condition: '감염이 이미 성립했고 하루 손실을 처리할 때',
        test: '일일 HP 손실 d6',
        effect:
          '매일 HP d6 손실, 휴식의 혜택 없음. 감염 원인이 별도 저항 판정을 요구하면 먼저 그 결과를 따릅니다. 병들었다는 문장만 보고 감염을 자동 확정하지 않습니다.',
        references: ['rule:core.rest'],
        roll: { kind: 'quantity', dice: 'd6' },
      },
    ],
  },
  {
    id: 'hunger',
    label: '식량 부족',
    conditions: [
      {
        id: 'no-food',
        label: '음식이나 물이 없음',
        condition: '휴식 시 음식 또는 물이 부족',
        test: '굴림 없음',
        effect:
          '쉬어도 HP는 회복하지 않습니다. 이틀 굶기 전부터 일일 피해를 붙이지 않습니다.',
        references: ['rule:core.rest'],
      },
      {
        id: 'starving',
        label: '이틀 굶은 뒤의 하루',
        condition: '이틀 굶은 뒤부터 매일',
        test: '일일 HP 손실 d4',
        effect: 'HP d4 손실. 경과한 날과 식량은 노트에서 직접 확인합니다.',
        references: ['rule:core.rest'],
        roll: { kind: 'quantity', dice: 'd4' },
      },
    ],
  },
  {
    id: 'carrying',
    label: '과적',
    conditions: [
      {
        id: 'normal',
        label: '기본 한도 이내',
        condition: '보통 크기 물건이 Strength + 8개 이하',
        test: '개수 확인 · 굴림 없음',
        effect: '과적에 의한 불이익 없음.',
        references: ['rule:core.carrying'],
      },
      {
        id: 'over',
        label: '기본 한도 초과',
        condition: 'Strength + 8개 초과, 그 두 배 이하',
        test: 'Strength·Agility 판정 DR +2',
        effect:
          '해당 판정의 DR을 2 높입니다. 모든 능력 판정에 붙는 보정은 아닙니다.',
        references: ['rule:core.carrying'],
      },
      {
        id: 'limit',
        label: '최대 한도 초과',
        condition: '2 × (Strength + 8)개 초과',
        test: '굴려서 넘길 수 없는 운반 한도',
        effect: '이보다 많이 들 수 없습니다. 내려놓거나 운반 방법을 바꾸세요.',
        references: ['rule:core.carrying'],
      },
      {
        id: 'large',
        label: '상자·사다리·시체 같은 큰 물건',
        condition: '보통 크기로 셀 수 없는 물건',
        test: '원문에 개수 환산 규칙 없음',
        effect:
          '상황에 맞게 판단합니다. 임의로 물건 몇 개분이라고 자동 환산하지 않습니다.',
        references: ['rule:core.carrying'],
      },
    ],
  },
];

export const RULE_TOPIC_REFERENCES: Record<string, string> = {
  'rule:core.casting': 'powers',
  'rule:core.rest': 'rest',
  'rule:core.carrying': 'carrying',
};
