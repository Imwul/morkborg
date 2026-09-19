import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import type { OraclePack, OracleRegistry } from '../src/domain/oracle.ts';
import type { RulesPack } from '../src/storage/rulesStore.ts';
import {
  DNGNGEN_URL,
  DUNGEON_PREPARATION_FIELDS,
  emptyDungeonPreparationReading,
  rollDungeonPreparationField,
  rollDungeonPreparationReading,
  rerollDungeonPreparationField,
  editDungeonPreparationField,
  type DungeonPreparationKey,
} from '../src/domain/dungeonReferencePreparation.ts';
import { copyReferenceReading } from '../src/domain/referenceReading.ts';
import { selectOracleEntry } from '../src/generators/oracleRoller.ts';
import { buildReferenceRegistry } from '../src/domain/references.ts';
import {
  executeReference,
  referenceProducesRoll,
} from '../src/domain/referenceExecution.ts';
import {
  emptyReferenceSession,
  retainReferenceReading,
} from '../src/domain/referenceSession.ts';
import { DungeonPreparation } from '../src/components/DungeonPreparation.tsx';

const path =
  process.env.MORKBORG_PRIVATE_AUDIT_FIXTURE ??
  'outputs/morkborg-private-data.json';
const fixture = existsSync(path)
  ? (JSON.parse(readFileSync(path, 'utf8')) as {
      library: RulesPack;
      oracles: OraclePack;
    })
  : null;
const registry = fixture
  ? buildOracleRegistry(fixture.library, fixture.oracles)
  : null;
const sourceTest = (name: string, run: (registry: OracleRegistry) => void) =>
  test(name, { skip: !registry }, () => run(registry!));
const die = (face: number, sides: number) => (face - 0.5) / sides;
function queue(values: number[]) {
  let count = 0;
  return {
    next: () => {
      assert.ok(
        count < values.length,
        'must not automatically roll another table',
      );
      return values[count++];
    },
    count: () => count,
  };
}

test('empty SD stat block exposes reason, guard and four rooms without any generated result', () => {
  const reading = emptyDungeonPreparationReading();
  assert.deepEqual(
    DUNGEON_PREPARATION_FIELDS.map((field) => field.key),
    [
      'name',
      'status',
      'danger',
      'inhabitants',
      'reason',
      'entrance',
      'guard',
      'feature',
      'special1',
      'special2',
      'special3',
      'special4',
    ],
  );
  assert.equal(reading.blocks.length, 12);
  assert.ok(reading.blocks.every((block) => block.text === ''));
  assert.equal(reading.oracle, undefined);
  assert.deepEqual(reading.sourceRefs[0].pdfPage, [9, 19]);
  assert.equal(reading.sourceRefs[0].printedPage, '7, 17');
  assert.equal(DNGNGEN_URL, 'https://dngngen.makedatanotlore.dev/');
  assert.doesNotMatch(
    JSON.stringify(reading),
    /campaignId|discoveredSpecialIds|visitedRoomIds|currentRoomId|pendingRegion/,
  );
});

sourceTest(
  'Core name uses exactly the printed two independent d12 columns',
  (registry) => {
    const rng = queue([die(2, 12), die(11, 12)]);
    const reading = rollDungeonPreparationField('name', registry, rng.next);
    const [a, b] = reading.oracle!.rolls;
    assert.equal(rng.count(), 2);
    assert.deepEqual([a.oracleId, b.oracleId], ['core.titleA', 'core.titleB']);
    assert.deepEqual([a.roll, b.roll], [2, 11]);
    assert.equal(reading.blocks[0].text, `The ${a.text} ${b.text}`);
    assert.equal(reading.blocks[0].dice, 'd12 = 2 · d12 = 11');
    for (const roll of [a, b]) {
      assert.equal(roll.metadata?.preparationField, 'name');
      assert.equal(roll.metadata?.provenance?.sourceRefs[0].bookId, 'core');
      assert.equal(
        roll.metadata?.provenance?.sourceRefs[0].entryId,
        roll.entryId,
      );
    }
  },
);

