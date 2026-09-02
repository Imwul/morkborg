import {
  FATE_ODDS,
  FATE_ANSWERS,
  type FateChart,
  type FateOdds,
  type FateReading,
  type MythicState,
} from '../domain/mythic';
import type { OracleResult } from '../domain/oracle';
import { id, now, random, rollDie, type RandomSource } from './random';

export function assertDie(value: number, sides: number) {
  if (!Number.isInteger(value) || value < 1 || value > sides)
    throw new Error(`1–${sides} 사이의 정수를 입력하세요.`);
}
export function fateCell(chart: FateChart, odds: FateOdds, chaos: number) {
  assertDie(chaos, 9);
  const cell = chart.rows.find((row) => row.odds === odds)?.cells[chaos - 1];
  if (!cell) throw new Error('해당 Odds / Chaos의 원문 Fate Chart가 없습니다.');
  return cell;
}
export function checkModifier(odds: FateOdds, chaos: number) {
  assertDie(chaos, 9);
  const option = FATE_ODDS.find((o) => o.id === odds);
  if (!option) throw new Error('올바른 Odds를 선택하세요.');
  return option.modifier + FATE_ODDS[chaos - 1].modifier;
}
export function percentileEvent(roll: number, chaos: number) {
  assertDie(roll, 100);
  assertDie(chaos, 9);
  // PDF187 lists 11 through99. 100 (00) is not an event-triggering double.
  return roll < 100 && roll % 11 === 0 && roll / 11 <= chaos;
}
export function resolveFate(
  state: MythicState,
  chart: FateChart | null,
  dice: number[],
  input: 'random' | 'manual' = 'manual',
): FateReading {
  assertDie(state.chaosFactor, 9);
  let answer: FateReading['answer'],
    total: number,
    modifier = 0,
    randomEvent: boolean;
  if (state.method === 'chart') {
    if (!chart) throw new Error('원문 Fate Chart 자료를 먼저 불러오세요.');
    if (dice.length !== 1) throw new Error('d100 결과 하나를 입력하세요.');
    assertDie(dice[0], 100);
    const cell = fateCell(chart, state.odds, state.chaosFactor);
    total = dice[0];
    answer =
      cell.exceptionalYes !== null && total <= cell.exceptionalYes
        ? 'exceptional-yes'
        : total <= cell.yes
          ? 'yes'
          : cell.exceptionalNo !== null && total >= cell.exceptionalNo
            ? 'exceptional-no'
            : 'no';
    randomEvent = percentileEvent(total, state.chaosFactor);
  } else {
    if (dice.length !== 2) throw new Error('d10 결과 두 개를 입력하세요.');
    dice.forEach((d) => assertDie(d, 10));
    modifier = checkModifier(state.odds, state.chaosFactor);
    total = dice[0] + dice[1] + modifier;
    // PDF26 explicitly says22 is ordinary Yes: never clamp into exceptional bands.
    answer =
      total >= 18 && total <= 20
        ? 'exceptional-yes'
        : total >= 2 && total <= 4
          ? 'exceptional-no'
          : total >= 11
            ? 'yes'
            : 'no';
    randomEvent = dice[0] === dice[1] && dice[0] <= state.chaosFactor;
  }
  return {
    id: id(),
    createdAt: now(),
    kind: 'fate',
    method: state.method,
    question: state.question,
    odds: state.odds,
    chaosFactor: state.chaosFactor,
    dice: [...dice],
    total,
    modifier,
    answer,
    randomEvent,
    input,
  };
}
export function resolveScene(
  state: MythicState,
  roll: number,
  input: 'random' | 'manual' = 'manual',
): FateReading {
  assertDie(state.chaosFactor, 9);
  assertDie(roll, 10);
  const answer =
    roll > state.chaosFactor ? 'expected' : roll % 2 ? 'altered' : 'interrupt';
  return {
    id: id(),
    createdAt: now(),
    kind: 'scene',
    method: 'scene',
    question: state.scene,
    odds: state.odds,
    chaosFactor: state.chaosFactor,
    dice: [roll],
    total: roll,
    modifier: 0,
    answer,
    randomEvent: answer === 'interrupt',
    input,
  };
}
export function rollFate(
  state: MythicState,
  chart: FateChart | null,
  rng: RandomSource = random,
): FateReading {
  return state.tab === 'scene'
    ? resolveScene(state, rollDie(10, rng), 'random')
    : resolveFate(
        state,
        chart,
        state.method === 'chart'
          ? [rollDie(100, rng)]
          : [rollDie(10, rng), rollDie(10, rng)],
        'random',
      );
}
export function fateSource(reading: FateReading) {
  return (
    'Mythic Game Master Emulator Second Edition · ' +
    (reading.method === 'chart'
      ? 'PDF 20,24,26쪽 / p.19,23,25 · Fate Chart'
      : reading.method === 'check'
        ? 'PDF 26–27쪽 / p.25–26 · Fate Check'
        : 'PDF 68쪽 / p.67 · Testing the Expected Scene')
  );
}
export function fateRollLabel(reading: FateReading) {
  if (reading.method !== 'check')
    return `${reading.method === 'chart' ? 'd100' : 'd10'}: ${reading.dice[0]}`;
  return `2d10: ${reading.dice.join(' + ')} ${reading.modifier < 0 ? '−' : '+'} ${Math.abs(reading.modifier)} = ${reading.total}`;
}
export function fateNotesResult(reading: FateReading): OracleResult {
  const odds = FATE_ODDS.find((o) => o.id === reading.odds)!.label;
  return {
    id: reading.id,
    title:
      reading.kind === 'fate' ? 'Mythic Fate Question' : 'Mythic Scene Check',
    rolls: [
      {
        oracleId: `mythic2.${reading.method}`,
        title: reading.kind === 'scene' ? 'Scene Check' : 'Fate Question',
        dice:
          reading.method === 'check'
            ? `2d10 ${reading.modifier < 0 ? '−' : '+'} ${Math.abs(reading.modifier)} (${reading.dice.join(', ')})`
            : reading.method === 'chart'
              ? 'd100'
              : 'd10',
        roll: reading.total,
        diceValues: reading.dice,
        entryId: null,
        text: `${reading.question ? reading.question + '\n' : ''}${FATE_ANSWERS[reading.answer]}\nChaos ${reading.chaosFactor}${reading.kind === 'fate' ? ' · ' + odds : ''}${reading.randomEvent ? '\nRandom Event' : ''}`,
        source: fateSource(reading),
      },
      ...(reading.event?.rolls ?? []),
    ],
  };
}
