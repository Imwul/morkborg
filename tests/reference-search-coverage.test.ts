import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import {
  buildReferenceRegistry,
  findReferenceCreature,
  searchReferences,
  type ReferenceEntry,
} from '../src/domain/references.ts';
import { trustedReferenceSearchTitle } from '../src/domain/referenceSearchTitles.ts';
import { referenceShortName } from '../src/domain/referenceActions.ts';
import { browseReferences } from '../src/domain/referencePresentation.ts';
import { REFERENCE_SEARCH_ALIASES } from '../src/domain/referenceSearchAliases.ts';
import {
  setRules,
  getRules,
  type RulesPack,
} from '../src/storage/rulesStore.ts';
import { setOraclePack, getOraclePack } from '../src/storage/oracleStore.ts';
import {
  polishKoreanTranslation,
  translateGeneratedText,
} from '../src/generators/translation.ts';

const raw = JSON.parse(
  readFileSync('outputs/morkborg-private-data.json', 'utf8'),
);
setRules(raw.library);
setOraclePack(raw.oracles);
const rules = getRules()!;
const oracles = buildOracleRegistry(rules, getOraclePack());
const references = buildReferenceRegistry(oracles, rules);
const simple = (value: string) =>
  value.normalize('NFC').replace(/\s+/g, ' ').trim().toLowerCase();
const searchForm = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .normalize('NFC')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
const hangul = (value: unknown): value is string =>
  typeof value === 'string' && /[가-힣]/u.test(value);
const display = (entry: ReferenceEntry) => {
  const helper = polishKoreanTranslation(
    entry.titleTranslationKo?.trim()
      ? entry.titleTranslationKo
      : translateGeneratedText(entry.title),
  );
  return helper && helper.normalize('NFC') !== entry.title.normalize('NFC')
    ? helper
    : '';
};

// Independent expected origins: existing, whole UI labels actually rendered in
// this registry. This is not a new search alias list or a generated dictionary.
const uiNames = new Map([
  ['Reaction', '반응'],
  ['Zweihänder', '양손대검'],
  ['RECLVSE · RESOLUTION', '기본 판정'],
  ['RECLVSE · COMBAT', '전투'],
  ['RECLVSE · RECOVERY', '회복'],
  ['RECLVSE · OMENS / POWERS', '오멘 / 권능'],
  ['RECLVSE · CALENDAR', '달력'],
  ['RECLVSE · TRAVEL / CAMP', '여행 / 야영'],
  ['RECLVSE · DUNGEON', '던전'],
]);
type ExpectedOrigin =
  | 'explicit-title'
  | 'ui-name'
  | 'title-dictionary'
  | 'source-row'
  | 'creature-name';
function expectedEvidence(
  entry: ReferenceEntry,
  shown: string,
): { origin: ExpectedOrigin; tier: 'A' | 'B' } | undefined {
  if (!hangul(shown)) return;
  if (hangul(entry.titleTranslationKo))
    return { origin: 'explicit-title', tier: 'A' };
  if (uiNames.get(entry.title) === shown)
    return {
      origin: 'ui-name',
      tier: entry.id.startsWith('group:') ? 'B' : 'A',
    };
  const notes = Object.entries(Object(rules.notes.translations)).filter(
    ([key, value]) => simple(key) === simple(entry.title) && hangul(value),
  );
  if (
    notes.some(([, value]) => polishKoreanTranslation(String(value)) === shown)
  )
    return { origin: 'title-dictionary', tier: 'A' };
  const identity = entry.definition?.tableEntry;
  const table =
    identity && oracles.tables.find((table) => table.id === identity.tableId);
  const row =
    table && table.entries.find((row) => row.id === identity?.entryId);
  if (
    table?.sourceVerified &&
    row &&
    simple(row.text) === simple(entry.title) &&
    hangul(row.metadata?.ko) &&
    polishKoreanTranslation(row.metadata.ko) === shown
  )
    return { origin: 'source-row', tier: 'A' };
  if (entry.action?.kind === 'creature') {
    const creature = findReferenceCreature(rules, entry.action.creatureId);
    const ko = creature?.ko as Record<string, unknown> | undefined;
    if (hangul(ko?.name) && polishKoreanTranslation(ko.name) === shown)
      return { origin: 'creature-name', tier: 'A' };
  }
}
const displayed = references.entries
  .map((entry) => ({ entry, text: display(entry) }))
  .filter((row) => hangul(row.text));
