import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  RECLVSE_BLESSING_IDS,
  RECLVSE_BLESSINGS,
  applyReclvseStartingBlessings,
  type ReclvseBlessingOptions,
} from '../src/domain/reclvseStartingBlessings.ts';
import {
  copyReferenceReading,
  type ReferenceReading,
} from '../src/domain/referenceReading.ts';
import {
  executeReference,
  type ReferenceExecutionOptions,
} from '../src/domain/referenceExecution.ts';
import { setRules, getRules } from '../src/storage/rulesStore.ts';
import { setOraclePack, getOraclePack } from '../src/storage/oracleStore.ts';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { buildReferenceRegistry } from '../src/domain/references.ts';
import {
  objectFromReading,
  validateObjectShelf,
} from '../src/domain/savedObjects.ts';
import {
  createReplay,
  replayResult,
  replaySchema,
  copyReplay,
} from '../src/domain/rollReplay.ts';
import { executionParametersSchema } from '../src/storage/conveniencePreferences.ts';

setRules(JSON.parse(readFileSync('public/rules/library.json', 'utf8')));
setOraclePack(JSON.parse(readFileSync('public/rules/oracles.json', 'utf8')));
const rules = getRules()!;
const registry = buildOracleRegistry(rules, getOraclePack());
const entry = buildReferenceRegistry(registry, rules).byId[
  'procedure:character.core-classless'
];
const baseOptions: ReferenceExecutionOptions = {
  registry,
  rules,
  region: 'sarkash',
  stockKind: 'common',
  stockDR: 10,
  cityLarge: false,
  cityExits: true,
};

/** Deliberately different TOU and class HP dice expose accidental additive bonuses. */
function originalReading(toughness = -3, hpDie = 'd8'): ReferenceReading {
  const hp = Math.max(1, 5 + toughness);
  return {
    title: 'Synthetic starting character',
    blocks: [
      { title: 'Name', text: 'Fixture' },
      { title: 'Toughness', text: String(toughness) },
      { title: 'HP', text: String(hp), dice: `${hpDie} = 5` },
      { title: 'Omens', text: '2' },
      { title: 'Strength', text: '+3' },
      { title: 'Equipment', text: 'A pre-existing fixture item' },
    ],
    copyContent: {
      title: 'Synthetic starting character',
      blocks: [
        { title: 'HP', text: String(hp) },
        { title: 'Equipment', text: 'A pre-existing fixture item' },
      ],
    },
    sourceRefs: [{ bookId: 'core', pdfPage: 29 }],
    procedureInputs: { characterMode: hpDie === 'd8' ? 'classless' : 'chosen' },
    oracle: {
      id: 'synthetic-character-result',
      title: 'Synthetic starting character',
      rolls: [
        {
          oracleId: 'synthetic.class',
          title: 'HP',
          text: String(hp),
          dice: hpDie,
          roll: 5,
          diceValues: [5],
          entryId: null,
          source: 'Synthetic original HP',
        },
        {
          oracleId: 'synthetic.class',
          title: 'Omens',
          text: '2',
          dice: 'd2',
          roll: 2,
          diceValues: [2],
          entryId: null,
          source: 'Synthetic original Omens',
        },
      ],
    },
  };
}
const hpBlock = (reading: ReferenceReading) =>
  reading.blocks.find((block) => block.title === 'HP')!;
const hpRoll = (reading: ReferenceReading) =>
  reading.oracle!.rolls.find((roll) => roll.title === 'HP')!;

test('no selected RECLVSE blessing preserves the exact reading and consumes no dice', (t) => {
  const globalRng = t.mock.method(crypto, 'getRandomValues', () => {
    throw new Error('An opt-out must not roll');
  });
  const original = originalReading();
  const before = structuredClone(original);
  for (const options of [
    {},
    { reclvseBlessings: [] },
    {
      reclvseBlessings: [],
      reclvseFortitude: '10+d4',
    },
  ] as ReclvseBlessingOptions[]) {
    assert.equal(
      applyReclvseStartingBlessings(original, options, () => {
        throw new Error('An opt-out must not consume the supplied RNG');
      }),
      original,
    );
  }
  assert.deepEqual(original, before);
  assert.equal(globalRng.mock.callCount(), 0);
});

