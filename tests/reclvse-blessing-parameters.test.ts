import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { parseRulesPack } from '../src/storage/rulesStore.ts';
import { parseOraclePack } from '../src/storage/oracleStore.ts';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { buildReferenceRegistry } from '../src/domain/references.ts';
import {
  executeReference,
  type ReferenceExecutionOptions,
} from '../src/domain/referenceExecution.ts';
import type { ReferenceReading } from '../src/domain/referenceReading.ts';
import {
  useReferenceConvenience,
  type ReferenceConvenience,
} from '../src/components/useReferenceConvenience.ts';
import {
  executionParametersSchema,
  emptyPlaySession,
  readPlaySession,
  writePlaySession,
} from '../src/storage/conveniencePreferences.ts';
import {
  createReplay,
  replayResult,
  replaySchema,
  replayParameterLines,
} from '../src/domain/rollReplay.ts';
import { RECLVSE_BLESSING_IDS } from '../src/domain/reclvseStartingBlessings.ts';

const rules = parseRulesPack(
  JSON.parse(readFileSync('public/rules/library.json', 'utf8')),
);
const registry = buildOracleRegistry(
  rules,
  parseOraclePack(
    JSON.parse(readFileSync('public/rules/oracles.json', 'utf8')),
  ),
);
const index = buildReferenceRegistry(registry, rules);
const baseOptions: ReferenceExecutionOptions = {
  registry,
  rules,
  region: 'sarkash',
  stockKind: 'common',
  stockDR: 10,
  cityLarge: false,
  cityExits: true,
};

/** Capture the real hook's parameter projection; no simulated copy of its field list. */
function captureConvenience(
  overrides: Partial<ReferenceExecutionOptions> = {},
  accept: (id: string, reading: ReferenceReading) => void = () => {},
) {
  let captured!: ReferenceConvenience;
  function Probe() {
    const convenience = useReferenceConvenience({
      index,
      registry,
      options: { ...baseOptions, ...overrides },
      readings: {},
      accept,
      open: () => {},
      notify: () => {},
      onDeck: () => {},
      restoreParameters: () => {},
      onRecipeResolved: () => {},
      onRecipeEdited: () => {},
    });
    captured = convenience;
    return null;
  }
  renderToStaticMarkup(createElement(Probe));
  return captured;
}
const parameterProjection = (
  overrides: Partial<ReferenceExecutionOptions> = {},
) => captureConvenience(overrides).parameters;

test('RECLVSE blessings stay optional in historical parameters and reject invalid selections', () => {
  const original = executionParametersSchema.parse({ region: 'sarkash' });
  assert.equal(Object.hasOwn(original, 'reclvseBlessings'), false);
  assert.equal(Object.hasOwn(original, 'reclvseFortitude'), false);
  assert.deepEqual(executionParametersSchema.parse(original), original);
  assert.deepEqual(
    executionParametersSchema.parse({
      reclvseBlessings: [...RECLVSE_BLESSING_IDS],
      reclvseFortitude: '10+d4',
    }).reclvseBlessings,
    RECLVSE_BLESSING_IDS,
  );
  assert.deepEqual(
    executionParametersSchema.parse({ reclvseBlessings: [] }).reclvseBlessings,
    [],
  );
  for (const invalid of [
    { reclvseBlessings: ['unpublished-blessing'] },
    { reclvseBlessings: ['rapid-investment', 'rapid-investment'] },
    { reclvseBlessings: [...RECLVSE_BLESSING_IDS, 'rapid-investment'] },
    { reclvseFortitude: 'unpublished-mode' },
  ])
    assert.equal(executionParametersSchema.safeParse(invalid).success, false);
});

test('live parameter projection retains chosen blessings and an explicit empty selection clears them', () => {
  const project = parameterProjection({
    reclvseBlessings: ['rapid-investment', 'enhanced-fortitude'],
    reclvseFortitude: '10+d4',
  });
  const current = project();
  assert.deepEqual(current.reclvseBlessings, [
    'rapid-investment',
    'enhanced-fortitude',
  ]);
  assert.equal(current.reclvseFortitude, '10+d4');
  const next = project({
    reclvseBlessings: [],
    reclvseFortitude: 'fixed12',
  });
  assert.deepEqual(next.reclvseBlessings, []);
  assert.equal(next.reclvseFortitude, 'fixed12');
  assert.deepEqual(current.reclvseBlessings, [
    'rapid-investment',
    'enhanced-fortitude',
  ]);
});

