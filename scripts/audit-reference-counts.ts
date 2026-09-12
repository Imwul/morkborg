import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { buildReferenceRegistry } from '../src/domain/references.ts';
import { setRules, getRules } from '../src/storage/rulesStore.ts';
import { setOraclePack, getOraclePack } from '../src/storage/oracleStore.ts';
const fixture = JSON.parse(
  readFileSync('outputs/morkborg-private-data.json', 'utf8'),
);
setRules(fixture.library);
setOraclePack(fixture.oracles);
const registry = buildOracleRegistry(getRules()!, getOraclePack());
const index = buildReferenceRegistry(registry, getRules()!);
const kinds: Record<string, number> = {},
  contexts: Record<string, number> = {};
for (const entry of index.entries) {
  kinds[entry.kind] = (kinds[entry.kind] ?? 0) + 1;
  for (const context of entry.contexts)
    contexts[context] = (contexts[context] ?? 0) + 1;
}
const after = {
  references: index.entries.length,
  kinds,
  tables: registry.tables.length,
  procedures: registry.procedures.length,
  creaturePresets: fixture.library.creatures.length,
  books: fixture.library.books.length,
  contexts,
  referenceIds: index.entries.map((e) => e.id).sort(),
  tableIds: registry.tables.map((e) => e.id).sort(),
};
const before = JSON.parse(
  readFileSync('outputs/ux-reassessment/registry-before.json', 'utf8'),
);
assert.deepEqual(after, before);
writeFileSync(
  'outputs/ux-reassessment/registry-after.json',
  JSON.stringify(after, null, 2),
);
const previousHashes = JSON.parse(
  readFileSync('outputs/ux-reassessment/data-before.json', 'utf8'),
);
const hashes = Object.fromEntries(
  Object.keys(previousHashes).map((path) => [
    path,
    createHash('sha256').update(readFileSync(path)).digest('hex'),
  ]),
);
assert.deepEqual(hashes, previousHashes);
writeFileSync(
  'outputs/ux-reassessment/data-after.json',
  JSON.stringify(hashes, null, 2),
);
console.log(
  JSON.stringify({
    references: after.references,
    tables: after.tables,
    sourceProcedures: after.procedures,
    creaturePresets: after.creaturePresets,
    books: after.books,
    idsIdentical: true,
    sourceHashesIdentical: true,
  }),
);
