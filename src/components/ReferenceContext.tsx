import { createContext, useContext, type ReactNode } from 'react';
import type {
  ReferenceEntry,
  ReferenceContext as ContextKind,
} from '../domain/references';
import type { RegionId } from '../domain/types';
export interface DeskContext {
  inlineChildren?: import('../domain/inlineReadingContinuity').InlineChildResults;
  onInlineChild?: (
    parent: import('../domain/oracle').OracleRoll,
    child: import('../domain/oracle').OracleRoll,
  ) => void;
  relationships?: import('../domain/referenceRelationships').ReferenceRelationshipIndex;
  openLookup?: (lookup: { oracleId: string; roll: number }) => void;
  selectedId?: string | null;
  content?: ReactNode;
  query?: string;
  setQuery?: (query: string) => void;
  scope?: 'all' | 'pinned' | 'recent';
  setScope?: (scope: 'all' | 'pinned' | 'recent') => void;
  trayIds?: string[];
  readings?: Record<
    string,
    import('../domain/referenceReading').ReferenceReading
  >;
  perform?: (id: string) => void;
  removeTray?: (id: string) => void;
  choose?: (
    table: import('../domain/oracle').OracleDefinition,
    entry: import('../domain/oracle').OracleEntry,
  ) => void;
  recordRoll?: (
    id: string,
    result: import('../domain/referenceReading').ReferenceReading,
    params?: Partial<
      import('../storage/conveniencePreferences').ExecutionParameters
    >,
  ) => void;
  activePack?: import('../storage/conveniencePreferences').ReferencePack;
  focusedIds?: string[];
  openTools?: (
    tab?:
      | 'play'
      | 'recipes'
      | 'packs'
      | 'scratch'
      | 'physical'
      | 'replay',
  ) => void;
  clearPack?: () => void;
  addTray?: (id: string) => void;
  entries: ReferenceEntry[];
  byId: Record<string, ReferenceEntry>;
  activate: (id: string, roll?: boolean, region?: RegionId) => void;
  dismiss?: () => void;
  openSearch: (query?: string, scope?: 'all' | 'pinned' | 'recent') => void;
  search: (query: string, limit?: number) => ReferenceEntry[];
  openTable?: (id: string) => void;
  contextual: (context: ContextKind, region?: RegionId) => ReferenceEntry[];
  pinnedIds: string[];
  recentIds: string[];
  touch: (id: string) => void;
  togglePin: (id: string) => void;
}
export const ReferenceContext = createContext<DeskContext | null>(null);
export const useReferenceDesk = () => useContext(ReferenceContext);
