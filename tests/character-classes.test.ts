import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import {
  generateCharacter,
  canAddStartingScroll,
  rerollCharacterField,
  rerollCharacterItem,
  patchCharacterScalar,
} from '../src/generators/character.ts';
import {
  characterClasses,
  classArmorForbidden,
  syncCharacterAttachments,
  removeCharacterAttachments,
} from '../src/generators/characterClasses.ts';
import { createCampaign } from '../src/generators/index.ts';
import {
  cloneCampaign,
  cloneCharacter,
  campaignIds,
} from '../src/domain/operations.ts';
import { validateCampaign, parseImport } from '../src/storage/schema.ts';
import { setRules, getRules } from '../src/storage/rulesStore.ts';
import { setOraclePack, getOraclePack } from '../src/storage/oracleStore.ts';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import {
  pairedOracleProcedure,
  rollProcedure,
} from '../src/generators/oracleRoller.ts';
const available =
  existsSync('public/rules/library.json') &&
  existsSync('public/rules/oracles.json');
if (available) {
  setRules(JSON.parse(readFileSync('public/rules/library.json', 'utf8')));
  setOraclePack(JSON.parse(readFileSync('public/rules/oracles.json', 'utf8')));
}
const privateData = { skip: !available };
test(
  'Classless creation includes both missing background tables and complete inventory',
  privateData,
  () => {
    const ch = generateCharacter(crypto.randomUUID());
    assert.equal(ch.traits.length, 3);
    assert.deepEqual(
      ch.background?.map((b) => b.tableId),
      ['core.badHabits', 'core.troublingTales'],
    );
    assert.ok(ch.armor && ch.weapons.length && ch.silver > 0);
    assert.equal(
      ch.equipment.filter((e) => !e.slot?.startsWith('feature:')).length,
      5,
    );
    assert.ok(ch.background!.every((b) => b.text && b.source));
  },
);
test(
  'all 12 source classes complete creation and enforce class-specific dice and armor restrictions',
  privateData,
  () => {
    assert.equal(characterClasses().length, 12);
    for (const def of characterClasses())
      for (let i = 0; i < 20; i++) {
        const c = createCampaign('Class rules');
        const ch = generateCharacter(c.id, false, def.id);
        c.characters = [ch];
        assert.equal(ch.classId, def.id);
        assert.equal(ch.className, def.name);
        assert.equal(ch.hp, ch.maxHp);
        assert.equal(
          ch.maxHp,
          Math.max(1, ch.toughness + ch.generation!.rolls.hpDie),
        );
        assert.ok(
          ch.generation!.rolls.hpDie >= 1 &&
            ch.generation!.rolls.hpDie <= def.hpDie,
        );
        assert.ok(
          ch.silver >= def.silver.count * def.silver.multiplier &&
            ch.silver <=
              def.silver.count * def.silver.sides * def.silver.multiplier,
        );
        assert.ok(ch.background!.some((b) => b.tableId === 'core.badHabits'));
        assert.ok(ch.classFeatures!.length >= 2);
        if (classArmorForbidden(ch)) assert.equal(ch.armor, 'No armor');
        if (def.id === 'wretched-royalty')
          assert.doesNotMatch(ch.armor, /Heavy/);
        if (def.forbidScrolls)
          assert.ok(!ch.equipment.some((e) => /scroll/i.test(e.text)));
        if (def.id === 'shedding-vicar')
          assert.ok(
            [1, 2].includes(
              ch.equipment.filter((e) => e.slot === 'classScroll').length,
            ),
          );
        if (def.id === 'occult-herbmaster') {
          assert.equal(
            ch.classFeatures!.filter((e) => e.slot === 'decoction').length,
            2,
          );
          assert.ok(
            ch.generation!.rolls.decoctionDoses >= 1 &&
              ch.generation!.rolls.decoctionDoses <= 4,
          );
        }
        if (
          def.id === 'pale-one' &&
          ch.classFeatures!.some(
            (f) =>
              f.tableId === 'feretory.paleOneBlessings' && f.entryRoll === 1,
          )
        )
          assert.ok(ch.omens >= 3 && ch.omens <= 6);
        validateCampaign(c);
      }
  },
);
test(
  'class rerolls retain class formulas and preserve unrelated manual fields',
  privateData,
  () => {
    const ch = generateCharacter(crypto.randomUUID(), false, 'shedding-vicar');
    patchCharacterScalar(ch, 'hp', 0);
    ch.notes = '한글 기록';
    const before = structuredClone(ch);
    rerollCharacterField(ch, 'presence');
    assert.equal(ch.hp, 0);
    assert.equal(ch.notes, before.notes);
    assert.deepEqual(ch.equipment, before.equipment);
    rerollCharacterField(ch, 'armor');
    assert.equal(ch.armor, 'No armor');
    const weapon = ch.weapons.find((w) => w.slot === 'startingWeapon')!;
    rerollCharacterItem(ch, 'weapons', weapon.id);
    assert.equal(ch.weapons[0].id, weapon.id);
    assert.deepEqual(ch.classFeatures, before.classFeatures);
  },
);
test(
  'class features and backgrounds retain identity through save, clone and JSON import',
  privateData,
  () => {
    const c = createCampaign('Class persistence');
    c.characters = [generateCharacter(c.id, false, 'forlorn-philosopher')];
    assert.deepEqual(
      parseImport(JSON.stringify({ schemaVersion: 4, campaign: c }))[0],
      c,
    );
    const copy = cloneCharacter(c.characters[0]);
    assert.notEqual(
      copy.classFeatures![0].id,
      c.characters[0].classFeatures![0].id,
    );
    assert.notEqual(copy.background![0].id, c.characters[0].background![0].id);
    const cloned = cloneCampaign(c);
    const used = new Set(campaignIds(c));
    assert.ok(campaignIds(cloned).every((id) => !used.has(id)));
    validateCampaign(cloned);
  },
);
test(
  'Action and Descriptor select complementary columns; other tables roll twice independently',
  privateData,
  () => {
    const registry = buildOracleRegistry(getRules(), getOraclePack());
    for (const group of ['action', 'descriptor']) {
      const table = registry.tables.find(
        (t) => t.id === `mythic2.meaning.${group}-2`,
      )!;
      const p = pairedOracleProcedure(table, registry);
      assert.deepEqual(p.oracleIds, [
        `mythic2.meaning.${group}-1`,
        `mythic2.meaning.${group}-2`,
      ]);
      let n = 0;
      const result = rollProcedure(p, registry, () => (n++ === 0 ? 0 : 0.99));
      assert.deepEqual(
        result.rolls.map((r) => r.roll),
        [1, 100],
      );
    }
    const t = registry.tables.find(
      (t) => t.id === 'mythic2.meaning.locations',
    )!;
    const p = pairedOracleProcedure(t, registry);
    assert.deepEqual(p.oracleIds, [t.id, t.id]);
    let n = 0;
    assert.deepEqual(
      rollProcedure(p, registry, () => (n++ === 0 ? 0.2 : 0.4)).rolls.map(
        (r) => r.roll,
      ),
      [21, 41],
    );
  },
);

