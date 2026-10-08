import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import {
  dngngenPackPayload,
  parseDngngenPack,
  parseDngngenTranslations,
  type DngngenPack,
} from '../src/domain/dngngenPack.ts';
import {
  emptyDungeonPreparationReading,
  selectDungeonRoomSource,
  rerollDungeonPreparationField,
  rollDungeonPreparationReading,
  editDungeonPreparationField,
} from '../src/domain/dungeonReferencePreparation.ts';
import {
  copyReferenceReading,
  eligibleForReferenceReplay,
} from '../src/domain/referenceReading.ts';
import {
  rollDngngenRoom,
  rollDngngenFeature,
} from '../src/generators/dngngen.ts';
import { DungeonPreparation } from '../src/components/DungeonPreparation.tsx';
import { ReferenceReadingBlock } from '../src/components/InlineReferenceTools.tsx';
import { readPrivateDngngenTranslation } from '../server/privateDngngenTranslation.ts';
import { createPrivateDngngenServer } from '../server/privateDngngenServer.ts';
import { loadPrivateDngngen } from '../src/storage/privateDngngenClient.ts';
import { extractDngngenFeatures } from '../server/importDngngenSnapshot.ts';
import {
  createSyntheticDngngenPack,
  sealSyntheticDngngenPack,
} from './fixtures/dngngenSynthetic.ts';

const fixture = JSON.parse(
  readFileSync('outputs/morkborg-private-data.json', 'utf8'),
);
const registry = buildOracleRegistry(fixture.library, fixture.oracles);
function featurePack(): DngngenPack {
  const base = createSyntheticDngngenPack();
  const simple = (id: string) => ({ id, messageId: id, values: [] });
  return parseDngngenPack(
    sealSyntheticDngngenPack({
      ...base,
      features: {
        reason: [simple('TEST-REASON-1'), simple('TEST-REASON-2')],
        entrance: [simple('TEST-ENTRANCE-1'), simple('TEST-ENTRANCE-2')],
        guard: [
          simple('TEST-NONE'),
          simple('TEST-NONE'),
          {
            id: 'TEST-SQUAD',
            messageId: 'TEST-SQUAD',
            values: [{ name: 'count', recipe: { op: 'int', min: 3, max: 5 } }],
          },
        ],
      },
      messages: {
        ...base.messages,
        'TEST-REASON-1': [{ type: 'text', text: 'TEST REASON ONE' }],
        'TEST-REASON-2': [{ type: 'text', text: 'TEST REASON TWO' }],
        'TEST-ENTRANCE-1': [{ type: 'text', text: 'TEST ENTRANCE ONE' }],
        'TEST-ENTRANCE-2': [{ type: 'text', text: 'TEST ENTRANCE TWO' }],
        'TEST-NONE': [{ type: 'text', text: 'TEST NO GUARDS' }],
        'TEST-SQUAD': [
          { type: 'value', name: 'count' },
          { type: 'text', text: ' TEST GUARDS' },
        ],
      },
    }),
    { allowSynthetic: true },
  );
}
const english = featurePack();
const translations = parseDngngenTranslations(english, {
  'TEST-REASON-1': [{ type: 'text', text: '시험 이유 하나' }],
  'TEST-REASON-2': [{ type: 'text', text: '시험 이유 둘' }],
  'TEST-ENTRANCE-1': [{ type: 'text', text: '시험 입구 하나' }],
  'TEST-ENTRANCE-2': [{ type: 'text', text: '시험 입구 둘' }],
  'TEST-NONE': [{ type: 'text', text: '시험 경비 없음' }],
  'TEST-SQUAD': [
    { type: 'text', text: '시험 경비 ' },
    { type: 'value', name: 'count' },
  ],
  'SYNTHETIC-A-1': [{ type: 'text', text: '시험 방 가' }],
  'SYNTHETIC-B-1': [{ type: 'text', text: '시험 방 나' }],
  'SYNTHETIC-A-2': [
    { type: 'text', text: '시험 수량 ' },
    { type: 'value', name: 'count' },
    {
      type: 'select',
      name: 'count',
      cases: { '1': [{ type: 'text', text: ' 단수' }] },
      other: [{ type: 'text', text: ' 복수' }],
    },
  ],
});
const pack = parseDngngenPack(
  { ...english, translations },
  { allowSynthetic: true },
);
const selected = () =>
  selectDungeonRoomSource(emptyDungeonPreparationReading(), 'DNGNGEN', pack);

