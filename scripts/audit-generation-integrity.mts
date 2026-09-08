import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { setRules, getRules } from '../src/storage/rulesStore.ts';
import { setOraclePack, getOraclePack } from '../src/storage/oracleStore.ts';
import {
  createDungeonCandidate,
  createRoom,
  loadPreset,
} from '../src/generators/index.ts';
import { generateCharacter } from '../src/generators/character.ts';
import {
  generateMonster,
  generateEatPreyKillMonster,
  loadMonsterPreset,
} from '../src/generators/monster.ts';
import { createNPC, createEncounter } from '../src/generators/content.ts';
import { rollGenericCrawlRoom } from '../src/domain/dungeonCrawl.ts';
import { rollOracle } from '../src/generators/oracleRoller.ts';
import { CREATURE_PROCEDURES } from '../src/generators/creatureProvenance.ts';
import {
  buildCharacterProcedures,
  characterClasses,
} from '../src/generators/characterClasses.ts';
import { DUNGEON_PROCEDURES } from '../src/generators/dungeonProcedures.ts';
import {
  createGenerationValidationContext,
  generationIntegrityReport,
  validateGeneratorProcedures,
} from '../src/validation/generationValidation.ts';
import { REFERENCE_GENERATOR_PROCEDURES } from '../src/domain/referenceGeneratorProcedures.ts';
import { rollTravel } from '../src/domain/campaignProcedures.ts';
import { rollCityReference } from '../src/domain/cityReference.ts';
import { rollJourneyTable } from '../src/domain/journeyProcedure.ts';

const file =
  process.env.MORKBORG_PRIVATE_AUDIT_FIXTURE ??
  'outputs/morkborg-private-data.json';
const fixture = JSON.parse(readFileSync(file, 'utf8'));
setRules(fixture.library);
setOraclePack(fixture.oracles);
const rules = getRules()!,
  registry = buildOracleRegistry(rules, getOraclePack());
const context = createGenerationValidationContext(registry, rules, [
  ...DUNGEON_PROCEDURES,
  ...CREATURE_PROCEDURES,
  ...buildCharacterProcedures(),
  ...REFERENCE_GENERATOR_PROCEDURES,
]);
const regionIds = [
  'sarkash',
  'graven-tosk',
  'kergus',
  'grift',
  'galgenbeck',
  'wastland',
  'valley-undead',
] as const;
const samples: Record<string, unknown[]> = {
  dungeons: [],
  genericRooms: [],
  characters: [],
  monsters: [],
  regionalMonsters: [],
  npcs: [],
  encounters: [],
  oracles: [],
  creaturePresets: [],
  npcPresets: [],
  procedureRuns: [],
};
for (let index = 0; index < 100; index++) {
  const region = regionIds[index % regionIds.length];
  samples.dungeons.push(
    createDungeonCandidate('isolated-integrity-audit', region),
  );
  samples.genericRooms.push(
    index % 2 ? rollGenericCrawlRoom(registry, index % 5) : createRoom(region),
  );
  samples.characters.push(
    generateCharacter(
      'isolated-integrity-audit',
      false,
      index % 2 ? 'classless' : 'random',
    ),
  );
  samples.monsters.push(generateMonster('isolated-integrity-audit'));
  samples.regionalMonsters.push(
    generateEatPreyKillMonster('isolated-integrity-audit', region),
  );
  samples.npcs.push(
    createNPC('isolated-integrity-audit', region, false, registry),
  );
  samples.encounters.push(
    createEncounter(
      'isolated-integrity-audit',
      region,
      index % 2 ? 'rare' : 'common',
      6 + (index % 9),
      false,
      registry,
    ),
  );
}
for (const definition of characterClasses())
  samples.characters.push(
    generateCharacter('isolated-integrity-audit', false, definition.id),
  );
for (const table of registry.tables.filter(
  (table) => table.sourceVerified && table.rollable !== false,
))
  samples.oracles.push(rollOracle(table, registry));
for (const record of rules.creatures.filter(
  (record) => record.presetEligible !== false || record.book === 'feretory',
)) {
  try {
    samples.creaturePresets.push(
      loadMonsterPreset('isolated-integrity-audit', record),
    );
  } catch (error) {
    samples.creaturePresets.push({
      text: error instanceof Error ? error.message : 'Unknown preset failure',
    });
  }
}
for (const record of rules.outcasts)
  samples.npcPresets.push(loadPreset('npcs', record));
for (const rng of [() => 0, () => 0.999999]) {
  const results = [
    ...(['road', 'forage', 'camp', 'off-road'] as const).map((action) =>
      rollTravel(action, registry, rng),
    ),
    rollJourneyTable('feretory.campsite', registry, rng),
    rollJourneyTable('core.weather', registry, rng),
    rollCityReference(
      {
        procedureId: 'aitc.street',
        cityOrMetropolis: true,
        includeExits: true,
      },
      registry,
      rng,
    ),
    rollCityReference(
      { procedureId: 'aitc.notable-artefact-type' },
      registry,
      rng,
    ),
  ];
  samples.procedureRuns.push(...results.map((result) => result.rolls));
}
const report = generationIntegrityReport(samples, context, 'samples');
const procedureIssues = validateGeneratorProcedures(context);
const issues = [...procedureIssues, ...report.issues];
const grouped = new Map<
  string,
  {
    severity: string;
    code: string;
    path: string;
    detail: string;
    count: number;
  }
