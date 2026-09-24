import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { buildReferenceRegistry } from '../src/domain/references.ts';
import { setRules, getRules } from '../src/storage/rulesStore.ts';
import { setOraclePack, getOraclePack } from '../src/storage/oracleStore.ts';
import { fixedReferenceReading } from '../src/domain/referenceFixedLookup.ts';
import {
  physicalOracleRoll,
  readingFromOracleRolls,
} from '../src/domain/manualReferenceRoll.ts';
import {
  readingResultRelationships,
  rowResultRelationships,
  RESULT_ROW_POLICIES,
  resultRelationshipKey,
} from '../src/domain/resultRelationships.ts';
import { executeReference } from '../src/domain/referenceExecution.ts';
import {
  ReferenceContext,
  type DeskContext,
} from '../src/components/ReferenceContext.tsx';
import {
  ReadingResultReferences,
  renderResultReferenceLinks,
} from '../src/components/ResultReferenceLinks.tsx';
import { ReferenceReadingBlock } from '../src/components/InlineReferenceTools.tsx';
import { ReferenceTable } from '../src/components/ReferenceTable.tsx';
import { buildReferenceRelationships } from '../src/domain/referenceRelationships.ts';
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
const table = (id: string) => registry.tables.find((t) => t.id === id)!;
function reading(id: string, input: string) {
  const roll = physicalOracleRoll(table(id), input, registry);
  return readingFromOracleRolls(table(id).title, [roll], registry);
}
const links = (id: string, input: string) =>
  readingResultRelationships(
    index.byId,
    registry,
    reading(id, input),
    `oracle:${id}`,
  );
const desk: DeskContext = {
  entries: index.entries,
  byId: index.byId,
  activate: () => {},
  openLookup: () => {},
  openSearch: () => {},
  search: () => [],
  contextual: () => [],
  pinnedIds: [],
  recentIds: [],
  touch: () => {},
  togglePin: () => {},
};
const render = (node: ReturnType<typeof createElement>) =>
  renderToStaticMarkup(
    createElement(ReferenceContext.Provider, { value: desk }, node),
  );