test('helpers preserve the English checksum, branch keys and all placeholder occurrences', () => {
  assert.equal(dngngenPackPayload(pack), dngngenPackPayload(english));
  assert.throws(
    () =>
      parseDngngenTranslations(english, {
        'TEST-SQUAD': [{ type: 'text', text: '누락' }],
      }),
    /translation-variables/,
  );
  assert.throws(
    () =>
      parseDngngenTranslations(english, {
        'TEST-SQUAD': [{ type: 'value', name: 'other' }],
      }),
    /translation-variables/,
  );
  assert.throws(
    () => parseDngngenTranslations(english, { UNKNOWN: [] }),
    /translation-message/,
  );
  const changed = structuredClone(translations['SYNTHETIC-A-2']);
  const branch = changed.find((part) => part.type === 'select')!;
  assert.throws(
    () =>
      parseDngngenTranslations(english, {
        'SYNTHETIC-A-2': changed.map((part) =>
          part === branch ? { ...branch, cases: {} } : part,
        ),
      }),
    /translation-variables/,
  );
});

test('room translation renders the same sampled numbers with no extra RNG or source changes', () => {
  const run = (source: DngngenPack) => {
    let calls = 0;
    const sequence = [0.2, 0.99, 0];
    const result = rollDngngenRoom(source, 1, [], () => sequence[calls++]);
    return { calls, result };
  };
  const before = run(english),
    after = run(pack);
  assert.equal(after.calls, before.calls);
  assert.equal(after.result.text, before.result.text);
  assert.equal(after.result.packIdentity, before.result.packIdentity);
  assert.deepEqual(
    after.result.components.map((part) => part.values),
    before.result.components.map((part) => part.values),
  );
  assert.equal(after.result.components[0].ko, '시험 수량 4 복수');
  assert.equal(after.result.components[1].ko, '시험 방 나');
});

test('feature selections retain repeated guard weights, exclude previous IDs and share translated numbers', () => {
  assert.equal(
    rollDngngenFeature(pack, 'guard', undefined, () => 0.5).entryId,
    'TEST-NONE',
  );
  const previous = rollDngngenFeature(pack, 'guard', undefined, () => 0);
  let calls = 0;
  const sequence = [0, 0.999];
  const next = rollDngngenFeature(
    pack,
    'guard',
    previous,
    () => sequence[calls++],
  );
  assert.equal(calls, 2);
  assert.equal(next.entryId, 'TEST-SQUAD');
  assert.equal(next.text, '5 TEST GUARDS');
  assert.equal(next.ko, '시험 경비 5');
  assert.equal(
    rollDngngenFeature(
      pack,
      'guard',
      { ...previous, snapshotId: 'OLD-SNAPSHOT' },
      () => 0,
    ).entryId,
    'TEST-NONE',
  );
});

test('full preparation connects reason, entrance, guards and every native room; individual rerolls preserve other fields', () => {
  const current = rollDungeonPreparationReading(
    registry,
    () => 0,
    selected(),
    pack,
  );
  for (const key of ['reason', 'entrance', 'guard'] as const)
    assert.equal(current.preparation?.features?.[key]?.source, 'DNGNGEN');
  assert.equal(Object.keys(current.preparation!.rooms!).length, 4);
  assert.equal(
    current.oracle?.rolls.some(
      (roll) => roll.metadata?.preparationField === 'entrance',
    ),
    false,
  );
  const changed = rerollDungeonPreparationField(
    current,
    'reason',
    registry,
    () => 0,
    pack,
  );
  for (const block of current.blocks.filter(
    (block) => block.title !== 'What brings you here?',
  ))
    assert.strictEqual(
      changed.blocks.find((next) => next.title === block.title),
      block,
    );
  assert.strictEqual(changed.preparation!.rooms, current.preparation!.rooms);
  assert.match(
    copyReferenceReading(changed),
    /What brings you here\? · DNGNGEN/,
  );
});

test('switching to Core retains old provenance, Core entrance reroll replaces it, and handwriting clears only its own helper', () => {
  const current = rollDungeonPreparationReading(
    registry,
    () => 0,
    selected(),
    pack,
  );
  const core = selectDungeonRoomSource(current, 'CORE');
  assert.equal(copyReferenceReading(core), copyReferenceReading(current));
  const entrance = rerollDungeonPreparationField(
    core,
    'entrance',
    registry,
    () => 0,
    pack,
  );
  assert.equal(entrance.preparation!.features!.entrance, undefined);
  assert.equal(
    entrance.oracle?.rolls.find(
      (roll) => roll.metadata?.preparationField === 'entrance',
    )?.oracleId,
    'reclvse.dungeonEntrance',
  );
  const edited = editDungeonPreparationField(current, 'reason', 'USER TEXT');
  assert.equal(edited.preparation!.features!.reason, undefined);
  assert.equal(
    edited.blocks.find((block) => block.title === 'What brings you here?')
      ?.translation?.ko,
    undefined,
  );
  assert.strictEqual(
    edited.preparation!.features!.guard,
    current.preparation!.features!.guard,
  );
  assert.equal(
    eligibleForReferenceReplay({
      ...edited,
      preparation: {
        roomSource: 'CORE',
        features: edited.preparation!.features,
      },
    }),
    false,
  );
});

