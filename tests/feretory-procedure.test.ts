import test from 'node:test';
import assert from 'node:assert/strict';
import type { OracleRegistry } from '../src/domain/oracle.ts';
import {
  FERETORY_TABLE_IDS,
  feretoryStats,
} from '../src/generators/feretory.ts';
import {
  pairedOracleProcedure,
  rollProcedure,
} from '../src/generators/oracleRoller.ts';
import { oracleLibraryTables } from '../src/data/oracles/library.ts';
import {
  buildReferenceRegistry,
  searchReferences,
} from '../src/domain/references.ts';
import { executeReference } from '../src/domain/referenceExecution.ts';
import {
  copyReferenceReading,
  feretoryResultBlock,
} from '../src/domain/referenceReading.ts';
import { createCampaign } from '../src/generators/index.ts';
import { saveOracleEvent } from '../src/domain/chronicleOperations.ts';
import { validateCampaign } from '../src/storage/schema.ts';

function fixture(): OracleRegistry {
  return {
    books: [{ id: 'feretory', title: 'MÖRK BORG CULT: FERETORY' }],
    procedures: [],
    // Reversed source loading must not change the A/B/C die assignment.
    tables: [...FERETORY_TABLE_IDS].reverse().map((id) => ({
      id,
      title: id,
      sourceBookId: 'feretory',
      sourcePage: 2,
      printedPage: 2,
      category: 'MONSTER',
      tags: [],
      dice: 'd12',
      sourceVerified: true,
      entries: Array.from({ length: 12 }, (_, i) => ({
        id: `${id}:${i + 1}`,
        min: i + 1,
        max: i + 1,
        text: `${id.slice(-1)} appearance ${i + 1}`,
      })),
    })),
  };
}
function sequence() {
  const values = [2 / 12, 6 / 12, 9 / 12, 0.99]; // A3, B7, C10, HP d4=4.
  let calls = 0;
  return {
    rng: () => {
      assert(calls < values.length, 'Do not reroll A/B/C for separate stats');
      return values[calls++];
    },
    calls: () => calls,
  };
}

test('The Monster Approaches rolls A/B/C once and adds only the source-defined HP die', () => {
  const registry = fixture(),
    random = sequence();
  const before = JSON.stringify(registry);
  const result = rollProcedure(
    pairedOracleProcedure(registry.tables[0], registry),
    registry,
    random.rng,
  );
  assert.equal(random.calls(), 4);
  assert.deepEqual(
    result.rolls.map((r) => [r.oracleId, r.roll]),
    [
      ['feretory.A', 3],
      ['feretory.B', 7],
      ['feretory.C', 10],
      ['feretory.hp', 4],
    ],
  );
  assert.equal(
    result.rolls[3].text,
    'HP 8 · Morale 10 · Armor −d6 · Damage d4',
  );
  assert.equal(result.rolls[3].dice, 'd4');
  assert.match(result.rolls[3].source, /FERETORY.*PDF 2/);
  assert.match(
    feretoryResultBlock(result)!.text,
    /A appearance 3; B appearance 7; C appearance 10/,
  );
  assert.equal(JSON.stringify(registry), before);
});

test('Feretory damage boundaries and HP doubling follow the printed rule', () => {
  for (const [lowest, expectedDie, expectedHP] of [
    [1, 'd4', 8],
    [3, 'd4', 8],
    [4, 'd6', 12],
    [5, 'd6', 12],
    [6, 'd8', 16],
    [7, 'd8', 16],
    [8, 'd10', 20],
    [10, 'd10', 20],
    [11, 'd12', 24],
    [12, 'd12', 24],
  ] as const) {
    const result = feretoryStats({ A: lowest, B: 12, C: 12 }, () => 0.99);
    assert.equal(result.damage, expectedDie);
    assert.equal(result.hp, expectedHP);
    assert.equal(result.morale, 12);
    assert.match(result.armor, /동률/);
  }
  assert.equal(feretoryStats({ A: 12, B: 2, C: 1 }, () => 0).armor, 'None');
  assert.equal(feretoryStats({ A: 1, B: 12, C: 2 }, () => 0).armor, '−d2');
  assert.equal(feretoryStats({ A: 1, B: 2, C: 11 }, () => 0).armor, '−d4');
  assert.equal(feretoryStats({ A: 1, B: 2, C: 12 }, () => 0).armor, '−d6');
});

test('Search and old B/C pins all reach one complete monster roller without campaign context', () => {
  const registry = fixture(),
    index = buildReferenceRegistry(registry),
    random = sequence();
  assert.equal(oracleLibraryTables(registry).length, 1);
  const entry = searchReferences(index, 'FER monster')[0];
  assert.equal(entry.id, 'oracle:feretory.A');
  assert.equal(index.byId['oracle:feretory.B'], entry);
  assert.equal(index.byId['oracle:feretory.C'], entry);
  const result = executeReference(entry, {
    registry,
    rules: null,
    region: 'sarkash',
    stockKind: 'room',
    stockDR: 10,
    cityLarge: false,
    cityExits: true,
    rng: random.rng,
  })!;
  assert.equal(random.calls(), 4);
  assert.equal(result.blocks.length, 1);
  assert.equal(result.blocks[0].kind, 'creature');
  assert.deepEqual(
    result.sourceRefs.slice(0, 3).map((ref) => ref.tableId),
    FERETORY_TABLE_IDS,
  );
  assert.match(result.sourceRefs[3].note!, /HP: d4 = 4 × 2 = 8/);
  assert.doesNotMatch(result.sourceRefs[3].note!, /수량/);
  assert.match(
    copyReferenceReading(result),
    /HP 8 · Morale 10 · Armor −d6 · Damage d4/,
  );
  assert.doesNotMatch(copyReferenceReading(result), /PDF|MÖRK BORG CULT/);
  assert.match(
    copyReferenceReading(result, true),
    /MÖRK BORG CULT: FERETORY.*PDF 2/,
  );
});

test('Missing or unverified A/B/C never creates a partial monster', () => {
  for (const missing of FERETORY_TABLE_IDS) {
    const registry = fixture();
    registry.tables = registry.tables.filter((t) => t.id !== missing);
    const entry = buildReferenceRegistry(registry).byId['oracle:feretory.A'];
    assert.equal(entry.available, false);
    assert.equal(entry.action, null);
    assert.throws(
      () => pairedOracleProcedure(registry.tables[0], registry),
      /원문 표/,
    );
  }
  const registry = fixture();
  registry.tables[1].sourceVerified = false;
  assert.equal(
    buildReferenceRegistry(registry).byId['oracle:feretory.A'].action,
    null,
  );
  assert.throws(
    () =>
      rollProcedure(
        pairedOracleProcedure(registry.tables[0], registry),
        registry,
      ),
    /원문 표/,
  );
});

test('Optional saved results retain all A/B/C and HP evidence through validation', () => {
  const registry = fixture();
  const result = rollProcedure(
    pairedOracleProcedure(registry.tables[0], registry),
    registry,
    sequence().rng,
  );
  const campaign = createCampaign('Feretory fixture');
  const event = saveOracleEvent(campaign, result);
  const restored = validateCampaign(JSON.parse(JSON.stringify(campaign)));
  assert.deepEqual(
    restored.timeline.find((item) => item.id === event.id)?.oracle,
    JSON.parse(JSON.stringify(event.oracle)),
  );
});
