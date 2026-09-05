import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  buildReferenceRegistry,
  searchReferences,
  relatedReferences,
} from '../src/domain/references.ts';
import { referenceAction } from '../src/domain/referenceActions.ts';
import { executeReference } from '../src/domain/referenceExecution.ts';
import {
  emptyReferenceSession,
  retainReferenceReading,
  restoreReferenceRoll,
} from '../src/domain/referenceSession.ts';
import {
  sourceEvidence,
  SOURCE_STATUS,
} from '../src/domain/referenceSources.ts';
import {
  copyReferenceReading,
  type ReferenceReading,
} from '../src/domain/referenceReading.ts';
import { SourceDisclosure } from '../src/components/SourceDisclosure.tsx';
import {
  readReferencePreferences,
  writeReferencePreferences,
  toggleReferencePin,
  recentlyUsed,
} from '../src/storage/referencePreferences.ts';
import type { OracleRegistry } from '../src/domain/oracle.ts';

const registry: OracleRegistry = {
  books: [{ id: 'core', title: 'Example source' }],
  procedures: [],
  tables: [
    {
      id: 'core.reaction',
      title: 'Reaction',
      category: 'OTHER',
      tags: [],
      sourceBookId: 'core',
      sourcePage: 4,
      printedPage: 2,
      sourceVerified: true,
      dice: 'd6',
      entries: [{ id: 'answer', min: 1, max: 6, text: 'Example answer' }],
    },
  ],
};
const index = buildReferenceRegistry(registry);
const options = {
  registry,
  rules: null,
  region: 'sarkash' as const,
  stockKind: 'common' as const,
  stockDR: 10,
  cityLarge: false,
  cityExits: true,
};
const reading: ReferenceReading = {
  title: 'Result',
  blocks: [{ title: 'Result', text: 'An answer' }],
  sourceRefs: [{ bookTitle: 'Example source', pdfPage: 4, printedPage: 2 }],
};

