import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { setRules, getRules } from '../src/storage/rulesStore.ts';
import {
  createCampaign,
  createDungeon,
  createDungeonCandidate,
  createRoom,
  generateEntity,
  generateEntityRoll,
  feretoryStats,
  abilityModifier,
  loadPreset,
  generateDungeonRoll,
} from '../src/generators/index.ts';
import {
  cloneCampaign,
  selectDungeonCandidate,
  cloneDungeon,
  assignEntity,
  deleteEntity,
} from '../src/domain/operations.ts';
import {
  validateSave,
  parseImport,
  validateCampaign,
} from '../src/storage/schema.ts';
import { weightedPick } from '../src/generators/random.ts';
import {
  generateMonster,
  rerollMonsterSpecial,
} from '../src/generators/monster.ts';
import { generateCharacter } from '../src/generators/character.ts';
const hasRules = existsSync('public/rules/library.json');
if (hasRules)
  setRules(JSON.parse(readFileSync('public/rules/library.json', 'utf8')));
test('ability conversion follows all seven printed brackets', () => {
  assert.deepEqual(
    [1, 4, 5, 6, 7, 8, 9, 12, 13, 14, 15, 16, 17, 20].map(abilityModifier),
    [-3, -3, -2, -2, -1, -1, 0, 0, 1, 1, 2, 2, 3, 3],
  );
});
test('weighted table boundaries preserve source multiplicities', () => {
  const t = [
    { value: 'first', weight: 3 },
    { value: 'second', weight: 1 },
    { value: 'third', weight: 6 },
  ];
  assert.equal(
    weightedPick(t, () => 0.2999),
    'first',
  );
  assert.equal(
    weightedPick(t, () => 0.3),
    'second',
  );
  assert.equal(
    weightedPick(t, () => 0.4),
    'third',
  );
});
test('Feretory uses linked A/B/C and explicitly preserves armor ties', () => {
  for (const rolls of [
    { A: 1, B: 7, C: 8 },
    { A: 12, B: 12, C: 12 },
    { A: 9, B: 3, C: 4 },
  ]) {
    const r = feretoryStats(rolls);
    assert.equal(r.morale, Math.max(...Object.values(rolls)));
    assert.equal(r.hp % 2, 0);
    assert.ok(r.hp >= 2 && r.hp <= 2 * r.sides);
  }
  assert.match(feretoryStats({ A: 12, B: 12, C: 1 }).armor, /동률/);
  assert.equal(feretoryStats({ A: 1, B: 2, C: 11 }).armor, '−d4');
  assert.equal(feretoryStats({ A: 1, B: 2, C: 12 }).armor, '−d6');
});
test('invalid import versions never become campaigns', () => {
  assert.throws(() => parseImport('{"schemaVersion":7,"campaigns":[]}'));
  assert.throws(() => parseImport('{bad json'));
});
test(
  'source data produces valid classless characters with scroll equipment restrictions',
  { skip: !hasRules },
  () => {
    for (let i = 0; i < 150; i++) {
      const campaign = createCampaign('Test');
      const c = generateCharacter(campaign.id);
      assert.ok(c.hp >= 1 && c.hp <= 11);
      assert.ok(c.omens >= 1 && c.omens <= 2);
      assert.ok(c.silver >= 20 && c.silver <= 120 && c.silver % 10 === 0);
      assert.ok(
        getRules()!.tables['core.names'].entries.some((e) => e.text === c.name),
      );
      if (c.equipment.some((item) => /scroll/i.test(item.text))) {
        assert.doesNotMatch(
          c.weapons.map((item) => item.text).join('\n'),
          /Bow|Crossbow|Flail|Zweihänder/,
        );
        assert.doesNotMatch(c.armor, /Medium|Heavy/);
      }
      campaign.characters.push(c);
      validateCampaign(campaign);
    }
  },
);
test(
  'stable room references survive ordering, cloning, export and import',
  { skip: !hasRules },
  () => {
    const c = createCampaign('THE ASHEN PSALM');
    const d = createDungeon(
      c.id,
      'The Sepulchre of Seven Tongues',
      'graven-tosk',
    );
    c.dungeons.push(d);
    d.rooms = Array.from({ length: 4 }, () => createRoom(d.region));
    const targetId = d.rooms[1].id;
    const m = generateMonster(c.id);
    c.drafts.monsters = m;
    c.workspace.selected.monsters = m.id;
    assignEntity(c, 'monsters', m.id, d.id, targetId);
    assignEntity(c, 'monsters', m.id, d.id, d.rooms[3].id);
    assert.equal(c.monsters.length, 1);
    assert.equal(d.monsterIds.length, 1);
    assert.equal(c.drafts.monsters, null);
    d.rooms.reverse();
    assert.ok(
      d.rooms.find((r) => r.id === targetId)!.monsterIds.includes(m.id),
    );
    c.workspace.dungeonId = d.id;
    c.workspace.roomId = targetId;
    const imported = parseImport(
      JSON.stringify({ schemaVersion: 1, campaign: c }),
    )[0];
    assert.deepEqual(imported, c);
    const copy = cloneCampaign(c);
    validateCampaign(copy);
    assert.notEqual(copy.id, c.id);
    assert.notEqual(copy.monsters[0].id, m.id);
    assert.ok(
      copy.dungeons[0].rooms.some((r) =>
        r.monsterIds.includes(copy.monsters[0].id),
      ),
    );
    assert.equal(copy.workspace.roomId, copy.dungeons[0].rooms[2].id);
    const dungeonCopy = cloneDungeon(d);
    assert.notEqual(dungeonCopy.rooms[0].id, d.rooms[0].id);
    assert.deepEqual(dungeonCopy.monsterIds, d.monsterIds);
    deleteEntity(c, 'monsters', m.id);
    assert.equal(d.monsterIds.length, 0);
    assert.ok(d.rooms.every((r) => r.monsterIds.length === 0));
    validateCampaign(c);
  },
);
test(
  'missing references and duplicate IDs are rejected before importing',
  { skip: !hasRules },
  () => {
    const c = createCampaign('Test');
    const d = createDungeon(c.id, 'Test', 'sarkash');
    c.dungeons.push(d);
    d.monsterIds.push(crypto.randomUUID());
    assert.throws(() => validateCampaign(c), /missing library reference/);
    d.monsterIds = [];
    c.dungeons.push(structuredClone(d));
    assert.throws(() => validateCampaign(c), /duplicate IDs/);
  },
);
test(
  'single reroll changes only the targeted field and retains its citation',
  { skip: !hasRules },
  () => {
    const d = createDungeon(crypto.randomUUID(), 'Door test', 'sarkash');
    const before = structuredClone(d);
    const result = generateEntityRoll('monsters', 'specialAbility', 'sarkash');
    assert.match(result.source, /FERETORY/);
    const m = generateEntity('monsters', 'sarkash');
    const old = structuredClone(m);
    rerollMonsterSpecial(m, m.special[0].id);
    assert.match(m.special[0].source!, /FERETORY/);
    assert.equal(m.special[0].id, old.special[0].id);
    assert.equal(m.hp, old.hp);
    assert.equal(m.appearance, old.appearance);
    assert.deepEqual(d, before);
  },
);
test(
  'NPC unspecified combat stats remain blank, never fabricated',
  { skip: !hasRules },
  () => {
    const npc = generateEntity('npcs', 'graven-tosk');
    assert.equal(npc.hp, '');
    assert.equal(npc.armor, '');
    assert.equal(npc.attack, '');
    const c = createCampaign('NPC');
    c.npcs.push(npc);
    validateCampaign(c);
  },
);
test(
  'drafts remain outside library and round-trip with workspace context',
  { skip: !hasRules },
  () => {
    const c = createCampaign('Drafts');
    const m = generateMonster(c.id);
    c.drafts.monsters = m;
    c.workspace.selected.monsters = m.id;
    c.workspace.section = 'monsters';
    const s = validateSave({
      schemaVersion: 1,
      campaigns: [c],
      activeCampaignId: c.id,
    });
    assert.equal(s.campaigns[0].monsters.length, 0);
    assert.equal(s.campaigns[0].drafts.monsters!.id, m.id);
  },
);

