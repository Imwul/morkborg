import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { setRules, getRules } from '../src/storage/rulesStore.ts';
import {
  loadMonsterPreset,
  eatPreyKillCreatures,
  generateEatPreyKillMonster,
  rerollMonsterField,
} from '../src/generators/monster.ts';
import { createCampaign, createDungeon } from '../src/generators/index.ts';
import {
  beginMonsterDraft,
  saveMonsterDraft,
} from '../src/domain/monsterOperations.ts';
import { validateCampaign } from '../src/storage/schema.ts';
import { regions } from '../src/data/regions.ts';

if (existsSync('public/rules/library.json'))
  setRules(JSON.parse(readFileSync('public/rules/library.json', 'utf8')));
const available = !!getRules()?.notes.eatPreyKill;
test('a fixed FERETORY creature retains its actual source and does not reroll HP', () => {
  const m = loadMonsterPreset('fixture', {
    book: 'feretory',
    pdfPage: 14,
    name: 'Test fixture',
    hp: 7,
    morale: 6,
    armor: 'None',
    attack: 'Test attack',
    damage: 'd4',
    specialAbility: 'Test ability',
    depthsReference: 'Sölitary Depths · PDF 26쪽',
  });
  assert.match(m.sources!.name, /FERETORY · Eat Prey Kill · PDF 14/);
  assert.ok(!m.sources!.name.includes('BARE BONES'));
  assert.match(m.sources!.name, /Sölitary Depths · PDF 26쪽/);
  assert.match(m.attacks[0].sources!.damage, /Sölitary Depths · PDF 26쪽/);
  assert.match(m.special[0].source!, /Sölitary Depths · PDF 26쪽/);
  rerollMonsterField(m, 'hp');
  assert.equal(m.hp, 7);
});
test(
  'all seven regional pools use eligible Eat Prey Kill statblocks without mixing TMA',
  { skip: !available },
  () => {
    for (const region of regions) {
      const pool = eatPreyKillCreatures(region.id);
      assert.ok(pool.length > 0, region.name);
      for (let n = 0; n < 30; n++) {
        const m = generateEatPreyKillMonster('fixture', region.id);
        const record = pool.find((p) => p.roll === m.generation!.rolls.entry)!;
        assert.ok(record);
        assert.equal(m.region, region.id);
        assert.equal(m.generation!.system, 'epk');
        assert.equal(m.name, record.name);
        assert.equal(m.hp, record.hp);
        assert.equal(m.armor, record.armor ?? '');
        assert.equal(m.attacks[0]?.damage ?? '', record.damage ?? '');
        assert.match(m.sources!.name, /Eat Prey Kill/);
        assert.ok(!m.sources!.name.includes('PDF 2쪽'));
      }
    }
  },
);
test(
  'new dungeon-targeted monster defaults to EPK and region survives save/reload validation',
  { skip: !available },
  () => {
    const c = createCampaign('EPK fixture');
    const d = createDungeon(c.id, 'Target', 'kergus', true);
    c.dungeons.push(d);
    beginMonsterDraft(c, { dungeonId: d.id, roomId: null });
    assert.equal(c.drafts.monsters!.generation!.system, 'epk');
    assert.equal(c.drafts.monsters!.region, 'kergus');
    const m = saveMonsterDraft(c);
    m.notes = 'Keep this manual note';
    c.workspace.monsterGenerationMode = 'epk';
    c.workspace.monsterRegion = 'kergus';
    const restored = validateCampaign(JSON.parse(JSON.stringify(c)));
    assert.equal(restored.monsters[0].id, m.id);
    assert.equal(restored.monsters[0].region, 'kergus');
    assert.equal(restored.monsters[0].notes, 'Keep this manual note');
    assert.equal(restored.workspace.monsterGenerationMode, 'epk');
    assert.equal(restored.workspace.monsterRegion, 'kergus');
    restored.workspace.monsterGenerationMode = 'tma';
    beginMonsterDraft(restored);
    assert.equal(restored.drafts.monsters!.generation!.system, 'feretory');
  },
);
