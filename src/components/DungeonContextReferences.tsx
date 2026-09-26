import { dungeonRelevantReferences } from '../domain/dungeonContext';
import type { ReferenceReading } from '../domain/referenceReading';
import { useReferenceDesk } from './ReferenceContext';
import { ReferenceTitleTranslation } from './ReferenceTitleTranslation';

export function DungeonContextReferences({
  reading,
  referenceId,
  visibleIds,
}: {
  reading?: ReferenceReading;
  referenceId?: string;
  visibleIds: readonly string[];
}) {
  const desk = useReferenceDesk();
  const links = dungeonRelevantReferences(
    reading,
    desk?.byId ?? {},
    referenceId,
    visibleIds,
  );
  if (!desk || !links.length) return null;
  return (
    <aside className="dungeon-relevant" aria-label="지금 관련된 참조">
      <span>지금 관련된 참조</span>
      <ul>
        {links.map((link) => (
          <li key={link.id}>
            <button
              type="button"
              data-dungeon-context-reference={link.id}
              onClick={() => desk.activate(link.id, false)}
            >
              {desk.byId[link.id].title} ↗
              <ReferenceTitleTranslation entry={desk.byId[link.id]} />
              {link.evidence === 'SOURCE' && <small>생물 원문</small>}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}
