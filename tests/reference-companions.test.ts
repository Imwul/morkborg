import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { buildReferenceRegistry } from '../src/domain/references.ts';
import { buildReferenceRelationships } from '../src/domain/referenceRelationships.ts';
import { referenceCompanions } from '../src/domain/referenceCompanions.ts';
import { parseRulesPack } from '../src/storage/rulesStore.ts';
import { parseOraclePack } from '../src/storage/oracleStore.ts';

const bundle = JSON.parse(
  readFileSync('outputs/morkborg-private-data.json', 'utf8'),
);
const rules = parseRulesPack(bundle.library);
const oracles = buildOracleRegistry(rules, parseOraclePack(bundle.oracles));
const index = buildReferenceRegistry(oracles, rules);
const relationships = buildReferenceRelationships(index, oracles);

test('changing the open reference changes the theme and useful destinations without history', () => {
  const reaction = referenceCompanions(
    index,
    relationships,
    'oracle:core.reaction',
  );
  const weather = referenceCompanions(
    index,
    relationships,
    'oracle:core.weather',
  );
  assert.equal(reaction.theme, '조우 · 반응');
  assert.equal(weather.theme, '여정 · 날씨');
  assert.ok(
    reaction.items.some(
      ({ entry }) => entry.id === 'rule:core.reaction-morale',
    ),
  );
  assert.ok(
    weather.items.some(({ entry }) => entry.id === 'oracle:feretory.roadType'),
  );
  assert.deepEqual(
    referenceCompanions(index, relationships, 'oracle:core.reaction'),
    reaction,
  );
});

test('companions retain real relationships and avoid aliases, self links, unavailable entries and result duplicates', () => {
  for (const entry of index.entries) {
    const { items } = referenceCompanions(index, relationships, entry.id, [
      'oracle:core.reaction',
    ]);
    assert.ok(items.length <= 6);
    assert.equal(
      new Set(items.map(({ entry }) => entry.id)).size,
      items.length,
    );
    for (const { entry: target } of items) {
      assert.equal(index.byId[target.id], target);
      assert.ok(target.available && target.action);
      assert.notEqual(target.id, entry.id);
      assert.notEqual(target.id, 'oracle:core.reaction');
      assert.ok(!['book', 'region'].includes(target.kind));
    }
  }
  const canonical = referenceCompanions(
    index,
    relationships,
    'oracle:sd.room.adjective',
  );
  assert.deepEqual(
    referenceCompanions(index, relationships, 'oracle:sd.room.type'),
    canonical,
  );
  assert.ok(
    canonical.items.some((item) => 'kind' in item && item.kind === 'USED BY'),
  );
});

test('missing or unclassified references do not borrow a previously viewed theme', () => {
  assert.deepEqual(referenceCompanions(index, relationships, 'unknown'), {
    theme: '연결된 참조',
    items: [],
  });
  assert.deepEqual(
    referenceCompanions(index, relationships, 'oracle:core.miseries'),
    { theme: '연결된 참조', items: [] },
  );
  assert.equal(
    referenceCompanions(index, relationships, 'oracle:core.names').theme,
    '인물 · 조우',
  );
});
