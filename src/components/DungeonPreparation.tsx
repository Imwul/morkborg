import { useState } from 'react';
import type { OracleRegistry } from '../domain/oracle';
import type { ReferenceReading } from '../domain/referenceReading';
import {
  DUNGEON_PREPARATION_FIELDS,
  DNGNGEN_URL,
  emptyDungeonPreparationReading,
  editDungeonPreparationField,
  rerollDungeonPreparationField,
} from '../domain/dungeonReferencePreparation';
import { ReferenceReadingText } from './ReferenceReadingText';
import { ReferenceRollTrace } from './ReferenceRollTrace';
import { ReferenceNextSteps } from './ReferenceNextSteps';
import { InlineSourceSubtable } from './InlineSourceSubtable';

/** SD's preparation sheet: independent source fields, no crawl/session state. */
export function DungeonPreparation({
  reading,
  registry,
  onChange,
  onOpen,
}: {
  reading?: ReferenceReading;
  registry: OracleRegistry;
  onChange: (reading: ReferenceReading, rolled: boolean) => void;
  onOpen: (id: string) => void;
}) {
  const [error, setError] = useState('');
  const current = reading ?? emptyDungeonPreparationReading();
  return (
    <section className="dungeon-preparation" aria-label="던전 준비 항목">
      <p className="dungeon-preparation-method">
        SD 준비 양식 · 특별한 방 4개는 Core Sample Rooms에서 각각 굴립니다.{' '}
        <a href={DNGNGEN_URL} target="_blank" rel="noreferrer">
          DNGNGEN 원본 ↗
        </a>
      </p>
      {error && <p role="alert">{error}</p>}
      <div className="dungeon-preparation-fields">
        {DUNGEON_PREPARATION_FIELDS.map((field) => {
          const block = current.blocks.find(
            (block) => block.title === field.title,
          );
          const rolls =
            current.oracle?.rolls.filter(
              (roll) => roll.metadata?.preparationField === field.key,
            ) ?? [];
          const formula = field.tableIds
            .map((id) => registry.tables.find((table) => table.id === id))
            .filter(Boolean)
            .map((table) => table!.originalDice ?? table!.dice)
            .join(' / ');
          return (
            <section key={field.key} data-preparation-field={field.key}>
              <header>
                <h3>{field.titleKo}</h3>
                {formula && <code>{formula}</code>}
              </header>
              {field.kind === 'manual' ? (
                <label>
                  <span className="sr-only">{field.titleKo}</span>
                  <textarea
                    value={block?.text ?? ''}
                    placeholder="직접 적기 · 선택 사항"
                    onChange={(event) =>
                      onChange(
                        editDungeonPreparationField(
                          current,
                          field.key,
                          event.target.value,
                        ),
                        false,
                      )
                    }
                  />
                </label>
              ) : block?.text ? (
                <>
                  {block.dice && (
                    <p className="reference-result-dice">
                      <ReferenceRollTrace text={block.dice} />
                    </p>
                  )}
                  <ReferenceReadingText
                    text={block.text}
                    translation={block.translation?.ko}
                    resultText={rolls.length === 1 ? rolls[0].text : block.text}
                  />
                </>
              ) : (
                <p className="dungeon-field-empty">—</p>
              )}
              {field.kind !== 'manual' && (
                <div className="dungeon-field-actions">
                  <button
                    onClick={() => {
                      try {
                        onChange(
                          {
                            ...rerollDungeonPreparationField(
                              current,
                              field.key,
                              registry,
                            ),
                            rollMethod: { kind: 'APP_ROLL' },
                          },
                          true,
                        );
                        setError('');
                      } catch (error) {
                        setError(
                          error instanceof Error
                            ? error.message
                            : '원문 표를 확인하세요.',
                        );
                      }
                    }}
                  >
                    {block?.text ? '다시 굴리기' : '굴리기'}
                  </button>
                  {field.referenceIds.map((id, n) => (
                    <button key={id} onClick={() => onOpen(id)}>
                      표 보기{field.referenceIds.length > 1 ? ` ${n + 1}` : ''}{' '}
                      ↗
                    </button>
                  ))}
                </div>
              )}
              {'note' in field && field.kind !== 'room' && (
                <p className="dungeon-field-note">{field.note}</p>
              )}
              {rolls.map((roll) => {
                const table = registry.tables.find(
                  (table) => table.id === roll.oracleId,
                );
                const entry = table?.entries.find(
                  (entry) => entry.id === roll.entryId,
                );
                return (
                  <div key={`${roll.oracleId}:${roll.entryId}`}>
                    <ReferenceNextSteps
                      metadata={roll.metadata}
                      tableId={roll.oracleId}
                    />
                    {table && entry && (
                      <InlineSourceSubtable table={table} entry={entry} />
                    )}
                  </div>
                );
              })}
            </section>
          );
        })}
      </div>
    </section>
  );
}
