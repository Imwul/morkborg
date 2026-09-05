import type { SourceReference } from './types';
import { random, rollDie, type RandomSource } from '../generators/random';

export type CityMove = 'crawl' | 'directions' | 'pray' | 'stash';
export type CityMode = 'micro' | 'derive' | 'city';
export type CityOutcome = 'strong' | 'weak' | 'fail';
export type DirectionsChoice = 'next-crawl-bonus' | 'destination';
export interface CityFollowUp {
  tableId: string;
  dice: 'd4' | 'd6' | '2d6';
  diceValues: number[];
  roll: number;
  sourceRefs: SourceReference[];
}
export interface DirectionsOption {
  choice: DirectionsChoice;
  fixed?: number;
  sides?: 2 | 4;
}
export interface CityMoveResult {
  move: CityMove;
  mode: CityMode;
  dr: number;
  modifier: number;
  diceValues: [number, number];
  modifiedValues: [number, number];
  outcome: CityOutcome;
  description: string;
  sourceRefs: SourceReference[];
  metadata: {
    streetAction:
      | 'none'
      | 'new-street'
      | 'next-objective'
      | 'resolve-then-new-street';
    requiresResolution: boolean;
    /** Rule-of-thumb estimate, not an automatically advanced clock. */
    minutesPerStreet?: 5;
    followUp?: CityFollowUp;
    reaction?: 'attacks' | 'ignores' | 'indifferent' | 'helpful';
    directionsOptions?: DirectionsOption[];
    selectedDirections?: {
      choice: DirectionsChoice;
      value: number;
      diceValues: number[];
      nextCrawlBonus?: number;
      destinationStreets?: number;
    };
  };
}
const aitc = (
  pdfPage: number,
  tableTitle: string,
  tableId?: string,
): SourceReference => ({
  bookId: 'aitc',
  bookTitle: 'Alöne in the Crowd',
  pdfPage,
  printedPage: pdfPage - 2,
  tableTitle,
  ...(tableId ? { tableId } : {}),
});
const MOVES_SOURCE: SourceReference[] = [
  {
    bookId: 'sd',
    bookTitle: 'Sölitary Defilement',
    pdfPage: 4,
    printedPage: 2,
    tableTitle: 'Moves: two independent d20 tests',
  },
  {
    bookId: 'core',
    bookTitle: 'MÖRK BORG BARE BONES EDITION',
    pdfPage: 28,
    printedPage: 28,
    tableTitle: 'Tests: meet or exceed DR',
  },
];
export const CITY_MOVE_DEFAULTS: Record<
  CityMove,
  {
    dr: number;
    ability: 'city' | 'presence' | 'omens';
    sourceRefs: SourceReference[];
  }
