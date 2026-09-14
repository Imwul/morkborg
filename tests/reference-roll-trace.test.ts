import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReferenceRollTrace } from '../src/components/ReferenceRollTrace.tsx';

test('Emphasized single-die traces preserve their exact readable formula and value', () => {
  for (const text of ['2d6 = 7', 'd66 = 64', 'd20 + Presence = -2']) {
    const html = renderToStaticMarkup(
      createElement(ReferenceRollTrace, { text }),
    );
    assert.equal(html.replace(/<[^>]*>/g, ''), text);
    assert.match(html, /class="roll-expression"/);
    assert.match(html, /class="roll-value"/);
  }
});

test('Compound and unusual traces remain intact without a guessed highlighted value', () => {
  for (const text of [
    'A d12 = 3 · B d12 = 8',
    'A d12 = 3 · B d12 = 8 · HP d4 = 2 × 3',
    'd6 × d8 = 2 × 4',
    'Reference only',
  ]) {
    const html = renderToStaticMarkup(
      createElement(ReferenceRollTrace, { text }),
    );
    assert.equal(html.replace(/<[^>]*>/g, ''), text);
    assert.doesNotMatch(html, /class="roll-value"/);
  }
});
