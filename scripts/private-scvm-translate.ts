import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { readFile, rename, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatOfficialMessage } from '../src/domain/officialMessage.js';
import { parseScvmPack, scvmPackPayload } from '../src/domain/scvmPack.js';
import { readPrivateScvmTranslation } from '../server/privateScvmTranslation.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const path = resolve(root, 'private/scvmbirther/pack.json');
const output = resolve(root, 'private/scvmbirther/ko.json');
const translator = process.env.TRN_BIN || 'trn';
const placeholders = {
  amount: 87654321,
  hp: 76543210,
  name: 65432109,
  value: 54321098,
  first: 43210987,
  second: 32109876,
};

function translate(text: string): Promise<string> {
  return new Promise((resolveResult, reject) => {
    const child = spawn(translator, ['--from', 'en', '--to', 'ko', '--quality', 'high'], {
      stdio: ['pipe', 'pipe', 'ignore'],
    });
    child.stdin.on('error', reject);
    child.stdin.end(text);
    let result = '';
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (part: string) => { result += part; });
    child.on('error', reject);
    child.on('close', (code) => code === 0 && result.trim()
      ? resolveResult(result.trim())
      : reject(new Error(`local-translation-failed:${code}`)));
  });
}

function prepared(template: string) {
  const text = formatOfficialMessage(template, placeholders).replaceAll('*', '');
  const active = Object.entries(placeholders).filter(([, marker]) => text.includes(String(marker)));
  return { text, active };
}

const diceTokens = (text: string) =>
  JSON.stringify((text.match(/(?:\d+)?[dD]\d+/g) ?? []).map((die) => die.toLowerCase()).sort());

async function main() {
  const pack = parseScvmPack(JSON.parse(await readFile(path, 'utf8')));
  if (createHash('sha256').update(scvmPackPayload(pack)).digest('hex') !== pack.integrity.payloadSha256)
    throw new Error('private-pack-checksum');
  const translated = await readPrivateScvmTranslation(output, pack) ?? {};
  const entries = Object.entries(pack.messages).filter(([key]) => !Object.hasOwn(translated, key));
  let cursor = 0;
  let rejected = 0;
  let completed = 0;
  const workers = Array.from({ length: 6 }, async () => {
    while (cursor < entries.length) {
      const [key, template] = entries[cursor++];
      const { text, active } = prepared(template);
      if (!text.trim()) { translated[key] = ''; continue; }
      let korean = await translate(text);
      if (active.some(([, marker]) => !korean.includes(String(marker)))) {
        rejected += 1;
        continue;
      }
      if (diceTokens(text) !== diceTokens(korean) ||
          (/\beven\s+(?:result|roll|number)s?\b/i.test(text) && !korean.includes('짝수')) ||
          (/\bodd\s+(?:result|roll|number)s?\b/i.test(text) && !korean.includes('홀수'))) {
        rejected += 1;
        continue;
      }
      for (const [name, marker] of active)
        korean = korean.replaceAll(String(marker), `{${name}}`);
      korean = `${text.match(/^\s*/)?.[0] ?? ''}${korean}${text.match(/\s*$/)?.[0] ?? ''}`;
      translated[key] = korean;
      completed += 1;
      if (completed % 50 === 0)
        console.log(JSON.stringify({ completed, pending: entries.length - completed - rejected }));
    }
  });
  const results = await Promise.allSettled(workers);
  const value = {
    format: 'reference-desk.scvmbirther-ko',
    version: 1,
    sourceSha256: pack.integrity.payloadSha256,
    messages: translated,
  };
  await writeFile(`${output}.tmp`, `${JSON.stringify(value)}\n`, { mode: 0o600 });
  await rename(`${output}.tmp`, output);
  if (results.some((result) => result.status === 'rejected'))
    throw new Error('local-translation-incomplete');
  console.log(JSON.stringify({ status: rejected ? 'partial' : 'installed', translated: Object.keys(translated).length, rejected }));
  if (rejected) process.exitCode = 1;
}

void main().catch(() => {
  console.error('Private SCVMBIRTHER translation failed. No source prose logged.');
  process.exitCode = 1;
});
