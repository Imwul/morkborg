import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import type {
  OracleDefinition,
  OracleRegistry,
  OracleResult,
} from '../src/domain/oracle.ts';
import {
  buildOracleRegistry,
  filterOracles,
  getCanonicalRuleTable,
  adaptRuleTable,
} from '../src/data/oracles/index.ts';
import {
  diceDomain,
  rollOracleDice,
  rollOracle,
  rollProcedure,
  selectOracleEntry,
  sourceLabel,
} from '../src/generators/oracleRoller.ts';
import { validateOracleRegistry } from '../src/validation/oracleValidation.ts';
import { parseOraclePack } from '../src/storage/oracleStore.ts';
import {
  readOraclePreferences,
  writeOraclePreferences,
  ORACLE_PREFERENCES_KEY,
} from '../src/storage/oraclePreferences.ts';
import {
  appendOracleNotes,
  contextNotesTarget,
  notesDestinations,
  notesTargetKey,
} from '../src/domain/oracleNotes.ts';
import {
  createCampaign,
  createDungeon,
  createRoom,
} from '../src/generators/index.ts';
import { generateCharacter } from '../src/generators/character.ts';
import { generateMonster } from '../src/generators/monster.ts';
import { entries, rollTable } from '../src/generators/tables.ts';
import { setRules, getRules } from '../src/storage/rulesStore.ts';
import { validateCampaign, parseImport } from '../src/storage/schema.ts';
const table = (dice = 'd4'): OracleDefinition => ({
  id: 'test',
  title: 'Test',
  sourceBookId: 'test-book',
  sourcePage: 1,
  sourceVerified: true,
  category: 'OTHER',
  dice,
  tags: ['example'],
  entries: [
    { id: 'test:1', min: 1, max: 3, text: 'A' },
    { id: 'test:2', min: 4, max: 4, text: 'B' },
  ],
});
const registry = (t = table()): OracleRegistry => ({
  books: [{ id: 'test-book', title: 'Test Book' }],
  tables: [t],
  procedures: [],
});
const dataAvailable =
  existsSync('public/rules/library.json') &&
  existsSync('public/rules/oracles.json');
if (dataAvailable)
  setRules(JSON.parse(readFileSync('public/rules/library.json', 'utf8')));
const all = dataAvailable
  ? buildOracleRegistry(
      getRules(),
      parseOraclePack(
        JSON.parse(readFileSync('public/rules/oracles.json', 'utf8')),
      ),
    )
  : registry();
const localTest = (name: string, fn: () => void) =>
  test(name, { skip: !dataAvailable }, fn);

test('Oracle validation accepts exact ranges and source', () =>
  assert.deepEqual(validateOracleRegistry(registry()), []));
for (const [name, mutate, issue] of [
  [
    'duplicate oracle',
    (r: OracleRegistry) => r.tables.push(structuredClone(r.tables[0])),
    'duplicate oracle id',
  ],
  [
    'duplicate entry',
    (r: OracleRegistry) => {
      r.tables[0].entries[1].id = r.tables[0].entries[0].id;
    },
    'duplicate entry id',
  ],
  [
    'overlap',
    (r: OracleRegistry) => {
      r.tables[0].entries[1].min = 3;
    },
    'overlapping range',
  ],
  [
    'gap',
    (r: OracleRegistry) => {
      r.tables[0].entries[0].max = 2;
    },
    'missing range',
  ],
  [
    'impossible roll',
    (r: OracleRegistry) => {
      r.tables[0].entries[1].max = 5;
    },
    'impossible dice value',
  ],
  [
    'empty result',
    (r: OracleRegistry) => {
      r.tables[0].entries[0].text = ' ';
    },
    'empty text',
  ],
  [
    'missing source',
    (r: OracleRegistry) => {
      r.tables[0].sourceBookId = 'missing';
    },
    'missing source',
  ],
  [
    'unverified page',
    (r: OracleRegistry) => {
      r.tables[0].sourcePage = null;
    },
    'verified source without page',
  ],
  [
    'malformed dice',
    (r: OracleRegistry) => {
      r.tables[0].dice = '1d10+20!!';
    },
    'malformed dice notation',
  ],
] as const)
  test(`Oracle validation rejects ${name}`, () => {
    const r = registry();
    mutate(r);
    assert.ok(validateOracleRegistry(r).some((s) => s.includes(issue)));
  });
