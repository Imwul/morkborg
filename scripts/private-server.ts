import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createPrivateDngngenServer, privateBindHost, privateOrigin } from '../server/privateDngngenServer.ts';
import { readPrivateDngngenPack } from '../server/privateDngngenPack.ts';
import { readPrivateGeneratorPack } from '../server/privateGeneratorPack.ts';
import { parseScvmPack, scvmPackPayload } from '../src/domain/scvmPack.ts';
import { monsterSitePackPayload, parseMonsterSitePack } from '../src/domain/monsterSitePack.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
let saved: { host?: string; port?: number; origin?: string } = {};
try {
  const raw: unknown = JSON.parse(await readFile(resolve(root, 'private/server.json'), 'utf8'));
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) ||
      Object.keys(raw).some((key) => !['host', 'port', 'origin'].includes(key)))
    throw new Error('Invalid private server configuration.');
  saved = raw;
} catch (error) {
  if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT'))
    throw new Error('private/server.json must contain only host, port and/or origin.');
}
const host = privateBindHost(process.env.PRIVATE_HOST ?? saved.host);
const port = Number(process.env.PRIVATE_PORT ?? saved.port ?? 4174);
if (!Number.isSafeInteger(port) || port < 1024 || port > 65535)
  throw new Error('PRIVATE_PORT must be an integer from 1024 to 65535.');
const origin = privateOrigin(process.env.PRIVATE_ORIGIN ?? saved.origin);
const packPath = resolve(root, process.env.PRIVATE_DNGNGEN_PACK ?? 'private/dngngen/pack.json');
const scvmPath = resolve(root, process.env.PRIVATE_SCVM_PACK ?? 'private/scvmbirther/pack.json');
const monsterPath = resolve(root, process.env.PRIVATE_MONSTER_PACK ?? 'private/monster-site/pack.json');
const allowSynthetic = process.env.PRIVATE_DNGNGEN_ALLOW_SYNTHETIC === '1';
let key = process.env.MORKBORG_DATA_KEY;
if (!key) {
  try {
    const publisher = JSON.parse(await readFile(resolve(root, 'outputs/private-update-publisher.json'), 'utf8'));
    if (typeof publisher?.key === 'string') key = publisher.key;
  } catch { /* Existing Core endpoint returns its usual unavailable response if unconfigured. */ }
}
const status = await readPrivateDngngenPack(packPath, allowSynthetic);
const scvmStatus = await readPrivateGeneratorPack(scvmPath, parseScvmPack, scvmPackPayload, allowSynthetic);
const monsterStatus = await readPrivateGeneratorPack(monsterPath, parseMonsterSitePack, monsterSitePackPayload, allowSynthetic);
const server = createPrivateDngngenServer({ root, packPath, scvmPath, monsterPath, allowSynthetic, host, origin, rulebookKey: key });
server.on('error', () => {
  console.error('Private server could not listen. Check the port and configured local interface.');
  process.exitCode = 1;
});
server.listen(port, host, () => {
  console.log(`Private Reference Desk: http://${host}:${port}`);
  if (host === '127.0.0.1') {
    console.log(`Loopback: http://127.0.0.1:${port}`);
    console.log(`After Tailscale login, configure private HTTPS: tailscale serve --bg --https=443 http://127.0.0.1:${port}`);
  } else {
    console.log('Direct Tailscale interface selected. Use loopback binding before configuring HTTPS Serve.');
  }
  if (origin) console.log(`Tailscale Serve address: ${origin} (requires your existing Serve configuration).`);
  console.log(status.status === 'ready'
    ? status.pack.profile === 'synthetic'
      ? 'SYNTHETIC DEMO PACK enabled — invented test content, not DNGNGEN source content.'
      : 'Private DNGNGEN pack validated.'
    : `Native DNGNGEN unavailable (${status.reason}); CORE and the original external link remain available.`);
  const generatorLine = (label: string, value: { status: string; reason?: string; pack?: { profile?: string } }) =>
    console.log(value.status === 'ready'
      ? value.pack?.profile === 'synthetic'
        ? `${label}: synthetic demo pack enabled.`
        : `${label}: private pack validated.`
      : `${label} unavailable (${value.reason}); the rulebook generator remains available.`);
  generatorLine('SCVMBIRTHER', scvmStatus);
  generatorLine('The Monster Approaches', monsterStatus);
  if (!key) console.log('Existing Core update service has no configured key; use the app’s existing local import flow.');
  console.log('No public tunnel was created. Keep this process running while using the private instance.');
});
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.once(signal, () => server.close(() => process.exit(0)));
