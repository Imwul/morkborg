import { createCipheriv, createHash, randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Run locally after enriching the private source data. The key never enters public/.
const bundlePath = resolve(
  process.argv[2] || 'outputs/morkborg-private-data.json',
);
const bundle = JSON.parse(readFileSync(bundlePath, 'utf8'));
const bundledKey = bundle.updateConnection?.key;
delete bundle.updateConnection;
if (
  bundle.kind !== 'morkborg-private-data' ||
  !bundle.library ||
  !bundle.oracles ||
  !bundle.fateChart
)
  throw new Error('A complete, validated private bundle is required.');
const localPath = resolve('outputs/private-update-publisher.json');
const previous = existsSync(localPath)
  ? JSON.parse(readFileSync(localPath, 'utf8'))
  : null;
if (
  !previous?.key &&
  !bundledKey &&
  existsSync('public/private-updates/latest.json')
)
  throw new Error(
    'Restore the original publisher key or linked private bundle before publishing.',
  );
if (previous?.key && bundledKey && previous.key !== bundledKey)
  throw new Error(
    'The bundle and publisher keys differ. Restore the matching private bundle.',
  );
const key = previous?.key || bundledKey || randomBytes(32).toString('base64');
if (!/^[A-Za-z0-9+/]{43}=$/.test(key))
  throw new Error('Invalid private update key.');
const digest = createHash('sha256')
  .update(JSON.stringify(bundle))
  .digest('hex');
let revision = previous?.revision;
if (
  digest !== previous?.digest ||
  !existsSync('public/private-updates/latest.json')
) {
  revision = Math.max(Date.now(), (previous?.revision || 0) + 1);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(key, 'base64'), iv);
  cipher.setAAD(Buffer.from(`morkborg-private-update:v1:${revision}`));
  const plain = JSON.stringify({ revision, bundle });
  const data = Buffer.concat([
    cipher.update(plain),
    cipher.final(),
    cipher.getAuthTag(),
  ]);
  const envelope = JSON.stringify({
    schemaVersion: 1,
    iv: iv.toString('base64'),
    data: data.toString('base64'),
  });
  const filename =
    createHash('sha256').update(envelope).digest('hex') + '.json';
  mkdirSync('public/private-updates', { recursive: true });
  writeFileSync(`public/private-updates/${filename}`, envelope);
  writeFileSync(
    'public/private-updates/latest.json',
    JSON.stringify({
      schemaVersion: 1,
      revision,
      file: `/private-updates/${filename}`,
    }),
  );
  mkdirSync('outputs', { recursive: true });
  writeFileSync(localPath, JSON.stringify({ key, digest, revision }), {
    mode: 0o600,
  });
}
bundle.updateConnection = {
  schemaVersion: 1,
  manifest: '/private-updates/latest.json',
  key,
  revision,
  enabled: true,
};
writeFileSync(bundlePath, JSON.stringify(bundle), { mode: 0o600 });
console.log(
  'Encrypted update prepared. Private import bundle now includes automatic updates.',
);
