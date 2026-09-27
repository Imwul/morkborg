import fs from 'node:fs';
import { parsePrivateData } from '../src/storage/privateDataImport.ts';
import { createHash } from 'node:crypto';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { buildReferenceRegistry } from '../src/domain/references.ts';
import {
  buildReferenceRelationships,
  relatedReferenceRelationships,
} from '../src/domain/referenceRelationships.ts';
import { setRules, getRules } from '../src/storage/rulesStore.ts';
import { setOraclePack, getOraclePack } from '../src/storage/oracleStore.ts';
import { SPATIAL_SCENES } from '../src/domain/spatialScenes.ts';
import { SCENE_PLAY_ACTIONS } from '../src/domain/playGuidance.ts';
import { REFERENCE_SHELVES } from '../src/domain/freeformReference.ts';
import { DUNGEON_ACTIONS } from '../src/domain/dungeonActionMoves.ts';
import { DUNGEON_REFERENCE_TOPICS } from '../src/domain/referenceTopics.ts';
const b = JSON.parse(
  fs.readFileSync('outputs/morkborg-private-data.json', 'utf8'),
);
setRules(b.library);
setOraclePack(b.oracles);
const r = buildOracleRegistry(getRules(), getOraclePack()),
  i = buildReferenceRegistry(r, getRules()),
  g = buildReferenceRelationships(i, r);
const hash = (v: unknown) =>
  createHash('sha256').update(JSON.stringify(v)).digest('hex');
const scene = SPATIAL_SCENES.find((s) => s.id === 'dungeon')!;
const ids = [
  ...new Set([
    ...scene.hotspots.map((x) => x.referenceId),
    ...scene.supportGroups.flatMap((x) =>
      x.references.map((y) => y.referenceId),
    ),
    ...SCENE_PLAY_ACTIONS.dungeon.map((x) => x.referenceId),
    ...REFERENCE_SHELVES.dungeon.ids,
    ...DUNGEON_ACTIONS.map((x) => 'rule:' + x.ruleId),
    ...DUNGEON_REFERENCE_TOPICS.flatMap((x) => x.ids),
    'procedure:sd.dungeon-preparation',
    ...i.entries
      .filter(
        (e) =>
          e.action?.kind === 'regional-table' ||
          e.action?.kind === 'regional-monster',
      )
      .map((e) => e.id),
  ]),
];
const rows = ids.map((id) => {
  const e = i.byId[id];
  return {
    id,
    available: e?.available,
    action: e?.action,
    canonicalIds: e?.canonicalIds,
    relatedIds: e?.relatedIds,
    readerRelated: relatedReferenceRelationships(i, g, id).map((x) => ({
      id: x.entry.id,
      kind: x.kind,
      origins: x.origins,
    })),
    sourceRefs: e?.sourceRefs,
    entries: [
      ...scene.hotspots
        .filter((x) => x.referenceId === id)
        .map((x) => 'map:' + x.id),
      ...scene.supportGroups.flatMap((x) =>
        x.references
          .filter((y) => y.referenceId === id)
          .map((y) => 'support:' + y.id),
      ),
      ...SCENE_PLAY_ACTIONS.dungeon
        .filter((x) => x.referenceId === id)
        .map((x) => 'action:' + x.label),
      ...(REFERENCE_SHELVES.dungeon.ids.includes(id as never)
        ? ['legacy dungeon shelf (not rendered in Spatial)']
        : []),
    ],
  };
});
const rawRelated = i.entries.flatMap((e) =>
  e.relatedIds.map((t) => [e.id, i.byId[t]?.id ?? t]),
);
const integrity = {
  baselineCommit: 'fe2498253ee6c494d2c4e43ac449a5647fe509a2',
  counts: {
    references: i.entries.length,
    tables: r.tables.length,
    procedures: r.procedures.length,
    creatures: getRules()!.creatures.length,
    creatureReferences: i.entries.filter((e) => e.kind === 'creature').length,
    sourceRows: r.tables.reduce((n, t) => n + t.entries.length, 0),
    canonicalUses: g.forward.length,
    canonicalUsedBy: g.reverse.length,
    relationshipEvidence: g.evidence.length,
    relatedPairs: new Set(rawRelated.map((x) => x.join('→'))).size,
  },
  hashes: {
    library: hash(b.library),
    oracles: hash(b.oracles),
    parsedLibrary: hash(getRules()),
    parsedOracles: hash(getOraclePack()),
    registry: hash(r),
    canonicalRelationships: hash(g),
    relatedIds: hash(rawRelated),
  },
};
fs.mkdirSync('outputs/dungeon-access', { recursive: true });
fs.writeFileSync(
  'outputs/dungeon-access/inventory.json',
  JSON.stringify(rows, null, 2),
);
fs.writeFileSync(
  'outputs/dungeon-access/integrity.json',
  JSON.stringify(integrity, null, 2),
);
const accessTargets = i.entries
  .filter((e) =>
    relatedReferenceRelationships(i, g, e.id).some((x) =>
      x.origins.some((o) => o.endsWith('(reverse navigation)')),
    ),
  )
  .map((e) => e.id);
