import type { OracleDefinition, OracleEntry } from '../domain/oracle';
import type { RuleEntry } from '../storage/rulesStore';
import {
  canSelectTableEntry,
  followUpSelector,
  tableEntryNotes,
  tableSelector,
} from '../domain/referenceTable';
import { ReferenceLinkedText } from './ReferenceLinkedText';

export function ReferenceTable({
  table,
  currentEntryIds,
  onChoose,
}: {
  table: OracleDefinition;
  currentEntryIds: (string | null)[];
  onChoose: (table: OracleDefinition, entry: OracleEntry) => void;
}) {
  const exits = table.id === 'sd.room.exits';
  return (
    <section className="reference-table-section">
      {table.description && (
        <p className="table-use-context">{table.description}</p>
      )}
      {exits && <p>Special Rooms Uncovered</p>}
      <table>
        <caption>
          {table.title} · {table.originalDice ?? table.dice}
        </caption>
        {exits && (
          <thead>
            <tr>
              <th scope="col">Roll</th>
              {[0, 1, 2, 3, 4].map((n) => (
                <th key={n} scope="col">
                  {n}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {table.entries.map((entry) => {
            const notes = tableEntryNotes(entry);
            const columns = entry.metadata?.bySpecialRoomsUncovered as
              | Record<string, { printedValue: string }>
              | undefined;
            const namedSelector =
              table.rollable === false && tableSelector(entry) === entry.text;
            return (
              <tr
                key={entry.id}
                className={
                  currentEntryIds.includes(entry.id)
                    ? 'current-table-result'
                    : undefined
                }
              >
                <th scope="row">
                  {namedSelector ? (
                    <ReferenceLinkedText text={entry.text} />
                  ) : (
                    tableSelector(entry)
                  )}
                </th>
                {exits && columns ? (
                  [0, 1, 2, 3, 4].map((n) => (
                    <td key={n}>{columns[String(n)]?.printedValue}</td>
                  ))
                ) : (
                  <td>
                    {!namedSelector && (
                      <ReferenceLinkedText text={entry.text} />
                    )}
                    {!!notes.length && (
                      <details className="table-entry-detail">
                        <summary>{notes[0].split('\n')[0]}</summary>
                        <p>{notes.join('\n\n')}</p>
                      </details>
                    )}
                    {Array.isArray(entry.metadata?.followup) && (
                      <details className="table-followup">
                        <summary>조건부 추가 표</summary>
                        <ul>
                          {(entry.metadata.followup as RuleEntry[]).map(
                            (child, i) => (
                              <li key={i}>
                                <b>{followUpSelector(child)}</b> {child.text}
                              </li>
                            ),
                          )}
                        </ul>
                      </details>
                    )}
                    {canSelectTableEntry(table, entry) && (
                      <button
                        className="ref-text-action table-use-entry"
                        onClick={() => onChoose(table, entry)}
                      >
                        USE THIS RESULT
                      </button>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
