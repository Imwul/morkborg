import { parsePhysicalDice } from './manualReferenceRoll';
import { random, rollDie, type RandomSource } from '../generators/random';

/** Small source-specified dice checks, never a new oracle or an effect applier. */
export type GuidedRoll =
  | { kind: 'quantity'; dice: string; offset?: number; modifierLabel?: string }
  | { kind: 'test'; dice: 'd20' | '2d20'; ability: string; dr: number }
  | { kind: 'chance'; dice: 'd6'; threshold: number };
export interface GuidedRollResult {
  values: number[];
  total: number;
  text: string;
  outcome?: 'success' | 'failure' | 'strong' | 'weak' | 'miss';
}
export function resolveGuidedRoll(
  spec: GuidedRoll,
  input: string,
  modifier = 0,
): GuidedRollResult {
  if (!Number.isSafeInteger(modifier))
    throw new Error('보정은 정수로 입력하세요.');
  const { values, value } = parsePhysicalDice(spec.dice, input);
  if (spec.kind === 'test') {
    if (!Number.isSafeInteger(spec.dr) || spec.dr < 1)
      throw new Error('DR은 1 이상의 정수입니다.');
    const successes = values.filter((v) => v + modifier >= spec.dr).length;
    return {
      values,
      total: value + modifier,
      outcome:
        values.length === 1
          ? successes
            ? 'success'
            : 'failure'
          : successes === 2
            ? 'strong'
            : successes === 1
              ? 'weak'
              : 'miss',
      text: `${spec.dice} [${values.join(', ')}] + (${modifier}) · DR${spec.dr} → ${values.length === 1 ? (successes ? '성공' : '실패') : successes === 2 ? 'Strong Hit' : successes === 1 ? 'Weak Hit' : 'Miss'}`,
    };
  }
  if (spec.kind === 'chance') {
    if (
      !Number.isInteger(spec.threshold) ||
      spec.threshold < 1 ||
      spec.threshold > 6
    )
      throw new Error('확률 범위를 확인하세요.');
    return {
      values,
      total: value,
      text: `d6 = ${value} · ${spec.threshold}/6 → ${value <= spec.threshold ? '발생' : '발생하지 않음'}`,
    };
  }
  const total =
    value + (spec.offset ?? 0) + (spec.modifierLabel ? modifier : 0);
  return {
    values,
    total,
    text: `${spec.dice} [${values.join(', ')}]${spec.offset ? ` ${spec.offset > 0 ? '+' : '−'} ${Math.abs(spec.offset)}` : ''}${spec.modifierLabel ? ` + (${modifier})` : ''} = ${total}`,
  };
}
export function rollGuidedDice(
  spec: GuidedRoll,
  modifier = 0,
  rng: RandomSource = random,
) {
  const { sides } = parsePhysicalDice(
    spec.dice,
    spec.dice.startsWith('2d')
      ? '1,1'
      : spec.dice.startsWith('3d')
        ? '1,1,1'
        : '1',
  );
  // Validate before consuming randomness.
  resolveGuidedRoll(spec, sides.map(() => 1).join(','), modifier);
  return resolveGuidedRoll(
    spec,
    sides.map((s) => rollDie(s, rng)).join(','),
    modifier,
  );
}
