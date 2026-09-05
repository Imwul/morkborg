import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createCampaign,
  createDungeon,
  createRoom,
} from '../src/generators/index.ts';
import { generateCharacter } from '../src/generators/character.ts';
import { generateMonster } from '../src/generators/monster.ts';
import { createNPC, createEncounter } from '../src/generators/content.ts';
import {
  addMonsterPlacement,
  removeMonsterPlacement,
  deleteMonster,
  deleteDungeon,
  deleteRoom,
  duplicateDungeon,
} from '../src/domain/monsterOperations.ts';
import {
  addContentPlacement,
  deleteContent,
} from '../src/domain/contentOperations.ts';
import {
  applyCampaignEdit,
  cloneCampaign,
  importCampaigns,
  campaignIds,
  deleteEntity,
} from '../src/domain/operations.ts';
import {
  createSession,
  startSession,
  endSession,
  linkToSession,
  recordEvent,
  setRoomState,
  setDungeonState,
  setPlacementState,
  recordDeath,
  createThread,
  createRumor,
  createRelic,
  assignRelic,
  createJournalNote,
  saveOracleEvent,
  startSessionEncounter,
  updateSessionEncounter,
  backlinks,
  objectLinks,
  objectLabel,
  chronicleRelationIssues,
  deleteChronicleRecord,
} from '../src/domain/chronicleOperations.ts';
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
  V4_STORAGE_KEY,
  MIGRATION_BACKUP_KEY,
  type SaveStorage,
} from '../src/storage/migrations.ts';
import type { ObjectLink } from '../src/domain/chronicle.ts';

function fixture() {
  const c = createCampaign('The record of actual play');
  const dungeon = createDungeon(c.id, 'The Hadean Tunnels', 'sarkash', true);
  dungeon.status = 'The ancient bell rings';
  dungeon.notes = 'Retain every GM detail';
  dungeon.rooms.push(createRoom('sarkash', true), createRoom('sarkash', true));
  dungeon.rooms[0].name = 'Bell chamber';
  dungeon.rooms[0].sources = { description: 'Original source PDF 9' };
  c.dungeons.push(dungeon);
  const characters = [
    generateCharacter(c.id, true),
    generateCharacter(c.id, true),
  ];
  characters[0].name = 'Risten';
  characters[1].name = 'Varg';
  c.characters.push(...characters);
  const monster = generateMonster(c.id, true);
  monster.name = 'Meatroach';
  monster.hp = 7;
  monster.morale = 6;
  c.monsters.push(monster);
  const npc = createNPC(c.id, 'sarkash', true);
  npc.name = 'Alduteb';
  npc.secret = 'The bell is a mouth';
  c.npcs.push(npc);
  const encounter = createEncounter(c.id, 'sarkash', 'common', 10, true);
  encounter.name = 'The bell keepers';
  c.encounters.push(encounter);
  const target = { dungeonId: dungeon.id, roomId: dungeon.rooms[0].id };
  const placement = addMonsterPlacement(
    c,
    monster.id,
    target,
    3,
    'Original placement notes',
  );
  const npcPlacement = addContentPlacement(c, 'npcs', npc.id, target);
  const encounterPlacement = addContentPlacement(
    c,
    'encounters',
    encounter.id,
    target,
  );
  return {
    c,
    dungeon,
    characters,
    monster,
    npc,
    encounter,
    placement,
    npcPlacement,
    encounterPlacement,
    target,
  };
}
class MemoryStorage implements SaveStorage {
  values = new Map<string, string>();
  fail: string | null = null;
  get length() {
    return this.values.size;
  }
  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    if (key === this.fail) throw new Error('quota');
    this.values.set(key, value);
  }
}
const oracle = () => ({
  id: crypto.randomUUID(),
  title: 'A sign in the dark',
  rolls: [
    {
      oracleId: 'test.oracle',
      title: 'Sign',
      dice: 'd6',
      roll: 4,
      diceValues: [4],
      entryId: 'four',
      text: 'The bell wakes',
      source: 'Private book · PDF 8',
      metadata: { meaning: 'retained' },
    },
  ],
});
const roomLink = (f: ReturnType<typeof fixture>): ObjectLink => ({
  kind: 'room',
  id: f.target.roomId,
  dungeonId: f.target.dungeonId,
});

