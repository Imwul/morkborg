import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import {
  buildReferenceRegistry,
  searchReferences,
} from '../src/domain/references.ts';
import { parseRulesPack } from '../src/storage/rulesStore.ts';
import { parseOraclePack } from '../src/storage/oracleStore.ts';
import {
  parsePhysicalDice,
  physicalOracleRoll,
  manualTableReading,
  parsePhysicalCards,
  manualRareMonster,
} from '../src/domain/manualReferenceRoll.ts';
import {
  independentTables,
  holdComponents,
  rerollHeldReference,
  runRecipeSteps,
  recipeRunnable,
} from '../src/domain/heldReferenceResults.ts';
import {
  executeReference,
  referenceProducesRoll,
} from '../src/domain/referenceExecution.ts';
import { cardIdentity } from '../src/domain/depthsProcedures.ts';
import {
  builtInReferencePacks,
  focusedReferences,
} from '../src/domain/conveniencePacks.ts';
import {
  CONVENIENCE_KEY,
  PLAY_SESSION_KEY,
  emptyConvenience,
  emptyPlaySession,
  addToTray,
  appendScratch,
  readConveniencePreferences,
  writeConveniencePreferences,
  readPlaySession,
  writePlaySession,
} from '../src/storage/conveniencePreferences.ts';
import { REFERENCE_PREFERENCES_KEY } from '../src/storage/referencePreferences.ts';
import { unresolvedOracleSources } from '../src/validation/oracleSourceIntegrity.ts';
import { unresolvedReferenceDefinitions } from '../src/domain/referenceDefinitions.ts';

const bundle = JSON.parse(
  readFileSync('outputs/morkborg-private-data.json', 'utf8'),
);
const rules = parseRulesPack(bundle.library),
  registry = buildOracleRegistry(rules, parseOraclePack(bundle.oracles)),
  index = buildReferenceRegistry(registry, rules);
const options = {
  registry,
  rules,
  region: 'sarkash' as const,
  stockKind: 'common' as const,
  stockDR: 10,
  cityLarge: false,
  cityExits: true,
};
const parameters = {
  region: 'sarkash' as const,
  stockKind: 'rare' as const,
  stockDR: 14,
  cityLarge: false,
  cityExits: true,
  encounterRegion: 'sarkash',
};
const reaction = index.byId['oracle:core.reaction'],
  pair = index.byId['procedure:reclvse.action-theme'];
const memory = () => {
  const data = new Map<string, string>([
    ['campaign-json', 'unchanged'],
    [REFERENCE_PREFERENCES_KEY, 'pins unchanged'],
  ]);
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
};

test('convenience stores are versioned, separate from pins and all Campaign JSON', () => {
  const store = memory(),
    prefs = {
      ...emptyConvenience(),
      recipes: [
        {
          id: 'recipe-1',
          name: 'First contact',
          referenceIds: [reaction.id, pair.id],
          createdAt: new Date().toISOString(),
        },
      ],
      packs: [
        {
          id: 'pack-1',
          name: 'My tools',
          referenceIds: [reaction.id],
          userCreated: true,
        },
      ],
      activePackId: 'pack-1',
    };
  writeConveniencePreferences(prefs, store);
  assert.deepEqual(readConveniencePreferences(store), prefs);
  let session = addToTray(emptyPlaySession(), reaction.id);
  session = appendScratch(session, 'Temporary handwritten prompt');
  session.lastRoll = {
    kind: 'reference',
    id: reaction.id,
    mode: 'USER_ROLL',
    parameters,
    inputs: { '0': '5' },
  };
  writePlaySession(session, store);
  assert.deepEqual(readPlaySession(store), session);
  assert.equal(store.data.get('campaign-json'), 'unchanged');
  assert.equal(store.data.get(REFERENCE_PREFERENCES_KEY), 'pins unchanged');
  assert.ok(store.data.has(CONVENIENCE_KEY));
  assert.ok(store.data.has(PLAY_SESSION_KEY));
});
test('malformed preference entries are isolated and temporary clear does not delete recipes/packs', () => {
  const store = memory();
  store.setItem(
    CONVENIENCE_KEY,
    JSON.stringify({
      schemaVersion: 1,
      recipes: [
        {
          id: 'ok',
          name: 'Combo',
          referenceIds: [pair.id],
          createdAt: 'today',
        },
        { name: 'bad' },
      ],
      packs: [],
      activePackId: null,
    }),
  );
  assert.equal(readConveniencePreferences(store).recipes.length, 1);
  writePlaySession(emptyPlaySession(), store);
  assert.equal(readConveniencePreferences(store).recipes[0].id, 'ok');
  store.setItem(
    PLAY_SESSION_KEY,
    JSON.stringify({
      schemaVersion: 1,
      tray: ['valid', 'valid'],
      scratch: 'a',
      lastRoll: { id: 'bad' },
    }),
  );
  assert.deepEqual(readPlaySession(store).tray, ['valid']);
  assert.equal(readPlaySession(store).lastRoll, null);
  store.setItem(CONVENIENCE_KEY, 'broken JSON');
  assert.deepEqual(readConveniencePreferences(store), emptyConvenience());
});
test('Tray deduplicates, bounds references, and scratch never silently truncates appended results', () => {
  let session = emptyPlaySession();
  session = addToTray(session, reaction.id);
  session = addToTray(session, reaction.id);
  assert.equal(session.tray.length, 1);
  for (let i = 0; i < 11; i++) session = addToTray(session, `ref-${i}`);
  assert.throws(() => addToTray(session, 'overflow'));
  const full = { ...session, scratch: 'x'.repeat(12000) };
  assert.throws(() => appendScratch(full, 'value'));
  assert.equal(full.scratch.length, 12000);
});
for (const sides of [2, 4, 6, 8, 10, 12, 20, 100])
  test(`physical d${sides} accepts its endpoints and rejects impossible dice`, () => {
    assert.equal(parsePhysicalDice(`d${sides}`, '1').value, 1);
    assert.equal(parsePhysicalDice(`d${sides}`, String(sides)).value, sides);
    for (const value of ['0', String(sides + 1), '1.5', 'abc', '1,1'])
      assert.throws(() => parsePhysicalDice(`d${sides}`, value));
  });
