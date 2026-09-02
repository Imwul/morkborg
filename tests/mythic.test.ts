import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import {
  defaultMythicState,
  FATE_ODDS,
  rememberFate,
  type FateChart,
} from '../src/domain/mythic.ts';
import {
  fateCell,
  percentileEvent,
  resolveFate,
  resolveScene,
  rollFate,
  fateNotesResult,
} from '../src/generators/mythic.ts';
import { parseFateChart } from '../src/storage/fateChartStore.ts';
import { mythicStateSchema } from '../src/storage/mythicSchema.ts';
import {
  validateSave,
  validateCampaign,
  parseImport,
} from '../src/storage/schema.ts';
import {
  emptySave,
  loadStoredSave,
  STORAGE_KEY,
} from '../src/storage/migrations.ts';
import {
  createCampaign,
  createDungeon,
  createRoom,
} from '../src/generators/index.ts';
import { cloneCampaign, importCampaigns } from '../src/domain/operations.ts';
import { editMythic } from '../src/domain/mythicOperations.ts';
import { appendOracleNotes } from '../src/domain/oracleNotes.ts';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { parseOraclePack } from '../src/storage/oracleStore.ts';
import { rollProcedure } from '../src/generators/oracleRoller.ts';
import {
  localAdapter,
  transact,
  getSnapshot,
  retrySave,
} from '../src/storage/saveStore.ts';
const available = existsSync('public/rules/mythic-fate.json');
const chart = available
  ? parseFateChart(
      JSON.parse(readFileSync('public/rules/mythic-fate.json', 'utf8')),
    )
  : null;
const localTest = (name: string, fn: () => void) =>
  test(name, { skip: !available }, fn);
