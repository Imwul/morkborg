import test from 'node:test';
import assert from 'node:assert/strict';
import type { OracleDefinition, OracleRegistry } from '../src/domain/oracle.ts';
import {
  readCityCrawlWorkspace,
  writeCityCrawlWorkspace,
  CITY_CRAWL_STORAGE_KEY,
} from '../src/storage/cityCrawlStore.ts';
import { fixedReferenceReading } from '../src/domain/referenceFixedLookup.ts';
import {
  startCityCrawl,
  advanceCityCrawl,
  finishCityScene,
  resolveCityObstacle,
  type CityCrawlConfig,
} from '../src/domain/cityCrawlWorkspace.ts';

const config: CityCrawlConfig = {
  mode: 'city',
  dr: 10,
  modifier: 0,
  allObjectivesMet: false,
  cityOrMetropolis: false,
  includeExits: false,
};
function registry(): OracleRegistry {
  return {
    books: [{ id: 'aitc', title: 'Alöne in the Crowd' }],
    procedures: [],
    tables: [
      ['aitc.street-adjective', 20, 17],
      ['aitc.street-type', 12, 17],
      ['aitc.street-contents', 12, 17],
      ['aitc.street-exits', 4, 17],
      ['aitc.settlement-size', 20, 12],
      ['aitc.city-crawl-failure', 4, 7],
    ].map(
      ([id, sides, page]): OracleDefinition => ({
        id: String(id),
        title: String(id),
        sourceBookId: 'aitc',
        sourcePage: Number(page),
        printedPage: Number(page) - 2,
        dice: `d${sides}`,
        category: 'OTHER',
        tags: [],
        sourceVerified: true,
        entries: Array.from({ length: Number(sides) }, (_, index) => ({
          id: `${id}:${index + 1}`,
          min: index + 1,
          max: index + 1,
          text: `${id} result ${index + 1}`,
        })),
      }),
    ),
  };
}
function dice(...values: [number, number][]) {
  let i = 0;
  return () => {
    assert.ok(i < values.length, 'Unexpected extra roll');
    const [face, sides] = values[i++];
    return (face - 1) / sides;
  };
}
const updates = { modifier: 0, allObjectivesMet: false };

test('City Strong Hit reaches existing objective without generating a random street', () => {
  const state = startCityCrawl(config, registry(), dice([10, 20], [20, 20]));
  assert.equal(state.phase, 'scene');
  assert.equal(state.move?.outcome, 'strong');
  assert.equal(state.move?.metadata.streetAction, 'next-objective');
  assert.equal(state.streetNumber, 0);
  assert.equal(state.reading.oracle, undefined);
  assert.throws(() => advanceCityCrawl(state, registry(), updates), /해결/);
});

test('City Weak Hit rolls the three street components together and gates the next Move', () => {
  const state = startCityCrawl(
    config,
    registry(),
    dice([10, 20], [9, 20], [3, 20], [4, 12], [8, 12]),
  );
  assert.equal(state.streetNumber, 1);
  assert.equal(state.move?.outcome, 'weak');
  assert.equal(state.phase, 'scene');
  assert.deepEqual(
    state.reading.oracle?.rolls.map((roll) => roll.roll),
    [3, 4, 8],
  );
  assert.throws(() => advanceCityCrawl(state, registry(), updates), /해결/);
  const next = advanceCityCrawl(
    finishCityScene(state),
    registry(),
    updates,
    dice([20, 20], [20, 20]),
  );
  assert.equal(next.move?.outcome, 'strong');
  assert.equal(next.streetNumber, 1);
});

test('City Miss rolls obstacle inspiration only; resolving creates a street without another 2d20', () => {
  const data = registry();
  const snapshot = JSON.stringify(data);
  const failed = startCityCrawl(config, data, dice([1, 20], [2, 20], [3, 4]));
  assert.equal(failed.phase, 'blocked');
  assert.equal(failed.streetNumber, 0);
  assert.equal(failed.move?.metadata.followUp?.roll, 3);
  assert.throws(() => finishCityScene(failed), /해결/);
  assert.throws(() => advanceCityCrawl(failed, data, updates), /해결/);
  const resolved = resolveCityObstacle(
    failed,
    data,
    dice([2, 20], [5, 12], [9, 12]),
  );
  assert.equal(resolved.phase, 'scene');
  assert.equal(resolved.streetNumber, 1);
  assert.deepEqual(
    resolved.reading.oracle?.rolls.map((roll) => roll.roll),
    [2, 5, 9],
  );
  assert.throws(() => resolveCityObstacle(resolved, data), /없습니다/);
  assert.equal(JSON.stringify(data), snapshot);
});

test('Micro-crawl rolls d4 once and ends at that fixed count with no City Moves', () => {
  const first = startCityCrawl(
    { ...config, mode: 'micro' },
    registry(),
    dice([2, 4], [1, 20], [2, 12], [3, 12]),
  );
  assert.equal(first.totalStreets, 2);
  assert.equal(first.move, undefined);
  const second = advanceCityCrawl(
    finishCityScene(first),
    registry(),
    updates,
    dice([4, 20], [5, 12], [6, 12]),
  );
  assert.equal(second.streetNumber, 2);
  assert.equal(second.totalStreets, 2);
  const done = finishCityScene(second);
  assert.equal(done.phase, 'complete');
  assert.throws(() => advanceCityCrawl(done, registry(), updates), /해결/);
});

test('Dérive derives size once, uses DR10, and Strong Hit generates a street', () => {
  const state = startCityCrawl(
    { ...config, mode: 'derive', dr: 30 },
    registry(),
    dice([1, 20], [2, 2], [10, 20], [10, 20], [1, 20], [1, 12], [1, 12]),
  );
  assert.equal(state.totalStreets, 3);
  assert.equal(state.move?.dr, 10);
  assert.equal(state.move?.outcome, 'strong');
  assert.equal(state.streetNumber, 1);
});

