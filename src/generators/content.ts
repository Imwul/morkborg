import type {
  NPC,
  Encounter,
  EncounterCategory,
  RegionId,
  SourceReference,
} from '../domain/types';
import type { OracleRegistry, OracleRoll } from '../domain/oracle';
import { rollOracle, selectOracleEntry, sourceLabel } from './oracleRoller';
import { id, now, pick, rollDie, random, type RandomSource } from './random';

import {
  creatureRegistry,
  provenanceForRoll,
  sourceReferenceForRoll,
} from './creatureProvenance';
import { oracleValueProvenance } from '../domain/oracleProvenance';
import {
  appPolicy,
  generationAuthorities,
  uniqueAuthorities,
} from '../domain/generationAuthority';

export const contentRegistry = creatureRegistry;
export const regionOracleKeys: Partial<Record<RegionId, string>> = {
  galgenbeck: 'tveland',
  sarkash: 'sarkash',
  'graven-tosk': 'graven_tosk',
  kergus: 'kergus',
  wastland: 'wastland',
  'valley-undead': 'valley_unfortunate_undead',
};
export const npcFieldTables: Record<string, string[]> = {
  name: ['core.names'],
  archetype: ['sd.npc.profession'],
  appearance: ['reclvse.npcAppearance'],
  behaviour: ['sd.npc.disposition'],
  personality: ['reclvse.npcPersonality'],
  wants: ['reclvse.npcMotivation'],
  reaction: ['core.reaction'],
};
export const encounterCategories: { id: EncounterCategory; label: string }[] = [
  { id: 'common', label: 'Common · 일반 조우' },
  { id: 'rare', label: 'Rare · 희귀 조우' },
  { id: 'room', label: 'Room Encounter · 방 조우' },
  { id: 'hazard', label: 'Hazard · 위험' },
  { id: 'discovery', label: 'Discovery · 발견' },
];
function reference(
  registry: OracleRegistry,
  roll: OracleRoll,
  field: string,
): SourceReference {
  return sourceReferenceForRoll(registry, roll, field);
}
function roll(
  registry: OracleRegistry,
  tableId: string,
  rng: RandomSource = random,
): OracleRoll {
  const table = registry.tables.find((t) => t.id === tableId);
  if (!table || table.rollable === false || !table.sourceVerified)
    throw new Error(
      '필요한 원문 표가 없습니다. 개인 자료 JSON을 가져오세요: ' + tableId,
    );
  return rollOracle(table, registry, rng);
}
function regionalTable(
  registry: OracleRegistry,
  region: RegionId | undefined,
  suffix: string,
) {
  const key = region && regionOracleKeys[region];
  const tableId = key ? 'depths.region.' + key + '.' + suffix : '';
  return registry.tables.some((t) => t.id === tableId && t.rollable !== false)
    ? tableId
    : null;
}
export function npcTablesFor(
  field: string,
  region: RegionId | undefined,
  registry = contentRegistry(),
) {
  const local =
    field === 'archetype' && regionalTable(registry, region, 'npc_professions');
  return local ? [local] : (npcFieldTables[field] ?? []);
}
export function rerollNPC(
  npc: NPC,
  field: string,
  registry = contentRegistry(),
  rng: RandomSource = random,
): void {
  const tables = npcTablesFor(field, npc.region, registry);
  if (!tables.length) throw new Error('이 항목은 직접 작성합니다.');
  const results = tables.map((tableId) => roll(registry, tableId, rng));
  (npc as unknown as Record<string, unknown>)[field] = results
    .map((r) => r.text)
    .join(' · ');
  npc.sources = {
    ...npc.sources,
    [field]: results.map((r) => r.source).join(' + '),
  };
  npc.sourceRefs = [
    ...npc.sourceRefs.filter((r) => r.field !== field),
    ...results.map((r) => reference(registry, r, field)),
  ];
  npc.fieldProvenance = {
    ...npc.fieldProvenance,
    [field]: {
      ...provenanceForRoll(registry, results[0]),
      authority: uniqueAuthorities([
        ...results.flatMap((result) =>
          generationAuthorities(provenanceForRoll(registry, result)),
        ),
        appPolicy('workbench.npc'),
      ]),
      sourceRefs: results.map((r) => reference(registry, r, field)),
      sourceText: results.map((r) => r.text),
      rolls: results.flatMap((r) => provenanceForRoll(registry, r).rolls ?? []),
      classification:
        results.length === 1 ? 'SOURCE_VERBATIM' : 'SOURCE_COMPOSED',
      transformation:
        results.length === 1
          ? 'none'
          : 'Independent source fragments separated with ·',
    },
  };
  npc.updatedAt = now();
}
export function createNPC(
  campaignId: string,
  region: RegionId = 'sarkash',
  blank = false,
  registry = contentRegistry(),
): NPC {
  const npc: NPC = {
    id: id(),
    campaignId,
    region,
    name: '',
    notes: '',
    createdAt: now(),
    updatedAt: now(),
    archetype: '',
    appearance: '',
    behaviour: '',
    wants: '',
    secret: '',
    specialAbility: '',
    hp: '',
    morale: '',
    armor: '',
    attack: '',
    damage: '',
    possession: '',
    personality: '',
    reaction: '',
    affiliation: '',
    fears: '',
    description: '',
    sourceRefs: [],
    sources: {},
    generation: { system: 'oracle-npc', rolls: {} },
  };
  if (!blank)
    for (const field of Object.keys(npcFieldTables))
      rerollNPC(npc, field, registry);
  return npc;
}
export function encounterTable(
  category: EncounterCategory,
  region: RegionId | undefined,
  registry = contentRegistry(),
) {
  if (category === 'common')
    return regionalTable(registry, region, 'monsters') ?? 'sd.stockCreatures';
  if (category === 'rare') return 'sd.stockCreatures';
  return {
    room: 'reclvse.roomEncounter',
    hazard: 'reclvse.roomHazard',
    discovery: 'reclvse.roomDiscovery',
  }[category];
}
/** SD common stocking d12; rare stocking d8 + Dungeon DR. Never clamp an unmapped result. */
export function rerollEncounter(
  encounter: Encounter,
  registry = contentRegistry(),
  rng: RandomSource = random,
): void {
  const tableId = encounterTable(
    encounter.category,
    encounter.region,
    registry,
  );
  const table = registry.tables.find((t) => t.id === tableId);
  if (!table || table.rollable === false || !table.sourceVerified)
    throw new Error('원문 조우 표를 먼저 가져오세요.');
  let result: OracleRoll;
  let procedure = '';
  if (tableId === 'sd.stockCreatures') {
    const die = rollDie(encounter.category === 'rare' ? 8 : 12, rng);
    const value =
      die + (encounter.category === 'rare' ? encounter.dungeonDR : 0);
    const entry = value <= 20 ? selectOracleEntry(table, value) : undefined;
    procedure =
      encounter.category === 'rare'
        ? 'Sölitary Defilement · PDF 19쪽 / p. 17 · Rare stocking d8 + Dungeon DR: ' +
          die +
          ' + ' +
          encounter.dungeonDR +
          ' = ' +
          value
        : 'Sölitary Defilement · PDF 19쪽 / p. 17 · Common stocking d12: ' +
          die;
    result = {
      oracleId: tableId,
      title: table.title,
      dice: encounter.category === 'rare' ? 'd8 + DR' : 'd12',
      roll: value,
      diceValues: [die],
      entryId: entry?.id ?? null,
      text: entry?.text ?? '',
      source: sourceLabel(table, registry),
      metadata: {
        ...entry?.metadata,
        provenance: {
          ...oracleValueProvenance(table, registry, entry, {
            value,
            values: [die],
          }),
          rolls: [
            {
              tableId,
              dice: encounter.category === 'rare' ? 'd8 + DR' : 'd12',
              value,
              diceValues: [die],
              entryId: entry?.id ?? null,
            },
          ],
          ...(!entry
            ? {
                status: 'UNAVAILABLE' as const,
                classification: 'APP_DERIVED' as const,
                transformation: `d8 ${die} + Dungeon DR ${encounter.dungeonDR} = ${value}, outside the printed 1–20 table; no creature text generated.`,
              }
            : {}),
        },
      },
    };
    encounter.unresolved = !entry;
  } else {
    result = roll(registry, tableId, rng);
    encounter.unresolved = false;
  }
  encounter.text = result.text;
  encounter.description = result.text;
  // A table result remains prose. It never silently creates library participants.
  const source = result.source + (procedure ? ' · ' + procedure : '');
  encounter.sources = {
    ...encounter.sources,
    text: source,
    description: source,
  };
  encounter.sourceRefs = [
    ...encounter.sourceRefs.filter(
      (r) => r.field !== 'text' && r.field !== 'description',
    ),
    {
      ...reference(registry, result, 'text'),
      ...(procedure ? { note: procedure } : {}),
    },
  ];
  const provenance = provenanceForRoll(
    registry,
    result,
    tableId === 'sd.stockCreatures'
      ? `sd.${encounter.category}-stocking`
      : undefined,
  );
  if (procedure)
    provenance.sourceRefs.push({
      bookId: 'sd',
      bookTitle: 'Sölitary Defilement',
      pdfPage: 19,
      printedPage: 17,
      tableTitle: 'Dungeon preparation',
      role: 'routing',
      note: procedure,
    });
  encounter.fieldProvenance = {
    ...encounter.fieldProvenance,
    text: provenance,
    description: structuredClone(provenance),
  };
  encounter.generation = {
    system: 'oracle-encounter',
    rolls: { result: result.roll },
  };
  encounter.updatedAt = now();
}
export function createEncounter(
  campaignId: string,
  region: RegionId = 'sarkash',
  category: EncounterCategory | 'random' = 'common',
  dungeonDR = 10,
  blank = false,
  registry = contentRegistry(),
): Encounter {
  const chosen =
    category === 'random' ? pick(encounterCategories).id : category;
  const encounter: Encounter = {
    id: id(),
    campaignId,
    region,
    category: chosen,
    dungeonDR,
    name: '',
    text: '',
    description: '',
    sign: '',
    complication: '',
    treasure: '',
    notes: '',
    participants: [],
    sourceRefs: [],
    sources: {},
    createdAt: now(),
    updatedAt: now(),
  };
  if (!blank) rerollEncounter(encounter, registry);
  return encounter;
}
