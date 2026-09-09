import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { parseOraclePack } from '../src/storage/oracleStore.ts';
import { parseRulesPack } from '../src/storage/rulesStore.ts';
import { rollOracle, rollProcedure } from '../src/generators/oracleRoller.ts';
import { refsForOracle } from '../src/domain/referenceExecution.ts';
import { validateOracleRegistry } from '../src/validation/oracleValidation.ts';
import {
  assertOracleRollHasSource,
  unresolvedOracleSources,
} from '../src/validation/oracleSourceIntegrity.ts';
import {
  buildReferenceRegistry,
  searchReferences,
  creatureReferenceId,
  findReferenceCreature,
} from '../src/domain/references.ts';
import { referenceAction } from '../src/domain/referenceActions.ts';
import { executeReference } from '../src/domain/referenceExecution.ts';
import { applyOracleSourceEvidence } from '../src/data/oracles/sourceEvidence.ts';
import type { OraclePack } from '../src/domain/oracle.ts';
import {
  REFERENCE_GENERATOR_PROCEDURES,
  validateReferenceGeneratorProcedures,
} from '../src/domain/referenceGeneratorProcedures.ts';
import { rollTravel } from '../src/domain/campaignProcedures.ts';
import { rollJourneyTable } from '../src/domain/journeyProcedure.ts';
const fixturePath =
  process.env.MORKBORG_PRIVATE_AUDIT_FIXTURE ??
  'outputs/morkborg-private-data.json';
const fixture = existsSync(fixturePath)
  ? JSON.parse(readFileSync(fixturePath, 'utf8'))
  : null;
const rules = fixture ? parseRulesPack(fixture.library) : null;
const extra = fixture ? parseOraclePack(fixture.oracles) : null;
const registry = buildOracleRegistry(rules, extra);
const local = (name: string, fn: () => void) =>
  test(name, { skip: !fixture }, fn);

