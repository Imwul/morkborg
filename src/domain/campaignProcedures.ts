import type { Campaign, SourceReference } from './types';
import type { MiseryRecord } from './chronicle';
import type { OracleRegistry, OracleResult, OracleRoll } from './oracle';
import { recordEvent } from './chronicleOperations';
import {
  id,
  now,
  random,
  rollDie,
  type RandomSource,
} from '../generators/random';
import {
  diceDomain,
  rollOracle,
  selectOracleEntry,
  sourceLabel,
} from '../generators/oracleRoller';

export const APOCALYPSE_DICE = [100, 20, 10, 6, 2] as const;
export const CALENDAR_SOURCE: SourceReference = {
  bookId: 'core',
  bookTitle: 'MÖRK BORG BARE BONES EDITION',
  tableTitle: 'The Calendar of Nechrubel',
  pdfPage: 17,
  printedPage: 17,
};
export const TERMINAL_MISERY =
  'Psalm VII 7:7 — the campaign has reached its end.';
export const miseryCode = (roll: number | null) =>
  roll == null ? 'MANUAL' : `${Math.floor(roll / 10)}:${roll % 10}`;
export function campaignHasEnded(c: Campaign) {
  return c.miseries.length >= 7 || c.miseries.some((m) => m.terminal);
}
function checkActiveCampaign(c: Campaign) {
  if (campaignHasEnded(c))
    throw new Error(
      '일곱 번째 Misery가 기록되어 있습니다. 기록은 그대로 보존됩니다.',
    );
}
function oracleRef(
  roll: OracleRoll,
  registry: OracleRegistry,
): SourceReference {
  const table = registry.tables.find((t) => t.id === roll.oracleId)!;
  return {
    bookId: table.sourceBookId,
    bookTitle: registry.books.find((b) => b.id === table.sourceBookId)?.title,
    tableId: table.id,
    tableTitle: table.title,
    pdfPage: table.sourcePage,
    printedPage: table.printedPage,
    roll: roll.roll,
    entryId: roll.entryId,
  };
}
export interface MiseryInput {
  roll: number | null;
  result: string;
  sourceRefs?: SourceReference[];
  date?: string;
  inWorldDate?: string;
  sessionId?: string | null;
  notes?: string;
}
/** Recording is explicit; generated campaign content and characters are never altered. */
export function recordMisery(c: Campaign, input: MiseryInput): MiseryRecord {
  checkActiveCampaign(c);
  const terminal = c.miseries.length === 6;
  const roll = terminal ? 77 : input.roll;
  if (
    roll != null &&
    !diceDomain('d66').includes(roll) &&
    !(terminal && roll === 77)
  )
    throw new Error('Misery는 1:1–6:6이며 일곱 번째만 7:7입니다.');
  if (roll != null && c.miseries.some((m) => m.roll === roll))
    throw new Error('같은 Misery는 두 번 발생하지 않습니다.');
  const result = terminal ? TERMINAL_MISERY : input.result.trim();
  if (!result) throw new Error('Misery 내용을 입력하세요.');
  const sessionId =
    input.sessionId === undefined ? c.currentSessionId : input.sessionId;
  if (sessionId && !c.sessions.some((s) => s.id === sessionId))
    throw new Error('연결할 Session을 찾지 못했습니다.');
  const timestamp = now();
  const record: MiseryRecord = {
    id: id(),
    roll,
    result,
    sourceRefs: terminal
      ? [{ ...CALENDAR_SOURCE, pdfPage: [17, 20], printedPage: 20, roll: 77 }]
      : (input.sourceRefs ?? [{ ...CALENDAR_SOURCE }]),
    date: input.date ?? new Date(timestamp).toLocaleDateString('en-CA'),
    inWorldDate: input.inWorldDate ?? `Day ${c.campaignDay}`,
    sessionId,
    notes: input.notes ?? '',
    terminal,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  recordEvent(c, {
    type: 'misery',
    title: `${terminal ? 'VII · ' : ''}Misery ${miseryCode(roll)}`,
    description: `${record.result}${record.notes ? '\n' + record.notes : ''}`,
    date: record.date,
    inWorldDate: record.inWorldDate,
    sessionId,
    sourceRefs: record.sourceRefs,
  });
  c.miseries.push(record);
  return record;
}
/** Select uniformly from the remaining d66 outcomes: equivalent to rerolling repeats. */
export function rollMisery(
  c: Campaign,
  registry: OracleRegistry,
  rng: RandomSource = random,
): MiseryInput {
  checkActiveCampaign(c);
  if (c.miseries.length === 6) return { roll: 77, result: TERMINAL_MISERY };
  const table = registry.tables.find((t) => t.id === 'core.miseries');
  if (
    !table ||
    !table.sourceVerified ||
    table.rollable === false ||
    table.dice !== 'd66'
  )
    throw new Error(
      '확인된 Miseries 원문 표가 준비되지 않았습니다. 수동 기록은 사용할 수 있습니다.',
    );
  const remaining = diceDomain('d66').filter(
    (n) => !c.miseries.some((m) => m.roll === n),
  );
  const value = remaining[rollDie(remaining.length, rng) - 1];
  const entry = selectOracleEntry(table, value);
  if (!entry) throw new Error('이 Misery의 원문이 없습니다.');
  const reading: OracleRoll = {
    oracleId: table.id,
    title: table.title,
    dice: table.dice,
    roll: value,
    diceValues: [Math.floor(value / 10), value % 10],
    entryId: entry.id,
    text: entry.text,
    source: sourceLabel(table, registry),
  };
  return {
    roll: value,
    result: entry.text,
    sourceRefs: [oracleRef(reading, registry)],
  };
}
export const MAX_CAMPAIGN_DAY = 9999999;
/** Dawn checks are mechanical day markers, separate from prose Session dates. */
export function dawnForDay(c: Campaign, day = c.campaignDay) {
  return c.timeline.find(
    (event) =>
      event.type === 'custom' &&
      event.title.startsWith('Dawn · ') &&
      event.inWorldDate === `Day ${day}` &&
      event.sourceRefs.some(
        (ref) =>
          ref.bookId === CALENDAR_SOURCE.bookId &&
          ref.tableTitle === CALENDAR_SOURCE.tableTitle &&
          typeof ref.roll === 'number',
      ),
  );
}
/** Check this day's dawn once, including Day 1 and resumed campaign days. */
export function recordCurrentDawn(
  c: Campaign,
  registry: OracleRegistry,
  rng: RandomSource = random,
) {
  const existing = dawnForDay(c);
  if (existing) return { event: existing, alreadyChecked: true };
  checkActiveCampaign(c);
  if (!c.apocalypseDie || !APOCALYPSE_DICE.includes(c.apocalypseDie))
    throw new Error('그룹이 정한 종말 주사위를 먼저 선택하세요.');
  const value = rollDie(c.apocalypseDie, rng);
  const next = value === 1 ? rollMisery(c, registry, rng) : null;
  const event = recordEvent(c, {
    type: 'custom',
    title: `Dawn · d${c.apocalypseDie} = ${value}`,
    inWorldDate: `Day ${c.campaignDay}`,
    description: value === 1 ? 'Misery가 발생했습니다.' : '새벽이 밝았습니다.',
    sourceRefs: [{ ...CALENDAR_SOURCE, roll: value }],
  });
  if (next) recordMisery(c, next);
  return { event, alreadyChecked: false };
}
/** Correct a resumed campaign's clock without rolling or rewriting existing records. */
export function setCampaignDay(c: Campaign, day: number): void {
  if (!Number.isInteger(day) || day < 1 || day > MAX_CAMPAIGN_DAY)
    throw new Error('캠페인 날짜는 1–9,999,999 사이의 정수입니다.');
  if (c.campaignDay === day) return;
  const previous = c.campaignDay;
  c.campaignDay = day;
  recordEvent(c, {
    type: 'custom',
    title: `Calendar · Day ${previous} → Day ${day}`,
    description: '캠페인 날짜를 직접 조정했습니다.',
    inWorldDate: `Day ${day}`,
  });
}
/** Advance to the next dawn and persist its die roll even if no Misery occurs. */
export function recordDawn(
  c: Campaign,
  registry: OracleRegistry,
  rng: RandomSource = random,
) {
  checkActiveCampaign(c);
  if (!c.apocalypseDie || !APOCALYPSE_DICE.includes(c.apocalypseDie))
    throw new Error('그룹이 정한 종말 주사위를 먼저 선택하세요.');
  if (c.campaignDay >= MAX_CAMPAIGN_DAY)
    throw new Error('기록 가능한 마지막 날짜입니다. 캠페인 날짜를 확인하세요.');
  const value = rollDie(c.apocalypseDie, rng);
  // Resolve source availability before changing the date.
  const next = value === 1 ? rollMisery(c, registry, rng) : null;
  c.campaignDay += 1;
  const event = recordEvent(c, {
    type: 'custom',
    title: `Dawn · d${c.apocalypseDie} = ${value}`,
    inWorldDate: `Day ${c.campaignDay}`,
    description: value === 1 ? 'Misery가 발생했습니다.' : '새벽이 밝았습니다.',
    sourceRefs: [{ ...CALENDAR_SOURCE, roll: value }],
  });
  const misery = next ? recordMisery(c, next) : null;
  return { event, roll: value, misery };
}

/** A stale day-completion handler must never advance a second dawn. */
export function recordNextJourneyDawn(
  c: Campaign,
  expectedDay: number,
  registry: OracleRegistry,
  rng: RandomSource = random,
) {
  if (c.campaignDay !== expectedDay)
    throw new Error('이미 다음 날로 이동했습니다. 현재 날짜를 확인하세요.');
  return recordDawn(c, registry, rng);
}

export type TravelAction = 'road' | 'forage' | 'camp' | 'off-road';
export const TRAVEL_ACTIONS: { value: TravelAction; label: string }[] = [
  { value: 'road', label: '여행일 · ROAD' },
  { value: 'forage', label: '보급 · FORAGE' },
  { value: 'camp', label: '야영 · CAMP' },
  { value: 'off-road', label: '길 밖 · OFF ROAD' },
];
/** Only these two pairs map the application's region labels to both named PDF endpoints. */
export function knownRouteDice(
  from: string,
  to: string,
): { sides: number; modifier: number } | null {
  const pair = [from, to].sort().join('|');
  if (pair === 'galgenbeck|graven-tosk') return { sides: 6, modifier: 6 };
  if (pair === 'galgenbeck|valley-undead') return { sides: 6, modifier: 5 };
  return null;
}
export function rollRouteDuration(
  from: string,
  to: string,
  rng: RandomSource = random,
) {
  const route = knownRouteDice(from, to);
  if (!route)
    throw new Error(
      '이 지역 조합의 거리 주사위는 지도에 없습니다. 여행일을 직접 정하세요.',
    );
  const value = rollDie(route.sides, rng);
  return {
    days: value + route.modifier,
    roll: value,
    dice: `d${route.sides}+${route.modifier}`,
  };
}
function sourceRoll(
  tableId: string,
  registry: OracleRegistry,
  rng: RandomSource,
) {
  const table = registry.tables.find((t) => t.id === tableId);
  if (!table) throw new Error('여행 원문 표가 아직 준비되지 않았습니다.');
  return rollOracle(table, registry, rng);
}
/** A source-backed prompt, not automatic travel/HP/resource resolution. */
export function rollTravel(
  action: TravelAction,
  registry: OracleRegistry,
  rng: RandomSource = random,
  options: { includeWeather?: boolean } = {},
): OracleResult {
  const ids =
    action === 'road'
      ? [
          ...(options.includeWeather === false ? [] : ['core.weather']),
          'feretory.roadType',
          'feretory.roadEvent',
        ]
      : action === 'forage'
        ? ['feretory.forage']
        : action === 'camp'
          ? ['feretory.campsite']
          : ['feretory.leaveRoad'];
  const rolls = ids.map((tableId) => sourceRoll(tableId, registry, rng));
  if (action === 'road') {
    let event = rolls[rolls.length - 1];
    let attempts = 0;
    while (event.roll === 7 || event.roll === 8) {
      if (++attempts > 64)
        throw new Error('길의 갈림길이 반복되었습니다. 다시 굴려 주세요.');
      event = sourceRoll('feretory.roadEvent', registry, rng);
      rolls.push(event);
    }
    if (event.roll === 5 || event.roll === 6)
      rolls.push(sourceRoll('core.weather', registry, rng));
  }
  if (action === 'forage' && rolls[0].roll >= 5)
    rolls.push(sourceRoll('feretory.village', registry, rng));
  return {
    id: id(),
    title: TRAVEL_ACTIONS.find((a) => a.value === action)!.label,
    rolls,
  };
}
export const ONE_OFF_ROAD_EVENTS = [10, 11, 12, 16, 18, 19];
export function travelNeedsReplacement(
  c: Campaign,
  reading: OracleResult,
): boolean {
  return reading.rolls.some(
    (r) =>
      r.oracleId === 'feretory.roadEvent' &&
      ONE_OFF_ROAD_EVENTS.includes(r.roll) &&
      c.timeline.some(
        (e) =>
          e.type === 'travel' &&
          e.oracle?.rolls.some(
            (old) => old.oracleId === r.oracleId && old.roll === r.roll,
          ),
      ),
  );
}
export function recordTravel(
  c: Campaign,
  input: {
    from: string;
    to: string;
    days?: number;
    action: TravelAction;
    reading: OracleResult;
    notes?: string;
  },
  registry: OracleRegistry,
) {
  if (!input.from.trim() || !input.to.trim())
    throw new Error('출발지와 목적지를 선택하세요.');
  if (input.days != null && (!Number.isInteger(input.days) || input.days < 1))
    throw new Error('여행일은 1 이상의 정수입니다.');
  if (travelNeedsReplacement(c, input.reading) && !input.notes?.trim())
    throw new Error(
      '이미 사용한 일회성 도로 사건입니다. 대신 일어날 사건을 메모에 적어 주세요.',
    );
  return recordEvent(c, {
    type: 'travel',
    inWorldDate: `Day ${c.campaignDay}`,
    title: `${input.from} → ${input.to} · ${input.reading.title}`,
    description: [
      input.days == null ? '' : `계획한 여행: ${input.days}일`,
      ...input.reading.rolls.map(
        (r) => `${r.title} · ${r.dice}=${r.roll}\n${r.text}`,
      ),
      input.notes ?? '',
    ]
      .filter(Boolean)
      .join('\n\n'),
    oracle: input.reading,
    sourceRefs: [
      {
        bookId: 'feretory',
        bookTitle: 'MÖRK BORG CULT: FERETORY',
        tableTitle: 'Roads to Damnation',
        pdfPage: [6, 7, 8, 9],
        printedPage: '4–7',
      },
      ...input.reading.rolls.map((r) => oracleRef(r, registry)),
    ],
  });
}