const approved = displayed.flatMap(({ entry, text }) => {
  const proof = expectedEvidence(entry, text);
  return proof ? [{ entry, text, ...proof }] : [];
});
const groups = new Map<string, typeof approved>();
for (const row of approved) {
  const key = searchForm(row.text);
  groups.set(key, [...(groups.get(key) ?? []), row]);
}
const curatedIntents = Object.entries(REFERENCE_SEARCH_ALIASES).flatMap(
  ([id, aliases]) => aliases.ko.map((query) => ({ id, query })),
);
const intentTargets = (query: string) => [
  ...new Set(
    curatedIntents
      .filter((intent) => searchForm(intent.query) === searchForm(query))
      .map((intent) => references.byId[intent.id]?.id)
      .filter((id): id is string => !!id),
  ),
];
const exactTargetGroup = (query: string) =>
  new Set([
    ...(groups.get(searchForm(query)) ?? []).map((row) => row.entry.id),
    ...intentTargets(query),
  ]);

test('All displayed Korean search titles require independent existing source evidence; generated fallback remains uncertified', () => {
  assert.equal(displayed.length, 347);
  assert.equal(approved.length, 264);
  assert.equal(approved.filter((row) => row.tier === 'A').length, 257);
  assert.equal(approved.filter((row) => row.tier === 'B').length, 7);
  for (const row of displayed) {
    const expected = expectedEvidence(row.entry, row.text);
    const actual = trustedReferenceSearchTitle(references, row.entry);
    assert.deepEqual(
      actual,
      expected && { text: row.text, ...expected },
      row.entry.id,
    );
  }
  assert.equal(
    displayed.filter((row) => !expectedEvidence(row.entry, row.text)).length,
    83,
  );
});

test('All approved secondary titles are searchable; all 257 names without a title or established-intent collision resolve first', () => {
  let unambiguous = 0;
  for (const row of approved) {
    const results = searchReferences(references, row.text, { limit: 2000 });
    assert.ok(
      results.some((entry) => entry.id === row.entry.id),
      row.entry.id,
    );
    const exactTargets = exactTargetGroup(row.text);
    if (exactTargets.size === 1) {
      assert.equal(
        results[0]?.id,
        row.entry.id,
        `${row.text} → ${row.entry.id}`,
      );
      unambiguous++;
    } else {
      const intents = intentTargets(row.text);
      assert.equal(intents.length, 1, row.text);
      assert.equal(results[0]?.id, intents[0], row.text);
      assert.deepEqual(
        new Set(results.slice(0, exactTargets.size).map((entry) => entry.id)),
        exactTargets,
        row.text,
      );
    }
  }
  assert.equal(unambiguous, 257);
  assert.equal(approved.length - unambiguous, 7);
});

test('Identical Powers Korean titles keep both source identities in the exact-name result group', () => {
  const collisions = [...groups.values()].filter((rows) => rows.length > 1);
  assert.equal(collisions.length, 1);
  assert.deepEqual(
    new Set(collisions[0].map((row) => row.entry.id)),
    new Set(['oracle:mythic2.meaning.powers', 'oracle:reclvse.powers']),
  );
  assert.equal(collisions[0][0].text, '권능');
  const results = searchReferences(references, '권능');
  assert.equal(results[0]?.id, 'rule:core.casting');
  assert.deepEqual(
    new Set(results.slice(1, 3).map((entry) => entry.id)),
    new Set(collisions[0].map((row) => row.entry.id)),
  );
  assert.equal(new Set(results.map((entry) => entry.id)).size, results.length);
});

test('Existing NFC, spacing and case normalization applies to exact trusted Korean titles without fuzzy matching', () => {
  for (const row of approved.filter(
    (row) => exactTargetGroup(row.text).size === 1,
  )) {
    const query = `  ${row.text.normalize('NFD').toUpperCase().replace(/ /g, '   ')}  `;
    assert.equal(
      searchReferences(references, query)[0]?.id,
      row.entry.id,
      query,
    );
  }
  assert.deepEqual(
    searchReferences(references, '찾을수없는고유한검색어xyz987654'),
    [],
  );
  assert.deepEqual(
    searchReferences(references, '반응 nonexistentword987654'),
    [],
  );
});

