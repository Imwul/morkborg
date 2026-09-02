import type {
  OracleDefinition,
  OracleProcedure,
  OracleRegistry,
  OracleResult,
  OracleRoll,
} from '../domain/oracle';
import { id, random, rollDie, type RandomSource } from './random';
function tupleSides(notation: string): [number, number] | null {
  const pairs: Record<string, [number, number]> = {
    d66: [6, 6],
    'd4 × d6': [4, 6],
    'd6 × d8': [6, 8],
    'd4 × d8': [4, 8],
  };
  return pairs[notation] ?? null;
}

export function diceDomain(notation: string): number[] {
  const pair = tupleSides(notation);
  if (pair)
    return Array.from(
      { length: pair[0] * pair[1] },
      (_, i) => (Math.floor(i / pair[1]) + 1) * 10 + (i % pair[1]) + 1,
    );
  const m = /^(?:(2|3))?d(2|3|4|6|8|10|12|20|100)$/.exec(notation);
  if (!m) throw new Error(`지원하지 않는 주사위 표기: ${notation}`);
  const count = Number(m[1] || 1),
    sides = Number(m[2]);
  return Array.from({ length: count * sides - count + 1 }, (_, i) => count + i);
}
export function rollOracleDice(notation: string, rng: RandomSource = random) {
  diceDomain(notation);
  const pair = tupleSides(notation);
  if (pair) {
    const values = [rollDie(pair[0], rng), rollDie(pair[1], rng)];
    return { value: values[0] * 10 + values[1], values };
  }
  const [count, sides] = notation.split('d');
  const values = Array.from({ length: Number(count || 1) }, () =>
    rollDie(Number(sides), rng),
  );
  return { value: values.reduce((a, b) => a + b, 0), values };
}
export function sourceLabel(
  table: OracleDefinition,
  registry: OracleRegistry,
): string {
  const book =
    registry.books.find((b) => b.id === table.sourceBookId)?.title ??
    table.sourceBookId;
  const pages =
    table.sourcePage == null
      ? '쪽수 미확인'
      : `PDF ${[table.sourcePage].flat().join(', ')}쪽`;
  return `${book} · ${pages}${table.printedPage == null ? '' : ` / p. ${table.printedPage}`} · ${table.title}`;
}
export function selectOracleEntry(table: OracleDefinition, value: number) {
  if (!diceDomain(table.dice).includes(value))
    throw new Error('주사위 범위 밖의 값입니다.');
  const matches = table.entries.filter((e) => e.min <= value && e.max >= value);
  if (matches.length > 1)
    throw new Error('원문 범위가 중복됩니다. 표를 확인하세요.');
  if (!matches.length && !table.allowedGaps?.includes(value))
    throw new Error('해당 주사위 값에 대응하는 원문이 없습니다.');
  if (matches[0]?.sourceUnclear)
    throw new Error('원문 확인이 필요한 항목입니다.');
  return matches[0];
}
export function rollOracle(
  table: OracleDefinition,
  registry: OracleRegistry,
  rng: RandomSource = random,
): OracleRoll {
  if (table.rollable === false || !table.sourceVerified)
    throw new Error('이 표는 원문과 사용 조건을 확인한 뒤 직접 참조하세요.');
  const rolled = rollOracleDice(table.dice, rng);
  const entry = selectOracleEntry(table, rolled.value);
  return {
    oracleId: table.id,
    title: table.title,
    dice: table.dice,
    roll: rolled.value,
    diceValues: rolled.values,
    entryId: entry?.id ?? null,
    text: entry?.text ?? '[원문에 해당 결과가 없음]',
    source: sourceLabel(table, registry),
    metadata: entry?.metadata,
  };
}
export function rollProcedure(
  procedure: OracleProcedure,
  registry: OracleRegistry,
  rng: RandomSource = random,
): OracleResult {
  const tables = procedure.oracleIds.map((id) => {
    const table = registry.tables.find((t) => t.id === id);
    if (!table) throw new Error(`연결된 표가 없습니다: ${id}`);
    return table;
  });
  return {
    id: id(),
    title: procedure.title,
    rolls: tables.map((table, index) => {
      const result = rollOracle(table, registry, rng);
      return procedure.rollLabels?.[index]
        ? {
            ...result,
            title: `${procedure.rollLabels[index]} · ${result.title}`,
          }
        : result;
    }),
  };
}
