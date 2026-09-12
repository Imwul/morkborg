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
test('situational tracks / broken road test is callable without a journey or prior roll', () => {
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
