import { useState } from 'react';
import type {
  OracleDefinition,
  OracleEntry,
  OracleRoll,
} from '../domain/oracle';
import { inlineSourceSubtable } from '../domain/inlineSourceSubtable';
import { physicalOracleRoll } from '../domain/manualReferenceRoll';
import { rollOracle } from '../generators/oracleRoller';
import { useOracleRegistry } from '../storage/oracleStore';
import { ReferenceReadingText } from './ReferenceReadingText';
import { ReferenceNextSteps } from './ReferenceNextSteps';
import { SourceDisclosure } from './SourceDisclosure';
import { tableSelector } from '../domain/referenceTable';
import { useReferenceDesk } from './ReferenceContext';

/** Optional printed detail, opened/read independently from the parent result. */
export function InlineSourceSubtable({
  table,
  entry,
  parentContext,
  parentRoll,
}: {
  table: OracleDefinition;
  entry: OracleEntry;
  /** A new parent result invalidates only its temporary child reading. */
  parentContext?: object;
  /** Only a currently selected source row can own a retained inline result. */
  parentRoll?: OracleRoll;
}) {
  const [context, setContext] = useState({ parentContext, revision: 0 });
  if (context.parentContext !== parentContext)
    setContext({ parentContext, revision: context.revision + 1 });
  return (
    <InlineSourceSubtableBody
      key={`${entry.id}:${context.revision}`}
      table={table}
      entry={entry}
      parentRoll={parentRoll}
    />
  );
}

function InlineSourceSubtableBody({
  table,
  entry,
  parentRoll,
}: {
  table: OracleDefinition;
  entry: OracleEntry;
  parentRoll?: OracleRoll;
}) {
  const { registry } = useOracleRegistry();
  const desk = useReferenceDesk();
  const bound = !!parentRoll && !!desk?.inlineChildren && !!desk.onInlineChild;
  const retained = bound ? desk.inlineChildren!.get(parentRoll!) : undefined;
  const [input, setInput] = useState(() =>
    retained ? String(retained.roll) : '',
  );
  const [localResult, setLocalResult] = useState<OracleRoll>();
  const result = bound ? retained : localResult;
  // An obtained result is visible again on return; merely opening a table is not retained.
  const [open, setOpen] = useState(!!retained);
  const [error, setError] = useState('');
  const subtable = inlineSourceSubtable(table, entry);
  if (!subtable) return null;
  function lookup(physical: boolean) {
    try {
      const next = physical
        ? physicalOracleRoll(subtable!, input, registry)
        : rollOracle(subtable!, registry);
      if (bound) desk.onInlineChild!(parentRoll!, next);
      else setLocalResult(next);
      setOpen(true);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '입력을 확인하세요.');
    }
  }
  return (
    <details
      className="table-followup"
      data-parent-entry-id={entry.id}
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>조건부 추가 표 · {subtable.dice}</summary>
      <div className="physical-roll-input">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            lookup(true);
          }}
        >
          <label>
            실물 주사위 · {subtable.dice}
            <input
              aria-label={`${entry.text} 추가 표 실물 굴림`}
              inputMode="numeric"
              value={input}
              placeholder="굴린 값"
              onChange={(event) => setInput(event.target.value)}
            />
          </label>
          <button type="submit">결과 확인</button>
          <button type="button" onClick={() => lookup(false)}>
            ROLL {subtable.dice}
          </button>
        </form>
      </div>
      {error && <p role="alert">{error}</p>}
      {result && (
        <output aria-live="polite">
          {result.dice} → {result.roll} · {result.text}
        </output>
      )}
      <table>
        <caption className="sr-only">
          {subtable.title} · {subtable.dice}
        </caption>
        <tbody>
          {subtable.entries.map((row) => (
            <tr
              key={row.id}
              className={
                result?.entryId === row.id ? 'current-table-result' : undefined
              }
            >
              <th scope="row">
                <span className="table-dice-number">{tableSelector(row)}</span>
              </th>
              <td>
                <ReferenceReadingText text={row.text} source={row} />
                <ReferenceNextSteps
                  metadata={row.metadata}
                  tableId={table.id}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <SourceDisclosure
        refs={[
          {
            bookId: table.sourceBookId,
            tableId: table.id,
            tableTitle: subtable.title,
            entryId: entry.id,
            pdfPage: subtable.sourcePage,
            printedPage: subtable.printedPage,
            status: table.sourceStatus,
          },
        ]}
      />
    </details>
  );
}
