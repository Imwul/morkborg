import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { buildReferenceRegistry } from '../src/domain/references.ts';
import { executeReference } from '../src/domain/referenceExecution.ts';
import {
  emptyDungeonPreparationReading,
  selectDungeonRoomSource,
  rerollDungeonPreparationField,
  rollDungeonPreparationReading,
  editDungeonPreparationField,
} from '../src/domain/dungeonReferencePreparation.ts';
import {
  copyReferenceReading,
  type ReferenceReading,
} from '../src/domain/referenceReading.ts';
import {
  emptyReferenceSession,
  retainReferenceReading,
} from '../src/domain/referenceSession.ts';
import { DungeonPreparation } from '../src/components/DungeonPreparation.tsx';
import {
  loadPrivateDngngen,
  isPrivateDngngenHost,
  type PrivateDngngenState,
} from '../src/storage/privateDngngenClient.ts';
import {
  createSyntheticDngngenPack,
  sealSyntheticDngngenPack,
} from './fixtures/dngngenSynthetic.ts';

const fixture = JSON.parse(
  readFileSync('outputs/morkborg-private-data.json', 'utf8'),
);
const registry = buildOracleRegistry(fixture.library, fixture.oracles);
const references = buildReferenceRegistry(registry, fixture.library);
const pack = createSyntheticDngngenPack();
const native = () =>
  selectDungeonRoomSource(emptyDungeonPreparationReading(), 'DNGNGEN', pack);
const block = (reading: ReferenceReading, title: string) =>
  reading.blocks.find((value) => value.title === title)!;
const render = (
  reading?: ReferenceReading,
  privateDngngen?: PrivateDngngenState,
) =>
  renderToStaticMarkup(
    createElement(DungeonPreparation, {
      reading,
      registry,
      privateDngngen,
      onChange() {
        assert.fail('render changed reading');
      },
      onOpen() {
        assert.fail('render navigated');
      },
    }),
  );
function sequence(values: number[]) {
  let calls = 0;
  return {
    next: () => {
      assert.ok(calls < values.length, 'extra RNG draw');
      return values[calls++];
    },
    calls: () => calls,
  };
}
const request =
  (value: unknown): typeof fetch =>
  async () =>
    new Response(JSON.stringify(value), {
      headers: { 'Content-Type': 'application/json' },
    });