> = {
  crawl: {
    dr: 10,
    ability: 'city',
    sourceRefs: [aitc(6, 'Dérive / City Crawl'), aitc(7, 'City Crawl')],
  },
  directions: {
    dr: 12,
    ability: 'presence',
    sourceRefs: [aitc(7, 'Get Directions')],
  },
  pray: { dr: 14, ability: 'presence', sourceRefs: [aitc(7, 'Pray')] },
  stash: {
    dr: 10,
    ability: 'omens',
    sourceRefs: [aitc(8, 'Stash Item: roll when retrieving')],
  },
};
function requireInteger(value: number, label: string) {
  if (!Number.isSafeInteger(value))
    throw new Error(`${label}는 정수여야 합니다.`);
}
function followUp(
  tableId: string,
  sides: 4 | 6,
  pdfPage: number,
  rng: RandomSource,
): CityFollowUp {
  const roll = rollDie(sides, rng);
  return {
    tableId,
    dice: `d${sides}`,
    diceValues: [roll],
    roll,
    sourceRefs: [{ ...aitc(pdfPage, tableId, tableId), roll }],
  };
}
/** Resolves only the source Move and its stated branch rolls; never edits campaign resources. */
export function rollCityMove(
  input: {
    move: CityMove;
    dr: number;
    modifier: number;
    mode?: CityMode;
    allObjectivesMet?: boolean;
  },
  rng: RandomSource = random,
): CityMoveResult {
  requireInteger(input.dr, 'DR');
  requireInteger(input.modifier, '가산치');
  if (input.dr < 1) throw new Error('DR은 1 이상이어야 합니다.');
  if (!(input.move in CITY_MOVE_DEFAULTS))
    throw new Error('지원하지 않는 도시 절차입니다.');
  const mode = input.mode ?? 'city';
  if (!['micro', 'derive', 'city'].includes(mode))
    throw new Error('알 수 없는 이동 모드입니다.');
  if (input.move === 'crawl' && mode === 'micro')
    throw new Error(
      '마이크로 크롤은 d4로 거리 수를 먼저 정하고 진행하세요. 도시 크롤 판정을 먼저 굴리지 마세요.',
    );
  const diceValues: [number, number] = [rollDie(20, rng), rollDie(20, rng)];
  const modifiedValues = diceValues.map((value) => value + input.modifier) as [
    number,
    number,
  ];
  const successes = modifiedValues.filter((value) => value >= input.dr).length;
  const outcome: CityOutcome =
    successes === 2 ? 'strong' : successes === 1 ? 'weak' : 'fail';
  const result: CityMoveResult = {
    move: input.move,
    mode,
    dr: input.dr,
    modifier: input.modifier,
    diceValues,
    modifiedValues,
    outcome,
    description: '',
    sourceRefs: [...MOVES_SOURCE, ...CITY_MOVE_DEFAULTS[input.move].sourceRefs],
    metadata: { streetAction: 'none', requiresResolution: false },
  };
  if (input.move === 'crawl') {
    result.metadata.minutesPerStreet = 5;
    if (outcome === 'fail') {
      result.description =
        '이동을 막은 상황을 해결한 뒤 새 거리를 만드세요. d4는 원문의 선택적 영감 분기입니다.';
      result.metadata.streetAction = 'resolve-then-new-street';
      result.metadata.requiresResolution = true;
      result.metadata.followUp = followUp('aitc.city-crawl-failure', 4, 7, rng);
    } else if (
      mode === 'city' &&
      outcome === 'strong' &&
      !input.allObjectivesMet
    ) {
      result.description = '다음 목표에 도달했습니다.';
      result.metadata.streetAction = 'next-objective';
    } else {
      result.description =
        mode === 'derive'
          ? 'Dérive의 두 성공 등급 모두 새 거리를 만듭니다.'
          : '새 거리를 만드세요.';
      result.metadata.streetAction = 'new-street';
    }
  } else if (input.move === 'directions') {
    if (outcome === 'strong') {
      result.description =
        '다음 목표 탐색에 +4 또는 다음 거리에 목적지를 배치하는 것 중 하나를 선택하세요.';
      result.metadata.directionsOptions = [
        { choice: 'next-crawl-bonus', fixed: 4 },
        { choice: 'destination', fixed: 1 },
      ];
    } else if (outcome === 'weak') {
      const values = [rollDie(6, rng), rollDie(6, rng)];
      const roll = values[0] + values[1];
      result.metadata.followUp = {
        tableId: 'aitc.directions-reaction',
        dice: '2d6',
        diceValues: values,
        roll,
        sourceRefs: [
          {
            ...aitc(7, 'Get Directions: Reaction', 'aitc.directions-reaction'),
            roll,
          },
        ],
      };
      const reaction =
        roll <= 3
          ? 'attacks'
          : roll <= 6
            ? 'ignores'
            : roll <= 8
              ? 'indifferent'
              : 'helpful';
      result.metadata.reaction = reaction;
      result.description =
        'NPC 반응을 확인하세요. 도움을 받았다면 목표 탐색 보정 또는 목적지까지의 거리 중 하나를 선택합니다.';
      if (reaction === 'indifferent' || reaction === 'helpful')
        result.metadata.directionsOptions = [
          {
            choice: 'next-crawl-bonus',
            sides: reaction === 'indifferent' ? 2 : 4,
          },
          { choice: 'destination', sides: reaction === 'indifferent' ? 4 : 2 },
        ];
      result.metadata.requiresResolution = reaction === 'attacks';
    } else result.description = '방향을 찾지 못했습니다.';
  } else if (input.move === 'pray') {
    if (outcome === 'strong')
      result.metadata.followUp = followUp('aitc.pray-strong', 4, 7, rng);
    if (outcome === 'fail')
      result.metadata.followUp = followUp('aitc.pray-failure', 6, 7, rng);
    result.description =
      outcome === 'weak'
        ? '기도에 따른 변화가 없습니다.'
        : '기도 결과의 원문을 확인하고 직접 적용하세요.';
    result.metadata.requiresResolution = outcome !== 'weak';
  } else {
    if (outcome === 'weak')
      result.metadata.followUp = followUp('aitc.stash-weak', 6, 8, rng);
    result.description =
      outcome === 'strong'
        ? '회수하러 돌아왔을 때 숨긴 물건이 남아 있습니다.'
        : outcome === 'weak'
          ? '회수 상황을 확인하세요. 물건별 손실·손상 판정은 직접 해결합니다.'
          : '숨긴 물건이 사라졌거나 망가졌습니다. 실제 변경은 직접 기록하세요.';
    result.metadata.requiresResolution = outcome !== 'strong';
  }
  if (result.metadata.followUp)
    result.sourceRefs.push(...result.metadata.followUp.sourceRefs);
  return result;
}
/** Rolls one chosen benefit only; the two alternatives are never combined or auto-applied. */
export function resolveDirectionsChoice(
  result: CityMoveResult,
  choice: DirectionsChoice,
  rng: RandomSource = random,
): CityMoveResult {
  const option = result.metadata.directionsOptions?.find(
    (entry) => entry.choice === choice,
  );
  if (result.move !== 'directions' || !option)
    throw new Error('This outcome offers no such Directions benefit.');
  if (result.metadata.selectedDirections)
    throw new Error(
      'A Directions benefit has already been selected for this reading.',
    );
  const rolled = option.fixed ?? rollDie(option.sides!, rng);
  return {
    ...result,
    metadata: {
      ...result.metadata,
      selectedDirections: {
        choice,
        value: rolled,
        diceValues: option.fixed == null ? [rolled] : [],
        ...(choice === 'next-crawl-bonus'
          ? { nextCrawlBonus: rolled }
          : { destinationStreets: rolled }),
      },
    },
  };
}
export function prayerPlaceBonus(
  place: 'statue' | 'shrine' | 'tomb' | 'chapel' | 'church' | 'cathedral',
) {
  return { statue: 0, shrine: 1, tomb: 1, chapel: 2, church: 2, cathedral: 3 }[
    place
  ];
}
export function rollMerchantDisposition(
  presence: number,
  rng: RandomSource = random,
) {
  requireInteger(presence, '존재치');
  const diceValues: [number, number] = [rollDie(6, rng), rollDie(6, rng)];
  const roll = diceValues[0] + diceValues[1];
  const modifiedRoll = roll + presence;
  // The source starts at 0–3 and ends at 12+; negative totals have no printed result.
  const lookupValue = modifiedRoll < 0 ? null : Math.min(12, modifiedRoll);
  const band =
    lookupValue === null
      ? null
      : lookupValue <= 3
        ? 0
        : lookupValue <= 5
          ? 1
          : lookupValue <= 7
            ? 2
            : lookupValue <= 9
              ? 3
              : lookupValue <= 11
                ? 4
                : 5;
  const priceMultiplier =
    band === null ? null : [null, 2, 1.5, 1, 0.9, 0.75][band];
  return {
    dice: '2d6+Presence',
    diceValues,
    roll,
    presence,
    modifiedRoll,
    lookupValue,
    band,
    priceMultiplier,
    unresolved: band === null,
    service: band === null ? null : band !== 0,
    description:
      band === null
        ? '원문 범위 밖 — 직접 판단'
        : band === 0
          ? '거래 거부'
          : `기준 가격 ×${priceMultiplier}`,
    sourceRefs: [
      {
        ...aitc(10, 'Merchant Dispositions', 'aitc.merchant-disposition'),
        roll: modifiedRoll,
      },
    ],
  };
}
export function settlementStreetDice(sizeRoll: number) {
  requireInteger(sizeRoll, '정착지 규모 주사위');
  if (sizeRoll < 1 || sizeRoll > 20)
    throw new Error('Settlement Size requires a d20 result.');
  const sizes = [
    { limit: 5, size: 'homestead', sides: 2, modifier: 1 },
    { limit: 10, size: 'hamlet', sides: 4, modifier: 2 },
    { limit: 14, size: 'village', sides: 8, modifier: 3 },
    { limit: 17, size: 'town', sides: 12, modifier: 3 },
    { limit: 19, size: 'city-borough', sides: 20, modifier: 4 },
    { limit: 20, size: 'metropolis', sides: 20, modifier: 20 },
  ];
  const size = sizes.find((row) => sizeRoll <= row.limit)!;
  return {
    ...size,
    dice: `d${size.sides}+${size.modifier}`,
    sourceRefs: [
      {
        ...aitc(12, 'Settlement Size', 'aitc.settlement-size'),
        roll: sizeRoll,
      },
    ],
  };
}
export function rollSettlementStreets(
  sizeRoll: number,
  rng: RandomSource = random,
) {
  const size = settlementStreetDice(sizeRoll);
  const roll = rollDie(size.sides, rng);
  return {
    size: size.size,
    sizeRoll,
    dice: size.dice,
    diceValues: [roll],
    roll,
    streets: roll + size.modifier,
    description: `${size.dice} = ${roll + size.modifier} streets`,
    sourceRefs: size.sourceRefs,
  };
}
export const getSettlementStreetCount = rollSettlementStreets;
export function rollMicroCrawl(rng: RandomSource = random) {
  const roll = rollDie(4, rng);
  return {
    dice: 'd4',
    diceValues: [roll],
    roll,
    streets: roll,
    description: `${roll} streets`,
    sourceRefs: [aitc(5, 'Micro-crawl')],
  };
}
export function encounterSettlementChance(rng: RandomSource = random) {
  const roll = rollDie(8, rng);
  return {
    dice: 'd8',
    diceValues: [roll],
    roll,
    discovered: roll === 1,
    description: roll === 1 ? '정착지 발견' : '정착지를 발견하지 못했습니다.',
    sourceRefs: [aitc(5, 'Daily settlement discovery')],
  };
}
