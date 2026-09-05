import {
  sourceEvidence,
  SOURCE_STATUS,
  type ReferenceEvidence,
} from '../domain/referenceSources';
import type { ReactNode } from 'react';
import type { SourceReference } from '../domain/types';
import { useReferenceDesk } from './ReferenceContext';
export function SourceDisclosure({
  refs = [],
  source,
  label = '출처',
  children,
  evidence,
}: {
  refs?: SourceReference[];
  evidence?: ReferenceEvidence[];
  source?: string;
  label?: string;
  children?: ReactNode;
}) {
  const desk = useReferenceDesk();
  const items = evidence ?? sourceEvidence(refs);
  if (!items.length && !source && !children) return null;
  return (
    <details className="sheet-source source-disclosure">
      <summary>{label}</summary>
      <div className="source-disclosure-body">
        {source && <p>{source}</p>}
        {items.map(({ source: ref, role, confidence, note }, i) => (
          <div
            className="source-reference"
            key={i}
            data-confidence={confidence}
          >
            <small className="source-role">
              {role === 'routing' ? 'ROUTED BY' : 'PRIMARY'} ·{' '}
              {SOURCE_STATUS[confidence]}
            </small>
            {note && <p>{note}</p>}
            {ref.bookTitle && <strong>{ref.bookTitle}</strong>}
            {ref.tableTitle && <span>{ref.tableTitle}</span>}
            {ref.pdfPage != null && (
              <span>
                PDF {[ref.pdfPage].flat().join(', ')}쪽
                {ref.printedPage != null
                  ? ' / p. ' + ref.printedPage + ' (인쇄)'
                  : ''}
              </span>
            )}
            {ref.pdfPage == null && ref.printedPage != null && (
              <span>인쇄 p. {ref.printedPage}</span>
            )}
            {ref.roll != null && <span>굴림 {ref.roll}</span>}
            {ref.note && <p>{ref.note}</p>}
            {ref.tableId && desk?.byId[`oracle:${ref.tableId}`] && (
              <button
                type="button"
                className="source-roll-link"
                onClick={() =>
                  desk.activate(
                    `oracle:${ref.tableId}`,
                    desk.byId[`oracle:${ref.tableId}`].available &&
                      desk.byId[`oracle:${ref.tableId}`].action?.kind ===
                        'oracle',
                  )
                }
              >
                {desk.byId[`oracle:${ref.tableId}`].available &&
                desk.byId[`oracle:${ref.tableId}`].action?.kind === 'oracle'
                  ? '이 표 열기 / ROLL ↗'
                  : '이 표 열기 ↗'}
              </button>
            )}
            {ref.bookId && desk?.byId[`book:${ref.bookId}`] && (
              <button
                type="button"
                className="source-roll-link"
                onClick={() => desk.activate(`book:${ref.bookId}`)}
              >
                이 책의 참조 ›
              </button>
            )}
          </div>
        ))}
        {children}
      </div>
    </details>
  );
}