test('All six title versus established-intent collisions preserve the intent and source-title group across NFC, NFD and spaces', () => {
  const ambiguous = [...groups.keys()].filter(
    (query) => exactTargetGroup(query).size > 1,
  );
  assert.deepEqual(
    new Set(ambiguous),
    new Set(['방어구', '권능', '죽음', '두루마리', '방패', '회복']),
  );
  for (const original of ambiguous) {
    const intents = intentTargets(original);
    const named = exactTargetGroup(original);
    assert.equal(intents.length, 1, original);
    for (const query of [
      original,
      original.normalize('NFD'),
      `  ${original}   `,
      `  ${original.normalize('NFD')}   `,
    ]) {
      const results = searchReferences(references, query);
      assert.equal(results[0]?.id, intents[0], query);
      assert.deepEqual(
        new Set(results.slice(0, named.size).map((entry) => entry.id)),
        named,
        query,
      );
    }
  }
});

test('All 120 existing curated Korean gameplay aliases retain their exact first target after title coverage expands', () => {
  assert.equal(curatedIntents.length, 120);
  for (const { id, query } of curatedIntents)
    assert.equal(
      searchReferences(references, query)[0]?.id,
      references.byId[id].id,
      query,
    );
});

test('Own-row Korean titles bind the exact definition table and row instead of borrowing global translations', () => {
  const ownRows = approved.filter((row) => row.origin === 'source-row');
  assert.equal(ownRows.length, 78);
  for (const row of ownRows) {
    const identity = row.entry.definition!.tableEntry!;
    const table = oracles.tables.find(
      (table) => table.id === identity.tableId,
    )!;
    const source = table.entries.find(
      (entry) => entry.id === identity.entryId,
    )!;
    assert.equal(simple(source.text), simple(row.entry.title), row.entry.id);
    assert.equal(
      polishKoreanTranslation(String(source.metadata?.ko)),
      row.text,
      row.entry.id,
    );
    const expectedTargets = exactTargetGroup(row.text);
    assert.deepEqual(
      new Set(
        searchReferences(references, row.text)
          .slice(0, expectedTargets.size)
          .map((entry) => entry.id),
      ),
      expectedTargets,
      row.entry.id,
    );
  }
  const unrelated = references.byId['oracle:mythic2.meaning.curses'];
  assert.equal(display(unrelated), '저주');
  assert.equal(trustedReferenceSearchTitle(references, unrelated), undefined);
});

test('Existing whole UI names and normalized dictionary keys use their explicit provenance', () => {
  const ui = approved.filter((row) => row.origin === 'ui-name');
  const dictionary = approved.filter(
    (row) => row.origin === 'title-dictionary',
  );
  assert.equal(ui.length, 9);
  assert.equal(dictionary.length, 8);
  for (const row of [...ui, ...dictionary])
    assert.deepEqual(trustedReferenceSearchTitle(references, row.entry), {
      text: row.text,
      origin: row.origin,
      tier: row.tier,
    });
  assert.equal(
    searchReferences(references, '매복의 징후')[0]?.id,
    'oracle:reclvse.signs_of_ambush',
  );
  assert.equal(
    searchReferences(references, '갈고리 닻')[0]?.id,
    'definition:core.equipmentCatalog:grappling-hook',
  );
});

test('All explicit Korean creature names retain full creature identities and do not search guessed fragments', () => {
  const named = approved.filter((row) => row.entry.kind === 'creature');
  assert.equal(named.length, 59);
  for (const row of named) {
    assert.equal(searchReferences(references, row.text)[0]?.id, row.entry.id);
    assert.equal(
      searchReferences(references, row.entry.title)[0]?.id,
      row.entry.id,
    );
  }
  const four = named.filter((row) => row.origin === 'creature-name');
  assert.equal(four.length, 4);
  assert.ok(
    four.some(
      (row) =>
        row.entry.id === 'creature:feretory:feretory.epk.carcasswan.pair' &&
        row.text === '시체 백조 (짝)',
    ),
  );
});

test('Primary Korean titles and the five explicit procedure names retain direct access', () => {
  const primary = references.entries.filter((entry) =>
    hangul(referenceShortName(entry)),
  );
  assert.equal(primary.length, 37);
  for (const entry of primary)
    assert.equal(
      searchReferences(references, referenceShortName(entry))[0]?.id,
      entry.id,
    );
  const procedures = [
    ...approved
      .filter((row) => row.entry.kind === 'procedure')
      .map((row) => ({ entry: row.entry, text: row.text })),
    ...primary
      .filter((entry) => entry.kind === 'procedure')
      .map((entry) => ({ entry, text: referenceShortName(entry) })),
  ];
  assert.equal(procedures.length, 5);
  for (const row of procedures)
    assert.equal(searchReferences(references, row.text)[0]?.id, row.entry.id);
});

