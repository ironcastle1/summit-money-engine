import { freshnessState } from './time.js';
export function normalizeSourceStatus(value = {}, fallbackId = 'unknown') {
  const id = String(value.id || value.sourceId || fallbackId);
  const updatedAt = value.updatedAt || value.timestamp || null;
  const configured = value.configured !== false && !value.error;
  return Object.freeze({
    id,
    state: !configured ? 'UNAVAILABLE' : updatedAt ? freshnessState(updatedAt, { freshMs: value.freshMs, staleMs: value.staleMs }) : value.stale ? 'STALE' : 'UNKNOWN',
    configured,
    stale: Boolean(value.stale),
    cached: Boolean(value.cache && value.cache !== 'MISS'),
    updatedAt,
    error: value.error ? String(value.error) : null
  });
}
export function aggregateSourceStatus(groups = {}) {
  const sources = [];
  for (const [group, values] of Object.entries(groups)) {
    const rows = Array.isArray(values) ? values : Object.values(values || {});
    for (const value of rows) sources.push(Object.freeze({ group, ...normalizeSourceStatus(value, `${group}:unknown`) }));
  }
  const counts = sources.reduce((output, source) => { output[source.state] = (output[source.state] || 0) + 1; return output; }, {});
  return Object.freeze({ sources: Object.freeze(sources), counts: Object.freeze(counts), healthy: sources.filter(source => ['FRESH', 'UNKNOWN'].includes(source.state)).length, unavailable: sources.filter(source => source.state === 'UNAVAILABLE').length });
}
