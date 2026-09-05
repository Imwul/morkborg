import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import { checkPublicBuild } from '../scripts/check-public-build.mjs';
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'mork-public-boundary-'));
  writeFileSync(join(root, 'index.html'), '<div id="root"></div>');
  return {
    root,
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}
test('privacy check fails closed when the production build is missing', () => {
  assert.throws(
    () => checkPublicBuild('nonexistent-fixture-directory'),
    /missing/,
  );
});
test('privacy boundary rejects renamed packs, secret bytes, excerpts and local paths', () => {
  const secret = randomBytes(32).toString('base64');
  const excerpt =
    'Synthetic private fixture sentence for a source excerpt boundary test; never publish this table result.';
  for (const [name, content, options] of [
    [
      'random.json',
      JSON.stringify({ kind: 'morkborg-private-data', library: {} }),
      {},
    ],
    [
      'asset.js',
      `export const value = ${JSON.stringify(secret)};`,
      { keys: [secret] },
    ],
    [
      'asset.js',
      `const text = ${JSON.stringify(excerpt)};`,
      { sourceSamples: [excerpt] },
    ],
    ['asset.js', 'const path = "/Users/synthetic/private-book.pdf";', {}],
    ['.env.production', 'SYNTHETIC=1', {}],
  ] as const) {
    const f = fixture();
    try {
      writeFileSync(join(f.root, name), content);
      assert.throws(() => checkPublicBuild(f.root, options));
    } finally {
      f.cleanup();
    }
  }
});
test('ciphertext and its matching manifest pass without embedding private plaintext or keys', () => {
  const f = fixture();
  try {
    mkdirSync(join(f.root, 'private-updates'));
    const text = JSON.stringify({
      schemaVersion: 1,
      iv: randomBytes(12).toString('base64'),
      data: randomBytes(64).toString('base64'),
    });
    const file = createHash('sha256').update(text).digest('hex') + '.json';
    writeFileSync(join(f.root, 'private-updates', file), text);
    writeFileSync(
      join(f.root, 'private-updates/latest.json'),
      JSON.stringify({
        schemaVersion: 1,
        revision: 1,
        file: '/private-updates/' + file,
      }),
    );
    assert.equal(checkPublicBuild(f.root).files, 3);
    writeFileSync(join(f.root, 'private-updates', file), text + ' ');
    assert.throws(() => checkPublicBuild(f.root), /encrypted-update/);
  } finally {
    f.cleanup();
  }
});


test('malformed encrypted asset fails with a bounded diagnostic', () => {
  const f = fixture();
  try {
    mkdirSync(join(f.root, 'private-updates'));
    writeFileSync(join(f.root, 'private-updates/latest.json'), 'null');
    assert.throws(() => checkPublicBuild(f.root), /encrypted-update asset is invalid/);
  } finally {
    f.cleanup();
  }
});
