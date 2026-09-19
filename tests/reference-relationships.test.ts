import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { buildReferenceRegistry } from '../src/domain/references.ts';
import { parseRulesPack } from '../src/storage/rulesStore.ts';
import { parseOraclePack } from '../src/storage/oracleStore.ts';
import {
  buildReferenceRelationships,
  getReferenceRelationships,
  relatedReferenceRelationships,
} from '../src/domain/referenceRelationships.ts';
import type { OracleRegistry } from '../src/domain/oracle.ts';

const bundle = JSON.parse(
  readFileSync('outputs/morkborg-private-data.json', 'utf8'),
);
const rules = parseRulesPack(bundle.library);
const oracles = buildOracleRegistry(rules, parseOraclePack(bundle.oracles));
const references = buildReferenceRegistry(oracles, rules);
const relationships = buildReferenceRelationships(references, oracles);
const choices = (id: string) =>
  relatedReferenceRelationships(references, relationships, id);

test('Source procedure IDs produce only exact resolved forward and deterministic reverse relationships', () => {
  assert.equal(relationships.evidence.length, 137);
  assert.equal(relationships.forward.length, 79);
  assert.equal(relationships.reverse.length, 79);
  assert.ok(relationships.evidence.every((e) => e.status === 'resolved'));
  for (const forward of relationships.forward) {
    assert.equal(forward.kind, 'USES');
    assert.ok(references.byId[forward.sourceId]);
    assert.ok(references.byId[forward.targetId]);
    assert.notEqual(forward.sourceId, forward.targetId);
    assert.ok(forward.origins.length);
    assert.ok(forward.sourceRefs.length);
    assert.equal(
      relationships.reverse.filter(
        (reverse) =>
          reverse.sourceId === forward.targetId &&
          reverse.targetId === forward.sourceId &&
          reverse.kind === 'USED BY',
      ).length,
      1,
    );
  }
});

test('SD Core preparation uses carry source proof while RECLVSE app choice stays generic', () => {
  const preparation =
    relationships.bySource['procedure:sd.dungeon-preparation'];
  assert.equal(preparation.length, 7);
  assert.ok(preparation.every((e) => e.targetId.startsWith('oracle:core.')));
  const sampleRooms = choices('oracle:core.rooms').find(
    (e) => e.entry.id === 'procedure:sd.dungeon-preparation',
  )!;
  assert.equal(sampleRooms.kind, 'USED BY');
  assert.ok(sampleRooms.origins.some((origin) => origin.includes('special1')));
  assert.ok(
    sampleRooms.sourceRefs.some(
      (source) =>
        source.bookId === 'sd' && JSON.stringify(source.pdfPage) === '[9,19]',
    ),
  );
  assert.ok(
    !relationships.bySource['oracle:reclvse.dungeonEntrance']?.some(
      (e) => e.targetId === 'procedure:sd.dungeon-preparation',
    ),
  );
  assert.ok(
    !choices('procedure:sd.dungeon-preparation').find(
      (e) => e.entry.id === 'oracle:reclvse.dungeonEntrance',
    )?.kind,
  );
});

test('Repeated special-room fields and paired aliases produce one target with all original origins', () => {
  const sample = relationships.forward.filter(
    (e) =>
      e.sourceId === 'procedure:sd.dungeon-preparation' &&
      e.targetId === 'oracle:core.rooms',
  );
  assert.equal(sample.length, 1);
  assert.equal(sample[0].origins.length, 4);
  const room = relationships.forward.find(
    (e) => e.sourceId === 'procedure:sd.room-description',
  )!;
  assert.equal(room.targetId, 'oracle:sd.room.adjective');
  assert.deepEqual(room.aliasIds, ['oracle:sd.room.type']);
  assert.equal(room.origins.length, 2);
  assert.equal(
    choices('procedure:sd.room-description').filter(
      (e) => e.entry.id === room.targetId,
    ).length,
    1,
  );
  assert.equal(
    choices('oracle:sd.room.type').filter(
      (e) => e.entry.id === 'procedure:sd.room-description',
    ).length,
    1,
  );
});

test('Street optional exits are an explicit procedure use without promoting conditional oracle substeps', () => {
  const exits = choices('procedure:aitc.street').find(
    (e) => e.entry.id === 'oracle:aitc.street-exits',
  )!;
  assert.equal(exits.kind, 'USES');
  assert.ok(exits.origins.some((origin) => origin.includes('generatorSteps')));
  assert.equal(
    choices('oracle:aitc.street-exits').find(
      (e) => e.entry.id === 'procedure:aitc.street',
    )?.kind,
    'USED BY',
  );
  for (const id of [
    'oracle:aitc.notable-artefact-type',
    'oracle:feretory.forage',
    'oracle:feretory.campsite',
    'oracle:core.status',
  ])
    assert.ok(!relationships.bySource[id]?.some((e) => e.kind === 'USES'), id);
});

