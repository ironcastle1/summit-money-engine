import { deepGet, frozen, unique } from './utilities.js';

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function deletePath(target, path) {
  const segments = String(path || '').split('.').filter(Boolean);
  if (!segments.length) return;
  let current = target;
  for (let index = 0; index < segments.length - 1; index += 1) {
    current = current?.[segments[index]];
    if (!current || typeof current !== 'object') return;
  }
  delete current[segments.at(-1)];
}

export function redactPublication(value, paths = []) {
  const output = clone(value);
  for (const path of unique(paths, 500)) deletePath(output, path);
  return output;
}

export function redactionReport(before, after, paths = []) {
  return frozen({ paths: unique(paths, 500), removed: unique(paths, 500).filter(path => deepGet(before, path) !== undefined && deepGet(after, path) === undefined) });
}
