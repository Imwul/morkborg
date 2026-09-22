/** Explicit one-time acquisition only. No application/build/startup imports this module. */
import ts from 'typescript';
import { createHash, randomUUID } from 'node:crypto';
import { readFile, writeFile, mkdir, lstat, realpath } from 'node:fs/promises';
import { resolve, relative, dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { AUDITED_MAP_SHA256, DngngenImportError, extractDngngenPools, importDngngenSnapshot } from './importDngngenSnapshot.js';

export const DNGNGEN_ORIGIN = 'https://dngngen.makedatanotlore.dev';
export const AUDITED_MAIN_SHA256 = 'c433fc85cf8211cb68b4ee6a318a5a99a5f0bf378d3fdc2ec6898ff1aaca9c8b';
const sha = (value: string) => createHash('sha256').update(value).digest('hex');
const fail = (code: string): never => { throw new DngngenImportError(code); };
export function officialDngngenUrl(input: string): URL {
  const url = new URL(input);
  if (url.origin !== DNGNGEN_ORIGIN || url.username || url.password || url.hash || url.search) fail('official-origin-required');
  return url;
}
export type AcquisitionFetch = (url: string, options: RequestInit) => Promise<Response>;
export async function fetchOfficialDngngenAsset(url: URL, limit: number, fetcher: AcquisitionFetch) {
  officialDngngenUrl(url.href);
  const response = await fetcher(url.href, { redirect: 'error', signal: AbortSignal.timeout(20000), credentials: 'omit' });
  if (!response.ok || response.redirected || (response.url && response.url !== url.href)) fail('asset-response');
  if (Number(response.headers.get('content-length') ?? 0) > limit || !response.body) return fail('asset-size');
  const reader = response.body.getReader(); let length = 0; const chunks: Uint8Array[] = [];
  try {
    while (true) { const { done, value } = await reader.read(); if (done) break; length += value.length; if (length > limit) { await reader.cancel(); fail('asset-size'); } chunks.push(value); }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks).toString('utf8');
}
/** Parse literal JSON only; never evaluate downloaded JavaScript or unrelated dictionaries. */
export function extractRoomMessages(bundle: string, requiredIds: readonly string[]) {
  const file = ts.createSourceFile('official-main.js', bundle, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  if ((file as ts.SourceFile & { parseDiagnostics: readonly unknown[] }).parseDiagnostics.length) fail('asset-syntax');
  const candidates: Record<string, string>[] = [];
  let version: string | undefined;
  function visit(node: ts.Node) {
    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression) &&
        ts.isIdentifier(node.expression.expression) && node.expression.expression.text === 'JSON' && node.expression.name.text === 'parse' &&
        node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0])) {
      const serialized = node.arguments[0].text;
      // Unrelated dictionaries are neither parsed nor retained.
      if (serialized.includes('room.details.') || serialized.includes('"app.version"')) {
        let parsed: unknown; try { parsed = JSON.parse(serialized); } catch { return fail('asset-json'); }
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          const record = parsed as Record<string, unknown>;
          if (typeof record['app.version'] === 'string') {
            version=record['app.version'].match(/^v(\d+\.\d+\.\d+)\b/)?.[1];
          }
          if (Object.keys(record).some(key => key.startsWith('room.details.'))) {
            if (!Object.values(record).every(value => typeof value === 'string')) fail('room-message-shape');
            candidates.push(record as Record<string, string>);
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(file);
  if (version !== '1.0.0') fail('incompatible-deployment-version');
  if (candidates.length !== 1) fail('ambiguous-room-message-module');
  const result: Record<string, string> = Object.create(null);
  for (const id of requiredIds) {
    if (!Object.hasOwn(candidates[0], id)) fail('missing-message-dependency');
    result[id] = candidates[0][id];
  }
  return result;
}

/** Testable transport boundary. Audited checksums are never configurable by the CLI. */
export async function acquireRoomSnapshot(mapText: string, fetcher: AcquisitionFetch = fetch) {
  if (sha(mapText) !== AUDITED_MAP_SHA256) fail('unsupported-source-snapshot');
  const map = JSON.parse(mapText);
  if (map.file !== 'static/js/main.76dfbfd0.chunk.js') fail('incompatible-asset-graph');
  const en = map.sourcesContent[map.sources.indexOf('translations/en_US/index.ts')];
  if (typeof en !== 'string' || !en.includes("import rooms from './dungeon/rooms.json'")) fail('missing-room-import-evidence');
  const pools = extractDngngenPools(map.sourcesContent[map.sources.indexOf('roll/Room/tables/index.tsx')]);
  const requiredIds = Object.values(pools).flat().map(entry => entry.messageId);
  const pageUrl = officialDngngenUrl(DNGNGEN_ORIGIN + '/');
  const page = await fetchOfficialDngngenAsset(pageUrl, 200_000, fetcher);
  const scripts = [...page.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g)].map(match => new URL(match[1], pageUrl));
  const assetUrl = officialDngngenUrl(new URL(map.file, pageUrl).href);
  if (scripts.filter(url => url.href === assetUrl.href).length !== 1) fail('incompatible-deployment-assets');
  const main = await fetchOfficialDngngenAsset(assetUrl, 2_000_000, fetcher);
  if (sha(main) !== AUDITED_MAIN_SHA256) fail('incompatible-deployment-checksum');
  const englishMessages = extractRoomMessages(main, requiredIds);
  const envelope = { format: 'reference-desk.dngngen-source-snapshot', version: 1, sourceVersion: '1.0.0', sourceMap: mapText, englishMessages };
  // Prove complete closure/format compatibility before writing any source output.
  const imported = importDngngenSnapshot(Buffer.from(JSON.stringify(envelope)));
  return { envelope, manifest: {
    sourceVersion: '1.0.0', sourceMapSha256: sha(mapText),
    assets: [{url:pageUrl.href,sha256:sha(page)},{url:assetUrl.href,sha256:sha(main)}],
    acquiredMessages: Object.keys(englishMessages).length, resolvedDependencies: imported.dependencyCount,
    unresolvedDependencies: 0, poolCounts: imported.pack.integrity.poolCounts,
    totalPositions: imported.totalPositions, uniqueIds: imported.uniqueIds, variableEntries: imported.variableEntries,
    payloadSha256: imported.pack.integrity.payloadSha256,
  } };
}
export async function savePrivateAcquisition(root: string, relativeDirectory: string, envelope: unknown, manifest: unknown) {
  const base = await realpath(root), dir = resolve(base, relativeDirectory), rel = relative(base, dir);
  if (!rel.startsWith('private/')) fail('private-output-required');
  let path = base;
  for (const segment of rel.split('/')) {
    path = join(path, segment);
    try { if ((await lstat(path)).isSymbolicLink()) fail('output-symlink'); }
    catch (e) { if (!(e && typeof e === 'object' && 'code' in e && e.code === 'ENOENT')) throw e; }
  }
  const target = join(dir, 'source-snapshot.json');
  try {
    for (const name of ['source-snapshot.json','acquisition.json']) {
      const output = relative(base, join(dir, name));
      execFileSync('git', ['check-ignore', '--quiet', '--no-index', output], {cwd:base});
      if (execFileSync('git', ['ls-files', '--', output], {cwd:base,encoding:'utf8'}).trim()) fail('tracked-output');
      try { if ((await lstat(join(dir,name))).isSymbolicLink()) fail('output-symlink'); }
      catch (e) { if (!(e && typeof e === 'object' && 'code' in e && e.code === 'ENOENT')) throw e; }
    }
  } catch { fail('output-must-be-ignored-untracked'); }
  await mkdir(dirname(dir), {recursive:true,mode:0o700});
  // Every acquisition gets its own directory; no previous audit is overwritten.
  await mkdir(dir, {mode:0o700});
  await writeFile(target, JSON.stringify(envelope), {flag:'wx',mode:0o600});
  await writeFile(join(dir,'acquisition.json'), JSON.stringify(manifest,null,2)+'\n',{flag:'wx',mode:0o600});
  return target;
}
export async function acquireLocalDngngen(root: string) {
  const mapText = await readFile(resolve(root,'outputs/dngngen-source-map.json'),'utf8');
  const {envelope,manifest} = await acquireRoomSnapshot(mapText);
  const target = await savePrivateAcquisition(root,`private/dngngen/acquisitions/${randomUUID()}`,envelope,manifest);
  return {input:target,manifest};
}