test('Exact English Death and Shield remain source definitions; book and formula vocabulary do not become Korean title aliases', () => {
  for (const [query, id] of [
    ['Death', 'definition:core.unclean:10-10'],
    ['Shield', 'definition:core.equipmentCatalog:shield'],
    ['FERETORY', 'book:feretory'],
    ['Solitary Defilement', 'book:sd'],
  ]) {
    const results = searchReferences(references, query);
    assert.equal(results[0]?.id, id, query);
  }
  const books = references.entries.filter((entry) => entry.kind === 'book');
  assert.equal(books.length, 9);
  for (const book of books)
    assert.equal(trustedReferenceSearchTitle(references, book), undefined);
  for (const query of ['USES', 'USED BY', 'FOLLOW-UP', 'SUBTABLE', 'LOOKUP'])
    assert.ok(
      searchReferences(references, query).every(
        (entry) =>
          !trustedReferenceSearchTitle(references, entry)?.text.includes(query),
      ),
    );
});

test('Paired ID aliases resolve to one canonical search entry without merging distinct procedures', () => {
  const aliasPairs = Object.entries(references.byId).filter(
    ([id, entry]) => id !== entry.id,
  );
  assert.equal(aliasPairs.length, 20);
  for (const [alias, canonical] of aliasPairs) {
    assert.equal(references.byId[alias], references.byId[canonical.id]);
    const results = searchReferences(references, canonical.title, {
      limit: 2000,
    });
    assert.equal(
      results.filter((entry) => entry.id === canonical.id).length,
      1,
    );
    assert.ok(!results.some((entry) => entry.id === alias));
  }
  assert.notEqual(
    references.byId['procedure:sd.room-description'],
    references.byId['oracle:sd.room.adjective'],
  );
});

test('Trusted title ranking respects existing kind, context and region restrictions', () => {
  for (const row of approved) {
    for (const result of searchReferences(references, row.text, {
      kind: row.entry.kind,
    }))
      assert.equal(result.kind, row.entry.kind);
    if (row.entry.contexts.length) {
      const context = row.entry.contexts[0];
      const results = searchReferences(references, row.text, {
        context,
        limit: 2000,
      });
      assert.ok(results.some((entry) => entry.id === row.entry.id));
      assert.ok(results.every((entry) => entry.contexts.includes(context)));
    }
    if (row.entry.regionIds.length) {
      const region = row.entry.regionIds[0];
      const results = searchReferences(references, row.text, {
        region,
        limit: 2000,
      });
      assert.ok(results.some((entry) => entry.id === row.entry.id));
      assert.ok(results.every((entry) => entry.regionIds.includes(region)));
    }
  }
});

function bareReference(
  id: string,
  title: string,
  patch: Partial<ReferenceEntry> = {},
): ReferenceEntry {
  return {
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
    action: null,
    ...patch,
  };
}
function bareRules(translations: Record<string, unknown>): RulesPack {
  return {
    schemaVersion: 1,
    books: [],
    tables: {},
    creatures: [],
    outcasts: [],
    notes: { translations },
  };
}

test('Conflicting normalized dictionaries and generated title fragments are never silently certified', () => {
  const data = bareRules({
    Room: '방',
    Shape: '형태',
    'Ambiguous Name': '서로 다른 이름',
    'ambiguous name': '충돌하는 이름',
  });
  const registry = buildReferenceRegistry(
    { books: [], tables: [], procedures: [] },
    data,
    [
      bareReference('shape', 'Room Shape'),
      bareReference('ambiguous', 'Ambiguous NAME'),
    ],
  );
  assert.equal(
    trustedReferenceSearchTitle(registry, registry.byId.shape),
    undefined,
  );
  assert.equal(
    trustedReferenceSearchTitle(registry, registry.byId.ambiguous),
    undefined,
  );
  assert.ok(
    !searchReferences(registry, '방 형태').some(
      (entry) => entry.id === 'shape',
    ),
  );
  assert.ok(
    !searchReferences(registry, '서로 다른 이름').some(
      (entry) => entry.id === 'ambiguous',
    ),
  );
});

