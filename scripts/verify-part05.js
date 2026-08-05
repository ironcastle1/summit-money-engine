import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'src/geospatial/world-clamp.js',
  'src/geospatial/viewport.js',
  'src/geospatial/spatial-index.js',
  'src/geospatial/layer-catalog.js',
  'src/services/map-platform-service.js',
  'src/services/map-feature-service.js',
  'src/services/map-search-service.js',
  'src/services/saved-map-view-service.js',
  'src/api/register-map-platform-routes.js',
  'public/map-v20/map-engine.js',
  'public/map-v20/viewport-model.js',
  'public/map-v20/label-renderer.js',
  'public/map/merlin-tile-map.js',
  'public/css/map-v20.css',
  'tests/part05/ui-contract.test.js'
];

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else files.push(fullPath);
  }
  return files;
}

const failures = [];
for (const relativePath of required) {
  try { await access(path.join(root, relativePath)); }
  catch { failures.push(`Missing required file: ${relativePath}`); }
}

const serverModules = (await walk(path.join(root, 'src/geospatial'))).filter(file => file.endsWith('.js'));
const browserModules = (await walk(path.join(root, 'public/map-v20'))).filter(file => file.endsWith('.js'));
const partTests = (await walk(path.join(root, 'tests/part05'))).filter(file => file.endsWith('.js'));
const integrationFiles = [
  path.join(root, 'src/services/map-feature-service.js'),
  path.join(root, 'src/services/map-search-service.js'),
  path.join(root, 'src/services/map-style-service.js'),
  path.join(root, 'src/services/saved-map-view-service.js'),
  path.join(root, 'src/services/map-diagnostics-service.js'),
  path.join(root, 'src/services/map-platform-service.js'),
  path.join(root, 'src/api/register-map-platform-routes.js'),
  path.join(root, 'src/app/create-application.js'),
  path.join(root, 'src/services/user-data-service.js'),
  path.join(root, 'src/repositories/user-data-repository.js'),
  path.join(root, 'public/map/merlin-tile-map.js'),
  path.join(root, 'public/merlin.js'),
  path.join(root, 'tests/integration/application.test.js')
];
const javascriptFiles = [...serverModules, ...browserModules, ...partTests, ...integrationFiles];

for (const file of javascriptFiles) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) failures.push(`Syntax failure: ${path.relative(root, file)}\n${result.stderr}`);
}

if (serverModules.length < 36) failures.push(`Expected at least 36 integrated server geospatial modules, found ${serverModules.length}`);
if (browserModules.length < 29) failures.push(`Expected at least 29 browser map modules, found ${browserModules.length}`);
if (partTests.length < 12) failures.push(`Expected at least 12 Part 05 test files, found ${partTests.length}`);

const application = await readFile(path.join(root, 'src/app/create-application.js'), 'utf8');
for (const token of ['new MapFeatureService', 'new MapSearchService', 'new MapPlatformService', 'new SavedMapViewService', 'registerMapPlatformRoutes(router, services)']) {
  if (!application.includes(token)) failures.push(`Application integration missing: ${token}`);
}

const routes = await readFile(path.join(root, 'src/api/register-map-platform-routes.js'), 'utf8');
for (const endpoint of ['/api/map/platform', '/api/map/layers', '/api/map/search', '/api/map/features/:layerId', '/api/map/saved-views']) {
  if (!routes.includes(endpoint)) failures.push(`Missing map endpoint: ${endpoint}`);
}

const index = await readFile(path.join(root, 'public/index.html'), 'utf8');
if (!index.includes('id="map-search-toggle"')) failures.push('Compact search toggle is absent');
if (index.includes('data-view="shipping"')) failures.push('Standalone Shipping navigation remains present');
if (!index.includes('Major earthquakes')) failures.push('Major-earthquake label is absent');
if (!index.includes('English / local labels')) failures.push('Bilingual-label control is absent');
if (!index.includes('type="module" src="/merlin.js?v=20.0.0"')) failures.push('V20 module client is not loaded');

const mapEngine = await readFile(path.join(root, 'public/map-v20/map-engine.js'), 'utf8');
for (const token of ['materialEarthquake', 'magnitude >= 6', 'BOUNDED WORLD', 'nameLocal', 'ResizeObserver']) {
  if (!mapEngine.includes(token)) failures.push(`Map engine contract missing: ${token}`);
}

const worldBoundary = await readFile(path.join(root, 'public/map-v20/world-boundary.js'), 'utf8');
if (!worldBoundary.includes('minimumZoomForSize')) failures.push('Viewport-size minimum zoom is absent');
if (!worldBoundary.includes('clampViewport')) failures.push('World clamping is absent');

const css = await readFile(path.join(root, 'public/css/map-v20.css'), 'utf8');
if (!/\.map-search\s*\{[\s\S]*width:\s*50px/.test(css)) failures.push('Closed search is not compact');
if (!/\.map-drawer \.drawer-content[\s\S]*overflow-y:\s*auto/.test(css)) failures.push('Map drawer scrolling is absent');
if (!css.includes('.merlin-v20-label-local')) failures.push('Local-language label styling is absent');

let physicalLines = 0;
let nonBlankLines = 0;
for (const file of [...javascriptFiles, path.join(root, 'public/css/map-v20.css'), path.join(root, 'public/index.html'), path.join(root, 'package.json')]) {
  const lines = (await readFile(file, 'utf8')).split(/\r?\n/);
  physicalLines += lines.length;
  nonBlankLines += lines.filter(line => line.trim()).length;
}
if (physicalLines < 3_500) failures.push(`Part 05 implementation unexpectedly small: ${physicalLines} physical lines`);

if (failures.length) {
  console.error('PART 05 VERIFICATION FAILED');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`PART 05 VERIFICATION PASSED: ${serverModules.length} server modules, ${browserModules.length} browser modules, ${partTests.length} dedicated test files, ${javascriptFiles.length} JavaScript files, ${physicalLines} physical lines, ${nonBlankLines} non-blank lines checked`);
