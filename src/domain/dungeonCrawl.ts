import type { Dungeon, DungeonRoom } from './types';
import type { OracleRegistry } from './oracle';
import { id, random, rollDie, type RandomSource } from '../generators/random';
import {
  rollOracle,
  selectOracleEntry,
  sourceLabel,
} from '../generators/oracleRoller';
import { oracleReadingText } from './referenceReading';
import { prepareSpecialRooms } from '../generators/specialRooms';
export interface DungeonCrawlRoll {
  dice: [number, number];
  bonus: number;
  dr: number;
  outcome: 'strong' | 'weak' | 'miss';
  exhausted: boolean;
}
export interface DungeonCrawlState {
  phase: 'entrance' | 'ready' | 'danger' | 'room';
  specialRoomIds: string[];
  discoveredSpecialIds: string[];
  visitedRoomIds: string[];
  currentRoomId: string | null;
  threatRating: 9 | 12 | 15;
  lastRoll?: DungeonCrawlRoll;
}
export function prepareDungeonCrawl(d: Dungeon, blank = false) {
  if (d.crawl) return;
  let special = d.rooms.filter((room) => room.kind === 'special');
  if (special.length !== 4) {
    // Old rooms are never converted or removed. A legacy dungeon gains a separate preparation set.
    special = prepareSpecialRooms(d, blank);
    d.rooms.push(...special);
  }
  d.crawl = {
    phase: 'entrance',
    specialRoomIds: special.map((room) => room.id),
    discoveredSpecialIds: [],
    visitedRoomIds: [],
    currentRoomId: null,
    threatRating: 12,
  };
}
export function resolveCrawlDice(
  dice: [number, number],
  bonus: number,
  dr: number,
): DungeonCrawlRoll {
  if (
    !dice.every(
      (value) => Number.isInteger(value) && value >= 1 && value <= 20,
    ) ||
    !Number.isInteger(bonus) ||
    bonus < 0 ||
    bonus > 4 ||
    !Number.isInteger(dr) ||
    dr < 6 ||
    dr > 14
  )
    throw new Error('크롤 주사위·DR·발견 수를 확인하세요.');
  const hits = dice.filter((value) => value + bonus >= dr).length;
  const exhausted = hits === 2 && bonus === 4;
  return {
    dice,
    bonus,
    dr,
    exhausted,
    outcome: hits === 2 && !exhausted ? 'strong' : hits > 0 ? 'weak' : 'miss',
  };
}
export function rollGenericCrawlRoom(
  registry: OracleRegistry,
  discovered: number,
  rng: RandomSource = random,
): DungeonRoom {
  const get = (key: string) => {
    const table = registry.tables.find((item) => item.id === key);
    if (!table?.sourceVerified)
      throw new Error(`확인된 원문 표가 필요합니다: ${key}`);
    return table;
  };
  const adjective = rollOracle(get('sd.room.adjective'), registry, rng),
    type = rollOracle(get('sd.room.type'), registry, rng),
    contents = rollOracle(get('sd.room.contents'), registry, rng);
  const table = get('sd.room.exits'),
    die = rollDie(4, rng),
    entry = selectOracleEntry(table, die);
  const matrix = entry.metadata?.bySpecialRoomsUncovered;
  const cell =
    matrix && typeof matrix === 'object'
      ? (matrix as Record<string, unknown>)[String(discovered)]
      : null;
  const exits =
    cell && typeof cell === 'object'
      ? (cell as Record<string, unknown>).furtherExits
      : undefined;
  if (
    typeof exits !== 'number' ||
    !Number.isInteger(exits) ||
    exits < 0 ||
    exits > 3
  )
    throw new Error('발견한 특별한 방 수에 맞는 출구표가 필요합니다.');
  return {
    id: id(),
    kind: 'generic',
    generation: {
      system: 'sd.room',
      rolls: {
        adjective: adjective.roll,
        type: type.roll,
        contents: contents.roll,
        exits: die,
      },
    },
    name: `${adjective.text} ${type.text}`,
    description: oracleReadingText(contents),
    feature: `출구 ${exits}개 · d4 = ${die} · 특별한 방 ${discovered}/4 발견`,
    exits,
    danger: '',
    treasure: '',
    encounter: '',
    notes: '',
    monsterIds: [],
    npcIds: [],
    encounterIds: [],
    sources: {
      name: adjective.source + ' + ' + type.source,
      description: contents.source,
      feature:
        sourceLabel(table, registry) +
        ` · d4 ${die} / Special Rooms ${discovered}`,
    },
  };
}
function enter(d: Dungeon, room: DungeonRoom) {
  const state = d.crawl!;
  state.currentRoomId = room.id;
  state.visitedRoomIds.push(room.id);
  state.phase = 'room';
}
export function advanceDungeonCrawl(
  d: Dungeon,
  registry: OracleRegistry,
  rng: RandomSource = random,
) {
  const state = d.crawl;
  if (!state || !['entrance', 'ready'].includes(state.phase))
    throw new Error('현재 방이나 위험을 먼저 해결하세요.');
  const result = resolveCrawlDice(
    [rollDie(20, rng), rollDie(20, rng)],
    state.discoveredSpecialIds.length,
    d.encounterTables?.dungeonDR ?? 12,
  );
  if (result.outcome === 'strong') {
    const roomId = state.specialRoomIds.find(
      (key) => !state.discoveredSpecialIds.includes(key),
    );
    const room = d.rooms.find((item) => item.id === roomId);
    if (!room) throw new Error('준비된 특별한 방을 확인하세요.');
    state.discoveredSpecialIds.push(room.id);
    enter(d, room);
  } else if (result.outcome === 'weak') {
    const room = rollGenericCrawlRoom(
      registry,
      state.discoveredSpecialIds.length,
      rng,
    );
    d.rooms.push(room);
    enter(d, room);
  } else state.phase = 'danger';
  state.lastRoll = result;
  return result;
}
export function resolveDungeonTransitionDanger(
  d: Dungeon,
  registry: OracleRegistry,
  rng: RandomSource = random,
) {
  if (d.crawl?.phase !== 'danger')
    throw new Error('해결할 이동 위험이 없습니다.');
  const room = rollGenericCrawlRoom(
    registry,
    d.crawl.discoveredSpecialIds.length,
    rng,
  );
  d.rooms.push(room);
  enter(d, room);
}
export function completeDungeonRoom(d: Dungeon) {
  if (d.crawl?.phase !== 'room') throw new Error('현재 방을 먼저 확인하세요.');
  d.crawl.phase = 'ready';
}
export function remapDungeonCrawl(d: Dungeon, replace: (id: string) => string) {
  if (!d.crawl) return;
  for (const key of [
    'specialRoomIds',
    'discoveredSpecialIds',
    'visitedRoomIds',
  ] as const)
    d.crawl[key] = d.crawl[key].map(replace);
  if (d.crawl.currentRoomId)
    d.crawl.currentRoomId = replace(d.crawl.currentRoomId);
}

