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

test('Result typography survives appended guidance while notes and translations stay outside it', () => {
  const resultText = 'A synthetic street prompt.';
  const html = renderToStaticMarkup(
    createElement(ReferenceReadingText, {
      text: `${resultText}\n\nResolve this synthetic condition separately.`,
      source: { text: resultText },
      resultText,
    }),
  );
  const paragraphs = html.match(/<p>.*?<\/p>/gs) ?? [];
  assert.equal(paragraphs.length, 2);
  assert.match(
    paragraphs[0],
    /class="reference-result-text"><span>A synthetic street prompt\.<\/span><\/span>/,
  );
  assert.match(paragraphs[0], /시험용 거리 상황/);
  assert.doesNotMatch(paragraphs[1], /reference-result-text/);
  assert.match(paragraphs[1], /시험용 조건은 따로 해결하세요/);
});

test('Long and multiline source results retain their typography without a character threshold', () => {
  const resultText = `${'A long synthetic result. '.repeat(10)}\n\nAnother source paragraph.`;
  const html = renderToStaticMarkup(
    createElement(ReferenceReadingText, {
      text: `${resultText}\n\nSeparate instructions.`,
      resultText,
    }),
  );
  const paragraphs = html.match(/<p>.*?<\/p>/gs) ?? [];
  assert.equal(paragraphs.length, 3);
  assert.match(paragraphs[0], /reference-result-text/);
  assert.match(paragraphs[1], /reference-result-text/);
  assert.doesNotMatch(paragraphs[2], /reference-result-text/);
});

test('A mismatched bilingual helper stays intact without giving appended instructions result styling', () => {
  const html = renderToStaticMarkup(
    createElement(ReferenceReadingText, {
      text: 'Source result.\n\nAdditional instruction.',
      resultText: 'Source result.',
      translation: '원래 제공된 하나의 번역 문단.',
    }),
  );
  assert.equal((html.match(/<p>/g) ?? []).length, 1);
  assert.match(
    html,
    /class="reference-result-text"><span>Source result\.<\/span><\/span><span>\n\nAdditional instruction\.<\/span>/,
  );
  assert.equal((html.match(/원래 제공된 하나의 번역 문단/g) ?? []).length, 1);
});

test('Repeated wording in a note is not mistaken for the preceding result', () => {
  const html = renderToStaticMarkup(
    createElement(ReferenceReadingText, {
      text: 'Repeated text.\n\nRepeated text.',
      resultText: 'Repeated text.',
    }),
  );
  assert.equal((html.match(/reference-result-text/g) ?? []).length, 1);
});

test('Rules and table prose do not opt in to result typography', () => {
  for (const resultText of [undefined, 'A different result.']) {
    const html = renderToStaticMarkup(
      createElement(ReferenceReadingText, {
        text: 'Ordinary reference prose.',
        resultText,
      }),
    );
    assert.doesNotMatch(html, /reference-result-text/);
    assert.match(html, /Ordinary reference prose\./);
  }
});
