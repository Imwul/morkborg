import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  emptyMythicLists,
  validateMythicLists,
  mythicListSections,
  resolveMythicList,
  rollMythicList,
  mythicFocusList,
  tidyMythicList,
} from '../src/domain/mythicLists.ts';
import {
  objectKindForReference,
  objectFromReading,
  emptyObjectShelf,
  appendSavedObject,
  validateObjectShelf,
} from '../src/domain/savedObjects.ts';
import {
  PLAY_GUIDES,
  SCENE_PLAY_ACTIONS,
  scenePlayActions,
  crawlFollowThrough,
} from '../src/domain/playGuidance.ts';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { buildReferenceRegistry } from '../src/domain/references.ts';
import { executeReference } from '../src/domain/referenceExecution.ts';
import { parseOraclePack } from '../src/storage/oracleStore.ts';
import { parseRulesPack } from '../src/storage/rulesStore.ts';
import { rollCityMove } from '../src/domain/cityProcedures.ts';
import { resolveCrawlDice } from '../src/domain/dungeonCrawl.ts';
import type { ReferenceReading } from '../src/domain/referenceReading.ts';

const bundle = JSON.parse(
  readFileSync('outputs/morkborg-private-data.json', 'utf8'),
);
const rules = parseRulesPack(bundle.library);
const registry = buildOracleRegistry(rules, parseOraclePack(bundle.oracles));
const index = buildReferenceRegistry(registry, rules);
const options = {
  registry,
  rules,
  region: 'sarkash' as const,
  stockKind: 'common' as const,
  stockDR: 10,
  cityLarge: false,
  cityExits: true,
  rng: () => 0.4,
};
const slots = () => emptyMythicLists().characters;
const reading: ReferenceReading = {
  title: '검증용 도시',
  blocks: [{ title: '성격', text: '검증용 결과' }],
  sourceRefs: [{ bookId: 'aitc', bookTitle: 'Alöne in the Crowd', pdfPage: 6 }],
};

test('Mythic lists have two independent 25-slot arrays', () => {
  const lists = emptyMythicLists();
  lists.characters[0] = '동행자';
  assert.equal(lists.threads[0], '');
  assert.equal(lists.characters.length, 25);
  assert.equal(lists.threads.length, 25);
});
test('An empty Mythic list resolves Current Context without consuming dice', () => {
  assert.equal(
    rollMythicList(slots(), () => {
      throw Error('unexpected roll');
    }).kind,
    'context',
  );
});
test('Mythic chooses the final occupied section, preserving holes', () => {
  const list = slots();
  list[0] = '처음';
  list[20] = '마지막';
  assert.equal(mythicListSections(list), 5);
  assert.equal(resolveMythicList(list, 9, 1).slot, 20);
  assert.equal(resolveMythicList(list, 8, 3).kind, 'choose');
  assert.equal(list[16], '');
});
for (const sections of [1, 2, 3, 4, 5])
  test(`Mythic ${sections} sections: correct section dice and paired d10 faces`, () => {
    const list = slots();
    for (let i = 0; i < sections * 5; i++) list[i] = '항목 ' + i;
    for (let section = 1; section <= sections; section++)
      for (let line = 1; line <= 10; line++) {
        const r = resolveMythicList(list, section * 2, line);
        assert.equal(r.slot, (section - 1) * 5 + Math.ceil(line / 2) - 1);
        assert.equal(r.sectionDice, sections === 1 ? undefined : sections * 2);
      }
    let rolls = 0;
    rollMythicList(list, () => {
      rolls++;
      return 0.25;
    });
    assert.equal(rolls, sections === 1 ? 1 : 2);
  });
