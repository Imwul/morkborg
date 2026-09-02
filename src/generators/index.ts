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
import { regionWeightFactor, REGION_WEIGHT_TABLES } from './regionWeights';
import { id, now, pick, rollDie, rollDice, weightedPick } from './random';
import {
  getRules,
  sourceCitation,
  type RuleEntry,
} from '../storage/rulesStore';

function scalarText(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number'
    ? String(value)
    : '';
}
export interface RuleRoll {
  value: string | number;
  source: string;
}
export const coreRule = (page: number, detail: string) =>
  `MÖRK BORG BARE BONES EDITION · PDF ${page}쪽 · ${detail}`;
function entries(tableId: string): RuleEntry[] {
  const table = getRules()?.tables[tableId];
  if (!table) throw new Error(`원문 표를 불러와야 합니다: ${tableId}`);
  return table.entries;
}
export function sampleEntry(tableId: string, region?: RegionId): RuleEntry {
  return weightedPick(
    entries(tableId).map((entry) => ({
      value: entry,
      weight: entry.weight * regionWeightFactor(tableId, entry.text, region),
    })),
  );
}
function entryText(
  entry: RuleEntry,
  tableId: string,
  region?: RegionId,
): string {
  const sub = entry.followup
    ? weightedPick(
        entry.followup.map((value) => ({
          value,
          weight:
            value.weight * regionWeightFactor(tableId, value.text, region),
        })),
      )
    : undefined;
  return sub ? `${entry.text}: ${entryText(sub, tableId, region)}` : entry.text;
}
export function rollTable(tableId: string, region?: RegionId): RuleRoll {
  const entry = sampleEntry(tableId, region);
  return {
    value: entryText(entry, tableId, region),
    source:
      sourceCitation(tableId) +
      (region && REGION_WEIGHT_TABLES.has(tableId)
        ? ' · 지역 태그 확률 보정'
        : ''),
  };
}
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
export const abilityModifier = (total: number): number =>
  total <= 4
    ? -3
    : total <= 6
      ? -2
      : total <= 8
        ? -1
        : total <= 12
          ? 0
          : total <= 14
            ? 1
            : total <= 16
              ? 2
              : 3;
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
function resolveGear(entry: RuleEntry, presence: number): string {
  let text = entry.text.replace(/Presence\s*\+\s*(\d+)/g, (_, n: string) =>
    scalarText(presence + Number(n)),
  );
  if (entry.meta.scrollTable) {
    const table = scalarText(entry.meta.scrollTable);
    const scroll = sampleEntry('core.' + table);
    return `${table} scroll: ${scroll.text} — ${scalarText(scroll.meta.effect ?? '')}`;
  }
  if (entry.meta.quantity === 'd4')
    text = text.replace('d4 doses', `${rollDie(4)} doses`);
  if (entry.meta.companion && typeof entry.meta.companion === 'object') {
    const companion = entry.meta.companion as {
      count: number | string;
      hp: string;
      attack: string;
      damage: string;
    };
    const count =
      typeof companion.count === 'number' ? companion.count : rollDie(4);
    const die = companion.hp.startsWith('d6') ? 6 : 4;
    return `${text} [${count} creature(s); HP: ${Array.from({ length: count }, () => rollDie(die) + 2).join(', ')}]`;
  }
  return text;
}
function equipment(presence: number): string {
  const container = entryText(
    sampleEntry('core.containers'),
    'core.containers',
  );
  return `Waterskin; ${rollDie(4)} days of food; ${container}; ${resolveGear(sampleEntry('core.gearA'), presence)}; ${resolveGear(sampleEntry('core.gearB'), presence)}`;
}
function weapon(current: Partial<Character>): string {
  const hasScroll = /scroll/i.test(current.equipment ?? '');
  const entry = entries('core.weapons')[rollDie(hasScroll ? 6 : 10) - 1];
  return `${entry.text} ${scalarText(entry.meta.damage)}${entry.meta.ammunition ? `; ${scalarText(entry.meta.ammunition).replace('Presence + 10', scalarText((current.presence ?? 0) + 10))}` : ''}`;
}
function armor(current: Partial<Character>): string {
  const entry =
    entries('core.armor')[
      rollDie(/scroll/i.test(current.equipment ?? '') ? 2 : 4) - 1
    ];
  return `${entry.text}${entry.meta.damageReduction ? ` −${scalarText(entry.meta.damageReduction)}` : ''}${Number(entry.meta.agilityDRPenalty) > 0 ? ` (Agility DR +${scalarText(entry.meta.agilityDRPenalty)}; defence DR +${scalarText(entry.meta.defenseDRPenalty)})` : ''}`;
}
export function feretoryStats(rolls: { A: number; B: number; C: number }) {
  const values = Object.values(rolls);
  const highest = Math.max(...values),
    lowest = Math.min(...values);
  const sides =
    lowest <= 3
      ? 4
      : lowest <= 5
        ? 6
        : lowest <= 7
          ? 8
          : lowest <= 10
            ? 10
            : 12;
  const tied = Object.entries(rolls)
    .filter(([, value]) => value === highest)
    .map(([key]) => key);
  const options = tied.map((key) =>
    key === 'A'
      ? 'None'
      : key === 'B'
        ? '−d2'
        : highest % 2 === 1
          ? '−d4'
          : '−d6',
  );
  return {
    hp: 2 * rollDie(sides),
    morale: highest,
    damage: `d${sides}`,
    armor:
      options.length === 1
        ? options[0]
        : `동률 — 심판 선택: ${options.join(' / ')}`,
    sides,
  };
}
function fereAppearance(rolls: { A: number; B: number; C: number }): string {
  return (['A', 'B', 'C'] as const)
    .map((key) => entries('feretory.' + key)[rolls[key] - 1].text)
    .join('; ');
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
  if (kind === 'characters') {
    const c = (current ?? {}) as Partial<Character>;
    if (['strength', 'agility', 'presence', 'toughness'].includes(key))
      return {
        value: abilityModifier(rollDice(3, 6)),
        source: coreRule(27, '3d6 능력치 변환'),
      };
    if (key === 'hp')
      return {
        value: Math.max(1, (c.toughness ?? 0) + rollDie(8)),
        source: coreRule(29, 'max(1, Toughness + d8)'),
      };
    if (key === 'omens')
      return {
        value: rollDie(2),
        source: coreRule(37, 'Classless d2 Omens (선택 규칙)'),
      };
    if (key === 'silver')
      return {
        value: rollDice(2, 6) * 10,
        source: coreRule(21, '2d6 × 10 silver'),
      };
    if (key === 'archetype')
      return { value: 'Classless', source: coreRule(21, '기본 캐릭터') };
    if (key === 'equipment')
      return {
        value: equipment(c.presence ?? 0),
        source: coreRule(
          21,
          '시작 장비; PDF 22쪽 d12 두 표; scroll PDF 34–35쪽',
        ),
      };
    if (key === 'weapons')
      return {
        value: weapon(c),
        source: coreRule(23, 'd10; scroll 보유 시 d6'),
      };
    if (key === 'armor')
      return { value: armor(c), source: coreRule(23, 'd4; scroll 보유 시 d2') };
    if (key === 'description')
      return {
        value: `${rollTable('core.traits').value}; ${rollTable('core.traits').value}. ${rollTable('core.bodies').value}`,
        source: coreRule(
          38,
          'Terrible Traits d20 두 번; Broken Bodies PDF 39쪽',
        ),
      };
  }
  if (kind === 'monsters') {
    if (key === 'hp') {
      const damage = (current as Partial<Monster>)?.damage ?? 'd4';
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
  const entity: Record<string, unknown> = { ...base() };
  const sources: Record<string, string> = {};
  for (const field of entityFields[kind])
    entity[field.key] = field.type === 'number' && kind !== 'npcs' ? 0 : '';
  if (kind === 'characters') entity.status = 'Alive';
  if (kind === 'encounters') entity.category = category;
  if (!blank) {
    if (kind === 'monsters') {
      const rolls = { A: rollDie(12), B: rollDie(12), C: rollDie(12) };
      const stats = feretoryStats(rolls);
      Object.assign(entity, {
        name: personalName(),
        appearance: fereAppearance(rolls),
        hp: stats.hp,
        morale: stats.morale,
        armor: stats.armor,
        damage: stats.damage,
        wants: rollTable('feretory.desire').value,
        specialAbility: rollTable('feretory.trait').value,
        generation: { system: 'feretory', rolls },
      });
      for (const key of ['hp', 'morale', 'armor', 'damage'])
        sources[key] =
          `FERETORY · PDF 2쪽 · A=${rolls.A}, B=${rolls.B}, C=${rolls.C}${key === 'hp' ? ' · 피해 주사위 한 번 ×2 (본문; 괄호 예시와 불일치)' : ''}`;
      sources.name = sourceCitation('core.names');
      sources.appearance = sourceCitation('feretory.A');
      sources.wants = sourceCitation('feretory.desire');
      sources.specialAbility = sourceCitation('feretory.trait');
    } else if (kind === 'encounters' && category === 'rare') {
      const monster = generateEntity('monsters', region);
      entity.name = monster.name;
      entity.description = `${monster.appearance}\nHP ${monster.hp} · Morale ${monster.morale} · Armor ${monster.armor} · Damage ${monster.damage}\n${monster.wants}`;
      entity.complication = monster.specialAbility;
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
      const order =
        kind === 'characters'
          ? [
              'name',
              'archetype',
              'strength',
              'agility',
              'presence',
              'toughness',
              'hp',
              'equipment',
              'weapons',
              'armor',
              'omens',
              'silver',
              'description',
            ]
          : entityFields[kind].map((f) => f.key);
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
    id: id(),
    title,
    subtitle,
    description: subtitle,
    createdAt: now(),
    updatedAt: now(),
    characters: [],
    dungeons: [],
    monsters: [],
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
  if (typeof record.hp !== 'number')
    throw new Error(
      '원문에 일반 HP가 없는 개체입니다. 직접 작성으로 기록하세요.',
    );
  const entity = generateEntity(kind, 'graven-tosk', 'common', true);
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
