import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const files = [
  'server.js',
  ...walk('src').filter(f => f.endsWith('.js')),
  ...walk('public').filter(f => f.endsWith('.js')),
  ...walk('scripts').filter(f => f.endsWith('.js'))
];
let failed = false;
for (const file of files) {
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
  } catch (e) {
    failed = true;
    console.error(`Syntax check failed: ${file}`);
    console.error(e.stderr?.toString() || e.message);
  }
}
if (failed) process.exit(1);
console.log(`Syntax OK: ${files.length} JavaScript files`);

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const p = `${dir}/${entry.name}`;
    return entry.isDirectory() ? walk(p) : [p];
  });
}
