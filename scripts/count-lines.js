const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const skip = new Set(['node_modules','.git']);
let total = 0;
function walk(dir){
  for(const item of fs.readdirSync(dir)){
    if(skip.has(item)) continue;
    const p = path.join(dir,item);
    const st = fs.statSync(p);
    if(st.isDirectory()) walk(p);
    else if(/\.(js|css|html|md|json|yaml|bat)$/.test(item)){
      const lines = fs.readFileSync(p,'utf8').split('\n').length;
      total += lines;
      console.log(String(lines).padStart(5), path.relative(root,p));
    }
  }
}
walk(root);
console.log('TOTAL', total);
