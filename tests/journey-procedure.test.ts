import test from 'node:test';
import assert from 'node:assert/strict';
import type { OracleDefinition, OracleRegistry } from '../src/domain/oracle.ts';
import { createCampaign } from '../src/generators/index.ts';
import { parseImport } from '../src/storage/schema.ts';
import { diceDomain } from '../src/generators/oracleRoller.ts';
import {
  dawnForDay,
  recordCurrentDawn,
  recordDawn,
  recordNextJourneyDawn,
  setCampaignDay,
} from '../src/domain/campaignProcedures.ts';
import {
  emptyJourneyDay,
  consumeJourneyRoadEvents,
  journeyRepeatedRoadEvent,
  readJourneyDay,
  journeyRoadNeedsCheck,
  journeyReadyForEncounters,
  journeyReadyToFinish,
  rollJourneyActivity,
  rollJourneyTable,
  rollRoadNavigation,
  rollJourneyCamp,
  journeyCampReading,
} from '../src/domain/journeyProcedure.ts';
const table = (id: string, dice: string): OracleDefinition => ({
  id,
  title: id,
  dice,
  sourceBookId: id.split('.')[0],
  sourcePage: 1,
  sourceVerified: true,
  category: 'OTHER',
  tags: [],
  entries: diceDomain(dice).map((n) => ({
    id: `${id}:${n}`,
    min: n,
    max: n,
    text: `Fixture ${n}`,
  })),
});
const registry: OracleRegistry = {
  books: [],
  procedures: [],
  tables: [
    table('core.miseries', 'd66'),
    table('core.weather', 'd12'),
    table('feretory.roadType', 'd8'),
    table('feretory.roadEvent', 'd20'),
    table('feretory.forage', 'd6'),
    table('feretory.village', 'd6'),
    table('feretory.leaveRoad', 'd12'),
    table('feretory.campsite', 'd12'),
  ],
};
const sequence = (...values: number[]) => {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
};
test('current dawn checks Day1 once, including a Misery, without advancing or spending RNG twice', () => {
  const c = createCampaign('Day1');
  c.apocalypseDie = 6;
  const first = recordCurrentDawn(c, registry, () => 0);
  assert.equal(c.campaignDay, 1);
  assert.equal(first.alreadyChecked, false);
  assert.equal(c.miseries.length, 1);
  const snapshot = JSON.stringify(c);
  const second = recordCurrentDawn(c, registry, () => {
    throw Error('Duplicate RNG');
  });
  assert.equal(second.alreadyChecked, true);
  assert.equal(JSON.stringify(c), snapshot);
  assert.equal(dawnForDay(c)?.id, first.event.id);
  const imported = parseImport(
    JSON.stringify({ schemaVersion: 6, campaign: c }),
  )[0];
  recordCurrentDawn(imported, registry, () => {
    throw Error('Reload RNG');
  });
  assert.equal(imported.timeline.length, 2);
});
test('existing NEXT DAWN is recognized and stale next-day handlers cannot advance twice', () => {
  const c = createCampaign('Resume');
  c.apocalypseDie = 20;
  recordDawn(c, registry, () => 0.5);
  recordCurrentDawn(c, registry, () => {
    throw Error('Second dawn');
  });
  assert.equal(c.campaignDay, 2);
  recordNextJourneyDawn(c, 2, registry, () => 0.5);
  const before = JSON.stringify(c);
  assert.throws(() => recordNextJourneyDawn(c, 2, registry, () => 0), /이미/);
  assert.equal(JSON.stringify(c), before);
  setCampaignDay(c, 12);
  recordCurrentDawn(c, registry, () => 0.5);
  assert.equal(c.campaignDay, 12);
  assert.equal(dawnForDay(c)?.inWorldDate, 'Day 12');
});
test('missing Misery source leaves current-day calendar completely intact', () => {
  const c = createCampaign('Missing');
  c.apocalypseDie = 2;
  const before = JSON.stringify(c);
  assert.throws(() =>
    recordCurrentDawn(c, { ...registry, tables: [] }, () => 0),
  );
  assert.equal(JSON.stringify(c), before);
});
test('daily road action does not repeat morning weather; fork and changed weather remain source-directed', () => {
  assert.deepEqual(
    rollJourneyActivity('road', registry, sequence(0, 0)).rolls.map(
      (r) => r.oracleId,
    ),
    ['feretory.roadType', 'feretory.roadEvent'],
  );
  const chain = rollJourneyActivity(
    'road',
    registry,
    sequence(0, 0.31, 0.21, 0.5),
  );
  assert.deepEqual(
    chain.rolls.map((r) => r.roll),
    [1, 7, 5, 7],
  );
  assert.equal(chain.rolls.at(-1)?.oracleId, 'core.weather');
  const forage = rollJourneyActivity('forage', registry, () => 0.99);
  assert.deepEqual(
    forage.rolls.map((r) => r.oracleId),
    ['feretory.forage', 'feretory.village'],
  );
});
test('only animal tracks and disrepair trigger the single d20 DR10 road test', () => {
  for (let road = 1; road <= 8; road++) {
    const result = rollJourneyActivity(
      'road',
      registry,
      sequence((road - 1) / 8, 0),
    );
    assert.equal(journeyRoadNeedsCheck(result), [3, 4, 5].includes(road));
  }
  let calls = 0;
  assert.deepEqual(
    rollRoadNavigation(2, () => {
      calls++;
      return 0.35;
    }),
    { roll: 8, modifier: 2, success: true },
  );
  assert.equal(calls, 1);
  assert.equal(rollRoadNavigation(2, () => 0.3).success, false);
  assert.throws(() => rollRoadNavigation(NaN));
});
test('encounter gate requires dawn prerequisites, applicable road test, wilderness result and daily discovery', () => {
  const day = emptyJourneyDay(4);
  assert.equal(journeyReadyForEncounters(day), false);
  day.weather = rollJourneyTable('core.weather', registry, () => 0);
  day.activity = rollJourneyActivity('road', registry, sequence(0.3, 0));
  day.discovery = 8;
  assert.equal(journeyReadyForEncounters(day), false);
  day.navigation = rollRoadNavigation(0, () => 0);
  assert.equal(journeyReadyForEncounters(day), false);
  day.wilderness = rollJourneyTable('feretory.leaveRoad', registry, () => 0);
  assert.equal(journeyReadyForEncounters(day), true);
  day.discovery = null;
  assert.equal(journeyReadyForEncounters(day), false);
  const foraging = {
    ...emptyJourneyDay(4),
    weather: day.weather,
    mode: 'forage' as const,
    activity: rollJourneyActivity('forage', registry, () => 0),
  };
  assert.equal(journeyReadyForEncounters(foraging), true);
});
test('camping compares independent d20s to DR12; failure recovery requires a distinct 50:50 retry', () => {
  const strong = rollJourneyCamp(2, false, sequence(0.45, 0.45, 0.99));
  assert.equal(strong.outcome, 'strong');
  assert.equal(strong.recovery, 6);
  const weak = rollJourneyCamp(2, false, sequence(0.45, 0, 0.99));
  assert.equal(weak.outcome, 'weak');
  assert.equal(weak.recovery, 4);
  let calls = 0;
  const fail = rollJourneyCamp(0, false, () => {
    calls++;
    return 0;
  });
  assert.equal(fail.outcome, 'fail');
  assert.equal(fail.recovery, 0);
  assert.equal(calls, 2);
  assert.equal(rollJourneyCamp(-3, true, sequence(0, 0.99)).outcome, 'strong');
  assert.equal(rollJourneyCamp(99, true, sequence(0.99, 0)).outcome, 'weak');
  assert.match(journeyCampReading(weak).blocks[0].text, /Omen 1개/);
  assert.match(journeyCampReading(fail).blocks[0].text, /50:50/);
});
test('resumable daily worksheet retains results across reload and discards stale day without affecting campaign', () => {
  const day = emptyJourneyDay(9);
  day.weather = rollJourneyTable('core.weather', registry, () => 0);
  day.mode = 'forage';
  day.activity = rollJourneyActivity('forage', registry, () => 0);
  day.encountersResolved = true;
  day.campsite = rollJourneyTable('feretory.campsite', registry, () => 0);
  day.camp = rollJourneyCamp(0, false, () => 0.99);
  assert.equal(journeyReadyToFinish(day), true);
  day.completed = true;
  assert.deepEqual(
    readJourneyDay(JSON.stringify(day), 9),
    JSON.parse(JSON.stringify(day)),
  );
  assert.deepEqual(
    readJourneyDay(JSON.stringify(day), 10),
    emptyJourneyDay(10),
  );
  assert.deepEqual(readJourneyDay('{broken', 9), emptyJourneyDay(9));
  day.camp = rollJourneyCamp(0, false, () => 0);
  assert.equal(journeyReadyToFinish(day), false);
});

