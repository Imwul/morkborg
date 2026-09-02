import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import {
  createCampaign,
  createDungeon,
  createDungeonCandidate,
  rerollRoomContents,
  generateDungeonRoll,
} from '../src/generators/index.ts';
import { setRules, getRules } from '../src/storage/rulesStore.ts';
import {
  emptySave,
  loadStoredSave,
  migrateSave,
  STORAGE_KEY,
  PREVIOUS_STORAGE_KEY,
  LEGACY_STORAGE_KEY,
  MIGRATION_BACKUP_KEY,
  type SaveStorage,
} from '../src/storage/migrations.ts';
import {
  applyCampaignEdit,
  campaignIds,
  cloneCampaign,
  importCampaigns,
  openCampaignLibrary,
  updateWorkspace,
  selectDungeonCandidate,
} from '../src/domain/operations.ts';
import { validateSave, parseImport } from '../src/storage/schema.ts';
import {
  regionWeightFactor,
  entryTags,
  REGION_WEIGHT_TABLES,
} from '../src/generators/regionWeights.ts';
import { weightedPick } from '../src/generators/random.ts';
import { regions } from '../src/data/regions.ts';
const hasRules = existsSync('public/rules/library.json');
if (hasRules)
  setRules(JSON.parse(readFileSync('public/rules/library.json', 'utf8')));
