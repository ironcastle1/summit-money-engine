import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(new URL('..', import.meta.url).pathname);
const required = ['src/services/reliability-operations-service.js', 'src/api/register-reliability-operations-routes.js', 'public/reliability/bootstrap.js', 'public/css/reliability-v20.css', 'tests/part17/application.test.js'];
for (const rel of required) {
    const info = await stat(path.join(root, rel));
    if (!info.isFile())
        throw new Error(`Missing Part 17 file: ${rel}`);
}
const index = await readFile(path.join(root, 'public/index.html'), 'utf8');
if (!index.includes('data-view="operations"') || !index.includes('20.17.0'))
    throw new Error('Operations workspace or asset version missing');
const modules = await readdir(path.join(root, 'src/reliability-operations'));
if (modules.filter(name => name.endsWith('.js')).length < 55)
    throw new Error('Reliability module count below expected platform scope');
console.log(JSON.stringify({ part: 17, status: 'PASS', modules: modules.length, version: '20.17.0' }));
