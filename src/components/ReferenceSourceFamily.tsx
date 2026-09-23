import type { SourceSubtableFamily } from '../domain/sourceSubtableFamilies';
import type { ReferenceRegistry } from '../domain/references';

/** A source-backed route between a selector and the subtables named by its rows. */
export function ReferenceSourceFamily({
  family,
  references,
  selectedId,
  onOpen,
}: {
  family: SourceSubtableFamily;
  references: ReferenceRegistry;
  selectedId: string;
  onOpen: (referenceId: string) => void;
}) {
  return (
    <nav className="reference-source-family" aria-label="원문 연결 표">
      <p className="reference-source-family-heading">
        <span>원문 연결</span>
        <small>결과 행이 지정하는 하위 표</small>
      </p>
      <div className="reference-source-family-links">
        <span className="reference-source-family-kind">선택 표</span>
        {family.parentIds.map((id) => {
          const entry = references.byId[id];
          return (
            <button
              type="button"
              key={id}
              aria-current={selectedId === id ? 'page' : undefined}
              onClick={() => onOpen(id)}
            >
              {entry.title}
            </button>
          );
        })}
      </div>
      <div className="reference-source-family-links">
        <span className="reference-source-family-kind">하위 표</span>
        {family.childIds.map((id) => {
          const entry = references.byId[id];
          return (
            <button
              type="button"
              key={id}
              aria-current={selectedId === id ? 'page' : undefined}
              onClick={() => onOpen(id)}
            >
              {entry.title}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