test('Every audited row policy resolves exact source and destination with no duplicate keys', () => {
  const keys = new Set<string>();
  for (const p of RESULT_ROW_POLICIES) {
    assert.ok(
      table(p.table)?.entries.some((e) => e.min === p.min),
      `${p.table}:${p.min}`,
    );
    assert.ok(index.byId[p.target]?.available, p.target);
    const key = `${p.table}:${p.min}:${p.target}`;
    assert.ok(!keys.has(key));
    keys.add(key);
  }
});
test('Weather instruction, roadside corpses and village rolls have required direct links', () => {
  for (const [id, input, target] of [
    ['feretory.roadEvent', '5', 'oracle:core.weather'],
    ['feretory.roadEvent', '20', 'oracle:core.corpsePlundering'],
    ['feretory.forage', '5', 'oracle:feretory.village'],
  ]) {
    assert.equal(
      links(id, input).find((e) => e.entry.id === target)?.purpose,
      'REQUIRED',
    );
  }
});
test('Unlinked weather, quiet road and empty room results have no follow-up UI', () => {
  for (const [id, input] of [
    ['feretory.roadEvent', '1'],
    ['sd.room.contents', '12'],
    ['core.weather', '1'],
  ]) {
    assert.deepEqual(links(id, input), []);
    assert.equal(
      render(
        createElement(ReadingResultReferences, { reading: reading(id, input) }),
      ),
      '',
    );
  }
  assert.deepEqual(
    readingResultRelationships(
      index.byId,
      registry,
      undefined,
      'oracle:feretory.roadEvent',
    ),
    [],
  );
});
test('Dungeon common encounter is required, example monster generators are alternatives', () => {
  assert.equal(links('sd.room.contents', '6')[0].purpose, 'REQUIRED');
  const alternatives = links('sd.room.contents', '1');
  assert.equal(alternatives.length, 2);
  assert.ok(alternatives.every((e) => e.purpose === 'AVAILABLE'));
});
test('Depths danger preserves mandatory Reaction minus two and optional NPC detail', () => {
  const result = links('depths.danger', '6');
  const reaction = result.find((e) => e.entry.id === 'oracle:core.reaction')!;
  assert.equal(reaction.purpose, 'REQUIRED');
  assert.match(reaction.note!, /−2/);
  assert.equal(
    result.find((e) => e.entry.id === 'rule:sd.npc')?.purpose,
    'AVAILABLE',
  );
});
test('Hostile Reaction allows combat; neutral Reaction does not invent an encounter workflow', () => {
  for (const input of ['1,1', '2,2'])
    assert.equal(
      links('core.reaction', input).find(
        (e) => e.entry.id === 'rule:core.violence',
      )?.purpose,
      'AVAILABLE',
    );
  assert.deepEqual(links('core.reaction', '4,4'), []);
});
test('Only Broken result two requires the injury table', () => {
  assert.equal(
    links('core.broken', '2').find(
      (e) => e.entry.id === 'oracle:core.brokenInjury',
    )?.purpose,
    'REQUIRED',
  );
  for (const input of ['1', '3', '4'])
    assert.ok(
      !links('core.broken', input).some(
        (e) => e.entry.id === 'oracle:core.brokenInjury',
      ),
    );
});
test('Useful item example is optional; real subtable requirements remain required', () => {
  assert.equal(links('sd.search.strong', '2')[0].purpose, 'AVAILABLE');
  assert.equal(links('reclvse.quickContents', '2')[0].purpose, 'REQUIRED');
  assert.equal(links('core.gearA', '5')[0].purpose, 'REQUIRED');
});
test('Already generated subtables are reference access, not another mandatory roll', () => {
  const parent = physicalOracleRoll(table('feretory.campsite'), '10', registry);
  const child = physicalOracleRoll(
    table('feretory.campsite.campDream'),
    '1',
    registry,
  );
  const r = readingFromOracleRolls('Camp', [parent, child], registry);
  const edge = readingResultRelationships(index.byId, registry, r).find(
    (e) => e.entry.id === 'oracle:feretory.campsite.campDream',
  )!;
  assert.equal(edge.purpose, 'CONTEXT');
  assert.match(edge.note!, /이미 결과에 포함/);
});
test('Fixed lookup stays exact, distinct selectors survive and generic target is suppressed', () => {
  const r = fixedReferenceReading(registry, {
    oracleId: 'aitc.unexpected-events',
    roll: 6,
  });
  const result = readingResultRelationships(index.byId, registry, r);
  assert.deepEqual(
    result.map((e) => e.lookupRoll),
    [3, 5],
  );
  assert.ok(result.every((e) => e.purpose === 'CONTEXT'));
});
test('Row meaning wins over weaker reading-level shortcuts to the same reference', () => {
  const r = fixedReferenceReading(registry, {
    oracleId: 'feretory.roadEvent',
    roll: 5,
  });
  r.relatedIds = ['oracle:core.weather'];
  const result = readingResultRelationships(index.byId, registry, r);
  assert.equal(result.length, 1);
  assert.equal(result[0].purpose, 'REQUIRED');
});
test('Changed/unverified source rows and stale snapshots do not gain audited requirements', () => {
  const original = physicalOracleRoll(
    table('feretory.roadEvent'),
    '5',
    registry,
  );
  assert.deepEqual(
    rowResultRelationships(index.byId, registry, {
      ...original,
      text: 'user-authored weather fiction',
    }),
    [],
  );
  const changed = {
    ...registry,
    tables: registry.tables.map((t) =>
      t.id === original.oracleId
        ? {
            ...t,
            entries: t.entries.map((e) => ({
              ...e,
              metadata: { ...e.metadata, sourceStatus: 'PARTIAL' },
            })),
          }
        : t,
    ),
  };
  assert.deepEqual(rowResultRelationships(index.byId, changed, original), []);
  assert.deepEqual(rowResultRelationships({}, registry, original), []);
});
test('Creature Reaction and combat conditions are available, never unconditional requirements', () => {
  const entry = index.entries.find((e) => e.action?.kind === 'creature')!;
  const r = executeReference(entry, {
    registry,
    rules: getRules(),
    region: 'sarkash',
    stockKind: 'common',
    stockDR: 10,
    cityLarge: false,
    cityExits: false,
  })!;
  const result = readingResultRelationships(index.byId, registry, r, entry.id);
  assert.ok(
    result.some(
      (e) =>
        e.entry.id === 'oracle:core.reaction' &&
        e.purpose === 'AVAILABLE' &&
        e.note?.includes('불분명'),
    ),
  );
  const combat = index.byId['rule:core.violence'];
  const rules = {
    title: combat.title,
    blocks: [{ title: '', text: combat.summary }],
    sourceRefs: combat.sourceRefs,
  };
  const conditions = readingResultRelationships(
    index.byId,
    registry,
    rules,
    combat.id,
  );
  assert.equal(conditions.length, 3);
  assert.ok(conditions.every((e) => e.purpose === 'AVAILABLE' && e.note));
});
test('Uses and used-by stay composition links, never result requirements', () => {
  const graph = buildReferenceRelationships(index, registry);
  assert.equal(graph.forward.length, 88);
  assert.equal(graph.reverse.length, 88);
  const r = reading('sd.room.adjective', '1');
  assert.deepEqual(
    readingResultRelationships(
      index.byId,
      registry,
      r,
      'procedure:sd.room-description',
    ),
    [],
  );
});
test('Workbench and main result component expose the same row actions before source information', () => {
  const r = reading('feretory.roadEvent', '20');
  const main = render(
    createElement(ReadingResultReferences, {
      reading: r,
      referenceId: 'oracle:feretory.roadEvent',
    }),
  );
  const workbench = render(
    createElement(ReferenceReadingBlock, {
      reading: r,
      referenceId: 'oracle:feretory.roadEvent',
    }),
  );
  for (const html of [main, workbench]) {
    assert.match(html, /data-result-purpose="REQUIRED"/);
    assert.match(
      html,
      /data-relationship-target="oracle:core.corpsePlundering"/,
    );
  }
  assert.ok(
    workbench.indexOf('Two roadside corpses') <
      workbench.indexOf('data-result-purpose'),
  );
});
test('Table previews use the identical exact-row classification without rolling', () => {
  const html = render(
    createElement(ReferenceTable, {
      table: table('feretory.roadEvent'),
      currentEntryIds: [],
      onChoose: () => {
        throw Error('must not select on render');
      },
    }),
  );
  assert.match(
    html,
    /data-relationship-target="oracle:core.weather"[^>]*data-result-purpose="REQUIRED"/,
  );
});
test('Open-only callbacks keep plain and fixed navigation separate and never call perform', () => {
  const opened: unknown[] = [];
  const context = {
    ...desk,
    activate: (...args: unknown[]) => opened.push(args),
    openLookup: (value: unknown) => opened.push(value),
    perform: () => {
      throw Error('auto-roll');
    },
  };
  // Exercise actual button callbacks in the pure renderer.
  function visit(node: unknown) {
    if (Array.isArray(node)) node.forEach(visit);
    else if (node && typeof node === 'object' && 'props' in node) {
      const e = node as {
        type: unknown;
        props: { children?: unknown; onClick?: () => void };
      };
      if (e.type === 'button') e.props.onClick!();
      else visit(e.props.children);
    }
  }
  visit(renderResultReferenceLinks(links('feretory.roadEvent', '20'), context));
  visit(
    renderResultReferenceLinks(
      readingResultRelationships(
        index.byId,
        registry,
        fixedReferenceReading(registry, {
          oracleId: 'aitc.riot-complication',
          roll: 1,
        }),
      ),
      context,
    ),
  );
  assert.deepEqual(opened, [
    ['oracle:core.corpsePlundering'],
    { oracleId: 'aitc.npc-encounters', roll: 12 },
  ]);
});
test('Following references leaves retained origin reading and notebook storage contracts intact', () => {
  const origin = reading('feretory.roadEvent', '20');
  const state = retainReferenceReading(
    emptyReferenceSession(),
    'oracle:feretory.roadEvent',
    origin,
  );
  const after = retainReferenceReading(
    state,
    'oracle:core.corpsePlundering',
    reading('core.corpsePlundering', '1,1'),
  );
  assert.equal(after.readings['oracle:feretory.roadEvent'], origin);
  assert.deepEqual(Object.keys(after).sort(), [
    'readings',
    'rolls',
    'sequence',
  ]);
});
test('All displayed result edges resolve; classification does not mutate registry or consume RNG', (t) => {
  const before = JSON.stringify(registry);
  const rng = t.mock.method(globalThis.crypto, 'getRandomValues', () => {
    throw Error('no random navigation');
  });
  let count = 0;
  for (const tab of registry.tables)
    for (const row of tab.entries) {
      const edges = rowResultRelationships(index.byId, registry, {
        oracleId: tab.id,
        entryId: row.id,
        metadata: row.metadata,
        text: row.text,
      });
      assert.equal(
        new Set(edges.map(resultRelationshipKey)).size,
        edges.length,
      );
      for (const edge of edges) {
        assert.ok(index.byId[edge.entry.id]);
        count++;
      }
    }
  assert.ok(count > 247);
  assert.equal(rng.mock.callCount(), 0);
  assert.equal(JSON.stringify(registry), before);
  assert.deepEqual(
    [
      index.entries.length,
      registry.tables.length,
      registry.procedures.length,
      registry.tables.reduce((n, t) => n + t.entries.length, 0),
    ],
    [993, 546, 60, 12310],
  );
});
