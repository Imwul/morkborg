import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { buildReferenceRegistry } from '../src/domain/references.ts';
import {
  buildReferenceRelationships,
  relatedReferenceRelationships,
} from '../src/domain/referenceRelationships.ts';
import { setRules, getRules } from '../src/storage/rulesStore.ts';
import { setOraclePack, getOraclePack } from '../src/storage/oracleStore.ts';
const mode = process.env.AUDIT_MODE || 'before';
const bundle = JSON.parse(
  fs.readFileSync('outputs/morkborg-private-data.json', 'utf8'),
);
setRules(bundle.library);
setOraclePack(bundle.oracles);
const registry = buildOracleRegistry(getRules(), getOraclePack());
const references = buildReferenceRegistry(registry, getRules());
const graph = buildReferenceRelationships(references, registry);
const hash = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
const relatedIds = references.entries.map((entry) => [
  entry.id,
  entry.relatedIds,
]);
const corpus = JSON.parse(
  fs.readFileSync('scripts/reference-proximity-corpus.json', 'utf8'),
) as { id: string; target?: string }[];
if (new Set(corpus.map((f) => f.id)).size !== corpus.length)
  throw Error('Duplicate corpus reference');
const inventory = references.entries.map((entry) => ({
  id: entry.id,
  title: entry.title,
  kind: entry.kind,
  available: entry.available,
  action: entry.action,
  books: [...new Set(entry.sourceRefs.map((source) => source.bookId))],
  canonical: entry.canonicalIds,
  rollable: entry.canonicalIds.map(
    (id) => registry.tables.find((table) => table.id === id)?.rollable,
  ),
  related: relatedReferenceRelationships(references, graph, entry.id).map(
    (link) => ({ id: link.entry.id, kind: link.kind }),
  ),
}));
for (const fixture of corpus) {
  if (!references.byId[fixture.id]?.available)
    throw Error(`Unavailable corpus reference: ${fixture.id}`);
  if (fixture.target && !references.byId[fixture.target]?.available)
    throw Error(`Unavailable target: ${fixture.target}`);
}
const integrity = {
  commit: execFileSync('git', ['rev-parse', 'HEAD'], {
    encoding: 'utf8',
  }).trim(),
  counts: {
    references: references.entries.length,
    tables: registry.tables.length,
    procedures: registry.procedures.length,
    creatures: getRules()!.creatures.length,
    creatureReferences: references.entries.filter(
      (entry) => entry.kind === 'creature',
    ).length,
    sourceRows: registry.tables.reduce(
      (n, table) => n + table.entries.length,
      0,
    ),
    canonicalUses: graph.forward.length,
    canonicalUsedBy: graph.reverse.length,
    relationshipEvidence: graph.evidence.length,
    relatedPairs: new Set(
      references.entries.flatMap((entry) =>
        entry.relatedIds.map(
          (id) => `${entry.id}→${references.byId[id]?.id ?? id}`,
        ),
      ),
    ).size,
  },
  hashes: {
    rawLibrary: hash(bundle.library),
    rawOracles: hash(bundle.oracles),
    parsedLibrary: hash(getRules()),
    parsedOracles: hash(getOraclePack()),
    registry: hash(registry),
    references: hash(references),
    canonicalRelationships: hash(graph),
    relatedIds: hash(relatedIds),
    diceDefinitions: hash(
      registry.tables.map((table) => [
        table.id,
        table.dice,
        table.originalDice,
        table.rollable,
      ]),
    ),
    sourceMetadata: hash(
      references.entries.map((entry) => [
        entry.id,
        entry.sourceRefs,
        entry.sourceChain,
      ]),
    ),
  },
  corpusHash: hash(corpus),
  corpusSize: corpus.length,
};
const output = 'outputs/reference-proximity';
fs.mkdirSync(output, { recursive: true });
fs.writeFileSync(
  `${output}/inventory.json`,
  JSON.stringify(inventory, null, 2),
);
fs.writeFileSync(
  `${output}/integrity-${mode}.json`,
  JSON.stringify(integrity, null, 2),
);
fs.writeFileSync(
  `${output}/corpus.json`,
  JSON.stringify(
    corpus.map((fixture) => ({
      ...fixture,
      ...inventory.find((entry) => entry.id === fixture.id),
    })),
    null,
    2,
  ),
);
console.log(JSON.stringify(integrity, null, 2));
