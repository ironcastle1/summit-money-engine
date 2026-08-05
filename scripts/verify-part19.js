import { access, readFile } from 'node:fs/promises';
import { PUBLIC_SOURCE_CATALOG } from '../src/live-data/public-source-catalog.js';
import { ACCESS_CLASSES } from '../src/live-data/constants.js';

const requiredFiles = [
  'src/live-data/live-data-platform.js',
  'src/live-data/source-runner.js',
  'src/live-data/snapshot-store.js',
  'src/services/live-data-platform-service.js',
  'src/api/register-live-data-routes.js',
  'public/live-data/controller.js',
  'public/live-data/source-table.js',
  'public/css/live-data-v20.css',
  'tests/part19/platform.test.js',
  'tests/part19/routes.test.js',
  'docs/PART-19-LIVE-DATA.md'
];

for (const file of requiredFiles) await access(file);

const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
if (packageJson.version !== '20.19.0') {
  throw new Error('package version must be 20.19.0');
}
if (!packageJson.scripts?.['test:part19'] || !packageJson.scripts?.['release:part19']) {
  throw new Error('Part 19 test and release scripts are required');
}

const keylessRequired = PUBLIC_SOURCE_CATALOG.filter(
  source => source.access === ACCESS_CLASSES.PUBLIC_KEYLESS && source.required
);
if (keylessRequired.length < 15) {
  throw new Error(`Expected at least 15 required keyless sources; found ${keylessRequired.length}`);
}

const ids = new Set();
for (const source of PUBLIC_SOURCE_CATALOG) {
  if (ids.has(source.id)) throw new Error(`Duplicate source id: ${source.id}`);
  ids.add(source.id);
  if (!source.attribution || !source.licence) {
    throw new Error(`Source ${source.id} requires attribution and licence metadata`);
  }
}

const reliefWeb = PUBLIC_SOURCE_CATALOG.find(source => source.id === 'reliefweb');
if (!reliefWeb || reliefWeb.required || reliefWeb.access !== ACCESS_CLASSES.PUBLIC_REGISTRATION) {
  throw new Error('ReliefWeb must remain an optional pre-approved application source');
}

const globalAis = PUBLIC_SOURCE_CATALOG.find(source => source.id === 'global-ais');
if (!globalAis || globalAis.required || globalAis.access !== ACCESS_CLASSES.COMMERCIAL_LICENSE) {
  throw new Error('Global AIS must remain an optional licensed enhancement');
}

const configSource = await readFile('src/config/load-config.js', 'utf8');
if (/reliefWebAppName\s*=\s*[^;]*['"]merlin['"]/i.test(configSource)) {
  throw new Error('ReliefWeb must not ship with an unapproved default app name');
}
if (!configSource.includes("optionalString(env.RELIEFWEB_APP_NAME, '')")) {
  throw new Error('ReliefWeb app name must default to blank');
}

const routeSource = await readFile('src/api/register-live-data-routes.js', 'utf8');
for (const endpoint of [
  '/api/live-data/catalog',
  '/api/live-data/status',
  '/api/live-data/diagnostics',
  '/api/live-data/source',
  '/api/live-data/refresh',
  '/api/live-data/export'
]) {
  if (!routeSource.includes(endpoint)) throw new Error(`Missing live-data endpoint: ${endpoint}`);
}

const html = await readFile('public/index.html', 'utf8');
if (!html.includes('data-view="live-data"')) throw new Error('Live Data workspace is missing');
if (!html.includes('live-data-v20.css')) throw new Error('Live Data stylesheet is missing');

const applicationSource = await readFile('src/app/create-application.js', 'utf8');
if (!applicationSource.includes('createLiveDataPlatformService')) {
  throw new Error('Live-data platform is not integrated into application startup');
}

console.log(JSON.stringify({
  ok: true,
  version: packageJson.version,
  requiredFiles: requiredFiles.length,
  cataloguedSources: PUBLIC_SOURCE_CATALOG.length,
  requiredKeylessSources: keylessRequired.length,
  optionalSources: PUBLIC_SOURCE_CATALOG.length - keylessRequired.length,
  reliefWebDefault: 'BLANK',
  globalAisMode: 'OPTIONAL_COMMERCIAL_LICENSE'
}, null, 2));
