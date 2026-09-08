import type { GeneratedValueProvenance } from '../domain/generationProvenance';
import { useReferenceDesk } from './ReferenceContext';
export function CreatureParticipants({
  provenance,
}: {
  provenance?: GeneratedValueProvenance;
}) {
  const desk = useReferenceDesk();
  const parent = desk?.entries.find(
    (e) =>
      e.childReferenceIds?.length &&
      e.sourceRefs.some((ref) =>
        provenance?.sourceRefs.some(
          (s) => s.bookId === ref.bookId && s.entryId === ref.entryId,
        ),
      ),
  );
  if (!parent) return null;
  return (
    <details className="reading-participants">
      <summary>VARIANTS / PARTICIPANTS ›</summary>
      <div className="reference-rule-group">
        {parent
          .childReferenceIds!.map((id) => desk!.byId[id])
          .filter(Boolean)
          .map((e) => (
            <button key={e.id} onClick={() => desk!.activate(e.id, true)}>
              {e.title} ›
            </button>
          ))}
      </div>
    </details>
  );
}
