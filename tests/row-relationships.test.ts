import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { buildReferenceRegistry } from '../src/domain/references.ts';
import { parseRulesPack } from '../src/storage/rulesStore.ts';
import { parseOraclePack } from '../src/storage/oracleStore.ts';
import {
  readRowRelationships,
  resolveRowRelationships,
} from '../src/domain/rowRelationships.ts';
import { oracleFollowUpLinks } from '../src/domain/referenceReading.ts';
import { fixedReferenceReading } from '../src/domain/referenceFixedLookup.ts';
import { selectOracleEntry } from '../src/generators/oracleRoller.ts';
import { isScenarioTable } from '../src/data/scenarioExclusions.ts';

const bundle = JSON.parse(
  readFileSync('outputs/morkborg-private-data.json', 'utf8'),
);
const rules = parseRulesPack(bundle.library);
const registry = buildOracleRegistry(rules, parseOraclePack(bundle.oracles));
const references = buildReferenceRegistry(registry, rules);
function row(tableId: string, selector: number) {
  const table = registry.tables.find((table) => table.id === tableId)!;
  assert.ok(table, tableId);
  const entry =
    table.rollable === false
      ? table.entries.find(
          (entry) => entry.min <= selector && entry.max >= selector,
        )!
      : selectOracleEntry(table, selector)!;
  assert.ok(entry, `${tableId}:${selector}`);
  return { table, entry };
}

test('Exact legacy procedure IDs expose procedural rules without name inference', () => {
  for (const [tableId, selector, expected, origin] of [
    [
      'sd.room.contents',
      1,
      'rule:depths.rareMonster',
      'followUp.choices.procedure',
    ],
    ['sd.room.contents', 6, 'rule:sd.stockCommon', 'followUp.procedure'],
    ['sd.room.contents', 8, 'rule:sd.stockRare', 'followUp.procedure'],
    ['depths.travel.encounter', 3, 'rule:sd.npc', 'followUp.procedure'],
  ] as const) {
    const { entry } = row(tableId, selector);
    const links = resolveRowRelationships(
      references.byId,
      entry.metadata,
      tableId,
    );
    assert.ok(
      links.some(
        (link) =>
          link.entry.id === expected &&
          link.kind === 'FOLLOW-UP' &&
          link.origin === origin,
      ),
    );
  }
  assert.deepEqual(
    resolveRowRelationships(references.byId, {
      followUp: {
        procedure: 'sd.NPC',
        externalTable: 'NPC',
        table: 'Selected regional monsters',
      },
    }),
    [],
  );
});

test('Explicit procedureId exposes the exact AITC artefact procedure', () => {
  const { entry } = row('aitc.notable-artefact-type', 3);
  const links = resolveRowRelationships(
    references.byId,
    entry.metadata,
    'aitc.notable-artefact-type',
  );
  assert.equal(
    links.filter(
      (link) => link.entry.id === 'procedure:aitc.artefact-depiction',
    ).length,
    1,
  );
});

test('Reference projection rows do not duplicate their existing definition controls', () => {
  const table = registry.tables.find(
    (table) => table.id === 'depths.playReferences',
  )!;
  const entry = table.entries.find(
    (entry) => entry.metadata?.procedureId === 'depths.rare-monster',
  )!;
  assert.ok(entry.metadata?.referenceId);
  assert.deepEqual(readRowRelationships(entry.metadata, table.id), []);
});

test('All 54 EPK identity rows resolve by exact book/source ID, never creature name', () => {
  let checked = 0;
  for (const table of registry.tables)
    for (const entry of table.entries) {
      if (!entry.metadata?.creatureId) continue;
      const links = resolveRowRelationships(
        references.byId,
        entry.metadata,
        table.id,
      );
      assert.equal(links.length, 1);
      assert.equal(
        links[0].entry.id,
        `creature:${table.sourceBookId}:${entry.metadata.creatureId}`,
      );
      assert.equal(links[0].entry.kind, 'creature');
      assert.equal(links[0].kind, undefined);
      checked++;
    }
  assert.equal(checked, 54);
  assert.deepEqual(
    readRowRelationships(
      { creatureId: 'feretory.epk.antideer' },
      'user.hunting',
    ),
    [],
  );
  assert.deepEqual(
    readRowRelationships(
      { creatureName: 'Antideer' },
      'feretory.hunting.tveland',
    ),
    [],
  );
});

