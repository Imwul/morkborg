import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { buildReferenceRegistry } from '../src/domain/references.ts';
import {
  sourceSubtableFamilies,
  sourceSubtableFamilyFor,
} from '../src/domain/sourceSubtableFamilies.ts';
import { readRowRelationships } from '../src/domain/rowRelationships.ts';
import { SCENARIO_TABLE_IDS } from '../src/data/scenarioExclusions.ts';

const fixture = JSON.parse(
  readFileSync('outputs/morkborg-private-data.json', 'utf8'),
);
const oracles = buildOracleRegistry(fixture.library, fixture.oracles);
const references = buildReferenceRegistry(oracles, fixture.library);

test('RECLVSE 10A–D share only the two printed room-content selectors', () => {
  const families = sourceSubtableFamilies(oracles, references);
  const expectedParents = [
    'oracle:reclvse.quickContents',
    'oracle:reclvse.contentsCategory',
  ];
  const expectedChildren = [
    'oracle:reclvse.roomDiscovery',
    'oracle:reclvse.roomHazard',
    'oracle:reclvse.roomEncounter',
    'oracle:reclvse.roomLoot',
  ];
  const family = sourceSubtableFamilyFor(families, 'oracle:reclvse.roomHazard');
  assert.ok(family);
  assert.deepEqual(family.parentIds, expectedParents);
  assert.deepEqual(family.childIds, expectedChildren);
  for (const id of [...expectedParents, ...expectedChildren]) {
    assert.equal(sourceSubtableFamilyFor(families, id), family);
    assert.ok(references.byId[id], id);
  }
  for (const id of expectedParents) {
    const table = oracles.tables.find((item) => `oracle:${item.id}` === id)!;
    const targets = table.entries.flatMap((entry) =>
      readRowRelationships(entry.metadata, table.id)
        .filter((edge) => edge.kind === 'SUBTABLE')
        .map((edge) => edge.targetId),
    );
    assert.deepEqual([...new Set(targets)], expectedChildren);
  }
  assert.equal(
    sourceSubtableFamilyFor(families, 'oracle:core.rooms'),
    undefined,
  );
});

test('MG2e paired meanings and conditional event rules remain distinct source relationships', () => {
  for (const [id, expected] of [
    [
      'oracle:mythic2.meaning.action-1',
      ['mythic2.meaning.action-1', 'mythic2.meaning.action-2'],
    ],
    [
      'oracle:mythic2.meaning.descriptor-1',
      ['mythic2.meaning.descriptor-1', 'mythic2.meaning.descriptor-2'],
    ],
  ] as const)
    assert.deepEqual(references.byId[id].canonicalIds, expected);

  const focus = oracles.tables.find(
    (table) => table.id === 'mythic2.random-event-focus-table',
  )!;
  assert.deepEqual(
    [
      ...new Set(
        focus.entries.flatMap((entry) =>
          readRowRelationships(entry.metadata, focus.id)
            .filter((edge) => edge.kind === 'FOLLOW-UP')
            .map((edge) => edge.targetId),
        ),
      ),
    ],
    ['rule:mythic.event-focus', 'rule:mythic.lists'],
  );
  assert.ok(
    references.byId[
      'oracle:mythic2.scene-adjustment-table'
    ].relatedIds.includes('rule:mythic.altered-scene'),
  );
  const element = references.byId['oracle:mythic2.meaning.dungeon-descriptors'];
  const pairId = 'procedure:mythic2.meaning.dungeon-descriptors.pair';
  assert.ok(element.relatedIds.includes(pairId));
  assert.deepEqual(references.byId[pairId].canonicalIds, [
    'mythic2.meaning.dungeon-descriptors',
    'mythic2.meaning.dungeon-descriptors',
  ]);
  assert.ok(
    !element.relatedIds.includes(
      'procedure:mythic2.meaning.city-descriptors.pair',
    ),
  );
  assert.equal(
    sourceSubtableFamilyFor(
      sourceSubtableFamilies(oracles, references),
      'oracle:mythic2.meaning.dungeon-descriptors',
    ),
    undefined,
  );
});

test('scenario-bound dungeon tables stay excluded while generic dungeon context is discoverable', () => {
  for (const id of SCENARIO_TABLE_IDS) {
    assert.ok(!oracles.tables.some((table) => table.id === id), id);
    assert.equal(references.byId[`oracle:${id}`], undefined, id);
  }
  for (const id of [
    'oracle:reclvse.quickContents',
    'oracle:reclvse.roomEncounter',
    'oracle:reclvse.dungeonTheme',
  ])
    assert.ok(references.byId[id].contexts.includes('dungeon'), id);
  for (const id of [
    'oracle:reclvse.city_purpose_then',
    'oracle:reclvse.city_purpose_now',
    'oracle:reclvse.neighborhood_problem',
  ]) {
    assert.ok(references.byId[id].contexts.includes('city'), id);
    assert.ok(!references.byId[id].contexts.includes('travel'), id);
  }
  assert.equal(oracles.tables.length, 546);
  assert.equal(references.entries.length, 993);
});