test('Reaction semantic shortcuts retain their generic label and are not reversed as source uses', () => {
  const reaction = choices('oracle:core.reaction');
  assert.ok(reaction.some((e) => e.entry.id === 'rule:core.reaction-morale'));
  assert.ok(reaction.every((e) => e.kind === undefined));
  assert.ok(
    !relationships.forward.some((e) => e.sourceId === 'oracle:core.reaction'),
  );
  assert.ok(
    !relationships.reverse.some((e) => e.targetId === 'oracle:core.reaction'),
  );
});

test('Unverified, unknown, absent source and self dependencies never become visible edges', () => {
  const example = oracles.procedures.find((p) => p.id === 'aitc.street')!;
  const altered: OracleRegistry = {
    ...oracles,
    tables: oracles.tables.map((t) =>
      t.id === 'aitc.street-adjective' ? { ...t, sourceVerified: false } : t,
    ),
    procedures: [
      {
        ...example,
        oracleIds: ['aitc.street-adjective', 'missing'],
        generatorSteps: [],
      },
      { ...example, id: 'missing-source', oracleIds: ['core.weather'] },
      {
        ...example,
        id: 'non-source',
        authority: 'APP_POLICY',
        oracleIds: ['core.weather'],
      },
    ],
  };
  const result = buildReferenceRelationships(references, altered);
  assert.ok(result.evidence.some((e) => e.status === 'unverified'));
  assert.ok(result.evidence.some((e) => e.status === 'missing-target'));
  assert.ok(result.evidence.some((e) => e.status === 'missing-source'));
  assert.ok(
    !result.evidence.some((e) => e.sourceId === 'procedure:non-source'),
  );
  assert.ok(
    !result.forward.some((e) => e.sourceId === 'procedure:aitc.street'),
  );
  const selfReferences = {
    ...references,
    byId: {
      ...references.byId,
      'oracle:aitc.street-adjective': references.byId['procedure:aitc.street'],
    },
  };
  const self = buildReferenceRelationships(selfReferences, oracles);
  assert.ok(self.evidence.some((e) => e.status === 'self'));
  assert.ok(self.forward.every((e) => e.sourceId !== e.targetId));
});

test('Related stays bounded and canonical target deduplication includes generic existing links', () => {
  for (const entry of references.entries) {
    const related = choices(entry.id);
    assert.ok(related.length <= 8);
    assert.equal(
      new Set(related.map((e) => e.entry.id)).size,
      related.length,
      entry.id,
    );
    assert.ok(
      related.every((e) => e.entry.id !== entry.id),
      entry.id,
    );
    assert.ok(
      related
        .filter((e) => e.entry.kind === 'book')
        .every((e) => e.kind === undefined),
    );
  }
  assert.deepEqual(choices('not-present'), []);
  assert.equal(
    relatedReferenceRelationships(
      references,
      relationships,
      'procedure:sd.dungeon-preparation',
      2,
    ).length,
    2,
  );
});

test('Relationship inspection is deterministic and mutates no source, reference or persistence data', () => {
  const source = JSON.stringify(oracles);
  const reference = JSON.stringify(references);
  const library = JSON.stringify(rules);
  const priorRandom = Math.random;
  try {
    Math.random = () => {
      throw new Error('relationship navigation must not consume RNG');
    };
    const read = buildReferenceRelationships(references, oracles);
    for (const entry of references.entries)
      relatedReferenceRelationships(references, read, entry.id);
    assert.deepEqual(read, relationships);
  } finally {
    Math.random = priorRandom;
  }
  assert.equal(JSON.stringify(oracles), source);
  assert.equal(JSON.stringify(references), reference);
  assert.equal(JSON.stringify(rules), library);
});

test('Cached derived index is reused for identical registries and rebuilt for new imported identities', () => {
  const first = getReferenceRelationships(references, oracles);
  assert.equal(getReferenceRelationships(references, oracles), first);
  assert.notEqual(getReferenceRelationships({ ...references }, oracles), first);
  assert.notEqual(getReferenceRelationships(references, { ...oracles }), first);
});

test('Reference adjacency queries never scan the registry entry collection', () => {
  const guarded = { ...references };
  Object.defineProperty(guarded, 'entries', {
    get() {
      throw new Error('global entries scan during render');
    },
  });
  assert.equal(
    relatedReferenceRelationships(
      guarded,
      relationships,
      'oracle:core.rooms',
    )[0].kind,
    'USED BY',
  );
});
