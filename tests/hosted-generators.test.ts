import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createServer } from 'node:http';
import {
  encryptHostedGenerators,
  readHostedGenerator,
  hostedGeneratorMiddleware,
  HOSTED_GENERATOR_NAMES,
  type HostedGeneratorPacks,
} from '../server/hostedGenerators.ts';
import { createSyntheticDngngenPack } from './fixtures/dngngenSynthetic.ts';
import { scvmPack, monsterPack } from './fixtures/officialSynthetic.ts';
import {
  isPrivateDngngenHost,
  loadPrivateDngngen,
} from '../src/storage/privateDngngenClient.ts';
import {
  loadPrivateGenerator,
  parsePrivateScvm,
  parsePrivateMonster,
} from '../src/storage/privateGeneratorClient.ts';
import { publishedMiddleware } from '../server/publishedMiddleware.ts';
import { checkPublicBuild } from '../scripts/check-public-build.mjs';
import { checkPrivateBuild } from '../scripts/check-private-boundary.mjs';

async function assets() {
  const root = await mkdtemp(join(tmpdir(), 'hosted-generators-'));
  const key = randomBytes(32).toString('base64');
  const packs: HostedGeneratorPacks = {
    dngngen: createSyntheticDngngenPack(),
    scvmbirther: scvmPack(),
    monster: monsterPack(),
  };
  packs.dngngen.translations = {
    'SYNTHETIC-B-1': [{ type: 'text', text: '테스트 방 구성' }],
  };
  packs.scvmbirther.translations = { 'tables.body.1': '테스트 외형' };
  packs.monster.translations = { 'description.lair': '테스트 둥지' };
  const publication = encryptHostedGenerators(packs, key, 123, true);
  await mkdir(join(root, 'public/hosted-generators'), { recursive: true });
  await writeFile(
    join(root, 'public', publication.manifest.file),
    publication.encoded,
  );
  await writeFile(
    join(root, 'public/hosted-generators/latest.json'),
    JSON.stringify(publication.manifest),
  );
  return {
    root,
    key,
    packs,
    publication,
    enabled: true,
    allowSynthetic: true,
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
}

test('hosted publication preserves all three verified snapshots and Korean helpers without publishing plaintext or keys', async () => {
  const a = await assets();
  try {
    assert.ok(!a.publication.encoded.includes(a.key));
    assert.ok(!a.publication.encoded.includes('SYNTHETIC-B-1'));
    assert.ok(!a.publication.encoded.includes('테스트'));
    for (const name of HOSTED_GENERATOR_NAMES) {
      const value = await readHostedGenerator(a, name);
      assert.equal(value.status, 'ready');
      assert.deepEqual(value.pack, a.packs[name]);
    }
    assert.throws(
      () => encryptHostedGenerators(a.packs, a.key, 123),
      /snapshot-profile/,
    );
    assert.throws(
      () => encryptHostedGenerators(a.packs, a.key, 0, true),
      /revision/i,
    );
  } finally {
    await a.cleanup();
  }
});

test('disabled hosting, missing or incorrect key, changed ciphertext and wrong revisions fail closed', async () => {
  const a = await assets();
  try {
    await assert.rejects(
      readHostedGenerator({ ...a, enabled: false }, 'dngngen'),
      /disabled/,
    );
    await assert.rejects(
      readHostedGenerator({ ...a, key: undefined }, 'dngngen'),
    );
    await assert.rejects(
      readHostedGenerator(
        { ...a, key: randomBytes(32).toString('base64') },
        'dngngen',
      ),
    );
    const manifest = join(a.root, 'public/hosted-generators/latest.json');
    await writeFile(
      manifest,
      JSON.stringify({ ...a.publication.manifest, revision: 124 }),
    );
    await assert.rejects(readHostedGenerator(a, 'dngngen'));
    await writeFile(manifest, JSON.stringify(a.publication.manifest));
    await writeFile(
      join(a.root, 'public', a.publication.manifest.file),
      a.publication.encoded + ' ',
    );
    await assert.rejects(readHostedGenerator(a, 'dngngen'), /damaged/);
    await writeFile(
      manifest,
      JSON.stringify({
        ...a.publication.manifest,
        file: '/../outputs/private-update-publisher.json',
      }),
    );
    await assert.rejects(readHostedGenerator(a, 'dngngen'));
  } finally {
    await a.cleanup();
  }
});

test('source checksum is verified independently of encryption and synthetic opt-in', async () => {
  const a = await assets();
  try {
    a.packs.dngngen.messages['SYNTHETIC-B-1'] = [
      { type: 'text', text: 'Changed source' },
    ];
    assert.throws(
      () => encryptHostedGenerators(a.packs, a.key, 123, true),
      /damaged/,
    );
  } finally {
    await a.cleanup();
  }
});

test('hosted marker enables existing clients while an ordinary public page performs no private request', async () => {
  assert.equal(isPrivateDngngenHost({ querySelector: () => null }), false);
  assert.equal(
    isPrivateDngngenHost({
      querySelector: (selector) => {
        assert.ok(selector.includes('reference-desk-hosted-generators'));
        return { getAttribute: () => 'enabled' } as unknown as Element;
      },
    }),
    true,
  );
  assert.deepEqual(
    await loadPrivateDngngen(false, async () => {
      assert.fail('Unexpected public request');
    }),
    { status: 'public' },
  );
});

test('same-origin hosted routes load all three clients and return safe read-only errors', async () => {
  const a = await assets();
  let enabled = true;
  let key: string | undefined = a.key;
  const middleware = hostedGeneratorMiddleware(() => ({ ...a, key, enabled }));
  const other = publishedMiddleware(() => ({ root: a.root }));
  const server = createServer((req, res) =>
    middleware(req, res, () =>
      other(req, res, () => {
        res.end('<main>SPA</main>');
      }),
    ),
  );
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const base = `http://127.0.0.1:${address.port}`;
  const request: typeof fetch = (url, init) => fetch(base + url, init);
  try {
    assert.equal((await loadPrivateDngngen(true, request)).status, 'ready');
    assert.equal(
      (
        await loadPrivateGenerator(
          '/__private/scvmbirther',
          parsePrivateScvm,
          true,
          request,
        )
      ).status,
      'ready',
    );
    assert.equal(
      (
        await loadPrivateGenerator(
          '/__private/monster',
          parsePrivateMonster,
          true,
          request,
        )
      ).status,
      'ready',
    );
    const response = await fetch(
      base + '/api/private-generator?generator=dngngen',
    );
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.equal(
      response.headers.get('cross-origin-resource-policy'),
      'same-origin',
    );
    assert.deepEqual(
      await response.json(),
      await readHostedGenerator(a, 'dngngen'),
    );
    for (const query of [
      'generator=../outputs',
      'generator=dngngen&generator=monster',
    ])
      assert.equal(
        (await fetch(base + '/api/private-generator?' + query)).status,
        404,
      );
    const post = await fetch(base + '/__private/dngngen', { method: 'POST' });
    assert.equal(post.status, 405);
    assert.equal(post.headers.get('allow'), 'GET');
    assert.equal(
      (
        await fetch(base + '/__private/dngngen', {
          headers: { 'sec-fetch-site': 'cross-site' },
        })
      ).status,
      403,
    );
    key = undefined;
    const unavailable = await fetch(base + '/__private/dngngen');
    assert.equal(unavailable.status, 503);
    const body = await unavailable.text();
    assert.ok(
      !body.includes(a.key) &&
        !body.includes(a.root) &&
        !body.includes('stack'),
    );
    enabled = false;
    assert.equal((await fetch(base + '/__private/dngngen')).status, 404);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
    await a.cleanup();
  }
});

test('public build accepts encrypted generator assets and rejects altered envelopes and plaintext packs', async () => {
  const a = await assets();
  try {
    const dist = join(a.root, 'public');
    await writeFile(join(dist, 'index.html'), '<main>Test site</main>');
    assert.equal(checkPublicBuild(dist, { keys: [a.key] }).files, 3);
    assert.equal(
      checkPrivateBuild(dist, { packs: Object.values(a.packs) }).files,
      3,
    );
    await writeFile(
      join(dist, a.publication.manifest.file),
      a.publication.encoded + ' ',
    );
    assert.throws(() => checkPublicBuild(dist, { keys: [a.key] }), /invalid/);
    await writeFile(
      join(dist, a.publication.manifest.file),
      a.publication.encoded,
    );
    await writeFile(
      join(dist, 'renamed.json'),
      JSON.stringify(a.packs.dngngen),
    );
    assert.throws(
      () => checkPrivateBuild(dist, { packs: Object.values(a.packs) }),
      /private/i,
    );
  } finally {
    await a.cleanup();
  }
});

test('Vercel includes ciphertext in its function and rewrites native routes before SPA fallback', async () => {
  const config = JSON.parse(await readFile('vercel.json', 'utf8'));
  assert.equal(
    config.functions['api/private-generator.ts'].includeFiles,
    'public/hosted-generators/**',
  );
  for (const name of HOSTED_GENERATOR_NAMES)
    assert.ok(
      config.rewrites.some(
        (entry: { source: string; destination: string }) =>
          entry.source === '/__private/' + name &&
          entry.destination === '/api/private-generator?generator=' + name,
      ),
    );
});
