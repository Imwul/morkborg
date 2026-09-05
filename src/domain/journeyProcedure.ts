import { z } from 'zod';
import type { OracleRegistry, OracleResult } from './oracle';
import { REGION_IDS, type SourceReference } from './types';
import { id, random, rollDie, type RandomSource } from '../generators/random';
import { rollOracle } from '../generators/oracleRoller';
import { ONE_OFF_ROAD_EVENTS, rollTravel } from './campaignProcedures';
import { oracleReadingText, type ReferenceReading } from './referenceReading';
import { refsForOracle } from './referenceExecution';

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
const oracleRollSchema = z.object({
  oracleId: z.string(),
  title: z.string(),
  dice: z.string(),
  roll: z.number(),
  diceValues: z.array(z.number()),
  entryId: z.string().nullable(),
  text: z.string(),
  source: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});
const oracleResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  rolls: z.array(oracleRollSchema),
});
const campingSchema = z.object({
  values: z.array(z.number().int().min(1).max(20)),
  modifier: z.number().int(),
  outcome: z.enum(['strong', 'weak', 'fail']),
  recovery: z.number().int().min(0).max(6),
  retry: z.boolean(),
});
const stateSchema = z.object({
  version: z.literal(1),
  day: z.number().int().positive(),
  region: z.enum(REGION_IDS).default('sarkash'),
  navigationAbility: z.enum(['presence', 'omens']).default('presence'),
  usedRoadEvents: z
    .array(
      z
        .number()
        .int()
        .refine((value) => ONE_OFF_ROAD_EVENTS.includes(value)),
    )
    .default([]),
  weather: oracleResultSchema.nullable(),
  mode: z.enum(['road', 'forage']),
  activity: oracleResultSchema.nullable(),
  navigation: z
    .object({
      roll: z.number().int().min(1).max(20),
      modifier: z.number().int(),
      success: z.boolean(),
    })
    .nullable(),
  wilderness: oracleResultSchema.nullable(),
  discovery: z.number().int().min(1).max(8).nullable(),
  encountersResolved: z.boolean(),
  campsite: oracleResultSchema.nullable(),
  camp: campingSchema.nullable(),
  interruptionResolved: z.boolean(),
  completed: z.boolean(),
});
export type JourneyDay = z.infer<typeof stateSchema>;
export type CampRoll = z.infer<typeof campingSchema>;
/** One resumable play worksheet per campaign, not a campaign-history collection. */
export function emptyJourneyDay(day: number): JourneyDay {
  return {
    version: 1,
    day,
    region: 'sarkash',
    navigationAbility: 'presence',
    usedRoadEvents: [],
    weather: null,
    mode: 'road',
    activity: null,
    navigation: null,
    wilderness: null,
    discovery: null,
    encountersResolved: false,
    campsite: null,
    camp: null,
    interruptionResolved: false,
    completed: false,
  };
}
export const journeyStorageKey = (campaignId: string) =>
  `morkborg.journey.v1.${campaignId}`;
export function readJourneyDay(raw: string | null, day: number): JourneyDay {
  try {
    const value = stateSchema.parse(JSON.parse(raw ?? 'null'));
    return value.day === day
      ? value
      : {
          ...emptyJourneyDay(day),
          region: value.region,
          usedRoadEvents: value.usedRoadEvents,
        };
  } catch {
    return emptyJourneyDay(day);
  }
}
export function journeyRepeatedRoadEvent(state: JourneyDay) {
  return !!state.activity?.rolls.some(
    (roll) =>
      roll.oracleId === 'feretory.roadEvent' &&
      state.usedRoadEvents.includes(roll.roll),
  );
}
/** Only the handful of crossed-out road rows are retained; no journey prose. */
export function consumeJourneyRoadEvents(state: JourneyDay): JourneyDay {
  const used =
    state.activity?.rolls
      .filter(
        (roll) =>
          roll.oracleId === 'feretory.roadEvent' &&
          ONE_OFF_ROAD_EVENTS.includes(roll.roll),
      )
      .map((roll) => roll.roll) ?? [];
  return {
    ...state,
    encountersResolved: true,
    usedRoadEvents: [...new Set([...state.usedRoadEvents, ...used])].sort(
      (a, b) => a - b,
    ),
  };
}
export function journeyRoadNeedsCheck(reading: OracleResult | null): boolean {
  return !!reading?.rolls.some(
    (r) => r.oracleId === 'feretory.roadType' && [3, 4, 5].includes(r.roll),
  );
}
export function journeyReadyForEncounters(state: JourneyDay) {
  if (!state.weather || !state.activity) return false;
  if (journeyRoadNeedsCheck(state.activity) && !state.navigation) return false;
  if (state.navigation?.success === false && !state.wilderness) return false;
  return state.mode !== 'road' || state.discovery != null;
}
export function journeyReadyToFinish(state: JourneyDay) {
  return (
    journeyReadyForEncounters(state) &&
    state.encountersResolved &&
    !!state.campsite &&
    !!state.camp &&
    state.camp.outcome !== 'fail'
  );
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
    const sub = z
      .object({
        id: z.string(),
        title: z.string(),
        dice: z.literal('d6'),
        entries: z.array(
          z.object({
            min: z.number().int(),
            max: z.number().int(),
            text: z.string(),
          }),
        ),
      })
      .safeParse(first.metadata?.subtable);
    if (!sub.success)
      throw new Error('야영 꿈의 d6 원문 표를 불러오지 못했습니다.');
    const result = rollOracle(
      {
        ...table,
        id: `${tableId}.${sub.data.id}`,
        title: sub.data.title,
        dice: sub.data.dice,
        entries: sub.data.entries.map((entry, index) => ({
          ...entry,
          id: `${tableId}.${sub.data.id}:${index}`,
        })),
      },
      registry,
      rng,
    );
    result.metadata = { ...result.metadata, sourceTableId: tableId };
    rolls.push(result);
  }
  return { id: id(), title: table.title, rolls };
}
export function rollJourneyActivity(
  mode: 'road' | 'forage',
  registry: OracleRegistry,
  rng: RandomSource = random,
) {
  // Weather is already the preceding block. Event 5–6 still rolls a documented change.
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
