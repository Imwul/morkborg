import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { buildReferenceRegistry } from '../src/domain/references.ts';
import { setRules, getRules } from '../src/storage/rulesStore.ts';
import { setOraclePack, getOraclePack } from '../src/storage/oracleStore.ts';
import {
  RESULT_TASKS,
  resultTasks,
} from '../src/domain/resultFollowThrough.ts';
import { CONDITIONAL_RULES } from '../src/domain/conditionalRules.ts';
import { QUESTION_TARGETS } from '../src/domain/questionGuidance.ts';
import { PLAY_GUIDES, scenePlayActions } from '../src/domain/playGuidance.ts';
import { journeyGuidance } from '../src/domain/journeyGuidance.ts';
import { resolveGuidedRoll, rollGuidedDice } from '../src/domain/guidedRoll.ts';
import {
  physicalOracleRoll,
  readingFromOracleRolls,
} from '../src/domain/manualReferenceRoll.ts';
import { fixedReferenceReading } from '../src/domain/referenceFixedLookup.ts';
import { readingResultRelationships } from '../src/domain/resultRelationships.ts';
import { ReferenceReadingBlock } from '../src/components/InlineReferenceTools.tsx';
import { ResultFollowThrough } from '../src/components/ResultFollowThrough.tsx';
import {
  ReferenceContext,
  type DeskContext,
} from '../src/components/ReferenceContext.tsx';

const bundle = JSON.parse(
  readFileSync('outputs/morkborg-private-data.json', 'utf8'),
);
setRules(bundle.library);
setOraclePack(bundle.oracles);
const registry = buildOracleRegistry(getRules(), getOraclePack());
const index = buildReferenceRegistry(registry, getRules());
const table = (id: string) => registry.tables.find((t) => t.id === id)!;
function reading(id: string, value: string) {
  return readingFromOracleRolls(
    table(id).title,
    [physicalOracleRoll(table(id), value, registry)],
    registry,
  );
}
const desk: DeskContext = {
  entries: index.entries,
  byId: index.byId,
  activate: () => {},
  openSearch: () => {},
  search: () => [],
  contextual: () => [],
  pinnedIds: [],
  recentIds: [],
  touch: () => {},
  togglePin: () => {},
};
const render = (element: ReturnType<typeof createElement>) =>
  renderToStaticMarkup(
    createElement(ReferenceContext.Provider, { value: desk }, element),
  );