test('public page never requests private data and only the private host marker enables loading', async () => {
  assert.deepEqual(
    await loadPrivateDngngen(false, async () => {
      assert.fail('public endpoint request');
    }),
    { status: 'public' },
  );
  assert.equal(isPrivateDngngenHost({ querySelector: () => null }), false);
  assert.equal(
    isPrivateDngngenHost({
      querySelector: () =>
        ({ getAttribute: () => 'enabled' }) as unknown as Element,
    }),
    true,
  );
});
test('client accepts valid private response with same-origin/no-store and fails cleanly missing or invalid', async () => {
  const state = await loadPrivateDngngen(true, async (url, init) => {
    assert.equal(url, '/__private/dngngen');
    assert.equal(init?.cache, 'no-store');
    assert.equal(init?.credentials, 'same-origin');
    return request({ status: 'ready', pack })(url, init);
  });
  assert.equal(state.status, 'ready');
  assert.deepEqual(
    await loadPrivateDngngen(
      true,
      request({ status: 'unavailable', reason: 'missing' }),
    ),
    { status: 'unavailable', reason: 'missing' },
  );
  assert.deepEqual(
    await loadPrivateDngngen(true, request({ status: 'ready', pack: {} })),
    { status: 'unavailable', reason: 'invalid' },
  );
  assert.deepEqual(
    await loadPrivateDngngen(true, async () => {
      throw new Error('offline');
    }),
    { status: 'unavailable', reason: 'connection' },
  );
});
test('client replacement reads a new snapshot rather than caching the old pack', async () => {
  const next = sealSyntheticDngngenPack({
    ...pack,
    snapshot: { ...pack.snapshot, id: 'synthetic-replaced' },
  });
  const first = await loadPrivateDngngen(
    true,
    request({ status: 'ready', pack }),
  );
  const second = await loadPrivateDngngen(
    true,
    request({ status: 'ready', pack: next }),
  );
  assert.equal(first.status, 'ready');
  assert.equal(second.status, 'ready');
  if (first.status === 'ready' && second.status === 'ready')
    assert.notEqual(
      first.pack.integrity.payloadSha256,
      second.pack.integrity.payloadSha256,
    );
});
test('public/missing/invalid pack renders all Core fields and external link without native controls', () => {
  for (const state of [
    undefined,
    { status: 'public' },
    { status: 'unavailable', reason: 'missing' },
    { status: 'unavailable', reason: 'invalid' },
  ] as (PrivateDngngenState | undefined)[]) {
    const html = render(undefined, state);
    assert.equal((html.match(/data-preparation-field=/g) ?? []).length, 12);
    assert.match(html, /DNGNGEN 원본/);
    assert.doesNotMatch(html, /<select|SYNTHETIC DEMO/);
  }
});
test('valid synthetic pack keeps Core default and explicitly labels the invented demonstration', () => {
  const html = render(undefined, { status: 'ready', pack });
  assert.match(html, /value="CORE" selected/);
  assert.match(html, /SYNTHETIC DEMO/);
  assert.match(html, /DNGNGEN 원문 아님/);
  assert.doesNotMatch(html, /A-1 TEST DESCRIPTION/);
});
test('pack load, validation, render, selector, restore and Copy consume no dice RNG', async (t) => {
  t.mock.method(globalThis.crypto, 'getRandomValues', () => {
    assert.fail('unexpected dice RNG');
  });
  const ready = await loadPrivateDngngen(
    true,
    request({ status: 'ready', pack }),
  );
  const current = native();
  const core = selectDungeonRoomSource(current, 'CORE');
  assert.strictEqual(core.blocks, current.blocks);
  render(current, ready);
  copyReferenceReading(current);
  const session = retainReferenceReading(
    emptyReferenceSession(),
    'procedure:sd.dungeon-preparation',
    current,
    false,
  );
  assert.strictEqual(
    session.readings['procedure:sd.dungeon-preparation'],
    current,
  );
});
test('one explicit native room uses two selections plus entry values in exact order', () => {
  for (const [values, text] of [
    [[0, 0], 'A-1 TEST DESCRIPTION'],
    [[0.2, 0.99, 0], 'A-2 COUNT 4 UNITS'],
    [[0.4, 0, 0.99, 0], 'A-3 SUM 17'],
  ] as [number[], string][]) {
    const rng = sequence(values);
    const result = rerollDungeonPreparationField(
      native(),
      'special1',
      registry,
      rng.next,
      pack,
    );
    assert.equal(rng.calls(), values.length);
    assert.match(block(result, 'Special Room 1').text, new RegExp(text));
    assert.equal(result.preparation?.rooms?.[1]?.source, 'DNGNGEN');
    assert.equal(result.oracle, undefined);
    assert.equal(block(result, 'Special Room 1').translation?.ko, undefined);
  }
});
test('selector preserves existing result provenance and Copy serializes a mixed current reading without RNG', () => {
  let current = rerollDungeonPreparationField(
    emptyDungeonPreparationReading(),
    'special1',
    registry,
    () => 0,
  );
  const coreBlock = block(current, 'Special Room 1');
  const beforeCopy = copyReferenceReading(current);
  current = selectDungeonRoomSource(current, 'DNGNGEN', pack);
  assert.strictEqual(block(current, 'Special Room 1'), coreBlock);
  assert.equal(copyReferenceReading(current), beforeCopy);
  current = rerollDungeonPreparationField(
    current,
    'special2',
    registry,
    () => 0,
    pack,
  );
  const nativeResult = current.preparation!.rooms![2];
  current = selectDungeonRoomSource(current, 'CORE');
  assert.strictEqual(current.preparation!.rooms![2], nativeResult);
  assert.match(copyReferenceReading(current), /Special Room 1 · CORE/);
  assert.match(
    copyReferenceReading(current),
    /Special Room 2 · DNGNGEN \(synthetic demo\)/,
  );
  assert.match(copyReferenceReading(current), /A-1 TEST DESCRIPTION/);
  current = rerollDungeonPreparationField(
    current,
    'special2',
    registry,
    () => 0,
    pack,
  );
  assert.equal(current.preparation!.rooms![2], undefined);
  assert.doesNotMatch(
    copyReferenceReading(current),
    /DNGNGEN|TEST DESCRIPTION/,
  );
});
test('individual room four reroll preserves every other generated/manual field and permits its own IDs', () => {
  let current = rollDungeonPreparationReading(
    registry,
    () => 0,
    native(),
    pack,
  );
  current = editDungeonPreparationField(current, 'reason', 'USER REASON');
  current = editDungeonPreparationField(current, 'guard', 'USER GUARDS');
  // Use a counted stable source rather than assume constant draw count for this slot.
  let calls = 0;
  const changed = rerollDungeonPreparationField(
    current,
    'special4',
    registry,
    () => {
      calls++;
      return 0;
    },
    pack,
  );
  assert.equal(calls, 4);
  assert.deepEqual(
    changed.preparation!.rooms![4]!.components.map((value) => value.entryId),
    current.preparation!.rooms![4]!.components.map((value) => value.entryId),
  );
  for (const original of current.blocks.filter(
    (value) => value.title !== 'Special Room 4',
  ))
    assert.strictEqual(block(changed, original.title), original);
  for (const slot of [1, 2, 3] as const)
    assert.strictEqual(
      changed.preparation!.rooms![slot],
      current.preparation!.rooms![slot],
    );
});
test('full reroll uses fresh ordered room accumulator and preserves source/manual input', () => {
  let current = native();
  current = editDungeonPreparationField(current, 'reason', 'USER REASON');
  current = editDungeonPreparationField(current, 'guard', 'USER GUARDS');
  const first = rollDungeonPreparationReading(registry, () => 0, current, pack);
  const second = rollDungeonPreparationReading(registry, () => 0, first, pack);
  assert.deepEqual(second.preparation, first.preparation);
  assert.equal(block(second, 'What brings you here?').text, 'USER REASON');
  assert.equal(block(second, 'Guarded by').text, 'USER GUARDS');
  const ids = Object.values(second.preparation!.rooms!).flatMap((room) =>
    room!.components.map((value) => value.entryId),
  );
  assert.equal(new Set(ids).size, 8);
});
test('unavailable native pack fails before any full or individual generation and Core remains usable', () => {
  const noRng = () => {
    assert.fail('RNG before missing pack failure');
  };
  assert.throws(
    () => rollDungeonPreparationReading(registry, noRng, native()),
    /pack/,
  );
  assert.throws(
    () => rerollDungeonPreparationField(native(), 'special1', registry, noRng),
    /pack/,
  );
  assert.throws(
    () => selectDungeonRoomSource(emptyDungeonPreparationReading(), 'DNGNGEN'),
    /pack/,
  );
  assert.ok(
    rollDungeonPreparationReading(
      registry,
      () => 0,
      selectDungeonRoomSource(native(), 'CORE'),
    ).oracle,
  );
});
test('reference execution full roll honors current preparation source without changing registry', () => {
  const entry = references.byId['procedure:sd.dungeon-preparation'];
  const before = JSON.stringify(registry);
  const result = executeReference(entry, {
    registry,
    rules: fixture.library,
    rng: () => 0,
    currentReading: native(),
    dngngenPack: pack,
  });
  assert.equal(Object.keys(result!.preparation!.rooms!).length, 4);
  assert.equal(JSON.stringify(registry), before);
});
test('native reading uses existing transient navigation identity and reload clears it', () => {
  const reading = rerollDungeonPreparationField(
    native(),
    'special1',
    registry,
    () => 0,
    pack,
  );
  let session = retainReferenceReading(
    emptyReferenceSession(),
    'procedure:sd.dungeon-preparation',
    reading,
    false,
  );
  session = retainReferenceReading(
    session,
    'oracle:core.rooms',
    { title: 'Other', blocks: [], sourceRefs: [] },
    false,
  );
  assert.strictEqual(
    session.readings['procedure:sd.dungeon-preparation'],
    reading,
  );
  assert.match(
    copyReferenceReading(session.readings['procedure:sd.dungeon-preparation']),
    /A-1 TEST DESCRIPTION/,
  );
  assert.equal(
    emptyReferenceSession().readings['procedure:sd.dungeon-preparation'],
    undefined,
  );
});

