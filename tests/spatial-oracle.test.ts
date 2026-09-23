import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import {
  buildReferenceRegistry,
  searchReferences,
  relatedReferences,
} from '../src/domain/references.ts';
import {
  SPATIAL_SCENES,
  inspectSpatialHotspot,
  inspectSpatialReference,
  normalizeSpatialSceneId,
  validateSpatialScenes,
} from '../src/domain/spatialScenes.ts';
import {
  executeReference,
  referenceProducesRoll,
} from '../src/domain/referenceExecution.ts';
import {
  rollOracle,
  selectOracleEntry,
} from '../src/generators/oracleRoller.ts';
import { parseRulesPack } from '../src/storage/rulesStore.ts';
import { parseOraclePack } from '../src/storage/oracleStore.ts';
import {
  getReferenceRelationships,
  relatedReferenceRelationships,
} from '../src/domain/referenceRelationships.ts';
import { resolveRowRelationships } from '../src/domain/rowRelationships.ts';
import {
  emptyReferenceSession,
  retainReferenceReading,
  restoreReferenceRoll,
} from '../src/domain/referenceSession.ts';
import {
  readReferencePreferences,
  recentlyUsed,
  toggleReferencePin,
  writeReferencePreferences,
} from '../src/storage/referencePreferences.ts';
import {
  addToTray,
  emptyPlaySession,
  readPlaySession,
  writePlaySession,
} from '../src/storage/conveniencePreferences.ts';
import {
  emptyReferenceLocation,
  normalizeReferenceLocation,
  referenceLocationKey,
} from '../src/navigation/referenceLocation.ts';

const bundle = JSON.parse(
  readFileSync('outputs/morkborg-private-data.json', 'utf8'),
);
const rules = parseRulesPack(bundle.library);
const registry = buildOracleRegistry(rules, parseOraclePack(bundle.oracles));
const index = buildReferenceRegistry(registry, rules);
const hotspots = () => SPATIAL_SCENES.flatMap((scene) => scene.hotspots);
const supportReferences = () =>
  SPATIAL_SCENES.flatMap((scene) =>
    scene.supportGroups.flatMap((group) => group.references),
  );
const options = {
  registry,
  rules,
  region: 'sarkash' as const,
  stockKind: 'common' as const,
  stockDR: 10,
  cityLarge: false,
  cityExits: true,
  rng: () => 0,
};
const memory = () => {
  const values = new Map<string, string>();
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
  };
};

test('Every spatial feature resolves to an existing canonical reference with source attribution', () => {
  assert.deepEqual(validateSpatialScenes(SPATIAL_SCENES, index.byId), []);
  assert.ok(SPATIAL_SCENES.some((scene) => scene.id === 'dungeon'));
  assert.ok(SPATIAL_SCENES.some((scene) => scene.id === 'wilderness'));
  for (const scene of SPATIAL_SCENES) {
    assert.ok(scene.hotspots.length > 0, scene.id);
    for (const hotspot of scene.hotspots) {
      const reference = index.byId[hotspot.referenceId];
      assert.ok(index.entries.includes(reference), hotspot.id);
      assert.ok(reference.sourceRefs.length, hotspot.id);
      assert.ok(hotspot.semanticRole.trim(), hotspot.id);
      assert.ok(hotspot.visualTarget.trim(), hotspot.id);
      assert.ok(hotspot.accessibleLabel.trim(), hotspot.id);
    }
  }
});

