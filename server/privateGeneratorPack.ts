import { createHash } from 'node:crypto';
import { open } from 'node:fs/promises';

export type PrivateGeneratorResponse<T> =
  | { status: 'ready'; pack: T }
  | { status: 'unavailable'; reason: 'missing' | 'invalid' };

/** The path is fixed at startup. Requests cannot choose a file. */
export async function readPrivateGeneratorPack<T extends { integrity: { payloadSha256: string } }>(
  path: string,
  parse: (input: unknown, options: { allowSynthetic?: boolean }) => T,
  payload: (pack: T) => string,
  allowSynthetic = false,
  maxBytes = 8_000_000,
): Promise<PrivateGeneratorResponse<T>> {
  let file;
  try {
    file = await open(path, 'r');
    const info = await file.stat();
    if (!info.isFile() || info.size > maxBytes)
      return { status: 'unavailable', reason: 'invalid' };
    const pack = parse(JSON.parse(await file.readFile('utf8')), { allowSynthetic });
    const checksum = createHash('sha256').update(payload(pack)).digest('hex');
    if (checksum !== pack.integrity.payloadSha256)
      return { status: 'unavailable', reason: 'invalid' };
    return { status: 'ready', pack };
  } catch (error) {
    return {
      status: 'unavailable',
      reason:
        error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT'
          ? 'missing'
          : 'invalid',
    };
  } finally {
    await file?.close();
  }
}
