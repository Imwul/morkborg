import { createContext, useContext } from 'react';
import type {
  ReferenceEntry,
  ReferenceContext as ContextKind,
} from '../domain/references';
import type { RegionId } from '../domain/types';
export interface DeskContext {
  recordRoll?: (
    id: string,
    result: import('../domain/referenceReading').ReferenceReading,
    params?: Partial<
      import('../storage/conveniencePreferences').ExecutionParameters
    >,
  ) => void;
  rememberRoom?: (dungeonId: string, roomId: string) => void;
  returnedRoomId?: string | null;
  activePack?: import('../storage/conveniencePreferences').ReferencePack;
  focusedIds?: string[];
  openTools?: (
    tab?:
      | 'play'
      | 'recipes'
      | 'packs'
      | 'scratch'
      | 'physical'
      | 'context'
      | 'replay',
  ) => void;
  clearPack?: () => void;
  addTray?: (id: string) => void;
  entries: ReferenceEntry[];
  byId: Record<string, ReferenceEntry>;
  activate: (id: string, roll?: boolean, region?: RegionId) => void;
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
