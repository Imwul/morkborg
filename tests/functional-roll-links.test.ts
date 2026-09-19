import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReferenceNextSteps } from '../src/components/ReferenceNextSteps.tsx';
import {
  ReferenceContext,
  type DeskContext,
} from '../src/components/ReferenceContext.tsx';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { buildReferenceRegistry } from '../src/domain/references.ts';
import { parseRulesPack } from '../src/storage/rulesStore.ts';
import { parseOraclePack } from '../src/storage/oracleStore.ts';
import { inlineSourceSubtable } from '../src/domain/inlineSourceSubtable.ts';
import { oracleFollowUpLinks } from '../src/domain/referenceReading.ts';
import {
  manualTableReading,
  physicalOracleRoll,
} from '../src/domain/manualReferenceRoll.ts';
import {
  diceDomain,
  rollOracle,
  selectOracleEntry,
} from '../src/generators/oracleRoller.ts';
import { isScenarioTable } from '../src/data/scenarioExclusions.ts';

const bundle = JSON.parse(
  readFileSync('outputs/morkborg-private-data.json', 'utf8'),
);
const rules = parseRulesPack(bundle.library);
const registry = buildOracleRegistry(rules, parseOraclePack(bundle.oracles));
const references = buildReferenceRegistry(registry, rules);
const table = (id: string) => {
  const found = registry.tables.find((t) => t.id === id);
  assert.ok(found, id);
  return found;
};

for (const [id, input, selector, expected] of [
  ['core.corpsePlundering', '55', 55, 'Bloodstained knuckle-duster.'],
  ['reclvse.npcAppearance', '97', 97, 'Gaudy jewelry'],
  ['core.reaction', '3,4', 7, 'Indifferent'],
  ['core.rooms', '3,5', 35, 'Mirrors everywhere'],
  ['core.names', '6,8', 68, 'Wemut'],
] as const) {
  test(`Physical ${id} ${input} keeps original selector, result and provenance`, () => {
    const source = table(id);
    const result = physicalOracleRoll(source, input, registry);
    assert.equal(result.roll, selector);
    assert.equal(result.text, expected);
    assert.equal(result.entryId, selectOracleEntry(source, selector)!.id);
    assert.equal(result.metadata?.rollOrigin, 'USER_ROLL');
    assert.equal(result.metadata?.provenance?.sourceRefs[0].tableId, id);
  });
}

test('Every active rollable domain preserves exact physical and canonical row selection', () => {
  let checked = 0;
  for (const source of registry.tables.filter(
    (t) => t.sourceVerified && t.rollable !== false,
  )) {
    if (source.dice === '2d6') {
      for (let first = 1; first <= 6; first++)
        for (let second = 1; second <= 6; second++) {
          const result = physicalOracleRoll(
            source,
            `${first},${second}`,
            registry,
          );
          assert.equal(
            result.entryId,
            selectOracleEntry(source, first + second)?.id ?? null,
          );
          assert.deepEqual(result.diceValues, [first, second]);
          checked++;
        }
    } else {
      for (const selector of diceDomain(source.dice)) {
        const result = physicalOracleRoll(source, String(selector), registry);
        assert.equal(
          result.entryId,
          selectOracleEntry(source, selector)?.id ?? null,
        );
        checked++;
      }
    }
  }
  assert.ok(checked > 12000);
});

