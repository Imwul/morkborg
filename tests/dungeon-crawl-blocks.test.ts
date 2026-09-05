import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import type {
  OracleDefinition,
  OraclePack,
  OracleRegistry,
} from '../src/domain/oracle.ts';
import {
  advanceDungeonCrawl,
  completeDungeonRoom,
  prepareDungeonCrawl,
  resolveCrawlDice,
  resolveDungeonTransitionDanger,
  rollGenericCrawlRoom,
} from '../src/domain/dungeonCrawl.ts';
import { cloneCampaign } from '../src/domain/operations.ts';
import {
  deleteRoom,
  duplicateDungeon,
} from '../src/domain/monsterOperations.ts';
import {
  createCampaign,
  createDungeon,
  createDungeonCandidate,
  createRoom,
} from '../src/generators/index.ts';
import {
  prepareSpecialRooms,
  rerollSpecialRoom,
} from '../src/generators/specialRooms.ts';
import { type RulesPack, setRules } from '../src/storage/rulesStore.ts';
import { validateCampaign } from '../src/storage/schema.ts';

// Numeric source expectations only; complete private table text is never checked in.
const exitMatrix = [
  [1, 1, 1, 1, 1],
  [2, 2, 2, 2, 0],
  [2, 2, 0, 0, 0],
  [3, 0, 0, 0, 0],
];
function table(key: string, sides: number): OracleDefinition {
  return {
    id: key,
    title: key,
    dice: `d${sides}`,
    sourceBookId: 'sd',
    sourcePage: 15,
    printedPage: 13,
    sourceVerified: true,
    category: 'ROOM',
    tags: [],
    entries: Array.from({ length: sides }, (_, index) => ({
      id: `${key}:${index + 1}`,
      min: index + 1,
      max: index + 1,
      text: `Fixture result ${index + 1}`,
      ...(key === 'sd.room.exits'
        ? {
            metadata: {
              bySpecialRoomsUncovered: Object.fromEntries(
                exitMatrix[index].map((furtherExits, found) => [
                  String(found),
                  { printedValue: furtherExits || '-', furtherExits },
                ]),
              ),
            },
          }
        : {}),
    })),
  };
}
const registry: OracleRegistry = {
  books: [{ id: 'sd', title: 'Sölitary Defilement' }],
  procedures: [],
  tables: [
    table('sd.room.adjective', 20),
    table('sd.room.type', 12),
    table('sd.room.contents', 12),
    table('sd.room.exits', 4),
  ],
};
function queue(values: number[]) {
  let count = 0;
  return {
    rng: () => {
      assert.ok(count < values.length, 'unexpected additional die roll');
      return values[count++];
    },
    count: () => count,
  };
}
const die = (face: number, sides: number) => (face - 0.5) / sides;
const digest = (input: unknown) =>
  createHash('sha256').update(JSON.stringify(input)).digest('hex');
function prepared() {
  const c = createCampaign('Crawl regression fixture');
  const d = createDungeon(c.id, 'Named dungeon', 'sarkash', true);
  d.encounterTables = {
    common: Array(6).fill(null),
    rare: Array(6).fill(null),
    dungeonDR: 12,
  };
  c.dungeons.push(d);
  prepareDungeonCrawl(d, true);
  return { c, d };
}

test('crawl preparation preserves legacy rooms and notes, adds four separate undiscovered anchors, and is idempotent', () => {
  const c = createCampaign('Legacy');
  const d = createDungeon(c.id, 'Old dungeon', 'sarkash', true);
  d.rooms = [createRoom('sarkash', true), createRoom('sarkash', true)];
  d.rooms[0].notes = 'Already played by hand';
  const legacy = digest(d.rooms);
  prepareDungeonCrawl(d, true);
  assert.equal(d.rooms.length, 6);
  assert.equal(digest(d.rooms.slice(0, 2)), legacy);
  assert.equal(d.crawl!.specialRoomIds.length, 4);
  assert.deepEqual(d.crawl!.discoveredSpecialIds, []);
  assert.deepEqual(d.crawl!.visitedRoomIds, []);
  assert.equal(d.crawl!.phase, 'entrance');
  const before = digest(d);
  prepareDungeonCrawl(d);
  assert.equal(digest(d), before);
});

