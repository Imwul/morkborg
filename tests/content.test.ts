import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import {
  createCampaign,
  createDungeon,
  createRoom,
} from '../src/generators/index.ts';
import {
  createNPC,
  createEncounter,
  rerollNPC,
  rerollEncounter,
  encounterTable,
  npcTablesFor,
  contentRegistry,
} from '../src/generators/content.ts';
import { setRules } from '../src/storage/rulesStore.ts';
import { setOraclePack } from '../src/storage/oracleStore.ts';
import { generateMonster } from '../src/generators/monster.ts';
import {
  beginContentDraft,
  saveContentDraft,
  addContentPlacement,
  editContentPlacement,
  removeContentPlacement,
  cloneContent,
  deleteContent,
  addEncounterParticipant,
  patchContentField,
  setContentTarget,
  contentRelationIssues,
} from '../src/domain/contentOperations.ts';
import {
  deleteRoom,
  deleteDungeon,
  duplicateDungeon,
  deleteMonster,
} from '../src/domain/monsterOperations.ts';
import {
  cloneCampaign,
  campaignIds,
  importCampaigns,
  selectDungeonCandidate,
} from '../src/domain/operations.ts';
import { validateCampaign, parseImport } from '../src/storage/schema.ts';
import {
  emptySave,
  loadStoredSave,
  STORAGE_KEY,
  PREVIOUS_STORAGE_KEY,
  MIGRATION_BACKUP_KEY,
} from '../src/storage/migrations.ts';
import type {
  Campaign,
  ContentKind,
  NPC,
  Encounter,
} from '../src/domain/types.ts';

const hasData =
  existsSync('public/rules/library.json') &&
  existsSync('public/rules/oracles.json');
if (hasData) {
  setRules(JSON.parse(readFileSync('public/rules/library.json', 'utf8')));
  setOraclePack(JSON.parse(readFileSync('public/rules/oracles.json', 'utf8')));
}
const sourceTest = (name: string, fn: () => void) =>
  test(name, { skip: !hasData }, fn);