>();
for (const issue of issues) {
  const path = issue.path.replace(/\[\d+\]/g, '[*]');
  const key = [issue.severity, issue.code, path, issue.detail].join('|');
  const previous = grouped.get(key);
  if (previous) previous.count++;
  else grouped.set(key, { ...issue, path, count: 1 });
}
const inventories = [
  ['dungeon-generation-inventory.json', 'fields'],
  ['creature-generation-inventory.json', 'fields'],
  ['reference-audit.json', 'fieldInventory'],
] as const;
const inventoryRows = inventories.flatMap(([file, key]) => {
  const inventory = JSON.parse(
    readFileSync(`docs/product-integrity/${file}`, 'utf8'),
  );
  return inventory[key] as Array<{
    feature: string;
    field: string;
    classification: string;
  }>;
});
const inventoryClassifications: Record<string, number> = {
  SOURCE_VERBATIM: 0,
  SOURCE_COMPOSED: 0,
  APP_DERIVED: 0,
  USER_AUTHORED: 0,
  UNSOURCED: 0,
};
for (const row of inventoryRows)
  inventoryClassifications[row.classification] =
    (inventoryClassifications[row.classification] ?? 0) + 1;
const referenceAudit = JSON.parse(
  readFileSync('docs/product-integrity/reference-audit.json', 'utf8'),
);
const sourceOnlyCreatures = (
  samples.creaturePresets as Array<{
    name: string;
    fieldProvenance?: { hp?: { status: string; sourceRefs: unknown[] } };
  }>
)
  .filter((creature) => creature.fieldProvenance?.hp?.status === 'UNAVAILABLE')
  .map((creature) => ({
    name: creature.name,
    status: 'UNAVAILABLE',
    sourceRefs: creature.fieldProvenance!.hp!.sourceRefs,
    reason:
      'No applicable ordinary HP statblock; source identity and actual source rules remain available.',
  }));
const output = {
  generatedAt: new Date().toISOString(),
  sourceValidationMeaning:
    'Canonical source resolution and declared-origin validation. VERIFIED metadata is not a claim that this utility reread PDF text. PARTIAL, CONFLICT and UNAVAILABLE are separately retained.',
  generatorInventory: {
    countingUnit:
      'Documented field/source-route rows, including class/preset variants. This is separate from canonical source-entry count and runtime generated sample groups.',
    rows: inventoryRows.length,
    featureFieldPaths: new Set(
      inventoryRows.map((row) => `${row.feature}.${row.field}`),
    ).size,
    classifications: inventoryClassifications,
    files: inventories.map(([file]) => file),
  },
  explicitRemainingSourceCases: [
    ...referenceAudit.unresolvedSourceMaterial,
    ...sourceOnlyCreatures,
    {
      source: 'FERETORY PDF2, The Monster Approaches',
      status: 'CONFLICT',
      reason:
        'HP prose says double one damage-die result; the parenthetical 2dN example has a different distribution. Prose followed; conflict retained.',
    },
    {
      source: 'FERETORY PDF2, The Monster Approaches',
      status: 'PARTIAL',
      reason:
        'Highest A/B/C ties have no printed armor tiebreak. Referee choices retained; no extra roll invented.',
    },
    {
      source: 'Solitary Defilement PDF19 / printed17',
      status: 'UNAVAILABLE',
      reason:
        'Rare d8 + Dungeon DR may exceed the printed 1–20 stock-creature table. Empty explicit unresolved result; no clamp or fictional encounter.',
    },
  ],
  sampleCounts: Object.fromEntries(
    Object.entries(samples).map(([key, values]) => [key, values.length]),
  ),
  specialRoomCount: 400,
  fieldsAudited: report.fieldsAudited,
  countingUnit: report.countingUnit,
  classifications: report.counts,
  sourceStatuses: report.statuses,
  sourceStatusCountingUnit:
    'Only source-origin values. Blank/manual USER_AUTHORED fields are excluded from missing-source counts.',
  proceduresChecked: context.procedures.size,
  errors: [...grouped.values()].filter((issue) => issue.severity === 'error'),
  warnings: [...grouped.values()].filter(
    (issue) => issue.severity === 'warning',
  ),
};
mkdirSync('docs/product-integrity', { recursive: true });
mkdirSync('outputs/product-integrity', { recursive: true });
writeFileSync(
  'docs/product-integrity/generation-integrity-report.json',
  JSON.stringify(output, null, 2) + '\n',
);
writeFileSync(
  'outputs/product-integrity/generation-integrity-samples.json',
  JSON.stringify(samples, null, 2),
);
console.log(
  JSON.stringify(
    {
      ...output,
      warnings: output.warnings.length,
      errors: output.errors.slice(0, 70),
    },
    null,
    2,
  ),
);
if (output.errors.length) process.exitCode = 1;
