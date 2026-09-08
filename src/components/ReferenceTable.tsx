import type { OracleDefinition, OracleEntry } from '../domain/oracle';
import type { RuleEntry } from '../storage/rulesStore';
import {
  canSelectTableEntry,
  followUpSelector,
  tableEntryNotes,
  tableSelector,
} from '../domain/referenceTable';
import { ReferenceLinkedText } from './ReferenceLinkedText';
import { useReferenceDesk } from './ReferenceContext';
import { ReferenceNextSteps } from './ReferenceNextSteps';
import { ReferenceReadingText } from './ReferenceReadingText';
import { Translation } from './Translation';

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
  const desk = useReferenceDesk();
  return (
    <section className="reference-table-section">
      {table.description && (
        <div className="table-use-context">
          <ReferenceReadingText text={table.description} />
        </div>
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
            const blocks = Array.isArray(entry.metadata?.blocks)
              ? entry.metadata.blocks.filter(
                  (b) =>
                    b &&
                    typeof b.title === 'string' &&
                    typeof b.text === 'string',
                )
              : [];
            const blockNotes = new Set(
              blocks.map((b) => [b.title, b.text].filter(Boolean).join('\n')),
            );
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
                    typeof entry.metadata?.referenceId === 'string' &&
                    desk?.byId[entry.metadata.referenceId] ? (
                      <button
                        className="ref-text-action"
                        onClick={() =>
                          desk.activate(String(entry.metadata!.referenceId))
                        }
                      >
                        {entry.text} ›
                        <Translation
                          text={entry.text}
                          translation={
                            typeof entry.metadata?.ko === 'string'
                              ? entry.metadata.ko
                              : undefined
                          }
                        />
                      </button>
                    ) : (
                      <>
                        <ReferenceLinkedText text={entry.text} />
                        <Translation
                          text={entry.text}
                          translation={
                            typeof entry.metadata?.ko === 'string'
                              ? entry.metadata.ko
                              : undefined
                          }
                        />
                      </>
                    )
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
                      <ReferenceReadingText text={entry.text} source={entry} />
                    )}
                    {!!notes.length && (
                      <details className="table-entry-detail">
                        <summary>
                          {notes[0].split('\n')[0]}
                          <Translation text={notes[0].split('\n')[0]} />
                        </summary>
                        {blocks.map((block, n) => (
                          <section key={n}>
                            <strong>
                              {block.title}
                              <Translation
                                text={block.title}
                                translation={block.translation?.titleKo}
                              />
                            </strong>
                            <ReferenceReadingText
                              text={block.text}
                              translation={block.translation?.ko}
                            />
                          </section>
                        ))}
                        <ReferenceReadingText
                          text={notes
                            .filter((note) => !blockNotes.has(note))
                            .join('\n\n')}
                        />
                      </details>
                    )}
                    {Array.isArray(entry.metadata?.followup) && (
                      <details className="table-followup">
                        <summary>조건부 추가 표</summary>
                        <ul>
                          {(entry.metadata.followup as RuleEntry[]).map(
                            (child, i) => (
                              <li key={i}>
                                <b>{followUpSelector(child)}</b>
                                <ReferenceReadingText
                                  text={child.text}
                                  translation={
                                    typeof child.meta.ko === 'string'
                                      ? child.meta.ko
                                      : undefined
                                  }
                                />
                              </li>
                            ),
                          )}
                        </ul>
                      </details>
                    )}
                    <ReferenceNextSteps metadata={entry.metadata} />
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
