import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { setRules, getRules } from '../src/storage/rulesStore.ts';
import { setOraclePack, getOraclePack } from '../src/storage/oracleStore.ts';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { buildReferenceRegistry } from '../src/domain/references.ts';
import { executeReference } from '../src/domain/referenceExecution.ts';
import { generatorReadingLayout } from '../src/domain/generatorReadingLayout.ts';
import { copyReferenceReading } from '../src/domain/referenceReading.ts';
import { GeneratorStatStrip } from '../src/components/GeneratorReadingLead.tsx';
import {
  generateCharacter,
  rerollCharacterField,
} from '../src/generators/character.ts';
import { classCharacterReading } from '../src/generators/characterReference.ts';
import { characterClasses } from '../src/generators/characterClasses.ts';

setRules(JSON.parse(readFileSync('public/rules/library.json', 'utf8')));
setOraclePack(JSON.parse(readFileSync('public/rules/oracles.json', 'utf8')));
const rules = getRules()!;
const registry = buildOracleRegistry(rules, getOraclePack());
const entry = buildReferenceRegistry(registry, rules).byId[
  'procedure:character.core-classless'
];
const options = {
  registry,
  rules,
  region: 'sarkash' as const,
  stockKind: 'common' as const,
  stockDR: 10,
  cityLarge: false,
  cityExits: true,
};

test('character stat cards show the actual creation formula without changing source, copy or rolls', () => {
  const reading = executeReference(entry, {
    ...options,
    characterMode: 'chosen',
    characterClassId: 'fanged-deserter',
  })!;
  const before = JSON.stringify(reading);
  const copied = copyReferenceReading(reading);
  const layout = generatorReadingLayout(reading, entry.id);
  const html = renderToStaticMarkup(
    createElement(GeneratorStatStrip, {
      blocks: layout.stats,
      character: true,
    }),
  );
  assert.match(html, /3d6\+2 → 보정치/);
  assert.match(html, /3d6−1 → 보정치/);
  assert.match(html, /체력 \+ d10 · 최소 1/);
  assert.match(html, /2d6 × 10/);
  assert.match(html, /생성: d2/);
  const displayedRules = layout.fields.find((b) => b.title === 'Class rules')!;
  assert.doesNotMatch(displayedRules.text, /3d6/);
  assert.match(displayedRules.text, /Built like a bull/);
  assert.match(displayedRules.text, /Normal Agility tests are DR14/);
  assert.match(displayedRules.text, /excluding defence/);
  assert.match(displayedRules.text, /Illiterate/);
  assert.equal(JSON.stringify(reading), before);
  assert.equal(copyReferenceReading(reading), copied);
  assert.match(copied, /3d6\+2 for Strength/);
});

test('classless optional dice and imported SCVM numbers are never treated as class formulas', () => {
  const reading = executeReference(entry, {
    ...options,
    characterMode: 'classless',
    classlessBoost: ['strength', 'presence'],
    coreOmens: true,
  })!;
  const html = renderToStaticMarkup(
    createElement(GeneratorStatStrip, {
      blocks: generatorReadingLayout(reading, entry.id).stats,
      character: true,
    }),
  );
  assert.match(html, /4d6 · 최저 1개 제외 → 보정치/);
  assert.match(html, /3d6 → 보정치/);
  const imported = {
    title: 'SCVM result',
    procedureInputs: { generator: 'scvmbirther' },
    blocks: [
      { title: 'Name', text: 'Fixture' },
      { title: 'HP', text: '8' },
      { title: 'Omens', text: '3' },
      { title: 'Abilities', text: 'Strength +2' },
    ],
    sourceRefs: [],
  };
  const importedHtml = renderToStaticMarkup(
    createElement(GeneratorStatStrip, {
      blocks: generatorReadingLayout(imported, entry.id).stats,
      character: true,
    }),
  );
  assert.doesNotMatch(importedHtml, /generator-stat-formula|3d6|체력 \+/);
});

test('Pale One modifiers follow conversion and its conditional Omen bonus follows the actual provenance', () => {
  const character = generateCharacter('qa-sheet', false, 'pale-one');
  character.generation!.rolls.omenSides = 4;
  character.generation!.rolls.omenBonus = 2;
  rerollCharacterField(character, 'omens');
  const reading = classCharacterReading(character, 'chosen');
  const layout = generatorReadingLayout(reading, entry.id);
  const html = renderToStaticMarkup(
    createElement(GeneratorStatStrip, {
      blocks: layout.stats,
      character: true,
    }),
  );
  assert.match(html, /3d6 → 보정치 \+1/);
  assert.match(html, /3d6 → 보정치 −2/);
  assert.doesNotMatch(html, /3d6\+1|3d6−2/);
  assert.match(html, /생성: d4\+2/);
  assert.ok(layout.stats.some((block) => block.title === 'Power uses/day'));
  assert.match(html, /지각 \+ d4 · 0 미만은 0/);
  const displayedRules = layout.fields.find((b) => b.title === 'Class rules')!;
  assert.doesNotMatch(displayedRules.text, /\+1 Agility|−2 Toughness/);
  assert.match(displayedRules.text, /bones are hollow and fragile/);
  assert.match(displayedRules.text, /cannot use scrolls/);
});

