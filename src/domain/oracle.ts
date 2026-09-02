export const ORACLE_CATEGORIES = [
  'SOLO',
  'ACTION',
  'THEME',
  'NPC',
  'MONSTER',
  'DUNGEON',
  'ROOM',
  'LOCATION',
  'ENCOUNTER',
  'TREASURE',
  'EVENT',
  'REACTION',
  'RUMOR',
  'WEATHER',
  'NAME',
  'DESCRIPTION',
  'OTHER',
] as const;
export type OracleCategory = (typeof ORACLE_CATEGORIES)[number];
export interface SourceBook {
  id: string;
  title: string;
  fileName?: string;
}
export interface OracleEntry {
  id: string;
  min: number;
  max: number;
  text: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  sourceUnclear?: boolean;
}
export interface OracleDefinition {
  id: string;
  sourceBookId: string;
  sourcePage: number | number[] | null;
  printedPage?: number | string | null;
  title: string;
  category: OracleCategory;
  dice: string;
  originalDice?: string;
  description?: string;
  entries: OracleEntry[];
  tags: string[];
  sourceVerified: boolean;
  section?: string;
  sourceNote?: string;
  licenseNote?: string;
  duplicatePages?: number[];
  /** Reference tables remain searchable, but are never rolled with invented odds. */
  rollable?: boolean;
  allowedGaps?: number[];
  allowOverlap?: boolean;
  canonicalTableId?: string;
}
export interface OracleProcedure {
  id: string;
  title: string;
  oracleIds: string[];
  description?: string;
  rollLabels?: string[];
}
export interface OraclePack {
  schemaVersion: 1;
  books: SourceBook[];
  tables: OracleDefinition[];
  procedures: OracleProcedure[];
  /** Metadata only: the original generator entries remain in their one canonical pack. */
  overrides?: Record<string, Partial<Omit<OracleDefinition, 'id' | 'entries'>>>;
  entrySelectors?: Record<string, { min: number; max: number }[]>;
}
export interface OracleRegistry {
  books: SourceBook[];
  tables: OracleDefinition[];
  procedures: OracleProcedure[];
}
export interface OracleRoll {
  oracleId: string;
  title: string;
  dice: string;
  roll: number;
  diceValues: number[];
  entryId: string | null;
  text: string;
  source: string;
  metadata?: Record<string, unknown>;
}
export interface OracleResult {
  id: string;
  title: string;
  rolls: OracleRoll[];
}
export interface OraclePreferences {
  schemaVersion: 1;
  favoriteIds: string[];
  source: string;
  category: string;
  dice: string;
}
