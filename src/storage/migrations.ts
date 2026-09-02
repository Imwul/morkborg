import type {
  AppSave,
  Campaign,
  Dungeon,
  DungeonRoom,
  RegionId,
} from '../domain/types';
import { dungeonFields, roomFields, emptyWorkspace } from '../domain/types';
import { regions } from '../data/regions';
import { validateSave } from './schema';

export const STORAGE_KEY = 'morkborg-codex:v2';
export const PREVIOUS_STORAGE_KEY = 'morkborg-codex:v1';
export const MIGRATION_BACKUP_KEY = 'morkborg-codex:pre-v2-backup';
export interface SaveStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  key(index: number): string | null;
  readonly length: number;
}
export const emptySave = (): AppSave => ({
  schemaVersion: 2,
  campaigns: [],
  activeCampaignId: null,
  view: 'campaigns',
});
const object = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
const uuid = (value: unknown) =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  )
    ? value
    : crypto.randomUUID();
const text = (value: unknown) =>
  typeof value === 'string'
    ? value
    : typeof value === 'number'
      ? String(value)
      : '';
const timestamp = (value: unknown, fallback: string) =>
  typeof value === 'string' && Number.isFinite(Date.parse(value))
    ? new Date(value).toISOString()
    : fallback;
const normalizeRegion = (value: unknown): RegionId | undefined => {
  const name = text(value)
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
  return regions.find((r) =>
    [r.id, r.name].some(
      (v) =>
        v
          .normalize('NFD')
          .replace(/\p{M}/gu, '')
          .toLowerCase()
          .replace(/[^a-z]/g, '') === name,
    ),
  )?.id;
};
function fieldValues(raw: Record<string, unknown>, specs: { key: string }[]) {
  const values: Record<string, string> = {};
  const sources = { ...object(raw.sources) } as Record<string, string>;
  const generated = object(raw.generatedFields) ?? raw;
  for (const { key } of specs) {
    const original = raw[key] ?? generated[key];
    const field = object(original);
    values[key] = text(field ? field.value : original);
    if (typeof field?.source === 'string') sources[key] = field.source;
  }
  return { values, sources };
}

