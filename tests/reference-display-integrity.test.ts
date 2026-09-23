import {
  ReferenceContext,
  type DeskContext,
} from '../src/components/ReferenceContext.tsx';
import { ReferenceNextSteps } from '../src/components/ReferenceNextSteps.tsx';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { setRules, getRules } from '../src/storage/rulesStore.ts';
import { setOraclePack, getOraclePack } from '../src/storage/oracleStore.ts';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import {
  buildReferenceRegistry,
  searchReferences,
} from '../src/domain/references.ts';
import { trustedReferenceSearchTitle } from '../src/domain/referenceSearchTitles.ts';
import { referenceDisplayTitle } from '../src/domain/referenceDisplayTitles.ts';
import { referenceShortName } from '../src/domain/referenceActions.ts';
import {
  translateGeneratedText,
  polishKoreanTranslation,
} from '../src/generators/translation.ts';
import { ReferenceTitleTranslation } from '../src/components/ReferenceTitleTranslation.tsx';

const raw = JSON.parse(
  readFileSync('outputs/morkborg-private-data.json', 'utf8'),
);
setRules(raw.library);
setOraclePack(raw.oracles);
const rules = getRules()!,
  oracles = buildOracleRegistry(rules, getOraclePack());
const refs = buildReferenceRegistry(oracles, rules);
const entry = (id: string) => {
  const e = refs.byId[id];
  assert.ok(e, id);
  return e;
};
const display = (id: string) => referenceDisplayTitle(entry(id));
const legacy = (id: string) => {
  const e = entry(id);
  return polishKoreanTranslation(
    e.titleTranslationKo || translateGeneratedText(e.title),
  );
};
const html = (id: string) =>
  renderToStaticMarkup(
    createElement(ReferenceTitleTranslation, { entry: entry(id) }),
  );
const cohort = refs.entries.filter((e) => {
  const old = legacy(e.id);
  return old && old !== e.title && !trustedReferenceSearchTitle(refs, e);
});
const suppressed = cohort.filter((e) => !referenceDisplayTitle(e).text);

