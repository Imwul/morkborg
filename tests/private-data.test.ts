import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import {
  importPrivateData,
  parsePrivateData,
  exportPrivateData,
} from '../src/storage/privateDataImport.ts';
import { getRules, loadRules } from '../src/storage/rulesStore.ts';
import { getOraclePack, loadOraclePack } from '../src/storage/oracleStore.ts';
import { getFateChart, loadFateChart } from '../src/storage/fateChartStore.ts';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
const available = ['library', 'oracles', 'mythic-fate'].every((name) =>
  existsSync(`public/rules/${name}.json`),
);
const data = available
  ? Object.fromEntries(
      [
        ['library', 'library'],
        ['oracles', 'oracles'],
        ['fateChart', 'mythic-fate'],
      ].map(([key, file]) => [
        key,
        JSON.parse(readFileSync(`public/rules/${file}.json`, 'utf8')),
      ]),
    )
  : {};
const bundle = { kind: 'morkborg-private-data', schemaVersion: 1, ...data };

test(
  'Oracle-only import works before the core library exists',
  { skip: !available },
  async () => {
    assert.equal(getRules(), null);
    const originalFetch = globalThis.fetch;
    let finish!: (response: Response) => void;
    globalThis.fetch = () =>
      new Promise((resolve) => {
        finish = resolve;
      });
    const loading = loadOraclePack();
    let writes = 0;
    const result = await importPrivateData([data.oracles], async (saved) => {
      writes++;
      assert.deepEqual(Object.keys(saved), ['oracles']);
    });
    assert.equal(writes, 1);
    assert.equal(result.oracles!.tables.length, 300);
    const imported = getOraclePack();
    finish(new Response('', { status: 404 }));
    await loading;
    globalThis.fetch = originalFetch;
    assert.equal(getOraclePack(), imported);
    assert.equal(getRules(), null);
  },
);

test(
  'late 404 responses cannot erase an imported private bundle',
  { skip: !available },
  async () => {
    const original = globalThis.fetch;
    const pending: Array<(response: Response) => void> = [];
    globalThis.fetch = () => new Promise((resolve) => pending.push(resolve));
    try {
      const requests = [loadRules(), loadFateChart(), loadOraclePack()];
      assert.equal(pending.length, 2);
      let writes = 0;
      await importPrivateData([bundle], async (value) => {
        writes++;
        assert.equal(Object.keys(value).length, 3);
      });
      const rules = getRules(),
        chart = getFateChart(),
        oracles = getOraclePack();
      pending.forEach((resolve) => resolve(new Response('', { status: 404 })));
      await Promise.all(requests);
      assert.equal(writes, 1);
      assert.equal(getRules(), rules);
      assert.equal(getFateChart(), chart);
      assert.equal(getOraclePack(), oracles);
      assert.equal(
        buildOracleRegistry(getRules(), getOraclePack()).tables.length,
        493,
      );
    } finally {
      globalThis.fetch = original;
    }
  },
);

test(
  'malformed, duplicate and campaign JSON never reach persistence',
  { skip: !available },
  async () => {
    let writes = 0;
    const persist = async () => {
      writes++;
    };
    await assert.rejects(
      importPrivateData(
        [data.oracles, { schemaVersion: 4, campaigns: [] }],
        persist,
      ),
    );
    await assert.rejects(
      importPrivateData([data.oracles, data.oracles], persist),
      /같은 종류/,
    );
    const broken = structuredClone(bundle) as typeof bundle & {
      fateChart: { rows: unknown[] };
    };
    broken.fateChart.rows.pop();
    await assert.rejects(importPrivateData([broken], persist));
    assert.throws(
      () =>
        parsePrivateData({ kind: 'morkborg-private-data', schemaVersion: 1 }),
      /비어/,
    );
    assert.equal(writes, 0);
  },
);

test(
  'storage failure preserves all active packs',
  { skip: !available },
  async () => {
    const before = [getRules(), getOraclePack(), getFateChart()];
    await assert.rejects(
      importPrivateData([bundle], async () => {
        throw new Error('QuotaExceededError');
      }),
      /Quota/,
    );
    assert.equal(getRules(), before[0]);
    assert.equal(getOraclePack(), before[1]);
    assert.equal(getFateChart(), before[2]);
  },
);

test(
  'private backup includes all three packs and round-trips through validation',
  { skip: !available },
  async () => {
    const backup = await exportPrivateData();
    const parsed = parsePrivateData(JSON.parse(JSON.stringify(backup)));
    assert.deepEqual(parsed.library, getRules());
    assert.deepEqual(parsed.oracles, getOraclePack());
    assert.deepEqual(parsed.fateChart, getFateChart());
  },
);
