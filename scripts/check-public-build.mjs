import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
const forbidden =
  /(?:\.pdf$|^morkborg-private-data\.json$|^private-update-publisher\.json$)/i;
const keyPath = 'outputs/private-update-publisher.json';
const privateKey = existsSync(keyPath)
  ? JSON.parse(readFileSync(keyPath, 'utf8')).key
  : null;
function check(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (
      forbidden.test(entry.name) ||
      (dir === 'dist' && entry.name === 'rules')
    )
      throw new Error(
        'Private plaintext data must not be included in the public build.',
      );
    if (entry.isDirectory()) check(join(dir, entry.name));
    else if (
      privateKey &&
      readFileSync(join(dir, entry.name)).includes(Buffer.from(privateKey))
    )
      throw new Error(
        'The private decryption key must never enter public build output.',
      );
  }
}
if (existsSync('dist')) check('dist');
console.log(
  'Public build contains no private rulebook files or connection keys.',
);