sourceTest(
  'full stat block rolls only its ten explicit fields and never changes the registry',
  (registry) => {
    const before = JSON.stringify(registry);
    const rng = queue(Array(15).fill(0));
    const reading = rollDungeonPreparationReading(registry, rng.next);
    assert.equal(rng.count(), 15); // two name dice, five field dice, four pairs of room dice
    assert.equal(reading.blocks.length, 12);
    assert.equal(reading.oracle!.rolls.length, 11); // title is the only two-table field
    assert.equal(
      reading.blocks.find((block) => block.title === 'Guarded by')?.text,
      '',
    );
    assert.equal(
      reading.blocks.find((block) => block.title === 'What brings you here?')
        ?.text,
      '',
    );
    const rooms = reading.oracle!.rolls.filter(
      (roll) => roll.oracleId === 'core.rooms',
    );
    assert.equal(rooms.length, 4);
    assert.ok(rooms.every((roll) => roll.roll === 11)); // independent source repeats remain valid
    assert.ok(rooms.every((roll) => Array.isArray(roll.metadata?.followup)));
    assert.equal(JSON.stringify(registry), before);
  },
);

sourceTest(
  'all 24 Core sample cells keep their exact original selector, text and optional child',
  (registry) => {
    const table = registry.tables.find((table) => table.id === 'core.rooms')!;
    const seen = new Set<string>();
    for (let d4 = 1; d4 <= 4; d4++)
      for (let d6 = 1; d6 <= 6; d6++) {
        const rng = queue([die(d4, 4), die(d6, 6)]);
        const reading = rollDungeonPreparationField(
          'special1',
          registry,
          rng.next,
        );
        const roll = reading.oracle!.rolls[0];
        const entry = selectOracleEntry(table, d4 * 10 + d6)!;
        assert.equal(rng.count(), 2);
        assert.equal(reading.oracle!.rolls.length, 1);
        assert.equal(roll.text, entry.text);
        assert.equal(roll.entryId, entry.id);
        assert.deepEqual(roll.diceValues, [d4, d6]);
        assert.deepEqual(roll.metadata?.followup, entry.metadata?.followup);
        assert.ok(reading.blocks[0].text.startsWith(entry.text));
        seen.add(entry.id);
      }
    assert.equal(seen.size, 24);
  },
);

sourceTest(
  'every dossier face maps directly to its source range without region weighting or child rolls',
  (registry) => {
    const fields: [DungeonPreparationKey, string, number][] = [
      ['status', 'core.status', 6],
      ['danger', 'core.danger', 10],
      ['inhabitants', 'core.inhabitants', 12],
      ['entrance', 'reclvse.dungeonEntrance', 20],
      ['feature', 'core.feature', 12],
    ];
    for (const [key, tableId, sides] of fields) {
      const table = registry.tables.find((table) => table.id === tableId)!;
      for (let face = 1; face <= sides; face++) {
        const rng = queue([die(face, sides)]);
        const reading = rollDungeonPreparationField(key, registry, rng.next);
        assert.equal(rng.count(), 1);
        const roll = reading.oracle!.rolls[0];
        assert.equal(roll.roll, face);
        assert.equal(roll.text, selectOracleEntry(table, face)!.text);
        assert.equal(roll.metadata?.provenance?.regionWeighting, undefined);
        assert.equal(
          reading.sourceRefs.find((ref) => ref.role === 'primary')?.tableId,
          tableId,
        );
      }
    }
  },
);

sourceTest(
  'one field reroll replaces only its result and provenance, preserving other rooms and handwritten fields',
  (registry) => {
    let current = rollDungeonPreparationReading(registry, () => 0);
    current = editDungeonPreparationField(
      current,
      'reason',
      'Find the missing bell',
    );
    current = editDungeonPreparationField(current, 'guard', 'Two sentries');
    const snapshot = structuredClone(current);
    const rng = queue([die(4, 4), die(6, 6)]);
    const updated = rerollDungeonPreparationField(
      current,
      'special2',
      registry,
      rng.next,
    );
    for (const block of updated.blocks) {
      if (block.title !== 'Special Room 2')
        assert.deepEqual(
          block,
          snapshot.blocks.find((prior) => prior.title === block.title),
        );
    }
    const rolls = updated.oracle!.rolls;
    assert.equal(
      rolls.find((roll) => roll.metadata?.preparationField === 'special2')
        ?.roll,
      46,
    );
    for (const key of ['special1', 'special3', 'special4']) {
      assert.equal(
        rolls.find((roll) => roll.metadata?.preparationField === key)?.roll,
        11,
      );
    }
    assert.deepEqual(current, snapshot);
    assert.equal(rng.count(), 2);
    assert.match(copyReferenceReading(updated), /Find the missing bell/);
    assert.match(copyReferenceReading(updated), /Two sentries/);
  },
);

