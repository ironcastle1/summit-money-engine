import {
  readdir, readFile, stat
}
from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd();
const required=['src/hazards/hazard-platform.js', 'src/api/register-hazard-routes.js', 'src/services/hazard-platform-service.js', 'public/hazards/bootstrap.js', 'public/css/hazards-v20.css', 'tests/part08/platform.test.js'];
for(const file of required) {
  const info=await stat(path.join(root, file));
  if(!info.isFile())throw new Error(`Missing ${file}`);
}
const app=await readFile(path.join(root, 'src/app/create-application.js'), 'utf8');
if(!app.includes('registerHazardRoutes'))throw new Error('Hazard routes are not registered');
const html=await readFile(path.join(root, 'public/index.html'), 'utf8');
if(!html.includes('hazards-v20.css'))throw new Error('Hazard stylesheet is not linked');
const modules=await readdir(path.join(root, 'src/hazards'));
if(modules.length<35)throw new Error('Hazard platform is incomplete');
console.log(JSON.stringify( {
  part:'08', hazardModules:modules.length, status:'PASS'
}, null, 2));
