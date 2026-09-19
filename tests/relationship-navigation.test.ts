import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement, isValidElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import {
  buildReferenceRegistry,
  findReferenceCreature,
  relatedReferences,
  searchReferences,
} from '../src/domain/references.ts';
import { executeReference } from '../src/domain/referenceExecution.ts';
import { fixedReferenceReading } from '../src/domain/referenceFixedLookup.ts';
import {
  getReferenceRelationships,
  relatedReferenceRelationships,
} from '../src/domain/referenceRelationships.ts';
import { inlineSourceSubtable } from '../src/domain/inlineSourceSubtable.ts';
import {
  manualTableReading,
  manualRareMonster,
  parsePhysicalCards,
  physicalOracleRoll,
} from '../src/domain/manualReferenceRoll.ts';
import { cityCrawlMoveReading } from '../src/domain/cityCrawlWorkspace.ts';
import { rollCityMove } from '../src/domain/cityProcedures.ts';
import { oracleFollowUpLinks } from '../src/domain/referenceReading.ts';
import {
  emptyReferenceSession,
  retainReferenceReading,
  restoreReferenceRoll,
} from '../src/domain/referenceSession.ts';
import {
  emptyReferenceLocation,
  normalizeReferenceLocation,
  referenceLocationKey,
} from '../src/navigation/referenceLocation.ts';
import {
  rollOracle,
  selectOracleEntry,
} from '../src/generators/oracleRoller.ts';
import { loadMonsterPreset } from '../src/generators/monster.ts';
import { setRules, getRules } from '../src/storage/rulesStore.ts';
import { setOraclePack, getOraclePack } from '../src/storage/oracleStore.ts';
import {
  readReferencePreferences,
  writeReferencePreferences,
  toggleReferencePin,
  recentlyUsed,
} from '../src/storage/referencePreferences.ts';
import {
  addToTray,
  emptyPlaySession,
  readPlaySession,
  writePlaySession,
} from '../src/storage/conveniencePreferences.ts';
import { ReferenceNextSteps } from '../src/components/ReferenceNextSteps.tsx';
import { InlineSourceSubtable } from '../src/components/InlineSourceSubtable.tsx';
import { ReadingRelatedReferences } from '../src/components/ReferenceWorkbench.tsx';
import {
  ReferenceContext,
  type DeskContext,
} from '../src/components/ReferenceContext.tsx';

const fixture = JSON.parse(
  readFileSync('outputs/morkborg-private-data.json', 'utf8'),
);
setRules(fixture.library);
setOraclePack(fixture.oracles);
const rules = getRules()!;
const registry = buildOracleRegistry(rules, getOraclePack());
const index = buildReferenceRegistry(registry, rules);
const table = (id: string) => {
  const found = registry.tables.find((candidate) => candidate.id === id);
  assert.ok(found, id);
  return found;
};

/** Dice use getRandomValues; randomUUID creates identities, never outcomes. */
function forbidDiceRng(t: TestContext) {
  return t.mock.method(globalThis.crypto, 'getRandomValues', () => {
    throw new Error('Reading a relationship must not consume dice RNG');
  });
}

const readingOnlyContext: DeskContext = {
  entries: index.entries,
  byId: index.byId,
  activate: () => {
    throw new Error('Rendering a relationship must not activate its target');
  },
  openSearch: () => {},
  search: (query) => searchReferences(index, query),
  contextual: () => [],
  pinnedIds: [],
  recentIds: [],
  touch: () => {},
  togglePin: () => {},
};

