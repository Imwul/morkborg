import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  createCampaign,
  createDungeon,
  createRoom,
} from '../src/generators/index.ts';
import { emptySave } from '../src/storage/migrations.ts';
import { generateCharacter } from '../src/generators/character.ts';
import {
  currentPlayContext,
  contextLabel,
  contextWorkspace,
  pushContext,
  validContext,
  type PlayContext,
} from '../src/domain/playContext.ts';
import { homePage } from '../src/navigation/appLocation.ts';
import {
  createReplay,
  replayResult,
  appendReplay,
  replaySources,
  copyReplay,
  replayParameterLines,
} from '../src/domain/rollReplay.ts';
import {
  emptyPlayMemory,
  readPlayMemory,
  writePlayMemory,
  PLAY_MEMORY_KEY,
} from '../src/storage/playMemory.ts';
import { parseRulesPack } from '../src/storage/rulesStore.ts';
import { parseOraclePack } from '../src/storage/oracleStore.ts';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { buildReferenceRegistry } from '../src/domain/references.ts';
import { executeReference } from '../src/domain/referenceExecution.ts';
import {
  manualTableReading,
  manualRareMonster,
} from '../src/domain/manualReferenceRoll.ts';
import {
  independentTables,
  runRecipeSteps,
  rerollHeldReference,
} from '../src/domain/heldReferenceResults.ts';
import { copyReferenceReading } from '../src/domain/referenceReading.ts';
import {
  normalizeReferenceLocation,
  emptyReferenceLocation,
} from '../src/navigation/referenceLocation.ts';
const bundle = JSON.parse(
  readFileSync('outputs/morkborg-private-data.json', 'utf8'),
);
const rules = parseRulesPack(bundle.library),
  registry = buildOracleRegistry(rules, parseOraclePack(bundle.oracles)),
  index = buildReferenceRegistry(registry, rules);
const parameters = {
  region: 'sarkash' as const,
  stockKind: 'rare' as const,
  stockDR: 14,
  cityLarge: true,
  cityExits: false,
  encounterRegion: 'kergus',
};
const options = { ...parameters, registry, rules, rng: () => 0.55 };
const reaction = index.byId['oracle:core.reaction'],
  pair = index.byId['procedure:reclvse.action-theme'];
const reading = executeReference(reaction, options)!;
const replay = () =>
  createReplay({
    kind: 'reference',
    referenceId: reaction.id,
    title: reading.title,
    parameters,
    results: [replayResult(reaction.id, reading)],
  });