/** Follow the current room's canonical contents row, without generating another encounter pool. */
export function dungeonRoomFollowUps(
  room: DungeonRoom,
  registry: OracleRegistry,
): { encounterKind?: 'common' | 'rare'; ids: string[] } {
  if (room.generation?.system !== 'sd.room') return { ids: [] };
  const table = registry.tables.find((item) => item.id === 'sd.room.contents');
  if (!table) return { ids: [] };
  const meta = selectOracleEntry(table, room.generation.rolls.contents)
    ?.metadata?.followUp;
  if (!meta || typeof meta !== 'object') return { ids: [] };
  const follow = meta as {
    procedure?: string;
    tables?: string[];
    choices?: unknown[];
  };
  if (follow.procedure === 'sd.stockCommon')
    return { encounterKind: 'common', ids: ['oracle:core.reaction'] };
  if (follow.procedure === 'sd.stockRare')
    return { encounterKind: 'rare', ids: ['oracle:core.reaction'] };
  if (follow.procedure === 'sd.npc')
    return { ids: ['procedure:workbench.npc', 'oracle:core.reaction'] };
  if (follow.choices)
    return {
      ids: [
        'oracle:feretory.A',
        'rule:depths.rareMonster',
        'oracle:core.reaction',
      ],
    };
  return { ids: (follow.tables ?? []).map((key) => `oracle:${key}`) };
}
