import type { OracleRegistry } from './oracle';
import type { SourceReference } from './types';
import type { ReferenceReading } from './referenceReading';
import { PLAY_REFERENCE_RULES } from './playReferenceRules';
import { random, rollDie, type RandomSource } from '../generators/random';
import { journeyOracleReading, rollJourneyTable } from './journeyProcedure';

export type DungeonAction =
  | 'flee'
  | 'search'
  | 'breath'
  | 'camp'
  | 'resupply'
  | 'noise'
  | 'enemy'
  | 'door'
  | 'trap-detect'
  | 'trap-avoid'
  | 'trap-save';
export type MoveOutcome = 'strong' | 'weak' | 'fail';
export const DUNGEON_ACTIONS: {
  id: DungeonAction;
  title: string;
  ability: string;
  ruleId: string;
}[] = [
  { id: 'flee', title: '도망', ability: 'Agility', ruleId: 'sd.flee-combat' },
  {
    id: 'search',
    title: '탐색',
    ability: '남은 Omens',
    ruleId: 'sd.search-move',
  },
  {
    id: 'breath',
    title: '잠깐 휴식',
    ability: 'Presence',
    ruleId: 'sd.camping-move',
  },
  { id: 'camp', title: '야영', ability: 'Presence', ruleId: 'sd.camping-move' },
  {
    id: 'resupply',
    title: '재보급',
    ability: '선택한 능력',
    ruleId: 'sd.resupply',
  },
  {
    id: 'noise',
    title: '시간 / 소음',
    ability: '',
    ruleId: 'depths.time-noise',
  },
  {
    id: 'enemy',
    title: '적의 감지',
    ability: 'Agility',
    ruleId: 'depths.enemy-detection',
  },
  {
    id: 'door',
    title: '문 / 장애물',
    ability: '선택한 능력',
    ruleId: 'depths.locked-doors',
  },
  {
    id: 'trap-detect',
    title: '함정 탐지',
    ability: 'Presence',
    ruleId: 'depths.traps',
  },
  {
    id: 'trap-avoid',
    title: '발견한 함정 해제 / 회피',
    ability: 'Presence',
    ruleId: 'depths.traps',
  },
  {
    id: 'trap-save',
    title: '발동한 함정에 저항',
    ability: '함정이 지정한 능력',
    ruleId: 'depths.traps',
  },
];
export interface DungeonActionInput {
  action: DungeonAction;
  modifier: number;
  threatRating: 9 | 12 | 15;
  enemies?: number;
  customDR?: number;
  loud?: boolean;
  lockpick?: boolean;
  enemyState?: 'normal' | 'preoccupied' | 'alerted';
  retry?: boolean;
}
export interface DungeonActionResult {
  action: DungeonAction;
  outcome: MoveOutcome;
  values: number[];
  dr: number;
  modifier: number;
  secondaryRoll?: number;
  recovery?: number;
  retry: boolean;
  reading: ReferenceReading;
  relatedIds: string[];
}
function source(ruleId: string): SourceReference[] {
  const rule = PLAY_REFERENCE_RULES.find((r) => r.id === ruleId);
  if (!rule) throw new Error(`원문 규칙을 찾지 못했습니다: ${ruleId}`);
  return [
    {
      bookId: rule.book,
      bookTitle: rule.book === 'sd' ? 'Sölitary Defilement' : 'Sölitary Depths',
      tableTitle: rule.title,
      pdfPage: rule.pages,
      printedPage: rule.printedPage,
    },
  ];
}
export function dungeonActionDR(input: DungeonActionInput) {
  if (input.action === 'flee') return 11 + (input.enemies ?? 1);
  if (input.action === 'search' || input.action === 'camp') return 12;
  if (input.action === 'breath') return 9;
  if (input.action === 'resupply') return input.customDR ?? 12;
  if (input.action === 'enemy')
    return (
      input.threatRating +
      (input.enemyState === 'preoccupied'
        ? -3
        : input.enemyState === 'alerted'
          ? 3
          : 0)
    );
  if (input.action === 'door')
    return input.threatRating - (input.lockpick ? 3 : 0);
  return input.threatRating;
}
export function rollDungeonAction(
  input: DungeonActionInput,
  registry: OracleRegistry,
  rng: RandomSource = random,
): DungeonActionResult {
  const action = DUNGEON_ACTIONS.find((a) => a.id === input.action);
  if (!action) throw new Error('지원하지 않는 던전 행동입니다.');
  if (
    !Number.isSafeInteger(input.modifier) ||
    ![9, 12, 15].includes(input.threatRating)
  )
    throw new Error('능력 보정과 TR을 확인하세요.');
  if (
    input.action === 'flee' &&
    (!Number.isSafeInteger(input.enemies ?? 1) || (input.enemies ?? 1) < 1)
  )
    throw new Error('추격하는 적 수는 1 이상의 정수입니다.');
  const dr = dungeonActionDR(input);
  if (!Number.isSafeInteger(dr) || dr < 1)
    throw new Error('DR은 1 이상의 정수입니다.');
  if (input.retry && input.action !== 'breath' && input.action !== 'camp')
    throw new Error('휴식 실패의 후속 판정만 50:50을 사용합니다.');
  const refs = source(action.ruleId);
  const result: DungeonActionResult = {
    action: input.action,
    outcome: 'fail',
    values: [],
    dr,
    modifier: input.modifier,
    retry: !!input.retry,
    reading: { title: action.title, blocks: [], sourceRefs: refs },
    relatedIds: [],
  };
  if (input.action === 'noise') {
    const value = rollDie(6, rng),
      threshold = input.loud ? 2 : 1;
    result.values = [value];
    result.outcome = value <= threshold ? 'fail' : 'strong';
    result.reading.blocks = [
      {
        title: '위험 확인',
        text:
          value <= threshold
            ? '위험이 드러났습니다.'
            : '이번에는 새 위험이 드러나지 않았습니다.',
        dice: `d6 = ${value} · ${threshold}-in-6`,
      },
    ];
    if (value <= threshold) {
      const danger = journeyOracleReading(
        rollJourneyTable('depths.danger', registry, rng),
        registry,
      );
      result.reading.blocks.push(...danger.blocks);
      result.reading.sourceRefs.push(...danger.sourceRefs);
      result.relatedIds = ['rule:depths.traps', 'oracle:core.reaction'];
    }
    return result;
  }
  const values = input.retry
    ? [rollDie(2, rng)]
    : [rollDie(20, rng), rollDie(20, rng)];
  const hits = values.filter((v) => v + input.modifier >= dr).length;
  const outcome: MoveOutcome = input.retry
    ? values[0] === 1
      ? 'strong'
      : 'weak'
    : hits === 2
      ? 'strong'
      : hits === 1
        ? 'weak'
        : 'fail';
  result.values = values;
  result.outcome = outcome;
  let text = '';
  if (input.action === 'flee')
    text =
      outcome === 'strong'
        ? '성공적으로 도망칩니다.'
        : outcome === 'weak'
          ? '도망치지만 적이 기회 공격을 합니다. 방어 판정 후 피해 여부와 무관하게 탈출합니다.'
          : '탈출하지 못합니다. 적의 기회 공격을 방어한 뒤 전투를 계속합니다.';
  if (input.action === 'search') {
    if (outcome === 'fail') {
      text =
        '아무것도 찾지 못하고 위험이 드러납니다. 함정이나 매복 등 상황에 맞는 위험을 정하세요.';
      result.relatedIds = ['oracle:depths.danger'];
    } else {
      const found = rollJourneyTable(`sd.search.${outcome}`, registry, rng);
      const value = found.rolls[0].roll;
      result.secondaryRoll = value;
      result.reading.sourceRefs.push(
        ...journeyOracleReading(found, registry).sourceRefs,
      );
      text = `발견 d4 = ${value}. ${found.rolls[0].text}`;
      result.relatedIds =
        outcome === 'strong'
          ? value === 1
            ? ['oracle:core.corpsePlundering', 'oracle:feretory.itemsTrinkets']
            : value === 4
              ? ['oracle:core.treasures', 'oracle:feretory.tenebrousReliquary']
              : ['oracle:sd.usefulItems']
          : value === 1
            ? []
            : value === 2
              ? ['oracle:core.corpsePlundering']
              : value === 3
                ? ['oracle:feretory.itemsTrinkets']
                : ['oracle:sd.usefulItems'];
    }
  }
  if (input.action === 'breath' || input.action === 'camp') {
    const sleep = input.action === 'camp';
    if (outcome === 'fail')
      text =
        '휴식하지 못하고 끔찍한 사건이 발생합니다. 사건을 해결한 다음 휴식 시도는 Strong/Weak 50:50입니다.';
    else {
      const sides = sleep
        ? outcome === 'strong'
          ? 6
          : 4
        : outcome === 'strong'
          ? 4
          : 2;
      result.recovery = rollDie(sides, rng);
      text = `d${sides} = ${result.recovery} HP 회복.`;
      if (sleep)
        text +=
          outcome === 'strong'
            ? ' 직업 주사위로 Omens를 다시 정하고 Powers를 회복하며 식량 1개를 사용합니다.'
            : ' Omen 1개와 Power 1개를 회복하고 식량 1개를 사용합니다. 뒤척이거나 잠을 방해받은 이유를 정하세요.';
    }
    if (!sleep && outcome === 'weak')
      text += ' 휴식을 방해받은 이유를 정하세요.';
    result.relatedIds = [
      'rule:core.rest',
      'rule:depths.time-noise',
      ...(outcome === 'fail' ? ['oracle:depths.danger'] : []),
    ];
  }
  if (input.action === 'resupply') {
    text =
      outcome === 'strong'
        ? '계획한 재보급 행동이 성공합니다. 얻은 먹이나 물을 상황에 맞게 정하세요.'
        : outcome === 'weak'
          ? '재보급에 성공하지만 문제가 생깁니다. 손실·위험·불리한 조건을 정하세요.'
          : '재보급 행동이 실패하고 나쁜 일이 벌어집니다.';
    result.relatedIds = [
      'procedure:reclvse.action-theme',
      'oracle:depths.danger',
    ];
  }
  if (input.action === 'enemy') {
    text =
      outcome === 'strong'
        ? '적이 당신을 전혀 감지하지 못합니다. 이전 방으로 후퇴는 자동 성공. 몰래 통과하려면 TR−3 Presence Move. 싸우면 당신이 선공입니다.'
        : outcome === 'weak'
          ? '적이 의심하며 경계합니다. 이전 방으로 후퇴는 자동 성공. 몰래 통과하려면 TR Presence Move. 싸우면 선공을 굴립니다.'
          : '적이 발견하고 경계합니다. Reaction을 굴려 적대적이면 선공과 전투, 그렇지 않으면 Chaos Portents로 원하는 것을 정하세요.';
    result.relatedIds =
      outcome === 'fail'
        ? [
            'oracle:core.reaction',
            'oracle:depths.chaosPortents.action',
            'oracle:depths.chaosPortents.subject',
          ]
        : ['rule:core.violence'];
  }
  if (input.action === 'door') {
    text =
      outcome === 'strong'
        ? '문을 열거나 장애물을 치우고 전진합니다.'
        : outcome === 'weak'
          ? '통과하지만 위험이 드러납니다. Reveal a Danger의 잠긴 문/장애물 결과는 다시 굴리세요.'
          : '통과하지 못하고 위험이 드러납니다. Reveal a Danger의 잠긴 문/장애물 결과는 다시 굴리세요.';
    if (input.lockpick && outcome !== 'strong')
      text += ' 자물쇠 따개가 부러집니다.';
    if (outcome !== 'strong') result.relatedIds = ['oracle:depths.danger'];
  }
  if (input.action === 'trap-detect') {
    text =
      outcome === 'strong'
        ? '함정과 종류를 알아차립니다. 가능하다면 물러날 수 있습니다.'
        : outcome === 'weak'
          ? '숨은 함정은 알아차렸지만 종류는 모릅니다. 해제/회피하려면 TR Presence Move를 하며 Strong 또는 Weak면 성공합니다.'
          : '함정에 걸렸습니다. Regular Traps로 종류를 정한 뒤 그 함정이 지정한 능력으로 저항합니다. Strong만 모든 결과를 피합니다.';
    result.relatedIds =
      outcome === 'fail'
        ? ['oracle:depths.traps.regular']
        : ['rule:depths.traps'];
  }
  if (input.action === 'trap-avoid')
    text =
      outcome === 'fail'
        ? '함정을 피하거나 해제하지 못했습니다. 해당 함정의 결과를 적용하세요.'
        : '함정을 피하거나 해제했습니다. 종류를 알아볼 수 있습니다.';
  if (input.action === 'trap-save')
    text =
      outcome === 'strong'
        ? '함정의 모든 결과를 피하고 종류를 알아냈습니다.'
        : '해당 함정의 Weak Hit / Failure 결과를 적용하세요.';
  result.reading.title = `${action.title} · ${outcome === 'strong' ? 'STRONG HIT' : outcome === 'weak' ? 'WEAK HIT' : 'MISS'}`;
  result.reading.blocks = [
    {
      title: action.ability,
      text,
      dice: input.retry
        ? `후속 d2 = ${values[0]}`
        : `2d20 = ${values.join(', ')} · 보정 ${input.modifier >= 0 ? '+' : ''}${input.modifier} · DR${dr}`,
    },
  ];
  result.reading.relatedIds = result.relatedIds;
  return result;
}
