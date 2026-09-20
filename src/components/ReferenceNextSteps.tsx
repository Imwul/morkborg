import { useReferenceDesk } from './ReferenceContext';
import { resolveRowRelationships } from '../domain/rowRelationships';
import { ReferenceTitleTranslation } from './ReferenceTitleTranslation';
import { RelationshipLabel } from './RelationshipLabel';
/** Only explicit source outcome relations; no narrative inference or keyword routing. */
export function ReferenceNextSteps({
  ids = [],
  metadata,
  tableId,
  lookups,
  contextLabel,
}: {
  ids?: string[];
  metadata?: Record<string, unknown>;
  tableId?: string;
  lookups?: { oracleId: string; roll: number }[];
  contextLabel?: string;
}) {
  const desk = useReferenceDesk();
  const links = resolveRowRelationships(
    desk?.byId ?? {},
    {
      ...metadata,
      ...(ids.length
        ? {
            followUpReferenceIds: [
              ...(Array.isArray(metadata?.followUpReferenceIds)
                ? metadata.followUpReferenceIds
                : []),
              ...ids,
            ],
          }
        : {}),
      ...(lookups ? { fixedLookups: lookups } : {}),
    },
    tableId,
    tableId ? undefined : (desk?.selectedId ?? undefined),
  );
  if (!links.length) return null;
  return (
    <div className="ref-related reference-next-steps" aria-label="연결된 참조">
      {contextLabel && <small>{contextLabel}</small>}
      {links.map(({ entry, targetId, kind, lookupRoll }) => (
        <button
          key={`${lookupRoll == null ? entry.id : targetId}:${lookupRoll ?? 'open'}`}
          data-relationship-target={entry.id}
          data-relationship-kind={kind}
          onClick={() =>
            lookupRoll == null
              ? desk?.activate(entry.id)
              : desk?.openLookup?.({
                  oracleId: targetId.replace(/^oracle:/, ''),
                  roll: lookupRoll,
                })
          }
        >
          <RelationshipLabel kind={kind} />
          <span>
            {entry.title}
            {lookupRoll == null ? '' : ` #${lookupRoll}`} ›
            <ReferenceTitleTranslation entry={entry} />
          </span>
        </button>
      ))}
    </div>
  );
}
