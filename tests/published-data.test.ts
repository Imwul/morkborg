import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPublishedDataClient,
  PUBLISHED_DATA_INTERVAL,
  type PublishedPacks,
} from '../src/storage/publishedDataClient.ts';
import type { PrivateData } from '../src/storage/privateData.ts';
import { mergePublishedPacks } from '../src/storage/publishedDataMerge.ts';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { FATE_ODDS } from '../src/domain/mythic.ts';

const fixture: PublishedPacks = {
  library: {
    schemaVersion: 1,
    books: [],
    creatures: [],
    outcasts: [],
    notes: {},
    tables: {
      fixture: {
        book: 'test',
        title: 'Fixture',
        pages: [1],
        dice: 'd6',
        entries: [{ text: 'Signal', weight: 6, meta: { ko: '신호' } }],
      },
    },
  },
  oracles: {
    schemaVersion: 1,
    books: [],
    procedures: [],
    overrides: {},
    entrySelectors: {},
    tables: [
      {
        id: 'signal',
        sourceBookId: 'test',
        sourcePage: 1,
        title: 'Signal',
        category: 'OTHER',
        dice: 'd6',
        tags: [],
        sourceVerified: true,
        entries: [
          {
            id: 'one',
            min: 1,
            max: 6,
            text: 'Signal',
            metadata: { ko: '신호' },
          },
        ],
      },
    ],
  },
  fateChart: {
    schemaVersion: 1,
    sourcePage: 20,
    printedPage: 19,
    sourceVerified: true,
    rows: FATE_ODDS.map((o) => ({
      odds: o.id,
      cells: Array.from({ length: 9 }, () => ({
        exceptionalYes: 10,
        yes: 50,
        exceptionalNo: 91,
      })),
    })),
  },
};
const bundle = (packs = fixture) => ({
  kind: 'morkborg-private-data',
  schemaVersion: 1,
  ...structuredClone(packs),
});
const payload = (revision = 10, packs = fixture) => ({
  schemaVersion: 1,
  revision,
  bundle: bundle(packs),
});
const connection = (revision = 10, enabled = true) => ({
  schemaVersion: 1,
  revision,
  enabled,
});

function harness(initial: PrivateData = {}) {
  const storage: Record<string, unknown> = structuredClone(initial);
  storage['morkborg-codex:v5'] =
    '{"campaigns":[{"notes":"keep my campaign exactly"}]}';
  const campaign = storage['morkborg-codex:v5'];
  let active: PublishedPacks = Object.fromEntries(
    Object.entries(initial).filter(([key]) =>
      ['library', 'oracles', 'fateChart'].includes(key),
    ),
  );
  let generation = 0,
    time = 1_000,
    writes = 0,
    activations = 0;
  const requests: string[] = [];
  let fetcher: (path: string) => Promise<unknown> = async () => payload();
  let validate = (_: PublishedPacks) => {};
  let afterPersist = () => {};
  const parse = (input: unknown): PublishedPacks => {
    assert.ok(
      input &&
        typeof input === 'object' &&
        'kind' in input &&
        input.kind === 'morkborg-private-data',
    );
    const data = input as Record<string, unknown>;
    assert.equal(data.schemaVersion, 1);
    const result: PublishedPacks = {};
    for (const key of ['library', 'oracles', 'fateChart'] as const)
      if (data[key] !== undefined) {
        assert.ok(
          data[key] &&
            typeof data[key] === 'object' &&
            !('damaged' in (data[key] as object)),
        );
        Object.assign(result, { [key]: structuredClone(data[key]) });
      }
    assert.ok(Object.keys(result).length);
    return result;
  };
  const client = createPublishedDataClient({
    read: async (key) => structuredClone(storage[key]),
    persist: async (data, expected) => {
      for (const [key, value] of Object.entries(expected))
        assert.deepEqual(
          storage[key],
          value,
          'concurrent data must not be overwritten',
        );
      for (const key of Object.keys(data))
        assert.ok(
          ['library', 'oracles', 'fateChart', 'serverConnection'].includes(key),
        );
      Object.assign(storage, structuredClone(data));
      writes++;
      afterPersist();
    },
    fetch: (path) => {
      requests.push(path);
      return fetcher(path);
    },
    active: () => active,
    parse,
    merge: mergePublishedPacks,
    validate: (packs) => validate(packs),
    activate: (packs) => {
      active = packs;
      activations++;
    },
    generation: () => generation,
    now: () => time,
  });
  return {
    client,
    storage,
    campaign,
    requests,
    get active() {
      return active;
    },
    get writes() {
      return writes;
    },
    get activations() {
      return activations;
    },
    fetch(fn: typeof fetcher) {
      fetcher = fn;
    },
    validate(fn: typeof validate) {
      validate = fn;
    },
    afterPersist(fn: typeof afterPersist) {
      afterPersist = fn;
    },
    advance() {
      time += PUBLISHED_DATA_INTERVAL;
    },
    clearActive() {
      active = {};
    },
    manualImport(packs: PublishedPacks) {
      generation++;
      active = packs;
      Object.assign(storage, structuredClone(packs));
    },
  };
}
async function pending(h: ReturnType<typeof harness>) {
  let finish!: (value: unknown) => void;
  let fail!: (reason: Error) => void;
  h.fetch(
    () =>
      new Promise((resolve, reject) => {
        finish = resolve;
        fail = reject;
      }),
  );
  const work = h.client.check(false, true);
  await new Promise<void>((resolve) => setImmediate(resolve));
  return { work, finish, fail };
}

