import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import {
  adaptRuleTable,
  buildOracleRegistry,
} from '../src/data/oracles/index.ts';
import { correctOracleSourcePages } from '../src/data/oracles/sourceCorrections.ts';
import { buildReferenceRegistry } from '../src/domain/references.ts';
import { parsePrivateData } from '../src/storage/privateDataImport.ts';
import {
  isScenarioReference,
  isScenarioTable,
  SCENARIO_TABLE_IDS,
} from '../src/data/scenarioExclusions.ts';
const dir = 'outputs/visual-identity/';
const fixture = JSON.parse(
  readFileSync('outputs/morkborg-private-data.json', 'utf8'),
);
const parsed = parsePrivateData(fixture);
const registry = buildOracleRegistry(parsed.library!, parsed.oracles!);
const index = buildReferenceRegistry(registry, parsed.library!);
const before = JSON.parse(
  readFileSync(dir + 'baseline-registry-after.json', 'utf8'),
);
const kinds: Record<string, number> = {};
for (const entry of index.entries)
  kinds[entry.kind] = (kinds[entry.kind] ?? 0) + 1;
const after = {
  references: index.entries.length,
  kinds,
  tables: registry.tables.length,
  procedures: registry.procedures.length,
  creaturePresets: parsed.library!.creatures.length,
  books: parsed.library!.books.length,
  referenceIds: index.entries.map((e) => e.id).sort(),
  tableIds: registry.tables.map((e) => e.id).sort(),
};
assert.deepEqual(
  after.referenceIds,
  before.referenceIds.filter((id: string) => !isScenarioReference(id)),
);
assert.deepEqual(
  after.tableIds,
  before.tableIds.filter((id: string) => !isScenarioTable(id)),
);
assert.equal(before.references - after.references, 29);
assert.equal(before.tables - after.tables, 28);
assert.equal(after.creaturePresets, before.creaturePresets);
assert.equal(after.books, before.books);
const previousHashes = JSON.parse(
  readFileSync(dir + 'baseline-data-after.json', 'utf8'),
);
const hashes = Object.fromEntries(
  Object.keys(previousHashes).map((path) => [
    path,
    createHash('sha256').update(readFileSync(path)).digest('hex'),
  ]),
);
assert.deepEqual(hashes, previousHashes);
writeFileSync(dir + 'registry-after.json', JSON.stringify(after, null, 2));
writeFileSync(
  dir + 'removed-scenario-tables.json',
  JSON.stringify(
    SCENARIO_TABLE_IDS.map((id) => {
      const t = fixture.oracles.tables.find((t: { id: string }) => t.id === id);
      const r = fixture.library.tables[id];
      const source = correctOracleSourcePages(
        t ?? { ...adaptRuleTable(id, r), ...fixture.oracles.overrides[id], id },
      );
      return {
        id,
        title: t?.title ?? fixture.oracles.overrides[id]?.title ?? r?.title,
        book: t?.sourceBookId ?? r?.book,
        pages: source.sourcePage,
        printedPage: source.printedPage,
      };
    }),
    null,
    2,
  ),
);
console.log(
  JSON.stringify(
    {
      before: {
        references: before.references,
        tables: before.tables,
        procedures: before.procedures,
      },
      after: { ...after, referenceIds: undefined, tableIds: undefined },
      removedTables: 28,
      removedProcedures: 1,
      otherIdsUnchanged: true,
      archiveHashesUnchanged: true,
    },
    null,
    2,
  ),
);
