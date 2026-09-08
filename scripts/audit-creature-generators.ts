import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { setRules, getRules } from '../src/storage/rulesStore.ts';
import { setOraclePack } from '../src/storage/oracleStore.ts';
import {
  generateMonster,
  generateEatPreyKillMonster,
  loadMonsterPreset,
} from '../src/generators/monster.ts';
import { createNPC, createEncounter } from '../src/generators/content.ts';
import { generateCharacter } from '../src/generators/character.ts';
import { loadPreset } from '../src/generators/index.ts';
import {
  characterClasses,
  buildCharacterProcedures,
} from '../src/generators/characterClasses.ts';
import {
  creatureRegistry,
  CREATURE_PROCEDURES,
  creatureRecordStatus,
} from '../src/generators/creatureProvenance.ts';
import { REGION_IDS } from '../src/domain/types.ts';
import type { GeneratedValueProvenance } from '../src/domain/generationProvenance.ts';

const pack = JSON.parse(
  readFileSync(
    process.env.MORKBORG_PRIVATE_AUDIT_FIXTURE ??
      'outputs/morkborg-private-data.json',
    'utf8',
  ),
);
setRules(pack.library);
setOraclePack(pack.oracles);
const registry = creatureRegistry();
const categories = ['common', 'rare', 'room', 'hazard', 'discovery'] as const;
const modes = ['classless', ...characterClasses().map((c) => c.id)];
const samples = {
  monsters: Array.from({ length: 100 }, (_, i) =>
    i < 50
      ? generateMonster('isolated-semantic-qa')
      : generateEatPreyKillMonster('isolated-semantic-qa', REGION_IDS[i % 7]),
  ),
  npcs: Array.from({ length: 100 }, (_, i) =>
    createNPC('isolated-semantic-qa', REGION_IDS[i % 7]),
  ),
  encounters: Array.from({ length: 100 }, (_, i) =>
    createEncounter(
      'isolated-semantic-qa',
      REGION_IDS[i % 7],
      categories[i % 5],
    ),
  ),
  characters: Array.from({ length: 100 }, (_, i) =>
    generateCharacter('isolated-semantic-qa', false, modes[i % modes.length]),
  ),
};
mkdirSync('outputs/product-integrity', { recursive: true });
writeFileSync(
  'outputs/product-integrity/creature-semantic-samples.json',
  JSON.stringify(samples, null, 2) + '\n',
);
const fields = new Map<string, Record<string, unknown>>();
function visit(feature: string, path: string, value: unknown) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((v) => visit(feature, path + '[]', v));
    return;
  }
  const object = value as Record<string, unknown>;
  if ('fieldProvenance' in object)
    for (const [field, p] of Object.entries(
      object.fieldProvenance as Record<string, GeneratedValueProvenance>,
    ))
      add(feature, path ? `${path}.${field}` : field, p);
  if (object.provenance)
    add(
      feature,
      path ? `${path}.text` : 'text',
      object.provenance as GeneratedValueProvenance,
    );
  for (const [key, v] of Object.entries(object))
    if (
      ![
        'fieldProvenance',
        'provenance',
        'sourceRefs',
        'sources',
        'generation',
      ].includes(key)
    )
      visit(feature, path ? `${path}.${key}` : key, v);
}
function add(feature: string, field: string, p: GeneratedValueProvenance) {
  const key = `${feature}.${field}:${p.sourceRefs.map((r) => r.tableId ?? r.bookId).join('+')}:${p.classification}:${p.status}`;
  if (fields.has(key)) return;
  fields.set(key, {
    feature,
    field,
    classification: p.classification,
    sourceStatus: p.status,
    sourceRefs: p.sourceRefs.map(
      ({
        bookId,
        bookTitle,
        tableId,
        tableTitle,
        pdfPage,
        printedPage,
        role,
      }) => ({
        bookId,
        bookTitle,
        tableId,
        tableTitle,
        pdfPage,
        printedPage,
        role,
      }),
    ),
    sourceTableIds: p.sourceRefs.map((r) => r.tableId).filter(Boolean),
    transformation: p.transformation,
    verbatim: p.classification === 'SOURCE_VERBATIM',
    translationExists: p.sourceRefs.some(
      (r) =>
        r.tableId &&
        registry.tables
          .find((t) => t.id === r.tableId)
          ?.entries.some((e) => typeof e.metadata?.ko === 'string'),
    ),
    translationOrigin:
      'app-authored Korean helper; canonical English unchanged',
    fallbackExists: false,
    fallbackSourceBacked: null,
    confidence: p.status,
    procedureId: p.procedureId,
  });
}
for (const [feature, collection] of Object.entries(samples))
  collection.forEach((value) => visit(feature, '', value));