class MemoryStorage implements SaveStorage {
  values = new Map<string, string>();
  failKey: string | null = null;
  get length() {
    return this.values.size;
  }
  key(i: number) {
    return [...this.values.keys()][i] ?? null;
  }
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (key === this.failKey) throw new Error('quota');
    this.values.set(key, value);
  }
}
function legacy() {
  return {
    id: crypto.randomUUID(),
    title: 'Existing Dungeon',
    region: 'Graven-Tosk',
    premise: '원래 발단',
    status: '원래 상태',
    entrance: '직접 쓴 입구',
    notes: '던전 노트',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-02-01T00:00:00.000Z',
    rooms: [
      {
        id: crypto.randomUUID(),
        name: 'Room Three',
        description: '직접 수정한 방',
        notes: '방 노트',
      },
    ],
  };
}
test('v1 migration preserves IDs, notes, drafts, timestamps and exact original bytes', () => {
  const c = createCampaign('Old');
  const d = createDungeon(c.id, 'Preserved', 'kergus', true);
  d.entrance = '직접 기록';
  d.notes = 'Notes';
  c.dungeons.push(d);
  c.dungeonDraft = createDungeon(c.id, 'Candidate', 'sarkash', true);
  c.workspace.dungeonPreview = true;
  const raw = JSON.stringify(
    {
      schemaVersion: 1,
      activeCampaignId: c.id,
      campaigns: [c],
      unknownLegacyField: { keep: true },
    },
    null,
    3,
  );
  const storage = new MemoryStorage();
  storage.setItem(LEGACY_STORAGE_KEY, raw);
  const result = loadStoredSave(storage);
  assert.equal(result.save.schemaVersion, 3);
  assert.deepEqual(result.save.campaigns[0], c);
  assert.equal(result.save.activeCampaignId, c.id);
  assert.equal(storage.getItem(LEGACY_STORAGE_KEY), raw);
  assert.equal(JSON.parse(storage.getItem(MIGRATION_BACKUP_KEY)!)[0].raw, raw);
  assert.deepEqual(loadStoredSave(storage).save, result.save);
  assert.equal(loadStoredSave(storage).migrated.length, 0);
});
test('recognizable single dungeon moves into Untitled Campaign without rerolling', () => {
  const old = legacy();
  const storage = new MemoryStorage();
  const raw = JSON.stringify({ dungeon: old });
  storage.setItem('morkborg:legacy-fixture', raw);
  const result = loadStoredSave(storage).save;
  const c = result.campaigns[0],
    d = c.dungeons[0];
  assert.equal(c.title, 'Untitled Campaign');
  assert.equal(d.id, old.id);
  assert.equal(d.region, 'graven-tosk');
  assert.equal(d.entrance, old.entrance);
  assert.equal(d.rooms[0].id, old.rooms[0].id);
  assert.equal(d.rooms[0].description, old.rooms[0].description);
  assert.equal(d.rooms[0].notes, old.rooms[0].notes);
  assert.equal(d.createdAt, old.createdAt);
  assert.equal(d.campaignId, c.id);
  assert.equal(storage.getItem('morkborg:legacy-fixture'), raw);
  assert.deepEqual(loadStoredSave(storage).save, result);
});
test('legacy generated field objects retain values and sources and receive stable missing IDs', () => {
  const old = {
    title: 'Nested',
    region: 'Kergüs',
    generatedFields: {
      premise: { value: 'Text', source: 'Book p1' },
      status: 'Dormant',
    },
    rooms: [
      {
        id: 3,
        generatedFields: {
          name: { value: 'The Crypt', source: 'Book p2' },
          description: { value: 'Exact original' },
        },
      },
    ],
  };
  const storage = new MemoryStorage();
  storage.setItem(PREVIOUS_STORAGE_KEY, JSON.stringify(old));
  const result = loadStoredSave(storage).save;
  const d = result.campaigns[0].dungeons[0];
  assert.equal(d.premise, 'Text');
  assert.equal(d.sources!.premise, 'Book p1');
  assert.equal(d.rooms[0].name, 'The Crypt');
  assert.equal(d.rooms[0].sources!.name, 'Book p2');
  assert.equal(d.rooms[0].description, 'Exact original');
  assert.equal(
    loadStoredSave(storage).save.campaigns[0].dungeons[0].rooms[0].id,
    d.rooms[0].id,
  );
});
test('unknown versions, invalid regions and embedded unsupported libraries never become partial saves', () => {
  const storage = new MemoryStorage();
  const raw = JSON.stringify({ schemaVersion: 99, campaigns: [] });
  storage.setItem(PREVIOUS_STORAGE_KEY, raw);
  assert.throws(() => loadStoredSave(storage));
  assert.equal(storage.getItem(STORAGE_KEY), null);
  assert.equal(storage.getItem(PREVIOUS_STORAGE_KEY), raw);
  assert.throws(() => migrateSave({ ...legacy(), region: 'unknown' }));
  assert.throws(() =>
    migrateSave({ dungeon: { ...legacy(), monsters: [{ name: 'Keep me' }] } }),
  );
  assert.throws(() =>
    migrateSave({ dungeon: legacy(), npcs: [{ name: 'Keep me too' }] }),
  );
  assert.throws(() =>
    migrateSave({
      ...legacy(),
      rooms: [{ name: 'Room', monsterIds: [crypto.randomUUID()] }],
    }),
  );
});
test('migration commits only after a byte-exact backup succeeds', () => {
  const storage = new MemoryStorage();
  const raw = JSON.stringify(legacy());
  storage.setItem(PREVIOUS_STORAGE_KEY, raw);
  storage.failKey = MIGRATION_BACKUP_KEY;
  assert.throws(() => loadStoredSave(storage), /quota/);
  assert.equal(storage.getItem(STORAGE_KEY), null);
  assert.equal(storage.getItem(PREVIOUS_STORAGE_KEY), raw);
  storage.failKey = STORAGE_KEY;
  assert.throws(() => loadStoredSave(storage), /quota/);
  assert.equal(storage.getItem(STORAGE_KEY), null);
  assert.equal(JSON.parse(storage.getItem(MIGRATION_BACKUP_KEY)!)[0].raw, raw);
});
test('navigation preserves modification times and opens the selected campaign library', () => {
  const c = createCampaign('Navigation'),
    save = emptySave();
  save.campaigns.push(c);
  const d = createDungeon(c.id, 'Existing', 'sarkash', true);
  c.dungeons.push(d);
  c.workspace.dungeonId = d.id;
  c.workspace.dungeonPreview = true;
  const before = { campaign: c.updatedAt, dungeon: d.updatedAt };
  openCampaignLibrary(save, c.id);
  assert.equal(save.view, 'campaign');
  assert.equal(save.activeCampaignId, c.id);
  assert.equal(c.workspace.section, 'dungeons');
  assert.equal(c.workspace.dungeonId, null);
  assert.equal(c.workspace.dungeonPreview, false);
  updateWorkspace(c, { section: 'notes' });
  assert.deepEqual({ campaign: c.updatedAt, dungeon: d.updatedAt }, before);
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(save))), save);
});
test('room and dungeon edits update only their containing dungeon, without a dungeon limit', () => {
  const c = createCampaign('Many');
  for (let i = 0; i < 120; i++)
    c.dungeons.push(createDungeon(c.id, `Dungeon ${i}`, 'sarkash', true));
  const unaffected = structuredClone(c.dungeons[1]);
  const stamp = '2030-01-01T00:00:00.000Z';
  applyCampaignEdit(
    c,
    (next) => {
      next.dungeons[0].notes = 'new notes';
    },
    stamp,
  );
  assert.equal(c.dungeons[0].updatedAt, stamp);
  assert.deepEqual(c.dungeons[1], unaffected);
  assert.equal(
    validateSave({ ...emptySave(), campaigns: [c] }).campaigns[0].dungeons
      .length,
    120,
  );
});
test('import collisions remap the entire tree and never overwrite an existing campaign', () => {
  const original = createCampaign('Original');
  original.dungeons.push(createDungeon(original.id, 'Dungeon', 'grift', true));
  const save = { ...emptySave(), campaigns: [original] };
  const before = structuredClone(original);
  importCampaigns(
    save,
    parseImport(JSON.stringify({ schemaVersion: 2, campaign: original })),
  );
  assert.equal(save.campaigns.length, 2);
  assert.deepEqual(original, before);
  const ownIds = new Set(campaignIds(original));
  assert.ok(campaignIds(save.campaigns[1]).every((id) => !ownIds.has(id)));
  const differentCampaignSameDungeon = structuredClone(original);
  differentCampaignSameDungeon.id = crypto.randomUUID();
  differentCampaignSameDungeon.dungeons[0].campaignId =
    differentCampaignSameDungeon.id;
  importCampaigns(save, [differentCampaignSameDungeon]);
  assert.equal(save.campaigns.length, 3);
  assert.equal(
    new Set(save.campaigns.flatMap(campaignIds)).size,
    save.campaigns.flatMap(campaignIds).length,
  );
});
test(
  'two dungeons, room reroll/edit/delete, separate notes and clone/export restoration retain identity',
  { skip: !hasRules },
  () => {
    const c = createCampaign('THE ASHEN PSALM');
    c.notes = 'Campaign-only notes';
    c.dungeonDraft = createDungeonCandidate(c.id, 'graven-tosk');
    selectDungeonCandidate(c, c.dungeonDraft.title);
    const d = c.dungeons[0],
      original = structuredClone(d);
    const reroll = generateDungeonRoll('entrance', d.region);
    d.entrance = String(reroll.value);
    d.sources!.entrance = reroll.source;
    applyCampaignEdit(c, () => rerollRoomContents(d.rooms[1], d.region));
    assert.equal(d.rooms[1].id, original.rooms[1].id);
    assert.deepEqual(d.rooms[0], original.rooms[0]);
    assert.deepEqual(d.rooms[2], original.rooms[2]);
    d.rooms[2].description = '수동으로 쓴 Room 3';
    d.notes = 'Dungeon-only notes';
    const room3 = structuredClone(d.rooms[2]);
    d.rooms.splice(1, 1);
    assert.deepEqual(
      d.rooms.find((r) => r.id === room3.id),
      room3,
    );
    c.dungeonDraft = createDungeonCandidate(c.id, 'sarkash');
    selectDungeonCandidate(c, c.dungeonDraft.title);
    const restored = parseImport(
      JSON.stringify({ schemaVersion: 2, campaign: c }),
    )[0];
    assert.deepEqual(restored, c);
    assert.equal(restored.dungeons.length, 2);
    const copy = cloneCampaign(c);
    const oldIds = new Set(campaignIds(c));
    assert.ok(campaignIds(copy).every((id) => !oldIds.has(id)));
    assert.equal(copy.notes, c.notes);
    assert.equal(copy.dungeons[0].notes, d.notes);
    assert.equal(copy.dungeons[0].rooms[1].description, room3.description);
  },
);
test('seven exact region names retain the requested proper nouns', () => {
  assert.deepEqual(
    regions.map((r) => r.name),
    [
      'Galgenbeck',
      'Sarkash',
      'Graven-Tosk',
      'Grift',
      'Kergüs',
      'Wästland',
      'The Valley of the Unfortunate Undead',
    ],
  );
  for (const word of ['Jila Migle', 'Sigfúm', 'Anthelia', 'Fathu'])
    assert.ok(regions.some((r) => r.description.includes(word)));
});
test('region tags boost gently, never force or stack, and match word boundaries', () => {
  assert.equal(
    regionWeightFactor('core.rooms', 'Roots roots forest vines', 'sarkash'),
    1.25,
  );
  assert.equal(regionWeightFactor('core.rooms', 'A crypt', 'sarkash'), 1);
  assert.equal(
    regionWeightFactor('sd.room.type', 'Crypt', 'graven-tosk'),
    1.25,
  );
  assert.equal(regionWeightFactor('core.rooms', 'justice notice', 'kergus'), 1);
  assert.equal(entryTags('justice notice').includes('ice'), false);
  for (const table of [
    'core.treasures',
    'core.weapons',
    'feretory.A',
    'depths.region.sarkash.trait',
    'core.sparks',
  ])
    assert.equal(regionWeightFactor(table, 'Roots forest', 'sarkash'), 1);
  const choices = [
    { value: 'Forest', weight: 1.25 },
    { value: 'Crypt', weight: 1 },
  ];
  assert.equal(
    weightedPick(choices, () => 0),
    'Forest',
  );
  assert.equal(
    weightedPick(choices, () => 0.999),
    'Crypt',
  );
});
test(
  'regional rolls preserve the source pack and keep every original result selectable',
  { skip: !hasRules },
  () => {
    const pack = getRules()!,
      before = JSON.stringify(pack);
    for (const region of regions) {
      createDungeonCandidate(crypto.randomUUID(), region.id);
      for (const key of REGION_WEIGHT_TABLES)
        for (const e of pack.tables[key]?.entries ?? []) {
          const factor = regionWeightFactor(key, e.text, region.id);
          assert.ok(factor === 1 || factor === 1.25);
          assert.ok(e.weight * factor > 0);
        }
    }
    assert.equal(JSON.stringify(pack), before);
  },
);
