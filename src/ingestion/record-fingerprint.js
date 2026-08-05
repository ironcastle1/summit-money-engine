import { createHash } from 'node:crypto';

function canonicalize(value) {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map(canonicalize);
  if (typeof value !== 'object') return typeof value === 'string' ? value.trim() : value;
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalize(value[key])]));
}

export function canonicalJson(value) {
  return JSON.stringify(canonicalize(value));
}

export function contentHash(value, algorithm = 'sha256') {
  return createHash(algorithm).update(canonicalJson(value)).digest('hex');
}

export function recordFingerprint(envelope, options = {}) {
  const fields = options.fields || ['sourceId', 'recordType', 'externalId', 'record'];
  const selected = Object.fromEntries(fields.map(field => [field, envelope[field]]));
  return contentHash(selected);
}

export function similarityTokens(record) {
  const text = [record.title, record.summary, record.description, record.country, record.region]
    .filter(Boolean).join(' ').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ');
  return new Set(text.split(/\s+/).filter(token => token.length > 2).slice(0, 500));
}

export function jaccardSimilarity(left, right) {
  const a = left instanceof Set ? left : similarityTokens(left || {});
  const b = right instanceof Set ? right : similarityTokens(right || {});
  if (!a.size && !b.size) return 0;
  let intersection = 0;
  for (const value of a) if (b.has(value)) intersection += 1;
  return intersection / (a.size + b.size - intersection);
}