test('Mythic invalid manual faces fail instead of being clamped or rerolled', () => {
  const list = slots();
  list[7] = '인물';
  for (const die of [0, 5, NaN, 1.5])
    assert.throws(() => resolveMythicList(list, die, 1));
  for (const die of [0, 11, NaN, 2.5])
    assert.throws(() => resolveMythicList(list, 1, die));
});
test('Mythic CHOOSE keeps the exact empty slot and original dice', () => {
  const list = slots();
  list[0] = '인물';
  const r = resolveMythicList(list, undefined, 10);
  assert.equal(r.kind, 'choose');
  assert.equal(r.slot, 4);
  assert.equal(r.lineRoll, 10);
});
test('Mythic allows three weighted occurrences but rejects a fourth', () => {
  const lists = emptyMythicLists();
  lists.characters.splice(0, 3, '수도승', '수도승', '수도승');
  assert.doesNotThrow(() => validateMythicLists(lists));
  lists.characters[4] = ' 수도승 ';
  assert.throws(() => validateMythicLists(lists));
});
test('Mythic Focus routes existing NPCs and Threads, never New NPC or PC effects', () => {
  for (let face = 1; face <= 100; face++)
    assert.equal(
      mythicFocusList(face),
      face >= 21 && face <= 50
        ? 'characters'
        : face >= 51 && face <= 70
          ? 'threads'
          : null,
    );
  for (const face of [0, 101, NaN, 21.5])
    assert.equal(mythicFocusList(face), null);
});
test('Explicit Mythic cleanup reduces 3→2 and 1/2→1 without mutating the source', () => {
  const list = slots();
  list.splice(0, 6, 'A', 'B', 'A', 'B', 'A', 'C');
  assert.deepEqual(tidyMythicList(list).slice(0, 5), ['A', 'A', 'B', 'C', '']);
  assert.equal(list[4], 'A');
});
test('Malformed list imports cannot shrink tables or inject non-text values', () => {
  assert.throws(() => validateMythicLists({ characters: [], threads: [] }));
  const list = emptyMythicLists();
  list.threads[3] = null as unknown as string;
  assert.throws(() => validateMythicLists(list));
});
for (const [id, kind] of Object.entries({
  'procedure:character.core-classless': 'character',
  'procedure:workbench.npc': 'npc',
  'procedure:sd.dungeon-preparation': 'dungeon',
  'procedure:aitc.settlement': 'city',
}))
  test(`Shelf retains canonical ${kind} generator output and source without mutating it`, () => {
    const generated = executeReference(index.byId[id], options);
    const before = structuredClone(generated);
    const item = objectFromReading(id, generated);
    assert.equal(item.kind, kind);
    assert.ok(item.text.trim());
    assert.ok(item.sourceText.includes('PDF'));
    assert.deepEqual(generated, before);
    const shelf = appendSavedObject(emptyObjectShelf(), item);
    assert.deepEqual(
      validateObjectShelf(JSON.parse(JSON.stringify(shelf))),
      shelf,
    );
  });
