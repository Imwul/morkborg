import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { setRules, getRules } from '../src/storage/rulesStore.ts';
import { setOraclePack, getOraclePack } from '../src/storage/oracleStore.ts';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { buildReferenceRegistry } from '../src/domain/references.ts';
import { executeReference } from '../src/domain/referenceExecution.ts';
import { DUNGEON_REFERENCE_TOPICS } from '../src/domain/referenceTopics.ts';
import { createDungeonCandidate } from '../src/generators/index.ts';

const fixturePath =
  process.env.MORKBORG_PRIVATE_AUDIT_FIXTURE ??
  'outputs/morkborg-private-data.json';
const hasFixture = existsSync(fixturePath);
function installed() {
  const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));
  setRules(fixture.library);
  setOraclePack(fixture.oracles);
  const rules = getRules()!,
    registry = buildOracleRegistry(rules, getOraclePack());
  return {
    rules,
    registry,
    references: buildReferenceRegistry(registry, rules),
  };
}

test(
  'entrance tools resolve the actual SD printed10–11 canonical descriptors with direct actions',
  { skip: !hasFixture },
  () => {
    const { references } = installed();
    const group = DUNGEON_REFERENCE_TOPICS[0];
    assert.deepEqual(group.ids, [
      'oracle:sd.building.size',
      'oracle:sd.building.form',
      'oracle:sd.building.material',
      'procedure:sd.material',
      'procedure:sd.sound',
      'oracle:sd.odoursTastes',
    ]);
    for (const id of group.ids) {
      const entry = references.byId[id];
      assert.ok(entry?.available && entry.action, id);
      assert.ok(entry.sourceRefs.length);
      for (const source of entry.sourceRefs) {
        assert.equal(source.bookId, 'sd');
        assert.ok([12, 13].includes(source.pdfPage as number), id);
        assert.equal(source.printedPage, (source.pdfPage as number) - 2);
        assert.equal(source.status, 'VERIFIED');
      }
    }
  },
);

test(
  'each optional entrance reference rolls independently and preserves saved dossier, rooms and crawl state',
  { skip: !hasFixture },
  () => {
    const { rules, registry, references } = installed();
    const dungeon = createDungeonCandidate('isolated-entrance-qa', 'sarkash');
    dungeon.crawl = {
      phase: 'danger',
      specialRoomIds: dungeon.rooms.map((r) => r.id),
      discoveredSpecialIds: [],
      visitedRoomIds: [],
      currentRoomId: null,
      threatRating: 12,
    };
    const saved = JSON.stringify(dungeon);
    for (const id of DUNGEON_REFERENCE_TOPICS[0].ids) {
      const reading = executeReference(references.byId[id], {
        registry,
        rules,
        region: dungeon.region,
        stockKind: 'common',
        stockDR: 12,
        rng: () => 0,
      });
      assert.ok(reading?.oracle?.rolls.length, id);
      for (const roll of reading.oracle.rolls) {
        assert.ok(roll.metadata?.provenance?.sourceRefs.length, id);
        assert.ok(
          roll.metadata.provenance.sourceRefs.every(
            (source) => source.bookId === 'sd',
          ),
          id,
        );
        assert.equal(roll.metadata.provenance.status, 'VERIFIED');
      }
      assert.equal(
        JSON.stringify(dungeon),
        saved,
        'Reference lookup must not replace the saved entrance or advance the crawl',
      );
    }
  },
);
