import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import {
  buildReferenceRegistry,
  creatureReferenceId,
  rollRegionalTableReference,
} from '../src/domain/references.ts';
import { setRules, getRules } from '../src/storage/rulesStore.ts';
import { setOraclePack, getOraclePack } from '../src/storage/oracleStore.ts';
import {
  executeReference,
  type ReferenceExecutionOptions,
} from '../src/domain/referenceExecution.ts';
import { dungeonRelevantReferences } from '../src/domain/dungeonContext.ts';
import { readingResultRelationships } from '../src/domain/resultRelationships.ts';
import { fixedReferenceReading } from '../src/domain/referenceFixedLookup.ts';
import type { ReferenceReading } from '../src/domain/referenceReading.ts';
import { DungeonContextReferences } from '../src/components/DungeonContextReferences.tsx';
import {
  ReferenceContext,
  type DeskContext,
} from '../src/components/ReferenceContext.tsx';
import {
  emptyReferenceSession,
  retainReferenceReading,
} from '../src/domain/referenceSession.ts';
const bundle = JSON.parse(
  readFileSync('outputs/morkborg-private-data.json', 'utf8'),
);
setRules(bundle.library);
setOraclePack(bundle.oracles);
const registry = buildOracleRegistry(getRules(), getOraclePack());
const index = buildReferenceRegistry(registry, getRules());
const options: ReferenceExecutionOptions = {
  registry,
  rules: getRules(),
  region: 'sarkash',
  stockKind: 'common',
  stockDR: 10,
  cityLarge: false,
  cityExits: false,
  rng: () => 0.2,
};
const nodh = 'creature:core:61:nodh';
const encounter = () =>
  executeReference(index.byId['procedure:workbench.stock-room'], options)!;
const plain = (text: string): ReferenceReading => ({
  title: text,
  blocks: [{ title: '', text }],
  sourceRefs: [],
});
const links = (reading?: ReferenceReading, visible: string[] = []) =>
  dungeonRelevantReferences(
    reading,
    index.byId,
    'procedure:workbench.stock-room',
    visible,
  );
const ids = (reading?: ReferenceReading, visible: string[] = []) =>
  links(reading, visible).map((x) => x.id);
const existing = (reading: ReferenceReading) =>
  readingResultRelationships(index.byId, registry, reading);
const digest = (v: unknown) =>
  createHash('sha256').update(JSON.stringify(v)).digest('hex');

