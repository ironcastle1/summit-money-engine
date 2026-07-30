import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ignoredDirectories = new Set(['.git', 'node_modules', 'coverage', 'runtime-data', '.tmp']);
const extensions = new Set(['.js', '.mjs', '.cjs', '.html', '.css', '.json', '.md', '.txt', '.yml', '.yaml']);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(fullPath));
    else if (extensions.has(path.extname(entry.name).toLowerCase())) files.push(fullPath);
  }
  return files;
}

function category(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  if (extension === '.js' || extension === '.mjs' || extension === '.cjs') return 'JavaScript';
  if (extension === '.css') return 'CSS';
  if (extension === '.html') return 'HTML';
  if (extension === '.json') return 'JSON';
  return 'Documentation';
}

const files = await walk(root);
const totals = new Map();
let grandTotal = 0;
let nonBlankTotal = 0;
for (const file of files) {
  const content = await readFile(file, 'utf8');
  const lines = content === '' ? 0 : content.split(/\r?\n/).length;
  const nonBlank = content.split(/\r?\n/).filter(line => line.trim()).length;
  const key = category(file);
  const value = totals.get(key) || { files: 0, lines: 0, nonBlank: 0 };
  value.files += 1;
  value.lines += lines;
  value.nonBlank += nonBlank;
  totals.set(key, value);
  grandTotal += lines;
  nonBlankTotal += nonBlank;
}

console.log('SUMMIT MONEY MAP LINE COUNT');
console.log('-----------------------------------------------');
for (const [key, value] of [...totals.entries()].sort((a, b) => b[1].lines - a[1].lines)) {
  console.log(`${key.padEnd(16)} ${String(value.files).padStart(3)} files  ${String(value.lines).padStart(6)} lines  ${String(value.nonBlank).padStart(6)} non-blank`);
}
console.log('-----------------------------------------------');
console.log(`TOTAL            ${String(files.length).padStart(3)} files  ${String(grandTotal).padStart(6)} lines  ${String(nonBlankTotal).padStart(6)} non-blank`);
