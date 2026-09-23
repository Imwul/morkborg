import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, relative, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const fail = (reason) => { throw new Error(`Private pack boundary check failed: ${reason}`); };
const forbiddenPath = /(?:^|\/)(?:private|outputs|work|tmp)(?:\/|$)/i;
const privateFile = /(?:^|\/)(?:pack\.json|private-server\.json|dngngen-source-map\.json)$/i;
const publicSourceUrls = new Set([
  'https://dngngen.makedatanotlore.dev/',
  'https://scvmbirther.makedatanotlore.dev/',
  'https://monster.makedatanotlore.dev/',
]);

/** Extract comparison needles in memory; never print or copy private source prose. */
export function privatePackNeedles(pack) {
  const needles = new Set();
  const add = (value, minimum = 12) => {
    // These source homepages are intentionally linked in the public UI.
    if (typeof value === 'string' &&
        (publicSourceUrls.has(value) || publicSourceUrls.has(`${value}/`))) return;
    if (typeof value === 'string' && value.length >= minimum) needles.add(value);
  };
  const walk = (value, field = '', depth = 0) => {
    if (depth > 24) return;
    if (typeof value === 'string') {
      if (field === 'id' || field === 'messageId') {
        // Match an identifier as a serialized scalar, not a substring of a
        // pre-existing public identifier (e.g. a singular word inside a plural).
        if (value.length >= 8) {
          add(JSON.stringify(value), 10);
          add("'" + value.replaceAll("\\", "\\\\").replaceAll("'", "\\'") + "'", 10);
        }
      }
      else if (field === 'text' || field === 'value') add(value);
    } else if (Array.isArray(value)) value.forEach((child) => walk(child, field, depth + 1));
    else if (value && typeof value === 'object')
      Object.entries(value).forEach(([key, child]) => walk(child, key, depth + 1));
  };
  walk(pack?.pools);
  walk(pack?.messages);
  walk(pack?.translations);
  // Value-list strings may be directly nested below sample recipe fields.
  const strings = (value, depth = 0) => {
    if (depth > 24) return;
    if (typeof value === 'string') add(value, 20);
    else if (Array.isArray(value)) value.forEach((child) => strings(child, depth + 1));
    else if (value && typeof value === 'object') Object.values(value).forEach((child) => strings(child, depth + 1));
  };
  strings(pack?.messages);
  strings(pack?.translations);
  strings(pack?.pools);
  strings(pack?.tables);
  add(pack?.snapshot?.id, 12);
  add(pack?.integrity?.payloadSha256, 64);
  return [...needles];
}

function filesUnder(root) {
  const files = [];
  const walk = (directory) => {
    for (const item of readdirSync(directory, { withFileTypes: true })) {
      if (item.isSymbolicLink()) fail('symlinks are not allowed in inspected build assets.');
      const file = join(directory, item.name);
      if (item.isDirectory()) walk(file);
      else files.push(file);
    }
  };
  walk(root);
  return files;
}

function containsStandaloneIdentifier(text, token) {
  let index = text.indexOf(token);
  while (index !== -1) {
    const before = text[index - 1];
    const after = text[index + token.length];
    if ((!before || !/[A-Za-z0-9_.:-]/.test(before)) &&
        (!after || !/[A-Za-z0-9_.:-]/.test(after))) return true;
    index = text.indexOf(token, index + token.length);
  }
  return false;
}

