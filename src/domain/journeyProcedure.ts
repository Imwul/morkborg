import type { OracleRegistry, OracleResult } from './oracle';
import type { SourceReference } from './types';
import { id, random, rollDie, type RandomSource } from '../generators/random';
import { rollOracle } from '../generators/oracleRoller';
import { rollTravel } from './campaignProcedures';
import { traceReferenceProcedure } from './referenceGeneratorProcedures';
import { oracleReadingText, type ReferenceReading } from './referenceReading';
import { refsForOracle } from './referenceExecution';
import { nestedOracleTables } from '../data/oracles';

export const JOURNEY_SOURCE: SourceReference = {
  bookId: 'sd',
  bookTitle: 'Sölitary Defilement',
  pdfPage: 17,
  printedPage: 15,
  tableTitle: 'Daily travel flowchart',
};
export const CAMPING_SOURCE: SourceReference = {
  bookId: 'sd',
  bookTitle: 'Sölitary Defilement',
  pdfPage: 8,
  printedPage: 6,
  tableTitle: 'Camping, Resting, Catching Breath',
};
export interface CampRoll {
  values: number[];
  modifier: number;
  outcome: 'strong' | 'weak' | 'fail';
  recovery: number;
  retry: boolean;
}
export function rollJourneyTable(
  tableId: string,
  registry: OracleRegistry,
  rng: RandomSource = random,
): OracleResult {
  const table = registry.tables.find((t) => t.id === tableId);
  if (!table) throw new Error('이 절차의 원문 표를 불러오지 못했습니다.');
  const first = rollOracle(table, registry, rng);
  const rolls = [first];
  if (tableId === 'feretory.campsite' && first.roll === 10) {
    const nested = nestedOracleTables(table)[0];
    const canonical =
      nested &&
      (registry.tables.find((candidate) => candidate.id === nested.id) ??
        nested);
    if (!canonical)
      throw new Error('야영 꿈의 d6 원문 표를 불러오지 못했습니다.');
    const result = rollOracle(canonical, registry, rng);
    result.metadata = { ...result.metadata, sourceTableId: tableId };
    rolls.push(result);
  }
  return traceReferenceProcedure(
    { id: id(), title: table.title, rolls },
    tableId,
  );
}
export function rollJourneyActivity(
  mode: 'road' | 'forage',
  registry: OracleRegistry,
  rng: RandomSource = random,
) {
  // An independent road/forage recipe; weather is a separate optional reference.
  return rollTravel(mode, registry, rng, { includeWeather: false });
}
export function rollRoadNavigation(
  modifier: number,
  rng: RandomSource = random,
) {
  if (!Number.isSafeInteger(modifier))
    throw new Error('Presence 또는 남은 Omens를 정수로 입력하세요.');
  const roll = rollDie(20, rng);
  return { roll, modifier, success: roll + modifier >= 10 };
}
export function rollJourneyCamp(
  modifier: number,
  retry = false,
  rng: RandomSource = random,
): CampRoll {
  if (!Number.isSafeInteger(modifier))
    throw new Error('Presence를 정수로 입력하세요.');
  const values = retry
    ? [rollDie(2, rng)]
    : [rollDie(20, rng), rollDie(20, rng)];
  const successes = values.filter((value) => value + modifier >= 12).length;
  const outcome = retry
    ? values[0] === 1
      ? 'strong'
      : 'weak'
    : successes === 2
      ? 'strong'
      : successes === 1
        ? 'weak'
        : 'fail';
  return {
    values,
    modifier,
    outcome,
    recovery:
      outcome === 'fail' ? 0 : rollDie(outcome === 'strong' ? 6 : 4, rng),
    retry,
  };
}
export function journeyOracleReading(
  reading: OracleResult,
  registry: OracleRegistry,
): ReferenceReading {
  return {
    title: reading.title,
    oracle: reading,
    blocks: reading.rolls.map((r) => ({
      title: r.title,
      text: oracleReadingText(r),
      dice: `${r.dice} = ${r.roll}`,
    })),
    sourceRefs: refsForOracle(reading, registry),
  };
}
export function journeyCampReading(camp: CampRoll): ReferenceReading {
  const description =
    camp.outcome === 'strong'
      ? `d6 = ${camp.recovery} HP 회복. 잠을 잤다면 직업의 주사위로 Omens를 다시 정하고 Powers를 회복하며 식량 1개를 사용합니다.`
      : camp.outcome === 'weak'
        ? `d4 = ${camp.recovery} HP 회복. 잠을 잤다면 Omen 1개와 Power 1개를 회복하고 식량 1개를 사용합니다. 뒤척이거나 잠을 방해받은 이유를 정하세요.`
        : '잠을 이루지 못합니다. 끔찍한 사건을 해결하세요. 그 뒤 다음 휴식 시도는 Strong / Weak를 50:50으로 판정합니다.';
  return {
    title: `Camping · ${camp.outcome === 'strong' ? 'STRONG HIT' : camp.outcome === 'weak' ? 'WEAK HIT' : 'MISS'}`,
    blocks: [
      {
        title: '잠과 회복',
        text: description,
        dice: camp.retry
          ? `후속 d2 = ${camp.values[0]}`
          : `2d20 = ${camp.values.join(', ')} · Presence ${camp.modifier >= 0 ? '+' : ''}${camp.modifier} · DR12`,
      },
    ],
    sourceRefs: [CAMPING_SOURCE],
  };
}
