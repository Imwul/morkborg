import { readFile } from 'node:fs/promises';
import {
  parseDngngenTranslations,
  type DngngenPack,
} from '../src/domain/dngngenPack.js';

/** A local Korean companion bound to the exact verified English snapshot. */
export async function readPrivateDngngenTranslation(
  path: string,
  pack: DngngenPack,
) {
  try {
    const value: unknown = JSON.parse(await readFile(path, 'utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) return;
    const source = value as Record<string, unknown>;
    if (
      source.format !== 'reference-desk.dngngen-ko' ||
      source.version !== 1 ||
      source.sourceSha256 !== pack.integrity.payloadSha256
    )
      return;
    return parseDngngenTranslations(pack, source.messages);
  } catch {
    return;
  }
}
