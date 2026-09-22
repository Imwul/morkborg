import { fileURLToPath } from 'node:url';
import { acquireScvmPack } from '../server/extractScvmPack.ts';
import { OfficialAcquireError, writeIgnoredPack } from '../server/officialAcquire.ts';

try {
  if (process.argv.length !== 2) throw new OfficialAcquireError('acquire-takes-no-url-or-output-override');
  const root = fileURLToPath(new URL('..', import.meta.url));
  const pack = await acquireScvmPack();
  const output = await writeIgnoredPack(root, 'private/scvmbirther/pack.json', pack);
  console.log(JSON.stringify({
    status: 'installed',
    output,
    version: pack.snapshot.version,
    classes: pack.integrity.classCount,
    homebrewClasses: pack.integrity.homebrewClassCount,
    messages: pack.integrity.messageCount,
    checksum: pack.integrity.payloadSha256,
  }, null, 2));
} catch (error) {
  console.error(error instanceof OfficialAcquireError ? error.message : 'Private SCVMBIRTHER acquisition failed. No source prose logged.');
  process.exitCode = 1;
}