test('An unrelated body translation and a missing or unverified own-row binding cannot become a title', () => {
  const source = oracles.tables.find(
    (table) => table.id === 'core.weaponCatalog',
  )!;
  const example = references.byId['definition:core.weaponCatalog:battle-axe'];
  assert.equal(example.titleTranslationKo, undefined);
  const renamed = {
    ...example,
    id: 'isolated-title',
    title: 'Unrelated label',
    definition: {
      ...example.definition!,
      id: 'isolated-title',
      title: 'Unrelated label',
    },
  };
  const unrelated = buildReferenceRegistry(oracles, rules, [renamed]);
  assert.equal(
    trustedReferenceSearchTitle(unrelated, unrelated.byId['isolated-title']),
    undefined,
  );
  const missing = {
    ...example,
    id: 'missing-title',
    definition: {
      ...example.definition!,
      id: 'missing-title',
      tableEntry: { tableId: source.id, entryId: 'missing-source-row' },
    },
  };
  const missingRefs = buildReferenceRegistry(oracles, rules, [missing]);
  assert.equal(
    trustedReferenceSearchTitle(missingRefs, missingRefs.byId['missing-title']),
    undefined,
  );
  const unverified = {
    ...oracles,
    tables: oracles.tables.map((table) =>
      table.id === source.id ? { ...table, sourceVerified: false } : table,
    ),
  };
  const unverifiedRefs = buildReferenceRegistry(unverified, rules, [
    { ...example, id: 'unverified-title' },
  ]);
  assert.equal(
    trustedReferenceSearchTitle(
      unverifiedRefs,
      unverifiedRefs.byId['unverified-title'],
    ),
    undefined,
  );
});

test('New imported registry identities rebuild derived titles without stale aliases or persistent fields', () => {
  const firstRules = bareRules({ 'Case Name': '첫 번째 이름' });
  const secondRules = bareRules({ 'Case Name': '두 번째 이름' });
  const addition = bareReference('import-case', 'Case NAME');
  const before = JSON.stringify(addition);
  const source = { books: [], tables: [], procedures: [] };
  const first = buildReferenceRegistry(source, firstRules, [addition]);
  const second = buildReferenceRegistry(source, secondRules, [addition]);
  assert.equal(
    trustedReferenceSearchTitle(first, first.byId['import-case'])?.text,
    '첫 번째 이름',
  );
  assert.equal(
    trustedReferenceSearchTitle(second, second.byId['import-case'])?.text,
    '두 번째 이름',
  );
  assert.ok(
    !searchReferences(second, '첫 번째 이름').some(
      (entry) => entry.id === 'import-case',
    ),
  );
  assert.equal(searchReferences(second, '두 번째 이름')[0]?.id, 'import-case');
  assert.equal(JSON.stringify(addition), before);
  assert.equal(first.byId['import-case'].searchAliases, undefined);
  assert.equal(second.byId['import-case'].titleTranslationKo, undefined);
});

test('The actual browse surface retains trusted titles through its entries/byId registry wrapper', () => {
  const wrapped = { entries: references.entries, byId: references.byId };
  const id = 'definition:core.weaponCatalog:battle-axe';
  assert.notEqual(wrapped, references);
  assert.equal(
    trustedReferenceSearchTitle(wrapped, wrapped.byId[id])?.origin,
    'source-row',
  );
  for (const query of [
    '전투 도끼',
    '  전투   도끼  ',
    '전투 도끼'.normalize('NFD'),
  ]) {
    assert.equal(browseReferences(wrapped, query)[0]?.id, id, query);
    assert.equal(
      browseReferences(wrapped, query, { book: 'core', kind: 'rule' })[0]?.id,
      id,
      query,
    );
    assert.ok(
      !browseReferences(wrapped, query, { book: 'mythic2' }).some(
        (entry) => entry.id === id,
      ),
    );
  }
});

test('Reading search titles and querying real data consume zero dice RNG and leave all canonical data intact', (t) => {
  const before = JSON.stringify({ oracles, rules, references });
  const rng = t.mock.method(globalThis.crypto, 'getRandomValues', () => {
    throw new Error('Search cannot consume dice RNG');
  });
  for (const row of approved) {
    trustedReferenceSearchTitle(references, row.entry);
    searchReferences(references, row.text);
  }
  assert.equal(rng.mock.callCount(), 0);
  assert.equal(JSON.stringify({ oracles, rules, references }), before);
  assert.equal(references.entries.length, 993);
  assert.equal(oracles.tables.length, 546);
});
