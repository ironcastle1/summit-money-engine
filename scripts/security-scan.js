import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const excluded = new Set(['.git', 'node_modules', 'runtime-data', '.tmp']);
const textExtensions = new Set(['.js', '.json', '.html', '.css', '.md', '.yml', '.yaml', '.toml', '.example', '.txt']);
const patterns = [
  { id: 'private-key', pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { id: 'github-token', pattern: /gh[pousr]_[A-Za-z0-9_]{30,}/ },
  { id: 'stripe-secret', pattern: /sk_(?:live|test)_[A-Za-z0-9]{20,}/ },
  { id: 'aws-access-key', pattern: /AKIA[0-9A-Z]{16}/ },
  { id: 'jwt', pattern: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}/ }
];

async function walk(directory) {
  const output = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (excluded.has(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await walk(full));
    else if (textExtensions.has(path.extname(entry.name)) || entry.name.startsWith('.env')) output.push(full);
  }
  return output;
}

const findings = [];
for (const file of await walk(root)) {
  if (path.relative(root, file) === 'scripts/security-scan.js') continue;
  const content = await readFile(file, 'utf8');
  for (const rule of patterns) if (rule.pattern.test(content)) findings.push({ rule: rule.id, file: path.relative(root, file) });
}
if (findings.length) {
  for (const finding of findings) console.error(`SECRET ${finding.rule} ${finding.file}`);
  process.exitCode = 1;
} else console.log('Security scan: no embedded high-confidence secrets found.');