test('Enhanced Fortitude fixed 12 replaces HP, preserves its previous trace and never rolls', () => {
  for (const [toughness, die] of [
    [-3, 'd8'],
    [3, 'd10'],
  ] as const) {
    const original = originalReading(toughness, die);
    const before = structuredClone(original);
    const changed = applyReclvseStartingBlessings(
      original,
      {
        reclvseBlessings: ['enhanced-fortitude'],
      },
      () => {
        throw new Error('Fixed HP has no die');
      },
    );
    assert.equal(hpBlock(changed).text, '12');
    assert.match(hpBlock(changed).dice!, /12 고정/);
    assert.equal(hpRoll(changed).text, '12');
    assert.equal(hpRoll(changed).roll, 12);
    assert.equal(hpRoll(changed).dice, 'fixed 12');
    assert.deepEqual(hpRoll(changed).diceValues, []);
    assert.deepEqual(
      hpRoll(changed).metadata?.replacedStartingHP,
      hpRoll(before),
    );
    assert.equal(changed.procedureInputs?.reclvseFortitude, 'fixed12');
    assert.deepEqual(
      changed.blocks.filter(
        (block) =>
          block.title !== 'HP' && !block.title.startsWith('Starting Blessing'),
      ),
      original.blocks.filter((block) => block.title !== 'HP'),
    );
    assert.deepEqual(
      original,
      before,
      'creation does not mutate the unblessed result',
    );
  }
});

test('Enhanced Fortitude 10+d4 endpoints ignore Toughness and the replaced class HP die', () => {
  for (const toughness of [-3, 3]) {
    for (const [value, face] of [
      [0, 1],
      [0.999999, 4],
    ]) {
      const original = originalReading(toughness, 'd10');
      let rolls = 0;
      const changed = applyReclvseStartingBlessings(
        original,
        {
          reclvseBlessings: ['enhanced-fortitude'],
          reclvseFortitude: '10+d4',
        },
        () => {
          rolls++;
          return value;
        },
      );
      assert.equal(rolls, 1);
      assert.equal(hpBlock(changed).text, String(10 + face));
      assert.equal(hpRoll(changed).text, String(10 + face));
      assert.equal(hpRoll(changed).roll, 10 + face);
      assert.equal(hpRoll(changed).dice, '10+d4');
      assert.deepEqual(hpRoll(changed).diceValues, [face]);
      assert.deepEqual(hpRoll(changed).metadata?.provenance?.rolls, [
        {
          tableId: 'reclvse.starting-blessings',
          dice: 'd4',
          value: face,
          diceValues: [face],
        },
      ]);
      assert.match(
        hpBlock(changed).dice!,
        new RegExp(`10 \\+ ${face} = ${10 + face}`),
      );
      assert.equal(hpBlock(original).text, String(Math.max(1, 5 + toughness)));
    }
  }
});

test('conditional blessings retain their costs and never grant free HP, abilities, Omens or equipment', () => {
  const original = originalReading();
  const conditional = RECLVSE_BLESSING_IDS.filter(
    (id) => id !== 'enhanced-fortitude',
  );
  const changed = applyReclvseStartingBlessings(
    original,
    {
      reclvseBlessings: conditional,
    },
    () => {
      throw new Error('Conditional rules do not roll at creation');
    },
  );
  assert.deepEqual(
    changed.blocks.slice(0, original.blocks.length),
    original.blocks,
  );
  assert.deepEqual(changed.oracle, original.oracle);
  assert.equal(changed.blocks.length, original.blocks.length + 4);
  const copied = copyReferenceReading(changed);
  for (const phrase of [
    '모든 진척·역경 저항 굴림에 불리점',
    '절반(내림)',
    'Track −2(최소 1)',
    '실패하거나 포기하면',
    'd4 피해',
    '사망·진척 포기와 대상 선택',
    '자동 지급하지 않습니다',
    '능력치 하나 +1(최대 +3)',
    '오멘 +1',
  ])
    assert.ok(copied.includes(phrase), phrase);
  assert.ok(!changed.procedureInputs?.reclvseFortitude);
});