sourceTest(
  'full reroll preserves the two handwritten source fields when an existing reading is supplied',
  (registry) => {
    let current = emptyDungeonPreparationReading();
    current = editDungeonPreparationField(
      current,
      'reason',
      'A player-written reason',
    );
    current = editDungeonPreparationField(
      current,
      'guard',
      'A player-written guard',
    );
    const updated = rollDungeonPreparationReading(
      registry,
      () => 0.999999,
      current,
    );
    assert.equal(
      updated.blocks.find((block) => block.title === 'What brings you here?')
        ?.text,
      'A player-written reason',
    );
    assert.equal(
      updated.blocks.find((block) => block.title === 'Guarded by')?.text,
      'A player-written guard',
    );
    assert.ok(
      updated.oracle!.rolls.every(
        (roll) =>
          !['reason', 'guard'].includes(
            String(roll.metadata?.preparationField),
          ),
      ),
    );
  },
);

sourceTest(
  'manual, missing and unverified sources never synthesize dungeon content',
  (registry) => {
    const rng = queue([]);
    assert.throws(
      () => rollDungeonPreparationField('guard', registry, rng.next),
      /직접 작성/,
    );
    assert.throws(
      () => rollDungeonPreparationField('reason', registry, rng.next),
      /직접 작성/,
    );
    assert.throws(
      () =>
        rollDungeonPreparationField(
          'name',
          {
            ...registry,
            tables: registry.tables.filter(
              (table) => table.id !== 'core.titleB',
            ),
          },
          rng.next,
        ),
      /core.titleB/,
    );
    const unverified = {
      ...registry,
      tables: registry.tables.map((table) =>
        table.id === 'core.status'
          ? { ...table, sourceVerified: false }
          : table,
      ),
    };
    assert.throws(
      () => rollDungeonPreparationField('status', unverified, rng.next),
      /원문/,
    );
    assert.equal(rng.count(), 0);
  },
);

sourceTest(
  'registered dungeon execution preserves manual fields and has identical source rolls in every region',
  (registry) => {
    const index = buildReferenceRegistry(registry, fixture!.library);
    const entry = index.byId['procedure:sd.dungeon-preparation'];
    assert.ok(entry?.available);
    assert.equal(referenceProducesRoll(entry), true);
    const before = JSON.stringify(registry);
    let current = editDungeonPreparationField(
      emptyDungeonPreparationReading(),
      'reason',
      'Follow the bell',
    );
    current = editDungeonPreparationField(current, 'guard', 'Watchers');
    const options = {
      registry,
      rules: fixture!.library,
      stockKind: 'common' as const,
      stockDR: 12,
      cityLarge: false,
      cityExits: false,
      currentReading: current,
    };
    let expected: ReturnType<typeof executeReference>;
    for (const region of [
      'galgenbeck',
      'sarkash',
      'graven-tosk',
      'kergus',
      'wastland',
      'valley-undead',
      'grift',
    ] as const) {
      const rng = queue(Array(15).fill(0.8));
      const reading = executeReference(entry, {
        ...options,
        region,
        rng: rng.next,
      });
      assert.ok(reading);
      assert.equal(rng.count(), 15);
      assert.equal(
        reading.blocks.find((block) => block.title === 'Guarded by')?.text,
        'Watchers',
      );
      assert.equal(
        reading.blocks.find((block) => block.title === 'What brings you here?')
          ?.text,
        'Follow the bell',
      );
      if (expected) {
        assert.deepEqual(reading.blocks, expected.blocks);
        assert.deepEqual(reading.oracle!.rolls, expected.oracle!.rolls);
      } else expected = reading;
    }
    assert.equal(JSON.stringify(registry), before);
  },
);