test('v5 production-shaped save migrates additively with a byte-exact backup and unchanged generated material', () => {
  const { c } = fixture();
  const legacy = structuredClone(c) as unknown as Record<string, unknown>;
  for (const key of [
    'sessions',
    'timeline',
    'threads',
    'rumors',
    'relics',
    'journalNotes',
    'miseries',
    'currentSessionId',
    'campaignDay',
  ])
    delete legacy[key];
  const raw = JSON.stringify(
      {
        schemaVersion: 5,
        campaigns: [legacy],
        activeCampaignId: c.id,
        view: 'campaign',
      },
      null,
      2,
    ),
    storage = new MemoryStorage();
  storage.setItem(PREVIOUS_STORAGE_KEY, raw);
  const migrated = loadStoredSave(storage);
  assert.equal(migrated.save.schemaVersion, 6);
  assert.deepEqual(migrated.migrated, [PREVIOUS_STORAGE_KEY]);
  assert.equal(storage.getItem(PREVIOUS_STORAGE_KEY), raw);
  assert.equal(JSON.parse(storage.getItem(MIGRATION_BACKUP_KEY)!)[0].raw, raw);
  const next = migrated.save.campaigns[0];
  assert.deepEqual(next.dungeons, c.dungeons);
  assert.deepEqual(next.characters, c.characters);
  assert.deepEqual(next.npcs, c.npcs);
  assert.deepEqual(next.monsterPlacements, c.monsterPlacements);
  assert.deepEqual(next.sessions, []);
  assert.equal(next.campaignDay, 1);
  assert.equal(next.apocalypseDie, undefined);
  assert.deepEqual(loadStoredSave(storage).save, migrated.save);
});
test('v6 migration refuses to write current data until the prior exact backup succeeds', () => {
  const storage = new MemoryStorage(),
    raw = JSON.stringify({ ...emptySave(), schemaVersion: 5 });
  storage.setItem(PREVIOUS_STORAGE_KEY, raw);
  storage.fail = MIGRATION_BACKUP_KEY;
  assert.throws(() => loadStoredSave(storage));
  assert.equal(storage.getItem(STORAGE_KEY), null);
  assert.equal(storage.getItem(PREVIOUS_STORAGE_KEY), raw);
});
test('v5 takes precedence over v4; v4 still remains an explicit fallback', () => {
  const storage = new MemoryStorage(),
    old = createCampaign('v4'),
    recent = createCampaign('v5');
  storage.setItem(
    V4_STORAGE_KEY,
    JSON.stringify({ ...emptySave(), schemaVersion: 4, campaigns: [old] }),
  );
  storage.setItem(
    PREVIOUS_STORAGE_KEY,
    JSON.stringify({ ...emptySave(), schemaVersion: 5, campaigns: [recent] }),
  );
  assert.equal(loadStoredSave(storage).save.campaigns[0].title, 'v5');
  const onlyOld = new MemoryStorage();
  onlyOld.setItem(
    V4_STORAGE_KEY,
    JSON.stringify({ ...emptySave(), schemaVersion: 4, campaigns: [old] }),
  );
  assert.equal(loadStoredSave(onlyOld).save.campaigns[0].title, 'v4');
});
test('Session participants, Dungeon, Room, NPC, Monster and Relic use stable references across reload', () => {
  const f = fixture(),
    s = createSession(f.c, {
      number: 8,
      title: 'The Bell Beneath Sarkash',
      characterIds: f.characters.map((ch) => ch.id),
      date: '2026-09-05',
    });
  startSession(f.c, s.id);
  const relic = createRelic(f.c, { title: 'Black Crown', origin: roomLink(f) });
  for (const link of [
    { kind: 'dungeon', id: f.dungeon.id },
    { kind: 'npc', id: f.npc.id },
    { kind: 'monster', id: f.monster.id },
    { kind: 'relic', id: relic.id },
    roomLink(f),
  ] as ObjectLink[])
    linkToSession(f.c, s.id, link);
  const loaded = validateCampaign(JSON.parse(JSON.stringify(f.c)));
  assert.deepEqual(loaded.sessions, f.c.sessions);
  assert.deepEqual(chronicleRelationIssues(loaded), []);
  assert.equal(loaded.currentSessionId, s.id);
  assert(!s.links.some((l) => l.kind === 'session' && l.id === s.id));
});
test('Session lifecycle allows one current Session and retains notes, summary and prior events', () => {
  const { c } = fixture(),
    first = createSession(c, { title: 'First', notes: 'before play' }),
    second = createSession(c, { title: 'Second' });
  startSession(c, first.id);
  assert.throws(() => startSession(c, second.id));
  recordEvent(c, { title: 'The bell broke' });
  endSession(c, first.id, 'Alduteb fled');
  startSession(c, second.id);
  assert.equal(first.notes, 'before play');
  assert.equal(first.summary, 'Alduteb fled');
  assert.equal(first.status, 'ended');
  assert.equal(
    c.timeline.find((e) => e.title === 'The bell broke')?.sessionId,
    first.id,
  );
  validateCampaign(c);
});
test('Room and Dungeon historical state never overwrite generated status, secret notes or source metadata', () => {
  const f = fixture(),
    before = structuredClone(f.dungeon);
  setRoomState(f.c, f.dungeon.id, f.target.roomId, 'visited');
  setDungeonState(f.c, f.dungeon.id, 'cleared');
  setRoomState(f.c, f.dungeon.id, f.target.roomId, 'cleared');
  assert.equal(f.dungeon.status, before.status);
  assert.equal(f.dungeon.notes, before.notes);
  assert.deepEqual(f.dungeon.rooms[0].sources, before.rooms[0].sources);
  assert.equal(f.dungeon.playState, 'cleared');
  assert.equal(f.dungeon.rooms[0].playState, 'cleared');
  const count = f.c.timeline.length;
  setRoomState(f.c, f.dungeon.id, f.target.roomId, 'cleared');
  assert.equal(f.c.timeline.length, count);
  validateCampaign(f.c);
});
test('Monster, NPC and Encounter placement state stays independent of shared definitions', () => {
  const f = fixture(),
    original = structuredClone(f.monster);
  setPlacementState(f.c, 'monster', f.placement.id, 'defeated');
  setPlacementState(f.c, 'npc', f.npcPlacement.id, 'fled');
  setPlacementState(f.c, 'encounter', f.encounterPlacement.id, 'removed');
  assert.deepEqual(f.monster, original);
  assert.equal(f.npc.status, undefined);
  assert.equal(f.c.monsterPlacements.length, 1);
  assert.equal(f.placement.notes, 'Original placement notes');
  validateCampaign(f.c);
});
test('GM visibility and notes round-trip for Dungeon, Room, NPC, Encounter, placement and Rumor', () => {
  const f = fixture();
  for (const record of [
    f.dungeon,
    f.dungeon.rooms[0],
    f.npc,
    f.encounter,
    f.placement,
    f.npcPlacement,
  ]) {
    record.visibility = 'players';
    record.gmNotes = 'Remain secret';
  }
  const rumor = createRumor(f.c, {
    title: 'The crown answers',
    visibility: 'gm',
    gmNotes: 'The rumor is false',
  });
  const loaded = validateCampaign(JSON.parse(JSON.stringify(f.c)));
  assert.equal(loaded.npcs[0].secret, 'The bell is a mouth');
  assert.equal(loaded.dungeons[0].rooms[0].gmNotes, 'Remain secret');
  assert.deepEqual(loaded.rumors[0], rumor);
});
test('Relic custody and origin remain independent; Threads, Rumors and Notes support typed links', () => {
  const f = fixture(),
    s = createSession(f.c),
    thread = createThread(f.c, {
      title: 'Silence the bell',
      links: [
        { kind: 'npc', id: f.npc.id },
        roomLink(f),
        { kind: 'session', id: s.id },
      ],
    }),
    rumor = createRumor(f.c, {
      title: 'Crown calls the bell',
      status: 'heard',
      links: [
        { kind: 'thread', id: thread.id },
        { kind: 'dungeon', id: f.dungeon.id },
      ],
    }),
    relic = createRelic(f.c, { title: 'Crown', origin: roomLink(f) });
  assignRelic(f.c, relic.id, { kind: 'character', id: f.characters[0].id });
  const note = createJournalNote(f.c, {
    title: 'A missing hand',
    text: 'Vorga knows the grave path',
    links: [{ kind: 'npc', id: f.npc.id }],
  });
  assert.deepEqual(relic.origin, roomLink(f));
  assert.equal(relic.holder?.id, f.characters[0].id);
  assert.equal(rumor.links[0].id, thread.id);
  assert.equal(note.text, 'Vorga knows the grave path');
  assert(
    backlinks(f.c, { kind: 'npc', id: f.npc.id }).some(
      (x) => x.link.id === note.id,
    ),
  );
  validateCampaign(f.c);
});
test('Backlinks include placements with quantity and Session participants without duplicating the definition', () => {
  const f = fixture(),
    s = createSession(f.c, { characterIds: [f.characters[0].id] });
  linkToSession(f.c, s.id, {
    kind: 'monster',
    id: f.monster.id,
    relation: 'encountered',
    quantity: 3,
  });
  const links = backlinks(f.c, { kind: 'monster', id: f.monster.id });
  assert(links.some((l) => l.link.kind === 'room' && l.detail === '×3'));
  assert(links.some((l) => l.link.kind === 'session' && l.link.id === s.id));
  assert(
    backlinks(f.c, { kind: 'character', id: f.characters[0].id }).some(
      (l) => l.link.id === s.id,
    ),
  );
});
test('Session encounter tracks remaining quantities without changing Monster HP or the placement quantity', () => {
  const f = fixture(),
    s = createSession(f.c);
  startSession(f.c, s.id);
  const instance = startSessionEncounter(f.c, s.id, f.placement.id);
  assert.equal(
    startSessionEncounter(f.c, s.id, f.placement.id).id,
    instance.id,
  );
  updateSessionEncounter(f.c, s.id, instance.id, {
    remaining: 1,
    notes: 'One flees into the bell',
  });
  assert.equal(f.monster.hp, 7);
  assert.equal(f.placement.quantity, 3);
  assert.equal(instance.remaining, 1);
  updateSessionEncounter(f.c, s.id, instance.id, { remaining: 0 });
  assert.equal(instance.state, 'defeated');
  assert.equal(f.placement.playState, 'defeated');
  assert.throws(() =>
    updateSessionEncounter(f.c, s.id, instance.id, { remaining: 4 }),
  );
  validateCampaign(f.c);
});
test('Removing a Monster placement keeps the Session instance and clears its optional placement reference', () => {
  const f = fixture(),
    s = createSession(f.c),
    instance = startSessionEncounter(f.c, s.id, f.placement.id);
  removeMonsterPlacement(f.c, f.placement.id);
  assert.equal(instance.placementId, null);
  assert.equal(instance.quantity, 3);
  validateCampaign(f.c);
});
test('Oracle events retain structured results and source metadata independently of rolling history', () => {
  const { c } = fixture(),
    s = createSession(c);
  startSession(c, s.id);
  const result = oracle(),
    event = saveOracleEvent(c, result);
  result.rolls[0].text = 'changed after save';
  assert.equal(event.oracle?.rolls[0].text, 'The bell wakes');
  assert.equal(event.sessionId, s.id);
  assert.equal(event.sourceRefs[0].note, 'Private book · PDF 8');
  assert.deepEqual(
    validateCampaign(JSON.parse(JSON.stringify(c))).timeline,
    c.timeline,
  );
});
test('Character status editing and explicit NPC death each append exactly one historical event', () => {
  const f = fixture();
  applyCampaignEdit(f.c, (c) => {
    c.characters[0].status = 'dead';
  });
  applyCampaignEdit(f.c, (c) => recordDeath(c, 'npc', f.npc.id));
  applyCampaignEdit(f.c, (c) => recordDeath(c, 'npc', f.npc.id));
  assert.equal(
    f.c.timeline.filter((e) => e.type === 'character-death').length,
    1,
  );
  assert.equal(f.c.timeline.filter((e) => e.type === 'npc-death').length, 1);
  assert.equal(f.npcPlacement.playState, 'dead');
  validateCampaign(f.c);
});
test('Session title/date/summary edits refresh Session ledger entries and timestamps', () => {
  const { c } = fixture(),
    s = createSession(c, { title: 'Old' });
  endSession(c, s.id, 'Old summary');
  applyCampaignEdit(
    c,
    (c) => {
      const s = c.sessions[0];
      s.title = 'The Bell';
      s.date = '2026-09-04';
      s.summary = 'All returned';
    },
    '2026-09-06T00:00:00.000Z',
  );
  assert.equal(
    c.timeline.find((e) => e.title === 'The Bell')?.date,
    '2026-09-04',
  );
  assert.equal(
    c.timeline.find((e) => e.title === 'The Bell — ended')?.description,
    'All returned',
  );
  assert.equal(s.updatedAt, '2026-09-06T00:00:00.000Z');
});
test('Campaign clone remaps every owned UUID, relation, current Session and play context', () => {
  const f = fixture(),
    s = createSession(f.c, { characterIds: f.characters.map((ch) => ch.id) });
  startSession(f.c, s.id);
  startSessionEncounter(f.c, s.id, f.placement.id);
  const thread = createThread(f.c, { title: 'Thread', links: [roomLink(f)] });
  createRumor(f.c, {
    title: 'Rumor',
    links: [{ kind: 'thread', id: thread.id }],
  });
  createRelic(f.c, {
    title: 'Crown',
    origin: roomLink(f),
    holder: { kind: 'character', id: f.characters[0].id },
  });
  createJournalNote(f.c, {
    title: 'Note',
    links: [{ kind: 'session', id: s.id }],
  });
  saveOracleEvent(f.c, oracle());
  f.c.workspace.sessionId = s.id;
  f.c.workspace.chronicleId = thread.id;
  f.c.workspace.playDungeonId = f.dungeon.id;
  f.c.workspace.playRoomId = f.target.roomId;
  const clone = cloneCampaign(f.c),
    oldIds = new Set(campaignIds(f.c));
  assert(campaignIds(clone).every((id) => !oldIds.has(id)));
  assert.equal(new Set(campaignIds(clone)).size, campaignIds(clone).length);
  validateCampaign(clone);
  assert.equal(
    clone.sessions[0].encounters[0].placementId,
    clone.monsterPlacements[0].id,
  );
  assert.equal(clone.relics[0].holder?.id, clone.characters[0].id);
  assert.equal(clone.workspace.playRoomId, clone.dungeons[0].rooms[0].id);
});
test('JSON export/import collisions remap the full chronicle and preserve exact content', () => {
  const f = fixture(),
    s = createSession(f.c);
  startSession(f.c, s.id);
  setRoomState(f.c, f.dungeon.id, f.target.roomId, 'visited');
  const relic = createRelic(f.c, { title: 'Crown', origin: roomLink(f) });
  assignRelic(f.c, relic.id, { kind: 'character', id: f.characters[0].id });
  const exported = JSON.stringify({ schemaVersion: 6, campaign: f.c }),
    parsed = parseImport(exported),
    save = { ...emptySave(), campaigns: [f.c] };
  assert.deepEqual(parsed[0], f.c);
  importCampaigns(save, parsed);
  validateSave(save);
  assert.equal(save.campaigns.length, 2);
  assert.equal(save.campaigns[1].timeline.length, f.c.timeline.length);
  assert.notEqual(save.campaigns[1].currentSessionId, s.id);
});
test('Definition and location deletion prune every live link while preserving historical prose', () => {
  const f = fixture(),
    s = createSession(f.c, { characterIds: f.characters.map((ch) => ch.id) });
  startSession(f.c, s.id);
  startSessionEncounter(f.c, s.id, f.placement.id);
  const relic = createRelic(f.c, {
    title: 'Crown',
    origin: roomLink(f),
    holder: { kind: 'character', id: f.characters[0].id },
  });
  linkToSession(f.c, s.id, { kind: 'npc', id: f.npc.id });
  deleteEntity(f.c, 'characters', f.characters[0].id);
  assert.equal(relic.holder, null);
  deleteContent(f.c, 'npcs', f.npc.id);
  deleteMonster(f.c, f.monster.id);
  assert.equal(s.encounters.length, 0);
  deleteRoom(f.c, f.dungeon.id, f.target.roomId);
  assert.equal(relic.origin, null);
  assert(f.c.timeline.some((e) => e.title.includes('Meatroach')));
  deleteDungeon(f.c, f.dungeon.id);
  assert.deepEqual(chronicleRelationIssues(f.c), []);
  validateCampaign(f.c);
});
test('Deleting a Session keeps timeline, Relic and Misery history with null references', () => {
  const f = fixture(),
    s = createSession(f.c);
  startSession(f.c, s.id);
  const relic = createRelic(f.c, {
    title: 'Crown',
    holder: { kind: 'session', id: s.id },
  });
  const time = new Date().toISOString();
  f.c.miseries.push({
    id: crypto.randomUUID(),
    roll: 11,
    result: 'First sign',
    sourceRefs: [],
    date: '2026-09-05',
    inWorldDate: 'Day 1',
    sessionId: s.id,
    notes: 'Retain',
    terminal: false,
    createdAt: time,
    updatedAt: time,
  });
  deleteChronicleRecord(f.c, 'session', s.id);
  assert.equal(f.c.currentSessionId, null);
  assert.equal(relic.holder, null);
  assert.equal(f.c.miseries[0].sessionId, null);
  assert(f.c.timeline.every((e) => e.sessionId === null));
  validateCampaign(f.c);
});
test('Dungeon duplication preserves local state but does not copy campaign historical links', () => {
  const f = fixture(),
    s = createSession(f.c);
  linkToSession(f.c, s.id, roomLink(f));
  setRoomState(f.c, f.dungeon.id, f.target.roomId, 'visited');
  const copied = duplicateDungeon(f.c, f.dungeon.id);
  assert.equal(copied.rooms[0].playState, 'visited');
  assert.notEqual(copied.rooms[0].id, f.target.roomId);
  assert.equal(s.links[0].id, f.target.roomId);
  validateCampaign(f.c);
});
test('Dangling and cross-Dungeon references, owned-ID collisions and malformed states are rejected', () => {
  const f = fixture(),
    s = createSession(f.c);
  const bad = () => structuredClone(f.c);
  let c = bad();
  c.sessions[0].characterIds = [crypto.randomUUID()];
  assert.throws(() => validateCampaign(c));
  c = bad();
  c.sessions[0].links = [
    { kind: 'room', id: f.target.roomId, dungeonId: crypto.randomUUID() },
  ];
  assert.throws(() => validateCampaign(c));
  c = bad();
  c.threads.push({
    id: s.id,
    title: 'Collision',
    notes: '',
    links: [],
    description: '',
    status: 'open',
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  });
  assert.throws(() => validateCampaign(c));
  c = bad();
  Object.assign(c.dungeons[0], { playState: 'destroyed' });
  assert.throws(() => validateCampaign(c));
  c = bad();
  Object.assign(c, { sessions: null });
  assert.throws(() => validateCampaign(c));
  c = bad();
  c.workspace.playDungeonId = f.dungeon.id;
  c.workspace.playRoomId = crypto.randomUUID();
  assert.throws(() => validateCampaign(c));
  c = bad();
  c.sessions[0].links = [{ kind: 'room', id: f.target.roomId }];
  assert.throws(() => validateCampaign(c));
});
test('Misery persistence validates unique d66 verses and only seventh terminal 7:7', () => {
  const { c } = fixture(),
    time = new Date().toISOString();
  for (let i = 0; i < 7; i++)
    c.miseries.push({
      id: crypto.randomUUID(),
      roll: i === 6 ? 77 : 11 + i,
      result: `Misery ${i + 1}`,
      sourceRefs: [{ bookTitle: 'MÖRK BORG BARE BONES EDITION', pdfPage: 17 }],
      date: '2026-09-05',
      inWorldDate: 'Day 17',
      sessionId: null,
      notes: '',
      terminal: i === 6,
      createdAt: time,
      updatedAt: time,
    });
  assert.deepEqual(
    validateCampaign(JSON.parse(JSON.stringify(c))).miseries,
    c.miseries,
  );
  assert.deepEqual(
    validateCampaign(cloneCampaign(c)).miseries.map((m) => m.result),
    c.miseries.map((m) => m.result),
  );
  const bad = structuredClone(c);
  bad.miseries[1].roll = 11;
  assert.throws(() => validateCampaign(bad));
  bad.miseries[1].roll = 17;
  assert.throws(() => validateCampaign(bad));
  bad.miseries[1].roll = 12;
  bad.miseries[6].terminal = false;
  assert.throws(() => validateCampaign(bad));
});
test('Campaign acceptance: Session 08 → play → capture → end → reload → export/import retains exact relations', () => {
  const f = fixture(),
    s = createSession(f.c, {
      number: 8,
      title: 'The Bell Beneath Sarkash',
      characterIds: f.characters.map((ch) => ch.id),
    });
  startSession(f.c, s.id);
  setDungeonState(f.c, f.dungeon.id, 'active');
  setRoomState(f.c, f.dungeon.id, f.target.roomId, 'visited');
  const instance = startSessionEncounter(f.c, s.id, f.placement.id);
  updateSessionEncounter(f.c, s.id, instance.id, { remaining: 0 });
  const npc = createNPC(f.c.id, 'sarkash', true);
  npc.name = 'Vorga';
  npc.notes = 'missing left hand, knows the grave path';
  f.c.npcs.push(npc);
  recordEvent(f.c, {
    title: 'Met Vorga',
    links: [{ kind: 'npc', id: npc.id, relation: 'met' }],
  });
  saveOracleEvent(f.c, oracle());
  const relic = createRelic(f.c, { title: 'Black Crown', origin: roomLink(f) });
  assignRelic(f.c, relic.id, { kind: 'character', id: f.characters[0].id });
  const thread = createThread(f.c, {
    title: 'Find the grave path',
    links: [{ kind: 'npc', id: npc.id }],
  });
  createRumor(f.c, {
    title: 'The crown remembers',
    status: 'heard',
    links: [{ kind: 'thread', id: thread.id }],
  });
  endSession(f.c, s.id, 'The Meatroaches fell; Risten carries the crown.');
  const loaded = validateSave(
    JSON.parse(
      JSON.stringify({
        ...emptySave(),
        campaigns: [f.c],
        activeCampaignId: f.c.id,
        view: 'campaign',
      }),
    ),
  );
  assert.deepEqual(loaded.campaigns[0], f.c);
  assert(f.c.timeline.length >= 10);
  assert.equal(f.c.timeline.find((e) => e.type === 'oracle')?.sessionId, s.id);
  assert.equal(f.dungeon.rooms[0].playState, 'visited');
  assert.equal(s.encounters[0].remaining, 0);
  assert.equal(s.status, 'ended');
  const imported = parseImport(
    JSON.stringify({ schemaVersion: 6, campaign: loaded.campaigns[0] }),
  );
  assert.deepEqual(imported[0], f.c);
  importCampaigns(loaded, imported);
  assert.equal(loaded.campaigns.length, 2);
  assert.deepEqual(chronicleRelationIssues(loaded.campaigns[1]), []);
  validateSave(loaded);
});

