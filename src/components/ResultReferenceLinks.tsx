import type { DeskContext } from './ReferenceContext';
import { useReferenceDesk } from './ReferenceContext';
import { ReferenceTitleTranslation } from './ReferenceTitleTranslation';
import { DungeonContextReferences } from './DungeonContextReferences';
import { useOracleRegistry } from '../storage/oracleStore';
import type { ReferenceReading } from '../domain/referenceReading';
import {
  readingResultRelationships,
  resultRelationshipKey,
  type ResultRelationship,
  type ResultPurpose,
} from '../domain/resultRelationships';

const LABELS: Record<ResultPurpose, string> = {
  REQUIRED: '필수 처리',
  AVAILABLE: '선택 사항',
  CONTEXT: '내용 참조',
};
/** Open-only controls. The relation kind remains available to audits, not a command. */
export function renderResultReferenceLinks(
  links: ResultRelationship[],
  desk: DeskContext | null,
  contextLabel?: string,
) {
  if (!links.length || !desk) return null;
  return (
    <div
      className="result-references reference-next-steps"
      aria-label="결과의 연결된 참조"
    >
      {contextLabel && (
        <small className="result-reference-origin">{contextLabel}</small>
      )}
      {(['REQUIRED', 'AVAILABLE', 'CONTEXT'] as const).map((purpose) => {
        const group = links.filter((link) => link.purpose === purpose);
        return group.length ? (
          <section
            className="result-reference-group"
            data-purpose={purpose}
            key={purpose}
            aria-label={LABELS[purpose]}
          >
            <span className="result-reference-label">
              <b>{purpose}</b> {LABELS[purpose]}
            </span>
            <ul>
              {group.map((link) => (
                <li key={resultRelationshipKey(link)}>
                  <button
                    type="button"
                    data-relationship-target={link.entry.id}
                    data-relationship-kind={link.kind}
                    data-result-purpose={purpose}
                    onClick={() =>
                      link.lookupRoll == null
                        ? desk.activate(link.entry.id)
                        : desk.openLookup?.({
                            oracleId: link.targetId.replace(/^oracle:/, ''),
                            roll: link.lookupRoll,
                          })
                    }
                  >
                    <span>
                      {link.entry.title}
                      {link.lookupRoll == null
                        ? ''
                        : ` #${link.lookupRoll}`} ›
                      <ReferenceTitleTranslation entry={link.entry} />
                    </span>
                    {link.note && <small>{link.note}</small>}
                    {link.rowLabel && (
                      <small className="result-reference-origin">
                        {link.rowLabel}
                      </small>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null;
      })}
    </div>
  );
}
export function ResultReferenceLinks({
  links,
}: {
  links: ResultRelationship[];
}) {
  return renderResultReferenceLinks(links, useReferenceDesk());
}
export function ReadingResultReferences({
  reading,
  referenceId,
}: {
  reading: ReferenceReading;
  referenceId?: string;
}) {
  const desk = useReferenceDesk();
  const { registry } = useOracleRegistry();
  const links = readingResultRelationships(
    desk?.byId ?? {},
    registry,
    reading,
    referenceId,
  );
  return (
    <>
      <DungeonContextReferences
        reading={reading}
        referenceId={referenceId}
        visibleIds={links.map((link) => link.entry.id)}
      />
      {renderResultReferenceLinks(links, desk)}
    </>
  );
}
