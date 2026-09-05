import fs from 'node:fs';
import path from 'node:path';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const root=fs.realpathSync(process.argv[2]??process.cwd());
const destination=process.argv[3];
process.chdir(root);
const {build}=await import(root+'/node_modules/vite/dist/node/index.js');
const {default:react}=await import(root+'/node_modules/@vitejs/plugin-react/dist/index.js');
const {default:tailwindcss}=await import(root+'/node_modules/@tailwindcss/postcss/dist/index.mjs');
const normalizeId=(id)=>id.startsWith(root+'/')?id.slice(root.length+1):id.includes('/node_modules/')?'node_modules/'+id.split('/node_modules/').at(-1):id.startsWith('\0')?id.slice(1):path.basename(id);
const digestSource=()=>{const hash=createHash('sha256');for(const name of ['src','components','lib'])for(const f of fs.readdirSync(name,{recursive:true}).filter(f=>/\.(tsx?|css)$/.test(f)).sort()){hash.update(name+'/'+f);hash.update(fs.readFileSync(name+'/'+f));}return hash.digest('hex');};
const sourceFingerprint=digestSource();
const chunks=[],styles=[];
const output=await build({root,configFile:false,logLevel:'error',plugins:[react()],resolve:{alias:{'@':root}},css:{postcss:{plugins:[tailwindcss()]}},build:{write:false,reportCompressedSize:false}});
for(const c of output.output){const fileName=c.fileName;if(c.type==='chunk')chunks.push({fileName,isEntry:c.isEntry,bytes:Buffer.byteLength(c.code),gzipBytes:gzipSync(c.code).length,imports:c.imports,dynamicImports:c.dynamicImports,modules:Object.entries(c.modules).map(([id,m])=>({id:normalizeId(id),renderedLength:m.renderedLength}))});else if(fileName.endsWith('.css'))styles.push({fileName,bytes:Buffer.byteLength(c.source),gzipBytes:gzipSync(c.source).length});}
if(sourceFingerprint!==digestSource())throw new Error('Source changed during measurement; rerun.');
const initial=new Set(chunks.filter(c=>c.isEntry).map(c=>c.fileName));
for(let previous=-1;previous!==initial.size;){previous=initial.size;for(const c of chunks)if(initial.has(c.fileName))for(const i of c.imports)initial.add(i);}
const cssFiles=fs.readdirSync('src').filter(f=>f.endsWith('.css')).sort().map(file=>{const s=fs.readFileSync('src/'+file,'utf8');return {file:'src/'+file,lines:s.split('\n').length-1,bytes:Buffer.byteLength(s),importantCount:(s.match(/!important/g)??[]).length};});
const optional=['Chronicle','PlayMode','MythicPanel','Characters','Monsters','Dungeons','ContentLibrary','Oracles','QuickCapture','Sources','CampaignProcedures','ObjectPlayTools'];
const result={sourceFingerprint,main:chunks.filter(c=>c.isEntry).map(({fileName,bytes,gzipBytes})=>({fileName,bytes,gzipBytes})),initialStatic:{chunkCount:initial.size,bytes:chunks.filter(c=>initial.has(c.fileName)).reduce((n,c)=>n+c.bytes,0),gzipBytes:chunks.filter(c=>initial.has(c.fileName)).reduce((n,c)=>n+c.gzipBytes,0),files:[...initial].sort()},compiledCss:styles,sourceCss:{files:cssFiles,totalLines:cssFiles.reduce((n,f)=>n+f.lines,0),totalBytes:cssFiles.reduce((n,f)=>n+f.bytes,0),importantCount:cssFiles.reduce((n,f)=>n+f.importantCount,0)},optionalScreensInInitialClosure:chunks.filter(c=>initial.has(c.fileName)).flatMap(c=>c.modules.filter(m=>optional.some(name=>m.id==='src/components/'+name+'.tsx')).map(m=>m.id))};
fs.writeFileSync(destination,JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
