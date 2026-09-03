import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SourceDisclosure } from '../src/components/SourceDisclosure.tsx';
import { CompactCard } from '../src/components/CompactCard.tsx';

test('Shared source disclosure starts closed and retains book, table and printed/PDF page detail', () => {
  const html = renderToStaticMarkup(
    createElement(SourceDisclosure, {
      refs: [
        {
          bookTitle: 'Source book',
          tableTitle: 'Table',
          pdfPage: 19,
          printedPage: 17,
          roll: 15,
        },
      ],
    }),
  );
  assert.match(html, /<details class="sheet-source source-disclosure">/);
  assert.doesNotMatch(html, /<details[^>]*\sopen/);
  assert.match(html, /<summary>출처<\/summary>/);
  assert.match(html, /Source book/);
  assert.match(html, /PDF 19쪽 \/ p. 17/);
  assert.match(html, /굴림 15/);
});
test('Compact card renders one detail entry with short secondary/metadata and a closed action menu', () => {
  const html = renderToStaticMarkup(
    createElement(CompactCard, {
      title: 'Varg',
      secondary: 'Gravedigger',
      metadata: 'Room 2',
      onOpen: () => {},
      actions: [
        { label: '복제', onSelect: () => {} },
        { label: '삭제', onSelect: () => {}, danger: true },
      ],
    }),
  );
  assert.match(html, /class="compact-card-main"/);
  assert.match(html, /class="compact-secondary">Gravedigger/);
  assert.match(html, /class="compact-metadata">Room 2/);
  assert.match(html, /<details class="compact-overflow">/);
  assert.doesNotMatch(html, /<details[^>]*\sopen/);
  assert.doesNotMatch(html, /translation|source-disclosure|textarea/);
  assert.equal((html.match(/<button/g) ?? []).length, 3);
});
test('Empty source metadata produces no disclosure or blank source card', () => {
  assert.equal(renderToStaticMarkup(createElement(SourceDisclosure, {})), '');
});