test('campsite dream result follows its canonical embedded d6 table and preserves parent provenance', () => {
  const pack = structuredClone(registry);
  const entry = pack.tables
    .find((t) => t.id === 'feretory.campsite')!
    .entries.find((e) => e.min === 10)!;
  entry.metadata = {
    subtable: {
      id: 'dream',
      title: 'Dream',
      dice: 'd6',
      entries: [{ min: 1, max: 6, text: 'A source dream' }],
    },
  };
  const result = rollJourneyTable(
    'feretory.campsite',
    pack,
    sequence(0.75, 0.99),
  );
  assert.equal(result.rolls.length, 2);
  assert.equal(result.rolls[1].roll, 6);
  assert.equal(result.rolls[1].text, 'A source dream');
  assert.equal(result.rolls[1].metadata?.sourceTableId, 'feretory.campsite');
  assert.throws(
    () => rollJourneyTable('feretory.campsite', registry, () => 0.75),
    /원문/,
  );
});

test('region routing and navigation ability persist while the next day drops old dice', () => {
  const day = {
    ...emptyJourneyDay(1),
    region: 'kergus' as const,
    navigationAbility: 'omens' as const,
    weather: rollJourneyTable('core.weather', registry, () => 0),
  };
  const resumed = readJourneyDay(JSON.stringify(day), 1);
  assert.equal(resumed.region, 'kergus');
  assert.equal(resumed.navigationAbility, 'omens');
  const next = readJourneyDay(JSON.stringify(day), 2);
  assert.equal(next.region, 'kergus');
  assert.equal(next.weather, null);
  assert.equal(next.discovery, null);
});

test('consumed one-off road rows persist mechanically across days and flag a later reuse', () => {
  let day = emptyJourneyDay(1);
  day.activity = rollJourneyActivity('road', registry, sequence(0, 0.45));
  assert.equal(journeyRepeatedRoadEvent(day), false);
  day = consumeJourneyRoadEvents(day);
  assert.deepEqual(day.usedRoadEvents, [10]);
  const next = readJourneyDay(JSON.stringify(day), 2);
  assert.deepEqual(next.usedRoadEvents, [10]);
  next.activity = rollJourneyActivity('road', registry, sequence(0, 0.45));
  assert.equal(journeyRepeatedRoadEvent(next), true);
  assert.deepEqual(consumeJourneyRoadEvents(next).usedRoadEvents, [10]);
  next.activity = rollJourneyActivity('road', registry, sequence(0, 0));
  assert.equal(journeyRepeatedRoadEvent(next), false);
});
