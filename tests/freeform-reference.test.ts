import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  REFERENCE_SHELVES,
  shelfReferences,
} from '../src/domain/freeformReference.ts';
import {
  buildReferenceRegistry,
  searchReferences,
} from '../src/domain/references.ts';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { executeReference } from '../src/domain/referenceExecution.ts';
import { setRules, getRules } from '../src/storage/rulesStore.ts';
import { setOraclePack, getOraclePack } from '../src/storage/oracleStore.ts';
import { createCampaign } from '../src/generators/index.ts';
import { JourneyWorkbench } from '../src/components/JourneyWorkbench.tsx';
import { PlayMode } from '../src/components/PlayMode.tsx';
import { CityCrawlWorkspace } from '../src/components/CityCrawlWorkspace.tsx';
import { DungeonCrawlWorkspace } from '../src/components/DungeonCrawlWorkspace.tsx';
import { rollRoadNavigation } from '../src/domain/journeyProcedure.ts';
import {
  rollOracle,
  selectOracleEntry,
} from '../src/generators/oracleRoller.ts';

const fixturePath =
  process.env.MORKBORG_PRIVATE_AUDIT_FIXTURE ??
  'outputs/morkborg-private-data.json';
const hasFixture = existsSync(fixturePath);
function installed() {
  const data = JSON.parse(readFileSync(fixturePath, 'utf8'));
  setRules(data.library);
  setOraclePack(data.oracles);
  const rules = getRules()!,
    registry = buildOracleRegistry(rules, getOraclePack());
  return { rules, registry, index: buildReferenceRegistry(registry, rules) };
}

test('journey/city/dungeon engines no longer export advancement or completion operations', async () => {
  const journey = await import('../src/domain/journeyProcedure.ts');
  const city = await import('../src/domain/cityCrawlWorkspace.ts');
  const dungeon = await import('../src/domain/dungeonCrawl.ts');
  for (const [module, names] of [
    [
      journey,
      [
        'emptyJourneyDay',
        'journeyReadyForEncounters',
        'journeyReadyToFinish',
        'readJourneyDay',
      ],
    ],
    [
      city,
      [
        'startCityCrawl',
        'advanceCityCrawl',
        'finishCityScene',
        'resolveCityObstacle',
      ],
    ],
    [
      dungeon,
      [
        'prepareDungeonCrawl',
        'advanceDungeonCrawl',
        'completeDungeonRoom',
        'resolveDungeonTransitionDanger',
      ],
    ],
  ] as const)
    for (const name of names) assert.equal(name in module, false, name);
  assert.equal(existsSync('src/storage/cityCrawlStore.ts'), false);
});

test(
  'all primary reference screens render without a campaign, session, or persistence',
  { skip: !hasFixture },
  () => {
    installed();
    for (const Component of [
      JourneyWorkbench,
      PlayMode,
      CityCrawlWorkspace,
      DungeonCrawlWorkspace,
    ]) {
      const html = renderToStaticMarkup(createElement(Component, {}));
      assert.match(html, /Reference Desk/);
      assert.doesNotMatch(html, /reference-card-grid|reference-shelves/);
      assert.doesNotMatch(
        html,
        /다음 단계|진행 중|NEXT DAWN|encountersResolved|현재 거리|모험 시작|해결했습니다/,
      );
      assert.doesNotMatch(html, /<button[^>]*\sdisabled(?:=|\s|>)/);
    }
  },
);

test(
  'legacy shelf metadata remains connected to real registry references',
  { skip: !hasFixture },
  () => {
    const { index } = installed();
    for (const [key, shelf] of Object.entries(REFERENCE_SHELVES)) {
      assert.equal(
        shelfReferences(key as keyof typeof REFERENCE_SHELVES, index).length,
        new Set(shelf.ids.map((id) => index.byId[id]?.id)).size,
      );
      for (const id of shelf.ids) assert.ok(index.byId[id], id);
    }
  },
);

test(
  'A/B/C: Weather, Corpse and Tracks are independently searchable and callable',
  { skip: !hasFixture },
  () => {
    const { registry, rules, index } = installed();
    for (const [query, id] of [
      ['Weather', 'oracle:core.weather'],
      ['Corpse', 'oracle:core.corpsePlundering'],
      ['Animal Tracks', 'rule:sd.leaving-road'],
      ['Broken Road', 'rule:sd.leaving-road'],
    ])
      assert.ok(
        searchReferences(index, query, { limit: 20 }).some(
          (entry) => entry.id === id,
        ),
        query,
      );
    assert.equal(typeof rollRoadNavigation(0, () => 0).success, 'boolean');
    for (const id of ['oracle:core.weather', 'oracle:core.corpsePlundering'])
      assert.ok(
        executeReference(index.byId[id], {
          registry,
          rules,
          region: 'sarkash',
          stockKind: 'common',
          stockDR: 12,
          rng: () => 0,
        })?.oracle?.rolls.length,
      );
  },
);

test(
  'D/E/F: inspection and out-of-order rolls never mutate campaign, source registry, or availability',
  { skip: !hasFixture },
  () => {
    const { registry, rules, index } = installed();
    const campaign = createCampaign('External paper session');
    campaign.campaignDay = 900;
    campaign.notes = 'Keep my notebook';
    const before = JSON.stringify({ campaign, registry });
    const available = shelfReferences('travel', index).map((e) => [
      e.id,
      e.available,
    ]);
    for (const id of [
      'oracle:feretory.campsite',
      'oracle:core.reaction',
      'oracle:feretory.roadEvent',
      'oracle:core.miseries',
      'oracle:core.weather',
      'oracle:feretory.leaveRoad',
    ]) {
      assert.ok(index.byId[id].sourceRefs.length, id);
      assert.ok(
        executeReference(index.byId[id], {
          registry,
          rules,
          region: 'sarkash',
          stockKind: 'common',
          stockDR: 12,
          rng: () => 0,
        }),
        id,
      );
    }
    assert.deepEqual(
      shelfReferences('travel', index).map((e) => [e.id, e.available]),
      available,
    );
    assert.equal(JSON.stringify({ campaign, registry }), before);
  },
);

test(
  'Disaster routes only to the Core d66; wrong book, die, or extra results are rejected',
  { skip: !hasFixture },
  () => {
    const { registry, index } = installed();
    const table = registry.tables.find((t) => t.id === 'core.miseries')!;
    assert.equal(table.sourceBookId, 'core');
    assert.equal(table.dice, 'd66');
    assert.equal(table.entries.length, 36);
    assert.ok(
      searchReferences(index, 'Disaster', { limit: 10 }).some(
        (e) => e.id === 'oracle:core.miseries',
      ),
    );
    for (const id of ['rule:core.miseries', 'oracle:core.miseries'])
      assert.ok(!index.byId[id].relatedIds.includes('rule:sd.daily-misery'));
    for (const patch of [
      { sourceBookId: 'sd' },
      { dice: 'd100' },
      {
        entries: [...table.entries, { ...table.entries[0], min: 77, max: 77 }],
      },
    ])
      assert.throws(
        () => rollOracle({ ...table, ...patch }, registry, () => 0),
        /Core/,
      );
    assert.throws(() => selectOracleEntry(table, 77), /범위/);
  },
);
