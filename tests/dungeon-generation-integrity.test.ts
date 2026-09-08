import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import type { OraclePack } from '../src/domain/oracle.ts';
import type { DungeonRoom } from '../src/domain/types.ts';
import { rollGenericCrawlRoom } from '../src/domain/dungeonCrawl.ts';
import { cloneCampaign } from '../src/domain/operations.ts';
import { parseImport } from '../src/storage/schema.ts';
import { setRules, type RulesPack } from '../src/storage/rulesStore.ts';
import { setOraclePack } from '../src/storage/oracleStore.ts';
import {
  createCampaign,
  createDungeon,
  createDungeonCandidate,
} from '../src/generators/index.ts';
import {
  editRoomComponent,
  prepareSpecialRooms,
  rerollRoomComponent,
  syncRoomComponents,
} from '../src/generators/specialRooms.ts';
import { editedProvenance } from '../src/domain/generationProvenance.ts';
import { DUNGEON_PROCEDURES } from '../src/generators/dungeonProcedures.ts';
import { sourceEntryRange } from '../src/generators/tables.ts';

const path =
  process.env.MORKBORG_PRIVATE_AUDIT_FIXTURE ??
  'outputs/morkborg-private-data.json';
const fixture = existsSync(path)
  ? (JSON.parse(readFileSync(path, 'utf8')) as {
      library: RulesPack;
      oracles: OraclePack;
    })
  : null;
const sourceTest = (name: string, run: () => void) =>
  test(name, { skip: !fixture }, () => {
    setRules(fixture!.library);
    setOraclePack(fixture!.oracles);
    run();
  });
const die = (face: number, sides: number) => (face - 0.5) / sides;
const queue = (values: number[]) => {
  let i = 0;
  return () => {
    assert.ok(i < values.length, 'unexpected roll');
    return values[i++];
  };
};
const skeleton = () =>
  createDungeon('audit', 'Manual dungeon', 'sarkash', true);
