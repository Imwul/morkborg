import test from 'node:test';
import assert from 'node:assert/strict';
import { createCipheriv, createHash, randomBytes } from 'node:crypto';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import {
  readPublishedRulebook,
  handlePublishedRequest,
} from '../server/publishedRulebook.ts';

async function assets(payloadRevision = 123) {
  const root = await mkdtemp(join(tmpdir(), 'mork-published-test-'));
  const key = randomBytes(32).toString('base64');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(key, 'base64'), iv);
  cipher.setAAD(Buffer.from('morkborg-private-update:v1:123'));
  const bundle = {
    kind: 'morkborg-private-data',
    schemaVersion: 1,
    library: { fixture: 'rules' },
    oracles: { fixture: 'oracles' },
    fateChart: { fixture: 'fate' },
    updateConnection: { key },
    publisherKey: key,
  };
  const bytes = Buffer.concat([
    cipher.update(JSON.stringify({ revision: payloadRevision, bundle })),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
  const text = JSON.stringify({
    schemaVersion: 1,
    iv: iv.toString('base64'),
    data: bytes.toString('base64'),
  });
  const file =
    '/private-updates/' +
    createHash('sha256').update(text).digest('hex') +
    '.json';
  await mkdir(join(root, 'public/private-updates'), { recursive: true });
  await writeFile(join(root, 'public', file), text);
  await writeFile(
    join(root, 'public/private-updates/latest.json'),
    JSON.stringify({ schemaVersion: 1, revision: 123, file }),
  );
  return {
    root,
    key,
    file,
    text,
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
}
test('server decrypts the published bundle and omits every connection/key field', async () => {
  const a = await assets();
  try {
    const result = await readPublishedRulebook(a);
    assert.equal(result.revision, 123);
    assert.deepEqual(Object.keys(result.bundle!), [
      'kind',
      'schemaVersion',
      'library',
      'oracles',
      'fateChart',
    ]);
    assert.ok(!JSON.stringify(result).includes(a.key));
    assert.ok(!JSON.stringify(result).includes('updateConnection'));
  } finally {
    await a.cleanup();
  }
});
test('current revision returns metadata without retransmitting the complete bundle', async () => {
  const a = await assets();
  try {
    assert.deepEqual(await readPublishedRulebook(a, 123), {
      schemaVersion: 1,
      revision: 123,
    });
  } finally {
    await a.cleanup();
  }
});
test('missing or incorrect server key rejects before data can be returned', async () => {
  const a = await assets();
  try {
    await assert.rejects(readPublishedRulebook({ root: a.root }));
    await assert.rejects(
      readPublishedRulebook({
        root: a.root,
        key: randomBytes(32).toString('base64'),
      }),
    );
  } finally {
    await a.cleanup();
  }
});
test('revision mismatch, modified asset and unsafe file path are rejected', async () => {
  const wrong = await assets(999);
  try {
    await assert.rejects(readPublishedRulebook(wrong), /revisions/);
  } finally {
    await wrong.cleanup();
  }
  const a = await assets();
  try {
    await writeFile(join(a.root, 'public', a.file), a.text + ' ');
    await assert.rejects(readPublishedRulebook(a), /damaged/);
    await writeFile(
      join(a.root, 'public/private-updates/latest.json'),
      JSON.stringify({
        schemaVersion: 1,
        revision: 123,
        file: '/../outputs/private-update-publisher.json',
      }),
    );
    await assert.rejects(readPublishedRulebook(a));
  } finally {
    await a.cleanup();
  }
});
test('HTTP handler is read-only, sends no-store JSON and hides configuration failures', async () => {
  const a = await assets();
  let configured = true;
  const server = createServer((req, res) => {
    void handlePublishedRequest(req, res, {
      root: a.root,
      key: configured ? a.key : undefined,
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const url = `http://127.0.0.1:${address.port}/api/rulebook-data`;
  try {
    const response = await fetch(url + '?revision=123');
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.deepEqual(await response.json(), {
      schemaVersion: 1,
      revision: 123,
    });
    const post = await fetch(url, { method: 'POST' });
    assert.equal(post.status, 405);
    assert.equal(post.headers.get('allow'), 'GET');
    configured = false;
    const unavailable = await fetch(url);
    assert.equal(unavailable.status, 503);
    const body = await unavailable.text();
    assert.ok(
      !body.includes(a.key) &&
        !body.includes(a.root) &&
        !body.includes('stack'),
    );
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    await a.cleanup();
  }
});
