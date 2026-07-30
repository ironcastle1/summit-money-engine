import { spawn } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const commands = [
  [process.execPath, ['scripts/validate-env.js']],
  [process.execPath, ['scripts/security-scan.js']],
  [process.execPath, ['scripts/verify-build.js']]
];

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: 'inherit', env: { ...process.env, NODE_ENV: 'test' } });
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`${command} ${args.join(' ')} exited ${code}`)));
  });
}

await Promise.all(['Dockerfile', 'public/manifest.webmanifest', 'public/sw.js', '.github/workflows/ci.yml'].map(file => access(path.join(root, file))));
const manifest = JSON.parse(await readFile(path.join(root, 'public/manifest.webmanifest'), 'utf8'));
if (!manifest.start_url || !Array.isArray(manifest.icons) || !manifest.icons.length) throw new Error('PWA manifest is incomplete');
for (const command of commands) await run(...command);
console.log('Preflight complete.');
