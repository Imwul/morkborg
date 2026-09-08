import { prepareSpecialRooms, syncRoomComponents } from './specialRooms';
import type { GeneratedValueProvenance } from '../domain/generationProvenance';
import { emptyChronicle } from '../domain/chronicle';
import type {
  Campaign,
  Character,
  Dungeon,
  DungeonRoom,
  EntityMap,
  LibraryKind,
  Monster,
  RegionId,
} from '../domain/types';
import { dungeonFields, roomFields, emptyWorkspace } from '../domain/types';
import { id, now } from './random';
import { getRules } from '../storage/rulesStore';

import { scalarText, rollTable, type RuleRoll } from './tables';
export { abilityModifier, coreRule, sampleEntry, rollTable } from './tables';
export type { RuleRoll } from './tables';
import { generateCharacter, characterFieldRoll } from './character';
import {
  generateMonster,
  loadMonsterPreset,
  rerollMonsterField,
  rerollMonsterLinked,
} from './monster';
import { createNPC, createEncounter, npcTablesFor } from './content';
import {
  rollCreatureTable,
  provenanceForCreatureRecord,
} from './creatureProvenance';
export { feretoryStats } from './monster';
const blankRoll: RuleRoll = {
  value: '',
  source: '직접 작성',
  provenance: {
    classification: 'USER_AUTHORED',
    origin: 'manual',
    status: 'UNAVAILABLE',
    sourceRefs: [],
  },
};
export const personalName = () => scalarText(rollTable('core.names').value);
export function dungeonTitleRoll(): RuleRoll {
  const first = rollTable('core.titleA'),
    second = rollTable('core.titleB');
  return {
    value: `The ${first.value} ${second.value}`,
    source: `${first.source} + ${second.source}`,
    provenance: {
      classification: 'SOURCE_COMPOSED',
      origin: 'source',
      status: 'VERIFIED',
      sourceRefs: [
        ...first.provenance!.sourceRefs,
        ...second.provenance!.sourceRefs,
      ],
      sourceText: [
        'The',
        ...first.provenance!.sourceText!,
        ...second.provenance!.sourceText!,
      ],
      rolls: [...first.provenance!.rolls!, ...second.provenance!.rolls!],
      procedureId: 'core.dungeon-title',
      transformation: 'Printed The + first d12 column + second d12 column.',
      datasetVersion: first.provenance!.datasetVersion,
    },
  };
}
export const dungeonTitle = () => scalarText(dungeonTitleRoll().value);

