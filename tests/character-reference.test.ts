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
import { characterClasses } from '../src/generators/characterClasses.ts';
import { generatorReadingLayout } from '../src/domain/generatorReadingLayout.ts';
import { copyReferenceReading } from '../src/domain/referenceReading.ts';
import {
  objectFromReading,
  validateObjectShelf,
} from '../src/domain/savedObjects.ts';
import { executionParametersSchema } from '../src/storage/conveniencePreferences.ts';
import {
  replayResult,
  createReplay,
  replaySchema,
} from '../src/domain/rollReplay.ts';
import { CharacterGenerationControl } from '../src/components/CharacterGenerationControl.tsx';
import { RuleFaithfulSettings } from '../src/components/RuleFaithfulSettings.tsx';
import { authoritiesForReading } from '../src/domain/generationAuthority.ts';

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

test('each supported class generates its own identity, formulas, complete rules and saved result', () => {
  assert.equal(characterClasses().length, 12);
  for (const def of characterClasses()) {
    const reading = executeReference(entry, {
      ...options,
      characterMode: 'chosen',
      characterClassId: def.id,
      classlessBoost: ['strength', 'presence'],
      coreOmens: false,
    })!;
    assert.equal(reading.procedureInputs?.characterClassId, def.id);
    assert.equal(
      reading.blocks.find((block) => block.title === 'Class')?.text,
      def.name,
    );
    assert.equal(reading.sourceRefs[0].bookId, def.source.bookId);
    assert.equal(reading.sourceRefs[0].tableTitle, def.name);
    assert.ok(
      reading.authority?.some(
        (authority) => authority.id === `character.class:${def.id}`,
      ),
    );
    const authorities = authoritiesForReading(
      reading,
      'character.core-classless',
    );
    assert.ok(
      authorities.some(
        (authority) => authority.id === `character.class:${def.id}`,
      ),
    );
    // Core starting supplies may retain their source procedure. The root UI
    // must not add an uncited classless authority to a class generation.
    assert.ok(
      authorities
        .filter((authority) => authority.id === 'character.core-classless')
        .every((authority) => authority.sourceRefs?.length),
    );
    const hp = reading.oracle!.rolls.find((roll) => roll.title === 'HP')!;
    assert.equal(hp.dice, `d${def.hpDie}`);
    assert.ok(Number(hp.text) >= 1);
    for (const title of ['Strength', 'Agility', 'Presence', 'Toughness']) {
      const rolled = reading.oracle!.rolls.find(
        (roll) => roll.title === title,
      )!;
      assert.equal(
        rolled.diceValues.length,
        3,
        'classless boost never changes class formulas',
      );
    }
    const omens = reading.oracle!.rolls.find((roll) => roll.title === 'Omens')!;
    assert.ok(Number(omens.text) >= 1);
    if (def.forbidArmor)
      assert.equal(
        reading.blocks.find((block) => block.title === 'Armor')?.text,
        'No armor',
      );
    const copied = copyReferenceReading(reading);
    assert.ok(copied.includes(def.name));
    for (const rule of def.playerRules ?? def.rules)
      assert.ok(copied.includes(rule));
    assert.ok(
      reading.blocks.some((block) => block.title.startsWith('Class feature')),
    );
    assert.ok(reading.blocks.some((block) => block.title.startsWith('Weapon')));
    assert.ok(
      reading.blocks.some(
        (block) =>
          block.title.startsWith('Equipment') && block.text === 'Waterskin',
      ),
    );
    assert.ok(
      reading.blocks.every((block) => !block.text.includes('undefined')),
    );
    const layout = generatorReadingLayout(reading, entry.id);
    assert.equal(layout.identity?.title, 'Name');
    assert.equal(layout.characterClass?.text, def.name);
    const saved = objectFromReading(entry.id, reading);
    assert.equal(saved.name, layout.identity!.text);
    assert.ok(saved.originalText.includes(def.name));
    assert.equal(
      validateObjectShelf({ version: 1, objects: [saved] }).objects.length,
      1,
    );
  }
});

test('class selection stays explicit and invalid choices never fall back to random or classless', () => {
  for (const characterClassId of [
    undefined,
    '',
    'random',
    'classless',
    'unsupported-class',
  ])
    assert.throws(() =>
      executeReference(entry, {
        ...options,
        characterMode: 'chosen',
        characterClassId,
      }),
    );
  const previous = executeReference(entry, options)!;
  const unchanged = JSON.stringify(previous);
  const markup = renderToStaticMarkup(
    createElement(CharacterGenerationControl, {
      value: { characterMode: 'chosen', characterClassId: 'esoteric-hermit' },
      onChange: () => {},
      classes: characterClasses(),
      reading: previous,
    }),
  );
  assert.match(markup, /Classless/);
  assert.match(markup, /Random Class/);
  assert.match(markup, /Choose Class/);
  assert.match(markup, /Class · 생성 직업/);
  assert.match(markup, /다음 REROLL부터 적용/);
  assert.match(markup, /optgroup/);
  assert.doesNotMatch(markup, /SCVMBIRTHER|캐릭터 원문/);
  assert.equal(JSON.stringify(previous), unchanged);
  const classlessSettings = renderToStaticMarkup(
    createElement(RuleFaithfulSettings, {
      entry,
      value: {},
      onChange: () => {},
    }),
  );
  assert.match(classlessSettings, /Standard · 모두 3d6/);
  assert.match(classlessSettings, /Use Omens · 시작 1–2점/);
  assert.doesNotMatch(classlessSettings, /checked=""/);
  assert.equal(
    renderToStaticMarkup(
      createElement(RuleFaithfulSettings, {
        entry,
        value: {
          characterMode: 'chosen',
          classlessBoost: ['strength', 'presence'],
        },
        onChange: () => {},
      }),
    ),
    '',
  );
});

test('random class records the resolved identity while replay retains random selection', () => {
  const parameters = executionParametersSchema.parse({
    ...options,
    characterMode: 'random',
  });
  const reading = executeReference(entry, {
    ...options,
    characterMode: 'random',
  })!;
  assert.ok(
    characterClasses().some(
      (def) => def.id === reading.procedureInputs?.characterClassId,
    ),
  );
  assert.equal(reading.procedureInputs?.characterMode, 'random');
  assert.ok(
    reading.authority?.some(
      (authority) => authority.id === 'app.random-character-class',
    ),
  );
  const replay = createReplay({
    kind: 'reference',
    referenceId: entry.id,
    title: reading.title,
    parameters,
    procedureInputs: reading.procedureInputs,
    results: [replayResult(entry.id, reading)],
  });
  const restored = replaySchema.parse(JSON.parse(JSON.stringify(replay)));
  assert.equal(restored.parameters.characterMode, 'random');
  assert.equal(
    restored.procedureInputs?.characterClassId,
    reading.procedureInputs?.characterClassId,
  );
  assert.equal(
    restored.results[0].reading.procedureInputs?.characterMode,
    'random',
  );
  assert.equal(
    restored.results[0].reading.blocks.find((block) => block.title === 'Class')!
      .text,
    reading.blocks.find((block) => block.title === 'Class')!.text,
  );
  const chosen = executionParametersSchema.parse({
    ...options,
    characterMode: 'chosen',
    characterClassId: 'esoteric-hermit',
  });
  const rerolled = executeReference(entry, { ...options, ...chosen })!;
  assert.equal(rerolled.procedureInputs?.characterClassId, 'esoteric-hermit');
  assert.equal(
    executionParametersSchema.parse({}).characterMode,
    undefined,
    'legacy parameters retain the classless default',
  );
});
