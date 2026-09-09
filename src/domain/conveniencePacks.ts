import { contextReferences, type ReferenceRegistry } from './references';
import type { ReferencePack } from '../storage/conveniencePreferences';
/** APP_POLICY projections of existing context/source identities; no content or search restrictions. */
export function builtInReferencePacks(
  index: ReferenceRegistry,
): ReferencePack[] {
  const entries = index.entries.filter(
    (e) => e.available && !['book', 'region'].includes(e.kind),
  );
  const make = (
    id: string,
    name: string,
    match: (entry: (typeof entries)[number]) => boolean,
    preferred: string[] = [],
  ): ReferencePack => ({
    id,
    name,
    userCreated: false,
    referenceIds: [
      ...new Set([
        ...preferred.filter((id) => index.byId[id] && match(index.byId[id])),
        ...entries
          .filter(match)
          .sort(
            (a, b) =>
              Number(!!a.parentId) - Number(!!b.parentId) ||
              Number(!!b.referenceGroupIds) - Number(!!a.referenceGroupIds),
          )
          .map((e) => e.id),
      ]),
    ],
  });
  return [
    make(
      'pack:core',
      'Core Play · 기본 규칙',
      (e) => e.kind === 'rule' && e.sourceRefs.some((s) => s.bookId === 'core'),
    ),
    make(
      'pack:dungeon',
      'Dungeon · 던전',
      (e) => e.contexts.some((c) => c === 'dungeon' || c === 'room'),
      contextReferences(index, 'dungeon').map((e) => e.id),
    ),
    make(
      'pack:travel',
      'Travel · 여행',
      (e) => e.contexts.includes('travel'),
      contextReferences(index, 'travel').map((e) => e.id),
    ),
    make('pack:city', 'City · 도시', (e) => e.contexts.includes('city'), [
      ...entries
        .filter((e) => e.action?.kind === 'city' && e.action.move)
        .map((e) => e.id),
      ...contextReferences(index, 'city').map((e) => e.id),
    ]),
    make(
      'pack:reclvse',
      'RECLVSE',
      (e) =>
        e.canonicalIds.some((id) => id.startsWith('reclvse.')) ||
        e.id.startsWith('rule:reclvse.') ||
        e.id.startsWith('procedure:reclvse.'),
    ),
  ].filter((pack) => pack.referenceIds.length > 0);
}
export function focusedReferences(
  index: ReferenceRegistry,
  pack?: ReferencePack,
) {
  return (pack?.referenceIds ?? [])
    .map((id) => index.byId[id])
    .filter(Boolean)
    .filter((e) => e.available);
}
