import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { buildReferenceRegistry } from '../src/domain/references.ts';
import { setRules, getRules } from '../src/storage/rulesStore.ts';
import { setOraclePack, getOraclePack } from '../src/storage/oracleStore.ts';
import {
  browseReferences,
  referenceEntryFormula,
  REFERENCE_TYPES,
  REFERENCE_CONTEXTS,
} from '../src/domain/referencePresentation.ts';
import { ReferenceDice } from '../src/components/ReferenceDice.tsx';
import { ReferenceTable } from '../src/components/ReferenceTable.tsx';
const fixture = JSON.parse(
  readFileSync(
    process.env.MORKBORG_PRIVATE_AUDIT_FIXTURE ??
      'outputs/morkborg-private-data.json',
    'utf8',
  ),
);
setRules(fixture.library);
setOraclePack(fixture.oracles);
const registry = buildOracleRegistry(getRules()!, getOraclePack());
const index = buildReferenceRegistry(registry, getRules()!);
test('compact table presentation retains every source row, accessible title and selected physical result', () => {
  for (const dice of ['d6', 'd20', 'd66']) {
    const table = registry.tables.find(
      (t) => t.dice === dice && t.entries.length > 1 && !t.forcedFinal,
    )!;
    const selected = table.entries.at(-1)!;
    const props = { table, currentEntryIds: [selected.id], onChoose: () => {} };
    const full = renderToStaticMarkup(createElement(ReferenceTable, props));
    const compact = renderToStaticMarkup(
      createElement(ReferenceTable, { ...props, hideCaption: true }),
    );
    assert.equal(
      compact.replace('caption class="sr-only"', 'caption'),
      full,
      dice,
    );
    assert.equal(
      (compact.match(/<tr(?:\s|>)/g) ?? []).length,
      table.entries.length,
      dice,
    );
    assert.equal(
      (compact.match(/class="current-table-result"/g) ?? []).length,
      1,
      dice,
    );
    assert.ok(compact.includes('scope="row"'), dice);
  }
});
test('browse preserves every registry entry exactly once', () => {
  const all = browseReferences(index, '');
  assert.equal(all.length, index.entries.length);
  assert.equal(new Set(all.map((e) => e.id)).size, index.entries.length);
  for (const [kind] of REFERENCE_TYPES.filter(([k]) => k !== 'all'))
    assert.equal(
      browseReferences(index, '', { kind }).length,
      index.entries.filter((e) => e.kind === kind).length,
    );
});
test('gameplay phrases found in the browser audit now resolve directly', () => {
  for (const [query, id] of [
    ['시체에서 뭐가 나오는 표', 'oracle:core.corpsePlundering'],
    ['NPC가 나를 어떻게 대하는지', 'oracle:core.reaction'],
    ['길 상태', 'oracle:feretory.roadType'],
    ['날씨', 'oracle:core.weather'],
    ['reaction', 'oracle:core.reaction'],
    ['corpse', 'oracle:core.corpsePlundering'],
    ['morale', 'rule:core.reaction-morale'],
    ['travel', 'rule:sd.travel-day'],
  ])
    assert.equal(browseReferences(index, query)[0]?.id, id, query);
});
test('partial, translated, source and type searches use actual metadata', () => {
  for (const [q, id] of [
    ['react', 'oracle:core.reaction'],
    ['oracle weather', 'oracle:core.weather'],
    ['FERETORY', 'book:feretory'],
  ])
    assert.equal(browseReferences(index, q)[0]?.id, id, q);
  for (const [query, id] of [
    ['react', 'oracle:core.reaction'],
    ['core weather', 'oracle:core.weather'],
    ['oracle weather', 'oracle:core.weather'],
    ['FERETORY', 'book:feretory'],
  ])
    assert.ok(
      browseReferences(index, query).some((e) => e.id === id),
      query,
    );
});
test('context is a filter, never a required state or subset of availability', () => {
  const before = JSON.stringify(index);
  for (const [context] of REFERENCE_CONTEXTS) {
    const result = browseReferences(index, '', { context });
    assert.ok(result.length > 0, context);
    assert.ok(result.every((e) => e.contexts.includes(context)));
  }
  assert.equal(JSON.stringify(index), before);
  assert.equal(browseReferences(index, '').length, index.entries.length);
});
test('source filter is composable with type and query', () => {
  const result = browseReferences(index, '', {
    kind: 'oracle',
    book: 'feretory',
  });
  assert.ok(result.length > 0);
  assert.ok(
    result.every(
      (e) =>
        e.kind === 'oracle' &&
        e.sourceRefs.some((s) => s.bookId === 'feretory'),
    ),
  );
});
test('Pins and Recent retain the supplied navigation order, even with missing old ids', () => {
  const ids = ['oracle:core.weather', 'gone:old-table', 'oracle:core.reaction'];
  assert.deepEqual(
    browseReferences(index, '', { ids }).map((e) => e.id),
    [ids[0], ids[2]],
  );
  assert.equal(browseReferences(index, 'reaction', { ids })[0]?.id, ids[2]);
});
test('displayed dice are derived from original tables and Core Morale rule', () => {
  for (const [id, formula] of [
    ['oracle:core.reaction', '2d6'],
    ['oracle:core.weather', 'd12'],
    ['oracle:core.corpsePlundering', 'd66'],
    ['rule:core.reaction-morale', '2d6 > Morale · 실패 시 d6'],
  ])
    assert.equal(referenceEntryFormula(index.byId[id], registry), formula);
  assert.ok(
    referenceEntryFormula(index.byId['rule:sd.travel-day'], registry).includes(
      'd12',
    ),
  );
});
test('Morale reuses the independent dice control without exposing a workflow or default d20', () => {
  const html = renderToStaticMarkup(
    createElement(ReferenceDice, {
      initialCount: 2,
      initialSides: 6,
      compact: true,
    }),
  );
  assert.match(html, /2d6/);
  assert.doesNotMatch(html, /d20|\sdisabled(?:=|\s|>)|완료|저장|dice-picker/);
});
