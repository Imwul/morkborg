import { z } from 'zod';
import {
  REGION_IDS,
  dungeonFields,
  roomFields,
  entityFields,
} from '../domain/types';
import type { AppSave, Campaign, LibraryKind } from '../domain/types';
import { upgradeCampaignCharacters } from './characterMigration';
const text = z.string();
const uuid = z.uuid();
const time = z.iso.datetime();
const provenance = {
  sources: z.record(z.string(), z.string()).optional(),
  generation: z
    .object({ system: z.string(), rolls: z.record(z.string(), z.number()) })
    .optional(),
};
const base = {
  ...provenance,
  id: uuid,
  name: text,
  notes: text,
  createdAt: time,
  updatedAt: time,
};
const fields = (kind: LibraryKind) =>
  Object.fromEntries(
    entityFields[kind]
      .filter((f) => f.key !== 'name')
      .map((f) => [
        f.key,
        f.key === 'morale' || (kind === 'npcs' && f.key === 'hp')
          ? z.union([
              z.string(),
              z
                .number()
                .int()
                .min(0)
                .max(f.key === 'morale' ? 12 : 9999),
            ])
          : f.type === 'number'
            ? z
                .number()
                .int()
                .min(f.min ?? -9999999)
                .max(f.max ?? 9999999)
            : text,
      ]),
  );