test('Scene context shelves contain only validated, distinct source references', () => {
  assert.deepEqual(validateSpatialScenes(SPATIAL_SCENES, index.byId), []);
  assert.equal(supportReferences().length, 32);
  for (const scene of SPATIAL_SCENES) {
    const artworkIds = new Set(scene.hotspots.map((item) => item.referenceId));
    const shelfIds = new Set<string>();
    for (const group of scene.supportGroups) {
      assert.ok(group.title.trim(), group.id);
      for (const item of group.references) {
        const entry = index.byId[item.referenceId];
        assert.ok(entry, item.id);
        assert.ok(entry.sourceRefs.length, item.id);
        assert.ok(item.label.trim(), item.id);
        assert.equal(artworkIds.has(item.referenceId), false, item.id);
        assert.equal(shelfIds.has(item.referenceId), false, item.id);
        shelfIds.add(item.referenceId);
      }
    }
  }
  const city = SPATIAL_SCENES.find((scene) => scene.id === 'city')!;
  assert.ok(
    city.supportGroups.some((group) =>
      group.references.some(
        (item) => item.referenceId === 'oracle:reclvse.city_purpose_then',
      ),
    ),
  );
  assert.ok(
    city.supportGroups.some((group) =>
      group.references.some(
        (item) => item.referenceId === 'oracle:reclvse.city_purpose_now',
      ),
    ),
  );
});

test('Context shelf opens the same Reference state as a map target without rolling', (t) => {
  const rng = t.mock.method(globalThis.crypto, 'getRandomValues', () => {
    throw new Error('Context shelf must not roll');
  });
  for (const item of supportReferences()) {
    const calls: unknown[] = [];
    inspectSpatialReference(item.referenceId, {
      byId: index.byId,
      activate: (...args) => calls.push(args),
    });
    assert.deepEqual(calls, [[item.referenceId, false]], item.id);
  }
  assert.equal(rng.mock.callCount(), 0);
  assert.throws(
    () =>
      inspectSpatialReference('oracle:missing-context', {
        byId: index.byId,
        activate: () => assert.fail('Broken shelf entry cannot open'),
      }),
    /Missing spatial reference/,
  );
});

test('Shelf validation rejects missing IDs, duplicate groups and repeated scene references', () => {
  const scene = structuredClone(SPATIAL_SCENES[0]);
  scene.supportGroups.push(structuredClone(scene.supportGroups[0]));
  scene.supportGroups[1].references[0].referenceId = 'oracle:missing-context';
  scene.supportGroups[1].references[0].label = '';
  const problems = validateSpatialScenes([scene], index.byId).join('\n');
  assert.match(problems, /Duplicate support group/);
  assert.match(problems, /Duplicate support reference/);
  assert.match(problems, /Missing support reference/);
  assert.match(problems, /Missing support label/);
  assert.match(problems, /Repeated scene reference/);
});

test('Validation rejects missing references, duplicate scenes/hotspots, shadowed artwork and empty labels', () => {
  const [scene] = structuredClone(SPATIAL_SCENES);
  const broken = structuredClone(scene);
  broken.hotspots.push({
    ...broken.hotspots[0],
    referenceId: 'oracle:does-not-exist',
    accessibleLabel: '',
  });
  const problems = validateSpatialScenes([scene, broken], index.byId).join(
    '\n',
  );
  assert.match(problems, /Duplicate scene/);
  assert.match(problems, /Duplicate hotspot/);
  assert.match(problems, /Shadowed artwork/);
  assert.match(problems, /Missing reference/);
  assert.match(problems, /Missing accessible label/);
  assert.throws(
    () =>
      inspectSpatialHotspot(broken.hotspots.at(-1)!, {
        byId: index.byId,
        activate: () => assert.fail('Invalid targets must never activate'),
      }),
    /Missing spatial reference/,
  );
});

test('Redrawing artwork and changing registry labels do not change a feature’s semantic destination', () => {
  const hotspot = hotspots()[0];
  const reference = index.byId[hotspot.referenceId];
  const byId = {
    ...index.byId,
    [hotspot.referenceId]: { ...reference, title: 'Changed display title' },
  };
  const calls: unknown[] = [];
  inspectSpatialHotspot(
    { ...hotspot, visualTarget: 'redrawn-cutaway' },
    {
      byId,
      activate: (...args) => calls.push(args),
    },
  );
  assert.deepEqual(calls, [[reference.id, false]]);
});

