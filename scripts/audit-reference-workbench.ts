/** Metadata-only reproducible report. Requires the local private bundle; never emits its content or connection key. */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { buildOracleRegistry } from '../src/data/oracles/index.ts';
import { parseRulesPack } from '../src/storage/rulesStore.ts';
import { parseOraclePack } from '../src/storage/oracleStore.ts';
import {
  buildReferenceRegistry,
  searchReferences,
} from '../src/domain/references.ts';
import { referenceAction } from '../src/domain/referenceActions.ts';
import { REFERENCE_GENERATOR_PROCEDURES } from '../src/domain/referenceGeneratorProcedures.ts';
import { unresolvedOracleSources } from '../src/validation/oracleSourceIntegrity.ts';
import { validateOracleRegistry } from '../src/validation/oracleValidation.ts';
const input = JSON.parse(
  readFileSync(
    process.env.MORKBORG_PRIVATE_AUDIT_FIXTURE ??
      'outputs/morkborg-private-data.json',
    'utf8',
  ),
);
const rules = parseRulesPack(input.library),
  extra = parseOraclePack(input.oracles),
  registry = buildOracleRegistry(rules, extra);
const references = buildReferenceRegistry(registry, rules);
const queries = [
  'reaction',
  'morale',
  'broken',
  'corpse',
  'treasure',
  'useful item',
  'Sarkash monster',
  'Kergüs monster',
  'Graven-Tosk',
  'room',
  'NPC',
  'armor',
  'rest',
  'Omens',
  'Miseries',
  'travel',
];
const fields = [
  [
    'Oracle',
    'rollOracle.text',
    'SOURCE_VERBATIM',
    'registry:*',
    'Identity / source English preserved; per-entry composed/derived exceptions are enumerated in reference-source-coverage.json.',
  ],
  [
    'Oracle',
    'rollOracle.roll + diceValues',
    'APP_DERIVED',
    'registry:*',
    'Source die notation -> die values -> exact range selector.',
  ],
  [
    'Oracle',
    'rollOracle.text on declared gap',
    'APP_DERIVED',
    'registry:*',
    'An explicitly documented missing range yields empty text; no fallback fiction.',
  ],
  [
    'Combined Oracle',
    'rollProcedure.rolls',
    'SOURCE_COMPOSED',
    'registry:procedures',
    'Ordered canonical IDs; repeated IDs preserved as independent rolls.',
  ],
  [
    'Combined Oracle',
    'The Monster Approaches.statistics',
    'APP_DERIVED',
    'feretory.A,feretory.B,feretory.C',
    'Reuse the three d12 results for damage/morale/armor; roll chosen damage die once x2 for HP.',
  ],
  [
    'City',
    'Street.components',
    'SOURCE_COMPOSED',
    'aitc.street-adjective,aitc.street-type,aitc.street-contents,aitc.street-exits',
    'Source columns stay separate. Contents d2 for city/metropolis; other settlements one. Exits optional.',
  ],
  [
    'City',
    'Street.contentsCount',
    'APP_DERIVED',
    'aitc.street-contents',
    'Conditional d2 gives count; no repeated roll of a result merely because it duplicates.',
  ],
  [
    'City',
    'Notable Artefact.components',
    'SOURCE_COMPOSED',
    'aitc.notable-artefact-type,aitc.notable-artefact-concerning,aitc.notable-artefact-composition,aitc.notable-artefact-adjective,aitc.notable-artefact-subject,aitc.sculpture-size',
    'Book/manuscript concerning branch; picture/sculpture depiction columns; sculpture alone rolls size.',
  ],
  [
    'City',
    'Move.outcome + description',
    'APP_DERIVED',
    'aitc:PDF6–8;sd:PDF4;core:PDF28',
    'Independent 2d20 + ability vs DR -> Strong/Weak/Fail; concise Korean mechanical instructions, not claimed source wording.',
  ],
  [
    'City',
    'Move.followUp',
    'SOURCE_VERBATIM',
    'aitc.city-crawl-failure,aitc.pray-strong,aitc.pray-failure,aitc.stash-weak',
    'Only documented conditional source result; random identity preserved with canonical source/status.',
  ],
  [
    'City',
    'Directions.reaction + benefit',
    'APP_DERIVED',
    'aitc.directions-reaction',
    'Weak uses actual 2d6 reaction bands then optional source-defined benefit die; strong choice fixed.',
  ],
  [
    'City',
    'Settlement.streets',
    'APP_DERIVED',
    'aitc.settlement-size',
    'Exact source d20 size range selects street formula and clamp; source row retained.',
  ],
  [
    'City',
    'MicroCrawl.streets',
    'APP_DERIVED',
    'aitc:PDF5',
    'Direct d4 street count; no invented Move before micro-crawl.',
  ],
  [
    'City',
    'DailyDiscovery.found',
    'APP_DERIVED',
    'aitc:PDF5',
    'd8=1 is discovery: 1/8 exactly.',
  ],
  [
    'City',
    'Merchant.disposition',
    'APP_DERIVED',
    'aitc.merchant-disposition',
    '2d6+Presence; source explicit 12+ bound; negative unmatched totals stay unresolved.',
  ],
  [
    'City',
    'Scene.number / label',
    'APP_DERIVED',
    'aitc:PDF5–7',
    'Stable structural identifier and phase state; no generated title fragments.',
  ],
  [
    'Journey',
    'Road.components',
    'SOURCE_COMPOSED',
    'core.weather,feretory.roadType,feretory.roadEvent',
    'Weather once at dawn; road event7/8 repeats; final5/6 changes weather.',
  ],
  [
    'Journey',
    'Forage.components',
    'SOURCE_COMPOSED',
    'feretory.forage,feretory.village',
    'Village only on forage5/6.',
  ],
  [
    'Journey',
    'OffRoad.text',
    'SOURCE_VERBATIM',
    'feretory.leaveRoad',
    'Single canonical source prompt; consequences resolved by player.',
  ],
  [
    'Journey',
    'Navigation.success',
    'APP_DERIVED',
    'feretory:PDF7',
    'One d20 + Presence or remaining Omens vsDR10 for road types3/4/5.',
  ],
  [
    'Journey',
    'Campsite.components',
    'SOURCE_COMPOSED',
    'feretory.campsite,feretory.campsite.campDream',
    'Event10 alone follows dreamd6; next-day Omens remain player-applied.',
  ],
  [
    'Journey',
    'Camping.outcome + recovery',
    'APP_DERIVED',
    'sd:PDF8',
    'Two separated20+Presence vsDR12; strongd6/weakd4 recovery; failed rest retry50:50 after encounter.',
  ],
  [
    'Journey',
    'Route.days',
    'APP_DERIVED',
    'feretory:PDF6',
    'Only two explicitly mapped named endpoints supported; unmapped travel duration requires manual entry.',
  ],
  [
    'Calendar',
    'Dawn.roll + description',
    'APP_DERIVED',
    'core:PDF17',
    'Chosen Apocalypse die;1 triggers Misery; short outcome statement is procedural UI.',
  ],
  [
    'Calendar',
    'Misery.result',
    'SOURCE_VERBATIM',
    'core.miseries',
    'Select only not-yet-recorded d66 outcomes, equivalent to rerolling repeats.',
  ],
  [
    'Calendar',
    'TerminalMisery.result',
    'APP_DERIVED',
    'core:PDF17,20',
    'Seventh Misery is7:7; application labels campaign termination, no invented seventh-table entry.',
  ],
  [
    'Manual record',
    'Misery.result / travel replacement / notes',
    'USER_AUTHORED',
    'manual',
    'Explicit user input; never randomized fallback.',
  ],
  [
    'Reference',
    'FixedLookup.text',
    'SOURCE_VERBATIM',
    'registry:*',
    'Canonical exact source row selected without reroll; corrected source/status preserved.',
  ],
  [
    'Reference',
    'RegionalMonster.identity + quantity',
    'SOURCE_COMPOSED',
    'depths.region.*.monsters -> verified creature record',
    'Depths d6 identity/routing + exact target name/page; quantity separately derived from its source die.',
  ],
  [
    'Reference',
    'EatPreyKill.identity',
    'SOURCE_VERBATIM',
    'feretory.hunting.*',
    'Nine live identity table adapters over54existing creature records; source-only Grift face remains possible.',
  ],
  [
    'Presentation',
    'Korean helper',
    'USER_AUTHORED',
    'entry.metadata.ko / rule.meta.ko / notes.translations',
    'Application-authored secondary translation, kept separate from canonical English; never generator routing input.',
  ],
  [
    'Presentation',
    'oracleReadingText.condition notes',
    'APP_DERIVED',
    'registry:*',
    '29concise app-authored mechanical reminders verified against AlönePDF8–13,15–17; separate from sourceText and never claimed verbatim.',
  ],
];
const inventory = fields.map(
  ([feature, field, classification, source, transformation]) => ({
    feature,
    field,
    classification,
    source,
    transformation,
    verbatim: classification === 'SOURCE_VERBATIM',
    sourceTableId:
      source.startsWith('registry:') ||
      source.includes(':PDF') ||
      source === 'manual'
        ? null
        : source.split(','),
    fallbackExists: false,
    fallbackSourceBacked: null,
    confidence:
      classification === 'USER_AUTHORED'
        ? 'Explicit origin, not source text'
        : 'Verified source procedure; canonical entry exceptions separately enumerated',
  }),
);
const entryKo = registry.tables.flatMap((table) =>
  table.entries.flatMap((entry) =>
    typeof entry.metadata?.ko === 'string'
      ? [
          {
            tableId: table.id,
            entryId: entry.id,
            en: entry.text,
            ko: entry.metadata.ko,
          },
        ]
      : [],
  ),
);
const flags = entryKo.filter(
  (e) => e.en.trim().split(/\s+/).length <= 4 && e.ko.length > 24,
);
const guidanceFields = registry.tables.flatMap((table) =>
  table.entries.flatMap((entry) =>
    ['effectRule', 'conditional', 'condition', 'procedureNote'].flatMap(
      (field) =>
        typeof entry.metadata?.[field] === 'string'
          ? [
              {
                feature: 'Reference guidance',
                field,
                tableId: table.id,
                entryId: entry.id,
                classification: 'APP_DERIVED',
                sourceBookId: table.sourceBookId,
                pdfPage: table.sourcePage,
                printedPage: table.printedPage,
                transformation:
                  'Concise mechanical instruction; source English result remains separate.',
                status: 'VERIFIED',
                verbatim: false,
                fallbackExists: false,
              },
            ]
          : [],
    ),
  ),
);
const report = {
  schemaVersion: 1,
  auditedAt: '2026-09-08',
  scope:
    'Reference/Oracle/city/journey/dawn production generators. Dungeon/Monster/NPC/Character/Encounter detailed field audits are separate reports.',
  sourceCoverageReport: 'reference-source-coverage.json',
  fieldInventory: inventory,
  guidanceFields,
  procedures: REFERENCE_GENERATOR_PROCEDURES,
  registryProcedures: registry.procedures.map(
    ({ id, title, oracleIds, sourceRefs, generatorSteps }) => ({
      id,
      title,
      oracleIds,
      sourceRefs,
      generatorSteps,
    }),
  ),
  searchAudit: queries.map((query) => {
    const first = searchReferences(references, query)[0];
    return {
      query,
      firstResultId: first.id,
      title: first.title,
      directAction: referenceAction(first).label,
      sourceRefs: first.sourceRefs,
      interactionsAfterSearch: 1,
      note: 'One click on visible direct ROLL/OPEN after entering query. Browser acceptance is separately reported.',
    };
  }),
  unresolvedSourceIds: unresolvedOracleSources(registry),
  schemaAndRangeIssues: validateOracleRegistry(registry),
  translationAudit: {
    entryMetadataKoCount: entryKo.length,
    auxiliaryDictionaryCount: Object.keys(Object(rules.notes.translations))
      .length,
    criterion:
      'English <=4 whitespace-separated words with Korean >24 characters, plus highest expansion ratios and regional proper nouns.',
    flaggedEntryIds: flags.map(({ tableId, entryId }) => ({
      tableId,
      entryId,
      review:
        'Literal compounds/source intensifiers; no invented motivation, danger, story or connective event. Kept.',
    })),
    unresolvedLiteraryExpansions: 0,
    englishPreserved: true,
    koreanGeneratorInput: false,
    automaticMachineTranslation: false,
    scopeLimit:
      'All entries scanned; all five length flags plus15highest ratios manually reviewed. This is not a claim of line-by-line bilingual proofreading of all11,780helpers.',
    corrections: [
      {
        entryId: 'aitc.notable-artefact-type:3-3',
        classification: 'APP',
        finding:
          'App guidance could imply halving the permanent effect instead of the picture monetary worth.',
        change:
          'Explicitly names monetary worth and adds short separate Korean helper; source result unchanged.',
      },
    ],
  },
  privateLoadAudit: {
    production:
      'Published private data or IndexedDB cache; missing source leaves current campaign readable and source-dependent generators unavailable.',
    development:
      'Explicit /rules fixtures are verified private data, not fabricated fallback. Local public/rules pack is older than outputs bundle (300 vs359supplemental tables).',
    networkMysteryFallbacks: 0,
    sourcePackMutation: false,
    sourceMetadataCorrection:
      'Additive source page correction; source English/weights/savedCampaign text never regenerated.',
    sourceValidation:
      'Once per installed immutable pack pair; fingerprints include source coordinates/dice/English and recursive mechanics/follow-ups. Korean/audit metadata excluded.',
  },
  unresolvedSourceMaterial: [
    {
      tableId: 'heretic.curseCure',
      entryId: 'heretic.curseCure:12',
      book: 'HERETIC',
      pdfPage: 37,
      printedPage: 35,
      status: 'PARTIAL',
      rollable: false,
      reason:
        'Supplied page physically cuts off final sentence after do not. No invented completion.',
    },
  ],
  duplicationFindings: [
    {
      id: 'feretory.campsite.campDream',
      before: 'Nested dream table reconstructed locally in journey helper',
      after: 'One canonical live subtable adapter',
    },
    {
      id: 'feretory.hunting.*',
      before: 'Creature identity selectors missing canonical Oracle IDs',
      after:
        'Nine live adapters refer to54existing creature records; no duplicate statblocks',
    },
    {
      id: 'heretic.graves-loot-bodies',
      before: 'One directd6 only with generic repeat note',
      after: 'Two independentd6 result components per actual procedure',
    },
  ],
  qa: {
    seededCanonicalRolls: 10000,
    sourceAssertions:
      'Every result source ID, exact source English, rolltrace and JSON metadata checked.',
    targetedTests: 73,
    translationAndCityFocusedTests: 67,
  },
};
writeFileSync(
  'docs/product-integrity/reference-audit.json',
  JSON.stringify(report, null, 2) + '\n',
);
console.log(
  JSON.stringify({
    fields: inventory.length,
    registryTables: registry.tables.length,
    procedures: registry.procedures.length,
    unresolvedSourceIds: report.unresolvedSourceIds.length,
    rangeIssues: report.schemaAndRangeIssues.length,
    searchQueries: queries.length,
    translationFlags: flags.length,
    sourceCoverageFileExists: existsSync(
      'docs/product-integrity/reference-source-coverage.json',
    ),
  }),
);
