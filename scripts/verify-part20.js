import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { DEVICE_MATRIX, THEMES } from '../src/market-readiness/catalog.js';

const requiredFiles = [
  'src/services/market-readiness-platform-service.js',
  'src/api/register-market-readiness-routes.js',
  'src/market-readiness/release-gate.js',
  'public/readiness/bootstrap.js',
  'public/readiness/controller.js',
  'public/css/readiness-v20.css',
  'scripts/browser-e2e-part20.py',
  'scripts/run-browser-e2e-part20.py',
  'scripts/build-merlin-browser-bundle.py',
  'scripts/import-graph-audit-part20.js',
  'tests/part20/api.test.js',
  'tests/part20/client-contract.test.js',
  'docs/PART-20-MARKET-READINESS.md',
  'docs/part20-browser-evidence/report.json'
];
for (const file of requiredFiles) await access(file);

const packageJson = JSON.parse(await readFile('package.json', 'utf8'));
if (packageJson.version !== '20.20.0') throw new Error('package version must be 20.20.0');
for (const script of ['test:part20', 'verify:part20', 'browser:part20', 'release:part20']) {
  if (!packageJson.scripts?.[script]) throw new Error(`Missing package script: ${script}`);
}
if (DEVICE_MATRIX.length !== 6 || !DEVICE_MATRIX.every(device => device.required)) throw new Error('Six required viewport profiles are required');
if (THEMES.length !== 6) throw new Error('Exactly six whole-product themes are required');

const html = await readFile('public/index.html', 'utf8');
for (const token of ['skip-link', 'mobile-nav-toggle', 'theme-select', 'help-button', 'readiness-v20.css', 'merlin.js?v=20.20.0']) {
  if (!html.includes(token)) throw new Error(`Missing Part 20 client token: ${token}`);
}
if (/data-view=["']shipping["']/i.test(html)) throw new Error('Shipping must remain map-only');

const client = await readFile('public/merlin.js', 'utf8');
if (!client.includes('installMarketReadinessSystem')) throw new Error('Market-readiness system is not installed');
if (!client.includes('function isMaterialEvent')) throw new Error('Client material-event gate is missing');
if (/STARTING CAPITAL/i.test(client)) throw new Error('Starting-capital display must remain removed');

const report = JSON.parse(await readFile('docs/part20-browser-evidence/report.json', 'utf8'));
if (report.renderedViewports !== 6 || report.results?.length !== 6) throw new Error('Browser evidence must cover all six viewports');
if (report.failed?.length) throw new Error(`Browser acceptance failures: ${report.failed.join(', ')}`);
for (const result of report.results) {
  const failed = Object.entries(result.checks || {}).filter(([, value]) => !value).map(([name]) => name);
  if (failed.length) throw new Error(`${result.name} failed: ${failed.join(', ')}`);
}
const evidenceFiles = await readdir('docs/part20-browser-evidence');
if (evidenceFiles.filter(name => name.endsWith('.png')).length !== 6) throw new Error('Six rendered screenshots are required');

const audit = spawnSync(process.execPath, ['scripts/import-graph-audit-part20.js'], { encoding: 'utf8' });
if (audit.status !== 0) throw new Error(audit.stderr || audit.stdout || 'Part 20 import graph audit failed');

console.log(JSON.stringify({
  ok: true,
  version: packageJson.version,
  requiredFiles: requiredFiles.length,
  viewports: report.renderedViewports,
  screenshots: 6,
  browserFailures: report.failed.length,
  themes: THEMES.length,
  importAudit: JSON.parse(audit.stdout)
}, null, 2));
