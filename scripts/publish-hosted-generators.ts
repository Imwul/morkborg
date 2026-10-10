import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { readPrivateDngngenPack } from '../server/privateDngngenPack.js';
import { readPrivateDngngenTranslation } from '../server/privateDngngenTranslation.js';
import { readPrivateGeneratorPack } from '../server/privateGeneratorPack.js';
import { readPrivateScvmTranslation } from '../server/privateScvmTranslation.js';
import { readPrivateMonsterTranslation } from '../server/privateMonsterTranslation.js';
import { parseScvmPack, scvmPackPayload } from '../src/domain/scvmPack.js';
import {
  parseMonsterSitePack,
  monsterSitePackPayload,
} from '../src/domain/monsterSitePack.js';
import { encryptHostedGenerators } from '../server/hostedGenerators.js';

const root = process.cwd();
const local = JSON.parse(
  await readFile(
    resolve(root, 'outputs/private-update-publisher.json'),
    'utf8',
  ),
);
const key = process.env.MORKBORG_DATA_KEY ?? local.key;
const dngngen = await readPrivateDngngenPack(
  resolve(root, 'private/dngngen/pack.json'),
);
const scvm = await readPrivateGeneratorPack(
  resolve(root, 'private/scvmbirther/pack.json'),
  parseScvmPack,
  scvmPackPayload,
);
const monster = await readPrivateGeneratorPack(
  resolve(root, 'private/monster-site/pack.json'),
  parseMonsterSitePack,
  monsterSitePackPayload,
);
if (
  dngngen.status !== 'ready' ||
  scvm.status !== 'ready' ||
  monster.status !== 'ready'
)
  throw new Error('All three verified local generator snapshots are required.');
const dngngenKo = await readPrivateDngngenTranslation(
  resolve(root, 'private/dngngen/ko.json'),
  dngngen.pack,
);
const scvmKo = await readPrivateScvmTranslation(
  resolve(root, 'private/scvmbirther/ko.json'),
  scvm.pack,
);
const monsterKo = await readPrivateMonsterTranslation(
  resolve(root, 'private/monster-site/ko.json'),
  monster.pack,
);
if (!dngngenKo || !scvmKo || !monsterKo)
  throw new Error('Matching Korean helpers are required for all generators.');
let previous = 0;
try {
  previous = JSON.parse(
    await readFile(
      resolve(root, 'public/hosted-generators/latest.json'),
      'utf8',
    ),
  ).revision;
} catch {
  /* First publication. */
}
const revision = Math.max(Date.now(), previous + 1);
const publication = encryptHostedGenerators(
  {
    dngngen: { ...dngngen.pack, translations: dngngenKo },
    scvmbirther: { ...scvm.pack, translations: scvmKo },
    monster: { ...monster.pack, translations: monsterKo },
  },
  key,
  revision,
);
await mkdir(resolve(root, 'public/hosted-generators'), { recursive: true });
await writeFile(
  join(root, 'public', publication.manifest.file),
  publication.encoded,
);
await writeFile(
  resolve(root, 'public/hosted-generators/latest.json'),
  JSON.stringify(publication.manifest),
);
console.log(
  'Three verified generators and Korean helpers prepared as encrypted hosting assets. No plaintext or key was published.',
);