test('preparing already defined four special rooms reuses their IDs without changing their content', () => {
  const { d } = prepared();
  delete d.crawl;
  const before = digest(d.rooms),
    ids = d.rooms.map((room) => room.id);
  prepareDungeonCrawl(d);
  assert.equal(digest(d.rooms), before);
  assert.deepEqual(d.crawl!.specialRoomIds, ids);
  assert.deepEqual(d.crawl!.discoveredSpecialIds, []);
});

test('crawl dice apply found-room bonus to each die and reject invalid dice, counts and DR', () => {
  assert.equal(resolveCrawlDice([11, 11], 0, 12).outcome, 'miss');
  assert.equal(resolveCrawlDice([11, 11], 1, 12).outcome, 'strong');
  assert.equal(resolveCrawlDice([11, 10], 1, 12).outcome, 'weak');
  assert.equal(resolveCrawlDice([8, 8], 4, 12).exhausted, true);
  assert.equal(resolveCrawlDice([8, 8], 4, 12).outcome, 'weak');
  assert.equal(resolveCrawlDice([7, 7], 4, 12).outcome, 'miss');
  for (const [dice, bonus, dr] of [
    [[0, 20], 0, 12],
    [[1, 21], 0, 12],
    [[1, 1], -1, 12],
    [[1, 1], 5, 12],
    [[1, 1], 0, 5],
    [[1, 1], 0, 15],
    [[1, 1], 0, 12.5],
  ] as const)
    assert.throws(() => resolveCrawlDice([...dice], bonus, dr));
});

test('Strong discovers each prepared room in order; the fifth Strong becomes a generic room with no extra special discovery', () => {
  const { d } = prepared(),
    originalIds = [...d.crawl!.specialRoomIds];
  for (let found = 0; found < 4; found++) {
    const face = 12 - found,
      rolls = queue([die(face, 20), die(face, 20)]);
    const result = advanceDungeonCrawl(d, registry, rolls.rng);
    assert.equal(result.outcome, 'strong');
    assert.equal(result.bonus, found);
    assert.equal(rolls.count(), 2);
    assert.equal(d.crawl!.currentRoomId, originalIds[found]);
    assert.equal(d.rooms.length, 4);
    assert.deepEqual(
      d.crawl!.discoveredSpecialIds,
      originalIds.slice(0, found + 1),
    );
    completeDungeonRoom(d);
  }
  const rolls = queue([die(8, 20), die(8, 20), 0, 0, 0, die(4, 4)]);
  const result = advanceDungeonCrawl(d, registry, rolls.rng);
  assert.equal(result.exhausted, true);
  assert.equal(result.outcome, 'weak');
  assert.equal(d.rooms.length, 5);
  assert.equal(d.rooms.at(-1)!.kind, 'generic');
  assert.equal(d.rooms.at(-1)!.exits, 0);
  assert.deepEqual(d.crawl!.discoveredSpecialIds, originalIds);
  assert.equal(rolls.count(), 6);
});

test('an unresolved room or danger blocks advancing and invalid resolution calls do not mutate state', () => {
  const { d } = prepared();
  for (const phase of ['entrance', 'ready', 'danger', 'room'] as const) {
    d.crawl!.phase = phase;
    const before = digest(d);
    if (phase === 'danger' || phase === 'room')
      assert.throws(
        () =>
          advanceDungeonCrawl(d, registry, () => {
            throw Error('must not roll');
          }),
        /먼저 해결/,
      );
    if (phase !== 'danger')
      assert.throws(() => resolveDungeonTransitionDanger(d, registry));
    if (phase !== 'room') assert.throws(() => completeDungeonRoom(d));
    assert.equal(digest(d), before);
  }
});