test('All five original Core inline subtables reuse audited formulas, ranges, translations and parent sources', () => {
  for (const [id, selector, dice, rows, page] of [
    ['core.status', 3, 'd4', 4, 71],
    ['core.danger', 1, 'd4', 2, 72],
    ['core.rooms', 11, 'd6', 6, 73],
    ['core.rooms', 33, 'd4', 2, 74],
    ['core.rooms', 43, 'd4', 2, 74],
  ] as const) {
    const parent = table(id);
    const entry = selectOracleEntry(parent, selector)!;
    const child = inlineSourceSubtable(parent, entry)!;
    assert.ok(child);
    assert.equal(child.dice, dice);
    assert.equal(child.id, parent.id);
    assert.equal(child.entries.length, rows);
    assert.equal(child.sourcePage, page);
    const raw = entry.metadata!.followup as {
      text: string;
      meta: Record<string, unknown>;
    }[];
    assert.deepEqual(
      child.entries.map((e) => e.text),
      raw.map((e) => e.text),
    );
    assert.deepEqual(
      child.entries.map((e) => e.metadata!.ko),
      raw.map((e) => e.meta.ko),
    );
    for (const value of diceDomain(dice))
      assert.ok(selectOracleEntry(child, value));
  }
});

test('Sample motif opening never rolls; explicit physical/digital child results leave parent unchanged', () => {
  const parent = table('core.rooms');
  let parentCalls = 0;
  const result = rollOracle(parent, registry, () => {
    parentCalls++;
    return 0;
  });
  const snapshot = JSON.stringify(result);
  const size = registry.tables.length;
  const sourceSnapshot = JSON.stringify(parent);
  assert.equal(parentCalls, 2);
  assert.equal(result.roll, 11);
  assert.equal(result.text, 'Inscriptions, the motifs are');
  const entry = selectOracleEntry(parent, 11)!;
  const child = inlineSourceSubtable(parent, entry)!;
  assert.equal(parentCalls, 2);
  const physical = physicalOracleRoll(child, '3', registry);
  assert.equal(physical.text, 'Hypnotic');
  assert.equal(physical.metadata!.provenance!.sourceRefs[0].pdfPage, 73);
  assert.equal(
    physical.metadata!.provenance!.sourceRefs[0].tableId,
    'core.rooms',
  );
  assert.equal(physical.entryId, `${entry.id}/followup:3-3`);
  let childCalls = 0;
  assert.equal(
    rollOracle(child, registry, () => {
      childCalls++;
      return 0.99;
    }).text,
    'Ugly and pointless',
  );
  assert.equal(childCalls, 1);
  assert.equal(JSON.stringify(parent), sourceSnapshot);
  assert.equal(JSON.stringify(result), snapshot);
  assert.equal(registry.tables.length, size);
});

test('Unsupported, malformed and unrelated inline entries never receive inferred dice or new canonical tables', () => {
  const parent = table('core.rooms');
  assert.equal(
    inlineSourceSubtable(parent, selectOracleEntry(parent, 12)!),
    null,
  );
  assert.equal(
    inlineSourceSubtable(
      { ...parent, sourceVerified: false },
      parent.entries[0],
    ),
    null,
  );
  assert.equal(
    inlineSourceSubtable(
      { ...parent, sourceBookId: 'user' },
      parent.entries[0],
    ),
    null,
  );
  const malformed = {
    ...parent.entries[0],
    metadata: { followup: [{ text: 'Unknown die', weight: 6, meta: {} }] },
  };
  assert.equal(
    inlineSourceSubtable({ ...parent, entries: [malformed] }, malformed),
    null,
  );
  const overlap = {
    ...parent.entries[0],
    metadata: {
      followup: [
        { text: 'First', weight: 3, meta: { min: 1, max: 4 } },
        { text: 'Second', weight: 3, meta: { min: 4, max: 6 } },
      ],
    },
  };
  assert.equal(
    inlineSourceSubtable({ ...parent, entries: [overlap] }, overlap),
    null,
  );
});

