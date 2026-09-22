import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  DNGNGEN_POOL_ROLES,
  DngngenPackError,
  dngngenPackPayload,
  parseDngngenPack,
  type DngngenPack,
} from '../src/domain/dngngenPack.ts';
import {
  dngngenRoomPools,
  rollDngngenRoom,
  rollDngngenRooms,
} from '../src/generators/dngngen.ts';
import {
  createSyntheticDngngenPack,
  sealSyntheticDngngenPack,
} from './fixtures/dngngenSynthetic.ts';

type Mutable<T> = T extends readonly (infer U)[]
  ? Mutable<U>[]
  : T extends object
    ? { -readonly [P in keyof T]: Mutable<T[P]> }
    : T;
function draft() {
  return structuredClone(createSyntheticDngngenPack()) as Mutable<DngngenPack>;
}
function parsed(value: DngngenPack = createSyntheticDngngenPack()) {
  return parseDngngenPack(value, { allowSynthetic: true });
}
function plainPack() {
  const value = draft();
  for (const entries of Object.values(value.pools))
    for (const entry of entries) {
      entry.values = [];
      value.messages[entry.messageId] = [
        { type: 'text', text: `${entry.id} NEUTRAL TEST` },
      ];
    }
  return parsed(sealSyntheticDngngenPack(value));
}
function queue(values: number[]) {
  let draws = 0;
  return {
    rng: () => {
      assert.ok(draws < values.length, 'No hidden RNG draw');
      return values[draws++];
    },
    draws: () => draws,
  };
}
function invalid(change: (value: Mutable<DngngenPack>) => void, code: string) {
  const value = draft();
  change(value);
  assert.throws(
    () => parsed(value),
    (error: unknown) =>
      error instanceof DngngenPackError && error.code === code,
  );
}
const ids = (room: ReturnType<typeof rollDngngenRoom>) =>
  room.components.map((part) => part.entryId);