test('Miss creates no room until its danger is resolved, survives reload, and resolution never rolls another Crawl', () => {
  const { c, d } = prepared();
  const rolls = queue([0, 0]);
  advanceDungeonCrawl(d, registry, rolls.rng);
  assert.equal(rolls.count(), 2);
  assert.equal(d.rooms.length, 4);
  assert.equal(d.crawl!.phase, 'danger');
  assert.equal(d.crawl!.currentRoomId, null);
  const restored = validateCampaign(JSON.parse(JSON.stringify(c))).dungeons[0];
  assert.equal(restored.crawl!.phase, 'danger');
  const lastRoll = digest(restored.crawl!.lastRoll);
  const contentsOnly = queue([0, 0, 0, 0]);
  resolveDungeonTransitionDanger(restored, registry, contentsOnly.rng);
  assert.equal(contentsOnly.count(), 4);
  assert.equal(digest(restored.crawl!.lastRoll), lastRoll);
  assert.equal(restored.crawl!.phase, 'room');
  assert.equal(restored.rooms.length, 5);
  assert.equal(restored.rooms.at(-1)!.kind, 'generic');
  assert.deepEqual(restored.crawl!.discoveredSpecialIds, []);
});

test('Weak creates exactly one generic room; completing it only unlocks the next deliberate Crawl', () => {
  const { d } = prepared();
  const rolls = queue([0.999, 0, 0, 0, 0, 0]);
  assert.equal(advanceDungeonCrawl(d, registry, rolls.rng).outcome, 'weak');
  assert.equal(rolls.count(), 6);
  assert.equal(d.crawl!.phase, 'room');
  assert.equal(d.rooms.length, 5);
  assert.deepEqual(d.crawl!.discoveredSpecialIds, []);
  const rooms = digest(d.rooms),
    lastRoll = digest(d.crawl!.lastRoll);
  completeDungeonRoom(d);
  assert.equal(d.crawl!.phase, 'ready');
  assert.equal(digest(d.rooms), rooms);
  assert.equal(digest(d.crawl!.lastRoll), lastRoll);
});

function checkExitMatrix(source: OracleRegistry) {
  for (let found = 0; found <= 4; found++)
    for (let face = 1; face <= 4; face++) {
      const rolls = queue([0, 0, 0, die(face, 4)]);
      const room = rollGenericCrawlRoom(source, found, rolls.rng);
      assert.equal(
        room.exits,
        exitMatrix[face - 1][found],
        `d4 ${face}, discovered ${found}`,
      );
      assert.equal(rolls.count(), 4);
      assert.match(room.sources!.feature, /Special Rooms/);
    }
}
test('every source-shaped exit matrix cell uses furtherExits, including printed dash as zero', () =>
  checkExitMatrix(registry));

test('missing source or invalid exit context leaves the pending crawl state untouched', () => {
  const { d } = prepared(),
    before = digest(d);
  const incomplete = {
    ...registry,
    tables: registry.tables.filter((t) => t.id !== 'sd.room.exits'),
  };
  assert.throws(() =>
    advanceDungeonCrawl(d, incomplete, queue([0.999, 0, 0, 0, 0]).rng),
  );
  assert.equal(digest(d), before);
  for (const found of [-1, 5])
    assert.throws(() => rollGenericCrawlRoom(registry, found, () => 0));
});

