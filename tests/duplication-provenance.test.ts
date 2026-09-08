import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { setRules } from '../src/storage/rulesStore.ts';
import { setOraclePack } from '../src/storage/oracleStore.ts';
import {
  createCampaign,
  createDungeonCandidate,
} from '../src/generators/index.ts';
import {
  generateMonster,
  patchMonsterScalar,
} from '../src/generators/monster.ts';
import { generateCharacter } from '../src/generators/character.ts';
import { createNPC, createEncounter } from '../src/generators/content.ts';
import {
  cloneCampaign,
  cloneCharacter,
  cloneDungeon,
} from '../src/domain/operations.ts';
import {
  cloneMonster,
  duplicateDungeon,
} from '../src/domain/monsterOperations.ts';
import { cloneContent } from '../src/domain/contentOperations.ts';
import { editedProvenance } from '../src/domain/generationProvenance.ts';
import { markCopiedIdentity } from '../src/domain/duplicationProvenance.ts';

const path = 'outputs/morkborg-private-data.json';
const fixture = existsSync(path)
  ? JSON.parse(readFileSync(path, 'utf8'))
  : null;
const sourceTest = { skip: !fixture };
if (fixture) {
  setRules(fixture.library);
  setOraclePack(fixture.oracles);
}
function provenanceTree(value: unknown): unknown[] {
  if (!value || typeof value !== 'object') return [];
  if (Array.isArray(value)) return value.flatMap(provenanceTree);
  const item = value as Record<string, unknown>;
  return [
    ...(item.fieldProvenance ? [item.fieldProvenance] : []),
    ...(item.provenance ? [item.provenance] : []),
    ...Object.entries(item)
      .filter(([key]) => !['fieldProvenance', 'provenance'].includes(key))
      .flatMap(([, child]) => provenanceTree(child)),
  ];
}
test(
  'Monster, NPC, encounter and character clones copy source metadata and edited origins exactly',
  sourceTest,
  () => {
    const monster = generateMonster('qa');
    patchMonsterScalar(monster, 'wants', 'Manual motive');
    const npc = createNPC('qa');
    npc.name = 'Manual NPC';
    npc.fieldProvenance!.name = editedProvenance(npc.fieldProvenance!.name);
    const encounter = createEncounter('qa');
    const character = generateCharacter('qa', false, 'classless');
    for (const [source, copy] of [
      [monster, cloneMonster(monster)],
      [npc, cloneContent(npc)],
      [encounter, cloneContent(encounter)],
      [character, cloneCharacter(character)],
    ]) {
      assert.notEqual(copy.id, source.id);
      assert.deepEqual(provenanceTree(copy), provenanceTree(source));
      assert.notEqual(copy.fieldProvenance, source.fieldProvenance);
    }
  },
);
test(
  'Dungeon duplication changes IDs and labels without changing room source metadata or original title snapshots',
  sourceTest,
  () => {
    const c = createCampaign('QA');
    const d = createDungeonCandidate(c.id, 'sarkash');
    c.dungeons.push(d);
    const original = structuredClone(d);
    const direct = cloneDungeon(d);
    const copied = duplicateDungeon(c, d.id);
    for (const copy of [direct, copied]) {
      assert.notEqual(copy.id, d.id);
      assert.equal(copy.title, d.title + ' — copy');
      assert.equal(copy.fieldProvenance!.title.classification, 'APP_DERIVED');
      assert.deepEqual(
        copy.fieldProvenance!.title.sourceText,
        d.fieldProvenance!.title.sourceText,
      );
      assert.deepEqual(
        copy.fieldProvenance!.title.rolls,
        d.fieldProvenance!.title.rolls,
      );
      copy.rooms.forEach((room, index) => {
        assert.notEqual(room.id, d.rooms[index].id);
        assert.deepEqual(provenanceTree(room), provenanceTree(d.rooms[index]));
      });
    }
    assert.deepEqual(d, original);
  },
);
test(
  'Copy labels preserve manual origin and never falsely claim a verbatim name',
  sourceTest,
  () => {
    const monster = generateMonster('qa');
    monster.fieldProvenance!.name = {
      ...monster.fieldProvenance!.name,
      classification: 'SOURCE_VERBATIM',
      sourceText: ['Example saved source name'],
    };
    const sourceSnapshot = structuredClone(monster.fieldProvenance!.name);
    monster.name += ' — copy';
    markCopiedIdentity(monster, 'name');
    assert.equal(monster.fieldProvenance!.name.classification, 'APP_DERIVED');
    assert.deepEqual(
      monster.fieldProvenance!.name.sourceText,
      sourceSnapshot.sourceText,
    );
    monster.fieldProvenance!.name = editedProvenance(sourceSnapshot);
    markCopiedIdentity(monster, 'name');
    assert.equal(monster.fieldProvenance!.name.origin, 'source-edited');
    assert.equal(monster.fieldProvenance!.name.classification, 'USER_AUTHORED');
  },
);
test(
  'Campaign duplication preserves all nested source metadata and manual origins exactly',
  sourceTest,
  () => {
    const c = createCampaign('QA');
    c.dungeons.push(createDungeonCandidate(c.id, 'sarkash'));
    c.monsters.push(generateMonster(c.id));
    patchMonsterScalar(c.monsters[0], 'wants', 'Edited before duplicate');
    c.npcs.push(createNPC(c.id));
    c.encounters.push(createEncounter(c.id));
    c.characters.push(generateCharacter(c.id, false, 'classless'));
    const copy = cloneCampaign(c);
    assert.notEqual(copy.id, c.id);
    assert.deepEqual(provenanceTree(copy), provenanceTree(c));
    assert.notEqual(copy.dungeons[0].rooms[0].id, c.dungeons[0].rooms[0].id);
  },
);