test('private pack requires an explicit synthetic opt-in and cannot certify invented data by default', () => {
  assert.throws(
    () => parseDngngenPack(createSyntheticDngngenPack()),
    /snapshot-profile/,
  );
  const pack = parsed();
  assert.equal(pack.profile, 'synthetic');
  assert.match(pack.source.attribution, /not DNGNGEN source/);
});
test('missing pack and malformed pack fail with sanitizable errors', () => {
  for (const input of [
    undefined,
    null,
    '',
    [],
    { arbitrary: 'PRIVATE_PROSE_CANARY' },
  ]) {
    assert.throws(
      () => parseDngngenPack(input),
      (error: unknown) =>
        error instanceof DngngenPackError &&
        !error.message.includes('PRIVATE_PROSE_CANARY'),
    );
  }
});
test('pool roles, IDs and declared counts must resolve exactly', () => {
  invalid((pack) => {
    delete (pack.pools as Partial<typeof pack.pools>).D;
  }, 'fields');
  invalid((pack) => {
    pack.pools.A[0].id = '';
  }, 'text');
  invalid((pack) => {
    pack.integrity.poolCounts.A++;
  }, 'pool-count');
  invalid((pack) => {
    (pack.pools as unknown as Record<string, unknown>).AB = pack.pools.A;
  }, 'fields');
});
test('the audited current profile checks counts, version and identity uniqueness', () => {
  invalid((pack) => {
    pack.profile = 'dngngen-1.0.0';
    pack.snapshot.version = '1.0.0';
  }, 'snapshot-count');
  invalid((pack) => {
    pack.profile = 'dngngen-1.0.0';
  }, 'snapshot-version');
  const value = draft();
  value.profile = 'dngngen-1.0.0';
  value.snapshot.version = '1.0.0';
  for (const role of DNGNGEN_POOL_ROLES) {
    const count = role === 'A' || role === 'B' ? 39 : 34;
    value.pools[role] = Array.from({ length: count }, (_, index) => {
      const id = `INVENTED-${role}-${index}`;
      value.messages[id] = [
        { type: 'text', text: `INVENTED NEUTRAL ${role} ${index}` },
      ];
      return { id, messageId: id, values: [] };
    });
    value.integrity.poolCounts[role] = count;
  }
  assert.equal(
    parseDngngenPack(sealSyntheticDngngenPack(value)).pools.D.length,
    34,
  );
  value.pools.A[1] = value.pools.A[0];
  assert.throws(() => parseDngngenPack(value), /snapshot-ids/);
});
test('snapshot dates, required identity and unsafe source URLs are rejected', () => {
  invalid((pack) => {
    pack.snapshot.id = '';
  }, 'text');
  invalid((pack) => {
    pack.snapshot.auditedAt = '2026-02-31';
  }, 'snapshot-date');
  invalid((pack) => {
    pack.source.url = 'javascript:alert(1)';
  }, 'source-url');
  invalid((pack) => {
    pack.source.url = 'https://username:password@example.invalid';
  }, 'source-url');
});
test('all static templates and variables must resolve, including unused missing dependencies', () => {
  invalid((pack) => {
    delete pack.messages[pack.pools.A[0].messageId];
  }, 'missing-template');
  invalid((pack) => {
    pack.messages.UNUSED = [{ type: 'message', id: 'MISSING' }];
  }, 'missing-template');
  invalid((pack) => {
    pack.messages[pack.pools.A[0].messageId] = [
      { type: 'value', name: 'missing' },
    ];
  }, 'missing-variable');
});
test('static and sampled-message cycles or missing formatting dependencies are invalid', () => {
  invalid((pack) => {
    pack.messages.LOOP = [{ type: 'message', id: 'LOOP' }];
  }, 'template-cycle');
  invalid((pack) => {
    delete pack.messages['LABEL-BLUE'];
  }, 'missing-template');
  invalid((pack) => {
    pack.messages['LABEL-BLUE'] = [
      { type: 'message', id: pack.pools.A[3].messageId },
    ];
  }, 'template-cycle');
});
test('unsupported random operations, bad ranges and nonnumeric sums fail before generation', () => {
  invalid((pack) => {
    pack.pools.A[0].values = [{ name: 'bad', recipe: { op: 'eval' } as never }];
  }, 'unsupported-recipe');
  invalid((pack) => {
    pack.pools.A[0].values = [
      { name: 'bad', recipe: { op: 'int', min: 4, max: 1 } },
    ];
  }, 'integer-range');
  invalid((pack) => {
    pack.pools.A[0].values = [
      {
        name: 'bad',
        recipe: { op: 'sum', terms: [{ op: 'literal', value: 'TEXT' }] },
      },
    ];
  }, 'sum-nonnumeric');
  invalid((pack) => {
    pack.pools.A[0].values = [
      {
        name: 'bad',
        recipe: {
          op: 'sum',
          terms: [
            { op: 'literal', value: Number.MAX_SAFE_INTEGER },
            { op: 'literal', value: 1 },
          ],
        },
      },
    ];
  }, 'sum-range');
  invalid((pack) => {
    pack.pools.A[0].values = [
      { name: 'bad', recipe: { op: 'sample', values: [] } },
    ];
  }, 'array');
});
test('duplicate names and conflicting definitions of an entry ID are rejected', () => {
  invalid((pack) => {
    pack.pools.A[1].values.push(pack.pools.A[1].values[0]);
  }, 'duplicate-variable');
  invalid((pack) => {
    pack.pools.A[1].id = pack.pools.A[0].id;
  }, 'conflicting-entry-id');
});
test('payload checksum preserves ordered arrays and multiplicity but ignores object key insertion order', () => {
  const value = draft();
  const hash = (pack: DngngenPack) =>
    createHash('sha256').update(dngngenPackPayload(pack)).digest('hex');
  assert.equal(hash(value), value.integrity.payloadSha256);
  assert.equal(
    hash({
      ...value,
      source: {
        attribution: value.source.attribution,
        url: value.source.url,
        project: value.source.project,
        author: value.source.author,
      },
    }),
    hash(value),
  );
  const swapped = draft();
  [swapped.pools.A[0], swapped.pools.A[1]] = [
    swapped.pools.A[1],
    swapped.pools.A[0],
  ];
  assert.notEqual(hash(swapped), hash(value));
  const repeated = draft();
  repeated.pools.A.push(repeated.pools.A[0]);
  repeated.integrity.poolCounts.A++;
  assert.notEqual(hash(repeated), hash(value));
});
test('parse isolates and deeply freezes source data without modifying caller data or consuming RNG', () => {
  const value = draft();
  const before = JSON.stringify(value);
  const previous = Math.random;
  Math.random = () => {
    throw new Error('Unexpected RNG');
  };
  const cryptoTrap = mock.method(globalThis.crypto, 'getRandomValues', () => {
    throw new Error('Unexpected dice RNG');
  });
  try {
    const pack = parsed(value);
    assert.equal(JSON.stringify(value), before);
    assert.equal(Object.isFrozen(value), false);
    assert.equal(Object.isFrozen(pack.pools.A[0].values), true);
    assert.equal(Object.isFrozen(pack.messages), true);
    value.pools.A[0].id = 'DIFFERENT';
    assert.notEqual(pack.pools.A[0].id, value.pools.A[0].id);
    assert.equal(dngngenRoomPools(pack, 4)[0].length, 12);
    assert.equal(cryptoTrap.mock.callCount(), 0);
  } finally {
    Math.random = previous;
    cryptoTrap.mock.restore();
  }
});
test('each slot uses its exact pair of source-order pool views', () => {
  const pack = plainPack();
  assert.deepEqual(dngngenRoomPools(pack, 1), [pack.pools.A, pack.pools.B]);
  assert.deepEqual(dngngenRoomPools(pack, 2), [pack.pools.A, pack.pools.C]);
  assert.deepEqual(dngngenRoomPools(pack, 3), [pack.pools.B, pack.pools.D]);
  assert.deepEqual(dngngenRoomPools(pack, 4), [
    [...pack.pools.A, ...pack.pools.B],
    [...pack.pools.C, ...pack.pools.D],
  ]);
  assert.deepEqual(ids(rollDngngenRoom(pack, 4, [], () => 0.5)), [
    'SYNTHETIC-B-1',
    'SYNTHETIC-D-1',
  ]);
});
test('every index in every slot pool is reachable, including first, middle and last positions', () => {
  const pack = plainPack();
  for (const slot of [1, 2, 3, 4] as const)
    for (const [component, pool] of dngngenRoomPools(pack, slot).entries()) {
      for (let index = 0; index < pool.length; index++) {
        const values = [0, 0];
        values[component] = (index + 0.5) / pool.length;
        const rng = queue(values);
        const room = rollDngngenRoom(pack, slot, [], rng.rng);
        assert.equal(room.components[component].entryId, pool[index].id);
        assert.equal(rng.draws(), 2);
      }
    }
});
test('uniform selection uses array positions and does not collapse repeated positions', () => {
  const value = structuredClone(plainPack()) as Mutable<DngngenPack>;
  value.pools.A = [value.pools.A[0], value.pools.A[0], value.pools.A[1]];
  value.integrity.poolCounts.A = 3;
  const pack = parsed(sealSyntheticDngngenPack(value));
  const selected = Array.from(
    { length: 3 },
    (_, index) =>
      ids(rollDngngenRoom(pack, 1, [], queue([(index + 0.5) / 3, 0]).rng))[0],
  );
  assert.deepEqual(selected, [
    'SYNTHETIC-A-1',
    'SYNTHETIC-A-1',
    'SYNTHETIC-A-2',
  ]);
});
test('other current room IDs are excluded, while own previous IDs may recur', () => {
  const pack = plainPack();
  const first = rollDngngenRoom(pack, 1, [], () => 0);
  assert.deepEqual(ids(rollDngngenRoom(pack, 1, [first], () => 0)), ids(first));
  const second = rollDngngenRoom(pack, 2, [first], () => 0);
  assert.deepEqual(ids(second), ['SYNTHETIC-A-2', 'SYNTHETIC-C-1']);
  assert.deepEqual(
    ids(rollDngngenRoom(pack, 1, [first, second], () => 0)),
    ids(first),
  );
});
test('exclusion removes every position of an excluded ID, never just one repeated position', () => {
  const value = structuredClone(plainPack()) as Mutable<DngngenPack>;
  value.pools.A.splice(1, 0, value.pools.A[0]);
  value.integrity.poolCounts.A++;
  const pack = parsed(sealSyntheticDngngenPack(value));
  const first = rollDngngenRoom(pack, 1, [], () => 0);
  assert.equal(
    rollDngngenRoom(pack, 2, [first], () => 0).components[0].entryId,
    'SYNTHETIC-A-2',
  );
});
test('full generation uses a fresh ordered accumulator and exactly eight plain selections', () => {
  const pack = plainPack();
  const rng = queue(Array(8).fill(0));
  const rooms = rollDngngenRooms(pack, rng.rng);
  assert.deepEqual(rooms.map(ids), [
    ['SYNTHETIC-A-1', 'SYNTHETIC-B-1'],
    ['SYNTHETIC-A-2', 'SYNTHETIC-C-1'],
    ['SYNTHETIC-B-2', 'SYNTHETIC-D-1'],
    ['SYNTHETIC-A-3', 'SYNTHETIC-C-2'],
  ]);
  assert.equal(rng.draws(), 8);
  assert.deepEqual(rollDngngenRooms(pack, () => 0).map(ids), rooms.map(ids));
});
test('individual room reroll is immutable and excludes all other room identities', () => {
  const pack = plainPack();
  const rooms = rollDngngenRooms(pack, () => 0);
  const before = JSON.stringify(rooms);
  const room4 = rollDngngenRoom(pack, 4, rooms, () => 0);
  assert.deepEqual(ids(room4), ids(rooms[3]));
  assert.equal(JSON.stringify(rooms), before);
  assert.deepEqual(
    room4.components.map((component) => component.values),
    rooms[3].components.map((component) => component.values),
  );
});
test('replacement pack snapshot/checksum changes never reuse old-room exclusions or provenance', () => {
  const pack = plainPack();
  const old = rollDngngenRoom(pack, 1, [], () => 0);
  const changed = sealSyntheticDngngenPack({
    ...pack,
    snapshot: { ...pack.snapshot, id: 'replacement' },
    source: { ...pack.source, attribution: 'REPLACEMENT ATTRIBUTION' },
  });
  const next = parsed(changed);
  assert.equal(
    rollDngngenRoom(next, 2, [old], () => 0).components[0].entryId,
    'SYNTHETIC-A-1',
  );
  assert.equal(old.attribution, pack.source.attribution);
  const hashOnly = parsed(
    sealSyntheticDngngenPack({
      ...pack,
      source: { ...pack.source, attribution: 'CHANGED SAME SNAPSHOT' },
    }),
  );
  assert.equal(
    rollDngngenRoom(hashOnly, 2, [old], () => 0).components[0].entryId,
    'SYNTHETIC-A-1',
  );
});
test('literal recipes consume no value draw: room total remains two', () => {
  const rng = queue([4.5 / 6, 0]);
  const room = rollDngngenRoom(parsed(), 1, [], rng.rng);
  assert.match(room.text, /A-5 CONSTANT/);
  assert.equal(rng.draws(), 2);
});
test('one integer recipe gives three draws and preserves exact range and plural formatting', () => {
  for (const [randomValue, expected] of [
    [0, '1 UNIT'],
    [0.999, '4 UNITS'],
  ] as const) {
    const rng = queue([1.5 / 6, randomValue, 0]);
    const room = rollDngngenRoom(parsed(), 1, [], rng.rng);
    assert.ok(room.text.includes(expected));
    assert.equal(rng.draws(), 3);
    assert.equal(room.components[1].entryId, 'SYNTHETIC-B-1');
  }
});
test('sum uses independent ordered draws before the second main selection: four draws', () => {
  const rng = queue([2.5 / 6, 0, 0.999, 0.999]);
  const room = rollDngngenRoom(parsed(), 1, [], rng.rng);
  assert.equal(room.components[0].values.sum, 17);
  assert.equal(room.components[1].entryId, 'SYNTHETIC-B-6');
  assert.equal(rng.draws(), 4);
});
test('sum distribution remains triangular rather than a uniform minimum-to-maximum draw', () => {
  const pack = parsed();
  const counts = new Map<number, number>();
  for (let a = 0; a < 6; a++)
    for (let b = 0; b < 6; b++) {
      const rng = queue([2.5 / 6, (a + 0.5) / 6, (b + 0.5) / 6, 0]);
      const sum = rollDngngenRoom(pack, 1, [], rng.rng).components[0].values
        .sum as number;
      counts.set(sum, (counts.get(sum) ?? 0) + 1);
    }
  assert.equal(counts.get(12), 1);
  assert.equal(counts.get(17), 6);
  assert.equal(counts.get(22), 1);
  assert.equal(counts.size, 11);
});
test('sampled formatting messages preserve list order and add exactly one draw', () => {
  for (const [randomValue, expected] of [
    [0, 'RED TEST LABEL'],
    [0.999, 'BLUE TEST LABEL'],
  ] as const) {
    const rng = queue([3.5 / 6, randomValue, 0]);
    const room = rollDngngenRoom(parsed(), 1, [], rng.rng);
    assert.ok(room.text.includes(expected));
    assert.equal(rng.draws(), 3);
  }
});
test('multiple ordered recipes across components preserve complete interleaved RNG sequence', () => {
  const value = draft();
  value.pools.A[0].values = [
    { name: 'first', recipe: { op: 'int', min: 1, max: 2 } },
    { name: 'second', recipe: { op: 'sample', values: ['LEFT', 'RIGHT'] } },
  ];
  value.pools.B[0].values = [
    { name: 'third', recipe: { op: 'int', min: 20, max: 21 } },
  ];
  const rng = queue([0, 0.999, 0, 0, 0.999]);
  const room = rollDngngenRoom(parsed(value), 1, [], rng.rng);
  assert.deepEqual(
    { ...room.components[0].values },
    { first: 2, second: 'LEFT' },
  );
  assert.deepEqual({ ...room.components[1].values }, { third: 21 });
  assert.equal(rng.draws(), 5);
});
test('full generation includes only recipes on actually selected descriptions', () => {
  const rng = queue([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const rooms = rollDngngenRooms(parsed(), rng.rng);
  assert.equal(rooms[1].components[0].values.count, 1);
  assert.equal(rooms[3].components[0].values.sum, 12);
  assert.equal(rng.draws(), 11); // eight main selections, one int, two sum terms
});
test('stored result text/values/provenance are immutable and reads/copy serialization consume zero RNG', () => {
  const rng = queue([1.5 / 6, 0.999, 0]);
  const pack = parsed();
  const before = JSON.stringify(pack);
  const room = rollDngngenRoom(pack, 1, [], rng.rng);
  assert.equal(room.source, 'DNGNGEN');
  assert.equal(room.synthetic, true);
  assert.equal(room.sourceUrl, pack.source.url);
  assert.equal(room.snapshotId, pack.snapshot.id);
  assert.equal(Object.isFrozen(room.components[0].values), true);
  const copy = `${room.source}\n${room.text}`;
  assert.match(copy, /4 UNITS/);
  assert.equal(rng.draws(), 3);
  assert.equal(JSON.stringify(pack), before);
});
test('empty eligible pool and invalid RNG values fail explicitly, without an invented fallback', () => {
  const value = structuredClone(plainPack()) as Mutable<DngngenPack>;
  value.pools.A = [value.pools.A[0]];
  value.integrity.poolCounts.A = 1;
  const pack = parsed(sealSyntheticDngngenPack(value));
  const first = rollDngngenRoom(pack, 1, [], () => 0);
  const rng = queue([]);
  assert.throws(
    () => rollDngngenRoom(pack, 2, [first], rng.rng),
    /no eligible/,
  );
  assert.equal(rng.draws(), 0);
  for (const invalidRandom of [-0.1, 1, NaN, Infinity])
    assert.throws(
      () => rollDngngenRoom(pack, 1, [], () => invalidRandom),
      /Invalid random/,
    );
});