test('Source subtable and scroll origins remain distinguishable', () => {
  for (const [tableId, selector, expected, origin] of [
    ['reclvse.quickContents', 1, 'oracle:reclvse.roomDiscovery', 'subtableId'],
    [
      'feretory.campsite',
      10,
      'oracle:feretory.campsite.campDream',
      'subtable.id',
    ],
    ['core.gearA', 5, 'oracle:core.unclean', 'scrollTable'],
  ] as const) {
    const { entry } = row(tableId, selector);
    const links = resolveRowRelationships(
      references.byId,
      entry.metadata,
      tableId,
    );
    assert.deepEqual(
      links.map((link) => [link.entry.id, link.kind, link.origin]),
      [[expected, 'SUBTABLE', origin]],
    );
  }
});

test('Paired aliases collapse to one destination while retaining their metadata origins', () => {
  const { entry } = row('aitc.stash-weak', 5);
  const links = resolveRowRelationships(
    references.byId,
    entry.metadata,
    'aitc.stash-weak',
  );
  assert.equal(links.length, 1);
  assert.equal(
    links[0].entry.id,
    references.byId['oracle:sd.npc.disposition'].id,
  );
  assert.deepEqual(links[0].origins, ['followUpOracleIds']);
  const repeated = resolveRowRelationships(references.byId, {
    followUpOracleIds: ['core.reaction', 'core.reaction'],
    followUp: { table: 'core.reaction' },
  });
  assert.equal(repeated.length, 1);
  assert.deepEqual(repeated[0].origins, [
    'followUpOracleIds',
    'followUp.table',
  ]);
});

test('Old fixed lookups keep exact targets and newly exposed fixedEntry selectors', () => {
  for (const [tableId, selector, target, fixed] of [
    ['aitc.civic-buildings', 2, 'aitc.npc-encounters', [54]],
    ['aitc.riot-complication', 1, 'aitc.npc-encounters', [12]],
    ['aitc.riot-complication', 2, 'aitc.npc-encounters', [54]],
    ['aitc.unexpected-events', 6, 'aitc.hazards', [3, 5]],
  ] as const) {
    const { entry } = row(tableId, selector);
    const links = resolveRowRelationships(
      references.byId,
      entry.metadata,
      tableId,
    );
    const lookups = links.filter((link) => link.kind === 'LOOKUP');
    assert.deepEqual(
      lookups.map((link) => [link.targetId, link.lookupRoll]),
      fixed.map((roll) => [`oracle:${target}`, roll]),
    );
    assert.ok(
      !links.some(
        (link) =>
          link.entry.id === references.byId[`oracle:${target}`].id &&
          link.lookupRoll == null,
      ),
    );
    for (const roll of fixed) {
      const reading = fixedReferenceReading(registry, {
        oracleId: target,
        roll,
      });
      assert.equal(reading.sourceRefs[0].tableId, target);
      assert.equal(reading.sourceRefs[0].roll, roll);
    }
  }
});

test('Fixed lookup dedupe keeps distinct canonical tables inside paired references', () => {
  const metadata = {
    fixedLookups: [
      { oracleId: 'sd.npc.disposition', roll: 1 },
      { oracleId: 'sd.npc.profession', roll: 1 },
      { oracleId: 'sd.npc.disposition', roll: 1 },
    ],
  };
  const links = resolveRowRelationships(references.byId, metadata);
  assert.equal(links.length, 2);
  assert.deepEqual(
    links.map((link) => link.targetId),
    ['oracle:sd.npc.disposition', 'oracle:sd.npc.profession'],
  );
  assert.equal(links[0].entry.id, links[1].entry.id);
});

