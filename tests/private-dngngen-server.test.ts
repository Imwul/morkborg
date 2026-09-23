import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { request } from 'node:http';
import { execFileSync } from 'node:child_process';
import { readPrivateDngngenPack } from '../server/privateDngngenPack.ts';
import { createPrivateDngngenServer, privateBindHost, privateOrigin, PRIVATE_MODE_MARKER } from '../server/privateDngngenServer.ts';
import { createSyntheticDngngenPack, sealSyntheticDngngenPack } from './fixtures/dngngenSynthetic.ts';
import { checkPrivateBuild, checkPrivateGit } from '../scripts/check-private-boundary.mjs';

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'reference-private-host-'));
  await mkdir(join(root, 'dist/assets'), { recursive: true });
  await mkdir(join(root, 'private/dngngen'), { recursive: true });
  await writeFile(join(root, 'dist/index.html'), '<html><head><title>Test</title></head><body>PUBLIC APP</body></html>');
  await writeFile(join(root, 'dist/assets/app.js'), 'window.publicApp = true;');
  const packPath = join(root, 'private/dngngen/pack.json');
  return { root, packPath, cleanup: () => rm(root, { recursive: true, force: true }) };
}

async function host(options: Parameters<typeof createPrivateDngngenServer>[0]) {
  const server = createPrivateDngngenServer(options);
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  const address = server.address();
  assert(address && typeof address === 'object');
  return {
    base: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((done, reject) => server.close((error) => error ? reject(error) : done())),
  };
}

test('private pack loader reports missing/invalid without filesystem details', async () => {
  const f = await fixture();
  try {
    assert.deepEqual(await readPrivateDngngenPack(f.packPath), { status: 'unavailable', reason: 'missing' });
    await writeFile(f.packPath, '{invalid');
    assert.deepEqual(await readPrivateDngngenPack(f.packPath), { status: 'unavailable', reason: 'invalid' });
    await writeFile(f.packPath, JSON.stringify({ secret: f.root }));
    assert.deepEqual(await readPrivateDngngenPack(f.packPath), { status: 'unavailable', reason: 'invalid' });
  } finally { await f.cleanup(); }
});

test('synthetic packs require explicit host opt-in and valid checksum', async () => {
  const f = await fixture();
  try {
    const pack = createSyntheticDngngenPack();
    await writeFile(f.packPath, JSON.stringify(pack));
    assert.equal((await readPrivateDngngenPack(f.packPath)).status, 'unavailable');
    const valid = await readPrivateDngngenPack(f.packPath, true);
    assert.equal(valid.status, 'ready');
    if (valid.status === 'ready') assert(Object.isFrozen(valid.pack.pools.A));
    await writeFile(f.packPath, JSON.stringify({ ...pack, integrity: { ...pack.integrity, payloadSha256: 'f'.repeat(64) } }));
    assert.deepEqual(await readPrivateDngngenPack(f.packPath, true), { status: 'unavailable', reason: 'invalid' });
  } finally { await f.cleanup(); }
});

test('private loader rejects directories and oversized inputs', async () => {
  const f = await fixture();
  try {
    assert.equal((await readPrivateDngngenPack(f.root)).status, 'unavailable');
    await writeFile(f.packPath, ' '.repeat(8_000_001));
    assert.equal((await readPrivateDngngenPack(f.packPath, true)).status, 'unavailable');
  } finally { await f.cleanup(); }
});

test('pack replacement is revalidated; no stale snapshot or checksum cache survives', async () => {
  const f = await fixture();
  try {
    const pack = createSyntheticDngngenPack();
    await writeFile(f.packPath, JSON.stringify(pack));
    const first = await readPrivateDngngenPack(f.packPath, true);
    const changed = sealSyntheticDngngenPack({ ...pack, snapshot: { ...pack.snapshot, id: 'synthetic-replacement' } });
    await writeFile(f.packPath, JSON.stringify(changed));
    const next = await readPrivateDngngenPack(f.packPath, true);
    assert(first.status === 'ready' && next.status === 'ready');
    assert.notEqual(first.pack.integrity.payloadSha256, next.pack.integrity.payloadSha256);
    assert.equal(next.pack.snapshot.id, 'synthetic-replacement');
    await writeFile(f.packPath, '{}');
    assert.equal((await readPrivateDngngenPack(f.packPath, true)).status, 'unavailable');
  } finally { await f.cleanup(); }
});

test('private binding accepts loopback and only locally present Tailscale addresses', () => {
  assert.equal(privateBindHost(), '127.0.0.1');
  const interfaces = { utun: [{ address: '100.80.20.30', family: 'IPv4', netmask: '255.255.255.255', mac: '', internal: false, cidr: null }] };
  assert.equal(privateBindHost('100.80.20.30', interfaces), '100.80.20.30');
  for (const value of ['0.0.0.0', '::', '192.168.1.20', '1.2.3.4', '100.80.20.31', '100.128.0.1', 'localhost'])
    assert.throws(() => privateBindHost(value, interfaces));
});

