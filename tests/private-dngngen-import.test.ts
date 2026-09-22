import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, writeFile, readFile, mkdir, symlink, rm, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { importDngngenSnapshot, localSnapshotPath, writeImportedPack, parseDngngenMessage } from '../server/importDngngenSnapshot.ts';
import { syntheticDngngenSnapshot } from './fixtures/dngngenSourceSnapshot.ts';
import { dngngenPackPayload } from '../src/domain/dngngenPack.ts';
import { readPrivateDngngenPack } from '../server/privateDngngenPack.ts';
import { rollDngngenRoom, dngngenRoomPools } from '../src/generators/dngngen.ts';
const bytes = (value: unknown) => Buffer.from(JSON.stringify(value));
const fixture = () => syntheticDngngenSnapshot();
const run = (input = fixture()) => importDngngenSnapshot(bytes(input), { synthetic:true });
function sourceEdit(from: string, to: string) { const f=fixture(); const m=JSON.parse(f.sourceMap);m.sourcesContent[0]=m.sourcesContent[0].replace(from,to);f.sourceMap=JSON.stringify(m);return f; }

test('offline importer extracts four ordered pools without storing AB/CD', () => {
  const { pack,totalPositions,variableEntries,uniqueIds }=run();
  assert.deepEqual(Object.keys(pack.pools),['A','B','C','D']);
  assert.deepEqual(pack.integrity.poolCounts,{A:4,B:4,C:4,D:4});
  assert.equal(totalPositions,16);assert.equal(uniqueIds,16);assert.equal(variableEntries,12);
  assert.deepEqual(dngngenRoomPools(pack,4)[0].map(e=>e.id),[...pack.pools.A,...pack.pools.B].map(e=>e.id));
});
test('importer preserves integer recipe bounds',()=>assert.deepEqual(run().pack.pools.A[1].values[0].recipe,{op:'int',min:2,max:5}));
test('importer preserves sample list order',()=>assert.deepEqual(run().pack.pools.A[3].values[0].recipe,{op:'sample',values:['TEST-RED','TEST-BLUE']}));
test('importer preserves independent sums and literal offset with exact draw order',()=>{
  const {pack}=run();let calls=0;const stream=[0.51,0,0.999,0];
  const room=rollDngngenRoom(pack,1,[],()=>stream[calls++]);
  assert.equal(calls,4);assert.equal(room.components[0].values.count,9);assert.equal(room.components[1].entryId,'B-ONE');
});
test('importer resolves referenced and value-selected message closure only',()=>{
  const {pack,dependencyCount}=run();assert.equal(dependencyCount,19);assert.ok(pack.messages['TEST-PREFIX']);assert.ok(pack.messages['TEST-BLUE']);assert.equal(pack.messages.UNUSED,undefined);
  let i=0;const seq=[0.99,0.99,0];assert.equal(rollDngngenRoom(pack,1,[],()=>seq[i++]).components[0].text,'PREFIX BLUE TEST');
});
test('ICU select preserves explicit fallback and nested branch',()=>{
  const p=parseDngngenMessage('{x, select, red{R {n}} other{{y, select, yes{Y} other{N}}}}');
  assert.equal(p[0].type,'select');assert.equal(p[0].type==='select'&&p[0].other[0].type,'select');
});
test('ICU quoted braces and doubled apostrophe remain literal',()=>assert.deepEqual(parseDngngenMessage("'{literal}' don''t"),[{type:'text',text:"{literal} don't"}]));
test('missing ICU fallback is rejected',()=>assert.throws(()=>parseDngngenMessage('{x, select, red{R}}'),/missing-explicit-fallback/));
test('unsupported ICU formatting is rejected, not guessed',()=>assert.throws(()=>parseDngngenMessage('{x, plural, one{X} other{Y}}'),/unsupported-message-format/));
test('unknown HTML formatting is rejected',()=>assert.throws(()=>parseDngngenMessage('<script>TEST</script>'),/unsupported-message-markup/));
test('missing static message dependency is rejected',()=>{const f=fixture();delete f.englishMessages['TEST-PREFIX'];assert.throws(()=>run(f),/missing-message-dependency/);});
test('missing dynamic message dependency is rejected',()=>{const f=fixture();delete f.englishMessages['TEST-BLUE'];assert.throws(()=>run(f),/missing-message-dependency/);});
test('cyclic message dependency is rejected',()=>{const f=fixture();f.englishMessages['TEST-PREFIX']=[{type:'message',id:'TEST-PREFIX'}];assert.throws(()=>run(f),/message-cycle/);});
test('missing English dictionary prevents partial pack output',()=>{const f=fixture();delete (f as Partial<typeof f>).englishMessages;assert.throws(()=>run(f),/missing-english-message-dependencies/);});
test('unsupported source version is rejected',()=>{const f=fixture();f.sourceVersion='2.0.0';assert.throws(()=>run(f),/unsupported-source-version/);});
test('real import refuses unverified source-map bytes',()=>assert.throws(()=>importDngngenSnapshot(bytes(fixture())),/unsupported-source-snapshot/));
test('synthetic mode requires explicit synthetic marker',()=>{const f=fixture();f.synthetic=false;assert.throws(()=>run(f),/synthetic-marker/);});
test('malformed JSON and source syntax fail closed',()=>{
  assert.throws(()=>importDngngenSnapshot(Buffer.from('{')),/malformed-json/);
  assert.throws(()=>run(sourceEdit('export const TableA','export const ?')),/source-syntax/);
});
test('missing pool and changed concatenation order rejected',()=>{
  assert.throws(()=>run(sourceEdit('TableA =','TableZ =')),/unknown-declaration/);
  assert.throws(()=>run(sourceEdit('...TableA.results,...TableB.results','...TableB.results,...TableA.results')),/composed-order/);
});
test('unsupported source calls are never executed',()=>{
  assert.throws(()=>run(sourceEdit('random(2, 5)','process.exit(1)')),/unsupported-literal/);
});
test('automatic checksum matches canonical pack serialization',()=>{const {pack}=run();assert.equal(pack.integrity.payloadSha256,createHash('sha256').update(dngngenPackPayload(pack)).digest('hex'));});
test('input rejects HTTPS/file/data URL and accepts explicit local path',()=>{
  for(const path of ['https://example.invalid/source','file:///tmp/source','data:application/json,{}','//host/source']) assert.throws(()=>localSnapshotPath(path),/local-file-required/);
  assert.ok(localSnapshotPath('private/source.json').endsWith('/private/source.json'));
});
async function temporaryRepo(action:(root:string)=>Promise<void>) {
  const root=await mkdtemp(join(tmpdir(),'dngngen-import-'));
  try{execFileSync('git',['init','-q',root]);await writeFile(join(root,'.gitignore'),'/private/\n');await action(root);}
  finally{await rm(root,{recursive:true,force:true});}
}
test('private output is validated and previous pack safely backed up',async()=>temporaryRepo(async root=>{
  const {pack}=run();const one=await writeImportedPack(root,pack);assert.equal(one.validation,'valid');
  assert.equal((await readPrivateDngngenPack(join(root,one.output),true)).status,'ready');
  const two=await writeImportedPack(root,pack);assert.ok(two.backup);assert.equal(await readFile(join(root,two.backup!),'utf8'),await readFile(join(root,two.output),'utf8'));
}));
test('invalid existing private file is backed up, never discarded',async()=>temporaryRepo(async root=>{
  await mkdir(join(root,'private/dngngen'),{recursive:true});await writeFile(join(root,'private/dngngen/pack.json'),'INVALID TEST DATA');
  const result=await writeImportedPack(root,run().pack);assert.equal(await readFile(join(root,result.backup!),'utf8'),'INVALID TEST DATA');
}));
test('output outside private or through symlink is rejected',async()=>temporaryRepo(async root=>{
  await assert.rejects(writeImportedPack(root,run().pack,'public/pack.json'),/private-output-required/);
  await mkdir(join(root,'private'));await mkdir(join(root,'elsewhere'));await symlink(join(root,'elsewhere'),join(root,'private/link'));
  await assert.rejects(writeImportedPack(root,run().pack,'private/link/pack.json'),/output-symlink/);
  assert.deepEqual(await readdir(join(root,'elsewhere')),[]);
}));
test('unignored output and incorrect checksum rejected',async()=>temporaryRepo(async root=>{
  await writeFile(join(root,'.gitignore'),'');await assert.rejects(writeImportedPack(root,run().pack),/output-must-be-ignored/);
  await writeFile(join(root,'.gitignore'),'/private/\n');const {pack}=run();
  await assert.rejects(writeImportedPack(root,{...pack,integrity:{...pack.integrity,payloadSha256:'0'.repeat(64)}}),/checksum/);
}));
test('startup guidance uses effective runtime port instead of hard-coded recommendation',async()=>{
  const script=await readFile(new URL('../scripts/private-server.ts',import.meta.url),'utf8');
  assert.ok(script.includes('tailscale serve --bg --https=443 http://127.0.0.1:${port}'));
  assert.ok(!script.includes('tailscale serve --bg --https=443 http://127.0.0.1:4174'));
});
