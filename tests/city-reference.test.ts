import test from 'node:test';
import assert from 'node:assert/strict';
import { rollCityReference } from '../src/domain/cityReference.ts';
import type { OracleDefinition, OracleRegistry } from '../src/domain/oracle.ts';

const tables: [string, string, number][] = [
  ['aitc.street-adjective', 'd20', 17],
  ['aitc.street-type', 'd12', 17],
  ['aitc.street-contents', 'd12', 17],
  ['aitc.street-exits', 'd4', 17],
  ['aitc.notable-artefact-type', 'd4', 11],
  ['aitc.notable-artefact-concerning', 'd12', 11],
  ['aitc.notable-artefact-composition', 'd12', 11],
  ['aitc.notable-artefact-adjective', 'd12', 11],
  ['aitc.notable-artefact-subject', 'd12', 11],
  ['aitc.sculpture-size', 'd2', 11],
];
// Synthetic entries keep this test suite independent of the private source pack.
const registry = (): OracleRegistry => ({
  books: [{ id: 'aitc', title: 'Test source' }],
  procedures: [{ id: 'aitc.street', title: 'Test street', oracleIds: [] }],
  tables: tables.map(
    ([id, dice, page]): OracleDefinition => ({
      id,
      sourceBookId: 'aitc',
      sourcePage: page,
      printedPage: page - 2,
      title: `Title ${id}`,
      category: 'OTHER',
      dice,
      description: `Condition ${id}`,
      tags: [],
      sourceVerified: true,
      entries: Array.from({ length: Number(dice.slice(1)) }, (_, index) => ({
        id: `${id}:${index + 1}`,
        min: index + 1,
        max: index + 1,
        text: `Private entry ${id}:${index + 1}`,
        metadata: { followUpOracleIds: ['test.follow-up'] },
      })),
    }),
  ),
});
function sequence(...rolls: [number, number][]) {
  let index = 0;
  return () => {
    assert.ok(index < rolls.length, 'Unrequested additional die');
    const [face, sides] = rolls[index++];
    return (face - 1) / sides;
  };
}
const street = (cityOrMetropolis = false, includeExits = false) => ({
  procedureId: 'aitc.street' as const,
  cityOrMetropolis,
  includeExits,
});
const artefact = { procedureId: 'aitc.notable-artefact-type' as const };

test('A smaller settlement rolls one contents table and no quantity or optional exit dice', () => {
  const data = registry();
  const snapshot = JSON.stringify(data);
  const result = rollCityReference(
    street(),
    data,
    sequence([20, 20], [11, 12], [8, 12]),
  );
  assert.deepEqual(
    result.rolls.map((r) => r.roll),
    [20, 11, 8],
  );
  assert.equal(result.title, 'Test street');
  assert.equal(result.rolls[2].metadata?.contentsCount, 1);
  assert.deepEqual(result.rolls[2].metadata?.followUpOracleIds, [
    'test.follow-up',
  ]);
  assert.equal(
    result.rolls[2].metadata?.procedureNote,
    'Condition aitc.street-contents',
  );
  assert.match(result.rolls[2].source, /PDF 17.*p\. 15/);
  assert.equal(JSON.stringify(data), snapshot);
});
test('City quantity d2=1 is visible and does not always generate two contents', () => {
  const result = rollCityReference(
    street(true),
    registry(),
    sequence([1, 20], [2, 12], [1, 2], [6, 12]),
  );
  assert.deepEqual(
    result.rolls.map((r) => r.dice),
    ['d20', 'd12', 'd2', 'd12'],
  );
  assert.equal(result.rolls[2].entryId, null);
  assert.equal(result.rolls[2].metadata?.sourceTableId, 'aitc.street-contents');
  assert.equal(result.rolls[3].roll, 6);
});
test('City quantity d2=2 rolls independent contents and optional exits exactly once', () => {
  const result = rollCityReference(
    street(true, true),
    registry(),
    sequence([2, 20], [12, 12], [2, 2], [3, 12], [9, 12], [4, 4]),
  );
  assert.deepEqual(
    result.rolls.map((r) => r.roll),
    [2, 12, 2, 3, 9, 4],
  );
  assert.deepEqual(
    result.rolls.slice(3, 5).map((r) => r.metadata?.contentsIndex),
    [1, 2],
  );
  assert.match(result.rolls[3].title, /1\/2$/);
  assert.match(result.rolls[4].title, /2\/2$/);
  assert.equal(result.rolls[5].oracleId, 'aitc.street-exits');
});
test('Books and manuscripts use only the concerning branch', () => {
  for (const type of [1, 2]) {
    const data = registry();
    data.tables = data.tables.filter((t) =>
      [
        'aitc.notable-artefact-type',
        'aitc.notable-artefact-concerning',
      ].includes(t.id),
    );
    const result = rollCityReference(
      artefact,
      data,
      sequence([type, 4], [12, 12]),
    );
    assert.deepEqual(
      result.rolls.map((r) => r.oracleId),
      ['aitc.notable-artefact-type', 'aitc.notable-artefact-concerning'],
    );
    assert.equal(
      result.rolls[1].text,
      'Private entry aitc.notable-artefact-concerning:12',
    );
  }
});
test('Picture depiction rolls each of three columns independently without sculpture size', () => {
  const result = rollCityReference(
    artefact,
    registry(),
    sequence([3, 4], [2, 12], [7, 12], [12, 12]),
  );
  assert.deepEqual(
    result.rolls.map((r) => r.roll),
    [3, 2, 7, 12],
  );
  assert.deepEqual(
    result.rolls.slice(1).map((r) => r.oracleId),
    [
      'aitc.notable-artefact-composition',
      'aitc.notable-artefact-adjective',
      'aitc.notable-artefact-subject',
    ],
  );
  assert.match(result.rolls[0].source, /PDF 11.*p\. 9/);
});
test('Sculpture adds a separate size d2 after its independent depiction columns', () => {
  const result = rollCityReference(
    artefact,
    registry(),
    sequence([4, 4], [12, 12], [1, 12], [6, 12], [2, 2]),
  );
  assert.deepEqual(
    result.rolls.map((r) => r.roll),
    [4, 12, 1, 6, 2],
  );
  assert.equal(result.rolls[4].oracleId, 'aitc.sculpture-size');
  assert.equal(
    result.rolls[4].metadata?.procedureNote,
    'Condition aitc.sculpture-size',
  );
});
test('Missing or altered source tables fail instead of inventing a replacement', () => {
  const data = registry();
  data.tables = data.tables.filter((t) => t.id !== 'aitc.street-contents');
  assert.throws(
    () => rollCityReference(street(), data),
    /aitc.street-contents/,
  );
  for (const change of [
    { dice: 'd6' },
    { sourceVerified: false },
    { rollable: false },
    { sourceBookId: 'other' },
  ]) {
    const changed = registry();
    Object.assign(
      changed.tables.find((t) => t.id === 'aitc.notable-artefact-type')!,
      change,
    );
    assert.throws(
      () => rollCityReference(artefact, changed),
      /aitc.notable-artefact-type/,
    );
  }
});
