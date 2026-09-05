import test from 'node:test';
import assert from 'node:assert/strict';
import {
  copyReferenceReading,
  oracleReadingText,
  oraclePrintedRange,
  oracleFollowUpLinks,
} from '../src/domain/referenceReading.ts';

test('Source conditions remain beside an artefact effect and survive both copy formats', () => {
  const text = oracleReadingText({
    text: 'Synthetic effect +2',
    metadata: {
      effectRule: 'Consume the fictional medium before applying this effect.',
      procedureNote: 'The effect ends if the fictional object is lost.',
      conditional: 'Only this selected branch.',
    },
  });
  const reading = {
    title: 'Test reading',
    blocks: [{ title: 'Effect', text }],
    sourceRefs: [{ bookId: 'test', pdfPage: 11, printedPage: 9 }],
  };
  for (const withSource of [false, true]) {
    const copied = copyReferenceReading(reading, withSource);
    assert.match(copied, /Synthetic effect \+2/);
    assert.match(copied, /Consume the fictional medium/);
    assert.match(copied, /effect ends/);
    assert.match(copied, /Only this selected branch/);
  }
  assert.match(copyReferenceReading(reading, true), /PDF 11.*p\. 9/);
});
test('Metadata text avoids duplicate conditions and ignores structured navigation data', () => {
  assert.equal(
    oracleReadingText({
      text: 'Existing condition.',
      metadata: {
        condition: 'Existing condition.',
        effectRule: 'Additional condition.',
        procedureNote: 'Additional condition.',
        followUpOracleIds: ['test.next'],
      },
    }),
    'Existing condition.\n\nAdditional condition.',
  );
});
test('Static source ranges preserve explicit open upper bands instead of displaying a single result', () => {
  const row = { id: 'row', min: 12, max: 12, text: 'Test band' };
  assert.equal(
    oraclePrintedRange({ ...row, metadata: { originalRange: '12+' } }),
    '12+',
  );
  assert.equal(
    oraclePrintedRange({
      ...row,
      metadata: { openEnded: true, comparison: '>=' },
    }),
    '12+',
  );
  assert.equal(oraclePrintedRange({ ...row, min: 0, max: 3 }), '0–3');
  assert.equal(oraclePrintedRange(row), '12');
});
test('Move and fixed-lookup readings expose the selected result’s follow-up table, not an automatic reroll', () => {
  const next = oracleFollowUpLinks({
    followUpOracleIds: [
      'core.arcaneCatastrophes',
      'core.arcaneCatastrophes',
      4,
    ],
    fixedLookups: [
      { oracleId: 'aitc.npc-encounters', roll: 54 },
      { oracleId: 'bad', roll: 1.5 },
      null,
    ],
  });
  assert.deepEqual(next.relatedIds, ['oracle:core.arcaneCatastrophes']);
  assert.deepEqual(next.fixedLookups, [
    { oracleId: 'aitc.npc-encounters', roll: 54 },
  ]);
  assert.deepEqual(oracleFollowUpLinks(), { relatedIds: [], fixedLookups: [] });
});
