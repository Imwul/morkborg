import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const fail = (reason) => {
  throw new Error(`Public build privacy check failed: ${reason}`);
};
const forbidden =
  /(?:\.pdf$|\.pem$|\.env(?:\.|$)|^morkborg-private-data\.json$|^private-update-publisher\.json$)/i;
const textFile = /\.(?:js|mjs|json|html|css|map|txt|svg)$/i;
const localPath =
  /(?:\/Users\/[^\s"'<>]+|\/home\/[^\s"'<>]+|\/tmp\/[^\s"'<>]+|[A-Z]:\\\\?Users\\)/;

export function checkPublicBuild(directory = 'dist', options = {}) {
  const root = resolve(directory);
  if (!existsSync(join(root, 'index.html')))
    fail('production index.html is missing.');
  const keys = [process.env.MORKBORG_DATA_KEY, ...(options.keys ?? [])].filter(
    (key) => typeof key === 'string' && key.length >= 16,
  );
  const publisher = resolve('outputs/private-update-publisher.json');
  if (existsSync(publisher)) {
    let local;
    try {
      local = JSON.parse(readFileSync(publisher, 'utf8'));
    } catch {
      fail('local publisher configuration is malformed.');
    }
    if (local && typeof local === 'object' && typeof local.key === 'string')
      keys.push(local.key);
  }
  const samples = new Set(options.sourceSamples ?? []);
  const collect = (value, field = '') => {
    if (samples.size >= 256) return;
    if (
      typeof value === 'string' &&
      /^(?:text|description|specialAbility|rawSourceText)$/.test(field) &&
      value.length >= 80
    )
      samples.add(value.slice(0, 160));
    else if (Array.isArray(value))
      value.forEach((entry) => collect(entry, field));
    else if (value && typeof value === 'object')
      Object.entries(value).forEach(([key, entry]) => collect(entry, key));
  };
  for (const file of options.sourceFiles ?? [
    'public/rules/library.json',
    'public/rules/oracles.json',
  ]) {
    if (!existsSync(file)) continue;
    try {
      collect(JSON.parse(readFileSync(file, 'utf8')));
    } catch {
      fail('a supplied source used for the privacy check is malformed.');
    }
  }
  let files = 0;
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = join(dir, entry.name),
        name = relative(root, file).replaceAll('\\', '/');
      if (entry.isSymbolicLink())
        fail('a symlink could bypass the static boundary.');
      if (
        forbidden.test(entry.name) ||
        /(?:^|\/)(?:rules|outputs|work)(?:\/|$)/.test(name)
      )
        fail('private files or working directories are present.');
      if (entry.isDirectory()) {
        walk(file);
        continue;
      }
      files++;
      const bytes = readFileSync(file);
      if (keys.some((key) => bytes.includes(Buffer.from(key))))
        fail('a private connection key is present.');
      if (!textFile.test(entry.name)) continue;
      const text = bytes.toString('utf8');
      if (localPath.test(text))
        fail('a personal or temporary filesystem path is present.');
      for (const sample of samples) {
        if (
          text.includes(sample) ||
          text.includes(JSON.stringify(sample).slice(1, -1))
        )
          fail('a private source excerpt is present.');
      }
      if (/\.json$/i.test(entry.name)) {
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          fail('a static JSON asset is malformed.');
        }
        if (
          data &&
          typeof data === 'object' &&
          (data.kind === 'morkborg-private-data' ||
            (data.tables && (data.creatures || data.procedures)) ||
            data.updateConnection ||
            data.publisherKey)
        )
          fail('a renamed plaintext pack or connection is present.');
        if (name.startsWith('private-updates/')) {
          if (!data || typeof data !== 'object' || Array.isArray(data))
            fail('an encrypted-update asset is invalid.');
          if (entry.name === 'latest.json') {
            if (
              Object.keys(data).sort().join(',') !==
                'file,revision,schemaVersion' ||
              data.schemaVersion !== 1 ||
              !Number.isSafeInteger(data.revision) ||
              data.revision < 1 ||
              !/^\/private-updates\/[a-f0-9]{64}\.json$/.test(data.file) ||
              !existsSync(join(root, data.file))
            )
              fail('the encrypted-update manifest is invalid.');
          } else if (
            !/^[a-f0-9]{64}\.json$/.test(entry.name) ||
            createHash('sha256').update(bytes).digest('hex') !==
              entry.name.slice(0, -5) ||
            Object.keys(data).sort().join(',') !== 'data,iv,schemaVersion' ||
            data.schemaVersion !== 1 ||
            typeof data.iv !== 'string' ||
            !/^[A-Za-z0-9+/]{16}$/.test(data.iv) ||
            typeof data.data !== 'string' ||
            !/^[A-Za-z0-9+/]+={0,2}$/.test(data.data)
          )
            fail('an encrypted-update asset is invalid.');
        }
      }
    }
  };
  walk(root);
  return { files };
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const result = checkPublicBuild(process.argv[2] ?? 'dist');
  console.log(
    `Public build privacy checks passed (${result.files} static files).`,
  );
}
