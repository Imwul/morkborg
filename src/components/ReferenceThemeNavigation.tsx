import { useState } from 'react';
import type { ReferenceRegistry } from '../domain/references';
import type { RelatedReferenceRelationship } from '../domain/referenceRelationships';
import { referenceThemeGroups } from '../domain/referenceThemeGroups';
import { referenceShortName } from '../domain/referenceActions';
import { useReferenceDesk } from './ReferenceContext';

export function ReferenceThemeNavigation({
  registry,
  companions,
}: {
  registry: ReferenceRegistry;
  companions: readonly RelatedReferenceRelationship[];
}) {
  const desk = useReferenceDesk();
  const [limits, setLimits] = useState<Record<string, number>>({});
  const groups = referenceThemeGroups(
    registry,
    desk?.selectedId ?? undefined,
    companions,
  );
  return (
    <nav className="desk-theme-navigation" aria-label="테마별 참조">
      {groups.map((group) => {
        const limit = limits[group.id] ?? 4;
        return (
          <section key={group.id}>
            <h2>{group.title}</h2>
            <ul>
              {group.entries.slice(0, limit).map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    aria-current={
                      entry.id === desk?.selectedId ? 'page' : undefined
                    }
                    onClick={() => desk?.activate(entry.id, false)}
                  >
                    {referenceShortName(entry)}
                  </button>
                </li>
              ))}
            </ul>
            {group.entries.length > limit && (
              <button
                type="button"
                className="desk-theme-more"
                onClick={() =>
                  setLimits((old) => ({ ...old, [group.id]: limit + 6 }))
                }
              >
                더 보기{' '}
                <span>+{Math.min(6, group.entries.length - limit)}</span>
              </button>
            )}
            {limit > 4 && (
              <button
                type="button"
                className="desk-theme-more"
                onClick={() => setLimits((old) => ({ ...old, [group.id]: 4 }))}
              >
                접기
              </button>
            )}
          </section>
        );
      })}
    </nav>
  );
}