test('unrelated and old snapshots render no contextual area', () => {
  const desk = { byId: index.byId } as DeskContext;
  for (const reading of [undefined, plain('Room'), plain('')]) {
    assert.deepEqual(links(reading), []);
    assert.equal(
      renderToStaticMarkup(
        createElement(
          ReferenceContext.Provider,
          { value: desk },
          createElement(DungeonContextReferences, { reading, visibleIds: [] }),
        ),
      ),
      '',
    );
  }
});
test('resolved canonical encounter retains exact Nodh identity, without extra RNG', () => {
  let calls = 0;
  const reading = executeReference(
    index.byId['procedure:workbench.stock-room'],
    {
      ...options,
      rng: () => {
        calls++;
        return 0.2;
      },
    },
  )!;
  assert.equal(calls, 2); // Existing d6 selection + d2 quantity.
  assert.equal(reading.creatureReferenceId, nodh);
  assert.deepEqual(ids(reading), [
    nodh,
    'oracle:core.reaction',
    'rule:core.reaction-morale',
  ]);
});
test('every resolved regional d6 target preserves the canonical resolver identity; unresolved rows stay empty', () => {
  let resolved = 0,
    unresolved = 0;
  for (const entry of index.entries.filter(
    (e) =>
      e.action?.kind === 'regional-table' ||
      e.action?.kind === 'regional-monster',
  )) {
    for (let die = 1; die <= 6; die++) {
      const rng = () => (die - 0.5) / 6;
      const reading = executeReference(entry, { ...options, rng })!;
      const tableId = reading.oracle!.rolls[0].oracleId;
      const route = rollRegionalTableReference(
        tableId,
        registry,
        getRules(),
        rng,
      );
      if (route.preset) {
        resolved++;
        assert.equal(
          reading.creatureReferenceId,
          creatureReferenceId(route.preset),
        );
        assert.equal(
          index.byId[reading.creatureReferenceId!]?.kind,
          'creature',
        );
      } else {
        unresolved++;
        assert.equal(reading.creatureReferenceId, undefined);
        assert.deepEqual(links(reading), []);
      }
    }
  }
  assert.ok(resolved > 20);
  assert.ok(unresolved > 0);
});
test('canonical source inspection consumes no dice', () => {
  const reading = executeReference(index.byId[nodh], {
    ...options,
    rng: () => {
      throw new Error('no roll');
    },
  })!;
  assert.equal(reading.creatureReferenceId, nodh);
  assert.ok(reading.blocks.length);
  assert.ok(
    !dungeonRelevantReferences(reading, index.byId, nodh).some(
      (x) => x.id === nodh,
    ),
  );
});
test('creature names, corpse, treasure, trap and Korean prose never manufacture context', () => {
  for (const text of [
    'Nodh',
    'Seth × 3',
    'corpse dead bones treasure chest trap door monster footprints',
    '시체 함정 보물 괴물',
  ]) {
    assert.deepEqual(links(plain(text)), []);
    assert.deepEqual(
      links({
        ...plain(text),
        blocks: [{ title: 'Nodh', text, kind: 'creature' }],
      }),
      [],
    );
  }
});
test('invalid, unavailable and non-creature identities are rejected', () => {
  for (const id of ['missing', 'oracle:core.traps', 'book:core'])
    assert.deepEqual(links({ ...plain('Nodh'), creatureReferenceId: id }), []);
  assert.deepEqual(
    dungeonRelevantReferences(encounter(), {
      ...index.byId,
      [nodh]: { ...index.byId[nodh], available: false },
    }),
    [],
  );
});
test('only existing Reaction/Morale edges are used; live creature does not imply corpse or loot', () => {
  const r = encounter();
  assert.deepEqual(
    links(r).map((l) => l.evidence),
    ['SOURCE', 'RELATED', 'RELATED'],
  );
  const byId = {
    ...index.byId,
    [nodh]: {
      ...index.byId[nodh],
      relatedIds: ['oracle:core.treasures', 'book:core'],
    },
  };
  assert.deepEqual(
    dungeonRelevantReferences(r, byId).map((l) => l.id),
    [nodh],
  );
});
test('existing result links are deduplicated and the optional area has at most three items', () => {
  const r = encounter();
  const visible = existing(r).map((l) => l.entry.id);
  assert.deepEqual(ids(r, visible), [nodh]);
  assert.deepEqual(ids(r, [...visible, nodh, nodh]), []);
  assert.equal(new Set(ids(r)).size, ids(r).length);
  assert.equal(ids(r).length, 3);
});
test('new structured result immediately removes stale creature references', () => {
  const r = encounter();
  assert.ok(ids(r).includes(nodh));
  const empty = fixedReferenceReading(registry, {
    oracleId: 'sd.room.contents',
    roll: 12,
  });
  assert.deepEqual(ids(empty), []);
  const seth = executeReference(index.byId['procedure:workbench.stock-room'], {
    ...options,
    rng: () => 0.01,
  })!;
  assert.ok(!ids(seth).includes(nodh));
});
test('opening a canonical reference does not mutate the current encounter/session', () => {
  const r = encounter();
  const session = retainReferenceReading(
    emptyReferenceSession(),
    'procedure:workbench.stock-room',
    r,
  );
  const before = JSON.stringify(session);
  executeReference(index.byId[links(r)[0].id], options);
  assert.equal(JSON.stringify(session), before);
  assert.equal(session.readings['procedure:workbench.stock-room'], r);
});
test('existing exact corpse and treasure row links remain; no duplicate calibration surface', () => {
  for (const [table, roll, target] of [
    ['sd.search.weak', 2, 'oracle:core.corpsePlundering'],
    ['sd.search.strong', 1, 'oracle:core.corpsePlundering'],
    ['sd.search.strong', 4, 'oracle:core.treasures'],
  ] as const) {
    const r = fixedReferenceReading(registry, { oracleId: table, roll });
    assert.ok(existing(r).some((l) => l.entry.id === target));
    assert.deepEqual(links(r), []);
  }
});
test('already rolled treasure never appears as an unresolved request to roll the same table', () => {
  const r = fixedReferenceReading(registry, {
    oracleId: 'core.treasures',
    roll: 3,
  });
  assert.deepEqual(links(r), []);
  assert.ok(
    !existing(r).some(
      (l) => l.entry.id === 'oracle:core.treasures' && l.purpose !== 'CONTEXT',
    ),
  );
});
test('ambiguous remains/hazard/empty and door/trap results receive no invented procedure', () => {
  for (const [oracleId, roll] of [
    ['sd.room.contents', 2],
    ['sd.room.contents', 3],
    ['sd.room.contents', 10],
    ['sd.room.contents', 12],
    ['reclvse.dressing', 2],
    ['reclvse.exitType', 2],
    ['core.traps', 1],
  ] as const)
    assert.deepEqual(
      links(fixedReferenceReading(registry, { oracleId, roll })),
      [],
    );
});
test('calibration leaves canonical counts, oracle registry, source packs and reference index unchanged', () => {
  const before = digest({
    registry,
    index,
    rules: getRules(),
    pack: getOraclePack(),
  });
  for (const entry of index.entries.filter((e) => e.kind === 'creature')) {
    const r = executeReference(entry, options);
    dungeonRelevantReferences(r, index.byId, entry.id);
  }
  assert.equal(
    digest({ registry, index, rules: getRules(), pack: getOraclePack() }),
    before,
  );
  assert.deepEqual(
    [
      registry.tables.length,
      registry.procedures.length,
      index.entries.length,
      getRules()!.creatures.length,
      registry.tables.reduce((n, t) => n + t.entries.length, 0),
    ],
    [546, 60, 993, 89, 12310],
  );
  assert.equal(
    digest(registry),
    'dcea5c3c78721c2db2d194f885f16a97df62d0d7c3f5a60a0d369794e2c982d1',
  );
});