test('Quick Capture context targets a selected historical Session without changing the current Session', () => {
  const { c } = fixture(),
    old = createSession(c, { title: 'Earlier', date: '2026-08-01' }),
    current = createSession(c, { title: 'Current' });
  startSession(c, current.id);
  const context = {
    sessionId: old.id,
    date: '2026-08-01',
    inWorldDate: 'Day 4',
    description: 'Captured afterward',
  };
  createRumor(c, { title: 'Earlier rumor' }, context);
  createRelic(c, { title: 'Earlier relic' }, context);
  createJournalNote(c, { title: 'Earlier note' }, context);
  assert.equal(c.currentSessionId, current.id);
  for (const event of c.timeline.slice(-3)) {
    assert.equal(event.sessionId, old.id);
    assert.equal(event.date, '2026-08-01');
    assert.equal(event.inWorldDate, 'Day 4');
  }
  assert.equal(old.links.length, 3);
  assert.equal(current.links.length, 0);
  validateCampaign(c);
});

test('Manual and Session timeline events appear once in object backlinks and global reference options', () => {
  const f = fixture();
  const target: ObjectLink = { kind: 'npc', id: f.npc.id };
  const manual = recordEvent(f.c, {
    title: 'Alduteb disappeared',
    sessionId: null,
    links: [target, { ...target, relation: 'disappeared' }],
  });
  const session = createSession(f.c);
  startSession(f.c, session.id);
  const played = recordEvent(f.c, {
    title: 'Alduteb returned',
    links: [target],
  });
  const found = backlinks(f.c, target);
  assert.equal(
    found.filter(
      (entry) => entry.link.kind === 'event' && entry.link.id === manual.id,
    ).length,
    1,
  );
  assert.equal(
    found.filter(
      (entry) => entry.link.kind === 'event' && entry.link.id === played.id,
    ).length,
    1,
  );
  assert.equal(
    found.filter(
      (entry) => entry.link.kind === 'session' && entry.link.id === session.id,
    ).length,
    1,
  );
  assert.equal(
    objectLabel(f.c, { kind: 'event', id: manual.id }),
    'Alduteb disappeared',
  );
  assert(
    objectLinks(f.c).some(
      (entry) => entry.link.kind === 'event' && entry.link.id === manual.id,
    ),
  );
  assert(
    backlinks(f.c, { kind: 'session', id: session.id }).some(
      (entry) => entry.link.kind === 'event' && entry.link.id === played.id,
    ),
  );
  assert(
    backlinks(f.c, { kind: 'event', id: played.id }).some(
      (entry) => entry.link.kind === 'session' && entry.link.id === session.id,
    ),
  );
  validateCampaign(f.c);
});