test('all 264 existing owned translations are preserved, including 257 A and 7 B', () => {
  const trusted = refs.entries.filter((e) =>
    trustedReferenceSearchTitle(refs, e),
  );
  assert.equal(trusted.length, 264);
  for (const e of trusted) {
    assert.equal(referenceDisplayTitle(e).classification, 'trusted', e.id);
    assert.equal(referenceDisplayTitle(e).text, legacy(e.id), e.id);
  }
});
test('explicit title metadata remains the first display authority', () => {
  const e = refs.entries.find((e) => e.titleTranslationKo)!;
  assert.equal(referenceDisplayTitle(e).origin, 'explicit-title');
  assert.equal(
    referenceDisplayTitle(e).text,
    polishKoreanTranslation(e.titleTranslationKo!),
  );
});
test('owned Battle axe row keeps its exact title translation', () => {
  const e = refs.entries.find((e) => e.title === 'Battle axe')!;
  assert.equal(referenceDisplayTitle(e).origin, 'source-row');
  assert.equal(referenceDisplayTitle(e).text, '전투 도끼');
});
test('all eight normalized whole-title mappings retain their translations', () => {
  const entries = refs.entries.filter(
    (e) => trustedReferenceSearchTitle(refs, e)?.origin === 'title-dictionary',
  );
  assert.equal(entries.length, 8);
  for (const e of entries)
    assert.equal(referenceDisplayTitle(e).text, legacy(e.id));
});
test('owned creature names and all nine whole UI names are preserved', () => {
  for (const [origin, count] of [
    ['creature-name', 4],
    ['ui-name', 9],
  ] as const) {
    const entries = refs.entries.filter(
      (e) => trustedReferenceSearchTitle(refs, e)?.origin === origin,
    );
    assert.equal(entries.length, count);
    for (const e of entries)
      assert.equal(referenceDisplayTitle(e).text, legacy(e.id));
  }
});
test('Curses exact global translation is demonstrably owned by another source row', () => {
  const row = oracles.tables
    .find((t) => t.id === 'aitc.festival-subject')!
    .entries.find((r) => r.min === 7)!;
  assert.equal(row.text, 'Curses');
  assert.equal(row.metadata?.ko, '저주');
  assert.equal(legacy('oracle:mythic2.meaning.curses'), '저주');
  assert.deepEqual(display('oracle:mythic2.meaning.curses'), {
    classification: 'misowned',
  });
});
test('Room Shape noun-to-verb composition is suppressed without changing the body translator', () => {
  assert.equal(translateGeneratedText('Room Shape'), '방 빚어내다');
  assert.deepEqual(display('oracle:reclvse.roomShape'), {
    classification: 'malformed',
  });
});
test('all 17 reviewed malformed outputs and one misowned output are suppressed', () => {
  assert.equal(suppressed.length, 18);
  assert.equal(
    suppressed.filter((e) => display(e.id).classification === 'malformed')
      .length,
    17,
  );
  assert.equal(
    suppressed.filter((e) => display(e.id).classification === 'misowned')
      .length,
    1,
  );
  for (const id of [
    'oracle:reclvse.street_shape',
    'oracle:reclvse.hidden_element',
    'oracle:depths.randomEventFocus',
    'oracle:feretory.blackSaltWindIntensity',
    'procedure:city.crawl',
  ])
    assert.equal(display(id).text, undefined);
});
test('useful helpers are retained independently of search certification', () => {
  assert.equal(cohort.length, 83);
  assert.equal(
    cohort.filter((e) => display(e.id).classification === 'useful').length,
    65,
  );
  for (const id of [
    'oracle:reclvse.dungeonEntrance',
    'oracle:reclvse.immediateGoal',
    'creature:core:59:zukuma',
    'oracle:aitc.npc-musician',
    'oracle:depths.region.sarkash.discovery',
  ]) {
    assert.equal(display(id).classification, 'useful');
    assert.equal(display(id).text, legacy(id));
    assert.equal(trustedReferenceSearchTitle(refs, entry(id)), undefined);
  }
});
test('identity helpers remain suppressed and no absent helper is materialized', () => {
  assert.equal(
    refs.entries.filter((e) => display(e.id).classification === 'unchanged')
      .length,
    22,
  );
  assert.equal(
    refs.entries.filter((e) => display(e.id).classification === 'absent')
      .length,
    624,
  );
  for (const e of refs.entries.filter(
    (e) => display(e.id).classification === 'unchanged',
  ))
    assert.equal(html(e.id), '');
});
test('every primary title and accessible source identity survives', () => {
  for (const e of refs.entries) {
    assert.ok(referenceShortName(e).trim());
    assert.ok(e.title.trim());
  }
  for (const e of suppressed)
    assert.ok(
      renderToStaticMarkup(
        createElement(
          'button',
          { 'aria-label': `${e.title} 열기` },
          referenceShortName(e),
          createElement(ReferenceTitleTranslation, { entry: e }),
        ),
      ).includes(referenceShortName(e)),
    );
});
test('null secondary creates no wrapper, separator, blank line or aria label', () => {
  for (const e of suppressed) assert.equal(html(e.id), '');
  assert.match(
    html('oracle:reclvse.dungeonEntrance'),
    /^<span class="generated-translation" lang="ko">던전 입구<\/span>$/,
  );
});
test('all reference title surfaces share the policy; body translation stays independent', () => {
  const source = readFileSync('src/components/ReferenceWorkbench.tsx', 'utf8');
  assert.equal(
    (source.match(/<ReferenceTitleTranslation entry=/g) || []).length,
    6,
  );
  assert.doesNotMatch(
    source,
    /translation=\{(?:entry|selected)\.titleTranslationKo\}/,
  );
  assert.match(source, /<Translation text=\{reading.title\}/);
  assert.doesNotMatch(
    readFileSync('src/domain/referenceDisplayTitles.ts', 'utf8'),
    /trustedReferenceSearchTitle/,
  );
});
test('all suppressed references remain reachable through canonical search', () => {
  for (const e of suppressed)
    assert.ok(
      searchReferences(refs, e.title, { limit: 2000 }).some(
        (r) => r.id === e.id,
      ),
      e.id,
    );
});
test('display reads cannot add Tier C output to search vocabulary or alter result order', () => {
  for (const e of cohort) {
    const query = legacy(e.id),
      before = searchReferences(refs, query, { limit: 2000 }).map((r) => r.id);
    html(e.id);
    assert.deepEqual(
      searchReferences(refs, query, { limit: 2000 }).map((r) => r.id),
      before,
    );
    assert.equal(trustedReferenceSearchTitle(refs, e), undefined);
  }
  assert.equal(
    searchReferences(refs, '방 빚어내다', { limit: 2000 }).length,
    0,
  );
});
test('RNG trap covers all 1,001 title reads and rendered title components', (t) => {
  t.mock.method(Math, 'random', () => {
    throw new Error('title read consumed RNG');
  });
  for (const e of refs.entries) {
    referenceDisplayTitle(e);
    html(e.id);
  }
});
test('display does not mutate canonical registry, rules or pack', () => {
  const before = JSON.stringify({ rules, oracles, refs });
  for (const e of refs.entries) html(e.id);
  assert.equal(JSON.stringify({ rules, oracles, refs }), before);
});
test('a private pack replacement invalidates reviewed helper output approval', () => {
  const e = entry('oracle:reclvse.dungeonEntrance');
  assert.equal(display(e.id).classification, 'useful');
  const changed = structuredClone(raw.library);
  // Deliberately wrong test fixture, never authored as a production translation.
  changed.notes.translations.Entrance = 'TEST_REPLACEMENT';
  try {
    setRules(changed);
    assert.equal(referenceDisplayTitle(e).text, undefined);
    const rebuilt = buildReferenceRegistry(
      buildOracleRegistry(getRules(), getOraclePack()),
      getRules(),
    );
    assert.equal(referenceDisplayTitle(rebuilt.byId[e.id]).text, undefined);
  } finally {
    setRules(raw.library);
  }
  assert.equal(display(e.id).text, '던전 입구');
});
test('same ID with a changed source title cannot reuse reviewed helper admission', () => {
  const e = { ...entry('oracle:reclvse.dungeonEntrance'), title: 'Room Shape' };
  assert.equal(referenceDisplayTitle(e).text, undefined);
  assert.equal(referenceDisplayTitle(e).classification, 'unreviewed');
});
test('new registry ownership evidence replaces earlier explicit metadata', () => {
  const before = buildReferenceRegistry(oracles, rules);
  const after = buildReferenceRegistry(oracles, {
    ...rules,
    notes: { ...rules.notes, translations: {} },
  });
  assert.notEqual(before.entries, after.entries);
  for (const e of before.entries.filter(
    (e) =>
      trustedReferenceSearchTitle(before, e)?.origin === 'title-dictionary',
  )) {
    assert.equal(referenceDisplayTitle(e).origin, 'title-dictionary');
    assert.notEqual(
      referenceDisplayTitle(after.byId[e.id]).origin,
      'title-dictionary',
    );
  }
  assert.equal(
    referenceDisplayTitle(before.byId['oracle:core.reaction']).text,
    referenceDisplayTitle(after.byId['oracle:core.reaction']).text,
  );
  assert.equal(
    trustedReferenceSearchTitle(after, after.byId['oracle:reclvse.roomShape']),
    undefined,
  );
});

