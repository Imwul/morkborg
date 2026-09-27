/** Replay established browser acceptance without seeding browser storage. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
const playwright =
  process.env.PLAYWRIGHT_MODULE ||
  '/Users/imwul/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
process.env.PLAYWRIGHT_MODULE = playwright.startsWith('file:')
  ? playwright
  : pathToFileURL(playwright).href;
const suite = process.env.SUITE || 'dungeon-access';
assert(['dungeon-access', 'dungeon-context', 'combat-context'].includes(suite));
let source = fs.readFileSync(`scripts/check-${suite}-browser.mjs`, 'utf8');
if (suite === 'dungeon-access') {
  const seed = `    await page.evaluate(() => {
      localStorage.setItem('dungeon-audit-sentinel', 'notebook');
      sessionStorage.setItem(
        'morkborg-combat-tool:v1',
        '{"audit":"unchanged"}',
      );
    });`;
  assert(source.includes(seed));
  source = source.replace(seed, '');
  source = source
    .replaceAll(`'{"audit":"unchanged"}',`, 'null,')
    .replace("        'notebook',", '        null,');
} else if (suite === 'combat-context') {
  const seed = `      await page.evaluate(() =>
        localStorage.setItem('campaign-owned-sentinel', 'notebook-untouched'),
      );`;
  assert(source.includes(seed));
  source = source
    .replace(seed, '')
    .replace("        'notebook-untouched',", '        null,');
}
assert(!source.includes('.setItem('), 'No storage injection in browser replay');
await import(
  suite === 'dungeon-context'
    ? new URL('./check-dungeon-context-browser.mjs', import.meta.url).href
    : `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
);