test('Event references preserve stable source records across cloning and collision JSON import', () => {
  const f = fixture(),
    first = recordEvent(f.c, { title: 'The warning', links: [roomLink(f)] });
  const session = createSession(f.c);
  startSession(f.c, session.id);
  const second = recordEvent(f.c, {
    title: 'The consequence',
    links: [{ kind: 'event', id: first.id, relation: 'followed' }],
  });
  const thread = createThread(f.c, {
    title: 'Understand the warning',
    links: [{ kind: 'event', id: first.id }],
  });
  createJournalNote(f.c, {
    title: 'A later annotation',
    links: [{ kind: 'event', id: second.id }],
  });
  const copied = cloneCampaign(f.c);
  validateCampaign(copied);
  const copiedFirst = copied.timeline.find(
    (event) => event.title === first.title,
  )!;
  const copiedSecond = copied.timeline.find(
    (event) => event.title === second.title,
  )!;
  assert.notEqual(copiedFirst.id, first.id);
  assert.equal(copiedSecond.links[0].id, copiedFirst.id);
  assert.equal(
    copied.threads.find((record) => record.title === thread.title)!.links[0].id,
    copiedFirst.id,
  );
  const save = { ...emptySave(), campaigns: [f.c] };
  importCampaigns(
    save,
    parseImport(JSON.stringify({ schemaVersion: 6, campaign: f.c })),
  );
  validateSave(save);
  const imported = save.campaigns[1];
  assert.equal(
    imported.timeline.find((event) => event.title === second.title)!.links[0]
      .id,
    imported.timeline.find((event) => event.title === first.title)!.id,
  );
  assert.deepEqual(chronicleRelationIssues(imported), []);
});

