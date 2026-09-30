import test from 'node:test';
import assert from 'node:assert/strict';
import { groupReferenceResults } from '../src/domain/referencePresentation.ts';
import type {
  ReferenceEntry,
  ReferenceContext,
} from '../src/domain/references.ts';

const entry = (id: string, contexts: ReferenceContext[]) =>
  ({ id, contexts }) as ReferenceEntry;

test('themed browse uses registry contexts and shows each reference once', () => {
  const entries = [
    entry('room', ['dungeon', 'room']),
    entry('city', ['city']),
    entry('road', ['travel', 'monster']),
    entry('person', ['npc']),
    entry('beast', ['monster']),
    entry('unclassified', []),
    entry('room', ['dungeon', 'room']),
  ];
  const groups = groupReferenceResults(entries);
  assert.deepEqual(
    groups.map(({ id, entries: items }) => [id, items.map(({ id }) => id)]),
    [
      ['dungeon', ['room']],
      ['travel', ['road']],
      ['character', ['person']],
      ['city', ['city']],
      ['monster', ['beast']],
      ['other', ['unclassified']],
    ],
  );
  assert.equal(
    groups.reduce((total, group) => total + group.entries.length, 0),
    new Set(entries.map(({ id }) => id)).size,
  );
});

test('theme browsing leads with playable essentials while retaining all references', () => {
  const make = (id: string, title: string, available = true) =>
    ({
      id,
      title,
      available,
      contexts: ['room'],
      kind: 'oracle',
      canonicalIds: [id.replace('oracle:', '')],
      action: { kind: 'oracle' },
    }) as ReferenceEntry;
  const items = [
    make('oracle:detail', 'A very narrow detail'),
    make('oracle:sd.room.exits', 'Room Exit'),
    make('oracle:sd.room.contents', 'Room Contents'),
    make('oracle:unavailable', 'A missing table', false),
    make('oracle:ordinary', 'Another roll'),
  ];
  const original = JSON.stringify(items);
  const group = groupReferenceResults(items)[0];
  assert.deepEqual(
    group.entries.slice(0, 2).map((e) => e.id),
    ['oracle:sd.room.contents', 'oracle:sd.room.exits'],
  );
  assert.equal(group.entries.at(-1)?.id, 'oracle:unavailable');
  assert.deepEqual(
    new Set(group.entries.map((e) => e.id)),
    new Set(items.map((e) => e.id)),
  );
  assert.equal(JSON.stringify(items), original);
});

test('curated theme assignment beats broad tags, while an explicit filter wins', () => {
  const names = {
    id: 'oracle:core.names',
    title: 'Names',
    contexts: ['dungeon', 'character'],
    available: true,
  } as ReferenceEntry;
  const miseries = {
    id: 'oracle:core.miseries',
    title: 'Miseries',
    contexts: ['travel'],
    available: true,
  } as ReferenceEntry;
  assert.deepEqual(
    groupReferenceResults([names, miseries]).map((g) => g.id),
    ['character', 'omens'],
  );
  assert.equal(groupReferenceResults([names], 'dungeon')[0].id, 'dungeon');
});

test('an active context filter determines the theme of multi-context references', () => {
  const cityRoad = entry('city-road', ['city', 'travel']);
  assert.deepEqual(
    groupReferenceResults([cityRoad], 'travel').map((group) => group.id),
    ['travel'],
  );
  assert.deepEqual(
    groupReferenceResults([cityRoad], 'city').map((group) => group.id),
    ['city'],
  );
});
