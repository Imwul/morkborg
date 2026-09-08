import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import {
  editedProvenance,
  reconcileManualEdits,
  type GeneratedValueProvenance,
} from '../src/domain/generationProvenance.ts';
import {
  createCampaign,
  createDungeonCandidate,
} from '../src/generators/index.ts';
import {
  editRoomComponent,
  rerollRoomComponent,
} from '../src/generators/specialRooms.ts';
import {
  cloneCampaign,
  cloneDungeon,
  applyCampaignEdit,
} from '../src/domain/operations.ts';
import { validateCampaign, parseImport } from '../src/storage/schema.ts';
import {
  loadStoredSave,
  STORAGE_KEY,
  INTEGRITY_BACKUP_KEY,
} from '../src/storage/migrations.ts';
import { setRules } from '../src/storage/rulesStore.ts';
import { setOraclePack } from '../src/storage/oracleStore.ts';
const source: GeneratedValueProvenance = {
  classification: 'SOURCE_VERBATIM',
  origin: 'source',
  status: 'VERIFIED',
  sourceRefs: [
    {
      bookId: 'core',
      tableId: 'core.rooms',
      pdfPage: 73,
      entryId: 'core.rooms:11-11',
    },
  ],
  sourceText: ['Source sample'],
  rolls: [
    {
      tableId: 'core.rooms',
      dice: 'd4 × d6',
      value: 11,
      entryId: 'core.rooms:11-11',
    },
  ],
};
test('editing keeps original source text and rolls but stops claiming visible text is verbatim', () => {
  const before = {
    description: 'Source sample',
    fieldProvenance: { description: source },
  };
  const after = structuredClone(before);
  after.description = 'My handwritten interpretation';
  reconcileManualEdits(before, after);
  assert.equal(after.fieldProvenance.description.origin, 'source-edited');
  assert.equal(
    after.fieldProvenance.description.classification,
    'USER_AUTHORED',
  );
  assert.deepEqual(after.fieldProvenance.description.sourceText, [
    'Source sample',
  ]);
  assert.deepEqual(after.fieldProvenance.description.rolls, source.rolls);
});
test('new reroll text and metadata are atomic and never misclassified as a manual edit', () => {
  const before = {
    description: 'Source sample',
    fieldProvenance: { description: source },
  };
  const after = {
    description: 'Next sample',
    fieldProvenance: {
      description: {
        ...source,
        sourceText: ['Next sample'],
        rolls: [
          {
            tableId: 'core.rooms',
            dice: 'd4 × d6',
            value: 12,
            entryId: 'core.rooms:12-12',
          },
        ],
      },
    },
  };
  reconcileManualEdits(before, after);
  assert.equal(after.fieldProvenance.description.origin, 'source');
  assert.equal(after.fieldProvenance.description.rolls[0].value, 12);
});
test('nested user edits retain source metadata and discard stale helper translations', () => {
  const before = {
    components: [
      {
        key: 'sample',
        sourceText: 'Source sample',
        translationKo: '원문',
        provenance: source,
      },
    ],
  };
  const after = structuredClone(before);
  after.components[0].sourceText = 'Manual';
  reconcileManualEdits(before, after);
  assert.equal(after.components[0].provenance.origin, 'source-edited');
  assert.equal(after.components[0].translationKo, undefined);
  assert.equal(editedProvenance().origin, 'manual');
});
test('current v6 campaign gets byte-exact backup before validation; failed backup leaves original untouched', () => {
  const campaign = createCampaign('Preservation');
  const raw = JSON.stringify({
    schemaVersion: 6,
    campaigns: [campaign],
    activeCampaignId: campaign.id,
    view: 'campaign',
  });
  const values = new Map([[STORAGE_KEY, raw]]);
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
    key: (i: number) => [...values.keys()][i] ?? null,
    get length() {
      return values.size;
    },
  };
  const result = loadStoredSave(storage);
  assert.equal(values.get(INTEGRITY_BACKUP_KEY), raw);
  assert.equal(values.get(STORAGE_KEY), raw);
  assert.equal(result.save.campaigns[0].id, campaign.id);
  values.delete(INTEGRITY_BACKUP_KEY);
  assert.throws(
    () =>
      loadStoredSave({
        ...storage,
        setItem: () => {
          throw new Error('quota');
        },
      }),
    /quota/,
  );
  assert.equal(values.get(STORAGE_KEY), raw);
});
const available = existsSync('outputs/morkborg-private-data.json');
if (available) {
  const bundle = JSON.parse(
    readFileSync('outputs/morkborg-private-data.json', 'utf8'),
  );
  setRules(bundle.library);
  setOraclePack(bundle.oracles);
}
test(
  'structured rooms, edited origins and canonical source references survive duplication and JSON import',
  { skip: !available },
  () => {
    const campaign = createCampaign('Isolated');
    const dungeon = createDungeonCandidate(campaign.id, 'sarkash');
    campaign.dungeons.push(dungeon);
    const room = dungeon.rooms[1];
    editRoomComponent(room, 'sample', 'MY ROOM · keep this');
    const reference = structuredClone(room.components![0].provenance);
    applyCampaignEdit(campaign, (c) => {
      c.dungeons[0].rooms[1].notes = 'Keep this note';
    });
    const copy = cloneDungeon(dungeon);
    assert.notEqual(copy.id, dungeon.id);
    assert.notEqual(copy.rooms[1].id, room.id);
    assert.deepEqual(copy.rooms[1].components, room.components);
    assert.equal(copy.rooms[1].notes, 'Keep this note');
    const duplicate = cloneCampaign(campaign);
    assert.deepEqual(
      duplicate.dungeons[0].rooms[1].components,
      room.components,
    );
    const imported = parseImport(
      JSON.stringify({ schemaVersion: 6, campaign }),
    )[0];
    assert.deepEqual(imported.dungeons[0].rooms[1].components, room.components);
    assert.deepEqual(
      imported.dungeons[0].rooms[1].components![0].provenance,
      reference,
    );
    assert.deepEqual(validateCampaign(imported), imported);
  },
);
test(
  'rerolling another room leaves manual room value, ID, notes and its provenance untouched',
  { skip: !available },
  () => {
    const c = createCampaign('Isolated'),
      d = createDungeonCandidate(c.id, 'sarkash');
    editRoomComponent(d.rooms[1], 'sample', 'Manual preserved');
    d.rooms[1].notes = 'Paper note';
    const before = structuredClone(d.rooms[1]);
    rerollRoomComponent(d, d.rooms[0], 'sample', () => 0);
    assert.deepEqual(d.rooms[1], before);
  },
);
test('missing imported canonical source IDs preserve visible text and are explicitly unresolved', async () => {
  const { markUnresolvedImportedSources } =
    await import('../src/storage/importProvenance.ts');
  const saved = {
    description: 'Keep saved source words',
    fieldProvenance: { description: structuredClone(source) },
  };
  markUnresolvedImportedSources(saved, new Set(['core.other-table']));
  assert.equal(saved.description, 'Keep saved source words');
  assert.equal(saved.fieldProvenance.description.status, 'UNAVAILABLE');
  assert.deepEqual(saved.fieldProvenance.description.unresolvedSourceIds, [
    'core.rooms',
  ]);
  assert.deepEqual(saved.fieldProvenance.description.sourceText, [
    'Source sample',
  ]);
});
test('new manual fields receive explicit manual origin at the transaction boundary', () => {
  const before = { danger: '', sources: {} };
  const after: {
    danger: string;
    sources: Record<string, string>;
    fieldProvenance?: Record<string, GeneratedValueProvenance>;
  } = { danger: 'My danger', sources: { danger: '직접 작성' } };
  reconcileManualEdits(before, after);
  assert.equal(after.fieldProvenance?.danger.origin, 'manual');
});
test('randomize-all guard distinguishes untouched empty fields and retained notes from actual edits', async () => {
  const { hasManualEdits } =
    await import('../src/domain/generationProvenance.ts');
  assert.equal(
    hasManualEdits({
      danger: '',
      notes: 'keep notes',
      sources: { danger: '직접 작성', notes: '직접 작성' },
      fieldProvenance: { danger: editedProvenance() },
    }),
    false,
  );
  assert.equal(
    hasManualEdits({
      danger: '',
      fieldProvenance: { danger: editedProvenance(source) },
    }),
    true,
  );
  assert.equal(
    hasManualEdits({
      danger: 'Manual text',
      fieldProvenance: { danger: editedProvenance() },
    }),
    true,
  );
});