test('Direct search ROLL executes the first playable canonical result without campaign context', () => {
  const before = JSON.stringify(registry);
  const entry = searchReferences(index, 'reaction')[0];
  assert.equal(entry.id, 'oracle:core.reaction');
  assert.deepEqual(referenceAction(entry), { label: 'ROLL', immediate: true });
  const result = executeReference(entry, options)!;
  assert.equal(result.blocks[0].text, 'Example answer');
  assert.equal(result.sourceRefs[0].pdfPage, 4);
  assert.equal(JSON.stringify(registry), before);
});
test('Direct pinned ROLL survives preference round-trip and uses the same executor', () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  const prefs = toggleReferencePin(
    readReferencePreferences(storage),
    'oracle:core.reaction',
  );
  writeReferencePreferences(prefs, storage);
  const loaded = readReferencePreferences(storage);
  const entry = index.byId[loaded.pinnedIds[0]];
  assert.equal(referenceAction(entry).immediate, true);
  assert.equal(
    executeReference(entry, options)?.blocks[0].text,
    'Example answer',
  );
});
test('Rule inspection never rolls while procedural choices remain explicit', () => {
  const rule = index.byId['rule:core.broken'];
  assert.deepEqual(referenceAction(rule), { label: 'OPEN', immediate: false });
  assert.equal(executeReference(rule, options), undefined);
  const stock = {
    ...index.byId['procedure:workbench.stock-room'],
    action: { kind: 'procedure' as const, procedureId: 'workbench.stock-room' },
  };
  assert.equal(referenceAction({ ...stock, available: true }).immediate, false);
  assert.equal(referenceAction({ ...stock, available: true }).label, 'RUN');
  assert.equal(
    referenceAction({ ...index.byId['oracle:core.reaction'], available: false })
      .immediate,
    false,
  );
});
test('Recent results retain six snapshots including repeated rolls, with twenty reading cache entries', () => {
  let state = emptyReferenceSession();
  for (let n = 0; n < 30; n++)
    state = retainReferenceReading(state, `table:${n}`, {
      ...reading,
      title: `Result ${n}`,
    });
  assert.equal(state.rolls.length, 6);
  assert.equal(Object.keys(state.readings).length, 20);
  assert.equal(state.rolls[0].reading.title, 'Result 29');
  state = retainReferenceReading(state, 'table:29', {
    ...reading,
    title: 'Again',
  });
  assert.deepEqual(
    state.rolls.slice(0, 2).map((item) => item.referenceId),
    ['table:29', 'table:29'],
  );
});
test('Restoring a prior result preserves its answer and does not reroll or grow recent history', () => {
  let state = retainReferenceReading(
    emptyReferenceSession(),
    'oracle:core.reaction',
    reading,
  );
  const first = state.rolls[0].sequence;
  state = retainReferenceReading(state, 'oracle:core.reaction', {
    ...reading,
    title: 'Later',
  });
  const restored = restoreReferenceRoll(state, first);
  assert.deepEqual(restored.readings['oracle:core.reaction'], reading);
  assert.deepEqual(restored.rolls, state.rolls);
  assert.equal(restoreReferenceRoll(state, -1), state);
});
test('Reference recents are bounded independently from transient result history', () => {
  const storage = { getItem: () => null, setItem: () => {} };
  let prefs = readReferencePreferences(storage);
  for (let n = 0; n < 20; n++) prefs = recentlyUsed(prefs, `table:${n}`);
  assert.equal(prefs.recentIds.length, 10);
  prefs = recentlyUsed(prefs, 'table:15');
  assert.equal(prefs.recentIds[0], 'table:15');
  assert.equal(prefs.recentIds.filter((id) => id === 'table:15').length, 1);
  assert(!('rolls' in prefs));
});
test('Source confidence distinguishes verified pages, partial references and unavailable packs', () => {
  assert.equal(sourceEvidence([{ pdfPage: 4 }])[0].confidence, 'verified');
  assert.equal(
    sourceEvidence([{ bookTitle: 'Example' }])[0].confidence,
    'partial',
  );
  assert.equal(
    sourceEvidence([{ pdfPage: 4 }], false)[0].confidence,
    'unavailable-source',
  );
  assert.equal(Object.keys(SOURCE_STATUS).length, 4);
});
test('Source disclosure keeps primary and conflicting routing evidence distinct and closed', () => {
  const html = renderToStaticMarkup(
    createElement(SourceDisclosure, {
      evidence: [
        {
          source: {
            bookTitle: 'Actual source',
            pdfPage: 79,
            printedPage: 'III',
          },
          role: 'primary',
          confidence: 'verified',
        },
        {
          source: {
            bookTitle: 'Routing source',
            pdfPage: 27,
            printedPage: 24,
            note: 'Original conflicting citation retained',
          },
          role: 'routing',
          confidence: 'conflicting-citation',
        },
      ],
    }),
  );
  assert.match(html, /PRIMARY/);
  assert.match(html, /ROUTED BY/);
  assert.match(html, /conflicting-citation/);
  assert.match(html, /III/);
  assert.match(html, /Original conflicting citation retained/);
  assert.doesNotMatch(html, /<details[^>]*\sopen/);
});
test('Copy avoids duplicated headings and adds source metadata only when requested', () => {
  assert.equal(copyReferenceReading(reading), 'Result\n\nAn answer');
  assert.doesNotMatch(
    copyReferenceReading(reading),
    /PDF|Example source|table:/,
  );
  assert.match(
    copyReferenceReading(reading, true),
    /Example source.*PDF 4.*인쇄 p. 2/,
  );
  const rule = {
    ...reading,
    title: 'Rule',
    blocks: [{ title: '', text: 'Roll d20 against DR12.' }],
  };
  assert.equal(copyReferenceReading(rule), 'Rule\n\nRoll d20 against DR12.');
});
test('Reaction prioritizes its actual morale follow-up rather than broad contextual generators', () => {
  const related = relatedReferences(index, 'oracle:core.reaction');
  assert.equal(related[0].id, 'rule:core.reaction-morale');
  assert(
    !related.some((entry) => entry.id === 'rule:feretory.monster-approaches'),
  );
});

