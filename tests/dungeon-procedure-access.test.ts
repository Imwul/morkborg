import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { buildReferenceRegistry } from '../src/domain/references.ts';
import {
  buildReferenceRelationships,
  relatedReferenceRelationships,
} from '../src/domain/referenceRelationships.ts';
import { setRules, getRules } from '../src/storage/rulesStore.ts';
import { setOraclePack, getOraclePack } from '../src/storage/oracleStore.ts';
import { scenePlayActions } from '../src/domain/playGuidance.ts';
import { fixedReferenceReading } from '../src/domain/referenceFixedLookup.ts';
import { readingResultRelationships } from '../src/domain/resultRelationships.ts';
import { dungeonRelevantReferences } from '../src/domain/dungeonContext.ts';
import { executeReference } from '../src/domain/referenceExecution.ts';
const bundle = JSON.parse(
  readFileSync('outputs/morkborg-private-data.json', 'utf8'),
);
setRules(bundle.library);
setOraclePack(bundle.oracles);
const rules = getRules()!,
  registry = buildOracleRegistry(rules, getOraclePack()),
  index = buildReferenceRegistry(registry, rules),
  graph = buildReferenceRelationships(index, registry);
const candidate = 'procedure:workbench.stock-room';
const access = (id: string, refs = index, g = graph) =>
  relatedReferenceRelationships(refs, g, id).filter(
    (x) => x.entry.id === candidate,
  );
const hash = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');