test('Tailscale origin config accepts exact HTTPS origins only', () => {
  assert.equal(privateOrigin(), undefined);
  assert.equal(privateOrigin('https://host.example-tailnet.ts.net'), 'https://host.example-tailnet.ts.net');
  for (const value of ['https://example.com', 'http://host.tailnet.ts.net', 'https://host.tailnet.ts.net/path', 'https://u:p@host.tailnet.ts.net', 'https://host.tailnet.ts.net:123'])
    assert.throws(() => privateOrigin(value));
});

test('private HTML marker is injected at runtime and never writes the public artifact', async () => {
  const f = await fixture();
  const h = await host(f);
  try {
    for (const path of ['/', '/reference/test']) {
      const response = await fetch(h.base + path);
      assert.equal(response.status, 200);
      assert((await response.text()).includes(PRIVATE_MODE_MARKER));
    }
    assert(!(await readFile(join(f.root, 'dist/index.html'), 'utf8')).includes(PRIVATE_MODE_MARKER));
    assert.equal((await fetch(h.base + '/assets/app.js')).status, 200);
    assert.equal((await fetch(h.base + '/assets/missing.js')).status, 404);
  } finally { await h.close(); await f.cleanup(); }
});

test('missing and invalid pack endpoint stays clean while CORE application continues serving', async () => {
  const f = await fixture();
  const h = await host(f);
  try {
    const response = await fetch(h.base + '/__private/dngngen');
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'unavailable', reason: 'missing' });
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.equal(response.headers.get('access-control-allow-origin'), null);
    await writeFile(f.packPath, '{broken');
    assert.deepEqual(await (await fetch(h.base + '/__private/dngngen')).json(), { status: 'unavailable', reason: 'invalid' });
    assert.equal((await fetch(h.base)).status, 200);
  } finally { await h.close(); await f.cleanup(); }
});

test('valid private endpoint exposes only the configured validated pack, never its path', async () => {
  const f = await fixture();
  const h = await host({ ...f, allowSynthetic: true });
  try {
    await writeFile(f.packPath, JSON.stringify(createSyntheticDngngenPack()));
    const response = await fetch(h.base + '/__private/dngngen?file=/etc/passwd');
    const body = await response.text();
    assert.equal(JSON.parse(body).status, 'ready');
    assert(!body.includes(f.root));
    assert(!body.includes('/etc/passwd'));
    await rm(f.packPath);
    assert.equal((await (await fetch(h.base + '/__private/dngngen')).json()).status, 'unavailable');
  } finally { await h.close(); await f.cleanup(); }
});

test('host, origin, fetch-site and methods enforce a same-private-application boundary', async () => {
  const f = await fixture();
  const h = await host({ ...f, origin: 'https://host.test-tailnet.ts.net' });
  try {
    const rawStatus = (headers: Record<string, string>) => new Promise<number>((done, reject) => {
      request(h.base + '/__private/dngngen', { headers }, (response) => {
        response.resume(); done(response.statusCode!);
      }).on('error', reject).end();
    });
    for (const headers of [{ Origin: 'https://attacker.invalid' }, { Host: 'attacker.invalid' }, { 'Sec-Fetch-Site': 'cross-site' }])
      assert.equal(await rawStatus(headers), 403, JSON.stringify(headers));
    assert.equal(await rawStatus({ Origin: 'https://host.test-tailnet.ts.net', Host: 'host.test-tailnet.ts.net' }), 200);
    assert.equal((await fetch(h.base + '/__private/dngngen', { method: 'POST' })).status, 405);
    assert.equal((await fetch(h.base + '/__private/dngngen', { method: 'OPTIONS' })).status, 405);
    assert.equal((await fetch(h.base + '/__private/dngngen', { method: 'HEAD' })).status, 405);
  } finally { await h.close(); await f.cleanup(); }
});

test('private server denies file namespaces, traversal, malformed URLs and escaping symlinks', async () => {
  const f = await fixture();
  const h = await host(f);
  try {
    await writeFile(join(f.root, 'secret.json'), '{"secret":"PRIVATE"}');
    await symlink(join(f.root, 'secret.json'), join(f.root, 'dist/assets/escape.json'));
    const rawStatus = (path: string) => new Promise<number>((done, reject) => {
      request(h.base, { path }, (res) => { res.resume(); done(res.statusCode!); }).on('error', reject).end();
    });
    for (const path of ['/private/dngngen/pack.json', '/outputs/private-update-publisher.json', '/.git/config', '/src/App.tsx', '/__private/anything', '/api/anything', '/assets/escape.json', '/%2e%2e/secret.json', '/assets/../../secret.json', '/assets/%5c../secret.json'])
      assert.equal(await rawStatus(path), 404, path);
    assert.equal(await rawStatus('/%xy'), 400);
  } finally { await h.close(); await f.cleanup(); }
});

