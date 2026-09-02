import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { loadRules, setRules, getRules } from '../src/storage/rulesStore.ts';
test(
  'loading coalesces requests and a failed fetch cannot erase a successful import',
  { skip: !existsSync('public/rules/library.json') },
  async () => {
    const originalFetch = globalThis.fetch;
    let calls = 0;
    let rejectFetch!: (reason: Error) => void;
    globalThis.fetch = () => {
      calls++;
      return new Promise<Response>((_resolve, reject) => {
        rejectFetch = reject;
      });
    };
    try {
      const first = loadRules();
      const second = loadRules();
      assert.equal(first, second);
      assert.equal(calls, 1);
      setRules(JSON.parse(readFileSync('public/rules/library.json', 'utf8')));
      const imported = getRules();
      rejectFetch(new Error('temporary failure'));
      await first;
      assert.equal(getRules(), imported);
      await loadRules();
      assert.equal(calls, 1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  },
);
