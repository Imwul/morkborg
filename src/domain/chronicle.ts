import type { SourceReference } from './types';
import type { OracleResult } from './oracle';

export const OBJECT_KINDS = [
  'character',
  'dungeon',
  'room',
  'monster',
  'npc',
  'encounter',
  'session',
  'thread',
  'rumor',
  'relic',
  'note',
  'event',
] as const;
export type ObjectKind = (typeof OBJECT_KINDS)[number];
/** A finite typed reference; room IDs are always scoped to their owning Dungeon. */
export interface ObjectLink {
  kind: ObjectKind;
  id: string;
  dungeonId?: string;
  relation?: string;
  quantity?: number;
}
export type Visibility = 'gm' | 'players';
export type DungeonPlayState =
  | 'unknown'
  | 'discovered'
  | 'active'
  | 'cleared'
  | 'abandoned';
export type RoomPlayState = 'hidden' | 'discovered' | 'visited' | 'cleared';
export type PlacementPlayState =
  | 'unknown'
  | 'encountered'
  | 'defeated'
  | 'fled'
  | 'dead'
  | 'removed';
export interface HiddenInformation {
  visibility?: Visibility;
  gmNotes?: string;
}
export interface ChronicleRecord extends HiddenInformation {
  id: string;
  title: string;
  notes: string;
  links: ObjectLink[];
  createdAt: string;
  updatedAt: string;
}
export interface SessionEncounter {
  id: string;
  monsterId: string;
  /** Optional after a placement is removed; the Monster definition remains authoritative. */
  placementId: string | null;
  quantity: number;
  remaining: number;
  morale: string | number;
  notes: string;
  state: PlacementPlayState;
}
export interface Session extends ChronicleRecord {
  number?: number;
  date: string;
  inWorldDate: string;
  characterIds: string[];
  summary: string;
  status: 'planned' | 'active' | 'ended';
  encounters: SessionEncounter[];
}
export const EVENT_TYPES = [
  'session',
  'character-death',
  'npc-death',
  'dungeon-discovery',
  'room-discovery',
  'placement-state',
  'relic-acquired',
  'misery',
  'oracle',
  'custom',
  'note',
  'thread',
  'rumor',
  'travel',
] as const;
export type EventType = (typeof EVENT_TYPES)[number];
export interface TimelineEvent {
  id: string;
  type: EventType;
  title: string;
  description: string;
  date: string;
  inWorldDate: string;
  sessionId: string | null;
  links: ObjectLink[];
  sourceRefs: SourceReference[];
  oracle?: OracleResult;
  createdAt: string;
  updatedAt: string;
}
export interface CampaignThread extends ChronicleRecord {
  description: string;
  status: 'open' | 'resolved' | 'failed' | 'abandoned';
}
export interface Rumor extends ChronicleRecord {
  description: string;
  status: 'unknown' | 'heard' | 'confirmed' | 'false' | 'resolved';
}
export interface Relic extends ChronicleRecord {
  description: string;
  /** Current custody and historical origin are intentionally separate references. */
  holder: ObjectLink | null;
  origin: ObjectLink | null;
}
export interface JournalNote extends ChronicleRecord {
  text: string;
}
export interface MiseryRecord {
  id: string;
  roll: number | null;
  result: string;
  sourceRefs: SourceReference[];
  date: string;
  inWorldDate: string;
  sessionId: string | null;
  notes: string;
  terminal: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface ChronicleState {
  sessions: Session[];
  timeline: TimelineEvent[];
  threads: CampaignThread[];
  rumors: Rumor[];
  relics: Relic[];
  journalNotes: JournalNote[];
  miseries: MiseryRecord[];
  currentSessionId: string | null;
  campaignDay: number;
  apocalypseDie?: 2 | 6 | 10 | 20 | 100;
}
export const emptyChronicle = (): ChronicleState => ({
  sessions: [],
  timeline: [],
  threads: [],
  rumors: [],
  relics: [],
  journalNotes: [],
  miseries: [],
  currentSessionId: null,
  campaignDay: 1,
});
