import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CONVENIENCE_KEY,
  emptyConvenience,
  readConveniencePreferences,
  writeConveniencePreferences,
} from '../src/storage/conveniencePreferences.ts';

function storage(value?: object) {
  const values = new Map([
    ['morkborg-codex:v6', 'campaign unchanged'],
    ['morkborg-play-session:v1', 'temporary unchanged'],
  ]);
  if (value) values.set(CONVENIENCE_KEY, JSON.stringify(value));
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}
test('first PLAY hint defaults safely for fresh, old and malformed convenience preferences', () => {
  assert.equal(readConveniencePreferences(storage()).playOpened, false);
  assert.equal(
    readConveniencePreferences(
      storage({ schemaVersion: 1, playOpened: 'false' }),
    ).playOpened,
    false,
  );
  const old = {
    schemaVersion: 1,
    recipes: [
      {
        id: 'recipe:old',
        name: 'Old recipe',
        referenceIds: ['oracle:reaction'],
        createdAt: '2026-09-09',
      },
    ],
    packs: [
      {
        id: 'pack:old',
        name: 'Old pack',
        referenceIds: ['oracle:reaction'],
        userCreated: true,
      },
    ],
    activePackId: 'pack:old',
  };
  const restored = readConveniencePreferences(storage(old));
  assert.deepEqual(restored, { ...old, playOpened: false });
});
test('opening PLAY persists just its hint dismissal without touching temporary tools or Campaign', () => {
  const store = storage();
  writeConveniencePreferences(
    { ...emptyConvenience(), playOpened: true },
    store,
  );
  assert.equal(readConveniencePreferences(store).playOpened, true);
  assert.equal(store.values.get('morkborg-codex:v6'), 'campaign unchanged');
  assert.equal(
    store.values.get('morkborg-play-session:v1'),
    'temporary unchanged',
  );
  assert.equal(store.values.size, 3);
});
