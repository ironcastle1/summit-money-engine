import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const required = [
  'src/market-intelligence/asset-analyzer.js',
  'src/market-intelligence/snapshot-builder.js',
  'src/market-intelligence/screener-engine.js',
  'src/market-intelligence/event-market-linker.js',
  'src/market-intelligence/scenario-engine.js',
  'src/services/market-intelligence-platform-service.js',
  'src/api/register-market-intelligence-routes.js',
  'public/market-intelligence/bootstrap.js',
  'public/market-intelligence/market-intelligence-controller.js',
  'public/css/market-intelligence-v20.css',
  'tests/part09/platform.test.js'
];
for (const file of required) {
  const info = await stat(path.join(root, file));
  if (!info.isFile()) throw new Error(`Missing Part 09 file: ${file}`);
}
const modules = (await readdir(path.join(root, 'src/market-intelligence'))).filter(file => file.endsWith('.js'));
if (modules.length < 50) throw new Error(`Market intelligence platform has only ${modules.length} server modules`);
const browserModules = (await readdir(path.join(root, 'public/market-intelligence'))).filter(file => file.endsWith('.js'));
if (browserModules.length < 10) throw new Error(`Market intelligence client has only ${browserModules.length} modules`);
const app = await readFile(path.join(root, 'src/app/create-application.js'), 'utf8');
if (!app.includes('registerMarketIntelligenceRoutes')) throw new Error('Part 09 routes are not registered');
if (!app.includes('createMarketIntelligencePlatformService')) throw new Error('Part 09 service is not created');
const client = await readFile(path.join(root, 'public/merlin.js'), 'utf8');
if (!client.includes('installMarketIntelligenceSystem')) throw new Error('Part 09 client is not installed');
const html = await readFile(path.join(root, 'public/index.html'), 'utf8');
if (!html.includes('market-intelligence-v20.css')) throw new Error('Part 09 stylesheet is not linked');
const routeSource = await readFile(path.join(root, 'src/api/register-market-intelligence-routes.js'), 'utf8');
for (const endpoint of ['snapshot', 'screen', 'screens', 'watchlist', 'alerts', 'portfolio', 'scenario', 'sensitivity', 'export']) {
  if (!routeSource.includes(`/api/market-intelligence/${endpoint}`)) throw new Error(`Missing endpoint: ${endpoint}`);
}
console.log(JSON.stringify({
  part: '09',
  marketModules: modules.length,
  browserModules: browserModules.length,
  status: 'PASS'
}, null, 2));
