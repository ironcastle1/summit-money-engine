import {
  access,
  readdir,
  readFile
}
from 'node:fs/promises';
import path from 'node:path';
import {
  fileURLToPath
}
from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const required=['src/country-risk/profile-builder.js',
'src/services/country-risk-platform-service.js',
'src/api/register-country-risk-routes.js',
'public/country-risk/bootstrap.js',
'public/css/country-risk-v20.css',
'tests/part10/platform.test.js'];
for(const rel of required)await access(path.join(root,rel));
const server=(await readdir(path.join(root,'src/country-risk'))).filter(name=>name.endsWith('.js'));
const browser=(await readdir(path.join(root,'public/country-risk'))).filter(name=>name.endsWith('.js'));
if(server.length<45)throw new Error(`Expected at least 45 country-risk modules, found ${server.length}`);
if(browser.length<9)throw new Error(`Expected at least 9 browser modules, found ${browser.length}`);
const app=await readFile(path.join(root,'src/app/create-application.js'),'utf8');
if(!app.includes('registerCountryRiskRoutes'))throw new Error('Country risk routes not registered');
console.log(JSON.stringify({
  ok:true,serverModules:server.length,browserModules:browser.length
},null,2));