test('selected blessings are canonical, explicitly sourced optional rules, separate from Core', () => {
  const changed = applyReclvseStartingBlessings(originalReading(), {
    reclvseBlessings: [...RECLVSE_BLESSING_IDS].reverse(),
  });
  assert.equal(
    changed.procedureInputs?.reclvseBlessings,
    RECLVSE_BLESSING_IDS.join(','),
  );
  assert.deepEqual(
    changed.blocks
      .filter((block) => block.title.startsWith('Starting Blessing'))
      .map((block) => block.title),
    RECLVSE_BLESSINGS.map((b) => `Starting Blessing — ${b.title}`),
  );
  assert.ok(
    changed.sourceRefs.some(
      (source) => source.bookId === 'core' && source.pdfPage === 29,
    ),
  );
  assert.ok(
    changed.sourceRefs.some(
      (source) =>
        source.bookId === 'reclvse' &&
        JSON.stringify(source.pdfPage) === '[13,14]',
    ),
  );
  const authority = changed.authority!.find(
    (a) => a.id === 'reclvse.starting-blessings',
  )!;
  assert.equal(authority.kind, 'SOURCE_PROCEDURE');
  assert.match(authority.description!, /선택 규칙/);
  assert.match(authority.description!, /PDF 13.*하나 이상.*PDF 18.*하나/);
});

test('invalid blessing selections stop real character execution before any random operation', (t) => {
  const random = t.mock.method(crypto, 'getRandomValues', () => {
    throw new Error('Invalid options must fail before rolling');
  });
  const uuid = t.mock.method(crypto, 'randomUUID', () => {
    throw new Error('Invalid options must fail before character allocation');
  });
  for (const characterMode of ['classless', 'chosen'] as const) {
    for (const invalid of [
      { reclvseBlessings: ['unpublished-boon'] },
      { reclvseBlessings: ['enhanced-fortitude', 'enhanced-fortitude'] },
      { reclvseBlessings: 'enhanced-fortitude' },
      { reclvseBlessings: [...RECLVSE_BLESSING_IDS, 'rapid-investment'] },
      { reclvseFortitude: 'd100' },
    ]) {
      assert.throws(
        () =>
          executeReference(entry, {
            ...baseOptions,
            characterMode,
            characterClassId: 'fanged-deserter',
            ...invalid,
            rng: () => {
              throw new Error('Invalid options must fail before supplied RNG');
            },
          } as ReferenceExecutionOptions),
        /RECLVSE 시작 축복 선택/,
      );
    }
  }
  assert.equal(random.mock.callCount(), 0);
  assert.equal(uuid.mock.callCount(), 0);
});

test('missing starting HP and repeated applications are rejected before any fortitude reroll', () => {
  const options: ReclvseBlessingOptions = {
    reclvseBlessings: ['enhanced-fortitude'],
    reclvseFortitude: '10+d4',
  };
  let calls = 0;
  const rng = () => {
    calls++;
    return 0;
  };
  for (const missing of [
    { ...originalReading(), blocks: [] },
    { ...originalReading(), oracle: undefined },
  ])
    assert.throws(
      () => applyReclvseStartingBlessings(missing, options, rng),
      /시작 HP/,
    );
  assert.equal(calls, 0);
  const changed = applyReclvseStartingBlessings(
    originalReading(),
    options,
    rng,
  );
  assert.equal(calls, 1);
  const before = structuredClone(changed);
  assert.throws(
    () => applyReclvseStartingBlessings(changed, options, rng),
    /다시 적용/,
  );
  assert.equal(calls, 1);
  assert.deepEqual(changed, before);
});

