import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReferenceReadingText } from '../src/components/ReferenceReadingText.tsx';
import { setOraclePack } from '../src/storage/oracleStore.ts';

setOraclePack({
  schemaVersion: 1,
  books: [],
  procedures: [],
  tables: [
    {
      id: 'test.street',
      sourceBookId: 'test',
      sourcePage: 1,
      title: 'Test street',
      dice: 'd2',
      category: 'OTHER',
      tags: [],
      sourceVerified: true,
      entries: [
        {
          id: 'prompt',
          min: 1,
          max: 1,
          text: 'A synthetic street prompt.',
          metadata: { ko: '시험용 거리 상황.' },
        },
        {
          id: 'condition',
          min: 2,
          max: 2,
          text: 'Resolve this synthetic condition separately.',
          metadata: { ko: '시험용 조건은 따로 해결하세요.' },
        },
      ],
    },
  ],
});

test('Inline reading translates prompts and conditional guidance as separate paragraphs', () => {
  const html = renderToStaticMarkup(
    createElement(ReferenceReadingText, {
      text: 'A synthetic street prompt.\n\nResolve this synthetic condition separately.',
    }),
  );
  assert.match(html, /A synthetic street prompt\./);
  assert.match(html, /시험용 거리 상황\./);
  assert.match(html, /Resolve this synthetic condition separately\./);
  assert.match(html, /시험용 조건은 따로 해결하세요\./);
  assert.equal((html.match(/lang="ko"/g) ?? []).length, 2);
});

test('Row translation wins over a shared phrase and survives appended Korean guidance', () => {
  const html = renderToStaticMarkup(
    createElement(ReferenceReadingText, {
      text: 'A synthetic street prompt.\n\n이 결과의 조건을 확인하세요.',
      source: {
        text: 'A synthetic street prompt.',
        metadata: { ko: '이 표에 맞는 거리 상황.' },
      },
    }),
  );
  assert.match(html, /이 표에 맞는 거리 상황\./);
  assert.doesNotMatch(html, /시험용 거리 상황\./);
  assert.equal((html.match(/이 결과의 조건을 확인하세요\./g) ?? []).length, 1);
  assert.equal((html.match(/lang="ko"/g) ?? []).length, 1);
});

test('Untranslated notes cannot suppress a translated result or create a false translation', () => {
  const html = renderToStaticMarkup(
    createElement(ReferenceReadingText, {
      text: 'A synthetic street prompt.\n\nAn unknown sentence about Attack.',
    }),
  );
  assert.match(html, /시험용 거리 상황\./);
  assert.match(html, /An unknown sentence about Attack\./);
  assert.equal((html.match(/lang="ko"/g) ?? []).length, 1);
});
