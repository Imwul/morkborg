import type { MythicState } from './mythic';
export const REGION_IDS = [
  'galgenbeck',
  'sarkash',
  'graven-tosk',
  'grift',
  'kergus',
  'wastland',
  'valley-undead',
] as const;
export type RegionId = (typeof REGION_IDS)[number];
export type Section =
  | 'overview'
  | 'characters'
  | 'dungeons'
  | 'monsters'
  | 'encounters'
  | 'notes'
  | 'about';
export type LibraryKind = 'characters' | 'monsters' | 'encounters' | 'npcs';
export type DungeonTab =
  | 'overview'
  | 'rooms'
  | 'monsters'
  | 'npcs'
  | 'encounters'
  | 'notes';
export interface Provenance {
  sources?: Record<string, string>;
  generation?: { system: string; rolls: Record<string, number> };
}
export interface BaseEntity extends Provenance {
  id: string;
  name: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}
export interface CharacterItem {
  id: string;
  text: string;
  source?: string;
  tableId?: string;
  slot?: string;
  entryRoll?: number;
}
export interface CharacterWeapon extends CharacterItem {
  damage: string;
}
export interface Character extends BaseEntity {
  campaignId: string;
  className: string;
  classSource?: string;
  classId?: string;
  background?: CharacterItem[];
  classFeatures?: CharacterItem[];
  powerUses?: number;
  hp: number;
  maxHp: number;
  strength: number;
  agility: number;
  presence: number;
  toughness: number;
  armor: string;
  weapons: CharacterWeapon[];
  equipment: CharacterItem[];
  traits: CharacterItem[];
  omens: number;
  silver: number;
  description: string;
  status: 'alive' | 'dead';
}
export interface MonsterAttack extends Provenance {
  id: string;
  name: string;
  damage: string;
  description: string;
  tableId?: string;
}
export interface MonsterText {
  id: string;
  text: string;
  source?: string;
  tableId?: string;
}
export interface Monster extends BaseEntity {
  campaignId: string;
  concept: string;
  appearance: string;
  behavior: string;
  wants: string;
  hp: number;
  morale: number | string;
  armor: string;
  attacks: MonsterAttack[];
  special: MonsterText[];
  weakness: MonsterText[];
  weirdTrait: string;
  loot: MonsterText[];
  description: string;
}
export interface MonsterTarget {
  dungeonId: string;
  roomId: string | null;
}
export interface MonsterPlacement extends MonsterTarget {
  id: string;
  monsterId: string;
  quantity: number;
  notes: string;
}
export interface NPC extends BaseEntity {
  archetype: string;
  appearance: string;
  behaviour: string;
  wants: string;
  secret: string;
  specialAbility?: string;
  hp: number | string;
  morale: number | string;
  armor: string;
  attack: string;
  damage: string;
  possession: string;
}
export interface Encounter extends BaseEntity {
  category: 'common' | 'rare';
  description: string;
  sign: string;
  complication: string;
  treasure: string;
}
export interface Assignment {
  /** Derived compatibility index. MonsterPlacement is the authoritative relation. */
  monsterIds: string[];
  npcIds: string[];
  encounterIds: string[];
}
export interface DungeonRoom extends Assignment, Provenance {
  id: string;
  name: string;
  description: string;
  feature: string;
  danger: string;
  treasure: string;
  encounter: string;
  notes: string;
}
export interface Dungeon extends Assignment, Provenance {
  id: string;
  campaignId: string;
  title: string;
  region: RegionId;
  premise: string;
  status: string;
  formerPurpose: string;
  inhabitants: string;
  motive: string;
  entrance: string;
  entranceCondition: string;
  distinctiveFeature: string;
  environmentalDanger: string;
  weirdPhenomenon: string;
  treasure: string;
  rooms: DungeonRoom[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}
export interface EntityMap {
  characters: Character;
  monsters: Monster;
  npcs: NPC;
  encounters: Encounter;
}
export interface Workspace {
  section: Section;
  dungeonTab: DungeonTab;
  dungeonPreview?: boolean;
  pendingRegion?: RegionId;
  dungeonId: string | null;
  roomId: string | null;
  stockingKind: 'encounters' | 'npcs';
  selected: Record<LibraryKind, string | null>;
  monsterTarget?: MonsterTarget | null;
}
export interface Campaign {
  /** Added lazily to older v4 campaigns; absent means the standard Chaos5 defaults. */
  mythic?: MythicState;
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  characters: Character[];
  dungeons: Dungeon[];
  dungeonDraft?: Dungeon | null;
  monsters: Monster[];
  monsterPlacements: MonsterPlacement[];
  npcs: NPC[];
  encounters: Encounter[];
  notes: string;
  drafts: { [K in LibraryKind]: EntityMap[K] | null };
  workspace: Workspace;
}
export interface AppSave {
  /** Standalone Fate state when no campaign is open. */
  mythic?: MythicState;
  schemaVersion: 4;
  campaigns: Campaign[];
  activeCampaignId: string | null;
  view: 'campaigns' | 'campaign';
}
export interface FieldSpec {
  key: string;
  label: string;
  type?: 'number' | 'line';
  min?: number;
  max?: number;
}
export const dungeonFields: FieldSpec[] = [
  { key: 'premise', label: '발단' },
  { key: 'status', label: '현재 상태' },
  { key: 'formerPurpose', label: '과거 용도' },
  { key: 'inhabitants', label: '거주자' },
  { key: 'motive', label: '이곳에 온 이유' },
  { key: 'entrance', label: '입구' },
  { key: 'entranceCondition', label: '입구 상태' },
  { key: 'distinctiveFeature', label: '독특한 특징' },
  { key: 'environmentalDanger', label: '환경적 위험' },
  { key: 'weirdPhenomenon', label: '기이한 현상' },
  { key: 'treasure', label: '찾는 물건' },
];
export const roomFields: FieldSpec[] = [
  { key: 'name', label: '방 이름' },
  { key: 'description', label: '묘사' },
  { key: 'feature', label: '특징' },
  { key: 'danger', label: '위험 / 함정' },
  { key: 'treasure', label: '보물' },
  { key: 'encounter', label: '조우' },
];
export const entityFields: Record<LibraryKind, FieldSpec[]> = {
  characters: [
    { key: 'name', label: '이름', type: 'line' },
    { key: 'archetype', label: '직업 / 유형', type: 'line' },
    { key: 'hp', label: 'HP', type: 'number', min: -999, max: 9999 },
    { key: 'strength', label: '근력', type: 'number', min: -99, max: 99 },
    { key: 'agility', label: '민첩', type: 'number', min: -99, max: 99 },
    { key: 'presence', label: '지각', type: 'number', min: -99, max: 99 },
    { key: 'toughness', label: '체력', type: 'number', min: -99, max: 99 },
    { key: 'armor', label: '방어구', type: 'line' },
    { key: 'weapons', label: '무기' },
    { key: 'equipment', label: '장비' },
    { key: 'omens', label: '징조', type: 'number', min: 0, max: 999 },
    { key: 'silver', label: '은화', type: 'number', min: 0, max: 9999999 },
    { key: 'description', label: '묘사 / 성향' },
  ],
  monsters: [
    { key: 'name', label: '이름', type: 'line' },
    { key: 'concept', label: '종류 / 개념' },
    { key: 'hp', label: 'HP', type: 'number', min: 0, max: 9999 },
    { key: 'morale', label: '사기', type: 'line' },
    { key: 'armor', label: '방어구', type: 'line' },
    { key: 'attack', label: '공격', type: 'line' },
    { key: 'damage', label: '피해', type: 'line' },
    { key: 'appearance', label: '외형' },
    { key: 'behaviour', label: '행동' },
    { key: 'wants', label: '욕망' },
    { key: 'specialAbility', label: '특수 능력' },
    { key: 'weakness', label: '약점' },
    { key: 'weirdTrait', label: '기이한 특성' },
    { key: 'loot', label: '전리품' },
  ],
  npcs: [
    { key: 'name', label: '이름', type: 'line' },
    { key: 'archetype', label: '유형', type: 'line' },
    { key: 'hp', label: 'HP', type: 'line' },
    { key: 'morale', label: '사기', type: 'line' },
    { key: 'armor', label: '방어구', type: 'line' },
    { key: 'attack', label: '공격', type: 'line' },
    { key: 'damage', label: '피해', type: 'line' },
    { key: 'appearance', label: '외형' },
    { key: 'behaviour', label: '행동' },
    { key: 'wants', label: '욕망' },
    { key: 'secret', label: '비밀' },
    { key: 'specialAbility', label: '특수 능력' },
    { key: 'possession', label: '소지품' },
  ],
  encounters: [
    { key: 'name', label: '이름', type: 'line' },
    { key: 'description', label: '묘사' },
    { key: 'sign', label: '첫 징후' },
    { key: 'complication', label: '변수' },
    { key: 'treasure', label: '보상 / 발견' },
  ],
};
export const emptyWorkspace = (): Workspace => ({
  section: 'dungeons',
  dungeonTab: 'overview',
  dungeonId: null,
  roomId: null,
  stockingKind: 'encounters',
  selected: { characters: null, monsters: null, npcs: null, encounters: null },
});
