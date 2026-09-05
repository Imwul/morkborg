import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CITY_MOVE_DEFAULTS,
  rollCityMove,
  resolveDirectionsChoice,
  prayerPlaceBonus,
  rollMerchantDisposition,
  settlementStreetDice,
  rollSettlementStreets,
  rollMicroCrawl,
  encounterSettlementChance,
} from '../src/domain/cityProcedures.ts';
const seq = (...values: number[]) => {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
};
const die = (face: number, sides: number) => (face - 1) / sides;
const move = (values: number[], overrides = {}) =>
  rollCityMove(
    { move: 'crawl', dr: 12, modifier: 0, mode: 'city', ...overrides },
    seq(...values),
  );
const directions = (reaction: number) => {
  const a = Math.max(1, reaction - 6),
    b = reaction - a;
  return move([die(20, 20), 0, die(a, 6), die(b, 6)], { move: 'directions' });
};

test('City Moves compare each modified d20 against DR with equality passing', () => {
  const result = move([die(10, 20), die(9, 20)], { modifier: 2 });
  assert.deepEqual(result.diceValues, [10, 9]);
  assert.deepEqual(result.modifiedValues, [12, 11]);
  assert.equal(result.outcome, 'weak');
  assert.equal(
    move([die(10, 20), die(10, 20)], { modifier: 2 }).outcome,
    'strong',
  );
  assert.equal(move([die(9, 20), die(9, 20)], { modifier: 2 }).outcome, 'fail');
});
test('Moves never sum their d20s or introduce automatic natural critical overrides', () => {
  assert.equal(move([die(11, 20), die(11, 20)]).outcome, 'fail');
  assert.equal(
    move([die(20, 20), die(20, 20)], { modifier: -10 }).outcome,
    'fail',
  );
  assert.equal(move([0, 0], { modifier: 12 }).outcome, 'strong');
});
test('City strong reaches objective, while completed objectives and Dérive hits generate streets', () => {
  assert.equal(move([0.99, 0.99]).metadata.streetAction, 'next-objective');
  assert.equal(
    move([0.99, 0.99], { allObjectivesMet: true }).metadata.streetAction,
    'new-street',
  );
  for (const values of [
    [0.99, 0.99],
    [0.99, 0],
  ])
    assert.equal(
      move(values, { mode: 'derive' }).metadata.streetAction,
      'new-street',
    );
  assert.equal(
    move([0.99, 0], { mode: 'city' }).metadata.streetAction,
    'new-street',
  );
});
test('City failure records its d4 branch and requires resolution before a new street', () => {
  for (let face = 1; face <= 4; face++) {
    const result = move([0, 0, die(face, 4)]);
    assert.equal(result.metadata.followUp?.roll, face);
    assert.equal(result.metadata.followUp?.tableId, 'aitc.city-crawl-failure');
    assert.equal(result.metadata.streetAction, 'resolve-then-new-street');
    assert.equal(result.metadata.requiresResolution, true);
  }
});
test('Directions strong exposes mutually exclusive fixed benefits without rolling extra dice', () => {
  let calls = 0;
  const result = rollCityMove(
    { move: 'directions', dr: 12, modifier: 0 },
    () => {
      calls++;
      return 0.99;
    },
  );
  assert.equal(calls, 2);
  assert.equal(result.metadata.selectedDirections, undefined);
  const bonus = resolveDirectionsChoice(result, 'next-crawl-bonus', () => {
    throw new Error('No die needed');
  });
  assert.equal(bonus.metadata.selectedDirections?.nextCrawlBonus, 4);
  assert.equal(
    bonus.metadata.selectedDirections?.destinationStreets,
    undefined,
  );
  const destination = resolveDirectionsChoice(result, 'destination');
  assert.equal(destination.metadata.selectedDirections?.destinationStreets, 1);
  assert.equal(result.metadata.selectedDirections, undefined);
  assert.throws(() => resolveDirectionsChoice(bonus, 'destination'));
});
test('Directions weak reaction uses exact 2d6 boundary bands and the correct optional benefit dice', () => {
  for (const [roll, expected] of [
    [2, 'attacks'],
    [3, 'attacks'],
    [4, 'ignores'],
    [6, 'ignores'],
    [7, 'indifferent'],
    [8, 'indifferent'],
    [9, 'helpful'],
    [12, 'helpful'],
  ] as const) {
    const result = directions(roll);
    assert.equal(result.outcome, 'weak');
    assert.equal(result.metadata.reaction, expected);
    assert.equal(result.metadata.followUp?.roll, roll);
    if (roll < 7)
      assert.throws(() => resolveDirectionsChoice(result, 'destination'));
  }
  assert.equal(
    resolveDirectionsChoice(directions(7), 'next-crawl-bonus', () => 0.99)
      .metadata.selectedDirections?.nextCrawlBonus,
    2,
  );
  assert.equal(
    resolveDirectionsChoice(directions(8), 'destination', () => 0.99).metadata
      .selectedDirections?.destinationStreets,
    4,
  );
  assert.equal(
    resolveDirectionsChoice(directions(9), 'next-crawl-bonus', () => 0.99)
      .metadata.selectedDirections?.nextCrawlBonus,
    4,
  );
  assert.equal(
    resolveDirectionsChoice(directions(12), 'destination', () => 0.99).metadata
      .selectedDirections?.destinationStreets,
    2,
  );
});
test('Directions failure grants no benefits', () => {
  const result = move([0, 0], { move: 'directions' });
  assert.equal(result.metadata.directionsOptions, undefined);
  assert.throws(() => resolveDirectionsChoice(result, 'next-crawl-bonus'));
});
test('Prayer uses source d4/d6 follow-up IDs while weak hits make no further roll', () => {
  assert.equal(
    move([0.99, 0.99, 0.99], { move: 'pray' }).metadata.followUp?.tableId,
    'aitc.pray-strong',
  );
  assert.equal(
    move([0.99, 0.99, 0.99], { move: 'pray' }).metadata.followUp?.roll,
    4,
  );
  assert.equal(
    move([0, 0, 0.99], { move: 'pray' }).metadata.followUp?.tableId,
    'aitc.pray-failure',
  );
  assert.equal(move([0, 0, 0.99], { move: 'pray' }).metadata.followUp?.roll, 6);
  assert.equal(move([0.99, 0], { move: 'pray' }).metadata.followUp, undefined);
  assert.deepEqual(
    ['statue', 'shrine', 'tomb', 'chapel', 'church', 'cathedral'].map((p) =>
      prayerPlaceBonus(p as Parameters<typeof prayerPlaceBonus>[0]),
    ),
    [0, 1, 1, 2, 2, 3],
  );
});
test('Stash is a retrieval move; weak outcomes expose d6 without mutating any item state', () => {
  const result = move([0.99, 0, 0.99], { move: 'stash' });
  assert.equal(result.metadata.followUp?.tableId, 'aitc.stash-weak');
  assert.equal(result.metadata.followUp?.roll, 6);
  assert.equal(CITY_MOVE_DEFAULTS.stash.ability, 'omens');
  assert.equal(CITY_MOVE_DEFAULTS.stash.dr, 10);
  assert.equal(result.sourceRefs.at(-1)?.pdfPage, 8);
});
test('Merchant disposition enumerates 36 equally likely dice pairs, not six uniform bands', () => {
  const counts = [0, 0, 0, 0, 0, 0];
  for (let a = 1; a <= 6; a++)
    for (let b = 1; b <= 6; b++) {
      const result = rollMerchantDisposition(0, seq(die(a, 6), die(b, 6)));
      assert.ok(result.band !== null);
      counts[result.band]++;
    }
  assert.deepEqual(counts, [3, 7, 11, 9, 5, 1]);
});
test('Merchant negative totals remain unresolved; the explicit 12+ band stays valid', () => {
  const below = rollMerchantDisposition(-3, () => 0);
  assert.equal(below.modifiedRoll, -1);
  assert.equal(below.lookupValue, null);
  assert.equal(below.unresolved, true);
  assert.equal(below.band, null);
  assert.equal(below.service, null);
  assert.equal(below.priceMultiplier, null);
  assert.equal(below.description, '원문 범위 밖 — 직접 판단');
  assert.equal(below.sourceRefs[0].roll, -1);
  for (const total of [0, 1, 2, 3]) {
    const firstBand = rollMerchantDisposition(total - 2, () => 0);
    assert.equal(firstBand.unresolved, false);
    assert.equal(firstBand.band, 0);
    assert.equal(firstBand.service, false);
  }
  const above = rollMerchantDisposition(6, () => 0.99);
  assert.equal(above.modifiedRoll, 18);
  assert.equal(above.lookupValue, 12);
  assert.equal(above.unresolved, false);
  assert.equal(above.band, 5);
  assert.equal(above.service, true);
  assert.equal(above.priceMultiplier, 0.75);
  const prices = [4, 6, 8, 10, 12].map(
    (total) => rollMerchantDisposition(total - 2, () => 0).priceMultiplier,
  );
  assert.deepEqual(prices, [2, 1.5, 1, 0.9, 0.75]);
  assert.equal(above.sourceRefs[0].pdfPage, 10);
  assert.equal(above.sourceRefs[0].printedPage, 8);
});
test('All Settlement Size d20 boundaries retain their printed street formulas and limits', () => {
  const rows = [
    [1, 5, 'd2+1', 2, 3],
    [6, 10, 'd4+2', 3, 6],
    [11, 14, 'd8+3', 4, 11],
    [15, 17, 'd12+3', 4, 15],
    [18, 19, 'd20+4', 5, 24],
    [20, 20, 'd20+20', 21, 40],
  ] as const;
  for (const [min, max, dice, least, most] of rows)
    for (let size = min; size <= max; size++) {
      assert.equal(settlementStreetDice(size).dice, dice);
      assert.equal(rollSettlementStreets(size, () => 0).streets, least);
      assert.equal(rollSettlementStreets(size, () => 0.99).streets, most);
    }
  assert.equal(settlementStreetDice(20).sourceRefs[0].pdfPage, 12);
});
test('Micro-crawl is direct d4 streets, never an invented City Crawl Move', () => {
  assert.equal(rollMicroCrawl(() => 0).streets, 1);
  assert.equal(rollMicroCrawl(() => 0.99).streets, 4);
  assert.throws(() => move([0.99, 0.99], { mode: 'micro' }));
});
test('Daily settlement chance is exactly one of eight outcomes', () => {
  const results = Array.from({ length: 8 }, (_, i) =>
    encounterSettlementChance(() => i / 8),
  );
  assert.deepEqual(
    results.map((r) => r.roll),
    [1, 2, 3, 4, 5, 6, 7, 8],
  );
  assert.equal(results.filter((r) => r.discovered).length, 1);
  assert.equal(results[0].sourceRefs[0].pdfPage, 5);
});
test('Procedure numeric inputs reject fractions, non-finite values, and impossible size results', () => {
  for (const n of [NaN, Infinity, 1.5]) {
    assert.throws(() => move([0], { dr: n }));
    assert.throws(() => move([0], { modifier: n }));
    assert.throws(() => rollMerchantDisposition(n));
    assert.throws(() => settlementStreetDice(n));
  }
  for (const n of [0, -1, 21]) assert.throws(() => settlementStreetDice(n));
});
