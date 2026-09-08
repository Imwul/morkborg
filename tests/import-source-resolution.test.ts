import test from 'node:test';
import assert from 'node:assert/strict';
import type {
  GeneratedValueProvenance,
  GeneratorProcedure,
} from '../src/domain/generationProvenance.ts';
import type { OracleRegistry } from '../src/domain/oracle.ts';
import type { RulesPack } from '../src/storage/rulesStore.ts';
import { createGenerationValidationContext } from '../src/validation/generationValidation.ts';
import { markUnresolvedImportedSources } from '../src/storage/importProvenance.ts';
import { creatureReferenceId } from '../src/domain/references.ts';

const tableId = 'test.rooms',
  rootId = 'test.rooms:1-1';
const registry: OracleRegistry = {
  books: [{ id: 'test', title: 'Test source' }],
  procedures: [],
  tables: [
    {
      id: tableId,
      title: 'Test room table',
      sourceBookId: 'test',
      sourcePage: 2,
      dice: 'd6',
      category: 'ROOM',
      tags: [],
      sourceVerified: true,
      entries: [
        {
          id: rootId,
          min: 1,
          max: 6,
          text: 'Test source row',
          metadata: {
            followup: [
              { text: 'Test child row', weight: 1, meta: { roll: 1 } },
            ],
          },
        },
      ],
    },
  ],
};
const rule: GeneratorProcedure = {
  id: 'test.mechanical-rule',
  title: 'Documented numeric rule',
  sourceRefs: [{ bookId: 'test', pdfPage: 3 }],
  steps: [
    { id: 'quantity', dice: 'd6', count: 1, derived: 'Use the rolled number.' },
  ],
};
const creature = {
  id: 'test.creature',
  name: 'Test Creature',
  book: 'test',
  pdfPage: 4,
  hp: 1,
};
const rules: RulesPack = {
  schemaVersion: 1,
  books: [],
  tables: {},
  creatures: [creature],
  outcasts: [],
  notes: {},
};
const context = createGenerationValidationContext(registry, rules, [rule]);
const p = (): GeneratedValueProvenance => ({
  classification: 'SOURCE_VERBATIM',
  origin: 'source',
  status: 'VERIFIED',
  sourceRefs: [{ bookId: 'test', tableId, pdfPage: 2, entryId: rootId }],
  sourceText: ['Saved original text'],
  rolls: [{ tableId, dice: 'd6', value: 1, entryId: rootId }],
});
function saved(provenance = p()) {
  return {
    text: 'Saved current text',
    notes: 'Keep handwritten note',
    provenance,
  };
}

test('Import marks removed rows under a surviving table without replacing saved text, rolls or manual origins', () => {
  const item = saved();
  item.provenance.origin = 'source-edited';
  item.provenance.classification = 'USER_AUTHORED';
  item.provenance.sourceRefs[0].entryId = 'test.rooms:removed';
  const snapshot = structuredClone(item);
  markUnresolvedImportedSources(item, context);
  assert.equal(item.provenance.status, 'UNAVAILABLE');
  assert.deepEqual(item.provenance.unresolvedSourceIds, ['test.rooms:removed']);
  assert.equal(item.text, snapshot.text);
  assert.equal(item.notes, snapshot.notes);
  assert.equal(item.provenance.origin, 'source-edited');
  assert.equal(item.provenance.classification, 'USER_AUTHORED');
  assert.deepEqual(item.provenance.sourceText, snapshot.provenance.sourceText);
  assert.deepEqual(item.provenance.rolls, snapshot.provenance.rolls);
});
test('Import resolves actual inline follow-up coordinates and flags removed child rows independently', () => {
  const item = saved();
  item.provenance.sourceRefs[0].entryId = rootId + '/followup:1-1';
  item.provenance.rolls![0].entryId = rootId + '/followup:1-1';
  markUnresolvedImportedSources(item, context);
  assert.equal(item.provenance.status, 'VERIFIED');
  item.provenance.rolls![0].entryId = rootId + '/followup:2-2';
  markUnresolvedImportedSources(item, context);
  assert.equal(item.provenance.status, 'UNAVAILABLE');
  assert.deepEqual(item.provenance.unresolvedSourceIds, [
    rootId + '/followup:2-2',
  ]);
});
test('Import checks procedure IDs and every roll source even when primary source references still resolve', () => {
  const item = saved();
  item.provenance.procedureId = 'removed.procedure';
  item.provenance.rolls!.push({
    tableId: 'removed.followup',
    dice: 'd6',
    value: 1,
  });
  markUnresolvedImportedSources(item, context);
  assert.deepEqual(item.provenance.unresolvedSourceIds, [
    'removed.procedure',
    'removed.followup',
  ]);
  const wrongKind = saved();
  wrongKind.provenance.procedureId = tableId;
  markUnresolvedImportedSources(wrongKind, context);
  assert.deepEqual(wrongKind.provenance.unresolvedSourceIds, [tableId]);
});
test('Documented page-only rules and procedure-derived rolls remain valid; structural IDs need no fictional table', () => {
  const item = saved({
    classification: 'APP_DERIVED',
    origin: 'source',
    status: 'VERIFIED',
    sourceRefs: [{ bookId: 'test', pdfPage: 3 }],
    procedureId: rule.id,
    rolls: [{ tableId: rule.id, dice: 'd6', value: 2 }],
    transformation: 'Use the source number.',
  });
  markUnresolvedImportedSources(item, context);
  assert.equal(item.provenance.status, 'VERIFIED');
  const neutral = saved({
    classification: 'APP_DERIVED',
    origin: 'source',
    status: 'VERIFIED',
    sourceRefs: [],
    procedureId: 'app.structural-identifier',
    transformation: 'Stable neutral ID.',
  });
  markUnresolvedImportedSources(neutral, context);
  assert.equal(neutral.provenance.status, 'VERIFIED');
});
test('Creature source identities resolve exact entries and identify a removed creature entry without synthesizing stats', () => {
  const id = creatureReferenceId(creature),
    item = saved();
  item.provenance.sourceRefs = [
    { bookId: 'test', pdfPage: 4, tableId: id, entryId: 'test.creature' },
  ];
  item.provenance.rolls = [];
  markUnresolvedImportedSources(item, context);
  assert.equal(item.provenance.status, 'VERIFIED');
  item.provenance.sourceRefs[0].entryId = 'different.creature';
  markUnresolvedImportedSources(item, context);
  assert.equal(item.provenance.status, 'UNAVAILABLE');
  assert.deepEqual(item.provenance.unresolvedSourceIds, ['different.creature']);
});
test('Repeated import keeps earlier unresolved historical evidence and never silently upgrades verification', () => {
  const item = saved();
  item.provenance.sourceRefs[0].entryId = 'removed.row';
  markUnresolvedImportedSources(item, context);
  item.provenance.sourceRefs[0].entryId = rootId;
  markUnresolvedImportedSources(item, context);
  assert.equal(item.provenance.status, 'UNAVAILABLE');
  assert.deepEqual(item.provenance.unresolvedSourceIds, ['removed.row']);
});
