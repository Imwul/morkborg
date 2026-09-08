import type { ReferenceEntry } from './references';
import { compactSourceText, shortBookTitle } from './sourceDisplay';

/** The primary action runs only confirmed defaults; reference inspection never changes dice. */
export function referenceAction(entry: ReferenceEntry) {
  const action = entry.action;
  if (!entry.available || !action)
    return { label: 'OPEN', immediate: false } as const;
  if (action.kind === 'regional-monster')
    return { label: 'GENERATE', immediate: true } as const;
  if (action.kind === 'oracle')
    return { label: 'ROLL', immediate: true } as const;
  if (action.kind === 'creature')
    return { label: 'OPEN', immediate: true } as const;
  if (action.kind === 'procedure') {
    if (['workbench.city', 'workbench.stock-room'].includes(action.procedureId))
      return { label: 'OPEN', immediate: false } as const;
    return {
      label: ['workbench.npc', 'workbench.epk'].includes(action.procedureId)
        ? 'GENERATE'
        : 'RUN',
      immediate: true,
    } as const;
  }
  return { label: 'OPEN', immediate: false } as const;
}
const SHORT_NAMES: Record<string, string> = {
  'oracle:core.reaction': 'Reaction',
  'procedure:reclvse.action-theme': 'Action + Theme',
  'procedure:workbench.stock-room': 'Encounter Prep',
  'procedure:workbench.npc': 'NPC',
  'procedure:workbench.city': 'City',
  'rule:core.reaction-morale': 'Morale',
  'oracle:sd.usefulItems': 'Useful Item',
  'oracle:core.corpsePlundering': 'Corpse',
};
export const referenceShortName = (entry: ReferenceEntry) =>
  SHORT_NAMES[entry.id] ??
  (entry.kind === 'book'
    ? shortBookTitle(entry.id.slice(5), entry.title)
    : compactSourceText(entry.title));

export function referenceRegion(
  entry: ReferenceEntry | undefined,
  fallback: import('./types').RegionId,
) {
  const action = entry?.action;
  return action?.kind === 'region' || action?.kind === 'regional-monster'
    ? action.region
    : fallback;
}
