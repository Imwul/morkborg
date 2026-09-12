import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  parsePrivateData,
  importPrivateData,
} from '../src/storage/privateDataImport.ts';
import { getRules } from '../src/storage/rulesStore.ts';
import { getOraclePack } from '../src/storage/oracleStore.ts';
import { mergeOracleTranslations } from '../src/storage/privateUpdates.ts';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { buildReferenceRegistry } from '../src/domain/references.ts';
import { ReferenceTable } from '../src/components/ReferenceTable.tsx';
import {
  rollOracle,
  selectOracleEntry,
} from '../src/generators/oracleRoller.ts';
import type { PrivateData } from '../src/storage/privateData.ts';

test('source fixture, import, repaired legacy pack, registry and rendering retain a separate 7:7 footer', async () => {
  const fixture = JSON.parse(
    readFileSync(
      process.env.MORKBORG_PRIVATE_AUDIT_FIXTURE ??
        'outputs/morkborg-private-data.json',
      'utf8',
    ),
  );
  const parsed = parsePrivateData(fixture);
  const source = parsed.oracles!.tables.find((t) => t.id === 'core.miseries')!;
  assert.equal(source.forcedFinal?.label, '7:7');
  assert.equal(source.forcedFinal.sourcePage, 20);
  const old = structuredClone(parsed.oracles!);
  delete old.tables.find((t) => t.id === source.id)!.forcedFinal;
  const repaired = mergeOracleTranslations(old, parsed.oracles!);
  let stored: PrivateData = {};
  await importPrivateData(
    [{ ...fixture, oracles: repaired }],
    async (value) => {
      stored = structuredClone(value);
    },
    false,
  );
  const imported = parsePrivateData({
    kind: 'morkborg-private-data',
    schemaVersion: 1,
    ...stored,
  });
  assert.deepEqual(
    imported.oracles!.tables.find((t) => t.id === source.id),
    source,
  );
  const registry = buildOracleRegistry(getRules(), getOraclePack());
  const index = buildReferenceRegistry(registry, getRules());
  const table = registry.tables.find((t) => t.id === source.id)!;
  assert.equal(registry.tables.filter((t) => t.id === source.id).length, 1);
  assert.equal(index.entries.length, 1000);
  assert.equal(registry.tables.length, 546);
  assert.deepEqual(index.byId['oracle:core.miseries'].action, {
    kind: 'oracle',
    oracleIds: ['core.miseries'],
  });
  const previousTable = buildOracleRegistry(parsed.library!, old).tables.find(
    (t) => t.id === source.id,
  )!;
  assert.deepEqual(table.entries, previousTable.entries);
  const html = renderToStaticMarkup(
    createElement(ReferenceTable, {
      table,
      currentEntryIds: [],
      onChoose: () => {},
    }),
  );
  assert.equal(
    (html.split('<tbody>')[1].split('</tbody>')[0].match(/<tr/g) ?? []).length,
    36,
  );
  const footer = html.split('<tfoot>')[1].split('</tfoot>')[0];
  assert.match(footer, /7:7/);
  assert.match(footer, /Core · PDF 20/);
  assert.match(footer, /일곱 번째 재앙/);
  assert.ok(footer.includes(source.forcedFinal.text.slice(0, 20)));
  assert.equal((footer.match(/<tr/g) ?? []).length, 1);
  const rolled = new Set<number>();
  for (let first = 1; first <= 6; first++)
    for (let second = 1; second <= 6; second++) {
      const values = [(first - 0.5) / 6, (second - 0.5) / 6];
      const result = rollOracle(table, registry, () => values.shift() ?? 0);
      const value = first * 10 + second;
      assert.equal(result.entryId, selectOracleEntry(table, value)!.id);
      rolled.add(value);
    }
  assert.equal(rolled.size, 36);
  assert.equal(rolled.has(77), false);
  assert.throws(() => selectOracleEntry(table, 77), /범위/);
});
