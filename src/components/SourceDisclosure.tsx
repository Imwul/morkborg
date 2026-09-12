import {
  sourceEvidence,
  SOURCE_STATUS,
  type ReferenceEvidence,
} from '../domain/referenceSources';
import type { ReactNode } from 'react';
import type { SourceReference } from '../domain/types';
import type {
  GeneratedValueProvenance,
  GenerationAuthority,
} from '../domain/generationProvenance';
import {
  generationAuthorities,
  uniqueAuthorities,
} from '../domain/generationAuthority';
import { useReferenceDesk } from './ReferenceContext';
import { SourceText } from './SourceText';
import { Translation } from './Translation';
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
  authorities = [],
  summaryLabel,
}: {
  refs?: SourceReference[];
  evidence?: ReferenceEvidence[];
  source?: string;
  label?: string;
  children?: ReactNode;
  provenance?: GeneratedValueProvenance;
  hideWarning?: boolean;
  authorities?: GenerationAuthority[];
  summaryLabel?: ReactNode;
}) {
  const desk = useReferenceDesk();
  const authorityItems = uniqueAuthorities([
    ...authorities,
    ...generationAuthorities(provenance),
  ]);
  const preparation = authorityItems.some(
    (item) => item.id === 'sd.dungeon-preparation',
  );
  const items = (
    evidence ??
    sourceEvidence(provenance?.sourceRefs.length ? provenance.sourceRefs : refs)
  ).filter(
    ({ source: ref }) =>
      !(
        preparation &&
        ref.bookId === 'sd' &&
        !ref.tableId &&
        [ref.pdfPage].flat().includes(19)
      ),
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
  if (
    !items.length &&
    !source &&
    !children &&
    !provenance &&
    !authorityItems.length
  )
    return null;
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
        <summary aria-label={label === '출처' ? '출처' : `출처 · ${label}`}>
          {summaryLabel ?? (
            <>
              <span aria-hidden="true">ⓘ</span> 출처
            </>
          )}
        </summary>
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
              MANUAL · Edited manually · 수동 수정됨. 아래는 처음 생성했을 때의
              출처입니다.
            </p>
          )}
          {provenance?.origin === 'manual' && (
            <p>MANUAL · USER AUTHORED · 직접 작성</p>
          )}
          {provenance?.procedureId &&
            !authorityItems.some(
              (item) => item.id === provenance.procedureId,
            ) && (
              <p>PROCEDURE AUTHORITY UNAVAILABLE · {provenance.procedureId}</p>
            )}
          {provenance?.transformation && <p>{provenance.transformation}</p>}
          {source && (
            <p>
              <SourceText text={source} />
            </p>
          )}
          {(['SOURCE_PROCEDURE', 'APP_POLICY'] as const).map((kind) => {
            const group = authorityItems.filter((item) => item.kind === kind);
            return (
              group.length > 0 && (
                <section
                  key={kind}
                  className="source-authority-group"
                  aria-label={kind.replace('_', ' ')}
                >
                  <h5>{kind.replace('_', ' ')}</h5>
                  {group.map((item) => (
                    <div key={item.id} className="source-authority-entry">
                      <strong>{item.id}</strong>
                      {item.description && (
                        <p>
                          {item.description}
                          <Translation text={item.description} />
                        </p>
                      )}
                      {item.sourceRefs
                        ?.filter(
                          (ref) =>
                            !items.some(
                              (existing) =>
                                ref.tableId &&
                                existing.source.tableId === ref.tableId &&
                                existing.source.bookId === ref.bookId,
                            ),
                        )
                        .map((ref, index) => (
                          <div key={index} className="source-authority-proof">
                            <span>
                              {ref.bookTitle ??
                                BOOK_ABBREVIATIONS.find(
                                  (book) => book.id === ref.bookId,
                                )?.title ??
                                ref.bookId}
                            </span>
                            {ref.pdfPage != null && (
                              <span>
                                PDF {[ref.pdfPage].flat().join(', ')}쪽
                                {ref.printedPage != null
                                  ? ` / p. ${ref.printedPage} (인쇄)`
                                  : ''}
                              </span>
                            )}
                            {ref.tableId &&
                              !items.some(
                                (item) => item.source.tableId === ref.tableId,
                              ) &&
                              desk?.byId[`oracle:${ref.tableId}`] && (
                                <button
                                  type="button"
                                  className="source-roll-link"
                                  onClick={() => {
                                    const id =
                                      desk.byId[`oracle:${ref.tableId}`].id;
                                    if (desk.openTable) desk.openTable(id);
                                    else desk.activate(id);
                                  }}
                                >
                                  이 표 열기 ↗
                                </button>
                              )}
                          </div>
                        ))}
                    </div>
                  ))}
                </section>
              )
            );
          })}
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
                  <Translation text={note} />
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
                  <Translation text={ref.note} />
                </p>
              )}
              <div className="source-reference-links">
                {ref.tableId && desk?.byId[`oracle:${ref.tableId}`] && (
                  <button
                    type="button"
                    className="source-roll-link"
                    onClick={() => {
                      const id = desk.byId[`oracle:${ref.tableId}`].id;
                      if (desk.openTable) desk.openTable(id);
                      else desk.activate(id);
                    }}
                  >
                    이 표 열기 ↗
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