local(
  'All currently installed canonical Oracle tables have independently audited source identities and unchanged English',
  () => {
    assert.deepEqual(unresolvedOracleSources(registry), []);
    assert.deepEqual(validateOracleRegistry(registry), []);
    assert.equal(registry.tables.length, 574);
  },
);
local(
  '10,000 seeded canonical rolls preserve exact English, resolvable source IDs and complete roll traces',
  () => {
    let seed = 0xdecafbad;
    const rng = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 2 ** 32;
    };
    const tables = registry.tables.filter(
      (table) =>
        table.sourceVerified &&
        table.rollable !== false &&
        !table.allowOverlap &&
        !table.entries.some((entry) => entry.sourceUnclear),
    );
    for (let index = 0; index < 10000; index++) {
      const table = tables[Math.floor(rng() * tables.length)];
      const roll = rollOracle(table, registry, rng);
      assertOracleRollHasSource(roll, registry);
      assert.equal(
        roll.text,
        table.entries.find((entry) => entry.id === roll.entryId)?.text ?? '',
      );
      const persisted = JSON.parse(JSON.stringify(roll));
      assert.deepEqual(
        persisted.metadata.provenance.sourceText,
        roll.metadata!.provenance!.sourceText,
      );
      assert.equal(
        persisted.metadata.provenance.rolls[0].entryId,
        roll.entryId,
      );
    }
  },
);
local(
  'Continued Core tables cite the actual result page rather than only their first page',
  () => {
    for (const [id, pages, face, page] of [
      ['core.rooms', [73, 74], 0.999, 74],
      ['core.sparks', [69, 70], 0.999, 70],
      ['core.contacts', [68, 69], 0.999, 69],
      ['core.unclean', [34, 35], 0.999, 35],
    ] as const) {
      const table = registry.tables.find((candidate) => candidate.id === id)!;
      assert.deepEqual(table.sourcePage, pages);
      assert.deepEqual(rules!.tables[id].pages, pages);
      if (table.rollable === false) {
        assert.throws(() => rollOracle(table, registry, () => face));
        assert.equal(table.entries.at(-1)!.metadata!.pdfPage, page);
      } else {
        const roll = rollOracle(table, registry, () => face);
        assert.equal(roll.metadata!.provenance!.sourceRefs[0].pdfPage, page);
      }
    }
  },
);
local('A reroll changes text, entry, die trace and provenance together', () => {
  const table = registry.tables.find(
    (candidate) => candidate.id === 'core.reaction',
  )!;
  const before = rollOracle(table, registry, () => 0);
  const after = rollOracle(table, registry, () => 0.999);
  assert.notEqual(before.entryId, after.entryId);
  assert.notEqual(before.text, after.text);
  assert.equal(
    after.metadata!.provenance!.sourceRefs[0].entryId,
    after.entryId,
  );
  assert.equal(after.metadata!.provenance!.rolls![0].value, after.roll);
  assertOracleRollHasSource(after, registry);
});
local(
  'Canonical campsite dream subtable is registered once and keeps its printed row/source',
  () => {
    const tables = registry.tables.filter(
      (table) => table.id === 'feretory.campsite.campDream',
    );
    assert.equal(tables.length, 1);
    const roll = rollOracle(tables[0], registry, () => 0.999);
    assert.equal(roll.oracleId, 'feretory.campsite.campDream');
    assertOracleRollHasSource(roll, registry);
    assert.equal(
      refsForOracle({ id: 'test', title: 'Dream', rolls: [roll] }, registry)[0]
        .pdfPage,
      9,
    );
  },
);
local(
  'Parser retains original procedure source pages and groups; registry documents all ordered steps',
  () => {
    const procedure = extra!.procedures.find(
      (candidate) => candidate.id === 'mythic2.the-4w',
    )!;
    assert.equal(procedure.sourcePage, 66);
    assert.equal(procedure.printedPage, 65);
    assert.deepEqual(
      procedure.steps?.map((step) => step.label),
      ['Who', 'What', 'Where', 'Why'],
    );
    for (const procedure of registry.procedures) {
      assert(procedure.sourceRefs?.length);
      assert(procedure.generatorSteps?.length);
      for (const step of procedure.generatorSteps!)
        if (step.tableId)
          assert(registry.tables.some((table) => table.id === step.tableId));
    }
  },
);
local(
  'Source-defined city, travel and camping procedures explicitly document conditional steps and exact canonical tables',
  () => {
    assert.deepEqual(validateReferenceGeneratorProcedures(registry), []);
    assert.equal(REFERENCE_GENERATOR_PROCEDURES.length, 6);
    assert(
      REFERENCE_GENERATOR_PROCEDURES.every(
        (procedure) => procedure.sourceRefs.length && procedure.steps.length,
      ),
    );
  },
);
local(
  'Standalone campsite follows the same canonical dream branch while individual weather never claims a nonexistent procedure',
  () => {
    let calls = 0;
    const result = rollTravel('camp', registry, () =>
      calls++ === 0 ? 9.5 / 12 : 0,
    );
    assert.deepEqual(
      result.rolls.map((roll) => roll.oracleId),
      ['feretory.campsite', 'feretory.campsite.campDream'],
    );
    assert(
      result.rolls.every(
        (roll) =>
          roll.metadata?.provenance?.procedureId === 'feretory.campsite',
      ),
    );
    assert.equal(
      rollJourneyTable('core.weather', registry, () => 0).rolls[0].metadata
        ?.provenance?.procedureId,
      undefined,
    );
  },
);
local(
  'Procedure derived statistics preserve their calculation source and never claim a verbatim table row',
  () => {
    const result = rollProcedure(
      {
        id: 'feretory.monster-approaches',
        title: 'Monster',
        oracleIds: ['feretory.A', 'feretory.B', 'feretory.C'],
      },
      registry,
      () => 0.3,
    );
    const derived = result.rolls.at(-1)!;
    assert.equal(derived.metadata!.provenance!.classification, 'APP_DERIVED');
    assert.equal(derived.metadata!.provenance!.rolls!.length, 4);
    assert.match(derived.metadata!.provenance!.sourceRefs[0].note!, /HP:/);
    assertOracleRollHasSource(derived, registry);
  },
);
local(
  'Unknown or modified source data is PARTIAL until an independent source audit confirms it',
  () => {
    const table = registry.tables.find(
      (candidate) => candidate.id === 'core.reaction',
    )!;
    const modified = structuredClone(table);
    modified.entries[0].text = 'Changed source text';
    const checked = applyOracleSourceEvidence(modified);
    assert.equal(checked.sourceStatus, 'PARTIAL');
    const result = rollOracle(
      checked,
      { ...registry, tables: [checked] },
      () => 0,
    );
    assert.equal(result.metadata!.provenance!.status, 'PARTIAL');
    assert(
      unresolvedOracleSources({ ...registry, tables: [checked] }).some(
        (error) => /changed/.test(error),
      ),
    );
  },
);
local(
  'Source evidence includes English follow-ups, mechanics and page coordinates but ignores secondary Korean edits',
  () => {
    const table = registry.tables.find(
      (candidate) => candidate.id === 'core.rooms',
    )!;
    const translated = structuredClone(table);
    translated.entries[0].metadata!.ko = '번역만 수정';
    assert.equal(
      applyOracleSourceEvidence(translated).sourceStatus,
      'VERIFIED',
    );
    const changed = structuredClone(table);
    changed.entries[0].metadata!.followup = [
      { text: 'Changed source child', weight: 1, meta: {} },
    ];
    assert.equal(applyOracleSourceEvidence(changed).sourceStatus, 'PARTIAL');
    const wrongPage = structuredClone(table);
    wrongPage.sourcePage = 999;
    assert.equal(applyOracleSourceEvidence(wrongPage).sourceStatus, 'PARTIAL');
  },
);
local(
  'Requested play searches return the direct canonical tool or concise quick rule first',
  () => {
    const index = buildReferenceRegistry(registry, rules);
    const expected: Record<string, string> = {
      reaction: 'oracle:core.reaction',
      morale: 'rule:core.reaction-morale',
      broken: 'rule:core.broken',
      corpse: 'oracle:core.corpsePlundering',
      treasure: 'oracle:core.treasures',
      'useful item': 'oracle:sd.usefulItems',
      'Sarkash monster': 'rule:regional-monsters:sarkash',
      'Kergüs monster': 'rule:regional-monsters:kergus',
      'Graven-Tosk': 'region:graven-tosk',
      room: 'oracle:sd.room.contents',
      NPC: 'procedure:workbench.npc',
      armor: 'rule:core.armor-shield',
      rest: 'rule:core.rest',
      Omens: 'rule:core.omens',
      Miseries: 'oracle:core.miseries',
      travel: 'rule:sd.travel-day',
    };
    for (const [query, id] of Object.entries(expected)) {
      const found = searchReferences(index, query)[0];
      assert.equal(found.id, id, query);
      assert(found.available, query);
      assert(found.action, query);
      assert(referenceAction(found).label, query);
    }
  },
);
local(
  'Grift EPK source-only face remains a canonical creature reference without invented stats',
  () => {
    const record = rules!.creatures.find(
      (candidate) =>
        candidate.book === 'feretory' &&
        candidate.regionKey === 'grift' &&
        candidate.roll === 5,
    )!;
    const id = creatureReferenceId(record);
    assert.equal(findReferenceCreature(rules, id), record);
    const index = buildReferenceRegistry(registry, rules);
    const entry = index.byId[id];
    assert(entry);
    const result = executeReference(entry, {
      registry,
      rules,
      region: 'grift',
      stockKind: 'common',
      stockDR: 10,
      cityLarge: false,
      cityExits: false,
    });
    assert(result);
    assert.match(result.blocks[0].text, /SOURCE UNAVAILABLE/);
    assert.doesNotMatch(result.blocks[0].text, /HP \d|Morale \d/);
  },
);
test('Validation rejects missing conditional follow-up tables and divergent procedure groups', () => {
  const sample: OraclePack = {
    schemaVersion: 1,
    books: [{ id: 'test', title: 'Test' }],
    tables: [
      {
        id: 'test.table',
        sourceBookId: 'test',
        sourcePage: 1,
        sourceVerified: true,
        title: 'Test',
        category: 'OTHER',
        dice: 'd2',
        tags: [],
        entries: [
          {
            id: 'test:1',
            min: 1,
            max: 2,
            text: 'Fixture',
            metadata: { followUpOracleIds: ['missing'] },
          },
        ],
      },
    ],
    procedures: [
      {
        id: 'test.procedure',
        title: 'Pair',
        oracleIds: ['test.table'],
        steps: [{ label: 'Wrong', oracleIds: ['missing'] }],
      },
    ],
  };
  const issues = validateOracleRegistry(buildOracleRegistry(null, sample));
  assert(issues.some((issue) => /missing canonical follow-up/.test(issue)));
  assert(issues.some((issue) => /diverge/.test(issue)));
});