test('intentional gaps require source notes and return no invented text', () => {
  const t = table();
  t.entries[0].max = 2;
  t.allowedGaps = [3];
  assert.ok(validateOracleRegistry(registry(t)).length);
  t.sourceNote = 'Original gap';
  assert.deepEqual(validateOracleRegistry(registry(t)), []);
  assert.equal(rollOracle(t, registry(t), () => 0.6).entryId, null);
});
test('d66 has exactly 36 legal pairs and uses tens/units d6', () => {
  const seen = new Set<number>();
  for (let tens = 1; tens <= 6; tens++)
    for (let units = 1; units <= 6; units++) {
      const queue = [(tens - 0.5) / 6, (units - 0.5) / 6];
      const r = rollOracleDice('d66', () => queue.shift()!);
      assert.deepEqual(r.values, [tens, units]);
      assert.equal(r.value, tens * 10 + units);
      seen.add(r.value);
    }
  assert.deepEqual([...seen], diceDomain('d66'));
  assert.equal(seen.has(17), false);
});
test('d100 covers both endpoints and each integer exactly', () => {
  assert.deepEqual(
    Array.from(
      { length: 100 },
      (_, i) => rollOracleDice('d100', () => (i + 0.5) / 100).value,
    ),
    diceDomain('d100'),
  );
});
test('range boundaries select intended entries', () => {
  const t = table();
  for (const n of [1, 2, 3]) assert.equal(selectOracleEntry(t, n)?.text, 'A');
  assert.equal(selectOracleEntry(t, 4)?.text, 'B');
  assert.throws(() => selectOracleEntry(t, 0));
});
test('2d6 rolls dice separately and preserves triangular frequencies', () => {
  const counts = new Map<number, number>();
  for (let a = 0; a < 6; a++)
    for (let b = 0; b < 6; b++) {
      const q = [(a + 0.5) / 6, (b + 0.5) / 6];
      const n = rollOracleDice('2d6', () => q.shift()!).value;
      counts.set(n, (counts.get(n) ?? 0) + 1);
    }
  assert.deepEqual([...counts.values()], [1, 2, 3, 4, 5, 6, 5, 4, 3, 2, 1]);
});
test('3d6 and every supported die stay in printed domain', () => {
  for (const notation of [
    'd4',
    'd6',
    'd8',
    'd10',
    'd12',
    'd20',
    'd100',
    '3d6',
  ]) {
    assert.equal(
      rollOracleDice(notation, () => 0).value,
      diceDomain(notation)[0],
    );
    assert.equal(
      rollOracleDice(notation, () => 0.999999).value,
      diceDomain(notation).at(-1),
    );
  }
});
test('d4 × d6 preserves both coordinates instead of summing', () => {
  const q = [0.8, 0.4];
  assert.deepEqual(
    rollOracleDice('d4 × d6', () => q.shift()!),
    { value: 43, values: [4, 3] },
  );
});
test('composite preserves independent results and order without invented sentence', () => {
  const r = registry();
  const q = [0, 0.99];
  const result = rollProcedure(
    { id: 'pair', title: 'Pair', oracleIds: ['test', 'test'] },
    r,
    () => q.shift()!,
  );
  assert.deepEqual(
    result.rolls.map((x) => x.text),
    ['A', 'B'],
  );
  assert.deepEqual(
    result.rolls.map((x) => x.roll),
    [1, 4],
  );
});
test('source includes verified book, PDF page, printed page and title', () => {
  const t = table();
  t.printedPage = 7;
  const s = sourceLabel(t, registry(t));
  for (const part of ['Test Book', 'PDF 1', 'p. 7', 'Test'])
    assert.ok(s.includes(part));
});
test('category, source, dice and metadata search filters combine', () => {
  const r = registry();
  assert.equal(
    filterOracles(r, {
      category: 'OTHER',
      source: 'test-book',
      dice: 'd4',
      query: 'example',
    }).length,
    1,
  );
  assert.equal(filterOracles(r, { category: 'SOLO' }).length, 0);
  assert.equal(filterOracles(r, { source: 'missing' }).length, 0);
  assert.equal(filterOracles(r, { query: 'TEST BOOK' }).length, 1);
  assert.equal(filterOracles(r, { favorites: [] }).length, 0);
});
test('favorite and filters persist outside Campaign data', () => {
  const map = new Map<string, string>();
  const storage = {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, v);
    },
  };
  const p = readOraclePreferences(storage);
  p.favoriteIds = ['test'];
  p.category = 'SOLO';
  writeOraclePreferences(p, storage);
  assert.deepEqual(readOraclePreferences(storage), p);
  assert.equal([...map.keys()][0], ORACLE_PREFERENCES_KEY);
});
test('preferences reject malformed data and report write failure', () => {
  assert.deepEqual(
    readOraclePreferences({ getItem: () => '{' }).favoriteIds,
    [],
  );
  assert.throws(() =>
    writeOraclePreferences(readOraclePreferences({ getItem: () => null }), {
      setItem: () => {
        throw Error('quota');
      },
    }),
  );
});
test('reference-only and unclear entries cannot generate fake outcomes', () => {
  const t = table();
  t.rollable = false;
  assert.throws(() => rollOracle(t, registry(t)));
  t.rollable = true;
  t.entries[0].sourceUnclear = true;
  assert.throws(() => rollOracle(t, registry(t), () => 0));
});
test('unknown schema and missing composite source are rejected', () => {
  assert.throws(() => parseOraclePack({ schemaVersion: 2 }));
  const r = registry();
  r.procedures = [{ id: 'p', title: 'Missing', oracleIds: ['missing'] }];
  assert.ok(validateOracleRegistry(r).length);
  assert.throws(() => rollProcedure(r.procedures[0], r));
});
localTest(
  'ALL private Oracle and entry IDs unique, ranges/source/coverage validated',
  () => {
    assert.deepEqual(validateOracleRegistry(all), []);
    assert.equal(new Set(all.tables.map((t) => t.id)).size, all.tables.length);
  },
);
localTest(
  'all 49 Mythic Meaning Tables contain original 100-entry d100 data',
  () => {
    const meaning = all.tables.filter((t) =>
      t.id.startsWith('mythic2.meaning.'),
    );
    assert.equal(meaning.length, 49);
    for (const t of meaning) {
      assert.equal(t.entries.length, 100);
      assert.equal(t.dice, 'd100');
      assert.equal(t.sourceVerified, true);
      assert.ok(t.duplicatePages?.length);
    }
  },
);
localTest(
  'every rollable Oracle selects one original entry at EVERY possible roll',
  () => {
    for (const t of all.tables.filter((t) => t.rollable !== false)) {
      for (const n of diceDomain(t.dice)) {
        const e = selectOracleEntry(t, n);
        assert.ok(e || t.allowedGaps?.includes(n));
      }
    }
  },
);
localTest(
  'canonical generator tables and Oracle adapters retain same original data',
  () => {
    for (const [id, t] of Object.entries(getRules()!.tables)) {
      assert.equal(getCanonicalRuleTable(id), t);
      assert.equal(entries(id), t.entries);
      const o = adaptRuleTable(id, t);
      for (let i = 0; i < t.entries.length; i++)
        if (t.entries[i].text)
          assert.equal(o.entries[i].text, t.entries[i].text);
    }
  },
);
localTest(
  'generator weighted rolls and followups remain original; Oracle has no region weighting',
  () => {
    for (const id of ['core.sparks', 'feretory.trait', 'reclvse.roomLoot']) {
      const before = JSON.stringify(getCanonicalRuleTable(id));
      for (let n = 0; n < 30; n++) {
        const r = rollTable(id);
        assert.ok(entries(id).some((e) => e.text === r.value));
      }
      assert.equal(JSON.stringify(getCanonicalRuleTable(id)), before);
    }
    assert.deepEqual(
      all.tables
        .find((t) => t.id === 'feretory.trait')!
        .entries.map((e) => e.max - e.min + 1),
      entries('feretory.trait').map((e) => e.weight),
    );
  },
);
localTest(
  'proper nouns and accents are unchanged through Oracle lookup',
  () => {
    for (const id of [
      'core.names',
      'depths.region.kergus.feature',
      'depths.region.graven_tosk.trait',
    ]) {
      const t = getCanonicalRuleTable(id)!;
      const o = all.tables.find((t) => t.id === id)!;
      assert.deepEqual(
        o.entries.map((e) => e.text),
        t.entries.map((e) => e.text),
      );
    }
    assert.ok(entries('core.names').some((e) => /[öü]/.test(e.text)));
  },
);
function notesFixture() {
  const c = createCampaign('Oracle test');
  const d = createDungeon(c.id, 'Test Dungeon', 'sarkash');
  d.rooms = [createRoom('sarkash'), createRoom('sarkash')];
  c.dungeons.push(d);
  c.characters.push(generateCharacter(c.id));
  c.monsters.push(generateMonster(c.id));
  return c;
}
const noteResult: OracleResult = {
  id: 'roll',
  title: 'Example',
  rolls: [
    {
      oracleId: 'test',
      title: 'Test',
      dice: 'd4',
      roll: 2,
      diceValues: [2],
      entryId: 'test:1',
      text: 'Aerg-Tval / Kergüs',
      source: 'Test Book · PDF 1',
    },
  ],
};
for (const kind of [
  'campaign',
  'dungeon',
  'room',
  'character',
  'monster',
] as const)
  localTest(
    `Oracle append to ${kind} Notes preserves previous text and reload`,
    () => {
      const c = notesFixture();
      const destination = notesDestinations(c).find(
        (d) => d.target.kind === kind,
      )!;
      const record =
        kind === 'campaign'
          ? c
          : kind === 'dungeon'
            ? c.dungeons[0]
            : kind === 'room'
              ? c.dungeons[0].rooms[0]
              : kind === 'character'
                ? c.characters[0]
                : c.monsters[0];
      record.notes = '  Keep this\n';
      appendOracleNotes(c, destination.target, noteResult);
      appendOracleNotes(c, destination.target, noteResult, false);
      assert.ok(record.notes.startsWith('  Keep this\n\n\n'));
      assert.equal(record.notes.match(/Source:/g)?.length, 1);
      assert.equal(record.notes.match(/Aerg-Tval/g)?.length, 2);
      assert.deepEqual(
        parseImport(JSON.stringify({ schemaVersion: 4, campaign: c }))[0],
        validateCampaign(c),
      );
    },
  );