test('Deleting an event prunes Session, journal and other-event references while retaining written history', () => {
  const f = fixture(),
    session = createSession(f.c);
  startSession(f.c, session.id);
  const first = recordEvent(f.c, { title: 'A warning engraved in the bell' });
  const second = recordEvent(f.c, {
    title: 'The warning came true',
    description: 'The written consequence remains',
    links: [{ kind: 'event', id: first.id }],
  });
  const note = createJournalNote(f.c, {
    title: 'The warning in my words',
    text: 'Preserve this text',
    links: [{ kind: 'event', id: first.id }],
  });
  f.c.workspace.chronicleId = first.id;
  deleteChronicleRecord(f.c, 'event', first.id);
  assert.equal(second.description, 'The written consequence remains');
  assert.equal(note.text, 'Preserve this text');
  assert.deepEqual(second.links, []);
  assert.deepEqual(note.links, []);
  assert(
    !session.links.some(
      (link) => link.kind === 'event' && link.id === first.id,
    ),
  );
  assert.equal(f.c.workspace.chronicleId, null);
  assert(
    !objectLinks(f.c).some(
      (entry) => entry.link.kind === 'event' && entry.link.id === first.id,
    ),
  );
  validateCampaign(f.c);
});

test('Unknown, foreign and mismatched event references are rejected without weakening typed custody rules', () => {
  const f = fixture(),
    event = recordEvent(f.c, { title: 'The warning' });
  const foreign = recordEvent(createCampaign('Other campaign'), {
    title: 'Foreign warning',
  });
  for (const badId of [crypto.randomUUID(), foreign.id, f.npc.id]) {
    const invalid = structuredClone(f.c);
    invalid.timeline.find((entry) => entry.id === event.id)!.links = [
      { kind: 'event', id: badId },
    ];
    assert.throws(() => validateCampaign(invalid));
  }
  const invalid = structuredClone(f.c);
  createRelic(invalid, {
    title: 'No event can carry a Relic',
    holder: { kind: 'event', id: event.id },
  });
  assert.throws(() => validateCampaign(invalid));
});

