import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import type {
  GeneratedValueProvenance,
  GeneratorProcedure,
} from '../src/domain/generationProvenance.ts';
import type { OracleRegistry } from '../src/domain/oracle.ts';
import {
  setRules,
  getRules,
  type RulesPack,
} from '../src/storage/rulesStore.ts';
import { setOraclePack, getOraclePack } from '../src/storage/oracleStore.ts';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import {
  createGenerationValidationContext,
  assertGeneratedValueHasSource,
  enumerateGeneratedFields,
  generationIntegrityReport,
  validateGeneratedValue,
  validateGeneratorProcedures,
} from '../src/validation/generationValidation.ts';
import { validateOracleRegistry } from '../src/validation/oracleValidation.ts';
import { unresolvedOracleSources } from '../src/validation/oracleSourceIntegrity.ts';
import { DUNGEON_PROCEDURES } from '../src/generators/dungeonProcedures.ts';
import { CREATURE_PROCEDURES } from '../src/generators/creatureProvenance.ts';
import { buildCharacterProcedures } from '../src/generators/characterClasses.ts';
import { createDungeonCandidate } from '../src/generators/index.ts';
import {
  generateMonster,
  generateEatPreyKillMonster,
} from '../src/generators/monster.ts';
import { generateCharacter } from '../src/generators/character.ts';
import { createNPC, createEncounter } from '../src/generators/content.ts';
import { rollOracle } from '../src/generators/oracleRoller.ts';
import { validateCampaign } from '../src/storage/schema.ts';
import { createCampaign } from '../src/generators/index.ts';
import { REFERENCE_GENERATOR_PROCEDURES } from '../src/domain/referenceGeneratorProcedures.ts';
import { rollTravel } from '../src/domain/campaignProcedures.ts';
import { rollCityReference } from '../src/domain/cityReference.ts';
import { rollJourneyTable } from '../src/domain/journeyProcedure.ts';

