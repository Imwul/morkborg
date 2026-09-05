import { emptyChronicle } from '../domain/chronicle';
import type {
  BaseEntity,
  Campaign,
  Character,
  Dungeon,
  DungeonRoom,
  EntityMap,
  LibraryKind,
  Monster,
  RegionId,
} from '../domain/types';
import {
  dungeonFields,
  roomFields,
  entityFields,
  emptyWorkspace,
} from '../domain/types';
import { id, now, pick, rollDie } from './random';
import { getRules, sourceCitation } from '../storage/rulesStore';

import {
  scalarText,
  entries,
  sampleEntry,
  rollTable,
  type RuleRoll,
} from './tables';
export { abilityModifier, coreRule, sampleEntry, rollTable } from './tables';
export type { RuleRoll } from './tables';
import { generateCharacter, characterFieldRoll } from './character';
import { generateMonster, loadMonsterPreset, fereAppearance } from './monster';
export { feretoryStats } from './monster';
const blankRoll: RuleRoll = {
  value: '',
  source: '원문 생성표 없음 · 직접 작성',
};
export const personalName = () => scalarText(rollTable('core.names').value);
export const dungeonTitle = () =>
  `The ${rollTable('core.titleA').value} ${rollTable('core.titleB').value}`;
const base = (): BaseEntity => ({
  id: id(),
  name: '',
  notes: '',
  createdAt: now(),
  updatedAt: now(),
  sources: {},
});
const dungeonTable: Record<string, string> = {
  premise: 'core.sparks',
  status: 'core.status',
  formerPurpose: 'reclvse.dungeonPurposeThen',
  inhabitants: 'core.inhabitants',
  motive: 'reclvse.questEncounterHook',
  entrance: 'reclvse.dungeonEntrance',
  entranceCondition: 'reclvse.entranceState',
  distinctiveFeature: 'core.feature',
  environmentalDanger: 'core.danger',
  weirdPhenomenon: 'reclvse.arcaneEncounter',
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
function regional(region: RegionId, kind: string): string | undefined {
  const key = sourceRegion[region];
  const table = key ? `depths.region.${key}.${kind}` : undefined;
  return table && getRules()?.tables[table] ? table : undefined;
}
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
  if (!table || !getRules()?.tables[table]) return blankRoll;
  const result = rollTable(table, region);
  // Preserve the existing combination with the printed regional trait table.
  const trait =
    key === 'distinctiveFeature' ? regional(region, 'trait') : undefined;
  if (trait) {
    const local = rollTable(trait);
    return {
      value: `${local.value}; ${result.value}`,
      source: `${result.source} + ${local.source} · 두 원문 표 조합`,
    };
  }
  return result;
}
export function generateDungeonField(key: string, region: RegionId): string {
  return scalarText(generateDungeonRoll(key, region).value);
}
export function generateRoomRoll(key: string, _region: RegionId): RuleRoll {
  if (key === 'name' && getRules()?.tables['sd.room.adjective'])
    return {
      value: `${rollTable('sd.room.adjective', _region).value} ${rollTable('sd.room.type', _region).value}`,
      source:
        sourceCitation('sd.room.adjective') +
        ' · Room Type d12 · 지역 태그 확률 보정',
    };
  if (key === 'feature' && regional(_region, 'trait'))
    return rollTable(regional(_region, 'trait')!);
  const table = roomTable[key];
  return table && getRules()?.tables[table]
    ? rollTable(table, _region)
    : blankRoll;
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
function commonEncounter(region: RegionId): RuleRoll {
  const table = regional(region, 'monsters');
  if (table) {
    const e = sampleEntry(table);
    const die = scalarText(e.meta.quantityDice ?? '');
    const count = /^d(\d+)$/.exec(die);
    return {
      value: count
        ? e.text.replace(die, scalarText(rollDie(Number(count[1]))))
        : e.text,
      source: sourceCitation(table),
    };
  }
  const all = entries('sd.stockCreatures');
  const e = all[rollDie(12) - 1];
  return {
    value: e.text,
    source: sourceCitation('sd.stockCreatures') + ' · Common d12 (SD PDF 19쪽)',
  };
}
export function generateEntityRoll(
  kind: LibraryKind,
  key: string,
  region: RegionId,
  category: 'common' | 'rare' = 'common',
  current?: Partial<EntityMap[LibraryKind]>,
): RuleRoll {
  if (key === 'name') {
    if (kind === 'encounters')
      return category === 'common'
        ? commonEncounter(region)
        : rollTable('reclvse.strangeMeeting');
    return rollTable('core.names');
  }
  if (kind === 'characters')
    return characterFieldRoll(key, (current ?? {}) as Partial<Character>);
  if (kind === 'monsters') {
    if (key === 'hp') {
      const damage =
        (current as Partial<Monster>)?.attacks?.[0]?.damage ?? 'd4';
      const n = Number(/^d(4|6|8|10|12)$/.exec(damage)?.[1]);
      return n
        ? {
            value: 2 * rollDie(n),
            source: 'FERETORY · PDF 2쪽 · 피해 주사위 1회 결과 ×2 (본문 방식)',
          }
        : blankRoll;
    }
    if (key === 'appearance') {
      const rolls = { A: rollDie(12), B: rollDie(12), C: rollDie(12) };
      return {
        value: fereAppearance(rolls),
        source:
          sourceCitation('feretory.A') +
          ` · A${rolls.A}/B${rolls.B}/C${rolls.C} · 단일 필드 재굴림`,
      };
    }
    if (key === 'wants') return rollTable('feretory.desire');
    if (key === 'specialAbility') return rollTable('feretory.trait');
  }
  if (kind === 'npcs') {
    if (key === 'archetype')
      return rollTable(
        regional(region, 'npc_professions') ?? 'sd.npc.profession',
      );
    if (key === 'behaviour') return rollTable('sd.npc.disposition');
    const map: Record<string, string> = {
      archetype: 'reclvse.npcSummary',
      appearance: 'reclvse.npcAppearance',
      behaviour: 'reclvse.npcPersonality',
      wants: 'reclvse.npcMotivation',
    };
    return map[key] ? rollTable(map[key]) : blankRoll;
  }
  if (kind === 'encounters') {
    if (key === 'name' && category === 'common') return commonEncounter(region);
    const map: Record<string, string> = {
      description: 'reclvse.immediateGoal',
      sign: 'reclvse.entranceSigns',
      complication: 'reclvse.socialComplication',
      treasure: 'reclvse.encounterAftermath',
    };
    return map[key] ? rollTable(map[key]) : blankRoll;
  }
  void region;
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
  const entity: Record<string, unknown> = { ...base() };
  const sources: Record<string, string> = {};
  for (const field of entityFields[kind])
    entity[field.key] = field.type === 'number' && kind !== 'npcs' ? 0 : '';
  if (kind === 'encounters') entity.category = category;
  if (!blank) {
    if (kind === 'encounters' && category === 'rare') {
      const monster = generateEntity('monsters', region);
      entity.name = monster.name;
      entity.description = `${monster.appearance}\nHP ${monster.hp} · Morale ${monster.morale} · Armor ${monster.armor} · Damage ${monster.attacks.map((a) => a.damage).join(' / ')}\n${monster.wants}`;
      entity.complication = monster.special.map((s) => s.text).join('\n');
      entity.sign = regional(region, 'trait')
        ? rollTable(regional(region, 'trait')!).value
        : '';
      entity.treasure = regional(region, 'discovery')
        ? rollTable(regional(region, 'discovery')!).value
        : '';
      sources.name = monster.sources?.name ?? '';
      sources.description =
        'Sölitary Depths · PDF 24쪽 · Rare encounter: The Monster Approaches 대안; FERETORY PDF 2–3쪽';
      sources.complication = sourceCitation('feretory.trait');
      if (regional(region, 'trait'))
        sources.sign = sourceCitation(regional(region, 'trait')!);
      if (regional(region, 'discovery'))
        sources.treasure = sourceCitation(regional(region, 'discovery')!);
    } else {
      const order = entityFields[kind].map((f) => f.key);
      for (const key of order) {
        const result = generateEntityRoll(
          kind,
          key,
          region,
          category,
          entity as Partial<EntityMap[LibraryKind]>,
        );
        entity[key] = result.value;
        sources[key] = result.source;
      }
    }
  }
  entity.sources = sources;
  return entity as unknown as EntityMap[K];
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
    for (const key of ['name', 'description', 'feature'] as const) {
      const r = generateRoomRoll(key, region);
      room[key] = scalarText(r.value);
      room.sources![key] = r.source;
    }
    if (getRules()?.tables['reclvse.contentsCategory']) {
      const contents = sampleEntry('reclvse.contentsCategory');
      const sub = scalarText(contents.meta.subtableId);
      const key =
        sub === 'roomHazard'
          ? 'danger'
          : sub === 'roomEncounter'
            ? 'encounter'
            : sub === 'roomLoot'
              ? 'treasure'
              : 'feature';
      const r = rollTable('reclvse.' + sub);
      const previousSource = room[key] ? room.sources![key] : undefined;
      room[key] = room[key] ? `${room[key]}; ${r.value}` : scalarText(r.value);
      room.sources![key] = [
        previousSource,
        r.source + ' · ROOM CONTENTS d4 (PDF 92쪽)',
      ]
        .filter(Boolean)
        .join(' + ');
    }
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
  const sources: Record<string, string> = {};
  for (const f of dungeonFields) {
    const result = blank ? blankRoll : generateDungeonRoll(f.key, region);
    d[f.key] = result.value;
    sources[f.key] = result.source;
  }
  d.sources = sources;
  return d as unknown as Dungeon;
}
export function rerollRoomContents(room: DungeonRoom, region: RegionId): void {
  const generated = createRoom(region);
  for (const { key } of roomFields)
    Object.assign(room, {
      [key]: (generated as unknown as Record<string, unknown>)[key],
    });
  room.sources = generated.sources;
}
export function createDungeonCandidate(
  campaignId: string,
  region: RegionId,
  roomCount = 4,
): Dungeon {
  const candidate = createDungeon(campaignId, dungeonTitle(), region);
  candidate.sources = {
    ...candidate.sources,
    title:
      sourceCitation('core.titleA') + ' + ' + sourceCitation('core.titleB'),
  };
  candidate.rooms = Array.from(
    { length: Math.max(0, Math.min(12, roomCount)) },
    () => createRoom(region),
  );
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
  if (kind === 'monsters') return loadMonsterPreset(id(), record);
  if (typeof record.hp !== 'number')
    throw new Error(
      '원문에 일반 HP가 없는 개체입니다. 직접 작성으로 기록하세요.',
    );
  const entity = generateEntity('npcs', 'graven-tosk', 'common', true);
  const raw = entity as unknown as Record<string, unknown>;
  const source = `${record.book === 'heretic' ? 'MÖRK BORG CULT: HERETIC' : 'MÖRK BORG BARE BONES EDITION'} · PDF ${scalarText(record.pdfPage)}쪽${record.context ? ` · ${scalarText(record.context)}` : ''}`;
  for (const field of entityFields[kind]) {
    const value = record[field.key];
    if (typeof value === 'string' || typeof value === 'number') {
      raw[field.key] = value;
      entity.sources![field.key] = source;
    }
  }
  entity.morale = scalarText(
    record.moraleDisplay ??
      (record.morale === null ? '—' : (record.morale ?? '')),
  );
  if (kind === 'npcs') {
    (entity as EntityMap['npcs']).archetype = scalarText(
      record.archetype ?? record.concept ?? record.name ?? '',
    );
    if (record.description)
      (entity as EntityMap['npcs']).appearance = scalarText(record.description);
  }
  const options = record.attackOptions;
  if (Array.isArray(options) && options.length) {
    raw.attack = options
      .map(
        (o) =>
          `${scalarText(o.name ?? o.attack ?? '')} ${scalarText(o.damage ?? '')}`,
      )
      .join(' / ');
    raw.damage = '원문의 공격별 수치 참조';
  }
  entity.generation = { system: 'preset', rolls: {} };
  entity.notes = record.context ? scalarText(record.context) : '';
  const formatTable = (value: unknown): string => {
    if (
      !value ||
      typeof value !== 'object' ||
      !('entries' in value) ||
      !Array.isArray(value.entries)
    )
      return '';
    return value.entries
      .map(
        (e: Record<string, unknown>) =>
          `${scalarText(e.roll ?? e.min ?? '')}${e.max && e.max !== e.min ? `–${scalarText(e.max)}` : ''}: ${scalarText(e.text ?? e.name ?? e.attack ?? '')}${e.damage ? ` ${scalarText(e.damage)}` : ''}${e.effect ? ` — ${scalarText(e.effect)}` : ''}`,
      )
      .join('\n');
  };
  if (
    record.attackTable &&
    typeof record.attackTable === 'object' &&
    'entries' in record.attackTable &&
    Array.isArray(record.attackTable.entries) &&
    record.attackTable.entries.length
  ) {
    const data = record.attackTable as {
      entries: Array<{ attack: string; damage: string }>;
    };
    const chosen = pick(data.entries);
    raw.attack = chosen.attack;
    raw.damage = chosen.damage;
    entity.sources!.attack = source + ' · 원문 d4 무기 표';
    entity.sources!.damage = entity.sources!.attack;
  }
  if (record.actionTable) {
    raw.attack = '매 라운드 원문 d4 행동 표';
    raw.damage = '행동별 피해';
    entity.specialAbility =
      (entity.specialAbility ?? '') + '\n' + formatTable(record.actionTable);
    entity.sources!.specialAbility = source;
  }
  for (const key of ['traits', 'specialty', 'values']) {
    const text = formatTable(record[key]);
    if (text) entity.notes += `\n\n${key} (${source})\n${text}`;
  }
  return entity;
}