test('Historical death capture retains authoritative identity without contaminating the active Session', () => {
  const f = fixture();
  const old = createSession(f.c, {
    title: 'Before the thaw',
    date: '2026-07-04',
    inWorldDate: 'Ashday 4',
  });
  endSession(f.c, old.id, 'The old record');
  const active = createSession(f.c, {
    title: 'After the thaw',
    inWorldDate: 'Ashday 40',
  });
  startSession(f.c, active.id);
  const beforeActive = structuredClone(active),
    beforeEvents = f.c.timeline.length;
  applyCampaignEdit(f.c, (next) =>
    recordDeath(next, 'character', f.characters[0].id, {
      sessionId: old.id,
      date: old.date,
      inWorldDate: old.inWorldDate,
      title: 'Risten never left the chamber',
      description: 'Recorded in retrospect',
      // Context locations augment the death identity; they must not replace it.
      links: [roomLink(f)],
      type: 'custom',
    }),
  );
  assert.equal(f.c.timeline.length, beforeEvents + 1);
  const death = f.c.timeline.at(-1)!;
  assert.equal(death.type, 'character-death');
  assert.equal(death.sessionId, old.id);
  assert.equal(death.title, 'Risten never left the chamber');
  assert.equal(death.description, 'Recorded in retrospect');
  assert.equal(death.date, old.date);
  assert.equal(death.inWorldDate, old.inWorldDate);
  assert(
    death.links.some(
      (link) => link.kind === 'character' && link.id === f.characters[0].id,
    ),
  );
  assert(
    death.links.some(
      (link) => link.kind === 'room' && link.id === f.target.roomId,
    ),
  );
  assert.equal(old.status, 'ended');
  assert.equal(f.c.currentSessionId, active.id);
  assert.deepEqual(active, beforeActive);
  assert(old.characterIds.includes(f.characters[0].id));
  validateCampaign(f.c);
});