/** Only recognizable dungeon records are converted; original bytes remain backed up. */
export function migrateSave(input: unknown): AppSave {
  const value = object(input);
  if (!value) throw new Error('저장 데이터가 객체가 아닙니다.');
  if ('campaigns' in value) return validateSave(value);
  if (
    'schemaVersion' in value &&
    value.schemaVersion !== 1 &&
    value.schemaVersion !== 2
  )
    throw new Error('지원하지 않는 저장 버전입니다. 원본을 보존했습니다.');
  const raw = object(value.dungeon) ?? object(value.currentDungeon) ?? value;
  if (
    [
      value,
      raw,
      ...(Array.isArray(raw.rooms)
        ? raw.rooms.map(object).filter(Boolean)
        : []),
    ].some(
      (record) =>
        record &&
        ['characters', 'monsters', 'npcs', 'encounters'].some(
          (key) => Array.isArray(record[key]) && record[key].length > 0,
        ),
    )
  )
    throw new Error(
      '구형 데이터의 연결된 보관함 형식을 확인해야 합니다. 원본을 보존했습니다.',
    );
  const generated = object(raw.generatedFields) ?? raw;
  const recognized =
    Array.isArray(raw.rooms) &&
    typeof (raw.title ?? raw.name) === 'string' &&
    typeof raw.region === 'string' &&
    dungeonFields.filter((f) => f.key in generated || f.key in raw).length >= 2;
  if (!recognized)
    throw new Error('알 수 없는 단일 던전 형식입니다. 원본을 보존했습니다.');
  const region = normalizeRegion(raw.region);
  if (!region)
    throw new Error(
      '구형 던전의 지역을 확인할 수 없습니다. 원본을 보존했습니다.',
    );
  const stamp = new Date().toISOString();
  const campaignId = crypto.randomUUID();
  const refs = { monsterIds: [], npcIds: [], encounterIds: [] };
  if (
    ['monsterIds', 'npcIds', 'encounterIds'].some(
      (k) => Array.isArray(raw[k]) && raw[k].length > 0,
    )
  )
    throw new Error(
      '연결된 보관함이 없는 구형 던전입니다. 원본을 보존했습니다.',
    );
  const rooms = (raw.rooms as unknown[]).map((input): DungeonRoom => {
    const r = object(input);
    if (!r) throw new Error('구형 방 데이터를 읽을 수 없습니다.');
    if (
      ['monsterIds', 'npcIds', 'encounterIds'].some(
        (k) => Array.isArray(r[k]) && r[k].length > 0,
      )
    )
      throw new Error('구형 방의 연결된 보관함을 확인해야 합니다.');
    const fields = fieldValues(r, roomFields);
    return {
      ...structuredClone(refs),
      id: uuid(r.id),
      notes: text(r.notes),
      ...fields.values,
      sources: fields.sources,
      name: fields.values.name || text(r.title),
    } as unknown as DungeonRoom;
  });
  const generatedFields = fieldValues(raw, dungeonFields);
  const dungeon = {
    ...structuredClone(refs),
    ...generatedFields.values,
    sources: generatedFields.sources,
    id: uuid(raw.id),
    campaignId,
    title: text(raw.title ?? raw.name),
    region,
    rooms,
    notes: text(raw.notes),
    createdAt: timestamp(raw.createdAt, stamp),
    updatedAt: timestamp(raw.updatedAt, stamp),
  } as unknown as Dungeon;
  const c: Campaign = {
    id: campaignId,
    title: 'Untitled Campaign',
    subtitle: '',
    description: '',
    createdAt: stamp,
    updatedAt: stamp,
    dungeons: [dungeon],
    notes: '',
    characters: [],
    monsters: [],
    npcs: [],
    encounters: [],
    drafts: { characters: null, monsters: null, npcs: null, encounters: null },
    workspace: emptyWorkspace(),
  };
  return validateSave({ ...emptySave(), campaigns: [c] });
}

export function loadStoredSave(storage: SaveStorage): {
  save: AppSave;
  migrated: string[];
} {
  const current = storage.getItem(STORAGE_KEY);
  if (current !== null)
    return { save: validateSave(JSON.parse(current)), migrated: [] };
  const previous = storage.getItem(PREVIOUS_STORAGE_KEY);
  const originals: { key: string; raw: string }[] = [];
  let save = emptySave();
  if (previous !== null) {
    save = migrateSave(JSON.parse(previous));
    originals.push({ key: PREVIOUS_STORAGE_KEY, raw: previous });
  } else {
    // Inspect only actual MÖRK BORG keys on this origin; never guess a historical key.
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (!key || !/m[oö]rk.*borg/i.test(key) || /rules|backup/i.test(key))
        continue;
      const raw = storage.getItem(key);
      if (!raw) continue;
      try {
        const candidate = migrateSave(JSON.parse(raw));
        save.campaigns.push(...candidate.campaigns);
        originals.push({ key, raw });
      } catch {
        /* Unrecognized records stay untouched at their original keys. */
      }
    }
  }
  if (originals.length) {
    save = validateSave(save);
    const existingBackup = storage.getItem(MIGRATION_BACKUP_KEY);
    if (existingBackup === null)
      storage.setItem(MIGRATION_BACKUP_KEY, JSON.stringify(originals));
    else {
      const records = JSON.parse(existingBackup) as {
        key: string;
        raw: string;
      }[];
      for (const entry of originals)
        if (!records.some((r) => r.key === entry.key && r.raw === entry.raw))
          records.push(entry);
      storage.setItem(MIGRATION_BACKUP_KEY, JSON.stringify(records));
    }
    storage.setItem(STORAGE_KEY, JSON.stringify(save));
  }
  return { save, migrated: originals.map((o) => o.key) };
}