test('Reading canonical relationships and source rows never consumes dice RNG or changes source data', (t) => {
  const before = JSON.stringify(registry);
  const rng = forbidDiceRng(t);
  for (const reference of index.entries) {
    for (const target of relatedReferences(index, reference.id))
      assert.ok(index.byId[target.id]);
  }
  for (const source of registry.tables) {
    for (const entry of source.entries) {
      const links = oracleFollowUpLinks(entry.metadata, source.id);
      for (const id of links.relatedIds ?? []) assert.ok(index.byId[id], id);
      for (const lookup of links.fixedLookups ?? [])
        assert.ok(selectOracleEntry(table(lookup.oracleId), lookup.roll));
      inlineSourceSubtable(source, entry);
    }
  }
  assert.equal(rng.mock.callCount(), 0);
  assert.equal(JSON.stringify(registry), before);
});

test('Derived USES and USED BY inspection is cached, read-only and consumes zero dice RNG', (t) => {
  const before = JSON.stringify({ registry, references: index.entries });
  const rng = forbidDiceRng(t);
  const relationships = getReferenceRelationships(index, registry);
  assert.equal(getReferenceRelationships(index, registry), relationships);
  for (const reference of index.entries)
    for (const relationship of relatedReferenceRelationships(
      index,
      relationships,
      reference.id,
    ))
      assert.ok(index.byId[relationship.entry.id]);
  const rooms = relatedReferenceRelationships(
    index,
    relationships,
    'oracle:core.rooms',
  );
  assert.ok(
    rooms.some(
      (relationship) =>
        relationship.kind === 'USED BY' &&
        relationship.entry.id === 'procedure:sd.dungeon-preparation',
    ),
  );
  assert.equal(JSON.stringify({ registry, references: index.entries }), before);
  assert.equal(rng.mock.callCount(), 0);
});

test('All canonical creature references materialize their printed data with zero dice RNG', (t) => {
  const rng = forbidDiceRng(t);
  const creatures = index.entries.filter(
    (entry) => entry.action?.kind === 'creature',
  );
  assert.equal(creatures.length, 95);
  for (const entry of creatures) {
    const reading = executeReference(entry, {
      registry,
      rules,
      region: 'sarkash',
      stockKind: 'common',
      stockDR: 10,
      cityLarge: false,
      cityExits: false,
      rng: () => {
        throw new Error(`Creature inspection unexpectedly rolled: ${entry.id}`);
      },
    });
    assert.ok(reading?.blocks.length, entry.id);
    assert.equal(reading.oracle, undefined, entry.id);
  }
  assert.equal(rng.mock.callCount(), 0);
});

test('Physical outcomes consume only entered faces, including both d66 input forms', (t) => {
  const rng = forbidDiceRng(t);
  for (const [id, input, roll, faces] of [
    ['core.corpsePlundering', '55', 55, [5, 5]],
    ['core.corpsePlundering', '5,5', 55, [5, 5]],
    ['reclvse.npcAppearance', '97', 97, [97]],
    ['core.rooms', '3,5', 35, [3, 5]],
    ['core.reaction', '3,4', 7, [3, 4]],
  ] as const) {
    const source = table(id);
    const result = physicalOracleRoll(source, input, registry);
    assert.equal(result.roll, roll);
    assert.deepEqual(result.diceValues, faces);
    assert.equal(result.entryId, selectOracleEntry(source, roll)!.id);
  }
  assert.equal(rng.mock.callCount(), 0);
});

