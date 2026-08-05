import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
const root = process.cwd();
const required = ['src/publishing/index.js', 'src/services/publishing-platform-service.js', 'src/api/register-publishing-routes.js', 'public/publishing/controller.js', 'public/css/publishing-v20.css', 'tests/part14/platform.test.js'];
for (const file of required) await access(path.join(root, file));
const modules = (await readdir(path.join(root, 'src/publishing'))).filter(file => file.endsWith('.js'));
if (modules.length < 50) throw new Error(`Expected at least 50 publishing modules, found ${modules.length}`);
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
if (!packageJson.scripts['test:part14']) throw new Error('Part 14 test script missing');
const index = await readFile(path.join(root, 'public/index.html'), 'utf8');
if (!index.includes('data-view="publishing"')) throw new Error('Publishing workspace navigation missing');
const files = [];
async function walk(directory) { for (const name of await readdir(directory)) { const full = path.join(directory, name); const info = await stat(full); if (info.isDirectory()) await walk(full); else files.push(path.relative(root, full)); } }
await walk(path.join(root, 'src/publishing'));
console.log(JSON.stringify({ status: 'PASS', publishingModules: modules.length, verifiedFiles: files.length }, null, 2));
