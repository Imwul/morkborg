export type RandomSource = () => number;
export const random: RandomSource = () => {
  const words = new Uint32Array(1);
  crypto.getRandomValues(words);
  return words[0] / 4294967296;
};
export function pick<T>(items: readonly T[], rng: RandomSource = random): T {
  if (!items.length) throw new Error('Cannot roll an empty table');
  return items[Math.floor(rng() * items.length)];
}
export function rollDie(sides: number, rng: RandomSource = random): number {
  if (sides < 1) throw new Error('Invalid die');
  return 1 + Math.floor(rng() * sides);
}
export function rollDice(
  count: number,
  sides: number,
  rng: RandomSource = random,
): number {
  return Array.from({ length: count }, () => rollDie(sides, rng)).reduce(
    (a, b) => a + b,
    0,
  );
}
export function weightedPick<T>(
  items: { value: T; weight: number }[],
  rng: RandomSource = random,
): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  if (total <= 0) throw new Error('Invalid weights');
  let n = rng() * total;
  for (const item of items) {
    n -= item.weight;
    if (n < 0) return item.value;
  }
  return items[items.length - 1].value;
}
export const id = (): string => crypto.randomUUID();
export const now = (): string => new Date().toISOString();
