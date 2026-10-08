import { useState, type ReactNode } from 'react';
import type { OracleRegistry } from '../domain/oracle';
import type { ReferenceReading } from '../domain/referenceReading';
import {
  DUNGEON_PREPARATION_FIELDS,
  DNGNGEN_URL,
  emptyDungeonPreparationReading,
  editDungeonPreparationField,
  rerollDungeonPreparationField,
  selectDungeonRoomSource,
} from '../domain/dungeonReferencePreparation';
import type { PrivateDngngenState } from '../storage/privateDngngenClient';
import type { DngngenFeatureKey } from '../domain/dngngenPack';
import { DngngenResultText } from './DngngenResultText';
import { ReferenceReadingText } from './ReferenceReadingText';
import { ReferenceRollTrace } from './ReferenceRollTrace';
import { ReferenceNextSteps } from './ReferenceNextSteps';
import { InlineSourceSubtable } from './InlineSourceSubtable';
import { ReferenceRollSettings } from './ReferenceRollSettings';

/** SD's preparation sheet: independent source fields, no crawl/session state. */
export function DungeonPreparation({
  reading,
  registry,
  onChange,
  onOpen,
  privateDngngen,
  actions,
}: {
  reading?: ReferenceReading;
  registry: OracleRegistry;
  onChange: (reading: ReferenceReading, rolled: boolean) => void;
  onOpen: (id: string) => void;
  privateDngngen?: PrivateDngngenState;
  actions?: ReactNode;
}) {
  const [error, setError] = useState('');
  const current = reading ?? emptyDungeonPreparationReading();
  const pack =
    privateDngngen?.status === 'ready' ? privateDngngen.pack : undefined;
  const roomSource = current.preparation?.roomSource ?? 'CORE';
  const hasDngngenResults = !!Object.keys(current.preparation?.rooms ?? {})
    .length;
  return (
    <section className="dungeon-preparation" aria-label="던전 준비 항목">
      <p className="dungeon-preparation-method">
        {pack || hasDngngenResults
          ? 'SD 준비 양식 · 원문 선택은 다음 굴림부터 적용됩니다. '
          : 'SD 준비 양식 · 특별한 방 4개는 Core Sample Rooms에서 각각 굴립니다. '}
        <a href={DNGNGEN_URL} target="_blank" rel="noreferrer">
          DNGNGEN 원본 ↗
        </a>
      </p>
      {(pack || hasDngngenResults || roomSource === 'DNGNGEN') && (
        <ReferenceRollSettings
          label="던전 굴림 설정"
          description={
            pack && (
              <>
                {pack.source.attribution}
                {pack.profile === 'synthetic'
                  ? ' · 합성 검증 데이터 — DNGNGEN 원문 아님'
                  : ''}
              </>
            )
          }
        >
          <label>
            {pack?.features ? '방·방문 이유·입구·경비 원문' : '특별한 방 원문'}{' '}
            <select
              value={roomSource}
              onChange={(event) => {
                onChange(
                  selectDungeonRoomSource(
                    current,
                    event.target.value as 'CORE' | 'DNGNGEN',
                    pack,
                  ),
                  false,
                );
                setError('');
              }}
            >
              <option value="CORE">CORE</option>
              <option value="DNGNGEN" disabled={!pack}>
                DNGNGEN
                {pack?.profile === 'synthetic' ? ' · SYNTHETIC DEMO' : ''}
              </option>
            </select>
          </label>
        </ReferenceRollSettings>
      )}
      {privateDngngen?.status === 'unavailable' &&
        privateDngngen.reason !== 'missing' && (
          <output className="dungeon-field-note">
            Private DNGNGEN 자료를 확인할 수 없습니다. CORE는 계속 사용할 수
            있습니다.
          </output>
        )}
      {!pack && roomSource === 'DNGNGEN' && (
        <output className="dungeon-field-note">
          DNGNGEN 자료가 준비되지 않았습니다. 기존 결과는 유지되며 CORE를 선택할
          수 있습니다.
        </output>
      )}
      {error && <p role="alert">{error}</p>}
      {actions}
      <div className="dungeon-preparation-fields">
        {DUNGEON_PREPARATION_FIELDS.map((field) => {
          const block = current.blocks.find(
            (block) => block.title === field.title,
          );
          const nativeResult =
            field.kind === 'room'
              ? current.preparation?.rooms?.[
                  Number(field.key.slice(-1)) as 1 | 2 | 3 | 4
                ]
              : undefined;
          const nativeFeature =
            current.preparation?.features?.[field.key as DngngenFeatureKey];
          const pendingNativeFeature =
            roomSource === 'DNGNGEN' &&
            !!pack?.features?.[field.key as DngngenFeatureKey];
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
                <h3>
                  {field.title}
                  <span className="generated-translation" lang="ko">
                    {field.titleKo}
                  </span>
                </h3>
                {(formula ||
                  nativeFeature ||
                  (pendingNativeFeature && !block?.text)) && (
                  <code>
                    {nativeResult ||
                    nativeFeature ||
                    (pendingNativeFeature && !block?.text) ||
                    (field.kind === 'room' &&
                      !block?.text &&
                      roomSource === 'DNGNGEN')
                      ? 'DIGITAL'
                      : formula}
                  </code>
                )}
              </header>
              {field.kind === 'manual' ? (
                <>
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
                  {block?.translation?.ko && (
                    <p className="generated-translation" lang="ko">
                      {block.translation.ko}
                    </p>
                  )}
                </>
              ) : block?.text ? (
                <>
                  {block.dice && (
                    <p className="reference-result-dice">
                      <ReferenceRollTrace text={block.dice} />
                    </p>
                  )}
                  {nativeResult ? (
                    nativeResult.components.map((component, index) => (
                      <DngngenResultText key={index} {...component} />
                    ))
                  ) : nativeFeature ? (
                    <DngngenResultText {...nativeFeature} />
                  ) : (
                    <ReferenceReadingText
                      text={block.text}
                      translation={block.translation?.ko}
                      resultText={
                        rolls.length === 1 ? rolls[0].text : block.text
                      }
                    />
                  )}
                </>
              ) : (
                <p className="dungeon-field-empty">—</p>
              )}
              {(field.kind !== 'manual' || pendingNativeFeature) && (
                <div className="dungeon-field-actions">
                  <button
                    className="play-roll-action"
                    disabled={
                      roomSource === 'DNGNGEN' &&
                      !pack &&
                      (field.kind === 'room' || !!nativeFeature)
                    }
                    onClick={() => {
                      try {
                        onChange(
                          {
                            ...rerollDungeonPreparationField(
                              current,
                              field.key,
                              registry,
                              undefined,
                              pack,
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
                  {!nativeResult &&
                    !nativeFeature &&
                    !(pendingNativeFeature && !block?.text) &&
                    (field.kind !== 'room' ||
                      roomSource === 'CORE' ||
                      !!block?.text) &&
                    field.referenceIds.map((id, n) => (
                      <button
                        className="play-open-action"
                        key={id}
                        onClick={() => onOpen(id)}
                      >
                        표 보기
                        {field.referenceIds.length > 1 ? ` ${n + 1}` : ''} ↗
                      </button>
                    ))}
                </div>
              )}
              {'note' in field &&
                field.kind !== 'room' &&
                !nativeFeature &&
                !pendingNativeFeature && (
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
                      <InlineSourceSubtable
                        table={table}
                        entry={entry}
                        parentContext={roll}
                      />
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
