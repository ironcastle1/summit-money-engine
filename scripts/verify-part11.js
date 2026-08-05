import {
  access,
  readFile,
  readdir
}
from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(new URL('..',
import.meta.url).pathname),
required = ['src/conflict-intelligence/index.js',
'src/services/conflict-intelligence-platform-service.js',
'src/api/register-conflict-intelligence-routes.js',
'public/conflict-intelligence/bootstrap.js',
'public/css/conflict-intelligence-v20.css',
'tests/part11/platform.test.js'];
for (const file of required)
await access(path.join(root,
file));
const modules = (await readdir(path.join(root,
'src/conflict-intelligence'))).filter(file => file.endsWith('.js'));
if (modules.length < 50)
throw new Error(`Expected at least 50 conflict modules, found ${modules.length}`);
const app = await readFile(path.join(root,
'src/app/create-application.js'),
'utf8'),
html = await readFile(path.join(root,
'public/index.html'),
'utf8');
if (!app.includes('registerConflictIntelligenceRoutes'))
throw new Error('Conflict routes are not registered');
if (!html.includes('data-view="conflict"'))
throw new Error('Conflict workspace navigation is missing');
if (html.includes('data-view="shipping"'))
throw new Error('Shipping must remain map-only');
console.log(JSON.stringify({
  ok: true,
  modules: modules.length,
  workspace: 'CONFLICT',
  shipping: 'MAP_ONLY'
},
null,
2));
