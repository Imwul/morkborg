import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import {
  createCampaign,
  createDungeon,
  createRoom,
} from '../src/generators/index.ts';
import {
  generateCharacter,
  patchCharacterScalar,
  rerollCharacterField,
  rerollCharacterItem,
  rollEquipmentSlot,
  rollWeapon,
  rollArmor,
} from '../src/generators/character.ts';
import {
  applyCampaignEdit,
  campaignIds,
  cloneCampaign,
  cloneCharacter,
  deleteEntity,
  importCampaigns,
  saveCharacterDraft,
  updateWorkspace,
} from '../src/domain/operations.ts';
import {
  emptySave,
  loadStoredSave,
  STORAGE_KEY,
  V2_STORAGE_KEY,
  LEGACY_STORAGE_KEY,
  MIGRATION_BACKUP_KEY,
} from '../src/storage/migrations.ts';
import {
  validateSave,
  validateCampaign,
  parseImport,
} from '../src/storage/schema.ts';
import { setRules, getRules } from '../src/storage/rulesStore.ts';
const hasRules = existsSync('public/rules/library.json');
if (hasRules)
  setRules(JSON.parse(readFileSync('public/rules/library.json', 'utf8')));
const bookTest = { skip: !hasRules };
class MemoryStorage {
  values = new Map<string, string>();
  fail = '';
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
function oldCharacter(hp = 4, status = 'Alive') {
  return {
    id: crypto.randomUUID(),
    name: 'Börda',
    archetype: 'Fanged Deserter',
    hp,
    strength: 1,
    agility: 0,
    presence: -1,
    toughness: 2,
    armor: 'Light armor',
    weapons: 'Sword d6; original note',
    equipment: 'scroll; sentence;\nsecond line',
    omens: 2,
    silver: 70,
    description: 'Trait one; original description.\n한글',
    notes: 'Character notes',
    status,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-02T00:00:00.000Z',
    sources: { equipment: 'Book source', archetype: '직접 작성' },
  };
}
test('v2 migration preserves existing characters, draft, dungeon rooms, selection and original bytes', () => {
  const c = createCampaign('Existing');
  c.dungeons.push(createDungeon(c.id, 'Existing Dungeon', 'sarkash', true));
  c.dungeons[0].rooms.push(createRoom('sarkash', true));
  c.dungeons[0].notes = 'Dungeon Notes';
  const legacy = oldCharacter(),
    draft = oldCharacter(0, 'Dead');
  const old = {
    ...c,
    characters: [legacy],
    drafts: { ...c.drafts, characters: draft },
    workspace: {
      ...c.workspace,
      selected: { ...c.workspace.selected, characters: draft.id },
    },
  };
  const raw = JSON.stringify(
    {
      schemaVersion: 2,
      activeCampaignId: c.id,
      view: 'campaign',
      campaigns: [old],
    },
    null,
    3,
  );
  const storage = new MemoryStorage();
  storage.setItem(V2_STORAGE_KEY, raw);
  storage.setItem(LEGACY_STORAGE_KEY, 'do not merge this old copy');
  storage.setItem('morkborg-codex:pre-v2-backup', 'older backup');
  const result = loadStoredSave(storage);
  const migrated = result.save.campaigns[0];
  assert.equal(result.save.schemaVersion, 4);
  assert.deepEqual(migrated.dungeons, c.dungeons);
  assert.equal(migrated.characters[0].id, legacy.id);
  assert.equal(migrated.characters[0].className, legacy.archetype);
  assert.equal(migrated.characters[0].campaignId, c.id);
  assert.equal(migrated.characters[0].equipment[0].text, legacy.equipment);
  assert.equal(migrated.characters[0].weapons[0].text, legacy.weapons);
  assert.equal(migrated.characters[0].description, legacy.description);
  assert.equal(migrated.characters[0].notes, legacy.notes);
  assert.equal(migrated.characters[0].createdAt, legacy.createdAt);
  assert.equal(migrated.characters[0].updatedAt, legacy.updatedAt);
  assert.equal(migrated.drafts.characters!.hp, 0);
  assert.equal(migrated.drafts.characters!.status, 'dead');
  assert.equal(migrated.workspace.selected.characters, draft.id);
  assert.equal(storage.getItem(V2_STORAGE_KEY), raw);
  assert.equal(JSON.parse(storage.getItem(MIGRATION_BACKUP_KEY)!)[0].raw, raw);
  assert.equal(storage.getItem('morkborg-codex:pre-v2-backup'), 'older backup');
  assert.deepEqual(loadStoredSave(storage).save, result.save);
});
test('legacy current HP and explicit life state survive even at negative and zero HP', () => {
  for (const hp of [-8, 0, 6])
    for (const status of ['Alive', 'Dead']) {
      const c = createCampaign('Legacy');
      const ch = oldCharacter(hp, status);
      const imported = parseImport(
        JSON.stringify({
          schemaVersion: 2,
          campaign: { ...c, characters: [ch] },
        }),
      )[0].characters[0];
      assert.equal(imported.hp, hp);
      assert.equal(imported.status, status.toLowerCase());
      assert.match(imported.sources!.maxHp, /최대 HP 없음/);
    }
});
test('migration adds a missing character library but refuses malformed existing data', () => {
  const c = createCampaign('Missing');
  const { characters, ...without } = c;
  assert.deepEqual(
    validateSave({
      schemaVersion: 2,
      activeCampaignId: null,
      campaigns: [without],
    }).campaigns[0].characters,
    [],
  );
  assert.throws(() =>
    validateSave({
      schemaVersion: 2,
      activeCampaignId: null,
      campaigns: [{ ...c, characters: 'lost' }],
    }),
  );
});
test('v3 migration failure never overwrites v2 and preserves the old v2 backup', () => {
  for (const fail of [MIGRATION_BACKUP_KEY, STORAGE_KEY]) {
    const storage = new MemoryStorage();
    const raw = JSON.stringify({ ...emptySave(), schemaVersion: 2 });
    storage.setItem(V2_STORAGE_KEY, raw);
    storage.fail = fail;
    assert.throws(() => loadStoredSave(storage));
    assert.equal(storage.getItem(V2_STORAGE_KEY), raw);
    assert.equal(storage.getItem(STORAGE_KEY), null);
  }
});
test(
  'new Classless characters contain source-backed separate items and correct starting resources',
  bookTest,
  () => {
    const c = createCampaign('Creation');
    for (let i = 0; i < 100; i++) {
      const ch = generateCharacter(c.id);
      assert.equal(ch.hp, ch.maxHp);
      assert.equal(ch.className, 'Classless');
      assert.equal(ch.status, 'alive');
      assert.equal(ch.campaignId, c.id);
      assert.equal(ch.equipment.length, 5);
      assert.equal(ch.traits.length, 3);
      assert.equal(
        ch.weapons.filter((w) => w.slot === 'startingWeapon').length,
        1,
      );
      const hooks = ch.weapons.filter((w) => w.slot?.startsWith('feature:'));
      assert.equal(
        hooks.length,
        ch.traits.filter(
          (t) => t.tableId === 'core.bodies' && t.entryRoll === 6,
        ).length,
      );
      assert.ok(
        hooks.every(
          (w) =>
            w.text === 'Rusted hand hook' &&
            w.damage === 'd6' &&
            ch.traits.some((t) => w.slot === `feature:${t.id}`),
        ),
      );
      assert.equal(
        ch.maxHp,
        Math.max(1, ch.toughness + ch.generation!.rolls.hpDie),
      );
      assert.ok(
        ch.traits.every((t) =>
          getRules()!.tables[t.tableId!].entries.some((e) => e.text === t.text),
        ),
      );
      assert.ok(ch.equipment.every((e) => e.source));
      c.characters = [ch];
      validateCampaign(c);
    }
  },
);
test(
  'saving the draft keeps every generated UUID and does not duplicate the library entry',
  bookTest,
  () => {
    const c = createCampaign('Draft');
    c.drafts.characters = generateCharacter(c.id);
    const before = structuredClone(c.drafts.characters);
    c.workspace.selected.characters = before.id;
    assert.equal(c.characters.length, 0);
    saveCharacterDraft(c);
    assert.equal(c.characters.length, 1);
    assert.equal(c.drafts.characters, null);
    assert.equal(c.characters[0].id, before.id);
    assert.deepEqual(c.characters[0].equipment, before.equipment);
    assert.deepEqual(c.characters[0].traits, before.traits);
    assert.throws(() => saveCharacterDraft(c));
  },
);
test('character deletion uses UUID and leaves sibling characters, dungeons and notes intact', () => {
  const c = createCampaign('Delete');
  c.notes = 'Campaign';
  c.dungeons.push(createDungeon(c.id, 'Dungeon', 'grift', true));
  const a = generateCharacter(c.id, true),
    b = generateCharacter(c.id, true);
  c.characters = [a, b];
  c.workspace.selected.characters = a.id;
  const dungeon = structuredClone(c.dungeons);
  deleteEntity(c, 'characters', a.id);
  assert.deepEqual(c.characters, [b]);
  assert.equal(c.workspace.selected.characters, null);
  assert.deepEqual(c.dungeons, dungeon);
  assert.equal(c.notes, 'Campaign');
});
test(
  'character duplication refreshes all owned UUIDs and timestamps without sharing editable items',
  bookTest,
  () => {
    const original = generateCharacter(crypto.randomUUID());
    original.createdAt = '2020-01-01T00:00:00.000Z';
    const copy = cloneCharacter(original);
    assert.notEqual(copy.id, original.id);
    assert.notEqual(copy.createdAt, original.createdAt);
    assert.equal(copy.campaignId, original.campaignId);
    assert.equal(copy.name, original.name);
    assert.equal(copy.hp, original.hp);
    assert.notEqual(copy.equipment[0].id, original.equipment[0].id);
    copy.equipment[0].text = 'edited';
    assert.notEqual(copy.equipment[0].text, original.equipment[0].text);
  },
);
test(
  'a single name or trait reroll preserves manual HP, name, notes and unrelated results',
  bookTest,
  () => {
    const ch = generateCharacter(crypto.randomUUID());
    patchCharacterScalar(ch, 'hp', -2);
    ch.notes = 'Kept';
    const before = structuredClone(ch);
    rerollCharacterField(ch, 'name');
    const expected = {
      ...before,
      name: ch.name,
      sources: { ...before.sources, name: ch.sources!.name },
    };
    assert.deepEqual(ch, expected);
    patchCharacterScalar(ch, 'name', 'Hervör');
    const other = structuredClone(ch);
    rerollCharacterItem(ch, 'traits', ch.traits[0].id);
    assert.equal(ch.name, 'Hervör');
    assert.equal(ch.hp, -2);
    assert.deepEqual(ch.traits.slice(1), other.traits.slice(1));
    assert.deepEqual(ch.equipment, other.equipment);
    assert.equal(ch.traits[0].id, other.traits[0].id);
  },
);
test(
  'current and maximum HP are independently editable and zero HP never changes life status',
  bookTest,
  () => {
    const ch = generateCharacter(crypto.randomUUID());
    patchCharacterScalar(ch, 'maxHp', 12);
    patchCharacterScalar(ch, 'hp', 0);
    assert.equal(ch.maxHp, 12);
    assert.equal(ch.hp, 0);
    assert.equal(ch.status, 'alive');
    rerollCharacterField(ch, 'toughness');
    assert.equal(ch.maxHp, 12);
    assert.equal(ch.hp, 0);
    patchCharacterScalar(ch, 'hp', 5);
    assert.equal(ch.maxHp, 12);
  },
);
test(
  'Toughness updates automatic maximum HP using the original d8 but preserves manual current HP',
  bookTest,
  () => {
    const ch = generateCharacter(crypto.randomUUID());
    const die = ch.generation!.rolls.hpDie;
    patchCharacterScalar(ch, 'hp', 2);
    patchCharacterScalar(ch, 'toughness', 3);
    assert.equal(ch.maxHp, Math.max(1, 3 + die));
    assert.equal(ch.hp, 2);
    rerollCharacterField(ch, 'hp');
    assert.equal(ch.hp, ch.maxHp);
    assert.equal(
      ch.maxHp,
      Math.max(1, ch.toughness + ch.generation!.rolls.hpDie),
    );
  },
);
test('numeric editing rejects nonfinite input and clamps accepted numbers without corrupting the record', () => {
  const ch = generateCharacter(crypto.randomUUID(), true);
  const before = structuredClone(ch);
  for (const value of ['bad', NaN, Infinity])
    patchCharacterScalar(ch, 'hp', value);
  assert.deepEqual(ch, before);
  patchCharacterScalar(ch, 'hp', 3.9);
  assert.equal(ch.hp, 3);
  patchCharacterScalar(ch, 'maxHp', -99);
  assert.equal(ch.maxHp, 1);
  patchCharacterScalar(ch, 'silver', 1e20);
  assert.equal(ch.silver, 9999999);
});
test(
  'equipment rerolls preserve all other slots and respect existing starting-gear restrictions',
  bookTest,
  () => {
    const ch = generateCharacter(crypto.randomUUID());
    const before = structuredClone(ch);
    rerollCharacterItem(ch, 'equipment', ch.equipment[3].id);
    assert.deepEqual(ch.weapons, before.weapons);
    assert.equal(ch.armor, before.armor);
    assert.deepEqual(
      ch.equipment.filter((_, i) => i !== 3),
      before.equipment.filter((_, i) => i !== 3),
    );
    ch.armor = 'Heavy armor';
    ch.weapons = [{ id: crypto.randomUUID(), text: 'Bow', damage: 'd6' }];
    for (let i = 0; i < 80; i++)
      assert.doesNotMatch(rollEquipmentSlot('gearA', ch).text, /scroll/i);
    ch.equipment = [{ id: crypto.randomUUID(), text: 'sacred scroll' }];
    for (let i = 0; i < 50; i++) {
      assert.doesNotMatch(rollWeapon(ch).text, /Bow|Crossbow|Flail|Zweihänder/);
      assert.doesNotMatch(String(rollArmor(ch).value), /Medium|Heavy/);
    }
  },
);
test(
  'drafts and saved characters survive navigation and reload while all three notes remain separate',
  bookTest,
  () => {
    const c = createCampaign('Notes');
    c.notes = 'Campaign';
    c.dungeons.push(createDungeon(c.id, 'Dungeon', 'kergus', true));
    c.dungeons[0].notes = 'Dungeon';
    const ch = generateCharacter(c.id);
    ch.notes = 'Character';
    ch.status = 'dead';
    ch.hp = 1;
    ch.maxHp = 7;
    c.characters.push(ch);
    c.drafts.characters = generateCharacter(c.id);
    c.drafts.characters.notes = 'Unsaved draft';
    c.workspace.selected.characters = c.drafts.characters.id;
    const before = structuredClone(c);
    updateWorkspace(c, { section: 'dungeons' });
    updateWorkspace(c, { section: 'characters' });
    const storage = new MemoryStorage();
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...emptySave(),
        campaigns: [c],
        activeCampaignId: c.id,
        view: 'campaign',
      }),
    );
    const restored = loadStoredSave(storage).save.campaigns[0];
    assert.deepEqual(restored.characters, before.characters);
    assert.deepEqual(restored.drafts, before.drafts);
    assert.equal(restored.notes, 'Campaign');
    assert.equal(restored.dungeons[0].notes, 'Dungeon');
    assert.equal(restored.characters[0].notes, 'Character');
  },
);
test(
  'campaign JSON import collision remaps characters and inventory as well as dungeons without overwriting',
  bookTest,
  () => {
    const c = createCampaign('Export');
    c.characters = [generateCharacter(c.id), generateCharacter(c.id)];
    c.drafts.characters = generateCharacter(c.id);
    c.dungeons = [createDungeon(c.id, 'Existing', 'graven-tosk', true)];
    c.dungeons[0].rooms = [createRoom('graven-tosk', true)];
    c.characters[0].status = 'dead';
    c.characters[0].notes = 'Manual notes';
    c.characters[0].hp = 2;
    c.characters[0].maxHp = 8;
    const raw = JSON.stringify({ schemaVersion: 3, campaign: c });
    assert.deepEqual(parseImport(raw)[0], c);
    const save = { ...emptySave(), campaigns: [c] };
    const original = structuredClone(c);
    importCampaigns(save, parseImport(raw));
    assert.deepEqual(save.campaigns[0], original);
    const imported = save.campaigns[1];
    const used = new Set(campaignIds(c));
    assert.ok(campaignIds(imported).every((id) => !used.has(id)));
    assert.ok(imported.characters.every((ch) => ch.campaignId === imported.id));
    assert.equal(imported.drafts.characters!.campaignId, imported.id);
    assert.equal(imported.characters[0].notes, 'Manual notes');
    assert.equal(imported.characters[0].status, 'dead');
    assert.equal(imported.characters[0].maxHp, 8);
    validateSave(save);
    const copied = cloneCampaign(c);
    validateCampaign(copied);
    assert.equal(copied.characters.length, 2);
    assert.equal(copied.dungeons.length, 1);
  },
);
test('120 independent characters remain valid, and only the edited character gets a new timestamp', () => {
  const c = createCampaign('Many');
  c.characters = Array.from({ length: 120 }, () =>
    generateCharacter(c.id, true),
  );
  const original = structuredClone(c.characters);
  const stamp = '2030-01-01T00:00:00.000Z';
  applyCampaignEdit(
    c,
    (next) => {
      next.characters[87].notes = 'Only this one';
    },
    stamp,
  );
  assert.equal(c.characters[87].updatedAt, stamp);
  assert.deepEqual(
    c.characters.filter((_, i) => i !== 87),
    original.filter((_, i) => i !== 87),
  );
  const restored = parseImport(
    JSON.stringify({ schemaVersion: 3, campaign: c }),
  )[0];
  assert.deepEqual(restored, c);
});
test(
  'invalid character ownership and duplicate item IDs are rejected before import',
  bookTest,
  () => {
    const c = createCampaign('Invalid');
    c.characters = [generateCharacter(c.id)];
    const valid = structuredClone(c);
    c.characters[0].campaignId = crypto.randomUUID();
    assert.throws(() => validateCampaign(c), /another campaign/);
    valid.characters[0].equipment[0].id = valid.characters[0].id;
    assert.throws(() => validateCampaign(valid), /duplicate IDs/);
  },
);
