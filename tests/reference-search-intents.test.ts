import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import {
  buildReferenceRegistry,
  searchReferences,
  type ReferenceEntry,
  type ReferenceRegistry,
} from '../src/domain/references.ts';
import { parseRulesPack, type RulesPack } from '../src/storage/rulesStore.ts';
import { parseOraclePack } from '../src/storage/oracleStore.ts';

const entry = (
  id: string,
  title: string,
  patch: Partial<ReferenceEntry> = {},
): ReferenceEntry => ({
  id,
  title,
  kind: 'oracle',
  summary: '',
  keywords: [],
  contexts: [],
  regionIds: [],
  sourceRefs: [],
  sourceChain: [],
  relatedIds: [],
  canonicalIds: [],
  available: true,
  action: { kind: 'oracle', oracleIds: [id] },
  ...patch,
});
const registry = (entries: ReferenceEntry[]): ReferenceRegistry => ({
  entries,
  byId: Object.fromEntries(entries.map((e) => [e.id, e])),
});

test('Exact supplied translated titles rank above incidental summaries and source mentions', () => {
  const refs = registry([
    entry('broad', 'A travel rule', {
      kind: 'rule',
      summary: '날씨 변화가 여행에 영향을 줍니다.',
    }),
    entry('source', 'A source index', {
      sourceRefs: [{ bookId: 'test', bookTitle: '날씨 변화' }],
    }),
    entry('weather-shift', 'Weather Shift', {
      titleTranslationKo: '날씨 변화',
    }),
  ]);
  assert.equal(searchReferences(refs, '날씨 변화')[0].id, 'weather-shift');
  assert.equal(searchReferences(refs, '날씨 변')[0].id, 'weather-shift');
});

test('Mixed-language alias concepts outrank a title fragment with only incidental body matches', () => {
  const refs = registry([
    entry('npc', 'NPC', { summary: 'NPC 반응을 포함하는 여러 가지 정보' }),
    entry('reaction', 'Reaction', {
      searchAliases: { en: ['NPC reaction'], ko: ['반응', '적대적인가'] },
    }),
    entry('enemy', 'Enemy detection', {
      summary: '적대적인 적이 알아차립니다.',
    }),
  ]);
  assert.equal(searchReferences(refs, 'NPC 반응')[0].id, 'reaction');
  assert.equal(searchReferences(refs, '적대적')[0].id, 'reaction');
  assert.equal(searchReferences(refs, 'NPC nonexistent').length, 0);
});

test('Translation indexing uses exact existing mappings and does not assemble translated words', () => {
  const rules: RulesPack = {
    schemaVersion: 1,
    books: [],
    tables: {},
    creatures: [],
    outcasts: [],
    notes: {
      translations: { 'Weather Shift': '날씨 변화', Room: '방', Shape: '형태' },
    },
  };
  const before = JSON.stringify(rules);
  const additions = [
    entry('weather-shift', 'Weather Shift'),
    entry('shape', 'Room Shape'),
  ];
  const refs = buildReferenceRegistry(
    { books: [], tables: [], procedures: [] },
    rules,
    additions,
  );
  assert.equal(refs.byId['weather-shift'].titleTranslationKo, '날씨 변화');
  assert.equal(searchReferences(refs, '날씨 변화')[0].id, 'weather-shift');
  assert.equal(refs.byId.shape.titleTranslationKo, undefined);
  assert.ok(!searchReferences(refs, '방 형태').some((e) => e.id === 'shape'));
  assert.equal(JSON.stringify(rules), before);
  assert.equal(additions[0].titleTranslationKo, undefined);
});

const path = 'outputs/morkborg-private-data.json';
const raw = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
const rules = raw ? parseRulesPack(raw.library) : null;
const oracles = buildOracleRegistry(
  rules,
  raw ? parseOraclePack(raw.oracles) : null,
);
const references = buildReferenceRegistry(oracles, rules);
const local = (name: string, run: () => void) =>
  test(name, { skip: !raw }, run);

local(
  'Observed corpse, reaction, weather, and road intents resolve first without exact source titles',
  () => {
    const queries: Record<string, string[]> = {
      'oracle:core.corpsePlundering': [
        'Corpse Plundering',
        'corpse',
        'loot corpse',
        'search body',
        '시체',
        '시체 뒤지기',
        '시체에서 뭐가 나오는 표',
        'search a corpse',
        '시체 수색',
      ],
      'oracle:core.reaction': [
        'Reaction',
        'attitude',
        'NPC reaction',
        'how do they react',
        'NPC 반응',
        '우호적',
        '적대적',
        '상대의 태도',
        '반응',
      ],
      'oracle:core.weather': [
        'Weather',
        '날씨',
        '오늘 날씨',
        'today weather',
        '비가 오나',
        'rain',
        '비',
        'storm',
        '폭풍',
        '날씨 표',
        '기상',
      ],
      'oracle:feretory.roadType': [
        'road condition',
        '길 상태',
        '도로 상태',
        '길 상태 표',
      ],
    };
    for (const [id, words] of Object.entries(queries))
      for (const query of words)
        assert.equal(searchReferences(references, query)[0]?.id, id, query);
  },
);

