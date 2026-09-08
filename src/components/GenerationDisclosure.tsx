import type { GeneratedValueProvenance } from '../domain/generationProvenance';
import { SourceDisclosure } from './SourceDisclosure';
import {
  appPolicy,
  generationAuthorities,
  uniqueAuthorities,
} from '../domain/generationAuthority';

/** One result-level disclosure; shared book/table citations appear once, individual traces remain inspectable. */
export function GenerationDisclosure({
  values,
  label = 'SOURCE · HOW GENERATED',
}: {
  values?: Record<string, GeneratedValueProvenance>;
  label?: string;
}) {
  const entries = Object.entries(values ?? {});
  if (!entries.length) return null;
  const warnings = entries.filter(
    ([, value]) => value.origin !== 'manual' && value.status !== 'VERIFIED',
  );
  const refs = [
    ...new Map(
      entries
        .flatMap(([, value]) => value.sourceRefs)
        .map((ref) => [
          JSON.stringify([
            ref.bookId,
            ref.tableId,
            ref.pdfPage,
            ref.printedPage,
            ref.role,
          ]),
          { ...ref, roll: undefined, entryId: undefined },
        ]),
    ).values(),
  ];
  return (
    <div className="generation-disclosure">
      {!!warnings.length && (
        <span className="provenance-warning">
          {warnings.some(([, v]) => v.status === 'UNAVAILABLE')
            ? 'SOURCE UNAVAILABLE'
            : warnings.some(([, v]) => v.status === 'CONFLICT')
              ? 'CONFLICTING SOURCE'
              : 'PARTIALLY VERIFIED'}
        </span>
      )}
      <SourceDisclosure
        refs={refs}
        label={label}
        hideWarning
        authorities={uniqueAuthorities([
          ...entries.flatMap(([, value]) => generationAuthorities(value)),
          appPolicy('app.result-grouping'),
        ])}
      >
        <div className="generation-fields">
          {entries.map(([field, provenance]) => (
            <section key={field}>
              <h4>{field}</h4>
              {provenance.origin !== 'source' && (
                <p className="source-edit-notice">
                  {provenance.origin === 'source-edited'
                    ? provenance.derivedFrom?.length
                      ? 'MANUAL · Composed from edited components · 구성 요소 수정 반영'
                      : 'MANUAL · Originally generated from · Edited manually / 수동 수정됨'
                    : 'MANUAL · USER AUTHORED · 직접 작성'}
                </p>
              )}
              {!!provenance.unresolvedSourceIds?.length && (
                <p>
                  UNRESOLVED LEGACY SOURCE ·{' '}
                  {provenance.unresolvedSourceIds.join(', ')}
                </p>
              )}
              {provenance.procedureId &&
                !generationAuthorities(provenance).some(
                  (item) => item.id === provenance.procedureId,
                ) && (
                  <small>
                    PROCEDURE AUTHORITY UNAVAILABLE · {provenance.procedureId}
                  </small>
                )}
              {provenance.transformation &&
                provenance.transformation !== 'none' && (
                  <p>{provenance.transformation}</p>
                )}
              {provenance.origin === 'source-edited' && (
                <p>{provenance.sourceText?.join(' · ')}</p>
              )}
              {!!provenance.rolls?.length && (
                <ol className="generation-roll-trace">
                  {provenance.rolls.map((roll, index) => (
                    <li key={index}>
                      <span>{roll.tableId}</span>
                      <strong>
                        {roll.dice} → {roll.value}
                      </strong>
                      {roll.diceValues?.length ? (
                        <span>[{roll.diceValues.join(', ')}]</span>
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          ))}
        </div>
      </SourceDisclosure>
    </div>
  );
}
