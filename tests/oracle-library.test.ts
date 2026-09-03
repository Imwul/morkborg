import test from 'node:test';
import assert from 'node:assert/strict';
import type { OracleRegistry } from '../src/domain/oracle.ts';
import {
  oracleLibraryTables,
  oracleLibraryRollIds,
} from '../src/data/oracles/library.ts';
import {
  pairedOracleProcedure,
  rollProcedure,
} from '../src/generators/oracleRoller.ts';
import { readOraclePreferences } from '../src/storage/oraclePreferences.ts';

const ids = [
  'action-1',
  'action-2',
  'descriptor-1',
  'descriptor-2',
  'locations',
];
const registry: OracleRegistry = {
  books: [{ id: 'mythic2', title: 'Test book' }],
  procedures: [],
  tables: ids.map((suffix) => ({
    id: `mythic2.meaning.${suffix}`,
    title: suffix,
    sourceBookId: 'mythic2',
    sourcePage: 1,
    sourceVerified: true,
    dice: 'd100',
    category: 'OTHER',
    tags: [],
    entries: [{ id: suffix, min: 1, max: 100, text: suffix }],
  })),
};
test('library merges only Action and Descriptor, preserving all canonical source tables', () => {
  const before = structuredClone(registry);
  const cards = oracleLibraryTables(registry);
  assert.deepEqual(
    cards.map((table) => table.title),
    ['Action', 'Descriptor', 'locations'],
  );
  assert.deepEqual(registry, before);
  for (const card of cards) {
    let calls = 0;
    const result = rollProcedure(
      pairedOracleProcedure(card, registry),
      registry,
      () => {
        calls++;
        return 0.4;
      },
    );
    assert.deepEqual(
      result.rolls.map((roll) => roll.oracleId),
      oracleLibraryRollIds(card.id),
    );
    assert.equal(calls, card.title === 'locations' ? 1 : 2);
  }
});
test('legacy second-column favorites migrate to their combined library entry without duplication', () => {
  const prefs = readOraclePreferences({
    getItem: () =>
      JSON.stringify({
        schemaVersion: 1,
        favoriteIds: [
          'mythic2.meaning.action-1',
          'mythic2.meaning.action-2',
          'mythic2.meaning.descriptor-2',
          'other',
        ],
      }),
  });
  assert.deepEqual(prefs.favoriteIds, [
    'mythic2.meaning.action-1',
    'mythic2.meaning.descriptor-1',
    'other',
  ]);
});
