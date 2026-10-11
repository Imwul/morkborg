import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildReferenceRegistry,
  type ReferenceEntry,
} from '../src/domain/references.ts';
import { rowResultRelationships } from '../src/domain/resultRelationships.ts';
import type { OracleRegistry } from '../src/domain/oracle.ts';
import { ruleFaithfulResult } from '../src/generators/ruleFaithfulReferences.ts';

function entry(id: string, kind: ReferenceEntry['kind']): ReferenceEntry {
  return {
    id,
    kind,
    title: id,
    summary: '',
    keywords: [],
    contexts: [],
    regionIds: [],
    sourceRefs: [{ bookId: 'qa' }],
    sourceChain: [],
    relatedIds: [],
    canonicalIds: [],
    available: true,
    action: null,
  };
}

describe('Full-site QA reference regressions', () => {
  it('includes late supplied source references in the book summary and related list', () => {
    const registry: OracleRegistry = {
      books: [{ id: 'qa', title: 'QA source' }],
      tables: [],
      procedures: [],
    };
    const supplied = entry('rule:qa.supplied', 'rule');
    const index = buildReferenceRegistry(registry, null, [supplied]);
    assert.equal(index.byId['book:qa'].summary, 'RULE 1');
    assert.deepEqual(index.byId['book:qa'].relatedIds, [supplied.id]);
  });

  it('does not turn a street quantity roll into a recursive follow-up, while keeping a real row link', () => {
    const target = entry('procedure:aitc.street', 'procedure');
    const byId = { [target.id]: target };
    const registry: OracleRegistry = { books: [], tables: [], procedures: [] };
    assert.deepEqual(
      rowResultRelationships(byId, registry, {
        oracleId: 'aitc.street.contents-count',
        entryId: null,
        metadata: { conditionalCount: true, procedureId: 'aitc.street' },
      }),
      [],
    );
    const links = rowResultRelationships(byId, registry, {
      oracleId: 'qa.real-row',
      entryId: 'qa.real-row:1',
      metadata: { followUp: { procedure: 'aitc.street' } },
    });
    assert.equal(links.length, 1);
    assert.equal(links[0].targetId, target.id);
  });

  it('rejects invalid active Orakle threat ratings before consuming dice and permits the app input boundaries', () => {
    const procedure = {
      id: 'qa.orakle',
      title: 'QA',
      oracleIds: ['depths.orakle'],
    };
    const registry: OracleRegistry = {
      books: [{ id: 'qa', title: 'QA' }],
      procedures: [procedure],
      tables: [
        {
          id: 'depths.orakle',
          sourceBookId: 'qa',
          sourcePage: 1,
          title: 'QA',
          category: 'SOLO',
          dice: 'd20',
          tags: [],
          sourceVerified: true,
          entries: [{ id: 'qa.answer', min: 1, max: 20, text: 'QA answer' }],
        },
      ],
    };
    let calls = 0;
    const rng = () => {
      calls++;
      return 0.99;
    };
    for (const threat of [-1, 2, 3.5, 31, NaN, Infinity]) {
      assert.throws(
        () =>
          ruleFaithfulResult(
            procedure,
            registry,
            { orakleDR: true, orakleTR: threat },
            rng,
          ),
        /3–30/,
      );
    }
    assert.equal(calls, 0);
    for (const [threat, dr] of [
      [3, 11],
      [30, 18],
    ]) {
      const reading = ruleFaithfulResult(
        procedure,
        registry,
        { orakleDR: true, orakleTR: threat },
        rng,
      )!;
      assert.match(reading.rolls[0].text, new RegExp(`Challenge DR ${dr} `));
    }
    const disabled = ruleFaithfulResult(
      procedure,
      registry,
      { orakleDR: false, orakleTR: 2 },
      rng,
    )!;
    assert.doesNotMatch(disabled.rolls[0].text, /Challenge DR/);
    assert.equal(calls, 3);
  });
});