test('physical d66 accepts 35 / 3,5 and rejects 78 / 10 / aggregate substitutes', () => {
  assert.deepEqual(parsePhysicalDice('d66', '35').values, [3, 5]);
  assert.equal(parsePhysicalDice('d66', '3,5').value, 35);
  for (const input of ['78', '10', '00', '7,2', '3', '3,5,2'])
    assert.throws(() => parsePhysicalDice('d66', input));
});
test('canonical multi-dice and tuple selectors preserve each die, not invented totals', () => {
  assert.deepEqual(parsePhysicalDice('2d6', '3,4').values, [3, 4]);
  assert.equal(parsePhysicalDice('3d6', '2,3,4').value, 9);
  assert.equal(parsePhysicalDice('d4 × d6', '35').value, 35);
  assert.throws(() => parsePhysicalDice('2d6', '7'));
  assert.throws(() => parsePhysicalDice('d4 × d6', '55'));
});
test('manual table resolution has exact entry/source/provenance and USER_ROLL origin', () => {
  const table = registry.tables.find((t) => t.id === 'core.reaction')!,
    roll = physicalOracleRoll(table, '2,2', registry);
  assert.equal(roll.roll, 4);
  assert.deepEqual(roll.diceValues, [2, 2]);
  assert.equal(
    roll.entryId,
    table.entries.find((e) => e.min <= 4 && e.max >= 4)!.id,
  );
  assert.equal(roll.metadata?.rollOrigin, 'USER_ROLL');
  assert.equal(roll.metadata?.provenance?.sourceRefs[0].tableId, table.id);
  const result = manualTableReading(
    reaction,
    [table],
    { '0': '2,2' },
    registry,
  );
  assert.equal(result.rollMethod?.kind, 'USER_ROLL');
  assert.equal(result.sourceRefs[0].roll, 4);
  assert.ok(
    result.authority?.some(
      (a) => a.kind === 'APP_POLICY' && a.id === 'app.physical-roll',
    ),
  );
});
test('manual d20, d100 and sum-dice use actual canonical tables', () => {
  for (const dice of ['d20', 'd100', '2d6']) {
    const t = registry.tables.find(
      (t) =>
        t.dice === dice &&
        t.sourceVerified &&
        t.rollable !== false &&
        !t.allowedGaps?.length,
    )!;
    assert.ok(t, dice);
    const input = dice === '2d6' ? '3,4' : dice === 'd20' ? '12' : '50';
    const r = physicalOracleRoll(t, input, registry);
    assert.equal(r.dice, dice);
    assert.equal(r.metadata?.rollOrigin, 'USER_ROLL');
    assert.ok(r.entryId);
  }
});
test('manual inputs cannot roll unavailable/non-rollable sources', () => {
  const t = registry.tables.find((t) => t.id === 'core.reaction')!;
  assert.throws(() =>
    physicalOracleRoll({ ...t, sourceVerified: false }, '2', registry),
  );
  assert.throws(() =>
    physicalOracleRoll({ ...t, rollable: false }, '2', registry),
  );
});
test('physical card parser preserves rank/suit and rejects duplicate or impossible cards', () => {
  assert.deepEqual(parsePhysicalCards('Q♠ 10♥').map(cardIdentity), [
    'Q♠',
    '10♥',
  ]);
  for (const value of ['11♥', '1♠', 'QX', 'Q♠ Q♠', 'Joker'])
    assert.throws(() => parsePhysicalCards(value));
});
test('physical five-card monster uses existing engine and requires the conditional sixth card', () => {
  const result = manualRareMonster('Q♠ 10♥ 2♣ A♦ 7♠', registry);
  assert.deepEqual(result.rareMonster?.cards.map(cardIdentity), [
    'Q♠',
    '10♥',
    '2♣',
    'A♦',
    '7♠',
  ]);
  assert.equal(result.rareMonster?.hp, 2);
  assert.equal(result.rareMonster?.morale, 6);
  assert.equal(result.rareMonster?.damageDie, 8);
  assert.equal(result.rollMethod?.kind, 'USER_ROLL');
  assert.ok(result.sourceRefs.every((s) => s.bookId === 'depths'));
  assert.throws(() => manualRareMonster('A♣ 2♦ 3♠ 4♠ 5♥', registry));
  const sixth = manualRareMonster('A♣ 2♦ 3♠ 4♠ 5♥ 6♦', registry);
  assert.equal(sixth.rareMonster?.cards.length, 6);
  assert.throws(() =>
    manualRareMonster(
      'Q♠ 10♥ 2♣ A♦ 7♠',
      registry,
      result.rareMonster!.remaining,
    ),
  );
  assert.equal(result.rareMonster!.remaining.length, 47);
});
test('independent Action hold rerolls Theme exactly once and updates provenance together', () => {
  const first = executeReference(pair, { ...options, rng: () => 0.1 })!;
  let calls = 0;
  const next = rerollHeldReference(pair, first, ['0'], {
    ...options,
    rng: () => {
      calls++;
      return 0.8;
    },
  });
  assert.equal(calls, 1);
  assert.strictEqual(next.oracle!.rolls[0], first.oracle!.rolls[0]);
  assert.notEqual(
    next.oracle!.rolls[1].entryId,
    first.oracle!.rolls[1].entryId,
  );
  const r = next.oracle!.rolls[1];
  assert.equal(r.metadata?.provenance?.sourceRefs[0].entryId, r.entryId);
  assert.equal(next.sourceRefs[1].roll, r.roll);
  assert.strictEqual(
    rerollHeldReference(pair, next, ['0', '1'], options),
    next,
  );
});
test('manual Action kept during app Theme reroll remains USER_ROLL and reading becomes MIXED', () => {
  const first = manualTableReading(
    pair,
    independentTables(pair, registry),
    { '0': '12', '1': '15' },
    registry,
  );
  const next = rerollHeldReference(pair, first, ['0'], {
    ...options,
    rng: () => 0.4,
  });
  assert.equal(next.rollMethod?.kind, 'MIXED');
  assert.equal(next.oracle!.rolls[0].metadata?.rollOrigin, 'USER_ROLL');
  assert.equal(next.oracle!.rolls[1].metadata?.rollOrigin, 'APP_ROLL');
});
test('Feretory parent/stats and rare-card dependent results reject partial holds', () => {
  const epk = index.byId['oracle:feretory.A'];
  assert.ok(epk);
  const reading = executeReference(epk, options)!;
  assert.ok(
    holdComponents(epk, reading, registry).some((c) => c.relation === 'CHILD'),
  );
  assert.throws(() => rerollHeldReference(epk, reading, ['0'], options));
  assert.equal(independentTables(epk, registry).length, 0);
  const rare = index.byId['procedure:depths.rare-monster'];
  const value = manualRareMonster('Q♠ 10♥ 2♣ A♦ 7♠', registry);
  assert.throws(() => rerollHeldReference(rare, value, [], options, '0'));
});
test('NPC field reroll leaves other fields/manual edits/source refs intact', () => {
  const entry = index.byId['procedure:workbench.npc'],
    reading = executeReference(entry, options)!;
  assert.ok(reading.npcSnapshot);
  const npc = reading.npcSnapshot;
  const before = JSON.stringify(npc);
  const result = rerollHeldReference(
    entry,
    reading,
    ['name'],
    { ...options, rng: () => 0.7 },
    'appearance',
  );
  assert.equal(result.npcSnapshot!.name, npc.name);
  assert.equal(result.npcSnapshot!.reaction, npc.reaction);
  assert.equal(JSON.stringify(npc), before);
  assert.deepEqual(
    result.npcSnapshot!.fieldProvenance!.reaction,
    npc.fieldProvenance!.reaction,
  );
  npc.name = 'User name';
  npc.fieldProvenance!.name = {
    ...npc.fieldProvenance!.name!,
    origin: 'source-edited',
  };
  const next = rerollHeldReference(entry, reading, [], options, 'appearance');
  assert.equal(next.npcSnapshot!.name, 'User name');
});
test('Recipes run ordered independent canonical results, respect hold/manual text, and isolate failures', () => {
  let calls: string[] = [];
  const ids = [reaction.id, pair.id, reaction.id];
  const run = (e: typeof reaction) => {
    calls.push(e.id);
    return executeReference(e, options);
  };
  const first = runRecipeSteps(ids, index.byId, [], run);
  assert.deepEqual(calls, ids);
  assert.ok(first.every((r) => r.reading!.sourceRefs.length));
  first[0].held = true;
  first[1].manualText = 'My handwritten edit';
  first[1].held = true;
  calls = [];
  const next = runRecipeSteps(ids, index.byId, first, run);
  assert.deepEqual(calls, [reaction.id]);
  assert.strictEqual(next[0], first[0]);
  assert.strictEqual(next[1], first[1]);
  assert.equal(next[1].manualText, 'My handwritten edit');
  assert.ok(
    runRecipeSteps(['missing-ref', reaction.id], index.byId, [], run)[0].error,
  );
  assert.equal(recipeRunnable(index.byId['rule:core.omens']), false);
});
test('Five built-in packs project existing context IDs; global search still reaches outside references', () => {
  const packs = builtInReferencePacks(index);
  assert.equal(packs.length, 5);
  assert.ok(packs.every((p) => p.referenceIds.every((id) => !!index.byId[id])));
  const city = packs.find((p) => p.id === 'pack:city')!;
  assert.ok(
    focusedReferences(index, city).every((e) => e.contexts.includes('city')),
  );
  assert.match(searchReferences(index, 'Broken', { limit: 1 })[0].id, /broken/);
  assert.ok(
    !city.referenceIds.includes(
      searchReferences(index, 'Broken', { limit: 1 })[0].id,
    ),
  );
});
test('convenience work adds no unresolved source content or definitions', () => {
  assert.equal(unresolvedOracleSources(registry).length, 0);
  assert.equal(
    unresolvedReferenceDefinitions(
      index.entries.flatMap((e) => (e.definition ? [e.definition] : [])),
      registry,
    ).length,
    0,
  );
});

