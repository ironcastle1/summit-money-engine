import { access, readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
const root = process.cwd();
const required = ['src/automation-workflows/index.js', 'src/services/automation-platform-service.js', 'src/api/register-automation-routes.js', 'public/automation/controller.js', 'public/css/automation-v20.css', 'tests/part13/platform.test.js'];
for (const file of required)
    await access(path.join(root, file));
const modules = (await readdir(path.join(root, 'src/automation-workflows'))).filter(file => file.endsWith('.js'));
if (modules.length < 50)
    throw new Error(`Expected at least 50 automation modules, found ${modules.length}`);
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
if (!packageJson.scripts['test:part13'])
    throw new Error('Part 13 test script missing');
const index = await readFile(path.join(root, 'public/index.html'), 'utf8');
if (!index.includes('data-view="automation"'))
    throw new Error('Automation workspace navigation missing');
const files = [];
async function walk(directory) { for (const name of await readdir(directory)) {
    const full = path.join(directory, name);
    const info = await stat(full);
    if (info.isDirectory())
        await walk(full);
    else
        files.push(path.relative(root, full));
} }
await walk(path.join(root, 'src/automation-workflows'));
console.log(JSON.stringify({ status: 'PASS', automationModules: modules.length, verifiedFiles: files.length }, null, 2));
