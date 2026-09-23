import { readFile } from 'node:fs/promises';
import type { ScvmPack } from '../src/domain/scvmPack.js';

/** A local companion file bound to a specific verified English snapshot. */
export async function readPrivateScvmTranslation(
  path: string,
  pack: ScvmPack,
): Promise<Record<string, string> | undefined> {
  try {
    const value: unknown = JSON.parse(await readFile(path, 'utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
    const source = value as Record<string, unknown>;
    if (source.format !== 'reference-desk.scvmbirther-ko' ||
        source.version !== 1 ||
        source.sourceSha256 !== pack.integrity.payloadSha256 ||
        !source.messages || typeof source.messages !== 'object' ||
        Array.isArray(source.messages)) return undefined;
    const entries = Object.entries(source.messages);
    if (entries.some(([key, text]) => !Object.hasOwn(pack.messages, key) || typeof text !== 'string'))
      return undefined;
    return Object.fromEntries(entries) as Record<string, string>;
  } catch {
    return undefined;
  }
}
