import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { DNGNGEN_ORIGIN, officialDngngenUrl, fetchOfficialDngngenAsset, extractRoomMessages, acquireRoomSnapshot, savePrivateAcquisition } from '../server/acquireDngngenSnapshot.ts';
import { parseDngngenMessage, importDngngenSnapshot } from '../server/importDngngenSnapshot.ts';
import { syntheticDngngenSnapshot } from './fixtures/dngngenSourceSnapshot.ts';
import { createSyntheticDngngenPack, sealSyntheticDngngenPack } from './fixtures/dngngenSynthetic.ts';
import { parseDngngenPack } from '../src/domain/dngngenPack.ts';
import type { DngngenEntry } from '../src/domain/dngngenPack.ts';
import { rollDngngenRoom } from '../src/generators/dngngen.ts';
import { checkPrivateBuild } from '../scripts/check-private-boundary.mjs';

const bundle = (version='v1.0.0', room: Record<string,string>={'room.details.TEST-A':'INVENTED PRIVATE CANARY A', 'room.details.TEST-B':'INVENTED PRIVATE CANARY B'}) =>
  `const a=JSON.parse(${JSON.stringify(JSON.stringify({'app.version':version}))}); const b=JSON.parse(${JSON.stringify(JSON.stringify(room))}); const c=JSON.parse(${JSON.stringify(JSON.stringify({'unrelated.TEST':'UNRELATED CANARY MUST NOT BE ACQUIRED'}))});`;

