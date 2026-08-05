import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const entry = 'public/merlin.js';
const requiredReadiness = [
  'public/readiness/accessibility.js',
  'public/readiness/bootstrap.js',
  'public/readiness/connection-status.js',
  'public/readiness/controller.js',
  'public/readiness/demo-mode.js',
  'public/readiness/error-boundary.js',
  'public/readiness/focus-trap.js',
  'public/readiness/keyboard-shortcuts.js',
  'public/readiness/onboarding.js',
  'public/readiness/performance-monitor.js',
  'public/readiness/preferences.js',
  'public/readiness/responsive-navigation.js',
  'public/readiness/theme-manager.js'
];
const importPattern = /(?:import|export)\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g;
const visited = new Set();
const missing = [];

function resolveImport(from, specifier) {
  if (!specifier.startsWith('.')) return null;
  const candidate = path.normalize(path.join(path.dirname(from), specifier));
  return path.extname(candidate) ? candidate : `${candidate}.js`;
}

async function walk(file) {
  if (visited.has(file)) return;
  visited.add(file);
  let source;
  try { source = await readFile(path.join(root, file), 'utf8'); }
  catch { missing.push(file); return; }
  for (const match of source.matchAll(importPattern)) {
    const resolved = resolveImport(file, match[1]);
    if (resolved) await walk(resolved);
  }
}

await walk(entry);
for (const file of requiredReadiness) await access(file);
const unreachable = requiredReadiness.filter(file => !visited.has(file));
if (missing.length || unreachable.length) {
  if (missing.length) console.error(`Missing imported modules:\n${missing.join('\n')}`);
  if (unreachable.length) console.error(`Unreachable Part 20 modules:\n${unreachable.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ ok: true, entry, reachableModules: visited.size, part20ReadinessModules: requiredReadiness.length }, null, 2));
}
