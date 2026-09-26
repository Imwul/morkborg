import type { ReferenceReading } from './referenceReading';
import type { ReferenceEntry } from './references';

export interface DungeonContextReference {
  id: string;
  sourceId: string;
  evidence: 'SOURCE' | 'RELATED';
}

/** Calibration only: preserve resolved identity and expose its existing, useful edges.
 * Row follow-ups already have their own surface. No reading text is inspected here.
 */
export function dungeonRelevantReferences(
  reading: ReferenceReading | undefined,
  byId: Record<string, ReferenceEntry>,
  currentId?: string,
  alreadyVisible: readonly string[] = [],
): DungeonContextReference[] {
  const source = byId[reading?.creatureReferenceId ?? ''];
  if (!source?.available || source.kind !== 'creature') return [];
  const candidates: DungeonContextReference[] = [
    { id: source.id, sourceId: source.id, evidence: 'SOURCE' },
    ...['oracle:core.reaction', 'rule:core.reaction-morale']
      .filter((id) => source.relatedIds.includes(id))
      .map((id) => ({ id, sourceId: source.id, evidence: 'RELATED' as const })),
  ];
  const seen = new Set(
    [currentId, ...alreadyVisible].map((id) => byId[id ?? '']?.id ?? id),
  );
  return candidates
    .filter((item) => {
      if (!byId[item.id]?.available || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    })
    .slice(0, 3);
}
