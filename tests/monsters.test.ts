import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import {
  createCampaign,
  createDungeonCandidate,
  createDungeon,
  createRoom,
} from '../src/generators/index.ts';
import {
  generateMonster,
  rerollMonsterField,
  rerollMonsterLinked,
  rerollMonsterSpecial,
  patchMonsterScalar,
  loadMonsterPreset,
} from '../src/generators/monster.ts';
import { setRules, getRules } from '../src/storage/rulesStore.ts';
import {
  addMonsterPlacement,
  beginMonsterDraft,
  cloneMonster,
  deleteMonster,
  deleteRoom,
  deleteDungeon,
  duplicateDungeon,
  editMonsterPlacement,
  removeMonsterPlacement,
  saveMonsterDraft,
  syncMonsterRefs,
  monsterRelationIssues,
} from '../src/domain/monsterOperations.ts';
import {
  applyCampaignEdit,
  campaignIds,
  cloneCampaign,
  importCampaigns,
  selectDungeonCandidate,
  updateWorkspace,
} from '../src/domain/operations.ts';
import {
  validateCampaign,
  validateSave,
  parseImport,
} from '../src/storage/schema.ts';
import {
  emptySave,
  loadStoredSave,
  STORAGE_KEY,
  PREVIOUS_STORAGE_KEY,
  V3_STORAGE_KEY,
  V2_STORAGE_KEY,
  MIGRATION_BACKUP_KEY,
  type SaveStorage,
} from '../src/storage/migrations.ts';
const hasRules = existsSync('public/rules/library.json');
if (hasRules)
  setRules(JSON.parse(readFileSync('public/rules/library.json', 'utf8')));
const ruleTest = (name: string, run: () => void) =>
  test(name, { skip: !hasRules }, run);
