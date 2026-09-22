import { fileURLToPath } from 'node:url';
import { acquireMonsterSitePack } from '../server/extractMonsterSitePack.ts';
import { OfficialAcquireError, writeIgnoredPack } from '../server/officialAcquire.ts';

try {
  if (process.argv.length !== 2) throw new OfficialAcquireError('acquire-takes-no-url-or-output-override');
  const root = fileURLToPath(new URL('..', import.meta.url));
  const pack = await acquireMonsterSitePack();
  const output = await writeIgnoredPack(root, 'private/monster-site/pack.json', pack);
  console.log(JSON.stringify({
    status: 'installed',
    output,
    version: pack.snapshot.version,
    messages: pack.integrity.messageCount,
    faces: pack.integrity.faces,
    checksum: pack.integrity.payloadSha256,
  }, null, 2));
} catch (error) {
  console.error(error instanceof OfficialAcquireError ? error.message : 'Private monster acquisition failed. No source prose logged.');
  process.exitCode = 1;
}