getRules()!.creatures.forEach((record) =>
  visit('creaturePresets', '', loadMonsterPreset('isolated-audit', record)),
);
getRules()!.outcasts.forEach((record) =>
  visit('npcPresets', '', loadPreset('npcs', record)),
);
const manual = {
  monsters: [
    'concept',
    'behavior',
    'weakness',
    'loot',
    'weirdTrait',
    'description',
    'notes',
    'attacks[].name',
    'attacks[].description',
  ],
  npcs: [
    'secret',
    'specialAbility',
    'hp',
    'morale',
    'armor',
    'attack',
    'damage',
    'possession',
    'affiliation',
    'fears',
    'description',
    'notes',
  ],
  encounters: [
    'name',
    'sign',
    'complication',
    'treasure',
    'notes',
    'participants',
  ],
  characters: ['description', 'notes', 'status'],
};
for (const [feature, names] of Object.entries(manual))
  for (const field of names)
    fields.set(`${feature}.${field}:manual`, {
      feature,
      field,
      classification: 'USER_AUTHORED',
      sourceRefs: [],
      sourceTableIds: [],
      transformation: 'Blank until explicitly edited; no generated fallback',
      verbatim: false,
      translationExists: false,
      fallbackExists: false,
      fallbackSourceBacked: null,
      confidence: 'USER_AUTHORED',
    });
const inventory = {
  schemaVersion: 1,
  auditDate: '2026-09-08',
  sourceVerification:
    'Original supplied PDF pages re-read; creature records checked against independent content fingerprints; source-only missing stats remain explicit.',
  generatedSampleCounts: Object.fromEntries(
    Object.entries(samples).map(([k, v]) => [k, v.length]),
  ),
  recordsVerified: getRules()!.creatures.filter(
    (r) => creatureRecordStatus(r) === 'VERIFIED',
  ).length,
  outcastsVerified: getRules()!.outcasts.filter(
    (r) => creatureRecordStatus(r) === 'VERIFIED',
  ).length,
  procedures: [...CREATURE_PROCEDURES, ...buildCharacterProcedures()],
  fields: [...fields.values()],
};
writeFileSync(
  'docs/product-integrity/creature-generation-inventory.json',
  JSON.stringify(inventory, null, 2) + '\n',
);
const compact = {
  monsters: samples.monsters.map((m) => ({
    name: m.name,
    appearance: m.appearance,
    hp: m.hp,
    morale: m.morale,
    armor: m.armor,
    attack: m.attacks.map((a) => a.damage).join('/'),
    wants: m.wants,
    special: m.special.map((s) => s.text),
  })),
  npcs: samples.npcs.map((n) => ({
    name: n.name,
    archetype: n.archetype,
    appearance: n.appearance,
    behaviour: n.behaviour,
    personality: n.personality,
    wants: n.wants,
    reaction: n.reaction,
  })),
  encounters: samples.encounters.map((e) => ({
    category: e.category,
    text: e.text,
  })),
};
writeFileSync(
  'outputs/product-integrity/creature-review.json',
  JSON.stringify(compact, null, 2) + '\n',
);
console.log(
  JSON.stringify({
    counts: inventory.generatedSampleCounts,
    fields: inventory.fields.length,
    recordsVerified: inventory.recordsVerified,
    unresolvedFields: inventory.fields.filter(
      (f) => f.classification === 'UNSOURCED',
    ).length,
  }),
);