fs.writeFileSync(
  'outputs/dungeon-access/false-positive.json',
  JSON.stringify(
    {
      registryScan: i.entries.length,
      shownFor: accessTargets,
      notAddedFor: i.entries.length - accessTargets.length,
      fixturesCoveredBy: 'tests/dungeon-procedure-access.test.ts',
    },
    null,
    2,
  ),
);
console.log(integrity);
for (const id of [
  'rule:sd.stockCommon',
  'procedure:sd.room-description',
  'oracle:sd.room.contents',
  'rule:sd.search-move',
])
  console.log(JSON.stringify(rows.find((x) => x.id === id)));

// Decrypt the locally owned published envelope only to count/hash it. Never emit its key or source rows.
const latest = JSON.parse(
  fs.readFileSync('public/private-updates/latest.json', 'utf8'),
);
const envelope = JSON.parse(fs.readFileSync('public' + latest.file, 'utf8'));
const key = await crypto.subtle.importKey(
  'raw',
  Buffer.from(b.updateConnection.key, 'base64'),
  'AES-GCM',
  false,
  ['decrypt'],
);
const plain = await crypto.subtle.decrypt(
  {
    name: 'AES-GCM',
    iv: Buffer.from(envelope.iv, 'base64'),
    additionalData: new TextEncoder().encode(
      'morkborg-private-update:v1:' + latest.revision,
    ),
    tagLength: 128,
  },
  key,
  Buffer.from(envelope.data, 'base64'),
);
const distributed = parsePrivateData(
  JSON.parse(new TextDecoder().decode(plain)).bundle,
);
setRules(distributed.library);
setOraclePack(distributed.oracles);
const dr = buildOracleRegistry(getRules(), getOraclePack()),
  di = buildReferenceRegistry(dr, getRules()),
  dg = buildReferenceRelationships(di, dr);
fs.writeFileSync(
  'outputs/dungeon-access/distributed-integrity.json',
  JSON.stringify(
    {
      counts: {
        references: di.entries.length,
        tables: dr.tables.length,
        procedures: dr.procedures.length,
        creatures: getRules()!.creatures.length,
        creatureReferences: di.entries.filter((e) => e.kind === 'creature')
          .length,
        sourceRows: dr.tables.reduce((n, t) => n + t.entries.length, 0),
        canonicalUses: dg.forward.length,
        canonicalUsedBy: dg.reverse.length,
      },
      hashes: {
        library: hash(distributed.library),
        oracles: hash(distributed.oracles),
        registry: hash(dr),
        canonicalRelationships: hash(dg),
        encryptedAsset: createHash('sha256')
          .update(fs.readFileSync('public' + latest.file))
          .digest('hex'),
      },
    },
    null,
    2,
  ),
);