test('Zukuma reference shows its four printed weapon choices while explicit preset generation still selects one', (t) => {
  const reference = index.byId['creature:core:59:zukuma'];
  assert.equal(reference.action?.kind, 'creature');
  const record = findReferenceCreature(
    rules,
    reference.action!.kind === 'creature' ? reference.action!.creatureId : '',
  )!;
  const before = JSON.stringify(record);
  const rng = t.mock.method(
    globalThis.crypto,
    'getRandomValues',
    (values: Uint32Array) => {
      values.fill(0);
      return values;
    },
  );
  const printed = loadMonsterPreset('test-read', record, {
    attackTable: 'reference',
  });
  assert.equal(rng.mock.callCount(), 0);
  assert.deepEqual(
    printed.attacks.map((attack) => attack.name),
    [
      'd4 · 1 · Long flail',
      'd4 · 2 · Heavy mace',
      'd4 · 3 · Chained sword',
      'd4 · 4 · Huge warhammer',
    ],
  );
  assert.deepEqual(
    printed.attacks.map((attack) => attack.damage),
    ['d8', 'd6', 'd6', 'd10'],
  );
  for (const attack of printed.attacks)
    for (const provenance of Object.values(attack.fieldProvenance ?? {}))
      assert.equal(provenance.rolls?.length ?? 0, 0);
  const generated = loadMonsterPreset('test-generate', record);
  assert.equal(rng.mock.callCount(), 1);
  assert.equal(generated.attacks.length, 1);
  assert.equal(generated.attacks[0].name, 'Long flail');
  assert.equal(generated.attacks[0].fieldProvenance!.name.rolls![0].value, 1);
  assert.equal(JSON.stringify(record), before);
});

test('Actual row context is replaced: Stash 5 has one aliased NPC target, Stash 1 has none', (t) => {
  const rng = forbidDiceRng(t);
  const source = table('aitc.stash-weak');
  const reference = index.byId[`oracle:${source.id}`];
  const first = manualTableReading(reference, [source], { '0': '5' }, registry);
  let state = retainReferenceReading(
    emptyReferenceSession(),
    reference.id,
    first,
  );
  assert.equal(
    new Set(first.relatedIds!.map((id) => index.byId[id].id)).size,
    1,
  );
  const second = manualTableReading(
    reference,
    [source],
    { '0': '1' },
    registry,
  );
  state = retainReferenceReading(state, reference.id, second);
  assert.equal(state.readings[reference.id].oracle!.rolls[0].roll, 1);
  assert.deepEqual(state.readings[reference.id].relatedIds, []);
  assert.deepEqual(state.readings[reference.id].fixedLookups, []);
  const rendered = [first, second].map((reading) =>
    renderToStaticMarkup(
      createElement(
        ReferenceContext.Provider,
        { value: readingOnlyContext },
        createElement(ReferenceNextSteps, {
          metadata: reading.oracle!.rolls[0].metadata,
          tableId: source.id,
        }),
      ),
    ),
  );
  assert.equal((rendered[0].match(/<button/g) ?? []).length, 1);
  assert.equal(rendered[1], '');
  assert.equal(rng.mock.callCount(), 0);
});

test('A Workbench row keeps its source identity when its target is also the current page', (t) => {
  const rng = forbidDiceRng(t);
  const source = table('aitc.stash-weak');
  const npc = index.byId['oracle:sd.npc.disposition'];
  const row = selectOracleEntry(source, 5)!;
  const html = renderToStaticMarkup(
    createElement(
      ReferenceContext.Provider,
      { value: { ...readingOnlyContext, selectedId: npc.id } },
      createElement(ReferenceNextSteps, {
        metadata: row.metadata,
        tableId: source.id,
      }),
    ),
  );
  assert.equal((html.match(/<button/g) ?? []).length, 1);
  assert.ok(html.includes(`data-relationship-target="${npc.id}"`));
  assert.match(html, /data-relationship-kind="FOLLOW-UP"/);
  assert.equal(rng.mock.callCount(), 0);
});

test('Rare Monster keeps its existing Reaction and Morale reading shortcuts without invented source labels', (t) => {
  const rng = forbidDiceRng(t);
  const input = 'A♣ 2♦ 3♥ 4♣ 5♦';
  const reading = manualRareMonster(input, registry, parsePhysicalCards(input));
  assert.equal(reading.oracle, undefined);
  const context = {
    ...readingOnlyContext,
    selectedId: 'procedure:depths.rare-monster',
  };
  const html = renderToStaticMarkup(
    createElement(
      ReferenceContext.Provider,
      { value: context },
      createElement(ReadingRelatedReferences, { reading }),
    ),
  );
  assert.equal((html.match(/<button/g) ?? []).length, 2);
  for (const id of ['rule:core.reaction-morale', 'oracle:core.reaction'])
    assert.ok(html.includes(`data-relationship-target="${id}"`));
  assert.doesNotMatch(html, /relationship-label|data-relationship-kind/);
  assert.equal(rng.mock.callCount(), 0);
});