test('actual contextual Related render preserves target and label while suppressing only unsafe secondary', (t) => {
  t.mock.method(Math, 'random', () => {
    throw new Error('Related title RNG');
  });
  const context: DeskContext = {
    ...refs,
    activate: () => {},
    openSearch: () => {},
    search: () => [],
    contextual: () => [],
    pinnedIds: [],
    recentIds: [],
    touch: () => {},
    togglePin: () => {},
  };
  const markup = renderToStaticMarkup(
    createElement(
      ReferenceContext.Provider,
      { value: context },
      createElement(ReferenceNextSteps, {
        ids: ['oracle:reclvse.roomShape', 'oracle:reclvse.dungeonEntrance'],
      }),
    ),
  );
  assert.match(markup, /Room Shape/);
  assert.match(markup, /FOLLOW-UP/);
  assert.match(markup, /던전 입구/);
  assert.doesNotMatch(markup, /방 빚어내다/);
  assert.equal((markup.match(/data-relationship-target=/g) || []).length, 2);
});

test('oracle pack replacement invalidates a composed helper even on the same entry', () => {
  const e = entry('oracle:reclvse.npcAppearance');
  assert.equal(referenceDisplayTitle(e).classification, 'useful');
  const pack = structuredClone(getOraclePack()!);
  const row = pack.tables
    .find((t) => t.id === 'aitc.backtracking')!
    .entries.find((r) => r.text === 'NPC')!;
  assert.ok(row);
  row.metadata = { ...row.metadata, ko: 'TEST_REPLACEMENT' };
  try {
    setOraclePack(pack);
    assert.equal(referenceDisplayTitle(e).text, undefined);
  } finally {
    setOraclePack(raw.oracles);
  }
  assert.equal(referenceDisplayTitle(e).classification, 'useful');
});