test('Last Roll and Replay preserve blessing parameters through their real storage schemas', () => {
  const project = parameterProjection({
    characterMode: 'chosen',
    characterClassId: 'esoteric-hermit',
    reclvseBlessings: ['enhanced-fortitude', 'legacy-sacrifice'],
    reclvseFortitude: 'fixed12',
  });
  const parameters = project();
  const referenceId = 'procedure:character.core-classless';
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
  const session = {
    ...emptyPlaySession(),
    lastRoll: {
      kind: 'reference' as const,
      id: referenceId,
      mode: 'APP_ROLL' as const,
      parameters,
    },
  };
  writePlaySession(session, storage);
  const restored = readPlaySession(storage).lastRoll!;
  assert.deepEqual(restored.parameters.reclvseBlessings, [
    'enhanced-fortitude',
    'legacy-sacrifice',
  ]);
  assert.equal(restored.parameters.reclvseFortitude, 'fixed12');
  const replay = createReplay({
    kind: 'reference',
    referenceId,
    title: 'Saved character fixture',
    parameters: restored.parameters,
    procedureInputs: {
      reclvseBlessings: parameters.reclvseBlessings!.join(','),
      reclvseFortitude: 'fixed12',
    },
    results: [
      replayResult(referenceId, {
        title: 'Saved character fixture',
        sourceRefs: [],
        blocks: [{ title: 'Name', text: 'Fixture' }],
      }),
    ],
  });
  const parsed = replaySchema.parse(JSON.parse(JSON.stringify(replay)));
  assert.deepEqual(
    parsed.parameters.reclvseBlessings,
    parameters.reclvseBlessings,
  );
  assert.equal(parsed.parameters.reclvseFortitude, 'fixed12');
  assert.equal(parsed.parameters.characterMode, 'chosen');
  assert.equal(parsed.parameters.characterClassId, 'esoteric-hermit');
  const reapplied = parameterProjection()(parsed.parameters);
  assert.deepEqual(reapplied.reclvseBlessings, parameters.reclvseBlessings);
  assert.equal(reapplied.reclvseFortitude, 'fixed12');
  assert.deepEqual(replayParameterLines(parsed, index), [
    [
      'RECLVSE 시작 축복',
      'Enhanced Fortitude · 강화된 강인함, Legacy Sacrifice · 유산의 희생',
    ],
    ['강화된 강인함 · 시작 HP', '12 고정'],
  ]);
});

test('rerolling a historical Last Roll cannot inherit a currently selected blessing', () => {
  const referenceId = 'procedure:character.core-classless';
  const rng = () => 0.25;
  const expected = executeReference(index.byId[referenceId], {
    ...baseOptions,
    rng,
  })!;
  let accepted: ReferenceReading | undefined;
  const convenience = captureConvenience(
    {
      reclvseBlessings: ['enhanced-fortitude'],
      reclvseFortitude: 'fixed12',
      rng,
    },
    (_id, reading) => {
      accepted = reading;
    },
  );
  const historical = {
    kind: 'reference' as const,
    id: referenceId,
    mode: 'APP_ROLL' as const,
    parameters: executionParametersSchema.parse({}),
  };
  const unchanged = structuredClone(historical);
  convenience.rerollLast(historical);
  assert.ok(accepted, 'the actual Last Roll path generates a new reading');
  assert.deepEqual(accepted.blocks, expected.blocks);
  assert.deepEqual(
    historical,
    unchanged,
    'stored historical input stays intact',
  );
});

test('rerolling a saved fortitude selection uses its original default instead of the current control', () => {
  const referenceId = 'procedure:character.core-classless';
  const rng = () => 0.25;
  const expected = executeReference(index.byId[referenceId], {
    ...baseOptions,
    rng,
    reclvseBlessings: ['enhanced-fortitude'],
    reclvseFortitude: 'fixed12',
  })!;
  let accepted: ReferenceReading | undefined;
  const convenience = captureConvenience(
    {
      reclvseBlessings: ['enhanced-fortitude'],
      reclvseFortitude: '10+d4',
      rng,
    },
    (_id, reading) => {
      accepted = reading;
    },
  );
  convenience.rerollLast({
    kind: 'reference',
    id: referenceId,
    mode: 'APP_ROLL',
    parameters: executionParametersSchema.parse({
      reclvseBlessings: ['enhanced-fortitude'],
    }),
  });
  assert.ok(accepted, 'the actual Last Roll path generates a new reading');
  assert.deepEqual(accepted.blocks, expected.blocks);
});
