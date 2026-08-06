import { clean, frozen, unique } from './utilities.js';

export function sourceAttribution(input = {}) {
  return frozen({
    id: clean(input.id || input.sourceId, 190),
    name: clean(input.name || input.source || 'Source', 240),
    url: clean(input.url, 2000),
    publishedAt: input.publishedAt || input.time || null,
    accessedAt: input.accessedAt || new Date().toISOString(),
    reliability: Number.isFinite(Number(input.reliability)) ? Number(input.reliability) : null,
    sourceType: clean(input.sourceType || input.type || 'REFERENCE', 80).toUpperCase(),
    claims: unique(input.claims || [], 500)
  });
}

export function sourceLedger(sources = []) {
  const byId = new Map();
  for (const source of sources) {
    const record = sourceAttribution(source);
    if (record.id) byId.set(record.id, record);
  }
  return Object.freeze([...byId.values()]);
}
