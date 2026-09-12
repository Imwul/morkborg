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
  resolveCrawlDice,
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
  d.rooms.push(...prepareSpecialRooms(d, true));
  d.crawl = {
    phase: 'entrance',
    specialRoomIds: d.rooms.map((r) => r.id),
    discoveredSpecialIds: [],
    visitedRoomIds: [],
    currentRoomId: null,
    threatRating: 12,
  };
  return { c, d };
}

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
  assert.throws(() => rollGenericCrawlRoom(incomplete, 0, () => 0));
  assert.equal(digest(d), before);
  for (const found of [-1, 5])
    assert.throws(() => rollGenericCrawlRoom(registry, found, () => 0));
});

test('campaign and dungeon copies remap all crawl room references and leave the source intact', () => {
  const { c, d } = prepared();
  // Fixture of a previously exported play record, not a new game operation.
  d.crawl!.phase = 'room';
  d.crawl!.currentRoomId = d.rooms[0].id;
  d.crawl!.discoveredSpecialIds = [d.rooms[0].id];
  d.crawl!.visitedRoomIds = [d.rooms[0].id];
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
  'private source fixture: generation prepares four single Core samples and preserves legitimate repetitions',
  { skip: !hasFixture },
  () => {
    setRules(fixture!.library);
    const { d } = prepared();
    for (const edge of [0, 0.999999]) {
      d.rooms = prepareSpecialRooms(d, false, () => edge);
      assert.equal(d.rooms.length, 4);
      assert.ok(d.rooms.every((room) => room.kind === 'special'));
      const details = d.rooms.flatMap((room) => room.specialDetailIds ?? []);
      assert.equal(details.length, 4);
      assert.equal(
        new Set(details).size,
        1,
        'identical source rolls must not be silently rerolled',
      );
      assert.ok(d.rooms.every((room) => room.feature === ''));
      assert.ok(
        d.rooms.every((room) =>
          room.components?.every(
            (component) => component.provenance.status === 'VERIFIED',
          ),
        ),
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
        candidate.rooms.flatMap((room) => room.specialDetailIds ?? []).length,
        4,
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
      d.rooms.flatMap((room) => room.specialDetailIds ?? []).length,
      4,
    );
    assert.equal(target.components?.[0].provenance.rolls?.[0].value, 46);
  },
);
