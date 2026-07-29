const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const exts = new Set(['.js', '.html', '.css', '.md', '.json', '.yaml', '.yml']);
let total = 0;
const rows = [];
function walk(dir){
  for (const item of fs.readdirSync(dir)){
    if (item === 'node_modules' || item === '.git') continue;
    const p = path.join(dir,item);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (exts.has(path.extname(p))){
      const n = fs.readFileSync(p,'utf8').split(/\r?\n/).length;
      total += n; rows.push([n,path.relative(root,p)]);
    }
  }
}
walk(root);
console.log(`${total} total lines`);
for (const [n,p] of rows.sort((a,b)=>b[0]-a[0]).slice(0,30)) console.log(String(n).padStart(6), p);