test('unproven or edited historical class rules retain their complete formulas', () => {
  const reading = executeReference(entry, {
    ...options,
    characterMode: 'chosen',
    characterClassId: 'fanged-deserter',
  })!;
  delete reading.oracle;
  const layout = generatorReadingLayout(reading, entry.id);
  assert.match(
    layout.fields.find((b) => b.title === 'Class rules')!.text,
    /3d6\+2/,
  );
  const html = renderToStaticMarkup(
    createElement(GeneratorStatStrip, {
      blocks: layout.stats,
      character: true,
    }),
  );
  assert.doesNotMatch(html, /generator-stat-formula/);
});

test('equipment and features explain their distinct creation origins using recorded provenance', () => {
  const character = generateCharacter('qa-sheet', false, 'fanged-deserter');
  const reading = classCharacterReading(character, 'chosen');
  const layout = generatorReadingLayout(reading, entry.id);
  const context = (title: string, starts = '') =>
    (
      layout.fields.find(
        (b) => b.title.startsWith(title) && b.text.startsWith(starts),
      ) as { sheetContext?: string } | undefined
    )?.sheetContext;
  assert.equal(context('Equipment', 'Waterskin'), '공통 시작 장비');
  assert.match(context('Weapon', 'Bite') ?? '', /직업 시작 무기/);
  assert.match(context('Class feature') ?? '', /직업에서 시작 시 얻는 능력/);
  assert.match(context('Weapon', 'Bite') ?? '', /송곳니 달린 탈영병/);
});

test('all supported classes keep their restrictions, translated context and canonical copy after lifting creation dice', () => {
  for (const definition of characterClasses()) {
    const reading = classCharacterReading(
      generateCharacter('qa-sheet', false, definition.id),
      'chosen',
    );
    const before = JSON.stringify(reading);
    const layout = generatorReadingLayout(reading, entry.id);
    const classRules = layout.fields.find(
      (block) => block.title === 'Class rules',
    )!;
    assert.ok(
      classRules.translation?.ko,
      `${definition.id}: translated rules remain present`,
    );
    assert.doesNotMatch(classRules.text, /3d6|!\./, definition.id);
    for (const rule of definition.playerRules ?? definition.rules) {
      if (
        /3d6/.test(rule) ||
        (definition.id === 'pale-one' && /\+1 Agility/.test(rule))
      )
        continue;
      assert.ok(
        classRules.text.includes(rule),
        `${definition.id}: retained ${rule}`,
      );
    }
    assert.equal(JSON.stringify(reading), before);
    for (const rule of definition.playerRules ?? definition.rules)
      assert.ok(copyReferenceReading(reading).includes(rule));
  }
});

test('classes whose abilities consume Power uses retain the available daily pool even without a scroll', () => {
  // Identify the second source class by its verified HERETIC page, keeping
  // private generator identifiers out of the public repository.
  const classIds = [
    'pale-one',
    characterClasses().find(
      (def) =>
        def.source.bookId === 'heretic' && def.source.pdfPages.includes(12),
    )!.id,
  ];
  for (const classId of classIds) {
    const character = generateCharacter('qa-sheet', false, classId);
    character.equipment = character.equipment.filter(
      (item) => !/scroll/i.test(item.text),
    );
    const reading = classCharacterReading(character, 'chosen');
    const layout = generatorReadingLayout(reading, entry.id);
    const uses = layout.stats.find((block) => block.title === 'Power uses/day');
    assert.equal(uses?.text, String(character.powerUses), classId);
    assert.equal(uses?.sheetFormula, '지각 + d4 · 0 미만은 0');
    assert.ok(
      layout.fields.some((block) => block.title.startsWith('Class feature')),
    );
  }
});

test('Enhanced Fortitude replaces only the displayed HP formula and blessings stay with class features', () => {
  const reading = executeReference(entry, {
    ...options,
    characterMode: 'classless',
    coreOmens: true,
  })!;
  reading.blocks.push({
    title: 'Starting Blessing — Enhanced Fortitude',
    text: 'Fixture blessing with its full conditions.',
  });
  for (const [method, expected] of [
    ['fixed12', 'RECLVSE · 12 고정'],
    ['10+d4', 'RECLVSE · 10+d4'],
  ]) {
    reading.procedureInputs = {
      reclvseBlessings: 'enhanced-fortitude',
      reclvseFortitude: method,
    };
    const layout = generatorReadingLayout(reading, entry.id);
    assert.equal(
      layout.stats.find((block) => block.title === 'HP')?.sheetFormula,
      expected,
    );
    const blessing = layout.groups
      ?.find((group) => group.id === 'features')
      ?.blocks.find((block) => block.title.startsWith('Starting Blessing'));
    assert.equal(blessing?.sheetContext, 'RECLVSE 선택 규칙');
  }
});

test('unrelated generator Power fields keep their original placement', () => {
  const reading = {
    title: 'Creature fixture',
    blocks: [
      { title: 'HP', text: '8' },
      {
        title: 'Power uses/day',
        text: 'Its complete creature-specific condition.',
      },
    ],
    sourceRefs: [],
  };
  const layout = generatorReadingLayout(reading, 'oracle:creature-fixture');
  assert.deepEqual(
    layout.stats.map((block) => block.title),
    ['HP'],
  );
  assert.equal(layout.fields[0], reading.blocks[1]);
});
