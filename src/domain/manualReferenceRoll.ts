import type { OracleDefinition, OracleRegistry, OracleRoll } from './oracle';
import type { ReferenceEntry } from './references';
import { diceDomain, rollOracle } from '../generators/oracleRoller';
import { id } from '../generators/random';
import { appPolicy } from './generationAuthority';
import {
  CARD_RANKS,
  CARD_SUITS,
  cardIdentity,
  drawRareMonster,
  shuffledDeck,
  type PlayingCard,
} from './depthsProcedures';
import { refsForOracle } from './referenceExecution';
import {
  oracleFollowUpLinks,
  oracleReadingText,
  type ReferenceReading,
} from './referenceReading';

export function parsePhysicalDice(notation: string, input: string) {
  diceDomain(notation); // Reuse the supported canonical notation boundary.
  const tuple: Record<string, number[]> = {
    d66: [6, 6],
    'd4 × d6': [4, 6],
    'd6 × d8': [6, 8],
    'd4 × d8': [4, 8],
  };
  const match = /^(?:(2|3))?d(2|3|4|6|8|10|12|20|100)$/.exec(notation);
  const sides =
    tuple[notation] ?? Array(Number(match?.[1] ?? 1)).fill(Number(match?.[2]));
  let parts = input.trim().split(/[\s,+/]+/);
  if (tuple[notation] && /^\d\d$/.test(input.trim()))
    parts = input.trim().split('');
  if (
    parts.length !== sides.length ||
    parts.some(
      (s, i) => !/^\d+$/.test(s) || Number(s) < 1 || Number(s) > sides[i],
    )
  )
    throw new Error(
      `${notation}: ${sides.length > 1 ? '각 주사위 값을 쉼표로 구분해' : '범위 안의 정수를'} 입력하세요.`,
    );
  const values = parts.map(Number);
  return {
    values,
    sides,
    value: tuple[notation]
      ? values[0] * 10 + values[1]
      : values.reduce((a, b) => a + b, 0),
  };
}
export function physicalOracleRoll(
  table: OracleDefinition,
  input: string,
  registry: OracleRegistry,
): OracleRoll {
  const { values, sides } = parsePhysicalDice(table.dice, input);
  let i = 0;
  const roll = rollOracle(table, registry, () => {
    const n = i++;
    if (n >= values.length)
      throw new Error('추가 실물 주사위 입력이 필요합니다.');
    return (values[n] - 0.5) / sides[n];
  });
  return { ...roll, metadata: { ...roll.metadata, rollOrigin: 'USER_ROLL' } };
}
export function readingFromOracleRolls(
  title: string,
  rolls: OracleRoll[],
  registry: OracleRegistry,
): ReferenceReading {
  const oracle = { id: id(), title, rolls };
  return {
    title,
    oracle,
    blocks: rolls.map((r) => ({
      title: r.title,
      text: oracleReadingText(r),
      dice: `${r.dice} = ${r.roll}`,
      ...(r.oracleId === 'core.treasures' &&
      r.entryId &&
      r.metadata?.referenceName
        ? { definitionReferenceId: `definition:${r.entryId}` }
        : {}),
    })),
    sourceRefs: refsForOracle(oracle, registry),
    relatedIds: [
      ...new Set(
        rolls.flatMap((r) => oracleFollowUpLinks(r.metadata).relatedIds ?? []),
      ),
    ],
    fixedLookups: rolls.flatMap(
      (r) => oracleFollowUpLinks(r.metadata).fixedLookups ?? [],
    ),
  };
}
export function manualTableReading(
  entry: ReferenceEntry,
  tables: OracleDefinition[],
  inputs: Record<string, string>,
  registry: OracleRegistry,
) {
  const output = readingFromOracleRolls(
    entry.title,
    tables.map((table, n) =>
      physicalOracleRoll(table, inputs[String(n)] ?? '', registry),
    ),
    registry,
  );
  return {
    ...output,
    rollMethod: { kind: 'USER_ROLL' as const, inputs },
    authority: [...(entry.authority ?? []), appPolicy('app.physical-roll')],
  };
}
export function parsePhysicalCards(input: string): PlayingCard[] {
  const tokens = input
    .replace(/\uFE0F/g, '')
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean);
  const cards = tokens.map((token) => {
    const m = /^(10|[2-9AJQK])([♣♦♥♠])$/i.exec(token);
    if (!m) throw new Error('카드는 Q♠, 10♥처럼 순위와 무늬를 입력하세요.');
    return {
      rank: m[1].toUpperCase() as (typeof CARD_RANKS)[number],
      suit: m[2] as (typeof CARD_SUITS)[number],
    };
  });
  if (new Set(cards.map(cardIdentity)).size !== cards.length)
    throw new Error('같은 카드를 중복 입력할 수 없습니다.');
  return cards;
}
export function manualRareMonster(
  input: string,
  registry: OracleRegistry,
  remaining?: PlayingCard[],
): ReferenceReading {
  const cards = parsePhysicalCards(input),
    needsSixth = cards[2]?.suit === '♠' && cards[3]?.suit === '♠';
  if (cards.length !== (needsSixth ? 6 : 5))
    throw new Error(
      needsSixth
        ? '3·4번이 모두 ♠입니다. 여섯 번째 카드도 입력하세요.'
        : '순서대로 카드 다섯 장을 입력하세요.',
    );
  const deck = remaining ?? shuffledDeck();
  if (cards.some((c) => !deck.some((d) => cardIdentity(c) === cardIdentity(d))))
    throw new Error(
      '이미 사용한 카드입니다. 새 던전이라면 덱을 먼저 초기화하세요.',
    );
  const used = new Set(cards.map(cardIdentity));
  const result = drawRareMonster(registry, [
    ...cards,
    ...deck.filter((c) => !used.has(cardIdentity(c))),
  ]);
  return {
    ...result,
    rollMethod: { kind: 'USER_ROLL', inputs: { cards: input } },
    authority: [...(result.authority ?? []), appPolicy('app.physical-roll')],
  };
}
