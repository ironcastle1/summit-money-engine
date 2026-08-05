import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'src/ingestion/ingestion-platform.js',
  'src/ingestion/ingestion-orchestrator.js',
  'src/ingestion/normalization-pipeline.js',
  'src/ingestion/source-health-monitor.js',
  'src/ingestion/provenance.js',
  'src/ingestion/repositories.js',
  'src/api/register-ingestion-routes.js',
  'src/sources/source-registry.js',
  'tests/part03/orchestrator.test.js',
  'docs/release/PART-03-SOURCE-INGESTION.md'
];

async function walk(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await walk(full));
    else output.push(full);
  }
  return output;
}

const failures = [];
for (const relative of required) {
  try { await access(path.join(root, relative)); }
  catch { failures.push(`Missing required file: ${relative}`); }
}

const ingestionFiles = await walk(path.join(root, 'src/ingestion'));
const javascriptFiles = [
  ...ingestionFiles.filter(file => file.endsWith('.js')),
  path.join(root, 'src/api/register-ingestion-routes.js'),
  path.join(root, 'src/sources/source-registry.js'),
  path.join(root, 'src/app/create-application.js')
];
for (const file of javascriptFiles) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) failures.push(`Syntax failure: ${path.relative(root, file)}\n${result.stderr}`);
}

const application = await readFile(path.join(root, 'src/app/create-application.js'), 'utf8');
if (!application.includes('registerIngestionRoutes(router, services)')) failures.push('Ingestion routes are not registered');
if (!application.includes('registry.ingestionPlatform()')) failures.push('Event registry ingestion platform is not exposed');

const routes = await readFile(path.join(root, 'src/api/register-ingestion-routes.js'), 'utf8');
for (const endpoint of ['/api/data-platform/status', '/api/data-platform/provenance', '/api/data-platform/refresh']) {
  if (!routes.includes(endpoint)) failures.push(`Missing data-platform endpoint: ${endpoint}`);
}

let lines = 0;
for (const file of javascriptFiles) lines += (await readFile(file, 'utf8')).split(/\r?\n/).length;
if (lines < 1_200) failures.push(`Part 03 framework unexpectedly small: ${lines} JavaScript lines`);

if (failures.length) {
  console.error('PART 03 VERIFICATION FAILED');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`PART 03 VERIFICATION PASSED: ${javascriptFiles.length} framework files, ${lines} JavaScript lines checked`);
