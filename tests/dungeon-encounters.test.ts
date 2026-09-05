import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createCampaign,
  createDungeon,
  createRoom,
} from '../src/generators/index.ts';
import { createEncounter } from '../src/generators/content.ts';
import { id } from '../src/generators/random.ts';
import type { OracleDefinition, OracleRegistry } from '../src/domain/oracle.ts';
import {
  dungeonEncounterSlots,
  prepareDungeonEncounters,
  rollDungeonEncounter,
  setDungeonEncounterSlot,
  setDungeonEncounterDR,
} from '../src/domain/dungeonEncounters.ts';
import {
  addContentPlacement,
  deleteContent,
} from '../src/domain/contentOperations.ts';
import {
  deleteDungeon,
  deleteRoom,
  duplicateDungeon,
} from '../src/domain/monsterOperations.ts';
import { cloneCampaign, importCampaigns } from '../src/domain/operations.ts';
import { validateCampaign, parseImport } from '../src/storage/schema.ts';
import { emptySave } from '../src/storage/migrations.ts';

function table(id: string, count: number): OracleDefinition {
  return {
    id,
    title: id,
    sourceBookId: id.split('.')[0],
    sourcePage: 19,
    printedPage: 17,
    category: 'ENCOUNTER',
    dice: `d${count}`,
    tags: [],
    sourceVerified: true,
    entries: Array.from({ length: count }, (_, i) => ({
      id: `${id}:${i + 1}`,
      min: i + 1,
      max: i + 1,
      text: `Prepared source result ${i + 1}`,
    })),
  };
}
const registry: OracleRegistry = {
  books: [
    { id: 'sd', title: 'Sölitary Defilement' },
    { id: 'depths', title: 'Sölitary Depths' },
  ],
  tables: [
    table('sd.stockCreatures', 20),
    table('depths.region.sarkash.monsters', 6),
  ],
  procedures: [],
};
function fixture() {
  const c = createCampaign('Fixed encounter tables');
  const d = createDungeon(c.id, 'First dungeon', 'sarkash', true);
  d.rooms = [createRoom('sarkash', true), createRoom('sarkash', true)];
  const other = createDungeon(c.id, 'Second dungeon', 'sarkash', true);
  c.dungeons.push(d, other);
  return { c, d, other };
}
function prepared() {
  const f = fixture();
  prepareDungeonEncounters(f.c, f.d.id, 'common', registry, () => 0.1);
  prepareDungeonEncounters(f.c, f.d.id, 'rare', registry, () => 0.1);
  return f;
}
test('old dungeons expose six empty faces without changing or generating saved content', () => {
  const { c, d } = fixture(),
    before = JSON.stringify(c);
  for (const kind of ['common', 'rare'] as const)
    assert.deepEqual(dungeonEncounterSlots(d, kind), Array(6).fill(null));
  assert.equal(JSON.stringify(c), before);
  assert.equal(validateCampaign(c).dungeons[0].encounterTables, undefined);
});
test('preparation creates exactly six fixed Common and six Rare source-backed entries, not placements', () => {
  const { c, d, other } = prepared();
  assert.equal(c.encounters.length, 12);
  assert.equal(
    new Set([...d.encounterTables!.common, ...d.encounterTables!.rare]).size,
    12,
  );
  assert.equal(
    c.encounters[0].sourceRefs[0].tableId,
    'depths.region.sarkash.monsters',
  );
  assert.equal(c.encounters[6].generation?.rolls.result, 11);
  assert.match(c.encounters[6].sourceRefs[0].note!, /d8 \+ Dungeon DR/);
  assert.deepEqual(c.encounterPlacements, []);
  assert.deepEqual(d.encounterIds, []);
  assert.equal(other.encounterTables, undefined);
  assert.doesNotThrow(() => validateCampaign(c));
});
test('each d6 face selects its stable saved slot, repeatedly, without changing campaign or calling a source generator', () => {
  const { c, d } = prepared(),
    before = JSON.stringify(c);
  for (const kind of ['common', 'rare'] as const)
    for (let face = 1; face <= 6; face++) {
      const result = rollDungeonEncounter(
        c,
        d.id,
        kind,
        () => (face - 0.5) / 6,
      );
      assert.equal(result.roll, face);
      assert.equal(result.encounter.id, d.encounterTables![kind][face - 1]);
      assert.equal(
        rollDungeonEncounter(c, d.id, kind, () => (face - 0.5) / 6).encounter
          .id,
        result.encounter.id,
      );
    }
  assert.equal(JSON.stringify(c), before);
});
test('repeating preparation and changing region or DR preserve completed tables', () => {
  const { c, d } = prepared(),
    slots = structuredClone(d.encounterTables),
    encounters = JSON.stringify(c.encounters);
  d.region = 'grift';
  setDungeonEncounterDR(c, d.id, 14);
  prepareDungeonEncounters(c, d.id, 'common', registry, () => {
    throw Error('must not roll');
  });
  prepareDungeonEncounters(c, d.id, 'rare', registry, () => {
    throw Error('must not roll');
  });
  assert.deepEqual(d.encounterTables!.common, slots!.common);
  assert.deepEqual(d.encounterTables!.rare, slots!.rare);
  assert.equal(JSON.stringify(c.encounters), encounters);
});
test('partial preparation never changes d6 probabilities or silently generates an empty face', () => {
  const { c, d } = fixture();
  prepareDungeonEncounters(c, d.id, 'common', registry, () => 0.1, 2);
  const before = JSON.stringify(c);
  assert.throws(
    () =>
      rollDungeonEncounter(c, d.id, 'common', () => {
        throw Error('must not roll');
      }),
    /여섯 칸/,
  );
  assert.equal(JSON.stringify(c), before);
  const prior = d.encounterTables!.common[2];
  prepareDungeonEncounters(c, d.id, 'common', registry, () => 0.9);
  assert.equal(c.encounters.length, 6);
  assert.equal(d.encounterTables!.common[2], prior);
});
test('a failed multi-slot preparation is atomic', () => {
  const { c, d } = fixture(),
    before = JSON.stringify(c);
  let rolls = 0;
  assert.throws(
    () =>
      prepareDungeonEncounters(c, d.id, 'common', registry, () => {
        if (++rolls === 3) throw Error('source failure');
        return 0.1;
      }),
    /source failure/,
  );
  assert.equal(JSON.stringify(c), before);
});
test('replacing one preparation slot retains the old encounter, notes and existing room placement', () => {
  const { c, d } = prepared(),
    old = d.encounterTables!.common[0]!;
  c.encounters[0].notes = 'Hand-written preparation';
  const placement = addContentPlacement(
    c,
    'encounters',
    old,
    { dungeonId: d.id, roomId: d.rooms[0].id },
    2,
    'Room note',
  );
  prepareDungeonEncounters(c, d.id, 'common', registry, () => 0.9, 0);
  assert.notEqual(d.encounterTables!.common[0], old);
  assert.equal(
    c.encounters.find((e) => e.id === old)?.notes,
    'Hand-written preparation',
  );
  assert.equal(placement.entityId, old);
  assert.equal(placement.notes, 'Room note');
  assert.doesNotThrow(() => validateCampaign(c));
});
test('entry deletion empties its fixed faces without shrinking tables; room deletion does not affect preparation', () => {
  const { c, d } = prepared(),
    old = d.encounterTables!.common[0]!;
  setDungeonEncounterSlot(c, d.id, 'rare', 3, old);
  deleteContent(c, 'encounters', old);
  assert.equal(d.encounterTables!.common[0], null);
  assert.equal(d.encounterTables!.rare[3], null);
  assert.equal(d.encounterTables!.common.length, 6);
  const tables = JSON.stringify(d.encounterTables);
  deleteRoom(c, d.id, d.rooms[0].id);
  assert.equal(JSON.stringify(d.encounterTables), tables);
  assert.doesNotThrow(() => validateCampaign(c));
});
test('duplicating a dungeon copies prepared definitions once and remaps only their copied placements', () => {
  const { c, d } = prepared(),
    old = d.encounterTables!.common[0]!;
  setDungeonEncounterSlot(c, d.id, 'rare', 0, old);
  addContentPlacement(c, 'encounters', old, {
    dungeonId: d.id,
    roomId: d.rooms[0].id,
  });
  const shared = createEncounter(c.id, 'sarkash', 'room', 10, true, registry);
  c.encounters.push(shared);
  addContentPlacement(c, 'encounters', shared.id, {
    dungeonId: d.id,
    roomId: null,
  });
  const copy = duplicateDungeon(c, d.id),
    copiedId = copy.encounterTables!.common[0]!;
  assert.notEqual(copiedId, old);
  assert.equal(copy.encounterTables!.rare[0], copiedId);
  assert.equal(
    c.encounterPlacements.find(
      (p) => p.dungeonId === copy.id && p.roomId === copy.rooms[0].id,
    )?.entityId,
    copiedId,
  );
  assert.ok(
    c.encounterPlacements.some(
      (p) => p.dungeonId === copy.id && p.entityId === shared.id,
    ),
  );
  c.encounters.find((e) => e.id === copiedId)!.text = 'Copy-specific edit';
  assert.notEqual(
    c.encounters.find((e) => e.id === old)!.text,
    'Copy-specific edit',
  );
  assert.doesNotThrow(() => validateCampaign(c));
});
test('reload, JSON roundtrip and campaign collision imports preserve tables and remap their IDs', () => {
  const { c, d } = prepared(),
    restored = parseImport(
      JSON.stringify({ schemaVersion: 6, campaign: c }),
    )[0];
  assert.deepEqual(restored.dungeons[0].encounterTables, d.encounterTables);
  const copy = cloneCampaign(c);
  assert.notDeepEqual(
    copy.dungeons[0].encounterTables!.common,
    d.encounterTables!.common,
  );
  assert.equal(
    copy.encounters.find(
      (e) => e.id === copy.dungeons[0].encounterTables!.common[0],
    )!.text,
    c.encounters[0].text,
  );
  assert.doesNotThrow(() => validateCampaign(copy));
  const save = emptySave();
  save.campaigns.push(c);
  importCampaigns(save, [c]);
  assert.equal(save.campaigns.length, 2);
  assert.doesNotThrow(() => validateCampaign(save.campaigns[1]));
});
test('malformed table lengths and dangling entries are rejected rather than silently discarded', () => {
  const { c, d } = prepared();
  d.encounterTables!.common.pop();
  assert.throws(() => validateCampaign(c));
  d.encounterTables!.common.push(id());
  assert.throws(() => validateCampaign(c), /missing encounter/);
  assert.throws(
    () => setDungeonEncounterSlot(c, d.id, 'common', 6, null),
    /1–6/,
  );
  assert.throws(() => setDungeonEncounterDR(c, d.id, 15), /6–14/);
});
test('Rare out-of-range preparation remains unresolved and is never clamped or rerolled by selection', () => {
  const { c, d } = fixture();
  setDungeonEncounterDR(c, d.id, 14);
  prepareDungeonEncounters(c, d.id, 'rare', registry, () => 0.999);
  assert.ok(
    c.encounters.every(
      (e) => e.unresolved && e.generation?.rolls.result === 22,
    ),
  );
  assert.equal(
    rollDungeonEncounter(c, d.id, 'rare', () => 0.999).encounter.generation
      ?.rolls.result,
    22,
  );
  assert.doesNotThrow(() => validateCampaign(c));
});
test('dungeon deletion preserves prepared encounter definitions for existing library use', () => {
  const { c, d } = prepared(),
    ids = c.encounters.map((e) => e.id);
  deleteDungeon(c, d.id);
  assert.deepEqual(
    c.encounters.map((e) => e.id),
    ids,
  );
  assert.doesNotThrow(() => validateCampaign(c));
});
