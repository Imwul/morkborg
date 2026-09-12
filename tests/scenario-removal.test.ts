import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import {
  SCENARIO_TABLE_IDS,
  isScenarioTable,
  isScenarioReference,
} from '../src/data/scenarioExclusions.ts';
import { parsePrivateData } from '../src/storage/privateDataImport.ts';
import {
  buildReferenceRegistry,
  searchReferences,
} from '../src/domain/references.ts';
import {
  rollOracle,
  selectOracleEntry,
} from '../src/generators/oracleRoller.ts';
import { validateOracleRegistry } from '../src/validation/oracleValidation.ts';
import {
  readReferencePreferences,
  REFERENCE_PREFERENCES_KEY,
} from '../src/storage/referencePreferences.ts';
import {
  readOraclePreferences,
  ORACLE_PREFERENCES_KEY,
} from '../src/storage/oraclePreferences.ts';
import {
  readPlaySession,
  PLAY_SESSION_KEY,
  readConveniencePreferences,
  CONVENIENCE_KEY,
} from '../src/storage/conveniencePreferences.ts';

const fixture = JSON.parse(
  readFileSync('outputs/morkborg-private-data.json', 'utf8'),
);

test('all 28 scenario tables and their combined roll disappear from every active registry route', () => {
  const registry = buildOracleRegistry(fixture.library, fixture.oracles);
  const index = buildReferenceRegistry(registry, fixture.library);
  assert.equal(SCENARIO_TABLE_IDS.length, 28);
  assert.equal(registry.tables.length, 546);
  assert.equal(index.entries.length, 1000);
  for (const id of SCENARIO_TABLE_IDS) {
    assert.ok(!registry.tables.some((t) => t.id === id), id);
    assert.equal(index.byId[`oracle:${id}`], undefined, id);
  }
  assert.equal(index.byId['procedure:heretic.graves-loot-bodies'], undefined);
  for (const entry of index.entries)
    assert.ok(
      entry.relatedIds.every((id) => !isScenarioReference(id)),
      entry.id,
    );
  assert.deepEqual(validateOracleRegistry(registry), []);
  for (const query of [
    'Rotblack',
    'Graves Left Wanting',
    'Alchemy Tables',
    'Scumslaughter',
    'Nurse the Rot',
  ])
    assert.ok(
      searchReferences(index, query).every((e) => e.kind !== 'oracle'),
      query,
    );
  for (const id of [
    'core.reaction',
    'core.miseries',
    'core.corpsePlundering',
    'core.treasures',
    'sd.room.contents',
    'feretory.roadEvent',
    'depths.traps.special',
  ])
    assert.ok(
      registry.tables.some((t) => t.id === id),
      id,
    );
});

test('archival imports cannot restore scenario rolls and preserve creatures, books and source text', () => {
  const before = JSON.stringify(fixture);
  const parsed = parsePrivateData(fixture);
  assert.deepEqual(parsePrivateData({ ...fixture, ...parsed }), parsed);
  assert.equal(Object.keys(parsed.library!.tables).length, 186);
  assert.equal(parsed.oracles!.tables.length, 349);
  assert.ok(
    Object.keys(parsed.library!.tables).every((id) => !isScenarioTable(id)),
  );
  assert.ok(parsed.oracles!.tables.every((t) => !isScenarioTable(t.id)));
  assert.deepEqual(parsed.library!.creatures, fixture.library.creatures);
  assert.deepEqual(parsed.library!.books, fixture.library.books);
  for (const t of parsed.oracles!.tables)
    assert.deepEqual(
      t.entries,
      fixture.oracles.tables
        .find((old: { id: string }) => old.id === t.id)
        .entries.map((entry: Record<string, unknown>) =>
          Object.fromEntries(
            Object.entries(entry).filter(([key]) => key !== 'printedRange'),
          ),
        ),
    );
  assert.equal(JSON.stringify(fixture), before);
});

test('stale scenario roll objects cannot roll or perform manual lookup', () => {
  const table = fixture.oracles.tables.find(
    (t: { id: string }) => t.id === 'feretory.alchemyTables',
  );
  let draws = 0;
  assert.throws(
    () =>
      rollOracle(table, { books: [], tables: [table], procedures: [] }, () => {
        draws++;
        return 0;
      }),
    /제거된/,
  );
  assert.throws(() => selectOracleEntry(table, 1), /제거된/);
  assert.equal(draws, 0);
});

test('old bookmarks, recents, tray and custom collections discard only removed scenario shortcuts', () => {
  const removed = 'oracle:heretic.gravesKnowledge',
    kept = 'oracle:core.reaction';
  const values = {
    [REFERENCE_PREFERENCES_KEY]: {
      schemaVersion: 1,
      pinnedIds: [removed, kept],
      recentIds: [removed, kept],
    },
    [ORACLE_PREFERENCES_KEY]: {
      schemaVersion: 1,
      favoriteIds: ['heretic.gravesKnowledge', 'core.reaction'],
    },
    [PLAY_SESSION_KEY]: {
      schemaVersion: 1,
      tray: [removed, kept],
      scratch: 'Keep my written notes',
      lastRoll: {
        kind: 'reference',
        id: removed,
        mode: 'APP_ROLL',
        parameters: {},
      },
    },
    [CONVENIENCE_KEY]: {
      schemaVersion: 1,
      recipes: [
        {
          id: 'mine',
          name: 'Mine',
          referenceIds: [removed, kept],
          createdAt: '',
        },
      ],
      packs: [
        {
          id: 'mine',
          name: 'Mine',
          referenceIds: [removed, kept],
          userCreated: true,
        },
      ],
    },
  };
  const reader = {
    getItem: (key: string) =>
      JSON.stringify(values[key as keyof typeof values]),
  };
  const preferences = readReferencePreferences(reader);
  assert.deepEqual(preferences.pinnedIds, [kept]);
  assert.deepEqual(preferences.recentIds, [kept]);
  assert.deepEqual(readOraclePreferences(reader).favoriteIds, [
    'core.reaction',
  ]);
  const session = readPlaySession(reader);
  assert.deepEqual(session.tray, [kept]);
  assert.equal(session.scratch, 'Keep my written notes');
  assert.equal(session.lastRoll, null);
  const convenience = readConveniencePreferences(reader);
  assert.deepEqual(convenience.recipes[0].referenceIds, [kept]);
  assert.deepEqual(convenience.packs[0].referenceIds, [kept]);
});