local(
  'Existing Korean titles, definition helpers, and creature names are searchable without new translations',
  () => {
    for (const [query, id] of [
      ['날씨 변화', 'oracle:reclvse.weather_shift'],
      ['훈련된 개', 'definition:core.beasts:dog-trained'],
      ['야생 개', 'definition:core.beasts:dog-wild'],
      ['검은 진주', 'definition:core.treasures:6-6'],
    ])
      assert.equal(searchReferences(references, query)[0]?.id, id, query);
    const creature = references.entries.find(
      (e) => e.kind === 'creature' && e.searchAliases?.ko.length,
    );
    assert.ok(creature);
    assert.ok(
      searchReferences(references, creature.searchAliases!.ko[0], {
        kind: 'creature',
        limit: 100,
      }).some((e) => e.id === creature.id),
    );
  },
);

local(
  'Exact named source entries and explicit source queries retain their meaning',
  () => {
    for (const title of [
      'Death',
      'Shield',
      'Faction Attitude Toward You',
      'Weather Shift',
    ])
      assert.equal(searchReferences(references, title)[0]?.title, title);
    assert.equal(
      searchReferences(references, 'FERETORY')[0]?.id,
      'book:feretory',
    );
    assert.equal(
      searchReferences(references, 'Solitary Defilement')[0]?.id,
      'book:sd',
    );
    assert.equal(
      searchReferences(references, 'Sarkash monster')[0]?.id,
      'rule:regional-monsters:sarkash',
    );
  },
);

local(
  'Type words and existing kind, context, and region filters remain conjunctive',
  () => {
    for (const query of [
      'weather table',
      'weather tables',
      '날씨 표',
      '날씨 오라클',
    ])
      assert.equal(
        searchReferences(references, query)[0]?.id,
        'oracle:core.weather',
        query,
      );
    assert.ok(
      searchReferences(references, 'NPC 반응', { kind: 'rule' }).every(
        (e) => e.kind === 'rule',
      ),
    );
    assert.ok(
      searchReferences(references, 'weather', { context: 'travel' }).every(
        (e) => e.contexts.includes('travel'),
      ),
    );
    assert.ok(
      !searchReferences(references, 'NPC 반응', { context: 'city' }).some(
        (e) => e.id === 'oracle:core.reaction',
      ),
    );
    assert.ok(
      searchReferences(references, 'monster', { region: 'sarkash' }).every(
        (e) => e.regionIds.includes('sarkash'),
      ),
    );
  },
);

local(
  'Dungeon preparation exposes existing source tables directly without adding a canonical table',
  () => {
    const preparation = references.byId['procedure:sd.dungeon-preparation'];
    assert.equal(references.entries.length, 993);
    assert.equal(oracles.tables.length, 546);
    assert.equal(preparation.available, true);
    assert.deepEqual(preparation.action, {
      kind: 'procedure',
      procedureId: 'sd.dungeon-preparation',
    });
    assert.deepEqual(preparation.canonicalIds, [
      'core.titleA',
      'core.titleB',
      'core.status',
      'core.danger',
      'core.inhabitants',
      'core.feature',
      'core.rooms',
      'reclvse.dungeonEntrance',
    ]);
    assert.ok(
      preparation.sourceRefs.some(
        (s) =>
          s.bookId === 'sd' &&
          s.pdfPage === 19 &&
          s.printedPage === 17 &&
          s.role === 'routing',
      ),
    );
    assert.ok(
      preparation.sourceRefs.some(
        (s) => s.bookId === 'reclvse' && s.pdfPage === 87,
      ),
    );
    assert.equal(
      searchReferences(references, '던전 준비')[0]?.id,
      preparation.id,
    );
    const missingTable = buildReferenceRegistry(
      {
        ...oracles,
        tables: oracles.tables.filter((t) => t.id !== 'core.rooms'),
      },
      rules,
    ).byId[preparation.id];
    assert.equal(missingTable.available, false);
    assert.equal(missingTable.action, null);
  },
);