test('reroll authority removes stale physical-roll claims and never accumulates duplicate hold policies', () => {
  const first = manualTableReading(
    pair,
    independentTables(pair, registry),
    { '0': '12', '1': '15' },
    registry,
  );
  let next = rerollHeldReference(pair, first, [], options);
  assert.equal(next.rollMethod?.kind, 'APP_ROLL');
  assert.ok(!next.authority?.some((a) => a.id === 'app.physical-roll'));
  for (let i = 0; i < 10; i++)
    next = rerollHeldReference(pair, next, ['0'], options);
  assert.equal(
    next.authority?.filter((a) => a.id === 'app.held-results').length,
    1,
  );
});
test('City Pack prioritizes source parent Moves over their conditional tables', () => {
  const pack = builtInReferencePacks(index).find((p) => p.id === 'pack:city')!;
  const first = focusedReferences(index, pack).slice(0, 4);
  assert.ok(first.every((e) => e.action?.kind === 'city' && e.action.move));
  assert.ok(first.every((e) => !e.parentId));
});

test('Last Roll recognizes Depths executable procedures even when they also carry rule definitions', () => {
  for (const id of [
    'procedure:depths.encounter-level',
    'procedure:depths.rare-monster',
    reaction.id,
    pair.id,
  ])
    assert.equal(referenceProducesRoll(index.byId[id]), true, id);
  assert.equal(referenceProducesRoll(index.byId['rule:core.omens']), false);
  assert.equal(referenceProducesRoll({ ...reaction, available: false }), false);
});
