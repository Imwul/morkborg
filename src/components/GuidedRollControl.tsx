import { useState } from 'react';
import {
  resolveGuidedRoll,
  rollGuidedDice,
  type GuidedRoll,
  type GuidedRollResult,
} from '../domain/guidedRoll';
import { usePlayToolState } from './usePlayToolState';

interface Props {
  spec: GuidedRoll;
  stateKey: string;
  label: string;
  onResult?: (result: GuidedRollResult) => void;
}
export function GuidedRollControl(props: Props) {
  return (
    <GuidedRollFields
      key={`${props.stateKey}:${JSON.stringify(props.spec)}`}
      {...props}
    />
  );
}
function GuidedRollFields({ spec, stateKey, label, onResult }: Props) {
  const key = `guidance:${stateKey}:${JSON.stringify(spec)}`;
  const [modifier, setModifier] = usePlayToolState(key + ':modifier', '0');
  const [manual, setManual] = usePlayToolState(key + ':manual', '');
  const [result, setResult] = usePlayToolState<
    (GuidedRollResult & { method: string }) | undefined
  >(key + ':result', undefined);
  const [error, setError] = useState('');
  const modifierLabel =
    spec.kind === 'test'
      ? spec.ability
      : spec.kind === 'quantity'
        ? spec.modifierLabel
        : undefined;
  function run(physical: boolean) {
    try {
      if (modifierLabel && !modifier.trim())
        throw new Error('보정을 입력하세요.');
      const next = physical
        ? resolveGuidedRoll(spec, manual, Number(modifier))
        : rollGuidedDice(spec, Number(modifier));
      setResult({ ...next, method: physical ? '입력값' : '앱 굴림' });
      setError('');
      onResult?.(next);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div className="guided-roll" aria-label={label}>
      <div className="guided-roll-controls">
        {modifierLabel && (
          <label>
            {modifierLabel}
            <input
              aria-label={`${label} 보정`}
              type="number"
              step="1"
              value={modifier}
              onChange={(e) => setModifier(e.target.value)}
            />
          </label>
        )}
        <button type="button" onClick={() => run(false)}>
          {spec.dice}
          {spec.kind === 'quantity' && spec.offset
            ? `${spec.offset > 0 ? '+' : '−'}${Math.abs(spec.offset)}`
            : ''}{' '}
          굴리기
        </button>
        <label>
          직접 굴린 값
          <input
            aria-label={`${label} 직접 굴린 값`}
            placeholder={spec.dice === '2d20' ? '예: 7, 16' : '주사위 눈'}
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            inputMode={/^d\d+$/.test(spec.dice) ? 'numeric' : 'text'}
          />
        </label>
        <button type="button" onClick={() => run(true)}>
          입력값 판정
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      {result && (
        <output aria-live="polite">
          {result.method} · {result.text}
        </output>
      )}
    </div>
  );
}