test('pack loading and host validation consume no generation RNG', async () => {
  const f = await fixture();
  try {
    await writeFile(f.packPath, JSON.stringify(createSyntheticDngngenPack()));
    const random = Math.random;
    Math.random = () => { throw new Error('Unexpected RNG'); };
    try {
      assert.equal((await readPrivateDngngenPack(f.packPath, true)).status, 'ready');
      assert.equal(privateBindHost(), '127.0.0.1');
    } finally { Math.random = random; }
  } finally { await f.cleanup(); }
});

test('built-artifact privacy check catches synthetic prose, IDs, fingerprints and encoded content', async () => {
  const f = await fixture();
  try {
    const pack = createSyntheticDngngenPack();
    assert.equal(checkPrivateBuild(join(f.root, 'dist'), { packs: [pack] }).files, 2);
    for (const token of [pack.pools.A[0].id, 'A-1 TEST DESCRIPTION', pack.integrity.payloadSha256, Buffer.from('A-1 TEST DESCRIPTION').toString('base64')]) {
      await writeFile(join(f.root, 'dist/assets/app.js'), `const leaked = ${JSON.stringify(token)};`);
      assert.throws(() => checkPrivateBuild(join(f.root, 'dist'), { packs: [pack] }), /privacy|boundary/);
    }
  } finally { await f.cleanup(); }
});

test('built-artifact privacy check rejects private paths, runtime marker and renamed endpoint payload', async () => {
  const f = await fixture();
  try {
    for (const text of [PRIVATE_MODE_MARKER, 'private/dngngen/pack.json', 'private/server.json']) {
      await writeFile(join(f.root, 'dist/assets/app.js'), text);
      assert.throws(() => checkPrivateBuild(join(f.root, 'dist')));
    }
    await writeFile(join(f.root, 'dist/assets/app.js'), 'safe');
    await writeFile(join(f.root, 'dist/assets/renamed.json'), JSON.stringify({ status: 'ready', pack: createSyntheticDngngenPack() }));
    assert.throws(() => checkPrivateBuild(join(f.root, 'dist')));
    await rm(join(f.root, 'dist/assets/renamed.json'));
    await mkdir(join(f.root, 'dist/private'));
    await writeFile(join(f.root, 'dist/private/arbitrary.txt'), 'test');
    assert.throws(() => checkPrivateBuild(join(f.root, 'dist')));
  } finally { await f.cleanup(); }
});

test('repo ignores personal pack/configuration/cache/evidence and excludes it from Vercel', () => {
  const checked = checkPrivateGit(resolve('.'));
  assert.equal(checked.ignoredPaths, 7);
  assert(checked.trackedFiles > 0);
  const tracked = execFileSync('git', ['ls-files', 'private'], { encoding: 'utf8' });
  assert.equal(tracked.trim(), '');
});

test('production client has no static private file import and Vercel has no private endpoint', async () => {
  const vite = await readFile('vite.config.ts', 'utf8');
  assert(!/from\s*['"][^'"]*private\/dngngen/.test(vite));
  const config = JSON.parse(await readFile('vercel.json', 'utf8'));
  assert.deepEqual(Object.keys(config.functions), ['api/rulebook-data.ts']);
  const pkg = JSON.parse(await readFile('package.json', 'utf8'));
  assert(pkg.scripts.build.includes('check-private-boundary.mjs'));
  assert(pkg.scripts.private.includes('private-server.ts'));
});

test('actual build privacy CLI tolerates a malformed private pack without embedding it', async () => {
  const f = await fixture();
  try {
    await writeFile(f.packPath, '{ malformed private JSON canary input that must never be embedded');
    const result = execFileSync(process.execPath, ['scripts/check-private-boundary.mjs', join(f.root, 'dist')], {
      encoding: 'utf8', env: { ...process.env, PRIVATE_DNGNGEN_PACK: f.packPath },
    });
    assert.match(result, /boundary passed/);
    assert(!result.includes(f.root));
    await writeFile(join(f.root, 'dist/assets/app.js'), await readFile(f.packPath));
    assert.throws(() => execFileSync(process.execPath, ['scripts/check-private-boundary.mjs', join(f.root, 'dist')], {
      env: { ...process.env, PRIVATE_DNGNGEN_PACK: f.packPath }, stdio: 'pipe',
    }));
  } finally { await f.cleanup(); }
});