export function checkPrivateBuild(directory = 'dist', options = {}) {
  const root = resolve(directory);
  if (!existsSync(join(root, 'index.html'))) fail('production index.html is missing.');
  const tokens = [
    'SYNTHETIC-A-1', 'A-1 TEST DESCRIPTION', 'synthetic-grammar-v1',
    ...(options.canaries ?? []), ...(options.packs ?? []).flatMap(privatePackNeedles),
  ];
  const files = filesUnder(root);
  for (const file of files) {
    const path = relative(root, file).replaceAll('\\', '/');
    if (forbiddenPath.test(path) || privateFile.test(path)) fail('a private file is in the public build.');
    const bytes = readFileSync(file);
    const text = bytes.toString('utf8');
    if (text.includes('private/dngngen/pack.json') ||
        text.includes('private/scvmbirther/pack.json') ||
        text.includes('private/scvmbirther/ko.json') ||
        text.includes('private/monster-site/pack.json') ||
        text.includes('private/server.json') ||
        /<meta\s+name=["']reference-desk-private["']\s+content=["']enabled["']/.test(text))
      fail('a local pack path or active private-host marker is in the public build.');
    for (const token of tokens) {
      const isSlug = /^[a-z0-9]+(?:-[a-z0-9]+)+$/.test(token);
      const textMatch = isSlug
        ? containsStandaloneIdentifier(text, token)
        : [token, JSON.stringify(token).slice(1, -1)].some((form) => text.includes(form));
      if (textMatch || bytes.includes(Buffer.from(token).toString('base64')))
        fail('private source content, identifier or payload identity is in the public build.');
    }
    if (/\.json$/i.test(path)) {
      let value;
      try { value = JSON.parse(text); } catch { continue; }
      if (['reference-desk.dngngen', 'reference-desk.scvmbirther', 'reference-desk.scvmbirther-ko', 'reference-desk.monster-site'].includes(value?.format) ||
          ['reference-desk.dngngen', 'reference-desk.scvmbirther', 'reference-desk.scvmbirther-ko', 'reference-desk.monster-site'].includes(value?.pack?.format))
        fail('a private pack or endpoint payload is present in public static JSON.');
    }
  }
  return { files: files.length, comparisonNeedles: tokens.length };
}

export function checkPrivateGit(root = '.', packs = []) {
  const repo = resolve(root);
  const names = execFileSync('git', ['ls-files', '-z'], { cwd: repo, encoding: 'utf8' }).split('\0').filter(Boolean);
  if (names.some((name) => /^private\//.test(name))) fail('a private pack/configuration path is tracked.');
  const paths = ['private/dngngen/pack.json', 'private/dngngen/cache.json', 'private/server.json', 'outputs/dngngen-audit.json', 'private/scvmbirther/pack.json', 'private/scvmbirther/ko.json', 'private/monster-site/pack.json'];
  const ignored = execFileSync('git', ['check-ignore', '--no-index', ...paths], { cwd: repo, encoding: 'utf8' }).trim().split('\n');
  if (paths.some((path) => !ignored.includes(path))) fail('private pack, cache or audit paths are not ignored.');
  const needles = packs.filter((pack) => pack?.profile !== 'synthetic').flatMap(privatePackNeedles);
  let preExistingSharedFragments = 0;
  for (const name of names) {
    const file = join(repo, name);
    if (!existsSync(file)) continue;
    const bytes = readFileSync(file);
    const hits = needles.filter((needle) => bytes.includes(Buffer.from(needle)));
    if (hits.length) {
      // Canonical source audits can already contain a phrase also found in a
      // later private snapshot. Only an identical HEAD file is grandfathered;
      // a new or modified tracked file still fails, regardless of length.
      let unchanged = false;
      try {
        const previous = execFileSync('git', ['show', `HEAD:${name}`], {
          cwd: repo,
          stdio: ['ignore', 'pipe', 'ignore'],
          maxBuffer: Math.max(bytes.length * 2, 8 * 1024 * 1024),
        });
        unchanged = bytes.equals(previous);
      } catch { /* New files receive no baseline exemption. */ }
      if (!unchanged) fail('private source content is present in a tracked file.');
      preExistingSharedFragments += hits.length;
    }
  }
  const ignore = readFileSync(join(repo, '.vercelignore'), 'utf8');
  for (const path of ['private/**', 'outputs/**', 'work/**', 'tmp/**'])
    if (!ignore.split(/\r?\n/).includes(path)) fail('deployment exclusions do not cover private files.');
  return { trackedFiles: names.length, ignoredPaths: paths.length, preExistingSharedFragments };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const repo = fileURLToPath(new URL('..', import.meta.url));
  const files = [
    process.env.PRIVATE_DNGNGEN_PACK ?? 'private/dngngen/pack.json',
    process.env.PRIVATE_SCVM_PACK ?? 'private/scvmbirther/pack.json',
    'private/scvmbirther/ko.json',
    process.env.PRIVATE_MONSTER_PACK ?? 'private/monster-site/pack.json',
  ].map((path) => resolve(repo, path));
  let packs = [];
  let canaries = [];
  for (const file of files) {
    if (!existsSync(file)) continue;
    const raw = readFileSync(file, 'utf8');
    try { packs.push(JSON.parse(raw)); }
    catch {
      // Invalid input must not prevent CORE startup. Still detect accidental verbatim embedding.
      if (raw.length >= 32) canaries.push(raw);
    }
  }
  const directory = process.argv.slice(2).find((value) => !value.startsWith('--')) ?? 'dist';
  const build = checkPrivateBuild(resolve(repo, directory), { packs, canaries });
  // Vercel's uploaded build context need not contain a Git checkout. The explicit
  // local privacy command checks Git in addition to the mandatory artifact scan.
  const git = process.argv.includes('--git') ? checkPrivateGit(repo, packs) : undefined;
  console.log(`Private pack boundary passed (${build.files} built files${git ? `; ${git.trackedFiles} tracked paths; ${git.ignoredPaths} ignored private paths; ${git.preExistingSharedFragments} unchanged shared fragments` : ''}).`);
}
