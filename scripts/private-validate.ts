import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readPrivateDngngenPack } from '../server/privateDngngenPack.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const pack = await readPrivateDngngenPack(
  resolve(root, process.argv[2] ?? process.env.PRIVATE_DNGNGEN_PACK ?? 'private/dngngen/pack.json'),
  process.env.PRIVATE_DNGNGEN_ALLOW_SYNTHETIC === '1',
);
if (pack.status !== 'ready') {
  console.error(`Private pack is ${pack.reason}. No native DNGNGEN generation will be enabled.`);
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({
    status: 'valid', profile: pack.pack.profile,
    poolCounts: pack.pack.integrity.poolCounts,
    checksumVerified: true,
  }, null, 2));
}
