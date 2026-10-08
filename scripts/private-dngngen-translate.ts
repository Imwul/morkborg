import { readFile, writeFile, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readPrivateDngngenPack } from '../server/privateDngngenPack.ts';
import { parseDngngenMessage } from '../server/importDngngenSnapshot.ts';
import {
  parseDngngenTranslations,
  type DngngenTemplatePart,
} from '../src/domain/dngngenPack.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const input = process.argv[process.argv.indexOf('--input') + 1];
if (!process.argv.includes('--input') || !input)
  throw new Error('Use --input with a local Korean template JSON file.');
const source = await readPrivateDngngenPack(
  resolve(root, 'private/dngngen/pack.json'),
);
if (source.status !== 'ready')
  throw new Error('A verified local DNGNGEN pack is required.');
const raw: unknown = JSON.parse(await readFile(resolve(input), 'utf8'));
if (!raw || typeof raw !== 'object' || Array.isArray(raw))
  throw new Error('Korean template input must be an object.');
const templates = raw as Record<string, unknown>;
const entries = [
  ...Object.values(source.pack.pools).flat(),
  ...Object.values(source.pack.features ?? {}).flat(),
];
const messages: Record<string, readonly DngngenTemplatePart[]> = {};
for (const key of Object.keys(source.pack.messages)) {
  if (typeof templates[key] !== 'string' || !templates[key].trim())
    throw new Error('Korean templates must cover every source message.');
  messages[key] = parseDngngenMessage(templates[key], {
    auditedFormatting: true,
    entry: entries.find((entry) => entry.messageId === key),
  });
}
const validated = parseDngngenTranslations(source.pack, messages);
const output = resolve(root, 'private/dngngen/ko.json');
await writeFile(
  `${output}.tmp`,
  JSON.stringify(
    {
      format: 'reference-desk.dngngen-ko',
      version: 1,
      sourceSha256: source.pack.integrity.payloadSha256,
      messages: validated,
    },
    null,
    2,
  ) + '\n',
  { mode: 0o600 },
);
await rename(`${output}.tmp`, output);
console.log(
  `Korean DNGNGEN helpers validated (${Object.keys(validated).length} messages).`,
);
