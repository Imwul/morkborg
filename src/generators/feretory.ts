import { random, rollDie, type RandomSource } from './random';

export const FERETORY_TABLE_IDS = [
  'feretory.A',
  'feretory.B',
  'feretory.C',
] as const;
export const FERETORY_MONSTER_TITLE = 'The Monster Approaches · 몬스터 생성';
export const FERETORY_MONSTER_SUMMARY =
  '3d12를 굴려 A/B/C에 하나씩 배정합니다. 같은 결과로 외형·사기·피해·방어구를 정하고, 피해 주사위를 추가로 한 번 굴려 ×2한 값이 HP입니다.';

export type FeretoryRolls = { A: number; B: number; C: number };
export const feretoryRolls = (rng: RandomSource = random): FeretoryRolls => ({
  A: rollDie(12, rng),
  B: rollDie(12, rng),
  C: rollDie(12, rng),
});
export function feretoryStats(
  rolls: FeretoryRolls,
  rng: RandomSource = random,
) {
  const values = Object.values(rolls);
  const highest = Math.max(...values),
    lowest = Math.min(...values);
  const sides =
    lowest <= 3
      ? 4
      : lowest <= 5
        ? 6
        : lowest <= 7
          ? 8
          : lowest <= 10
            ? 10
            : 12;
  const options = Object.entries(rolls)
    .filter(([, n]) => n === highest)
    .map(([key]) =>
      key === 'A' ? 'None' : key === 'B' ? '−d2' : highest % 2 ? '−d4' : '−d6',
    );
  const hpRoll = rollDie(sides, rng);
  return {
    hp: 2 * hpRoll,
    hpRoll,
    morale: highest,
    damage: `d${sides}`,
    armor:
      options.length === 1
        ? options[0]
        : `동률 — 심판 선택: ${options.map((option) => (option === 'None' ? '없음' : option)).join(' / ')}`,
    sides,
  };
}