sourceTest(
  'navigation retention keeps the stat block and manual fields in existing reference readings',
  (registry) => {
    const index = buildReferenceRegistry(registry, fixture!.library);
    const entry = index.byId['procedure:sd.dungeon-preparation'];
    let dungeon = rollDungeonPreparationReading(registry, () => 0);
    dungeon = editDungeonPreparationField(
      dungeon,
      'reason',
      'Read from paper notes',
    );
    let session = retainReferenceReading(
      emptyReferenceSession(),
      entry.id,
      dungeon,
      false,
    );
    session = retainReferenceReading(
      session,
      'oracle:core.weather',
      {
        title: 'Weather',
        blocks: [{ title: 'Weather', text: 'Another reference' }],
        sourceRefs: [],
      },
      false,
    );
    assert.deepEqual(session.readings[entry.id], dungeon);
    assert.equal(session.rolls.length, 0);
    const restored = JSON.parse(JSON.stringify(session.readings[entry.id]));
    const changed = rerollDungeonPreparationField(
      restored,
      'status',
      registry,
      () => 0.99,
    );
    assert.equal(
      changed.blocks.find((block) => block.title === 'What brings you here?')
        ?.text,
      'Read from paper notes',
    );
    assert.match(copyReferenceReading(changed, true), /Read from paper notes/);
    assert.ok(changed.sourceRefs.every((source) => source.pdfPage != null));
  },
);

sourceTest(
  'SD stat block renders all fields and optional children with no region, save, or progression prerequisite',
  (registry) => {
    let changed = false;
    const render = (
      reading?: ReturnType<typeof emptyDungeonPreparationReading>,
    ) =>
      renderToStaticMarkup(
        createElement(DungeonPreparation, {
          registry,
          reading,
          onChange: () => {
            changed = true;
          },
          onOpen: () => {},
        }),
      );
    const empty = render();
    assert.equal(changed, false);
    assert.equal((empty.match(/data-preparation-field=/g) ?? []).length, 12);
    assert.equal((empty.match(/<textarea/g) ?? []).length, 2);
    assert.equal((empty.match(/<summary>조건부 추가 표/g) ?? []).length, 0);
    assert.doesNotMatch(
      empty,
      /지역을 선택|이 던전 선택|다음 단계|시작하기|<select/,
    );
    assert.match(empty, /DNGNGEN 원본/);
    const rolled = render(rollDungeonPreparationReading(registry, () => 0));
    assert.equal(changed, false);
    assert.equal((rolled.match(/<summary>조건부 추가 표/g) ?? []).length, 5); // danger + four Core room motifs
    assert.doesNotMatch(rolled, /<output/); // child tables stay unrolled
  },
);

sourceTest(
  'Korean field labels survive blank, full, single-field and handwritten updates for Workbench display',
  (registry) => {
    const checkLabels = (
      reading: ReturnType<typeof emptyDungeonPreparationReading>,
    ) => {
      for (const field of DUNGEON_PREPARATION_FIELDS) {
        assert.equal(
          reading.blocks.find((block) => block.title === field.title)
            ?.translation?.titleKo,
          field.titleKo,
        );
      }
      assert.equal(
        reading.blocks.find((block) => block.title === 'Special Room 1')
          ?.translation?.titleKo,
        '특별한 방 1',
      );
    };
    let reading = emptyDungeonPreparationReading();
    checkLabels(reading);
    reading = rollDungeonPreparationReading(registry, () => 0, reading);
    checkLabels(reading);
    reading = rerollDungeonPreparationField(
      reading,
      'special1',
      registry,
      () => 0.99,
    );
    checkLabels(reading);
    const sourceTranslation = reading.oracle!.rolls.find(
      (roll) => roll.metadata?.preparationField === 'special1',
    )?.metadata?.ko;
    assert.equal(
      reading.blocks.find((block) => block.title === 'Special Room 1')
        ?.translation?.ko,
      sourceTranslation,
    );
    reading = editDungeonPreparationField(
      reading,
      'reason',
      'Handwritten reason',
    );
    reading = editDungeonPreparationField(
      reading,
      'guard',
      'Handwritten guard',
    );
    checkLabels(reading);
  },
);