test('Non-oracle City readings retain contextual aliases once and suppress destinations already shown globally', (t) => {
  const rng = forbidDiceRng(t);
  const dice = [0, 0.999, 0.999];
  const reading = cityCrawlMoveReading(
    rollCityMove({ move: 'stash', dr: 10, modifier: 0 }, () => dice.shift()!),
    registry,
  );
  assert.equal(reading.oracle, undefined);
  assert.deepEqual(reading.relatedIds, [
    'oracle:sd.npc.disposition',
    'oracle:sd.npc.profession',
  ]);
  const render = (omitIds: string[] = []) =>
    renderToStaticMarkup(
      createElement(
        ReferenceContext.Provider,
        { value: readingOnlyContext },
        createElement(ReadingRelatedReferences, { reading, omitIds }),
      ),
    );
  const html = render();
  assert.equal((html.match(/<button/g) ?? []).length, 1);
  assert.doesNotMatch(html, /relationship-label|data-relationship-kind/);
  assert.equal(render(['oracle:sd.npc.profession']), '');
  assert.equal(rng.mock.callCount(), 0);
});

test('Oracle readings cannot promote their exact row relationships into generic reading links', (t) => {
  const rng = forbidDiceRng(t);
  const source = table('aitc.stash-weak');
  const reading = manualTableReading(
    index.byId[`oracle:${source.id}`],
    [source],
    { '0': '5' },
    registry,
  );
  assert.ok(reading.relatedIds!.length);
  const html = renderToStaticMarkup(
    createElement(
      ReferenceContext.Provider,
      { value: readingOnlyContext },
      createElement(ReadingRelatedReferences, { reading }),
    ),
  );
  assert.equal(html, '');
  assert.equal(rng.mock.callCount(), 0);
});