const dungeonTable: Record<string, string> = {
  premise: 'core.sparks',
  status: 'core.status',
  formerPurpose: 'reclvse.dungeonPurposeThen',
  inhabitants: 'core.inhabitants',
  entrance: 'reclvse.dungeonEntrance',
  entranceCondition: 'reclvse.entranceState',
  distinctiveFeature: 'core.feature',
  environmentalDanger: 'core.danger',
  treasure: 'core.treasures',
};
export const sourceRegion: Partial<Record<RegionId, string>> = {
  galgenbeck: 'tveland',
  sarkash: 'sarkash',
  'graven-tosk': 'graven_tosk',
  kergus: 'kergus',
  wastland: 'wastland',
  'valley-undead': 'valley_unfortunate_undead',
};
const roomTable: Record<string, string> = {
  name: 'reclvse.roomPurpose',
  description: 'core.rooms',
  feature: 'reclvse.dressing',
  danger: 'core.traps',
  treasure: 'reclvse.roomLoot',
  encounter: 'reclvse.roomEncounter',
};
export function generateDungeonRoll(key: string, region: RegionId): RuleRoll {
  const table = dungeonTable[key];
  if (!table) return structuredClone(blankRoll);
  return rollTable(table, region);
}
export function generateDungeonField(key: string, region: RegionId): string {
  return scalarText(generateDungeonRoll(key, region).value);
}
export function generateRoomRoll(key: string, region: RegionId): RuleRoll {
  if (key === 'name') {
    const adjective = rollTable('sd.room.adjective', region),
      type = rollTable('sd.room.type', region);
    return {
      value: `${adjective.value} · ${type.value}`,
      source: `${adjective.source} + ${type.source}`,
      provenance: {
        classification: 'SOURCE_COMPOSED',
        origin: 'source',
        status: 'VERIFIED',
        sourceRefs: [
          ...adjective.provenance!.sourceRefs,
          ...type.provenance!.sourceRefs,
        ],
        sourceText: [
          ...adjective.provenance!.sourceText!,
          ...type.provenance!.sourceText!,
        ],
        rolls: [...adjective.provenance!.rolls!, ...type.provenance!.rolls!],
        procedureId: 'sd.generic-room',
        transformation:
          'Display the two printed descriptor results with ·; slash-separated alternatives stay unchanged.',
        ...(adjective.provenance!.regionWeighting
          ? { regionWeighting: region }
          : {}),
        datasetVersion: adjective.provenance!.datasetVersion,
      },
    };
  }
  const table = key === 'description' ? 'sd.room.contents' : roomTable[key];
  return table ? rollTable(table, region) : structuredClone(blankRoll);
}
export function generateRoomField(key: string, region: RegionId): string {
  return scalarText(generateRoomRoll(key, region).value);
}
export function canReroll(
  scope: LibraryKind | 'dungeon' | 'room',
  key: string,
): boolean {
  if (!getRules()) return false;
  if (scope === 'dungeon') return !!getRules()?.tables[dungeonTable[key]];
  if (scope === 'room') return !!getRules()?.tables[roomTable[key]];
  if (scope === 'characters') return key !== 'archetype';
  if (scope === 'monsters')
    return ['name', 'hp', 'appearance', 'wants', 'specialAbility'].includes(
      key,
    );
  if (scope === 'npcs')
    return ['name', 'archetype', 'appearance', 'behaviour', 'wants'].includes(
      key,
    );
  return ['name', 'description', 'sign', 'complication', 'treasure'].includes(
    key,
  );
}
/** Legacy entry point delegates to the same procedures as the active libraries. */
export function generateEntityRoll(
  kind: LibraryKind,
  key: string,
  region: RegionId,
  category: 'common' | 'rare' = 'common',
  current?: Partial<EntityMap[LibraryKind]>,
): RuleRoll {
  if (kind === 'characters')
    return characterFieldRoll(key, (current ?? {}) as Partial<Character>);
  if (kind === 'npcs') {
    const tables = npcTablesFor(key, region);
    return tables.length === 1 ? rollCreatureTable(tables[0]) : blankRoll;
  }
  if (kind === 'encounters') {
    if (key !== 'text' && key !== 'description') return blankRoll;
    const encounter = createEncounter('', region, category, 10);
    return {
      value: encounter.text,
      source: encounter.sources!.text,
      provenance: encounter.fieldProvenance?.text,
    };
  }
  if (kind === 'monsters') {
    if (key === 'name')
      return {
        value: 'Monster',
        source: 'Neutral structural label',
        provenance: {
          classification: 'APP_DERIVED',
          origin: 'source',
          status: 'VERIFIED',
          sourceRefs: [],
          procedureId: 'app.structural-identifier',
          transformation: 'Neutral structural label; manual name allowed.',
        },
      };
    if (key === 'wants') return rollCreatureTable('feretory.desire');
    if (key === 'specialAbility') return rollCreatureTable('feretory.trait');
    if (key === 'hp' && current) {
      const monster = structuredClone(current) as Monster;
      rerollMonsterField(monster, 'hp');
      return {
        value: monster.hp,
        source: monster.sources?.hp ?? '',
        provenance: monster.fieldProvenance?.hp,
      };
    }
    // Linked appearance/stat rerolls require the real object; no independent fallback pipeline.
    if (key === 'appearance' && current) {
      const monster = structuredClone(current) as Monster;
      rerollMonsterLinked(monster, 'appearance');
      return {
        value: monster.appearance,
        source: monster.sources?.appearance ?? '',
        provenance: monster.fieldProvenance?.appearance,
      };
    }
  }
  return blankRoll;
}
export function generateEntityField(
  kind: LibraryKind,
  key: string,
  region: RegionId,
  category: 'common' | 'rare' = 'common',
  current?: Partial<Character>,
): string | number {
  return generateEntityRoll(kind, key, region, category, current).value;
}
export function generateEntity<K extends LibraryKind>(
  kind: K,
  region: RegionId,
  category: 'common' | 'rare' = 'common',
  blank = false,
): EntityMap[K] {
  if (kind === 'characters')
    return generateCharacter(id(), blank) as EntityMap[K];
  if (kind === 'monsters') return generateMonster(id(), blank) as EntityMap[K];
  if (kind === 'npcs') return createNPC(id(), region, blank) as EntityMap[K];
  return createEncounter(id(), region, category, 10, blank) as EntityMap[K];
}
export function createRoom(region: RegionId, blank = false): DungeonRoom {
  const room: DungeonRoom = {
    id: id(),
    name: '',
    description: '',
    feature: '',
    danger: '',
    treasure: '',
    encounter: '',
    notes: '',
    monsterIds: [],
    npcIds: [],
    encounterIds: [],
    sources: {},
  };
  if (!blank) {
    room.kind = 'generic';
    room.components = ['adjective', 'type', 'contents'].map((key) => {
      const result = rollTable(`sd.room.${key}`, region);
      return {
        key,
        label: key.toUpperCase(),
        sourceText: scalarText(result.value),
        provenance: { ...result.provenance!, procedureId: 'sd.generic-room' },
      };
    });
    syncRoomComponents(room);
    room.sources = {
      name: room.components
        .slice(0, 2)
        .map((item) =>
          item.provenance.sourceRefs
            .map((ref) => `${ref.bookTitle} · ${ref.tableTitle}`)
            .join(' + '),
        )
        .join(' + '),
      description: 'Sölitary Defilement · PDF 15 / p. 13 · Room Contents',
    };
  }
  return room;
}
export function createDungeon(
  campaignId: string,
  title: string,
  region: RegionId,
  blank = false,
): Dungeon {
  if (!blank && !getRules())
    throw new Error('생성표를 불러온 뒤 다시 굴려 주세요.');
  const d: Record<string, unknown> = {
    id: id(),
    campaignId,
    title,
    region,
    rooms: [],
    monsterIds: [],
    npcIds: [],
    encounterIds: [],
    notes: '',
    createdAt: now(),
    updatedAt: now(),
  };
  const sources: Record<string, string> = { title: '직접 작성' };
  const fieldProvenance: Record<string, GeneratedValueProvenance> = {
    title: structuredClone(blankRoll.provenance!),
  };
  for (const f of dungeonFields) {
    const result = blank
      ? structuredClone(blankRoll)
      : generateDungeonRoll(f.key, region);
    d[f.key] = result.value;
    sources[f.key] = result.source;
    if (result.provenance) fieldProvenance[f.key] = result.provenance;
  }
  d.sources = sources;
  d.fieldProvenance = fieldProvenance;
  return d as unknown as Dungeon;
}
export function rerollRoomContents(room: DungeonRoom, region: RegionId): void {
  const generated = createRoom(region);
  for (const { key } of roomFields)
    Object.assign(room, {
      [key]: (generated as unknown as Record<string, unknown>)[key],
    });
  room.sources = generated.sources;
  room.fieldProvenance = generated.fieldProvenance;
  room.components = generated.components;
  room.kind = generated.kind;
}
export function createDungeonCandidate(
  campaignId: string,
  region: RegionId,
  _roomCount = 4,
): Dungeon {
  const title = dungeonTitleRoll();
  const candidate = createDungeon(campaignId, scalarText(title.value), region);
  candidate.sources = { ...candidate.sources, title: title.source };
  candidate.fieldProvenance = {
    ...candidate.fieldProvenance,
    title: title.provenance!,
  };
  candidate.rooms = prepareSpecialRooms(candidate);
  return candidate;
}
export function createCampaign(title: string, subtitle = ''): Campaign {
  return {
    ...emptyChronicle(),
    id: id(),
    title,
    subtitle,
    description: subtitle,
    createdAt: now(),
    updatedAt: now(),
    characters: [],
    dungeons: [],
    monsters: [],
    monsterPlacements: [],
    npcPlacements: [],
    encounterPlacements: [],
    npcs: [],
    encounters: [],
    notes: '',
    drafts: { characters: null, monsters: null, npcs: null, encounters: null },
    workspace: emptyWorkspace(),
  };
}
export function loadPreset(
  kind: 'monsters' | 'npcs',
  record: Record<string, unknown>,
): EntityMap['monsters'] | EntityMap['npcs'] {
  const monster = loadMonsterPreset(id(), record);
  if (kind === 'monsters') return monster;
  const npc = createNPC(monster.campaignId, 'graven-tosk', true);
  Object.assign(npc, {
    name: monster.name,
    archetype: scalarText(record.archetype ?? record.concept),
    hp: monster.hp,
    morale: monster.morale,
    armor: monster.armor,
    appearance: monster.appearance || monster.description,
    behaviour: monster.behavior,
    wants: monster.wants,
    description: monster.description,
    notes: monster.notes,
    possession: scalarText(record.possession),
    attack: monster.attacks
      .map((a) => [a.name, a.damage].filter(Boolean).join(' '))
      .join(' / '),
    damage: monster.attacks.length === 1 ? monster.attacks[0].damage : '',
    specialAbility: monster.special.map((a) => a.text).join('\n'),
    sources: { ...monster.sources },
    generation: monster.generation,
  });
  npc.fieldProvenance = {};
  for (const field of [
    'name',
    'archetype',
    'hp',
    'morale',
    'armor',
    'appearance',
    'behaviour',
    'wants',
    'description',
    'notes',
    'attack',
    'damage',
    'specialAbility',
    'possession',
  ]) {
    const value = (npc as unknown as Record<string, unknown>)[field];
    if (value !== '' && value !== undefined) {
      const provenance = provenanceForCreatureRecord(
        record,
        field,
        value,
        !['name', 'hp', 'morale', 'armor', 'damage'].includes(field),
      );
      npc.fieldProvenance[field] = provenance;
      npc.sourceRefs.push(...provenance.sourceRefs);
      npc.sources![field] = monster.sources?.name ?? '';
    }
  }
  if (monster.fieldProvenance?.notes)
    npc.fieldProvenance.notes = structuredClone(monster.fieldProvenance.notes);
  if (monster.fieldProvenance?.hp?.status === 'UNAVAILABLE')
    npc.fieldProvenance.hp = structuredClone(monster.fieldProvenance.hp);
  return npc;
}
