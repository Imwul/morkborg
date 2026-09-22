import { createHash } from 'node:crypto';
import { open } from 'node:fs/promises';
import {
  parseDngngenPack,
  dngngenPackPayload,
  type DngngenPack,
} from '../src/domain/dngngenPack.js';

export type PrivatePackResponse =
  | { status: 'ready'; pack: DngngenPack }
  | { status: 'unavailable'; reason: 'missing' | 'invalid' };

/** The only filesystem input is configured at startup, never from a request. */
export async function readPrivateDngngenPack(
  path: string,
  allowSynthetic = false,
): Promise<PrivatePackResponse> {
  let file;
  try {
    file = await open(path, 'r');
    const info = await file.stat();
    if (!info.isFile() || info.size > 8_000_000)
      return { status: 'unavailable', reason: 'invalid' };
    const pack = parseDngngenPack(JSON.parse(await file.readFile('utf8')), {
      allowSynthetic,
    });
    const checksum = createHash('sha256')
      .update(dngngenPackPayload(pack))
      .digest('hex');
    if (checksum !== pack.integrity.payloadSha256)
      return { status: 'unavailable', reason: 'invalid' };
    return { status: 'ready', pack };
  } catch (error) {
    return {
      status: 'unavailable',
      reason:
        error && typeof error === 'object' && 'code' in error &&
        error.code === 'ENOENT' ? 'missing' : 'invalid',
    };
  } finally {
    await file?.close();
  }
}
