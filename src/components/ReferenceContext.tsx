import { createContext, useContext } from 'react';
import type {
  ReferenceEntry,
  ReferenceContext as ContextKind,
} from '../domain/references';
import type { RegionId } from '../domain/types';
export interface DeskContext {
  entries: ReferenceEntry[];
  byId: Record<string, ReferenceEntry>;
  activate: (id: string, roll?: boolean) => void;
  openSearch: (query?: string, scope?: 'all' | 'pinned' | 'recent') => void;
  contextual: (context: ContextKind, region?: RegionId) => ReferenceEntry[];
  pinnedIds: string[];
  recentIds: string[];
  togglePin: (id: string) => void;
}
export const ReferenceContext = createContext<DeskContext | null>(null);
export const useReferenceDesk = () => useContext(ReferenceContext);