const registry: OracleRegistry = {
  books: [{ id: 'fixture', title: 'Test source' }],
  procedures: [],
  tables: [
    {
      id: 'fixture.table',
      title: 'Test table',
      sourceBookId: 'fixture',
      sourcePage: 1,
      dice: 'd2',
      category: 'OTHER',
      tags: [],
      sourceVerified: true,
      entries: [
        {
          id: 'fixture.table:1-1',
          min: 1,
          max: 1,
          text: 'First',
          metadata: { ko: '첫째' },
        },
        { id: 'fixture.table:2-2', min: 2, max: 2, text: 'Second' },
      ],
    },
  ],
};
const rules: RulesPack = {
  schemaVersion: 1,
  books: [
    {
      id: 'fixture',
      title: 'Test source',
      fileName: 'fixture',
      status: 'loaded',
    },
  ],
  tables: {},
  creatures: [],
  outcasts: [],
  notes: {},
};
const procedures: GeneratorProcedure[] = [
  {
    id: 'fixture.procedure',
    title: 'Test procedure',
    sourceRefs: [{ bookId: 'fixture', pdfPage: 1 }],
    steps: [{ id: 'test', tableId: 'fixture.table', dice: 'd2', count: 1 }],
  },
];
const context = createGenerationValidationContext(registry, rules, procedures);
const valid = (): GeneratedValueProvenance => ({
  classification: 'SOURCE_VERBATIM',
  origin: 'source',
  status: 'VERIFIED',
  sourceRefs: [
    {
      bookId: 'fixture',
      tableId: 'fixture.table',
      pdfPage: 1,
      entryId: 'fixture.table:1-1',
    },
  ],
  sourceText: ['First'],
  rolls: [
    {
      tableId: 'fixture.table',
      dice: 'd2',
      value: 1,
      diceValues: [1],
      entryId: 'fixture.table:1-1',
    },
  ],
  transformation: 'none',
});
test('source assertions accept a canonical entry and fail on absent provenance or a missing source reference', () => {
  assert.doesNotThrow(() =>
    assertGeneratedValueHasSource('First', valid(), context),
  );
  assert.throws(
    () => assertGeneratedValueHasSource('Mystery', undefined, context),
    /missing-provenance/,
  );
  assert.throws(
    () =>
      assertGeneratedValueHasSource(
        'First',
        { ...valid(), sourceRefs: [] },
        context,
      ),
    /missing-source-reference/,
  );
});
test('source assertions reject wrong book, page, table and entry identities', () => {
  for (const [field, value, code] of [
    ['bookId', 'other', 'unknown-book'],
    ['pdfPage', 999, 'source-page-mismatch'],
    ['tableId', 'missing', 'unknown-source-id'],
    ['entryId', 'missing', 'unknown-entry-id'],
  ] as const) {
    const p = valid();
    Object.assign(p.sourceRefs[0], { [field]: value });
    assert.throws(
      () => assertGeneratedValueHasSource('First', p, context),
      new RegExp(code),
    );
  }
});
test('Korean never replaces canonical English and invented composed fragments cannot borrow a valid source ID', () => {
  assert.throws(
    () => assertGeneratedValueHasSource('첫째', valid(), context),
    /verbatim-display-mismatch/,
  );
  assert.throws(
    () =>
      assertGeneratedValueHasSource(
        'First',
        { ...valid(), sourceText: ['첫째'] },
        context,
      ),
    /canonical-source-text-mismatch/,
  );
  assert.throws(
    () =>
      assertGeneratedValueHasSource(
        'Atmospheric invented phrase',
        {
          ...valid(),
          classification: 'SOURCE_COMPOSED',
          sourceText: ['Atmospheric invented phrase'],
          transformation: 'Join fragments',
        },
        context,
      ),
    /unresolved-composed-fragment/,
  );
});
test('source-edited and manual values cannot claim verbatim source; historical missing references do not erase them', () => {
  assert.throws(
    () =>
      assertGeneratedValueHasSource(
        'Edited',
        { ...valid(), origin: 'source-edited' },
        context,
      ),
    /false-verbatim-after-edit/,
  );
  const edited: GeneratedValueProvenance = {
    ...valid(),
    classification: 'USER_AUTHORED',
    origin: 'source-edited',
    sourceRefs: [{ tableId: 'removed-legacy-source' }],
  };
  assert.doesNotThrow(() =>
    assertGeneratedValueHasSource('Edited', edited, context),
  );
  assert.deepEqual(edited.sourceText, ['First']);
});
test('structural identifiers are a narrow documented exception, never a free-form unsourced fallback', () => {
  const structural: GeneratedValueProvenance = {
    classification: 'APP_DERIVED',
    origin: 'source',
    status: 'VERIFIED',
    sourceRefs: [],
    procedureId: 'app.structural-identifier',
    transformation: 'ROOM plus numeric slot.',
  };
  assert.doesNotThrow(() =>
    assertGeneratedValueHasSource('ROOM 01', structural, context),
  );
  assert.throws(
    () =>
      assertGeneratedValueHasSource(
        'Unexplained gothic filler',
        structural,
        context,
      ),
    /invalid-structural-identifier/,
  );
  assert.throws(
    () =>
      assertGeneratedValueHasSource(
        'Mystery title',
        { ...structural, procedureId: 'unknown-fallback' },
        context,
      ),
    /unknown-procedure/,
  );
  assert.throws(
    () =>
      assertGeneratedValueHasSource(
        'Mystery',
        { ...valid(), classification: 'UNSOURCED' },
        context,
      ),
    /unsourced-production-value/,
  );
});
test('dice values and canonical entry mapping are checked independently', () => {
  const p = valid();
  p.rolls![0].value = 2;
  p.rolls![0].diceValues = [2];
  assert.throws(
    () => assertGeneratedValueHasSource('First', p, context),
    /roll-entry-mismatch/,
  );
  p.rolls![0].value = 3;
  p.rolls![0].diceValues = [3];
  assert.throws(
    () => assertGeneratedValueHasSource('First', p, context),
    /invalid-dice-range/,
  );
});
test('procedure references require source pages and documented steps; missing tables/counts/dependencies fail', () => {
  assert.deepEqual(validateGeneratorProcedures(context), []);
  const bad = createGenerationValidationContext(registry, rules, [
    {
      ...procedures[0],
      steps: [
        {
          id: 'missing',
          tableId: 'unknown',
          count: 0,
          dependsOn: ['not-yet-defined'],
        },
      ],
    },
  ]);
  const codes = validateGeneratorProcedures(bad).map((issue) => issue.code);
  assert.ok(codes.includes('unknown-procedure-table'));
  assert.ok(codes.includes('invalid-step-count'));
  assert.ok(codes.includes('invalid-procedure-dependency'));
  assert.throws(
    () =>
      assertGeneratedValueHasSource(
        3,
        {
          ...valid(),
          classification: 'APP_DERIVED',
          sourceRefs: [{ bookId: 'fixture', pdfPage: 1 }],
        },
        context,
      ),
    /undocumented-rule-reference/,
  );
});
test('unknown generated fields are enumerated alongside correctly sourced fields; UI metadata is not fictional output', () => {
  const fields = enumerateGeneratedFields({
    name: 'First',
    fallbackDescription: 'Unexplained',
    fieldProvenance: { name: valid() },
    id: 'record',
    createdAt: 'now',
    region: 'sarkash',
  });
  assert.equal(fields.length, 2);
  const report = generationIntegrityReport(
    {
      name: 'First',
      fallbackDescription: 'Unexplained',
      fieldProvenance: { name: valid() },
    },
    context,
  );
  assert.equal(report.counts.UNSOURCED, 1);
  assert.equal(report.unresolved[0].path, 'Generated.fallbackDescription');
});
test('PARTIAL and CONFLICT stay explicit warnings and are never counted as verified source text', () => {
  for (const status of ['PARTIAL', 'CONFLICT'] as const) {
    const warnings = validateGeneratedValue(
      'First',
      { ...valid(), status },
      context,
    );
    assert.ok(
      warnings.some(
        (issue) =>
          issue.severity === 'warning' &&
          issue.code === `source-${status.toLowerCase()}`,
      ),
    );
    assert.equal(
      warnings.filter((issue) => issue.severity === 'error').length,
      0,
    );
  }
});

