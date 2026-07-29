const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const files = [];
function walk(dir){
  for (const item of fs.readdirSync(dir)){
    if (item === 'node_modules' || item === '.git') continue;
    const p = path.join(dir,item);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p);
    else if (p.endsWith('.js')) files.push(p);
  }
}
walk(root);
let ok = true;
for (const file of files){
  const res = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (res.status !== 0){
    ok = false;
    console.error(res.stderr || res.stdout);
  }
}
if (!ok) process.exit(1);
console.log(`Checked ${files.length} JS files`);
