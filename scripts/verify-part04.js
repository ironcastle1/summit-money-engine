import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'src/intelligence-processing/intelligence-platform.js',
  'src/intelligence-processing/intelligence-pipeline.js',
  'src/intelligence-processing/entity-resolver.js',
  'src/intelligence-processing/claim-extractor.js',
  'src/intelligence-processing/event-clusterer.js',
  'src/intelligence-processing/event-fusion-engine.js',
  'src/intelligence-processing/materiality-policy.js',
  'src/intelligence-processing/earthquake-policy.js',
  'src/intelligence-processing/verification-gap-analyzer.js',
  'src/intelligence-processing/scenario-seed-generator.js',
  'src/api/register-processing-routes.js',
  'tests/part04/platform-api.test.js',
  'docs/release/PART-04-INTELLIGENCE-PROCESSING.md'
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
  try {
    await access(path.join(root, relative));
  } catch {
    failures.push(`Missing required file: ${relative}`);
  }
}

const processingFiles = (await walk(path.join(root, 'src/intelligence-processing'))).filter(file => file.endsWith('.js'));
const testFiles = (await walk(path.join(root, 'tests/part04'))).filter(file => file.endsWith('.js'));
const javascriptFiles = [
  ...processingFiles,
  ...testFiles,
  path.join(root, 'src/api/register-processing-routes.js'),
  path.join(root, 'src/api/register-api-routes.js'),
  path.join(root, 'src/app/create-application.js')
];

for (const file of javascriptFiles) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) failures.push(`Syntax failure: ${path.relative(root, file)}\n${result.stderr}`);
}

const application = await readFile(path.join(root, 'src/app/create-application.js'), 'utf8');
if (!application.includes('new IntelligenceProcessingPlatform')) failures.push('Processing platform is not initialized');
if (!application.includes('registerProcessingRoutes(router, services)')) failures.push('Processing routes are not registered');

const routes = await readFile(path.join(root, 'src/api/register-processing-routes.js'), 'utf8');
for (const endpoint of [
  '/api/intelligence/processing/status',
  '/api/intelligence/processing/run',
  '/api/intelligence/material-events',
  '/api/intelligence/entities/resolve',
  '/api/intelligence/claims/corroborate'
]) {
  if (!routes.includes(endpoint)) failures.push(`Missing processing endpoint: ${endpoint}`);
}

const configRoutes = await readFile(path.join(root, 'src/api/register-api-routes.js'), 'utf8');
for (const capability of ['INTELLIGENCE_PROCESSING', 'ENTITY_RESOLUTION', 'EVENT_FUSION', 'MATERIAL_EVENT_FILTERING']) {
  if (!configRoutes.includes(capability)) failures.push(`Missing capability: ${capability}`);
}

let physicalLines = 0;
let nonBlankLines = 0;
for (const file of javascriptFiles) {
  const lines = (await readFile(file, 'utf8')).split(/\r?\n/);
  physicalLines += lines.length;
  nonBlankLines += lines.filter(line => line.trim()).length;
}
if (processingFiles.length < 60) failures.push(`Expected at least 60 processing modules, found ${processingFiles.length}`);
if (testFiles.length < 16) failures.push(`Expected at least 16 Part 04 test files, found ${testFiles.length}`);
if (physicalLines < 4_000) failures.push(`Part 04 integration unexpectedly small: ${physicalLines} JavaScript lines`);

if (failures.length) {
  console.error('PART 04 VERIFICATION FAILED');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`PART 04 VERIFICATION PASSED: ${processingFiles.length} processing modules, ${testFiles.length} test files, ${javascriptFiles.length} JavaScript files, ${physicalLines} physical lines, ${nonBlankLines} non-blank lines checked`);
