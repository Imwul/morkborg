import test from 'node:test';
import assert from 'node:assert/strict';
import { createPublishedRuntime } from '../src/storage/publishedDataRuntime.ts';

test('Concurrent startup chunk failure is handled and explicit Retry loads a fresh client', async () => {
  let loads = 0, failures = 0;
  const checks: boolean[] = [];
  const client = {check: async (force = false) => { checks.push(force); }};
  let rejectFirst!: (error: Error) => void;
  const first = new Promise<typeof client>((_resolve, reject) => {rejectFirst = reject;});
  const run = createPublishedRuntime(() => ++loads === 1 ? first : Promise.resolve(client), () => {failures++;});
  const startup = run(ready => ready.check());
  const loader = run(ready => ready.check());
  await Promise.resolve();
  assert.equal(loads, 1);
  rejectFirst(new Error('Synthetic transient chunk failure'));
  await Promise.all([startup, loader]);
  assert.equal(failures, 2);
  assert.deepEqual(checks, []);
  await run(ready => ready.check(true));
  assert.equal(loads, 2);
  assert.deepEqual(checks, [true]);
  await run(ready => ready.check());
  assert.equal(loads, 2);
  assert.deepEqual(checks, [true, false]);
});

test('Fire-and-forget startup, online and import work never leave a rejected promise', async () => {
  const errors: unknown[] = [];
  const onUnhandled = (error: unknown) => {errors.push(error);};
  process.on('unhandledRejection', onUnhandled);
  let reported = 0;
  try {
    const run = createPublishedRuntime(async () => {throw new Error('Synthetic unavailable chunk');}, () => {reported++;});
    void run(async () => {assert.fail('A failed loader cannot run a task');});
    await new Promise(resolve => setImmediate(resolve));
    void run(async () => {assert.fail('A failed loader cannot run a task');});
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(reported, 2);
    assert.deepEqual(errors, []);
    const ready = createPublishedRuntime(async () => ({}), () => {reported++;});
    await ready(async () => {throw new Error('Synthetic background import failure');});
    assert.equal(reported, 3);
  } finally {
    process.off('unhandledRejection', onUnhandled);
  }
});
