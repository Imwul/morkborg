import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ruleFaithfulResult,
  orakleSelection,
  orakleChallengeDR,
} from '../src/generators/ruleFaithfulReferences.ts';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import {
  buildReferenceRegistry,
  searchReferences,
} from '../src/domain/references.ts';
import { setRules, type RulesPack } from '../src/storage/rulesStore.ts';
import type { OraclePack } from '../src/domain/oracle.ts';
import { executeReference } from '../src/domain/referenceExecution.ts';
import { mergeOracleTranslations } from '../src/storage/privateUpdates.ts';
import { createPublishedDataClient } from '../src/storage/publishedDataClient.ts';
import { mergePublishedPacks } from '../src/storage/publishedDataMerge.ts';
import { readRowRelationships } from '../src/domain/rowRelationships.ts';
import { defaultMythicState } from '../src/domain/mythic.ts';
import { resolveScene } from '../src/generators/mythic.ts';
import { mythicStateSchema } from '../src/storage/mythicSchema.ts';
import {
  emptyMythicLists,
  validateMythicLists,
  preparedMythicFocusList,
} from '../src/domain/mythicLists.ts';
import {
  oracleSourceFingerprint,
  ORACLE_SOURCE_ATTESTATIONS,
} from '../src/data/oracles/sourceEvidence.ts';
const bundle = JSON.parse(
  readFileSync('outputs/morkborg-private-data.json', 'utf8'),
) as { library: RulesPack; oracles: OraclePack };
setRules(bundle.library);
const registry = buildOracleRegistry(bundle.library, bundle.oracles);
const references = buildReferenceRegistry(registry, bundle.library);
const sequence = (values: number[]) => {
  let i = 0;
  return () => {
    if (i >= values.length) throw new Error('unexpected extra roll');
    return values[i++];
  };
};
test('Brute skill guidance acknowledges the explicit PDF24 d6 without changing the selection-only reader', () => {
  const table = registry.tables.find(
    (t) => t.id === 'reclvse.class.brute.powers',
  )!;
  assert.match(table.sourceNote!, /PDF24 explicitly says/);
  assert.ok(!table.sourceNote!.includes('No explicit D6 token'));
  assert.equal(table.dice, 'd6');
  assert.equal(table.rollable, false);
});
test('RECLVSE city discoveries on PDF106 remain in city, before wilderness PDF107', () => {
  for (const id of [
    'social_discoveries',
    'physical_signs_of_trouble',
    'signs_of_the_undercity',
  ]) {
    assert.deepEqual(references.byId[`oracle:reclvse.${id}`].contexts, [
      'city',
    ]);
  }
  assert.ok(
    !references.byId['oracle:reclvse.temperature'].contexts.includes('city'),
  );
});
test('RECLVSE class references retain mandatory downsides from PDF20–30', () => {
  const table = registry.tables.find((t) => t.id === 'reclvse.classRules')!;
  assert.equal(table.entries.length, 6);
  for (const row of table.entries) {
    const blocks = row.metadata!.blocks as {
      title: string;
      text: string;
      translation?: { ko?: string };
    }[];
    const downside = blocks.find((b) => b.title === 'Downside · 약점');
    assert.ok(downside, row.id);
    assert.ok(downside.translation?.ko, row.id);
  }
  const blocksFor = (suffix: string) =>
    (
      table.entries.find((r) => r.id.endsWith(`:${suffix}`))!.metadata!
        .blocks as { title: string; text: string }[]
    ).find((b) => b.title === 'Downside · 약점')!.text;
  assert.match(blocksFor('venom'), /Every night, test Presence DR10/);
  assert.match(blocksFor('vessel'), /7 cracks/);
  assert.match(blocksFor('beast'), /On a 1/);
});
test('audited RECLVSE corrections reach existing installations without replacing user edits', () => {
  const previous = structuredClone(bundle.oracles);
  const mist = previous.tables.find((t) => t.id === 'reclvse.precipitation')!;
  mist.title = 'My weather table';
  mist.entries[2].text = 'Mist (roll twice)';
  mist.entries[2].metadata!.ko = '안개(두 번 굴림)';
  const classes = previous.tables.find((t) => t.id === 'reclvse.classRules')!;
  for (const row of classes.entries)
    row.metadata!.blocks = (row.metadata!.blocks as { title: string }[]).filter(
      (b) => b.title !== 'Downside · 약점',
    );
  const merged = mergeOracleTranslations(previous, bundle.oracles);
  const corrected = merged.tables.find((t) => t.id === mist.id)!;
  assert.equal(corrected.title, 'My weather table');
  assert.equal(corrected.entries[2].text, 'Mist');
  assert.equal(corrected.entries[2].metadata!.ko, '안개');
  for (const row of merged.tables.find((t) => t.id === classes.id)!.entries)
    assert.equal((row.metadata!.blocks as unknown[]).length, 3);
  const edited = structuredClone(previous);
  edited.tables.find((t) => t.id === mist.id)!.entries[2].text = 'My own mist';
  assert.equal(
    mergeOracleTranslations(edited, bundle.oracles).tables.find(
      (t) => t.id === mist.id,
    )!.entries[2].text,
    'My own mist',
  );
  const unverified = structuredClone(bundle.oracles);
  unverified.tables.find((t) => t.id === mist.id)!.entries[2].text =
    'Unverified change';
  assert.equal(
    mergeOracleTranslations(previous, unverified).tables.find(
      (t) => t.id === mist.id,
    )!.entries[2].text,
    'Mist (roll twice)',
  );
});
test('an already acknowledged revision repairs superseded source tables and preserves other packs', async () => {
  const previous = structuredClone(bundle.oracles);
  const mist = previous.tables.find((t) => t.id === 'reclvse.precipitation')!;
  mist.entries[2].text = 'Mist (roll twice)';
  mist.entries[2].metadata!.ko = '안개(두 번 굴림)';
  for (const row of previous.tables.find((t) => t.id === 'reclvse.classRules')!
    .entries)
    row.metadata!.blocks = (row.metadata!.blocks as { title: string }[]).filter(
      (b) => b.title !== 'Downside · 약점',
    );
  const stored = {
    library: bundle.library,
    oracles: previous,
    fateChart: { fixture: 'untouched' },
    serverConnection: { schemaVersion: 1, revision: 123, enabled: true },
  };
  let persisted: Record<string, unknown> | undefined;
  let activated: { oracles?: OraclePack } | undefined;
  const client = createPublishedDataClient({
    read: async (key) => stored[key as keyof typeof stored],
    persist: async (next) => {
      persisted = next;
    },
    active: () => ({}),
    generation: () => 0,
    fetch: async (path) => {
      assert.equal(path, '/api/rulebook-data?revision=0');
      return {
        schemaVersion: 1,
        revision: 123,
        bundle: {
          library: bundle.library,
          oracles: bundle.oracles,
          fateChart: { fixture: 'incoming' },
        },
      };
    },
    parse: (input) => input as never,
    merge: mergePublishedPacks,
    validate: () => {},
    activate: (packs) => {
      activated = packs;
    },
  });
  await client.check(true);
  assert.ok(persisted?.oracles);
  assert.equal(
    persisted?.library,
    undefined,
    'repair commits only corrected oracle pack',
  );
  assert.equal(
    activated?.oracles?.tables.find((t) => t.id === mist.id)!.entries[2].text,
    'Mist',
  );
  assert.deepEqual(
    (activated as Record<string, unknown>).fateChart,
    stored.fateChart,
  );
});
test('complete classless PC has essentials and scroll-dependent starting arms', () => {
  const p = registry.procedures.find(
    (p) => p.id === 'character.core-classless',
  )!;
  for (let seed = 0; seed < 150; seed++) {
    let state = seed + 1;
    const rng = () => {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 4294967296;
    };
    const result = ruleFaithfulResult(p, registry, {}, rng)!;
    for (const title of [
      'Name',
      'Class',
      'Strength',
      'Agility',
      'Presence',
      'Toughness',
      'HP',
      'Silver',
      'Food',
      'Equipment',
    ])
      assert.ok(
        result.rolls.some((r) => r.title === title),
        title,
      );
    assert.ok(Number(result.rolls.find((r) => r.title === 'HP')!.text) >= 1);
    assert.equal(
      result.rolls.some((r) => r.title === 'Omens'),
      false,
      'optional rule is opt-in',
    );
    const scroll = result.rolls.some((r) =>
      ['core.sacred', 'core.unclean'].includes(r.oracleId),
    );
    assert.equal(
      result.rolls.find((r) => r.oracleId === 'core.weapons')!.dice,
      scroll ? 'd6' : 'd10',
    );
    assert.equal(
      result.rolls.find((r) => r.oracleId === 'core.armor')!.dice,
      scroll ? 'd2' : 'd4',
    );
    if (scroll)
      assert.ok(result.rolls.some((r) => r.title === 'Power uses/day'));
  }
  const boosted = ruleFaithfulResult(
    p,
    registry,
    { classlessBoost: ['strength', 'presence'], coreOmens: true },
    () => 0.99,
  )!;
  assert.equal(
    boosted.rolls.find((r) => r.title === 'Strength')!.diceValues.length,
    4,
  );
  assert.equal(
    boosted.rolls.find((r) => r.title === 'Agility')!.diceValues.length,
    3,
  );
  assert.equal(boosted.rolls.find((r) => r.title === 'Strength')!.text, '+3');
  assert.ok(boosted.rolls.some((r) => r.title === 'Omens'));
  assert.throws(() =>
    ruleFaithfulResult(p, registry, { classlessBoost: ['strength'] }),
  );
});
test('Orakle selects extrema, stacks events and resolves a final answer with optional capped DR', () => {
  assert.equal(orakleSelection([7, 19], 'likely'), 19);
  assert.equal(orakleSelection([7, 19], 'unlikely'), 7);
  assert.equal(orakleSelection([7, 19, 2], 'very-unlikely'), 2);
  const p = { id: 'orakle', title: 'Orakle', oracleIds: ['depths.orakle'] };
  const result = ruleFaithfulResult(
    p,
    registry,
    { orakleDR: true, orakleTR: 15 },
    sequence([0.475, 0, 0, 0.475, 0, 0, 0.925]),
  )!;
  assert.deepEqual(
    result.rolls
      .filter((r) => r.oracleId === 'depths.orakle')
      .map((r) => r.roll),
    [10, 10, 19],
  );
  assert.equal(
    result.rolls.filter((r) => r.oracleId === 'depths.randomEventFocus').length,
    2,
  );
  assert.match(result.rolls.at(-1)!.text, /DR 18/);
  assert.equal(orakleChallengeDR(11, 9), 8);
  assert.equal(orakleChallengeDR(20, 15), 18);
  const no = ruleFaithfulResult(p, registry, { orakleDR: true }, () => 0.05)!;
  assert.doesNotMatch(no.rolls[0].text, /Challenge DR/);
});
test('Weather selects 1–3 tables and leaves unnatural follow-up optional', () => {
  const p = registry.procedures.find((p) => p.id === 'reclvse.weather-detail')!;
  const result = ruleFaithfulResult(
    p,
    registry,
    { weatherDetails: ['reclvse.wind'] },
    () => 0.99,
  )!;
  assert.equal(result.rolls.length, 1);
  assert.deepEqual(result.rolls[0].metadata?.followUpOracleIds, [
    'reclvse.unnatural_weather',
  ]);
  assert.throws(() => ruleFaithfulResult(p, registry, { weatherDetails: [] }));
  assert.throws(() =>
    ruleFaithfulResult(p, registry, { weatherDetails: p.oracleIds }),
  );
  const mist = ruleFaithfulResult(
    p,
    registry,
    { weatherDetails: ['reclvse.precipitation'] },
    sequence([0.12]),
  )!;
  // Freshly supplied first-edition PDF107: Mist has no repeat instruction.
  assert.equal(mist.rolls.length, 1);
  assert.equal(mist.rolls[0].text, 'Mist');
  assert.equal(mist.rolls[0].metadata?.ko, '안개');
  const temperature = ruleFaithfulResult(
    p,
    registry,
    { weatherDetails: ['reclvse.temperature'] },
    sequence([0.99, 0, 0.5]),
  )!;
  assert.deepEqual(
    temperature.rolls.map((r) => r.roll),
    [20, 1, 11],
  );
  assert.ok(
    temperature.rolls.every((r) => r.oracleId === 'reclvse.temperature'),
  );
  const precipitation = ruleFaithfulResult(
    p,
    registry,
    { weatherDetails: ['reclvse.precipitation'] },
    sequence([0.99, 0]),
  )!;
  assert.deepEqual(
    precipitation.rolls.map((r) => r.roll),
    [20, 1],
  );
});
test('Buildings rolls d2 material count, each material and Other follow-up independently', () => {
  const p = registry.procedures.find((p) => p.id === 'sd.buildings')!;
  const result = ruleFaithfulResult(
    p,
    registry,
    {},
    sequence([0.99, 0.99, 0, 0, 0, 0, 0]),
  )!;
  assert.equal(result.rolls[0].roll, 2);
  assert.equal(
    result.rolls.filter(
      (r) => r.entryId && r.oracleId === 'sd.building.material',
    ).length,
    2,
  );
  for (const table of [
    'sd.material.quality',
    'sd.material.composition',
    'sd.building.size',
    'sd.building.form',
  ])
    assert.ok(result.rolls.some((r) => r.oracleId === table));
});
test('named definitions, classes and all twelve relic effects resolve without reintroducing removed scenarios', () => {
  for (const name of [
    'Party Chef',
    'Grace of the Stillborn Saint',
    'Dream Theory',
    'Mercy’s Bane',
    'Grief Engine',
    'Prison Collar',
    'Forlorn Philosopher',
    'Defiler',
  ])
    assert.ok(
      searchReferences(references, name).some((e) => e.title === name),
      name,
    );
  const relic = registry.tables.find((t) => t.id === 'reclvse.relics')!;
  assert.equal(relic.entries.length, 12);
  assert.match(relic.entries[0].text, /DR14.*D6 rounds/);
  for (const tid of [
    'reclvse.relics',
    'reclvse.classRules',
    'sd.stockCreatures',
    'heretic.unheroicFeats',
    'reclvse.powers',
    'feretory.ochreTablets',
    'feretory.tenebrousReliquary',
    'sd.building.material',
  ]) {
    const t = registry.tables.find((t) => t.id === tid)!;
    assert.equal(t.sourceStatus, 'VERIFIED', tid);
    assert.equal(
      ORACLE_SOURCE_ATTESTATIONS[tid].fingerprint,
      oracleSourceFingerprint(t),
      tid,
    );
  }
  assert.equal(references.byId['oracle:feretory.minorTreasures'], undefined);
});
test('all Stock Creatures named results point to the inspected statblock', () => {
  const table = registry.tables.find((t) => t.id === 'sd.stockCreatures')!;
  // SD PDF11 names these species. Bare Bones PDF59–62 identifies the
  // corresponding named statblocks; target availability alone is insufficient.
  const correctedTargets: Record<number, string> = {
    5: 'creature:core:60:belze',
    6: 'creature:core:61:nodh',
    12: 'creature:core:62:aland',
    17: 'creature:core:59:zukuma',
    18: 'creature:core:62:eulotha',
    20: 'creature:core:60:arbint',
  };
  for (const row of table.entries.slice(1)) {
    const edge = readRowRelationships(row.metadata, table.id).find(
      (e) => e.kind === 'FOLLOW-UP',
    );
    assert.ok(edge, row.text);
    assert.ok(references.byId[edge!.targetId]?.available, row.text);
    if (correctedTargets[row.min])
      assert.equal(edge!.targetId, correctedTargets[row.min], row.text);
  }
});
test('prepared Mythic preserves Expected Scene and legacy lists migrate without losing contents', () => {
  const state = {
    ...defaultMythicState(),
    sceneMode: 'prepared' as const,
    scene: 'Enter the tomb',
  };
  for (let face = 1; face <= 10; face++) {
    const result = resolveScene(state, face);
    assert.equal(result.answer, 'expected');
    assert.equal(result.randomEvent, face <= 5);
    assert.equal(result.question, 'Enter the tomb');
    assert.equal(result.sceneMode, 'prepared');
    assert.ok(
      mythicStateSchema.safeParse({ ...state, history: [result] }).success,
    );
  }
  const lists = emptyMythicLists();
  delete lists.features;
  lists.characters[0] = 'Old NPC';
  const migrated = validateMythicLists(lists);
  assert.equal(migrated.characters[0], 'Old NPC');
  assert.equal(migrated.features!.length, 25);
  for (const [roll, kind] of [
    [1, 'features'],
    [20, 'features'],
    [21, 'characters'],
    [55, 'characters'],
    [56, null],
    [100, null],
  ] as const)
    assert.equal(preparedMythicFocusList(roll), kind);
});
test('optional EPK mundane prey has no fabricated combat values', () => {
  const result = executeReference(references.byId['procedure:workbench.epk'], {
    registry,
    rules: bundle.library,
    region: 'sarkash',
    stockKind: 'common',
    stockDR: 10,
    cityLarge: false,
    cityExits: true,
    huntingDie: 12,
    rng: () => 0.99,
  })!;
  assert.equal(result.title, 'Mundane prey');
  assert.match(result.blocks[0].dice!, /d12 = 12/);
  assert.ok(
    !result.blocks.some((b) => ['HP', 'Armor', 'Attack'].includes(b.title)),
  );
});
