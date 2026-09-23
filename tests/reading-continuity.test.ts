import test, { type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReferenceTable } from '../src/components/ReferenceTable.tsx';
import {
  ReferenceContext,
  type DeskContext,
} from '../src/components/ReferenceContext.tsx';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { buildReferenceRegistry } from '../src/domain/references.ts';
import { setRules, getRules } from '../src/storage/rulesStore.ts';
import { setOraclePack, getOraclePack } from '../src/storage/oracleStore.ts';
import { inlineSourceSubtable } from '../src/domain/inlineSourceSubtable.ts';
import {
  createInlineChildResults,
  retainInlineChild,
  copyReadingWithInlineChildren,
} from '../src/domain/inlineReadingContinuity.ts';
import {
  physicalOracleRoll,
  manualTableReading,
} from '../src/domain/manualReferenceRoll.ts';
import {
  rollOracle,
  selectOracleEntry,
} from '../src/generators/oracleRoller.ts';
import { executeReference } from '../src/domain/referenceExecution.ts';
import { fixedReferenceReading } from '../src/domain/referenceFixedLookup.ts';
import {
  copyReferenceReading,
  type ReferenceReading,
} from '../src/domain/referenceReading.ts';
import {
  emptyReferenceSession,
  retainReferenceReading,
} from '../src/domain/referenceSession.ts';
import { resolveRowRelationships } from '../src/domain/rowRelationships.ts';
import {
  getReferenceRelationships,
  relatedReferenceRelationships,
} from '../src/domain/referenceRelationships.ts';
import {
  readReferencePreferences,
  recentlyUsed,
  toggleReferencePin,
  writeReferencePreferences,
  REFERENCE_PREFERENCES_KEY,
} from '../src/storage/referencePreferences.ts';
import {
  addToTray,
  emptyPlaySession,
  readPlaySession,
  writePlaySession,
  PLAY_SESSION_KEY,
} from '../src/storage/conveniencePreferences.ts';