const characterItem = z.object({
  id: uuid,
  text,
  source: text.optional(),
  tableId: text.optional(),
  slot: text.optional(),
});
const character = z.object({
  ...base,
  campaignId: uuid,
  className: text,
  classSource: text.optional(),
  hp: z.number().int().min(-999).max(9999),
  maxHp: z.number().int().min(1).max(9999),
  ...Object.fromEntries(
    ['strength', 'agility', 'presence', 'toughness'].map((key) => [
      key,
      z.number().int().min(-99).max(99),
    ]),
  ),
  armor: text,
  weapons: z.array(characterItem.extend({ damage: text })),
  equipment: z.array(characterItem),
  traits: z.array(characterItem),
  omens: z.number().int().min(0).max(999),
  silver: z.number().int().min(0).max(9999999),
  description: text,
  status: z.enum(['alive', 'dead']),
});
const monster = z.object({ ...base, ...fields('monsters') });
const npc = z.object({
  ...base,
  ...fields('npcs'),
  specialAbility: text.default(''),
});
const encounter = z.object({
  ...base,
  ...fields('encounters'),
  category: z.enum(['common', 'rare']),
});
const refs = {
  monsterIds: z.array(uuid),
  npcIds: z.array(uuid),
  encounterIds: z.array(uuid),
};
const room = z.object({
  ...provenance,
  id: uuid,
  notes: text,
  ...refs,
  ...Object.fromEntries(roomFields.map((f) => [f.key, text])),
});
const dungeon = z.object({
  ...provenance,
  id: uuid,
  campaignId: uuid,
  title: text,
  region: z.enum(REGION_IDS),
  notes: text,
  createdAt: time,
  updatedAt: time,
  rooms: z.array(room),
  ...refs,
  ...Object.fromEntries(dungeonFields.map((f) => [f.key, text])),
});
const selection = z.object({
  characters: uuid.nullable(),
  monsters: uuid.nullable(),
  npcs: uuid.nullable(),
  encounters: uuid.nullable(),
});
const campaign = z.object({
  id: uuid,
  title: text.min(1),
  subtitle: text,
  description: text.optional(),
  createdAt: time,
  updatedAt: time,
  characters: z.array(character),
  dungeons: z.array(dungeon),
  dungeonDraft: dungeon.nullable().optional(),
  monsters: z.array(monster),
  npcs: z.array(npc),
  encounters: z.array(encounter),
  notes: text,
  drafts: z.object({
    characters: character.nullable(),
    monsters: monster.nullable(),
    npcs: npc.nullable(),
    encounters: encounter.nullable(),
  }),
  workspace: z.object({
    section: z.enum([
      'overview',
      'characters',
      'dungeons',
      'monsters',
      'encounters',
      'notes',
      'about',
    ]),
    dungeonTab: z.enum([
      'overview',
      'rooms',
      'monsters',
      'npcs',
      'encounters',
      'notes',
    ]),
    dungeonPreview: z.boolean().optional(),
    pendingRegion: z.enum(REGION_IDS).optional(),
    dungeonId: uuid.nullable(),
    roomId: uuid.nullable(),
    stockingKind: z.enum(['encounters', 'npcs']),
    selected: selection,
  }),
});
export function validateCampaign(input: unknown): Campaign {
  const parsed = campaign.safeParse(upgradeCampaignCharacters(input));
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new Error(
      `Invalid campaign at ${first.path.join('.')}: ${first.message}`,
    );
  }
  const c = parsed.data as unknown as Campaign;
  const all = [
    c.id,
    ...[...c.dungeons, ...(c.dungeonDraft ? [c.dungeonDraft] : [])].flatMap(
      (d) => [d.id, ...d.rooms.map((r) => r.id)],
    ),
    ...c.characters.map((e) => e.id),
    ...c.monsters.map((e) => e.id),
    ...c.npcs.map((e) => e.id),
    ...c.encounters.map((e) => e.id),
    ...Object.values(c.drafts)
      .filter(Boolean)
      .map((e) => e!.id),
    ...[
      ...c.characters,
      ...(c.drafts.characters ? [c.drafts.characters] : []),
    ].flatMap((ch) =>
      [...ch.weapons, ...ch.equipment, ...ch.traits].map((item) => item.id),
    ),
  ];
  if (new Set(all).size !== all.length)
    throw new Error('Campaign contains duplicate IDs.');
  for (const ch of [
    ...c.characters,
    ...(c.drafts.characters ? [c.drafts.characters] : []),
  ])
    if (ch.campaignId !== c.id)
      throw new Error('Character belongs to another campaign.');
  const kinds = ['monsters', 'npcs', 'encounters'] as const;
  for (const d of [
    ...c.dungeons,
    ...(c.dungeonDraft ? [c.dungeonDraft] : []),
  ]) {
    if (d.campaignId !== c.id)
      throw new Error('Dungeon belongs to another campaign.');
    for (const target of [d, ...d.rooms])
      for (const kind of kinds) {
        const key =
          kind === 'monsters'
            ? 'monsterIds'
            : kind === 'npcs'
              ? 'npcIds'
              : 'encounterIds';
        if (new Set(target[key]).size !== target[key].length)
          throw new Error('Duplicate assignment.');
        for (const ref of target[key])
          if (!c[kind].some((e) => e.id === ref))
            throw new Error('Campaign contains a missing library reference.');
        if (target !== d && target[key].some((ref) => !d[key].includes(ref)))
          throw new Error('Room contents must belong to their dungeon.');
      }
  }
  const w = c.workspace;
  const d = c.dungeons.find((x) => x.id === w.dungeonId);
  if (w.dungeonId && !d) throw new Error('Selected dungeon does not exist.');
  if (w.roomId && !d?.rooms.some((r) => r.id === w.roomId))
    throw new Error('Selected room does not exist.');
  for (const kind of ['characters', ...kinds] as const) {
    const selected = w.selected[kind];
    if (
      selected &&
      !c[kind].some((e) => e.id === selected) &&
      c.drafts[kind]?.id !== selected
    )
      throw new Error('Selected object does not exist.');
  }
  return c;
}
export function validateSave(input: unknown): AppSave {
  const shape = z
    .object({
      schemaVersion: z.union([z.literal(1), z.literal(2), z.literal(3)]),
      campaigns: z.array(z.unknown()),
      activeCampaignId: uuid.nullable(),
      view: z.enum(['campaigns', 'campaign']).optional(),
    })
    .safeParse(input);
  if (!shape.success)
    throw new Error(
      'Unsupported or damaged save file. Expected schema version 1, 2 or 3.',
    );
  const campaigns = shape.data.campaigns.map(validateCampaign);
  const all = campaigns.map((c) => c.id);
  if (new Set(all).size !== all.length)
    throw new Error('Duplicate campaign IDs.');
  if (shape.data.activeCampaignId && !all.includes(shape.data.activeCampaignId))
    throw new Error('Active campaign is missing.');
  return {
    schemaVersion: 3,
    campaigns,
    activeCampaignId: shape.data.activeCampaignId,
    view:
      shape.data.view ??
      (shape.data.activeCampaignId ? 'campaign' : 'campaigns'),
  };
}
export function parseImport(raw: string): Campaign[] {
  if (raw.length > 20 * 1024 * 1024)
    throw new Error('가져올 JSON은 20MB 이하여야 합니다.');
  const value: unknown = JSON.parse(raw);
  if (
    !value ||
    typeof value !== 'object' ||
    !('schemaVersion' in value) ||
    (value.schemaVersion !== 1 &&
      value.schemaVersion !== 2 &&
      value.schemaVersion !== 3)
  )
    throw new Error(
      '지원하지 않는 파일입니다. Campaign Codex에서 내보낸 버전 1, 2 또는 3 JSON을 사용하세요.',
    );
  if ('campaign' in value) return [validateCampaign(value.campaign)];
  return validateSave(value).campaigns;
}