test('classless and chosen-class execution both apply only the explicitly selected HP replacement', (t) => {
  // The class generator uses the existing crypto source; only the optional d4
  // consumes ReferenceExecutionOptions.rng. Freeze both sources independently.
  t.mock.method(
    crypto,
    'getRandomValues',
    <T extends ArrayBufferView>(words: T) => {
      new Uint8Array(words.buffer, words.byteOffset, words.byteLength).fill(0);
      return words;
    },
  );
  for (const characterMode of ['classless', 'chosen'] as const) {
    const base = {
      ...baseOptions,
      characterMode,
      characterClassId: 'fanged-deserter',
      rng: () => 0,
    };
    const original = executeReference(entry, base)!;
    const fixed = executeReference(entry, {
      ...base,
      reclvseBlessings: ['enhanced-fortitude'],
    })!;
    assert.equal(hpBlock(fixed).text, '12');
    assert.equal(hpRoll(fixed).text, '12');
    assert.deepEqual(
      fixed.blocks.filter(
        (block) =>
          block.title !== 'HP' && !block.title.startsWith('Starting Blessing'),
      ),
      original.blocks.filter((block) => block.title !== 'HP'),
    );
    assert.equal(original.procedureInputs?.reclvseBlessings, undefined);
    const risk = executeReference(entry, {
      ...base,
      reclvseBlessings: ['enhanced-fortitude'],
      reclvseFortitude: '10+d4',
    })!;
    assert.equal(hpBlock(risk).text, '11');
    assert.deepEqual(hpRoll(risk).diceValues, [1]);
    if (characterMode === 'chosen') {
      assert.equal(risk.procedureInputs?.characterClassId, 'fanged-deserter');
      assert.equal(
        risk.blocks.find((block) => block.title === 'Class')?.text,
        'Fanged Deserter',
      );
    }
  }
});

test('the actual blessed HP and every selected condition survive Copy, Shelf and Replay snapshots', () => {
  const options: ReferenceExecutionOptions = {
    ...baseOptions,
    rng: () => 0.999999,
    reclvseBlessings: [...RECLVSE_BLESSING_IDS],
    reclvseFortitude: '10+d4',
  };
  const reading = executeReference(entry, options)!;
  assert.equal(hpBlock(reading).text, '14');
  const copied = copyReferenceReading(reading);
  const sourced = copyReferenceReading(reading, true);
  for (const blessing of RECLVSE_BLESSINGS) {
    assert.ok(copied.includes(blessing.description));
    assert.ok(sourced.includes(blessing.description));
  }
  assert.match(sourced, /RCL · PDF 13, 14/);
  const saved = objectFromReading(entry.id, reading);
  const shelf = validateObjectShelf(
    JSON.parse(JSON.stringify({ version: 1, objects: [saved] })),
  );
  assert.deepEqual(shelf.objects[0], saved);
  assert.equal(saved.sourceText, sourced);
  assert.match(saved.text, /HP[^\n]*\n14/);
  for (const blessing of RECLVSE_BLESSINGS)
    assert.ok(saved.text.includes(blessing.description), blessing.id);
  const replay = createReplay({
    kind: 'reference',
    referenceId: entry.id,
    title: reading.title,
    parameters: executionParametersSchema.parse(options),
    procedureInputs: reading.procedureInputs,
    results: [replayResult(entry.id, reading)],
  });
  const restored = replaySchema.parse(JSON.parse(JSON.stringify(replay)));
  assert.equal(copyReplay(restored), copied);
  assert.equal(copyReplay(restored, true), sourced);
  assert.equal(hpBlock(restored.results[0].reading).text, '14');
  assert.deepEqual(
    restored.results[0].rolls.find((roll) => roll.title === 'HP'),
    {
      origin: 'APP_ROLL',
      oracleId: 'reclvse.starting-blessings',
      entryId: null,
      title: 'HP',
      dice: '10+d4',
      roll: 14,
      diceValues: [4],
      text: '14',
      source: 'RECLVSE · PDF 13–14',
    },
  );
  assert.equal(
    restored.results[0].reading.procedureInputs?.reclvseBlessings,
    RECLVSE_BLESSING_IDS.join(','),
  );
});