test('fresh entry coalesces three loaders, caches all packs, and never touches campaign bytes', async () => {
  const h = harness();
  const requests = [
    h.client.check(false, true),
    h.client.check(false, true),
    h.client.check(),
  ];
  assert.equal(requests[0], requests[1]);
  await Promise.all(requests);
  assert.equal(h.requests.length, 1);
  assert.equal(h.requests[0], '/api/rulebook-data?revision=0');
  assert.equal(h.writes, 1);
  assert.deepEqual(h.active, fixture);
  assert.deepEqual(h.storage.serverConnection, connection());
  assert.equal(h.storage['morkborg-codex:v5'], h.campaign);
  assert.equal('updateConnection' in h.storage, false);
});
test('reload with cached current revision uses only metadata and keeps all cache intact', async () => {
  const h = harness({ ...fixture, serverConnection: connection() });
  h.fetch(async () => ({ schemaVersion: 1, revision: 10 }));
  await h.client.check();
  assert.equal(h.requests[0], '/api/rulebook-data?revision=10');
  assert.equal(h.writes, 0);
  assert.deepEqual(h.active, fixture);
  assert.match(h.client.getState().message, /최신/);
});
test('partial cache requests a complete bundle while preserving existing custom rule text', async () => {
  const partial = structuredClone(fixture.library!);
  partial.tables.fixture.entries[0].text = 'My edited signal';
  const h = harness({ library: partial, serverConnection: connection() });
  await h.client.check(false, true);
  assert.equal(h.requests[0], '/api/rulebook-data?revision=0');
  assert.equal(
    h.active.library!.tables.fixture.entries[0].text,
    'My edited signal',
  );
  assert.deepEqual(h.active.oracles, fixture.oracles);
  assert.deepEqual(h.active.fateChart, fixture.fateChart);
});
test('new revision updates translations but keeps weights, edited entries, and original Fate Chart', async () => {
  const saved = structuredClone(fixture);
  saved.library!.tables.fixture.entries[0].weight = 8;
  saved.library!.tables.fixture.entries[0].meta.note = 'manual note';
  saved.oracles!.tables[0].entries[0].text = 'Edited English';
  saved.fateChart!.rows[0].cells[0].yes = 55;
  const next = structuredClone(fixture);
  next.library!.tables.fixture.entries[0].meta.ko = '교정한 신호';
  const h = harness({ ...saved, serverConnection: connection() });
  h.fetch(async () => payload(11, next));
  await h.client.check();
  assert.equal(
    h.active.library!.tables.fixture.entries[0].meta.ko,
    '교정한 신호',
  );
  assert.equal(h.active.library!.tables.fixture.entries[0].weight, 8);
  assert.equal(
    h.active.library!.tables.fixture.entries[0].meta.note,
    'manual note',
  );
  assert.equal(h.active.oracles!.tables[0].entries[0].text, 'Edited English');
  assert.equal(h.active.fateChart!.rows[0].cells[0].yes, 55);
  assert.deepEqual(h.storage.serverConnection, connection(11));
  assert.equal(h.storage['morkborg-codex:v5'], h.campaign);
});
test('manual import finishing during a fetch invalidates the old response', async () => {
  const h = harness();
  const wait = await pending(h);
  const manual = structuredClone(fixture);
  manual.library!.notes.manual = 'keep';
  h.manualImport(manual);
  wait.finish(payload());
  await wait.work;
  assert.deepEqual(h.active, manual);
  assert.equal(h.writes, 0);
  assert.equal(h.storage.serverConnection, undefined);
});
test('late server failure after manual import cannot replace data or show a stale failure', async () => {
  const h = harness();
  const wait = await pending(h);
  h.manualImport(structuredClone(fixture));
  wait.fail(new Error('HTTP 503'));
  await wait.work;
  assert.deepEqual(h.active, fixture);
  assert.equal(h.client.getState().error, '');
  assert.equal(h.activations, 0);
});
test('a failed manual import does not invalidate a successfully downloaded bundle', async () => {
  const h = harness();
  const wait = await pending(h);
  // Rejected validation/import never increments the successful-import generation.
  wait.finish(payload());
  await wait.work;
  assert.deepEqual(h.active, fixture);
  assert.equal(h.activations, 1);
});
test('cross-tab changes cause CAS rejection without advancing the server revision', async () => {
  const h = harness({ ...fixture, serverConnection: connection(9) });
  const wait = await pending(h);
  const other = structuredClone(fixture.oracles!);
  other.tables[0].entries[0].text = 'Other tab';
  h.storage.oracles = other;
  wait.finish(payload());
  await wait.work;
  assert.equal(h.writes, 0);
  assert.equal(h.activations, 0);
  assert.deepEqual(h.storage.oracles, other);
  assert.deepEqual(h.storage.serverConnection, connection(9));
  assert.match(h.client.getState().error, /저장된 자료/);
});
test('offline errors preserve cached packs and force retry restores server checks', async () => {
  const h = harness({ ...fixture, serverConnection: connection(9) });
  h.fetch(async () => {
    throw new Error('Offline');
  });
  await h.client.check();
  assert.deepEqual(h.active, fixture);
  assert.equal(h.writes, 0);
  h.fetch(async () => payload());
  await h.client.check(true);
  assert.deepEqual(h.storage.serverConnection, connection());
  assert.equal(h.client.getState().error, '');
});
test('malformed, incomplete and invalid combined data never reaches persistence', async () => {
  for (const bad of [
    { ...payload(), schemaVersion: 2 },
    payload(10, { oracles: fixture.oracles }),
    { schemaVersion: 1, revision: 10 },
  ]) {
    const h = harness();
    h.fetch(async () => bad);
    await h.client.check();
    assert.equal(h.writes, 0);
    assert.equal(h.activations, 0);
    assert.ok(h.client.getState().error);
  }
  const h = harness();
  h.validate(() => {
    throw new Error('Overlapping table range');
  });
  await h.client.check();
  assert.equal(h.writes, 0);
});
test('paused updates skip downloads; manual check works without turning automatic checks on', async () => {
  const h = harness({ ...fixture, serverConnection: connection(9, false) });
  await h.client.check();
  assert.equal(h.requests.length, 0);
  await h.client.check(true);
  assert.equal(h.requests.length, 1);
  assert.deepEqual(h.storage.serverConnection, connection(10, false));
});
test('paused updates can fill missing packs without overwriting existing translations', async () => {
  const saved = structuredClone(fixture.library!);
  saved.tables.fixture.entries[0].meta.ko = '내 번역';
  const h = harness({ library: saved, serverConnection: connection(9, false) });
  await h.client.check(false, true);
  assert.equal(h.active.library!.tables.fixture.entries[0].meta.ko, '내 번역');
  assert.ok(h.active.oracles && h.active.fateChart);
  assert.deepEqual(h.storage.serverConnection, connection(9, false));
  await h.client.setEnabled(true);
  assert.equal(h.active.library!.tables.fixture.entries[0].meta.ko, '신호');
  assert.deepEqual(h.storage.serverConnection, connection(10, true));
});
test('automatic interval is throttled, while explicit checks are immediate', async () => {
  const h = harness({ ...fixture, serverConnection: connection() });
  h.fetch(async () => ({ schemaVersion: 1, revision: 10 }));
  await h.client.check();
  await h.client.check();
  assert.equal(h.requests.length, 1);
  h.advance();
  await h.client.check();
  assert.equal(h.requests.length, 2);
  await h.client.check(true);
  assert.equal(h.requests.length, 3);
});
test('a successful import between commit and activation keeps the imported active stores', async () => {
  const h = harness();
  const manual = structuredClone(fixture);
  manual.library!.notes.manual = true;
  h.afterPersist(() => h.manualImport(manual));
  await h.client.check();
  assert.deepEqual(h.active, manual);
  assert.equal(h.activations, 0);
});

