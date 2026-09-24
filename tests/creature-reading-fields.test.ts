import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CreatureReadingFields } from '../src/components/CreatureReadingFields.tsx';
import { executeReference } from '../src/domain/referenceExecution.ts';
import {
  buildReferenceRegistry,
  creatureReferenceId,
} from '../src/domain/references.ts';
import {
  copyReferenceReading,
  type ReferenceReading,
} from '../src/domain/referenceReading.ts';
import type { OracleRegistry } from '../src/domain/oracle.ts';
import type { RulesPack } from '../src/storage/rulesStore.ts';

function openCreature(record: Record<string, unknown>) {
  const registry: OracleRegistry = {
    books: [
      { id: 'core', title: 'Core fixture' },
      { id: 'feretory', title: 'Feretory fixture' },
    ],
    tables: [],
    procedures: [],
  };
  const rules: RulesPack = {
    schemaVersion: 1,
    books: [],
    tables: {},
    creatures: [record],
    outcasts: [],
    notes: {},
  };
  const before = JSON.stringify(rules);
  const entry = buildReferenceRegistry(registry, rules).byId[
    creatureReferenceId(record)
  ];
  const reading = executeReference(entry, {
    registry,
    rules,
    region: 'sarkash',
    stockKind: 'room',
    stockDR: 10,
    cityLarge: false,
    cityExits: false,
    rng: () => {
      throw new Error('Opening a creature must not reroll it');
    },
  })!;
  assert.equal(JSON.stringify(rules), before);
  return reading;
}

test('Creature fields preserve multiple attacks and all source text in display and copy', () => {
  const reading = openCreature({
    id: 'fixture-beast',
    name: 'Fixture Beast',
    book: 'core',
    pdfPage: 1,
    hp: 7,
    morale: 8,
    armor: '-d2',
    attackOptions: [
      { name: 'Bite', damage: 'd4', description: 'First attack.' },
      { name: 'Claw', damage: 'd6', description: 'Second attack.' },
    ],
    specialAbility: 'A source trait.',
    weakness: 'A source weakness.',
    loot: 'A source item.',
    behavior: 'Waits.',
    wants: 'Quiet.',
    description: 'A source description.',
  });
  const block = reading.blocks[0];
  const expected =
    'HP 7 · Morale 8 · Armor -d2\nBite d4 · First attack.\nClaw d6 · Second attack.\nA source trait.\nWeakness: A source weakness.\nLoot: A source item.\nWaits.\nQuiet.\nA source description.';
  assert.equal(block.text, expected);
  assert.equal(block.creatureFields!.map((f) => f.text).join('\n'), expected);
  const attacks = block.creatureFields!.find((f) => f.id === 'attacks')!;
  assert.equal(
    attacks.text,
    'Bite d4 · First attack.\nClaw d6 · Second attack.',
  );
  assert.equal(
    new Set(block.creatureFields!.map((f) => f.id)).size,
    block.creatureFields!.length,
  );
  const html = renderToStaticMarkup(
    createElement(CreatureReadingFields, { block }),
  );
  assert.ok(html.indexOf('<h4>공격</h4>') < html.indexOf('First attack.'));
  assert.ok(
    html.indexOf('Second attack.') < html.indexOf('<h4>특징 · 특수능력</h4>'),
  );
  assert.ok(copyReferenceReading(reading).includes(expected));
  assert.doesNotMatch(copyReferenceReading(reading), /능력치|특징 · 특수능력/);
});

test('Missing creature stats remain unavailable, without empty field groups or manufactured values', () => {
  const reading = openCreature({
    id: 'fixture-unknown',
    name: 'Unknown Beast',
    book: 'feretory',
    section: 'Eat Prey Kill',
    hp: null,
    presetEligible: false,
    pdfPage: 2,
    description: 'Only a description is supplied.',
  });
  const fields = reading.blocks[0].creatureFields!;
  assert.equal(
    fields.some((f) => f.id === 'stats'),
    false,
  );
  assert.ok(fields.every((f) => f.text.trim()));
  assert.match(
    fields.find((f) => f.id === 'unavailable')!.text,
    /SOURCE UNAVAILABLE/,
  );
  assert.doesNotMatch(copyReferenceReading(reading), /HP 0|Morale 0/);
});

test('Older readings and explicit paragraph translations stay complete and paired', () => {
  const block: ReferenceReading['blocks'][number] = {
    title: 'Older result',
    kind: 'creature',
    text: 'First paragraph.\n\nSecond paragraph.',
    translation: { ko: '첫 문단.\n\n둘째 문단.' },
  };
  for (const candidate of [
    block,
    {
      ...block,
      creatureFields: [
        {
          id: 'stats',
          title: '능력치',
          text: 'Must not replace explicit source text.',
        },
      ],
    },
  ]) {
    const html = renderToStaticMarkup(
      createElement(CreatureReadingFields, { block: candidate }),
    );
    assert.ok(html.indexOf('First paragraph.') < html.indexOf('첫 문단.'));
    assert.ok(html.indexOf('첫 문단.') < html.indexOf('Second paragraph.'));
    assert.ok(html.indexOf('Second paragraph.') < html.indexOf('둘째 문단.'));
    assert.doesNotMatch(html, /Must not replace/);
  }
  const html = renderToStaticMarkup(
    createElement(CreatureReadingFields, {
      block: { ...block, translation: undefined },
    }),
  );
  assert.match(html, /First paragraph\./);
  assert.match(html, /Second paragraph\./);
});
