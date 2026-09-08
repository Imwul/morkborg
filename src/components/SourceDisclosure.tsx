import {
  sourceEvidence,
  SOURCE_STATUS,
  type ReferenceEvidence,
} from '../domain/referenceSources';
import type { ReactNode } from 'react';
import type { SourceReference } from '../domain/types';
import type { GeneratedValueProvenance } from '../domain/generationProvenance';
import { useReferenceDesk } from './ReferenceContext';
import { SourceText } from './SourceText';
import {
  BOOK_ABBREVIATIONS,
  compactSourceText,
  shortBookTitle,
} from '../domain/sourceDisplay';
export function SourceDisclosure({
  refs = [],
  source,
  label = '출처',
  children,
  evidence,
  provenance,
  hideWarning = false,
}: {
  refs?: SourceReference[];
  evidence?: ReferenceEvidence[];
  source?: string;
  label?: string;
  children?: ReactNode;
  provenance?: GeneratedValueProvenance;
  hideWarning?: boolean;
}) {
  const desk = useReferenceDesk();
  const items =
    evidence ??
    sourceEvidence(
      provenance?.sourceRefs.length ? provenance.sourceRefs : refs,
    );
  const fullTitles = [
    ...new Map(
      items.flatMap(({ source: ref }) => {
        const short = shortBookTitle(ref.bookId, ref.bookTitle);
        return ref.bookTitle && short !== ref.bookTitle
          ? [[ref.bookTitle, short] as const]
          : [];
      }),
    ),
  ];
  const fullSource =
    source && compactSourceText(source) !== source ? source : undefined;
  if (!items.length && !source && !children && !provenance) return null;
  return (
    <>
      {!hideWarning &&
        ((provenance &&
          provenance.origin !== 'manual' &&
          provenance.status !== 'VERIFIED') ||
          items.some((item) => item.confidence !== 'verified')) && (
          <span className="provenance-warning">
            {provenance?.status === 'CONFLICT' ||
            items.some((item) => item.confidence === 'conflicting-citation')
              ? 'CONFLICTING SOURCE'
              : provenance?.status === 'UNAVAILABLE' ||
                  items.some((item) => item.confidence === 'unavailable-source')
                ? 'SOURCE UNAVAILABLE'
                : 'PARTIALLY VERIFIED'}
          </span>
        )}
      <details className="sheet-source source-disclosure">
        <summary>{label}</summary>
        <div className="source-disclosure-body">
          {!!provenance?.unresolvedSourceIds?.length && (
            <p className="source-edit-notice">
              UNRESOLVED LEGACY SOURCE ·{' '}
              {provenance.unresolvedSourceIds.join(', ')}. 저장된 문구는 그대로
              보존했습니다.
            </p>
          )}
          {provenance?.origin === 'source-edited' && (
            <p className="source-edit-notice">
              Edited manually · 수동 수정됨. 아래는 처음 생성했을 때의
              출처입니다.
            </p>
          )}
          {provenance?.origin === 'manual' && <p>USER AUTHORED · 직접 작성</p>}
          {provenance?.procedureId && (
            <p>PROCEDURE · {provenance.procedureId}</p>
          )}
          {provenance?.transformation && <p>{provenance.transformation}</p>}
          {provenance?.regionWeighting && (
            <p>Region weighting applied: {provenance.regionWeighting}</p>
          )}
          {source && (
            <p>
              <SourceText text={source} />
            </p>
          )}
          {items.map(({ source: ref, role, confidence, note }, i) => (
            <div
              className="source-reference"
              key={i}
              data-confidence={confidence}
            >
              <small className="source-role">
                {(ref.role ?? role) === 'routing'
                  ? 'ROUTING SOURCE'
                  : 'PRIMARY SOURCE'}{' '}
                · {SOURCE_STATUS[confidence]}
              </small>
              {note && (
                <p>
                  <SourceText text={note} />
                </p>
              )}
              {(ref.bookTitle || ref.bookId) && (
                <strong>
                  {ref.bookTitle ??
                    BOOK_ABBREVIATIONS.find((book) => book.id === ref.bookId)
                      ?.title ??
                    ref.bookId}
                </strong>
              )}
              {ref.tableTitle && <SourceText text={ref.tableTitle} />}
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
              {ref.note && (
                <p>
                  <SourceText text={ref.note} />
                </p>
              )}
              {ref.tableId && desk?.byId[`oracle:${ref.tableId}`] && (
                <button
                  type="button"
                  className="source-roll-link"
                  onClick={() => desk.activate(`oracle:${ref.tableId}`)}
                >
                  {desk.byId[`oracle:${ref.tableId}`].available &&
                  desk.byId[`oracle:${ref.tableId}`].action?.kind === 'oracle'
                    ? '이 표 열기 ↗'
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
          {!!provenance?.rolls?.length && (
            <ol className="generation-roll-trace">
              {provenance.rolls.map((roll, index) => (
                <li key={index}>
                  <span>{roll.tableId}</span>
                  <strong>
                    {roll.dice} → {roll.value}
                  </strong>
                  {roll.diceValues && (
                    <span>[{roll.diceValues.join(', ')}]</span>
                  )}
                </li>
              ))}
            </ol>
          )}
          {(fullSource || fullTitles.length > 0) && (
            <details className="source-full-titles">
              <summary>원제·전체 출처 표기</summary>
              {fullSource && <p>{fullSource}</p>}
              {fullTitles.map(([title, short]) => (
                <p key={title}>
                  {short} · {title}
                </p>
              ))}
            </details>
          )}
        </div>
      </details>
    </>
  );
}