function fixture() {
  const c = createCampaign('THE ASHEN PSALM');
  const d = createDungeon(c.id, 'First', 'graven-tosk', true);
  d.rooms = Array.from({ length: 4 }, () => createRoom(d.region, true));
  const other = createDungeon(c.id, 'Second', 'sarkash', true);
  other.rooms = [createRoom(other.region, true)];
  c.dungeons.push(d, other);
  const m = generateMonster(c.id, true);
  m.name = 'Bone Widow';
  m.hp = 8;
  c.monsters.push(m);
  return { c, d, other, m };
}
class Storage implements SaveStorage {
  values = new Map<string, string>();
  fail: string | null = null;
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
    if (key === this.fail) throw new Error('quota');
    this.values.set(key, value);
  }
}
ruleTest(
  'Monster generation uses source tables and linked stats for 120 independent definitions',
  () => {
    const c = createCampaign('Many');
    for (let i = 0; i < 120; i++) {
      const m = generateMonster(c.id);
      c.monsters.push(m);
      assert.equal(m.campaignId, c.id);
      assert.ok(m.name);
      assert.equal(m.attacks.length, 1);
      assert.equal(m.attacks[0].name, '');
      assert.match(m.attacks[0].damage, /^d(4|6|8|10|12)$/);
      assert.ok(
        getRules()!.tables['core.names'].entries.some((e) => e.text === m.name),
      );
      const r = m.generation!.rolls;
      assert.equal(m.morale, Math.max(r.A, r.B, r.C));
      assert.ok(m.hp >= 2 && m.hp <= Number(m.attacks[0].damage.slice(1)) * 2);
      assert.equal(m.hp % 2, 0);
      assert.equal(m.special.length, 1);
      assert.ok(
        getRules()!.tables['feretory.trait'].entries.some(
          (e) => e.text === m.special[0].text,
        ),
      );
      assert.deepEqual(m.weakness, []);
      assert.deepEqual(m.loot, []);
      assert.equal(m.behavior, '');
      assert.equal(m.concept, '');
      assert.equal(m.description, '');
      assert.equal('dungeonId' in m, false);
      assert.equal('roomId' in m, false);
    }
    assert.equal(validateCampaign(c).monsters.length, 120);
    assert.equal(new Set(campaignIds(c)).size, campaignIds(c).length);
  },
);
ruleTest(
  'Monster draft creation and repeated randomization never populate the saved library',
  () => {
    const { c, d } = fixture();
    c.monsters = [];
    beginMonsterDraft(c, { dungeonId: d.id, roomId: d.rooms[1].id });
    const draftId = c.drafts.monsters!.id;
    beginMonsterDraft(c);
    assert.equal(c.drafts.monsters!.id, draftId);
    for (let i = 0; i < 30; i++) c.drafts.monsters = generateMonster(c.id);
    c.workspace.selected.monsters = c.drafts.monsters!.id;
    assert.equal(c.monsters.length, 0);
    validateCampaign(c);
  },
);
ruleTest('Save Monster stores the exact edited candidate once', () => {
  const c = createCampaign('Save');
  beginMonsterDraft(c);
  c.drafts.monsters!.name = 'Manual Name';
  c.drafts.monsters!.notes = 'Private notes';
  const before = structuredClone(c.drafts.monsters!);
  const saved = saveMonsterDraft(c);
  assert.equal(saved.id, before.id);
  assert.deepEqual(saved.attacks, before.attacks);
  assert.equal(saved.notes, before.notes);
  assert.equal(c.monsters.length, 1);
  assert.equal(c.drafts.monsters, null);
  assert.throws(() => saveMonsterDraft(c));
});
ruleTest(
  'Name reroll changes no other Monster field or manually edited text',
  () => {
    const m = generateMonster(crypto.randomUUID());
    m.hp = 37;
    m.notes = 'Keep';
    m.attacks[0].name = 'Rusty hook';
    const before = structuredClone(m);
    rerollMonsterField(m, 'name');
    assert.deepEqual(
      { ...m, name: before.name, sources: before.sources },
      before,
    );
    assert.match(m.sources!.name, /BARE BONES/);
  },
);
ruleTest(
  'Special reroll uses the original weighted table and retains all other values and item IDs',
  () => {
    const m = generateMonster(crypto.randomUUID());
    m.name = 'Manual';
    m.hp = 37;
    const before = structuredClone(m);
    rerollMonsterSpecial(m, m.special[0].id);
    assert.equal(m.special[0].id, before.special[0].id);
    assert.deepEqual({ ...m, special: before.special }, before);
    const table = getRules()!.tables['feretory.trait'];
    assert.equal(
      table.entries.reduce((n, e) => n + e.weight, 0),
      20,
    );
    assert.ok(table.entries.some((e) => e.text === m.special[0].text));
  },
);
ruleTest(
  'Attack reroll preserves manual HP, name, armor, attack name and unrelated attacks',
  () => {
    const m = generateMonster(crypto.randomUUID());
    patchMonsterScalar(m, 'name', 'The Manual Beast');
    patchMonsterScalar(m, 'hp', 47);
    patchMonsterScalar(m, 'armor', 'Plate −d6');
    m.attacks[0].name = 'Rusty hook';
    m.attacks[0].sources!.name = '직접 작성';
    m.attacks.push({
      id: crypto.randomUUID(),
      name: 'Other',
      damage: '2d6',
      description: 'Manual',
    });
    const before = structuredClone(m);
    rerollMonsterLinked(m, 'attack', m.attacks[0].id);
    assert.equal(m.name, before.name);
    assert.equal(m.hp, 47);
    assert.equal(m.armor, 'Plate −d6');
    assert.equal(m.attacks[0].name, 'Rusty hook');
    assert.deepEqual(m.attacks[1], before.attacks[1]);
    assert.deepEqual(m.special, before.special);
    assert.equal(m.attacks[0].id, before.attacks[0].id);
    assert.equal(m.morale, Math.max(...Object.values(m.generation!.rolls)));
    assert.ok(m.appearance);
  },
);
ruleTest(
  'Linked regeneration recognizes old full FERETORY citations and respects a manually set damage die',
  () => {
    const m = generateMonster(crypto.randomUUID());
    m.sources!.appearance = 'MÖRK BORG CULT: FERETORY · PDF 2쪽 · Table A';
    m.attacks[0].damage = 'd12';
    m.attacks[0].sources!.damage = '직접 작성';
    rerollMonsterLinked(m, 'armor');
    assert.match(m.sources!.appearance, /^FERETORY/);
    assert.equal(m.attacks[0].damage, 'd12');
    assert.ok(m.hp >= 2 && m.hp <= 24);
  },
);
ruleTest(
  'HP reroll alone uses current primary damage, with no combat instance state',
  () => {
    const m = generateMonster(crypto.randomUUID());
    m.attacks[0].damage = 'd6';
    const before = structuredClone(m);
    rerollMonsterField(m, 'hp');
    assert.ok(m.hp >= 2 && m.hp <= 12);
    assert.equal(m.hp % 2, 0);
    assert.deepEqual({ ...m, hp: before.hp, sources: before.sources }, before);
    assert.equal('maxHp' in m, false);
    assert.equal('currentHp' in m, false);
  },
);
test('Monster manual scalar editing validates HP and preserves nonnumeric morale rules', () => {
  const { m } = fixture();
  patchMonsterScalar(m, 'hp', Infinity);
  assert.equal(m.hp, 8);
  patchMonsterScalar(m, 'hp', -3);
  assert.equal(m.hp, 0);
  patchMonsterScalar(m, 'hp', 3.9);
  assert.equal(m.hp, 3);
  patchMonsterScalar(m, 'morale', '—');
  assert.equal(m.morale, '—');
  patchMonsterScalar(m, 'id', 'changed');
  assert.notEqual(m.id, 'changed');
});
ruleTest(
  'Monster duplication creates independent owned IDs and dates without copying any placements',
  () => {
    const { c, d } = fixture();
    const m = generateMonster(c.id);
    m.createdAt = '2020-01-01T00:00:00.000Z';
    c.monsters.push(m);
    addMonsterPlacement(c, m.id, { dungeonId: d.id, roomId: null });
    const copy = cloneMonster(m);
    c.monsters.push(copy);
    assert.notEqual(copy.id, m.id);
    assert.notEqual(copy.createdAt, m.createdAt);
    assert.notEqual(copy.attacks[0].id, m.attacks[0].id);
    assert.equal(
      c.monsterPlacements.filter((p) => p.monsterId === copy.id).length,
      0,
    );
    copy.attacks[0].name = 'Independent';
    assert.notEqual(m.attacks[0].name, 'Independent');
    validateCampaign(c);
  },
);
test('Monster deletion removes every related placement but preserves other definitions and Dungeons', () => {
  const { c, d, m } = fixture();
  const second = generateMonster(c.id, true);
  c.monsters.push(second);
  addMonsterPlacement(c, m.id, { dungeonId: d.id, roomId: d.rooms[0].id });
  addMonsterPlacement(c, second.id, { dungeonId: d.id, roomId: null });
  deleteMonster(c, m.id);
  assert.equal(c.monsters.length, 1);
  assert.equal(c.monsterPlacements.length, 1);
  assert.equal(c.monsterPlacements[0].monsterId, second.id);
  assert.equal(c.dungeons.length, 2);
  validateCampaign(c);
});
test('Campaign Monster libraries cannot refer to each other', () => {
  const { c, d, m } = fixture();
  const other = createCampaign('Other');
  assert.throws(() =>
    addMonsterPlacement(other, m.id, { dungeonId: d.id, roomId: null }),
  );
  other.monsters.push(structuredClone(m));
  assert.throws(() => validateCampaign(other), /another campaign/);
  assert.equal(c.monsters.length, 1);
});
test('Dungeon-only assignment uses a null Room ID and preserves quantity and notes', () => {
  const { c, d, m } = fixture();
  const p = addMonsterPlacement(
    c,
    m.id,
    { dungeonId: d.id, roomId: null },
    3,
    'At the entrance',
  );
  assert.equal(p.roomId, null);
  assert.equal(p.quantity, 3);
  assert.equal(p.notes, 'At the entrance');
  assert.equal(c.monsters.length, 1);
  validateCampaign(c);
});
test('Room assignment keeps the stable Room ID through reordering', () => {
  const { c, d, m } = fixture();
  const roomId = d.rooms[1].id;
  const p = addMonsterPlacement(c, m.id, { dungeonId: d.id, roomId });
  d.rooms.reverse();
  assert.equal(p.roomId, roomId);
  assert.equal(d.rooms[2].id, roomId);
  validateCampaign(c);
});
test('Same Monster supports multiple rooms, Dungeons and repeated same-room placements', () => {
  const { c, d, other, m } = fixture();
  for (const target of [
    { dungeonId: d.id, roomId: d.rooms[0].id },
    { dungeonId: d.id, roomId: d.rooms[1].id },
    { dungeonId: d.id, roomId: d.rooms[1].id },
    { dungeonId: other.id, roomId: null },
  ])
    addMonsterPlacement(c, m.id, target);
  assert.equal(c.monsters.length, 1);
  assert.equal(c.monsterPlacements.length, 4);
  assert.equal(new Set(c.monsterPlacements.map((p) => p.id)).size, 4);
  validateCampaign(c);
});
test('Quantity and placement notes are independent, while Monster edits appear in every reference', () => {
  const { c, d, m } = fixture();
  const a = addMonsterPlacement(
    c,
    m.id,
    { dungeonId: d.id, roomId: d.rooms[0].id },
    1,
    'One',
  );
  const b = addMonsterPlacement(
    c,
    m.id,
    { dungeonId: d.id, roomId: d.rooms[3].id },
    2,
    'Two',
  );
  editMonsterPlacement(c, b.id, { quantity: 3, notes: 'Room four' });
  patchMonsterScalar(m, 'hp', 10);
  assert.equal(a.quantity, 1);
  assert.equal(a.notes, 'One');
  assert.equal(b.quantity, 3);
  assert.equal(b.notes, 'Room four');
  assert.deepEqual(
    c.monsterPlacements.map(
      (p) => c.monsters.find((m) => m.id === p.monsterId)!.hp,
    ),
    [10, 10],
  );
  validateCampaign(c);
});
test('Removing one placement keeps the definition and the other placement', () => {
  const { c, d, m } = fixture();
  const a = addMonsterPlacement(c, m.id, {
    dungeonId: d.id,
    roomId: d.rooms[1].id,
  });
  const b = addMonsterPlacement(c, m.id, {
    dungeonId: d.id,
    roomId: d.rooms[3].id,
  });
  removeMonsterPlacement(c, a.id);
  assert.equal(c.monsters[0].id, m.id);
  assert.deepEqual(c.monsterPlacements, [b]);
  validateCampaign(c);
});
test('Room deletion moves placements to Dungeon-only without merging quantities or notes', () => {
  const { c, d, m } = fixture();
  const rid = d.rooms[1].id;
  const a = addMonsterPlacement(
    c,
    m.id,
    { dungeonId: d.id, roomId: rid },
    3,
    'Moved',
  );
  addMonsterPlacement(
    c,
    m.id,
    { dungeonId: d.id, roomId: null },
    1,
    'Existing',
  );
  c.workspace.dungeonId = d.id;
  c.workspace.roomId = rid;
  c.workspace.monsterTarget = { dungeonId: d.id, roomId: rid };
  deleteRoom(c, d.id, rid);
  assert.equal(a.roomId, null);
  assert.equal(a.quantity, 3);
  assert.equal(a.notes, 'Moved');
  assert.equal(c.monsterPlacements.length, 2);
  assert.equal(c.workspace.monsterTarget.roomId, null);
  validateCampaign(c);
});
test('Dungeon deletion removes only its placements and keeps shared Monster definitions', () => {
  const { c, d, other, m } = fixture();
  addMonsterPlacement(c, m.id, { dungeonId: d.id, roomId: d.rooms[0].id });
  addMonsterPlacement(c, m.id, { dungeonId: other.id, roomId: null });
  c.workspace.monsterTarget = { dungeonId: d.id, roomId: null };
  deleteDungeon(c, d.id);
  assert.equal(c.monsters.length, 1);
  assert.equal(c.monsterPlacements.length, 1);
  assert.equal(c.monsterPlacements[0].dungeonId, other.id);
  assert.equal(c.workspace.monsterTarget, null);
  validateCampaign(c);
});
test('Dungeon duplication remaps Room and placement UUIDs but shares Monster definitions', () => {
  const { c, d, m } = fixture();
  const p = addMonsterPlacement(
    c,
    m.id,
    { dungeonId: d.id, roomId: d.rooms[3].id },
    3,
    'Keep',
  );
  addMonsterPlacement(
    c,
    m.id,
    { dungeonId: d.id, roomId: null },
    2,
    'Unplaced',
  );
  const copy = duplicateDungeon(c, d.id);
  const copies = c.monsterPlacements.filter((p) => p.dungeonId === copy.id);
  assert.equal(c.monsters.length, 1);
  assert.equal(copies.length, 2);
  assert.notEqual(copies[0].id, p.id);
  assert.equal(copies[0].roomId, copy.rooms[3].id);
  assert.notEqual(copy.rooms[3].id, d.rooms[3].id);
  assert.equal(copies[0].monsterId, m.id);
  assert.equal(copies[0].quantity, 3);
  assert.equal(copies[0].notes, 'Keep');
  assert.equal(copies[1].roomId, null);
  validateCampaign(c);
});
ruleTest(
  'Campaign duplication remaps every owned Monster item, relation and draft context',
  () => {
    const { c, d } = fixture();
    const m = generateMonster(c.id);
    c.monsters.push(m);
    addMonsterPlacement(
      c,
      m.id,
      { dungeonId: d.id, roomId: d.rooms[1].id },
      3,
      'Note',
    );
    beginMonsterDraft(c, { dungeonId: d.id, roomId: d.rooms[1].id });
    const originalIds = new Set(campaignIds(c));
    const copy = cloneCampaign(c);
    assert.ok(campaignIds(copy).every((id) => !originalIds.has(id)));
    assert.equal(copy.monsterPlacements[0].monsterId, copy.monsters[1].id);
    assert.equal(
      copy.monsterPlacements[0].roomId,
      copy.dungeons[0].rooms[1].id,
    );
    assert.equal(
      copy.workspace.monsterTarget!.roomId,
      copy.dungeons[0].rooms[1].id,
    );
    assert.equal(copy.drafts.monsters!.campaignId, copy.id);
    validateCampaign(copy);
  },
);
ruleTest(
  'Reload preserves drafts, saved Monsters, notes and all assignment relations without rerolling',
  () => {
    const { c, d } = fixture();
    beginMonsterDraft(c, { dungeonId: d.id, roomId: d.rooms[1].id });
    const m = saveMonsterDraft(c);
    m.notes = 'Monster notes';
    addMonsterPlacement(
      c,
      m.id,
      { dungeonId: d.id, roomId: d.rooms[1].id },
      3,
      'Placement notes',
    );
    beginMonsterDraft(c);
    updateWorkspace(c, { section: 'dungeons' });
    const before = structuredClone(c.drafts.monsters);
    updateWorkspace(c, { section: 'monsters' });
    assert.deepEqual(c.drafts.monsters, before);
    const save = {
      ...emptySave(),
      campaigns: [c],
      activeCampaignId: c.id,
      view: 'campaign' as const,
    };
    const storage = new Storage();
    storage.setItem(STORAGE_KEY, JSON.stringify(save));
    assert.deepEqual(loadStoredSave(storage).save, save);
  },
);
ruleTest(
  'Campaign JSON collision remaps all IDs and preserves the complete relation graph',
  () => {
    const { c, d } = fixture();
    const m = generateMonster(c.id);
    c.monsters.push(m);
    m.notes = 'Private';
    addMonsterPlacement(
      c,
      m.id,
      { dungeonId: d.id, roomId: d.rooms[3].id },
      3,
      'Third',
    );
    const before = structuredClone(c),
      save = { ...emptySave(), campaigns: [c] };
    const raw = JSON.stringify({ schemaVersion: 4, campaign: c });
    assert.deepEqual(parseImport(raw)[0], c);
    importCampaigns(save, parseImport(raw));
    const restored = save.campaigns[1];
    assert.deepEqual(save.campaigns[0], before);
    assert.equal(restored.monsters[1].notes, 'Private');
    assert.equal(
      restored.monsterPlacements[0].roomId,
      restored.dungeons[0].rooms[3].id,
    );
    assert.equal(
      restored.monsterPlacements[0].monsterId,
      restored.monsters[1].id,
    );
    assert.equal(restored.monsterPlacements[0].quantity, 3);
    assert.equal(restored.monsterPlacements[0].notes, 'Third');
    assert.ok(
      campaignIds(restored).every((id) => !campaignIds(c).includes(id)),
    );
    validateCampaign(restored);
  },
);
test('Invalid Monster, Dungeon, cross-Dungeon Room and duplicate owned IDs are rejected safely', () => {
  const { c, d, other, m } = fixture();
  const p = addMonsterPlacement(c, m.id, { dungeonId: d.id, roomId: null });
  for (const patch of [
    { monsterId: crypto.randomUUID() },
    { dungeonId: crypto.randomUUID() },
    { roomId: other.rooms[0].id },
    { quantity: 0 },
  ]) {
    const copy = structuredClone(c);
    Object.assign(copy.monsterPlacements[0], patch);
    assert.ok(monsterRelationIssues(copy).length);
    assert.throws(() => validateCampaign(copy));
  }
  const copy = structuredClone(c);
  copy.monsterPlacements.push(structuredClone(p));
  assert.throws(() => validateCampaign(copy), /duplicate IDs/);
  assert.throws(() =>
    addMonsterPlacement(c, m.id, {
      dungeonId: d.id,
      roomId: other.rooms[0].id,
    }),
  );
  assert.throws(() =>
    addMonsterPlacement(c, m.id, { dungeonId: d.id, roomId: null }, NaN),
  );
});
test('v3 to v5 migration preserves prose and all existing records with exact backup, without duplicate Dungeon-only placements', () => {
  const { c, d, m } = fixture();
  m.notes = 'Monster notes';
  d.notes = 'Dungeon notes';
  c.notes = 'Campaign notes';
  const rawMonster = {
    id: m.id,
    name: 'Old Name',
    notes: m.notes,
    createdAt: m.createdAt,
    updatedAt: m.updatedAt,
    concept: 'Old concept',
    appearance: 'Old appearance',
    behaviour: 'Old behavior',
    wants: 'Old desire',
    hp: 8,
    morale: '—',
    armor: 'Old armor',
    attack: 'Hook / Claw',
    damage: 'd6 / d8',
    specialAbility: 'A; B\nC',
    weakness: 'Weak; intact',
    weirdTrait: 'Weird original',
    loot: 'Not split; keep',
    sources: { specialAbility: 'FERETORY · PDF 3쪽' },
  };
  const old = structuredClone(c) as unknown as Record<string, unknown>;
  old.monsters = [rawMonster];
  delete old.monsterPlacements;
  const ds = old.dungeons as typeof c.dungeons;
  ds[0].monsterIds = [m.id];
  ds[0].rooms[1].monsterIds = [m.id];
  ds[0].rooms[3].monsterIds = [m.id];
  const raw = JSON.stringify(
    {
      schemaVersion: 3,
      campaigns: [old],
      activeCampaignId: c.id,
      view: 'campaign',
    },
    null,
    3,
  );
  const storage = new Storage();
  storage.setItem(V3_STORAGE_KEY, raw);
  storage.setItem('morkborg-codex:pre-v3-backup', 'keep this backup');
  const migrated = loadStoredSave(storage);
  const out = migrated.save.campaigns[0],
    mon = out.monsters[0];
  assert.equal(migrated.save.schemaVersion, 6);
  assert.equal(out.monsterPlacements.length, 2);
  assert.ok(
    out.monsterPlacements.every((p) => p.roomId !== null && p.quantity === 1),
  );
  assert.equal(mon.id, m.id);
  assert.equal(mon.createdAt, m.createdAt);
  assert.equal(mon.updatedAt, m.updatedAt);
  assert.equal(mon.attacks[0].name, 'Hook / Claw');
  assert.equal(mon.attacks[0].damage, 'd6 / d8');
  assert.equal(mon.special[0].text, 'A; B\nC');
  assert.equal(mon.special[0].tableId, 'feretory.trait');
  assert.equal(mon.weakness[0].text, 'Weak; intact');
  assert.equal(mon.behavior, 'Old behavior');
  assert.equal(mon.morale, '—');
  assert.equal(mon.weirdTrait, 'Weird original');
  assert.equal(mon.notes, 'Monster notes');
  assert.equal(out.notes, c.notes);
  assert.equal(out.dungeons[0].notes, d.notes);
  assert.equal(storage.getItem(V3_STORAGE_KEY), raw);
  assert.equal(JSON.parse(storage.getItem(MIGRATION_BACKUP_KEY)!)[0].raw, raw);
  assert.equal(
    storage.getItem('morkborg-codex:pre-v3-backup'),
    'keep this backup',
  );
  assert.deepEqual(loadStoredSave(storage).save, migrated.save);
});
test('Legacy Dungeon-only refs migrate once and legacy Dungeon draft refs survive until candidate selection', () => {
  const { c, d, m } = fixture();
  const old = structuredClone(c) as unknown as Record<string, unknown>;
  delete old.monsterPlacements;
  (old.dungeons as typeof c.dungeons)[0].monsterIds = [m.id];
  old.dungeonDraft = createDungeon(c.id, 'Candidate', 'sarkash', true);
  const draft = old.dungeonDraft as typeof d;
  draft.rooms = [createRoom('sarkash', true)];
  draft.monsterIds = [m.id];
  draft.rooms[0].monsterIds = [m.id];
  const upgraded = validateCampaign(old);
  assert.equal(upgraded.monsterPlacements.length, 1);
  assert.equal(upgraded.monsterPlacements[0].roomId, null);
  syncMonsterRefs(upgraded);
  assert.deepEqual(upgraded.dungeonDraft!.monsterIds, [m.id]);
  selectDungeonCandidate(upgraded, 'Candidate');
  assert.equal(upgraded.monsterPlacements.length, 2);
  assert.equal(upgraded.monsterPlacements[1].roomId, draft.rooms[0].id);
  validateCampaign(upgraded);
});
test('Migration adds missing Monster library, refuses malformed data, and never overwrites originals if writes fail', () => {
  const { c } = fixture();
  const legacy = structuredClone(c) as unknown as Record<string, unknown>;
  delete legacy.monsters;
  delete legacy.monsterPlacements;
  assert.deepEqual(validateCampaign(legacy).monsters, []);
  assert.throws(() => validateCampaign({ ...legacy, monsters: 'wrong' }));
  const raw = JSON.stringify({
    schemaVersion: 3,
    campaigns: [legacy],
    activeCampaignId: null,
  });
  const storage = new Storage();
  storage.setItem(V3_STORAGE_KEY, raw);
  storage.fail = MIGRATION_BACKUP_KEY;
  assert.throws(() => loadStoredSave(storage), /quota/);
  assert.equal(storage.getItem(STORAGE_KEY), null);
  assert.equal(storage.getItem(V3_STORAGE_KEY), raw);
  storage.fail = STORAGE_KEY;
  assert.throws(() => loadStoredSave(storage), /quota/);
  assert.equal(JSON.parse(storage.getItem(MIGRATION_BACKUP_KEY)!)[0].raw, raw);
});
test('Newest supported save takes priority over older v2 and v3 records', () => {
  const storage = new Storage();
  const current = { ...emptySave(), campaigns: [createCampaign('Current')] };
  const old = {
    ...emptySave(),
    schemaVersion: 3,
    campaigns: [createCampaign('Old')],
  };
  storage.setItem(V2_STORAGE_KEY, JSON.stringify({ ...old, schemaVersion: 2 }));
  storage.setItem(V3_STORAGE_KEY, JSON.stringify(old));
  assert.equal(loadStoredSave(storage).save.campaigns[0].title, 'Old');
  storage.setItem(
    PREVIOUS_STORAGE_KEY,
    JSON.stringify({
      ...old,
      schemaVersion: 4,
      campaigns: [createCampaign('Version Four')],
    }),
  );
  assert.equal(loadStoredSave(storage).save.campaigns[0].title, 'Old'); // Migrated v5 has priority.
  storage.setItem(STORAGE_KEY, JSON.stringify(current));
  assert.deepEqual(loadStoredSave(storage).save, current);
});
test('120 Monsters and 600 placements survive reload, duplicate and JSON import without ID corruption', () => {
  const { c, d, other } = fixture();
  c.monsters = Array.from({ length: 120 }, (_, i) => {
    const m = generateMonster(c.id, true);
    m.name = `Monster ${i}`;
    return m;
  });
  for (let i = 0; i < 600; i++)
    addMonsterPlacement(
      c,
      c.monsters[i % 120].id,
      {
        dungeonId: i % 2 ? d.id : other.id,
        roomId: i % 2 ? d.rooms[i % 4].id : null,
      },
      1 + (i % 5),
      `Placement ${i}`,
    );
  const parsed = parseImport(
    JSON.stringify({ schemaVersion: 4, campaign: c }),
  )[0];
  assert.equal(parsed.monsters.length, 120);
  assert.equal(parsed.monsterPlacements.length, 600);
  assert.deepEqual(parsed, c);
  assert.deepEqual(monsterRelationIssues(parsed), []);
  const copy = cloneCampaign(parsed);
  assert.equal(new Set(campaignIds(copy)).size, campaignIds(copy).length);
  assert.deepEqual(monsterRelationIssues(copy), []);
  validateCampaign(copy);
});
test('Monster content and placement edits update only the appropriate record timestamps', () => {
  const { c, d, other, m } = fixture();
  m.updatedAt = '2020-01-01T00:00:00.000Z';
  const unchanged = structuredClone(other);
  applyCampaignEdit(
    c,
    () => patchMonsterScalar(m, 'notes', 'New'),
    '2030-01-01T00:00:00.000Z',
  );
  assert.equal(m.updatedAt, '2030-01-01T00:00:00.000Z');
  const p = addMonsterPlacement(c, m.id, { dungeonId: d.id, roomId: null });
  d.updatedAt = '2020-01-01T00:00:00.000Z';
  editMonsterPlacement(c, p.id, { quantity: 3 });
  assert.notEqual(d.updatedAt, '2020-01-01T00:00:00.000Z');
  assert.deepEqual(other, unchanged);
});
ruleTest(
  'Fixed source creatures preserve action tables, attack options, loot and additional book citations',
  () => {
    const creatures = getRules()!.creatures;
    const c = createCampaign('Presets');
    const uber = loadMonsterPreset(
      c.id,
      creatures.find((x) => x.name === 'The Übertaker')!,
    );
    assert.ok(uber.special.some((s) => /d4.*1:/s.test(s.text)));
    assert.ok(uber.loot.length);
    assert.equal(uber.generation!.system, 'preset');
    const borg = loadMonsterPreset(
      c.id,
      creatures.find((x) => x.name === 'Borg Bitor')!,
    );
    assert.match(borg.sources!.hp, /63/);
    assert.match(borg.notes, /Valuation/);
    assert.equal(borg.loot.length, 0);
    const thinx = loadMonsterPreset(
      c.id,
      creatures.find((x) => x.name === 'Thinx')!,
    );
    assert.ok(thinx.attacks.length > 1);
    assert.ok(thinx.special.length);
    assert.throws(() =>
      loadMonsterPreset(
        c.id,
        creatures.find((x) => x.name === 'Rotten Nurse')!,
      ),
    );
    c.monsters.push(uber, borg, thinx);
    validateCampaign(c);
  },
);
