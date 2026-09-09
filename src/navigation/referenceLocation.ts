import { z } from 'zod';
import { REGION_IDS } from '../domain/types';
const schema = z.object({
  selectedId: z.string().max(300).nullable(),
  trail: z.array(z.string().max(300)).max(20),
  tableView: z.boolean(),
  searchOpen: z.boolean(),
  query: z.string().max(2000),
  scope: z.enum(['all', 'pinned', 'recent']),
  panel: z.enum(['play', 'recipes', 'packs', 'scratch', 'physical']).nullable(),
  region: z.enum(REGION_IDS),
});
export type ReferenceLocation = z.infer<typeof schema>;
export const emptyReferenceLocation = (): ReferenceLocation => ({
  selectedId: null,
  trail: [],
  tableView: false,
  searchOpen: false,
  query: '',
  scope: 'all',
  panel: null,
  region: 'sarkash',
});
export const normalizeReferenceLocation = (raw: unknown) =>
  schema.safeParse(raw).data ?? emptyReferenceLocation();
/** Typing, region choices and rerolls update the current view, not the Back stack. */
export const referenceLocationKey = (value: ReferenceLocation) => ({
  selectedId: value.selectedId,
  tableView: value.tableView,
  searchOpen: value.searchOpen,
  scope: value.searchOpen ? value.scope : null,
  panel: value.panel,
});