test('explicit Common and Rare preparation rules expose the exact existing candidate procedure', () => {
  for (const id of ['rule:sd.stockCommon', 'rule:sd.stockRare']) {
    const links = access(id);
    assert.equal(links.length, 1);
    assert.equal(links[0].entry, index.byId[candidate]);
    assert.ok(index.byId[candidate].relatedIds.includes(id));
    assert.equal(links[0].kind, undefined);
    assert.deepEqual(links[0].sourceRefs, []);
    assert.match(
      links[0].origins[0],
      /relatedIds\[\d+\] \(reverse navigation\)/,
    );
  }
});
test('the reciprocal access requires the existing declared edge, not shared tags or book', () => {
  const refs = {
    ...index,
    byId: {
      ...index.byId,
      [candidate]: { ...index.byId[candidate], relatedIds: [] },
    },
  };
  assert.deepEqual(access('rule:sd.stockCommon', refs), []);
});
test('renamed and translated titles do not affect identity; lookalike titles create no link', () => {
  const refs = {
    ...index,
    byId: {
      ...index.byId,
      [candidate]: {
        ...index.byId[candidate],
        title: 'unrelated',
        summary: 'bones door',
      },
      'rule:sd.stockCommon': {
        ...index.byId['rule:sd.stockCommon'],
        title: '다른 제목',
      },
    },
  };
  assert.equal(access('rule:sd.stockCommon', refs).length, 1);
  assert.deepEqual(
    access('rule:sd.search-move', {
      ...refs,
      byId: {
        ...refs.byId,
        'rule:sd.search-move': {
          ...refs.byId['rule:sd.search-move'],
          title: index.byId['rule:sd.stockCommon'].title,
        },
      },
    }),
    [],
  );
});
test('missing, unavailable and non-procedure destinations are not access targets', () => {
  for (const replacement of [
    undefined,
    { ...index.byId[candidate], available: false },
    {
      ...index.byId[candidate],
      action: { kind: 'rule', ruleId: 'sd.stockCommon' },
    },
    {
      ...index.byId[candidate],
      action: { kind: 'procedure', procedureId: 'different' },
    },
  ]) {
    const refs = {
      ...index,
      byId: { ...index.byId, [candidate]: replacement },
    } as typeof index;
    assert.deepEqual(access('rule:sd.stockCommon', refs), []);
  }
  assert.deepEqual(access('missing'), []);
  assert.deepEqual(
    access('rule:sd.stockCommon', {
      ...index,
      byId: {
        ...index.byId,
        'rule:sd.stockCommon': {
          ...index.byId['rule:sd.stockCommon'],
          available: false,
        },
      },
    }),
    [],
  );
});
test('an already visible relationship wins without duplicate candidate access', () => {
  const edge = {
    sourceId: 'rule:sd.stockCommon',
    targetId: candidate,
    kind: 'USES' as const,
    origins: ['test-existing'],
    sourceRefs: [],
    aliasIds: [],
  };
  const g = {
    ...graph,
    bySource: { ...graph.bySource, [edge.sourceId]: [edge] },
  };
  const links = access(edge.sourceId, index, g);
  assert.equal(links.length, 1);
  assert.deepEqual(links[0].origins, ['test-existing']);
});
test('only the two declared preparation rules gain access across the entire registry', () => {
  assert.deepEqual(
    index.entries
      .filter((e) =>
        access(e.id).some((x) =>
          x.origins.some((o) => o.endsWith('(reverse navigation)')),
        ),
      )
      .map((e) => e.id)
      .sort(),
    ['rule:sd.stockCommon', 'rule:sd.stockRare'],
  );
  assert.deepEqual(access(''), []);
});
test('existing explicit Searching action remains the same tool, independent of the map object', () => {
  for (const role of [undefined, 'remains', 'door', 'chest', 'contents']) {
    assert.equal(
      scenePlayActions('dungeon', role).find((x) => x.label === '물건 찾기')
        ?.referenceId,
      'rule:sd.search-move',
    );
    assert.equal(scenePlayActions('dungeon', role).length, 4);
  }
});
test('remains, bones, events, danger, empty, door, passage, exit, manual trap, treasure and corpse do not infer candidate access', () => {
  const fixtures = [
    ['sd.room.contents', 2],
    ['sd.room.contents', 3],
    ['sd.room.contents', 10],
    ['sd.room.contents', 12],
    ['reclvse.dressing', 2],
    ['reclvse.exitType', 2],
    ['core.traps', 1],
    ['core.treasures', 3],
    ['core.corpsePlundering', 11],
  ] as const;
  for (const [oracleId, roll] of fixtures) {
    const reading = fixedReferenceReading(registry, { oracleId, roll });
    assert.deepEqual(access('oracle:' + oracleId), []);
    assert.ok(
      !readingResultRelationships(index.byId, registry, reading).some(
        (x) => x.entry.id === candidate,
      ),
    );
    assert.deepEqual(dungeonRelevantReferences(reading, index.byId), []);
  }
  for (const id of [
    'rule:reclvse.passage',
    'oracle:reclvse.dungeonEntrance',
    'oracle:sd.room.exits',
  ])
    assert.deepEqual(access(id), []);
});
test('changing the selected reference removes access instead of retaining old context', () => {
  assert.equal(access('rule:sd.stockCommon').length, 1);
  for (const id of [
    'oracle:sd.room.contents',
    'rule:sd.search-move',
    'oracle:core.traps',
  ])
    assert.deepEqual(access(id), []);
});
test('corpse and treasure exact followups remain separate from preparation access', () => {
  for (const [table, roll, target] of [
    ['sd.search.strong', 1, 'oracle:core.corpsePlundering'],
    ['sd.search.strong', 4, 'oracle:core.treasures'],
    ['sd.search.weak', 2, 'oracle:core.corpsePlundering'],
  ] as const) {
    const reading = fixedReferenceReading(registry, { oracleId: table, roll });
    assert.ok(
      readingResultRelationships(index.byId, registry, reading).some(
        (x) => x.entry.id === target,
      ),
    );
    assert.deepEqual(access('oracle:' + table), []);
  }
});
test('candidate Roll still uses canonical regional resolver and SOURCE/Reaction/Morale', () => {
  let draws = 0;
  const result = executeReference(index.byId[candidate], {
    registry,
    rules,
    region: 'sarkash',
    stockKind: 'common',
    stockDR: 10,
    cityLarge: false,
    cityExits: false,
    rng: () => {
      draws++;
      return 0.2;
    },
  })!;
  assert.equal(draws, 2);
  assert.equal(result.creatureReferenceId, 'creature:core:61:nodh');
  assert.deepEqual(
    dungeonRelevantReferences(result, index.byId).map((x) => x.id),
    [
      'creature:core:61:nodh',
      'oracle:core.reaction',
      'rule:core.reaction-morale',
    ],
  );
});
test('access derivation consumes no RNG and leaves all source/registry/relationship objects untouched', () => {
  const before = hash({ rules, pack: getOraclePack(), registry, index, graph });
  const random = Math.random;
  Math.random = () => {
    throw new Error('access cannot roll');
  };
  try {
    for (const entry of index.entries) access(entry.id);
  } finally {
    Math.random = random;
  }
  assert.equal(
    hash({ rules, pack: getOraclePack(), registry, index, graph }),
    before,
  );
  assert.equal(graph.forward.length, 88);
  assert.equal(graph.reverse.length, 88);
  assert.equal(
    hash(registry),
    '2c8b3c7afca6b3cc5a4efbf87a714a72bcf69b0531a515e0bdb6e0b28f29a6b2',
  );
});
