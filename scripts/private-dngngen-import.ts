import { fileURLToPath } from 'node:url';
import { importLocalDngngenFile, DngngenImportError } from '../server/importDngngenSnapshot.ts';
try {
  if (process.argv.length !== 3) throw new DngngenImportError('supply-one-local-snapshot-file');
  console.log(JSON.stringify(await importLocalDngngenFile(fileURLToPath(new URL('..', import.meta.url)), process.argv[2]), null, 2));
} catch (error) {
  console.error(error instanceof DngngenImportError ? error.message : 'Local import failed. Check the local input, supported pack grammar and ignored output permissions.');
  if (error instanceof DngngenImportError && error.code === 'missing-english-message-dependencies')
    console.error('This source map omits English JSON messages. Supply one local reference-desk.dngngen-source-snapshot JSON containing sourceMap (original map text), sourceVersion 1.0.0, version 1, and englishMessages (complete local English message dictionary/formatting dependencies). No pack was written.');
  process.exitCode = 1;
}