const fixturePath =
  process.env.MORKBORG_PRIVATE_AUDIT_FIXTURE ??
  'outputs/morkborg-private-data.json';
const hasFixture = existsSync(fixturePath);
function installed() {
  const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));
  setRules(fixture.library);
  setOraclePack(fixture.oracles);
  const rules = getRules()!,
    registry = buildOracleRegistry(rules, getOraclePack());
  return createGenerationValidationContext(registry, rules, [
    ...DUNGEON_PROCEDURES,
    ...CREATURE_PROCEDURES,
    ...buildCharacterProcedures(),
    ...REFERENCE_GENERATOR_PROCEDURES,
  ]);
}
test(
  'installed canonical registry and every generator procedure pass source/range checks before production samples',
  { skip: !hasFixture },
  () => {
    const context = installed();
    assert.deepEqual(validateOracleRegistry(context.registry), []);
    assert.deepEqual(unresolvedOracleSources(context.registry), []);
    assert.deepEqual(validateGeneratorProcedures(context), []);
  },
);
test(
  '10,000 mixed source-backed generation passes contain no unexplained field, unknown source, invalid die or bad procedure',
  { skip: !hasFixture },
  () => {
    const context = installed();
    const table = context.tables.get('core.rooms')!;
    for (let pass = 0; pass < 10_000; pass++) {
      const sample = [
        () => createDungeonCandidate('integrity-test', 'sarkash'),
        () =>
          generateCharacter(
            'integrity-test',
            false,
            pass % 2 ? 'random' : 'classless',
          ),
        () => generateMonster('integrity-test'),
        () => createNPC('integrity-test', 'sarkash'),
        () =>
          createEncounter(
            'integrity-test',
            'grift',
            pass % 2 ? 'rare' : 'common',
            10,
          ),
        () => generateEatPreyKillMonster('integrity-test', 'sarkash'),
        () => rollOracle(table, context.registry),
      ][pass % 7]();
      const report = generationIntegrityReport(sample, context);
      assert.equal(report.counts.UNSOURCED, 0, `pass ${pass}`);
      assert.deepEqual(report.unresolved, [], `pass ${pass}`);
    }
  },
);
test(
  'current campaign JSON preserves generated references and source origin through validation',
  { skip: !hasFixture },
  () => {
    const context = installed();
    const campaign = createCampaign('Isolated source roundtrip');
    campaign.dungeons.push(createDungeonCandidate(campaign.id, 'sarkash'));
    campaign.characters.push(generateCharacter(campaign.id));
    campaign.monsters.push(generateMonster(campaign.id));
    campaign.npcs.push(createNPC(campaign.id));
    campaign.encounters.push(createEncounter(campaign.id));
    const restored = validateCampaign(JSON.parse(JSON.stringify(campaign)));
    for (const key of [
      'dungeons',
      'characters',
      'monsters',
      'npcs',
      'encounters',
    ] as const) {
      assert.deepEqual(restored[key], campaign[key]);
      assert.deepEqual(
        generationIntegrityReport(restored[key], context, key).unresolved,
        [],
      );
    }
  },
);
test(
  'real travel and city procedure wrappers retain valid explicit steps and generated provenance',
  { skip: !hasFixture },
  () => {
    const context = installed();
    const { registry } = context;
    assert.deepEqual(
      context.procedures.get('aitc.street')?.steps,
      REFERENCE_GENERATOR_PROCEDURES.find((p) => p.id === 'aitc.street')!.steps,
    );
    for (const rng of [() => 0, () => 0.999999]) {
      const results = [
        ...(['road', 'forage', 'camp', 'off-road'] as const).map((action) =>
          rollTravel(action, registry, rng),
        ),
        rollJourneyTable('feretory.campsite', registry, rng),
        rollJourneyTable('core.weather', registry, rng),
        rollCityReference(
          {
            procedureId: 'aitc.street',
            cityOrMetropolis: true,
            includeExits: true,
          },
          registry,
          rng,
        ),
        rollCityReference(
          { procedureId: 'aitc.notable-artefact-type' },
          registry,
          rng,
        ),
      ];
      for (const result of results)
        assert.deepEqual(
          generationIntegrityReport(result.rolls, context).unresolved,
          [],
          result.title,
        );
    }
  },
);
