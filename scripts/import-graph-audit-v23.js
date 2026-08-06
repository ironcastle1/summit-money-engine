import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const entry = 'public/merlin-v23.js';
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
  try {
    source = await readFile(path.join(root, file), 'utf8');
  } catch {
    missing.push(file);
    return;
  }
  for (const match of source.matchAll(importPattern)) {
    const resolved = resolveImport(file, match[1]);
    if (resolved) await walk(resolved);
  }
}

await walk(entry);
if (missing.length) {
  console.error(`Missing imported modules:\n${missing.join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ ok: true, entry, reachableModules: visited.size }, null, 2));
}
