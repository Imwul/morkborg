/** Explicit one-time acquisition only. Startup, build and tests do not import this. */
import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { dirname, join, relative, resolve } from 'node:path';

export const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');
export class OfficialAcquireError extends Error {
  constructor(code: string) {
    super(code);
    this.name = 'OfficialAcquireError';
  }
}
export function acquireFail(code: string): never {
  throw new OfficialAcquireError(code);
}

export async function fetchOfficial(
  origin: string,
  url: URL,
  limit: number,
): Promise<string> {
  if (url.origin !== origin || url.username || url.password || url.hash || url.search)
    acquireFail('official-origin-required');
  const response = await fetch(url.href, {
    redirect: 'error',
    signal: AbortSignal.timeout(20000),
    credentials: 'omit',
  });
  if (!response.ok || response.redirected || (response.url && response.url !== url.href))
    acquireFail('asset-response');
  if (Number(response.headers.get('content-length') ?? 0) > limit || !response.body)
    acquireFail('asset-size');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > limit) {
        await reader.cancel();
        acquireFail('asset-size');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks).toString('utf8');
}

export function officialScript(page: string, origin: string) {
  const urls = [...page.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g)].map(
    (match) => new URL(match[1], origin),
  );
  const mains = urls.filter((url) => /\/static\/js\/main\.[^/]+\.js$/.test(url.pathname));
  if (mains.length !== 1 || mains[0].origin !== origin) acquireFail('incompatible-deployment-assets');
  return mains[0];
}

/** Writes one ignored pack. Downloaded JavaScript is never executed or retained. */
export async function writeIgnoredPack(root: string, relativePath: string, pack: unknown) {
  if (!relativePath.startsWith('private/') || relativePath.includes('..'))
    acquireFail('private-output-required');
  const base = resolve(root);
  const target = resolve(base, relativePath);
  if (relative(base, target).startsWith('..')) acquireFail('private-output-required');
  try {
    execFileSync('git', ['check-ignore', '--quiet', '--no-index', relativePath], { cwd: base });
  } catch {
    acquireFail('output-must-be-ignored-untracked');
  }
  if (execFileSync('git', ['ls-files', '--', relativePath], { cwd: base, encoding: 'utf8' }).trim())
    acquireFail('tracked-output');
  await mkdir(dirname(target), { recursive: true, mode: 0o700 });
  try {
    if ((await lstat(target)).isSymbolicLink()) acquireFail('output-symlink');
    const backup = join(dirname(target), `pack.previous-${Date.now()}.json`);
    await rename(target, backup);
  } catch (error) {
    if (!(error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT'))
      throw error;
  }
  await writeFile(target, JSON.stringify(pack), { mode: 0o600 });
  const written = await readFile(target, 'utf8');
  if (written !== JSON.stringify(pack)) acquireFail('pack-write');
  return target;
}
