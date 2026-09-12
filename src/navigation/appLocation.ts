import { z } from 'zod';
import type { AppSave, Campaign, Workspace } from '../domain/types';
const section = z.enum([
  'sessions',
  'timeline',
  'threads',
  'rumors',
  'relics',
  'journal',
  'play',
  'procedures',
  'overview',
  'characters',
  'dungeons',
  'monsters',
  'npcs',
  'encounters',
  'notes',
  'about',
]);
const identifier = z.string().max(200).nullable();
const locationSchema = z.object({
  oracleOpen: z.boolean(),
  deskPage: z.enum(['home', 'desk', 'sources', 'travel', 'dungeon']),
  cityOpen: z.boolean(),
  legacyOracleOpen: z.boolean(),
  pendingSection: section.nullable(),
  view: z.enum(['campaigns', 'campaign']),
  campaignId: identifier,
  workspace: z
    .object({
      section,
      dungeonId: identifier,
      roomId: identifier,
      dungeonTab: z.enum([
        'crawl',
        'overview',
        'rooms',
        'monsters',
        'npcs',
        'encounters',
        'notes',
      ]),
      dungeonPreview: z.boolean(),
      sessionId: identifier,
      chronicleId: identifier,
      selected: z.object({
        characters: identifier,
        monsters: identifier,
        npcs: identifier,
        encounters: identifier,
      }),
    })
    .nullable(),
});
export type AppLocation = z.infer<typeof locationSchema>;
export type PageState = Pick<
  AppLocation,
  'oracleOpen' | 'deskPage' | 'cityOpen' | 'legacyOracleOpen' | 'pendingSection'
>;
export const homePage: PageState = {
  oracleOpen: true,
  deskPage: 'home',
  cityOpen: false,
  legacyOracleOpen: false,
  pendingSection: null,
};
function workspaceLocation(
  w: Workspace,
): NonNullable<AppLocation['workspace']> {
  return {
    section: w.section,
    dungeonId: w.dungeonId,
    roomId: w.roomId,
    dungeonTab: w.dungeonTab,
    dungeonPreview: !!w.dungeonPreview,
    sessionId: w.sessionId ?? null,
    chronicleId: w.chronicleId ?? null,
    selected: { ...w.selected },
  };
}
export function captureAppLocation(
  save: AppSave,
  page: PageState,
): AppLocation {
  const c =
    save.view === 'campaign'
      ? save.campaigns.find((c) => c.id === save.activeCampaignId)
      : undefined;
  return {
    ...page,
    view: save.view,
    campaignId: save.activeCampaignId,
    workspace: !page.oracleOpen && c ? workspaceLocation(c.workspace) : null,
  };
}
function existingSelections(
  c: Campaign,
  w: NonNullable<AppLocation['workspace']>,
) {
  const d = c.dungeons.find((d) => d.id === w.dungeonId);
  w.dungeonId = d?.id ?? null;
  w.roomId = d?.rooms.find((r) => r.id === w.roomId)?.id ?? null;
  w.dungeonPreview = w.dungeonPreview && !!c.dungeonDraft;
  w.sessionId = c.sessions.find((s) => s.id === w.sessionId)?.id ?? null;
  w.chronicleId =
    [...c.threads, ...c.rumors, ...c.relics, ...c.journalNotes].find(
      (r) => r.id === w.chronicleId,
    )?.id ?? null;
  for (const kind of [
    'characters',
    'monsters',
    'npcs',
    'encounters',
  ] as const) {
    const id = w.selected[kind];
    w.selected[kind] =
      c[kind].some((e) => e.id === id) || c.drafts[kind]?.id === id ? id : null;
  }
}
export function normalizeAppLocation(raw: unknown, save: AppSave): AppLocation {
  const parsed = locationSchema.safeParse(raw);
  if (!parsed.success) return captureAppLocation(save, homePage);
  const next = parsed.data;
  const c = save.campaigns.find((c) => c.id === next.campaignId);
  if (!c) {
    next.campaignId = null;
    next.view = 'campaigns';
    next.workspace = null;
  } else if (next.workspace && !next.oracleOpen) {
    existingSelections(c, next.workspace);
  } else next.workspace = null;
  return next;
}
/** Restore selectors only. Current edited values, IDs, placements and timestamps are untouched. */
export function applyAppLocation(save: AppSave, location: AppLocation) {
  const next = normalizeAppLocation(location, save);
  save.view = next.view;
  save.activeCampaignId = next.campaignId;
  const c = save.campaigns.find((c) => c.id === next.campaignId);
  if (c && next.workspace) Object.assign(c.workspace, next.workspace);
  return next;
}