test('campaign and dungeon copies remap all crawl room references and leave the source intact', () => {
  const { c, d } = prepared();
  advanceDungeonCrawl(d, registry, () => 0.999);
  const original = digest(d);
  const campaignCopy = cloneCampaign(c),
    dungeonCopy = duplicateDungeon(c, d.id);
  for (const copy of [campaignCopy.dungeons[0], dungeonCopy]) {
    const ids = new Set(copy.rooms.map((room) => room.id));
    assert.notEqual(copy.id, d.id);
    assert.equal(copy.crawl!.phase, 'room');
    for (const roomId of [
      ...copy.crawl!.specialRoomIds,
      ...copy.crawl!.discoveredSpecialIds,
      ...copy.crawl!.visitedRoomIds,
      copy.crawl!.currentRoomId!,
    ]) {
      assert.ok(ids.has(roomId));
      assert.ok(!d.rooms.some((room) => room.id === roomId));
    }
  }
  assert.equal(digest(d), original);
  assert.doesNotThrow(() => validateCampaign(c));
  assert.doesNotThrow(() => validateCampaign(campaignCopy));
});

test('rejecting deletion of a prepared special room preserves placement targets before throwing', () => {
  const { c, d } = prepared();
  c.workspace.contentTarget = { dungeonId: d.id, roomId: d.rooms[0].id };
  const before = digest(c);
  assert.throws(() => deleteRoom(c, d.id, d.rooms[0].id));
  assert.equal(digest(c), before);
});

const fixturePath =
  process.env.MORKBORG_PRIVATE_AUDIT_FIXTURE ??
  'outputs/morkborg-private-data.json';
const hasFixture = existsSync(fixturePath);
const fixture = hasFixture
  ? (JSON.parse(readFileSync(fixturePath, 'utf8')) as {
      library: RulesPack;
      oracles: OraclePack;
    })
  : null;
test(
  'private source fixture: all 20 contextual exits match the installed canonical nested matrix',
  { skip: !hasFixture },
  () =>
    checkExitMatrix(buildOracleRegistry(fixture!.library, fixture!.oracles)),
);

test(
  'private source fixture: generation prepares exactly four specials with eight distinct source detail seeds',
  { skip: !hasFixture },
  () => {
    setRules(fixture!.library);
    const { d } = prepared();
    for (const edge of [0, 0.999999]) {
      d.rooms = prepareSpecialRooms(d, false, () => edge);
      assert.equal(d.rooms.length, 4);
      assert.ok(d.rooms.every((room) => room.kind === 'special'));
      const details = d.rooms.flatMap((room) => room.specialDetailIds ?? []);
      assert.equal(details.length, 8);
      assert.equal(new Set(details).size, 8);
      assert.ok(d.rooms.every((room) => room.feature.includes(d.title)));
      assert.ok(
        d.rooms.every((room) => room.sources!.feature.includes('앱 해석')),
      );
    }
    for (const requestedCount of [1, 9]) {
      const candidate = createDungeonCandidate(
        d.campaignId,
        'sarkash',
        requestedCount,
      );
      assert.equal(candidate.rooms.length, 4);
      assert.equal(
        new Set(candidate.rooms.flatMap((room) => room.specialDetailIds ?? []))
          .size,
        8,
      );
    }
  },
);

test(
  'private source fixture: rerolling one special preserves its identity, notes, assignments and other rooms',
  { skip: !hasFixture },
  () => {
    setRules(fixture!.library);
    const { d } = prepared();
    d.rooms = prepareSpecialRooms(d, false, () => 0);
    const target = d.rooms[1],
      originalId = target.id,
      others = digest(d.rooms.filter((room) => room.id !== target.id));
    target.notes = 'Played detail';
    target.encounter = 'Assigned encounter';
    target.npcIds = ['fixture-assignment'];
    rerollSpecialRoom(d, target, () => 0.999999);
    assert.equal(target.id, originalId);
    assert.equal(target.notes, 'Played detail');
    assert.equal(target.encounter, 'Assigned encounter');
    assert.deepEqual(target.npcIds, ['fixture-assignment']);
    assert.equal(
      digest(d.rooms.filter((room) => room.id !== target.id)),
      others,
    );
    assert.equal(
      new Set(d.rooms.flatMap((room) => room.specialDetailIds ?? [])).size,
      8,
    );
  },
);