test(
  'regional dungeon traits retain both book citations without replacing common tables',
  { skip: !hasRules },
  () => {
    const regional = generateDungeonRoll('distinctiveFeature', 'graven-tosk');
    assert.match(regional.source, /Graven-Tosk/);
    assert.match(regional.source, /BARE BONES/);
    assert.doesNotMatch(
      generateDungeonRoll('distinctiveFeature', 'grift').source,
      /Depths/,
    );
  },
);
test(
  'fixed book creatures and NPCs retain attack tables and special rules',
  { skip: !hasRules },
  () => {
    const pack = getRules()!;
    const boss = loadPreset(
      'monsters',
      pack.creatures.find((e) => e.name === 'The Übertaker')!,
    );
    assert.match(
      'special' in boss ? boss.special.map((s) => s.text).join('\n') : '',
      /d4|1:/,
    );
    assert.equal(boss.generation?.system, 'preset');
    for (const record of pack.outcasts.filter(
      (e) => typeof e.hp === 'number',
    )) {
      const npc = loadPreset('npcs', record);
      if (typeof record.specialAbility === 'string')
        assert.ok(npc.specialAbility?.includes(record.specialAbility));
    }
  },
);
test(
  'incomplete source imports cannot replace the working rules pack',
  { skip: !hasRules },
  () => {
    const pack = getRules()!;
    const partial = structuredClone(pack);
    delete partial.tables['feretory.A'];
    assert.throws(() => setRules(partial), /feretory.A/);
    assert.equal(getRules(), pack);
  },
);