test('partial Oracle cache gains source selectors and overrides needed by the NPC name table', async () => {
  const incoming = structuredClone(fixture);
  incoming.library!.tables['core.names'] = {
    book: 'core',
    title: 'Names',
    pages: [2],
    dice: ['d6', 'd8'],
    entries: Array.from({ length: 48 }, (_, i) => ({
      text: `Fixture name ${i + 1}`,
      weight: 1,
      meta: {},
    })),
  };
  incoming.oracles!.overrides = {
    'core.names': { rollable: true, dice: 'd6 × d8' },
    signal: { title: 'Incoming title' },
  };
  incoming.oracles!.entrySelectors = {
    'core.names': Array.from({ length: 48 }, (_, i) => ({
      min: Math.floor(i / 8) * 10 + 11 + (i % 8),
      max: Math.floor(i / 8) * 10 + 11 + (i % 8),
    })),
    signal: [{ min: 1, max: 6 }],
  };
  const current = structuredClone(fixture.oracles!);
  current.overrides = { signal: { title: 'My title' } };
  current.entrySelectors = { signal: [{ min: 2, max: 6 }] };
  const h = harness({ oracles: current });
  h.fetch(async () => payload(10, incoming));
  await h.client.check(false, true);
  const names = buildOracleRegistry(
    h.active.library!,
    h.active.oracles!,
  ).tables.find((t) => t.id === 'core.names')!;
  assert.equal(names.rollable, true);
  assert.equal(names.entries[0].min, 11);
  assert.equal(names.entries[47].max, 68);
  assert.equal(h.active.oracles!.overrides!.signal.title, 'My title');
  assert.deepEqual(h.active.oracles!.entrySelectors!.signal, [
    { min: 2, max: 6 },
  ]);
  assert.equal(h.writes, 1);
});