function fixture() {
  const save = emptySave(),
    c = createCampaign('Play memory QA'),
    d = createDungeon(c.id, 'Saved dungeon', 'sarkash', true);
  d.rooms = Array.from({ length: 4 }, () => ({
    ...createRoom('sarkash', true),
    description: 'Private handwritten room detail',
  }));
  c.dungeons.push(d);
  save.campaigns.push(c);
  save.activeCampaignId = c.id;
  save.view = 'campaign';
  Object.assign(c.workspace, {
    section: 'dungeons',
    dungeonId: d.id,
    dungeonTab: 'overview',
  });
  return { save, c, d };
}
function storage() {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => {
      data.set(k, v);
    },
  };
}
test('Only meaningful object selectors become context; home/desk is separate from reference excursions', () => {
  const { save, c, d } = fixture();
  const current = currentPlayContext(save, { ...homePage, oracleOpen: false })!;
  assert.equal(current.kind, 'dungeon');
  assert.equal(current.dungeonId, d.id);
  c.workspace.roomId = d.rooms[2].id;
  assert.equal(
    currentPlayContext(save, { ...homePage, oracleOpen: false })!.kind,
    'room',
  );
  assert.deepEqual(currentPlayContext(save, homePage), { kind: 'desk' });
  assert.equal(
    currentPlayContext(save, { ...homePage, deskPage: 'sources' }),
    null,
  );
  c.workspace.section = 'notes';
  assert.equal(
    currentPlayContext(save, { ...homePage, oracleOpen: false }),
    null,
  );
});
test('Consecutive context duplicates collapse, revisits remain and stack is bounded at five', () => {
  const a: PlayContext = { kind: 'desk' },
    b: PlayContext = { kind: 'campaign', campaignId: 'a' };
  assert.equal(pushContext([a], a).length, 1);
  assert.deepEqual(pushContext([b, a], a), [a, b, a]);
  let stack: PlayContext[] = [];
  for (let i = 0; i < 20; i++)
    stack = pushContext(stack, { kind: 'campaign', campaignId: String(i) });
  assert.equal(stack.length, 5);
  assert.equal(stack[0].campaignId, '19');
});
test('Room label resolves live IDs and navigation preserves tab without copying object data', () => {
  const { save, c, d } = fixture();
  const room: PlayContext = {
    kind: 'room',
    campaignId: c.id,
    dungeonId: d.id,
    objectId: d.rooms[2].id,
    dungeonTab: 'overview',
  };
  assert.equal(contextLabel(room, save), 'ROOM 03');
  const before = structuredClone(c);
  Object.assign(c.workspace, contextWorkspace(room, c.workspace));
  assert.equal(c.workspace.roomId, d.rooms[2].id);
  assert.equal(c.workspace.dungeonTab, 'overview');
  assert.deepEqual(c.dungeons, before.dungeons);
  assert.ok(!JSON.stringify(room).includes(d.rooms[2].description));
});
test('Deleted Room, deleted Dungeon and another Campaign cannot be guessed or resurrected', () => {
  const { save, c, d } = fixture();
  const room: PlayContext = {
    kind: 'room',
    campaignId: c.id,
    dungeonId: d.id,
    objectId: d.rooms[2].id,
  };
  assert.ok(validContext(room, save));
  d.rooms.splice(2, 1);
  assert.equal(validContext(room, save), null);
  assert.equal(validContext({ ...room, campaignId: 'elsewhere' }, save), null);
  c.dungeons = [];
  assert.equal(validContext({ ...room, kind: 'dungeon' }, save), null);
});
test('Character context restores only the selected Character, never stats or equipment', () => {
  const { save, c } = fixture();
  c.characters = [generateCharacter(c.id, true)];
  const character = c.characters[0];
  character.name = 'Manual QA character';
  character.hp = 7;
  character.notes = 'A manually written note that navigation must preserve.';
  const context: PlayContext = {
    kind: 'characters',
    campaignId: c.id,
    objectId: character.id,
  };
  const before = structuredClone(character);
  assert.ok(validContext(context, save));
  Object.assign(c.workspace, contextWorkspace(context, c.workspace));
  assert.equal(c.workspace.selected.characters, character.id);
  assert.deepEqual(character, before);
});
test('APP_ROLL is a detached exact snapshot and plain/source COPY match the original', () => {
  const value = replay();
  assert.equal(value.results[0].mode, 'APP_ROLL');
  assert.equal(copyReplay(value), copyReferenceReading(reading));
  assert.equal(copyReplay(value, true), copyReferenceReading(reading, true));
  const mutable = structuredClone(reading);
  const snap = replayResult(reaction.id, mutable);
  mutable.blocks[0].text = 'later change';
  assert.notEqual(snap.reading.blocks[0].text, 'later change');
});
test('USER_ROLL retains the actual physical input and canonical result', () => {
  const entry = index.byId['oracle:core.broken'];
  const table = independentTables(entry, registry);
  const value = manualTableReading(entry, table, { '0': '3' }, registry);
  const snap = replayResult(entry.id, value);
  assert.equal(snap.mode, 'USER_ROLL');
  assert.equal(snap.inputs?.['0'], '3');
  assert.equal(snap.rolls[0].roll, 3);
  assert.equal(snap.reading.blocks[0].text, value.blocks[0].text);
});
test('Composite replay keeps both actual rolls without invoking either table again', () => {
  const value = executeReference(pair, options)!;
  const snap = replayResult(pair.id, value);
  assert.equal(snap.rolls.length, 2);
  assert.deepEqual(
    snap.rolls.map((r) => [r.roll, r.text]),
    value.oracle!.rolls.map((r) => [r.roll, r.text]),
  );
});
test('Recipe snapshots preserve held components and separate manualText from canonical text', () => {
  const results = runRecipeSteps([reaction.id, pair.id], index.byId, [], (e) =>
    executeReference(e, options),
  );
  results[0].held = true;
  results[1].manualText = '사용자 수정';
  const again = runRecipeSteps(
    [reaction.id, pair.id],
    index.byId,
    results,
    () => {
      throw Error('held fields must not execute');
    },
  );
  const entry = createReplay({
    kind: 'recipe',
    referenceId: 'user-recipe',
    title: 'QA',
    parameters,
    results: again.map((r) => replayResult(r.referenceId, r.reading!, r)),
  });
  assert.equal(entry.results[0].held, true);
  assert.equal(entry.results[1].manualText, '사용자 수정');
  assert.notEqual(entry.results[1].reading.blocks[0].text, '사용자 수정');
  assert.match(copyReplay(entry, true), /Edited manually/);
});
test('Non-default Encounter Level parameters and the actual result survive replay', () => {
  const e = index.byId['procedure:depths.encounter-level'];
  const value = executeReference(e, { ...options, encounterRegion: 'kergus' })!;
  const entry = createReplay({
    kind: 'reference',
    referenceId: e.id,
    title: e.title,
    parameters,
    results: [replayResult(e.id, value)],
  });
  assert.equal(entry.parameters.encounterRegion, 'kergus');
  assert.equal(copyReplay(entry), copyReferenceReading(value));
});
test('Five-card and conditional sixth-card replay preserve order/derived output and never contain or consume the active deck', () => {
  for (const input of ['Q♣ 10♥ 2♣ A♦ 7♠', 'Q♣ 10♥ 2♠ A♠ 7♠ K♦']) {
    const value = manualRareMonster(input, registry);
    const active = structuredClone(value.rareMonster!.remaining),
      before = JSON.stringify(active);
    const entry = createReplay({
      kind: 'reference',
      referenceId: 'procedure:depths.rare-monster',
      title: value.title,
      parameters: { ...parameters, rareDeck: active } as typeof parameters,
      results: [replayResult('procedure:depths.rare-monster', value)],
    });
    assert.equal(entry.results[0].cards?.length, input.split(' ').length);
    assert.deepEqual(entry.results[0].cards, value.rareMonster!.cards);
    assert.deepEqual(
      entry.results[0].cardComponents,
      value.rareMonster!.components,
    );
    assert.equal(copyReplay(entry), copyReferenceReading(value));
    assert.equal(JSON.stringify(active), before);
    assert.ok(!JSON.stringify(entry).includes('rareDeck'));
    assert.ok(!JSON.stringify(entry).includes('remaining'));
  }
});
test('Repeated identical results are separate events; only ten are retained', () => {
  let entries: ReturnType<typeof replay>[] = [];
  for (let i = 0; i < 15; i++) entries = appendReplay(entries, replay());
  assert.equal(entries.length, 10);
  assert.equal(new Set(entries.map((r) => r.id)).size, 10);
  assert.ok(
    entries.every((r) => copyReplay(r) === copyReferenceReading(reading)),
  );
});
test('Missing canonical source preserves visible result and exposes UNAVAILABLE', () => {
  const entry = replay();
  const blank = { entries: [], byId: {} } as typeof index;
  const refs = replaySources(entry.results[0], blank, {
    books: [],
    tables: [],
    procedures: [],
  });
  assert.ok(refs.every((r) => r.status === 'UNAVAILABLE'));
  assert.equal(copyReplay(entry), copyReferenceReading(reading));
});
test('Dataset changes update citation lookup without reinterpreting the stored text or dice', () => {
  const entry = replay(),
    changed = structuredClone(registry),
    table = changed.tables.find((t) => t.id === 'core.reaction')!;
  table.entries.forEach((e) => (e.text = 'CHANGED DATASET'));
  table.sourcePage = 999;
  const refs = replaySources(entry.results[0], index, changed);
  assert.equal(refs[0].pdfPage, 999);
  assert.equal(copyReplay(entry), copyReferenceReading(reading));
  assert.ok(!JSON.stringify(entry).includes('CHANGED DATASET'));
});
test('Session round trip preserves contexts, physical/cards/parameters and rejects malformed snapshots', () => {
  const store = storage(),
    value = {
      ...emptyPlayMemory(),
      contexts: [{ kind: 'desk' as const }],
      replays: [replay()],
    };
  writePlayMemory(value, store);
  assert.deepEqual(readPlayMemory(store), JSON.parse(JSON.stringify(value)));
  const corrupt = structuredClone(value);
  (corrupt.replays[0].results[0].reading.blocks as unknown) = null;
  store.setItem(PLAY_MEMORY_KEY, JSON.stringify(corrupt));
  assert.equal(readPlayMemory(store).replays.length, 0);
  assert.equal(readPlayMemory(store).contexts.length, 1);
  store.setItem(PLAY_MEMORY_KEY, 'not json');
  assert.deepEqual(readPlayMemory(store), emptyPlayMemory());
});
test('Temporary clear is isolated from Campaign export, Pins, Recipes, Packs, Tray, Scratch and Last', () => {
  const store = storage(),
    { save } = fixture(),
    before = JSON.stringify(save);
  for (const k of [
    'campaign',
    'pins',
    'recipes',
    'packs',
    'tray',
    'scratch',
    'last',
  ])
    store.setItem(k, 'unchanged');
  writePlayMemory({ ...emptyPlayMemory(), replays: [replay()] }, store);
  writePlayMemory(emptyPlayMemory(), store);
  assert.equal(JSON.stringify(save), before);
  assert.ok(!before.includes('replays'));
  for (const k of [
    'campaign',
    'pins',
    'recipes',
    'packs',
    'tray',
    'scratch',
    'last',
  ])
    assert.equal(store.getItem(k), 'unchanged');
});
test('PLAY replay navigation survives reload while older navigation entries remain valid', () => {
  const old = emptyReferenceLocation();
  assert.deepEqual(normalizeReferenceLocation(old), old);
  const location = {
    ...old,
    panel: 'replay' as const,
    replayId: 'snapshot-id',
  };
  assert.deepEqual(normalizeReferenceLocation(location), location);
});