test('Inspecting any feature calls the existing inspect operation with zero dice consumption', (t) => {
  const rng = t.mock.method(globalThis.crypto, 'getRandomValues', () => {
    throw new Error('Spatial inspection must not roll');
  });
  const before = JSON.stringify({ registry, references: index.entries });
  for (const hotspot of hotspots()) {
    const calls: unknown[] = [];
    inspectSpatialHotspot(hotspot, {
      byId: index.byId,
      activate: (...args) => calls.push(args),
    });
    assert.deepEqual(
      calls,
      [[index.byId[hotspot.referenceId].id, false]],
      hotspot.id,
    );
  }
  assert.equal(rng.mock.callCount(), 0);
  assert.equal(JSON.stringify({ registry, references: index.entries }), before);
});

test('Spatial inspection and Search resolve the same Reference location and table state', () => {
  for (const hotspot of hotspots()) {
    const reference = index.byId[hotspot.referenceId];
    const searchResult = searchReferences(index, reference.title, {
      limit: index.entries.length,
    }).find((entry) => entry.id === reference.id);
    assert.equal(searchResult, reference, hotspot.id);
    const inspectLocation = (id: string, roll = false) => {
      const entry = index.byId[id];
      return normalizeReferenceLocation({
        ...emptyReferenceLocation(),
        selectedId: entry.id,
        tableView:
          !roll && (entry.kind === 'oracle' || entry.defaultView === 'table'),
      });
    };
    let spatial = emptyReferenceLocation();
    inspectSpatialHotspot(hotspot, {
      byId: index.byId,
      activate: (id, roll) => {
        spatial = inspectLocation(id, roll);
      },
    });
    const searched = inspectLocation(searchResult.id, false);
    assert.deepEqual(spatial, searched, hotspot.id);
    assert.deepEqual(
      referenceLocationKey(spatial),
      referenceLocationKey(searched),
      hotspot.id,
    );
  }
});

test('Reference-only spatial targets do not advertise or execute a generic Roll', () => {
  const references = hotspots().map(
    (hotspot) => index.byId[hotspot.referenceId],
  );
  const readOnly = references.filter((entry) => !referenceProducesRoll(entry));
  assert.ok(readOnly.length >= 3);
  for (const reference of readOnly) {
    assert.equal(referenceProducesRoll(reference), false, reference.id);
    const reading = executeReference(reference, {
      ...options,
      rng: () => assert.fail(`Read-only target rolled: ${reference.id}`),
    });
    assert.equal(reading?.oracle, undefined, reference.id);
  }
});

test('Explicit rolls from spatial targets select canonical table entries through the existing engine', (t) => {
  t.mock.method(globalThis.crypto, 'getRandomValues', (values: Uint32Array) => {
    values.fill(0);
    return values;
  });
  const before = JSON.stringify(registry);
  for (const hotspot of hotspots()) {
    const reference = index.byId[hotspot.referenceId];
    if (!referenceProducesRoll(reference)) continue;
    assert.ok(
      ['oracle', 'procedure'].includes(reference.action?.kind ?? ''),
      hotspot.id,
    );
    const reading = executeReference(reference, options);
    assert.ok(reading?.oracle?.rolls.length, hotspot.id);
    const declaredIds =
      reference.action?.kind === 'oracle'
        ? reference.action.oracleIds
        : (registry.procedures.find(
            (procedure) =>
              reference.action?.kind === 'procedure' &&
              procedure.id === reference.action.procedureId,
          )?.oracleIds ?? []);
    assert.ok(declaredIds.length, hotspot.id);
    for (const id of declaredIds)
      assert.ok(
        reading.oracle.rolls.some((roll) => roll.oracleId === id),
        id,
      );
    for (const roll of reading.oracle.rolls) {
      const tableId = roll.oracleId;
      const table = registry.tables.find(
        (candidate) => candidate.id === tableId,
      );
      assert.ok(table, tableId);
      assert.notEqual(table.rollable, false, tableId);
      const canonical = rollOracle(table, registry, options.rng);
      assert.equal(roll.entryId, canonical.entryId, tableId);
      assert.equal(roll.roll, canonical.roll, tableId);
      assert.equal(roll.text, canonical.text, tableId);
      assert.deepEqual(roll.diceValues, canonical.diceValues, tableId);
      assert.equal(
        selectOracleEntry(table, roll.roll)?.id,
        roll.entryId,
        tableId,
      );
      assert.ok(
        reading.sourceRefs.some((source) => source.tableId === tableId),
        tableId,
      );
    }
  }
  assert.equal(JSON.stringify(registry), before);
});

