import test from 'node:test';
import assert from 'node:assert/strict';
import type { OracleRegistry } from '../src/domain/oracle.ts';
import {
  DUNGEON_ACTIONS,
  dungeonActionDR,
  rollDungeonAction,
  type DungeonActionInput,
} from '../src/domain/dungeonActionMoves.ts';
import { PLAY_REFERENCE_RULES } from '../src/domain/playReferenceRules.ts';
const registry: OracleRegistry = {
  books: [],
  procedures: [],
  tables: ['depths.danger', 'sd.search.strong', 'sd.search.weak'].map((id) => ({
    id,
    title: id,
    sourceBookId: id.split('.')[0],
    sourcePage: 8,
    dice: id === 'depths.danger' ? 'd6' : 'd4',
    sourceVerified: true,
    category: 'OTHER',
    tags: [],
    entries: [
      {
        id: `${id}:1`,
        min: 1,
        max: id === 'depths.danger' ? 6 : 4,
        text: `Canonical ${id}`,
      },
    ],
  })),
};
const sequence = (...values: number[]) => {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
};
const base: DungeonActionInput = {
  action: 'search',
  modifier: 0,
  threatRating: 12,
};
test('each dungeon action has a source-backed rule rather than a missing index entry', () => {
  for (const action of DUNGEON_ACTIONS)
    assert.ok(
      PLAY_REFERENCE_RULES.some((rule) => rule.id === action.ruleId),
      action.ruleId,
    );
});
test('flee DR includes actual enemy count and Weak still escapes after an opportunity attack', () => {
  assert.equal(dungeonActionDR({ ...base, action: 'flee', enemies: 4 }), 15);
  const result = rollDungeonAction(
    { ...base, action: 'flee', enemies: 4 },
    registry,
    sequence(0.7, 0.0),
  );
  assert.equal(result.outcome, 'weak');
  assert.match(result.reading.blocks[0].text, /무관하게 탈출/);
  assert.throws(() =>
    rollDungeonAction({ ...base, action: 'flee', enemies: 0 }, registry),
  );
});
test('search follows the canonical Strong or Weak d4 and never invents a follow-up on failure', () => {
  for (const [outcome, values] of [
    ['strong', [0.99, 0.99, 0.99]],
    ['weak', [0.99, 0, 0.5]],
  ] as const) {
    const result = rollDungeonAction(base, registry, sequence(...values));
    assert.equal(result.outcome, outcome);
    assert.match(
      result.reading.blocks[0].text,
      new RegExp(`Canonical sd.search.${outcome}`),
    );
    assert.ok(
      result.reading.sourceRefs.some(
        (ref) => ref.tableId === `sd.search.${outcome}`,
      ),
    );
  }
  let calls = 0;
  const result = rollDungeonAction(base, registry, () => {
    calls++;
    return 0;
  });
  assert.equal(result.outcome, 'fail');
  assert.equal(result.secondaryRoll, undefined);
  assert.equal(calls, 2);
  assert.deepEqual(result.relatedIds, ['oracle:depths.danger']);
});
test('short rest and camping have distinct DR and recovery dice; retry cannot miss', () => {
  const breath = rollDungeonAction(
    { ...base, action: 'breath' },
    registry,
    sequence(0.4, 0.4, 0.99),
  );
  assert.equal(breath.outcome, 'strong');
  assert.equal(breath.dr, 9);
  assert.equal(breath.recovery, 4);
  const camp = rollDungeonAction(
    { ...base, action: 'camp' },
    registry,
    sequence(0.99, 0, 0.99),
  );
  assert.equal(camp.outcome, 'weak');
  assert.equal(camp.recovery, 4);
  const retry = rollDungeonAction(
    { ...base, action: 'breath', modifier: -99, retry: true },
    registry,
    sequence(0.99, 0.99),
  );
  assert.equal(retry.outcome, 'weak');
  assert.equal(retry.recovery, 2);
  assert.equal(retry.values.length, 1);
  assert.throws(() => rollDungeonAction({ ...base, retry: true }, registry));
});
test('resupply in a dungeon is a chosen ability GAM and does not roll outdoor forage', () => {
  const result = rollDungeonAction(
    { ...base, action: 'resupply', customDR: 16, modifier: 2 },
    registry,
    sequence(0.65, 0.65),
  );
  assert.equal(result.outcome, 'strong');
  assert.equal(result.dr, 16);
  assert.equal(result.reading.sourceRefs[0].bookId, 'sd');
});
test('noise rolls a danger only on the documented1-in6 or2-in6 trigger', () => {
  let calls = 0;
  const quiet = rollDungeonAction(
    { ...base, action: 'noise' },
    registry,
    () => {
      calls++;
      return 0.2;
    },
  );
  assert.equal(quiet.outcome, 'strong');
  assert.equal(calls, 1);
  assert.equal(quiet.reading.blocks.length, 1);
  const loud = rollDungeonAction(
    { ...base, action: 'noise', loud: true },
    registry,
    sequence(0.2, 0.99),
  );
  assert.equal(loud.outcome, 'fail');
  assert.equal(loud.reading.blocks.length, 2);
  assert.match(loud.reading.blocks[1].text, /Canonical depths.danger/);
});
test('enemy awareness and lockpick affect TR without changing dungeon-crawl DR', () => {
  assert.equal(
    dungeonActionDR({
      ...base,
      action: 'enemy',
      threatRating: 15,
      enemyState: 'preoccupied',
    }),
    12,
  );
  assert.equal(
    dungeonActionDR({
      ...base,
      action: 'enemy',
      threatRating: 9,
      enemyState: 'alerted',
    }),
    12,
  );
  const door = rollDungeonAction(
    { ...base, action: 'door', lockpick: true },
    registry,
    sequence(0.99, 0),
  );
  assert.equal(door.dr, 9);
  assert.equal(door.outcome, 'weak');
  assert.match(door.reading.blocks[0].text, /부러집니다/);
});
test('discovered-trap avoidance accepts Weak, but a triggered-trap save does not', () => {
  const avoid = rollDungeonAction(
    { ...base, action: 'trap-avoid' },
    registry,
    sequence(0.99, 0),
  );
  assert.match(avoid.reading.blocks[0].text, /해제했습니다/);
  const save = rollDungeonAction(
    { ...base, action: 'trap-save' },
    registry,
    sequence(0.99, 0),
  );
  assert.match(save.reading.blocks[0].text, /결과를 적용/);
  const detect = rollDungeonAction(
    { ...base, action: 'trap-detect' },
    registry,
    () => 0,
  );
  assert.deepEqual(detect.relatedIds, ['oracle:depths.traps.regular']);
});
