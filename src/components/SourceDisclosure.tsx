import type { ReactNode } from 'react';
import type { SourceReference } from '../domain/types';
export function SourceDisclosure({
  refs = [],
  source,
  label = '출처',
  children,
}: {
  refs?: SourceReference[];
  source?: string;
  label?: string;
  children?: ReactNode;
}) {
  if (!refs.length && !source && !children) return null;
  return (
    <details className="sheet-source source-disclosure">
      <summary>{label}</summary>
      <div className="source-disclosure-body">
        {source && <p>{source}</p>}
        {refs.map((ref, i) => (
          <div className="source-reference" key={i}>
            {ref.bookTitle && <strong>{ref.bookTitle}</strong>}
            {ref.tableTitle && <span>{ref.tableTitle}</span>}
            {ref.pdfPage != null && (
              <span>
                PDF {[ref.pdfPage].flat().join(', ')}쪽
                {ref.printedPage != null ? ' / p. ' + ref.printedPage : ''}
              </span>
            )}
            {ref.roll != null && <span>굴림 {ref.roll}</span>}
            {ref.note && <p>{ref.note}</p>}
          </div>
        ))}
        {children}
      </div>
    </details>
  );
}
