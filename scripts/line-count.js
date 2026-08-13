import fs from 'node:fs';import path from 'node:path';
const root=process.cwd(),extensions=new Set(['.js','.css','.html','.json','.md','.py','.yml','.yaml','.toml','.svg','.txt']);
const ignore=new Set(['release','browser-output','screenshots-v7','screenshots-v7-http','actual-screenshots','.git','node_modules','runtime','runtime-test']);const rows=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(ignore.has(e.name))continue;const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(extensions.has(path.extname(e.name).toLowerCase())){const n=fs.readFileSync(p,'utf8').split(/\r?\n/).length;rows.push([path.relative(root,p),n]);}}}
walk(root);const groups={application:0,catalogs:0,data:0,tests:0,docs:0,other:0};
for(const [p,n] of rows){if(p.startsWith('public/data/'))groups.data+=n;else if(p.startsWith('src/catalog/'))groups.catalogs+=n;else if(p.startsWith('src/')||p.startsWith('public/'))groups.application+=n;else if(p.startsWith('tests/'))groups.tests+=n;else if(p.startsWith('docs/'))groups.docs+=n;else groups.other+=n;}
console.log(JSON.stringify({files:rows.length,total:rows.reduce((s,r)=>s+r[1],0),groups},null,2));