const setup = () => {
  const save = emptySave();
  save.campaigns = [createCampaign('First'), createCampaign('Second')];
  save.activeCampaignId = save.campaigns[0].id;
  save.view = 'campaign';
  return save;
};
test('Mythic starts at Chaos5 and 50/50 with independent empty histories', () => {
  const a = defaultMythicState(),
    b = defaultMythicState();
  a.chaosFactor = 8;
  assert.equal(b.chaosFactor, 5);
  assert.equal(b.odds, 'fifty-fifty');
  a.history.push(resolveScene(a, 10));
  assert.equal(b.history.length, 0);
});
test('full backup restores standalone Mythic without overwriting the active session', () => {
  const original = emptySave();
  original.mythic = {
    ...defaultMythicState(),
    chaosFactor: 8,
    scene: 'At the gate',
  };
  rememberFate(original.mythic, resolveScene(original.mythic, 4));
  const imported = parseImport(JSON.stringify(original));
  assert.equal(imported.length, 1);
  const recovered = imported[0];
  assert.equal(recovered.title, 'Mythic — standalone backup');
  assert.equal(recovered.mythic!.chaosFactor, 8);
  assert.equal(recovered.mythic!.history[0].answer, 'interrupt');
  assert.notEqual(
    recovered.mythic!.history[0].id,
    original.mythic.history[0].id,
  );
  const current = setup();
  current.mythic = {
    ...defaultMythicState(),
    chaosFactor: 3,
    question: 'Keep me',
  };
  const before = structuredClone(current);
  importCampaigns(current, imported);
  assert.deepEqual(current.mythic, before.mythic);
  assert.deepEqual(current.campaigns.slice(0, 2), before.campaigns);
  assert.equal(validateSave(current).campaigns[2].mythic!.scene, 'At the gate');
});
localTest(
  'source Fate Chart has all81 verified cells and no duplicate Odds',
  () => {
    assert.equal(chart!.rows.length, 9);
    assert.equal(chart!.sourcePage, 20);
    for (const mutate of [
      (x: FateChart) => {
        x.rows[1].odds = x.rows[0].odds;
      },
      (x: FateChart) => {
        x.rows[0].cells.pop();
      },
      (x: FateChart) => {
        x.rows[0].cells[0].exceptionalNo = 1;
      },
      (x: FateChart) => {
        x.rows[0].cells[0].yes = 101;
      },
    ]) {
      const broken = structuredClone(chart!);
      mutate(broken);
      assert.throws(() => parseFateChart(broken));
    }
  },
);
localTest(
  'all8100 Chart rolls follow original thresholds with full exclusive coverage',
  () => {
    for (const odds of FATE_ODDS)
      for (let cf = 1; cf <= 9; cf++) {
        const s = { ...defaultMythicState(), odds: odds.id, chaosFactor: cf };
        const cell = fateCell(chart!, odds.id, cf);
        const counts = {
          yes: 0,
          no: 0,
          'exceptional-yes': 0,
          'exceptional-no': 0,
        };
        for (let roll = 1; roll <= 100; roll++) {
          const r = resolveFate(s, chart, [roll]);
          counts[r.answer as keyof typeof counts]++;
          assert.equal(
            r.randomEvent,
            roll < 100 && roll % 11 === 0 && roll / 11 <= cf,
          );
        }
        assert.equal(counts.yes + counts['exceptional-yes'], cell.yes);
        assert.equal(counts['exceptional-yes'], cell.exceptionalYes ?? 0);
        assert.equal(
          counts['exceptional-no'],
          cell.exceptionalNo === null ? 0 : 101 - cell.exceptionalNo,
        );
        assert.equal(
          Object.values(counts).reduce((a, b) => a + b),
          100,
        );
      }
  },
);
localTest('50/50 CF5 includes all printed exceptional boundaries', () => {
  const s = defaultMythicState();
  for (const [roll, answer] of [
    [1, 'exceptional-yes'],
    [10, 'exceptional-yes'],
    [11, 'yes'],
    [50, 'yes'],
    [51, 'no'],
    [90, 'no'],
    [91, 'exceptional-no'],
    [100, 'exceptional-no'],
  ] as const)
    assert.equal(resolveFate(s, chart, [roll]).answer, answer);
});
localTest(
  'X never invents exceptional results at Impossible or Certain limits',
  () => {
    const s = defaultMythicState();
    s.odds = 'certain';
    s.chaosFactor = 7;
    assert.equal(resolveFate(s, chart, [100]).answer, 'no');
    assert.equal(resolveFate(s, chart, [100]).randomEvent, false);
    s.odds = 'impossible';
    s.chaosFactor = 1;
    assert.equal(resolveFate(s, chart, [1]).answer, 'yes');
  },
);
test('doubles use their single digit, include Chaos equality and exclude100', () => {
  assert.equal(percentileEvent(55, 5), true);
  assert.equal(percentileEvent(66, 5), false);
  assert.equal(percentileEvent(99, 9), true);
  for (let cf = 1; cf <= 9; cf++) {
    assert.equal(percentileEvent(100, cf), false);
    assert.equal(
      Array.from({ length: 100 }, (_, i) => percentileEvent(i + 1, cf)).filter(
        Boolean,
      ).length,
      cf,
    );
  }
});
test('Fate Check uses source modifiers and exact exceptional bands without clamping', () => {
  const s = { ...defaultMythicState(), method: 'check' as const };
  for (const [dice, answer] of [
    [[1, 1], 'exceptional-no'],
    [[2, 2], 'exceptional-no'],
    [[2, 3], 'no'],
    [[5, 5], 'no'],
    [[5, 6], 'yes'],
    [[9, 9], 'exceptional-yes'],
    [[10, 10], 'exceptional-yes'],
  ] as const)
    assert.equal(resolveFate(s, null, [...dice]).answer, answer);
  s.odds = 'very-likely';
  const high = resolveFate(s, null, [10, 10]);
  assert.equal(high.total, 22);
  assert.equal(high.answer, 'yes');
  assert.equal(high.randomEvent, false);
  s.odds = 'unlikely';
  const low = resolveFate(s, null, [1, 1]);
  assert.equal(low.total, 1);
  assert.equal(low.answer, 'no');
  assert.equal(low.randomEvent, true);
});
test('Fate Check matches the printed bridge example with independent Random Event', () => {
  const s = {
    ...defaultMythicState(),
    method: 'check' as const,
    odds: 'nearly-impossible' as const,
    chaosFactor: 6,
  };
  const r = resolveFate(s, null, [3, 3]);
  assert.equal(r.modifier, -3);
  assert.equal(r.total, 3);
  assert.equal(r.answer, 'exceptional-no');
  assert.equal(r.randomEvent, true);
});
test('every81 Fate Check combination has100 legal paired rolls', () => {
  for (const odds of FATE_ODDS)
    for (let cf = 1; cf <= 9; cf++)
      for (let a = 1; a <= 10; a++)
        for (let b = 1; b <= 10; b++) {
          const r = resolveFate(
            {
              ...defaultMythicState(),
              method: 'check',
              odds: odds.id,
              chaosFactor: cf,
            },
            null,
            [a, b],
          );
          assert.equal(
            mythicStateSchema.safeParse({
              ...defaultMythicState(),
              history: [r],
            }).success,
            true,
          );
          assert.equal(r.randomEvent, a === b && a <= cf);
        }
});
test('scene checks cover all90 combinations and do not change Chaos', () => {
  for (let cf = 1; cf <= 9; cf++)
    for (let die = 1; die <= 10; die++) {
      const s = { ...defaultMythicState(), chaosFactor: cf };
      const r = resolveScene(s, die);
      assert.equal(
        r.answer,
        die > cf ? 'expected' : die % 2 ? 'altered' : 'interrupt',
      );
      assert.equal(r.randomEvent, r.answer === 'interrupt');
      assert.equal(s.chaosFactor, cf);
    }
});
localTest(
  'random and manual rolls return identical answers for identical physical dice',
  () => {
    const s = defaultMythicState();
    assert.equal(
      rollFate(s, chart, () => 0.549).answer,
      resolveFate(s, chart, [55]).answer,
    );
    const values = [0.25, 0.25];
    s.method = 'check';
    const r = rollFate(s, chart, () => values.shift()!);
    assert.deepEqual(r.dice, [3, 3]);
    assert.equal(r.input, 'random');
    s.tab = 'scene';
    assert.equal(rollFate(s, chart, () => 0.99).answer, 'expected');
  },
);
test('invalid dice and Chaos values are rejected instead of clamped', () => {
  for (const chaos of [0, 10, 1.5, NaN])
    assert.throws(() =>
      resolveScene({ ...defaultMythicState(), chaosFactor: chaos }, 1),
    );
  for (const die of [0, 11, 2.5, NaN])
    assert.throws(() => resolveScene(defaultMythicState(), die));
  assert.throws(() =>
    resolveFate({ ...defaultMythicState(), method: 'check' }, null, [1, 11]),
  );
  assert.throws(() => resolveFate(defaultMythicState(), null, [50]));
});
test('older v4 campaigns load unchanged and receive defaults only when Fate is used', () => {
  const save = setup(),
    before = structuredClone(save);
  assert.deepEqual(validateSave(save), before);
  assert.equal(defaultMythicState().chaosFactor, 5);
  editMythic(save, save.campaigns[0].id, (s) => {
    s.chaosFactor = 7;
  });
  assert.equal(save.campaigns[0].mythic!.chaosFactor, 7);
  assert.equal(save.campaigns[1].mythic, undefined);
});
test('Chaos, Odds, questions and readings restore through real storage loader', () => {
  const save = setup(),
    id = save.campaigns[0].id;
  editMythic(save, id, (s) => {
    s.chaosFactor = 8;
    s.odds = 'likely';
    s.question = 'Hervör — Kergüs?';
    s.scene = 'Wästland';
    s.method = 'check';
    rememberFate(s, resolveFate(s, null, [4, 4]));
  });
  const raw = JSON.stringify(save);
  const storage = {
    length: 1,
    key: () => STORAGE_KEY,
    getItem: (key: string) => (key === STORAGE_KEY ? raw : null),
    setItem: () => {},
  };
  assert.deepEqual(loadStoredSave(storage).save, save);
});
test('Campaign export/import keeps Mythic state and clone remaps history IDs independently', () => {
  const save = setup(),
    c = save.campaigns[0];
  editMythic(save, c.id, (s) => {
    s.chaosFactor = 7;
    rememberFate(s, resolveScene(s, 4));
  });
  const exported = parseImport(
    JSON.stringify({ schemaVersion: 4, campaign: c }),
  )[0];
  assert.deepEqual(exported, c);
  const clone = cloneCampaign(c);
  assert.equal(clone.mythic!.chaosFactor, 7);
  assert.notEqual(clone.mythic!.history[0].id, c.mythic!.history[0].id);
  clone.mythic!.chaosFactor = 2;
  assert.equal(c.mythic!.chaosFactor, 7);
  importCampaigns(save, [exported]);
  assert.equal(save.campaigns.length, 3);
  assert.equal(save.campaigns[2].mythic!.chaosFactor, 7);
  assert.equal(validateSave(save).campaigns.length, 3);
});
test('standalone state and two Campaigns cannot leak Chaos or questions', () => {
  const save = setup(),
    [a, b] = save.campaigns;
  editMythic(save, null, (s) => {
    s.chaosFactor = 9;
    s.question = 'Standalone';
  });
  editMythic(save, a.id, (s) => {
    s.chaosFactor = 2;
    s.question = 'First';
  });
  editMythic(save, b.id, (s) => {
    s.chaosFactor = 6;
    s.question = 'Second';
  });
  const restored = validateSave(JSON.parse(JSON.stringify(save)));
  assert.equal(restored.mythic!.chaosFactor, 9);
  assert.equal(restored.campaigns[0].mythic!.question, 'First');
  assert.equal(restored.campaigns[1].mythic!.chaosFactor, 6);
  assert.throws(() =>
    editMythic(save, crypto.randomUUID(), (s) => {
      s.chaosFactor = 1;
    }),
  );
});
test('Chaos updates keep every Dungeon/Room value and timestamp unchanged', () => {
  const save = setup(),
    c = save.campaigns[0],
    d = createDungeon(c.id, 'Keep', 'kergus', true);
  d.rooms = [createRoom('kergus', true)];
  d.rooms[0].notes = 'manual';
  c.dungeons = [d];
  const before = structuredClone(d);
  editMythic(save, c.id, (s) => {
    s.chaosFactor = 9;
    rememberFate(s, resolveScene(s, 3));
  });
  assert.deepEqual(c.dungeons[0], before);
});
test('past readings stay at their original Chaos and history is bounded to20', () => {
  const s = defaultMythicState(),
    r = resolveScene(s, 4);
  rememberFate(s, r);
  s.chaosFactor = 8;
  assert.equal(r.chaosFactor, 5);
  for (let i = 0; i < 25; i++) rememberFate(s, resolveScene(s, 10));
  assert.equal(s.history.length, 20);
  assert.equal(new Set(s.history.map((r) => r.id)).size, 20);
});
test('Fate Notes append original text, question, source, answer and historical Chaos to stable Room', () => {
  const c = createCampaign('Keep'),
    d = createDungeon(c.id, 'Keep', 'kergus', true),
    a = createRoom('kergus', true),
    b = createRoom('kergus', true);
  d.rooms = [b, a];
  c.dungeons = [d];
  a.notes = '기존 내용\n ';
  const s = {
      ...defaultMythicState(),
      method: 'check' as const,
      question: 'Does Hervör see Kergüs?',
    },
    r = resolveFate(s, null, [5, 5]);
  appendOracleNotes(
    c,
    { kind: 'room', campaignId: c.id, dungeonId: d.id, id: a.id },
    fateNotesResult(r),
  );
  assert.ok(a.notes.startsWith('기존 내용\n \n\n'));
  assert.match(a.notes, /Does Hervör see Kergüs/);
  assert.match(a.notes, /Chaos 5/);
  assert.match(a.notes, /Random Event/);
  assert.match(a.notes, /PDF 26–27/);
  assert.equal(b.notes, '');
  assert.deepEqual(validateCampaign(c), c);
});
test('malformed persisted Chaos or coupled dice does not silently reset', () => {
  const c = createCampaign('Bad');
  c.mythic = defaultMythicState();
  c.mythic.chaosFactor = 10;
  assert.throws(() => validateCampaign(c));
  c.mythic.chaosFactor = 5;
  c.mythic.history = [resolveScene(c.mythic, 5)];
  c.mythic.history[0].total = 9;
  assert.throws(() => validateCampaign(c));
});
localTest(
  'Random Event reuses existing Focus and Action source definitions',
  () => {
    if (!existsSync('public/rules/oracles.json'))
      throw new Error('Oracle private pack missing');
    const registry = buildOracleRegistry(
      null,
      parseOraclePack(
        JSON.parse(readFileSync('public/rules/oracles.json', 'utf8')),
      ),
    );
    const event = rollProcedure(
      {
        id: 'event',
        title: 'Event',
        oracleIds: [
          'mythic2.random-event-focus-table',
          'mythic2.meaning.action-1',
          'mythic2.meaning.action-2',
        ],
      },
      registry,
      () => 0,
    );
    const s = defaultMythicState(),
      r = resolveFate(s, chart, [55]);
    r.event = event;
    rememberFate(s, r);
    assert.equal(event.rolls.length, 3);
    assert.equal(fateNotesResult(r).rolls.length, 4);
    assert.equal(mythicStateSchema.safeParse(s).success, true);
    for (const roll of event.rolls)
      assert.equal(
        roll.text,
        registry.tables.find((t) => t.id === roll.oracleId)!.entries[0].text,
      );
  },
);
test('quota failure retains Chaos in memory and retry persists it', () => {
  const original = localAdapter.write;
  let bytes = '';
  try {
    localAdapter.write = () => {
      throw new Error('quota');
    };
    transact((save) =>
      editMythic(save, null, (s) => {
        s.chaosFactor = 8;
      }),
    );
    assert.equal(getSnapshot().save.mythic!.chaosFactor, 8);
    assert.ok(getSnapshot().error);
    localAdapter.write = (value) => {
      bytes = value;
    };
    retrySave();
    assert.equal(getSnapshot().error, null);
    assert.equal(JSON.parse(bytes).mythic.chaosFactor, 8);
  } finally {
    localAdapter.write = original;
  }
});
