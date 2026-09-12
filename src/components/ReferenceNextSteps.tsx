import { useReferenceDesk } from './ReferenceContext';
import { oracleFollowUpLinks } from '../domain/referenceReading';
import { Translation } from './Translation';
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
    <div className="ref-related reference-next-steps" aria-label="연결된 참조">
      {entries.map((e) => (
        <button key={e!.id} onClick={() => desk?.activate(e!.id)}>
          {e!.title} ›
          <Translation text={e!.title} />
        </button>
      ))}
    </div>
  );
}
