import type { ReferenceEntry } from './references';

/** Inspection never changes dice. The adjacent primary action runs only confirmed defaults. */
export function referenceAction(entry: ReferenceEntry) {
  const action = entry.action;
  if (!entry.available || !action)
    return { label: 'OPEN', immediate: false } as const;
  if (action.kind === 'regional-monster')
    return { label: 'GENERATE', immediate: true } as const;
  if (action.kind === 'oracle')
    return { label: 'ROLL', immediate: true } as const;
  if (action.kind === 'procedure') {
    return {
      label: ['workbench.npc', 'workbench.epk'].includes(action.procedureId)
        ? 'GENERATE'
        : 'RUN',
      immediate: !['workbench.city', 'workbench.stock-room'].includes(
        action.procedureId,
      ),
    } as const;
  }
  return { label: 'OPEN', immediate: false } as const;
}
const SHORT_NAMES: Record<string, string> = {
  'oracle:core.reaction': 'Reaction',
  'procedure:reclvse.action-theme': 'Action + Theme',
  'procedure:workbench.stock-room': 'Stock Room',
  'procedure:workbench.npc': 'NPC',
  'procedure:workbench.city': 'City',
  'rule:core.reaction-morale': 'Morale',
  'oracle:sd.usefulItems': 'Useful Item',
  'oracle:core.corpsePlundering': 'Corpse',
};
export const referenceShortName = (entry: ReferenceEntry) =>
  SHORT_NAMES[entry.id] ?? entry.title;

export function referenceRegion(
  entry: ReferenceEntry | undefined,
  fallback: import('./types').RegionId,
) {
  const action = entry?.action;
  return action?.kind === 'region' || action?.kind === 'regional-monster'
    ? action.region
    : fallback;
}
