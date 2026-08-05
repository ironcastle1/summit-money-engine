import { readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const MANIFEST = path.join(ROOT, 'PART-02-MANIFEST.txt');
const JAVASCRIPT_EXTENSIONS = new Set(['.js', '.mjs', '.cjs']);
const SECRET_PATTERNS = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /sk_live_[A-Za-z0-9]{20,}/,
  /AKIA[0-9A-Z]{16}/,
  /ghp_[A-Za-z0-9]{30,}/,
  /xox[baprs]-[A-Za-z0-9-]{20,}/
];

function parseManifest(text) {
  const marker = 'FILES\n';
  const index = text.indexOf(marker);
  if (index < 0) throw new Error('Manifest FILES marker is missing');
  return text.slice(index + marker.length)
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
}

function fail(message) {
  process.stderr.write(`PART 02 CHECK FAILED: ${message}\n`);
  process.exitCode = 1;
}

const manifestText = await readFile(MANIFEST, 'utf8');
const files = parseManifest(manifestText);
if (files.length >= 100) fail(`manifest contains ${files.length} files; it must remain below 100`);
if (new Set(files).size !== files.length) fail('manifest contains duplicate paths');

let physicalLines = 0;
let sourceLines = 0;
let javascriptChecks = 0;
for (const relativePath of files) {
  const absolutePath = path.join(ROOT, relativePath);
  try {
    const metadata = await stat(absolutePath);
    if (!metadata.isFile()) fail(`${relativePath} is not a regular file`);
  } catch {
    fail(`missing manifest file ${relativePath}`);
    continue;
  }

  const text = await readFile(absolutePath, 'utf8').catch(() => '');
  const lineCount = text ? text.split(/\r?\n/).length : 0;
  physicalLines += lineCount;
  if (JAVASCRIPT_EXTENSIONS.has(path.extname(relativePath).toLowerCase())) sourceLines += lineCount;

  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(text)) fail(`possible committed secret detected in ${relativePath}`);
  }

  if (JAVASCRIPT_EXTENSIONS.has(path.extname(relativePath).toLowerCase())) {
    const syntax = spawnSync(process.execPath, ['--check', absolutePath], { encoding: 'utf8' });
    if (syntax.status !== 0) fail(`syntax check failed for ${relativePath}: ${syntax.stderr.trim()}`);
    javascriptChecks += 1;
  }
}

const requiredEndpoints = [
  '/api/auth/session',
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/account/password',
  '/api/billing/plans',
  '/api/billing/checkout',
  '/api/billing/webhooks/:provider',
  '/api/user-data/:bucket',
  '/api/admin/metrics'
];
const accountRoutes = await readFile(path.join(ROOT, 'src/api/register-account-routes.js'), 'utf8');
for (const endpoint of requiredEndpoints) {
  if (!accountRoutes.includes(endpoint)) fail(`required endpoint is missing: ${endpoint}`);
}

const authService = await readFile(path.join(ROOT, 'src/services/auth-service.js'), 'utf8');
for (const property of ['LOCK_AFTER', 'csrfHash', 'passwordHashNeedsUpgrade', 'revokeUser']) {
  if (!authService.includes(property)) fail(`authentication control is missing: ${property}`);
}

const packageJson = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'));
if (packageJson.version !== '20.0.0') fail(`package version is ${packageJson.version}, expected 20.0.0`);
if (!packageJson.scripts?.['test:part02']) fail('test:part02 script is missing');
if (!packageJson.scripts?.['verify:part02']) fail('verify:part02 script is missing');

if (!process.exitCode) {
  process.stdout.write([
    'MERLIN V20 PART 02 VERIFIED',
    `files: ${files.length}`,
    `javascript syntax checks: ${javascriptChecks}`,
    `javascript lines in package: ${sourceLines}`,
    `all physical lines in package: ${physicalLines}`,
    'account endpoint contract: passed',
    'authentication control scan: passed',
    'secret pattern scan: passed',
    'GitHub browser file limit: passed'
  ].join('\n') + '\n');
}
