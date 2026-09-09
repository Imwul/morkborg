import { z } from 'zod';
import type { AppSave, Workspace } from './types';
import type { PageState } from '../navigation/appLocation';

export const playContextSchema = z.object({
  kind: z.enum([
    'campaign',
    'dungeon',
    'room',
    'characters',
    'monsters',
    'npcs',
    'encounters',
    'desk',
  ]),
  campaignId: z.string().max(200).optional(),
  objectId: z.string().max(200).optional(),
  dungeonId: z.string().max(200).optional(),
  dungeonTab: z
    .enum([
      'crawl',
      'overview',
      'rooms',
      'monsters',
      'npcs',
      'encounters',
      'notes',
    ])
    .optional(),
});
export type PlayContext = z.infer<typeof playContextSchema>;
export const contextKey = (c: PlayContext) =>
  [c.kind, c.campaignId, c.dungeonId, c.objectId].join(':');

/** Only application objects are remembered. Reference excursions never enter this function. */
export function currentPlayContext(
  save: AppSave,
  page: PageState,
): PlayContext | null {
  if (page.oracleOpen)
    return page.deskPage === 'home' || page.deskPage === 'desk'
      ? { kind: 'desk' }
      : null;
  if (page.cityOpen) return null;
  const c =
    save.view === 'campaign' &&
    save.campaigns.find((c) => c.id === save.activeCampaignId);
  if (!c) return null;
  const w = c.workspace;
  if (w.section === 'dungeons' && !w.dungeonPreview && w.dungeonId) {
    const dungeon = c.dungeons.find((d) => d.id === w.dungeonId);
    const roomId =
      w.dungeonTab === 'crawl'
        ? (dungeon?.crawl?.currentRoomId ?? null)
        : w.roomId;
    return validContext(
      {
        kind: roomId ? 'room' : 'dungeon',
        campaignId: c.id,
        dungeonId: w.dungeonId,
        objectId: roomId ?? w.dungeonId,
        dungeonTab: w.dungeonTab,
      },
      save,
    );
  }
  if (['characters', 'monsters', 'npcs', 'encounters'].includes(w.section)) {
    const kind = w.section as 'characters' | 'monsters' | 'npcs' | 'encounters';
    return w.selected[kind]
      ? validContext(
          { kind, campaignId: c.id, objectId: w.selected[kind]! },
          save,
        )
      : null;
  }
  return w.section === 'overview'
    ? { kind: 'campaign', campaignId: c.id }
    : null;
}
export function validContext(
  context: PlayContext,
  save: AppSave,
): PlayContext | null {
  if (context.kind === 'desk') return context;
  const c = save.campaigns.find((c) => c.id === context.campaignId);
  if (!c) return null;
  if (context.kind === 'campaign') return context;
  if (context.kind === 'room' || context.kind === 'dungeon') {
    const d = c.dungeons.find((d) => d.id === context.dungeonId);
    if (
      !d ||
      (context.kind === 'room' &&
        !d.rooms.some((r) => r.id === context.objectId))
    )
      return null;
    return context;
  }
  return c[context.kind].some((e) => e.id === context.objectId)
    ? context
    : null;
}
export function contextLabel(context: PlayContext, save: AppSave) {
  if (context.kind === 'desk') return 'Reference Desk';
  const c = save.campaigns.find((c) => c.id === context.campaignId);
  if (!c) return '';
  if (context.kind === 'campaign') return c.title;
  if (context.kind === 'dungeon')
    return c.dungeons.find((d) => d.id === context.dungeonId)?.title ?? '';
  if (context.kind === 'room') {
    const d = c.dungeons.find((d) => d.id === context.dungeonId);
    const n = d?.rooms.findIndex((r) => r.id === context.objectId) ?? -1;
    return n >= 0 ? `ROOM ${String(n + 1).padStart(2, '0')}` : '';
  }
  return c[context.kind].find((e) => e.id === context.objectId)?.name ?? '';
}
export function pushContext(stack: PlayContext[], next: PlayContext) {
  if (stack[0] && contextKey(stack[0]) === contextKey(next))
    return [{ ...next }, ...stack.slice(1)];
  return [next, ...stack].slice(0, 5);
}
/** Explicit navigation selectors only; no content, timestamps or records are restored. */
export function contextWorkspace(
  context: PlayContext,
  current: Workspace,
): Partial<Workspace> {
  if (context.kind === 'campaign') return { section: 'overview' };
  if (context.kind === 'room' || context.kind === 'dungeon')
    return {
      section: 'dungeons',
      dungeonId: context.dungeonId!,
      roomId: context.kind === 'room' ? context.objectId! : null,
      dungeonTab: context.dungeonTab ?? 'overview',
      dungeonPreview: false,
    };
  if (context.kind === 'desk') return {};
  return {
    section: context.kind,
    selected: { ...current.selected, [context.kind]: context.objectId },
  };
}