test('Legacy exact table IDs, RECLVSE columns, campDream and scrolls resolve as optional references', () => {
  for (const [id, selector, expected] of [
    ['sd.room.contents', 11, ['oracle:sd.search.strong', 'oracle:sd.yesNo']],
    ['reclvse.quickContents', 1, ['oracle:reclvse.roomDiscovery']],
    ['reclvse.contentsCategory', 4, ['oracle:reclvse.roomLoot']],
    ['feretory.campsite', 10, ['oracle:feretory.campsite.campDream']],
    ['core.gearA', 5, ['oracle:core.unclean']],
  ] as const) {
    const source = table(id);
    const entry = selectOracleEntry(source, selector)!;
    const linked = oracleFollowUpLinks(entry.metadata, source.id).relatedIds!;
    assert.deepEqual(linked, expected);
    assert.ok(linked.every((key) => references.byId[key]));
  }
  assert.deepEqual(
    oracleFollowUpLinks({
      followUp: {
        externalTable: 'Maybe a treasure?',
        table: 'Selected regional monsters',
      },
    }).relatedIds,
    [],
  );
  assert.deepEqual(
    oracleFollowUpLinks({ subtableId: 'roomLoot' }, 'user.quickContents')
      .relatedIds,
    [],
  );
});

test('Physical parent result contains source links without executing children or requiring missing presentation targets', () => {
  const source = table('sd.room.contents');
  const partial = {
    ...registry,
    tables: registry.tables.filter(
      (t) => !['sd.search.strong', 'sd.yesNo'].includes(t.id),
    ),
  };
  const reading = manualTableReading(
    references.byId['oracle:sd.room.contents'],
    [source],
    { '0': '11' },
    partial,
  );
  assert.equal(reading.oracle!.rolls.length, 1);
  assert.equal(reading.oracle!.rolls[0].roll, 11);
  assert.deepEqual(reading.relatedIds, [
    'oracle:sd.search.strong',
    'oracle:sd.yesNo',
  ]);
  assert.ok(!source.entries[8].metadata?.followUpOracleIds);
});

test('Relationship normalization does not expose excluded scenarios and never expands the registry', () => {
  assert.deepEqual(
    oracleFollowUpLinks({ followUpOracleIds: ['custom-table'] }).relatedIds,
    ['oracle:custom-table'],
  );
  const excluded = Object.keys(bundle.library.tables).find(isScenarioTable);
  assert.ok(excluded);
  assert.deepEqual(
    oracleFollowUpLinks({
      followUpOracleIds: [excluded],
      followUp: { table: excluded },
      fixedLookups: [{ oracleId: excluded, roll: 1 }],
    }),
    { relatedIds: [], fixedLookups: [] },
  );
  const count = registry.tables.length;
  const knownEdges = registry.tables.flatMap((t) =>
    t.entries.flatMap((e) => oracleFollowUpLinks(e.metadata, t.id).relatedIds!),
  );
  assert.ok(
    knownEdges.every((id) => references.byId[id]),
    'All actual metadata links resolve',
  );
  assert.equal(registry.tables.length, count);
  const miseries = table('core.miseries');
  assert.equal(miseries.entries.length, 36);
  assert.equal(miseries.sourceBookId, 'core');
  assert.equal(miseries.forcedFinal!.label, '7:7');
  assert.ok(!diceDomain(miseries.dice).includes(77));
});

test('Actual source links with paired canonical aliases render one button per usable Reference', () => {
  const context: DeskContext = {
    entries: references.entries,
    byId: references.byId,
    activate: () => {
      throw new Error('Rendering must not activate or roll a reference');
    },
    openSearch: () => {},
    search: () => [],
    contextual: () => [],
    pinnedIds: [],
    recentIds: [],
    touch: () => {},
    togglePin: () => {},
  };
  const source = table('aitc.stash-weak');
  const entry = selectOracleEntry(source, 5)!;
  assert.deepEqual(entry.metadata!.followUpOracleIds, [
    'sd.npc.disposition',
    'sd.npc.profession',
  ]);
  const markup = renderToStaticMarkup(
    createElement(
      ReferenceContext.Provider,
      { value: context },
      createElement(ReferenceNextSteps, {
        metadata: entry.metadata,
        tableId: source.id,
      }),
    ),
  );
  assert.equal((markup.match(/<button/g) ?? []).length, 1);
  assert.ok(
    markup.includes(references.byId['oracle:sd.npc.disposition'].title),
  );
});