test('Guidance destinations are real available references; scene actions never add registry entries', () => {
  const ids = [
    ...Object.values(QUESTION_TARGETS),
    ...CONDITIONAL_RULES.flatMap((t) =>
      t.conditions.flatMap((c) => c.references),
    ),
    ...PLAY_GUIDES.flatMap((g) => [g.sourceId, ...g.appliesTo]),
    ...scenePlayActions('wilderness').map((a) => a.referenceId),
  ];
  for (const id of ids) assert.ok(index.byId[id]?.available, id);
  assert.deepEqual(
    scenePlayActions('wilderness').map((a) => a.label),
    ['이동하기', '길 벗어나기', '채집하기', '야영하기'],
  );
});
test('Every follow-through is an exact verified row with unique task IDs and valid dice', () => {
  const keys = new Set<string>();
  for (const policy of RESULT_TASKS) {
    const row = table(policy.table)?.entries.find((e) => e.min === policy.min);
    assert.ok(row, `${policy.table}:${policy.min}`);
    assert.equal(row.metadata?.sourceStatus, 'VERIFIED');
    assert.equal(
      new Set(policy.tasks.map((t) => t.id)).size,
      policy.tasks.length,
    );
    const key = `${policy.table}:${policy.min}`;
    assert.ok(!keys.has(key));
    keys.add(key);
    for (const task of policy.tasks) {
      assert.ok(task.condition && task.effect);
      if (task.roll)
        assert.doesNotThrow(() => rollGuidedDice(task.roll!, 0, () => 0));
      if (task.lookup) {
        assert.ok(index.byId[`oracle:${task.lookup.oracleId}`]?.available);
        assert.doesNotThrow(() =>
          fixedReferenceReading(registry, task.lookup!),
        );
      }
    }
  }
});
test('Core tests and SD moves use different dice and compare SD dice independently', () => {
  assert.equal(
    resolveGuidedRoll(
      { kind: 'test', dice: 'd20', ability: 'Strength', dr: 12 },
      '10',
      2,
    ).outcome,
    'success',
  );
  assert.equal(
    resolveGuidedRoll(
      { kind: 'test', dice: '2d20', ability: 'Strength', dr: 12 },
      '11,12',
    ).outcome,
    'weak',
  );
  assert.equal(
    resolveGuidedRoll(
      { kind: 'test', dice: '2d20', ability: 'Strength', dr: 12 },
      '6,6',
    ).outcome,
    'miss',
  );
  assert.equal(
    resolveGuidedRoll(
      { kind: 'test', dice: '2d20', ability: 'Strength', dr: 12 },
      '14,12',
    ).outcome,
    'strong',
  );
});
test('Source quantities preserve offsets, negative Omens and per-die traces', () => {
  assert.equal(
    resolveGuidedRoll({ kind: 'quantity', dice: 'd8', offset: 2 }, '8').total,
    10,
  );
  assert.equal(
    resolveGuidedRoll({ kind: 'quantity', dice: 'd6', offset: -3 }, '1').total,
    -2,
  );
  assert.deepEqual(
    resolveGuidedRoll({ kind: 'quantity', dice: '2d6' }, '1,6').values,
    [1, 6],
  );
  assert.equal(
    resolveGuidedRoll(
      { kind: 'quantity', dice: 'd4', modifierLabel: 'Presence' },
      '2',
      -1,
    ).total,
    1,
  );
  assert.match(
    resolveGuidedRoll({ kind: 'chance', dice: 'd6', threshold: 2 }, '2').text,
    /→ 발생$/,
  );
  assert.match(
    resolveGuidedRoll({ kind: 'chance', dice: 'd6', threshold: 2 }, '3').text,
    /발생하지 않음/,
  );
});
test('Manual input rejects missing, fractional, out-of-range and wrongly combined dice before random use', () => {
  for (const raw of ['', '21', '1.5', '-1', '1,2'])
    assert.throws(() =>
      resolveGuidedRoll(
        { kind: 'test', dice: 'd20', ability: 'Presence', dr: 12 },
        raw,
      ),
    );
  assert.throws(() =>
    resolveGuidedRoll(
      { kind: 'test', dice: '2d20', ability: 'Presence', dr: 12 },
      '24',
    ),
  );
  let calls = 0;
  assert.throws(() =>
    rollGuidedDice(
      { kind: 'test', dice: 'd20', ability: 'Presence', dr: 0 },
      0,
      () => {
        calls++;
        return 0;
      },
    ),
  );
  assert.equal(calls, 0);
});
test('App and manual guided checks resolve identically without applying resources', () => {
  const spec = {
    kind: 'test',
    dice: 'd20',
    ability: 'Presence',
    dr: 10,
  } as const;
  assert.deepEqual(
    rollGuidedDice(spec, -2, () => 0.575),
    resolveGuidedRoll(spec, '12', -2),
  );
});
test('Only animal tracks and broken roads offer SD navigation checks', () => {
  for (let n = 1; n <= 8; n++) {
    const guide = journeyGuidance(
      'oracle:feretory.roadType',
      reading('feretory.roadType', String(n)),
      registry,
    )!;
    assert.equal(
      guide.links.some((l) => l.id === 'rule:sd.leaving-road'),
      [3, 4, 5].includes(n),
    );
    assert.ok(guide.links.some((l) => l.id === 'oracle:feretory.roadEvent'));
  }
});
test('Journey keeps no-progress, forage, off-road and arrival conditions distinct', () => {
  assert.match(
    journeyGuidance(
      'oracle:feretory.roadEvent',
      reading('feretory.roadEvent', '4'),
      registry,
    )!.note,
    /줄이지/,
  );
  assert.match(
    journeyGuidance(
      'oracle:feretory.forage',
      reading('feretory.forage', '3'),
      registry,
    )!.note,
    /이동일을 줄이지/,
  );
  assert.match(
    journeyGuidance(
      'oracle:feretory.leaveRoad',
      reading('feretory.leaveRoad', '3'),
      registry,
    )!.note,
    /이동일로/,
  );
  assert.match(
    PLAY_GUIDES.find((g) => g.id === 'travel-day')!.outcomes.at(-1)![1],
    /다음 날/,
  );
  assert.equal(
    journeyGuidance('oracle:feretory.forage', undefined, registry),
    undefined,
  );
});
test('Forage two exposes quantity and the printed d20 Presence DR12, never a generic 2d20 resupply first', () => {
  const tasks = resultTasks(reading('feretory.forage', '2'), registry)[0].tasks;
  assert.equal(tasks.length, 2);
  assert.deepEqual(tasks[1].roll, {
    kind: 'test',
    dice: 'd20',
    ability: 'Presence',
    dr: 12,
  });
  assert.match(tasks[1].effect, /6시간/);
  assert.match(
    resultTasks(reading('feretory.forage', '4'), registry)[0].tasks[0]
      .condition,
    /죽인 뒤/,
  );
});
test('Quiet night and ordinary weather do not invent tasks; campsite effects remain conditional', () => {
  assert.deepEqual(
    resultTasks(reading('feretory.campsite', '1'), registry),
    [],
  );
  assert.deepEqual(resultTasks(reading('core.weather', '1'), registry), []);
  const theft = resultTasks(reading('feretory.campsite', '6'), registry)[0]
    .tasks;
  assert.match(
    theft[0].roll!.kind === 'test' ? theft[0].roll.ability : '',
    /가장 높은/,
  );
  assert.match(theft[1].condition, /실제로/);
});
test('Tavern and Inn preserve source-specific Toughness/Presence and DR instead of generic camp defaults', () => {
  assert.deepEqual(
    resultTasks(reading('aitc.taverns', '1'), registry)[0].tasks[0].roll,
    { kind: 'test', dice: '2d20', ability: 'Toughness', dr: 10 },
  );
  assert.deepEqual(
    resultTasks(reading('aitc.taverns', '4'), registry)[0].tasks[1].roll,
    { kind: 'test', dice: '2d20', ability: 'Presence', dr: 8 },
  );
  assert.match(
    resultTasks(reading('aitc.taverns', '1'), registry)[0].tasks[0].effect,
    /각각 1 적게/,
  );
});
test('Fixed lookup gets identical tasks; stale text and unverified rows never acquire mechanics', () => {
  const r = reading('feretory.forage', '2');
  const fixed = fixedReferenceReading(registry, {
    oracleId: 'feretory.forage',
    roll: 2,
  });
  assert.equal(resultTasks(fixed, registry)[0].tasks.length, 2);
  r.oracle!.rolls[0].text = 'A different fiction';
  assert.deepEqual(resultTasks(r, registry), []);
  fixed.blocks[0].text = 'A different fiction';
  assert.deepEqual(resultTasks(fixed, registry), []);
  const unverified = {
    ...registry,
    tables: registry.tables.map((t) =>
      t.id === 'feretory.forage' ? { ...t, sourceVerified: false } : t,
    ),
  };
  assert.deepEqual(
    resultTasks(reading('feretory.forage', '2'), unverified),
    [],
  );
});
test('New links honor source alternatives and exact Weak outcomes', () => {
  const links = (id: string, n: string) =>
    readingResultRelationships(index.byId, registry, reading(id, n));
  const strong = links('sd.search.strong', '1');
  for (const id of [
    'oracle:core.corpsePlundering',
    'oracle:feretory.itemsTrinkets',
  ])
    assert.equal(strong.find((e) => e.entry.id === id)?.purpose, 'AVAILABLE');
  assert.equal(
    links('sd.search.weak', '2').find(
      (e) => e.entry.id === 'oracle:core.corpsePlundering',
    )?.purpose,
    'REQUIRED',
  );
  assert.equal(
    links('sd.search.weak', '3').find(
      (e) => e.entry.id === 'oracle:feretory.itemsTrinkets',
    )?.purpose,
    'REQUIRED',
  );
  assert.match(
    links('aitc.taverns', '3').find(
      (e) => e.entry.id === 'oracle:core.reaction',
    )!.note!,
    /다가갈 때만.*\+2/,
  );
});
test('Condition summaries expose restrictions and do not roll for a resolved blocked condition', () => {
  const rest = CONDITIONAL_RULES.find((t) => t.id === 'rest')!;
  assert.equal(
    rest.conditions.find((c) => c.id === 'blocked')?.roll,
    undefined,
  );
  const powers = CONDITIONAL_RULES.find((t) => t.id === 'powers')!;
  assert.equal(
    powers.conditions.find((c) => c.id === 'dizzy')?.roll,
    undefined,
  );
  assert.equal(
    powers.conditions.find((c) => c.id === 'casting')?.roll?.dice,
    'd20',
  );
  assert.match(
    CONDITIONAL_RULES.find((t) => t.id === 'carrying')!.conditions.find(
      (c) => c.id === 'over',
    )!.test,
    /Strength·Agility.*\+2/,
  );
  for (const topic of CONDITIONAL_RULES)
    assert.equal(
      new Set(topic.conditions.map((c) => c.id)).size,
      topic.conditions.length,
    );
});
test('Reader and Workbench share the same follow-through controls and accessible labels', () => {
  const r = reading('feretory.forage', '2');
  for (const component of [
    createElement(ResultFollowThrough, { reading: r }),
    createElement(ReferenceReadingBlock, { reading: r }),
  ]) {
    const html = render(component);
    assert.match(html, /data-follow-task="spoil-test"/);
    assert.match(html, /aria-label="상한 식량 알아채기 직접 굴린 값"/);
  }
});
test('All guidance projections leave canonical counts and data byte-for-byte unchanged', () => {
  const before = JSON.stringify(registry);
  for (const p of RESULT_TASKS)
    resultTasks(reading(p.table, String(p.min)), registry);
  for (const id of [
    'rule:sd.travel-day',
    'rule:sd.resupply',
    'rule:sd.leaving-road',
    'rule:sd.camping-move',
  ]) {
    for (const link of journeyGuidance(id)!.links)
      assert.ok(index.byId[link.id]?.available, link.id);
  }
  assert.equal(JSON.stringify(registry), before);
  assert.deepEqual(
    [
      registry.tables.length,
      registry.procedures.length,
      index.entries.length,
      registry.tables.reduce((n, t) => n + t.entries.length, 0),
    ],
    [546, 60, 993, 12310],
  );
});

test('All new helpers also resolve in the distributed pack without restoring excluded material', () => {
  setRules(JSON.parse(readFileSync('public/rules/library.json', 'utf8')));
  setOraclePack(JSON.parse(readFileSync('public/rules/oracles.json', 'utf8')));
  try {
    const distributed = buildOracleRegistry(getRules(), getOraclePack());
    const refs = buildReferenceRegistry(distributed, getRules());
    for (const target of Object.values(QUESTION_TARGETS))
      assert.ok(refs.byId[target]?.available, target);
    for (const policy of RESULT_TASKS)
      assert.ok(
        distributed.tables
          .find((t) => t.id === policy.table)
          ?.entries.some((e) => e.min === policy.min),
      );
    assert.deepEqual(
      [
        distributed.tables.length,
        distributed.procedures.length,
        refs.entries.length,
        distributed.tables.reduce((n, t) => n + t.entries.length, 0),
      ],
      [545, 60, 987, 12305],
    );
  } finally {
    setRules(bundle.library);
    setOraclePack(bundle.oracles);
  }
});
