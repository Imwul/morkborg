import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { objectShelfStore } from '../src/storage/notebookTools.ts';

test('a damaged shelf blocks edits and retains the exact stored bytes and older records', () => {
  const originalDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    'localStorage',
  );
  const damaged = '{invalid shelf bytes';
  const records = new Map([
    ['morkborg-object-shelf:v1', damaged],
    ['morkborg-codex:v6', 'untouched legacy campaign'],
  ]);
  let writes = 0;
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => records.get(key) ?? null,
      setItem: (key: string, value: string) => {
        writes++;
        records.set(key, value);
      },
    },
  });
  let observed: ReturnType<typeof objectShelfStore.use> | undefined;
  function ReadShelf() {
    observed = objectShelfStore.use();
    return null;
  }
  try {
    renderToString(createElement(ReadShelf));
    let called = false;
    assert.throws(
      () =>
        observed!.update((shelf) => {
          called = true;
          return shelf;
        }),
      /원본은 보존/,
    );
    renderToString(createElement(ReadShelf));
    assert.match(observed!.error, /저장된 자료를 읽지 못했습니다/);
    assert.equal(called, false);
    assert.equal(writes, 0);
    assert.equal(records.get('morkborg-object-shelf:v1'), damaged);
    assert.equal(records.get('morkborg-codex:v6'), 'untouched legacy campaign');
  } finally {
    if (originalDescriptor)
      Object.defineProperty(globalThis, 'localStorage', originalDescriptor);
    else Reflect.deleteProperty(globalThis, 'localStorage');
  }
});