test('Scene destinations retain normal Recent and Pins identities through existing storage', () => {
  const storage = memory();
  let prefs = readReferencePreferences(storage);
  for (const hotspot of hotspots()) {
    inspectSpatialHotspot(hotspot, {
      byId: index.byId,
      activate: (id) => {
        prefs = recentlyUsed(prefs, id);
      },
    });
  }
  const referenceId = index.byId[hotspots()[0].referenceId].id;
  prefs = recentlyUsed(prefs, referenceId);
  prefs = recentlyUsed(prefs, referenceId);
  prefs = toggleReferencePin(prefs, referenceId);
  writeReferencePreferences(prefs, storage);
  const restored = readReferencePreferences(storage);
  assert.deepEqual(restored, prefs);
  assert.equal(restored.recentIds[0], referenceId);
  assert.equal(restored.recentIds.filter((id) => id === referenceId).length, 1);
  assert.equal(restored.recentIds.length, 10);
  assert.deepEqual(restored.pinnedIds, [referenceId]);
  assert.deepEqual([...storage.values.keys()], ['morkborg-reference-desk:v1']);
  assert.ok(restored.recentIds.every((id) => index.byId[id]));
  assert.deepEqual(toggleReferencePin(restored, referenceId).pinnedIds, []);
});

test('Scene destinations use existing Workbench identities and retain results without rerolling', () => {
  const storage = memory();
  let workbench = emptyPlaySession();
  let session = emptyReferenceSession();
  const targets = [
    ...new Set(hotspots().map((hotspot) => index.byId[hotspot.referenceId].id)),
  ].slice(0, 10);
  for (const id of targets) {
    workbench = addToTray(addToTray(workbench, id), id);
    const entry = index.byId[id];
    if (referenceProducesRoll(entry)) {
      const reading = executeReference(entry, options)!;
      session = retainReferenceReading(session, id, reading);
    }
  }
  writePlaySession(workbench, storage);
  assert.deepEqual(readPlaySession(storage).tray, targets);
  assert.deepEqual([...storage.values.keys()], ['morkborg-play-session:v1']);
  assert.ok(session.rolls.length);
  const previous = session.rolls.at(-1)!;
  const restored = restoreReferenceRoll(session, previous.sequence);
  assert.equal(restored.readings[previous.referenceId], previous.reading);
  assert.deepEqual(restored.rolls, session.rolls);
});