test('Historical NPC death with an explicit target link is not duplicated by the edit transaction', () => {
  const f = fixture(),
    old = createSession(f.c, { title: 'The old meeting' }),
    active = createSession(f.c, { title: 'The current meeting' });
  startSession(f.c, active.id);
  const beforeActive = structuredClone(active);
  applyCampaignEdit(f.c, (next) =>
    recordDeath(next, 'npc', f.npc.id, {
      sessionId: old.id,
      date: '2026-08-02',
      inWorldDate: 'Day 8',
      links: [{ kind: 'npc', id: f.npc.id, relation: '사망' }, roomLink(f)],
    }),
  );
  const deaths = f.c.timeline.filter((event) => event.type === 'npc-death');
  assert.equal(deaths.length, 1);
  assert.equal(deaths[0].sessionId, old.id);
  assert.equal(
    deaths[0].links.filter(
      (link) => link.kind === 'npc' && link.id === f.npc.id,
    ).length,
    1,
  );
  assert.equal(f.npcPlacement.playState, 'dead');
  assert.deepEqual(active, beforeActive);
  const reloaded = validateCampaign(JSON.parse(JSON.stringify(f.c))),
    imported = cloneCampaign(reloaded);
  validateCampaign(imported);
  assert.equal(
    imported.timeline.find((event) => event.type === 'npc-death')!.sessionId,
    imported.sessions[0].id,
  );
  assert.equal(imported.currentSessionId, imported.sessions[1].id);
  assert.deepEqual(chronicleRelationIssues(imported), []);
});

