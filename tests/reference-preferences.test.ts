import test from 'node:test';
import assert from 'node:assert/strict';
import {
  readReferencePreferences,
  writeReferencePreferences,
  recentlyUsed,
  toggleReferencePin,
  REFERENCE_PREFERENCES_KEY,
} from '../src/storage/referencePreferences';
import { ORACLE_PREFERENCES_KEY } from '../src/storage/oraclePreferences';

test('reference pins import existing favorites once and remain independent of campaign records', () => {
  const values = new Map([
    [
      ORACLE_PREFERENCES_KEY,
      JSON.stringify({ schemaVersion: 1, favoriteIds: ['core.reaction'] }),
    ],
    ['morkborg-codex:v6', 'unchanged campaign'],
  ]);
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  let prefs = readReferencePreferences(storage);
  assert.deepEqual(prefs.pinnedIds, ['oracle:core.reaction']);
  prefs = toggleReferencePin(prefs, 'rule:morale');
  writeReferencePreferences(prefs, storage);
  assert.deepEqual(readReferencePreferences(storage), prefs);
  assert.equal(values.get('morkborg-codex:v6'), 'unchanged campaign');
  prefs = toggleReferencePin(prefs, 'oracle:core.reaction');
  writeReferencePreferences(prefs, storage);
  assert.deepEqual(readReferencePreferences(storage).pinnedIds, [
    'rule:morale',
  ]);
});
test('reference recents are unique, newest first and bounded to ten', () => {
  let prefs = readReferencePreferences({ getItem: () => null });
  for (let n = 0; n < 13; n++) prefs = recentlyUsed(prefs, `oracle:${n}`);
  prefs = recentlyUsed(prefs, 'oracle:5');
  assert.equal(prefs.recentIds.length, 10);
  assert.equal(prefs.recentIds[0], 'oracle:5');
  assert.equal(prefs.recentIds.filter((id) => id === 'oracle:5').length, 1);
  assert.ok(!prefs.recentIds.includes('oracle:0'));
});
test('damaged reference preferences never block play and invalid saved IDs are rejected', () => {
  assert.deepEqual(
    readReferencePreferences({ getItem: () => '{broken' }).pinnedIds,
    [],
  );
  assert.deepEqual(
    readReferencePreferences({
      getItem: (key) =>
        key === REFERENCE_PREFERENCES_KEY
          ? JSON.stringify({
              schemaVersion: 1,
              pinnedIds: ['a', 'a', 3, ''],
              recentIds: null,
            })
          : null,
    }).pinnedIds,
    ['a'],
  );
});
