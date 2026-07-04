const fs = require('fs'); const path = require('path');
const root = path.join(__dirname, '..');
const exts = new Set(['.js','.css','.html','.md','.json','.yaml']);
let total=0, files=0;
function walk(dir){ for(const n of fs.readdirSync(dir)){ if(n==='node_modules'||n.startsWith('.git')) continue; const p=path.join(dir,n); const st=fs.statSync(p); if(st.isDirectory()) walk(p); else if(exts.has(path.extname(p))){ files++; total += fs.readFileSync(p,'utf8').split(/\r?\n/).length; } } }
walk(root); console.log(JSON.stringify({files,totalLines:total},null,2));