test(
  'dungeon candidates generate a title, all overview fields and four rooms without saving',
  { skip: !hasRules },
  () => {
    const c = createCampaign('Preview');
    const draft = createDungeonCandidate(c.id, 'kergus');
    assert.ok(draft.title.trim());
    assert.equal(draft.rooms.length, 4);
    assert.equal(c.dungeons.length, 0);
    for (const key of [
      'premise',
      'status',
      'formerPurpose',
      'inhabitants',
      'motive',
      'entrance',
      'entranceCondition',
      'distinctiveFeature',
      'environmentalDanger',
      'weirdPhenomenon',
      'treasure',
    ] as const)
      assert.ok(draft[key].trim(), key);
    assert.ok(draft.rooms.every((r) => r.name && r.description));
  },
);
test(
  'preview edits and room IDs survive JSON, clone and choosing the exact candidate',
  { skip: !hasRules },
  () => {
    const c = createCampaign('Preview');
    c.dungeonDraft = createDungeonCandidate(c.id, 'sarkash');
    c.workspace.dungeonPreview = true;
    c.dungeonDraft.distinctiveFeature = '직접 편집한 한글 기록';
    const d = structuredClone(c.dungeonDraft);
    const imported = parseImport(
      JSON.stringify({ schemaVersion: 1, campaign: c }),
    )[0];
    assert.deepEqual(imported, c);
    const clone = cloneCampaign(c);
    validateCampaign(clone);
    assert.notEqual(clone.dungeonDraft!.id, d.id);
    assert.equal(clone.dungeonDraft!.campaignId, clone.id);
    assert.notEqual(clone.dungeonDraft!.rooms[0].id, d.rooms[0].id);
    selectDungeonCandidate(c, d.title);
    assert.equal(c.dungeonDraft, null);
    assert.equal(c.dungeons.length, 1);
    assert.equal(c.dungeons[0].id, d.id);
    assert.deepEqual(c.dungeons[0].rooms, d.rooms);
    assert.equal(c.dungeons[0].distinctiveFeature, d.distinctiveFeature);
    assert.equal(c.workspace.dungeonPreview, false);
    validateCampaign(c);
  },
);
test(
  'occult treasure rolls contain ten actual results, never a PDF page heading',
  { skip: !hasRules },
  () => {
    const entries = getRules()!.tables['core.treasures'].entries;
    assert.equal(entries.length, 10);
    assert.equal(
      entries.reduce((sum, e) => sum + e.weight, 0),
      10,
    );
    assert.ok(
      entries.every((e) => !/^d10\s+Occult treasures$/i.test(e.text.trim())),
    );
  },
);