test(
  'scroll rerolls check class weapon and armor limits independently',
  privateData,
  () => {
    const priest = generateCharacter(
      crypto.randomUUID(),
      false,
      'heretical-priest',
    );
    priest.weapons = [
      {
        id: crypto.randomUUID(),
        text: 'Bow; 11 arrows',
        damage: 'd6',
        slot: 'startingWeapon',
      },
    ];
    priest.armor = 'Medium armor −d4';
    assert.equal(canAddStartingScroll(priest), true);
    priest.armor = 'Heavy armor −d6';
    assert.equal(canAddStartingScroll(priest), false);
    const royalty = generateCharacter(
      crypto.randomUUID(),
      false,
      'wretched-royalty',
    );
    royalty.weapons = [
      {
        id: crypto.randomUUID(),
        text: 'Flail',
        damage: 'd8',
        slot: 'startingWeapon',
      },
    ];
    royalty.armor = 'Light armor −d2';
    assert.equal(canAddStartingScroll(royalty), true);
    royalty.armor = 'Heavy armor −d6';
    assert.equal(canAddStartingScroll(royalty), false);
    assert.match(
      generateCharacter(
        crypto.randomUUID(),
        false,
        'fanged-deserter',
      ).weapons.find((w) => w.slot === 'fangedBite')!.text,
      /DR10/,
    );
  },
);

test(
  'trait and background attachments follow their stable owner through reroll and cloning',
  privateData,
  () => {
    const ch = generateCharacter(crypto.randomUUID(), true);
    const feature = {
      id: crypto.randomUUID(),
      text: 'source hook',
      tableId: 'core.bodies',
      entryRoll: 6,
      source: 'core',
    };
    ch.traits = [feature];
    syncCharacterAttachments(ch, feature);
    assert.equal(ch.weapons[0].damage, 'd6');
    assert.equal(ch.weapons[0].slot, `feature:${feature.id}`);
    const manual = {
      id: crypto.randomUUID(),
      text: 'Manual sword',
      damage: 'd8',
      slot: 'manual',
    };
    ch.weapons.push(manual);
    syncCharacterAttachments(ch, feature);
    assert.equal(ch.weapons.length, 2);
    const skull = {
      id: crypto.randomUUID(),
      text: 'skull',
      tableId: 'core.badHabits',
      entryRoll: 7,
      source: 'core',
    };
    ch.background = [skull];
    syncCharacterAttachments(ch, skull);
    assert.equal(ch.equipment.length, 1);
    const copy = cloneCharacter(ch);
    assert.ok(
      copy.weapons.some((w) => w.slot === `feature:${copy.traits[0].id}`),
    );
    assert.equal(copy.equipment[0].slot, `feature:${copy.background![0].id}`);
    const campaign = createCampaign('Attachment references');
    ch.campaignId = campaign.id;
    campaign.characters = [ch];
    const cloned = cloneCampaign(campaign).characters[0];
    assert.equal(
      cloned.equipment[0].slot,
      `feature:${cloned.background![0].id}`,
    );
    feature.entryRoll = 1;
    syncCharacterAttachments(ch, feature);
    assert.deepEqual(ch.weapons, [manual]);
    removeCharacterAttachments(ch, skull.id);
    assert.equal(ch.equipment.length, 0);
  },
);