test('official-origin guard rejects nonofficial, insecure, credential and redirected URLs',()=>{
  assert.equal(officialDngngenUrl(DNGNGEN_ORIGIN+'/').origin,DNGNGEN_ORIGIN);
  for(const url of ['https://example.invalid/','http://dngngen.makedatanotlore.dev/','https://dngngen.makedatanotlore.dev.example.invalid/','https://user@dngngen.makedatanotlore.dev/','https://dngngen.makedatanotlore.dev/?q=test'])assert.throws(()=>officialDngngenUrl(url),/official-origin/);
});
test('explicit acquisition transport uses bounded official request without redirects or credentials',async()=>{
  let calls=0;
  const output=await fetchOfficialDngngenAsset(new URL(DNGNGEN_ORIGIN+'/'),1000,async(url,options)=>{
    calls++;assert.equal(url,DNGNGEN_ORIGIN+'/');assert.equal(options.redirect,'error');assert.equal(options.credentials,'omit');return new Response('SYNTHETIC HTTP RESPONSE');
  });
  assert.equal(calls,1);assert.equal(output,'SYNTHETIC HTTP RESPONSE');
});
test('unapproved origin is rejected before mock HTTP request',async()=>{
  let calls=0;await assert.rejects(fetchOfficialDngngenAsset(new URL('https://example.invalid/'),100,async()=>{calls++;return new Response('TEST')}),/official-origin/);assert.equal(calls,0);
});
test('oversized or failed HTTP response is rejected',async()=>{
  await assert.rejects(fetchOfficialDngngenAsset(new URL(DNGNGEN_ORIGIN),3,async()=>new Response('TOO LONG')),/asset-size/);
  await assert.rejects(fetchOfficialDngngenAsset(new URL(DNGNGEN_ORIGIN),100,async()=>new Response('NOT FOUND',{status:404})),/asset-response/);
});
test('asset literal parser extracts only required room closure, not unrelated content',()=>{
  const messages=extractRoomMessages(bundle(),['room.details.TEST-B']);
  assert.deepEqual(Object.keys(messages),['room.details.TEST-B']);assert.equal(messages['room.details.TEST-B'],'INVENTED PRIVATE CANARY B');
  assert.ok(!JSON.stringify(messages).includes('UNRELATED CANARY'));
});
test('incompatible deployment version rejected',()=>assert.throws(()=>extractRoomMessages(bundle('v2.0.0'),['room.details.TEST-A']),/incompatible-deployment-version/));
test('missing English dependency fails closed',()=>assert.throws(()=>extractRoomMessages(bundle(),['room.details.MISSING']),/missing-message-dependency/));
test('ambiguous room dictionaries and executable expression rejected',()=>{
  assert.throws(()=>extractRoomMessages(bundle()+bundle(),['room.details.TEST-A']),/ambiguous-room-message-module/);
  assert.throws(()=>extractRoomMessages('JSON.parse(fetch("https://example.invalid"));',[]),/incompatible-deployment-version/);
});
test('unknown source map never triggers acquisition',async()=>{
  let calls=0;await assert.rejects(acquireRoomSnapshot('{}',async()=>{calls++;return new Response('TEST')}),/unsupported-source-snapshot/);assert.equal(calls,0);
});
const entry=(recipe:DngngenEntry['values'][number]['recipe']):DngngenEntry=>({id:'TEST',messageId:'TEST',values:[{name:'n',recipe}]});
test('audited finite select can omit fallback only when all possible source values have cases',()=>{
  const e=entry({op:'sample',values:['red','blue']});
  const parts=parseDngngenMessage('{n, select, red{R} blue{B}}',{auditedFormatting:true,entry:e});
  assert.equal(parts[0].type,'select');assert.deepEqual(parts[0].type==='select'&&parts[0].other,[]);
  assert.throws(()=>parseDngngenMessage('{n, select, red{R}}',{auditedFormatting:true,entry:e}),/missing-explicit-fallback/);
  assert.throws(()=>parseDngngenMessage('{n, select, red{R} blue{B}}'),/missing-explicit-fallback/);
});
test('English plural is compiled over exact integer domain without changing draws',()=>{
  const e=entry({op:'int',min:1,max:4});
  const parts=parseDngngenMessage('{n, plural, one{ONE} other{{n} ITEMS}}',{auditedFormatting:true,entry:e});
  assert.equal(parts[0].type,'select');if(parts[0].type!=='select')throw Error('select expected');
  assert.deepEqual(Object.keys(parts[0].cases),['1','2','3','4']);assert.deepEqual(parts[0].cases['1'],[{type:'text',text:'ONE'}]);
  const base=createSyntheticDngngenPack();const pack=sealSyntheticDngngenPack({...base,pools:{...base.pools,A:[e]},messages:{...base.messages,TEST:parts},integrity:{...base.integrity,poolCounts:{...base.integrity.poolCounts,A:1}}});
  parseDngngenPack(pack,{allowSynthetic:true});let count=0;const room=rollDngngenRoom(pack,1,[],()=>{count++;return 0});
  assert.equal(count,3);assert.equal(room.components[0].text,'ONE');
});
test('source markup keeps visible wording and link destination without executing HTML',()=>{
  const p=parseDngngenMessage('<i>TEST WORD</i> <a href="https://example.invalid/reference" target="_blank">TEST LINK</a>',{auditedFormatting:true});
  assert.deepEqual(p,[{type:'text',text:'TEST WORD TEST LINK (https://example.invalid/reference)'}]);
  assert.throws(()=>parseDngngenMessage('<a href="javascript:alert(1)">X</a>',{auditedFormatting:true}),/unsupported-message-link/);
  assert.throws(()=>parseDngngenMessage('<i onclick="bad()">X</i>',{auditedFormatting:true}),/unsupported-message-markup/);
});
test('source ID plus sign is retained, not renamed or duplicated',()=>{
  const fixture=syntheticDngngenSnapshot();fixture.sourceMap=fixture.sourceMap.replaceAll('A-ONE','A+ONE');fixture.englishMessages['room.details.A+ONE']=fixture.englishMessages['room.details.A-ONE'];delete fixture.englishMessages['room.details.A-ONE'];
  const {pack}=importDngngenSnapshot(Buffer.from(JSON.stringify(fixture)),{synthetic:true});assert.equal(pack.pools.A[0].id,'A+ONE');
});
async function temp(action:(root:string)=>Promise<void>){const root=await mkdtemp(join(tmpdir(),'private-acquire-'));try{execFileSync('git',['init','-q',root]);await writeFile(join(root,'.gitignore'),'/private/\n');await action(root);}finally{await rm(root,{recursive:true,force:true})}}
test('acquisition output is ignored/private and fails for public or symlink destinations',async()=>temp(async root=>{
  const output=await savePrivateAcquisition(root,'private/test/one',{test:'PRIVATE CANARY ONLY'},{count:1});assert.equal(JSON.parse(await readFile(output,'utf8')).test,'PRIVATE CANARY ONLY');
  await assert.rejects(savePrivateAcquisition(root,'public/test',{},{}),/private-output-required/);
  await mkdir(join(root,'elsewhere'));await symlink(join(root,'elsewhere'),join(root,'private','link'));
  await assert.rejects(savePrivateAcquisition(root,'private/link/two',{},{}),/output-symlink/);
}));
test('repeated acquisition never overwrites previous source artifact',async()=>temp(async root=>{
  const output=await savePrivateAcquisition(root,'private/test/one',{test:'FIRST'},{});
  await assert.rejects(savePrivateAcquisition(root,'private/test/one',{test:'SECOND'},{}));assert.equal(JSON.parse(await readFile(output,'utf8')).test,'FIRST');
}));
test('public artifact leak check detects acquired canary content',async()=>temp(async root=>{
  await mkdir(join(root,'dist'));await writeFile(join(root,'dist/index.html'),'PUBLIC APP');
  const pack=createSyntheticDngngenPack();assert.doesNotThrow(()=>checkPrivateBuild(join(root,'dist'),{packs:[pack]}));
  await writeFile(join(root,'dist/leak.js'),JSON.stringify(pack));assert.throws(()=>checkPrivateBuild(join(root,'dist'),{packs:[pack]}),/Private pack boundary check failed/);
}));
test('acquisition is explicit and CLI logs only aggregate manifest, not envelope or source prose',async()=>{
  const pkg=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
  assert.ok(pkg.scripts['private:dngngen:acquire']);for(const key of ['private','build','test','dev'])assert.ok(!pkg.scripts[key].includes('acquire'));
  const startup=await readFile(new URL('../scripts/private-server.ts',import.meta.url),'utf8');assert.ok(!startup.includes('acquireDngngen'));
  const cli=await readFile(new URL('../scripts/private-dngngen-acquire.ts',import.meta.url),'utf8');
  assert.ok(cli.includes('acquisition:acquired.manifest,installed'));assert.ok(!cli.includes('console.log(acquired.envelope'));
});
test('private ID detection distinguishes a pre-existing longer public identifier from a copied private scalar',async()=>temp(async root=>{
  const base=createSyntheticDngngenPack();
  const pack={...base,pools:{...base.pools,A:[{...base.pools.A[0],id:'component'}]}};
  await mkdir(join(root,'dist'));await writeFile(join(root,'dist/index.html'),'PUBLIC APP');
  await writeFile(join(root,'dist/app.js'),'const key="public.components";');
  assert.doesNotThrow(()=>checkPrivateBuild(join(root,'dist'),{packs:[pack]}));
  for(const value of ['"component"',"'component'"]) {
    await writeFile(join(root,'dist/app.js'),`const leaked=${value};`);
    assert.throws(()=>checkPrivateBuild(join(root,'dist'),{packs:[pack]}),/Private pack boundary check failed/);
  }
}));
test('public generator homepages do not mask private pack prose',async()=>temp(async root=>{
  await mkdir(join(root,'dist'));await writeFile(join(root,'dist/index.html'),'PUBLIC APP');
  const urls=['https://dngngen.makedatanotlore.dev/','https://scvmbirther.makedatanotlore.dev','https://monster.makedatanotlore.dev/'];
  const pack={tables:{sources:urls},messages:{secret:'PRIVATE GENERATOR RESULT MUST STAY PRIVATE'}};
  await writeFile(join(root,'dist/app.js'),`const sources=${JSON.stringify(urls)};`);
  assert.doesNotThrow(()=>checkPrivateBuild(join(root,'dist'),{packs:[pack]}));
  await writeFile(join(root,'dist/app.js'),`const leaked='PRIVATE GENERATOR RESULT MUST STAY PRIVATE';`);
  assert.throws(()=>checkPrivateBuild(join(root,'dist'),{packs:[pack]}),/Private pack boundary check failed/);
}));
test('private slug names require a complete identifier match in public artifacts',async()=>temp(async root=>{
  await mkdir(join(root,'dist'));await writeFile(join(root,'dist/index.html'),'PUBLIC APP');
  const pack={tables:{classes:[{name:'private-example-class'}]}};
  await writeFile(join(root,'dist/app.js'),'const existing="character.class:private-example-class";');
  assert.doesNotThrow(()=>checkPrivateBuild(join(root,'dist'),{packs:[pack]}));
  await writeFile(join(root,'dist/app.js'),'const leaked="private-example-class";');
  assert.throws(()=>checkPrivateBuild(join(root,'dist'),{packs:[pack]}),/Private pack boundary check failed/);
  await writeFile(join(root,'dist/app.js'),`const encoded='${Buffer.from('private-example-class').toString('base64')}';`);
  assert.throws(()=>checkPrivateBuild(join(root,'dist'),{packs:[pack]}),/Private pack boundary check failed/);
}));
test('Git privacy accepts unchanged public baseline phrases of any length but rejects changed files',async()=>temp(async root=>{
  const {checkPrivateGit}=await import('../scripts/check-private-boundary.mjs');
  await writeFile(join(root,'.gitignore'),'/private/\n/outputs/\n');
  await writeFile(join(root,'.vercelignore'),'private/**\noutputs/**\nwork/**\ntmp/**\n');
  const sharedLong='SYNTHETIC SHARED PHRASE IN A PREEXISTING PUBLIC AUDIT';
  const publicAudit=`A public note: "component". ${sharedLong}${'x'.repeat(1_100_000)}`;
  await writeFile(join(root,'existing.md'),publicAudit);
  execFileSync('git',['add','.'],{cwd:root});execFileSync('git',['-c','user.name=Synthetic Test','-c','user.email=test@example.invalid','commit','-qm','synthetic baseline'],{cwd:root});
  const base=createSyntheticDngngenPack();const pack={...base,profile:'dngngen-1.0.0',pools:{...base.pools,A:[{...base.pools.A[0],id:'component'}]},messages:{...base.messages,shared:{text:sharedLong}}};
  assert.equal(checkPrivateGit(root,[pack]).preExistingSharedFragments,2);
  await writeFile(join(root,'existing.md'),`${publicAudit} Added private data.`);
  assert.throws(()=>checkPrivateGit(root,[pack]),/Private pack boundary check failed/);
}));
