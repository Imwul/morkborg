import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import type { OracleDefinition, OracleRegistry } from '../src/domain/oracle.ts';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { parseRulesPack } from '../src/storage/rulesStore.ts';
import { parseOraclePack } from '../src/storage/oracleStore.ts';
import { importPrivateData } from '../src/storage/privateDataImport.ts';
import { validateOracleRegistry } from '../src/validation/oracleValidation.ts';
import { rollOracle } from '../src/generators/oracleRoller.ts';
import { rollCityMove } from '../src/domain/cityProcedures.ts';
import { cityCrawlMoveReading } from '../src/domain/cityCrawlWorkspace.ts';
import {
  PENDING_LIBRARY_ORACLE_IDS,
  assertOracleEntryDependenciesAvailable,
} from '../src/domain/oracleDependencies.ts';

const available = ['library', 'oracles'].every((name) =>
  existsSync(`public/rules/${name}.json`),
);
const library = available
  ? parseRulesPack(
      JSON.parse(readFileSync('public/rules/library.json', 'utf8')),
    )
  : null;
const oracles = available
  ? parseOraclePack(
      JSON.parse(readFileSync('public/rules/oracles.json', 'utf8')),
    )
  : null;
const partial = buildOracleRegistry(null, oracles);
const complete = buildOracleRegistry(library, oracles);
const local = (name: string, run: () => void | Promise<void>) =>
  test(name, { skip: !available }, run);

local(
  'Oracle-only import defers exactly the audited library dependencies; default validation stays strict',
  () => {
    assert.deepEqual(
      validateOracleRegistry(partial, { libraryAbsent: true }),
      [],
    );
    assert.equal(validateOracleRegistry(partial).length, 35);
    assert.deepEqual(validateOracleRegistry(complete), []);
    const missingIds = new Set(
      partial.tables.flatMap((table) =>
        table.entries.flatMap((entry) =>
          ((entry.metadata?.followUpOracleIds ?? []) as string[]).filter(
            (id) => !partial.tables.some((target) => target.id === id),
          ),
        ),
      ),
    );
    assert.deepEqual(
      [...missingIds].sort(),
      [...PENDING_LIBRARY_ORACLE_IDS].sort(),
    );
    for (const id of missingIds) assert.ok(library!.tables[id], id);
  },
);

local(
  'Missing Oracle-owned targets remain errors when the library is absent',
  () => {
    const removed = {
      ...partial,
      tables: partial.tables.filter((table) => table.id !== 'aitc.animals'),
    };
    assert.ok(
      validateOracleRegistry(removed, { libraryAbsent: true }).some((issue) =>
        issue.includes('aitc.animals'),
      ),
    );
  },
);

local(
  'Unknown, spoofed and changed source dependencies never reach persistence',
  async () => {
    let writes = 0;
    const persist = async () => {
      writes++;
    };
    for (const mutation of [
      'unknown-target',
      'changed-wording',
      'spoofed-table',
      'invalid-lookup',
    ] as const) {
      const input = structuredClone(oracles!);
      const table = input.tables.find(
        (candidate) => candidate.id === 'aitc.stash-weak',
      )!;
      const entry = table.entries.find(
        (candidate) => candidate.id === 'aitc.stash-weak:5-6',
      )!;
      if (mutation === 'unknown-target')
        entry.metadata!.followUpOracleIds = ['sd.not-a-source-table'];
      if (mutation === 'changed-wording') entry.text += ' altered';
      if (mutation === 'spoofed-table') table.id = 'test.spoofed-aitc';
      if (mutation === 'invalid-lookup')
        entry.metadata!.fixedLookups = [
          { oracleId: 'sd.stockCreatures', roll: 999 },
        ];
      await assert.rejects(
        importPrivateData([input], persist),
        /Oracle 자료를 확인하세요/,
        mutation,
      );
    }
    assert.equal(writes, 0);
  },
);

local(
  'Pending selected branches refuse generation without rerolling; independent branches remain usable',
  () => {
    const table = partial.tables.find(
      (candidate) => candidate.id === 'aitc.stash-weak',
    )!;
    let calls = 0;
    assert.throws(
      () =>
        rollOracle(table, partial, () => {
          calls++;
          return 0.999;
        }),
      /SOURCE DATA UNAVAILABLE: sd.npc.disposition, sd.npc.profession/,
    );
    assert.equal(calls, 1);
    assert.equal(rollOracle(table, partial, () => 0).roll, 1);
    assert.equal(rollOracle(table, complete, () => 0.999).roll, 6);
  },
);

local(
  'Importing the later library resolves pending dependencies without changing the Oracle source pack',
  async () => {
    const imported = await importPrivateData([oracles!], async () => {});
    assert.deepEqual(imported.oracles, oracles);
    const added = await importPrivateData([library!], async () => {});
    assert.deepEqual(
      validateOracleRegistry(
        buildOracleRegistry(added.library!, imported.oracles!),
      ),
      [],
    );
  },
);

local(
  'Pre-rolled city follow-ups keep known source text and disclose missing dependencies without a render exception',
  () => {
    const dice = [0, 0.999, 0.999];
    const move = rollCityMove({ move: 'stash', dr: 10, modifier: 0 }, () =>
      dice.shift()!,
    );
    assert.equal(move.metadata.followUp!.roll, 6);
    const reading = cityCrawlMoveReading(move, partial);
    const sourceEntry = partial.tables
      .find((table) => table.id === 'aitc.stash-weak')!
      .entries.find((entry) => entry.id === 'aitc.stash-weak:5-6')!;
    assert.ok(reading.blocks[1].text.includes(sourceEntry.text));
    assert.match(
      reading.blocks[1].text,
      /SOURCE DATA UNAVAILABLE: sd.npc.disposition, sd.npc.profession/,
    );
    assert.doesNotMatch(
      cityCrawlMoveReading(move, complete).blocks[1].text,
      /SOURCE DATA UNAVAILABLE/,
    );
  },
);

test('Related navigation never blocks an independent result; missing fixed lookups do', () => {
  const table: OracleDefinition = {
    id: 'test.independent',
    sourceBookId: 'test',
    sourcePage: 1,
    title: 'Test',
    category: 'OTHER',
    dice: 'd2',
    tags: [],
    sourceVerified: true,
    entries: [
      {
        id: 'test.independent:1-2',
        min: 1,
        max: 2,
        text: 'Test result',
        metadata: { relatedIds: ['oracle:test.absent'] },
      },
    ],
  };
  const registry: OracleRegistry = {
    books: [{ id: 'test', title: 'Test' }],
    tables: [table],
    procedures: [],
  };
  assert.equal(rollOracle(table, registry, () => 0).text, 'Test result');
  const fixed = {
    ...table.entries[0],
    metadata: { fixedLookups: [{ oracleId: 'test.absent', roll: 1 }] },
  };
  assert.throws(
    () => assertOracleEntryDependenciesAvailable(fixed, registry),
    /SOURCE DATA UNAVAILABLE: test.absent/,
  );
  const invalid = {
    ...table.entries[0],
    metadata: { fixedLookups: [{ oracleId: table.id, roll: 3 }] },
  };
  assert.throws(
    () => assertOracleEntryDependenciesAvailable(invalid, registry),
    /SOURCE DATA UNAVAILABLE/,
  );
});