const fixture = JSON.parse(
  readFileSync('outputs/morkborg-private-data.json', 'utf8'),
);
setRules(fixture.library);
setOraclePack(fixture.oracles);
const rules = getRules()!;
const registry = buildOracleRegistry(rules, getOraclePack());
const index = buildReferenceRegistry(registry, rules);
const table = (id: string) => {
  const value = registry.tables.find((candidate) => candidate.id === id);
  assert.ok(value, id);
  return value;
};
function physicalParent(id = 'core.rooms', input = '1,1') {
  return manualTableReading(
    index.byId[`oracle:${id}`],
    [table(id)],
    { '0': input },
    registry,
  );
}
function childFor(reading: ReferenceReading, input = '3') {
  const parent = reading.oracle!.rolls[0];
  const source = table(parent.oracleId);
  const entry = source.entries.find(
    (candidate) => candidate.id === parent.entryId,
  )!;
  const childTable = inlineSourceSubtable(source, entry);
  assert.ok(childTable);
  return physicalOracleRoll(childTable, input, registry);
}
function forbidDice(t: TestContext) {
  return t.mock.method(globalThis.crypto, 'getRandomValues', () => {
    throw new Error(
      'Continuity, physical input and Copy must not consume dice RNG',
    );
  });
}
function memoryStorage() {
  const values = new Map<string, string>([
    ['morkborg-codex:v6', 'unchanged campaign and dungeon data'],
  ]);
  return {
    values,
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

for (const [id, parentInput, childInput, sourcePage] of [
  ['core.status', '3', '2', 71],
  ['core.danger', '1', '4', 72],
  ['core.rooms', '1,1', '3', 73],
  ['core.rooms', '3,3', '4', 74],
  ['core.rooms', '4,3', '4', 74],
] as const) {
  test(`Explicit canonical inline ${id} ${parentInput} → ${childInput} retains its original row and provenance`, (t) => {
    const rng = forbidDice(t);
    const reading = physicalParent(id, parentInput);
    const parent = reading.oracle!.rolls[0];
    const child = childFor(reading, childInput);
    const results = createInlineChildResults();
    assert.equal(results.get(parent), undefined);
    assert.equal(retainInlineChild(results, parent, child), true);
    assert.equal(results.get(parent), child);
    assert.equal(child.metadata?.parentEntryId, parent.entryId);
    assert.equal(child.metadata?.provenance?.sourceRefs[0].pdfPage, sourcePage);
    assert.equal(child.metadata?.provenance?.sourceRefs[0].tableId, id);
    assert.equal(
      child.entryId,
      selectOracleEntry(
        inlineSourceSubtable(
          table(id),
          table(id).entries.find((row) => row.id === parent.entryId)!,
        )!,
        child.roll,
      )!.id,
    );
    assert.equal(rng.mock.callCount(), 0);
  });
}

test('Digital parent and child use the existing dice engine and retain the same semantics as physical input', (t) => {
  const globalRng = forbidDice(t);
  let parentCalls = 0;
  const digital = executeReference(index.byId['oracle:core.rooms'], {
    registry,
    rules,
    region: 'sarkash',
    stockKind: 'common',
    stockDR: 10,
    cityLarge: false,
    cityExits: false,
    rng: () => {
      parentCalls++;
      return 0;
    },
  })!;
  assert.equal(parentCalls, 2);
  const parent = digital.oracle!.rolls[0];
  assert.equal(parent.roll, 11);
  const childTable = inlineSourceSubtable(
    table('core.rooms'),
    selectOracleEntry(table('core.rooms'), 11)!,
  )!;
  let childCalls = 0;
  const digitalChild = rollOracle(childTable, registry, () => {
    childCalls++;
    return 0.4;
  });
  assert.equal(childCalls, 1);
  const physical = physicalParent();
  const physicalChild = childFor(physical);
  const results = createInlineChildResults();
  assert.equal(retainInlineChild(results, parent, digitalChild), true);
  assert.equal(
    retainInlineChild(results, physical.oracle!.rolls[0], physicalChild),
    true,
  );
  assert.equal(digitalChild.text, 'Hypnotic');
  assert.equal(digitalChild.entryId, physicalChild.entryId);
  assert.equal(
    copyReadingWithInlineChildren(digital, results),
    copyReadingWithInlineChildren(physical, results),
  );
  assert.equal(globalRng.mock.callCount(), 0);
});

test('Latest-reading Recent return retains the exact parent and its explicitly obtained child without adding roll history', (t) => {
  const rng = forbidDice(t);
  const reading = physicalParent();
  const parent = reading.oracle!.rolls[0];
  const child = childFor(reading);
  const results = createInlineChildResults();
  retainInlineChild(results, parent, child);
  let state = retainReferenceReading(
    emptyReferenceSession(),
    'oracle:core.rooms',
    reading,
    false,
  );
  state = retainReferenceReading(
    state,
    'oracle:core.reaction',
    physicalParent('core.reaction', '3,4'),
    false,
  );
  let prefs = recentlyUsed(
    readReferencePreferences(memoryStorage()),
    'oracle:core.rooms',
  );
  prefs = recentlyUsed(prefs, 'oracle:core.reaction');
  const restored =
    state.readings[prefs.recentIds.find((id) => id === 'oracle:core.rooms')!];
  assert.equal(restored, reading);
  assert.equal(restored.oracle!.rolls[0], parent);
  assert.equal(results.get(restored.oracle!.rolls[0]), child);
  assert.deepEqual(state.rolls, []);
  assert.match(copyReadingWithInlineChildren(restored, results), /Hypnotic/);
  assert.equal(rng.mock.callCount(), 0);
});

test('New physical parent 35 excludes the previous 11 child from the current reading and Copy', () => {
  const original = physicalParent();
  const results = createInlineChildResults();
  retainInlineChild(results, original.oracle!.rolls[0], childFor(original));
  const replacement = physicalParent('core.rooms', '3,5');
  const state = retainReferenceReading(
    retainReferenceReading(
      emptyReferenceSession(),
      'oracle:core.rooms',
      original,
      false,
    ),
    'oracle:core.rooms',
    replacement,
    false,
  );
  const current = state.readings['oracle:core.rooms'];
  assert.equal(current.oracle!.rolls[0].roll, 35);
  assert.equal(results.get(current.oracle!.rolls[0]), undefined);
  assert.match(
    copyReadingWithInlineChildren(current, results),
    /Mirrors everywhere/,
  );
  assert.doesNotMatch(
    copyReadingWithInlineChildren(current, results),
    /Hypnotic|Inscriptions/,
  );
  assert.deepEqual(state.rolls, []);
});

test('An explicit same-selector parent lookup is a new reading rather than reusing an old child', () => {
  const original = physicalParent();
  const replacement = physicalParent();
  const results = createInlineChildResults();
  retainInlineChild(results, original.oracle!.rolls[0], childFor(original));
  assert.equal(
    original.oracle!.rolls[0].entryId,
    replacement.oracle!.rolls[0].entryId,
  );
  assert.notEqual(original.oracle!.rolls[0], replacement.oracle!.rolls[0]);
  assert.equal(results.get(replacement.oracle!.rolls[0]), undefined);
  assert.equal(
    copyReadingWithInlineChildren(replacement, results),
    copyReferenceReading(replacement),
  );
});

test('A new digital parent operation invalidates its old child even when both operations resolve 11', () => {
  const options = {
    registry,
    rules,
    region: 'sarkash' as const,
    stockKind: 'common' as const,
    stockDR: 10,
    cityLarge: false,
    cityExits: false,
    rng: () => 0,
  };
  const original = executeReference(index.byId['oracle:core.rooms'], options)!;
  const results = createInlineChildResults();
  retainInlineChild(results, original.oracle!.rolls[0], childFor(original));
  const replacement = executeReference(
    index.byId['oracle:core.rooms'],
    options,
  )!;
  assert.equal(replacement.oracle!.rolls[0].roll, 11);
  assert.equal(results.get(replacement.oracle!.rolls[0]), undefined);
  assert.doesNotMatch(
    copyReadingWithInlineChildren(replacement, results),
    /Hypnotic/,
  );
});

test('Child reroll replaces the current child; composed Copy never accumulates earlier children', () => {
  const reading = physicalParent();
  const results = createInlineChildResults();
  const parent = reading.oracle!.rolls[0];
  const first = childFor(reading, '3');
  const second = childFor(reading, '6');
  retainInlineChild(results, parent, first);
  retainInlineChild(results, parent, second);
  assert.equal(results.get(parent), second);
  assert.equal(second.text, 'Ugly and pointless');
  const text = copyReadingWithInlineChildren(reading, results);
  assert.match(text, /Ugly and pointless/);
  assert.doesNotMatch(text, /Hypnotic/);
  assert.equal(text.split(second.text).length - 1, 1);
});

test('Opening all canonical inline source views obtains no result and Copy remains parent-only', (t) => {
  const rng = forbidDice(t);
  const results = createInlineChildResults();
  const reading = physicalParent();
  let opened = 0;
  for (const source of registry.tables)
    for (const row of source.entries)
      if (inlineSourceSubtable(source, row)) opened++;
  assert.equal(opened, 5);
  assert.equal(results.get(reading.oracle!.rolls[0]), undefined);
  assert.equal(
    copyReadingWithInlineChildren(reading, results),
    copyReferenceReading(reading),
  );
  assert.equal(rng.mock.callCount(), 0);
});

test('Unselected sibling inline rows and different source tables cannot attach to the selected parent', () => {
  const rooms11 = physicalParent();
  const rooms33 = physicalParent('core.rooms', '3,3');
  const danger = physicalParent('core.danger', '1');
  const results = createInlineChildResults();
  const parent = rooms11.oracle!.rolls[0];
  assert.equal(
    retainInlineChild(results, parent, childFor(rooms33, '1')),
    false,
  );
  assert.equal(
    retainInlineChild(results, parent, childFor(danger, '1')),
    false,
  );
  assert.equal(retainInlineChild(results, parent, parent), false);
  assert.equal(results.get(parent), undefined);
});

test('Missing selected parent identity or a non-inline target is not an explicit inline child', () => {
  const reading = physicalParent();
  const parent = reading.oracle!.rolls[0];
  const child = childFor(reading);
  const results = createInlineChildResults();
  assert.equal(
    retainInlineChild(results, { ...parent, entryId: null }, child),
    false,
  );
  assert.equal(
    retainInlineChild(results, parent, { ...child, metadata: undefined }),
    false,
  );
  assert.equal(
    retainInlineChild(
      results,
      parent,
      physicalParent('core.reaction', '3,4').oracle!.rolls[0],
    ),
    false,
  );
  assert.equal(results.get(parent), undefined);
});

test('A fresh provider cache and freshly decoded reading cannot recover child state after reload', () => {
  const reading = physicalParent();
  const results = createInlineChildResults();
  retainInlineChild(results, reading.oracle!.rolls[0], childFor(reading));
  const reloaded = JSON.parse(JSON.stringify(reading)) as ReferenceReading;
  assert.equal(
    createInlineChildResults().get(reading.oracle!.rolls[0]),
    undefined,
  );
  assert.equal(results.get(reloaded.oracle!.rolls[0]), undefined);
  assert.equal(
    copyReadingWithInlineChildren(reloaded, createInlineChildResults()),
    copyReferenceReading(reloaded),
  );
  assert.deepEqual(emptyReferenceSession().readings, {});
});

test('Workbench and Pin remain identity-only bookmarks while same-tab readings retain explicit children', (t) => {
  const rng = forbidDice(t);
  const storage = memoryStorage();
  const reading = physicalParent();
  const results = createInlineChildResults();
  retainInlineChild(results, reading.oracle!.rolls[0], childFor(reading));
  const state = retainReferenceReading(
    emptyReferenceSession(),
    'oracle:core.rooms',
    reading,
    false,
  );
  const prefs = recentlyUsed(
    toggleReferencePin(readReferencePreferences(storage), 'oracle:core.rooms'),
    'oracle:core.rooms',
  );
  writeReferencePreferences(prefs, storage);
  writePlaySession(addToTray(emptyPlaySession(), 'oracle:core.rooms'), storage);
  const restoredPrefs = readReferencePreferences(storage);
  const restoredTray = readPlaySession(storage);
  for (const referenceId of [
    ...restoredPrefs.pinnedIds,
    ...restoredPrefs.recentIds,
    ...restoredTray.tray,
  ]) {
    assert.equal(state.readings[referenceId], reading);
    assert.match(
      copyReadingWithInlineChildren(state.readings[referenceId], results),
      /Hypnotic/,
    );
  }
  assert.deepEqual(JSON.parse(storage.getItem(REFERENCE_PREFERENCES_KEY)!), {
    schemaVersion: 1,
    pinnedIds: ['oracle:core.rooms'],
    recentIds: ['oracle:core.rooms'],
  });
  assert.deepEqual(JSON.parse(storage.getItem(PLAY_SESSION_KEY)!), {
    schemaVersion: 1,
    tray: ['oracle:core.rooms'],
    scratch: '',
    lastRoll: null,
  });
  assert.equal(storage.values.size, 3);
  assert.equal(
    storage.getItem('morkborg-codex:v6'),
    'unchanged campaign and dungeon data',
  );
  assert.doesNotMatch(
    [...storage.values.values()].join('\n'),
    /Hypnotic|followup|Inscriptions/,
  );
  assert.equal(rng.mock.callCount(), 0);
});

test('Twenty-reading cache eviction remains latest-only and never promotes a child to another reference', () => {
  const reading = physicalParent();
  const results = createInlineChildResults();
  retainInlineChild(results, reading.oracle!.rolls[0], childFor(reading));
  let state = retainReferenceReading(
    emptyReferenceSession(),
    'oracle:core.rooms',
    reading,
    false,
  );
  for (const reference of index.entries
    .filter((entry) => entry.id !== 'oracle:core.rooms')
    .slice(0, 20))
    state = retainReferenceReading(
      state,
      reference.id,
      { title: reference.title, blocks: [], sourceRefs: reference.sourceRefs },
      false,
    );
  assert.equal(Object.keys(state.readings).length, 20);
  assert.equal(state.readings['oracle:core.rooms'], undefined);
  assert.deepEqual(state.rolls, []);
  const newReading = physicalParent();
  assert.equal(results.get(newReading.oracle!.rolls[0]), undefined);
});

test('Parent-only Copy preserves the exact existing clipboard grammar and source option', () => {
  const reading = physicalParent();
  const results = createInlineChildResults();
  assert.equal(
    copyReadingWithInlineChildren(reading, results),
    'Sample Rooms\n\nInscriptions, the motifs are',
  );
  assert.equal(
    copyReadingWithInlineChildren(reading, results, true),
    copyReferenceReading(reading, true),
  );
});

test('Composed Copy includes only current human parent and explicit child text without debug or identity data', (t) => {
  const rng = forbidDice(t);
  const reading = physicalParent();
  const before = JSON.stringify(reading);
  const results = createInlineChildResults();
  retainInlineChild(results, reading.oracle!.rolls[0], childFor(reading));
  const text = copyReadingWithInlineChildren(reading, results);
  assert.equal(
    text,
    'Sample Rooms\n\nInscriptions, the motifs are\n\n↳ Hypnotic',
  );
  assert.doesNotMatch(
    text,
    /core\.rooms|parentEntryId|USER_ROLL|APP_ROLL|followup:|timestamp|UUID|\{\s*"/,
  );
  assert.equal(
    copyReferenceReading(reading),
    'Sample Rooms\n\nInscriptions, the motifs are',
  );
  assert.equal(JSON.stringify(reading), before);
  assert.equal(rng.mock.callCount(), 0);
});

test('Composed source Copy preserves existing PDF citation and adds no metadata or separate log', () => {
  const reading = physicalParent();
  const results = createInlineChildResults();
  retainInlineChild(results, reading.oracle!.rolls[0], childFor(reading));
  const plain = copyReadingWithInlineChildren(reading, results);
  const withSource = copyReadingWithInlineChildren(reading, results, true);
  const originalCitation = copyReferenceReading(reading, true).slice(
    copyReferenceReading(reading).length,
  );
  assert.equal(withSource, plain + originalCitation);
  assert.match(withSource, /PDF 73/);
});

test('Fixed LOOKUP produces an independent exact target and does not become a compound child', (t) => {
  const rng = forbidDice(t);
  const civic = physicalParent('aitc.civic-buildings', '2');
  const relationships = resolveRowRelationships(
    index.byId,
    civic.oracle!.rolls[0].metadata,
    'aitc.civic-buildings',
  );
  const lookup = relationships.find((edge) => edge.kind === 'LOOKUP');
  assert.ok(lookup);
  assert.equal(lookup.lookupRoll, 54);
  const fixed = fixedReferenceReading(registry, {
    oracleId: lookup.targetId.replace(/^oracle:/, ''),
    roll: lookup.lookupRoll!,
  });
  const targetTable = table(lookup.targetId.replace(/^oracle:/, ''));
  assert.equal(
    fixed.sourceRefs[0].entryId,
    selectOracleEntry(targetTable, 54)!.id,
  );
  assert.match(fixed.blocks[0].text, /^d4 Guards HP 5/);
  const results = createInlineChildResults();
  const targetRoll = physicalOracleRoll(targetTable, '54', registry);
  assert.equal(
    retainInlineChild(results, civic.oracle!.rolls[0], targetRoll),
    false,
  );
  assert.equal(
    copyReadingWithInlineChildren(fixed, results),
    copyReferenceReading(fixed),
  );
  assert.equal(
    copyReadingWithInlineChildren(civic, results),
    copyReferenceReading(civic),
  );
  assert.equal(rng.mock.callCount(), 0);
});

test('FOLLOW-UP alias dedup, row replacement and reverse Related remain independent from child continuity', (t) => {
  const rng = forbidDice(t);
  const source = table('aitc.stash-weak');
  const stash5 = physicalParent(source.id, '5');
  const stash1 = physicalParent(source.id, '1');
  const links = resolveRowRelationships(
    index.byId,
    stash5.oracle!.rolls[0].metadata,
    source.id,
  );
  assert.equal(links.length, 1);
  assert.equal(links[0].kind, 'FOLLOW-UP');
  assert.equal(links[0].entry.id, index.byId['oracle:sd.npc.disposition'].id);
  assert.equal(
    resolveRowRelationships(
      index.byId,
      stash1.oracle!.rolls[0].metadata,
      source.id,
    ).length,
    0,
  );
  const results = createInlineChildResults();
  const target = physicalParent('sd.npc.disposition', '1,1');
  assert.equal(
    retainInlineChild(
      results,
      stash5.oracle!.rolls[0],
      target.oracle!.rolls[0],
    ),
    false,
  );
  assert.equal(
    copyReadingWithInlineChildren(stash5, results),
    copyReferenceReading(stash5),
  );
  const derived = getReferenceRelationships(index, registry);
  assert.ok(
    relatedReferenceRelationships(index, derived, 'oracle:core.rooms').some(
      (edge) =>
        edge.kind === 'USED BY' &&
        edge.entry.id === 'procedure:sd.dungeon-preparation',
    ),
  );
  assert.equal(rng.mock.callCount(), 0);
});

test('Associating and serializing explicit inline results leaves canonical registry and reading schema unchanged', () => {
  const sourceBefore = JSON.stringify(registry);
  const reading = physicalParent();
  const before = JSON.stringify(reading);
  const keys = Object.keys(reading);
  const results = createInlineChildResults();
  retainInlineChild(results, reading.oracle!.rolls[0], childFor(reading));
  copyReadingWithInlineChildren(reading, results);
  assert.equal(JSON.stringify(registry), sourceBefore);
  assert.equal(JSON.stringify(reading), before);
  assert.deepEqual(Object.keys(reading), keys);
  assert.equal(registry.tables.length, 546);
  assert.equal(index.entries.length, 993);
});

function renderRooms(
  reading: ReferenceReading,
  results: ReturnType<typeof createInlineChildResults>,
) {
  const context: DeskContext = {
    entries: index.entries,
    byId: index.byId,
    activate: () => {
      throw new Error('Rendering cannot navigate or roll');
    },
    openSearch: () => {},
    search: () => [],
    contextual: () => [],
    pinnedIds: [],
    recentIds: [],
    touch: () => {},
    togglePin: () => {},
    inlineChildren: results,
    onInlineChild: () => {
      throw new Error('Rendering cannot obtain an inline result');
    },
  };
  return renderToStaticMarkup(
    createElement(
      ReferenceContext.Provider,
      { value: context },
      createElement(ReferenceTable, {
        table: table('core.rooms'),
        currentEntryIds: reading.oracle!.rolls.map((roll) => roll.entryId),
        parentResult: reading.oracle,
        onChoose: () => {
          throw new Error('Rendering cannot choose a parent');
        },
      }),
    ),
  );
}

test('Actual source table rendering restores only the selected parent child, including its value and open result', (t) => {
  const rng = forbidDice(t);
  const rooms11 = physicalParent();
  const rooms33 = physicalParent('core.rooms', '3,3');
  const results = createInlineChildResults();
  retainInlineChild(results, rooms11.oracle!.rolls[0], childFor(rooms11));
  retainInlineChild(results, rooms33.oracle!.rolls[0], childFor(rooms33, '1'));
  const html = renderRooms(rooms11, results);
  const output = [...html.matchAll(/<output[^>]*>([\s\S]*?)<\/output>/g)].map(
    (match) => match[1],
  );
  assert.deepEqual(output, ['d6 → 3 · Hypnotic']);
  assert.match(html, /data-parent-entry-id="core.rooms:11-11" open=""/);
  assert.match(
    html,
    /aria-label="Inscriptions, the motifs are 추가 표 실물 굴림"[^>]*value="3"/,
  );
  assert.doesNotMatch(html, /data-parent-entry-id="core.rooms:33-33" open=""/);
  assert.equal(rng.mock.callCount(), 0);
});

test('Actual source table rendering after parent replacement cannot show the old child output or open disclosure', (t) => {
  const rng = forbidDice(t);
  const original = physicalParent();
  const results = createInlineChildResults();
  retainInlineChild(results, original.oracle!.rolls[0], childFor(original));
  for (const replacement of [
    physicalParent('core.rooms', '3,5'),
    physicalParent(),
  ]) {
    const html = renderRooms(replacement, results);
    assert.doesNotMatch(html, /<output[^>]*>/);
    assert.doesNotMatch(
      html,
      /data-parent-entry-id="core.rooms:11-11" open=""/,
    );
  }
  assert.equal(rng.mock.callCount(), 0);
});