test('Ambiguous fixedEntry selectors do not guess a target and malformed metadata is ignored', () => {
  const edges = readRowRelationships({
    fixedEntry: 12,
    fixedEntries: [3, 5],
    followUpOracleIds: ['core.reaction', 'core.weather'],
    fixedLookups: [
      null,
      { oracleId: 'core.reaction', roll: 1.5 },
      { oracleId: '', roll: 1 },
    ],
  });
  assert.equal(edges.length, 2);
  assert.ok(edges.every((edge) => edge.lookupRoll == null));
  assert.deepEqual(readRowRelationships(), []);
});

test('Self references and missing targets never become visible links', () => {
  const { entry } = row('depths.rare.special', 16);
  assert.ok(readRowRelationships(entry.metadata, 'depths.rare.special').length);
  assert.deepEqual(
    resolveRowRelationships(
      references.byId,
      entry.metadata,
      'depths.rare.special',
    ),
    [],
  );
  assert.deepEqual(
    resolveRowRelationships(
      references.byId,
      entry.metadata,
      'depths.rare.special',
      'oracle:core.reaction',
    ),
    [],
  );
  assert.deepEqual(
    resolveRowRelationships(references.byId, {
      followUpOracleIds: ['absent.table'],
    }),
    [],
  );
  assert.deepEqual(
    resolveRowRelationships(
      references.byId,
      { followUpOracleIds: ['core.reaction'] },
      undefined,
      'oracle:core.reaction',
    ),
    [],
  );
});

test('Changing rows replaces contextual relationships without retaining the former result', () => {
  const fifth = row('aitc.stash-weak', 5).entry;
  const first = row('aitc.stash-weak', 1).entry;
  const firstBefore = resolveRowRelationships(
    references.byId,
    first.metadata,
    'aitc.stash-weak',
  );
  const fifthLinks = resolveRowRelationships(
    references.byId,
    fifth.metadata,
    'aitc.stash-weak',
  );
  const firstAfter = resolveRowRelationships(
    references.byId,
    first.metadata,
    'aitc.stash-weak',
  );
  assert.ok(fifthLinks.length);
  assert.deepEqual(firstAfter, firstBefore);
  assert.ok(
    !firstAfter.some((link) => link.entry.id === fifthLinks[0].entry.id),
  );
});

test('Scenario exclusions apply to every new relationship representation', () => {
  const excluded = Object.keys(bundle.library.tables).find(isScenarioTable)!;
  assert.ok(excluded);
  assert.deepEqual(
    readRowRelationships({
      followUpOracleIds: [excluded],
      followUpReferenceIds: [`oracle:${excluded}`],
      followUp: { table: excluded, tables: [excluded] },
      fixedLookups: [{ oracleId: excluded, roll: 1 }],
      fixedEntry: 1,
    }),
    [],
  );
  assert.deepEqual(
    readRowRelationships({ followUpOracleIds: ['core.reaction'] }, excluded),
    [],
  );
});

test('Normalization performs direct ID reads only and consumes no RNG', () => {
  let reads = 0;
  const byId = new Proxy(references.byId, {
    ownKeys() {
      throw new Error('No registry scans permitted');
    },
    get(target, key, receiver) {
      reads++;
      return Reflect.get(target, key, receiver);
    },
  });
  const before = JSON.stringify(registry);
  const random = Math.random;
  try {
    Math.random = () => {
      throw new Error('Navigation must not roll');
    };
    const { entry } = row('aitc.stash-weak', 5);
    assert.equal(
      resolveRowRelationships(byId, entry.metadata, 'aitc.stash-weak').length,
      1,
    );
    assert.ok(reads < 10);
  } finally {
    Math.random = random;
  }
  assert.equal(JSON.stringify(registry), before);
});

test('Compatibility reading shape preserves all fixed lookup selectors without persistent fields', () => {
  const { entry } = row('aitc.unexpected-events', 6);
  assert.deepEqual(
    oracleFollowUpLinks(entry.metadata, 'aitc.unexpected-events').fixedLookups,
    [
      { oracleId: 'aitc.hazards', roll: 3 },
      { oracleId: 'aitc.hazards', roll: 5 },
    ],
  );
  for (const table of registry.tables)
    for (const entry of table.entries) {
      for (const edge of readRowRelationships(entry.metadata, table.id))
        assert.ok(
          references.byId[edge.targetId],
          `${table.id}/${entry.id}: ${edge.targetId}`,
        );
    }
});