const registry = () => contentRegistry();
class Storage {
  values = new Map<string, string>();
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
    this.values.set(key, value);
  }
}
function fixture() {
  const c = createCampaign('Content verification');
  const d = createDungeon(c.id, 'First', 'graven-tosk', true);
  d.rooms = Array.from({ length: 4 }, () => createRoom(d.region, true));
  const other = createDungeon(c.id, 'Second', 'sarkash', true);
  other.rooms = [createRoom(other.region, true)];
  c.dungeons.push(d, other);
  const npc = createNPC(c.id, 'graven-tosk', true);
  npc.name = 'Varg';
  const encounter = createEncounter(c.id, 'graven-tosk', 'common', 10, true);
  encounter.text = 'User encounter';
  encounter.description = encounter.text;
  const monster = generateMonster(c.id, true);
  monster.name = 'Existing monster';
  c.npcs.push(npc);
  c.encounters.push(encounter);
  c.monsters.push(monster);
  return { c, d, other, npc, encounter, monster };
}
function graph(c: Campaign) {
  assert.deepEqual(contentRelationIssues(c), []);
  assert.doesNotThrow(() => validateCampaign(c));
}
function seedGraph() {
  const f = fixture(),
    { c, d, other, npc, encounter, monster } = f;
  for (const [kind, entityId] of [
    ['npcs', npc.id],
    ['encounters', encounter.id],
  ] as const) {
    addContentPlacement(
      c,
      kind,
      entityId,
      { dungeonId: d.id, roomId: d.rooms[1].id },
      2,
      'Room note',
    );
    addContentPlacement(
      c,
      kind,
      entityId,
      { dungeonId: other.id, roomId: null },
      1,
      'Dungeon note',
    );
  }
  addEncounterParticipant(c, encounter, 'monster', monster.id, 3);
  addEncounterParticipant(c, encounter, 'npc', npc.id);
  return f;
}
sourceTest(
  'NPC generates all seven source-backed fields with actual selectors and no invented stats',
  () => {
    const npc = createNPC('campaign', 'graven-tosk', false, registry());
    assert.equal(npc.sourceRefs.length, 7);
    for (const field of [
      'name',
      'archetype',
      'appearance',
      'behaviour',
      'personality',
      'wants',
      'reaction',
    ]) {
      assert.ok((npc as unknown as Record<string, unknown>)[field]);
      const ref = npc.sourceRefs.find((r) => r.field === field)!;
      const table = registry().tables.find((t) => t.id === ref.tableId)!;
      assert.equal(
        table.entries.find((e) => e.id === ref.entryId)?.text,
        (npc as unknown as Record<string, unknown>)[field],
      );
      assert.ok(ref.pdfPage);
      assert.ok(ref.bookTitle);
    }
    assert.equal(
      registry().tables.find((t) => t.id === 'core.names')!.dice,
      'd6 × d8',
    );
    assert.equal(
      registry().tables.find((t) => t.id === 'core.reaction')!.dice,
      '2d6',
    );
    assert.equal(npc.hp, '');
    assert.equal(npc.morale, '');
    assert.equal(npc.armor, '');
    assert.equal(npc.attack, '');
    assert.equal(npc.notes, '');
  },
);
sourceTest(
  'NPC regional professions reuse Depths with a generic source fallback for Grift',
  () => {
    assert.deepEqual(npcTablesFor('archetype', 'graven-tosk', registry()), [
      'depths.region.graven_tosk.npc_professions',
    ]);
    assert.deepEqual(npcTablesFor('archetype', 'grift', registry()), [
      'sd.npc.profession',
    ]);
  },
);
sourceTest(
  'NPC single-field reroll preserves every manual edit, identity and unrelated source reference',
  () => {
    const npc = createNPC('campaign', 'sarkash', false, registry());
    patchContentField(npc, 'wants', 'User motivation');
    patchContentField(npc, 'notes', 'Private note');
    const before = structuredClone(npc);
    rerollNPC(npc, 'name', registry(), () => 0.999);
    const remaining = (n: NPC) => ({
      ...n,
      name: null,
      updatedAt: null,
      sources: { ...n.sources, name: null },
      sourceRefs: n.sourceRefs.filter((r) => r.field !== 'name'),
    });
    assert.deepEqual(remaining(npc), remaining(before));
    assert.equal(npc.wants, 'User motivation');
  },
);
for (const kind of ['npcs', 'encounters'] as const) {
  test(`${kind}: save keeps stable identity, manual text, notes and room draft context`, () => {
    const { c, d } = fixture();
    beginContentDraft(
      c,
      kind,
      { dungeonId: d.id, roomId: d.rooms[1].id },
      true,
    );
    const e = c.drafts[kind]!;
    patchContentField(e, 'name', 'Manual title');
    patchContentField(e, 'notes', 'User note');
    const saved = saveContentDraft(c, kind);
    assert.equal(saved.id, e.id);
    assert.equal(saved.name, 'Manual title');
    assert.equal(saved.notes, 'User note');
    assert.equal(c.drafts[kind], null);
    assert.equal(c.workspace.contentTarget!.roomId, d.rooms[1].id);
    graph(c);
  });
  test(`${kind}: multiple independent Room and Dungeon-only placements keep definition separate`, () => {
    const { c, d, other, npc, encounter } = fixture(),
      entity = kind === 'npcs' ? npc : encounter;
    const targets = [
      { dungeonId: d.id, roomId: d.rooms[1].id },
      { dungeonId: d.id, roomId: d.rooms[2].id },
      { dungeonId: other.id, roomId: null },
    ];
    const ps = targets.map((t) => addContentPlacement(c, kind, entity.id, t));
    const before = structuredClone(ps[0]);
    editContentPlacement(c, kind, ps[1].id, {
      quantity: 4,
      notes: 'Only this placement',
    });
    assert.deepEqual(ps[0], before);
    assert.equal(c[kind].length, 1);
    assert.equal(new Set(ps.map((p) => p.id)).size, 3);
    d.rooms.reverse();
    assert.equal(ps[0].roomId, targets[0].roomId);
    removeContentPlacement(c, kind, ps[1].id);
    assert.equal(c[kind].length, 1);
    graph(c);
  });
  test(`${kind}: assigning a draft saves and places it atomically`, () => {
    const { c, d } = fixture();
    beginContentDraft(c, kind, undefined, true);
    const id = c.drafts[kind]!.id;
    addContentPlacement(c, kind, id, {
      dungeonId: d.id,
      roomId: d.rooms[1].id,
    });
    assert.equal(c.drafts[kind], null);
    assert.equal(c[kind].filter((e) => e.id === id).length, 1);
    graph(c);
  });
  test(`${kind}: definition duplication has independent IDs and no implicit placements`, () => {
    const { c, npc, encounter } = seedGraph(),
      e = kind === 'npcs' ? npc : encounter;
    const copy = cloneContent(e);
    (c[kind] as (NPC | Encounter)[]).push(copy);
    assert.notEqual(copy.id, e.id);
    assert.deepEqual(copy.sourceRefs, e.sourceRefs);
    const key = kind === 'npcs' ? 'npcPlacements' : 'encounterPlacements';
    assert.equal(c[key].filter((p) => p.entityId === copy.id).length, 0);
    if ('participants' in copy && 'participants' in e)
      assert.ok(
        copy.participants.every(
          (p) => !e.participants.some((old) => old.id === p.id),
        ),
      );
    graph(c);
  });
  test(`${kind}: deletion removes placements and cleans participant references without changing prose`, () => {
    const { c, npc, encounter } = seedGraph();
    const text = encounter.text;
    deleteContent(c, kind, kind === 'npcs' ? npc.id : encounter.id);
    assert.equal(c[kind].length, 0);
    assert.equal(
      c[kind === 'npcs' ? 'npcPlacements' : 'encounterPlacements'].length,
      0,
    );
    if (kind === 'npcs') {
      assert.equal(encounter.participants.length, 1);
      assert.equal(encounter.text, text);
    }
    graph(c);
  });
}
sourceTest(
  'Encounter categories route to verified original tables and leave participant links empty',
  () => {
    for (const category of [
      'common',
      'rare',
      'room',
      'hazard',
      'discovery',
    ] as const) {
      const e = createEncounter(
        'campaign',
        'sarkash',
        category,
        10,
        false,
        registry(),
      );
      assert.ok(e.text);
      assert.equal(e.category, category);
      assert.equal(
        e.sourceRefs[0].tableId,
        encounterTable(category, 'sarkash', registry()),
      );
      assert.deepEqual(e.participants, []);
      assert.equal(e.notes, '');
    }
    assert.equal(
      encounterTable('common', 'sarkash', registry()),
      'depths.region.sarkash.monsters',
    );
    assert.equal(
      encounterTable('common', 'grift', registry()),
      'sd.stockCreatures',
    );
  },
);
sourceTest(
  'Rare stocking follows d8 plus Dungeon DR and preserves unmapped 21/22 as unresolved',
  () => {
    const e = createEncounter(
      'campaign',
      'grift',
      'rare',
      14,
      true,
      registry(),
    );
    rerollEncounter(e, registry(), () => 0);
    assert.equal(e.generation!.rolls.result, 15);
    assert.ok(e.text);
    assert.equal(e.unresolved, false);
    for (const value of [0.8, 0.999]) {
      rerollEncounter(e, registry(), () => value);
      assert.ok([21, 22].includes(e.generation!.rolls.result));
      assert.equal(e.text, '');
      assert.equal(e.unresolved, true);
    }
    e.category = 'common';
    rerollEncounter(e, registry(), () => 0.999);
    assert.equal(e.generation!.rolls.result, 12);
  },
);
sourceTest(
  'Encounter reroll clears legacy alias provenance but preserves manual secondary fields and participants',
  () => {
    const { c, encounter, npc } = fixture();
    encounter.sources = { description: 'Old source' };
    encounter.sourceRefs = [{ field: 'description', note: 'Old source' }];
    encounter.sign = 'Manual sign';
    encounter.notes = 'Note';
    addEncounterParticipant(c, encounter, 'npc', npc.id, 2);
    const participants = structuredClone(encounter.participants);
    rerollEncounter(encounter, registry(), () => 0);
    assert.equal(encounter.text, encounter.description);
    assert.equal(encounter.sourceRefs.length, 1);
    assert.equal(encounter.sourceRefs[0].field, 'text');
    assert.equal(encounter.sign, 'Manual sign');
    assert.equal(encounter.notes, 'Note');
    assert.deepEqual(encounter.participants, participants);
  },
);
test('Manual encounter content clears both text and legacy description provenance; notes do not', () => {
  const { encounter } = fixture();
  encounter.sourceRefs = [
    { field: 'description', note: 'Old' },
    { field: 'text', note: 'Old' },
  ];
  patchContentField(encounter, 'notes', 'Keep metadata');
  assert.equal(encounter.sourceRefs.length, 2);
  patchContentField(encounter, 'text', 'Edited');
  assert.equal(encounter.sourceRefs.length, 0);
  assert.equal(encounter.description, 'Edited');
  assert.equal(encounter.sources!.description, '직접 작성');
  assert.equal(encounter.sources!.text, '직접 작성');
});
test('Participants connect existing Monster and NPC IDs, quantities, and reject other campaigns', () => {
  const { c, encounter, monster, npc } = fixture();
  addEncounterParticipant(c, encounter, 'monster', monster.id, 3);
  addEncounterParticipant(c, encounter, 'npc', npc.id, 2);
  assert.equal(encounter.participants[0].entityId, monster.id);
  assert.equal(encounter.participants[1].entityId, npc.id);
  assert.throws(() => addEncounterParticipant(c, encounter, 'npc', 'foreign'));
  assert.throws(() =>
    addEncounterParticipant(c, encounter, 'monster', monster.id, 0),
  );
  graph(c);
});
test('Deleting a Monster clears saved and draft Encounter participant links without changing encounter text', () => {
  const { c, monster, encounter } = seedGraph();
  c.drafts.encounters = cloneContent(encounter);
  deleteMonster(c, monster.id);
  assert.equal(encounter.participants.length, 1);
  assert.equal(c.drafts.encounters.participants.length, 1);
  assert.equal(encounter.text, 'User encounter');
  graph(c);
});
test('Room deletion moves NPC and Encounter placements to Dungeon-only with IDs, quantities, notes intact', () => {
  const { c, d } = seedGraph();
  const ids = [c.npcPlacements[0].id, c.encounterPlacements[0].id];
  beginContentDraft(
    c,
    'npcs',
    { dungeonId: d.id, roomId: d.rooms[1].id },
    true,
  );
  deleteRoom(c, d.id, d.rooms[1].id);
  for (const [i, p] of [
    c.npcPlacements[0],
    c.encounterPlacements[0],
  ].entries()) {
    assert.equal(p.id, ids[i]);
    assert.equal(p.roomId, null);
    assert.equal(p.quantity, 2);
    assert.equal(p.notes, 'Room note');
  }
  assert.equal(c.workspace.contentDraftTargets!.npcs!.roomId, null);
  graph(c);
});
test('Dungeon deletion removes only its placements and preserves definitions and other Dungeon placements', () => {
  const { c, d, other } = seedGraph();
  beginContentDraft(c, 'encounters', { dungeonId: d.id, roomId: null }, true);
  deleteDungeon(c, d.id);
  assert.equal(c.npcs.length, 1);
  assert.equal(c.encounters.length, 1);
  assert.equal(c.npcPlacements[0].dungeonId, other.id);
  assert.equal(c.encounterPlacements.length, 1);
  assert.equal(c.workspace.contentDraftTargets!.encounters, null);
  graph(c);
});
test('Dungeon clone shares definitions and remaps new Room and placement IDs', () => {
  const { c, d, npc, encounter } = seedGraph();
  const copy = duplicateDungeon(c, d.id);
  for (const [key, entityId] of [
    ['npcPlacements', npc.id],
    ['encounterPlacements', encounter.id],
  ] as const) {
    const p = c[key].find((p) => p.dungeonId === copy.id)!;
    assert.ok(p);
    assert.equal(p.roomId, copy.rooms[1].id);
    assert.equal(p.entityId, entityId);
    assert.notEqual(p.id, c[key][0].id);
    assert.equal(p.quantity, 2);
  }
  assert.equal(c.npcs.length, 1);
  assert.equal(c.encounters.length, 1);
  graph(c);
});
test('Campaign clone and collision import remap the full owned graph and both draft targets', () => {
  const { c, d } = seedGraph();
  beginContentDraft(
    c,
    'npcs',
    { dungeonId: d.id, roomId: d.rooms[1].id },
    true,
  );
  beginContentDraft(
    c,
    'encounters',
    { dungeonId: d.id, roomId: d.rooms[2].id },
    true,
  );
  const before = structuredClone(c),
    copy = cloneCampaign(c);
  assert.ok(campaignIds(copy).every((id) => !campaignIds(c).includes(id)));
  assert.equal(
    copy.encounters[0].participants[0].entityId,
    copy.monsters[0].id,
  );
  assert.equal(copy.encounters[0].participants[1].entityId, copy.npcs[0].id);
  assert.equal(
    copy.workspace.contentDraftTargets!.npcs!.roomId,
    copy.dungeons[0].rooms[1].id,
  );
  assert.equal(
    copy.workspace.contentDraftTargets!.encounters!.roomId,
    copy.dungeons[0].rooms[2].id,
  );
  graph(copy);
  const parsed = parseImport(JSON.stringify({ schemaVersion: 5, campaign: c }));
  assert.deepEqual(parsed, [c]);
  const save = { ...emptySave(), campaigns: [c] };
  importCampaigns(save, parsed);
  assert.deepEqual(save.campaigns[0], before);
  assert.ok(
    campaignIds(save.campaigns[1]).every((id) => !campaignIds(c).includes(id)),
  );
  graph(save.campaigns[1]);
});
test('Invalid placement, participant, campaign ownership and ID collisions are rejected', () => {
  const { c, other } = seedGraph();
  for (const mutate of [
    (x: Campaign) => (x.npcPlacements[0].entityId = 'missing'),
    (x: Campaign) => (x.encounterPlacements[0].roomId = other.rooms[0].id),
    (x: Campaign) => (x.encounters[0].participants[0].entityId = 'missing'),
    (x: Campaign) => (x.npcs[0].campaignId = 'other'),
    (x: Campaign) => (x.encounterPlacements[0].id = x.npcPlacements[0].id),
  ]) {
    const copy = structuredClone(c);
    mutate(copy);
    assert.throws(() => validateCampaign(copy));
  }
});
test('Independent contextual drafts resume at their own rooms after visiting another library and reloading', () => {
  const { c, d } = fixture();
  beginContentDraft(
    c,
    'npcs',
    { dungeonId: d.id, roomId: d.rooms[1].id },
    true,
  );
  const npcId = c.drafts.npcs!.id;
  beginContentDraft(
    c,
    'encounters',
    { dungeonId: d.id, roomId: d.rooms[2].id },
    true,
  );
  c.workspace.contentTarget = null;
  c.workspace.selected.npcs = null;
  beginContentDraft(c, 'npcs');
  assert.equal(c.drafts.npcs!.id, npcId);
  assert.equal(c.workspace.contentTarget!.roomId, d.rooms[1].id);
  setContentTarget(c, 'npcs', { dungeonId: d.id, roomId: d.rooms[3].id });
  beginContentDraft(c, 'encounters');
  assert.equal(c.workspace.contentTarget!.roomId, d.rooms[2].id);
  const storage = new Storage(),
    save = {
      ...emptySave(),
      campaigns: [c],
      activeCampaignId: c.id,
      view: 'campaign' as const,
    };
  storage.setItem(STORAGE_KEY, JSON.stringify(save));
  const restored = loadStoredSave(storage).save;
  assert.deepEqual(restored, save);
  beginContentDraft(restored.campaigns[0], 'npcs');
  assert.equal(
    restored.campaigns[0].workspace.contentTarget!.roomId,
    d.rooms[3].id,
  );
});
test('v4 migration preserves old NPC/Encounter text, sources, drafts, target and original raw backup', () => {
  const { c, d, npc, encounter } = fixture();
  const old = structuredClone(c) as unknown as Record<string, unknown>;
  delete old.npcPlacements;
  delete old.encounterPlacements;
  const legacyNPC = old.npcs as Record<string, unknown>[];
  for (const k of [
    'campaignId',
    'personality',
    'reaction',
    'affiliation',
    'fears',
    'description',
    'sourceRefs',
  ])
    delete legacyNPC[0][k];
  const legacyEncounter = old.encounters as Record<string, unknown>[];
  for (const k of [
    'campaignId',
    'text',
    'participants',
    'sourceRefs',
    'dungeonDR',
  ])
    delete legacyEncounter[0][k];
  legacyEncounter[0].description = 'Exact old encounter';
  legacyEncounter[0].sources = { description: 'Original source' };
  const ds = old.dungeons as typeof c.dungeons;
  ds[0].npcIds = [npc.id];
  ds[0].rooms[1].npcIds = [npc.id];
  ds[0].encounterIds = [encounter.id];
  (old.drafts as Record<string, unknown>).npcs = {
    ...legacyNPC[0],
    id: crypto.randomUUID(),
  };
  Object.assign(old.workspace as object, {
    section: 'encounters',
    stockingKind: 'npcs',
    dungeonId: d.id,
    roomId: d.rooms[1].id,
  });
  const raw = JSON.stringify(
      {
        schemaVersion: 4,
        campaigns: [old],
        activeCampaignId: c.id,
        view: 'campaign',
      },
      null,
      3,
    ),
    storage = new Storage();
  storage.setItem(PREVIOUS_STORAGE_KEY, raw);
  const migrated = loadStoredSave(storage).save,
    out = migrated.campaigns[0];
  assert.equal(migrated.schemaVersion, 5);
  assert.equal(out.encounters[0].text, 'Exact old encounter');
  assert.equal(out.encounters[0].sourceRefs[0].note, 'Original source');
  assert.equal(out.npcPlacements.length, 1);
  assert.equal(out.npcPlacements[0].roomId, d.rooms[1].id);
  assert.equal(out.encounterPlacements[0].roomId, null);
  assert.equal(out.workspace.section, 'npcs');
  assert.equal(out.workspace.contentDraftTargets!.npcs!.roomId, d.rooms[1].id);
  assert.equal(out.npcs[0].createdAt, npc.createdAt);
  assert.equal(storage.getItem(PREVIOUS_STORAGE_KEY), raw);
  assert.equal(JSON.parse(storage.getItem(MIGRATION_BACKUP_KEY)!)[0].raw, raw);
  assert.deepEqual(loadStoredSave(storage).save, migrated);
  graph(out);
});
test('Explicit empty placements are authoritative and malformed v5 fields are not repaired silently', () => {
  const { c, npc } = fixture();
  c.dungeons[0].npcIds = [npc.id];
  assert.throws(() => validateCampaign(c));
  c.dungeons[0].npcIds = [];
  for (const patch of [
    { participants: 'wrong' },
    { text: 5 },
    { campaignId: null },
  ]) {
    const copy = structuredClone(c);
    Object.assign(copy.encounters[0], patch);
    assert.throws(() => validateCampaign(copy));
  }
});
test('Saving a legacy Dungeon candidate materializes NPC and Encounter refs together', () => {
  const { c, npc, encounter } = fixture();
  const d = createDungeon(c.id, 'Candidate', 'sarkash', true);
  d.rooms = [createRoom('sarkash', true)];
  d.npcIds = [npc.id];
  d.rooms[0].npcIds = [npc.id];
  d.encounterIds = [encounter.id];
  d.rooms[0].encounterIds = [encounter.id];
  c.dungeonDraft = d;
  selectDungeonCandidate(c, 'Candidate');
  assert.equal(c.npcPlacements.length, 1);
  assert.equal(c.encounterPlacements.length, 1);
  assert.equal(c.npcPlacements[0].roomId, d.rooms[0].id);
  graph(c);
});
