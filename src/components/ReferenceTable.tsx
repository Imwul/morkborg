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
  hideCaption = false,
}: {
  table: OracleDefinition;
  currentEntryIds: (string | null)[];
  onChoose: (table: OracleDefinition, entry: OracleEntry) => void;
  hideCaption?: boolean;
}) {
  const exits = table.id === 'sd.room.exits';
  const desk = useReferenceDesk();
  return (
    <section
      className={`reference-table-section dice-${String(table.originalDice ?? table.dice ?? 'table')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')}`}
    >
      {table.description && (
        <div className="table-use-context">
          <ReferenceReadingText text={table.description} />
        </div>
      )}
      {table.id === 'core.miseries' && (
        <p className="core-misery-guidance">
          Core · d66 (1:1–6:6). 이미 발생한 재앙은 다시 굴립니다. 일곱 번째
          재앙은 굴리지 않고 7:7을 사용합니다.
        </p>
      )}
      {exits && <p>Special Rooms Uncovered</p>}
      <table>
        <caption className={hideCaption ? 'sr-only' : undefined}>
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
            const noteTranslation = (note: string) =>
              note === entry.metadata?.effect &&
              typeof entry.metadata?.translationKo === 'string'
                ? entry.metadata.translationKo
                : undefined;
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
                <th
                  scope="row"
                  className={
                    namedSelector
                      ? 'table-name-selector'
                      : 'table-number-selector'
                  }
                >
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
                    <span className="table-dice-number">{tableSelector(entry)}</span>
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
                          <Translation
                            text={notes[0].split('\n')[0]}
                            translation={
                              noteTranslation(notes[0])?.split('\n')[0]
                            }
                          />
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
                        {notes
                          .filter((note) => !blockNotes.has(note))
                          .map((note, i) => (
                            <ReferenceReadingText
                              key={i}
                              text={note}
                              translation={noteTranslation(note)}
                            />
                          ))}
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
        {table.id === 'core.miseries' &&
          table.sourceBookId === 'core' &&
          table.forcedFinal?.label === '7:7' && (
            <tfoot>
              <tr>
                <th scope="row">7:7</th>
                <td>
                  <strong>일곱 번째 재앙 · 고정 결과</strong>
                  <ReferenceReadingText text={table.forcedFinal.text} />
                  <small>Core · PDF {table.forcedFinal.sourcePage}</small>
                </td>
              </tr>
            </tfoot>
          )}
      </table>
    </section>
  );
}