test('production reload activates a complete validated cache even when the endpoint is offline', async () => {
  const h = harness({ ...fixture, serverConnection: connection() });
  h.clearActive();
  h.fetch(async () => {
    throw new Error('offline');
  });
  await h.client.check();
  assert.deepEqual(h.active, fixture);
  assert.equal(h.activations, 1);
  assert.equal(h.writes, 0);
  assert.match(h.client.getState().error, /저장된 자료/);
});
test('a corrupted cached pack requests the full bundle even at the accepted revision', async () => {
  const h = harness({
    ...fixture,
    library: { damaged: true },
    serverConnection: connection(),
  });
  await h.client.check(false, true);
  assert.equal(h.requests[0], '/api/rulebook-data?revision=0');
  assert.deepEqual(h.active, fixture);
  assert.equal(h.writes, 1);
});
test('incompatible cached packs never activate before a complete replacement passes validation', async () => {
  const invalid = structuredClone(fixture);
  invalid.oracles!.tables[0].tags = ['invalid-cross-reference'];
  const h = harness({ ...invalid, serverConnection: connection() });
  h.clearActive();
  h.validate((packs) => {
    if (packs.oracles!.tables[0].tags.includes('invalid-cross-reference'))
      throw new Error('invalid registry');
  });
  await h.client.check();
  assert.equal(h.requests[0], '/api/rulebook-data?revision=0');
  assert.deepEqual(h.active, fixture);
  assert.equal(h.activations, 1);
});
test('corrupt-cache metadata and older-server responses cannot claim latest or advance revision', async () => {
  const corrupt = harness({
    ...fixture,
    library: { damaged: true },
    serverConnection: connection(),
  });
  corrupt.fetch(async () => ({ schemaVersion: 1, revision: 10 }));
  await corrupt.client.check();
  assert.equal(corrupt.writes, 0);
  assert.match(corrupt.client.getState().error, /손상/);
  const stale = harness({ ...fixture, serverConnection: connection(11) });
  await stale.client.check();
  assert.equal(stale.writes, 0);
  assert.match(stale.client.getState().error, /이전/);
  assert.equal(stale.client.getState().message, '');
});
test('first-load endpoint failure offers recovery without claiming a usable saved pack', async () => {
  const h = harness();
  h.fetch(async () => {
    throw new Error('503');
  });
  await h.client.check();
  assert.equal(h.writes, 0);
  assert.equal(h.activations, 0);
  assert.match(h.client.getState().error, /개인 자료 가져오기/);
  assert(!h.client.getState().error.includes('그대로 사용할'));
});
test('source updates enrich existing creatures and Oracle follow-ups while preserving manual data', () => {
  const current = structuredClone(fixture),
    incoming = structuredClone(fixture);
  current.library!.creatures.push({
    book: 'test',
    name: 'Beast',
    pdfPage: 1,
    hp: 99,
    notes: 'manual',
    referenceAliases: [{ name: 'Custom' }],
  });
  incoming.library!.creatures.push({
    book: 'test',
    name: 'Beast',
    pdfPage: 1,
    hp: 4,
    printedPage: 1,
    referenceAliases: [{ name: 'Audited', sourceVerified: true }],
  });
  incoming.library!.creatures.push({ id: 'new', name: 'New source', hp: 5 });
  incoming.oracles!.tables[0].entries[0].metadata!.followUpOracleIds = ['new'];
  current.oracles!.tables[0].entries[0].metadata!.note = 'keep';
  const merged = mergePublishedPacks(current, incoming);
  assert.equal(merged.library!.creatures.length, 2);
  assert.equal(merged.library!.creatures[0].hp, 99);
  assert.equal(merged.library!.creatures[0].notes, 'manual');
  assert.equal(merged.library!.creatures[0].printedPage, 1);
  assert.deepEqual(merged.library!.creatures[0].referenceAliases, [
    { name: 'Custom' },
    { name: 'Audited', sourceVerified: true },
  ]);
  assert.deepEqual(
    merged.oracles!.tables[0].entries[0].metadata!.followUpOracleIds,
    ['new'],
  );
  assert.equal(merged.oracles!.tables[0].entries[0].metadata!.note, 'keep');
  assert.deepEqual(mergePublishedPacks(merged, incoming), merged);
});
