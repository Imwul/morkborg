import { fileURLToPath } from 'node:url';
import { acquireLocalDngngen } from '../server/acquireDngngenSnapshot.ts';
import { importLocalDngngenFile, DngngenImportError } from '../server/importDngngenSnapshot.ts';
try {
  if (process.argv.length !== 2) throw new DngngenImportError('acquire-takes-no-url-or-output-override');
  const root = fileURLToPath(new URL('..', import.meta.url));
  const acquired = await acquireLocalDngngen(root);
  const installed = await importLocalDngngenFile(root, acquired.input);
  console.log(JSON.stringify({acquisition:acquired.manifest,installed},null,2));
} catch(error) {
  console.error(error instanceof DngngenImportError ? error.message : 'Private acquisition failed. No source prose logged. Check official-source availability and ignored private output permissions.');
  process.exitCode = 1;
}