localTest(
  'origin section chooses current Room/Character/Monster and ignores stale selections',
  () => {
    const c = notesFixture();
    c.workspace.selected.characters = c.characters[0].id;
    c.workspace.selected.monsters = c.monsters[0].id;
    c.workspace.section = 'dungeons';
    c.workspace.dungeonId = c.dungeons[0].id;
    c.workspace.dungeonTab = 'rooms';
    c.workspace.roomId = c.dungeons[0].rooms[1].id;
    assert.equal(contextNotesTarget(c).kind, 'room');
    c.workspace.section = 'characters';
    assert.equal(contextNotesTarget(c).kind, 'character');
    c.workspace.section = 'monsters';
    assert.equal(contextNotesTarget(c).kind, 'monster');
    c.workspace.section = 'notes';
    assert.equal(contextNotesTarget(c).kind, 'campaign');
  },
);
localTest(
  'Notes stable IDs survive Room reorder and reject removed/cross-campaign targets',
  () => {
    const c = notesFixture();
    const dest = notesDestinations(c).find(
      (d) => d.target.kind === 'room',
    )!.target;
    const id = notesTargetKey(dest);
    c.dungeons[0].rooms.reverse();
    appendOracleNotes(c, dest, noteResult);
    assert.ok(c.dungeons[0].rooms[1].notes.includes('Aerg'));
    assert.equal(notesTargetKey(dest), id);
    assert.throws(() =>
      appendOracleNotes(
        c,
        { ...dest, campaignId: crypto.randomUUID() },
        noteResult,
      ),
    );
    c.dungeons[0].rooms = [];
    assert.throws(() => appendOracleNotes(c, dest, noteResult));
  },
);
test('d6 × d8 and d4 × d8 keep both printed coordinates', () => {
  for (const [dice, first] of [
    ['d6 × d8', 6],
    ['d4 × d8', 4],
  ] as const) {
    assert.equal(diceDomain(dice).length, first * 8);
    assert.equal(rollOracleDice(dice, () => 0.999).value, first * 10 + 8);
    assert.deepEqual(
      rollOracleDice(dice, () => 0),
      { value: 11, values: [1, 1] },
    );
  }
});
localTest(
  'source-inferred dice and stateful/removal charts remain manual references',
  () => {
    for (const id of [
      'core.hereticalPriestOrigins',
      'feretory.philosopherItem',
      'feretory.ochreTablets',
      'heretic.nurse.corridorNorth',
      'heretic.curseCure',
    ]) {
      const t = all.tables.find((t) => t.id === id)!;
      assert.equal(t.rollable, false);
      assert.throws(() => rollOracle(t, all));
    }
  },
);
localTest(
  'a replacement canonical pack rebuilds adapters without stale or duplicated text arrays',
  () => {
    const pack = structuredClone(getRules()!);
    const first = buildOracleRegistry(pack, null);
    pack.tables['core.names'].entries[0].text = 'replacement';
    assert.equal(
      first.tables.find((t) => t.id === 'core.names')!.entries[0].text,
      'replacement',
    );
    const next = buildOracleRegistry(structuredClone(pack), null);
    assert.equal(
      next.tables.find((t) => t.id === 'core.names')!.entries[0].text,
      'replacement',
    );
    assert.notEqual(
      getRules()!.tables['core.names'].entries[0].text,
      'replacement',
    );
  },
);
