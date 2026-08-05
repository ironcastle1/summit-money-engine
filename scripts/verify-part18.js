import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { releaseEngineeringCatalog, finalAcceptance } from '../src/release-engineering/index.js';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = releaseEngineeringCatalog();
assert.equal(catalog.parts, 18);
assert.equal(catalog.version, '20.18.0');
const index = await readFile(path.join(root, 'public/index.html'), 'utf8');
assert.match(index, /data-view="release"/);
assert.match(index, /release-v20\.css/);
assert.doesNotMatch(index, /data-view="shipping"/);
const files = [];
async function walk(dir) { for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', '.tmp', 'runtime-data'].includes(entry.name))
        continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory())
        await walk(full);
    else
        files.push(full);
} }
await walk(path.join(root, 'src', 'release-engineering'));
assert.ok(files.length >= 50);
const result = finalAcceptance({ partsDelivered: 18, maximumPartFiles: 99, sourceLines: 50000, passedTests: 1, failedTests: 0, syntaxFailures: 0, syntaxChecks: 1, securityScanPassed: true, archiveIntegrity: true, fabricatedLiveData: false });
assert.equal(result.accepted, true);
console.log(JSON.stringify({ status: 'PASS', domainModules: files.length, catalog: catalog.platform }, null, 2));