test('Shelf rejects monsters, arbitrary oracles, procedures and empty results', () => {
  for (const id of [
    'procedure:workbench.epk',
    'oracle:core.weather',
    'procedure:workbench.city',
    'rule:city',
    'procedure:city.crawl',
  ]) {
    assert.equal(objectKindForReference(id), null);
    assert.throws(() => objectFromReading(id, reading));
  }
  assert.throws(() =>
    objectFromReading('procedure:aitc.settlement', { ...reading, blocks: [] }),
  );
});
test('Shelf snapshots stay independent, retaining the generated original on edit', () => {
  const original = objectFromReading('procedure:aitc.settlement', reading);
  const shelf = appendSavedObject(emptyObjectShelf(), original);
  original.text = 'changed outside';
  assert.notEqual(shelf.objects[0].text, original.text);
  const edited = structuredClone(shelf);
  edited.objects[0].text = '사용자의 변경';
  assert.equal(
    validateObjectShelf(edited).objects[0].originalText,
    shelf.objects[0].originalText,
  );
});
test('Shelf validation rejects mismatched kinds, unknown null kinds and duplicate identities', () => {
  const item = objectFromReading('procedure:aitc.settlement', reading);
  for (const invalid of [
    { ...item, kind: 'npc' },
    { ...item, kind: null, referenceId: 'unknown' },
    { ...item, createdAt: 'bad' },
    { ...item, name: '' },
  ])
    assert.throws(() =>
      validateObjectShelf({ version: 1, objects: [invalid] }),
    );
  assert.throws(() =>
    validateObjectShelf({ version: 1, objects: [item, item] }),
  );
});
test('Every contextual action and concise guide points to an existing canonical reference', () => {
  const ids = new Set<string>();
  for (const guide of PLAY_GUIDES) {
    assert.ok(!ids.has(guide.id));
    ids.add(guide.id);
    for (const id of [...guide.appliesTo, guide.sourceId])
      assert.ok(index.byId[id], id);
  }
  for (const actions of Object.values(SCENE_PLAY_ACTIONS))
    for (const action of actions)
      assert.ok(index.byId[action.referenceId], action.referenceId);
  for (const outcome of ['strong', 'weak', 'miss'] as const)
    for (const link of crawlFollowThrough(outcome).links)
      assert.ok(index.byId[link.id], link.id);
});
test('Context only orders suggestions; it never removes actions or creates progression gates', () => {
  assert.equal(
    scenePlayActions('dungeon', 'chest')[0].referenceId,
    'rule:sd.search-move',
  );
  assert.equal(
    scenePlayActions('city', 'shrine')[0].referenceId,
    'procedure:city.pray',
  );
  for (const scene of ['dungeon', 'city'])
    assert.deepEqual(
      new Set(scenePlayActions(scene, 'anything').map((a) => a.referenceId)),
      new Set(SCENE_PLAY_ACTIONS[scene].map((a) => a.referenceId)),
    );
  assert.deepEqual(scenePlayActions('wilderness'), []);
});
test('Dungeon follow-through keeps Strong/special, Weak/ordinary and Miss/danger distinct', () => {
  assert.deepEqual(crawlFollowThrough('strong').links, []);
  assert.match(crawlFollowThrough('strong').note, /준비한 다음 특별한 방/);
  assert.equal(
    crawlFollowThrough(resolveCrawlDice([20, 20], 4, 12).outcome).links[0].id,
    'procedure:sd.room-description',
  );
  assert.equal(crawlFollowThrough('miss').links[0].id, 'oracle:depths.danger');
});
test('City follow-through follows the engine branch, including objectives already met', () => {
  const roll = (a: number, b: number, allObjectivesMet = false) => {
    let n = 0;
    return rollCityMove(
      { move: 'crawl', dr: 10, modifier: 0, allObjectivesMet },
      () => [a, b, 0][Math.min(n++, 2)],
    );
  };
  assert.equal(roll(0.99, 0.99).metadata.streetAction, 'next-objective');
  assert.equal(roll(0.99, 0.99, true).metadata.streetAction, 'new-street');
  assert.equal(roll(0.99, 0).metadata.streetAction, 'new-street');
  assert.equal(roll(0, 0).metadata.streetAction, 'resolve-then-new-street');
});
test('Guide and action coverage leaves archival registry counts intact', () => {
  assert.equal(registry.tables.length, 546);
  assert.equal(index.entries.length, 993);
  assert.equal(registry.procedures.length, 60);
  assert.equal(
    registry.tables.reduce((n, t) => n + t.entries.length, 0),
    12310,
  );
});

test('Shelf keeps existing Korean helper beside its block and original source text separate', () => {
  const source: ReferenceReading = {
    ...reading,
    blocks: [
      {
        title: 'Appearance',
        text: 'TEST SOURCE DESCRIPTION',
        translation: { titleKo: '외형', ko: '검증용 한국어 설명' },
      },
    ],
  };
  const before = structuredClone(source);
  const item = objectFromReading('procedure:workbench.npc', source);
  assert.match(
    item.text,
    /Appearance · 외형\nTEST SOURCE DESCRIPTION\n검증용 한국어 설명/,
  );
  assert.ok(!item.sourceText.includes('검증용 한국어 설명'));
  assert.deepEqual(source, before);
});
