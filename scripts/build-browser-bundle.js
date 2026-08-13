import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const order=['public/modules/utils.js','public/modules/state.js','public/modules/api.js','public/modules/map.js','public/modules/map-renderer.js','public/modules/feed.js','public/modules/detail.js','public/modules/workspaces.js','public/app.js'];
let out='';
for(const rel of order){
  let source=fs.readFileSync(path.join(root,rel),'utf8');
  source=source.replace(/^import[^;]+;\s*/gm,'').replace(/\bexport\s+(?=(const|let|var|function|class)\b)/g,'');
  out+=`\n/* ${rel} */\n${source}\n`;
}
const target=process.argv[2]||path.join(root,'browser-output','test-bundle.js');
fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,out);console.log(target);