test('missing native feature pack fails before drawing instead of silently substituting the Core entrance', () => {
  assert.throws(
    () =>
      rerollDungeonPreparationField(selected(), 'entrance', registry, () =>
        assert.fail('unexpected RNG'),
      ),
    /DNGNGEN/,
  );
});

test('main sheet and preview show explicit Korean helpers without repeating DNGNGEN per room', () => {
  const current = rerollDungeonPreparationField(
    selected(),
    'special1',
    registry,
    () => 0,
    pack,
  );
  const html = renderToStaticMarkup(
    createElement(DungeonPreparation, {
      reading: current,
      registry,
      privateDngngen: { status: 'ready', pack },
      onChange() {},
      onOpen() {},
    }),
  );
  const room = html
    .split('data-preparation-field="special1"')[1]
    .split('data-preparation-field="special2"')[0];
  assert.match(room, /lang="ko">시험 방 가/);
  assert.doesNotMatch(room, /DNGNGEN|표 보기/);
  const preview = renderToStaticMarkup(
    createElement(ReferenceReadingBlock, { reading: current }),
  );
  assert.match(preview, /lang="ko">시험 방 나/);
  assert.doesNotMatch(preview, /dungeon-room-provenance/);
  for (const key of ['reason', 'guard'])
    assert.match(
      html.split(`data-preparation-field="${key}"`)[1].split('</section>')[0],
      /굴리기/,
    );
});

test('local helper reader rejects stale snapshots and damaged placeholders; endpoint/client keep valid helpers', async () => {
  const root = await mkdtemp(join(tmpdir(), 'dngngen-ko-'));
  const path = join(root, 'ko.json'),
    packPath = join(root, 'pack.json');
  const companion = {
    format: 'reference-desk.dngngen-ko',
    version: 1,
    sourceSha256: pack.integrity.payloadSha256,
    messages: translations,
  };
  const server = createPrivateDngngenServer({
    root,
    packPath,
    dngngenTranslationPath: path,
    allowSynthetic: true,
  });
  try {
    await writeFile(
      path,
      JSON.stringify({ ...companion, sourceSha256: '0'.repeat(64) }),
    );
    assert.equal(await readPrivateDngngenTranslation(path, pack), undefined);
    await writeFile(
      path,
      JSON.stringify({ ...companion, messages: { 'TEST-SQUAD': [] } }),
    );
    assert.equal(await readPrivateDngngenTranslation(path, pack), undefined);
    await writeFile(path, JSON.stringify(companion));
    await writeFile(packPath, JSON.stringify(english));
    await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
    const address = server.address();
    assert(address && typeof address !== 'string');
    const response = await fetch(
      `http://127.0.0.1:${address.port}/__private/dngngen`,
    );
    const body = await response.json();
    const loaded = await loadPrivateDngngen(
      true,
      async () => new Response(JSON.stringify(body)),
    );
    assert.equal(loaded.status, 'ready');
    if (loaded.status === 'ready')
      assert.equal(
        rollDngngenFeature(loaded.pack, 'reason', undefined, () => 0).ko,
        '시험 이유 하나',
      );
  } finally {
    if (server.listening)
      await new Promise<void>((done) => server.close(() => done()));
    await rm(root, { recursive: true, force: true });
  }
});

test('offline feature importer preserves duplicate positions and ordered numeric recipes without executing source', () => {
  const source = `const Reasons={id:'REASON-TABLE',results:[feature('reason.TEST-1'),feature('reason.TEST-2')]}; const Entrances={id:'ENTRANCE-TABLE',results:[feature('entrance.TEST-1'),feature('entrance.TEST-2')]}; const Guards={id:'GUARD-TABLE',results:[feature('guard.TEST-1'),feature('guard.TEST-1'),feature('guard.TEST-2',()=>({count:random(3,5)}))]};`;
  const features = extractDngngenFeatures(source);
  assert.deepEqual(
    features.guard?.map((entry) => entry.id),
    ['guard.TEST-1', 'guard.TEST-1', 'guard.TEST-2'],
  );
  assert.deepEqual(features.guard?.[2].values, [
    { name: 'count', recipe: { op: 'int', min: 3, max: 5 } },
  ]);
  assert.throws(
    () =>
      extractDngngenFeatures(source.replace('random(3,5)', 'process.exit(1)')),
    /unsupported-literal/,
  );
});
