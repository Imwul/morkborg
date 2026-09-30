import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  generatorReadingLayout,
  creatureStatBlocks,
} from '../src/domain/generatorReadingLayout.ts';
import {
  copyReferenceReading,
  type ReferenceReading,
} from '../src/domain/referenceReading.ts';
import {
  GeneratorIntroduction,
  GeneratorStatStrip,
} from '../src/components/GeneratorReadingLead.tsx';

const siteReading = (): ReferenceReading => ({
  title: 'Fixture A',
  procedureInputs: { generator: 'monster-site' },
  sourceRefs: [],
  blocks: [
    {
      title: 'Appearance',
      text: 'Fixture A with fixture B. It wants quiet.',
      translation: { ko: '전체 묘사. 조용하기를 원한다.' },
    },
    {
      title: 'Wants',
      text: 'quiet.',
      translation: { ko: '조용하기를 원한다.' },
    },
    { title: 'HP', text: '8' },
    { title: 'Morale', text: '12' },
    {
      title: 'Armor',
      text: 'Fixture protection -d4',
      translation: { ko: '특별한 보호 -d4' },
    },
    { title: 'Attack', text: 'Fixture hammer\nd6+1' },
    { title: 'Ability', text: 'Agility DR14 or d2 damage ignoring armor.' },
    { title: 'Lair', text: 'Inside a fixture.' },
    {
      title: 'Loot',
      text: 'Two items, including the second sentence. Keep this condition.',
    },
  ],
});

test('Monster presentation lifts the complete introduction, preserving rolls, copy and every detail', () => {
  const reading = siteReading();
  const before = JSON.stringify(reading);
  const copied = copyReferenceReading(reading);
  const layout = generatorReadingLayout(reading);
  assert.equal(layout.introduction, reading.blocks[0]);
  assert.deepEqual(
    layout.stats.map((b) => b.title),
    ['HP', 'Morale', 'Armor', 'Attack'],
  );
  assert.deepEqual(
    layout.fields.map((b) => b.title),
    ['Ability', 'Lair', 'Loot'],
  );
  assert.equal(layout.fields[2].text, reading.blocks[8].text);
  assert.equal(JSON.stringify(reading), before);
  assert.equal(copyReferenceReading(reading), copied);
  const intro = renderToStaticMarkup(
    createElement(GeneratorIntroduction, { block: layout.introduction! }),
  );
  assert.ok(
    intro.indexOf('Fixture A with fixture B.') < intro.indexOf('전체 묘사'),
  );
  assert.doesNotMatch(intro, /<h3/);
  const stats = renderToStaticMarkup(
    createElement(GeneratorStatStrip, { blocks: layout.stats }),
  );
  for (const value of [
    'Fixture protection',
    '-d4',
    'Fixture hammer',
    'd6+1',
    '특별한 보호',
  ])
    assert.ok(stats.includes(value), value);
});

test('Nonduplicated desires and translations survive; legacy results without a hero keep their fields', () => {
  const reading = siteReading();
  reading.blocks[1].translation!.ko = '추가 조건이 있다.';
  assert.ok(generatorReadingLayout(reading).fields.includes(reading.blocks[1]));
  delete reading.blocks[1].translation;
  reading.blocks[1].text = 'A separate instruction.';
  assert.ok(generatorReadingLayout(reading).fields.includes(reading.blocks[1]));
  reading.blocks.shift();
  assert.equal(generatorReadingLayout(reading).introduction, undefined);
  assert.ok(
    generatorReadingLayout(reading).fields.some((b) => b.title === 'Wants'),
  );
});

test('Missing optional fields stay absent and equipment-only readings retain their original order', () => {
  const reading = siteReading();
  reading.blocks = reading.blocks.filter(
    (b) => !['Lair', 'Loot', 'Ability'].includes(b.title),
  );
  assert.deepEqual(generatorReadingLayout(reading).fields, []);
  const equipment: ReferenceReading = {
    title: 'Equipment',
    sourceRefs: [],
    blocks: [
      { title: 'Container', text: 'A bag' },
      { title: 'Armor', text: 'Light armor' },
      { title: 'Scroll', text: 'Name and complete effect.' },
    ],
  };
  assert.deepEqual(generatorReadingLayout(equipment).stats, []);
  assert.deepEqual(generatorReadingLayout(equipment).fields, equipment.blocks);
});

test('Creature stat grouping preserves tie choices and falls back for unfamiliar or incomplete text', () => {
  const text =
    'HP 8 · Morale 12 · Armor Tie — referee choice: None / −d2 / −d6 · Damage d6';
  const blocks = creatureStatBlocks(text)!;
  assert.equal(blocks.map((b) => `${b.title} ${b.text}`).join(' · '), text);
  assert.equal(
    creatureStatBlocks('HP unknown · Custom source rule'),
    undefined,
  );
  assert.equal(creatureStatBlocks(''), undefined);
});
