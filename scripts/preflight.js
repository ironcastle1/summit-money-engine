import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const roots=['server.js','src','public','scripts'];
const files=roots.flatMap(root=>fs.existsSync(root)?(fs.statSync(root).isDirectory()?walk(root):[root]):[]).filter(f=>f.endsWith('.js'));
let failed=false;

for(const file of files){
  try{execFileSync(process.execPath,['--check',file],{stdio:'pipe'});}catch(e){failed=true;console.error(`Syntax check failed: ${file}`);console.error(e.stderr?.toString()||e.message);}
}

const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const declared=new Set([...Object.keys(pkg.dependencies||{}),...Object.keys(pkg.devDependencies||{})]);
const builtins=new Set(['assert','buffer','child_process','crypto','events','fs','http','https','os','path','stream','test','url','util','zlib']);
const external=new Set();
const importPattern=/(?:from\s*|import\s*)['"]([^'"]+)['"]/g;
for(const file of files){
  const text=fs.readFileSync(file,'utf8');let m;
  while((m=importPattern.exec(text))){
    const spec=m[1];
    if(spec.startsWith('.')||spec.startsWith('/')||spec.startsWith('node:'))continue;
    const name=spec.startsWith('@')?spec.split('/').slice(0,2).join('/'):spec.split('/')[0];
    if(!builtins.has(name))external.add(name);
  }
}
for(const name of external){if(!declared.has(name)){failed=true;console.error(`Missing package.json dependency: ${name}`);}}

const required=['server.js','package.json','render.yaml','public/index.html','public/app.js','public/image-dxf.js','src/dxf/analyse.js','src/dxf/resize.js','src/dxf/r12-writer.js','src/routes/index.js','src/market/research.js','src/outreach/outreach-service.js','src/products/product-service.js'];
for(const f of required){if(!fs.existsSync(f)){failed=true;console.error(`Required repository file missing: ${f}`);}}

if(failed)process.exit(1);
console.log(`Syntax OK: ${files.length} JavaScript files`);
console.log(`External dependencies declared: ${[...external].sort().join(', ')}`);
console.log(`Required repository files present: ${required.length}`);

function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{const p=path.join(dir,entry.name);return entry.isDirectory()?walk(p):[p];});}
