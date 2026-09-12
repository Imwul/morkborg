import test from 'node:test';
import assert from 'node:assert/strict';
import type { OracleDefinition, OracleRegistry } from '../src/domain/oracle.ts';
import { fixedReferenceReading } from '../src/domain/referenceFixedLookup.ts';
import { rollCityReference } from '../src/domain/cityReference.ts';
function registry(): OracleRegistry {
  return {
    books: [{ id: 'aitc', title: 'Alöne in the Crowd' }],
    procedures: [],
    tables: [
      ['aitc.street-adjective', 20, 17],
      ['aitc.street-type', 12, 17],
      ['aitc.street-contents', 12, 17],
      ['aitc.street-exits', 4, 17],
      ['aitc.settlement-size', 20, 12],
      ['aitc.city-crawl-failure', 4, 7],
    ].map(
      ([id, sides, page]): OracleDefinition => ({
        id: String(id),
        title: String(id),
        sourceBookId: 'aitc',
        sourcePage: Number(page),
        printedPage: Number(page) - 2,
        dice: `d${sides}`,
        category: 'OTHER',
        tags: [],
        sourceVerified: true,
        entries: Array.from({ length: Number(sides) }, (_, index) => ({
          id: `${id}:${index + 1}`,
          min: index + 1,
          max: index + 1,
          text: `${id} result ${index + 1}`,
        })),
      }),
    ),
  };
}

test('a street is independently rollable before, after, or without a city Move', () => {
  const data = registry();
  const before = JSON.stringify(data);
  for (let n = 0; n < 3; n++) {
    const street = rollCityReference(
      { procedureId: 'aitc.street' },
      data,
      () => 0,
    );
    assert.equal(street.rolls.length, 3);
    assert.deepEqual(
      street.rolls.map((r) => r.oracleId),
      ['aitc.street-adjective', 'aitc.street-type', 'aitc.street-contents'],
    );
  }
  assert.equal(JSON.stringify(data), before);
});
test('Fixed source links select the stated row and keep source and follow-up metadata', () => {
  const data = registry();
  data.tables.push({
    id: 'aitc.npc-encounters',
    title: 'NPC Encounters',
    sourceBookId: 'aitc',
    sourcePage: [15, 16],
    printedPage: '13–14',
    dice: 'd66',
    sourceVerified: true,
    category: 'NPC',
    tags: [],
    entries: [
      {
        id: 'guards',
        min: 54,
        max: 54,
        text: 'Guards',
        metadata: { followUpOracleIds: ['core.reaction'] },
      },
      { id: 'other', min: 55, max: 56, text: 'Another encounter' },
    ],
  });
  const reading = fixedReferenceReading(data, {
    oracleId: 'aitc.npc-encounters',
    roll: 54,
  });
  assert.equal(reading.blocks[0].text, 'Guards');
  assert.equal(reading.blocks[0].dice, undefined);
  assert.equal(reading.sourceRefs[0].roll, 54);
  assert.equal(reading.sourceRefs[0].entryId, 'guards');
  assert.deepEqual(reading.sourceRefs[0].pdfPage, [15, 16]);
  assert.deepEqual(reading.relatedIds, ['oracle:core.reaction']);
  assert.throws(
    () =>
      fixedReferenceReading(data, {
        oracleId: 'aitc.npc-encounters',
        roll: 53,
      }),
    /대응하는/,
  );
  assert.throws(
    () => fixedReferenceReading(data, { oracleId: 'missing', roll: 54 }),
    /원문/,
  );
});
