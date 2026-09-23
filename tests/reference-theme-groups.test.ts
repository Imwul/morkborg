import test from 'node:test';
import assert from 'node:assert/strict';
import {
  groupReferenceResults,
} from '../src/domain/referencePresentation.ts';
import type { ReferenceEntry, ReferenceContext } from '../src/domain/references.ts';

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
      ['city', ['city']],
      ['travel', ['road']],
      ['character', ['person']],
      ['monster', ['beast']],
      ['other', ['unclassified']],
    ],
  );
  assert.equal(
    groups.reduce((total, group) => total + group.entries.length, 0),
    new Set(entries.map(({ id }) => id)).size,
  );
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
