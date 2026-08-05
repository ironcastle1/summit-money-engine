import { readFile, stat } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const MANIFEST = path.join(ROOT, 'PART-01-MANIFEST.txt');
const SOURCE_EXTENSIONS = new Set(['.js', '.mjs', '.cjs', '.css', '.html', '.py', '.yml', '.yaml', '.sh']);
const SECRET_PATTERNS = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /sk_live_[A-Za-z0-9]{20,}/,
  /AKIA[0-9A-Z]{16}/,
  /ghp_[A-Za-z0-9]{30,}/,
  /xox[baprs]-[A-Za-z0-9-]{20,}/
];

function parseManifest(text) {
  return text.split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.includes(':') && !line.startsWith('MERLIN ') && !line.startsWith('Runtime ') && !line.startsWith('UPLOAD:'));
}

function fail(message) {
  process.stderr.write(`PART 01 CHECK FAILED: ${message}\n`);
  process.exitCode = 1;
}

const manifestText = await readFile(MANIFEST, 'utf8');
const files = parseManifest(manifestText);
if (files.length >= 100) fail(`manifest contains ${files.length} files; GitHub browser limit requires fewer than 100`);
if (new Set(files).size !== files.length) fail('manifest contains duplicate paths');

let physicalLines = 0;
let sourceLines = 0;
let checkedJavaScript = 0;
for (const relativePath of files) {
  const absolutePath = path.join(ROOT, relativePath);
  try {
    const metadata = await stat(absolutePath);
    if (!metadata.isFile()) fail(`${relativePath} is not a file`);
  } catch {
    fail(`missing manifest file ${relativePath}`);
    continue;
  }

  const extension = path.extname(relativePath).toLowerCase();
  const text = await readFile(absolutePath, 'utf8').catch(() => '');
  const lines = text ? text.split(/\r?\n/).length : 0;
  physicalLines += lines;
  if (SOURCE_EXTENSIONS.has(extension) || path.basename(relativePath) === 'Dockerfile') sourceLines += lines;

  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(text)) fail(`possible committed secret detected in ${relativePath}`);
  }

  if (extension === '.js' || extension === '.mjs' || extension === '.cjs') {
    const result = spawnSync(process.execPath, ['--check', absolutePath], { encoding: 'utf8' });
    if (result.status !== 0) fail(`syntax check failed for ${relativePath}: ${result.stderr.trim()}`);
    checkedJavaScript += 1;
  }
}

const packageJson = JSON.parse(await readFile(path.join(ROOT, 'package.json'), 'utf8'));
if (packageJson.version !== '20.0.0') fail(`package version is ${packageJson.version}, expected 20.0.0`);
if (packageJson.scripts?.['test:part01'] !== 'node --test tests/part01/*.test.js') fail('test:part01 script is missing or changed');

const configText = await readFile(path.join(ROOT, 'src/config/load-config.js'), 'utf8');
if (!configText.includes("const VERSION = '20.0.0-merlin'")) fail('runtime version is not 20.0.0-merlin');
const opsText = await readFile(path.join(ROOT, 'src/api/register-ops-routes.js'), 'utf8');
if (!opsText.includes("'/api/ops/startup'")) fail('startup diagnostics endpoint is missing');

if (!process.exitCode) {
  process.stdout.write([
    'MERLIN V20 PART 01 VERIFIED',
    `files: ${files.length}`,
    `javascript syntax checks: ${checkedJavaScript}`,
    `source/support lines in package: ${sourceLines}`,
    `all physical lines in package: ${physicalLines}`,
    'secret pattern scan: passed',
    'GitHub browser file limit: passed'
  ].join('\n') + '\n');
}