test('Dérive city size triggers d2 street contents and retains independent rolls', () => {
  const state = startCityCrawl(
    { ...config, mode: 'derive' },
    registry(),
    dice(
      [18, 20],
      [1, 20],
      [10, 20],
      [9, 20],
      [1, 20],
      [1, 12],
      [2, 2],
      [2, 12],
      [3, 12],
    ),
  );
  assert.equal(state.totalStreets, 5);
  assert.equal(state.config.cityOrMetropolis, true);
  assert.deepEqual(
    state.reading.oracle?.rolls.map((roll) => roll.dice),
    ['d20', 'd12', 'd2', 'd12', 'd12'],
  );
});

test('City completed objectives use the Weak Hit street branch even on Strong', () => {
  const state = startCityCrawl(
    { ...config, allObjectivesMet: true },
    registry(),
    dice([20, 20], [20, 20], [1, 20], [1, 12], [1, 12]),
  );
  assert.equal(state.move?.outcome, 'strong');
  assert.equal(state.move?.metadata.streetAction, 'new-street');
  assert.equal(state.streetNumber, 1);
});

test('Unavailable Dérive source fails before rolling or assuming a settlement size', () => {
  const data = registry();
  data.tables.find(
    (table) => table.id === 'aitc.settlement-size',
  )!.sourceVerified = false;
  assert.throws(
    () => startCityCrawl({ ...config, mode: 'derive' }, data, dice()),
    /정착지 규모/,
  );
});

test('Current city scene round-trips without touching campaign storage or accumulating a history', () => {
  const values = new Map([['morkborg-campaign-data', 'unchanged campaign']]);
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  const state = startCityCrawl(
    { ...config, mode: 'micro' },
    registry(),
    dice([2, 4], [1, 20], [1, 12], [1, 12]),
  );
  const snapshot = { config: state.config, state };
  writeCityCrawlWorkspace(snapshot, storage);
  assert.deepEqual(
    JSON.parse(JSON.stringify(readCityCrawlWorkspace(storage))),
    JSON.parse(JSON.stringify(snapshot)),
  );
  const next = advanceCityCrawl(
    finishCityScene(state),
    registry(),
    updates,
    dice([2, 20], [2, 12], [2, 12]),
  );
  writeCityCrawlWorkspace({ config: next.config, state: next }, storage);
  assert.equal(readCityCrawlWorkspace(storage).state?.streetNumber, 2);
  assert.equal(values.get('morkborg-campaign-data'), 'unchanged campaign');
  assert.deepEqual(
    [...values.keys()].sort(),
    [CITY_CRAWL_STORAGE_KEY, 'morkborg-campaign-data'].sort(),
  );
  assert.equal(
    Object.keys(JSON.parse(values.get(CITY_CRAWL_STORAGE_KEY)!)).includes(
      'history',
    ),
    false,
  );
  writeCityCrawlWorkspace({ config, state: null }, storage);
  assert.equal(readCityCrawlWorkspace(storage).state, null);
});

test('Malformed and incompatible city saves reset only this workspace safely', () => {
  const state = startCityCrawl(config, registry(), dice([20, 20], [20, 20]));
  const valid = { schemaVersion: 1, config, state };
  const bad = [
    'broken JSON',
    'null',
    JSON.stringify({ ...valid, schemaVersion: 2 }),
    JSON.stringify({ ...valid, config: { ...config, dr: 'ten' } }),
    JSON.stringify({
      ...valid,
      state: { ...state, phase: 'blocked', move: undefined },
    }),
    JSON.stringify({ ...valid, state: { ...state, phase: 'complete' } }),
    JSON.stringify({
      ...valid,
      state: { ...state, reading: { title: 'bad' } },
    }),
  ];
  for (const raw of bad) {
    const loaded = readCityCrawlWorkspace({ getItem: () => raw });
    assert.equal(loaded.state, null);
    assert.equal(loaded.config.mode, 'city');
  }
  assert.equal(
    readCityCrawlWorkspace({
      getItem: () => {
        throw new Error('Unavailable storage');
      },
    }).state,
    null,
  );
});

test('Fixed source links select the stated row and keep source and follow-up metadata', () => {
  const data = registry();
  data.tables.push({
    id: 'aitc.npc-encounters',
    title: 'NPC Encounters',
    sourceBookId: 'aitc',
    sourcePage: [15, 16],
    printedPage: '13–14',
    dice: 'd66',
    sourceVerified: true,
    category: 'NPC',
    tags: [],
    entries: [
      {
        id: 'guards',
        min: 54,
        max: 54,
        text: 'Guards',
        metadata: { followUpOracleIds: ['core.reaction'] },
      },
      { id: 'other', min: 55, max: 56, text: 'Another encounter' },
    ],
  });
  const reading = fixedReferenceReading(data, {
    oracleId: 'aitc.npc-encounters',
    roll: 54,
  });
  assert.equal(reading.blocks[0].text, 'Guards');
  assert.equal(reading.blocks[0].dice, undefined);
  assert.equal(reading.sourceRefs[0].roll, 54);
  assert.equal(reading.sourceRefs[0].entryId, 'guards');
  assert.deepEqual(reading.sourceRefs[0].pdfPage, [15, 16]);
  assert.deepEqual(reading.relatedIds, ['oracle:core.reaction']);
  assert.throws(
    () =>
      fixedReferenceReading(data, {
        oracleId: 'aitc.npc-encounters',
        roll: 53,
      }),
    /대응하는/,
  );
  assert.throws(
    () => fixedReferenceReading(data, { oracleId: 'missing', roll: 54 }),
    /원문/,
  );
});
