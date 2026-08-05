import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
const root = process.cwd();
const required = ['src/commercial-operations/index.js', 'src/services/commercial-operations-service.js', 'src/api/register-commercial-operations-routes.js', 'public/commercial/controller.js', 'public/css/commercial-v20.css', 'tests/part15/platform.test.js'];
for (const file of required)
    await access(path.join(root, file));
const modules = (await readdir(path.join(root, 'src/commercial-operations'))).filter(file => file.endsWith('.js'));
if (modules.length < 55)
    throw new Error(`Expected at least 55 commercial modules, found ${modules.length}`);
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
if (!packageJson.scripts['test:part15'])
    throw new Error('Part 15 test script missing');
const index = await readFile(path.join(root, 'public/index.html'), 'utf8');
if (!index.includes('data-view="commercial"'))
    throw new Error('Commercial workspace navigation missing');
const files = [];
async function walk(directory) { for (const name of await readdir(directory)) {
    const full = path.join(directory, name);
    const info = await stat(full);
    if (info.isDirectory())
        await walk(full);
    else
        files.push(path.relative(root, full));
} }
await walk(path.join(root, 'src/commercial-operations'));
console.log(JSON.stringify({ status: 'PASS', commercialModules: modules.length, verifiedFiles: files.length }, null, 2));
