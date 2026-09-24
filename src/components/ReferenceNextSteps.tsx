import { useReferenceDesk } from './ReferenceContext';
import { resolveRowRelationships } from '../domain/rowRelationships';
import { useOracleRegistry } from '../storage/oracleStore';
import {
  rowResultRelationships,
  type ResultRelationship,
} from '../domain/resultRelationships';
import { renderResultReferenceLinks } from './ResultReferenceLinks';
/** Only explicit source outcome relations; no narrative inference or keyword routing. */
export function ReferenceNextSteps({
  ids = [],
  metadata,
  tableId,
  lookups,
  contextLabel,
  entryId,
}: {
  ids?: string[];
  metadata?: Record<string, unknown>;
  tableId?: string;
  lookups?: { oracleId: string; roll: number }[];
  contextLabel?: string;
  entryId?: string | null;
}) {
  const desk = useReferenceDesk();
  const { registry } = useOracleRegistry();
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
  const presented: ResultRelationship[] =
    tableId && entryId
      ? rowResultRelationships(desk?.byId ?? {}, registry, {
          oracleId: tableId,
          entryId,
          metadata,
        })
      : links.map((edge) => ({
          ...edge,
          purpose:
            edge.lookupRoll != null ||
            edge.entry.kind === 'rule' ||
            edge.entry.kind === 'book'
              ? 'CONTEXT'
              : 'AVAILABLE',
        }));
  return renderResultReferenceLinks(presented, desk, contextLabel);
}
