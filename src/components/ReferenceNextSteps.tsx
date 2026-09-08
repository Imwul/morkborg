import { useReferenceDesk } from './ReferenceContext';
import { oracleFollowUpLinks } from '../domain/referenceReading';
import { referenceAction } from '../domain/referenceActions';
/** Only explicit source outcome relations; no narrative inference or keyword routing. */
export function ReferenceNextSteps({
  ids = [],
  metadata,
}: {
  ids?: string[];
  metadata?: Record<string, unknown>;
}) {
  const desk = useReferenceDesk();
  const entries = [
    ...new Set([...ids, ...(oracleFollowUpLinks(metadata).relatedIds ?? [])]),
  ]
    .map((id) => desk?.byId[id])
    .filter(Boolean);
  if (!entries.length) return null;
  return (
    <div className="ref-related reference-next-steps" aria-label="다음 참조">
      {entries.map((e) => (
        <button
          key={e!.id}
          onClick={() => desk?.activate(e!.id, referenceAction(e!).immediate)}
        >
          {e!.title} ›
        </button>
      ))}
    </div>
  );
}