test('replacement pack does not relabel old rooms or reuse their exclusion identities', () => {
  const previous = rollDungeonPreparationReading(
    registry,
    () => 0,
    native(),
    pack,
  );
  const replacement = sealSyntheticDngngenPack({
    ...pack,
    snapshot: { ...pack.snapshot, id: 'synthetic-replacement' },
  });
  const selected = selectDungeonRoomSource(previous, 'DNGNGEN', replacement);
  assert.equal(copyReferenceReading(selected), copyReferenceReading(previous));
  const next = rerollDungeonPreparationField(
    selected,
    'special2',
    registry,
    () => 0,
    replacement,
  );
  assert.deepEqual(
    next.preparation!.rooms![2]!.components.map((part) => part.entryId),
    ['SYNTHETIC-A-1', 'SYNTHETIC-C-1'],
  );
  assert.equal(
    next.preparation!.rooms![2]!.packIdentity,
    replacement.integrity.payloadSha256,
  );
  for (const slot of [1, 3, 4] as const)
    assert.strictEqual(
      next.preparation!.rooms![slot],
      previous.preparation!.rooms![slot],
    );
});
test('native room render has no Core dice/table trace and never auto-translates source text', () => {
  const current = rerollDungeonPreparationField(
    native(),
    'special1',
    registry,
    () => 0,
    pack,
  );
  const html = render(current, { status: 'ready', pack });
  const room = html
    .split('data-preparation-field="special1"')[1]
    .split('data-preparation-field="special2"')[0];
  assert.match(room, /DIGITAL/);
  assert.match(room, /lang="en"/);
  assert.match(room, /A-1 TEST DESCRIPTION/);
  assert.doesNotMatch(room, /표 보기|d4|d6|<input|<summary/);
  const disconnected = render(current, {
    status: 'unavailable',
    reason: 'invalid',
  });
  assert.match(disconnected, /A-1 TEST DESCRIPTION/);
  assert.match(disconnected, /disabled/);
});
