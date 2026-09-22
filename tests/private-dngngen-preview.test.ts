import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReferenceReadingBlock } from '../src/components/InlineReferenceTools.tsx';
import {
  copyReferenceReading,
  eligibleForReferenceReplay,
  type ReferenceReading,
} from '../src/domain/referenceReading.ts';
import { emptyDungeonPreparationReading } from '../src/domain/dungeonReferencePreparation.ts';
import { rollDngngenRoom } from '../src/generators/dngngen.ts';
import { translateGeneratedText } from '../src/generators/translation.ts';
import {
  createSyntheticDngngenPack,
  sealSyntheticDngngenPack,
} from './fixtures/dngngenSynthetic.ts';

function nativeReading(): ReferenceReading {
  const base = createSyntheticDngngenPack();
  // Neutral single-word test labels deliberately overlap application vocabulary.
  // They are invented fixture values, not descriptions from the DNGNGEN source.
  const pack = sealSyntheticDngngenPack({
    ...base,
    messages: {
      ...base.messages,
      [base.pools.A[0].messageId]: [{ type: 'text', text: 'Attack' }],
      [base.pools.B[0].messageId]: [{ type: 'text', text: 'None' }],
    },
  });
  const room = rollDngngenRoom(pack, 1, [], () => 0);
  const reading = emptyDungeonPreparationReading();
  return {
    ...reading,
    preparation: { roomSource: 'DNGNGEN', rooms: { 1: room } },
    blocks: reading.blocks.map((block) =>
      block.title === 'Special Room 1' ? { ...block, text: room.text } : block,
    ),
  };
}
const render = (reading: ReferenceReading) =>
  renderToStaticMarkup(createElement(ReferenceReadingBlock, { reading }));

test('Workbench native room preview keeps English components out of generated translation', () => {
  const reading = nativeReading();
  assert.equal(translateGeneratedText('Attack'), '공격');
  assert.equal(translateGeneratedText('None'), '없음');
  const html = render(reading);
  const nativeParagraphs = [
    ...html.matchAll(/<p class="dungeon-native-component"[^>]*>[\s\S]*?<\/p>/g),
  ];
  assert.equal(nativeParagraphs.length, 2);
  assert(
    nativeParagraphs.every(([paragraph]) => paragraph.includes('lang="en"')),
  );
  assert(
    nativeParagraphs.every(
      ([paragraph]) => !paragraph.includes('generated-translation'),
    ),
  );
  assert.match(nativeParagraphs[0][0], />Attack<\/span>/);
  assert.match(nativeParagraphs[1][0], />None<\/span>/);
  assert.doesNotMatch(html, /공격|없음/);
  assert.match(html, /dungeon-room-provenance">DNGNGEN · SYNTHETIC DEMO/);
});

test('Workbench mixed preview shows each result source and keeps explicit Core translation', () => {
  const reading = nativeReading();
  reading.blocks = reading.blocks.map((block) =>
    block.title === 'Special Room 2'
      ? {
          ...block,
          text: 'CORE TEST CONTENT',
          translation: { ko: '코어 테스트', titleKo: '특별한 방 2' },
        }
      : block,
  );
  const html = render(reading);
  assert.match(html, /dungeon-room-provenance">DNGNGEN · SYNTHETIC DEMO/);
  assert.match(html, /dungeon-room-provenance">CORE<\/small>/);
  assert.match(html, /CORE TEST CONTENT/);
  assert.match(html, /코어 테스트/);
});

test('Workbench source switch cannot relabel an existing native result as Core', () => {
  const reading = nativeReading();
  reading.preparation = { ...reading.preparation!, roomSource: 'CORE' };
  assert.match(
    render(reading),
    /dungeon-room-provenance">DNGNGEN · SYNTHETIC DEMO/,
  );
  assert.match(
    copyReferenceReading(reading),
    /Special Room 1 · DNGNGEN \(synthetic demo\)/,
  );
});

test('Core-only Workbench preview retains exactly its previous markup', () => {
  const reading = emptyDungeonPreparationReading();
  reading.blocks[0] = { ...reading.blocks[0], text: 'CORE TEST NAME' };
  const selectedCore: ReferenceReading = {
    ...reading,
    preparation: { roomSource: 'CORE', rooms: {} },
  };
  assert.equal(render(reading), render(selectedCore));
  assert.doesNotMatch(
    render(reading),
    /dungeon-room-provenance|dungeon-native-component/,
  );
});

test('Private preview and Copy consume no RNG and do not mutate the current reading', (t) => {
  const reading = nativeReading();
  const before = JSON.stringify(reading);
  const dice = t.mock.method(globalThis.crypto, 'getRandomValues', () => {
    throw new Error('Preview must not consume RNG');
  });
  const random = t.mock.method(Math, 'random', () => {
    throw new Error('Preview must not consume RNG');
  });
  render(reading);
  assert.match(copyReferenceReading(reading), /Attack\nNone/);
  assert.equal(JSON.stringify(reading), before);
  assert.equal(dice.mock.callCount(), 0);
  assert.equal(random.mock.callCount(), 0);
});

test('Legacy replay excludes native rooms without changing current reading or Core eligibility', () => {
  const reading = nativeReading();
  const before = JSON.stringify(reading);
  assert.equal(eligibleForReferenceReplay(reading), false);
  assert.equal(
    eligibleForReferenceReplay({
      ...reading,
      preparation: { ...reading.preparation!, roomSource: 'CORE' },
    }),
    false,
  );
  assert.equal(
    eligibleForReferenceReplay(emptyDungeonPreparationReading()),
    true,
  );
  assert.equal(
    eligibleForReferenceReplay({
      ...emptyDungeonPreparationReading(),
      preparation: { roomSource: 'DNGNGEN' },
    }),
    true,
  );
  assert.equal(
    eligibleForReferenceReplay({
      ...reading,
      preparation: { roomSource: 'CORE', rooms: {} },
    }),
    true,
  );
  assert.equal(JSON.stringify(reading), before);
});