test('Non-oracle reading shortcuts defer to the exact source LOOKUP rather than duplicate its target', (t) => {
  const rng = forbidDiceRng(t);
  const reading = fixedReferenceReading(registry, {
    oracleId: 'aitc.riot-complication',
    roll: 1,
  });
  assert.deepEqual(reading.relatedIds, ['oracle:aitc.npc-encounters']);
  assert.deepEqual(reading.fixedLookups, [
    { oracleId: 'aitc.npc-encounters', roll: 12 },
  ]);
  const html = renderToStaticMarkup(
    createElement(
      ReferenceContext.Provider,
      { value: readingOnlyContext },
      createElement(ReadingRelatedReferences, { reading }),
    ),
  );
  assert.equal(html, '');
  const lookup = renderToStaticMarkup(
    createElement(
      ReferenceContext.Provider,
      { value: readingOnlyContext },
      createElement(ReferenceNextSteps, { lookups: reading.fixedLookups }),
    ),
  );
  assert.equal((lookup.match(/<button/g) ?? []).length, 1);
  assert.match(lookup, /#12/);
  assert.equal(rng.mock.callCount(), 0);
});

test('Canonical relationship buttons invoke open-only callbacks and retain exact fixed selectors', (t) => {
  const rng = forbidDiceRng(t);
  const opened: unknown[][] = [];
  const lookedUp: { oracleId: string; roll: number }[] = [];
  const context: DeskContext = {
    ...readingOnlyContext,
    activate: (...args) => {
      opened.push(args);
    },
    openLookup: (lookup) => {
      lookedUp.push(lookup);
    },
    perform: () => {
      throw new Error('A relationship cannot perform a roll');
    },
  };
  // This is a component-handler unit check, not a browser click test. Calling
  // the hook-bearing component inside SSR keeps its actual context and returns
  // the actual button callbacks without adding a separate DOM test runtime.
  function invokeButtons(node: ReactNode) {
    if (Array.isArray(node)) return node.forEach(invokeButtons);
    if (!isValidElement(node)) return;
    const props = node.props as { children?: ReactNode; onClick?: () => void };
    if (node.type === 'button') props.onClick!();
    else invokeButtons(props.children);
  }
  function ActivateLinks({ id, selector }: { id: string; selector: number }) {
    const source = table(id);
    const row = selectOracleEntry(source, selector)!;
    const rendered = ReferenceNextSteps({
      metadata: row.metadata,
      tableId: source.id,
    });
    assert.ok(rendered);
    invokeButtons(rendered);
    return rendered;
  }
  const render = (id: string, selector: number) =>
    renderToStaticMarkup(
      createElement(
        ReferenceContext.Provider,
        { value: context },
        createElement(ActivateLinks, { id, selector }),
      ),
    );
  const followUp = render('aitc.stash-weak', 5);
  assert.deepEqual(opened, [[index.byId['oracle:sd.npc.disposition'].id]]);
  assert.equal(lookedUp.length, 0);
  assert.match(followUp, /data-relationship-kind="FOLLOW-UP"/);
  const fixed = render('aitc.civic-buildings', 2);
  assert.deepEqual(lookedUp, [{ oracleId: 'aitc.npc-encounters', roll: 54 }]);
  assert.match(fixed, /data-relationship-kind="LOOKUP"/);
  assert.match(fixed, /#54/);
  const subtable = render('core.gearA', 5);
  assert.deepEqual(opened.at(-1), ['oracle:core.unclean']);
  assert.match(subtable, /data-relationship-kind="SUBTABLE"/);
  assert.equal(rng.mock.callCount(), 0);
});

test('Core inline disclosure has no result until explicit child input; child resolution leaves its parent intact', (t) => {
  const rng = forbidDiceRng(t);
  const source = table('core.rooms');
  const entry = selectOracleEntry(source, 11)!;
  const parent = physicalOracleRoll(source, '1,1', registry);
  const before = JSON.stringify(parent);
  const child = inlineSourceSubtable(source, entry)!;
  const html = renderToStaticMarkup(
    createElement(
      ReferenceContext.Provider,
      { value: readingOnlyContext },
      createElement(InlineSourceSubtable, { table: source, entry }),
    ),
  );
  assert.match(html, /조건부 추가 표/);
  assert.doesNotMatch(html, /<output|current-table-result/);
  const result = physicalOracleRoll(child, '3', registry);
  assert.equal(result.text, 'Hypnotic');
  assert.equal(result.entryId, `${entry.id}/followup:3-3`);
  assert.equal(JSON.stringify(parent), before);
  assert.equal(rng.mock.callCount(), 0);
});

test('Digital parent and child rolls consume their own dice only when explicitly called', () => {
  let calls = 0;
  const rng = () => {
    calls++;
    return 0;
  };
  const source = table('core.rooms');
  const parent = rollOracle(source, registry, rng);
  assert.equal(parent.roll, 11);
  assert.equal(calls, 2);
  const child = inlineSourceSubtable(source, selectOracleEntry(source, 11)!)!;
  assert.equal(calls, 2);
  rollOracle(child, registry, rng);
  assert.equal(calls, 3);
  assert.equal(parent.roll, 11);
});

test('All five existing fixedLookups metadata records retain their exact canonical target and row without dice RNG', (t) => {
  const rng = forbidDiceRng(t);
  const lookups = registry.tables.flatMap((source) =>
    source.entries
      .filter((entry) => Array.isArray(entry.metadata?.fixedLookups))
      .flatMap(
        (entry) =>
          oracleFollowUpLinks(entry.metadata, source.id).fixedLookups ?? [],
      ),
  );
  assert.equal(lookups.length, 5);
  assert.deepEqual(
    lookups.slice(0, 4),
    Array.from({ length: 4 }, () => ({
      oracleId: 'aitc.npc-encounters',
      roll: 54,
    })),
  );
  assert.deepEqual(lookups[4], { oracleId: 'aitc.taverns', roll: 3 });
  for (const lookup of lookups) {
    const source = table(lookup.oracleId);
    const result = selectOracleEntry(source, lookup.roll)!;
    assert.ok(result);
    assert.ok(result.min <= lookup.roll && result.max >= lookup.roll);
    assert.equal(
      index.byId[`oracle:${lookup.oracleId}`].canonicalIds.includes(source.id),
      true,
    );
  }
  assert.equal(rng.mock.callCount(), 0);
});

test('Related navigation locations and Recent restoration preserve the original physical reading with zero dice RNG', (t) => {
  const rng = forbidDiceRng(t);
  const source = table('core.reaction');
  const reference = index.byId['oracle:core.reaction'];
  const original = manualTableReading(
    reference,
    [source],
    { '0': '3,4' },
    registry,
  );
  let state = retainReferenceReading(
    emptyReferenceSession(),
    reference.id,
    original,
  );
  const sequence = state.sequence;
  const related = relatedReferences(index, reference.id);
  assert.ok(related.some((entry) => entry.id === 'rule:core.reaction-morale'));
  for (const selectedId of [related[0].id, reference.id]) {
    const location = normalizeReferenceLocation({
      ...emptyReferenceLocation(),
      selectedId,
      trail: [reference.id],
      tableView: true,
    });
    assert.equal(referenceLocationKey(location).selectedId, selectedId);
    assert.deepEqual(state.readings[reference.id], original);
  }
  state = retainReferenceReading(
    state,
    reference.id,
    manualTableReading(reference, [source], { '0': '1,1' }, registry),
  );
  const restored = restoreReferenceRoll(state, sequence);
  assert.deepEqual(restored.readings[reference.id], original);
  assert.equal(
    restored.readings[reference.id].oracle!.rolls[0].text,
    'Indifferent',
  );
  assert.deepEqual(restored.rolls, state.rolls);
  assert.equal(rng.mock.callCount(), 0);
});

test('Pins, Recent and Workbench preference round trips keep canonical navigation targets without campaign or RNG writes', (t) => {
  const rng = forbidDiceRng(t);
  const values = new Map([
    ['morkborg-codex:v6', 'existing campaign and dungeon data'],
  ]);
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  const source = table('core.rooms');
  const reference = index.byId['oracle:core.rooms'];
  const original = manualTableReading(
    reference,
    [source],
    { '0': '1,1' },
    registry,
  );
  const retained = retainReferenceReading(
    emptyReferenceSession(),
    reference.id,
    original,
  );
  let prefs = toggleReferencePin(
    readReferencePreferences(storage),
    reference.id,
  );
  prefs = recentlyUsed(
    recentlyUsed(prefs, 'rule:core.reaction-morale'),
    reference.id,
  );
  writeReferencePreferences(prefs, storage);
  const tray = addToTray(
    addToTray(emptyPlaySession(), reference.id),
    reference.id,
  );
  writePlaySession(tray, storage);
  assert.deepEqual(readReferencePreferences(storage), prefs);
  assert.deepEqual(readPlaySession(storage), tray);
  for (const id of [
    ...readReferencePreferences(storage).pinnedIds,
    ...readReferencePreferences(storage).recentIds,
    ...readPlaySession(storage).tray,
  ])
    assert.ok(index.byId[id]);
  assert.deepEqual(
    retained.readings[readPlaySession(storage).tray[0]],
    original,
  );
  assert.equal(
    values.get('morkborg-codex:v6'),
    'existing campaign and dungeon data',
  );
  assert.equal(readPlaySession(storage).lastRoll, null);
  assert.equal(rng.mock.callCount(), 0);
});
