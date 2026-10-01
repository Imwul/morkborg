import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  generatorResultSource,
  pendingGeneratorSource,
} from '../src/domain/generatorSourceDisplay.ts';
import type { ReferenceReading } from '../src/domain/referenceReading.ts';
import { GeneratorSourceControl } from '../src/components/GeneratorSourceControl.tsx';

const result = (data: Partial<ReferenceReading> = {}): ReferenceReading => ({
  title: 'Result',
  blocks: [{ title: 'Appearance', text: 'Existing result' }],
  sourceRefs: [],
  ...data,
});
test('source display identifies the existing generator result, including character homebrew', () => {
  assert.equal(
    generatorResultSource(
      'monster',
      result({ procedureInputs: { generator: 'monster-site' } }),
    ),
    'site',
  );
  assert.equal(
    generatorResultSource(
      'monster',
      result({
        sourceRefs: [
          { bookId: 'feretory', tableTitle: 'Eat Prey Kill · sarkash' },
        ],
      }),
    ),
    'epk',
  );
  assert.equal(
    generatorResultSource(
      'monster',
      result({
        sourceRefs: [
          { bookId: 'feretory', tableTitle: 'The Monster Approaches' },
        ],
      }),
    ),
    'book',
  );
  assert.equal(
    generatorResultSource(
      'character',
      result({ procedureInputs: { generator: 'scvmbirther' } }),
    ),
    'scvm',
  );
  assert.equal(
    generatorResultSource(
      'character',
      result({ procedureInputs: { generator: 'scvmbirther', homebrew: true } }),
    ),
    'scvm-homebrew',
  );
  assert.equal(
    generatorResultSource(
      'character',
      result({ sourceRefs: [{ bookId: 'core' }] }),
    ),
    'core',
  );
  assert.equal(
    generatorResultSource('monster', result({ blocks: [] })),
    undefined,
  );
  assert.equal(generatorResultSource('monster', result()), undefined);
});
test('pending source is explicit only while an existing result differs from the next roll', () => {
  assert.equal(
    pendingGeneratorSource('site', 'book'),
    '현재 결과: 사이트 · 다음 굴림부터 적용: FERETORY',
  );
  assert.equal(pendingGeneratorSource('book', 'book'), undefined);
  assert.equal(pendingGeneratorSource(undefined, 'site'), undefined);
  assert.match(pendingGeneratorSource('scvm', 'scvm-homebrew')!, /homebrew/);
  const markup = renderToStaticMarkup(
    createElement(GeneratorSourceControl, {
      current: 'site',
      next: 'book',
      children: 'Source selector',
      description: 'Existing site attribution',
    }),
  );
  assert.match(markup, /현재 결과: 사이트 · 다음 굴림부터 적용: FERETORY/);
  assert.match(
    markup,
    /<details[^>]*><summary>안내<\/summary><div>Existing site attribution/,
  );
  assert.doesNotMatch(markup, /<details[^>]*\bopen/);
});
