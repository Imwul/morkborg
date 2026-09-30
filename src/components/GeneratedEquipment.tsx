import { useState } from 'react';
import type { OracleRoll } from '../domain/oracle';
import {
  containerAlternatives,
  equipmentScrollTable,
} from '../domain/generatedEquipment';
import { oracleReadingText } from '../domain/referenceReading';
import { rollOracle } from '../generators/oracleRoller';
import { useOracleRegistry } from '../storage/oracleStore';
import { useReferenceDesk } from './ReferenceContext';
import { ReferenceReadingText } from './ReferenceReadingText';
import { ReferenceRollTrace } from './ReferenceRollTrace';

export function EquipmentScroll({ parent }: { parent: OracleRoll }) {
  const { registry } = useOracleRegistry();
  const desk = useReferenceDesk();
  const [error, setError] = useState('');
  const table = registry.tables.find(
    (table) => table.id === equipmentScrollTable(parent),
  );
  const result = desk?.inlineChildren?.get(parent);
  const label =
    parent.metadata?.scrollTable === 'sacred'
      ? '신성 두루마리'
      : '부정한 두루마리';
  return (
    <div className="equipment-scroll" aria-label={`${label} 장비 값`}>
      <div aria-live="polite">
        <ReferenceReadingText
          text={result ? oracleReadingText(result) : parent.text}
          resultText={result?.text ?? parent.text}
          source={result ?? parent}
        />
        {result && (
          <p className="equipment-scroll-trace">
            <ReferenceRollTrace text={`${result.dice} = ${result.roll}`} />
          </p>
        )}
      </div>
      <button
        className={result ? 'play-open-action' : 'play-roll-action'}
        disabled={
          !table?.sourceVerified ||
          table.rollable === false ||
          !desk?.onInlineChild
        }
        onClick={() => {
          try {
            const child = rollOracle(table!, registry);
            desk!.onInlineChild!(parent, {
              ...child,
              metadata: {
                ...child.metadata,
                parentEntryId: parent.entryId,
                parentOracleId: parent.oracleId,
              },
            });
            setError('');
          } catch (error) {
            setError(
              error instanceof Error ? error.message : '원문 표를 확인하세요.',
            );
          }
        }}
      >
        {label} {result ? '다시 굴리기' : '굴리기'}
      </button>
      {!table && <p>두루마리 원문 표를 불러오면 굴릴 수 있습니다.</p>}
      {error && <p role="alert">{error}</p>}
    </div>
  );
}

export function ContainerAlternatives({ parent }: { parent: OracleRoll }) {
  const { registry } = useOracleRegistry();
  const table = registry.tables.find((table) => table.id === parent.oracleId);
  const choices = table ? containerAlternatives(table, parent) : [];
  if (!choices.length) return null;
  return (
    <aside
      className="equipment-alternatives"
      aria-label="앞선 운반 도구 선택지"
    >
      <h4>당나귀 대신 고를 수 있는 것</h4>
      <ul>
        {choices.map((choice) => (
          <li key={choice.id}>
            <ReferenceReadingText text={choice.text} source={choice} />
          </li>
        ))}
      </ul>
    </aside>
  );
}