function assertComponents(room: DungeonRoom) {
  assert.ok(room.components?.length);
  for (const component of room.components!) {
    const p = component.provenance;
    assert.notEqual(p.classification, 'UNSOURCED');
    assert.equal(p.status, 'VERIFIED');
    for (const roll of p.rolls ?? []) {
      const table = fixture!.library.tables[roll.tableId];
      assert.ok(table, roll.tableId);
      assert.ok(roll.entryId?.startsWith(`${roll.tableId}:`));
      assert.ok(
        roll.diceValues?.every(
          (value) => Number.isInteger(value) && value >= 1,
        ),
      );
    }
    if (p.classification === 'SOURCE_VERBATIM')
      assert.deepEqual(p.sourceText, [component.sourceText]);
    const source = p.sourceRefs.find((ref) => ref.role === 'primary');
    assert.ok(
      source?.bookId && source.tableId && source.pdfPage && source.entryId,
    );
  }
}
sourceTest(
  'every Core sample selector follows only its actual printed conditional table',
  () => {
    const dungeon = skeleton();
    const table = fixture!.library.tables['core.rooms'];
    for (let block = 1; block <= 4; block++)
      for (let face = 1; face <= 6; face++) {
        const selector = block * 10 + face;
        const entry = table.entries.find(
          (item, index) => sourceEntryRange(item, index)[0] === selector,
        )!;
        const values = Array.from({ length: 4 }, () => [
          die(block, 4),
          die(face, 6),
          ...(entry.followup ? [0] : []),
        ]).flat();
        const rooms = prepareSpecialRooms(dungeon, false, queue(values));
        for (const room of rooms) {
          assert.equal(room.components?.length, entry.followup ? 2 : 1);
          assert.equal(room.components![0].sourceText, entry.text);
          assert.equal(room.feature, '');
          assert.equal(room.danger, '');
          assert.equal(room.treasure, '');
          assertComponents(room);
        }
      }
  },
);
sourceTest(
  'component reroll updates text and source together while preserving unrelated edited parent',
  () => {
    const d = skeleton();
    d.rooms = prepareSpecialRooms(d, false, () => 0);
    const room = d.rooms[0];
    editRoomComponent(room, 'sample', 'Handwritten player prompt');
    const parent = structuredClone(room.components![0]);
    const oldDetail = structuredClone(room.components![1]);
    rerollRoomComponent(d, room, 'detail', () => 0.999999);
    assert.deepEqual(room.components![0], parent);
    assert.notEqual(room.components![1].sourceText, oldDetail.sourceText);
    assert.notDeepEqual(
      room.components![1].provenance.rolls,
      oldDetail.provenance.rolls,
    );
    assert.equal(room.components![0].provenance.origin, 'source-edited');
    assert.notEqual(
      room.components![0].provenance.sourceText![0],
      room.components![0].sourceText,
    );
    assert.equal(
      room.fieldProvenance?.description.classification,
      'USER_AUTHORED',
    );
  },
);
sourceTest(
  'dependent parent reroll retains a manually edited old child as a separately marked manual component',
  () => {
    const d = skeleton();
    d.rooms = prepareSpecialRooms(d, false, () => 0);
    const room = d.rooms[0];
    editRoomComponent(room, 'detail', 'Do not discard this note');
    rerollRoomComponent(d, room, 'sample', () => 0.999999);
    assert.equal(
      room.components!.find((item) => item.key === 'manual-detail')?.sourceText,
      'Do not discard this note',
    );
    assert.equal(
      room.components!.find((item) => item.key === 'manual-detail')?.provenance
        .origin,
      'source-edited',
    );
    assert.equal(
      room.components!.find((item) => item.key === 'sample')?.provenance
        .rolls![0].value,
      46,
    );
  },
);
sourceTest(
  'generic SD components keep alternatives intact and reroll one field without changing a manual sibling or exits',
  () => {
    const d = skeleton();
    const registry = buildOracleRegistry(fixture!.library, fixture!.oracles);
    const room = rollGenericCrawlRoom(registry, 2, () => 0);
    d.rooms.push(room);
    assert.equal(room.components!.length, 4);
    assert.ok(room.components![0].sourceText.includes('/'));
    editRoomComponent(room, 'type', 'Player-chosen room');
    const before = structuredClone(
      room.components!.filter((item) => item.key !== 'adjective'),
    );
    rerollRoomComponent(d, room, 'adjective', () => 0.999999);
    assert.deepEqual(
      room.components!.filter((item) => item.key !== 'adjective'),
      before,
    );
    assert.equal(room.generation!.rolls.discovered, 2);
    assert.equal(
      room.components!.find((item) => item.key === 'type')!.provenance.origin,
      'source-edited',
    );
    rerollRoomComponent(d, room, 'exits', () => 0.999999);
    assert.equal(room.exits, 0);
    assert.equal(room.fieldProvenance!.feature.classification, 'APP_DERIVED');
  },
);
sourceTest(
  'all procedure steps resolve canonical tables and document count, dice and source pages',
  () => {
    for (const procedure of DUNGEON_PROCEDURES) {
      assert.ok(procedure.sourceRefs.every((ref) => ref.bookId && ref.pdfPage));
      for (const step of procedure.steps) {
        assert.ok(
          step.tableId && fixture!.library.tables[step.tableId],
          `${procedure.id}/${step.id}`,
        );
        assert.ok(step.count > 0 && step.dice);
      }
    }
  },
);
sourceTest(
  'generic component rerolls preserve an independently edited title and its historical source',
  () => {
    const d = skeleton();
    const room = rollGenericCrawlRoom(
      buildOracleRegistry(fixture!.library, fixture!.oracles),
      2,
      () => 0,
    );
    room.name = 'My handwritten room name';
    room.fieldProvenance!.name = editedProvenance(room.fieldProvenance!.name);
    const titleSource = structuredClone(room.fieldProvenance!.name);
    for (const key of ['contents', 'exits', 'adjective', 'type']) {
      rerollRoomComponent(d, room, key, () => 0.999999);
      assert.equal(room.name, 'My handwritten room name');
      assert.deepEqual(room.fieldProvenance!.name, titleSource);
    }
  },
);
sourceTest(
  'composed room compatibility values preserve component source warning status',
  () => {
    const room = rollGenericCrawlRoom(
      buildOracleRegistry(fixture!.library, fixture!.oracles),
      2,
      () => 0,
    );
    room.components![0].provenance.status = 'PARTIAL';
    syncRoomComponents(room);
    assert.equal(room.fieldProvenance!.name.status, 'PARTIAL');
    room.components![0].provenance.status = 'CONFLICT';
    syncRoomComponents(room);
    assert.equal(room.fieldProvenance!.name.status, 'CONFLICT');
  },
);
sourceTest(
  '10,000 inexpensive preparation passes produce 40,000 source-backed Special Rooms with no mystery text',
  () => {
    const d = skeleton();
    let seed = 20260908;
    const rng = () => {
      seed = (1664525 * seed + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let pass = 0; pass < 10_000; pass++) {
      const rooms = prepareSpecialRooms(d, false, rng);
      assert.equal(rooms.length, 4);
      for (const room of rooms) {
        assertComponents(room);
        assert.match(room.name, /^ROOM 0[1-4]$/);
        assert.equal(
          room.description,
          room.components!.map((item) => item.sourceText).join(' · '),
        );
        assert.equal(
          room.fieldProvenance?.name.procedureId,
          'app.structural-identifier',
        );
      }
    }
  },
);
sourceTest(
  'structured values and edited origin survive save, import and duplication with canonical source IDs unchanged',
  () => {
    const campaign = createCampaign('Integrity QA');
    const d = createDungeonCandidate(campaign.id, 'sarkash');
    campaign.dungeons.push(d);
    editRoomComponent(d.rooms[1], 'sample', 'Private handwritten note');
    const copied = cloneCampaign(campaign);
    assert.notEqual(copied.dungeons[0].id, d.id);
    for (let i = 0; i < 4; i++) {
      assert.notEqual(copied.dungeons[0].rooms[i].id, d.rooms[i].id);
      assert.deepEqual(
        copied.dungeons[0].rooms[i].components,
        d.rooms[i].components,
      );
    }
    const restored = parseImport(
      JSON.stringify({ schemaVersion: 2, campaign }),
    )[0];
    assert.deepEqual(restored.dungeons[0], d);
    assert.equal(
      restored.dungeons[0].rooms[1].components![0].provenance.origin,
      'source-edited',
    );
  },
);
sourceTest(
  'repeated dependent rerolls keep every distinct manual child with unique stable keys',
  () => {
    const d = skeleton();
    d.rooms = prepareSpecialRooms(d, false, () => 0);
    const room = d.rooms[0];
    editRoomComponent(room, 'detail', 'First private detail');
    rerollRoomComponent(d, room, 'sample', () => 0);
    editRoomComponent(room, 'detail', 'Second private detail');
    rerollRoomComponent(d, room, 'sample', () => 0);
    const keys = room.components!.map((item) => item.key);
    assert.equal(new Set(keys).size, keys.length);
    assert.equal(
      room.components!.find((item) => item.key === 'manual-detail')?.sourceText,
      'First private detail',
    );
    assert.equal(
      room.components!.find((item) => item.key === 'manual-detail-2')
        ?.sourceText,
      'Second private detail',
    );
  },
);
