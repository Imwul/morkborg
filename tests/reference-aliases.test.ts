import test from 'node:test';
import assert from 'node:assert/strict';
import { findVerifiedReferenceAlias } from '../src/domain/referenceAliases.ts';

const query = {
  tableId: 'synthetic.region.monsters',
  name: 'Example Creature',
  printedCrossReference: 'Example Appendix p. III',
};
const alias = {
  ...query,
  bookId: 'example-appendix',
  printedPage: 'III',
  sourceVerified: true,
  note: 'Audited within the supplied compiled edition.',
  category: 'exact-source',
};
test('An exact audited appendix alias resolves across books without parsing Roman pages as decimal', () => {
  const candidate = { book: 'compiled-edition', referenceAliases: [alias] };
  assert.equal(findVerifiedReferenceAlias(candidate, query), alias);
  assert.equal(
    findVerifiedReferenceAlias(candidate, { ...query, printedPage: 'III' }),
    alias,
  );
  assert.equal(
    findVerifiedReferenceAlias(candidate, { ...query, printedPage: 3 }),
    undefined,
  );
});
test('A source-citation correction retains its original book while identifying a different target', () => {
  const corrected = {
    ...alias,
    bookId: 'printed-book',
    printedPage: 23,
    printedCrossReference: 'Printed Book p. 23',
    category: 'citation-typo',
    evidence: [
      {
        bookId: 'actual-book',
        pdfPage: 25,
        printedPage: 23,
        note: 'Verified target.',
      },
    ],
  };
  const candidate = { book: 'actual-book', referenceAliases: [corrected] };
  const lookup = {
    ...query,
    bookId: 'printed-book',
    printedPage: 23,
    printedCrossReference: 'Printed Book p. 23',
  };
  assert.equal(findVerifiedReferenceAlias(candidate, lookup), corrected);
  assert.equal(
    findVerifiedReferenceAlias(candidate, { ...lookup, bookId: 'other-book' }),
    undefined,
  );
});
test('Similar names, other regional rows, and changed citation text never authorize a match', () => {
  const candidate = { referenceAliases: [alias] };
  for (const patch of [
    { name: 'Example Creatures' },
    { name: 'example creature' },
    { tableId: 'synthetic.other.monsters' },
    { printedCrossReference: 'Example Appendix p. II' },
    { printedCrossReference: '' },
  ])
    assert.equal(
      findVerifiedReferenceAlias(candidate, { ...query, ...patch }),
      undefined,
    );
});
test('Unverified, ambiguous, or undocumented aliases remain unresolved', () => {
  for (const aliases of [
    [],
    [null],
    [{ ...alias, sourceVerified: false }],
    [{ ...alias, note: '' }],
    [alias, alias],
  ])
    assert.equal(
      findVerifiedReferenceAlias({ referenceAliases: aliases }, query),
      undefined,
    );
  assert.equal(
    findVerifiedReferenceAlias({ name: query.name, printedPage: 'III' }, query),
    undefined,
  );
});
test('Existing audited edition aliases remain usable without a new category field', () => {
  const legacy = { ...alias };
  delete (legacy as { category?: string }).category;
  const candidate = { book: 'same-book', referenceAliases: [legacy] };
  const snapshot = JSON.stringify(candidate);
  assert.equal(findVerifiedReferenceAlias(candidate, query), legacy);
  assert.equal(JSON.stringify(candidate), snapshot);
});