test('Inspecting a scene preserves Related, USES, USED BY and row FOLLOW-UP / SUBTABLE / LOOKUP edges', () => {
  const relationships = getReferenceRelationships(index, registry);
  const snapshot = () =>
    JSON.stringify({
      relationships,
      related: index.entries.map((entry) => [entry.id, entry.relatedIds]),
      rows: registry.tables.map((table) => [
        table.id,
        table.entries.map((row) => [row.id, row.metadata]),
      ]),
    });
  const before = snapshot();
  let relatedCount = 0;
  for (const hotspot of hotspots()) {
    inspectSpatialHotspot(hotspot, {
      byId: index.byId,
      activate: (id) => {
        relatedCount += relatedReferences(index, id).length;
        for (const relationship of relatedReferenceRelationships(
          index,
          relationships,
          id,
        ))
          assert.ok(index.byId[relationship.entry.id], id);
      },
    });
  }
  const rowKinds = new Set<string>();
  for (const table of registry.tables)
    for (const row of table.entries)
      for (const relationship of resolveRowRelationships(
        index.byId,
        row.metadata,
        table.id,
      )) {
        assert.ok(index.byId[relationship.entry.id]);
        if (relationship.kind) rowKinds.add(relationship.kind);
      }
  assert.ok(relatedCount > 0);
  assert.ok(relationships.forward.length > 0);
  assert.ok(relationships.reverse.length > 0);
  for (const kind of ['FOLLOW-UP', 'SUBTABLE', 'LOOKUP'])
    assert.ok(rowKinds.has(kind), kind);
  assert.equal(snapshot(), before);
});

test('Scene navigation normalizes stale state while preserving all supported scene IDs', () => {
  for (const scene of SPATIAL_SCENES)
    assert.equal(normalizeSpatialSceneId(scene.id), scene.id);
  for (const invalid of [null, undefined, {}, [], 'removed-scene', 3])
    assert.equal(normalizeSpatialSceneId(invalid), 'dungeon');
  const previous = {
    ...emptyReferenceLocation(),
    selectedId: hotspots()[0].referenceId,
  };
  assert.deepEqual(normalizeReferenceLocation(previous), previous);
});

test('Spatial navigation preserves baseline canonical data hashes and registry cardinality', () => {
  const baseline = JSON.parse(
    readFileSync('docs/spatial-oracle/registry-baseline.json', 'utf8'),
  );
  for (const [path, hash] of Object.entries(baseline.files)) {
    if (
      !path.startsWith('src/data/') &&
      !path.startsWith('public/rules/') &&
      path !== 'outputs/morkborg-private-data.json'
    )
      continue;
    assert.equal(
      createHash('sha256').update(readFileSync(path)).digest('hex'),
      hash,
      path,
    );
  }
  assert.equal(registry.tables.length, 546);
  assert.equal(registry.procedures.length, 60);
  assert.equal(index.entries.length, 993);
  assert.equal(
    registry.tables.reduce((sum, table) => sum + table.entries.length, 0),
    12310,
  );
  assert.equal(
    new Set(registry.tables.map((table) => table.id)).size,
    registry.tables.length,
  );
  assert.equal(
    new Set(index.entries.map((entry) => entry.id)).size,
    index.entries.length,
  );
});

test('Both distributed data and the archival fixture resolve every scene without adding canonical tables', () => {
  const publicRules = parseRulesPack(
    JSON.parse(readFileSync('public/rules/library.json', 'utf8')),
  );
  const publicPack = parseOraclePack(
    JSON.parse(readFileSync('public/rules/oracles.json', 'utf8')),
  );
  const publicRegistry = buildOracleRegistry(publicRules, publicPack);
  const publicReferences = buildReferenceRegistry(publicRegistry, publicRules);
  assert.deepEqual(
    validateSpatialScenes(SPATIAL_SCENES, publicReferences.byId),
    [],
  );
  assert.equal(publicRegistry.tables.length, 545);
  assert.equal(publicRegistry.procedures.length, 60);
  assert.equal(
    publicRegistry.tables.reduce((sum, table) => sum + table.entries.length, 0),
    12305,
  );
  assert.equal(publicReferences.entries.length, 987);
  for (const hotspot of hotspots()) {
    const published = publicReferences.byId[hotspot.referenceId];
    const archival = index.byId[hotspot.referenceId];
    assert.equal(published.id, archival.id, hotspot.id);
    assert.deepEqual(published.canonicalIds, archival.canonicalIds, hotspot.id);
    assert.equal(published.available, true, hotspot.id);
    assert.equal(
      referenceProducesRoll(published),
      referenceProducesRoll(archival),
      hotspot.id,
    );
  }
});