test('Mixed partial rerolls retain each component’s physical/digital origin', () => {
  const physical = manualTableReading(
    pair,
    independentTables(pair, registry),
    { '0': '14', '1': '32' },
    registry,
  );
  const mixed = rerollHeldReference(pair, physical, ['0'], options, '1');
  const snapshot = replayResult(pair.id, mixed);
  assert.equal(snapshot.mode, 'MIXED');
  assert.equal(snapshot.rolls[0].origin, 'USER_ROLL');
  assert.equal(snapshot.rolls[0].roll, 14);
  assert.equal(snapshot.rolls[1].origin, 'APP_ROLL');
});
test('A retired entry inside an existing table warns without replacing its historical effect', () => {
  const entry = replay(),
    changed = structuredClone(registry);
  const ids = entry.results[0].reading.sourceRefs.map((r) => r.entryId);
  const table = changed.tables.find((t) => t.id === 'core.reaction')!;
  table.entries = table.entries.filter((e) => !ids.includes(e.id));
  assert.ok(
    replaySources(entry.results[0], index, changed).some(
      (r) => r.status === 'UNAVAILABLE',
    ),
  );
  assert.equal(copyReplay(entry), copyReferenceReading(reading));
});
test('Replay shows used parameters only: Reaction has none, Encounter Level retains its chosen region', () => {
  assert.deepEqual(replayParameterLines(replay(), index), []);
  const entry = replay();
  entry.results[0].referenceId = 'procedure:depths.encounter-level';
  assert.deepEqual(replayParameterLines(entry, index), [
    ['Encounter region · 지역', 'kergus'],
  ]);
});
test('Live crawl context uses the current Room, not a stale editor selection', () => {
  const { save, c, d } = fixture();
  d.crawl = {
    phase: 'room',
    specialRoomIds: [],
    discoveredSpecialIds: [],
    visitedRoomIds: [d.rooms[1].id],
    currentRoomId: d.rooms[1].id,
    threatRating: 9,
  };
  c.workspace.dungeonTab = 'crawl';
  c.workspace.roomId = d.rooms[0].id;
  const result = currentPlayContext(save, { ...homePage, oracleOpen: false })!;
  assert.equal(result.kind, 'room');
  assert.equal(result.objectId, d.rooms[1].id);
  d.crawl.currentRoomId = null;
  assert.equal(
    currentPlayContext(save, { ...homePage, oracleOpen: false })!.kind,
    'dungeon',
  );
});
