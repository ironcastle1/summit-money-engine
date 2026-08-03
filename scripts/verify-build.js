import { access, readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'server.js', 'package.json', 'public/index.html', 'public/merlin-v18.js', 'public/map/merlin-map-engine.js', 'public/css/merlin-v18.css', 'public/data/bootstrap-v18.json',
  'src/app/create-application.js', 'src/sources/source-registry.js', 'src/domain/scoring/radius-analysis.js',
  'src/domain/shipping/network.js', 'src/shipping-sources/registry.js', 'src/services/shipping-intelligence-service.js',
  'public/shipping/controller.js', 'public/css/shipping.css',
  'data/places.json', 'data/routes.json', 'data/ports.json', 'data/chokepoints.json', 'data/shipping-commodities.json',
  'src/api/register-account-routes.js', 'src/services/auth-service.js', 'src/services/subscription-service.js',
  'src/infra/persistence/json-document-store.js', 'src/security/password-hasher.js', 'src/billing/provider-registry.js',
  'public/account/controller.js', 'public/account/cloud-sync.js', 'public/admin/controller.js', 'public/css/account.css',
  'src/observability/metrics-registry.js', 'src/observability/runtime-sampler.js', 'src/quality/data-quality-service.js',
  'src/api/register-ops-routes.js', 'public/ops/controller.js', 'public/css/ops.css', 'public/css/mobile.css',
  'public/manifest.webmanifest', 'public/sw.js', 'public/offline.html', 'public/assets/world-base.svg', 'public/assets/merlin-logo-master.png', 'public/assets/merlin-logo-inverted.png', 'public/icons/merlin-192.png', 'public/icons/merlin-512.png', 'public/css/premium.css', 'public/css/motion.css',
  'public/experience/preferences.js', 'public/experience/sound-library.js', 'public/experience/sound-engine.js',
  'public/experience/command-registry.js', 'public/experience/command-palette.js', 'public/experience/experience-controller.js',
  'src/services/map-tile-service.js', 'src/services/fred-market-service.js', 'src/sources/nws-alerts-source.js',
  'src/sources/uk-flood-source.js', 'src/sources/reliefweb-disaster-source.js', 'src/shipping-sources/ndbc-source.js',
  'scripts/browser-smoke.py', 'Dockerfile', '.github/workflows/ci.yml'
];

for (const relative of required) await access(path.join(root, relative));

async function javascriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const output = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await javascriptFiles(full));
    else if (entry.name.endsWith('.js')) output.push(full);
  }
  return output;
}


async function verifyInterface() {
  const htmlPath = path.join(root, 'public/index.html');
  const html = await readFile(htmlPath, 'utf8');
  const ids = [...html.matchAll(/\bid=["']([^"']+)["']/g)].map(match => match[1]);
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];
  if (duplicates.length) throw new Error(`Duplicate HTML IDs: ${duplicates.join(', ')}`);

  const assetPaths = [...html.matchAll(/\b(?:src|href)=["'](\/[^"'#?]+)["']/g)]
    .map(match => match[1])
    .filter(value => !value.startsWith('//'));
  for (const assetPath of [...new Set(assetPaths)]) await access(path.join(root, 'public', assetPath.slice(1)));
  if (!html.includes('/merlin-v18.js') || !html.includes('/map/merlin-map-engine.js')) throw new Error('V18 browser entry points are missing');
  if (!html.includes('/assets/merlin-logo-inverted.png')) throw new Error('Exact inverted Merlin logo is not installed');
  const bootstrap = JSON.parse(await readFile(path.join(root, 'public/data/bootstrap-v18.json'), 'utf8'));
  if (!Array.isArray(bootstrap.events) || bootstrap.events.length < 2_000) throw new Error('Bootstrap event coverage is incomplete');
  if ((bootstrap.shipping?.ports?.length || 0) < 70 || (bootstrap.shipping?.routes?.length || 0) < 15) throw new Error('Bootstrap shipping coverage is incomplete');
  if ((bootstrap.intelligenceCatalog?.countries?.length || 0) < 225 || (bootstrap.intelligenceCatalog?.cities?.length || 0) < 240) throw new Error('Bootstrap place coverage is incomplete');
  if ((bootstrap.markets?.results?.length || 0) < 8 || (bootstrap.opportunities?.opportunities?.length || 0) < 40) throw new Error('Bootstrap market/opportunity coverage is incomplete');
  const logo = await readFile(path.join(root, 'public/assets/merlin-logo-master.png'));
  const logoHash = createHash('sha256').update(logo).digest('hex');
  if (logoHash !== '4daa09b7bb5ff4e9511fb0c60b4795b282fa69b81fabc15d320973b733dad55b') throw new Error('Approved Merlin logo artwork was modified');
  console.log(`Verified ${ids.length} HTML IDs, ${new Set(assetPaths).size} local entry assets and ${bootstrap.events.length} bootstrap events.`);
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`)));
  });
}

await verifyInterface();
const files = await javascriptFiles(root);
for (const file of files) await run(process.execPath, ['--check', file]);
console.log(`Verified ${files.length} JavaScript files.`);
