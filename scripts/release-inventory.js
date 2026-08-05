import { readdir, stat, readFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rows = [];
async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        if (['node_modules', '.git', '.tmp', 'runtime-data', 'coverage'].includes(entry.name))
            continue;
        const full = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            await walk(full);
            continue;
        }
        const relative = path.relative(root, full).split(path.sep).join('/');
        const body = await readFile(full);
        rows.push({
            path: relative,
            bytes: (await stat(full)).size,
            sha256: createHash('sha256').update(body).digest('hex')
        });
    }
}
await walk(root);
rows.sort((left, right) => left.path.localeCompare(right.path));
process.stdout.write(`${JSON.stringify({ generatedAt: new Date().toISOString(), files: rows.length, artifacts: rows }, null, 2)}\n`);