test('An explicitly unscoped death stays outside the active Session', () => {
  const f = fixture(),
    active = createSession(f.c);
  startSession(f.c, active.id);
  const beforeActive = structuredClone(active),
    beforeEvents = f.c.timeline.length;
  applyCampaignEdit(f.c, (next) =>
    recordDeath(next, 'character', f.characters[0].id, {
      sessionId: null,
      links: [roomLink(f)],
    }),
  );
  assert.equal(f.c.timeline.length, beforeEvents + 1);
  assert.equal(f.c.timeline.at(-1)!.sessionId, null);
  assert.deepEqual(active, beforeActive);
  assert.equal(f.c.currentSessionId, active.id);
  validateCampaign(f.c);
});

test('Event dates follow explicit capture metadata and the chosen Session world date', () => {
  const { c } = fixture();
  c.campaignDay = 90;
  const old = createSession(c, {
    title: 'Earlier',
    date: '2026-05-03',
    inWorldDate: 'The third toll',
  });
  const active = createSession(c, {
    title: 'Now',
    inWorldDate: 'The ninth toll',
  });
  startSession(c, active.id);
  const historical = recordEvent(c, {
    title: 'Remembered later',
    sessionId: old.id,
    date: old.date,
  });
  const overridden = recordEvent(c, {
    title: 'At another time',
    sessionId: old.id,
    date: '2026-05-04',
    inWorldDate: 'A different night',
  });
  const current = recordEvent(c, { title: 'Happened now' });
  const unscoped = recordEvent(c, {
    title: 'Beyond these Sessions',
    sessionId: null,
  });
  assert.equal(historical.inWorldDate, old.inWorldDate);
  assert.equal(historical.date, old.date);
  assert.equal(overridden.inWorldDate, 'A different night');
  assert.equal(overridden.date, '2026-05-04');
  assert.equal(current.sessionId, active.id);
  assert.equal(current.inWorldDate, active.inWorldDate);
  assert.equal(unscoped.sessionId, null);
  assert.equal(unscoped.inWorldDate, 'Day 90');
  assert.equal(c.currentSessionId, active.id);
  validateCampaign(c);
});
