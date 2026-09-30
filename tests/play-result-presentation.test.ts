import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { setRules, getRules } from '../src/storage/rulesStore.ts';
import { setOraclePack, getOraclePack } from '../src/storage/oracleStore.ts';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { buildReferenceRegistry } from '../src/domain/references.ts';
import {
  referenceThemeGroups,
  REFERENCE_BROWSE_THEMES,
} from '../src/domain/referenceThemeGroups.ts';
import { buildReferenceRelationships } from '../src/domain/referenceRelationships.ts';
import { referenceCompanions } from '../src/domain/referenceCompanions.ts';
import {
  readingFromOracleRolls,
  physicalOracleRoll,
} from '../src/domain/manualReferenceRoll.ts';
import { journeyGuidance } from '../src/domain/journeyGuidance.ts';
import { resultTasks } from '../src/domain/resultFollowThrough.ts';
import { ReferenceReadingBlock } from '../src/components/InlineReferenceTools.tsx';
import { JourneyGuidance } from '../src/components/JourneyGuidance.tsx';
import { ResultFollowThrough } from '../src/components/ResultFollowThrough.tsx';
import {
  ReferenceContext,
  type DeskContext,
} from '../src/components/ReferenceContext.tsx';
import type { OracleRoll } from '../src/domain/oracle.ts';

const bundle = JSON.parse(
  readFileSync('outputs/morkborg-private-data.json', 'utf8'),
);
setRules(bundle.library);
setOraclePack(bundle.oracles);
const registry = buildOracleRegistry(getRules(), getOraclePack());
const index = buildReferenceRegistry(registry, getRules());
const relationships = buildReferenceRelationships(index, registry);
const desk: DeskContext = {
  entries: index.entries,
  byId: index.byId,
  activate: () => {},
  openLookup: () => {},
  openSearch: () => {},
  search: () => [],
  contextual: () => [],
  pinnedIds: [],
  recentIds: [],
  touch: () => {},
  togglePin: () => {},
};
const render = (element: ReturnType<typeof createElement>) =>
  renderToStaticMarkup(
    createElement(ReferenceContext.Provider, { value: desk }, element),
  );

test('browsing exposes several stable themes with real, canonical, nonduplicated destinations', () => {
  const groups = referenceThemeGroups(index);
  assert.deepEqual(
    groups.map((g) => g.id),
    REFERENCE_BROWSE_THEMES.map((g) => g.id),
  );
  const ids = groups.flatMap((g) => g.entries.map((e) => e.id));
  assert.equal(new Set(ids).size, ids.length);
  for (const entry of groups.flatMap((g) => g.entries)) {
    assert.equal(index.byId[entry.id], entry);
    assert.ok(entry.available && entry.action);
  }
  for (const theme of REFERENCE_BROWSE_THEMES)
    for (const id of theme.seeds) {
      assert.ok(index.byId[id]?.available, id);
      assert.ok(
        groups
          .find((g) => g.id === theme.id)
          ?.entries.some((e) => e.id === index.byId[id].id),
        id,
      );
    }
});

test('current context promotes useful references while other themes remain browsable', () => {
  for (const selectedId of [
    'oracle:core.weather',
    'oracle:core.reaction',
    'rule:sd.camping-move',
  ]) {
    const companions = referenceCompanions(
      index,
      relationships,
      selectedId,
    ).items;
    const groups = referenceThemeGroups(index, selectedId, companions);
    assert.equal(groups.length, 4);
    const group = groups.find((g) =>
      g.entries.some((e) => e.id === selectedId),
    )!;
    assert.equal(group.entries[0].id, selectedId);
    if (selectedId === 'rule:sd.camping-move')
      assert.equal(group.id, 'journey');
    for (const target of companions) {
      const containing = groups.find((g) =>
        g.entries.some((e) => e.id === target.entry.id),
      );
      if (containing)
        assert.ok(
          containing.entries.findIndex((e) => e.id === target.entry.id) <=
            companions.length,
        );
    }
  }
  assert.deepEqual(
    referenceThemeGroups(index, 'unknown'),
    referenceThemeGroups(index),
  );
});

test('travel phases contain every original destination exactly once and open without pre-rolling', () => {
  const guide = journeyGuidance('rule:sd.travel-day')!;
  assert.deepEqual(
    guide.stages!.flatMap((s) => s.referenceIds),
    guide.links.map((l) => l.id),
  );
  const html = render(
    createElement(JourneyGuidance, { referenceId: 'rule:sd.travel-day' }),
  );
  assert.equal(
    (html.match(/class="play-open-action"/g) || []).length,
    guide.links.length,
  );
  for (const stage of guide.stages!) assert.ok(html.includes(stage.title));
  assert.doesNotMatch(html, /<output|disabled=""/);
});

test('simple follow-up dice expose the action and condition together; manual input remains available', () => {
  const table = registry.tables.find((t) => t.id === 'feretory.roadEvent')!;
  const reading = readingFromOracleRolls(
    table.title,
    [physicalOracleRoll(table, '18', registry)],
    registry,
  );
  const tasks = resultTasks(reading, registry).flatMap((r) => r.tasks);
  assert.ok(tasks.length);
  const before = JSON.stringify(reading);
  const html = render(createElement(ResultFollowThrough, { reading }));
  assert.match(html, /class="result-follow-task"/);
  assert.match(html, /class="play-roll-action"/);
  assert.match(html, /실물 주사위 값 입력/);
  for (const task of tasks) {
    assert.ok(html.includes(task.condition));
    assert.ok(html.includes(task.effect));
  }
  assert.equal(JSON.stringify(reading), before);
});

test('rollable table results retain source identity and the held result', (t) => {
  let rows = 0;
  let tables = 0;
  for (const table of registry.tables.filter(
    (table) => table.rollable !== false && table.entries.length,
  )) {
    tables++;
    const entries =
      process.env.MORK_ALL_RESULT_ROWS === '1'
        ? table.entries
        : [
            ...new Set([
              table.entries[0],
              table.entries.at(-1)!,
              table.entries.reduce((longest, entry) =>
                entry.text.length > longest.text.length ? entry : longest,
              ),
            ]),
          ];
    for (const entry of entries) {
      const roll: OracleRoll = {
        oracleId: table.id,
        title: table.title,
        dice: table.dice,
        roll: entry.min,
        diceValues: [],
        entryId: entry.id,
        text: entry.text,
        source: table.sourceNote ?? '',
        metadata: entry.metadata,
      };
      const reading = readingFromOracleRolls(table.title, [roll], registry);
      const before = JSON.stringify(reading);
      const html = render(
        createElement(ReferenceReadingBlock, {
          reading,
          referenceId: 'oracle:' + table.id,
        }),
      );
      assert.match(html, /class="inline-reading"/, table.id + ':' + entry.id);
      assert.match(html, /COPY/, table.id + ':' + entry.id);
      assert.equal(JSON.stringify(reading), before, table.id + ':' + entry.id);
      assert.doesNotMatch(
        html,
        /\[object Object\]|>NaN</,
        table.id + ':' + entry.id,
      );
      rows++;
    }
  }
  assert.ok(tables > 100 && rows >= tables);
  t.diagnostic(
    `Rendered ${rows} rows from ${tables} rollable tables, with linked actions and conditional follow-through.`,
  );
});