test('Replacing a private pack hides unavailable recent rows without losing other snapshots', async () => {
  const { availableRecentRolls } =
    await import('../src/domain/referenceSession.ts');
  let session = retainReferenceReading(
    emptyReferenceSession(),
    'removed',
    reading,
  );
  session = retainReferenceReading(session, 'retained', reading);
  assert.deepEqual(
    availableRecentRolls(session, { retained: {} }).map(
      (item) => item.referenceId,
    ),
    ['retained'],
  );
  assert.equal(session.rolls.length, 2);
});
test('Returning to a region or its regional generator restores the bound region', async () => {
  const { referenceRegion } = await import('../src/domain/referenceActions.ts');
  assert.equal(
    referenceRegion(index.byId['region:sarkash'], 'kergus'),
    'sarkash',
  );
  assert.equal(
    referenceRegion(
      {
        ...index.byId['region:sarkash'],
        action: { kind: 'regional-monster', region: 'sarkash' },
      },
      'kergus',
    ),
    'sarkash',
  );
  assert.equal(
    referenceRegion(index.byId['oracle:core.reaction'], 'kergus'),
    'kergus',
  );
});
test('Resolved regional copy can omit a routing citation while retaining quantity and actual stats', () => {
  const result: ReferenceReading = {
    ...reading,
    blocks: [
      { title: 'Regional source', text: 'Creature (Routing Book p. III)' },
      { title: 'Creature', text: 'HP 8' },
    ],
    copyContent: {
      title: 'Creature × 2',
      blocks: [{ title: '', text: 'HP 8' }],
    },
  };
  assert.equal(copyReferenceReading(result), 'Creature × 2\n\nHP 8');
  assert.match(copyReferenceReading(result, true), /Example source.*PDF 4/);
});

test('Broken search opens its quick rule ahead of the similarly named dice tables', () => {
  const result = searchReferences(
    buildReferenceRegistry({
      ...registry,
      tables: [
        ...registry.tables,
        { ...registry.tables[0], id: 'core.broken', title: 'Broken' },
      ],
    }),
    'broken',
  )[0];
  assert.equal(result.id, 'rule:core.broken');
  assert.equal(referenceAction(result).label, 'OPEN');
});
test('Documented regional Common stocking follows the same source route and quantity without a second creature roll', () => {
  let rolls = 0;
  const regionalRegistry: OracleRegistry = {
    ...registry,
    books: [
      ...registry.books,
      { id: 'depths', title: 'Routing book' },
      { id: 'heretic', title: 'Actual book' },
    ],
    tables: [
      ...registry.tables,
      {
        ...registry.tables[0],
        id: 'depths.region.sarkash.monsters',
        title: 'Regional monsters',
        sourceBookId: 'depths',
        sourcePage: 27,
        printedPage: 24,
        entries: [
          {
            id: 'regional-1',
            min: 1,
            max: 6,
            text: 'Example creature',
            metadata: {
              name: 'Example creature',
              quantityDice: 'd2',
              printedCrossReference: 'Heretic p. 21',
            },
          },
        ],
      },
    ],
  };
  const rules = {
    schemaVersion: 1,
    books: [],
    tables: {},
    creatures: [
      {
        name: 'Example creature',
        book: 'heretic',
        hp: 8,
        morale: 9,
        pdfPage: 23,
        printedPage: 21,
      },
    ],
    outcasts: [],
    notes: [],
  };
  const stock = {
    ...index.byId['procedure:workbench.stock-room'],
    available: true,
    action: { kind: 'procedure' as const, procedureId: 'workbench.stock-room' },
  };
  const result = executeReference(stock, {
    ...options,
    registry: regionalRegistry,
    rules,
    rng: () => {
      rolls++;
      return 0;
    },
  })!;
  assert.equal(rolls, 2); // one regional d6, one row-defined quantity d2
  assert.match(result.copyContent!.title, /× 1/);
  assert.match(result.blocks[1].text, /HP 8/);
  assert.equal(result.evidence?.[0].source.pdfPage, 23);
  assert.equal(result.evidence?.[0].role, 'primary');
  assert.equal(result.evidence?.[1].source.pdfPage, 27);
  assert.equal(result.evidence?.[1].role, 'routing');
});
